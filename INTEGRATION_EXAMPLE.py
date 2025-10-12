"""
Integration Guide: Applying W-CSAP Security Fixes
==================================================

This guide shows how to integrate all security fixes into your existing application.
"""

# Step-by-step integration for main.py

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import os
import logging

# Import security initialization
from auth.security_init import initialize_w_csap_security
from auth.config import get_config, WCSAPConfig

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="GigChain.io API",
    version="3.0.0",
    docs_url="/api/docs" if os.getenv('ENVIRONMENT') != 'production' else None
)

@app.on_event("startup")
async def startup_event():
    """
    Initialize all security components on startup.
    """
    logger.info("Starting GigChain.io API with W-CSAP Security...")
    
    # ===== STEP 1: Load and Validate Configuration =====
    try:
        config = get_config()
        logger.info("Configuration loaded successfully")
    except ValueError as e:
        logger.critical(f"Configuration error: {str(e)}")
        raise
    
    # ===== STEP 2: Initialize All Security Components =====
    try:
        environment = os.getenv('ENVIRONMENT', 'production')
        security_components = initialize_w_csap_security(app, environment)
        
        # Store components in app state
        app.state.config = config
        app.state.session_store = security_components['session_store']
        app.state.rate_limiter = security_components['rate_limiter']
        
        logger.info("✅ All security components initialized successfully")
        
    except Exception as e:
        logger.critical(f"Security initialization failed: {str(e)}")
        raise
    
    # ===== STEP 3: Initialize W-CSAP Authenticator (with secure storage) =====
    try:
        from auth.w_csap import WCSAPAuthenticator
        
        # Initialize authenticator (now uses encrypted Redis storage)
        authenticator = WCSAPAuthenticator(
            secret_key=os.getenv('W_CSAP_SECRET_KEY'),
            challenge_ttl=config.challenge_ttl,
            session_ttl=config.session_ttl,
            refresh_ttl=config.refresh_ttl
        )
        
        # Replace in-memory storage with encrypted Redis storage
        authenticator.active_challenges = {}  # Still used for temporary challenge storage
        authenticator.active_sessions = {}    # No longer used - sessions in Redis
        
        # Store in app state
        app.state.authenticator = authenticator
        
        logger.info("✅ W-CSAP Authenticator initialized with secure storage")
        
    except Exception as e:
        logger.critical(f"Authenticator initialization failed: {str(e)}")
        raise
    
    # ===== STEP 4: Set up periodic security tasks =====
    import asyncio
    
    async def security_maintenance_task():
        """Run security maintenance tasks periodically."""
        while True:
            try:
                # Clean up expired challenges (in-memory)
                authenticator.cleanup_expired()
                
                # Session cleanup is handled by Redis TTL automatically
                
                # Health check
                session_health = app.state.session_store.health_check()
                if session_health['status'] != 'healthy':
                    logger.error(f"Session store unhealthy: {session_health}")
                
                logger.debug("Security maintenance completed")
                
            except Exception as e:
                logger.error(f"Security maintenance error: {str(e)}")
            
            # Run every 5 minutes
            await asyncio.sleep(300)
    
    # Start background task
    asyncio.create_task(security_maintenance_task())
    
    logger.info("🚀 GigChain.io API started with enterprise security")


@app.on_event("shutdown")
async def shutdown_event():
    """Clean shutdown of security components."""
    try:
        if hasattr(app.state, 'session_store'):
            app.state.session_store.close()
            logger.info("Session store closed")
    except Exception as e:
        logger.error(f"Shutdown error: {str(e)}")


# ===== CORS Configuration =====
# Apply before security middleware
config = get_config()
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-CSRF-Token"]  # Expose CSRF token header
)


# ===== Example: Updated Authentication Route with Rate Limiting =====

from auth.routes import router as auth_router
from auth.global_rate_limiter import RateLimitAction

@app.post("/api/auth/challenge")
async def request_challenge(
    request: Request,
    body: AuthChallengeRequest
):
    """
    Request authentication challenge with global rate limiting.
    """
    # Get rate limiter
    rate_limiter = request.app.state.rate_limiter
    
    # Check global rate limit for this wallet
    is_allowed, remaining, reason = rate_limiter.check_rate_limit(
        wallet_address=body.wallet_address,
        action=RateLimitAction.CHALLENGE_REQUEST,
        ip_address=request.client.host
    )
    
    if not is_allowed:
        logger.warning(
            f"Rate limit exceeded for wallet {body.wallet_address[:10]}...: {reason}"
        )
        raise HTTPException(
            status_code=429,
            detail={
                "error": "rate_limit_exceeded",
                "message": reason,
                "retry_after": 300  # seconds
            }
        )
    
    # Record request
    rate_limiter.record_request(
        wallet_address=body.wallet_address,
        action=RateLimitAction.CHALLENGE_REQUEST,
        ip_address=request.client.host,
        success=True
    )
    
    # Generate challenge (uses secure session store)
    authenticator = request.app.state.authenticator
    session_store = request.app.state.session_store
    
    challenge = authenticator.initiate_authentication(
        wallet_address=body.wallet_address,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    # Store challenge in encrypted Redis
    session_store.store_challenge(challenge)
    
    return AuthChallengeResponse(
        success=True,
        challenge_id=challenge.challenge_id,
        challenge_message=challenge.challenge_message,
        expires_at=challenge.expires_at
    )


@app.post("/api/auth/verify")
async def verify_signature(
    request: Request,
    body: AuthVerifyRequest
):
    """
    Verify signature with enhanced security.
    """
    authenticator = request.app.state.authenticator
    session_store = request.app.state.session_store
    rate_limiter = request.app.state.rate_limiter
    
    # Check rate limit
    is_allowed, remaining, reason = rate_limiter.check_rate_limit(
        wallet_address=body.wallet_address,
        action=RateLimitAction.VERIFY_ATTEMPT
    )
    
    if not is_allowed:
        raise HTTPException(status_code=429, detail=reason)
    
    # Complete authentication with fail-closed verification
    session_assertion = authenticator.complete_authentication(
        challenge_id=body.challenge_id,
        signature=body.signature,
        wallet_address=body.wallet_address
    )
    
    if not session_assertion:
        # Record failed attempt
        rate_limiter.record_request(
            wallet_address=body.wallet_address,
            action=RateLimitAction.FAILED_AUTH,
            success=False
        )
        raise HTTPException(
            status_code=401,
            detail="Invalid signature or expired challenge"
        )
    
    # Record successful authentication
    rate_limiter.record_request(
        wallet_address=body.wallet_address,
        action=RateLimitAction.VERIFY_ATTEMPT,
        success=True
    )
    
    # Store session in encrypted Redis
    session_store.store_session(session_assertion)
    
    return AuthVerifyResponse(
        success=True,
        session_token=session_assertion.session_token,
        refresh_token=session_assertion.refresh_token,
        expires_at=session_assertion.expires_at
    )


# ===== Example: Protected Route with Encrypted Session Validation =====

from auth.middleware import get_current_wallet

@app.get("/api/profile")
async def get_profile(
    request: Request,
    wallet: Dict = Depends(get_current_wallet)
):
    """
    Protected route example.
    
    The get_current_wallet dependency now:
    1. Validates session token with constant-time operations
    2. Retrieves encrypted session from Redis
    3. Verifies session is not revoked
    4. Returns wallet information
    """
    return {
        "wallet_address": wallet["address"],
        "session_expires_at": wallet["expires_at"],
        "session_expires_in": wallet["expires_in"]
    }


# ===== Health Check Endpoint =====

@app.get("/api/health")
async def health_check(request: Request):
    """
    Comprehensive health check including security components.
    """
    health = {
        "status": "healthy",
        "timestamp": time.time(),
        "components": {}
    }
    
    # Check session store
    try:
        session_health = request.app.state.session_store.health_check()
        health["components"]["session_store"] = session_health
    except Exception as e:
        health["components"]["session_store"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health["status"] = "degraded"
    
    # Check rate limiter
    try:
        # Simple check - try to get status for a test wallet
        rate_status = request.app.state.rate_limiter.get_wallet_status("0x0000000000000000000000000000000000000000")
        health["components"]["rate_limiter"] = {
            "status": "healthy",
            "connected": True
        }
    except Exception as e:
        health["components"]["rate_limiter"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health["status"] = "degraded"
    
    return health


if __name__ == "__main__":
    import uvicorn
    
    # Production configuration
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=5000,
        log_level="info",
        access_log=True,
        use_colors=True,
        # Security: Disable auto-reload in production
        reload=False
    )
