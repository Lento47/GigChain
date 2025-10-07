"""
GigChain Wallet System
======================

Unified wallet management system for GigChain.io

Features:
- Internal wallets (GigChain-created with 12-word recovery)
- External wallets (user-controlled, linkable)
- Unified authentication
- Contract signing
- Transaction record keeping
- Professional Services verification

Version: 1.0.0
"""

from wallets.internal_wallet import InternalWallet, InternalWalletManager
from wallets.external_wallet import ExternalWallet, ExternalWalletLinker
from wallets.wallet_manager import (
    WalletManager,
    TransactionRecord,
    get_wallet_manager,
    reset_wallet_manager
)
from wallets.database import WalletDatabase, get_wallet_db
from wallets.routes import router as wallet_router
from wallets import schemas

__all__ = [
    # Internal Wallets
    'InternalWallet',
    'InternalWalletManager',
    
    # External Wallets
    'ExternalWallet',
    'ExternalWalletLinker',
    
    # Unified Management
    'WalletManager',
    'TransactionRecord',
    'get_wallet_manager',
    'reset_wallet_manager',
    
    # Database
    'WalletDatabase',
    'get_wallet_db',
    
    # Routes
    'wallet_router',
    
    # Schemas
    'schemas'
]

__version__ = "1.0.0"
__author__ = "GigChain.io"
__module__ = "Wallet System"
