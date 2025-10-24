#!/usr/bin/env python3
"""
W-CSAP Authentication Security Tests
===================================

Tests for fail-closed authentication behavior and security features.
"""

import pytest
import json
import time
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

# Set test environment
import os
os.environ['OPENAI_API_KEY'] = 'sk-test-key-for-ci'
os.environ['SECRET_KEY'] = 'test-secret-key-for-ci-testing-32chars'
os.environ['W_CSAP_SECRET_KEY'] = 'test-secret-key-for-ci-testing-32chars'

from main import app
from auth.w_csap import WCSAPAuthenticator, SignatureValidator
from auth.proof_of_work import ProofOfWork


@pytest.fixture
def client():
    """Create a test client"""
    return TestClient(app)


@pytest.fixture
def authenticator():
    """Create WCSAP authenticator for testing"""
    return WCSAPAuthenticator(secret_key="test-secret-key-for-ci-testing-32chars")


@pytest.fixture
def signature_validator():
    """Create signature validator for testing"""
    return SignatureValidator()


@pytest.fixture
def pow_system():
    """Create proof-of-work system for testing"""
    return ProofOfWork(base_difficulty=2, max_difficulty=4)


class TestFailClosedBehavior:
    """Test that authentication fails closed on all exceptions and invalid states."""
    
    def test_verify_signature_fail_closed_invalid_message(self, signature_validator):
        """Test signature verification fails closed on invalid message"""
        # Test with None message
        is_valid, recovered = signature_validator.verify_signature(
            message=None,
            signature="0x1234567890abcdef",
            expected_address="0x1234567890123456789012345678901234567890"
        )
        assert is_valid is False
        assert recovered is None
        
        # Test with empty message
        is_valid, recovered = signature_validator.verify_signature(
            message="",
            signature="0x1234567890abcdef",
            expected_address="0x1234567890123456789012345678901234567890"
        )
        assert is_valid is False
        assert recovered is None
        
        # Test with non-string message
        is_valid, recovered = signature_validator.verify_signature(
            message=12345,
            signature="0x1234567890abcdef",
            expected_address="0x1234567890123456789012345678901234567890"
        )
        assert is_valid is False
        assert recovered is None
    
    def test_verify_signature_fail_closed_invalid_signature(self, signature_validator):
        """Test signature verification fails closed on invalid signature"""
        # Test with None signature
        is_valid, recovered = signature_validator.verify_signature(
            message="test message",
            signature=None,
            expected_address="0x1234567890123456789012345678901234567890"
        )
        assert is_valid is False
        assert recovered is None
        
        # Test with empty signature
        is_valid, recovered = signature_validator.verify_signature(
            message="test message",
            signature="",
            expected_address="0x1234567890123456789012345678901234567890"
        )
        assert is_valid is False
        assert recovered is None
        
        # Test with invalid signature format
        is_valid, recovered = signature_validator.verify_signature(
            message="test message",
            signature="invalid_signature",
            expected_address="0x1234567890123456789012345678901234567890"
        )
        assert is_valid is False
        assert recovered is None
    
    def test_verify_signature_fail_closed_invalid_address(self, signature_validator):
        """Test signature verification fails closed on invalid address"""
        # Test with None address
        is_valid, recovered = signature_validator.verify_signature(
            message="test message",
            signature="0x1234567890abcdef",
            expected_address=None
        )
        assert is_valid is False
        assert recovered is None
        
        # Test with empty address
        is_valid, recovered = signature_validator.verify_signature(
            message="test message",
            signature="0x1234567890abcdef",
            expected_address=""
        )
        assert is_valid is False
        assert recovered is None
        
        # Test with invalid address format
        is_valid, recovered = signature_validator.verify_signature(
            message="test message",
            signature="0x1234567890abcdef",
            expected_address="invalid_address"
        )
        assert is_valid is False
        assert recovered is None
    
    def test_verify_signature_fail_closed_exception_handling(self, signature_validator):
        """Test signature verification fails closed on any exception"""
        # Test with malformed signature that causes exception
        is_valid, recovered = signature_validator.verify_signature(
            message="test message",
            signature="0x",  # Too short
            expected_address="0x1234567890123456789012345678901234567890"
        )
        assert is_valid is False
        assert recovered is None
    
    def test_validate_session_token_fail_closed_invalid_format(self, authenticator):
        """Test session validation fails closed on invalid token format"""
        # Test with None token
        is_valid, data = authenticator.session_manager.validate_session_token(None)
        assert is_valid is False
        assert data is None
        
        # Test with empty token
        is_valid, data = authenticator.session_manager.validate_session_token("")
        assert is_valid is False
        assert data is None
        
        # Test with malformed token
        is_valid, data = authenticator.session_manager.validate_session_token("invalid.token")
        assert is_valid is False
        assert data is None
    
    def test_validate_session_token_fail_closed_exception_handling(self, authenticator):
        """Test session validation fails closed on any exception"""
        # Test with token that causes exception during parsing
        is_valid, data = authenticator.session_manager.validate_session_token("a.b.c.d.e")
        assert is_valid is False
        assert data is None


