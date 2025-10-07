"""
W-CSAP Standardized Authentication Routes
==========================================

Standardized FastAPI routes for W-CSAP authentication.
All routes use consistent schemas, error handling, and response formats.
"""

from fastapi import APIRouter, Request, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from typing import Dict, Any, Optional
import logging
import time

from auth.schemas import (
    AuthChallengeRequest,
    AuthChallengeResponse,
    AuthVerifyRequest,
    AuthVerifyResponse,
    AuthRefreshRequest,
    AuthRefreshResponse,
    AuthLogoutRequest,
    AuthLogoutResponse,
    AuthStatusResponse,
    AuthSessionsResponse,
    AuthStatsResponse,
    SessionData,
    SessionListItem
)
from auth.errors import (
    WCSAPException,
    ChallengeNotFoundException,
    ChallengeExpiredException,
    InvalidSignatureException,
    SessionExpiredException,
    SessionNotFoundException,
    InvalidSessionTokenException,
    RateLimitExceededException,
    UnauthorizedException,
    InternalErrorException,
    create_success_response,
    create_error_response,
    WCSAPErrorCode
)
from auth.middleware import get_current_wallet, get_optional_wallet
from auth.w_csap import WCSAPAuthenticator
from auth.database import get_database
from auth.config import get_config

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
    responses={
        401: {"description": "Unauthorized"},
        429: {"description": "Rate limit exceeded"},
        500: {"description": "Internal server error"}
    }
)


# ==================== Helper Functions ====================

def get_authenticator(request: Request) -> WCSAPAuthenticator:
    """Get authenticator from app state."""
    if not hasattr(request.app.state, 'authenticator'):
        raise InternalErrorException("Authenticator not initialized")
    return request.app.state.authenticator


def get_client_info(request: Request) -> Dict[str, str]:
    """Extract client IP and user agent from request."""
    # Get IP address
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        ip_address = forwarded.split(",")[0].strip()
    else:
        ip_address = request.client.host if request.client else "unknown"
    
    # Get user agent
    user_agent = request.headers.get("User-Agent", "unknown")
    
    return {
        "ip_address": ip_address,
        "user_agent": user_agent
    }


# ==================== Authentication Endpoints ====================

@router.post(
    "/challenge",
    response_model=AuthChallengeResponse,
    summary="Request Authentication Challenge",
    description="""
    Request a cryptographic challenge for wallet authentication.
    
    **Flow:**
    1. Client sends wallet address
    2. Server generates unique challenge
    3. Client signs challenge with wallet
    4. Client sends signature to /verify endpoint
    
    **Security:**
    - Challenge expires after 5 minutes (configurable)
    - Each challenge is unique and can only be used once
    - Challenge includes timestamp and nonce for replay protection
    """
)
async def request_challenge(
    request: Request,
    body: AuthChallengeRequest
) -> AuthChallengeResponse:
    """Generate authentication challenge for wallet."""
    try:
        authenticator = get_authenticator(request)
        client_info = get_client_info(request)
        
        # Generate challenge
        challenge = authenticator.initiate_authentication(
            wallet_address=body.wallet_address,
            ip_address=client_info["ip_address"],
            user_agent=client_info["user_agent"]
        )
        
        # Save to database
        db = get_database()
        db.save_challenge(
            challenge_id=challenge.challenge_id,
            wallet_address=challenge.wallet_address,
            challenge_message=challenge.challenge_message,
            nonce=challenge.nonce,
            issued_at=challenge.issued_at,
            expires_at=challenge.expires_at,
            ip_address=client_info["ip_address"],
            user_agent=client_info["user_agent"],
            metadata=challenge.metadata
        )
        
        # Log event
        db.log_auth_event(
            wallet_address=challenge.wallet_address,
            event_type="challenge_requested",
            success=True,
            challenge_id=challenge.challenge_id,
            ip_address=client_info["ip_address"],
            user_agent=client_info["user_agent"]
        )
        
        logger.info(f"🎯 Challenge generated for {challenge.wallet_address[:10]}...")
        
        return AuthChallengeResponse(
            success=True,
            challenge_id=challenge.challenge_id,
            wallet_address=challenge.wallet_address,
            challenge_message=challenge.challenge_message,
            nonce=challenge.nonce,
            issued_at=challenge.issued_at,
            expires_at=challenge.expires_at,
            expires_in=challenge.expires_at - challenge.issued_at,
            metadata=challenge.metadata
        )
        
    except WCSAPException:
        raise
    except Exception as e:
        logger.error(f"Challenge generation error: {str(e)}")
        raise InternalErrorException("Failed to generate challenge")


