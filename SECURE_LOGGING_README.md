# Secure Logging System for GigChain.io

## Overview

This document describes the secure logging system implemented to protect sensitive data in audit logs and application logs. The system automatically redacts, truncates, or hashes sensitive information to prevent data leakage while maintaining useful debugging information.

## Features

- **Automatic Data Scrubbing**: Sensitive data is automatically redacted based on configurable rules
- **Multiple Scrubbing Modes**: From basic to paranoid levels of data protection
- **Wallet Address Truncation**: Ethereum addresses are truncated to show only first/last characters
- **IP Address Redaction**: IP addresses are partially redacted for privacy
- **Token/Signature Redaction**: Authentication tokens and signatures are completely redacted
- **Request Body Protection**: Prevents accidental logging of sensitive request payloads
- **Structured Logging**: Supports structured logging with extra data fields
- **Configurable Log Levels**: Different log levels for different modules
- **Unit Testing**: Comprehensive test coverage for redaction patterns

## Architecture

### Core Components

1. **`SecureLogger`** (`security/secure_logger.py`): Main logging class with scrubbing capabilities
2. **`LogLevel`** and **`LogScrubMode`** Enums: Configuration options for logging behavior
3. **`get_secure_logger()`**: Singleton factory function for logger instances
4. **Integration Points**: Seamless integration with existing logging infrastructure

### Scrubbing Modes

#### `LogScrubMode.NONE`
- No data scrubbing
- **Use Case**: Development debugging only
- **Security Risk**: High - sensitive data exposed

#### `LogScrubMode.BASIC`
- Redacts common sensitive keys (tokens, passwords, etc.)
- Truncates wallet addresses and IP addresses
- **Use Case**: Development with basic protection
- **Security Risk**: Medium - some sensitive data may leak

#### `LogScrubMode.STRICT` (Recommended)
- Comprehensive redaction of all sensitive data
- Advanced pattern matching for data in log messages
- Request body protection
- **Use Case**: Production environments
- **Security Risk**: Low - maximum protection

#### `LogScrubMode.PARANOID` (Future)
- Maximum redaction with hashing
- Additional obfuscation techniques
- **Use Case**: High-security environments
- **Security Risk**: Minimal - maximum protection

## Usage

### Basic Usage

```python
from security.secure_logger import get_secure_logger, LogLevel, LogScrubMode

# Get a logger instance
logger = get_secure_logger('my_module', LogLevel.INFO, LogScrubMode.STRICT)

# Log with sensitive data (automatically scrubbed)
logger.info("User authentication", extra={
    'wallet_address': '0x1234567890abcdef1234567890abcdef12345678',
    'token': 'jwt.token.here',
    'ip_address': '192.168.1.100'
})
```

### Integration with Existing Code

```python
# Before (unsafe)
logger.info(f"Auth successful for {wallet_address} with token {token}")

# After (secure)
secure_logger.info("Auth successful", extra={
    'wallet_address': wallet_address,
    'token': token
})
```

## Configuration

### Environment Variables

Copy settings from `logging_config.env` to your `.env` file:

```bash
# Log level and scrubbing mode
LOG_LEVEL=INFO
LOG_SCRUB=strict
LOG_SCRUB_ENABLED=true

# Security settings
AUDIT_LOG_ENABLED=true
SECURITY_LOG_ENABLED=true
LOG_IP_ADDRESSES=true
LOG_WALLET_ADDRESSES=true
```

### Module-Specific Configuration

```python
# Different loggers for different modules
auth_logger = get_secure_logger('auth.w_csap', LogLevel.WARNING, LogScrubMode.STRICT)
api_logger = get_secure_logger('api.routes', LogLevel.INFO, LogScrubMode.BASIC)
security_logger = get_secure_logger('security.audit', LogLevel.ERROR, LogScrubMode.STRICT)
```

## Data Redaction Rules

### Sensitive Keys
The following keys are automatically redacted in `extra` data:
- `token`, `signature`, `private_key`, `api_key`, `password`, `secret`
- `refresh_token`, `session_token`, `challenge_message`, `nonce`

### Wallet Addresses
- **Format**: `0x1234...5678`
- **Rule**: First 6 characters + "..." + last 4 characters
- **Example**: `0x1234567890abcdef1234567890abcdef12345678` → `0x1234...5678`

### IP Addresses
- **IPv4**: `192.168.[REDACTED]`
- **IPv6**: `2001:0db8::[REDACTED]`
- **Rule**: Show first two octets for IPv4, first two groups for IPv6

