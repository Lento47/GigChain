"""
GigChain.io - Reputation NFT API
REST API endpoints for reputation NFT system.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging

from reputation_nft_system import reputation_nft, ReputationLevel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/reputation", tags=["Reputation NFT"])

class MintReputationRequest(BaseModel):
    """Request model for minting reputation NFT."""
    user_address: str = Field(..., description="User's wallet address")

class UpdateAfterContractRequest(BaseModel):
    """Request model for updating reputation after contract."""
    user_address: str = Field(..., description="User's wallet address")
    amount_earned: float = Field(..., gt=0, description="Amount earned from contract")
    rating: int = Field(..., ge=1, le=5, description="Contract rating (1-5)")
    on_time: bool = Field(default=True, description="Whether contract was completed on time")

class UpdateAfterDisputeRequest(BaseModel):
    """Request model for updating reputation after dispute."""
    user_address: str = Field(..., description="User's wallet address")
    won: bool = Field(..., description="Whether user won the dispute")

@router.post("/mint")
async def mint_reputation(request: MintReputationRequest):
    """
    Mint a reputation NFT for a new user.
    
    Creates a soulbound NFT that tracks user's reputation and achievements.
    """
    try:
        token_id = reputation_nft.mint_reputation_nft(request.user_address)
        
        return {
            "success": True,
            "token_id": token_id,
            "user_address": request.user_address,
            "message": "Reputation NFT minted successfully",
            "initial_level": "Novice",
            "initial_points": 0,
            "timestamp": datetime.now().isoformat()
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error minting reputation NFT: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/update/contract")
async def update_after_contract(request: UpdateAfterContractRequest):
    """
    Update reputation after contract completion.
    
    Awards points based on contract value, rating, and on-time completion.
    May trigger level up.
    """
    try:
        result = reputation_nft.update_after_contract(
            user_address=request.user_address,
            amount_earned=request.amount_earned,
            rating=request.rating,
            on_time=request.on_time
        )
        
        response = {
            "success": True,
            "message": "Reputation updated successfully",
            "points_earned": result["points_earned"],
            "level_up": result["level_up"],
            "reputation": result["reputation"],
            "timestamp": datetime.now().isoformat()
        }
        
        if result["level_up"]:
            response["level_up_message"] = f"🎉 Congratulations! You leveled up from {result['old_level']} to {result['new_level']}!"
        
        return response
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating reputation after contract: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/update/dispute")
async def update_after_dispute(request: UpdateAfterDisputeRequest):
    """
    Update reputation after dispute resolution.
    
    Adds or removes points based on dispute outcome.
    """
    try:
        result = reputation_nft.update_after_dispute(
            user_address=request.user_address,
            won=request.won
        )
        
        return {
            "success": True,
            "message": "Reputation updated after dispute",
            "won_dispute": result["won_dispute"],
            "points_change": result["points_change"],
            "reputation": result["reputation"],
            "timestamp": datetime.now().isoformat()
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating reputation after dispute: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user/{user_address}")
async def get_user_reputation(user_address: str):
    """
    Get reputation data for a specific user.
    
    Returns complete reputation profile including NFT metadata.
    """
    try:
        reputation = reputation_nft.get_reputation(user_address)
        
        if not reputation:
            raise HTTPException(
                status_code=404,
                detail=f"User {user_address} has no reputation NFT. Mint one first at /api/reputation/mint"
            )
        
        return {
            "success": True,
            "reputation": reputation,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user reputation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/leaderboard")
async def get_leaderboard(limit: int = 10):
    """
    Get reputation leaderboard.
    
    Returns top users ranked by reputation points.
    """
    try:
        leaderboard = reputation_nft.get_leaderboard(limit)
        
        return {
            "success": True,
            "leaderboard": leaderboard,
            "limit": limit,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting leaderboard: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/statistics")
async def get_reputation_statistics():
    """
    Get reputation system statistics.
    
    Returns aggregate data about the reputation NFT system.
    """
    try:
        stats = reputation_nft.get_statistics()
        
        return {
            "success": True,
            "statistics": stats,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/levels")
async def get_reputation_levels():
    """
    Get information about reputation levels.
    
    Returns details about each level and requirements.
    """
    levels = [
        {
            "level": 0,
            "name": "Novice",
            "min_points": 0,
            "max_points": 99,
            "color": "#10B981",
            "description": "Just getting started on GigChain"
        },
        {
            "level": 1,
            "name": "Apprentice",
            "min_points": 100,
            "max_points": 499,
            "color": "#3B82F6",
            "description": "Learning the ropes"
        },
        {
            "level": 2,
            "name": "Professional",
            "min_points": 500,
            "max_points": 999,
            "color": "#6366F1",
            "description": "Established professional"
        },
        {
            "level": 3,
            "name": "Expert",
            "min_points": 1000,
            "max_points": 2499,
            "color": "#CD7F32",
            "description": "Recognized expert"
        },
        {
            "level": 4,
            "name": "Master",
            "min_points": 2500,
            "max_points": 4999,
            "color": "#C0C0C0",
            "description": "Master of the craft"
        },
        {
            "level": 5,
            "name": "Legend",
            "min_points": 5000,
            "max_points": None,
            "color": "#FFD700",
            "description": "Legendary status"
        }
    ]
    
    return {
        "success": True,
        "levels": levels,
        "timestamp": datetime.now().isoformat()
    }

@router.get("/health")
async def reputation_nft_health():
    """Health check for reputation NFT system."""
    try:
        stats = reputation_nft.get_statistics()
        
        return {
            "status": "healthy",
            "service": "Reputation NFT System",
            "version": "1.0.0",
            "blockchain_connected": reputation_nft.w3 is not None,
            "contract_address": reputation_nft.contract_address,
            "total_nfts": stats["total_nfts"],
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Reputation NFT health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "service": "Reputation NFT System",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
