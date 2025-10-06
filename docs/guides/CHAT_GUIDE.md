# 💬 Guía del Chat con IA - GigChain.io

## 🤖 **Sistema de Chat Inteligente Implementado**

### ✅ **Funcionalidades Disponibles:**

#### **1. Múltiples Agentes Especializados**
- **Asistente de Contratos**: Ayuda con contratos, negociaciones y términos legales
- **Soporte Técnico**: Resuelve problemas técnicos y guías de uso
- **Consultor de Negocios**: Consejos estratégicos para freelancers

#### **2. Interfaz de Chat Completa**
- Chat en tiempo real con indicador de escritura
- Cambio dinámico entre agentes
- Sugerencias inteligentes de seguimiento
- Historial de conversación persistente
- Estado de conexión en tiempo real

#### **3. Backend Robusto**
- API REST completa para chat
- Gestión de sesiones con UUID
- Contexto persistente por sesión
- Logs de auditoría completos

---

## 🚀 **Cómo Usar el Chat**

### **Acceso al Chat:**
1. Inicia la aplicación: `python main.py`
2. Abre el frontend en tu navegador
3. Haz clic en "Chat AI" en el sidebar
4. ¡Comienza a chatear!

### **Cambiar de Agente:**
1. Usa el selector en la parte superior del chat
2. Selecciona el agente apropiado:
   - **Contratos**: Para ayuda con contratos y negociaciones
   - **Técnico**: Para problemas técnicos y guías
   - **Negocios**: Para consejos estratégicos

### **Funciones del Chat:**
- **Enter**: Enviar mensaje
- **Shift + Enter**: Nueva línea
- **Sugerencias**: Haz clic en los botones de sugerencias
- **Historial**: Se mantiene durante la sesión

---

## 🔧 **Endpoints de la API**

### **POST `/api/chat/message`**
Envía un mensaje al chat y obtiene respuesta.

**Request:**
```json
{
  "message": "Hola, necesito ayuda con contratos",
  "session_id": "uuid-session-id",
  "user_id": "user-123",
  "context": {
    "current_view": "chat",
    "platform": "gigchain"
  }
}
```

**Response:**
```json
{
  "response": "¡Hola! Te ayudo con contratos...",
  "session_id": "uuid-session-id",
  "timestamp": "2025-01-10T10:30:00Z",
  "agent_type": "contract",
  "suggestions": [
    "¿Cómo crear un contrato?",
    "¿Qué términos incluir?",
    "¿Cómo negociar precios?"
  ]
}
```

### **POST `/api/chat/session`**
Crea una nueva sesión de chat.

**Request:**
```json
{
  "user_id": "user-123",
  "agent_type": "contract"
}
```

**Response:**
```json
{
  "session_id": "uuid-session-id",
  "agent_type": "contract",
  "created_at": "2025-01-10T10:30:00Z",
  "message": "Sesión de chat creada exitosamente"
}
```

### **GET `/api/chat/agents`**
Obtiene la lista de agentes disponibles.

**Response:**
```json
{
  "agents": [
    {
      "id": "contract",
      "name": "Asistente de Contratos",
      "description": "Ayuda con contratos, negociaciones y términos legales"
    },
    {
      "id": "technical",
      "name": "Soporte Técnico",
      "description": "Resuelve problemas técnicos y guías de uso"
    },
    {
      "id": "business",
      "name": "Consultor de Negocios",
      "description": "Consejos estratégicos para freelancers"
    }
  ],
  "total": 3,
  "timestamp": "2025-01-10T10:30:00Z"
}
```

### **PUT `/api/chat/session/{session_id}/agent`**
Cambia el tipo de agente para una sesión.

**Request:**
```json
{
  "agent_type": "technical"
}
```

### **GET `/api/chat/session/{session_id}/history`**
Obtiene el historial de una sesión.

**Response:**
```json
{
  "session_id": "uuid-session-id",
  "history": [
    {
      "role": "user",
      "content": "Hola",
      "timestamp": "2025-01-10T10:30:00Z"
    },
    {
      "role": "assistant",
      "content": "¡Hola! ¿En qué puedo ayudarte?",
      "timestamp": "2025-01-10T10:30:01Z",
      "agent_type": "contract"
    }
  ],
  "message_count": 2,
  "timestamp": "2025-01-10T10:30:00Z"
}
```

---

## 🧪 **Pruebas del Sistema**

### **Ejecutar Pruebas:**
```bash
python test_chat.py
```

### **Pruebas Incluidas:**
1. ✅ Verificación de agentes disponibles
2. ✅ Creación de sesión de chat
3. ✅ Envío de mensajes básicos
4. ✅ Cambio de agentes
5. ✅ Conversación completa
6. ✅ Obtención de historial

