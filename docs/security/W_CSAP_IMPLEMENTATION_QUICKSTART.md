# W-CSAP Implementation Quickstart
## From Zero to Production in 30 Minutes

---

## 🎯 What You'll Learn

This guide provides **immediate, actionable steps** to implement W-CSAP in your system.

**Prerequisites:**
- Python 3.8+ OR Node.js 14+
- Understanding of REST APIs
- Basic blockchain/wallet knowledge

---

## Step 1: Generate W_CSAP_SECRET_KEY (2 minutes)

### Method A: Python (Recommended)

```bash
python3 -c "import secrets; print(f'W_CSAP_SECRET_KEY={secrets.token_hex(32)}')"
```

**Output:**
```
W_CSAP_SECRET_KEY=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

### Method B: OpenSSL

```bash
echo "W_CSAP_SECRET_KEY=$(openssl rand -hex 32)"
```

### Method C: Node.js

```javascript
const crypto = require('crypto');
console.log(`W_CSAP_SECRET_KEY=${crypto.randomBytes(32).toString('hex')}`);
```

### ⚠️ CRITICAL: Store Securely

```bash
# Add to .env (NEVER commit!)
echo "W_CSAP_SECRET_KEY=your_generated_key_here" >> .env
echo ".env" >> .gitignore
```

---

## Step 2: Backend Setup (5 minutes)

### Python/FastAPI

```bash
# Install dependencies
pip install fastapi uvicorn web3 eth-account python-dotenv

# Copy W-CSAP files
cp auth/w_csap.py your_project/auth/
cp auth/database.py your_project/auth/
cp auth/middleware.py your_project/auth/
```

**Minimal Implementation:**

```python
# main.py
from fastapi import FastAPI, Depends
from auth.w_csap import WCSAPAuthenticator
from auth.middleware import get_current_wallet
import os

app = FastAPI()

# Initialize W-CSAP
authenticator = WCSAPAuthenticator(
    secret_key=os.getenv('W_CSAP_SECRET_KEY'),
    challenge_ttl=300,     # 5 minutes
    session_ttl=86400,     # 24 hours
    refresh_ttl=604800     # 7 days
)

# Public: Request challenge
@app.post("/api/auth/challenge")
async def challenge(body: dict):
    challenge = authenticator.initiate_authentication(body['wallet_address'])
    return challenge.to_dict()

# Public: Verify signature
@app.post("/api/auth/verify")
async def verify(body: dict):
    session = authenticator.complete_authentication(
        body['challenge_id'],
        body['signature'],
        body['wallet_address']
    )
    return session.to_dict() if session else {"error": "Invalid"}

# Protected: Profile
@app.get("/api/profile")
async def profile(wallet: dict = Depends(get_current_wallet)):
    return {"wallet": wallet['wallet_address']}

# Run: python main.py
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
```

### Node.js/Express

```bash
npm install express web3 axios dotenv
```

```javascript
// server.js
const express = require('express');
const Web3 = require('web3');
const axios = require('axios');
require('dotenv').config();

const app = express();
const web3 = new Web3();

app.use(express.json());

// Authentication middleware
async function authenticateWCSAP(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'No token' });
    }
    
    try {
        const response = await axios.post('http://localhost:5000/api/auth/status', {
            session_token: token
        });
        
        req.wallet = response.data;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
}

// Protected route
app.get('/api/profile', authenticateWCSAP, (req, res) => {
    res.json({ wallet: req.wallet.wallet_address });
});

