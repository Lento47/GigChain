"""
Centralized Configuration Management for GigChain
================================================

This module provides a centralized configuration system that replaces
scattered os.getenv() calls throughout the codebase.

Features:
- Type validation and conversion
- Environment-specific defaults
- Configuration validation on startup
- Centralized access to all settings
- Support for required vs optional settings
"""

import os
import logging
from typing import Any, Dict, List, Optional, Union
from dataclasses import dataclass, field
from enum import Enum
import json
from pathlib import Path

logger = logging.getLogger(__name__)


class Environment(Enum):
    """Environment types"""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    TESTING = "testing"


@dataclass
class DatabaseConfig:
    """Database configuration"""
    type: str = "sqlite"
    url: Optional[str] = None
    host: Optional[str] = None
    port: int = 5432
    user: Optional[str] = None
    password: Optional[str] = None
    name: Optional[str] = None
    pool_size: int = 5


@dataclass
class SecurityConfig:
    """Security configuration"""
    secret_key: str = ""
    w_csap_secret_key: str = ""
    redis_url: str = "redis://localhost:6379/0"
    require_https: bool = False
    require_tls_13: bool = False
    dpop_enabled: bool = False
    global_rate_limit_enabled: bool = True
    max_failed_attempts: int = 5
    lockout_duration: int = 900
    challenge_ttl: int = 300
    access_token_ttl: int = 900
    refresh_ttl: int = 86400
    refresh_token_rotation: bool = True
    use_jwt_tokens: bool = False
    jwt_algorithm: str = "ES256"
    token_issuer: str = ""
    token_audience: str = ""
    session_binding_enabled: bool = False
    audit_logging_enabled: bool = True
    revocation_enabled: bool = True
    revocation_cache_type: str = "redis"
    risk_scoring_enabled: bool = True
    risk_score_threshold_block: int = 70
    risk_score_threshold_challenge: int = 50
    step_up_enabled: bool = True
    step_up_grace_period: int = 300
    step_up_high_value_threshold: float = 10000.0
    anomaly_detection_enabled: bool = True
    use_kms: bool = False
    kms_provider: str = "aws"
    kms_key_id: str = ""
    kms_region: str = ""
    key_rotation_days: int = 90
    db_path: str = "data/w_csap.db"
    allowed_origins: List[str] = field(default_factory=list)
    analytics_enabled: bool = True
    cleanup_enabled: bool = True
    cleanup_interval_seconds: int = 3600
    app_name: str = "GigChain.io"
    protocol_version: str = "3.0.0"
    max_active_sessions_per_wallet: int = 5


@dataclass
class AIConfig:
    """AI and OpenAI configuration"""
    openai_api_key: str = ""
    ai_agents_enabled: bool = True
    model: str = "gpt-4o-mini"
    temperature: float = 0.1
    max_tokens: int = 4000


@dataclass
class IPFSConfig:
    """IPFS storage configuration"""
    mode: str = "local"
    api_url: str = "/ip4/127.0.0.1/tcp/5001"
    gateway_url: str = "http://127.0.0.1:8080"
    timeout: int = 30
    pinata_api_key: str = ""
    pinata_secret_key: str = ""
    infura_project_id: str = ""
    infura_project_secret: str = ""
    nft_storage_api_key: str = ""
    auto_ipfs_storage: bool = False
    auto_pin_contracts: bool = True


@dataclass
class MonitoringConfig:
    """Security monitoring and SIEM configuration"""
    splunk_hec_url: str = ""
    splunk_hec_token: str = ""
    elastic_url: str = ""
    elastic_index: str = "gigchain-security"
    elastic_api_key: str = ""
    elastic_username: str = ""
    elastic_password: str = ""
    datadog_api_key: str = ""
    datadog_site: str = "datadoghq.com"


@dataclass
class Web3Config:
    """Web3 and blockchain configuration"""
    web3_provider_url: str = ""
    reputation_nft_address: str = ""


@dataclass
class ServerConfig:
    """Server configuration"""
    port: int = 5000
    debug: bool = False
    environment: Environment = Environment.DEVELOPMENT
    cors_origins: List[str] = field(default_factory=list)
    log_level: str = "INFO"
    log_scrub_mode: str = "strict"
    log_scrub_enabled: bool = True


