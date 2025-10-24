"""
Security Audit Logging System
Comprehensive logging for security-sensitive operations
"""

import sqlite3
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from contextlib import contextmanager
from enum import Enum

from security.secure_logger import get_audit_logger, SecureLogger

logger = logging.getLogger(__name__)
secure_logger = get_audit_logger()


class AuditEventType(str, Enum):
    """Types of audit events"""
    # Authentication Events
    AUTH_CHALLENGE_REQUESTED = "auth_challenge_requested"
    AUTH_SUCCESS = "auth_success"
    AUTH_FAILURE = "auth_failure"
    AUTH_LOGOUT = "auth_logout"
    SESSION_EXPIRED = "session_expired"
    SESSION_REFRESH = "session_refresh"
    
    # Contract Events
    CONTRACT_CREATED = "contract_created"
    CONTRACT_MODIFIED = "contract_modified"
    CONTRACT_DELETED = "contract_deleted"
    CONTRACT_SIGNED = "contract_signed"
    
    # Wallet Events
    WALLET_CREATED = "wallet_created"
    WALLET_TRANSACTION = "wallet_transaction"
    WALLET_DEACTIVATED = "wallet_deactivated"
    
    # Security Events
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    INPUT_VALIDATION_FAILED = "input_validation_failed"
    SQL_INJECTION_ATTEMPT = "sql_injection_attempt"
    XSS_ATTEMPT = "xss_attempt"
    CSRF_VALIDATION_FAILED = "csrf_validation_failed"
    
    # Admin Events
    ADMIN_ACTION = "admin_action"
    USER_SUSPENDED = "user_suspended"
    USER_BANNED = "user_banned"
    SETTINGS_CHANGED = "settings_changed"


