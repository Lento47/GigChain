"""
Test script for GigChain Internal Wallet System
Tests the wallet creation, retrieval, and transaction functionality
"""

import sys
import os

# Set UTF-8 encoding for Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from wallet_manager import get_wallet_manager, GigChainWallet
from decimal import Decimal

def print_separator():
    print("\n" + "="*60 + "\n")

def test_wallet_creation():
    """Test creating a new wallet"""
    print("🧪 TEST 1: Creating a new wallet")
    print("-" * 60)
    
    wallet_manager = get_wallet_manager()
    test_user_address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    
    try:
        # Try to create a wallet
        wallet = wallet_manager.create_wallet(
            user_address=test_user_address,
            name="Test Wallet GigChain"
        )
        
        if wallet:
            print("✅ Wallet created successfully!")
            print(f"   Wallet ID: {wallet.wallet_id}")
            print(f"   Wallet Address: {wallet.wallet_address}")
            print(f"   User Address: {wallet.user_address}")
            print(f"   Name: {wallet.name}")
            print(f"   Balance: {wallet.balance} {wallet.currency}")
            print(f"   Active: {wallet.is_active}")
            return wallet
        else:
            print("❌ Failed to create wallet")
            return None
    except ValueError as e:
        print(f"⚠️  Wallet already exists: {e}")
        # Try to get existing wallet
        wallet = wallet_manager.get_wallet_by_user(test_user_address)
        if wallet:
            print(f"   Using existing wallet: {wallet.wallet_address}")
            return wallet
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_wallet_retrieval(user_address):
    """Test retrieving a wallet"""
    print_separator()
    print("🧪 TEST 2: Retrieving wallet by user address")
    print("-" * 60)
    
    wallet_manager = get_wallet_manager()
    
    wallet = wallet_manager.get_wallet_by_user(user_address)
    if wallet:
        print("✅ Wallet retrieved successfully!")
        print(f"   Wallet Address: {wallet.wallet_address}")
        print(f"   Name: {wallet.name}")
        print(f"   Balance: {wallet.balance} {wallet.currency}")
        return wallet
    else:
        print("❌ Wallet not found")
        return None

def test_duplicate_prevention(user_address):
    """Test that duplicate wallets cannot be created"""
    print_separator()
    print("🧪 TEST 3: Testing duplicate wallet prevention")
    print("-" * 60)
    
    wallet_manager = get_wallet_manager()
    
    try:
        wallet = wallet_manager.create_wallet(
            user_address=user_address,
            name="Duplicate Test Wallet"
        )
        print("❌ ERROR: Duplicate wallet was created (should have been prevented)")
        return False
    except ValueError as e:
        print(f"✅ Duplicate prevention working: {e}")
        return True
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_wallet_transaction(wallet_address):
    """Test adding transactions to wallet"""
    print_separator()
    print("🧪 TEST 4: Adding transactions to wallet")
    print("-" * 60)
    
    wallet_manager = get_wallet_manager()
    
    # Add some test transactions (using Decimal for precise currency testing)
    transactions = [
        (Decimal('100.00'), "deposit", "Initial deposit"),
        (Decimal('50.00'), "deposit", "Contract payment received"),
        (Decimal('-25.00'), "withdraw", "Service fee"),
    ]
    
    success_count = 0
    for amount, tx_type, description in transactions:
        success = wallet_manager.update_balance(
            wallet_address=wallet_address,
            amount=amount,
            transaction_type=tx_type,
            description=description
        )
        if success:
            print(f"✅ Transaction successful: {amount:+.2f} GIG - {description}")
            success_count += 1
        else:
            print(f"❌ Transaction failed: {amount:+.2f} GIG - {description}")
    
    # Get updated wallet
    wallet = wallet_manager.get_wallet_by_address(wallet_address)
    if wallet:
        print(f"\n💰 Final Balance: {wallet.balance} {wallet.currency}")
    
    return success_count == len(transactions)

def test_transaction_history(wallet_address):
    """Test retrieving transaction history"""
    print_separator()
    print("🧪 TEST 5: Retrieving transaction history")
    print("-" * 60)
    
    wallet_manager = get_wallet_manager()
    
    transactions = wallet_manager.get_transactions(wallet_address, limit=10)
    
    if transactions:
        print(f"✅ Retrieved {len(transactions)} transactions:")
        for tx in transactions:
            print(f"   • {tx['type']:12s} | {tx['amount']:+8.2f} | {tx['description']}")
        return True
    else:
        print("❌ No transactions found")
        return False

