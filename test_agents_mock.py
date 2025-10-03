#!/usr/bin/env python3
"""
Tests con mocks para AI Agents de GigChain.io
Evita dependencias de API reales usando mocks
"""

import pytest
import json
import os
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta
from agents import (
    NegotiationAgent, ContractGeneratorAgent, DisputeResolverAgent,
    QualityAgent, PaymentAgent, chain_agents, get_agent_status, AgentInput
)


class TestNegotiationAgentMock:
    """Tests para NegotiationAgent con mocks."""
    
    @patch('agents.OpenAI')
    def test_negotiation_agent_initialization(self, mock_openai):
        """Test que el agent se inicializa correctamente."""
        # Mock del cliente OpenAI
        mock_client = Mock()
        mock_openai.return_value = mock_client
        
        agent = NegotiationAgent()
        
        assert agent.model == "gpt-4o-mini"
        assert agent.temp == 0.1
        assert agent.client == mock_client
    
    @patch('agents.OpenAI')
    def test_negotiation_agent_output_structure(self, mock_openai):
        """Test que el output tiene la estructura correcta."""
        # Mock del cliente OpenAI
        mock_client = Mock()
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = json.dumps({
            "counter_offer": 5500.0,
            "milestones": [
                {"desc": "Setup inicial", "amount": 1650.0, "deadline": "2025-01-15", "percentage": 30.0},
                {"desc": "Desarrollo core", "amount": 2200.0, "deadline": "2025-01-25", "percentage": 40.0},
                {"desc": "Testing y deploy", "amount": 1650.0, "deadline": "2025-02-01", "percentage": 30.0}
            ],
            "risks": ["Complejidad técnica", "Integración de APIs"],
            "mitigation_strategies": ["Reuniones semanales", "Testing continuo"],
            "rationale": "Aumento del 10% por complejidad media",
            "confidence_score": 0.85,
            "negotiation_tips": ["Destacar experiencia", "Mostrar portfolio"]
        })
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client
        
        agent = NegotiationAgent()
        sample_input = AgentInput(
            parsed={
                "amount": 5000,
                "days": 30,
                "description": "Desarrollo de aplicación web React",
                "skills": ["React", "Node.js", "MongoDB"],
                "experience": "3 años"
            },
            role="freelancer",
            complexity="medium"
        )
        
        result = agent.run(sample_input)
        
        # Verificar estructura del output
        assert "counter_offer" in result
        assert "milestones" in result
        assert "risks" in result
        assert "mitigation_strategies" in result
        assert "rationale" in result
        assert "confidence_score" in result
        assert "negotiation_tips" in result
        assert "disclaimer" in result
        
        # Verificar tipos de datos
        assert isinstance(result["counter_offer"], (int, float))
        assert isinstance(result["milestones"], list)
        assert isinstance(result["risks"], list)
        assert isinstance(result["confidence_score"], (int, float))


