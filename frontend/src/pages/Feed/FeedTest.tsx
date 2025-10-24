import React from 'react';
import './FeedVibrant.css';
import './FeedEnhancements.css';

const FeedTest: React.FC = () => {
  return (
    <div className="min-h-screen feed-container-vibrant">
      {/* Header */}
      <div className="feed-header-vibrant">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="feed-title-vibrant text-4xl font-bold mb-2">
            GigChain Feed Test
          </h1>
          <p className="feed-subtitle-vibrant text-lg">
            Testing FeedVibrant.css and FeedEnhancements.css integration
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="search-bar mb-6">
          <div className="search-icon">🔍</div>
          <input 
            type="text" 
            placeholder="Search posts, users, skills..." 
            className="search-bar-vibrant"
          />
        </div>

        {/* Filter Chips */}
        <div className="mb-6">
          <div className="filter-chip filter-chip--active">
            <span>All Posts</span>
          </div>
          <div className="filter-chip filter-chip--inactive">
            <span>Trending</span>
          </div>
          <div className="filter-chip filter-chip--inactive">
            <span>Jobs</span>
          </div>
        </div>

        {/* Test Post Cards */}
        <div className="space-y-6">
          {/* Post 1 - DeFi */}
          <div className="post-card-vibrant">
            <div className="post-section">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    A
                  </div>
                  <div className="flex-1">
                    <h3 className="post-username-vibrant text-lg font-semibold">
                      Alex Chen
                    </h3>
                    <p className="post-meta-vibrant text-sm">
                      @alexchen • 2h ago • Senior • 95 rep
                    </p>
                  </div>
                </div>
                <span className="tag-chip tag-chip--defi">
                  #DeFi
                </span>
              </div>
            </div>

            <div className="post-section--compact">
              <p className="post-text-vibrant text-base leading-relaxed">
                Just deployed my first DeFi protocol on Polygon! 🚀 The gas fees are incredibly low and the user experience is amazing. Excited to see how the community responds to this new yield farming strategy.
              </p>
              
              {/* Tags */}
              <div className="mt-4">
                <div className="tag-chip tag-chip--defi">#DeFi</div>
                <div className="tag-chip tag-chip--polygon">#Polygon</div>
                <div className="tag-chip tag-chip--ethereum">#Smart Contracts</div>
                <div className="tag-chip tag-chip--default">#Yield Farming</div>
              </div>
            </div>

            <div className="post-section bg-gradient-to-r from-slate-700/30 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <button className="action-button action-button--primary">
                    ❤️ 127
                  </button>
                  <button className="action-button action-button--secondary">
                    💬 23
                  </button>
                  <button className="action-button action-button--secondary">
                    🔄 8
                  </button>
                  <button className="action-button action-button--secondary">
                    🔗 15
                  </button>
                </div>
                <div className="text-green-400 font-semibold">
                  💰 45 GCH
                </div>
              </div>
            </div>
          </div>

          {/* Post 2 - Security */}
          <div className="post-card-vibrant">
            <div className="post-section">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    S
                  </div>
                  <div className="flex-1">
                    <h3 className="post-username-vibrant text-lg font-semibold">
                      Sarah Kim
                    </h3>
                    <p className="post-meta-vibrant text-sm">
                      @sarahkim • 4h ago • Expert • 98 rep
                    </p>
                  </div>
                </div>
                <span className="tag-chip tag-chip--security">
                  #Security
                </span>
              </div>
            </div>

            <div className="post-section--compact">
              <p className="post-text-vibrant text-base leading-relaxed">
                🎉 Achievement Unlocked: "Blockchain Pioneer" - Successfully completed 100+ smart contract audits and helped secure over $50M in DeFi protocols. Grateful for this amazing community!
              </p>
              
              {/* Tags */}
              <div className="mt-4">
                <div className="tag-chip tag-chip--security">#Security</div>
                <div className="tag-chip tag-chip--default">#Audit</div>
                <div className="tag-chip tag-chip--defi">#DeFi</div>
                <div className="tag-chip tag-chip--dao">#Achievement</div>
              </div>
            </div>

            <div className="post-section bg-gradient-to-r from-slate-700/30 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <button className="action-button action-button--primary">
                    ❤️ 89
                  </button>
                  <button className="action-button action-button--secondary">
                    💬 15
                  </button>
                  <button className="action-button action-button--secondary">
                    🔄 12
                  </button>
                  <button className="action-button action-button--secondary">
                    🔗 22
                  </button>
                </div>
                <div className="text-green-400 font-semibold">
                  💰 67 GCH
                </div>
              </div>
            </div>
          </div>

          {/* Post 3 - NFT */}
          <div className="post-card-vibrant">
            <div className="post-section">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                    M
                  </div>
                  <div className="flex-1">
                    <h3 className="post-username-vibrant text-lg font-semibold">
                      Mike Johnson
                    </h3>
                    <p className="post-meta-vibrant text-sm">
                      @mikejohnson • 6h ago • Mid • 76 rep
                    </p>
                  </div>
                </div>
                <span className="tag-chip tag-chip--nft">
                  #NFT
                </span>
              </div>
            </div>

            <div className="post-section--compact">
              <p className="post-text-vibrant text-base leading-relaxed">
                What do you think is the most important skill for a blockchain developer in 2024? Looking for insights from the community!
              </p>
              
              {/* Tags */}
              <div className="mt-4">
                <div className="tag-chip tag-chip--nft">#NFT</div>
                <div className="tag-chip tag-chip--default">#Blockchain</div>
                <div className="tag-chip tag-chip--default">#Development</div>
                <div className="tag-chip tag-chip--default">#Skills</div>
              </div>
            </div>

            <div className="post-section bg-gradient-to-r from-slate-700/30 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <button className="action-button action-button--primary">
                    ❤️ 23
                  </button>
                  <button className="action-button action-button--secondary">
                    💬 45
                  </button>
                  <button className="action-button action-button--secondary">
                    🔄 3
                  </button>
                  <button className="action-button action-button--secondary">
                    🔗 8
                  </button>
                </div>
                <div className="text-green-400 font-semibold">
                  💰 12 GCH
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedTest;
