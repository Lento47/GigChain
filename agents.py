"""Agents for GigChain: AI chaining for contract negotiation, generation, and resolution."""

from __future__ import annotations
import json
import time
from typing import Dict, Any, Optional, List, Union, Protocol
from dataclasses import dataclass
from pydantic import BaseModel, Field, ValidationError, validator
from security.input_sanitizer import sanitize_for_ai, sanitizer
import logging

# Import centralized configuration and OpenAI service
from config import get_config
from services import get_openai_client, OpenAIClientProtocol, MockOpenAIClient

logger = logging.getLogger(__name__)


def create_openai_client(api_key: Optional[str] = None, use_mock: bool = False) -> Union[OpenAIClientProtocol, MockOpenAIClient]:
    """
    Factory function to create OpenAI client or mock.
    
    DEPRECATED: Use get_openai_client() from services instead.
    This function is kept for backward compatibility.
    
    Args:
        api_key: OpenAI API key (if None, uses config)
        use_mock: If True, returns mock client regardless of API key
        
    Returns:
        OpenAI client or MockOpenAIClient
    """
    logger.warning("create_openai_client() is deprecated. Use get_openai_client() from services instead.")
    return get_openai_client(force_mock=use_mock)


@dataclass
class AgentInput:
    parsed: Dict[str, Any]  # From ParsedInput in contract_ai
    role: str  # 'freelancer' or 'cliente'
    complexity: str  # 'low'/'medium'/'high'


# Pydantic models for output validation and sanitization
class MilestoneModel(BaseModel):
    desc: str = Field(..., max_length=500, description="Milestone description")
    amount: float = Field(..., ge=0, description="Milestone amount")
    deadline: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$', description="Deadline in YYYY-MM-DD format")
    percentage: float = Field(..., ge=0, le=100, description="Percentage of total amount")

    @validator('desc')
    def sanitize_desc(cls, v):
        return sanitizer.sanitize_text(v, max_length=500)

    @validator('deadline')
    def validate_deadline(cls, v):
        try:
            from datetime import datetime
            datetime.strptime(v, '%Y-%m-%d')
            return v
        except ValueError:
            raise ValueError('Invalid date format. Use YYYY-MM-DD')


class NegotiationOutputModel(BaseModel):
    counter_offer: float = Field(..., ge=0, description="Counter offer amount")
    milestones: List[MilestoneModel] = Field(..., min_items=1, max_items=10, description="Project milestones")
    risks: List[str] = Field(..., max_items=20, description="Identified risks")
    mitigation_strategies: List[str] = Field(..., max_items=20, description="Risk mitigation strategies")
    rationale: str = Field(..., max_length=1000, description="Negotiation rationale")
    confidence_score: float = Field(..., ge=0, le=1, description="Confidence score")
    negotiation_tips: List[str] = Field(..., max_items=10, description="Negotiation tips")

    @validator('risks', 'mitigation_strategies', 'negotiation_tips')
    def sanitize_string_lists(cls, v):
        return [sanitizer.sanitize_text(item, max_length=200) for item in v]

    @validator('rationale')
    def sanitize_rationale(cls, v):
        return sanitizer.sanitize_text(v, max_length=1000)


class ContractOutputModel(BaseModel):
    contract_title: str = Field(..., max_length=200, description="Contract title")
    parties: Dict[str, str] = Field(..., description="Contracting parties")
    project_scope: str = Field(..., max_length=2000, description="Project scope")
    deliverables: List[str] = Field(..., min_items=1, max_items=50, description="Project deliverables")
    timeline: Dict[str, str] = Field(..., description="Project timeline")
    payment_terms: Dict[str, Any] = Field(..., description="Payment terms")
    intellectual_property: str = Field(..., max_length=1000, description="IP rights")
    termination_clauses: List[str] = Field(..., max_items=20, description="Termination clauses")
    dispute_resolution: str = Field(..., max_length=500, description="Dispute resolution")
    legal_compliance: List[str] = Field(..., max_items=20, description="Legal compliance notes")

    @validator('contract_title', 'project_scope', 'intellectual_property', 'dispute_resolution')
    def sanitize_text_fields(cls, v):
        return sanitizer.sanitize_text(v, max_length=2000)

    @validator('deliverables', 'termination_clauses', 'legal_compliance')
    def sanitize_string_lists(cls, v):
        return [sanitizer.sanitize_text(item, max_length=500) for item in v]