app.listen(3000, () => console.log('Server on port 3000'));
```

---

## Step 3: Frontend Setup (10 minutes)

### React Hook

```bash
npm install web3 axios
```

**Create `hooks/useWalletAuth.js`:**

```javascript
import { useState, useEffect } from 'react';
import Web3 from 'web3';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export function useWalletAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [wallet, setWallet] = useState(null);
    const [error, setError] = useState(null);

    // Check for existing session on mount
    useEffect(() => {
        const token = localStorage.getItem('w_csap_token');
        if (token) {
            validateSession(token);
        }
    }, []);

    const login = async () => {
        setIsAuthenticating(true);
        setError(null);

        try {
            // Step 1: Get wallet address
            const web3 = new Web3(window.ethereum);
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            const walletAddress = accounts[0];

            // Step 2: Request challenge
            const challengeRes = await axios.post(`${API_URL}/api/auth/challenge`, {
                wallet_address: walletAddress
            });

            const { challenge_id, challenge_message } = challengeRes.data;

            // Step 3: Sign challenge
            const signature = await web3.eth.personal.sign(
                challenge_message,
                walletAddress,
                ''
            );

            // Step 4: Verify signature
            const verifyRes = await axios.post(`${API_URL}/api/auth/verify`, {
                challenge_id,
                signature,
                wallet_address: walletAddress
            });

            const { session_token, refresh_token } = verifyRes.data;

            // Step 5: Store tokens
            localStorage.setItem('w_csap_token', session_token);
            localStorage.setItem('w_csap_refresh', refresh_token);

            setIsAuthenticated(true);
            setWallet(walletAddress);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsAuthenticating(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('w_csap_token');
        localStorage.removeItem('w_csap_refresh');
        setIsAuthenticated(false);
        setWallet(null);
    };

    const validateSession = async (token) => {
        try {
            const res = await axios.get(`${API_URL}/api/auth/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setIsAuthenticated(true);
            setWallet(res.data.wallet_address);
        } catch {
            logout();
        }
    };

    const authenticatedFetch = async (url, options = {}) => {
        const token = localStorage.getItem('w_csap_token');
        
        return fetch(`${API_URL}${url}`, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`
            }
        });
    };

    return {
        isAuthenticated,
        isAuthenticating,
        wallet,
        error,
        login,
        logout,
        authenticatedFetch
    };
}
```

### React Component

```javascript
// components/WalletAuth.jsx
import React from 'react';
import { useWalletAuth } from '../hooks/useWalletAuth';

export function WalletAuth() {
    const { 
        isAuthenticated, 
        isAuthenticating, 
        wallet, 
        error, 
        login, 
        logout 
    } = useWalletAuth();

    if (isAuthenticated) {
        return (
            <div className="wallet-auth">
                <p>Connected: {wallet?.slice(0, 6)}...{wallet?.slice(-4)}</p>
                <button onClick={logout}>Disconnect</button>
            </div>
        );
    }

    return (
        <div className="wallet-auth">
            {error && <p className="error">{error}</p>}
            <button 
                onClick={login} 
                disabled={isAuthenticating}
            >
                {isAuthenticating ? 'Connecting...' : 'Connect Wallet'}
            </button>
        </div>
    );
}
```

---

## Step 4: Integration Patterns (5 minutes)

### Pattern A: Microservices (Token Validation)

```python
# service_b.py (another microservice)
import hmac
import hashlib
import time

SECRET_KEY = os.getenv('W_CSAP_SECRET_KEY')

