import React, { useState, useRef, useEffect } from 'react';
import { ConnectWallet, useAddress, useDisconnect } from '@thirdweb-dev/react';
import { Wallet, AlertCircle, CheckCircle, ExternalLink, Copy, ChevronDown } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import './WalletConnection.css';

// Función para truncar direcciones de wallet
const truncateWalletAddress = (address, startChars = 6, endChars = 4) => {
  if (!address || address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

export const WalletConnection = ({ onWalletChange, className = '' }) => {
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
  const handleDisconnect = () => {
    disconnect();
    if (onWalletChange) {
      onWalletChange({ connected: false, address: null });
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
        <ConnectWallet 
          theme="dark"
          modalTitle="Conectar a GigChain"
          modalTitleIconUrl=""
          auth={{
            loginOptional: true
          }}
          switchToActiveChain={true}
          showThirdwebBranding={false}
          welcomeScreen={{
            title: "Bienvenido a GigChain.io",
            subtitle: "Conecta tu wallet para comenzar a crear contratos inteligentes"
          }}
          termsOfServiceUrl=""
          privacyPolicyUrl=""
          onConnect={handleConnect}
        />
        <div className="wallet-info">
          <p className="wallet-note">
            <AlertCircle size={14} />
            La conexión de wallet es opcional para usar el chat
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`wallet-connected ${className}`} ref={walletRef}>
      <div className="wallet-status">
        <div className="wallet-indicator">
          <div className={`status-dot ${isCorrectChain ? 'connected' : 'warning'}`}></div>
          <span className="status-text">
            {isCorrectChain ? 'Conectado' : 'Red incorrecta'}
          </span>
        </div>
        
        <div className="wallet-address" onClick={() => setShowDetails(!showDetails)}>
          <Wallet size={16} />
          <span>{walletInfo?.shortAddress}</span>
          <ChevronDown size={14} className={`chevron ${showDetails ? 'open' : ''}`} />
        </div>
      </div>

      {showDetails && (
        <div className="wallet-details">
          <div className="wallet-info-section">
            <div className="info-item">
              <span className="label">Dirección:</span>
              <div className="address-container">
                <span className="address">{truncateWalletAddress(address)}</span>
                <button 
                  className="copy-btn"
                  onClick={copyAddress}
                  title="Copiar dirección"
                >
                  <Copy size={14} />
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>
            
            <div className="info-item">
              <span className="label">Red:</span>
              <div className="network-info">
                <span className={`network-status ${isCorrectChain ? 'correct' : 'incorrect'}`}>
                  {isCorrectChain ? (
                    <>
                      <CheckCircle size={14} />
                      {walletInfo?.network}
                    </>
                  ) : (
                    <>
                      <AlertCircle size={14} />
                      Red incorrecta
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="wallet-actions">
            <button 
              className="action-btn secondary"
              onClick={openInExplorer}
              title="Ver en explorador"
            >
              <ExternalLink size={14} />
              Explorador
            </button>
            <button 
              className="action-btn danger"
              onClick={handleDisconnect}
            >
              Desconectar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnection;
