"""
W-CSAP Error Handling
=====================

Standardized error codes, exceptions, and error response utilities.
"""

from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from enum import Enum
import time


class WCSAPErrorCode(str, Enum):
    """Standardized error codes for W-CSAP authentication."""
    
    # Challenge errors (1xxx)
    CHALLENGE_NOT_FOUND = "CHALLENGE_NOT_FOUND"
    CHALLENGE_EXPIRED = "CHALLENGE_EXPIRED"
    CHALLENGE_ALREADY_USED = "CHALLENGE_ALREADY_USED"
    CHALLENGE_GENERATION_FAILED = "CHALLENGE_GENERATION_FAILED"
    
    # Signature errors (2xxx)
    INVALID_SIGNATURE = "INVALID_SIGNATURE"
    SIGNATURE_VERIFICATION_FAILED = "SIGNATURE_VERIFICATION_FAILED"
    WALLET_MISMATCH = "WALLET_MISMATCH"
    
    # Session errors (3xxx)
    SESSION_NOT_FOUND = "SESSION_NOT_FOUND"
    SESSION_EXPIRED = "SESSION_EXPIRED"
    SESSION_INVALID = "SESSION_INVALID"
    INVALID_SESSION_TOKEN = "INVALID_SESSION_TOKEN"
    INVALID_REFRESH_TOKEN = "INVALID_REFRESH_TOKEN"
    SESSION_REFRESH_FAILED = "SESSION_REFRESH_FAILED"
    
    # Rate limiting errors (4xxx)
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    TOO_MANY_ATTEMPTS = "TOO_MANY_ATTEMPTS"
    
    # Authentication errors (5xxx)
    AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED"
    UNAUTHORIZED = "UNAUTHORIZED"
    MISSING_CREDENTIALS = "MISSING_CREDENTIALS"
    
    # Validation errors (6xxx)
    INVALID_WALLET_ADDRESS = "INVALID_WALLET_ADDRESS"
    INVALID_REQUEST = "INVALID_REQUEST"
    MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD"
    
    # System errors (9xxx)
    INTERNAL_ERROR = "INTERNAL_ERROR"
    DATABASE_ERROR = "DATABASE_ERROR"
    CONFIGURATION_ERROR = "CONFIGURATION_ERROR"


