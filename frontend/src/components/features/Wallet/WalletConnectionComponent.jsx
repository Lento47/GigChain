import React, { useState } from 'react';
import WalletConnection from './WalletConnection';

const WalletConnectionComponent = ({ client }) => {
  const [walletState, setWalletState] = useState({ connected: false, address: null });

  const handleWalletChange = (newState) => {
    setWalletState(newState);
  };

  return (
    <WalletConnection 
      onWalletChange={handleWalletChange}
      className="main-wallet-connection"
      client={client}
    />
  );
};

export default WalletConnectionComponent;
