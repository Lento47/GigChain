"""
W-CSAP Authentication Module
=============================

Wallet-Based Cryptographic Session Assertion Protocol.

A novel authentication system inspired by SAML but using blockchain wallet signatures
for local, decentralized authentication without external Identity Providers.

## Standardized Components (v1.0.0+)

This module now includes standardized:
- Request/Response schemas (auth.schemas)
- Configuration management (auth.config)
- Error handling (auth.errors)
- Authentication routes (auth.routes)
"""

from auth.w_csap import (
    WCSAPAuthenticator,
    Challenge,
    SessionAssertion,
    ChallengeGenerator,
    SignatureValidator,
    SessionManager
)
from auth.database import WCSAPDatabase, get_database
from auth.middleware import (
    get_current_wallet,
    get_optional_wallet,
    require_wallet,
    protected_route,
    admin_only,
    RateLimitMiddleware,
    SessionCleanupMiddleware
)
from auth.config import WCSAPConfig, get_config, load_config
from auth.errors import (
    WCSAPException,
    WCSAPErrorCode,
    wcsap_exception_handler
)
from auth.routes import router as auth_router
from auth import schemas

__all__ = [
    # Core classes
    'WCSAPAuthenticator',
    'Challenge',
    'SessionAssertion',
    'ChallengeGenerator',
    'SignatureValidator',
    'SessionManager',
    
    # Database
    'WCSAPDatabase',
    'get_database',
    
    # Middleware & dependencies
    'get_current_wallet',
    'get_optional_wallet',
    'require_wallet',
    'protected_route',
    'admin_only',
    'RateLimitMiddleware',
    'SessionCleanupMiddleware',
    
    # Configuration
    'WCSAPConfig',
    'get_config',
    'load_config',
    
    # Error handling
    'WCSAPException',
    'WCSAPErrorCode',
    'wcsap_exception_handler',
    
    # Routes
    'auth_router',
    
    # Schemas module
    'schemas'
]

__version__ = "1.0.0"
__author__ = "GigChain.io"
__protocol__ = "W-CSAP"
