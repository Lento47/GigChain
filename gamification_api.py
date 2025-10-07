"""
API Endpoints for Gamification & Negotiation System
FastAPI routes for badges, XP, trust scores, and AI negotiation assistant
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime
import sqlite3
import json

from gamification import (
    UserStats, UserRole, BadgeType, ExperienceCalculator,
    TrustScoreCalculator, BadgeManager, ContractMatchingEngine,
    BanSystem, get_initial_user_stats
)
from negotiation_assistant import negotiation_assistant, NegotiationInsight


# Router for gamification endpoints
router = APIRouter(prefix="/api/gamification", tags=["gamification"])

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class ContractOfferRequest(BaseModel):
    """Request to analyze a contract offer"""
    contract_text: str = Field(..., min_length=10, max_length=5000)
    offered_amount: float = Field(..., gt=0)
    user_id: str
    contract_id: Optional[str] = None
    market_rate: Optional[float] = None


class NegotiateOrAcceptRequest(BaseModel):
    """User decision: negotiate or accept"""
    contract_id: str
    user_id: str
    decision: str = Field(..., pattern="^(accept|negotiate)$")


class HighlightAnalysisRequest(BaseModel):
    """Analyze highlighted text from contract"""
    highlighted_text: str = Field(..., min_length=1, max_length=500)
    full_context: str = Field(..., max_length=5000)
    user_id: str
    contract_id: str


class CounterOfferRequest(BaseModel):
    """Generate counter-offer suggestion"""
    contract_id: str
    user_id: str
    original_offer: float
    project_complexity: str = Field(..., pattern="^(low|medium|high|expert)$")
    estimated_hours: Optional[int] = None


class ContractCompletionRequest(BaseModel):
    """Mark contract as completed and award XP/badges"""
    contract_id: str
    user_id: str
    role: str = Field(..., pattern="^(freelancer|client)$")
    rating: int = Field(..., ge=1, le=5)
    review: Optional[str] = None
    was_on_time: bool = True
    days_early_or_late: int = 0


class UserStatsResponse(BaseModel):
    """User statistics response"""
    user_id: str
    level: int
    total_xp: int
    xp_to_next_level: int
    trust_score: float
    completed_contracts: int
    badges: List[Dict[str, Any]]
    visibility_multiplier: float
    is_banned: bool


# ============================================================================
# DATABASE HELPER
# ============================================================================

class GamificationDB:
    """Database operations for gamification system"""
    
    def __init__(self, db_path: str = "gigchain.db"):
        self.db_path = db_path
    
    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def get_user_stats(self, user_id: str) -> Optional[UserStats]:
        """Fetch user stats from database"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM user_stats WHERE user_id = ?
        """, (user_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return None
        
        # Fetch badges
        badges = self._get_user_badges(user_id)
        
        return self._row_to_user_stats(row, badges)
    
    def _get_user_badges(self, user_id: str) -> List[Dict]:
        """Fetch user's badges"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT b.*, ub.earned_at, ub.metadata_json
            FROM user_badges ub
            JOIN badges b ON ub.badge_id = b.id
            WHERE ub.user_id = ?
            ORDER BY ub.earned_at DESC
        """, (user_id,))
        
        badges = []
        for row in cursor.fetchall():
            badges.append({
                "badge_type": row["badge_type"],
                "name": row["name"],
                "description": row["description"],
                "icon": row["icon"],
                "earned_at": row["earned_at"],
                "xp_reward": row["xp_reward"]
            })
        
        conn.close()
        return badges
    
    def save_user_stats(self, user_stats: UserStats):
        """Save user stats to database"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR REPLACE INTO user_stats (
                user_id, wallet_address, role, total_xp, level, xp_to_next_level,
                total_contracts, completed_contracts, cancelled_contracts, disputed_contracts,
                total_earned, total_spent, average_contract_value,
                trust_score, completion_rate, on_time_delivery_rate, average_rating, total_reviews,
                response_time_hours, dispute_rate, payment_reliability, successful_negotiations,
                visibility_multiplier, is_boosted, boost_reason,
                is_banned, ban_reason, warnings,
                last_contract_date, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_stats.user_id,
            user_stats.user_id,  # Using user_id as wallet placeholder
            user_stats.role.value,
            user_stats.total_xp,
            user_stats.level,
            user_stats.xp_to_next_level,
            user_stats.total_contracts,
            user_stats.completed_contracts,
            user_stats.cancelled_contracts,
            user_stats.disputed_contracts,
            user_stats.total_earned,
            user_stats.total_spent,
            user_stats.average_contract_value,
            user_stats.trust_score,
            user_stats.completion_rate,
            user_stats.on_time_delivery_rate,
            user_stats.average_rating,
            user_stats.total_reviews,
            user_stats.response_time_hours,
            user_stats.dispute_rate,
            user_stats.payment_reliability,
            0,  # successful_negotiations placeholder
            user_stats.visibility_multiplier,
            user_stats.is_boosted,
            user_stats.boost_reason,
            user_stats.is_banned,
            user_stats.ban_reason,
            user_stats.warnings,
            user_stats.last_contract_date.isoformat() if user_stats.last_contract_date else None,
            user_stats.created_at.isoformat(),
            user_stats.updated_at.isoformat()
        ))
        
        conn.commit()
        conn.close()
    
    def _row_to_user_stats(self, row, badges) -> UserStats:
        """Convert database row to UserStats"""
        from gamification import Badge
        
        badge_objects = [
            Badge(
                badge_type=BadgeType(b["badge_type"]),
                name=b["name"],
                description=b["description"],
                icon=b["icon"],
                earned_at=datetime.fromisoformat(b["earned_at"]),
                metadata={"xp_reward": b["xp_reward"]}
            )
            for b in badges
        ]
        
        return UserStats(
            user_id=row["user_id"],
            role=UserRole(row["role"]),
            total_xp=row["total_xp"],
            level=row["level"],
            xp_to_next_level=row["xp_to_next_level"],
            total_contracts=row["total_contracts"],
            completed_contracts=row["completed_contracts"],
            cancelled_contracts=row["cancelled_contracts"],
            disputed_contracts=row["disputed_contracts"],
            total_earned=row["total_earned"],
            total_spent=row["total_spent"],
            average_contract_value=row["average_contract_value"],
            trust_score=row["trust_score"],
            completion_rate=row["completion_rate"],
            on_time_delivery_rate=row["on_time_delivery_rate"],
            average_rating=row["average_rating"],
            total_reviews=row["total_reviews"],
            badges=badge_objects,
            badge_count=len(badge_objects),
            response_time_hours=row["response_time_hours"],
            dispute_rate=row["dispute_rate"],
            payment_reliability=row["payment_reliability"],
            visibility_multiplier=row["visibility_multiplier"],
            is_boosted=bool(row["is_boosted"]),
            boost_reason=row["boost_reason"],
            is_banned=bool(row["is_banned"]),
            ban_reason=row["ban_reason"],
            warnings=row["warnings"],
            last_contract_date=datetime.fromisoformat(row["last_contract_date"]) if row["last_contract_date"] else None,
            created_at=datetime.fromisoformat(row["created_at"]),
            updated_at=datetime.fromisoformat(row["updated_at"])
        )


