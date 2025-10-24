"""GigChain.io FastAPI Backend - Production-ready API server."""

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import uuid
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import centralized configuration
from config import get_config, is_ai_agents_enabled

# Import custom exceptions
from exceptions import GigChainBaseException

# Import W-CSAP authentication
from auth import (
    WCSAPAuthenticator, 
    get_database, 
    RateLimitMiddleware,
    SessionCleanupMiddleware
)

# Import API Response Wrapper
from api_response_wrapper import APIResponseWrapper

# Import all routers
from auth_router import router as auth_router
from wallet_router import router as wallet_router
from contract_router import router as contract_router
from agent_router import router as agent_router
# from chat_router import router as chat_router  # Temporarily disabled due to import issues
from profile_router import router as profile_router
from template_router import router as template_router

# Import existing module routers
from gamification_api import router as gamification_router
from token_api import router as token_router
from contracts_api import router as contracts_router
from i18n_api import router as i18n_router
from analytics_api import router as analytics_router
from dispute_oracle_api import router as dispute_oracle_router
from reputation_nft_api import router as reputation_nft_router
from template_marketplace_api import router as marketplace_router
from admin_api import router as admin_router
from dispute_mediation_api import router as mediation_router
from ipfs_api import router as ipfs_router

# Configure logging - ONLY W-CSAP Authentication logs
logging.basicConfig(
    level=logging.WARNING,  # Set base level to WARNING to reduce noise
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Enable INFO level ONLY for W-CSAP auth modules
logging.getLogger('auth.w_csap').setLevel(logging.INFO)
logging.getLogger('auth.routes').setLevel(logging.INFO)
logging.getLogger('auth.middleware').setLevel(logging.WARNING)
logging.getLogger('auth.database').setLevel(logging.WARNING)
logging.getLogger('auth.config').setLevel(logging.WARNING)

# Silence noisy modules
logging.getLogger('uvicorn.access').setLevel(logging.WARNING)
logging.getLogger('security.audit_logger').setLevel(logging.WARNING)

logger = logging.getLogger(__name__)
logger.setLevel(logging.WARNING)  # Reduce main logger noise

# Get configuration instance
config = get_config()

# Validate configuration on startup
if not config.validate_configuration():
    validation_errors = config.get_validation_errors()
    logger.error("Configuration validation failed:")
    for error in validation_errors:
        logger.error(f"  - {error}")
    raise ValueError("Configuration validation failed. Check logs for details.")

# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize resources on startup and cleanup on shutdown."""
    # Startup: Initialize authentication system
    app.state.authenticator = WCSAPAuthenticator(
        secret_key=config.security.w_csap_secret_key,
        challenge_ttl=config.security.challenge_ttl,
        session_ttl=config.security.access_token_ttl,
        refresh_ttl=config.security.refresh_ttl
    )
    
    app.state.auth_db = get_database()
    
    logger.info("🔐 W-CSAP Authentication system initialized")
    logger.info(f"Configuration loaded: {config.server.environment.value} environment")
    
    yield
    
    # Shutdown: Cleanup resources if needed
    logger.info("🔒 Shutting down authentication system")

# FastAPI app
app = FastAPI(
    title="GigChain.io API",
    description="AI-powered contract generation for Web3 gig economy",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# ==================== ROUTER INCLUDES ====================

# Include custom routers (extracted from main.py)
app.include_router(auth_router)
app.include_router(wallet_router)
app.include_router(contract_router)
app.include_router(agent_router)
# app.include_router(chat_router)  # Temporarily disabled due to import issues
app.include_router(profile_router)
app.include_router(template_router)

# Include existing module routers
app.include_router(gamification_router)
app.include_router(token_router)
app.include_router(contracts_router)
app.include_router(i18n_router)
app.include_router(analytics_router)
app.include_router(dispute_oracle_router)
app.include_router(reputation_nft_router)
app.include_router(marketplace_router)
app.include_router(admin_router)
app.include_router(mediation_router)
app.include_router(ipfs_router)

# ==================== CORS MIDDLEWARE ====================

def parse_cors_origins():
    """
    Parse and validate CORS_ORIGINS environment variable with comprehensive validation.
    
    Returns:
        List[str]: Validated list of allowed origins
        
    Raises:
        ValueError: If parsing fails or invalid origins are found
    """
    import re
    from urllib.parse import urlparse
    
    # Get CORS origins from centralized config
    cors_origins_env = ','.join(config.get_cors_origins()) if config.get_cors_origins() else ""
    
    # Development fallback if no environment variable is set or is empty/whitespace only
    if not cors_origins_env or not cors_origins_env.strip():
        logger.warning("No CORS_ORIGINS environment variable found or empty, using development fallback")
        cors_origins_env = (
            'http://localhost:3000,http://localhost:3001,http://localhost:5173,http://localhost:5174,'
            'http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:5173,http://127.0.0.1:5174,'
            'http://10.0.175.113:5173,http://192.168.223.1:5173,http://192.168.32.1:5173,http://172.27.80.1:5173'
        )
    
    # Split by comma and clean up
    raw_origins = cors_origins_env.split(',')
    cleaned_origins = []
    
    for origin in raw_origins:
        # Strip whitespace and filter out empty strings
        cleaned_origin = origin.strip()
        if not cleaned_origin:
            continue
            
        # Validate URL format
        try:
            parsed = urlparse(cleaned_origin)
            
            # Must have scheme (http/https)
            if not parsed.scheme:
                logger.warning(f"Invalid origin (missing protocol): {cleaned_origin}")
                continue
                
            # Must be http or https
            if parsed.scheme not in ['http', 'https']:
                logger.warning(f"Invalid origin (unsupported protocol): {cleaned_origin}")
                continue
                
            # Must have netloc (hostname)
            if not parsed.netloc:
                logger.warning(f"Invalid origin (missing hostname): {cleaned_origin}")
                continue
                
            # Validate hostname format (basic check)
            hostname_pattern = re.compile(
                r'^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?$'
            )
            
            # Allow localhost, IP addresses, and valid hostnames
            if (parsed.hostname == 'localhost' or 
                re.match(r'^127\.\d+\.\d+\.\d+$', parsed.hostname) or  # 127.x.x.x
                re.match(r'^192\.168\.\d+\.\d+$', parsed.hostname) or  # 192.168.x.x
                re.match(r'^10\.\d+\.\d+\.\d+$', parsed.hostname) or   # 10.x.x.x
                re.match(r'^172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+$', parsed.hostname) or  # 172.16-31.x.x
                hostname_pattern.match(parsed.hostname)):
                
                cleaned_origins.append(cleaned_origin)
                logger.debug(f"Valid origin added: {cleaned_origin}")
            else:
                logger.warning(f"Invalid origin (invalid hostname): {cleaned_origin}")
                
        except Exception as e:
            logger.warning(f"Error parsing origin '{cleaned_origin}': {str(e)}")
            continue
    
    # Ensure we have at least one valid origin
    if not cleaned_origins:
        raise ValueError(
            "No valid CORS origins found. Please check your CORS_ORIGINS environment variable. "
            "Origins must be valid URLs with http:// or https:// protocol."
        )
    
    # Log final configuration
    logger.info(f"CORS origins parsed successfully: {len(cleaned_origins)} valid origins")
    logger.debug(f"Final CORS origins: {cleaned_origins}")
    
    return cleaned_origins

# Parse CORS origins with robust validation
try:
    ALLOWED_ORIGINS = parse_cors_origins()
except ValueError as e:
    logger.error(f"CORS configuration error: {str(e)}")
    raise

# Consolidated CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Use configured allowed origins
    allow_credentials=True,  # Enable credentials for authenticated requests
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],  # Explicit methods
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-CSRFToken",
        "X-Session-Token",
        "X-Refresh-Token",
        "Origin",
        "Referer",
        "User-Agent"
    ],
    max_age=3600,  # Cache preflight for 1 hour
    expose_headers=["X-Request-ID", "X-Response-Time"]  # Expose custom headers
)

