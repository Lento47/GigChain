"""
W-CSAP Authentication Middleware
=================================

FastAPI middleware and dependencies for protecting routes with wallet authentication.
"""

from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any
import logging
from functools import wraps

from auth.w_csap import WCSAPAuthenticator
from auth.database import get_database

logger = logging.getLogger(__name__)

# HTTP Bearer token scheme
security = HTTPBearer(auto_error=False)


class AuthenticationError(Exception):
    """Custom exception for authentication errors."""
    pass


async def get_current_wallet(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Dict[str, Any]:
    """
    Dependency to get current authenticated wallet from request.
    
    Usage:
        @app.get("/api/protected")
        async def protected_route(wallet: Dict = Depends(get_current_wallet)):
            return {"wallet": wallet["address"]}
    
    Returns:
        Dict with wallet information
        
    Raises:
        HTTPException: If authentication fails
    """
    # Get session token from Authorization header
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    session_token = credentials.credentials
    
    try:
        # Get authenticator from app state
        authenticator: WCSAPAuthenticator = request.app.state.authenticator
        
        # Validate session token
        is_valid, session_data = authenticator.validate_session(session_token)
        
        if not is_valid or not session_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired session token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Get full session from database
        db = get_database()
        session = db.get_session_by_token(session_token)
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Update last activity
        import time
        db.update_session_activity(session['assertion_id'], int(time.time()))
        
        # Return wallet information
        return {
            "address": session_data["wallet_address"],
            "assertion_id": session_data["assertion_id"],
            "expires_at": session_data["expires_at"],
            "expires_in": session_data["expires_in"],
            "session": session
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal authentication error"
        )


async def get_optional_wallet(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[Dict[str, Any]]:
    """
    Dependency to get current wallet if authenticated, None otherwise.
    Use this for routes that work with or without authentication.
    
    Usage:
        @app.get("/api/optional-auth")
        async def route(wallet: Optional[Dict] = Depends(get_optional_wallet)):
            if wallet:
                return {"message": f"Hello {wallet['address']}"}
            return {"message": "Hello anonymous"}
    """
    try:
        return await get_current_wallet(request, credentials)
    except HTTPException:
        return None


def require_wallet(func):
    """
    Decorator to require wallet authentication for a route.
    
    Usage:
        @app.get("/api/protected")
        @require_wallet
        async def protected_route(request: Request):
            wallet = request.state.wallet
            return {"wallet": wallet["address"]}
    """
    @wraps(func)
    async def wrapper(request: Request, *args, **kwargs):
        # Get wallet from dependency
        credentials = await security(request)
        wallet = await get_current_wallet(request, credentials)
        
        # Store in request state for easy access
        request.state.wallet = wallet
        
        return await func(request, *args, **kwargs)
    
    return wrapper


class RateLimitMiddleware:
    """
    Middleware to enforce rate limiting on authentication attempts.
    """
    
    def __init__(
        self,
        max_attempts: int = 5,
        window_seconds: int = 300  # 5 minutes
    ):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
    
    async def __call__(self, request: Request, call_next):
        # Only apply to auth endpoints
        if not request.url.path.startswith("/api/auth/"):
            return await call_next(request)
        
        # Get client identifier (wallet or IP)
        client_id = self._get_client_identifier(request)
        
        # Check rate limit
        db = get_database()
        is_allowed, attempts_remaining = db.check_rate_limit(
            wallet_address=client_id,
            action_type="auth_attempt",
            max_attempts=self.max_attempts,
            window_seconds=self.window_seconds
        )
        
        if not is_allowed:
            logger.warning(f"Rate limit exceeded for {client_id}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many authentication attempts. Try again later.",
                headers={"Retry-After": str(self.window_seconds)}
            )
        
        # Add rate limit headers
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.max_attempts)
        response.headers["X-RateLimit-Remaining"] = str(attempts_remaining)
        
        return response
    
    def _get_client_identifier(self, request: Request) -> str:
        """Get client identifier from request."""
        # Try to get wallet from request body
        try:
            if hasattr(request, 'json'):
                body = request.json()
                if 'wallet_address' in body:
                    return body['wallet_address']
        except:
            pass
        
        # Fallback to IP address
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        
        return request.client.host if request.client else "unknown"


class SessionCleanupMiddleware:
    """
    Middleware to periodically cleanup expired challenges and sessions.
    """
    
    def __init__(self, cleanup_interval: int = 3600):  # 1 hour
        self.cleanup_interval = cleanup_interval
        self.last_cleanup = 0
    
    async def __call__(self, request: Request, call_next):
        import time
        
        current_time = int(time.time())
        
        # Cleanup if interval has passed
        if current_time - self.last_cleanup > self.cleanup_interval:
            try:
                db = get_database()
                db.cleanup_expired_challenges(current_time)
                db.cleanup_expired_sessions(current_time)
                
                # Also cleanup in-memory cache
                if hasattr(request.app.state, 'authenticator'):
                    request.app.state.authenticator.cleanup_expired()
                
                self.last_cleanup = current_time
                
            except Exception as e:
                logger.error(f"Cleanup error: {str(e)}")
        
        return await call_next(request)


# Helper functions for route protection

def protected_route():
    """
    Decorator factory for protected routes.
    
    Usage:
        @app.get("/api/profile")
        @protected_route()
        async def get_profile(wallet: Dict = Depends(get_current_wallet)):
            return {"profile": wallet}
    """
    def decorator(func):
        # The dependency will be handled by FastAPI
        return func
    return decorator


def admin_only(allowed_addresses: list):
    """
    Decorator to restrict access to specific wallet addresses.
    
    Usage:
        @app.post("/api/admin/action")
        @admin_only(["0x123...", "0x456..."])
        async def admin_action(wallet: Dict = Depends(get_current_wallet)):
            return {"status": "success"}
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, wallet: Dict = Depends(get_current_wallet), **kwargs):
            if wallet["address"].lower() not in [addr.lower() for addr in allowed_addresses]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient permissions"
                )
            return await func(*args, wallet=wallet, **kwargs)
        return wrapper
    return decorator
