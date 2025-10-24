"""Chat Router - Chat AI Endpoints"""

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import logging
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List
import json

# Import chat modules
from chat_enhanced import chat_manager

# Import security utilities
from security.input_sanitizer import sanitizer

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/chat", tags=["chat"])

# Pydantic models
class ChatMessage(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="User message")
    user_id: Optional[str] = Field(None, description="User ID for chat history")
    session_id: Optional[str] = Field(None, description="Chat session ID")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context for the AI")

class ChatResponse(BaseModel):
    response: str = Field(..., description="AI response message")
    session_id: str = Field(..., description="Chat session ID")
    timestamp: str = Field(..., description="Response timestamp")
    agent_type: str = Field(..., description="Type of AI agent used")
    suggestions: Optional[List[str]] = Field(None, description="Suggested follow-up questions")

@router.post("/message", response_model=ChatResponse)
async def send_chat_message(request: ChatMessage):
    """
    Envía un mensaje al chat con IA y obtiene respuesta.
    Soporta múltiples tipos de agentes especializados con persistencia.
    """
    try:
        # Validate and sanitize chat message
        is_valid, error = sanitizer.validate_contract_input(request.message)
        if not is_valid:
            return JSONResponse(
                status_code=400,
                content={
                    "response": "Tu mensaje contiene contenido no permitido. Por favor, reformúlalo.",
                    "session_id": request.session_id or str(uuid.uuid4()),
                    "timestamp": datetime.now().isoformat(),
                    "agent_type": "error",
                    "suggestions": []
                }
            )
        
        # Sanitize message before AI processing
        sanitized_message = sanitizer.sanitize_text(request.message)
        logger.info(f"Processing chat message from user: {request.user_id or 'anonymous'}")
        
        # Generar o usar session_id existente
        session_id = request.session_id or str(uuid.uuid4())
        
        # Si no existe la sesión, crearla
        if not chat_manager.db.get_session(session_id):
            chat_manager.create_session(
                user_id=request.user_id,
                agent_type=request.context.get("agent_type", "contract") if request.context else "contract"
            )
        
        # Obtener respuesta del chat mejorado with sanitized message
        response_data = await chat_manager.process_message(
            message=sanitized_message,
            session_id=session_id,
            user_id=request.user_id,
            context=request.context
        )
        
        logger.info(f"Chat response generated for session: {session_id}")
        
        return ChatResponse(
            response=response_data["response"],
            session_id=response_data["session_id"],
            timestamp=response_data["timestamp"],
            agent_type=response_data["agent_type"],
            suggestions=response_data.get("suggestions", [])
        )
        
    except Exception as e:
        logger.error(f"Chat message error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "response": "Lo siento, hubo un error procesando tu mensaje. Por favor, inténtalo de nuevo.",
                "session_id": request.session_id or str(uuid.uuid4()),
                "timestamp": datetime.now().isoformat(),
                "agent_type": "error",
                "suggestions": ["¿Puedes repetir tu pregunta?", "¿Necesitas ayuda con contratos?"]
            }
        )

@router.post("/session")
async def create_chat_session(user_id: Optional[str] = None, agent_type: str = "contract"):
    """
    Crea una nueva sesión de chat con persistencia.
    """
    try:
        session_id = chat_manager.create_session(user_id, agent_type)
        
        return {
            "session_id": session_id,
            "agent_type": agent_type,
            "created_at": datetime.now().isoformat(),
            "message": "Sesión de chat creada exitosamente",
            "available_agents": chat_manager.get_available_agents()
        }
        
    except Exception as e:
        logger.error(f"Chat session creation error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "Error creando sesión de chat",
                "timestamp": datetime.now().isoformat()
            }
        )

@router.get("/session/{session_id}/history")
async def get_chat_history(session_id: str, limit: int = 50):
    """
    Obtiene el historial de una sesión de chat con persistencia.
    """
    try:
        history = chat_manager.get_session_history(session_id, limit)
        
        if not history:
            return JSONResponse(
                status_code=404,
                content={
                    "error": "Sesión no encontrada o sin historial",
                    "timestamp": datetime.now().isoformat()
                }
            )
        
        return {
            "session_id": session_id,
            "history": history,
            "message_count": len(history),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Chat history error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "Error obteniendo historial de chat",
                "timestamp": datetime.now().isoformat()
            }
        )

@router.put("/session/{session_id}/agent")
async def switch_chat_agent(session_id: str, agent_type: str):
    """
    Cambia el tipo de agente para una sesión de chat.
    """
    try:
        success = chat_manager.switch_agent(session_id, agent_type)
        
        if not success:
            return JSONResponse(
                status_code=400,
                content={
                    "error": "Tipo de agente no válido o sesión no encontrada",
                    "available_agents": [agent["id"] for agent in chat_manager.get_available_agents()],
                    "timestamp": datetime.now().isoformat()
                }
            )
        
        return {
            "session_id": session_id,
            "agent_type": agent_type,
            "message": f"Agente cambiado a {agent_type}",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Chat agent switch error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "Error cambiando agente de chat",
                "timestamp": datetime.now().isoformat()
            }
        )

@router.get("/agents")
async def get_available_agents():
    """
    Obtiene la lista de agentes de IA disponibles.
    """
    try:
        agents = chat_manager.get_available_agents()
        
        return {
            "agents": agents,
            "total": len(agents),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Get agents error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "Error obteniendo agentes disponibles",
                "timestamp": datetime.now().isoformat()
            }
        )

# WebSocket endpoint para chat en tiempo real
@router.websocket("/ws/{session_id}")
async def websocket_chat(websocket: WebSocket, session_id: str):
    """
    WebSocket para chat en tiempo real con persistencia.
    """
    connection_id = str(uuid.uuid4())
    
    try:
        await chat_manager.websocket_manager.connect(websocket, connection_id, session_id)
        
        while True:
            # Recibir mensaje del cliente
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Procesar mensaje
            response = await chat_manager.process_message(
                message=message_data.get("message", ""),
                session_id=session_id,
                user_id=message_data.get("user_id"),
                context=message_data.get("context", {})
            )
            
            # Enviar respuesta (ya se envía automáticamente en process_message)
            logger.info(f"WebSocket message processed for session {session_id}")
            
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {connection_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
    finally:
        chat_manager.websocket_manager.disconnect(connection_id, session_id)
