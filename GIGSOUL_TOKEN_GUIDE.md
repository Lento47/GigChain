# GigSoul (GSL) Token System - Complete Guide

## 🎯 Overview

GigSoul (GSL) is the in-platform token for GigChain.io, designed to reward freelancers and contractors for completing quality work. This is a **closed system** - tokens can be traded within the platform but do not leave the ecosystem.

## 💎 Token Details

- **Name**: GigSoul
- **Symbol**: GSL
- **Type**: In-platform reward token
- **Decimals**: 2
- **Initial Supply**: Dynamic (minted as rewards)

## 🌟 Key Features

### 1. **Token Wallets**
Every user automatically gets a GSL wallet when they join the platform. The wallet tracks:
- Current balance
- Total earned (from contracts)
- Total spent
- Transfer history

### 2. **Reward System**
Freelancers earn GSL tokens when completing contracts. The reward amount is calculated using a sophisticated algorithm that considers:

#### Reward Factors

| Factor | Impact | Details |
|--------|--------|---------|
| **Contract Value** | Base reward | 10 GSL per $1 USD |
| **Task Complexity** | 0.5x - 3.0x | Based on contract value and user level |
| **Quality Rating** | 0.5x - 1.5x | 5 stars = +50% bonus |
| **Delivery Time** | 0.5x - 1.5x | On-time = +20%, Early = up to +50% |
| **User Level** | 1.0x - 2.0x | +10% per 10 levels (max +100%) |
| **Trust Score** | 1.0x - 1.3x | 80+ score = up to +30% bonus |

#### Task Complexity Levels

| Level | Contract Value Range | Multiplier |
|-------|---------------------|------------|
| Very Simple | $1 - $50 | 0.5x |
| Simple | $51 - $200 | 1.0x |
| Moderate | $201 - $1,000 | 1.5x |
| Complex | $1,001 - $5,000 | 2.0x |
| Expert | $5,000+ | 3.0x |

### 3. **Trading & Transfers**

#### Buy Tokens
- Exchange rate: **$1 USD = 20 GSL**
- Transaction fee: **3%**
- Minimum purchase: **$5 USD**
- Maximum purchase: **$10,000 USD**

#### Sell Tokens
- Exchange rate: **1 GSL = $0.05 USD**
- Transaction fee: **5%**
- Minimum sale: **100 GSL**
- Maximum sale: **100,000 GSL**

#### Transfer Tokens
- Transfer between users
- Transaction fee: **2%**
- Minimum transfer: **10 GSL**
- Recipient receives full amount (sender pays fee)

## 📊 Example Reward Calculations

### Scenario 1: Perfect Performance
```
Contract Value: $1,000
User Level: 15
Trust Score: 95
Rating: 5 stars
Delivery: 3 days early

Base Reward: 10,000 GSL (1000 * 10)
Complexity: 1.5x (Moderate)
Rating: 1.5x (Perfect)
Delivery: 1.35x (Early bonus)
Level: 1.15x (Level 15)
Trust: 1.225x (95 score)

Final Reward: ~35,000 GSL
```

### Scenario 2: Average Performance
```
Contract Value: $500
User Level: 5
Trust Score: 70
Rating: 4 stars
Delivery: On time

Base Reward: 5,000 GSL (500 * 10)
Complexity: 1.0x (Simple)
Rating: 1.2x (Good)
Delivery: 1.2x (On time)
Level: 1.05x (Level 5)
Trust: 1.0x (Below threshold)

Final Reward: ~7,560 GSL
```

### Scenario 3: Poor Performance
```
Contract Value: $300
User Level: 3
Trust Score: 60
Rating: 2 stars
Delivery: 5 days late

Base Reward: 3,000 GSL (300 * 10)
Complexity: 1.0x (Simple)
Rating: 0.7x (Below average)
Delivery: 0.5x (Late penalty)
Level: 1.0x (Level 3)
Trust: 1.0x (Below threshold)

Final Reward: ~1,050 GSL
```

## 🔌 API Endpoints

### Wallet Management

#### Get Wallet
```http
GET /api/tokens/wallet/{user_id}
```

Response:
```json
{
  "user_id": "user123",
  "wallet_address": "0x...",
  "balance": 15000.50,
  "total_earned": 20000.00,
  "total_spent": 5000.00,
  "formatted_balance": "15,000.50 GSL"
}
```

#### Get Transaction History
```http
GET /api/tokens/wallet/{user_id}/transactions?limit=50
```

#### Get Reward History
```http
GET /api/tokens/wallet/{user_id}/rewards?limit=50
```

### Rewards

#### Estimate Reward
```http
POST /api/tokens/rewards/estimate
Content-Type: application/json

{
  "user_id": "user123",
  "contract_value": 1000.0
}
```

Response:
```json
{
  "estimated_rewards": {
    "min_reward": 5250.00,
    "avg_reward": 18000.00,
    "max_reward": 45000.00
  }
}
```

