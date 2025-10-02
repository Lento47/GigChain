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
        prompt = f"""Eres NegotiationAgent para GigChain. Input: {json.dumps(input_data.__dict__)}.
        Role: {input_data.role}. Genera contraoferta equilibrada: ajusta amount +/-20% basado en complexity (high: reduce 15%, low: increase 10%).
        Agrega 2-3 milestones. Evalúa riesgos. Output JSON: {{"counter_offer": float, "milestones": [{{"desc": str, "amount": float, "deadline": "YYYY-MM-DD"}}], "risks": [str], "rationale": "CoT breve"}}."""
        return super().run(prompt, input_data.__dict__)


class ContractGeneratorAgent(BaseAgent):
    def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:  # Toma output de Negotiation
        prompt = f"""Eres ContractGeneratorAgent. Input negotiation: {json.dumps(input_data)}.
        Agrega clauses escrow (release on milestone, USDC Polygon), Solidity stubs. Output JSON: {{"full_terms": str, "escrow_params": {{"token": "USDC", "milestones": [...]}}, "clauses": [str]}}."""
        return super().run(prompt, input_data)


class DisputeResolverAgent(BaseAgent):
    def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:  # Hook opcional, para disputes futuros
        prompt = f"""Eres DisputeResolverAgent. Input: {json.dumps(input_data)}.
        Evalúa evidencia vs contract. Output JSON: {{"compliance_pct": 0-100, "resolution": "release/refund/mediate", "oracle_query": "data for Chainlink"}}."""
        return super().run(prompt, input_data)


# Factory para chaining
def chain_agents(input_data: AgentInput) -> Dict[str, Any]:
    negotiation = NegotiationAgent().run(input_data)
    generator = ContractGeneratorAgent()
    full_contract = generator.run(negotiation)
    # Resolver solo si dispute flag (futuro)
    if input_data.complexity == "high":
        resolver = DisputeResolverAgent()
        full_contract["resolution"] = resolver.run({"contract": full_contract, "evidence": []})
    return full_contract

