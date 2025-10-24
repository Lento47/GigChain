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
- Robust error handling with retries and exponential backoff
- Timeout protection for all IPFS operations
"""

import json
import logging
import os
import time
from datetime import datetime
from typing import Dict, Any, Optional, List, Union
from dataclasses import dataclass
from functools import wraps
import ipfshttpclient
from ipfshttpclient.exceptions import ConnectionError as IPFSConnectionError
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from ipfs_adapter import IPFSAdapter, IPFSAdapterConfig

logger = logging.getLogger(__name__)


# Configuration for retry behavior
IPFS_RETRY_CONFIG = {
    'stop': stop_after_attempt(3),
    'wait': wait_exponential(multiplier=1, min=1, max=10),
    'retry': retry_if_exception_type((IPFSConnectionError, ConnectionError, TimeoutError))
}


def ipfs_retry_operation(operation_name: str):
    """
    Decorator to add retry logic with exponential backoff to IPFS operations.
    
    Args:
        operation_name: Name of the operation for logging purposes
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            @retry(**IPFS_RETRY_CONFIG)
            def _retry_operation():
                logger.debug(f"Attempting IPFS {operation_name}...")
                return func(*args, **kwargs)
            
            try:
                return _retry_operation()
            except Exception as e:
                logger.error(f"IPFS {operation_name} failed after retries: {str(e)}")
                raise
        return wrapper
    return decorator


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
        IPFS_TIMEOUT: Timeout in seconds for IPFS operations (default: 30)
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
        self.timeout = int(os.getenv('IPFS_TIMEOUT', '30'))
        
        # Public gateways as fallback
        self.public_gateways = [
            'https://ipfs.io',
            'https://gateway.pinata.cloud',
            'https://cloudflare-ipfs.com',
            'https://dweb.link'
        ]
        
        # Initialize IPFS adapter
        adapter_config = IPFSAdapterConfig(
            timeout=self.timeout,
            api_url=self.api_url,
            gateway_url=self.gateway_url
        )
        self.adapter = IPFSAdapter(adapter_config)
        self.client = self.adapter
        self.connected = self.adapter.is_connected()
    
    def _connect(self):
        """Connect to IPFS node using adapter."""
        try:
            if self.mode == 'local':
                # Use adapter for local connection
                self.connected = self.adapter.is_connected()
                if self.connected:
                    logger.info("✅ Connected to local IPFS via adapter")
                else:
                    logger.warning("⚠️ Failed to connect to local IPFS via adapter")
                
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
                
                # Update adapter config for Infura
                infura_url = f'/dns/ipfs.infura.io/tcp/5001/https'
                adapter_config = IPFSAdapterConfig(
                    timeout=self.timeout,
                    api_url=infura_url,
                    gateway_url=self.gateway_url
                )
                self.adapter = IPFSAdapter(adapter_config)
                self.client = self.adapter
                self.connected = self.adapter.is_connected()
                
                if self.connected:
                    logger.info("✅ Connected to Infura IPFS via adapter")
                else:
                    logger.warning("⚠️ Failed to connect to Infura IPFS via adapter")
                
            else:
                logger.warning(f"⚠️ Unknown IPFS mode: {self.mode}, defaulting to local")
                self.mode = 'local'
                self._connect()
                
        except Exception as e:
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
    
    @ipfs_retry_operation("upload")
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
            
            # Upload to IPFS using adapter
            logger.info(f"📤 Uploading contract to IPFS ({len(json_data)} bytes)...")
            
            cid = self.adapter.add_json(upload_package)
            
            # Pin if requested
            if pin:
                try:
                    self.adapter.pin_add(cid)
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
    
    @ipfs_retry_operation("retrieve")
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
            
            # Get JSON data from IPFS using adapter
            data = self.adapter.get_json(cid)
            
            # Check if it's pinned
            pinned = False
            try:
                pins = self.adapter.pin_ls(cid)
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
    
    @ipfs_retry_operation("pin")
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
            success = self.adapter.pin_add(cid)
            if success:
                logger.info(f"📌 Contract pinned: {cid}")
                return True
            else:
                logger.error(f"❌ Failed to pin contract: {cid}")
                return False
        except Exception as e:
            logger.error(f"❌ Failed to pin contract: {str(e)}")
            return False
    
    @ipfs_retry_operation("unpin")
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
            success = self.adapter.pin_rm(cid)
            if success:
                logger.info(f"📍 Contract unpinned: {cid}")
                return True
            else:
                logger.error(f"❌ Failed to unpin contract: {cid}")
                return False
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
        return self.adapter.get_gateway_url(cid, gateway_index)
    
    @ipfs_retry_operation("list_pins")
    def list_pinned_contracts(self) -> List[str]:
        """
        List all pinned contract CIDs.
        
        Returns:
            List of pinned CIDs
        """
        if not self.connected:
            raise ConnectionError("IPFS not connected")
        
        try:
            pins = self.adapter.pin_ls()
            cids = list(pins.get('Keys', {}).keys())
            logger.info(f"📋 Found {len(cids)} pinned contracts")
            return cids
        except Exception as e:
            logger.error(f"❌ Failed to list pins: {str(e)}")
            return []
    
    @ipfs_retry_operation("get_stats")
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
            stats = self.adapter.stats_repo()
            version = self.adapter.version()
            
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
    
    def _with_timeout(self, operation_name: str, operation_func, *args, **kwargs):
        """
        Execute an IPFS operation with timeout protection.
        
        Args:
            operation_name: Name of the operation for logging
            operation_func: Function to execute
            *args, **kwargs: Arguments to pass to the operation
            
        Returns:
            Result of the operation
            
        Raises:
            TimeoutError: If operation exceeds timeout
        """
        import signal
        
        def timeout_handler(signum, frame):
            raise TimeoutError(f"IPFS {operation_name} operation timed out after {self.timeout} seconds")
        
        # Set up timeout signal (Unix only)
        if hasattr(signal, 'SIGALRM'):
            old_handler = signal.signal(signal.SIGALRM, timeout_handler)
            signal.alarm(self.timeout)
        
        try:
            logger.debug(f"Executing IPFS {operation_name} with {self.timeout}s timeout")
            result = operation_func(*args, **kwargs)
            logger.debug(f"IPFS {operation_name} completed successfully")
            return result
        except Exception as e:
            logger.error(f"IPFS {operation_name} failed: {str(e)}")
            raise
        finally:
            # Clean up timeout signal
            if hasattr(signal, 'SIGALRM'):
                signal.alarm(0)
                signal.signal(signal.SIGALRM, old_handler)


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