# Log CORS configuration for debugging
logger.info(f"CORS configured with {len(ALLOWED_ORIGINS)} allowed origins")
logger.debug(f"Allowed origins: {ALLOWED_ORIGINS}")

# ==================== MIDDLEWARE ====================

# Add W-CSAP authentication middleware
from auth.config import get_config as get_auth_config

# Get configuration for middleware
auth_config = get_auth_config()

# Apply rate limiting and session cleanup middleware with configuration values
app.add_middleware(
    SessionCleanupMiddleware, 
    cleanup_interval=config.security.cleanup_interval_seconds
)
app.add_middleware(
    RateLimitMiddleware, 
    max_attempts=auth_config.rate_limit_verify,
    window_seconds=auth_config.rate_limit_window_seconds
)

# Add API response timing middleware
from api_response_wrapper import ResponseTimingMiddleware
app.add_middleware(ResponseTimingMiddleware)

# Add security middleware
from auth.security_middleware import get_security_middleware
security_middleware = get_security_middleware(
    app,
    secret_key=config.security.w_csap_secret_key,
    environment=config.server.environment.value
)

# ==================== EXCEPTION HANDLERS ====================

# Global exception handler for custom exceptions
@app.exception_handler(GigChainBaseException)
async def gigchain_exception_handler(request: Request, exc: GigChainBaseException):
    """Handle all custom GigChain exceptions with proper error codes."""
    logger.error(f"GigChain error: {exc.error_code} - {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.error_code,
                "message": exc.message,
                "details": exc.details,
                "timestamp": datetime.now().isoformat()
            }
        }
    )

