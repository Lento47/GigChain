"""
GigChain.io Custom Exceptions
Comprehensive error handling for the API
"""

from typing import Optional, Dict, Any


class GigChainBaseException(Exception):
    """Base exception for all GigChain errors."""
    
    def __init__(
        self,
        message: str,
        error_code: str,
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for API response."""
        return {
            "error": {
                "message": self.message,
                "code": self.error_code,
                "details": self.details
            }
        }


# ==================== Authentication Exceptions ====================

class AuthenticationError(GigChainBaseException):
    """Base class for authentication errors."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="AUTH_ERROR",
            status_code=401,
            details=details
        )


class InvalidSignatureError(AuthenticationError):
    """Raised when wallet signature verification fails."""
    
    def __init__(self, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message="Invalid wallet signature",
            details=details or {}
        )
        self.error_code = "INVALID_SIGNATURE"


class ExpiredChallengeError(AuthenticationError):
    """Raised when authentication challenge has expired."""
    
    def __init__(self, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message="Authentication challenge has expired",
            details=details or {}
        )
        self.error_code = "EXPIRED_CHALLENGE"


class InvalidSessionError(AuthenticationError):
    """Raised when session token is invalid or expired."""
    
    def __init__(self, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message="Invalid or expired session",
            details=details or {}
        )
        self.error_code = "INVALID_SESSION"


class RateLimitExceededError(GigChainBaseException):
    """Raised when rate limit is exceeded."""
    
    def __init__(self, retry_after: int, details: Optional[Dict[str, Any]] = None):
        details = details or {}
        details["retry_after"] = retry_after
        super().__init__(
            message=f"Rate limit exceeded. Retry after {retry_after} seconds",
            error_code="RATE_LIMIT_EXCEEDED",
            status_code=429,
            details=details
        )


# ==================== Contract Exceptions ====================

class ContractError(GigChainBaseException):
    """Base class for contract-related errors."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="CONTRACT_ERROR",
            status_code=400,
            details=details
        )


class InvalidContractInputError(ContractError):
    """Raised when contract input validation fails."""
    
    def __init__(self, field: str, reason: str, details: Optional[Dict[str, Any]] = None):
        details = details or {}
        details.update({"field": field, "reason": reason})
        super().__init__(
            message=f"Invalid contract input: {reason}",
            details=details
        )
        self.error_code = "INVALID_CONTRACT_INPUT"


class ContractGenerationError(ContractError):
    """Raised when contract generation fails."""
    
    def __init__(self, reason: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"Contract generation failed: {reason}",
            details=details or {}
        )
        self.error_code = "CONTRACT_GENERATION_FAILED"


class MissingWalletAddressError(ContractError):
    """Raised when required wallet address is missing."""
    
    def __init__(self, wallet_type: str = "wallet", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"Missing {wallet_type} address",
            details=details or {}
        )
        self.error_code = "MISSING_WALLET_ADDRESS"


# ==================== AI Agent Exceptions ====================

class AIAgentError(GigChainBaseException):
    """Base class for AI agent errors."""
    
    def __init__(self, message: str, agent_name: str, details: Optional[Dict[str, Any]] = None):
        details = details or {}
        details["agent_name"] = agent_name
        super().__init__(
            message=message,
            error_code="AI_AGENT_ERROR",
            status_code=500,
            details=details
        )


class OpenAIAPIError(AIAgentError):
    """Raised when OpenAI API call fails."""
    
    def __init__(self, agent_name: str, reason: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"OpenAI API error: {reason}",
            agent_name=agent_name,
            details=details or {}
        )
        self.error_code = "OPENAI_API_ERROR"


class AgentNotAvailableError(AIAgentError):
    """Raised when requested AI agent is not available."""
    
    def __init__(self, agent_name: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"AI agent '{agent_name}' is not available",
            agent_name=agent_name,
            details=details or {}
        )
        self.error_code = "AGENT_NOT_AVAILABLE"


class AgentChainError(AIAgentError):
    """Raised when agent chaining fails."""
    
    def __init__(self, chain_step: str, reason: str, details: Optional[Dict[str, Any]] = None):
        details = details or {}
        details.update({"chain_step": chain_step, "reason": reason})
        super().__init__(
            message=f"Agent chain failed at step '{chain_step}': {reason}",
            agent_name="chain",
            details=details
        )
        self.error_code = "AGENT_CHAIN_ERROR"


# ==================== Template Exceptions ====================

class TemplateError(GigChainBaseException):
    """Base class for template-related errors."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="TEMPLATE_ERROR",
            status_code=400,
            details=details
        )


