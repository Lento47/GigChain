"""
Unit Tests for Secure Logging System
====================================

Tests the secure logging functionality to ensure sensitive data is properly redacted.
"""

import pytest
import logging
import os
from unittest.mock import patch, MagicMock
from security.secure_logger import (
    SecureLogger, 
    LogLevel, 
    LogScrubMode, 
    get_secure_logger
)


class TestSecureLogger:
    """Test cases for SecureLogger class."""
    
    def test_wallet_address_truncation(self):
        """Test that wallet addresses are properly truncated."""
        logger = SecureLogger('test', LogLevel.INFO, LogScrubMode.STRICT)
        
        # Test full wallet address
        address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
        truncated = logger._truncate_wallet_address(address)
        assert truncated == "0x742d…bEb0"
        
        # Test short address (should not be truncated)
        short_address = "0x1234"
        truncated_short = logger._truncate_wallet_address(short_address)
        assert truncated_short == "0x1234"
    
    def test_ip_address_masking(self):
        """Test that IP addresses are properly masked."""
        logger = SecureLogger('test', LogLevel.INFO, LogScrubMode.STRICT)
        
        # Test IPv4 masking
        ipv4 = "192.168.1.100"
        masked_ipv4 = logger._mask_ip_address(ipv4)
        assert masked_ipv4 == "192.168.1.xxx"
        
        # Test IPv6 masking
        ipv6 = "2001:0db8:85a3:0000:0000:8a2e:0370:7334"
        masked_ipv6 = logger._mask_ip_address(ipv6)
        assert masked_ipv6 == "2001:0db8:85a3:0000:0000:8a2e:0370:xxxx"
        
        # Test paranoid mode
        paranoid_logger = SecureLogger('test', LogLevel.INFO, LogScrubMode.PARANOID)
        paranoid_masked = paranoid_logger._mask_ip_address(ipv4)
        assert paranoid_masked == "[IP_MASKED]"
    
    def test_sensitive_value_hashing(self):
        """Test that sensitive values are properly hashed."""
        logger = SecureLogger('test', LogLevel.INFO, LogScrubMode.STRICT)
        
        # Test normal hashing
        token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
        hashed = logger._hash_sensitive_value(token, "access_token")
        assert hashed.startswith("[REDACTED:")
        assert len(hashed) > 10
        
        # Test paranoid mode
        paranoid_logger = SecureLogger('test', LogLevel.INFO, LogScrubMode.PARANOID)
        paranoid_hashed = paranoid_logger._hash_sensitive_value(token, "access_token")
        assert paranoid_hashed.startswith("[HASH:")
    
    def test_dict_scrubbing(self):
        """Test that dictionaries are properly scrubbed."""
        logger = SecureLogger('test', LogLevel.INFO, LogScrubMode.STRICT)
        
        test_data = {
            "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
            "ip_address": "192.168.1.100",
            "normal_field": "this is safe",
            "password": "secret123",
            "nested": {
                "session_token": "abc123def456",
                "safe_data": "normal value"
            }
        }
        
        scrubbed = logger._scrub_dict(test_data)
        
        # Check wallet address is truncated
        assert scrubbed["wallet_address"] == "0x742d…bEb0"
        
        # Check sensitive fields are redacted
        assert scrubbed["access_token"].startswith("[REDACTED:")
        assert scrubbed["password"].startswith("[REDACTED:")
        assert scrubbed["nested"]["session_token"].startswith("[REDACTED:")
        
        # Check IP is masked
        assert scrubbed["ip_address"] == "192.168.1.xxx"
        
        # Check normal fields are preserved
        assert scrubbed["normal_field"] == "this is safe"
        assert scrubbed["nested"]["safe_data"] == "normal value"
    
    def test_string_scrubbing(self):
        """Test that strings are properly scrubbed."""
        logger = SecureLogger('test', LogLevel.INFO, LogScrubMode.STRICT)
        
        test_string = "User 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0 logged in from 192.168.1.100 with token abc123def456"
        scrubbed = logger._scrub_string(test_string)
        
        # Should contain truncated wallet and masked IP
        assert "0x742d" in scrubbed and "bEb0" in scrubbed
        assert "192.168.1.xxx" in scrubbed
        assert "abc123def456" not in scrubbed  # Token should be redacted
    
    def test_request_body_scrubbing(self):
        """Test that request bodies with sensitive data are scrubbed."""
        logger = SecureLogger('test', LogLevel.INFO, LogScrubMode.STRICT)
        
        # Test body with password
        sensitive_body = '{"username": "user", "password": "secret123"}'
        scrubbed = logger._scrub_request_body(sensitive_body)
        assert scrubbed == "[REQUEST_BODY_CONTAINS_SENSITIVE_DATA]"
        
        # Test body with token
        token_body = '{"action": "login", "token": "abc123def456"}'
        scrubbed_token = logger._scrub_request_body(token_body)
        assert scrubbed_token == "[REQUEST_BODY_CONTAINS_SENSITIVE_DATA]"
        
        # Test safe body
        safe_body = '{"action": "get_data", "id": "12345"}'
        scrubbed_safe = logger._scrub_request_body(safe_body)
        assert scrubbed_safe == safe_body
    
    def test_looks_like_sensitive_data(self):
        """Test detection of sensitive data patterns."""
        logger = SecureLogger('test', LogLevel.INFO, LogScrubMode.STRICT)
        
        # Test wallet address detection
        assert logger._looks_like_sensitive_data("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0") == True
        
        # Test token detection
        assert logger._looks_like_sensitive_data("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9") == True
        
        # Test signature detection
        assert logger._looks_like_sensitive_data("a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456") == True
        
        # Test normal data
        assert logger._looks_like_sensitive_data("normal text") == False
        assert logger._looks_like_sensitive_data("12345") == False
    
    def test_scrub_mode_none(self):
        """Test that scrubbing is disabled when mode is NONE."""
        logger = SecureLogger('test', LogLevel.INFO, LogScrubMode.NONE)
        
        test_data = {
            "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
        }
        
        scrubbed = logger._scrub_dict(test_data)
        
        # Data should be unchanged
        assert scrubbed["wallet_address"] == "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
        assert scrubbed["access_token"] == "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    
    def test_scrub_mode_basic(self):
        """Test basic scrubbing mode."""
        logger = SecureLogger('test', LogLevel.INFO, LogScrubMode.BASIC)
        
        test_data = {
            "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
        }
        
        scrubbed = logger._scrub_dict(test_data)
        
        # Wallet should be truncated, token should be redacted
        assert scrubbed["wallet_address"] == "0x742d…bEb0"
        assert scrubbed["access_token"].startswith("[REDACTED:")
    
    def test_logging_with_scrubbing(self):
        """Test that logging methods properly scrub data."""
        logger = SecureLogger('test', LogLevel.INFO, LogScrubMode.STRICT)
        
        # Mock the underlying logger to capture messages
        with patch.object(logger.logger, 'info') as mock_info:
            logger.info(
                "User logged in",
                extra={
                    "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
                    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
                }
            )
            
            # Check that the message was scrubbed
            call_args = mock_info.call_args[0][0]
            assert "0x742d" in call_args and "bEb0" in call_args
            assert "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" not in call_args
            assert "[REDACTED:" in call_args