class WCSAPException(Exception):
    """Base exception for W-CSAP authentication errors."""
    
    def __init__(
        self,
        code: WCSAPErrorCode,
        message: str,
        http_status: int = status.HTTP_400_BAD_REQUEST,
        field: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.code = code
        self.message = message
        self.http_status = http_status
        self.field = field
        self.details = details or {}
        super().__init__(message)
    
    def to_dict(self) -> dict:
        """Convert exception to dictionary for JSON response."""
        error_dict = {
            "success": False,
            "error": {
                "code": self.code.value,
                "message": self.message,
            },
            "timestamp": int(time.time())
        }
        
        if self.field:
            error_dict["error"]["field"] = self.field
        
        if self.details:
            error_dict["error"]["details"] = self.details
        
        return error_dict
    
    def to_http_exception(self) -> HTTPException:
        """Convert to FastAPI HTTPException."""
        return HTTPException(
            status_code=self.http_status,
            detail=self.to_dict()
        )


# ==================== Specific Exceptions ====================

class ChallengeNotFoundException(WCSAPException):
    """Challenge not found in database."""
    
    def __init__(self, challenge_id: str):
        super().__init__(
            code=WCSAPErrorCode.CHALLENGE_NOT_FOUND,
            message=f"Challenge not found or already consumed",
            http_status=status.HTTP_404_NOT_FOUND,
            details={"challenge_id": challenge_id[:16] + "..."}
        )


class ChallengeExpiredException(WCSAPException):
    """Challenge has expired."""
    
    def __init__(self, challenge_id: str, expired_at: int):
        super().__init__(
            code=WCSAPErrorCode.CHALLENGE_EXPIRED,
            message="Challenge has expired. Please request a new challenge.",
            http_status=status.HTTP_400_BAD_REQUEST,
            details={
                "challenge_id": challenge_id[:16] + "...",
                "expired_at": expired_at
            }
        )


class InvalidSignatureException(WCSAPException):
    """Signature verification failed."""
    
    def __init__(self, expected_address: Optional[str] = None, recovered_address: Optional[str] = None):
        details = {}
        if expected_address:
            details["expected_address"] = expected_address[:10] + "..."
        if recovered_address:
            details["recovered_address"] = recovered_address[:10] + "..."
        
        super().__init__(
            code=WCSAPErrorCode.INVALID_SIGNATURE,
            message="Signature verification failed. The signature doesn't match the wallet address.",
            http_status=status.HTTP_401_UNAUTHORIZED,
            field="signature",
            details=details
        )


class SessionExpiredException(WCSAPException):
    """Session has expired."""
    
    def __init__(self, expired_at: int):
        super().__init__(
            code=WCSAPErrorCode.SESSION_EXPIRED,
            message="Session has expired. Please authenticate again or use refresh token.",
            http_status=status.HTTP_401_UNAUTHORIZED,
            details={"expired_at": expired_at}
        )


class SessionNotFoundException(WCSAPException):
    """Session not found."""
    
    def __init__(self):
        super().__init__(
            code=WCSAPErrorCode.SESSION_NOT_FOUND,
            message="Session not found. Please authenticate again.",
            http_status=status.HTTP_404_NOT_FOUND
        )


class InvalidSessionTokenException(WCSAPException):
    """Session token is invalid."""
    
    def __init__(self, reason: Optional[str] = None):
        details = {"reason": reason} if reason else {}
        super().__init__(
            code=WCSAPErrorCode.INVALID_SESSION_TOKEN,
            message="Invalid session token format or signature.",
            http_status=status.HTTP_401_UNAUTHORIZED,
            field="session_token",
            details=details
        )


class RateLimitExceededException(WCSAPException):
    """Rate limit exceeded."""
    
    def __init__(self, retry_after: int, attempts: int, max_attempts: int):
        super().__init__(
            code=WCSAPErrorCode.RATE_LIMIT_EXCEEDED,
            message=f"Too many authentication attempts. Please try again in {retry_after} seconds.",
            http_status=status.HTTP_429_TOO_MANY_REQUESTS,
            details={
                "retry_after": retry_after,
                "attempts": attempts,
                "max_attempts": max_attempts
            }
        )


class InvalidWalletAddressException(WCSAPException):
    """Invalid wallet address format."""
    
    def __init__(self, wallet_address: str):
        super().__init__(
            code=WCSAPErrorCode.INVALID_WALLET_ADDRESS,
            message="Invalid Ethereum wallet address format.",
            http_status=status.HTTP_400_BAD_REQUEST,
            field="wallet_address",
            details={"provided": wallet_address}
        )


class UnauthorizedException(WCSAPException):
    """User is not authenticated."""
    
    def __init__(self, message: str = "Authentication required"):
        super().__init__(
            code=WCSAPErrorCode.UNAUTHORIZED,
            message=message,
            http_status=status.HTTP_401_UNAUTHORIZED
        )


class InternalErrorException(WCSAPException):
    """Internal server error."""
    
    def __init__(self, message: str = "An internal error occurred"):
        super().__init__(
            code=WCSAPErrorCode.INTERNAL_ERROR,
            message=message,
            http_status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ==================== Error Utilities ====================

def create_error_response(
    code: WCSAPErrorCode,
    message: str,
    field: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    request_id: Optional[str] = None
) -> dict:
    """
    Create standardized error response.
    
    Args:
        code: Error code
        message: Human-readable error message
        field: Field that caused the error (optional)
        details: Additional error details (optional)
        request_id: Request ID for tracking (optional)
        
    Returns:
        Error response dictionary
    """
    error_response = {
        "success": False,
        "error": {
            "code": code.value,
            "message": message
        },
        "timestamp": int(time.time())
    }
    
    if field:
        error_response["error"]["field"] = field
    
    if details:
        error_response["error"]["details"] = details
    
    if request_id:
        error_response["request_id"] = request_id
    
    return error_response


def create_success_response(
    data: Dict[str, Any],
    message: Optional[str] = None
) -> dict:
    """
    Create standardized success response.
    
    Args:
        data: Response data
        message: Optional success message
        
    Returns:
        Success response dictionary
    """
    response = {
        "success": True,
        **data
    }
    
    if message:
        response["message"] = message
    
    return response


# ==================== Exception Handlers ====================

async def wcsap_exception_handler(request, exc: WCSAPException):
    """
    Global exception handler for WCSAPException.
    
    Usage in FastAPI:
        app.add_exception_handler(WCSAPException, wcsap_exception_handler)
    """
    from fastapi.responses import JSONResponse
    
    return JSONResponse(
        status_code=exc.http_status,
        content=exc.to_dict()
    )


__all__ = [
    # Enum
    'WCSAPErrorCode',
    
    # Base exception
    'WCSAPException',
    
    # Specific exceptions
    'ChallengeNotFoundException',
    'ChallengeExpiredException',
    'InvalidSignatureException',
    'SessionExpiredException',
    'SessionNotFoundException',
    'InvalidSessionTokenException',
    'RateLimitExceededException',
    'InvalidWalletAddressException',
    'UnauthorizedException',
    'InternalErrorException',
    
    # Utilities
    'create_error_response',
    'create_success_response',
    'wcsap_exception_handler'
]
