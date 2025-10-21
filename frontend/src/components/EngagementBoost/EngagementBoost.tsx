import React, { useState, useEffect } from 'react';
import {
  RocketLaunchIcon,
  EyeIcon,
  FireIcon,
  StarIcon,
  CrownIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ChartBarIcon,
  TrendingUpIcon
} from '@heroicons/react/24/outline';

interface BoostType {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  maxMultiplier: number;
  durationHours: number;
  icon: React.ComponentType<any>;
  color: string;
}

interface BoostRequest {
  postId: string;
  boostType: string;
  tokensInvested: number;
}

interface BoostResponse {
  boostId: string;
  postId: string;
  boostType: string;
  tokensInvested: number;
  multiplier: number;
  durationHours: number;
  estimatedViews: number;
  estimatedEngagement: number;
  expiresAt: string;
  isActive: boolean;
}

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
}

const EngagementBoost: React.FC<{ postId: string; onBoostCreated?: () => void }> = ({ 
  postId, 
  onBoostCreated 
}) => {
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [selectedBoostType, setSelectedBoostType] = useState<string>('');
  const [tokensToInvest, setTokensToInvest] = useState<number>(0);
  const [boostPrice, setBoostPrice] = useState<any>(null);
  const [analytics, setAnalytics] = useState<PostAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  const boostTypes: BoostType[] = [
    {
      id: 'views_boost',
      name: 'Boost de Views',
      description: 'Aumenta las views de tu publicación',
      basePrice: 10,
      maxMultiplier: 5.0,
      durationHours: 24,
      icon: EyeIcon,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
    },
    {
      id: 'visibility_boost',
      name: 'Boost de Visibilidad',
      description: 'Mejora la visibilidad en el feed',
      basePrice: 25,
      maxMultiplier: 3.0,
      durationHours: 48,
      icon: TrendingUpIcon,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/20'
    },
    {
      id: 'trending_boost',
      name: 'Boost Trending',
      description: 'Aparece en la sección trending',
      basePrice: 50,
      maxMultiplier: 2.0,
      durationHours: 72,
      icon: FireIcon,
      color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20'
    },
    {
      id: 'premium_placement',
      name: 'Posición Premium',
      description: 'Posición destacada en el feed',
      basePrice: 100,
      maxMultiplier: 1.5,
      durationHours: 168,
      icon: CrownIcon,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20'
    }
  ];

  useEffect(() => {
    fetchPostAnalytics();
  }, [postId]);

  useEffect(() => {
    if (selectedBoostType && tokensToInvest > 0) {
      fetchBoostPrice();
    }
  }, [selectedBoostType, tokensToInvest]);

  const fetchPostAnalytics = async () => {
    try {
      const response = await fetch(`/api/engagement/analytics/post/${postId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching post analytics:', error);
    }
  };

  const fetchBoostPrice = async () => {
    try {
      const response = await fetch(`/api/engagement/boost/price/${selectedBoostType}?tokens=${tokensToInvest}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBoostPrice(data);
      }
    } catch (error) {
      console.error('Error fetching boost price:', error);
    }
  };

  const handleCreateBoost = async () => {
    if (!selectedBoostType || tokensToInvest <= 0) return;

    setLoading(true);
    try {
      const response = await fetch('/api/engagement/boost', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          post_id: postId,
          boost_type: selectedBoostType,
          tokens_invested: tokensToInvest
        })
      });

      if (response.ok) {
        const boostData = await response.json();
        console.log('Boost created:', boostData);
        
        // Actualizar analytics
        await fetchPostAnalytics();
        
        // Cerrar modal
        setShowBoostModal(false);
        setSelectedBoostType('');
        setTokensToInvest(0);
        setBoostPrice(null);
        
        // Notificar al componente padre
        if (onBoostCreated) {
          onBoostCreated();
        }
      } else {
        console.error('Error creating boost:', await response.text());
      }
    } catch (error) {
      console.error('Error creating boost:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedBoost = boostTypes.find(boost => boost.id === selectedBoostType);

  return (
    <>
      {/* Botón de Boost */}
      <button
        onClick={() => setShowBoostModal(true)}
        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
      >
        <RocketLaunchIcon className="h-4 w-4 mr-1" />
        Boost
      </button>

      {/* Modal de Boost */}
      {showBoostModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Boost tu Publicación con GigSoul
              </h3>

              {/* Analytics actuales */}
              {analytics && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estadísticas Actuales
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Views:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {analytics.totalViews.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Engagement:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {analytics.engagementRate.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Tokens Ganados:</span>
                      <span className="ml-2 font-medium text-green-600">
                        {analytics.tokensEarned.toFixed(1)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Boosts Activos:</span>
                      <span className="ml-2 font-medium text-purple-600">
                        {analytics.activeBoosts}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Selección de tipo de boost */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Boost
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {boostTypes.map((boost) => {
                    const Icon = boost.icon;
                    return (
                      <button
                        key={boost.id}
                        onClick={() => setSelectedBoostType(boost.id)}
                        className={`p-3 text-left border rounded-lg transition-colors ${
                          selectedBoostType === boost.id
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center">
                          <Icon className={`h-5 w-5 mr-3 ${boost.color.split(' ')[0]}`} />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {boost.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {boost.description}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              Desde {boost.basePrice} GigSoul • {boost.durationHours}h
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cantidad de tokens a invertir */}
              {selectedBoostType && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tokens GigSoul a Invertir
                  </label>
                  <input
                    type="number"
                    min={selectedBoost?.basePrice || 0}
                    max={1000}
                    value={tokensToInvest}
                    onChange={(e) => setTokensToInvest(Number(e.target.value))}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder={`Mínimo ${selectedBoost?.basePrice} tokens`}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Balance disponible: 1,250 GigSoul
                  </p>
                </div>
              )}

              {/* Precio y estimaciones */}
              {boostPrice && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                    Estimaciones del Boost
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700 dark:text-blue-400">Multiplicador:</span>
                      <span className="ml-2 font-medium text-blue-900 dark:text-blue-300">
                        {boostPrice.multiplier.toFixed(1)}x
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700 dark:text-blue-400">Duración:</span>
                      <span className="ml-2 font-medium text-blue-900 dark:text-blue-300">
                        {boostPrice.durationHours}h
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700 dark:text-blue-400">Views Estimadas:</span>
                      <span className="ml-2 font-medium text-blue-900 dark:text-blue-300">
                        {boostPrice.estimatedViews.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700 dark:text-blue-400">Engagement Estimado:</span>
                      <span className="ml-2 font-medium text-blue-900 dark:text-blue-300">
                        {boostPrice.estimatedEngagement}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowBoostModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateBoost}
                  disabled={!selectedBoostType || tokensToInvest <= 0 || loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                      Creando...
                    </>
                  ) : (
                    <>
                      <RocketLaunchIcon className="h-4 w-4 mr-2 inline" />
                      Crear Boost
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EngagementBoost;