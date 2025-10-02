"""GigChain.io FastAPI Backend - Production-ready API server."""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import logging
import os
from datetime import datetime
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import existing modules
from contract_ai import full_flow, generate_contract
from agents import chain_agents, AgentInput

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="GigChain.io API",
    description="AI-powered contract generation for Web3 gig economy",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class ContractRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000, description="Contract description")
    
class SimpleContractRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000, description="Simple contract description")

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    service: str
    version: str
    ai_agents_active: bool

# Middleware for request logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.now()
    response = await call_next(request)
    process_time = (datetime.now() - start_time).total_seconds()
    
    logger.info(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.3f}s")
    return response

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint with AI agent status."""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        service="GigChain API",
        version="1.0.0",
        ai_agents_active=bool(os.getenv('OPENAI_API_KEY'))
    )

# Main AI-powered contract generation
@app.post("/api/full_flow")
async def api_full_flow(request: ContractRequest):
    """
    Generate AI-powered contract with agent chaining.
    
    Uses NegotiationAgent, ContractGeneratorAgent, and DisputeResolverAgent
    for complex contract negotiations and generation.
    """
    try:
        logger.info(f"Processing AI contract request: {request.text[:100]}...")
        
        # Process with full AI flow
        result = full_flow(request.text)
        
        # Add API metadata
        result['api_metadata'] = {
            'timestamp': datetime.now().isoformat(),
            'endpoint': 'full_flow',
            'ai_agents_used': 'json' in result,
            'processing_time': 'calculated_by_client'
        }
        
        logger.info(f"Successfully generated contract: {result.get('contract_id', 'unknown')}")
        return result
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Validation error: {str(e)}")
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error occurred")

# Simple rule-based contract generation
@app.post("/api/contract")
async def api_simple_contract(request: SimpleContractRequest):
    """
    Generate simple rule-based contract without AI agents.
    
    Faster response for simple contracts without complex negotiations.
    """
    try:
        logger.info(f"Processing simple contract: {request.text[:100]}...")
        
        # Process with rule-based generation only
        result = generate_contract(request.text)
        
        # Add API metadata
        result['api_metadata'] = {
            'timestamp': datetime.now().isoformat(),
            'endpoint': 'contract',
            'ai_agents_used': False,
            'processing_time': 'calculated_by_client'
        }
        
        logger.info("Successfully generated simple contract")
        return result
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Validation error: {str(e)}")
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error occurred")

# Agent status endpoint
@app.get("/api/agents/status")
async def agents_status():
    """Check AI agent availability and configuration."""
    return {
        "openai_configured": bool(os.getenv('OPENAI_API_KEY')),
        "agents_available": [
            "NegotiationAgent",
            "ContractGeneratorAgent", 
            "DisputeResolverAgent"
        ],
        "model": "gpt-4o-mini",
        "timestamp": datetime.now().isoformat()
    }

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "error": "Endpoint not found",
            "message": "The requested endpoint does not exist",
            "available_endpoints": [
                "/health",
                "/api/full_flow",
                "/api/contract",
                "/api/agents/status",
                "/docs"
            ]
        }
    )

@app.exception_handler(405)
async def method_not_allowed_handler(request: Request, exc):
    return JSONResponse(
        status_code=405,
        content={
            "error": "Method not allowed",
            "message": "The HTTP method is not allowed for this endpoint"
        }
    )

if __name__ == "__main__":
    import uvicorn
    
    # Development server
    port = int(os.getenv('PORT', 8000))
    debug = os.getenv('DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Starting GigChain FastAPI server on port {port}")
    logger.info(f"Debug mode: {debug}")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=debug,
        log_level="info"
    )
