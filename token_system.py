"""
GigSoul Token System (GSL)
In-game token system for GigChain.io platform

Features:
- Token wallets for each user
- Trading (buy/sell)
- Transfer between users
- Reward calculation for completed contracts
- Transaction history tracking
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum
import math
import json


class TransactionType(Enum):
    """Types of token transactions"""
    REWARD = "reward"  # Earned from contract completion
    TRANSFER = "transfer"  # Sent to another user
    RECEIVE = "receive"  # Received from another user
    BUY = "buy"  # Purchased tokens
    SELL = "sell"  # Sold tokens
    BONUS = "bonus"  # Platform bonus
    PENALTY = "penalty"  # Deduction for violations


class TaskComplexity(Enum):
    """Task complexity levels for reward calculation"""
    VERY_SIMPLE = "very_simple"  # Level 1-2
    SIMPLE = "simple"  # Level 3-5
    MODERATE = "moderate"  # Level 6-10
    COMPLEX = "complex"  # Level 11-20
    EXPERT = "expert"  # Level 21+


@dataclass
class TokenWallet:
    """User's GigSoul token wallet"""
    user_id: str
    wallet_address: str
    balance: float = 0.0
    total_earned: float = 0.0
    total_spent: float = 0.0
    total_transferred_out: float = 0.0
    total_transferred_in: float = 0.0
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    
    def add_tokens(self, amount: float, reason: str = ""):
        """Add tokens to wallet"""
        if amount <= 0:
            raise ValueError("Amount must be positive")
        self.balance += amount
        self.updated_at = datetime.now()
    
    def deduct_tokens(self, amount: float, reason: str = ""):
        """Deduct tokens from wallet"""
        if amount <= 0:
            raise ValueError("Amount must be positive")
        if self.balance < amount:
            raise ValueError(f"Insufficient balance. Required: {amount}, Available: {self.balance}")
        self.balance -= amount
        self.updated_at = datetime.now()
    
    def can_afford(self, amount: float) -> bool:
        """Check if wallet has sufficient balance"""
        return self.balance >= amount


@dataclass
class TokenTransaction:
    """Record of a token transaction"""
    transaction_id: str
    user_id: str
    transaction_type: TransactionType
    amount: float
    balance_before: float
    balance_after: float
    description: str
    related_contract_id: Optional[str] = None
    related_user_id: Optional[str] = None  # For transfers
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            "transaction_id": self.transaction_id,
            "user_id": self.user_id,
            "transaction_type": self.transaction_type.value,
            "amount": self.amount,
            "balance_before": self.balance_before,
            "balance_after": self.balance_after,
            "description": self.description,
            "related_contract_id": self.related_contract_id,
            "related_user_id": self.related_user_id,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat()
        }


