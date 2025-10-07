"""
W-CSAP Token Revocation Cache
==============================

Lightweight cache for revoked tokens. Only needs to store assertion IDs
until their natural expiry time. Uses in-memory dict by default,
with Redis support for production/distributed deployments.

CRITICAL SECURITY ENHANCEMENT:
Addresses the gap that stateless HMAC tokens can't be revoked mid-lifetime.
"""

import time
import logging
from typing import Optional, Dict, Set
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class RevocationCacheBackend(ABC):
    """Abstract base class for revocation cache backends."""
    
    @abstractmethod
    def revoke(self, assertion_id: str, expires_at: int) -> bool:
        """Revoke an assertion until its natural expiry."""
        pass
    
    @abstractmethod
    def is_revoked(self, assertion_id: str) -> bool:
        """Check if an assertion is revoked."""
        pass
    
    @abstractmethod
    def cleanup_expired(self) -> int:
        """Remove expired entries. Returns count of removed entries."""
        pass
    
    @abstractmethod
    def get_stats(self) -> Dict[str, int]:
        """Get cache statistics."""
        pass


class MemoryRevocationCache(RevocationCacheBackend):
    """
    In-memory revocation cache.
    
    Good for:
    - Development/testing
    - Single-instance deployments
    - Low-traffic applications
    
    Limitations:
    - Not shared across multiple instances
    - Lost on restart (by design - tokens expire naturally)
    """
    
    def __init__(self):
        self.cache: Dict[str, int] = {}  # assertion_id -> expires_at
        self.revocations_count = 0
        self.hits = 0
        self.misses = 0
        logger.info("📦 Memory revocation cache initialized")
    
    def revoke(self, assertion_id: str, expires_at: int) -> bool:
        """
        Add assertion to revocation list until its expiry.
        
        Args:
            assertion_id: Unique assertion identifier
            expires_at: Unix timestamp when token would naturally expire
            
        Returns:
            True if successfully revoked
        """
        current_time = int(time.time())
        ttl = expires_at - current_time
        
        if ttl <= 0:
            # Already expired naturally, no need to cache
            logger.debug(f"Assertion {assertion_id[:16]}... already expired")
            return False
        
        self.cache[assertion_id] = expires_at
        self.revocations_count += 1
        
        logger.info(
            f"🚫 Revoked assertion {assertion_id[:16]}... "
            f"(TTL: {ttl}s, expires: {expires_at})"
        )
        return True
    
    def is_revoked(self, assertion_id: str) -> bool:
        """
        Check if an assertion is revoked.
        
        Args:
            assertion_id: Assertion identifier to check
            
        Returns:
            True if revoked and not yet expired
        """
        if assertion_id not in self.cache:
            self.misses += 1
            return False
        
        # Check if still within revocation period
        current_time = int(time.time())
        expires_at = self.cache[assertion_id]
        
        if current_time >= expires_at:
            # Natural expiry reached, remove from cache
            del self.cache[assertion_id]
            self.misses += 1
            return False
        
        # Still revoked
        self.hits += 1
        logger.debug(f"🛑 Blocked revoked assertion {assertion_id[:16]}...")
        return True
    
    def cleanup_expired(self) -> int:
        """
        Remove expired entries from cache.
        
        Returns:
            Number of entries removed
        """
        current_time = int(time.time())
        expired = [
            aid for aid, exp in self.cache.items()
            if current_time >= exp
        ]
        
        for aid in expired:
            del self.cache[aid]
        
        if expired:
            logger.info(f"🧹 Cleaned up {len(expired)} expired revocation entries")
        
        return len(expired)
    
    def get_stats(self) -> Dict[str, int]:
        """Get cache statistics."""
        return {
            "active_revocations": len(self.cache),
            "total_revocations": self.revocations_count,
            "cache_hits": self.hits,
            "cache_misses": self.misses,
            "hit_rate": round(self.hits / (self.hits + self.misses) * 100, 2) if (self.hits + self.misses) > 0 else 0
        }


