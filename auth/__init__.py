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
from auth.revocation import RevocationCache, get_revocation_cache
from auth.dpop import DPoPValidator, DPoPTokenGenerator, get_dpop_validator
from auth.jwt_tokens import JWTTokenManager, TokenClaims, get_jwt_manager
from auth.scope_validator import ScopeValidator, AudienceValidator, require_scope, require_any_scope
from auth.risk_scoring import RiskScorer, DeviceFingerprint, RiskAssessment, get_risk_scorer
from auth.step_up import StepUpManager, OperationClassifier, OperationRisk, require_step_up, get_step_up_manager
from auth.kms import KMSKeyManager, get_kms_manager
from auth.analytics import AnalyticsDashboard, ThreatIntelligence, get_analytics_dashboard, get_threat_intelligence
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
    
    # Revocation
    'RevocationCache',
    'get_revocation_cache',
    
    # Phase 2: DPoP
    'DPoPValidator',
    'DPoPTokenGenerator',
    'get_dpop_validator',
    
    # Phase 2: JWT Tokens
    'JWTTokenManager',
    'TokenClaims',
    'get_jwt_manager',
    
    # Phase 2: Scope & Audience
    'ScopeValidator',
    'AudienceValidator',
    'require_scope',
    'require_any_scope',
    
    # Phase 3: Risk Scoring
    'RiskScorer',
    'DeviceFingerprint',
    'RiskAssessment',
    'get_risk_scorer',
    
    # Phase 3: Step-Up Authentication
    'StepUpManager',
    'OperationClassifier',
    'OperationRisk',
    'require_step_up',
    'get_step_up_manager',
    
    # Phase 3: KMS/HSM
    'KMSKeyManager',
    'get_kms_manager',
    
    # Phase 3: Analytics
    'AnalyticsDashboard',
    'ThreatIntelligence',
    'get_analytics_dashboard',
    'get_threat_intelligence',
    
    # Schemas module
    'schemas'
]

__version__ = "3.0.0"  # Phase 3: Advanced Security & Operations
__author__ = "GigChain.io"
__protocol__ = "W-CSAP"
__security_level__ = "Zero-Trust / WebAuthn-Plus"
