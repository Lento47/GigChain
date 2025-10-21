# 🚀 GigChain - AI-Powered Web3 Gig Economy Platform

**GigChain** es una plataforma Web3 completa para la economía gig que combina inteligencia artificial avanzada, contratos inteligentes y autenticación descentralizada para revolucionar el trabajo freelance.

## 🌟 Características Principales

### **🤖 AI-Powered Contract Generation**
- **5 Agentes Especializados** - Negociación, generación, calidad, pagos y resolución de disputas
- **Generación Automática** - Contratos inteligentes creados por IA
- **Negociación Inteligente** - IA que analiza ofertas y genera contrapropuestas
- **Resolución de Disputas** - Sistema de mediación automatizado
- **Chat AI Interactivo** - Asistente conversacional en tiempo real

### **🔐 Autenticación Web3 Avanzada**
- **W-CSAP Protocol** - Autenticación sin contraseñas usando firmas de wallet
- **Sistema Dual de Wallets** - Wallets internas + externas para máxima flexibilidad
- **Seguridad Enterprise** - Nivel WebAuthn-Plus con puntuación de riesgo
- **Verificación Criptográfica** - Firmas de wallet para todas las operaciones
- **Gestión de Sesiones** - Tokens JWT con rotación automática

### **💼 Plataforma de Gig Economy**
- **Marketplace de Servicios** - Conecta freelancers con clientes
- **Contratos Inteligentes** - Escrow automático con USDC en Polygon
- **Sistema de Reputación** - Puntuación de confianza basada en rendimiento
- **Gamificación** - XP, niveles, badges y logros
- **Servicios Profesionales** - Tier verificado para pagos externos

## 🏗️ Arquitectura Técnica

### **Smart Contracts (Solidity)**
```
contracts/
├── GigChainEscrow.sol         # Escrow principal con USDC
├── DisputeOracle.sol          # Oracle para resolución de disputas
├── ReputationNFT.sol          # NFTs de reputación y badges
├── GigChainGovernor.sol       # Gobernanza de la plataforma
├── GigsToken.sol             # Token nativo GIGS
└── governance/               # Contratos de gobernanza
    └── GigChainGovernor.sol.template
```

### **Frontend (React + TypeScript)**
```
frontend/
├── src/
│   ├── components/           # Componentes reutilizables
│   ├── pages/               # Páginas principales
│   ├── hooks/               # Custom hooks
│   ├── utils/               # Utilidades
│   └── types/               # TypeScript types
├── public/                  # Assets estáticos
└── package.json            # Dependencias
```

### **Backend (FastAPI + Python)**
```
├── main.py                  # Servidor principal FastAPI
├── contract_ai.py           # Motor de generación de contratos
├── agents.py               # 5 Agentes de IA especializados
├── chat_enhanced.py        # Chat AI con persistencia
├── auth/                   # Sistema W-CSAP (19 módulos)
│   ├── w_csap.py          # Protocolo principal
│   ├── dpop.py            # DPoP authentication
│   ├── risk_scoring.py    # Puntuación de riesgo
│   └── ...                # 16 módulos adicionales
├── wallets/                # Sistema dual de wallets
├── gamification.py         # Sistema de XP y badges
├── token_system.py         # Token GigSoul
└── requirements.txt        # Dependencias Python
```

### **Infraestructura (Desarrollo Local)**
```
├── main.py                 # Servidor de desarrollo
├── frontend/               # React + Vite
├── admin-panel/            # Panel de administración
├── mobile-app/             # App móvil React Native
├── contracts/              # Smart contracts Solidity
├── docs/                   # Documentación completa
└── tests/                  # Suite de pruebas
```

## 🚀 Instalación Rápida

### **⚠️ IMPORTANTE: Solo Desarrollo Local (Sin Docker)**

GigChain está optimizado para desarrollo local sin Docker hasta completar todas las funcionalidades.

### **1. Prerrequisitos**
```bash
# Python 3.10+ (REQUERIDO)
python3 --version  # Debe ser 3.10+

# Node.js 18+ (REQUERIDO)
node --version     # Debe ser 18+

# Git
git --version
```

### **2. Configuración del Proyecto**
```bash
# Clonar el repositorio
git clone <your-repo-url>
cd GigChain

# Backend (Terminal 1)
pip install -r requirements.txt
python main.py
# Servidor en http://localhost:5000

# Frontend (Terminal 2)
cd frontend
npm install
npm run dev
# Frontend en http://localhost:5173
```

### **3. Variables de Entorno**
```bash
# Verificar .env existente (NO crear si ya existe)
cat .env  # Linux/Mac
type .env # Windows

# Variables requeridas:
OPENAI_API_KEY=your_openai_key
W_CSAP_SECRET_KEY=your_64_char_secret
DEBUG=True
PORT=5000
```

### **4. Verificación**
```bash
# Verificar servidor
curl http://localhost:5000/health

# Verificar dependencias
pip list | grep -E "(fastapi|openai|uvicorn)"

# Tests individuales
python test_chat.py
python test_contract_ai.py
```

