import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet';
import { useWalletAuth } from '../../hooks/useWalletAuth';
import { LoadingSpinner } from '../ui/Loading';

/**
 * ProtectedRoute Component
 * 
 * ENHANCED: Now supports both W-CSAP authentication and wallet connection.
 * Priority order:
 * 1. W-CSAP authentication (session tokens) - HIGHEST PRIORITY
 * 2. ThirdWeb wallet connection - FALLBACK
 * 
 * Redirects to home page only if:
 * - No W-CSAP session AND no wallet connected
 * - Wrong chain (when required)
 */
const ProtectedRoute = ({ children, requireCorrectChain = true }) => {
  const location = useLocation();
  
  // W-CSAP Authentication (priority)
  const { 
    isAuthenticated: isWCSAPAuthenticated, 
    isAuthenticating,
    sessionInfo,
    getSessionToken
  } = useWalletAuth();
  
  // ThirdWeb Wallet Connection (fallback)
  const { 
    address, 
    isConnected, 
    isInitializing,
    isCorrectChain, 
    isSwitching,
    walletInfo,
    targetChain
  } = useWallet();

  // Check if user has valid W-CSAP session
  const hasValidWCSAPSession = () => {
    const token = getSessionToken();
    return isWCSAPAuthenticated && token && sessionInfo;
  };

  // Determine overall authentication status
  const isAuthenticated = hasValidWCSAPSession() || (isConnected && address);
  
  console.log('🔐 ProtectedRoute Auth Check:', {
    wcsapAuthenticated: isWCSAPAuthenticated,
    hasSessionToken: !!getSessionToken(),
    walletConnected: isConnected,
    address: address?.slice(0, 10) + '...',
    finalAuthStatus: isAuthenticated
  });

  // Show loading spinner while authenticating
  if (isAuthenticating || isInitializing) {
    return (
      <div className="protected-route-loading">
        <LoadingSpinner 
          size="lg" 
          message={isAuthenticating ? "Authenticating..." : "Initializing..."} 
          className="auth-loading-spinner"
        />
      </div>
    );
  }

  // Show loading spinner during wallet operations
  if (isSwitching) {
    return (
      <div className="protected-route-loading">
        <LoadingSpinner 
          size="lg" 
          message="Switching network..." 
          className="wallet-switching-spinner"
        />
      </div>
    );
  }

  // ENHANCED: Only redirect if NEITHER W-CSAP nor wallet is authenticated
  if (!isAuthenticated) {
    console.log('🔒 Access denied: No valid authentication (W-CSAP or wallet). Redirecting to home.');
    return (
      <Navigate 
        to="/home" 
        state={{ 
          from: location.pathname,
          reason: 'not_authenticated',
          message: 'Please connect your wallet or sign in to access this page'
        }} 
        replace 
      />
    );
  }

  // ENHANCED: Only check chain if using wallet connection (not W-CSAP)
  if (requireCorrectChain && !hasValidWCSAPSession() && isConnected && !isCorrectChain) {
    console.log(`🔒 Access denied: Wrong network for wallet connection. Expected ${targetChain?.name}, got chainId: ${walletInfo?.chainId}`);
    return (
      <Navigate 
        to="/home" 
        state={{ 
          from: location.pathname,
          reason: 'wrong_network',
          message: `Please switch to ${targetChain?.name} to access this page`,
          targetChain: targetChain?.name
        }} 
        replace 
      />
    );
  }

  // Additional validation for wallet address format (only if using wallet connection)
  if (!hasValidWCSAPSession() && address && !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    console.log('🔒 Access denied: Invalid wallet address format.');
    return (
      <Navigate 
        to="/home" 
        state={{ 
          from: location.pathname,
          reason: 'invalid_wallet',
          message: 'Invalid wallet address detected. Please reconnect your wallet.'
        }} 
        replace 
      />
    );
  }

  // Log successful access with authentication method
  const authMethod = hasValidWCSAPSession() ? 'W-CSAP' : 'Wallet';
  const identifier = hasValidWCSAPSession() 
    ? sessionInfo?.wallet_address?.slice(0, 10) + '...' 
    : address?.slice(0, 6) + '...' + address?.slice(-4);
  
  console.log(`✅ Access granted to ${location.pathname} via ${authMethod}: ${identifier}`);

  // Render protected content
  return children;
};

