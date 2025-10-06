# W-CSAP Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
pip install web3 eth-account fastapi uvicorn python-dotenv pydantic
```

Or use the automated setup:

```bash
python setup_w_csap.py
```

### Step 2: Configure Environment

Add to your `.env` file:

```bash
W_CSAP_SECRET_KEY=your_secret_key_here
```

Generate a secure key:

```python
import secrets
print(secrets.token_hex(32))
```

### Step 3: Start Backend

```bash
python main.py
```

Server will start at `http://localhost:5000`

### Step 4: Test Authentication

#### Option A: Using cURL

```bash
# 1. Request Challenge
curl -X POST http://localhost:5000/api/auth/challenge \
  -H "Content-Type: application/json" \
  -d '{"wallet_address": "0x1234567890123456789012345678901234567890"}'

# Response:
# {
#   "challenge_id": "abc123...",
#   "challenge_message": "🔐 GigChain.io - Wallet Authentication...",
#   "expires_at": 1704123456
# }

# 2. Sign message with your wallet (MetaMask, etc.)
# signature = "0xabcdef..."

# 3. Verify Signature
curl -X POST http://localhost:5000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "challenge_id": "abc123...",
    "signature": "0xabcdef...",
    "wallet_address": "0x1234567890123456789012345678901234567890"
  }'

# Response:
# {
#   "success": true,
#   "session_token": "assertion_id.wallet.expires.hmac",
#   "refresh_token": "refresh_token_hmac",
#   "expires_in": 86400
# }

# 4. Use Session Token
curl http://localhost:5000/api/profile \
  -H "Authorization: Bearer <session_token>"
```

#### Option B: Using Frontend

```jsx
import { useWalletAuth } from './hooks/useWalletAuth';

function LoginButton() {
  const { isAuthenticated, login, logout } = useWalletAuth();
  
  return (
    <button onClick={isAuthenticated ? logout : login}>
      {isAuthenticated ? 'Logout' : 'Sign In with Wallet'}
    </button>
  );
}
```

### Step 5: Protect Your Routes

```python
from fastapi import Depends
from auth import get_current_wallet

@app.get("/api/protected")
async def protected_route(wallet: Dict = Depends(get_current_wallet)):
    return {
        "message": "You are authenticated!",
        "wallet": wallet["address"]
    }
```

---

## 🎯 Common Use Cases

### Use Case 1: User Profile

```python
@app.get("/api/user/profile")
async def get_profile(wallet: Dict = Depends(get_current_wallet)):
    return {
        "wallet_address": wallet["address"],
        "joined_at": wallet["session"]["created_at"],
        "session_expires_in": wallet["expires_in"]
    }
```

### Use Case 2: Contract Creation (Authenticated)

```python
@app.post("/api/contracts")
async def create_contract(
    contract: ContractRequest,
    wallet: Dict = Depends(get_current_wallet)
):
    # User is authenticated via wallet
    contract_data = generate_contract(contract.text)
    contract_data["creator_wallet"] = wallet["address"]
    
    # Save to database...
    
    return contract_data
```

### Use Case 3: Admin Routes

```python
from auth import admin_only

@app.post("/api/admin/settings")
@admin_only(["0xAdminWallet1...", "0xAdminWallet2..."])
async def admin_settings(
    settings: dict,
    wallet: Dict = Depends(get_current_wallet)
):
    # Only specific wallets can access
    return {"status": "updated"}
```

---

## 🔧 Configuration Options

### Basic Configuration

```python
WCSAPAuthenticator(
    secret_key="your_secret_key",
    challenge_ttl=300,      # 5 minutes
    session_ttl=86400,      # 24 hours
    refresh_ttl=604800      # 7 days
)
```

### High-Security Configuration

```python
WCSAPAuthenticator(
    secret_key="your_secret_key",
    challenge_ttl=120,      # 2 minutes
    session_ttl=3600,       # 1 hour
    refresh_ttl=86400       # 1 day
)
```

### Relaxed Configuration (Development)

```python
WCSAPAuthenticator(
    secret_key="dev_secret_key",
    challenge_ttl=600,      # 10 minutes
    session_ttl=604800,     # 7 days
    refresh_ttl=2592000     # 30 days
)
```

---

## 🐛 Troubleshooting

### Issue: "Invalid signature"

**Solution:**
- Ensure wallet is signing the exact challenge message
- Use EIP-191 encoding
- Verify wallet address matches

### Issue: "Challenge expired"

**Solution:**
- Increase `challenge_ttl` to 600 seconds
- Show countdown in UI
- Auto-refresh challenge

### Issue: "Session token invalid"

**Solution:**
- Check that secret key is consistent
- Verify token hasn't expired
- Use refresh token to get new session

---

## 📚 More Resources

- **Full Documentation:** [W_CSAP_DOCUMENTATION.md](./W_CSAP_DOCUMENTATION.md)
- **Test Suite:** [test_w_csap_auth.py](./test_w_csap_auth.py)
- **API Docs:** http://localhost:5000/docs

---

## ✨ What Makes W-CSAP Special?

1. **No Passwords** - Just sign with your wallet
2. **Decentralized** - No external identity providers
3. **Secure** - SAML-level security with cryptography
4. **Simple** - 3-step authentication flow
5. **Novel** - Never-before-seen protocol!

**Start building secure, wallet-based authentication today!** 🚀
