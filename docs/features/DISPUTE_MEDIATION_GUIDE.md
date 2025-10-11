# 🤖 AI-Powered Dispute Mediation System

## 📋 Descripción General

Sistema inteligente de mediación de disputas para GigChain.io que utiliza AI para facilitar acuerdos entre freelancers y clientes **antes** de escalar a votación oracle. El sistema actúa como mediador imparcial, analiza evidencias, genera propuestas de resolución equilibradas y facilita la negociación.

## 🎯 Características Principales

### 1. **Análisis Automático con AI**
- Evaluación objetiva de evidencias presentadas por ambas partes
- Análisis de cumplimiento de contrato y calidad del trabajo
- Identificación de responsabilidades y factores mitigantes
- Score de confianza en las recomendaciones

### 2. **Generación de Propuestas de Resolución**
- **Pago Completo**: Si el trabajo cumple estándares
- **Pago Parcial**: Para problemas menores de calidad
- **Reembolso**: Si el trabajo no cumple requisitos
- **Revisión**: Oportunidad de corregir el trabajo
- **Extensión**: Más tiempo para completar
- **Compromiso**: Soluciones intermedias creativas

### 3. **Chat Mediador Inteligente**
- Respuestas neutrales y profesionales
- Validación de preocupaciones de ambas partes
- Sugerencias de compromisos constructivos
- Análisis de sentimiento y disposición a negociar
- Detección de riesgo de escalación

### 4. **Sistema de Negociación Multi-Ronda**
- Hasta 3 rondas de negociación asistida
- Seguimiento de respuestas de ambas partes
- Generación de nuevas propuestas basadas en feedback
- Escalación automática a oracle si no hay acuerdo

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    DISPUTE MEDIATION SYSTEM                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          DisputeMediationAgent (AI Core)            │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  • analyze_dispute()                                │   │
│  │  • generate_resolution_proposals()                  │   │
│  │  • facilitate_negotiation()                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │       DisputeMediationSystem (Orchestrator)         │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  • initiate_mediation()                             │   │
│  │  • send_message()                                   │   │
│  │  • respond_to_proposal()                            │   │
│  │  • get_mediation_status()                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              FastAPI Endpoints                      │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  POST /api/mediation/initiate                       │   │
│  │  POST /api/mediation/message                        │   │
│  │  POST /api/mediation/proposal/respond               │   │
│  │  GET  /api/mediation/status/{id}                    │   │
│  │  GET  /api/mediation/history/{id}                   │   │
│  │  GET  /api/mediation/proposals/{id}                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         Integration with Oracle System              │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  • Auto-resolve if agreement reached                │   │
│  │  • Escalate to oracle voting if needed              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 📡 API Endpoints

### 1. Iniciar Mediación
```http
POST /api/mediation/initiate
```

**Request:**
```json
{
  "dispute_id": 1,
  "initiator": "freelancer"
}
```

**Response:**
```json
{
  "success": true,
  "mediation_id": "mediation_1",
  "dispute_id": 1,
  "status": "initiated",
  "proposals_count": 3,
  "initial_analysis": {
    "analysis_summary": "...",
    "work_quality_assessment": {...},
    "recommendation": "compromise",
    "confidence_level": 0.85
  },
  "message": "Mediación iniciada exitosamente..."
}
```

### 2. Enviar Mensaje de Mediación
```http
POST /api/mediation/message
```

**Request:**
```json
{
  "mediation_id": "mediation_1",
  "sender": "freelancer",
  "message": "Cumplí con todos los requisitos del proyecto..."
}
```

**Response:**
```json
{
  "success": true,
  "response": "Entiendo tu posición. Veamos cómo podemos...",
  "suggested_actions": [
    "Compartir evidencia adicional",
    "Considerar una revisión parcial"
  ],
  "sentiment_analysis": {
    "sender_sentiment": "neutral",
    "willingness_to_compromise": 0.7,
    "key_concerns": ["calidad", "cumplimiento"]
  },
  "mediation_guidance": {
    "next_step": "Esperar respuesta del cliente",
    "closer_to_resolution": true,
    "risk_of_escalation": 0.3
  }
}
```

### 3. Responder a Propuesta
```http
POST /api/mediation/proposal/respond
```

**Request:**
```json
{
  "mediation_id": "mediation_1",
  "proposal_id": "1_proposal_1",
  "responder": "client",
  "accepted": true,
  "counter_proposal": null
}
```

**Response (Ambas partes aceptan):**
```json
{
  "success": true,
  "status": "resolved",
  "message": "¡Acuerdo alcanzado! Ambas partes aceptaron la propuesta.",
  "agreement": {
    "proposal_type": "partial_payment",
    "description": "...",
    "payment_adjustment": -15.0,
    "conditions": [...]
  }
}
```

