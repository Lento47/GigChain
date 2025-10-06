"""
Test Suite for W-CSAP Authentication System
============================================

Comprehensive tests for Wallet-Based Cryptographic Session Assertion Protocol.
"""

import pytest
import time
import os
import sys
from unittest.mock import Mock, patch, MagicMock
from web3 import Web3

# Add auth module to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'auth'))

from auth.w_csap import (
    WCSAPAuthenticator,
    ChallengeGenerator,
    SignatureValidator,
    SessionManager,
    Challenge,
    SessionAssertion
)
from auth.database import WCSAPDatabase, get_database


class TestChallengeGenerator:
    """Test challenge generation functionality."""
    
    def setup_method(self):
        """Setup test fixtures."""
        self.generator = ChallengeGenerator(challenge_ttl=300)
        self.test_wallet = "0x1234567890123456789012345678901234567890"
    
    def test_generate_challenge(self):
        """Test basic challenge generation."""
        challenge = self.generator.generate_challenge(self.test_wallet)
        
        assert isinstance(challenge, Challenge)
        assert challenge.wallet_address == Web3.to_checksum_address(self.test_wallet)
        assert len(challenge.challenge_id) == 64  # SHA256 hash
        assert len(challenge.nonce) == 64  # 32 bytes hex
        assert challenge.expires_at > challenge.issued_at
        assert "GigChain.io" in challenge.challenge_message
        assert challenge.wallet_address in challenge.challenge_message
    
    def test_challenge_expiry(self):
        """Test challenge expiry logic."""
        # Create challenge with short TTL
        short_ttl_generator = ChallengeGenerator(challenge_ttl=1)
        challenge = short_ttl_generator.generate_challenge(self.test_wallet)
        
        # Should not be expired immediately
        assert not challenge.is_expired()
        
        # Wait and check expiry
        time.sleep(2)
        assert challenge.is_expired()
    
    def test_challenge_uniqueness(self):
        """Test that challenges are unique."""
        challenge1 = self.generator.generate_challenge(self.test_wallet)
        challenge2 = self.generator.generate_challenge(self.test_wallet)
        
        assert challenge1.challenge_id != challenge2.challenge_id
        assert challenge1.nonce != challenge2.nonce
    
    def test_challenge_with_metadata(self):
        """Test challenge generation with IP and user agent."""
        challenge = self.generator.generate_challenge(
            self.test_wallet,
            ip_address="192.168.1.1",
            user_agent="Mozilla/5.0"
        )
        
        assert challenge.metadata["ip_address"] == "192.168.1.1"
        assert challenge.metadata["user_agent"] == "Mozilla/5.0"
        assert challenge.metadata["app_name"] == "GigChain.io"


class TestSignatureValidator:
    """Test signature validation functionality."""
    
    def setup_method(self):
        """Setup test fixtures."""
        self.validator = SignatureValidator()
        
        # Create a test account for signing
        self.web3 = Web3()
        self.test_account = self.web3.eth.account.create()
        self.test_address = self.test_account.address
    
    def test_valid_signature(self):
        """Test validation of a valid signature."""
        message = "Test message for signing"
        
        # Sign message with test account
        from eth_account.messages import encode_defunct
        encoded_message = encode_defunct(text=message)
        signed_message = self.test_account.sign_message(encoded_message)
        signature = signed_message.signature.hex()
        
        # Verify signature
        is_valid, recovered_address = self.validator.verify_signature(
            message=message,
            signature=signature,
            expected_address=self.test_address
        )
        
        assert is_valid
        assert recovered_address.lower() == self.test_address.lower()
    
    def test_invalid_signature(self):
        """Test validation of an invalid signature."""
        message = "Test message"
        fake_signature = "0x" + "00" * 65  # Invalid signature
        
        is_valid, recovered_address = self.validator.verify_signature(
            message=message,
            signature=fake_signature,
            expected_address=self.test_address
        )
        
        assert not is_valid
    
    def test_wrong_signer(self):
        """Test validation when signature is from wrong wallet."""
        message = "Test message"
        
        # Create two accounts
        account1 = self.web3.eth.account.create()
        account2 = self.web3.eth.account.create()
        
        # Sign with account1
        from eth_account.messages import encode_defunct
        encoded_message = encode_defunct(text=message)
        signed_message = account1.sign_message(encoded_message)
        signature = signed_message.signature.hex()
        
        # Try to verify as account2
        is_valid, _ = self.validator.verify_signature(
            message=message,
            signature=signature,
            expected_address=account2.address
        )
        
        assert not is_valid


