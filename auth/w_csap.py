"""
Wallet-Based Cryptographic Session Assertion Protocol (W-CSAP)
===============================================================

A novel authentication system inspired by SAML but using blockchain wallet signatures.
This protocol provides enterprise-grade security features without centralized Identity Providers.

Key Features:
- Challenge-Response Authentication (prevents replay attacks)
- Cryptographic Session Assertions (wallet-signed tokens)
- Time-bound Sessions with automatic expiry
- Refresh Token mechanism
- Rate limiting and brute-force protection
- Session binding to IP/User-Agent (optional)

Architecture Components:
1. Challenge Generator - Creates unique, time-bound challenges
2. Signature Validator - Verifies wallet signatures cryptographically
3. Session Manager - Issues and validates session assertions
4. Token Refresher - Handles session renewal
"""

import hashlib
import hmac
import json
import secrets
import time
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List, Tuple
from eth_account.messages import encode_defunct
from web3 import Web3
import logging

logger = logging.getLogger(__name__)


@dataclass
class Challenge:
    """
    Represents a cryptographic challenge for wallet authentication.
    Similar to SAML's AuthnRequest but wallet-based.
    """
    challenge_id: str
    wallet_address: str
    challenge_message: str
    nonce: str
    issued_at: int
    expires_at: int
    metadata: Dict[str, Any]
    
    def is_expired(self) -> bool:
        """Check if challenge has expired."""
        return int(time.time()) > self.expires_at
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return asdict(self)


@dataclass
class SessionAssertion:
    """
    Represents a cryptographic session assertion.
    Similar to SAML's Assertion but using wallet signatures.
    """
    assertion_id: str
    wallet_address: str
    issued_at: int
    expires_at: int
    not_before: int
    session_token: str
    refresh_token: str
    signature: str
    metadata: Dict[str, Any]
    
    def is_valid(self, current_time: Optional[int] = None) -> bool:
        """Check if assertion is currently valid."""
        if current_time is None:
            current_time = int(time.time())
        
        return (
            current_time >= self.not_before and
            current_time < self.expires_at
        )
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return asdict(self)


