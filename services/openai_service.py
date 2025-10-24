"""
OpenAI Service - Centralized OpenAI Client Management
====================================================

This module provides a centralized service for managing OpenAI clients
with proper dependency injection and configuration management.

Features:
- Singleton pattern for client management
- Proper configuration injection
- Mock client support for testing
- Error handling and fallback mechanisms
- Type safety with protocols
"""

from __future__ import annotations
import logging
from typing import Optional, Union, Protocol, Any
from dataclasses import dataclass
from openai import OpenAI
import threading

# Import centralized configuration
from config import get_config

logger = logging.getLogger(__name__)


class OpenAIClientProtocol(Protocol):
    """Protocol for OpenAI-compatible clients."""
    
    def chat(self) -> Any:
        """Chat completions interface."""
        ...


@dataclass
class OpenAIConfig:
    """OpenAI configuration container."""
    api_key: str
    model: str = "gpt-4o-mini"
    temperature: float = 0.1
    max_tokens: int = 4000
    timeout: int = 30


class MockOpenAIClient:
    """Mock OpenAI client for testing and fallback scenarios."""
    
    def __init__(self, deterministic_responses: Optional[dict] = None):
        self.deterministic_responses = deterministic_responses or {}
        self._call_count = 0
    
    def chat(self):
        return MockChatCompletions(self)
    
    def get_deterministic_response(self, prompt: str) -> dict:
        """Get deterministic response based on prompt content."""
        self._call_count += 1
        
        # Check for specific prompt patterns
        if "NegotiationAgent" in prompt:
            return {
                "counter_offer": 5500.0,
                "milestones": [
                    {
                        "desc": "Diseño y prototipo",
                        "amount": 1650.0,
                        "deadline": "2025-01-15",
                        "percentage": 30.0
                    },
                    {
                        "desc": "Desarrollo core",
                        "amount": 2200.0,
                        "deadline": "2025-01-30",
                        "percentage": 40.0
                    },
                    {
                        "desc": "Testing y deploy",
                        "amount": 1650.0,
                        "deadline": "2025-02-15",
                        "percentage": 30.0
                    }
                ],
                "risks": ["Complejidad técnica", "Timeline ajustado"],
                "mitigation_strategies": ["Reuniones semanales", "Testing continuo"],
                "rationale": "Aumento del 10% por complejidad media",
                "confidence_score": 0.85,
                "negotiation_tips": ["Destacar experiencia", "Mostrar portfolio"]
            }
        elif "ContractGeneratorAgent" in prompt:
            return {
                "contract_id": f"gig_2025-01-02T12:00:00_{self._call_count}",
                "full_terms": "Contrato de desarrollo de app móvil con términos estándar...",
                "escrow_params": {
                    "token": "USDC",
                    "network": "Polygon",
                    "total_amount": 5500.0,
                    "milestones": [
                        {
                            "id": "m1",
                            "description": "Diseño y prototipo",
                            "amount": 1650.0,
                            "deadline": "2025-01-15",
                            "percentage": 30.0
                        }
                    ]
                },
                "solidity_stubs": {
                    "contract_name": "GigContract",
                    "functions": ["createContract", "releaseMilestone", "disputeResolution"],
                    "events": ["ContractCreated", "MilestoneReleased"],
                    "modifiers": ["onlyParties", "milestoneCompleted"]
                },
                "clauses": [
                    {
                        "type": "payment",
                        "title": "Escrow Terms",
                        "content": "Fondos en USDC bloqueados hasta completar milestones",
                        "importance": "high"
                    }
                ],
                "compliance": {
                    "mica_compliant": True,
                    "gdpr_compliant": True,
                    "legal_notes": ["Cumple regulaciones MiCA"]
                },
                "deployment_ready": True,
                "estimated_gas": 150000
            }
        elif "QualityAgent" in prompt:
            return {
                "quality_score": 85.5,
                "technical_compliance": 90.0,
                "code_quality": "good",
                "documentation_quality": "excellent",
                "testing_coverage": 75.0,
                "best_practices_score": 80.0,
                "improvement_suggestions": ["Añadir más tests unitarios"],
                "approval_recommendation": "approve",
                "detailed_feedback": "Trabajo de buena calidad con documentación excelente"
            }
        elif "PaymentAgent" in prompt:
            return {
                "payment_id": f"pay_2025-01-02T12:00:00_{self._call_count}",
                "transaction_status": "pending",
                "amount_usdc": 1000.0,
                "fees": {
                    "platform_fee": 50.0,
                    "gas_fee": 5.0,
                    "total_fees": 55.0
                },
                "wallet_validation": {
                    "sender_valid": True,
                    "receiver_valid": True,
                    "sufficient_balance": True
                },
                "milestone_release": {
                    "milestone_id": "m1",
                    "amount_to_release": 1000.0,
                    "release_conditions_met": True
                },
                "transaction_hash": f"0xabc123{self._call_count:06d}",
                "estimated_completion": "2025-01-02T12:05:00Z"
            }
        elif "DisputeResolverAgent" in prompt:
            return {
                "dispute_id": f"dispute_2025-01-02T12:00:00_{self._call_count}",
                "compliance_percentage": 85.0,
                "resolution": "mediate",
                "reasoning": "Evidencia mixta, se recomienda mediación",
                "evidence_analysis": {
                    "work_quality": "good",
                    "timeline_compliance": "delayed",
                    "communication": "excellent"
                },
                "recommended_action": "Reunión de mediación con ambas partes",
                "oracle_query": "Verificar calidad del trabajo entregado",
                "confidence_score": 0.75,
                "next_steps": ["Programar mediación", "Revisar evidencia adicional"]
            }
        else:
            # Generic fallback response
            return {
                "message": "Mock response generated",
                "call_count": self._call_count,
                "prompt_preview": prompt[:100] + "..." if len(prompt) > 100 else prompt
            }


