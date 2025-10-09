/**
 * WalletAuthButton Component
 * ===========================
 * 
 * Button component for W-CSAP wallet authentication.
 * Handles the full authentication flow with visual feedback.
 */

import React, { useState } from 'react';
import { useAddress, useDisconnect } from '@thirdweb-dev/react';
import { Shield, Lock, Unlock, LogOut, CheckCircle, AlertCircle } from 'lucide-react';
import { useWalletAuth } from '../../../hooks/useWalletAuth';
import './Wallet.css';

export const WalletAuthButton = ({ onAuthChange, className = '' }) => {
  const address = useAddress();
  const disconnect = useDisconnect();
  const {
    isAuthenticated,
    isAuthenticating,
    authError,
    sessionInfo,
    login,
    logout
  } = useWalletAuth();
  
  const [showDetails, setShowDetails] = useState(false);

  const handleLogin = async () => {
    const success = await login();
    if (success && onAuthChange) {
      onAuthChange({ authenticated: true, address });
    }
  };

  const handleLogout = async () => {
    await logout();
    if (onAuthChange) {
      onAuthChange({ authenticated: false, address: null });
    }
  };

  const handleDisconnectWallet = () => {
    handleLogout();
    disconnect();
  };

  // Not connected to wallet
  if (!address) {
    return (
      <div className={`wallet-auth-button not-connected ${className}`}>
        <div className="auth-message">
          <Lock size={16} />
          <span>Connect wallet to authenticate</span>
        </div>
      </div>
    );
  }

  // Connected but not authenticated
  if (!isAuthenticated) {
    return (
      <div className={`wallet-auth-button not-authenticated ${className}`}>
        <button
          onClick={handleLogin}
          disabled={isAuthenticating}
          className="auth-btn primary"
        >
          {isAuthenticating ? (
            <>
              <div className="spinner"></div>
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <Shield size={16} />
              <span>Sign In with Wallet</span>
            </>
          )}
        </button>
        
        {authError && (
          <div className="auth-error">
            <AlertCircle size={14} />
            <span>{authError}</span>
          </div>
        )}
        
        <div className="auth-info">
          <p className="info-text">
            🔐 Secure authentication using cryptographic wallet signature.
            No password required.
          </p>
        </div>
      </div>
    );
  }

  // Authenticated
  return (
    <div className={`wallet-auth-button authenticated ${className}`}>
      <div className="auth-status" onClick={() => setShowDetails(!showDetails)}>
        <div className="status-indicator">
          <CheckCircle size={16} className="status-icon success" />
          <span className="status-text">Authenticated</span>
        </div>
        
        <div className="wallet-address">
          <Unlock size={14} />
          <span>{address.substring(0, 6)}...{address.slice(-4)}</span>
        </div>
      </div>

      {showDetails && (
        <div className="auth-details">
          <div className="detail-section">
            <h4>Session Information</h4>
            <div className="detail-item">
              <span className="label">Wallet:</span>
              <span className="value">{address.substring(0, 10)}...{address.slice(-8)}</span>
            </div>
            {sessionInfo?.expires_in && (
              <div className="detail-item">
                <span className="label">Expires in:</span>
                <span className="value">{Math.floor(sessionInfo.expires_in / 3600)} hours</span>
              </div>
            )}
            <div className="detail-item">
              <span className="label">Protocol:</span>
              <span className="value badge">W-CSAP</span>
            </div>
          </div>

          <div className="auth-actions">
            <button
              onClick={handleLogout}
              className="action-btn secondary"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
            
            <button
              onClick={handleDisconnectWallet}
              className="action-btn danger"
            >
              <span>Disconnect Wallet</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletAuthButton;
