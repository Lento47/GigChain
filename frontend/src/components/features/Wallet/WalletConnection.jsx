import React, { useState, useRef, useEffect } from 'react';
import { ConnectButton } from 'thirdweb/react';
import { createWallet } from "thirdweb/wallets";
import { Wallet, AlertCircle, CheckCircle, ExternalLink, Copy, ChevronDown } from 'lucide-react';
import { useWallet } from '../../../hooks/useWallet';
import './Wallet.css';

// Función para truncar direcciones de wallet
const truncateWalletAddress = (address, startChars = 6, endChars = 4) => {
  if (!address || address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

export const WalletConnection = ({ onWalletChange, className = '', showOptionalMessage = false, client }) => {
  const { 
    address, 
    isConnected, 
    isConnecting, 
    isSwitching, 
    isCorrectChain, 
    walletInfo,
    connectWallet,
    disconnect,
    switchToCorrectChain,
    getNetworkInfo
  } = useWallet();
  
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const walletRef = useRef(null);

  // Función para cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (walletRef.current && !walletRef.current.contains(event.target)) {
        setShowDetails(false);
      }
    };

    if (showDetails) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDetails]);

  // Handle wallet connection
  const handleConnect = async () => {
    try {
      await connectWallet();
      if (onWalletChange) {
        onWalletChange({ connected: true, address });
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  // Handle wallet disconnection
  const handleDisconnect = async () => {
    try {
      // Disconnect function now properly handles the active wallet
      if (disconnect && typeof disconnect === 'function') {
        await disconnect();
        console.log('✅ Wallet disconnected successfully');
      } else {
        console.warn('Disconnect function not available');
      }
      
      // Close dropdown after disconnect
      setShowDetails(false);
      
      if (onWalletChange) {
        onWalletChange({ connected: false, address: null });
      }
    } catch (error) {
      console.error('❌ Error disconnecting wallet:', error);
      // Show user-friendly message
      alert('Error al desconectar wallet. Por favor, intenta refrescar la página.');
      // Close dropdown even if error
      setShowDetails(false);
    }
  };

  // Handle chain switch
  const handleSwitchChain = async () => {
    try {
      await switchToCorrectChain();
    } catch (error) {
      console.error('Error switching chain:', error);
    }
  };

  // Copy address to clipboard
  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying address:', error);
    }
  };

  // Open address in explorer
  const openInExplorer = () => {
    const explorerUrl = `https://polygonscan.com/address/${address}`;
    window.open(explorerUrl, '_blank');
  };

  if (!isConnected) {
    return (
      <div className={`wallet-connection ${className}`}>
        {client && (
          <ConnectButton
            client={client}
            theme="dark"
            connectButton={{
              label: "Conectar Wallet",
              style: {
                fontSize: '0.875rem',
                minHeight: '44px',
                borderRadius: 'var(--radius-md)',
                width: '100%'
              }
            }}
            connectModal={{
              title: "Conectar a GigChain",
              size: "compact",
              welcomeScreen: {
                title: "Bienvenido a GigChain.io",
                subtitle: "Conecta tu wallet para comenzar a crear contratos inteligentes"
              }
            }}
            wallets={[
              createWallet("io.metamask"),
              createWallet("com.coinbase.wallet"),
              createWallet("me.rainbow")
            ]}
          />
        )}
        {showOptionalMessage && (
          <div className="wallet-info">
            <p className="wallet-note">
              <AlertCircle size={14} />
              La conexión de wallet es opcional para usar el chat
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`wallet-connected-compact ${className}`} ref={walletRef}>
      <button 
        className={`wallet-button-compact ${isCorrectChain ? 'correct-chain' : 'wrong-chain'}`}
        onClick={() => setShowDetails(!showDetails)}
        title={isCorrectChain ? 'Wallet conectada' : 'Red incorrecta - Click para cambiar'}
      >
        <div className={`chain-indicator ${isCorrectChain ? 'success' : 'warning'}`} />
        <Wallet size={14} />
        <span className="address-compact">{truncateWalletAddress(address, 4, 4)}</span>
        <span className={`dropdown-arrow ${showDetails ? 'open' : ''}`}>▼</span>
      </button>

      {showDetails && (
        <>
          <div className="wallet-dropdown-backdrop" onClick={() => setShowDetails(false)} />
          <div className="wallet-dropdown">
            <div className="dropdown-header">
              <Wallet size={16} />
              <span className={`network-badge ${isCorrectChain ? 'success' : 'warning'}`}>
                {isCorrectChain ? (
                  <><CheckCircle size={12} /> {walletInfo?.network}</>
                ) : (
                  <><AlertCircle size={12} /> Red incorrecta</>
                )}
              </span>
            </div>
            
            <div className="dropdown-content">
              <div className="info-row">
                <span className="info-label">Dirección</span>
                <div className="info-value-with-action">
                  <span className="info-value">{truncateWalletAddress(address, 6, 4)}</span>
                  <button 
                    className="icon-btn"
                    onClick={copyAddress}
                    title="Copiar"
                  >
                    {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="dropdown-actions">
              <button onClick={openInExplorer} className="dropdown-btn secondary">
                <ExternalLink size={14} />
                Explorador
              </button>
              <button onClick={handleDisconnect} className="dropdown-btn danger">
                Desconectar
              </button>
            </div>

            {!isCorrectChain && (
              <div className="chain-warning">
                <AlertCircle size={14} />
                <span>Red incorrecta detectada</span>
                <button onClick={handleSwitchChain} className="switch-chain-btn" disabled={isSwitching}>
                  {isSwitching ? 'Cambiando...' : 'Cambiar red'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default WalletConnection;
