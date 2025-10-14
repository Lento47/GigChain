import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Wallet, Plus, Copy, ExternalLink, TrendingUp, TrendingDown, Eye, EyeOff, Search, Loader, AlertCircle } from 'lucide-react';
import useDebounce from '../../hooks/useDebounce';
import { logger } from '../../utils/logger';
import { useToast } from '../../components/common/Toast';
import { useWalletAuth } from '../../hooks/useWalletAuth';
import { createWallet, getMyWallet } from '../../services/walletService';
import './Wallets.css';

const WalletsView = React.memo(() => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showBalances, setShowBalances] = useState(true);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [hasWallet, setHasWallet] = useState(false);
  const [authError, setAuthError] = useState(false);
  
  const toast = useToast();
  const { isAuthenticated } = useWalletAuth();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Debug: Log authentication state
  useEffect(() => {
    console.log('🔍 [WalletsView] isAuthenticated:', isAuthenticated);
  }, [isAuthenticated]);

  // Load wallet on mount and when authentication changes
  useEffect(() => {
    console.log('🔄 [WalletsView] Auth changed, isAuthenticated:', isAuthenticated);
    if (isAuthenticated) {
      console.log('✅ [WalletsView] User authenticated, loading wallet...');
      loadWallet();
    } else {
      console.log('❌ [WalletsView] User not authenticated');
      setAuthError(true);
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadWallet = async () => {
    try {
      setLoading(true);
      setAuthError(false);
      const response = await getMyWallet();
      
      if (response.success && response.has_wallet) {
        setWallet(response.wallet);
        setHasWallet(true);
        setAuthError(false);
        logger.info('Wallet loaded successfully');
      } else {
        setHasWallet(false);
        setWallet(null);
        setAuthError(false);
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
      const errorMessage = error?.message || 'Error al cargar la wallet';
      
      // Check if it's an authentication error
      if (errorMessage.includes('autenticado') || errorMessage.includes('authentication')) {
        setAuthError(true);
      } else {
        toast.showError(errorMessage);
      }
      
      setHasWallet(false);
      setWallet(null);
    } finally {
      setLoading(false);
    }
  };

  // Convert wallet to display format
  const wallets = useMemo(() => {
    if (!wallet) return [];
    
    return [{
      id: wallet.wallet_id,
      name: wallet.name,
      address: wallet.wallet_address,
      balance: wallet.balance.toFixed(2),
      currency: wallet.currency,
      network: 'GigChain Internal',
      isConnected: wallet.is_active,
      created_at: wallet.created_at,
      updated_at: wallet.updated_at
    }];
  }, [wallet]);

  const filteredWallets = useMemo(() => {
    return wallets.filter(w => 
      w.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      w.address.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      w.network.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [wallets, debouncedSearchTerm]);

  const handleCopyAddress = useCallback(async (address) => {
    try {
      await navigator.clipboard.writeText(address);
      logger.action('copy_wallet_address', { address });
      toast.showSuccess('✅ Dirección copiada al portapapeles');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.showError('Error al copiar la dirección');
    }
  }, [toast]);

  const handleAddWallet = useCallback(async () => {
    if (hasWallet) {
      toast.showWarning('Ya tienes una wallet de GigChain. Actualiza a Premium para tener más wallets.');
      return;
    }

    try {
      setCreating(true);
      logger.action('add_wallet_clicked');
      
      const response = await createWallet('Mi Wallet GigChain');
      
      if (response.success && response.wallet) {
        setWallet(response.wallet);
        setHasWallet(true);
        toast.showSuccess('✅ Wallet creada exitosamente');
        logger.info('Wallet created successfully', response.wallet);
      } else {
        // Handle error response
        const errorMsg = response.error || 'Error al crear la wallet';
        toast.showError(errorMsg);
      }
    } catch (error) {
      console.error('Error creating wallet:', error);
      // Extract error message properly
      let errorMessage = 'Error al crear la wallet';
      
      if (error && typeof error === 'object') {
        if (error.message) {
          errorMessage = error.message;
        } else if (error.error) {
          errorMessage = error.error;
        } else if (error.detail) {
          errorMessage = error.detail;
        } else {
          errorMessage = 'Error de conexión. Verifica tu autenticación.';
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast.showError(errorMessage);
    } finally {
      setCreating(false);
    }
  }, [hasWallet, toast]);

  // Loading state
  if (loading) {
    return (
      <div className="wallets-view">
        <div className="wallets-content">
          <div className="loading-state">
            <Loader size={48} className="spinner" />
            <p>Cargando wallet...</p>
          </div>
        </div>
      </div>
    );
  }

  // Authentication error state
  if (authError) {
    return (
      <div className="wallets-view">
        <div className="wallets-content">
          <div className="auth-error-state">
            <AlertCircle size={64} className="auth-error-icon" />
            <h3>Autenticación Requerida</h3>
            <p>Debes autenticarte con tu wallet de blockchain usando W-CSAP para acceder a las wallets internas de GigChain.</p>
            <div className="auth-steps">
              <div className="auth-step">
                <span className="step-number">1</span>
                <span className="step-text">Conecta tu wallet de MetaMask (botón "Conectado" arriba)</span>
              </div>
              <div className="auth-step">
                <span className="step-number">2</span>
                <span className="step-text">Haz clic en "Sign In with Wallet" y firma el mensaje</span>
              </div>
            </div>
            <div className="auth-error-actions">
              <button 
                className="connect-wallet-btn"
                onClick={() => {
                  // Scroll to top where the wallet connection button is
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  toast.showInfo('Usa el botón "Sign In with Wallet" en la parte superior');
                }}
              >
                Ir a Autenticación
              </button>
              <button 
                className="retry-btn"
                onClick={loadWallet}
              >
                <Loader size={18} />
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wallets-view">
      {/* Action Bar */}
      <div className="action-bar">
        <div className="wallets-filters">
          {hasWallet && (
            <div className="search-container">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Buscar wallets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          )}
        </div>
        
        <div className="action-buttons">
          {hasWallet && (
            <button 
              className="action-btn secondary"
              onClick={() => setShowBalances(!showBalances)}
            >
              {showBalances ? <EyeOff size={18} /> : <Eye size={18} />}
              <span>{showBalances ? 'Ocultar' : 'Mostrar'}</span>
            </button>
          )}
          
          <button 
            className="action-btn primary"
            onClick={handleAddWallet}
            disabled={creating || hasWallet}
          >
            {creating ? (
              <>
                <Loader size={18} className="spinner" />
                <span>Creando...</span>
              </>
            ) : (
              <>
                <Plus size={18} />
                <span>{hasWallet ? 'Límite' : 'Crear'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="wallets-content">

        {hasWallet && filteredWallets.length > 0 ? (
          <div className="wallets-grid">
            {filteredWallets.map(w => (
              <div key={w.id} className={`wallet-card ${w.isConnected ? 'active' : 'inactive'}`}>
                <div className="wallet-header">
                  <div className="wallet-info">
                    <div className="wallet-icon">
                      <Wallet size={26} />
                    </div>
                    <div className="wallet-details">
                      <h3 className="wallet-name">{w.name}</h3>
                      <div className="wallet-address">
                        <span className="address-text">
                          {w.address.slice(0, 10)}...{w.address.slice(-8)}
                        </span>
                        <button 
                          className="copy-btn"
                          onClick={() => handleCopyAddress(w.address)}
                          title="Copiar dirección completa"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="wallet-status">
                    <span className={`status-indicator ${w.isConnected ? 'active' : 'inactive'}`}>
                      {w.isConnected ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>

                {showBalances && (
                  <div className="wallet-balance">
                    <div className="balance-main">
                      <span className="balance-amount">{w.balance}</span>
                      <span className="balance-currency">{w.currency}</span>
                    </div>
                    <div className="balance-network">Red: {w.network}</div>
                  </div>
                )}

                <div className="wallet-stats">
                  <div className="stat-item">
                    <span className="stat-label">Red</span>
                    <span className="stat-value network">{w.network}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Creada</span>
                    <span className="stat-value">
                      {new Date(w.created_at).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>

                <div className="wallet-actions">
                  <button 
                    className="copy-full-btn"
                    onClick={() => handleCopyAddress(w.address)}
                  >
                    <Copy size={16} />
                    <span>Copiar Dirección Completa</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-wallets">
            <Wallet size={64} className="no-wallets-icon" />
            <h3>{hasWallet ? 'No se encontraron wallets' : 'No tienes una wallet aún'}</h3>
            <p>
              {hasWallet 
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Crea tu primera wallet interna de GigChain haciendo clic en el botón "Crear Wallet"'
              }
            </p>
            {!hasWallet && (
              <button 
                className="create-wallet-cta"
                onClick={handleAddWallet}
                disabled={creating}
              >
                {creating ? (
                  <>
                    <Loader size={18} className="spinner" />
                    <span>Creando wallet...</span>
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    <span>Crear Mi Primera Wallet</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

WalletsView.displayName = 'WalletsView';

export { WalletsView };
export default WalletsView;
