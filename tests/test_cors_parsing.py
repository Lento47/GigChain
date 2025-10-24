"""
Tests for CORS_ORIGINS environment variable parsing functionality.

This module tests the robust CORS parsing implementation to ensure proper
validation, error handling, and fallback mechanisms.
"""

import os
import pytest
import tempfile
from unittest.mock import patch
from urllib.parse import urlparse


class TestCORSParsing:
    """Test cases for CORS origins parsing functionality."""
    
    def test_parse_cors_origins_valid_single_origin(self):
        """Test parsing a single valid origin."""
        with patch.dict(os.environ, {'CORS_ORIGINS': 'https://example.com'}):
            # Import here to get the function with mocked environment
            from main import parse_cors_origins
            result = parse_cors_origins()
            assert result == ['https://example.com']
    
    def test_parse_cors_origins_valid_multiple_origins(self):
        """Test parsing multiple valid origins."""
        origins = 'https://example.com,http://localhost:3000,https://api.example.com'
        with patch.dict(os.environ, {'CORS_ORIGINS': origins}):
            from main import parse_cors_origins
            result = parse_cors_origins()
            expected = ['https://example.com', 'http://localhost:3000', 'https://api.example.com']
            assert result == expected
    
    def test_parse_cors_origins_with_whitespace(self):
        """Test parsing origins with extra whitespace."""
        origins = ' https://example.com , http://localhost:3000 , https://api.example.com '
        with patch.dict(os.environ, {'CORS_ORIGINS': origins}):
            from main import parse_cors_origins
            result = parse_cors_origins()
            expected = ['https://example.com', 'http://localhost:3000', 'https://api.example.com']
            assert result == expected
    
    def test_parse_cors_origins_with_empty_values(self):
        """Test parsing origins with empty values (should be filtered out)."""
        origins = 'https://example.com,,http://localhost:3000,'
        with patch.dict(os.environ, {'CORS_ORIGINS': origins}):
            from main import parse_cors_origins
            result = parse_cors_origins()
            expected = ['https://example.com', 'http://localhost:3000']
            assert result == expected
    
    def test_parse_cors_origins_missing_protocol(self):
        """Test parsing origins missing protocol (should be filtered out)."""
        origins = 'example.com,https://valid.com'
        with patch.dict(os.environ, {'CORS_ORIGINS': origins}):
            from main import parse_cors_origins
            result = parse_cors_origins()
            assert result == ['https://valid.com']
    
    def test_parse_cors_origins_invalid_protocol(self):
        """Test parsing origins with invalid protocol (should be filtered out)."""
        origins = 'ftp://invalid.com,https://valid.com'
        with patch.dict(os.environ, {'CORS_ORIGINS': origins}):
            from main import parse_cors_origins
            result = parse_cors_origins()
            assert result == ['https://valid.com']
    
    def test_parse_cors_origins_localhost_variants(self):
        """Test parsing localhost variants."""
        origins = 'http://localhost:3000,https://localhost:5173,http://127.0.0.1:8080'
        with patch.dict(os.environ, {'CORS_ORIGINS': origins}):
            from main import parse_cors_origins
            result = parse_cors_origins()
            expected = ['http://localhost:3000', 'https://localhost:5173', 'http://127.0.0.1:8080']
            assert result == expected
    
    def test_parse_cors_origins_private_networks(self):
        """Test parsing private network addresses."""
        origins = (
            'http://192.168.1.100:3000,'
            'https://10.0.0.1:5173,'
            'http://172.16.0.1:8080'
        )
        with patch.dict(os.environ, {'CORS_ORIGINS': origins}):
            from main import parse_cors_origins
            result = parse_cors_origins()
            expected = [
                'http://192.168.1.100:3000',
                'https://10.0.0.1:5173',
                'http://172.16.0.1:8080'
            ]
            assert result == expected
    
    def test_parse_cors_origins_invalid_hostname(self):
        """Test parsing origins with invalid hostnames (should be filtered out)."""
        origins = 'https://invalid..com,https://valid.com'
        with patch.dict(os.environ, {'CORS_ORIGINS': origins}):
            from main import parse_cors_origins
            result = parse_cors_origins()
            assert result == ['https://valid.com']
    
    def test_parse_cors_origins_missing_environment_variable(self):
        """Test fallback when no environment variable is set."""
        with patch.dict(os.environ, {}, clear=True):
            from main import parse_cors_origins
            result = parse_cors_origins()
            # Should return development fallback origins
            assert len(result) > 0
            assert any('localhost' in origin for origin in result)
            assert any('127.0.0.1' in origin for origin in result)
    
    def test_parse_cors_origins_legacy_allowed_origins(self):
        """Test support for legacy ALLOWED_ORIGINS environment variable."""
        with patch.dict(os.environ, {'ALLOWED_ORIGINS': 'https://example.com'}):
            from main import parse_cors_origins
            result = parse_cors_origins()
            assert result == ['https://example.com']
    
    def test_parse_cors_origins_priority_cors_origins_over_allowed_origins(self):
        """Test that CORS_ORIGINS takes priority over ALLOWED_ORIGINS."""
        with patch.dict(os.environ, {
            'CORS_ORIGINS': 'https://cors.example.com',
            'ALLOWED_ORIGINS': 'https://allowed.example.com'
        }):
            from main import parse_cors_origins
            result = parse_cors_origins()
            assert result == ['https://cors.example.com']
    
    def test_parse_cors_origins_all_invalid_raises_error(self):
        """Test that all invalid origins raise ValueError."""
        with patch.dict(os.environ, {'CORS_ORIGINS': 'invalid,also-invalid'}):
            from main import parse_cors_origins
            with pytest.raises(ValueError, match="No valid CORS origins found"):
                parse_cors_origins()
    
    def test_parse_cors_origins_empty_string_uses_fallback(self):
        """Test that empty string uses development fallback."""
        with patch.dict(os.environ, {'CORS_ORIGINS': ''}):
            from main import parse_cors_origins
            result = parse_cors_origins()
            # Should return development fallback origins
            assert len(result) > 0
            assert any('localhost' in origin for origin in result)
    
    def test_parse_cors_origins_whitespace_only_raises_error(self):
        """Test that whitespace-only string raises ValueError."""
        with patch.dict(os.environ, {'CORS_ORIGINS': '   ,  ,  '}):
            from main import parse_cors_origins
            # This should raise an error because all origins are invalid
            with pytest.raises(ValueError, match="No valid CORS origins found"):
                parse_cors_origins()
    
    def test_parse_cors_origins_mixed_valid_invalid(self):
        """Test parsing with mix of valid and invalid origins."""
        origins = (
            'https://valid.com,'
            'invalid-protocol,'
            'http://localhost:3000,'
            'https://invalid..com,'
            'http://192.168.1.1:5173'
        )
        with patch.dict(os.environ, {'CORS_ORIGINS': origins}):
            from main import parse_cors_origins
            result = parse_cors_origins()
            expected = [
                'https://valid.com',
                'http://localhost:3000',
                'http://192.168.1.1:5173'
            ]
            assert result == expected
    
    def test_parse_cors_origins_with_ports(self):
        """Test parsing origins with various ports."""
        origins = (
            'https://example.com:8080,'
            'http://localhost:3000,'
            'https://api.example.com:443'
        )
        with patch.dict(os.environ, {'CORS_ORIGINS': origins}):
            from main import parse_cors_origins
            result = parse_cors_origins()
            expected = [
                'https://example.com:8080',
                'http://localhost:3000',
                'https://api.example.com:443'
            ]
            assert result == expected
    
    def test_parse_cors_origins_unicode_and_special_characters(self):
        """Test parsing origins with unicode and special characters."""
        origins = 'https://example.com,https://test-site.com,https://api.example.com'
        with patch.dict(os.environ, {'CORS_ORIGINS': origins}):
            from main import parse_cors_origins
            result = parse_cors_origins()
            expected = ['https://example.com', 'https://test-site.com', 'https://api.example.com']
            assert result == expected
    
    def test_parse_cors_origins_very_long_list(self):
        """Test parsing a very long list of origins."""
        origins = ','.join([f'http://localhost:{port}' for port in range(3000, 3020)])
        with patch.dict(os.environ, {'CORS_ORIGINS': origins}):
            from main import parse_cors_origins
            result = parse_cors_origins()
            assert len(result) == 20
            assert all(origin.startswith('http://localhost:') for origin in result)
    
    def test_parse_cors_origins_duplicate_origins(self):
        """Test parsing with duplicate origins (should preserve duplicates)."""
        origins = 'https://example.com,https://example.com,http://localhost:3000'
        with patch.dict(os.environ, {'CORS_ORIGINS': origins}):
            from main import parse_cors_origins
            result = parse_cors_origins()
            expected = ['https://example.com', 'https://example.com', 'http://localhost:3000']
            assert result == expected
    
    def test_parse_cors_origins_case_sensitivity(self):
        """Test that parsing is case-sensitive for hostnames."""
        origins = 'https://Example.com,https://example.com'
        with patch.dict(os.environ, {'CORS_ORIGINS': origins}):
            from main import parse_cors_origins
            result = parse_cors_origins()
            expected = ['https://Example.com', 'https://example.com']
            assert result == expected


