# 🚀 GigChain API Deployment Guide

Esta guía te ayudará a deployar tu propia instancia de la API de GigChain.

## ⚠️ ENFOQUE ACTUAL: DESARROLLO LOCAL

**Por ahora, usamos SOLO desarrollo local sin Docker** para optimizar velocidad de desarrollo.

## 📋 Prerrequisitos

### Desarrollo Local (ACTUAL)
- Python 3.10+ ✅ REQUERIDO
- Node.js 18+ (para frontend) ✅ REQUERIDO
- OpenAI API Key ✅ REQUERIDO
- Git ✅ REQUERIDO

### Producción con Docker (FUTURO)
- Docker y Docker Compose instalados ⏳ OPCIONAL (solo al final)
- VPS o servidor cloud ⏳ OPCIONAL (solo al final)

## 🔧 Configuración Inicial

### 1. Clonar el Repositorio
```bash
git clone <your-repo-url>
cd GigChain
```

### 2. Configurar Variables de Entorno
```bash
# Copiar archivo de ejemplo
cp env.example .env

# Editar .env con tus valores
nano .env  # o tu editor preferido
```

**Variables Requeridas:**
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
SECRET_KEY=your-secret-key-for-flask-sessions
DEBUG=false
PORT=5000
```

### 3. Instalar Dependencias (Desarrollo)
```bash
pip install -r requirements.txt
pip install flask flask-cors
```

## 🚀 Deployment Local (MÉTODO ACTUAL)

### Opción 1: Desarrollo Local (RECOMENDADO)

**Para Desarrollo Diario:**
```bash
# Verificar ambiente
cat .env  # Verificar que está configurado

# Verificar dependencias
pip list | grep -E "(fastapi|openai|uvicorn)"

# Verificar servidor
curl http://localhost:5000/health

# Iniciar servidor Backend
python main.py
# Server runs at http://localhost:5000

# En terminal separada: Frontend (opcional)
cd frontend
npm install
npm run dev
# Frontend runs at http://localhost:5173
```

**Tests Individuales:**
```bash
# Test específicos (sin Docker)
python test_chat.py
python test_contract_ai.py
python test_api.py
python test_agents_enhanced.py
```

## 🐳 Deployment con Docker (⚠️ SOLO AL FINAL)

> **IMPORTANTE**: Docker está deshabilitado temporalmente. Solo usar cuando todas las funcionalidades estén completas.

### Opción 1: Docker Compose (FUTURO)

**Para Producción (al final):**
```bash
# ❌ NO USAR POR AHORA

# Linux/Mac
./deploy.sh production

# Windows PowerShell
.\deploy.ps1 production
```

### Opción 2: Docker Manual (FUTURO)
```bash
# ❌ NO USAR POR AHORA

# Build de la imagen
docker build -t gigchain-api .

# Ejecutar contenedor
docker run -d \
  --name gigchain-api \
  -p 5000:5000 \
  -e OPENAI_API_KEY=your-key-here \
  -e SECRET_KEY=your-secret-key \
  gigchain-api
```

## 🌐 Endpoints de la API

### Health Check
```bash
curl http://localhost:5000/health
```

**Respuesta:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T12:00:00",
  "service": "GigChain API",
  "version": "1.0.0"
}
```

### Full Flow (AI Chaining)
```bash
curl -X POST http://localhost:5000/api/full_flow \
  -H "Content-Type: application/json" \
  -d '{"text": "Cliente ofrece $4K por logo NFT en 5 días. Quiero $5K."}'
```

**Respuesta:**
```json
{
  "contract_id": "gig_2025-01-01T12:00:00",
  "escrow_ready": true,
  "json": {
    "counter_offer": 4500.0,
    "milestones": [...],
    "disclaimer": "Este es un borrador AI generado por GigChain.io..."
  },
  "api_metadata": {
    "timestamp": "2025-01-01T12:00:00",
    "endpoint": "full_flow"
  }
}
```

### Contract Simple (Rule-based)
```bash
curl -X POST http://localhost:5000/api/contract \
  -H "Content-Type: application/json" \
  -d '{"text": "Simple task for $100 in 3 days"}'
```