@router.post(
    "/verify",
    response_model=AuthVerifyResponse,
    summary="Verify Signed Challenge",
    description="""
    Verify a signed challenge and create authenticated session.
    
    **Flow:**
    1. Client signs challenge message with wallet
    2. Client sends challenge ID, signature, and wallet address
    3. Server verifies signature cryptographically
    4. Server creates session with session token and refresh token
    
    **Security:**
    - Signature is verified using EIP-191 message signing
    - Challenge must not be expired or already used
    - Session tokens are HMAC-signed and tamper-proof
    """
)
async def verify_signature(
    request: Request,
    body: AuthVerifyRequest
) -> AuthVerifyResponse:
    """Verify signed challenge and create session."""
    try:
        authenticator = get_authenticator(request)
        db = get_database()
        client_info = get_client_info(request)
        
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
                error_message="Invalid signature",
                ip_address=client_info["ip_address"],
                user_agent=client_info["user_agent"]
            )
            
            raise InvalidSignatureException()
        
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
            ip_address=client_info["ip_address"],
            user_agent=client_info["user_agent"],
            metadata=session_assertion.metadata
        )
        
        # Log successful authentication
        db.log_auth_event(
            wallet_address=session_assertion.wallet_address,
            event_type="authentication_success",
            success=True,
            challenge_id=body.challenge_id,
            assertion_id=session_assertion.assertion_id,
            ip_address=client_info["ip_address"],
            user_agent=client_info["user_agent"]
        )
        
        logger.info(f"✅ Authentication successful for {session_assertion.wallet_address[:10]}...")
        
        return AuthVerifyResponse(
            success=True,
            message="Authentication successful",
            session=SessionData(
                assertion_id=session_assertion.assertion_id,
                wallet_address=session_assertion.wallet_address,
                session_token=session_assertion.session_token,
                refresh_token=session_assertion.refresh_token,
                issued_at=session_assertion.issued_at,
                expires_at=session_assertion.expires_at,
                expires_in=session_assertion.expires_at - int(time.time()),
                not_before=session_assertion.not_before,
                metadata=session_assertion.metadata
            )
        )
        
    except WCSAPException:
        raise
    except Exception as e:
        logger.error(f"Verification error: {str(e)}")
        raise InternalErrorException("Failed to verify signature")


@router.post(
    "/refresh",
    response_model=AuthRefreshResponse,
    summary="Refresh Session",
    description="""
    Refresh an expired or expiring session using a refresh token.
    
    **Flow:**
    1. Client sends expired session token and refresh token
    2. Server validates refresh token
    3. Server creates new session with new tokens
    
    **Security:**
    - Refresh tokens have longer TTL than session tokens
    - Old session is invalidated when refreshed
    - Rate limiting applies to prevent abuse
    """
)
async def refresh_session(
    request: Request,
    body: AuthRefreshRequest
) -> AuthRefreshResponse:
    """Refresh an expired session."""
    try:
        authenticator = get_authenticator(request)
        db = get_database()
        
        # Attempt to refresh
        new_session = authenticator.refresh_session(
            refresh_token=body.refresh_token,
            old_session_token=body.session_token
        )
        
        if not new_session:
            raise InvalidSessionTokenException("Session refresh failed")
        
        # Save new session to database
        client_info = get_client_info(request)
        db.save_session(
            assertion_id=new_session.assertion_id,
            wallet_address=new_session.wallet_address,
            session_token=new_session.session_token,
            refresh_token=new_session.refresh_token,
            signature=new_session.signature,
            issued_at=new_session.issued_at,
            expires_at=new_session.expires_at,
            not_before=new_session.not_before,
            ip_address=client_info["ip_address"],
            user_agent=client_info["user_agent"],
            metadata=new_session.metadata
        )
        
        # Log event
        db.log_auth_event(
            wallet_address=new_session.wallet_address,
            event_type="session_refreshed",
            success=True,
            assertion_id=new_session.assertion_id,
            ip_address=client_info["ip_address"]
        )
        
        logger.info(f"🔄 Session refreshed for {new_session.wallet_address[:10]}...")
        
        return AuthRefreshResponse(
            success=True,
            message="Session refreshed successfully",
            session=SessionData(
                assertion_id=new_session.assertion_id,
                wallet_address=new_session.wallet_address,
                session_token=new_session.session_token,
                refresh_token=new_session.refresh_token,
                issued_at=new_session.issued_at,
                expires_at=new_session.expires_at,
                expires_in=new_session.expires_at - int(time.time()),
                not_before=new_session.not_before,
                metadata=new_session.metadata
            )
        )
        
    except WCSAPException:
        raise
    except Exception as e:
        logger.error(f"Refresh error: {str(e)}")
        raise InternalErrorException("Failed to refresh session")


