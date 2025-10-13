"""
GigChain.io - Admin Management System
Complete admin backend for platform management.
"""

import sqlite3
import logging
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict
from enum import Enum

logger = logging.getLogger(__name__)

class AdminRole(str, Enum):
    """Admin role levels."""
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    MODERATOR = "moderator"
    SUPPORT = "support"

class UserStatus(str, Enum):
    """User account status."""
    ACTIVE = "active"
    SUSPENDED = "suspended"
    BANNED = "banned"
    PENDING = "pending"

@dataclass
class AdminUser:
    """Admin user structure."""
    admin_id: str
    username: str
    email: str
    role: str
    password_hash: str
    created_at: str
    last_login: Optional[str]
    is_active: bool

class AdminManagementSystem:
    """
    Complete admin management system for GigChain.io
    """
    
    def __init__(self, db_path: str = "admin.db"):
        self.db_path = db_path
        self._init_database()
    
    def _init_database(self):
        """Initialize admin database schema."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Admin users table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS admin_users (
                    admin_id TEXT PRIMARY KEY,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    role TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    last_login TEXT,
                    is_active INTEGER DEFAULT 1
                )
            ''')
            
            # Admin sessions table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS admin_sessions (
                    session_id TEXT PRIMARY KEY,
                    admin_id TEXT NOT NULL,
                    token TEXT UNIQUE NOT NULL,
                    created_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    ip_address TEXT,
                    user_agent TEXT,
                    FOREIGN KEY (admin_id) REFERENCES admin_users(admin_id)
                )
            ''')
            
            # Admin activity log
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS admin_activity_log (
                    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    admin_id TEXT NOT NULL,
                    action TEXT NOT NULL,
                    target_type TEXT,
                    target_id TEXT,
                    details TEXT,
                    ip_address TEXT,
                    timestamp TEXT NOT NULL,
                    FOREIGN KEY (admin_id) REFERENCES admin_users(admin_id)
                )
            ''')
            
            # Platform users management table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS platform_users (
                    user_id TEXT PRIMARY KEY,
                    wallet_address TEXT UNIQUE NOT NULL,
                    username TEXT,
                    email TEXT,
                    status TEXT DEFAULT 'active',
                    reputation_score INTEGER DEFAULT 0,
                    total_contracts INTEGER DEFAULT 0,
                    total_earned REAL DEFAULT 0.0,
                    trust_score INTEGER DEFAULT 50,
                    created_at TEXT NOT NULL,
                    last_active TEXT,
                    is_verified INTEGER DEFAULT 0,
                    notes TEXT
                )
            ''')
            
            # Platform settings table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS platform_settings (
                    setting_key TEXT PRIMARY KEY,
                    setting_value TEXT NOT NULL,
                    setting_type TEXT NOT NULL,
                    description TEXT,
                    updated_by TEXT,
                    updated_at TEXT NOT NULL
                )
            ''')
            
            # Moderation queue table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS moderation_queue (
                    queue_id TEXT PRIMARY KEY,
                    item_type TEXT NOT NULL,
                    item_id TEXT NOT NULL,
                    reason TEXT,
                    reporter_id TEXT,
                    status TEXT DEFAULT 'pending',
                    assigned_to TEXT,
                    created_at TEXT NOT NULL,
                    resolved_at TEXT,
                    resolution TEXT
                )
            ''')
            
            # System alerts table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS system_alerts (
                    alert_id TEXT PRIMARY KEY,
                    alert_type TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    title TEXT NOT NULL,
                    message TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    acknowledged INTEGER DEFAULT 0,
                    acknowledged_by TEXT,
                    acknowledged_at TEXT
                )
            ''')
            
            # Create indexes
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_admin_activity_admin ON admin_activity_log(admin_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_platform_users_wallet ON platform_users(wallet_address)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_platform_users_status ON platform_users(status)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_moderation_status ON moderation_queue(status)')
            
            conn.commit()
            
            # Create default super admin if not exists
            self._create_default_admin()
    
    def _create_default_admin(self):
        """Create default super admin account with secure password."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('SELECT COUNT(*) FROM admin_users WHERE role = ?', (AdminRole.SUPER_ADMIN.value,))
            if cursor.fetchone()[0] == 0:
                # Generate secure random password
                admin_id = secrets.token_hex(16)
                secure_password = secrets.token_urlsafe(16)  # 16 character secure password
                password_hash = hashlib.sha256(secure_password.encode()).hexdigest()
                
                cursor.execute('''
                    INSERT INTO admin_users (admin_id, username, email, password_hash, role, created_at, is_active, password_changed_at)
                    VALUES (?, ?, ?, ?, ?, ?, 1, ?)
                ''', (
                    admin_id,
                    "admin",
                    "admin@gigchain.io",
                    password_hash,
                    AdminRole.SUPER_ADMIN.value,
                    datetime.now().isoformat(),
                    None  # password_changed_at is None, forcing password change on first login
                ))
                
                conn.commit()
                # Log secure password to console for initial setup (only once)
                print(f"🔐 SECURITY: Default admin created with secure password: {secure_password}")
                print("🔐 SECURITY: Please change this password immediately after first login!")
                logger.warning("🔐 SECURITY: Default admin created with secure password (check console)")
                logger.warning("🔐 SECURITY: Please change this password immediately after first login!")
                logger.info("✅ Default super admin created: username=admin, password=GENERATED_SECURE_PASSWORD")
    
    def authenticate_admin(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticate admin user."""
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT admin_id, username, email, role, is_active, password_changed_at
                FROM admin_users
                WHERE username = ? AND password_hash = ?
            ''', (username, password_hash))
            
            result = cursor.fetchone()
            
            if result and result[4]:  # is_active
                admin_data = {
                    "admin_id": result[0],
                    "username": result[1],
                    "email": result[2],
                    "role": result[3],
                    "password_changed_at": result[5]
                }
                
                # Check if password change is required (first login)
                if result[5] is None:  # password_changed_at is None
                    admin_data["requires_password_change"] = True
                
                # Update last login
                cursor.execute('''
                    UPDATE admin_users SET last_login = ? WHERE admin_id = ?
                ''', (datetime.now().isoformat(), result[0]))
                
                # Create session token
                token = secrets.token_urlsafe(32)
                session_id = secrets.token_hex(16)
                expires_at = datetime.now() + timedelta(hours=8)
                
                cursor.execute('''
                    INSERT INTO admin_sessions (session_id, admin_id, token, created_at, expires_at)
                    VALUES (?, ?, ?, ?, ?)
                ''', (
                    session_id,
                    result[0],
                    token,
                    datetime.now().isoformat(),
                    expires_at.isoformat()
                ))
                
                conn.commit()
                
                admin_data["token"] = token
                admin_data["session_id"] = session_id
                
                # Log activity
                self.log_admin_activity(result[0], "login", details={"username": username})
                
                return admin_data
        
        return None
    
    def verify_admin_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify admin session token."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT s.admin_id, s.expires_at, u.username, u.role
                FROM admin_sessions s
                JOIN admin_users u ON s.admin_id = u.admin_id
                WHERE s.token = ?
            ''', (token,))
            
            result = cursor.fetchone()
            
            if result:
                admin_id, expires_at, username, role = result
                
                # Check if session expired
                if datetime.fromisoformat(expires_at) > datetime.now():
                    return {
                        "admin_id": admin_id,
                        "username": username,
                        "role": role,
                        "authenticated": True
                    }
        
        return None
    
    def log_admin_activity(
        self,
        admin_id: str,
        action: str,
        target_type: Optional[str] = None,
        target_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ):
        """Log admin activity."""
        import json
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO admin_activity_log 
                (admin_id, action, target_type, target_id, details, ip_address, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                admin_id,
                action,
                target_type,
                target_id,
                json.dumps(details) if details else None,
                ip_address,
                datetime.now().isoformat()
            ))
            
            conn.commit()
    
    def get_all_users(
        self,
        status: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get all platform users."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            query = "SELECT * FROM platform_users"
            params = []
            
            if status:
                query += " WHERE status = ?"
                params.append(status)
            
            query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])
            
            cursor.execute(query, params)
            
            columns = [desc[0] for desc in cursor.description]
            users = []
            
            for row in cursor.fetchall():
                user = dict(zip(columns, row))
                user["is_verified"] = bool(user["is_verified"])
                users.append(user)
            
            return users
    
    def get_user_details(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed user information."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM platform_users WHERE user_id = ?', (user_id,))
            
            result = cursor.fetchone()
            if result:
                columns = [desc[0] for desc in cursor.description]
                return dict(zip(columns, result))
        
        return None
    
    def update_user_status(
        self,
        user_id: str,
        status: str,
        admin_id: str,
        reason: Optional[str] = None
    ) -> bool:
        """Update user account status."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    UPDATE platform_users SET status = ? WHERE user_id = ?
                ''', (status, user_id))
                
                conn.commit()
                
                # Log activity
                self.log_admin_activity(
                    admin_id,
                    "user_status_change",
                    target_type="user",
                    target_id=user_id,
                    details={"new_status": status, "reason": reason}
                )
                
                return True
        except Exception as e:
            logger.error(f"Error updating user status: {str(e)}")
            return False
    
    def get_platform_statistics(self) -> Dict[str, Any]:
        """Get comprehensive platform statistics."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Total users
            cursor.execute('SELECT COUNT(*) FROM platform_users')
            total_users = cursor.fetchone()[0]
            
            # Active users
            cursor.execute('SELECT COUNT(*) FROM platform_users WHERE status = ?', ('active',))
            active_users = cursor.fetchone()[0]
            
            # Suspended users
            cursor.execute('SELECT COUNT(*) FROM platform_users WHERE status = ?', ('suspended',))
            suspended_users = cursor.fetchone()[0]
            
            # Banned users
            cursor.execute('SELECT COUNT(*) FROM platform_users WHERE status = ?', ('banned',))
            banned_users = cursor.fetchone()[0]
            
            # Total contracts (from analytics if available)
            total_contracts = 0
            total_volume = 0.0
            
            # Moderation queue
            cursor.execute('SELECT COUNT(*) FROM moderation_queue WHERE status = ?', ('pending',))
            pending_moderation = cursor.fetchone()[0]
            
            # Recent activity count (last 24h)
            yesterday = (datetime.now() - timedelta(days=1)).isoformat()
            cursor.execute('''
                SELECT COUNT(*) FROM admin_activity_log WHERE timestamp > ?
            ''', (yesterday,))
            recent_activity = cursor.fetchone()[0]
            
            return {
                "users": {
                    "total": total_users,
                    "active": active_users,
                    "suspended": suspended_users,
                    "banned": banned_users
                },
                "contracts": {
                    "total": total_contracts,
                    "volume": total_volume
                },
                "moderation": {
                    "pending": pending_moderation
                },
                "activity": {
                    "last_24h": recent_activity
                }
            }
    
    def get_admin_activity_log(
        self,
        admin_id: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get admin activity log."""
        import json
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            query = '''
                SELECT l.*, u.username
                FROM admin_activity_log l
                JOIN admin_users u ON l.admin_id = u.admin_id
            '''
            
            params = []
            if admin_id:
                query += " WHERE l.admin_id = ?"
                params.append(admin_id)
            
            query += " ORDER BY l.timestamp DESC LIMIT ?"
            params.append(limit)
            
            cursor.execute(query, params)
            
            columns = [desc[0] for desc in cursor.description]
            logs = []
            
            for row in cursor.fetchall():
                log = dict(zip(columns, row))
                if log.get("details"):
                    log["details"] = json.loads(log["details"])
                logs.append(log)
            
            return logs
    
    def create_system_alert(
        self,
        alert_type: str,
        severity: str,
        title: str,
        message: str
    ) -> str:
        """Create system alert."""
        alert_id = secrets.token_hex(16)
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO system_alerts 
                (alert_id, alert_type, severity, title, message, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                alert_id,
                alert_type,
                severity,
                title,
                message,
                datetime.now().isoformat()
            ))
            
            conn.commit()
        
        return alert_id
    
    def get_system_alerts(
        self,
        acknowledged: Optional[bool] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get system alerts."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            query = "SELECT * FROM system_alerts"
            params = []
            
            if acknowledged is not None:
                query += " WHERE acknowledged = ?"
                params.append(1 if acknowledged else 0)
            
            query += " ORDER BY created_at DESC LIMIT ?"
            params.append(limit)
            
            cursor.execute(query, params)
            
            columns = [desc[0] for desc in cursor.description]
            alerts = []
            
            for row in cursor.fetchall():
                alert = dict(zip(columns, row))
                alert["acknowledged"] = bool(alert["acknowledged"])
                alerts.append(alert)
            
            return alerts
    
    def sync_user_from_reputation(self, wallet_address: str, reputation_data: Dict[str, Any]):
        """Sync user data from reputation system."""
        user_id = hashlib.sha256(wallet_address.encode()).hexdigest()[:16]
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT OR REPLACE INTO platform_users
                (user_id, wallet_address, reputation_score, total_contracts, total_earned, trust_score, created_at, last_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                user_id,
                wallet_address,
                reputation_data.get('points', 0),
                reputation_data.get('contracts_completed', 0),
                reputation_data.get('total_earned', 0.0),
                reputation_data.get('trust_score', 50),
                reputation_data.get('created_at', datetime.now().isoformat()),
                datetime.now().isoformat()
            ))
            
            conn.commit()

# Global admin system instance
admin_system = AdminManagementSystem()

def authenticate_admin_user(username: str, password: str) -> Optional[Dict[str, Any]]:
    """Convenience function for admin authentication."""
    return admin_system.authenticate_admin(username, password)

def verify_admin_session(token: str) -> Optional[Dict[str, Any]]:
    """Convenience function to verify admin session."""
    return admin_system.verify_admin_token(token)