class TokenRewardCalculator:
    """
    Calculate GSL token rewards for completed contracts
    
    Algorithm considers:
    - Contract value (monetary amount)
    - Task complexity (based on user level and contract description)
    - Delivery performance (on-time, early, late)
    - Quality rating (1-5 stars)
    - User level and trust score
    """
    
    # Base reward rates (GSL per dollar)
    BASE_RATE_PER_DOLLAR = 10.0  # 10 GSL per $1 USD
    
    # Complexity multipliers
    COMPLEXITY_MULTIPLIERS = {
        TaskComplexity.VERY_SIMPLE: 0.5,   # $1-50 contracts
        TaskComplexity.SIMPLE: 1.0,        # $51-200 contracts
        TaskComplexity.MODERATE: 1.5,      # $201-1000 contracts
        TaskComplexity.COMPLEX: 2.0,       # $1001-5000 contracts
        TaskComplexity.EXPERT: 3.0         # $5000+ contracts
    }
    
    # Rating multipliers
    RATING_MULTIPLIERS = {
        5: 1.5,  # Perfect rating: +50% bonus
        4: 1.2,  # Good rating: +20% bonus
        3: 1.0,  # Average rating: no bonus
        2: 0.7,  # Below average: -30%
        1: 0.5   # Poor rating: -50%
    }
    
    # Delivery bonus/penalty
    ON_TIME_BONUS = 1.2    # +20% for on-time delivery
    EARLY_BONUS_PER_DAY = 0.05  # +5% per day early (max 50%)
    LATE_PENALTY_PER_DAY = 0.1  # -10% per day late (max -50%)
    MAX_EARLY_BONUS = 0.5
    MAX_LATE_PENALTY = 0.5
    
    # Level bonus (encourages high-level users)
    LEVEL_BONUS_PER_10_LEVELS = 0.1  # +10% per 10 levels
    MAX_LEVEL_BONUS = 1.0  # Max +100% at level 100
    
    # Trust score bonus
    TRUST_BONUS_THRESHOLD = 80.0  # Bonus starts at 80+ trust
    TRUST_BONUS_MAX = 0.3  # Max +30% bonus at 100 trust
    
    @classmethod
    def determine_complexity(cls, contract_value: float, user_level: int = 1) -> TaskComplexity:
        """
        Determine task complexity based on contract value and user level
        
        Args:
            contract_value: Contract value in USD
            user_level: User's current level (influences complexity tier)
        
        Returns:
            TaskComplexity enum value
        """
        # Adjust thresholds based on user level
        # Higher level users get higher complexity for same value
        level_factor = 1.0 - (user_level * 0.01)  # -1% per level, min 0.5
        level_factor = max(0.5, level_factor)
        
        adjusted_value = contract_value * level_factor
        
        if adjusted_value < 50:
            return TaskComplexity.VERY_SIMPLE
        elif adjusted_value < 200:
            return TaskComplexity.SIMPLE
        elif adjusted_value < 1000:
            return TaskComplexity.MODERATE
        elif adjusted_value < 5000:
            return TaskComplexity.COMPLEX
        else:
            return TaskComplexity.EXPERT
    
    @classmethod
    def calculate_reward(
        cls,
        contract_value: float,
        user_level: int,
        trust_score: float,
        rating: int,
        was_on_time: bool,
        days_early_or_late: int = 0,
        complexity_override: Optional[TaskComplexity] = None
    ) -> Dict[str, Any]:
        """
        Calculate GSL token reward for a completed contract
        
        Args:
            contract_value: Contract value in USD
            user_level: User's current level
            trust_score: User's trust score (0-100)
            rating: Contract rating (1-5 stars)
            was_on_time: Whether delivered on time
            days_early_or_late: Positive for late, negative for early
            complexity_override: Optional manual complexity override
        
        Returns:
            Dictionary with reward breakdown and final amount
        """
        # Validate inputs
        if contract_value <= 0:
            raise ValueError("Contract value must be positive")
        if rating not in range(1, 6):
            raise ValueError("Rating must be between 1 and 5")
        if trust_score < 0 or trust_score > 100:
            raise ValueError("Trust score must be between 0 and 100")
        
        # Calculate base reward
        base_reward = contract_value * cls.BASE_RATE_PER_DOLLAR
        
        # Determine complexity
        complexity = complexity_override or cls.determine_complexity(contract_value, user_level)
        complexity_multiplier = cls.COMPLEXITY_MULTIPLIERS[complexity]
        
        # Calculate rating multiplier
        rating_multiplier = cls.RATING_MULTIPLIERS.get(rating, 1.0)
        
        # Calculate delivery multiplier
        delivery_multiplier = 1.0
        if was_on_time:
            delivery_multiplier = cls.ON_TIME_BONUS
        elif days_early_or_late < 0:  # Early
            days_early = abs(days_early_or_late)
            early_bonus = min(days_early * cls.EARLY_BONUS_PER_DAY, cls.MAX_EARLY_BONUS)
            delivery_multiplier = 1.0 + early_bonus
        else:  # Late
            late_penalty = min(days_early_or_late * cls.LATE_PENALTY_PER_DAY, cls.MAX_LATE_PENALTY)
            delivery_multiplier = max(1.0 - late_penalty, 0.5)  # Min 50%
        
        # Calculate level bonus
        level_bonus = min(
            (user_level // 10) * cls.LEVEL_BONUS_PER_10_LEVELS,
            cls.MAX_LEVEL_BONUS
        )
        level_multiplier = 1.0 + level_bonus
        
        # Calculate trust score bonus
        trust_bonus = 0.0
        if trust_score >= cls.TRUST_BONUS_THRESHOLD:
            trust_bonus = ((trust_score - cls.TRUST_BONUS_THRESHOLD) / 20) * cls.TRUST_BONUS_MAX
            trust_bonus = min(trust_bonus, cls.TRUST_BONUS_MAX)
        trust_multiplier = 1.0 + trust_bonus
        
        # Calculate final reward
        reward = (
            base_reward 
            * complexity_multiplier 
            * rating_multiplier 
            * delivery_multiplier 
            * level_multiplier 
            * trust_multiplier
        )
        
        # Round to 2 decimal places
        reward = round(reward, 2)
        
        # Build breakdown
        breakdown = {
            "base_reward": round(base_reward, 2),
            "complexity": {
                "level": complexity.value,
                "multiplier": complexity_multiplier
            },
            "rating": {
                "stars": rating,
                "multiplier": rating_multiplier
            },
            "delivery": {
                "on_time": was_on_time,
                "days_delta": days_early_or_late,
                "multiplier": round(delivery_multiplier, 2)
            },
            "level_bonus": {
                "level": user_level,
                "bonus_percent": round(level_bonus * 100, 1),
                "multiplier": round(level_multiplier, 2)
            },
            "trust_bonus": {
                "trust_score": trust_score,
                "bonus_percent": round(trust_bonus * 100, 1),
                "multiplier": round(trust_multiplier, 2)
            },
            "final_reward": reward,
            "contract_value_usd": contract_value
        }
        
        return breakdown
    
    @classmethod
    def estimate_reward_range(cls, contract_value: float, user_level: int) -> Dict[str, float]:
        """
        Estimate reward range for a contract
        
        Args:
            contract_value: Contract value in USD
            user_level: User's current level
        
        Returns:
            Dictionary with min, max, and average reward estimates
        """
        # Calculate minimum (worst case: late, poor rating, low trust)
        min_reward = cls.calculate_reward(
            contract_value=contract_value,
            user_level=user_level,
            trust_score=50.0,
            rating=1,
            was_on_time=False,
            days_early_or_late=5  # 5 days late
        )["final_reward"]
        
        # Calculate maximum (best case: early, perfect rating, high trust)
        max_reward = cls.calculate_reward(
            contract_value=contract_value,
            user_level=user_level,
            trust_score=100.0,
            rating=5,
            was_on_time=False,
            days_early_or_late=-10  # 10 days early
        )["final_reward"]
        
        # Calculate average (on-time, good rating, decent trust)
        avg_reward = cls.calculate_reward(
            contract_value=contract_value,
            user_level=user_level,
            trust_score=75.0,
            rating=4,
            was_on_time=True,
            days_early_or_late=0
        )["final_reward"]
        
        return {
            "min_reward": min_reward,
            "avg_reward": avg_reward,
            "max_reward": max_reward,
            "contract_value_usd": contract_value
        }


class TokenTransferService:
    """Service for handling token transfers between users"""
    
    # Transfer fee (percentage)
    TRANSFER_FEE_PERCENT = 2.0  # 2% fee on transfers
    MIN_TRANSFER_AMOUNT = 10.0  # Minimum 10 GSL per transfer
    
    @classmethod
    def calculate_transfer_fee(cls, amount: float) -> float:
        """Calculate transfer fee"""
        fee = amount * (cls.TRANSFER_FEE_PERCENT / 100)
        return round(fee, 2)
    
    @classmethod
    def validate_transfer(
        cls,
        from_wallet: TokenWallet,
        to_wallet: TokenWallet,
        amount: float
    ) -> Dict[str, Any]:
        """
        Validate a transfer before execution
        
        Returns:
            Dictionary with validation result and details
        """
        errors = []
        
        # Check minimum amount
        if amount < cls.MIN_TRANSFER_AMOUNT:
            errors.append(f"Transfer amount must be at least {cls.MIN_TRANSFER_AMOUNT} GSL")
        
        # Check sender balance
        fee = cls.calculate_transfer_fee(amount)
        total_required = amount + fee
        
        if not from_wallet.can_afford(total_required):
            errors.append(
                f"Insufficient balance. Required: {total_required} GSL "
                f"(amount: {amount} + fee: {fee}), Available: {from_wallet.balance} GSL"
            )
        
        # Check for self-transfer
        if from_wallet.user_id == to_wallet.user_id:
            errors.append("Cannot transfer to yourself")
        
        is_valid = len(errors) == 0
        
        return {
            "valid": is_valid,
            "amount": amount,
            "fee": fee,
            "total_cost": total_required,
            "sender_balance": from_wallet.balance,
            "errors": errors
        }


class TokenMarketplace:
    """Token buy/sell marketplace (closed system)"""
    
    # Fixed exchange rates (for demo purposes)
    # In production, this could be dynamic based on supply/demand
    GSL_TO_USD_RATE = 0.05  # 1 GSL = $0.05 USD
    USD_TO_GSL_RATE = 20.0  # $1 USD = 20 GSL
    
    # Transaction fees
    BUY_FEE_PERCENT = 3.0   # 3% fee on purchases
    SELL_FEE_PERCENT = 5.0  # 5% fee on sales
    
    # Limits
    MIN_BUY_USD = 5.0       # Minimum $5 purchase
    MIN_SELL_GSL = 100.0    # Minimum 100 GSL sale
    MAX_BUY_USD = 10000.0   # Maximum $10,000 purchase
    MAX_SELL_GSL = 100000.0 # Maximum 100,000 GSL sale
    
    @classmethod
    def calculate_buy_amount(cls, usd_amount: float) -> Dict[str, float]:
        """
        Calculate GSL received for USD purchase
        
        Args:
            usd_amount: Amount in USD to spend
        
        Returns:
            Dictionary with purchase details
        """
        if usd_amount < cls.MIN_BUY_USD:
            raise ValueError(f"Minimum purchase is ${cls.MIN_BUY_USD} USD")
        if usd_amount > cls.MAX_BUY_USD:
            raise ValueError(f"Maximum purchase is ${cls.MAX_BUY_USD} USD")
        
        # Calculate fee
        fee_usd = usd_amount * (cls.BUY_FEE_PERCENT / 100)
        net_usd = usd_amount - fee_usd
        
        # Calculate GSL received
        gsl_received = net_usd * cls.USD_TO_GSL_RATE
        
        return {
            "usd_amount": round(usd_amount, 2),
            "fee_usd": round(fee_usd, 2),
            "net_usd": round(net_usd, 2),
            "gsl_received": round(gsl_received, 2),
            "effective_rate": round(gsl_received / usd_amount, 2)
        }
    
    @classmethod
    def calculate_sell_amount(cls, gsl_amount: float) -> Dict[str, float]:
        """
        Calculate USD received for GSL sale
        
        Args:
            gsl_amount: Amount in GSL to sell
        
        Returns:
            Dictionary with sale details
        """
        if gsl_amount < cls.MIN_SELL_GSL:
            raise ValueError(f"Minimum sale is {cls.MIN_SELL_GSL} GSL")
        if gsl_amount > cls.MAX_SELL_GSL:
            raise ValueError(f"Maximum sale is {cls.MAX_SELL_GSL} GSL")
        
        # Calculate gross USD
        gross_usd = gsl_amount * cls.GSL_TO_USD_RATE
        
        # Calculate fee
        fee_usd = gross_usd * (cls.SELL_FEE_PERCENT / 100)
        net_usd = gross_usd - fee_usd
        
        return {
            "gsl_amount": round(gsl_amount, 2),
            "gross_usd": round(gross_usd, 2),
            "fee_usd": round(fee_usd, 2),
            "net_usd": round(net_usd, 2),
            "effective_rate": round(net_usd / gsl_amount, 4)
        }


# Utility functions
def format_gsl_amount(amount: float) -> str:
    """Format GSL amount for display"""
    return f"{amount:,.2f} GSL"


def format_transaction_summary(transaction: TokenTransaction) -> str:
    """Format transaction for display"""
    type_emoji = {
        TransactionType.REWARD: "🎁",
        TransactionType.TRANSFER: "📤",
        TransactionType.RECEIVE: "📥",
        TransactionType.BUY: "🛒",
        TransactionType.SELL: "💰",
        TransactionType.BONUS: "⭐",
        TransactionType.PENALTY: "⚠️"
    }
    
    emoji = type_emoji.get(transaction.transaction_type, "💎")
    sign = "+" if transaction.amount > 0 else ""
    
    return (
        f"{emoji} {transaction.transaction_type.value.upper()}: "
        f"{sign}{format_gsl_amount(transaction.amount)} - "
        f"{transaction.description}"
    )
