"""
Wallet Database Schema and Operations
======================================

Persistent storage for internal and external wallets.
"""

import sqlite3
import json
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class WalletDatabase:
    """Database for wallet storage and management."""
    
    def __init__(self, db_path: str = "data/wallets.db"):
        """
        Initialize wallet database.
        
        Args:
            db_path: Path to SQLite database file
        """
        self.db_path = db_path
        self._initialize_schema()
        
        logger.info(f"💾 Wallet database initialized: {db_path}")
    
    def _initialize_schema(self):
        """Create database schema if not exists."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Internal wallets table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS internal_wallets (
                wallet_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL UNIQUE,
                address TEXT NOT NULL UNIQUE,
                encrypted_private_key TEXT NOT NULL,
                encrypted_mnemonic TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                metadata TEXT,
                UNIQUE(user_id)
            )
        """)
        
        # External wallet links table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS external_wallet_links (
                link_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                internal_wallet_address TEXT NOT NULL,
                external_address TEXT NOT NULL,
                linked_at TIMESTAMP NOT NULL,
                verified BOOLEAN DEFAULT 0,
                verification_signature TEXT,
                is_professional BOOLEAN DEFAULT 0,
                is_active BOOLEAN DEFAULT 1,
                metadata TEXT,
                UNIQUE(user_id, external_address)
            )
        """)
        
        # Transaction records table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transaction_records (
                record_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                wallet_address TEXT NOT NULL,
                transaction_type TEXT NOT NULL,
                amount REAL NOT NULL,
                currency TEXT NOT NULL,
                contract_id TEXT,
                external_tx_hash TEXT,
                status TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL,
                confirmed_at TIMESTAMP,
                metadata TEXT
            )
        """)
        
        # Indexes for performance
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_internal_wallets_user_id
            ON internal_wallets(user_id)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_external_links_user_id
            ON external_wallet_links(user_id)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_transaction_records_user_id
            ON transaction_records(user_id)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_transaction_records_contract_id
            ON transaction_records(contract_id)
        """)
        
        conn.commit()
        conn.close()
        
        logger.info("✅ Wallet database schema initialized")
    
    # ==================== Internal Wallets ====================
    
    def save_internal_wallet(self, wallet_data: Dict[str, Any]) -> bool:
        """Save internal wallet to database."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO internal_wallets
                (wallet_id, user_id, address, encrypted_private_key, encrypted_mnemonic,
                 created_at, is_active, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                wallet_data["wallet_id"],
                wallet_data["user_id"],
                wallet_data["address"],
                wallet_data["encrypted_private_key"],
                wallet_data["encrypted_mnemonic"],
                wallet_data["created_at"],
                wallet_data["is_active"],
                json.dumps(wallet_data.get("metadata", {}))
            ))
            
            conn.commit()
            conn.close()
            
            logger.info(f"✅ Internal wallet saved: {wallet_data['wallet_id']}")
            return True
            
        except sqlite3.IntegrityError as e:
            logger.error(f"❌ Wallet already exists: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"❌ Failed to save wallet: {str(e)}")
            return False
    
    def get_internal_wallet_by_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get internal wallet for user."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM internal_wallets
            WHERE user_id = ? AND is_active = 1
        """, (user_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return dict(row)
        return None
    
    def get_internal_wallet_by_address(self, address: str) -> Optional[Dict[str, Any]]:
        """Get internal wallet by address."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM internal_wallets
            WHERE LOWER(address) = LOWER(?) AND is_active = 1
        """, (address,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return dict(row)
        return None
    
    # ==================== External Wallets ====================
    
    def save_external_link(self, link_data: Dict[str, Any]) -> bool:
        """Save external wallet link."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO external_wallet_links
                (link_id, user_id, internal_wallet_address, external_address,
                 linked_at, verified, verification_signature, is_professional,
                 is_active, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                link_data["link_id"],
                link_data["user_id"],
                link_data["internal_wallet_address"],
                link_data["external_address"],
                link_data["linked_at"],
                link_data["verified"],
                link_data.get("verification_signature"),
                link_data["is_professional"],
                link_data["is_active"],
                json.dumps(link_data.get("metadata", {}))
            ))
            
            conn.commit()
            conn.close()
            
            logger.info(f"✅ External link saved: {link_data['link_id']}")
            return True
            
        except sqlite3.IntegrityError as e:
            logger.error(f"❌ Link already exists: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"❌ Failed to save link: {str(e)}")
            return False
    
    def get_external_links_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all external wallet links for user."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM external_wallet_links
            WHERE user_id = ? AND is_active = 1
            ORDER BY linked_at DESC
        """, (user_id,))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    # ==================== Transaction Records ====================
    
    def save_transaction_record(self, record_data: Dict[str, Any]) -> bool:
        """Save transaction record."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO transaction_records
                (record_id, user_id, wallet_address, transaction_type, amount,
                 currency, contract_id, external_tx_hash, status, created_at,
                 confirmed_at, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                record_data["record_id"],
                record_data["user_id"],
                record_data["wallet_address"],
                record_data["transaction_type"],
                record_data["amount"],
                record_data["currency"],
                record_data.get("contract_id"),
                record_data.get("external_tx_hash"),
                record_data["status"],
                record_data["created_at"],
                record_data.get("confirmed_at"),
                json.dumps(record_data.get("metadata", {}))
            ))
            
            conn.commit()
            conn.close()
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to save transaction record: {str(e)}")
            return False
    
    def get_transaction_records(
        self,
        user_id: Optional[str] = None,
        contract_id: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get transaction records."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        query = "SELECT * FROM transaction_records WHERE 1=1"
        params = []
        
        if user_id:
            query += " AND user_id = ?"
            params.append(user_id)
        
        if contract_id:
            query += " AND contract_id = ?"
            params.append(contract_id)
        
        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)
        
        cursor.execute(query, params)
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]


# Singleton
_wallet_db: Optional[WalletDatabase] = None


def get_wallet_db(db_path: str = "data/wallets.db") -> WalletDatabase:
    """Get or create wallet database singleton."""
    global _wallet_db
    
    if _wallet_db is None:
        _wallet_db = WalletDatabase(db_path)
    
    return _wallet_db


__all__ = ['WalletDatabase', 'get_wallet_db']