class TestSessionManager:
    """Test session management functionality."""
    
    def setup_method(self):
        """Setup test fixtures."""
        self.secret_key = "test_secret_key_for_hmac"
        self.manager = SessionManager(
            secret_key=self.secret_key,
            session_ttl=3600,
            refresh_ttl=86400
        )
        self.test_wallet = Web3.to_checksum_address("0x1234567890123456789012345678901234567890")
    
    def test_create_session_assertion(self):
        """Test session assertion creation."""
        session = self.manager.create_session_assertion(
            wallet_address=self.test_wallet,
            signature="0xtest_signature",
            metadata={"test": "data"}
        )
        
        assert isinstance(session, SessionAssertion)
        assert session.wallet_address == self.test_wallet
        assert len(session.assertion_id) == 64
        assert session.expires_at > session.issued_at
        assert session.session_token is not None
        assert session.refresh_token is not None
        assert "W-CSAP" in session.metadata["protocol"]
    
    def test_session_validation(self):
        """Test session is valid when created."""
        session = self.manager.create_session_assertion(
            wallet_address=self.test_wallet,
            signature="0xtest_signature"
        )
        
        current_time = int(time.time())
        assert session.is_valid(current_time)
    
    def test_validate_session_token(self):
        """Test session token validation."""
        # Create session
        session = self.manager.create_session_assertion(
            wallet_address=self.test_wallet,
            signature="0xtest_signature"
        )
        
        # Validate token
        is_valid, decoded_data = self.manager.validate_session_token(session.session_token)
        
        assert is_valid
        assert decoded_data["wallet_address"] == self.test_wallet
        assert decoded_data["assertion_id"] == session.assertion_id
        assert "expires_in" in decoded_data
    
    def test_validate_expired_token(self):
        """Test validation of expired token."""
        # Create manager with very short TTL
        short_manager = SessionManager(
            secret_key=self.secret_key,
            session_ttl=1
        )
        
        session = short_manager.create_session_assertion(
            wallet_address=self.test_wallet,
            signature="0xtest_signature"
        )
        
        # Wait for expiry
        time.sleep(2)
        
        # Validation should fail
        is_valid, _ = short_manager.validate_session_token(session.session_token)
        assert not is_valid
    
    def test_session_refresh(self):
        """Test session refresh mechanism."""
        # Create original session
        old_session = self.manager.create_session_assertion(
            wallet_address=self.test_wallet,
            signature="0xtest_signature"
        )
        
        # Refresh session
        new_session = self.manager.refresh_session(
            refresh_token=old_session.refresh_token,
            old_session_token=old_session.session_token
        )
        
        assert new_session is not None
        assert new_session.wallet_address == old_session.wallet_address
        assert new_session.assertion_id != old_session.assertion_id
        assert new_session.session_token != old_session.session_token


class TestWCSAPAuthenticator:
    """Test full authentication flow."""
    
    def setup_method(self):
        """Setup test fixtures."""
        self.authenticator = WCSAPAuthenticator(
            secret_key="test_secret_key",
            challenge_ttl=300,
            session_ttl=3600
        )
        
        # Create test account
        self.web3 = Web3()
        self.test_account = self.web3.eth.account.create()
        self.test_address = self.test_account.address
    
    def test_initiate_authentication(self):
        """Test authentication initiation."""
        challenge = self.authenticator.initiate_authentication(
            wallet_address=self.test_address,
            ip_address="127.0.0.1"
        )
        
        assert isinstance(challenge, Challenge)
        assert challenge.wallet_address == Web3.to_checksum_address(self.test_address)
        
        # Challenge should be stored
        assert challenge.challenge_id in self.authenticator.active_challenges
    
    def test_full_authentication_flow(self):
        """Test complete authentication flow from challenge to session."""
        # Step 1: Initiate
        challenge = self.authenticator.initiate_authentication(self.test_address)
        
        # Step 2: Sign challenge
        from eth_account.messages import encode_defunct
        encoded_message = encode_defunct(text=challenge.challenge_message)
        signed_message = self.test_account.sign_message(encoded_message)
        signature = signed_message.signature.hex()
        
        # Step 3: Complete authentication
        session = self.authenticator.complete_authentication(
            challenge_id=challenge.challenge_id,
            signature=signature,
            wallet_address=self.test_address
        )
        
        assert session is not None
        assert isinstance(session, SessionAssertion)
        assert session.wallet_address == Web3.to_checksum_address(self.test_address)
        
        # Challenge should be consumed
        assert challenge.challenge_id not in self.authenticator.active_challenges
        
        # Session should be active
        assert session.assertion_id in self.authenticator.active_sessions
    
    def test_expired_challenge_rejection(self):
        """Test that expired challenges are rejected."""
        # Create authenticator with very short TTL
        short_auth = WCSAPAuthenticator(
            secret_key="test_secret",
            challenge_ttl=1
        )
        
        challenge = short_auth.initiate_authentication(self.test_address)
        
        # Wait for expiry
        time.sleep(2)
        
        # Try to complete authentication
        session = short_auth.complete_authentication(
            challenge_id=challenge.challenge_id,
            signature="0xfake_signature",
            wallet_address=self.test_address
        )
        
        assert session is None
    
    def test_invalid_signature_rejection(self):
        """Test that invalid signatures are rejected."""
        challenge = self.authenticator.initiate_authentication(self.test_address)
        
        # Try to complete with wrong signature
        session = self.authenticator.complete_authentication(
            challenge_id=challenge.challenge_id,
            signature="0x" + "00" * 65,
            wallet_address=self.test_address
        )
        
        assert session is None
    
    def test_logout(self):
        """Test logout functionality."""
        # Create authenticated session
        challenge = self.authenticator.initiate_authentication(self.test_address)
        
        from eth_account.messages import encode_defunct
        encoded_message = encode_defunct(text=challenge.challenge_message)
        signed_message = self.test_account.sign_message(encoded_message)
        signature = signed_message.signature.hex()
        
        session = self.authenticator.complete_authentication(
            challenge_id=challenge.challenge_id,
            signature=signature,
            wallet_address=self.test_address
        )
        
        # Logout
        success = self.authenticator.logout(session.session_token)
        
        assert success
        assert session.assertion_id not in self.authenticator.active_sessions
    
    def test_cleanup_expired(self):
        """Test cleanup of expired challenges and sessions."""
        # Create short-lived authenticator
        short_auth = WCSAPAuthenticator(
            secret_key="test_secret",
            challenge_ttl=1,
            session_ttl=1
        )
        
        # Create challenge and session
        challenge = short_auth.initiate_authentication(self.test_address)
        
        from eth_account.messages import encode_defunct
        encoded_message = encode_defunct(text=challenge.challenge_message)
        signed_message = self.test_account.sign_message(encoded_message)
        signature = signed_message.signature.hex()
        
        session = short_auth.complete_authentication(
            challenge_id=challenge.challenge_id,
            signature=signature,
            wallet_address=self.test_address
        )
        
        # Wait for expiry
        time.sleep(2)
        
        # Cleanup
        short_auth.cleanup_expired()
        
        # Should be cleaned up
        assert len(short_auth.active_challenges) == 0
        assert len(short_auth.active_sessions) == 0


