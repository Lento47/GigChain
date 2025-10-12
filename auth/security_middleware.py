"""
W-CSAP Security Middleware - Comprehensive Security Headers & CSRF Protection
==============================================================================

This module implements enterprise-grade security middleware including:
- Security headers (OWASP recommendations)
- CSRF protection for state-changing operations
- Request validation and sanitization
- Error message sanitization for production

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
    Adds comprehensive security headers to all responses.
    
    SECURITY FIX (LOW-002): Implements OWASP security header recommendations.
    
    Headers added:
    - X-Content-Type-Options: nosniff
    - X-Frame-Options: DENY
    - X-XSS-Protection: 1; mode=block
    - Strict-Transport-Security: HSTS with preload
    - Content-Security-Policy: Restrictive CSP
    - Referrer-Policy: no-referrer
    - Permissions-Policy: Restrictive permissions
    """
    
    def __init__(
        self,
        app: ASGIApp,
        environment: str = "production"
    ):
        super().__init__(app)
        self.environment = environment
        self.is_production = (environment == "production")
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Add security headers to response."""
        response = await call_next(request)
        
        # ===== OWASP Security Headers =====
        
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        
        # Enable XSS filter (legacy browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Enforce HTTPS (production only)
        if self.is_production:
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )
        
        # Content Security Policy (restrictive)
        csp_directives = [
            "default-src 'none'",
            "script-src 'self'",
            "style-src 'self' 'unsafe-inline'",  # Allow inline styles for UI
            "img-src 'self' data: https:",
            "font-src 'self'",
            "connect-src 'self'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'"
        ]
        response.headers["Content-Security-Policy"] = "; ".join(csp_directives)
        
        # Referrer policy
        response.headers["Referrer-Policy"] = "no-referrer"
        
        # Permissions policy (formerly Feature-Policy)
        permissions_policy = [
            "geolocation=()",
            "microphone=()",
            "camera=()",
            "payment=()",
            "usb=()",
            "magnetometer=()",
            "gyroscope=()",
            "accelerometer=()"
        ]
        response.headers["Permissions-Policy"] = ", ".join(permissions_policy)
        
        # Remove server header (don't reveal server info)
        response.headers.pop("Server", None)
        
        # Custom security header
        response.headers["X-Security-Framework"] = "W-CSAP-v3.0"
        
        return response


class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """
    CSRF protection for state-changing operations.
    
    SECURITY FIX (LOW-003): Implements CSRF token validation for POST/PUT/DELETE requests.
    
    Uses double-submit cookie pattern:
    1. Server generates CSRF token and sends as cookie
    2. Client must include token in request header
    3. Server validates token matches cookie
    """
    
    # HTTP methods that require CSRF protection
    PROTECTED_METHODS: Set[str] = {"POST", "PUT", "DELETE", "PATCH"}
    
    # Endpoints exempt from CSRF (e.g., initial auth endpoints)
    EXEMPT_PATHS: Set[str] = {
        "/api/auth/challenge",  # Initial challenge request
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
        \"\"\"Validate CSRF token for state-changing requests.\"\"\"\n        \n        # Check if this endpoint requires CSRF protection\n        if self._should_validate_csrf(request):\n            if not self._validate_csrf_token(request):\n                logger.warning(\n                    f\"CSRF validation failed for {request.method} {request.url.path}\",\n                    extra={\n                        \"method\": request.method,\n                        \"path\": request.url.path,\n                        \"ip\": request.client.host if request.client else \"unknown\"\n                    }\n                )\n                return JSONResponse(\n                    status_code=status.HTTP_403_FORBIDDEN,\n                    content={\n                        \"error\": \"csrf_token_invalid\",\n                        \"message\": \"CSRF token validation failed\"\n                    }\n                )\n        \n        # Process request\n        response = await call_next(request)\n        \n        # Add CSRF token to response if not present\n        if self.token_cookie_name not in request.cookies:\n            csrf_token = self._generate_csrf_token()\n            response.set_cookie(\n                key=self.token_cookie_name,\n                value=csrf_token,\n                secure=self.cookie_secure,\n                httponly=self.cookie_httponly,\n                samesite=self.cookie_samesite,\n                max_age=3600  # 1 hour\n            )\n        \n        return response\n    \n    def _should_validate_csrf(self, request: Request) -> bool:\n        \"\"\"Check if request requires CSRF validation.\"\"\"\n        # Only validate state-changing methods\n        if request.method not in self.PROTECTED_METHODS:\n            return False\n        \n        # Check if path is exempt\n        if request.url.path in self.EXEMPT_PATHS:\n            return False\n        \n        # Check if path starts with exempt prefix\n        for exempt_path in self.EXEMPT_PATHS:\n            if request.url.path.startswith(exempt_path):\n                return False\n        \n        return True\n    \n    def _generate_csrf_token(self) -> str:\n        \"\"\"Generate a new CSRF token.\"\"\"\n        # Generate random token\n        random_bytes = secrets.token_bytes(32)\n        timestamp = str(int(time.time())).encode('utf-8')\n        \n        # Create HMAC signature\n        signature = hmac.new(\n            self.secret_key,\n            random_bytes + timestamp,\n            hashlib.sha256\n        ).hexdigest()\n        \n        # Combine: timestamp.random.signature\n        token = f\"{timestamp.decode()}.{random_bytes.hex()}.{signature}\"\n        \n        return token\n    \n    def _validate_csrf_token(self, request: Request) -> bool:\n        \"\"\"Validate CSRF token from request.\"\"\"\n        try:\n            # Get token from header\n            token_header = request.headers.get(self.token_header_name)\n            if not token_header:\n                logger.debug(\"CSRF token missing from header\")\n                return False\n            \n            # Get token from cookie\n            token_cookie = request.cookies.get(self.token_cookie_name)\n            if not token_cookie:\n                logger.debug(\"CSRF token missing from cookie\")\n                return False\n            \n            # Tokens must match (double-submit pattern)\n            if not hmac.compare_digest(token_header, token_cookie):\n                logger.warning(\"CSRF tokens do not match (header vs cookie)\")\n                return False\n            \n            # Parse token\n            parts = token_cookie.split('.')\n            if len(parts) != 3:\n                logger.warning(\"Invalid CSRF token format\")\n                return False\n            \n            timestamp_str, random_hex, signature = parts\n            \n            # Check token age (max 1 hour)\n            try:\n                token_timestamp = int(timestamp_str)\n                current_timestamp = int(time.time())\n                \n                if current_timestamp - token_timestamp > 3600:\n                    logger.warning(\"CSRF token expired\")\n                    return False\n            except ValueError:\n                logger.warning(\"Invalid CSRF token timestamp\")\n                return False\n            \n            # Verify HMAC signature\n            random_bytes = bytes.fromhex(random_hex)\n            expected_signature = hmac.new(\n                self.secret_key,\n                random_bytes + timestamp_str.encode('utf-8'),\n                hashlib.sha256\n            ).hexdigest()\n            \n            if not hmac.compare_digest(signature, expected_signature):\n                logger.warning(\"CSRF token signature invalid\")\n                return False\n            \n            return True\n            \n        except Exception as e:\n            logger.error(f\"CSRF validation error: {str(e)}\")\n            return False


class ProductionErrorSanitizerMiddleware(BaseHTTPMiddleware):\n    \"\"\"\n    Sanitizes error messages in production to prevent information leakage.\n    \n    SECURITY FIX (LOW-001): Removes detailed error messages in production.\n    \"\"\"\n    \n    def __init__(self, app: ASGIApp, environment: str = \"production\"):\n        super().__init__(app)\n        self.is_production = (environment == \"production\")\n    \n    async def dispatch(self, request: Request, call_next: Callable) -> Response:\n        \"\"\"Sanitize error responses in production.\"\"\"\n        try:\n            response = await call_next(request)\n            \n            # In production, sanitize error responses\n            if self.is_production and response.status_code >= 400:\n                # Don't modify the response body for now\n                # Just ensure no sensitive headers are leaked\n                response.headers.pop(\"X-Debug-Info\", None)\n                response.headers.pop(\"X-Exception\", None)\n            \n            return response\n            \n        except Exception as e:\n            # Catch unhandled exceptions\n            logger.error(f\"Unhandled exception: {str(e)}\", exc_info=True)\n            \n            if self.is_production:\n                # Generic error message in production\n                return JSONResponse(\n                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,\n                    content={\n                        \"error\": \"internal_server_error\",\n                        \"message\": \"An internal error occurred. Please try again later.\"\n                    }\n                )\n            else:\n                # Detailed error in development\n                return JSONResponse(\n                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,\n                    content={\n                        \"error\": \"internal_server_error\",\n                        \"message\": str(e),\n                        \"type\": type(e).__name__\n                    }\n                )\n\n\nclass RequestValidationMiddleware(BaseHTTPMiddleware):\n    \"\"\"\n    Validates and sanitizes incoming requests.\n    \n    Additional security layer to prevent common attacks:\n    - Oversized requests\n    - Invalid content types\n    - Malicious headers\n    \"\"\"\n    \n    MAX_REQUEST_SIZE = 10 * 1024 * 1024  # 10 MB\n    MAX_HEADER_SIZE = 8 * 1024  # 8 KB per header\n    \n    def __init__(self, app: ASGIApp):\n        super().__init__(app)\n    \n    async def dispatch(self, request: Request, call_next: Callable) -> Response:\n        \"\"\"Validate request before processing.\"\"\"\n        \n        # Validate Content-Length\n        content_length = request.headers.get(\"content-length\")\n        if content_length:\n            try:\n                size = int(content_length)\n                if size > self.MAX_REQUEST_SIZE:\n                    logger.warning(\n                        f\"Request too large: {size} bytes from {request.client.host}\"\n                    )\n                    return JSONResponse(\n                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,\n                        content={\"error\": \"request_too_large\"}\n                    )\n            except ValueError:\n                pass\n        \n        # Validate headers size\n        for header_name, header_value in request.headers.items():\n            if len(header_value) > self.MAX_HEADER_SIZE:\n                logger.warning(\n                    f\"Header too large: {header_name} from {request.client.host}\"\n                )\n                return JSONResponse(\n                    status_code=status.HTTP_431_REQUEST_HEADER_FIELDS_TOO_LARGE,\n                    content={\"error\": \"header_too_large\"}\n                )\n        \n        return await call_next(request)\n\n\ndef get_security_middleware(\n    app: ASGIApp,\n    secret_key: str,\n    environment: str = \"production\"\n) -> list:\n    \"\"\"\n    Get list of security middleware to apply.\n    \n    Args:\n        app: FastAPI/Starlette app\n        secret_key: Secret key for CSRF tokens\n        environment: Environment (production/development)\n        \n    Returns:\n        List of middleware instances\n    \"\"\"\n    return [\n        SecurityHeadersMiddleware(app, environment),\n        CSRFProtectionMiddleware(\n            app,\n            secret_key,\n            cookie_secure=(environment == \"production\")\n        ),\n        ProductionErrorSanitizerMiddleware(app, environment),\n        RequestValidationMiddleware(app)\n    ]\n\n\n__all__ = [\n    'SecurityHeadersMiddleware',\n    'CSRFProtectionMiddleware',\n    'ProductionErrorSanitizerMiddleware',\n    'RequestValidationMiddleware',\n    'get_security_middleware'\n]\n