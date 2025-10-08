"""
GigChain.io - Advanced Analytics System
Real-time analytics, metrics tracking, and reporting system.
"""

import sqlite3
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import statistics

logger = logging.getLogger(__name__)

class MetricType(str, Enum):
    """Types of metrics to track."""
    CONTRACT_CREATED = "contract_created"
    CONTRACT_COMPLETED = "contract_completed"
    CONTRACT_DISPUTED = "contract_disputed"
    CONTRACT_CANCELLED = "contract_cancelled"
    USER_REGISTERED = "user_registered"
    USER_AUTHENTICATED = "user_authenticated"
    PAYMENT_PROCESSED = "payment_processed"
    PAYMENT_RELEASED = "payment_released"
    MILESTONE_COMPLETED = "milestone_completed"
    DISPUTE_RESOLVED = "dispute_resolved"
    TEMPLATE_PURCHASED = "template_purchased"
    TEMPLATE_LISTED = "template_listed"
    NFT_MINTED = "nft_minted"
    CHAT_MESSAGE_SENT = "chat_message_sent"
    AI_AGENT_CALLED = "ai_agent_called"

class TimePeriod(str, Enum):
    """Time period for analytics queries."""
    HOUR = "hour"
    DAY = "day"
    WEEK = "week"
    MONTH = "month"
    YEAR = "year"
    ALL_TIME = "all_time"

@dataclass
class Metric:
    """Metric data structure."""
    metric_type: str
    value: float
    timestamp: str
    metadata: Optional[Dict[str, Any]] = None
    user_id: Optional[str] = None
    contract_id: Optional[str] = None

@dataclass
class AnalyticsReport:
    """Analytics report structure."""
    period: str
    start_date: str
    end_date: str
    total_contracts: int
    completed_contracts: int
    disputed_contracts: int
    cancelled_contracts: int
    total_volume: float
    total_revenue: float
    active_users: int
    new_users: int
    success_rate: float
    avg_completion_time: float
    growth_rate: float
    top_categories: List[Dict[str, Any]]
    user_retention: float
    ai_agent_usage: Dict[str, int]

