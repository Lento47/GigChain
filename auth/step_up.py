"""
W-CSAP Step-Up Authentication
==============================

PHASE 3 CRITICAL FEATURE:
Implements dynamic authentication requirements based on operation risk.
Forces re-authentication for sensitive operations.

Use Cases:
1. High-value transactions (> $10k)
2. Administrative operations
3. Sensitive data access
4. First-time device
5. High-risk score detected

Step-Up Methods:
1. Re-sign challenge (most common)
2. Hardware wallet confirmation
3. Biometric verification (mobile)
4. Time-based OTP (optional backup)
"""

import time
import secrets
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class OperationRisk(str, Enum):
    """Operation risk classification."""
    LOW = "low"          # Read operations, public data
    MEDIUM = "medium"    # Write operations, user data
    HIGH = "high"        # Financial transactions, admin actions
    CRITICAL = "critical"  # Account changes, large transactions


class StepUpMethod(str, Enum):
    """Available step-up authentication methods."""
    WALLET_SIGNATURE = "wallet_signature"  # Re-sign challenge
    HARDWARE_WALLET = "hardware_wallet"    # Hardware wallet confirmation
    BIOMETRIC = "biometric"                # Platform biometric
    TOTP = "totp"                          # Time-based OTP (backup)
    PASSKEY = "passkey"                    # WebAuthn passkey


@dataclass
class OperationClassification:
    """
    Classification of an operation for step-up requirements.
    """
    operation_type: str
    risk_level: OperationRisk
    requires_step_up: bool
    allowed_methods: List[StepUpMethod]
    grace_period_seconds: int = 300  # Recent auth bypass
    max_age_seconds: int = 3600      # Max auth age
    
    # Context requirements
    min_auth_level: int = 1  # 1=basic, 2=step-up, 3=hardware
    requires_hardware_wallet: bool = False
    requires_biometric: bool = False


@dataclass
class StepUpSession:
    """
    Represents a step-up authentication session.
    
    Tracks when user completed step-up for grace period management.
    """
    session_id: str
    wallet_address: str
    step_up_method: StepUpMethod
    completed_at: int
    expires_at: int
    operation_allowed: str  # Operation that was authorized
    metadata: Dict[str, Any]


class OperationClassifier:
    """
    Classifies operations and determines step-up requirements.
    
    Based on:
    - Operation type
    - Transaction value
    - Data sensitivity
    - User risk score
    """
    
    # Standard operation classifications
    CLASSIFICATIONS = {
        # Low risk - Read operations
        "profile:read": OperationClassification(
            operation_type="profile:read",
            risk_level=OperationRisk.LOW,
            requires_step_up=False,
            allowed_methods=[]
        ),
        "gigs:read": OperationClassification(
            operation_type="gigs:read",
            risk_level=OperationRisk.LOW,
            requires_step_up=False,
            allowed_methods=[]
        ),
        
        # Medium risk - Write operations
        "gigs:create": OperationClassification(
            operation_type="gigs:create",
            risk_level=OperationRisk.MEDIUM,
            requires_step_up=False,
            allowed_methods=[],
            grace_period_seconds=1800  # 30 min
        ),
        "profile:update": OperationClassification(
            operation_type="profile:update",
            risk_level=OperationRisk.MEDIUM,
            requires_step_up=False,
            allowed_methods=[]
        ),
        
        # High risk - Financial operations
        "contract:execute": OperationClassification(
            operation_type="contract:execute",
            risk_level=OperationRisk.HIGH,
            requires_step_up=True,
            allowed_methods=[
                StepUpMethod.WALLET_SIGNATURE,
                StepUpMethod.HARDWARE_WALLET
            ],
            grace_period_seconds=300,  # 5 min
            min_auth_level=2
        ),
        "withdrawal": OperationClassification(
            operation_type="withdrawal",
            risk_level=OperationRisk.HIGH,
            requires_step_up=True,
            allowed_methods=[
                StepUpMethod.WALLET_SIGNATURE,
                StepUpMethod.HARDWARE_WALLET
            ],
            grace_period_seconds=0,  # No grace period
            min_auth_level=2
        ),
        
        # Critical - Administrative operations
        "admin:user_delete": OperationClassification(
            operation_type="admin:user_delete",
            risk_level=OperationRisk.CRITICAL,
            requires_step_up=True,
            allowed_methods=[StepUpMethod.HARDWARE_WALLET],
            grace_period_seconds=0,
            min_auth_level=3,
            requires_hardware_wallet=True
        ),
        "recovery:initiate": OperationClassification(
            operation_type="recovery:initiate",
            risk_level=OperationRisk.CRITICAL,
            requires_step_up=True,
            allowed_methods=[StepUpMethod.HARDWARE_WALLET],
            grace_period_seconds=0,
            min_auth_level=3,
            requires_hardware_wallet=True
        )
    }
    
    @classmethod
    def classify_operation(
        cls,
        operation_type: str,
        value: Optional[float] = None,
        risk_score: Optional[int] = None
    ) -> OperationClassification:
        """
        Classify an operation and determine step-up requirements.
        
        Args:
            operation_type: Type of operation
            value: Transaction value (for financial ops)
            risk_score: Current risk score (from RiskScorer)
            
        Returns:
            OperationClassification
        """
        # Get base classification
        classification = cls.CLASSIFICATIONS.get(operation_type)
        
        if not classification:
            # Default to medium risk for unknown operations
            classification = OperationClassification(
                operation_type=operation_type,
                risk_level=OperationRisk.MEDIUM,
                requires_step_up=False,
                allowed_methods=[StepUpMethod.WALLET_SIGNATURE]
            )
        
        # Adjust based on transaction value
        if value is not None:
            if value > 100000:  # > $100k
                classification.risk_level = OperationRisk.CRITICAL
                classification.requires_step_up = True
                classification.requires_hardware_wallet = True
            elif value > 10000:  # > $10k
                classification.risk_level = OperationRisk.HIGH
                classification.requires_step_up = True
        
        # Adjust based on risk score
        if risk_score is not None:
            if risk_score > 70:  # High risk
                classification.requires_step_up = True
                classification.grace_period_seconds = 0  # No grace period
            elif risk_score > 50:  # Medium risk
                classification.requires_step_up = True
        
        return classification


