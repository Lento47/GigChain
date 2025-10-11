/**
 * GigChain Internal Wallet Service
 * Handles API calls for internal GigChain wallets
 */

import { API_BASE_URL } from '../constants/api';

/**
 * Get authentication token from localStorage
 */
const getAuthToken = () => {
  // Use the same key as useWalletAuth hook
  const sessionToken = localStorage.getItem('w_csap_session');
  return sessionToken;
};

/**
 * Create headers with authentication
 */
const getHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

/**
 * Create a new GigChain internal wallet
 * @param {string} name - Name for the wallet
 * @returns {Promise<Object>} Created wallet data
 */
export const createWallet = async (name = 'Mi Wallet GigChain') => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/wallets/create`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      // Handle different error formats
      const errorMessage = data.error || data.detail || data.message || 'Error al crear wallet';
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error('Error creating wallet:', error);
    // Ensure we always throw an Error object with a message
    if (error.message) {
      throw error;
    }
    throw new Error('Error de conexión. Verifica que estés autenticado.');
  }
};

/**
 * Get current user's wallet
 * @returns {Promise<Object>} User's wallet data
 */
export const getMyWallet = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/wallets/me`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await response.json();
    
    if (!response.ok) {
      // Handle authentication errors gracefully
      if (response.status === 401 || response.status === 403) {
        throw new Error('Debes estar autenticado para ver tu wallet');
      }
      const errorMessage = data.error || data.detail || data.message || 'Error al obtener wallet';
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error('Error getting wallet:', error);
    if (error.message) {
      throw error;
    }
    throw new Error('Error de conexión con el servidor');
  }
};

/**
 * Get wallet by address
 * @param {string} walletAddress - GigChain wallet address
 * @returns {Promise<Object>} Wallet data
 */
export const getWalletByAddress = async (walletAddress) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/wallets/${walletAddress}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al obtener wallet');
    }

    return data;
  } catch (error) {
    console.error('Error getting wallet by address:', error);
    throw error;
  }
};

/**
 * Get wallet transaction history
 * @param {string} walletAddress - GigChain wallet address
 * @param {number} limit - Number of transactions to fetch
 * @returns {Promise<Object>} Transaction history
 */
export const getWalletTransactions = async (walletAddress, limit = 50) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/wallets/${walletAddress}/transactions?limit=${limit}`,
      {
        method: 'GET',
        headers: getHeaders(),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al obtener transacciones');
    }

    return data;
  } catch (error) {
    console.error('Error getting transactions:', error);
    throw error;
  }
};

/**
 * Add a transaction to wallet (for testing)
 * @param {string} walletAddress - GigChain wallet address
 * @param {number} amount - Transaction amount
 * @param {string} transactionType - Type of transaction
 * @param {string} description - Transaction description
 * @returns {Promise<Object>} Transaction result
 */
export const addWalletTransaction = async (
  walletAddress,
  amount,
  transactionType,
  description = ''
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/wallets/${walletAddress}/transaction`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          amount,
          transaction_type: transactionType,
          description,
        }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al agregar transacción');
    }

    return data;
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

/**
 * Deactivate a wallet
 * @param {string} walletAddress - GigChain wallet address
 * @returns {Promise<Object>} Deactivation result
 */
export const deactivateWallet = async (walletAddress) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/wallets/${walletAddress}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al desactivar wallet');
    }

    return data;
  } catch (error) {
    console.error('Error deactivating wallet:', error);
    throw error;
  }
};

export default {
  createWallet,
  getMyWallet,
  getWalletByAddress,
  getWalletTransactions,
  addWalletTransaction,
  deactivateWallet,
};