class ResolutionOutputModel(BaseModel):
    resolution_type: str = Field(..., description="Type of resolution")
    recommended_action: str = Field(..., max_length=1000, description="Recommended action")
    timeline: str = Field(..., max_length=200, description="Resolution timeline")
    parties_involved: List[str] = Field(..., max_items=10, description="Parties involved")
    legal_considerations: List[str] = Field(..., max_items=20, description="Legal considerations")
    next_steps: List[str] = Field(..., max_items=20, description="Next steps")
    success_probability: float = Field(..., ge=0, le=1, description="Success probability")

    @validator('recommended_action')
    def sanitize_recommended_action(cls, v):
        return sanitizer.sanitize_text(v, max_length=1000)

    @validator('timeline')
    def sanitize_timeline(cls, v):
        return sanitizer.sanitize_text(v, max_length=200)

    @validator('parties_involved', 'legal_considerations', 'next_steps')
    def sanitize_string_lists(cls, v):
        return [sanitizer.sanitize_text(item, max_length=300) for item in v]


class BaseAgent:
    def __init__(self, model: str = "gpt-4o-mini", temp: float = 0.1, client: Optional[Union[OpenAIClientProtocol, MockOpenAIClient]] = None):
        """
        Initialize base agent with proper dependency injection.
        
        Args:
            model: AI model to use
            temp: Temperature for AI responses
            client: OpenAI client (injected dependency)
        """
        self.client = client or get_openai_client()
        self.model = model
        self.temp = temp

    def _validate_and_sanitize_output(self, raw_output: Dict[str, Any], output_model: BaseModel) -> Dict[str, Any]:
        """
        Validate and sanitize agent output against Pydantic model.
        
        Args:
            raw_output: Raw JSON output from AI model
            output_model: Pydantic model for validation
            
        Returns:
            Validated and sanitized output
            
        Raises:
            ValueError: If output validation fails
        """
        try:
            # Validate against Pydantic model
            validated_output = output_model(**raw_output)
            
            # Convert back to dict with sanitized values
            sanitized_output = validated_output.dict()
            
            # Add disclaimer
            sanitized_output["disclaimer"] = "Este es un borrador AI generado por GigChain.io. No constituye consejo legal. Cumple con MiCA/GDPR – consulta a un experto."
            
            return sanitized_output
            
        except ValidationError as e:
            logger.error(f"Output validation failed: {e}")
            raise ValueError(f"Agent output validation failed: {e}")
        except Exception as e:
            logger.error(f"Output sanitization error: {e}")
            raise ValueError(f"Agent output sanitization failed: {e}")

    def _safe_json_parse(self, json_string: str, max_size: int = 1024 * 1024) -> Dict[str, Any]:
        """
        Safely parse JSON with size and timeout constraints.
        
        Args:
            json_string: JSON string to parse
            max_size: Maximum allowed JSON size in bytes
            
        Returns:
            Parsed JSON as dictionary
            
        Raises:
            ValueError: If JSON parsing fails or exceeds size limits
        """
        # Check size constraint
        if len(json_string.encode('utf-8')) > max_size:
            raise ValueError(f"JSON output too large: {len(json_string.encode('utf-8'))} bytes (max: {max_size})")
        
        # Parse with timeout protection
        start_time = time.time()
        try:
            result = json.loads(json_string)
            parse_time = time.time() - start_time
            
            # Log slow parsing
            if parse_time > 1.0:
                logger.warning(f"Slow JSON parsing: {parse_time:.2f}s")
            
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing failed: {e}")
            raise ValueError(f"Invalid JSON output: {e}")
        except Exception as e:
            logger.error(f"JSON parsing error: {e}")
            raise ValueError(f"JSON parsing failed: {e}")

    def run(self, prompt: str, input_data: Dict[str, Any], output_model: Optional[BaseModel] = None) -> Dict[str, Any]:
        """
        Run agent with input sanitization and output validation.
        
        Args:
            prompt: System prompt for the agent
            input_data: Input data to process
            output_model: Pydantic model for output validation (optional)
            
        Returns:
            Validated and sanitized output
        """
        try:
            # Sanitize input data to prevent prompt injection
            sanitized_data = sanitize_for_ai(input_data)
            
            # Sanitize the prompt itself
            sanitized_prompt = sanitizer.sanitize_text(prompt, max_length=5000)
            
            # Add output format constraints to prompt
            format_instructions = """
            
IMPORTANT OUTPUT CONSTRAINTS:
- Output must be valid JSON only
- No markdown formatting or code blocks
- No additional text outside JSON
- All strings must be properly escaped
- Numbers must be valid JSON numbers
- Arrays and objects must be properly formatted
- Maximum response size: 1MB
"""
            
            full_prompt = sanitized_prompt + format_instructions
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": full_prompt}, 
                    {"role": "user", "content": sanitizer.sanitize_json(sanitized_data)}
                ],
                temperature=self.temp,
                response_format={"type": "json_object"},
                max_tokens=4000  # Limit response size
            )
            
            # Safely parse JSON response
            raw_output = self._safe_json_parse(response.choices[0].message.content)
            
            # Validate and sanitize output if model provided
            if output_model:
                return self._validate_and_sanitize_output(raw_output, output_model)
            else:
                # Basic sanitization for unknown output format
                sanitized_output = {}
                for key, value in raw_output.items():
                    if isinstance(value, str):
                        sanitized_output[key] = sanitizer.sanitize_text(str(value), max_length=1000)
                    elif isinstance(value, (int, float, bool)):
                        sanitized_output[key] = value
                    elif isinstance(value, list):
                        sanitized_output[key] = [
                            sanitizer.sanitize_text(str(item), max_length=500) if isinstance(item, str) else item
                            for item in value[:20]  # Limit list size
                        ]
                    elif isinstance(value, dict):
                        sanitized_output[key] = {
                            k: sanitizer.sanitize_text(str(v), max_length=500) if isinstance(v, str) else v
                            for k, v in list(value.items())[:10]  # Limit dict size
                        }
                    else:
                        sanitized_output[key] = str(value)[:500]  # Truncate unknown types
                
                sanitized_output["disclaimer"] = "Este es un borrador AI generado por GigChain.io. No constituye consejo legal. Cumple con MiCA/GDPR – consulta a un experto."
                return sanitized_output
                
        except Exception as e:
            logger.error(f"Agent execution error: {e}")
            raise ValueError(f"Agent error: {e}")


