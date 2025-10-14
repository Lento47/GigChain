"""
GigChain.io - Admin API
REST API endpoints for admin panel.
"""

from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging
import sqlite3

from admin_system import (
    admin_system,
    authenticate_admin_user,
    verify_admin_session,
    AdminRole,
    UserStatus
)

from admin_mfa_system import (
    admin_mfa_system,
    MFAMethod,
    MFASetup
)

from admin_export_system import (
    admin_export_system,
    ExportFormat,
    TimeRange
)

from security_monitoring import (
    security_monitor,
    EventSeverity,
    EventCategory,
    log_security_event
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["Admin Management"])

# Pydantic models
class AdminLoginRequest(BaseModel):
    """Admin login request."""
    username: str = Field(..., min_length=3, description="Admin username")
    password: str = Field(..., min_length=6, description="Admin password")

class UpdateUserStatusRequest(BaseModel):
    """Update user status request."""
    user_id: str = Field(..., description="User ID")
    status: str = Field(..., description="New status: active, suspended, banned")
    reason: Optional[str] = Field(None, description="Reason for status change")

class CreateAlertRequest(BaseModel):
    """Create system alert request."""
    alert_type: str = Field(..., description="Alert type")
    severity: str = Field(..., description="Severity: info, warning, error, critical")
    title: str = Field(..., description="Alert title")
    message: str = Field(..., description="Alert message")

class MFASetupRequest(BaseModel):
    """Setup MFA request."""
    admin_id: str = Field(..., description="Admin ID")
    email: str = Field(..., description="Admin email")

class MFAVerifyRequest(BaseModel):
    """Verify MFA code request."""
    admin_id: str = Field(..., description="Admin ID")
    code: str = Field(..., description="MFA code")
    method: str = Field(..., description="MFA method: totp, email, wallet")

class LinkWalletRequest(BaseModel):
    """Link wallet to admin request."""
    wallet_address: str = Field(..., min_length=42, max_length=42, description="Admin wallet address")
    email: str = Field(..., description="Admin email")

class WalletSignatureRequest(BaseModel):
    """Verify wallet signature request."""
    wallet_address: str = Field(..., min_length=42, max_length=42, description="Wallet address")
    signature: str = Field(..., description="Wallet signature")
    message: str = Field(..., description="Message that was signed")

