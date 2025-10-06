import React, { useState } from 'react';
import { Wallet, Plus, Copy, ExternalLink, TrendingUp, TrendingDown, Eye, EyeOff, Search } from 'lucide-react';
import { logger } from '../../utils/logger';

// Inline styles
const styles = {
  view: {
    padding: '2rem',
    background: '#f8fafc',
    minHeight: '100vh'
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: '0 0 0.5rem 0'
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#94a3b8',
    margin: '0 0 2rem 0'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '1.5rem'
  },
  card: {
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    border: '1px solid #475569',
    borderRadius: '16px',
    padding: '1.5rem',
    transition: 'all 0.3s ease'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem'
  },
  walletIcon: {
    width: '50px',
    height: '50px',
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white'
  },
  walletName: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#e2e8f0',
    margin: '0'
  },
  walletAddress: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    margin: '0.25rem 0 0 0'
  },
  balance: {
    textAlign: 'center',
    marginBottom: '1rem',
    padding: '1rem',
    background: 'rgba(15, 23, 42, 0.5)',
    borderRadius: '12px'
  },
  balanceAmount: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#e2e8f0'
  },
  balanceCurrency: {
    fontSize: '1rem',
    color: '#f59e0b',
    fontWeight: '600'
  },
  stats: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '1rem',
    fontSize: '0.9rem'
  },
  statItem: {
    textAlign: 'center',
    flex: 1
  },
  statLabel: {
    color: '#64748b',
    fontSize: '0.8rem'
  },
  statValue: {
    color: '#e2e8f0',
    fontWeight: '600'
  },
  actions: {
    display: 'flex',
    gap: '0.5rem'
  },
  btn: {
    flex: 1,
    padding: '0.5rem',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: 'white'
  },
  btnSecondary: {
    background: 'rgba(30, 41, 59, 0.8)',
    color: '#94a3b8',
    border: '1px solid #475569'
  }
};

const WalletsView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPrivateKeys, setShowPrivateKeys] = useState(false);

  const wallets = [
    {
      id: 1,
      name: 'Wallet Principal',
      address: '0x1234567890abcdef1234567890abcdef12345678',
      balance: '2,450.75',
      currency: 'USDC',
      network: 'Mumbai',
      isActive: true,
      lastActivity: 'Hace 2 horas',
      transactions: 45,
      totalReceived: '15,230.50',
      totalSent: '12,779.75'
    },
    {
      id: 2,
      name: 'Wallet de Ahorros',
      address: '0x9876543210fedcba9876543210fedcba98765432',
      balance: '5,200.00',
      currency: 'USDC',
      network: 'Polygon',
      isActive: false,
      lastActivity: 'Hace 1 día',
      transactions: 12,
      totalReceived: '8,500.00',
      totalSent: '3,300.00'
    },
    {
      id: 3,
      name: 'Wallet de Pruebas',
      address: '0xabcdef1234567890abcdef1234567890abcdef12',
      balance: '150.25',
      currency: 'MATIC',
      network: 'Mumbai',
      isActive: true,
      lastActivity: 'Hace 30 minutos',
      transactions: 8,
      totalReceived: '500.00',
      totalSent: '349.75'
    }
  ];

  const filteredWallets = wallets.filter(wallet => 
    wallet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wallet.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyAddress = (address) => {
    navigator.clipboard.writeText(address);
    logger.action('wallet_address_copied', { address: address.substring(0, 10) + '...' });
  };

  const handleViewOnExplorer = (address, network) => {
    const explorerUrl = network === 'Mumbai' 
      ? `https://mumbai.polygonscan.com/address/${address}`
      : `https://polygonscan.com/address/${address}`;
    window.open(explorerUrl, '_blank');
  };

  const handleCreateWallet = () => {
    try {
      alert('Creación de wallet. Por favor, conecta tu wallet usando el botón de conexión en el header.');
      // En producción, esto abriría un modal para conectar wallet
    } catch (error) {
      console.error('Error creating wallet:', error);
      alert('Error al crear wallet. Por favor, intenta de nuevo.');
    }
  };

  const handleToggleWallet = (wallet) => {
    try {
      // Toggle wallet active state (in production, this would update backend)
      alert(`Wallet ${wallet.name} ${wallet.status === 'active' ? 'desactivada' : 'activada'} exitosamente.`);
    } catch (error) {
      console.error('Error toggling wallet:', error);
      alert('Error al cambiar estado de la wallet. Por favor, intenta de nuevo.');
    }
  };

  return (
    <div style={styles.view}>
      <h1 style={styles.title}>Gestión de Wallets</h1>
      <p style={styles.subtitle}>Administra tus wallets y monitorea sus balances</p>

      <div style={styles.grid}>
        {filteredWallets.map(wallet => (
          <div key={wallet.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.walletIcon}>
                <Wallet size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={styles.walletName}>{wallet.name}</h3>
                <p style={styles.walletAddress}>
                  {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                </p>
              </div>
              <div style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: '600',
                background: wallet.isActive ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(107, 114, 128, 0.2)',
                color: wallet.isActive ? 'white' : '#9ca3af'
              }}>
                {wallet.isActive ? 'Activa' : 'Inactiva'}
              </div>
            </div>

            <div style={styles.balance}>
              <div style={styles.balanceAmount}>{wallet.balance}</div>
              <div style={styles.balanceCurrency}>{wallet.currency}</div>
              <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                Red: {wallet.network}
              </div>
            </div>

            <div style={styles.stats}>
              <div style={styles.statItem}>
                <div style={styles.statLabel}>Transacciones</div>
                <div style={styles.statValue}>{wallet.transactions}</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statLabel}>Última actividad</div>
                <div style={styles.statValue}>{wallet.lastActivity}</div>
              </div>
            </div>

            <div style={styles.actions}>
              <button 
                style={{...styles.btn, ...styles.btnPrimary}}
                onClick={() => handleViewOnExplorer(wallet.address, wallet.network)}
              >
                <ExternalLink size={16} />
                Explorer
              </button>
              <button 
                style={{...styles.btn, ...styles.btnSecondary}}
                onClick={() => handleToggleWallet(wallet)}
              >
                {wallet.isActive ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredWallets.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b' }}>
          <Wallet size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0', color: '#94a3b8' }}>No se encontraron wallets</h3>
          <p style={{ margin: '0', fontSize: '1rem' }}>Intenta ajustar los filtros de búsqueda</p>
        </div>
      )}
    </div>
  );
};

export { WalletsView };
export default WalletsView;