def validate_token(token: str) -> dict:
    """
    Stateless token validation (no database needed).
    Works across all microservices with same SECRET_KEY.
    """
    try:
        parts = token.split('.')
        if len(parts) != 4:
            return None
        
        assertion_id, wallet, expires_at, token_hmac = parts
        
        # Check expiry
        if int(time.time()) >= int(expires_at):
            return None
        
        # Verify HMAC
        expected_hmac = hmac.new(
            SECRET_KEY.encode(),
            f"{assertion_id}:{wallet}:{expires_at}".encode(),
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(token_hmac, expected_hmac):
            return None
        
        return {'wallet_address': wallet, 'expires_at': int(expires_at)}
    except:
        return None
```

### Pattern B: Blockchain Integration (NFT Gating)

```python
from web3 import Web3

def verify_nft_ownership(wallet: str, nft_contract: str) -> bool:
    """
    Verify NFT ownership before authentication.
    """
    w3 = Web3(Web3.HTTPProvider(os.getenv('WEB3_PROVIDER_URL')))
    
    erc721_abi = [{
        "constant": True,
        "inputs": [{"name": "owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    }]
    
    contract = w3.eth.contract(
        address=Web3.to_checksum_address(nft_contract),
        abi=erc721_abi
    )
    
    balance = contract.functions.balanceOf(
        Web3.to_checksum_address(wallet)
    ).call()
    
    return balance > 0

# Use in challenge endpoint
@app.post("/api/auth/challenge")
async def challenge_with_nft(body: dict):
    wallet = body['wallet_address']
    
    # Check NFT ownership
    if not verify_nft_ownership(wallet, NFT_CONTRACT_ADDRESS):
        raise HTTPException(403, "Must own NFT to authenticate")
    
    # Proceed with normal W-CSAP
    challenge = authenticator.initiate_authentication(wallet)
    return challenge.to_dict()
```

### Pattern C: GraphQL Integration

```python
import strawberry
from strawberry.fastapi import GraphQLRouter

@strawberry.type
class User:
    wallet_address: str

@strawberry.type
class Query:
    @strawberry.field
    async def me(self, info) -> User:
        token = info.context['request'].headers.get('authorization', '').replace('Bearer ', '')
        
        is_valid, data = authenticator.validate_session(token)
        
        if not is_valid:
            raise Exception("Not authenticated")
        
        return User(wallet_address=data['wallet_address'])

schema = strawberry.Schema(query=Query)
graphql_app = GraphQLRouter(schema)

app.include_router(graphql_app, prefix="/graphql")
```

---

## Step 5: Production Setup (8 minutes)

### Environment Variables

```bash
# .env.production
W_CSAP_SECRET_KEY=your_production_key_here
W_CSAP_CHALLENGE_TTL=300
W_CSAP_SESSION_TTL=86400
W_CSAP_REFRESH_TTL=604800
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379/0
ALLOWED_ORIGINS=https://yourdomain.com
```

### HTTPS Configuration (nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    
    location /api/auth/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Docker Compose (Optional)

```yaml
version: '3.8'
services:
  backend:
    build: .
    environment:
      - W_CSAP_SECRET_KEY=${W_CSAP_SECRET_KEY}
    ports:
      - "5000:5000"
    depends_on:
      - redis
      - postgres
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=w_csap
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## Step 6: Testing (5 minutes)

### Test with cURL

```bash
# 1. Request challenge
curl -X POST http://localhost:5000/api/auth/challenge \
  -H "Content-Type: application/json" \
  -d '{"wallet_address": "0x1234567890123456789012345678901234567890"}'

# 2. Sign message in MetaMask (manually)

# 3. Verify signature
curl -X POST http://localhost:5000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "challenge_id": "...",
    "signature": "0x...",
    "wallet_address": "0x1234567890123456789012345678901234567890"
  }'

# 4. Access protected route
curl -X GET http://localhost:5000/api/profile \
  -H "Authorization: Bearer your_session_token_here"
```

### Automated Test Suite

```bash
# Run W-CSAP tests
python tests/test_w_csap_auth.py

# Or with pytest
pytest tests/test_w_csap_auth.py -v
```

---

## Common Integration Scenarios

### Scenario 1: Add W-CSAP to Existing JWT System

```python
# Dual authentication support
@app.get("/api/data")
async def get_data(request: Request):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    
    # Try W-CSAP first
    is_valid, wallet_data = authenticator.validate_session(token)
    if is_valid:
        return {"user": wallet_data['wallet_address']}
    
    # Fallback to JWT
    try:
        jwt_data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return {"user": jwt_data['user_id']}
    except:
        raise HTTPException(401, "Invalid token")
```

### Scenario 2: Multi-Chain Support

```python
SUPPORTED_CHAINS = ['ethereum', 'polygon', 'bsc', 'avalanche']

@app.post("/api/auth/challenge")
async def multi_chain_challenge(body: dict):
    wallet = body['wallet_address']
    chain = body.get('chain', 'ethereum')
    
    if chain not in SUPPORTED_CHAINS:
        raise HTTPException(400, f"Unsupported chain: {chain}")
    
    challenge = authenticator.initiate_authentication(wallet)
    challenge.metadata['chain'] = chain
    
    return challenge.to_dict()
```

### Scenario 3: DAO-Gated Access

```python
from web3 import Web3

w3 = Web3(Web3.HTTPProvider(os.getenv('WEB3_PROVIDER')))

def check_dao_membership(wallet: str) -> bool:
    dao_contract = w3.eth.contract(
        address=DAO_CONTRACT_ADDRESS,
        abi=DAO_ABI
    )
    
    voting_power = dao_contract.functions.getVotes(
        Web3.to_checksum_address(wallet)
    ).call()
    
    return voting_power > 0

@app.post("/api/auth/challenge")
async def dao_gated_challenge(body: dict):
    wallet = body['wallet_address']
    
    if not check_dao_membership(wallet):
        raise HTTPException(403, "Must be DAO member")
    
    return authenticator.initiate_authentication(wallet).to_dict()
```

---

## Troubleshooting

### Issue 1: Signature Verification Fails

**Symptoms:** Always returns "Invalid signature"

**Solutions:**
1. Ensure wallet is signing the **exact** challenge message
2. Verify EIP-191 encoding is used
3. Check wallet address case (use checksum address)

```python
# Debug signature verification
from web3 import Web3

wallet = Web3.to_checksum_address("0x1234...")  # Always use checksum
```

### Issue 2: Challenge Expired

**Symptoms:** "Challenge expired" error

**Solutions:**
1. Increase TTL: `challenge_ttl=600` (10 minutes)
2. Show countdown in UI
3. Auto-refresh expired challenges

```javascript
// Auto-refresh on expiry
useEffect(() => {
    if (challenge?.expires_at) {
        const timeLeft = challenge.expires_at - Math.floor(Date.now() / 1000);
        
        if (timeLeft < 0) {
            // Auto-refresh
            refreshChallenge();
        }
    }
}, [challenge]);
```

### Issue 3: CORS Errors

**Symptoms:** "CORS policy blocked"

**Solutions:**

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Security Checklist

Before going to production:

- [ ] ✅ W_CSAP_SECRET_KEY is cryptographically random (256 bits)
- [ ] ✅ Secret stored in secure location (not in code)
- [ ] ✅ HTTPS enabled (TLS 1.3)
- [ ] ✅ CORS configured (no wildcards)
- [ ] ✅ Rate limiting enabled
- [ ] ✅ Session binding configured (IP/User-Agent)
- [ ] ✅ Audit logging enabled
- [ ] ✅ Monitoring & alerting set up
- [ ] ✅ Backup SECRET_KEY stored securely
- [ ] ✅ Key rotation plan documented

---

## Performance Optimization

### Enable Redis Caching

```python
import redis.asyncio as redis

redis_client = redis.from_url(os.getenv('REDIS_URL'))

async def validate_session_cached(token: str):
    # Try cache first
    cached = await redis_client.get(f"session:{token}")
    if cached:
        return True, json.loads(cached)
    
    # Fallback to HMAC validation
    is_valid, data = authenticator.validate_session(token)
    
    if is_valid:
        # Cache for 1 hour
        await redis_client.setex(f"session:{token}", 3600, json.dumps(data))
    
    return is_valid, data
```

### Database Indexes

```sql
-- Ensure these indexes exist
CREATE INDEX idx_challenges_wallet ON challenges(wallet_address);
CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_auth_events_wallet ON auth_events(wallet_address);
```

---

## Next Steps

1. **Read Full Documentation:**
   - `docs/security/W_CSAP_ADVANCED_ENGINEERING.md`
   - `docs/security/W_CSAP_DOCUMENTATION.md`

2. **Implement Advanced Features:**
   - Multi-chain support
   - NFT/Token gating
   - On-chain verification

3. **Production Hardening:**
   - Set up monitoring (Prometheus, Grafana)
   - Configure DDoS protection
   - Implement key rotation

4. **Testing:**
   - Load testing (Locust, k6)
   - Security audit
   - Penetration testing

---

**Time to Production:** 30 minutes  
**Difficulty:** Intermediate  
**Support:** See full documentation for advanced scenarios

🚀 Happy coding!
