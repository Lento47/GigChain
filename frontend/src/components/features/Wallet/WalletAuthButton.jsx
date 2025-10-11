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

  // Authenticated - Compact modern design
  return (
    <div className={`wallet-auth-button authenticated-compact ${className}`}>
      <button 
        className="auth-status-compact" 
        onClick={() => setShowDetails(!showDetails)}
        title="Session details"
      >
        <CheckCircle size={14} className="status-icon-success" />
        <span className="address-compact">{address.substring(0, 4)}...{address.slice(-4)}</span>
        <span className={`dropdown-arrow ${showDetails ? 'open' : ''}`}>▼</span>
      </button>

      {showDetails && (
        <>
          <div className="auth-dropdown-backdrop" onClick={() => setShowDetails(false)} />
          <div className="auth-dropdown">
            <div className="dropdown-header">
              <Shield size={16} />
              <span className="protocol-badge">W-CSAP</span>
            </div>
            
            <div className="dropdown-content">
              <div className="info-row">
                <span className="info-label">Wallet</span>
                <span className="info-value">{address.substring(0, 8)}...{address.slice(-6)}</span>
              </div>
              {sessionInfo?.expires_in && (
                <div className="info-row">
                  <span className="info-label">Session</span>
                  <span className="info-value">{Math.floor(sessionInfo.expires_in / 3600)}h remaining</span>
                </div>
              )}
            </div>

            <div className="dropdown-actions">
              <button onClick={handleLogout} className="dropdown-btn secondary">
                <LogOut size={14} />
                Sign Out
              </button>
              <button onClick={handleDisconnectWallet} className="dropdown-btn danger">
                Disconnect
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WalletAuthButton;
