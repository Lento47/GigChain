import json
import pathlib
import sys

import pytest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from contract_ai import generate_contract


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

    input_text = "Cliente ofrece 3000 USDC por dashboard de analíticas en 10 días."
    monkeypatch.setattr("builtins.input", lambda: input_text)
    output_file = tmp_path / "output.json"

    def fake_print(value: str):
        output_file.write_text(value)

    monkeypatch.setattr("builtins.print", fake_print)

    main()

    data = json.loads(output_file.read_text())
    assert data["contrato"]["milestones"][0]["pago_parcial"].endswith("USDC")
    assert "Polygon" in data["contrato"]["riesgos"][0]


def test_invalid_input():
    with pytest.raises(ValueError):
        generate_contract("   ")
