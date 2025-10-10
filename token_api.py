"""
Token API Endpoints
FastAPI routes for GigSoul (GSL) token system
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

from token_system import (
    TokenWallet, TokenTransaction, TransactionType, TaskComplexity,
    TokenRewardCalculator, TokenTransferService, TokenMarketplace,
    format_gsl_amount, format_transaction_summary
)
from token_database import token_db
from gamification_api import gamification_db


# Router for token endpoints
router = APIRouter(prefix="/api/tokens", tags=["tokens"])


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class WalletResponse(BaseModel):
    """Token wallet response"""
    user_id: str
    wallet_address: str
    balance: float
    total_earned: float
    total_spent: float
    total_transferred_out: float
    total_transferred_in: float
    formatted_balance: str


class TransactionResponse(BaseModel):
    """Token transaction response"""
    transaction_id: str
    user_id: str
    transaction_type: str
    amount: float
    balance_after: float
    description: str
    created_at: str


class TransferRequest(BaseModel):
    """Request to transfer tokens"""
    from_user_id: str
    to_wallet_address: str
    amount: float = Field(..., gt=0)
    note: Optional[str] = None


class BuyTokensRequest(BaseModel):
    """Request to buy tokens"""
    user_id: str
    usd_amount: float = Field(..., gt=0)
    payment_method: str = Field(..., description="Payment method (card, bank, etc.)")


class SellTokensRequest(BaseModel):
    """Request to sell tokens"""
    user_id: str
    gsl_amount: float = Field(..., gt=0)
    payment_method: str = Field(..., description="Payment method for receiving funds")


class RewardEstimateRequest(BaseModel):
    """Request reward estimate for contract"""
    contract_value: float = Field(..., gt=0)
    user_id: str


class ContractRewardRequest(BaseModel):
    """Award tokens for contract completion"""
    user_id: str
    contract_id: str
    contract_value: float = Field(..., gt=0)
    rating: int = Field(..., ge=1, le=5)
    was_on_time: bool = True
    days_early_or_late: int = 0


# ============================================================================
# WALLET ENDPOINTS
# ============================================================================

@router.get("/wallet/{user_id}", response_model=WalletResponse)
async def get_wallet(user_id: str):
    """
    Get user's token wallet balance and statistics
    """
    # Get or create wallet
    user_stats = gamification_db.get_user_stats(user_id)
    if not user_stats:
        raise HTTPException(status_code=404, detail="User not found")
    
    wallet = token_db.get_or_create_wallet(user_id, user_stats.user_id)
    
    return WalletResponse(
        user_id=wallet.user_id,
        wallet_address=wallet.wallet_address,
        balance=wallet.balance,
        total_earned=wallet.total_earned,
        total_spent=wallet.total_spent,
        total_transferred_out=wallet.total_transferred_out,
        total_transferred_in=wallet.total_transferred_in,
        formatted_balance=format_gsl_amount(wallet.balance)
    )


@router.get("/wallet/{user_id}/transactions")
async def get_wallet_transactions(
    user_id: str,
    limit: int = 50,
    offset: int = 0,
    transaction_type: Optional[str] = None
):
    """
    Get user's transaction history
    """
    transactions = token_db.get_user_transactions(
        user_id=user_id,
        limit=limit,
        offset=offset,
        transaction_type=transaction_type
    )
    
    return {
        "user_id": user_id,
        "transactions": [tx.to_dict() for tx in transactions],
        "count": len(transactions),
        "limit": limit,
        "offset": offset
    }


@router.get("/wallet/{user_id}/rewards")
async def get_wallet_rewards(user_id: str, limit: int = 50):
    """
    Get user's reward history from contract completions
    """
    rewards = token_db.get_user_rewards(user_id, limit)
    
    total_rewards = sum(r["gsl_reward"] for r in rewards)
    
    return {
        "user_id": user_id,
        "rewards": rewards,
        "total_rewards": total_rewards,
        "count": len(rewards)
    }


# ============================================================================
# TRANSFER ENDPOINTS
# ============================================================================

@router.post("/transfer")
async def transfer_tokens(request: TransferRequest):
    """
    Transfer tokens from one user to another
    
    Includes 2% transfer fee
    """
    try:
        # Get wallets
        from_wallet = token_db.get_wallet(request.from_user_id)
        if not from_wallet:
            raise HTTPException(status_code=404, detail="Sender wallet not found")
        
        to_wallet = token_db.get_wallet(request.to_wallet_address)
        if not to_wallet:
            raise HTTPException(status_code=404, detail="Recipient wallet not found")
        
        # Validate transfer
        validation = TokenTransferService.validate_transfer(
            from_wallet, to_wallet, request.amount
        )
        
        if not validation["valid"]:
            raise HTTPException(status_code=400, detail={
                "errors": validation["errors"],
                "details": validation
            })
        
        fee = validation["fee"]
        total_cost = validation["total_cost"]
        
        # Create transfer record
        transfer_id = token_db.create_transfer_record(
            from_user_id=request.from_user_id,
            to_user_id=to_wallet.user_id,
            amount=request.amount,
            fee=fee
        )
        
        try:
            # Deduct from sender (amount + fee)
            balance_before_sender = from_wallet.balance
            from_wallet.deduct_tokens(total_cost, f"Transfer to {to_wallet.user_id}")
            from_wallet.total_transferred_out += request.amount
            token_db.update_wallet(from_wallet)
            
            # Create sender transaction
            sender_tx = TokenTransaction(
                transaction_id=str(uuid.uuid4()),
                user_id=request.from_user_id,
                transaction_type=TransactionType.TRANSFER,
                amount=-total_cost,
                balance_before=balance_before_sender,
                balance_after=from_wallet.balance,
                description=f"Transfer to {to_wallet.user_id}" + (f" - {request.note}" if request.note else ""),
                related_user_id=to_wallet.user_id,
                metadata={"transfer_id": transfer_id, "fee": fee, "amount_sent": request.amount}
            )
            token_db.create_transaction(sender_tx)
            
            # Add to recipient (amount only, no fee)
            balance_before_recipient = to_wallet.balance
            to_wallet.add_tokens(request.amount, f"Transfer from {request.from_user_id}")
            to_wallet.total_transferred_in += request.amount
            token_db.update_wallet(to_wallet)
            
            # Create recipient transaction
            recipient_tx = TokenTransaction(
                transaction_id=str(uuid.uuid4()),
                user_id=to_wallet.user_id,
                transaction_type=TransactionType.RECEIVE,
                amount=request.amount,
                balance_before=balance_before_recipient,
                balance_after=to_wallet.balance,
                description=f"Transfer from {request.from_user_id}" + (f" - {request.note}" if request.note else ""),
                related_user_id=request.from_user_id,
                metadata={"transfer_id": transfer_id}
            )
            token_db.create_transaction(recipient_tx)
            
            # Mark transfer as completed
            token_db.complete_transfer(transfer_id)
            
            return {
                "success": True,
                "transfer_id": transfer_id,
                "amount": request.amount,
                "fee": fee,
                "total_cost": total_cost,
                "from_user": request.from_user_id,
                "to_user": to_wallet.user_id,
                "sender_new_balance": from_wallet.balance,
                "recipient_new_balance": to_wallet.balance,
                "message": f"Successfully transferred {format_gsl_amount(request.amount)} to {to_wallet.user_id}"
            }
            
        except Exception as e:
            # Mark transfer as failed
            token_db.fail_transfer(transfer_id, str(e))
            raise HTTPException(status_code=500, detail=f"Transfer failed: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transfer error: {str(e)}")


# ============================================================================
# MARKETPLACE ENDPOINTS
# ============================================================================

@router.post("/buy")
async def buy_tokens(request: BuyTokensRequest):
    """
    Buy GSL tokens with USD
    
    Fixed exchange rate: $1 = 20 GSL
    3% transaction fee
    """
    try:
        # Get wallet
        wallet = token_db.get_wallet(request.user_id)
        if not wallet:
            raise HTTPException(status_code=404, detail="Wallet not found")
        
        # Calculate purchase
        purchase_details = TokenMarketplace.calculate_buy_amount(request.usd_amount)
        
        # In production, process payment here
        # For now, simulate successful payment
        payment_id = f"pay_{uuid.uuid4().hex[:16]}"
        
        # Add tokens to wallet
        balance_before = wallet.balance
        wallet.add_tokens(
            purchase_details["gsl_received"],
            f"Purchased {format_gsl_amount(purchase_details['gsl_received'])}"
        )
        token_db.update_wallet(wallet)
        
        # Create transaction
        transaction = TokenTransaction(
            transaction_id=str(uuid.uuid4()),
            user_id=request.user_id,
            transaction_type=TransactionType.BUY,
            amount=purchase_details["gsl_received"],
            balance_before=balance_before,
            balance_after=wallet.balance,
            description=f"Purchased GSL tokens for ${purchase_details['usd_amount']} USD",
            metadata={
                "usd_amount": purchase_details["usd_amount"],
                "fee_usd": purchase_details["fee_usd"],
                "net_usd": purchase_details["net_usd"],
                "payment_id": payment_id,
                "payment_method": request.payment_method
            }
        )
        token_db.create_transaction(transaction)
        
        return {
            "success": True,
            "transaction_id": transaction.transaction_id,
            "payment_id": payment_id,
            "purchase_details": purchase_details,
            "new_balance": wallet.balance,
            "message": f"Successfully purchased {format_gsl_amount(purchase_details['gsl_received'])}"
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Purchase failed: {str(e)}")


@router.post("/sell")
async def sell_tokens(request: SellTokensRequest):
    """
    Sell GSL tokens for USD
    
    Fixed exchange rate: 1 GSL = $0.05
    5% transaction fee
    """
    try:
        # Get wallet
        wallet = token_db.get_wallet(request.user_id)
        if not wallet:
            raise HTTPException(status_code=404, detail="Wallet not found")
        
        # Calculate sale
        sale_details = TokenMarketplace.calculate_sell_amount(request.gsl_amount)
        
        # Check balance
        if not wallet.can_afford(request.gsl_amount):
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient balance. Required: {request.gsl_amount} GSL, Available: {wallet.balance} GSL"
            )
        
        # Deduct tokens from wallet
        balance_before = wallet.balance
        wallet.deduct_tokens(
            request.gsl_amount,
            f"Sold {format_gsl_amount(request.gsl_amount)} for ${sale_details['net_usd']} USD"
        )
        wallet.total_spent += request.gsl_amount
        token_db.update_wallet(wallet)
        
        # In production, process payout here
        payment_id = f"payout_{uuid.uuid4().hex[:16]}"
        
        # Create transaction
        transaction = TokenTransaction(
            transaction_id=str(uuid.uuid4()),
            user_id=request.user_id,
            transaction_type=TransactionType.SELL,
            amount=-request.gsl_amount,
            balance_before=balance_before,
            balance_after=wallet.balance,
            description=f"Sold {format_gsl_amount(request.gsl_amount)} for ${sale_details['net_usd']} USD",
            metadata={
                "gsl_amount": sale_details["gsl_amount"],
                "gross_usd": sale_details["gross_usd"],
                "fee_usd": sale_details["fee_usd"],
                "net_usd": sale_details["net_usd"],
                "payment_id": payment_id,
                "payment_method": request.payment_method
            }
        )
        token_db.create_transaction(transaction)
        
        return {
            "success": True,
            "transaction_id": transaction.transaction_id,
            "payment_id": payment_id,
            "sale_details": sale_details,
            "new_balance": wallet.balance,
            "message": f"Successfully sold {format_gsl_amount(request.gsl_amount)} for ${sale_details['net_usd']} USD"
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sale failed: {str(e)}")


@router.get("/marketplace/rates")
async def get_marketplace_rates():
    """Get current marketplace exchange rates"""
    return {
        "gsl_symbol": "∞",
        "gsl_name": "GigSoul Token (GSL)",
        "symbol_info": "∞ represents GSL tokens",
        "buy_rate": {
            "rate": TokenMarketplace.USD_TO_GSL_RATE,
            "description": f"$1 USD = {TokenMarketplace.USD_TO_GSL_RATE}∞ (GSL tokens)",
            "fee_percent": TokenMarketplace.BUY_FEE_PERCENT,
            "min_purchase_usd": TokenMarketplace.MIN_BUY_USD,
            "max_purchase_usd": TokenMarketplace.MAX_BUY_USD
        },
        "sell_rate": {
            "rate": TokenMarketplace.GSL_TO_USD_RATE,
            "description": f"1∞ (GSL) = ${TokenMarketplace.GSL_TO_USD_RATE} USD",
            "fee_percent": TokenMarketplace.SELL_FEE_PERCENT,
            "min_sell_gsl": TokenMarketplace.MIN_SELL_GSL,
            "max_sell_gsl": TokenMarketplace.MAX_SELL_GSL
        },
        "transfer_fee_percent": TokenTransferService.TRANSFER_FEE_PERCENT,
        "min_transfer_amount": TokenTransferService.MIN_TRANSFER_AMOUNT
    }


# ============================================================================
# REWARD ENDPOINTS
# ============================================================================

@router.post("/rewards/estimate")
async def estimate_reward(request: RewardEstimateRequest):
    """
    Estimate token reward for a contract
    
    Provides min, average, and max reward based on different scenarios
    """
    try:
        # Get user stats
        user_stats = gamification_db.get_user_stats(request.user_id)
        if not user_stats:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Calculate reward range
        reward_range = TokenRewardCalculator.estimate_reward_range(
            contract_value=request.contract_value,
            user_level=user_stats.level
        )
        
        return {
            "user_id": request.user_id,
            "user_level": user_stats.level,
            "trust_score": user_stats.trust_score,
            "contract_value_usd": request.contract_value,
            "estimated_rewards": reward_range,
            "message": "Reward estimates based on different performance scenarios"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Estimation failed: {str(e)}")


@router.post("/rewards/award")
async def award_contract_reward(request: ContractRewardRequest):
    """
    Award GSL tokens for contract completion
    
    Automatically called when a contract is completed
    """
    try:
        # Get user stats
        user_stats = gamification_db.get_user_stats(request.user_id)
        if not user_stats:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get or create wallet
        wallet = token_db.get_or_create_wallet(request.user_id, user_stats.user_id)
        
        # Calculate reward
        reward_breakdown = TokenRewardCalculator.calculate_reward(
            contract_value=request.contract_value,
            user_level=user_stats.level,
            trust_score=user_stats.trust_score,
            rating=request.rating,
            was_on_time=request.was_on_time,
            days_early_or_late=request.days_early_or_late
        )
        
        reward_amount = reward_breakdown["final_reward"]
        complexity = TaskComplexity(reward_breakdown["complexity"]["level"])
        
        # Add reward to wallet
        balance_before = wallet.balance
        wallet.add_tokens(reward_amount, f"Contract completion reward")
        wallet.total_earned += reward_amount
        token_db.update_wallet(wallet)
        
        # Create transaction
        transaction = TokenTransaction(
            transaction_id=str(uuid.uuid4()),
            user_id=request.user_id,
            transaction_type=TransactionType.REWARD,
            amount=reward_amount,
            balance_before=balance_before,
            balance_after=wallet.balance,
            description=f"Contract completion reward: {format_gsl_amount(reward_amount)}",
            related_contract_id=request.contract_id,
            metadata=reward_breakdown
        )
        token_db.create_transaction(transaction)
        
        # Create reward record
        reward_id = token_db.create_reward_record(
            user_id=request.user_id,
            contract_id=request.contract_id,
            contract_value=request.contract_value,
            gsl_reward=reward_amount,
            complexity=complexity,
            rating=request.rating,
            was_on_time=request.was_on_time,
            days_early_or_late=request.days_early_or_late,
            user_level=user_stats.level,
            trust_score=user_stats.trust_score,
            breakdown=reward_breakdown
        )
        
        return {
            "success": True,
            "reward_id": reward_id,
            "transaction_id": transaction.transaction_id,
            "reward_amount": reward_amount,
            "new_balance": wallet.balance,
            "reward_breakdown": reward_breakdown,
            "message": f"🎉 Congratulations! You earned {format_gsl_amount(reward_amount)}!"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reward failed: {str(e)}")


# ============================================================================
# STATISTICS ENDPOINTS
# ============================================================================

@router.get("/statistics")
async def get_token_statistics():
    """Get overall token system statistics"""
    stats = token_db.get_token_statistics()
    
    return {
        "token_name": "GigSoul (GSL)",
        "token_symbol": "∞",
        "token_full_name": "GigSoul Token",
        "token_code": "GSL",
        "statistics": stats,
        "timestamp": datetime.now().isoformat()
    }


@router.get("/leaderboard/richest")
async def get_richest_users(limit: int = 50):
    """Get leaderboard of users with most GSL tokens"""
    conn = token_db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT 
            tw.user_id,
            tw.wallet_address,
            tw.balance,
            tw.total_earned,
            us.level,
            us.trust_score,
            us.completed_contracts
        FROM token_wallets tw
        JOIN user_stats us ON tw.user_id = us.user_id
        WHERE us.is_banned = 0
        ORDER BY tw.balance DESC
        LIMIT ?
    """, (limit,))
    
    rows = cursor.fetchall()
    conn.close()
    
    leaderboard = []
    for idx, row in enumerate(rows, 1):
        leaderboard.append({
            "rank": idx,
            "user_id": row["user_id"],
            "balance": row["balance"],
            "total_earned": row["total_earned"],
            "level": row["level"],
            "trust_score": row["trust_score"],
            "completed_contracts": row["completed_contracts"]
        })
    
    return {
        "leaderboard": leaderboard,
        "total_users": len(leaderboard),
        "timestamp": datetime.now().isoformat()
    }