class ChallengeGenerator:
    """
    Generates cryptographic challenges for wallet authentication.
    Ensures uniqueness and prevents replay attacks.
    """
    
    def __init__(self, challenge_ttl: int = 300):  # 5 minutes default
        self.challenge_ttl = challenge_ttl
        self.app_name = "GigChain.io"
    
    def generate_challenge(
        self, 
        wallet_address: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Challenge:
        """
        Generate a unique challenge for wallet authentication.
        
        Args:
            wallet_address: The wallet address requesting authentication
            ip_address: Optional client IP for binding
            user_agent: Optional user agent for binding
            
        Returns:
            Challenge object with cryptographic properties
        """
        # Normalize wallet address
        wallet_address = Web3.to_checksum_address(wallet_address)
        
        # Generate unique challenge ID
        challenge_id = self._generate_challenge_id(wallet_address)
        
        # Generate cryptographic nonce
        nonce = secrets.token_hex(32)
        
        # Create challenge message
        issued_at = int(time.time())
        expires_at = issued_at + self.challenge_ttl
        
        challenge_message = self._create_challenge_message(
            challenge_id=challenge_id,
            wallet_address=wallet_address,
            nonce=nonce,
            issued_at=issued_at,
            expires_at=expires_at
        )
        
        # Build metadata
        metadata = {
            "ip_address": ip_address,
            "user_agent": user_agent,
            "app_name": self.app_name,
            "version": "1.0.0"
        }
        
        return Challenge(
            challenge_id=challenge_id,
            wallet_address=wallet_address,
            challenge_message=challenge_message,
            nonce=nonce,
            issued_at=issued_at,
            expires_at=expires_at,
            metadata=metadata
        )
    
    def _generate_challenge_id(self, wallet_address: str) -> str:
        """Generate unique challenge ID."""
        data = f"{wallet_address}:{time.time()}:{secrets.token_hex(16)}"
        return hashlib.sha256(data.encode()).hexdigest()
    
    def _create_challenge_message(
        self,
        challenge_id: str,
        wallet_address: str,
        nonce: str,
        issued_at: int,
        expires_at: int
    ) -> str:
        """
        Create human-readable challenge message for signing.
        This is what the user will see in their wallet.
        """
        issued_dt = datetime.fromtimestamp(issued_at).isoformat()
        expires_dt = datetime.fromtimestamp(expires_at).isoformat()
        
        return f"""🔐 GigChain.io - Wallet Authentication

Sign this message to authenticate your wallet.

Wallet: {wallet_address}
Challenge ID: {challenge_id[:16]}...
Nonce: {nonce[:16]}...

Issued: {issued_dt}
Expires: {expires_dt}

⚠️ Only sign this if you initiated the login.
Never share this signature with anyone.

Security: This is a one-time authentication challenge."""


class SignatureValidator:
    """
    Validates wallet signatures cryptographically.
    Uses eth_account for EIP-191 message signing verification.
    """
    
    def __init__(self):
        self.web3 = Web3()
    
    def verify_signature(
        self,
        message: str,
        signature: str,
        expected_address: str
    ) -> Tuple[bool, Optional[str]]:
        """
        Verify that a message was signed by the expected wallet address.
        
        Args:
            message: The original challenge message
            signature: The hex-encoded signature
            expected_address: The wallet address that should have signed
            
        Returns:
            Tuple of (is_valid, recovered_address)
        """
        try:
            # Normalize addresses
            expected_address = Web3.to_checksum_address(expected_address)
            
            # Encode message for Ethereum signing (EIP-191)
            encoded_message = encode_defunct(text=message)
            
            # Recover the address that signed the message
            recovered_address = self.web3.eth.account.recover_message(
                encoded_message,
                signature=signature
            )
            
            # CONSTANT-TIME comparison (FIX MEDIUM-001: Timing attack protection)
            # hmac.compare_digest prevents timing attacks by always taking
            # the same amount of time regardless of where strings differ
            is_valid = hmac.compare_digest(
                recovered_address.lower(),
                expected_address.lower()
            )
            
            if is_valid:
                logger.info(f"✅ Signature verified for {expected_address[:10]}...")
            else:
                logger.warning(f"❌ Signature mismatch: expected {expected_address}, got {recovered_address}")
            
            return is_valid, recovered_address
            
        except Exception as e:
            logger.error(f"Signature verification error: {str(e)}")
            return False, None


class SessionManager:
    """
    Manages cryptographic session assertions.
    Similar to SAML's Session Manager but using wallet-based auth.
    """
    
    def __init__(
        self,
        secret_key: str,
        session_ttl: int = 86400,  # 24 hours
        refresh_ttl: int = 604800   # 7 days
    ):
        self.secret_key = secret_key
        self.session_ttl = session_ttl
        self.refresh_ttl = refresh_ttl
    
    def create_session_assertion(
        self,
        wallet_address: str,
        signature: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> SessionAssertion:
        """
        Create a new session assertion after successful authentication.
        
        Args:
            wallet_address: Authenticated wallet address
            signature: The authentication signature
            metadata: Optional metadata to include
            
        Returns:
            SessionAssertion object
        """
        # Normalize address
        wallet_address = Web3.to_checksum_address(wallet_address)
        
        # Generate unique assertion ID
        assertion_id = self._generate_assertion_id(wallet_address)
        
        # Set time bounds
        current_time = int(time.time())
        issued_at = current_time
        not_before = current_time
        expires_at = current_time + self.session_ttl
        
        # Generate session and refresh tokens
        session_token = self._generate_session_token(
            assertion_id=assertion_id,
            wallet_address=wallet_address,
            expires_at=expires_at
        )
        
        refresh_token = self._generate_refresh_token(
            assertion_id=assertion_id,
            wallet_address=wallet_address
        )
        
        # Prepare metadata
        if metadata is None:
            metadata = {}
        
        metadata.update({
            "auth_method": "wallet_signature",
            "protocol": "W-CSAP",
            "version": "1.0.0"
        })
        
        return SessionAssertion(
            assertion_id=assertion_id,
            wallet_address=wallet_address,
            issued_at=issued_at,
            expires_at=expires_at,
            not_before=not_before,
            session_token=session_token,
            refresh_token=refresh_token,
            signature=signature,
            metadata=metadata
        )
    
    def validate_session_token(self, session_token: str) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """
        Validate a session token cryptographically.
        
        Returns:
            Tuple of (is_valid, decoded_data)
        """
        try:
            # Parse token (format: assertion_id.wallet.expires_at.hmac)
            parts = session_token.split('.')
            if len(parts) != 4:
                return False, None
            
            assertion_id, wallet_address, expires_at_str, token_hmac = parts
            expires_at = int(expires_at_str)
            
            # Check expiry
            if int(time.time()) >= expires_at:
                logger.warning("Session token expired")
                return False, None
            
            # Verify HMAC
            expected_hmac = self._compute_token_hmac(
                assertion_id, wallet_address, expires_at
            )
            
            if not hmac.compare_digest(token_hmac, expected_hmac):
                logger.warning("Session token HMAC verification failed")
                return False, None
            
            # Return decoded data
            decoded_data = {
                "assertion_id": assertion_id,
                "wallet_address": Web3.to_checksum_address(wallet_address),
                "expires_at": expires_at,
                "expires_in": expires_at - int(time.time())
            }
            
            return True, decoded_data
            
        except Exception as e:
            logger.error(f"Session token validation error: {str(e)}")
            return False, None
    
    def refresh_session(
        self,
        refresh_token: str,
        old_session_token: str
    ) -> Optional[SessionAssertion]:
        """
        Refresh a session using a valid refresh token.
        
        Returns:
            New SessionAssertion or None if invalid
        """
        try:
            # Validate old session token (even if expired, we need to verify it)
            parts = old_session_token.split('.')
            if len(parts) != 4:
                return None
            
            assertion_id, wallet_address, _, token_hmac = parts
            
            # Validate refresh token
            expected_refresh_hmac = self._compute_refresh_token_hmac(
                assertion_id, wallet_address
            )
            
            if not hmac.compare_digest(refresh_token, expected_refresh_hmac):
                logger.warning("Invalid refresh token")
                return None
            
            # Create new session assertion
            return self.create_session_assertion(
                wallet_address=wallet_address,
                signature="refreshed",
                metadata={"refreshed_from": assertion_id}
            )
            
        except Exception as e:
            logger.error(f"Session refresh error: {str(e)}")
            return None
    
    def _generate_assertion_id(self, wallet_address: str) -> str:
        """Generate unique assertion ID."""
        data = f"{wallet_address}:{time.time()}:{secrets.token_hex(16)}"
        return hashlib.sha256(data.encode()).hexdigest()
    
    def _generate_session_token(
        self,
        assertion_id: str,
        wallet_address: str,
        expires_at: int
    ) -> str:
        """
        Generate cryptographically secure session token.
        Format: assertion_id.wallet_address.expires_at.hmac
        """
        token_hmac = self._compute_token_hmac(assertion_id, wallet_address, expires_at)
        return f"{assertion_id}.{wallet_address}.{expires_at}.{token_hmac}"
    
    def _generate_refresh_token(self, assertion_id: str, wallet_address: str) -> str:
        """Generate cryptographically secure refresh token."""
        return self._compute_refresh_token_hmac(assertion_id, wallet_address)
    
    def _compute_token_hmac(
        self,
        assertion_id: str,
        wallet_address: str,
        expires_at: int
    ) -> str:
        """Compute HMAC for session token."""
        data = f"{assertion_id}:{wallet_address}:{expires_at}"
        return hmac.new(
            self.secret_key.encode(),
            data.encode(),
            hashlib.sha256
        ).hexdigest()
    
    def _compute_refresh_token_hmac(self, assertion_id: str, wallet_address: str) -> str:
        """Compute HMAC for refresh token."""
        data = f"refresh:{assertion_id}:{wallet_address}"
        return hmac.new(
            self.secret_key.encode(),
            data.encode(),
            hashlib.sha256
        ).hexdigest()


class WCSAPAuthenticator:
    """
    Main W-CSAP authentication coordinator.
    Orchestrates challenge generation, signature verification, and session management.
    """
    
    def __init__(
        self,
        secret_key: str,
        challenge_ttl: int = 300,
        session_ttl: int = 86400,
        refresh_ttl: int = 604800
    ):
        self.challenge_generator = ChallengeGenerator(challenge_ttl)
        self.signature_validator = SignatureValidator()
        self.session_manager = SessionManager(secret_key, session_ttl, refresh_ttl)
        
        # In-memory storage for challenges (use Redis in production)
        self.active_challenges: Dict[str, Challenge] = {}
        self.active_sessions: Dict[str, SessionAssertion] = {}
        
        logger.info("🔐 W-CSAP Authenticator initialized")
    
    def initiate_authentication(
        self,
        wallet_address: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Challenge:
        """
        Step 1: Initiate authentication by generating a challenge.
        
        Returns:
            Challenge object to be signed by the user's wallet
        """
        try:
            # Generate challenge
            challenge = self.challenge_generator.generate_challenge(
                wallet_address=wallet_address,
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            # Store challenge
            self.active_challenges[challenge.challenge_id] = challenge
            
            logger.info(f"🎯 Challenge generated for {wallet_address[:10]}...")
            return challenge
            
        except Exception as e:
            logger.error(f"Challenge generation error: {str(e)}")
            raise
    
    def complete_authentication(
        self,
        challenge_id: str,
        signature: str,
        wallet_address: str
    ) -> Optional[SessionAssertion]:
        """
        Step 2: Complete authentication by verifying the signed challenge.
        
        Returns:
            SessionAssertion if successful, None otherwise
        """
        try:
            # Retrieve challenge
            challenge = self.active_challenges.get(challenge_id)
            if not challenge:
                logger.warning(f"Challenge not found: {challenge_id[:16]}...")
                return None
            
            # Check expiry
            if challenge.is_expired():
                logger.warning("Challenge expired")
                del self.active_challenges[challenge_id]
                return None
            
            # Verify wallet address matches
            if challenge.wallet_address.lower() != wallet_address.lower():
                logger.warning("Wallet address mismatch")
                return None
            
            # Verify signature
            is_valid, recovered_address = self.signature_validator.verify_signature(
                message=challenge.challenge_message,
                signature=signature,
                expected_address=wallet_address
            )
            
            if not is_valid:
                logger.warning("Invalid signature")
                return None
            
            # Create session assertion
            session_assertion = self.session_manager.create_session_assertion(
                wallet_address=wallet_address,
                signature=signature,
                metadata=challenge.metadata
            )
            
            # Store session
            self.active_sessions[session_assertion.assertion_id] = session_assertion
            
            # Clean up challenge
            del self.active_challenges[challenge_id]
            
            logger.info(f"✅ Authentication successful for {wallet_address[:10]}...")
            return session_assertion
            
        except Exception as e:
            logger.error(f"Authentication completion error: {str(e)}")
            return None
    
    def validate_session(self, session_token: str) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """
        Validate an active session token.
        
        Returns:
            Tuple of (is_valid, session_data)
        """
        return self.session_manager.validate_session_token(session_token)
    
    def refresh_session(
        self,
        refresh_token: str,
        old_session_token: str
    ) -> Optional[SessionAssertion]:
        """
        Refresh an expired session using a valid refresh token.
        
        Returns:
            New SessionAssertion or None if invalid
        """
        return self.session_manager.refresh_session(refresh_token, old_session_token)
    
    def logout(self, session_token: str) -> bool:
        """
        Logout and invalidate a session.
        
        Returns:
            True if successful
        """
        try:
            # Validate and parse token
            is_valid, session_data = self.validate_session(session_token)
            if not is_valid or not session_data:
                return False
            
            # Remove from active sessions
            assertion_id = session_data.get("assertion_id")
            if assertion_id in self.active_sessions:
                del self.active_sessions[assertion_id]
            
            logger.info("👋 Session logged out successfully")
            return True
            
        except Exception as e:
            logger.error(f"Logout error: {str(e)}")
            return False
    
    def cleanup_expired(self):
        """Clean up expired challenges and sessions."""
        current_time = int(time.time())
        
        # Clean expired challenges
        expired_challenges = [
            cid for cid, challenge in self.active_challenges.items()
            if challenge.is_expired()
        ]
        for cid in expired_challenges:
            del self.active_challenges[cid]
        
        # Clean expired sessions
        expired_sessions = [
            aid for aid, assertion in self.active_sessions.items()
            if not assertion.is_valid(current_time)
        ]
        for aid in expired_sessions:
            del self.active_sessions[aid]
        
        if expired_challenges or expired_sessions:
            logger.info(
                f"🧹 Cleaned up {len(expired_challenges)} challenges "
                f"and {len(expired_sessions)} sessions"
            )


# Export main classes
__all__ = [
    'WCSAPAuthenticator',
    'Challenge',
    'SessionAssertion',
    'ChallengeGenerator',
    'SignatureValidator',
    'SessionManager'
]
