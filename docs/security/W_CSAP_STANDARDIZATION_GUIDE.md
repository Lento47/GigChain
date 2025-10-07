# W-CSAP Authentication Standardization Guide

## 📋 Overview

This guide explains the **standardized W-CSAP authentication method** implemented in GigChain.io. The standardization provides consistent API contracts, error handling, configuration management, and integration patterns.

## 🎯 What Has Been Standardized

### 1. **Request/Response Schemas** (`auth/schemas.py`)

All authentication endpoints now use type-safe Pydantic models:

**Request Models:**
- `AuthChallengeRequest` - Request authentication challenge
- `AuthVerifyRequest` - Verify signed challenge
- `AuthRefreshRequest` - Refresh session
- `AuthLogoutRequest` - Logout session

**Response Models:**
- `AuthChallengeResponse` - Challenge response
- `AuthVerifyResponse` - Verification response with session data
- `AuthStatusResponse` - Authentication status
- `AuthRefreshResponse` - Refreshed session
- `AuthLogoutResponse` - Logout confirmation
- `AuthSessionsResponse` - List of active sessions
- `AuthStatsResponse` - System statistics

**Benefits:**
- ✅ Automatic validation
- ✅ Clear API documentation
- ✅ Type safety
- ✅ Consistent response format

### 2. **Configuration Management** (`auth/config.py`)

Centralized configuration with environment variable support:

```python
from auth import get_config

config = get_config()
# All settings loaded from environment or defaults
```

**Configuration Options:**

| Setting | Environment Variable | Default | Description |
|---------|---------------------|---------|-------------|
| Secret Key | `W_CSAP_SECRET_KEY` | Auto-generated | HMAC signing key |
| Challenge TTL | `W_CSAP_CHALLENGE_TTL` | 300s (5m) | Challenge expiry |
| Session TTL | `W_CSAP_SESSION_TTL` | 86400s (24h) | Session expiry |
| Refresh TTL | `W_CSAP_REFRESH_TTL` | 604800s (7d) | Refresh token expiry |
| Rate Limiting | `W_CSAP_RATE_LIMIT_ENABLED` | true | Enable rate limiting |
| Database Path | `W_CSAP_DB_PATH` | `data/w_csap.db` | SQLite database location |

**Example `.env` configuration:**

```bash
# Required in production
W_CSAP_SECRET_KEY=your_64_character_hex_secret_key_here

# Optional (with defaults)
W_CSAP_CHALLENGE_TTL=300
W_CSAP_SESSION_TTL=86400
W_CSAP_REFRESH_TTL=604800
W_CSAP_RATE_LIMIT_ENABLED=true
W_CSAP_RATE_LIMIT_MAX_ATTEMPTS=5
W_CSAP_RATE_LIMIT_WINDOW_SECONDS=300
W_CSAP_DB_PATH=data/w_csap.db
```

**Generate Secret Key:**

```bash
python -c "import secrets; print('W_CSAP_SECRET_KEY=' + secrets.token_hex(32))"
```

### 3. **Error Handling** (`auth/errors.py`)

Standardized error codes and exceptions:

**Error Codes:**

```python
from auth import WCSAPErrorCode

# Challenge errors
CHALLENGE_NOT_FOUND
CHALLENGE_EXPIRED
CHALLENGE_ALREADY_USED

# Signature errors
INVALID_SIGNATURE
WALLET_MISMATCH

# Session errors
SESSION_EXPIRED
INVALID_SESSION_TOKEN
INVALID_REFRESH_TOKEN

# Rate limiting
RATE_LIMIT_EXCEEDED
TOO_MANY_ATTEMPTS

# Authentication
UNAUTHORIZED
MISSING_CREDENTIALS
```

**Error Response Format:**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_SIGNATURE",
    "message": "Signature verification failed",
    "field": "signature",
    "details": {
      "expected_address": "0x742d35...",
      "recovered_address": "0x123456..."
    }
  },
  "timestamp": 1704123456
}
```

**Using Exceptions:**

```python
from auth.errors import InvalidSignatureException, WCSAPException

# Raise specific exception
raise InvalidSignatureException(
    expected_address="0x123...",
    recovered_address="0x456..."
)

# Global exception handler
from fastapi import FastAPI
from auth import wcsap_exception_handler, WCSAPException

app = FastAPI()
app.add_exception_handler(WCSAPException, wcsap_exception_handler)
```

### 4. **Standardized Routes** (`auth/routes.py`)

Pre-built FastAPI router with all authentication endpoints:

```python
from fastapi import FastAPI
from auth import auth_router

