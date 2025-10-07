"""GigChain.io FastAPI Backend - Production-ready API server."""

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import logging
import os
import json
import hashlib
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import existing modules
from contract_ai import full_flow, generate_contract
from agents import chain_agents, AgentInput, get_agent_status
from security.template_security import validate_template_security, SecurityValidationResult
from chat_enhanced import chat_manager

# Import custom exceptions
from exceptions import (
    GigChainBaseException,
    ContractGenerationError,
    ValidationError,
    MissingRequiredFieldError
)

# Import W-CSAP authentication
from auth import (
    WCSAPAuthenticator, 
    get_database, 
    get_current_wallet, 
    get_optional_wallet,
    RateLimitMiddleware,
    SessionCleanupMiddleware
)

# Import Gamification & Negotiation System
from gamification_api import router as gamification_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize resources on startup and cleanup on shutdown."""
    # Startup: Initialize authentication system
    secret_key = os.getenv('W_CSAP_SECRET_KEY', os.urandom(32).hex())
    
    app.state.authenticator = WCSAPAuthenticator(
        secret_key=secret_key,
        challenge_ttl=300,  # 5 minutes
        session_ttl=86400,  # 24 hours
        refresh_ttl=604800  # 7 days
    )
    
    app.state.auth_db = get_database()
    
    logger.info("🔐 W-CSAP Authentication system initialized")
    
    yield
    
    # Shutdown: Cleanup resources if needed
    logger.info("🔒 Shutting down authentication system")

# FastAPI app
app = FastAPI(
    title="GigChain.io API",
    description="AI-powered contract generation for Web3 gig economy",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Include gamification router
app.include_router(gamification_router)

# CORS middleware - Production-ready configuration
# Get allowed origins from environment or use defaults
ALLOWED_ORIGINS = os.getenv(
    'ALLOWED_ORIGINS',
    'http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173'
).split(',')

# In production, restrict to specific origins
if not os.getenv('DEBUG', 'False').lower() == 'true':
    # Production mode - only allow configured origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
        max_age=3600,  # Cache preflight requests for 1 hour
    )
else:
    # Development mode - allow all origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Add W-CSAP authentication middleware
# Note: Middleware currently commented out - needs refactoring to be compatible with FastAPI
# TODO: Implement as BaseHTTPMiddleware or pure ASGI middleware
# app.add_middleware(RateLimitMiddleware)  # Uncomment to enable rate limiting
# app.add_middleware(SessionCleanupMiddleware)  # Uncomment for auto cleanup

# Pydantic models for authentication
class AuthChallengeRequest(BaseModel):
    wallet_address: str = Field(..., min_length=42, max_length=42, description="Wallet address")

class AuthChallengeResponse(BaseModel):
    challenge_id: str
    wallet_address: str
    challenge_message: str
    expires_at: int
    
class AuthVerifyRequest(BaseModel):
    challenge_id: str = Field(..., description="Challenge ID from initiate step")
    signature: str = Field(..., description="Hex-encoded signature from wallet")
    wallet_address: str = Field(..., min_length=42, max_length=42, description="Wallet address")

class AuthVerifyResponse(BaseModel):
    success: bool
    session_token: Optional[str] = None
    refresh_token: Optional[str] = None
    wallet_address: Optional[str] = None
    expires_at: Optional[int] = None
    expires_in: Optional[int] = None
    error: Optional[str] = None

class AuthRefreshRequest(BaseModel):
    refresh_token: str = Field(..., description="Refresh token from original authentication")
    session_token: str = Field(..., description="Expired session token")

class AuthRefreshResponse(BaseModel):
    success: bool
    session_token: Optional[str] = None
    refresh_token: Optional[str] = None
    expires_at: Optional[int] = None
    expires_in: Optional[int] = None
    error: Optional[str] = None

class AuthStatusResponse(BaseModel):
    authenticated: bool
    wallet_address: Optional[str] = None
    expires_in: Optional[int] = None
    session_info: Optional[Dict[str, Any]] = None

# Pydantic models
class ContractRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000, description="Contract description")
    formData: Optional[Dict[str, Any]] = Field(None, description="Structured form data")
    
class SimpleContractRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000, description="Simple contract description")

class TemplateValidationRequest(BaseModel):
    template_json: str = Field(..., min_length=1, max_length=1048576, description="Template JSON string")
    user_id: Optional[str] = Field(None, description="User ID for audit logging")

class TemplateUploadRequest(BaseModel):
    template_data: Dict[str, Any] = Field(..., description="Template data object")
    user_id: Optional[str] = Field(None, description="User ID for audit logging")

class ChatMessage(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="User message")
    user_id: Optional[str] = Field(None, description="User ID for chat history")
    session_id: Optional[str] = Field(None, description="Chat session ID")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context for the AI")

class ChatResponse(BaseModel):
    response: str = Field(..., description="AI response message")
    session_id: str = Field(..., description="Chat session ID")
    timestamp: str = Field(..., description="Response timestamp")
    agent_type: str = Field(..., description="Type of AI agent used")
    suggestions: Optional[List[str]] = Field(None, description="Suggested follow-up questions")

class StructuredContractRequest(BaseModel):
    description: str = Field(..., min_length=1, max_length=2000, description="Project description")
    offeredAmount: Optional[float] = Field(None, ge=0, description="Amount offered by freelancer")
    requestedAmount: Optional[float] = Field(None, ge=0, description="Amount requested by client")
    days: Optional[int] = Field(None, ge=1, description="Project duration in days")
    role: str = Field(..., description="User role: freelancer or client")
    freelancerWallet: Optional[str] = Field(None, description="Freelancer wallet address")
    clientWallet: Optional[str] = Field(None, description="Client wallet address")
    
    # Freelancer Profile
    freelancerName: Optional[str] = Field(None, description="Freelancer full name")
    freelancerTitle: Optional[str] = Field(None, description="Freelancer professional title")
    freelancerBio: Optional[str] = Field(None, description="Freelancer bio")
    freelancerSkills: Optional[str] = Field(None, description="Freelancer skills")
    freelancerExperience: Optional[str] = Field(None, description="Freelancer experience level")
    freelancerLocation: Optional[str] = Field(None, description="Freelancer location")
    freelancerRate: Optional[float] = Field(None, ge=0, description="Freelancer hourly rate")
    
    # Social Links
    freelancerX: Optional[str] = Field(None, description="Freelancer X (Twitter) profile")
    freelancerFacebook: Optional[str] = Field(None, description="Freelancer Facebook profile")
    freelancerInstagram: Optional[str] = Field(None, description="Freelancer Instagram profile")
    freelancerTikTok: Optional[str] = Field(None, description="Freelancer TikTok profile")
    freelancerLinkedIn: Optional[str] = Field(None, description="Freelancer LinkedIn profile")
    freelancerGithub: Optional[str] = Field(None, description="Freelancer GitHub profile")
    freelancerPortfolio: Optional[str] = Field(None, description="Freelancer portfolio website")
    
    # Client Profile
    clientName: Optional[str] = Field(None, description="Client contact name")
    clientCompany: Optional[str] = Field(None, description="Client company/project name")
    clientBio: Optional[str] = Field(None, description="Client project description")
    clientLocation: Optional[str] = Field(None, description="Client location")

class WalletValidationRequest(BaseModel):
    address: str = Field(..., min_length=42, max_length=42, description="Wallet address to validate")
    network: str = Field(..., description="Network to validate against (polygon, ethereum, etc.)")

class WalletValidationResponse(BaseModel):
    valid: bool = Field(..., description="Whether the wallet address is valid")
    address: str = Field(..., description="The validated address")
    network: str = Field(..., description="The network it was validated against")
    error: Optional[str] = Field(None, description="Error message if validation failed")
    balance: Optional[float] = Field(None, description="Wallet balance if available")

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    service: str
    version: str
    ai_agents_active: bool

# Global exception handler for custom exceptions
@app.exception_handler(GigChainBaseException)
async def gigchain_exception_handler(request: Request, exc: GigChainBaseException):
    """Handle all custom GigChain exceptions with proper error codes."""
    logger.error(f"GigChain error: {exc.error_code} - {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.error_code,
                "message": exc.message,
                "details": exc.details,
                "timestamp": datetime.now().isoformat()
            }
        }
    )

# Middleware for request logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.now()
    response = await call_next(request)
    process_time = (datetime.now() - start_time).total_seconds()
    
    logger.info(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.3f}s")
    return response

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint with AI agent status."""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        service="GigChain API",
        version="1.0.0",
        ai_agents_active=bool(os.getenv('OPENAI_API_KEY'))
    )

