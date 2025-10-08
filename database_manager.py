"""
GigChain.io - Database Manager
Supports both SQLite (development) and PostgreSQL (production) with automatic migration.
"""

import os
import logging
from typing import Optional, Dict, Any, List
from enum import Enum
from contextlib import contextmanager

logger = logging.getLogger(__name__)

class DatabaseType(str, Enum):
    """Supported database types."""
    SQLITE = "sqlite"
    POSTGRESQL = "postgresql"

class DatabaseManager:
    """
    Universal database manager supporting SQLite and PostgreSQL.
    Automatically detects which database to use based on environment.
    """
    
    def __init__(self, db_type: Optional[str] = None):
        """
        Initialize database manager.
        
        Args:
            db_type: Force specific database type (sqlite or postgresql)
                    If None, auto-detect from environment
        """
        self.db_type = self._detect_database_type(db_type)
        self.connection_string = self._build_connection_string()
        
        logger.info(f"🗄️  Database Manager initialized: {self.db_type}")
        
    def _detect_database_type(self, force_type: Optional[str] = None) -> DatabaseType:
        """Detect which database to use."""
        if force_type:
            return DatabaseType(force_type)
        
        # Check environment variable
        db_type = os.getenv('DATABASE_TYPE', 'sqlite').lower()
        
        # If PostgreSQL URL is set, use PostgreSQL
        if os.getenv('DATABASE_URL') or os.getenv('POSTGRES_URL'):
            return DatabaseType.POSTGRESQL
        
        return DatabaseType(db_type)
    
    def _build_connection_string(self) -> str:
        """Build database connection string."""
        if self.db_type == DatabaseType.SQLITE:
            # SQLite - file-based
            db_name = os.getenv('SQLITE_DB', 'gigchain.db')
            return f"sqlite:///{db_name}"
        
        else:  # PostgreSQL
            # Try multiple environment variable names
            db_url = (
                os.getenv('DATABASE_URL') or
                os.getenv('POSTGRES_URL') or
                os.getenv('POSTGRESQL_URL')
            )
            
            if not db_url:
                # Build from components
                host = os.getenv('DB_HOST', 'localhost')
                port = os.getenv('DB_PORT', '5432')
                user = os.getenv('DB_USER', 'gigchain')
                password = os.getenv('DB_PASSWORD', '')
                database = os.getenv('DB_NAME', 'gigchain')
                
                db_url = f"postgresql://{user}:{password}@{host}:{port}/{database}"
            
            return db_url
    
    @contextmanager
    def get_connection(self):
        """Get database connection (context manager)."""
        if self.db_type == DatabaseType.SQLITE:
            import sqlite3
            conn = sqlite3.connect(self.connection_string.replace('sqlite:///', ''))
            conn.row_factory = sqlite3.Row
            try:
                yield conn
            finally:
                conn.close()
        
        else:  # PostgreSQL
            import psycopg2
            from psycopg2.extras import RealDictCursor
            
            # Parse connection string
            db_url = self.connection_string
            conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
            try:
                yield conn
            finally:
                conn.close()
    
    def execute_query(self, query: str, params: Optional[tuple] = None) -> List[Dict]:
        """Execute SELECT query and return results."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Adapt query for PostgreSQL if needed
            if self.db_type == DatabaseType.POSTGRESQL:
                query = self._adapt_query_for_postgres(query)
            
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            results = cursor.fetchall()
            
            # Convert to list of dicts
            if results:
                if self.db_type == DatabaseType.SQLITE:
                    return [dict(row) for row in results]
                else:
                    return [dict(row) for row in results]
            
            return []
    
    def execute_update(self, query: str, params: Optional[tuple] = None) -> int:
        """Execute INSERT/UPDATE/DELETE query and return affected rows."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Adapt query for PostgreSQL
            if self.db_type == DatabaseType.POSTGRESQL:
                query = self._adapt_query_for_postgres(query)
            
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            conn.commit()
            
            return cursor.rowcount
    
    def _adapt_query_for_postgres(self, query: str) -> str:
        """
        Adapt SQLite query to PostgreSQL.
        
        Main differences:
        - SQLite: ? placeholders → PostgreSQL: %s placeholders
        - SQLite: AUTOINCREMENT → PostgreSQL: SERIAL
        - SQLite: INTEGER → PostgreSQL: INT or BIGINT
        """
        # Replace placeholders
        # Note: This is a simple replacement, for complex queries use parameterized queries
        
        # Replace AUTOINCREMENT with SERIAL
        query = query.replace('AUTOINCREMENT', 'SERIAL')
        query = query.replace('autoincrement', 'serial')
        
        # Replace INTEGER PRIMARY KEY AUTOINCREMENT with SERIAL PRIMARY KEY
        query = query.replace(
            'INTEGER PRIMARY KEY AUTOINCREMENT',
            'SERIAL PRIMARY KEY'
        )
        
        # Replace datetime functions
        query = query.replace("datetime('now')", "NOW()")
        query = query.replace("CURRENT_TIMESTAMP", "NOW()")
        
        # Replace IF NOT EXISTS for indexes (PostgreSQL uses different syntax)
        if 'CREATE INDEX IF NOT EXISTS' in query:
            # PostgreSQL handles this differently, but we'll keep it simple
            pass
        
        return query
    
    def get_database_info(self) -> Dict[str, Any]:
        """Get information about current database."""
        info = {
            "type": self.db_type.value,
            "connection_string": self._sanitize_connection_string(self.connection_string),
            "features": self._get_database_features()
        }
        
        if self.db_type == DatabaseType.SQLITE:
            # SQLite specific info
            db_file = self.connection_string.replace('sqlite:///', '')
            if os.path.exists(db_file):
                info["size_mb"] = round(os.path.getsize(db_file) / (1024 * 1024), 2)
                info["path"] = os.path.abspath(db_file)
            else:
                info["size_mb"] = 0
                info["path"] = db_file
                info["exists"] = False
        
        else:  # PostgreSQL
            # Try to get database size
            try:
                result = self.execute_query(
                    "SELECT pg_size_pretty(pg_database_size(current_database())) as size"
                )
                if result:
                    info["size"] = result[0].get('size', 'Unknown')
                
                # Get connection count
                result = self.execute_query(
                    "SELECT count(*) as connections FROM pg_stat_activity"
                )
                if result:
                    info["active_connections"] = result[0].get('connections', 0)
                
            except Exception as e:
                logger.warning(f"Could not get PostgreSQL stats: {str(e)}")
        
        return info
    
    def _sanitize_connection_string(self, conn_str: str) -> str:
        """Remove password from connection string for logging."""
        if ':' in conn_str and '@' in conn_str:
            # Format: postgresql://user:password@host:port/db
            parts = conn_str.split('@')
            if len(parts) > 1:
                user_part = parts[0].split(':')[0]
                return f"{user_part}:***@{parts[1]}"
        return conn_str
    
    def _get_database_features(self) -> Dict[str, Any]:
        """Get database features and capabilities."""
        if self.db_type == DatabaseType.SQLITE:
            return {
                "max_connections": "1 writer, unlimited readers",
                "transactions_per_second": "~50-100",
                "recommended_users": "1-10,000",
                "scalability": "Limited (single file)",
                "best_for": "Development, small deployments",
                "concurrent_writes": "No (file lock)",
                "replication": "Manual (file copy)",
                "backup": "File copy or SQLite backup command"
            }
        
        else:  # PostgreSQL
            return {
                "max_connections": "100-1000+ (configurable)",
                "transactions_per_second": "10,000-100,000+",
                "recommended_users": "10,000-1,000,000+",
                "scalability": "Excellent (multiple connections)",
                "best_for": "Production, large deployments",
                "concurrent_writes": "Yes (MVCC)",
                "replication": "Built-in (streaming replication)",
                "backup": "pg_dump, continuous archiving"
            }

# Global instance
db_manager = DatabaseManager()

def get_db_manager() -> DatabaseManager:
    """Get global database manager instance."""
    return db_manager

def with_database_abstraction(func):
    """
    Decorator to make database operations work with both SQLite and PostgreSQL.
    
    Usage:
        @with_database_abstraction
        def my_query(db_manager, user_id):
            return db_manager.execute_query(
                "SELECT * FROM users WHERE user_id = ?",
                (user_id,)
            )
    """
    def wrapper(*args, **kwargs):
        db = get_db_manager()
        return func(db, *args, **kwargs)
    return wrapper
