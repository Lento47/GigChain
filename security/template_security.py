"""
GigChain.io - Template Security Module
Valida y sanitiza plantillas de manera segura
"""

import json
import re
import hashlib
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

@dataclass
class SecurityValidationResult:
    is_valid: bool
    sanitized_data: Optional[Dict[str, Any]] = None
    errors: List[str] = None
    warnings: List[str] = None
    security_score: float = 0.0

class TemplateSecurityValidator:
    """Validador de seguridad para plantillas de GigChain"""
    
    # Campos permitidos (whitelist estricta)
    ALLOWED_FIELDS = {
        'name', 'description', 'category', 'projectType', 'skills', 
        'pricing', 'timeline', 'deliverables', 'terms', 'createdAt',
        'id', 'uploadedAt', 'author', 'rating', 'downloads', 'thumbnail'
    }
    
    # Patrones peligrosos a detectar
    DANGEROUS_PATTERNS = [
        r'<script[^>]*>.*?</script>',  # Script tags
        r'javascript:',  # JavaScript URLs
        r'data:text/html',  # Data URLs HTML
        r'eval\s*\(',  # Eval functions
        r'Function\s*\(',  # Function constructor
        r'setTimeout\s*\(',  # setTimeout
        r'setInterval\s*\(',  # setInterval
        r'document\.',  # DOM access
        r'window\.',  # Window object
        r'localStorage\.',  # LocalStorage access
        r'sessionStorage\.',  # SessionStorage access
        r'fetch\s*\(',  # Fetch API
        r'XMLHttpRequest',  # XHR
        r'WebSocket',  # WebSocket
        r'import\s+',  # ES6 imports
        r'require\s*\(',  # CommonJS require
        r'__proto__',  # Prototype pollution
        r'constructor',  # Constructor access
        r'prototype',  # Prototype access
    ]
    
    # Tamaños máximos permitidos
    MAX_FILE_SIZE = 1024 * 1024  # 1MB
    MAX_FIELD_LENGTH = 10000  # 10KB por campo
    MAX_SKILLS_COUNT = 20
    MAX_DELIVERABLES_COUNT = 50
    MAX_TERMS_COUNT = 30
    
    def __init__(self):
        self.compiled_patterns = [re.compile(pattern, re.IGNORECASE | re.DOTALL) 
                                for pattern in self.DANGEROUS_PATTERNS]
    
    def validate_template(self, template_data: Dict[str, Any]) -> SecurityValidationResult:
        """
        Valida una plantilla de manera completa y segura
        """
        errors = []
        warnings = []
        security_score = 100.0
        
        try:
            # 1. Validar estructura básica
            if not isinstance(template_data, dict):
                errors.append("La plantilla debe ser un objeto JSON válido")
                return SecurityValidationResult(False, errors=errors, security_score=0.0)
            
            # 2. Validar campos requeridos
            required_fields = ['name', 'description']
            for field in required_fields:
                if field not in template_data:
                    errors.append(f"Campo requerido '{field}' no encontrado")
                    security_score -= 20
            
            # 3. Validar campos permitidos (whitelist)
            for field in template_data.keys():
                if field not in self.ALLOWED_FIELDS:
                    errors.append(f"Campo no permitido: '{field}'")
                    security_score -= 10
            
            # 4. Validar y sanitizar cada campo
            sanitized_data = {}
            for field, value in template_data.items():
                if field in self.ALLOWED_FIELDS:
                    sanitized_value, field_errors, field_warnings = self._sanitize_field(field, value)
                    sanitized_data[field] = sanitized_value
                    errors.extend(field_errors)
                    warnings.extend(field_warnings)
                    
                    # Reducir score por errores de campo
                    security_score -= len(field_errors) * 5
                    security_score -= len(field_warnings) * 2
            
            # 5. Validar estructura de campos complejos
            self._validate_pricing_structure(sanitized_data, errors, warnings)
            self._validate_timeline_structure(sanitized_data, errors, warnings)
            
            # 6. Detectar patrones peligrosos en todo el contenido
            content_str = json.dumps(sanitized_data, ensure_ascii=False)
            dangerous_matches = self._detect_dangerous_patterns(content_str)
            
            if dangerous_matches:
                errors.extend([f"Patrón peligroso detectado: {match}" for match in dangerous_matches])
                security_score -= len(dangerous_matches) * 15
            
            # 7. Validar tamaño total
            content_size = len(content_str.encode('utf-8'))
            if content_size > self.MAX_FILE_SIZE:
                errors.append(f"Archivo demasiado grande: {content_size} bytes (máximo: {self.MAX_FILE_SIZE})")
                security_score -= 25
            
            # 8. Añadir metadatos de seguridad
            sanitized_data['_security'] = {
                'validated_at': datetime.utcnow().isoformat(),
                'security_score': max(0, security_score),
                'validation_version': '1.0'
            }
            
            is_valid = len(errors) == 0 and security_score >= 70
            
            return SecurityValidationResult(
                is_valid=is_valid,
                sanitized_data=sanitized_data if is_valid else None,
                errors=errors,
                warnings=warnings,
                security_score=max(0, security_score)
            )
            
        except Exception as e:
            logger.error(f"Error validando plantilla: {str(e)}")
            return SecurityValidationResult(
                False, 
                errors=[f"Error interno de validación: {str(e)}"], 
                security_score=0.0
            )
    
    def _sanitize_field(self, field: str, value: Any) -> tuple:
        """Sanitiza un campo individual"""
        errors = []
        warnings = []
        
        if field == 'name':
            if not isinstance(value, str):
                errors.append("El nombre debe ser texto")
                return None, errors, warnings
            
            # Sanitizar HTML y caracteres peligrosos
            sanitized = self._sanitize_text(value, max_length=200)
            if len(sanitized) < 3:
                errors.append("El nombre debe tener al menos 3 caracteres")
            
        elif field == 'description':
            if not isinstance(value, str):
                errors.append("La descripción debe ser texto")
                return None, errors, warnings
            
            sanitized = self._sanitize_text(value, max_length=2000)
            if len(sanitized) < 10:
                errors.append("La descripción debe tener al menos 10 caracteres")
                
        elif field == 'skills':
            if not isinstance(value, list):
                errors.append("Las habilidades deben ser una lista")
                return None, errors, warnings
            
            if len(value) > self.MAX_SKILLS_COUNT:
                errors.append(f"Máximo {self.MAX_SKILLS_COUNT} habilidades permitidas")
                return None, errors, warnings
            
            sanitized = []
            for skill in value:
                if isinstance(skill, str):
                    clean_skill = self._sanitize_text(skill, max_length=50)
                    if clean_skill and clean_skill not in sanitized:
                        sanitized.append(clean_skill)
                else:
                    warnings.append(f"Habilidad inválida ignorada: {skill}")
            
        elif field == 'deliverables':
            if not isinstance(value, list):
                errors.append("Los entregables deben ser una lista")
                return None, errors, warnings
            
            if len(value) > self.MAX_DELIVERABLES_COUNT:
                errors.append(f"Máximo {self.MAX_DELIVERABLES_COUNT} entregables permitidos")
                return None, errors, warnings
            
            sanitized = []
            for deliverable in value:
                if isinstance(deliverable, str):
                    clean_deliverable = self._sanitize_text(deliverable, max_length=500)
                    if clean_deliverable:
                        sanitized.append(clean_deliverable)
                else:
                    warnings.append(f"Entregable inválido ignorado: {deliverable}")
            
        elif field == 'terms':
            if not isinstance(value, list):
                errors.append("Los términos deben ser una lista")
                return None, errors, warnings
            
            if len(value) > self.MAX_TERMS_COUNT:
                errors.append(f"Máximo {self.MAX_TERMS_COUNT} términos permitidos")
                return None, errors, warnings
            
            sanitized = []
            for term in value:
                if isinstance(term, str):
                    clean_term = self._sanitize_text(term, max_length=1000)
                    if clean_term:
                        sanitized.append(clean_term)
                else:
                    warnings.append(f"Término inválido ignorado: {term}")
            
        elif field in ['pricing', 'timeline']:
            # Validar estructura de objetos complejos
            if not isinstance(value, dict):
                errors.append(f"El campo {field} debe ser un objeto")
                return None, errors, warnings
            
            sanitized = {}
            for k, v in value.items():
                if isinstance(v, (str, int, float)):
                    if isinstance(v, str):
                        clean_v = self._sanitize_text(str(v), max_length=100)
                        if clean_v:
                            sanitized[k] = clean_v
                    else:
                        sanitized[k] = v
                else:
                    warnings.append(f"Valor inválido en {field}.{k}: {v}")
            
        else:
            # Campos simples
            if isinstance(value, str):
                sanitized = self._sanitize_text(value, max_length=self.MAX_FIELD_LENGTH)
            else:
                sanitized = value
        
        return sanitized, errors, warnings
    
    def _sanitize_text(self, text: str, max_length: int = None) -> str:
        """Sanitiza texto eliminando caracteres peligrosos"""
        if not isinstance(text, str):
            return str(text)
        
        # Eliminar caracteres de control excepto \n, \r, \t
        text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)
        
        # Escapar HTML
        text = text.replace('&', '&amp;')
        text = text.replace('<', '&lt;')
        text = text.replace('>', '&gt;')
        text = text.replace('"', '&quot;')
        text = text.replace("'", '&#x27;')
        
        # Eliminar patrones peligrosos
        for pattern in self.compiled_patterns:
            text = pattern.sub('[CONTENIDO_BLOQUEADO]', text)
        
        # Limitar longitud
        if max_length and len(text) > max_length:
            text = text[:max_length] + '...'
        
        return text.strip()
    
    def _detect_dangerous_patterns(self, content: str) -> List[str]:
        """Detecta patrones peligrosos en el contenido"""
        matches = []
        
        for pattern in self.compiled_patterns:
            if pattern.search(content):
                matches.append(pattern.pattern)
        
        return matches
    
    def _validate_pricing_structure(self, data: Dict[str, Any], errors: List[str], warnings: List[str]):
        """Valida la estructura del objeto pricing"""
        if 'pricing' in data and isinstance(data['pricing'], dict):
            pricing = data['pricing']
            
            if 'type' in pricing:
                if pricing['type'] not in ['fixed', 'hourly', 'milestone']:
                    errors.append("Tipo de precio inválido")
            
            if 'amount' in pricing:
                try:
                    amount = float(pricing['amount'])
                    if amount < 0 or amount > 1000000:
                        errors.append("Cantidad de precio fuera de rango válido")
                except (ValueError, TypeError):
                    errors.append("Cantidad de precio inválida")
    
    def _validate_timeline_structure(self, data: Dict[str, Any], errors: List[str], warnings: List[str]):
        """Valida la estructura del objeto timeline"""
        if 'timeline' in data and isinstance(data['timeline'], dict):
            timeline = data['timeline']
            
            if 'duration' in timeline:
                try:
                    duration = int(timeline['duration'])
                    if duration < 1 or duration > 365:
                        errors.append("Duración fuera de rango válido (1-365 días)")
                except (ValueError, TypeError):
                    errors.append("Duración inválida")
            
            if 'unit' in timeline:
                if timeline['unit'] not in ['days', 'weeks', 'months']:
                    errors.append("Unidad de tiempo inválida")

def validate_template_security(template_json: str) -> SecurityValidationResult:
    """
    Función principal para validar la seguridad de una plantilla
    """
    try:
        template_data = json.loads(template_json)
        validator = TemplateSecurityValidator()
        return validator.validate_template(template_data)
    except json.JSONDecodeError as e:
        return SecurityValidationResult(
            False, 
            errors=[f"JSON inválido: {str(e)}"], 
            security_score=0.0
        )
    except Exception as e:
        logger.error(f"Error inesperado validando plantilla: {str(e)}")
        return SecurityValidationResult(
            False, 
            errors=[f"Error interno: {str(e)}"], 
            security_score=0.0
        )