class TestContractGeneratorAgentMock:
    """Tests para ContractGeneratorAgent con mocks."""
    
    @patch('agents.OpenAI')
    def test_contract_generator_output_structure(self, mock_openai):
        """Test que el output tiene la estructura correcta."""
        # Mock del cliente OpenAI
        mock_client = Mock()
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = json.dumps({
            "contract_id": "gig_2025-01-02T15:30:00",
            "full_terms": "Contrato para desarrollo de aplicación web...",
            "escrow_params": {
                "token": "USDC",
                "network": "Polygon",
                "total_amount": 5500.0,
                "milestones": [
                    {"id": "milestone_1", "description": "Setup inicial", "amount": 1650.0, "deadline": "2025-01-15", "percentage": 30.0}
                ]
            },
            "solidity_stubs": {
                "contract_name": "GigContract",
                "functions": ["createMilestone", "releaseFunds", "disputeResolution"],
                "events": ["MilestoneCompleted", "FundsReleased"],
                "modifiers": ["onlyFreelancer", "onlyClient"]
            },
            "clauses": [
                {"type": "payment", "title": "Términos de Pago", "content": "Pagos por milestones", "importance": "high"}
            ],
            "compliance": {
                "mica_compliant": True,
                "gdpr_compliant": True,
                "legal_notes": ["Cumple con regulaciones europeas"]
            },
            "deployment_ready": True,
            "estimated_gas": 150000
        })
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client
        
        agent = ContractGeneratorAgent()
        sample_negotiation = {
            "counter_offer": 5500.0,
            "milestones": [
                {"desc": "Setup inicial", "amount": 1650.0, "deadline": "2025-01-15", "percentage": 30.0}
            ],
            "risks": ["Complejidad técnica"],
            "rationale": "Proyecto de complejidad media"
        }
        
        result = agent.run(sample_negotiation)
        
        # Verificar estructura del output
        assert "contract_id" in result
        assert "full_terms" in result
        assert "escrow_params" in result
        assert "solidity_stubs" in result
        assert "clauses" in result
        assert "compliance" in result
        assert "deployment_ready" in result
        assert "estimated_gas" in result
        assert "disclaimer" in result
        
        # Verificar tipos de datos
        assert isinstance(result["contract_id"], str)
        assert isinstance(result["escrow_params"], dict)
        assert isinstance(result["solidity_stubs"], dict)
        assert isinstance(result["clauses"], list)
        assert isinstance(result["compliance"], dict)
        assert isinstance(result["deployment_ready"], bool)
        assert isinstance(result["estimated_gas"], int)


class TestQualityAgentMock:
    """Tests para QualityAgent con mocks."""
    
    @patch('agents.OpenAI')
    def test_quality_agent_output_structure(self, mock_openai):
        """Test que el output tiene la estructura correcta."""
        # Mock del cliente OpenAI
        mock_client = Mock()
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = json.dumps({
            "quality_score": 85.5,
            "technical_compliance": 90.0,
            "code_quality": "good",
            "documentation_quality": "excellent",
            "testing_coverage": 75.0,
            "best_practices_score": 80.0,
            "improvement_suggestions": ["Añadir más tests unitarios", "Mejorar comentarios"],
            "approval_recommendation": "approve",
            "detailed_feedback": "Trabajo de buena calidad con documentación excelente"
        })
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client
        
        agent = QualityAgent()
        sample_work = {
            "contract": {"contract_id": "test_contract"},
            "deliverables": ["código fuente", "documentación", "tests"],
            "work_samples": ["archivo1.js", "archivo2.css"]
        }
        
        result = agent.run(sample_work)
        
        # Verificar estructura del output
        assert "quality_score" in result
        assert "technical_compliance" in result
        assert "code_quality" in result
        assert "documentation_quality" in result
        assert "testing_coverage" in result
        assert "best_practices_score" in result
        assert "improvement_suggestions" in result
        assert "approval_recommendation" in result
        assert "detailed_feedback" in result
        assert "disclaimer" in result
        
        # Verificar tipos de datos
        assert isinstance(result["quality_score"], (int, float))
        assert result["code_quality"] in ["excellent", "good", "fair", "poor"]
        assert result["approval_recommendation"] in ["approve", "request_changes", "reject"]


class TestPaymentAgentMock:
    """Tests para PaymentAgent con mocks."""
    
    @patch('agents.OpenAI')
    def test_payment_agent_output_structure(self, mock_openai):
        """Test que el output tiene la estructura correcta."""
        # Mock del cliente OpenAI
        mock_client = Mock()
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = json.dumps({
            "payment_id": "pay_2025-01-02T15:30:00",
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
                "milestone_id": "milestone_1",
                "amount_to_release": 1000.0,
                "release_conditions_met": True
            },
            "transaction_hash": "0xabc123...",
            "estimated_completion": "2025-01-02T15:35:00Z"
        })
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client
        
        agent = PaymentAgent()
        sample_payment = {
            "contract": {"contract_id": "test_contract"},
            "payment_info": {"amount": 1000.0, "currency": "USDC"},
            "wallet_addresses": {"sender": "0x123...", "receiver": "0x456..."}
        }
        
        result = agent.run(sample_payment)
        
        # Verificar estructura del output
        assert "payment_id" in result
        assert "transaction_status" in result
        assert "amount_usdc" in result
        assert "fees" in result
        assert "wallet_validation" in result
        assert "milestone_release" in result
        assert "transaction_hash" in result
        assert "estimated_completion" in result
        assert "disclaimer" in result
        
        # Verificar tipos de datos
        assert isinstance(result["amount_usdc"], (int, float))
        assert isinstance(result["fees"], dict)
        assert isinstance(result["wallet_validation"], dict)
        assert result["transaction_status"] in ["pending", "processing", "completed", "failed"]


