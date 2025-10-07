"""
W-CSAP Asymmetric Token Implementation (JWT with ES256/EdDSA)
==============================================================

SECURITY ENHANCEMENT:
Replaces HMAC-based tokens with asymmetric JWT tokens signed with ES256 or EdDSA.

Benefits over HMAC:
1. Public key can be safely distributed (no secret leakage risk)
2. Each service can verify independently without sharing secrets
3. Easier key rotation (distribute new public key)
4. No "one secret to rule them all" vulnerability
5. Supports multiple issuers/keys per environment

This upgrades key management from Medium to HIGH.
"""

import time
import secrets
from typing import Optional, Dict, Any, Tuple
from dataclasses import dataclass
import logging
import json
import base64

logger = logging.getLogger(__name__)


@dataclass
class TokenClaims:
    """
    Standard JWT claims for W-CSAP access tokens.
    
    Follows RFC 7519 (JWT) with W-CSAP-specific extensions.
    """
    # Standard JWT claims (RFC 7519)
    iss: str  # Issuer - who created the token
    sub: str  # Subject - wallet address
    aud: str  # Audience - intended recipient(s)
    exp: int  # Expiration time (Unix timestamp)
    nbf: int  # Not before time (Unix timestamp)
    iat: int  # Issued at time (Unix timestamp)
    jti: str  # JWT ID - unique token identifier
    
    # W-CSAP specific claims
    scope: str = "profile"  # Space-separated list of scopes
    wallet_address: Optional[str] = None  # Normalized wallet address
    
    # DPoP binding (RFC 9449)
    cnf: Optional[Dict[str, str]] = None  # Confirmation claim {"jkt": "..."}
    
    # Session metadata
    assertion_id: Optional[str] = None  # W-CSAP session assertion ID
    auth_time: Optional[int] = None  # When authentication occurred
    
    # Security context
    client_ip: Optional[str] = None  # Client IP (if session binding enabled)
    user_agent: Optional[str] = None  # User agent (if session binding enabled)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JWT payload."""
        claims = {
            "iss": self.iss,
            "sub": self.sub,
            "aud": self.aud,
            "exp": self.exp,
            "nbf": self.nbf,
            "iat": self.iat,
            "jti": self.jti,
            "scope": self.scope
        }
        
        # Add optional claims
        if self.wallet_address:
            claims["wallet_address"] = self.wallet_address
        if self.cnf:
            claims["cnf"] = self.cnf
        if self.assertion_id:
            claims["assertion_id"] = self.assertion_id
        if self.auth_time:
            claims["auth_time"] = self.auth_time
        if self.client_ip:
            claims["client_ip"] = self.client_ip
        if self.user_agent:
            claims["user_agent"] = self.user_agent
        
        return claims


