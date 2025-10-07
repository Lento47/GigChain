"""
Global Rate Limiting - FIX for HIGH-001

Prevents distributed rate limit bypass via IP rotation.
Tracks authentication attempts per wallet across ALL IPs.

Security Enhancement: Zero-Trust Layer
"""

import time
from typing import Dict, Tuple, Optional
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class GlobalRateLimiter:
    """
    Global rate limiter that tracks attempts per wallet address
    regardless of source IP.
    
    Prevents distributed brute-force attacks via IP rotation.
    
    Security Benefits:
    - Prevents attackers from bypassing IP-based rate limits
    - Protects against botnet-based attacks
    - Reduces server resource abuse
    - Automatic lockout for excessive attempts
    """
    
    def __init__(
        self,
        max_attempts_per_hour: int = 50,
        max_attempts_per_day: int = 200,
        lockout_duration: int = 3600,  # 1 hour
        cleanup_interval: int = 3600  # 1 hour
    ):
        """
        Initialize global rate limiter.
        
        Args:
            max_attempts_per_hour: Max attempts per wallet per hour
            max_attempts_per_day: Max attempts per wallet per day
            lockout_duration: Lockout duration after threshold breach
            cleanup_interval: How often to clean expired entries
        """
        self.max_per_hour = max_attempts_per_hour
        self.max_per_day = max_attempts_per_day
        self.lockout_duration = lockout_duration
        self.cleanup_interval = cleanup_interval
        
        # wallet_address -> (hourly_count, hourly_reset, daily_count, daily_reset)
        self._wallet_attempts: Dict[str, Tuple[int, int, int, int]] = {}
        
        # wallet_address -> lockout_until_timestamp
        self._lockouts: Dict[str, int] = {}
        
        # Last cleanup time
        self._last_cleanup = int(time.time())
        
        logger.info(
            f"Global rate limiter initialized: "
            f"{max_attempts_per_hour}/hour, {max_attempts_per_day}/day"
        )
    
    def is_allowed(self, wallet_address: str) -> Tuple[bool, Optional[str]]:
        """
        Check if wallet is allowed to make a request.
        
        Args:
            wallet_address: Wallet address to check
            
        Returns:
            (allowed, reason) - allowed=False if rate limited
        """
        # Periodic cleanup
        self._cleanup_if_needed()
        
        current_time = int(time.time())
        
        # Check if locked out
        if wallet_address in self._lockouts:
            lockout_until = self._lockouts[wallet_address]
            
            if current_time < lockout_until:
                remaining = lockout_until - current_time
                logger.warning(
                    f"🚫 Wallet {wallet_address[:10]}... is locked out "
                    f"for {remaining}s more"
                )
                return (False, f"Account locked. Try again in {remaining}s")
            else:
                # Lockout expired
                del self._lockouts[wallet_address]
                logger.info(f"🔓 Lockout expired for {wallet_address[:10]}...")
        
        # Get or initialize attempt counters
        if wallet_address not in self._wallet_attempts:
            hourly_reset = current_time + 3600
            daily_reset = current_time + 86400
            self._wallet_attempts[wallet_address] = (1, hourly_reset, 1, daily_reset)
            logger.debug(f"✅ First attempt for {wallet_address[:10]}...")
            return (True, None)
        
        hourly_count, hourly_reset, daily_count, daily_reset = \
            self._wallet_attempts[wallet_address]
        
        # Reset hourly counter if expired
        if current_time >= hourly_reset:
            hourly_count = 0
            hourly_reset = current_time + 3600
            logger.debug(f"🔄 Hourly counter reset for {wallet_address[:10]}...")
        
        # Reset daily counter if expired
        if current_time >= daily_reset:
            daily_count = 0
            daily_reset = current_time + 86400
            logger.debug(f"🔄 Daily counter reset for {wallet_address[:10]}...")
        
        # Check hourly limit
        if hourly_count >= self.max_per_hour:
            logger.warning(
                f"⚠️ Wallet {wallet_address[:10]}... exceeded HOURLY limit "
                f"({hourly_count}/{self.max_per_hour})"
            )
            
            # Lockout for configured duration
            self._lockouts[wallet_address] = current_time + self.lockout_duration
            
            return (
                False,
                f"Hourly limit exceeded ({self.max_per_hour} attempts/hour). "
                f"Locked for {self.lockout_duration}s"
            )
        
        # Check daily limit
        if daily_count >= self.max_per_day:
            logger.warning(
                f"⚠️ Wallet {wallet_address[:10]}... exceeded DAILY limit "
                f"({daily_count}/{self.max_per_day})"
            )
            
            # Lockout for 24 hours
            self._lockouts[wallet_address] = current_time + 86400
            
            return (
                False,
                f"Daily limit exceeded ({self.max_per_day} attempts/day). "
                f"Locked for 24 hours"
            )
        
        # Increment counters
        hourly_count += 1
        daily_count += 1
        
        self._wallet_attempts[wallet_address] = (
            hourly_count, hourly_reset, daily_count, daily_reset
        )
        
        # Log warning if approaching limits
        if hourly_count > self.max_per_hour * 0.8:
            logger.warning(
                f"⚠️ Wallet {wallet_address[:10]}... approaching hourly limit: "
                f"{hourly_count}/{self.max_per_hour}"
            )
        
        logger.debug(
            f"✅ Wallet {wallet_address[:10]}... attempt {hourly_count}/{self.max_per_hour} "
            f"(hourly), {daily_count}/{self.max_per_day} (daily)"
        )
        
        return (True, None)
    
    def record_success(self, wallet_address: str):
        """
        Record successful authentication (resets counters).
        
        Called after successful authentication to reward legitimate users.
        
        Args:
            wallet_address: Wallet that successfully authenticated
        """
        # Successful auth - reset counters
        if wallet_address in self._wallet_attempts:
            del self._wallet_attempts[wallet_address]
        
        if wallet_address in self._lockouts:
            del self._lockouts[wallet_address]
        
        logger.info(
            f"✅ Reset rate limits for {wallet_address[:10]}... (successful auth)"
        )
    
    def record_failure(self, wallet_address: str):
        """
        Record failed authentication (keeps counters).
        
        Args:
            wallet_address: Wallet that failed authentication
        """
        logger.debug(f"❌ Failed auth for {wallet_address[:10]}... (counter kept)")
        # Counters already incremented in is_allowed()
    
    def get_status(self, wallet_address: str) -> Dict[str, any]:
        """
        Get rate limit status for a wallet.
        
        Args:
            wallet_address: Wallet to check
            
        Returns:
            Status dict with current limits and lockout info
        """
        current_time = int(time.time())
        
        # Check lockout
        if wallet_address in self._lockouts:
            lockout_until = self._lockouts[wallet_address]
            if current_time < lockout_until:
                return {
                    "locked": True,
                    "lockout_remaining": lockout_until - current_time,
                    "hourly_remaining": 0,
                    "daily_remaining": 0
                }
        
        # Get attempt counters
        if wallet_address not in self._wallet_attempts:
            return {
                "locked": False,
                "hourly_remaining": self.max_per_hour,
                "daily_remaining": self.max_per_day
            }
        
        hourly_count, hourly_reset, daily_count, daily_reset = \
            self._wallet_attempts[wallet_address]
        
        # Reset if expired
        if current_time >= hourly_reset:
            hourly_count = 0
        if current_time >= daily_reset:
            daily_count = 0
        
        return {
            "locked": False,
            "hourly_remaining": max(0, self.max_per_hour - hourly_count),
            "daily_remaining": max(0, self.max_per_day - daily_count),
            "hourly_used": hourly_count,
            "daily_used": daily_count
        }
    
    def _cleanup_if_needed(self):
        """Periodic cleanup of expired entries."""
        current_time = int(time.time())
        
        if current_time - self._last_cleanup < self.cleanup_interval:
            return  # Not time yet
        
        self._cleanup_expired()
        self._last_cleanup = current_time
    
    def _cleanup_expired(self):
        """Remove expired entries to prevent memory bloat."""
        current_time = int(time.time())
        
        # Clean up expired lockouts
        expired_lockouts = [
            wallet for wallet, until in self._lockouts.items()
            if current_time >= until
        ]
        for wallet in expired_lockouts:
            del self._lockouts[wallet]
        
        # Clean up expired attempt counters
        expired_attempts = [
            wallet for wallet, (_, h_reset, _, d_reset) in self._wallet_attempts.items()
            if current_time >= h_reset and current_time >= d_reset
        ]
        for wallet in expired_attempts:
            del self._wallet_attempts[wallet]
        
        if expired_lockouts or expired_attempts:
            logger.info(
                f"🧹 Cleanup: Removed {len(expired_lockouts)} lockouts, "
                f"{len(expired_attempts)} attempt counters"
            )


# Singleton instance
_global_rate_limiter: Optional[GlobalRateLimiter] = None


def get_global_rate_limiter(
    max_per_hour: int = 50,
    max_per_day: int = 200
) -> GlobalRateLimiter:
    """
    Get or create global rate limiter singleton.
    
    Args:
        max_per_hour: Max attempts per hour (default: 50)
        max_per_day: Max attempts per day (default: 200)
        
    Returns:
        GlobalRateLimiter instance
    """
    global _global_rate_limiter
    
    if _global_rate_limiter is None:
        _global_rate_limiter = GlobalRateLimiter(
            max_attempts_per_hour=max_per_hour,
            max_attempts_per_day=max_per_day,
            lockout_duration=3600  # 1 hour
        )
    
    return _global_rate_limiter


def reset_global_rate_limiter():
    """Reset global rate limiter singleton (useful for testing)."""
    global _global_rate_limiter
    _global_rate_limiter = None


__all__ = [
    'GlobalRateLimiter',
    'get_global_rate_limiter',
    'reset_global_rate_limiter'
]
