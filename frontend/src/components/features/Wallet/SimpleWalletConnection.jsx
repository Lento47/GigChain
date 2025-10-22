import React, { useState, useEffect } from 'react';
import { ConnectButton } from 'thirdweb/react';
import { createWallet } from "thirdweb/wallets";
import { Wallet, Shield, Globe, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { useWallet } from '../../../hooks/useWallet';
import './EnhancedWalletConnection.css';

const SimpleWalletConnection = ({ 
  onSuccess,
  showGuide = true,
  compact = false,
  redirectReason = null,
  client // We'll need to pass the client from the parent
}) => {
  const { 
    address, 
    isConnected, 
    isCorrectChain, 
    switchToCorrectChain, 
    isSwitching, 
    targetChain,
    walletInfo,
    disconnect 
  } = useWallet();
  
  const [showNetworkSwitch, setShowNetworkSwitch] = useState(false);
  const [connectionStep, setConnectionStep] = useState('idle');

  // Monitor authentication state changes
  useEffect(() => {
    if (isConnected && isCorrectChain && onSuccess) {
      console.log('✅ Wallet fully authenticated, calling onSuccess callback');
      onSuccess({ address, walletInfo, chainId: targetChain.id });
    }
  }, [isConnected, isCorrectChain, address, onSuccess, walletInfo, targetChain.id]);

  // Monitor connection steps
  useEffect(() => {
    if (!isConnected) {
      setConnectionStep('connect');
    } else if (!isCorrectChain) {
      setConnectionStep('network');
      setShowNetworkSwitch(true);
    } else {
      setConnectionStep('complete');
    }
  }, [isConnected, isCorrectChain]);

  const handleNetworkSwitch = async () => {
    try {
      await switchToCorrectChain();
      setShowNetworkSwitch(false);
    } catch (error) {
      console.error('Error switching network:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      if (disconnect) {
        await disconnect();
      }
      setConnectionStep('connect');
      setShowNetworkSwitch(false);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  if (compact) {
    return (
      <div className="enhanced-wallet-connection compact">
        {redirectReason && (
          <div className="redirect-notice">
            <AlertTriangle size={16} />
            <span>Authentication required to continue</span>
          </div>
        )}
        
        <div className="wallet-connection-compact">
          {!isConnected ? (
            <div className="connect-section">
              <h3>Connect Your Wallet</h3>
              <p>Secure access to GigChain platform</p>
              <div className="simple-wallet-buttons">
                {client && (
                  <ConnectButton
                    client={client}
                    theme="dark"
                    connectButton={{
                      label: "Connect Wallet",
                      style: {
                        fontSize: '0.875rem',
                        minHeight: '44px',
                        borderRadius: 'var(--radius-md)',
                        width: '100%'
                      }
                    }}
                    connectModal={{
                      title: "Choose Your Wallet",
                      size: "compact"
                    }}
                    wallets={[
                      createWallet("io.metamask"),
                      createWallet("com.coinbase.wallet"),
                      createWallet("me.rainbow")
                    ]}
                  />
                )}
              </div>
            </div>
          ) : !isCorrectChain ? (
            <div className="network-section">
              <h3>Switch Network</h3>
              <p>Switch to {targetChain?.name} to continue</p>
              <button
                onClick={handleNetworkSwitch}
                disabled={isSwitching}
                className="btn btn-primary switch-network-btn"
              >
                <Globe size={16} />
                {isSwitching ? 'Switching...' : `Switch to ${targetChain?.name}`}
              </button>
            </div>
          ) : (
            <div className="connected-section">
              <h3>Wallet Connected</h3>
              <div className="wallet-info">
                <CheckCircle size={16} className="success-icon" />
                <span className="wallet-address">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                <span className="network-name">{targetChain?.name}</span>
              </div>
              <button
                onClick={handleDisconnect}
                className="btn btn-outline btn-sm disconnect-btn"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="enhanced-wallet-connection">
      <div className="wallet-connection-header">
        <div className="connection-status">
          <Wallet className="wallet-icon" size={24} />
          <div className="status-info">
            <h2>Wallet Connection</h2>
            <p className="status-description">
              {connectionStep === 'connect' && 'Connect your wallet to get started'}
              {connectionStep === 'network' && 'Switch to the correct network'}
              {connectionStep === 'complete' && 'Ready to use GigChain'}
            </p>
          </div>
          <div className={`connection-indicator ${connectionStep}`}>
            {connectionStep === 'complete' ? (
              <CheckCircle size={20} />
            ) : (
              <div className="indicator-dot" />
            )}
          </div>
        </div>
      </div>

      {/* Connection Step Content */}
      <div className="connection-content">
        {connectionStep === 'connect' && (
          <div className="connect-wallet-section">
            <div className="connect-info">
              <h3>Choose Your Wallet</h3>
              <p>Connect with any Web3 wallet to access GigChain</p>
              
              <div className="wallet-benefits">
                <div className="benefit-item">
                  <Shield size={16} />
                  <span>Secure blockchain authentication</span>
                </div>
                <div className="benefit-item">
                  <CheckCircle size={16} />
                  <span>No passwords required</span>
                </div>
                <div className="benefit-item">
                  <Wallet size={16} />
                  <span>You control your funds</span>
                </div>
              </div>
            </div>
            
            <div className="connect-action">
              <div className="wallet-connect-wrapper" style={{ width: '100%' }}>
                {client && (
                  <ConnectButton
                    client={client}
                    theme="dark"
                    connectButton={{
                      label: "Connect Your Wallet",
                      style: {
                        fontSize: '1rem',
                        minHeight: '48px',
                        borderRadius: 'var(--radius-lg)',
                        padding: '12px 24px',
                        width: '100%'
                      }
                    }}
                    connectModal={{
                      title: "Connect Your Wallet to GigChain",
                      size: "wide"
                    }}
                    wallets={[
                      createWallet("io.metamask"),
                      createWallet("com.coinbase.wallet"),
                      createWallet("me.rainbow")
                    ]}
                  />
                )}
              </div>
              
              <p className="connect-note">
                Don't have a wallet? 
                <a 
                  href="https://metamask.io/download/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="link-primary"
                >
                  Get MetaMask
                  <ExternalLink size={14} />
                </a>
              </p>
            </div>
          </div>
        )}

        {connectionStep === 'network' && showNetworkSwitch && (
          <div className="network-switch-section">
            <div className="network-info">
              <h3>Network Switch Required</h3>
              <p>GigChain operates on {targetChain?.name} for optimal performance and low fees.</p>
              
              <div className="network-benefits">
                <div className="benefit-item">
                  <span className="benefit-icon">⚡</span>
                  <span>Ultra-low fees (under $0.01)</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">🚀</span>
                  <span>Fast transactions (2-3 seconds)</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">🌱</span>
                  <span>Eco-friendly (Proof of Stake)</span>
                </div>
              </div>
            </div>
            
            <div className="network-action">
              <button
                onClick={handleNetworkSwitch}
                disabled={isSwitching}
                className="btn btn-primary network-switch-btn"
              >
                <Globe size={20} />
                {isSwitching ? 'Switching Network...' : `Switch to ${targetChain?.name}`}
              </button>
              
              <p className="network-note">
                This will open a prompt in your wallet to approve the network switch.
              </p>
            </div>
          </div>
        )}

        {connectionStep === 'complete' && (
          <div className="connection-complete-section">
            <div className="success-indicator">
              <CheckCircle size={48} className="success-icon-large" />
              <h3>Wallet Connected Successfully!</h3>
              <p>You're now ready to use all GigChain features.</p>
            </div>
            
            <div className="wallet-details">
              <div className="detail-item">
                <Wallet size={16} />
                <span>Address: {address?.slice(0, 10)}...{address?.slice(-6)}</span>
              </div>
              <div className="detail-item">
                <Globe size={16} />
                <span>Network: {targetChain?.name}</span>
              </div>
            </div>
            
            <div className="connection-actions">
              <button
                onClick={() => onSuccess && onSuccess({ address, walletInfo, chainId: targetChain.id })}
                className="btn btn-primary enter-platform-btn"
              >
                <Shield size={16} />
                Enter Platform
              </button>
              
              <button
                onClick={handleDisconnect}
                className="btn btn-outline disconnect-btn"
              >
                Disconnect Wallet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleWalletConnection;
