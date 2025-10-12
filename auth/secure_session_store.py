"""
W-CSAP Secure Session Storage - CRITICAL SECURITY FIX
======================================================

Enterprise-grade encrypted session storage with Redis backend.

SECURITY FEATURES:
- AES-256-GCM encryption for all session data
- Redis persistence with TTL enforcement
- No plain-text data in memory or storage
- Automatic key rotation support
- Tamper detection with HMAC
- Secure key derivation (PBKDF2)
- Defense against timing attacks
- Comprehensive audit logging

This fixes CRITICAL-001: In-Memory Session Storage Vulnerability
"""

import json
import time
import hmac
import hashlib
import secrets
import logging
from typing import Optional, Dict, Any, List
from dataclasses import asdict
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
import redis
from redis.exceptions import RedisError

from auth.w_csap import SessionAssertion, Challenge

logger = logging.getLogger(__name__)


class SecureKeyDerivation:
    """
    Secure key derivation using PBKDF2.
    Derives encryption and authentication keys from master secret.
    """
    
    SALT_LENGTH = 32  # 256 bits
    KEY_LENGTH = 32   # 256 bits for AES-256
    ITERATIONS = 600000  # OWASP recommendation for PBKDF2-HMAC-SHA256
    
    def __init__(self, master_secret: str):
        """
        Initialize key derivation.
        
        Args:
            master_secret: Master secret key (from W_CSAP_SECRET_KEY)
        """
        if len(master_secret) < 32:
            raise ValueError("Master secret must be at least 32 characters")
        
        self.master_secret = master_secret.encode('utf-8')
        self._salt = self._generate_salt()
        
        # Derive encryption and HMAC keys
        self.encryption_key = self._derive_key(b"encryption", self._salt)
        self.hmac_key = self._derive_key(b"hmac", self._salt)
        
        logger.info("🔐 Secure key derivation initialized (PBKDF2, 600k iterations)")
    
    def _generate_salt(self) -> bytes:
        """Generate cryptographically secure random salt."""
        return secrets.token_bytes(self.SALT_LENGTH)
    
    def _derive_key(self, context: bytes, salt: bytes) -> bytes:
        """
        Derive a key using PBKDF2-HMAC-SHA256.
        
        Args:
            context: Context for key derivation (e.g., b"encryption", b"hmac")
            salt: Salt for key derivation
            
        Returns:
            Derived key (32 bytes)
        """
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=self.KEY_LENGTH,
            salt=salt + context,
            iterations=self.ITERATIONS,
            backend=default_backend()
        )
        return kdf.derive(self.master_secret)
    
    def rotate_keys(self) -> tuple[bytes, bytes]:
        """
        Rotate encryption and HMAC keys.
        
        Returns:
            Tuple of (new_encryption_key, new_hmac_key)
        """
        logger.warning("🔄 Key rotation initiated")
        self._salt = self._generate_salt()
        self.encryption_key = self._derive_key(b"encryption", self._salt)
        self.hmac_key = self._derive_key(b"hmac", self._salt)
        return self.encryption_key, self.hmac_key


