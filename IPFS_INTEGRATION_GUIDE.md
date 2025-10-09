# 🌐 IPFS Contract Storage Integration Guide

**GigChain.io - Decentralized Contract Storage**  
**Date:** October 9, 2025  
**Version:** 1.0.0

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [What is IPFS?](#what-is-ipfs)
3. [Why Use IPFS for Contracts?](#why-use-ipfs-for-contracts)
4. [Installation & Setup](#installation--setup)
5. [Configuration](#configuration)
6. [API Endpoints](#api-endpoints)
7. [Usage Examples](#usage-examples)
8. [Testing](#testing)
9. [Production Deployment](#production-deployment)
10. [Troubleshooting](#troubleshooting)

---

## 🌟 Overview

GigChain now supports **IPFS (InterPlanetary File System)** for storing contract data in a decentralized, immutable, and permanent way. This is perfect for Web3 applications where transparency and data persistence are critical.

### Key Features

✅ **Decentralized Storage** - No single point of failure  
✅ **Immutable Content** - Content-addressed (CID) ensures data integrity  
✅ **Permanent Storage** - Pinned contracts remain available forever  
✅ **Multiple Gateways** - Access via local node or public gateways  
✅ **Blockchain Ready** - Store CIDs on-chain for verification  
✅ **Cost Effective** - Pay once, store forever (with pinning services)

---

## 🔍 What is IPFS?

**IPFS** (InterPlanetary File System) is a peer-to-peer distributed file system that seeks to connect all computing devices with the same system of files.

### How It Works

1. **Content Addressing**: Files are identified by their content (hash), not location
2. **CID (Content Identifier)**: Unique hash for each piece of content
3. **Distributed**: Files stored across multiple nodes
4. **Immutable**: Once uploaded, content cannot be changed (new version = new CID)

### Example CID

```
QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco
```

This CID always points to the same content, no matter where it's stored.

---

## 💡 Why Use IPFS for Contracts?

### Traditional Storage Problems

❌ **Centralized servers** can go down  
❌ **Data can be modified** without trace  
❌ **Vendor lock-in** to cloud providers  
❌ **Costs increase** with usage  

### IPFS Advantages for GigChain

✅ **Immutability**: Contracts cannot be altered after upload  
✅ **Transparency**: Anyone can verify contract content via CID  
✅ **Blockchain Integration**: Store CID on Polygon for proof  
✅ **Decentralization**: No single point of failure  
✅ **Cost Effective**: Pay once for pinning, access forever  
✅ **Trust**: Content-addressed = guaranteed integrity  

### Perfect Use Cases

1. **Smart Contract Data**: Store contract terms referenced by on-chain contracts
2. **Dispute Resolution**: Immutable evidence for arbitration
3. **Audit Trail**: Permanent record of contract history
4. **NFT Metadata**: Contract details for tokenized gigs
5. **Legal Compliance**: Tamper-proof documentation

---

## 🚀 Installation & Setup

### Step 1: Install IPFS Dependencies

```bash
# Install Python IPFS client
pip install ipfshttpclient==0.8.0a2 py-cid==0.3.0

# Or use requirements.txt
pip install -r requirements.txt
```

### Step 2: Install IPFS Node (Local Development)

#### Option A: IPFS Desktop (Recommended for beginners)

1. Download from: https://docs.ipfs.tech/install/ipfs-desktop/
2. Install and run the application
3. IPFS daemon starts automatically

#### Option B: IPFS CLI (For developers)

```bash
# macOS (Homebrew)
brew install ipfs

# Linux (Ubuntu/Debian)
wget https://dist.ipfs.tech/kubo/v0.24.0/kubo_v0.24.0_linux-amd64.tar.gz
tar -xvzf kubo_v0.24.0_linux-amd64.tar.gz
cd kubo
sudo bash install.sh

# Windows (Chocolatey)
choco install ipfs
```

### Step 3: Initialize and Start IPFS

```bash
# Initialize IPFS repo (first time only)
ipfs init

# Start IPFS daemon
ipfs daemon
```

Expected output:
```
Initializing daemon...
Kubo version: 0.24.0
Repo version: 15
System version: amd64/darwin
Golang version: go1.21.1

Swarm listening on /ip4/127.0.0.1/tcp/4001
Swarm listening on /ip4/127.0.0.1/udp/4001/quic
API server listening on /ip4/127.0.0.1/tcp/5001
WebUI: http://127.0.0.1:5001/webui
Gateway (readonly) server listening on /ip4/127.0.0.1/tcp/8080
Daemon is ready
```

### Step 4: Verify IPFS is Running

```bash
# Check IPFS status
ipfs version

# Test with a simple file
echo "Hello IPFS from GigChain!" > test.txt
ipfs add test.txt

# Should output something like:
# added QmXxxx test.txt
```

---

## ⚙️ Configuration

### Environment Variables

Create/update your `.env` file:

```bash
# ==================== IPFS STORAGE ====================

# IPFS Mode: 'local' (default), 'pinata', 'infura', 'nft.storage'
IPFS_MODE=local

# Local IPFS Configuration
IPFS_API_URL=/ip4/127.0.0.1/tcp/5001
IPFS_GATEWAY_URL=http://127.0.0.1:8080

# Enable automatic IPFS storage for all contracts
AUTO_IPFS_STORAGE=false

# Auto-pin contracts on IPFS (prevents garbage collection)
AUTO_PIN_CONTRACTS=true
```

### Configuration Options

#### Local Mode (Development)

```bash
IPFS_MODE=local
IPFS_API_URL=/ip4/127.0.0.1/tcp/5001
IPFS_GATEWAY_URL=http://127.0.0.1:8080
```

**Pros**: Free, full control, fast  
**Cons**: Must run IPFS daemon, data only available when node is online

#### Pinata Mode (Production Recommended)

```bash
IPFS_MODE=pinata
PINATA_API_KEY=your_api_key_here
PINATA_SECRET_KEY=your_secret_key_here
```

**Pros**: Reliable, fast, CDN-backed, always online  
**Cons**: Paid service (but affordable)  
**Get API Keys**: https://pinata.cloud

#### Infura Mode (Production Alternative)

```bash
IPFS_MODE=infura
INFURA_PROJECT_ID=your_project_id
INFURA_PROJECT_SECRET=your_project_secret
```

**Pros**: Reliable, integrated with Ethereum infrastructure  
**Cons**: Paid service  
**Get API Keys**: https://infura.io

---

## 📡 API Endpoints

### 1. Check IPFS Status

**GET** `/api/ipfs/status`

Check if IPFS is connected and get node information.

```bash
curl http://localhost:5000/api/ipfs/status
```

**Response:**
```json
{
  "connected": true,
  "mode": "local",
  "version": "0.24.0",
  "gateway_url": "http://127.0.0.1:8080",
  "api_url": "/ip4/127.0.0.1/tcp/5001",
  "repo_size": 12345678,
  "num_objects": 42
}
```

### 2. Upload Contract to IPFS

**POST** `/api/ipfs/upload`

Upload contract data to IPFS and get a CID.

```bash
curl -X POST http://localhost:5000/api/ipfs/upload \
  -H "Content-Type: application/json" \
  -d '{
    "contract_data": {
      "contract_id": "gig_123",
      "milestones": [...],
      "total": "1000.00 USDC"
    },
    "pin": true,
    "metadata": {
      "project": "Website Development",
      "client": "0x1234..."
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "cid": "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
  "gateway_url": "http://127.0.0.1:8080/ipfs/QmXoy...",
  "size": 2048,
  "timestamp": "2025-10-09T10:30:00",
  "pinned": true,
  "public_gateways": [
    "https://ipfs.io/ipfs/QmXoy...",
    "https://gateway.pinata.cloud/ipfs/QmXoy...",
    "https://cloudflare-ipfs.com/ipfs/QmXoy...",
    "https://dweb.link/ipfs/QmXoy..."
  ]
}
```

### 3. Retrieve Contract from IPFS

**GET** `/api/ipfs/retrieve/{cid}`

Retrieve contract data by CID.

```bash
curl http://localhost:5000/api/ipfs/retrieve/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco
```

**Response:**
```json
{
  "success": true,
  "cid": "QmXoy...",
  "contract_data": {
    "contract_id": "gig_123",
    "milestones": [...],
    "total": "1000.00 USDC"
  },
  "timestamp": "2025-10-09T10:30:00",
  "size": 2048,
  "pinned": true,
  "gateway_urls": [...]
}
```

### 4. Pin Contract

**POST** `/api/ipfs/pin`

Pin a contract to prevent garbage collection (requires authentication).

```bash
curl -X POST http://localhost:5000/api/ipfs/pin \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cid": "QmXoy..."}'
```

### 5. Unpin Contract

**DELETE** `/api/ipfs/pin/{cid}`

Unpin a contract (requires authentication).

```bash
curl -X DELETE http://localhost:5000/api/ipfs/pin/QmXoy... \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

### 6. List Pinned Contracts

**GET** `/api/ipfs/pins`

List all pinned contracts (requires authentication).

```bash
curl http://localhost:5000/api/ipfs/pins \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

### 7. Get Gateway URLs

**GET** `/api/ipfs/gateway/{cid}`

Get all available gateway URLs for a CID.

```bash
curl http://localhost:5000/api/ipfs/gateway/QmXoy...
```

---

## 💻 Usage Examples

### Example 1: Generate and Store Contract on IPFS

```python
import requests

# Generate contract
response = requests.post('http://localhost:5000/api/full_flow', json={
    "text": "Necesito desarrollar un sitio web. Presupuesto: $2000. Plazo: 30 días."
})

contract = response.json()

# Upload to IPFS
ipfs_response = requests.post('http://localhost:5000/api/ipfs/upload', json={
    "contract_data": contract,
    "pin": True,
    "metadata": {
        "project": "Website Development",
        "generated_at": "2025-10-09T10:30:00"
    }
})

result = ipfs_response.json()
print(f"Contract uploaded to IPFS!")
print(f"CID: {result['cid']}")
print(f"Access at: {result['gateway_url']}")
```

### Example 2: Retrieve and Verify Contract

```python
import requests

cid = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"

# Retrieve from IPFS
response = requests.get(f'http://localhost:5000/api/ipfs/retrieve/{cid}')
contract = response.json()

if contract['success']:
    print("✅ Contract retrieved successfully!")
    print(f"Total: {contract['contract_data']['total']}")
    print(f"Milestones: {len(contract['contract_data']['milestones'])}")
else:
    print("❌ Failed to retrieve contract")
```

### Example 3: Store CID on Blockchain

```solidity
// Solidity smart contract example
contract GigContract {
    mapping(uint256 => string) public contractIPFSCIDs;
    
    function createGig(uint256 gigId, string memory ipfsCID) public {
        // Store IPFS CID on-chain
        contractIPFSCIDs[gigId] = ipfsCID;
        
        emit GigCreated(gigId, ipfsCID, msg.sender);
    }
    
    function getContractData(uint256 gigId) public view returns (string memory) {
        // Return IPFS CID to fetch full contract data
        return contractIPFSCIDs[gigId];
    }
}
```

### Example 4: Frontend Integration

```javascript
// React/Next.js example
async function uploadContractToIPFS(contractData) {
  try {
    const response = await fetch('http://localhost:5000/api/ipfs/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contract_data: contractData,
        pin: true,
        metadata: {
          uploaded_by: walletAddress,
          timestamp: new Date().toISOString()
        }
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Uploaded to IPFS:', result.cid);
      
      // Store CID in your database or blockchain
      await storeContractCID(contractData.contract_id, result.cid);
      
      // Display gateway URLs to user
      setGatewayUrls(result.public_gateways);
    }
  } catch (error) {
    console.error('❌ IPFS upload failed:', error);
  }
}

async function retrieveContractFromIPFS(cid) {
  const response = await fetch(`http://localhost:5000/api/ipfs/retrieve/${cid}`);
  const result = await response.json();
  
  if (result.success) {
    return result.contract_data;
  }
  
  throw new Error('Contract not found on IPFS');
}
```

---

## 🧪 Testing

### Run IPFS Tests

```bash
# Run full test suite
python test_ipfs.py

# Test upload only
python test_ipfs.py --upload

# Test retrieval
python test_ipfs.py --retrieve QmXoy...

# List pinned contracts
python test_ipfs.py --pins
```

### Manual Testing with cURL

```bash
# 1. Check IPFS status
curl http://localhost:5000/api/ipfs/status

# 2. Upload a test contract
curl -X POST http://localhost:5000/api/ipfs/upload \
  -H "Content-Type: application/json" \
  -d '{
    "contract_data": {
      "test": true,
      "message": "Hello IPFS!"
    },
    "pin": true
  }'

# 3. Copy the CID from response and retrieve it
curl http://localhost:5000/api/ipfs/retrieve/YOUR_CID_HERE

# 4. Access via browser (use any gateway URL from response)
# Open: https://ipfs.io/ipfs/YOUR_CID_HERE
```

---

## 🏭 Production Deployment

### Recommended Setup: Pinata

1. **Create Pinata Account**: https://pinata.cloud
2. **Generate API Keys**: Dashboard → API Keys → New Key
3. **Configure Environment**:

```bash
IPFS_MODE=pinata
PINATA_API_KEY=your_api_key
PINATA_SECRET_KEY=your_secret_key
AUTO_IPFS_STORAGE=true
AUTO_PIN_CONTRACTS=true
```

4. **Benefits**:
   - ✅ 100% uptime guarantee
   - ✅ Fast CDN delivery
   - ✅ No need to run IPFS daemon
   - ✅ Dedicated pinning service
   - ✅ 1GB free tier

### Alternative: Infura IPFS

```bash
IPFS_MODE=infura
INFURA_PROJECT_ID=your_project_id
INFURA_PROJECT_SECRET=your_secret
```

### Cost Comparison

| Service | Free Tier | Paid Plans | Best For |
|---------|-----------|------------|----------|
| **Local IPFS** | Unlimited | Free | Development |
| **Pinata** | 1 GB | $20/mo (100GB) | Production |
| **Infura** | 5 GB | $50/mo (50GB) | Enterprise |
| **NFT.Storage** | Unlimited | Free (web3.storage) | NFT projects |

---

## 🔧 Troubleshooting

### IPFS Not Connecting

**Problem**: `IPFS not connected` error

**Solutions**:

```bash
# 1. Check if IPFS daemon is running
ipfs id

# 2. Restart IPFS daemon
pkill ipfs
ipfs daemon

# 3. Check IPFS config
ipfs config show

# 4. Verify API is accessible
curl http://127.0.0.1:5001/api/v0/version

# 5. Check firewall (allow port 5001)
sudo ufw allow 5001/tcp
```

### Upload Fails

**Problem**: Upload returns error

**Solutions**:

```bash
# Check IPFS repo size
ipfs repo stat

# Run garbage collection if repo is full
ipfs repo gc

# Increase repo size limit
ipfs config Datastore.StorageMax 20GB
```

### Cannot Retrieve Content

**Problem**: CID not found

**Solutions**:

```bash
# 1. Check if content is pinned
ipfs pin ls

# 2. Try different gateways
curl https://ipfs.io/ipfs/YOUR_CID
curl https://gateway.pinata.cloud/ipfs/YOUR_CID
curl https://cloudflare-ipfs.com/ipfs/YOUR_CID

# 3. Manually pin the content
ipfs pin add YOUR_CID
```

### Slow Gateway Access

**Problem**: IPFS gateway is slow

**Solutions**:

1. Use multiple public gateways (built-in to our API)
2. Use Pinata/Infura for faster delivery
3. Enable local IPFS cache
4. Use CDN services (Cloudflare IPFS)

---

## 📚 Additional Resources

### Documentation

- **IPFS Docs**: https://docs.ipfs.tech
- **Pinata Docs**: https://docs.pinata.cloud
- **Infura IPFS**: https://docs.infura.io/ipfs

### Tools

- **IPFS Desktop**: https://docs.ipfs.tech/install/ipfs-desktop/
- **IPFS Companion** (Browser Extension): https://docs.ipfs.tech/install/ipfs-companion/
- **CID Inspector**: https://cid.ipfs.tech

### Community

- **IPFS Discord**: https://discord.gg/ipfs
- **IPFS Forum**: https://discuss.ipfs.tech
- **GitHub**: https://github.com/ipfs/ipfs

---

## ✅ Summary

### What We Built

✅ **IPFS Storage Module** (`ipfs_storage.py`)  
✅ **FastAPI Endpoints** (`ipfs_api.py`)  
✅ **Contract Integration** (Updated `contract_ai.py`)  
✅ **Test Suite** (`test_ipfs.py`)  
✅ **Configuration** (Updated `env.example`)

### Key Benefits

🌐 **Decentralized** - No single point of failure  
🔒 **Immutable** - Content cannot be changed  
💰 **Cost Effective** - Pay once, store forever  
⚡ **Fast** - CDN-backed gateways  
🔗 **Blockchain Ready** - Store CIDs on-chain  

### Next Steps

1. **Start IPFS daemon**: `ipfs daemon`
2. **Test locally**: `python test_ipfs.py`
3. **Generate contract**: Use `/api/full_flow`
4. **Upload to IPFS**: Use `/api/ipfs/upload`
5. **Store CID on blockchain**: Reference in smart contract
6. **Production**: Switch to Pinata/Infura

---

**🎉 Your contracts are now stored on the decentralized web!**

*Last Updated: October 9, 2025*  
*Version: 1.0.0*
