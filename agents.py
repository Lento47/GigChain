"""Agents for GigChain: AI chaining for contract negotiation, generation, and resolution."""

from __future__ import annotations
import os
from typing import Dict, Any, Optional
from dataclasses import dataclass
from openai import OpenAI
import json


@dataclass
class AgentInput:
    parsed: Dict[str, Any]  # From ParsedInput in contract_ai
    role: str  # 'freelancer' or 'cliente'
    complexity: str  # 'low'/'medium'/'high'


class BaseAgent:
    def __init__(self, model: str = "gpt-4o-mini", temp: float = 0.1):
        self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.model = model
        self.temp = temp

    def run(self, prompt: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "system", "content": prompt}, {"role": "user", "content": json.dumps(input_data)}],
                temperature=self.temp,
                response_format={"type": "json_object"}
            )
            output = json.loads(response.choices[0].message.content)
            output["disclaimer"] = "Este es un borrador AI generado por GigChain.io. No constituye consejo legal. Cumple con MiCA/GDPR – consulta a un experto."
            return output
        except Exception as e:
            raise ValueError(f"Agent error: {e}")


class NegotiationAgent(BaseAgent):
    def run(self, input_data: AgentInput) -> Dict[str, Any]:
        prompt = f"""Eres NegotiationAgent para GigChain.io. Analiza la propuesta y genera una contraoferta equilibrada.

CONTEXTO:
- Role: {input_data.role}
- Complexity: {input_data.complexity}
- Parsed Data: {json.dumps(input_data.parsed, ensure_ascii=False)}

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
        return super().run(prompt, input_data.__dict__)


class ContractGeneratorAgent(BaseAgent):
    def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:  # Toma output de Negotiation
        prompt = f"""Eres ContractGeneratorAgent para GigChain.io. Genera un contrato inteligente completo basado en la negociación.

INPUT NEGOCIACIÓN:
{json.dumps(input_data, ensure_ascii=False, indent=2)}

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
        return super().run(prompt, input_data)


class DisputeResolverAgent(BaseAgent):
    def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:  # Hook opcional, para disputes futuros
        prompt = f"""Eres DisputeResolverAgent para GigChain.io. Evalúa disputas y propone resoluciones justas.

INPUT DISPUTA:
{json.dumps(input_data, ensure_ascii=False, indent=2)}

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
        return super().run(prompt, input_data)


class QualityAgent(BaseAgent):
    """Agent especializado en evaluación de calidad de trabajos."""
    def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        prompt = f"""Eres QualityAgent para GigChain.io. Evalúa la calidad de trabajos entregados.

INPUT TRABAJO:
{json.dumps(input_data, ensure_ascii=False, indent=2)}

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
        return super().run(prompt, input_data)


class PaymentAgent(BaseAgent):
    """Agent especializado en gestión de pagos y transacciones."""
    def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        prompt = f"""Eres PaymentAgent para GigChain.io. Gestiona pagos y transacciones Web3.

INPUT PAGO:
{json.dumps(input_data, ensure_ascii=False, indent=2)}

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
        return super().run(prompt, input_data)


# Factory para chaining mejorado
def chain_agents(input_data: AgentInput) -> Dict[str, Any]:
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
        # Paso 1: Negociación
        negotiation_result = NegotiationAgent().run(input_data)
        
        # Paso 2: Generación de contrato
        contract_result = ContractGeneratorAgent().run(negotiation_result)
        
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
        if "deliverables" in input_data.parsed or "work_samples" in input_data.parsed:
            quality_result = QualityAgent().run({
                "contract": contract_result,
                "deliverables": input_data.parsed.get("deliverables", []),
                "work_samples": input_data.parsed.get("work_samples", [])
            })
            full_result["quality_assessment"] = quality_result
            full_result["chain_metadata"]["agents_used"].append("QualityAgent")
        
        # Paso 4: Payment Agent (si hay transacciones)
        if "payment_info" in input_data.parsed or "wallet_addresses" in input_data.parsed:
            payment_result = PaymentAgent().run({
                "contract": contract_result,
                "payment_info": input_data.parsed.get("payment_info", {}),
                "wallet_addresses": input_data.parsed.get("wallet_addresses", {})
            })
            full_result["payment_management"] = payment_result
            full_result["chain_metadata"]["agents_used"].append("PaymentAgent")
        
        # Paso 5: Dispute Resolver (solo para casos complejos)
        if input_data.complexity == "high":
            dispute_result = DisputeResolverAgent().run({
                "contract": contract_result,
                "negotiation": negotiation_result,
                "evidence": input_data.parsed.get("evidence", [])
            })
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
        "openai_configured": bool(os.getenv('OPENAI_API_KEY')),
        "model": "gpt-4o-mini",
        "temperature": 0.1
    }

