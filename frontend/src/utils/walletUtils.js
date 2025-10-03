// Wallet utility functions

// Función para truncar direcciones de wallet
const truncateWalletAddress = (address, startChars = 6, endChars = 4) => {
  if (!address || address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

// Validate Ethereum address
const isValidEthereumAddress = (address) => {
  if (!address) return false;
  // Basic Ethereum address validation (42 characters, starts with 0x)
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Utility to get wallet info (for demonstration)
const getWalletInfo = async (address) => {
  if (!isValidEthereumAddress(address)) {
    return { valid: false, error: 'Invalid address format' };
  }
  
  // In a real implementation, you would query the blockchain
  // For now, we'll just return basic validation
  return {
    valid: true,
    address: address,
    type: 'Ethereum-compatible',
    network: 'Polygon/Mumbai'
  };
};

export { truncateWalletAddress, isValidEthereumAddress, getWalletInfo };
export default { truncateWalletAddress, isValidEthereumAddress, getWalletInfo };
