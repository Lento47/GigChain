import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  BookmarkIcon,
  EllipsisHorizontalIcon,
  PlusIcon,
  FireIcon,
  TrophyIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  UserGroupIcon,
  GlobeAltIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  LinkIcon,
  FaceSmileIcon,
  MapPinIcon,
  CalendarIcon,
  TagIcon,
  EyeIcon,
  RocketLaunchIcon,
  TrendingUpIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid,
} from '@heroicons/react/24/solid';

// Importar componentes de engagement
import EngagementBoost from '../../components/EngagementBoost/EngagementBoost';
import EngagementAnalytics from '../../components/EngagementAnalytics/EngagementAnalytics';

interface Post {
  id: string;
  author: {
    name: string;
    username: string;
    avatar: string;
    verified: boolean;
    level: string;
    reputation: number;
  };
  content: string;
  media?: {
    type: 'image' | 'video' | 'document';
    url: string;
    thumbnail?: string;
  };
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  views: number;
  clpEarned: number;
  tags: string[];
  type: 'post' | 'achievement' | 'job' | 'event' | 'poll' | 'skill';
  isLiked: boolean;
  isBookmarked: boolean;
  location?: string;
  eventDate?: string;
  pollOptions?: { option: string; votes: number; percentage: number }[];
  skillEndorsements?: { skill: string; endorsers: number }[];
  // Nuevos campos para engagement
  engagementRate?: number;
  tokensEarned?: number;
  activeBoosts?: number;
  isBoosted?: boolean;
}

