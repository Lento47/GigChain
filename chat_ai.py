"""
GigChain.io - AI Chat Module
Sistema de chat inteligente con agentes especializados
"""

import json
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass
import logging

# Import centralized OpenAI service
from services import get_openai_client, OpenAIClientProtocol, MockOpenAIClient

logger = logging.getLogger(__name__)

@dataclass
class ChatSession:
    session_id: str
    user_id: Optional[str]
    created_at: datetime
    messages: List[Dict[str, Any]]
    context: Dict[str, Any]
    agent_type: str

class ChatAgent:
    """Agente base para chat con IA"""
    
    def __init__(self, model: str = "gpt-4o-mini", temperature: float = 0.7, client: Optional[Union[OpenAIClientProtocol, MockOpenAIClient]] = None):
        """
        Initialize chat agent with proper dependency injection.
        
        Args:
            model: AI model to use
            temperature: Temperature for AI responses
            client: OpenAI client (injected dependency)
        """
        self.client = client or get_openai_client()
        self.model = model
        self.temperature = temperature
    
    def generate_response(self, message: str, context: Dict[str, Any], session_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Genera respuesta del agente"""
        try:
            # Construir contexto del sistema
            system_prompt = self._build_system_prompt(context)
            
            # Construir historial de mensajes
            messages = [{"role": "system", "content": system_prompt}]
            
            # Añadir historial de sesión (últimos 10 mensajes)
            recent_history = session_history[-10:] if session_history else []
            for msg in recent_history:
                messages.append({
                    "role": "user" if msg["role"] == "user" else "assistant",
                    "content": msg["content"]
                })
            
            # Añadir mensaje actual
            messages.append({"role": "user", "content": message})
            
            # Generar respuesta
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=self.temperature,
                max_tokens=1000
            )
            
            ai_response = response.choices[0].message.content
            
            # Generar sugerencias
            suggestions = self._generate_suggestions(message, ai_response, context)
            
            return {
                "response": ai_response,
                "suggestions": suggestions,
                "agent_type": self.__class__.__name__
            }
            
        except Exception as e:
            logger.error(f"Error generating chat response: {str(e)}")
            return {
                "response": "Lo siento, hubo un error procesando tu mensaje. Por favor, inténtalo de nuevo.",
                "suggestions": ["¿Puedes repetir tu pregunta?", "¿Necesitas ayuda con contratos?"],
                "agent_type": self.__class__.__name__
            }
    
    def _build_system_prompt(self, context: Dict[str, Any]) -> str:
        """Construye el prompt del sistema (implementar en subclases)"""
        return "Eres un asistente de IA para GigChain.io"
    
    def _generate_suggestions(self, message: str, response: str, context: Dict[str, Any]) -> List[str]:
        """Genera sugerencias de seguimiento"""
        return [
            "¿Necesitas ayuda con contratos?",
            "¿Quieres crear una plantilla?",
            "¿Tienes preguntas sobre pagos?"
        ]

class ContractAssistantAgent(ChatAgent):
    """Agente especializado en contratos y negociaciones"""
    
    def _build_system_prompt(self, context: Dict[str, Any]) -> str:
        return """Eres un asistente especializado en contratos y negociaciones para GigChain.io, una plataforma Web3 para freelancers.

Tu rol es:
1. Ayudar con la creación y negociación de contratos
2. Explicar términos legales de manera simple
3. Sugerir mejores prácticas para freelancers y clientes
4. Ayudar con disputas y resolución de conflictos
5. Proporcionar consejos sobre pagos y escrow

Contexto del usuario:
- Plataforma: GigChain.io (Web3 freelancing)
- Tecnología: Blockchain, smart contracts, criptomonedas
- Usuarios: Freelancers y clientes

Responde de manera:
- Profesional pero amigable
- Clara y concisa
- En español
- Con ejemplos prácticos cuando sea útil
- Siempre mencionando que no es consejo legal profesional

Si el usuario pregunta sobre temas no relacionados con contratos o freelancing, redirige cortésmente hacia temas relevantes."""

    def _generate_suggestions(self, message: str, response: str, context: Dict[str, Any]) -> List[str]:
        suggestions = []
        
        # Sugerencias basadas en el contenido del mensaje
        message_lower = message.lower()
        
        if any(word in message_lower for word in ['contrato', 'contract', 'acuerdo']):
            suggestions.extend([
                "¿Cómo crear un contrato paso a paso?",
                "¿Qué términos incluir en mi contrato?",
                "¿Cómo negociar mejores condiciones?"
            ])
        
        if any(word in message_lower for word in ['pago', 'payment', 'dinero', 'precio']):
            suggestions.extend([
                "¿Cómo establecer precios justos?",
                "¿Qué es el escrow y cómo funciona?",
                "¿Cómo manejar pagos en criptomonedas?"
            ])
        
        if any(word in message_lower for word in ['disputa', 'problema', 'conflicto']):
            suggestions.extend([
                "¿Cómo resolver disputas amigablemente?",
                "¿Cuándo usar mediación?",
                "¿Cómo prevenir conflictos futuros?"
            ])
        
        # Sugerencias por defecto si no hay coincidencias específicas
        if not suggestions:
            suggestions = [
                "¿Cómo crear mi primer contrato?",
                "¿Qué debo incluir en un contrato de freelancing?",
                "¿Cómo proteger mis pagos?"
            ]
        
        return suggestions[:3]  # Máximo 3 sugerencias

class TechnicalSupportAgent(ChatAgent):
    """Agente especializado en soporte técnico"""
    
    def _build_system_prompt(self, context: Dict[str, Any]) -> str:
        return """Eres un asistente técnico para GigChain.io, especializado en:

1. Uso de la plataforma y sus funciones
2. Integración con wallets de criptomonedas
3. Smart contracts y blockchain
4. Problemas técnicos y bugs
5. Guías paso a paso

Contexto:
- Plataforma: GigChain.io (Web3 freelancing)
- Tecnologías: React, FastAPI, Thirdweb, OpenAI
- Blockchain: Polygon, Ethereum

Responde de manera:
- Técnica pero accesible
- Con pasos claros y específicos
- Incluyendo ejemplos de código cuando sea útil
- En español
- Sugiriendo recursos adicionales cuando sea apropiado

Si el problema es muy complejo, sugiere contactar soporte técnico."""

    def _generate_suggestions(self, message: str, response: str, context: Dict[str, Any]) -> List[str]:
        return [
            "¿Cómo conectar mi wallet?",
            "¿Qué hacer si no puedo generar un contrato?",
            "¿Cómo usar las plantillas?",
            "¿Problemas con pagos?"
        ]

class BusinessAdvisorAgent(ChatAgent):
    """Agente especializado en consejos de negocio"""
    
    def _build_system_prompt(self, context: Dict[str, Any]) -> str:
        return """Eres un consultor de negocios especializado en freelancing y Web3 para GigChain.io.

Tu expertise incluye:
1. Estrategias de pricing y valoración
2. Marketing personal para freelancers
3. Gestión de clientes y relaciones
4. Escalabilidad de negocios freelance
5. Tendencias del mercado Web3 y freelancing
6. Networking y construcción de marca personal

Contexto:
- Mercado: Freelancing Web3 y tradicional
- Usuarios: Freelancers independientes y equipos
- Tecnología: Blockchain, smart contracts, DAOs

Responde de manera:
- Estratégica y orientada a resultados
- Con datos y tendencias actuales
- Incluyendo ejemplos de casos de éxito
- En español
- Sugiriendo acciones específicas

Siempre enfócate en el crecimiento sostenible del negocio freelance."""

    def _generate_suggestions(self, message: str, response: str, context: Dict[str, Any]) -> List[str]:
        return [
            "¿Cómo aumentar mis tarifas?",
            "¿Dónde encontrar mejores clientes?",
            "¿Cómo construir mi marca personal?",
            "¿Qué habilidades aprender para Web3?"
        ]

class ChatManager:
    """Gestor principal del sistema de chat"""
    
    def __init__(self):
        self.agents = {
            "contract": ContractAssistantAgent(),
            "technical": TechnicalSupportAgent(),
            "business": BusinessAdvisorAgent()
        }
        self.sessions: Dict[str, ChatSession] = {}
    
    def create_session(self, user_id: Optional[str] = None, agent_type: str = "contract") -> str:
        """Crea una nueva sesión de chat"""
        session_id = str(uuid.uuid4())
        
        session = ChatSession(
            session_id=session_id,
            user_id=user_id,
            created_at=datetime.now(),
            messages=[],
            context={},
            agent_type=agent_type
        )
        
        self.sessions[session_id] = session
        logger.info(f"Created chat session: {session_id} for user: {user_id}")
        
        return session_id
    
    def get_session(self, session_id: str) -> Optional[ChatSession]:
        """Obtiene una sesión de chat"""
        return self.sessions.get(session_id)
    
    def send_message(self, message: str, session_id: str, user_id: Optional[str] = None, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Envía un mensaje y obtiene respuesta del agente"""
        
        # Obtener o crear sesión
        session = self.get_session(session_id)
        if not session:
            session_id = self.create_session(user_id)
            session = self.get_session(session_id)
        
        # Actualizar contexto si se proporciona
        if context:
            session.context.update(context)
        
        # Obtener agente apropiado
        agent = self.agents.get(session.agent_type, self.agents["contract"])
        
        # Generar respuesta
        response_data = agent.generate_response(
            message=message,
            context=session.context,
            session_history=session.messages
        )
        
        # Guardar mensaje del usuario
        user_message = {
            "role": "user",
            "content": message,
            "timestamp": datetime.now().isoformat()
        }
        session.messages.append(user_message)
        
        # Guardar respuesta del agente
        ai_message = {
            "role": "assistant",
            "content": response_data["response"],
            "timestamp": datetime.now().isoformat(),
            "agent_type": response_data["agent_type"]
        }
        session.messages.append(ai_message)
        
        # Actualizar sesión
        session.user_id = user_id or session.user_id
        
        return {
            "response": response_data["response"],
            "session_id": session_id,
            "timestamp": datetime.now().isoformat(),
            "agent_type": response_data["agent_type"],
            "suggestions": response_data["suggestions"]
        }
    
    def get_session_history(self, session_id: str) -> List[Dict[str, Any]]:
        """Obtiene el historial de una sesión"""
        session = self.get_session(session_id)
        if session:
            return session.messages
        return []
    
    def switch_agent(self, session_id: str, agent_type: str) -> bool:
        """Cambia el tipo de agente para una sesión"""
        session = self.get_session(session_id)
        if session and agent_type in self.agents:
            session.agent_type = agent_type
            logger.info(f"Switched session {session_id} to agent: {agent_type}")
            return True
        return False
    
    def get_available_agents(self) -> List[Dict[str, str]]:
        """Obtiene lista de agentes disponibles"""
        return [
            {
                "id": "contract",
                "name": "Asistente de Contratos",
                "description": "Ayuda con contratos, negociaciones y términos legales"
            },
            {
                "id": "technical",
                "name": "Soporte Técnico",
                "description": "Resuelve problemas técnicos y guías de uso"
            },
            {
                "id": "business",
                "name": "Consultor de Negocios",
                "description": "Consejos estratégicos para freelancers"
            }
        ]

# Instancia global del gestor de chat
chat_manager = ChatManager()

def get_chat_response(message: str, session_id: Optional[str] = None, user_id: Optional[str] = None, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Función principal para obtener respuestas del chat"""
    return chat_manager.send_message(message, session_id or "", user_id, context)
