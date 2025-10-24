"""Profile Router - Profile Management Endpoints"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import logging
from typing import Dict, Any, Optional

# Import authentication dependencies
from auth import get_current_wallet

# Import profile management
from profile_manager import (
    get_profile_db, UserProfile, UserSkill, UserNFT,
    ProfileDatabase
)

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/profile", tags=["profiles"])

@router.get("/{wallet_address}")
async def get_user_profile(wallet_address: str):
    """Get user profile by wallet address."""
    try:
        profile_db = get_profile_db()
        profile = profile_db.get_profile(wallet_address)
        
        if not profile:
            return JSONResponse(
                status_code=404,
                content={"error": "Profile not found"}
            )
        
        # Get additional data
        skills = profile_db.get_skills(wallet_address)
        nfts = profile_db.get_nfts(wallet_address)
        
        return {
            "profile": {
                "wallet_address": profile.wallet_address,
                "display_name": profile.display_name,
                "bio": profile.bio,
                "avatar_url": profile.avatar_url,  # ✅ AGREGADO!
                "location": profile.location,
                "website": profile.website,
                "twitter_handle": profile.twitter_handle,
                "github_handle": profile.github_handle,
                "linkedin_handle": profile.linkedin_handle,
                "is_verified": profile.is_verified,
                "verification_level": profile.verification_level,
                "profile_completeness": profile.profile_completeness,
                "current_tier": profile.current_tier,
                "tier_progress": profile.tier_progress,
                "total_xp": profile.total_xp,
                "created_at": profile.created_at,
                "updated_at": profile.updated_at,
                "last_active": profile.last_active,
                "preferences": profile.preferences,
                "settings": profile.settings
            },
            "skills": [
                {
                    "wallet_address": skill.wallet_address,
                    "skill_name": skill.skill_name,
                    "skill_level": skill.skill_level,
                    "endorsements": skill.endorsements,
                    "is_verified": skill.is_verified,
                    "created_at": skill.created_at
                } for skill in skills
            ],
            "nfts": [
                {
                    "wallet_address": nft.wallet_address,
                    "nft_name": nft.nft_name,
                    "nft_type": nft.nft_type,
                    "tier_level": nft.tier_level,
                    "rarity": nft.rarity,
                    "image_file": nft.image_file,
                    "description": nft.description,
                    "earned_at": nft.earned_at
                } for nft in nfts
            ]
        }
        
    except Exception as e:
        logger.error(f"Error getting profile: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error"}
        )

@router.post("/create")
async def create_user_profile(profile_data: dict):
    """Create a new user profile."""
    try:
        profile_db = get_profile_db()
        
        # Use wallet address from profile_data or default test address
        wallet_address = profile_data.get("wallet_address", "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0")
        
        # Log avatar_url info
        avatar_url = profile_data.get("avatar_url")
        if avatar_url:
            logger.info(f"📸 Creating profile with avatar_url (size: {len(avatar_url)} chars)")
        else:
            logger.info("Creating profile without avatar")
        
        # Create UserProfile object
        profile = UserProfile(
            wallet_address=wallet_address,
            username=profile_data.get("username"),
            display_name=profile_data.get("display_name"),
            bio=profile_data.get("bio"),
            avatar_url=avatar_url,
            location=profile_data.get("location"),
            website=profile_data.get("website"),
            twitter_handle=profile_data.get("twitter_handle"),
            github_handle=profile_data.get("github_handle"),
            linkedin_handle=profile_data.get("linkedin_handle"),
            preferences=profile_data.get("preferences", {}),
            settings=profile_data.get("settings", {})
        )
        
        success = profile_db.create_profile(profile)
        
        if success:
            logger.info(f"✅ Profile created successfully for {wallet_address}")
            return {"message": "Profile created successfully", "wallet": wallet_address}
        else:
            return JSONResponse(
                status_code=400,
                content={"error": "Profile already exists"}
            )
            
    except Exception as e:
        logger.error(f"❌ Error creating profile: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error"}
        )

@router.put("/update")
async def update_user_profile(updates: dict):
    """Update user profile."""
    try:
        print(f"\n{'='*80}")
        print(f"🔥 PROFILE UPDATE REQUEST RECEIVED")
        print(f"📦 Raw updates keys: {list(updates.keys())}")
        print(f"{'='*80}\n")
        
        profile_db = get_profile_db()
        
        # Use wallet address from updates or default test address
        wallet_address = updates.get("wallet_address", "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0")
        
        # Log avatar_url info
        if "avatar_url" in updates:
            avatar_url = updates.get("avatar_url")
            if avatar_url:
                print(f"📸 avatar_url FOUND: {len(avatar_url)} chars")
                logger.info(f"📸 Updating profile with avatar_url (size: {len(avatar_url)} chars)")
            else:
                print(f"⚠️ avatar_url is EMPTY")
                logger.info("Removing avatar from profile")
        else:
            print(f"❌ avatar_url NOT IN UPDATES")
        
        # Remove wallet_address from updates to avoid updating it
        clean_updates = {k: v for k, v in updates.items() if k != "wallet_address" and v is not None}
        print(f"🧹 clean_updates keys: {list(clean_updates.keys())}")
        print(f"📸 avatar_url in clean_updates: {'avatar_url' in clean_updates}")
        
        logger.info(f"📝 Updating profile for {wallet_address} with fields: {list(clean_updates.keys())}")
        
        success = profile_db.update_profile(wallet_address, clean_updates)
        
        if success:
            logger.info(f"✅ Profile updated successfully for {wallet_address}")
            return {"message": "Profile updated successfully", "wallet": wallet_address}
        else:
            logger.warning(f"⚠️ Failed to update profile for {wallet_address}")
            return JSONResponse(
                status_code=400,
                content={"error": "Failed to update profile"}
            )
            
    except Exception as e:
        logger.error(f"❌ Error updating profile: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error"}
        )

@router.post("/skills/add")
async def add_user_skill(
    skill_data: dict,
    wallet: str = Depends(get_current_wallet)
):
    """Add or update user skill."""
    try:
        profile_db = get_profile_db()
        
        skill = UserSkill(
            wallet_address=wallet,
            skill_name=skill_data["skill_name"],
            skill_level=skill_data.get("skill_level", 0),
            endorsements=skill_data.get("endorsements", 0),
            is_verified=skill_data.get("is_verified", False)
        )
        
        success = profile_db.add_skill(skill)
        
        if success:
            return {"message": "Skill added successfully", "wallet": wallet}
        else:
            return JSONResponse(
                status_code=400,
                content={"error": "Failed to add skill"}
            )
            
    except Exception as e:
        logger.error(f"Error adding skill: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error"}
        )

@router.post("/nfts/add")
async def add_user_nft(
    nft_data: dict,
    wallet: str = Depends(get_current_wallet)
):
    """Add user NFT/achievement."""
    try:
        profile_db = get_profile_db()
        
        nft = UserNFT(
            wallet_address=wallet,
            nft_name=nft_data["nft_name"],
            nft_type=nft_data["nft_type"],
            tier_level=nft_data.get("tier_level"),
            rarity=nft_data.get("rarity"),
            image_file=nft_data.get("image_file"),
            description=nft_data.get("description")
        )
        
        success = profile_db.add_nft(nft)
        
        if success:
            return {"message": "NFT added successfully", "wallet": wallet}
        else:
            return JSONResponse(
                status_code=400,
                content={"error": "Failed to add NFT"}
            )
            
    except Exception as e:
        logger.error(f"Error adding NFT: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error"}
        )

@router.get("/tier/{wallet_address}")
async def get_user_tier(wallet_address: str):
    """Get user tier information."""
    try:
        profile_db = get_profile_db()
        profile = profile_db.get_profile(wallet_address)
        
        if not profile:
            return JSONResponse(
                status_code=404,
                content={"error": "Profile not found"}
            )
        
        return {
            "current_tier": profile.current_tier,
            "tier_progress": profile.tier_progress,
            "total_xp": profile.total_xp,
            "next_tier_xp": (profile.current_tier + 1) * 1000  # Example calculation
        }
        
    except Exception as e:
        logger.error(f"Error getting tier: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error"}
        )
