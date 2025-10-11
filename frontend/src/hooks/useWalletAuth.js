/**
 * useWalletAuth Hook
 * ==================
 * 
 * React hook for W-CSAP (Wallet-Based Cryptographic Session Assertion Protocol)
 * authentication. Provides wallet-based login, logout, and session management.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAddress, useSigner } from '@thirdweb-dev/react';
import { API_ENDPOINTS } from '../constants/api';

const AUTH_STORAGE_KEY = 'w_csap_session';
const REFRESH_STORAGE_KEY = 'w_csap_refresh';

export const useWalletAuth = () => {
  const address = useAddress();
  const signer = useSigner();
  
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Initialize with optimistic auth if token exists
    return !!localStorage.getItem(AUTH_STORAGE_KEY);
  });
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);

  /**
   * Clear local session data
   */
  const clearSession = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(REFRESH_STORAGE_KEY);
    setIsAuthenticated(false);
    setSessionInfo(null);
  }, []);

  /**
   * Try to refresh session with refresh token
   */
  const tryRefreshSession = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_STORAGE_KEY);
    const oldSessionToken = localStorage.getItem(AUTH_STORAGE_KEY);
    
    if (!refreshToken || !oldSessionToken) {
      clearSession();
      return false;
    }
    
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
          session_token: oldSessionToken
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Store new tokens
        localStorage.setItem(AUTH_STORAGE_KEY, data.session_token);
        localStorage.setItem(REFRESH_STORAGE_KEY, data.refresh_token);
        setIsAuthenticated(true);
        
        console.log('✅ Session refreshed successfully');
        return true;
      } else {
        clearSession();
        return false;
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      clearSession();
      return false;
    }
  }, [clearSession]);

  /**
   * Load and verify session from localStorage on mount
   */
  useEffect(() => {
    const verifySession = async () => {
      const sessionToken = localStorage.getItem(AUTH_STORAGE_KEY);
      
      if (sessionToken) {
        try {
          // Verify session with backend
          const response = await fetch(`${API_ENDPOINTS.BASE}/api/auth/status`, {
            headers: {
              'Authorization': `Bearer ${sessionToken}`
            }
          });
          
          const data = await response.json();
          
          if (data.authenticated) {
            setSessionInfo(data.session_info);
            console.log('✅ Session restored successfully');
          } else {
            // Session invalid, try to refresh
            console.log('⚠️ Session invalid, attempting refresh...');
            const refreshed = await tryRefreshSession();
            if (!refreshed) {
              console.log('❌ Refresh failed, session cleared');
            }
          }
        } catch (error) {
          console.error('Session verification error:', error);
          // Keep optimistic auth, backend might be down
          console.log('⚠️ Backend unavailable, using cached session');
        }
      }
    };
    
    verifySession();
  }, [tryRefreshSession]);

  /**
   * Step 1: Request authentication challenge from server
   */
  const requestChallenge = useCallback(async (walletAddress) => {
    const response = await fetch(`${API_ENDPOINTS.BASE}/api/auth/challenge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        wallet_address: walletAddress
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to request challenge');
    }
    
    return await response.json();
  }, []);

  /**
   * Step 2: Sign challenge message with wallet
   */
  const signChallenge = useCallback(async (challengeMessage) => {
    if (!signer) {
      throw new Error('Wallet signer not available');
    }
    
    try {
      // Sign the message with wallet
      const signature = await signer.signMessage(challengeMessage);
      return signature;
    } catch (error) {
      console.error('Signature error:', error);
      throw new Error('Failed to sign message. User may have rejected the signature request.');
    }
  }, [signer]);

  /**
   * Step 3: Verify signature and create session
   */
  const verifyAndCreateSession = useCallback(async (challengeId, signature, walletAddress) => {
    const response = await fetch(`${API_ENDPOINTS.BASE}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        challenge_id: challengeId,
        signature: signature,
        wallet_address: walletAddress
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Authentication failed');
    }
    
    return data;
  }, []);

  /**
   * Main login function - Orchestrates the full authentication flow
   */
  const login = useCallback(async () => {
    if (!address) {
      setAuthError('Please connect your wallet first');
      return false;
    }
    
    if (!signer) {
      setAuthError('Wallet signer not available');
      return false;
    }
    
    setIsAuthenticating(true);
    setAuthError(null);
    
    try {
      console.log('🔐 Starting W-CSAP authentication...');
      
      // Step 1: Request challenge
      console.log('📝 Step 1: Requesting challenge...');
      const challengeData = await requestChallenge(address);
      console.log('✅ Challenge received:', challengeData.challenge_id.substring(0, 16) + '...');
      
      // Step 2: Sign challenge
      console.log('✍️ Step 2: Signing challenge...');
      const signature = await signChallenge(challengeData.challenge_message);
      console.log('✅ Message signed successfully');
      
      // Step 3: Verify and create session
      console.log('🔍 Step 3: Verifying signature...');
      const sessionData = await verifyAndCreateSession(
        challengeData.challenge_id,
        signature,
        address
      );
      console.log('✅ Authentication successful!');
      
      // Store session tokens
      localStorage.setItem(AUTH_STORAGE_KEY, sessionData.session_token);
      localStorage.setItem(REFRESH_STORAGE_KEY, sessionData.refresh_token);
      
      // Update state
      setIsAuthenticated(true);
      setSessionInfo({
        wallet_address: sessionData.wallet_address,
        expires_at: sessionData.expires_at,
        expires_in: sessionData.expires_in
      });
      
      console.log('🎉 Logged in successfully!');
      return true;
      
    } catch (error) {
      console.error('❌ Authentication error:', error);
      setAuthError(error.message || 'Authentication failed');
      clearSession();
      return false;
      
    } finally {
      setIsAuthenticating(false);
    }
  }, [address, signer, requestChallenge, signChallenge, verifyAndCreateSession, clearSession]);

  /**
   * Logout function - Invalidates session on server and clears local storage
   */
  const logout = useCallback(async () => {
    const sessionToken = localStorage.getItem(AUTH_STORAGE_KEY);
    
    if (sessionToken) {
      try {
        // Notify server to invalidate session
        await fetch(`${API_ENDPOINTS.BASE}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionToken}`
          }
        });
        
        console.log('👋 Logged out successfully');
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    // Clear local storage
    clearSession();
  }, [clearSession]);

  /**
   * Get current session token for API requests
   */
  const getSessionToken = useCallback(() => {
    return localStorage.getItem(AUTH_STORAGE_KEY);
  }, []);

  /**
   * Make authenticated API request
   */
  const authenticatedFetch = useCallback(async (url, options = {}) => {
    const sessionToken = getSessionToken();
    
    if (!sessionToken) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${sessionToken}`
      }
    });
    
    // Handle 401 Unauthorized - try to refresh session
    if (response.status === 401) {
      const refreshed = await tryRefreshSession();
      
      if (refreshed) {
        // Retry request with new token
        const newToken = getSessionToken();
        return await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`
          }
        });
      } else {
        throw new Error('Session expired. Please login again.');
      }
    }
    
    return response;
  }, [getSessionToken, tryRefreshSession]);

  return {
    // State
    isAuthenticated,
    isAuthenticating,
    authError,
    sessionInfo,
    
    // Actions
    login,
    logout,
    getSessionToken,
    authenticatedFetch,
    
    // Utils
    clearSession,
    tryRefreshSession
  };
};

export default useWalletAuth;