# ==================== W-CSAP AUTHENTICATION ENDPOINTS ====================

@app.post("/api/auth/challenge", response_model=AuthChallengeResponse)
async def auth_challenge(request: Request, body: AuthChallengeRequest):
    """
    Step 1: Initiate authentication by requesting a challenge.
    The challenge must be signed by the user's wallet.
    
    Returns a unique challenge message to be signed.
    """
    try:
        authenticator: WCSAPAuthenticator = request.app.state.authenticator
        db = request.app.state.auth_db
        
        # Get client info
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        
        # Generate challenge
        challenge = authenticator.initiate_authentication(
            wallet_address=body.wallet_address,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # Save to database
        db.save_challenge(
            challenge_id=challenge.challenge_id,
            wallet_address=challenge.wallet_address,
            challenge_message=challenge.challenge_message,
            nonce=challenge.nonce,
            issued_at=challenge.issued_at,
            expires_at=challenge.expires_at,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata=challenge.metadata
        )
        
        # Log event
        db.log_auth_event(
            wallet_address=body.wallet_address,
            event_type="challenge_requested",
            success=True,
            challenge_id=challenge.challenge_id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        logger.info(f"🎯 Challenge generated for {body.wallet_address[:10]}...")
        
        return AuthChallengeResponse(
            challenge_id=challenge.challenge_id,
            wallet_address=challenge.wallet_address,
            challenge_message=challenge.challenge_message,
            expires_at=challenge.expires_at
        )
        
    except Exception as e:
        logger.error(f"Challenge generation error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate authentication challenge"
        )

@app.post("/api/auth/verify", response_model=AuthVerifyResponse)
async def auth_verify(request: Request, body: AuthVerifyRequest):
    """
    Step 2: Verify the signed challenge and create a session.
    
    Returns session tokens for authenticated access.
    """
    try:
        authenticator: WCSAPAuthenticator = request.app.state.authenticator
        db = request.app.state.auth_db
        
        # Get client info
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        
        # Complete authentication
        session_assertion = authenticator.complete_authentication(
            challenge_id=body.challenge_id,
            signature=body.signature,
            wallet_address=body.wallet_address
        )
        
        if not session_assertion:
            # Log failed attempt
            db.log_auth_event(
                wallet_address=body.wallet_address,
                event_type="authentication_failed",
                success=False,
                challenge_id=body.challenge_id,
                error_message="Invalid signature or expired challenge",
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            logger.warning(f"❌ Authentication failed for {body.wallet_address[:10]}...")
            
            return AuthVerifyResponse(
                success=False,
                error="Invalid signature or expired challenge"
            )
        
        # Save session to database
        db.save_session(
            assertion_id=session_assertion.assertion_id,
            wallet_address=session_assertion.wallet_address,
            session_token=session_assertion.session_token,
            refresh_token=session_assertion.refresh_token,
            signature=session_assertion.signature,
            issued_at=session_assertion.issued_at,
            expires_at=session_assertion.expires_at,
            not_before=session_assertion.not_before,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata=session_assertion.metadata
        )
        
        # Log successful authentication
        db.log_auth_event(
            wallet_address=body.wallet_address,
            event_type="authentication_success",
            success=True,
            challenge_id=body.challenge_id,
            assertion_id=session_assertion.assertion_id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # Update challenge status
        db.update_challenge_status(body.challenge_id, "used")
        
        logger.info(f"✅ Authentication successful for {body.wallet_address[:10]}...")
        
        return AuthVerifyResponse(
            success=True,
            session_token=session_assertion.session_token,
            refresh_token=session_assertion.refresh_token,
            wallet_address=session_assertion.wallet_address,
            expires_at=session_assertion.expires_at,
            expires_in=session_assertion.expires_at - session_assertion.issued_at
        )
        
    except Exception as e:
        logger.error(f"Authentication verification error: {str(e)}")
        return AuthVerifyResponse(
            success=False,
            error="Failed to verify authentication"
        )

@app.post("/api/auth/refresh", response_model=AuthRefreshResponse)
async def auth_refresh(request: Request, body: AuthRefreshRequest):
    """
    Refresh an expired session using a valid refresh token.
    """
    try:
        authenticator: WCSAPAuthenticator = request.app.state.authenticator
        db = request.app.state.auth_db
        
        # Refresh session
        new_session = authenticator.refresh_session(
            refresh_token=body.refresh_token,
            old_session_token=body.session_token
        )
        
        if not new_session:
            logger.warning("❌ Session refresh failed")
            return AuthRefreshResponse(
                success=False,
                error="Invalid refresh token or session"
            )
        
        # Save new session to database
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        
        db.save_session(
            assertion_id=new_session.assertion_id,
            wallet_address=new_session.wallet_address,
            session_token=new_session.session_token,
            refresh_token=new_session.refresh_token,
            signature=new_session.signature,
            issued_at=new_session.issued_at,
            expires_at=new_session.expires_at,
            not_before=new_session.not_before,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata=new_session.metadata
        )
        
        # Log refresh event
        db.log_auth_event(
            wallet_address=new_session.wallet_address,
            event_type="session_refreshed",
            success=True,
            assertion_id=new_session.assertion_id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        logger.info(f"🔄 Session refreshed for {new_session.wallet_address[:10]}...")
        
        return AuthRefreshResponse(
            success=True,
            session_token=new_session.session_token,
            refresh_token=new_session.refresh_token,
            expires_at=new_session.expires_at,
            expires_in=new_session.expires_at - new_session.issued_at
        )
        
    except Exception as e:
        logger.error(f"Session refresh error: {str(e)}")
        return AuthRefreshResponse(
            success=False,
            error="Failed to refresh session"
        )

@app.get("/api/auth/status", response_model=AuthStatusResponse)
async def auth_status(wallet: Optional[Dict[str, Any]] = Depends(get_optional_wallet)):
    """
    Check authentication status for current session.
    """
    if not wallet:
        return AuthStatusResponse(authenticated=False)
    
    return AuthStatusResponse(
        authenticated=True,
        wallet_address=wallet["address"],
        expires_in=wallet["expires_in"],
        session_info={
            "assertion_id": wallet["assertion_id"],
            "expires_at": wallet["expires_at"]
        }
    )

@app.post("/api/auth/logout")
async def auth_logout(request: Request, wallet: Dict[str, Any] = Depends(get_current_wallet)):
    """
    Logout and invalidate current session.
    """
    try:
        authenticator: WCSAPAuthenticator = request.app.state.authenticator
        db = request.app.state.auth_db
        
        # Get session token from wallet info
        session = wallet.get("session")
        if session:
            # Invalidate in database
            db.invalidate_session(session["assertion_id"])
        
        # Log logout event
        db.log_auth_event(
            wallet_address=wallet["address"],
            event_type="logout",
            success=True,
            assertion_id=wallet.get("assertion_id"),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        
        logger.info(f"👋 Logout successful for {wallet['address'][:10]}...")
        
        return {"success": True, "message": "Logged out successfully"}
        
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return {"success": False, "error": "Failed to logout"}

@app.get("/api/auth/sessions")
async def get_user_sessions(wallet: Dict[str, Any] = Depends(get_current_wallet)):
    """
    Get all active sessions for the authenticated wallet.
    """
    try:
        db = get_database()
        sessions = db.get_active_sessions_by_wallet(wallet["address"])
        
        return {
            "wallet_address": wallet["address"],
            "active_sessions": len(sessions),
            "sessions": [
                {
                    "assertion_id": s["assertion_id"],
                    "created_at": s["created_at"],
                    "last_activity": s["last_activity"],
                    "expires_at": s["expires_at"],
                    "ip_address": s["ip_address"],
                    "user_agent": s["user_agent"]
                }
                for s in sessions
            ]
        }
        
    except Exception as e:
        logger.error(f"Get sessions error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve sessions")

@app.get("/api/auth/stats")
async def get_auth_stats():
    """
    Get authentication system statistics (public endpoint).
    """
    try:
        db = get_database()
        stats = db.get_statistics()
        
        return {
            "protocol": "W-CSAP",
            "version": "1.0.0",
            "statistics": stats,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Get stats error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve statistics")

# ==================== END W-CSAP ENDPOINTS ====================

# Main AI-powered contract generation
@app.post("/api/full_flow")
async def api_full_flow(request: ContractRequest):
    """
    Generate AI-powered contract with agent chaining.
    
    Uses NegotiationAgent, ContractGeneratorAgent, and DisputeResolverAgent
    for complex contract negotiations and generation.
    """
    try:
        logger.info(f"Processing AI contract request: {request.text[:100]}...")
        
        # Process with full AI flow
        result = full_flow(request.text)
        
        # Add API metadata
        result['api_metadata'] = {
            'timestamp': datetime.now().isoformat(),
            'endpoint': 'full_flow',
            'ai_agents_used': 'json' in result,
            'processing_time': 'calculated_by_client'
        }
        
        logger.info(f"Successfully generated contract: {result.get('contract_id', 'unknown')}")
        return result
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Validation error: {str(e)}")
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error occurred")

# Simple rule-based contract generation
@app.post("/api/contract")
async def api_simple_contract(request: SimpleContractRequest):
    """
    Generate simple rule-based contract without AI agents.
    
    Faster response for simple contracts without complex negotiations.
    """
    try:
        logger.info(f"Processing simple contract: {request.text[:100]}...")
        
        # Process with rule-based generation only
        result = generate_contract(request.text)
        
        # Add API metadata
        result['api_metadata'] = {
            'timestamp': datetime.now().isoformat(),
            'endpoint': 'contract',
            'ai_agents_used': False,
            'processing_time': 'calculated_by_client'
        }
        
        logger.info("Successfully generated simple contract")
        return result
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Validation error: {str(e)}")
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error occurred")

# Structured contract generation endpoint
@app.post("/api/structured_contract")
async def api_structured_contract(request: StructuredContractRequest):
    """
    Generate a contract from structured form data.
    
    Accepts individual form fields and constructs the contract text internally.
    """
    try:
        logger.info(f"Processing structured contract for role: {request.role}")
        
        # Construct text from structured data
        constructed_text = _construct_text_from_structured_data(request)
        
        # Generate contract using the AI module
        result = generate_contract(constructed_text)
        
        # Add structured data to response for reference
        result["formData"] = {
            "description": request.description,
            "offeredAmount": request.offeredAmount,
            "requestedAmount": request.requestedAmount,
            "days": request.days,
            "role": request.role,
            "freelancerWallet": request.freelancerWallet,
            "clientWallet": request.clientWallet,
            # Freelancer Profile
            "freelancerName": request.freelancerName,
            "freelancerTitle": request.freelancerTitle,
            "freelancerBio": request.freelancerBio,
            "freelancerSkills": request.freelancerSkills,
            "freelancerExperience": request.freelancerExperience,
            "freelancerLocation": request.freelancerLocation,
            "freelancerRate": request.freelancerRate,
            # Social Links
            "freelancerX": request.freelancerX,
            "freelancerFacebook": request.freelancerFacebook,
            "freelancerInstagram": request.freelancerInstagram,
            "freelancerTikTok": request.freelancerTikTok,
            "freelancerLinkedIn": request.freelancerLinkedIn,
            "freelancerGithub": request.freelancerGithub,
            "freelancerPortfolio": request.freelancerPortfolio,
            # Client Profile
            "clientName": request.clientName,
            "clientCompany": request.clientCompany,
            "clientBio": request.clientBio,
            "clientLocation": request.clientLocation
        }
        
        # Add API metadata
        result['api_metadata'] = {
            'timestamp': datetime.now().isoformat(),
            'endpoint': 'structured_contract',
            'ai_agents_used': False,
            'processing_time': 'calculated_by_client'
        }
        
        logger.info("Successfully generated structured contract")
        return result
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Validation error: {str(e)}")
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error occurred")

def _construct_text_from_structured_data(data: StructuredContractRequest) -> str:
    """Construct text input from structured form data."""
    text = data.description
    
    # Add profile information
    if data.role == 'freelancer':
        if data.freelancerName:
            text += f" Freelancer: {data.freelancerName}"
        if data.freelancerTitle:
            text += f", {data.freelancerTitle}"
        if data.freelancerLocation:
            text += f" ({data.freelancerLocation})"
        if data.freelancerBio:
            text += f". {data.freelancerBio}"
        if data.freelancerSkills:
            text += f" Habilidades: {data.freelancerSkills}"
        if data.freelancerExperience:
            text += f" Experiencia: {data.freelancerExperience} años"
        if data.freelancerRate:
            text += f" Tarifa: ${data.freelancerRate}/hora"
        
        if data.offeredAmount:
            text += f" Ofrezco ${data.offeredAmount} dolares."
        if data.requestedAmount:
            text += f" Cliente solicita ${data.requestedAmount} dolares."
    else:
        if data.clientName:
            text += f" Cliente: {data.clientName}"
        if data.clientCompany:
            text += f" ({data.clientCompany})"
        if data.clientLocation:
            text += f" - {data.clientLocation}"
        if data.clientBio:
            text += f". {data.clientBio}"
        
        if data.requestedAmount:
            text += f" Cliente solicita ${data.requestedAmount} dolares."
        if data.offeredAmount:
            text += f" Freelancer ofrezco ${data.offeredAmount} dolares."
    
    if data.days:
        text += f" Proyecto de {data.days} días."
    
    # Add wallet information
    if data.freelancerWallet:
        text += f" Wallet freelancer: {data.freelancerWallet}."
    if data.clientWallet:
        text += f" Wallet cliente: {data.clientWallet}."
    
    # Add social links for credibility
    social_links = []
    if data.freelancerLinkedIn:
        social_links.append(f"LinkedIn: {data.freelancerLinkedIn}")
    if data.freelancerGithub:
        social_links.append(f"GitHub: {data.freelancerGithub}")
    if data.freelancerPortfolio:
        social_links.append(f"Portfolio: {data.freelancerPortfolio}")
    if data.freelancerX:
        social_links.append(f"X: {data.freelancerX}")
    
    if social_links:
        text += f" Enlaces: {', '.join(social_links)}."
    
    return text

# Wallet validation endpoint
@app.post("/api/validate_wallet", response_model=WalletValidationResponse)
async def validate_wallet(request: WalletValidationRequest):
    """Validate a wallet address and check its status on the specified network."""
    try:
        logger.info(f"Validating wallet: {request.address[:10]}... on {request.network}")
        
        # Basic format validation
        if not request.address.startswith('0x') or len(request.address) != 42:
            return WalletValidationResponse(
                valid=False,
                address=request.address,
                network=request.network,
                error="Invalid address format. Must be 42 characters starting with 0x."
            )
        
        # Check if address contains only valid hex characters
        if not all(c in '0123456789abcdefABCDEF' for c in request.address[2:]):
            return WalletValidationResponse(
                valid=False,
                address=request.address,
                network=request.network,
                error="Invalid address format. Must contain only hexadecimal characters."
            )
        
        # For now, we'll do basic validation
        # In a real implementation, you would:
        # 1. Check if the address exists on the blockchain
        # 2. Verify it's a valid contract or EOA
        # 3. Check balance if needed
        # 4. Verify network compatibility
        
        # Simulate network validation
        if request.network.lower() not in ['polygon', 'ethereum', 'mumbai']:
            return WalletValidationResponse(
                valid=False,
                address=request.address,
                network=request.network,
                error=f"Unsupported network: {request.network}"
            )
        
        # For demo purposes, we'll consider valid addresses as valid
        # In production, you'd integrate with web3 libraries or APIs
        logger.info(f"Wallet validation successful for {request.address[:10]}...")
        
        return WalletValidationResponse(
            valid=True,
            address=request.address,
            network=request.network,
            error=None,
            balance=None  # Would be populated with actual balance check
        )
        
    except Exception as e:
        logger.error(f"Wallet validation error: {str(e)}")
        return WalletValidationResponse(
            valid=False,
            address=request.address,
            network=request.network,
            error=f"Validation failed: {str(e)}"
        )

# Agent status endpoint
@app.get("/api/agents/status")
async def agents_status():
    """Check AI agent availability and configuration."""
    return get_agent_status()

# AI Agents Management Endpoints
@app.post("/api/agents/{agent_id}/toggle")
async def toggle_agent(agent_id: int, enabled: bool):
    """
    Toggle AI agent on/off.
    This controls whether the agent is active for processing requests.
    """
    try:
        # Get current agent status
        status = get_agent_status()
        agents = status.get("available_agents", [])
        
        # Find the agent
        agent = next((a for i, a in enumerate(agents) if i == agent_id - 1), None)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        # Update agent status (in production, this would update database)
        new_status = "active" if enabled else "inactive"
        
        logger.info(f"Agent {agent['name']} toggled to {new_status}")
        
        return {
            "success": True,
            "agent_id": agent_id,
            "agent_name": agent["name"],
            "status": new_status,
            "message": f"Agent {agent['name']} {'activated' if enabled else 'deactivated'} successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling agent: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to toggle agent")

@app.post("/api/agents/{agent_id}/configure")
async def configure_agent(agent_id: int, config: Dict[str, Any]):
    """
    Configure AI agent parameters.
    Allows customization of agent behavior, temperature, and other settings.
    """
    try:
        # Get current agent status
        status = get_agent_status()
        agents = status.get("available_agents", [])
        
        # Find the agent
        agent = next((a for i, a in enumerate(agents) if i == agent_id - 1), None)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        # Validate configuration
        valid_config_keys = ["temperature", "model", "max_tokens", "system_prompt"]
        filtered_config = {k: v for k, v in config.items() if k in valid_config_keys}
        
        if not filtered_config:
            raise HTTPException(status_code=400, detail="No valid configuration parameters provided")
        
        logger.info(f"Agent {agent['name']} configured with: {filtered_config}")
        
        return {
            "success": True,
            "agent_id": agent_id,
            "agent_name": agent["name"],
            "configuration": filtered_config,
            "message": f"Agent {agent['name']} configured successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error configuring agent: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to configure agent")

@app.post("/api/agents/{agent_id}/test")
async def test_agent(agent_id: int, test_input: Dict[str, Any]):
    """
    Test AI agent with sample input.
    Returns agent response for testing and debugging purposes.
    """
    try:
        from agents import (
            NegotiationAgent, 
            ContractGeneratorAgent, 
            DisputeResolverAgent, 
            QualityAgent, 
            PaymentAgent,
            AgentInput
        )
        
        # Get current agent status
        status = get_agent_status()
        agents = status.get("available_agents", [])
        
        # Find the agent
        agent = next((a for i, a in enumerate(agents) if i == agent_id - 1), None)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        # Map agent ID to agent class
        agent_classes = {
            0: NegotiationAgent,
            1: ContractGeneratorAgent,
            2: QualityAgent,
            3: PaymentAgent,
            4: DisputeResolverAgent
        }
        
        agent_class = agent_classes.get(agent_id - 1)
        if not agent_class:
            raise HTTPException(status_code=400, detail="Agent not testable")
        
        # Create test input
        if agent_id == 1:  # NegotiationAgent
            from contract_ai import parse_input, _detect_role, _determine_total_amount, _extract_days, _derive_risks, parsed_to_dict
            text = test_input.get("text", "Cliente ofrece $1000 por proyecto en 10 días")
            parsed = parse_input(text)
            role = _detect_role(text)
            total_amount = _determine_total_amount(parsed, role) or 1000.0
            total_days = _extract_days(text) or 10
            risks = _derive_risks(total_days, parsed)
            
            test_data = AgentInput(
                parsed=parsed_to_dict(parsed, role, total_amount, total_days, risks),
                role=role or "cliente",
                complexity="medium"
            )
            result = agent_class().run(test_data)
        else:
            # For other agents, use provided test input
            result = agent_class().run(test_input)
        
        logger.info(f"Agent {agent['name']} tested successfully")
        
        return {
            "success": True,
            "agent_id": agent_id,
            "agent_name": agent["name"],
            "test_result": result,
            "message": f"Agent {agent['name']} test completed successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error testing agent: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Agent test failed: {str(e)}",
                "fallback_response": "Agent is currently unavailable. Please ensure OpenAI API key is configured."
            }
        )

# Template security endpoints
@app.post("/api/templates/validate")
async def validate_template(request: TemplateValidationRequest):
    """
    Valida la seguridad de una plantilla JSON antes de procesarla.
    Endpoint crítico para prevenir ejecución de código malicioso.
    """
    try:
        logger.info(f"Validating template for user: {request.user_id or 'anonymous'}")
        
        # Validar seguridad de la plantilla
        validation_result = validate_template_security(request.template_json)
        
        # Log de seguridad
        if not validation_result.is_valid:
            logger.warning(f"Template validation failed for user {request.user_id}: {validation_result.errors}")
        else:
            logger.info(f"Template validation successful for user {request.user_id}, score: {validation_result.security_score}")
        
        return {
            "valid": validation_result.is_valid,
            "security_score": validation_result.security_score,
            "sanitized_template": validation_result.sanitized_data,
            "errors": validation_result.errors or [],
            "warnings": validation_result.warnings or [],
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Template validation error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "valid": False,
                "error": "Error interno validando plantilla",
                "security_score": 0,
                "timestamp": datetime.now().isoformat()
            }
        )

@app.post("/api/templates/upload")
async def upload_template(request: TemplateUploadRequest):
    """
    Sube una plantilla validada de manera segura.
    Solo acepta plantillas pre-validadas por el endpoint /validate.
    """
    try:
        logger.info(f"Uploading template for user: {request.user_id or 'anonymous'}")
        
        # Convertir a JSON string para validación
        template_json = json.dumps(request.template_data, ensure_ascii=False)
        
        # Validar seguridad
        validation_result = validate_template_security(template_json)
        
        if not validation_result.is_valid:
            logger.warning(f"Template upload rejected for user {request.user_id}: {validation_result.errors}")
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": "Plantilla no válida",
                    "details": validation_result.errors,
                    "security_score": validation_result.security_score
                }
            )
        
        # Generar ID único y metadatos
        template_id = hashlib.sha256(template_json.encode()).hexdigest()[:16]
        sanitized_template = validation_result.sanitized_data.copy()
        
        # Añadir metadatos de seguridad
        sanitized_template.update({
            "id": template_id,
            "uploaded_at": datetime.now().isoformat(),
            "uploaded_by": request.user_id or "anonymous",
            "security_validated": True,
            "security_score": validation_result.security_score
        })
        
        # Aquí se guardaría en base de datos en producción
        # Por ahora solo retornamos el template sanitizado
        
        logger.info(f"Template uploaded successfully: {template_id}")
        
        return {
            "success": True,
            "template_id": template_id,
            "template": sanitized_template,
            "security_score": validation_result.security_score,
            "warnings": validation_result.warnings or [],
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Template upload error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "Error interno subiendo plantilla",
                "timestamp": datetime.now().isoformat()
            }
        )

@app.get("/api/templates/security/info")
async def template_security_info():
    """
    Información sobre las medidas de seguridad implementadas.
    """
    return {
        "security_measures": [
            "Validación de estructura JSON estricta",
            "Whitelist de campos permitidos",
            "Sanitización de contenido HTML/JS",
            "Detección de patrones peligrosos",
            "Límites de tamaño de archivo",
            "Validación de tipos de datos",
            "Escapado de caracteres especiales",
            "Audit logging de seguridad"
        ],
        "allowed_fields": [
            "name", "description", "category", "projectType", "skills",
            "pricing", "timeline", "deliverables", "terms", "createdAt",
            "id", "uploadedAt", "author", "rating", "downloads", "thumbnail"
        ],
        "max_file_size": "1MB",
        "max_field_length": "10KB",
        "security_score_threshold": 70,
        "version": "1.0.0"
    }

# Chat AI endpoints
@app.post("/api/chat/message", response_model=ChatResponse)
async def send_chat_message(request: ChatMessage):
    """
    Envía un mensaje al chat con IA y obtiene respuesta.
    Soporta múltiples tipos de agentes especializados con persistencia.
    """
    try:
        logger.info(f"Processing chat message from user: {request.user_id or 'anonymous'}")
        
        # Generar o usar session_id existente
        session_id = request.session_id or str(uuid.uuid4())
        
        # Si no existe la sesión, crearla
        if not chat_manager.db.get_session(session_id):
            chat_manager.create_session(
                user_id=request.user_id,
                agent_type=request.context.get("agent_type", "contract") if request.context else "contract"
            )
        
        # Obtener respuesta del chat mejorado
        response_data = await chat_manager.process_message(
            message=request.message,
            session_id=session_id,
            user_id=request.user_id,
            context=request.context
        )
        
        logger.info(f"Chat response generated for session: {session_id}")
        
        return ChatResponse(
            response=response_data["response"],
            session_id=response_data["session_id"],
            timestamp=response_data["timestamp"],
            agent_type=response_data["agent_type"],
            suggestions=response_data.get("suggestions", [])
        )
        
    except Exception as e:
        logger.error(f"Chat message error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "response": "Lo siento, hubo un error procesando tu mensaje. Por favor, inténtalo de nuevo.",
                "session_id": request.session_id or str(uuid.uuid4()),
                "timestamp": datetime.now().isoformat(),
                "agent_type": "error",
                "suggestions": ["¿Puedes repetir tu pregunta?", "¿Necesitas ayuda con contratos?"]
            }
        )

@app.post("/api/chat/session")
async def create_chat_session(user_id: Optional[str] = None, agent_type: str = "contract"):
    """
    Crea una nueva sesión de chat con persistencia.
    """
    try:
        session_id = chat_manager.create_session(user_id, agent_type)
        
        return {
            "session_id": session_id,
            "agent_type": agent_type,
            "created_at": datetime.now().isoformat(),
            "message": "Sesión de chat creada exitosamente",
            "available_agents": chat_manager.get_available_agents()
        }
        
    except Exception as e:
        logger.error(f"Chat session creation error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "Error creando sesión de chat",
                "timestamp": datetime.now().isoformat()
            }
        )