app = FastAPI()
app.include_router(auth_router)
```

**Available Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/challenge` | POST | Request authentication challenge |
| `/api/auth/verify` | POST | Verify signature and create session |
| `/api/auth/refresh` | POST | Refresh expired session |
| `/api/auth/status` | GET | Check authentication status |
| `/api/auth/logout` | POST | Logout and invalidate session |
| `/api/auth/sessions` | GET | List active sessions (protected) |
| `/api/auth/stats` | GET | Get authentication statistics |

## 🚀 Quick Start

### 1. Initialize W-CSAP in Your Application

```python
from fastapi import FastAPI
from auth import auth_router, WCSAPAuthenticator, get_database, get_config, wcsap_exception_handler, WCSAPException
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize W-CSAP on startup."""
    # Load configuration
    config = get_config()
    
    # Initialize authenticator
    app.state.authenticator = WCSAPAuthenticator(
        secret_key=config.secret_key,
        challenge_ttl=config.challenge_ttl,
        session_ttl=config.session_ttl,
        refresh_ttl=config.refresh_ttl
    )
    
    # Initialize database
    app.state.auth_db = get_database(config.db_path)
    
    yield
    
    # Cleanup on shutdown
    pass

app = FastAPI(lifespan=lifespan)

# Add exception handler
app.add_exception_handler(WCSAPException, wcsap_exception_handler)

# Include authentication routes
app.include_router(auth_router)
```

### 2. Protect Your Routes

**Using Dependency Injection:**

```python
from fastapi import APIRouter, Depends
from auth import get_current_wallet, WalletInfo

router = APIRouter()

@router.get("/api/profile")
async def get_profile(wallet: WalletInfo = Depends(get_current_wallet)):
    """Protected route - requires authentication."""
    return {
        "wallet": wallet.address,
        "message": f"Hello {wallet.address}!"
    }

@router.get("/api/public")
async def public_route(wallet: Optional[WalletInfo] = Depends(get_optional_wallet)):
    """Optional authentication - works with or without auth."""
    if wallet:
        return {"message": f"Hello {wallet.address}!"}
    return {"message": "Hello anonymous!"}
```

### 3. Frontend Integration

**Request Challenge:**

```javascript
// 1. Request challenge
const response = await fetch('/api/auth/challenge', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    wallet_address: account
  })
});

const { challenge_id, challenge_message } = await response.json();
```

**Sign and Verify:**

```javascript
// 2. Sign challenge with wallet
const signature = await ethereum.request({
  method: 'personal_sign',
  params: [challenge_message, account]
});

// 3. Verify signature
const verifyResponse = await fetch('/api/auth/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    challenge_id,
    signature,
    wallet_address: account
  })
});

const { session } = await verifyResponse.json();

// 4. Store tokens
localStorage.setItem('session_token', session.session_token);
localStorage.setItem('refresh_token', session.refresh_token);
```

**Make Authenticated Requests:**

```javascript
// Include session token in Authorization header
const response = await fetch('/api/profile', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('session_token')}`
  }
});
```

**Refresh Session:**

```javascript
// When session expires, use refresh token
const refreshResponse = await fetch('/api/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    session_token: localStorage.getItem('session_token'),
    refresh_token: localStorage.getItem('refresh_token')
  })
});

const { session: newSession } = await refreshResponse.json();

// Update stored tokens
localStorage.setItem('session_token', newSession.session_token);
localStorage.setItem('refresh_token', newSession.refresh_token);
```

## 📝 API Examples

### Request Challenge

**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/challenge \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
  }'
```

**Response:**
```json
{
  "success": true,
  "challenge_id": "a1b2c3d4e5f6...",
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
  "challenge_message": "🔐 GigChain.io - Wallet Authentication\n\nSign this message...",
  "nonce": "abc123...",
  "issued_at": 1704123456,
  "expires_at": 1704123756,
  "expires_in": 300
}
```

### Verify Signature

**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "challenge_id": "a1b2c3d4e5f6...",
    "signature": "0xabcdef123456...",
    "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "session": {
    "assertion_id": "assertion123...",
    "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    "session_token": "assertion.wallet.expires.hmac",
    "refresh_token": "refresh_token_hash",
    "issued_at": 1704123456,
    "expires_at": 1704209856,
    "expires_in": 86400,
    "not_before": 1704123456
  }
}
```

### Check Status

**Request:**
```bash
curl -X GET http://localhost:5000/api/auth/status \
  -H "Authorization: Bearer assertion.wallet.expires.hmac"
