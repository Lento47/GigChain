# 🚀 Phase 3: Quick Start Guide

Get started with Phase 3 implementation in 30 minutes.

---

## ⚡ Prerequisites

Before starting Phase 3, ensure you have completed:

- ✅ **Phase 1 MVP** - Core platform functional
- ✅ **Phase 2 Enhancements** - Advanced features deployed
- ✅ **Funding Secured** - $620k budget allocated
- ✅ **Team Hired** - 8-10 developers ready
- ✅ **Legal Review** - Token structure approved

**Check Status:**
```bash
# Verify Phase 2 is complete
cat /workspace/PHASE2_COMPLETE.md

# Check current server
curl http://localhost:5000/health
```

---

## 📦 Step 1: Environment Setup (5 minutes)

### Update Dependencies

```bash
cd /workspace

# Backend: Add new dependencies
cat >> requirements.txt << EOF
# Phase 3: Multi-chain support
web3==6.15.0
eth-account==0.13.0
LayerZero-sdk==0.1.0  # If available

# Phase 3: Advanced features
psycopg2-binary==2.9.9  # PostgreSQL
redis==5.0.1
celery==5.3.4  # Background tasks
EOF

# Install
pip install -r requirements.txt

# Frontend: Add new dependencies
cd frontend
npm install --save \
  @layerzerolabs/scan-client \
  @rainbow-me/rainbowkit \
  wagmi \
  viem
```

### Configure Environment Variables

```bash
cd /workspace

# Create Phase 3 config
cat >> .env << EOF

# ============================================
# PHASE 3: MULTI-CHAIN CONFIGURATION
# ============================================

# Ethereum Mainnet
ETH_MAINNET_RPC=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
ETH_MAINNET_CHAIN_ID=1
GIGS_TOKEN_ETH=0x... # Deploy address (TBD)

# Ethereum Sepolia (Testnet)
ETH_SEPOLIA_RPC=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
ETH_SEPOLIA_CHAIN_ID=11155111

# BSC Mainnet
BSC_MAINNET_RPC=https://bsc-dataseed.binance.org/
BSC_MAINNET_CHAIN_ID=56
GIGS_TOKEN_BSC=0x... # Deploy address (TBD)

# BSC Testnet
BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545/
BSC_TESTNET_CHAIN_ID=97

# Arbitrum One
ARBITRUM_MAINNET_RPC=https://arb1.arbitrum.io/rpc
ARBITRUM_MAINNET_CHAIN_ID=42161
GIGS_TOKEN_ARBITRUM=0x... # Deploy address (TBD)

# Arbitrum Sepolia (Testnet)
ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
ARBITRUM_SEPOLIA_CHAIN_ID=421614

# Optimism
OPTIMISM_MAINNET_RPC=https://mainnet.optimism.io
OPTIMISM_MAINNET_CHAIN_ID=10

# Polygon (Already configured)
POLYGON_MAINNET_RPC=https://polygon-rpc.com
POLYGON_MAINNET_CHAIN_ID=137

# ============================================
# PHASE 3: DAO GOVERNANCE
# ============================================

GOVERNOR_CONTRACT_ADDRESS=0x... # TBD
TIMELOCK_CONTRACT_ADDRESS=0x... # TBD
TREASURY_CONTRACT_ADDRESS=0x... # TBD

VOTING_DELAY=1 # days
VOTING_PERIOD=7 # days
PROPOSAL_THRESHOLD=10000 # GIGS tokens
QUORUM_PERCENTAGE=4 # percent

# ============================================
# PHASE 3: TOKEN CONFIGURATION
# ============================================

GIGS_TOKEN_MAX_SUPPLY=1000000000 # 1 billion
GIGS_TOKEN_DECIMALS=18

# Staking pools
STAKING_CONTRACT_ADDRESS=0x... # TBD
STAKING_POOL_30D_APY=10 # percent
STAKING_POOL_90D_APY=20 # percent
STAKING_POOL_180D_APY=35 # percent
STAKING_POOL_365D_APY=60 # percent

# Vesting
VESTING_CONTRACT_ADDRESS=0x... # TBD

# ============================================
# PHASE 3: PRODUCTION INFRASTRUCTURE
# ============================================

# Database (PostgreSQL - Production)
DATABASE_URL=postgresql://user:password@localhost:5432/gigchain_prod

# Redis (Caching)
REDIS_URL=redis://localhost:6379/0

# Celery (Background Tasks)
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
DATADOG_API_KEY=...

# ============================================
# PHASE 3: EXTERNAL SERVICES
# ============================================

# LayerZero (Cross-chain messaging)
LAYERZERO_ENDPOINT=0x... # TBD per chain

# The Graph (Indexing)
SUBGRAPH_URL=https://api.thegraph.com/subgraphs/name/gigchain/...

# IPFS (File storage)
IPFS_API_URL=https://ipfs.infura.io:5001
IPFS_GATEWAY=https://gigchain.infura-ipfs.io

# Gas Price Oracles
GAS_PRICE_API=https://api.etherscan.io/api

# ============================================
# PHASE 3: SECURITY
# ============================================

# Multi-sig (Gnosis Safe)
MULTISIG_ADDRESS=0x...
MULTISIG_THRESHOLD=3 # out of 5 signers

# Emergency Contacts
EMERGENCY_PAUSE_ADDRESS=0x...
SECURITY_ADMIN_ADDRESS=0x...

EOF
```