# Middleware for request logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.now()
    response = await call_next(request)
    process_time = (datetime.now() - start_time).total_seconds()
    
    logger.info(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.3f}s")
    return response

# ==================== HEALTH CHECK ====================

@app.get("/health")
async def health_check(request: Request):
    """Health check endpoint with AI agent status."""
    request_id = getattr(request.scope, 'request_id', str(uuid.uuid4()))
    
    health_data = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "GigChain API",
        "version": "1.0.0",
        "ai_agents_active": is_ai_agents_enabled(),
        "environment": config.server.environment.value,
        "debug_mode": config.server.debug
    }
    
    return APIResponseWrapper.success(
        data=health_data,
        request_id=request_id
    )

# ==================== ERROR HANDLERS ====================

@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "error": {
                "code": "ENDPOINT_NOT_FOUND",
                "message": "The requested endpoint does not exist",
                "details": {
                    "path": request.url.path,
                    "method": request.method
                },
                "timestamp": datetime.now().isoformat(),
                "available_endpoints": [
                    "/health",
                    "/docs",
                    "/api/auth/*",
                    "/api/wallets/*",
                    "/api/contract*",
                    "/api/agents/*",
                    "/api/chat/*",
                    "/api/profile/*",
                    "/api/templates/*"
                ]
            }
        }
    )

@app.exception_handler(405)
async def method_not_allowed_handler(request: Request, exc):
    return JSONResponse(
        status_code=405,
        content={
            "error": {
                "code": "METHOD_NOT_ALLOWED",
                "message": "The HTTP method is not allowed for this endpoint",
                "details": {
                    "path": request.url.path,
                    "method": request.method
                },
                "timestamp": datetime.now().isoformat()
            }
        }
    )

@app.exception_handler(500)
async def internal_server_error_handler(request: Request, exc):
    logger.error(f"Internal server error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred",
                "details": {},
                "timestamp": datetime.now().isoformat()
            }
        }
    )

# ==================== MAIN ====================

if __name__ == "__main__":
    import uvicorn
    
    # Use centralized configuration
    port = config.server.port
    debug = config.server.debug
    
    logger.info(f"Starting GigChain FastAPI server on port {port}")
    logger.info(f"Debug mode: {debug}")
    logger.info(f"Environment: {config.server.environment.value}")
    logger.info(f"AI Agents enabled: {is_ai_agents_enabled()}")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=debug,
        log_level="info"
    )
