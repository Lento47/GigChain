#!/usr/bin/env python3
"""
GigChain.io - Chat AI Test Script
Prueba la funcionalidad del chat con IA
"""

import requests
import json
import time
import sys
from typing import Dict, Any

# Configuración
API_BASE = "http://localhost:8000"

def test_chat_agents():
    """Prueba la obtención de agentes disponibles"""
    print("🤖 Probando agentes disponibles...")
    
    try:
        response = requests.get(f"{API_BASE}/api/chat/agents", timeout=10)
        
        if response.status_code != 200:
            print(f"❌ Error HTTP: {response.status_code}")
            return False
        
        data = response.json()
        agents = data.get('agents', [])
        
        print(f"✅ Agentes encontrados: {len(agents)}")
        for agent in agents:
            print(f"   - {agent['name']}: {agent['description']}")
        
        return len(agents) > 0
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_chat_session():
    """Prueba la creación de sesión de chat"""
    print("\n💬 Probando creación de sesión...")
    
    try:
        response = requests.post(
            f"{API_BASE}/api/chat/session",
            json={
                "user_id": "test-user",
                "agent_type": "contract"
            },
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ Error HTTP: {response.status_code}")
            return None
        
        data = response.json()
        session_id = data.get('session_id')
        
        print(f"✅ Sesión creada: {session_id}")
        return session_id
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def send_chat_message(session_id: str, message: str, expected_keywords: list = None):
    """Prueba el envío de un mensaje (integration test helper)"""
    print(f"\n💭 Enviando mensaje: '{message}'")
    
    try:
        response = requests.post(
            f"{API_BASE}/api/chat/message",
            json={
                "message": message,
                "session_id": session_id,
                "user_id": "test-user",
                "context": {
                    "test": True,
                    "platform": "gigchain"
                }
            },
            timeout=30
        )
        
        if response.status_code != 200:
            print(f"❌ Error HTTP: {response.status_code}")
            print(f"Respuesta: {response.text}")
            return False
        
        data = response.json()
        
        print(f"✅ Respuesta recibida:")
        print(f"   Agente: {data.get('agent_type', 'unknown')}")
        print(f"   Mensaje: {data.get('response', '')[:100]}...")
        
        if data.get('suggestions'):
            print(f"   Sugerencias: {len(data['suggestions'])}")
            for suggestion in data['suggestions'][:3]:
                print(f"     - {suggestion}")
        
        # Verificar palabras clave esperadas si se proporcionan
        if expected_keywords:
            response_text = data.get('response', '').lower()
            found_keywords = [kw for kw in expected_keywords if kw.lower() in response_text]
            if found_keywords:
                print(f"✅ Palabras clave encontradas: {found_keywords}")
            else:
                print(f"⚠️  Palabras clave no encontradas: {expected_keywords}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def switch_chat_agent(session_id: str):
    """Prueba el cambio de agente (integration test helper)"""
    print(f"\n🔄 Probando cambio de agente...")
    
    try:
        response = requests.put(
            f"{API_BASE}/api/chat/session/{session_id}/agent",
            json={"agent_type": "technical"},
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ Error HTTP: {response.status_code}")
            return False
        
        data = response.json()
        print(f"✅ Agente cambiado a: {data.get('agent_type')}")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def get_chat_history(session_id: str):
    """Prueba la obtención del historial (integration test helper)"""
    print(f"\n📜 Probando historial de chat...")
    
    try:
        response = requests.get(
            f"{API_BASE}/api/chat/session/{session_id}/history",
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ Error HTTP: {response.status_code}")
            return False
        
        data = response.json()
        history = data.get('history', [])
        
        print(f"✅ Historial obtenido: {len(history)} mensajes")
        for i, msg in enumerate(history[-3:]):  # Mostrar últimos 3 mensajes
            role = msg.get('role', 'unknown')
            content = msg.get('content', '')[:50]
            print(f"   {i+1}. {role}: {content}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def run_chat_conversation(session_id: str):
    """Ejecuta una conversación de prueba"""
    print(f"\n🗣️  Iniciando conversación de prueba...")
    
    test_cases = [
        {
            "message": "Hola, ¿cómo estás?",
            "keywords": ["hola", "ayuda", "contratos"]
        },
        {
            "message": "Necesito ayuda para crear un contrato de desarrollo web",
            "keywords": ["contrato", "desarrollo", "web", "términos"]
        },
        {
            "message": "¿Qué términos debería incluir?",
            "keywords": ["términos", "condiciones", "pago", "entregables"]
        },
        {
            "message": "¿Cómo funciona el escrow en GigChain?",
            "keywords": ["escrow", "pago", "seguro", "blockchain"]
        }
    ]
    
    success_count = 0
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n--- Pregunta {i}/{len(test_cases)} ---")
        success = send_chat_message(
            session_id, 
            test_case["message"], 
            test_case["keywords"]
        )
        if success:
            success_count += 1
        
        # Pausa entre mensajes
        time.sleep(1)
    
    return success_count, len(test_cases)

def main():
    """Función principal de pruebas"""
    print("🤖 GigChain.io - Chat AI Test Suite")
    print("=" * 50)
    
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
    
    # Ejecutar pruebas
    tests_passed = 0
    total_tests = 0
    
    # Test 1: Agentes disponibles
    total_tests += 1
    if test_chat_agents():
        tests_passed += 1
    
    # Test 2: Crear sesión
    total_tests += 1
    session_id = test_chat_session()
    if session_id:
        tests_passed += 1
        
        # Test 3: Mensaje básico
        total_tests += 1
        if send_chat_message(session_id, "Hola, ¿puedes ayudarme?"):
            tests_passed += 1
        
        # Test 4: Cambio de agente
        total_tests += 1
        if switch_chat_agent(session_id):
            tests_passed += 1
        
        # Test 5: Conversación completa
        total_tests += 1
        conv_success, conv_total = run_chat_conversation(session_id)
        if conv_success == conv_total:
            tests_passed += 1
        
        # Test 6: Historial
        total_tests += 1
        if get_chat_history(session_id):
            tests_passed += 1
    
    # Resumen
    print("\n" + "=" * 50)
    print("📊 RESUMEN DE PRUEBAS")
    print("=" * 50)
    print(f"✅ Pruebas exitosas: {tests_passed}/{total_tests}")
    
    if tests_passed == total_tests:
        print("\n🎉 ¡Todas las pruebas del chat pasaron!")
        print("💬 El sistema de chat con IA está funcionando correctamente")
    else:
        print(f"\n⚠️  {total_tests - tests_passed} pruebas fallaron")
        print("🔧 Revisa la configuración del chat")
    
    return tests_passed == total_tests

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
