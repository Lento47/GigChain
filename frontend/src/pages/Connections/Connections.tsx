import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  ChatBubbleLeftIcon,
  HeartIcon,
  ShareIcon,
  GlobeAltIcon,
  MapPinIcon,
  CalendarIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  SparklesIcon,
  TrophyIcon,
  CurrencyDollarIcon,
  StarIcon,
  FireIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  UserPlusIcon,
  UserMinusIcon,
  EllipsisHorizontalIcon,
  EyeIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarIconSolid,
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid,
} from '@heroicons/react/24/solid';

interface Connection {
  id: string;
  name: string;
  username: string;
  title: string;
  avatar: string;
  coverImage: string;
  location: string;
  verified: boolean;
  level: 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Principal' | 'Expert';
  reputation: number;
  skills: string[];
  mutualConnections: number;
  connectionType: 'colleague' | 'mentor' | 'mentee' | 'collaborator' | 'friend';
  connectedAt: string;
  lastActive: string;
  isOnline: boolean;
  isFollowing: boolean;
  isBookmarked: boolean;
  bio: string;
  stats: {
    posts: number;
    connections: number;
    followers: number;
    clpEarned: number;
  };
  recentActivity: {
    type: 'post' | 'achievement' | 'job' | 'event';
    content: string;
    timestamp: string;
  }[];
  commonInterests: string[];
  recommendations: {
    from: string;
    message: string;
    rating: number;
  }[];
}

const Connections: React.FC = () => {
  const { isConnected } = useAccount();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [filteredConnections, setFilteredConnections] = useState<Connection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockConnections: Connection[] = [
      {
        id: '1',
        name: 'Sarah Kim',
        username: '@sarahkim',
        title: 'Senior Blockchain Developer',
        avatar: '/avatars/sarah.jpg',
        coverImage: '/covers/sarah-cover.jpg',
        location: 'New York, NY',
        verified: true,
        level: 'Senior',
        reputation: 98,
        skills: ['Solidity', 'Web3', 'DeFi', 'React', 'TypeScript'],
        mutualConnections: 12,
        connectionType: 'colleague',
        connectedAt: '2024-01-15',
        lastActive: '2h ago',
        isOnline: true,
        isFollowing: true,
        isBookmarked: false,
        bio: 'Passionate about building the future of finance through decentralized technologies.',
        stats: {
          posts: 156,
          connections: 892,
          followers: 1247,
          clpEarned: 23450,
        },
        recentActivity: [
          { type: 'post', content: 'Just deployed a new DeFi protocol', timestamp: '2h ago' },
          { type: 'achievement', content: 'Earned "Security Expert" badge', timestamp: '1d ago' },
        ],
        commonInterests: ['DeFi', 'Smart Contracts', 'Web3'],
        recommendations: [
          { from: 'Mike Johnson', message: 'Excellent developer with deep blockchain knowledge', rating: 5 },
        ],
      },
      {
        id: '2',
        name: 'Mike Johnson',
        username: '@mikejohnson',
        title: 'Product Manager at Web3 Startup',
        avatar: '/avatars/mike.jpg',
        coverImage: '/covers/mike-cover.jpg',
        location: 'San Francisco, CA',
        verified: false,
        level: 'Mid',
        reputation: 87,
        skills: ['Product Management', 'Web3', 'Agile', 'User Research'],
        mutualConnections: 8,
        connectionType: 'collaborator',
        connectedAt: '2024-01-10',
        lastActive: '5h ago',
        isOnline: false,
        isFollowing: false,
        isBookmarked: true,
        bio: 'Building products that bridge the gap between traditional finance and DeFi.',
        stats: {
          posts: 89,
          connections: 456,
          followers: 678,
          clpEarned: 12340,
        },
        recentActivity: [
          { type: 'job', content: 'Posted a new job opening', timestamp: '1d ago' },
          { type: 'post', content: 'Shared insights on Web3 UX', timestamp: '3d ago' },
        ],
        commonInterests: ['Web3', 'Product Management', 'UX'],
        recommendations: [],
      },
      {
        id: '3',
        name: 'Emily Chen',
        username: '@emilychen',
        title: 'Blockchain Security Researcher',
        avatar: '/avatars/emily.jpg',
        coverImage: '/covers/emily-cover.jpg',
        location: 'London, UK',
        verified: true,
        level: 'Expert',
        reputation: 99,
        skills: ['Security', 'Auditing', 'Solidity', 'Cryptography', 'Research'],
        mutualConnections: 15,
        connectionType: 'mentor',
        connectedAt: '2023-12-20',
        lastActive: '1h ago',
        isOnline: true,
        isFollowing: true,
        isBookmarked: true,
        bio: 'Security researcher focused on smart contract vulnerabilities and DeFi protocols.',
        stats: {
          posts: 234,
          connections: 1456,
          followers: 2890,
          clpEarned: 45670,
        },
        recentActivity: [
          { type: 'achievement', content: 'Published research paper on DeFi security', timestamp: '1h ago' },
          { type: 'post', content: 'Shared security best practices', timestamp: '2d ago' },
        ],
        commonInterests: ['Security', 'Research', 'DeFi'],
        recommendations: [
          { from: 'Alex Chen', message: 'Outstanding security researcher and mentor', rating: 5 },
          { from: 'David Lee', message: 'Helped me understand complex security concepts', rating: 5 },
        ],
      },
    ];

    setConnections(mockConnections);
    setFilteredConnections(mockConnections);
  }, []);

  // Filter and search connections
  useEffect(() => {
    let filtered = connections;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(connection =>
        connection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        connection.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        connection.skills.some(skill =>
          skill.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Category filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(connection => connection.connectionType === selectedFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (selectedSort) {
        case 'recent':
          return new Date(b.connectedAt).getTime() - new Date(a.connectedAt).getTime();
        case 'reputation':
          return b.reputation - a.reputation;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'mutual':
          return b.mutualConnections - a.mutualConnections;
        default:
          return 0;
      }
    });

    setFilteredConnections(filtered);
  }, [connections, searchQuery, selectedFilter, selectedSort]);

  const handleFollow = (connectionId: string) => {
    setConnections(connections.map(conn =>
      conn.id === connectionId
        ? { ...conn, isFollowing: !conn.isFollowing }
        : conn
    ));
  };

  const handleBookmark = (connectionId: string) => {
    setConnections(connections.map(conn =>
      conn.id === connectionId
        ? { ...conn, isBookmarked: !conn.isBookmarked }
        : conn
    ));
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

  const getConnectionTypeIcon = (type: string) => {
    switch (type) {
      case 'colleague': return BriefcaseIcon;
      case 'mentor': return AcademicCapIcon;
      case 'mentee': return UserPlusIcon;
      case 'collaborator': return UserGroupIcon;
      case 'friend': return HeartIcon;
      default: return UserGroupIcon;
    }
  };

  const filters = [
    { id: 'all', name: 'All Connections', count: connections.length },
    { id: 'colleague', name: 'Colleagues', count: connections.filter(c => c.connectionType === 'colleague').length },
    { id: 'mentor', name: 'Mentors', count: connections.filter(c => c.connectionType === 'mentor').length },
    { id: 'mentee', name: 'Mentees', count: connections.filter(c => c.connectionType === 'mentee').length },
    { id: 'collaborator', name: 'Collaborators', count: connections.filter(c => c.connectionType === 'collaborator').length },
    { id: 'friend', name: 'Friends', count: connections.filter(c => c.connectionType === 'friend').length },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Professional Connections
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Manage your professional network and discover new opportunities
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 gap-1 w-4 h-4">
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                  </div>
                ) : (
                  <div className="space-y-1 w-4 h-4">
                    <div className="bg-current rounded-sm h-1"></div>
                    <div className="bg-current rounded-sm h-1"></div>
                    <div className="bg-current rounded-sm h-1"></div>
                  </div>
                )}
              </button>
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                <PlusIcon className="h-4 w-4 mr-2" />
                Find People
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search connections, skills, or companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="lg:w-48">
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="recent">Recently Connected</option>
                <option value="reputation">Highest Reputation</option>
                <option value="name">Name A-Z</option>
                <option value="mutual">Most Mutual</option>
              </select>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      selectedFilter === filter.id
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {filter.name}
                    <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                      {filter.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Connections Grid/List */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredConnections.map((connection) => {
            const ConnectionTypeIcon = getConnectionTypeIcon(connection.connectionType);
            
            return (
              <div
                key={connection.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200 ${
                  viewMode === 'list' ? 'flex' : ''
                }`}
              >
                {/* Cover Image */}
                <div className={`relative h-32 bg-gradient-to-r from-blue-500 to-purple-600 ${
                  viewMode === 'list' ? 'w-48 flex-shrink-0' : 'w-full'
                }`}>
                  <img
                    src={connection.coverImage}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="flex items-end justify-between">
                      <div className="w-12 h-12 bg-white rounded-full border-2 border-white shadow-lg">
                        <img
                          src={connection.avatar}
                          alt={connection.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                      <div className="flex items-center space-x-1">
                        {connection.isOnline && (
                          <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                        <span className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded-full">
                          {connection.lastActive}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {connection.name}
                        </h3>
                        {connection.verified && (
                          <CheckBadgeIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {connection.title}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(connection.level)}`}>
                          {connection.level}
                        </span>
                        <div className="flex items-center space-x-1">
                          <StarIconSolid className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {connection.reputation}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                          <MapPinIcon className="h-3 w-3" />
                          <span>{connection.location}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleFollow(connection.id)}
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                          connection.isFollowing
                            ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {connection.isFollowing ? (
                          <UserMinusIcon className="h-4 w-4" />
                        ) : (
                          <UserPlusIcon className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleBookmark(connection.id)}
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                          connection.isBookmarked
                            ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {connection.isBookmarked ? (
                          <BookmarkIconSolid className="h-4 w-4" />
                        ) : (
                          <BookmarkIcon className="h-4 w-4" />
                        )}
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
                        <EllipsisHorizontalIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {connection.bio}
                  </p>

                  {/* Skills */}
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {connection.skills.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {connection.skills.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                          +{connection.skills.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {connection.stats.posts}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {connection.stats.connections}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Connections</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {connection.stats.clpEarned.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">GCH</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200">
                        <ChatBubbleLeftIcon className="h-4 w-4 mr-1" />
                        Message
                      </button>
                      <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                      <ConnectionTypeIcon className="h-3 w-3" />
                      <span className="capitalize">{connection.connectionType}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredConnections.length === 0 && (
          <div className="text-center py-12">
            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No connections found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Try adjusting your search criteria or filters
            </p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
              Find People
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Connections;