# 🚀 GigChain.io - AI-Powered Web3 Contract Platform

[![CI/CD Pipeline](https://github.com/yourusername/GigChain/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/GigChain/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/yourusername/GigChain/branch/main/graph/badge.svg)](https://codecov.io/gh/yourusername/GigChain)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB.svg)](https://reactjs.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636.svg)](https://soliditylang.org/)

**GigChain.io** es una plataforma completa de economía gig que utiliza **inteligencia artificial avanzada** para generar contratos inteligentes Web3, con soporte para **escrow automático en Polygon usando USDC**. La plataforma integra múltiples AI Agents, autenticación Web3 sin contraseñas (W-CSAP), sistema de gamificación, y un chat AI interactivo.

> 🎉 **Recently Polished** (2025-10-07): Complete code review and documentation update. All systems operational with comprehensive testing suite and production-ready security. See [POLISH_COMPLETE_REPORT.md](POLISH_COMPLETE_REPORT.md) for previous improvements.

## 📚 Documentación Completa

**[📖 Ver Índice Completo de Documentación →](DOCUMENTATION_INDEX.md)**

Toda la documentación del proyecto ha sido organizada y está disponible en el [Índice de Documentación](DOCUMENTATION_INDEX.md), que incluye:

- 🚀 **Getting Started**: Guías de inicio rápido y referencias
- ⚡ **Features**: Documentación de todas las características
- 🔒 **Security**: Guías de seguridad y W-CSAP
- 🚀 **Deployment**: Guías de despliegue local y producción
- 🧪 **Testing**: Guías de testing y cobertura
- 📊 **Reports**: 70+ reportes de desarrollo y mejoras
- 📝 **API**: Documentación de APIs
- 📜 **Standards**: RFCs y estándares

Total: **140+ documentos** organizados en **11 categorías**.

## ✨ Características Principales

### 🤖 Inteligencia Artificial
- **5 AI Agents Especializados**: NegotiationAgent, ContractGeneratorAgent, QualityAgent, PaymentAgent, DisputeResolverAgent
- **Agent Chaining**: Procesamiento secuencial inteligente para contratos complejos
- **Chat AI Interactivo**: Asistente conversacional con historial persistente y WebSocket support
- **Rule-based Fallback**: Sistema híbrido que usa IA (GPT-4) para casos complejos y reglas para casos simples
- **Context-Aware**: Los agentes mantienen contexto entre conversaciones

### 🔗 Web3 & Blockchain
- **Smart Contracts en Solidity**: Escrow con milestones, dispute resolution, y protección contra reentrancy
- **Polygon Network**: Deploy en Polygon mainnet y Amoy testnet con USDC payments
- **Thirdweb Integration**: Wallet connection simplificada para usuarios
- **W-CSAP Authentication**: Autenticación Web3 sin contraseñas usando firma de wallets
- **Multi-Wallet Support**: Compatible con MetaMask, WalletConnect, Coinbase Wallet

### ⚛️ Frontend Moderno
- **React 18.3+**: Interfaz de usuario moderna y responsive
- **Vite Build System**: Hot Module Replacement y builds optimizados
- **Component Library**: 40+ componentes reutilizables y optimizados
- **Real-time Updates**: WebSocket para chat y notificaciones
- **Dashboard Interactivo**: Métricas, gráficos, y gestión de contratos

### 🚀 Backend de Alto Rendimiento
- **FastAPI Framework**: API REST de alta performance con async/await
- **Production Ready**: Rate limiting, CORS, security headers, error handling
- **Comprehensive Testing**: 80%+ code coverage con pytest
- **Logging Profesional**: Sistema de logging estructurado para debugging y monitoreo
- **Custom Exceptions**: Error handling con códigos de error específicos

### 🎮 Gamificación
- **Sistema XP & Niveles**: Progresión basada en completar contratos exitosamente
- **Badges & Achievements**: 10+ tipos de badges (Novice, Expert, Speed Demon, etc.)
- **Trust Score**: Sistema de reputación con cálculo de confiabilidad
- **Contract Matching**: Motor de recomendación basado en skills y experiencia
- **Ban System**: Sistema de moderación para prevenir abuso

### 🔒 Seguridad Empresarial
- **W-CSAP Protocol**: Challenge-signature authentication para Web3
- **Rate Limiting**: Protección contra DDoS y abuso de API
- **Input Validation**: Validación estricta con Pydantic models
- **Template Security**: Sanitización y validación de plantillas JSON
- **Session Management**: Tokens JWT con refresh tokens y expiración
- **HTTPS Support**: SSL/TLS ready con Nginx reverse proxy

### 🐳 DevOps & Deployment (⏳ Planeado)
- **Local Development**: Python main.py + npm run dev (ACTUAL)
- **Docker Containerization**: Multi-stage builds optimizados (FUTURO)
- **Docker Compose**: Orchestration completo con Nginx (FUTURO)
- **CI/CD Pipeline**: GitHub Actions con testing automático (FUTURO)
- **VPS Scripts**: Deployment automatizado para DigitalOcean, AWS, etc. (FUTURO)
- **Environment Management**: ✅ Configuración por variables de entorno (.env)

## 🏗️ Arquitectura del Sistema

### 📐 Diagrama de Componentes (Actualizado 2025-10-12)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND LAYER (React 18.3+)                          │
│  ┌─────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│  │  Dashboard  │  │ Chat AI  │  │Contracts │  │ Wallets  │  │ Admin Panel │  │
│  │  Analytics  │  │ WebSocket│  │ Manager  │  │ W-CSAP   │  │   (MFA)     │  │
│  └─────────────┘  └──────────┘  └──────────┘  └──────────┘  └─────────────┘  │
│  ┌─────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│  │ Marketplace │  │Templates │  │  i18n    │  │ NFT Repo │  │ Mobile App  │  │
│  │  (Store)    │  │ (Library)│  │Multi-Lang│  │ (Viewer) │  │(React Nat.) │  │
│  └─────────────┘  └──────────┘  └──────────┘  └──────────┘  └─────────────┘  │
│                          │ HTTPS/WebSocket/REST                                │
└──────────────────────────┼──────────────────────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────────────────────┐
│                   NGINX (Reverse Proxy + Security)                              │
│     Rate Limiting │ SSL/TLS │ Security Headers │ DDoS Protection               │
└──────────────────────────┼──────────────────────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────────────────────┐
│                      BACKEND API LAYER (FastAPI)                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                     CORE MODULES (main.py)                               │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────────────┐ │  │
│  │  │ Auth System│  │ AI Agents  │  │Gamification│  │   Contract AI      │ │  │
│  │  │  (W-CSAP)  │  │(5 Agents)  │  │XP/Badges   │  │   Engine           │ │  │
│  │  │  Advanced  │  │ Chaining   │  │Trust Score │  │   Parser/Generator │ │  │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                     BUSINESS MODULES                                     │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────────────┐ │  │
│  │  │  Contracts │  │ Chat Mgr   │  │ Token Sys  │  │  Dispute Oracle    │ │  │
│  │  │  CRUD API  │  │ WebSocket  │  │ (GigSoul)  │  │  & Mediation AI    │ │  │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────────────┘ │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────────────┐ │  │
│  │  │ Analytics  │  │   IPFS     │  │ Reputation │  │  Template Market   │ │  │
│  │  │  System    │  │  Storage   │  │    NFT     │  │  (Buy/Sell)        │ │  │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────────────┘ │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────────────┐ │  │
│  │  │ Admin API  │  │    i18n    │  │  Wallets   │  │  Negotiation AI    │ │  │
│  │  │  (MFA)     │  │  Backend   │  │  Manager   │  │  Assistant         │ │  │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                   ADVANCED AUTH FEATURES (auth/)                         │  │
│  │  DPoP │ KMS │ Proof of Work │ Risk Scoring │ Rate Limiting │ Revocation │  │
│  │  JWT Tokens │ Scope Validator │ Step-up Auth │ Analytics                │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────┼──────────────────────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────────────────────┐
│                    DATA & STORAGE LAYER                                         │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌─────────────┐ │
│  │  PostgreSQL    │  │   SQLite       │  │     IPFS       │  │   Redis     │ │
│  │  (Production)  │  │   (Sessions)   │  │  (Distributed) │  │  (Cache)    │ │
│  └────────────────┘  └────────────────┘  └────────────────┘  └─────────────┘ │
└──────────────────────────┼──────────────────────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────────────────────┐
│              BLOCKCHAIN & EXTERNAL SERVICES LAYER                               │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌─────────────┐ │
│  │  Polygon       │  │  OpenAI API    │  │  Thirdweb      │  │  Chainlink  │ │
│  │  (USDC/Escrow) │  │  (GPT-4o-mini) │  │  (Wallets)     │  │  (Oracles)  │ │
│  │  Smart Contracts│  │  AI Agents     │  │  Web3 SDK      │  │  Price Feeds│ │
│  └────────────────┘  └────────────────┘  └────────────────┘  └─────────────┘ │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌─────────────┐ │
│  │  ERC20 Tokens  │  │  ERC721 NFTs   │  │  IPFS Network  │  │  Analytics  │ │
│  │  (USDC, GSL)   │  │  (Reputation)  │  │  (Storage)     │  │  Services   │ │
│  └────────────────┘  └────────────────┘  └────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘

📊 LEYENDA DE COMPONENTES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ CORE:          Auth (W-CSAP), AI Agents (5), Gamification, Contract Engine
🆕 NEW:           Token System (GigSoul), Dispute Oracle, Admin Panel, Analytics
🔐 SECURITY:      MFA, DPoP, KMS, Risk Scoring, Rate Limiting, Proof of Work
📦 STORAGE:       PostgreSQL, SQLite, IPFS, Redis Cache
🔗 BLOCKCHAIN:    Polygon, Smart Contracts, USDC, NFTs, Oracles
🤖 AI:            5 Agents + Chat AI + Negotiation AI + Mediation AI
🌐 MULTI-PLATFORM: React Web + Mobile App (React Native) + Admin Panel
```

### 📂 Estructura de Archivos (Actualizada 2025-10-12)

```
GigChain/
├── 🐍 BACKEND (Python - FastAPI)
│   ├── main.py ⭐                 # FastAPI app principal (USAR ESTE)
│   ├── app.py                     # Flask legacy (compatibilidad)
│   │
│   ├── 🤖 AI & Contract Generation
│   │   ├── contract_ai.py         # Motor de generación de contratos
│   │   ├── agents.py              # 5 AI Agents con chaining
│   │   ├── chat_enhanced.py       # Chat AI con persistencia
│   │   ├── negotiation_assistant.py  # Asistente de negociación AI
│   │   └── dispute_mediation_ai.py   # AI para resolución de disputas
│   │
│   ├── 🎮 Gamification & Tokens
│   │   ├── gamification.py        # Sistema XP/Badges/TrustScore
│   │   ├── gamification_api.py    # API endpoints de gamificación
│   │   ├── token_system.py        # Sistema de tokens GigSoul
│   │   ├── token_api.py           # API endpoints de tokens
│   │   └── token_database.py      # Database para tokens
│   │
│   ├── 📝 Contracts & Marketplace
│   │   ├── contracts_api.py       # CRUD de contratos
│   │   ├── template_marketplace.py      # Sistema de marketplace
│   │   └── template_marketplace_api.py  # API de marketplace
│   │
│   ├── ⚖️ Dispute & Mediation
│   │   ├── dispute_oracle_system.py      # Sistema de oracles
│   │   ├── dispute_oracle_api.py         # API de oracles
│   │   ├── dispute_mediation_api.py      # API de mediación
│   │   └── dispute_mediation_ai.py       # AI de mediación
│   │
│   ├── 📊 Analytics & Monitoring
│   │   ├── analytics_system.py    # Sistema de analytics
│   │   ├── analytics_api.py       # API de analytics
│   │   └── security_monitoring.py # Monitoreo de seguridad
│   │
│   ├── 🌐 Internationalization & Storage
│   │   ├── i18n_backend.py        # Backend i18n
│   │   ├── i18n_api.py            # API i18n
│   │   ├── ipfs_storage.py        # Almacenamiento IPFS
│   │   └── ipfs_api.py            # API IPFS
│   │
│   ├── 👨‍💼 Admin & Reputation
│   │   ├── admin_system.py        # Sistema administrativo
│   │   ├── admin_api.py           # API admin
│   │   ├── admin_mfa_system.py    # Sistema MFA para admin
│   │   ├── admin_export_system.py # Sistema de exportación
│   │   ├── reputation_nft_system.py   # Sistema NFT de reputación
│   │   └── reputation_nft_api.py      # API NFT de reputación
│   │
│   ├── 💼 Wallet Management
│   │   ├── wallet_manager.py      # Gestor de wallets
│   │   └── wallets/               # Sistema completo de wallets
│   │       ├── __init__.py
│   │       ├── wallet_manager.py  # Manager principal
│   │       ├── internal_wallet.py # Wallets internas
│   │       ├── external_wallet.py # Wallets externas
│   │       ├── database.py        # DB de wallets
│   │       ├── routes.py          # Rutas API
│   │       └── schemas.py         # Pydantic schemas
│   │
│   ├── 🔐 Authentication System (W-CSAP)
│   │   └── auth/                  # 19 módulos de autenticación avanzada
│   │       ├── __init__.py        # Exports principales
│   │       ├── w_csap.py          # Protocolo W-CSAP core
│   │       ├── config.py          # Configuración avanzada
│   │       ├── database.py        # SQLite database manager
│   │       ├── middleware.py      # FastAPI middleware
│   │       ├── routes.py          # Auth routes
│   │       ├── schemas.py         # Pydantic models
│   │       ├── jwt_tokens.py      # JWT token management
│   │       ├── dpop.py            # DPoP authentication
│   │       ├── kms.py             # Key Management System
│   │       ├── proof_of_work.py   # PoW anti-spam
│   │       ├── risk_scoring.py    # Risk analysis
│   │       ├── revocation.py      # Token revocation
│   │       ├── global_rate_limiter.py  # Rate limiting
│   │       ├── scope_validator.py      # Scope validation
│   │       ├── step_up.py         # Step-up auth
│   │       ├── analytics.py       # Auth analytics
│   │       ├── errors.py          # Custom errors
│   │       └── README.md          # Auth documentation
│   │
│   ├── 🛡️ Security
│   │   └── security/
│   │       └── template_security.py  # Template validation
│   │
│   ├── 🗄️ Database & Migrations
│   │   ├── database_manager.py    # Database manager
│   │   ├── database_schema.sql    # Schema SQL
│   │   └── migrate_to_postgres.py # Migration script
│   │
│   ├── 🧪 Testing Scripts
│   │   ├── test_admin_mfa.py
│   │   ├── test_ipfs.py
│   │   ├── test_mediation.py
│   │   ├── test_token_system.py
│   │   └── test_wallet_system.py
│   │
│   ├── ⚙️ Setup & Utilities
│   │   ├── setup_gigchain.py      # Setup completo
│   │   ├── setup_w_csap.py        # Setup W-CSAP
│   │   ├── start_local.py         # Inicio local
│   │   ├── verify_all_features.py # Verificación
│   │   └── exceptions.py          # Custom exceptions
│   │
│   └── 🌍 i18n Translations
│       └── translations/
│           ├── en.json            # English
│           ├── es.json            # Español
│           ├── fr.json            # Français
│           └── pt.json            # Português
│
├── ⚛️ FRONTEND (React 18.3 + Vite)
│   └── src/
│       ├── main.jsx               # Entry point
│       ├── App.jsx                # App principal con routing
│       │
│       ├── 📦 Components (40+)
│       │   ├── layout/            # Layout components
│       │   │   ├── Header/        # Header.jsx, Header.css
│       │   │   └── Sidebar/       # Sidebar.jsx, Sidebar.css
│       │   │
│       │   ├── common/            # Common components
│       │   │   ├── LoadingSpinner/
│       │   │   ├── NetworkAlert/
│       │   │   ├── NotificationCenter/
│       │   │   ├── ThemeToggle/
│       │   │   ├── Toast/
│       │   │   ├── VirtualList/
│       │   │   ├── OptimizedImage/
│       │   │   └── CookieConsent/
│       │   │
│       │   ├── features/          # Feature components
│       │   │   ├── Chart/         # Chart components
│       │   │   ├── Contract/      # Contract components
│       │   │   └── Wallet/        # Wallet components
│       │   │
│       │   ├── ErrorBoundary.jsx
│       │   ├── LanguageSelector.jsx
│       │   ├── NegotiationAssistant.jsx
│       │   ├── ThirdwebStatus.jsx
│       │   ├── UserProfileCard.jsx
│       │   └── WalletAuthButton.jsx
│       │
│       ├── 🖥️ Views (11 views)
│       │   ├── Dashboard/         # DashboardView + Charts
│       │   ├── Home/              # HomeView
│       │   ├── Contracts/         # ContractsView + Table
│       │   ├── Wallets/           # WalletsView
│       │   ├── Payments/          # PaymentsView
│       │   ├── Transactions/      # TransactionsView
│       │   ├── Templates/         # TemplatesView
│       │   ├── AIAgents/          # AIAgentsView
│       │   ├── Settings/          # SettingsView
│       │   ├── Help/              # HelpView
│       │   └── Legal/             # Terms, Privacy, GDPR
│       │
│       ├── 🎣 Hooks (Custom React Hooks)
│       │   ├── useContract.js
│       │   ├── useDashboardMetrics.js
│       │   ├── useDebounce.js
│       │   ├── useWallet.js
│       │   └── useWalletAuth.js
│       │
│       ├── 🌐 Services
│       │   ├── api.js             # API client
│       │   ├── agentService.js    # AI agents service
│       │   └── walletService.js   # Wallet service
│       │
│       ├── 🎨 Styles
│       │   ├── index.css          # Global styles
│       │   ├── components/        # Component styles
│       │   └── utils/             # Utility styles (animations, responsive)
│       │
│       ├── 📚 Constants & Contexts
│       │   ├── constants/         # API URLs, templates
│       │   ├── contexts/          # ThemeContext
│       │   └── i18n/              # i18nContext
│       │
│       └── 🛠️ Utils
│           ├── logger.js          # Professional logging
│           ├── walletUtils.js
│           ├── dateUtils.js
│           └── registerSW.js      # Service Worker
│
├── 👨‍💼 ADMIN PANEL (React + Vite)
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── components/
│       │   └── Layout/
│       │       └── AdminLayout.jsx
│       ├── pages/                 # 14+ admin pages
│       │   ├── DashboardPage.jsx
│       │   ├── UsersPage.jsx
│       │   ├── ContractsPage.jsx
│       │   ├── DisputesPage.jsx
│       │   ├── AnalyticsPage.jsx
│       │   ├── MarketplacePage.jsx
│       │   ├── SecurityPage.jsx
│       │   ├── SecurityMonitoringPage.jsx
│       │   ├── ActivityLogPage.jsx
│       │   ├── ExportPage.jsx
│       │   ├── TroubleshootPage.jsx
│       │   ├── SettingsPage.jsx
│       │   └── LoginPage.jsx
│       └── store/
│           └── adminStore.js
│
├── 📱 MOBILE APP (React Native)
│   ├── App.tsx
│   └── src/
│       ├── contexts/
│       │   ├── ThemeContext.tsx
│       │   └── WalletContext.tsx
│       ├── navigation/
│       │   └── MainNavigator.tsx
│       └── screens/               # 8 mobile screens
│           ├── HomeScreen.tsx
│           ├── LoadingScreen.tsx
│           ├── ContractsScreen.tsx
│           ├── ContractDetailScreen.tsx
│           ├── CreateContractScreen.tsx
│           ├── MarketplaceScreen.tsx
│           ├── ProfileScreen.tsx
│           └── WalletScreen.tsx
│
├── 🔗 SMART CONTRACTS (Solidity)
│   └── contracts/
│       ├── contracts/
│       │   ├── GigChainEscrow.sol     # Escrow principal con milestones
│       │   └── MockERC20.sol          # Mock USDC para testing
│       ├── DisputeOracle.sol          # Oracle de disputas
│       ├── ReputationNFT.sol          # NFTs de reputación
│       ├── governance/
│       │   └── GigChainGovernor.sol.template  # DAO governance
│       ├── token/
│       │   └── GigsToken.sol.template         # Token ERC20
│       ├── scripts/
│       │   └── deploy.ts              # Scripts de deployment
│       ├── test/
│       │   └── GigChainEscrow.test.ts # Tests Hardhat
│       ├── hardhat.config.ts
│       ├── tsconfig.json
│       └── package.json
│
├── 🧪 TESTS (Pytest + Manual)
│   └── tests/
│       ├── README.md              # Testing guide
│       ├── test_api.py            # API endpoint tests
│       ├── test_contract_ai.py    # Contract generation tests
│       ├── test_agents_mock.py    # AI agents tests (mocked)
│       ├── test_agents_enhanced.py     # Enhanced agents tests
│       ├── test_agents_endpoints.py    # Agent management endpoints
│       ├── test_w_csap_auth.py    # Authentication tests
│       ├── test_backend.py        # Backend tests
│       ├── integration_chat.py    # Chat AI flow
│       └── integration_security.py     # Security validation
│
├── 📚 DOCUMENTATION (140+ docs)
│   ├── README.md                  # Este archivo
│   ├── DOCUMENTATION_INDEX.md     # Índice completo
│   └── docs/
│       ├── INDEX.md               # Documentation index
│       ├── getting-started/       # Quick start guides (6 docs)
│       ├── guides/                # User guides (4 docs)
│       ├── features/              # Feature docs (14 docs)
│       ├── security/              # Security docs (24 docs)
│       ├── api/                   # API docs (8 docs)
│       ├── deployment/            # Deployment guides (3 docs)
│       ├── testing/               # Testing guides (2 docs)
│       ├── reports/               # Development reports (65+ docs)
│       ├── changelogs/            # CHANGELOG.md
│       ├── standards/             # RFCs y estándares (3 docs)
│       └── wallets/               # Wallet guides (1 doc)
│
├── 🐳 DOCKER & DEPLOYMENT
│   ├── Dockerfile                 # Multi-stage optimized
│   ├── Dockerfile.prod            # Production optimized
│   ├── Dockerfile.optimized       # Extra optimized
│   ├── docker-compose.yml         # Development setup
│   ├── docker-compose.prod.yml    # Production setup
│   ├── nginx.conf                 # Nginx dev config
│   ├── nginx.prod.conf            # Nginx prod config
│   ├── deploy.sh                  # Unix deployment script
│   ├── deploy.ps1                 # Windows deployment script
│   ├── deploy-vps.sh              # VPS deployment
│   ├── deploy-vps.ps1             # VPS deployment (Windows)
│   ├── vps-setup.sh               # VPS initial setup
│   ├── start-dev.sh               # Dev start script
│   └── start-dev.ps1              # Dev start (Windows)
│
├── ⚙️ CONFIGURATION
│   ├── requirements.txt           # Python dependencies (pinned)
│   ├── requirements-dev.txt       # Development dependencies
│   ├── pytest.ini                 # Pytest configuration
│   ├── codex.yaml                 # Codex configuration
│   ├── Makefile                   # Build automation
│   ├── env.example                # Environment template
│   └── LICENSE                    # MIT License
│
└── 📊 PROJECT MANAGEMENT
    ├── .github/workflows/ci.yml   # CI/CD pipeline
    ├── CHANGES_SUMMARY.txt        # Summary of changes
    ├── COMMIT_MESSAGE.txt         # Commit templates
    ├── README_IMPLEMENTACION.txt  # Implementation notes
    └── TOKEN_QUICK_START.txt      # Token system quickstart
```

### 🤖 AI Agents System

GigChain utiliza un sistema de **Agent Chaining** donde múltiples agentes especializados procesan contratos secuencialmente:

1. **NegotiationAgent** 🤝
   - Analiza ofertas y genera contraofertas equilibradas
   - Evalúa complejidad del proyecto (low/medium/high)
   - Sugiere distribución de milestones (30/40/30)
   - Identifica riesgos y propone mitigación
   - Output: `counter_offer`, `milestones`, `risks`, `negotiation_tips`

2. **ContractGeneratorAgent** 📄
   - Genera contratos inteligentes completos
   - Agrega cláusulas de escrow en Polygon/USDC
   - Crea parámetros para deployment Solidity
   - Incluye compliance MiCA/GDPR
   - Output: `full_terms`, `escrow_params`, `solidity_stubs`, `clauses`

3. **QualityAgent** ⭐
   - Evalúa calidad de trabajos entregados
   - Analiza cumplimiento de especificaciones técnicas
   - Revisa documentación y testing
   - Genera feedback detallado
   - Output: `quality_score`, `approval_recommendation`, `feedback`

4. **PaymentAgent** 💰
   - Gestiona pagos y transacciones Web3
   - Valida wallets y balances
   - Calcula fees (platform + gas)
   - Maneja releases de milestones
   - Output: `transaction_status`, `fees`, `milestone_release`

5. **DisputeResolverAgent** ⚖️
   - Resuelve disputas entre partes
   - Analiza evidencias y cumplimiento
   - Propone soluciones justas (release/refund/mediate)
   - Integración con oracles externos
   - Output: `resolution`, `evidence_analysis`, `recommended_action`

### 🔐 W-CSAP Authentication Flow

```
Client                    Backend                   Blockchain
  │                          │                           │
  │ 1. Request Challenge     │                           │
  │ ─────────────────────>   │                           │
  │                          │ Generate Nonce            │
  │    Challenge + Nonce     │                           │
  │ <─────────────────────   │                           │
  │                          │                           │
  │ 2. Sign with Wallet      │                           │
  │ ───────────┐             │                           │
  │            │             │                           │
  │ <──────────┘             │                           │
  │                          │                           │
  │ 3. Send Signature        │                           │
  │ ─────────────────────>   │                           │
  │                          │ Verify Signature          │
  │                          │ (eth-account)             │
  │                          │                           │
  │    Session Token         │                           │
  │    Refresh Token         │                           │
  │ <─────────────────────   │                           │
  │                          │                           │
  │ 4. Authenticated API     │                           │
  │    Requests              │                           │
  │ ─────────────────────>   │                           │
  │                          │ Validate Token            │
  │         Response         │                           │
  │ <─────────────────────   │                           │
```

**Ventajas de W-CSAP:**
- ✅ Sin contraseñas - Solo firma de wallet
- ✅ Non-custodial - Usuario mantiene control de sus keys
- ✅ Web3-native - Compatible con todos los wallets Ethereum
- ✅ Stateless - Tokens JWT independientes
- ✅ Secure - Challenge único con expiración

### 🎮 Gamification System

```python
# Sistema de Niveles (XP)
Level 1:  0 - 99 XP      (Newbie)
Level 2:  100 - 299 XP   (Apprentice)  
Level 3:  300 - 599 XP   (Intermediate)
Level 4:  600 - 999 XP   (Advanced)
Level 5:  1000+ XP       (Expert)

# Badges Disponibles
🏅 First Contract        # Primer contrato completado
⭐ Fast Learner          # 3 contratos en primera semana
🚀 Speed Demon           # Contrato terminado antes de deadline
💯 Perfect Score         # Rating 5.0 en proyecto
🎯 Expert Contractor     # 10+ contratos completados exitosamente
📚 Template Master       # 5+ templates creados
💰 High Value            # Contrato >$10k USDC completado
🤝 Great Communicator    # Excelente rating en comunicación
⚡ Lightning Fast        # Contrato completado en <24h
🔥 On Fire              # 5 contratos consecutivos

# Trust Score (0-100)
Factores:
- Success rate (40%)
- Response time (20%)
- Contract value (15%)
- Time on platform (10%)
- Dispute resolution (10%)
- Community ratings (5%)
```

## 🚀 Quick Start

### 1. Setup Local (ACTUAL DEVELOPMENT APPROACH)

⚠️ **IMPORTANTE**: Por ahora, estamos usando SOLO desarrollo local sin Docker para optimizar velocidad de desarrollo.

```bash
# Clone repository
git clone <your-repo-url>
cd GigChain

# Install dependencies
pip install -r requirements.txt

# Configure environment (NO MODIFICAR sin consultar)
# El archivo .env ya debe estar configurado
# Verificar variables requeridas:
cat .env  # Linux/Mac
type .env # Windows

# Verificar estado del servidor
curl http://localhost:5000/health

# Run tests (individual scripts)
python test_chat.py
python test_contract_ai.py
python test_api.py

# Start FastAPI development server (✨ USAR ESTE)
python main.py
# Server runs at http://localhost:5000
# API docs available at http://localhost:5000/docs
# Alternative docs at http://localhost:5000/redoc
```

### 2. Frontend Setup (Terminal separada)
```bash
cd frontend
npm install
npm run dev
# Frontend runs at http://localhost:5173
```

### 3. Docker Deployment (⚠️ SOLO AL FINAL DEL PROYECTO)
```bash
# ❌ POR AHORA NO USAR DOCKER
# Docker solo cuando todas las funcionalidades estén completas

# Quick start with Docker (FUTURO)
./deploy.sh dev

# Or with PowerShell on Windows (FUTURO)
.\deploy.ps1 dev

# Production deployment (FUTURO)
./deploy.sh production
```

## 📚 API Endpoints Completa

### 🏥 Health & Status
```bash
GET /health
# Response: { status: "healthy", ai_agents_active: true, ... }

GET /api/agents/status
# Response: Lista de agentes disponibles con configuración
```

### 🤝 W-CSAP Authentication

#### Request Challenge
```bash
POST /api/auth/challenge
Content-Type: application/json

{
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}

# Response:
{
  "challenge_id": "uuid",
  "wallet_address": "0x...",
  "challenge_message": "Sign to authenticate: <nonce>",
  "expires_at": 1704067200
}
```

#### Verify Signature
```bash
POST /api/auth/verify
Content-Type: application/json

{
  "challenge_id": "uuid",
  "signature": "0x...",
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}

# Response:
{
  "success": true,
  "session_token": "eyJ...",
  "refresh_token": "eyJ...",
  "expires_at": 1704067200
}
```

#### Other Auth Endpoints
```bash
POST /api/auth/refresh          # Refresh expired session
POST /api/auth/logout           # Invalidate session
GET  /api/auth/status           # Check auth status
GET  /api/auth/sessions         # Get active sessions (protected)
GET  /api/auth/stats            # Auth system statistics
```

### 🤖 AI Contract Generation

#### Full AI Flow (Agent Chaining)
```bash
POST /api/full_flow
Authorization: Bearer <token>  # Optional
Content-Type: application/json

{
  "text": "Cliente ofrece $4K por logo NFT en 5 días. Quiero $5K."
}

# Response:
{
  "contract_id": "gig_2025-01-01T12:00:00",
  "escrow_ready": true,
  "json": {
    "negotiation": {
      "counter_offer": 4500.0,
      "milestones": [
        {
          "desc": "Initial setup",
          "amount": 1350.0,
          "deadline": "2025-01-15",
          "percentage": 30.0
        }
      ],
      "risks": ["..."],
      "negotiation_tips": ["..."]
    },
    "contract": {
      "contract_id": "...",
      "full_terms": "...",
      "escrow_params": { ... },
      "solidity_stubs": { ... }
    }
  }
}
```

#### Simple Contract (Rule-based)
```bash
POST /api/contract
Content-Type: application/json

{
  "text": "Simple task for $100 in 3 days"
}
```

#### Structured Contract (Form Data)
```bash
POST /api/structured_contract
Content-Type: application/json

{
  "description": "Build landing page for SaaS",
  "offeredAmount": 1000,
  "requestedAmount": 1500,
  "days": 14,
  "role": "freelancer",
  "freelancerWallet": "0x...",
  "clientWallet": "0x...",
  "freelancerName": "John Doe",
  "freelancerTitle": "Full-stack Developer",
  "freelancerSkills": "React, Node.js, Solidity"
}
```

### 🎮 Gamification & Negotiation

```bash
# User Stats
GET  /api/gamification/users/{user_id}/stats

# Contract Offer Analysis
POST /api/gamification/contract/analyze
{
  "contract_text": "...",
  "offered_amount": 1000,
  "user_id": "0x...",
  "market_rate": 1200
}

# Negotiate or Accept
POST /api/gamification/contract/negotiate
{
  "contract_id": "uuid",
  "user_id": "0x...",
  "decision": "negotiate"  # or "accept"
}

# Generate Counter-offer
POST /api/gamification/contract/counter-offer
{
  "contract_id": "uuid",
  "original_offer": 1000,
  "project_complexity": "medium"
}

# Complete Contract & Award XP
POST /api/gamification/contract/complete
{
  "contract_id": "uuid",
  "user_id": "0x...",
  "role": "freelancer",
  "rating": 5,
  "was_on_time": true
}

# Leaderboard
GET  /api/gamification/leaderboard?limit=10
```

### 💬 Chat AI

```bash
# Send Chat Message
POST /api/chat/message
{
  "message": "¿Cómo puedo crear un contrato?",
  "user_id": "0x...",
  "session_id": "uuid",  # Optional
  "context": { "agent_type": "contract" }
}

# Create Chat Session
POST /api/chat/session?user_id=0x...&agent_type=contract

# Get Chat History
GET  /api/chat/session/{session_id}/history?limit=50

# Switch Agent Type
PUT  /api/chat/session/{session_id}/agent?agent_type=negotiation

# Get Available Agents
GET  /api/chat/agents

# WebSocket (Real-time Chat)
WS   /ws/chat/{session_id}
```

### 🤖 AI Agents Management

```bash
# Toggle Agent On/Off
POST /api/agents/{agent_id}/toggle
{
  "enabled": true
}

# Configure Agent
POST /api/agents/{agent_id}/configure
{
  "temperature": 0.1,
  "model": "gpt-4",
  "max_tokens": 2000
}

# Test Agent
POST /api/agents/{agent_id}/test
{
  "text": "Test contract scenario"
}
```

### 🔐 Template Security

```bash
# Validate Template
POST /api/templates/validate
{
  "template_json": "{ ... }",
  "user_id": "0x..."
}

# Upload Template
POST /api/templates/upload
{
  "template_data": { ... },
  "user_id": "0x..."
}

# Security Info
GET  /api/templates/security/info
```

### 💰 Wallet Validation

```bash
POST /api/validate_wallet
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "network": "polygon"
}

# Response:
{
  "valid": true,
  "address": "0x...",
  "network": "polygon",
  "balance": 100.50
}
```

### 📖 Auto-Generated API Docs

GigChain utiliza FastAPI con documentación automática:

- **Swagger UI**: `http://localhost:5000/docs`
- **ReDoc**: `http://localhost:5000/redoc`
- **OpenAPI JSON**: `http://localhost:5000/openapi.json`

## 🧪 Testing Completo

### Ejecutar Tests

```bash
# Run all tests (unit + integration)
pytest tests/ -v

# Run with coverage report
pytest tests/ -v --cov=. --cov-report=html
# View coverage: open htmlcov/index.html

# Run specific test files
pytest tests/test_contract_ai.py -v      # Contract generation tests
pytest tests/test_api.py -v              # API endpoint tests
pytest tests/test_agents_enhanced.py -v  # AI agents tests
pytest tests/test_w_csap_auth.py -v      # Authentication tests

# Run all agent tests
pytest tests/test_agents*.py -v

# Run with detailed output
pytest tests/ -v -s

# Run specific test function
pytest tests/test_api.py::test_health_endpoint -v

# Parallel execution (faster)
pytest tests/ -n auto
```

### Integration Scripts (Manual)

Estos requieren el servidor corriendo en `localhost:5000`:

```bash
# Terminal 1: Start server
python main.py

# Terminal 2: Run integration tests
python tests/integration_chat.py        # Test chat AI flow
python tests/integration_security.py    # Test template security
```

### Test Suite Overview

- **Unit Tests**: 7 archivos pytest
  - `test_contract_ai.py`: Contract parsing & generation
  - `test_agents_mock.py`: AI agents con OpenAI mockeado
  - `test_agents_enhanced.py`: Enhanced agents tests
  - `test_backend.py`: Backend básico
  - `test_w_csap_auth.py`: W-CSAP authentication
  
- **Integration Tests**: 2 archivos pytest + 2 scripts
  - `test_api.py`: API endpoints con TestClient
  - `test_agents_endpoints.py`: Agent management endpoints
  - `integration_chat.py`: Chat AI flow completo
  - `integration_security.py`: Template security validation

### Test Coverage

Target: **>80%** code coverage

```bash
# Generate coverage report
pytest tests/ --cov=. --cov-report=term-missing

# HTML report with line-by-line coverage
pytest tests/ --cov=. --cov-report=html
open htmlcov/index.html
```

### Frontend Tests (Cypress)

```bash
cd frontend

# Run Cypress tests
npm test

# Open Cypress UI
npx cypress open
```

### Smart Contract Tests (Hardhat)

```bash
cd contracts

# Run contract tests
npm test

# Run with gas report
REPORT_GAS=true npm test

# Run coverage
npm run coverage
```

## 🔧 Configuration

### Environment Variables

Crear archivo `.env` basado en `env.example`:

```env
# Server Configuration
PORT=5000
DEBUG=false

# OpenAI API (Required for AI Agents)
OPENAI_API_KEY=sk-your-openai-key-here

# W-CSAP Authentication (Required)
W_CSAP_SECRET_KEY=your-secret-key-min-32-chars

# CORS Configuration (Production)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://yourdomain.com

# Database (Optional - defaults to SQLite)
DATABASE_URL=sqlite:///./gigchain.db

# Smart Contract (After deployment)
ESCROW_CONTRACT_ADDRESS=0x...
RPC_URL=https://rpc-amoy.polygon.technology
```

### AI Complexity Logic

GigChain decide automáticamente si usar AI agents o reglas simples:

- **Low Complexity** → Rule-based fallback
  - Sin amounts detectados o contratos muy simples
  - Respuesta inmediata sin usar OpenAI API
  - Ejemplo: "Task simple $100 en 3 días"

- **Medium Complexity** → AI Agent Chaining (2-3 agents)
  - Amounts detectados con <2 riesgos
  - Usa NegotiationAgent + ContractGeneratorAgent
  - Ejemplo: "Cliente ofrece $1000 por desarrollo en 14 días"

- **High Complexity** → Full AI Pipeline (4-5 agents)
  - Múltiples riesgos o negociaciones complejas
  - Usa todos los agents: Negotiation → Generator → Quality → Payment → Dispute
  - Ejemplo: "Proyecto complejo $10k con 5 milestones y arbitraje"

### Frontend Configuration

```bash
cd frontend

# Create .env (based on env.example)
cat > .env << EOF
VITE_API_BASE_URL=http://localhost:5000
VITE_THIRDWEB_CLIENT_ID=your-thirdweb-client-id
VITE_POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
EOF

# Install dependencies
npm install

# Start development server
npm run dev
# Access at http://localhost:5173
```

### Smart Contract Configuration

```bash
cd contracts

# Create .env
cat > .env << EOF
DEPLOYER_PRIVATE_KEY=0xyour-private-key
RPC_URL=https://rpc-amoy.polygon.technology
POLYGONSCAN_API_KEY=your-polygonscan-api-key
EOF

# Install dependencies
npm install

# Compile contracts
npm run compile

# Deploy to testnet
npm run deploy:amoy
```

## 💻 Tech Stack Completo

### Backend (Python)
| Technology | Version | Purpose |
|-----------|---------|---------|
| **FastAPI** | 0.115+ | High-performance API framework |
| **Uvicorn** | 0.32+ | ASGI server with async support |
| **OpenAI** | 1.54+ | GPT-4 integration for AI agents |
| **Pydantic** | 2.9+ | Data validation & settings |
| **Web3.py** | 7.4+ | Blockchain interaction |
| **eth-account** | 0.13+ | Wallet signature verification |
| **SQLite** | Built-in | Database for sessions |
| **pytest** | 8.3+ | Testing framework |
| **python-dotenv** | 1.0+ | Environment management |

### Frontend (React)
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.3+ | UI framework |
| **Vite** | 5.4+ | Build tool & dev server |
| **Thirdweb** | 4.9+ | Wallet connection & Web3 |
| **Axios** | 1.7+ | HTTP client |
| **Lucide React** | 0.445+ | Icon library |
| **Cypress** | 13.15+ | E2E testing |

### Smart Contracts (Solidity)
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Solidity** | 0.8.20 | Smart contract language |
| **Hardhat** | Latest | Development environment |
| **OpenZeppelin** | 5.1+ | Secure contract libraries |
| **Ethers.js** | 6.0+ | Ethereum interaction |
| **TypeScript** | 5.0+ | Type-safe scripts |

### DevOps & Infrastructure
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Docker** | Latest | Containerization |
| **Docker Compose** | Latest | Multi-container orchestration |
| **Nginx** | Latest | Reverse proxy & load balancer |
| **GitHub Actions** | - | CI/CD pipeline |
| **Polygon** | Mainnet/Amoy | Blockchain network |

### AI & Machine Learning
| Technology | Purpose |
|-----------|---------|
| **GPT-4o-mini** | Fast AI inference for agents |
| **OpenAI Chat API** | Conversational AI |
| **Temperature 0.1** | Deterministic outputs |
| **JSON Mode** | Structured responses |

### Security & Authentication
| Technology | Purpose |
|-----------|---------|
| **W-CSAP** | Wallet-based authentication |
| **JWT** | Session tokens |
| **eth-account** | Signature verification |
| **ReentrancyGuard** | Smart contract protection |
| **CORS** | Cross-origin security |
| **Rate Limiting** | DDoS protection |

## 🐳 Docker Deployment (⚠️ PENDIENTE - SOLO AL FINAL)

> **NOTA IMPORTANTE**: Docker está deshabilitado temporalmente. Usamos desarrollo local con `python main.py` para mayor velocidad de iteración.

### Development (FUTURO)
```bash
# ❌ NO USAR POR AHORA
docker-compose up gigchain-api
```

### Production (FUTURO)
```bash
# ❌ NO USAR POR AHORA
docker-compose --profile production up -d
```

### Features Planeadas
- ⏳ Nginx reverse proxy
- ⏳ Rate limiting (10 req/s)
- ⏳ Security headers
- ⏳ CORS configuration
- ⏳ Health checks
- ⏳ Auto-restart

### Workflow Actual (Sin Docker)
```bash
# Terminal 1: Backend
python main.py

# Terminal 2: Frontend (opcional)
cd frontend && npm run dev
```

## 📁 Project Structure

```
GigChain/
├── agents.py              # AI agents with chaining
├── app.py                 # Flask API server (legacy)
├── main.py                # FastAPI server (primary)
├── contract_ai.py         # Core contract generation
├── exceptions.py          # Custom exception classes ✨ NEW
├── requirements.txt       # Python dependencies
├── requirements-dev.txt   # Development dependencies ✨ NEW
├── auth/                  # W-CSAP authentication system
├── security/              # Template security validation
├── frontend/              # React frontend
│   └── src/
│       ├── utils/
│       │   └── logger.js  # Professional logging ✨ NEW
│       └── components/
│           └── OptimizedComponents.jsx ✨ NEW
├── docs/                  # Organized documentation ✨ NEW
│   ├── INDEX.md          # Documentation navigation
│   ├── api/              # API & dev reports
│   ├── deployment/       # Deployment guides
│   ├── guides/           # User guides
│   ├── security/         # Security docs
│   └── testing/          # Testing guides
├── tests/                 # Complete test suite ✨ IMPROVED
│   ├── README.md         # Test documentation ✨ NEW
│   ├── test_*.py         # Unit/integration tests (7 files)
│   └── integration_*.py  # Manual integration scripts (2 files)
├── contracts/             # Solidity smart contracts
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Multi-service setup
└── env.example            # Environment template
```

> **Note**: Recently reorganized for better structure. See [POLISH_COMPLETE_REPORT.md](POLISH_COMPLETE_REPORT.md) for all improvements.

## 🔒 Security Features

### Production-Ready Security
- **Rate Limiting**: 10 req/s para API, 1 req/s para login, burst control
- **Connection Limiting**: Max 10 conexiones concurrentes por IP
- **Comprehensive Security Headers**:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: geolocation=(), microphone=(), camera=()`
  - `Content-Security-Policy` with strict rules
  - `Strict-Transport-Security` (HSTS) for HTTPS with preload
- **W-CSAP Authentication**: Wallet-based authentication using challenge-signature protocol
- **Input Validation**: Pydantic models with strict type checking
- **Template Security**: Sanitización y validación de plantillas JSON
- **Error Handling**: Manejo seguro sin exposición de stack traces
- **CORS**: Configurable origins (production ready)
- **Environment Isolation**: Variables de entorno para secrets
- **File Upload Limits**: Max 10MB, allowed types whitelist
- **Timeouts**: Configurados para prevenir DOS (60s)

### Authentication Flow (W-CSAP)

GigChain usa **W-CSAP** (Wallet Challenge-Signature Authentication Protocol), un sistema de autenticación Web3 sin contraseñas:

1. **Challenge Request** (`POST /api/auth/challenge`)
   - Cliente envía su wallet address
   - Servidor genera un challenge único y nonce
   - Challenge expira en 5 minutos

2. **Signature Verification** (`POST /api/auth/verify`)
   - Cliente firma el challenge con su wallet privada
   - Servidor verifica la firma usando eth-account
   - Si válido, genera session_token y refresh_token

3. **Authenticated Requests**
   - Cliente incluye `Authorization: Bearer {session_token}`
   - Sesión válida por 24 horas
   - Refresh token válido por 7 días

4. **Session Refresh** (`POST /api/auth/refresh`)
   - Cliente envía refresh_token antes de expiración
   - Servidor genera nuevo session_token

5. **Logout** (`POST /api/auth/logout`)
   - Invalida sesión actual en base de datos

**Endpoints protegidos**: Todos los endpoints críticos requieren autenticación W-CSAP.

## 🌐 Production Deployment

### Prerequisites
- Docker & Docker Compose
- Domain with SSL certificate
- OpenAI API key

### Steps
1. **Configure Environment**:
   ```bash
   cp env.example .env
   # Edit .env with production values
   ```

2. **Deploy**:
   ```bash
   ./deploy.sh production
   ```

3. **Verify**:
   ```bash
   curl https://yourdomain.com/health
   ```

### Monitoring
- Health checks: `/health`
- Logs: `docker-compose logs gigchain-api`
- Metrics: Container stats with `docker stats`

## 🤝 Contributing

¡Contributions son bienvenidas! Este proyecto sigue las mejores prácticas de código abierto.

### Cómo Contribuir

1. **Fork el repositorio**
   ```bash
   git clone https://github.com/your-username/GigChain.git
   cd GigChain
   ```

2. **Crear rama de feature**
   ```bash
   git checkout -b feature/nombre-descriptivo
   # o para bug fixes
   git checkout -b fix/descripcion-bug
   ```

3. **Configurar ambiente de desarrollo**
   ```bash
   pip install -r requirements.txt
   pip install -r requirements-dev.txt  # Para linters y herramientas dev
   ```

4. **Hacer cambios y testear**
   ```bash
   # Run tests
   pytest tests/ -v
   
   # Run linter (si está configurado)
   ruff check .
   black .
   ```

5. **Commit con mensajes descriptivos**
   ```bash
   git add .
   git commit -m "feat: Add new AI agent for quality assessment"
   # o
   git commit -m "fix: Resolve authentication token expiration issue"
   ```

6. **Push y crear Pull Request**
   ```bash
   git push origin feature/nombre-descriptivo
   # Luego crear PR en GitHub
   ```

### Guías de Estilo

- **Python**: Seguir PEP 8, usar Black para formatting
- **JavaScript/React**: Seguir Airbnb style guide
- **Commits**: Usar conventional commits (feat:, fix:, docs:, etc.)
- **Tests**: Agregar tests para nuevas features (coverage >80%)
- **Documentación**: Actualizar README y docs/ cuando sea necesario

### Áreas de Contribución

- 🤖 **AI Agents**: Nuevos agents o mejoras a existentes
- ⚛️ **Frontend**: Nuevos componentes o mejoras UI/UX
- 🔗 **Smart Contracts**: Optimizaciones o nuevas features
- 📚 **Documentación**: Mejoras a docs, tutoriales, ejemplos
- 🧪 **Testing**: Más tests, mejores tests, CI/CD
- 🔒 **Seguridad**: Auditorías, mejoras de seguridad

### Code Review Process

1. Pull requests requieren al menos 1 approval
2. Todos los tests deben pasar (CI/CD)
3. Code coverage no debe bajar del 80%
4. Documentación debe estar actualizada

## 📚 Documentación Extendida

### Guías Completas

- **[INDEX.md](docs/INDEX.md)** - Índice completo de documentación
- **[DEPLOYMENT.md](docs/deployment/DEPLOYMENT.md)** - Guía de deployment production
- **[LOCAL_DEPLOYMENT.md](docs/deployment/LOCAL_DEPLOYMENT.md)** - Setup local desarrollo
- **[TESTING_GUIDE.md](docs/testing/TESTING_GUIDE.md)** - Guía completa de testing

### Seguridad

- **[W_CSAP_DOCUMENTATION.md](docs/security/W_CSAP_DOCUMENTATION.md)** - Protocolo W-CSAP completo
- **[SECURITY_GUIDE.md](docs/security/SECURITY_GUIDE.md)** - Best practices de seguridad
- **[QUICK_START_W_CSAP.md](docs/security/QUICK_START_W_CSAP.md)** - Quick start autenticación

### AI & Agents

- **[AGENTS.md](docs/guides/AGENTS.md)** - Reglas y configuración de AI agents
- **[CHAT_GUIDE.md](docs/guides/CHAT_GUIDE.md)** - Implementación del chat AI
- **[GAMIFICATION_SYSTEM_GUIDE.md](GAMIFICATION_SYSTEM_GUIDE.md)** - Sistema de gamificación

### Smart Contracts

- **[contracts/README.md](contracts/README.md)** - Documentación de contratos Solidity
- **[GigChainEscrow.sol](contracts/contracts/GigChainEscrow.sol)** - Contrato principal

### Reports & Improvements

- **[POLISH_COMPLETE_REPORT.md](POLISH_COMPLETE_REPORT.md)** - Reporte de mejoras 2025-10-06
- **[BUG_FIXES_SUMMARY.md](BUG_FIXES_SUMMARY.md)** - Resumen de bug fixes
- **[CI_TEST_SUCCESS_REPORT.md](CI_TEST_SUCCESS_REPORT.md)** - Estado de CI/CD

## 📄 License

Este proyecto está bajo la **Licencia MIT**. Ver [LICENSE](LICENSE) para más detalles.

```
MIT License - Copyright (c) 2025 GigChain.io

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
[...]
```

## ⚠️ Disclaimer Legal

**IMPORTANTE - LEE CUIDADOSAMENTE:**

1. **No es Consejo Legal**: Los contratos generados por GigChain.io son borradores AI y **NO constituyen consejo legal profesional**. Siempre consulta con un abogado especializado antes de usar en producción.

2. **Uso bajo tu Propio Riesgo**: El software se proporciona "AS IS" sin garantías de ningún tipo. Los creadores no son responsables de pérdidas financieras o disputas contractuales.

3. **Compliance Regional**: Aunque el sistema sigue principios MiCA/GDPR, debes verificar compliance específico de tu jurisdicción.

4. **Smart Contracts**: Los contratos en blockchain son **inmutables**. Verifica minuciosamente antes de deployment. Se recomienda auditoría profesional para producción.

5. **AI Limitations**: Los AI agents pueden cometer errores. Siempre revisa manualmente los contratos generados.

6. **Beta Software**: Esta plataforma está en desarrollo activo. Usa testnet (Polygon Amoy) para pruebas.

## 🆘 Support & Community

### Get Help

- 📖 **Documentation**: [docs/INDEX.md](docs/INDEX.md)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/your-repo/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/your-repo/discussions)
- 📧 **Email**: support@gigchain.io (si existe)

### Community

- 💬 **Discord**: [Join our community](#) (si existe)
- 🐦 **Twitter**: [@GigChainIO](#) (si existe)
- 📱 **Telegram**: [GigChain Community](#) (si existe)

### Quick Links

- [🏠 Homepage](#) - gigchain.io (cuando esté disponible)
- [📊 Dashboard](#) - app.gigchain.io (cuando esté disponible)
- [📖 Docs Site](#) - docs.gigchain.io (cuando esté disponible)
- [🔍 Block Explorer](https://amoy.polygonscan.com/) - Polygon Amoy

## 🎯 Roadmap

### ✅ Phase 1: MVP (Completed)
- [x] FastAPI backend con AI agents
- [x] React frontend con Thirdweb
- [x] Smart contracts en Polygon
- [x] W-CSAP authentication
- [x] Sistema de gamificación
- [x] Chat AI interactivo

### 🚧 Phase 2: Enhancements (In Progress)
- [ ] Mobile app (React Native)
- [ ] Multi-language support (i18n)
- [ ] Advanced analytics dashboard
- [ ] Dispute resolution oracle integration
- [ ] Reputation system NFTs
- [ ] Template marketplace

### 🔮 Phase 3: Scale (Planned) - [📋 See Revised Plan](PHASE3_PLAN_REVISED.md)
- [ ] Multi-chain escrow support (Ethereum, BSC, Arbitrum)
- [ ] **GigSoul (GSL) Internal Token System** - Earn by working & gaining XP 🆕
- [ ] Off-chain DAO governance (snapshot voting)
- [ ] Professional audit (escrow contracts - Trail of Bits / Consensys)
- [ ] Mainnet production deployment (4 chains)
- [ ] Mobile apps (iOS + Android) - Native React Native

**🔄 MAJOR UPDATE**: GigSoul (GSL) tokens are now **internal app currency** (database-backed), not blockchain ERC20 yet.
- Earn GSL by completing contracts (100 GSL per $1)
- Earn GSL by gaining XP (5 GSL per XP)
- Spend GSL on premium features (featured profile, priority support, etc.)
- Stake GSL for benefits (trust score boost, XP multipliers)
- Future conversion to blockchain tokens supported

**📊 Resources:**
- **[Phase 3 Revised Plan](PHASE3_PLAN_REVISED.md)** - Updated implementation guide
- **[Phase 3 Revised Checklist](PHASE3_CHECKLIST_REVISED.md)** - 200+ actionable tasks
- **[Token Database Schema](migrations/phase3_internal_tokens_schema.sql)** - SQL schema for internal tokens
- **Budget**: $380k (down from $620k) | **Duration**: 12 weeks (down from 16) | **Team**: 6-8 people

### 💭 Future Ideas
- AI-powered dispute mediation
- Escrow insurance pool
- Freelancer verification KYC (optional)
- Payment streaming (Superfluid)
- Integration with Lens Protocol
- IPFS contract storage

---

<div align="center">

**🚀 GigChain.io - Democratizing the Gig Economy with AI & Web3**

**Built with ❤️ by the GigChain Team**

[![Star on GitHub](https://img.shields.io/github/stars/your-repo/gigchain?style=social)](https://github.com/your-repo/gigchain)
[![Follow on Twitter](https://img.shields.io/twitter/follow/GigChainIO?style=social)](https://twitter.com/GigChainIO)

[Website](#) • [Documentation](docs/INDEX.md) • [API Docs](http://localhost:5000/docs) • [Contracts](contracts/README.md)

</div>

---

**Last Updated**: 2025-10-07  
**Version**: 1.0.0  
**Status**: ✅ Development Ready (Local-First Approach)  
**Deployment**: 🚀 Local Development | ⏳ Docker (Coming Soon)
