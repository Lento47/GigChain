import React, { useState, useMemo, useCallback } from 'react';
import { Wallet, Plus, Copy, ExternalLink, TrendingUp, TrendingDown, Eye, EyeOff, Search } from 'lucide-react';
import useDebounce from '../../hooks/useDebounce';
import { logger } from '../../utils/logger';
import './Wallets.css';

const WalletsView = React.memo(() => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showBalances, setShowBalances] = useState(true);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const wallets = [
    {
      id: 1,
      name: 'Main Wallet',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      balance: '15,432.50',
      currency: 'USDC',
      change: '+12.5',
      network: 'Polygon',
      isConnected: true
    },
    {
      id: 2,
      name: 'Business Wallet',
      address: '0x3b48e45C12C4bb44c233D7a4893d2C5B6fa2f9E8',
      balance: '8,720.00',
      currency: 'USDC',
      change: '+5.2',
      network: 'Ethereum',
      isConnected: true
    },
    {
      id: 3,
      name: 'Savings Wallet',
      address: '0x9fB29AAc15b9A4B7F17c3385939b007540F4d791',
      balance: '24,156.75',
      currency: 'USDC',
      change: '-2.8',
      network: 'Arbitrum',
      isConnected: false
    }
  ];

  const filteredWallets = useMemo(() => {
    return wallets.filter(wallet => 
      wallet.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      wallet.address.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      wallet.network.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [wallets, debouncedSearchTerm]);

  const handleCopyAddress = useCallback((address) => {
    navigator.clipboard.writeText(address);
    logger.action('copy_wallet_address', { address });
    alert('Dirección copiada al portapapeles');
  }, []);

  const handleAddWallet = useCallback(() => {
    alert('Funcionalidad de agregar wallet. Esto abrirá un modal en producción.');
    logger.action('add_wallet_clicked');
  }, []);

  return (
    <div className="wallets-view">
      <div className="view-header">
        <div className="header-info">
          <h1>Wallets</h1>
          <p>Gestiona tus carteras de criptomonedas</p>
        </div>
        
        <div className="header-actions">
          <button 
            className="toggle-balance-btn"
            onClick={() => setShowBalances(!showBalances)}
          >
            {showBalances ? <EyeOff size={20} /> : <Eye size={20} />}
            {showBalances ? 'Ocultar' : 'Mostrar'} Balances
          </button>
          
          <button 
            className="add-wallet-btn"
            onClick={handleAddWallet}
          >
            <Plus size={20} />
            Nueva Wallet
          </button>
        </div>
      </div>

      <div className="wallets-content">
        <div className="search-container">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar wallets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="wallets-grid">
          {filteredWallets.map(wallet => (
            <div key={wallet.id} className="wallet-card">
              <div className="wallet-header">
                <div className="wallet-icon">
                  <Wallet size={24} />
                </div>
                <div className="wallet-info">
                  <h3 className="wallet-name">{wallet.name}</h3>
                  <p className="wallet-network">{wallet.network}</p>
                </div>
                <div className={`connection-status ${wallet.isConnected ? 'connected' : 'disconnected'}`}>
                  {wallet.isConnected ? 'Conectada' : 'Desconectada'}
                </div>
              </div>

              <div className="wallet-address-section">
                <p className="wallet-address">{wallet.address}</p>
                <button 
                  className="copy-btn"
                  onClick={() => handleCopyAddress(wallet.address)}
                >
                  <Copy size={16} />
                </button>
              </div>

              {showBalances && (
                <div className="wallet-balance">
                  <div className="balance-amount">
                    {wallet.balance} <span className="currency">{wallet.currency}</span>
                  </div>
                  <div className={`balance-change ${parseFloat(wallet.change) >= 0 ? 'positive' : 'negative'}`}>
                    {parseFloat(wallet.change) >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {wallet.change}%
                  </div>
                </div>
              )}

              <div className="wallet-actions">
                <button className="view-btn">
                  <ExternalLink size={16} />
                  Ver en Explorer
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredWallets.length === 0 && (
          <div className="no-wallets">
            <Wallet size={48} className="no-wallets-icon" />
            <h3>No se encontraron wallets</h3>
            <p>Intenta ajustar los filtros de búsqueda</p>
          </div>
        )}
      </div>
    </div>
  );
});

WalletsView.displayName = 'WalletsView';

export { WalletsView };
export default WalletsView;