class TestDisputeResolverAgentMock:
    """Tests para DisputeResolverAgent con mocks."""
    
    @patch('agents.OpenAI')
    def test_dispute_resolver_output_structure(self, mock_openai):
        """Test que el output tiene la estructura correcta."""
        # Mock del cliente OpenAI
        mock_client = Mock()
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = json.dumps({
            "dispute_id": "dispute_2025-01-02T15:30:00",
            "compliance_percentage": 75.0,
            "resolution": "mediate",
            "reasoning": "Trabajo parcialmente completado, requiere ajustes menores",
            "evidence_analysis": {
                "work_quality": "good",
                "timeline_compliance": "delayed",
                "communication": "excellent"
            },
            "recommended_action": "Solicitar ajustes específicos y nueva fecha límite",
            "oracle_query": "Verificar estado del milestone en blockchain",
            "confidence_score": 0.8,
            "next_steps": ["Revisar entregables", "Establecer nueva fecha", "Monitorear progreso"]
        })
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client
        
        agent = DisputeResolverAgent()
        sample_dispute = {
            "contract": {"contract_id": "test_contract"},
            "negotiation": {"counter_offer": 1000.0},
            "evidence": ["screenshot1.png", "email_thread.txt"]
        }
        
        result = agent.run(sample_dispute)
        
        # Verificar estructura del output
        assert "dispute_id" in result
        assert "compliance_percentage" in result
        assert "resolution" in result
        assert "reasoning" in result
        assert "evidence_analysis" in result
        assert "recommended_action" in result
        assert "oracle_query" in result
        assert "confidence_score" in result
        assert "next_steps" in result
        assert "disclaimer" in result
        
        # Verificar tipos de datos
        assert isinstance(result["compliance_percentage"], (int, float))
        assert result["resolution"] in ["release", "refund", "mediate", "escalate"]
        assert isinstance(result["evidence_analysis"], dict)
        assert isinstance(result["confidence_score"], (int, float))


