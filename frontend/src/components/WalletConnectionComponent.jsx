import React, { useState } from 'react';
import WalletConnection from './WalletConnection';

const WalletConnectionComponent = () => {
  const [walletState, setWalletState] = useState({ connected: false, address: null });

  const handleWalletChange = (newState) => {
    setWalletState(newState);
  };

  return (
    <WalletConnection 
      onWalletChange={handleWalletChange}
      className="main-wallet-connection"
    />
  );
};

export default WalletConnectionComponent;
