# 🎨 GigSoul Token - Official Branding

## Token Identity

**Name**: GigSoul  
**Symbol**: GSL  
**Type**: Internal App Token (Off-Chain)  
**Future**: Blockchain ERC20 Token

---

## 💡 Naming Rationale

**GigSoul** reflects the essence of the gig economy:
- **Gig**: Represents freelance work and gig economy
- **Soul**: Represents the passion, dedication, and identity of each worker

The name embodies the platform's mission to empower freelancers by recognizing and rewarding their work with tokens that represent their contribution to the ecosystem.

---

## 📊 Token Symbol: GSL

- **G** - Gig
- **S** - Soul
- **L** - (Linguistic flow, easy to remember)

**Similar to**: SOL (Solana), UNI (Uniswap), LINK (Chainlink)

---

## 🎯 Current Implementation (Phase 3)

### Internal Token System

GigSoul (GSL) tokens are currently **internal app currency**:

```
Type: Database-backed tokens
Storage: PostgreSQL
Transactions: Instant, free
Blockchain: Not yet (Phase 4+)
```

### How to Earn GSL

| Activity | Earning Rate |
|----------|-------------|
| Complete $1 contract | 100 GSL |
| Gain 1 XP | 5 GSL |
| Complete profile | 1,000 GSL |
| Refer a friend | 500 GSL |
| Daily login | 50 GSL |
| 7-day streak | 500 GSL |

**Example**: Complete a $500 contract with 5-star rating on time:
```
Base: $500 × 100 = 50,000 GSL
On-time bonus: +20% = +10,000 GSL
Rating bonus: +10% = +5,000 GSL
Total: 65,000 GSL
```

### How to Spend GSL

| Item | Cost (GSL) | Duration |
|------|-----------|----------|
| Featured Profile | 5,000 | 7 days |
| Priority Support | 2,000 | 30 days |
| Advanced Analytics | 1,000 | 30 days |
| Custom Template | 500 | Permanent |
| Dispute Insurance | 10,000 | Per contract |
| Visibility Boost | 1,000 | 24 hours |

### Staking Benefits

| Lock Period | Benefits |
|-------------|----------|
| 30 days | Trust Score +5, XP +10% |
| 90 days | Trust Score +10, XP +20%, Featured Badge |
| 180 days | Trust Score +20, XP +30%, Priority Matching |

### Fee Discounts

| Tier | Balance Required | Fee | Discount |
|------|-----------------|-----|----------|
| Standard | 0 GSL | 2.5% | 0% |
| Bronze | 10,000 GSL | 2.0% | 20% |
| Silver | 50,000 GSL | 1.5% | 40% |
| Gold | 100,000 GSL | 1.0% | 60% |
| Platinum | 500,000 GSL | 0.5% | 80% |

---

## 🔮 Future: Blockchain Migration (Phase 4+)

When ready, GigSoul will migrate to blockchain as ERC20 token:

### Planned Tokenomics

**Total Supply**: 1,000,000,000 GSL (1 billion)

```
Distribution:
├─ Community & Users (40%): 400M GSL
│  ├─ Existing users (snapshot): Based on earned balance
│  ├─ Staking rewards: 150M GSL
│  ├─ Liquidity mining: 100M GSL
│  └─ Community treasury: 100M GSL
│
├─ Team & Advisors (20%): 200M GSL
│  ├─ 4-year vesting, 1-year cliff
│
├─ Investors (15%): 150M GSL
│  ├─ Private sale + Public sale
│
├─ Ecosystem (15%): 150M GSL
│  ├─ Grants, partnerships, marketing
│
├─ DAO Treasury (5%): 50M GSL
└─ Reserve (5%): 50M GSL
```

### Conversion Process

**Step 1**: Snapshot all internal balances  
**Step 2**: Deploy ERC20 GigSoul contract  
**Step 3**: Mint exact amounts for each user  
**Step 4**: Users claim via signature  
**Step 5**: Airdrop to wallets  

**Conversion Rate**: **1 internal GSL = 1 ERC20 GSL** (guaranteed)

### Target Chains (Multi-Chain Launch)

- Ethereum (mainnet)
- Polygon (mainnet)
- BSC (mainnet)
- Arbitrum (mainnet)
- Optimism (mainnet)

Via LayerZero OFT for cross-chain compatibility.

---

## 🎨 Visual Identity

### Color Palette

**Primary**: `#6366F1` (Indigo) - Trust, professionalism  
**Secondary**: `#8B5CF6` (Purple) - Creativity, innovation  
**Accent**: `#10B981` (Green) - Growth, earnings

### Logo Concepts