class ConfigManager:
    """
    Centralized configuration manager for GigChain.
    
    This class handles all environment variable access and provides
    type-safe configuration access throughout the application.
    """
    
    def __init__(self):
        self._config_loaded = False
        self._validation_errors: List[str] = []
        
        # Configuration sections
        self.database = DatabaseConfig()
        self.security = SecurityConfig()
        self.ai = AIConfig()
        self.ipfs = IPFSConfig()
        self.monitoring = MonitoringConfig()
        self.web3 = Web3Config()
        self.server = ServerConfig()
        
        # Load configuration
        self._load_configuration()
    
    def _get_env_var(
        self, 
        key: str, 
        default: Any = None, 
        required: bool = False,
        var_type: type = str
    ) -> Any:
        """
        Get environment variable with type conversion and validation.
        
        Args:
            key: Environment variable name
            default: Default value if not set
            required: Whether this variable is required
            var_type: Type to convert the value to
            
        Returns:
            Converted environment variable value or default
            
        Raises:
            ValueError: If required variable is missing or conversion fails
        """
        value = os.getenv(key, default)
        
        if required and (value is None or value == ""):
            error_msg = f"Required environment variable '{key}' is not set"
            self._validation_errors.append(error_msg)
            # For testing, provide a default instead of raising immediately
            if os.getenv('TESTING_MODE', '').lower() == 'true':
                logger.warning(f"TESTING MODE: Using default for required variable '{key}'")
                return default or f"test-{key.lower().replace('_', '-')}"
            raise ValueError(error_msg)
        
        if value is None:
            return default
            
        # Type conversion
        try:
            if var_type == bool:
                if isinstance(value, str):
                    return value.lower() in ('true', '1', 'yes', 'on')
                return bool(value)
            elif var_type == int:
                return int(value)
            elif var_type == float:
                return float(value)
            elif var_type == list:
                if isinstance(value, str):
                    return [item.strip() for item in value.split(',') if item.strip()]
                return value
            else:
                return str(value)
        except (ValueError, TypeError) as e:
            error_msg = f"Invalid value for environment variable '{key}': {value} ({e})"
            self._validation_errors.append(error_msg)
            raise ValueError(error_msg)
    
    def _load_configuration(self):
        """Load all configuration from environment variables."""
        try:
            # Server configuration
            self.server.port = self._get_env_var('PORT', 5000, var_type=int)
            self.server.debug = self._get_env_var('DEBUG', 'False', var_type=bool)
            env_str = self._get_env_var('ENVIRONMENT', 'development')
            self.server.environment = Environment(env_str)
            self.server.cors_origins = self._get_env_var('CORS_ORIGINS', '', var_type=list)
            if not self.server.cors_origins:
                # Fallback to legacy ALLOWED_ORIGINS
                self.server.cors_origins = self._get_env_var('ALLOWED_ORIGINS', '', var_type=list)
            self.server.log_level = self._get_env_var('LOG_LEVEL', 'INFO')
            self.server.log_scrub_mode = self._get_env_var('LOG_SCRUB', 'strict')
            self.server.log_scrub_enabled = self._get_env_var('LOG_SCRUB_ENABLED', 'true', var_type=bool)
            
            # Database configuration
            self.database.type = self._get_env_var('DATABASE_TYPE', 'sqlite')
            self.database.url = self._get_env_var('DATABASE_URL')
            if not self.database.url:
                self.database.url = self._get_env_var('POSTGRES_URL')
            self.database.host = self._get_env_var('DB_HOST')
            self.database.port = self._get_env_var('DB_PORT', 5432, var_type=int)
            self.database.user = self._get_env_var('DB_USER')
            self.database.password = self._get_env_var('DB_PASSWORD')
            self.database.name = self._get_env_var('DB_NAME')
            self.database.pool_size = self._get_env_var('W_CSAP_DB_POOL_SIZE', 5, var_type=int)
            
            # Security configuration
            self.security.secret_key = self._get_env_var('SECRET_KEY', required=True)
            self.security.w_csap_secret_key = self._get_env_var('W_CSAP_SECRET_KEY', required=True)
            self.security.redis_url = self._get_env_var('W_CSAP_REDIS_URL', 'redis://localhost:6379/0')
            self.security.require_https = self._get_env_var('W_CSAP_REQUIRE_HTTPS', 'false', var_type=bool)
            self.security.require_tls_13 = self._get_env_var('W_CSAP_REQUIRE_TLS_13', 'false', var_type=bool)
            self.security.dpop_enabled = self._get_env_var('W_CSAP_DPOP_ENABLED', 'false', var_type=bool)
            self.security.global_rate_limit_enabled = self._get_env_var('W_CSAP_GLOBAL_RATE_LIMIT_ENABLED', 'true', var_type=bool)
            self.security.max_failed_attempts = self._get_env_var('W_CSAP_MAX_FAILED_ATTEMPTS', 5, var_type=int)
            self.security.lockout_duration = self._get_env_var('W_CSAP_LOCKOUT_DURATION', 900, var_type=int)
            self.security.challenge_ttl = self._get_env_var('W_CSAP_CHALLENGE_TTL', 300, var_type=int)
            self.security.access_token_ttl = self._get_env_var('W_CSAP_ACCESS_TOKEN_TTL', 900, var_type=int)
            self.security.refresh_ttl = self._get_env_var('W_CSAP_REFRESH_TTL', 86400, var_type=int)
            self.security.refresh_token_rotation = self._get_env_var('W_CSAP_REFRESH_TOKEN_ROTATION', 'true', var_type=bool)
            self.security.use_jwt_tokens = self._get_env_var('W_CSAP_USE_JWT_TOKENS', 'false', var_type=bool)
            self.security.jwt_algorithm = self._get_env_var('W_CSAP_JWT_ALGORITHM', 'ES256')
            self.security.token_issuer = self._get_env_var('W_CSAP_TOKEN_ISSUER', '')
            self.security.token_audience = self._get_env_var('W_CSAP_TOKEN_AUDIENCE', '')
            self.security.session_binding_enabled = self._get_env_var('W_CSAP_SESSION_BINDING_ENABLED', 'false', var_type=bool)
            self.security.audit_logging_enabled = self._get_env_var('W_CSAP_AUDIT_LOGGING_ENABLED', 'true', var_type=bool)
            self.security.revocation_enabled = self._get_env_var('W_CSAP_REVOCATION_ENABLED', 'true', var_type=bool)
            self.security.revocation_cache_type = self._get_env_var('W_CSAP_REVOCATION_CACHE_TYPE', 'redis')
            self.security.risk_scoring_enabled = self._get_env_var('W_CSAP_RISK_SCORING_ENABLED', 'true', var_type=bool)
            self.security.risk_score_threshold_block = self._get_env_var('W_CSAP_RISK_SCORE_THRESHOLD_BLOCK', 70, var_type=int)
            self.security.risk_score_threshold_challenge = self._get_env_var('W_CSAP_RISK_SCORE_THRESHOLD_CHALLENGE', 50, var_type=int)
            self.security.step_up_enabled = self._get_env_var('W_CSAP_STEP_UP_ENABLED', 'true', var_type=bool)
            self.security.step_up_grace_period = self._get_env_var('W_CSAP_STEP_UP_GRACE_PERIOD', 300, var_type=int)
            self.security.step_up_high_value_threshold = self._get_env_var('W_CSAP_STEP_UP_HIGH_VALUE_THRESHOLD', 10000.0, var_type=float)
            self.security.anomaly_detection_enabled = self._get_env_var('W_CSAP_ANOMALY_DETECTION_ENABLED', 'true', var_type=bool)
            self.security.use_kms = self._get_env_var('W_CSAP_USE_KMS', 'false', var_type=bool)
            self.security.kms_provider = self._get_env_var('W_CSAP_KMS_PROVIDER', 'aws')
            self.security.kms_key_id = self._get_env_var('W_CSAP_KMS_KEY_ID', '')
            self.security.kms_region = self._get_env_var('W_CSAP_KMS_REGION', '')
            self.security.key_rotation_days = self._get_env_var('W_CSAP_KEY_ROTATION_DAYS', 90, var_type=int)
            self.security.db_path = self._get_env_var('W_CSAP_DB_PATH', 'data/w_csap.db')
            self.security.allowed_origins = self._get_env_var('W_CSAP_ALLOWED_ORIGINS', '', var_type=list)
            self.security.analytics_enabled = self._get_env_var('W_CSAP_ANALYTICS_ENABLED', 'true', var_type=bool)
            self.security.cleanup_enabled = self._get_env_var('W_CSAP_CLEANUP_ENABLED', 'true', var_type=bool)
            self.security.cleanup_interval_seconds = self._get_env_var('W_CSAP_CLEANUP_INTERVAL_SECONDS', 3600, var_type=int)
            self.security.app_name = self._get_env_var('W_CSAP_APP_NAME', 'GigChain.io')
            self.security.protocol_version = self._get_env_var('W_CSAP_PROTOCOL_VERSION', '3.0.0')
            self.security.max_active_sessions_per_wallet = self._get_env_var('W_CSAP_MAX_ACTIVE_SESSIONS_PER_WALLET', 5, var_type=int)
            
            # AI configuration
            self.ai.openai_api_key = self._get_env_var('OPENAI_API_KEY', '')
            self.ai.ai_agents_enabled = self._get_env_var('AI_AGENTS_ENABLED', 'true', var_type=bool)
            self.ai.model = self._get_env_var('OPENAI_MODEL', 'gpt-4o-mini')
            self.ai.temperature = self._get_env_var('OPENAI_TEMPERATURE', 0.1, var_type=float)
            self.ai.max_tokens = self._get_env_var('OPENAI_MAX_TOKENS', 4000, var_type=int)
            
            # IPFS configuration
            self.ipfs.mode = self._get_env_var('IPFS_MODE', 'local')
            self.ipfs.api_url = self._get_env_var('IPFS_API_URL', '/ip4/127.0.0.1/tcp/5001')
            self.ipfs.gateway_url = self._get_env_var('IPFS_GATEWAY_URL', 'http://127.0.0.1:8080')
            self.ipfs.timeout = self._get_env_var('IPFS_TIMEOUT', 30, var_type=int)
            self.ipfs.pinata_api_key = self._get_env_var('PINATA_API_KEY', '')
            self.ipfs.pinata_secret_key = self._get_env_var('PINATA_SECRET_KEY', '')
            self.ipfs.infura_project_id = self._get_env_var('INFURA_PROJECT_ID', '')
            self.ipfs.infura_project_secret = self._get_env_var('INFURA_PROJECT_SECRET', '')
            self.ipfs.nft_storage_api_key = self._get_env_var('NFT_STORAGE_API_KEY', '')
            self.ipfs.auto_ipfs_storage = self._get_env_var('AUTO_IPFS_STORAGE', 'false', var_type=bool)
            self.ipfs.auto_pin_contracts = self._get_env_var('AUTO_PIN_CONTRACTS', 'true', var_type=bool)
            
            # Monitoring configuration
            self.monitoring.splunk_hec_url = self._get_env_var('SPLUNK_HEC_URL', '')
            self.monitoring.splunk_hec_token = self._get_env_var('SPLUNK_HEC_TOKEN', '')
            self.monitoring.elastic_url = self._get_env_var('ELASTIC_URL', '')
            self.monitoring.elastic_index = self._get_env_var('ELASTIC_INDEX', 'gigchain-security')
            self.monitoring.elastic_api_key = self._get_env_var('ELASTIC_API_KEY', '')
            self.monitoring.elastic_username = self._get_env_var('ELASTIC_USERNAME', '')
            self.monitoring.elastic_password = self._get_env_var('ELASTIC_PASSWORD', '')
            self.monitoring.datadog_api_key = self._get_env_var('DATADOG_API_KEY', '')
            self.monitoring.datadog_site = self._get_env_var('DATADOG_SITE', 'datadoghq.com')
            
            # Web3 configuration
            self.web3.web3_provider_url = self._get_env_var('WEB3_PROVIDER_URL', '')
            self.web3.reputation_nft_address = self._get_env_var('REPUTATION_NFT_ADDRESS', '')
            
            self._config_loaded = True
            logger.info("Configuration loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load configuration: {e}")
            raise
    
    def validate_configuration(self) -> bool:
        """
        Validate the loaded configuration.
        
        Returns:
            True if configuration is valid, False otherwise
        """
        self._validation_errors.clear()
        
        # Validate required settings
        if not self.security.secret_key or len(self.security.secret_key) < 32:
            self._validation_errors.append("SECRET_KEY must be at least 32 characters")
        
        if not self.security.w_csap_secret_key or len(self.security.w_csap_secret_key) < 32:
            self._validation_errors.append("W_CSAP_SECRET_KEY must be at least 32 characters")
        
        # Validate environment-specific requirements
        if self.server.environment == Environment.PRODUCTION:
            if not self.security.require_https:
                self._validation_errors.append("W_CSAP_REQUIRE_HTTPS must be true in production")
            
            if not self.security.dpop_enabled:
                self._validation_errors.append("W_CSAP_DPOP_ENABLED should be true in production")
        
        # Validate AI configuration
        if self.ai.ai_agents_enabled and not self.ai.openai_api_key:
            self._validation_errors.append("OPENAI_API_KEY is required when AI_AGENTS_ENABLED is true")
        
        # Validate IPFS configuration
        if self.ipfs.mode == 'pinata' and (not self.ipfs.pinata_api_key or not self.ipfs.pinata_secret_key):
            self._validation_errors.append("PINATA_API_KEY and PINATA_SECRET_KEY are required for Pinata mode")
        
        if self.ipfs.mode == 'infura' and (not self.ipfs.infura_project_id or not self.ipfs.infura_project_secret):
            self._validation_errors.append("INFURA_PROJECT_ID and INFURA_PROJECT_SECRET are required for Infura mode")
        
        # Log validation results
        if self._validation_errors:
            logger.error(f"Configuration validation failed with {len(self._validation_errors)} errors:")
            for error in self._validation_errors:
                logger.error(f"  - {error}")
            return False
        else:
            logger.info("Configuration validation passed")
            return True
    
    def get_validation_errors(self) -> List[str]:
        """Get list of configuration validation errors."""
        return self._validation_errors.copy()
    
    def is_ai_enabled(self) -> bool:
        """Check if AI agents are enabled and properly configured."""
        return self.ai.ai_agents_enabled and bool(self.ai.openai_api_key)
    
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.server.environment == Environment.PRODUCTION
    
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.server.environment == Environment.DEVELOPMENT
    
    def get_cors_origins(self) -> List[str]:
        """Get CORS origins, with fallback to development defaults."""
        if self.server.cors_origins:
            return self.server.cors_origins
        
        # Development fallback
        if self.is_development():
            return [
                "http://localhost:3000",
                "http://localhost:5173",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:5173"
            ]
        
        return []
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration to dictionary for debugging/logging."""
        return {
            "server": {
                "port": self.server.port,
                "debug": self.server.debug,
                "environment": self.server.environment.value,
                "cors_origins": self.server.cors_origins,
                "log_level": self.server.log_level
            },
            "database": {
                "type": self.database.type,
                "url": "***" if self.database.url else None,
                "host": self.database.host,
                "port": self.database.port,
                "user": self.database.user,
                "name": self.database.name
            },
            "security": {
                "secret_key_configured": bool(self.security.secret_key),
                "w_csap_secret_key_configured": bool(self.security.w_csap_secret_key),
                "redis_url": self.security.redis_url,
                "require_https": self.security.require_https,
                "dpop_enabled": self.security.dpop_enabled,
                "global_rate_limit_enabled": self.security.global_rate_limit_enabled
            },
            "ai": {
                "enabled": self.is_ai_enabled(),
                "openai_configured": bool(self.ai.openai_api_key),
                "model": self.ai.model,
                "temperature": self.ai.temperature
            },
            "ipfs": {
                "mode": self.ipfs.mode,
                "api_url": self.ipfs.api_url,
                "gateway_url": self.ipfs.gateway_url,
                "auto_storage": self.ipfs.auto_ipfs_storage
            },
            "monitoring": {
                "splunk_configured": bool(self.monitoring.splunk_hec_url and self.monitoring.splunk_hec_token),
                "elastic_configured": bool(self.monitoring.elastic_url),
                "datadog_configured": bool(self.monitoring.datadog_api_key)
            }
        }


# Global configuration instance
config = ConfigManager()


# Convenience functions for backward compatibility
def get_config() -> ConfigManager:
    """Get the global configuration instance."""
    return config


def is_ai_agents_enabled() -> bool:
    """Check if AI agents are enabled (backward compatibility)."""
    return config.is_ai_enabled()


def get_openai_api_key() -> str:
    """Get OpenAI API key (backward compatibility)."""
    return config.ai.openai_api_key


def get_secret_key() -> str:
    """Get secret key (backward compatibility)."""
    return config.security.secret_key


def get_w_csap_secret_key() -> str:
    """Get W-CSAP secret key (backward compatibility)."""
    return config.security.w_csap_secret_key


def get_redis_url() -> str:
    """Get Redis URL (backward compatibility)."""
    return config.security.redis_url


def get_cors_origins() -> List[str]:
    """Get CORS origins (backward compatibility)."""
    return config.get_cors_origins()


def get_environment() -> str:
    """Get current environment (backward compatibility)."""
    return config.server.environment.value


def is_production() -> bool:
    """Check if running in production (backward compatibility)."""
    return config.is_production()


def is_development() -> bool:
    """Check if running in development (backward compatibility)."""
    return config.is_development()