class NegotiationAgent(BaseAgent):
    def run(self, input_data: AgentInput) -> Dict[str, Any]:
        # Sanitize input data first
        sanitized_input = sanitize_for_ai(input_data)
        
        prompt = f"""Eres NegotiationAgent para GigChain.io. Analiza la propuesta y genera una contraoferta equilibrada.

CONTEXTO:
- Role: {getattr(sanitized_input, 'role', 'cliente')}
- Complexity: {getattr(sanitized_input, 'complexity', 'low')}
- Parsed Data: {sanitizer.sanitize_json(getattr(sanitized_input, 'parsed', {}))}

REGLAS DE NEGOCIACIÓN:
1. Si complexity="low": Aumenta precio 10-15% (menor riesgo)
2. Si complexity="medium": Ajusta precio ±5% (riesgo moderado)
3. Si complexity="high": Reduce precio 10-20% (mayor riesgo)

MILESTONES:
- Crear 2-4 hitos basados en la duración del proyecto
- Distribuir pagos: 30% inicial, 40% medio, 30% final
- Fechas realistas basadas en complexity

EVALUACIÓN DE RIESGOS:
- Identifica riesgos técnicos, de tiempo y de pago
- Sugiere medidas de mitigación
- Considera experiencia del freelancer

OUTPUT JSON:
{{
  "counter_offer": float,
  "milestones": [
    {{"desc": "string", "amount": float, "deadline": "YYYY-MM-DD", "percentage": float}}
  ],
  "risks": ["string"],
  "mitigation_strategies": ["string"],
  "rationale": "string",
  "confidence_score": float,
  "negotiation_tips": ["string"]
}}"""
        return super().run(prompt, sanitized_input, NegotiationOutputModel)