#### Award Reward (Automatic)
This is called automatically when a contract is completed:
```http
POST /api/gamification/contracts/complete
Content-Type: application/json

{
  "contract_id": "contract123",
  "user_id": "user123",
  "role": "freelancer",
  "rating": 5,
  "was_on_time": true,
  "days_early_or_late": -2,
  "contract_value": 1000.0
}
```

### Trading

#### Buy Tokens
```http
POST /api/tokens/buy
Content-Type: application/json

{
  "user_id": "user123",
  "usd_amount": 100.0,
  "payment_method": "card"
}
```

#### Sell Tokens
```http
POST /api/tokens/sell
Content-Type: application/json

{
  "user_id": "user123",
  "gsl_amount": 1000.0,
  "payment_method": "bank"
}
```

#### Transfer Tokens
```http
POST /api/tokens/transfer
Content-Type: application/json

{
  "from_user_id": "user123",
  "to_wallet_address": "user456",
  "amount": 500.0,
  "note": "Payment for design work"
}
```

### Marketplace

#### Get Exchange Rates
```http
GET /api/tokens/marketplace/rates
```

### Statistics

#### Token System Stats
```http
GET /api/tokens/statistics
```

#### Richest Users Leaderboard
```http
GET /api/tokens/leaderboard/richest?limit=50
```

## 🗄️ Database Schema

### token_wallets
Stores user wallet information:
- `user_id` (primary key)
- `wallet_address`
- `balance`
- `total_earned`
- `total_spent`
- `total_transferred_out`
- `total_transferred_in`
- Timestamps

### token_transactions
All token movements:
- `transaction_id` (primary key)
- `user_id`
- `transaction_type` (reward, transfer, receive, buy, sell, bonus, penalty)
- `amount`
- `balance_before`
- `balance_after`
- `description`
- `related_contract_id`
- `metadata_json`

### token_rewards
Contract completion rewards:
- `reward_id` (primary key)
- `user_id`
- `contract_id`
- `contract_value_usd`
- `gsl_reward`
- `complexity_level`
- `rating`
- `was_on_time`
- `days_early_or_late`
- `user_level`
- `trust_score`
- `breakdown_json`

### token_transfers
Transfer tracking:
- `transfer_id` (primary key)
- `from_user_id`
- `to_user_id`
- `amount`
- `fee`
- `status`

## 🧪 Testing

Run the comprehensive test suite:

```bash
python test_token_system.py
```

This tests:
- ✅ Wallet creation
- ✅ Reward calculation
- ✅ Contract completion with tokens
- ✅ Token purchases
- ✅ Token transfers
- ✅ Transaction history
- ✅ Statistics

## 🎮 User Flow Example

### Freelancer Journey

1. **Sign Up** → Automatic GSL wallet created (Balance: 0 GSL)

2. **Complete First Contract** ($500, 5 stars, on-time)
   - Earn XP and badges (gamification)
   - Receive ~9,000 GSL tokens
   - Balance: 9,000 GSL

3. **Complete More Contracts**
   - Level increases → Higher rewards
   - Trust score improves → Bonus multiplier
   - Balance grows

4. **Use Tokens**
   - Transfer to other users for services
   - Save for later
   - Trade for USD (if needed)

## 💡 Best Practices

### For Freelancers
1. **Deliver Early**: Earn up to +50% bonus tokens
2. **Maintain Quality**: 5-star ratings = +50% multiplier
3. **Build Trust**: 80+ trust score = up to +30% bonus
4. **Level Up**: Higher level = more rewards per contract

### For Clients
1. **Fair Ratings**: Help freelancers earn fair rewards
2. **Timely Reviews**: Complete ratings promptly
3. **Clear Requirements**: Reduce disputes and late deliveries

## 🔒 Security Features

- ✅ Closed system (tokens don't leave platform)
- ✅ All transactions logged and auditable
- ✅ Balance validation on all operations
- ✅ Transfer limits and fees prevent abuse
- ✅ Automatic wallet creation (no manual setup)

## 📈 Token Economics

### Supply Dynamics
- **Minting**: New tokens created only as contract rewards
- **Burning**: Fees collected on trades (optional future feature)
- **Circulation**: Grows with platform usage

### Value Factors
- Platform activity
- Contract volume
- User engagement
- Marketplace liquidity

## 🚀 Future Enhancements

1. **Staking**: Earn passive rewards by locking tokens
2. **Governance**: Vote on platform decisions with tokens
3. **Premium Features**: Unlock features with tokens
4. **NFT Integration**: Purchase profile badges/avatars
5. **Partner Rewards**: Special bonuses from partner platforms
6. **Token Burning**: Reduce supply over time

## 📞 Support

For questions or issues with the token system:
- Check the API documentation: `/docs`
- Review transaction history for details
- Contact support with transaction IDs

---

**Note**: The GigSoul token system is designed to reward quality work and foster a positive freelance ecosystem. All rewards are calculated transparently and fairly based on performance metrics.

🎉 **Happy Earning!** 💎
