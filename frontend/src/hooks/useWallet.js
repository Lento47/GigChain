import { useActiveAccount, useDisconnect, useSwitchActiveWalletChain, useActiveWalletChain, useActiveWallet } from 'thirdweb/react';
import { polygonAmoy } from "thirdweb/chains";
import { useState, useEffect } from 'react';

// Amoy Testnet (Mumbai replacement)
const Amoy = {
  chainId: 80002,
  name: 'Polygon Amoy Testnet',
  chain: 'Polygon',
  rpc: ['https://rpc-amoy.polygon.technology'],
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  shortName: 'amoy',
  slug: 'polygon-amoy-testnet',
  testnet: true,
  explorers: [
    {
      name: 'PolygonScan',
      url: 'https://amoy.polygonscan.com',
      standard: 'EIP3091',
    },
  ],
};

export const useWallet = () => {
  // Safe hook calls with error handling
  let activeAccount, disconnectHook, activeWalletChain, switchChain, activeWallet;
  
  // Add initialization state
  const [isInitializing, setIsInitializing] = useState(true);
  
  try {
    activeAccount = useActiveAccount();
    activeWallet = useActiveWallet(); // Get the active wallet instance
    disconnectHook = useDisconnect();
    activeWalletChain = useActiveWalletChain();
    switchChain = useSwitchActiveWalletChain();
  } catch (error) {
    console.warn('Thirdweb hooks not available, using fallback values:', error);
    // Fallback values when Thirdweb context is not available
    activeAccount = undefined;
    activeWallet = undefined;
    disconnectHook = null;
    activeWalletChain = undefined;
    switchChain = async () => Promise.resolve();
  }
  
  // Create a safe disconnect function that passes the active wallet
  // ThirdWeb v5 requires the wallet instance to disconnect properly
  const disconnect = async () => {
    if (!disconnectHook) {
      console.warn('Disconnect hook not available');
      return;
    }
    
    if (!activeWallet) {
      console.warn('No active wallet to disconnect');
      return;
    }
    
    try {
      // ThirdWeb v5: disconnect(wallet)
      if (typeof disconnectHook === 'function') {
        await disconnectHook(activeWallet);
      } else if (disconnectHook.disconnect) {
        await disconnectHook.disconnect(activeWallet);
      }
    } catch (error) {
      console.error('Error in disconnect:', error);
      throw error;
    }
  };

  // Extract address and chainId from activeAccount and activeWalletChain
  const address = activeAccount?.address;
  const chainId = activeWalletChain?.id;
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [walletInfo, setWalletInfo] = useState(null);

  // Supported chains
  const supportedChains = [polygonAmoy];
  const targetChain = polygonAmoy; // Default to Amoy testnet (Mumbai replacement)
  
  // Get chainId from targetChain - polygonAmoy has 'id' property
  const targetChainId = targetChain?.id || 80002; // Fallback to Amoy chainId

  // Check if wallet is connected to the correct chain
  const isCorrectChain = chainId ? chainId === targetChainId : false;

  // Get wallet info and handle initialization
  useEffect(() => {
    console.log('Wallet state changed:', { address, chainId, isCorrectChain, targetChainId });
    
    // Mark as initialized after first wallet state change
    if (isInitializing) {
      // Give ThirdWeb a moment to fully initialize
      const timer = setTimeout(() => {
        setIsInitializing(false);
      }, 500); // Small delay to ensure wallet hooks are ready
      
      return () => clearTimeout(timer);
    }
    
    if (address) {
      setWalletInfo({
        address,
        chainId,
        isCorrectChain,
        network: isCorrectChain ? (targetChain?.name || 'Polygon Amoy') : 'Unknown',
        shortAddress: `${address.slice(0, 6)}...${address.slice(-4)}`
      });
    } else {
      setWalletInfo(null);
    }
  }, [address, chainId, isCorrectChain, isInitializing]);

  // Switch to correct chain
  const switchToCorrectChain = async () => {
    if (!switchChain) {
      alert('Por favor, cambia manualmente a Amoy en MetaMask');
      return;
    }
    
    try {
      setIsSwitching(true);
      console.log('Switching to chain:', targetChainId, targetChain?.name || 'Polygon Amoy');
      await switchChain(targetChain);
      console.log('Successfully switched to Polygon Amoy testnet');
    } catch (error) {
      console.error('Error switching chain:', error);
      
      // Show user-friendly error message with instructions
      const errorMsg = error?.message || error?.reason || 'Error desconocido';
      
      if (errorMsg.includes('rejected') || errorMsg.includes('denied')) {
        alert('Cambio de red cancelado. Por favor, acepta el cambio en MetaMask para continuar.');
      } else if (errorMsg.includes('Unrecognized chain')) {
        alert('Amoy no está agregada a MetaMask. Ve a https://chainlist.org/?search=amoy&testnets=true para agregarla.');
      } else {
        alert(`Error al cambiar de red: ${errorMsg}\n\nPuedes cambiar manualmente en MetaMask: Haz clic en el nombre de la red → Selecciona Polygon Amoy`);
      }
      
      throw error;
    } finally {
      setIsSwitching(false);
    }
  };

  // Validate wallet address
  const validateAddress = (addr) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  // Get network info
  const getNetworkInfo = () => {
    return {
      targetChain: targetChain?.name || 'Polygon Amoy',
      targetChainId: targetChainId,
      currentChainId: chainId,
      isCorrectChain,
      supportedChains: supportedChains.map(chain => ({
        name: chain?.name || 'Unknown',
        chainId: chain?.id || 0,
        isActive: chain?.id === chainId
      }))
    };
  };

  return {
    // State
    address,
    isConnected: !!address,
    isInitializing,
    isSwitching,
    isCorrectChain,
    walletInfo,
    
    // Actions
    disconnect,
    switchToCorrectChain,
    
    // Chain info
    targetChain: {
      ...targetChain,
      id: targetChainId,
      name: targetChain?.name || 'Polygon Amoy'
    },
    
    // Utils
    validateAddress,
    getNetworkInfo,
    supportedChains
  };
};
