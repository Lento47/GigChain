import React, { useState, useEffect } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { useWalletAuth } from '../../hooks/useWalletAuth';
import { useProfile } from '../../hooks/useProfile';
import ProfileEditForm from '../../components/ProfileEditForm';
import { 
  User, MapPin, Calendar, Briefcase, Award, 
  Shield, Edit, Settings, ExternalLink, Copy,
  Mail, Twitter, Github, Globe, Users, TrendingUp
} from 'lucide-react';
import './Profile.css';

const ProfileSimple = () => {
  const { address, isConnected } = useWallet();
  const { isAuthenticated, sessionData } = useWalletAuth();
  const { 
    profile, 
    skills, 
    nfts, 
    isLoading, 
    error, 
    hasProfile,
    profileCompleteness,
    loadProfile 
  } = useProfile();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditForm, setShowEditForm] = useState(false);

  // Tier configuration
  const tierConfig = {
    1: { name: 'Bronze', image: 'tier-1-bronze.png', color: '#CD7F32', description: 'Starter Level' },
    2: { name: 'Silver', image: 'tier-2-silver.png', color: '#C0C0C0', description: 'Intermediate' },
    3: { name: 'Gold', image: 'tier-3-gold.png', color: '#FFD700', description: 'Advanced' },
    4: { name: 'Platinum', image: 'tier-4-platinum.png', color: '#E5E4E2', description: 'Expert' },
    5: { name: 'Diamond', image: 'tier-5-diamond.png', color: '#B9F2FF', description: 'Master' }
  };

  // Use real profile data or fallback to mock data
  const profileData = profile ? {
    name: profile.display_name || 'Web3 Developer',
    username: profile.username || address?.slice(0, 10) || 'user',
    bio: profile.bio || 'Especialista en Smart Contracts y DeFi. Building the decentralized future 🚀',
    location: profile.location || 'Remote',
    joinedDate: profile.created_at ? new Date(profile.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : 'Octubre 2024',
    website: profile.website || 'gigchain.io',
    currentTier: profile.current_tier || 4,
    stats: {
      contracts: 45, // TODO: Get from contracts API
      earnings: 15420.50, // TODO: Get from earnings API
      rating: 4.9, // TODO: Get from rating API
      connections: 892 // TODO: Get from connections API
    },
    skills: skills.map(skill => ({
      name: skill.skill_name,
      level: skill.skill_level,
      endorsements: skill.endorsements
    })),
    nfts: nfts.map(nft => ({
      id: nft.id,
      name: nft.nft_name,
      rarity: nft.rarity || 'Rare',
      imageFile: nft.image_file,
      tier: nft.tier_level,
      description: nft.description
    }))
  } : {
    name: 'Web3 Developer',
    username: address?.slice(0, 10) || 'user',
    bio: 'Especialista en Smart Contracts y DeFi. Building the decentralized future 🚀',
    location: 'Remote',
    joinedDate: 'Octubre 2024',
    website: 'gigchain.io',
    currentTier: 4,
    stats: {
      contracts: 45,
      earnings: 15420.50,
      rating: 4.9,
      connections: 892
    },
    skills: [
      { name: 'Solidity', level: 95, endorsements: 45 },
      { name: 'Web3', level: 90, endorsements: 38 },
      { name: 'DeFi', level: 85, endorsements: 32 },
      { name: 'React', level: 88, endorsements: 28 }
    ],
    nfts: [
      { 
        id: 1, 
        name: 'Platinum Tier Reputation', 
        rarity: 'Expert',
        imageFile: 'tier-4-platinum.png',
        tier: 4,
        description: 'Top performer with premium status'
      },
      { 
        id: 2, 
        name: 'Gold Achievement', 
        rarity: 'Advanced',
        imageFile: 'tier-3-gold.png',
        tier: 3,
        description: 'Established expert level'
      },
      { 
        id: 3, 
        name: 'Diamond Master', 
        rarity: 'Master',
        imageFile: 'tier-5-diamond.png',
        tier: 5,
        description: 'Elite tier achievement'
      }
    ]
  };

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
    }
  };

  // TierBadge component
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

  const handleProfileSave = () => {
    setShowEditForm(false);
    loadProfile(); // Reload profile data
  };

  const handleProfileClose = () => {
    setShowEditForm(false);
  };

  if (!isConnected) {
    return (
      <div className="profile-container">
        <div className="empty-state">
          <User size={64} className="empty-icon" />
          <h2>Conecta tu wallet</h2>
          <p>Conecta tu wallet para ver tu perfil</p>
        </div>
      </div>
    );
  }

  if (showEditForm) {
    return (
      <div className="profile-container">
        <ProfileEditForm 
          onClose={handleProfileClose}
          onSave={handleProfileSave}
        />
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Hero Header */}
      <div className="profile-hero">
        <div className="hero-left">
          <div className="hero-icon">
            <User size={48} />
          </div>
          <div className="hero-info">
            <div className="title-section">
              <h1 className="profile-title">Mi Perfil</h1>
              <div className="title-accent"></div>
            </div>
            <p className="profile-subtitle">Perfil y conexiones profesionales</p>
          </div>
        </div>
        <div className="hero-right">
          <button 
            className="edit-profile-btn"
            onClick={() => setShowEditForm(true)}
          >
            <Edit size={16} />
            <span>{hasProfile ? 'Editar Perfil' : 'Crear Perfil'}</span>
          </button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="profile-content glass-card">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar-large">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profileData.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
            ) : (
              profileData.name?.slice(0, 2).toUpperCase() || address?.slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="profile-info">
            <div className="profile-name-tier">
              <h2>{profileData.name}</h2>
              <TierBadge tier={profileData.currentTier} size="small" />
            </div>
            <div className="profile-address" onClick={copyAddress} title="Click para copiar">
              <span>{truncateAddress(address)}</span>
              <Copy size={14} />
            </div>
            <p className="profile-bio">{profileData.bio}</p>
            <div className="profile-meta">
              <span className="meta-item">
                <MapPin size={14} />
                {profileData.location}
              </span>
              <span className="meta-item">
                <Calendar size={14} />
                Se unió en {profileData.joinedDate}
              </span>
              <span className="meta-item">
                <Globe size={14} />
                <a href={`https://${profileData.website}`} target="_blank" rel="noopener noreferrer">
                  {profileData.website}
                </a>
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="profile-stats-grid">
          <div className="stat-card">
            <Briefcase size={24} />
            <div className="stat-value">{profileData.stats.contracts}</div>
            <div className="stat-label">Contratos</div>
          </div>
          <div className="stat-card">
            <TrendingUp size={24} />
            <div className="stat-value">{profileData.stats.earnings.toFixed(2)}</div>
            <div className="stat-label">GIG Ganados</div>
          </div>
          <div className="stat-card">
            <Award size={24} />
            <div className="stat-value">{profileData.stats.rating}</div>
            <div className="stat-label">Rating</div>
          </div>
          <div className="stat-card">
            <Users size={24} />
            <div className="stat-value">{profileData.stats.connections}</div>
            <div className="stat-label">Conexiones</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Resumen
          </button>
          <button 
            className={`tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
            onClick={() => setActiveTab('skills')}
          >
            Skills
          </button>
          <button 
            className={`tab-btn ${activeTab === 'nfts' ? 'active' : ''}`}
            onClick={() => setActiveTab('nfts')}
          >
            NFTs
          </button>
          <button 
            className={`tab-btn ${activeTab === 'connections' ? 'active' : ''}`}
            onClick={() => setActiveTab('connections')}
          >
            Conexiones
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'skills' && (
            <div className="skills-section">
              <h3>Skills & Endorsements</h3>
              <div className="skills-list">
                {profileData.skills.map((skill, idx) => (
                  <div key={idx} className="skill-item">
                    <div className="skill-info">
                      <h4>{skill.name}</h4>
                      <span className="endorsements">{skill.endorsements} endorsements</span>
                    </div>
                    <div className="skill-bar">
                      <div 
                        className="skill-fill" 
                        style={{ width: `${skill.level}%` }}
                      ></div>
                    </div>
                    <span className="skill-level">{skill.level}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'nfts' && (
            <div className="nfts-section">
              <h3>Reputation NFTs</h3>
              <div className="nfts-grid">
                {profileData.nfts.map((nft) => (
                  <div key={nft.id} className="nft-card">
                    <div className="nft-image-container">
                      <img 
                        src={`/images/badges/${nft.imageFile}`}
                        alt={nft.name}
                        className="nft-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="nft-fallback" style={{ display: 'none' }}>
                        <TierBadge tier={nft.tier} size="large" />
                      </div>
                    </div>
                    <h4>{nft.name}</h4>
                    <p className="nft-description">{nft.description}</p>
                    <span className={`rarity ${nft.rarity.toLowerCase()}`}>
                      {nft.rarity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'connections' && (
            <div className="connections-section">
              <h3>Conexiones ({profileData.stats.connections})</h3>
              <p className="text-secondary">Administra tus conexiones profesionales en la red GigChain.</p>
              <div className="coming-soon">
                <Users size={48} />
                <p>Panel de conexiones próximamente</p>
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="overview-section">
              <h3>Resumen de Actividad</h3>
              <p className="text-secondary">
                Usuario verificado en GigChain con {profileData.stats.contracts} contratos completados
                y rating promedio de {profileData.stats.rating}⭐.
              </p>
              <div className="quick-stats">
                <div className="quick-stat">
                  <Shield size={20} />
                  <span>Verificado</span>
                </div>
                <div className="quick-stat">
                  <Award size={20} />
                  <span>{profileData.nfts.length} NFTs</span>
                </div>
                <div className="quick-stat">
                  <Briefcase size={20} />
                  <span>{profileData.skills.length} Skills</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSimple;

