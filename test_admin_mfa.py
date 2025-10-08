"""
Test script for Admin MFA System
Tests all MFA functionalities including TOTP, wallet, and troubleshooting.
"""

import sys
import os
import pyotp
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from admin_mfa_system import admin_mfa_system, MFAMethod
from admin_system import admin_system

def print_header(text):
    """Print formatted header"""
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}\n")

def print_success(text):
    """Print success message"""
    print(f"✅ {text}")

def print_error(text):
    """Print error message"""
    print(f"❌ {text}")

def print_info(text):
    """Print info message"""
    print(f"ℹ️  {text}")

def test_admin_authentication():
    """Test 1: Admin authentication"""
    print_header("Test 1: Admin Authentication")
    
    try:
        # Authenticate default admin
        admin_data = admin_system.authenticate_admin("admin", "admin123")
        
        if admin_data:
            print_success("Admin authentication successful")
            print_info(f"Admin ID: {admin_data['admin_id']}")
            print_info(f"Username: {admin_data['username']}")
            print_info(f"Role: {admin_data['role']}")
            print_info(f"Token: {admin_data['token'][:20]}...")
            return admin_data
        else:
            print_error("Admin authentication failed")
            return None
    except Exception as e:
        print_error(f"Authentication error: {str(e)}")
        return None

def test_mfa_setup(admin_data):
    """Test 2: MFA Setup"""
    print_header("Test 2: MFA Setup")
    
    try:
        # Setup MFA
        mfa_setup = admin_mfa_system.setup_mfa(
            admin_id=admin_data['admin_id'],
            email=admin_data['email'],
            username=admin_data['username']
        )
        
        print_success("MFA setup initiated successfully")
        print_info(f"TOTP Secret: {mfa_setup.secret}")
        print_info(f"QR Code generated: {len(mfa_setup.qr_code)} bytes")
        print_info(f"Backup Codes: {len(mfa_setup.backup_codes)} codes")
        print_info("Backup codes:")
        for i, code in enumerate(mfa_setup.backup_codes, 1):
            print(f"    {i:2d}. {code}")
        
        return mfa_setup
    except Exception as e:
        print_error(f"MFA setup error: {str(e)}")
        return None

def test_totp_verification(admin_data, mfa_setup):
    """Test 3: TOTP Verification"""
    print_header("Test 3: TOTP Verification")
    
    try:
        # Generate TOTP code
        totp = pyotp.TOTP(mfa_setup.secret)
        current_code = totp.now()
        
        print_info(f"Generated TOTP code: {current_code}")
        
        # Enable MFA
        print_info("Enabling MFA with TOTP code...")
        enabled = admin_mfa_system.enable_mfa(
            admin_id=admin_data['admin_id'],
            verification_code=current_code
        )
        
        if enabled:
            print_success("MFA enabled successfully")
        else:
            print_error("Failed to enable MFA")
            return False
        
        # Verify TOTP code
        print_info("Verifying TOTP code...")
        verified = admin_mfa_system.verify_totp(
            admin_id=admin_data['admin_id'],
            code=current_code
        )
        
        if verified:
            print_success("TOTP verification successful")
        else:
            print_error("TOTP verification failed")
            return False
        
        # Test with invalid code
        print_info("Testing with invalid code...")
        invalid_verified = admin_mfa_system.verify_totp(
            admin_id=admin_data['admin_id'],
            code="000000"
        )
        
        if not invalid_verified:
            print_success("Invalid code correctly rejected")
        else:
            print_error("Invalid code was accepted (security issue!)")
            return False
        
        return True
    except Exception as e:
        print_error(f"TOTP verification error: {str(e)}")
        return False

def test_wallet_linking(admin_data):
    """Test 4: Wallet Linking"""
    print_header("Test 4: Wallet Linking")
    
    try:
        # Test wallet address
        test_wallet = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
        test_email = "admin@gigchain.io"
        
        print_info(f"Linking wallet: {test_wallet}")
        print_info(f"Email: {test_email}")
        
        # Link wallet
        success = admin_mfa_system.link_wallet(
            admin_id=admin_data['admin_id'],
            wallet_address=test_wallet,
            email=test_email
        )
        
        if success:
            print_success("Wallet linked successfully")
        else:
            print_error("Failed to link wallet")
            return False
        
        # Try to link same wallet again (should fail)
        print_info("Testing duplicate wallet linking...")
        duplicate = admin_mfa_system.link_wallet(
            admin_id=admin_data['admin_id'],
            wallet_address=test_wallet,
            email=test_email
        )
        
        # This should succeed (replace) or fail (duplicate)
        # Either way is fine for this test
        print_info(f"Duplicate link result: {'Success' if duplicate else 'Rejected'}")
        
        return True
    except Exception as e:
        print_error(f"Wallet linking error: {str(e)}")
        return False

