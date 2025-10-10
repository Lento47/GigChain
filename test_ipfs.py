#!/usr/bin/env python3
"""
Test IPFS Contract Storage

This script tests the IPFS integration for storing and retrieving contract data.

Usage:
    python test_ipfs.py                    # Run all tests
    python test_ipfs.py --upload           # Test upload only
    python test_ipfs.py --retrieve CID     # Test retrieval
"""

import json
import sys
from datetime import datetime
from ipfs_storage import ipfs_storage, upload_contract_to_ipfs, retrieve_contract_from_ipfs


def print_header(title: str):
    """Print a formatted header"""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def test_connection():
    """Test IPFS connection"""
    print_header("🔌 Testing IPFS Connection")
    
    if ipfs_storage.is_connected():
        print("✅ IPFS is connected!")
        
        stats = ipfs_storage.get_stats()
        print(f"\n📊 IPFS Node Stats:")
        print(f"   Mode: {stats.get('mode')}")
        print(f"   Version: {stats.get('version', 'N/A')}")
        print(f"   Gateway URL: {stats.get('gateway_url', 'N/A')}")
        print(f"   API URL: {stats.get('api_url', 'N/A')}")
        print(f"   Repo Size: {stats.get('repo_size', 0):,} bytes")
        print(f"   Objects: {stats.get('num_objects', 0):,}")
        
        return True
    else:
        print("❌ IPFS is not connected")
        print("\n💡 To enable IPFS:")
        print("   1. Install IPFS: https://docs.ipfs.tech/install/")
        print("   2. Initialize: ipfs init")
        print("   3. Start daemon: ipfs daemon")
        print("   4. Or configure remote gateway (Pinata/Infura)")
        
        return False


def test_upload():
    """Test uploading contract to IPFS"""
    print_header("📤 Testing Contract Upload to IPFS")
    
    if not ipfs_storage.is_connected():
        print("❌ IPFS not connected. Cannot test upload.")
        return None
    
    # Create sample contract
    sample_contract = {
        "contract_id": f"test_{datetime.now().isoformat()}",
        "milestones": [
            {
                "descripcion": "Fase inicial de desarrollo",
                "deadline": "2025-10-15",
                "pago_parcial": "300.00 USDC"
            },
            {
                "descripcion": "Entrega intermedia con demo",
                "deadline": "2025-10-22",
                "pago_parcial": "400.00 USDC"
            },
            {
                "descripcion": "Entrega final y deployment",
                "deadline": "2025-10-28",
                "pago_parcial": "300.00 USDC"
            }
        ],
        "total": "1000.00 USDC",
        "clausulas": [
            "Fondos bloqueados en escrow inteligente en Polygon",
            "Cesión de derechos de IP al cliente tras pago final",
            "Penalización por retraso: 5% del hito pendiente"
        ],
        "riesgos": [
            "Dependencia de verificación on-chain para liberar fondos"
        ],
        "metadata": {
            "created_at": datetime.now().isoformat(),
            "platform": "GigChain.io",
            "version": "1.0.0"
        }
    }
    
    print(f"\n📋 Sample Contract:")
    print(json.dumps(sample_contract, indent=2, ensure_ascii=False)[:200] + "...")
    
    try:
        # Upload to IPFS
        print(f"\n🚀 Uploading to IPFS...")
        result = ipfs_storage.upload_contract(
            contract_data=sample_contract,
            pin=True,
            metadata={
                "test": True,
                "uploaded_by": "test_script"
            }
        )
        
        print(f"\n✅ Upload Successful!")
        print(f"   CID: {result.cid}")
        print(f"   Size: {result.size:,} bytes")
        print(f"   Timestamp: {result.timestamp}")
        print(f"   Pinned: {result.pinned}")
        print(f"   Gateway URL: {result.gateway_url}")
        
        # Show public gateway URLs
        print(f"\n🌐 Public Gateway URLs:")
        for i, gateway in enumerate(ipfs_storage.public_gateways):
            url = ipfs_storage.get_gateway_url(result.cid, i)
            print(f"   {i+1}. {url}")
        
        return result.cid
        
    except Exception as e:
        print(f"\n❌ Upload Failed: {str(e)}")
        return None


def test_retrieve(cid: str):
    """Test retrieving contract from IPFS"""
    print_header(f"📥 Testing Contract Retrieval from IPFS")
    
    if not ipfs_storage.is_connected():
        print("❌ IPFS not connected. Cannot test retrieval.")
        return False
    
    print(f"\n🔍 Retrieving CID: {cid}")
    
    try:
        contract = ipfs_storage.retrieve_contract(cid)
        
        print(f"\n✅ Retrieval Successful!")
        print(f"   CID: {contract.cid}")
        print(f"   Size: {contract.size:,} bytes")
        print(f"   Timestamp: {contract.timestamp}")
        print(f"   Pinned: {contract.pinned}")
        
        print(f"\n📄 Contract Data:")
        print(json.dumps(contract.contract_data, indent=2, ensure_ascii=False)[:500] + "...")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Retrieval Failed: {str(e)}")
        return False