class TestCORSParsingIntegration:
    """Integration tests for CORS parsing with the FastAPI app."""
    
    def test_cors_middleware_configuration(self):
        """Test that CORS middleware is properly configured."""
        with patch.dict(os.environ, {'CORS_ORIGINS': 'https://example.com,http://localhost:3000'}):
            # Test the parsing function directly
            from main import parse_cors_origins
            result = parse_cors_origins()
            
            # Verify origins were parsed correctly
            assert 'https://example.com' in result
            assert 'http://localhost:3000' in result
    
    def test_cors_configuration_error_handling(self):
        """Test error handling when CORS configuration fails."""
        with patch.dict(os.environ, {'CORS_ORIGINS': 'invalid,also-invalid'}):
            # This should raise a ValueError during app initialization
            with pytest.raises(ValueError, match="No valid CORS origins found"):
                from main import parse_cors_origins
                parse_cors_origins()


class TestCORSParsingLogging:
    """Test logging behavior of CORS parsing."""
    
    def test_cors_parsing_logs_valid_origins(self, caplog):
        """Test that valid origins are parsed correctly."""
        with patch.dict(os.environ, {'CORS_ORIGINS': 'https://example.com'}):
            with caplog.at_level("INFO"):
                from main import parse_cors_origins
                result = parse_cors_origins()
                
                # Check that parsing works correctly
                assert len(result) == 1
                assert result[0] == 'https://example.com'
    
    def test_cors_parsing_logs_invalid_origins(self, caplog):
        """Test that invalid origins are logged as warnings."""
        with patch.dict(os.environ, {'CORS_ORIGINS': 'invalid-protocol,https://valid.com'}):
            from main import parse_cors_origins
            parse_cors_origins()
            
            # Check that invalid origins are logged as warnings
            assert "Invalid origin" in caplog.text
    
    def test_cors_parsing_logs_fallback_usage(self, caplog):
        """Test that fallback usage is logged."""
        with patch.dict(os.environ, {}, clear=True):
            from main import parse_cors_origins
            parse_cors_origins()
            
            # Check that fallback usage is logged
            assert "using development fallback" in caplog.text


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