```

**Response:**
```json
{
  "authenticated": true,
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
  "expires_at": 1704209856,
  "expires_in": 85000,
  "session_info": {
    "assertion_id": "assertion123...",
    "last_activity": 1704123500
  }
}
```

## 🔒 Security Best Practices

### 1. Environment Variables

**DO:**
- ✅ Use environment variables for sensitive configuration
- ✅ Generate strong secret keys (64+ characters)
- ✅ Use different keys for dev/staging/production
- ✅ Keep `.env` out of version control

**DON'T:**
- ❌ Hardcode secret keys in code
- ❌ Reuse keys across environments
- ❌ Commit secrets to Git

### 2. HTTPS in Production

```python
from auth import get_config

config = get_config()
config.require_https = True  # Or set W_CSAP_REQUIRE_HTTPS=true
```

### 3. Rate Limiting

Enable rate limiting to prevent brute-force attacks:

```python
config.rate_limit_enabled = True
config.rate_limit_max_attempts = 5
config.rate_limit_window_seconds = 300  # 5 minutes
```

### 4. Session Duration

**High Security Applications:**
- Challenge TTL: 120s (2 minutes)
- Session TTL: 3600s (1 hour)
- Require re-authentication for sensitive operations

**Standard Applications:**
- Challenge TTL: 300s (5 minutes)
- Session TTL: 86400s (24 hours)
- Refresh TTL: 604800s (7 days)

## 🧪 Testing

### Unit Tests

```python
import pytest
from auth import WCSAPAuthenticator, get_config
from auth.schemas import AuthChallengeRequest, AuthVerifyRequest

def test_challenge_generation():
    """Test challenge generation."""
    config = get_config()
    authenticator = WCSAPAuthenticator(
        secret_key=config.secret_key,
        challenge_ttl=config.challenge_ttl
    )
    
    challenge = authenticator.initiate_authentication(
        wallet_address="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
    )
    
    assert challenge is not None
    assert challenge.wallet_address == "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
    assert len(challenge.challenge_id) == 64
```

### Integration Tests

```python
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_full_auth_flow():
    """Test complete authentication flow."""
    # Request challenge
    response = client.post("/api/auth/challenge", json={
        "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    
    # Verify signature (would need real signature in practice)
    # ...
```

## 📊 Monitoring & Logging

### Authentication Events

All authentication events are logged to the database:

```python
from auth import get_database

db = get_database()

# Get authentication history
history = db.get_auth_history(
    wallet_address="0x742d35...",
    limit=100
)

# Check for suspicious activity
failed_attempts = [
    event for event in history 
    if event['event_type'] == 'authentication_failed'
]
```

### Statistics

```bash
curl http://localhost:5000/api/auth/stats
```

```json
{
  "success": true,
  "statistics": {
    "active_sessions": 42,
    "pending_challenges": 5,
    "total_users": 120,
    "recent_auth_events_24h": 234
  }
}
```

## 🔄 Migration from Old Implementation

### Before (Non-standardized)

```python
from auth.w_csap import WCSAPAuthenticator

authenticator = WCSAPAuthenticator(
    secret_key="hardcoded_key",  # ❌ Not good
    challenge_ttl=300,
    session_ttl=86400
)

# Custom endpoint implementation
@app.post("/auth/challenge")
async def challenge(wallet: str):
    # Custom logic...
    pass
```

### After (Standardized)

```python
from auth import auth_router, get_config

# Configuration from environment
config = get_config()

# Include standardized routes
app.include_router(auth_router)

# Protected routes use dependencies
@app.get("/api/profile")
async def profile(wallet = Depends(get_current_wallet)):
    return {"wallet": wallet.address}
```

## 📚 Additional Resources

- **Full Documentation**: `/docs/security/W_CSAP_DOCUMENTATION.md`
- **Quick Start Guide**: `/docs/security/QUICK_START_W_CSAP.md`
- **API Reference**: http://localhost:5000/docs (Swagger UI)
- **Implementation Details**: `/docs/security/W_CSAP_ADVANCED_ENGINEERING.md`

## 🎉 Summary

The standardized W-CSAP authentication method provides:

✅ **Type-safe** request/response models  
✅ **Centralized** configuration management  
✅ **Consistent** error handling  
✅ **Ready-to-use** authentication routes  
✅ **Production-ready** security features  
✅ **Easy integration** with existing FastAPI apps  
✅ **Comprehensive** testing support  
✅ **Clear** API documentation  

---

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Protocol**: W-CSAP (Wallet-Based Cryptographic Session Assertion Protocol)
