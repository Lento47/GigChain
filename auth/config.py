"""
W-CSAP Configuration Management
================================

Centralized configuration for WCSAP authentication system.
Handles environment variables, defaults, and validation.
"""

import os
import secrets
from typing import Optional
from pydantic import BaseSettings, Field, validator
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class WCSAPConfig(BaseSettings):
    """
    Configuration settings for W-CSAP authentication system.
    
    All settings can be overridden via environment variables with W_CSAP_ prefix.
    Example: W_CSAP_SECRET_KEY, W_CSAP_CHALLENGE_TTL, etc.
    """
    
    # ==================== Security Settings ====================
    
    secret_key: str = Field(
        default_factory=lambda: secrets.token_hex(32),
        description="Secret key for HMAC signing (REQUIRED in production)"
    )
    
    @validator('secret_key')
    def validate_secret_key(cls, v):
        """Ensure secret key is strong enough."""
        if len(v) < 32:
            logger.warning("⚠️ Secret key is too short! Use at least 32 characters.")
        return v
    
    # ==================== Time-to-Live Settings ====================
    
    challenge_ttl: int = Field(
        default=300,
        description="Challenge time-to-live in seconds (default: 5 minutes)",
        ge=60,  # Minimum 1 minute
        le=3600  # Maximum 1 hour
    )
    
    # SECURITY ENHANCEMENT: Shorter access token TTL
    access_token_ttl: int = Field(
        default=900,  # 15 minutes (enterprise-grade)
        description="Access token time-to-live in seconds (default: 15 minutes)",
        ge=300,  # Minimum 5 minutes
        le=3600  # Maximum 1 hour
    )
    
    # Legacy: kept for backward compatibility
    session_ttl: int = Field(
        default=86400,
        description="Session time-to-live in seconds (default: 24 hours) - DEPRECATED, use access_token_ttl",
        ge=300,  # Minimum 5 minutes
        le=2592000  # Maximum 30 days
    )
    
    # SECURITY ENHANCEMENT: Shorter, rotating refresh tokens
    refresh_ttl: int = Field(
        default=86400,  # 24 hours (enterprise-grade, down from 7 days)
        description="Refresh token time-to-live in seconds (default: 24 hours)",
        ge=3600,  # Minimum 1 hour
        le=604800  # Maximum 7 days
    )
    
    # SECURITY ENHANCEMENT: Refresh token rotation
    refresh_token_rotation: bool = Field(
        default=True,
        description="Enable refresh token rotation for enhanced security"
    )
    
    refresh_token_reuse_window: int = Field(
        default=60,
        description="Grace period (seconds) for duplicate refresh requests (race conditions)",
        ge=0,
        le=300
    )
    
    # ==================== Database Settings ====================
    
    db_path: str = Field(
        default="data/w_csap.db",
        description="Path to SQLite database file"
    )
    
    db_pool_size: int = Field(
        default=5,
        description="Database connection pool size",
        ge=1,
        le=50
    )
    
    # ==================== Rate Limiting Settings ====================
    
    rate_limit_enabled: bool = Field(
        default=True,
        description="Enable rate limiting for authentication attempts"
    )
    
    # SECURITY ENHANCEMENT: Granular rate limits per endpoint
    rate_limit_challenge: int = Field(
        default=5,
        description="Max challenge requests per window per IP",
        ge=1,
        le=100
    )
    
    rate_limit_verify: int = Field(
        default=5,
        description="Max verify requests per window per wallet",
        ge=1,
        le=100
    )
    
    rate_limit_refresh: int = Field(
        default=10,
        description="Max refresh requests per hour per wallet",
        ge=1,
        le=100
    )
    
    rate_limit_window_seconds: int = Field(
        default=300,
        description="Rate limit window in seconds (default: 5 minutes)",
        ge=60,
        le=3600
    )
    
    # SECURITY ENHANCEMENT: Burst allowance
    rate_limit_burst_allowance: int = Field(
        default=2,
        description="Additional requests allowed in burst",
        ge=0,
        le=10
    )
    
    # SECURITY ENHANCEMENT: Failed attempt lockout
    max_failed_attempts: int = Field(
        default=5,
        description="Max failed auth attempts before lockout",
        ge=3,
        le=20
    )
    
    lockout_duration_seconds: int = Field(
        default=900,
        description="Lockout duration in seconds (default: 15 minutes)",
        ge=300,
        le=3600
    )
    
    # ==================== Cleanup Settings ====================
    
    cleanup_enabled: bool = Field(
        default=True,
        description="Enable automatic cleanup of expired data"
    )
    
    cleanup_interval_seconds: int = Field(
        default=3600,
        description="Cleanup interval in seconds (default: 1 hour)",
        ge=300,
        le=86400
    )
    
    # ==================== Application Settings ====================
    
    app_name: str = Field(
        default="GigChain.io",
        description="Application name shown in challenge messages"
    )
    
    protocol_version: str = Field(
        default="1.0.0",
        description="W-CSAP protocol version"
    )
    
    # ==================== Security Features ====================
    
    session_binding_enabled: bool = Field(
        default=False,
        description="Bind sessions to IP address and user agent"
    )
    
    require_https: bool = Field(
        default=False,
        description="Require HTTPS for authentication endpoints (production: True)"
    )
    
    require_tls_13: bool = Field(
        default=False,
        description="Require TLS 1.3 minimum (production: True)"
    )
    
    audit_logging_enabled: bool = Field(
        default=True,
        description="Enable comprehensive audit logging"
    )
    
    # SECURITY ENHANCEMENT: Revocation
    revocation_enabled: bool = Field(
        default=True,
        description="Enable token revocation (denylist cache)"
    )
    
    revocation_cache_type: str = Field(
        default="memory",
        description="Revocation cache type: 'memory' or 'redis'"
    )
    
    revocation_cache_redis_url: Optional[str] = Field(
        default=None,
        description="Redis URL for revocation cache (if type=redis)"
    )
    
    # ==================== CORS Settings ====================
    
    allowed_origins: list = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173"
        ],
        description="Allowed CORS origins"
    )
    
    # ==================== Advanced Settings ====================
    
    enable_challenge_metadata: bool = Field(
        default=True,
        description="Include IP and user agent in challenge metadata"
    )
    
    enable_session_activity_tracking: bool = Field(
        default=True,
        description="Track last activity timestamp for sessions"
    )
    
    max_active_sessions_per_wallet: int = Field(
        default=5,
        description="Maximum concurrent sessions per wallet (0 = unlimited)",
        ge=0,
        le=100
    )
    
    class Config:
        env_prefix = "W_CSAP_"
        case_sensitive = False
        env_file = ".env"
        env_file_encoding = "utf-8"
    
    def validate_production_settings(self) -> list[str]:
        """
        Validate settings for production deployment.
        
        Returns:
            List of warning messages for insecure settings
        """
        warnings = []
        
        if self.secret_key == secrets.token_hex(32):
            warnings.append(
                "⚠️ Using auto-generated secret key! Set W_CSAP_SECRET_KEY environment variable."
            )
        
        if not self.require_https:
            warnings.append(
                "⚠️ HTTPS is not required! Set W_CSAP_REQUIRE_HTTPS=true in production."
            )
        
        if not self.rate_limit_enabled:
            warnings.append(
                "⚠️ Rate limiting is disabled! Enable it to prevent brute-force attacks."
            )
        
        if self.session_ttl > 86400:  # More than 24 hours
            warnings.append(
                f"⚠️ Session TTL is {self.session_ttl // 3600} hours. Consider reducing for security."
            )
        
        if not self.audit_logging_enabled:
            warnings.append(
                "⚠️ Audit logging is disabled! Enable it for security monitoring."
            )
        
        return warnings
    
    def get_summary(self) -> dict:
        """Get configuration summary."""
        return {
            "app_name": self.app_name,
            "protocol_version": self.protocol_version,
            "challenge_ttl": f"{self.challenge_ttl}s ({self.challenge_ttl // 60}m)",
            "session_ttl": f"{self.session_ttl}s ({self.session_ttl // 3600}h)",
            "refresh_ttl": f"{self.refresh_ttl}s ({self.refresh_ttl // 86400}d)",
            "rate_limiting": "enabled" if self.rate_limit_enabled else "disabled",
            "cleanup": "enabled" if self.cleanup_enabled else "disabled",
            "session_binding": "enabled" if self.session_binding_enabled else "disabled",
            "audit_logging": "enabled" if self.audit_logging_enabled else "disabled",
            "database": self.db_path,
        }


