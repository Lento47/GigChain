"""Wallet Router - GigChain Internal Wallet Endpoints"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import logging
from typing import Dict, Any, Optional

# Import authentication dependencies
from auth import get_current_wallet

# Import Wallet Manager
from wallet_manager import get_wallet_manager

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/wallets", tags=["wallets"])

# GigChain Internal Wallet Models
class CreateWalletRequest(BaseModel):
    name: str = Field(default="Mi Wallet GigChain", description="Name for the wallet")

class CreateWalletResponse(BaseModel):
    success: bool
    wallet: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class GetWalletResponse(BaseModel):
    success: bool
    wallet: Optional[Dict[str, Any]] = None
    has_wallet: bool = False
    error: Optional[str] = None

class WalletTransactionRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Transaction amount")
    transaction_type: str = Field(..., description="Transaction type")
    description: Optional[str] = Field("", description="Transaction description")

class WalletTransactionResponse(BaseModel):
    success: bool
    new_balance: Optional[float] = None
    error: Optional[str] = None

@router.post("/create", response_model=CreateWalletResponse)
async def create_internal_wallet(
    request: CreateWalletRequest,
    wallet: Dict[str, Any] = Depends(get_current_wallet)
):
    """
    Create a new internal GigChain wallet for the authenticated user.
    Limited to 1 wallet per user (future: paid upgrade for more wallets).
    """
    try:
        wallet_manager = get_wallet_manager()
        user_address = wallet["address"]
        
        # Check if user already has a wallet
        wallet_count = wallet_manager.count_user_wallets(user_address)
        if wallet_count >= 1:
            return CreateWalletResponse(
                success=False,
                error="Ya tienes una wallet de GigChain. Actualiza a Premium para tener más wallets."
            )
        
        # Create wallet
        new_wallet = wallet_manager.create_wallet(
            user_address=user_address,
            name=request.name
        )
        
        if not new_wallet:
            return CreateWalletResponse(
                success=False,
                error="Error al crear la wallet. Intenta de nuevo."
            )
        
        logger.info(f"✅ Created wallet for user {user_address[:10]}...")
        
        return CreateWalletResponse(
            success=True,
            wallet=new_wallet.to_dict()
        )
        
    except ValueError as e:
        logger.warning(f"⚠️ Wallet creation validation error: {str(e)}")
        return CreateWalletResponse(
            success=False,
            error=str(e)
        )
    except Exception as e:
        logger.error(f"❌ Error creating wallet: {str(e)}")
        return CreateWalletResponse(
            success=False,
            error="Error al crear la wallet"
        )

@router.get("/me", response_model=GetWalletResponse)
async def get_my_wallet(wallet: Dict[str, Any] = Depends(get_current_wallet)):
    """
    Get the authenticated user's internal GigChain wallet.
    """
    try:
        wallet_manager = get_wallet_manager()
        user_address = wallet["address"]
        
        # Get user's wallet
        user_wallet = wallet_manager.get_wallet_by_user(user_address)
        
        if not user_wallet:
            return GetWalletResponse(
                success=True,
                has_wallet=False,
                wallet=None
            )
        
        return GetWalletResponse(
            success=True,
            has_wallet=True,
            wallet=user_wallet.to_dict()
        )
        
    except Exception as e:
        logger.error(f"❌ Error getting wallet: {str(e)}")
        return GetWalletResponse(
            success=False,
            has_wallet=False,
            error="Error al obtener la wallet"
        )

@router.get("/{wallet_address}")
async def get_wallet_by_address(
    wallet_address: str,
    current_wallet: Dict[str, Any] = Depends(get_current_wallet)
):
    """
    Get wallet information by GigChain wallet address.
    Only the wallet owner can view full details.
    """
    try:
        wallet_manager = get_wallet_manager()
        
        # Get wallet
        target_wallet = wallet_manager.get_wallet_by_address(wallet_address)
        
        if not target_wallet:
            raise HTTPException(status_code=404, detail="Wallet no encontrada")
        
        # Check if requester is the owner
        is_owner = target_wallet.user_address == current_wallet["address"]
        
        if not is_owner:
            # Return limited information for non-owners
            return {
                "success": True,
                "wallet": {
                    "wallet_address": target_wallet.wallet_address,
                    "name": target_wallet.name,
                    "is_active": target_wallet.is_active
                }
            }
        
        # Return full information for owner
        return {
            "success": True,
            "wallet": target_wallet.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting wallet by address: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al obtener la wallet")

@router.get("/{wallet_address}/transactions")
async def get_wallet_transactions(
    wallet_address: str,
    limit: int = 50,
    current_wallet: Dict[str, Any] = Depends(get_current_wallet)
):
    """
    Get transaction history for a wallet.
    Only the wallet owner can view transactions.
    """
    try:
        wallet_manager = get_wallet_manager()
        
        # Verify ownership
        target_wallet = wallet_manager.get_wallet_by_address(wallet_address)
        if not target_wallet:
            raise HTTPException(status_code=404, detail="Wallet no encontrada")
        
        if target_wallet.user_address != current_wallet["address"]:
            raise HTTPException(status_code=403, detail="No autorizado")
        
        # Get transactions
        transactions = wallet_manager.get_transactions(wallet_address, limit)
        
        return {
            "success": True,
            "wallet_address": wallet_address,
            "transactions": transactions
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting transactions: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al obtener transacciones")

@router.post("/{wallet_address}/transaction", response_model=WalletTransactionResponse)
async def add_wallet_transaction(
    wallet_address: str,
    request: WalletTransactionRequest,
    current_wallet: Dict[str, Any] = Depends(get_current_wallet)
):
    """
    Add a transaction to a wallet (for testing/admin purposes).
    Only the wallet owner can add transactions.
    """
    try:
        wallet_manager = get_wallet_manager()
        
        # Verify ownership
        target_wallet = wallet_manager.get_wallet_by_address(wallet_address)
        if not target_wallet:
            return WalletTransactionResponse(
                success=False,
                error="Wallet no encontrada"
            )
        
        if target_wallet.user_address != current_wallet["address"]:
            return WalletTransactionResponse(
                success=False,
                error="No autorizado"
            )
        
        # Update balance
        success = wallet_manager.update_balance(
            wallet_address=wallet_address,
            amount=request.amount,
            transaction_type=request.transaction_type,
            description=request.description
        )
        
        if not success:
            return WalletTransactionResponse(
                success=False,
                error="Error al procesar la transacción"
            )
        
        # Get updated wallet
        updated_wallet = wallet_manager.get_wallet_by_address(wallet_address)
        
        return WalletTransactionResponse(
            success=True,
            new_balance=updated_wallet.balance if updated_wallet else None
        )
        
    except Exception as e:
        logger.error(f"❌ Error adding transaction: {str(e)}")
        return WalletTransactionResponse(
            success=False,
            error="Error al agregar transacción"
        )

@router.delete("/{wallet_address}")
async def deactivate_wallet(
    wallet_address: str,
    current_wallet: Dict[str, Any] = Depends(get_current_wallet)
):
    """
    Deactivate a wallet (soft delete).
    Only the wallet owner can deactivate their wallet.
    """
    try:
        wallet_manager = get_wallet_manager()
        
        # Verify ownership
        target_wallet = wallet_manager.get_wallet_by_address(wallet_address)
        if not target_wallet:
            raise HTTPException(status_code=404, detail="Wallet no encontrada")
        
        if target_wallet.user_address != current_wallet["address"]:
            raise HTTPException(status_code=403, detail="No autorizado")
        
        # Deactivate
        success = wallet_manager.deactivate_wallet(wallet_address)
        
        if not success:
            raise HTTPException(status_code=500, detail="Error al desactivar wallet")
        
        logger.info(f"✅ Deactivated wallet {wallet_address}")
        
        return {
            "success": True,
            "message": "Wallet desactivada exitosamente"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deactivating wallet: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al desactivar wallet")
