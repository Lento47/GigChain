import React, { useState } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  FireIcon,
  TrophyIcon,
  CalendarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  GlobeAltIcon,
  SparklesIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline';
import SkillsMetrics from '../../components/SkillsMetrics/SkillsMetrics';

interface AnalyticsData {
  overview: {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalViews: number;
    clpEarned: number;
    connections: number;
    followers: number;
    following: number;
  };
  engagement: {
    daily: { date: string; likes: number; comments: number; shares: number }[];
    weekly: { week: string; engagement: number }[];
    monthly: { month: string; posts: number; engagement: number }[];
  };
  topPosts: {
    id: string;
    content: string;
    likes: number;
    comments: number;
    shares: number;
    views: number;
    clpEarned: number;
    timestamp: string;
  }[];
  audience: {
    demographics: {
      ageGroups: { range: string; percentage: number }[];
      locations: { country: string; percentage: number }[];
      professions: { profession: string; percentage: number }[];
    };
    growth: {
      followers: { date: string; count: number }[];
      connections: { date: string; count: number }[];
    };
  };
  skills: {
    name: string;
    endorsements: number;
    trend: 'up' | 'down' | 'stable';
    change: number;
  }[];
  achievements: {
    name: string;
    description: string;
    earnedAt: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    impact: number;
  }[];
}

