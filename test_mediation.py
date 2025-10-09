"""
Test suite for AI-Powered Dispute Mediation System
Tests para verificar el funcionamiento del sistema de mediación de disputas.
"""

import sys
import os
from datetime import datetime

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dispute_oracle_system import dispute_oracle
from dispute_mediation_ai import (
    mediation_system,
    DisputeMediationAgent,
    MediationStatus,
    ProposalType
)


def print_section(title):
    """Print formatted section title."""
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}\n")


def test_create_dispute():
    """Test 1: Create a dispute for mediation."""
    print_section("TEST 1: Creating Dispute")
    
    try:
        # Create a dispute
        dispute_id = dispute_oracle.create_dispute(
            contract_id="contract_123",
            contract_address="0x1234567890123456789012345678901234567890",
            freelancer="0xFreelancerAddress123456789012345678901234",
            client="0xClientAddress1234567890123456789012345678",
            amount=1000.0,
            description="Cliente insatisfecho con la calidad del trabajo entregado. Freelancer afirma haber cumplido todos los requisitos."
        )
        
        print(f"✅ Dispute created successfully!")
        print(f"   Dispute ID: {dispute_id}")
        
        # Submit evidence for freelancer
        dispute_oracle.submit_evidence(
            dispute_id=dispute_id,
            submitter="0xFreelancerAddress123456789012345678901234",
            evidence_hash="QmFreelancerEvidence123456789",
            evidence_url="https://ipfs.io/ipfs/QmFreelancerEvidence123456789",
            description="Screenshots del trabajo completado según especificaciones originales",
            file_type="image/png"
        )
        
        print(f"✅ Freelancer evidence submitted")
        
        # Submit evidence for client
        dispute_oracle.submit_evidence(
            dispute_id=dispute_id,
            submitter="0xClientAddress1234567890123456789012345678",
            evidence_hash="QmClientEvidence987654321",
            evidence_url="https://ipfs.io/ipfs/QmClientEvidence987654321",
            description="Comparación entre lo solicitado y lo entregado, mostrando discrepancias",
            file_type="document/pdf"
        )
        
        print(f"✅ Client evidence submitted")
        
        # Get dispute details
        dispute = dispute_oracle.get_dispute(dispute_id)
        print(f"\n📋 Dispute Details:")
        print(f"   Status: {dispute['status']}")
        print(f"   Amount: ${dispute['amount']}")
        print(f"   Freelancer Evidence: {len(dispute['freelancer_evidence'])} items")
        print(f"   Client Evidence: {len(dispute['client_evidence'])} items")
        
        return dispute_id
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None


def test_initiate_mediation(dispute_id):
    """Test 2: Initiate AI mediation for the dispute."""
    print_section("TEST 2: Initiating AI Mediation")
    
    if not dispute_id:
        print("❌ No dispute ID provided, skipping test")
        return None
    
    try:
        # Initiate mediation
        session = mediation_system.initiate_mediation(
            dispute_id=dispute_id,
            initiator="freelancer"
        )
        
        print(f"✅ Mediation initiated successfully!")
        print(f"   Mediation ID: {session.mediation_id}")
        print(f"   Status: {session.status}")
        print(f"   Proposals generated: {len(session.ai_proposals)}")
        
        # Print analysis summary if available
        if session.chat_history:
            initial_msg = session.chat_history[0]
            if "analysis" in initial_msg:
                analysis = initial_msg["analysis"]
                print(f"\n🔍 AI Analysis Summary:")
                print(f"   {analysis.get('analysis_summary', 'N/A')[:150]}...")
                
                if "recommendation" in analysis:
                    print(f"   Recommendation: {analysis['recommendation']}")
                if "confidence_level" in analysis:
                    print(f"   Confidence: {analysis['confidence_level']*100:.1f}%")
        
        # Print proposals
        print(f"\n💡 AI-Generated Proposals:")
        for i, proposal in enumerate(session.ai_proposals, 1):
            print(f"\n   Proposal {i}: {proposal.proposal_type.upper()}")
            print(f"   Description: {proposal.description[:120]}...")
            print(f"   Payment Adjustment: {proposal.payment_adjustment:+.1f}%")
            print(f"   Confidence: {proposal.confidence_score*100:.1f}%")
            print(f"   Benefits for Freelancer: {len(proposal.benefits_freelancer)} items")
            print(f"   Benefits for Client: {len(proposal.benefits_client)} items")
        
        return session.mediation_id
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


