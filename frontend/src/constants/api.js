// API Configuration
// Force correct URL based on current hostname for mobile compatibility
const getApiUrl = () => {
  const hostname = window.location.hostname;
  console.log('🌐 Hostname detected:', hostname);
  
  // Force localhost for development on desktop
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  
  // Use current hostname for mobile/network access
  const apiUrl = `http://${hostname}:5000`;
  console.log('🔧 API URL set to:', apiUrl);
  return apiUrl;
};

// Override environment variable for mobile compatibility
export const API_BASE_URL = getApiUrl();

// API Endpoints
export const API_ENDPOINTS = {
  BASE: API_BASE_URL,
  VALIDATE_WALLET: '/api/validate_wallet',
  GENERATE_CONTRACT: '/api/generate_contract',
  DEPLOY_CONTRACT: '/api/deploy_contract',
  GET_CONTRACTS: '/api/contracts',
  UPDATE_CONTRACT: '/api/contracts/update'
};