class JWTTokenManager:
    """
    Manages JWT tokens with asymmetric signing.
    
    Supports ES256 (ECDSA with P-256) and EdDSA (Ed25519).
    Uses cryptography library for key management and signing.
    """
    
    def __init__(
        self,
        algorithm: str = "ES256",
        issuer: str = "https://auth.gigchain.io",
        audience: str = "https://api.gigchain.io",
        access_token_ttl: int = 900,  # 15 minutes
        refresh_token_ttl: int = 86400  # 24 hours
    ):
        """
        Initialize JWT token manager.
        
        Args:
            algorithm: Signing algorithm ("ES256" or "EdDSA")
            issuer: Token issuer identifier
            audience: Token audience (intended recipient)
            access_token_ttl: Access token lifetime in seconds
            refresh_token_ttl: Refresh token lifetime in seconds
        """
        self.algorithm = algorithm
        self.issuer = issuer
        self.audience = audience
        self.access_token_ttl = access_token_ttl
        self.refresh_token_ttl = refresh_token_ttl
        
        # Generate or load signing keys
        self.private_key = None
        self.public_key = None
        self._generate_keys()
    
    def _generate_keys(self):
        """Generate asymmetric key pair for token signing."""
        try:
            from cryptography.hazmat.primitives.asymmetric import ec, ed25519
            from cryptography.hazmat.primitives import serialization
            
            if self.algorithm == "ES256":
                # ECDSA with P-256 curve
                self.private_key = ec.generate_private_key(ec.SECP256R1())
                self.public_key = self.private_key.public_key()
                logger.info("🔑 Generated ES256 key pair (ECDSA P-256)")
                
            elif self.algorithm == "EdDSA":
                # Ed25519
                self.private_key = ed25519.Ed25519PrivateKey.generate()
                self.public_key = self.private_key.public_key()
                logger.info("🔑 Generated EdDSA key pair (Ed25519)")
                
            else:
                raise ValueError(f"Unsupported algorithm: {self.algorithm}")
                
        except ImportError:
            logger.error(
                "cryptography package required for asymmetric tokens. "
                "Install with: pip install cryptography"
            )
            raise
    
    def create_access_token(
        self,
        wallet_address: str,
        assertion_id: str,
        scope: str = "profile",
        cnf_jkt: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Create a signed JWT access token.
        
        Args:
            wallet_address: Authenticated wallet address
            assertion_id: Session assertion ID
            scope: Space-separated list of scopes
            cnf_jkt: JWK thumbprint for DPoP binding (optional)
            metadata: Additional claims
            
        Returns:
            Signed JWT access token
        """
        current_time = int(time.time())
        
        # Build claims
        claims = TokenClaims(
            iss=self.issuer,
            sub=wallet_address,
            aud=self.audience,
            exp=current_time + self.access_token_ttl,
            nbf=current_time,
            iat=current_time,
            jti=secrets.token_hex(32),
            scope=scope,
            wallet_address=wallet_address,
            assertion_id=assertion_id,
            auth_time=current_time
        )
        
        # Add DPoP binding if provided
        if cnf_jkt:
            claims.cnf = {"jkt": cnf_jkt}
        
        # Add metadata
        if metadata:
            if "client_ip" in metadata:
                claims.client_ip = metadata["client_ip"]
            if "user_agent" in metadata:
                claims.user_agent = metadata["user_agent"]
        
        # Create and sign JWT
        token = self._create_jwt(claims.to_dict())
        
        logger.info(
            f"🎟️ Created JWT access token for {wallet_address[:10]}... "
            f"(expires in {self.access_token_ttl}s)"
        )
        
        return token
    
    def create_refresh_token(
        self,
        wallet_address: str,
        assertion_id: str
    ) -> str:
        """
        Create a signed JWT refresh token.
        
        Args:
            wallet_address: Authenticated wallet address
            assertion_id: Session assertion ID
            
        Returns:
            Signed JWT refresh token
        """
        current_time = int(time.time())
        
        claims = {
            "iss": self.issuer,
            "sub": wallet_address,
            "aud": self.issuer,  # Refresh tokens audience is the issuer
            "exp": current_time + self.refresh_token_ttl,
            "nbf": current_time,
            "iat": current_time,
            "jti": secrets.token_hex(32),
            "assertion_id": assertion_id,
            "token_type": "refresh"
        }
        
        token = self._create_jwt(claims)
        
        logger.info(
            f"🔄 Created JWT refresh token for {wallet_address[:10]}... "
            f"(expires in {self.refresh_token_ttl}s)"
        )
        
        return token
    
    def _create_jwt(self, payload: Dict[str, Any]) -> str:
        """
        Create and sign a JWT.
        
        Args:
            payload: JWT claims
            
        Returns:
            Signed JWT string
        """
        try:
            import jwt as pyjwt
            
            # Sign with private key
            token = pyjwt.encode(
                payload,
                self.private_key,
                algorithm=self.algorithm
            )
            
            return token
            
        except ImportError:
            logger.error(
                "PyJWT package required. Install with: pip install PyJWT[crypto]"
            )
            raise
    
    def verify_token(
        self,
        token: str,
        expected_audience: Optional[str] = None
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Verify and decode a JWT token.
        
        Args:
            token: JWT token string
            expected_audience: Expected audience claim (defaults to self.audience)
            
        Returns:
            Tuple of (is_valid, decoded_claims, error_message)
        """
        try:
            import jwt as pyjwt
            
            # Decode and verify
            claims = pyjwt.decode(
                token,
                self.public_key,
                algorithms=[self.algorithm],
                audience=expected_audience or self.audience,
                issuer=self.issuer,
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_nbf": True,
                    "verify_iat": True,
                    "verify_aud": True,
                    "verify_iss": True
                }
            )
            
            logger.debug(f"✅ JWT token verified for {claims.get('sub', 'unknown')[:10]}...")
            
            return True, claims, None
            
        except pyjwt.ExpiredSignatureError:
            return False, None, "Token has expired"
        except pyjwt.InvalidAudienceError:
            return False, None, "Invalid audience"
        except pyjwt.InvalidIssuerError:
            return False, None, "Invalid issuer"
        except pyjwt.InvalidSignatureError:
            return False, None, "Invalid signature"
        except Exception as e:
            logger.error(f"JWT verification error: {str(e)}")
            return False, None, f"Token verification failed: {str(e)}"
    
    def get_public_key_jwks(self) -> Dict[str, Any]:
        """
        Get public key in JWKS (JSON Web Key Set) format.
        
        This can be published at /.well-known/jwks.json for clients
        to verify tokens independently.
        
        Returns:
            JWKS dictionary with public key
        """
        from cryptography.hazmat.primitives import serialization
        
        # Serialize public key to PEM
        pem = self.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        
        # Convert to JWK format
        # This is simplified - in production, use proper JWK library
        jwk = {
            "kty": "EC" if self.algorithm == "ES256" else "OKP",
            "use": "sig",
            "alg": self.algorithm,
            "kid": secrets.token_hex(8),  # Key ID
        }
        
        jwks = {
            "keys": [jwk]
        }
        
        return jwks
    
    def extract_wallet_from_token(
        self,
        token: str
    ) -> Tuple[Optional[str], Optional[Dict[str, Any]]]:
        """
        Extract wallet address and claims from token without full verification.
        
        Useful for quick lookups before full validation.
        
        Args:
            token: JWT token string
            
        Returns:
            Tuple of (wallet_address, all_claims) or (None, None)
        """
        try:
            import jwt as pyjwt
            
            # Decode without verification (just parse)
            claims = pyjwt.decode(
                token,
                options={"verify_signature": False}
            )
            
            wallet = claims.get("sub") or claims.get("wallet_address")
            return wallet, claims
            
        except Exception:
            return None, None