class RedisRevocationCache(RevocationCacheBackend):
    """
    Redis-backed revocation cache.
    
    Good for:
    - Production deployments
    - Multi-instance applications
    - High-traffic scenarios
    
    Advantages:
    - Shared across all instances
    - Persists across restarts (optional)
    - Better performance at scale
    """
    
    def __init__(self, redis_url: str):
        try:
            import redis
            self.redis = redis.from_url(redis_url, decode_responses=True)
            self.redis.ping()  # Test connection
            self.revocations_count = 0
            logger.info(f"📦 Redis revocation cache initialized: {redis_url}")
        except ImportError:
            raise ImportError(
                "Redis support requires 'redis' package. "
                "Install with: pip install redis"
            )
        except Exception as e:
            raise ConnectionError(f"Failed to connect to Redis: {str(e)}")
    
    def _key(self, assertion_id: str) -> str:
        """Generate Redis key for assertion."""
        return f"w_csap:revoked:{assertion_id}"
    
    def revoke(self, assertion_id: str, expires_at: int) -> bool:
        """
        Add assertion to Redis revocation set with TTL.
        
        Args:
            assertion_id: Unique assertion identifier
            expires_at: Unix timestamp when token would naturally expire
            
        Returns:
            True if successfully revoked
        """
        current_time = int(time.time())
        ttl = expires_at - current_time
        
        if ttl <= 0:
            logger.debug(f"Assertion {assertion_id[:16]}... already expired")
            return False
        
        # Set key with expiry matching token's natural expiry
        key = self._key(assertion_id)
        self.redis.setex(key, ttl, "1")
        self.revocations_count += 1
        
        logger.info(
            f"🚫 Revoked assertion {assertion_id[:16]}... in Redis "
            f"(TTL: {ttl}s)"
        )
        return True
    
    def is_revoked(self, assertion_id: str) -> bool:
        """
        Check if an assertion is revoked in Redis.
        
        Args:
            assertion_id: Assertion identifier to check
            
        Returns:
            True if revoked and not yet expired
        """
        key = self._key(assertion_id)
        exists = self.redis.exists(key)
        
        if exists:
            logger.debug(f"🛑 Blocked revoked assertion {assertion_id[:16]}...")
            return True
        
        return False
    
    def cleanup_expired(self) -> int:
        """
        Redis automatically expires keys, no manual cleanup needed.
        
        Returns:
            0 (Redis handles expiry automatically)
        """
        # Redis handles TTL expiry automatically
        return 0
    
    def get_stats(self) -> Dict[str, int]:
        """Get cache statistics from Redis."""
        # Count active revocations
        pattern = self._key("*")
        active_count = len(list(self.redis.scan_iter(match=pattern)))
        
        return {
            "active_revocations": active_count,
            "total_revocations": self.revocations_count,
            "backend": "redis"
        }


class RevocationCache:
    """
    Main revocation cache interface.
    Automatically selects backend based on configuration.
    """
    
    def __init__(self, cache_type: str = "memory", redis_url: Optional[str] = None):
        """
        Initialize revocation cache.
        
        Args:
            cache_type: "memory" or "redis"
            redis_url: Redis connection URL (required if cache_type="redis")
        """
        if cache_type == "redis":
            if not redis_url:
                raise ValueError("redis_url required when cache_type='redis'")
            self.backend = RedisRevocationCache(redis_url)
        elif cache_type == "memory":
            self.backend = MemoryRevocationCache()
        else:
            raise ValueError(f"Invalid cache_type: {cache_type}. Use 'memory' or 'redis'")
        
        self.cache_type = cache_type
    
    def revoke_assertion(self, assertion_id: str, expires_at: int) -> bool:
        """
        Revoke an assertion until its natural expiry.
        
        Args:
            assertion_id: Unique assertion identifier
            expires_at: Unix timestamp when token expires
            
        Returns:
            True if successfully revoked
        """
        return self.backend.revoke(assertion_id, expires_at)
    
    def is_revoked(self, assertion_id: str) -> bool:
        """
        Check if an assertion is revoked.
        
        Args:
            assertion_id: Assertion identifier to check
            
        Returns:
            True if revoked
        """
        return self.backend.is_revoked(assertion_id)
    
    def cleanup_expired(self) -> int:
        """
        Clean up expired entries (memory cache only).
        
        Returns:
            Number of entries removed
        """
        return self.backend.cleanup_expired()
    
    def get_stats(self) -> Dict[str, int]:
        """
        Get revocation cache statistics.
        
        Returns:
            Dictionary with cache stats
        """
        stats = self.backend.get_stats()
        stats["cache_type"] = self.cache_type
        return stats
    
    def revoke_all_sessions_for_wallet(
        self,
        wallet_address: str,
        active_sessions: list
    ) -> int:
        """
        Revoke all active sessions for a wallet.
        
        Use cases:
        - User initiates "logout all devices"
        - Security incident response
        - Suspicious activity detected
        - Admin-initiated revocation
        
        Args:
            wallet_address: Wallet address
            active_sessions: List of active session dicts from database
            
        Returns:
            Number of sessions revoked
        """
        revoked_count = 0
        
        for session in active_sessions:
            if self.revoke_assertion(
                session['assertion_id'],
                session['expires_at']
            ):
                revoked_count += 1
        
        logger.warning(
            f"🚨 Revoked {revoked_count} sessions for wallet "
            f"{wallet_address[:10]}... (security action)"
        )
        
        return revoked_count


# Singleton instance
_revocation_cache_instance: Optional[RevocationCache] = None


def get_revocation_cache(
    cache_type: str = "memory",
    redis_url: Optional[str] = None
) -> RevocationCache:
    """
    Get or create revocation cache singleton.
    
    Args:
        cache_type: "memory" or "redis"
        redis_url: Redis connection URL (if using Redis)
        
    Returns:
        RevocationCache instance
    """
    global _revocation_cache_instance
    
    if _revocation_cache_instance is None:
        _revocation_cache_instance = RevocationCache(cache_type, redis_url)
    
    return _revocation_cache_instance


def reset_revocation_cache():
    """Reset revocation cache singleton (useful for testing)."""
    global _revocation_cache_instance
    _revocation_cache_instance = None


__all__ = [
    'RevocationCache',
    'MemoryRevocationCache',
    'RedisRevocationCache',
    'get_revocation_cache',
    'reset_revocation_cache'
]