class ContractGeneratorAgent(BaseAgent):
    def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:  # Toma output de Negotiation
        # Sanitize input data
        sanitized_input = sanitize_for_ai(input_data)
        
        prompt = f"""Eres ContractGeneratorAgent para GigChain.io. Genera un contrato inteligente completo basado en la negociación.

INPUT NEGOCIACIÓN:
{sanitizer.sanitize_json(sanitized_input)}

FUNCIONALIDADES REQUERIDAS:
1. Escrow automático con USDC en Polygon
2. Release de fondos por milestones
3. Cláusulas de disputa y resolución
4. Penalizaciones por incumplimiento
5. Términos legales MiCA/GDPR compliant

ESTRUCTURA DEL CONTRATO:
- Términos generales del proyecto
- Parámetros de escrow (token, milestones, fechas)
- Cláusulas de seguridad y compliance
- Mecanismos de resolución de disputas
- Penalizaciones y recompensas

OUTPUT JSON:
{{
  "contract_id": "string",
  "full_terms": "string",
  "escrow_params": {{
    "token": "USDC",
    "network": "Polygon",
    "total_amount": float,
    "milestones": [
      {{"id": "string", "description": "string", "amount": float, "deadline": "YYYY-MM-DD", "percentage": float}}
    ]
  }},
  "solidity_stubs": {{
    "contract_name": "string",
    "functions": ["string"],
    "events": ["string"],
    "modifiers": ["string"]
  }},
  "clauses": [
    {{"type": "string", "title": "string", "content": "string", "importance": "high/medium/low"}}
  ],
  "compliance": {{
    "mica_compliant": boolean,
    "gdpr_compliant": boolean,
    "legal_notes": ["string"]
  }},
  "deployment_ready": boolean,
  "estimated_gas": integer
}}"""
        return super().run(prompt, sanitized_input, ContractOutputModel)


class DisputeResolverAgent(BaseAgent):
    def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:  # Hook opcional, para disputes futuros
        # Sanitize input data
        sanitized_input = sanitize_for_ai(input_data)
        
        prompt = f"""Eres DisputeResolverAgent para GigChain.io. Evalúa disputas y propone resoluciones justas.

INPUT DISPUTA:
{sanitizer.sanitize_json(sanitized_input)}

CRITERIOS DE EVALUACIÓN:
1. Cumplimiento de milestones vs evidencia
2. Calidad del trabajo entregado
3. Tiempo de entrega vs deadline
4. Comunicación entre partes
5. Términos del contrato original

TIPOS DE RESOLUCIÓN:
- "release": Liberar fondos si trabajo cumple estándares
- "refund": Reembolsar si trabajo no cumple
- "mediate": Proponer solución intermedia
- "escalate": Escalar a arbitraje externo

OUTPUT JSON:
{{
  "dispute_id": "string",
  "compliance_percentage": float,
  "resolution": "release/refund/mediate/escalate",
  "reasoning": "string",
  "evidence_analysis": {{
    "work_quality": "excellent/good/fair/poor",
    "timeline_compliance": "on_time/delayed/significantly_delayed",
    "communication": "excellent/good/fair/poor"
  }},
  "recommended_action": "string",
  "oracle_query": "string",
  "confidence_score": float,
  "next_steps": ["string"]
}}"""
        return super().run(prompt, sanitized_input, ResolutionOutputModel)


