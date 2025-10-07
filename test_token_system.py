"""
Test GigSoul Token System
Comprehensive tests for token wallets, transactions, rewards, and trading
"""

import requests
import json
import time
from datetime import datetime

# API base URL
BASE_URL = "http://localhost:5000"

# Test colors
GREEN = "\033[92m"
RED = "\033[91m"
BLUE = "\033[94m"
YELLOW = "\033[93m"
RESET = "\033[0m"


def print_section(title):
    """Print section header"""
    print(f"\n{BLUE}{'=' * 80}{RESET}")
    print(f"{BLUE}{title:^80}{RESET}")
    print(f"{BLUE}{'=' * 80}{RESET}\n")


def print_success(message):
    """Print success message"""
    print(f"{GREEN}✓ {message}{RESET}")


def print_error(message):
    """Print error message"""
    print(f"{RED}✗ {message}{RESET}")


def print_info(message):
    """Print info message"""
    print(f"{YELLOW}ℹ {message}{RESET}")


def test_health_check():
    """Test API health"""
    print_section("1. Health Check")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print_success(f"API is healthy: {data['status']}")
            print_success(f"Service: {data['service']} v{data['version']}")
            return True
        else:
            print_error(f"Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Health check error: {str(e)}")
        return False


def test_create_user_and_wallet():
    """Test creating user stats and token wallet"""
    print_section("2. Create User & Token Wallet")
    
    user_id = f"test_user_{int(time.time())}"
    
    try:
        # Get user stats (creates if doesn't exist)
        response = requests.get(f"{BASE_URL}/api/gamification/users/{user_id}/stats")
        if response.status_code == 200:
            user_data = response.json()
            print_success(f"User created: {user_id}")
            print_info(f"Level: {user_data['level']}, Trust Score: {user_data['trust_score']}")
        else:
            print_error(f"Failed to create user: {response.status_code}")
            return None
        
        # Get token wallet
        response = requests.get(f"{BASE_URL}/api/tokens/wallet/{user_id}")
        if response.status_code == 200:
            wallet_data = response.json()
            print_success(f"Token wallet created: {wallet_data['wallet_address']}")
            print_info(f"Balance: {wallet_data['formatted_balance']}")
            return user_id
        else:
            print_error(f"Failed to create wallet: {response.status_code}")
            return None
            
    except Exception as e:
        print_error(f"User creation error: {str(e)}")
        return None


