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
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid,
} from '@heroicons/react/24/solid';

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
  clpEarned: number;
  tags: string[];
  type: 'post' | 'achievement' | 'job' | 'event' | 'poll' | 'skill';
  isLiked: boolean;
  isBookmarked: boolean;
  location?: string;
  eventDate?: string;
  pollOptions?: { option: string; votes: number; percentage: number }[];
  skillEndorsements?: { skill: string; endorsers: number }[];
}

const Feed: React.FC = () => {
  const { isConnected } = useAccount();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedType, setSelectedType] = useState<'post' | 'job' | 'event' | 'poll' | 'skill'>('post');
  const [activeFilter, setActiveFilter] = useState('all');

  // Mock data - replace with actual API calls
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
        clpEarned: 45,
        tags: ['DeFi', 'Polygon', 'Smart Contracts', 'Yield Farming'],
        type: 'post',
        isLiked: false,
        isBookmarked: false,
      },
      {
        id: '2',
        author: {
          name: 'Sarah Kim',
          username: '@sarahkim',
          avatar: '/avatars/sarah.jpg',
          verified: true,
          level: 'Expert',
          reputation: 98,
        },
        content: '🎉 Achievement Unlocked: "Blockchain Pioneer" - Successfully completed 100+ smart contract audits and helped secure over $50M in DeFi protocols. Grateful for this amazing community!',
        timestamp: '4h ago',
        likes: 89,
        comments: 15,
        shares: 12,
        clpEarned: 67,
        tags: ['Achievement', 'Security', 'Audit', 'DeFi'],
        type: 'achievement',
        isLiked: true,
        isBookmarked: true,
      },
      {
        id: '3',
        author: {
          name: 'Blockchain Startup',
          username: '@blockchainstartup',
          avatar: '/avatars/startup.jpg',
          verified: true,
          level: 'Company',
          reputation: 92,
        },
        content: '🚀 We\'re hiring! Looking for a Senior Solidity Developer to join our team. Remote position with competitive salary and equity. Must have 3+ years experience with DeFi protocols.',
        timestamp: '6h ago',
        likes: 45,
        comments: 8,
        shares: 15,
        clpEarned: 23,
        tags: ['Hiring', 'Solidity', 'DeFi', 'Remote', 'Senior'],
        type: 'job',
        isLiked: false,
        isBookmarked: false,
      },
      {
        id: '4',
        author: {
          name: 'Web3 Conference',
          username: '@web3conf',
          avatar: '/avatars/conference.jpg',
          verified: true,
          level: 'Event',
          reputation: 88,
        },
        content: 'Join us for the biggest Web3 conference of the year! 50+ speakers, 1000+ attendees, and exclusive networking opportunities. Early bird tickets available now!',
        timestamp: '8h ago',
        likes: 156,
        comments: 34,
        shares: 28,
        clpEarned: 78,
        tags: ['Conference', 'Web3', 'Networking', 'Event'],
        type: 'event',
        isLiked: false,
        isBookmarked: true,
        location: 'San Francisco, CA',
        eventDate: 'March 15-17, 2024',
      },
      {
        id: '5',
        author: {
          name: 'Mike Johnson',
          username: '@mikejohnson',
          avatar: '/avatars/mike.jpg',
          verified: false,
          level: 'Mid',
          reputation: 76,
        },
        content: 'What do you think is the most important skill for a blockchain developer in 2024?',
        timestamp: '12h ago',
        likes: 23,
        comments: 45,
        shares: 3,
        clpEarned: 12,
        tags: ['Poll', 'Blockchain', 'Development', 'Skills'],
        type: 'poll',
        isLiked: false,
        isBookmarked: false,
        pollOptions: [
          { option: 'Solidity', votes: 45, percentage: 35 },
          { option: 'Rust', votes: 38, percentage: 30 },
          { option: 'JavaScript', votes: 25, percentage: 20 },
          { option: 'Python', votes: 20, percentage: 15 },
        ],
      },
    ];

    setPosts(mockPosts);
  }, []);

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked, 
            likes: post.isLiked ? post.likes - 1 : post.likes + 1 
          }
        : post
    ));
  };

  const handleBookmark = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, isBookmarked: !post.isBookmarked }
        : post
    ));
  };

  const handleShare = (postId: string) => {
    // Implement share functionality
    console.log('Sharing post:', postId);
  };

  const handleCreatePost = () => {
    if (newPost.trim()) {
      const newPostObj: Post = {
        id: Date.now().toString(),
        author: {
          name: 'You',
          username: '@you',
          avatar: '/avatars/you.jpg',
          verified: true,
          level: 'Senior',
          reputation: 85,
        },
        content: newPost,
        timestamp: 'now',
        likes: 0,
        comments: 0,
        shares: 0,
        clpEarned: 0,
        tags: [],
        type: selectedType,
        isLiked: false,
        isBookmarked: false,
      };
      
      setPosts([newPostObj, ...posts]);
      setNewPost('');
      setShowCreatePost(false);
    }
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
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
      case 'achievement': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'job': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'event': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'poll': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      case 'skill': return 'text-pink-600 bg-pink-100 dark:bg-pink-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const filters = [
    { id: 'all', name: 'All Posts', icon: GlobeAltIcon },
    { id: 'following', name: 'Following', icon: UserGroupIcon },
    { id: 'trending', name: 'Trending', icon: FireIcon },
    { id: 'jobs', name: 'Jobs', icon: CurrencyDollarIcon },
    { id: 'events', name: 'Events', icon: CalendarIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Professional Feed
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Stay updated with the latest from your professional network
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {filters.map((filter) => {
              const Icon = filter.icon;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    activeFilter === filter.id
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {filter.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Create Post */}
        {isConnected && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                Y
              </div>
              <div className="flex-1">
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="w-full text-left p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  What's on your mind?
                </button>
              </div>
            </div>

            {showCreatePost && (
              <div className="mt-4 space-y-4">
                <div className="flex space-x-2">
                  {[
                    { type: 'post', label: 'Post', icon: DocumentTextIcon },
                    { type: 'job', label: 'Job', icon: CurrencyDollarIcon },
                    { type: 'event', label: 'Event', icon: CalendarIcon },
                    { type: 'poll', label: 'Poll', icon: UserGroupIcon },
                    { type: 'skill', label: 'Skill', icon: SparklesIcon },
                  ].map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.type}
                        onClick={() => setSelectedType(option.type as any)}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                          selectedType === option.type
                            ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {option.label}
                      </button>
                    );
                  })}
                </div>

                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Share your thoughts, achievements, or opportunities..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <PhotoIcon className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <VideoCameraIcon className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <LinkIcon className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <MapPinIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowCreatePost(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreatePost}
                      disabled={!newPost.trim()}
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Posts */}
        <div className="space-y-6">
          {posts.map((post) => {
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
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getPostTypeColor(post.type)}`}>
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
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {post.content}
                  </p>

                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {post.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 dark:bg-blue-900/20 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

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
                      {post.media.type === 'video' && (
                        <video
                          src={post.media.url}
                          poster={post.media.thumbnail}
                          controls
                          className="w-full h-64 object-cover rounded-lg"
                        />
                      )}
                    </div>
                  )}

                  {/* Poll */}
                  {post.pollOptions && (
                    <div className="mt-4 space-y-2">
                      {post.pollOptions.map((option, index) => (
                        <div key={index} className="relative">
                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {option.option}
                            </span>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {option.percentage}%
                            </span>
                          </div>
                          <div
                            className="absolute top-0 left-0 h-full bg-blue-500 rounded-lg opacity-20"
                            style={{ width: `${option.percentage}%` }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Event Info */}
                  {post.location && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <MapPinIcon className="h-4 w-4" />
                        <span>{post.location}</span>
                      </div>
                      {post.eventDate && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{post.eventDate}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Post Actions */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center space-x-2 text-sm font-medium transition-colors duration-200 ${
                          post.isLiked
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                        }`}
                      >
                        {post.isLiked ? (
                          <HeartIconSolid className="h-5 w-5" />
                        ) : (
                          <HeartIcon className="h-5 w-5" />
                        )}
                        <span>{post.likes}</span>
                      </button>

                      <button className="flex items-center space-x-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
                        <ChatBubbleLeftIcon className="h-5 w-5" />
                        <span>{post.comments}</span>
                      </button>

                      <button
                        onClick={() => handleShare(post.id)}
                        className="flex items-center space-x-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200"
                      >
                        <ShareIcon className="h-5 w-5" />
                        <span>{post.shares}</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleBookmark(post.id)}
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                          post.isBookmarked
                            ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20'
                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {post.isBookmarked ? (
                          <BookmarkIconSolid className="h-5 w-5" />
                        ) : (
                          <BookmarkIcon className="h-5 w-5" />
                        )}
                      </button>

                      <div className="flex items-center space-x-1 text-sm font-medium text-green-600 dark:text-green-400">
                        <CurrencyDollarIcon className="h-4 w-4" />
                        <span>{post.clpEarned} GCH</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Feed;