```
 ╔═══╗
 ║ G ║  GigSoul
 ╚═══╝    GSL

 [Icon: Stylized "G" with a heart/soul element]
```

*Final logo to be designed by professional designer*

### Typography

- **Logo**: Bold, modern sans-serif
- **Headers**: Inter Bold
- **Body**: Inter Regular

---

## 📱 Usage in Code

### Backend (Python)

```python
# Constants
TOKEN_NAME = "GigSoul"
TOKEN_SYMBOL = "GSL"
TOKEN_DECIMALS = 2  # Internal (database)
# TOKEN_DECIMALS = 18  # Future ERC20

# Earning calculation
def calculate_contract_earnings(contract_value_usd: float) -> float:
    """Calculate GSL earned from contract completion"""
    base_gsl = contract_value_usd * 100  # 100 GSL per $1
    return base_gsl

# Fee discount
def get_fee_discount(gsl_balance: float) -> tuple[str, float]:
    """Get fee tier and discount based on GSL balance"""
    if gsl_balance >= 500000:
        return ("platinum", 0.5)
    elif gsl_balance >= 100000:
        return ("gold", 1.0)
    elif gsl_balance >= 50000:
        return ("silver", 1.5)
    elif gsl_balance >= 10000:
        return ("bronze", 2.0)
    else:
        return ("standard", 2.5)
```

### Frontend (TypeScript/React)

```typescript
// Constants
export const TOKEN_CONFIG = {
  name: 'GigSoul',
  symbol: 'GSL',
  decimals: 2, // Internal system
  icon: '/assets/gsl-icon.svg',
};

// Format GSL display
export const formatGSL = (amount: number): string => {
  return `${amount.toLocaleString()} GSL`;
};

// Example: 50000 GSL → "50,000 GSL"
```

### Smart Contract (Future ERC20)

```solidity
// contracts/token/GigSoulToken.sol
contract GigSoulToken is ERC20, ERC20Votes {
    string public constant NAME = "GigSoul";
    string public constant SYMBOL = "GSL";
    uint8 public constant DECIMALS = 18;
    uint256 public constant MAX_SUPPLY = 1_000_000_000e18; // 1 billion
    
    constructor() ERC20(NAME, SYMBOL) ERC20Permit(NAME) {}
}
```

---

## 🌍 Translations

### Supported Languages

| Language | Name | Symbol |
|----------|------|--------|
| English | GigSoul | GSL |
| Spanish | GigSoul | GSL |
| Portuguese | GigSoul | GSL |
| French | GigSoul | GSL |
| German | GigSoul | GSL |

*Note: Name and symbol remain consistent across all languages*

---

## 📣 Marketing Messaging

### Taglines

- "Earn GigSoul with every gig" ✨
- "Your work, your GSL" 💪
- "Power your freelance journey with GigSoul" 🚀
- "GSL: The currency of the gig economy" 💰

### Social Media Hashtags

- #GigSoul
- #GSL
- #EarnGSL
- #GigEconomy
- #Web3Freelancing

### Key Messages

1. **For Freelancers**: "Get rewarded for every contract you complete with GigSoul tokens"
2. **For Clients**: "Use GSL to unlock premium features and faster service"
3. **For Platform**: "GigSoul powers the future of decentralized work"

---

## ✅ Checklist for Rebranding

### Documentation
- [x] Update README.md
- [x] Update PHASE3_PLAN_REVISED.md
- [x] Update PHASE3_CHECKLIST_REVISED.md
- [x] Update database schema SQL
- [x] Create TOKEN_BRANDING.md (this file)

### Code (To Do)
- [ ] Update backend API constants
- [ ] Update frontend components
- [ ] Update mobile app UI
- [ ] Update API documentation
- [ ] Update Swagger/OpenAPI specs

### Design (To Do)
- [ ] Design official GSL logo
- [ ] Create token icon (16x16, 32x32, 64x64, 256x256)
- [ ] Design promotional graphics
- [ ] Create social media assets

### Marketing (To Do)
- [ ] Announce name and branding
- [ ] Update landing page
- [ ] Update social media profiles
- [ ] Press release about token

---

## 📞 Questions & Support

**Token Name Change**: October 8, 2025  
**Phase 3 Launch**: TBD (12 weeks from start)  
**Blockchain Migration**: Phase 4+ (6-12 months after Phase 3)

For questions about GigSoul (GSL), contact:
- Technical: dev@gigchain.io
- Marketing: marketing@gigchain.io
- Community: community@gigchain.io

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-08  
**Status**: ✅ Official Token Branding

---

<div align="center">

**🎉 Welcome to GigSoul (GSL)**

*The Heart of the Gig Economy*

</div>