class TemplateSecurityError(TemplateError):
    """Raised when template security validation fails."""
    
    def __init__(self, security_issues: list, details: Optional[Dict[str, Any]] = None):
        details = details or {}
        details["security_issues"] = security_issues
        super().__init__(
            message="Template failed security validation",
            details=details
        )
        self.error_code = "TEMPLATE_SECURITY_ERROR"


class TemplateNotFoundError(TemplateError):
    """Raised when requested template is not found."""
    
    def __init__(self, template_id: str, details: Optional[Dict[str, Any]] = None):
        details = details or {}
        details["template_id"] = template_id
        super().__init__(
            message=f"Template '{template_id}' not found",
            details=details
        )
        self.error_code = "TEMPLATE_NOT_FOUND"
        self.status_code = 404


# ==================== Validation Exceptions ====================

class ValidationError(GigChainBaseException):
    """Raised when input validation fails."""
    
    def __init__(self, field: str, message: str, details: Optional[Dict[str, Any]] = None):
        details = details or {}
        details["field"] = field
        super().__init__(
            message=f"Validation error for '{field}': {message}",
            error_code="VALIDATION_ERROR",
            status_code=422,
            details=details
        )


class MissingRequiredFieldError(ValidationError):
    """Raised when required field is missing."""
    
    def __init__(self, field: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            field=field,
            message="Required field is missing",
            details=details or {}
        )
        self.error_code = "MISSING_REQUIRED_FIELD"


# ==================== Chat Exceptions ====================

class ChatError(GigChainBaseException):
    """Base class for chat-related errors."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="CHAT_ERROR",
            status_code=500,
            details=details
        )


class SessionNotFoundError(ChatError):
    """Raised when chat session is not found."""
    
    def __init__(self, session_id: str, details: Optional[Dict[str, Any]] = None):
        details = details or {}
        details["session_id"] = session_id
        super().__init__(
            message=f"Chat session '{session_id}' not found",
            details=details
        )
        self.error_code = "SESSION_NOT_FOUND"
        self.status_code = 404


class InvalidAgentTypeError(ChatError):
    """Raised when invalid agent type is specified."""
    
    def __init__(self, agent_type: str, valid_types: list, details: Optional[Dict[str, Any]] = None):
        details = details or {}
        details.update({"agent_type": agent_type, "valid_types": valid_types})
        super().__init__(
            message=f"Invalid agent type '{agent_type}'. Valid types: {', '.join(valid_types)}",
            details=details
        )
        self.error_code = "INVALID_AGENT_TYPE"
        self.status_code = 400


# ==================== Database Exceptions ====================

class DatabaseError(GigChainBaseException):
    """Base class for database-related errors."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="DATABASE_ERROR",
            status_code=500,
            details=details
        )


class DatabaseConnectionError(DatabaseError):
    """Raised when database connection fails."""
    
    def __init__(self, reason: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"Database connection failed: {reason}",
            details=details or {}
        )
        self.error_code = "DATABASE_CONNECTION_ERROR"


# ==================== Configuration Exceptions ====================

class ConfigurationError(GigChainBaseException):
    """Raised when configuration is invalid or missing."""
    
    def __init__(self, config_key: str, reason: str, details: Optional[Dict[str, Any]] = None):
        details = details or {}
        details.update({"config_key": config_key, "reason": reason})
        super().__init__(
            message=f"Configuration error for '{config_key}': {reason}",
            error_code="CONFIGURATION_ERROR",
            status_code=500,
            details=details
        )


class MissingAPIKeyError(ConfigurationError):
    """Raised when required API key is missing."""
    
    def __init__(self, service: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            config_key=f"{service}_API_KEY",
            reason=f"Missing API key for {service}",
            details=details or {}
        )
        self.error_code = "MISSING_API_KEY"
