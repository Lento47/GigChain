import React, { useState, useEffect } from 'react';
import {
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  BookmarkIcon,
  CurrencyDollarIcon,
  RocketLaunchIcon,
  TrendingUpIcon,
  ChartBarIcon,
  ClockIcon,
  FireIcon
} from '@heroicons/react/24/outline';

interface PostAnalytics {
  postId: string;
  totalViews: number;
  organicViews: number;
  boostedViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalBookmarks: number;
  engagementRate: number;
  tokensEarned: number;
  tokensSpent: number;
  activeBoosts: number;
  boostDetails: Array<{
    type: string;
    multiplier: number;
    tokensInvested: number;
    viewsGenerated: number;
    expiresAt: string;
  }>;
  lastUpdated: string;
}

interface UserEngagement {
  userId: string;
  totalPosts: number;
  totalViewsReceived: number;
  totalEngagementGiven: number;
  totalEngagementReceived: number;
  tokensEarnedFromEngagement: number;
  tokensSpentOnBoosts: number;
  engagementScore: number;
  lastUpdated: string;
}

const EngagementAnalytics: React.FC<{ postId?: string; userId?: string }> = ({ 
  postId, 
  userId 
}) => {
  const [postAnalytics, setPostAnalytics] = useState<PostAnalytics | null>(null);
  const [userEngagement, setUserEngagement] = useState<UserEngagement | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'post' | 'user'>('post');

  useEffect(() => {
    if (postId) {
      fetchPostAnalytics();
    }
    if (userId) {
      fetchUserEngagement();
    }
  }, [postId, userId]);

  const fetchPostAnalytics = async () => {
    if (!postId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/engagement/analytics/post/${postId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPostAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching post analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserEngagement = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/engagement/analytics/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserEngagement(data);
      }
    } catch (error) {
      console.error('Error fetching user engagement:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBoostTypeInfo = (type: string) => {
    const boostTypes = {
      'views_boost': { name: 'Views Boost', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20', icon: EyeIcon },
      'visibility_boost': { name: 'Visibility Boost', color: 'text-green-600 bg-green-100 dark:bg-green-900/20', icon: TrendingUpIcon },
      'trending_boost': { name: 'Trending Boost', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20', icon: FireIcon },
      'premium_placement': { name: 'Premium Placement', color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20', icon: RocketLaunchIcon }
    };
    return boostTypes[type as keyof typeof boostTypes] || { name: type, color: 'text-gray-600 bg-gray-100', icon: ChartBarIcon };
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expirado';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      {/* Header con tabs */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Analytics de Engagement
          </h3>
          <div className="flex space-x-1">
            {postId && (
              <button
                onClick={() => setActiveTab('post')}
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  activeTab === 'post'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Post
              </button>
            )}
            {userId && (
              <button
                onClick={() => setActiveTab('user')}
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  activeTab === 'user'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Usuario
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Analytics del Post */}
        {activeTab === 'post' && postAnalytics && (
          <div className="space-y-6">
            {/* Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <EyeIcon className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      Total Views
                    </p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                      {postAnalytics.totalViews.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <TrendingUpIcon className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      Engagement Rate
                    </p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                      {postAnalytics.engagementRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <RocketLaunchIcon className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                      Boosts Activos
                    </p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                      {postAnalytics.activeBoosts}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-8 w-8 text-yellow-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                      Tokens Ganados
                    </p>
                    <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">
                      {postAnalytics.tokensEarned.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Desglose de engagement */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Desglose de Views
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Views Orgánicas</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {postAnalytics.organicViews.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Views por Boost</span>
                    <span className="font-medium text-purple-600">
                      {postAnalytics.boostedViews.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                      style={{
                        width: `${(postAnalytics.boostedViews / Math.max(postAnalytics.totalViews, 1)) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Interacciones
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <HeartIcon className="h-5 w-5 text-red-500 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Likes</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {postAnalytics.totalLikes}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ChatBubbleLeftIcon className="h-5 w-5 text-blue-500 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Comentarios</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {postAnalytics.totalComments}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ShareIcon className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Shares</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {postAnalytics.totalShares}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <BookmarkIcon className="h-5 w-5 text-yellow-500 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Bookmarks</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {postAnalytics.totalBookmarks}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detalles de boosts */}
            {postAnalytics.boostDetails.length > 0 && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Boosts Activos
                </h4>
                <div className="space-y-3">
                  {postAnalytics.boostDetails.map((boost, index) => {
                    const boostInfo = getBoostTypeInfo(boost.type);
                    const Icon = boostInfo.icon;
                    return (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Icon className={`h-6 w-6 mr-3 ${boostInfo.color.split(' ')[0]}`} />
                            <div>
                              <h5 className="font-medium text-gray-900 dark:text-white">
                                {boostInfo.name}
                              </h5>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {boost.tokensInvested} GigSoul • {boost.multiplier.toFixed(1)}x
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {boost.viewsGenerated} views
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              <ClockIcon className="h-4 w-4 inline mr-1" />
                              {formatTimeRemaining(boost.expiresAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Resumen de tokens */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Resumen de Tokens
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Tokens Ganados</span>
                  <span className="font-medium text-green-600">
                    +{postAnalytics.tokensEarned.toFixed(1)} GigSoul
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Tokens Gastados</span>
                  <span className="font-medium text-red-600">
                    -{postAnalytics.tokensSpent.toFixed(1)} GigSoul
                  </span>
                </div>
                <div className="flex items-center justify-between md:col-span-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Balance Neto</span>
                  <span className={`font-bold ${
                    postAnalytics.tokensEarned - postAnalytics.tokensSpent >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {(postAnalytics.tokensEarned - postAnalytics.tokensSpent).toFixed(1)} GigSoul
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics del Usuario */}
        {activeTab === 'user' && userEngagement && (
          <div className="space-y-6">
            {/* Métricas principales del usuario */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <ChartBarIcon className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      Engagement Score
                    </p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                      {userEngagement.engagementScore.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <EyeIcon className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      Views Recibidas
                    </p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                      {userEngagement.totalViewsReceived.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                      Tokens Ganados
                    </p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                      {userEngagement.tokensEarnedFromEngagement.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <RocketLaunchIcon className="h-8 w-8 text-orange-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                      Tokens Gastados
                    </p>
                    <p className="text-2xl font-bold text-orange-900 dark:text-orange-300">
                      {userEngagement.tokensSpentOnBoosts.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Estadísticas detalladas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Actividad de Engagement
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Engagement Dado</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {userEngagement.totalEngagementGiven}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Engagement Recibido</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {userEngagement.totalEngagementReceived}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Posts</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {userEngagement.totalPosts}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Eficiencia de Tokens
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">ROI de Engagement</span>
                    <span className={`font-medium ${
                      userEngagement.tokensEarnedFromEngagement / Math.max(userEngagement.tokensSpentOnBoosts, 1) >= 1
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {(userEngagement.tokensEarnedFromEngagement / Math.max(userEngagement.tokensSpentOnBoosts, 1)).toFixed(2)}x
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Views por Token</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {(userEngagement.totalViewsReceived / Math.max(userEngagement.tokensSpentOnBoosts, 1)).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EngagementAnalytics;