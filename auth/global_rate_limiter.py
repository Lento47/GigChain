"""
W-CSAP Global Rate Limiter - HIGH SECURITY FIX
===============================================

Global rate limiting per wallet address to prevent distributed brute-force attacks.
Fixes HIGH-004: No Global Rate Limiting Per Wallet
"""

import time
import logging
from typing import Tuple, Optional, Dict, Any
from enum import Enum
import redis
from redis.exceptions import RedisError

logger = logging.getLogger(__name__)


class RateLimitAction(str, Enum):
    """Rate limit action types."""
    CHALLENGE_REQUEST = "challenge_request"
    VERIFY_ATTEMPT = "verify_attempt"
    REFRESH_REQUEST = "refresh_request"
    FAILED_AUTH = "failed_auth"
    LOGIN_SUCCESS = "login_success"


class RateLimitConfig:
    """Configuration for rate limiting."""
    def __init__(
        self,
        challenge_per_hour: int = 50,
        verify_per_hour: int = 50,
        refresh_per_hour: int = 100,
        failed_auth_per_hour: int = 10,
        challenge_per_day: int = 200,
        verify_per_day: int = 200,
        refresh_per_day: int = 500,
        failed_auth_per_day: int = 30,
        max_failed_before_lockout: int = 5,
        lockout_duration: int = 900
    ):
        self.challenge_per_hour = challenge_per_hour
        self.verify_per_hour = verify_per_hour
        self.refresh_per_hour = refresh_per_hour
        self.failed_auth_per_hour = failed_auth_per_hour
        self.challenge_per_day = challenge_per_day
        self.verify_per_day = verify_per_day
        self.refresh_per_day = refresh_per_day
        self.failed_auth_per_day = failed_auth_per_day
        self.max_failed_before_lockout = max_failed_before_lockout
        self.lockout_duration = lockout_duration
        self.progressive_lockout_multiplier = 2.0


