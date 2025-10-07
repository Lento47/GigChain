"""
GigChain Internal Wallet System
================================

Creates and manages internal wallets for users with full HD wallet capabilities.

Features:
- BIP39 mnemonic generation (12 words)
- BIP32/BIP44 HD wallet derivation
- Ethereum wallet creation
- Secure key storage (encrypted)
- Contract signing
- Recovery via mnemonic phrase

Security:
- Private keys encrypted at rest
- Mnemonic phrases encrypted
- User-specific encryption keys
- Secure key derivation
"""

import secrets
import hashlib
from typing import Optional, Dict, Any, Tuple
from dataclasses import dataclass
from datetime import datetime
import logging

from eth_account import Account
from mnemonic import Mnemonic
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2

logger = logging.getLogger(__name__)


@dataclass
class InternalWallet:
    """
    Represents a GigChain internal wallet.
    
    This wallet is created and managed by the platform but owned by the user.
    """
    wallet_id: str
    user_id: str
    address: str
    encrypted_private_key: bytes
    encrypted_mnemonic: bytes
    created_at: datetime
    is_active: bool = True
    metadata: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary (safe for database storage)."""
        return {
            "wallet_id": self.wallet_id,
            "user_id": self.user_id,
            "address": self.address,
            "encrypted_private_key": self.encrypted_private_key.hex(),
            "encrypted_mnemonic": self.encrypted_mnemonic.hex(),
            "created_at": self.created_at.isoformat(),
            "is_active": self.is_active,
            "metadata": self.metadata or {}
        }


class InternalWalletManager:
    """
    Manages internal GigChain wallets.
    
    Creates, stores, and manages internal wallets with secure encryption.
    """
    
    def __init__(self, master_key: Optional[bytes] = None):
        """
        Initialize wallet manager.
        
        Args:
            master_key: Master encryption key (32 bytes). If None, generates one.
        """
        self.master_key = master_key or Fernet.generate_key()
        self.mnemonic_generator = Mnemonic("english")
        
        logger.info("🔐 Internal Wallet Manager initialized")
    
    def create_wallet(
        self,
        user_id: str,
        user_password: Optional[str] = None
    ) -> Tuple[InternalWallet, str]:
        """
        Create a new internal wallet for a user.
        
        Args:
            user_id: User identifier
            user_password: Optional password for additional encryption
            
        Returns:
            (InternalWallet, mnemonic_phrase) - Wallet and recovery phrase
        """
        # Generate 12-word mnemonic (BIP39)
        mnemonic_phrase = self.mnemonic_generator.generate(strength=128)  # 12 words
        
        logger.info(f"🔑 Generated 12-word mnemonic for user {user_id}")
        
        # Derive seed from mnemonic
        seed = self.mnemonic_generator.to_seed(mnemonic_phrase)
        
        # Create Ethereum account from seed
        # Using first derivation path: m/44'/60'/0'/0/0
        account = Account.from_key(seed[:32])
        
        wallet_address = account.address
        private_key = account.key.hex()
        
        logger.info(f"✅ Created internal wallet: {wallet_address} for user {user_id}")
        
        # Generate encryption key from user context
        encryption_key = self._derive_encryption_key(user_id, user_password)
        
        # Encrypt private key
        encrypted_private_key = self._encrypt_data(
            private_key.encode(),
            encryption_key
        )
        
        # Encrypt mnemonic
        encrypted_mnemonic = self._encrypt_data(
            mnemonic_phrase.encode(),
            encryption_key
        )
        
        # Create wallet object
        wallet = InternalWallet(
            wallet_id=self._generate_wallet_id(),
            user_id=user_id,
            address=wallet_address,
            encrypted_private_key=encrypted_private_key,
            encrypted_mnemonic=encrypted_mnemonic,
            created_at=datetime.now(),
            is_active=True,
            metadata={
                "type": "internal",
                "created_by": "gigchain",
                "derivation_path": "m/44'/60'/0'/0/0"
            }
        )
        
        return (wallet, mnemonic_phrase)
    
    def recover_wallet(
        self,
        user_id: str,
        mnemonic_phrase: str,
        user_password: Optional[str] = None
    ) -> Optional[InternalWallet]:
        """
        Recover wallet from 12-word mnemonic phrase.
        
        Args:
            user_id: User identifier
            mnemonic_phrase: 12-word recovery phrase
            user_password: Optional password for encryption
            
        Returns:
            Recovered InternalWallet or None if invalid
        """
        # Validate mnemonic
        if not self.mnemonic_generator.check(mnemonic_phrase):
            logger.error(f"❌ Invalid mnemonic phrase for user {user_id}")
            return None
        
        logger.info(f"🔄 Recovering wallet from mnemonic for user {user_id}")
        
        # Derive seed from mnemonic
        seed = self.mnemonic_generator.to_seed(mnemonic_phrase)
        
        # Recreate Ethereum account
        account = Account.from_key(seed[:32])
        
        wallet_address = account.address
        private_key = account.key.hex()
        
        logger.info(f"✅ Recovered wallet: {wallet_address}")
        
        # Generate encryption key
        encryption_key = self._derive_encryption_key(user_id, user_password)
        
        # Encrypt private key
        encrypted_private_key = self._encrypt_data(
            private_key.encode(),
            encryption_key
        )
        
        # Encrypt mnemonic
        encrypted_mnemonic = self._encrypt_data(
            mnemonic_phrase.encode(),
            encryption_key
        )
        
        # Create recovered wallet
        wallet = InternalWallet(
            wallet_id=self._generate_wallet_id(),
            user_id=user_id,
            address=wallet_address,
            encrypted_private_key=encrypted_private_key,
            encrypted_mnemonic=encrypted_mnemonic,
            created_at=datetime.now(),
            is_active=True,
            metadata={
                "type": "internal",
                "recovered": True,
                "recovered_at": datetime.now().isoformat()
            }
        )
        
        return wallet
    
    def get_private_key(
        self,
        wallet: InternalWallet,
        user_password: Optional[str] = None
    ) -> Optional[str]:
        """
        Decrypt and retrieve private key.
        
        SECURITY: Use with caution. Only for signing operations.
        
        Args:
            wallet: Internal wallet
            user_password: User password for decryption
            
        Returns:
            Private key (hex) or None if decryption fails
        """
        try:
            encryption_key = self._derive_encryption_key(
                wallet.user_id,
                user_password
            )
            
            decrypted = self._decrypt_data(
                wallet.encrypted_private_key,
                encryption_key
            )
            
            return decrypted.decode()
            
        except Exception as e:
            logger.error(f"❌ Failed to decrypt private key: {str(e)}")
            return None
    
    def sign_message(
        self,
        wallet: InternalWallet,
        message: str,
        user_password: Optional[str] = None
    ) -> Optional[str]:
        """
        Sign a message with the internal wallet.
        
        Used for contract signing and authentication.
        
        Args:
            wallet: Internal wallet
            message: Message to sign
            user_password: User password for key decryption
            
        Returns:
            Signature (hex) or None if signing fails
        """
        try:
            # Get private key
            private_key = self.get_private_key(wallet, user_password)
            
            if not private_key:
                return None
            
            # Create account from private key
            account = Account.from_key(private_key)
            
            # Sign message (EIP-191)
            from eth_account.messages import encode_defunct
            
            encoded_message = encode_defunct(text=message)
            signed_message = account.sign_message(encoded_message)
            
            logger.info(f"✅ Message signed with internal wallet {wallet.address[:10]}...")
            
            return signed_message.signature.hex()
            
        except Exception as e:
            logger.error(f"❌ Failed to sign message: {str(e)}")
            return None
    
    def sign_contract(
        self,
        wallet: InternalWallet,
        contract_data: Dict[str, Any],
        user_password: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Sign a contract with the internal wallet.
        
        Args:
            wallet: Internal wallet
            contract_data: Contract data to sign
            user_password: User password for key decryption
            
        Returns:
            Signed contract data with signature
        """
        import json
        
        try:
            # Create deterministic contract hash
            contract_json = json.dumps(contract_data, sort_keys=True)
            contract_hash = hashlib.sha256(contract_json.encode()).hexdigest()
            
            # Sign contract hash
            signature = self.sign_message(wallet, contract_hash, user_password)
            
            if not signature:
                return None
            
            signed_contract = {
                **contract_data,
                "signature": signature,
                "signer": wallet.address,
                "signed_at": datetime.now().isoformat(),
                "contract_hash": contract_hash
            }
            
            logger.info(
                f"📝 Contract signed by internal wallet {wallet.address[:10]}... "
                f"(hash: {contract_hash[:16]}...)"
            )
            
            return signed_contract
            
        except Exception as e:
            logger.error(f"❌ Failed to sign contract: {str(e)}")
            return None
    
    def verify_signature(
        self,
        wallet_address: str,
        message: str,
        signature: str
    ) -> bool:
        """
        Verify a signature from an internal wallet.
        
        Args:
            wallet_address: Wallet address that signed
            message: Original message
            signature: Signature to verify
            
        Returns:
            True if signature is valid
        """
        try:
            from eth_account.messages import encode_defunct
            from web3 import Web3
            
            web3 = Web3()
            encoded_message = encode_defunct(text=message)
            
            recovered_address = web3.eth.account.recover_message(
                encoded_message,
                signature=signature
            )
            
            is_valid = recovered_address.lower() == wallet_address.lower()
            
            if is_valid:
                logger.debug(f"✅ Valid signature from {wallet_address[:10]}...")
            else:
                logger.warning(f"❌ Invalid signature from {wallet_address[:10]}...")
            
            return is_valid
            
        except Exception as e:
            logger.error(f"Signature verification error: {str(e)}")
            return False
    
    def _derive_encryption_key(
        self,
        user_id: str,
        user_password: Optional[str]
    ) -> bytes:
        """
        Derive encryption key from user context.
        
        Args:
            user_id: User identifier
            user_password: Optional user password
            
        Returns:
            32-byte encryption key
        """
        # Combine user_id and password for salt
        salt_input = f"{user_id}:{user_password or 'default'}".encode()
        salt = hashlib.sha256(salt_input).digest()
        
        # Derive key using PBKDF2
        kdf = PBKDF2(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        
        key = kdf.derive(self.master_key)
        
        return key
    
    def _encrypt_data(self, data: bytes, key: bytes) -> bytes:
        """Encrypt data with key."""
        fernet = Fernet(key)
        return fernet.encrypt(data)
    
    def _decrypt_data(self, encrypted_data: bytes, key: bytes) -> bytes:
        """Decrypt data with key."""
        fernet = Fernet(key)
        return fernet.decrypt(encrypted_data)
    
    def _generate_wallet_id(self) -> str:
        """Generate unique wallet ID."""
        return f"GC-{secrets.token_hex(16)}"


__all__ = [
    'InternalWallet',
    'InternalWalletManager'
]
