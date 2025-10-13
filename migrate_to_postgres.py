"""
GigChain.io - Database Migration Script
Migrate from SQLite to PostgreSQL for production scalability.
"""

import sqlite3
import psycopg2
from psycopg2 import sql
import os
import sys
import re
from datetime import datetime
from typing import List, Dict, Any
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseMigration:
    """Migrate GigChain from SQLite to PostgreSQL."""
    
    def __init__(self, sqlite_db: str, postgres_url: str):
        self.sqlite_db = sqlite_db
        self.postgres_url = postgres_url
        self.tables_migrated = 0
        self.rows_migrated = 0
    
    def connect_sqlite(self):
        """Connect to SQLite database."""
        return sqlite3.connect(self.sqlite_db)
    
    def connect_postgres(self):
        """Connect to PostgreSQL database."""
        return psycopg2.connect(self.postgres_url)
    
    def get_sqlite_tables(self, conn) -> List[str]:
        """Get list of tables from SQLite."""
        cursor = conn.cursor()
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
        """)
        return [row[0] for row in cursor.fetchall()]
    
    def get_table_schema(self, conn, table_name: str) -> str:
        """Get CREATE TABLE statement from SQLite."""
        cursor = conn.cursor()
        # Validate table name first
        if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', table_name):
            raise ValueError(f"Invalid table name: {table_name}")
        cursor.execute(f"SELECT sql FROM sqlite_master WHERE type='table' AND name='{table_name}'")
        result = cursor.fetchone()
        return result[0] if result else None
    
    def adapt_schema_for_postgres(self, sqlite_schema: str) -> str:
        """Convert SQLite schema to PostgreSQL."""
        # Replace SQLite types with PostgreSQL types
        schema = sqlite_schema
        
        # AUTOINCREMENT → SERIAL
        schema = schema.replace('INTEGER PRIMARY KEY AUTOINCREMENT', 'SERIAL PRIMARY KEY')
        schema = schema.replace('AUTOINCREMENT', 'SERIAL')
        
        # TEXT → VARCHAR or TEXT (PostgreSQL supports both)
        # No change needed, TEXT works in both
        
        # INTEGER → INT
        schema = schema.replace('INTEGER DEFAULT', 'INT DEFAULT')
        schema = schema.replace('INTEGER NOT NULL', 'INT NOT NULL')
        schema = schema.replace('INTEGER,', 'INT,')
        
        # REAL → NUMERIC or FLOAT
        schema = schema.replace('REAL', 'NUMERIC')
        
        # Remove IF NOT EXISTS for initial creation
        schema = schema.replace('IF NOT EXISTS', '')
        
        # Fix datetime functions
        schema = schema.replace("DEFAULT CURRENT_TIMESTAMP", "DEFAULT NOW()")
        schema = schema.replace("datetime('now')", "NOW()")
        
        return schema
    
    def create_postgres_table(self, pg_conn, table_name: str, schema: str):
        """Create table in PostgreSQL."""
        cursor = pg_conn.cursor()
        
        # Drop table if exists
        # Table names cannot be parameterized, so we validate the name first
        if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', table_name):
            raise ValueError(f"Invalid table name: {table_name}")
        cursor.execute(f"DROP TABLE IF EXISTS {table_name} CASCADE")
        
        # Create table
        pg_schema = self.adapt_schema_for_postgres(schema)
        cursor.execute(pg_schema)
        
        pg_conn.commit()
        logger.info(f"✅ Created table: {table_name}")
    
    def migrate_table_data(self, sqlite_conn, pg_conn, table_name: str):
        """Migrate data from SQLite table to PostgreSQL."""
        # Get column names
        sqlite_cursor = sqlite_conn.cursor()
        # Validate table name first
        if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', table_name):
            raise ValueError(f"Invalid table name: {table_name}")
        sqlite_cursor.execute(f"PRAGMA table_info({table_name})")
        columns = [row[1] for row in sqlite_cursor.fetchall()]
        
        # Get data from SQLite
        sqlite_cursor.execute(f"SELECT * FROM {table_name}")
        rows = sqlite_cursor.fetchall()
        
        if not rows:
            logger.info(f"  ℹ️  Table {table_name} is empty, skipping data migration")
            return 0
        
        # Insert into PostgreSQL
        pg_cursor = pg_conn.cursor()
        
        # Build INSERT query
        columns_str = ', '.join(columns)
        placeholders = ', '.join(['%s'] * len(columns))
        insert_query = f"INSERT INTO {table_name} ({columns_str}) VALUES ({placeholders})"
        
        # Batch insert
        rows_inserted = 0
        for row in rows:
            try:
                pg_cursor.execute(insert_query, row)
                rows_inserted += 1
            except (psycopg2.IntegrityError, psycopg2.DataError, psycopg2.ProgrammingError) as e:
                logger.warning(f"  ⚠️  Database error inserting row into {table_name}: {str(e)}")
                continue
            except (ValueError, TypeError) as e:
                logger.warning(f"  ⚠️  Data type error inserting row into {table_name}: {str(e)}")
                continue
            except Exception as e:
                logger.error(f"  ❌ Unexpected error inserting row into {table_name}: {str(e)}")
                continue
        
        pg_conn.commit()
        logger.info(f"  ✅ Migrated {rows_inserted} rows from {table_name}")
        
        return rows_inserted
    
    def fix_sequences(self, pg_conn, table_name: str):
        """Fix PostgreSQL sequences after data migration."""
        cursor = pg_conn.cursor()
        
        # Get columns with SERIAL type
        cursor.execute(f"""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = '{table_name}'
            AND column_default LIKE 'nextval%'
        """)
        
        serial_columns = [row[0] for row in cursor.fetchall()]
        
        for column in serial_columns:
            try:
                # Reset sequence to max value
                cursor.execute(f"""
                    SELECT setval(
                        pg_get_serial_sequence('{table_name}', '{column}'),
                        COALESCE((SELECT MAX({column}) FROM {table_name}), 1),
                        true
                    )
                """)
                pg_conn.commit()
                logger.info(f"  ✅ Fixed sequence for {table_name}.{column}")
            except (psycopg2.ProgrammingError, psycopg2.OperationalError) as e:
                logger.warning(f"  ⚠️  Database error fixing sequence for {table_name}.{column}: {str(e)}")
            except Exception as e:
                logger.error(f"  ❌ Unexpected error fixing sequence for {table_name}.{column}: {str(e)}")
    
    def migrate_database(self, database_name: str):
        """Migrate a complete database."""
        logger.info(f"\n{'='*60}")
        logger.info(f"Starting migration: {database_name}")
        logger.info(f"{'='*60}\n")
        
        # Connect to databases
        sqlite_conn = self.connect_sqlite()
        pg_conn = self.connect_postgres()
        
        try:
            # Get list of tables
            tables = self.get_sqlite_tables(sqlite_conn)
            logger.info(f"📋 Found {len(tables)} tables to migrate\n")
            
            # Migrate each table
            for table in tables:
                logger.info(f"🔄 Migrating table: {table}")
                
                # Get schema
                schema = self.get_table_schema(sqlite_conn, table)
                if not schema:
                    logger.warning(f"  ⚠️  Could not get schema for {table}, skipping")
                    continue
                
                # Create table in PostgreSQL
                self.create_postgres_table(pg_conn, table, schema)
                
                # Migrate data
                rows = self.migrate_table_data(sqlite_conn, pg_conn, table)
                self.rows_migrated += rows
                
                # Fix sequences
                self.fix_sequences(pg_conn, table)
                
                self.tables_migrated += 1
                logger.info(f"  ✅ Completed: {table}\n")
            
            logger.info(f"\n{'='*60}")
            logger.info(f"✅ Migration completed successfully!")
            logger.info(f"{'='*60}")
            logger.info(f"Tables migrated: {self.tables_migrated}")
            logger.info(f"Rows migrated: {self.rows_migrated}")
            logger.info(f"{'='*60}\n")
            
        except (psycopg2.OperationalError, psycopg2.ProgrammingError) as e:
            logger.error(f"❌ Database migration failed: {str(e)}")
            pg_conn.rollback()
            raise
        except (sqlite3.OperationalError, sqlite3.ProgrammingError) as e:
            logger.error(f"❌ SQLite migration failed: {str(e)}")
            pg_conn.rollback()
            raise
        except Exception as e:
            logger.error(f"❌ Unexpected migration error: {str(e)}")
            pg_conn.rollback()
            raise
        
        finally:
            sqlite_conn.close()
            pg_conn.close()
    
    def verify_migration(self):
        """Verify migration was successful."""
        logger.info("\n🔍 Verifying migration...\n")
        
        sqlite_conn = self.connect_sqlite()
        pg_conn = self.connect_postgres()
        
        try:
            tables = self.get_sqlite_tables(sqlite_conn)
            
            for table in tables:
                # Count rows in SQLite
                sqlite_cursor = sqlite_conn.cursor()
                # Validate table name first
                if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', table):
                    raise ValueError(f"Invalid table name: {table}")
                sqlite_cursor.execute(f"SELECT COUNT(*) FROM {table}")
                sqlite_count = sqlite_cursor.fetchone()[0]
                
                # Count rows in PostgreSQL
                pg_cursor = pg_conn.cursor()
                # Validate table name first
                if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', table):
                    raise ValueError(f"Invalid table name: {table}")
                pg_cursor.execute(f"SELECT COUNT(*) FROM {table}")
                pg_count = pg_cursor.fetchone()[0]
                
                if sqlite_count == pg_count:
                    logger.info(f"✅ {table}: {pg_count} rows (match)")
                else:
                    logger.warning(f"⚠️  {table}: SQLite={sqlite_count}, PostgreSQL={pg_count} (mismatch)")
            
            logger.info("\n✅ Verification completed\n")
            
        finally:
            sqlite_conn.close()
            pg_conn.close()

def main():
    """Main migration script."""
    print("\n" + "="*60)
    print("  GigChain Database Migration: SQLite → PostgreSQL")
    print("="*60 + "\n")
    
    # Get database paths from environment or arguments
    sqlite_dbs = [
        ('analytics.db', 'Analytics'),
        ('admin.db', 'Admin'),
        ('wcsap_auth.db', 'Authentication')
    ]
    
    postgres_url = os.getenv('DATABASE_URL') or os.getenv('POSTGRES_URL')
    
    if not postgres_url:
        print("❌ Error: PostgreSQL URL not found!")
        print("\nPlease set one of these environment variables:")
        print("  - DATABASE_URL")
        print("  - POSTGRES_URL")
        print("\nExample:")
        print("  export DATABASE_URL='postgresql://user:password@localhost:5432/gigchain'")
        print()
        sys.exit(1)
    
    print(f"📊 Migrating to PostgreSQL: {postgres_url.split('@')[1] if '@' in postgres_url else postgres_url}\n")
    
    # Confirm migration
    response = input("⚠️  This will overwrite existing PostgreSQL data. Continue? (yes/no): ")
    if response.lower() != 'yes':
        print("\n❌ Migration cancelled\n")
        sys.exit(0)
    
    # Migrate each database
    total_tables = 0
    total_rows = 0
    
    for db_file, db_name in sqlite_dbs:
        if not os.path.exists(db_file):
            print(f"⚠️  {db_file} not found, skipping {db_name} database\n")
            continue
        
        # Create separate PostgreSQL database for each (or use schemas)
        migration = DatabaseMigration(db_file, postgres_url)
        migration.migrate_database(db_name)
        
        total_tables += migration.tables_migrated
        total_rows += migration.rows_migrated
        
        # Verify
        migration.verify_migration()
    
    print("\n" + "="*60)
    print("  🎉 MIGRATION COMPLETE!")
    print("="*60)
    print(f"Total databases: 3")
    print(f"Total tables: {total_tables}")
    print(f"Total rows: {total_rows}")
    print("="*60 + "\n")
    
    print("📝 Next steps:")
    print("  1. Update your .env file:")
    print("     DATABASE_TYPE=postgresql")
    print("     DATABASE_URL=your_postgres_url")
    print("  2. Restart your application:")
    print("     python3 main.py")
    print("  3. Test all functionality")
    print("  4. Keep SQLite backup for safety")
    print()

if __name__ == "__main__":
    main()
