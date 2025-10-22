#!/usr/bin/env python3
"""
Test script for GigChain Profile Management System
=================================================

Tests the profile API endpoints and database functionality.
Run this after starting the backend server.
"""

import requests
import json
import time
from datetime import datetime

# Configuration
API_BASE = "http://localhost:5000/api"
TEST_WALLET = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"

def test_profile_endpoints():
    """Test all profile management endpoints."""
    
    print("🧪 Testing GigChain Profile Management System")
    print("=" * 50)
    
    # Test 1: Get non-existent profile (should return 404)
    print("\n1️⃣ Testing GET non-existent profile...")
    try:
        response = requests.get(f"{API_BASE}/profile/{TEST_WALLET}")
        if response.status_code == 404:
            print("✅ Profile not found (expected)")
        else:
            print(f"❌ Unexpected response: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: Create new profile
    print("\n2️⃣ Testing profile creation...")
    profile_data = {
        "display_name": "Test Web3 Developer",
        "bio": "Experienced blockchain developer specializing in DeFi protocols",
        "location": "Remote",
        "website": "https://test-dev.com",
        "twitter_handle": "@testdev",
        "github_handle": "testdev",
        "linkedin_handle": "testdev",
        "preferences": {
            "theme": "dark",
            "language": "es",
            "notifications": True
        },
        "settings": {
            "privacy_level": "public",
            "show_earnings": True,
            "show_skills": True
        }
    }
    
    try:
        response = requests.post(f"{API_BASE}/profile/create", json=profile_data)
        if response.status_code == 200:
            print("✅ Profile created successfully")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Profile creation failed: {response.status_code}")
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 3: Get created profile
    print("\n3️⃣ Testing profile retrieval...")
    try:
        response = requests.get(f"{API_BASE}/profile/{TEST_WALLET}")
        if response.status_code == 200:
            data = response.json()
            print("✅ Profile retrieved successfully")
            print(f"   Name: {data['profile']['display_name']}")
            print(f"   Bio: {data['profile']['bio'][:50]}...")
            print(f"   Location: {data['profile']['location']}")
        else:
            print(f"❌ Profile retrieval failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 4: Update profile
    print("\n4️⃣ Testing profile update...")
    update_data = {
        "bio": "Updated bio - Senior blockchain developer with 5+ years experience",
        "location": "San Francisco, CA",
        "website": "https://updated-dev.com"
    }
    
    try:
        response = requests.put(f"{API_BASE}/profile/update", json=update_data)
        if response.status_code == 200:
            print("✅ Profile updated successfully")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Profile update failed: {response.status_code}")
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 5: Add skills
    print("\n5️⃣ Testing skill addition...")
    skills = [
        {"skill_name": "Solidity", "skill_level": 95, "endorsements": 45},
        {"skill_name": "Web3", "skill_level": 90, "endorsements": 38},
        {"skill_name": "DeFi", "skill_level": 85, "endorsements": 32},
        {"skill_name": "React", "skill_level": 88, "endorsements": 28}
    ]
    
    for skill in skills:
        try:
            response = requests.post(f"{API_BASE}/profile/skills/add", json=skill)
            if response.status_code == 200:
                print(f"✅ Skill '{skill['skill_name']}' added successfully")
            else:
                print(f"❌ Skill addition failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Error adding skill {skill['skill_name']}: {e}")
    
    # Test 6: Add NFTs
    print("\n6️⃣ Testing NFT addition...")
    nfts = [
        {
            "nft_name": "Gold Tier Reputation",
            "nft_type": "tier",
            "tier_level": 3,
            "rarity": "Advanced",
            "image_file": "tier-3-gold.png",
            "description": "Established expert level"
        },
        {
            "nft_name": "Smart Contract Expert",
            "nft_type": "achievement",
            "rarity": "Epic",
            "image_file": "expert-badge.png",
            "description": "Completed 50+ smart contracts"
        }
    ]
    
    for nft in nfts:
        try:
            response = requests.post(f"{API_BASE}/profile/nfts/add", json=nft)
            if response.status_code == 200:
                print(f"✅ NFT '{nft['nft_name']}' added successfully")
            else:
                print(f"❌ NFT addition failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Error adding NFT {nft['nft_name']}: {e}")
    
    # Test 7: Get tier information
    print("\n7️⃣ Testing tier information...")
    try:
        response = requests.get(f"{API_BASE}/profile/tier/{TEST_WALLET}")
        if response.status_code == 200:
            data = response.json()
            print("✅ Tier information retrieved successfully")
            print(f"   Current Tier: {data['current_tier']}")
            print(f"   Tier Progress: {data['tier_progress']}")
            print(f"   Total XP: {data['total_xp']}")
        else:
            print(f"❌ Tier retrieval failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 8: Final profile check
    print("\n8️⃣ Final profile verification...")
    try:
        response = requests.get(f"{API_BASE}/profile/{TEST_WALLET}")
        if response.status_code == 200:
            data = response.json()
            print("✅ Final profile verification successful")
            print(f"   Profile: {data['profile']['display_name']}")
            print(f"   Skills: {len(data['skills'])} skills")
            print(f"   NFTs: {len(data['nfts'])} NFTs")
            print(f"   Bio: {data['profile']['bio'][:100]}...")
        else:
            print(f"❌ Final verification failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Profile management system test completed!")
    print("\nNext steps:")
    print("1. Check the frontend at http://localhost:5173/profile")
    print("2. Test the profile edit form")
    print("3. Verify data persistence across browser refreshes")

if __name__ == "__main__":
    print("Starting profile system test...")
    print("Make sure the backend server is running on http://localhost:5000")
    
    # Wait a moment for user to read
    time.sleep(2)
    
    test_profile_endpoints()
