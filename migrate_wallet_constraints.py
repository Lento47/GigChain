#!/usr/bin/env python3
"""
Migration script to update wallet constraints for multiple wallets per user support.

This script:
1. Removes the UNIQUE(user_address) constraint
2. Adds UNIQUE(user_address, name) constraint
3. Updates existing wallets to have unique names if needed
4. Provides rollback capability

Usage:
    python migrate_wallet_constraints.py --db-path gigchain_wallets.db
    python migrate_wallet_constraints.py --db-path gigchain_wallets.db --rollback
"""

import sqlite3
import argparse
import logging
from datetime import datetime
from typing import List, Tuple, Optional

logger = logging.getLogger(__name__)

class WalletConstraintMigration:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.backup_path = f"{db_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    def backup_database(self) -> bool:
        """Create a backup of the database before migration"""
        try:
            import shutil
            shutil.copy2(self.db_path, self.backup_path)
            logger.info(f"✅ Database backed up to: {self.backup_path}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to backup database: {e}")
            return False
    
    def check_current_constraints(self) -> List[str]:
        """Check current constraints on the wallets table"""
        constraints = []
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("PRAGMA table_info(wallets)")
                columns = cursor.fetchall()
                
                # Get table schema
                cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='wallets'")
                schema = cursor.fetchone()
                if schema:
                    schema_sql = schema[0]
                    if "UNIQUE(user_address)" in schema_sql:
                        constraints.append("UNIQUE(user_address)")
                    if "UNIQUE(user_address, name)" in schema_sql:
                        constraints.append("UNIQUE(user_address, name)")
                
                logger.info(f"Current constraints: {constraints}")
                return constraints
        except Exception as e:
            logger.error(f"❌ Error checking constraints: {e}")
            return []
    
    def get_duplicate_wallets(self) -> List[Tuple[str, str]]:
        """Get wallets that would have duplicate names after migration"""
        duplicates = []
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT user_address, name, COUNT(*) as count
                    FROM wallets 
                    WHERE is_active = 1
                    GROUP BY user_address, name
                    HAVING COUNT(*) > 1
                """)
                duplicates = cursor.fetchall()
                logger.info(f"Found {len(duplicates)} duplicate wallet name groups")
                return duplicates
        except Exception as e:
            logger.error(f"❌ Error checking duplicates: {e}")
            return []
    
    def rename_duplicate_wallets(self) -> bool:
        """Rename duplicate wallet names to make them unique"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Get all wallets grouped by user_address and name
                cursor.execute("""
                    SELECT user_address, name, wallet_id, created_at
                    FROM wallets 
                    WHERE is_active = 1
                    ORDER BY user_address, name, created_at
                """)
                
                wallets = cursor.fetchall()
                name_counts = {}
                updates_made = 0
                
                for user_address, name, wallet_id, created_at in wallets:
                    key = f"{user_address}:{name}"
                    
                    if key in name_counts:
                        name_counts[key] += 1
                        new_name = f"{name} ({name_counts[key]})"
                        
                        cursor.execute("""
                            UPDATE wallets 
                            SET name = ?, updated_at = ?
                            WHERE wallet_id = ?
                        """, (new_name, datetime.now().isoformat(), wallet_id))
                        
                        updates_made += 1
                        logger.info(f"Renamed wallet {wallet_id} to '{new_name}'")
                    else:
                        name_counts[key] = 1
                
                conn.commit()
                logger.info(f"✅ Renamed {updates_made} duplicate wallet names")
                return True
                
        except Exception as e:
            logger.error(f"❌ Error renaming duplicate wallets: {e}")
            return False
    
    def migrate_constraints(self) -> bool:
        """Migrate the database constraints"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Step 1: Create new table with updated constraints
                cursor.execute("""
                    CREATE TABLE wallets_new (
                        wallet_id TEXT PRIMARY KEY,
                        wallet_address TEXT UNIQUE NOT NULL,
                        user_address TEXT NOT NULL,
                        name TEXT NOT NULL,
                        balance REAL DEFAULT 0.0,
                        currency TEXT DEFAULT 'GIG',
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL,
                        is_active INTEGER DEFAULT 1,
                        UNIQUE(user_address, name)
                    )
                """)
                
                # Step 2: Copy data from old table
                cursor.execute("""
                    INSERT INTO wallets_new 
                    SELECT * FROM wallets
                """)
                
                # Step 3: Drop old table
                cursor.execute("DROP TABLE wallets")
                
                # Step 4: Rename new table
                cursor.execute("ALTER TABLE wallets_new RENAME TO wallets")
                
                # Step 5: Recreate indexes
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_user_address 
                    ON wallets(user_address)
                """)
                
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_wallet_transactions 
                    ON wallet_transactions(wallet_id, created_at)
                """)
                
                conn.commit()
                logger.info("✅ Successfully migrated wallet constraints")
                return True
                
        except Exception as e:
            logger.error(f"❌ Error migrating constraints: {e}")
            return False
    
    def rollback_migration(self) -> bool:
        """Rollback the migration using the backup"""
        try:
            import shutil
            shutil.copy2(self.backup_path, self.db_path)
            logger.info(f"✅ Rolled back to backup: {self.backup_path}")
            return True
        except Exception as e:
            logger.error(f"❌ Error rolling back migration: {e}")
            return False
    
    def run_migration(self) -> bool:
        """Run the complete migration process"""
        logger.info("🚀 Starting wallet constraint migration...")
        
        # Check current state
        constraints = self.check_current_constraints()
        if "UNIQUE(user_address, name)" in constraints:
            logger.info("✅ Migration already applied - constraints are up to date")
            return True
        
        # Create backup
        if not self.backup_database():
            logger.error("❌ Failed to create backup - aborting migration")
            return False
        
        # Check for duplicates
        duplicates = self.get_duplicate_wallets()
        if duplicates:
            logger.warning(f"⚠️ Found {len(duplicates)} duplicate wallet name groups")
            if not self.rename_duplicate_wallets():
                logger.error("❌ Failed to rename duplicate wallets - aborting migration")
                return False
        
        # Run migration
        if not self.migrate_constraints():
            logger.error("❌ Migration failed - check backup for rollback")
            return False
        
        logger.info("✅ Migration completed successfully!")
        logger.info(f"📁 Backup available at: {self.backup_path}")
        return True

def main():
    parser = argparse.ArgumentParser(description="Migrate wallet constraints for multiple wallets per user")
    parser.add_argument("--db-path", default="gigchain_wallets.db", help="Path to wallet database")
    parser.add_argument("--rollback", action="store_true", help="Rollback to previous state")
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose logging")
    
    args = parser.parse_args()
    
    # Setup logging
    level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    migration = WalletConstraintMigration(args.db_path)
    
    if args.rollback:
        success = migration.rollback_migration()
    else:
        success = migration.run_migration()
    
    if success:
        logger.info("🎉 Operation completed successfully!")
        exit(0)
    else:
        logger.error("💥 Operation failed!")
        exit(1)

if __name__ == "__main__":
    main()
