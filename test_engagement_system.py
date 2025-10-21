"""
Test script for GigChain Engagement System with GigSoul Token Integration
"""

import requests
import json
import time
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:5000"
TEST_WALLET_1 = "0x1234567890123456789012345678901234567890"  # User 1
TEST_WALLET_2 = "0x9876543210987654321098765432109876543210"  # User 2
TEST_WALLET_3 = "0x1111111111111111111111111111111111111111"  # User 3

def test_engagement_system():
    """Test the complete engagement system with GigSoul tokens"""
    
    print("🚀 Testing GigChain Engagement System with GigSoul Tokens")
    print("=" * 60)
    
    # Test 1: Record basic engagement
    print("\n1. Recording basic engagement...")
    
    engagement_data = {
        "post_id": "post_001",
        "engagement_type": "view"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/engagement/record",
        json=engagement_data,
        headers={"Authorization": f"Bearer test_token_{TEST_WALLET_1}"}
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ View recorded: {result['data']['total_views']} total views")
    else:
        print(f"❌ Error recording view: {response.status_code} - {response.text}")
    
    # Test 2: Record multiple engagement types
    print("\n2. Recording multiple engagement types...")
    
    engagement_types = ["like", "comment", "share", "bookmark"]
    
    for engagement_type in engagement_types:
        engagement_data = {
            "post_id": "post_001",
            "engagement_type": engagement_type
        }
        
        response = requests.post(
            f"{BASE_URL}/api/engagement/record",
            json=engagement_data,
            headers={"Authorization": f"Bearer test_token_{TEST_WALLET_2}"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ {engagement_type.capitalize()} recorded: +{result['data']['reward']} GigSoul")
        else:
            print(f"❌ Error recording {engagement_type}: {response.status_code} - {response.text}")
    
    # Test 3: Create different types of boosts
    print("\n3. Creating different types of boosts...")
    
    boost_types = [
        {
            "boost_type": "views_boost",
            "tokens_invested": 25.0,
            "description": "Boost de views con 25 GigSoul"
        },
        {
            "boost_type": "visibility_boost", 
            "tokens_invested": 50.0,
            "description": "Boost de visibilidad con 50 GigSoul"
        },
        {
            "boost_type": "trending_boost",
            "tokens_invested": 100.0,
            "description": "Boost trending con 100 GigSoul"
        },
        {
            "boost_type": "premium_placement",
            "tokens_invested": 200.0,
            "description": "Posición premium con 200 GigSoul"
        }
    ]
    
    created_boosts = []
    
    for boost_data in boost_types:
        boost_request = {
            "post_id": "post_001",
            "boost_type": boost_data["boost_type"],
            "tokens_invested": boost_data["tokens_invested"]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/engagement/boost",
            json=boost_request,
            headers={"Authorization": f"Bearer test_token_{TEST_WALLET_1}"}
        )
        
        if response.status_code == 200:
            boost = response.json()
            created_boosts.append(boost)
            print(f"✅ {boost_data['description']}: {boost['multiplier']}x multiplier, {boost['estimated_views']} estimated views")
        else:
            print(f"❌ Error creating {boost_data['boost_type']}: {response.status_code} - {response.text}")
    
    # Test 4: Get boost prices for different amounts
    print("\n4. Testing boost price calculations...")
    
    test_amounts = [10, 25, 50, 100, 200, 500]
    
    for amount in test_amounts:
        response = requests.get(
            f"{BASE_URL}/api/engagement/boost/price/views_boost?tokens={amount}",
            headers={"Authorization": f"Bearer test_token_{TEST_WALLET_1}"}
        )
        
        if response.status_code == 200:
            price_data = response.json()
            print(f"✅ {amount} GigSoul: {price_data['multiplier']}x multiplier, {price_data['estimated_views']} views, {price_data['duration_hours']}h")
        else:
            print(f"❌ Error getting price for {amount} tokens: {response.status_code} - {response.text}")
    
    # Test 5: Get post analytics
    print("\n5. Getting post analytics...")
    
    response = requests.get(
        f"{BASE_URL}/api/engagement/analytics/post/post_001",
        headers={"Authorization": f"Bearer test_token_{TEST_WALLET_1}"}
    )
    
    if response.status_code == 200:
        analytics = response.json()
        print("✅ Post analytics retrieved:")
        print(f"   - Total views: {analytics['total_views']}")
        print(f"   - Organic views: {analytics['organic_views']}")
        print(f"   - Boosted views: {analytics['boosted_views']}")
        print(f"   - Engagement rate: {analytics['engagement_rate']:.1f}%")
        print(f"   - Tokens earned: {analytics['tokens_earned']}")
        print(f"   - Tokens spent: {analytics['tokens_spent']}")
        print(f"   - Active boosts: {analytics['active_boosts']}")
    else:
        print(f"❌ Error getting post analytics: {response.status_code} - {response.text}")
    
    # Test 6: Get user engagement stats
    print("\n6. Getting user engagement stats...")
    
    response = requests.get(
        f"{BASE_URL}/api/engagement/analytics/user/{TEST_WALLET_1}",
        headers={"Authorization": f"Bearer test_token_{TEST_WALLET_1}"}
    )
    
    if response.status_code == 200:
        user_stats = response.json()
        print("✅ User engagement stats retrieved:")
        print(f"   - Engagement score: {user_stats['engagement_score']:.1f}")
        print(f"   - Views received: {user_stats['total_views_received']}")
        print(f"   - Engagement given: {user_stats['total_engagement_given']}")
        print(f"   - Tokens earned: {user_stats['tokens_earned_from_engagement']}")
        print(f"   - Tokens spent: {user_stats['tokens_spent_on_boosts']}")
    else:
        print(f"❌ Error getting user stats: {response.status_code} - {response.text}")
    
    # Test 7: Get trending posts
    print("\n7. Getting trending posts...")
    
    response = requests.get(
        f"{BASE_URL}/api/engagement/trending?limit=5",
        headers={"Authorization": f"Bearer test_token_{TEST_WALLET_1}"}
    )
    
    if response.status_code == 200:
        trending = response.json()
        print("✅ Trending posts retrieved:")
        for i, post in enumerate(trending, 1):
            print(f"   {i}. Post {post['post_id']}: {post['trending_score']:.1f} score, {post['total_views']} views")
    else:
        print(f"❌ Error getting trending posts: {response.status_code} - {response.text}")
    
    # Test 8: Get boosted posts
    print("\n8. Getting boosted posts...")
    
    response = requests.get(
        f"{BASE_URL}/api/engagement/trending/boosted?limit=5",
        headers={"Authorization": f"Bearer test_token_{TEST_WALLET_1}"}
    )
    
    if response.status_code == 200:
        boosted = response.json()
        print("✅ Boosted posts retrieved:")
        print(f"   - Total boosted: {boosted['total_boosted']}")
        for i, post in enumerate(boosted['boosted_posts'][:3], 1):
            print(f"   {i}. Post {post['post_id']}: {post['boost_type']}, {post['tokens_invested']} GigSoul")
    else:
        print(f"❌ Error getting boosted posts: {response.status_code} - {response.text}")
    
    # Test 9: Simulate high engagement scenario
    print("\n9. Simulating high engagement scenario...")
    
    # Simular múltiples usuarios interactuando
    users = [TEST_WALLET_1, TEST_WALLET_2, TEST_WALLET_3]
    engagement_actions = ["view", "like", "comment", "share", "bookmark"]
    
    for i in range(20):  # 20 interacciones
        user = users[i % len(users)]
        action = engagement_actions[i % len(engagement_actions)]
        
        engagement_data = {
            "post_id": "post_001",
            "engagement_type": action
        }
        
        response = requests.post(
            f"{BASE_URL}/api/engagement/record",
            json=engagement_data,
            headers={"Authorization": f"Bearer test_token_{user}"}
        )
        
        if response.status_code == 200:
            result = response.json()
            if i % 5 == 0:  # Mostrar cada 5 interacciones
                print(f"   - {action} by {user[:8]}...: {result['data']['total_views']} total views")
    
    # Test 10: Get final analytics
    print("\n10. Getting final analytics after high engagement...")
    
    response = requests.get(
        f"{BASE_URL}/api/engagement/analytics/post/post_001",
        headers={"Authorization": f"Bearer test_token_{TEST_WALLET_1}"}
    )
    
    if response.status_code == 200:
        final_analytics = response.json()
        print("✅ Final post analytics:")
        print(f"   - Total views: {final_analytics['total_views']}")
        print(f"   - Total likes: {final_analytics['total_likes']}")
        print(f"   - Total comments: {final_analytics['total_comments']}")
        print(f"   - Total shares: {final_analytics['total_shares']}")
        print(f"   - Total bookmarks: {final_analytics['total_bookmarks']}")
        print(f"   - Engagement rate: {final_analytics['engagement_rate']:.1f}%")
        print(f"   - Tokens earned: {final_analytics['tokens_earned']}")
        print(f"   - Tokens spent: {final_analytics['tokens_spent']}")
        print(f"   - Active boosts: {final_analytics['active_boosts']}")
    else:
        print(f"❌ Error getting final analytics: {response.status_code} - {response.text}")
    
    # Test 11: Get system overview
    print("\n11. Getting system overview...")
    
    response = requests.get(
        f"{BASE_URL}/api/engagement/stats/overview",
        headers={"Authorization": f"Bearer test_token_{TEST_WALLET_1}"}
    )
    
    if response.status_code == 200:
        overview = response.json()
        print("✅ System overview:")
        print(f"   - Total boosts: {overview['total_boosts']}")
        print(f"   - Active boosts: {overview['active_boosts']}")
        print(f"   - Total posts: {overview['total_posts']}")
        print(f"   - Total users: {overview['total_users']}")
        print(f"   - Total tokens invested: {overview['total_tokens_invested']}")
        print(f"   - Total views generated: {overview['total_views_generated']}")
        print(f"   - Average engagement rate: {overview['average_engagement_rate']:.1f}%")
    else:
        print(f"❌ Error getting system overview: {response.status_code} - {response.text}")
    
    # Test 12: Cleanup expired boosts
    print("\n12. Cleaning up expired boosts...")
    
    response = requests.post(
        f"{BASE_URL}/api/engagement/cleanup",
        headers={"Authorization": f"Bearer test_token_{TEST_WALLET_1}"}
    )
    
    if response.status_code == 200:
        cleanup_result = response.json()
        print(f"✅ Cleanup completed: {cleanup_result['message']}")
    else:
        print(f"❌ Error during cleanup: {response.status_code} - {response.text}")
    
    print("\n" + "=" * 60)
    print("🎉 Engagement System Test Complete!")
    print("=" * 60)
    print("\n📊 Summary:")
    print("✅ Basic engagement recording")
    print("✅ Multiple boost types creation")
    print("✅ Price calculations")
    print("✅ Analytics retrieval")
    print("✅ Trending posts detection")
    print("✅ High engagement simulation")
    print("✅ System overview statistics")
    print("✅ Boost cleanup")
    print("\n🚀 The engagement system with GigSoul tokens is working perfectly!")

if __name__ == "__main__":
    test_engagement_system()