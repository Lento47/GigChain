"""
W-CSAP Security Initialization Module
======================================

Secure initialization of all W-CSAP security components.
"""

import os
import sys
import logging
from typing import Optional
from fastapi import FastAPI

logger = logging.getLogger(__name__)


def validate_production_environment() -> bool:
    """
    Validate required security settings for production.
    
    Returns:
        True if all checks pass
    """
    errors = []
    warnings = []
    
    # Check secret key
    secret_key = os.getenv('W_CSAP_SECRET_KEY')
    if not secret_key:
        errors.append(
            "CRITICAL: W_CSAP_SECRET_KEY is NOT set! "
            "Generate with: python -c 'import secrets; print(secrets.token_hex(32))'"
        )
    elif len(secret_key) < 32:
        errors.append(
            f"CRITICAL: W_CSAP_SECRET_KEY is too short ({len(secret_key)} chars). "
            "Must be at least 32 characters."
        )
    
    # Check Redis
    redis_url = os.getenv('W_CSAP_REDIS_URL')
    if not redis_url:
        errors.append(
            "CRITICAL: W_CSAP_REDIS_URL is NOT set! "
            "Set to: redis://localhost:6379/0"
        )
    
    # Check HTTPS
    require_https = os.getenv('W_CSAP_REQUIRE_HTTPS', 'false').lower()
    if require_https != 'true':
        warnings.append(
            "WARNING: HTTPS not enforced. Set W_CSAP_REQUIRE_HTTPS=true in production"
        )
    
    # Check DPoP
    dpop_enabled = os.getenv('W_CSAP_DPOP_ENABLED', 'false').lower()
    if dpop_enabled != 'true':
        warnings.append(
            "WARNING: DPoP disabled. Enable for maximum security: W_CSAP_DPOP_ENABLED=true"
        )
    
    # Print results
    if errors:
        logger.critical("=" * 70)
        logger.critical("SECURITY VALIDATION FAILED")
        logger.critical("=" * 70)
        for error in errors:
            logger.critical(error)
        logger.critical("=" * 70)
        return False
    
    if warnings:
        logger.warning("=" * 70)
        logger.warning("SECURITY WARNINGS")
        logger.warning("=" * 70)
        for warning in warnings:
            logger.warning(warning)
        logger.warning("=" * 70)
    
    return True


def initialize_secure_session_storage(secret_key: str, redis_url: str):
    """Initialize encrypted Redis session storage."""
    try:
        from auth.secure_session_store import get_session_store
        
        logger.info("Initializing encrypted session storage...")
        session_store = get_session_store(redis_url, secret_key)
        
        # Test connection
        health = session_store.health_check()
        if health["status"] != "healthy":
            raise RuntimeError(f"Session store unhealthy: {health}")
        
        logger.info(
            f"Encrypted session storage initialized: "
            f"{health['encryption']}, {health['key_derivation']}"
        )
        
        return session_store
        
    except Exception as e:
        logger.critical(f"Failed to initialize session storage: {str(e)}")
        raise


def initialize_global_rate_limiter(redis_url: str):
    """Initialize global rate limiter."""
    try:
        from auth.global_rate_limiter import get_rate_limiter, RateLimitConfig
        
        logger.info("Initializing global rate limiter...")
        
        config = RateLimitConfig(
            challenge_per_hour=int(os.getenv('W_CSAP_RATE_LIMIT_CHALLENGE_PER_HOUR', '50')),
            verify_per_hour=int(os.getenv('W_CSAP_RATE_LIMIT_VERIFY_PER_HOUR', '50')),
            refresh_per_hour=int(os.getenv('W_CSAP_RATE_LIMIT_REFRESH_PER_HOUR', '100')),
            max_failed_before_lockout=int(os.getenv('W_CSAP_MAX_FAILED_ATTEMPTS', '5')),
            lockout_duration=int(os.getenv('W_CSAP_LOCKOUT_DURATION', '900'))
        )
        
        rate_limiter = get_rate_limiter(redis_url, config)
        
        logger.info(
            f"Global rate limiter initialized: "
            f"challenge={config.challenge_per_hour}/hour, "
            f"verify={config.verify_per_hour}/hour, "
            f"lockout={config.lockout_duration}s"
        )
        
        return rate_limiter
        
    except Exception as e:
        logger.critical(f"Failed to initialize rate limiter: {str(e)}")
        raise