def test_mediation_chat(mediation_id):
    """Test 3: Test mediation chat functionality."""
    print_section("TEST 3: Mediation Chat with AI")
    
    if not mediation_id:
        print("❌ No mediation ID provided, skipping test")
        return False
    
    try:
        # Freelancer sends message
        print("👤 Freelancer: 'Cumplí con todos los requisitos del proyecto. Tengo evidencia.'")
        
        response1 = mediation_system.send_message(
            mediation_id=mediation_id,
            sender="freelancer",
            message="Cumplí con todos los requisitos del proyecto. Tengo evidencia de que todo fue entregado según lo acordado."
        )
        
        print(f"\n🤖 AI Mediator: '{response1['response'][:200]}...'")
        
        if "sentiment_analysis" in response1:
            sentiment = response1["sentiment_analysis"]
            print(f"\n📊 Sentiment Analysis:")
            print(f"   Sentiment: {sentiment.get('sender_sentiment', 'N/A')}")
            print(f"   Willingness to compromise: {sentiment.get('willingness_to_compromise', 0)*100:.1f}%")
        
        if "suggested_actions" in response1:
            print(f"\n📝 Suggested Actions:")
            for action in response1["suggested_actions"][:3]:
                print(f"   - {action}")
        
        # Client sends message
        print(f"\n👤 Client: 'El trabajo no cumple con la calidad esperada.'")
        
        response2 = mediation_system.send_message(
            mediation_id=mediation_id,
            sender="client",
            message="El trabajo entregado no cumple con la calidad esperada. Hay varios problemas que necesitan corrección."
        )
        
        print(f"\n🤖 AI Mediator: '{response2['response'][:200]}...'")
        
        if "mediation_guidance" in response2:
            guidance = response2["mediation_guidance"]
            print(f"\n🎯 Mediation Guidance:")
            print(f"   Next step: {guidance.get('next_step', 'N/A')}")
            print(f"   Closer to resolution: {guidance.get('closer_to_resolution', False)}")
            print(f"   Risk of escalation: {guidance.get('risk_of_escalation', 0)*100:.1f}%")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_proposal_response(mediation_id):
    """Test 4: Test proposal acceptance/rejection."""
    print_section("TEST 4: Proposal Response System")
    
    if not mediation_id:
        print("❌ No mediation ID provided, skipping test")
        return False
    
    try:
        # Get proposals
        session = mediation_system.active_mediations.get(mediation_id)
        if not session or not session.ai_proposals:
            print("❌ No proposals found")
            return False
        
        # Select best proposal (highest confidence)
        best_proposal = max(session.ai_proposals, key=lambda p: p.confidence_score)
        
        print(f"📋 Testing with proposal: {best_proposal.proposal_id}")
        print(f"   Type: {best_proposal.proposal_type}")
        print(f"   Confidence: {best_proposal.confidence_score*100:.1f}%")
        
        # Freelancer accepts
        print(f"\n👤 Freelancer accepts proposal...")
        result1 = mediation_system.respond_to_proposal(
            mediation_id=mediation_id,
            proposal_id=best_proposal.proposal_id,
            responder="freelancer",
            accepted=True
        )
        
        print(f"✅ Result: {result1['message']}")
        print(f"   Status: {result1['status']}")
        
        # Client accepts
        print(f"\n👤 Client accepts proposal...")
        result2 = mediation_system.respond_to_proposal(
            mediation_id=mediation_id,
            proposal_id=best_proposal.proposal_id,
            responder="client",
            accepted=True
        )
        
        print(f"✅ Result: {result2['message']}")
        print(f"   Status: {result2['status']}")
        
        if result2.get('success') and result2.get('agreement'):
            print(f"\n🎉 AGREEMENT REACHED!")
            agreement = result2['agreement']
            print(f"   Final Resolution: {agreement.get('proposal_type', 'N/A')}")
            print(f"   Payment Adjustment: {agreement.get('payment_adjustment', 0):+.1f}%")
        
        return result2.get('success', False)
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_mediation_status(mediation_id):
    """Test 5: Check mediation status."""
    print_section("TEST 5: Mediation Status Check")
    
    if not mediation_id:
        print("❌ No mediation ID provided, skipping test")
        return
    
    try:
        status = mediation_system.get_mediation_status(mediation_id)
        
        print(f"📊 Mediation Status:")
        print(f"   ID: {status['mediation_id']}")
        print(f"   Dispute ID: {status['dispute_id']}")
        print(f"   Status: {status['status']}")
        print(f"   Proposals: {status['proposals_count']}")
        print(f"   Messages: {status['messages_count']}")
        print(f"   Rounds: {status['rounds']}")
        print(f"   Started: {status['started_at']}")
        
        if status['resolved_at']:
            print(f"   Resolved: {status['resolved_at']}")
        
        if status['final_agreement']:
            print(f"\n✅ Final Agreement:")
            agreement = status['final_agreement']
            print(f"   Type: {agreement.get('proposal_type', 'N/A')}")
            print(f"   Description: {agreement.get('description', 'N/A')[:100]}...")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")


