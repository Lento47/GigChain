import React, { useState, useEffect, lazy, Suspense } from 'react';
import { ThirdwebProvider, useAddress, useDisconnect } from '@thirdweb-dev/react';
import { Mumbai } from '@thirdweb-dev/chains';
import { MessageSquare, Eye, Send } from 'lucide-react';

// Import components from new structure (non-lazy for layout)
import { Sidebar, Header } from './components/layout';
import { DashboardView } from './views/Dashboard';
import { WalletConnection, ContractStatus } from './components/features';
import { NotificationCenter, NotificationProvider, useNotifications } from './components/common';
import { useWallet } from './hooks/useWallet';

// Lazy load views for code splitting (improves initial load time)
const TemplatesView = lazy(() => import('./views/Templates'));
const TransactionsView = lazy(() => import('./views/Transactions'));
const AIAgentsView = lazy(() => import('./views/AIAgents'));
const WalletsView = lazy(() => import('./views/Wallets'));
const PaymentsView = lazy(() => import('./views/Payments'));
const SettingsView = lazy(() => import('./views/Settings'));
const HelpView = lazy(() => import('./views/Help'));

// Lazy load home and legal pages (rarely accessed)
const HomePage = lazy(() => import('./views/Home'));
const TermsOfService = lazy(() => import('./views/Legal').then(module => ({ default: module.TermsOfService })));
const PrivacyPolicy = lazy(() => import('./views/Legal').then(module => ({ default: module.PrivacyPolicy })));
const ProhibitedActivities = lazy(() => import('./views/Legal').then(module => ({ default: module.ProhibitedActivities })));
const License = lazy(() => import('./views/Legal').then(module => ({ default: module.License })));
const CookieConsent = lazy(() => import('./components/common/CookieConsent/CookieConsent'));

// Import hooks and utilities
import { useDashboardMetrics } from './hooks/useDashboardMetrics';
import { truncateWalletAddress } from './utils/walletUtils';
import { API_BASE_URL } from './constants/api';
import { CONTRACT_TEMPLATES } from './constants/contractTemplates';
import { logger } from './utils/logger';

import './styles/index.css';

// Loading Fallback Component
const LoadingFallback = () => (
  <div className="loading-container" style={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    minHeight: '400px',
    color: '#94a3b8'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div className="spinner" style={{
        width: '40px',
        height: '40px',
        border: '4px solid #e2e8f0',
        borderTop: '4px solid #667eea',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 1rem'
      }}></div>
      <p>Cargando...</p>
    </div>
  </div>
);

// Chat AI Component (Memoized to prevent unnecessary re-renders)
const ChatAI = ({ isConnected, walletInfo }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: '¡Hola! Soy tu asistente de IA de GigChain. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !isConnected) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Simulate AI response
      setTimeout(() => {
        const aiResponse = {
          id: Date.now() + 1,
          type: 'assistant',
          content: `Entiendo que necesitas ayuda con: "${inputMessage}". Como asistente de GigChain, puedo ayudarte con contratos, negociaciones y gestión de proyectos. ¿Podrías ser más específico sobre lo que necesitas?`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      logger.error('Error sending chat message:', error);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-ai-container">
      <div className="chat-header">
        <h3>Chat AI - Asistente GigChain</h3>
        <div className="chat-status">
          {isConnected ? (
            <span className="status-connected">Conectado</span>
          ) : (
            <span className="status-disconnected">Desconectado</span>
          )}
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-content">
              <p>{message.content}</p>
              <span className="message-time">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message assistant">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="chat-input-container">
        <div className="chat-input">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje aquí..."
            disabled={!isConnected || isLoading}
            rows={1}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || !isConnected || isLoading}
            className="send-button"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Content Component (Memoized to prevent unnecessary re-renders)
const MainContent = React.memo(({ currentView, walletInfo, isConnected, onViewChange }) => {
  const { metrics, contracts, isLoading } = useDashboardMetrics();
  const [showJobsModal, setShowJobsModal] = useState(false);

  const renderView = () => {
    // Wrap lazy-loaded views in Suspense
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView 
            metrics={metrics}
            contracts={contracts}
            isLoading={isLoading}
            onShowJobs={() => setShowJobsModal(true)}
          />
        );
      case 'chat':
        return <ChatAI isConnected={isConnected} walletInfo={walletInfo} />;
      case 'contracts':
        return (
          <div className="contracts-view">
            <h2>Gestión de Contratos</h2>
            <ContractStatus />
          </div>
        );
      case 'analytics':
        return (
          <div className="analytics-view">
            <h2>Analíticas</h2>
          </div>
        );
      case 'templates':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <TemplatesView />
          </Suspense>
        );
      case 'transactions':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <TransactionsView />
          </Suspense>
        );
      case 'ai':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <AIAgentsView />
          </Suspense>
        );
      case 'wallets':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <WalletsView />
          </Suspense>
        );
      case 'payments':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <PaymentsView />
          </Suspense>
        );
      case 'settings':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <SettingsView />
          </Suspense>
        );
      case 'help':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <HelpView />
          </Suspense>
        );
      default:
        return (
          <DashboardView 
            metrics={metrics}
            contracts={contracts}
            isLoading={isLoading}
            onShowJobs={() => setShowJobsModal(true)}
          />
        );
    }
  };

  return (
    <div className="main-content">
      <Header 
        currentView={currentView}
        walletInfo={walletInfo}
        isConnected={isConnected}
      />
      
      <div className="content-body">
        {renderView()}
      </div>

      {showJobsModal && (
        <JobsModal 
          onClose={() => setShowJobsModal(false)}
          onApply={(job) => {
            logger.action('job_application', { jobId: job.id, title: job.title });
            setShowJobsModal(false);
          }}
        />
      )}
    </div>
  );
});

