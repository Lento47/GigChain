# 🌐 Guía para Cambiar a Mumbai Testnet

## ✅ Solución Implementada

He agregado un **banner de alerta automático** que aparecerá cuando estés en la red incorrecta, con un botón para cambiar automáticamente a Mumbai.

---

## 🚀 Cómo Cambiar de Red

### **Método 1: Usar el Banner Automático** ⚡ (MÁS FÁCIL)

Cuando la aplicación detecte que estás en la red incorrecta (como Sepolia), verás un banner amarillo en la parte superior con el mensaje:

```
⚠️ Red Incorrecta Detectada
Esta aplicación requiere la red Mumbai Testnet. 
Por favor, cambia de red para continuar.

[Cambiar a Mumbai]
```

**Simplemente:**
1. Haz clic en el botón **"Cambiar a Mumbai"**
2. MetaMask te pedirá confirmación
3. Haz clic en **"Switch network"** en MetaMask
4. ¡Listo! La alerta desaparecerá automáticamente

---

### **Método 2: Cambiar Manualmente en MetaMask** 🦊

Si prefieres cambiar manualmente:

1. **Abre MetaMask** (haz clic en el ícono del zorro en tu navegador)
2. **Haz clic en el selector de red** (arriba, donde dice el nombre de la red actual)
3. **Busca "Mumbai"** o **"Polygon Mumbai"**
4. **Haz clic en Mumbai** para cambiar

---

### **Método 3: Agregar Mumbai si No la Tienes** 🆕

Si Mumbai no aparece en tu lista de redes:

#### **Opción A: Usar Chainlist (Más Rápido)**
1. Ve a: https://chainlist.org/?search=mumbai&testnets=true
2. Activa la opción **"Include Testnets"**
3. Busca **"Mumbai"**
4. Haz clic en **"Add to MetaMask"**
5. Confirma en MetaMask

#### **Opción B: Agregar Manualmente**
1. En MetaMask, haz clic en el selector de red
2. Haz clic en **"Add network"**
3. Selecciona **"Add a network manually"**
4. Ingresa estos datos:

```
Network Name: Mumbai Testnet
New RPC URL: https://rpc-mumbai.maticvigil.com
Chain ID: 80001
Currency Symbol: MATIC
Block Explorer URL: https://mumbai.polygonscan.com
```

5. Haz clic en **"Save"**
6. Cambia a Mumbai en el selector de red

---

## 🔍 Cómo Saber si Estás en la Red Correcta

### **Indicadores Visuales:**

✅ **Red Correcta (Mumbai):**
- No verás el banner de alerta amarillo
- En MetaMask verás: **"Mumbai Testnet"** o **"Polygon Mumbai"**
- Chain ID: **80001**

❌ **Red Incorrecta (Ej: Sepolia):**
- Verás el banner de alerta amarillo en la parte superior
- En MetaMask verás: **"Sepolia"**, **"Ethereum Mainnet"**, u otra red
- Chain ID: Diferente a **80001**

### **Verificar en la Consola del Navegador:**

1. Presiona **F12** para abrir Developer Tools
2. Ve a la pestaña **Console**
3. Busca mensajes como:

```javascript
// ✅ Red correcta
Wallet state changed: { chainId: 80001, isCorrectChain: true }

// ❌ Red incorrecta
Wallet state changed: { chainId: 11155111, isCorrectChain: false }
```

---

## 🎁 Conseguir MATIC de Mumbai (Para Pagar Gas)

Una vez que estés en Mumbai, necesitarás MATIC de prueba para hacer transacciones:

### **Faucets Recomendados:**

1. **Polygon Faucet** (Oficial):
   - URL: https://faucet.polygon.technology/
   - Pasos:
     1. Conecta tu wallet
     2. Selecciona **"Mumbai"**
     3. Selecciona **"MATIC Token"**
     4. Completa el CAPTCHA
     5. Haz clic en **"Submit"**
     6. Espera 1-2 minutos

2. **Alchemy Mumbai Faucet**:
   - URL: https://mumbaifaucet.com/
   - Pasos:
     1. Pega tu dirección de wallet
     2. Completa el CAPTCHA
     3. Haz clic en **"Send Me MATIC"**

3. **ChainLink Faucet**:
   - URL: https://faucets.chain.link/mumbai
   - Pasos:
     1. Conecta tu wallet
     2. Haz clic en **"Send request"**

**Nota:** Cada faucet te dará entre 0.1 y 1 MATIC. Si necesitas más, espera 24 horas o prueba otro faucet.

---

## 📊 Comparación de Redes