@router.get(
    "/status",
    response_model=AuthStatusResponse,
    summary="Check Authentication Status",
    description="""
    Check if the current user is authenticated.
    
    **Headers:**
    - Authorization: Bearer {session_token}
    
    **Returns:**
    - Authentication status
    - Wallet address if authenticated
    - Session expiry information
    """
)
async def check_status(
    request: Request,
    wallet: Optional[Dict] = Depends(get_optional_wallet)
) -> AuthStatusResponse:
    """Check authentication status."""
    if wallet:
        return AuthStatusResponse(
            authenticated=True,
            wallet_address=wallet["address"],
            expires_at=wallet["expires_at"],
            expires_in=wallet["expires_in"],
            session_info={
                "assertion_id": wallet["assertion_id"],
                "last_activity": wallet["session"].get("last_activity") if wallet.get("session") else None
            }
        )
    else:
        return AuthStatusResponse(
            authenticated=False
        )


@router.post(
    "/logout",
    response_model=AuthLogoutResponse,
    summary="Logout",
    description="""
    Logout and invalidate the current session.
    
    **Headers:**
    - Authorization: Bearer {session_token}
    
    **Security:**
    - Session is immediately invalidated
    - Session token cannot be used after logout
    - Refresh token is also invalidated
    """
)
async def logout(
    request: Request,
    wallet: Dict = Depends(get_current_wallet),
    body: Optional[AuthLogoutRequest] = None
) -> AuthLogoutResponse:
    """Logout and invalidate session."""
    try:
        authenticator = get_authenticator(request)
        db = get_database()
        
        # Get session token (from dependency)
        session = wallet.get("session")
        if session:
            # Invalidate in database
            db.invalidate_session(session["assertion_id"])
            
            # Log event
            db.log_auth_event(
                wallet_address=wallet["address"],
                event_type="logout",
                success=True,
                assertion_id=session["assertion_id"],
                ip_address=get_client_info(request)["ip_address"]
            )
        
        logger.info(f"👋 Logout successful for {wallet['address'][:10]}...")
        
        return AuthLogoutResponse(
            success=True,
            message="Logged out successfully"
        )
        
    except WCSAPException:
        raise
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        raise InternalErrorException("Failed to logout")


@router.get(
    "/sessions",
    response_model=AuthSessionsResponse,
    summary="List Active Sessions",
    description="""
    Get all active sessions for the authenticated wallet.
    
    **Headers:**
    - Authorization: Bearer {session_token}
    
    **Returns:**
    - List of all active sessions
    - Session metadata (IP, user agent, last activity)
    """
)
async def list_sessions(
    request: Request,
    wallet: Dict = Depends(get_current_wallet)
) -> AuthSessionsResponse:
    """Get all active sessions for wallet."""
    try:
        db = get_database()
        
        # Get active sessions
        sessions = db.get_active_sessions_by_wallet(wallet["address"])
        
        # Convert to response format
        session_items = [
            SessionListItem(
                assertion_id=s["assertion_id"],
                issued_at=s["issued_at"],
                expires_at=s["expires_at"],
                last_activity=s["last_activity"],
                ip_address=s.get("ip_address"),
                user_agent=s.get("user_agent"),
                status=s["status"]
            )
            for s in sessions
        ]
        
        return AuthSessionsResponse(
            success=True,
            wallet_address=wallet["address"],
            sessions=session_items,
            total=len(session_items)
        )
        
    except WCSAPException:
        raise
    except Exception as e:
        logger.error(f"Sessions list error: {str(e)}")
        raise InternalErrorException("Failed to retrieve sessions")


@router.get(
    "/stats",
    response_model=AuthStatsResponse,
    summary="Authentication Statistics",
    description="""
    Get authentication system statistics.
    
    **Public endpoint** - No authentication required.
    
    **Returns:**
    - Active sessions count
    - Pending challenges count
    - Total unique users
    - Recent authentication events
    """
)
async def get_statistics(request: Request) -> AuthStatsResponse:
    """Get authentication statistics."""
    try:
        db = get_database()
        stats = db.get_statistics()
        
        return AuthStatsResponse(
            success=True,
            statistics=stats
        )
        
    except Exception as e:
        logger.error(f"Statistics error: {str(e)}")
        raise InternalErrorException("Failed to retrieve statistics")


# ==================== Error Handler ====================

@router.exception_handler(WCSAPException)
async def wcsap_exception_handler(request: Request, exc: WCSAPException):
    """Handle W-CSAP specific exceptions."""
    return JSONResponse(
        status_code=exc.http_status,
        content=exc.to_dict()
    )


__all__ = ['router']
