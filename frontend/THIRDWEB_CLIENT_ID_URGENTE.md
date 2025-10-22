# 🚨 URGENTE: Tu Client ID de ThirdWeb NO es válido

## ❌ **Problema Detectado**

Tu archivo `frontend/.env` tiene:
```env
VITE_THIRDWEB_CLIENT_ID=9c621a6c7b9c3570ef9f6fceecc768f3
```

Este es el **Client ID de ejemplo/fallback** que viene hardcodeado en el código. **NO es tu propio Client ID**.

Por eso sigues viendo errores 401:
```
POST https://c.thirdweb.com/event 401 (Unauthorized)
GET https://social.thirdweb.com/v1/profiles/... 401 (Unauthorized)
```

---

## ✅ **Solución: Obtén tu PROPIO Client ID**

### Paso 1: Crear cuenta en ThirdWeb
1. Ve a **https://thirdweb.com/dashboard**
2. Haz clic en **"Sign Up"** o **"Log In"**
3. Puedes usar:
   - Google
   - GitHub
   - Email
   - O conectar tu wallet

### Paso 2: Crear un nuevo proyecto
1. Una vez dentro del dashboard, haz clic en **"Create Project"** o **"New Project"**
2. Dale un nombre, por ejemplo: `"GigChain"`
3. Selecciona el tipo: **"Web Application"**

### Paso 3: Obtener tu Client ID
1. Ve a tu proyecto en el dashboard
2. Haz clic en **"Settings"** (⚙️) en el menú lateral
3. Ve a la sección **"API Keys"**
4. Copia tu **"Client ID"**
   - Se verá algo como: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
   - Es un string de 32 caracteres alfanuméricos

### Paso 4: Actualizar tu .env
1. Abre `frontend/.env`
2. Reemplaza la línea del Client ID:
   ```env
   # ANTES (❌ NO VÁLIDO)
   VITE_THIRDWEB_CLIENT_ID=9c621a6c7b9c3570ef9f6fceecc768f3
   
   # DESPUÉS (✅ TU PROPIO CLIENT ID)
   VITE_THIRDWEB_CLIENT_ID=tu_client_id_real_de_32_caracteres_aqui
   ```

### Paso 5: Reiniciar el servidor
```bash
# Detén el servidor (Ctrl+C)

# Reinicia
cd frontend
npm run dev
```

### Paso 6: Verificar en el navegador
1. Abre la consola del navegador (F12)
2. Deberías ver:
   ```
   ✅ Thirdweb Client ID configured successfully: tu_client...
   ```
3. **NO** deberías ver errores 401 de `c.thirdweb.com` o `social.thirdweb.com`

---

## 🔍 **Verificación Rápida**

### ❌ Client ID NO válido (el que tienes ahora):
```
9c621a6c7b9c3570ef9f6fceecc768f3
```
Este es el de ejemplo que viene en el código.

### ✅ Client ID válido (ejemplo de cómo se ve uno real):
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```
Será diferente, único para tu cuenta de ThirdWeb.

---

## 🎯 **Estado de los Problemas**

| Problema | Estado | Acción Requerida |
|----------|--------|------------------|
| Error de desconexión | ✅ **ARREGLADO** | Reiniciar frontend |
| Errores 401 ThirdWeb | ⚠️ **PENDIENTE** | Obtener tu propio Client ID |
| Dropdown no cierra | ✅ **ARREGLADO** | Reiniciar frontend |

---

## 📝 **IMPORTANTE: Seguridad del .env**

⚠️ **NUNCA compartas tu archivo `.env` completo**

Tu archivo `frontend/.env` actualmente contiene:
- ✅ `VITE_THIRDWEB_CLIENT_ID` - OK compartir (es público)
- ❌ `OPENAI_API_KEY` - **¡NO DEBERÍA ESTAR AHÍ!**
- ❌ `SECRET_KEY` - **¡NO DEBERÍA ESTAR AHÍ!**
- ❌ `W_CSAP_SECRET_KEY` - **¡NO DEBERÍA ESTAR AHÍ!**

### 🔧 **Arreglar separación Frontend/Backend**

**El archivo `frontend/.env` debería tener SOLO**:
```env
# API Configuration
VITE_API_URL=http://localhost:5000

# Thirdweb Configuration
VITE_THIRDWEB_CLIENT_ID=tu_client_id_aqui
```

**Las API keys del backend (OpenAI, etc.) deberían estar en `.env` en la raíz del proyecto, NO en `frontend/.env`**

---

## 🆘 **Si sigues viendo errores después de configurar**

1. **Limpia la caché del navegador**:
   - Chrome/Edge: Ctrl+Shift+Delete
   - Selecciona "Cached images and files"
   - Click "Clear data"

2. **Limpia la caché de Vite**:
   ```bash
   cd frontend
   rm -rf node_modules/.vite
   npm run dev
   ```

3. **Verifica que el Client ID es diferente al de ejemplo**:
   - Si es `9c621a6c7b9c3570ef9f6fceecc768f3` = ❌ Es el de ejemplo
   - Si es otro string de 32 chars = ✅ Es tu propio ID

4. **Verifica en ThirdWeb Dashboard**:
   - Asegúrate que tu proyecto esté activo
   - Verifica que el Client ID esté habilitado
   - Revisa los dominios permitidos (agregar `localhost:5173`)

---

## ✅ **Resumen de Acciones**

1. ✅ **YA ARREGLADO**: Código de desconexión (usar `useActiveWallet`)
2. ⏳ **PENDIENTE**: Obtener tu Client ID en https://thirdweb.com/dashboard
3. ⏳ **PENDIENTE**: Actualizar `frontend/.env` con tu Client ID real
4. ⏳ **PENDIENTE**: Reiniciar servidor frontend
5. 📌 **RECOMENDADO**: Separar variables de frontend/backend en archivos .env distintos

---

*Una vez que tengas tu PROPIO Client ID de ThirdWeb, los errores 401 desaparecerán.*

**¿Necesitas ayuda?** Revisa la documentación oficial: https://portal.thirdweb.com/typescript/v5/client