class TestSecureLoggerIntegration:
    """Integration tests for secure logging."""
    
    def test_get_secure_logger_singleton(self):
        """Test that get_secure_logger returns singleton instances."""
        logger1 = get_secure_logger('test.module')
        logger2 = get_secure_logger('test.module')
        
        assert logger1 is logger2
    
    def test_environment_configuration(self):
        """Test that environment variables configure logging properly."""
        with patch.dict(os.environ, {
            'LOG_LEVEL': 'DEBUG',
            'LOG_SCRUB': 'paranoid',
            'LOG_SCRUB_ENABLED': 'true'
        }):
            logger = get_secure_logger('test.env')
            
            assert logger.log_level == LogLevel.DEBUG
            assert logger.scrub_mode == LogScrubMode.PARANOID
            assert logger.enable_scrubbing == True
    
    def test_convenience_functions(self):
        """Test convenience logger functions."""
        from security.secure_logger import (
            get_auth_logger, 
            get_security_logger, 
            get_api_logger, 
            get_audit_logger
        )
        
        # Test that convenience functions return proper loggers
        auth_logger = get_auth_logger()
        assert isinstance(auth_logger, SecureLogger)
        assert auth_logger.name == 'auth.secure'
        
        security_logger = get_security_logger()
        assert isinstance(security_logger, SecureLogger)
        assert security_logger.name == 'security.secure'
        
        api_logger = get_api_logger()
        assert isinstance(api_logger, SecureLogger)
        assert api_logger.name == 'api.secure'
        
        audit_logger = get_audit_logger()
        assert isinstance(audit_logger, SecureLogger)
        assert audit_logger.name == 'audit.secure'


class TestLoggingRedactionPatterns:
    """Test specific redaction patterns for common sensitive data."""
    
    def test_jwt_token_redaction(self):
        """Test that JWT tokens are properly redacted."""
        logger = SecureLogger('test', LogLevel.INFO, LogScrubMode.STRICT)
        
        jwt_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        
        scrubbed = logger._scrub_string(f"Bearer {jwt_token}")
        assert jwt_token not in scrubbed
        assert "[REDACTED:" in scrubbed
    
    def test_ethereum_signature_redaction(self):
        """Test that Ethereum signatures are properly redacted."""
        logger = SecureLogger('test', LogLevel.INFO, LogScrubMode.STRICT)
        
        signature = "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
        
        scrubbed = logger._scrub_string(f"Signature: {signature}")
        assert signature not in scrubbed
        assert "[REDACTED:" in scrubbed
    
    def test_api_key_redaction(self):
        """Test that API keys are properly redacted."""
        logger = SecureLogger('test', LogLevel.INFO, LogScrubMode.STRICT)
        
        api_key = "sk-1234567890abcdef1234567890abcdef1234567890abcdef"
        
        test_data = {
            "api_key": api_key,
            "apiKey": api_key,
            "access_key": api_key,
            "secret_key": api_key
        }
        
        scrubbed = logger._scrub_dict(test_data)
        
        for key in test_data:
            assert scrubbed[key].startswith("[REDACTED:")
            assert api_key not in scrubbed[key]
    
    def test_session_token_redaction(self):
        """Test that session tokens are properly redacted."""
        logger = SecureLogger('test', LogLevel.INFO, LogScrubMode.STRICT)
        
        session_token = "sess_1234567890abcdef1234567890abcdef"
        
        test_data = {
            "session_token": session_token,
            "sessionToken": session_token,
            "session": session_token,
            "token": session_token
        }
        
        scrubbed = logger._scrub_dict(test_data)
        
        for key in test_data:
            assert scrubbed[key].startswith("[REDACTED:")
            assert session_token not in scrubbed[key]


if __name__ == "__main__":
    pytest.main([__file__])
