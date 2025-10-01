"""Tests for the ContractAI generator."""

import datetime as _dt
import json

import pytest

try:
    import contract_ai  # type: ignore
except ModuleNotFoundError:  # pragma: no cover - fallback for REPL execution
    import importlib.util
    from pathlib import Path
    import sys

    module_path = (
        Path(__file__).resolve().parents[1] / "contract_ai.py"
        if "__file__" in globals()
        else Path("contract_ai.py")
    )
    spec = importlib.util.spec_from_file_location("contract_ai", module_path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules.setdefault("contract_ai", module)
    spec.loader.exec_module(module)
    contract_ai = module

_extract_days = contract_ai._extract_days
generate_contract = contract_ai.generate_contract


@pytest.fixture(autouse=True)
def _freeze_today(monkeypatch):
    """Ensure deterministic milestone deadlines across test runs."""

    class _FixedDate(_dt.date):
        @classmethod
        def today(cls):  # type: ignore[override]
            return cls(2025, 1, 15)

    monkeypatch.setattr(contract_ai._dt, "date", _FixedDate)


def _load_output(text: str):
    result = generate_contract(text)
    assert isinstance(result.get("contrato"), dict)
    assert isinstance(result.get("explicacion"), str)
    return result


def test_basic_contract_structure():
    result = _load_output("Cliente ofrece $4000 por logo NFT en 5 días. Soy freelancer, quiero $5000.")
    contrato = result["contrato"]
    assert contrato["total"].endswith("USDC")
    assert len(contrato["milestones"]) == 3
    for milestone in contrato["milestones"]:
        assert set(milestone.keys()) == {"descripcion", "deadline", "pago_parcial"}
        _dt.date.fromisoformat(milestone["deadline"])  # raises if not valid ISO
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


def test_unit_suffix_parsing():
    result = _load_output("Cliente ofrece 1 mil USDC por dashboard en 9 días.")
    assert result["contrato"]["total"].startswith("1000.00")


def test_detects_offer_expectation_gap():
    result = _load_output(
        "Cliente ofrece 2000 USDC por desarrollo, pero como freelancer quiero 2600 USDC."
    )
    assert any(
        "Diferencia notable" in riesgo for riesgo in result["contrato"]["riesgos"]
    )


def test_weeks_are_converted_to_days():
    assert _extract_days("El cliente pide entrega en 2 semanas.") == 14