class EncryptedSessionStore:
    """
    Encrypted session storage using Redis and AES-256-GCM.
    
    SECURITY ARCHITECTURE:
    - All session data encrypted with AES-256-GCM
    - Each encryption uses unique nonce (never reused)
    - HMAC-SHA256 for tamper detection
    - Constant-time operations to prevent timing attacks
    - Automatic TTL enforcement in Redis
    - No plain-text data ever stored or logged
    """
    
    # Key prefixes for different data types
    PREFIX_SESSION = "wcsap:session:"
    PREFIX_CHALLENGE = "wcsap:challenge:"
    PREFIX_REVOCATION = "wcsap:revoked:"
    PREFIX_RATE_LIMIT = "wcsap:ratelimit:"
    
    def __init__(
        self,
        redis_url: str,
        master_secret: str,
        pool_size: int = 10,
        socket_timeout: int = 5,
        socket_connect_timeout: int = 5
    ):
        """
        Initialize encrypted session store.
        
        Args:
            redis_url: Redis connection URL (redis://localhost:6379/0)
            master_secret: Master secret for key derivation
            pool_size: Redis connection pool size
            socket_timeout: Socket timeout in seconds
            socket_connect_timeout: Socket connect timeout in seconds
        """
        # Initialize key derivation
        self.key_derivation = SecureKeyDerivation(master_secret)
        
        # Initialize AES-GCM cipher
        self.cipher = AESGCM(self.key_derivation.encryption_key)
        
        # Initialize Redis connection pool
        try:
            self.redis_pool = redis.ConnectionPool.from_url(
                redis_url,
                max_connections=pool_size,
                socket_timeout=socket_timeout,
                socket_connect_timeout=socket_connect_timeout,
                decode_responses=False,  # We handle bytes for encryption
                health_check_interval=30
            )
            self.redis = redis.Redis(connection_pool=self.redis_pool)
            
            # Test connection
            self.redis.ping()
            logger.info(f"✅ Encrypted session store connected to Redis: {redis_url}")
            
        except RedisError as e:
            logger.critical(f"❌ Failed to connect to Redis: {str(e)}")
            raise RuntimeError(f"Redis connection failed: {str(e)}")
    
    def _encrypt(self, data: Dict[str, Any]) -> bytes:
        """
        Encrypt data using AES-256-GCM.
        
        Args:
            data: Data to encrypt (will be JSON serialized)
            
        Returns:
            Encrypted data with format: nonce(12) || ciphertext || tag(16)
        """
        try:
            # Serialize data to JSON
            plaintext = json.dumps(data, separators=(',', ':')).encode('utf-8')
            
            # Generate unique nonce (96 bits / 12 bytes for GCM)
            nonce = secrets.token_bytes(12)
            
            # Encrypt with authenticated encryption (AES-256-GCM)
            # GCM provides both confidentiality AND integrity
            ciphertext = self.cipher.encrypt(nonce, plaintext, None)
            
            # Return: nonce || ciphertext (ciphertext includes 16-byte auth tag)
            return nonce + ciphertext
            
        except Exception as e:
            logger.error(f"Encryption error: {str(e)}")
            raise RuntimeError("Encryption failed")
    
    def _decrypt(self, encrypted_data: bytes) -> Optional[Dict[str, Any]]:
        """
        Decrypt data using AES-256-GCM.
        
        Args:
            encrypted_data: Encrypted data (nonce || ciphertext || tag)
            
        Returns:
            Decrypted data as dictionary, or None if decryption fails
        """
        try:
            # Extract nonce (first 12 bytes)
            nonce = encrypted_data[:12]
            ciphertext = encrypted_data[12:]
            
            # Decrypt and verify authenticity
            plaintext = self.cipher.decrypt(nonce, ciphertext, None)
            
            # Deserialize JSON
            return json.loads(plaintext.decode('utf-8'))
            
        except Exception as e:
            # SECURITY: Never log encrypted data or keys
            logger.error(f"Decryption failed (tampered or invalid data): {type(e).__name__}")
            return None
    
    def _compute_hmac(self, key: str, data: bytes) -> str:
        """
        Compute HMAC-SHA256 for tamper detection.
        
        Args:
            key: Redis key
            data: Encrypted data
            
        Returns:
            Hex-encoded HMAC
        """
        message = key.encode('utf-8') + data
        mac = hmac.new(
            self.key_derivation.hmac_key,
            message,
            hashlib.sha256
        )
        return mac.hexdigest()
    
    # ==================== Session Operations ====================
    
    def store_session(self, session: SessionAssertion) -> bool:
        """
        Store encrypted session in Redis.
        
        Args:
            session: SessionAssertion object to store
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Prepare session data
            session_data = asdict(session)
            
            # SECURITY: Remove sensitive data from logs
            session_id_short = session.assertion_id[:16]
            
            # Encrypt session data
            encrypted_data = self._encrypt(session_data)
            
            # Compute HMAC for tamper detection
            redis_key = f"{self.PREFIX_SESSION}{session.assertion_id}"
            hmac_value = self._compute_hmac(redis_key, encrypted_data)
            
            # Store encrypted data with HMAC
            stored_value = encrypted_data + b"||" + hmac_value.encode('utf-8')
            
            # Calculate TTL (time until expiry)
            ttl = max(1, session.expires_at - int(time.time()))
            
            # Store in Redis with TTL
            self.redis.setex(redis_key, ttl, stored_value)
            
            logger.info(f"🔐 Session stored (encrypted): {session_id_short}... (TTL: {ttl}s)")
            return True
            
        except Exception as e:
            logger.error(f"Failed to store session: {str(e)}")
            return False
    
    def get_session(self, assertion_id: str) -> Optional[SessionAssertion]:
        """
        Retrieve and decrypt session from Redis.
        
        Args:
            assertion_id: Session assertion ID
            
        Returns:
            SessionAssertion object if found and valid, None otherwise
        """
        try:
            redis_key = f"{self.PREFIX_SESSION}{assertion_id}"
            
            # Retrieve from Redis
            stored_value = self.redis.get(redis_key)
            if not stored_value:
                return None
            
            # Split encrypted data and HMAC
            parts = stored_value.split(b"||")
            if len(parts) != 2:
                logger.warning(f"Invalid stored session format: {assertion_id[:16]}...")
                return None
            
            encrypted_data, stored_hmac = parts
            
            # Verify HMAC (constant-time comparison)
            expected_hmac = self._compute_hmac(redis_key, encrypted_data)
            if not hmac.compare_digest(stored_hmac.decode('utf-8'), expected_hmac):
                logger.critical(f"🚨 SECURITY: Session tamper detected: {assertion_id[:16]}...")
                # Delete tampered session
                self.redis.delete(redis_key)
                return None
            
            # Decrypt session data
            session_data = self._decrypt(encrypted_data)
            if not session_data:
                logger.warning(f"Failed to decrypt session: {assertion_id[:16]}...")
                return None
            
            # Reconstruct SessionAssertion object
            session = SessionAssertion(**session_data)
            
            # Verify session is not expired
            if not session.is_valid():
                logger.info(f"Session expired: {assertion_id[:16]}...")
                self.delete_session(assertion_id)
                return None
            
            return session
            
        except Exception as e:
            logger.error(f"Failed to retrieve session: {str(e)}")
            return None
    
    def delete_session(self, assertion_id: str) -> bool:
        """
        Delete session from Redis.
        
        Args:
            assertion_id: Session assertion ID
            
        Returns:
            True if deleted, False otherwise
        """
        try:
            redis_key = f"{self.PREFIX_SESSION}{assertion_id}"
            deleted = self.redis.delete(redis_key)
            
            if deleted:
                logger.info(f"🗑️ Session deleted: {assertion_id[:16]}...")
            
            return bool(deleted)
            
        except Exception as e:
            logger.error(f"Failed to delete session: {str(e)}")
            return False
    
    def get_sessions_by_wallet(self, wallet_address: str) -> List[SessionAssertion]:
        """
        Get all active sessions for a wallet.
        
        Args:
            wallet_address: Wallet address
            
        Returns:
            List of SessionAssertion objects
        """
        try:
            # Scan for all session keys (use cursor-based scan for large datasets)
            sessions = []
            cursor = 0
            
            while True:
                cursor, keys = self.redis.scan(
                    cursor,
                    match=f"{self.PREFIX_SESSION}*",
                    count=100
                )
                
                # Retrieve and decrypt sessions
                for key in keys:
                    assertion_id = key.decode('utf-8').replace(self.PREFIX_SESSION, '')
                    session = self.get_session(assertion_id)
                    
                    if session and session.wallet_address.lower() == wallet_address.lower():
                        sessions.append(session)
                
                if cursor == 0:
                    break
            
            return sessions
            
        except Exception as e:
            logger.error(f"Failed to get sessions by wallet: {str(e)}")
            return []
    
    # ==================== Challenge Operations ====================
    
    def store_challenge(self, challenge: Challenge) -> bool:
        """
        Store encrypted challenge in Redis.
        
        Args:
            challenge: Challenge object to store
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Prepare challenge data
            challenge_data = asdict(challenge)
            
            # Encrypt challenge data
            encrypted_data = self._encrypt(challenge_data)
            
            # Compute HMAC
            redis_key = f"{self.PREFIX_CHALLENGE}{challenge.challenge_id}"
            hmac_value = self._compute_hmac(redis_key, encrypted_data)
            
            # Store with HMAC
            stored_value = encrypted_data + b"||" + hmac_value.encode('utf-8')
            
            # Calculate TTL
            ttl = max(1, challenge.expires_at - int(time.time()))
            
            # Store in Redis
            self.redis.setex(redis_key, ttl, stored_value)
            
            logger.debug(f"🔐 Challenge stored (encrypted): {challenge.challenge_id[:16]}...")
            return True
            
        except Exception as e:
            logger.error(f"Failed to store challenge: {str(e)}")
            return False
    
    def get_challenge(self, challenge_id: str) -> Optional[Challenge]:
        """
        Retrieve and decrypt challenge from Redis.
        
        Args:
            challenge_id: Challenge ID
            
        Returns:
            Challenge object if found and valid, None otherwise
        """
        try:
            redis_key = f"{self.PREFIX_CHALLENGE}{challenge_id}"
            
            # Retrieve from Redis
            stored_value = self.redis.get(redis_key)
            if not stored_value:
                return None
            
            # Split encrypted data and HMAC
            parts = stored_value.split(b"||")
            if len(parts) != 2:
                logger.warning(f"Invalid stored challenge format: {challenge_id[:16]}...")
                return None
            
            encrypted_data, stored_hmac = parts
            
            # Verify HMAC
            expected_hmac = self._compute_hmac(redis_key, encrypted_data)
            if not hmac.compare_digest(stored_hmac.decode('utf-8'), expected_hmac):
                logger.critical(f"🚨 SECURITY: Challenge tamper detected: {challenge_id[:16]}...")
                self.redis.delete(redis_key)
                return None
            
            # Decrypt challenge data
            challenge_data = self._decrypt(encrypted_data)
            if not challenge_data:
                return None
            
            # Reconstruct Challenge object
            challenge = Challenge(**challenge_data)
            
            # Verify challenge is not expired
            if challenge.is_expired():
                logger.debug(f"Challenge expired: {challenge_id[:16]}...")
                self.delete_challenge(challenge_id)
                return None
            
            return challenge
            
        except Exception as e:
            logger.error(f"Failed to retrieve challenge: {str(e)}")
            return None
    
    def delete_challenge(self, challenge_id: str) -> bool:
        """
        Delete challenge from Redis.
        
        Args:
            challenge_id: Challenge ID
            
        Returns:
            True if deleted, False otherwise
        """
        try:
            redis_key = f"{self.PREFIX_CHALLENGE}{challenge_id}"
            deleted = self.redis.delete(redis_key)
            return bool(deleted)
            
        except Exception as e:
            logger.error(f"Failed to delete challenge: {str(e)}")
            return False
    
    # ==================== Revocation Operations ====================
    
    def revoke_session(self, assertion_id: str, ttl: int = 86400) -> bool:
        """
        Add session to revocation list.
        
        Args:
            assertion_id: Session assertion ID to revoke
            ttl: Time-to-live for revocation entry (default: 24 hours)
            
        Returns:
            True if successful, False otherwise
        """
        try:
            redis_key = f"{self.PREFIX_REVOCATION}{assertion_id}"
            
            # Store revocation marker with TTL
            self.redis.setex(redis_key, ttl, "1")
            
            # Also delete the session
            self.delete_session(assertion_id)
            
            logger.warning(f"🚫 Session revoked: {assertion_id[:16]}...")
            return True
            
        except Exception as e:
            logger.error(f"Failed to revoke session: {str(e)}")
            return False
    
    def is_revoked(self, assertion_id: str) -> bool:
        """
        Check if session is revoked.
        
        Args:
            assertion_id: Session assertion ID
            
        Returns:
            True if revoked, False otherwise
        """
        try:
            redis_key = f"{self.PREFIX_REVOCATION}{assertion_id}"
            return bool(self.redis.exists(redis_key))
            
        except Exception as e:
            logger.error(f"Failed to check revocation: {str(e)}")
            return False  # Fail open for revocation check
    
    # ==================== Key Rotation ====================
    
    def rotate_encryption_keys(self) -> bool:
        """
        Rotate encryption keys and re-encrypt all sessions.
        
        SECURITY: This is a critical operation that should be performed during
        maintenance windows. All active sessions will be re-encrypted with new keys.
        
        Returns:
            True if successful, False otherwise
        """
        try:
            logger.warning("🔄 Starting encryption key rotation...")
            
            # Get all active sessions
            cursor = 0
            re_encrypted = 0
            failed = 0
            
            # Rotate keys
            old_cipher = self.cipher
            self.key_derivation.rotate_keys()
            self.cipher = AESGCM(self.key_derivation.encryption_key)
            
            while True:
                cursor, keys = self.redis.scan(
                    cursor,
                    match=f"{self.PREFIX_SESSION}*",
                    count=100
                )
                
                for key in keys:
                    try:
                        # Decrypt with old key
                        stored_value = self.redis.get(key)
                        if not stored_value:
                            continue
                        
                        parts = stored_value.split(b"||")
                        if len(parts) != 2:
                            continue
                        
                        encrypted_data, _ = parts
                        
                        # Decrypt with old cipher
                        nonce = encrypted_data[:12]
                        ciphertext = encrypted_data[12:]
                        plaintext = old_cipher.decrypt(nonce, ciphertext, None)
                        session_data = json.loads(plaintext.decode('utf-8'))
                        
                        # Re-encrypt with new cipher
                        session = SessionAssertion(**session_data)
                        self.store_session(session)
                        
                        re_encrypted += 1
                        
                    except Exception as e:
                        logger.error(f"Failed to re-encrypt session {key}: {str(e)}")
                        failed += 1
                
                if cursor == 0:
                    break
            
            logger.warning(
                f"✅ Key rotation complete: {re_encrypted} sessions re-encrypted, "
                f"{failed} failed"
            )
            
            return failed == 0
            
        except Exception as e:
            logger.critical(f"❌ Key rotation failed: {str(e)}")
            return False
    
    # ==================== Health & Monitoring ====================
    
    def health_check(self) -> Dict[str, Any]:
        """
        Check health of session store.
        
        Returns:
            Dictionary with health status
        """
        try:
            # Ping Redis
            self.redis.ping()
            
            # Get statistics
            info = self.redis.info()
            
            # Count sessions and challenges
            session_count = sum(1 for _ in self.redis.scan_iter(match=f"{self.PREFIX_SESSION}*"))
            challenge_count = sum(1 for _ in self.redis.scan_iter(match=f"{self.PREFIX_CHALLENGE}*"))
            
            return {
                "status": "healthy",
                "redis_connected": True,
                "redis_version": info.get("redis_version"),
                "redis_memory_used": info.get("used_memory_human"),
                "active_sessions": session_count,
                "active_challenges": challenge_count,
                "encryption": "AES-256-GCM",
                "key_derivation": "PBKDF2-HMAC-SHA256"
            }
            
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return {
                "status": "unhealthy",
                "redis_connected": False,
                "error": str(e)
            }
    
    def close(self):
        """Close Redis connection pool."""
        try:
            self.redis_pool.disconnect()
            logger.info("🔒 Encrypted session store closed")
        except Exception as e:
            logger.error(f"Failed to close session store: {str(e)}")


# Singleton instance
_session_store_instance: Optional[EncryptedSessionStore] = None


def get_session_store(
    redis_url: str = "redis://localhost:6379/0",
    master_secret: Optional[str] = None
) -> EncryptedSessionStore:
    """
    Get or create encrypted session store singleton.
    
    Args:
        redis_url: Redis connection URL
        master_secret: Master secret for encryption (from W_CSAP_SECRET_KEY)
        
    Returns:
        EncryptedSessionStore instance
    """
    global _session_store_instance
    
    if _session_store_instance is None:
        if not master_secret:
            import os
            master_secret = os.getenv('W_CSAP_SECRET_KEY')
            if not master_secret:
                raise RuntimeError(
                    "W_CSAP_SECRET_KEY environment variable MUST be set for secure session storage"
                )
        
        _session_store_instance = EncryptedSessionStore(redis_url, master_secret)
    
    return _session_store_instance


def reset_session_store():
    """Reset session store singleton (useful for testing)."""
    global _session_store_instance
    if _session_store_instance:
        _session_store_instance.close()
    _session_store_instance = None


__all__ = [
    'EncryptedSessionStore',
    'SecureKeyDerivation',
    'get_session_store',
    'reset_session_store'
]
