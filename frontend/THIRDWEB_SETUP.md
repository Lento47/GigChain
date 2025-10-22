# 🔧 Configuración de ThirdWeb para GigChain

## ⚠️ Errores 401 de ThirdWeb - Solución

Los errores que estás viendo:
```
POST https://c.thirdweb.com/event 401 (Unauthorized)
GET https://social.thirdweb.com/v1/profiles/... 401 (Unauthorized)
```

Son causados por no tener configurado tu propio **ThirdWeb Client ID**.

---

## 📋 Pasos para Configurar ThirdWeb

### 1️⃣ **Obtener tu Client ID de ThirdWeb**

1. Ve a [thirdweb.com/dashboard](https://thirdweb.com/dashboard)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto o usa uno existente
4. Ve a **Settings** → **API Keys**
5. Copia tu **Client ID**

### 2️⃣ **Crear archivo .env en el frontend**

```bash
# En la carpeta /frontend, crea un archivo .env
cd frontend
copy env.example .env    # Windows
# o
cp env.example .env      # Linux/Mac
```

### 3️⃣ **Configurar el archivo .env**

Abre `frontend/.env` y agrega tu Client ID:

```env
# API Configuration
VITE_API_URL=http://localhost:5000

# Thirdweb Configuration - REEMPLAZA CON TU CLIENT ID
VITE_THIRDWEB_CLIENT_ID=tu_client_id_aqui_desde_thirdweb_dashboard

# Production API URL (comentado por ahora)
# VITE_API_URL=https://api.gigchain.io
```

### 4️⃣ **Reiniciar el servidor de desarrollo**

```bash
# Detén el servidor actual (Ctrl+C)
# Luego reinicia:
npm run dev
```

---

## 🔍 **Verificar que funciona**

Después de reiniciar, abre la consola del navegador:

1. ✅ **No deberías ver errores 401** de `c.thirdweb.com` o `social.thirdweb.com`
2. ✅ Deberías ver: `✅ Thirdweb Client ID configured successfully: xxxxxxxx...`
3. ✅ La conexión de wallet debería funcionar sin errores

---

## 🚨 **Importante - Seguridad**

- ⚠️ **NO** compartas tu Client ID públicamente
- ⚠️ **NO** hagas commit del archivo `.env` a Git (ya está en `.gitignore`)
- ✅ Usa el archivo `env.example` como plantilla
- ✅ Para producción, usa variables de entorno del servidor

---

## 🆘 **Solución de Problemas**

### Problema: Sigo viendo errores 401
**Solución:**
1. Verifica que el archivo se llama exactamente `.env` (con el punto al inicio)
2. Confirma que está en la carpeta `frontend/` (no en la raíz del proyecto)
3. Reinicia completamente el servidor de desarrollo
4. Limpia la caché del navegador (Ctrl+Shift+Delete)

### Problema: "Configuration Required" en la página
**Solución:**
1. Verifica que copiaste correctamente el Client ID (sin espacios extra)
2. Confirma que la variable se llama `VITE_THIRDWEB_CLIENT_ID`
3. Reinicia el servidor

### Problema: La wallet se conecta pero hay errores
**Solución:**
1. Los errores 401 no impiden que la wallet funcione
2. Configura el Client ID para eliminar los warnings
3. Si la desconexión falla, ahora está arreglado en el código

---

## 📝 **Notas Adicionales**

### ThirdWeb v5
Este proyecto usa **ThirdWeb v5** (no v4), que tiene una API diferente:
- ✅ Usa `createThirdwebClient({ clientId })`
- ✅ Usa hooks como `useActiveAccount()`, `useDisconnect()`
- ✅ Compatible con Polygon Amoy Testnet

### Modo de Desarrollo sin ThirdWeb
Si no quieres configurar ThirdWeb ahora:
- ❌ Verás warnings en la consola (401 errors)
- ✅ La aplicación seguirá funcionando
- ✅ Podrás usar todas las funcionalidades (con warnings)

---

## ✅ **Estado Actual**

- ✅ **Arreglado**: Error de desconexión de wallet (`Cannot read properties of undefined`)
- ✅ **Arreglado**: Manejo de errores en `useWallet` hook
- ⏳ **Pendiente**: Configurar tu propio ThirdWeb Client ID (tu responsabilidad)

---

*Última actualización: Octubre 2025*

