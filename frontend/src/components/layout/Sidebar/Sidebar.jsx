import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAddress, useDisconnect } from '@thirdweb-dev/react';
import { BarChart3, FileText, Code, Zap, MessageSquare, Settings, Wallet, ChevronLeft, ChevronRight, Home, TrendingUp, Users, CreditCard } from 'lucide-react';
import { truncateWalletAddress } from '../../../utils/walletUtils';
import './Sidebar.css';

const Sidebar = ({ walletInfo, isConnected, isOpen = true, onToggle }) => {
  const address = useAddress();
  const disconnect = useDisconnect();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => {
    if (onToggle) {
      onToggle();
    }
  };

  // Get current view from pathname
  const currentView = location.pathname.slice(1) || 'dashboard';

  const navSections = [
    {
      title: 'Principal',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Home, description: 'Resumen general' },
        { id: 'analytics', label: 'Analíticas', icon: TrendingUp, description: 'Métricas y reportes' }
      ]
    },
    {
      title: 'Gestión',
      items: [
        { id: 'contracts', label: 'Contratos', icon: FileText, description: 'Gestionar contratos' },
        { id: 'templates', label: 'Plantillas', icon: Code, description: 'Plantillas de contratos' },
        { id: 'transactions', label: 'Transacciones', icon: CreditCard, description: 'Historial de pagos' }
      ]
    },
    {
      title: 'IA y Automatización',
      items: [
        { id: 'ai', label: 'AI Agents', icon: Zap, description: 'Agentes inteligentes' },
        { id: 'chat', label: 'Chat AI', icon: MessageSquare, description: 'Asistente virtual' }
      ]
    },
    {
      title: 'Herramientas',
      items: [
        { id: 'wallets', label: 'Wallets', icon: Wallet, description: 'Gestión de wallets' },
        { id: 'payments', label: 'Pagos', icon: CreditCard, description: 'Sistema de pagos' }
      ]
    }
  ];

  const bottomItems = [
    { id: 'settings', label: 'Configuración', icon: Settings, description: 'Configuración general' },
    { id: 'help', label: 'Ayuda', icon: MessageSquare, description: 'Centro de ayuda' }
  ];

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">G</div>
          <span className="logo-text">GigChain</span>
        </div>
        <button 
          className="sidebar-toggle" 
          onClick={toggleSidebar}
          aria-label={isOpen ? 'Contraer sidebar' : 'Expandir sidebar'}
          title={isOpen ? 'Contraer sidebar' : 'Expandir sidebar'}
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      <nav className="sidebar-content">
        {navSections.map((section, index) => (
          <div key={index} className="nav-section">
            <h4 className="section-title">{section.title}</h4>
            <div className="nav-items">
              {section.items.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    className={`nav-item ${currentView === item.id ? 'active' : ''}`}
                    onClick={() => navigate(`/${item.id}`)}
                    title={item.description}
                    aria-label={`${item.label} - ${item.description}`}
                  >
                    <IconComponent size={20} />
                    <div className="nav-content">
                      <span className="nav-label">{item.label}</span>
                      <span className="nav-description">{item.description}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="nav-section">
          <div className="nav-items">
            {bottomItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  className={`nav-item ${currentView === item.id ? 'active' : ''}`}
                  onClick={() => navigate(`/${item.id}`)}
                  title={item.description}
                  aria-label={`${item.label} - ${item.description}`}
                >
                  <IconComponent size={20} />
                  <div className="nav-content">
                    <span className="nav-label">{item.label}</span>
                    <span className="nav-description">{item.description}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="sidebar-footer">
        {walletInfo.connected && walletInfo.address && (
          <div className="user-info">
            <div className="user-avatar">
              {walletInfo.address.slice(0, 2).toUpperCase()}
            </div>
            <div className="user-details">
              <div className="user-name">
                {truncateWalletAddress(walletInfo.address)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { Sidebar };
export default Sidebar;
