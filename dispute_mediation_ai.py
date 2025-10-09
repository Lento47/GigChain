"""
GigChain.io - AI-Powered Dispute Mediation System
Sistema de mediación inteligente para resolver disputas antes de votación oracle.
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
from openai import OpenAI

from dispute_oracle_system import DisputeStatus, DisputeOutcome, dispute_oracle

logger = logging.getLogger(__name__)


class MediationStatus(str, Enum):
    """Estado de la mediación."""
    INITIATED = "initiated"
    IN_PROGRESS = "in_progress"
    PROPOSAL_PENDING = "proposal_pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    ESCALATED_TO_ORACLE = "escalated_to_oracle"
    RESOLVED = "resolved"


class ProposalType(str, Enum):
    """Tipo de propuesta de resolución."""
    FULL_PAYMENT = "full_payment"
    PARTIAL_PAYMENT = "partial_payment"
    REFUND = "refund"
    REVISION = "revision"
    EXTENSION = "extension"
    COMPROMISE = "compromise"


@dataclass
class MediationProposal:
    """Propuesta de resolución generada por AI."""
    proposal_id: str
    dispute_id: int
    proposal_type: ProposalType
    description: str
    payment_adjustment: float  # Ajuste de pago propuesto
    reasoning: str
    confidence_score: float
    conditions: List[str]
    benefits_freelancer: List[str]
    benefits_client: List[str]
    created_at: str
    expires_at: str


@dataclass
class MediationSession:
    """Sesión de mediación entre las partes."""
    mediation_id: str
    dispute_id: int
    status: MediationStatus
    ai_proposals: List[MediationProposal]
    chat_history: List[Dict[str, Any]]
    freelancer_accepted: Optional[bool]
    client_accepted: Optional[bool]
    final_agreement: Optional[Dict[str, Any]]
    started_at: str
    resolved_at: Optional[str]
    rounds: int  # Número de rondas de negociación


class DisputeMediationAgent:
    """
    AI Agent especializado en mediación de disputas.
    Analiza evidencias, propone soluciones y facilita acuerdos.
    """
    
    def __init__(self, model: str = "gpt-4o-mini", temperature: float = 0.3):
        self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.model = model
        self.temperature = temperature
    
    def analyze_dispute(self, dispute: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analiza una disputa y genera un reporte detallado.
        
        Args:
            dispute: Datos de la disputa
            
        Returns:
            Análisis completo con recomendaciones
        """
        try:
            prompt = f"""Eres un mediador experto en GigChain.io. Analiza esta disputa y genera un reporte objetivo.

INFORMACIÓN DE LA DISPUTA:
{json.dumps(dispute, ensure_ascii=False, indent=2)}

CRITERIOS DE ANÁLISIS:
1. Evidencias presentadas por ambas partes
2. Cumplimiento de términos del contrato
3. Calidad del trabajo vs. expectativas
4. Comunicación y profesionalismo
5. Factores mitigantes y circunstancias especiales

EVALUACIÓN OBJETIVA:
- Analiza si el trabajo cumple los estándares acordados
- Evalúa si los plazos fueron razonables
- Considera factores externos que afectaron el proyecto
- Identifica responsabilidades de cada parte

OUTPUT JSON:
{{
  "analysis_summary": "string",
  "work_quality_assessment": {{
    "score": float (0-100),
    "meets_requirements": boolean,
    "quality_issues": ["string"],
    "quality_highlights": ["string"]
  }},
  "timeline_assessment": {{
    "deadlines_met": boolean,
    "delays": ["string"],
    "delay_responsibility": "freelancer/client/shared/external",
    "delay_justification": "string"
  }},
  "communication_assessment": {{
    "freelancer_communication": "excellent/good/fair/poor",
    "client_communication": "excellent/good/fair/poor",
    "issues": ["string"]
  }},
  "contract_compliance": {{
    "freelancer_compliance": float (0-100),
    "client_compliance": float (0-100),
    "violations": ["string"]
  }},
  "fault_distribution": {{
    "freelancer_fault_percentage": float (0-100),
    "client_fault_percentage": float (0-100),
    "shared_fault": boolean,
    "explanation": "string"
  }},
  "mitigating_factors": ["string"],
  "aggravating_factors": ["string"],
  "recommendation": "favor_freelancer/favor_client/compromise/need_more_evidence",
  "confidence_level": float (0-1)
}}"""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": "Analiza esta disputa de manera imparcial."}
                ],
                temperature=self.temperature,
                response_format={"type": "json_object"}
            )
            
            analysis = json.loads(response.choices[0].message.content)
            analysis["analyzed_at"] = datetime.now().isoformat()
            
            logger.info(f"Dispute analysis completed for dispute {dispute.get('dispute_id')}")
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing dispute: {str(e)}")
            return {
                "error": str(e),
                "analysis_summary": "Error al analizar la disputa",
                "recommendation": "need_more_evidence",
                "confidence_level": 0.0
            }
    
    def generate_resolution_proposals(
        self,
        dispute: Dict[str, Any],
        analysis: Dict[str, Any]
    ) -> List[MediationProposal]:
        """
        Genera múltiples propuestas de resolución basadas en el análisis.
        
        Args:
            dispute: Datos de la disputa
            analysis: Análisis previo de la disputa
            
        Returns:
            Lista de propuestas de mediación
        """
        try:
            prompt = f"""Eres un mediador experto. Genera 3 propuestas DIFERENTES de resolución para esta disputa.

DISPUTA:
{json.dumps(dispute, ensure_ascii=False, indent=2)}

ANÁLISIS:
{json.dumps(analysis, ensure_ascii=False, indent=2)}

REGLAS PARA PROPUESTAS:
1. Cada propuesta debe ser justa y equilibrada
2. Considera los intereses de ambas partes
3. Propón soluciones creativas (no solo pago/reembolso)
4. Incluye condiciones específicas para cada propuesta
5. Explica beneficios para cada parte

TIPOS DE PROPUESTAS:
- Pago completo (si trabajo cumple estándares)
- Pago parcial (si hay problemas menores)
- Reembolso (si trabajo no cumple)
- Revisión (dar oportunidad de corregir)
- Extensión (más tiempo para completar)
- Compromiso (solución intermedia creativa)

OUTPUT JSON:
{{
  "proposals": [
    {{
      "proposal_type": "string (full_payment/partial_payment/refund/revision/extension/compromise)",
      "description": "string (descripción clara de la propuesta)",
      "payment_adjustment": float (ajuste de pago: -100 a 100 como porcentaje del monto original),
      "reasoning": "string (razón de esta propuesta basada en evidencias)",
      "confidence_score": float (0-1, qué tan apropiada es esta propuesta),
      "conditions": ["string (condiciones específicas para implementar)"],
      "benefits_freelancer": ["string (beneficios para freelancer)"],
      "benefits_client": ["string (beneficios para cliente)"],
      "implementation_steps": ["string (pasos para implementar)"],
      "timeline_days": integer (días para implementar)
    }}
  ]
}}"""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": "Genera propuestas de mediación equilibradas."}
                ],
                temperature=self.temperature + 0.2,  # Más creatividad para propuestas
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            proposals = []
            
            for i, prop_data in enumerate(result.get("proposals", [])):
                proposal = MediationProposal(
                    proposal_id=f"{dispute['dispute_id']}_proposal_{i+1}",
                    dispute_id=dispute["dispute_id"],
                    proposal_type=ProposalType(prop_data["proposal_type"]),
                    description=prop_data["description"],
                    payment_adjustment=prop_data["payment_adjustment"],
                    reasoning=prop_data["reasoning"],
                    confidence_score=prop_data["confidence_score"],
                    conditions=prop_data["conditions"],
                    benefits_freelancer=prop_data["benefits_freelancer"],
                    benefits_client=prop_data["benefits_client"],
                    created_at=datetime.now().isoformat(),
                    expires_at=datetime.now().isoformat()  # TODO: Calculate expiry
                )
                proposals.append(proposal)
            
            logger.info(f"Generated {len(proposals)} mediation proposals for dispute {dispute['dispute_id']}")
            return proposals
            
        except Exception as e:
            logger.error(f"Error generating proposals: {str(e)}")
            return []
    
    def facilitate_negotiation(
        self,
        message: str,
        sender: str,
        dispute: Dict[str, Any],
        chat_history: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Facilita la negociación entre las partes con respuestas inteligentes.
        
        Args:
            message: Mensaje de una de las partes
            sender: 'freelancer' o 'client'
            dispute: Datos de la disputa
            chat_history: Historial de mensajes
            
        Returns:
            Respuesta del mediador AI
        """
        try:
            # Construir contexto de la conversación
            context = "\n".join([
                f"{msg['sender']}: {msg['message']}"
                for msg in chat_history[-10:]  # Últimos 10 mensajes
            ])
            
            prompt = f"""Eres un mediador profesional en GigChain.io. Tu objetivo es facilitar un acuerdo justo.

DISPUTA:
{json.dumps(dispute, ensure_ascii=False, indent=2)}

CONVERSACIÓN PREVIA:
{context}

NUEVO MENSAJE DE {sender.upper()}:
{message}

REGLAS DE MEDIACIÓN:
1. Mantén un tono neutral y profesional
2. Valida las preocupaciones de ambas partes
3. Redirige hacia soluciones constructivas
4. Sugiere compromisos cuando sea apropiado
5. Evita tomar partido explícitamente
6. Enfócate en intereses, no en posiciones
7. Propón pasos concretos hacia la resolución

OUTPUT JSON:
{{
  "response": "string (tu respuesta como mediador)",
  "suggested_actions": ["string (acciones sugeridas para avanzar)"],
  "sentiment_analysis": {{
    "sender_sentiment": "positive/neutral/negative/frustrated",
    "willingness_to_compromise": float (0-1),
    "key_concerns": ["string"]
  }},
  "mediation_guidance": {{
    "next_step": "string (próximo paso recomendado)",
    "closer_to_resolution": boolean,
    "risk_of_escalation": float (0-1),
    "recommended_proposal": "string (propuesta específica si aplica)"
  }},
  "follow_up_questions": ["string (preguntas para clarificar)"]
}}"""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": message}
                ],
                temperature=self.temperature,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            result["timestamp"] = datetime.now().isoformat()
            result["mediator"] = "AI Mediator"
            
            logger.info(f"Facilitated negotiation message for dispute {dispute.get('dispute_id')}")
            return result
            
        except Exception as e:
            logger.error(f"Error facilitating negotiation: {str(e)}")
            return {
                "response": "Disculpa, hubo un error procesando tu mensaje. Por favor, intenta nuevamente.",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }


class DisputeMediationSystem:
    """
    Sistema completo de mediación de disputas con AI.
    """
    
    def __init__(self):
        self.ai_agent = DisputeMediationAgent()
        self.active_mediations: Dict[str, MediationSession] = {}
        self.mediation_counter = 1
    
    def initiate_mediation(
        self,
        dispute_id: int,
        initiator: str  # 'freelancer' o 'client'
    ) -> MediationSession:
        """
        Inicia una sesión de mediación para una disputa.
        
        Args:
            dispute_id: ID de la disputa
            initiator: Quién inicia la mediación
            
        Returns:
            Sesión de mediación creada
        """
        try:
            # Obtener disputa del sistema oracle
            dispute = dispute_oracle.get_dispute(dispute_id)
            if not dispute:
                raise ValueError(f"Dispute {dispute_id} not found")
            
            # Verificar que la disputa esté en estado válido para mediación
            if dispute["status"] not in [DisputeStatus.PENDING, DisputeStatus.UNDER_REVIEW]:
                raise ValueError(f"Dispute {dispute_id} cannot be mediated in status {dispute['status']}")
            
            # Analizar disputa
            analysis = self.ai_agent.analyze_dispute(dispute)
            
            # Generar propuestas de resolución
            proposals = self.ai_agent.generate_resolution_proposals(dispute, analysis)
            
            # Crear sesión de mediación
            mediation_id = f"mediation_{self.mediation_counter}"
            self.mediation_counter += 1
            
            session = MediationSession(
                mediation_id=mediation_id,
                dispute_id=dispute_id,
                status=MediationStatus.INITIATED,
                ai_proposals=proposals,
                chat_history=[{
                    "role": "system",
                    "message": f"Mediación iniciada por {initiator}",
                    "timestamp": datetime.now().isoformat(),
                    "analysis": analysis
                }],
                freelancer_accepted=None,
                client_accepted=None,
                final_agreement=None,
                started_at=datetime.now().isoformat(),
                resolved_at=None,
                rounds=1
            )
            
            self.active_mediations[mediation_id] = session
            
            logger.info(f"✅ Mediation {mediation_id} initiated for dispute {dispute_id}")
            return session
            
        except Exception as e:
            logger.error(f"Error initiating mediation: {str(e)}")
            raise
    
    def send_message(
        self,
        mediation_id: str,
        sender: str,
        message: str
    ) -> Dict[str, Any]:
        """
        Envía un mensaje en la mediación y obtiene respuesta del AI mediador.
        
        Args:
            mediation_id: ID de la mediación
            sender: 'freelancer' o 'client'
            message: Mensaje del usuario
            
        Returns:
            Respuesta del mediador AI
        """
        try:
            session = self.active_mediations.get(mediation_id)
            if not session:
                raise ValueError(f"Mediation {mediation_id} not found")
            
            # Obtener disputa
            dispute = dispute_oracle.get_dispute(session.dispute_id)
            
            # Agregar mensaje al historial
            session.chat_history.append({
                "sender": sender,
                "message": message,
                "timestamp": datetime.now().isoformat()
            })
            
            # Obtener respuesta del AI mediador
            response = self.ai_agent.facilitate_negotiation(
                message=message,
                sender=sender,
                dispute=dispute,
                chat_history=session.chat_history
            )
            
            # Agregar respuesta al historial
            session.chat_history.append({
                "sender": "ai_mediator",
                "message": response["response"],
                "timestamp": response["timestamp"],
                "metadata": response
            })
            
            # Actualizar estado si es necesario
            if response.get("mediation_guidance", {}).get("closer_to_resolution"):
                session.status = MediationStatus.PROPOSAL_PENDING
            
            logger.info(f"Message processed in mediation {mediation_id}")
            return response
            
        except Exception as e:
            logger.error(f"Error sending message: {str(e)}")
            raise
    
    def respond_to_proposal(
        self,
        mediation_id: str,
        proposal_id: str,
        responder: str,  # 'freelancer' o 'client'
        accepted: bool,
        counter_proposal: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Responde a una propuesta de mediación.
        
        Args:
            mediation_id: ID de la mediación
            proposal_id: ID de la propuesta
            responder: Quién responde
            accepted: Si acepta la propuesta
            counter_proposal: Contrapropuesta opcional
            
        Returns:
            Resultado de la respuesta
        """
        try:
            session = self.active_mediations.get(mediation_id)
            if not session:
                raise ValueError(f"Mediation {mediation_id} not found")
            
            # Buscar propuesta
            proposal = next(
                (p for p in session.ai_proposals if p.proposal_id == proposal_id),
                None
            )
            if not proposal:
                raise ValueError(f"Proposal {proposal_id} not found")
            
            # Registrar respuesta
            if responder == "freelancer":
                session.freelancer_accepted = accepted
            else:
                session.client_accepted = accepted
            
            # Verificar si ambas partes aceptaron
            if session.freelancer_accepted and session.client_accepted:
                # ¡Acuerdo alcanzado!
                session.status = MediationStatus.ACCEPTED
                session.resolved_at = datetime.now().isoformat()
                session.final_agreement = asdict(proposal)
                
                # Actualizar disputa original
                dispute_oracle.disputes[session.dispute_id].status = DisputeStatus.RESOLVED
                
                logger.info(f"✅ Mediation {mediation_id} RESOLVED - Both parties agreed")
                
                return {
                    "success": True,
                    "status": "resolved",
                    "message": "¡Acuerdo alcanzado! Ambas partes aceptaron la propuesta.",
                    "agreement": session.final_agreement
                }
            
            elif session.freelancer_accepted is False or session.client_accepted is False:
                # Alguna parte rechazó
                session.rounds += 1
                
                if session.rounds > 3:
                    # Demasiadas rondas, escalar a oracle
                    session.status = MediationStatus.ESCALATED_TO_ORACLE
                    
                    logger.info(f"⚠️ Mediation {mediation_id} escalated to oracle voting")
                    
                    return {
                        "success": False,
                        "status": "escalated",
                        "message": "No se pudo alcanzar un acuerdo. La disputa se escalará a votación oracle.",
                        "rounds": session.rounds
                    }
                
                # Generar nueva ronda de propuestas si hay contrapropuesta
                if counter_proposal:
                    session.chat_history.append({
                        "sender": responder,
                        "message": f"Contrapropuesta: {counter_proposal}",
                        "timestamp": datetime.now().isoformat()
                    })
                    session.status = MediationStatus.IN_PROGRESS
                
                return {
                    "success": False,
                    "status": "rejected",
                    "message": "Propuesta rechazada. Continuando mediación.",
                    "rounds": session.rounds
                }
            
            else:
                # Esperando respuesta de la otra parte
                return {
                    "success": True,
                    "status": "waiting",
                    "message": f"Esperando respuesta de {'cliente' if responder == 'freelancer' else 'freelancer'}",
                    "waiting_for": "client" if responder == "freelancer" else "freelancer"
                }
            
        except Exception as e:
            logger.error(f"Error responding to proposal: {str(e)}")
            raise
    
    def get_mediation_status(self, mediation_id: str) -> Dict[str, Any]:
        """Obtiene el estado actual de una mediación."""
        session = self.active_mediations.get(mediation_id)
        if not session:
            return {"error": "Mediation not found"}
        
        return {
            "mediation_id": session.mediation_id,
            "dispute_id": session.dispute_id,
            "status": session.status,
            "proposals_count": len(session.ai_proposals),
            "messages_count": len(session.chat_history),
            "rounds": session.rounds,
            "freelancer_response": session.freelancer_accepted,
            "client_response": session.client_accepted,
            "started_at": session.started_at,
            "resolved_at": session.resolved_at,
            "final_agreement": session.final_agreement
        }
    
    def get_mediation_history(self, mediation_id: str) -> List[Dict[str, Any]]:
        """Obtiene el historial completo de una mediación."""
        session = self.active_mediations.get(mediation_id)
        if not session:
            return []
        
        return session.chat_history
    
    def get_active_mediations(self) -> List[Dict[str, Any]]:
        """Obtiene todas las mediaciones activas."""
        return [
            self.get_mediation_status(mediation_id)
            for mediation_id in self.active_mediations.keys()
            if self.active_mediations[mediation_id].status in [
                MediationStatus.INITIATED,
                MediationStatus.IN_PROGRESS,
                MediationStatus.PROPOSAL_PENDING
            ]
        ]


# Global mediation system instance
mediation_system = DisputeMediationSystem()


def initiate_dispute_mediation(dispute_id: int, initiator: str) -> MediationSession:
    """Convenience function to initiate mediation."""
    return mediation_system.initiate_mediation(dispute_id, initiator)


def send_mediation_message(mediation_id: str, sender: str, message: str) -> Dict[str, Any]:
    """Convenience function to send mediation message."""
    return mediation_system.send_message(mediation_id, sender, message)
