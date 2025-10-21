"""
GigChain Engagement API - Sistema de engagement con tokens GigSoul
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from engagement_system import (
    engagement_system, EngagementType, BoostType, 
    EngagementBoost, PostEngagement, UserEngagement
)

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Router principal
router = APIRouter(prefix="/api/engagement", tags=["Engagement"])

# Esquemas Pydantic
class BoostRequest(BaseModel):
    post_id: str = Field(..., description="ID de la publicación")
    boost_type: str = Field(..., description="Tipo de boost")
    tokens_invested: float = Field(..., gt=0, description="Tokens GigSoul a invertir")

class EngagementRequest(BaseModel):
    post_id: str = Field(..., description="ID de la publicación")
    engagement_type: str = Field(..., description="Tipo de engagement")

class BoostResponse(BaseModel):
    boost_id: str
    post_id: str
    boost_type: str
    tokens_invested: float
    multiplier: float
    duration_hours: int
    estimated_views: int
    estimated_engagement: int
    expires_at: str
    is_active: bool

class PostAnalyticsResponse(BaseModel):
    post_id: str
    total_views: int
    organic_views: int
    boosted_views: int
    total_likes: int
    total_comments: int
    total_shares: int
    total_bookmarks: int
    engagement_rate: float
    tokens_earned: float
    tokens_spent: float
    active_boosts: int
    boost_details: List[Dict[str, Any]]
    last_updated: Optional[str]

class UserEngagementResponse(BaseModel):
    user_id: str
    total_posts: int
    total_views_received: int
    total_engagement_given: int
    total_engagement_received: int
    tokens_earned_from_engagement: float
    tokens_spent_on_boosts: float
    engagement_score: float
    last_updated: Optional[str]

class TrendingPostResponse(BaseModel):
    post_id: str
    trending_score: float
    total_views: int
    engagement_rate: float
    tokens_earned: float

# ==================== BOOST ENDPOINTS ====================

@router.post("/boost", response_model=BoostResponse)
async def create_boost(boost_request: BoostRequest):
    """Crear un boost de engagement con tokens GigSoul"""
    try:
        # Validar tipo de boost
        try:
            boost_type = BoostType(boost_request.boost_type)
        except ValueError:
            raise HTTPException(
                status_code=400, 
                detail=f"Tipo de boost inválido. Opciones: {[t.value for t in BoostType]}"
            )
        
        # Crear boost
        boost = engagement_system.create_boost(
            post_id=boost_request.post_id,
            user_id="current_user",  # Se debería obtener del token JWT
            boost_type=boost_type,
            tokens_invested=boost_request.tokens_invested
        )
        
        if not boost:
            raise HTTPException(status_code=400, detail="No se pudo crear el boost")
        
        # Calcular estimaciones
        boost_details = engagement_system.calculate_boost_price(
            boost_type, boost_request.tokens_invested
        )
        
        return BoostResponse(
            boost_id=boost.id,
            post_id=boost.post_id,
            boost_type=boost.boost_type.value,
            tokens_invested=boost.tokens_invested,
            multiplier=boost.multiplier,
            duration_hours=boost.duration_hours,
            estimated_views=boost_details["estimated_views"],
            estimated_engagement=boost_details["estimated_engagement"],
            expires_at=boost.expires_at.isoformat(),
            is_active=boost.is_active
        )
        
    except Exception as e:
        logger.error(f"Error creating boost: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/boost/price/{boost_type}")
async def get_boost_price(boost_type: str, tokens: float = Query(..., gt=0)):
    """Obtener precio y estimaciones para un boost"""
    try:
        try:
            boost_type_enum = BoostType(boost_type)
        except ValueError:
            raise HTTPException(
                status_code=400, 
                detail=f"Tipo de boost inválido. Opciones: {[t.value for t in BoostType]}"
            )
        
        price_details = engagement_system.calculate_boost_price(boost_type_enum, tokens)
        
        return {
            "boost_type": boost_type,
            "tokens_invested": tokens,
            "total_price": price_details["total_price"],
            "multiplier": price_details["multiplier"],
            "duration_hours": price_details["duration_hours"],
            "estimated_views": price_details["estimated_views"],
            "estimated_engagement": price_details["estimated_engagement"]
        }
        
    except Exception as e:
        logger.error(f"Error getting boost price: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/boost/active/{post_id}")
async def get_active_boosts(post_id: str):
    """Obtener boosts activos de una publicación"""
    try:
        active_boosts = []
        current_time = datetime.now()
        
        for boost in engagement_system.boosts.values():
            if (boost.post_id == post_id and 
                boost.is_active and 
                current_time < boost.expires_at):
                
                active_boosts.append({
                    "boost_id": boost.id,
                    "boost_type": boost.boost_type.value,
                    "tokens_invested": boost.tokens_invested,
                    "multiplier": boost.multiplier,
                    "views_generated": boost.views_generated,
                    "engagement_generated": boost.engagement_generated,
                    "created_at": boost.created_at.isoformat(),
                    "expires_at": boost.expires_at.isoformat(),
                    "time_remaining_hours": (boost.expires_at - current_time).total_seconds() / 3600
                })
        
        return {
            "post_id": post_id,
            "active_boosts": active_boosts,
            "total_boosts": len(active_boosts)
        }
        
    except Exception as e:
        logger.error(f"Error getting active boosts: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

# ==================== ENGAGEMENT ENDPOINTS ====================

@router.post("/record")
async def record_engagement(engagement_request: EngagementRequest):
    """Registrar engagement en una publicación"""
    try:
        # Validar tipo de engagement
        try:
            engagement_type = EngagementType(engagement_request.engagement_type)
        except ValueError:
            raise HTTPException(
                status_code=400, 
                detail=f"Tipo de engagement inválido. Opciones: {[t.value for t in EngagementType]}"
            )
        
        # Registrar engagement
        result = engagement_system.record_engagement(
            post_id=engagement_request.post_id,
            user_id="current_user",  # Se debería obtener del token JWT
            engagement_type=engagement_type
        )
        
        return {
            "success": True,
            "message": "Engagement registrado exitosamente",
            "data": result
        }
        
    except Exception as e:
        logger.error(f"Error recording engagement: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/analytics/post/{post_id}", response_model=PostAnalyticsResponse)
async def get_post_analytics(post_id: str):
    """Obtener analytics de una publicación"""
    try:
        analytics = engagement_system.get_post_analytics(post_id)
        
        if "error" in analytics:
            raise HTTPException(status_code=404, detail=analytics["error"])
        
        return PostAnalyticsResponse(**analytics)
        
    except Exception as e:
        logger.error(f"Error getting post analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/analytics/user/{user_id}", response_model=UserEngagementResponse)
async def get_user_engagement_stats(user_id: str):
    """Obtener estadísticas de engagement de un usuario"""
    try:
        stats = engagement_system.get_user_engagement_stats(user_id)
        
        if "error" in stats:
            raise HTTPException(status_code=404, detail=stats["error"])
        
        return UserEngagementResponse(**stats)
        
    except Exception as e:
        logger.error(f"Error getting user engagement stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

# ==================== TRENDING ENDPOINTS ====================

@router.get("/trending", response_model=List[TrendingPostResponse])
async def get_trending_posts(limit: int = Query(10, ge=1, le=50)):
    """Obtener posts trending"""
    try:
        trending_posts = engagement_system.get_trending_posts(limit)
        
        return [
            TrendingPostResponse(
                post_id=post["post_id"],
                trending_score=post["trending_score"],
                total_views=post["total_views"],
                engagement_rate=post["engagement_rate"],
                tokens_earned=post["tokens_earned"]
            )
            for post in trending_posts
        ]
        
    except Exception as e:
        logger.error(f"Error getting trending posts: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/trending/boosted")
async def get_boosted_posts(limit: int = Query(10, ge=1, le=50)):
    """Obtener posts con boosts activos"""
    try:
        boosted_posts = []
        current_time = datetime.now()
        
        for boost in engagement_system.boosts.values():
            if boost.is_active and current_time < boost.expires_at:
                post_analytics = engagement_system.get_post_analytics(boost.post_id)
                if "error" not in post_analytics:
                    boosted_posts.append({
                        "post_id": boost.post_id,
                        "boost_type": boost.boost_type.value,
                        "tokens_invested": boost.tokens_invested,
                        "multiplier": boost.multiplier,
                        "views_generated": boost.views_generated,
                        "total_views": post_analytics["total_views"],
                        "engagement_rate": post_analytics["engagement_rate"],
                        "expires_at": boost.expires_at.isoformat()
                    })
        
        # Ordenar por tokens invertidos
        boosted_posts.sort(key=lambda x: x["tokens_invested"], reverse=True)
        
        return {
            "boosted_posts": boosted_posts[:limit],
            "total_boosted": len(boosted_posts)
        }
        
    except Exception as e:
        logger.error(f"Error getting boosted posts: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

# ==================== UTILITY ENDPOINTS ====================

@router.post("/cleanup")
async def cleanup_expired_boosts():
    """Limpiar boosts expirados"""
    try:
        expired_boosts = engagement_system.cleanup_expired_boosts()
        
        return {
            "success": True,
            "message": f"Se limpiaron {len(expired_boosts)} boosts expirados",
            "expired_boosts": expired_boosts
        }
        
    except Exception as e:
        logger.error(f"Error cleaning up expired boosts: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/stats/overview")
async def get_engagement_overview():
    """Obtener estadísticas generales del sistema de engagement"""
    try:
        total_boosts = len(engagement_system.boosts)
        active_boosts = len([
            boost for boost in engagement_system.boosts.values()
            if boost.is_active and datetime.now() < boost.expires_at
        ])
        
        total_posts = len(engagement_system.post_engagement)
        total_users = len(engagement_system.user_engagement)
        
        total_tokens_invested = sum(
            boost.tokens_invested for boost in engagement_system.boosts.values()
        )
        
        total_views_generated = sum(
            post.total_views for post in engagement_system.post_engagement.values()
        )
        
        return {
            "total_boosts": total_boosts,
            "active_boosts": active_boosts,
            "total_posts": total_posts,
            "total_users": total_users,
            "total_tokens_invested": total_tokens_invested,
            "total_views_generated": total_views_generated,
            "average_engagement_rate": sum(
                post.engagement_rate for post in engagement_system.post_engagement.values()
            ) / max(total_posts, 1)
        }
        
    except Exception as e:
        logger.error(f"Error getting engagement overview: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")