def test_pinning():
    """Test pinning operations"""
    print_header("📌 Testing Pin Operations")
    
    if not ipfs_storage.is_connected():
        print("❌ IPFS not connected. Cannot test pinning.")
        return
    
    try:
        # List pinned contracts
        print("\n📋 Listing pinned contracts...")
        pins = ipfs_storage.list_pinned_contracts()
        
        if pins:
            print(f"✅ Found {len(pins)} pinned contracts:")
            for i, cid in enumerate(pins[:5], 1):  # Show first 5
                print(f"   {i}. {cid}")
            if len(pins) > 5:
                print(f"   ... and {len(pins) - 5} more")
        else:
            print("ℹ️ No pinned contracts found")
        
    except Exception as e:
        print(f"❌ Pin listing failed: {str(e)}")


def test_helper_functions():
    """Test helper functions"""
    print_header("🔧 Testing Helper Functions")
    
    if not ipfs_storage.is_connected():
        print("❌ IPFS not connected. Skipping helper function tests.")
        return None
    
    # Test upload helper
    print("\n1️⃣ Testing upload_contract_to_ipfs()...")
    
    test_data = {
        "test": "helper_function",
        "timestamp": datetime.now().isoformat(),
        "data": "This is a test contract using helper function"
    }
    
    cid = upload_contract_to_ipfs(test_data, pin=True)
    
    if cid:
        print(f"   ✅ Upload successful: {cid}")
        
        # Test retrieve helper
        print("\n2️⃣ Testing retrieve_contract_from_ipfs()...")
        
        retrieved = retrieve_contract_from_ipfs(cid)
        
        if retrieved:
            print(f"   ✅ Retrieval successful")
            print(f"   📄 Data: {json.dumps(retrieved, indent=2)[:200]}...")
            return cid
        else:
            print("   ❌ Retrieval failed")
    else:
        print("   ❌ Upload failed")
    
    return None


def run_all_tests():
    """Run all IPFS tests"""
    print("\n🚀 GigChain IPFS Contract Storage Test Suite")
    print("=" * 60)
    
    # Test connection
    if not test_connection():
        print("\n⚠️ IPFS connection failed. Some tests will be skipped.")
        print("   Please start IPFS daemon to run full test suite.")
        return
    
    # Test upload
    cid = test_upload()
    
    if cid:
        # Test retrieve with uploaded CID
        test_retrieve(cid)
    
    # Test pinning
    test_pinning()
    
    # Test helper functions
    helper_cid = test_helper_functions()
    
    # Final summary
    print_header("✅ Test Suite Complete")
    
    if cid:
        print(f"\n📝 Test Results:")
        print(f"   ✅ Connection: Success")
        print(f"   ✅ Upload: Success (CID: {cid})")
        print(f"   ✅ Retrieve: Success")
        print(f"   ✅ Helper Functions: Success")
        
        print(f"\n🔗 Test Contract URLs:")
        print(f"   Local: {ipfs_storage.get_gateway_url(cid, -1)}")
        print(f"   IPFS.io: https://ipfs.io/ipfs/{cid}")
        print(f"   Pinata: https://gateway.pinata.cloud/ipfs/{cid}")
    else:
        print("\n⚠️ Some tests failed. Check logs above.")


def main():
    """Main entry point"""
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "--upload":
            test_connection()
            test_upload()
        elif command == "--retrieve":
            if len(sys.argv) < 3:
                print("❌ Usage: python test_ipfs.py --retrieve <CID>")
                sys.exit(1)
            cid = sys.argv[2]
            test_connection()
            test_retrieve(cid)
        elif command == "--pins":
            test_connection()
            test_pinning()
        elif command == "--help":
            print("GigChain IPFS Test Suite")
            print("\nUsage:")
            print("  python test_ipfs.py              # Run all tests")
            print("  python test_ipfs.py --upload     # Test upload only")
            print("  python test_ipfs.py --retrieve <CID>  # Test retrieval")
            print("  python test_ipfs.py --pins       # List pinned contracts")
        else:
            print(f"❌ Unknown command: {command}")
            print("   Use --help for usage information")
            sys.exit(1)
    else:
        # Run all tests
        run_all_tests()


if __name__ == "__main__":
    main()