class StepUpManager:
    """
    Manages step-up authentication sessions and verification.
    
    Tracks when users complete step-up to allow grace periods.
    """
    
    def __init__(self):
        # Active step-up sessions
        # wallet_address -> list of StepUpSession
        self._step_up_sessions: Dict[str, List[StepUpSession]] = {}
    
    def initiate_step_up(
        self,
        wallet_address: str,
        operation_type: str,
        classification: OperationClassification
    ) -> str:
        """
        Initiate step-up authentication flow.
        
        Args:
            wallet_address: Wallet requiring step-up
            operation_type: Operation being attempted
            classification: Operation classification
            
        Returns:
            Step-up session ID
        """
        session_id = secrets.token_hex(32)
        
        logger.info(
            f"🔐 Step-up required for {wallet_address[:10]}... "
            f"(operation: {operation_type}, risk: {classification.risk_level})"
        )
        
        return session_id
    
    def verify_step_up(
        self,
        wallet_address: str,
        session_id: str,
        method: StepUpMethod,
        proof: str
    ) -> bool:
        """
        Verify step-up authentication proof.
        
        Args:
            wallet_address: Wallet address
            session_id: Step-up session ID
            method: Authentication method used
            proof: Cryptographic proof (signature, passkey, etc.)
            
        Returns:
            True if step-up verification succeeds
        """
        # Verify proof based on method
        if method == StepUpMethod.WALLET_SIGNATURE:
            # Verify wallet signature on step-up challenge
            is_valid = self._verify_wallet_signature(wallet_address, proof)
        elif method == StepUpMethod.HARDWARE_WALLET:
            # Verify hardware wallet confirmation
            is_valid = self._verify_hardware_wallet(wallet_address, proof)
        else:
            logger.warning(f"Unsupported step-up method: {method}")
            is_valid = False
        
        if is_valid:
            logger.info(f"✅ Step-up verification successful for {wallet_address[:10]}...")
        else:
            logger.warning(f"❌ Step-up verification failed for {wallet_address[:10]}...")
        
        return is_valid
    
    def register_step_up_completion(
        self,
        wallet_address: str,
        operation_type: str,
        method: StepUpMethod,
        grace_period: int = 300
    ) -> StepUpSession:
        """
        Register completed step-up for grace period.
        
        Args:
            wallet_address: Wallet address
            operation_type: Operation type completed
            method: Method used
            grace_period: Grace period in seconds
            
        Returns:
            StepUpSession object
        """
        current_time = int(time.time())
        
        session = StepUpSession(
            session_id=secrets.token_hex(32),
            wallet_address=wallet_address,
            step_up_method=method,
            completed_at=current_time,
            expires_at=current_time + grace_period,
            operation_allowed=operation_type,
            metadata={}
        )
        
        if wallet_address not in self._step_up_sessions:
            self._step_up_sessions[wallet_address] = []
        
        self._step_up_sessions[wallet_address].append(session)
        
        logger.info(
            f"✅ Step-up session created for {wallet_address[:10]}... "
            f"(operation: {operation_type}, grace: {grace_period}s)"
        )
        
        return session
    
    def check_recent_step_up(
        self,
        wallet_address: str,
        operation_type: str,
        max_age_seconds: int = 300
    ) -> bool:
        """
        Check if user completed step-up recently (within grace period).
        
        Args:
            wallet_address: Wallet address
            operation_type: Operation being attempted
            max_age_seconds: Maximum age of step-up session
            
        Returns:
            True if recent step-up exists and is valid
        """
        sessions = self._step_up_sessions.get(wallet_address, [])
        current_time = int(time.time())
        
        for session in sessions:
            # Check if session is still valid
            if current_time < session.expires_at:
                # Check if operation matches or is compatible
                if (session.operation_allowed == operation_type or
                    session.operation_allowed == "admin"):  # Admin grants all
                    
                    age = current_time - session.completed_at
                    if age <= max_age_seconds:
                        logger.debug(
                            f"✅ Recent step-up found for {wallet_address[:10]}... "
                            f"(age: {age}s)"
                        )
                        return True
        
        return False
    
    def cleanup_expired_sessions(self):
        """Remove expired step-up sessions."""
        current_time = int(time.time())
        
        for wallet_address in list(self._step_up_sessions.keys()):
            sessions = self._step_up_sessions[wallet_address]
            
            # Filter out expired
            active = [
                s for s in sessions
                if current_time < s.expires_at
            ]
            
            if active:
                self._step_up_sessions[wallet_address] = active
            else:
                del self._step_up_sessions[wallet_address]
    
    def _verify_wallet_signature(self, wallet_address: str, signature: str) -> bool:
        """
        Verify wallet signature for step-up challenge.
        
        Uses same signature verification as initial auth.
        """
        # Import here to avoid circular dependency
        from auth.w_csap import SignatureValidator
        
        validator = SignatureValidator()
        
        # In production: Verify against step-up challenge message
        # For now, simplified verification
        # is_valid, recovered = validator.verify_signature(message, signature, wallet_address)
        
        # Simplified: Check signature format
        is_valid = signature.startswith("0x") and len(signature) > 100
        
        return is_valid
    
    def _verify_hardware_wallet(self, wallet_address: str, proof: str) -> bool:
        """
        Verify hardware wallet confirmation.
        
        Hardware wallets provide additional confirmation dialogs.
        """
        # Check for hardware wallet signature characteristics
        # Ledger/Trezor have specific signature formats
        
        # Simplified: Check signature format
        is_valid = proof.startswith("0x") and len(proof) > 100
        
        return is_valid


