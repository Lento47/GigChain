/**
 * useWalletAuth Hook
 * ==================
 * 
 * React hook for W-CSAP (Wallet-Based Cryptographic Session Assertion Protocol)
 * authentication. Provides wallet-based login, logout, and session management.
 */

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from './useWallet';
import { API_ENDPOINTS } from '../constants/api';
import mobileDebugger from '../utils/mobileDebugger';

const AUTH_STORAGE_KEY = 'w_csap_session';
const REFRESH_STORAGE_KEY = 'w_csap_refresh';

// Simple iOS-compatible check - no complex promises
const hasEthereum = () => {
  try {
    return !!(window && window.ethereum);
  } catch (e) {
    return false;
  }
};

// Detect iOS for simplified code path
const isIOS = () => {
  try {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  } catch (e) {
    return false;
  }
};

// Test localStorage functionality (iOS Safari can be problematic)
const testLocalStorage = () => {
  try {
    const testKey = 'wcsap_storage_test';
    localStorage.setItem(testKey, 'test');
    const value = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    return value === 'test';
  } catch (e) {
    console.warn('localStorage not available:', e);
    return false;
  }
};

export const useWalletAuth = () => {
  const { address } = useWallet();
  // Note: We'll get activeAccount lazily when needed to avoid auto-triggering MetaMask
  
  // Test localStorage availability on mount
  const [storageAvailable] = useState(() => testLocalStorage());
  
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Initialize with optimistic auth if token exists and localStorage works
    if (!storageAvailable) {
      console.warn('⚠️ localStorage not available, authentication will not persist');
      return false;
    }
    const hasToken = !!localStorage.getItem(AUTH_STORAGE_KEY);
    console.log('🔍 Initial auth state:', { hasToken, storageAvailable });
    return hasToken;
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
   * ENHANCED: Better error handling and mobile compatibility
   */
  const tryRefreshSession = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_STORAGE_KEY);
    const oldSessionToken = localStorage.getItem(AUTH_STORAGE_KEY);
    
    console.log('🔄 Attempting session refresh:', {
      hasRefreshToken: !!refreshToken,
      hasOldSession: !!oldSessionToken
    });
    
    if (!refreshToken || !oldSessionToken) {
      console.log('❌ Missing tokens for refresh');
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
        }),
        timeout: 10000 // 10 second timeout
      });
      
      const data = await response.json();
      console.log('🔄 Refresh response:', { success: data.success, hasTokens: !!(data.session_token && data.refresh_token) });
      
      if (data.success && data.session_token) {
        // Store new tokens (direct structure from server)
        localStorage.setItem(AUTH_STORAGE_KEY, data.session_token);
        localStorage.setItem(REFRESH_STORAGE_KEY, data.refresh_token);
        
        console.log(`🔄 Session refreshed, new token: ${data.session_token.substring(0, 20)}...`);
        
        // Update state
        setIsAuthenticated(true);
        setSessionInfo({
          wallet_address: null, // Server doesn't return wallet_address in refresh
          expires_at: data.expires_at,
          expires_in: data.expires_in
        });
        
        console.log('✅ Session refreshed successfully');
        return true;
      } else {
        console.log('❌ Session refresh failed:', data.message || 'No session data');
        clearSession();
        return false;
      }
    } catch (error) {
      console.error('❌ Session refresh error:', error);
      
      // On iOS, be more lenient with network errors
      if (isIOS() && (error.name === 'TypeError' || error.message.includes('Load failed'))) {
        console.log('📱 iOS network error during refresh, keeping existing tokens');
        return false; // Keep existing tokens but indicate refresh failed
      }
      
      clearSession();
      return false;
    }
  }, [clearSession]);

  /**
   * iOS-specific simplified login function
   * Uses minimal JavaScript features for maximum compatibility
   */
  const loginIOS = useCallback(async () => {
    mobileDebugger.log('🍎 iOS Login Started');
    mobileDebugger.log(`📍 Address: ${address ? 'Available' : 'Missing'}`);
    mobileDebugger.log(`🔌 Ethereum: ${window.ethereum ? 'Available' : 'Missing'}`);
    mobileDebugger.log(`🌐 API Base URL: ${API_ENDPOINTS.BASE}`);
    mobileDebugger.log(`🏠 Window hostname: ${window.location.hostname}`);
    
    if (!address) {
      mobileDebugger.log('❌ No address available');
      setAuthError('Please connect your wallet first');
      return false;
    }
    
    if (!window.ethereum) {
      mobileDebugger.log('❌ No ethereum provider');
      setAuthError('Please use MetaMask mobile browser. Open MetaMask app → Browser tab → Visit this page.');
      return false;
    }
    
    mobileDebugger.log('🚀 Starting authentication process...');
    
    // Test mobileDebugger functionality
    mobileDebugger.log('🧪 Testing debugger - simple string');
    mobileDebugger.log('🧪 Testing debugger - number:', 12345);
    mobileDebugger.log('🧪 Testing debugger - object:', {test: 'value', number: 42});
    mobileDebugger.log('🧪 Testing debugger - JSON:', JSON.stringify({test: 'value'}));
    
    setIsAuthenticating(true);
    setAuthError(null);
    
    try {
      // Step 0: Test connectivity
      mobileDebugger.log('🔗 Testing network connectivity...');
      try {
        const healthResponse = await fetch(`${API_ENDPOINTS.BASE}/health`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          timeout: 5000
        });
        mobileDebugger.log(`🔗 Health check status: ${healthResponse.status}`);
        
        if (!healthResponse.ok) {
          mobileDebugger.log('⚠️ Health check failed but continuing...');
        }
        
        const healthData = await healthResponse.text();
        mobileDebugger.log(`🔗 Health response preview: ${healthData.substring(0, 100)}...`);
        
      } catch (healthError) {
        mobileDebugger.log(`⚠️ Health check failed: ${healthError.message}`);
        mobileDebugger.log('⚠️ Continuing with auth anyway...');
      }
      
      // Step 1: Get challenge - simple fetch
      mobileDebugger.log('📝 Step 1: Requesting challenge...');
      mobileDebugger.log(`🌐 Request URL: ${API_ENDPOINTS.BASE}/api/auth/challenge`);
      mobileDebugger.log(`📍 Wallet address: ${address}`);
      
      const challengeResponse = await fetch(`${API_ENDPOINTS.BASE}/api/auth/challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: address })
      });
      
      mobileDebugger.log(`📝 Challenge response status: ${challengeResponse.status}`);
      mobileDebugger.log(`📝 Challenge response ok: ${challengeResponse.ok}`);
      
      if (!challengeResponse.ok) {
        throw new Error(`Challenge failed: ${challengeResponse.status}`);
      }
      
      const challengeData = await challengeResponse.json();
      mobileDebugger.log(`📝 Challenge received: ${challengeData.challenge_id?.substring(0, 8)}...`);
      
      // Step 2: Sign with MetaMask - direct request
      mobileDebugger.log('✍️ Step 2: Requesting signature...');
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [challengeData.challenge_message, address]
      });
      
      mobileDebugger.log(`✍️ Signature received: ${signature.substring(0, 10)}...`);
      
      // iOS-specific delay to prevent timing issues
      mobileDebugger.log('⏳ Adding iOS compatibility delay...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 3: Verify signature - enhanced debugging with retry logic
      mobileDebugger.log('🔍 Step 3: Verifying signature...');
      
      const verifyPayload = {
        challenge_id: challengeData.challenge_id,
        signature: signature,
        wallet_address: address
      };
      
      mobileDebugger.log('📤 Request payload STRING:', JSON.stringify(verifyPayload, null, 2));
      mobileDebugger.log('📤 Request payload OBJECT:', verifyPayload);
      mobileDebugger.log('📤 Challenge ID:', verifyPayload.challenge_id);
      mobileDebugger.log('📤 Signature:', verifyPayload.signature?.substring(0, 20) + '...');
      mobileDebugger.log(`📤 Request URL: ${API_ENDPOINTS.BASE}/api/auth/verify`);
      
      // iOS Safari-specific fetch configuration
      const fetchOptions = {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(verifyPayload),
        credentials: 'omit', // Avoid CORS issues on iOS
        cache: 'no-store',   // Prevent iOS caching issues
        mode: 'cors'
      };
      
      mobileDebugger.log('📤 Fetch options STRING:', JSON.stringify(fetchOptions, null, 2));
      mobileDebugger.log('📤 Fetch method:', fetchOptions.method);
      mobileDebugger.log('📤 Content-Type:', fetchOptions.headers['Content-Type']);
      
      // Retry logic for iOS network issues
      let verifyResponse;
      let lastError;
      const maxRetries = 3;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          mobileDebugger.log(`🔄 Verification attempt ${attempt}/${maxRetries}`);
          
          verifyResponse = await fetch(`${API_ENDPOINTS.BASE}/api/auth/verify`, fetchOptions);
          
          mobileDebugger.log(`🔍 Attempt ${attempt} - Status: ${verifyResponse.status}, OK: ${verifyResponse.ok}`);
          
          // If we get a response (even an error), break out of retry loop
          if (verifyResponse.status !== 0) {
            break;
          }
          
        } catch (fetchError) {
          mobileDebugger.log(`❌ Attempt ${attempt} failed:`, fetchError.message);
          lastError = fetchError;
          
          if (attempt < maxRetries) {
            mobileDebugger.log(`⏳ Waiting before retry...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }
      
      if (!verifyResponse) {
        mobileDebugger.log(`❌ All ${maxRetries} attempts failed`);
        throw lastError || new Error('Network request failed after retries');
      }
      
      mobileDebugger.log(`🔍 Verify response status: ${verifyResponse.status}`);
      mobileDebugger.log(`🔍 Verify response ok: ${verifyResponse.ok}`);
      mobileDebugger.log(`🔍 Verify response type: ${verifyResponse.type}`);
      
      // Log response headers
      mobileDebugger.log('📥 Response headers exist:', !!verifyResponse.headers);
      const responseHeaders = {};
      let headerCount = 0;
      
      try {
        for (const [key, value] of verifyResponse.headers.entries()) {
          responseHeaders[key] = value;
          headerCount++;
        }
        mobileDebugger.log('📥 Header count:', headerCount);
        mobileDebugger.log('📥 Response headers STRING:', JSON.stringify(responseHeaders, null, 2));
        mobileDebugger.log('📥 Content-Type header:', responseHeaders['content-type']);
        mobileDebugger.log('📥 Content-Length header:', responseHeaders['content-length']);
      } catch (headerError) {
        mobileDebugger.log('❌ Header parsing failed:', headerError.message);
      }
      
      if (!verifyResponse.ok) {
        throw new Error(`Verification failed: ${verifyResponse.status}`);
      }
      
      // Enhanced response reading with iOS Safari compatibility
      let responseText = '';
      let sessionData;
      
      try {
        // Try to clone the response for multiple read attempts
        const responseClone = verifyResponse.clone();
        
        // First attempt: response.text()
        try {
          responseText = await verifyResponse.text();
          mobileDebugger.log(`🔍 Raw response text (method 1):`, responseText);
          mobileDebugger.log(`🔍 Raw response length:`, responseText ? responseText.length : 'NULL/UNDEFINED');
          mobileDebugger.log(`🔍 Response text type:`, typeof responseText);
          mobileDebugger.log(`🔍 Response text truthy:`, !!responseText);
          
          if (!responseText || responseText.length === 0) {
            throw new Error('Empty response body from server');
          }
        } catch (textError) {
          mobileDebugger.log(`⚠️ response.text() failed:`, textError.message);
          
          // Second attempt: response.json() directly
          try {
            sessionData = await responseClone.json();
            responseText = JSON.stringify(sessionData);
            mobileDebugger.log(`🔍 Raw response via json() method:`, responseText);
          } catch (jsonError) {
            mobileDebugger.log(`⚠️ json() also failed, trying arrayBuffer method...`);
            
            // Third attempt: arrayBuffer + manual decoding (iOS Safari fallback)
            try {
              const responseClone2 = verifyResponse.clone();
              const arrayBuffer = await responseClone2.arrayBuffer();
              const decoder = new TextDecoder('utf-8');
              responseText = decoder.decode(arrayBuffer);
              
              mobileDebugger.log(`🔍 Raw response via arrayBuffer:`, responseText);
              mobileDebugger.log(`🔍 ArrayBuffer length:`, arrayBuffer.byteLength);
              
              if (responseText) {
                sessionData = JSON.parse(responseText);
              }
              
            } catch (arrayBufferError) {
              mobileDebugger.log(`❌ All methods failed (text, json, arrayBuffer)`);
              mobileDebugger.log(`❌ text() error:`, textError.message);
              mobileDebugger.log(`❌ json() error:`, jsonError.message);
              mobileDebugger.log(`❌ arrayBuffer() error:`, arrayBufferError.message);
              throw new Error(`Failed to read response with all methods: ${textError.message}`);
            }
          }
        }
        
        // If we don't have sessionData yet, parse the responseText
        if (!sessionData && responseText) {
          mobileDebugger.log(`🔄 Attempting to parse responseText...`);
          mobileDebugger.log(`🔄 ResponseText exists:`, !!responseText);
          mobileDebugger.log(`🔄 ResponseText length:`, responseText.length);
          mobileDebugger.log(`🔄 ResponseText preview:`, responseText.substring(0, 100));
          
          try {
            sessionData = JSON.parse(responseText);
            mobileDebugger.log(`✅ JSON parsing successful`);
            mobileDebugger.log(`✅ Parsed data type:`, typeof sessionData);
            mobileDebugger.log(`✅ Parsed data keys:`, Object.keys(sessionData || {}));
          } catch (parseError) {
            mobileDebugger.log(`❌ JSON parsing failed:`, parseError.message);
            mobileDebugger.log(`❌ Raw text to parse:`, responseText.substring(0, 200));
            throw new Error(`Invalid JSON response: ${parseError.message}`);
          }
        } else if (!sessionData) {
          mobileDebugger.log(`❌ No response data available - sessionData:`, !!sessionData, 'responseText:', !!responseText);
          throw new Error('Empty response from server');
        }
        
      } catch (responseError) {
        mobileDebugger.log(`❌ Response processing error:`, responseError.message);
        mobileDebugger.log(`❌ Response error stack:`, responseError.stack);
        throw responseError;
      }
      
      // ENHANCED debugging for iOS Safari compatibility
      mobileDebugger.log(`📦 sessionData exists:`, !!sessionData);
      mobileDebugger.log(`📦 sessionData is null:`, sessionData === null);
      mobileDebugger.log(`📦 sessionData is undefined:`, sessionData === undefined);
      mobileDebugger.log(`📦 Response type:`, typeof sessionData);
      
      if (sessionData) {
        mobileDebugger.log(`📦 Response success:`, sessionData.success);
        mobileDebugger.log(`📦 Response keys:`, Object.keys(sessionData));
        mobileDebugger.log(`📦 Has data property:`, 'data' in sessionData);
        mobileDebugger.log(`📦 Data value:`, sessionData.data);
        mobileDebugger.log(`📦 Full sessionData STRING:`, JSON.stringify(sessionData, null, 2));
      } else {
        mobileDebugger.log(`❌ sessionData is falsy!`);
      }
      
      if (!sessionData.success) {
        throw new Error('Authentication failed');
      }
      
      mobileDebugger.log('🎉 Authentication successful!');
      
      // Handle both response formats: wrapped (with .data) and flat
      let authData;
      if (sessionData.data) {
        // Wrapped format from main.py endpoints
        authData = sessionData.data;
        mobileDebugger.log('📦 Using wrapped format (sessionData.data)');
      } else if (sessionData.session_token !== undefined) {
        // Flat format from auth/routes.py endpoints  
        authData = sessionData;
        mobileDebugger.log('📦 Using flat format (sessionData directly)');
      } else {
        mobileDebugger.log('❌ Unknown response format');
        mobileDebugger.log('❌ Available keys:', Object.keys(sessionData));
        throw new Error('Unknown response format');
      }
      mobileDebugger.log(`📊 Auth data type:`, typeof authData);
      mobileDebugger.log(`📊 Auth data keys:`, Object.keys(authData || {}));
      
      if (authData) {
        mobileDebugger.log(`🔑 session_token exists:`, 'session_token' in authData);
        mobileDebugger.log(`🔑 refresh_token exists:`, 'refresh_token' in authData);
        mobileDebugger.log(`🔑 session_token value:`, !!authData.session_token);
        mobileDebugger.log(`🔑 refresh_token value:`, !!authData.refresh_token);
      } else {
        mobileDebugger.log(`❌ authData is null/undefined!`);
      }
      
      if (!authData || !authData.session_token || !authData.refresh_token) {
        mobileDebugger.log(`❌ Token validation failed!`);
        throw new Error('Invalid session data structure');
      }
      
      // Store tokens - simple localStorage
      localStorage.setItem(AUTH_STORAGE_KEY, authData.session_token);
      localStorage.setItem(REFRESH_STORAGE_KEY, authData.refresh_token);
      
      mobileDebugger.log(`💾 Tokens saved: ${authData.session_token.substring(0, 20)}...`);
      
      setIsAuthenticated(true);
      setSessionInfo({
        wallet_address: authData.wallet_address,
        expires_at: authData.expires_at,
        expires_in: authData.expires_in
      });
      
      return true;
      
    } catch (error) {
      mobileDebugger.log(`❌ iOS Auth Error: ${error.message}`);
      mobileDebugger.log(`❌ Error name: ${error.name}`);
      mobileDebugger.log(`❌ Error stack: ${error.stack}`);
      mobileDebugger.log(`❌ Error type: ${typeof error}`);
      mobileDebugger.log(`❌ Error constructor: ${error.constructor.name}`);
      
      // Specific error analysis
      if (error.message === 'Load failed') {
        mobileDebugger.log('🔍 Load failed analysis:');
        mobileDebugger.log(`  - API Base URL: ${API_ENDPOINTS.BASE}`);
        mobileDebugger.log(`  - Current location: ${window.location.href}`);
        mobileDebugger.log(`  - User agent: ${navigator.userAgent}`);
        
        // Test basic connectivity
        mobileDebugger.log('🧪 Testing basic connectivity...');
        fetch(`${API_ENDPOINTS.BASE}/health`, { method: 'GET', mode: 'cors' })
          .then(response => {
            mobileDebugger.log(`✅ Health check: ${response.status} ${response.ok ? 'OK' : 'Failed'}`);
          })
          .catch(healthError => {
            mobileDebugger.log(`❌ Health check failed: ${healthError.message}`);
          });
      }
      
      setAuthError(error.message || 'Authentication failed');
      clearSession();
      return false;
      
    } finally {
      setIsAuthenticating(false);
      mobileDebugger.log('🏁 iOS Auth process finished');
    }
  }, [address, clearSession]);

  /**
   * Load and verify session from localStorage on mount
   * ENHANCED: Better error handling and iOS compatibility
   */
  useEffect(() => {
    const verifySession = async () => {
      const sessionToken = localStorage.getItem(AUTH_STORAGE_KEY);
      const refreshToken = localStorage.getItem(REFRESH_STORAGE_KEY);
      
      console.log('🔍 Session verification on mount:', {
        hasSessionToken: !!sessionToken,
        hasRefreshToken: !!refreshToken,
        tokenPreview: sessionToken?.substring(0, 20) + '...'
      });
      
      if (sessionToken) {
        try {
          // Verify session with backend
          const response = await fetch(`${API_ENDPOINTS.BASE}/api/auth/status`, {
            headers: {
              'Authorization': `Bearer ${sessionToken}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout
          });
          
          const data = await response.json();
          console.log('🔍 Session status response:', data);
          
          if (data.authenticated && data.wallet_address) {
            setSessionInfo({
              wallet_address: data.wallet_address,
              expires_at: data.expires_at,
              expires_in: data.expires_in
            });
            setIsAuthenticated(true);
            console.log('✅ Session restored successfully');
          } else {
            console.log('🔄 Session invalid, attempting refresh...');
            // Session invalid, try to refresh
            const refreshed = await tryRefreshSession();
            if (!refreshed) {
              console.log('❌ Session refresh failed, clearing tokens');
              clearSession();
            }
          }
        } catch (error) {
          console.error('❌ Session verification error:', error);
          
          // On mobile Safari, network errors are common
          if (isIOS()) {
            console.log('📱 iOS detected, keeping optimistic session for offline capability');
            // Keep the session optimistically on iOS
          } else {
            console.log('🔄 Attempting session refresh on error...');
            const refreshed = await tryRefreshSession();
            if (!refreshed) {
              console.log('⚠️ Session refresh failed, but keeping tokens for retry');
            }
          }
        }
      } else {
        console.log('ℹ️ No session token found');
        setIsAuthenticated(false);
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
   * Uses window.ethereum directly to avoid ThirdWeb auto-triggers
   */
  const signChallenge = useCallback(async (challengeMessage, walletAddress) => {
    // Ultra-simple check for iOS
    if (!hasEthereum()) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        throw new Error('Please use MetaMask mobile browser. Open MetaMask app → Browser tab → Visit this page.');
      } else {
        throw new Error('No Web3 wallet detected. Please install MetaMask browser extension.');
      }
    }
    
    if (!walletAddress) {
      throw new Error('Wallet address is required for signing.');
    }
    
    try {
      // Use personal_sign for EIP-191 compatible signatures
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [challengeMessage, walletAddress]
      });
      
      return signature;
      
    } catch (error) {
      
      // User-friendly error messages
      if (error.code === 4001 || error.message?.includes('rejected') || error.message?.includes('denied')) {
        throw new Error('Signature request was rejected. Please approve the signature in your wallet to continue.');
      }
      
      if (error.code === -32002) {
        throw new Error('A signature request is already pending in your wallet. Please check MetaMask.');
      }
      
      throw new Error(`Failed to sign message: ${error.message || 'Unknown error'}`);
    }
  }, []);

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
   * Only triggers MetaMask when user explicitly clicks "Sign In"
   */
  const login = useCallback(async () => {
    mobileDebugger.log('🚀 Login function called');
    mobileDebugger.log(`📱 Device: ${isIOS() ? 'iOS' : 'Other'}`);
    
    // iOS gets a completely different, simpler path
    if (isIOS()) {
      mobileDebugger.log('🍎 Routing to iOS-specific login');
      return await loginIOS();
    }
    
    // Standard path for other platforms
    if (!address) {
      setAuthError('Please connect your wallet first');
      return false;
    }
    
    if (!hasEthereum()) {
      setAuthError('No Web3 wallet detected. Please install MetaMask browser extension.');
      return false;
    }
    
    setIsAuthenticating(true);
    setAuthError(null);
    
    try {
      // Step 1: Request challenge
      const challengeData = await requestChallenge(address);
      
      // Step 2: Sign challenge
      const signature = await signChallenge(challengeData.challenge_message, address);
      
      // Step 3: Verify and create session
      const sessionData = await verifyAndCreateSession(
        challengeData.challenge_id,
        signature,
        address
      );
      
      // Handle both response formats: wrapped (with .data) and flat
      let authData;
      if (sessionData.data) {
        // Wrapped format from main.py endpoints
        authData = sessionData.data;
        console.log('📦 Using wrapped format (sessionData.data)');
      } else if (sessionData.session_token !== undefined) {
        // Flat format from auth/routes.py endpoints  
        authData = sessionData;
        console.log('📦 Using flat format (sessionData directly)');
      } else {
        console.log('❌ Unknown response format, available keys:', Object.keys(sessionData));
        throw new Error('Unknown response format');
      }
      
      if (!authData || !authData.session_token || !authData.refresh_token) {
        console.log(`❌ Invalid response structure:`, sessionData);
        throw new Error('Invalid session data structure');
      }
      
      localStorage.setItem(AUTH_STORAGE_KEY, authData.session_token);
      localStorage.setItem(REFRESH_STORAGE_KEY, authData.refresh_token);
      
      console.log(`💾 Tokens saved: ${authData.session_token.substring(0, 20)}...`);
      
      // Update state
      setIsAuthenticated(true);
      setSessionInfo({
        wallet_address: authData.wallet_address,
        expires_at: authData.expires_at,
        expires_in: authData.expires_in
      });
      
      return true;
      
    } catch (error) {
      setAuthError(error.message || 'Authentication failed');
      clearSession();
      return false;
      
    } finally {
      setIsAuthenticating(false);
    }
  }, [address, requestChallenge, signChallenge, verifyAndCreateSession, clearSession]);

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