@app.get("/api/chat/session/{session_id}/history")
async def get_chat_history(session_id: str, limit: int = 50):
    """
    Obtiene el historial de una sesión de chat con persistencia.
    """
    try:
        history = chat_manager.get_session_history(session_id, limit)
        
        if not history:
            return JSONResponse(
                status_code=404,
                content={
                    "error": "Sesión no encontrada o sin historial",
                    "timestamp": datetime.now().isoformat()
                }
            )
        
        return {
            "session_id": session_id,
            "history": history,
            "message_count": len(history),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Chat history error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "Error obteniendo historial de chat",
                "timestamp": datetime.now().isoformat()
            }
        )

@app.put("/api/chat/session/{session_id}/agent")
async def switch_chat_agent(session_id: str, agent_type: str):
    """
    Cambia el tipo de agente para una sesión de chat.
    """
    try:
        success = chat_manager.switch_agent(session_id, agent_type)
        
        if not success:
            return JSONResponse(
                status_code=400,
                content={
                    "error": "Tipo de agente no válido o sesión no encontrada",
                    "available_agents": [agent["id"] for agent in chat_manager.get_available_agents()],
                    "timestamp": datetime.now().isoformat()
                }
            )
        
        return {
            "session_id": session_id,
            "agent_type": agent_type,
            "message": f"Agente cambiado a {agent_type}",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Chat agent switch error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "Error cambiando agente de chat",
                "timestamp": datetime.now().isoformat()
            }
        )