class AuditSeverity(str, Enum):
    """Severity levels for audit events"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class SecurityAuditLogger:
    """Security audit logging system with encrypted storage"""
    
    def __init__(self, db_path: str = "security_audit.db"):
        self.db_path = db_path
        self._initialize_database()
    
    @contextmanager
    def _get_connection(self):
        """Context manager for database connections"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
    
    def _initialize_database(self):
        """Initialize audit log database"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Audit logs table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS audit_logs (
                    log_id TEXT PRIMARY KEY,
                    event_type TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    user_id TEXT,
                    wallet_address TEXT,
                    ip_address TEXT,
                    user_agent TEXT,
                    event_data TEXT,
                    success INTEGER DEFAULT 1,
                    error_message TEXT,
                    created_at TEXT NOT NULL,
                    session_id TEXT,
                    request_id TEXT
                )
            """)
            
            # Security alerts table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS security_alerts (
                    alert_id TEXT PRIMARY KEY,
                    alert_type TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    wallet_address TEXT,
                    ip_address TEXT,
                    description TEXT NOT NULL,
                    event_count INTEGER DEFAULT 1,
                    first_seen TEXT NOT NULL,
                    last_seen TEXT NOT NULL,
                    is_resolved INTEGER DEFAULT 0,
                    resolved_at TEXT,
                    resolved_by TEXT
                )
            """)
            
            # Create indexes
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_audit_event_type 
                ON audit_logs(event_type, created_at)
            """)
            
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_audit_wallet 
                ON audit_logs(wallet_address, created_at)
            """)
            
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_audit_severity 
                ON audit_logs(severity, created_at)
            """)
            
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_alerts_unresolved 
                ON security_alerts(is_resolved, severity)
            """)
    
    def log_event(
        self,
        event_type: AuditEventType,
        severity: AuditSeverity = AuditSeverity.INFO,
        user_id: Optional[str] = None,
        wallet_address: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        event_data: Optional[Dict[str, Any]] = None,
        success: bool = True,
        error_message: Optional[str] = None,
        session_id: Optional[str] = None,
        request_id: Optional[str] = None
    ) -> str:
        """
        Log a security audit event.
        
        Returns:
            str: Log ID
        """
        try:
            import uuid
            log_id = str(uuid.uuid4())
            now = datetime.now().isoformat()
            
            # Sanitize sensitive data
            if event_data:
                event_data = self._sanitize_event_data(event_data)
            
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO audit_logs (
                        log_id, event_type, severity, user_id, wallet_address,
                        ip_address, user_agent, event_data, success, error_message,
                        created_at, session_id, request_id
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    log_id, event_type.value, severity.value, user_id, wallet_address,
                    ip_address, user_agent, json.dumps(event_data) if event_data else None,
                    1 if success else 0, error_message, now, session_id, request_id
                ))
            
            # Create security alert if needed
            if severity in [AuditSeverity.ERROR, AuditSeverity.CRITICAL]:
                self._check_and_create_alert(event_type, severity, wallet_address, ip_address, now)
            
            # Log to secure logger with scrubbing
            secure_logger.info(
                f"[AUDIT] {event_type.value}: success={success}",
                extra={
                    "wallet_address": wallet_address,
                    "event_type": event_type.value,
                    "severity": severity.value,
                    "success": success,
                    "session_id": session_id,
                    "request_id": request_id
                }
            )
            
            return log_id
            
        except Exception as e:
            logger.error(f"Failed to log audit event: {e}")
            return ""
    
    def _sanitize_event_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Remove sensitive fields from event data using secure logger scrubbing"""
        if not data:
            return data
        
        # Use secure logger to scrub sensitive data
        return secure_logger._scrub_dict(data)
    
    def _check_and_create_alert(
        self,
        event_type: AuditEventType,
        severity: AuditSeverity,
        wallet_address: Optional[str],
        ip_address: Optional[str],
        timestamp: str
    ):
        """Check if security alert should be created"""
        try:
            import uuid
            alert_types_to_monitor = [
                AuditEventType.AUTH_FAILURE,
                AuditEventType.RATE_LIMIT_EXCEEDED,
                AuditEventType.SUSPICIOUS_ACTIVITY,
                AuditEventType.SQL_INJECTION_ATTEMPT,
                AuditEventType.XSS_ATTEMPT,
                AuditEventType.CSRF_VALIDATION_FAILED
            ]
            
            if event_type not in alert_types_to_monitor:
                return
            
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                # Check if similar alert exists
                cursor.execute("""
                    SELECT alert_id, event_count FROM security_alerts
                    WHERE alert_type = ? AND wallet_address = ? AND is_resolved = 0
                """, (event_type.value, wallet_address))
                
                result = cursor.fetchone()
                
                if result:
                    # Update existing alert
                    alert_id = result['alert_id']
                    event_count = result['event_count'] + 1
                    cursor.execute("""
                        UPDATE security_alerts
                        SET event_count = ?, last_seen = ?
                        WHERE alert_id = ?
                    """, (event_count, timestamp, alert_id))
                else:
                    # Create new alert
                    alert_id = str(uuid.uuid4())
                    cursor.execute("""
                        INSERT INTO security_alerts (
                            alert_id, alert_type, severity, wallet_address, ip_address,
                            description, event_count, first_seen, last_seen, is_resolved
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        alert_id, event_type.value, severity.value, wallet_address, ip_address,
                        f"Security event detected: {event_type.value}",
                        1, timestamp, timestamp, 0
                    ))
                    
        except Exception as e:
            logger.error(f"Failed to create security alert: {e}")
    
    def get_recent_events(
        self,
        event_type: Optional[AuditEventType] = None,
        wallet_address: Optional[str] = None,
        limit: int = 100
    ) -> list:
        """Get recent audit events"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                query = "SELECT * FROM audit_logs WHERE 1=1"
                params = []
                
                if event_type:
                    query += " AND event_type = ?"
                    params.append(event_type.value)
                
                if wallet_address:
                    query += " AND wallet_address = ?"
                    params.append(wallet_address)
                
                query += " ORDER BY created_at DESC LIMIT ?"
                params.append(limit)
                
                cursor.execute(query, params)
                return [dict(row) for row in cursor.fetchall()]
                
        except Exception as e:
            logger.error(f"Failed to get recent events: {e}")
            return []
    
    def get_unresolved_alerts(self, severity: Optional[AuditSeverity] = None) -> list:
        """Get unresolved security alerts"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                query = "SELECT * FROM security_alerts WHERE is_resolved = 0"
                params = []
                
                if severity:
                    query += " AND severity = ?"
                    params.append(severity.value)
                
                query += " ORDER BY severity DESC, last_seen DESC"
                
                cursor.execute(query, params)
                return [dict(row) for row in cursor.fetchall()]
                
        except Exception as e:
            logger.error(f"Failed to get unresolved alerts: {e}")
            return []
    
    def resolve_alert(self, alert_id: str, resolved_by: str) -> bool:
        """Mark security alert as resolved"""
        try:
            now = datetime.now().isoformat()
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE security_alerts
                    SET is_resolved = 1, resolved_at = ?, resolved_by = ?
                    WHERE alert_id = ?
                """, (now, resolved_by, alert_id))
                
            logger.info(f"Security alert {alert_id} resolved by {resolved_by}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to resolve alert: {e}")
            return False


# Global audit logger instance
_audit_logger_instance: Optional[SecurityAuditLogger] = None


def get_audit_logger(db_path: str = "security_audit.db") -> SecurityAuditLogger:
    """Get or create audit logger singleton"""
    global _audit_logger_instance
    
    if _audit_logger_instance is None:
        _audit_logger_instance = SecurityAuditLogger(db_path)
    
    return _audit_logger_instance


__all__ = [
    'SecurityAuditLogger',
    'AuditEventType',
    'AuditSeverity',
    'get_audit_logger'
]

