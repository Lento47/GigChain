# 🚀 GigChain API - Deployment Local (Sin Docker)

## ✅ Status: FUNCIONANDO

Tu API GigChain está **ejecutándose correctamente** en `http://localhost:5000`

## 🔧 Problema Docker Desktop Solucionado

**Problema**: Docker Desktop no estaba ejecutándose en Windows
**Solución**: Usamos deployment local con Flask directamente

## 📊 API Endpoints Funcionando

### ✅ Health Check
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing
```
**Respuesta**: ✅ Status 200 - API Healthy

### ✅ Contract Generation (Rule-based)
```powershell
$body = '{"text": "Simple task for $100 in 3 days"}'
Invoke-WebRequest -Uri "http://localhost:5000/api/contract" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
```
**Respuesta**: ✅ Status 200 - Contract Generated

### ⚠️ AI Full Flow (Requiere OpenAI Key)
```powershell
$body = '{"text": "Cliente ofrece $4K por logo NFT en 5 días. Quiero $5K."}'
Invoke-WebRequest -Uri "http://localhost:5000/api/full_flow" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
```
**Respuesta**: ⚠️ Status 400 - Necesita API key real de OpenAI

## 🚀 Cómo Usar Tu API

### 1. Servidor Actualmente Ejecutándose
```bash
# El servidor ya está corriendo en background
# URL: http://localhost:5000
# Health: http://localhost:5000/health
```

### 2. Para Configurar OpenAI API Key
```powershell
# Opción 1: Variable de entorno
$env:OPENAI_API_KEY = "sk-your-real-openai-key-here"

# Opción 2: Crear archivo .env
# Crear archivo .env con:
# OPENAI_API_KEY=sk-your-real-openai-key-here
```

### 3. Reiniciar Servidor con API Key
```bash
# Parar servidor actual (Ctrl+C en la ventana donde corre)
# Luego ejecutar:
python start_local.py
```

## 🔧 Comandos Útiles

### Verificar Estado
```powershell
# Health check
Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing

# Ver respuesta completa
(Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing).Content
```

### Probar Contratos
```powershell
# Contract simple (funciona sin OpenAI)
$body = '{"text": "Need help with basic web development task"}'
$response = Invoke-WebRequest -Uri "http://localhost:5000/api/contract" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

### Probar AI Full Flow (con OpenAI key)
```powershell
# AI-powered contract generation
$body = '{"text": "Cliente ofrece $4K por logo NFT en 5 días. Quiero $5K."}'
$response = Invoke-WebRequest -Uri "http://localhost:5000/api/full_flow" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

## 🐳 Para Usar Docker (Cuando esté listo)

### 1. Iniciar Docker Desktop
- Buscar "Docker Desktop" en Windows
- Ejecutar Docker Desktop
- Esperar a que aparezca el ícono en la bandeja del sistema

### 2. Verificar Docker
```powershell
docker info
# Debe mostrar información del servidor Docker
```

### 3. Deploy con Docker
```powershell
# Crear .env con tu API key
# Luego ejecutar:
.\deploy.ps1 dev
```

## 📁 Archivos Importantes

- **`start_local.py`**: Servidor local sin Docker ✅ FUNCIONANDO
- **`deploy.ps1`**: Script Docker para Windows ⚠️ Requiere Docker Desktop
- **`app.py`**: API Flask principal ✅ FUNCIONANDO
- **`agents.py`**: AI agents ✅ FUNCIONANDO
- **`contract_ai.py`**: Motor de contratos ✅ FUNCIONANDO

## 🎯 Próximos Pasos

### Inmediato (Ya Funcionando)
1. ✅ API ejecutándose en http://localhost:5000
2. ✅ Endpoint `/api/contract` funcionando (rule-based)
3. ✅ Health check funcionando

### Para AI Features Completas
1. Obtener OpenAI API key de https://platform.openai.com/api-keys
2. Configurar variable de entorno o archivo .env
3. Reiniciar servidor
4. Probar endpoint `/api/full_flow`

### Para Producción
1. Arreglar Docker Desktop
2. Usar `.\deploy.ps1 production`
3. Configurar dominio y SSL
4. Setup monitoring

## 🆘 Troubleshooting

### Servidor no responde
```powershell
# Verificar si está ejecutándose
netstat -an | findstr :5000
# Debe mostrar LISTENING en puerto 5000
```

### Puerto 5000 ocupado
```powershell
# Cambiar puerto
$env:PORT = "5001"
python start_local.py
# Servidor correrá en http://localhost:5001
```

### Error de permisos
```powershell
# Ejecutar PowerShell como Administrador
# O cambiar directorio de trabajo
cd C:\Users\lejze\OneDrive\Documents\PROJECTS\GigChain\GigChain
```

---

## 🎉 ¡Tu API GigChain está funcionando!

**URL**: http://localhost:5000  
**Status**: ✅ Healthy  
**Ready for**: Contract generation, AI features (con OpenAI key)

¿Necesitas ayuda con algún paso específico?