class MockChatCompletions:
    """Mock chat completions interface."""
    
    def __init__(self, client: MockOpenAIClient):
        self.client = client
    
    def create(self, **kwargs):
        """Mock create method that returns deterministic responses."""
        import json
        
        prompt = ""
        if "messages" in kwargs:
            for msg in kwargs["messages"]:
                if isinstance(msg, dict) and "content" in msg:
                    prompt += msg["content"] + " "
        
        response_data = self.client.get_deterministic_response(prompt)
        
        class MockResponse:
            def __init__(self, content: str):
                self.choices = [MockChoice(content)]
                self.usage = MockUsage()
        
        class MockChoice:
            def __init__(self, content: str):
                self.message = MockMessage(content)
        
        class MockMessage:
            def __init__(self, content: str):
                self.content = content
        
        class MockUsage:
            def __init__(self):
                self.total_tokens = 150
        
        return MockResponse(json.dumps(response_data))


class OpenAIService:
    """
    Centralized OpenAI service with proper dependency injection.
    
    This service manages OpenAI client instances and provides a clean
    interface for dependency injection throughout the application.
    """
    
    _instance: Optional[OpenAIService] = None
    _lock = threading.Lock()
    
    def __new__(cls) -> OpenAIService:
        """Singleton pattern implementation."""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize the OpenAI service."""
        if hasattr(self, '_initialized'):
            return
        
        self._config = get_config()
        self._client: Optional[Union[OpenAI, MockOpenAIClient]] = None
        self._mock_client: Optional[MockOpenAIClient] = None
        self._initialized = True
        
        logger.info("OpenAI Service initialized")
    
    def get_client(self, force_mock: bool = False) -> Union[OpenAI, MockOpenAIClient]:
        """
        Get OpenAI client with proper configuration injection.
        
        Args:
            force_mock: Force return of mock client for testing
            
        Returns:
            OpenAI client or MockOpenAIClient
        """
        if force_mock:
            if self._mock_client is None:
                self._mock_client = MockOpenAIClient()
            return self._mock_client
        
        if self._client is None:
            self._client = self._create_client()
        
        return self._client
    
    def _create_client(self) -> Union[OpenAI, MockOpenAIClient]:
        """
        Create OpenAI client with proper configuration.
        
        Returns:
            OpenAI client or MockOpenAIClient as fallback
        """
        try:
            # Check if AI is enabled and API key is available
            if not self._config.is_ai_enabled():
                logger.info("AI agents disabled, using mock client")
                return MockOpenAIClient()
            
            # Create OpenAI client with configuration
            client = OpenAI(
                api_key=self._config.ai.openai_api_key,
                timeout=self._config.ai.max_tokens  # Use max_tokens as timeout placeholder
            )
            
            logger.info("OpenAI client created successfully")
            return client
            
        except Exception as e:
            logger.warning(f"Failed to create OpenAI client: {e}. Using mock client.")
            return MockOpenAIClient()
    
    def get_config(self) -> OpenAIConfig:
        """
        Get OpenAI configuration.
        
        Returns:
            OpenAIConfig object with current settings
        """
        return OpenAIConfig(
            api_key=self._config.ai.openai_api_key,
            model=self._config.ai.model,
            temperature=self._config.ai.temperature,
            max_tokens=self._config.ai.max_tokens
        )
    
    def is_available(self) -> bool:
        """
        Check if OpenAI service is available.
        
        Returns:
            True if OpenAI is properly configured and available
        """
        return self._config.is_ai_enabled() and bool(self._config.ai.openai_api_key)
    
    def reset_client(self):
        """Reset the client (useful for testing)."""
        self._client = None
        self._mock_client = None
        logger.info("OpenAI client reset")
    
    def get_status(self) -> dict:
        """
        Get service status information.
        
        Returns:
            Dictionary with service status
        """
        return {
            "available": self.is_available(),
            "client_type": "OpenAI" if isinstance(self._client, OpenAI) else "MockOpenAI",
            "config": {
                "model": self._config.ai.model,
                "temperature": self._config.ai.temperature,
                "max_tokens": self._config.ai.max_tokens
            }
        }


# Global service instance
_openai_service: Optional[OpenAIService] = None


def get_openai_service() -> OpenAIService:
    """
    Get the global OpenAI service instance.
    
    Returns:
        OpenAIService singleton instance
    """
    global _openai_service
    if _openai_service is None:
        _openai_service = OpenAIService()
    return _openai_service


def get_openai_client(force_mock: bool = False) -> Union[OpenAI, MockOpenAIClient]:
    """
    Get OpenAI client from the service.
    
    Args:
        force_mock: Force return of mock client for testing
        
    Returns:
        OpenAI client or MockOpenAIClient
    """
    return get_openai_service().get_client(force_mock=force_mock)


def get_openai_config() -> OpenAIConfig:
    """
    Get OpenAI configuration from the service.
    
    Returns:
        OpenAIConfig object with current settings
    """
    return get_openai_service().get_config()


def is_openai_available() -> bool:
    """
    Check if OpenAI service is available.
    
    Returns:
        True if OpenAI is properly configured and available
    """
    return get_openai_service().is_available()


def get_openai_status() -> dict:
    """
    Get OpenAI service status.
    
    Returns:
        Dictionary with service status information
    """
    return get_openai_service().get_status()
