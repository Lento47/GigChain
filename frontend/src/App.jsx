import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ThirdwebProvider, ConnectButton } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import { polygonAmoy } from "thirdweb/chains";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MessageSquare, Eye, Send } from 'lucide-react';

// Import components from new structure (non-lazy for layout)
import { Sidebar, Header } from './components/layout';
import { MobileBottomNav } from './components/layout/MobileNav';
import { DashboardView } from './views/Dashboard';
import { AnalyticsView } from './views/Analytics';
import { WalletConnection, ContractStatus } from './components/features';
import { NotificationCenter, NotificationProvider, useNotifications, ThemeToggle, NetworkAlert } from './components/common';
import ProtectedRoute, { AuthenticationRequired, useRouteProtection } from './components/auth/ProtectedRoute';
import { ToastProvider } from './components/common/Toast';
import { useWallet } from './hooks/useWallet';
import { useResponsive, useSwipeGesture } from './hooks/useResponsive';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import { LoadingSpinner, PageLoading, SkeletonDashboard } from './components/ui/Loading';
import mobileDebugger from './utils/mobileDebugger';

// Lazy load views for code splitting (improves initial load time)
const ContractsView = lazy(() => import('./views/Contracts'));
const TemplatesView = lazy(() => import('./views/Templates'));
const TransactionsView = lazy(() => import('./views/Transactions'));
const AIAgentsView = lazy(() => import('./views/AIAgents'));
const WalletsView = lazy(() => import('./views/Wallets'));
const PaymentsView = lazy(() => import('./views/Payments'));
const SettingsView = lazy(() => import('./views/Settings'));
const HelpView = lazy(() => import('./views/Help'));

// Lazy load social network pages (Red Social GigChain)
const FeedView = lazy(() => import('./pages/Feed/FeedSimple'));
const MarketplaceView = lazy(() => import('./pages/Marketplace/MarketplaceSimple'));
const DAOView = lazy(() => import('./pages/DAO/DAOSimple'));
const StakingView = lazy(() => import('./pages/Staking/StakingSimple'));

// Social network pages (Simple versions without wagmi dependency)
const MessagesView = lazy(() => import('./pages/Messages/MessagesSimple'));
const ConnectionsView = lazy(() => import('./pages/Connections/ConnectionsSimple'));
const ProfileView = lazy(() => import('./pages/Profile/ProfileSimple'));
const CreatePostView = lazy(() => import('./pages/CreatePost/CreatePostSimple'));

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
import './styles/web3-theme.css';
import './styles/chat-ai.css';
import './components/auth/ProtectedRoute.css';

// Enhanced Loading Fallback Component
const LoadingFallback = ({ type = 'spinner', message = 'Cargando...' }) => {
  if (type === 'skeleton') {
    return <SkeletonDashboard />;
  }
  
  return (
    <LoadingSpinner 
      size="lg" 
      message={message} 
      className="loading-fallback"
    />
  );
};

// Smart Redirect Component - Intelligently redirects based on wallet state
const SmartRedirect = () => {
  const { address, isConnected, isCorrectChain, isInitializing } = useWallet();
  const navigate = useNavigate();
  
  // Wait for wallet to initialize before making decisions
  React.useEffect(() => {
    if (isInitializing) {
      return; // Don't redirect while initializing
    }
    
    // Check if wallet is connected and on correct chain
    const canAccess = isConnected && address && /^0x[a-fA-F0-9]{40}$/.test(address) && isCorrectChain;
    
    if (canAccess) {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/home', { replace: true });
    }
  }, [isConnected, address, isCorrectChain, isInitializing, navigate]);
  
  // Return null to avoid any flash while redirecting
  return null;
};

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
  return <AnalyticsView />;
};

