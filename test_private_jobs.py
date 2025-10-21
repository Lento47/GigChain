"""
Test script for GigChain Private Jobs system
"""

import requests
import json
import time
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:5000"
TEST_WALLET_1 = "0x1234567890123456789012345678901234567890"  # Client
TEST_WALLET_2 = "0x9876543210987654321098765432109876543210"  # Freelancer 1
TEST_WALLET_3 = "0x1111111111111111111111111111111111111111"  # Freelancer 2

def test_private_jobs_system():
    """Test the complete private jobs system"""
    
    print("🚀 Testing GigChain Private Jobs System")
    print("=" * 50)
    
    # Test 1: Create private job
    print("\n1. Creating private job...")
    job_data = {
        "title": "Desarrollo de Smart Contract DeFi",
        "description": "Necesitamos desarrollar un smart contract para un protocolo DeFi con funcionalidades de staking y yield farming. El contrato debe ser seguro y eficiente.",
        "requirements": [
            "Experiencia en Solidity",
            "Conocimiento de protocolos DeFi",
            "Testing exhaustivo de contratos",
            "Documentación técnica"
        ],
        "budget_min": 5000,
        "budget_max": 15000,
        "currency": "USD",
        "timeline": "4-6 semanas",
        "skills": ["Solidity", "DeFi", "Web3", "Testing", "Documentación"]
    }
    
    response = requests.post(
        f"{BASE_URL}/api/private-jobs/",
        json=job_data,
        headers={"Authorization": f"Bearer test_token_{TEST_WALLET_1}"}
    )
    
    if response.status_code == 200:
        job = response.json()
        job_id = job["id"]
        print(f"✅ Job created successfully: {job_id}")
    else:
        print(f"❌ Error creating job: {response.status_code} - {response.text}")
        return
    
    # Test 2: Invite freelancers
    print("\n2. Inviting freelancers...")
    
    # Invite freelancer 1
    invitation1_data = {
        "freelancer_wallet": TEST_WALLET_2,
        "message": "Hola! Vi tu perfil y me gustaría invitarte a aplicar a este proyecto de DeFi. Tu experiencia en Solidity es impresionante."
    }
    
    response = requests.post(
        f"{BASE_URL}/api/private-jobs/{job_id}/invitations",
        json=invitation1_data,
        headers={"Authorization": f"Bearer test_token_{TEST_WALLET_1}"}
    )
    
    if response.status_code == 200:
        invitation1 = response.json()
        print(f"✅ Invitation 1 sent: {invitation1['id']}")
    else:
        print(f"❌ Error sending invitation 1: {response.status_code} - {response.text}")
    
    # Invite freelancer 2
    invitation2_data = {
        "freelancer_wallet": TEST_WALLET_3,
        "message": "Hola! Me gustaría invitarte a este proyecto. Tu portfolio de DeFi es excelente."
    }
    
    response = requests.post(
        f"{BASE_URL}/api/private-jobs/{job_id}/invitations",
        json=invitation2_data,
        headers={"Authorization": f"Bearer test_token_{TEST_WALLET_1}"}
    )
    
    if response.status_code == 200:
        invitation2 = response.json()
        print(f"✅ Invitation 2 sent: {invitation2['id']}")
    else:
        print(f"❌ Error sending invitation 2: {response.status_code} - {response.text}")
    
    # Test 3: Freelancers respond to invitations
    print("\n3. Freelancers responding to invitations...")
    
    # Get invitations for freelancer 1
    response = requests.get(
        f"{BASE_URL}/api/private-jobs/invitations",
        headers={"Authorization": f"Bearer test_token_{TEST_WALLET_2}"}
    )
    
    if response.status_code == 200:
        invitations = response.json()
        freelancer1_invitation = next((inv for inv in invitations if inv["freelancer_wallet"] == TEST_WALLET_2), None)
        
        if freelancer1_invitation:
            # Accept invitation
            response = requests.post(
                f"{BASE_URL}/api/private-jobs/invitations/{freelancer1_invitation['id']}/respond",
                json={"status": "accepted"},
                headers={"Authorization": f"Bearer test_token_{TEST_WALLET_2}"}
            )
            
            if response.status_code == 200:
                print("✅ Freelancer 1 accepted invitation")
            else:
                print(f"❌ Error accepting invitation: {response.status_code} - {response.text}")
    
    # Get invitations for freelancer 2
    response = requests.get(
        f"{BASE_URL}/api/private-jobs/invitations",
        headers={"Authorization": f"Bearer test_token_{TEST_WALLET_3}"}
    )
    
    if response.status_code == 200:
        invitations = response.json()
        freelancer2_invitation = next((inv for inv in invitations if inv["freelancer_wallet"] == TEST_WALLET_3), None)
        
        if freelancer2_invitation:
            # Accept invitation
            response = requests.post(
                f"{BASE_URL}/api/private-jobs/invitations/{freelancer2_invitation['id']}/respond",
                json={"status": "accepted"},
                headers={"Authorization": f"Bearer test_token_{TEST_WALLET_3}"}
            )
            
            if response.status_code == 200:
                print("✅ Freelancer 2 accepted invitation")
            else:
                print(f"❌ Error accepting invitation: {response.status_code} - {response.text}")
    
    # Test 4: Freelancers apply to the job
    print("\n4. Freelancers applying to the job...")
    
    # Freelancer 1 application
    application1_data = {
        "cover_letter": "Tengo 3 años de experiencia desarrollando smart contracts en Solidity. He trabajado en varios protocolos DeFi incluyendo Uniswap V3 y Compound. Mi enfoque es siempre la seguridad y eficiencia del código.",
        "proposed_rate": 8000,
        "estimated_time": "4-5 semanas",
        "relevant_experience": [
            "Desarrollo de protocolo DeFi con $2M+ TVL",
            "Auditoría de smart contracts",
            "Integración con frontend React/TypeScript"
        ],
        "portfolio": [
            "https://github.com/freelancer1/defi-protocol",
            "https://github.com/freelancer1/audit-reports"
        ]
    }
    
    response = requests.post(
        f"{BASE_URL}/api/private-jobs/{job_id}/apply",
        json=application1_data,
        headers={"Authorization": f"Bearer test_token_{TEST_WALLET_2}"}
    )
    
    if response.status_code == 200:
        application1 = response.json()
        print(f"✅ Application 1 submitted: {application1['id']}")
    else:
        print(f"❌ Error submitting application 1: {response.status_code} - {response.text}")
    
    # Freelancer 2 application
    application2_data = {
        "cover_letter": "Soy especialista en DeFi con 5 años de experiencia. He desarrollado múltiples protocolos desde cero y tengo experiencia en yield farming, staking y AMM. Mi código siempre pasa auditorías de seguridad.",
        "proposed_rate": 12000,
        "estimated_time": "5-6 semanas",
        "relevant_experience": [
            "Protocolo DeFi con $10M+ TVL",
            "Múltiples auditorías de seguridad exitosas",
            "Integración con múltiples DEXs"
        ],
        "portfolio": [
            "https://github.com/freelancer2/yield-farming-protocol",
            "https://github.com/freelancer2/amm-contracts"
        ]
    }
    
    response = requests.post(
        f"{BASE_URL}/api/private-jobs/{job_id}/apply",
        json=application2_data,
        headers={"Authorization": f"Bearer test_token_{TEST_WALLET_3}"}
    )
    
    if response.status_code == 200:
        application2 = response.json()
        print(f"✅ Application 2 submitted: {application2['id']}")
    else:
        print(f"❌ Error submitting application 2: {response.status_code} - {response.text}")
    
    # Test 5: Create collaboration group
    print("\n5. Creating collaboration group...")
    
    group_data = {
        "applicants": [TEST_WALLET_2, TEST_WALLET_3]
    }
    
    response = requests.post(
        f"{BASE_URL}/api/private-jobs/{job_id}/collaboration-group",
        json=group_data,
        headers={"Authorization": f"Bearer test_token_{TEST_WALLET_1}"}
    )
    
    if response.status_code == 200:
        group = response.json()
        group_id = group["id"]
        print(f"✅ Collaboration group created: {group_id}")
    else:
        print(f"❌ Error creating group: {response.status_code} - {response.text}")
        return
    
    # Test 6: Send messages in group chat
    print("\n6. Testing group chat...")
    
    # Simulate WebSocket messages (in real implementation, this would be WebSocket)
    messages = [
        {
            "sender_id": TEST_WALLET_1,
            "message": "¡Hola! Bienvenidos al grupo de colaboración. Vamos a discutir el proyecto.",
            "message_type": "text"
        },
        {
            "sender_id": TEST_WALLET_2,
            "message": "¡Hola! Me parece un proyecto muy interesante. ¿Tienen alguna preferencia sobre la arquitectura?",
            "message_type": "text"
        },
        {
            "sender_id": TEST_WALLET_3,
            "message": "Hola! Estoy de acuerdo. Sugiero usar OpenZeppelin para la seguridad base.",
            "message_type": "text"
        }
    ]
    
    for i, message in enumerate(messages):
        response = requests.post(
            f"{BASE_URL}/api/private-jobs/{group_id}/messages",
            json=message,
            headers={"Authorization": f"Bearer test_token_{message['sender_id']}"}
        )
        
        if response.status_code == 200:
            print(f"✅ Message {i+1} sent successfully")
        else:
            print(f"❌ Error sending message {i+1}: {response.status_code} - {response.text}")
    
    # Test 7: Create group proposal
    print("\n7. Creating group proposal...")
    
    proposal_data = {
        "title": "Propuesta de Arquitectura del Protocolo",
        "description": "Propongo que trabajemos juntos en este proyecto. Yo me encargo del core del protocolo y tú de la integración con frontend.",
        "selected_applicants": [TEST_WALLET_2, TEST_WALLET_3],
        "reasoning": "Ambos tienen experiencia complementaria y pueden trabajar bien juntos."
    }
    
    response = requests.post(
        f"{BASE_URL}/api/private-jobs/{group_id}/proposals",
        json=proposal_data,
        headers={"Authorization": f"Bearer test_token_{TEST_WALLET_1}"}
    )
    
    if response.status_code == 200:
        proposal = response.json()
        proposal_id = proposal["id"]
        print(f"✅ Proposal created: {proposal_id}")
    else:
        print(f"❌ Error creating proposal: {response.status_code} - {response.text}")
    
    # Test 8: Vote on proposal
    print("\n8. Voting on proposal...")
    
    # Freelancer 1 votes
    response = requests.post(
        f"{BASE_URL}/api/private-jobs/proposals/{proposal_id}/vote",
        json={"vote": "yes"},
        headers={"Authorization": f"Bearer test_token_{TEST_WALLET_2}"}
    )
    
    if response.status_code == 200:
        print("✅ Freelancer 1 voted YES")
    else:
        print(f"❌ Error voting: {response.status_code} - {response.text}")
    
    # Freelancer 2 votes
    response = requests.post(
        f"{BASE_URL}/api/private-jobs/proposals/{proposal_id}/vote",
        json={"vote": "yes"},
        headers={"Authorization": f"Bearer test_token_{TEST_WALLET_3}"}
    )
    
    if response.status_code == 200:
        print("✅ Freelancer 2 voted YES")
    else:
        print(f"❌ Error voting: {response.status_code} - {response.text}")
    
    # Test 9: Make final decision
    print("\n9. Making final decision...")
    
    decision_data = {
        "selected_applicants": [TEST_WALLET_2, TEST_WALLET_3],
        "project_goals": [
            "Desarrollar smart contract DeFi seguro",
            "Implementar funcionalidades de staking",
            "Crear sistema de yield farming",
            "Documentación técnica completa"
        ],
        "deadlines": [
            "Semana 1: Arquitectura y diseño",
            "Semana 2-3: Desarrollo core",
            "Semana 4: Testing y auditoría",
            "Semana 5-6: Integración y documentación"
        ]
    }
    
    response = requests.post(
        f"{BASE_URL}/api/private-jobs/{group_id}/decide",
        json=decision_data,
        headers={"Authorization": f"Bearer test_token_{TEST_WALLET_1}"}
    )
    
    if response.status_code == 200:
        print("✅ Final decision made successfully")
    else:
        print(f"❌ Error making decision: {response.status_code} - {response.text}")
    
    # Test 10: Get final statistics
    print("\n10. Getting final statistics...")
    
    response = requests.get(
        f"{BASE_URL}/api/private-jobs/stats/overview",
        headers={"Authorization": f"Bearer test_token_{TEST_WALLET_1}"}
    )
    
    if response.status_code == 200:
        stats = response.json()
        print("✅ Statistics retrieved:")
        print(f"   - Total jobs: {stats['total_jobs']}")
        print(f"   - Active jobs: {stats['active_jobs']}")
        print(f"   - Total applications: {stats['total_applications']}")
        print(f"   - Total invitations: {stats['total_invitations']}")
        print(f"   - Total groups: {stats['total_groups']}")
        print(f"   - Active groups: {stats['active_groups']}")
    else:
        print(f"❌ Error getting stats: {response.status_code} - {response.text}")
    
    print("\n" + "=" * 50)
    print("🎉 Private Jobs System Test Complete!")
    print("=" * 50)

if __name__ == "__main__":
    test_private_jobs_system()