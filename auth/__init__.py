"""
W-CSAP Authentication Module
=============================

Wallet-Based Cryptographic Session Assertion Protocol.

A novel authentication system inspired by SAML but using blockchain wallet signatures
for local, decentralized authentication without external Identity Providers.
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
    'SessionCleanupMiddleware'
]

__version__ = "1.0.0"
__author__ = "GigChain.io"
__protocol__ = "W-CSAP"
