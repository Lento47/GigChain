# Backend API Reference

Base URL: `http://localhost:5000`

All endpoints accept and return JSON unless otherwise noted.

## Health

GET `/health`
- Returns service status and metadata.

Example:
```bash
curl http://localhost:5000/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-03T12:00:00Z",
  "service": "GigChain API",
  "version": "1.0.0",
  "ai_agents_active": true
}
```

## Contracts

POST `/api/full_flow`
- Description: AI-powered generation with multi-agent chaining.
- Body:
```json
{ "text": "Freelancer ofrezco 2000 dolares... Proyecto de 20 días." }
```
- Success 200:
```json
{
  "contract_id": "gig_...",
  "json": {
    "full_terms": "...",
    "escrow_params": { "token": "USDC", "milestones": [ {"amount": 2000.0, "deadline": "YYYY-MM-DD", "description": "..."} ] },
    "clauses": ["..."],
    "disclaimer": "..."
  },
  "escrow_ready": true,
  "api_metadata": { "timestamp": "...", "endpoint": "full_flow", "ai_agents_used": true, "processing_time": "calculated_by_client" }
}
```
- Errors: 400 (validation), 500 (internal)

POST `/api/contract`
- Description: Simple, rule-based generation without agents.
- Body:
```json
{ "text": "Cliente solicita 5000 dolares... 14 días." }
```
- Success 200:
```json
{
  "contrato": {
    "milestones": [ { "descripcion": "...", "deadline": "YYYY-MM-DD", "pago_parcial": "1500.00 USDC" } ],
    "total": "5000.00 USDC",
    "clausulas": [ "..." ],
    "riesgos": [ "..." ]
  },
  "explicacion": "..."
}
```
- Errors: 400, 500

POST `/api/structured_contract`
- Description: Generate from structured form fields.
- Body (subset shown):
```json
{
  "description": "Sitio web corporativo",
  "offeredAmount": 2000,
  "requestedAmount": 5000,
  "days": 20,
  "role": "freelancer",
  "freelancerWallet": "0x...",
  "clientWallet": "0x..."
}
```
- Success 200: Same structure as `/api/contract`, with `formData` echo and `api_metadata`.

## Wallet Validation

POST `/api/validate_wallet`
- Validates address format and network support.
- Body:
```json
{ "address": "0x0123...abcd", "network": "polygon" }
```
- Success 200:
```json
{ "valid": true, "address": "0x0123...", "network": "polygon", "error": null, "balance": null }
```
- Notes: Networks supported: `polygon`, `ethereum`, `mumbai`.

## Agents Status

GET `/api/agents/status`
- Returns configured status and agent list.
- Example:
```json
{
  "openai_configured": true,
  "agents_available": ["NegotiationAgent", "ContractGeneratorAgent", "DisputeResolverAgent"],
  "model": "gpt-4o-mini",
  "timestamp": "..."
}
```

## Template Security

POST `/api/templates/validate`
- Validates a template JSON string securely.
- Body:
```json
{ "template_json": "{ ... JSON ... }", "user_id": "abc" }
```
- Success 200:
```json
{ "valid": true, "security_score": 90, "sanitized_template": { "name": "...", "_security": {"validated_at": "...", "security_score": 90, "validation_version": "1.0" } }, "errors": [], "warnings": [], "timestamp": "..." }
```

POST `/api/templates/upload`
- Validates and returns a sanitized, id-tagged template.
- Body:
```json
{ "template_data": {"name": "...", "description": "..."}, "user_id": "abc" }
```
- Success 200:
```json
{ "success": true, "template_id": "abcd1234", "template": { "id": "abcd1234", "uploaded_at": "...", "security_validated": true, ... }, "security_score": 92, "warnings": [], "timestamp": "..." }
```

GET `/api/templates/security/info`
- Returns security measures and constraints.

## Chat AI

POST `/api/chat/session`
- Creates a new chat session.
- Body (optional):
```json
{ "user_id": "abc", "agent_type": "contract" }
```
- Response:
```json
{ "session_id": "uuid", "agent_type": "contract", "created_at": "...", "message": "Sesión de chat creada exitosamente" }
```

GET `/api/chat/session/{session_id}/history`
- Returns message history.

PUT `/api/chat/session/{session_id}/agent`
- Changes agent for a session.
- Body:
```json
{ "agent_type": "technical" }
```

GET `/api/chat/agents`
- Lists available agents with ids, names, and descriptions.

POST `/api/chat/message`
- Sends a message to the chat system.
- Body:
```json
{ "message": "Hola", "session_id": "uuid", "user_id": "abc", "context": {"current_view": "chat"} }
```
- Response:
```json
{ "response": "...", "session_id": "uuid", "timestamp": "...", "agent_type": "ContractAssistantAgent", "suggestions": ["..."] }
```

## Error handling

- 404:
```json
{ "error": "Endpoint not found", "message": "..." }
```
- 405:
```json
{ "error": "Method not allowed", "message": "..." }
```
- 400/500 include FastAPI `detail` or structured content where applicable.