"""
GigChain Unified Wallet Manager
================================

Manages both internal and external wallets in a unified system.

Features:
- Create internal wallets
- Link external wallets
- Unified authentication
- Contract signing
- Transaction records
- Professional Services verification
"""

import time
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass
from datetime import datetime
import logging

from wallets.internal_wallet import InternalWallet, InternalWalletManager
from wallets.external_wallet import ExternalWallet, ExternalWalletLinker

logger = logging.getLogger(__name__)


@dataclass
class TransactionRecord:
    """
    Records transaction metadata (not actual blockchain transactions).
    
    GigChain tracks transaction records for audit purposes but is NOT
    responsible for actual money transfers which happen externally.
    """
    record_id: str
    user_id: str
    wallet_address: str  # Which wallet was used
    transaction_type: str  # "contract_payment", "milestone_payment", etc.
    amount: float
    currency: str  # "ETH", "USDC", etc.
    contract_id: Optional[str] = None
    external_tx_hash: Optional[str] = None  # If available
    status: str = "pending"  # pending, confirmed, failed
    created_at: datetime = None
    confirmed_at: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "record_id": self.record_id,
            "user_id": self.user_id,
            "wallet_address": self.wallet_address,
            "transaction_type": self.transaction_type,
            "amount": self.amount,
            "currency": self.currency,
            "contract_id": self.contract_id,
            "external_tx_hash": self.external_tx_hash,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "confirmed_at": self.confirmed_at.isoformat() if self.confirmed_at else None,
            "metadata": self.metadata or {}
        }