---

## 📝 Step 2: Smart Contract Setup (10 minutes)

### Install Foundry (if not already installed)

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Verify installation
forge --version
cast --version
```

### Initialize Contract Directory

```bash
cd /workspace/contracts

# Install dependencies
npm install --save-dev \
  @openzeppelin/contracts@5.1.0 \
  @layerzerolabs/contracts

# Copy templates to actual contracts
cp governance/GigChainGovernor.sol.template governance/GigChainGovernor.sol
cp token/GigsToken.sol.template token/GigsToken.sol

# Create additional needed contracts
mkdir -p governance token test scripts

# Compile contracts
forge build

# Run tests
forge test
```

---

## 🗄️ Step 3: Database Migration (5 minutes)

### Setup PostgreSQL

```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Or on macOS
brew install postgresql
brew services start postgresql

# Create database
psql postgres
CREATE DATABASE gigchain_prod;
CREATE USER gigchain_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE gigchain_prod TO gigchain_user;
\q
```

### Create Phase 3 Tables

```bash
cd /workspace

# Create migration file
cat > migrations/phase3_schema.sql << 'EOF'
-- Phase 3: Multi-chain support
CREATE TABLE IF NOT EXISTS chains (
    id SERIAL PRIMARY KEY,
    chain_id INTEGER UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    rpc_url VARCHAR(255) NOT NULL,
    explorer_url VARCHAR(255),
    native_token VARCHAR(10),
    is_testnet BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Phase 3: DAO Proposals
CREATE TABLE IF NOT EXISTS dao_proposals (
    id SERIAL PRIMARY KEY,
    proposal_id VARCHAR(66) UNIQUE NOT NULL, -- Keccak256 hash
    proposer_address VARCHAR(42) NOT NULL,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    targets TEXT[] NOT NULL, -- JSON array of addresses
    values BIGINT[] NOT NULL, -- JSON array of values
    calldatas TEXT[] NOT NULL, -- JSON array of calldata
    start_block BIGINT NOT NULL,
    end_block BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL, -- Pending, Active, Succeeded, Defeated, Executed
    votes_for NUMERIC(78, 0) DEFAULT 0,
    votes_against NUMERIC(78, 0) DEFAULT 0,
    votes_abstain NUMERIC(78, 0) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Phase 3: DAO Votes
CREATE TABLE IF NOT EXISTS dao_votes (
    id SERIAL PRIMARY KEY,
    proposal_id VARCHAR(66) NOT NULL REFERENCES dao_proposals(proposal_id),
    voter_address VARCHAR(42) NOT NULL,
    support INTEGER NOT NULL, -- 0=Against, 1=For, 2=Abstain
    voting_power NUMERIC(78, 0) NOT NULL,
    reason TEXT,
    tx_hash VARCHAR(66),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(proposal_id, voter_address)
);

-- Phase 3: Staking
CREATE TABLE IF NOT EXISTS staking_positions (
    id SERIAL PRIMARY KEY,
    user_address VARCHAR(42) NOT NULL,
    chain_id INTEGER NOT NULL,
    amount NUMERIC(78, 0) NOT NULL,
    pool_id INTEGER NOT NULL, -- 0=30d, 1=90d, 2=180d, 3=365d
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    claimed_rewards NUMERIC(78, 0) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    tx_hash VARCHAR(66),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Phase 3: Token Distribution Tracking
CREATE TABLE IF NOT EXISTS token_distributions (
    id SERIAL PRIMARY KEY,
    recipient_address VARCHAR(42) NOT NULL,
    distribution_type VARCHAR(50) NOT NULL, -- Airdrop, Vesting, Staking, etc.
    amount NUMERIC(78, 0) NOT NULL,
    chain_id INTEGER NOT NULL,
    vesting_schedule_id INTEGER,
    claimed_amount NUMERIC(78, 0) DEFAULT 0,
    is_fully_claimed BOOLEAN DEFAULT false,
    tx_hash VARCHAR(66),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Phase 3: Vesting Schedules
CREATE TABLE IF NOT EXISTS vesting_schedules (
    id SERIAL PRIMARY KEY,
    beneficiary_address VARCHAR(42) NOT NULL,
    total_amount NUMERIC(78, 0) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    cliff_duration INTEGER NOT NULL, -- seconds
    duration INTEGER NOT NULL, -- seconds
    claimed_amount NUMERIC(78, 0) DEFAULT 0,
    is_revocable BOOLEAN DEFAULT false,
    is_revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_proposals_status ON dao_proposals(status);
CREATE INDEX idx_proposals_proposer ON dao_proposals(proposer_address);
CREATE INDEX idx_votes_proposal ON dao_votes(proposal_id);
CREATE INDEX idx_votes_voter ON dao_votes(voter_address);
CREATE INDEX idx_staking_user ON staking_positions(user_address);
CREATE INDEX idx_staking_active ON staking_positions(is_active);
CREATE INDEX idx_distributions_recipient ON token_distributions(recipient_address);
CREATE INDEX idx_vesting_beneficiary ON vesting_schedules(beneficiary_address);

-- Insert supported chains
INSERT INTO chains (chain_id, name, rpc_url, explorer_url, native_token, is_testnet) VALUES
(1, 'Ethereum', 'https://eth-mainnet.g.alchemy.com/v2/demo', 'https://etherscan.io', 'ETH', false),
(11155111, 'Sepolia', 'https://eth-sepolia.g.alchemy.com/v2/demo', 'https://sepolia.etherscan.io', 'ETH', true),
(56, 'BSC', 'https://bsc-dataseed.binance.org/', 'https://bscscan.com', 'BNB', false),
(97, 'BSC Testnet', 'https://data-seed-prebsc-1-s1.binance.org:8545/', 'https://testnet.bscscan.com', 'BNB', true),
(137, 'Polygon', 'https://polygon-rpc.com', 'https://polygonscan.com', 'MATIC', false),
(80002, 'Polygon Amoy', 'https://rpc-amoy.polygon.technology', 'https://amoy.polygonscan.com', 'MATIC', true),
(42161, 'Arbitrum', 'https://arb1.arbitrum.io/rpc', 'https://arbiscan.io', 'ETH', false),
(421614, 'Arbitrum Sepolia', 'https://sepolia-rollup.arbitrum.io/rpc', 'https://sepolia.arbiscan.io', 'ETH', true),
(10, 'Optimism', 'https://mainnet.optimism.io', 'https://optimistic.etherscan.io', 'ETH', false);

EOF

# Run migration
psql $DATABASE_URL < migrations/phase3_schema.sql
```

---

## 🚀 Step 4: Backend Code Structure (5 minutes)

### Create New Python Modules

```bash
cd /workspace

# Create multi-chain provider
cat > multi_chain_provider.py << 'EOF'
"""
Multi-chain RPC provider for Phase 3
Handles connections to multiple blockchains
"""
from web3 import Web3
from typing import Dict, Optional
import os

class MultiChainProvider:
    def __init__(self):
        self.providers: Dict[int, Web3] = {}
        self._initialize_providers()
    
    def _initialize_providers(self):
        """Initialize Web3 providers for all supported chains"""
        chains = [
            (1, os.getenv('ETH_MAINNET_RPC')),
            (11155111, os.getenv('ETH_SEPOLIA_RPC')),
            (56, os.getenv('BSC_MAINNET_RPC')),
            (97, os.getenv('BSC_TESTNET_RPC')),
            (137, os.getenv('POLYGON_MAINNET_RPC')),
            (80002, os.getenv('POLYGON_AMOY_RPC')),
            (42161, os.getenv('ARBITRUM_MAINNET_RPC')),
            (421614, os.getenv('ARBITRUM_SEPOLIA_RPC')),
            (10, os.getenv('OPTIMISM_MAINNET_RPC')),
        ]
        
        for chain_id, rpc_url in chains:
            if rpc_url:
                self.providers[chain_id] = Web3(Web3.HTTPProvider(rpc_url))
    
    def get_provider(self, chain_id: int) -> Optional[Web3]:
        """Get Web3 provider for a specific chain"""
        return self.providers.get(chain_id)
    
    def get_gas_price(self, chain_id: int) -> Optional[int]:
        """Get current gas price for a chain"""
        provider = self.get_provider(chain_id)
        if provider:
            return provider.eth.gas_price
        return None

# Global instance
multi_chain = MultiChainProvider()
EOF

# Create DAO governance module
touch dao_governance_system.py
touch dao_governance_api.py

# Create token staking module
touch token_staking_system.py
touch token_staking_api.py

# Will implement these in subsequent steps
```

---

## 🎨 Step 5: Frontend Structure (3 minutes)

```bash
cd /workspace/frontend/src

# Create Phase 3 components
mkdir -p components/phase3/{dao,staking,multichain}

# DAO components
touch components/phase3/dao/ProposalDashboard.tsx
touch components/phase3/dao/CreateProposal.tsx
touch components/phase3/dao/VotingInterface.tsx

# Staking components
touch components/phase3/staking/StakingDashboard.tsx
touch components/phase3/staking/StakeModal.tsx

# Multi-chain components
touch components/phase3/multichain/ChainSelector.tsx
touch components/phase3/multichain/ChainSwitcher.tsx

# Create Phase 3 utilities
mkdir -p utils/phase3
touch utils/phase3/chains.ts
touch utils/phase3/governance.ts
touch utils/phase3/staking.ts
```

---

## ✅ Step 6: Verify Setup (2 minutes)

### Run Verification Script

```bash
cd /workspace

# Create verification script
cat > verify_phase3_setup.py << 'EOF'
#!/usr/bin/env python3
"""Verify Phase 3 setup is complete"""

import os
import sys
from typing import List, Tuple

def check_env_var(var_name: str) -> bool:
    """Check if environment variable is set"""
    return var_name in os.environ and os.environ[var_name] != ""

def verify_setup() -> List[Tuple[str, bool, str]]:
    """Verify all Phase 3 setup requirements"""
    
    checks = [
        # Environment variables
        ("ETH_MAINNET_RPC set", check_env_var("ETH_MAINNET_RPC"), "Multi-chain RPC"),
        ("BSC_MAINNET_RPC set", check_env_var("BSC_MAINNET_RPC"), "Multi-chain RPC"),
        ("DATABASE_URL set", check_env_var("DATABASE_URL"), "PostgreSQL"),
        ("REDIS_URL set", check_env_var("REDIS_URL"), "Redis cache"),
        
        # Files exist
        ("multi_chain_provider.py", os.path.exists("multi_chain_provider.py"), "Backend"),
        ("PHASE3_PLAN.md", os.path.exists("PHASE3_PLAN.md"), "Documentation"),
        ("PHASE3_CHECKLIST.md", os.path.exists("PHASE3_CHECKLIST.md"), "Documentation"),
        
        # Contracts
        ("Governor template", os.path.exists("contracts/governance/GigChainGovernor.sol.template"), "Smart contracts"),
        ("Token template", os.path.exists("contracts/token/GigsToken.sol.template"), "Smart contracts"),
        
        # Frontend
        ("Phase 3 components", os.path.exists("frontend/src/components/phase3"), "Frontend"),
    ]
    
    return checks

if __name__ == "__main__":
    print("🔍 Verifying Phase 3 Setup...\n")
    
    checks = verify_setup()
    passed = sum(1 for _, status, _ in checks if status)
    total = len(checks)
    
    for name, status, category in checks:
        icon = "✅" if status else "❌"
        print(f"{icon} [{category}] {name}")
    
    print(f"\n{'='*50}")
    print(f"✅ Passed: {passed}/{total}")
    print(f"❌ Failed: {total - passed}/{total}")
    
    if passed == total:
        print("\n🎉 Phase 3 setup complete! Ready to start development.")
        sys.exit(0)
    else:
        print("\n⚠️ Please complete failed checks before proceeding.")
        sys.exit(1)
EOF

chmod +x verify_phase3_setup.py
python verify_phase3_setup.py
```

---

## 📚 Step 7: Review Documentation (Quick Reference)

**Essential Reading:**
- **[Phase 3 Full Plan](PHASE3_PLAN.md)** - Complete implementation guide
- **[Phase 3 Checklist](PHASE3_CHECKLIST.md)** - Actionable task list
- **[Executive Summary](PHASE3_EXECUTIVE_SUMMARY.md)** - High-level overview

**Contract Templates:**
- `contracts/governance/GigChainGovernor.sol.template`
- `contracts/token/GigsToken.sol.template`

---

## 🚀 Next Actions

### Week 1: Multi-Chain Contracts
```bash
# Start with multi-chain escrow
cd contracts
forge create src/MultiChainEscrow.sol:MultiChainEscrow \
  --rpc-url $ETH_SEPOLIA_RPC \
  --private-key $DEPLOYER_PRIVATE_KEY

# Test on testnet first
forge test --match-contract MultiChainEscrowTest
```

### Week 2: DAO Governance
```bash
# Deploy Governor to testnet
forge script scripts/DeployGovernor.s.sol \
  --rpc-url $ETH_SEPOLIA_RPC \
  --broadcast
```

### Week 3: Token Development
```bash
# Deploy GIGS token to testnet
forge script scripts/DeployToken.s.sol \
  --rpc-url $ETH_SEPOLIA_RPC \
  --broadcast
```

---

## 🆘 Troubleshooting

### Issue: RPC Connection Failed
```bash
# Test RPC connection
curl -X POST $ETH_MAINNET_RPC \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Issue: Database Connection Failed
```bash
# Test PostgreSQL connection
psql $DATABASE_URL -c "SELECT version();"
```

### Issue: Contract Compilation Failed
```bash
# Clean and rebuild
forge clean
forge build --force
```

---

## ✅ Completion Checklist

- [ ] All environment variables configured
- [ ] PostgreSQL database created
- [ ] Redis installed and running
- [ ] Smart contract templates copied
- [ ] Backend modules created
- [ ] Frontend structure created
- [ ] Verification script passed
- [ ] Documentation reviewed
- [ ] Team members onboarded
- [ ] Ready to start Week 1 tasks

---

**Setup Time**: ~30 minutes  
**Status**: ✅ Ready to Build  
**Next**: Start [Phase 3 Checklist](PHASE3_CHECKLIST.md) - Week 1 tasks

---

**Questions?** Review the [Full Plan](PHASE3_PLAN.md) or consult with your team lead.

**Good luck building Phase 3! 🚀**
