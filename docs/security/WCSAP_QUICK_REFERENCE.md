# W-CSAP Quick Reference Card

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Generate secret key
python -c "import secrets; print('W_CSAP_SECRET_KEY=' + secrets.token_hex(32))"

# Add to .env
W_CSAP_SECRET_KEY=your_generated_key_here
```

### 2. FastAPI Integration

```python
from fastapi import FastAPI
from auth import auth_router, get_config, WCSAPAuthenticator, get_database
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    config = get_config()
    app.state.authenticator = WCSAPAuthenticator(
        secret_key=config.secret_key,
        challenge_ttl=config.challenge_ttl,
        session_ttl=config.session_ttl,
        refresh_ttl=config.refresh_ttl
    )
    app.state.auth_db = get_database(config.db_path)
    yield

app = FastAPI(lifespan=lifespan)
app.include_router(auth_router)
```

### 3. Protected Routes

```python
from auth import get_current_wallet, get_optional_wallet

@app.get("/api/profile")
async def profile(wallet = Depends(get_current_wallet)):
    return {"wallet": wallet["address"]}

@app.get("/api/public")
async def public(wallet = Depends(get_optional_wallet)):
    return {"wallet": wallet["address"] if wallet else None}
```

## 📡 API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/challenge` | POST | No | Request challenge |
| `/api/auth/verify` | POST | No | Verify signature |
| `/api/auth/refresh` | POST | No | Refresh session |
| `/api/auth/status` | GET | Optional | Check auth status |
| `/api/auth/logout` | POST | Yes | Logout |
| `/api/auth/sessions` | GET | Yes | List sessions |
| `/api/auth/stats` | GET | No | System statistics |

## 🔐 Authentication Flow

```
1. POST /api/auth/challenge
   → { wallet_address }
   ← { challenge_id, challenge_message }

2. Sign challenge_message with wallet

3. POST /api/auth/verify
   → { challenge_id, signature, wallet_address }
   ← { session: { session_token, refresh_token } }

4. Use session_token in Authorization header
   → Authorization: Bearer {session_token}
```

## 📦 Import Reference

### Schemas

```python
from auth.schemas import (
    AuthChallengeRequest, AuthChallengeResponse,
    AuthVerifyRequest, AuthVerifyResponse,
    AuthRefreshRequest, AuthRefreshResponse,
    AuthStatusResponse, AuthLogoutResponse,
    SessionData, WalletInfo
)
```

### Configuration

```python
from auth.config import get_config, WCSAPConfig

config = get_config()
secret = config.secret_key
ttl = config.session_ttl
```

### Error Handling

```python
from auth.errors import (
    WCSAPException,
    WCSAPErrorCode,
    InvalidSignatureException,
    ChallengeExpiredException,
    SessionExpiredException,
    RateLimitExceededException
)
```

### Routes & Dependencies

```python
from auth import (
    auth_router,
    get_current_wallet,
    get_optional_wallet
)
```

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `W_CSAP_SECRET_KEY` | Auto | HMAC signing key |
| `W_CSAP_CHALLENGE_TTL` | 300 | Challenge expiry (seconds) |
| `W_CSAP_SESSION_TTL` | 86400 | Session expiry (seconds) |
| `W_CSAP_REFRESH_TTL` | 604800 | Refresh token expiry (seconds) |
| `W_CSAP_DB_PATH` | `data/w_csap.db` | Database path |
| `W_CSAP_RATE_LIMIT_ENABLED` | true | Enable rate limiting |
| `W_CSAP_RATE_LIMIT_MAX_ATTEMPTS` | 5 | Max attempts per window |
| `W_CSAP_RATE_LIMIT_WINDOW_SECONDS` | 300 | Rate limit window |

## 🎨 Frontend Integration

### Request Challenge

```javascript
const res = await fetch('/api/auth/challenge', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ wallet_address: account })
});
const { challenge_id, challenge_message } = await res.json();
```

### Sign Challenge

```javascript
const signature = await ethereum.request({
  method: 'personal_sign',
  params: [challenge_message, account]
});
```

### Verify Signature

```javascript
const res = await fetch('/api/auth/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    challenge_id,
    signature,
    wallet_address: account
  })
});
const { session } = await res.json();
localStorage.setItem('session_token', session.session_token);
localStorage.setItem('refresh_token', session.refresh_token);
```

### Authenticated Requests

```javascript
const res = await fetch('/api/profile', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('session_token')}`
  }
});
```

### Refresh Session

```javascript
const res = await fetch('/api/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    session_token: localStorage.getItem('session_token'),
    refresh_token: localStorage.getItem('refresh_token')
  })
});
const { session } = await res.json();
localStorage.setItem('session_token', session.session_token);
```

## ❌ Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `CHALLENGE_NOT_FOUND` | 404 | Challenge doesn't exist |
| `CHALLENGE_EXPIRED` | 400 | Challenge has expired |
| `INVALID_SIGNATURE` | 401 | Signature verification failed |
| `WALLET_MISMATCH` | 401 | Wallet doesn't match |
| `SESSION_EXPIRED` | 401 | Session has expired |
| `INVALID_SESSION_TOKEN` | 401 | Token is invalid |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many attempts |
| `UNAUTHORIZED` | 401 | Not authenticated |

## 📊 Response Formats

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  // ... endpoint-specific data
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "field": "field_name",
    "details": { /* additional info */ }
  },
  "timestamp": 1704123456
}
```

## 🧪 Testing Example

```python
from fastapi.testclient import TestClient

def test_authentication():
    # Request challenge
    res = client.post("/api/auth/challenge", json={
        "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    
    # Verify (with real signature)
    # ...
```

## 🔒 Security Checklist

- [ ] Set `W_CSAP_SECRET_KEY` in production
- [ ] Enable HTTPS (`W_CSAP_REQUIRE_HTTPS=true`)
- [ ] Configure rate limiting
- [ ] Set appropriate session TTL
- [ ] Enable audit logging
- [ ] Monitor `/api/auth/stats`
- [ ] Review authentication events regularly

## 📚 Documentation

- **Full Guide**: `/docs/security/W_CSAP_STANDARDIZATION_GUIDE.md`
- **Summary**: `/WCSAP_STANDARDIZATION_SUMMARY.md`
- **API Docs**: `http://localhost:5000/docs`
- **Original Docs**: `/docs/security/W_CSAP_DOCUMENTATION.md`

---

**Quick Tip**: Run `python -c "from auth import get_config; print(get_config().get_summary())"` to see current configuration.
