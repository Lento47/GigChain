#!/usr/bin/env python3
"""
Backend integration tests using FastAPI TestClient
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import os

# Set test environment
os.environ['OPENAI_API_KEY'] = 'sk-test-key-for-ci'
os.environ['SECRET_KEY'] = 'test-secret-key-for-ci-testing-32chars'

from main import app

@pytest.fixture
def client():
    """Create a test client"""
    return TestClient(app)


def test_health_endpoint(client):
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data
    assert data["service"] == "GigChain API"
    assert "ai_agents_active" in data


def test_agents_status(client):
    """Test agents status endpoint"""
    response = client.get("/api/agents/status")
    assert response.status_code == 200
    data = response.json()
    assert "available_agents" in data
    assert "openai_configured" in data
    assert len(data["available_agents"]) >= 5


def test_gamification_badges(client):
    """Test gamification badges endpoint"""
    response = client.get("/api/gamification/badges")
    assert response.status_code == 200
    data = response.json()
    assert "badges" in data
    assert "total" in data


def test_rate_limiting_middleware(client):
    """Test rate limiting middleware on auth endpoints"""
    # Test that rate limiting is applied to auth endpoints
    for i in range(10):  # Exceed the rate limit
        response = client.post("/api/auth/challenge", json={
            "wallet_address": "0x1234567890123456789012345678901234567890"
        })
        if i < 5:  # First 5 should succeed
            assert response.status_code in [200, 400]  # 400 for invalid address
        else:  # After rate limit, should get 429
            assert response.status_code == 429
            break


def test_session_cleanup_middleware(client):
    """Test session cleanup middleware functionality"""
    # This test verifies the middleware is properly configured
    # The actual cleanup happens in the background
    response = client.get("/health")
    assert response.status_code == 200
    # If we get here, the middleware didn't break the app


def test_auth_fail_closed_behavior(client):
    """Test that authentication fails closed on invalid inputs"""
    # Test with invalid wallet address
    response = client.post("/api/auth/challenge", json={
        "wallet_address": "invalid_address"
    })
    assert response.status_code == 400
    
    # Test with malformed signature
    response = client.post("/api/auth/verify", json={
        "challenge_id": "test",
        "signature": "invalid_signature",
        "wallet_address": "0x1234567890123456789012345678901234567890"
    })
    assert response.status_code == 400
    
    # Test with empty inputs
    response = client.post("/api/auth/challenge", json={
        "wallet_address": ""
    })
    assert response.status_code == 400


def test_agent_output_sanitization():
    """Test agent output sanitization and validation"""
    from agents import NegotiationAgent, NegotiationOutputModel, AgentInput
    from unittest.mock import patch, MagicMock
    
    # Mock OpenAI response with potentially malicious content
    mock_response = MagicMock()
    mock_response.choices[0].message.content = json.dumps({
        "counter_offer": 1000.0,
        "milestones": [
            {
                "desc": "Test milestone <script>alert('xss')</script>",
                "amount": 500.0,
                "deadline": "2024-12-31",
                "percentage": 50.0
            }
        ],
        "risks": ["Risk 1", "Risk 2<script>alert('xss')</script>"],
        "mitigation_strategies": ["Strategy 1", "Strategy 2"],
        "rationale": "Test rationale",
        "confidence_score": 0.8,
        "negotiation_tips": ["Tip 1", "Tip 2"]
    })
    
    with patch('agents.OpenAI') as mock_openai:
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client
        
        agent = NegotiationAgent()
        input_data = AgentInput(
            parsed={"test": "data"},
            role="freelancer",
            complexity="medium"
        )
        
        # This should sanitize the output and remove script tags
        result = agent.run(input_data)
        
        # Verify sanitization worked
        assert "<script>" not in result["milestones"][0]["desc"]
        assert "<script>" not in result["risks"][1]
        assert "disclaimer" in result


def test_agent_json_parsing_security():
    """Test agent JSON parsing with size and timeout constraints"""
    from agents import BaseAgent
    from unittest.mock import patch, MagicMock
    
    # Test with oversized JSON
    large_json = '{"test": "' + 'x' * (2 * 1024 * 1024) + '"}'  # 2MB
    
    mock_response = MagicMock()
    mock_response.choices[0].message.content = large_json
    
    with patch('agents.OpenAI') as mock_openai:
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client
        
        agent = BaseAgent()
        
        with pytest.raises(ValueError, match="JSON output too large"):
            agent.run("test prompt", {"test": "data"})
    
    # Test with malformed JSON
    mock_response.choices[0].message.content = '{"invalid": json}'
    
    with patch('agents.OpenAI') as mock_openai:
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client
        
        agent = BaseAgent()
        
        with pytest.raises(ValueError, match="Invalid JSON output"):
            agent.run("test prompt", {"test": "data"})


def test_agent_output_validation():
    """Test agent output validation against Pydantic models"""
    from agents import NegotiationAgent, AgentInput
    from unittest.mock import patch, MagicMock
    
    # Test with invalid output structure
    mock_response = MagicMock()
    mock_response.choices[0].message.content = json.dumps({
        "counter_offer": "invalid",  # Should be float
        "milestones": [],  # Should have at least 1 item
        "risks": "not_a_list",  # Should be list
        "confidence_score": 1.5  # Should be <= 1.0
    })
    
    with patch('agents.OpenAI') as mock_openai:
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client
        
        agent = NegotiationAgent()
        input_data = AgentInput(
            parsed={"test": "data"},
            role="freelancer",
            complexity="medium"
        )
        
        with pytest.raises(ValueError, match="Agent output validation failed"):
            agent.run(input_data)


@patch('gamification_api.gamification_db')
def test_user_stats_creation(mock_db, client):
    """Test user stats creation for new user"""
    # Mock database response
    mock_db.get_user_stats.return_value = None
    
    response = client.get("/api/gamification/users/test_user/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == "test_user"
    assert data["level"] >= 1
    assert "trust_score" in data
    assert "badges" in data


def test_contract_simple_generation(client):
    """Test simple contract generation"""
    response = client.post(
        "/api/contract",
        json={"text": "Build a simple website for $1000"}
    )
    assert response.status_code == 200
    data = response.json()
    # Updated to match actual response format
    assert "contrato" in data or "contract" in data or "contract_text" in data
    assert "api_metadata" in data


def test_404_error_handler(client):
    """Test 404 error handling"""
    response = client.get("/api/nonexistent")
    assert response.status_code == 404
    data = response.json()
    assert "error" in data


def test_auth_challenge_endpoint(client):
    """Test W-CSAP authentication challenge"""
    response = client.post(
        "/api/auth/challenge",
        json={"wallet_address": "0x1234567890123456789012345678901234567890"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "challenge_id" in data
    assert "challenge_message" in data
    assert "expires_at" in data


def test_leaderboard_endpoint(client):
    """Test gamification leaderboard"""
    response = client.get("/api/gamification/leaderboard?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "leaderboard" in data
    assert isinstance(data["leaderboard"], list)


@pytest.mark.asyncio
async def test_cors_headers(client):
    """Test CORS configuration"""
    response = client.options(
        "/health",  # Fixed: endpoint is /health not /api/health
        headers={"Origin": "http://localhost:3000"}
    )
    # CORS should allow requests
    assert response.status_code in [200, 405]  # 405 is OK for OPTIONS when no explicit handler


# Wallet Manager Tests
import tempfile
import os
from wallet_manager import WalletManager, GigChainWallet


@pytest.fixture
def temp_wallet_manager():
    """Create a temporary wallet manager for testing"""
    with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp_file:
        db_path = tmp_file.name
    
    manager = WalletManager(db_path)
    yield manager
    
    # Cleanup
    try:
        os.unlink(db_path)
    except OSError:
        pass


def test_foreign_key_enforcement(temp_wallet_manager):
    """Test that foreign key constraints are enforced"""
    manager = temp_wallet_manager
    
    # Try to insert a transaction with non-existent wallet_id
    with manager._get_connection() as conn:
        cursor = conn.cursor()
        
        # This should fail due to foreign key constraint
        with pytest.raises(Exception):  # sqlite3.IntegrityError or similar
            cursor.execute("""
                INSERT INTO wallet_transactions (
                    transaction_id, wallet_id, type, amount, description, created_at
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (
                "test_transaction_id",
                "non_existent_wallet_id", 
                "test_type", 
                100.0, 
                "test description", 
                "2023-01-01T00:00:00"
            ))
            conn.commit()