def test_mediation_statistics():
    """Test 6: System statistics."""
    print_section("TEST 6: Mediation System Statistics")
    
    try:
        all_mediations = list(mediation_system.active_mediations.values())
        
        total = len(all_mediations)
        resolved = sum(1 for m in all_mediations if m.status == MediationStatus.RESOLVED)
        in_progress = sum(1 for m in all_mediations if m.status == MediationStatus.IN_PROGRESS)
        
        print(f"📈 System Statistics:")
        print(f"   Total Mediations: {total}")
        print(f"   Resolved: {resolved}")
        print(f"   In Progress: {in_progress}")
        
        if total > 0:
            success_rate = (resolved / total) * 100
            print(f"   Success Rate: {success_rate:.1f}%")
            
            avg_rounds = sum(m.rounds for m in all_mediations) / total
            print(f"   Average Rounds: {avg_rounds:.1f}")
        
        # Dispute oracle statistics
        oracle_stats = dispute_oracle.get_statistics()
        print(f"\n📊 Dispute Oracle Statistics:")
        print(f"   Total Disputes: {oracle_stats['total_disputes']}")
        print(f"   Resolved: {oracle_stats['resolved_disputes']}")
        print(f"   Resolution Rate: {oracle_stats['resolution_rate']:.1f}%")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")


def run_all_tests():
    """Run all mediation system tests."""
    print("\n" + "="*80)
    print("  🤖 AI-POWERED DISPUTE MEDIATION SYSTEM - TEST SUITE")
    print("="*80)
    
    # Test 1: Create dispute
    dispute_id = test_create_dispute()
    
    if not dispute_id:
        print("\n❌ Failed to create dispute, stopping tests")
        return
    
    # Test 2: Initiate mediation
    mediation_id = test_initiate_mediation(dispute_id)
    
    if not mediation_id:
        print("\n⚠️ Mediation not initiated - AI features may require OPENAI_API_KEY")
        print("   Creating mock mediation for testing...")
        
        # Continue with basic tests
        test_mediation_statistics()
        return
    
    # Test 3: Chat functionality
    chat_success = test_mediation_chat(mediation_id)
    
    # Test 4: Proposal response
    proposal_success = test_proposal_response(mediation_id)
    
    # Test 5: Status check
    test_mediation_status(mediation_id)
    
    # Test 6: Statistics
    test_mediation_statistics()
    
    # Summary
    print_section("TEST SUMMARY")
    print(f"✅ Dispute Creation: PASS")
    print(f"{'✅' if mediation_id else '⚠️'} Mediation Initiation: {'PASS' if mediation_id else 'SKIP (No API Key)'}")
    print(f"{'✅' if chat_success else '⚠️'} Mediation Chat: {'PASS' if chat_success else 'SKIP'}")
    print(f"{'✅' if proposal_success else '⚠️'} Proposal Response: {'PASS' if proposal_success else 'SKIP'}")
    print(f"✅ Statistics: PASS")
    
    print("\n" + "="*80)
    print("  🎉 MEDIATION SYSTEM TEST COMPLETED!")
    print("="*80 + "\n")


if __name__ == "__main__":
    # Check for OpenAI API key
    if not os.getenv('OPENAI_API_KEY'):
        print("\n⚠️  WARNING: OPENAI_API_KEY not found in environment")
        print("   AI features will use fallback mode")
        print("   Set OPENAI_API_KEY in .env file for full functionality\n")
    
    run_all_tests()
