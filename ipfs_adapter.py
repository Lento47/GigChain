"""
IPFS Adapter for GigChain

This module provides a stable adapter layer over the alpha IPFS HTTP client,
providing better error handling, retries, and timeout management.

The adapter isolates the alpha client dependency and provides a stable interface
that can be easily swapped out when a stable version becomes available.
"""

import json
import logging
import time
from typing import Dict, Any, Optional, List, Union
from dataclasses import dataclass
import ipfshttpclient
from ipfshttpclient.exceptions import ConnectionError as IPFSConnectionError
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)


@dataclass
class IPFSAdapterConfig:
    """Configuration for IPFS adapter."""
    timeout: int = 30
    max_retries: int = 3
    retry_delay: float = 1.0
    max_retry_delay: float = 10.0
    api_url: str = '/ip4/127.0.0.1/tcp/5001'
    gateway_url: str = 'http://127.0.0.1:8080'


class IPFSAdapter:
    """
    Stable adapter for IPFS HTTP client.
    
    This adapter wraps the alpha IPFS client and provides:
    - Retry logic with exponential backoff
    - Timeout protection
    - Better error handling
    - Stable interface for future client updates
    """
    
    def __init__(self, config: Optional[IPFSAdapterConfig] = None):
        """Initialize IPFS adapter with configuration."""
        self.config = config or IPFSAdapterConfig()
        self.client = None
        self.connected = False
        self._connect()
    
    def _connect(self):
        """Connect to IPFS node with retry logic."""
        @retry(
            stop=stop_after_attempt(self.config.max_retries),
            wait=wait_exponential(
                multiplier=self.config.retry_delay,
                min=self.config.retry_delay,
                max=self.config.max_retry_delay
            ),
            retry=retry_if_exception_type((IPFSConnectionError, ConnectionError))
        )
        def _connect_with_retry():
            try:
                self.client = ipfshttpclient.connect(
                    self.config.api_url,
                    timeout=self.config.timeout
                )
                # Test connection
                version = self.client.version()
                logger.info(f"✅ IPFS Adapter connected to node v{version['Version']}")
                self.connected = True
                return True
            except Exception as e:
                logger.error(f"❌ IPFS Adapter connection failed: {str(e)}")
                self.connected = False
                raise
        
        try:
            _connect_with_retry()
        except Exception as e:
            logger.warning(f"⚠️ IPFS Adapter connection failed after retries: {str(e)}")
            self.connected = False
    
    def is_connected(self) -> bool:
        """Check if adapter is connected to IPFS."""
        return self.connected and self.client is not None
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type((IPFSConnectionError, ConnectionError, TimeoutError))
    )
    def add_json(self, data: Dict[str, Any]) -> str:
        """
        Add JSON data to IPFS with retry logic.
        
        Args:
            data: Dictionary to add to IPFS
            
        Returns:
            CID (Content Identifier)
            
        Raises:
            ConnectionError: If IPFS is not available
            TimeoutError: If operation times out
        """
        if not self.is_connected():
            raise ConnectionError("IPFS adapter not connected")
        
        try:
            logger.debug(f"Adding JSON data to IPFS ({len(json.dumps(data))} bytes)")
            cid = self.client.add_json(data)
            logger.debug(f"✅ JSON data added to IPFS: {cid}")
            return cid
        except Exception as e:
            logger.error(f"❌ Failed to add JSON to IPFS: {str(e)}")
            raise
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type((IPFSConnectionError, ConnectionError, TimeoutError))
    )
    def get_json(self, cid: str) -> Dict[str, Any]:
        """
        Get JSON data from IPFS with retry logic.
        
        Args:
            cid: Content Identifier
            
        Returns:
            JSON data from IPFS
            
        Raises:
            ConnectionError: If IPFS is not available
            ValueError: If CID is invalid or content not found
            TimeoutError: If operation times out
        """
        if not self.is_connected():
            raise ConnectionError("IPFS adapter not connected")
        
        if not cid:
            raise ValueError("CID cannot be empty")
        
        try:
            logger.debug(f"Getting JSON data from IPFS: {cid}")
            data = self.client.get_json(cid)
            logger.debug(f"✅ JSON data retrieved from IPFS: {cid}")
            return data
        except Exception as e:
            logger.error(f"❌ Failed to get JSON from IPFS: {str(e)}")
            raise ValueError(f"Content not found or invalid CID: {cid}")
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type((IPFSConnectionError, ConnectionError, TimeoutError))
    )
    def pin_add(self, cid: str) -> bool:
        """
        Pin content on IPFS with retry logic.
        
        Args:
            cid: Content Identifier to pin
            
        Returns:
            True if pinned successfully
            
        Raises:
            ConnectionError: If IPFS is not available
            TimeoutError: If operation times out
        """
        if not self.is_connected():
            raise ConnectionError("IPFS adapter not connected")
        
        try:
            logger.debug(f"Pinning content on IPFS: {cid}")
            self.client.pin.add(cid)
            logger.debug(f"✅ Content pinned on IPFS: {cid}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to pin content on IPFS: {str(e)}")
            return False
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type((IPFSConnectionError, ConnectionError, TimeoutError))
    )
    def pin_rm(self, cid: str) -> bool:
        """
        Unpin content from IPFS with retry logic.
        
        Args:
            cid: Content Identifier to unpin
            
        Returns:
            True if unpinned successfully
            
        Raises:
            ConnectionError: If IPFS is not available
            TimeoutError: If operation times out
        """
        if not self.is_connected():
            raise ConnectionError("IPFS adapter not connected")
        
        try:
            logger.debug(f"Unpinning content from IPFS: {cid}")
            self.client.pin.rm(cid)
            logger.debug(f"✅ Content unpinned from IPFS: {cid}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to unpin content from IPFS: {str(e)}")
            return False
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type((IPFSConnectionError, ConnectionError, TimeoutError))
    )
    def pin_ls(self, cid: Optional[str] = None) -> Dict[str, Any]:
        """
        List pinned content on IPFS with retry logic.
        
        Args:
            cid: Optional specific CID to check, if None lists all pins
            
        Returns:
            Dictionary with pin information
            
        Raises:
            ConnectionError: If IPFS is not available
            TimeoutError: If operation times out
        """
        if not self.is_connected():
            raise ConnectionError("IPFS adapter not connected")
        
        try:
            logger.debug(f"Listing pinned content on IPFS: {cid or 'all'}")
            pins = self.client.pin.ls(cid) if cid else self.client.pin.ls()
            logger.debug(f"✅ Pinned content listed from IPFS")
            return pins
        except Exception as e:
            logger.error(f"❌ Failed to list pinned content from IPFS: {str(e)}")
            return {}
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type((IPFSConnectionError, ConnectionError, TimeoutError))
    )
    def version(self) -> Dict[str, Any]:
        """
        Get IPFS node version with retry logic.
        
        Returns:
            Dictionary with version information
            
        Raises:
            ConnectionError: If IPFS is not available
            TimeoutError: If operation times out
        """
        if not self.is_connected():
            raise ConnectionError("IPFS adapter not connected")
        
        try:
            logger.debug("Getting IPFS node version")
            version = self.client.version()
            logger.debug(f"✅ IPFS node version retrieved: {version.get('Version', 'unknown')}")
            return version
        except Exception as e:
            logger.error(f"❌ Failed to get IPFS node version: {str(e)}")
            raise
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type((IPFSConnectionError, ConnectionError, TimeoutError))
    )
    def stats_repo(self) -> Dict[str, Any]:
        """
        Get IPFS repository statistics with retry logic.
        
        Returns:
            Dictionary with repository statistics
            
        Raises:
            ConnectionError: If IPFS is not available
            TimeoutError: If operation times out
        """
        if not self.is_connected():
            raise ConnectionError("IPFS adapter not connected")
        
        try:
            logger.debug("Getting IPFS repository statistics")
            stats = self.client.stats.repo()
            logger.debug("✅ IPFS repository statistics retrieved")
            return stats
        except Exception as e:
            logger.error(f"❌ Failed to get IPFS repository statistics: {str(e)}")
            raise
    
    def get_gateway_url(self, cid: str, gateway_index: int = 0) -> str:
        """
        Get gateway URL for accessing IPFS content via HTTP.
        
        Args:
            cid: Content Identifier
            gateway_index: Index of public gateway to use
            
        Returns:
            Full HTTP URL to access the content
        """
        if gateway_index == -1:
            # Use configured gateway
            return f"{self.config.gateway_url}/ipfs/{cid}"
        else:
            # Use public gateway
            public_gateways = [
                'https://ipfs.io',
                'https://gateway.pinata.cloud',
                'https://cloudflare-ipfs.com',
                'https://dweb.link'
            ]
            gateway = public_gateways[gateway_index % len(public_gateways)]
            return f"{gateway}/ipfs/{cid}"
    
    def reconnect(self):
        """Reconnect to IPFS node."""
        logger.info("Reconnecting IPFS adapter...")
        self._connect()
    
    def close(self):
        """Close IPFS connection."""
        if self.client:
            try:
                self.client.close()
                logger.info("✅ IPFS adapter connection closed")
            except Exception as e:
                logger.warning(f"⚠️ Error closing IPFS adapter connection: {str(e)}")
        self.connected = False


# Global IPFS adapter instance
ipfs_adapter = IPFSAdapter()