## 🔧 Configuración Avanzada

### **Blockchain Networks**
- **Polygon Amoy** (Testnet) - Desarrollo y testing actual
- **Polygon Mainnet** (Futuro) - Red principal de producción
- **Ethereum Mainnet** (Futuro) - Expansión cross-chain

### **Base de Datos**
- **SQLite** - Desarrollo local (actual)
- **PostgreSQL** - Producción (futuro)
- **Redis** - Cache y sesiones (opcional)
- **IPFS** - Almacenamiento descentralizado

### **AI & Agents**
- **OpenAI GPT-4o-mini** - Modelo principal de IA
- **5 Agentes Especializados** - Negociación, generación, calidad, pagos, disputas
- **Chat AI** - Asistente conversacional con WebSocket

## 📱 Uso de la Plataforma

### **Para Freelancers**
1. **Conectar Wallet** - MetaMask o crear wallet interna
2. **Configurar Perfil** - Información profesional y skills
3. **Buscar Gigs** - Explorar oportunidades de trabajo
4. **Generar Contratos** - IA crea contratos automáticamente
5. **Trabajar** - Completar proyectos y entregables
6. **Recibir Pagos** - USDC automático por milestones
7. **Ganar XP** - Sistema de gamificación y reputación

### **Para Clientes**
1. **Conectar Wallet** - Autenticación Web3
2. **Publicar Proyecto** - Describir necesidades
3. **IA Negocia** - Agentes optimizan términos
4. **Revisar Contrato** - Generado automáticamente
5. **Firmar y Pagar** - Escrow con USDC
6. **Aprobar Milestones** - Liberar pagos progresivos
7. **Calificar** - Sistema de reviews y reputación

### **Para Desarrolladores**
1. **API REST** - 40+ endpoints documentados
2. **WebSocket** - Chat AI en tiempo real
3. **Smart Contracts** - Integración con Polygon
4. **W-CSAP Auth** - Autenticación descentralizada

## 🎯 Roadmap

### **Q4 2024** ✅ **COMPLETADO**
- [x] Backend FastAPI con 40+ endpoints
- [x] Frontend React optimizado
- [x] 5 Agentes de IA especializados
- [x] Sistema W-CSAP de autenticación
- [x] Smart contracts en Polygon
- [x] Sistema de gamificación
- [x] Chat AI con WebSocket
- [x] Documentación completa

### **Q1 2025** 🚧 **EN PROGRESO**
- [ ] Mobile App (React Native)
- [ ] Panel de administración MFA
- [ ] Sistema de reputación NFT
- [ ] Marketplace de plantillas
- [ ] Soporte multi-idioma

### **Q2 2025** 📋 **PLANIFICADO**
- [ ] Mainnet deployment
- [ ] Token GIGS launch
- [ ] Cross-chain support
- [ ] Advanced analytics
- [ ] Enterprise features

## 🤝 Contribuir

### **Desarrollo Local**
```bash
# Fork del repositorio
git clone <your-fork-url>
cd GigChain

# Crear rama de feature
git checkout -b feature/nueva-funcionalidad

# Desarrollo local (sin Docker)
python main.py  # Backend
cd frontend && npm run dev  # Frontend

# Tests
python test_chat.py
python test_contract_ai.py

# Commit y push
git add .
git commit -m "feat: nueva funcionalidad"
git push origin feature/nueva-funcionalidad
```

### **Áreas de Contribución**
- 🤖 **Agentes de IA** - Mejorar lógica de negociación
- ⚛️ **Frontend** - Componentes React y UX
- 🔗 **Smart Contracts** - Optimización de gas
- 📚 **Documentación** - Guías y ejemplos
- 🧪 **Testing** - Cobertura de pruebas
- 🔒 **Seguridad** - Auditorías y mejoras

### **Reportar Issues**
- Usar GitHub Issues con etiquetas
- Incluir logs y screenshots
- Describir pasos para reproducir

## 📄 Licencia

Este proyecto está licenciado bajo la **MIT License** - ver el archivo [LICENSE](LICENSE) para detalles.

## 🔗 Enlaces Importantes

- **API Docs**: http://localhost:5000/docs
- **Documentación**: [docs/INDEX.md](docs/INDEX.md)
- **Guía de Agentes**: [docs/guides/AGENTS.md](docs/guides/AGENTS.md)
- **Autenticación W-CSAP**: [docs/security/W_CSAP_INDEX.md](docs/security/W_CSAP_INDEX.md)
- **GitHub**: https://github.com/gigchain/gigchain

## 🙏 Agradecimientos

- **OpenAI** - GPT-4o-mini para agentes de IA
- **FastAPI** - Framework backend de alta performance
- **React** - Frontend moderno y reactivo
- **Polygon** - Blockchain escalable y eficiente
- **OpenZeppelin** - Librerías de smart contracts seguras
- **Comunidad Web3** - Inspiración y feedback continuo

---

**GigChain** - Revolucionando la economía gig con IA y Web3 🚀

*La plataforma más avanzada para freelancers y clientes en el ecosistema Web3*