### Request Bodies
- **Rule**: Completely redacted as `[REDACTED_BODY]`
- **Reason**: May contain sensitive user data or credentials

## Testing

### Running Tests

```bash
# Run secure logging tests
python -m pytest tests/test_secure_logging.py -v

# Run all security tests
python -m pytest tests/ -k "security" -v
```

### Test Coverage

The test suite covers:
- All log levels and scrubbing modes
- Wallet address truncation
- IP address redaction
- Sensitive key redaction
- Request body protection
- Singleton pattern behavior
- Edge cases and error conditions

### Example Test

```python
def test_wallet_address_truncation():
    secure_logger = SecureLogger('test', LogLevel.INFO, LogScrubMode.STRICT)
    wallet_address = "0x1234567890abcdef1234567890abcdef12345678"
    
    secure_logger.info("Wallet activity", extra={'wallet_address': wallet_address})
    
    # Verify wallet address is truncated
    assert "0x1234...5678" in log_output
    assert wallet_address not in log_output
```

## Security Considerations

### What Gets Redacted
- ✅ Authentication tokens and signatures
- ✅ Wallet addresses (truncated)
- ✅ IP addresses (partially redacted)
- ✅ Passwords and secrets
- ✅ Request bodies
- ✅ Private keys and API keys

### What Stays Visible
- ✅ User IDs and usernames (non-sensitive)
- ✅ Timestamps and log levels
- ✅ Error messages (without sensitive data)
- ✅ API endpoints and HTTP methods
- ✅ Success/failure status

### Best Practices
1. **Always use structured logging** with `extra` parameter
2. **Never log sensitive data in message strings**
3. **Use appropriate scrubbing mode** for your environment
4. **Regularly review logs** for data leakage
5. **Test redaction patterns** before deployment

## Integration Points

### Files Updated
- `main.py`: Authentication logging
- `security/audit_logger.py`: Audit event logging
- `auth/w_csap.py`: W-CSAP authentication logging
- `auth/routes.py`: Authentication route logging
- `auth/middleware.py`: Middleware logging
- `auth/database.py`: Database operation logging

### Migration Guide

1. **Import the secure logger**:
   ```python
   from security.secure_logger import get_secure_logger, LogLevel, LogScrubMode
   ```

2. **Replace existing loggers**:
   ```python
   # Old
   logger = logging.getLogger(__name__)
   
   # New
   secure_logger = get_secure_logger(__name__, LogLevel.INFO, LogScrubMode.STRICT)
   ```

3. **Update logging calls**:
   ```python
   # Old
   logger.info(f"User {user_id} logged in with wallet {wallet_address}")
   
   # New
   secure_logger.info("User logged in", extra={
       'user_id': user_id,
       'wallet_address': wallet_address
   })
   ```

## Monitoring and Alerting

### Log Patterns to Monitor
- `authentication_failed`: Failed login attempts
- `rate_limit_exceeded`: Rate limiting violations
- `suspicious_activity`: Unusual behavior patterns
- `data_leakage`: Potential sensitive data exposure

### Alert Thresholds
- **Authentication Failures**: 5+ failures in 5 minutes
- **Rate Limit Violations**: 10+ violations in 1 minute
- **Data Leakage**: Any occurrence should be investigated

## Troubleshooting

### Common Issues

1. **Logs too verbose**: Adjust `LOG_LEVEL` environment variable
2. **Sensitive data still visible**: Check scrubbing mode and key patterns
3. **Performance impact**: Use appropriate log levels for production
4. **Missing logs**: Verify logger configuration and handler setup

### Debug Mode

Enable debug logging for specific modules:
```bash
LOG_DEBUG_MODULES=auth.w_csap,security.audit_logger
```

## Future Enhancements

- [ ] **LogScrubMode.PARANOID**: Maximum redaction with hashing
- [ ] **Log encryption**: Encrypt sensitive log entries
- [ ] **Log integrity**: Cryptographic integrity checking
- [ ] **Advanced patterns**: ML-based sensitive data detection
- [ ] **Compliance reporting**: Automated compliance log analysis

## Support

For questions or issues with the secure logging system:
1. Check the test suite for usage examples
2. Review the configuration options in `logging_config.env`
3. Examine the integration points in updated files
4. Run the unit tests to verify functionality

---

**Security Note**: This logging system is designed to protect sensitive data, but it's not a substitute for proper data handling practices. Always follow security best practices when handling sensitive information.
