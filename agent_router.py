"""Agent Router - AI Agent Management Endpoints"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import logging
from typing import Dict, Any

# Import centralized configuration
from config import is_ai_agents_enabled

# Import agent modules
from agents import get_agent_status, AgentInput
from services import get_openai_client
from contract_ai import parse_input, _detect_role, _determine_total_amount, _extract_days, _derive_risks, parsed_to_dict

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/agents", tags=["agents"])

def get_ai_client():
    """Get AI client with fallback to mock if needed."""
    return get_openai_client()

@router.get("/status")
async def agents_status():
    """Check AI agent availability and configuration."""
    if not is_ai_agents_enabled():
        return {
            "available_agents": [],
            "openai_configured": False,
            "feature_enabled": False,
            "message": "AI agents feature is disabled. Set AI_AGENTS_ENABLED=true and OPENAI_API_KEY to enable."
        }
    
    status = get_agent_status()
    status["feature_enabled"] = True
    return status

@router.post("/{agent_id}/toggle")
async def toggle_agent(agent_id: int, enabled: bool):
    """
    Toggle AI agent on/off.
    This controls whether the agent is active for processing requests.
    """
    if not is_ai_agents_enabled():
        raise HTTPException(
            status_code=403, 
            detail="AI agents feature is disabled. Set AI_AGENTS_ENABLED=true and OPENAI_API_KEY to enable."
        )
    
    try:
        # Get current agent status
        status = get_agent_status()
        agents = status.get("available_agents", [])
        
        # Find the agent
        agent = next((a for i, a in enumerate(agents) if i == agent_id - 1), None)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        # Update agent status (in production, this would update database)
        new_status = "active" if enabled else "inactive"
        
        logger.info(f"Agent {agent['name']} toggled to {new_status}")
        
        return {
            "success": True,
            "agent_id": agent_id,
            "agent_name": agent["name"],
            "status": new_status,
            "message": f"Agent {agent['name']} {'activated' if enabled else 'deactivated'} successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling agent: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to toggle agent")

@router.post("/{agent_id}/configure")
async def configure_agent(agent_id: int, config: Dict[str, Any]):
    """
    Configure AI agent parameters.
    Allows customization of agent behavior, temperature, and other settings.
    """
    if not is_ai_agents_enabled():
        raise HTTPException(
            status_code=403, 
            detail="AI agents feature is disabled. Set AI_AGENTS_ENABLED=true and OPENAI_API_KEY to enable."
        )
    
    try:
        # Get current agent status
        status = get_agent_status()
        agents = status.get("available_agents", [])
        
        # Find the agent
        agent = next((a for i, a in enumerate(agents) if i == agent_id - 1), None)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        # Validate configuration
        valid_config_keys = ["temperature", "model", "max_tokens", "system_prompt"]
        filtered_config = {k: v for k, v in config.items() if k in valid_config_keys}
        
        if not filtered_config:
            raise HTTPException(status_code=400, detail="No valid configuration parameters provided")
        
        logger.info(f"Agent {agent['name']} configured with: {filtered_config}")
        
        return {
            "success": True,
            "agent_id": agent_id,
            "agent_name": agent["name"],
            "configuration": filtered_config,
            "message": f"Agent {agent['name']} configured successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error configuring agent: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to configure agent")

@router.post("/{agent_id}/test")
async def test_agent(agent_id: int, test_input: Dict[str, Any]):
    """
    Test AI agent with sample input.
    Returns agent response for testing and debugging purposes.
    """
    if not is_ai_agents_enabled():
        raise HTTPException(
            status_code=403, 
            detail="AI agents feature is disabled. Set AI_AGENTS_ENABLED=true and OPENAI_API_KEY to enable."
        )
    
    try:
        from agents import (
            NegotiationAgent, 
            ContractGeneratorAgent, 
            DisputeResolverAgent, 
            QualityAgent, 
            PaymentAgent,
            AgentInput
        )
        
        # Get current agent status
        status = get_agent_status()
        agents = status.get("available_agents", [])
        
        # Find the agent
        agent = next((a for i, a in enumerate(agents) if i == agent_id - 1), None)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        # Map agent ID to agent class
        agent_classes = {
            0: NegotiationAgent,
            1: ContractGeneratorAgent,
            2: QualityAgent,
            3: PaymentAgent,
            4: DisputeResolverAgent
        }
        
        agent_class = agent_classes.get(agent_id - 1)
        if not agent_class:
            raise HTTPException(status_code=400, detail="Agent not testable")
        
        # Get AI client
        ai_client = get_ai_client()
        
        # Create test input
        if agent_id == 1:  # NegotiationAgent
            text = test_input.get("text", "Cliente ofrece $1000 por proyecto en 10 días")
            parsed = parse_input(text)
            role = _detect_role(text)
            total_amount = _determine_total_amount(parsed, role) or 1000.0
            total_days = _extract_days(text) or 10
            risks = _derive_risks(total_days, parsed)
            
            test_data = AgentInput(
                parsed=parsed_to_dict(parsed, role, total_amount, total_days, risks),
                role=role or "cliente",
                complexity="medium"
            )
            result = agent_class(client=ai_client).run(test_data)
        else:
            # For other agents, use provided test input
            result = agent_class(client=ai_client).run(test_input)
        
        logger.info(f"Agent {agent['name']} tested successfully")
        
        return {
            "success": True,
            "agent_id": agent_id,
            "agent_name": agent["name"],
            "test_result": result,
            "message": f"Agent {agent['name']} test completed successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error testing agent: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Agent test failed: {str(e)}",
                "fallback_response": "Agent is currently unavailable. Please ensure OpenAI API key is configured."
            }
        )
