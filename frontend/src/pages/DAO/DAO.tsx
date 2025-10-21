import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import {
  ShieldCheckIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  FireIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline';

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: 'active' | 'passed' | 'failed' | 'executed' | 'cancelled';
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  quorum: number;
  startTime: string;
  endTime: string;
  executionTime?: string;
  category: 'governance' | 'treasury' | 'technical' | 'social' | 'marketing';
  tags: string[];
  discussionUrl?: string;
  executionData?: string;
}

interface DAOStats {
  totalProposals: number;
  activeProposals: number;
  totalVoters: number;
  treasuryBalance: number;
  quorumThreshold: number;
  votingPower: number;
  delegatedVotes: number;
  participationRate: number;
}

const DAO: React.FC = () => {
  const { isConnected, address } = useAccount();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [stats, setStats] = useState<DAOStats | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showCreateProposal, setShowCreateProposal] = useState(false);

  // Mock data
  useEffect(() => {
    const mockProposals: Proposal[] = [
      {
        id: '1',
        title: 'Implement New Staking Rewards Structure',
        description: 'Proposal to increase staking rewards from 10% to 15% APY and introduce tiered rewards based on stake duration.',
        proposer: '0x1234...5678',
        status: 'active',
        votesFor: 1250,
        votesAgainst: 320,
        totalVotes: 1570,
        quorum: 2000,
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-22T10:00:00Z',
        category: 'governance',
        tags: ['staking', 'rewards', 'defi'],
        discussionUrl: 'https://forum.gigchain.io/proposal/1',
      },
      {
        id: '2',
        title: 'Allocate 100,000 GCH for Marketing Campaign',
        description: 'Use treasury funds to launch a comprehensive marketing campaign targeting Web3 professionals.',
        proposer: '0x2345...6789',
        status: 'passed',
        votesFor: 2100,
        votesAgainst: 450,
        totalVotes: 2550,
        quorum: 2000,
        startTime: '2024-01-10T10:00:00Z',
        endTime: '2024-01-17T10:00:00Z',
        executionTime: '2024-01-18T10:00:00Z',
        category: 'treasury',
        tags: ['marketing', 'treasury', 'growth'],
        discussionUrl: 'https://forum.gigchain.io/proposal/2',
      },
      {
        id: '3',
        title: 'Upgrade Smart Contract Security Features',
        description: 'Implement additional security measures and audit recommendations for core contracts.',
        proposer: '0x3456...7890',
        status: 'failed',
        votesFor: 800,
        votesAgainst: 1200,
        totalVotes: 2000,
        quorum: 2000,
        startTime: '2024-01-05T10:00:00Z',
        endTime: '2024-01-12T10:00:00Z',
        category: 'technical',
        tags: ['security', 'upgrade', 'audit'],
        discussionUrl: 'https://forum.gigchain.io/proposal/3',
      },
    ];

    const mockStats: DAOStats = {
      totalProposals: 24,
      activeProposals: 3,
      totalVoters: 1250,
      treasuryBalance: 2500000,
      quorumThreshold: 2000,
      votingPower: 5000,
      delegatedVotes: 0,
      participationRate: 68.5,
    };

    setProposals(mockProposals);
    setStats(mockStats);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'passed': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'failed': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'executed': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      case 'cancelled': return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return ClockIcon;
      case 'passed': return CheckCircleIcon;
      case 'failed': return XCircleIcon;
      case 'executed': return TrophyIcon;
      case 'cancelled': return ExclamationTriangleIcon;
      default: return ClockIcon;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'governance': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'treasury': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'technical': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      case 'social': return 'text-pink-600 bg-pink-100 dark:bg-pink-900/20';
      case 'marketing': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const filteredProposals = proposals.filter(proposal => {
    if (activeTab === 'all') return true;
    return proposal.status === activeTab;
  });

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ShieldCheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Connect your wallet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please connect your wallet to participate in DAO governance
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                DAO Governance
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Participate in decentralized governance and shape the future of GigChain
              </p>
            </div>
            <button
              onClick={() => setShowCreateProposal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Proposal
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <ShieldCheckIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Proposals</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalProposals}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <ClockIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Proposals</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeProposals}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <UserGroupIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Voters</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalVoters.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <CurrencyDollarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Treasury Balance</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.treasuryBalance.toLocaleString()} GCH</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'all', name: 'All Proposals', count: proposals.length },
                { id: 'active', name: 'Active', count: proposals.filter(p => p.status === 'active').length },
                { id: 'passed', name: 'Passed', count: proposals.filter(p => p.status === 'passed').length },
                { id: 'failed', name: 'Failed', count: proposals.filter(p => p.status === 'failed').length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {tab.name}
                  <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Proposals */}
        <div className="space-y-6">
          {filteredProposals.map((proposal) => {
            const StatusIcon = getStatusIcon(proposal.status);
            const progress = (proposal.totalVotes / proposal.quorum) * 100;
            const forPercentage = proposal.totalVotes > 0 ? (proposal.votesFor / proposal.totalVotes) * 100 : 0;
            
            return (
              <div
                key={proposal.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {proposal.title}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(proposal.status)}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {proposal.status}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(proposal.category)}`}>
                        {proposal.category}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {proposal.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {proposal.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 dark:bg-blue-900/20 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <ChatBubbleLeftIcon className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <ShareIcon className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <BookmarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Voting Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Voting Progress
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {proposal.totalVotes.toLocaleString()} / {proposal.quorum.toLocaleString()} votes
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {progress.toFixed(1)}% of quorum
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {forPercentage.toFixed(1)}% for
                    </span>
                  </div>
                </div>

                {/* Vote Breakdown */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {proposal.votesFor.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Votes For</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {proposal.votesAgainst.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Votes Against</div>
                  </div>
                </div>

                {/* Proposal Info */}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-4">
                    <span>Proposed by {proposal.proposer}</span>
                    <span>•</span>
                    <span>Ends {new Date(proposal.endTime).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {proposal.status === 'active' && (
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                        Vote
                      </button>
                    )}
                    {proposal.status === 'passed' && !proposal.executionTime && (
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200">
                        Execute
                      </button>
                    )}
                    <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredProposals.length === 0 && (
          <div className="text-center py-12">
            <ShieldCheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No proposals found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {activeTab === 'all' 
                ? 'No proposals have been created yet'
                : `No ${activeTab} proposals found`
              }
            </p>
            <button
              onClick={() => setShowCreateProposal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Create First Proposal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DAO;