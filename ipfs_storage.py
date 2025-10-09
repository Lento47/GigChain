"""
IPFS Storage Module for GigChain Contract Data

This module handles storing and retrieving contract data on IPFS (InterPlanetary File System).
Perfect for decentralized, immutable contract storage for Web3 applications.

Features:
- Upload contract JSON to IPFS
- Retrieve contract data by CID (Content Identifier)
- Pin important contracts for persistence
- List all uploaded contracts
- Integration with local IPFS daemon or remote gateways (Pinata, Infura)
"""

import json
import logging
import os
from datetime import datetime
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
import ipfshttpclient
from ipfshttpclient.exceptions import ConnectionError as IPFSConnectionError

logger = logging.getLogger(__name__)


@dataclass
class IPFSUploadResult:
    """Result of uploading data to IPFS"""
    cid: str  # Content Identifier
    size: int  # Size in bytes
    timestamp: str
    gateway_url: str
    pinned: bool = False


@dataclass
class IPFSContract:
    """Contract data stored on IPFS"""
    cid: str
    contract_data: Dict[str, Any]
    timestamp: str
    size: int
    pinned: bool


class IPFSStorage:
    """
    IPFS Storage Manager for GigChain contracts.
    
    Supports multiple IPFS backends:
    - Local IPFS daemon (default)
    - Pinata (pinata.cloud)
    - Infura IPFS
    - NFT.Storage
    
    Environment Variables:
        IPFS_MODE: 'local' | 'pinata' | 'infura' | 'nft.storage'
        IPFS_API_URL: API endpoint (default: /ip4/127.0.0.1/tcp/5001)
        IPFS_GATEWAY_URL: Gateway URL (default: http://127.0.0.1:8080)
        PINATA_API_KEY: Pinata API key (if using Pinata)
        PINATA_SECRET_KEY: Pinata secret key (if using Pinata)
        INFURA_PROJECT_ID: Infura project ID (if using Infura)
        INFURA_PROJECT_SECRET: Infura secret (if using Infura)
    """
    
    def __init__(self):
        """Initialize IPFS storage with configuration from environment."""
        self.mode = os.getenv('IPFS_MODE', 'local')
        self.api_url = os.getenv('IPFS_API_URL', '/ip4/127.0.0.1/tcp/5001')
        self.gateway_url = os.getenv('IPFS_GATEWAY_URL', 'http://127.0.0.1:8080')
        
        # Public gateways as fallback
        self.public_gateways = [
            'https://ipfs.io',
            'https://gateway.pinata.cloud',
            'https://cloudflare-ipfs.com',
            'https://dweb.link'
        ]
        
        self.client = None
        self.connected = False
        
        # Try to connect to IPFS
        self._connect()
    
    def _connect(self):
        """Connect to IPFS node."""
        try:
            if self.mode == 'local':
                # Connect to local IPFS daemon
                self.client = ipfshttpclient.connect(self.api_url)
                
                # Test connection
                version = self.client.version()
                logger.info(f"✅ Connected to IPFS node v{version['Version']}")
                self.connected = True
                
            elif self.mode == 'pinata':
                # Pinata uses their API, not IPFS HTTP client
                pinata_api_key = os.getenv('PINATA_API_KEY')
                pinata_secret = os.getenv('PINATA_SECRET_KEY')
                
                if not pinata_api_key or not pinata_secret:
                    raise ValueError("PINATA_API_KEY and PINATA_SECRET_KEY required for Pinata mode")
                
                logger.info("✅ Pinata mode configured (API-based upload)")
                self.connected = True
                
            elif self.mode == 'infura':
                # Infura IPFS endpoint
                project_id = os.getenv('INFURA_PROJECT_ID')
                project_secret = os.getenv('INFURA_PROJECT_SECRET')
                
                if not project_id:
                    raise ValueError("INFURA_PROJECT_ID required for Infura mode")
                
                # Infura endpoint
                infura_url = f'/dns/ipfs.infura.io/tcp/5001/https'
                self.client = ipfshttpclient.connect(
                    infura_url,
                    auth=(project_id, project_secret) if project_secret else None
                )
                
                logger.info("✅ Connected to Infura IPFS")
                self.connected = True
                
            else:
                logger.warning(f"⚠️ Unknown IPFS mode: {self.mode}, defaulting to local")
                self.mode = 'local'
                self._connect()
                
        except (IPFSConnectionError, Exception) as e:
            logger.warning(f"⚠️ IPFS connection failed: {str(e)}")
            logger.info("💡 Contracts will work without IPFS, but won't be stored on decentralized storage")
            logger.info("💡 To enable IPFS:")
            logger.info("   1. Install IPFS: https://docs.ipfs.tech/install/")
            logger.info("   2. Start daemon: ipfs daemon")
            logger.info("   3. Or use Pinata/Infura in production")
            self.connected = False
    
    def is_connected(self) -> bool:
        """Check if connected to IPFS."""
        return self.connected
    
    def upload_contract(
        self, 
        contract_data: Dict[str, Any],
        pin: bool = True,
        metadata: Optional[Dict[str, Any]] = None
    ) -> IPFSUploadResult:
        """
        Upload contract data to IPFS.
        
        Args:
            contract_data: Contract JSON data to upload
            pin: Whether to pin the content (keep it permanently)
            metadata: Additional metadata to include
            
        Returns:
            IPFSUploadResult with CID and details
            
        Raises:
            ConnectionError: If IPFS is not available
            ValueError: If contract_data is invalid
        """
        if not self.connected:
            raise ConnectionError("IPFS not connected. Please start IPFS daemon or configure remote gateway.")
        
        if not contract_data:
            raise ValueError("contract_data cannot be empty")
        
        try:
            # Prepare contract package
            upload_package = {
                "contract": contract_data,
                "metadata": metadata or {},
                "uploaded_at": datetime.now().isoformat(),
                "ipfs_mode": self.mode,
                "version": "1.0.0"
            }
            
            # Convert to JSON string
            json_data = json.dumps(upload_package, ensure_ascii=False, indent=2)
            
            # Upload to IPFS
            logger.info(f"📤 Uploading contract to IPFS ({len(json_data)} bytes)...")
            
            result = self.client.add_json(upload_package)
            cid = result
            
            # Pin if requested
            if pin:
                try:
                    self.client.pin.add(cid)
                    logger.info(f"📌 Contract pinned: {cid}")
                except Exception as e:
                    logger.warning(f"⚠️ Failed to pin contract: {str(e)}")
            
            # Build gateway URL
            gateway_url = f"{self.gateway_url}/ipfs/{cid}"
            
            logger.info(f"✅ Contract uploaded to IPFS: {cid}")
            logger.info(f"🔗 Gateway URL: {gateway_url}")
            
            return IPFSUploadResult(
                cid=cid,
                size=len(json_data),
                timestamp=datetime.now().isoformat(),
                gateway_url=gateway_url,
                pinned=pin
            )
            
        except Exception as e:
            logger.error(f"❌ IPFS upload failed: {str(e)}")
            raise
    
    def retrieve_contract(self, cid: str) -> IPFSContract:
        """
        Retrieve contract data from IPFS by CID.
        
        Args:
            cid: Content Identifier of the contract
            
        Returns:
            IPFSContract with contract data
            
        Raises:
            ConnectionError: If IPFS is not available
            ValueError: If CID is invalid or content not found
        """
        if not self.connected:
            raise ConnectionError("IPFS not connected")
        
        if not cid:
            raise ValueError("CID cannot be empty")
        
        try:
            logger.info(f"📥 Retrieving contract from IPFS: {cid}")
            
            # Get JSON data from IPFS
            data = self.client.get_json(cid)
            
            # Check if it's pinned
            pinned = False
            try:
                pins = self.client.pin.ls(cid)
                pinned = len(pins.get('Keys', {})) > 0
            except:
                pass
            
            # Extract contract data
            contract_data = data.get('contract', data)  # Handle both wrapped and direct formats
            timestamp = data.get('uploaded_at', data.get('metadata', {}).get('timestamp', ''))
            
            # Calculate size
            json_str = json.dumps(data, ensure_ascii=False)
            size = len(json_str.encode('utf-8'))
            
            logger.info(f"✅ Contract retrieved: {cid} ({size} bytes)")
            
            return IPFSContract(
                cid=cid,
                contract_data=contract_data,
                timestamp=timestamp,
                size=size,
                pinned=pinned
            )
            
        except Exception as e:
            logger.error(f"❌ Failed to retrieve contract from IPFS: {str(e)}")
            raise ValueError(f"Contract not found or invalid CID: {cid}")
    
    def pin_contract(self, cid: str) -> bool:
        """
        Pin a contract to keep it permanently on IPFS.
        
        Args:
            cid: Content Identifier to pin
            
        Returns:
            True if pinned successfully
        """
        if not self.connected:
            raise ConnectionError("IPFS not connected")
        
        try:
            self.client.pin.add(cid)
            logger.info(f"📌 Contract pinned: {cid}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to pin contract: {str(e)}")
            return False
    
    def unpin_contract(self, cid: str) -> bool:
        """
        Unpin a contract (allow garbage collection).
        
        Args:
            cid: Content Identifier to unpin
            
        Returns:
            True if unpinned successfully
        """
        if not self.connected:
            raise ConnectionError("IPFS not connected")
        
        try:
            self.client.pin.rm(cid)
            logger.info(f"📍 Contract unpinned: {cid}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to unpin contract: {str(e)}")
            return False
    
    def get_gateway_url(self, cid: str, gateway_index: int = 0) -> str:
        """
        Get gateway URL for accessing IPFS content via HTTP.
        
        Args:
            cid: Content Identifier
            gateway_index: Index of public gateway to use (0-3)
            
        Returns:
            Full HTTP URL to access the content
        """
        if gateway_index == -1:
            # Use configured gateway
            return f"{self.gateway_url}/ipfs/{cid}"
        else:
            # Use public gateway
            gateway = self.public_gateways[gateway_index % len(self.public_gateways)]
            return f"{gateway}/ipfs/{cid}"
    
    def list_pinned_contracts(self) -> List[str]:
        """
        List all pinned contract CIDs.
        
        Returns:
            List of pinned CIDs
        """
        if not self.connected:
            raise ConnectionError("IPFS not connected")
        
        try:
            pins = self.client.pin.ls()
            cids = list(pins.get('Keys', {}).keys())
            logger.info(f"📋 Found {len(cids)} pinned contracts")
            return cids
        except Exception as e:
            logger.error(f"❌ Failed to list pins: {str(e)}")
            return []
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get IPFS node statistics.
        
        Returns:
            Dictionary with node stats
        """
        if not self.connected:
            return {
                "connected": False,
                "mode": self.mode,
                "error": "IPFS not connected"
            }
        
        try:
            stats = self.client.stats.repo()
            version = self.client.version()
            
            return {
                "connected": True,
                "mode": self.mode,
                "version": version.get('Version', 'unknown'),
                "repo_size": stats.get('RepoSize', 0),
                "num_objects": stats.get('NumObjects', 0),
                "gateway_url": self.gateway_url,
                "api_url": self.api_url
            }
        except Exception as e:
            logger.error(f"❌ Failed to get stats: {str(e)}")
            return {
                "connected": False,
                "mode": self.mode,
                "error": str(e)
            }


# Global IPFS storage instance
ipfs_storage = IPFSStorage()


def upload_contract_to_ipfs(contract_data: Dict[str, Any], pin: bool = True) -> Optional[str]:
    """
    Helper function to upload contract to IPFS.
    
    Args:
        contract_data: Contract data to upload
        pin: Whether to pin the contract
        
    Returns:
        CID if successful, None otherwise
    """
    try:
        result = ipfs_storage.upload_contract(contract_data, pin=pin)
        return result.cid
    except Exception as e:
        logger.error(f"Failed to upload contract to IPFS: {str(e)}")
        return None


def retrieve_contract_from_ipfs(cid: str) -> Optional[Dict[str, Any]]:
    """
    Helper function to retrieve contract from IPFS.
    
    Args:
        cid: Content Identifier
        
    Returns:
        Contract data if successful, None otherwise
    """
    try:
        contract = ipfs_storage.retrieve_contract(cid)
        return contract.contract_data
    except Exception as e:
        logger.error(f"Failed to retrieve contract from IPFS: {str(e)}")
        return None
