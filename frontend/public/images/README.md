# GigChain Image Assets

## 📂 Folder Structure

```
public/images/
├── badges/           ← Reputation badges and tier icons
├── nfts/             ← NFT reputation assets
└── achievements/     ← Achievement and milestone icons
```

---

## 🎯 Badge Images

### **Location:**
Place your badge images in: `public/images/badges/`

### **Naming Convention:**
```
gold-tier.png
silver-tier.png
bronze-tier.png
verified-expert.png
top-performer.png
```

### **Usage in Code:**
```jsx
// In ProfileSimple.jsx or DashboardWeb3.jsx
<img 
  src="/images/badges/gold-tier.png" 
  alt="Gold Tier Badge"
  className="badge-image"
/>
```

---

## 🏆 NFT Images

### **Location:**
Place your NFT images in: `public/images/nfts/`

### **Naming Convention:**
```
reputation-gold.png
reputation-silver.png
reputation-bronze.png
smart-contract-expert.png
community-leader.png
```

### **Usage in Code:**
```jsx
// In ProfileSimple.jsx NFTs tab
{profileData.nfts.map((nft) => (
  <div className="nft-card">
    <img 
      src={`/images/nfts/${nft.imageFile}`} 
      alt={nft.name}
      className="nft-image"
    />
  </div>
))}
```

---

## ⭐ Achievement Images

### **Location:**
Place achievement icons in: `public/images/achievements/`

### **Examples:**
```
first-contract.png
10-contracts-milestone.png
top-earner.png
perfect-rating.png
```

---

## 🎨 Image Specifications

### **Recommended Formats:**
- **PNG** with transparency (preferred)
- **SVG** for icons (scalable)
- **WebP** for optimization

### **Recommended Sizes:**

#### **Badges:**
- Small: 32x32px (sidebar, inline)
- Medium: 64x64px (cards)
- Large: 128x128px (profile, modals)

#### **NFTs:**
- Square: 256x256px or 512x512px
- Aspect ratio: 1:1

#### **Achievements:**
- Icon size: 48x48px or 64x64px

---

## 💡 Usage Examples

### **1. Simple Image:**
```jsx
<img src="/images/badges/gold-tier.png" alt="Gold" />
```

### **2. Dynamic Badge:**
```jsx
const badgeMap = {
  'gold': '/images/badges/gold-tier.png',
  'silver': '/images/badges/silver-tier.png',
  'bronze': '/images/badges/bronze-tier.png'
};

<img src={badgeMap[userTier]} alt={`${userTier} tier`} />
```

### **3. With Fallback:**
```jsx
<img 
  src={`/images/badges/${badge.filename}`}
  alt={badge.name}
  onError={(e) => e.target.src = '/images/badges/default.png'}
/>
```

---

## 🔄 Current Implementation

### **ProfileSimple.jsx:**
Currently using emoji placeholders:
```jsx
nfts: [
  { id: 1, name: 'Gold Tier', image: '🏆' },  // ← Replace with imageFile
  { id: 2, name: 'Expert', image: '💎' }
]
```

### **To Update:**
```jsx
nfts: [
  { 
    id: 1, 
    name: 'Gold Tier', 
    imageFile: 'reputation-gold.png'  // ← Add this field
  }
]

// In JSX:
<img src={`/images/nfts/${nft.imageFile}`} alt={nft.name} />
```

---

## 🚀 Next Steps

1. **Add your images** to the folders
2. **Update mock data** with `imageFile` property
3. **Replace emoji** with `<img>` tags
4. **Add CSS** for proper sizing:

```css
.badge-image {
  width: 64px;
  height: 64px;
  object-fit: contain;
}

.nft-image {
  width: 100%;
  height: auto;
  border-radius: 12px;
}
```

---

**Folders Ready:** ✅  
**Examples Provided:** ✅  
**Documentation:** ✅  
**Ready for your images:** 🎨

