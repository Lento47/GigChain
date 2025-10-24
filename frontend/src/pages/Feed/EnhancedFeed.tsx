import React, { useState, useEffect } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import './FeedClean.css';
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
  ArrowTrendingUpIcon,
  ChartBarIcon,
  PlayIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  Bars3Icon,
  FunnelIcon,
  StarIcon,
  FlagIcon,
  ClockIcon,
  GlobeAmericasIcon,
  UserPlusIcon,
  BellIcon,
  InformationCircleIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  LightBulbIcon,
  PuzzlePieceIcon
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid,
} from '@heroicons/react/24/solid';

// Importar componentes de engagement
import EngagementBoost from '../../components/EngagementBoost/EngagementBoost';
import EngagementAnalytics from '../../components/EngagementAnalytics/EngagementAnalytics';
import PostBadges from '../../components/Gamification/PostBadges';
import BlockchainStatus from '../../components/Blockchain/BlockchainStatus';
import PostCreationForm from '../../components/PostCreation/PostCreationForm';

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
  const activeAccount = useActiveAccount();
  const isConnected = !!activeAccount;
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedType, setSelectedType] = useState<'post' | 'job' | 'event' | 'poll' | 'skill'>('post');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{postId: string, mediaUrl: string, type: string} | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [userReactions, setUserReactions] = useState<{[postId: string]: string}>({});

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
    setTrendingPosts(mockPosts.filter(post => post.isBoosted || (post.engagementRate && post.engagementRate > 10)));
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

  const getTagChipClass = (tag: string) => {
    const tagLower = tag.toLowerCase();
    if (tagLower.includes('defi') || tagLower.includes('decentralized')) return 'tag-chip--defi';
    if (tagLower.includes('polygon') || tagLower.includes('matic')) return 'tag-chip--polygon';
    if (tagLower.includes('ethereum') || tagLower.includes('eth')) return 'tag-chip--ethereum';
    if (tagLower.includes('nft') || tagLower.includes('non-fungible')) return 'tag-chip--nft';
    if (tagLower.includes('dao') || tagLower.includes('governance')) return 'tag-chip--dao';
    if (tagLower.includes('security') || tagLower.includes('audit')) return 'tag-chip--security';
    return 'tag-chip--default';
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

  const handleReportPost = (postId: string) => {
    setReportingPostId(postId);
    setShowReportModal(true);
  };

  const handleSubmitReport = async () => {
    if (!reportingPostId || !reportReason) return;
    
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          post_id: reportingPostId,
          reason: reportReason,
          user_id: 'current_user'
        })
      });

      if (response.ok) {
        alert('Reporte enviado exitosamente. Gracias por mantener la comunidad segura.');
        setShowReportModal(false);
        setReportingPostId(null);
        setReportReason('');
      }
    } catch (error) {
      console.error('Error reporting post:', error);
      alert('Error al enviar el reporte. Inténtalo de nuevo.');
    }
  };

  const handleMarkAsResolved = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, type: 'resolved' as any }
        : post
    ));
  };

  const filters = [
    { id: 'all', name: 'Todos', icon: GlobeAltIcon, description: 'Ver todas las publicaciones' },
    { id: 'trending', name: 'Trending', icon: FireIcon, description: 'Contenido más popular' },
    { id: 'boosted', name: 'Boosted', icon: RocketLaunchIcon, description: 'Publicaciones promocionadas' },
    { id: 'jobs', name: 'Oportunidades', icon: BriefcaseIcon, description: 'Trabajos y proyectos' },
    { id: 'achievements', name: 'Logros', icon: TrophyIcon, description: 'Conquistas de la comunidad' },
    { id: 'skills', name: 'Habilidades', icon: AcademicCapIcon, description: 'Showcase de talentos' },
    { id: 'blockchain', name: 'Blockchain', icon: PuzzlePieceIcon, description: 'Contenido Web3' },
    { id: 'defi', name: 'DeFi', icon: CurrencyDollarIcon, description: 'Finanzas descentralizadas' },
    { id: 'nft', name: 'NFT', icon: SparklesIcon, description: 'Arte y coleccionables' },
    { id: 'events', name: 'Eventos', icon: CalendarIcon, description: 'Conferencias y meetups' },
  ];

  const availableTags = ['DeFi', 'Polygon', 'Smart Contracts', 'Yield Farming', 'React', 'TypeScript', 'Frontend', 'Dashboard', 'Security', 'Auditing', 'Blockchain', 'Web3', 'Conference', 'Networking', 'Event', 'Poll', 'Development', 'Skills'];

  const filteredPosts = posts.filter(post => {
    // Filtro por tipo
    if (activeFilter === 'all') {
      // No filtrar por tipo
    } else if (activeFilter === 'trending') {
      if (!(post.engagementRate && post.engagementRate > 10)) return false;
    } else if (activeFilter === 'boosted') {
      if (!post.isBoosted) return false;
    } else if (activeFilter === 'jobs') {
      if (post.type !== 'job') return false;
    } else if (activeFilter === 'achievements') {
      if (post.type !== 'achievement') return false;
    } else if (activeFilter === 'skills') {
      if (post.type !== 'skill') return false;
    } else if (activeFilter === 'blockchain') {
      if (!post.tags.some(tag => tag.toLowerCase().includes('blockchain') || tag.toLowerCase().includes('web3'))) return false;
    } else if (activeFilter === 'defi') {
      if (!post.tags.some(tag => tag.toLowerCase().includes('defi') || tag.toLowerCase().includes('yield farming'))) return false;
    } else if (activeFilter === 'nft') {
      if (!post.tags.some(tag => tag.toLowerCase().includes('nft') || tag.toLowerCase().includes('art'))) return false;
    } else if (activeFilter === 'events') {
      if (post.type !== 'event') return false;
    }

    // Filtro por búsqueda de texto
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesContent = post.content.toLowerCase().includes(query);
      const matchesAuthor = post.author.name.toLowerCase().includes(query) || 
                           post.author.username.toLowerCase().includes(query);
      const matchesTags = post.tags.some(tag => tag.toLowerCase().includes(query));
      
      if (!matchesContent && !matchesAuthor && !matchesTags) return false;
    }

    // Filtro por tags seleccionadas
    if (selectedTags.length > 0) {
      const hasMatchingTag = selectedTags.some(selectedTag => 
        post.tags.some(tag => tag.toLowerCase().includes(selectedTag.toLowerCase()))
      );
      if (!hasMatchingTag) return false;
    }

    return true;
  }).sort((a, b) => {
    // Ordenamiento
    switch (sortBy) {
      case 'popular':
        return (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares);
      case 'trending':
        return (b.engagementRate ?? 0) - (a.engagementRate ?? 0);
      case 'recent':
      default:
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }
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
    <div className="min-h-screen feed-clean">
      {/* Clean Header */}
      <div className="feed-header-clean">
        <div className="w-full px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="feed-title-clean">Feed Profesional</h1>
              <p className="feed-subtitle-clean">Descubre oportunidades y conecta con la comunidad Web3</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreatePost(true)}
                className="action-button-clean action-button-clean--primary"
              >
                <PlusIcon className="h-4 w-4" />
                Crear Post
              </button>
              <button
                onClick={() => setShowAnalytics(true)}
                className="action-button-clean"
              >
                <ChartBarIcon className="h-4 w-4" />
                Analytics
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 lg:px-6 py-8">
        {/* Clean Search and Filters */}
        <div className="mb-8">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar publicaciones, usuarios, skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-clean w-full pl-10 pr-10"
                aria-label="Buscar en el feed"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  aria-label="Limpiar búsqueda"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {filters.slice(0, 6).map((filter) => {
              const FilterIcon = filter.icon;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`filter-clean ${activeFilter === filter.id ? 'filter-clean--active' : ''}`}
                  title={filter.description}
                >
                  <FilterIcon className="h-4 w-4 mr-2" />
                  {filter.name}
                  {activeFilter === filter.id && (
                    <span className="ml-2 px-2 py-0.5 bg-white/20 text-xs rounded-full">
                      {filteredPosts.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

          {/* Enhanced Filter System */}
          <div className="space-y-4">
            {/* Main Filters */}
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtros de contenido">
              {filters.slice(0, 6).map((filter) => {
                const FilterIcon = filter.icon;
                return (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`filter-chip ${
                      activeFilter === filter.id
                        ? 'filter-chip--active'
                        : 'filter-chip--inactive'
                    }`}
                    title={filter.description}
                    aria-pressed={activeFilter === filter.id}
                    aria-describedby={`filter-${filter.id}-description`}
                  >
                    <FilterIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                    {filter.name}
                    {activeFilter === filter.id && (
                      <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full" aria-label={`${filteredPosts.length} resultados`}>
                        {filteredPosts.length}
                      </span>
                    )}
                    <span id={`filter-${filter.id}-description`} className="sr-only">
                      {filter.description}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Secondary Filters */}
            <div className="flex flex-wrap gap-2">
              {filters.slice(6).map((filter) => {
                const FilterIcon = filter.icon;
                return (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`group inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeFilter === filter.id
                        ? 'bg-gradient-to-r from-green-400 to-cyan-500 text-white shadow-md shadow-green-500/25'
                        : 'text-cyan-400 hover:text-cyan-300 hover:bg-slate-800/50'
                    }`}
                    title={filter.description}
                  >
                    <FilterIcon className="h-3 w-3 mr-1" />
                    {filter.name}
                  </button>
                );
              })}
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  showFilters
                    ? 'bg-purple-500/20 text-purple-300 border-2 border-purple-400 shadow-lg shadow-purple-500/25'
                    : 'text-cyan-400 hover:text-purple-300 hover:bg-slate-800/50 border-2 border-transparent hover:border-purple-500/30'
                }`}
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filtros Avanzados
                {showFilters && (
                  <span className="ml-2 text-xs bg-purple-200 dark:bg-purple-800 px-2 py-1 rounded-full">
                    Activo
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Enhanced Advanced Filters */}
          {showFilters && (
            <div className="bg-slate-800/50 rounded-xl border border-cyan-500/20 p-6 space-y-6 shadow-lg backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Filtros Avanzados</h3>
                  <p className="text-sm text-cyan-300">Personaliza tu experiencia de navegación</p>
                </div>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-cyan-400 hover:text-cyan-300 p-2 rounded-lg hover:bg-cyan-500/20 transition-colors duration-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ordenamiento */}
                <div>
                  <label className="block text-sm font-medium text-cyan-300 mb-3">
                    <ArrowTrendingUpIcon className="h-4 w-4 inline mr-2" />
                    Ordenar por
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { value: 'recent', label: 'Más recientes', icon: ClockIcon, description: 'Publicaciones más nuevas' },
                      { value: 'popular', label: 'Más populares', icon: FireIcon, description: 'Por engagement total' },
                      { value: 'trending', label: 'Trending', icon: ArrowTrendingUpIcon, description: 'Por tasa de engagement' }
                    ].map((option) => {
                      const OptionIcon = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() => setSortBy(option.value as any)}
                          className={`flex items-center p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                            sortBy === option.value
                              ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/25'
                              : 'text-cyan-300 hover:text-cyan-200 hover:bg-slate-700/50 border border-transparent hover:border-cyan-500/30'
                          }`}
                        >
                          <OptionIcon className="h-4 w-4 mr-3" />
                          <div className="flex flex-col items-start">
                            <span>{option.label}</span>
                            <span className="text-xs opacity-75">{option.description}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filtros por contenido */}
                <div>
                  <label className="block text-sm font-medium text-cyan-300 mb-3">
                    <TagIcon className="h-4 w-4 inline mr-2" />
                    Tipo de contenido
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: 'hasMedia', label: 'Con multimedia', icon: PhotoIcon },
                      { id: 'highEngagement', label: 'Alto engagement', icon: StarIcon },
                      { id: 'verifiedUsers', label: 'Usuarios verificados', icon: CheckCircleIcon },
                      { id: 'recentActivity', label: 'Actividad reciente', icon: ClockIcon }
                    ].map((filter) => {
                      const FilterIcon = filter.icon;
                      return (
                        <label key={filter.id} className="flex items-center p-2 rounded-lg hover:bg-slate-700/50 cursor-pointer transition-colors duration-200">
                          <input type="checkbox" className="mr-3 rounded border-cyan-500/50 bg-slate-700 text-cyan-500 focus:ring-cyan-500" />
                          <FilterIcon className="h-4 w-4 mr-2 text-cyan-400" />
                          <span className="text-sm text-cyan-300">{filter.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-3">
                  <TagIcon className="h-4 w-4 inline mr-2" />
                  Filtrar por tags ({selectedTags.length} seleccionados)
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        if (selectedTags.includes(tag)) {
                          setSelectedTags(selectedTags.filter(t => t !== tag));
                        } else {
                          setSelectedTags([...selectedTags, tag]);
                        }
                      }}
                      className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        selectedTags.includes(tag)
                          ? 'bg-gradient-to-r from-green-400 to-cyan-500 text-white shadow-md shadow-green-500/25'
                          : 'bg-slate-700/50 text-cyan-300 hover:bg-slate-600/50 hover:text-cyan-200 hover:shadow-sm hover:shadow-cyan-500/10'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
                {selectedTags.length > 0 && (
                  <div className="flex justify-between items-center mt-3">
                    <button
                      onClick={() => setSelectedTags([])}
                      className="text-sm text-red-400 hover:text-red-300 flex items-center transition-colors duration-200"
                    >
                      <XMarkIcon className="h-4 w-4 mr-1" />
                      Limpiar todos los tags
                    </button>
                    <span className="text-sm text-cyan-300">
                      {filteredPosts.length} publicaciones encontradas
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Posts Grid */}
        <div className="space-y-4 pb-8">
          {filteredPosts.map((post) => {
            const PostTypeIcon = getPostTypeIcon(post.type);
            return (
              <div
                key={post.id}
                className="group rounded-lg shadow-lg hover:shadow-2xl border overflow-hidden transition-all duration-300 ease-out hover:-translate-y-2 post-card-vibrant"
                style={{
                  background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(51, 65, 85, 0.6) 50%, rgba(30, 41, 59, 0.8) 100%)',
                  borderColor: 'rgba(0, 212, 255, 0.2)',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.4)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 212, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.2)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.3)';
                }}
              >
                {/* Enhanced Post Header with Industrial Design */}
                <div className="post-section post-divider">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-5">
                      {/* Enhanced Avatar with Metallic Ring */}
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 via-purple-500 to-green-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-cyan-400/50">
                          {post.author.name.charAt(0)}
                        </div>
                        {post.author.verified && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br from-green-400 to-cyan-500 rounded-full flex items-center justify-center border-2 border-slate-800 shadow-md">
                            <span className="text-white text-xs font-bold">✓</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Enhanced User Info with Better Typography */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-3">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold text-white tracking-tight" style={{
                              background: 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text'
                            }}>
                              {post.author.name}
                            </h3>
                            <span className="text-sm text-cyan-400 font-medium">
                              @{post.author.username}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-cyan-500">
                            <ClockIcon className="h-3 w-3" />
                            <span>{post.timestamp}</span>
                          </div>
                        </div>
                        
                        <div className="post-metadata">
                          <div className="post-metadata-item">
                            <span className="font-semibold text-cyan-300">{post.author.level}</span>
                          </div>
                          <div className="post-metadata-item">
                            <span className="font-medium text-cyan-400">{post.author.reputation} rep</span>
                          </div>
                          <div className="post-metadata-item">
                            <EyeIcon className="h-3 w-3" aria-hidden="true" />
                            <span className="font-medium text-cyan-400">{post.views.toLocaleString()}</span>
                          </div>
                          {post.engagementRate && (
                            <div className="post-metadata-item">
                              <ArrowTrendingUpIcon className="h-3 w-3" aria-hidden="true" />
                              <span className="font-medium text-green-400">{post.engagementRate.toFixed(1)}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {/* Follow Button with Enhanced Hover */}
                      <button className="inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold text-cyan-300 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-200 hover:scale-105 hover:shadow-md hover:shadow-cyan-500/25">
                        <UserPlusIcon className="h-3 w-3 mr-1" />
                        Seguir
                      </button>

                      {/* Indicador de boost */}
                      {post.isBoosted && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30">
                          <RocketLaunchIcon className="h-3 w-3 mr-1" />
                          Boosted
                        </span>
                      )}
                      
                      {/* Tipo de post */}
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPostTypeColor(post.type)}`}>
                        <PostTypeIcon className="h-3 w-3 mr-1" />
                        {post.type}
                      </span>

                      {/* Post Badges */}
                      <PostBadges post={post} />
                      
                      <div className="relative">
                        <button className="p-2 text-cyan-400 hover:text-cyan-300 transition-colors duration-200">
                          <EllipsisHorizontalIcon className="h-5 w-5" />
                        </button>
                        {/* Dropdown menu */}
                        <div className="absolute right-0 mt-2 w-48 bg-slate-800/95 rounded-lg shadow-xl border border-cyan-500/20 z-10 hidden group-hover:block backdrop-blur-sm">
                          <div className="py-1">
                            <button
                              onClick={() => handleReportPost(post.id)}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors duration-200"
                            >
                              <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                              Reportar contenido
                            </button>
                            {post.type === 'job' && (
                              <button
                                onClick={() => handleMarkAsResolved(post.id)}
                                className="flex items-center w-full px-4 py-2 text-sm text-green-400 hover:bg-green-500/20 hover:text-green-300 transition-colors duration-200"
                              >
                                <CheckCircleIcon className="h-4 w-4 mr-2" />
                                Marcar como resuelto
                              </button>
                            )}
                            <button className="flex items-center w-full px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors duration-200">
                              <ShareIcon className="h-4 w-4 mr-2" />
                              Compartir externamente
                            </button>
                            <button className="flex items-center w-full px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors duration-200">
                              <LinkIcon className="h-4 w-4 mr-2" />
                              Copiar enlace
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Post Content */}
                <div className="post-section--compact">
                  <div className="prose prose-invert max-w-none">
                    <p className="text-white leading-relaxed text-base mb-4 font-medium" style={{ lineHeight: '1.7' }}>
                      {post.content}
                    </p>
                  </div>
                  
                  {/* Media */}
                  {post.media && (
                    <div className="mt-4">
                      {post.media.type === 'image' && (
                        <div className="relative group cursor-pointer overflow-hidden rounded-lg" onClick={() => setSelectedMedia({postId: post.id, mediaUrl: post.media!.url, type: post.media!.type})}>
                          <img
                            src={post.media.url}
                            alt="Post media"
                            className="w-full h-64 object-cover transition-all duration-300 group-hover:scale-105 group-hover:brightness-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent group-hover:from-black/40 transition-all duration-300 rounded-lg flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                              <div className="bg-white/95 backdrop-blur-sm rounded-full p-3 shadow-lg">
                                <EyeIcon className="h-6 w-6 text-gray-800" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {post.media.type === 'video' && (
                        <div className="relative group cursor-pointer" onClick={() => setSelectedMedia({postId: post.id, mediaUrl: post.media!.url, type: post.media!.type})}>
                          <video
                            src={post.media.url}
                            poster={post.media.thumbnail}
                            className="w-full h-64 object-cover rounded-lg"
                            controls
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <div className="bg-white bg-opacity-90 rounded-full p-2">
                                <PlayIcon className="h-6 w-6 text-gray-800" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {post.media.type === 'document' && (
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                          <div className="flex items-center space-x-3">
                            <DocumentTextIcon className="h-8 w-8 text-blue-500" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Documento adjunto
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Haz clic para descargar
                              </p>
                            </div>
                            <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                              <ArrowDownTrayIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Enhanced Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-2" role="group" aria-label="Etiquetas del post">
                        {post.tags.map((tag, index) => (
                          <button
                            key={index}
                            className={`tag-chip ${getTagChipClass(tag)}`}
                            onClick={() => setSearchQuery(tag)}
                            title={`Buscar posts con la etiqueta ${tag}`}
                            aria-label={`Filtrar por etiqueta ${tag}`}
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Engagement Stats */}
                <div className="post-section--compact bg-slate-700/30 post-divider">
                  <div className="flex items-center justify-between text-sm text-cyan-300">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        {post.views.toLocaleString()} views
                      </span>
                      {post.engagementRate && (
                        <span className="flex items-center text-green-400">
                          <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                          {post.engagementRate.toFixed(1)}% engagement
                        </span>
                      )}
                      {post.tokensEarned && (
                        <span className="flex items-center text-green-400">
                          <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                          {post.tokensEarned.toFixed(1)} GigSoul
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {post.activeBoosts && post.activeBoosts > 0 && (
                        <span className="flex items-center text-purple-400">
                          <RocketLaunchIcon className="h-4 w-4 mr-1" />
                          {post.activeBoosts} boosts
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Enhanced Action Buttons with Clear Metrics */}
                <div className="post-section bg-gradient-to-r from-slate-700/30 to-transparent post-divider">
                  <div className="space-y-4">
                    {/* Enhanced Metrics with Emoji Format */}
                    <div className="flex items-center justify-center">
                      <div className="flex items-center space-x-6 text-sm">
                        {/* Like Button */}
                        <button
                          onClick={() => handleEngagement(post.id, 'like')}
                          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-md ${
                            post.isLiked
                              ? 'text-pink-300 bg-gradient-to-r from-pink-500/20 to-red-500/20 border border-pink-400/50 shadow-lg shadow-pink-500/25'
                              : 'text-cyan-300 hover:text-pink-300 hover:bg-gradient-to-r hover:from-pink-500/20 hover:to-red-500/20 hover:border-pink-400/50 border border-transparent hover:shadow-lg hover:shadow-pink-500/25'
                          }`}
                          title="Dar like a esta publicación"
                        >
                          <span className="text-lg transition-transform duration-200 hover:scale-110">
                            {post.isLiked ? '❤️' : '🤍'}
                          </span>
                          <span className="font-semibold">{post.likes.toLocaleString()}</span>
                        </button>

                        {/* Comment Button */}
                        <button 
                          className="flex items-center space-x-2 px-4 py-2.5 rounded-lg text-cyan-300 hover:text-cyan-200 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/20 hover:border-cyan-400/50 border border-transparent transition-all duration-200 hover:scale-105 hover:shadow-md hover:shadow-cyan-500/25"
                          title="Ver comentarios"
                        >
                          <span className="text-lg transition-transform duration-200 hover:scale-110">💬</span>
                          <span className="font-semibold">{post.comments.toLocaleString()}</span>
                        </button>

                        {/* Share Button */}
                        <button 
                          className="flex items-center space-x-2 px-4 py-2.5 rounded-lg text-cyan-300 hover:text-green-300 hover:bg-gradient-to-r hover:from-green-500/20 hover:to-cyan-500/20 hover:border-green-400/50 border border-transparent transition-all duration-200 hover:scale-105 hover:shadow-md hover:shadow-green-500/25"
                          title="Compartir publicación"
                        >
                          <span className="text-lg transition-transform duration-200 hover:scale-110">🔄</span>
                          <span className="font-semibold">{post.shares.toLocaleString()}</span>
                        </button>

                        {/* Bookmark Button */}
                        <button
                          onClick={() => handleEngagement(post.id, 'bookmark')}
                          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-md ${
                            post.isBookmarked
                              ? 'text-yellow-300 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/50 shadow-lg shadow-yellow-500/25'
                              : 'text-cyan-300 hover:text-yellow-300 hover:bg-gradient-to-r hover:from-yellow-500/20 hover:to-orange-500/20 hover:border-yellow-400/50 border border-transparent hover:shadow-lg hover:shadow-yellow-500/25'
                          }`}
                          title="Guardar para después"
                        >
                          <span className="text-lg transition-transform duration-200 hover:scale-110">
                            {post.isBookmarked ? '🔖' : '🔗'}
                          </span>
                          <span className="font-semibold">{post.bookmarks.toLocaleString()}</span>
                        </button>

                        {/* Views Button */}
                        <button 
                          className="flex items-center space-x-2 px-4 py-2.5 rounded-lg text-cyan-300 hover:text-purple-300 hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-pink-500/20 hover:border-purple-400/50 border border-transparent transition-all duration-200 hover:scale-105 hover:shadow-md hover:shadow-purple-500/25"
                          title="Ver estadísticas de visualizaciones"
                        >
                          <span className="text-lg transition-transform duration-200 hover:scale-110">👁️</span>
                          <span className="font-semibold">{post.views.toLocaleString()}</span>
                        </button>
                      </div>
                    </div>

                    {/* Enhanced Action Buttons */}
                    <div className="flex items-center space-x-3" role="group" aria-label="Acciones del post">
                      {/* Quick Reply Button */}
                      <button 
                        className="action-button action-button--primary"
                        aria-label="Responder al post"
                        title="Responder al post"
                      >
                        <ChatBubbleLeftIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                        Responder
                      </button>

                      <EngagementBoost 
                        postId={post.id} 
                        onBoostCreated={handleBoostCreated}
                      />
                      <button
                        onClick={() => {
                          setSelectedPostId(post.id);
                          setShowAnalytics(true);
                        }}
                        className="action-button action-button--secondary"
                        title="Ver analytics detallados"
                        aria-label="Ver analytics detallados del post"
                      >
                        <ChartBarIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                        Analytics
                      </button>
                    </div>
                  </div>

                    {/* Enhanced Emoji Reactions */}
                    <div className="flex items-center justify-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-cyan-300" id={`reactions-${post.id}`}>Reacciones:</span>
                        <div className="flex items-center space-x-1" role="group" aria-labelledby={`reactions-${post.id}`}>
                          {['👍', '❤️', '😂', '😮', '🔥', '💡'].map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => {
                                setUserReactions(prev => ({
                                  ...prev,
                                  [post.id]: prev[post.id] === emoji ? '' : emoji
                                }));
                              }}
                              className={`p-2 rounded-full text-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                                userReactions[post.id] === emoji
                                  ? 'bg-cyan-500/20 scale-110'
                                  : 'hover:bg-slate-700/50'
                              }`}
                              title={`Reaccionar con ${emoji}`}
                              aria-label={`Reaccionar con ${emoji}`}
                              aria-pressed={userReactions[post.id] === emoji}
                            >
                              {emoji}
                            </button>
                          ))}
                          <button
                            onClick={() => setShowReactions(showReactions === post.id ? null : post.id)}
                            className="p-2 rounded-full text-cyan-400 hover:bg-slate-700/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                            title="Más reacciones"
                            aria-label="Mostrar más opciones de reacción"
                          >
                            <PlusIcon className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      {userReactions[post.id] && (
                        <span className="text-sm text-cyan-400 ml-4" aria-live="polite">
                          Reaccionaste con {userReactions[post.id]}
                        </span>
                      )}
                    </div>
                </div>
              </div>
            );
          })}
        </div>

      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-7xl shadow-2xl rounded-xl bg-slate-800/95 border-cyan-500/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-white" style={{
                background: 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Analytics de Engagement
              </h3>
              <button
                onClick={() => {
                  setShowAnalytics(false);
                  setSelectedPostId(null);
                }}
                className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
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

      {/* Media Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative max-w-7xl max-h-full bg-slate-800/90 rounded-xl border border-cyan-500/20 p-4">
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute -top-2 -right-2 text-cyan-300 hover:text-cyan-200 transition-colors duration-200 bg-slate-800/90 rounded-full p-2 hover:bg-slate-700/90 border border-cyan-500/30 z-10"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            
            {selectedMedia && selectedMedia.type === 'image' && (
              <img
                src={selectedMedia.mediaUrl}
                alt="Media preview"
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            )}
            
            {selectedMedia && selectedMedia.type === 'video' && (
              <video
                src={selectedMedia.mediaUrl}
                controls
                autoPlay
                className="max-w-full max-h-[80vh] rounded-lg"
              />
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-2xl rounded-xl bg-slate-800/95 border-red-500/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-white" style={{
                background: 'linear-gradient(135deg, #ff006e 0%, #ff4d8f 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Reportar Contenido
              </h3>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportingPostId(null);
                  setReportReason('');
                }}
                className="text-red-400 hover:text-red-300 transition-colors duration-200"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-2">
                  Motivo del reporte
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 border border-red-500/30 rounded-lg bg-slate-700/50 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Selecciona un motivo</option>
                  <option value="spam">Spam</option>
                  <option value="inappropriate">Contenido inapropiado</option>
                  <option value="harassment">Acoso</option>
                  <option value="misinformation">Información falsa</option>
                  <option value="violence">Violencia</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setReportingPostId(null);
                    setReportReason('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-cyan-300 bg-slate-700/50 rounded-lg hover:bg-slate-600/50 hover:text-cyan-200 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitReport}
                  disabled={!reportReason}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-lg hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-red-500/25"
                >
                  Enviar Reporte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Create Post Button */}
      <button
        onClick={() => setShowCreatePost(true)}
        className="fixed bottom-8 right-8 z-40 w-14 h-14 bg-gradient-to-br from-cyan-500 via-purple-500 to-green-400 rounded-full shadow-2xl hover:shadow-3xl flex items-center justify-center text-white transition-all duration-300 hover:scale-110 hover:-translate-y-1 group ring-4 ring-cyan-500/30 hover:ring-cyan-400/50"
        title="Crear nueva publicación"
      >
        <PlusIcon className="h-7 w-7 transition-transform duration-300 group-hover:rotate-90" />
      </button>

      {/* Pulse Animation Ring */}
      <div className="fixed bottom-8 right-8 z-30 w-14 h-14 bg-gradient-to-br from-cyan-500 via-purple-500 to-green-400 rounded-full animate-ping opacity-30"></div>

      {/* Post Creation Modal */}
      {showCreatePost && (
        <PostCreationForm
          isOpen={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          onSubmit={(postData) => {
            // Handle post creation
            console.log('Creating post:', postData);
            setShowCreatePost(false);
          }}
          userName="Usuario"
        />
      )}
    </div>
  );
};

export default EnhancedFeed;