const EnhancedFeed: React.FC = () => {
  const { isConnected } = useAccount();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedType, setSelectedType] = useState<'post' | 'job' | 'event' | 'poll' | 'skill'>('post');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);

  // Mock data con engagement
  useEffect(() => {
    const mockPosts: Post[] = [
      {
        id: '1',
        author: {
          name: 'Alex Chen',
          username: '@alexchen',
          avatar: '/avatars/alex.jpg',
          verified: true,
          level: 'Senior',
          reputation: 95,
        },
        content: 'Just deployed my first DeFi protocol on Polygon! 🚀 The gas fees are incredibly low and the user experience is amazing. Excited to see how the community responds to this new yield farming strategy.',
        media: {
          type: 'image',
          url: '/images/defi-protocol.jpg',
          thumbnail: '/images/defi-protocol-thumb.jpg',
        },
        timestamp: '2h ago',
        likes: 127,
        comments: 23,
        shares: 8,
        bookmarks: 15,
        views: 1250,
        clpEarned: 45,
        tags: ['DeFi', 'Polygon', 'Smart Contracts', 'Yield Farming'],
        type: 'post',
        isLiked: false,
        isBookmarked: false,
        engagementRate: 12.5,
        tokensEarned: 25.5,
        activeBoosts: 2,
        isBoosted: true
      },
      {
        id: '2',
        author: {
          name: 'Sarah Johnson',
          username: '@sarahj',
          avatar: '/avatars/sarah.jpg',
          verified: true,
          level: 'Expert',
          reputation: 98,
        },
        content: 'Looking for a React developer to help with a complex dashboard project. Must have experience with TypeScript, Redux, and D3.js. Budget: $5,000 - $8,000. Timeline: 4-6 weeks.',
        timestamp: '4h ago',
        likes: 45,
        comments: 12,
        shares: 3,
        bookmarks: 8,
        views: 320,
        clpEarned: 15,
        tags: ['React', 'TypeScript', 'Frontend', 'Dashboard'],
        type: 'job',
        isLiked: false,
        isBookmarked: false,
        engagementRate: 8.2,
        tokensEarned: 12.3,
        activeBoosts: 1,
        isBoosted: false
      },
      {
        id: '3',
        author: {
          name: 'Mike Rodriguez',
          username: '@miker',
          avatar: '/avatars/mike.jpg',
          verified: false,
          level: 'Intermediate',
          reputation: 78,
        },
        content: 'Just completed my 50th smart contract audit! 🎉 The security landscape is evolving so fast, but staying updated with the latest vulnerabilities and best practices is crucial.',
        timestamp: '6h ago',
        likes: 89,
        comments: 18,
        shares: 12,
        bookmarks: 22,
        views: 890,
        clpEarned: 35,
        tags: ['Security', 'Auditing', 'Smart Contracts', 'Achievement'],
        type: 'achievement',
        isLiked: true,
        isBookmarked: true,
        engagementRate: 15.8,
        tokensEarned: 42.1,
        activeBoosts: 0,
        isBoosted: false
      }
    ];
    
    setPosts(mockPosts);
    setTrendingPosts(mockPosts.filter(post => post.isBoosted || post.engagementRate > 10));
  }, []);

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'post': return DocumentTextIcon;
      case 'achievement': return TrophyIcon;
      case 'job': return CurrencyDollarIcon;
      case 'event': return CalendarIcon;
      case 'poll': return UserGroupIcon;
      case 'skill': return SparklesIcon;
      default: return DocumentTextIcon;
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'post': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'achievement': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'job': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'event': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      case 'poll': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'skill': return 'text-pink-600 bg-pink-100 dark:bg-pink-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
    }
  };

  const handleEngagement = async (postId: string, type: 'like' | 'bookmark' | 'view') => {
    try {
      const response = await fetch('/api/engagement/record', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          post_id: postId,
          engagement_type: type
        })
      });

      if (response.ok) {
        // Actualizar estado local
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            const updated = { ...post };
            if (type === 'like') {
              updated.isLiked = !updated.isLiked;
              updated.likes += updated.isLiked ? 1 : -1;
            } else if (type === 'bookmark') {
              updated.isBookmarked = !updated.isBookmarked;
              updated.bookmarks += updated.isBookmarked ? 1 : -1;
            } else if (type === 'view') {
              updated.views += 1;
            }
            return updated;
          }
          return post;
        }));
      }
    } catch (error) {
      console.error('Error recording engagement:', error);
    }
  };

  const handleBoostCreated = () => {
    // Actualizar posts después de crear boost
    setPosts(prev => prev.map(post => {
      if (post.id === selectedPostId) {
        return { ...post, isBoosted: true, activeBoosts: (post.activeBoosts || 0) + 1 };
      }
      return post;
    }));
  };

  const filters = [
    { id: 'all', name: 'Todos', icon: GlobeAltIcon },
    { id: 'trending', name: 'Trending', icon: FireIcon },
    { id: 'boosted', name: 'Boosted', icon: RocketLaunchIcon },
    { id: 'jobs', name: 'Jobs', icon: CurrencyDollarIcon },
    { id: 'achievements', name: 'Logros', icon: TrophyIcon },
    { id: 'skills', name: 'Habilidades', icon: SparklesIcon },
  ];

  const filteredPosts = posts.filter(post => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'trending') return post.engagementRate && post.engagementRate > 10;
    if (activeFilter === 'boosted') return post.isBoosted;
    if (activeFilter === 'jobs') return post.type === 'job';
    if (activeFilter === 'achievements') return post.type === 'achievement';
    if (activeFilter === 'skills') return post.type === 'skill';
    return true;
  });

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Conecta tu Wallet
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Necesitas conectar tu wallet para ver el feed
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Feed Profesional
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Descubre oportunidades y conecta con la comunidad
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAnalytics(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
              >
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Analytics
              </button>
              <button
                onClick={() => setShowCreatePost(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nueva Publicación
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => {
              const FilterIcon = filter.icon;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeFilter === filter.id
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <FilterIcon className="h-4 w-4 mr-2" />
                  {filter.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-6">
          {filteredPosts.map((post) => {
            const PostTypeIcon = getPostTypeIcon(post.type);
            return (
              <div
                key={post.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Post Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {post.author.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {post.author.name}
                          </h3>
                          {post.author.verified && (
                            <span className="text-blue-500">✓</span>
                          )}
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {post.author.username}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            •
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {post.timestamp}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {post.author.level}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            •
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {post.author.reputation} reputation
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Indicador de boost */}
                      {post.isBoosted && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                          <RocketLaunchIcon className="h-3 w-3 mr-1" />
                          Boosted
                        </span>
                      )}
                      
                      {/* Tipo de post */}
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPostTypeColor(post.type)}`}>
                        <PostTypeIcon className="h-3 w-3 mr-1" />
                        {post.type}
                      </span>
                      
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <EllipsisHorizontalIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <div className="px-6 pb-4">
                  <p className="text-gray-900 dark:text-white leading-relaxed">
                    {post.content}
                  </p>
                  
                  {/* Media */}
                  {post.media && (
                    <div className="mt-4">
                      {post.media.type === 'image' && (
                        <img
                          src={post.media.url}
                          alt="Post media"
                          className="w-full h-64 object-cover rounded-lg"
                        />
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {post.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Engagement Stats */}
                <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        {post.views.toLocaleString()} views
                      </span>
                      {post.engagementRate && (
                        <span className="flex items-center">
                          <TrendingUpIcon className="h-4 w-4 mr-1" />
                          {post.engagementRate.toFixed(1)}% engagement
                        </span>
                      )}
                      {post.tokensEarned && (
                        <span className="flex items-center text-green-600">
                          <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                          {post.tokensEarned.toFixed(1)} GigSoul
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {post.activeBoosts && post.activeBoosts > 0 && (
                        <span className="flex items-center text-purple-600">
                          <RocketLaunchIcon className="h-4 w-4 mr-1" />
                          {post.activeBoosts} boosts
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <button
                        onClick={() => handleEngagement(post.id, 'like')}
                        className={`flex items-center space-x-2 text-sm font-medium transition-colors ${
                          post.isLiked
                            ? 'text-red-600'
                            : 'text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500'
                        }`}
                      >
                        {post.isLiked ? (
                          <HeartIconSolid className="h-5 w-5" />
                        ) : (
                          <HeartIcon className="h-5 w-5" />
                        )}
                        <span>{post.likes}</span>
                      </button>

                      <button className="flex items-center space-x-2 text-sm font-medium text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-500">
                        <ChatBubbleLeftIcon className="h-5 w-5" />
                        <span>{post.comments}</span>
                      </button>

                      <button className="flex items-center space-x-2 text-sm font-medium text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-500">
                        <ShareIcon className="h-5 w-5" />
                        <span>{post.shares}</span>
                      </button>

                      <button
                        onClick={() => handleEngagement(post.id, 'bookmark')}
                        className={`flex items-center space-x-2 text-sm font-medium transition-colors ${
                          post.isBookmarked
                            ? 'text-yellow-600'
                            : 'text-gray-500 hover:text-yellow-600 dark:text-gray-400 dark:hover:text-yellow-500'
                        }`}
                      >
                        {post.isBookmarked ? (
                          <BookmarkIconSolid className="h-5 w-5" />
                        ) : (
                          <BookmarkIcon className="h-5 w-5" />
                        )}
                        <span>{post.bookmarks}</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <EngagementBoost 
                        postId={post.id} 
                        onBoostCreated={handleBoostCreated}
                      />
                      <button
                        onClick={() => {
                          setSelectedPostId(post.id);
                          setShowAnalytics(true);
                        }}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        <ChartBarIcon className="h-4 w-4 mr-1" />
                        Analytics
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Analytics de Engagement
              </h3>
              <button
                onClick={() => {
                  setShowAnalytics(false);
                  setSelectedPostId(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <EngagementAnalytics 
              postId={selectedPostId || undefined}
              userId="current_user"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedFeed;