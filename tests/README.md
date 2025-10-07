# GigChain.io Test Suite

## 📁 Test Organization

This directory contains all tests for the GigChain.io backend. Tests are organized by type:

### Unit Tests (Pytest)
These tests run automatically with `pytest` and don't require a running server:

- `test_contract_ai.py` - Contract generation logic tests
- `test_agents_mock.py` - AI agents with mocked OpenAI responses
- `test_agents_enhanced.py` - Enhanced agent tests
- `test_w_csap_auth.py` - W-CSAP authentication protocol tests
- `test_backend.py` - Backend basic tests

### Integration Tests (Pytest)
These tests use FastAPI TestClient and test the full API:

- `test_api.py` - API endpoint tests with TestClient
- `test_agents_endpoints.py` - Agent management endpoint tests

### Integration Scripts (Manual)
These scripts require a running server on `localhost:8000`:

- `integration_chat.py` - Chat AI integration tests (run with `python tests/integration_chat.py`)
- `integration_security.py` - Security validation integration tests (run with `python tests/integration_security.py`)

---

## 🚀 Running Tests

### Run All Unit and Integration Tests
```bash
# From project root
pytest tests/ -v

# With coverage
pytest tests/ -v --cov=. --cov-report=html

# Parallel execution (faster)
pytest tests/ -n auto
```

### Run Specific Test Files
```bash
# Contract AI tests
pytest tests/test_contract_ai.py -v

# Authentication tests
pytest tests/test_w_csap_auth.py -v

# API endpoint tests
pytest tests/test_api.py -v

# All agent tests
pytest tests/test_agents*.py -v
```

### Run Integration Scripts
```bash
# Start the server first
python main.py

# In another terminal:
python tests/integration_chat.py
python tests/integration_security.py
```

---

## 📊 Test Coverage

To generate a coverage report:

```bash
# HTML report
pytest tests/ --cov=. --cov-report=html
open htmlcov/index.html  # View in browser

# Terminal report
pytest tests/ --cov=. --cov-report=term

# XML report (for CI/CD)
pytest tests/ --cov=. --cov-report=xml
```

---

## 🧪 Test Types Explained

### Unit Tests
- **Purpose**: Test individual functions/classes in isolation
- **Speed**: Very fast (< 1 second per test)
- **Dependencies**: None (mocked)
- **Example**: Testing amount parsing logic

### Integration Tests (TestClient)
- **Purpose**: Test API endpoints with FastAPI TestClient
- **Speed**: Fast (1-5 seconds per test)
- **Dependencies**: FastAPI app (no server needed)
- **Example**: Testing `/api/contract` endpoint

### Integration Scripts
- **Purpose**: End-to-end testing with real server
- **Speed**: Slower (10-30 seconds total)
- **Dependencies**: Running server + OpenAI API key
- **Example**: Complete chat conversation flow

---

## ✅ Test Requirements

### For Unit Tests
```bash
pip install -r requirements.txt
pytest tests/test_*.py -v
```

### For Integration Tests with TestClient
```bash
pip install -r requirements.txt
pytest tests/test_api.py tests/test_agents_endpoints.py -v
```

### For Integration Scripts
```bash
# 1. Start server
python main.py

# 2. In another terminal
python tests/integration_chat.py
python tests/integration_security.py
```

---

## 🔧 Writing New Tests

### Unit Test Template
```python
# tests/test_myfeature.py
import pytest

def test_my_feature():
    """Test description."""
    # Arrange
    input_data = "test"
    
    # Act
    result = my_function(input_data)
    
    # Assert
    assert result == expected_output
```

### Integration Test Template
```python
# tests/test_my_api.py
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_my_endpoint():
    """Test endpoint description."""
    response = client.get("/api/my-endpoint")
    assert response.status_code == 200
    assert "expected_field" in response.json()
```

### Integration Script Template
```python
# tests/integration_myfeature.py
#!/usr/bin/env python3
"""Integration test script for MyFeature."""

import requests

API_BASE = "http://localhost:8000"

def test_my_feature():
    """Test description."""
    response = requests.get(f"{API_BASE}/api/feature")
    assert response.status_code == 200
    print("✅ Test passed")

if __name__ == "__main__":
    test_my_feature()
```

---

## 🐛 Debugging Failed Tests

### View detailed error output
```bash
pytest tests/test_mytest.py -v --tb=long
```

### Run with print statements
```bash
pytest tests/test_mytest.py -v -s
```

### Run single test
```bash
pytest tests/test_mytest.py::test_specific_function -v
```

### Run with PDB debugger
```bash
pytest tests/test_mytest.py --pdb
```

---

## 📈 Current Test Stats

Run this to see current coverage:
```bash
pytest tests/ --cov=. --cov-report=term-missing
```

Expected coverage target: **> 80%**

---

## 🔍 Test Naming Conventions

- `test_*.py` - Pytest discovers these automatically
- `integration_*.py` - Manual integration scripts (not auto-discovered)
- Test functions must start with `test_`
- Test classes must start with `Test`

---

## ⚠️ Common Issues

### "fixture not found" error
- Function parameters are treated as fixtures by pytest
- Solution: Rename to not start with `test_` or add proper fixtures

### "ModuleNotFoundError"
- Missing dependency
- Solution: `pip install -r requirements.txt`

### "OPENAI_API_KEY" errors
- Missing or invalid API key
- Solution: Set in `.env` file or use mocked tests

### "Server not running" in integration scripts
- Integration scripts need running server
- Solution: `python main.py` in separate terminal

---

## 📚 Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [Coverage.py](https://coverage.readthedocs.io/)

---

**Last Updated**: 2025-10-06  
**Test Files**: 9 (7 pytest + 2 integration scripts)
