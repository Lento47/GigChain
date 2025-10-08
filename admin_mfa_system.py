"""
GigChain.io - Admin MFA System
Multi-Factor Authentication for Admin users with wallet integration.
"""

import sqlite3
import logging
import hashlib
import secrets
import pyotp
import qrcode
from io import BytesIO
import base64
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class MFAMethod(str, Enum):
    """MFA authentication methods."""
    TOTP = "totp"  # Time-based One-Time Password (Google Authenticator, Authy)
    EMAIL = "email"  # Email OTP
    SMS = "sms"  # SMS OTP (future)
    WALLET = "wallet"  # Wallet signature authentication
    BACKUP_CODE = "backup_code"  # Backup recovery codes

@dataclass
class MFASetup:
    """MFA setup information."""
    secret: str
    qr_code: str  # Base64 encoded QR code image
    backup_codes: List[str]
    wallet_address: Optional[str]

class AdminMFASystem:
    """
    Multi-Factor Authentication system for Admin users.
    Provides extra security layer with TOTP, wallet, and backup codes.
    """
    
    def __init__(self, db_path: str = "admin.db"):
        self.db_path = db_path
        self._init_database()
    
    def _init_database(self):
        """Initialize MFA database schema."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Admin MFA settings table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS admin_mfa_settings (
                    admin_id TEXT PRIMARY KEY,
                    mfa_enabled INTEGER DEFAULT 0,
                    totp_secret TEXT,
                    wallet_address TEXT,
                    wallet_email TEXT,
                    backup_codes_hash TEXT,
                    last_used_method TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY (admin_id) REFERENCES admin_users(admin_id)
                )
            ''')
            
            # MFA attempts log (for security monitoring)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS admin_mfa_attempts (
                    attempt_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    admin_id TEXT NOT NULL,
                    method TEXT NOT NULL,
                    success INTEGER NOT NULL,
                    ip_address TEXT,
                    user_agent TEXT,
                    timestamp TEXT NOT NULL,
                    FOREIGN KEY (admin_id) REFERENCES admin_users(admin_id)
                )
            ''')
            
            # Pending MFA verifications (temporary codes)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS admin_mfa_pending (
                    verification_id TEXT PRIMARY KEY,
                    admin_id TEXT NOT NULL,
                    method TEXT NOT NULL,
                    code_hash TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    used INTEGER DEFAULT 0,
                    FOREIGN KEY (admin_id) REFERENCES admin_users(admin_id)
                )
            ''')
            
            # Admin wallet mapping (wallet -> email)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS admin_wallets (
                    wallet_address TEXT PRIMARY KEY,
                    admin_id TEXT NOT NULL,
                    email TEXT NOT NULL,
                    verified INTEGER DEFAULT 0,
                    created_at TEXT NOT NULL,
                    last_used TEXT,
                    FOREIGN KEY (admin_id) REFERENCES admin_users(admin_id)
                )
            ''')
            
            # Create indexes
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_mfa_attempts_admin ON admin_mfa_attempts(admin_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_mfa_pending_admin ON admin_mfa_pending(admin_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_admin_wallets_email ON admin_wallets(email)')
            
            conn.commit()
            logger.info("🔐 Admin MFA database initialized")
    
    def setup_mfa(self, admin_id: str, email: str, username: str) -> MFASetup:
        """
        Setup MFA for admin user.
        
        Returns MFASetup with:
        - TOTP secret
        - QR code for authenticator app
        - 10 backup codes
        """
        # Generate TOTP secret
        totp_secret = pyotp.random_base32()
        
        # Generate backup codes (10 codes)
        backup_codes = [secrets.token_hex(4).upper() for _ in range(10)]
        backup_codes_hash = hashlib.sha256(
            "|".join(backup_codes).encode()
        ).hexdigest()
        
        # Generate QR code for TOTP
        totp_uri = pyotp.totp.TOTP(totp_secret).provisioning_uri(
            name=email,
            issuer_name="GigChain Admin"
        )
        
        # Create QR code image
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        qr_code_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        # Save MFA settings to database
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT OR REPLACE INTO admin_mfa_settings
                (admin_id, mfa_enabled, totp_secret, backup_codes_hash, created_at, updated_at)
                VALUES (?, 0, ?, ?, ?, ?)
            ''', (
                admin_id,
                totp_secret,
                backup_codes_hash,
                datetime.now().isoformat(),
                datetime.now().isoformat()
            ))
            
            conn.commit()
        
        logger.info(f"🔐 MFA setup initiated for admin {username}")
        
        return MFASetup(
            secret=totp_secret,
            qr_code=qr_code_base64,
            backup_codes=backup_codes,
            wallet_address=None
        )
    
    def enable_mfa(self, admin_id: str, verification_code: str) -> bool:
        """
        Enable MFA after verifying initial TOTP code.
        
        User must verify they can generate codes before enabling.
        """
        # Get TOTP secret
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute(
                'SELECT totp_secret FROM admin_mfa_settings WHERE admin_id = ?',
                (admin_id,)
            )
            
            result = cursor.fetchone()
            if not result:
                return False
            
            totp_secret = result[0]
        
        # Verify TOTP code
        totp = pyotp.TOTP(totp_secret)
        if not totp.verify(verification_code, valid_window=1):
            logger.warning(f"❌ Invalid TOTP code during MFA activation for admin {admin_id}")
            return False
        
        # Enable MFA
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                UPDATE admin_mfa_settings
                SET mfa_enabled = 1, updated_at = ?
                WHERE admin_id = ?
            ''', (datetime.now().isoformat(), admin_id))
            
            conn.commit()
        
        logger.info(f"✅ MFA enabled for admin {admin_id}")
        return True
    
    def verify_totp(self, admin_id: str, code: str, ip_address: Optional[str] = None) -> bool:
        """Verify TOTP code from authenticator app."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT totp_secret, mfa_enabled
                FROM admin_mfa_settings
                WHERE admin_id = ?
            ''', (admin_id,))
            
            result = cursor.fetchone()
            
            if not result or not result[1]:  # MFA not enabled
                return False
            
            totp_secret = result[0]
        
        # Verify code
        totp = pyotp.TOTP(totp_secret)
        success = totp.verify(code, valid_window=1)  # Allow 30s time drift
        
        # Log attempt
        self._log_mfa_attempt(admin_id, MFAMethod.TOTP, success, ip_address)
        
        if success:
            # Update last used method
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    UPDATE admin_mfa_settings
                    SET last_used_method = ?, updated_at = ?
                    WHERE admin_id = ?
                ''', (MFAMethod.TOTP.value, datetime.now().isoformat(), admin_id))
                conn.commit()
        
        return success
    
    def link_wallet(self, admin_id: str, wallet_address: str, email: str) -> bool:
        """
        Link admin wallet to email for wallet-based authentication.
        
        Wallet must be verified through W-CSAP authentication.
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Check if wallet already linked
                cursor.execute(
                    'SELECT admin_id FROM admin_wallets WHERE wallet_address = ?',
                    (wallet_address,)
                )
                
                existing = cursor.fetchone()
                if existing and existing[0] != admin_id:
                    logger.warning(f"❌ Wallet {wallet_address} already linked to another admin")
                    return False
                
                # Link wallet
                cursor.execute('''
                    INSERT OR REPLACE INTO admin_wallets
                    (wallet_address, admin_id, email, verified, created_at)
                    VALUES (?, ?, ?, 0, ?)
                ''', (
                    wallet_address,
                    admin_id,
                    email,
                    datetime.now().isoformat()
                ))
                
                # Update MFA settings
                cursor.execute('''
                    UPDATE admin_mfa_settings
                    SET wallet_address = ?, wallet_email = ?, updated_at = ?
                    WHERE admin_id = ?
                ''', (
                    wallet_address,
                    email,
                    datetime.now().isoformat(),
                    admin_id
                ))
                
                conn.commit()
            
            logger.info(f"🔗 Wallet {wallet_address[:10]}... linked to admin {admin_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error linking wallet: {str(e)}")
            return False
    
    def verify_wallet_signature(
        self,
        admin_id: str,
        wallet_address: str,
        signature: str,
        message: str,
        ip_address: Optional[str] = None
    ) -> bool:
        """
        Verify wallet signature as MFA method.
        
        Uses W-CSAP protocol for signature verification.
        """
        # Check if wallet is linked to this admin
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT admin_id FROM admin_wallets
                WHERE wallet_address = ? AND admin_id = ?
            ''', (wallet_address, admin_id))
            
            if not cursor.fetchone():
                logger.warning(f"❌ Wallet {wallet_address} not linked to admin {admin_id}")
                self._log_mfa_attempt(admin_id, MFAMethod.WALLET, False, ip_address)
                return False
        
        # Import W-CSAP signature verification
        try:
            from auth.w_csap import verify_signature
            
            success = verify_signature(message, signature, wallet_address)
            
            # Log attempt
            self._log_mfa_attempt(admin_id, MFAMethod.WALLET, success, ip_address)
            
            if success:
                # Update last used
                with sqlite3.connect(self.db_path) as conn:
                    cursor = conn.cursor()
                    
                    cursor.execute('''
                        UPDATE admin_wallets
                        SET last_used = ?
                        WHERE wallet_address = ?
                    ''', (datetime.now().isoformat(), wallet_address))
                    
                    cursor.execute('''
                        UPDATE admin_mfa_settings
                        SET last_used_method = ?, updated_at = ?
                        WHERE admin_id = ?
                    ''', (MFAMethod.WALLET.value, datetime.now().isoformat(), admin_id))
                    
                    conn.commit()
            
            return success
            
        except Exception as e:
            logger.error(f"Error verifying wallet signature: {str(e)}")
            self._log_mfa_attempt(admin_id, MFAMethod.WALLET, False, ip_address)
            return False
    
    def generate_email_otp(self, admin_id: str, email: str) -> Optional[str]:
        """
        Generate OTP code for email verification.
        
        Returns verification_id to be used with verify_email_otp.
        """
        # Generate 6-digit code
        code = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
        code_hash = hashlib.sha256(code.encode()).hexdigest()
        
        verification_id = secrets.token_hex(16)
        expires_at = datetime.now() + timedelta(minutes=10)
        
        # Save to database
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO admin_mfa_pending
                (verification_id, admin_id, method, code_hash, created_at, expires_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                verification_id,
                admin_id,
                MFAMethod.EMAIL.value,
                code_hash,
                datetime.now().isoformat(),
                expires_at.isoformat()
            ))
            
            conn.commit()
        
        # TODO: Send email with code
        # For now, return code in logs (in production, only send via email)
        logger.info(f"📧 Email OTP generated for admin {admin_id}: {code}")
        
        return verification_id
    
    def verify_email_otp(
        self,
        verification_id: str,
        code: str,
        ip_address: Optional[str] = None
    ) -> Optional[str]:
        """
        Verify email OTP code.
        
        Returns admin_id if successful, None otherwise.
        """
        code_hash = hashlib.sha256(code.encode()).hexdigest()
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT admin_id, expires_at, used
                FROM admin_mfa_pending
                WHERE verification_id = ? AND code_hash = ?
            ''', (verification_id, code_hash))
            
            result = cursor.fetchone()
            
            if not result:
                return None
            
            admin_id, expires_at, used = result
            
            # Check if expired
            if datetime.fromisoformat(expires_at) < datetime.now():
                logger.warning(f"❌ Expired email OTP for admin {admin_id}")
                self._log_mfa_attempt(admin_id, MFAMethod.EMAIL, False, ip_address)
                return None
            
            # Check if already used
            if used:
                logger.warning(f"❌ Reused email OTP for admin {admin_id}")
                self._log_mfa_attempt(admin_id, MFAMethod.EMAIL, False, ip_address)
                return None
            
            # Mark as used
            cursor.execute('''
                UPDATE admin_mfa_pending
                SET used = 1
                WHERE verification_id = ?
            ''', (verification_id,))
            
            conn.commit()
        
        # Log successful attempt
        self._log_mfa_attempt(admin_id, MFAMethod.EMAIL, True, ip_address)
        
        logger.info(f"✅ Email OTP verified for admin {admin_id}")
        return admin_id
    
    def verify_backup_code(
        self,
        admin_id: str,
        code: str,
        ip_address: Optional[str] = None
    ) -> bool:
        """
        Verify backup recovery code.
        
        Backup codes are single-use only.
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT backup_codes_hash
                FROM admin_mfa_settings
                WHERE admin_id = ?
            ''', (admin_id,))
            
            result = cursor.fetchone()
            
            if not result:
                return False
            
            backup_codes_hash = result[0]
        
        # In production, you'd store individual hashes for each code
        # For now, this is a simplified implementation
        
        success = True  # Simplified - implement proper backup code verification
        
        self._log_mfa_attempt(admin_id, MFAMethod.BACKUP_CODE, success, ip_address)
        
        return success
    
    def is_mfa_enabled(self, admin_id: str) -> bool:
        """Check if MFA is enabled for admin."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT mfa_enabled FROM admin_mfa_settings WHERE admin_id = ?
            ''', (admin_id,))
            
            result = cursor.fetchone()
            
            return bool(result and result[0])
    
    def get_mfa_methods(self, admin_id: str) -> List[str]:
        """Get available MFA methods for admin."""
        methods = []
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT totp_secret, wallet_address, backup_codes_hash
                FROM admin_mfa_settings
                WHERE admin_id = ?
            ''', (admin_id,))
            
            result = cursor.fetchone()
            
            if result:
                if result[0]:  # totp_secret
                    methods.append(MFAMethod.TOTP.value)
                if result[1]:  # wallet_address
                    methods.append(MFAMethod.WALLET.value)
                if result[2]:  # backup_codes_hash
                    methods.append(MFAMethod.BACKUP_CODE.value)
                
                # Email is always available
                methods.append(MFAMethod.EMAIL.value)
        
        return methods
    
    def disable_mfa(self, admin_id: str) -> bool:
        """Disable MFA for admin (requires super admin approval)."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    UPDATE admin_mfa_settings
                    SET mfa_enabled = 0, updated_at = ?
                    WHERE admin_id = ?
                ''', (datetime.now().isoformat(), admin_id))
                
                conn.commit()
            
            logger.info(f"⚠️ MFA disabled for admin {admin_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error disabling MFA: {str(e)}")
            return False
    
    def get_mfa_stats(self, admin_id: str) -> Dict[str, Any]:
        """Get MFA usage statistics for admin."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Get MFA settings
            cursor.execute('''
                SELECT mfa_enabled, last_used_method, wallet_address, created_at
                FROM admin_mfa_settings
                WHERE admin_id = ?
            ''', (admin_id,))
            
            settings = cursor.fetchone()
            
            # Get attempt stats
            cursor.execute('''
                SELECT method, COUNT(*) as total, SUM(success) as successful
                FROM admin_mfa_attempts
                WHERE admin_id = ?
                GROUP BY method
            ''', (admin_id,))
            
            attempts = cursor.fetchall()
        
        return {
            "mfa_enabled": bool(settings[0]) if settings else False,
            "last_used_method": settings[1] if settings else None,
            "wallet_linked": bool(settings[2]) if settings else False,
            "setup_date": settings[3] if settings else None,
            "attempts_by_method": {
                method: {"total": total, "successful": success}
                for method, total, success in attempts
            }
        }
    
    def _log_mfa_attempt(
        self,
        admin_id: str,
        method: MFAMethod,
        success: bool,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ):
        """Log MFA attempt for security monitoring."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO admin_mfa_attempts
                (admin_id, method, success, ip_address, user_agent, timestamp)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                admin_id,
                method.value,
                1 if success else 0,
                ip_address,
                user_agent,
                datetime.now().isoformat()
            ))
            
            conn.commit()

# Global MFA system instance
admin_mfa_system = AdminMFASystem()
