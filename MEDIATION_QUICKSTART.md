# 🚀 AI Dispute Mediation - Quick Start Guide

## ⚡ Setup Rápido (5 minutos)

### 1. Verificar Configuración

```bash
# Asegúrate de tener OpenAI API key en .env
echo "OPENAI_API_KEY=sk-..." >> .env

# Verifica que las dependencias estén instaladas
pip install -r requirements.txt
```

### 2. Iniciar Servidor

```bash
# Modo desarrollo local (puerto 5000)
python main.py
```

### 3. Verificar Instalación

```bash
# Health check
curl http://localhost:5000/health

# Verificar endpoint de mediación
curl http://localhost:5000/api/mediation/info
```

## 📱 Uso Básico

### Escenario: Cliente y Freelancer en Disputa

#### Paso 1: Crear Disputa
```bash
curl -X POST http://localhost:5000/api/disputes/create \
  -H "Content-Type: application/json" \
  -d '{
    "contract_id": "contract_123",
    "contract_address": "0x1234567890123456789012345678901234567890",
    "freelancer": "0xFreelancerAddress123456789012345678901234",
    "client": "0xClientAddress1234567890123456789012345678",
    "amount": 1000.0,
    "description": "Cliente insatisfecho con calidad del trabajo"
  }'
```

**Response:**
```json
{
  "dispute_id": 1,
  "status": "pending",
  "message": "Disputa creada exitosamente"
}
```

#### Paso 2: Iniciar Mediación AI
```bash
curl -X POST http://localhost:5000/api/mediation/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "dispute_id": 1,
    "initiator": "freelancer"
  }'
```

**Response:**
```json
{
  "success": true,
  "mediation_id": "mediation_1",
  "proposals_count": 3,
  "initial_analysis": {
    "analysis_summary": "Análisis completo de la disputa...",
    "recommendation": "compromise",
    "confidence_level": 0.85
  }
}
```

#### Paso 3: Ver Propuestas
```bash
curl http://localhost:5000/api/mediation/proposals/mediation_1
```

**Response:**
```json
{
  "proposals": [
    {
      "proposal_id": "1_proposal_1",
      "proposal_type": "partial_payment",
      "description": "Pago del 85% considerando calidad...",
      "payment_adjustment": -15.0,
      "confidence_score": 0.85,
      "benefits_freelancer": [
        "Recibe la mayor parte del pago",
        "Se reconoce su esfuerzo"
      ],
      "benefits_client": [
        "Descuento por problemas menores",
        "Resolución rápida"
      ]
    }
  ]
}
```

#### Paso 4: Chat con Mediador AI
```bash
# Freelancer envía mensaje
curl -X POST http://localhost:5000/api/mediation/message \
  -H "Content-Type: application/json" \
  -d '{
    "mediation_id": "mediation_1",
    "sender": "freelancer",
    "message": "Cumplí con todos los requisitos del proyecto"
  }'
```

**Response:**
```json
{
  "response": "Entiendo tu posición. Es importante que ambas partes...",
  "suggested_actions": [
    "Compartir evidencia adicional del trabajo",
    "Considerar una revisión de calidad"
  ],
  "sentiment_analysis": {
    "sender_sentiment": "neutral",
    "willingness_to_compromise": 0.7
  }
}
```

#### Paso 5: Responder a Propuesta
```bash
# Freelancer acepta
curl -X POST http://localhost:5000/api/mediation/proposal/respond \
  -H "Content-Type: application/json" \
  -d '{
    "mediation_id": "mediation_1",
    "proposal_id": "1_proposal_1",
    "responder": "freelancer",
    "accepted": true
  }'

# Cliente acepta
curl -X POST http://localhost:5000/api/mediation/proposal/respond \
  -H "Content-Type: application/json" \
  -d '{
    "mediation_id": "mediation_1",
    "proposal_id": "1_proposal_1",
    "responder": "client",
    "accepted": true
  }'
```

**Response (Acuerdo Alcanzado):**
```json
{
  "success": true,
  "status": "resolved",
  "message": "¡Acuerdo alcanzado! Ambas partes aceptaron la propuesta.",
  "agreement": {
    "proposal_type": "partial_payment",
    "payment_adjustment": -15.0,
    "description": "Pago del 85%..."
  }
}
```

## 🎨 Frontend Integration

### React/JavaScript Example

