# GigChain Tier Badge System (1-5)

## 🏆 Tier Structure

### **Tier 1 - Bronze/Starter**
- **Image:** `tier-1-bronze.png`
- **Description:** Entry level, basic reputation
- **Requirements:** First contract completed
- **Color:** Bronze/Copper tones

### **Tier 2 - Silver/Intermediate** 
- **Image:** `tier-2-silver.png`
- **Description:** Growing reputation, consistent performance
- **Requirements:** 5+ contracts, 4.0+ rating
- **Color:** Silver tones

### **Tier 3 - Gold/Advanced**
- **Image:** `tier-3-gold.png` 
- **Description:** Established expert, high performance
- **Requirements:** 15+ contracts, 4.5+ rating
- **Color:** Gold tones

### **Tier 4 - Platinum/Expert**
- **Image:** `tier-4-platinum.png`
- **Description:** Top performer, premium status
- **Requirements:** 30+ contracts, 4.7+ rating
- **Color:** Platinum/Blue tones

### **Tier 5 - Diamond/Master**
- **Image:** `tier-5-diamond.png`
- **Description:** Elite tier, master level
- **Requirements:** 50+ contracts, 4.8+ rating
- **Color:** Diamond/White tones

---

## 📁 File Organization

```
frontend/public/images/badges/
├── tier-1-bronze.png      ← Your bronze tier image
├── tier-2-silver.png      ← Your silver tier image  
├── tier-3-gold.png        ← Your gold tier image
├── tier-4-platinum.png    ← Your platinum tier image
└── tier-5-diamond.png     ← Your diamond tier image
```

---

## 💻 Implementation

### **1. Tier Mapping Object:**
```javascript
const tierConfig = {
  1: {
    name: 'Bronze',
    image: 'tier-1-bronze.png',
    color: '#CD7F32',
    description: 'Starter Level'
  },
  2: {
    name: 'Silver', 
    image: 'tier-2-silver.png',
    color: '#C0C0C0',
    description: 'Intermediate'
  },
  3: {
    name: 'Gold',
    image: 'tier-3-gold.png', 
    color: '#FFD700',
    description: 'Advanced'
  },
  4: {
    name: 'Platinum',
    image: 'tier-4-platinum.png',
    color: '#E5E4E2', 
    description: 'Expert'
  },
  5: {
    name: 'Diamond',
    image: 'tier-5-diamond.png',
    color: '#B9F2FF',
    description: 'Master'
  }
};
```

### **2. Dynamic Badge Component:**
```jsx
const TierBadge = ({ tier, size = 'medium' }) => {
  const config = tierConfig[tier];
  if (!config) return null;
  
  return (
    <div className={`tier-badge tier-${tier} ${size}`}>
      <img 
        src={`/images/badges/${config.image}`}
        alt={`${config.name} Tier`}
        className="tier-image"
      />
      <span className="tier-label">{config.name}</span>
    </div>
  );
};
```

### **3. Usage Examples:**
```jsx
// In ProfileSimple.jsx
<TierBadge tier={userTier} size="large" />

// In DashboardWeb3.jsx  
<TierBadge tier={userTier} size="small" />

// In contract cards
<TierBadge tier={contractorTier} size="medium" />
```

---

## 🎨 CSS Styling

```css
.tier-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tier-image {
  object-fit: contain;
}

.tier-badge.small .tier-image {
  width: 24px;
  height: 24px;
}

.tier-badge.medium .tier-image {
  width: 32px;
  height: 32px;
}

.tier-badge.large .tier-image {
  width: 48px;
  height: 48px;
}

.tier-label {
  font-weight: 600;
  font-size: 0.875rem;
}

/* Tier-specific colors */
.tier-1 { color: #CD7F32; }
.tier-2 { color: #C0C0C0; }
.tier-3 { color: #FFD700; }
.tier-4 { color: #E5E4E2; }
.tier-5 { color: #B9F2FF; }
```

---

## 📊 Data Structure Update

### **Current (ProfileSimple.jsx):**
```javascript
nfts: [
  { id: 1, name: 'Gold Tier', image: '🏆' },
  { id: 2, name: 'Expert', image: '💎' }
]
```

### **Updated:**
```javascript
nfts: [
  { 
    id: 1, 
    name: 'Gold Tier Reputation',
    imageFile: 'tier-3-gold.png',
    tier: 3,
    rarity: 'Advanced'
  },
  { 
    id: 2, 
    name: 'Diamond Master',
    imageFile: 'tier-5-diamond.png', 
    tier: 5,
    rarity: 'Master'
  }
]
```

---

## 🚀 Next Steps

1. **Save your images** with the naming convention above
2. **Update ProfileSimple.jsx** to use the new tier system
3. **Add the TierBadge component** 
4. **Update CSS** for proper styling

**Ready to implement the tier system!** 🏆