class TestAgentChainingMock:
    """Tests para el sistema de chaining de agents con mocks."""
    
    @patch('agents.OpenAI')
    def test_chain_agents_basic_flow(self, mock_openai):
        """Test del flujo básico de chaining."""
        # Mock del cliente OpenAI
        mock_client = Mock()
        mock_response = Mock()
        mock_response.choices = [Mock()]
        
        # Mock para NegotiationAgent
        negotiation_response = {
            "counter_offer": 3300.0,
            "milestones": [{"desc": "Conceptos iniciales", "amount": 990.0, "deadline": "2025-01-10", "percentage": 30.0}],
            "risks": ["Subjetividad del diseño"],
            "rationale": "Aumento del 10% por baja complejidad"
        }
        
        # Mock para ContractGeneratorAgent
        contract_response = {
            "contract_id": "gig_2025-01-02T15:30:00",
            "full_terms": "Contrato para diseño de logo...",
            "escrow_params": {"token": "USDC", "total_amount": 3300.0}
        }
        
        # Configurar respuestas alternadas
        mock_response.choices[0].message.content = json.dumps(negotiation_response)
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client
        
        sample_input = AgentInput(
            parsed={
                "amount": 3000,
                "days": 15,
                "description": "Diseño de logo y branding",
                "skills": ["Photoshop", "Illustrator", "Branding"],
                "experience": "2 años"
            },
            role="freelancer",
            complexity="low"
        )
        
        result = chain_agents(sample_input)
        
        # Verificar estructura del resultado
        assert "negotiation" in result
        assert "contract" in result
        assert "chain_metadata" in result
        
        # Verificar metadata del chain
        assert "agents_used" in result["chain_metadata"]
        assert "NegotiationAgent" in result["chain_metadata"]["agents_used"]
        assert "ContractGeneratorAgent" in result["chain_metadata"]["agents_used"]
        assert result["chain_metadata"]["complexity"] == "low"
    
    @patch('agents.OpenAI')
    def test_chain_agents_with_quality(self, mock_openai):
        """Test del chaining con QualityAgent."""
        # Mock del cliente OpenAI
        mock_client = Mock()
        mock_response = Mock()
        mock_response.choices = [Mock()]
        
        # Mock responses
        responses = [
            {"counter_offer": 3000.0},  # NegotiationAgent
            {"contract_id": "test"},    # ContractGeneratorAgent
            {"quality_score": 85.0, "approval_recommendation": "approve"}  # QualityAgent
        ]
        
        def side_effect(*args, **kwargs):
            response = responses.pop(0) if responses else {}
            mock_response.choices[0].message.content = json.dumps(response)
            return mock_response
        
        mock_client.chat.completions.create.side_effect = side_effect
        mock_openai.return_value = mock_client
        
        sample_input = AgentInput(
            parsed={
                "amount": 3000,
                "days": 15,
                "description": "Diseño de logo",
                "deliverables": ["logo.psd", "brand_guide.pdf"],
                "work_samples": ["sample1.jpg"]
            },
            role="freelancer",
            complexity="low"
        )
        
        result = chain_agents(sample_input)
        
        # Verificar que QualityAgent se incluyó
        assert "quality_assessment" in result
        assert "QualityAgent" in result["chain_metadata"]["agents_used"]
    
    @patch('agents.OpenAI')
    def test_chain_agents_high_complexity(self, mock_openai):
        """Test del chaining para casos de alta complejidad."""
        # Mock del cliente OpenAI
        mock_client = Mock()
        mock_response = Mock()
        mock_response.choices = [Mock()]
        
        # Mock responses
        responses = [
            {"counter_offer": 8000.0},  # NegotiationAgent
            {"contract_id": "test"},    # ContractGeneratorAgent
            {"resolution": "mediate"}   # DisputeResolverAgent
        ]
        
        def side_effect(*args, **kwargs):
            response = responses.pop(0) if responses else {}
            mock_response.choices[0].message.content = json.dumps(response)
            return mock_response
        
        mock_client.chat.completions.create.side_effect = side_effect
        mock_openai.return_value = mock_client
        
        high_complexity_input = AgentInput(
            parsed={"amount": 10000, "days": 60, "description": "Aplicación compleja"},
            role="freelancer",
            complexity="high"
        )
        
        result = chain_agents(high_complexity_input)
        
        # Verificar que DisputeResolverAgent se incluyó
        assert "dispute_resolution" in result
        assert "DisputeResolverAgent" in result["chain_metadata"]["agents_used"]


class TestAgentStatusMock:
    """Tests para el estado de los agents."""
    
    def test_get_agent_status(self):
        """Test que get_agent_status retorna información correcta."""
        status = get_agent_status()
        
        # Verificar estructura
        assert "available_agents" in status
        assert "openai_configured" in status
        assert "model" in status
        assert "temperature" in status
        
        # Verificar agents disponibles
        agent_names = [agent["name"] for agent in status["available_agents"]]
        assert "NegotiationAgent" in agent_names
        assert "ContractGeneratorAgent" in agent_names
        assert "QualityAgent" in agent_names
        assert "PaymentAgent" in agent_names
        assert "DisputeResolverAgent" in agent_names
        
        # Verificar configuración
        assert status["model"] == "gpt-4o-mini"
        assert status["temperature"] == 0.1
        assert isinstance(status["openai_configured"], bool)


if __name__ == "__main__":
    # Ejecutar tests
    pytest.main([__file__, "-v"])
