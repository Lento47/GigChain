"""
Wallet API Schemas
==================

Pydantic models for wallet API requests and responses.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime


# ==================== Requests ====================

class CreateInternalWalletRequest(BaseModel):
    """Request to create internal GigChain wallet."""
    user_id: str = Field(..., description="User identifier")
    user_password: Optional[str] = Field(
        None,
        description="Optional password for additional encryption",
        min_length=8
    )


class RecoverWalletRequest(BaseModel):
    """Request to recover wallet from mnemonic."""
    user_id: str = Field(..., description="User identifier")
    mnemonic_phrase: str = Field(
        ...,
        description="12-word recovery phrase",
        min_length=20
    )
    user_password: Optional[str] = Field(
        None,
        description="Optional password for encryption"
    )
    
    @validator('mnemonic_phrase')
    def validate_mnemonic(cls, v):
        """Validate mnemonic has 12 words."""
        words = v.strip().split()
        if len(words) != 12:
            raise ValueError("Mnemonic must be exactly 12 words")
        return v


class LinkExternalWalletRequest(BaseModel):
    """Request to link external wallet."""
    user_id: str = Field(..., description="User identifier")
    external_address: str = Field(
        ...,
        pattern=r"^0x[a-fA-F0-9]{40}$",
        description="External wallet address (Ethereum format)"
    )


class VerifyExternalLinkRequest(BaseModel):
    """Request to verify external wallet link."""
    user_id: str = Field(..., description="User identifier")
    external_address: str = Field(..., pattern=r"^0x[a-fA-F0-9]{40}$")
    signature: str = Field(..., description="Signature from external wallet")
    link_id: str = Field(..., description="Link ID from initiate step")
    enable_professional: bool = Field(
        default=False,
        description="Enable Professional Services"
    )


class SignContractRequest(BaseModel):
    """Request to sign contract."""
    user_id: str = Field(..., description="User identifier")
    contract_data: Dict[str, Any] = Field(..., description="Contract data to sign")
    use_internal_wallet: bool = Field(
        default=True,
        description="Use internal wallet (True) or external (False)"
    )
    user_password: Optional[str] = Field(
        None,
        description="Password for internal wallet"
    )


class RecordTransactionRequest(BaseModel):
    """Request to record transaction metadata."""
    user_id: str = Field(..., description="User identifier")
    wallet_address: str = Field(..., pattern=r"^0x[a-fA-F0-9]{40}$")
    transaction_type: str = Field(
        ...,
        description="Transaction type (contract_payment, milestone_payment, etc.)"
    )
    amount: float = Field(..., ge=0, description="Transaction amount")
    currency: str = Field(default="ETH", description="Currency code")
    contract_id: Optional[str] = Field(None, description="Related contract ID")
    external_tx_hash: Optional[str] = Field(
        None,
        description="Blockchain transaction hash (if available)"
    )
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")


# ==================== Responses ====================

class CreateWalletResponse(BaseModel):
    """Response after creating internal wallet."""
    success: bool
    wallet_id: str
    address: str
    mnemonic_phrase: str  # ⚠️ User MUST save this!
    created_at: str
    warning: str = Field(
        default="⚠️ SAVE YOUR 12-WORD RECOVERY PHRASE! You will NOT be able to recover your wallet without it.",
        description="Important warning to user"
    )


class WalletInfoResponse(BaseModel):
    """Wallet information response."""
    user_id: str
    internal_wallet: Optional[Dict[str, Any]] = Field(
        None,
        description="Internal wallet info"
    )
    external_wallets: List[Dict[str, Any]] = Field(
        default=[],
        description="Linked external wallets"
    )
    has_professional_wallet: bool = Field(
        default=False,
        description="User has verified professional wallet"
    )


class LinkExternalWalletResponse(BaseModel):
    """Response after initiating external wallet link."""
    link_id: str
    verification_message: str
    instructions: str = Field(
        default="Sign this message with your external wallet (e.g., MetaMask) to verify ownership",
        description="Instructions for user"
    )


class VerifyLinkResponse(BaseModel):
    """Response after verifying external link."""
    success: bool
    link_id: str
    external_address: str
    verified: bool
    is_professional: bool
    linked_at: str


class SignContractResponse(BaseModel):
    """Response after signing contract."""
    success: bool
    signed_contract: Dict[str, Any]
    signer_address: str
    signature: str
    signed_at: str
    contract_hash: str


class TransactionRecordResponse(BaseModel):
    """Response after recording transaction."""
    success: bool
    record_id: str
    amount: float
    currency: str
    status: str
    disclaimer: str = Field(
        default="⚠️ This is a metadata record only. GigChain is NOT responsible for actual money transfers.",
        description="Legal disclaimer"
    )


class GetTransactionsResponse(BaseModel):
    """Response with transaction records."""
    transactions: List[Dict[str, Any]]
    total_count: int
    disclaimer: str = Field(
        default="⚠️ These are metadata records only. Actual transfers happen externally on blockchain.",
        description="Legal disclaimer"
    )


__all__ = [
    'CreateInternalWalletRequest',
    'RecoverWalletRequest',
    'LinkExternalWalletRequest',
    'VerifyExternalLinkRequest',
    'SignContractRequest',
    'RecordTransactionRequest',
    'CreateWalletResponse',
    'WalletInfoResponse',
    'LinkExternalWalletResponse',
    'VerifyLinkResponse',
    'SignContractResponse',
    'TransactionRecordResponse',
    'GetTransactionsResponse'
]
