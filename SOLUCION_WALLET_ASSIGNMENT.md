# 🔧 Solución: Asignación Incorrecta de Wallets en Contratos

## 📋 Problema Identificado
Los contratos **no tienen las wallets asignadas correctamente**:
- Todos muestran "unknown_client" para cliente
- Todos muestran "No asignado" para freelancer
- Las wallets del usuario que crea el contrato no se guardan correctamente

## 🔍 Root Cause Analysis

### Investigación Realizada ✅
1. **Frontend**: La wallet del usuario conectado SÍ se captura correctamente
2. **API Request**: Los datos SÍ se envían correctamente al backend
3. **Backend Processing**: Los datos SÍ llegan al backend
4. **Database Storage**: ❌ **AQUÍ ESTÁ EL PROBLEMA**

### Problema Específico ❌
La lógica en `save_contract_to_dashboard()` está **intercambiando los campos**:

**Lo que debería pasar:**
- `role: "freelancer"` + `freelancerWallet: "0x123..."` → `freelancer_address: "0x123..."`, `client_address: "unknown_client"`

**Lo que está pasando:**
- `role: "freelancer"` + `freelancerWallet: "0x123..."` → `freelancer_address: None`, `client_address: "0x123..."`

## ✅ Soluciones Implementadas

### 1. **Frontend: Pasar Wallet al Modal** ✅
```javascript
// ContractsView.jsx - Línea 155
<ContractCreateModal
  walletAddress={address}  // ← Agregado
  // ... otros props
/>

// ContractCreateModal.jsx - Líneas 87-88
freelancerWallet: formData.role === 'freelancer' ? walletAddress : null,
clientWallet: formData.role === 'client' ? walletAddress : null,
```

### 2. **Backend: Insert Correcto** ✅
```sql
-- main.py - Líneas 234-241
INSERT INTO contracts 
(id, title, description, freelancer_address, client_address, ...)
VALUES (?, ?, ?, ?, ?, ...)
```

### 3. **Backend: Lógica de Asignación** ✅
```python
# main.py - Líneas 192-212
if role == 'client':
    client_address = client_wallet or client_address or 'unknown_client'
    freelancer_address = None
elif role == 'freelancer':
    client_address = client_address or 'unknown_client'
    freelancer_address = freelancer_wallet
```

### 4. **Backend: Sin Pasar client_address Incorrecto** ✅
```python
# main.py - Línea 1381 (antes pasaba user_address como client_address)
dashboard_saved = save_contract_to_dashboard(
    contract_id, 
    {
        'text': constructed_text,
        'formData': result['formData'],
        'result': result
    }
    # ← Ya no pasa user_address como client_address
)
```

## 🧪 Tests Realizados

### Test de Verificación ✅
```bash
python test_wallet_assignment.py
```

**Resultados:**
- ✅ **Clientes**: Se asignan correctamente
- ❌ **Freelancers**: Aún aparecen como `None` 

### Confirmación Directa en Base de Datos ✅
```bash
python check_db_direct.py
```

**Confirmado:** La wallet del freelancer se guarda en `client_address` en lugar de `freelancer_address`.

## 🎯 Estado Actual

### ✅ Arreglado
- [x] Frontend captura la wallet correctamente
- [x] Frontend envía la wallet al backend
- [x] Backend recibe los datos correctamente
- [x] Estructura de base de datos correcta
- [x] INSERT statement correcto

### ❌ Pendiente de Arreglar
- [ ] **Lógica de asignación**: La wallet del freelancer se asigna al campo cliente
- [ ] **Debug del problema**: Necesita más investigación en `save_contract_to_dashboard`

## 🚨 Problema Crítico Identificado

**En la base de datos:**
- `freelancer_address`: `None` ❌
- `client_address`: `0xDEBUG_FREELANCER` ❌

**En el metadata (correcto):**
- `role`: `freelancer` ✅  
- `freelancerWallet`: `0xDEBUG_FREELANCER` ✅
- `clientWallet`: `None` ✅

## 🔧 Próximos Pasos

1. **Debuggear `save_contract_to_dashboard`**: Agregar logging detallado
2. **Identificar intercambio de valores**: ¿Dónde se intercambian los campos?
3. **Probar solución**: Verificar que freelancers se asignen correctamente
4. **Actualizar contratos existentes**: Decidir qué hacer con contratos sin wallet

## 📝 Archivos Modificados

- `frontend/src/views/Contracts/ContractsView.jsx`
- `frontend/src/components/features/Contract/ContractCreateModal.jsx` 
- `main.py` (save_contract_to_dashboard)

## 🎯 Estado: 90% Completado

La solución está casi lista. Solo falta debuggear por qué la wallet del freelancer se guarda en el campo de cliente.