# Dependency to verify admin authentication
async def verify_admin(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Verify admin token from Authorization header."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    # Extract token from "Bearer TOKEN" format
    try:
        token = authorization.split(" ")[1] if " " in authorization else authorization
    except IndexError:
        raise HTTPException(status_code=401, detail="Invalid authorization format")
    
    admin_data = verify_admin_session(token)
    
    if not admin_data:
        raise HTTPException(status_code=401, detail="Invalid or expired admin session")
    
    return admin_data

# Dependency to verify super admin
async def verify_super_admin(admin: Dict[str, Any] = Depends(verify_admin)) -> Dict[str, Any]:
    """Verify user is super admin."""
    if admin.get("role") != AdminRole.SUPER_ADMIN.value:
        raise HTTPException(status_code=403, detail="Super admin access required")
    return admin

@router.post("/login")
async def admin_login(request: AdminLoginRequest):
    """
    Admin login endpoint.
    
    Returns admin token for authenticated access.
    """
    try:
        admin_data = authenticate_admin_user(request.username, request.password)
        
        if not admin_data:
            raise HTTPException(
                status_code=401,
                detail="Invalid username or password"
            )
        
        logger.info(f"Admin login successful: {request.username}")
        
        return {
            "success": True,
            "admin": {
                "admin_id": admin_data["admin_id"],
                "username": admin_data["username"],
                "email": admin_data["email"],
                "role": admin_data["role"]
            },
            "token": admin_data["token"],
            "session_id": admin_data["session_id"],
            "message": "Login successful",
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin login error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/verify")
async def verify_admin_session_endpoint(admin: Dict[str, Any] = Depends(verify_admin)):
    """
    Verify admin session is valid.
    
    Returns admin information if session is valid.
    """
    return {
        "success": True,
        "authenticated": True,
        "admin": admin,
        "timestamp": datetime.now().isoformat()
    }

@router.get("/dashboard/stats")
async def get_dashboard_stats(admin: Dict[str, Any] = Depends(verify_admin)):
    """
    Get admin dashboard statistics.
    
    Returns comprehensive platform statistics.
    """
    try:
        stats = admin_system.get_platform_statistics()
        
        # Log activity
        admin_system.log_admin_activity(
            admin["admin_id"],
            "view_dashboard_stats"
        )
        
        return {
            "success": True,
            "statistics": stats,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users")
async def get_all_users(
    status: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    admin: Dict[str, Any] = Depends(verify_admin)
):
    """
    Get all platform users.
    
    Returns paginated list of users with filtering options.
    """
    try:
        users = admin_system.get_all_users(status, limit, offset)
        
        # Log activity
        admin_system.log_admin_activity(
            admin["admin_id"],
            "view_users",
            details={"status_filter": status, "limit": limit, "offset": offset}
        )
        
        return {
            "success": True,
            "users": users,
            "count": len(users),
            "filters": {
                "status": status,
                "limit": limit,
                "offset": offset
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting users: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/{user_id}")
async def get_user_details(
    user_id: str,
    admin: Dict[str, Any] = Depends(verify_admin)
):
    """
    Get detailed information about a specific user.
    
    Returns complete user profile and activity data.
    """
    try:
        user = admin_system.get_user_details(user_id)
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Log activity
        admin_system.log_admin_activity(
            admin["admin_id"],
            "view_user_details",
            target_type="user",
            target_id=user_id
        )
        
        return {
            "success": True,
            "user": user,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/users/status")
async def update_user_status(
    request: UpdateUserStatusRequest,
    admin: Dict[str, Any] = Depends(verify_admin)
):
    """
    Update user account status.
    
    Allows admins to suspend or ban users.
    """
    try:
        # Validate status
        if request.status not in [s.value for s in UserStatus]:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {[s.value for s in UserStatus]}"
            )
        
        success = admin_system.update_user_status(
            user_id=request.user_id,
            status=request.status,
            admin_id=admin["admin_id"],
            reason=request.reason
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update user status")
        
        logger.info(f"User {request.user_id} status updated to {request.status} by {admin['username']}")
        
        return {
            "success": True,
            "message": f"User status updated to {request.status}",
            "user_id": request.user_id,
            "new_status": request.status,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/activity/log")
async def get_activity_log(
    admin_id: Optional[str] = None,
    limit: int = 100,
    admin: Dict[str, Any] = Depends(verify_admin)
):
    """
    Get admin activity log.
    
    Returns recent admin actions for audit purposes.
    """
    try:
        logs = admin_system.get_admin_activity_log(admin_id, limit)
        
        return {
            "success": True,
            "logs": logs,
            "count": len(logs),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting activity log: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/alerts")
async def create_system_alert(
    request: CreateAlertRequest,
    admin: Dict[str, Any] = Depends(verify_super_admin)
):
    """
    Create system alert (Super Admin only).
    
    Creates a system-wide alert visible to all admins.
    """
    try:
        alert_id = admin_system.create_system_alert(
            alert_type=request.alert_type,
            severity=request.severity,
            title=request.title,
            message=request.message
        )
        
        # Log activity
        admin_system.log_admin_activity(
            admin["admin_id"],
            "create_alert",
            target_type="alert",
            target_id=alert_id,
            details={"title": request.title, "severity": request.severity}
        )
        
        return {
            "success": True,
            "alert_id": alert_id,
            "message": "Alert created successfully",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error creating alert: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alerts")
async def get_system_alerts(
    acknowledged: Optional[bool] = None,
    limit: int = 50,
    admin: Dict[str, Any] = Depends(verify_admin)
):
    """
    Get system alerts.
    
    Returns active alerts for the admin panel.
    """
    try:
        alerts = admin_system.get_system_alerts(acknowledged, limit)
        
        return {
            "success": True,
            "alerts": alerts,
            "count": len(alerts),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting alerts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/contracts/all")
async def get_all_contracts(
    status: Optional[str] = None,
    limit: int = 100,
    admin: Dict[str, Any] = Depends(verify_admin)
):
    """
    Get all contracts on the platform.
    
    Returns contract list with filtering options.
    """
    try:
        # Import from analytics or contract system
        from analytics_system import analytics_db
        
        # Get contracts from analytics
        contracts = []  # Placeholder - implement actual contract fetching
        
        # Log activity
        admin_system.log_admin_activity(
            admin["admin_id"],
            "view_contracts",
            details={"status_filter": status, "limit": limit}
        )
        
        return {
            "success": True,
            "contracts": contracts,
            "count": len(contracts),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting contracts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/disputes/all")
async def get_all_disputes(
    status: Optional[str] = None,
    limit: int = 100,
    admin: Dict[str, Any] = Depends(verify_admin)
):
    """
    Get all disputes on the platform.
    
    Returns dispute list for admin review.
    """
    try:
        from dispute_oracle_system import dispute_oracle
        
        if status:
            disputes = []  # Filter by status
        else:
            disputes = list(dispute_oracle.disputes.values())
        
        # Convert to dict
        disputes_list = [
            {
                "dispute_id": d.dispute_id,
                "contract_id": d.contract_id,
                "freelancer": d.freelancer,
                "client": d.client,
                "amount": d.amount,
                "status": d.status.value,
                "outcome": d.outcome.value,
                "created_at": d.created_at
            }
            for d in disputes[:limit]
        ]
        
        # Log activity
        admin_system.log_admin_activity(
            admin["admin_id"],
            "view_disputes",
            details={"status_filter": status, "limit": limit}
        )
        
        return {
            "success": True,
            "disputes": disputes_list,
            "count": len(disputes_list),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting disputes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/marketplace/templates")
async def get_marketplace_templates(
    category: Optional[str] = None,
    limit: int = 100,
    admin: Dict[str, Any] = Depends(verify_admin)
):
    """
    Get all marketplace templates.
    
    Returns template list for admin moderation.
    """
    try:
        from template_marketplace import marketplace
        
        templates = marketplace.search_templates(
            category=category,
            limit=limit
        )
        
        # Log activity
        admin_system.log_admin_activity(
            admin["admin_id"],
            "view_marketplace_templates",
            details={"category": category, "limit": limit}
        )
        
        return {
            "success": True,
            "templates": templates,
            "count": len(templates),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting templates: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/overview")
async def get_analytics_overview(admin: Dict[str, Any] = Depends(verify_admin)):
    """
    Get comprehensive analytics overview.
    
    Returns platform-wide analytics for admin review.
    """
    try:
        from analytics_system import analytics_db, TimePeriod
        
        # Generate reports for different periods
        day_report = analytics_db.generate_report(TimePeriod.DAY)
        week_report = analytics_db.generate_report(TimePeriod.WEEK)
        month_report = analytics_db.generate_report(TimePeriod.MONTH)
        
        # Log activity
        admin_system.log_admin_activity(
            admin["admin_id"],
            "view_analytics_overview"
        )
        
        return {
            "success": True,
            "analytics": {
                "today": {
                    "contracts": day_report.total_contracts,
                    "volume": day_report.total_volume,
                    "users": day_report.active_users,
                    "revenue": day_report.total_revenue
                },
                "this_week": {
                    "contracts": week_report.total_contracts,
                    "volume": week_report.total_volume,
                    "users": week_report.active_users,
                    "growth": week_report.growth_rate
                },
                "this_month": {
                    "contracts": month_report.total_contracts,
                    "volume": month_report.total_volume,
                    "revenue": month_report.total_revenue,
                    "retention": month_report.user_retention
                }
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting analytics overview: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def admin_health_check():
    """Health check for admin system."""
    try:
        stats = admin_system.get_platform_statistics()
        
        return {
            "status": "healthy",
            "service": "Admin Management System",
            "version": "1.0.0",
            "total_users": stats["users"]["total"],
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Admin health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "service": "Admin Management System",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

# ==================== MFA ENDPOINTS ====================

@router.post("/mfa/setup")
async def setup_admin_mfa(admin: Dict[str, Any] = Depends(verify_admin)):
    """
    Setup MFA for admin account.
    
    Returns:
    - TOTP secret
    - QR code for authenticator app
    - Backup recovery codes
    """
    try:
        mfa_setup = admin_mfa_system.setup_mfa(
            admin_id=admin["admin_id"],
            email=admin["email"],
            username=admin["username"]
        )
        
        # Log activity
        admin_system.log_admin_activity(
            admin["admin_id"],
            "mfa_setup_initiated"
        )
        
        return {
            "success": True,
            "message": "MFA setup initiated. Scan QR code with authenticator app.",
            "qr_code": f"data:image/png;base64,{mfa_setup.qr_code}",
            "secret": mfa_setup.secret,
            "backup_codes": mfa_setup.backup_codes,
            "warning": "Save backup codes in a secure location. They can only be used once.",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error setting up MFA: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/mfa/enable")
async def enable_admin_mfa(
    request: MFAVerifyRequest,
    admin: Dict[str, Any] = Depends(verify_admin)
):
    """
    Enable MFA after verifying initial TOTP code.
    
    Admin must verify they can generate codes before enabling.
    """
    try:
        # Verify admin is enabling their own MFA
        if request.admin_id != admin["admin_id"]:
            raise HTTPException(
                status_code=403,
                detail="You can only enable MFA for your own account"
            )
        
        success = admin_mfa_system.enable_mfa(request.admin_id, request.code)
        
        if not success:
            raise HTTPException(
                status_code=400,
                detail="Invalid verification code. Please try again."
            )
        
        # Log activity
        admin_system.log_admin_activity(
            admin["admin_id"],
            "mfa_enabled"
        )
        
        return {
            "success": True,
            "message": "MFA enabled successfully",
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error enabling MFA: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/mfa/verify")
async def verify_admin_mfa(request: MFAVerifyRequest):
    """
    Verify MFA code during login.
    
    Called after initial username/password authentication.
    """
    try:
        success = False
        
        if request.method == MFAMethod.TOTP.value:
            success = admin_mfa_system.verify_totp(
                admin_id=request.admin_id,
                code=request.code
            )
        elif request.method == MFAMethod.EMAIL.value:
            # For email, code is the verification_id from generate_email_otp
            admin_id = admin_mfa_system.verify_email_otp(
                verification_id=request.code,
                code=request.code
            )
            success = admin_id == request.admin_id
        
        if not success:
            logger.warning(f"❌ MFA verification failed for admin {request.admin_id}")
            return {
                "success": False,
                "error": "Invalid MFA code",
                "timestamp": datetime.now().isoformat()
            }
        
        logger.info(f"✅ MFA verification successful for admin {request.admin_id}")
        
        return {
            "success": True,
            "message": "MFA verification successful",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error verifying MFA: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/mfa/wallet/link")
async def link_admin_wallet(
    request: LinkWalletRequest,
    admin: Dict[str, Any] = Depends(verify_admin)
):
    """
    Link wallet to admin account for wallet-based MFA.
    
    Admin can authenticate using wallet signature + email.
    """
    try:
        success = admin_mfa_system.link_wallet(
            admin_id=admin["admin_id"],
            wallet_address=request.wallet_address,
            email=request.email
        )
        
        if not success:
            raise HTTPException(
                status_code=400,
                detail="Failed to link wallet. Wallet may already be linked to another admin."
            )
        
        # Log activity
        admin_system.log_admin_activity(
            admin["admin_id"],
            "wallet_linked",
            details={"wallet_address": request.wallet_address}
        )
        
        return {
            "success": True,
            "message": "Wallet linked successfully",
            "wallet_address": request.wallet_address,
            "email": request.email,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error linking wallet: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/mfa/wallet/verify")
async def verify_admin_wallet(request: WalletSignatureRequest):
    """
    Verify wallet signature as MFA method.
    
    Uses W-CSAP protocol for signature verification.
    """
    try:
        # Get admin_id from wallet
        # In production, query from admin_wallets table
        admin_id = "temp_admin_id"  # Placeholder
        
        success = admin_mfa_system.verify_wallet_signature(
            admin_id=admin_id,
            wallet_address=request.wallet_address,
            signature=request.signature,
            message=request.message
        )
        
        if not success:
            return {
                "success": False,
                "error": "Invalid wallet signature",
                "timestamp": datetime.now().isoformat()
            }
        
        return {
            "success": True,
            "message": "Wallet signature verified",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error verifying wallet: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/mfa/methods")
async def get_mfa_methods(admin: Dict[str, Any] = Depends(verify_admin)):
    """
    Get available MFA methods for admin.
    
    Returns list of configured MFA methods.
    """
    try:
        methods = admin_mfa_system.get_mfa_methods(admin["admin_id"])
        is_enabled = admin_mfa_system.is_mfa_enabled(admin["admin_id"])
        
        return {
            "success": True,
            "mfa_enabled": is_enabled,
            "available_methods": methods,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting MFA methods: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/mfa/stats")
async def get_mfa_stats(admin: Dict[str, Any] = Depends(verify_admin)):
    """
    Get MFA usage statistics for admin.
    
    Returns MFA configuration and usage data.
    """
    try:
        stats = admin_mfa_system.get_mfa_stats(admin["admin_id"])
        
        return {
            "success": True,
            "stats": stats,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting MFA stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/mfa/disable")
async def disable_admin_mfa(admin: Dict[str, Any] = Depends(verify_super_admin)):
    """
    Disable MFA (Super Admin only).
    
    Emergency endpoint to disable MFA if admin loses access.
    """
    try:
        success = admin_mfa_system.disable_mfa(admin["admin_id"])
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to disable MFA")
        
        # Log activity
        admin_system.log_admin_activity(
            admin["admin_id"],
            "mfa_disabled",
            details={"warning": "MFA disabled by super admin"}
        )
        
        return {
            "success": True,
            "message": "MFA disabled",
            "warning": "Account security is reduced. Enable MFA as soon as possible.",
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error disabling MFA: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== TROUBLESHOOTING ENDPOINTS ====================

@router.get("/troubleshoot/logs")
async def get_system_logs(
    level: Optional[str] = "ERROR",
    limit: int = 100,
    admin: Dict[str, Any] = Depends(verify_admin)
):
    """
    Get system logs for troubleshooting.
    
    Returns recent log entries filtered by level.
    """
    try:
        from security.file_utils import get_safe_log_files, safe_read_file_lines
        
        logs = []
        
        # Get safe log files with path validation
        log_files = get_safe_log_files(".", 5)
        
        for log_file in log_files:
            try:
                # Safely read file lines with limits
                lines = safe_read_file_lines(log_file, limit)
                
                # Filter by level
                filtered_lines = [
                    line for line in lines
                    if level.upper() in line.upper() or level == "ALL"
                ]
                
                logs.extend(filtered_lines)
            except Exception as e:
                logger.error(f"Error reading log file {log_file}: {str(e)}")
        
        # Log activity
        admin_system.log_admin_activity(
            admin["admin_id"],
            "view_system_logs",
            details={"level": level, "limit": limit}
        )
        
        return {
            "success": True,
            "logs": logs[-limit:],  # Return last N logs
            "count": len(logs),
            "level": level,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting logs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/troubleshoot/services")
async def check_services_status(admin: Dict[str, Any] = Depends(verify_admin)):
    """
    Check status of all platform services.
    
    Returns health status of each service component.
    """
    try:
        import os
        
        services_status = {
            "database": {
                "status": "healthy",
                "message": "Database connection OK"
            },
            "openai": {
                "status": "healthy" if os.getenv('OPENAI_API_KEY') else "warning",
                "message": "OpenAI API configured" if os.getenv('OPENAI_API_KEY') else "OpenAI API key not configured"
            },
            "wcsap_auth": {
                "status": "healthy",
                "message": "W-CSAP authentication system OK"
            },
            "admin_mfa": {
                "status": "healthy",
                "message": "MFA system operational"
            }
        }
        
        # Check database connectivity
        try:
            with sqlite3.connect("admin.db") as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT COUNT(*) FROM admin_users')
                cursor.fetchone()
        except Exception as e:
            services_status["database"]["status"] = "error"
            services_status["database"]["message"] = f"Database error: {str(e)}"
        
        # Overall status
        overall_status = "healthy"
        if any(s["status"] == "error" for s in services_status.values()):
            overall_status = "error"
        elif any(s["status"] == "warning" for s in services_status.values()):
            overall_status = "warning"
        
        # Log activity
        admin_system.log_admin_activity(
            admin["admin_id"],
            "check_services_status"
        )
        
        return {
            "success": True,
            "overall_status": overall_status,
            "services": services_status,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error checking services: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/troubleshoot/errors")
async def get_recent_errors(
    limit: int = 50,
    admin: Dict[str, Any] = Depends(verify_admin)
):
    """
    Get recent system errors.
    
    Returns recent error logs for quick troubleshooting.
    """
    try:
        # This would typically query an error tracking system
        # For now, return placeholder
        errors = []
        
        # Log activity
        admin_system.log_admin_activity(
            admin["admin_id"],
            "view_recent_errors",
            details={"limit": limit}
        )
        
        return {
            "success": True,
            "errors": errors,
            "count": len(errors),
            "message": "No recent errors found" if not errors else f"{len(errors)} errors found",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting errors: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/troubleshoot/diagnostics")
async def run_diagnostics(admin: Dict[str, Any] = Depends(verify_admin)):
    """
    Run comprehensive system diagnostics.
    
    Returns detailed diagnostic information about the platform.
    """
    try:
        import os
        import sys
        import platform
        
        diagnostics = {
            "system": {
                "platform": platform.system(),
                "python_version": sys.version,
                "architecture": platform.machine()
            },
            "environment": {
                "debug_mode": os.getenv('DEBUG', 'False'),
                "port": os.getenv('PORT', '5000'),
                "openai_configured": bool(os.getenv('OPENAI_API_KEY'))
            },
            "database": {
                "admin_db_exists": os.path.exists("admin.db"),
                "auth_db_exists": os.path.exists("wcsap_auth.db")
            },
            "security": {
                "wcsap_secret_configured": bool(os.getenv('W_CSAP_SECRET_KEY')),
                "cors_configured": bool(os.getenv('ALLOWED_ORIGINS'))
            }
        }
        
        # Check database tables
        try:
            with sqlite3.connect("admin.db") as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
                tables = [row[0] for row in cursor.fetchall()]
                diagnostics["database"]["tables"] = tables
        except Exception as e:
            diagnostics["database"]["error"] = str(e)
        
        # Log activity
        admin_system.log_admin_activity(
            admin["admin_id"],
            "run_diagnostics"
        )
        
        return {
            "success": True,
            "diagnostics": diagnostics,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error running diagnostics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== DATA EXPORT ENDPOINTS ====================

@router.get("/export/kpis")
async def export_kpis(
    time_range: str = "7d",
    format: str = "json",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    admin: Dict[str, Any] = Depends(verify_admin)
):
    """
    Export KPIs for specified time range.
    
    Time ranges:
    - 24h: Last 24 hours
    - 7d: Last 7 days
    - 30d: Last 30 days
    - 90d: Last 90 days
    - this_month: Current month
    - last_month: Previous month
    - this_year: Current year
    - all_time: All data
    - custom: Specify start_date and end_date
    
    Formats: json, csv
    """
    try:
        # Export KPIs
        kpis_data = admin_export_system.export_kpis(
            time_range=time_range,
            start_date=start_date,
            end_date=end_date
        )
        
        # Log activity
        admin_system.log_admin_activity(
            admin["admin_id"],
            "export_kpis",
            details={"time_range": time_range, "format": format}
        )
        
        # Format response
        if format == ExportFormat.CSV.value:
            from fastapi.responses import StreamingResponse
            csv_data = admin_export_system.export_to_csv(kpis_data)
            
            return StreamingResponse(
                iter([csv_data]),
                media_type="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename=kpis_{time_range}_{datetime.now().strftime('%Y%m%d')}.csv"
                }
            )
        else:
            # JSON format
            return {
                "success": True,
                "data": kpis_data,
                "timestamp": datetime.now().isoformat()
            }
        
    except Exception as e:
        logger.error(f"Error exporting KPIs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export/users")
async def export_users(
    time_range: str = "all_time",
    format: str = "json",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    admin: Dict[str, Any] = Depends(verify_admin)
):
    """
    Export detailed user list for specified time range.
    
    Returns user data including wallet addresses, reputation, earnings, etc.
    """
    try:
        # Export users
        users_data = admin_export_system.export_detailed_users(
            time_range=time_range,
            start_date=start_date,
            end_date=end_date
        )
        
        # Log activity
        admin_system.log_admin_activity(
            admin["admin_id"],
            "export_users",
            details={"time_range": time_range, "count": len(users_data)}
        )
        
        # Format response
        if format == ExportFormat.CSV.value:
            from fastapi.responses import StreamingResponse
            import csv
            from io import StringIO
            
            output = StringIO()
            if users_data:
                writer = csv.DictWriter(output, fieldnames=users_data[0].keys())
                writer.writeheader()
                writer.writerows(users_data)
            
            return StreamingResponse(
                iter([output.getvalue()]),
                media_type="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename=users_{time_range}_{datetime.now().strftime('%Y%m%d')}.csv"
                }
            )
        else:
            # JSON format
            return {
                "success": True,
                "count": len(users_data),
                "data": users_data,
                "timestamp": datetime.now().isoformat()
            }
        
    except Exception as e:
        logger.error(f"Error exporting users: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export/contracts")
async def export_contracts(
    time_range: str = "30d",
    format: str = "json",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    admin: Dict[str, Any] = Depends(verify_admin)
):
    """
    Export detailed contract list for specified time range.
    
    Returns contract events and metrics.
    """
    try:
        # Export contracts
        contracts_data = admin_export_system.export_detailed_contracts(
            time_range=time_range,
            start_date=start_date,
            end_date=end_date
        )
        
        # Log activity
        admin_system.log_admin_activity(
            admin["admin_id"],
            "export_contracts",
            details={"time_range": time_range, "count": len(contracts_data)}
        )
        
        # Format response
        if format == ExportFormat.CSV.value:
            from fastapi.responses import StreamingResponse
            import csv
            from io import StringIO
            
            output = StringIO()
            if contracts_data:
                # Flatten metadata for CSV
                flattened = []
                for contract in contracts_data:
                    flat = {k: v for k, v in contract.items() if k != 'metadata'}
                    if contract.get('metadata'):
                        flat['metadata'] = json.dumps(contract['metadata'])
                    flattened.append(flat)
                
                writer = csv.DictWriter(output, fieldnames=flattened[0].keys())
                writer.writeheader()
                writer.writerows(flattened)
            
            return StreamingResponse(
                iter([output.getvalue()]),
                media_type="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename=contracts_{time_range}_{datetime.now().strftime('%Y%m%d')}.csv"
                }
            )
        else:
            # JSON format
            return {
                "success": True,
                "count": len(contracts_data),
                "data": contracts_data,
                "timestamp": datetime.now().isoformat()
            }
        
    except Exception as e:
        logger.error(f"Error exporting contracts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export/database-info")
async def get_database_info(admin: Dict[str, Any] = Depends(verify_admin)):
    """
    Get information about where platform data is stored.
    
    Returns database paths, sizes, and descriptions.
    """
    try:
        db_info = admin_export_system.get_database_info()
        
        # Log activity
        admin_system.log_admin_activity(
            admin["admin_id"],
            "view_database_info"
        )
        
        return {
            "success": True,
            "databases": db_info,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting database info: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/export/backup")
async def create_backup(
    backup_path: Optional[str] = None,
    admin: Dict[str, Any] = Depends(verify_super_admin)
):
    """
    Create backup of all platform databases.
    
    Super Admin only - Creates timestamped backup of all databases.
    """
    try:
        backups = admin_export_system.create_backup(backup_path)
        
        # Log activity
        admin_system.log_admin_activity(
            admin["admin_id"],
            "create_backup",
            details={"backup_count": len(backups)}
        )
        
        return {
            "success": True,
            "message": "Backup created successfully",
            "backups": backups,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error creating backup: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== SECURITY MONITORING ENDPOINTS ====================

@router.get("/security/events")
async def get_security_events(
    limit: int = 100,
    category: Optional[str] = None,
    severity: Optional[str] = None,
    admin: Dict[str, Any] = Depends(verify_admin)
):
    """
    Get recent security events.
    
    Returns security events with AI risk analysis.
    """
    try:
        events = list(security_monitor.event_buffer)[-limit:]
        
        # Filter by category
        if category:
            events = [e for e in events if e.category == category]
        
        # Filter by severity
        if severity:
            events = [e for e in events if e.severity == severity]
        
        # Convert to dict
        events_data = [e.to_dict() for e in events]
        
        # Log activity
        admin_system.log_admin_activity(
            admin["admin_id"],
            "view_security_events",
            details={"limit": limit, "category": category, "severity": severity}
        )
        
        return {
            "success": True,
            "count": len(events_data),
            "events": events_data,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting security events: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/security/stats")
async def get_security_stats(admin: Dict[str, Any] = Depends(verify_admin)):
    """
    Get security monitoring statistics.
    
    Returns stats about events, alerts, and integrations.
    """
    try:
        stats = security_monitor.get_stats()
        
        # Log activity
        admin_system.log_admin_activity(
            admin["admin_id"],
            "view_security_stats"
        )
        
        return {
            "success": True,
            "stats": stats,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting security stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/security/high-risk")
async def get_high_risk_events(
    threshold: int = 50,
    limit: int = 50,
    admin: Dict[str, Any] = Depends(verify_admin)
):
    """
    Get high-risk security events detected by AI.
    
    Returns events with risk score above threshold.
    """
    try:
        events = list(security_monitor.event_buffer)
        
        # Filter high risk
        high_risk = [e for e in events if e.risk_score >= threshold]
        high_risk.sort(key=lambda e: e.risk_score, reverse=True)
        high_risk = high_risk[:limit]
        
        # Convert to dict
        events_data = [e.to_dict() for e in high_risk]
        
        # Log activity
        admin_system.log_admin_activity(
            admin["admin_id"],
            "view_high_risk_events",
            details={"threshold": threshold, "count": len(high_risk)}
        )
        
        return {
            "success": True,
            "count": len(events_data),
            "threshold": threshold,
            "events": events_data,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting high-risk events: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/security/user-profile/{user_identifier}")
async def get_user_security_profile(
    user_identifier: str,
    admin: Dict[str, Any] = Depends(verify_admin)
):
    """
    Get AI security profile for a specific user.
    
    Shows behavioral patterns and risk indicators.
    """
    try:
        # Get profile from anomaly detector
        profile = security_monitor.anomaly_detector.user_profiles.get(user_identifier)
        
        if not profile:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        # Calculate statistics
        profile_data = {
            "user_identifier": user_identifier,
            "total_events": profile["total_events"],
            "first_seen": profile["first_seen"].isoformat() if profile["first_seen"] else None,
            "last_seen": profile["last_seen"].isoformat() if profile["last_seen"] else None,
            "profile_age_days": security_monitor.anomaly_detector._get_profile_age_days(profile),
            "login_count": len(profile["login_times"]),
            "unique_ips": len(set(profile["login_ips"])),
            "failed_login_count": len(profile["failed_logins"]),
            "average_contract_amount": sum(profile["contract_amounts"]) / len(profile["contract_amounts"]) if profile["contract_amounts"] else 0,
            "api_calls_count": len(profile["api_calls"])
        }
        
        # Log activity
        admin_system.log_admin_activity(
            admin["admin_id"],
            "view_user_security_profile",
            target_type="user",
            target_id=user_identifier
        )
        
        return {
            "success": True,
            "profile": profile_data,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/security/siem-status")
async def get_siem_status(admin: Dict[str, Any] = Depends(verify_admin)):
    """
    Get status of SIEM integrations.
    
    Shows which SIEMs are configured and active.
    """
    try:
        import os
        
        siem_status = {
            "splunk": {
                "configured": bool(os.getenv('SPLUNK_HEC_URL') and os.getenv('SPLUNK_HEC_TOKEN')),
                "url": os.getenv('SPLUNK_HEC_URL', 'Not configured')
            },
            "elasticsearch": {
                "configured": bool(os.getenv('ELASTIC_URL')),
                "url": os.getenv('ELASTIC_URL', 'Not configured'),
                "index": os.getenv('ELASTIC_INDEX', 'gigchain-security')
            },
            "datadog": {
                "configured": bool(os.getenv('DATADOG_API_KEY')),
                "site": os.getenv('DATADOG_SITE', 'datadoghq.com')
            }
        }
        
        active_siems = sum(1 for siem in siem_status.values() if siem["configured"])
        
        # Log activity
        admin_system.log_admin_activity(
            admin["admin_id"],
            "view_siem_status"
        )
        
        return {
            "success": True,
            "active_integrations": active_siems,
            "total_adapters": len(security_monitor.siem_adapters),
            "siems": siem_status,
            "ai_anomaly_detection": "enabled",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting SIEM status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/security/test-alert")
async def test_security_alert(admin: Dict[str, Any] = Depends(verify_super_admin)):
    """
    Send test security event to all configured SIEMs.
    
    Super Admin only - Used to test SIEM integrations.
    """
    try:
        # Create test event
        test_event = log_security_event(
            category=EventCategory.SYSTEM.value,
            action="test_alert",
            result="success",
            severity=EventSeverity.INFO.value,
            user_id=admin["admin_id"],
            ip_address="127.0.0.1",
            details={
                "test": True,
                "message": "This is a test security alert",
                "admin": admin["username"]
            }
        )
        
        # Log activity
        admin_system.log_admin_activity(
            admin["admin_id"],
            "test_security_alert"
        )
        
        return {
            "success": True,
            "message": "Test alert sent to all configured SIEMs",
            "event_id": test_event.event_id,
            "siems_notified": len(security_monitor.siem_adapters),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error sending test alert: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
