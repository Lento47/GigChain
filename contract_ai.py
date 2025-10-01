"""ContractAI: Generate Web3-friendly contract suggestions for gig economy inputs."""

from __future__ import annotations

import argparse
import datetime as _dt
import json
import re
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple


@dataclass
class ParsedAmounts:
    offer: Optional[float] = None
    desired: Optional[float] = None
    other: List[float] = None

    def __post_init__(self) -> None:
        if self.other is None:
            self.other = []


CURRENCY_SYMBOL_PATTERN = re.compile(r"\$\s*(?P<num>\d[\d.,]*)(?P<suffix>\s?(?:k|K|mil)?)")
CURRENCY_UNIT_PATTERN = re.compile(
    r"(?P<num>\d[\d.,]*)\s*(?P<suffix>k|K|mil)?\s*(?P<unit>USDC|USD|dólares|dolares|usdc|usd)",
    re.IGNORECASE,
)
ROLE_PATTERN = re.compile(r"soy\s+(?P<role>freelancer|cliente)", re.IGNORECASE)
DAYS_PATTERN = re.compile(r"(\d+)\s*(días|dias|days)", re.IGNORECASE)
WEEKS_PATTERN = re.compile(r"(\d+)\s*(semanas?|weeks?)", re.IGNORECASE)


def _normalize_number(num_str: str) -> float:
    text = num_str.replace(" ", "")
    if "," in text and "." in text:
        if text.find(".") < text.find(","):
            text = text.replace(".", "").replace(",", ".")
        else:
            text = text.replace(",", "")
    elif text.count(".") == 1 and len(text.split(".")[1]) == 3:
        text = text.replace(".", "")
    elif "," in text:
        text = text.replace(",", ".")
    return float(text)


def _apply_suffix(value: float, suffix: str) -> float:
    suffix = suffix.strip().lower()
    if suffix in {"k"}:
        return value * 1_000
    if suffix == "mil":
        return value * 1_000
    return value


def _extract_amounts(text: str) -> List[Tuple[float, int]]:
    matches: List[Tuple[float, int]] = []
    for match in CURRENCY_SYMBOL_PATTERN.finditer(text):
        amount = _apply_suffix(_normalize_number(match.group("num")), match.group("suffix") or "")
        matches.append((amount, match.start()))
    for match in CURRENCY_UNIT_PATTERN.finditer(text):
        amount = _apply_suffix(
            _normalize_number(match.group("num")), match.group("suffix") or ""
        )
        matches.append((amount, match.start()))
    return matches


def _classify_amounts(text: str, matches: List[Tuple[float, int]]) -> ParsedAmounts:
    parsed = ParsedAmounts()
    lower_text = text.lower()
    for value, index in matches:
        window = lower_text[max(0, index - 40) : index + 40]
        if any(keyword in window for keyword in ["ofrece", "oferta", "budget", "presupuesto"]):
            parsed.offer = value if parsed.offer is None else parsed.offer
        elif any(keyword in window for keyword in ["quiero", "solicito", "pido", "aspir", "busco"]):
            parsed.desired = value if parsed.desired is None else parsed.desired
        else:
            parsed.other.append(value)
    return parsed


def _detect_role(text: str) -> Optional[str]:
    match = ROLE_PATTERN.search(text)
    if match:
        return match.group("role").lower()
    if "freelancer" in text.lower():
        return "freelancer"
    if "cliente" in text.lower():
        return "cliente"
    return None


def _extract_days(text: str) -> Optional[int]:
    lower = text.lower()
    if "menos de una semana" in lower:
        return 6
    if "una semana" in lower:
        return 7
    match_weeks = WEEKS_PATTERN.search(text)
    if match_weeks:
        return int(match_weeks.group(1)) * 7
    match = DAYS_PATTERN.search(text)
    if match:
        return int(match.group(1))
    return None


def _format_amount(amount: float) -> str:
    return f"{amount:.2f} USDC"


