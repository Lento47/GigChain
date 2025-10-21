"""
GigChain Engagement System with GigSoul Token Integration
Sistema de engagement que permite a los usuarios invertir tokens GigSoul para aumentar views
"""

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from enum import Enum
import json
import math

class EngagementType(Enum):
    """Tipos de engagement en publicaciones"""
    VIEW = "view"
    LIKE = "like"
    COMMENT = "comment"
    SHARE = "share"
    BOOKMARK = "bookmark"
    BOOST = "boost"  # Boost con tokens

class BoostType(Enum):
    """Tipos de boost disponibles"""
    VIEWS_BOOST = "views_boost"  # Aumentar views
    VISIBILITY_BOOST = "visibility_boost"  # Aumentar visibilidad en feed
    TRENDING_BOOST = "trending_boost"  # Aparecer en trending
    PREMIUM_PLACEMENT = "premium_placement"  # Posición premium

@dataclass
class EngagementBoost:
    """Boost de engagement con tokens GigSoul"""
    id: str
    post_id: str
    user_id: str
    boost_type: BoostType
    tokens_invested: float
    multiplier: float  # Multiplicador de engagement
    duration_hours: int
    created_at: datetime
    expires_at: datetime
    is_active: bool = True
    views_generated: int = 0
    engagement_generated: int = 0

@dataclass
class PostEngagement:
    """Engagement de una publicación"""
    post_id: str
    author_id: str
    total_views: int = 0
    organic_views: int = 0  # Views naturales
    boosted_views: int = 0  # Views por boost
    total_likes: int = 0
    total_comments: int = 0
    total_shares: int = 0
    total_bookmarks: int = 0
    engagement_rate: float = 0.0
    tokens_earned: float = 0.0
    tokens_spent: float = 0.0
    last_updated: datetime = None

@dataclass
class UserEngagement:
    """Engagement de un usuario"""
    user_id: str
    total_posts: int = 0
    total_views_received: int = 0
    total_engagement_given: int = 0
    total_engagement_received: int = 0
    tokens_earned_from_engagement: float = 0.0
    tokens_spent_on_boosts: float = 0.0
    engagement_score: float = 0.0
    last_updated: datetime = None

