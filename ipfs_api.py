"""
IPFS API Endpoints for GigChain

FastAPI routes for IPFS contract storage operations.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import datetime
import logging

from ipfs_storage import ipfs_storage, IPFSUploadResult
from auth import get_current_wallet, get_optional_wallet

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ipfs", tags=["IPFS Storage"])


# Pydantic models
class IPFSUploadRequest(BaseModel):
    contract_data: Dict[str, Any] = Field(..., description="Contract data to upload to IPFS")
    pin: bool = Field(True, description="Whether to pin the content")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")


class IPFSUploadResponse(BaseModel):
    success: bool
    cid: Optional[str] = None
    gateway_url: Optional[str] = None
    size: Optional[int] = None
    timestamp: Optional[str] = None
    pinned: Optional[bool] = None
    public_gateways: Optional[List[str]] = None
    error: Optional[str] = None


class IPFSRetrieveResponse(BaseModel):
    success: bool
    cid: Optional[str] = None
    contract_data: Optional[Dict[str, Any]] = None
    timestamp: Optional[str] = None
    size: Optional[int] = None
    pinned: Optional[bool] = None
    gateway_urls: Optional[List[str]] = None
    error: Optional[str] = None


class IPFSPinRequest(BaseModel):
    cid: str = Field(..., description="Content Identifier to pin")


class IPFSStatusResponse(BaseModel):
    connected: bool
    mode: str
    version: Optional[str] = None
    gateway_url: Optional[str] = None
    api_url: Optional[str] = None
    repo_size: Optional[int] = None
    num_objects: Optional[int] = None
    error: Optional[str] = None


@router.get("/status", response_model=IPFSStatusResponse)
async def get_ipfs_status():
    """
    Get IPFS node status and connection information.
    
    Returns node version, connection status, and statistics.
    """
    try:
        stats = ipfs_storage.get_stats()
        
        return IPFSStatusResponse(
            connected=stats.get('connected', False),
            mode=stats.get('mode', 'unknown'),
            version=stats.get('version'),
            gateway_url=stats.get('gateway_url'),
            api_url=stats.get('api_url'),
            repo_size=stats.get('repo_size'),
            num_objects=stats.get('num_objects'),
            error=stats.get('error')
        )
    except Exception as e:
        logger.error(f"Failed to get IPFS status: {str(e)}")
        return IPFSStatusResponse(
            connected=False,
            mode='unknown',
            error=str(e)
        )


@router.post("/upload", response_model=IPFSUploadResponse)
async def upload_to_ipfs(
    request: IPFSUploadRequest,
    wallet: Optional[Dict[str, Any]] = Depends(get_optional_wallet)
):
    """
    Upload contract data to IPFS.
    
    Uploads contract JSON to IPFS and returns the CID (Content Identifier).
    Optionally pins the content for persistence.
    
    Returns:
        - CID: Unique content identifier
        - Gateway URLs: HTTP URLs to access the content
        - Size: Upload size in bytes
        - Pinned status
    """
    try:
        if not ipfs_storage.is_connected():
            raise HTTPException(
                status_code=503,
                detail="IPFS not available. Please start IPFS daemon or configure remote gateway."
            )
        
        # Add wallet address to metadata if authenticated
        metadata = request.metadata or {}
        if wallet:
            metadata['uploaded_by'] = wallet.get('address')
            metadata['authenticated'] = True
        
        # Upload to IPFS
        logger.info(f"Uploading contract to IPFS (pin={request.pin})...")
        
        result = ipfs_storage.upload_contract(
            contract_data=request.contract_data,
            pin=request.pin,
            metadata=metadata
        )
        
        # Generate public gateway URLs
        public_gateways = [
            ipfs_storage.get_gateway_url(result.cid, i)
            for i in range(len(ipfs_storage.public_gateways))
        ]
        
        logger.info(f"✅ Contract uploaded successfully: {result.cid}")
        
        return IPFSUploadResponse(
            success=True,
            cid=result.cid,
            gateway_url=result.gateway_url,
            size=result.size,
            timestamp=result.timestamp,
            pinned=result.pinned,
            public_gateways=public_gateways
        )
        
    except HTTPException:
        raise
    except ConnectionError as e:
        logger.error(f"IPFS connection error: {str(e)}")
        return IPFSUploadResponse(
            success=False,
            error=str(e)
        )
    except Exception as e:
        logger.error(f"IPFS upload error: {str(e)}")
        return IPFSUploadResponse(
            success=False,
            error=f"Upload failed: {str(e)}"
        )


@router.get("/retrieve/{cid}", response_model=IPFSRetrieveResponse)
async def retrieve_from_ipfs(cid: str):
    """
    Retrieve contract data from IPFS by CID.
    
    Fetches contract JSON from IPFS using the Content Identifier.
    
    Args:
        cid: Content Identifier (IPFS hash)
        
    Returns:
        Contract data and metadata
    """
    try:
        if not ipfs_storage.is_connected():
            raise HTTPException(
                status_code=503,
                detail="IPFS not available"
            )
        
        logger.info(f"Retrieving contract from IPFS: {cid}")
        
        # Retrieve from IPFS
        contract = ipfs_storage.retrieve_contract(cid)
        
        # Generate gateway URLs
        gateway_urls = [
            ipfs_storage.get_gateway_url(cid, i)
            for i in range(-1, len(ipfs_storage.public_gateways))
        ]
        
        logger.info(f"✅ Contract retrieved successfully: {cid}")
        
        return IPFSRetrieveResponse(
            success=True,
            cid=contract.cid,
            contract_data=contract.contract_data,
            timestamp=contract.timestamp,
            size=contract.size,
            pinned=contract.pinned,
            gateway_urls=gateway_urls
        )
        
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Invalid CID or contract not found: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"IPFS retrieval error: {str(e)}")
        return IPFSRetrieveResponse(
            success=False,
            error=f"Retrieval failed: {str(e)}"
        )


@router.post("/pin", response_model=Dict[str, Any])
async def pin_contract(
    request: IPFSPinRequest,
    wallet: Dict[str, Any] = Depends(get_current_wallet)
):
    """
    Pin a contract on IPFS to keep it permanently.
    
    Pinning prevents the content from being garbage collected.
    Requires authentication.
    
    Args:
        cid: Content Identifier to pin
        
    Returns:
        Success status
    """
    try:
        if not ipfs_storage.is_connected():
            raise HTTPException(
                status_code=503,
                detail="IPFS not available"
            )
        
        logger.info(f"Pinning contract: {request.cid} (by {wallet.get('address')})")
        
        success = ipfs_storage.pin_contract(request.cid)
        
        if success:
            return {
                "success": True,
                "cid": request.cid,
                "message": "Contract pinned successfully",
                "pinned_by": wallet.get('address')
            }
        else:
            return {
                "success": False,
                "error": "Failed to pin contract"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Pin error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Pin failed: {str(e)}")


@router.delete("/pin/{cid}", response_model=Dict[str, Any])
async def unpin_contract(
    cid: str,
    wallet: Dict[str, Any] = Depends(get_current_wallet)
):
    """
    Unpin a contract on IPFS (allow garbage collection).
    
    Requires authentication.
    
    Args:
        cid: Content Identifier to unpin
        
    Returns:
        Success status
    """
    try:
        if not ipfs_storage.is_connected():
            raise HTTPException(
                status_code=503,
                detail="IPFS not available"
            )
        
        logger.info(f"Unpinning contract: {cid} (by {wallet.get('address')})")
        
        success = ipfs_storage.unpin_contract(cid)
        
        if success:
            return {
                "success": True,
                "cid": cid,
                "message": "Contract unpinned successfully",
                "unpinned_by": wallet.get('address')
            }
        else:
            return {
                "success": False,
                "error": "Failed to unpin contract"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unpin error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unpin failed: {str(e)}")


@router.get("/pins", response_model=Dict[str, Any])
async def list_pinned_contracts(wallet: Dict[str, Any] = Depends(get_current_wallet)):
    """
    List all pinned contracts.
    
    Requires authentication.
    
    Returns:
        List of pinned CIDs
    """
    try:
        if not ipfs_storage.is_connected():
            raise HTTPException(
                status_code=503,
                detail="IPFS not available"
            )
        
        cids = ipfs_storage.list_pinned_contracts()
        
        return {
            "success": True,
            "total_pinned": len(cids),
            "cids": cids,
            "requested_by": wallet.get('address')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"List pins error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list pins: {str(e)}")


@router.get("/gateway/{cid}")
async def get_gateway_urls(cid: str):
    """
    Get all available gateway URLs for a CID.
    
    Returns multiple HTTP gateway URLs to access the IPFS content.
    
    Args:
        cid: Content Identifier
        
    Returns:
        List of gateway URLs
    """
    try:
        # Local gateway
        local_url = ipfs_storage.get_gateway_url(cid, -1)
        
        # Public gateways
        public_urls = [
            ipfs_storage.get_gateway_url(cid, i)
            for i in range(len(ipfs_storage.public_gateways))
        ]
        
        return {
            "success": True,
            "cid": cid,
            "local_gateway": local_url,
            "public_gateways": public_urls,
            "total_gateways": len(public_urls) + 1
        }
        
    except Exception as e:
        logger.error(f"Gateway URLs error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate gateway URLs: {str(e)}")
