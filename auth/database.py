"""
W-CSAP Database Layer
=====================

Persistent storage for challenges, sessions, and authentication events.
This implementation uses SQLite for simplicity, but can be adapted for PostgreSQL/MongoDB.
"""

import sqlite3
import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List, Tuple
from contextlib import contextmanager
from pathlib import Path

logger = logging.getLogger(__name__)


class WCSAPDatabase:
    """
    Database manager for W-CSAP authentication system.
    Handles persistent storage of challenges, sessions, and audit logs.
    """
    
    def __init__(self, db_path: str = "data/w_csap.db"):
        self.db_path = db_path
        self._ensure_directory()
        self._initialize_tables()
        logger.info(f"📦 W-CSAP Database initialized at {db_path}")
    
    def _ensure_directory(self):
        """Ensure database directory exists."""
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
    
    @contextmanager
    def get_connection(self):
        """Context manager for database connections."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Enable column access by name
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            logger.error(f"Database error: {str(e)}")
            raise
        finally:
            conn.close()
    
    def _initialize_tables(self):
        """Create database tables if they don't exist."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Challenges table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS challenges (
                    challenge_id TEXT PRIMARY KEY,
                    wallet_address TEXT NOT NULL,
                    challenge_message TEXT NOT NULL,
                    nonce TEXT NOT NULL,
                    issued_at INTEGER NOT NULL,
                    expires_at INTEGER NOT NULL,
                    ip_address TEXT,
                    user_agent TEXT,
                    metadata TEXT,
                    status TEXT DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_wallet (wallet_address),
                    INDEX idx_status (status),
                    INDEX idx_expires (expires_at)
                )
            """)
            
            # Sessions table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS sessions (
                    assertion_id TEXT PRIMARY KEY,
                    wallet_address TEXT NOT NULL,
                    session_token TEXT NOT NULL UNIQUE,
                    refresh_token TEXT NOT NULL UNIQUE,
                    signature TEXT NOT NULL,
                    issued_at INTEGER NOT NULL,
                    expires_at INTEGER NOT NULL,
                    not_before INTEGER NOT NULL,
                    last_activity INTEGER NOT NULL,
                    ip_address TEXT,
                    user_agent TEXT,
                    metadata TEXT,
                    status TEXT DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_wallet (wallet_address),
                    INDEX idx_session_token (session_token),
                    INDEX idx_status (status),
                    INDEX idx_expires (expires_at)
                )
            """)
            
            # Authentication events (audit log)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS auth_events (
                    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    wallet_address TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    challenge_id TEXT,
                    assertion_id TEXT,
                    success INTEGER NOT NULL,
                    error_message TEXT,
                    ip_address TEXT,
                    user_agent TEXT,
                    metadata TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_wallet (wallet_address),
                    INDEX idx_event_type (event_type),
                    INDEX idx_created (created_at)
                )
            """)
            
            # Rate limiting table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS rate_limits (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    wallet_address TEXT NOT NULL,
                    ip_address TEXT,
                    action_type TEXT NOT NULL,
                    attempt_count INTEGER DEFAULT 1,
                    last_attempt INTEGER NOT NULL,
                    blocked_until INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_wallet_action (wallet_address, action_type),
                    INDEX idx_ip_action (ip_address, action_type)
                )
            """)
            
            logger.info("✅ Database tables initialized")
    
    # ==================== Challenge Operations ====================
    
    def save_challenge(
        self,
        challenge_id: str,
        wallet_address: str,
        challenge_message: str,
        nonce: str,
        issued_at: int,
        expires_at: int,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Save a new challenge to the database."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO challenges (
                        challenge_id, wallet_address, challenge_message, nonce,
                        issued_at, expires_at, ip_address, user_agent, metadata
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    challenge_id, wallet_address, challenge_message, nonce,
                    issued_at, expires_at, ip_address, user_agent,
                    json.dumps(metadata) if metadata else None
                ))
            
            logger.debug(f"Challenge saved: {challenge_id[:16]}...")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save challenge: {str(e)}")
            return False
    
    def get_challenge(self, challenge_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a challenge by ID."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT * FROM challenges WHERE challenge_id = ?
                """, (challenge_id,))
                
                row = cursor.fetchone()
                if row:
                    return dict(row)
                return None
                
        except Exception as e:
            logger.error(f"Failed to get challenge: {str(e)}")
            return None
    
    def update_challenge_status(self, challenge_id: str, status: str) -> bool:
        """Update challenge status (used, expired, etc.)."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE challenges SET status = ? WHERE challenge_id = ?
                """, (status, challenge_id))
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to update challenge status: {str(e)}")
            return False
    
    def cleanup_expired_challenges(self, current_time: int) -> int:
        """Remove expired challenges from database."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    DELETE FROM challenges WHERE expires_at < ?
                """, (current_time,))
                
                deleted_count = cursor.rowcount
                
            logger.info(f"🧹 Cleaned up {deleted_count} expired challenges")
            return deleted_count
            
        except Exception as e:
            logger.error(f"Failed to cleanup challenges: {str(e)}")
            return 0
    
    # ==================== Session Operations ====================
    
    def save_session(
        self,
        assertion_id: str,
        wallet_address: str,
        session_token: str,
        refresh_token: str,
        signature: str,
        issued_at: int,
        expires_at: int,
        not_before: int,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Save a new session to the database."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO sessions (
                        assertion_id, wallet_address, session_token, refresh_token,
                        signature, issued_at, expires_at, not_before, last_activity,
                        ip_address, user_agent, metadata
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    assertion_id, wallet_address, session_token, refresh_token,
                    signature, issued_at, expires_at, not_before, issued_at,
                    ip_address, user_agent,
                    json.dumps(metadata) if metadata else None
                ))
            
            logger.debug(f"Session saved: {assertion_id[:16]}...")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save session: {str(e)}")
            return False
    
    def get_session_by_token(self, session_token: str) -> Optional[Dict[str, Any]]:
        """Retrieve a session by session token."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT * FROM sessions WHERE session_token = ? AND status = 'active'
                """, (session_token,))
                
                row = cursor.fetchone()
                if row:
                    return dict(row)
                return None
                
        except Exception as e:
            logger.error(f"Failed to get session: {str(e)}")
            return None
    
    def get_session_by_refresh_token(self, refresh_token: str) -> Optional[Dict[str, Any]]:
        """Retrieve a session by refresh token."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT * FROM sessions WHERE refresh_token = ?
                """, (refresh_token,))
                
                row = cursor.fetchone()
                if row:
                    return dict(row)
                return None
                
        except Exception as e:
            logger.error(f"Failed to get session by refresh token: {str(e)}")
            return None
    
    def update_session_activity(self, assertion_id: str, last_activity: int) -> bool:
        """Update session last activity timestamp."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE sessions SET last_activity = ? WHERE assertion_id = ?
                """, (last_activity, assertion_id))
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to update session activity: {str(e)}")
            return False
    
    def invalidate_session(self, assertion_id: str) -> bool:
        """Invalidate a session (logout)."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE sessions SET status = 'invalidated' WHERE assertion_id = ?
                """, (assertion_id,))
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to invalidate session: {str(e)}")
            return False
    
    def get_active_sessions_by_wallet(self, wallet_address: str) -> List[Dict[str, Any]]:
        """Get all active sessions for a wallet."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT * FROM sessions 
                    WHERE wallet_address = ? AND status = 'active'
                    ORDER BY created_at DESC
                """, (wallet_address,))
                
                return [dict(row) for row in cursor.fetchall()]
                
        except Exception as e:
            logger.error(f"Failed to get active sessions: {str(e)}")
            return []
    
    def cleanup_expired_sessions(self, current_time: int) -> int:
        """Remove expired sessions from database."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    DELETE FROM sessions WHERE expires_at < ?
                """, (current_time,))
                
                deleted_count = cursor.rowcount
                
            logger.info(f"🧹 Cleaned up {deleted_count} expired sessions")
            return deleted_count
            
        except Exception as e:
            logger.error(f"Failed to cleanup sessions: {str(e)}")
            return 0
    
    # ==================== Audit Operations ====================
    
    def log_auth_event(
        self,
        wallet_address: str,
        event_type: str,
        success: bool,
        challenge_id: Optional[str] = None,
        assertion_id: Optional[str] = None,
        error_message: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Log an authentication event for audit purposes."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO auth_events (
                        wallet_address, event_type, challenge_id, assertion_id,
                        success, error_message, ip_address, user_agent, metadata
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    wallet_address, event_type, challenge_id, assertion_id,
                    1 if success else 0, error_message,
                    ip_address, user_agent,
                    json.dumps(metadata) if metadata else None
                ))
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to log auth event: {str(e)}")
            return False
    
    def get_auth_history(
        self,
        wallet_address: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get authentication history."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                if wallet_address:
                    cursor.execute("""
                        SELECT * FROM auth_events 
                        WHERE wallet_address = ?
                        ORDER BY created_at DESC
                        LIMIT ?
                    """, (wallet_address, limit))
                else:
                    cursor.execute("""
                        SELECT * FROM auth_events 
                        ORDER BY created_at DESC
                        LIMIT ?
                    """, (limit,))
                
                return [dict(row) for row in cursor.fetchall()]
                
        except Exception as e:
            logger.error(f"Failed to get auth history: {str(e)}")
            return []
    
    # ==================== Rate Limiting ====================
    
    def check_rate_limit(
        self,
        wallet_address: str,
        action_type: str,
        max_attempts: int = 5,
        window_seconds: int = 300
    ) -> Tuple[bool, int]:
        """
        Check if rate limit is exceeded.
        
        Returns:
            Tuple of (is_allowed, attempts_remaining)
        """
        try:
            current_time = int(datetime.now().timestamp())
            window_start = current_time - window_seconds
            
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                # Get recent attempts
                cursor.execute("""
                    SELECT COUNT(*) as count FROM auth_events
                    WHERE wallet_address = ? 
                    AND event_type = ?
                    AND created_at >= datetime(?, 'unixepoch')
                """, (wallet_address, action_type, window_start))
                
                row = cursor.fetchone()
                attempt_count = row['count'] if row else 0
                
                is_allowed = attempt_count < max_attempts
                attempts_remaining = max(0, max_attempts - attempt_count)
                
                return is_allowed, attempts_remaining
                
        except Exception as e:
            logger.error(f"Failed to check rate limit: {str(e)}")
            return True, max_attempts  # Fail open
    
    # ==================== Statistics ====================
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get authentication system statistics."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                
                # Active sessions
                cursor.execute("""
                    SELECT COUNT(*) as count FROM sessions WHERE status = 'active'
                """)
                active_sessions = cursor.fetchone()['count']
                
                # Pending challenges
                cursor.execute("""
                    SELECT COUNT(*) as count FROM challenges WHERE status = 'pending'
                """)
                pending_challenges = cursor.fetchone()['count']
                
                # Total users (unique wallets with sessions)
                cursor.execute("""
                    SELECT COUNT(DISTINCT wallet_address) as count FROM sessions
                """)
                total_users = cursor.fetchone()['count']
                
                # Recent auth events (last 24h)
                cursor.execute("""
                    SELECT COUNT(*) as count FROM auth_events
                    WHERE created_at >= datetime('now', '-1 day')
                """)
                recent_events = cursor.fetchone()['count']
                
                return {
                    "active_sessions": active_sessions,
                    "pending_challenges": pending_challenges,
                    "total_users": total_users,
                    "recent_auth_events_24h": recent_events
                }
                
        except Exception as e:
            logger.error(f"Failed to get statistics: {str(e)}")
            return {}


# Singleton instance
_db_instance: Optional[WCSAPDatabase] = None


def get_database(db_path: str = "data/w_csap.db") -> WCSAPDatabase:
    """Get or create database singleton instance."""
    global _db_instance
    if _db_instance is None:
        _db_instance = WCSAPDatabase(db_path)
    return _db_instance