def _build_milestones(total_amount: float, total_days: int) -> List[Dict[str, str]]:
    today = _dt.date.today()
    milestone_days = [max(2, int(total_days * 0.3)), max(2, int(total_days * 0.7)), total_days]
    milestones: List[Dict[str, str]] = []
    descriptions = [
        "Kickoff, alcance final y setup técnico",
        "Entrega intermedia con demo funcional",
        "Entrega final, QA y traspaso a producción",
    ]
    payments = [round(total_amount * 0.3, 2), round(total_amount * 0.4, 2), round(total_amount * 0.3, 2)]
    payments[-1] = round(total_amount - sum(payments[:-1]), 2)
    for days_offset, description, payment in zip(milestone_days, descriptions, payments):
        deadline = today + _dt.timedelta(days=days_offset)
        milestones.append(
            {
                "descripcion": description,
                "deadline": deadline.isoformat(),
                "pago_parcial": _format_amount(payment),
            }
        )
    return milestones


def _determine_total_amount(amounts: ParsedAmounts, role: Optional[str]) -> Optional[float]:
    if amounts.desired is not None and amounts.offer is not None:
        if role == "freelancer":
            return max(amounts.desired, amounts.offer * 1.15)
        if role == "cliente":
            return min(amounts.desired, amounts.offer * 0.95)
        return (amounts.desired + amounts.offer) / 2
    if amounts.desired is not None:
        return amounts.desired
    if amounts.offer is not None:
        return amounts.offer
    if amounts.other:
        return max(amounts.other)
    return None


def _derive_risks(total_days: int, amounts: ParsedAmounts) -> List[str]:
    risks: List[str] = [
        "Dependencia de verificación on-chain (Polygon) para liberar fondos",
    ]
    if total_days <= 7:
        risks.append("Plazo ajustado: aumenta probabilidad de retrasos o entregas parciales")
    if amounts.desired is not None and amounts.offer is not None:
        if abs(amounts.desired - amounts.offer) / max(amounts.offer, 1) > 0.05:
            risks.append("Diferencia notable entre oferta inicial y expectativa de tarifa; acordar alcance detallado")
    return risks


def generate_contract(input_text: str) -> Dict[str, object]:
    text = input_text.strip()
    if not text:
        raise ValueError("El texto de entrada no puede estar vacío")

    amounts_raw = _extract_amounts(text)
    parsed_amounts = _classify_amounts(text, amounts_raw)
    role = _detect_role(text)
    total_amount = _determine_total_amount(parsed_amounts, role) or 5000.0

    total_days = _extract_days(text) or 14
    total_days = max(total_days, 5)

    milestones = _build_milestones(total_amount, total_days)

    contrato = {
        "milestones": milestones,
        "total": _format_amount(total_amount),
        "clausulas": [
            "Fondos bloqueados en escrow inteligente en Polygon usando USDC",
            "Cesión de derechos de IP al cliente tras el pago final y verificación on-chain",
            "Penalización por retraso: 5% del hito pendiente por cada día de demora injustificada",
            "Resolución asistida por oráculo AI/Chainlink ante disputas documentadas",
        ],
        "riesgos": _derive_risks(total_days, parsed_amounts),
    }

    explanation_parts = [
        "Contrato listo para desplegar en escrow Polygon con pagos escalonados 30/40/30.",
        f"Total propuesto: {_format_amount(total_amount)}",
    ]
    if parsed_amounts.offer is not None and parsed_amounts.desired is not None:
        explanation_parts.append(
            f"Se equilibra la oferta de {_format_amount(parsed_amounts.offer)} y la expectativa de {_format_amount(parsed_amounts.desired)}."
        )
    elif parsed_amounts.offer is not None:
        explanation_parts.append(f"Se respeta la oferta detectada de {_format_amount(parsed_amounts.offer)}.")
    elif parsed_amounts.desired is not None:
        explanation_parts.append(f"Se alinea con tu solicitud de {_format_amount(parsed_amounts.desired)}.")

    explanation_parts.append(
        "Recuerda compartir evidencias en cada hito para liberar fondos automáticamente."
    )

    return {
        "contrato": contrato,
        "explicacion": " ".join(explanation_parts),
    }


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Genera un contrato sugerido para gigs Web3.")
    parser.add_argument(
        "texto",
        nargs="?",
        help="Descripción del gig con oferta, expectativas y plazo",
    )
    return parser.parse_args()


def main() -> None:
    args = _parse_args()
    if args.texto:
        text = args.texto
    else:
        text = input().strip()
    result = generate_contract(text)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
