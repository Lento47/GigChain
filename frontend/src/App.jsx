import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ThirdwebProvider } from '@thirdweb-dev/react';

// Amoy Testnet (Mumbai replacement)
const Amoy = {
  chainId: 80002,
  name: 'Polygon Amoy Testnet',
  chain: 'Polygon',
  rpc: ['https://rpc-amoy.polygon.technology'],
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  shortName: 'amoy',
  slug: 'polygon-amoy-testnet',
  testnet: true,
};
import { MessageSquare, Eye, Send } from 'lucide-react';

// Import components from new structure (non-lazy for layout)
import { Sidebar, Header } from './components/layout';
import { DashboardView } from './views/Dashboard';
import { WalletConnection, ContractStatus } from './components/features';
import { NotificationCenter, NotificationProvider, useNotifications, ThemeToggle, NetworkAlert } from './components/common';
import { ToastProvider } from './components/common/Toast';
import { useWallet } from './hooks/useWallet';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load views for code splitting (improves initial load time)
const ContractsView = lazy(() => import('./views/Contracts'));
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
import './styles/chat-ai.css';

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
  const messagesEndRef = React.useRef(null);
  const textareaRef = React.useRef(null);

  // Sugerencias de preguntas
  const suggestions = [
    "¿Cómo crear un contrato inteligente?",
    "Explica el sistema de tokens GigSoul",
    "¿Qué son los AI Agents?",
    "¿Cómo funciona la negociación automática?"
  ];

  // Auto-scroll al final cuando hay nuevos mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputMessage]);

  const sendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim() || !isConnected) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Intentar conectar con el backend real
      const response = await fetch(`${API_BASE_URL}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          wallet_address: walletInfo?.address
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiResponse = {
          id: Date.now() + 1,
          type: 'assistant',
          content: data.response || data.message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
      } else {
        throw new Error('API response not ok');
      }
    } catch (error) {
      logger.error('Error sending chat message:', error);
      // Fallback a respuesta simulada si falla el backend
      const aiResponse = {
        id: Date.now() + 1,
        type: 'assistant',
        content: `Entiendo que necesitas ayuda con: "${messageText}". Como asistente de GigChain, puedo ayudarte con contratos inteligentes, negociaciones, gestión de proyectos y más. ¿Podrías ser más específico sobre lo que necesitas?`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  return (
    <div className="chat-ai-container">
      <div className="chat-header">
        <h3>Asistente GigChain</h3>
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
                {message.timestamp.toLocaleTimeString('es-ES', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
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

        {/* Mostrar sugerencias si solo hay el mensaje inicial */}
        {messages.length === 1 && !isLoading && (
          <div className="chat-suggestions">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="suggestion-chip"
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={!isConnected}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <div className="chat-input">
          <textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isConnected ? "Escribe tu mensaje aquí..." : "Conecta tu wallet para empezar..."}
            disabled={!isConnected || isLoading}
            rows={1}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!inputMessage.trim() || !isConnected || isLoading}
            className="send-button"
            aria-label="Enviar mensaje"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Wrapper components for routes
const DashboardRoute = () => {
  const { metrics, contracts, isLoading } = useDashboardMetrics();
  const [showJobsModal, setShowJobsModal] = useState(false);
  
  return (
    <DashboardView 
      metrics={metrics}
      contracts={contracts}
      isLoading={isLoading}
      onShowJobs={() => setShowJobsModal(true)}
    />
  );
};

const ChatRoute = ({ isConnected, walletInfo }) => {
  return <ChatAI isConnected={isConnected} walletInfo={walletInfo} />;
};

const ContractsRoute = () => {
  return <ContractsView />;
};

const AnalyticsRoute = () => {
  return (
    <div className="analytics-view">
      <h2>Analíticas</h2>
    </div>
  );
};

// Main Content Component (Memoized to prevent unnecessary re-renders)
const MainContent = React.memo(({ walletInfo, isConnected, sidebarOpen, walletHookData }) => {
  const location = useLocation();

  return (
    <div className={`main-content ${sidebarOpen ? '' : 'sidebar-closed'}`}>
      <Header 
        walletInfo={walletInfo}
        isConnected={isConnected}
      />
      
      {/* Network Alert - Shows when user is on wrong chain */}
      {isConnected && walletHookData && (
        <NetworkAlert
          isCorrectChain={walletHookData.isCorrectChain}
          switchToCorrectChain={walletHookData.switchToCorrectChain}
          isSwitching={walletHookData.isSwitching}
          targetChain={walletHookData.targetChain}
        />
      )}
      
      <div className="content-body">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardRoute />} />
            <Route path="/chat" element={<ChatRoute isConnected={isConnected} walletInfo={walletInfo} />} />
            <Route path="/contracts" element={<ContractsRoute />} />
            <Route path="/analytics" element={<AnalyticsRoute />} />
            <Route path="/templates" element={<TemplatesView />} />
            <Route path="/transactions" element={<TransactionsView />} />
            <Route path="/ai" element={<AIAgentsView />} />
            <Route path="/wallets" element={<WalletsView />} />
            <Route path="/payments" element={<PaymentsView />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="/help" element={<HelpView />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
});

MainContent.displayName = 'MainContent';

// Internal App Component (uses Thirdweb hooks)
const InternalApp = () => {
  const [walletInfo, setWalletInfo] = useState({ connected: false, address: null });
  const [isConnected, setIsConnected] = useState(false);
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Safe wallet hook usage with error boundary
  let walletHook;
  try {
    walletHook = useWallet();
  } catch (error) {
    console.warn('Wallet hook failed, using fallback state:', error);
    walletHook = {
      address: undefined,
      isConnected: false,
      isCorrectChain: false,
      switchToCorrectChain: () => Promise.resolve(),
      isSwitching: false,
      disconnect: () => Promise.resolve(),
      targetChain: { name: 'Polygon Amoy Testnet', chainId: 80002 }
    };
  }

  const { 
    address, 
    isConnected: walletConnected, 
    isCorrectChain, 
    switchToCorrectChain, 
    isSwitching, 
    disconnect,
    targetChain
  } = walletHook;

  useEffect(() => {
    if (address) {
      setWalletInfo({ connected: true, address });
      setIsConnected(true);
      // When user connects, switch to dashboard if on home
      if (location.pathname === '/home' || location.pathname === '/') {
        navigate('/dashboard');
      }
    } else {
      setWalletInfo({ connected: false, address: null });
      setIsConnected(false);
    }
  }, [address, location.pathname, navigate]);

  useEffect(() => {
    // Check if cookie consent exists
    const consent = localStorage.getItem('gigchain_cookie_consent');
    if (!consent) {
      setShowCookieConsent(true);
    }
  }, []);

  const handleGetStarted = () => {
    // Scroll to top and show wallet connection
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate('/dashboard');
  };

  const handleCookieAccept = (preferences) => {
    setShowCookieConsent(false);
  };

  // Prepare wallet state for NotificationProvider
  const notificationWalletState = {
    isConnected: walletConnected,
    isCorrectChain,
    switchToCorrectChain,
    isSwitching
  };

  // Show dashboard if connected
  return (
    <NotificationProvider walletState={notificationWalletState}>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Legal pages routes */}
          <Route path="/terms" element={<TermsOfService onClose={() => navigate('/home')} />} />
          <Route path="/privacy" element={<PrivacyPolicy onClose={() => navigate('/home')} />} />
          <Route path="/prohibited" element={<ProhibitedActivities onClose={() => navigate('/home')} />} />
          <Route path="/license" element={<License onClose={() => navigate('/home')} />} />
          
          {/* Home page route */}
          <Route path="/home" element={
            !isConnected ? (
              <HomePage onGetStarted={handleGetStarted} onNavigate={(view) => navigate(`/${view}`)} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } />
          
          {/* Main app routes */}
          <Route path="/*" element={
            <div className="app">
              <Sidebar 
                walletInfo={walletInfo}
                isConnected={isConnected}
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
              />
              
              <MainContent 
                walletInfo={walletInfo}
                isConnected={isConnected}
                sidebarOpen={sidebarOpen}
                walletHookData={{
                  isCorrectChain,
                  switchToCorrectChain,
                  isSwitching,
                  targetChain
                }}
              />
            </div>
          } />
        </Routes>
      </Suspense>
      {showCookieConsent && <CookieConsent onAccept={handleCookieAccept} />}
    </NotificationProvider>
  );
};

// Main App Component (provides Thirdweb context)
const App = () => {
  // Get clientId from env, use undefined if not set (allows development without Thirdweb)
  const clientId = import.meta.env.VITE_THIRDWEB_CLIENT_ID || undefined;

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
        <BrowserRouter>
          <ThirdwebProvider
            activeChain={Amoy}
            clientId={clientId}
            supportedChains={[Amoy]}
              dAppMeta={{
                name: "GigChain",
                description: "Decentralized Freelance Platform",
                logoUrl: "https://gigchain.io/logo.png",
                url: "https://gigchain.io",
                isDarkMode: true,
              }}
            >
              <InternalApp />
            </ThirdwebProvider>
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
