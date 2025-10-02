# 🚀 GigChain.io - AI-Powered Contract Generation

**GigChain.io** es una plataforma que utiliza inteligencia artificial para generar contratos Web3 inteligentes para la economía gig, con soporte para escrow automático en Polygon usando USDC.

## ✨ Características

- 🤖 **AI Agent Chaining**: Negociación, generación y resolución de disputas con múltiples agents
- 🔗 **Web3 Integration**: Contratos listos para deploy en Polygon con USDC escrow
- 📊 **Rule-based Fallback**: Sistema híbrido que usa IA para casos complejos y reglas para casos simples
- 🐳 **Docker Ready**: Deployment containerizado con Docker Compose
- 🔒 **Production Ready**: Nginx reverse proxy, rate limiting, y configuración de seguridad

## 🏗️ Arquitectura

### Core Components
- **`contract_ai.py`**: Motor principal de parsing y generación de contratos
- **`agents.py`**: Sistema de AI agents con chaining (Negotiation → Generator → Resolver)
- **`app.py`**: API Flask con endpoints RESTful
- **Docker**: Containerización completa con Nginx

### AI Agents
1. **NegotiationAgent**: Genera contraofertas equilibradas basadas en complejidad
2. **ContractGeneratorAgent**: Agrega clauses escrow y parámetros Solidity
3. **DisputeResolverAgent**: Hook para resolución de disputas futuras

## 🚀 Quick Start

### 1. Setup Local
```bash
# Clone repository
git clone <your-repo-url>
cd GigChain

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp env.example .env
# Edit .env with your OPENAI_API_KEY

# Run tests
python -m pytest tests/ -v

# Start development server
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
├── app.py                 # Flask API server
├── contract_ai.py         # Core contract generation
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Multi-service setup
├── nginx.conf             # Nginx reverse proxy
├── deploy.sh              # Linux/Mac deployment script
├── deploy.ps1             # Windows PowerShell script
├── DEPLOYMENT.md          # Detailed deployment guide
├── requirements.txt       # Python dependencies
├── tests/                 # Test suite
│   ├── test_contract_ai.py
│   └── test_api.py
└── env.example            # Environment template
```

## 🔒 Security Features

- **Rate Limiting**: 10 requests/second por IP
- **Input Validation**: Sanitización de inputs
- **Error Handling**: Manejo seguro de errores sin exposición de datos
- **CORS**: Configuración restrictiva para frontend
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, etc.
- **Environment Isolation**: Variables de entorno para secrets

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
