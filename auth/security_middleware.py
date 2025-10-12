"""
W-CSAP Security Middleware
===========================

Security headers, CSRF protection, error sanitization, and request validation.
Fixes LOW-001, LOW-002, LOW-003
"""

import secrets
import hmac
import hashlib
import time
import logging
from typing import Optional, Set, Callable
from fastapi import Request, HTTPException, status
from fastapi.responses import Response, JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import os

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Adds comprehensive security headers to all responses (OWASP compliance).
    Fixes LOW-002: Missing Security Headers
    """
    
    def __init__(self, app: ASGIApp, environment: str = "production"):
        super().__init__(app)
        self.environment = environment
        self.is_production = (environment == "production")
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Add security headers to response."""
        response = await call_next(request)
        
        # OWASP Security Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        if self.is_production:
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )
        
        # CSP
        csp = [
            "default-src 'none'",
            "script-src 'self'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self'",
            "connect-src 'self'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'"
        ]
        response.headers["Content-Security-Policy"] = "; ".join(csp)
        
        response.headers["Referrer-Policy"] = "no-referrer"
        
        # Permissions Policy
        permissions = [
            "geolocation=()",
            "microphone=()",
            "camera=()",
            "payment=()",
            "usb=()"
        ]
        response.headers["Permissions-Policy"] = ", ".join(permissions)
        
        # Remove server header
        response.headers.pop("Server", None)
        
        return response


class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """
    CSRF protection using double-submit cookie pattern.
    Fixes LOW-003: No CSRF Protection
    """
    
    PROTECTED_METHODS: Set[str] = {"POST", "PUT", "DELETE", "PATCH"}
    
    EXEMPT_PATHS: Set[str] = {
        "/api/auth/challenge",
        "/api/health",
        "/api/docs",
        "/api/openapi.json"
    }
    
    def __init__(
        self,
        app: ASGIApp,
        secret_key: str,
        token_header_name: str = "X-CSRF-Token",
        token_cookie_name: str = "csrf_token",
        cookie_secure: bool = True,
        cookie_httponly: bool = True,
        cookie_samesite: str = "strict"
    ):
        super().__init__(app)
        self.secret_key = secret_key.encode('utf-8')
        self.token_header_name = token_header_name
        self.token_cookie_name = token_cookie_name
        self.cookie_secure = cookie_secure
        self.cookie_httponly = cookie_httponly
        self.cookie_samesite = cookie_samesite
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Validate CSRF token for state-changing requests."""
        
        # Check if this endpoint requires CSRF protection
        if self._should_validate_csrf(request):
            if not self._validate_csrf_token(request):
                logger.warning(
                    f"CSRF validation failed for {request.method} {request.url.path}"
                )
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={
                        "error": "csrf_token_invalid",
                        "message": "CSRF token validation failed"
                    }
                )
        
        # Process request
        response = await call_next(request)
        
        # Add CSRF token to response if not present
        if self.token_cookie_name not in request.cookies:
            csrf_token = self._generate_csrf_token()
            response.set_cookie(
                key=self.token_cookie_name,
                value=csrf_token,
                secure=self.cookie_secure,
                httponly=self.cookie_httponly,
                samesite=self.cookie_samesite,
                max_age=3600
            )
        
        return response
    
    def _should_validate_csrf(self, request: Request) -> bool:
        """Check if request requires CSRF validation."""
        if request.method not in self.PROTECTED_METHODS:
            return False
        
        if request.url.path in self.EXEMPT_PATHS:
            return False
        
        for exempt_path in self.EXEMPT_PATHS:
            if request.url.path.startswith(exempt_path):
                return False
        
        return True
    
    def _generate_csrf_token(self) -> str:
        """Generate a new CSRF token."""
        random_bytes = secrets.token_bytes(32)
        timestamp = str(int(time.time())).encode('utf-8')
        
        signature = hmac.new(
            self.secret_key,
            random_bytes + timestamp,
            hashlib.sha256
        ).hexdigest()
        
        token = f"{timestamp.decode()}.{random_bytes.hex()}.{signature}"
        return token
    
    def _validate_csrf_token(self, request: Request) -> bool:
        """Validate CSRF token from request."""
        try:
            token_header = request.headers.get(self.token_header_name)
            if not token_header:
                return False
            
            token_cookie = request.cookies.get(self.token_cookie_name)
            if not token_cookie:
                return False
            
            if not hmac.compare_digest(token_header, token_cookie):
                return False
            
            parts = token_cookie.split('.')
            if len(parts) != 3:
                return False
            
            timestamp_str, random_hex, signature = parts
            
            try:
                token_timestamp = int(timestamp_str)
                current_timestamp = int(time.time())
                
                if current_timestamp - token_timestamp > 3600:
                    return False
            except ValueError:
                return False
            
            random_bytes = bytes.fromhex(random_hex)
            expected_signature = hmac.new(
                self.secret_key,
                random_bytes + timestamp_str.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            if not hmac.compare_digest(signature, expected_signature):
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"CSRF validation error: {str(e)}")
            return False


class ProductionErrorSanitizerMiddleware(BaseHTTPMiddleware):
    """
    Sanitizes error messages in production.
    Fixes LOW-001: Verbose Error Messages
    """
    
    def __init__(self, app: ASGIApp, environment: str = "production"):
        super().__init__(app)
        self.is_production = (environment == "production")
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Sanitize error responses in production."""
        try:
            response = await call_next(request)
            
            if self.is_production and response.status_code >= 400:
                response.headers.pop("X-Debug-Info", None)
                response.headers.pop("X-Exception", None)
            
            return response
            
        except Exception as e:
            logger.error(f"Unhandled exception: {str(e)}", exc_info=True)
            
            if self.is_production:
                return JSONResponse(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    content={
                        "error": "internal_server_error",
                        "message": "An internal error occurred. Please try again later."
                    }
                )
            else:
                return JSONResponse(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    content={
                        "error": "internal_server_error",
                        "message": str(e),
                        "type": type(e).__name__
                    }
                )


class RequestValidationMiddleware(BaseHTTPMiddleware):
    """
    Validates and sanitizes incoming requests.
    """
    
    MAX_REQUEST_SIZE = 10 * 1024 * 1024  # 10 MB
    MAX_HEADER_SIZE = 8 * 1024  # 8 KB
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Validate request before processing."""
        
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                size = int(content_length)
                if size > self.MAX_REQUEST_SIZE:
                    logger.warning(f"Request too large: {size} bytes")
                    return JSONResponse(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        content={"error": "request_too_large"}
                    )
            except ValueError:
                pass
        
        for header_name, header_value in request.headers.items():
            if len(header_value) > self.MAX_HEADER_SIZE:
                logger.warning(f"Header too large: {header_name}")
                return JSONResponse(
                    status_code=status.HTTP_431_REQUEST_HEADER_FIELDS_TOO_LARGE,
                    content={"error": "header_too_large"}
                )
        
        return await call_next(request)


def get_security_middleware(
    app: ASGIApp,
    secret_key: str,
    environment: str = "production"
) -> list:
    """Get list of security middleware to apply."""
    return [
        SecurityHeadersMiddleware(app, environment),
        CSRFProtectionMiddleware(
            app,
            secret_key,
            cookie_secure=(environment == "production")
        ),
        ProductionErrorSanitizerMiddleware(app, environment),
        RequestValidationMiddleware(app)
    ]


__all__ = [
    'SecurityHeadersMiddleware',
    'CSRFProtectionMiddleware',
    'ProductionErrorSanitizerMiddleware',
    'RequestValidationMiddleware',
    'get_security_middleware'
]
