"""Tests for Flask API endpoints."""

import json
import pathlib
import sys
from unittest.mock import patch, MagicMock

import pytest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from app import app


@pytest.fixture
def client():
    """Create test client for Flask app."""
    app.config['TESTING'] = True
    app.config['OPENAI_API_KEY'] = 'test-key'
    with app.test_client() as client:
        yield client


def test_health_endpoint(client):
    """Test health check endpoint."""
    response = client.get('/health')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert data['status'] == 'healthy'
    assert 'timestamp' in data
    assert data['service'] == 'GigChain API'


def test_full_flow_endpoint_missing_text(client):
    """Test full_flow endpoint with missing text field."""
    response = client.post('/api/full_flow', 
                          data=json.dumps({}),
                          content_type='application/json')
    assert response.status_code == 400
    
    data = json.loads(response.data)
    assert 'error' in data
    assert 'Missing required field: text' in data['error']


def test_full_flow_endpoint_empty_text(client):
    """Test full_flow endpoint with empty text."""
    response = client.post('/api/full_flow',
                          data=json.dumps({'text': ''}),
                          content_type='application/json')
    assert response.status_code == 400
    
    data = json.loads(response.data)
    assert 'error' in data
    assert 'Empty text field' in data['error']


@patch('app.full_flow')
def test_full_flow_endpoint_success(mock_full_flow, client):
    """Test successful full_flow endpoint."""
    mock_full_flow.return_value = {
        'contract_id': 'gig_test',
        'json': {'counter_offer': 4500.0},
        'escrow_ready': True
    }
    
    response = client.post('/api/full_flow',
                          data=json.dumps({'text': 'Test contract'}),
                          content_type='application/json')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert data['contract_id'] == 'gig_test'
    assert data['escrow_ready'] is True
    assert 'api_metadata' in data


@patch('app.full_flow')
def test_full_flow_endpoint_error(mock_full_flow, client):
    """Test full_flow endpoint with error."""
    mock_full_flow.side_effect = ValueError('Test error')
    
    response = client.post('/api/full_flow',
                          data=json.dumps({'text': 'Test contract'}),
                          content_type='application/json')
    assert response.status_code == 400
    
    data = json.loads(response.data)
    assert data['error'] == 'Validation error'
    assert data['message'] == 'Test error'


def test_contract_endpoint_missing_text(client):
    """Test contract endpoint with missing text field."""
    response = client.post('/api/contract',
                          data=json.dumps({}),
                          content_type='application/json')
    assert response.status_code == 400
    
    data = json.loads(response.data)
    assert 'error' in data
    assert 'Missing required field: text' in data['error']


@patch('app.generate_contract')
def test_contract_endpoint_success(mock_generate_contract, client):
    """Test successful contract endpoint."""
    mock_generate_contract.return_value = {
        'contrato': {'total': '1000.00 USDC'},
        'explicacion': 'Test explanation'
    }
    
    response = client.post('/api/contract',
                          data=json.dumps({'text': 'Simple contract'}),
                          content_type='application/json')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert 'contrato' in data
    assert 'api_metadata' in data


def test_404_endpoint(client):
    """Test 404 for non-existent endpoint."""
    response = client.get('/non-existent')
    assert response.status_code == 404
    
    data = json.loads(response.data)
    assert data['error'] == 'Endpoint not found'
    assert 'available_endpoints' in data


def test_405_method_not_allowed(client):
    """Test 405 for wrong HTTP method."""
    response = client.get('/api/full_flow')
    assert response.status_code == 405
    
    data = json.loads(response.data)
    assert data['error'] == 'Method not allowed'


@patch.dict('os.environ', {}, clear=True)
def test_missing_openai_key(client):
    """Test behavior when OpenAI API key is missing."""
    # Remove the test key we set in the fixture
    app.config['OPENAI_API_KEY'] = None
    
    response = client.post('/api/full_flow',
                          data=json.dumps({'text': 'Test'}),
                          content_type='application/json')
    assert response.status_code == 500
    
    data = json.loads(response.data)
    assert 'OpenAI API key not configured' in data['error']
