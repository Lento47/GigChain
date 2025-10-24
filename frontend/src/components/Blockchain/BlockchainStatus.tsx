import React from 'react';
import { useActiveAccount, useActiveWalletChain } from 'thirdweb/react';
import {
  WifiIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface BlockchainStatusProps {
  isCompact?: boolean;
}

const BlockchainStatus: React.FC<BlockchainStatusProps> = ({ isCompact = true }) => {
  const activeAccount = useActiveAccount();
  const chain = useActiveWalletChain();
  const isConnected = !!activeAccount;
  const address = activeAccount?.address;

  if (!isConnected || !address) {
    return (
      <div className={`flex items-center space-x-2 ${isCompact ? 'text-sm' : 'text-base'}`}>
        <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />
        <span className="text-red-300 font-medium">Wallet desconectada</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${isCompact ? 'text-sm' : 'text-base'}`}>
      {/* Network Status */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <WifiIcon className="h-4 w-4 text-green-400" />
          <span className="text-green-300 font-medium">
            {chain?.name || 'Red desconocida'}
          </span>
        </div>
      </div>

      {/* Separator */}
      <span className="text-cyan-500">•</span>

      {/* Wallet Address */}
      <div className="flex items-center space-x-1">
        <ShieldCheckIcon className="h-4 w-4 text-cyan-400" />
        <span className="text-cyan-300 font-mono">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      </div>

      {/* Separator */}
      <span className="text-cyan-500">•</span>

      {/* Token Balance (Mock) */}
      <div className="flex items-center space-x-1">
        <CurrencyDollarIcon className="h-4 w-4 text-yellow-400" />
        <span className="text-yellow-300 font-medium">
          1,234 GCH
        </span>
      </div>
    </div>
  );
};

export default BlockchainStatus;