class TestProofOfWorkSecurity:
    """Test proof-of-work system security features."""
    
    def test_verify_solution_fail_closed_invalid_challenge(self, pow_system):
        """Test PoW verification fails closed on invalid challenge"""
        # Test with non-existent challenge
        is_valid, error = pow_system.verify_solution(
            challenge="non_existent",
            nonce="12345",
            difficulty=2
        )
        assert is_valid is False
        assert "Invalid or expired challenge" in error
    
    def test_verify_solution_fail_closed_expired_challenge(self, pow_system):
        """Test PoW verification fails closed on expired challenge"""
        # Generate challenge and wait for it to expire
        challenge, difficulty = pow_system.generate_challenge()
        
        # Manually expire the challenge
        pow_system._active_challenges[challenge] = (int(time.time()) - 400, difficulty)
        
        is_valid, error = pow_system.verify_solution(
            challenge=challenge,
            nonce="12345",
            difficulty=difficulty
        )
        assert is_valid is False
        assert "expired" in error.lower()
    
    def test_verify_solution_fail_closed_difficulty_mismatch(self, pow_system):
        """Test PoW verification fails closed on difficulty mismatch"""
        challenge, difficulty = pow_system.generate_challenge()
        
        is_valid, error = pow_system.verify_solution(
            challenge=challenge,
            nonce="12345",
            difficulty=difficulty + 1  # Wrong difficulty
        )
        assert is_valid is False
        assert "Difficulty mismatch" in error
    
    def test_verify_solution_fail_closed_insufficient_work(self, pow_system):
        """Test PoW verification fails closed on insufficient work"""
        challenge, difficulty = pow_system.generate_challenge()
        
        # Use a nonce that doesn't meet difficulty requirement
        is_valid, error = pow_system.verify_solution(
            challenge=challenge,
            nonce="0",  # Very unlikely to meet difficulty
            difficulty=difficulty
        )
        assert is_valid is False
        assert "insufficient zeros" in error.lower()


class TestRateLimitingSecurity:
    """Test rate limiting and session cleanup middleware."""
    
    def test_rate_limiting_exceeds_limit(self, client):
        """Test that rate limiting blocks excessive requests"""
        # Make multiple requests to exceed rate limit
        for i in range(10):
            response = client.post("/api/auth/challenge", json={
                "wallet_address": "0x1234567890123456789012345678901234567890"
            })
            if i < 5:  # First 5 should succeed or fail with 400 (invalid address)
                assert response.status_code in [200, 400]
            else:  # After rate limit, should get 429
                assert response.status_code == 429
                break
    
    def test_rate_limiting_headers_present(self, client):
        """Test that rate limiting headers are present"""
        response = client.post("/api/auth/challenge", json={
            "wallet_address": "0x1234567890123456789012345678901234567890"
        })
        
        # Check for rate limiting headers
        assert "x-ratelimit-limit" in response.headers
        assert "x-ratelimit-remaining" in response.headers
    
    def test_session_cleanup_middleware_active(self, client):
        """Test that session cleanup middleware is active"""
        # This test verifies the middleware is properly configured
        # The actual cleanup happens in the background
        response = client.get("/health")
        assert response.status_code == 200
        # If we get here, the middleware didn't break the app


class TestInputValidation:
    """Test input validation and sanitization."""
    
    def test_auth_challenge_invalid_inputs(self, client):
        """Test auth challenge with various invalid inputs"""
        # Test with missing wallet_address
        response = client.post("/api/auth/challenge", json={})
        assert response.status_code == 422  # Validation error
        
        # Test with invalid wallet address format
        response = client.post("/api/auth/challenge", json={
            "wallet_address": "invalid_address"
        })
        assert response.status_code == 400
        
        # Test with empty wallet address
        response = client.post("/api/auth/challenge", json={
            "wallet_address": ""
        })
        assert response.status_code == 400
    
    def test_auth_verify_invalid_inputs(self, client):
        """Test auth verify with various invalid inputs"""
        # Test with missing fields
        response = client.post("/api/auth/verify", json={})
        assert response.status_code == 422  # Validation error
        
        # Test with invalid signature format
        response = client.post("/api/auth/verify", json={
            "challenge_id": "test",
            "signature": "invalid_signature",
            "wallet_address": "0x1234567890123456789012345678901234567890"
        })
        assert response.status_code == 400
        
        # Test with empty fields
        response = client.post("/api/auth/verify", json={
            "challenge_id": "",
            "signature": "",
            "wallet_address": ""
        })
        assert response.status_code == 400


if __name__ == "__main__":
    pytest.main([__file__])