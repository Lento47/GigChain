"""
Token Database Operations
Handles all database operations for GigSoul (GSL) token system
"""

import sqlite3
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from token_system import (
    TokenWallet, TokenTransaction, TransactionType,
    TokenRewardCalculator, TaskComplexity
)


class TokenDatabase:
    """Database operations for token system"""
    
    def __init__(self, db_path: str = "gigchain.db"):
        self.db_path = db_path
        self._initialize_schema()
    
    def get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def _initialize_schema(self):
        """Initialize token system tables"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Token Wallets Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS token_wallets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT UNIQUE NOT NULL,
                wallet_address TEXT NOT NULL,
                balance REAL DEFAULT 0.0 CHECK(balance >= 0),
                total_earned REAL DEFAULT 0.0,
                total_spent REAL DEFAULT 0.0,
                total_transferred_out REAL DEFAULT 0.0,
                total_transferred_in REAL DEFAULT 0.0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (user_id) REFERENCES user_stats(user_id)
            )
        """)
        
        # Token Transactions Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS token_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transaction_id TEXT UNIQUE NOT NULL,
                user_id TEXT NOT NULL,
                transaction_type TEXT NOT NULL CHECK(transaction_type IN (
                    'reward', 'transfer', 'receive', 'buy', 'sell', 'bonus', 'penalty'
                )),
                amount REAL NOT NULL,
                balance_before REAL NOT NULL,
                balance_after REAL NOT NULL,
                description TEXT NOT NULL,
                related_contract_id TEXT,
                related_user_id TEXT,
                metadata_json TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (user_id) REFERENCES user_stats(user_id),
                FOREIGN KEY (related_contract_id) REFERENCES contracts(contract_id)
            )
        """)
        
        # Token Transfers Table (for transfer tracking)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS token_transfers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transfer_id TEXT UNIQUE NOT NULL,
                from_user_id TEXT NOT NULL,
                to_user_id TEXT NOT NULL,
                amount REAL NOT NULL,
                fee REAL NOT NULL,
                status TEXT NOT NULL CHECK(status IN ('pending', 'completed', 'failed')),
                failure_reason TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME,
                
                FOREIGN KEY (from_user_id) REFERENCES user_stats(user_id),
                FOREIGN KEY (to_user_id) REFERENCES user_stats(user_id)
            )
        """)
        
        # Token Market Transactions (buy/sell)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS token_market_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transaction_id TEXT UNIQUE NOT NULL,
                user_id TEXT NOT NULL,
                transaction_type TEXT NOT NULL CHECK(transaction_type IN ('buy', 'sell')),
                gsl_amount REAL NOT NULL,
                usd_amount REAL NOT NULL,
                fee_amount REAL NOT NULL,
                exchange_rate REAL NOT NULL,
                payment_method TEXT,
                payment_status TEXT CHECK(payment_status IN ('pending', 'completed', 'failed', 'refunded')),
                payment_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME,
                
                FOREIGN KEY (user_id) REFERENCES user_stats(user_id)
            )
        """)
        
        # Token Rewards Table (contract completion rewards)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS token_rewards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                reward_id TEXT UNIQUE NOT NULL,
                user_id TEXT NOT NULL,
                contract_id TEXT NOT NULL,
                contract_value_usd REAL NOT NULL,
                gsl_reward REAL NOT NULL,
                complexity_level TEXT NOT NULL,
                rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
                was_on_time BOOLEAN NOT NULL,
                days_early_or_late INTEGER DEFAULT 0,
                user_level INTEGER NOT NULL,
                trust_score REAL NOT NULL,
                breakdown_json TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (user_id) REFERENCES user_stats(user_id),
                FOREIGN KEY (contract_id) REFERENCES contracts(contract_id)
            )
        """)
        
        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_token_wallets_user ON token_wallets(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_token_transactions_user ON token_transactions(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_token_transactions_type ON token_transactions(transaction_type)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_token_transactions_created ON token_transactions(created_at)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_token_transfers_from ON token_transfers(from_user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_token_transfers_to ON token_transfers(to_user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_token_rewards_user ON token_rewards(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_token_rewards_contract ON token_rewards(contract_id)")
        
        conn.commit()
        conn.close()
    
    # ============================================================================
    # WALLET OPERATIONS
    # ============================================================================
    
    def get_or_create_wallet(self, user_id: str, wallet_address: str) -> TokenWallet:
        """Get wallet or create if doesn't exist"""
        wallet = self.get_wallet(user_id)
        if wallet:
            return wallet
        
        return self.create_wallet(user_id, wallet_address)
    
    def get_wallet(self, user_id: str) -> Optional[TokenWallet]:
        """Get user's token wallet"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM token_wallets WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return None
        
        return TokenWallet(
            user_id=row["user_id"],
            wallet_address=row["wallet_address"],
            balance=row["balance"],
            total_earned=row["total_earned"],
            total_spent=row["total_spent"],
            total_transferred_out=row["total_transferred_out"],
            total_transferred_in=row["total_transferred_in"],
            created_at=datetime.fromisoformat(row["created_at"]),
            updated_at=datetime.fromisoformat(row["updated_at"])
        )
    
    def create_wallet(self, user_id: str, wallet_address: str) -> TokenWallet:
        """Create new token wallet"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO token_wallets (user_id, wallet_address)
            VALUES (?, ?)
        """, (user_id, wallet_address))
        
        conn.commit()
        conn.close()
        
        return self.get_wallet(user_id)
    
    def update_wallet(self, wallet: TokenWallet):
        """Update wallet in database"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE token_wallets
            SET balance = ?,
                total_earned = ?,
                total_spent = ?,
                total_transferred_out = ?,
                total_transferred_in = ?,
                updated_at = ?
            WHERE user_id = ?
        """, (
            wallet.balance,
            wallet.total_earned,
            wallet.total_spent,
            wallet.total_transferred_out,
            wallet.total_transferred_in,
            datetime.now().isoformat(),
            wallet.user_id
        ))
        
        conn.commit()
        conn.close()
    
    # ============================================================================
    # TRANSACTION OPERATIONS
    # ============================================================================
    
    def create_transaction(self, transaction: TokenTransaction) -> str:
        """Create new transaction record"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO token_transactions (
                transaction_id, user_id, transaction_type, amount,
                balance_before, balance_after, description,
                related_contract_id, related_user_id, metadata_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            transaction.transaction_id,
            transaction.user_id,
            transaction.transaction_type.value,
            transaction.amount,
            transaction.balance_before,
            transaction.balance_after,
            transaction.description,
            transaction.related_contract_id,
            transaction.related_user_id,
            json.dumps(transaction.metadata) if transaction.metadata else None
        ))
        
        conn.commit()
        conn.close()
        
        return transaction.transaction_id
    
    def get_transaction(self, transaction_id: str) -> Optional[TokenTransaction]:
        """Get transaction by ID"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM token_transactions WHERE transaction_id = ?", (transaction_id,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return None
        
        return self._row_to_transaction(row)
    
    def get_user_transactions(
        self,
        user_id: str,
        limit: int = 50,
        offset: int = 0,
        transaction_type: Optional[str] = None
    ) -> List[TokenTransaction]:
        """Get user's transaction history"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        if transaction_type:
            cursor.execute("""
                SELECT * FROM token_transactions
                WHERE user_id = ? AND transaction_type = ?
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            """, (user_id, transaction_type, limit, offset))
        else:
            cursor.execute("""
                SELECT * FROM token_transactions
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            """, (user_id, limit, offset))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [self._row_to_transaction(row) for row in rows]
    
    def _row_to_transaction(self, row) -> TokenTransaction:
        """Convert database row to TokenTransaction"""
        import json
        
        return TokenTransaction(
            transaction_id=row["transaction_id"],
            user_id=row["user_id"],
            transaction_type=TransactionType(row["transaction_type"]),
            amount=row["amount"],
            balance_before=row["balance_before"],
            balance_after=row["balance_after"],
            description=row["description"],
            related_contract_id=row["related_contract_id"],
            related_user_id=row["related_user_id"],
            metadata=json.loads(row["metadata_json"]) if row["metadata_json"] else {},
            created_at=datetime.fromisoformat(row["created_at"])
        )
    
    # ============================================================================
    # REWARD OPERATIONS
    # ============================================================================
    
    def create_reward_record(
        self,
        user_id: str,
        contract_id: str,
        contract_value: float,
        gsl_reward: float,
        complexity: TaskComplexity,
        rating: int,
        was_on_time: bool,
        days_early_or_late: int,
        user_level: int,
        trust_score: float,
        breakdown: Dict[str, Any]
    ) -> str:
        """Create reward record"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        reward_id = str(uuid.uuid4())
        
        cursor.execute("""
            INSERT INTO token_rewards (
                reward_id, user_id, contract_id, contract_value_usd, gsl_reward,
                complexity_level, rating, was_on_time, days_early_or_late,
                user_level, trust_score, breakdown_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            reward_id, user_id, contract_id, contract_value, gsl_reward,
            complexity.value, rating, was_on_time, days_early_or_late,
            user_level, trust_score, json.dumps(breakdown)
        ))
        
        conn.commit()
        conn.close()
        
        return reward_id
    
    def get_user_rewards(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get user's reward history"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM token_rewards
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        """, (user_id, limit))
        
        rows = cursor.fetchall()
        conn.close()
        
        rewards = []
        for row in rows:
            rewards.append({
                "reward_id": row["reward_id"],
                "contract_id": row["contract_id"],
                "contract_value_usd": row["contract_value_usd"],
                "gsl_reward": row["gsl_reward"],
                "complexity_level": row["complexity_level"],
                "rating": row["rating"],
                "was_on_time": bool(row["was_on_time"]),
                "days_early_or_late": row["days_early_or_late"],
                "breakdown": json.loads(row["breakdown_json"]),
                "created_at": row["created_at"]
            })
        
        return rewards
    
    # ============================================================================
    # TRANSFER OPERATIONS
    # ============================================================================
    
    def create_transfer_record(
        self,
        from_user_id: str,
        to_user_id: str,
        amount: float,
        fee: float
    ) -> str:
        """Create transfer record"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        transfer_id = str(uuid.uuid4())
        
        cursor.execute("""
            INSERT INTO token_transfers (
                transfer_id, from_user_id, to_user_id, amount, fee, status
            ) VALUES (?, ?, ?, ?, ?, 'pending')
        """, (transfer_id, from_user_id, to_user_id, amount, fee))
        
        conn.commit()
        conn.close()
        
        return transfer_id
    
    def complete_transfer(self, transfer_id: str):
        """Mark transfer as completed"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE token_transfers
            SET status = 'completed', completed_at = ?
            WHERE transfer_id = ?
        """, (datetime.now().isoformat(), transfer_id))
        
        conn.commit()
        conn.close()
    
    def fail_transfer(self, transfer_id: str, reason: str):
        """Mark transfer as failed"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE token_transfers
            SET status = 'failed', failure_reason = ?, completed_at = ?
            WHERE transfer_id = ?
        """, (reason, datetime.now().isoformat(), transfer_id))
        
        conn.commit()
        conn.close()
    
    # ============================================================================
    # STATISTICS
    # ============================================================================
    
    def get_token_statistics(self) -> Dict[str, Any]:
        """Get overall token system statistics"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Total wallets and supply
        cursor.execute("""
            SELECT 
                COUNT(*) as total_wallets,
                SUM(balance) as total_supply,
                SUM(total_earned) as total_earned,
                AVG(balance) as avg_balance,
                MAX(balance) as max_balance
            FROM token_wallets
        """)
        wallet_stats = cursor.fetchone()
        
        # Transaction counts
        cursor.execute("""
            SELECT 
                transaction_type,
                COUNT(*) as count,
                SUM(amount) as total_amount
            FROM token_transactions
            GROUP BY transaction_type
        """)
        transaction_stats = {row["transaction_type"]: {
            "count": row["count"],
            "total_amount": row["total_amount"]
        } for row in cursor.fetchall()}
        
        # Recent activity
        cursor.execute("""
            SELECT COUNT(*) as recent_transactions
            FROM token_transactions
            WHERE created_at >= datetime('now', '-24 hours')
        """)
        recent_activity = cursor.fetchone()["recent_transactions"]
        
        conn.close()
        
        return {
            "total_wallets": wallet_stats["total_wallets"],
            "total_supply": round(wallet_stats["total_supply"] or 0, 2),
            "total_earned": round(wallet_stats["total_earned"] or 0, 2),
            "avg_balance": round(wallet_stats["avg_balance"] or 0, 2),
            "max_balance": round(wallet_stats["max_balance"] or 0, 2),
            "transaction_stats": transaction_stats,
            "recent_transactions_24h": recent_activity
        }


# Singleton instance
token_db = TokenDatabase()


import json
