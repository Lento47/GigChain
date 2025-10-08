"""
GigChain.io - Dispute Oracle API
REST API endpoints for dispute resolution system.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging
import hashlib

from dispute_oracle_system import (
    dispute_oracle,
    DisputeStatus,
    DisputeOutcome
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/disputes", tags=["Dispute Oracle"])

class CreateDisputeRequest(BaseModel):
    """Request model for creating a dispute."""
    contract_id: str = Field(..., description="GigChain contract ID")
    contract_address: str = Field(..., description="Blockchain contract address")
    freelancer: str = Field(..., description="Freelancer wallet address")
    client: str = Field(..., description="Client wallet address")
    amount: float = Field(..., gt=0, description="Disputed amount")
    description: str = Field(..., min_length=10, max_length=2000, description="Dispute description")

class SubmitEvidenceRequest(BaseModel):
    """Request model for submitting evidence."""
    dispute_id: int = Field(..., description="Dispute ID")
    submitter: str = Field(..., description="Wallet address of submitter")
    evidence_hash: str = Field(..., description="IPFS hash of evidence")
    evidence_url: str = Field(..., description="URL to access evidence")
    description: str = Field(..., description="Evidence description")
    file_type: str = Field(default="document", description="Type of evidence file")

class CastVoteRequest(BaseModel):
    """Request model for casting a vote."""
    dispute_id: int = Field(..., description="Dispute ID")
    oracle_address: str = Field(..., description="Oracle wallet address")
    outcome: str = Field(..., description="Vote outcome: freelancer_wins or client_wins")

@router.post("/create")
async def create_dispute(request: CreateDisputeRequest):
    """
    Create a new dispute.
    
    Initiates a dispute resolution process with the decentralized oracle network.
    """
    try:
        dispute_id = dispute_oracle.create_dispute(
            contract_id=request.contract_id,
            contract_address=request.contract_address,
            freelancer=request.freelancer,
            client=request.client,
            amount=request.amount,
            description=request.description
        )
        
        logger.info(f"Dispute {dispute_id} created for contract {request.contract_id}")
        
        return {
            "success": True,
            "dispute_id": dispute_id,
            "message": "Dispute created successfully",
            "next_steps": [
                "Submit evidence to support your case",
                "Wait for oracle network to review",
                "Dispute will be resolved through decentralized voting"
            ],
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error creating dispute: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/evidence/submit")
async def submit_evidence(request: SubmitEvidenceRequest):
    """
    Submit evidence for a dispute.
    
    Both parties can submit evidence to support their case.
    Evidence should be uploaded to IPFS or similar decentralized storage first.
    """
    try:
        success = dispute_oracle.submit_evidence(
            dispute_id=request.dispute_id,
            submitter=request.submitter,
            evidence_hash=request.evidence_hash,
            evidence_url=request.evidence_url,
            description=request.description,
            file_type=request.file_type
        )
        
        if success:
            return {
                "success": True,
                "message": "Evidence submitted successfully",
                "dispute_id": request.dispute_id,
                "evidence_hash": request.evidence_hash,
                "timestamp": datetime.now().isoformat()
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to submit evidence")
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error submitting evidence: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/vote")
async def cast_vote(request: CastVoteRequest):
    """
    Cast a vote on a dispute (Oracle only).
    
    Only registered oracles can vote on disputes.
    Votes are weighted by oracle reputation.
    """
    try:
        # Validate outcome
        if request.outcome not in ["freelancer_wins", "client_wins"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid outcome. Must be 'freelancer_wins' or 'client_wins'"
            )
        
        outcome = DisputeOutcome(request.outcome)
        
        success = dispute_oracle.cast_vote(
            dispute_id=request.dispute_id,
            oracle_address=request.oracle_address,
            outcome=outcome
        )
        
        if success:
            return {
                "success": True,
                "message": "Vote cast successfully",
                "dispute_id": request.dispute_id,
                "outcome": request.outcome,
                "timestamp": datetime.now().isoformat()
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to cast vote")
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error casting vote: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{dispute_id}")
async def get_dispute(dispute_id: int):
    """
    Get details of a specific dispute.
    
    Returns all information about the dispute including evidence and voting status.
    """
    try:
        dispute = dispute_oracle.get_dispute(dispute_id)
        
        if not dispute:
            raise HTTPException(status_code=404, detail="Dispute not found")
        
        return {
            "success": True,
            "dispute": dispute,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting dispute: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user/{user_address}")
async def get_user_disputes(user_address: str):
    """
    Get all disputes for a user.
    
    Returns disputes where the user is either the freelancer or client.
    """
    try:
        disputes = dispute_oracle.get_user_disputes(user_address)
        
        return {
            "success": True,
            "user_address": user_address,
            "dispute_count": len(disputes),
            "disputes": disputes,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting user disputes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/active/list")
async def get_active_disputes():
    """
    Get all active disputes for oracle voting.
    
    Returns disputes that are currently under review and accepting votes.
    """
    try:
        disputes = dispute_oracle.get_active_disputes()
        
        return {
            "success": True,
            "active_dispute_count": len(disputes),
            "disputes": disputes,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting active disputes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/statistics/overview")
async def get_dispute_statistics():
    """
    Get dispute system statistics.
    
    Returns metrics about the dispute resolution system.
    """
    try:
        stats = dispute_oracle.get_statistics()
        
        return {
            "success": True,
            "statistics": stats,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting dispute statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/evidence/upload")
async def upload_evidence_file(
    file: UploadFile = File(...),
    dispute_id: int = 0,
    submitter: str = "",
    description: str = ""
):
    """
    Upload evidence file (simplified version).
    
    In production, this would upload to IPFS and return the hash.
    For now, it generates a hash and returns a mock URL.
    """
    try:
        # Read file content
        content = await file.read()
        
        # Generate hash (mock IPFS hash)
        file_hash = hashlib.sha256(content).hexdigest()
        evidence_hash = f"Qm{file_hash[:44]}"  # Mock IPFS hash format
        
        # Mock evidence URL
        evidence_url = f"ipfs://{evidence_hash}"
        
        # In production, upload to IPFS here
        # evidence_url = await upload_to_ipfs(content)
        
        return {
            "success": True,
            "evidence_hash": evidence_hash,
            "evidence_url": evidence_url,
            "file_name": file.filename,
            "file_size": len(content),
            "message": "File uploaded successfully. Use the hash to submit evidence.",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error uploading evidence file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def dispute_oracle_health():
    """Health check for dispute oracle system."""
    try:
        stats = dispute_oracle.get_statistics()
        
        return {
            "status": "healthy",
            "service": "Dispute Oracle",
            "version": "1.0.0",
            "blockchain_connected": dispute_oracle.w3 is not None,
            "contract_address": dispute_oracle.contract_address,
            "total_disputes": stats["total_disputes"],
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Dispute oracle health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "service": "Dispute Oracle",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
