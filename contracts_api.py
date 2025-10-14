"""
GigChain - Contracts & Jobs API
Real-time contract and job management with wallet integration
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import sqlite3
import json
import logging

# Import authentication 
from auth import get_current_wallet

# Setup logger
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/contracts", tags=["contracts"])

# Database initialization
def init_contracts_db():
    """Initialize contracts database"""
    conn = sqlite3.connect('gigchain.db')
    c = conn.cursor()
    
    # Create contracts table
    c.execute('''CREATE TABLE IF NOT EXISTS contracts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        freelancer_address TEXT,
        client_address TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'USDC',
        status TEXT NOT NULL,
        category TEXT,
        skills TEXT,
        deadline TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        started_at TEXT,
        completed_at TEXT,
        milestones TEXT,
        metadata TEXT,
        contract_type TEXT DEFAULT 'project'
    )''')
    
    # Add contract_type column if it doesn't exist (for existing databases)
    try:
        c.execute("ALTER TABLE contracts ADD COLUMN contract_type TEXT DEFAULT 'project'")
    except:
        # Column already exists
        pass
    
    # Create activity logs table
    c.execute('''CREATE TABLE IF NOT EXISTS contract_activity (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contract_id TEXT NOT NULL,
        wallet_address TEXT NOT NULL,
        action TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        metadata TEXT,
        FOREIGN KEY (contract_id) REFERENCES contracts (id)
    )''')
    
    conn.commit()
    conn.close()
    logger.info("✅ Contracts database initialized")

# Initialize database on module load
init_contracts_db()

# Enums
class ContractStatus(str, Enum):
    DRAFT = "draft"
    OPEN = "open"
    PENDING = "pending"
    ACTIVE = "active"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    DISPUTED = "disputed"

class ContractCategory(str, Enum):
    DEVELOPMENT = "development"
    DESIGN = "design"
    MARKETING = "marketing"
    WRITING = "writing"
    CONSULTING = "consulting"
    OTHER = "other"

# Models
class Contract(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    freelancer_address: Optional[str] = None
    client_address: str
    amount: float
    currency: str = "USDC"
    status: ContractStatus
    category: Optional[ContractCategory] = None
    skills: List[str] = []
    deadline: Optional[str] = None
    created_at: str
    updated_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    milestones: List[Dict[str, Any]] = []
    metadata: Dict[str, Any] = {}

class CreateContractRequest(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10, max_length=5000)
    amount: float = Field(..., gt=0)
    currency: str = "USDC"
    category: ContractCategory
    skills: List[str] = []
    deadline: Optional[str] = None
    milestones: List[Dict[str, Any]] = []
    client_address: str = Field(..., min_length=42, max_length=42)

class UpdateContractRequest(BaseModel):
    status: Optional[ContractStatus] = None
    freelancer_address: Optional[str] = None
    milestones: Optional[List[Dict[str, Any]]] = None

class ActivityLog(BaseModel):
    id: int
    contract_id: str
    wallet_address: str
    action: str
    timestamp: str
    metadata: Dict[str, Any] = {}

# Helper functions
def get_db():
    """Get database connection"""
    conn = sqlite3.connect('gigchain.db')
    conn.row_factory = sqlite3.Row
    return conn

def log_activity(contract_id: str, wallet_address: str, action: str, metadata: Dict = None):
    """Log contract activity"""
    conn = get_db()
    c = conn.cursor()
    c.execute('''INSERT INTO contract_activity 
                 (contract_id, wallet_address, action, timestamp, metadata)
                 VALUES (?, ?, ?, ?, ?)''',
              (contract_id, wallet_address, action, datetime.now().isoformat(),
               json.dumps(metadata or {})))
    conn.commit()
    conn.close()

# Endpoints
@router.get("/", response_model=List[Contract])
async def get_contracts(
    wallet_address: Optional[str] = Query(None, description="Filter by wallet address"),
    status: Optional[ContractStatus] = Query(None, description="Filter by status"),
    category: Optional[ContractCategory] = Query(None, description="Filter by category"),
    role: Optional[str] = Query(None, description="Filter by role: freelancer or client"),
    limit: int = Query(50, ge=1, le=100, description="Number of contracts to return"),
    offset: int = Query(0, ge=0, description="Pagination offset")
):
    """
    Get list of contracts with optional filters
    """
    try:
        conn = get_db()
        c = conn.cursor()
        
        query = "SELECT * FROM contracts WHERE 1=1"
        params = []
        
        if wallet_address:
            if role == "freelancer":
                query += " AND freelancer_address = ?"
                params.append(wallet_address)
            elif role == "client":
                query += " AND client_address = ?"
                params.append(wallet_address)
            else:
                query += " AND (freelancer_address = ? OR client_address = ?)"
                params.extend([wallet_address, wallet_address])
        
        if status:
            query += " AND status = ?"
            params.append(status.value)
        
        if category:
            query += " AND category = ?"
            params.append(category.value)
        
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        c.execute(query, params)
        rows = c.fetchall()
        conn.close()
        
        contracts = []
        for row in rows:
            contract_dict = dict(row)
            # Parse JSON fields
            contract_dict['skills'] = json.loads(contract_dict['skills'] or '[]')
            contract_dict['milestones'] = json.loads(contract_dict['milestones'] or '[]')
            contract_dict['metadata'] = json.loads(contract_dict['metadata'] or '{}')
            contracts.append(Contract(**contract_dict))
        
        return contracts
        
    except Exception as e:
        logger.error(f"Error getting contracts: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve contracts")

@router.post("/", response_model=Contract)
async def create_contract(
    contract: CreateContractRequest,
    current_wallet: Dict[str, Any] = Depends(get_current_wallet)
):
    """
    Create a new contract - REQUIRES AUTHENTICATION
    Only authenticated wallet holders can create contracts
    """
    try:
        import uuid
        
        contract_id = f"CNT-{uuid.uuid4().hex[:12].upper()}"
        now = datetime.now().isoformat()
        
        # 🔒 SECURITY: Use authenticated wallet address, not client request
        authenticated_client_address = current_wallet["address"]
        
        # Validate that provided client_address matches authenticated wallet
        if contract.client_address != authenticated_client_address:
            logger.warning(f"⚠️ SECURITY: Wallet mismatch. Authenticated: {authenticated_client_address}, Provided: {contract.client_address}")
            raise HTTPException(
                status_code=403, 
                detail="Client address must match authenticated wallet address"
            )
        
        conn = get_db()
        c = conn.cursor()
        
        c.execute('''INSERT INTO contracts 
                     (id, title, description, client_address, amount, currency, 
                      status, category, skills, deadline, created_at, updated_at,
                      milestones, metadata)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                  (contract_id, contract.title, contract.description, 
                   authenticated_client_address, contract.amount, contract.currency,
                   ContractStatus.OPEN.value, contract.category.value if contract.category else None,
                   json.dumps(contract.skills), contract.deadline, now, now,
                   json.dumps(contract.milestones), json.dumps({})))
        
        conn.commit()
        conn.close()
        
        # Log activity with authenticated wallet
        log_activity(contract_id, authenticated_client_address, "contract_created")
        
        logger.info(f"✅ Contract created: {contract_id}")
        
        # Return created contract with authenticated address
        return Contract(
            id=contract_id,
            title=contract.title,
            description=contract.description,
            client_address=authenticated_client_address,
            amount=contract.amount,
            currency=contract.currency,
            status=ContractStatus.OPEN,
            category=contract.category,
            skills=contract.skills,
            deadline=contract.deadline,
            created_at=now,
            updated_at=now,
            milestones=contract.milestones,
            metadata={}
        )
        
    except Exception as e:
        logger.error(f"Error creating contract: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create contract")

@router.get("/{contract_id}", response_model=Contract)
async def get_contract(contract_id: str):
    """
    Get a specific contract by ID
    """
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute("SELECT * FROM contracts WHERE id = ?", (contract_id,))
        row = c.fetchone()
        conn.close()
        
        if not row:
            raise HTTPException(status_code=404, detail="Contract not found")
        
        contract_dict = dict(row)
        contract_dict['skills'] = json.loads(contract_dict['skills'] or '[]')
        contract_dict['milestones'] = json.loads(contract_dict['milestones'] or '[]')
        contract_dict['metadata'] = json.loads(contract_dict['metadata'] or '{}')
        
        return Contract(**contract_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting contract: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve contract")

@router.patch("/{contract_id}", response_model=Contract)
async def update_contract(
    contract_id: str,
    update: UpdateContractRequest,
    current_wallet: Dict[str, Any] = Depends(get_current_wallet)
):
    """
    Update a contract - REQUIRES AUTHENTICATION
    User must be authenticated and authorized to modify the contract
    """
    try:
        conn = get_db()
        c = conn.cursor()
        
        # Get current contract
        c.execute("SELECT * FROM contracts WHERE id = ?", (contract_id,))
        row = c.fetchone()
        if not row:
            conn.close()
            raise HTTPException(status_code=404, detail="Contract not found")
        
        current = dict(row)
        authenticated_wallet_address = current_wallet["address"]
        
        # 🔒 SECURITY: Check authorization - only client or freelancer can update
        if (current['client_address'] != authenticated_wallet_address and 
            current['freelancer_address'] != authenticated_wallet_address):
            conn.close()
            logger.warning(f"⚠️ SECURITY: Unauthorized contract update attempt by {authenticated_wallet_address} for contract {contract_id}")
            raise HTTPException(
                status_code=403, 
                detail="Only the client or assigned freelancer can update this contract"
            )
        
        now = datetime.now().isoformat()
        
        # Build update query with whitelisted column names
        updates = []
        params = []
        
        # Whitelist of allowed column names for security
        ALLOWED_COLUMNS = {
            'status', 'freelancer_address', 'milestones', 'started_at', 
            'completed_at', 'updated_at'
        }
        
        if update.status:
            updates.append("status = ?")
            params.append(update.status.value)
            
            if update.status == ContractStatus.ACTIVE and not current['started_at']:
                updates.append("started_at = ?")
                params.append(now)
            elif update.status == ContractStatus.COMPLETED and not current['completed_at']:
                updates.append("completed_at = ?")
                params.append(now)
        
        if update.freelancer_address:
            updates.append("freelancer_address = ?")
            params.append(update.freelancer_address)
        
        if update.milestones is not None:
            updates.append("milestones = ?")
            params.append(json.dumps(update.milestones))
        
        updates.append("updated_at = ?")
        params.append(now)
        
        if updates:
            # Validate all column names against whitelist
            for update_clause in updates:
                column_name = update_clause.split(' = ')[0]
                if column_name not in ALLOWED_COLUMNS:
                    conn.close()
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Invalid column name: {column_name}"
                    )
            
            params.append(contract_id)
            query = f"UPDATE contracts SET {', '.join(updates)} WHERE id = ?"
            c.execute(query, params)
            conn.commit()
        
        # Get updated contract
        c.execute("SELECT * FROM contracts WHERE id = ?", (contract_id,))
        row = c.fetchone()
        conn.close()
        
        # Log activity with authenticated wallet
        log_activity(contract_id, authenticated_wallet_address, "contract_updated", 
                    {"updates": update.dict(exclude_none=True)})
        
        contract_dict = dict(row)
        contract_dict['skills'] = json.loads(contract_dict['skills'] or '[]')
        contract_dict['milestones'] = json.loads(contract_dict['milestones'] or '[]')
        contract_dict['metadata'] = json.loads(contract_dict['metadata'] or '{}')
        
        return Contract(**contract_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating contract: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update contract")

@router.get("/{contract_id}/activity", response_model=List[ActivityLog])
async def get_contract_activity(contract_id: str):
    """
    Get activity log for a contract
    """
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute('''SELECT * FROM contract_activity 
                     WHERE contract_id = ? 
                     ORDER BY timestamp DESC''', (contract_id,))
        rows = c.fetchall()
        conn.close()
        
        activities = []
        for row in rows:
            activity_dict = dict(row)
            activity_dict['metadata'] = json.loads(activity_dict['metadata'] or '{}')
            activities.append(ActivityLog(**activity_dict))
        
        return activities
        
    except Exception as e:
        logger.error(f"Error getting contract activity: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve activity")

@router.get("/stats/dashboard")
async def get_dashboard_stats(
    wallet_address: Optional[str] = Query(None, description="Wallet address (optional, shows global if not provided)"),
    hours: int = Query(24, ge=1, le=168, description="Time range in hours")
):
    """
    Get dashboard statistics for last N hours
    If wallet_address is provided, shows personal stats
    If not provided, shows global platform stats
    """
    conn = None
    try:
        conn = get_db()
        c = conn.cursor()
        
        # Calculate time threshold
        threshold = (datetime.now() - timedelta(hours=hours)).isoformat()
        
        # Get stats with default values to ensure consistency
        stats = {
            "total_contracts": 0,
            "active_contracts": 0,
            "completed_contracts": 0,
            "total_earned": 0.0,
            "total_spent": 0.0,
            "activity_by_hour": [],
            "timestamp": datetime.now().isoformat(),
            "wallet_address": wallet_address
        }
        
        if wallet_address:
            # Personal stats
            # Total contracts
            c.execute('''SELECT COUNT(*) FROM contracts 
                         WHERE freelancer_address = ? OR client_address = ?''',
                      (wallet_address, wallet_address))
            stats["total_contracts"] = c.fetchone()[0]
            
            # Active contracts
            c.execute('''SELECT COUNT(*) FROM contracts 
                         WHERE (freelancer_address = ? OR client_address = ?) 
                         AND status IN ('active', 'in_progress')''',
                      (wallet_address, wallet_address))
            stats["active_contracts"] = c.fetchone()[0]
            
            # Completed contracts
            c.execute('''SELECT COUNT(*) FROM contracts 
                         WHERE (freelancer_address = ? OR client_address = ?) 
                         AND status = 'completed'
                         AND completed_at >= ?''',
                      (wallet_address, wallet_address, threshold))
            stats["completed_contracts"] = c.fetchone()[0]
            
            # Total earned (as freelancer)
            c.execute('''SELECT COALESCE(SUM(amount), 0) FROM contracts 
                         WHERE freelancer_address = ? AND status = 'completed' ''',
                      (wallet_address,))
            stats["total_earned"] = c.fetchone()[0]
            
            # Total spent (as client)
            c.execute('''SELECT COALESCE(SUM(amount), 0) FROM contracts 
                         WHERE client_address = ? AND status = 'completed' ''',
                      (wallet_address,))
            stats["total_spent"] = c.fetchone()[0]
        else:
            # Global stats - only for last 24 hours
            c.execute('''SELECT COUNT(*) FROM contracts 
                         WHERE created_at >= ?''', (threshold,))
            stats["total_contracts"] = c.fetchone()[0]
            
            c.execute('''SELECT COUNT(*) FROM contracts 
                         WHERE status IN ('active', 'in_progress')
                         AND created_at >= ?''', (threshold,))
            stats["active_contracts"] = c.fetchone()[0]
            
            c.execute('''SELECT COUNT(*) FROM contracts 
                         WHERE status = 'completed'
                         AND completed_at >= ?''', (threshold,))
            stats["completed_contracts"] = c.fetchone()[0]
            
            c.execute('''SELECT COALESCE(SUM(amount), 0) FROM contracts 
                         WHERE status = 'completed' 
                         AND completed_at >= ?''', (threshold,))
            total_completed = c.fetchone()[0]
            stats["total_earned"] = total_completed
            stats["total_spent"] = total_completed
        
        # Activity by hour (last 24 hours)
        # Get all contract activity in the last 24 hours
        for i in range(24):
            hour_start = (datetime.now() - timedelta(hours=23-i)).replace(minute=0, second=0, microsecond=0)
            hour_end = hour_start + timedelta(hours=1)
            
            
            if wallet_address:
                # Personal activity
                # Count contracts created in this hour
                c.execute('''SELECT COUNT(*) FROM contracts 
                             WHERE (freelancer_address = ? OR client_address = ?)
                             AND created_at >= ? AND created_at < ?''',
                          (wallet_address, wallet_address, hour_start.isoformat(), hour_end.isoformat()))
                created_count = c.fetchone()[0]
                
                # Count contracts updated in this hour
                c.execute('''SELECT COUNT(*) FROM contracts 
                             WHERE (freelancer_address = ? OR client_address = ?)
                             AND updated_at >= ? AND updated_at < ?
                             AND updated_at != created_at''',
                          (wallet_address, wallet_address, hour_start.isoformat(), hour_end.isoformat()))
                updated_count = c.fetchone()[0]
                
                # Count activity logs in this hour
                c.execute('''SELECT COUNT(*) FROM contract_activity 
                             WHERE wallet_address = ? 
                             AND timestamp >= ? AND timestamp < ?''',
                          (wallet_address, hour_start.isoformat(), hour_end.isoformat()))
                activity_count = c.fetchone()[0]
            else:
                # Global activity
                # Count all contracts created in this hour
                c.execute('''SELECT COUNT(*) FROM contracts 
                             WHERE created_at >= ? AND created_at < ?''',
                          (hour_start.isoformat(), hour_end.isoformat()))
                created_count = c.fetchone()[0]
                
                # Count all contracts updated in this hour
                c.execute('''SELECT COUNT(*) FROM contracts 
                             WHERE updated_at >= ? AND updated_at < ?
                             AND updated_at != created_at''',
                          (hour_start.isoformat(), hour_end.isoformat()))
                updated_count = c.fetchone()[0]
                
                # Count all activity logs in this hour
                c.execute('''SELECT COUNT(*) FROM contract_activity 
                             WHERE timestamp >= ? AND timestamp < ?''',
                          (hour_start.isoformat(), hour_end.isoformat()))
                activity_count = c.fetchone()[0]
            
            # Count contracts that changed status in this specific hour
            if wallet_address:
                # Count contracts that became 'open' in this hour
                c.execute('''SELECT COUNT(*) FROM contracts 
                             WHERE (freelancer_address = ? OR client_address = ?)
                             AND status = 'open'
                             AND created_at >= ? AND created_at < ?''',
                          (wallet_address, wallet_address, hour_start.isoformat(), hour_end.isoformat()))
                open_contracts = c.fetchone()[0]
                
                # Count contracts that became 'active' or 'in_progress' in this hour
                c.execute('''SELECT COUNT(*) FROM contracts 
                             WHERE (freelancer_address = ? OR client_address = ?)
                             AND status IN ('active', 'in_progress')
                             AND updated_at >= ? AND updated_at < ?
                             AND updated_at != created_at''',
                          (wallet_address, wallet_address, hour_start.isoformat(), hour_end.isoformat()))
                accepted_contracts = c.fetchone()[0]
            else:
                # Count contracts that became 'open' in this hour
                c.execute('''SELECT COUNT(*) FROM contracts 
                             WHERE status = 'open'
                             AND created_at >= ? AND created_at < ?''',
                          (hour_start.isoformat(), hour_end.isoformat()))
                open_contracts = c.fetchone()[0]
                
                # Count contracts that became 'active' or 'in_progress' in this hour
                c.execute('''SELECT COUNT(*) FROM contracts 
                             WHERE status IN ('active', 'in_progress')
                             AND updated_at >= ? AND updated_at < ?
                             AND updated_at != created_at''',
                          (hour_start.isoformat(), hour_end.isoformat()))
                accepted_contracts = c.fetchone()[0]
            
            # Total activity for this hour
            total_activity = created_count + updated_count + activity_count
            
            stats["activity_by_hour"].append({
                "hour": hour_start.strftime("%H:00"),
                "contracts": total_activity,
                "value": total_activity,  # Real value, not simulated
                "created": created_count,
                "updated": updated_count,
                "activities": activity_count,
                "open_contracts": open_contracts,
                "accepted_contracts": accepted_contracts
            })
        
        return stats
        
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {str(e)}")
        # Return default stats instead of raising exception to prevent frontend crashes
        return {
            "total_contracts": 0,
            "active_contracts": 0,
            "completed_contracts": 0,
            "total_earned": 0.0,
            "total_spent": 0.0,
            "activity_by_hour": [
                {
                    "hour": f"{i:02d}:00",
                    "contracts": 0,
                    "value": 0,
                    "created": 0,
                    "updated": 0,
                    "activities": 0,
                    "open_contracts": 0,
                    "accepted_contracts": 0
                } for i in range(24)
            ],
            "timestamp": datetime.now().isoformat(),
            "wallet_address": wallet_address,
            "error": "Failed to retrieve dashboard stats"
        }
    finally:
        if conn:
            try:
                conn.close()
            except:
                pass  # Ignore connection close errors

