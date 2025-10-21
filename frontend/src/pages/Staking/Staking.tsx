import React, { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { 
  LockClosedIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface StakingPool {
  id: string;
  name: string;
  type: 'standard' | 'governance' | 'social' | 'liquidity' | 'yield';
  stakingToken: {
    symbol: string;
    address: string;
    decimals: number;
  };
  rewardToken: {
    symbol: string;
    address: string;
    decimals: number;
  };
  apy: number;
  totalStaked: number;
  lockPeriod: number; // in days
  minStake: number;
  maxStake: number;
  isActive: boolean;
  description: string;
  features: string[];
}

interface UserPosition {
  poolId: string;
  amount: number;
  rewards: number;
  stakedAt: string;
  unlockTime: string;
  isActive: boolean;
}

const Staking: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [pools, setPools] = useState<StakingPool[]>([]);
  const [userPositions, setUserPositions] = useState<UserPosition[]>([]);
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'pools' | 'positions'>('pools');

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockPools: StakingPool[] = [
      {
        id: '1',
        name: 'CLP Standard Staking',
        type: 'standard',
        stakingToken: { symbol: 'CLP', address: '0x...', decimals: 18 },
        rewardToken: { symbol: 'CLP', address: '0x...', decimals: 18 },
        apy: 12.5,
        totalStaked: 2500000,
        lockPeriod: 30,
        minStake: 100,
        maxStake: 1000000,
        isActive: true,
        description: 'Basic CLP staking with flexible lock periods and competitive rewards.',
        features: ['Flexible lock periods', 'Compound rewards', 'Early unstake penalty']
      },
      {
        id: '2',
        name: 'Governance Staking',
        type: 'governance',
        stakingToken: { symbol: 'CLP', address: '0x...', decimals: 18 },
        rewardToken: { symbol: 'CLP', address: '0x...', decimals: 18 },
        apy: 18.0,
        totalStaked: 1800000,
        lockPeriod: 90,
        minStake: 500,
        maxStake: 5000000,
        isActive: true,
        description: 'Stake CLP to participate in DAO governance and earn higher rewards.',
        features: ['DAO voting power', 'Higher APY', 'Governance rewards', 'Longer lock period']
      },
      {
        id: '3',
        name: 'Social Reputation Staking',
        type: 'social',
        stakingToken: { symbol: 'CLP', address: '0x...', decimals: 18 },
        rewardToken: { symbol: 'CLP', address: '0x...', decimals: 18 },
        apy: 15.0,
        totalStaked: 1200000,
        lockPeriod: 60,
        minStake: 200,
        maxStake: 2000000,
        isActive: true,
        description: 'Stake CLP to boost your social reputation and unlock premium features.',
        features: ['Reputation boost', 'Premium features', 'Social rewards', 'Profile verification']
      },
      {
        id: '4',
        name: 'CLP-USDC Liquidity Mining',
        type: 'liquidity',
        stakingToken: { symbol: 'CLP-USDC LP', address: '0x...', decimals: 18 },
        rewardToken: { symbol: 'CLP', address: '0x...', decimals: 18 },
        apy: 25.0,
        totalStaked: 800000,
        lockPeriod: 0,
        minStake: 50,
        maxStake: 10000000,
        isActive: true,
        description: 'Provide liquidity for CLP-USDC pair and earn rewards.',
        features: ['Liquidity rewards', 'Trading fees', 'No lock period', 'High APY']
      },
      {
        id: '5',
        name: 'Yield Farming Pool',
        type: 'yield',
        stakingToken: { symbol: 'CLP', address: '0x...', decimals: 18 },
        rewardToken: { symbol: 'USDC', address: '0x...', decimals: 6 },
        apy: 22.0,
        totalStaked: 1500000,
        lockPeriod: 45,
        minStake: 300,
        maxStake: 3000000,
        isActive: true,
        description: 'Advanced yield farming strategy with multiple reward tokens.',
        features: ['Multiple rewards', 'Auto-compound', 'Strategy optimization', 'Risk management']
      }
    ];

    const mockPositions: UserPosition[] = [
      {
        poolId: '1',
        amount: 5000,
        rewards: 125.5,
        stakedAt: '2024-01-01',
        unlockTime: '2024-01-31',
        isActive: true
      },
      {
        poolId: '2',
        amount: 10000,
        rewards: 450.0,
        stakedAt: '2023-12-01',
        unlockTime: '2024-03-01',
        isActive: true
      }
    ];

    setPools(mockPools);
    setUserPositions(mockPositions);
  }, []);

  const getPoolTypeColor = (type: string) => {
    switch (type) {
      case 'standard': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'governance': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'social': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'liquidity': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'yield': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPoolTypeIcon = (type: string) => {
    switch (type) {
      case 'standard': return LockClosedIcon;
      case 'governance': return ShieldCheckIcon;
      case 'social': return SparklesIcon;
      case 'liquidity': return ChartBarIcon;
      case 'yield': return ArrowTrendingUpIcon;
      default: return LockClosedIcon;
    }
  };

  const handleStake = (poolId: string) => {
    setSelectedPool(poolId);
    setShowStakeModal(true);
  };

  const handleStakeSubmit = () => {
    // Handle stake transaction
    console.log('Staking', stakeAmount, 'in pool', selectedPool);
    setShowStakeModal(false);
    setStakeAmount('');
    setSelectedPool(null);
  };

  const totalStaked = userPositions.reduce((sum, pos) => sum + pos.amount, 0);
  const totalRewards = userPositions.reduce((sum, pos) => sum + pos.rewards, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            DeFi Staking & Yield Farming
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Earn rewards by staking your CLP tokens and participating in various DeFi strategies
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Staked</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalStaked.toLocaleString()} CLP
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <ArrowTrendingUpIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Rewards</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalRewards.toLocaleString()} CLP
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Pools</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {pools.filter(p => p.isActive).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. APY</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {pools.reduce((sum, pool) => sum + pool.apy, 0) / pools.length}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('pools')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pools'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Staking Pools
              </button>
              <button
                onClick={() => setActiveTab('positions')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'positions'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                My Positions
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'pools' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {pools.map((pool) => {
              const Icon = getPoolTypeIcon(pool.type);
              return (
                <div
                  key={pool.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {/* Pool Header */}
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <Icon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {pool.name}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPoolTypeColor(pool.type)}`}>
                            {pool.type}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {pool.apy}%
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">APY</p>
                      </div>
                    </div>
                  </div>

                  {/* Pool Details */}
                  <div className="p-6">
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                      {pool.description}
                    </p>

                    {/* Pool Stats */}
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Total Staked</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {pool.totalStaked.toLocaleString()} {pool.stakingToken.symbol}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Lock Period</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {pool.lockPeriod} days
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Min Stake</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {pool.minStake} {pool.stakingToken.symbol}
                        </span>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Features</h4>
                      <div className="flex flex-wrap gap-1">
                        {pool.features.map((feature, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleStake(pool.id)}
                      disabled={!isConnected || !pool.isActive}
                      className="w-full bg-gradient-to-r from-primary-500 to-accent-500 text-white py-2 px-4 rounded-lg hover:from-primary-600 hover:to-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                    >
                      {!isConnected ? 'Connect Wallet' : pool.isActive ? 'Stake Now' : 'Pool Inactive'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">
            {userPositions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LockClosedIcon className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No staking positions
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Start staking to earn rewards and participate in DeFi
                </p>
                <button
                  onClick={() => setActiveTab('pools')}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200"
                >
                  Explore Pools
                </button>
              </div>
            ) : (
              userPositions.map((position) => {
                const pool = pools.find(p => p.id === position.poolId);
                if (!pool) return null;

                const Icon = getPoolTypeIcon(pool.type);
                const isUnlocked = new Date(position.unlockTime) <= new Date();

                return (
                  <div
                    key={position.poolId}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <Icon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {pool.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Staked: {position.amount.toLocaleString()} {pool.stakingToken.symbol}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          {position.rewards.toLocaleString()} {pool.rewardToken.symbol}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Pending Rewards</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Staked:</span>
                          <span className="ml-1 font-medium text-gray-900 dark:text-white">
                            {new Date(position.stakedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Unlocks:</span>
                          <span className={`ml-1 font-medium ${isUnlocked ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                            {new Date(position.unlockTime).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-sm rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors duration-200">
                          Claim Rewards
                        </button>
                        {isUnlocked && (
                          <button className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-sm rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors duration-200">
                            Unstake
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Stake Modal */}
        {showStakeModal && selectedPool && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Stake in Pool
                </h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount to Stake
                  </label>
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowStakeModal(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStakeSubmit}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200"
                  >
                    Stake
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Staking;