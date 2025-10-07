"""
Wallet API Routes
=================

FastAPI routes for wallet management.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional

from wallets.schemas import (
    CreateInternalWalletRequest,
    RecoverWalletRequest,
    LinkExternalWalletRequest,
    VerifyExternalLinkRequest,
    SignContractRequest,
    RecordTransactionRequest,
    CreateWalletResponse,
    WalletInfoResponse,
    LinkExternalWalletResponse,
    VerifyLinkResponse,
    SignContractResponse,
    TransactionRecordResponse,
    GetTransactionsResponse
)
from wallets.wallet_manager import get_wallet_manager
from wallets.database import get_wallet_db
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/wallets", tags=["Wallets"])


# ==================== Internal Wallet Management ====================

@router.post("/internal/create", response_model=CreateWalletResponse)
async def create_internal_wallet(request: CreateInternalWalletRequest):
    """
    Create internal GigChain wallet for user.
    
    The wallet is created with a 12-word mnemonic phrase that the user
    MUST save for recovery purposes.
    
    Security:
    - Private key encrypted at rest
    - Mnemonic encrypted
    - User-specific encryption
    """
    try:
        wallet_manager = get_wallet_manager()
        wallet_db = get_wallet_db()
        
        # Check if user already has wallet
        existing = wallet_db.get_internal_wallet_by_user(request.user_id)
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"User {request.user_id} already has an internal wallet"
            )
        
        # Create wallet
        wallet, mnemonic = wallet_manager.create_internal_wallet(
            user_id=request.user_id,
            user_password=request.user_password
        )
        
        # Save to database
        wallet_db.save_internal_wallet(wallet.to_dict())
        
        logger.info(f"✅ Internal wallet created: {wallet.address} for user {request.user_id}")
        
        return CreateWalletResponse(
            success=True,
            wallet_id=wallet.wallet_id,
            address=wallet.address,
            mnemonic_phrase=mnemonic,  # ⚠️ User MUST save this!
            created_at=wallet.created_at.isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to create internal wallet: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create wallet: {str(e)}"
        )


@router.post("/internal/recover", response_model=WalletInfoResponse)
async def recover_internal_wallet(request: RecoverWalletRequest):
    """
    Recover internal wallet from 12-word mnemonic phrase.
    
    This allows users to restore their wallet if they lose access.
    """
    try:
        wallet_manager = get_wallet_manager()
        wallet_db = get_wallet_db()
        
        # Recover wallet
        wallet = wallet_manager.recover_internal_wallet(
            user_id=request.user_id,
            mnemonic_phrase=request.mnemonic_phrase,
            user_password=request.user_password
        )
        
        if not wallet:
            raise HTTPException(
                status_code=400,
                detail="Invalid mnemonic phrase or recovery failed"
            )
        
        # Save recovered wallet
        wallet_db.save_internal_wallet(wallet.to_dict())
        
        logger.info(f"✅ Wallet recovered: {wallet.address} for user {request.user_id}")
        
        # Return wallet info
        wallet_info = wallet_manager.get_user_wallets(request.user_id)
        
        return WalletInfoResponse(
            user_id=request.user_id,
            internal_wallet=wallet_info["internal_wallet"],
            external_wallets=wallet_info["external_wallets"],
            has_professional_wallet=wallet_manager.has_professional_wallet(request.user_id)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Wallet recovery failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Recovery failed: {str(e)}"
        )


@router.get("/user/{user_id}", response_model=WalletInfoResponse)
async def get_user_wallets(user_id: str):
    """
    Get all wallets for a user (internal + external).
    """
    try:
        wallet_manager = get_wallet_manager()
        
        wallet_info = wallet_manager.get_user_wallets(user_id)
        
        return WalletInfoResponse(
            user_id=user_id,
            internal_wallet=wallet_info["internal_wallet"],
            external_wallets=wallet_info["external_wallets"],
            has_professional_wallet=wallet_manager.has_professional_wallet(user_id)
        )
        
    except Exception as e:
        logger.error(f"❌ Failed to get user wallets: {str(e)}")
        raise HTTPException(500, detail=str(e))


# ==================== External Wallet Linking ====================

@router.post("/external/link/initiate", response_model=LinkExternalWalletResponse)
async def initiate_external_link(request: LinkExternalWalletRequest):
    """
    Initiate linking external wallet (Step 1).
    
    Returns a verification message that user must sign with their
    external wallet (e.g., MetaMask) to prove ownership.
    """
    try:
        wallet_manager = get_wallet_manager()
        
        # Check if user has internal wallet
        if not wallet_manager.has_internal_wallet(request.user_id):
            raise HTTPException(
                status_code=400,
                detail="User must create internal wallet first"
            )
        
        # Initiate link
        link_id, verification_message = wallet_manager.initiate_external_link(
            user_id=request.user_id,
            external_address=request.external_address
        )
        
        logger.info(
            f"🔗 External link initiated for user {request.user_id}: "
            f"{request.external_address[:10]}..."
        )
        
        return LinkExternalWalletResponse(
            link_id=link_id,
            verification_message=verification_message
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to initiate link: {str(e)}")
        raise HTTPException(500, detail=str(e))


@router.post("/external/link/verify", response_model=VerifyLinkResponse)
async def verify_external_link(request: VerifyExternalLinkRequest):
    """
    Verify external wallet link with signature (Step 2).
    
    Completes the linking process after user signs the verification
    message with their external wallet.
    """
    try:
        wallet_manager = get_wallet_manager()
        wallet_db = get_wallet_db()
        
        # Complete link
        external_wallet = wallet_manager.complete_external_link(
            user_id=request.user_id,
            external_address=request.external_address,
            signature=request.signature,
            link_id=request.link_id,
            enable_professional=request.enable_professional
        )
        
        if not external_wallet:
            raise HTTPException(
                status_code=400,
                detail="Signature verification failed"
            )
        
        # Save to database
        wallet_db.save_external_link(external_wallet.to_dict())
        
        logger.info(
            f"✅ External wallet verified and linked: "
            f"{external_wallet.external_address} "
            f"(Professional: {external_wallet.is_professional})"
        )
        
        return VerifyLinkResponse(
            success=True,
            link_id=external_wallet.link_id,
            external_address=external_wallet.external_address,
            verified=external_wallet.verified,
            is_professional=external_wallet.is_professional,
            linked_at=external_wallet.linked_at.isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to verify link: {str(e)}")
        raise HTTPException(500, detail=str(e))


# ==================== Contract Signing ====================

@router.post("/sign-contract", response_model=SignContractResponse)
async def sign_contract(request: SignContractRequest):
    """
    Sign a contract with user's wallet.
    
    Can use either:
    - Internal wallet (platform signs automatically)
    - External wallet (returns contract hash to sign externally)
    """
    try:
        wallet_manager = get_wallet_manager()
        
        # Sign contract
        signed_contract = wallet_manager.sign_contract(
            user_id=request.user_id,
            contract_data=request.contract_data,
            use_internal=request.use_internal_wallet,
            user_password=request.user_password
        )
        
        if not signed_contract:
            raise HTTPException(
                status_code=400,
                detail="Failed to sign contract"
            )
        
        logger.info(
            f"📝 Contract signed by user {request.user_id} "
            f"({'internal' if request.use_internal_wallet else 'external'} wallet)"
        )
        
        return SignContractResponse(
            success=True,
            signed_contract=signed_contract,
            signer_address=signed_contract.get("signer", ""),
            signature=signed_contract.get("signature", ""),
            signed_at=signed_contract.get("signed_at", ""),
            contract_hash=signed_contract.get("contract_hash", "")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to sign contract: {str(e)}")
        raise HTTPException(500, detail=str(e))


# ==================== Transaction Records ====================

@router.post("/transactions/record", response_model=TransactionRecordResponse)
async def record_transaction(request: RecordTransactionRequest):
    """
    Record transaction metadata.
    
    ⚠️ IMPORTANT DISCLAIMER:
    This records metadata ONLY. GigChain is NOT responsible for actual
    money transfers which happen externally on the blockchain.
    """
    try:
        wallet_manager = get_wallet_manager()
        wallet_db = get_wallet_db()
        
        # Record transaction
        record = wallet_manager.record_transaction(
            user_id=request.user_id,
            wallet_address=request.wallet_address,
            transaction_type=request.transaction_type,
            amount=request.amount,
            currency=request.currency,
            contract_id=request.contract_id,
            external_tx_hash=request.external_tx_hash,
            metadata=request.metadata
        )
        
        # Save to database
        wallet_db.save_transaction_record(record.to_dict())
        
        logger.info(f"📊 Transaction recorded: {record.record_id}")
        
        return TransactionRecordResponse(
            success=True,
            record_id=record.record_id,
            amount=record.amount,
            currency=record.currency,
            status=record.status
        )
        
    except Exception as e:
        logger.error(f"❌ Failed to record transaction: {str(e)}")
        raise HTTPException(500, detail=str(e))


@router.get("/transactions/{user_id}", response_model=GetTransactionsResponse)
async def get_user_transactions(
    user_id: str,
    contract_id: Optional[str] = None,
    limit: int = 100
):
    """
    Get transaction records for user.
    
    Returns metadata records of transactions.
    """
    try:
        wallet_manager = get_wallet_manager()
        
        records = wallet_manager.get_transaction_records(
            user_id=user_id,
            contract_id=contract_id,
            limit=limit
        )
        
        return GetTransactionsResponse(
            transactions=[r.to_dict() for r in records],
            total_count=len(records)
        )
        
    except Exception as e:
        logger.error(f"❌ Failed to get transactions: {str(e)}")
        raise HTTPException(500, detail=str(e))


# ==================== Statistics ====================

@router.get("/stats")
async def get_wallet_statistics():
    """Get overall wallet statistics."""
    try:
        wallet_manager = get_wallet_manager()
        
        stats = wallet_manager.get_wallet_statistics()
        
        return {
            "success": True,
            "statistics": stats
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get statistics: {str(e)}")
        raise HTTPException(500, detail=str(e))


__all__ = ['router']