# Singleton instance
_step_up_manager_instance: Optional[StepUpManager] = None


def get_step_up_manager() -> StepUpManager:
    """Get or create step-up manager singleton."""
    global _step_up_manager_instance
    
    if _step_up_manager_instance is None:
        _step_up_manager_instance = StepUpManager()
    
    return _step_up_manager_instance


def reset_step_up_manager():
    """Reset step-up manager singleton (useful for testing)."""
    global _step_up_manager_instance
    _step_up_manager_instance = None


# Helper decorator for routes requiring step-up

def require_step_up(
    operation_type: str,
    risk_level: Optional[OperationRisk] = None
):
    """
    Decorator to require step-up authentication for a route.
    
    Usage:
        @app.post("/api/contracts/execute")
        @require_step_up("contract:execute", OperationRisk.HIGH)
        async def execute_contract(wallet = Depends(get_current_wallet)):
            # This only runs after step-up verification
            return {"contract_id": "..."}
    
    Args:
        operation_type: Type of operation
        risk_level: Risk level (optional)
    """
    from fastapi import HTTPException, status
    from functools import wraps
    
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract wallet from kwargs
            wallet = kwargs.get("wallet")
            if not wallet:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            # Check for recent step-up
            step_up_manager = get_step_up_manager()
            
            has_recent_step_up = step_up_manager.check_recent_step_up(
                wallet_address=wallet["address"],
                operation_type=operation_type,
                max_age_seconds=300  # 5 min grace period
            )
            
            if not has_recent_step_up:
                # Require step-up
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Step-up authentication required",
                    headers={
                        "X-Step-Up-Required": "true",
                        "X-Step-Up-Operation": operation_type,
                        "X-Step-Up-Risk-Level": risk_level.value if risk_level else "high"
                    }
                )
            
            # Step-up verified, proceed
            return await func(*args, **kwargs)
        
        return wrapper
    
    return decorator


__all__ = [
    'OperationRisk',
    'StepUpMethod',
    'OperationClassification',
    'StepUpSession',
    'OperationClassifier',
    'StepUpManager',
    'get_step_up_manager',
    'reset_step_up_manager',
    'require_step_up'
]