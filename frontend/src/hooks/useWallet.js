import { useAddress, useDisconnect, useConnect, useChainId, useSwitchChain } from '@thirdweb-dev/react';
import { Polygon } from '@thirdweb-dev/chains';
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
  let address, disconnect, chainId, switchChain;
  
  try {
    address = useAddress();
    disconnect = useDisconnect();
    chainId = useChainId();
    switchChain = useSwitchChain();
  } catch (error) {
    console.warn('Thirdweb hooks not available, using fallback values:', error);
    // Fallback values when Thirdweb context is not available
    address = undefined;
    disconnect = () => Promise.resolve();
    chainId = undefined;
    switchChain = async () => Promise.resolve();
  }
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [walletInfo, setWalletInfo] = useState(null);

  // Supported chains
  const supportedChains = [Polygon, Amoy];
  const targetChain = Amoy; // Default to Amoy testnet (Mumbai replacement)

  // Check if wallet is connected to the correct chain
  const isCorrectChain = chainId ? chainId === targetChain.chainId : false;

  // Get wallet info
  useEffect(() => {
    console.log('Wallet state changed:', { address, chainId, isCorrectChain, targetChainId: targetChain.chainId });
    
    if (address) {
      setWalletInfo({
        address,
        chainId,
        isCorrectChain,
        network: isCorrectChain ? targetChain.name : 'Unknown',
        shortAddress: `${address.slice(0, 6)}...${address.slice(-4)}`
      });
    } else {
      setWalletInfo(null);
    }
  }, [address, chainId, isCorrectChain]);

  // Switch to correct chain
  const switchToCorrectChain = async () => {
    if (!switchChain) {
      alert('Por favor, cambia manualmente a Mumbai en MetaMask');
      return;
    }
    
    try {
      setIsSwitching(true);
      console.log('Switching to chain:', targetChain.chainId, targetChain.name);
      await switchChain(targetChain.chainId);
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
      targetChain: targetChain.name,
      targetChainId: targetChain.chainId,
      currentChainId: chainId,
      isCorrectChain,
      supportedChains: supportedChains.map(chain => ({
        name: chain.name,
        chainId: chain.chainId,
        isActive: chain.chainId === chainId
      }))
    };
  };

  return {
    // State
    address,
    isConnected: !!address,
    isSwitching,
    isCorrectChain,
    walletInfo,
    
    // Actions
    disconnect,
    switchToCorrectChain,
    
    // Utils
    validateAddress,
    getNetworkInfo,
    supportedChains,
    targetChain
  };
};
