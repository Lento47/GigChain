"""
W-CSAP Standardized Request/Response Schemas
=============================================

Pydantic models for consistent API contracts across all WCSAP authentication endpoints.
These schemas ensure type safety, validation, and clear API documentation.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from web3 import Web3


# ==================== Request Models ====================

class AuthChallengeRequest(BaseModel):
    """Request model for initiating authentication challenge."""
    
    wallet_address: str = Field(
        ...,
        description="Ethereum wallet address",
        example="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
    )
    
    @validator('wallet_address')
    def validate_wallet_address(cls, v):
        """Validate Ethereum address format."""
        try:
            # Normalize to checksum address
            return Web3.to_checksum_address(v)
        except Exception:
            raise ValueError("Invalid Ethereum address format")
    
    class Config:
        json_schema_extra = {
            "example": {
                "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
            }
        }


class AuthVerifyRequest(BaseModel):
    """Request model for verifying signed challenge."""
    
    challenge_id: str = Field(
        ...,
        description="Challenge ID from challenge response",
        example="a1b2c3d4e5f6..."
    )
    
    signature: str = Field(
        ...,
        description="Hex-encoded signature from wallet",
        example="0xabcdef..."
    )
    
    wallet_address: str = Field(
        ...,
        description="Wallet address that signed the challenge",
        example="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
    )
    
    @validator('wallet_address')
    def validate_wallet_address(cls, v):
        """Validate Ethereum address format."""
        try:
            return Web3.to_checksum_address(v)
        except Exception:
            raise ValueError("Invalid Ethereum address format")
    
    @validator('signature')
    def validate_signature(cls, v):
        """Validate signature format."""
        if not v.startswith('0x'):
            raise ValueError("Signature must start with 0x")
        if len(v) < 130:  # 0x + 65 bytes * 2
            raise ValueError("Invalid signature length")
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "challenge_id": "a1b2c3d4e5f6789...",
                "signature": "0xabcdef123456...",
                "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
            }
        }


class AuthRefreshRequest(BaseModel):
    """Request model for refreshing session."""
    
    refresh_token: str = Field(
        ...,
        description="Refresh token from original authentication"
    )
    
    session_token: str = Field(
        ...,
        description="Expired or expiring session token"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "refresh_token": "refresh_token_hash...",
                "session_token": "assertion.wallet.expires.hmac"
            }
        }


class AuthLogoutRequest(BaseModel):
    """Request model for logout (optional body, can also use header token)."""
    
    session_token: Optional[str] = Field(
        None,
        description="Session token to invalidate (optional if in Authorization header)"
    )


# ==================== Response Models ====================

class AuthChallengeResponse(BaseModel):
    """Response model for authentication challenge."""
    
    success: bool = Field(True, description="Operation success status")
    challenge_id: str = Field(..., description="Unique challenge identifier")
    wallet_address: str = Field(..., description="Normalized wallet address")
    challenge_message: str = Field(..., description="Message to be signed by wallet")
    nonce: str = Field(..., description="Cryptographic nonce")
    issued_at: int = Field(..., description="Unix timestamp of issuance")
    expires_at: int = Field(..., description="Unix timestamp of expiry")
    expires_in: int = Field(..., description="Seconds until expiry")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "challenge_id": "a1b2c3d4e5f6...",
                "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
                "challenge_message": "🔐 GigChain.io - Wallet Authentication\n\nSign this message...",
                "nonce": "abc123...",
                "issued_at": 1704123456,
                "expires_at": 1704123756,
                "expires_in": 300,
                "metadata": {
                    "app_name": "GigChain.io",
                    "version": "1.0.0"
                }
            }
        }


class SessionData(BaseModel):
    """Session information model."""
    
    assertion_id: str = Field(..., description="Unique session assertion ID")
    wallet_address: str = Field(..., description="Authenticated wallet address")
    session_token: str = Field(..., description="Session token for API requests")
    refresh_token: str = Field(..., description="Token for refreshing session")
    issued_at: int = Field(..., description="Unix timestamp of issuance")
    expires_at: int = Field(..., description="Unix timestamp of expiry")
    expires_in: int = Field(..., description="Seconds until expiry")
    not_before: int = Field(..., description="Unix timestamp before which token is invalid")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Session metadata")


class AuthVerifyResponse(BaseModel):
    """Response model for signature verification."""
    
    success: bool = Field(..., description="Authentication success status")
    message: str = Field(..., description="Human-readable message")
    session: Optional[SessionData] = Field(None, description="Session data if successful")
    error: Optional[str] = Field(None, description="Error message if failed")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Authentication successful",
                "session": {
                    "assertion_id": "assertion123...",
                    "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
                    "session_token": "assertion.wallet.expires.hmac",
                    "refresh_token": "refresh_token_hash",
                    "issued_at": 1704123456,
                    "expires_at": 1704209856,
                    "expires_in": 86400,
                    "not_before": 1704123456,
                    "metadata": {
                        "protocol": "W-CSAP",
                        "auth_method": "wallet_signature"
                    }
                }
            }
        }


class AuthStatusResponse(BaseModel):
    """Response model for authentication status check."""
    
    authenticated: bool = Field(..., description="Whether user is authenticated")
    wallet_address: Optional[str] = Field(None, description="Wallet address if authenticated")
    expires_at: Optional[int] = Field(None, description="Session expiry timestamp")
    expires_in: Optional[int] = Field(None, description="Seconds until expiry")
    session_info: Optional[Dict[str, Any]] = Field(None, description="Additional session info")
    
    class Config:
        json_schema_extra = {
            "example": {
                "authenticated": True,
                "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
                "expires_at": 1704209856,
                "expires_in": 85000,
                "session_info": {
                    "last_activity": 1704123500,
                    "ip_address": "127.0.0.1"
                }
            }
        }


class AuthRefreshResponse(BaseModel):
    """Response model for session refresh."""
    
    success: bool = Field(..., description="Refresh success status")
    message: str = Field(..., description="Human-readable message")
    session: Optional[SessionData] = Field(None, description="New session data if successful")
    error: Optional[str] = Field(None, description="Error message if failed")


class AuthLogoutResponse(BaseModel):
    """Response model for logout."""
    
    success: bool = Field(..., description="Logout success status")
    message: str = Field(..., description="Human-readable message")


class SessionListItem(BaseModel):
    """Individual session in sessions list."""
    
    assertion_id: str
    issued_at: int
    expires_at: int
    last_activity: int
    ip_address: Optional[str]
    user_agent: Optional[str]
    status: str


class AuthSessionsResponse(BaseModel):
    """Response model for listing active sessions."""
    
    success: bool = Field(True, description="Operation success status")
    wallet_address: str = Field(..., description="Wallet address")
    sessions: List[SessionListItem] = Field(..., description="List of active sessions")
    total: int = Field(..., description="Total number of sessions")


class AuthStatsResponse(BaseModel):
    """Response model for authentication statistics."""
    
    success: bool = Field(True, description="Operation success status")
    statistics: Dict[str, Any] = Field(..., description="Authentication statistics")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "statistics": {
                    "active_sessions": 42,
                    "pending_challenges": 5,
                    "total_users": 120,
                    "recent_auth_events_24h": 234
                }
            }
        }


# ==================== Error Models ====================

class ErrorDetail(BaseModel):
    """Detailed error information."""
    
    code: str = Field(..., description="Error code")
    message: str = Field(..., description="Human-readable error message")
    field: Optional[str] = Field(None, description="Field that caused error (for validation)")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")


class AuthErrorResponse(BaseModel):
    """Standardized error response."""
    
    success: bool = Field(False, description="Always false for errors")
    error: ErrorDetail = Field(..., description="Error details")
    timestamp: int = Field(..., description="Unix timestamp of error")
    request_id: Optional[str] = Field(None, description="Request ID for tracking")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": False,
                "error": {
                    "code": "INVALID_SIGNATURE",
                    "message": "The provided signature is invalid or doesn't match the wallet address",
                    "field": "signature",
                    "details": {
                        "expected_address": "0x742d35...",
                        "recovered_address": "0x123456..."
                    }
                },
                "timestamp": 1704123456,
                "request_id": "req_abc123"
            }
        }


# ==================== Wallet Info Models ====================

class WalletInfo(BaseModel):
    """Standardized wallet information from get_current_wallet dependency."""
    
    address: str = Field(..., description="Wallet address")
    assertion_id: str = Field(..., description="Current session assertion ID")
    expires_at: int = Field(..., description="Session expiry timestamp")
    expires_in: int = Field(..., description="Seconds until expiry")
    session: Optional[Dict[str, Any]] = Field(None, description="Full session data")
    
    class Config:
        json_schema_extra = {
            "example": {
                "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
                "assertion_id": "assertion123...",
                "expires_at": 1704209856,
                "expires_in": 85000,
                "session": {
                    "last_activity": 1704123500
                }
            }
        }


# Export all models
__all__ = [
    # Request models
    'AuthChallengeRequest',
    'AuthVerifyRequest',
    'AuthRefreshRequest',
    'AuthLogoutRequest',
    
    # Response models
    'AuthChallengeResponse',
    'AuthVerifyResponse',
    'AuthStatusResponse',
    'AuthRefreshResponse',
    'AuthLogoutResponse',
    'AuthSessionsResponse',
    'AuthStatsResponse',
    
    # Component models
    'SessionData',
    'SessionListItem',
    'WalletInfo',
    
    # Error models
    'ErrorDetail',
    'AuthErrorResponse'
]
