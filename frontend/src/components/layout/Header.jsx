import React from 'react';
import { Search, RefreshCw, Bell } from 'lucide-react';
import WalletConnection from '../WalletConnection';
import NotificationCenter from '../NotificationCenter';

const Header = ({ currentView, walletInfo, isConnected }) => {
  const getPageTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return {
          title: 'Dashboard',
          subtitle: 'Resumen general de tu actividad en GigChain'
        };
      case 'analytics':
        return {
          title: 'Analíticas',
          subtitle: 'Métricas y reportes detallados'
        };
      case 'contracts':
        return {
          title: 'Contratos',
          subtitle: 'Gestiona tus contratos inteligentes'
        };
      case 'chat':
        return {
          title: 'Chat AI',
          subtitle: 'Asistente virtual de GigChain'
        };
      default:
        return {
          title: 'Dashboard',
          subtitle: 'Resumen general de tu actividad en GigChain'
        };
    }
  };

  const { title, subtitle } = getPageTitle();

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-info">
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
        
        <div className="header-actions">
          <div className="date-info">
            <span>Hoy: {new Date().toLocaleDateString('es-ES', { 
              day: 'numeric', 
              month: 'short', 
              year: 'numeric' 
            })}</span>
          </div>
          
          <button className="refresh-button" title="Actualizar datos">
            <RefreshCw size={18} />
            <span>Actualizar</span>
          </button>
          
          <div className="search-container">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="search-input"
            />
          </div>
          
          <div className="notifications-container">
            <NotificationCenter />
          </div>
          
          <div className="wallet-container">
            <WalletConnection 
              onWalletChange={() => {}}
              className="header-wallet"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export { Header };
export default Header;
