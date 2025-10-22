"""
GigChain User Profile Management System
========================================

SQLite-based user profile management with W-CSAP authentication integration.
Handles user profiles, skills, NFTs, and tier progression.
"""

import sqlite3
import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

@dataclass
class UserProfile:
    """User profile data structure."""
    wallet_address: str
    username: Optional[str] = None
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    twitter_handle: Optional[str] = None
    github_handle: Optional[str] = None
    linkedin_handle: Optional[str] = None
    is_verified: bool = False
    verification_level: int = 0
    profile_completeness: int = 0
    current_tier: int = 1
    tier_progress: int = 0
    total_xp: int = 0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    last_active: Optional[str] = None
    preferences: Optional[Dict] = None
    settings: Optional[Dict] = None

@dataclass
class UserSkill:
    """User skill data structure."""
    wallet_address: str
    skill_name: str
    skill_level: int = 0
    endorsements: int = 0
    is_verified: bool = False
    created_at: Optional[str] = None

@dataclass
class UserNFT:
    """User NFT/achievement data structure."""
    wallet_address: str
    nft_name: str
    nft_type: str  # 'tier', 'achievement', 'badge'
    tier_level: Optional[int] = None
    rarity: Optional[str] = None
    image_file: Optional[str] = None
    description: Optional[str] = None
    earned_at: Optional[str] = None