# Singleton database instance
gamification_db = GamificationDB()


# ============================================================================
# API ENDPOINTS
# ============================================================================

@router.get("/users/{user_id}/stats", response_model=UserStatsResponse)
async def get_user_stats(user_id: str):
    """Get comprehensive user statistics"""
    user_stats = gamification_db.get_user_stats(user_id)
    
    if not user_stats:
        # Create new user stats
        user_stats = get_initial_user_stats(user_id, UserRole.FREELANCER)
        gamification_db.save_user_stats(user_stats)
    
    return {
        "user_id": user_stats.user_id,
        "level": user_stats.level,
        "total_xp": user_stats.total_xp,
        "xp_to_next_level": user_stats.xp_to_next_level,
        "trust_score": user_stats.trust_score,
        "completed_contracts": user_stats.completed_contracts,
        "badges": [
            {
                "type": b.badge_type.value,
                "name": b.name,
                "description": b.description,
                "icon": b.icon,
                "earned_at": b.earned_at.isoformat()
            }
            for b in user_stats.badges
        ],
        "visibility_multiplier": user_stats.visibility_multiplier,
        "is_banned": user_stats.is_banned
    }


@router.post("/contracts/analyze")
async def analyze_contract_offer(request: ContractOfferRequest):
    """
    Analyze contract offer with AI assistant
    Provides insights, warnings, and negotiation strategy
    """
    # Get user stats
    user_stats = gamification_db.get_user_stats(request.user_id)
    
    if not user_stats:
        user_stats = get_initial_user_stats(request.user_id, UserRole.FREELANCER)
    
    # Analyze offer with AI
    analysis = negotiation_assistant.analyze_contract_offer(
        contract_text=request.contract_text,
        offered_amount=request.offered_amount,
        user_level=user_stats.level,
        user_trust_score=user_stats.trust_score,
        user_experience=user_stats.completed_contracts,
        market_rate=request.market_rate
    )
    
    # Calculate suitable contract range
    suitable_range = ContractMatchingEngine.get_suitable_contract_range(
        user_stats.level,
        user_stats.trust_score
    )
    
    analysis["suitable_range"] = suitable_range
    analysis["user_stats"] = {
        "level": user_stats.level,
        "trust_score": user_stats.trust_score,
        "completed_contracts": user_stats.completed_contracts
    }
    
    return analysis


