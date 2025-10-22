import React from 'react';
import { useWallet } from '../../hooks/useWallet';
import { useWalletAuth } from '../../hooks/useWalletAuth';
import { Wallet, AlertCircle, CheckCircle } from 'lucide-react';
import './WalletBanner.css';

const WalletBanner = () => {
  const { address, chainId, isCorrectChain, isConnected } = useWallet();
  const { sessionData, isAuthenticated } = useWalletAuth();

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isAuthenticated && !sessionData?.wallet_address) {
    return (
      <div className="wallet-banner disconnected">
        <div className="banner-icon">
          <Wallet size={24} />
        </div>
        <div className="banner-content">
          <h4>🚀 Connect Your Wallet</h4>
          <p>Please connect your wallet to access GigChain Marketplace</p>
        </div>
        <div className="pulse-dot"></div>
      </div>
    );
  }

  if (!isCorrectChain) {
    return (
      <div className="wallet-banner wrong-network">
        <div className="banner-icon">
          <AlertCircle size={24} />
        </div>
        <div className="banner-content">
          <h4>⚠️ Wrong Network</h4>
          <p>Please switch to <span className="network-name">Polygon Amoy</span> (chainId: 80002)</p>
        </div>
        <button className="switch-network-btn">Switch Network</button>
      </div>
    );
  }

  return (
    <div className="wallet-banner connected">
      <div className="banner-icon success">
        <CheckCircle size={24} />
      </div>
      <div className="banner-content">
        <div className="wallet-address-display">
          <span className="address-label">Connected:</span>
          <span className="address-value">{truncateAddress(sessionData?.wallet_address || address)}</span>
        </div>
        <div className="network-info">
          <span className="network-badge">
            <span className="status-dot"></span>
            Polygon Amoy
          </span>
        </div>
      </div>
    </div>
  );
};

export default WalletBanner;

