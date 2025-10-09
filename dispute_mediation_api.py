"""
GigChain.io - Dispute Mediation API Routes
FastAPI endpoints para el sistema de mediación de disputas con AI.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging

from dispute_mediation_ai import (
    mediation_system,
    MediationStatus,
    ProposalType,
    initiate_dispute_mediation,
    send_mediation_message
)
from auth import get_current_wallet, get_optional_wallet

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/mediation", tags=["Dispute Mediation"])


# Pydantic models
class InitiateMediationRequest(BaseModel):
    dispute_id: int = Field(..., description="ID of the dispute to mediate")
    initiator: str = Field(..., description="Who initiates: 'freelancer' or 'client'")


class InitiateMediationResponse(BaseModel):
    success: bool
    mediation_id: str
    dispute_id: int
    status: str
    proposals_count: int
    initial_analysis: Dict[str, Any]
    message: str


class SendMessageRequest(BaseModel):
    mediation_id: str = Field(..., description="Mediation session ID")
    sender: str = Field(..., description="'freelancer' or 'client'")
    message: str = Field(..., min_length=1, max_length=2000, description="Message content")


class SendMessageResponse(BaseModel):
    success: bool
    response: str
    suggested_actions: List[str]
    sentiment_analysis: Dict[str, Any]
    mediation_guidance: Dict[str, Any]
    timestamp: str


class RespondToProposalRequest(BaseModel):
    mediation_id: str = Field(..., description="Mediation session ID")
    proposal_id: str = Field(..., description="Proposal ID to respond to")
    responder: str = Field(..., description="'freelancer' or 'client'")
    accepted: bool = Field(..., description="Accept or reject proposal")
    counter_proposal: Optional[str] = Field(None, description="Optional counter-proposal text")


class RespondToProposalResponse(BaseModel):
    success: bool
    status: str
    message: str
    agreement: Optional[Dict[str, Any]] = None
    rounds: Optional[int] = None
    waiting_for: Optional[str] = None


class MediationStatusResponse(BaseModel):
    mediation_id: str
    dispute_id: int
    status: str
    proposals_count: int
    messages_count: int
    rounds: int
    freelancer_response: Optional[bool]
    client_response: Optional[bool]
    started_at: str
    resolved_at: Optional[str]
    final_agreement: Optional[Dict[str, Any]]


# Endpoints

@router.post("/initiate", response_model=InitiateMediationResponse)
async def initiate_mediation_endpoint(request: InitiateMediationRequest):
    """
    Inicia una sesión de mediación con AI para una disputa.
    
    El sistema AI:
    - Analiza automáticamente la disputa y las evidencias
    - Genera múltiples propuestas de resolución equilibradas
    - Proporciona análisis imparcial de responsabilidades
    - Facilita la negociación entre las partes
    """
    try:
        logger.info(f"Initiating mediation for dispute {request.dispute_id} by {request.initiator}")
        
        # Validar iniciador
        if request.initiator not in ["freelancer", "client"]:
            raise HTTPException(
                status_code=400,
                detail="Initiator must be 'freelancer' or 'client'"
            )
        
        # Iniciar mediación
        session = initiate_dispute_mediation(
            dispute_id=request.dispute_id,
            initiator=request.initiator
        )
        
        # Obtener análisis inicial del historial
        initial_analysis = {}
        if session.chat_history:
            initial_msg = session.chat_history[0]
            if "analysis" in initial_msg:
                initial_analysis = initial_msg["analysis"]
        
        logger.info(f"✅ Mediation {session.mediation_id} initiated successfully")
        
        return InitiateMediationResponse(
            success=True,
            mediation_id=session.mediation_id,
            dispute_id=session.dispute_id,
            status=session.status.value,
            proposals_count=len(session.ai_proposals),
            initial_analysis=initial_analysis,
            message=f"Mediación iniciada exitosamente. Se generaron {len(session.ai_proposals)} propuestas de resolución."
        )
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error initiating mediation: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al iniciar mediación")


@router.post("/message", response_model=SendMessageResponse)
async def send_message_endpoint(request: SendMessageRequest):
    """
    Envía un mensaje en la sesión de mediación y obtiene respuesta del AI mediador.
    
    El AI mediador:
    - Responde de manera neutral y profesional
    - Valida las preocupaciones de ambas partes
    - Sugiere compromisos y soluciones
    - Analiza el sentimiento y disposición a negociar
    - Proporciona próximos pasos recomendados
    """
    try:
        logger.info(f"Processing message in mediation {request.mediation_id} from {request.sender}")
        
        # Validar sender
        if request.sender not in ["freelancer", "client"]:
            raise HTTPException(
                status_code=400,
                detail="Sender must be 'freelancer' or 'client'"
            )
        
        # Enviar mensaje y obtener respuesta
        response = send_mediation_message(
            mediation_id=request.mediation_id,
            sender=request.sender,
            message=request.message
        )
        
        logger.info(f"Message processed in mediation {request.mediation_id}")
        
        return SendMessageResponse(
            success=True,
            response=response.get("response", ""),
            suggested_actions=response.get("suggested_actions", []),
            sentiment_analysis=response.get("sentiment_analysis", {}),
            mediation_guidance=response.get("mediation_guidance", {}),
            timestamp=response.get("timestamp", datetime.now().isoformat())
        )
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error processing message: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al procesar mensaje")


@router.post("/proposal/respond", response_model=RespondToProposalResponse)
async def respond_to_proposal_endpoint(request: RespondToProposalRequest):
    """
    Responde a una propuesta de mediación (aceptar/rechazar).
    
    Si ambas partes aceptan:
    - La disputa se resuelve automáticamente
    - Se implementa el acuerdo según la propuesta
    
    Si alguna parte rechaza:
    - Se inicia una nueva ronda de negociación
    - El AI puede generar nuevas propuestas
    - Después de 3 rondas sin acuerdo, se escala a votación oracle
    """
    try:
        logger.info(f"Processing proposal response in mediation {request.mediation_id}")
        
        # Validar responder
        if request.responder not in ["freelancer", "client"]:
            raise HTTPException(
                status_code=400,
                detail="Responder must be 'freelancer' or 'client'"
            )
        
        # Procesar respuesta
        result = mediation_system.respond_to_proposal(
            mediation_id=request.mediation_id,
            proposal_id=request.proposal_id,
            responder=request.responder,
            accepted=request.accepted,
            counter_proposal=request.counter_proposal
        )
        
        logger.info(f"Proposal response processed: {result.get('status')}")
        
        return RespondToProposalResponse(
            success=result.get("success", False),
            status=result.get("status", "unknown"),
            message=result.get("message", ""),
            agreement=result.get("agreement"),
            rounds=result.get("rounds"),
            waiting_for=result.get("waiting_for")
        )
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error responding to proposal: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al procesar respuesta")


@router.get("/status/{mediation_id}", response_model=MediationStatusResponse)
async def get_mediation_status_endpoint(mediation_id: str):
    """
    Obtiene el estado actual de una sesión de mediación.
    
    Incluye:
    - Estado general de la mediación
    - Número de propuestas generadas
    - Número de mensajes intercambiados
    - Respuestas de cada parte
    - Acuerdo final (si se alcanzó)
    """
    try:
        logger.info(f"Getting status for mediation {mediation_id}")
        
        status = mediation_system.get_mediation_status(mediation_id)
        
        if "error" in status:
            raise HTTPException(status_code=404, detail="Mediation not found")
        
        return MediationStatusResponse(**status)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting mediation status: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al obtener estado")


@router.get("/history/{mediation_id}")
async def get_mediation_history_endpoint(mediation_id: str):
    """
    Obtiene el historial completo de mensajes de una mediación.
    
    Incluye:
    - Todos los mensajes intercambiados
    - Respuestas del AI mediador
    - Análisis y metadatos
    - Timestamps de cada interacción
    """
    try:
        logger.info(f"Getting history for mediation {mediation_id}")
        
        history = mediation_system.get_mediation_history(mediation_id)
        
        if not history:
            raise HTTPException(status_code=404, detail="Mediation not found")
        
        return {
            "mediation_id": mediation_id,
            "history": history,
            "message_count": len(history),
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting mediation history: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al obtener historial")


@router.get("/proposals/{mediation_id}")
async def get_mediation_proposals_endpoint(mediation_id: str):
    """
    Obtiene todas las propuestas de resolución generadas para una mediación.
    
    Incluye:
    - Descripción detallada de cada propuesta
    - Tipo de resolución (pago completo, parcial, reembolso, etc.)
    - Beneficios para cada parte
    - Condiciones de implementación
    - Score de confianza del AI
    """
    try:
        logger.info(f"Getting proposals for mediation {mediation_id}")
        
        session = mediation_system.active_mediations.get(mediation_id)
        if not session:
            raise HTTPException(status_code=404, detail="Mediation not found")
        
        # Convertir propuestas a dicts
        proposals = []
        for proposal in session.ai_proposals:
            from dataclasses import asdict
            proposals.append(asdict(proposal))
        
        return {
            "mediation_id": mediation_id,
            "proposals": proposals,
            "total_proposals": len(proposals),
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting proposals: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al obtener propuestas")


@router.get("/active")
async def get_active_mediations_endpoint():
    """
    Obtiene todas las mediaciones activas en el sistema.
    
    Útil para:
    - Dashboard de administración
    - Monitoreo de disputas en mediación
    - Estadísticas del sistema
    """
    try:
        logger.info("Getting active mediations")
        
        active = mediation_system.get_active_mediations()
        
        return {
            "active_mediations": active,
            "total": len(active),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting active mediations: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al obtener mediaciones activas")


@router.get("/statistics")
async def get_mediation_statistics():
    """
    Obtiene estadísticas del sistema de mediación.
    
    Incluye:
    - Total de mediaciones
    - Tasa de éxito (acuerdos vs escaladas)
    - Tiempo promedio de resolución
    - Propuestas más aceptadas
    """
    try:
        logger.info("Getting mediation statistics")
        
        all_mediations = list(mediation_system.active_mediations.values())
        
        total = len(all_mediations)
        resolved = sum(1 for m in all_mediations if m.status == MediationStatus.RESOLVED)
        escalated = sum(1 for m in all_mediations if m.status == MediationStatus.ESCALATED_TO_ORACLE)
        in_progress = sum(1 for m in all_mediations if m.status in [
            MediationStatus.INITIATED,
            MediationStatus.IN_PROGRESS,
            MediationStatus.PROPOSAL_PENDING
        ])
        
        success_rate = (resolved / total * 100) if total > 0 else 0
        
        return {
            "total_mediations": total,
            "resolved": resolved,
            "escalated_to_oracle": escalated,
            "in_progress": in_progress,
            "success_rate": round(success_rate, 2),
            "average_rounds": round(
                sum(m.rounds for m in all_mediations) / total, 2
            ) if total > 0 else 0,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting statistics: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al obtener estadísticas")


@router.get("/info")
async def get_mediation_info():
    """
    Información sobre el sistema de mediación con AI.
    """
    return {
        "service": "AI-Powered Dispute Mediation",
        "version": "1.0.0",
        "features": [
            "Análisis automático de disputas con AI",
            "Generación de propuestas de resolución equilibradas",
            "Chat mediador inteligente en tiempo real",
            "Análisis de sentimiento y disposición a negociar",
            "Detección de riesgo de escalación",
            "Recomendaciones de próximos pasos",
            "Integración con sistema oracle de votación",
            "Múltiples rondas de negociación (hasta 3)",
            "Resolución automática al alcanzar acuerdo"
        ],
        "proposal_types": [
            "full_payment - Pago completo al freelancer",
            "partial_payment - Pago parcial según calidad",
            "refund - Reembolso al cliente",
            "revision - Oportunidad de corregir trabajo",
            "extension - Extensión de plazo",
            "compromise - Solución intermedia creativa"
        ],
        "max_rounds": 3,
        "ai_model": "gpt-4o-mini",
        "ai_temperature": 0.3,
        "timestamp": datetime.now().isoformat()
    }