@router.post("/contracts/negotiate-or-accept")
async def negotiate_or_accept(request: NegotiateOrAcceptRequest):
    """
    Handle user decision to negotiate or accept contract
    """
    user_stats = gamification_db.get_user_stats(request.user_id)
    
    if not user_stats:
        raise HTTPException(status_code=404, detail="User not found")
    
    if request.decision == "accept":
        # Award XP for accepting contract
        user_stats = ExperienceCalculator.award_xp(
            user_stats,
            ExperienceCalculator.XP_CONTRACT_ACCEPTED,
            "Contract accepted"
        )
        
        user_stats.total_contracts += 1
        gamification_db.save_user_stats(user_stats)
        
        return {
            "success": True,
            "decision": "accept",
            "xp_awarded": ExperienceCalculator.XP_CONTRACT_ACCEPTED,
            "new_level": user_stats.level,
            "message": "Contract accepted! You've earned XP."
        }
    
    else:  # negotiate
        # Start negotiation session
        return {
            "success": True,
            "decision": "negotiate",
            "message": "Starting negotiation assistant...",
            "next_step": "counter_offer"
        }


@router.post("/contracts/highlight-analysis")
async def analyze_highlighted_text(request: HighlightAnalysisRequest):
    """
    Analyze highlighted text from contract
    Provides instant AI feedback
    """
    user_stats = gamification_db.get_user_stats(request.user_id)
    
    if not user_stats:
        user_stats = get_initial_user_stats(request.user_id, UserRole.FREELANCER)
    
    analysis = negotiation_assistant.analyze_highlighted_text(
        highlighted_text=request.highlighted_text,
        full_context=request.full_context,
        user_level=user_stats.level
    )
    
    return analysis


@router.post("/contracts/counter-offer")
async def generate_counter_offer(request: CounterOfferRequest):
    """
    Generate AI-powered counter-offer suggestion
    """
    user_stats = gamification_db.get_user_stats(request.user_id)
    
    if not user_stats:
        raise HTTPException(status_code=404, detail="User not found")
    
    counter_offer_analysis = negotiation_assistant.suggest_counter_offer(
        original_offer=request.original_offer,
        user_level=user_stats.level,
        user_experience=user_stats.completed_contracts,
        project_complexity=request.project_complexity,
        estimated_hours=request.estimated_hours
    )
    
    return counter_offer_analysis


@router.post("/contracts/complete")
async def complete_contract(request: ContractCompletionRequest):
    """
    Mark contract as completed and award XP/badges
    """
    user_stats = gamification_db.get_user_stats(request.user_id)
    
    if not user_stats:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update contract stats
    user_stats.completed_contracts += 1
    user_stats.total_reviews += 1
    
    # Recalculate average rating
    total_rating_points = (user_stats.average_rating * (user_stats.total_reviews - 1)) + request.rating
    user_stats.average_rating = total_rating_points / user_stats.total_reviews
    
    # Update completion rate
    user_stats.completion_rate = (user_stats.completed_contracts / user_stats.total_contracts) * 100
    
    # Update on-time delivery rate
    if request.was_on_time or request.days_early_or_late < 0:
        on_time_count = (user_stats.on_time_delivery_rate / 100) * (user_stats.completed_contracts - 1) + 1
        user_stats.on_time_delivery_rate = (on_time_count / user_stats.completed_contracts) * 100
    
    # Award XP
    xp_awards = []
    
    # Base completion XP
    user_stats = ExperienceCalculator.award_xp(
        user_stats,
        ExperienceCalculator.XP_CONTRACT_COMPLETED,
        "Contract completed"
    )
    xp_awards.append({"reason": "Contract completed", "xp": ExperienceCalculator.XP_CONTRACT_COMPLETED})
    
    # On-time bonus
    if request.was_on_time:
        user_stats = ExperienceCalculator.award_xp(
            user_stats,
            ExperienceCalculator.XP_ON_TIME_BONUS,
            "On-time delivery"
        )
        xp_awards.append({"reason": "On-time delivery", "xp": ExperienceCalculator.XP_ON_TIME_BONUS})
    
    # Early delivery bonus
    if request.days_early_or_late < 0:
        user_stats = ExperienceCalculator.award_xp(
            user_stats,
            ExperienceCalculator.XP_EARLY_DELIVERY_BONUS,
            "Early delivery"
        )
        xp_awards.append({"reason": "Early delivery", "xp": ExperienceCalculator.XP_EARLY_DELIVERY_BONUS})
    
    # Perfect rating bonus
    if request.rating == 5:
        user_stats = ExperienceCalculator.award_xp(
            user_stats,
            ExperienceCalculator.XP_PERFECT_RATING,
            "Perfect 5-star rating"
        )
        xp_awards.append({"reason": "Perfect rating", "xp": ExperienceCalculator.XP_PERFECT_RATING})
    
    # Check for new badges
    new_badges = BadgeManager.check_and_award_badges(user_stats)
    
    # Award badge XP
    for badge in new_badges:
        xp_reward = badge.metadata.get("xp_reward", 0)
        user_stats = ExperienceCalculator.award_xp(
            user_stats,
            xp_reward,
            f"Badge earned: {badge.name}"
        )
        user_stats.badges.append(badge)
        xp_awards.append({"reason": f"Badge: {badge.name}", "xp": xp_reward})
    
    # Recalculate trust score
    user_stats.trust_score = TrustScoreCalculator.calculate_trust_score(user_stats)
    user_stats.visibility_multiplier = TrustScoreCalculator.calculate_visibility_multiplier(user_stats)
    
    # Save updates
    user_stats.last_contract_date = datetime.now()
    gamification_db.save_user_stats(user_stats)
    
    return {
        "success": True,
        "xp_awarded": xp_awards,
        "new_badges": [
            {
                "name": b.name,
                "description": b.description,
                "icon": b.icon
            }
            for b in new_badges
        ],
        "new_level": user_stats.level,
        "new_trust_score": user_stats.trust_score,
        "visibility_multiplier": user_stats.visibility_multiplier,
        "message": f"Contract completed! You earned {sum(a['xp'] for a in xp_awards)} XP and {len(new_badges)} new badge(s)!"
    }