MainContent.displayName = 'MainContent';

// Internal App Component (uses Thirdweb hooks)
const InternalApp = () => {
  const [currentView, setCurrentView] = useState('home');
  const [walletInfo, setWalletInfo] = useState({ connected: false, address: null });
  const [isConnected, setIsConnected] = useState(false);
  const [showCookieConsent, setShowCookieConsent] = useState(false);

  const { 
    address, 
    isConnected: walletConnected, 
    isCorrectChain, 
    switchToCorrectChain, 
    isSwitching,
    disconnect 
  } = useWallet();

  useEffect(() => {
    if (address) {
      setWalletInfo({ connected: true, address });
      setIsConnected(true);
      // When user connects, switch to dashboard
      if (currentView === 'home') {
        setCurrentView('dashboard');
      }
    } else {
      setWalletInfo({ connected: false, address: null });
      setIsConnected(false);
    }
  }, [address]);

  useEffect(() => {
    // Check if cookie consent exists
    const consent = localStorage.getItem('gigchain_cookie_consent');
    if (!consent) {
      setShowCookieConsent(true);
    }
  }, []);

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  const handleGetStarted = () => {
    // Scroll to top and show wallet connection
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentView('dashboard');
  };

  const handleCookieAccept = (preferences) => {
    setShowCookieConsent(false);
  };

  // Prepare wallet state for NotificationProvider
  const walletState = {
    isConnected: walletConnected,
    isCorrectChain,
    switchToCorrectChain,
    isSwitching
  };

  // Render legal pages (lazy-loaded)
  if (currentView === 'terms') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <TermsOfService onClose={() => setCurrentView('home')} />
      </Suspense>
    );
  }
  if (currentView === 'privacy') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <PrivacyPolicy onClose={() => setCurrentView('home')} />
      </Suspense>
    );
  }
  if (currentView === 'prohibited') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <ProhibitedActivities onClose={() => setCurrentView('home')} />
      </Suspense>
    );
  }
  if (currentView === 'license') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <License onClose={() => setCurrentView('home')} />
      </Suspense>
    );
  }

  // Show home page if not connected (lazy-loaded)
  if (!isConnected && currentView === 'home') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <HomePage onGetStarted={handleGetStarted} onNavigate={handleViewChange} />
        {showCookieConsent && <CookieConsent onAccept={handleCookieAccept} />}
      </Suspense>
    );
  }

  // Show dashboard if connected
  return (
    <NotificationProvider walletState={walletState}>
      <div className="app">
        <Sidebar 
          currentView={currentView}
          onViewChange={handleViewChange}
          walletInfo={walletInfo}
          isConnected={isConnected}
        />
        
        <MainContent 
          currentView={currentView}
          walletInfo={walletInfo}
          isConnected={isConnected}
          onViewChange={handleViewChange}
        />
      </div>
      {showCookieConsent && <CookieConsent onAccept={handleCookieAccept} />}
    </NotificationProvider>
  );
};

// Main App Component (provides Thirdweb context)
const App = () => {
  return (
    <ThirdwebProvider
      activeChain={Mumbai}
      clientId={import.meta.env.VITE_THIRDWEB_CLIENT_ID}
    >
      <InternalApp />
    </ThirdwebProvider>
  );
};

export default App;
