# 🚀 GigChain.io - AI-Powered Web3 Contract Generation

[![CI/CD Pipeline](https://github.com/yourusername/GigChain/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/GigChain/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/yourusername/GigChain/branch/main/graph/badge.svg)](https://codecov.io/gh/yourusername/GigChain)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

**GigChain.io** es una plataforma completa que utiliza inteligencia artificial para generar contratos Web3 inteligentes para la economía gig, con soporte para escrow automático en Polygon usando USDC. Construido con FastAPI, React, y deployment containerizado con Docker.

> 🎉 **Recently Polished** (2025-10-06): Complete code quality improvements including professional logging, production security, comprehensive error handling, and performance optimizations. See [POLISH_COMPLETE_REPORT.md](POLISH_COMPLETE_REPORT.md) for details.

## ✨ Características

- 🤖 **AI Agent Chaining**: Negociación, generación y resolución de disputas con múltiples agents
- 🔗 **Web3 Integration**: Contratos listos para deploy en Polygon con USDC escrow
- ⚛️ **React Frontend**: Interfaz moderna con Thirdweb wallet integration
- 🚀 **FastAPI Backend**: API de alta performance con documentación automática
- 📊 **Rule-based Fallback**: Sistema híbrido que usa IA para casos complejos y reglas para casos simples
- 🐳 **Docker Ready**: Deployment containerizado con Docker Compose
- 🌐 **VPS Deployment**: Setup automatizado para DigitalOcean y otros VPS
- 🔒 **Production Ready**: Nginx reverse proxy, rate limiting, SSL, y configuración de seguridad

## 🏗️ Arquitectura

### Core Components
- **`contract_ai.py`**: Motor principal de parsing y generación de contratos
- **`agents.py`**: Sistema de AI agents con chaining (Negotiation → Generator → Resolver)
- **`main.py`**: FastAPI server (producción) con endpoints RESTful y documentación auto-generada
- **`app.py`**: Flask server (legacy, compatibilidad) - se recomienda migrar a FastAPI
- **`auth/`**: Sistema W-CSAP (Wallet Challenge-Signature Authentication Protocol) para autenticación Web3
- **Docker**: Containerización completa con Nginx, rate limiting y security headers

### AI Agents
1. **NegotiationAgent**: Genera contraofertas equilibradas basadas en complejidad
2. **ContractGeneratorAgent**: Agrega clauses escrow y parámetros Solidity
3. **DisputeResolverAgent**: Hook para resolución de disputas futuras

## 🚀 Quick Start

### 1. Setup Local (Recommended: FastAPI)
```bash
# Clone repository
git clone <your-repo-url>
cd GigChain

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your OPENAI_API_KEY and other variables

# Run tests
python -m pytest tests/ -v

# Start FastAPI development server (recommended)
python main.py
# Server runs at http://localhost:5000
# API docs available at http://localhost:5000/docs
# Alternative docs at http://localhost:5000/redoc

# Or start Flask server (legacy)
python app.py
```

### 2. Docker Deployment
```bash
# Quick start with Docker
./deploy.sh dev

# Or with PowerShell on Windows
.\deploy.ps1 dev

# Production deployment
./deploy.sh production
```

## 📚 API Endpoints

### Health Check
```bash
GET /health
```

### AI-Powered Contract Generation
```bash
POST /api/full_flow
Content-Type: application/json

{
  "text": "Cliente ofrece $4K por logo NFT en 5 días. Quiero $5K."
}
```

**Response:**
```json
{
  "contract_id": "gig_2025-01-01T12:00:00",
  "escrow_ready": true,
  "json": {
    "counter_offer": 4500.0,
    "milestones": [
      {
        "desc": "Initial setup",
        "amount": 1350.0,
        "deadline": "2025-01-15"
      }
    ],
    "disclaimer": "Este es un borrador AI generado por GigChain.io..."
  }
}
```

### Simple Contract Generation
```bash
POST /api/contract
Content-Type: application/json

{
  "text": "Simple task for $100 in 3 days"
}
```

## 🧪 Testing

```bash
# Run all tests
python -m pytest tests/ -v

# Test specific component
python -m pytest tests/test_contract_ai.py -v
python -m pytest tests/test_api.py -v

# Test with coverage
python -m pytest tests/ --cov=. --cov-report=html
```

## 🔧 Configuration

### Environment Variables
```env
OPENAI_API_KEY=sk-your-openai-key-here
SECRET_KEY=your-secret-key-for-flask
DEBUG=false
PORT=5000
```

### Complexity Logic
- **Low**: Sin amounts detectados → Rule-based fallback
- **Medium**: Con amounts pero <2 riesgos → AI chaining
- **High**: Múltiples riesgos → AI + DisputeResolver

## 🐳 Docker Deployment

### Development
```bash
docker-compose up gigchain-api
```

### Production
```bash
docker-compose --profile production up -d
```

### Features
- ✅ Nginx reverse proxy
- ✅ Rate limiting (10 req/s)
- ✅ Security headers
- ✅ CORS configuration
- ✅ Health checks
- ✅ Auto-restart

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

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## ⚠️ Disclaimer

**Importante**: Los contratos generados por GigChain.io son borradores AI y NO constituyen consejo legal. Siempre consulta con un experto legal antes de usar en producción. El sistema cumple con MiCA/GDPR pero requiere validación manual para compliance específico.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Documentation**: Ver `DEPLOYMENT.md` para guía detallada
- **API Docs**: Endpoints documentados en este README

---

**GigChain.io** - Democratizando la economía gig con contratos Web3 inteligentes 🤖⚡
