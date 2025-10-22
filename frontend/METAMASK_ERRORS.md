# MetaMask Internal Errors - Known Issues

## Error: "Internal error" en polyfill.js

### 🔍 **Descripción**

Al usar la extensión de MetaMask con aplicaciones Web3, puedes ver este error en la consola:

```
Uncaught (in promise) Error: Internal error.
    at wrappedSendMessageCallback (polyfill.js:501:16)
```

### ✅ **¿Es Peligroso?**

**NO**. Este es un error interno de la extensión de MetaMask que **NO afecta la funcionalidad** de la aplicación.

### 🎯 **Causa**

- Error de comunicación interna entre la extensión de MetaMask y la página web
- Ocurre cuando MetaMask intenta sincronizar estado con la página
- Más común cuando se usan librerías como ThirdWeb que mantienen múltiples instancias de conexión
- Puede ser causado por:
  - Conflictos entre extensiones de wallet (MetaMask + Coinbase, etc.)
  - Versiones desactualizadas de MetaMask
  - ThirdWeb hooks ejecutándose en múltiples componentes

### 🛠️ **Soluciones Implementadas**

1. **Supresión de Errores** (en `main.jsx`):
   - Agregamos un listener de `unhandledrejection` que suprime estos errores
   - Solo afecta errores de `polyfill.js` y `content.js` de MetaMask
   - Los errores reales de la aplicación siguen mostrándose normalmente

2. **Autenticación Manual** (en `useWalletAuth.js`):
   - Eliminamos `useActiveAccount` automático
   - Ahora usamos `window.ethereum` directamente solo cuando el usuario hace clic
   - Esto previene activaciones automáticas de MetaMask

### 💡 **Recomendaciones para Usuarios**

Si aún ves popups de MetaMask no deseados:

1. **Actualiza MetaMask**: Ve a Chrome Web Store → Extensiones → MetaMask → Actualizar
2. **Desactiva otras wallets**: Si tienes múltiples extensiones de wallet, desactiva las que no uses
3. **Limpia caché**: 
   - Chrome: `Ctrl+Shift+Delete` → Borrar caché
   - MetaMask: Configuración → Avanzado → Restablecer cuenta
4. **Modo Incógnito**: Prueba en modo incógnito con solo MetaMask activado

### 📚 **Referencias**

- [MetaMask Issue #12343](https://github.com/MetaMask/metamask-extension/issues/12343)
- [ThirdWeb v5 Migration Guide](https://portal.thirdweb.com/typescript/v5/migrate)

### 🔧 **Para Desarrolladores**

Si necesitas depurar estos errores:

```javascript
// Ver errores suprimidos
window.addEventListener('unhandledrejection', (event) => {
  console.log('Unhandled rejection:', event.reason);
});

// Desactivar supresión temporalmente
// Comenta el listener en main.jsx
```

---

**Última actualización**: Octubre 2025  
**Estado**: ✅ Mitigado - No afecta funcionalidad