```javascript
// 1. Iniciar Mediación
const initMediation = async (disputeId) => {
  const response = await fetch('http://localhost:5000/api/mediation/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dispute_id: disputeId,
      initiator: 'freelancer'
    })
  });
  
  const data = await response.json();
  console.log('Mediation started:', data.mediation_id);
  return data;
};

// 2. Chat con Mediador
const sendMessage = async (mediationId, sender, message) => {
  const response = await fetch('http://localhost:5000/api/mediation/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mediation_id: mediationId,
      sender: sender,
      message: message
    })
  });
  
  const data = await response.json();
  console.log('AI Response:', data.response);
  return data;
};

// 3. Aceptar Propuesta
const acceptProposal = async (mediationId, proposalId, responder) => {
  const response = await fetch('http://localhost:5000/api/mediation/proposal/respond', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mediation_id: mediationId,
      proposal_id: proposalId,
      responder: responder,
      accepted: true
    })
  });
  
  const data = await response.json();
  if (data.status === 'resolved') {
    console.log('Agreement reached!', data.agreement);
  }
  return data;
};

// 4. Obtener Estado
const getMediationStatus = async (mediationId) => {
  const response = await fetch(`http://localhost:5000/api/mediation/status/${mediationId}`);
  const data = await response.json();
  return data;
};
```

### React Component Example

```jsx
import { useState, useEffect } from 'react';

function DisputeMediationPanel({ disputeId }) {
  const [mediation, setMediation] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [messages, setMessages] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  
  // Iniciar mediación
  useEffect(() => {
    const init = async () => {
      const data = await initMediation(disputeId);
      setMediation(data);
      
      // Cargar propuestas
      const proposalsRes = await fetch(
        `http://localhost:5000/api/mediation/proposals/${data.mediation_id}`
      );
      const proposalsData = await proposalsRes.json();
      setProposals(proposalsData.proposals);
    };
    init();
  }, [disputeId]);
  
  // Enviar mensaje
  const handleSendMessage = async () => {
    const response = await sendMessage(
      mediation.mediation_id,
      'freelancer', // o 'client'
      userMessage
    );
    
    setMessages([...messages, {
      sender: 'user',
      text: userMessage
    }, {
      sender: 'ai',
      text: response.response
    }]);
    
    setUserMessage('');
  };
  
  // Aceptar propuesta
  const handleAcceptProposal = async (proposalId) => {
    const result = await acceptProposal(
      mediation.mediation_id,
      proposalId,
      'freelancer'
    );
    
    if (result.status === 'resolved') {
      alert('¡Acuerdo alcanzado!');
    }
  };
  
  return (
    <div className="mediation-panel">
      <h2>AI Mediation</h2>
      
      {/* Propuestas */}
      <div className="proposals">
        <h3>Propuestas de Resolución</h3>
        {proposals.map(proposal => (
          <div key={proposal.proposal_id} className="proposal-card">
            <h4>{proposal.proposal_type}</h4>
            <p>{proposal.description}</p>
            <p>Ajuste: {proposal.payment_adjustment}%</p>
            <button onClick={() => handleAcceptProposal(proposal.proposal_id)}>
              Aceptar
            </button>
          </div>
        ))}
      </div>
      
      {/* Chat */}
      <div className="chat">
        <h3>Chat con Mediador AI</h3>
        <div className="messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.sender}`}>
              {msg.text}
            </div>
          ))}
        </div>
        <input
          value={userMessage}
          onChange={e => setUserMessage(e.target.value)}
          placeholder="Escribe tu mensaje..."
        />
        <button onClick={handleSendMessage}>Enviar</button>
      </div>
    </div>
  );
}
```

## 📊 Monitoreo

### Ver Estadísticas
```bash
curl http://localhost:5000/api/mediation/statistics
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

### Ver Mediaciones Activas
```bash
curl http://localhost:5000/api/mediation/active
```

## 🔧 Troubleshooting

### Problema: "OpenAI API Key not configured"
**Solución:**
```bash
# Agregar API key al .env
echo "OPENAI_API_KEY=sk-your-key-here" >> .env

# Reiniciar servidor
python main.py
```

### Problema: "Mediation not found"
**Solución:**
- Verificar que el `mediation_id` sea correcto
- Las mediaciones en memoria se pierden al reiniciar el servidor
- Para producción, implementar persistencia en base de datos

### Problema: "Proposal already responded"
**Solución:**
- Cada parte solo puede responder una vez por propuesta
- Para cambiar respuesta, usar `counter_proposal`

## 📝 Logs

```bash
# Ver logs en tiempo real
tail -f logs/gigchain.log

# Logs importantes:
# ✅ Mediation {id} initiated successfully
# 🤖 Message processed in mediation {id}
# 🎉 AGREEMENT REACHED
# ⚠️ Mediation escalated to oracle voting
```

## 🎯 Best Practices

1. **Iniciar mediación temprano**: No esperar a que la disputa escale
2. **Proporcionar contexto**: Mensajes claros y detallados
3. **Revisar todas las propuestas**: El AI genera 3 opciones
4. **Usar chat para aclarar**: El mediador AI puede ayudar
5. **Ser paciente**: Hasta 3 rondas de negociación

## 🚀 Próximos Pasos

1. Ver documentación completa: `DISPUTE_MEDIATION_GUIDE.md`
2. Ejecutar tests: `python3 test_mediation.py`
3. Explorar API docs: `http://localhost:5000/docs`
4. Implementar frontend con ejemplos React

---

**¿Necesitas ayuda?** Revisa la documentación completa o contacta al equipo de desarrollo.
