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
const FeedView = lazy(() => import('./pages/Feed/EnhancedFeed'));
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
const ChatAI = ({ isConnected, walletInfo, hasThirdwebClient }) => {
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
      // Only attempt backend connection if Thirdweb client is configured
      if (hasThirdwebClient) {
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
          return;
        }
      }
      
      // Fallback response when Thirdweb client is not configured or API fails
      const aiResponse = {
        id: Date.now() + 1,
        type: 'assistant',
        content: hasThirdwebClient 
          ? `Entiendo que necesitas ayuda con: "${messageText}". Como asistente de GigChain, puedo ayudarte con contratos inteligentes, negociaciones, gestión de proyectos y más. ¿Podrías ser más específico sobre lo que necesitas?`
          : `Hola! Soy tu asistente de GigChain. Para habilitar todas las funcionalidades, por favor configura tu ThirdWeb Client ID. Mientras tanto, puedo ayudarte con información general sobre contratos inteligentes y Web3. ¿En qué puedo ayudarte?`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
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
          {!hasThirdwebClient && (
            <span className="status-warning" style={{ 
              marginLeft: '8px', 
              fontSize: '0.8rem', 
              color: '#f59e0b',
              background: 'rgba(245, 158, 11, 0.1)',
              padding: '2px 6px',
              borderRadius: '4px'
            }}>
              ⚠️ ThirdWeb no configurado
            </span>
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
            {!hasThirdwebClient && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '1rem', 
                background: 'rgba(245, 158, 11, 0.1)', 
                borderRadius: '8px',
                border: '1px solid rgba(245, 158, 11, 0.2)'
              }}>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#f59e0b' }}>
                  <strong>⚠️ ThirdWeb no configurado</strong>
                </p>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', opacity: 0.8 }}>
                  Para habilitar todas las funcionalidades de wallet y Web3, configura tu ThirdWeb Client ID.
                </p>
                <a 
                  href="/THIRDWEB_SETUP.md" 
                  target="_blank"
                  style={{
                    color: '#06b6d4',
                    textDecoration: 'none',
                    fontSize: '0.8rem',
                    fontWeight: '500'
                  }}
                >
                  📖 Ver guía de configuración →
                </a>
              </div>
            )}
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

const ChatRoute = ({ isConnected, walletInfo, hasThirdwebClient }) => {
  return <ChatAI isConnected={isConnected} walletInfo={walletInfo} hasThirdwebClient={hasThirdwebClient} />;
};

const ContractsRoute = () => {
  return <ContractsView />;
};

const AnalyticsRoute = () => {
  return <AnalyticsView />;
};

// Main Content Component (Memoized to prevent unnecessary re-renders)
const MainContent = React.memo(({ walletInfo, isConnected, sidebarOpen, isMobile, walletHookData, client, hasThirdwebClient }) => {
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
            <Route path="/chat" element={<ChatRoute isConnected={isConnected} walletInfo={walletInfo} hasThirdwebClient={hasThirdwebClient} />} />
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
      targetChain: { name: 'Polygon Amoy Testnet', chainId: 80002 },
      hasThirdwebClient: false
    };
  }

  const { 
    address, 
    isConnected: walletConnected, 
    isCorrectChain, 
    switchToCorrectChain, 
    isSwitching, 
    disconnect,
    targetChain,
    hasThirdwebClient
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
                  hasThirdwebClient={hasThirdwebClient}
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
      console.log('🚫 Thirdweb event endpoints will be suppressed to prevent 401 errors');
    } else {
      console.log('✅ Thirdweb Client ID configured successfully:', clientId?.slice(0, 8) + '...');
      console.log('✅ Thirdweb event endpoints enabled');
    }
  }, [clientId]);

  if (!client) {
    // Enhanced fallback when no client ID is configured
    return (
      <ErrorBoundary>
        <ThemeProvider>
          <ToastProvider>
            <QueryClientProvider client={queryClient}>
              <BrowserRouter>
                <div className="no-client-fallback" style={{ 
                  padding: '40px 20px', 
                  textAlign: 'center',
                  minHeight: '100vh',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                  color: '#ffffff'
                }}>
                  <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <div style={{ 
                      fontSize: '4rem', 
                      marginBottom: '1rem',
                      opacity: 0.8
                    }}>🔧</div>
                    <h1 style={{ 
                      fontSize: '2.5rem', 
                      marginBottom: '1rem',
                      fontWeight: '600',
                      background: 'linear-gradient(45deg, #4f46e5, #06b6d4)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      ThirdWeb Configuration Required
                    </h1>
                    <p style={{ 
                      fontSize: '1.2rem', 
                      marginBottom: '2rem',
                      opacity: 0.8,
                      lineHeight: '1.6'
                    }}>
                      To enable wallet connectivity and Web3 features, please configure your ThirdWeb Client ID.
                    </p>
                    
                    <div style={{ 
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      padding: '2rem',
                      marginBottom: '2rem',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <h3 style={{ marginBottom: '1rem', color: '#4f46e5' }}>Quick Setup:</h3>
                      <ol style={{ 
                        textAlign: 'left', 
                        marginBottom: '1.5rem',
                        lineHeight: '1.8'
                      }}>
                        <li>Get your Client ID from <a href="https://thirdweb.com/dashboard" target="_blank" rel="noopener noreferrer" style={{ color: '#06b6d4', textDecoration: 'none' }}>thirdweb.com/dashboard</a></li>
                        <li>Create <code style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>frontend/.env</code> file</li>
                        <li>Add: <code style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>VITE_THIRDWEB_CLIENT_ID=your_client_id</code></li>
                        <li>Restart the development server</li>
                      </ol>
                    </div>
                    
                    <div style={{ marginBottom: '2rem' }}>
                      <a 
                        href="/THIRDWEB_SETUP.md" 
                        target="_blank"
                        style={{
                          display: 'inline-block',
                          background: 'linear-gradient(45deg, #4f46e5, #06b6d4)',
                          color: 'white',
                          padding: '12px 24px',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          fontWeight: '500',
                          marginRight: '1rem'
                        }}
                      >
                        📖 View Setup Guide
                      </a>
                      <button 
                        onClick={() => window.location.reload()}
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          color: 'white',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          padding: '12px 24px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        🔄 Refresh Page
                      </button>
                    </div>
                    
                    <div style={{ 
                      fontSize: '0.9rem', 
                      opacity: 0.6,
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <strong>Note:</strong> The application will work in limited mode without ThirdWeb configuration, 
                      but wallet features and Web3 interactions will be disabled.
                    </div>
                  </div>
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
