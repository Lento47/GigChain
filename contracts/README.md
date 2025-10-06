# GigChain Smart Contracts

Solidity smart contracts for GigChain.io escrow system on Polygon network.

## 📋 Overview

The GigChain escrow contract enables trustless milestone-based payments for gig economy transactions using USDC on Polygon. It supports:

- **Milestone-based payments**: Break projects into multiple deliverable milestones
- **Escrow protection**: Funds locked in contract until milestones approved
- **Dispute resolution**: On-chain dispute mechanism (future AI integration)
- **Multi-party security**: Client and freelancer access controls
- **USDC payments**: ERC-20 token standard (USDC on Polygon)

## 🚀 Quick Start

### Installation

```bash
cd contracts
npm install
```

### Configuration

1. Copy environment variables:
```bash
cp ../.env.example ../.env
```

2. Set required variables in `.env`:
```env
DEPLOYER_PRIVATE_KEY=0x...           # Your deployer wallet private key
RPC_URL=https://rpc-amoy.polygon.technology  # Polygon Amoy testnet
POLYGONSCAN_API_KEY=...              # For contract verification
```

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm test
```

### Deploy to Polygon Amoy (Testnet)

```bash
npm run deploy:amoy
```

### Deploy to Polygon Mainnet

```bash
npm run deploy:polygon
```

### Verify Contract

```bash
npm run verify:amoy -- <CONTRACT_ADDRESS>
```

## 📄 Contract Architecture

### GigChainEscrow.sol

Main escrow contract with the following features:

#### Contract States
- `CREATED`: Contract created, awaiting funding
- `FUNDED`: Client funded the escrow
- `ACTIVE`: Freelancer started work
- `COMPLETED`: All milestones paid
- `DISPUTED`: Dispute raised by either party
- `CANCELLED`: Contract cancelled

#### Milestone States
- `PENDING`: Waiting for freelancer submission
- `SUBMITTED`: Deliverable submitted
- `APPROVED`: Client approved
- `REJECTED`: Client rejected
- `PAID`: Payment released

#### Key Functions

**Client Functions:**
- `createContract()`: Create new contract with milestones
- `fundContract()`: Fund contract with USDC
- `approveMilestone()`: Approve and release payment
- `rejectMilestone()`: Reject deliverable
- `cancelContract()`: Cancel and refund

**Freelancer Functions:**
- `submitMilestone()`: Submit deliverable with IPFS hash

**Shared Functions:**
- `raiseDispute()`: Raise dispute (both parties)

## 🧪 Testing

The test suite covers:

- ✅ Contract creation with milestones
- ✅ Funding with USDC tokens
- ✅ Milestone submission by freelancer
- ✅ Milestone approval and payment
- ✅ Milestone rejection
- ✅ Dispute raising
- ✅ Contract cancellation and refunds
- ✅ Access control (client/freelancer roles)
- ✅ Reentrancy protection
- ✅ Edge cases and error conditions

Run with coverage:
```bash
npm run coverage
```

## 🔐 Security Features

1. **OpenZeppelin Libraries**:
   - `ReentrancyGuard`: Prevents reentrancy attacks
   - `Ownable`: Access control
   - `SafeERC20`: Safe token transfers

2. **Access Control**:
   - Role-based modifiers (client, freelancer, parties)
   - State-based transitions

3. **Input Validation**:
   - Non-zero amounts
   - Future deadlines
   - Valid addresses

4. **Audited Dependencies**:
   - OpenZeppelin Contracts v5.1.0

## 📊 Gas Optimization

The contract is optimized for gas efficiency:
- Storage packing for structs
- Batch operations where possible
- Minimal storage writes
- Compiler optimization enabled (200 runs)

## 🌐 Network Configurations

### Polygon Amoy (Testnet)
- **Chain ID**: 80002
- **RPC**: https://rpc-amoy.polygon.technology
- **Explorer**: https://amoy.polygonscan.com
- **Faucet**: https://faucet.polygon.technology

### Polygon Mainnet
- **Chain ID**: 137
- **RPC**: https://polygon-rpc.com
- **Explorer**: https://polygonscan.com
- **USDC Contract**: `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`

## 📝 Deployment Process

1. **Pre-deployment**:
   - Ensure wallet has MATIC for gas
   - Verify RPC connection
   - Double-check contract parameters

2. **Deploy**:
   ```bash
   npm run deploy:amoy
   ```

3. **Post-deployment**:
   - Save contract address (auto-saved to `../env`)
   - Verify on PolygonScan
   - Update frontend with ABI and address
   - Test with small transaction

4. **Integration**:
   - Export ABI: `artifacts/contracts/GigChainEscrow.sol/GigChainEscrow.json`
   - Copy to frontend: `../frontend/src/abis/`
   - Update backend `.env` with `ESCROW_CONTRACT_ADDRESS`

## 🔗 Integration with Backend

The contract address is automatically added to `../.env` after deployment:

```env
ESCROW_CONTRACT_ADDRESS=0x...
```

Backend integration example:
```python
from web3 import Web3

w3 = Web3(Web3.HTTPProvider(os.getenv('RPC_URL')))
contract_address = os.getenv('ESCROW_CONTRACT_ADDRESS')
contract = w3.eth.contract(address=contract_address, abi=ABI)
```

## 🛠️ Development Workflow

```bash
# Start local hardhat node
npm run node

# In another terminal, deploy to localhost
npx hardhat run scripts/deploy.ts --network localhost

# Run tests
npm test

# Gas report
REPORT_GAS=true npm test
```

## 📚 Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Polygon Documentation](https://docs.polygon.technology/)
- [USDC on Polygon](https://polygon.technology/blog/usd-coin-usdc-is-now-live-on-polygon)

## ⚠️ Security Considerations

**IMPORTANT**: 
- Never commit private keys to git
- Always test on testnet first
- Verify contract source code after deployment
- Consider professional audit for mainnet deployment
- Use multi-sig wallet for ownership in production

## 📄 License

MIT License - see LICENSE file in root directory