class AnalyticsDatabase:
    """Database handler for analytics data."""
    
    def __init__(self, db_path: str = "analytics.db"):
        self.db_path = db_path
        self._init_database()
    
    def _init_database(self):
        """Initialize analytics database schema."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Metrics table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    metric_type TEXT NOT NULL,
                    value REAL NOT NULL,
                    timestamp TEXT NOT NULL,
                    metadata TEXT,
                    user_id TEXT,
                    contract_id TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Aggregated metrics table (for performance)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS aggregated_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    period TEXT NOT NULL,
                    metric_type TEXT NOT NULL,
                    aggregate_type TEXT NOT NULL,
                    value REAL NOT NULL,
                    start_date TEXT NOT NULL,
                    end_date TEXT NOT NULL,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(period, metric_type, aggregate_type, start_date)
                )
            ''')
            
            # User activity table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS user_activity (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    activity_type TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    metadata TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Contract analytics table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS contract_analytics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    contract_id TEXT UNIQUE NOT NULL,
                    contract_type TEXT,
                    amount REAL,
                    duration_days INTEGER,
                    status TEXT,
                    created_at TEXT,
                    started_at TEXT,
                    completed_at TEXT,
                    disputed_at TEXT,
                    cancelled_at TEXT,
                    freelancer_id TEXT,
                    client_id TEXT,
                    category TEXT,
                    metadata TEXT
                )
            ''')
            
            # Real-time metrics cache table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS realtime_metrics (
                    metric_key TEXT PRIMARY KEY,
                    metric_value REAL NOT NULL,
                    last_updated TEXT NOT NULL
                )
            ''')
            
            # Create indexes for performance
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_metrics_type ON metrics(metric_type)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_metrics_user ON metrics(user_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_activity_user ON user_activity(user_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_activity_timestamp ON user_activity(timestamp)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_contract_status ON contract_analytics(status)')
            
            conn.commit()
    
    def track_metric(self, metric: Metric):
        """Track a new metric."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO metrics (metric_type, value, timestamp, metadata, user_id, contract_id)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                metric.metric_type,
                metric.value,
                metric.timestamp,
                json.dumps(metric.metadata) if metric.metadata else None,
                metric.user_id,
                metric.contract_id
            ))
            
            conn.commit()
            
            # Update real-time cache
            self._update_realtime_cache(metric)
    
    def _update_realtime_cache(self, metric: Metric):
        """Update real-time metrics cache."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Update relevant real-time metrics
            metric_key = f"{metric.metric_type}_count"
            
            cursor.execute('''
                INSERT INTO realtime_metrics (metric_key, metric_value, last_updated)
                VALUES (?, 1, ?)
                ON CONFLICT(metric_key) DO UPDATE SET
                    metric_value = metric_value + 1,
                    last_updated = excluded.last_updated
            ''', (metric_key, metric.timestamp))
            
            conn.commit()
    
    def track_contract(self, contract_id: str, **kwargs):
        """Track contract data for analytics."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            metadata = kwargs.pop('metadata', {})
            
            cursor.execute('''
                INSERT OR REPLACE INTO contract_analytics 
                (contract_id, contract_type, amount, duration_days, status, created_at,
                 started_at, completed_at, disputed_at, cancelled_at, freelancer_id,
                 client_id, category, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                contract_id,
                kwargs.get('contract_type'),
                kwargs.get('amount'),
                kwargs.get('duration_days'),
                kwargs.get('status'),
                kwargs.get('created_at'),
                kwargs.get('started_at'),
                kwargs.get('completed_at'),
                kwargs.get('disputed_at'),
                kwargs.get('cancelled_at'),
                kwargs.get('freelancer_id'),
                kwargs.get('client_id'),
                kwargs.get('category'),
                json.dumps(metadata)
            ))
            
            conn.commit()
    
    def get_metrics(
        self,
        metric_type: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        user_id: Optional[str] = None,
        limit: int = 1000
    ) -> List[Dict[str, Any]]:
        """Get metrics with filters."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            query = "SELECT * FROM metrics WHERE 1=1"
            params = []
            
            if metric_type:
                query += " AND metric_type = ?"
                params.append(metric_type)
            
            if start_date:
                query += " AND timestamp >= ?"
                params.append(start_date)
            
            if end_date:
                query += " AND timestamp <= ?"
                params.append(end_date)
            
            if user_id:
                query += " AND user_id = ?"
                params.append(user_id)
            
            query += " ORDER BY timestamp DESC LIMIT ?"
            params.append(limit)
            
            cursor.execute(query, params)
            
            columns = [desc[0] for desc in cursor.description]
            results = []
            
            for row in cursor.fetchall():
                result = dict(zip(columns, row))
                if result.get('metadata'):
                    result['metadata'] = json.loads(result['metadata'])
                results.append(result)
            
            return results
    
    def get_realtime_metrics(self) -> Dict[str, Any]:
        """Get real-time metrics from cache."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('SELECT metric_key, metric_value, last_updated FROM realtime_metrics')
            
            metrics = {}
            for row in cursor.fetchall():
                metrics[row[0]] = {
                    'value': row[1],
                    'last_updated': row[2]
                }
            
            return metrics
    
    def generate_report(
        self,
        period: TimePeriod = TimePeriod.MONTH
    ) -> AnalyticsReport:
        """Generate comprehensive analytics report."""
        end_date = datetime.now()
        
        # Calculate start date based on period
        if period == TimePeriod.HOUR:
            start_date = end_date - timedelta(hours=1)
        elif period == TimePeriod.DAY:
            start_date = end_date - timedelta(days=1)
        elif period == TimePeriod.WEEK:
            start_date = end_date - timedelta(weeks=1)
        elif period == TimePeriod.MONTH:
            start_date = end_date - timedelta(days=30)
        elif period == TimePeriod.YEAR:
            start_date = end_date - timedelta(days=365)
        else:  # ALL_TIME
            start_date = datetime(2020, 1, 1)
        
        start_date_str = start_date.isoformat()
        end_date_str = end_date.isoformat()
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Total contracts
            cursor.execute('''
                SELECT COUNT(*) FROM contract_analytics
                WHERE created_at >= ? AND created_at <= ?
            ''', (start_date_str, end_date_str))
            total_contracts = cursor.fetchone()[0]
            
            # Completed contracts
            cursor.execute('''
                SELECT COUNT(*) FROM contract_analytics
                WHERE completed_at >= ? AND completed_at <= ?
            ''', (start_date_str, end_date_str))
            completed_contracts = cursor.fetchone()[0]
            
            # Disputed contracts
            cursor.execute('''
                SELECT COUNT(*) FROM contract_analytics
                WHERE disputed_at >= ? AND disputed_at <= ?
            ''', (start_date_str, end_date_str))
            disputed_contracts = cursor.fetchone()[0]
            
            # Cancelled contracts
            cursor.execute('''
                SELECT COUNT(*) FROM contract_analytics
                WHERE cancelled_at >= ? AND cancelled_at <= ?
            ''', (start_date_str, end_date_str))
            cancelled_contracts = cursor.fetchone()[0]
            
            # Total volume
            cursor.execute('''
                SELECT COALESCE(SUM(amount), 0) FROM contract_analytics
                WHERE created_at >= ? AND created_at <= ?
            ''', (start_date_str, end_date_str))
            total_volume = cursor.fetchone()[0]
            
            # Total revenue (assuming 2.5% platform fee)
            total_revenue = total_volume * 0.025
            
            # Active users
            cursor.execute('''
                SELECT COUNT(DISTINCT user_id) FROM user_activity
                WHERE timestamp >= ? AND timestamp <= ?
            ''', (start_date_str, end_date_str))
            active_users = cursor.fetchone()[0]
            
            # New users
            cursor.execute('''
                SELECT COUNT(*) FROM metrics
                WHERE metric_type = ? AND timestamp >= ? AND timestamp <= ?
            ''', (MetricType.USER_REGISTERED.value, start_date_str, end_date_str))
            new_users = cursor.fetchone()[0]
            
            # Success rate
            success_rate = (completed_contracts / total_contracts * 100) if total_contracts > 0 else 0.0
            
            # Average completion time
            cursor.execute('''
                SELECT AVG(JULIANDAY(completed_at) - JULIANDAY(created_at))
                FROM contract_analytics
                WHERE completed_at IS NOT NULL
                AND completed_at >= ? AND completed_at <= ?
            ''', (start_date_str, end_date_str))
            result = cursor.fetchone()[0]
            avg_completion_time = result if result else 0.0
            
            # Growth rate (compare with previous period)
            if period != TimePeriod.ALL_TIME:
                previous_start = start_date - (end_date - start_date)
                cursor.execute('''
                    SELECT COUNT(*) FROM contract_analytics
                    WHERE created_at >= ? AND created_at < ?
                ''', (previous_start.isoformat(), start_date_str))
                previous_contracts = cursor.fetchone()[0]
                
                growth_rate = ((total_contracts - previous_contracts) / previous_contracts * 100) if previous_contracts > 0 else 0.0
            else:
                growth_rate = 0.0
            
            # Top categories
            cursor.execute('''
                SELECT category, COUNT(*) as count, COALESCE(SUM(amount), 0) as volume
                FROM contract_analytics
                WHERE created_at >= ? AND created_at <= ?
                AND category IS NOT NULL
                GROUP BY category
                ORDER BY count DESC
                LIMIT 10
            ''', (start_date_str, end_date_str))
            
            top_categories = [
                {"category": row[0], "count": row[1], "volume": row[2]}
                for row in cursor.fetchall()
            ]
            
            # User retention (users who came back)
            cursor.execute('''
                SELECT COUNT(DISTINCT user_id) FROM (
                    SELECT user_id, COUNT(DISTINCT DATE(timestamp)) as days_active
                    FROM user_activity
                    WHERE timestamp >= ? AND timestamp <= ?
                    GROUP BY user_id
                    HAVING days_active > 1
                )
            ''', (start_date_str, end_date_str))
            returning_users = cursor.fetchone()[0]
            user_retention = (returning_users / active_users * 100) if active_users > 0 else 0.0
            
            # AI agent usage
            cursor.execute('''
                SELECT metadata, COUNT(*) as count
                FROM metrics
                WHERE metric_type = ? AND timestamp >= ? AND timestamp <= ?
                AND metadata IS NOT NULL
                GROUP BY metadata
            ''', (MetricType.AI_AGENT_CALLED.value, start_date_str, end_date_str))
            
            ai_agent_usage = {}
            for row in cursor.fetchall():
                try:
                    metadata = json.loads(row[0])
                    agent_name = metadata.get('agent_name', 'unknown')
                    ai_agent_usage[agent_name] = row[1]
                except:
                    pass
        
        return AnalyticsReport(
            period=period.value,
            start_date=start_date_str,
            end_date=end_date_str,
            total_contracts=total_contracts,
            completed_contracts=completed_contracts,
            disputed_contracts=disputed_contracts,
            cancelled_contracts=cancelled_contracts,
            total_volume=total_volume,
            total_revenue=total_revenue,
            active_users=active_users,
            new_users=new_users,
            success_rate=success_rate,
            avg_completion_time=avg_completion_time,
            growth_rate=growth_rate,
            top_categories=top_categories,
            user_retention=user_retention,
            ai_agent_usage=ai_agent_usage
        )

# Global analytics database instance
analytics_db = AnalyticsDatabase()

def track_event(
    metric_type: MetricType,
    value: float = 1.0,
    user_id: Optional[str] = None,
    contract_id: Optional[str] = None,
    **metadata
):
    """Convenience function to track an event."""
    metric = Metric(
        metric_type=metric_type.value,
        value=value,
        timestamp=datetime.now().isoformat(),
        metadata=metadata if metadata else None,
        user_id=user_id,
        contract_id=contract_id
    )
    
    analytics_db.track_metric(metric)
    
    # Also track user activity
    if user_id:
        with sqlite3.connect(analytics_db.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO user_activity (user_id, activity_type, timestamp, metadata)
                VALUES (?, ?, ?, ?)
            ''', (
                user_id,
                metric_type.value,
                metric.timestamp,
                json.dumps(metadata) if metadata else None
            ))
            conn.commit()