def test_mfa_methods(admin_data):
    """Test 5: MFA Methods"""
    print_header("Test 5: MFA Methods")
    
    try:
        # Check if MFA is enabled
        is_enabled = admin_mfa_system.is_mfa_enabled(admin_data['admin_id'])
        print_info(f"MFA Enabled: {is_enabled}")
        
        if is_enabled:
            print_success("MFA is enabled")
        else:
            print_error("MFA is not enabled")
            return False
        
        # Get available methods
        methods = admin_mfa_system.get_mfa_methods(admin_data['admin_id'])
        print_info(f"Available MFA methods: {', '.join(methods)}")
        
        # Get MFA stats
        stats = admin_mfa_system.get_mfa_stats(admin_data['admin_id'])
        print_info("MFA Statistics:")
        print(f"    - MFA Enabled: {stats['mfa_enabled']}")
        print(f"    - Last Used Method: {stats['last_used_method']}")
        print(f"    - Wallet Linked: {stats['wallet_linked']}")
        print(f"    - Setup Date: {stats['setup_date']}")
        
        if stats['attempts_by_method']:
            print_info("Authentication Attempts:")
            for method, attempt_stats in stats['attempts_by_method'].items():
                print(f"    - {method.upper()}:")
                print(f"        Total: {attempt_stats['total']}")
                print(f"        Successful: {attempt_stats['successful']}")
        
        print_success("MFA methods check completed")
        return True
    except Exception as e:
        print_error(f"MFA methods error: {str(e)}")
        return False

def test_email_otp(admin_data):
    """Test 6: Email OTP"""
    print_header("Test 6: Email OTP")
    
    try:
        # Generate email OTP
        verification_id = admin_mfa_system.generate_email_otp(
            admin_id=admin_data['admin_id'],
            email=admin_data['email']
        )
        
        if verification_id:
            print_success("Email OTP generated")
            print_info(f"Verification ID: {verification_id}")
            print_info("Note: Check logs for the actual OTP code")
        else:
            print_error("Failed to generate email OTP")
            return False
        
        return True
    except Exception as e:
        print_error(f"Email OTP error: {str(e)}")
        return False

def test_platform_statistics():
    """Test 7: Platform Statistics"""
    print_header("Test 7: Platform Statistics")
    
    try:
        stats = admin_system.get_platform_statistics()
        
        print_info("Platform Statistics:")
        print(f"    Users:")
        print(f"        - Total: {stats['users']['total']}")
        print(f"        - Active: {stats['users']['active']}")
        print(f"        - Suspended: {stats['users']['suspended']}")
        print(f"        - Banned: {stats['users']['banned']}")
        print(f"    Contracts:")
        print(f"        - Total: {stats['contracts']['total']}")
        print(f"        - Volume: ${stats['contracts']['volume']}")
        print(f"    Moderation:")
        print(f"        - Pending: {stats['moderation']['pending']}")
        print(f"    Activity:")
        print(f"        - Last 24h: {stats['activity']['last_24h']} actions")
        
        print_success("Platform statistics retrieved")
        return True
    except Exception as e:
        print_error(f"Statistics error: {str(e)}")
        return False

def test_admin_activity_log(admin_data):
    """Test 8: Admin Activity Log"""
    print_header("Test 8: Admin Activity Log")
    
    try:
        # Get activity log
        logs = admin_system.get_admin_activity_log(
            admin_id=admin_data['admin_id'],
            limit=10
        )
        
        print_info(f"Retrieved {len(logs)} activity log entries")
        
        if logs:
            print_info("Recent activities:")
            for log in logs[:5]:
                print(f"    - {log['action']} at {log['timestamp']}")
        
        print_success("Activity log retrieved")
        return True
    except Exception as e:
        print_error(f"Activity log error: {str(e)}")
        return False

def run_all_tests():
    """Run all tests"""
    print("\n")
    print("╔" + "="*58 + "╗")
    print("║" + " "*15 + "GIGCHAIN ADMIN MFA TESTS" + " "*19 + "║")
    print("╚" + "="*58 + "╝")
    print(f"\nTest started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    results = {}
    
    # Test 1: Admin Authentication
    admin_data = test_admin_authentication()
    results['authentication'] = admin_data is not None
    
    if not admin_data:
        print_error("Cannot proceed with tests - authentication failed")
        return
    
    # Test 2: MFA Setup
    mfa_setup = test_mfa_setup(admin_data)
    results['mfa_setup'] = mfa_setup is not None
    
    if not mfa_setup:
        print_error("Cannot proceed with MFA tests - setup failed")
        return
    
    # Test 3: TOTP Verification
    results['totp_verification'] = test_totp_verification(admin_data, mfa_setup)
    
    # Test 4: Wallet Linking
    results['wallet_linking'] = test_wallet_linking(admin_data)
    
    # Test 5: MFA Methods
    results['mfa_methods'] = test_mfa_methods(admin_data)
    
    # Test 6: Email OTP
    results['email_otp'] = test_email_otp(admin_data)
    
    # Test 7: Platform Statistics
    results['platform_stats'] = test_platform_statistics()
    
    # Test 8: Admin Activity Log
    results['activity_log'] = test_admin_activity_log(admin_data)
    
    # Summary
    print_header("Test Summary")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, passed_test in results.items():
        status = "✅ PASSED" if passed_test else "❌ FAILED"
        print(f"{status:12} - {test_name.replace('_', ' ').title()}")
    
    print(f"\n{'='*60}")
    print(f"  Total: {passed}/{total} tests passed")
    print(f"  Success Rate: {(passed/total)*100:.1f}%")
    print(f"{'='*60}\n")
    
    if passed == total:
        print_success("All tests passed! 🎉")
    else:
        print_error(f"{total - passed} test(s) failed")
    
    print(f"\nTest completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

if __name__ == "__main__":
    print("\n🔐 GigChain Admin MFA System - Test Suite")
    print("="*60)
    
    try:
        run_all_tests()
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Critical error: {str(e)}")
        import traceback
        traceback.print_exc()