def test_wallet_count(user_address):
    """Test counting wallets for a user"""
    print_separator()
    print("🧪 TEST 6: Counting user wallets")
    print("-" * 60)
    
    wallet_manager = get_wallet_manager()
    
    count = wallet_manager.count_user_wallets(user_address)
    print(f"✅ User has {count} active wallet(s)")
    
    return count == 1  # Should have exactly 1 wallet

def test_decimal_precision(wallet_address):
    """Test decimal precision for currency calculations"""
    print_separator()
    print("🧪 TEST 7: Testing decimal precision for currency")
    print("-" * 60)
    
    wallet_manager = get_wallet_manager()
    
    # Test precise decimal calculations that would fail with float
    precision_tests = [
        (Decimal('0.01'), "deposit", "Penny deposit"),
        (Decimal('0.01'), "deposit", "Another penny"),
        (Decimal('0.01'), "deposit", "Third penny"),
    ]
    
    success_count = 0
    for amount, tx_type, description in precision_tests:
        success = wallet_manager.update_balance(
            wallet_address=wallet_address,
            amount=amount,
            transaction_type=tx_type,
            description=description
        )
        if success:
            print(f"✅ Precision test successful: {amount} GIG - {description}")
            success_count += 1
        else:
            print(f"❌ Precision test failed: {amount} GIG - {description}")
    
    # Get final balance and verify precision
    wallet = wallet_manager.get_wallet_by_address(wallet_address)
    if wallet:
        expected_balance = Decimal('125.03')  # 100 + 50 - 25 + 0.01 + 0.01 + 0.01
        if wallet.balance == expected_balance:
            print(f"✅ Decimal precision verified: {wallet.balance} == {expected_balance}")
            return True
        else:
            print(f"❌ Decimal precision failed: {wallet.balance} != {expected_balance}")
            return False
    
    return success_count == len(precision_tests)

def run_all_tests():
    """Run all wallet system tests"""
    print("\n")
    print("🚀 GIGCHAIN WALLET SYSTEM TESTS")
    print("="*60)
    
    test_user_address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    
    # Test 1: Create wallet
    wallet = test_wallet_creation()
    if not wallet:
        print("\n❌ Tests failed: Could not create/retrieve wallet")
        return False
    
    # Test 2: Retrieve wallet
    retrieved_wallet = test_wallet_retrieval(test_user_address)
    if not retrieved_wallet:
        print("\n❌ Tests failed: Could not retrieve wallet")
        return False
    
    # Test 3: Duplicate prevention
    duplicate_prevented = test_duplicate_prevention(test_user_address)
    if not duplicate_prevented:
        print("\n❌ Tests failed: Duplicate prevention not working")
        return False
    
    # Test 4: Transactions
    transactions_successful = test_wallet_transaction(wallet.wallet_address)
    if not transactions_successful:
        print("\n❌ Tests failed: Transactions not working properly")
        return False
    
    # Test 5: Transaction history
    history_retrieved = test_transaction_history(wallet.wallet_address)
    if not history_retrieved:
        print("\n❌ Tests failed: Could not retrieve transaction history")
        return False
    
    # Test 6: Wallet count
    count_correct = test_wallet_count(test_user_address)
    if not count_correct:
        print("\n❌ Tests failed: Wallet count incorrect")
        return False
    
    # Test 7: Decimal precision
    precision_correct = test_decimal_precision(wallet.wallet_address)
    if not precision_correct:
        print("\n❌ Tests failed: Decimal precision not working")
        return False
    
    # All tests passed
    print_separator()
    print("🎉 ALL TESTS PASSED!")
    print("="*60)
    print("\n✅ Wallet system is working correctly!")
    print(f"✅ Test wallet: {wallet.wallet_address}")
    print(f"✅ Test user: {test_user_address}")
    print("\n📝 Note: You can now test the API endpoints with:")
    print(f"   curl http://localhost:5000/api/wallets/me")
    print(f"   (Remember to include authentication token)")
    print("\n")
    
    return True

if __name__ == "__main__":
    try:
        success = run_all_tests()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n💥 Fatal error during tests: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

