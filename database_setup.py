"""
Database setup script for GigChain Private Jobs system
"""

import sqlite3
import os
from datetime import datetime

def create_private_jobs_tables():
    """Create tables for private jobs system"""
    
    # Connect to database
    conn = sqlite3.connect('gigchain.db')
    cursor = conn.cursor()
    
    try:
        # Create private_jobs table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS private_jobs (
                id TEXT PRIMARY KEY,
                client_id TEXT NOT NULL,
                client_wallet TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                requirements TEXT,  -- JSON string
                budget_min INTEGER NOT NULL,
                budget_max INTEGER NOT NULL,
                currency TEXT DEFAULT 'USD',
                timeline TEXT NOT NULL,
                skills TEXT,  -- JSON string
                visibility TEXT DEFAULT 'private',
                status TEXT DEFAULT 'draft',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP,
                is_active BOOLEAN DEFAULT 1
            )
        ''')
        
        # Create private_job_invitations table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS private_job_invitations (
                id TEXT PRIMARY KEY,
                job_id TEXT NOT NULL,
                client_id TEXT NOT NULL,
                freelancer_id TEXT NOT NULL,
                freelancer_wallet TEXT NOT NULL,
                message TEXT,
                status TEXT DEFAULT 'pending',
                invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                responded_at TIMESTAMP,
                FOREIGN KEY (job_id) REFERENCES private_jobs (id)
            )
        ''')
        
        # Create job_applications table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS job_applications (
                id TEXT PRIMARY KEY,
                job_id TEXT NOT NULL,
                applicant_id TEXT NOT NULL,
                applicant_wallet TEXT NOT NULL,
                cover_letter TEXT NOT NULL,
                proposed_rate INTEGER NOT NULL,
                estimated_time TEXT NOT NULL,
                relevant_experience TEXT,  -- JSON string
                portfolio TEXT,  -- JSON string
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'pending',
                FOREIGN KEY (job_id) REFERENCES private_jobs (id)
            )
        ''')
        
        # Create collaboration_groups table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS collaboration_groups (
                id TEXT PRIMARY KEY,
                job_id TEXT NOT NULL,
                client_id TEXT NOT NULL,
                applicants TEXT NOT NULL,  -- JSON string
                group_chat_id TEXT,
                status TEXT DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                decided_at TIMESTAMP,
                selected_applicants TEXT,  -- JSON string
                project_goals TEXT,  -- JSON string
                deadlines TEXT,  -- JSON string
                github_repo TEXT,
                FOREIGN KEY (job_id) REFERENCES private_jobs (id)
            )
        ''')
        
        # Create group_chat_messages table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS group_chat_messages (
                id TEXT PRIMARY KEY,
                group_id TEXT NOT NULL,
                sender_id TEXT NOT NULL,
                message TEXT NOT NULL,
                message_type TEXT DEFAULT 'text',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                encrypted BOOLEAN DEFAULT 0,
                metadata TEXT  -- JSON string
            )
        ''')
        
        # Create group_proposals table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS group_proposals (
                id TEXT PRIMARY KEY,
                group_id TEXT NOT NULL,
                proposer_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                selected_applicants TEXT NOT NULL,  -- JSON string
                reasoning TEXT,
                votes TEXT,  -- JSON string
                status TEXT DEFAULT 'active',
                deadline TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (group_id) REFERENCES collaboration_groups (id)
            )
        ''')
        
        # Create indexes for better performance
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_private_jobs_client_wallet ON private_jobs (client_wallet)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_private_jobs_status ON private_jobs (status)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_invitations_freelancer_wallet ON private_job_invitations (freelancer_wallet)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_invitations_job_id ON private_job_invitations (job_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_applications_applicant_wallet ON job_applications (applicant_wallet)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_applications_job_id ON job_applications (job_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_groups_job_id ON collaboration_groups (job_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_messages_group_id ON group_chat_messages (group_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_proposals_group_id ON group_proposals (group_id)')
        
        conn.commit()
        print("✅ Private jobs tables created successfully")
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        conn.rollback()
    finally:
        conn.close()

def create_sample_data():
    """Create sample data for testing"""
    
    conn = sqlite3.connect('gigchain.db')
    cursor = conn.cursor()
    
    try:
        # Sample private job
        cursor.execute('''
            INSERT OR IGNORE INTO private_jobs (
                id, client_id, client_wallet, title, description, requirements,
                budget_min, budget_max, currency, timeline, skills, status
            ) VALUES (
                'job_001',
                'client_001',
                '0x1234567890123456789012345678901234567890',
                'Desarrollo de Smart Contract DeFi',
                'Necesitamos desarrollar un smart contract para un protocolo DeFi con funcionalidades de staking y yield farming.',
                '["Experiencia en Solidity", "Conocimiento de DeFi", "Testing de contratos"]',
                5000,
                15000,
                'USD',
                '4-6 semanas',
                '["Solidity", "DeFi", "Web3", "Testing"]',
                'published'
            )
        ''')
        
        # Sample invitation
        cursor.execute('''
            INSERT OR IGNORE INTO private_job_invitations (
                id, job_id, client_id, freelancer_id, freelancer_wallet, message, status
            ) VALUES (
                'inv_001',
                'job_001',
                'client_001',
                'freelancer_001',
                '0x9876543210987654321098765432109876543210',
                'Hola! Vi tu perfil y me gustaría invitarte a aplicar a este proyecto de DeFi.',
                'pending'
            )
        ''')
        
        conn.commit()
        print("✅ Sample data created successfully")
        
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("🚀 Setting up Private Jobs database...")
    create_private_jobs_tables()
    create_sample_data()
    print("✅ Database setup complete!")