**Response (Esperando otra parte):**
```json
{
  "success": true,
  "status": "waiting",
  "message": "Esperando respuesta de cliente",
  "waiting_for": "client"
}
```

**Response (Escalado):**
```json
{
  "success": false,
  "status": "escalated",
  "message": "No se pudo alcanzar un acuerdo. La disputa se escalará a votación oracle.",
  "rounds": 3
}
```

### 4. Obtener Estado de Mediación
```http
GET /api/mediation/status/{mediation_id}
```

**Response:**
```json
{
  "mediation_id": "mediation_1",
  "dispute_id": 1,
  "status": "proposal_pending",
  "proposals_count": 3,
  "messages_count": 8,
  "rounds": 1,
  "freelancer_response": true,
  "client_response": null,
  "started_at": "2025-10-09T10:00:00",
  "resolved_at": null,
  "final_agreement": null
}
```

### 5. Obtener Historial de Mediación
```http
GET /api/mediation/history/{mediation_id}
```

**Response:**
```json
{
  "mediation_id": "mediation_1",
  "history": [
    {
      "sender": "freelancer",
      "message": "...",
      "timestamp": "2025-10-09T10:05:00"
    },
    {
      "sender": "ai_mediator",
      "message": "...",
      "timestamp": "2025-10-09T10:05:02",
      "metadata": {...}
    }
  ],
  "message_count": 8
}
```

### 6. Obtener Propuestas
```http
GET /api/mediation/proposals/{mediation_id}
```

**Response:**
```json
{
  "mediation_id": "mediation_1",
  "proposals": [
    {
      "proposal_id": "1_proposal_1",
      "proposal_type": "partial_payment",
      "description": "Pago del 85% considerando...",
      "payment_adjustment": -15.0,
      "reasoning": "...",
      "confidence_score": 0.85,
      "conditions": [...],
      "benefits_freelancer": [...],
      "benefits_client": [...]
    }
  ],
  "total_proposals": 3
}
```

### 7. Estadísticas del Sistema
```http
GET /api/mediation/statistics
```

**Response:**
```json
{
  "total_mediations": 10,
  "resolved": 7,
  "escalated_to_oracle": 2,
  "in_progress": 1,
  "success_rate": 70.0,
  "average_rounds": 1.5
}
```

## 🔄 Flujo de Trabajo

### 1. Creación de Disputa
```
Cliente/Freelancer → Dispute Oracle System
                  → Create Dispute
                  → Submit Evidence
```

### 2. Inicio de Mediación
```
Parte Interesada → POST /api/mediation/initiate
                 → AI analiza disputa
                 → Genera 3 propuestas
                 → Retorna análisis + propuestas
```

### 3. Negociación Asistida
```
Freelancer → POST /api/mediation/message
          → AI Mediator responde
          → Analiza sentimiento
          → Sugiere acciones

Cliente    → POST /api/mediation/message
          → AI Mediator facilita
          → Detecta convergencia
          → Propone soluciones
```

### 4. Resolución
```
OPCIÓN A: Acuerdo Alcanzado
├─ Freelancer acepta propuesta
├─ Cliente acepta propuesta
└─ Sistema actualiza disputa → RESOLVED

OPCIÓN B: No Hay Acuerdo (después de 3 rondas)
├─ Sistema detecta estancamiento
└─ Escala a votación oracle → ESCALATED

OPCIÓN C: Contrapropuesta
├─ Parte rechaza con contrapropuesta
├─ AI genera nuevas propuestas
└─ Nueva ronda de negociación
```

## 🧠 Capacidades del AI Mediator

### Análisis de Disputa
- ✅ Evaluación de calidad del trabajo (0-100)
- ✅ Análisis de cumplimiento de plazos
- ✅ Evaluación de comunicación de ambas partes
- ✅ Distribución de responsabilidades (% por parte)
- ✅ Identificación de factores mitigantes/agravantes
- ✅ Recomendación con nivel de confianza

### Generación de Propuestas
- ✅ Múltiples opciones (mínimo 3)
- ✅ Diferentes tipos de resolución
- ✅ Ajustes de pago calculados (% del monto)
- ✅ Condiciones específicas de implementación
- ✅ Beneficios para ambas partes
- ✅ Pasos de implementación

### Facilitación de Negociación
- ✅ Respuestas neutrales y profesionales
- ✅ Validación de preocupaciones
- ✅ Análisis de sentimiento en tiempo real
- ✅ Detección de disposición a comprometer
- ✅ Sugerencias de próximos pasos
- ✅ Alertas de riesgo de escalación

## 🔐 Configuración

### Variables de Entorno
```bash
# .env
OPENAI_API_KEY=your_openai_api_key_here
```

### Modelo AI
- **Modelo**: `gpt-4o-mini`
- **Temperatura**: `0.3` (para respuestas consistentes)
- **Formato**: JSON estructurado