class EngagementSystem:
    """Sistema principal de engagement con tokens GigSoul"""
    
    def __init__(self):
        self.boosts: Dict[str, EngagementBoost] = {}
        self.post_engagement: Dict[str, PostEngagement] = {}
        self.user_engagement: Dict[str, UserEngagement] = {}
        self.engagement_history: List[Dict] = []
        
        # Configuración de precios de boost
        self.boost_prices = {
            BoostType.VIEWS_BOOST: {
                "base_price": 10.0,  # 10 GigSoul tokens
                "multiplier_per_token": 0.1,  # +0.1x por token
                "max_multiplier": 5.0,  # Máximo 5x
                "duration_hours": 24
            },
            BoostType.VISIBILITY_BOOST: {
                "base_price": 25.0,
                "multiplier_per_token": 0.05,
                "max_multiplier": 3.0,
                "duration_hours": 48
            },
            BoostType.TRENDING_BOOST: {
                "base_price": 50.0,
                "multiplier_per_token": 0.02,
                "max_multiplier": 2.0,
                "duration_hours": 72
            },
            BoostType.PREMIUM_PLACEMENT: {
                "base_price": 100.0,
                "multiplier_per_token": 0.01,
                "max_multiplier": 1.5,
                "duration_hours": 168  # 1 semana
            }
        }
        
        # Recompensas por engagement
        self.engagement_rewards = {
            EngagementType.VIEW: 0.1,  # 0.1 GigSoul por view
            EngagementType.LIKE: 0.5,  # 0.5 GigSoul por like
            EngagementType.COMMENT: 2.0,  # 2 GigSoul por comentario
            EngagementType.SHARE: 1.0,  # 1 GigSoul por share
            EngagementType.BOOKMARK: 0.3,  # 0.3 GigSoul por bookmark
        }

    def calculate_boost_price(self, boost_type: BoostType, tokens_invested: float) -> Dict[str, Any]:
        """Calcular precio y multiplicador para un boost"""
        config = self.boost_prices[boost_type]
        
        # Calcular multiplicador basado en tokens invertidos
        multiplier = min(
            config["multiplier_per_token"] * tokens_invested,
            config["max_multiplier"]
        )
        
        # Precio base + bonus por tokens adicionales
        base_price = config["base_price"]
        bonus_price = max(0, tokens_invested - base_price) * 0.5
        
        total_price = base_price + bonus_price
        
        return {
            "total_price": total_price,
            "multiplier": multiplier,
            "duration_hours": config["duration_hours"],
            "estimated_views": int(tokens_invested * 10),  # ~10 views por token
            "estimated_engagement": int(tokens_invested * 2)  # ~2 engagement por token
        }

    def create_boost(self, post_id: str, user_id: str, boost_type: BoostType, 
                    tokens_invested: float) -> Optional[EngagementBoost]:
        """Crear un boost de engagement"""
        
        # Verificar que el usuario tiene suficientes tokens
        # (esto se integraría con el sistema de tokens)
        
        # Calcular detalles del boost
        boost_details = self.calculate_boost_price(boost_type, tokens_invested)
        
        # Crear boost
        boost_id = f"boost_{post_id}_{user_id}_{int(datetime.now().timestamp())}"
        boost = EngagementBoost(
            id=boost_id,
            post_id=post_id,
            user_id=user_id,
            boost_type=boost_type,
            tokens_invested=tokens_invested,
            multiplier=boost_details["multiplier"],
            duration_hours=boost_details["duration_hours"],
            created_at=datetime.now(),
            expires_at=datetime.now() + timedelta(hours=boost_details["duration_hours"])
        )
        
        self.boosts[boost_id] = boost
        
        # Actualizar engagement del post
        self._update_post_engagement(post_id, user_id, tokens_invested, boost_type)
        
        # Registrar en historial
        self.engagement_history.append({
            "type": "boost_created",
            "post_id": post_id,
            "user_id": user_id,
            "boost_type": boost_type.value,
            "tokens_invested": tokens_invested,
            "timestamp": datetime.now().isoformat()
        })
        
        return boost

    def record_engagement(self, post_id: str, user_id: str, engagement_type: EngagementType) -> Dict[str, Any]:
        """Registrar engagement en una publicación"""
        
        # Inicializar engagement del post si no existe
        if post_id not in self.post_engagement:
            self.post_engagement[post_id] = PostEngagement(
                post_id=post_id,
                author_id="",  # Se debería obtener del post
                last_updated=datetime.now()
            )
        
        # Actualizar contadores
        post_eng = self.post_engagement[post_id]
        
        if engagement_type == EngagementType.VIEW:
            post_eng.total_views += 1
            post_eng.organic_views += 1
        elif engagement_type == EngagementType.LIKE:
            post_eng.total_likes += 1
        elif engagement_type == EngagementType.COMMENT:
            post_eng.total_comments += 1
        elif engagement_type == EngagementType.SHARE:
            post_eng.total_shares += 1
        elif engagement_type == EngagementType.BOOKMARK:
            post_eng.total_bookmarks += 1
        
        # Calcular engagement rate
        total_engagement = (post_eng.total_likes + post_eng.total_comments + 
                          post_eng.total_shares + post_eng.total_bookmarks)
        post_eng.engagement_rate = (total_engagement / max(post_eng.total_views, 1)) * 100
        
        # Aplicar boosts activos
        boosted_views = self._apply_active_boosts(post_id, engagement_type)
        if boosted_views > 0:
            post_eng.boosted_views += boosted_views
            post_eng.total_views += boosted_views
        
        # Calcular recompensas
        reward = self.engagement_rewards.get(engagement_type, 0)
        if reward > 0:
            post_eng.tokens_earned += reward
            
            # Actualizar engagement del usuario
            self._update_user_engagement(user_id, engagement_type, reward)
        
        post_eng.last_updated = datetime.now()
        
        # Registrar en historial
        self.engagement_history.append({
            "type": "engagement",
            "post_id": post_id,
            "user_id": user_id,
            "engagement_type": engagement_type.value,
            "reward": reward,
            "timestamp": datetime.now().isoformat()
        })
        
        return {
            "success": True,
            "reward": reward,
            "total_views": post_eng.total_views,
            "engagement_rate": post_eng.engagement_rate,
            "boosted_views": boosted_views
        }

    def _apply_active_boosts(self, post_id: str, engagement_type: EngagementType) -> int:
        """Aplicar boosts activos a una publicación"""
        boosted_views = 0
        current_time = datetime.now()
        
        for boost in self.boosts.values():
            if (boost.post_id == post_id and 
                boost.is_active and 
                current_time < boost.expires_at):
                
                # Calcular views adicionales basadas en el boost
                if engagement_type == EngagementType.VIEW:
                    additional_views = int(boost.tokens_invested * boost.multiplier)
                    boosted_views += additional_views
                    boost.views_generated += additional_views
                
                boost.engagement_generated += 1
        
        return boosted_views

    def _update_post_engagement(self, post_id: str, user_id: str, tokens_spent: float, boost_type: BoostType):
        """Actualizar engagement de una publicación"""
        if post_id not in self.post_engagement:
            self.post_engagement[post_id] = PostEngagement(
                post_id=post_id,
                author_id=user_id,
                last_updated=datetime.now()
            )
        
        self.post_engagement[post_id].tokens_spent += tokens_spent
        self.post_engagement[post_id].last_updated = datetime.now()

    def _update_user_engagement(self, user_id: str, engagement_type: EngagementType, reward: float):
        """Actualizar engagement de un usuario"""
        if user_id not in self.user_engagement:
            self.user_engagement[user_id] = UserEngagement(
                user_id=user_id,
                last_updated=datetime.now()
            )
        
        user_eng = self.user_engagement[user_id]
        user_eng.total_engagement_given += 1
        user_eng.tokens_earned_from_engagement += reward
        user_eng.last_updated = datetime.now()
        
        # Recalcular engagement score
        user_eng.engagement_score = self._calculate_engagement_score(user_eng)

    def _calculate_engagement_score(self, user_eng: UserEngagement) -> float:
        """Calcular score de engagement de un usuario"""
        if user_eng.total_engagement_given == 0:
            return 0.0
        
        # Score basado en engagement dado y recibido
        engagement_ratio = user_eng.total_engagement_received / max(user_eng.total_engagement_given, 1)
        token_efficiency = user_eng.tokens_earned_from_engagement / max(user_eng.tokens_spent_on_boosts, 1)
        
        score = (engagement_ratio * 0.6 + token_efficiency * 0.4) * 100
        return min(score, 100.0)  # Máximo 100

    def get_post_analytics(self, post_id: str) -> Dict[str, Any]:
        """Obtener analytics de una publicación"""
        if post_id not in self.post_engagement:
            return {"error": "Post not found"}
        
        post_eng = self.post_engagement[post_id]
        
        # Obtener boosts activos
        active_boosts = [
            boost for boost in self.boosts.values()
            if (boost.post_id == post_id and 
                boost.is_active and 
                datetime.now() < boost.expires_at)
        ]
        
        return {
            "post_id": post_id,
            "total_views": post_eng.total_views,
            "organic_views": post_eng.organic_views,
            "boosted_views": post_eng.boosted_views,
            "total_likes": post_eng.total_likes,
            "total_comments": post_eng.total_comments,
            "total_shares": post_eng.total_shares,
            "total_bookmarks": post_eng.total_bookmarks,
            "engagement_rate": post_eng.engagement_rate,
            "tokens_earned": post_eng.tokens_earned,
            "tokens_spent": post_eng.tokens_spent,
            "active_boosts": len(active_boosts),
            "boost_details": [
                {
                    "type": boost.boost_type.value,
                    "multiplier": boost.multiplier,
                    "tokens_invested": boost.tokens_invested,
                    "views_generated": boost.views_generated,
                    "expires_at": boost.expires_at.isoformat()
                }
                for boost in active_boosts
            ],
            "last_updated": post_eng.last_updated.isoformat() if post_eng.last_updated else None
        }

    def get_user_engagement_stats(self, user_id: str) -> Dict[str, Any]:
        """Obtener estadísticas de engagement de un usuario"""
        if user_id not in self.user_engagement:
            return {"error": "User not found"}
        
        user_eng = self.user_engagement[user_id]
        
        return {
            "user_id": user_id,
            "total_posts": user_eng.total_posts,
            "total_views_received": user_eng.total_views_received,
            "total_engagement_given": user_eng.total_engagement_given,
            "total_engagement_received": user_eng.total_engagement_received,
            "tokens_earned_from_engagement": user_eng.tokens_earned_from_engagement,
            "tokens_spent_on_boosts": user_eng.tokens_spent_on_boosts,
            "engagement_score": user_eng.engagement_score,
            "last_updated": user_eng.last_updated.isoformat() if user_eng.last_updated else None
        }

    def get_trending_posts(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Obtener posts trending basados en engagement y boosts"""
        trending_posts = []
        
        for post_id, post_eng in self.post_engagement.items():
            # Calcular score de trending
            trending_score = (
                post_eng.total_views * 0.3 +
                post_eng.total_likes * 0.4 +
                post_eng.total_comments * 0.2 +
                post_eng.total_shares * 0.1 +
                post_eng.boosted_views * 0.5  # Bonus por boosts
            )
            
            trending_posts.append({
                "post_id": post_id,
                "trending_score": trending_score,
                "total_views": post_eng.total_views,
                "engagement_rate": post_eng.engagement_rate,
                "tokens_earned": post_eng.tokens_earned
            })
        
        # Ordenar por score de trending
        trending_posts.sort(key=lambda x: x["trending_score"], reverse=True)
        
        return trending_posts[:limit]

    def cleanup_expired_boosts(self):
        """Limpiar boosts expirados"""
        current_time = datetime.now()
        expired_boosts = []
        
        for boost_id, boost in self.boosts.items():
            if current_time >= boost.expires_at:
                boost.is_active = False
                expired_boosts.append(boost_id)
        
        return expired_boosts

# Instancia global del sistema
engagement_system = EngagementSystem()