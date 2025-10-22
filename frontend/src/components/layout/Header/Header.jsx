import React from 'react';
import { useLocation } from 'react-router-dom';
import WalletConnection from '../../features/Wallet/WalletConnection';
import { WalletAuthButton } from '../../features';
import ThemeToggle from '../../common/ThemeToggle/ThemeToggle';
import './Header.css';

const Header = ({ walletInfo, isConnected, client }) => {
  const location = useLocation();
  
  // Get current view from pathname
  const currentView = location.pathname.slice(1) || 'dashboard';
  
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
      case 'templates':
        return {
          title: 'Plantillas',
          subtitle: 'Plantillas de contratos inteligentes'
        };
      case 'transactions':
        return {
          title: 'Transacciones',
          subtitle: 'Historial de pagos y transacciones'
        };
      case 'ai':
        return {
          title: 'AI Agents',
          subtitle: 'Agentes inteligentes de GigChain'
        };
      case 'chat':
        return {
          title: 'Chat AI',
          subtitle: 'Asistente virtual de GigChain'
        };
      case 'wallets':
        return {
          title: 'Wallets',
          subtitle: 'Gestión de wallets y direcciones'
        };
      case 'payments':
        return {
          title: 'Pagos',
          subtitle: 'Sistema de pagos y transferencias'
        };
      case 'settings':
        return {
          title: 'Configuración',
          subtitle: 'Configuración general de la aplicación'
        };
      case 'help':
        return {
          title: 'Centro de Ayuda',
          subtitle: 'Encuentra respuestas y recursos útiles'
        };
      default:
        return {
          title: 'GigChain',
          subtitle: 'Plataforma descentralizada de freelancers'
        };
    }
  };

  const { title, subtitle } = getPageTitle();

  return (
    <header className="app-header">
      <div className="header-content">
        {/* Only show title/subtitle for pages with custom hero headers */}
        {currentView !== 'dashboard' && currentView !== 'analytics' && (
          <div className="header-info">
            <h1 className="page-title">{title}</h1>
            <p className="page-subtitle">{subtitle}</p>
          </div>
        )}
        
        <div className="header-actions">
          <div className="theme-toggle-container">
            <ThemeToggle size="small" />
          </div>
          
          <div className="wallet-container">
            <WalletConnection 
              onWalletChange={() => {}}
              className="header-wallet"
              showOptionalMessage={currentView === 'chat'}
              client={client}
            />
          </div>
          
          <div className="auth-container">
            <WalletAuthButton />
          </div>
        </div>
      </div>
    </header>
  );
};

export { Header };
export default Header;