class QualityAgent(BaseAgent):
    """Agent especializado en evaluación de calidad de trabajos."""
    def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        # Sanitize input data
        sanitized_input = sanitize_for_ai(input_data)
        
        prompt = f"""Eres QualityAgent para GigChain.io. Evalúa la calidad de trabajos entregados.

INPUT TRABAJO:
{sanitizer.sanitize_json(sanitized_input)}

CRITERIOS DE CALIDAD:
1. Cumplimiento de especificaciones técnicas
2. Calidad del código/diseño/escritura
3. Documentación y comentarios
4. Testing y validación
5. Mejores prácticas de la industria

OUTPUT JSON:
{{
  "quality_score": float,
  "technical_compliance": float,
  "code_quality": "excellent/good/fair/poor",
  "documentation_quality": "excellent/good/fair/poor",
  "testing_coverage": float,
  "best_practices_score": float,
  "improvement_suggestions": ["string"],
  "approval_recommendation": "approve/request_changes/reject",
  "detailed_feedback": "string"
}}"""
        return super().run(prompt, sanitized_input)


class PaymentAgent(BaseAgent):
    """Agent especializado en gestión de pagos y transacciones."""
    def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        # Sanitize input data
        sanitized_input = sanitize_for_ai(input_data)
        
        prompt = f"""Eres PaymentAgent para GigChain.io. Gestiona pagos y transacciones Web3.

INPUT PAGO:
{sanitizer.sanitize_json(sanitized_input)}

FUNCIONALIDADES:
1. Validación de wallets y balances
2. Cálculo de comisiones y fees
3. Gestión de milestones y releases
4. Manejo de reembolsos y penalizaciones
5. Integración con USDC en Polygon

OUTPUT JSON:
{{
  "payment_id": "string",
  "transaction_status": "pending/processing/completed/failed",
  "amount_usdc": float,
  "fees": {{
    "platform_fee": float,
    "gas_fee": float,
    "total_fees": float
  }},
  "wallet_validation": {{
    "sender_valid": boolean,
    "receiver_valid": boolean,
    "sufficient_balance": boolean
  }},
  "milestone_release": {{
    "milestone_id": "string",
    "amount_to_release": float,
    "release_conditions_met": boolean
  }},
  "transaction_hash": "string",
  "estimated_completion": "YYYY-MM-DDTHH:MM:SSZ"
}}"""
        return super().run(prompt, sanitized_input)