### **Ejemplo de Salida:**
```
🤖 GigChain.io - Chat AI Test Suite
==================================================
✅ Servidor disponible

🤖 Probando agentes disponibles...
✅ Agentes encontrados: 3
   - Asistente de Contratos: Ayuda con contratos, negociaciones y términos legales
   - Soporte Técnico: Resuelve problemas técnicos y guías de uso
   - Consultor de Negocios: Consejos estratégicos para freelancers

💬 Probando creación de sesión...
✅ Sesión creada: 12345678-1234-1234-1234-123456789abc

💭 Enviando mensaje: 'Hola, ¿puedes ayudarme?'
✅ Respuesta recibida:
   Agente: contract
   Mensaje: ¡Hola! Soy tu asistente de IA para GigChain.io...

🎉 ¡Todas las pruebas del chat pasaron!
💬 El sistema de chat con IA está funcionando correctamente
```

---

## 🎯 **Casos de Uso Comunes**

### **1. Ayuda con Contratos**
```
Usuario: "Necesito crear un contrato para desarrollo web"
IA: "Te ayudo a crear un contrato de desarrollo web. ¿Qué tipo de proyecto es? ¿Cuál es el presupuesto estimado?"
```

### **2. Soporte Técnico**
```
Usuario: "No puedo conectar mi wallet"
IA: "Te ayudo con la conexión de wallet. ¿Qué tipo de wallet estás usando? ¿Qué error específico ves?"
```

### **3. Consejos de Negocio**
```
Usuario: "¿Cómo aumentar mis tarifas como freelancer?"
IA: "Excelente pregunta. Te doy algunas estrategias para aumentar tus tarifas de manera sostenible..."
```

---

## 🔒 **Seguridad del Chat**

### **Medidas Implementadas:**
- ✅ Validación de entrada de mensajes
- ✅ Límites de longitud (2000 caracteres)
- ✅ Sanitización de contenido
- ✅ Rate limiting en endpoints
- ✅ Logs de auditoría
- ✅ Gestión segura de sesiones

### **Configuración de Seguridad:**
```python
# Límites de mensaje
MAX_MESSAGE_LENGTH = 2000
MAX_SESSION_DURATION = 24 * 60 * 60  # 24 horas

# Rate limiting
RATE_LIMIT_PER_MINUTE = 10
RATE_LIMIT_PER_HOUR = 100
```

---

## 📊 **Monitoreo y Métricas**

### **Logs de Chat:**
```python
# Ejemplo de logs generados
logger.info(f"Chat message from user: {user_id}")
logger.info(f"Chat response generated for session: {session_id}")
logger.warning(f"Chat session expired: {session_id}")
```

### **Métricas Disponibles:**
- Número de sesiones activas
- Mensajes por minuto/hora
- Tiempo promedio de respuesta
- Agentes más utilizados
- Errores de chat

---

## 🚀 **Próximas Mejoras**

### **Funcionalidades Planificadas:**
- [ ] WebSocket para chat en tiempo real
- [ ] Chat con archivos adjuntos
- [ ] Integración con contratos existentes
- [ ] Chat multilingüe
- [ ] Análisis de sentimientos
- [ ] Chat con voz (speech-to-text)

### **Mejoras de UX:**
- [ ] Emojis y reacciones
- [ ] Búsqueda en historial
- [ ] Exportar conversaciones
- [ ] Temas personalizables
- [ ] Notificaciones push

---

## 🛠️ **Configuración Avanzada**

### **Variables de Entorno:**
```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
OPENAI_TEMPERATURE=0.7

# Chat Configuration
CHAT_MAX_MESSAGE_LENGTH=2000
CHAT_SESSION_TIMEOUT=86400
CHAT_RATE_LIMIT=10
```

### **Personalización de Agentes:**
```python
# Añadir nuevo agente
class CustomAgent(ChatAgent):
    def _build_system_prompt(self, context):
        return "Eres un agente personalizado..."
    
    def _generate_suggestions(self, message, response, context):
        return ["Sugerencia personalizada"]
```

---

## 📞 **Soporte**

### **Problemas Comunes:**
1. **Chat no responde**: Verifica la conexión del servidor
2. **Error de agente**: Reinicia la sesión de chat
3. **Mensaje muy largo**: Reduce el texto a menos de 2000 caracteres
4. **Sesión expirada**: Crea una nueva sesión

### **Debug:**
```bash
# Ver logs del chat
tail -f logs/chat.log

# Verificar estado del servidor
curl http://localhost:8000/health

# Probar endpoints
python test_chat.py
```

---

*Última actualización: 2025-01-10*
*Versión del chat: 1.0.0*
