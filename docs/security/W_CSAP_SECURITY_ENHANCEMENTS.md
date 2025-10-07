# W-CSAP Security Enhancements - Enterprise-Grade Hardening

## 📊 Security Assessment Summary

Based on expert security review, W-CSAP is **already strong** in key areas:
- ✅ **High** - Phishing resistance (wallet signatures, no reusable credentials)
- ✅ **High** - Replay of auth challenges (nonce + expiry + binding)
- ✅ **High** - MITM on transport (TLS 1.3 + HSTS)
- ✅ **High** - Credential stuffing (no passwords)
- ✅ **High** - Brute force on signatures (unforgeable wallet signatures)
- ✅ **High** - CSRF/Session fixation (Bearer token auth)
- ✅ **High** - Token tampering (HMAC assertion)
- ✅ **High** - Auditability (comprehensive logging)
- ✅ **High** - Privacy (PII-minimizing, wallet-based)

**Critical Gaps Identified:**
- ⚠️ **Medium** - API token replay (HMAC tokens aren't sender-constrained)
- ⚠️ **Medium** - Revocation (stateless tokens hard to revoke mid-lifetime)
- ⚠️ **Medium** - Device theft (no proof-of-possession)
- ⚠️ **Medium** - Key management (single HMAC secret)

## 🎯 Critical Security Enhancements

### 1. **Sender-Constrained Tokens (DPoP)** 🔴 CRITICAL

**Problem:** Current HMAC tokens can be replayed if stolen until expiry.

**Solution:** Implement DPoP (Demonstrating Proof-of-Possession):

```python
# Include wallet key thumbprint in token
session_token = {
    "assertion_id": "...",
    "wallet_address": "...",
    "cnf": {
        "jkt": "sha256_thumbprint_of_wallet_public_key"
    },
    "expires_at": ...,
    "hmac": "..."
}

# Require DPoP proof on each API call
dpop_proof = {
    "typ": "dpop+jwt",
    "alg": "ES256K",  # Wallet signature algorithm
    "jwk": {wallet_public_key}
}

dpop_payload = {
    "jti": "unique_proof_id",  # One-time use
    "htm": "GET",  # HTTP method
    "htu": "https://api.gigchain.io/api/profile",  # Target URI
    "iat": 1704123456,  # Timestamp
    "ath": "sha256_hash_of_access_token"  # Token binding
}

# Verify on each request:
# 1. DPoP header present
# 2. thumbprint(DPoP.jwk) == token.cnf.jkt
# 3. DPoP.ath == SHA256(access_token)
# 4. DPoP.htm == request.method
# 5. DPoP.htu == request.url
# 6. DPoP.iat within 60s skew
# 7. DPoP.jti not seen before (cache for 5 min)
```

**Impact:** Token replay risk: **Medium → High**

### 2. **Shorter Token TTLs + Rotating Refresh** 🔴 CRITICAL

**Current:**
- Challenge: 5 minutes ✅
- Access token: 24 hours ⚠️
- Refresh token: 7 days ⚠️

**Recommended:**
- Challenge: **5 minutes** ✅
- Access token: **10-15 minutes** 🔴
- Refresh token: **24 hours, rotating** 🔴

**Implementation:**

```python
# auth/config.py
class WCSAPConfig:
    # New shorter defaults
    access_token_ttl: int = Field(default=900, description="Access token TTL (15 min)")
    session_ttl: int = Field(default=86400, description="Session TTL (24h)")  # Kept for compatibility
    refresh_ttl: int = Field(default=86400, description="Refresh token TTL (24h, rotating)")
    
    # Rotation settings
    refresh_token_rotation: bool = Field(default=True, description="Rotate refresh tokens")
    refresh_token_reuse_window: int = Field(default=60, description="Grace period for token rotation")
```

**Refresh Token Rotation:**

```python
# On each refresh:
# 1. Validate old refresh token
# 2. Generate NEW refresh token
# 3. Invalidate old refresh token (store RT ID in denylist)
# 4. Allow 60s grace period for duplicate requests (race conditions)

db.save_refresh_token_family(
    rt_id="new_rt_id",
    parent_rt_id="old_rt_id",  # Chain for audit
    wallet_address="...",
    issued_at=now,
    expires_at=now + 86400
)

db.revoke_refresh_token("old_rt_id")
```

**Impact:** Reduces blast radius of stolen tokens dramatically.

### 3. **Revocation Denylist** 🔴 CRITICAL

**Problem:** Stateless HMAC tokens can't be revoked until expiry.

**Solution:** Implement lightweight denylist cache:

```python
class RevocationCache:
    """
    In-memory cache for revoked tokens (backed by Redis in production).
    Only needs to cache until token would naturally expire.
    """
    
    def __init__(self):
        self.cache = {}  # Use Redis in production
    
    def revoke_assertion(self, assertion_id: str, expires_at: int):
        """Revoke an assertion ID until its natural expiry."""
        ttl = expires_at - int(time.time())
        if ttl > 0:
            self.cache[assertion_id] = expires_at
            # In Redis: SET assertion_id 1 EX ttl
    
    def is_revoked(self, assertion_id: str) -> bool:
        """Check if assertion is revoked."""
        if assertion_id in self.cache:
            if int(time.time()) < self.cache[assertion_id]:
                return True
            else:
                del self.cache[assertion_id]
        return False
    
    def cleanup_expired(self):
        """Remove expired entries."""
        now = int(time.time())
        self.cache = {k: v for k, v in self.cache.items() if v > now}
```

**High-Risk Event Revocation:**

```python
# Revoke all sessions on:
# - Password reset (if implemented)
# - Suspicious IP/device change
# - User-initiated "logout all devices"
# - Admin-initiated security response

def revoke_all_sessions(wallet_address: str):
    """Revoke all active sessions for a wallet."""
    db = get_database()
    sessions = db.get_active_sessions_by_wallet(wallet_address)
    
    revocation_cache = get_revocation_cache()
    for session in sessions:
        revocation_cache.revoke_assertion(
            session['assertion_id'],
            session['expires_at']
        )
        db.invalidate_session(session['assertion_id'])
```

### 4. **Audience & Scope Limiting** 🟡 HIGH

**Add to token claims:**

```python
session_token = {
    "assertion_id": "...",
    "wallet_address": "...",
    "aud": "api.gigchain.io",  # Intended audience
    "scope": "profile gigs contracts",  # Permissions
    "tenant": "main",  # Multi-tenancy support
    "roles": ["freelancer"],  # User roles
    "iss": "auth.gigchain.io",  # Issuer
    "sub": wallet_address,  # Subject
    "cnf": {"jkt": "..."},  # Wallet key thumbprint
    "iat": 1704123456,
    "exp": 1704124356,
    "nbf": 1704123456
}
```

**Validation on protected routes:**

```python
async def get_current_wallet_scoped(
    required_scope: str = "profile",
    required_aud: str = "api.gigchain.io"
):
    """Enhanced dependency with scope validation."""
    wallet = await get_current_wallet(request, credentials)
    
    # Validate audience
    if wallet["session"].get("aud") != required_aud:
        raise UnauthorizedException("Invalid token audience")
    
    # Validate scope
    token_scopes = wallet["session"].get("scope", "").split()
    if required_scope not in token_scopes:
        raise UnauthorizedException(f"Missing required scope: {required_scope}")
    
    return wallet
```

### 5. **Asymmetric Tokens (ES256/EdDSA)** 🟡 HIGH

**Problem:** Single HMAC secret compromises all tokens.

**Solution:** Use asymmetric signing for access tokens:

```python
# Generate ES256 key pair (store in KMS/HSM)
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization

private_key = ec.generate_private_key(ec.SECP256R1())
public_key = private_key.public_key()

# Sign access tokens with private key
import jwt

access_token = jwt.encode(
    payload={
        "sub": wallet_address,
        "aud": "api.gigchain.io",
        "scope": "profile gigs",
        "cnf": {"jkt": wallet_thumbprint},
        "iat": now,
        "exp": now + 900,  # 15 min
    },
    key=private_key,
    algorithm="ES256"
)

# Verify with public key (can be cached/distributed)
payload = jwt.decode(
    access_token,
    key=public_key,
    algorithms=["ES256"],
    audience="api.gigchain.io"
)
```

**Benefits:**
- ✅ Public key can be distributed (no secret leakage)
- ✅ Each service can verify independently
- ✅ Easier key rotation (distribute new public key)
- ✅ Compromise of one key doesn't affect others

### 6. **Key Management (KMS/HSM)** 🟡 HIGH

**Implementation with AWS KMS:**

```python
import boto3

kms = boto3.client('kms')

class KMSKeyManager:
    """Manage signing keys in AWS KMS."""
    
    def __init__(self, key_id: str):
        self.key_id = key_id
    
    def sign(self, message: bytes) -> bytes:
        """Sign message using KMS key."""
        response = kms.sign(
            KeyId=self.key_id,
            Message=message,
            MessageType='RAW',
            SigningAlgorithm='ECDSA_SHA_256'
        )
        return response['Signature']
    
    def verify(self, message: bytes, signature: bytes) -> bool:
        """Verify signature using KMS key."""
        response = kms.verify(
            KeyId=self.key_id,
            Message=message,
            MessageType='RAW',
            Signature=signature,
            SigningAlgorithm='ECDSA_SHA_256'
        )
        return response['SignatureValid']
    
    def rotate_key(self):
        """Enable automatic key rotation."""
        kms.enable_key_rotation(KeyId=self.key_id)
```

**Key Rotation Schedule:**
- Access token signing key: **90 days**
- HMAC secrets (if still used): **90 days**
- Refresh token secrets: **180 days**
- Audit all key changes

### 7. **Enhanced Challenge Security** 🟢 MEDIUM

**Current challenge is good, but add:**

```python
def _create_challenge_message(
    self,
    challenge_id: str,
    wallet_address: str,
    nonce: str,
    issued_at: int,
    expires_at: int,
    chain_id: int = 1,  # Add chain binding
    domain: str = "gigchain.io"  # Add domain binding
) -> str:
    """
    SIWE-style challenge message with full binding.
    """
    issued_dt = datetime.fromtimestamp(issued_at).isoformat()
    expires_dt = datetime.fromtimestamp(expires_at).isoformat()
    
    return f"""🔐 {domain} - Wallet Authentication

I authorize {domain} to authenticate me.

URI: https://{domain}
Chain ID: {chain_id}
Wallet: {wallet_address}
Nonce: {nonce}
Challenge ID: {challenge_id[:16]}...

Issued At: {issued_dt}
Expires: {expires_dt}

⚠️ Only sign this if you initiated login on {domain}.
Never share this signature.

Security: This is a one-time authentication challenge."""
```

### 8. **Transport & Network Hardening** 🟢 MEDIUM

**TLS Configuration:**

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    
    # TLS 1.3 only
    ssl_protocols TLSv1.3;
    
    # Strong ciphers
    ssl_ciphers 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256';
    ssl_prefer_server_ciphers off;
    
    # HSTS with preload
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    
    # CSP
    add_header Content-Security-Policy "default-src 'none'; script-src 'self'; connect-src 'self'; img-src 'self'; style-src 'self';" always;
    
    # Other headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

**Rate Limiting (Enhanced):**

```python
# auth/config.py
class RateLimitConfig:
    challenge_requests: int = 5  # per 5 min per IP
    verify_requests: int = 5  # per 5 min per wallet
    refresh_requests: int = 10  # per hour per wallet
    
    # Burst allowance
    challenge_burst: int = 10
    verify_burst: int = 10
    
    # Lockout
    max_failed_attempts: int = 5
    lockout_duration: int = 900  # 15 min
```

## 📊 Updated Security Scorecard (Post-Enhancements)

| Threat / Property | Before | After Enhancements | Mitigation |
|-------------------|--------|-------------------|------------|
| Phishing resistance | High | **High** | Wallet signatures, SIWE-style |
| Replay of auth challenge | High | **High** | Nonce + expiry + domain binding |
| **API token replay** | Medium | **High** 🎯 | **DPoP sender-constrained tokens** |
| MITM on transport | High | **High** | TLS 1.3 + HSTS preload |
| Credential stuffing | High | **High** | No passwords |
| Brute force | High | **High** | Wallet signatures unforgeable |
| CSRF/Session fixation | High | **High** | Bearer auth + DPoP |
| Token tamper | High | **High** | HMAC/JWT signatures |
| **Revocation** | Medium | **High** 🎯 | **Denylist cache + short TTLs** |
| **Device theft** | Medium | **High** 🎯 | **DPoP proof-of-possession** |
| **Key management** | Medium | **High** 🎯 | **KMS/HSM + asymmetric tokens** |
| Auditability | High | **High** | Comprehensive logging |
| Privacy | High | **High** | PII-minimizing |

## 🎯 Implementation Priority

### Phase 1: Critical (Immediate) 🔴

1. **Shorten access token TTL** to 15 minutes
2. **Implement rotating refresh tokens** (24h)
3. **Add revocation denylist** cache
4. **Enhanced rate limiting** on auth endpoints
5. **TLS 1.3 + HSTS** enforcement

### Phase 2: High (1-2 weeks) 🟡

1. **Implement DPoP** sender-constrained tokens
2. **Add audience & scope** claims to tokens
3. **Asymmetric signing** (ES256) for access tokens
4. **KMS integration** for key storage
5. **Enhanced challenge** with domain/chain binding

### Phase 3: Medium (1 month) 🟢

1. **Device risk scoring** (IP/UA changes)
2. **Step-up authentication** for sensitive ops
3. **Token introspection** endpoint
4. **JWKS endpoint** for public keys
5. **SDK/client libraries** for DPoP

## 📋 Configuration Template (Enterprise-Grade)

```bash
# .env - Enterprise Security Configuration

# Signing Keys (KMS ARNs in production)
W_CSAP_ACCESS_TOKEN_KEY_ID=arn:aws:kms:us-east-1:123456789:key/...
W_CSAP_REFRESH_TOKEN_SECRET=generate_with_secrets.token_hex(32)

# Token TTLs (aggressive for security)
W_CSAP_CHALLENGE_TTL=300          # 5 min
W_CSAP_ACCESS_TOKEN_TTL=900       # 15 min (was 24h)
W_CSAP_REFRESH_TTL=86400          # 24h rotating (was 7d)

# DPoP Settings
W_CSAP_DPOP_ENABLED=true
W_CSAP_DPOP_CLOCK_SKEW=60         # 60s tolerance
W_CSAP_DPOP_NONCE_CACHE_TTL=300   # 5 min

# Revocation
W_CSAP_REVOCATION_CACHE_ENABLED=true
W_CSAP_REVOCATION_CACHE_TYPE=redis  # redis or memory
W_CSAP_REDIS_URL=redis://localhost:6379/0

# Token Claims
W_CSAP_TOKEN_AUDIENCE=api.gigchain.io
W_CSAP_TOKEN_ISSUER=auth.gigchain.io
W_CSAP_DEFAULT_SCOPE=profile

# Rate Limiting (strict)
W_CSAP_RATE_LIMIT_CHALLENGE=5     # per 5min
W_CSAP_RATE_LIMIT_VERIFY=5        # per 5min
W_CSAP_RATE_LIMIT_REFRESH=10      # per hour
W_CSAP_MAX_FAILED_ATTEMPTS=5
W_CSAP_LOCKOUT_DURATION=900       # 15 min

# Security Hardening
W_CSAP_REQUIRE_HTTPS=true
W_CSAP_REQUIRE_TLS_13=true
W_CSAP_STRICT_TRANSPORT_SECURITY=true
W_CSAP_SESSION_BINDING_ENABLED=true  # Bind to IP/UA

# Key Rotation
W_CSAP_KEY_ROTATION_DAYS=90
W_CSAP_KEY_ROTATION_NOTIFY=true

# Audit & Monitoring
W_CSAP_AUDIT_LOG_LEVEL=INFO
W_CSAP_SECURITY_EVENT_WEBHOOK=https://...
W_CSAP_ANOMALY_DETECTION_ENABLED=true
```

## 🔒 Residual Risks & Mitigations

### 1. Wallet Key Compromise

**Risk:** If user's wallet private key is stolen, attacker can authenticate.

**Mitigations:**
- ✅ Device risk scoring (flag new devices/IPs)
- ✅ Step-up authentication for high-value operations
- ✅ Quick revocation mechanisms
- ✅ Optional hardware wallet requirement for sensitive accounts
- ✅ Social recovery as backup (future)
- ✅ Passkey-wrapped wallet option (future)

### 2. Client Device Compromise

**Risk:** Malware on user's device can steal active sessions.

**Mitigations:**
- ✅ DPoP makes stolen tokens useless off-device
- ✅ Short token TTLs limit blast radius
- ✅ OS-level key storage (Keychain/TPM)
- ✅ Biometric unlock requirements
- ✅ Session anomaly detection

### 3. Server Secret Leakage

**Risk:** Compromise of signing secrets invalidates all tokens.

**Mitigations:**
- ✅ KMS/HSM for key storage (no secrets in app)
- ✅ Asymmetric tokens (public keys only in app)
- ✅ 90-day key rotation
- ✅ Audit logging of key access
- ✅ Separate keys per environment/service

### 4. Seed Phrase Phishing

**Risk:** Users tricked into revealing wallet seed phrases.

**Mitigations:**
- ✅ Education in UI (never share seed phrases)
- ✅ Hardware wallet support
- ✅ Optional passkey-based wallets
- ✅ Social recovery mechanisms

### 5. Ecosystem Interoperability

**Risk:** Custom protocol means no out-of-box third-party support.

**Mitigations:**
- ✅ Publish comprehensive SDKs
- ✅ OpenAPI/Swagger documentation
- ✅ Example integrations
- ✅ OAuth2/OIDC compatibility layer (future)

## 📊 Comparison with Industry Standards

### vs Password + MFA

| Property | Password + TOTP | W-CSAP (Enhanced) | Winner |
|----------|----------------|-------------------|---------|
| Phishing resistance | Medium (OTP phishable) | High (signature-based) | **W-CSAP** |
| Credential reuse | High risk | No credentials | **W-CSAP** |
| Device binding | No | Yes (with DPoP) | **W-CSAP** |
| UX friction | High (2 steps) | Medium (1 sign) | **W-CSAP** |
| Recovery UX | Easy (reset) | Hard (seed phrase) | **Password** |

### vs WebAuthn/Passkeys

| Property | WebAuthn | W-CSAP (Enhanced) | Notes |
|----------|----------|-------------------|-------|
| Phishing resistance | Very High | High | WebAuthn slightly better (origin binding) |
| Device binding | Native | DPoP-based | WebAuthn native, W-CSAP added |
| Cross-device | Improving | Good (wallet on any device) | Tie |
| Standards compliance | W3C Standard | Custom | WebAuthn wins on interop |
| Blockchain integration | None | Native | W-CSAP wins for Web3 |

### vs OAuth2/OIDC

| Property | OIDC | W-CSAP (Enhanced) | Notes |
|----------|------|-------------------|-------|
| Complexity | High (redirects, IdP) | Medium | W-CSAP simpler |
| Centralization | Requires IdP | Decentralized | W-CSAP decentralized |
| Token security | Varies | High (with DPoP) | Tie with OIDC+DPOP |
| SSO support | Native | Custom | OIDC wins |
| Ecosystem | Mature | New | OIDC wins |

## ✅ Conclusion

**W-CSAP (with enhancements) is enterprise-grade strong:**

✅ **On par with Password+MFA** when fully hardened  
✅ **Comparable to WebAuthn** with DPoP implementation  
✅ **Stronger than basic OAuth2** (no IdP phishing, fewer redirects)  
✅ **Native Web3 integration** (wallets, signatures)  
✅ **Decentralized** (no centralized IdP dependency)  

**Priority order:**
1. 🔴 **Phase 1** (Critical): Short TTLs, rotating refresh, revocation, rate limits
2. 🟡 **Phase 2** (High): DPoP, audience/scope, asymmetric tokens, KMS
3. 🟢 **Phase 3** (Medium): Device risk, step-up, introspection, SDKs

Implement Phase 1 immediately, Phase 2 within 2 weeks, and you'll have a **WebAuthn-level, enterprise-grade authentication system** without centralized IdPs.

---

**Next Steps:**
1. Review this enhancement plan
2. Prioritize Phase 1 (critical) improvements
3. Begin implementation with DPoP and short TTLs
4. Test thoroughly in staging
5. Roll out incrementally to production
6. Monitor security metrics continuously

**Status**: 📋 Enhancement Plan Complete  
**Classification**: Enterprise Security Hardening  
**Target**: WebAuthn-level strength, decentralized