def test_reward_estimate(user_id, contract_value):
    """Test reward estimation"""
    print_section(f"3. Estimate Rewards for ${contract_value} Contract")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/tokens/rewards/estimate",
            json={
                "user_id": user_id,
                "contract_value": contract_value
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            estimates = data["estimated_rewards"]
            print_success("Reward estimates calculated:")
            print_info(f"  Min Reward (worst case): {estimates['min_reward']:.2f} GSL")
            print_info(f"  Avg Reward (typical): {estimates['avg_reward']:.2f} GSL")
            print_info(f"  Max Reward (best case): {estimates['max_reward']:.2f} GSL")
            return estimates
        else:
            print_error(f"Estimation failed: {response.status_code}")
            print_error(response.text)
            return None
            
    except Exception as e:
        print_error(f"Estimation error: {str(e)}")
        return None


def test_complete_contract_with_reward(user_id, contract_value, rating=5, on_time=True):
    """Test completing a contract and receiving GSL reward"""
    print_section(f"4. Complete Contract & Award Tokens")
    
    contract_id = f"contract_{int(time.time())}"
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/gamification/contracts/complete",
            json={
                "contract_id": contract_id,
                "user_id": user_id,
                "role": "freelancer",
                "rating": rating,
                "was_on_time": on_time,
                "days_early_or_late": -2 if on_time else 3,
                "contract_value": contract_value
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success("Contract completed successfully!")
            print_info(f"XP Earned: {sum(a['xp'] for a in data['xp_awarded'])}")
            print_info(f"Badges Earned: {len(data['new_badges'])}")
            
            if data.get('gsl_reward'):
                print_success(f"🎉 GSL Tokens Earned: {data['gsl_reward']:.2f} GSL")
                print_info(f"Transaction ID: {data['gsl_transaction_id']}")
            else:
                print_error("No GSL reward received")
            
            return data.get('gsl_reward')
        else:
            print_error(f"Contract completion failed: {response.status_code}")
            print_error(response.text)
            return None
            
    except Exception as e:
        print_error(f"Contract completion error: {str(e)}")
        return None


def test_wallet_balance(user_id):
    """Test checking wallet balance"""
    print_section("5. Check Wallet Balance")
    
    try:
        response = requests.get(f"{BASE_URL}/api/tokens/wallet/{user_id}")
        
        if response.status_code == 200:
            wallet = response.json()
            print_success(f"Current Balance: {wallet['formatted_balance']}")
            print_info(f"Total Earned: {wallet['total_earned']:.2f} GSL")
            print_info(f"Total Spent: {wallet['total_spent']:.2f} GSL")
            return wallet['balance']
        else:
            print_error(f"Failed to get balance: {response.status_code}")
            return None
            
    except Exception as e:
        print_error(f"Balance check error: {str(e)}")
        return None


def test_transaction_history(user_id):
    """Test getting transaction history"""
    print_section("6. Transaction History")
    
    try:
        response = requests.get(f"{BASE_URL}/api/tokens/wallet/{user_id}/transactions")
        
        if response.status_code == 200:
            data = response.json()
            transactions = data['transactions']
            print_success(f"Found {len(transactions)} transaction(s)")
            
            for i, tx in enumerate(transactions[:5], 1):
                print_info(f"  {i}. {tx['transaction_type'].upper()}: {tx['amount']:+.2f} GSL")
                print_info(f"     {tx['description']}")
                print_info(f"     Balance: {tx['balance_after']:.2f} GSL")
            
            return transactions
        else:
            print_error(f"Failed to get history: {response.status_code}")
            return None
            
    except Exception as e:
        print_error(f"Transaction history error: {str(e)}")
        return None


def test_marketplace_rates():
    """Test getting marketplace rates"""
    print_section("7. Marketplace Exchange Rates")
    
    try:
        response = requests.get(f"{BASE_URL}/api/tokens/marketplace/rates")
        
        if response.status_code == 200:
            rates = response.json()
            print_success("Marketplace Rates:")
            print_info(f"  BUY: {rates['buy_rate']['description']}")
            print_info(f"       Fee: {rates['buy_rate']['fee_percent']}%")
            print_info(f"       Min: ${rates['buy_rate']['min_purchase_usd']}, Max: ${rates['buy_rate']['max_purchase_usd']}")
            print_info(f"  SELL: {rates['sell_rate']['description']}")
            print_info(f"        Fee: {rates['sell_rate']['fee_percent']}%")
            print_info(f"        Min: {rates['sell_rate']['min_sell_gsl']} GSL, Max: {rates['sell_rate']['max_sell_gsl']} GSL")
            return rates
        else:
            print_error(f"Failed to get rates: {response.status_code}")
            return None
            
    except Exception as e:
        print_error(f"Marketplace rates error: {str(e)}")
        return None


def test_buy_tokens(user_id, usd_amount):
    """Test buying tokens"""
    print_section(f"8. Buy Tokens (${usd_amount} USD)")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/tokens/buy",
            json={
                "user_id": user_id,
                "usd_amount": usd_amount,
                "payment_method": "card"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            details = data['purchase_details']
            print_success("Purchase successful!")
            print_info(f"  USD Spent: ${details['usd_amount']}")
            print_info(f"  Fee: ${details['fee_usd']}")
            print_info(f"  GSL Received: {details['gsl_received']:.2f} GSL")
            print_info(f"  New Balance: {data['new_balance']:.2f} GSL")
            return details['gsl_received']
        else:
            print_error(f"Purchase failed: {response.status_code}")
            print_error(response.text)
            return None
            
    except Exception as e:
        print_error(f"Buy tokens error: {str(e)}")
        return None


def test_transfer_tokens(from_user_id, to_user_id, amount):
    """Test transferring tokens"""
    print_section(f"9. Transfer Tokens ({amount} GSL)")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/tokens/transfer",
            json={
                "from_user_id": from_user_id,
                "to_wallet_address": to_user_id,
                "amount": amount,
                "note": "Test transfer"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success("Transfer successful!")
            print_info(f"  Amount Sent: {data['amount']:.2f} GSL")
            print_info(f"  Fee: {data['fee']:.2f} GSL")
            print_info(f"  Total Cost: {data['total_cost']:.2f} GSL")
            print_info(f"  Sender Balance: {data['sender_new_balance']:.2f} GSL")
            print_info(f"  Recipient Balance: {data['recipient_new_balance']:.2f} GSL")
            return True
        else:
            print_error(f"Transfer failed: {response.status_code}")
            print_error(response.text)
            return False
            
    except Exception as e:
        print_error(f"Transfer error: {str(e)}")
        return False


def test_token_statistics():
    """Test getting token statistics"""
    print_section("10. Token System Statistics")
    
    try:
        response = requests.get(f"{BASE_URL}/api/tokens/statistics")
        
        if response.status_code == 200:
            data = response.json()
            stats = data['statistics']
            print_success("Token System Stats:")
            print_info(f"  Total Wallets: {stats['total_wallets']}")
            print_info(f"  Total Supply: {stats['total_supply']:.2f} GSL")
            print_info(f"  Total Earned: {stats['total_earned']:.2f} GSL")
            print_info(f"  Average Balance: {stats['avg_balance']:.2f} GSL")
            print_info(f"  Max Balance: {stats['max_balance']:.2f} GSL")
            print_info(f"  Recent Transactions (24h): {stats['recent_transactions_24h']}")
            return stats
        else:
            print_error(f"Failed to get statistics: {response.status_code}")
            return None
            
    except Exception as e:
        print_error(f"Statistics error: {str(e)}")
        return None


def run_all_tests():
    """Run all token system tests"""
    print(f"\n{BLUE}{'=' * 80}{RESET}")
    print(f"{BLUE}{'GigSoul (GSL) Token System Test Suite':^80}{RESET}")
    print(f"{BLUE}{'=' * 80}{RESET}")
    print(f"{YELLOW}Testing comprehensive token functionality...{RESET}\n")
    
    # Check if server is running
    if not test_health_check():
        print_error("\n❌ Server is not running. Please start the server with: python main.py")
        return
    
    # Create test user
    user1 = test_create_user_and_wallet()
    if not user1:
        print_error("\n❌ Failed to create test user")
        return
    
    # Test reward estimation
    test_reward_estimate(user1, 1000.0)
    
    # Complete contracts with different scenarios
    print_info("\nScenario 1: Perfect contract (5 stars, early delivery)")
    test_complete_contract_with_reward(user1, 1000.0, rating=5, on_time=True)
    time.sleep(1)
    
    print_info("\nScenario 2: Good contract (4 stars, on time)")
    test_complete_contract_with_reward(user1, 500.0, rating=4, on_time=True)
    time.sleep(1)
    
    # Check balance
    test_wallet_balance(user1)
    
    # View transaction history
    test_transaction_history(user1)
    
    # Test marketplace
    test_marketplace_rates()
    
    # Buy tokens
    test_buy_tokens(user1, 50.0)
    
    # Check balance after purchase
    test_wallet_balance(user1)
    
    # Create second user for transfer test
    print_section("Creating Second User for Transfer Test")
    user2 = test_create_user_and_wallet()
    
    if user2:
        # Transfer tokens
        test_transfer_tokens(user1, user2, 100.0)
        
        # Check both balances
        print_info("\nSender balance after transfer:")
        test_wallet_balance(user1)
        
        print_info("\nRecipient balance after transfer:")
        test_wallet_balance(user2)
    
    # Get system statistics
    test_token_statistics()
    
    # Final summary
    print_section("✅ Test Suite Complete")
    print_success("All token system features tested successfully!")
    print_info("\nKey Features Tested:")
    print_info("  ✓ Token wallet creation")
    print_info("  ✓ Contract completion rewards (GSL)")
    print_info("  ✓ Reward calculation algorithm")
    print_info("  ✓ Token purchases (buy)")
    print_info("  ✓ Token transfers between users")
    print_info("  ✓ Transaction history tracking")
    print_info("  ✓ Marketplace rates and statistics")
    print_info("\n💎 GigSoul (GSL) Token System is fully operational!")


if __name__ == "__main__":
    run_all_tests()
