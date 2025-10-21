import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import {
  UserCircleIcon,
  PencilIcon,
  ShareIcon,
  BookmarkIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  StarIcon,
  FireIcon,
  GlobeAltIcon,
  MapPinIcon,
  CalendarIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  SparklesIcon,
  ShieldCheckIcon,
  EyeIcon,
  PlusIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  TagIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid,
  StarIcon as StarIconSolid,
} from '@heroicons/react/24/solid';

interface Profile {
  id: string;
  name: string;
  username: string;
  title: string;
  bio: string;
  location: string;
  website: string;
  email: string;
  avatar: string;
  coverImage: string;
  verified: boolean;
  level: 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Principal' | 'Expert';
  reputation: number;
  experience: number;
  hourlyRate: number;
  totalEarned: number;
  skills: string[];
  socialLinks: {
    platform: string;
    url: string;
    verified: boolean;
  }[];
  stats: {
    posts: number;
    connections: number;
    followers: number;
    following: number;
    clpEarned: number;
    clpStaked: number;
    nftCount: number;
  };
  achievements: {
    id: string;
    title: string;
    description: string;
    icon: string;
    earnedAt: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  }[];
  recentPosts: {
    id: string;
    content: string;
    timestamp: string;
    likes: number;
    comments: number;
    shares: number;
    clpEarned: number;
  }[];
  isFollowing: boolean;
  isConnected: boolean;
}

const Profile: React.FC = () => {
  const { isConnected, address } = useAccount();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [showEditModal, setShowEditModal] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockProfile: Profile = {
      id: '1',
      name: 'Alex Chen',
      username: '@alexchen',
      title: 'Senior Blockchain Developer & DeFi Architect',
      bio: 'Passionate about building the future of finance through decentralized technologies. 5+ years experience in smart contract development, DeFi protocols, and Web3 applications. Always learning, always building.',
      location: 'San Francisco, CA',
      website: 'https://alexchen.dev',
      email: 'alex@chainlinkpro.io',
      avatar: '/avatars/alex.jpg',
      coverImage: '/covers/alex-cover.jpg',
      verified: true,
      level: 'Senior',
      reputation: 95,
      experience: 5,
      hourlyRate: 150,
      totalEarned: 125000,
      skills: [
        'Solidity', 'Web3', 'DeFi', 'Smart Contracts', 'React', 'TypeScript',
        'Node.js', 'Ethereum', 'Polygon', 'IPFS', 'Hardhat', 'Truffle'
      ],
      socialLinks: [
        { platform: 'Twitter', url: 'https://twitter.com/alexchen', verified: true },
        { platform: 'GitHub', url: 'https://github.com/alexchen', verified: true },
        { platform: 'LinkedIn', url: 'https://linkedin.com/in/alexchen', verified: true },
        { platform: 'Portfolio', url: 'https://alexchen.dev', verified: true },
      ],
      stats: {
        posts: 89,
        connections: 1247,
        followers: 2156,
        following: 892,
        clpEarned: 15420,
        clpStaked: 5000,
        nftCount: 12,
      },
      achievements: [
        {
          id: '1',
          title: 'DeFi Pioneer',
          description: 'Successfully deployed 10+ DeFi protocols',
          icon: '🏆',
          earnedAt: '2024-01-15',
          rarity: 'legendary',
        },
        {
          id: '2',
          title: 'Security Expert',
          description: 'Completed 50+ smart contract audits',
          icon: '🛡️',
          earnedAt: '2024-01-10',
          rarity: 'epic',
        },
        {
          id: '3',
          title: 'Community Leader',
          description: 'Helped 100+ developers enter Web3',
          icon: '👥',
          earnedAt: '2024-01-05',
          rarity: 'rare',
        },
      ],
      recentPosts: [
        {
          id: '1',
          content: 'Just deployed my latest DeFi protocol on Polygon! The gas fees are incredibly low and the user experience is amazing.',
          timestamp: '2h ago',
          likes: 127,
          comments: 23,
          shares: 8,
          clpEarned: 45,
        },
        {
          id: '2',
          content: 'Excited to announce that our DAO proposal passed! We\'re now implementing the new governance structure.',
          timestamp: '1d ago',
          likes: 89,
          comments: 15,
          shares: 12,
          clpEarned: 67,
        },
        {
          id: '3',
          content: 'Teaching a workshop on smart contract security next week. DM me if you\'re interested in joining!',
          timestamp: '3d ago',
          likes: 45,
          comments: 8,
          shares: 5,
          clpEarned: 23,
        },
      ],
      isFollowing: false,
      isConnected: false,
    };

    setProfile(mockProfile);
    setIsFollowing(mockProfile.isFollowing);
    setIsConnected(mockProfile.isConnected);
  }, []);

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    // Update profile stats
    if (profile) {
      setProfile({
        ...profile,
        stats: {
          ...profile.stats,
          followers: isFollowing ? profile.stats.followers - 1 : profile.stats.followers + 1,
        },
      });
    }
  };

  const handleConnect = () => {
    setIsConnected(!isConnected);
    // Update profile stats
    if (profile) {
      setProfile({
        ...profile,
        stats: {
          ...profile.stats,
          connections: isConnected ? profile.stats.connections - 1 : profile.stats.connections + 1,
        },
      });
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Junior': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'Mid': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'Senior': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      case 'Lead': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'Principal': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'Expert': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cover Image */}
        <div className="relative h-64 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl overflow-hidden">
          <img
            src={profile.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-end justify-between">
              <div className="flex items-end space-x-4">
                <div className="w-24 h-24 bg-white rounded-full border-4 border-white shadow-lg">
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div className="text-white">
                  <h1 className="text-2xl font-bold">{profile.name}</h1>
                  <p className="text-lg opacity-90">{profile.title}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-sm opacity-75">{profile.username}</span>
                    {profile.verified && (
                      <CheckBadgeIcon className="h-5 w-5 text-blue-400" />
                    )}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors duration-200">
                  <ShareIcon className="h-4 w-4 mr-2 inline" />
                  Share
                </button>
                <button className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors duration-200">
                  <BookmarkIcon className="h-4 w-4 mr-2 inline" />
                  Save
                </button>
                {isConnected && (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors duration-200"
                  >
                    <PencilIcon className="h-4 w-4 mr-2 inline" />
                    Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 -mt-12 relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${getLevelColor(profile.level)}`}>
                  {profile.level}
                </span>
                <div className="flex items-center space-x-1">
                  <StarIconSolid className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {profile.reputation} reputation
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                  <MapPinIcon className="h-4 w-4" />
                  <span>{profile.location}</span>
                </div>
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {profile.bio}
              </p>

              {/* Skills */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 dark:bg-blue-900/20 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Social Links */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Social Links
                </h3>
                <div className="flex space-x-4">
                  {profile.socialLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                    >
                      <span>{link.platform}</span>
                      {link.verified && (
                        <CheckBadgeIcon className="h-3 w-3 text-blue-500" />
                      )}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={handleFollow}
                className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  isFollowing
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              <button
                onClick={handleConnect}
                className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  isConnected
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isConnected ? 'Connected' : 'Connect'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {profile.stats.posts}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Posts</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {profile.stats.connections}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Connections</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {profile.stats.followers}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Followers</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {profile.stats.clpEarned.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">CLP Earned</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'posts', name: 'Posts', count: profile.stats.posts },
                { id: 'achievements', name: 'Achievements', count: profile.achievements.length },
                { id: 'connections', name: 'Connections', count: profile.stats.connections },
                { id: 'activity', name: 'Activity', count: null },
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
                  {tab.count !== null && (
                    <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 py-0.5 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'posts' && (
            <div className="space-y-6">
              {profile.recentPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                >
                  <p className="text-gray-900 dark:text-white mb-4">{post.content}</p>
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>{post.timestamp}</span>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <HeartIcon className="h-4 w-4" />
                        <span>{post.likes}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ChatBubbleLeftIcon className="h-4 w-4" />
                        <span>{post.comments}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ShareIcon className="h-4 w-4" />
                        <span>{post.shares}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                        <CurrencyDollarIcon className="h-4 w-4" />
                        <span>{post.clpEarned} CLP</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profile.achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-start space-x-4">
                    <div className="text-4xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {achievement.title}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getRarityColor(achievement.rarity)}`}>
                          {achievement.rarity}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                        {achievement.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Earned on {new Date(achievement.earnedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'connections' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Professional Connections
              </h3>
              <div className="text-center py-12">
                <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Connection details will be displayed here
                </p>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Activity
              </h3>
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Activity timeline will be displayed here
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;