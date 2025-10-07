"""
GigChain External Wallet Linking
=================================

Links external wallets (MetaMask, WalletConnect, etc.) to user accounts.

Features:
- Link external wallet to internal wallet
- Verify ownership via signature
- Professional Services verification
- Unlinking/relinking
- Multi-wallet support (optional)

Use Cases:
- Professional Services providers link verified wallet
- Payment processing (external to platform)
- Identity verification
- Cross-platform wallet usage
"""

import time
import secrets
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@dataclass
class ExternalWallet:
    """
    Represents an external wallet linked to a user account.
    
    External wallets are user-controlled (MetaMask, hardware wallet, etc.)
    and can be linked for Professional Services verification.
    """
    link_id: str
    user_id: str
    internal_wallet_address: str
    external_address: str
    linked_at: datetime
    verified: bool = False
    verification_signature: Optional[str] = None
    is_professional: bool = False  # Enabled for Professional Services
    is_active: bool = True
    metadata: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "link_id": self.link_id,
            "user_id": self.user_id,
            "internal_wallet_address": self.internal_wallet_address,
            "external_address": self.external_address,
            "linked_at": self.linked_at.isoformat(),
            "verified": self.verified,
            "is_professional": self.is_professional,
            "is_active": self.is_active,
            "metadata": self.metadata or {}
        }


class ExternalWalletLinker:
    """
    Manages linking external wallets to internal wallets.
    
    Allows users to:
    - Link external wallet for Professional Services
    - Verify ownership via signature
    - Use external wallet for payments
    - Maintain transaction records
    """
    
    def __init__(self):
        """Initialize external wallet linker."""
        logger.info("🔗 External Wallet Linker initialized")
    
    def initiate_link(
        self,
        user_id: str,
        internal_wallet_address: str,
        external_address: str
    ) -> Tuple[str, str]:
        """
        Initiate linking an external wallet.
        
        Returns a challenge that user must sign with external wallet
        to prove ownership.
        
        Args:
            user_id: User identifier
            internal_wallet_address: User's internal wallet address
            external_address: External wallet to link
            
        Returns:
            (link_id, verification_message) - ID and message to sign
        """
        link_id = f"LINK-{secrets.token_hex(16)}"
        
        # Create verification message
        verification_message = self._create_verification_message(
            user_id=user_id,
            internal_address=internal_wallet_address,
            external_address=external_address,
            link_id=link_id
        )
        
        logger.info(
            f"🔗 Link initiated: {internal_wallet_address[:10]}... ⇔ "
            f"{external_address[:10]}... (user: {user_id})"
        )
        
        return (link_id, verification_message)
    
    def verify_and_link(
        self,
        user_id: str,
        internal_wallet_address: str,
        external_address: str,
        signature: str,
        link_id: str,
        enable_professional: bool = False
    ) -> Optional[ExternalWallet]:
        """
        Verify external wallet ownership and create link.
        
        Args:
            user_id: User identifier
            internal_wallet_address: Internal wallet address
            external_address: External wallet address
            signature: Signature from external wallet
            link_id: Link ID from initiate_link()
            enable_professional: Enable Professional Services
            
        Returns:
            ExternalWallet if verification succeeds, None otherwise
        """
        # Recreate verification message
        verification_message = self._create_verification_message(
            user_id=user_id,
            internal_address=internal_wallet_address,
            external_address=external_address,
            link_id=link_id
        )
        
        # Verify signature
        is_valid = self._verify_signature(
            message=verification_message,
            signature=signature,
            expected_address=external_address
        )
        
        if not is_valid:
            logger.error(
                f"❌ Failed to verify external wallet ownership: "
                f"{external_address[:10]}..."
            )
            return None
        
        logger.info(f"✅ External wallet ownership verified: {external_address[:10]}...")
        
        # Create link
        external_wallet = ExternalWallet(
            link_id=link_id,
            user_id=user_id,
            internal_wallet_address=internal_wallet_address,
            external_address=external_address,
            linked_at=datetime.now(),
            verified=True,
            verification_signature=signature,
            is_professional=enable_professional,
            is_active=True,
            metadata={
                "linked_via": "signature_verification",
                "verified_at": datetime.now().isoformat()
            }
        )
        
        logger.info(
            f"🔗 External wallet linked: {external_address[:10]}... "
            f"(Professional: {enable_professional})"
        )
        
        return external_wallet
    
    def unlink_wallet(
        self,
        link_id: str,
        user_id: str
    ) -> bool:
        """
        Unlink an external wallet.
        
        Args:
            link_id: Link ID to unlink
            user_id: User identifier (for authorization)
            
        Returns:
            True if unlinked successfully
        """
        logger.info(f"🔓 Unlinking external wallet: {link_id} (user: {user_id})")
        
        # In production: Update database
        # UPDATE external_wallets SET is_active = false WHERE link_id = ? AND user_id = ?
        
        return True
    
    def enable_professional_services(
        self,
        link_id: str,
        user_id: str
    ) -> bool:
        """
        Enable Professional Services for a linked external wallet.
        
        Allows users to offer premium services with verified payment wallet.
        
        Args:
            link_id: Link ID
            user_id: User identifier
            
        Returns:
            True if enabled successfully
        """
        logger.info(
            f"⭐ Enabling Professional Services for link {link_id} "
            f"(user: {user_id})"
        )
        
        # In production: Update database
        # UPDATE external_wallets SET is_professional = true WHERE link_id = ? AND user_id = ?
        
        return True
    
    def _create_verification_message(
        self,
        user_id: str,
        internal_address: str,
        external_address: str,
        link_id: str
    ) -> str:
        """Create verification message for external wallet linking."""
        timestamp = int(time.time())
        
        message = f"""GigChain.io - Link External Wallet

I authorize linking this external wallet to my GigChain account.

User ID: {user_id}
Internal Wallet: {internal_address}
External Wallet: {external_address}
Link ID: {link_id[:16]}...
Timestamp: {timestamp}

⚠️ IMPORTANT:
- This links your external wallet for Professional Services
- External wallet will be used for payments (outside GigChain)
- GigChain is not responsible for external wallet transactions
- Only sign this if you initiated the linking process

By signing, you confirm you control this external wallet."""
        
        return message
    
    def _verify_signature(
        self,
        message: str,
        signature: str,
        expected_address: str
    ) -> bool:
        """Verify wallet signature."""
        try:
            from eth_account.messages import encode_defunct
            from web3 import Web3
            
            web3 = Web3()
            encoded_message = encode_defunct(text=message)
            
            recovered_address = web3.eth.account.recover_message(
                encoded_message,
                signature=signature
            )
            
            # Constant-time comparison
            import hmac
            is_valid = hmac.compare_digest(
                recovered_address.lower(),
                expected_address.lower()
            )
            
            return is_valid
            
        except Exception as e:
            logger.error(f"Signature verification failed: {str(e)}")
            return False


__all__ = [
    'ExternalWallet',
    'ExternalWalletLinker'
]
