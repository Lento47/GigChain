/**
 * GigChain Mobile - Wallet Context
 * Manages wallet connection and authentication
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

interface Wallet {
  address: string;
  balance?: number;
  network?: string;
}

interface WalletContextType {
  wallet: Wallet | null;
  isConnected: boolean;
  isLoading: boolean;
  connectWallet: (address: string) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  authenticate: (signature: string) => Promise<boolean>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved wallet on mount
    loadSavedWallet();
  }, []);

  const loadSavedWallet = async () => {
    try {
      const savedAddress = await SecureStore.getItemAsync('wallet_address');
      const sessionToken = await SecureStore.getItemAsync('session_token');

      if (savedAddress && sessionToken) {
        // Verify session is still valid
        const response = await axios.get(`${API_URL}/api/auth/status`, {
          headers: { Authorization: `Bearer ${sessionToken}` },
        });

        if (response.data.authenticated) {
          setWallet({ address: savedAddress });
          setIsConnected(true);
        } else {
          // Session expired, clear stored data
          await clearWalletData();
        }
      }
    } catch (error) {
      console.error('Error loading saved wallet:', error);
      await clearWalletData();
    } finally {
      setIsLoading(false);
    }
  };

  const connectWallet = async (address: string) => {
    try {
      setIsLoading(true);

      // Request authentication challenge
      const challengeResponse = await axios.post(`${API_URL}/api/auth/challenge`, {
        wallet_address: address,
      });

      if (challengeResponse.data) {
        const challenge = challengeResponse.data;
        
        // In a real app, sign the challenge with the wallet
        // For now, we'll simulate the connection
        setWallet({ address });
        setIsConnected(true);

        // Save wallet address
        await SecureStore.setItemAsync('wallet_address', address);

        return challenge;
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const authenticate = async (signature: string) => {
    try {
      if (!wallet) {
        throw new Error('No wallet connected');
      }

      // Verify signature and get session token
      // ... (implementation with backend)

      return true;
    } catch (error) {
      console.error('Error authenticating:', error);
      return false;
    }
  };

  const disconnectWallet = async () => {
    try {
      setIsLoading(true);
      await clearWalletData();
      setWallet(null);
      setIsConnected(false);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearWalletData = async () => {
    await SecureStore.deleteItemAsync('wallet_address');
    await SecureStore.deleteItemAsync('session_token');
    await SecureStore.deleteItemAsync('refresh_token');
  };

  const value = {
    wallet,
    isConnected,
    isLoading,
    connectWallet,
    disconnectWallet,
    authenticate,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};