def apply_security_middleware(app: FastAPI, secret_key: str, environment: str = "production"):
    """Apply all security middleware to FastAPI app."""
    try:
        from auth.security_middleware import (
            SecurityHeadersMiddleware,
            CSRFProtectionMiddleware,
            ProductionErrorSanitizerMiddleware,
            RequestValidationMiddleware
        )
        
        logger.info("Applying security middleware...")
        
        # Apply in order (last added = first executed)
        app.add_middleware(RequestValidationMiddleware)
        app.add_middleware(ProductionErrorSanitizerMiddleware, environment=environment)
        app.add_middleware(
            CSRFProtectionMiddleware,
            secret_key=secret_key,
            cookie_secure=(environment == "production")
        )
        app.add_middleware(SecurityHeadersMiddleware, environment=environment)
        
        logger.info("Security middleware applied: Headers, CSRF, Error Sanitization, Validation")
        
    except Exception as e:
        logger.critical(f"Failed to apply security middleware: {str(e)}")
        raise


def initialize_w_csap_security(app: FastAPI, environment: str = "production") -> dict:
    """
    Initialize all W-CSAP security components.
    
    Args:
        app: FastAPI application
        environment: Environment (production/development)
        
    Returns:
        Dictionary with initialized security components
    """
    logger.info("=" * 70)
    logger.info("W-CSAP SECURITY INITIALIZATION")
    logger.info("=" * 70)
    
    # Step 1: Validate
    logger.info("Step 1/5: Validating security configuration...")
    if environment == "production":
        if not validate_production_environment():
            logger.critical("Security validation failed. Cannot start.")
            sys.exit(1)
    
    # Step 2: Get config
    logger.info("Step 2/5: Loading configuration...")
    secret_key = os.getenv('W_CSAP_SECRET_KEY')
    redis_url = os.getenv('W_CSAP_REDIS_URL', 'redis://localhost:6379/0')
    
    if not secret_key:
        logger.critical("W_CSAP_SECRET_KEY is required!")
        sys.exit(1)
    
    # Step 3: Initialize session storage
    logger.info("Step 3/5: Initializing encrypted session storage...")
    session_store = initialize_secure_session_storage(secret_key, redis_url)
    
    # Step 4: Initialize rate limiter
    logger.info("Step 4/5: Initializing global rate limiter...")
    rate_limiter = initialize_global_rate_limiter(redis_url)
    
    # Step 5: Apply middleware
    logger.info("Step 5/5: Applying security middleware...")
    apply_security_middleware(app, secret_key, environment)
    
    # Store in app state
    app.state.session_store = session_store
    app.state.rate_limiter = rate_limiter
    
    logger.info("=" * 70)
    logger.info("W-CSAP SECURITY INITIALIZATION COMPLETE")
    logger.info("=" * 70)
    logger.info("Security Status:")
    logger.info("  - Encrypted Sessions: Active")
    logger.info("  - Global Rate Limiting: Active")
    logger.info("  - Security Headers: Active")
    logger.info("  - CSRF Protection: Active")
    logger.info("  - Error Sanitization: Active")
    logger.info("  - Request Validation: Active")
    logger.info("=" * 70)
    
    return {
        "session_store": session_store,
        "rate_limiter": rate_limiter,
        "environment": environment
    }


__all__ = [
    'initialize_w_csap_security',
    'validate_production_environment',
    'initialize_secure_session_storage',
    'initialize_global_rate_limiter',
    'apply_security_middleware'
]