# Factory para chaining mejorado
def chain_agents(input_data: AgentInput, client: Optional[Union[OpenAIClientProtocol, MockOpenAIClient]] = None) -> Dict[str, Any]:
    """
    Chain de agents para procesamiento completo de contratos.
    
    Flujo:
    1. NegotiationAgent: Genera contraoferta y milestones
    2. ContractGeneratorAgent: Crea contrato inteligente
    3. QualityAgent: Evalúa calidad (si hay entregables)
    4. PaymentAgent: Gestiona pagos (si hay transacciones)
    5. DisputeResolverAgent: Solo para casos complejos
    """
    try:
        # Sanitize input data first
        sanitized_input = sanitize_for_ai(input_data)
        
        # Create sanitized AgentInput
        sanitized_agent_input = AgentInput(
            parsed=sanitized_input.get('parsed', {}),
            role=sanitized_input.get('role', 'cliente'),
            complexity=sanitized_input.get('complexity', 'low')
        )
        
        # Paso 1: Negociación
        negotiation_result = NegotiationAgent(client=client).run(sanitized_agent_input)
        
        # Paso 2: Generación de contrato
        contract_result = ContractGeneratorAgent(client=client).run(sanitize_for_ai(negotiation_result))
        
        # Combinar resultados
        full_result = {
            "negotiation": negotiation_result,
            "contract": contract_result,
            "chain_metadata": {
                "agents_used": ["NegotiationAgent", "ContractGeneratorAgent"],
                "complexity": input_data.complexity,
                "processing_time": "calculated_by_caller"
            }
        }
        
        # Paso 3: Quality Agent (si hay entregables)
        if "deliverables" in sanitized_input.get("parsed", {}) or "work_samples" in sanitized_input.get("parsed", {}):
            quality_result = QualityAgent(client=client).run(sanitize_for_ai({
                "contract": contract_result,
                "deliverables": sanitized_input.get("parsed", {}).get("deliverables", []),
                "work_samples": sanitized_input.get("parsed", {}).get("work_samples", [])
            }))
            full_result["quality_assessment"] = quality_result
            full_result["chain_metadata"]["agents_used"].append("QualityAgent")
        
        # Paso 4: Payment Agent (si hay transacciones)
        if "payment_info" in sanitized_input.get("parsed", {}) or "wallet_addresses" in sanitized_input.get("parsed", {}):
            payment_result = PaymentAgent(client=client).run(sanitize_for_ai({
                "contract": contract_result,
                "payment_info": sanitized_input.get("parsed", {}).get("payment_info", {}),
                "wallet_addresses": sanitized_input.get("parsed", {}).get("wallet_addresses", {})
            }))
            full_result["payment_management"] = payment_result
            full_result["chain_metadata"]["agents_used"].append("PaymentAgent")
        
        # Paso 5: Dispute Resolver (solo para casos complejos)
        if sanitized_input.get("complexity") == "high":
            dispute_result = DisputeResolverAgent(client=client).run(sanitize_for_ai({
                "contract": contract_result,
                "negotiation": negotiation_result,
                "evidence": sanitized_input.get("parsed", {}).get("evidence", [])
            }))
            full_result["dispute_resolution"] = dispute_result
            full_result["chain_metadata"]["agents_used"].append("DisputeResolverAgent")
        
        return full_result
        
    except Exception as e:
        # Fallback: retornar solo negociación básica sin OpenAI
        fallback_negotiation = {
            "counter_offer": input_data.parsed.get("amount", 1000) * 1.1,
            "milestones": [
                {
                    "desc": "Trabajo inicial",
                    "amount": input_data.parsed.get("amount", 1000) * 0.3,
                    "deadline": "2025-01-15",
                    "percentage": 30.0
                },
                {
                    "desc": "Trabajo principal", 
                    "amount": input_data.parsed.get("amount", 1000) * 0.4,
                    "deadline": "2025-01-30",
                    "percentage": 40.0
                },
                {
                    "desc": "Finalización",
                    "amount": input_data.parsed.get("amount", 1000) * 0.3,
                    "deadline": "2025-02-15",
                    "percentage": 30.0
                }
            ],
            "risks": ["Requiere validación manual"],
            "mitigation_strategies": ["Revisión detallada del contrato"],
            "rationale": "Fallback mode - requiere configuración de OpenAI API",
            "confidence_score": 0.5,
            "negotiation_tips": ["Configurar OPENAI_API_KEY para funcionalidad completa"]
        }
        
        return {
            "negotiation": fallback_negotiation,
            "contract": {
                "contract_id": f"fallback_{input_data.parsed.get('amount', 1000)}",
                "full_terms": "Contrato básico generado en modo fallback",
                "escrow_params": {
                    "token": "USDC",
                    "network": "Polygon", 
                    "total_amount": fallback_negotiation["counter_offer"]
                },
                "deployment_ready": False,
                "error": f"Contract generation failed: {str(e)}"
            },
            "chain_metadata": {
                "agents_used": ["FallbackNegotiation"],
                "error": str(e),
                "fallback_mode": True,
                "requires_openai_key": True
            }
        }


def get_agent_status() -> Dict[str, Any]:
    """Obtiene el estado de todos los agents disponibles."""
    return {
        "available_agents": [
            {
                "name": "NegotiationAgent",
                "description": "Genera contraofertas y milestones",
                "status": "active"
            },
            {
                "name": "ContractGeneratorAgent", 
                "description": "Crea contratos inteligentes",
                "status": "active"
            },
            {
                "name": "QualityAgent",
                "description": "Evalúa calidad de trabajos",
                "status": "active"
            },
            {
                "name": "PaymentAgent",
                "description": "Gestiona pagos Web3",
                "status": "active"
            },
            {
                "name": "DisputeResolverAgent",
                "description": "Resuelve disputas",
                "status": "active"
            }
        ],
        "openai_configured": bool(get_config().ai.openai_api_key),
        "model": "gpt-4o-mini",
        "temperature": 0.1
    }

