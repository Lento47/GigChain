import { useAddress, useDisconnect, useConnect, useChainId, useSwitchChain } from '@thirdweb-dev/react';
import { Polygon, Mumbai } from '@thirdweb-dev/chains';
import { useState, useEffect } from 'react';

export const useWallet = () => {
  const address = useAddress();
  const disconnect = useDisconnect();
  const connect = useConnect();
  const chainId = useChainId();
  const switchChain = useSwitchChain();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [walletInfo, setWalletInfo] = useState(null);

  // Supported chains
  const supportedChains = [Polygon, Mumbai];
  const targetChain = Mumbai; // Default to Mumbai testnet

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

  // Connect wallet
  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      await connect();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  // Switch to correct chain
  const switchToCorrectChain = async () => {
    try {
      setIsSwitching(true);
      console.log('Switching to chain:', targetChain.chainId, targetChain.name);
      await switchChain(targetChain.chainId);
      console.log('Successfully switched to Mumbai testnet');
    } catch (error) {
      console.error('Error switching chain:', error);
      // Show user-friendly error message
      alert(`Error al cambiar de red: ${error.message || 'Error desconocido'}`);
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
    isConnecting,
    isSwitching,
    isCorrectChain,
    walletInfo,
    
    // Actions
    connectWallet,
    disconnect,
    switchToCorrectChain,
    
    // Utils
    validateAddress,
    getNetworkInfo,
    supportedChains,
    targetChain
  };
};
