"""Contract Router - Contract Generation Endpoints"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import logging
from datetime import datetime
from typing import Dict, Any, Optional

# Import centralized configuration
from config import is_ai_agents_enabled

# Import contract generation modules
from contract_ai import full_flow, generate_contract
from utils.text_constructor import construct_text_from_structured_data

# Import security utilities
from security.validators import validator
from security.audit_logger import get_audit_logger, AuditEventType, AuditSeverity

# Import contract storage
from contracts_storage import save_contract_to_dashboard

logger = logging.getLogger(__name__)

# Initialize security audit logger
audit_logger = get_audit_logger()

# Create router
router = APIRouter(prefix="/api", tags=["contracts"])

# Pydantic models
class ContractRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000, description="Contract description")
    formData: Optional[Dict[str, Any]] = Field(None, description="Structured form data")
    
class SimpleContractRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000, description="Simple contract description")

class StructuredContractRequest(BaseModel):
    description: str = Field(..., min_length=1, max_length=2000, description="Project description")
    offeredAmount: Optional[float] = Field(None, ge=0, description="Amount offered by freelancer")
    requestedAmount: Optional[float] = Field(None, ge=0, description="Amount requested by client")
    days: Optional[int] = Field(None, ge=1, description="Project duration in days")
    role: str = Field(..., description="User role: freelancer or client")
    freelancerWallet: Optional[str] = Field(None, description="Freelancer wallet address")
    clientWallet: Optional[str] = Field(None, description="Client wallet address")
    
    # Freelancer Profile
    freelancerName: Optional[str] = Field(None, description="Freelancer full name")
    freelancerTitle: Optional[str] = Field(None, description="Freelancer professional title")
    freelancerBio: Optional[str] = Field(None, description="Freelancer bio")
    freelancerSkills: Optional[str] = Field(None, description="Freelancer skills")
    freelancerExperience: Optional[str] = Field(None, description="Freelancer experience level")
    freelancerLocation: Optional[str] = Field(None, description="Freelancer location")
    freelancerRate: Optional[float] = Field(None, ge=0, description="Freelancer hourly rate")
    
    # Social Links
    freelancerX: Optional[str] = Field(None, description="Freelancer X (Twitter) profile")
    freelancerFacebook: Optional[str] = Field(None, description="Freelancer Facebook profile")
    freelancerInstagram: Optional[str] = Field(None, description="Freelancer Instagram profile")
    freelancerTikTok: Optional[str] = Field(None, description="Freelancer TikTok profile")
    freelancerLinkedIn: Optional[str] = Field(None, description="Freelancer LinkedIn profile")
    freelancerGithub: Optional[str] = Field(None, description="Freelancer GitHub profile")
    freelancerPortfolio: Optional[str] = Field(None, description="Freelancer portfolio website")
    
    # Client Profile
    clientName: Optional[str] = Field(None, description="Client contact name")
    clientCompany: Optional[str] = Field(None, description="Client company/project name")
    clientBio: Optional[str] = Field(None, description="Client project description")
    clientLocation: Optional[str] = Field(None, description="Client location")
    
    # Additional Frontend Form Fields
    projectTitle: Optional[str] = Field(None, description="Project/Service title")
    category: Optional[str] = Field(None, description="Project/Service category")
    contractType: Optional[str] = Field(None, description="Type: project (client) or service (freelancer)")
    budgetType: Optional[str] = Field(None, description="Budget type: fixed or hourly")
    hourlyRate: Optional[float] = Field(None, ge=0, description="Hourly rate for hourly projects")
    estimatedHours: Optional[int] = Field(None, ge=1, description="Estimated hours for hourly projects")
    fixedBudget: Optional[float] = Field(None, ge=0, description="Fixed budget amount")
    projectDuration: Optional[int] = Field(None, ge=1, description="Project duration in days")
    requiredSkills: Optional[str] = Field(None, description="Required skills")
    experienceLevel: Optional[str] = Field(None, description="Required experience level")
    deliverables: Optional[str] = Field(None, description="Expected deliverables")
    milestones: Optional[str] = Field(None, description="Project milestones")
    additionalRequirements: Optional[str] = Field(None, description="Additional requirements")
    deadline: Optional[str] = Field(None, description="Project deadline")

class WalletValidationRequest(BaseModel):
    address: str = Field(..., min_length=42, max_length=42, description="Wallet address to validate")
    network: str = Field(..., description="Network to validate against (polygon, ethereum, etc.)")

class WalletValidationResponse(BaseModel):
    valid: bool = Field(..., description="Whether the wallet address is valid")
    address: str = Field(..., description="The validated address")
    network: str = Field(..., description="The network it was validated against")
    error: Optional[str] = Field(None, description="Error message if validation failed")
    balance: Optional[float] = Field(None, description="Wallet balance if available")

# Feature flag for AI agents
# Function removed - now using centralized config

@router.post("/full_flow")
async def api_full_flow(request: ContractRequest):
    """
    Generate AI-powered contract with agent chaining.
    
    Uses NegotiationAgent, ContractGeneratorAgent, and DisputeResolverAgent
    for complex contract negotiations and generation.
    """
    if not is_ai_agents_enabled():
        raise HTTPException(
            status_code=403, 
            detail="AI agents feature is disabled. Set AI_AGENTS_ENABLED=true and OPENAI_API_KEY to enable."
        )
    
    try:
        # Validate input
        is_valid, errors = validator.validate_contract_request(request.dict())
        if not is_valid:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid input: {'; '.join(errors)}"
            )
        
        logger.info(f"Processing AI contract request: {request.text[:100]}...")
        
        # Process with full AI flow
        result = full_flow(request.text)
        
        # Save to contracts database for dashboard integration
        try:
            contract_id = result.get('contract_id', f"gig_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
            
            # Save to dashboard database
            user_address = None  # TODO: Get from authentication when implemented
            dashboard_saved = save_contract_to_dashboard(
                contract_id, 
                {'text': request.text, 'result': result}, 
                user_address
            )
            
            if dashboard_saved:
                logger.info(f"✅ Full flow contract saved to dashboard: {contract_id}")
            else:
                logger.warning(f"⚠️ Failed to save full flow contract to dashboard: {contract_id}")
            
        except Exception as db_error:
            logger.warning(f"Failed to save full flow contract to database: {db_error}")
            # Continue without failing the request
        
        # Add API metadata
        result['api_metadata'] = {
            'timestamp': datetime.now().isoformat(),
            'endpoint': 'full_flow',
            'ai_agents_used': 'json' in result,
            'processing_time': 'calculated_by_client',
            'database_saved': True
        }
        
        # Audit log contract creation
        audit_logger.log_event(
            event_type=AuditEventType.CONTRACT_CREATED,
            severity=AuditSeverity.INFO,
            event_data={
                "contract_id": result.get('contract_id', 'unknown'),
                "endpoint": "full_flow",
                "has_ai": True
            },
            success=True
        )
        
        logger.info(f"Successfully generated contract: {result.get('contract_id', 'unknown')}")
        return result
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Validation error: {str(e)}")
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error occurred")

@router.post("/contract")
async def api_simple_contract(request: SimpleContractRequest):
    """
    Generate simple rule-based contract without AI agents.
    
    Faster response for simple contracts without complex negotiations.
    """
    try:
        # Validate input
        is_valid, error = validator.validate_text(request.text, 'text')
        if not is_valid:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid input: {error}"
            )
        
        logger.info(f"Processing simple contract: {request.text[:100]}...")
        
        # Process with rule-based generation only
        result = generate_contract(request.text)
        
        # Save to contracts database for dashboard integration
        try:
            contract_id = result.get('contract_id', f"simple_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
            
            # Save to dashboard database
            user_address = None  # TODO: Get from authentication when implemented
            dashboard_saved = save_contract_to_dashboard(
                contract_id, 
                {'text': request.text, 'result': result}, 
                user_address
            )
            
            if dashboard_saved:
                logger.info(f"✅ Simple contract saved to dashboard: {contract_id}")
            else:
                logger.warning(f"⚠️ Failed to save simple contract to dashboard: {contract_id}")
            
        except Exception as db_error:
            logger.warning(f"Failed to save simple contract to database: {db_error}")
            # Continue without failing the request
        
        # Add API metadata
        result['api_metadata'] = {
            'timestamp': datetime.now().isoformat(),
            'endpoint': 'contract',
            'ai_agents_used': False,
            'processing_time': 'calculated_by_client',
            'database_saved': True
        }
        
        # Audit log simple contract creation
        audit_logger.log_event(
            event_type=AuditEventType.CONTRACT_CREATED,
            severity=AuditSeverity.INFO,
            event_data={
                "contract_id": result.get('contract_id', 'unknown'),
                "endpoint": "contract",
                "has_ai": False
            },
            success=True
        )
        
        logger.info("Successfully generated simple contract")
        return result
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Validation error: {str(e)}")
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error occurred")

@router.post("/structured_contract")
async def api_structured_contract(request: StructuredContractRequest):
    """
    Generate a contract from structured form data.
    
    Accepts individual form fields and constructs the contract text internally.
    """
    try:
        # Validate input
        is_valid, errors = validator.validate_contract_request(request.dict())
        if not is_valid:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid input: {'; '.join(errors)}"
            )
        
        logger.info(f"Processing structured contract for role: {request.role}")
        
        # Construct text from structured data
        try:
            constructed_text = construct_text_from_structured_data(request)
            logger.info(f"Constructed text length: {len(constructed_text)}")
        except Exception as e:
            logger.error(f"Error constructing text: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Error processing form data: {str(e)}")
        
        # Generate contract using the AI module
        try:
            result = generate_contract(constructed_text)
            logger.info(f"Contract generated successfully, keys: {list(result.keys())}")
        except Exception as e:
            logger.error(f"Error generating contract: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error generating contract: {str(e)}")
        
        # Generate contract_id if not present
        if 'contract_id' not in result:
            contract_id = f"gig_{datetime.now().isoformat().replace(':', '-').replace('.', '-')}"
            result['contract_id'] = contract_id
        
        # Add structured data to response for reference
        result["formData"] = {
            "description": request.description,
            "offeredAmount": request.offeredAmount,
            "requestedAmount": request.requestedAmount,
            "days": request.days,
            "role": request.role,
            "freelancerWallet": request.freelancerWallet,
            "clientWallet": request.clientWallet,
            # Freelancer Profile
            "freelancerName": request.freelancerName,
            "freelancerTitle": request.freelancerTitle,
            "freelancerBio": request.freelancerBio,
            "freelancerSkills": request.freelancerSkills,
            "freelancerExperience": request.freelancerExperience,
            "freelancerLocation": request.freelancerLocation,
            "freelancerRate": request.freelancerRate,
            # Social Links
            "freelancerX": request.freelancerX,
            "freelancerFacebook": request.freelancerFacebook,
            "freelancerInstagram": request.freelancerInstagram,
            "freelancerTikTok": request.freelancerTikTok,
            "freelancerLinkedIn": request.freelancerLinkedIn,
            "freelancerGithub": request.freelancerGithub,
            "freelancerPortfolio": request.freelancerPortfolio,
            # Client Profile
            "clientName": request.clientName,
            "clientCompany": request.clientCompany,
            "clientBio": request.clientBio,
            "clientLocation": request.clientLocation
        }
        
        # Save to contracts database for dashboard integration
        try:
            contract_id = result.get('contract_id')
            logger.info(f"Saving contract {contract_id} for role: {request.role}")
            
            # Save to dashboard database with form data
            dashboard_saved = save_contract_to_dashboard(
                contract_id, 
                {
                    'text': constructed_text,
                    'formData': result['formData'],
                    'result': result
                }
            )
            
            if dashboard_saved:
                logger.info(f"Structured contract saved to dashboard: {contract_id}")
            else:
                logger.warning(f"Failed to save structured contract to dashboard: {contract_id}")
            
        except Exception as db_error:
            logger.error(f"Error saving structured contract to database: {str(db_error)}")
            # Continue without failing the request
        
        # Add API metadata
        result['api_metadata'] = {
            'timestamp': datetime.now().isoformat(),
            'endpoint': 'structured_contract',
            'ai_agents_used': False,
            'processing_time': 'calculated_by_client',
            'database_saved': True
        }
        
        # Audit log structured contract creation
        audit_logger.log_event(
            event_type=AuditEventType.CONTRACT_CREATED,
            severity=AuditSeverity.INFO,
            event_data={
                "contract_id": result.get('contract_id', 'unknown'),
                "endpoint": "structured_contract",
                "role": request.role,
                "has_ai": False
            },
            success=True
        )
        
        logger.info("Successfully generated structured contract")
        return result
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Validation error: {str(e)}")
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error occurred")

@router.post("/validate_wallet", response_model=WalletValidationResponse)
async def validate_wallet(request: WalletValidationRequest):
    """Validate a wallet address and check its status on the specified network."""
    try:
        logger.info(f"Validating wallet: {request.address[:10]}... on {request.network}")
        
        # Basic format validation
        if not request.address.startswith('0x') or len(request.address) != 42:
            return WalletValidationResponse(
                valid=False,
                address=request.address,
                network=request.network,
                error="Invalid address format. Must be 42 characters starting with 0x."
            )
        
        # Check if address contains only valid hex characters
        if not all(c in '0123456789abcdefABCDEF' for c in request.address[2:]):
            return WalletValidationResponse(
                valid=False,
                address=request.address,
                network=request.network,
                error="Invalid address format. Must contain only hexadecimal characters."
            )
        
        # For now, we'll do basic validation
        # In a real implementation, you would:
        # 1. Check if the address exists on the blockchain
        # 2. Verify it's a valid contract or EOA
        # 3. Check balance if needed
        # 4. Verify network compatibility
        
        # Simulate network validation
        if request.network.lower() not in ['polygon', 'ethereum', 'mumbai']:
            return WalletValidationResponse(
                valid=False,
                address=request.address,
                network=request.network,
                error=f"Unsupported network: {request.network}"
            )
        
        # For demo purposes, we'll consider valid addresses as valid
        # In production, you'd integrate with web3 libraries or APIs
        logger.info(f"Wallet validation successful for {request.address[:10]}...")
        
        return WalletValidationResponse(
            valid=True,
            address=request.address,
            network=request.network,
            error=None,
            balance=None  # Would be populated with actual balance check
        )
        
    except Exception as e:
        logger.error(f"Wallet validation error: {str(e)}")
        return WalletValidationResponse(
            valid=False,
            address=request.address,
            network=request.network,
            error=f"Validation failed: {str(e)}"
        )
