"""
GigChain.io - Enhanced AI Chat Module
Sistema de chat mejorado con persistencia, WebSockets y agentes especializados
"""

import json
import uuid
import asyncio
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Set, Union
from dataclasses import dataclass, asdict
import logging

# Import centralized OpenAI service
from services import get_openai_client, OpenAIClientProtocol, MockOpenAIClient
from fastapi import WebSocket, WebSocketDisconnect
import threading
import time

logger = logging.getLogger(__name__)

@dataclass
class ChatMessage:
    message_id: str
    session_id: str
    user_id: Optional[str]
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: datetime
    agent_type: str
    metadata: Dict[str, Any]

@dataclass
class ChatSession:
    session_id: str
    user_id: Optional[str]
    created_at: datetime
    last_activity: datetime
    agent_type: str
    context: Dict[str, Any]
    is_active: bool
    message_count: int

class ChatDatabase:
    """Manejo de persistencia de chat con SQLite"""
    
    def __init__(self, db_path: str = "chat_sessions.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Inicializa la base de datos SQLite"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Tabla de sesiones
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chat_sessions (
                session_id TEXT PRIMARY KEY,
                user_id TEXT,
                created_at TIMESTAMP,
                last_activity TIMESTAMP,
                agent_type TEXT,
                context TEXT,
                is_active BOOLEAN,
                message_count INTEGER
            )
        """)
        
        # Tabla de mensajes
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chat_messages (
                message_id TEXT PRIMARY KEY,
                session_id TEXT,
                user_id TEXT,
                role TEXT,
                content TEXT,
                timestamp TIMESTAMP,
                agent_type TEXT,
                metadata TEXT,
                FOREIGN KEY (session_id) REFERENCES chat_sessions (session_id)
            )
        """)
        
        conn.commit()
        conn.close()
    
    def create_session(self, session: ChatSession) -> bool:
        """Crea una nueva sesión de chat"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO chat_sessions 
                (session_id, user_id, created_at, last_activity, agent_type, context, is_active, message_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                session.session_id,
                session.user_id,
                session.created_at,
                session.last_activity,
                session.agent_type,
                json.dumps(session.context),
                session.is_active,
                session.message_count
            ))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"Error creating session: {str(e)}")
            return False
    
    def save_message(self, message: ChatMessage) -> bool:
        """Guarda un mensaje en la base de datos"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO chat_messages 
                (message_id, session_id, user_id, role, content, timestamp, agent_type, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                message.message_id,
                message.session_id,
                message.user_id,
                message.role,
                message.content,
                message.timestamp,
                message.agent_type,
                json.dumps(message.metadata)
            ))
            
            # Actualizar contador de mensajes y última actividad
            cursor.execute("""
                UPDATE chat_sessions 
                SET message_count = message_count + 1, last_activity = ?
                WHERE session_id = ?
            """, (message.timestamp, message.session_id))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"Error saving message: {str(e)}")
            return False
    
    def get_session_history(self, session_id: str, limit: int = 50) -> List[ChatMessage]:
        """Obtiene el historial de una sesión"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT message_id, session_id, user_id, role, content, timestamp, agent_type, metadata
                FROM chat_messages 
                WHERE session_id = ?
                ORDER BY timestamp ASC
                LIMIT ?
            """, (session_id, limit))
            
            rows = cursor.fetchall()
            conn.close()
            
            messages = []
            for row in rows:
                messages.append(ChatMessage(
                    message_id=row[0],
                    session_id=row[1],
                    user_id=row[2],
                    role=row[3],
                    content=row[4],
                    timestamp=datetime.fromisoformat(row[5]),
                    agent_type=row[6],
                    metadata=json.loads(row[7]) if row[7] else {}
                ))
            
            return messages
        except Exception as e:
            logger.error(f"Error getting session history: {str(e)}")
            return []
    
    def get_session(self, session_id: str) -> Optional[ChatSession]:
        """Obtiene una sesión por ID"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT session_id, user_id, created_at, last_activity, agent_type, context, is_active, message_count
                FROM chat_sessions 
                WHERE session_id = ?
            """, (session_id,))
            
            row = cursor.fetchone()
            conn.close()
            
            if row:
                return ChatSession(
                    session_id=row[0],
                    user_id=row[1],
                    created_at=datetime.fromisoformat(row[2]),
                    last_activity=datetime.fromisoformat(row[3]),
                    agent_type=row[4],
                    context=json.loads(row[5]) if row[5] else {},
                    is_active=bool(row[6]),
                    message_count=row[7]
                )
            return None
        except Exception as e:
            logger.error(f"Error getting session: {str(e)}")
            return None