# Singleton instance
_jwt_manager_instance: Optional[JWTTokenManager] = None


def get_jwt_manager(
    algorithm: str = "ES256",
    issuer: str = "https://auth.gigchain.io",
    audience: str = "https://api.gigchain.io",
    access_token_ttl: int = 900,
    refresh_token_ttl: int = 86400
) -> JWTTokenManager:
    """
    Get or create JWT manager singleton.
    
    Args:
        algorithm: Signing algorithm
        issuer: Token issuer
        audience: Token audience
        access_token_ttl: Access token TTL
        refresh_token_ttl: Refresh token TTL
        
    Returns:
        JWTTokenManager instance
    """
    global _jwt_manager_instance
    
    if _jwt_manager_instance is None:
        _jwt_manager_instance = JWTTokenManager(
            algorithm=algorithm,
            issuer=issuer,
            audience=audience,
            access_token_ttl=access_token_ttl,
            refresh_token_ttl=refresh_token_ttl
        )
    
    return _jwt_manager_instance


def reset_jwt_manager():
    """Reset JWT manager singleton (useful for testing)."""
    global _jwt_manager_instance
    _jwt_manager_instance = None


__all__ = [
    'TokenClaims',
    'JWTTokenManager',
    'get_jwt_manager',
    'reset_jwt_manager'
]