@router.get("/users/{user_id}/suitable-contracts")
async def get_suitable_contracts(user_id: str):
    """
    Get suitable contract value range for user based on level and trust
    """
    user_stats = gamification_db.get_user_stats(user_id)
    
    if not user_stats:
        raise HTTPException(status_code=404, detail="User not found")
    
    suitable_range = ContractMatchingEngine.get_suitable_contract_range(
        user_stats.level,
        user_stats.trust_score
    )
    
    return {
        "user_level": user_stats.level,
        "trust_score": user_stats.trust_score,
        "suitable_range": suitable_range,
        "message": f"Based on your level {user_stats.level} and trust score {user_stats.trust_score:.1f}, you're ready for contracts in this range."
    }


@router.get("/leaderboard")
async def get_leaderboard(
    sort_by: str = "trust_score",
    limit: int = 50
):
    """
    Get leaderboard of top users
    """
    conn = gamification_db.get_connection()
    cursor = conn.cursor()
    
    valid_sorts = ["trust_score", "level", "completed_contracts", "badge_count"]
    if sort_by not in valid_sorts:
        sort_by = "trust_score"
    
    # Custom query for badge_count
    if sort_by == "badge_count":
        query = """
            SELECT u.*, COUNT(ub.id) as badge_count
            FROM user_stats u
            LEFT JOIN user_badges ub ON u.user_id = ub.user_id
            WHERE u.is_banned = 0
            GROUP BY u.user_id
            ORDER BY badge_count DESC, u.trust_score DESC
            LIMIT ?
        """
    else:
        query = f"""
            SELECT u.*, COUNT(ub.id) as badge_count
            FROM user_stats u
            LEFT JOIN user_badges ub ON u.user_id = ub.user_id
            WHERE u.is_banned = 0
            GROUP BY u.user_id
            ORDER BY u.{sort_by} DESC
            LIMIT ?
        """
    
    cursor.execute(query, (limit,))
    rows = cursor.fetchall()
    conn.close()
    
    leaderboard = []
    for idx, row in enumerate(rows, 1):
        leaderboard.append({
            "rank": idx,
            "user_id": row["user_id"],
            "level": row["level"],
            "trust_score": row["trust_score"],
            "completed_contracts": row["completed_contracts"],
            "badge_count": row["badge_count"],
            "visibility_multiplier": row["visibility_multiplier"]
        })
    
    return {
        "leaderboard": leaderboard,
        "sort_by": sort_by,
        "total_users": len(leaderboard)
    }


@router.get("/badges")
async def get_all_badges():
    """Get all available badges"""
    conn = gamification_db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM badges ORDER BY category, xp_reward")
    rows = cursor.fetchall()
    conn.close()
    
    badges = []
    for row in rows:
        badges.append({
            "id": row["id"],
            "badge_type": row["badge_type"],
            "name": row["name"],
            "description": row["description"],
            "icon": row["icon"],
            "category": row["category"],
            "xp_reward": row["xp_reward"],
            "rarity": row["rarity"]
        })
    
    return {"badges": badges, "total": len(badges)}
