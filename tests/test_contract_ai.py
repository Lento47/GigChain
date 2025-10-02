import json
import pathlib
import sys
from unittest.mock import patch, MagicMock

import pytest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from contract_ai import generate_contract, full_flow


def _load_output(text: str):
    result = generate_contract(text)
    assert "contrato" in result
    assert "explicacion" in result
    return result


def test_basic_contract_structure():
    result = _load_output("Cliente ofrece $4000 por logo NFT en 5 días. Soy freelancer, quiero $5000.")
    contrato = result["contrato"]
    assert contrato["total"].endswith("USDC")
    assert len(contrato["milestones"]) == 3
    for milestone in contrato["milestones"]:
        assert set(milestone.keys()) == {"descripcion", "deadline", "pago_parcial"}
        # deadline should parse to ISO date
        iso_parts = milestone["deadline"].split("-")
        assert len(iso_parts) == 3
    assert any("escrow" in clause.lower() for clause in contrato["clausulas"])
    assert result["explicacion"].startswith("Contrato listo")


def test_default_values_when_missing_numbers():
    result = _load_output("Necesito ayuda para coordinar un hackathon web3 en menos de una semana.")
    contrato = result["contrato"]
    assert contrato["total"].startswith("5000")
    assert any("Plazo ajustado" in riesgo for riesgo in contrato["riesgos"])


def test_cli_serialization(tmp_path, monkeypatch):
    from contract_ai import main
    import sys

    input_text = "Cliente ofrece 3000 USDC por dashboard de analíticas en 10 días."
    monkeypatch.setattr("builtins.input", lambda: input_text)
    output_file = tmp_path / "output.json"

    def fake_print(value: str):
        output_file.write_text(value)

    monkeypatch.setattr("builtins.print", fake_print)
    # Clear sys.argv to avoid pytest arguments interfering
    monkeypatch.setattr("sys.argv", ["contract_ai.py"])

    main()

    data = json.loads(output_file.read_text())
    assert data["contrato"]["milestones"][0]["pago_parcial"].endswith("USDC")
    assert "Polygon" in data["contrato"]["riesgos"][0]


def test_invalid_input():
    with pytest.raises(ValueError):
        generate_contract("   ")


# Agent chaining tests
@patch('agents.chain_agents')
def test_full_flow_chaining(mock_chain):
    """Test full_flow with agent chaining for complex negotiations."""
    mock_chain.return_value = {
        "counter_offer": 4500.0, 
        "milestones": [
            {"desc": "Initial setup", "amount": 1350.0, "deadline": "2025-01-15"},
            {"desc": "Final delivery", "amount": 3150.0, "deadline": "2025-01-20"}
        ], 
        "risks": ["High complexity negotiation"],
        "rationale": "Balanced offer based on complexity",
        "disclaimer": "Este es un borrador AI generado por GigChain.io. No constituye consejo legal. Cumple con MiCA/GDPR – consulta a un experto."
    }
    
    result = full_flow("Cliente ofrece $4K por logo NFT en 5 días. Quiero $5K.")
    
    assert "contract_id" in result
    assert "json" in result
    assert result["escrow_ready"] is True
    assert result["json"]["counter_offer"] == 4500.0
    assert "disclaimer" in result["json"]
    mock_chain.assert_called_once()


@patch('agents.chain_agents')
def test_full_flow_low_complexity_fallback(mock_chain):
    """Test full_flow falls back to rule-based for low complexity."""
    # Use a very simple case with no negotiation, no risks
    result = full_flow("Need help with basic task")
    
    assert "contrato" in result  # Rule-based output structure
    assert "explicacion" in result
    assert "json" not in result  # No AI output
    mock_chain.assert_not_called()


@patch('agents.chain_agents')
def test_full_flow_error_handling(mock_chain):
    """Test full_flow handles agent errors gracefully."""
    mock_chain.side_effect = ValueError("Agent error: API failed")
    
    with pytest.raises(ValueError, match="Agent error: API failed"):
        full_flow("Complex negotiation with $10K budget and tight deadlines")
