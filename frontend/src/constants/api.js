// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// API Endpoints
export const API_ENDPOINTS = {
  VALIDATE_WALLET: '/api/validate_wallet',
  GENERATE_CONTRACT: '/api/generate_contract',
  DEPLOY_CONTRACT: '/api/deploy_contract',
  GET_CONTRACTS: '/api/contracts',
  UPDATE_CONTRACT: '/api/contracts/update'
};
