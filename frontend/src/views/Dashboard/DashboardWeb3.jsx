import React, { useState, useEffect } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { useWalletAuth } from '../../hooks/useWalletAuth';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';
import { 
  Wallet, FileText, Activity, TrendingUp, Clock, 
  Zap, CheckCircle, AlertCircle, Users, Award,
  BarChart3, ArrowUpRight, Shield, Briefcase, Target,
  Code, Rocket, TrendingDown, DollarSign
} from 'lucide-react';
import WalletBanner from '../../components/Web3/WalletBanner';
import './DashboardWeb3.css';
import '../../styles/web3-theme.css';

const DashboardWeb3 = () => {
  const { address, chainId, isCorrectChain } = useWallet();
  const { sessionData, isAuthenticated } = useWalletAuth();
  const { metrics, isLoading } = useDashboardMetrics(address);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [newActivityPulse, setNewActivityPulse] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  
  // Tier configuration
  const tierConfig = {
    1: { name: 'Bronze', image: 'tier-1-bronze.png', color: '#CD7F32', description: 'Starter Level' },
    2: { name: 'Silver', image: 'tier-2-silver.png', color: '#C0C0C0', description: 'Intermediate' },
    3: { name: 'Gold', image: 'tier-3-gold.png', color: '#FFD700', description: 'Advanced' },
    4: { name: 'Platinum', image: 'tier-4-platinum.png', color: '#E5E4E2', description: 'Expert' },
    5: { name: 'Diamond', image: 'tier-5-diamond.png', color: '#B9F2FF', description: 'Master' }
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
  
  // User identicon/avatar
  const getUserIdenticon = (addr) => {
    if (!addr) return '👤';
    const icons = ['🦊', '🐺', '🦁', '🐯', '🐻', '🐼', '🐨', '🐸'];
    const index = parseInt(addr?.slice(2, 4), 16) % icons.length;
    return icons[index];
  };
  
  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };
  
  const copyAddressToClipboard = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setAddressCopied(true);
      // Reset after 2 seconds
      setTimeout(() => setAddressCopied(false), 2000);
    }
  };
  
  const handleDisconnect = () => {
    // Redirect to logout or disconnect wallet
    window.location.href = '/';
  };
  
  const walletAddress = sessionData?.wallet_address || address;
  const userIcon = getUserIdenticon(walletAddress);
  const networkName = isCorrectChain ? 'Polygon Amoy' : 'Red Incorrecta';
  const networkChainId = chainId || '80002';
  
  // Simulate new activity notification
  useEffect(() => {
    const timer = setTimeout(() => {
      setNewActivityPulse(true);
      setTimeout(() => setNewActivityPulse(false), 3000);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);
  
  const [dashboardData, setDashboardData] = useState({
    balance: {
      gig: 1250.50,
      usdc: 5430.00,
      matic: 125.30
    },
    contracts: {
      active: 12,
      completed: 45,
      pending: 3,
      totalValue: 25000
    },
    nfts: {
      reputation: 3,
      achievements: 7,
      total: 10
    },
    activity: [
      { id: 1, type: 'contract', description: 'Contrato completado - Web Development', amount: 500, timestamp: '2h ago', status: 'success' },
      { id: 2, type: 'payment', description: 'Pago recibido de Cliente ABC', amount: 350, timestamp: '5h ago', status: 'success' },
      { id: 3, type: 'nft', description: 'NFT de reputación recibido', amount: null, timestamp: '1d ago', status: 'success' },
      { id: 4, type: 'stake', description: 'Staking iniciado - Pool 30 días', amount: 1000, timestamp: '2d ago', status: 'pending' },
      { id: 5, type: 'contract', description: 'Nuevo contrato creado', amount: 750, timestamp: '3d ago', status: 'pending' }
    ],
    stats: {
      totalEarnings: 15250,
      monthlyEarnings: 3420,
      successRate: 96.5,
      responseTime: '2.3h'
    }
  });

  // Only show first 5 activities
  const recentActivity = dashboardData.activity.slice(0, 5);

  const quickActions = [
    { id: 'create-contract', label: 'Crear Contrato', icon: FileText, color: 'green', path: '/contracts' },
    { id: 'view-contracts', label: 'Ver Contratos', icon: BarChart3, color: 'blue', path: '/contracts' },
    { id: 'stake', label: 'Stakear GIG', icon: Zap, color: 'purple', path: '/staking' },
    { id: 'marketplace', label: 'Marketplace', icon: Rocket, color: 'cyan', path: '/marketplace' }
  ];
  
  const handleQuickAction = (path) => {
    if (path) {
      window.location.href = path;
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2 }).format(num);
  };

  const getActivityIcon = (type) => {
    const icons = {
      contract: <FileText size={20} />,
      payment: <DollarSign size={20} />,
      nft: <Shield size={20} />,
      stake: <TrendingUp size={20} />
    };
    return icons[type] || <Activity size={20} />;
  };

  const getStatusColor = (status) => {
    return status === 'success' ? 'status-success' : 'status-pending';
  };

  return (
    <div className="dashboard-web3-container">
      {/* SVG Gradients for Circular Progress */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00ff88" />
            <stop offset="100%" stopColor="#00d4ff" />
          </linearGradient>
          <linearGradient id="cyanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d4ff" />
            <stop offset="100%" stopColor="#667eea" />
          </linearGradient>
        </defs>
      </svg>

      {/* Hero Header with Enhanced User Identity */}
      <div className="dashboard-hero">
        <div className="hero-left">
          <div className="user-identicon" title="Tu identidad blockchain">{userIcon}</div>
          <div className="hero-info">
            <div className="title-section">
              <h1 className="dashboard-title">Dashboard</h1>
              <div className="title-accent"></div>
            </div>
            <p className="dashboard-subtitle">Resumen general de tu actividad en GigChain</p>
            
            <div className="user-address-display">
              <div className="address-container">
                <div className="address-badge" title={walletAddress}>
                  {truncateAddress(walletAddress)}
                </div>
                <TierBadge tier={4} size="small" />
                <button 
                  className={`address-action-btn copy-btn ${addressCopied ? 'copied' : ''}`}
                  onClick={copyAddressToClipboard}
                  title={addressCopied ? "¡Copiado!" : "Copiar dirección completa"}
                  aria-label={addressCopied ? "Dirección copiada" : "Copiar dirección"}
                >
                  {addressCopied ? '✅' : '📋'}
                </button>
                <button 
                  className="address-action-btn disconnect-btn" 
                  onClick={handleDisconnect}
                  title="Desconectar wallet"
                  aria-label="Desconectar wallet"
                >
                  🔌
                </button>
              </div>
              
              {isCorrectChain ? (
                <div className="network-status connected">
                  <span className="status-dot"></span>
                  <span className="network-name">{networkName}</span>
                  <span className="network-chain-id">Chain {networkChainId}</span>
                </div>
              ) : (
                <div className="network-status disconnected">
                  <AlertCircle size={14} />
                  <span className="network-name">{networkName}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="hero-right">
          <div className="last-update">
            <Clock size={16} />
            <span>Actualizado hace 2m</span>
          </div>
        </div>
      </div>

      {/* Onboarding Messages - Contextual Help */}
      {showOnboarding && dashboardData.contracts.active === 0 && (
        <div className="onboarding-card glass-card pulse-subtle" role="alert" aria-live="polite">
          <button 
            className="dismiss-btn" 
            onClick={() => setShowOnboarding(false)}
            aria-label="Cerrar mensaje de ayuda"
          >
            ✕
          </button>
          <div className="onboarding-icon">
            <Rocket size={32} />
          </div>
          <div className="onboarding-content">
            <h3>🚀 ¡Comienza tu viaje en GigChain!</h3>
            <p>No tienes contratos activos todavía. Crea tu primer contrato inteligente o explora el marketplace.</p>
            <div className="onboarding-actions">
              <button className="onboarding-btn primary" onClick={() => handleQuickAction('/contracts')}>
                <FileText size={18} />
                Crear Contrato
              </button>
              <button className="onboarding-btn secondary" onClick={() => handleQuickAction('/marketplace')}>
                <Rocket size={18} />
                Explorar Marketplace
              </button>
            </div>
          </div>
        </div>
      )}

      {showOnboarding && dashboardData.nfts.reputation === 0 && (
        <div className="onboarding-card glass-card tip-card" role="complementary">
          <button 
            className="dismiss-btn" 
            onClick={() => setShowOnboarding(false)}
            aria-label="Cerrar consejo"
          >
            ✕
          </button>
          <div className="tip-icon">
            <Award size={24} />
          </div>
          <div className="tip-content">
            <h4>💡 Tip: ¿Qué son los NFTs de Reputación?</h4>
            <p>Completa contratos y gana NFTs que certifican tu reputación en la blockchain. ¡Son tu credencial profesional descentralizada!</p>
          </div>
        </div>
      )}

      {/* Main Stats Grid - Modular & Spacious */}
      <div className="main-stats-grid">
        {/* Balance GIG Card */}
        <div className="stat-card-large glass-card card-accent-green" role="region" aria-label="Balance de tokens GIG">
          <div className="card-accent-border"></div>
          <div className="card-icon-large green animated-icon">
            <Wallet size={40} />
          </div>
          <div className="card-content-large">
            <h3 className="card-title">Balance GIG</h3>
            <div className="card-value-huge crypto-price" aria-label={`${formatNumber(dashboardData.balance.gig)} tokens GIG`}>
              {formatNumber(dashboardData.balance.gig)}
            </div>
            <div className="card-unit">GIG Tokens</div>
            <div className="card-trend positive">
              <ArrowUpRight size={18} aria-hidden="true" />
              <span>+{(dashboardData.balance.gig * 0.125).toFixed(2)} este mes</span>
            </div>
          </div>
        </div>

        {/* NFTs & Achievements Card */}
        <div className="stat-card-large glass-card card-accent-purple" role="region" aria-label="NFTs de reputación y logros">
          <div className="card-accent-border"></div>
          <div className="card-icon-large purple animated-icon">
            <Award size={40} />
          </div>
          <div className="card-content-large">
            <h3 className="card-title">Reputación & Logros</h3>
            <div className="card-value-huge" style={{ color: '#8b5cf6', textShadow: '0 0 30px rgba(139, 92, 246, 0.6)' }}>
              {dashboardData.nfts.reputation}
            </div>
            <div className="card-unit">NFTs de Reputación</div>
            <div className="achievements-list">
              <Shield size={16} aria-hidden="true" />
              <span>{dashboardData.nfts.achievements} logros desbloqueados</span>
            </div>
          </div>
          {dashboardData.nfts.reputation === 0 && (
            <div className="empty-state-hint" role="note">
              <span>Completa contratos para ganar NFTs</span>
            </div>
          )}
        </div>

        {/* Contracts Card */}
        <div className="stat-card-large glass-card card-accent-cyan" role="region" aria-label="Contratos activos y completados">
          <div className="card-accent-border"></div>
          <div className="card-icon-large cyan animated-icon">
            <Briefcase size={40} />
          </div>
          <div className="card-content-large">
            <h3 className="card-title">Contratos</h3>
            <div className="card-value-huge" style={{ color: '#00d4ff', textShadow: '0 0 30px rgba(0, 212, 255, 0.6)' }}>
              {dashboardData.contracts.active}
            </div>
            <div className="card-unit">Contratos Activos</div>
            <div className="contracts-meta">
              <CheckCircle size={16} aria-hidden="true" />
              <span>{dashboardData.contracts.completed} completados</span>
            </div>
          </div>
          {dashboardData.contracts.active === 0 && (
            <div className="empty-state-hint" role="note">
              <span>Crea tu primer contrato →</span>
            </div>
          )}
        </div>
      </div>

      {/* Performance Metrics - Circular Gauges Style */}
      <div className="performance-grid">
        <div className="performance-card glass-card">
          <div className="circular-progress">
            <svg className="progress-ring" width="120" height="120">
              <circle
                className="progress-ring-bg"
                cx="60"
                cy="60"
                r="54"
              />
              <circle
                className="progress-ring-fill"
                cx="60"
                cy="60"
                r="54"
                style={{
                  strokeDasharray: `${2 * Math.PI * 54}`,
                  strokeDashoffset: `${2 * Math.PI * 54 * (1 - dashboardData.stats.successRate / 100)}`
                }}
              />
            </svg>
            <div className="progress-center">
              <div className="progress-value">{dashboardData.stats.successRate}%</div>
              <div className="progress-label">Éxito</div>
            </div>
          </div>
          <h4 className="performance-title">Tasa de Éxito</h4>
          <p className="performance-subtitle">Contratos completados exitosamente</p>
        </div>

        <div className="performance-card glass-card">
          <div className="circular-progress">
            <svg className="progress-ring" width="120" height="120">
              <circle
                className="progress-ring-bg"
                cx="60"
                cy="60"
                r="54"
              />
              <circle
                className="progress-ring-fill cyan"
                cx="60"
                cy="60"
                r="54"
                style={{
                  strokeDasharray: `${2 * Math.PI * 54}`,
                  strokeDashoffset: `${2 * Math.PI * 54 * (1 - 98 / 100)}`
                }}
              />
            </svg>
            <div className="progress-center">
              <div className="progress-value">98%</div>
              <div className="progress-label">Tiempo</div>
            </div>
          </div>
          <h4 className="performance-title">Entregas a Tiempo</h4>
          <p className="performance-subtitle">Cumplimiento de deadlines</p>
        </div>

        <div className="performance-card glass-card">
          <div className="stat-icon-wrapper">
            <Clock size={48} className="stat-main-icon" />
          </div>
          <div className="stat-value-alt">{dashboardData.stats.responseTime}</div>
          <h4 className="performance-title">Tiempo de Respuesta</h4>
          <p className="performance-subtitle">Promedio de respuesta a clientes</p>
        </div>

        <div className="performance-card glass-card">
          <div className="stat-icon-wrapper">
            <Briefcase size={48} className="stat-main-icon" />
          </div>
          <div className="stat-value-alt">{dashboardData.contracts.totalValue}</div>
          <div className="stat-unit-alt">GIG</div>
          <h4 className="performance-title">Valor Total</h4>
          <p className="performance-subtitle">Contratos en curso</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="dashboard-two-column">
        {/* Left Column - Contracts & Activity */}
        <div className="dashboard-left">
          {/* Active Contracts */}
          <div className="contracts-section glass-card">
            <div className="section-header">
              <h2>📝 Contratos Activos</h2>
              <span className="badge-count">{dashboardData.contracts.active}</span>
            </div>
            <div className="contracts-grid">
              {[
                { id: 1, title: 'Desarrollo Web Full Stack', client: 'TechCorp', value: 5000, progress: 65, status: 'in-progress' },
                { id: 2, title: 'Diseño UI/UX Mobile App', client: 'StartupXYZ', value: 3500, progress: 40, status: 'in-progress' },
                { id: 3, title: 'Smart Contract Audit', client: 'DeFi Protocol', value: 8000, progress: 20, status: 'pending' }
              ].map(contract => (
                <div key={contract.id} className="contract-item">
                  <div className="contract-header">
                    <h4>{contract.title}</h4>
                    <span className={`status-badge ${contract.status}`}>
                      {contract.status === 'in-progress' ? 'En Progreso' : 'Pendiente'}
                    </span>
                  </div>
                  <div className="contract-meta">
                    <span className="client-name">
                      <Users size={14} />
                      {contract.client}
                    </span>
                    <span className="contract-value">
                      ${formatNumber(contract.value)} GIG
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${contract.progress}%` }}
                      />
                    </div>
                    <span className="progress-text">{contract.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className={`activity-section glass-card ${newActivityPulse ? 'new-activity-pulse' : ''}`} role="region" aria-label="Actividad reciente">
            <div className="section-header">
              <h2>⚡ Actividad Reciente</h2>
              {newActivityPulse && (
                <span className="new-badge" role="status" aria-live="polite">
                  ¡Nueva!
                </span>
              )}
              <button className="view-all-btn" aria-label="Ver toda la actividad">Ver todo</button>
            </div>
            <div className="activity-list" role="list">
              {recentActivity.map((item, index) => (
                <div 
                  key={item.id} 
                  className={`activity-item ${index === 0 && newActivityPulse ? 'highlight-new' : ''}`}
                  role="listitem"
                  tabIndex="0"
                >
                  <div className={`activity-icon ${item.type}`} aria-hidden="true">
                    {getActivityIcon(item.type)}
                  </div>
                  <div className="activity-content">
                    <p className="activity-description">{item.description}</p>
                    <span className="activity-time">{item.timestamp}</span>
                  </div>
                  {item.amount && (
                    <div className="activity-amount" aria-label={`${item.amount} tokens GIG`}>
                      +{item.amount} GIG
                    </div>
                  )}
                  <div className={`activity-status ${getStatusColor(item.status)}`} aria-label={item.status === 'success' ? 'Completado' : 'Pendiente'}>
                    {item.status === 'success' ? <CheckCircle size={16} /> : <Clock size={16} />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Quick Actions & Stats */}
        <div className="dashboard-right">
          {/* Quick Actions - Sticky Panel */}
          <div className="quick-actions-section glass-card sticky-panel">
            <h2>🚀 Acciones Rápidas</h2>
            <div className="quick-actions-grid">
              {quickActions.map(action => (
                <button 
                  key={action.id}
                  className={`quick-action-btn ${action.color}`}
                  onClick={() => handleQuickAction(action.path)}
                >
                  <div className={`action-icon ${action.color}`}>
                    <action.icon size={28} />
                  </div>
                  <span className="action-label">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Network Status */}
          <div className="network-status-card glass-card">
            <div className="network-header">
              <h3>🌐 Estado de Red</h3>
              <div className="status-dot live"></div>
            </div>
            <div className="network-info">
              <div className="network-item">
                <span className="network-label">Red Actual:</span>
                <span className="network-value">Polygon Amoy</span>
              </div>
              <div className="network-item">
                <span className="network-label">Chain ID:</span>
                <span className="network-value mono">80002</span>
              </div>
              <div className="network-item">
                <span className="network-label">Bloques:</span>
                <span className="network-value mono">12,456,789</span>
              </div>
              <div className="network-item">
                <span className="network-label">Gas Price:</span>
                <span className="network-value">~30 Gwei</span>
              </div>
            </div>
          </div>

          {/* Network Status - Always Visible */}
          <div className="network-info-card glass-card">
            <div className="network-header-alt">
              <Target size={20} />
              <h3>Información de Red</h3>
            </div>
            <div className="network-details">
              <div className="network-row">
                <span className="detail-label">Chain ID</span>
                <span className="detail-value mono">{chainId || '80002'}</span>
              </div>
              <div className="network-row">
                <span className="detail-label">Bloques</span>
                <span className="detail-value mono">12,456,789</span>
              </div>
              <div className="network-row">
                <span className="detail-label">Gas</span>
                <span className="detail-value">~30 Gwei</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardWeb3;

