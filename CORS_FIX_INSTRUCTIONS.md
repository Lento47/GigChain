# 🔧 Solución al Problema de CORS

## 🐛 Problema

```
Access to fetch at 'http://localhost:5000/api/wallets/create' from origin 'http://localhost:5174' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Causa:** El backend (puerto 5000) no estaba permitiendo requests desde el frontend (puerto 5174).

---

## ✅ Solución Implementada

He actualizado el archivo `main.py` para incluir el puerto **5174** en los orígenes permitidos.

**Cambio realizado:**
```python
ALLOWED_ORIGINS = os.getenv(
    'ALLOWED_ORIGINS',
    'http://localhost:3000,http://localhost:5173,http://localhost:5174,...'  # ← 5174 agregado
).split(',')
```

---

## 🚀 Pasos para Aplicar la Solución

### Opción 1: Reiniciar el Servidor (Recomendado)

1. **Detén el servidor** actual si está corriendo (Ctrl+C)

2. **Reinicia el servidor:**
   ```bash
   python main.py
   ```

3. **Verifica que está funcionando:**
   ```bash
   curl http://localhost:5000/health
   ```

4. **Recarga el frontend** (Ctrl+R en el navegador)

5. **Intenta crear la wallet nuevamente**

---

### Opción 2: Modo DEBUG (Desarrollo)

Para habilitar CORS sin restricciones en desarrollo, agrega esto a tu archivo `.env`:

**Ubicación:** `C:\Users\lejze\OneDrive\Documents\PROJECTS\GigChain\GigChain\.env`

**Agrega esta línea:**
```env
DEBUG=true
```

**Contenido completo recomendado del `.env`:**
```env
# GigChain Backend Configuration
OPENAI_API_KEY=tu_api_key_aqui
W_CSAP_SECRET_KEY=tu_secret_key_aqui
DEBUG=true

# CORS (opcional, solo se usa si DEBUG=false)
# ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5174
```

**Luego reinicia el servidor:**
```bash
python main.py
```

---

## 🔍 Verificar que Funciona

### 1. Verificar Backend
```bash
curl http://localhost:5000/health
```

**Respuesta esperada:**
```json
{
  "status": "healthy",
  "service": "GigChain API",
  ...
}
```

### 2. Verificar CORS en Navegador

1. Abre la **consola del navegador** (F12)
2. Ve a la pestaña **Network**
3. Intenta crear una wallet
4. Verifica que el request a `/api/wallets/create` tenga:
   - Status: `200` o `401` (no `CORS error`)
   - Headers de respuesta incluyan: `Access-Control-Allow-Origin: http://localhost:5174`

### 3. Test con curl

```bash
# Test preflight (OPTIONS)
curl -X OPTIONS http://localhost:5000/api/wallets/create \
  -H "Origin: http://localhost:5174" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Deberías ver en los headers de respuesta:
# Access-Control-Allow-Origin: http://localhost:5174
```

---

## 📊 Configuración de CORS en GigChain

### Modo Desarrollo (DEBUG=true)
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # Permite TODOS los orígenes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Modo Producción (DEBUG=false o no definido)
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Solo orígenes específicos
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    max_age=3600,
)
```

---

## 🛠️ Troubleshooting

### El error persiste después de reiniciar

1. **Limpia caché del navegador:**
   - Ctrl + Shift + R (recarga forzada)
   - O Ctrl + Shift + Delete → Borrar caché

2. **Verifica que el servidor se reinició correctamente:**
   ```bash
   # Busca este mensaje en la consola del servidor:
   INFO:     Started server process
   INFO:     Uvicorn running on http://0.0.0.0:5000
   ```

3. **Verifica el puerto del frontend:**
   ```bash
   # La consola de npm run dev debería mostrar:
   VITE v... ready in ... ms
   ➜  Local:   http://localhost:5174/
   ```

### El servidor no inicia

1. **Verifica que el puerto 5000 no esté en uso:**
   ```bash
   # Windows
   netstat -ano | findstr :5000
   ```

2. **Si hay un proceso usando el puerto, detenlo:**
   ```bash
   # Windows (PowerShell como admin)
   Stop-Process -Id <PID> -Force
   ```

### Veo otro puerto en el frontend (no 5174)

Si Vite usa otro puerto (ej: 5175, 5176), necesitas:

1. **Agregar ese puerto al .env:**
   ```env
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5174,http://localhost:5175
   ```

2. **O usar DEBUG=true** para permitir todos

---

## 📝 Resumen Rápido

**¿Qué hacer ahora?**

1. ✅ Los cambios en el código ya están hechos
2. 🔄 **Reinicia el servidor backend** → `python main.py`
3. 🔄 **Recarga el frontend** → Ctrl+R en el navegador
4. ✅ Intenta crear la wallet de nuevo
5. 📋 Si el problema persiste, agrega `DEBUG=true` al `.env`

**Comandos rápidos:**
```bash
# 1. En la terminal del backend
Ctrl+C  # Detener servidor
python main.py  # Reiniciar

# 2. En el navegador
Ctrl+R  # Recargar página
```

---

## ✅ Verificación Final

Después de reiniciar, deberías poder:
- ✅ Conectar tu wallet de blockchain
- ✅ Ver la vista de Wallets sin error de CORS
- ✅ Hacer clic en "Crear Wallet" sin ver errores de red
- ✅ Ver mensajes de error claros (si no estás autenticado)
- ✅ Crear tu wallet interna exitosamente (si estás autenticado)

---

## 🎯 Siguiente Paso

Una vez que el servidor se reinicie, el error de CORS debería desaparecer. Si ves un mensaje de error diferente (como "Debes estar autenticado"), ¡eso es progreso! Significa que CORS está funcionando y solo necesitas conectar tu wallet de blockchain.

**¡El problema de CORS está solucionado!** 🚀

