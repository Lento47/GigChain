"""
Proof-of-Work DDoS Protection - FIX for HIGH-002

Requires clients to solve computational puzzle before generating challenges.
Makes mass challenge generation expensive for attackers.

Security Enhancement: Resource Protection
"""

import hashlib
import secrets
import time
from typing import Optional, Tuple, Dict
import logging

logger = logging.getLogger(__name__)


class ProofOfWork:
    """
    Proof-of-Work challenge system for DDoS protection.
    
    Requires clients to find a nonce such that:
    SHA256(challenge + nonce) starts with N zero bits.
    
    Difficulty adapts based on current server load.
    
    Security Benefits:
    - Makes challenge spam computationally expensive
    - Prevents DDoS amplification attacks
    - Protects server resources
    - Adaptive difficulty based on load
    """
    
    def __init__(
        self,
        base_difficulty: int = 4,
        max_difficulty: int = 12,
        min_difficulty: int = 2,
        target_solve_time: float = 3.0  # Target 3 seconds
    ):
        """
        Initialize PoW system.
        
        Args:
            base_difficulty: Number of leading zero bits required
                            (4 = ~16 attempts, 8 = ~256 attempts, 12 = ~4096 attempts)
            max_difficulty: Maximum difficulty (prevents DoS of legitimate users)
            min_difficulty: Minimum difficulty (always some work required)
            target_solve_time: Target solve time in seconds for difficulty adjustment
        """
        self.base_difficulty = base_difficulty
        self.max_difficulty = max_difficulty
        self.min_difficulty = min_difficulty
        self.target_solve_time = target_solve_time
        
        # Active challenges: challenge -> (timestamp, difficulty)
        self._active_challenges: Dict[str, Tuple[int, int]] = {}
        
        # Recent verifications: (timestamp, solve_duration)
        self._recent_verifications = []
        
        # Statistics
        self._total_issued = 0
        self._total_solved = 0
        self._total_failed = 0
        
        logger.info(
            f"Proof-of-Work initialized: difficulty {base_difficulty} "
            f"(range: {min_difficulty}-{max_difficulty})"
        )
    
    def generate_challenge(self) -> Tuple[str, int]:
        """
        Generate a PoW challenge.
        
        Returns:
            (challenge_string, difficulty)
        """
        challenge = secrets.token_hex(16)
        difficulty = self._get_adaptive_difficulty()
        
        self._active_challenges[challenge] = (int(time.time()), difficulty)
        self._total_issued += 1
        
        logger.debug(
            f"🎯 Generated PoW challenge (difficulty: {difficulty}, "
            f"expected ~{2**difficulty} attempts)"
        )
        
        return (challenge, difficulty)
    
    def verify_solution(
        self,
        challenge: str,
        nonce: str,
        difficulty: int,
        max_age: int = 300  # 5 minutes
    ) -> Tuple[bool, Optional[str]]:
        """
        Verify PoW solution.
        
        Args:
            challenge: Original challenge
            nonce: Proposed solution
            difficulty: Required difficulty
            max_age: Maximum challenge age in seconds
            
        Returns:
            (valid, error_message)
        """
        current_time = int(time.time())
        
        # Check if challenge exists
        if challenge not in self._active_challenges:
            self._total_failed += 1
            logger.warning("❌ PoW: Invalid or expired challenge")
            return (False, "Invalid or expired challenge")
        
        challenge_time, challenge_difficulty = self._active_challenges[challenge]
        
        # Check challenge age
        age = current_time - challenge_time
        
        if age > max_age:
            del self._active_challenges[challenge]
            self._total_failed += 1
            logger.warning(f"❌ PoW: Challenge expired (age: {age}s)")
            return (False, f"Challenge expired (age: {age}s, max: {max_age}s)")
        
        # Check difficulty matches
        if difficulty != challenge_difficulty:
            self._total_failed += 1
            logger.warning(
                f"❌ PoW: Difficulty mismatch "
                f"(expected {challenge_difficulty}, got {difficulty})"
            )
            return (False, "Difficulty mismatch")
        
        # Verify solution
        solution = f"{challenge}{nonce}"
        hash_result = hashlib.sha256(solution.encode()).hexdigest()
        
        # Count leading zero bits
        leading_zeros = self._count_leading_zero_bits(hash_result)
        
        is_valid = leading_zeros >= difficulty
        
        if is_valid:
            # Remove challenge (single-use)
            del self._active_challenges[challenge]
            
            # Record verification time
            self._recent_verifications.append((current_time, age))
            
            # Keep only last 100
            if len(self._recent_verifications) > 100:
                self._recent_verifications = self._recent_verifications[-100:]
            
            self._total_solved += 1
            
            logger.info(
                f"✅ PoW verified (difficulty: {difficulty}, "
                f"leading zeros: {leading_zeros}, time: {age:.2f}s)"
            )
            return (True, None)
        else:
            self._total_failed += 1
            logger.warning(
                f"❌ PoW: Invalid solution "
                f"(got {leading_zeros} zeros, needed {difficulty})"
            )
            return (
                False,
                f"Solution has insufficient zeros ({leading_zeros}/{difficulty})"
            )
    
    def _count_leading_zero_bits(self, hex_string: str) -> int:
        """
        Count leading zero bits in hex string.
        
        Args:
            hex_string: Hex hash string
            
        Returns:
            Number of leading zero bits
        """
        leading_zeros = 0
        
        for char in hex_string:
            # Convert hex char to 4-bit binary
            bits = bin(int(char, 16))[2:].zfill(4)
            
            # Count zeros until we hit a 1
            for bit in bits:
                if bit == '0':
                    leading_zeros += 1
                else:
                    return leading_zeros  # Stop at first 1
        
        return leading_zeros
    
    def _get_adaptive_difficulty(self) -> int:
        """
        Adapt difficulty based on recent verification times.
        
        If clients are solving too quickly → increase difficulty
        If too slowly → decrease difficulty
        
        Returns:
            Adjusted difficulty level
        """
        if len(self._recent_verifications) < 10:
            # Not enough data, use base difficulty
            return self.base_difficulty
        
        # Calculate average solve time from last 10
        recent = self._recent_verifications[-10:]
        avg_time = sum(duration for _, duration in recent) / len(recent)
        
        # Adjust difficulty based on target
        if avg_time < self.target_solve_time * 0.5:
            # Solving too fast - increase difficulty
            new_difficulty = min(self.base_difficulty + 2, self.max_difficulty)
            if new_difficulty > self.base_difficulty:
                logger.info(
                    f"📈 PoW difficulty increased to {new_difficulty} "
                    f"(avg solve time: {avg_time:.2f}s)"
                )
            return new_difficulty
            
        elif avg_time < self.target_solve_time:
            # Slightly fast - increase difficulty by 1
            new_difficulty = min(self.base_difficulty + 1, self.max_difficulty)
            return new_difficulty
            
        elif avg_time > self.target_solve_time * 2:
            # Solving too slow - decrease difficulty
            new_difficulty = max(self.base_difficulty - 2, self.min_difficulty)
            if new_difficulty < self.base_difficulty:
                logger.info(
                    f"📉 PoW difficulty decreased to {new_difficulty} "
                    f"(avg solve time: {avg_time:.2f}s)"
                )
            return new_difficulty
            
        elif avg_time > self.target_solve_time:
            # Slightly slow - decrease difficulty by 1
            new_difficulty = max(self.base_difficulty - 1, self.min_difficulty)
            return new_difficulty
        
        else:
            # Just right
            return self.base_difficulty
    
    def get_statistics(self) -> Dict[str, any]:
        """
        Get PoW statistics.
        
        Returns:
            Dict with statistics
        """
        current_time = int(time.time())
        
        # Calculate average solve time
        if self._recent_verifications:
            recent = self._recent_verifications[-20:]  # Last 20
            avg_solve_time = sum(duration for _, duration in recent) / len(recent)
        else:
            avg_solve_time = 0.0
        
        # Count active challenges
        active_count = len(self._active_challenges)
        
        # Success rate
        total_attempts = self._total_solved + self._total_failed
        success_rate = (self._total_solved / total_attempts * 100) if total_attempts > 0 else 0
        
        return {
            "total_issued": self._total_issued,
            "total_solved": self._total_solved,
            "total_failed": self._total_failed,
            "success_rate": round(success_rate, 2),
            "active_challenges": active_count,
            "avg_solve_time": round(avg_solve_time, 2),
            "current_difficulty": self._get_adaptive_difficulty()
        }
    
    def cleanup_expired(self, max_age: int = 300):
        """
        Remove expired challenges.
        
        Args:
            max_age: Maximum challenge age in seconds
        """
        current_time = int(time.time())
        
        expired = [
            challenge for challenge, (timestamp, _) in self._active_challenges.items()
            if current_time - timestamp > max_age
        ]
        
        for challenge in expired:
            del self._active_challenges[challenge]
        
        if expired:
            logger.info(f"🧹 Cleaned up {len(expired)} expired PoW challenges")


# Singleton
_pow_instance: Optional[ProofOfWork] = None


def get_proof_of_work(
    base_difficulty: int = 4,
    max_difficulty: int = 12
) -> ProofOfWork:
    """
    Get PoW singleton.
    
    Args:
        base_difficulty: Base difficulty (4 = ~16 attempts)
        max_difficulty: Maximum difficulty (12 = ~4096 attempts)
        
    Returns:
        ProofOfWork instance
    """
    global _pow_instance
    
    if _pow_instance is None:
        _pow_instance = ProofOfWork(
            base_difficulty=base_difficulty,
            max_difficulty=max_difficulty
        )
    
    return _pow_instance


def reset_proof_of_work():
    """Reset PoW singleton (useful for testing)."""
    global _pow_instance
    _pow_instance = None


__all__ = [
    'ProofOfWork',
    'get_proof_of_work',
    'reset_proof_of_work'
]