## 🔒 Configuración de Producción

### 1. Nginx Reverse Proxy
El archivo `nginx.conf` incluye configuración para:
- Rate limiting (10 requests/second)
- Security headers
- CORS configuration
- SSL termination

### 2. Variables de Entorno de Producción
```env
DEBUG=false
SECRET_KEY=very-secure-random-key-here
OPENAI_API_KEY=sk-your-production-key
PORT=5000
```

### 3. SSL/TLS
Para HTTPS en producción:
1. Obtén certificados SSL (Let's Encrypt recomendado)
2. Descomenta la configuración HTTPS en `nginx.conf`
3. Actualiza `server_name` con tu dominio

### 4. Monitoreo
Considera agregar:
- Sentry para error tracking
- Prometheus/Grafana para métricas
- Log aggregation (ELK stack)

## 🧪 Testing

### Tests Locales
```bash
# Ejecutar todos los tests
python -m pytest tests/ -v

# Test específico
python -m pytest tests/test_contract_ai.py::test_full_flow_chaining -v
```

### Tests de API
```bash
# Test de health check
curl -f http://localhost:5000/health

# Test de endpoint completo
curl -X POST http://localhost:5000/api/full_flow \
  -H "Content-Type: application/json" \
  -d '{"text": "Test contract"}' \
  | jq .
```

## 📊 Monitoreo y Logs

### Ver Logs
```bash
# Logs del contenedor
docker-compose logs gigchain-api

# Logs en tiempo real
docker-compose logs -f gigchain-api
```

### Métricas de Health
```bash
# Check de salud
curl http://localhost:5000/health

# Información del contenedor
docker stats gigchain-api
```

## 🔄 Actualizaciones

### Deploy de Nueva Versión
```bash
# 1. Pull cambios
git pull origin main

# 2. Rebuild y redeploy
./deploy.sh production

# 3. Verificar
curl http://localhost:5000/health
```

### Rollback
```bash
# Volver a versión anterior
git checkout previous-commit
./deploy.sh production
```

## 🚨 Troubleshooting

### Problemas Comunes

**1. Error: OpenAI API Key not configured**
```bash
# Verificar variable de entorno
echo $OPENAI_API_KEY
# o en Windows
echo $env:OPENAI_API_KEY
```

**2. Puerto 5000 ya en uso**
```bash
# Cambiar puerto en .env
PORT=5001

# O matar proceso que usa el puerto
lsof -ti:5000 | xargs kill -9  # Linux/Mac
netstat -ano | findstr :5000   # Windows
```

**3. Docker build falla**
```bash
# Limpiar cache de Docker
docker system prune -a

# Rebuild sin cache
docker build --no-cache -t gigchain-api .
```

**4. Tests fallan**
```bash
# Verificar dependencias
pip install -r requirements.txt

# Ejecutar con verbose
python -m pytest tests/ -v -s
```

## 📞 Soporte

Para problemas o preguntas:
1. Revisa los logs: `docker-compose logs gigchain-api`
2. Verifica configuración: `cat .env`
3. Testa endpoints manualmente
4. Consulta documentación de OpenAI API

## 🔐 Seguridad

### Checklist de Seguridad
- [ ] SECRET_KEY fuerte y único
- [ ] OPENAI_API_KEY válido y con límites apropiados
- [ ] Firewall configurado (solo puertos necesarios)
- [ ] SSL/TLS en producción
- [ ] Rate limiting habilitado
- [ ] Logs de acceso monitoreados
- [ ] Actualizaciones de seguridad regulares

### Backup
```bash
# Backup de configuración
tar -czf gigchain-backup-$(date +%Y%m%d).tar.gz .env docker-compose.yml

# Backup de logs
docker-compose logs gigchain-api > logs-backup-$(date +%Y%m%d).log
```

---

**Disclaimer:** Este deployment es para uso en desarrollo y producción pequeña. Para escalabilidad empresarial, considera Kubernetes o servicios cloud como AWS ECS/Azure Container Instances.
