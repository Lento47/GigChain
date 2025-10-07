"""
Gamification & Reputation System for GigChain.io
Handles badges, experience points, trust scores, and user progression
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from enum import Enum
import json


class UserRole(Enum):
    """User role in the platform"""
    FREELANCER = "freelancer"
    CLIENT = "client"
    BOTH = "both"


class BadgeType(Enum):
    """Types of badges users can earn"""
    # Contract Completion Badges
    FIRST_CONTRACT = "first_contract"
    TEN_CONTRACTS = "ten_contracts"
    FIFTY_CONTRACTS = "fifty_contracts"
    HUNDRED_CONTRACTS = "hundred_contracts"
    
    # Value Milestones
    NOVICE = "novice"  # $0-$500
    INTERMEDIATE = "intermediate"  # $500-$2500
    ADVANCED = "advanced"  # $2500-$10000
    EXPERT = "expert"  # $10000-$50000
    MASTER = "master"  # $50000+
    
    # Trust & Reliability
    RELIABLE = "reliable"  # 95%+ completion rate
    TRUSTED = "trusted"  # 98%+ completion rate, 20+ contracts
    LEGENDARY = "legendary"  # 99%+ completion rate, 100+ contracts
    
    # Speed
    FAST_DELIVERY = "fast_delivery"  # 5+ early deliveries
    LIGHTNING_FAST = "lightning_fast"  # 20+ early deliveries
    
    # Quality
    HIGH_QUALITY = "high_quality"  # 4.5+ avg rating
    PERFECT_QUALITY = "perfect_quality"  # 5.0 avg rating, 10+ reviews
    
    # Negotiation
    NEGOTIATOR = "negotiator"  # 10+ successful negotiations
    MASTER_NEGOTIATOR = "master_negotiator"  # 50+ successful negotiations


@dataclass
class Badge:
    """Badge earned by user"""
    badge_type: BadgeType
    name: str
    description: str
    icon: str
    earned_at: datetime
    metadata: Dict[str, Any]


@dataclass
class UserStats:
    """User statistics for gamification"""
    user_id: str
    role: UserRole
    
    # Experience & Level
    total_xp: int
    level: int
    xp_to_next_level: int
    
    # Contract Stats
    total_contracts: int
    completed_contracts: int
    cancelled_contracts: int
    disputed_contracts: int
    
    # Financial Stats
    total_earned: float  # For freelancers
    total_spent: float  # For clients
    average_contract_value: float
    
    # Trust Metrics
    trust_score: float  # 0-100
    completion_rate: float  # 0-100
    on_time_delivery_rate: float  # 0-100
    average_rating: float  # 0-5
    total_reviews: int
    
    # Badges
    badges: List[Badge]
    badge_count: int
    
    # Behavior Metrics
    response_time_hours: float
    dispute_rate: float  # 0-100
    payment_reliability: float  # 0-100 (for clients)
    
    # Visibility Boost
    visibility_multiplier: float  # 1.0 = normal, 2.0 = 2x visibility
    is_boosted: bool
    boost_reason: Optional[str]
    
    # Bans & Warnings
    is_banned: bool
    ban_reason: Optional[str]
    warnings: int
    
    # Last Activity
    last_contract_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class ExperienceCalculator:
    """Calculate XP and levels"""
    
    # XP rewards
    XP_CONTRACT_ACCEPTED = 50
    XP_CONTRACT_COMPLETED = 200
    XP_ON_TIME_BONUS = 50
    XP_EARLY_DELIVERY_BONUS = 100
    XP_PERFECT_RATING = 100
    XP_NEGOTIATION_SUCCESS = 75
    XP_FIRST_CONTRACT = 150
    
    # XP penalties
    XP_PENALTY_LATE = -50
    XP_PENALTY_DISPUTE = -100
    XP_PENALTY_CANCELLATION = -75
    
    # Level thresholds (exponential growth)
    LEVEL_BASE_XP = 1000
    LEVEL_MULTIPLIER = 1.5
    
    @staticmethod
    def calculate_level(total_xp: int) -> int:
        """Calculate user level based on total XP"""
        level = 1
        xp_required = ExperienceCalculator.LEVEL_BASE_XP
        
        while total_xp >= xp_required:
            level += 1
            xp_required = int(ExperienceCalculator.LEVEL_BASE_XP * (ExperienceCalculator.LEVEL_MULTIPLIER ** (level - 1)))
        
        return level
    
    @staticmethod
    def xp_for_next_level(current_level: int, current_xp: int) -> int:
        """Calculate XP needed for next level"""
        next_level_xp = int(ExperienceCalculator.LEVEL_BASE_XP * (ExperienceCalculator.LEVEL_MULTIPLIER ** current_level))
        current_level_xp = int(ExperienceCalculator.LEVEL_BASE_XP * (ExperienceCalculator.LEVEL_MULTIPLIER ** (current_level - 1)))
        
        return next_level_xp - current_xp
    
    @staticmethod
    def award_xp(user_stats: UserStats, xp_amount: int, reason: str) -> UserStats:
        """Award XP to user and recalculate level"""
        user_stats.total_xp += xp_amount
        user_stats.level = ExperienceCalculator.calculate_level(user_stats.total_xp)
        user_stats.xp_to_next_level = ExperienceCalculator.xp_for_next_level(
            user_stats.level, 
            user_stats.total_xp
        )
        user_stats.updated_at = datetime.now()
        
        return user_stats


class TrustScoreCalculator:
    """Calculate trust scores and reputation"""
    
    @staticmethod
    def calculate_trust_score(user_stats: UserStats) -> float:
        """
        Calculate comprehensive trust score (0-100)
        
        Factors:
        - Completion rate (40%)
        - Average rating (25%)
        - On-time delivery (20%)
        - Dispute rate (10%)
        - Payment reliability (5% for clients)
        """
        if user_stats.total_contracts == 0:
            return 50.0  # Neutral score for new users
        
        # Completion rate weight
        completion_weight = 0.40
        completion_score = user_stats.completion_rate * completion_weight
        
        # Rating weight
        rating_weight = 0.25
        rating_score = (user_stats.average_rating / 5.0) * 100 * rating_weight
        
        # On-time delivery weight
        delivery_weight = 0.20
        delivery_score = user_stats.on_time_delivery_rate * delivery_weight
        
        # Dispute rate weight (inverted - lower is better)
        dispute_weight = 0.10
        dispute_score = (100 - user_stats.dispute_rate) * dispute_weight
        
        # Payment reliability weight (for clients)
        payment_weight = 0.05
        payment_score = user_stats.payment_reliability * payment_weight
        
        trust_score = completion_score + rating_score + delivery_score + dispute_score + payment_score
        
        return min(100.0, max(0.0, trust_score))
    
    @staticmethod
    def calculate_visibility_multiplier(user_stats: UserStats) -> float:
        """
        Calculate visibility multiplier based on trust and activity
        
        Range: 0.5x (banned/unreliable) to 3.0x (legendary users)
        """
        if user_stats.is_banned:
            return 0.0
        
        trust_score = user_stats.trust_score
        level = user_stats.level
        completion_rate = user_stats.completion_rate
        
        # Base multiplier
        multiplier = 1.0
        
        # Trust bonus (+0.5x for every 25 points above 50)
        if trust_score >= 50:
            multiplier += (trust_score - 50) / 50  # +0 to +1.0
        else:
            multiplier -= (50 - trust_score) / 100  # -0 to -0.5
        
        # Level bonus (+0.1x per 5 levels)
        multiplier += (level / 5) * 0.1
        
        # Completion rate bonus
        if completion_rate >= 98:
            multiplier += 0.5
        elif completion_rate >= 95:
            multiplier += 0.3
        
        # High activity bonus
        if user_stats.last_contract_date:
            days_since_last = (datetime.now() - user_stats.last_contract_date).days
            if days_since_last <= 7:
                multiplier += 0.2
        
        # Cap multiplier
        return min(3.0, max(0.5, multiplier))


class BadgeManager:
    """Manage badge awards and progression"""
    
    BADGE_DEFINITIONS = {
        BadgeType.FIRST_CONTRACT: {
            "name": "First Steps",
            "description": "Completed your first contract",
            "icon": "🎯",
            "xp_reward": 100
        },
        BadgeType.TEN_CONTRACTS: {
            "name": "Rising Star",
            "description": "Completed 10 contracts",
            "icon": "⭐",
            "xp_reward": 500
        },
        BadgeType.FIFTY_CONTRACTS: {
            "name": "Veteran",
            "description": "Completed 50 contracts",
            "icon": "🏆",
            "xp_reward": 2000
        },
        BadgeType.HUNDRED_CONTRACTS: {
            "name": "Century Club",
            "description": "Completed 100 contracts",
            "icon": "👑",
            "xp_reward": 5000
        },
        BadgeType.RELIABLE: {
            "name": "Reliable Professional",
            "description": "Maintained 95%+ completion rate",
            "icon": "✅",
            "xp_reward": 1000
        },
        BadgeType.TRUSTED: {
            "name": "Trusted Partner",
            "description": "98%+ completion rate with 20+ contracts",
            "icon": "🛡️",
            "xp_reward": 2500
        },
        BadgeType.LEGENDARY: {
            "name": "Legendary",
            "description": "99%+ completion rate with 100+ contracts",
            "icon": "💎",
            "xp_reward": 10000
        },
        BadgeType.NEGOTIATOR: {
            "name": "Skilled Negotiator",
            "description": "Successfully negotiated 10+ contracts",
            "icon": "🤝",
            "xp_reward": 750
        },
        BadgeType.MASTER_NEGOTIATOR: {
            "name": "Master Negotiator",
            "description": "Successfully negotiated 50+ contracts",
            "icon": "💼",
            "xp_reward": 3000
        },
        BadgeType.HIGH_QUALITY: {
            "name": "Quality Pro",
            "description": "Maintained 4.5+ average rating",
            "icon": "⚡",
            "xp_reward": 1500
        },
        BadgeType.PERFECT_QUALITY: {
            "name": "Perfectionist",
            "description": "Perfect 5.0 rating with 10+ reviews",
            "icon": "✨",
            "xp_reward": 5000
        }
    }
    
    @staticmethod
    def check_and_award_badges(user_stats: UserStats) -> List[Badge]:
        """Check if user qualifies for new badges"""
        new_badges = []
        existing_badge_types = [b.badge_type for b in user_stats.badges]
        
        # Check contract milestones
        if user_stats.completed_contracts >= 1 and BadgeType.FIRST_CONTRACT not in existing_badge_types:
            new_badges.append(BadgeManager._create_badge(BadgeType.FIRST_CONTRACT))
        
        if user_stats.completed_contracts >= 10 and BadgeType.TEN_CONTRACTS not in existing_badge_types:
            new_badges.append(BadgeManager._create_badge(BadgeType.TEN_CONTRACTS))
        
        if user_stats.completed_contracts >= 50 and BadgeType.FIFTY_CONTRACTS not in existing_badge_types:
            new_badges.append(BadgeManager._create_badge(BadgeType.FIFTY_CONTRACTS))
        
        if user_stats.completed_contracts >= 100 and BadgeType.HUNDRED_CONTRACTS not in existing_badge_types:
            new_badges.append(BadgeManager._create_badge(BadgeType.HUNDRED_CONTRACTS))
        
        # Check trust badges
        if user_stats.completion_rate >= 95 and BadgeType.RELIABLE not in existing_badge_types:
            new_badges.append(BadgeManager._create_badge(BadgeType.RELIABLE))
        
        if (user_stats.completion_rate >= 98 and user_stats.completed_contracts >= 20 
            and BadgeType.TRUSTED not in existing_badge_types):
            new_badges.append(BadgeManager._create_badge(BadgeType.TRUSTED))
        
        if (user_stats.completion_rate >= 99 and user_stats.completed_contracts >= 100 
            and BadgeType.LEGENDARY not in existing_badge_types):
            new_badges.append(BadgeManager._create_badge(BadgeType.LEGENDARY))
        
        # Check quality badges
        if user_stats.average_rating >= 4.5 and BadgeType.HIGH_QUALITY not in existing_badge_types:
            new_badges.append(BadgeManager._create_badge(BadgeType.HIGH_QUALITY))
        
        if (user_stats.average_rating >= 5.0 and user_stats.total_reviews >= 10 
            and BadgeType.PERFECT_QUALITY not in existing_badge_types):
            new_badges.append(BadgeManager._create_badge(BadgeType.PERFECT_QUALITY))
        
        return new_badges
    
    @staticmethod
    def _create_badge(badge_type: BadgeType) -> Badge:
        """Create a badge instance"""
        definition = BadgeManager.BADGE_DEFINITIONS[badge_type]
        return Badge(
            badge_type=badge_type,
            name=definition["name"],
            description=definition["description"],
            icon=definition["icon"],
            earned_at=datetime.now(),
            metadata={"xp_reward": definition["xp_reward"]}
        )


class ContractMatchingEngine:
    """Smart contract matching based on user level and trust"""
    
    @staticmethod
    def get_suitable_contract_range(user_level: int, trust_score: float) -> Dict[str, float]:
        """
        Calculate suitable contract value range for user
        
        Returns: {"min": float, "max": float, "recommended": float}
        """
        # Base ranges by level
        level_ranges = {
            1: (50, 200),
            2: (100, 400),
            3: (200, 600),
            4: (300, 1000),
            5: (500, 1500),
            10: (1000, 5000),
            15: (2500, 10000),
            20: (5000, 20000),
            25: (10000, 50000),
            30: (25000, 100000)
        }
        
        # Find closest level range
        closest_level = min(level_ranges.keys(), key=lambda x: abs(x - user_level))
        base_min, base_max = level_ranges[closest_level]
        
        # Adjust by trust score
        trust_multiplier = 0.5 + (trust_score / 100)  # 0.5x to 1.5x
        
        adjusted_min = base_min * trust_multiplier
        adjusted_max = base_max * trust_multiplier
        recommended = (adjusted_min + adjusted_max) / 2
        
        return {
            "min": round(adjusted_min, 2),
            "max": round(adjusted_max, 2),
            "recommended": round(recommended, 2)
        }
    
    @staticmethod
    def calculate_match_score(freelancer_stats: UserStats, contract_value: float) -> float:
        """
        Calculate match score (0-100) between freelancer and contract
        
        Considers:
        - Level appropriateness
        - Trust score
        - Experience with similar contracts
        """
        suitable_range = ContractMatchingEngine.get_suitable_contract_range(
            freelancer_stats.level,
            freelancer_stats.trust_score
        )
        
        # Check if contract is in suitable range
        if contract_value < suitable_range["min"]:
            range_score = 50 + (contract_value / suitable_range["min"]) * 30  # 50-80 for below range
        elif contract_value > suitable_range["max"]:
            over_factor = contract_value / suitable_range["max"]
            range_score = max(20, 80 - (over_factor - 1) * 40)  # Decreases for too high
        else:
            # Perfect range
            range_score = 100
        
        # Trust score contribution
        trust_contribution = freelancer_stats.trust_score * 0.3
        
        # Level contribution
        level_contribution = min(freelancer_stats.level * 2, 30)
        
        # Experience contribution
        experience_contribution = min(freelancer_stats.completed_contracts * 0.5, 20)
        
        total_score = (range_score * 0.5) + trust_contribution + level_contribution + experience_contribution
        
        return min(100.0, max(0.0, total_score))


class BanSystem:
    """Handle user bans and warnings"""
    
    @staticmethod
    def check_ban_conditions(user_stats: UserStats, contract_data: Dict[str, Any]) -> Optional[str]:
        """
        Check if user should be banned
        
        Returns ban reason if should be banned, None otherwise
        """
        # Client didn't pay
        if contract_data.get("payment_failed") and contract_data.get("role") == "client":
            return "Non-payment: Failed to pay for completed contract"
        
        # Excessive disputes
        if user_stats.dispute_rate > 50 and user_stats.total_contracts >= 5:
            return "Excessive disputes: More than 50% of contracts disputed"
        
        # Very low completion rate
        if user_stats.completion_rate < 30 and user_stats.total_contracts >= 10:
            return "Poor reliability: Less than 30% completion rate"
        
        # Multiple warnings
        if user_stats.warnings >= 3:
            return "Multiple warnings: Received 3+ warnings for policy violations"
        
        return None
    
    @staticmethod
    def apply_ban(user_stats: UserStats, reason: str) -> UserStats:
        """Apply ban to user"""
        user_stats.is_banned = True
        user_stats.ban_reason = reason
        user_stats.visibility_multiplier = 0.0
        user_stats.updated_at = datetime.now()
        
        return user_stats
    
    @staticmethod
    def add_warning(user_stats: UserStats, warning_reason: str) -> UserStats:
        """Add warning to user"""
        user_stats.warnings += 1
        user_stats.updated_at = datetime.now()
        
        # Check if warnings trigger ban
        if user_stats.warnings >= 3:
            return BanSystem.apply_ban(user_stats, "Exceeded maximum warnings")
        
        return user_stats


def get_initial_user_stats(user_id: str, role: UserRole) -> UserStats:
    """Create initial user stats for new user"""
    return UserStats(
        user_id=user_id,
        role=role,
        total_xp=0,
        level=1,
        xp_to_next_level=ExperienceCalculator.LEVEL_BASE_XP,
        total_contracts=0,
        completed_contracts=0,
        cancelled_contracts=0,
        disputed_contracts=0,
        total_earned=0.0,
        total_spent=0.0,
        average_contract_value=0.0,
        trust_score=50.0,  # Start at neutral
        completion_rate=0.0,
        on_time_delivery_rate=0.0,
        average_rating=0.0,
        total_reviews=0,
        badges=[],
        badge_count=0,
        response_time_hours=0.0,
        dispute_rate=0.0,
        payment_reliability=100.0,
        visibility_multiplier=1.0,
        is_boosted=False,
        boost_reason=None,
        is_banned=False,
        ban_reason=None,
        warnings=0,
        last_contract_date=None,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