@app.get("/api/chat/agents")
async def get_available_agents():
    """
    Obtiene la lista de agentes de IA disponibles.
    """
    try:
        agents = chat_manager.get_available_agents()
        
        return {
            "agents": agents,
            "total": len(agents),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Get agents error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "Error obteniendo agentes disponibles",
                "timestamp": datetime.now().isoformat()
            }
        )

# WebSocket endpoint para chat en tiempo real
@app.websocket("/ws/chat/{session_id}")
async def websocket_chat(websocket: WebSocket, session_id: str):
    """
    WebSocket para chat en tiempo real con persistencia.
    """
    connection_id = str(uuid.uuid4())
    
    try:
        await chat_manager.websocket_manager.connect(websocket, connection_id, session_id)
        
        while True:
            # Recibir mensaje del cliente
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Procesar mensaje
            response = await chat_manager.process_message(
                message=message_data.get("message", ""),
                session_id=session_id,
                user_id=message_data.get("user_id"),
                context=message_data.get("context", {})
            )
            
            # Enviar respuesta (ya se envía automáticamente en process_message)
            logger.info(f"WebSocket message processed for session {session_id}")
            
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {connection_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
    finally:
        chat_manager.websocket_manager.disconnect(connection_id, session_id)

# Error handlers with error codes
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "error": {
                "code": "ENDPOINT_NOT_FOUND",
                "message": "The requested endpoint does not exist",
                "details": {
                    "path": request.url.path,
                    "method": request.method
                },
                "timestamp": datetime.now().isoformat(),
                "available_endpoints": [
                    "/health",
                    "/api/full_flow",
                    "/api/contract",
                    "/api/agents/status",
                    "/docs"
                ]
            }
        }
    )

@app.exception_handler(405)
async def method_not_allowed_handler(request: Request, exc):
    return JSONResponse(
        status_code=405,
        content={
            "error": {
                "code": "METHOD_NOT_ALLOWED",
                "message": "The HTTP method is not allowed for this endpoint",
                "details": {
                    "path": request.url.path,
                    "method": request.method
                },
                "timestamp": datetime.now().isoformat()
            }
        }
    )

@app.exception_handler(500)
async def internal_server_error_handler(request: Request, exc):
    logger.error(f"Internal server error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred",
                "details": {},
                "timestamp": datetime.now().isoformat()
            }
        }
    )

if __name__ == "__main__":
    import uvicorn
    
    # Development server
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Starting GigChain FastAPI server on port {port}")
    logger.info(f"Debug mode: {debug}")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=debug,
        log_level="info"
    )