### Límites del Sistema
- **Máximo de rondas**: 3
- **Máximo de propuestas por sesión**: Ilimitado
- **Timeout de propuesta**: Configurable
- **Tamaño de mensaje**: 2000 caracteres

## 📊 Tipos de Resolución

| Tipo | Descripción | Payment Adjustment | Cuándo Usar |
|------|-------------|-------------------|-------------|
| `full_payment` | Pago completo al freelancer | 0% | Trabajo cumple todos los requisitos |
| `partial_payment` | Pago reducido | -10% a -50% | Problemas menores de calidad |
| `refund` | Reembolso al cliente | -100% | Trabajo no cumple requisitos |
| `revision` | Oportunidad de corregir | 0% (diferido) | Errores corregibles |
| `extension` | Más tiempo para completar | 0% (diferido) | Retrasos justificables |
| `compromise` | Solución intermedia | Variable | Responsabilidad compartida |

## 🚀 Uso Rápido

### Ejemplo: Mediación Completa

```python
# 1. Crear disputa
dispute_id = dispute_oracle.create_dispute(
    contract_id="contract_123",
    contract_address="0x...",
    freelancer="0x...",
    client="0x...",
    amount=1000.0,
    description="Cliente insatisfecho con calidad..."
)

# 2. Iniciar mediación
session = mediation_system.initiate_mediation(
    dispute_id=dispute_id,
    initiator="freelancer"
)
print(f"Mediation ID: {session.mediation_id}")
print(f"Proposals: {len(session.ai_proposals)}")

# 3. Chat con mediador
response = mediation_system.send_message(
    mediation_id=session.mediation_id,
    sender="freelancer",
    message="Cumplí con todos los requisitos..."
)
print(f"AI: {response['response']}")

# 4. Responder a propuesta
result = mediation_system.respond_to_proposal(
    mediation_id=session.mediation_id,
    proposal_id=session.ai_proposals[0].proposal_id,
    responder="freelancer",
    accepted=True
)

result = mediation_system.respond_to_proposal(
    mediation_id=session.mediation_id,
    proposal_id=session.ai_proposals[0].proposal_id,
    responder="client",
    accepted=True
)

if result['success']:
    print("¡Acuerdo alcanzado!")
    print(result['agreement'])
```

## 🧪 Testing

### Ejecutar Tests
```bash
python3 test_mediation.py
```

### Tests Incluidos
1. ✅ Creación de disputa con evidencias
2. ✅ Inicio de mediación con AI
3. ✅ Chat con mediador inteligente
4. ✅ Sistema de propuestas y respuestas
5. ✅ Verificación de estado
6. ✅ Estadísticas del sistema

### Modo Fallback (Sin API Key)
El sistema funciona sin OpenAI API key en modo limitado:
- ❌ No genera análisis AI
- ❌ No genera propuestas inteligentes
- ✅ Estructura y endpoints funcionan
- ✅ Sistema de estados funciona
- ✅ Integración oracle funciona

## 📈 Métricas de Éxito

### KPIs del Sistema
- **Tasa de Resolución**: % de disputas resueltas sin oracle
- **Rondas Promedio**: Número medio de rondas hasta acuerdo
- **Tiempo de Resolución**: Tiempo promedio hasta acuerdo
- **Satisfacción**: Score de ambas partes con resultado

### Objetivos
- 🎯 70%+ de disputas resueltas en mediación
- 🎯 < 2 rondas promedio por mediación
- 🎯 < 48 horas hasta resolución
- 🎯 85%+ satisfacción de usuarios

## 🔗 Integración con Oracle System

### Flujo de Escalación
```
Mediation Failed (3 rounds)
           ↓
Update Dispute Status → UNDER_REVIEW
           ↓
Oracle Voting System Activado
           ↓
Voters Cast Votes
           ↓
Quorum Reached → Dispute RESOLVED
```

### Actualización Automática
```python
# Si mediación exitosa
dispute_oracle.disputes[dispute_id].status = DisputeStatus.RESOLVED

# Si escalada a oracle
# El sistema oracle toma control y activa votación
```

## 📝 Próximas Mejoras

- [ ] WebSocket para chat en tiempo real
- [ ] Sistema de reputación de mediadores AI
- [ ] ML para mejorar propuestas basado en historial
- [ ] Multi-idioma (i18n)
- [ ] Dashboard de analytics
- [ ] Integración con contratos inteligentes
- [ ] Notificaciones push/email
- [ ] Templates de resolución personalizables

## 🤝 Contribuir

Para agregar nuevos tipos de propuestas o mejorar el AI:

1. Modificar `DisputeMediationAgent` en `dispute_mediation_ai.py`
2. Actualizar prompts de AI según necesidades
3. Agregar nuevos `ProposalType` en enums
4. Actualizar tests en `test_mediation.py`

---

**Desarrollado para GigChain.io** | Sistema de Mediación Inteligente v1.0.0