class WalletManager:
    """
    Unified wallet manager for GigChain.
    
    Manages:
    - Internal wallets (GigChain-created)
    - External wallets (user-controlled)
    - Wallet linking
    - Authentication
    - Contract signing
    - Transaction records
    """
    
    def __init__(self, master_key: Optional[bytes] = None):
        """
        Initialize wallet manager.
        
        Args:
            master_key: Master encryption key for internal wallets
        """
        self.internal_manager = InternalWalletManager(master_key)
        self.external_linker = ExternalWalletLinker()
        
        # In-memory storage (use database in production)
        self._internal_wallets: Dict[str, InternalWallet] = {}  # user_id -> wallet
        self._external_links: Dict[str, List[ExternalWallet]] = {}  # user_id -> [links]
        self._transaction_records: List[TransactionRecord] = []
        
        logger.info("💼 Unified Wallet Manager initialized")
    
    # ==================== Wallet Creation ====================
    
    def create_internal_wallet(
        self,
        user_id: str,
        user_password: Optional[str] = None
    ) -> Tuple[InternalWallet, str]:
        """
        Create internal GigChain wallet for user.
        
        Args:
            user_id: User identifier
            user_password: Optional password for encryption
            
        Returns:
            (wallet, mnemonic_phrase) - ⚠️ User MUST save mnemonic!
        """
        # Create wallet
        wallet, mnemonic = self.internal_manager.create_wallet(
            user_id=user_id,
            user_password=user_password
        )
        
        # Store in memory (use database in production)
        self._internal_wallets[user_id] = wallet
        
        logger.info(
            f"✅ Internal wallet created for user {user_id}: "
            f"{wallet.address}"
        )
        
        return (wallet, mnemonic)
    
    def recover_internal_wallet(
        self,
        user_id: str,
        mnemonic_phrase: str,
        user_password: Optional[str] = None
    ) -> Optional[InternalWallet]:
        """
        Recover internal wallet from 12-word mnemonic.
        
        Args:
            user_id: User identifier
            mnemonic_phrase: 12-word recovery phrase
            user_password: Optional password
            
        Returns:
            Recovered wallet or None if invalid
        """
        wallet = self.internal_manager.recover_wallet(
            user_id=user_id,
            mnemonic_phrase=mnemonic_phrase,
            user_password=user_password
        )
        
        if wallet:
            # Store recovered wallet
            self._internal_wallets[user_id] = wallet
            
            logger.info(
                f"✅ Internal wallet recovered for user {user_id}: "
                f"{wallet.address}"
            )
        
        return wallet
    
    # ==================== External Wallet Linking ====================
    
    def initiate_external_link(
        self,
        user_id: str,
        external_address: str
    ) -> Tuple[str, str]:
        """
        Initiate linking external wallet to user account.
        
        Args:
            user_id: User identifier
            external_address: External wallet address to link
            
        Returns:
            (link_id, verification_message) - Message to sign with external wallet
        """
        # Get user's internal wallet
        internal_wallet = self._internal_wallets.get(user_id)
        
        if not internal_wallet:
            raise ValueError(f"User {user_id} has no internal wallet")
        
        # Initiate link
        link_id, message = self.external_linker.initiate_link(
            user_id=user_id,
            internal_wallet_address=internal_wallet.address,
            external_address=external_address
        )
        
        return (link_id, message)
    
    def complete_external_link(
        self,
        user_id: str,
        external_address: str,
        signature: str,
        link_id: str,
        enable_professional: bool = False
    ) -> Optional[ExternalWallet]:
        """
        Complete external wallet linking with signature verification.
        
        Args:
            user_id: User identifier
            external_address: External wallet address
            signature: Signature from external wallet
            link_id: Link ID from initiate
            enable_professional: Enable Professional Services
            
        Returns:
            ExternalWallet if successful
        """
        internal_wallet = self._internal_wallets.get(user_id)
        
        if not internal_wallet:
            raise ValueError(f"User {user_id} has no internal wallet")
        
        # Verify and create link
        external_wallet = self.external_linker.verify_and_link(
            user_id=user_id,
            internal_wallet_address=internal_wallet.address,
            external_address=external_address,
            signature=signature,
            link_id=link_id,
            enable_professional=enable_professional
        )
        
        if external_wallet:
            # Store link
            if user_id not in self._external_links:
                self._external_links[user_id] = []
            
            self._external_links[user_id].append(external_wallet)
            
            logger.info(
                f"✅ External wallet linked for user {user_id}: "
                f"{external_address} (Professional: {enable_professional})"
            )
        
        return external_wallet
    
    def get_linked_external_wallets(
        self,
        user_id: str
    ) -> List[ExternalWallet]:
        """
        Get all external wallets linked to user.
        
        Args:
            user_id: User identifier
            
        Returns:
            List of linked external wallets
        """
        return self._external_links.get(user_id, [])
    
    # ==================== Authentication ====================
    
    def authenticate_with_wallet(
        self,
        wallet_address: str,
        use_internal: bool = True
    ) -> Optional[str]:
        """
        Check if wallet can authenticate.
        
        Args:
            wallet_address: Wallet address
            use_internal: Whether to check internal or external wallet
            
        Returns:
            User ID if wallet is valid, None otherwise
        """
        if use_internal:
            # Check internal wallets
            for user_id, wallet in self._internal_wallets.items():
                if wallet.address.lower() == wallet_address.lower() and wallet.is_active:
                    logger.debug(f"✅ Internal wallet auth: {wallet_address[:10]}... → {user_id}")
                    return user_id
        else:
            # Check external wallets
            for user_id, links in self._external_links.items():
                for link in links:
                    if (link.external_address.lower() == wallet_address.lower() and
                        link.is_active and link.verified):
                        logger.debug(f"✅ External wallet auth: {wallet_address[:10]}... → {user_id}")
                        return user_id
        
        return None
    
    def get_user_wallets(self, user_id: str) -> Dict[str, Any]:
        """
        Get all wallets for a user.
        
        Args:
            user_id: User identifier
            
        Returns:
            Dict with internal and external wallets
        """
        internal = self._internal_wallets.get(user_id)
        external = self._external_links.get(user_id, [])
        
        return {
            "internal_wallet": {
                "address": internal.address,
                "wallet_id": internal.wallet_id,
                "created_at": internal.created_at.isoformat(),
                "is_active": internal.is_active
            } if internal else None,
            "external_wallets": [
                {
                    "address": ext.external_address,
                    "link_id": ext.link_id,
                    "linked_at": ext.linked_at.isoformat(),
                    "verified": ext.verified,
                    "is_professional": ext.is_professional,
                    "is_active": ext.is_active
                }
                for ext in external if ext.is_active
            ]
        }
    
    # ==================== Contract Signing ====================
    
    def sign_contract(
        self,
        user_id: str,
        contract_data: Dict[str, Any],
        use_internal: bool = True,
        user_password: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Sign a contract with user's wallet.
        
        Args:
            user_id: User identifier
            contract_data: Contract data to sign
            use_internal: Use internal wallet (True) or external (False)
            user_password: Password for internal wallet decryption
            
        Returns:
            Signed contract data
        """
        if use_internal:
            # Sign with internal wallet
            internal_wallet = self._internal_wallets.get(user_id)
            
            if not internal_wallet:
                logger.error(f"❌ No internal wallet for user {user_id}")
                return None
            
            signed_contract = self.internal_manager.sign_contract(
                wallet=internal_wallet,
                contract_data=contract_data,
                user_password=user_password
            )
            
            if signed_contract:
                logger.info(
                    f"📝 Contract signed with INTERNAL wallet by user {user_id}"
                )
            
            return signed_contract
        else:
            # For external wallet, return unsigned contract
            # User must sign with their own wallet (MetaMask, etc.)
            logger.info(
                f"📝 Contract prepared for EXTERNAL wallet signing by user {user_id}"
            )
            
            import json
            import hashlib
            
            contract_json = json.dumps(contract_data, sort_keys=True)
            contract_hash = hashlib.sha256(contract_json.encode()).hexdigest()
            
            return {
                **contract_data,
                "contract_hash": contract_hash,
                "requires_external_signature": True,
                "sign_instructions": "Sign contract hash with your external wallet"
            }
    
    # ==================== Transaction Records ====================
    
    def record_transaction(
        self,
        user_id: str,
        wallet_address: str,
        transaction_type: str,
        amount: float,
        currency: str = "ETH",
        contract_id: Optional[str] = None,
        external_tx_hash: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> TransactionRecord:
        """
        Record a transaction (metadata only, not actual transfer).
        
        ⚠️ IMPORTANT: GigChain records transaction metadata but is NOT
        responsible for actual money transfers which happen externally.
        
        Args:
            user_id: User identifier
            wallet_address: Wallet address used
            transaction_type: Type of transaction
            amount: Transaction amount
            currency: Currency (ETH, USDC, etc.)
            contract_id: Related contract ID
            external_tx_hash: Blockchain transaction hash (if available)
            metadata: Additional metadata
            
        Returns:
            TransactionRecord
        """
        import secrets
        
        record = TransactionRecord(
            record_id=f"TX-{secrets.token_hex(16)}",
            user_id=user_id,
            wallet_address=wallet_address,
            transaction_type=transaction_type,
            amount=amount,
            currency=currency,
            contract_id=contract_id,
            external_tx_hash=external_tx_hash,
            status="pending",
            created_at=datetime.now(),
            metadata=metadata
        )
        
        self._transaction_records.append(record)
        
        logger.info(
            f"📊 Transaction recorded: {record.record_id} "
            f"({amount} {currency}, type: {transaction_type})"
        )
        
        logger.warning(
            "⚠️ DISCLAIMER: GigChain records transaction metadata only. "
            "Actual money transfer happens externally. "
            "We are NOT responsible for transfer errors or miscalculations."
        )
        
        return record
    
    def update_transaction_status(
        self,
        record_id: str,
        status: str,
        external_tx_hash: Optional[str] = None
    ) -> bool:
        """
        Update transaction record status.
        
        Args:
            record_id: Transaction record ID
            status: New status (confirmed, failed, etc.)
            external_tx_hash: Blockchain transaction hash
            
        Returns:
            True if updated successfully
        """
        for record in self._transaction_records:
            if record.record_id == record_id:
                record.status = status
                
                if status == "confirmed":
                    record.confirmed_at = datetime.now()
                
                if external_tx_hash:
                    record.external_tx_hash = external_tx_hash
                
                logger.info(
                    f"📝 Transaction {record_id} updated: {status} "
                    f"(tx: {external_tx_hash[:16] if external_tx_hash else 'N/A'}...)"
                )
                
                return True
        
        return False
    
    def get_transaction_records(
        self,
        user_id: Optional[str] = None,
        contract_id: Optional[str] = None,
        limit: int = 100
    ) -> List[TransactionRecord]:
        """
        Get transaction records.
        
        Args:
            user_id: Filter by user (optional)
            contract_id: Filter by contract (optional)
            limit: Max records to return
            
        Returns:
            List of transaction records
        """
        records = self._transaction_records
        
        # Filter by user
        if user_id:
            records = [r for r in records if r.user_id == user_id]
        
        # Filter by contract
        if contract_id:
            records = [r for r in records if r.contract_id == contract_id]
        
        # Sort by created_at (newest first)
        records = sorted(records, key=lambda r: r.created_at, reverse=True)
        
        return records[:limit]
    
    # ==================== Wallet Information ====================
    
    def get_wallet_for_auth(
        self,
        wallet_address: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get wallet information for authentication.
        
        Checks both internal and external wallets.
        
        Args:
            wallet_address: Wallet address
            
        Returns:
            Wallet info dict or None
        """
        # Check internal wallets
        for user_id, wallet in self._internal_wallets.items():
            if wallet.address.lower() == wallet_address.lower() and wallet.is_active:
                return {
                    "user_id": user_id,
                    "address": wallet.address,
                    "type": "internal",
                    "wallet_id": wallet.wallet_id,
                    "can_sign_contracts": True,
                    "is_professional": False  # Internal wallets don't need verification
                }
        
        # Check external wallets
        for user_id, links in self._external_links.items():
            for link in links:
                if (link.external_address.lower() == wallet_address.lower() and
                    link.is_active and link.verified):
                    return {
                        "user_id": user_id,
                        "address": link.external_address,
                        "type": "external",
                        "link_id": link.link_id,
                        "can_sign_contracts": True,
                        "is_professional": link.is_professional,
                        "internal_wallet": self._internal_wallets.get(user_id).address if user_id in self._internal_wallets else None
                    }
        
        return None
    
    def get_internal_wallet(self, user_id: str) -> Optional[InternalWallet]:
        """Get user's internal wallet."""
        return self._internal_wallets.get(user_id)
    
    def has_internal_wallet(self, user_id: str) -> bool:
        """Check if user has internal wallet."""
        return user_id in self._internal_wallets
    
    def has_professional_wallet(self, user_id: str) -> bool:
        """
        Check if user has linked external wallet for Professional Services.
        
        Args:
            user_id: User identifier
            
        Returns:
            True if user has verified professional wallet
        """
        external_links = self._external_links.get(user_id, [])
        
        for link in external_links:
            if link.is_active and link.verified and link.is_professional:
                return True
        
        return False
    
    def get_professional_wallet(self, user_id: str) -> Optional[ExternalWallet]:
        """Get user's professional external wallet."""
        external_links = self._external_links.get(user_id, [])
        
        for link in external_links:
            if link.is_active and link.verified and link.is_professional:
                return link
        
        return None
    
    # ==================== Statistics ====================
    
    def get_wallet_statistics(self) -> Dict[str, Any]:
        """Get overall wallet statistics."""
        total_internal = len(self._internal_wallets)
        total_external = sum(len(links) for links in self._external_links.values())
        
        active_internal = sum(
            1 for w in self._internal_wallets.values() if w.is_active
        )
        
        active_external = sum(
            1 for links in self._external_links.values()
            for link in links
            if link.is_active and link.verified
        )
        
        professional_count = sum(
            1 for links in self._external_links.values()
            for link in links
            if link.is_active and link.is_professional
        )
        
        return {
            "total_internal_wallets": total_internal,
            "total_external_wallets": total_external,
            "active_internal": active_internal,
            "active_external": active_external,
            "professional_accounts": professional_count,
            "transaction_records": len(self._transaction_records)
        }


# Singleton instance
_wallet_manager: Optional[WalletManager] = None


def get_wallet_manager(master_key: Optional[bytes] = None) -> WalletManager:
    """Get or create wallet manager singleton."""
    global _wallet_manager
    
    if _wallet_manager is None:
        _wallet_manager = WalletManager(master_key)
    
    return _wallet_manager


def reset_wallet_manager():
    """Reset wallet manager singleton (useful for testing)."""
    global _wallet_manager
    _wallet_manager = None


__all__ = [
    'TransactionRecord',
    'WalletManager',
    'get_wallet_manager',
    'reset_wallet_manager'
]
