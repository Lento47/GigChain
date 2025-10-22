"""
API Response Wrapper Middleware
Standardizes all API responses with consistent format, timing, and error handling
"""

import time
import uuid
from typing import Any, Dict, Optional, List, Union
from datetime import datetime
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)


class APIError(BaseModel):
    """Standardized API error format"""
    code: str
    message: str
    details: Optional[List[Dict[str, str]]] = None
    suggestions: Optional[List[str]] = None


class APIMeta(BaseModel):
    """API response metadata"""
    timestamp: str
    request_id: str
    response_time_ms: Optional[float] = None
    pagination: Optional[Dict[str, Any]] = None
    version: str = "1.0"


class StandardAPIResponse(BaseModel):
    """Standardized API response format"""
    success: bool
    data: Optional[Any] = None
    meta: APIMeta
    error: Optional[APIError] = None


class APIResponseWrapper:
    """Handles standardizing API responses"""
    
    @staticmethod
    def success(
        data: Any = None,
        request_id: str = None,
        response_time_ms: float = None,
        pagination: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Create a successful API response"""
        return {
            "success": True,
            "data": data,
            "meta": {
                "timestamp": datetime.now().isoformat(),
                "request_id": request_id or str(uuid.uuid4()),
                "response_time_ms": response_time_ms,
                "pagination": pagination,
                "version": "1.0"
            },
            "error": None
        }
    
    @staticmethod
    def error(
        code: str,
        message: str,
        details: List[Dict[str, str]] = None,
        suggestions: List[str] = None,
        request_id: str = None,
        response_time_ms: float = None,
        status_code: int = 400
    ) -> JSONResponse:
        """Create an error API response"""
        return JSONResponse(
            status_code=status_code,
            content={
                "success": False,
                "data": None,
                "meta": {
                    "timestamp": datetime.now().isoformat(),
                    "request_id": request_id or str(uuid.uuid4()),
                    "response_time_ms": response_time_ms,
                    "version": "1.0"
                },
                "error": {
                    "code": code,
                    "message": message,
                    "details": details or [],
                    "suggestions": suggestions or []
                }
            }
        )


class ResponseTimingMiddleware:
    """Middleware to add response timing to all API responses"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        # Generate unique request ID
        request_id = str(uuid.uuid4())
        scope["request_id"] = request_id
        
        start_time = time.time()
        
        async def send_wrapper(message):
            if message["type"] == "http.response.body":
                # Calculate response time
                response_time_ms = round((time.time() - start_time) * 1000, 2)
                
                # Add timing and request ID to headers
                if "headers" not in message:
                    message["headers"] = []
                
                message["headers"].append([
                    b"x-response-time", 
                    str(response_time_ms).encode()
                ])
                message["headers"].append([
                    b"x-request-id", 
                    request_id.encode()
                ])
                
                # Add CORS and caching headers
                message["headers"].extend([
                    [b"cache-control", b"no-cache, no-store, must-revalidate"],
                    [b"pragma", b"no-cache"],
                    [b"expires", b"0"],
                    [b"x-content-type-options", b"nosniff"],
                ])
            
            await send(message)
        
        await self.app(scope, receive, send_wrapper)


def create_validation_error(
    field_errors: Dict[str, str],
    request_id: str = None,
    response_time_ms: float = None
) -> JSONResponse:
    """Create validation error response with field-specific details"""
    details = [
        {"field": field, "message": message} 
        for field, message in field_errors.items()
    ]
    
    suggestions = [
        "Please check the highlighted fields",
        "Ensure all required fields are filled",
        "Verify the format of your input data"
    ]
    
    return APIResponseWrapper.error(
        code="VALIDATION_ERROR",
        message="Some fields need attention",
        details=details,
        suggestions=suggestions,
        request_id=request_id,
        response_time_ms=response_time_ms,
        status_code=422
    )


def create_auth_error(
    message: str = "Authentication required",
    request_id: str = None,
    response_time_ms: float = None
) -> JSONResponse:
    """Create authentication error response"""
    suggestions = [
        "Please log in to your account",
        "Check your wallet connection",
        "Verify your authentication token"
    ]
    
    return APIResponseWrapper.error(
        code="AUTH_ERROR",
        message=message,
        suggestions=suggestions,
        request_id=request_id,
        response_time_ms=response_time_ms,
        status_code=401
    )


def create_not_found_error(
    resource: str = "Resource",
    request_id: str = None,
    response_time_ms: float = None
) -> JSONResponse:
    """Create not found error response"""
    suggestions = [
        f"Check if the {resource.lower()} exists",
        "Verify the ID or parameters",
        "Try refreshing the page"
    ]
    
    return APIResponseWrapper.error(
        code="NOT_FOUND",
        message=f"{resource} not found",
        suggestions=suggestions,
        request_id=request_id,
        response_time_ms=response_time_ms,
        status_code=404
    )


def create_rate_limit_error(
    retry_after: int = 60,
    request_id: str = None,
    response_time_ms: float = None
) -> JSONResponse:
    """Create rate limit error response"""
    suggestions = [
        f"Please wait {retry_after} seconds before trying again",
        "Reduce the frequency of your requests",
        "Contact support if you need higher limits"
    ]
    
    return APIResponseWrapper.error(
        code="RATE_LIMIT_EXCEEDED",
        message="Too many requests",
        suggestions=suggestions,
        request_id=request_id,
        response_time_ms=response_time_ms,
        status_code=429
    )


def create_server_error(
    message: str = "An unexpected error occurred",
    request_id: str = None,
    response_time_ms: float = None
) -> JSONResponse:
    """Create server error response"""
    suggestions = [
        "Please try again in a few moments",
        "If the problem persists, contact support",
        "Check your internet connection"
    ]
    
    return APIResponseWrapper.error(
        code="INTERNAL_ERROR",
        message=message,
        suggestions=suggestions,
        request_id=request_id,
        response_time_ms=response_time_ms,
        status_code=500
    )


# Response helper functions for common use cases
def paginated_response(
    data: List[Any],
    total: int,
    page: int = 1,
    per_page: int = 20,
    request_id: str = None,
    response_time_ms: float = None
) -> Dict[str, Any]:
    """Create paginated response"""
    total_pages = (total + per_page - 1) // per_page
    
    pagination = {
        "page": page,
        "per_page": per_page,
        "total": total,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1
    }
    
    return APIResponseWrapper.success(
        data=data,
        request_id=request_id,
        response_time_ms=response_time_ms,
        pagination=pagination
    )


def created_response(
    data: Any,
    request_id: str = None,
    response_time_ms: float = None
) -> JSONResponse:
    """Create 201 Created response"""
    response_data = APIResponseWrapper.success(
        data=data,
        request_id=request_id,
        response_time_ms=response_time_ms
    )
    
    return JSONResponse(
        status_code=201,
        content=response_data
    )


def no_content_response(
    request_id: str = None,
    response_time_ms: float = None
) -> JSONResponse:
    """Create 204 No Content response"""
    response_data = APIResponseWrapper.success(
        data=None,
        request_id=request_id,
        response_time_ms=response_time_ms
    )
    
    return JSONResponse(
        status_code=204,
        content=response_data
    )