| Red | Chain ID | Tipo | ¿Para GigChain? |
|-----|----------|------|-----------------|
| **Mumbai** | 80001 | Testnet (Polygon) | ✅ **SÍ - Esta es la correcta** |
| Sepolia | 11155111 | Testnet (Ethereum) | ❌ No compatible |
| Goerli | 5 | Testnet (Ethereum) | ❌ No compatible |
| Ethereum Mainnet | 1 | Mainnet | ❌ No usar (dinero real) |
| Polygon Mainnet | 137 | Mainnet | ❌ No usar (dinero real) |

---

## 🔄 Flujo Completo: Desde Sepolia a Mumbai

### **Paso a Paso:**

1. **Situación Inicial:**
   - Estás en Sepolia (o cualquier red incorrecta)
   - Ves el banner amarillo de alerta

2. **Cambiar de Red:**
   - Opción A: Haz clic en **"Cambiar a Mumbai"** en el banner
   - Opción B: Cambia manualmente en MetaMask

3. **Confirmar en MetaMask:**
   - Se abrirá un popup de MetaMask
   - Haz clic en **"Switch network"** o **"Cambiar red"**

4. **Verificación:**
   - El banner desaparece automáticamente
   - En MetaMask verás **"Mumbai Testnet"**
   - Ya puedes usar GigChain sin problemas

5. **Conseguir MATIC:**
   - Ve a un faucet de Mumbai
   - Solicita MATIC de prueba
   - Espera 1-2 minutos

6. **¡Listo para Usar GigChain!**
   - Crea tu wallet interna
   - Genera contratos
   - Realiza transacciones

---

## 🛠️ Troubleshooting

### **"El botón no hace nada"**

1. **Asegúrate de que MetaMask esté desbloqueado**
2. **Verifica que no haya popups bloqueados** en tu navegador
3. **Intenta cambiar manualmente** desde MetaMask
4. **Recarga la página** (Ctrl+R) e intenta de nuevo

### **"MetaMask no me deja cambiar de red"**

1. **Actualiza MetaMask** a la última versión
2. **Desbloquea MetaMask** si está bloqueado
3. **Agrega Mumbai manualmente** usando el Método 3
4. **Reinicia el navegador** y vuelve a intentar

### **"No tengo MetaMask"**

1. **Instala MetaMask:**
   - Chrome: https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn
   - Firefox: https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/
   - Brave: Ya viene integrado

2. **Crea una wallet:**
   - Haz clic en "Create a wallet"
   - Guarda tu frase de recuperación (IMPORTANTE)
   - Configura tu contraseña

3. **Agrega Mumbai** usando el Método 3

### **"El banner no aparece"**

Esto es normal si:
- Ya estás en Mumbai (red correcta)
- No has conectado tu wallet todavía

Para verificar:
1. Presiona **F12** → **Console**
2. Busca: `isCorrectChain: true/false`

---

## 📝 Resumen Rápido

**Para empezar rápido:**

1. ✅ **Conecta MetaMask** a GigChain
2. ✅ **Verás el banner** si estás en red incorrecta
3. ✅ **Haz clic en "Cambiar a Mumbai"**
4. ✅ **Confirma en MetaMask**
5. ✅ **¡Listo!** El banner desaparece

**Si el banner no aparece:**
- ¡Genial! Ya estás en Mumbai 🎉

---

## ⚡ Enlaces Rápidos

- **Chainlist (Agregar Mumbai):** https://chainlist.org/?search=mumbai&testnets=true
- **Polygon Faucet:** https://faucet.polygon.technology/
- **Mumbai Explorer:** https://mumbai.polygonscan.com/
- **RPC de Mumbai:** https://rpc-mumbai.maticvigil.com

---

## 🎯 Lo Que He Implementado

Para hacer esto más fácil, he agregado:

1. ✅ **Banner de Alerta Automático**
   - Se muestra solo cuando estás en red incorrecta
   - Diseño llamativo con animación
   - Desaparece automáticamente al cambiar de red

2. ✅ **Botón de Switch Automático**
   - Un clic para cambiar de red
   - Maneja errores automáticamente
   - Feedback visual durante el cambio

3. ✅ **Detección en Tiempo Real**
   - La app detecta cambios de red instantáneamente
   - No necesitas recargar la página
   - Actualización automática del estado

---

## 🔔 Notas Importantes

- **Mumbai es una testnet:** Los MATIC no tienen valor real
- **No uses Mainnet para testing:** Perderías dinero real
- **Guarda tu frase de recuperación:** Nunca la compartas con nadie
- **Los faucets tienen límites:** Puedes solicitar MATIC cada 24 horas

---

¡Todo listo para usar GigChain en Mumbai Testnet! 🚀

Si tienes problemas, verifica que:
1. ✅ MetaMask esté instalado y desbloqueado
2. ✅ Estés en Mumbai (chain ID 80001)
3. ✅ Tengas MATIC de Mumbai para gas
4. ✅ La app muestre que estás en la red correcta