class WebSocketManager:
    """Manejo de conexiones WebSocket para chat en tiempo real"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.session_connections: Dict[str, Set[str]] = {}  # session_id -> set of connection_ids
    
    async def connect(self, websocket: WebSocket, connection_id: str, session_id: str):
        """Acepta una nueva conexión WebSocket"""
        await websocket.accept()
        self.active_connections[connection_id] = websocket
        
        if session_id not in self.session_connections:
            self.session_connections[session_id] = set()
        self.session_connections[session_id].add(connection_id)
        
        logger.info(f"WebSocket connected: {connection_id} for session {session_id}")
    
    def disconnect(self, connection_id: str, session_id: str):
        """Desconecta una conexión WebSocket"""
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]
        
        if session_id in self.session_connections:
            self.session_connections[session_id].discard(connection_id)
            if not self.session_connections[session_id]:
                del self.session_connections[session_id]
        
        logger.info(f"WebSocket disconnected: {connection_id}")
    
    async def send_to_session(self, session_id: str, message: Dict[str, Any]):
        """Envía un mensaje a todas las conexiones de una sesión"""
        if session_id in self.session_connections:
            for connection_id in self.session_connections[session_id].copy():
                if connection_id in self.active_connections:
                    try:
                        await self.active_connections[connection_id].send_text(json.dumps(message))
                    except Exception as e:
                        logger.error(f"Error sending to {connection_id}: {str(e)}")
                        self.disconnect(connection_id, session_id)

class EnhancedChatAgent:
    """Agente de chat mejorado con persistencia y WebSockets"""
    
    def __init__(self, model: str = "gpt-4o-mini", temperature: float = 0.7, client: Optional[Union[OpenAIClientProtocol, MockOpenAIClient]] = None):
        """
        Initialize enhanced chat agent with proper dependency injection.
        
        Args:
            model: AI model to use
            temperature: Temperature for AI responses
            client: OpenAI client (injected dependency)
        """
        self.client = client or get_openai_client()
        self.model = model
        self.temperature = temperature
        self.db = ChatDatabase()
        self.websocket_manager = WebSocketManager()
    
    def create_session(self, user_id: Optional[str] = None, agent_type: str = "contract") -> str:
        """Crea una nueva sesión de chat"""
        session_id = str(uuid.uuid4())
        now = datetime.now()
        
        session = ChatSession(
            session_id=session_id,
            user_id=user_id,
            created_at=now,
            last_activity=now,
            agent_type=agent_type,
            context={},
            is_active=True,
            message_count=0
        )
        
        if self.db.create_session(session):
            logger.info(f"Created chat session: {session_id}")
            return session_id
        else:
            raise Exception("Failed to create chat session")
    
    def get_session_history(self, session_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Obtiene el historial de una sesión"""
        messages = self.db.get_session_history(session_id, limit)
        return [asdict(msg) for msg in messages]
    
    def switch_agent(self, session_id: str, agent_type: str) -> bool:
        """Cambia el tipo de agente para una sesión"""
        try:
            conn = sqlite3.connect(self.db.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE chat_sessions 
                SET agent_type = ?, last_activity = ?
                WHERE session_id = ?
            """, (agent_type, datetime.now(), session_id))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"Error switching agent: {str(e)}")
            return False
    
    def get_available_agents(self) -> List[Dict[str, Any]]:
        """Obtiene la lista de agentes disponibles"""
        return [
            {
                "id": "contract",
                "name": "Contract Assistant",
                "description": "Especializado en contratos y negociaciones",
                "icon": "📋"
            },
            {
                "id": "payment",
                "name": "Payment Assistant", 
                "description": "Ayuda con pagos y transacciones Web3",
                "icon": "💰"
            },
            {
                "id": "technical",
                "name": "Technical Assistant",
                "description": "Soporte técnico y desarrollo",
                "icon": "🔧"
            },
            {
                "id": "general",
                "name": "General Assistant",
                "description": "Asistente general de GigChain",
                "icon": "🤖"
            }
        ]
    
    async def process_message(self, message: str, session_id: str, user_id: Optional[str] = None, 
                            context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Procesa un mensaje y genera respuesta"""
        try:
            # Obtener sesión
            session = self.db.get_session(session_id)
            if not session:
                raise Exception("Session not found")
            
            # Guardar mensaje del usuario
            user_message = ChatMessage(
                message_id=str(uuid.uuid4()),
                session_id=session_id,
                user_id=user_id,
                role="user",
                content=message,
                timestamp=datetime.now(),
                agent_type=session.agent_type,
                metadata=context or {}
            )
            self.db.save_message(user_message)
            
            # Generar respuesta
            if self.client:
                response_data = await self._generate_ai_response(message, session, context)
            else:
                response_data = self._generate_fallback_response(message, session)
            
            # Guardar respuesta del asistente
            assistant_message = ChatMessage(
                message_id=str(uuid.uuid4()),
                session_id=session_id,
                user_id=user_id,
                role="assistant",
                content=response_data["response"],
                timestamp=datetime.now(),
                agent_type=session.agent_type,
                metadata=response_data.get("metadata", {})
            )
            self.db.save_message(assistant_message)
            
            # Enviar a WebSocket si hay conexiones activas
            if session_id in self.websocket_manager.session_connections:
                await self.websocket_manager.send_to_session(session_id, {
                    "type": "message",
                    "data": asdict(assistant_message)
                })
            
            return {
                "response": response_data["response"],
                "session_id": session_id,
                "timestamp": assistant_message.timestamp.isoformat(),
                "agent_type": session.agent_type,
                "suggestions": response_data.get("suggestions", []),
                "metadata": response_data.get("metadata", {})
            }
            
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")
            return {
                "response": "Lo siento, hubo un error procesando tu mensaje. Por favor, inténtalo de nuevo.",
                "session_id": session_id,
                "timestamp": datetime.now().isoformat(),
                "agent_type": "error",
                "suggestions": ["¿Puedes repetir tu pregunta?", "¿Necesitas ayuda con contratos?"],
                "metadata": {"error": str(e)}
            }
    
    async def _generate_ai_response(self, message: str, session: ChatSession, context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Genera respuesta usando OpenAI"""
        try:
            # Obtener historial reciente
            history = self.db.get_session_history(session.session_id, limit=10)
            
            # Construir prompt del sistema
            system_prompt = self._build_system_prompt(session.agent_type, context or {})
            
            # Construir mensajes
            messages = [{"role": "system", "content": system_prompt}]
            
            # Añadir historial
            for msg in history[-10:]:  # Últimos 10 mensajes
                messages.append({
                    "role": "user" if msg.role == "user" else "assistant",
                    "content": msg.content
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
            suggestions = self._generate_suggestions(message, ai_response, session.agent_type)
            
            return {
                "response": ai_response,
                "suggestions": suggestions,
                "metadata": {
                    "model": self.model,
                    "tokens_used": response.usage.total_tokens if hasattr(response, 'usage') else 0
                }
            }
            
        except Exception as e:
            logger.error(f"Error generating AI response: {str(e)}")
            return self._generate_fallback_response(message, session)
    
    def _generate_fallback_response(self, message: str, session: ChatSession) -> Dict[str, Any]:
        """Genera respuesta de fallback sin OpenAI"""
        message_lower = message.lower()
        
        if any(word in message_lower for word in ['contrato', 'contract', 'acuerdo']):
            response = "Para crear contratos en GigChain.io, necesitas configurar tu API key de OpenAI. Mientras tanto, puedo ayudarte con información básica sobre contratos freelancer."
            suggestions = [
                "¿Cómo configurar OpenAI API?",
                "¿Qué incluir en un contrato básico?",
                "¿Cómo establecer términos de pago?"
            ]
        elif any(word in message_lower for word in ['pago', 'payment', 'dinero']):
            response = "Los pagos en GigChain.io se manejan con USDC en la red Polygon. Necesitas configurar tu API key para obtener ayuda detallada sobre transacciones."
            suggestions = [
                "¿Cómo configurar OpenAI API?",
                "¿Qué es USDC?",
                "¿Cómo funciona el escrow?"
            ]
        else:
            response = "Hola! Soy tu asistente de GigChain.io. Para funcionalidad completa, necesitas configurar tu API key de OpenAI. ¿En qué puedo ayudarte?"
            suggestions = [
                "¿Cómo configurar OpenAI API?",
                "¿Qué es GigChain.io?",
                "¿Cómo crear mi primer contrato?"
            ]
        
        return {
            "response": response,
            "suggestions": suggestions,
            "metadata": {"fallback_mode": True}
        }
    
    def _build_system_prompt(self, agent_type: str, context: Dict[str, Any]) -> str:
        """Construye el prompt del sistema según el tipo de agente"""
        base_prompt = """Eres un asistente de IA para GigChain.io, una plataforma Web3 para freelancers.

Responde de manera:
- Profesional pero amigable
- Clara y concisa
- En español
- Con ejemplos prácticos cuando sea útil
- Siempre mencionando que no es consejo legal profesional
"""
        
        if agent_type == "contract":
            return base_prompt + """
Tu especialidad es:
1. Ayudar con la creación y negociación de contratos
2. Explicar términos legales de manera simple
3. Sugerir mejores prácticas para freelancers y clientes
4. Ayudar con disputas y resolución de conflictos
5. Proporcionar consejos sobre pagos y escrow
"""
        elif agent_type == "payment":
            return base_prompt + """
Tu especialidad es:
1. Ayudar con pagos y transacciones Web3
2. Explicar cómo funciona USDC y Polygon
3. Guiar en el uso de wallets y escrow
4. Resolver problemas de transacciones
5. Optimizar costos de gas y fees
"""
        elif agent_type == "technical":
            return base_prompt + """
Tu especialidad es:
1. Soporte técnico para desarrolladores
2. Ayuda con integración de APIs
3. Resolución de problemas de código
4. Guías de implementación
5. Mejores prácticas de desarrollo
"""
        else:  # general
            return base_prompt + """
Tu especialidad es:
1. Información general sobre GigChain.io
2. Guías de uso de la plataforma
3. Ayuda con configuración inicial
4. Preguntas frecuentes
5. Soporte general
"""
    
    def _generate_suggestions(self, message: str, response: str, agent_type: str) -> List[str]:
        """Genera sugerencias de seguimiento"""
        suggestions = []
        message_lower = message.lower()
        
        if agent_type == "contract":
            if any(word in message_lower for word in ['contrato', 'contract']):
                suggestions.extend([
                    "¿Cómo crear un contrato paso a paso?",
                    "¿Qué términos incluir en mi contrato?",
                    "¿Cómo negociar mejores condiciones?"
                ])
            elif any(word in message_lower for word in ['pago', 'payment']):
                suggestions.extend([
                    "¿Cómo establecer precios justos?",
                    "¿Qué es el escrow y cómo funciona?",
                    "¿Cómo manejar pagos en criptomonedas?"
                ])
            else:
                suggestions = [
                    "¿Cómo crear mi primer contrato?",
                    "¿Qué términos son importantes?",
                    "¿Cómo evitar disputas?"
                ]
        
        elif agent_type == "payment":
            suggestions = [
                "¿Cómo configurar mi wallet?",
                "¿Qué es USDC?",
                "¿Cómo minimizar fees de gas?"
            ]
        
        elif agent_type == "technical":
            suggestions = [
                "¿Cómo integrar la API?",
                "¿Dónde encontrar documentación?",
                "¿Cómo reportar un bug?"
            ]
        
        else:  # general
            suggestions = [
                "¿Cómo empezar en GigChain?",
                "¿Qué es Web3?",
                "¿Cómo configurar mi perfil?"
            ]
        
        return suggestions[:3]  # Máximo 3 sugerencias

# Instancia global del chat manager
chat_manager = EnhancedChatAgent()
