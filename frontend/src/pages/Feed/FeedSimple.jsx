import React, { useState, useEffect } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { useWalletAuth } from '../../hooks/useWalletAuth';
import { useProfile } from '../../hooks/useProfile';
import { Heart, MessageCircle, Share2, Send, Image, Video, File } from 'lucide-react';
import WalletBanner from '../../components/Web3/WalletBanner';
import './Feed.css';
import '../../styles/web3-theme.css';

const FeedSimple = () => {
  const { address } = useWallet();
  const { sessionData } = useWalletAuth();
  const { profile } = useProfile();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock data - replace with API calls
  useEffect(() => {
    const mockPosts = [
      {
        id: 1,
        author: {
          name: 'Juan Pérez',
          address: '0x1234...5678',
          avatar: '👨‍💻'
        },
        content: '¡Acabo de completar mi primer proyecto en GigChain! 🚀',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        likes: 12,
        comments: 3,
        shares: 2
      },
      {
        id: 2,
        author: {
          name: 'María García',
          address: '0x8765...4321',
          avatar: '👩‍🎨'
        },
        content: 'Buscando diseñador UX/UI para proyecto web3. Pago en tokens GIG. DM si te interesa.',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        likes: 8,
        comments: 5,
        shares: 1
      },
      {
        id: 3,
        author: {
          name: 'Carlos Rodríguez',
          address: '0xabcd...ef01',
          avatar: '👨‍💼'
        },
        content: 'Nuevo artículo sobre Smart Contracts en el blog de GigChain. ¡No te lo pierdas! 📝',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        likes: 25,
        comments: 7,
        shares: 10
      }
    ];
    setPosts(mockPosts);
  }, []);

  const handlePostSubmit = (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    // Get user display name from profile or fallback to wallet address
    const userDisplayName = profile?.display_name || 
                           profile?.username || 
                           (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Anónimo');

    const post = {
      id: Date.now(),
      author: {
        name: userDisplayName,
        address: address || '0x0000...0000',
        avatar: profile?.avatar_url || '👤',
        isImage: !!profile?.avatar_url
      },
      content: newPost,
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: 0,
      shares: 0
    };

    setPosts([post, ...posts]);
    setNewPost('');
  };

  const handleLike = (postId) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, likes: post.likes + 1 }
        : post
    ));
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return `Hace ${diffDays}d`;
  };

  return (
    <div className="feed-container">
      {/* Wallet Connection Banner */}
      <WalletBanner />
      
      <div className="feed-header">
        <h1 className="gradient-text">🌐 Feed de GigChain</h1>
        <p className="feed-subtitle">Conecta, comparte y descubre oportunidades</p>
      </div>

      {/* Create Post Section */}
      <div className="create-post-card">
        <div className="create-post-header">
          <div className="user-avatar">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Avatar" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
            ) : (
              profile?.display_name ? profile.display_name.slice(0, 2).toUpperCase() : (address ? address.slice(2, 4).toUpperCase() : '🔒')
            )}
          </div>
          <form onSubmit={handlePostSubmit} className="create-post-form">
            <textarea
              placeholder={profile?.display_name 
                ? `¿Qué quieres compartir, ${profile.display_name}?` 
                : "¿Qué quieres compartir con la comunidad?"}
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              rows="3"
              className="post-textarea"
            />
            <div className="create-post-actions">
              <div className="post-tools">
                <button type="button" className="tool-btn" title="Añadir imagen">
                  <Image size={20} />
                </button>
                <button type="button" className="tool-btn" title="Añadir video">
                  <Video size={20} />
                </button>
                <button type="button" className="tool-btn" title="Añadir archivo">
                  <File size={20} />
                </button>
              </div>
              <button 
                type="submit" 
                className="post-submit-btn"
                disabled={!newPost.trim()}
              >
                <Send size={18} />
                Publicar
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="posts-feed">
        {posts.length === 0 ? (
          <div className="empty-feed">
            <p>No hay publicaciones todavía. ¡Sé el primero en publicar!</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <div className="post-author">
                  <div className="author-avatar">
                    {post.author.isImage ? (
                      <img 
                        src={post.author.avatar} 
                        alt={post.author.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                      />
                    ) : (
                      post.author.avatar
                    )}
                  </div>
                  <div className="author-info">
                    <h3 className="author-name">{post.author.name}</h3>
                    <p className="post-time">{formatTime(post.timestamp)}</p>
                  </div>
                </div>
              </div>

              <div className="post-content">
                <p>{post.content}</p>
              </div>

              <div className="post-actions">
                <button 
                  className="action-btn like-btn"
                  onClick={() => handleLike(post.id)}
                >
                  <Heart size={18} />
                  <span>{post.likes}</span>
                </button>
                <button className="action-btn">
                  <MessageCircle size={18} />
                  <span>{post.comments}</span>
                </button>
                <button className="action-btn">
                  <Share2 size={18} />
                  <span>{post.shares}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FeedSimple;