/**
 * Authentication Status Component
 * Shows authentication requirements when user is not properly authenticated
 */
export const AuthenticationRequired = ({ reason, message, targetChain, onRetry }) => {
  const getIcon = () => {
    switch (reason) {
      case 'wallet_not_connected':
        return '🔌';
      case 'wrong_network':
        return '🌐';
      case 'invalid_wallet':
        return '⚠️';
      default:
        return '🔒';
    }
  };

  const getTitle = () => {
    switch (reason) {
      case 'wallet_not_connected':
        return 'Wallet Connection Required';
      case 'wrong_network':
        return 'Network Switch Required';
      case 'invalid_wallet':
        return 'Invalid Wallet Detected';
      default:
        return 'Authentication Required';
    }
  };

  const getActionText = () => {
    switch (reason) {
      case 'wallet_not_connected':
        return 'Connect Wallet';
      case 'wrong_network':
        return `Switch to ${targetChain}`;
      case 'invalid_wallet':
        return 'Reconnect Wallet';
      default:
        return 'Authenticate';
    }
  };

  return (
    <div className="authentication-required">
      <div className="auth-required-content">
        <div className="auth-required-icon">{getIcon()}</div>
        <h2 className="auth-required-title">{getTitle()}</h2>
        <p className="auth-required-message">{message}</p>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="btn btn-primary auth-required-button"
          >
            {getActionText()}
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Route Protection Hook
 * ENHANCED: Returns authentication status combining W-CSAP and wallet connection
 */
export const useRouteProtection = () => {
  const { address, isConnected, isCorrectChain, targetChain } = useWallet();
  const { isAuthenticated: isWCSAPAuthenticated, sessionInfo, getSessionToken } = useWalletAuth();

  // Check if user has valid W-CSAP session
  const hasValidWCSAPSession = () => {
    const token = getSessionToken();
    return isWCSAPAuthenticated && token && sessionInfo;
  };

  // Combined authentication status (W-CSAP OR wallet)
  const isAuthenticated = hasValidWCSAPSession() || (isConnected && !!address && /^0x[a-fA-F0-9]{40}$/.test(address));
  const isFullyAuthenticated = hasValidWCSAPSession() || (isAuthenticated && isCorrectChain);

  const getAuthenticationStatus = () => {
    // Check W-CSAP authentication first (priority)
    if (hasValidWCSAPSession()) {
      return {
        authenticated: true,
        reason: null,
        message: 'Successfully authenticated with W-CSAP session',
        canAccess: true,
        authMethod: 'W-CSAP'
      };
    }

    // Fallback to wallet connection checks
    if (!isConnected || !address) {
      return {
        authenticated: false,
        reason: 'not_authenticated',
        message: 'Please connect your wallet or sign in to access the platform',
        canAccess: false
      };
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return {
        authenticated: false,
        reason: 'invalid_wallet',
        message: 'Invalid wallet address detected. Please reconnect your wallet.',
        canAccess: false
      };
    }

    if (!isCorrectChain) {
      return {
        authenticated: true,
        reason: 'wrong_network',
        message: `Please switch to ${targetChain?.name} to access all features`,
        canAccess: false,
        targetChain: targetChain?.name
      };
    }

    return {
      authenticated: true,
      reason: null,
      message: 'Successfully authenticated with wallet connection',
      canAccess: true,
      authMethod: 'Wallet'
    };
  };

  return {
    isAuthenticated,
    isFullyAuthenticated,
    hasValidWCSAPSession: hasValidWCSAPSession(),
    authStatus: getAuthenticationStatus(),
    address,
    sessionInfo,
    targetChain
  };
};

export default ProtectedRoute;
