"""
W-CSAP Authentication Middleware
=================================

FastAPI middleware and dependencies for protecting routes with wallet authentication.
"""

from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any
import logging
import time
from functools import wraps

from auth.w_csap import WCSAPAuthenticator
from auth.database import get_database
from auth.config import get_config

logger = logging.getLogger(__name__)

# Import revocation cache (lazy import to avoid circular dependencies)
_revocation_cache = None
_dpop_validator = None
_jwt_manager = None

def get_revocation_cache_instance():
    """Get revocation cache instance (lazy initialization)."""
    global _revocation_cache
    if _revocation_cache is None:
        try:
            from auth.revocation import get_revocation_cache
            config = get_config()
            _revocation_cache = get_revocation_cache(
                cache_type=config.revocation_cache_type,
                redis_url=config.revocation_cache_redis_url
            )
        except Exception as e:
            logger.warning(f"Revocation cache not available: {str(e)}")
            _revocation_cache = False  # Mark as unavailable
    return _revocation_cache if _revocation_cache is not False else None

def get_dpop_validator_instance():
    """Get DPoP validator instance (lazy initialization)."""
    global _dpop_validator
    if _dpop_validator is None:
        try:
            from auth.dpop import get_dpop_validator
            config = get_config()
            _dpop_validator = get_dpop_validator(
                clock_skew_seconds=getattr(config, 'dpop_clock_skew', 60),
                nonce_cache_ttl=getattr(config, 'dpop_nonce_cache_ttl', 300)
            )
        except Exception as e:
            logger.warning(f"DPoP validator not available: {str(e)}")
            _dpop_validator = False
    return _dpop_validator if _dpop_validator is not False else None

def get_jwt_manager_instance():
    """Get JWT manager instance (lazy initialization)."""
    global _jwt_manager
    if _jwt_manager is None:
        try:
            from auth.jwt_tokens import get_jwt_manager
            config = get_config()
            _jwt_manager = get_jwt_manager(
                algorithm=getattr(config, 'jwt_algorithm', 'ES256'),
                issuer=getattr(config, 'token_issuer', 'https://auth.gigchain.io'),
                audience=getattr(config, 'token_audience', 'https://api.gigchain.io'),
                access_token_ttl=config.access_token_ttl,
                refresh_token_ttl=config.refresh_ttl
            )
        except Exception as e:
            logger.warning(f"JWT manager not available: {str(e)}")
            _jwt_manager = False
    return _jwt_manager if _jwt_manager is not False else None

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
    
    PHASE 2 ENHANCEMENTS:
    - DPoP validation (if enabled)
    - JWT token support (asymmetric signatures)
    - Scope and audience validation
    
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
    config = get_config()
    
    try:
        # PHASE 2: Try JWT validation first (if enabled)
        jwt_manager = get_jwt_manager_instance()
        if jwt_manager and getattr(config, 'use_jwt_tokens', False):
            is_valid, token_claims, error = jwt_manager.verify_token(session_token)
            
            if is_valid and token_claims:
                # Extract session data from JWT claims
                session_data = {
                    "assertion_id": token_claims.get("jti"),
                    "wallet_address": token_claims.get("sub"),
                    "expires_at": token_claims.get("exp"),
                    "expires_in": token_claims.get("exp") - int(time.time()) if token_claims.get("exp") else 0
                }
                
                # PHASE 2: DPoP validation (if enabled)
                dpop_header = request.headers.get("DPoP")
                if getattr(config, 'dpop_enabled', False):
                    if not dpop_header:
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="DPoP proof required but not provided",
                            headers={"WWW-Authenticate": 'DPoP'},
                        )
                    
                    # Validate DPoP proof
                    dpop_validator = get_dpop_validator_instance()
                    if dpop_validator:
                        expected_jkt = token_claims.get("cnf", {}).get("jkt") if isinstance(token_claims.get("cnf"), dict) else None
                        
                        is_valid_dpop, dpop_proof, dpop_error = dpop_validator.validate_dpop_proof(
                            dpop_header=dpop_header,
                            http_method=request.method,
                            http_uri=str(request.url),
                            access_token=session_token,
                            expected_jkt=expected_jkt
                        )
                        
                        if not is_valid_dpop:
                            raise HTTPException(
                                status_code=status.HTTP_401_UNAUTHORIZED,
                                detail=f"Invalid DPoP proof: {dpop_error}",
                                headers={"WWW-Authenticate": 'DPoP'},
                            )
                
                # Use JWT claims as session data
                full_session_data = token_claims
                
            else:
                # JWT validation failed, fall back to HMAC
                logger.debug(f"JWT validation failed: {error}, trying HMAC")
                authenticator: WCSAPAuthenticator = request.app.state.authenticator
                is_valid, session_data = authenticator.validate_session(session_token)
                
                if not is_valid or not session_data:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid or expired session token",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
                
                full_session_data = session_data
        
        else:
            # Use original HMAC validation
            authenticator: WCSAPAuthenticator = request.app.state.authenticator
            is_valid, session_data = authenticator.validate_session(session_token)
            
            if not is_valid or not session_data:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired session token",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            full_session_data = session_data
        
        # SECURITY ENHANCEMENT: Check revocation cache
        revocation_cache = get_revocation_cache_instance()
        if revocation_cache and revocation_cache.is_revoked(session_data["assertion_id"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session has been revoked",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Get full session from database (if using HMAC)
        db = get_database()
        session = db.get_session_by_token(session_token) if not jwt_manager or not getattr(config, 'use_jwt_tokens', False) else None
        
        if session:
            # Update last activity
            import time
            db.update_session_activity(session['assertion_id'], int(time.time()))
        
        # Return wallet information
        return {
            "address": session_data["wallet_address"],
            "assertion_id": session_data["assertion_id"],
            "expires_at": session_data["expires_at"],
            "expires_in": session_data["expires_in"],
            "session": session or full_session_data,
            "scope": full_session_data.get("scope", "profile") if isinstance(full_session_data, dict) else "profile"
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