class TestWCSAPDatabase:
    """Test database operations."""
    
    def setup_method(self):
        """Setup test database."""
        self.db = WCSAPDatabase(db_path=":memory:")  # In-memory database for testing
        self.test_wallet = "0x1234567890123456789012345678901234567890"
    
    def test_save_and_get_challenge(self):
        """Test saving and retrieving challenges."""
        challenge_id = "test_challenge_123"
        current_time = int(time.time())
        
        # Save challenge
        success = self.db.save_challenge(
            challenge_id=challenge_id,
            wallet_address=self.test_wallet,
            challenge_message="Test challenge message",
            nonce="test_nonce",
            issued_at=current_time,
            expires_at=current_time + 300,
            ip_address="127.0.0.1"
        )
        
        assert success
        
        # Retrieve challenge
        challenge = self.db.get_challenge(challenge_id)
        
        assert challenge is not None
        assert challenge["challenge_id"] == challenge_id
        assert challenge["wallet_address"] == self.test_wallet
    
    def test_save_and_get_session(self):
        """Test saving and retrieving sessions."""
        assertion_id = "test_assertion_123"
        current_time = int(time.time())
        
        # Save session
        success = self.db.save_session(
            assertion_id=assertion_id,
            wallet_address=self.test_wallet,
            session_token="test_session_token",
            refresh_token="test_refresh_token",
            signature="0xtest_signature",
            issued_at=current_time,
            expires_at=current_time + 3600,
            not_before=current_time,
            ip_address="127.0.0.1"
        )
        
        assert success
        
        # Retrieve session
        session = self.db.get_session_by_token("test_session_token")
        
        assert session is not None
        assert session["assertion_id"] == assertion_id
        assert session["wallet_address"] == self.test_wallet
    
    def test_log_auth_event(self):
        """Test logging authentication events."""
        success = self.db.log_auth_event(
            wallet_address=self.test_wallet,
            event_type="authentication_success",
            success=True,
            challenge_id="test_challenge",
            ip_address="127.0.0.1"
        )
        
        assert success
        
        # Get history
        history = self.db.get_auth_history(wallet_address=self.test_wallet)
        
        assert len(history) > 0
        assert history[0]["event_type"] == "authentication_success"
    
    def test_get_statistics(self):
        """Test getting authentication statistics."""
        stats = self.db.get_statistics()
        
        assert isinstance(stats, dict)
        assert "active_sessions" in stats
        assert "pending_challenges" in stats
        assert "total_users" in stats


def run_tests():
    """Run all tests with pytest."""
    pytest.main([__file__, "-v", "--tb=short"])


if __name__ == "__main__":
    print("=" * 70)
    print("W-CSAP Authentication System Test Suite")
    print("=" * 70)
    print()
    run_tests()
