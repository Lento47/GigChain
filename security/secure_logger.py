"""
Secure Logging System for GigChain.io
=====================================

Implements secure logging with automatic redaction of sensitive data.
Prevents tokens, signatures, IPs, and other sensitive information from leaking in logs.

Features:
- Automatic redaction of sensitive fields
- Wallet address truncation (0x1234…abcd)
- Token/signature hashing
- IP address masking
- Request body sanitization
- Configurable log levels and scrubbing
"""

import hashlib
import logging
import re
import json
import os
from typing import Any, Dict, List, Optional, Union
from datetime import datetime
from enum import Enum


class LogLevel(str, Enum):
    """Log levels for secure logging."""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class LogScrubMode(str, Enum):
    """Log scrubbing modes."""
    NONE = "none"          # No scrubbing
    BASIC = "basic"        # Basic sensitive data redaction
    STRICT = "strict"      # Strict redaction with hashing
    PARANOID = "paranoid"  # Maximum redaction


class SecureLogger:
    """
    Secure logging system with automatic sensitive data redaction.
    """
    
    def __init__(
        self,
        name: str,
        log_level: LogLevel = LogLevel.INFO,
        scrub_mode: LogScrubMode = LogScrubMode.STRICT,
        enable_scrubbing: bool = True
    ):
        self.name = name
        self.log_level = log_level
        self.scrub_mode = scrub_mode
        self.enable_scrubbing = enable_scrubbing
        
        # Configure logger
        self.logger = logging.getLogger(name)
        self.logger.setLevel(getattr(logging, log_level.value))
        
        # Sensitive field patterns (case-insensitive)
        self.sensitive_fields = {
            'password', 'passwd', 'pwd', 'secret', 'key', 'token', 'auth',
            'signature', 'sig', 'private', 'credential', 'cred', 'api_key',
            'access_token', 'refresh_token', 'session_token', 'bearer',
            'authorization', 'cookie', 'session', 'jwt', 'jti', 'nonce',
            'challenge', 'assertion', 'hmac', 'hash', 'salt', 'iv',
            'wallet_private_key', 'mnemonic', 'seed', 'passphrase'
        }
        
        # IP address patterns
        self.ip_patterns = [
            r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b',  # IPv4
            r'\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b',  # IPv6
            r'\b(?:[0-9a-fA-F]{1,4}:)*::[0-9a-fA-F]{1,4}(?::[0-9a-fA-F]{1,4})*\b'  # IPv6 compressed
        ]
        
        # Wallet address pattern
        self.wallet_pattern = re.compile(r'\b0x[a-fA-F0-9]{40}\b')
        
        # Token patterns (various formats)
        self.token_patterns = [
            r'\b[A-Za-z0-9+/]{10,}={0,2}\b',  # Base64-like tokens
            r'\b[A-Za-z0-9\-_]{10,}\b',       # URL-safe tokens
            r'\b[0-9a-f]{16,}\b',             # Hex tokens
            r'\b[0-9a-f]{32,}\b',             # Long hex (signatures)
        ]
        
        # Request body patterns to avoid logging
        self.request_body_patterns = [
            r'password["\']?\s*[:=]\s*["\'][^"\']+["\']',
            r'secret["\']?\s*[:=]\s*["\'][^"\']+["\']',
            r'token["\']?\s*[:=]\s*["\'][^"\']+["\']',
            r'signature["\']?\s*[:=]\s*["\'][^"\']+["\']',
        ]
    
    def _should_scrub(self) -> bool:
        """Check if scrubbing should be enabled."""
        return self.enable_scrubbing and self.scrub_mode != LogScrubMode.NONE
    
    def _hash_sensitive_value(self, value: str, field_name: str = "") -> str:
        """Hash a sensitive value for logging."""
        if not value or len(value) < 4:
            return "[REDACTED]"
        
        # Create a hash that's consistent but not reversible
        hash_input = f"{field_name}:{value}:{self.name}"
        hash_value = hashlib.sha256(hash_input.encode()).hexdigest()[:8]
        
        if self.scrub_mode == LogScrubMode.PARANOID:
            return f"[HASH:{hash_value}]"
        else:
            return f"[REDACTED:{hash_value[:4]}]"
    
    def _truncate_wallet_address(self, address: str) -> str:
        """Truncate wallet address to 0x1234…abcd format."""
        if not address or len(address) < 10:
            return address
        
        if address.startswith('0x') and len(address) == 42:
            return f"{address[:6]}…{address[-4:]}"
        
        return address
    
    def _mask_ip_address(self, ip: str) -> str:
        """Mask IP address for privacy."""
        if not ip or self.scrub_mode == LogScrubMode.NONE:
            return ip
        
        if self.scrub_mode == LogScrubMode.PARANOID:
            return "[IP_MASKED]"
        
        # For IPv4, mask last octet
        if re.match(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b', ip):
            parts = ip.split('.')
            if len(parts) == 4:
                return f"{parts[0]}.{parts[1]}.{parts[2]}.xxx"
        
        # For IPv6, mask last segment
        if ':' in ip:
            parts = ip.split(':')
            if len(parts) > 1:
                return ':'.join(parts[:-1]) + ':xxxx'
        
        return "[IP_MASKED]"
    
    def _scrub_dict(self, data: Dict[str, Any], path: str = "") -> Dict[str, Any]:
        """Recursively scrub sensitive data from dictionaries."""
        if not self._should_scrub():
            return data
        
        scrubbed = {}
        
        for key, value in data.items():
            current_path = f"{path}.{key}" if path else key
            key_lower = key.lower()
            
            # Check if field name indicates sensitive data
            is_sensitive_field = any(
                sensitive in key_lower for sensitive in self.sensitive_fields
            )
            
            if is_sensitive_field and isinstance(value, str):
                scrubbed[key] = self._hash_sensitive_value(value, key)
            elif key_lower in ['ip_address', 'ip', 'client_ip', 'remote_addr']:
                scrubbed[key] = self._mask_ip_address(str(value))
            elif key_lower in ['wallet_address', 'address', 'user_address']:
                scrubbed[key] = self._truncate_wallet_address(str(value))
            elif isinstance(value, dict):
                scrubbed[key] = self._scrub_dict(value, current_path)
            elif isinstance(value, list):
                scrubbed[key] = self._scrub_list(value, current_path)
            else:
                scrubbed[key] = value
        
        return scrubbed
    
    def _scrub_list(self, data: List[Any], path: str = "") -> List[Any]:
        """Scrub sensitive data from lists."""
        if not self._should_scrub():
            return data
        
        scrubbed = []
        
        for i, item in enumerate(data):
            current_path = f"{path}[{i}]"
            
            if isinstance(item, dict):
                scrubbed.append(self._scrub_dict(item, current_path))
            elif isinstance(item, list):
                scrubbed.append(self._scrub_list(item, current_path))
            elif isinstance(item, str):
                # Check if string looks like sensitive data
                if self._looks_like_sensitive_data(item):
                    scrubbed.append(self._hash_sensitive_value(item, f"item_{i}"))
                else:
                    scrubbed.append(item)
            else:
                scrubbed.append(item)
        
        return scrubbed
    
    def _looks_like_sensitive_data(self, value: str) -> bool:
        """Check if a string looks like sensitive data."""
        if not value or len(value) < 8:
            return False
        
        # Check against token patterns
        for pattern in self.token_patterns:
            if re.match(pattern, value):
                return True
        
        # Check if it's a wallet address
        if self.wallet_pattern.match(value):
            return True
        
        # Check if it looks like a signature (long hex)
        if re.match(r'^[0-9a-fA-F]{64,}$', value):
            return True
        
        return False
    
    def _scrub_string(self, text: str) -> str:
        """Scrub sensitive data from strings."""
        if not self._should_scrub() or not text:
            return text
        
        scrubbed = text
        
        # Replace wallet addresses
        scrubbed = self.wallet_pattern.sub(
            lambda m: self._truncate_wallet_address(m.group()),
            scrubbed
        )
        
        # Replace IP addresses
        for pattern in self.ip_patterns:
            scrubbed = re.sub(pattern, lambda m: self._mask_ip_address(m.group()), scrubbed)
        
        # Replace token-like patterns
        for pattern in self.token_patterns:
            scrubbed = re.sub(
                pattern,
                lambda m: self._hash_sensitive_value(m.group()),
                scrubbed
            )
        
        return scrubbed
    
    def _scrub_request_body(self, body: str) -> str:
        """Scrub sensitive data from request bodies."""
        if not self._should_scrub() or not body:
            return body
        
        # Check if body contains sensitive patterns
        for pattern in self.request_body_patterns:
            if re.search(pattern, body, re.IGNORECASE):
                return "[REQUEST_BODY_CONTAINS_SENSITIVE_DATA]"
        
        # If body is too long, truncate it
        if len(body) > 1000:
            return f"{body[:500]}...[TRUNCATED]"
        
        return body
    
    def _format_message(self, message: str, extra: Optional[Dict[str, Any]] = None) -> str:
        """Format log message with scrubbing."""
        if not self._should_scrub():
            return message
        
        # Scrub the message string
        scrubbed_message = self._scrub_string(message)
        
        # Scrub extra data
        if extra:
            scrubbed_extra = self._scrub_dict(extra)
            if scrubbed_extra:
                extra_str = json.dumps(scrubbed_extra, default=str)
                return f"{scrubbed_message} | {extra_str}"
        
        return scrubbed_message
    
    def debug(self, message: str, extra: Optional[Dict[str, Any]] = None, **kwargs):
        """Log debug message with scrubbing."""
        if self.logger.isEnabledFor(logging.DEBUG):
            formatted_message = self._format_message(message, extra)
            self.logger.debug(formatted_message, **kwargs)
    
    def info(self, message: str, extra: Optional[Dict[str, Any]] = None, **kwargs):
        """Log info message with scrubbing."""
        if self.logger.isEnabledFor(logging.INFO):
            formatted_message = self._format_message(message, extra)
            self.logger.info(formatted_message, **kwargs)
    
    def warning(self, message: str, extra: Optional[Dict[str, Any]] = None, **kwargs):
        """Log warning message with scrubbing."""
        if self.logger.isEnabledFor(logging.WARNING):
            formatted_message = self._format_message(message, extra)
            self.logger.warning(formatted_message, **kwargs)
    
    def error(self, message: str, extra: Optional[Dict[str, Any]] = None, **kwargs):
        """Log error message with scrubbing."""
        if self.logger.isEnabledFor(logging.ERROR):
            formatted_message = self._format_message(message, extra)
            self.logger.error(formatted_message, **kwargs)
    
    def critical(self, message: str, extra: Optional[Dict[str, Any]] = None, **kwargs):
        """Log critical message with scrubbing."""
        if self.logger.isEnabledFor(logging.CRITICAL):
            formatted_message = self._format_message(message, extra)
            self.logger.critical(formatted_message, **kwargs)
    
    def log_exception(
        self,
        message: str,
        exc_info: bool = True,
        extra: Optional[Dict[str, Any]] = None,
        **kwargs
    ):
        """Log exception with scrubbing, avoiding request body dumps."""
        if self.logger.isEnabledFor(logging.ERROR):
            # Scrub extra data to avoid sensitive information
            scrubbed_extra = self._scrub_dict(extra) if extra else None
            
            # Remove any request body from extra data
            if scrubbed_extra and 'request_body' in scrubbed_extra:
                scrubbed_extra['request_body'] = self._scrub_request_body(
                    str(scrubbed_extra['request_body'])
                )
            
            formatted_message = self._format_message(message, scrubbed_extra)
            self.logger.error(formatted_message, exc_info=exc_info, **kwargs)


# Global secure logger instances
_secure_loggers: Dict[str, SecureLogger] = {}


def get_secure_logger(
    name: str,
    log_level: Optional[LogLevel] = None,
    scrub_mode: Optional[LogScrubMode] = None,
    enable_scrubbing: Optional[bool] = None
) -> SecureLogger:
    """
    Get or create a secure logger instance.
    
    Configuration is read from environment variables:
    - LOG_LEVEL: DEBUG, INFO, WARNING, ERROR, CRITICAL
    - LOG_SCRUB: none, basic, strict, paranoid
    - LOG_SCRUB_ENABLED: true, false
    """
    if name not in _secure_loggers:
        # Get configuration from environment
        env_log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
        env_scrub_mode = os.getenv('LOG_SCRUB', 'strict').lower()
        env_scrub_enabled = os.getenv('LOG_SCRUB_ENABLED', 'true').lower() == 'true'
        
        # Parse log level
        try:
            default_log_level = LogLevel(env_log_level)
        except ValueError:
            default_log_level = LogLevel.INFO
        
        # Parse scrub mode
        try:
            default_scrub_mode = LogScrubMode(env_scrub_mode)
        except ValueError:
            default_scrub_mode = LogScrubMode.STRICT
        
        _secure_loggers[name] = SecureLogger(
            name=name,
            log_level=log_level or default_log_level,
            scrub_mode=scrub_mode or default_scrub_mode,
            enable_scrubbing=enable_scrubbing if enable_scrubbing is not None else env_scrub_enabled
        )
    
    return _secure_loggers[name]


# Convenience functions for common use cases
def get_auth_logger() -> SecureLogger:
    """Get secure logger for authentication operations."""
    return get_secure_logger('auth.secure', LogLevel.INFO, LogScrubMode.STRICT)


def get_security_logger() -> SecureLogger:
    """Get secure logger for security operations."""
    return get_secure_logger('security.secure', LogLevel.WARNING, LogScrubMode.STRICT)


def get_api_logger() -> SecureLogger:
    """Get secure logger for API operations."""
    return get_secure_logger('api.secure', LogLevel.INFO, LogScrubMode.BASIC)


def get_audit_logger() -> SecureLogger:
    """Get secure logger for audit operations."""
    return get_secure_logger('audit.secure', LogLevel.INFO, LogScrubMode.STRICT)


# Export main classes and functions
__all__ = [
    'SecureLogger',
    'LogLevel',
    'LogScrubMode',
    'get_secure_logger',
    'get_auth_logger',
    'get_security_logger',
    'get_api_logger',
    'get_audit_logger'
]
