"""Tests for AI Agents management endpoints."""

import pytest
import sys
import pathlib
from fastapi.testclient import TestClient

# Add parent directory to path to import main module
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from main import app

client = TestClient(app)


def test_get_agents_status():
    """Test getting agents status."""
    response = client.get("/api/agents/status")
    assert response.status_code == 200
    
    data = response.json()
    assert "available_agents" in data
    assert "openai_configured" in data
    assert len(data["available_agents"]) > 0
    

def test_toggle_agent_success():
    """Test toggling an agent."""
    response = client.post("/api/agents/1/toggle?enabled=false")
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] is True
    assert data["agent_id"] == 1
    assert data["status"] == "inactive"
    

def test_toggle_agent_not_found():
    """Test toggling non-existent agent."""
    response = client.post("/api/agents/999/toggle?enabled=true")
    assert response.status_code == 404
    
    data = response.json()
    # FastAPI returns either "detail" or "error" depending on handler
    assert "detail" in data or "error" in data
    

def test_configure_agent_success():
    """Test configuring an agent."""
    config = {
        "temperature": 0.5,
        "model": "gpt-4o-mini",
        "max_tokens": 1000
    }
    
    response = client.post("/api/agents/1/configure", json=config)
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] is True
    assert data["agent_id"] == 1
    assert "configuration" in data
    

def test_configure_agent_invalid_params():
    """Test configuring agent with invalid parameters."""
    config = {
        "invalid_param": "value",
        "another_invalid": 123
    }
    
    response = client.post("/api/agents/1/configure", json=config)
    assert response.status_code == 400
    
    data = response.json()
    assert "detail" in data
    

def test_test_agent_negotiation():
    """Test running negotiation agent with sample input."""
    test_input = {
        "text": "Cliente ofrece $1000 por proyecto en 10 días"
    }
    
    response = client.post("/api/agents/1/test", json=test_input)
    # May return 200 or 500 depending on OpenAI API key availability
    assert response.status_code in [200, 500]
    
    data = response.json()
    if response.status_code == 200:
        assert data["success"] is True
        assert "test_result" in data
    else:
        # Fallback response when OpenAI is not available
        assert "error" in data or "fallback_response" in data
    

def test_test_agent_not_found():
    """Test testing non-existent agent."""
    test_input = {"text": "test"}
    
    response = client.post("/api/agents/999/test", json=test_input)
    assert response.status_code in [404, 500]
    

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
