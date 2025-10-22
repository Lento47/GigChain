import React, { useState, useEffect } from 'react';
import { Shield, Zap, Lock, Users, FileCheck, TrendingUp, CheckCircle, Globe, Award, ChevronDown, Wallet, ArrowRight, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet';
import { AuthenticationRequired } from '../../components/auth/ProtectedRoute';
import SimpleWalletConnection from '../../components/features/Wallet/SimpleWalletConnection';
import HomeNavbar from './HomeNavbar';
import Footer from './Footer';
import './home-page.css';
import './auth-enhancements.css';

const HomePage = ({ onGetStarted, onNavigate, authStatus, locationState, client }) => {
  const { address, isConnected, isInitializing, isCorrectChain, switchToCorrectChain, isSwitching, targetChain } = useWallet();
  const navigate = useNavigate();
  const [showAuthRequired, setShowAuthRequired] = useState(false);
  const [showWalletConnection, setShowWalletConnection] = useState(false);
  
  // IMMEDIATE REDIRECT: If already authenticated, go to dashboard before rendering
  useEffect(() => {
    // Don't redirect while wallet is still initializing
    if (isInitializing) {
      return;
    }
    
    const canAccess = isConnected && address && /^0x[a-fA-F0-9]{40}$/.test(address) && isCorrectChain;
    if (canAccess) {
      navigate('/dashboard', { replace: true });
    }
  }, [isConnected, address, isCorrectChain, isInitializing, navigate]);

  // Check if user was redirected here due to authentication issues
  useEffect(() => {
    if (locationState?.reason) {
      setShowAuthRequired(true);
      console.log('User redirected to home due to:', locationState.reason);
      
      // Auto-show wallet connection modal for better UX
      if (locationState.reason === 'wallet_not_connected') {
        setShowWalletConnection(true);
      }
    }
  }, [locationState]);

  // Handle wallet connection attempt
  const handleConnectWallet = async () => {
    try {
      console.log('Opening wallet connection interface...');
      setShowWalletConnection(true);
    } catch (error) {
      console.error('Error opening wallet connection:', error);
    }
  };

  // Handle network switch
  const handleSwitchNetwork = async () => {
    try {
      await switchToCorrectChain();
      setShowAuthRequired(false);
    } catch (error) {
      console.error('Error switching network:', error);
    }
  };

  // Handle successful wallet connection
  const handleWalletConnectionSuccess = ({ address, walletInfo, chainId }) => {
    console.log('✅ Wallet connection successful:', { address, chainId });
    setShowWalletConnection(false);
    setShowAuthRequired(false);
    // Call the onGetStarted callback to navigate to dashboard
    if (onGetStarted) {
      onGetStarted();
    }
  };

  // Close wallet connection modal
  const handleCloseWalletConnection = () => {
    setShowWalletConnection(false);
  };

  // Get appropriate action based on auth state
  const getAuthAction = () => {
    if (!isConnected) {
      return {
        text: 'Connect Wallet to Continue',
        icon: <Wallet size={20} />,
        action: handleConnectWallet,
        disabled: false
      };
    }
    
    if (!isCorrectChain) {
      return {
        text: `Switch to ${targetChain?.name}`,
        icon: <Globe size={20} />,
        action: handleSwitchNetwork,
        disabled: isSwitching
      };
    }
    
    return {
      text: 'Enter Platform',
      icon: <ArrowRight size={20} />,
      action: onGetStarted,
      disabled: false
    };
  };

  const authAction = getAuthAction();
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      
      // Intersection Observer for fade-in animations
      const sections = document.querySelectorAll('.animate-on-scroll');
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const isInView = rect.top < window.innerHeight * 0.8;
        if (isInView) {
          section.classList.add('visible');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <Shield className="feature-icon" />,
      title: "Contratos Inteligentes Seguros",
      description: "Contratos auditados y verificados en blockchain, eliminando intermediarios y garantizando pagos automáticos.",
      color: "#4F46E5"
    },
    {
      icon: <Zap className="feature-icon" />,
      title: "IA para Negociación",
      description: "Agentes AI que negocian términos, resuelven disputas y optimizan acuerdos en tiempo real.",
      color: "#7C3AED"
    },
    {
      icon: <Lock className="feature-icon" />,
      title: "Depósito en Garantía (Escrow)",
      description: "Fondos bloqueados en smart contracts hasta completar el trabajo, protegiendo a ambas partes.",
      color: "#EC4899"
    },
    {
      icon: <Users className="feature-icon" />,
      title: "Red de Confianza",
      description: "Sistema de reputación on-chain inmutable con verificación de identidad descentralizada.",
      color: "#10B981"
    },
    {
      icon: <FileCheck className="feature-icon" />,
      title: "Plantillas Verificadas",
      description: "Contratos pre-auditados para diferentes tipos de trabajo, listos para usar.",
      color: "#F59E0B"
    },
    {
      icon: <TrendingUp className="feature-icon" />,
      title: "Pagos Globales Instantáneos",
      description: "Recibe pagos en USDC/USDT sin comisiones bancarias ni demoras internacionales.",
      color: "#06B6D4"
    }
  ];

  const securityFeatures = [
    {
      title: "Encriptación End-to-End",
      description: "Todos los mensajes y documentos protegidos con encriptación AES-256"
    },
    {
      title: "Auditorías de Smart Contracts",
      description: "Contratos auditados por firmas de seguridad blockchain certificadas"
    },
    {
      title: "Fondos Multi-Firma",
      description: "Wallets multi-sig para máxima protección de fondos en escrow"
    },
    {
      title: "KYC/AML Descentralizado",
      description: "Verificación de identidad sin revelar datos personales (Zero-Knowledge Proofs)"
    }
  ];

  const trustBuilders = [
    {
      icon: <Award className="trust-icon" />,
      title: "Reputación Inmutable",
      stat: "100% On-Chain",
      description: "Tu historial de trabajos es permanente y verificable"
    },
    {
      icon: <Globe className="trust-icon" />,
      title: "Transparencia Total",
      stat: "Open Source",
      description: "Código y contratos auditables públicamente"
    },
    {
      icon: <CheckCircle className="trust-icon" />,
      title: "Protección Garantizada",
      stat: "$10M+ Asegurados",
      description: "Fondos protegidos por smart contracts inmutables"
    }
  ];

  return (
    <div className="home-page">
      {/* Navbar */}
      <HomeNavbar onGetStarted={onGetStarted} authAction={authAction} />
      
      {/* Hero Section */}
      <section className="hero-section" id="hero">
        <div className="hero-background">
          <div className="gradient-orb orb-1" style={{ transform: `translateY(${scrollY * 0.3}px)` }}></div>
          <div className="gradient-orb orb-2" style={{ transform: `translateY(${scrollY * 0.5}px)` }}></div>
          <div className="gradient-orb orb-3" style={{ transform: `translateY(${scrollY * 0.2}px)` }}></div>
          <img 
            src="/assets/blockchain-chain.jpg" 
            alt="Blockchain Chain" 
            className="hero-chain-image"
            style={{ transform: `translateY(${scrollY * 0.4}px) rotate(${scrollY * 0.05}deg)` }}
          />
        </div>
        
        <div className="hero-content">
          <div className="hero-badge animate-fade-in">
            <Shield size={16} />
            <span>Plataforma Web3 de Trabajo Freelance</span>
          </div>
          
          <h1 className="hero-title animate-fade-in-up">
            Trabajo Freelance <br />
            <span className="gradient-text">Sin Intermediarios, Solo Confianza</span>
          </h1>
          
          <p className="hero-subtitle animate-fade-in-up delay-1">
            Contratos inteligentes, pagos automáticos y IA para negociación. <br />
            Bienvenido al futuro del trabajo descentralizado.
          </p>
          
          <div className="hero-cta animate-fade-in-up delay-2">
            <button 
              className={`cta-primary ${authAction.disabled ? 'disabled' : ''}`}
              onClick={authAction.action}
              disabled={authAction.disabled}
            >
              {authAction.icon}
              {authAction.text}
            </button>
            <button className="cta-secondary">
              Ver Demo
            </button>
            
            {/* Show authentication status if needed */}
            {showAuthRequired && locationState && (
              <div className="auth-status-banner">
                <AlertTriangle size={16} />
                <span>{locationState.message}</span>
              </div>
            )}
          </div>

          <div className="hero-stats animate-fade-in-up delay-3">
            <div className="stat">
              <div className="stat-value">$2.5M+</div>
              <div className="stat-label">En Contratos Procesados</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <div className="stat-value">5,000+</div>
              <div className="stat-label">Freelancers Activos</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <div className="stat-value">99.8%</div>
              <div className="stat-label">Tasa de Éxito</div>
            </div>
          </div>
        </div>

        <div className="scroll-indicator">
          <ChevronDown className="bounce" />
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="section-header animate-on-scroll">
          <h2 className="section-title">¿Qué Hace GigChain Diferente?</h2>
          <p className="section-subtitle">
            Tecnología blockchain y AI trabajando juntas para revolucionar el freelancing
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="feature-card animate-on-scroll"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="feature-icon-wrapper" style={{ backgroundColor: `${feature.color}20` }}>
                <div style={{ color: feature.color }}>
                  {feature.icon}
                </div>
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
              
              <div className="feature-animation">
                <div className="pulse-ring" style={{ borderColor: feature.color }}></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Security Section with Special Animation */}
      <section className="security-section" id="security">
        <div className="security-container">
          <div className="security-visual animate-on-scroll">
            <div className="security-shield">
              <Shield className="shield-icon" />
              <div className="shield-pulse"></div>
              <div className="shield-orbit orbit-1">
                <Lock size={20} />
              </div>
              <div className="shield-orbit orbit-2">
                <FileCheck size={20} />
              </div>
              <div className="shield-orbit orbit-3">
                <CheckCircle size={20} />
              </div>
            </div>
            
            <div className="security-particles">
              {[...Array(20)].map((_, i) => (
                <div 
                  key={i} 
                  className="particle"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${2 + Math.random() * 2}s`
                  }}
                ></div>
              ))}
            </div>
          </div>

          <div className="security-content animate-on-scroll">
            <div className="section-badge">
              <Lock size={16} />
              <span>Seguridad de Nivel Empresarial</span>
            </div>
            
            <h2 className="section-title">
              Tu Seguridad es <br />
              <span className="gradient-text">Nuestra Prioridad #1</span>
            </h2>
            
            <p className="section-description">
              Utilizamos las tecnologías más avanzadas de blockchain y criptografía 
              para garantizar que tus fondos, datos y reputación estén siempre protegidos.
            </p>

            <div className="security-features-list">
              {securityFeatures.map((item, index) => (
                <div 
                  key={index} 
                  className="security-item"
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  <div className="security-check">
                    <CheckCircle size={20} />
                  </div>
                  <div className="security-info">
                    <h4>{item.title}</h4>
                    <p>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="security-stats">
              <div className="security-stat">
                <div className="security-stat-value">0</div>
                <div className="security-stat-label">Brechas de Seguridad</div>
              </div>
              <div className="security-stat">
                <div className="security-stat-value">24/7</div>
                <div className="security-stat-label">Monitoreo Activo</div>
              </div>
              <div className="security-stat">
                <div className="security-stat-value">100%</div>
                <div className="security-stat-label">Fondos Recuperables</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Advantages Section */}
      <section className="trust-section">
        <div className="section-header animate-on-scroll">
          <h2 className="section-title">Construido Sobre Confianza</h2>
          <p className="section-subtitle">
            La blockchain elimina la necesidad de confiar en intermediarios
          </p>
        </div>

        <div className="trust-grid">
          {trustBuilders.map((item, index) => (
            <div 
              key={index} 
              className="trust-card animate-on-scroll"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="trust-icon-wrapper">
                {item.icon}
              </div>
              <div className="trust-stat">{item.stat}</div>
              <h3 className="trust-title">{item.title}</h3>
              <p className="trust-description">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="advantages-list animate-on-scroll">
          <h3 className="advantages-title">Ventajas de GigChain vs Plataformas Tradicionales</h3>
          
          <div className="comparison-grid">
            <div className="comparison-item">
              <CheckCircle className="check-icon" />
              <div>
                <strong>0% de comisiones</strong> en pagos (solo gas fees mínimas)
              </div>
            </div>
            <div className="comparison-item">
              <CheckCircle className="check-icon" />
              <div>
                <strong>Pagos instantáneos</strong> al completar trabajo (no 14 días)
              </div>
            </div>
            <div className="comparison-item">
              <CheckCircle className="check-icon" />
              <div>
                <strong>Sin baneos arbitrarios</strong> - cuenta descentralizada permanente
              </div>
            </div>
            <div className="comparison-item">
              <CheckCircle className="check-icon" />
              <div>
                <strong>Reputación portátil</strong> - lleva tu historial a cualquier lugar
              </div>
            </div>
            <div className="comparison-item">
              <CheckCircle className="check-icon" />
              <div>
                <strong>Privacidad garantizada</strong> - tus datos nunca se venden
              </div>
            </div>
            <div className="comparison-item">
              <CheckCircle className="check-icon" />
              <div>
                <strong>Resolución de disputas justa</strong> - IA imparcial + árbitros on-chain
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section" id="how-it-works">
        <div className="section-header animate-on-scroll">
          <h2 className="section-title">Cómo Funciona</h2>
          <p className="section-subtitle">Tres simples pasos para comenzar</p>
        </div>

        <div className="steps-background">
          <img 
            src="/assets/blockchain-chain.jpg" 
            alt="Blockchain Process" 
            className="steps-chain-image"
          />
        </div>

        <div className="steps-container">
          <div className="step animate-on-scroll">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Conecta Tu Wallet</h3>
              <p>MetaMask, WalletConnect o cualquier wallet Web3. Sin registro tradicional.</p>
            </div>
          </div>
          
          <div className="step-connector"></div>
          
          <div className="step animate-on-scroll">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Crea o Acepta Contratos</h3>
              <p>Usa plantillas verificadas o deja que la IA genere términos personalizados.</p>
            </div>
          </div>
          
          <div className="step-connector"></div>
          
          <div className="step animate-on-scroll">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Trabaja & Recibe Pagos</h3>
              <p>Fondos liberados automáticamente al completar. Sin intermediarios, sin esperas.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta-section">
        <div className="cta-content animate-on-scroll">
          <h2>¿Listo para Trabajar sin Límites?</h2>
          <p>Únete a miles de freelancers y clientes que ya confían en GigChain</p>
          
          <button 
            className={`cta-large ${authAction.disabled ? 'disabled' : ''}`}
            onClick={authAction.action}
            disabled={authAction.disabled}
          >
            {authAction.icon}
            {authAction.text}
          </button>
          
          {/* Authentication Status Display */}
          {!isConnected && (
            <div className="auth-requirement-notice">
              <Wallet size={16} />
              <span>Wallet connection required to access the platform</span>
            </div>
          )}
          
          {isConnected && !isCorrectChain && (
            <div className="auth-requirement-notice warning">
              <Globe size={16} />
              <span>Please switch to {targetChain?.name} network</span>
            </div>
          )}
          
          <p className="cta-note">
            <Lock size={16} />
            No se requiere tarjeta de crédito. Solo tu wallet.
          </p>
        </div>
      </section>

      {/* Wallet Connection Modal */}
      {showWalletConnection && (
        <div className="wallet-connection-overlay">
          <div className="wallet-connection-modal">
            <div className="wallet-connection-header">
              <h2>Connect Your Wallet</h2>
              <button 
                className="close-button"
                onClick={handleCloseWalletConnection}
                aria-label="Close wallet connection"
              >
                ×
              </button>
            </div>
            <SimpleWalletConnection
              onSuccess={handleWalletConnectionSuccess}
              showGuide={true}
              compact={false}
              redirectReason={locationState?.reason}
              client={client}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default HomePage;
