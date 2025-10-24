"""
Services Package
================

This package contains centralized services for GigChain.io
with proper dependency injection and configuration management.

Services:
- OpenAI Service: Centralized OpenAI client management
- Database Service: Database connection management (future)
- Cache Service: Caching service management (future)
"""

from .openai_service import (
    get_openai_service,
    get_openai_client,
    get_openai_config,
    is_openai_available,
    get_openai_status,
    OpenAIService,
    OpenAIConfig,
    MockOpenAIClient,
    OpenAIClientProtocol
)

__all__ = [
    "get_openai_service",
    "get_openai_client", 
    "get_openai_config",
    "is_openai_available",
    "get_openai_status",
    "OpenAIService",
    "OpenAIConfig",
    "MockOpenAIClient",
    "OpenAIClientProtocol"
]