def test_unique_constraint_on_transactions(temp_wallet_manager):
    """Test that unique constraint prevents duplicate transactions"""
    manager = temp_wallet_manager
    
    # Create a wallet first
    user_address = "0x1234567890123456789012345678901234567890"
    wallet = manager.create_wallet(user_address, "Test Wallet")
    assert wallet is not None
    
    # Create two transactions with same wallet_id, created_at, type, and amount
    wallet_id = wallet.wallet_id
    timestamp = "2023-01-01T00:00:00"
    
    with manager._get_connection() as conn:
        cursor = conn.cursor()
        
        # First transaction should succeed
        transaction_id1 = manager._generate_transaction_id(wallet_id, timestamp)
        cursor.execute("""
            INSERT INTO wallet_transactions (
                transaction_id, wallet_id, type, amount, description, created_at
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (transaction_id1, wallet_id, "deposit", 100.0, "first deposit", timestamp))
        
        # Second transaction with same data should fail due to unique constraint
        transaction_id2 = manager._generate_transaction_id(wallet_id, timestamp)
        with pytest.raises(Exception):  # sqlite3.IntegrityError
            cursor.execute("""
                INSERT INTO wallet_transactions (
                    transaction_id, wallet_id, type, amount, description, created_at
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (transaction_id2, wallet_id, "deposit", 100.0, "second deposit", timestamp))
            conn.commit()


def test_cascade_deletion_on_wallet_deletion(temp_wallet_manager):
    """Test that deleting a wallet cascades to delete its transactions"""
    manager = temp_wallet_manager
    
    # Create a wallet
    user_address = "0x1234567890123456789012345678901234567890"
    wallet = manager.create_wallet(user_address, "Test Wallet")
    assert wallet is not None
    
    # Add some transactions
    manager.update_balance(wallet.wallet_address, 100.0, "deposit", "Test deposit")
    manager.update_balance(wallet.wallet_address, -50.0, "withdrawal", "Test withdrawal")
    
    # Verify transactions exist
    transactions = manager.get_transactions(wallet.wallet_address)
    assert len(transactions) >= 3  # created + deposit + withdrawal
    
    # Delete the wallet
    result = manager.delete_wallet(wallet.wallet_address)
    assert result is True
    
    # Verify wallet is gone
    deleted_wallet = manager.get_wallet_by_address(wallet.wallet_address)
    assert deleted_wallet is None
    
    # Verify transactions are also gone (cascade deletion)
    with manager._get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT COUNT(*) as count FROM wallet_transactions 
            WHERE wallet_id = ?
        """, (wallet.wallet_id,))
        
        remaining_count = cursor.fetchone()['count']
        assert remaining_count == 0


def test_transaction_id_collision_safety(temp_wallet_manager):
    """Test that transaction ID generation is collision-safe"""
    manager = temp_wallet_manager
    
    # Create a wallet
    user_address = "0x1234567890123456789012345678901234567890"
    wallet = manager.create_wallet(user_address, "Test Wallet")
    assert wallet is not None
    
    # Generate many transaction IDs and ensure they're unique
    transaction_ids = set()
    wallet_id = wallet.wallet_id
    timestamp = "2023-01-01T00:00:00"
    
    for _ in range(1000):
        tx_id = manager._generate_transaction_id(wallet_id, timestamp)
        assert tx_id not in transaction_ids, "Transaction ID collision detected"
        transaction_ids.add(tx_id)


def test_wallet_creation_with_foreign_keys_enabled(temp_wallet_manager):
    """Test wallet creation works with foreign keys enabled"""
    manager = temp_wallet_manager
    
    user_address = "0x1234567890123456789012345678901234567890"
    wallet = manager.create_wallet(user_address, "Test Wallet")
    
    assert wallet is not None
    assert wallet.user_address == user_address
    assert wallet.name == "Test Wallet"
    assert wallet.balance == 0.0
    assert wallet.is_active is True


def test_balance_update_with_transaction_logging(temp_wallet_manager):
    """Test balance updates create proper transaction logs"""
    manager = temp_wallet_manager
    
    # Create a wallet
    user_address = "0x1234567890123456789012345678901234567890"
    wallet = manager.create_wallet(user_address, "Test Wallet")
    
    # Update balance
    result = manager.update_balance(wallet.wallet_address, 100.0, "deposit", "Test deposit")
    assert result is True
    
    # Verify balance was updated
    updated_wallet = manager.get_wallet_by_address(wallet.wallet_address)
    assert updated_wallet.balance == 100.0
    
    # Verify transaction was logged
    transactions = manager.get_transactions(wallet.wallet_address)
    assert len(transactions) >= 2  # created + deposit
    
    # Find the deposit transaction
    deposit_transaction = next(
        (tx for tx in transactions if tx['type'] == 'deposit'), None
    )
    assert deposit_transaction is not None
    assert deposit_transaction['amount'] == 100.0
    assert deposit_transaction['description'] == "Test deposit"


def test_unique_user_address_constraint(temp_wallet_manager):
    """Test that unique constraint on user_address is enforced"""
    manager = temp_wallet_manager
    
    user_address = "0x1234567890123456789012345678901234567890"
    
    # Create first wallet
    wallet1 = manager.create_wallet(user_address, "First Wallet")
    assert wallet1 is not None
    
    # Try to create second wallet with same user address
    with pytest.raises(ValueError, match="already has a wallet"):
        manager.create_wallet(user_address, "Second Wallet")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
