# 🧪 Guía de Testing de Wallet - GigChain.io

## 🌐 **Redes Configuradas**

### **Mumbai Testnet (RECOMENDADO para testing)**
- **Chain ID**: 80001
- **RPC URL**: https://rpc-mumbai.maticvigil.com
- **Explorer**: https://mumbai.polygonscan.com
- **Tokens**: MATIC de prueba (gratuitos)

### **Polygon Mainnet (Para producción)**
- **Chain ID**: 137
- **RPC URL**: https://polygon-rpc.com
- **Explorer**: https://polygonscan.com
- **Tokens**: MATIC real

## 💰 **Cómo Obtener Tokens de Prueba**

### **1. Chainlink Faucets (RECOMENDADO):**
- **Chainlink Faucets**: https://faucets.chain.link/
- **Polygon Amoy**: 0.5 POL + 25 LINK tokens
- **Ethereum Sepolia**: 0.5 ETH + 25 LINK tokens
- **Arbitrum Sepolia**: 0.5 ETH + 25 LINK tokens
- **Base Sepolia**: 0.5 ETH + 25 LINK tokens

### **2. Faucets Tradicionales (Alternativos):**
- **Polygon Faucet**: https://faucet.polygon.technology/
- **Alchemy Faucet**: https://mumbaifaucet.com/
- **QuickNode Faucet**: https://faucet.quicknode.com/polygon/mumbai

## 🔧 **Configuración de Wallet**

### **MetaMask - Configuración para Testing:**

#### **Opción 1: Polygon Amoy (Nueva testnet recomendada)**
- **Network Name**: Polygon Amoy
- **RPC URL**: https://rpc-amoy.polygon.technology
- **Chain ID**: 80002
- **Currency Symbol**: POL
- **Block Explorer**: https://amoy.polygonscan.com

#### **Opción 2: Mumbai (Testnet tradicional)**
- **Network Name**: Mumbai Testnet
- **RPC URL**: https://rpc-mumbai.maticvigil.com
- **Chain ID**: 80001
- **Currency Symbol**: MATIC
- **Block Explorer**: https://mumbai.polygonscan.com

### **WalletConnect:**
- Compatible con Mumbai automáticamente
- Soporta múltiples wallets

## 🧪 **Testing en GigChain**

### **1. Conectar Wallet:**
```javascript
// La app detecta automáticamente Mumbai
// Solo necesitas conectar tu wallet
```

### **2. Validar Dirección:**
- Formato: 0x seguido de 40 caracteres hexadecimales
- Ejemplo: `0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6`

### **3. Crear Contrato de Prueba:**
- Usar montos pequeños (ej: $10-100)
- Seleccionar "Test Mode" en la UI
- Verificar en Mumbai PolygonScan

## 🚀 **Comandos de Testing**

### **Backend:**
```bash
# Verificar servidor
curl http://localhost:5000/health

# Probar validación de wallet
curl -X POST http://localhost:5000/api/validate_wallet \
  -H "Content-Type: application/json" \
  -d '{"address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6", "network": "polygon"}'
```

### **Frontend:**
```bash
# Acceder a la app
http://localhost:5173

# Navegar a: Contratos > Nuevo Contrato
# Probar con dirección de Mumbai
```

## ⚠️ **Importante**

### **Para Testing:**
- ✅ Usar Mumbai Testnet
- ✅ Tokens gratuitos de faucets
- ✅ Sin riesgo de perder dinero real
- ✅ Transacciones instantáneas

### **Para Producción:**
- ⚠️ Usar Polygon Mainnet
- ⚠️ Tokens reales con valor
- ⚠️ Verificar todo antes de enviar
- ⚠️ Usar montos pequeños inicialmente

## 🔍 **Debugging**

### **Problemas Comunes:**
1. **Wallet no conecta**: Verificar red (Mumbai)
2. **Sin tokens**: Usar faucet
3. **Transacción falla**: Verificar gas fees
4. **Dirección inválida**: Verificar formato 0x...

### **Logs Útiles:**
```bash
# Ver logs del backend
tail -f logs/app.log

# Ver logs del frontend
F12 > Console en el navegador
```

---

**Recomendación**: Empieza siempre con Mumbai Testnet para todas las pruebas. Solo cambia a Polygon Mainnet cuando estés 100% seguro de que todo funciona correctamente.