class ProfileDatabase:
    """SQLite database manager for user profiles."""
    
    def __init__(self, db_path: str = "data/profiles.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize database with required tables."""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # User profiles table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_profiles (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    wallet_address TEXT UNIQUE NOT NULL,
                    username TEXT UNIQUE,
                    display_name TEXT,
                    bio TEXT,
                    avatar_url TEXT,
                    location TEXT,
                    website TEXT,
                    twitter_handle TEXT,
                    github_handle TEXT,
                    linkedin_handle TEXT,
                    is_verified BOOLEAN DEFAULT FALSE,
                    verification_level INTEGER DEFAULT 0,
                    profile_completeness INTEGER DEFAULT 0,
                    current_tier INTEGER DEFAULT 1,
                    tier_progress INTEGER DEFAULT 0,
                    total_xp INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
                    preferences TEXT,
                    settings TEXT
                )
            """)
            
            # User skills table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_skills (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    wallet_address TEXT NOT NULL,
                    skill_name TEXT NOT NULL,
                    skill_level INTEGER DEFAULT 0,
                    endorsements INTEGER DEFAULT 0,
                    is_verified BOOLEAN DEFAULT FALSE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (wallet_address) REFERENCES user_profiles(wallet_address),
                    UNIQUE(wallet_address, skill_name)
                )
            """)
            
            # User NFTs table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_nfts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    wallet_address TEXT NOT NULL,
                    nft_name TEXT NOT NULL,
                    nft_type TEXT NOT NULL,
                    tier_level INTEGER,
                    rarity TEXT,
                    image_file TEXT,
                    description TEXT,
                    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (wallet_address) REFERENCES user_profiles(wallet_address)
                )
            """)
            
            conn.commit()
            logger.info("Profile database initialized successfully")
    
    def create_profile(self, profile: UserProfile) -> bool:
        """Create a new user profile."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    INSERT INTO user_profiles (
                        wallet_address, username, display_name, bio, avatar_url,
                        location, website, twitter_handle, github_handle, linkedin_handle,
                        is_verified, verification_level, profile_completeness,
                        current_tier, tier_progress, total_xp,
                        preferences, settings
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    profile.wallet_address, profile.username, profile.display_name,
                    profile.bio, profile.avatar_url, profile.location, profile.website,
                    profile.twitter_handle, profile.github_handle, profile.linkedin_handle,
                    profile.is_verified, profile.verification_level, profile.profile_completeness,
                    profile.current_tier, profile.tier_progress, profile.total_xp,
                    json.dumps(profile.preferences) if profile.preferences else None,
                    json.dumps(profile.settings) if profile.settings else None
                ))
                
                conn.commit()
                logger.info(f"Profile created for wallet: {profile.wallet_address}")
                return True
                
        except sqlite3.IntegrityError as e:
            logger.error(f"Profile already exists for wallet: {profile.wallet_address}")
            return False
        except Exception as e:
            logger.error(f"Error creating profile: {e}")
            return False
    
    def get_profile(self, wallet_address: str) -> Optional[UserProfile]:
        """Get user profile by wallet address."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    SELECT * FROM user_profiles WHERE wallet_address = ?
                """, (wallet_address,))
                
                row = cursor.fetchone()
                if not row:
                    return None
                
                # Log avatar_url status
                avatar_url = row[5]
                logger.info(f"🔍 Reading profile from DB - avatar_url: {'Present (' + str(len(avatar_url)) + ' chars)' if avatar_url else 'NULL/Empty'}")
                
                # Convert row to UserProfile
                return UserProfile(
                    wallet_address=row[1],
                    username=row[2],
                    display_name=row[3],
                    bio=row[4],
                    avatar_url=avatar_url,
                    location=row[6],
                    website=row[7],
                    twitter_handle=row[8],
                    github_handle=row[9],
                    linkedin_handle=row[10],
                    is_verified=bool(row[11]),
                    verification_level=row[12],
                    profile_completeness=row[13],
                    current_tier=row[14],
                    tier_progress=row[15],
                    total_xp=row[16],
                    created_at=row[17],
                    updated_at=row[18],
                    last_active=row[19],
                    preferences=json.loads(row[20]) if row[20] else None,
                    settings=json.loads(row[21]) if row[21] else None
                )
                
        except Exception as e:
            logger.error(f"Error getting profile: {e}")
            return None
    
    def update_profile(self, wallet_address: str, updates: Dict[str, Any]) -> bool:
        """Update user profile."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Build update query dynamically
                set_clauses = []
                values = []
                
                logger.info(f"📝 Updating profile fields: {list(updates.keys())}")
                
                for key, value in updates.items():
                    if key == 'avatar_url' and value:
                        logger.info(f"📸 Saving avatar_url: {len(value)} chars")
                    
                    if key in ['preferences', 'settings'] and isinstance(value, dict):
                        set_clauses.append(f"{key} = ?")
                        values.append(json.dumps(value))
                    else:
                        set_clauses.append(f"{key} = ?")
                        values.append(value)
                
                set_clauses.append("updated_at = CURRENT_TIMESTAMP")
                values.append(wallet_address)
                
                query = f"""
                    UPDATE user_profiles 
                    SET {', '.join(set_clauses)}
                    WHERE wallet_address = ?
                """
                
                logger.info(f"🔧 Executing query: UPDATE user_profiles SET {', '.join(set_clauses)[:100]}...")
                cursor.execute(query, values)
                rows_affected = cursor.rowcount
                conn.commit()
                
                logger.info(f"✅ Profile updated for wallet: {wallet_address}, rows affected: {rows_affected}")
                
                # Verify the update
                cursor.execute("SELECT avatar_url FROM user_profiles WHERE wallet_address = ?", (wallet_address,))
                result = cursor.fetchone()
                if result:
                    avatar_in_db = result[0]
                    if avatar_in_db:
                        logger.info(f"✅ Verified: avatar_url saved ({len(avatar_in_db)} chars)")
                    else:
                        logger.warning(f"⚠️ Warning: avatar_url is NULL in database!")
                
                return True
                
        except Exception as e:
            logger.error(f"❌ Error updating profile: {e}")
            return False
    
    def add_skill(self, skill: UserSkill) -> bool:
        """Add or update user skill."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    INSERT OR REPLACE INTO user_skills 
                    (wallet_address, skill_name, skill_level, endorsements, is_verified)
                    VALUES (?, ?, ?, ?, ?)
                """, (
                    skill.wallet_address, skill.skill_name, skill.skill_level,
                    skill.endorsements, skill.is_verified
                ))
                
                conn.commit()
                logger.info(f"Skill added for wallet: {skill.wallet_address}")
                return True
                
        except Exception as e:
            logger.error(f"Error adding skill: {e}")
            return False
    
    def get_skills(self, wallet_address: str) -> List[UserSkill]:
        """Get user skills."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    SELECT * FROM user_skills WHERE wallet_address = ?
                    ORDER BY skill_level DESC, endorsements DESC
                """, (wallet_address,))
                
                rows = cursor.fetchall()
                skills = []
                
                for row in rows:
                    skills.append(UserSkill(
                        wallet_address=row[1],
                        skill_name=row[2],
                        skill_level=row[3],
                        endorsements=row[4],
                        is_verified=bool(row[5]),
                        created_at=row[6]
                    ))
                
                return skills
                
        except Exception as e:
            logger.error(f"Error getting skills: {e}")
            return []
    
    def add_nft(self, nft: UserNFT) -> bool:
        """Add user NFT/achievement."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    INSERT INTO user_nfts 
                    (wallet_address, nft_name, nft_type, tier_level, rarity, 
                     image_file, description)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    nft.wallet_address, nft.nft_name, nft.nft_type,
                    nft.tier_level, nft.rarity, nft.image_file, nft.description
                ))
                
                conn.commit()
                logger.info(f"NFT added for wallet: {nft.wallet_address}")
                return True
                
        except Exception as e:
            logger.error(f"Error adding NFT: {e}")
            return False
    
    def get_nfts(self, wallet_address: str) -> List[UserNFT]:
        """Get user NFTs."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    SELECT * FROM user_nfts WHERE wallet_address = ?
                    ORDER BY earned_at DESC
                """, (wallet_address,))
                
                rows = cursor.fetchall()
                nfts = []
                
                for row in rows:
                    nfts.append(UserNFT(
                        wallet_address=row[1],
                        nft_name=row[2],
                        nft_type=row[3],
                        tier_level=row[4],
                        rarity=row[5],
                        image_file=row[6],
                        description=row[7],
                        earned_at=row[8]
                    ))
                
                return nfts
                
        except Exception as e:
            logger.error(f"Error getting NFTs: {e}")
            return []

# Global database instance
profile_db = ProfileDatabase()

def get_profile_db() -> ProfileDatabase:
    """Get profile database instance."""
    return profile_db
