import React, { useState, useEffect } from 'react';
import { ThirdwebProvider, useAddress, useDisconnect } from '@thirdweb-dev/react';
import { Mumbai } from '@thirdweb-dev/chains';
import { MessageSquare, Eye, Send } from 'lucide-react';

// Import components from new structure
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { InteractiveChart } from './components/dashboard/InteractiveChart';
import { JobsModal } from './components/dashboard/JobsModal';
import WalletConnection from './components/WalletConnection';
// NetworkAlert removed - now handled in NotificationCenter
import ContractStatus from './components/ContractStatus';
import ThirdwebStatus from './components/ThirdwebStatus';
import StatsWidget, { RealTimeStats } from './components/StatsWidget';
import ChartWidget, { RevenueChart, ContractsChart } from './components/ChartWidget';
import NotificationCenter, { NotificationProvider, useNotifications } from './components/NotificationCenter';

// Import new views
import { TemplatesView } from './components/views/TemplatesView';
import { TransactionsView } from './components/views/TransactionsView';
import { AIAgentsView } from './components/views/AIAgentsView';
import { WalletsView } from './components/views/WalletsView';
import { PaymentsView } from './components/views/PaymentsView';
import { SettingsView } from './components/views/SettingsView';
import { HelpView } from './components/views/HelpView';
import { useWallet } from './hooks/useWallet';

// Import new home and legal pages
import HomePage from './components/HomePage';
import TermsOfService from './components/legal/TermsOfService';
import PrivacyPolicy from './components/legal/PrivacyPolicy';
import ProhibitedActivities from './components/legal/ProhibitedActivities';
import License from './components/legal/License';
import CookieConsent from './components/CookieConsent';

// Import hooks and utilities
import { useDashboardMetrics } from './hooks/useDashboardMetrics';
import { truncateWalletAddress } from './utils/walletUtils';
import { API_BASE_URL } from './constants/api';
import { CONTRACT_TEMPLATES } from './constants/contractTemplates';

import './styles/index.css';

// Chat AI Component
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
      console.error('Error sending message:', error);
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

// Main Content Component
const MainContent = ({ currentView, walletInfo, isConnected, onViewChange }) => {
  const { metrics, contracts, isLoading } = useDashboardMetrics();
  const [showJobsModal, setShowJobsModal] = useState(false);

  const renderView = () => {
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
            <div className="charts-container">
              <RevenueChart />
              <ContractsChart />
            </div>
          </div>
        );
      case 'templates':
        return <TemplatesView />;
      case 'transactions':
        return <TransactionsView />;
      case 'ai':
        return <AIAgentsView />;
      case 'wallets':
        return <WalletsView />;
      case 'payments':
        return <PaymentsView />;
      case 'settings':
        return <SettingsView />;
      case 'help':
        return <HelpView />;
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
            console.log('Applied to job:', job);
            setShowJobsModal(false);
          }}
        />
      )}
    </div>
  );
};

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

  // Render legal pages
  if (currentView === 'terms') {
    return <TermsOfService onClose={() => setCurrentView('home')} />;
  }
  if (currentView === 'privacy') {
    return <PrivacyPolicy onClose={() => setCurrentView('home')} />;
  }
  if (currentView === 'prohibited') {
    return <ProhibitedActivities onClose={() => setCurrentView('home')} />;
  }
  if (currentView === 'license') {
    return <License onClose={() => setCurrentView('home')} />;
  }

  // Show home page if not connected
  if (!isConnected && currentView === 'home') {
    return (
      <>
        <HomePage onGetStarted={handleGetStarted} onNavigate={handleViewChange} />
        {showCookieConsent && <CookieConsent onAccept={handleCookieAccept} />}
      </>
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
