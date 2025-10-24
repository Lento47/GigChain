"""
Configuration package for GigChain.

This package provides centralized configuration management,
replacing scattered os.getenv() calls throughout the codebase.
"""

from .settings import (
    config,
    get_config,
    is_ai_agents_enabled,
    get_openai_api_key,
    get_secret_key,
    get_w_csap_secret_key,
    get_redis_url,
    get_cors_origins,
    get_environment,
    is_production,
    is_development,
    ConfigManager,
    Environment,
    DatabaseConfig,
    SecurityConfig,
    AIConfig,
    IPFSConfig,
    MonitoringConfig,
    Web3Config,
    ServerConfig
)

__all__ = [
    'config',
    'get_config',
    'is_ai_agents_enabled',
    'get_openai_api_key',
    'get_secret_key',
    'get_w_csap_secret_key',
    'get_redis_url',
    'get_cors_origins',
    'get_environment',
    'is_production',
    'is_development',
    'ConfigManager',
    'Environment',
    'DatabaseConfig',
    'SecurityConfig',
    'AIConfig',
    'IPFSConfig',
    'MonitoringConfig',
    'Web3Config',
    'ServerConfig'
]