// Main Content Component (Memoized to prevent unnecessary re-renders)
const MainContent = React.memo(({ walletInfo, isConnected, sidebarOpen, isMobile, walletHookData, client }) => {
  const location = useLocation();

  return (
    <div className={`main-content ${sidebarOpen ? '' : 'sidebar-closed'} ${isMobile ? 'mobile-layout' : ''}`}>
      <Header 
        walletInfo={walletInfo}
        isConnected={isConnected}
        client={client}
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
            
            {/* Red Social GigChain Routes */}
            <Route path="/feed" element={<FeedView />} />
            <Route path="/messages" element={<MessagesView />} />
            <Route path="/connections" element={<ConnectionsView />} />
            <Route path="/profile" element={<ProfileView />} />
            <Route path="/create-post" element={<CreatePostView />} />
            <Route path="/marketplace" element={<MarketplaceView />} />
            <Route path="/dao" element={<DAOView />} />
            <Route path="/staking" element={<StakingView />} />
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
});

MainContent.displayName = 'MainContent';

// Internal App Component (uses Thirdweb hooks)
const InternalApp = ({ client }) => {
  const [walletInfo, setWalletInfo] = useState({ connected: false, address: null });
  const [isConnected, setIsConnected] = useState(false);
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobileDevice, isTouchDevice } = useResponsive();
  const { authStatus } = useRouteProtection();

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

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobileDevice) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobileDevice]);

  // Swipe gesture for mobile sidebar
  const swipeHandlers = useSwipeGesture(
    () => {
      // Swipe left - close sidebar
      if (isMobileDevice && sidebarOpen) {
        setSidebarOpen(false);
      }
    },
    () => {
      // Swipe right - open sidebar
      if (isMobileDevice && !sidebarOpen) {
        setSidebarOpen(true);
      }
    }
  );

  const handleGetStarted = () => {
    // Only navigate to dashboard if properly authenticated
    if (authStatus.canAccess) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      navigate('/dashboard');
    } else {
      // Show authentication requirement
      console.log('Cannot access dashboard:', authStatus.reason);
    }
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
      <Suspense fallback={<LoadingFallback type="skeleton" message="Loading application..." />}>
        <Routes>
          {/* Legal pages routes */}
          <Route path="/terms" element={<TermsOfService onClose={() => navigate('/home')} />} />
          <Route path="/privacy" element={<PrivacyPolicy onClose={() => navigate('/home')} />} />
          <Route path="/prohibited" element={<ProhibitedActivities onClose={() => navigate('/home')} />} />
          <Route path="/license" element={<License onClose={() => navigate('/home')} />} />
          
          {/* Home page route - Always accessible but shows different content based on auth state */}
          <Route path="/home" element={
            <HomePage 
              onGetStarted={handleGetStarted} 
              onNavigate={(view) => navigate(`/${view}`)}
              authStatus={authStatus}
              locationState={location.state}
              client={client}
            />
          } />
          
          {/* Protected app routes - Require wallet authentication */}
          <Route path="/*" element={
            <ProtectedRoute requireCorrectChain={true}>
              <div className="app" {...(isTouchDevice ? swipeHandlers : {})}>
                <Sidebar 
                  walletInfo={walletInfo}
                  isConnected={isConnected}
                  isOpen={sidebarOpen}
                  onToggle={() => setSidebarOpen(!sidebarOpen)}
                />
                
                {/* Sidebar overlay for mobile */}
                {isMobileDevice && sidebarOpen && (
                  <div 
                    className="sidebar-overlay" 
                    onClick={() => setSidebarOpen(false)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Escape' && setSidebarOpen(false)}
                    aria-label="Close sidebar"
                  />
                )}
                
                <MainContent 
                  walletInfo={walletInfo}
                  isConnected={isConnected}
                  sidebarOpen={sidebarOpen}
                  isMobile={isMobileDevice}
                  walletHookData={{
                    isCorrectChain,
                    switchToCorrectChain,
                    isSwitching,
                    targetChain
                  }}
                  client={client}
                />
                
                {/* Mobile Bottom Navigation */}
                {isMobileDevice && (
                  <MobileBottomNav 
                    onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
                    isMenuOpen={sidebarOpen}
                  />
                )}
              </div>
            </ProtectedRoute>
          } />
          
          {/* Fallback route - Smart redirect based on authentication status */}
          <Route path="*" element={<SmartRedirect />} />
        </Routes>
      </Suspense>
      {showCookieConsent && <CookieConsent onAccept={handleCookieAccept} />}
    </NotificationProvider>
  );
};

// Custom QueryClient that works with Thirdweb
const createCompatibleQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {}, // Suppress query errors from showing in console
    },
  });
};

// Main App Component (provides Thirdweb context)
const App = () => {
  // Get clientId from env - NO fallback hardcoded
  const clientId = import.meta.env.VITE_TEMPLATE_CLIENT_ID || import.meta.env.VITE_THIRDWEB_CLIENT_ID;
  
  // Create QueryClient instance
  const [queryClient] = useState(() => createCompatibleQueryClient());

  // Create Thirdweb client
  const client = clientId ? createThirdwebClient({
    clientId: clientId,
  }) : null;

  // Log client ID status for debugging
  useEffect(() => {
    // Initialize mobile debugger
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      mobileDebugger.log('📱 GigChain App loaded on iOS');
      mobileDebugger.log(`🏠 URL: ${window.location.href}`);
      mobileDebugger.log(`🔧 Client ID: ${clientId ? 'Configured' : 'Missing'}`);
    }
    
    if (!clientId) {
      console.warn('VITE_TEMPLATE_CLIENT_ID or VITE_THIRDWEB_CLIENT_ID not configured. Some wallet features may be limited.');
      console.log('Current env variables:', {
        VITE_TEMPLATE_CLIENT_ID: import.meta.env.VITE_TEMPLATE_CLIENT_ID,
        VITE_THIRDWEB_CLIENT_ID: import.meta.env.VITE_THIRDWEB_CLIENT_ID
      });
    } else {
      console.log('✅ Thirdweb Client ID configured successfully:', clientId?.slice(0, 8) + '...');
    }
  }, [clientId]);

  if (!client) {
    // Fallback when no client ID is configured
    return (
      <ErrorBoundary>
        <ThemeProvider>
          <ToastProvider>
            <QueryClientProvider client={queryClient}>
              <BrowserRouter>
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <h3>Configuration Required</h3>
                  <p>Please configure VITE_THIRDWEB_CLIENT_ID environment variable.</p>
                </div>
              </BrowserRouter>
            </QueryClientProvider>
          </ToastProvider>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <ThirdwebProvider>
                <InternalApp client={client} />
              </ThirdwebProvider>
            </BrowserRouter>
          </QueryClientProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
