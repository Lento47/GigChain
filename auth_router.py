"""Authentication Router - W-CSAP Authentication Endpoints"""

from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import logging
import os
from datetime import datetime
from typing import Dict, Any, Optional
import uuid

# Import W-CSAP authentication
from auth import (
    WCSAPAuthenticator, 
    get_database, 
    get_current_wallet, 
    get_optional_wallet
)

# Import security utilities
from security.audit_logger import get_audit_logger, AuditEventType, AuditSeverity
from security.secure_logger import get_secure_logger, LogLevel, LogScrubMode

# Import API Response Wrapper
from api_response_wrapper import (
    APIResponseWrapper,
    create_auth_error,
    create_server_error
)

logger = logging.getLogger(__name__)

# Initialize secure loggers
secure_logger = get_secure_logger('auth.secure', LogLevel.INFO, LogScrubMode.STRICT)
audit_logger = get_audit_logger()

# Create router
router = APIRouter(prefix="/api/auth", tags=["authentication"])

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

@router.post("/challenge", response_model=AuthChallengeResponse)
async def auth_challenge(request: Request, body: AuthChallengeRequest):
    """
    Step 1: Initiate authentication by requesting a challenge.
    The challenge must be signed by the user's wallet.
    
    Returns a unique challenge message to be signed.
    """
    try:
        # Get or initialize authenticator (for test compatibility)
        if not hasattr(request.app.state, 'authenticator'):
            secret_key = os.getenv('W_CSAP_SECRET_KEY')
            if not secret_key:
                raise HTTPException(
                    status_code=500,
                    detail="Authentication system not properly configured"
                )
            request.app.state.authenticator = WCSAPAuthenticator(
                secret_key=secret_key,
                challenge_ttl=300,
                session_ttl=86400,
                refresh_ttl=604800
            )
            request.app.state.auth_db = get_database()
        
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
        
        # Security audit log
        audit_logger.log_event(
            event_type=AuditEventType.AUTH_CHALLENGE_REQUESTED,
            severity=AuditSeverity.INFO,
            wallet_address=body.wallet_address,
            ip_address=ip_address,
            user_agent=user_agent,
            event_data={"challenge_id": challenge.challenge_id},
            success=True
        )
        
        secure_logger.info(
            "🎯 Challenge generated",
            extra={"wallet_address": body.wallet_address, "challenge_id": challenge.challenge_id}
        )
        
        return AuthChallengeResponse(
            success=True,
            challenge_id=challenge.challenge_id,
            wallet_address=challenge.wallet_address,
            challenge_message=challenge.challenge_message,
            nonce=challenge.nonce,
            issued_at=challenge.issued_at,
            expires_at=challenge.expires_at,
            expires_in=int(challenge.expires_at - challenge.issued_at),
            metadata=challenge.metadata
        )
        
    except Exception as e:
        logger.error(f"Challenge generation error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate authentication challenge"
        )

@router.post("/verify")
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
        
        # Complete authentication (with database fallback)
        session_assertion = authenticator.complete_authentication(
            challenge_id=body.challenge_id,
            signature=body.signature,
            wallet_address=body.wallet_address,
            db=db
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
            
            # Security audit log - WARNING level for failed auth
            audit_logger.log_event(
                event_type=AuditEventType.AUTH_FAILURE,
                severity=AuditSeverity.WARNING,
                wallet_address=body.wallet_address,
                ip_address=ip_address,
                user_agent=user_agent,
                event_data={"challenge_id": body.challenge_id},
                success=False,
                error_message="Invalid signature or expired challenge"
            )
            
            secure_logger.warning(
                "❌ Authentication failed",
                extra={"wallet_address": body.wallet_address, "challenge_id": body.challenge_id}
            )
            
            request_id = getattr(request.scope, 'request_id', str(uuid.uuid4()))
            
            return create_auth_error(
                message="Invalid signature or expired challenge",
                request_id=request_id
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
        
        # Security audit log - Successful authentication
        audit_logger.log_event(
            event_type=AuditEventType.AUTH_SUCCESS,
            severity=AuditSeverity.INFO,
            wallet_address=body.wallet_address,
            ip_address=ip_address,
            user_agent=user_agent,
            session_id=session_assertion.assertion_id,
            event_data={"challenge_id": body.challenge_id},
            success=True
        )
        
        secure_logger.info(
            "✅ Authentication successful",
            extra={"wallet_address": body.wallet_address, "assertion_id": session_assertion.assertion_id}
        )
        
        request_id = getattr(request.scope, 'request_id', str(uuid.uuid4()))
        
        auth_data = {
            "session_token": session_assertion.session_token,
            "refresh_token": session_assertion.refresh_token,
            "wallet_address": session_assertion.wallet_address,
            "expires_at": session_assertion.expires_at,
            "expires_in": session_assertion.expires_at - session_assertion.issued_at
        }
        
        return APIResponseWrapper.success(
            data=auth_data,
            request_id=request_id
        )
        
    except Exception as e:
        logger.error(f"Authentication verification error: {str(e)}")
        request_id = getattr(request.scope, 'request_id', str(uuid.uuid4()))
        
        return create_server_error(
            message="Failed to verify authentication",
            request_id=request_id
        )

@router.post("/refresh", response_model=AuthRefreshResponse)
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
        
        secure_logger.info(
            "🔄 Session refreshed",
            extra={"wallet_address": new_session.wallet_address, "assertion_id": new_session.assertion_id}
        )
        
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

@router.get("/status", response_model=AuthStatusResponse)
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

@router.post("/logout")
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
        
        secure_logger.info(
            "👋 Logout successful",
            extra={"wallet_address": wallet['address'], "assertion_id": wallet.get("assertion_id")}
        )
        
        return {"success": True, "message": "Logged out successfully"}
        
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return {"success": False, "error": "Failed to logout"}

@router.get("/sessions")
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

@router.get("/stats")
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
