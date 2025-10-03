# Backend Modules and Public Functions

This document describes public functions, classes, and their usage across backend modules.

## `contract_ai.py`

- `generate_contract(input_text: str) -> Dict[str, object]`
  - Generates a rule-based contract suggestion in Spanish.
  - Raises `ValueError` if `input_text` is empty.
  - Example:
    ```python
    from contract_ai import generate_contract
    result = generate_contract("Soy freelancer, ofrezco $2000, cliente solicita $5000, 20 días")
    print(result["contrato"]["total"])  # e.g., "5000.00 USDC"
    ```

- `full_flow(text: str) -> Dict[str, Any]`
  - Runs the AI multi-agent flow if complexity > low, otherwise falls back to `generate_contract`.
  - Returns either the rule-based structure or an AI JSON with `escrow_ready`.
  - Example:
    ```python
    from contract_ai import full_flow
    ai = full_flow("Freelancer ofrezco 2000 dolares. Cliente solicita 5000 dolares. 20 días.")
    ```

- `parse_input(text: str) -> ParsedAmounts`
  - Extracts amounts from text and classifies offer vs desired.

- `parsed_to_dict(parsed_amounts, role, total_amount, total_days, risks) -> Dict[str, Any]`
  - Normalizes parsed data for agents.

Data classes and helpers are internal, but noteworthy patterns:
- Currency parsing: `$2000`, `2000 USD`, `2000 usdc`
- Role detection: `soy freelancer|cliente`
- Duration detection: `20 días|days`

## `agents.py`

- `class AgentInput`
  - Dataclass with fields: `parsed: Dict[str, Any]`, `role: str`, `complexity: str`.

- `class BaseAgent(model: str = "gpt-4o-mini", temp: float = 0.1)`
  - `run(prompt: str, input_data: Dict[str, Any]) -> Dict[str, Any]`
  - Low-level OpenAI chat JSON agent with stable disclaimer injection.

- `class NegotiationAgent(BaseAgent)`
  - `run(input_data: AgentInput) -> Dict[str, Any]`
  - Produces counter-offer, milestones, risks.

- `class ContractGeneratorAgent(BaseAgent)`
  - `run(input_data: Dict[str, Any]) -> Dict[str, Any]`
  - Produces `full_terms`, `escrow_params`, `clauses`.

- `class DisputeResolverAgent(BaseAgent)`
  - `run(input_data: Dict[str, Any]) -> Dict[str, Any]`
  - Prototype for dispute analysis.

- `chain_agents(input_data: AgentInput) -> Dict[str, Any]`
  - Orchestrates Negotiation -> ContractGenerator -> optional DisputeResolver for `complexity == "high"`.
  - Example:
    ```python
    from agents import chain_agents, AgentInput
    result = chain_agents(AgentInput(parsed={"amounts": {"total": 5000}}, role="freelancer", complexity="medium"))
    ```

## `chat_ai.py`

- `class ChatManager`
  - `.create_session(user_id: Optional[str] = None, agent_type: str = "contract") -> str`
  - `.send_message(message: str, session_id: str, user_id: Optional[str], context: Optional[Dict[str, Any]]) -> Dict[str, Any]`
  - `.get_session_history(session_id: str) -> List[Dict[str, Any]]`
  - `.switch_agent(session_id: str, agent_type: str) -> bool`
  - `.get_available_agents() -> List[Dict[str, str]]`

- `get_chat_response(message: str, session_id: Optional[str], user_id: Optional[str], context: Optional[Dict[str, Any]]) -> Dict[str, Any]`
  - Thin wrapper around `ChatManager.send_message`.

- Agent classes:
  - `ChatAgent` (base)
  - `ContractAssistantAgent`
  - `TechnicalSupportAgent`
  - `BusinessAdvisorAgent`

All agents use OpenAI via `OPENAI_API_KEY` and expose:
- `generate_response(message, context, session_history) -> Dict[str, Any]`

## `security/template_security.py`

- `class SecurityValidationResult`
  - Fields: `is_valid`, `sanitized_data`, `errors`, `warnings`, `security_score`.

- `class TemplateSecurityValidator`
  - `.validate_template(template_data: Dict[str, Any]) -> SecurityValidationResult`
  - Validates structure, whitelists fields, sanitizes content, scores security.

- `validate_template_security(template_json: str) -> SecurityValidationResult`
  - Entry point to load JSON and validate.
  - Example:
    ```python
    from security.template_security import validate_template_security
    res = validate_template_security('{"name":"Demo","description":"Plantilla"}')
    assert res.is_valid
    ```

## FastAPI app (`main.py`)

- App instance: `app = FastAPI(...)`
- Middleware: request logging
- Pydantic models: `ContractRequest`, `SimpleContractRequest`, `StructuredContractRequest`, `ChatMessage`, `ChatResponse`, `WalletValidationRequest`, `WalletValidationResponse`, `HealthResponse`, `TemplateValidationRequest`, `TemplateUploadRequest`
- Endpoints implemented in API docs.

Environment variables:
- `OPENAI_API_KEY` (agents and chat)
- `PORT` (default 5000)
- `DEBUG` (`True` to enable reload)