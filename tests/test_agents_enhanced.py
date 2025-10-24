"""Tests para AI Agents mejorados de GigChain.io"""

import pytest
import json
import os
from unittest.mock import patch, MagicMock
from agents import (
    NegotiationAgent, 
    ContractGeneratorAgent, 
    DisputeResolverAgent,
    QualityAgent, 
    PaymentAgent,
    chain_agents,
    get_agent_status,
    AgentInput,
    MockOpenAIClient,
    create_openai_client
)

# Skip marker for tests requiring valid OpenAI API key
def is_valid_openai_key():
    """Check if OPENAI_API_KEY is set and not a test key."""
    api_key = os.getenv('OPENAI_API_KEY', '')
    # Skip if key is empty, starts with 'sk-test-', or is a known test key
    return api_key and not api_key.startswith('sk-test-') and api_key != 'test'

skip_if_no_openai = pytest.mark.skipif(
    not is_valid_openai_key(),
    reason="Valid OpenAI API key required (not test key)"
)


class TestNegotiationAgent:
    """Tests para NegotiationAgent mejorado."""
    
    def setup_method(self):
        """Setup para cada test."""
        self.mock_client = MockOpenAIClient()
        self.agent = NegotiationAgent(client=self.mock_client)
        self.sample_input = AgentInput(
            parsed={
                "amount": 5000,
                "days": 30,
                "description": "Desarrollo de app móvil",
                "skills": ["React Native", "Node.js"]
            },
            role="freelancer",
            complexity="medium"
        )
    
    def test_negotiation_agent_basic(self):
        """Test básico del NegotiationAgent."""
        result = self.agent.run(self.sample_input)
        
        assert "counter_offer" in result
        assert "milestones" in result
        assert "risks" in result
        assert "rationale" in result
        assert result["counter_offer"] > 0
        assert len(result["milestones"]) >= 2
    
    def test_negotiation_agent_low_complexity(self):
        """Test para complexity low."""
        input_low = AgentInput(
            parsed={"amount": 1000, "days": 7, "description": "Logo simple"},
            role="freelancer", 
            complexity="low"
        )
        
        result = self.agent.run(input_low)
        assert result["counter_offer"] > input_low.parsed["amount"]


class TestContractGeneratorAgent:
    """Tests para ContractGeneratorAgent."""
    
    def setup_method(self):
        """Setup para cada test."""
        self.mock_client = MockOpenAIClient()
        self.agent = ContractGeneratorAgent(client=self.mock_client)
        self.sample_negotiation = {
            "counter_offer": 5000.0,
            "milestones": [
                {"desc": "Setup inicial", "amount": 1500.0, "deadline": "2025-01-15", "percentage": 30.0},
                {"desc": "Desarrollo", "amount": 2000.0, "deadline": "2025-01-30", "percentage": 40.0},
                {"desc": "Finalización", "amount": 1500.0, "deadline": "2025-02-15", "percentage": 30.0}
            ],
            "risks": ["Complejidad técnica"],
            "rationale": "Proyecto de desarrollo móvil"
        }
    
    def test_contract_generator_basic(self):
        """Test básico del ContractGeneratorAgent."""
        result = self.agent.run(self.sample_negotiation)
        
        assert "contract_id" in result
        assert "full_terms" in result
        assert "escrow_params" in result
        assert result["escrow_params"]["token"] == "USDC"
        assert result["escrow_params"]["network"] == "Polygon"
        assert result["deployment_ready"] is True


class TestQualityAgent:
    """Tests para QualityAgent."""
    
    def setup_method(self):
        """Setup para cada test."""
        self.mock_client = MockOpenAIClient()
        self.agent = QualityAgent(client=self.mock_client)
        self.sample_work = {
            "contract": {"contract_id": "test_123"},
            "deliverables": ["app_mobile.apk", "documentation.pdf"],
            "work_samples": ["code_repository_url"]
        }
    
    def test_quality_agent_basic(self):
        """Test básico del QualityAgent."""
        result = self.agent.run(self.sample_work)
        
        assert "quality_score" in result
        assert "approval_recommendation" in result
        assert result["quality_score"] > 0
        assert result["quality_score"] <= 100