const Analytics: React.FC = () => {
  const activeAccount = useActiveAccount();
  const isConnected = !!activeAccount;
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data
  const analyticsData: AnalyticsData = {
    overview: {
      totalPosts: 89,
      totalLikes: 1247,
      totalComments: 234,
      totalShares: 156,
      totalViews: 8945,
      clpEarned: 15420,
      connections: 892,
      followers: 2156,
      following: 456,
    },
    engagement: {
      daily: [
        { date: '2024-01-01', likes: 45, comments: 12, shares: 8 },
        { date: '2024-01-02', likes: 67, comments: 18, shares: 12 },
        { date: '2024-01-03', likes: 89, comments: 23, shares: 15 },
        { date: '2024-01-04', likes: 56, comments: 14, shares: 9 },
        { date: '2024-01-05', likes: 78, comments: 19, shares: 11 },
        { date: '2024-01-06', likes: 92, comments: 25, shares: 16 },
        { date: '2024-01-07', likes: 84, comments: 21, shares: 13 },
      ],
      weekly: [
        { week: 'Week 1', engagement: 85 },
        { week: 'Week 2', engagement: 92 },
        { week: 'Week 3', engagement: 78 },
        { week: 'Week 4', engagement: 96 },
      ],
      monthly: [
        { month: 'Jan', posts: 23, engagement: 89 },
        { month: 'Feb', posts: 28, engagement: 94 },
        { month: 'Mar', posts: 31, engagement: 87 },
        { month: 'Apr', posts: 26, engagement: 92 },
      ],
    },
    topPosts: [
      {
        id: '1',
        content: 'Just deployed my first DeFi protocol on Polygon! 🚀',
        likes: 127,
        comments: 23,
        shares: 8,
        views: 1245,
        clpEarned: 45,
        timestamp: '2h ago',
      },
      {
        id: '2',
        content: 'Excited to announce that our DAO proposal passed!',
        likes: 89,
        comments: 15,
        shares: 12,
        views: 892,
        clpEarned: 67,
        timestamp: '1d ago',
      },
      {
        id: '3',
        content: 'Teaching a workshop on smart contract security next week.',
        likes: 45,
        comments: 8,
        shares: 5,
        views: 567,
        clpEarned: 23,
        timestamp: '3d ago',
      },
    ],
    audience: {
      demographics: {
        ageGroups: [
          { range: '18-24', percentage: 15 },
          { range: '25-34', percentage: 45 },
          { range: '35-44', percentage: 25 },
          { range: '45-54', percentage: 12 },
          { range: '55+', percentage: 3 },
        ],
        locations: [
          { country: 'United States', percentage: 35 },
          { country: 'United Kingdom', percentage: 18 },
          { country: 'Germany', percentage: 12 },
          { country: 'Canada', percentage: 10 },
          { country: 'Australia', percentage: 8 },
          { country: 'Other', percentage: 17 },
        ],
        professions: [
          { profession: 'Software Developer', percentage: 40 },
          { profession: 'Product Manager', percentage: 15 },
          { profession: 'Designer', percentage: 12 },
          { profession: 'Entrepreneur', percentage: 10 },
          { profession: 'Consultant', percentage: 8 },
          { profession: 'Other', percentage: 15 },
        ],
      },
      growth: {
        followers: [
          { date: '2024-01-01', count: 1800 },
          { date: '2024-01-02', count: 1825 },
          { date: '2024-01-03', count: 1850 },
          { date: '2024-01-04', count: 1875 },
          { date: '2024-01-05', count: 1900 },
          { date: '2024-01-06', count: 1925 },
          { date: '2024-01-07', count: 1950 },
        ],
        connections: [
          { date: '2024-01-01', count: 800 },
          { date: '2024-01-02', count: 815 },
          { date: '2024-01-03', count: 830 },
          { date: '2024-01-04', count: 845 },
          { date: '2024-01-05', count: 860 },
          { date: '2024-01-06', count: 875 },
          { date: '2024-01-07', count: 892 },
        ],
      },
    },
    skills: [
      { name: 'Solidity', endorsements: 45, trend: 'up', change: 12 },
      { name: 'Web3', endorsements: 38, trend: 'up', change: 8 },
      { name: 'DeFi', endorsements: 32, trend: 'up', change: 15 },
      { name: 'React', endorsements: 28, trend: 'stable', change: 2 },
      { name: 'TypeScript', endorsements: 25, trend: 'up', change: 5 },
      { name: 'Node.js', endorsements: 22, trend: 'down', change: -3 },
    ],
    achievements: [
      {
        name: 'DeFi Pioneer',
        description: 'Successfully deployed 10+ DeFi protocols',
        earnedAt: '2024-01-15',
        rarity: 'legendary',
        impact: 95,
      },
      {
        name: 'Security Expert',
        description: 'Completed 50+ smart contract audits',
        earnedAt: '2024-01-10',
        rarity: 'epic',
        impact: 87,
      },
      {
        name: 'Community Leader',
        description: 'Helped 100+ developers enter Web3',
        earnedAt: '2024-01-05',
        rarity: 'rare',
        impact: 78,
      },
    ],
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Connect your wallet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please connect your wallet to view analytics
          </p>
        </div>
      </div>
    );
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <ArrowUpIcon className="h-4 w-4 text-green-500" />;
      case 'down': return <ArrowDownIcon className="h-4 w-4 text-red-500" />;
      default: return <div className="h-4 w-4 bg-gray-400 rounded-full"></div>;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
      case 'rare': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'epic': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      case 'legendary': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Analytics Dashboard
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Track your professional growth and engagement metrics
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview', icon: ChartBarIcon },
                { id: 'engagement', name: 'Engagement', icon: ArrowTrendingUpIcon },
                { id: 'audience', name: 'Audience', icon: UserGroupIcon },
                { id: 'content', name: 'Content', icon: GlobeAltIcon },
                { id: 'skills', name: 'Skills', icon: SparklesIcon },
                { id: 'achievements', name: 'Achievements', icon: TrophyIcon },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <EyeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Views</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analyticsData.overview.totalViews.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <HeartIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Likes</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analyticsData.overview.totalLikes.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <ChatBubbleLeftIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Comments</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analyticsData.overview.totalComments.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                    <CurrencyDollarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">GCH Earned</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analyticsData.overview.clpEarned.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Network Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Connections</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analyticsData.overview.connections.toLocaleString()}
                    </p>
                  </div>
                  <UserGroupIcon className="h-8 w-8 text-gray-400" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Followers</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analyticsData.overview.followers.toLocaleString()}
                    </p>
                  </div>
                  <UserGroupIcon className="h-8 w-8 text-gray-400" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Following</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analyticsData.overview.following.toLocaleString()}
                    </p>
                  </div>
                  <UserGroupIcon className="h-8 w-8 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-6">
            <SkillsMetrics />
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Achievements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {analyticsData.achievements.map((achievement, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {achievement.name}
                      </h4>
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getRarityColor(achievement.rarity)}`}>
                        {achievement.rarity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {achievement.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Earned {new Date(achievement.earnedAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center space-x-1">
                        <TrophyIcon className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {achievement.impact}% impact
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Other tabs would be implemented similarly */}
      </div>
    </div>
  );
};

export default Analytics;