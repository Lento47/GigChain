"""
GigChain Internal Wallet Manager

This module manages internal GigChain wallets that are separate from blockchain wallets.
These are platform-specific wallets used for internal transactions and balance management.
"""

import sqlite3
import secrets
import hashlib
from datetime import datetime
from typing import Optional, Dict, Any, List
from contextlib import contextmanager
import logging
from decimal import Decimal, getcontext, ROUND_HALF_UP

logger = logging.getLogger(__name__)

# Set up decimal context for currency precision (2 decimal places)
getcontext().prec = 10  # Sufficient precision for calculations
getcontext().rounding = ROUND_HALF_UP

class GigChainWallet:
    """Represents an internal GigChain wallet"""
    
    def __init__(
        self,
        wallet_id: str,
        wallet_address: str,
        user_address: str,
        name: str,
        balance: Decimal = Decimal('0.00'),
        currency: str = "GIG",
        created_at: Optional[str] = None,
        updated_at: Optional[str] = None,
        is_active: bool = True
    ):
        self.wallet_id = wallet_id
        self.wallet_address = wallet_address  # Internal GigChain address
        self.user_address = user_address  # User's blockchain wallet address
        self.name = name
        self.balance = Decimal(str(balance)).quantize(Decimal('0.01'))
        self.currency = currency
        self.created_at = created_at or datetime.now().isoformat()
        self.updated_at = updated_at or datetime.now().isoformat()
        self.is_active = is_active
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert wallet to dictionary"""
        return {
            "wallet_id": self.wallet_id,
            "wallet_address": self.wallet_address,
            "user_address": self.user_address,
            "name": self.name,
            "balance": float(self.balance),  # Convert to float for JSON serialization
            "currency": self.currency,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "is_active": self.is_active
        }


class WalletManager:
    """Manages GigChain internal wallets"""
    
    def __init__(self, db_path: str = "gigchain_wallets.db"):
        self.db_path = db_path
        self._initialize_database()
    
    @contextmanager
    def _get_connection(self):
        """Context manager for database connections with foreign key enforcement"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        # Enable foreign key constraints
        conn.execute("PRAGMA foreign_keys = ON")
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
    
    def _initialize_database(self):
        """Initialize database schema"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Wallets table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS wallets (
                    wallet_id TEXT PRIMARY KEY,
                    wallet_address TEXT UNIQUE NOT NULL,
                    user_address TEXT NOT NULL,
                    name TEXT NOT NULL,
                    balance TEXT DEFAULT '0.00',
                    currency TEXT DEFAULT 'GIG',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    is_active INTEGER DEFAULT 1,
                    UNIQUE(user_address, name)
                )
            """)
            
            # Transactions table for tracking wallet activity
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS wallet_transactions (
                    transaction_id TEXT PRIMARY KEY,
                    wallet_id TEXT NOT NULL,
                    type TEXT NOT NULL,
                    amount TEXT NOT NULL,
                    description TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (wallet_id) REFERENCES wallets (wallet_id) ON DELETE CASCADE,
                    UNIQUE(wallet_id, created_at, type, amount)
                )
            """)
            
            # Create indexes
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_user_address 
                ON wallets(user_address)
            """)
            
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_wallet_transactions 
                ON wallet_transactions(wallet_id, created_at)
            """)
            
            conn.commit()
            logger.info("✅ Wallet database initialized")
    
    def _generate_wallet_address(self) -> str:
        """Generate a unique GigChain wallet address"""
        # GigChain addresses start with 'GC' followed by 40 hex characters
        random_bytes = secrets.token_bytes(20)
        hex_string = random_bytes.hex()
        return f"GC{hex_string.upper()}"
    
    def _generate_wallet_id(self, user_address: str) -> str:
        """Generate unique wallet ID"""
        timestamp = datetime.now().isoformat()
        data = f"{user_address}{timestamp}{secrets.token_hex(8)}"
        return hashlib.sha256(data.encode()).hexdigest()
    
    def _generate_transaction_id(self, wallet_id: str, timestamp: str) -> str:
        """Generate collision-safe transaction ID"""
        # Use more entropy to prevent collisions
        entropy = secrets.token_hex(16)
        data = f"{wallet_id}{timestamp}{entropy}"
        return hashlib.sha256(data.encode()).hexdigest()
    
    def _insert_transaction(
        self, 
        cursor, 
        wallet_id: str, 
        transaction_type: str, 
        amount: str, 
        description: str, 
        timestamp: str
    ) -> bool:
        """
        Insert transaction with proper error handling for unique constraints
        
        Returns:
            True if successful, False if unique constraint violation
        """
        try:
            transaction_id = self._generate_transaction_id(wallet_id, timestamp)
            cursor.execute("""
                INSERT INTO wallet_transactions (
                    transaction_id, wallet_id, type, amount, description, created_at
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (transaction_id, wallet_id, transaction_type, amount, description, timestamp))
            return True
        except sqlite3.IntegrityError as e:
            if "UNIQUE constraint failed" in str(e):
                logger.warning(f"⚠️ Duplicate transaction prevented: {wallet_id}, {transaction_type}, {amount}")
                return False
            else:
                logger.error(f"❌ Transaction insertion failed: {str(e)}")
                raise
        except Exception as e:
            logger.error(f"❌ Unexpected error inserting transaction: {str(e)}")
            raise
    
    def create_wallet(
        self, 
        user_address: str, 
        name: str = "Mi Wallet GigChain"
    ) -> Optional[GigChainWallet]:
        """
        Create a new internal GigChain wallet for a user.
        
        Args:
            user_address: User's blockchain wallet address
            name: Name for the wallet
            
        Returns:
            GigChainWallet object if successful, None otherwise
            
        Raises:
            ValueError: If wallet with same name already exists for user
        """
        try:
            # Check if user already has a wallet with this name
            existing_wallet = self.get_wallet_by_user_and_name(user_address, name)
            if existing_wallet:
                raise ValueError(f"User {user_address[:10]}... already has a wallet named '{name}'")
            
            # Generate wallet details
            wallet_id = self._generate_wallet_id(user_address)
            wallet_address = self._generate_wallet_address()
            now = datetime.now().isoformat()
            
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO wallets (
                        wallet_id, wallet_address, user_address, name,
                        balance, currency, created_at, updated_at, is_active
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    wallet_id, wallet_address, user_address, name,
                    "0.00", "GIG", now, now, 1
                ))
                
                # Log creation transaction
                self._insert_transaction(
                    cursor, wallet_id, "created", "0.00", 
                    "Wallet created", now
                )
                
                conn.commit()
                
            wallet = GigChainWallet(
                wallet_id=wallet_id,
                wallet_address=wallet_address,
                user_address=user_address,
                name=name,
                balance=Decimal('0.00'),
                currency="GIG",
                created_at=now,
                updated_at=now,
                is_active=True
            )
            
            logger.info(f"✅ Created wallet {wallet_address} ({name}) for user {user_address[:10]}...")
            return wallet
            
        except ValueError as e:
            logger.warning(f"⚠️ Wallet creation failed: {str(e)}")
            raise e
        except Exception as e:
            logger.error(f"❌ Error creating wallet: {str(e)}")
            return None
    
    def get_wallet_by_user(self, user_address: str) -> Optional[GigChainWallet]:
        """Get the first active wallet by user's blockchain address (for backward compatibility)"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT * FROM wallets 
                    WHERE user_address = ? AND is_active = 1
                    ORDER BY created_at ASC
                    LIMIT 1
                """, (user_address,))
                
                row = cursor.fetchone()
                if not row:
                    return None
                
                return GigChainWallet(
                    wallet_id=row['wallet_id'],
                    wallet_address=row['wallet_address'],
                    user_address=row['user_address'],
                    name=row['name'],
                    balance=Decimal(row['balance']),
                    currency=row['currency'],
                    created_at=row['created_at'],
                    updated_at=row['updated_at'],
                    is_active=bool(row['is_active'])
                )
                
        except Exception as e:
            logger.error(f"❌ Error getting wallet: {str(e)}")
            return None
    
    def get_wallet_by_user_and_name(self, user_address: str, name: str) -> Optional[GigChainWallet]:
        """Get wallet by user's blockchain address and wallet name"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT * FROM wallets 
                    WHERE user_address = ? AND name = ? AND is_active = 1
                """, (user_address, name))
                
                row = cursor.fetchone()
                if not row:
                    return None
                
                return GigChainWallet(
                    wallet_id=row['wallet_id'],
                    wallet_address=row['wallet_address'],
                    user_address=row['user_address'],
                    name=row['name'],
                    balance=Decimal(row['balance']),
                    currency=row['currency'],
                    created_at=row['created_at'],
                    updated_at=row['updated_at'],
                    is_active=bool(row['is_active'])
                )
                
        except Exception as e:
            logger.error(f"❌ Error getting wallet: {str(e)}")
            return None
    
    def get_all_wallets_by_user(self, user_address: str) -> List[GigChainWallet]:
        """Get all active wallets for a user"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT * FROM wallets 
                    WHERE user_address = ? AND is_active = 1
                    ORDER BY created_at ASC
                """, (user_address,))
                
                wallets = []
                for row in cursor.fetchall():
                    wallets.append(GigChainWallet(
                        wallet_id=row['wallet_id'],
                        wallet_address=row['wallet_address'],
                        user_address=row['user_address'],
                        name=row['name'],
                        balance=Decimal(row['balance']),
                        currency=row['currency'],
                        created_at=row['created_at'],
                        updated_at=row['updated_at'],
                        is_active=bool(row['is_active'])
                    ))
                
                return wallets
                
        except Exception as e:
            logger.error(f"❌ Error getting wallets: {str(e)}")
            return []
    
    def get_wallet_by_address(self, wallet_address: str) -> Optional[GigChainWallet]:
        """Get wallet by GigChain wallet address"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT * FROM wallets 
                    WHERE wallet_address = ? AND is_active = 1
                """, (wallet_address,))
                
                row = cursor.fetchone()
                if not row:
                    return None
                
                return GigChainWallet(
                    wallet_id=row['wallet_id'],
                    wallet_address=row['wallet_address'],
                    user_address=row['user_address'],
                    name=row['name'],
                    balance=Decimal(row['balance']),
                    currency=row['currency'],
                    created_at=row['created_at'],
                    updated_at=row['updated_at'],
                    is_active=bool(row['is_active'])
                )
                
        except Exception as e:
            logger.error(f"❌ Error getting wallet: {str(e)}")
            return None
    
    def update_balance(
        self, 
        wallet_address: str, 
        amount: Decimal, 
        transaction_type: str,
        description: str = ""
    ) -> bool:
        """
        Update wallet balance and log transaction
        
        Args:
            wallet_address: GigChain wallet address
            amount: Amount to add (positive) or subtract (negative)
            transaction_type: Type of transaction (deposit, withdraw, payment, etc)
            description: Transaction description
        """
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                # Get current balance
                cursor.execute("""
                    SELECT wallet_id, balance FROM wallets 
                    WHERE wallet_address = ? AND is_active = 1
                """, (wallet_address,))
                
                row = cursor.fetchone()
                if not row:
                    logger.warning(f"⚠️ Wallet not found: {wallet_address}")
                    return False
                
                wallet_id = row['wallet_id']
                current_balance = Decimal(row['balance'])
                amount_decimal = Decimal(str(amount)).quantize(Decimal('0.01'))
                new_balance = current_balance + amount_decimal
                
                # Prevent negative balance
                if new_balance < 0:
                    logger.warning(f"⚠️ Insufficient balance for {wallet_address}")
                    return False
                
                # Update balance
                now = datetime.now().isoformat()
                cursor.execute("""
                    UPDATE wallets 
                    SET balance = ?, updated_at = ?
                    WHERE wallet_address = ?
                """, (str(new_balance), now, wallet_address))
                
                # Log transaction
                self._insert_transaction(
                    cursor, wallet_id, transaction_type, 
                    str(amount_decimal), description, now
                )
                
                conn.commit()
                logger.info(f"✅ Updated balance for {wallet_address}: {current_balance} -> {new_balance}")
                return True
                
        except Exception as e:
            logger.error(f"❌ Error updating balance: {str(e)}")
            return False
    
    def get_transactions(
        self, 
        wallet_address: str, 
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get transaction history for a wallet"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                # Get wallet_id first
                cursor.execute("""
                    SELECT wallet_id FROM wallets 
                    WHERE wallet_address = ?
                """, (wallet_address,))
                
                row = cursor.fetchone()
                if not row:
                    return []
                
                wallet_id = row['wallet_id']
                
                # Get transactions
                cursor.execute("""
                    SELECT * FROM wallet_transactions 
                    WHERE wallet_id = ?
                    ORDER BY created_at DESC
                    LIMIT ?
                """, (wallet_id, limit))
                
                transactions = []
                for row in cursor.fetchall():
                    transactions.append({
                        "transaction_id": row['transaction_id'],
                        "type": row['type'],
                        "amount": row['amount'],
                        "description": row['description'],
                        "created_at": row['created_at']
                    })
                
                return transactions
                
        except Exception as e:
            logger.error(f"❌ Error getting transactions: {str(e)}")
            return []
    
    def deactivate_wallet(self, wallet_address: str) -> bool:
        """Deactivate a wallet (soft delete)"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                now = datetime.now().isoformat()
                
                cursor.execute("""
                    UPDATE wallets 
                    SET is_active = 0, updated_at = ?
                    WHERE wallet_address = ?
                """, (now, wallet_address))
                
                conn.commit()
                logger.info(f"✅ Deactivated wallet {wallet_address}")
                return True
                
        except Exception as e:
            logger.error(f"❌ Error deactivating wallet: {str(e)}")
            return False
    
    def count_user_wallets(self, user_address: str) -> int:
        """Count active wallets for a user"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT COUNT(*) as count FROM wallets 
                    WHERE user_address = ? AND is_active = 1
                """, (user_address,))
                
                row = cursor.fetchone()
                return row['count'] if row else 0
                
        except Exception as e:
            logger.error(f"❌ Error counting wallets: {str(e)}")
            return 0
    
    def delete_wallet(self, wallet_address: str) -> bool:
        """
        Permanently delete a wallet and all its transactions (hard delete).
        This will test cascade deletion of transactions.
        
        Args:
            wallet_address: GigChain wallet address to delete
            
        Returns:
            True if deleted successfully, False otherwise
        """
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                # Get wallet_id first
                cursor.execute("""
                    SELECT wallet_id FROM wallets 
                    WHERE wallet_address = ?
                """, (wallet_address,))
                
                row = cursor.fetchone()
                if not row:
                    logger.warning(f"⚠️ Wallet not found for deletion: {wallet_address}")
                    return False
                
                wallet_id = row['wallet_id']
                
                # Count transactions before deletion
                cursor.execute("""
                    SELECT COUNT(*) as count FROM wallet_transactions 
                    WHERE wallet_id = ?
                """, (wallet_id,))
                
                transaction_count = cursor.fetchone()['count']
                
                # Delete wallet (transactions will cascade due to foreign key constraint)
                cursor.execute("""
                    DELETE FROM wallets WHERE wallet_address = ?
                """, (wallet_address,))
                
                # Verify transactions were also deleted
                cursor.execute("""
                    SELECT COUNT(*) as count FROM wallet_transactions 
                    WHERE wallet_id = ?
                """, (wallet_id,))
                
                remaining_transactions = cursor.fetchone()['count']
                
                conn.commit()
                logger.info(f"✅ Deleted wallet {wallet_address} and {transaction_count} transactions")
                
                # Verify cascade deletion worked
                if remaining_transactions == 0:
                    logger.info(f"✅ Cascade deletion verified: {transaction_count} transactions deleted")
                    return True
                else:
                    logger.error(f"❌ Cascade deletion failed: {remaining_transactions} transactions remain")
                    return False
                
        except Exception as e:
            logger.error(f"❌ Error deleting wallet: {str(e)}")
            return False


# Singleton instance
_wallet_manager = None

def get_wallet_manager() -> WalletManager:
    """Get or create wallet manager singleton"""
    global _wallet_manager
    if _wallet_manager is None:
        _wallet_manager = WalletManager()
    return _wallet_manager