class TestPaymentAgent:
    """Tests para PaymentAgent."""
    
    def setup_method(self):
        """Setup para cada test."""
        self.mock_client = MockOpenAIClient()
        self.agent = PaymentAgent(client=self.mock_client)
        self.sample_payment = {
            "contract": {"contract_id": "test_123"},
            "payment_info": {"amount": 1000.0, "currency": "USDC"},
            "wallet_addresses": {"sender": "0x123...", "receiver": "0x456..."}
        }
    
    def test_payment_agent_basic(self):
        """Test básico del PaymentAgent."""
        result = self.agent.run(self.sample_payment)
        
        assert "payment_id" in result
        assert "transaction_status" in result
        assert "amount_usdc" in result
        assert result["amount_usdc"] > 0


class TestChainAgents:
    """Tests para el sistema de chaining de agents."""
    
    def setup_method(self):
        """Setup para cada test."""
        self.sample_input = AgentInput(
            parsed={
                "amount": 3000,
                "days": 21,
                "description": "Desarrollo de API REST",
                "skills": ["Python", "FastAPI", "PostgreSQL"]
            },
            role="freelancer",
            complexity="medium"
        )
    
    def test_chain_agents_basic(self):
        """Test básico del chain de agents."""
        mock_client = MockOpenAIClient()
        result = chain_agents(self.sample_input, client=mock_client)
        
        assert "negotiation" in result
        assert "contract" in result
        assert "chain_metadata" in result
        assert "NegotiationAgent" in result["chain_metadata"]["agents_used"]
        assert "ContractGeneratorAgent" in result["chain_metadata"]["agents_used"]
    
    def test_get_agent_status(self):
        """Test para obtener estado de agents."""
        status = get_agent_status()
        
        assert "available_agents" in status
        assert "openai_configured" in status
        assert len(status["available_agents"]) == 5
        
        agent_names = [agent["name"] for agent in status["available_agents"]]
        assert "NegotiationAgent" in agent_names
        assert "ContractGeneratorAgent" in agent_names
        assert "QualityAgent" in agent_names
        assert "PaymentAgent" in agent_names
        assert "DisputeResolverAgent" in agent_names


class TestAgentErrorHandling:
    """Tests para manejo de errores en agents."""
    
    def test_agent_openai_error(self):
        """Test manejo de errores de OpenAI."""
        # Create a mock client that raises an exception
        class FailingMockClient:
            def chat(self):
                return FailingMockChatCompletions()
        
        class FailingMockChatCompletions:
            def create(self, **kwargs):
                raise Exception("OpenAI API Error")
        
        agent = NegotiationAgent(client=FailingMockClient())
        input_data = AgentInput(
            parsed={"amount": 1000, "days": 7},
            role="freelancer",
            complexity="low"
        )
        
        with pytest.raises(ValueError, match="Agent error"):
            agent.run(input_data)
    
    def test_chain_agents_fallback(self):
        """Test fallback en chain_agents cuando hay error."""
        # Create a mock client that raises an exception
        class FailingMockClient:
            def chat(self):
                return FailingMockChatCompletions()
        
        class FailingMockChatCompletions:
            def create(self, **kwargs):
                raise Exception("API Error")
        
        input_data = AgentInput(
            parsed={"amount": 1000, "days": 7},
            role="freelancer",
            complexity="low"
        )
        
        result = chain_agents(input_data, client=FailingMockClient())
        
        assert "negotiation" in result
        assert "contract" in result
        assert "error" in result["contract"]
        assert result["chain_metadata"]["fallback_mode"] is True


if __name__ == "__main__":
    # Ejecutar tests individuales
    pytest.main([__file__, "-v"])