# Singleton instance
_config_instance: Optional[WCSAPConfig] = None


def get_config() -> WCSAPConfig:
    """
    Get or create configuration singleton instance.
    
    Returns:
        WCSAPConfig instance
    """
    global _config_instance
    if _config_instance is None:
        _config_instance = WCSAPConfig()
        
        # Log configuration summary
        logger.info("🔧 W-CSAP Configuration loaded:")
        for key, value in _config_instance.get_summary().items():
            logger.info(f"  {key}: {value}")
        
        # Check for production warnings
        warnings = _config_instance.validate_production_settings()
        if warnings:
            logger.warning("⚠️ Production security warnings:")
            for warning in warnings:
                logger.warning(f"  {warning}")
    
    return _config_instance


def reset_config():
    """Reset configuration singleton (useful for testing)."""
    global _config_instance
    _config_instance = None


# Export convenience function
def load_config(**kwargs) -> WCSAPConfig:
    """
    Load configuration with optional overrides.
    
    Args:
        **kwargs: Configuration overrides
        
    Returns:
        WCSAPConfig instance
    """
    global _config_instance
    _config_instance = WCSAPConfig(**kwargs)
    return _config_instance


__all__ = [
    'WCSAPConfig',
    'get_config',
    'reset_config',
    'load_config'
]
