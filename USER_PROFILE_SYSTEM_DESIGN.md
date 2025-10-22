# GigChain User Profile Management System

## 🎯 **Current Architecture Analysis**

### **Existing Databases:**
- `data/w_csap.db` - Authentication sessions
- `gigchain.db` - Main application data  
- `gigchain_wallets.db` - Wallet management
- `chat_sessions.db` - Chat AI sessions
- `analytics.db` - Analytics data
- `marketplace.db` - Marketplace data

### **Authentication System:**
- **W-CSAP Protocol** - Wallet-based authentication
- **SQLite** - Local file-based storage
- **Session Management** - JWT tokens with wallet signatures

---

## 🚀 **Recommended Approach: Extend SQLite System**

### **Why SQLite for MVP:**
✅ **Already Integrated** - W-CSAP uses SQLite  
✅ **No Additional Setup** - Works out of the box  
✅ **Web3 Compatible** - Wallet-based identity  
✅ **Fast Development** - No external dependencies  
✅ **Local Development** - Perfect for current setup  

### **When to Upgrade to PostgreSQL:**
- **Production Scale** - 1000+ concurrent users
- **Multi-server** - Horizontal scaling needed
- **Advanced Features** - Complex queries, full-text search
- **Team Collaboration** - Multiple developers

---

## 📊 **User Profile Schema Design**

### **Core Profile Table:**
```sql
CREATE TABLE user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_address TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    location TEXT,
    website TEXT,
    twitter_handle TEXT,
    github_handle TEXT,
    linkedin_handle TEXT,
    
    -- Profile Status
    is_verified BOOLEAN DEFAULT FALSE,
    verification_level INTEGER DEFAULT 0,
    profile_completeness INTEGER DEFAULT 0,
    
    -- Tier System
    current_tier INTEGER DEFAULT 1,
    tier_progress INTEGER DEFAULT 0,
    total_xp INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata
    preferences JSON,
    settings JSON,
    
    FOREIGN KEY (wallet_address) REFERENCES w_csap_sessions(wallet_address)
);
```

### **Skills Table:**
```sql
CREATE TABLE user_skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_address TEXT NOT NULL,
    skill_name TEXT NOT NULL,
    skill_level INTEGER DEFAULT 0,
    endorsements INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (wallet_address) REFERENCES user_profiles(wallet_address),
    UNIQUE(wallet_address, skill_name)
);
```

### **Reputation NFTs Table:**
```sql
CREATE TABLE user_nfts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_address TEXT NOT NULL,
    nft_name TEXT NOT NULL,
    nft_type TEXT NOT NULL, -- 'tier', 'achievement', 'badge'
    tier_level INTEGER,
    rarity TEXT,
    image_file TEXT,
    description TEXT,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (wallet_address) REFERENCES user_profiles(wallet_address)
);
```

---

## 🔧 **Implementation Plan**

### **Phase 1: Database Setup**
1. **Create Profile Tables** - Extend existing SQLite
2. **Migration Script** - Handle existing data
3. **API Endpoints** - CRUD operations

### **Phase 2: Frontend Integration**
1. **Profile Edit Form** - Update user info
2. **Image Upload** - Avatar and NFT images
3. **Real-time Updates** - Sync with backend

### **Phase 3: Advanced Features**
1. **Profile Verification** - KYC integration
2. **Social Links** - Connect external profiles
3. **Privacy Settings** - Control visibility

---

## 💻 **API Endpoints Design**

### **Profile Management:**
```python
# GET /api/profile/{wallet_address}
# POST /api/profile/update
# PUT /api/profile/settings
# GET /api/profile/skills
# POST /api/profile/skills/add
# DELETE /api/profile/skills/{skill_id}
```

### **Image Management:**
```python
# POST /api/profile/avatar/upload
# POST /api/profile/nft/upload
# GET /api/profile/images/{image_id}
```

### **Tier System:**
```python
# GET /api/profile/tier
# POST /api/profile/tier/calculate
# GET /api/profile/achievements
```

---

## 🎨 **Frontend Components**

### **Profile Edit Form:**
```jsx
const ProfileEditForm = () => {
  const [profile, setProfile] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  
  const handleSave = async (updatedProfile) => {
    await updateProfile(updatedProfile);
    setIsEditing(false);
  };
  
  return (
    <form onSubmit={handleSave}>
      <input name="display_name" />
      <textarea name="bio" />
      <input name="location" />
      <input name="website" />
      <button type="submit">Save Profile</button>
    </form>
  );
};
```

### **Image Upload Component:**
```jsx
const ImageUpload = ({ type, onUpload }) => {
  const handleFileUpload = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);
    
    const response = await fetch('/api/profile/upload', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    onUpload(result.image_url);
  };
  
  return <input type="file" onChange={handleFileUpload} />;
};
```

---

## 🔄 **Migration Strategy**

### **Step 1: Database Migration**
```python
def migrate_existing_data():
    """Migrate existing user data to new profile system."""
    # Get all wallet addresses from W-CSAP
    wallets = get_all_wallet_addresses()
    
    for wallet in wallets:
        # Create basic profile
        create_user_profile(wallet)
        
        # Migrate existing data
        migrate_user_data(wallet)
```

### **Step 2: API Integration**
```python
# Add to main.py
@app.post("/api/profile/update")
async def update_profile(
    profile_data: ProfileUpdateRequest,
    wallet: str = Depends(get_current_wallet)
):
    """Update user profile information."""
    return await profile_service.update_profile(wallet, profile_data)
```

### **Step 3: Frontend Updates**
```jsx
// Update ProfileSimple.jsx
const ProfileSimple = () => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    loadUserProfile();
  }, []);
  
  const loadUserProfile = async () => {
    const profileData = await fetchProfile(address);
    setProfile(profileData);
    setIsLoading(false);
  };
  
  if (isLoading) return <LoadingSpinner />;
  
  return <ProfileForm profile={profile} onUpdate={loadUserProfile} />;
};
```

---

## 🚀 **Next Steps**

### **Immediate Actions:**
1. **Create Profile Tables** - SQLite schema
2. **Build API Endpoints** - Profile CRUD
3. **Update Frontend** - Edit forms and image upload
4. **Test Integration** - End-to-end flow

### **Future Enhancements:**
1. **PostgreSQL Migration** - When scaling up
2. **IPFS Integration** - Decentralized image storage
3. **Social Verification** - Connect external profiles
4. **Advanced Analytics** - Profile performance metrics

---

## 📋 **Implementation Checklist**

- [ ] Create database schema
- [ ] Build profile API endpoints
- [ ] Create profile edit form
- [ ] Implement image upload
- [ ] Add profile validation
- [ ] Test with existing authentication
- [ ] Update frontend components
- [ ] Add error handling
- [ ] Write documentation

**Ready to implement!** 🚀
