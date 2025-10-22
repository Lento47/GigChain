import React, { useState, useEffect } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { useWalletAuth } from '../../hooks/useWalletAuth';
import { ShoppingCart, Search, Filter, Star, Clock, DollarSign, TrendingUp, Zap } from 'lucide-react';
import WalletBanner from '../../components/Web3/WalletBanner';
import './Marketplace.css';
import '../../styles/web3-theme.css';

const MarketplaceSimple = () => {
  const { address } = useWallet();
  const { sessionData } = useWalletAuth();
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'Todos', icon: '🌟' },
    { id: 'development', name: 'Desarrollo', icon: '💻' },
    { id: 'design', name: 'Diseño', icon: '🎨' },
    { id: 'marketing', name: 'Marketing', icon: '📢' },
    { id: 'writing', name: 'Escritura', icon: '✍️' },
    { id: 'consulting', name: 'Consultoría', icon: '💼' }
  ];

  useEffect(() => {
    const mockServices = [
      {
        id: 1,
        title: 'Desarrollo Web Full Stack',
        description: 'Desarrollo de aplicaciones web modernas con React y Node.js',
        seller: {
          name: 'Juan Pérez',
          rating: 4.8,
          avatar: '👨‍💻'
        },
        price: 500,
        currency: 'GIG',
        category: 'development',
        deliveryTime: '5-7 días',
        orders: 23
      },
      {
        id: 2,
        title: 'Diseño UI/UX para Web3',
        description: 'Interfaces modernas y atractivas para proyectos blockchain',
        seller: {
          name: 'María García',
          rating: 5.0,
          avatar: '👩‍🎨'
        },
        price: 350,
        currency: 'GIG',
        category: 'design',
        deliveryTime: '3-5 días',
        orders: 45
      },
      {
        id: 3,
        title: 'Auditoría de Smart Contracts',
        description: 'Revisión completa de seguridad para contratos inteligentes',
        seller: {
          name: 'Carlos Tech',
          rating: 4.9,
          avatar: '🔐'
        },
        price: 800,
        currency: 'GIG',
        category: 'consulting',
        deliveryTime: '7-10 días',
        orders: 12
      },
      {
        id: 4,
        title: 'Marketing Digital Web3',
        description: 'Estrategia de marketing para proyectos crypto y NFT',
        seller: {
          name: 'Ana Marketing',
          rating: 4.7,
          avatar: '📱'
        },
        price: 400,
        currency: 'GIG',
        category: 'marketing',
        deliveryTime: '5-7 días',
        orders: 31
      },
      {
        id: 5,
        title: 'Redacción de Whitepapers',
        description: 'Documentación técnica profesional para proyectos blockchain',
        seller: {
          name: 'Pedro Writer',
          rating: 4.6,
          avatar: '📝'
        },
        price: 300,
        currency: 'GIG',
        category: 'writing',
        deliveryTime: '4-6 días',
        orders: 18
      },
      {
        id: 6,
        title: 'Desarrollo de Smart Contracts',
        description: 'Solidity, testing y deployment de contratos',
        seller: {
          name: 'Laura Dev',
          rating: 5.0,
          avatar: '⚡'
        },
        price: 600,
        currency: 'GIG',
        category: 'development',
        deliveryTime: '7-10 días',
        orders: 27
      }
    ];
    setServices(mockServices);
  }, []);

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePurchase = (serviceId) => {
    alert(`Función de compra en desarrollo. Service ID: ${serviceId}`);
  };

  return (
    <div className="marketplace-container">
      {/* Wallet Connection Banner */}
      <WalletBanner />
      
      <div className="marketplace-header">
        <h1 className="gradient-text">🛒 Marketplace GigChain</h1>
        <p className="marketplace-subtitle">Compra y vende servicios profesionales con tokens GIG</p>
        <div className="live-stats">
          <div className="stat-badge">
            <TrendingUp size={16} />
            <span>125 Active Listings</span>
          </div>
          <div className="stat-badge">
            <Zap size={16} />
            <span className="status-live">Live Trading</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="marketplace-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Buscar servicios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="category-filters">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span className="category-icon">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      <div className="services-grid">
        {filteredServices.length === 0 ? (
          <div className="empty-marketplace">
            <p>No se encontraron servicios con esos criterios.</p>
          </div>
        ) : (
          filteredServices.map(service => (
            <div key={service.id} className="service-card">
              <div className="service-header">
                <div className="seller-info">
                  <div className="seller-avatar">{service.seller.avatar}</div>
                  <div>
                    <h4>{service.seller.name}</h4>
                    <div className="rating">
                      <Star size={14} fill="gold" color="gold" />
                      <span>{service.seller.rating}</span>
                      <span className="orders">({service.orders} ventas)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="service-content">
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>

              <div className="service-footer">
                <div className="service-meta">
                  <div className="price-tag">
                    <DollarSign size={16} />
                    <strong>{service.price}</strong>
                    <span>{service.currency}</span>
                  </div>
                  <div className="delivery-time">
                    <Clock size={14} />
                    <span>{service.deliveryTime}</span>
                  </div>
                </div>
                <button 
                  className="purchase-btn"
                  onClick={() => handlePurchase(service.id)}
                >
                  <ShoppingCart size={18} />
                  Comprar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MarketplaceSimple;

