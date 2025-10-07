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
    AgentInput
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
        self.agent = NegotiationAgent()
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
    
    @skip_if_no_openai
    @patch('agents.OpenAI')
    def test_negotiation_agent_basic(self, mock_openai):
        """Test básico del NegotiationAgent."""
        # Mock response
        mock_response = {
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
        
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value.choices[0].message.content = json.dumps(mock_response)
        mock_openai.return_value = mock_client
        
        result = self.agent.run(self.sample_input)
        
        assert "counter_offer" in result
        assert "milestones" in result
        assert "risks" in result
        assert "rationale" in result
        assert result["counter_offer"] > 0
        assert len(result["milestones"]) >= 2
    
    @skip_if_no_openai
    def test_negotiation_agent_low_complexity(self):
        """Test para complexity low."""
        input_low = AgentInput(
            parsed={"amount": 1000, "days": 7, "description": "Logo simple"},
            role="freelancer", 
            complexity="low"
        )
        
        with patch('agents.OpenAI') as mock_openai:
            mock_response = {
                "counter_offer": 1150.0,  # +15% para low complexity
                "milestones": [
                    {"desc": "Concepto inicial", "amount": 345.0, "deadline": "2025-01-10", "percentage": 30.0},
                    {"desc": "Diseño final", "amount": 805.0, "deadline": "2025-01-14", "percentage": 70.0}
                ],
                "risks": ["Requisitos poco claros"],
                "mitigation_strategies": ["Brief detallado"],
                "rationale": "Aumento del 15% por baja complejidad",
                "confidence_score": 0.95,
                "negotiation_tips": ["Proceso rápido"]
            }
            
            mock_client = MagicMock()
            mock_client.chat.completions.create.return_value.choices[0].message.content = json.dumps(mock_response)
            mock_openai.return_value = mock_client
            
            result = self.agent.run(input_low)
            assert result["counter_offer"] > input_low.parsed["amount"]


class TestContractGeneratorAgent:
    """Tests para ContractGeneratorAgent."""
    
    def setup_method(self):
        """Setup para cada test."""
        self.agent = ContractGeneratorAgent()
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
    
    @skip_if_no_openai
    @patch('agents.OpenAI')
    def test_contract_generator_basic(self, mock_openai):
        """Test básico del ContractGeneratorAgent."""
        mock_response = {
            "contract_id": "gig_2025-01-02T12:00:00",
            "full_terms": "Contrato de desarrollo de app móvil...",
            "escrow_params": {
                "token": "USDC",
                "network": "Polygon",
                "total_amount": 5000.0,
                "milestones": [
                    {"id": "m1", "description": "Setup inicial", "amount": 1500.0, "deadline": "2025-01-15", "percentage": 30.0}
                ]
            },
            "solidity_stubs": {
                "contract_name": "GigContract",
                "functions": ["createContract", "releaseMilestone", "disputeResolution"],
                "events": ["ContractCreated", "MilestoneReleased"],
                "modifiers": ["onlyParties", "milestoneCompleted"]
            },
            "clauses": [
                {"type": "payment", "title": "Escrow Terms", "content": "Fondos en USDC...", "importance": "high"}
            ],
            "compliance": {
                "mica_compliant": True,
                "gdpr_compliant": True,
                "legal_notes": ["Cumple regulaciones MiCA"]
            },
            "deployment_ready": True,
            "estimated_gas": 150000
        }
        
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value.choices[0].message.content = json.dumps(mock_response)
        mock_openai.return_value = mock_client
        
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
        self.agent = QualityAgent()
        self.sample_work = {
            "contract": {"contract_id": "test_123"},
            "deliverables": ["app_mobile.apk", "documentation.pdf"],
            "work_samples": ["code_repository_url"]
        }
    
    @skip_if_no_openai
    @patch('agents.OpenAI')
    def test_quality_agent_basic(self, mock_openai):
        """Test básico del QualityAgent."""
        mock_response = {
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
        
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value.choices[0].message.content = json.dumps(mock_response)
        mock_openai.return_value = mock_client
        
        result = self.agent.run(self.sample_work)
        
        assert "quality_score" in result
        assert "approval_recommendation" in result
        assert result["quality_score"] > 0
        assert result["quality_score"] <= 100


class TestPaymentAgent:
    """Tests para PaymentAgent."""
    
    def setup_method(self):
        """Setup para cada test."""
        self.agent = PaymentAgent()
        self.sample_payment = {
            "contract": {"contract_id": "test_123"},
            "payment_info": {"amount": 1000.0, "currency": "USDC"},
            "wallet_addresses": {"sender": "0x123...", "receiver": "0x456..."}
        }
    
    @skip_if_no_openai
    @patch('agents.OpenAI')
    def test_payment_agent_basic(self, mock_openai):
        """Test básico del PaymentAgent."""
        mock_response = {
            "payment_id": "pay_2025-01-02T12:00:00",
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
            "transaction_hash": "0xabc123...",
            "estimated_completion": "2025-01-02T12:05:00Z"
        }
        
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value.choices[0].message.content = json.dumps(mock_response)
        mock_openai.return_value = mock_client
        
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
    
    @patch('agents.OpenAI')
    def test_chain_agents_basic(self, mock_openai):
        """Test básico del chain de agents."""
        # Mock responses para cada agent
        negotiation_response = {
            "counter_offer": 3300.0,
            "milestones": [
                {"desc": "Setup API", "amount": 990.0, "deadline": "2025-01-10", "percentage": 30.0},
                {"desc": "Desarrollo core", "amount": 1320.0, "deadline": "2025-01-20", "percentage": 40.0},
                {"desc": "Testing", "amount": 990.0, "deadline": "2025-01-30", "percentage": 30.0}
            ],
            "risks": ["Complejidad de integración"],
            "rationale": "Aumento del 10% por complejidad media"
        }
        
        contract_response = {
            "contract_id": "gig_2025-01-02T12:00:00",
            "full_terms": "Contrato de desarrollo de API...",
            "escrow_params": {"token": "USDC", "network": "Polygon", "total_amount": 3300.0},
            "deployment_ready": True
        }
        
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value.choices[0].message.content = json.dumps(
            negotiation_response if "counter_offer" in str(mock_client.chat.completions.create.call_args) else contract_response
        )
        mock_openai.return_value = mock_client
        
        result = chain_agents(self.sample_input)
        
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
    
    @patch('agents.OpenAI')
    def test_agent_openai_error(self, mock_openai):
        """Test manejo de errores de OpenAI."""
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = Exception("OpenAI API Error")
        mock_openai.return_value = mock_client
        
        agent = NegotiationAgent()
        input_data = AgentInput(
            parsed={"amount": 1000, "days": 7},
            role="freelancer",
            complexity="low"
        )
        
        with pytest.raises(ValueError, match="Agent error"):
            agent.run(input_data)
    
    @patch('agents.OpenAI')
    def test_chain_agents_fallback(self, mock_openai):
        """Test fallback en chain_agents cuando hay error."""
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = Exception("API Error")
        mock_openai.return_value = mock_client
        
        input_data = AgentInput(
            parsed={"amount": 1000, "days": 7},
            role="freelancer",
            complexity="low"
        )
        
        result = chain_agents(input_data)
        
        assert "negotiation" in result
        assert "contract" in result
        assert "error" in result["contract"]
        assert result["chain_metadata"]["fallback_mode"] is True


if __name__ == "__main__":
    # Ejecutar tests individuales
    pytest.main([__file__, "-v"])