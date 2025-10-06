#!/usr/bin/env python3
"""
GigChain.io - Security Test Script
Prueba las medidas de seguridad implementadas para plantillas
"""

import json
import requests
import sys
from typing import Dict, Any

# Configuración
API_BASE = "http://localhost:8000"
TEST_CASES = [
    {
        "name": "Plantilla Válida",
        "template": {
            "name": "Desarrollo Web Básico",
            "description": "Plantilla para sitios web corporativos",
            "category": "Desarrollo Web",
            "skills": ["HTML", "CSS", "JavaScript"],
            "pricing": {"type": "fixed", "amount": 2000, "currency": "USD"},
            "timeline": {"duration": 14, "unit": "days"},
            "deliverables": ["Sitio web responsive", "SEO básico"],
            "terms": ["Pago 50% inicial, 50% final"]
        },
        "expected_valid": True,
        "expected_score_min": 70
    },
    {
        "name": "Plantilla con Script Malicioso",
        "template": {
            "name": "Test <script>alert('XSS')</script>",
            "description": "Descripción con <script>console.log('hack')</script>",
            "category": "Test",
            "skills": ["JavaScript", "eval('malicious code')"],
            "pricing": {"type": "fixed", "amount": 1000},
            "timeline": {"duration": 7, "unit": "days"},
            "deliverables": ["Código con <script>alert('xss')</script>"],
            "terms": ["Términos normales"]
        },
        "expected_valid": False,
        "expected_score_max": 30
    },
    {
        "name": "Plantilla con Campos No Permitidos",
        "template": {
            "name": "Test Template",
            "description": "Descripción válida",
            "category": "Test",
            "malicious_field": "valor malicioso",
            "executable_code": "system('rm -rf /')",
            "pricing": {"type": "fixed", "amount": 1000},
            "timeline": {"duration": 7, "unit": "days"},
            "deliverables": ["Entregable válido"],
            "terms": ["Término válido"]
        },
        "expected_valid": False,
        "expected_score_max": 50
    },
    {
        "name": "Plantilla con Patrones Peligrosos",
        "template": {
            "name": "Test Template",
            "description": "Descripción con javascript:alert('xss')",
            "category": "Test",
            "skills": ["JavaScript", "eval('malicious')"],
            "pricing": {"type": "fixed", "amount": 1000},
            "timeline": {"duration": 7, "unit": "days"},
            "deliverables": ["Entregable con document.cookie"],
            "terms": ["Término con window.location"]
        },
        "expected_valid": False,
        "expected_score_max": 40
    },
    {
        "name": "Plantilla con Tamaño Excesivo",
        "template": {
            "name": "Test Template",
            "description": "A" * 50000,  # 50KB description
            "category": "Test",
            "skills": ["JavaScript"],
            "pricing": {"type": "fixed", "amount": 1000},
            "timeline": {"duration": 7, "unit": "days"},
            "deliverables": ["Entregable"],
            "terms": ["Término"]
        },
        "expected_valid": False,
        "expected_score_max": 30
    }
]

def test_template_validation(template: Dict[str, Any], test_name: str) -> bool:
    """Prueba la validación de una plantilla"""
    print(f"\n🧪 Probando: {test_name}")
    print("-" * 50)
    
    try:
        # Convertir a JSON string
        template_json = json.dumps(template, ensure_ascii=False)
        print(f"📄 Tamaño del JSON: {len(template_json)} bytes")
        
        # Enviar a endpoint de validación
        response = requests.post(
            f"{API_BASE}/api/templates/validate",
            json={
                "template_json": template_json,
                "user_id": "security-test"
            },
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ Error HTTP: {response.status_code}")
            print(f"Respuesta: {response.text}")
            return False
        
        result = response.json()
        
        print(f"✅ Validación: {'VÁLIDA' if result['valid'] else 'INVÁLIDA'}")
        print(f"📊 Puntuación de seguridad: {result['security_score']}/100")
        
        if result.get('errors'):
            print(f"🚨 Errores encontrados:")
            for error in result['errors']:
                print(f"   - {error}")
        
        if result.get('warnings'):
            print(f"⚠️  Advertencias:")
            for warning in result['warnings']:
                print(f"   - {warning}")
        
        if result.get('sanitized_template'):
            print(f"🧹 Plantilla sanitizada generada")
            # Mostrar diferencias si hay sanitización
            original_keys = set(template.keys())
            sanitized_keys = set(result['sanitized_template'].keys())
            removed_keys = original_keys - sanitized_keys
            if removed_keys:
                print(f"🗑️  Campos removidos: {list(removed_keys)}")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error de conexión: {e}")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

def test_security_info():
    """Prueba el endpoint de información de seguridad"""
    print("\n🔍 Probando endpoint de información de seguridad")
    print("-" * 50)
    
    try:
        response = requests.get(f"{API_BASE}/api/templates/security/info", timeout=10)
        
        if response.status_code != 200:
            print(f"❌ Error HTTP: {response.status_code}")
            return False
        
        info = response.json()
        
        print("✅ Información de seguridad obtenida:")
        print(f"📋 Medidas implementadas: {len(info['security_measures'])}")
        print(f"📝 Campos permitidos: {len(info['allowed_fields'])}")
        print(f"📏 Tamaño máximo: {info['max_file_size']}")
        print(f"📊 Threshold de seguridad: {info['security_score_threshold']}")
        print(f"🔢 Versión: {info['version']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Función principal de pruebas"""
    print("🛡️  GigChain.io - Security Test Suite")
    print("=" * 60)
    
    # Verificar que el servidor esté corriendo
    try:
        response = requests.get(f"{API_BASE}/health", timeout=5)
        if response.status_code != 200:
            print("❌ Servidor no disponible. Inicia el servidor con: python main.py")
            sys.exit(1)
    except:
        print("❌ Servidor no disponible. Inicia el servidor con: python main.py")
        sys.exit(1)
    
    print("✅ Servidor disponible")
    
    # Probar información de seguridad
    security_info_ok = test_security_info()
    
    # Probar casos de validación
    passed_tests = 0
    total_tests = len(TEST_CASES)
    
    for test_case in TEST_CASES:
        success = test_template_validation(
            test_case["template"], 
            test_case["name"]
        )
        
        if success:
            passed_tests += 1
    
    # Resumen
    print("\n" + "=" * 60)
    print("📊 RESUMEN DE PRUEBAS")
    print("=" * 60)
    print(f"✅ Pruebas exitosas: {passed_tests}/{total_tests}")
    print(f"🔍 Info de seguridad: {'✅' if security_info_ok else '❌'}")
    
    if passed_tests == total_tests and security_info_ok:
        print("\n🎉 ¡Todas las pruebas de seguridad pasaron!")
        print("🛡️  El sistema está protegido contra código malicioso")
    else:
        print("\n⚠️  Algunas pruebas fallaron. Revisa la configuración.")
    
    return passed_tests == total_tests and security_info_ok

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