class GlobalRateLimiter:
    """
    Global rate limiter using Redis with sliding window algorithm.
    """
    
    PREFIX_RATE_LIMIT = "wcsap:ratelimit:"
    PREFIX_LOCKOUT = "wcsap:lockout:"
    PREFIX_VIOLATION = "wcsap:violation:"
    
    def __init__(self, redis_url: str, config: Optional[RateLimitConfig] = None):
        """Initialize global rate limiter."""
        self.config = config or RateLimitConfig()
        
        try:
            self.redis = redis.from_url(
                redis_url,
                decode_responses=False,
                socket_timeout=2,
                socket_connect_timeout=2
            )
            self.redis.ping()
            logger.info("Global rate limiter connected to Redis")
        except RedisError as e:
            logger.critical(f"Failed to connect to Redis for rate limiting: {str(e)}")
            raise RuntimeError(f"Rate limiter initialization failed: {str(e)}")
    
    def check_rate_limit(
        self,
        wallet_address: str,
        action: RateLimitAction,
        ip_address: Optional[str] = None
    ) -> Tuple[bool, int, str]:
        """
        Check if rate limit is exceeded for a wallet.
        
        Returns:
            Tuple of (is_allowed, attempts_remaining, reason)
        """
        try:
            wallet_address = wallet_address.lower()
            
            # Check if wallet is locked out
            if self._is_locked_out(wallet_address):
                lockout_remaining = self._get_lockout_remaining(wallet_address)
                logger.warning(f"Rate limit: Wallet locked out: {wallet_address[:10]}...")
                return False, 0, f"Account locked. Try again in {lockout_remaining}s"
            
            # Get limits for this action
            hourly_limit, daily_limit = self._get_limits_for_action(action)
            
            # Check hourly limit
            hourly_key = f"{self.PREFIX_RATE_LIMIT}{wallet_address}:{action.value}:hour"
            hourly_count = self._count_requests_in_window(hourly_key, 3600)
            
            if hourly_count >= hourly_limit:
                logger.warning(f"Rate limit: Hourly limit exceeded for {wallet_address[:10]}...")
                self._record_violation(wallet_address, "hourly_limit_exceeded")
                return False, 0, f"Hourly rate limit exceeded ({hourly_limit} requests/hour)"
            
            # Check daily limit
            daily_key = f"{self.PREFIX_RATE_LIMIT}{wallet_address}:{action.value}:day"
            daily_count = self._count_requests_in_window(daily_key, 86400)
            
            if daily_count >= daily_limit:
                logger.warning(f"Rate limit: Daily limit exceeded for {wallet_address[:10]}...")
                self._record_violation(wallet_address, "daily_limit_exceeded")
                return False, 0, f"Daily rate limit exceeded ({daily_limit} requests/day)"
            
            # All checks passed
            attempts_remaining = min(
                hourly_limit - hourly_count - 1,
                daily_limit - daily_count - 1
            )
            
            return True, attempts_remaining, "OK"
            
        except Exception as e:
            logger.error(f"Rate limit check error: {str(e)}")
            # FAIL OPEN for rate limiting (don't block if Redis is down)
            return True, 999, "Rate limit check unavailable"
    
    def record_request(
        self,
        wallet_address: str,
        action: RateLimitAction,
        ip_address: Optional[str] = None,
        success: bool = True
    ) -> bool:
        """Record a request for rate limiting."""
        try:
            wallet_address = wallet_address.lower()
            current_time = time.time()
            
            # Record in hourly window
            hourly_key = f"{self.PREFIX_RATE_LIMIT}{wallet_address}:{action.value}:hour"
            self.redis.zadd(hourly_key, {str(current_time): current_time})
            self.redis.expire(hourly_key, 3600)
            
            # Record in daily window
            daily_key = f"{self.PREFIX_RATE_LIMIT}{wallet_address}:{action.value}:day"
            self.redis.zadd(daily_key, {str(current_time): current_time})
            self.redis.expire(daily_key, 86400)
            
            # Check for lockout on failed auth
            if action == RateLimitAction.FAILED_AUTH and not success:
                self._check_and_apply_lockout(wallet_address)
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to record request: {str(e)}")
            return False
    
    def _count_requests_in_window(self, key: str, window_seconds: int) -> int:
        """Count requests in sliding time window."""
        try:
            current_time = time.time()
            window_start = current_time - window_seconds
            
            # Remove old entries
            self.redis.zremrangebyscore(key, 0, window_start)
            
            # Count remaining entries
            count = self.redis.zcard(key)
            return count
            
        except Exception as e:
            logger.error(f"Failed to count requests: {str(e)}")
            return 0
    
    def _get_limits_for_action(self, action: RateLimitAction) -> Tuple[int, int]:
        """Get hourly and daily limits for an action."""
        if action == RateLimitAction.CHALLENGE_REQUEST:
            return self.config.challenge_per_hour, self.config.challenge_per_day
        elif action == RateLimitAction.VERIFY_ATTEMPT:
            return self.config.verify_per_hour, self.config.verify_per_day
        elif action == RateLimitAction.REFRESH_REQUEST:
            return self.config.refresh_per_hour, self.config.refresh_per_day
        elif action == RateLimitAction.FAILED_AUTH:
            return self.config.failed_auth_per_hour, self.config.failed_auth_per_day
        else:
            return 100, 1000  # Default
    
    def _is_locked_out(self, wallet_address: str) -> bool:
        """Check if wallet is locked out."""
        try:
            lockout_key = f"{self.PREFIX_LOCKOUT}{wallet_address}"
            return bool(self.redis.exists(lockout_key))
        except Exception:
            return False
    
    def _get_lockout_remaining(self, wallet_address: str) -> int:
        """Get remaining lockout time."""
        try:
            lockout_key = f"{self.PREFIX_LOCKOUT}{wallet_address}"
            ttl = self.redis.ttl(lockout_key)
            return max(0, ttl)
        except Exception:
            return 0
    
    def _check_and_apply_lockout(self, wallet_address: str):
        """Check failed attempts and apply lockout."""
        try:
            failed_key = f"{self.PREFIX_RATE_LIMIT}{wallet_address}:{RateLimitAction.FAILED_AUTH.value}:hour"
            failed_count = self._count_requests_in_window(failed_key, 3600)
            
            if failed_count >= self.config.max_failed_before_lockout:
                violation_count = self._get_violation_count(wallet_address)
                
                # Progressive lockout
                lockout_duration = int(
                    self.config.lockout_duration *
                    (self.config.progressive_lockout_multiplier ** violation_count)
                )
                lockout_duration = min(lockout_duration, 86400)  # Max 24h
                
                # Apply lockout
                lockout_key = f"{self.PREFIX_LOCKOUT}{wallet_address}"
                self.redis.setex(lockout_key, lockout_duration, "1")
                
                logger.critical(
                    f"SECURITY: Wallet locked out: {wallet_address[:10]}... "
                    f"(duration: {lockout_duration}s, violations: {violation_count})"
                )
                
                self._record_violation(wallet_address, "lockout_applied")
                
        except Exception as e:
            logger.error(f"Failed to check/apply lockout: {str(e)}")
    
    def _record_violation(self, wallet_address: str, violation_type: str):
        """Record a rate limit violation."""
        try:
            violation_key = f"{self.PREFIX_VIOLATION}{wallet_address}"
            current_time = time.time()
            
            self.redis.zadd(violation_key, {f"{violation_type}:{current_time}": current_time})
            self.redis.expire(violation_key, 604800)  # 7 days
            
            # Cleanup old violations
            week_ago = current_time - 604800
            self.redis.zremrangebyscore(violation_key, 0, week_ago)
            
        except Exception as e:
            logger.error(f"Failed to record violation: {str(e)}")
    
    def _get_violation_count(self, wallet_address: str) -> int:
        """Get violation count for wallet."""
        try:
            violation_key = f"{self.PREFIX_VIOLATION}{wallet_address}"
            return self.redis.zcard(violation_key)
        except Exception:
            return 0
    
    def get_wallet_status(self, wallet_address: str) -> Dict[str, Any]:
        """Get rate limit status for wallet."""
        try:
            wallet_address = wallet_address.lower()
            
            status = {
                "wallet_address": wallet_address,
                "is_locked_out": self._is_locked_out(wallet_address),
                "lockout_remaining": self._get_lockout_remaining(wallet_address),
                "violation_count": self._get_violation_count(wallet_address),
                "current_counts": {}
            }
            
            # Get counts for each action
            for action in RateLimitAction:
                hourly_key = f"{self.PREFIX_RATE_LIMIT}{wallet_address}:{action.value}:hour"
                daily_key = f"{self.PREFIX_RATE_LIMIT}{wallet_address}:{action.value}:day"
                
                hourly_count = self._count_requests_in_window(hourly_key, 3600)
                daily_count = self._count_requests_in_window(daily_key, 86400)
                
                hourly_limit, daily_limit = self._get_limits_for_action(action)
                
                status["current_counts"][action.value] = {
                    "hourly": {"count": hourly_count, "limit": hourly_limit},
                    "daily": {"count": daily_count, "limit": daily_limit}
                }
            
            return status
            
        except Exception as e:
            logger.error(f"Failed to get wallet status: {str(e)}")
            return {"error": str(e)}
    
    def reset_wallet_limits(self, wallet_address: str) -> bool:
        """Reset rate limits for wallet (admin function)."""
        try:
            wallet_address = wallet_address.lower()
            
            # Delete rate limit keys
            pattern = f"{self.PREFIX_RATE_LIMIT}{wallet_address}:*"
            for key in self.redis.scan_iter(match=pattern):
                self.redis.delete(key)
            
            # Delete lockout
            lockout_key = f"{self.PREFIX_LOCKOUT}{wallet_address}"
            self.redis.delete(lockout_key)
            
            logger.info(f"Rate limits reset for wallet: {wallet_address[:10]}...")
            return True
            
        except Exception as e:
            logger.error(f"Failed to reset wallet limits: {str(e)}")
            return False


# Singleton
_rate_limiter_instance: Optional[GlobalRateLimiter] = None


def get_rate_limiter(
    redis_url: str = "redis://localhost:6379/0",
    config: Optional[RateLimitConfig] = None
) -> GlobalRateLimiter:
    """Get or create global rate limiter singleton."""
    global _rate_limiter_instance
    
    if _rate_limiter_instance is None:
        _rate_limiter_instance = GlobalRateLimiter(redis_url, config)
    
    return _rate_limiter_instance


def reset_rate_limiter():
    """Reset rate limiter singleton."""
    global _rate_limiter_instance
    _rate_limiter_instance = None


__all__ = [
    'GlobalRateLimiter',
    'RateLimitAction',
    'RateLimitConfig',
    'get_rate_limiter',
    'reset_rate_limiter'
]
