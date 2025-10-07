# 🧪 GigChain Testing Guide

## ⚠️ ENFOQUE ACTUAL: Testing Local

**NO DOCKER**: Usamos scripts de testing individuales con `python test_*.py`

## Testing Approach

### Desarrollo Local (ACTUAL)
- Tests individuales: `python test_chat.py`, `python test_api.py`
- Sin Docker, sin pytest en Docker
- FastAPI TestClient para tests de endpoints
- OpenAI mockeado donde sea necesario

### Testing Thirdweb Transactions

### 1. **Polygon Mumbai/Amoy Testnet Setup**

The application is configured to use **Polygon Amoy Testnet** for safe testing.

#### Get Testnet Tokens:
1. **Mumbai MATIC**: Get free testnet MATIC from [Polygon Faucet](https://faucet.polygon.technology/)
2. **Mumbai USDC**: Get testnet USDC from [Chainlink Faucet](https://faucets.chain.link/mumbai)

#### Testnet Details:
- **Network**: Polygon Mumbai
- **Chain ID**: 80001
- **RPC URL**: https://rpc-mumbai.maticvigil.com
- **Block Explorer**: https://mumbai.polygonscan.com

### 2. **Testing Workflow**

#### Step 1: Connect Wallet
1. Open `http://localhost:5173`
2. Click "Connect Wallet"
3. Select your wallet (MetaMask, WalletConnect, etc.)
4. Switch to Mumbai testnet in your wallet

#### Step 2: Test Contract Generation
1. Enter a test description:
   ```
   Freelancer ofrezco $2000 dolares para desarrollo web. 
   Cliente solicita $5000 dolares. Proyecto complejo de 20 días.
   ```
2. Click "Generate Smart Contract"
3. Wait for AI processing

#### Step 3: Test Contract Deployment
1. Review the generated contract
2. Click "Deploy Escrow Contract"
3. Confirm transaction in your wallet
4. Wait for deployment confirmation

### 3. **Testing Tools**

#### Thirdweb Dashboard
- Visit [Thirdweb Dashboard](https://thirdweb.com/dashboard)
- Monitor your deployed contracts
- View transaction history
- Test contract functions

#### Block Explorer
- Check transactions on [Mumbai Polygonscan](https://mumbai.polygonscan.com)
- Verify contract deployments
- Monitor gas usage

### 4. **Common Test Scenarios**

#### Scenario 1: Basic Contract Generation
```
Input: "Freelancer ofrezco $1000 para diseño logo. Cliente paga $500 inicial, $500 al finalizar."
Expected: AI generates contract with 2 milestones
```

#### Scenario 2: Complex Multi-Milestone Contract
```
Input: "Desarrollo app móvil: $2000 inicial, $3000 en prototipo, $5000 en versión final. 30 días total."
Expected: AI generates contract with 3 milestones and timeline
```

#### Scenario 3: Dispute Resolution
```
Input: "Freelancer y cliente no se ponen de acuerdo en precio. Freelancer quiere $3000, cliente ofrece $2000."
Expected: AI generates negotiation terms and dispute resolution clauses
```

### 5. **Debugging Tips**

#### Check Console Logs
- Open browser DevTools (F12)
- Check Console tab for errors
- Look for transaction hashes

#### Verify Network
- Ensure wallet is on Mumbai testnet
- Check if testnet tokens are available
- Verify Thirdweb client ID is configured

#### Common Issues
- **"Insufficient funds"**: Get more testnet MATIC
- **"Contract not found"**: Check contract address
- **"Transaction failed"**: Check gas limits and network

### 6. **Production Testing**

#### Before Mainnet Deployment:
1. Test all scenarios on Mumbai
2. Verify contract functionality
3. Test with different wallet types
4. Validate AI-generated contracts
5. Test dispute resolution flow

#### Mainnet Checklist:
- [ ] Switch to Polygon mainnet
- [ ] Use real USDC tokens
- [ ] Test with small amounts first
- [ ] Verify all security measures

### 7. **Environment Variables for Testing**

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000
VITE_THIRDWEB_CLIENT_ID=your_thirdweb_client_id_here
```

### 8. **Testing Commands (MÉTODO ACTUAL)**

#### Verificar Ambiente Primero:
```bash
# Verificar .env configurado
cat .env  # Linux/Mac
type .env # Windows

# Verificar dependencias
pip list | grep -E "(fastapi|openai|uvicorn)"

# Verificar servidor activo
curl http://localhost:5000/health
```

#### Start Development Servers:
```bash
# Backend (Terminal 1)
python main.py
# Runs on http://localhost:5000

# Frontend (Terminal 2 - opcional)
cd frontend
npm run dev
# Runs on http://localhost:5173
```

#### Test API Endpoints:
```bash
# Health check
curl http://localhost:5000/health

# Test contract generation
curl -X POST http://localhost:5000/api/full_flow \
  -H "Content-Type: application/json" \
  -d '{"text":"Test contract description"}'
```

#### Run Individual Test Scripts (SIN DOCKER):
```bash
# Tests específicos
python test_chat.py
python test_contract_ai.py
python test_api.py
python test_agents_enhanced.py

# ❌ NO USAR Docker tests
# ❌ NO USAR: docker-compose up
# ❌ NO USAR: pytest en Docker
```

## 🚀 Ready to Test!

Your GigChain application is now configured for safe testing on Polygon Mumbai testnet. Start with small test transactions and gradually test more complex scenarios.
