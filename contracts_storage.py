"""
GigChain Contract Storage Module
Handles saving contracts to the database for dashboard integration
"""

import sqlite3
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


def save_contract_to_dashboard(
    contract_id: str, 
    contract_data: Dict[str, Any], 
    client_address: str = None
) -> bool:
    """
    Save contract to the contracts database for dashboard integration.
    
    Args:
        contract_id: Unique contract identifier
        contract_data: Contract data including text, formData, and result
        client_address: Client wallet address (optional)
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        logger.info(f"Attempting to save contract {contract_id} to database")
        logger.info(f"Contract data keys: {list(contract_data.keys()) if contract_data else 'None'}")
        
        # Get database connection
        conn = sqlite3.connect('gigchain.db')
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        
        logger.info("Database connection established")
        
        # Initialize contracts database if needed
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
        except Exception:
            # Column already exists, ignore
            pass
        
        # Extract data from contract_data
        form_data = contract_data.get('formData', {})
        result = contract_data.get('result', {})
        
        # Extract title and description
        base_title = form_data.get('projectTitle', 'Contrato Generado')
        contract_type = form_data.get('contractType', 'project')
        
        # Set appropriate title based on type
        if contract_type == 'service':
            title = f"[SERVICIO] {base_title}"
        else:
            title = f"[PROYECTO] {base_title}"
            
        description = contract_data.get('text', form_data.get('description', 'Contrato generado por IA'))
        
        # Extract amount with validation
        amount = form_data.get('requestedAmount') or form_data.get('offeredAmount') or 1000.0
        if isinstance(amount, str):
            try:
                amount = float(amount)
            except (ValueError, TypeError):
                amount = 1000.0
                
        # Map Spanish categories to English (for API compatibility)
        category_spanish = form_data.get('category', 'otros')
        category_mapping = {
            'desarrollo-web': 'development',
            'diseno-grafico': 'design', 
            'marketing-digital': 'marketing',
            'redaccion': 'writing',
            'traduccion': 'writing',
            'consultoria': 'consulting',
            'otros': 'other'
        }
        category = category_mapping.get(category_spanish, 'other')
        
        # Extract skills
        skills = form_data.get('requiredSkills', '')
        skills_list = [skill.strip() for skill in skills.split(',')] if skills else []
        deadline = form_data.get('deadline')
        
        # Set client and freelancer addresses based on role and wallet data
        role = form_data.get('role', 'unknown')
        client_wallet = form_data.get('clientWallet')
        freelancer_wallet = form_data.get('freelancerWallet')
        
        logger.info(f"Role from form: {role}")
        logger.info(f"Client wallet from form: {client_wallet}")
        logger.info(f"Freelancer wallet from form: {freelancer_wallet}")
        
        if role == 'client':
            # When role is client, use clientWallet for client_address
            client_address = client_wallet or client_address or 'unknown_client'
            freelancer_address = None  # Will be assigned when freelancer accepts
        elif role == 'freelancer':
            # When role is freelancer, use freelancerWallet for freelancer_address
            client_address = client_address or 'unknown_client'
            freelancer_address = freelancer_wallet
        else:
            # Fallback to original logic
            client_address = client_wallet or client_address or 'unknown_client'
            freelancer_address = freelancer_wallet
            
        logger.info(f"Final client_address: {client_address}")
        logger.info(f"Final freelancer_address: {freelancer_address}")
            
        now = datetime.now().isoformat()
        
        # Insert contract with parameterized query (SECURITY FIX)
        c.execute('''INSERT OR REPLACE INTO contracts 
                     (id, title, description, freelancer_address, client_address, amount, currency, 
                      status, category, skills, deadline, created_at, updated_at,
                      milestones, metadata, contract_type)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                  (contract_id, title, description, freelancer_address, client_address, amount, 'USDC',
                   'open', category, json.dumps(skills_list), deadline, now, now,
                   json.dumps(result.get('milestones', [])), 
                   json.dumps(contract_data), contract_type))
        
        conn.commit()
        logger.info(f"Database commit successful")
        
        # Verify the contract was saved
        c.execute("SELECT COUNT(*) FROM contracts WHERE id = ?", (contract_id,))
        count = c.fetchone()[0]
        logger.info(f"Contract verification: {count} contract(s) with ID {contract_id}")
        
        conn.close()
        
        logger.info(f"Contract {contract_id} saved to database successfully")
        return True
        
    except Exception as e:
        logger.error(f"Failed to save contract {contract_id} to database: {e}")
        return False
