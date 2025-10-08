"""
GigChain.io - Admin Data Export System
Export KPIs, analytics, and platform data with time filters.
"""

import sqlite3
import csv
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from io import StringIO
from dataclasses import dataclass, asdict
from enum import Enum

logger = logging.getLogger(__name__)

class ExportFormat(str, Enum):
    """Export file formats."""
    CSV = "csv"
    JSON = "json"
    EXCEL = "excel"

class TimeRange(str, Enum):
    """Predefined time ranges for exports."""
    LAST_24_HOURS = "24h"
    LAST_7_DAYS = "7d"
    LAST_30_DAYS = "30d"
    LAST_90_DAYS = "90d"
    THIS_MONTH = "this_month"
    LAST_MONTH = "last_month"
    THIS_YEAR = "this_year"
    ALL_TIME = "all_time"
    CUSTOM = "custom"

@dataclass
class ExportRequest:
    """Export request structure."""
    export_type: str  # kpis, users, contracts, transactions, etc.
    time_range: str
    format: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    filters: Optional[Dict[str, Any]] = None

class AdminExportSystem:
    """
    System for exporting platform data and KPIs.
    Supports multiple time ranges and export formats.
    """
    
    def __init__(self):
        self.analytics_db = "analytics.db"
        self.admin_db = "admin.db"
        self.auth_db = "wcsap_auth.db"
    
    def calculate_time_range(self, time_range: str, start_date: Optional[str] = None, 
                            end_date: Optional[str] = None) -> tuple:
        """Calculate start and end timestamps for given time range."""
        now = datetime.now()
        
        if time_range == TimeRange.CUSTOM.value:
            if not start_date or not end_date:
                raise ValueError("Custom range requires start_date and end_date")
            return (start_date, end_date)
        
        if time_range == TimeRange.LAST_24_HOURS.value:
            start = now - timedelta(hours=24)
        elif time_range == TimeRange.LAST_7_DAYS.value:
            start = now - timedelta(days=7)
        elif time_range == TimeRange.LAST_30_DAYS.value:
            start = now - timedelta(days=30)
        elif time_range == TimeRange.LAST_90_DAYS.value:
            start = now - timedelta(days=90)
        elif time_range == TimeRange.THIS_MONTH.value:
            start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        elif time_range == TimeRange.LAST_MONTH.value:
            first_this_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            end = first_this_month - timedelta(days=1)
            start = end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            return (start.isoformat(), end.isoformat())
        elif time_range == TimeRange.THIS_YEAR.value:
            start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        elif time_range == TimeRange.ALL_TIME.value:
            return (None, None)
        else:
            raise ValueError(f"Invalid time range: {time_range}")
        
        return (start.isoformat(), now.isoformat())
    
    def export_kpis(self, time_range: str, start_date: Optional[str] = None, 
                   end_date: Optional[str] = None) -> Dict[str, Any]:
        """Export KPIs for specified time range."""
        start_ts, end_ts = self.calculate_time_range(time_range, start_date, end_date)
        
        kpis = {
            "metadata": {
                "export_date": datetime.now().isoformat(),
                "time_range": time_range,
                "start_date": start_ts,
                "end_date": end_ts
            },
            "platform_metrics": self._get_platform_metrics(start_ts, end_ts),
            "user_metrics": self._get_user_metrics(start_ts, end_ts),
            "contract_metrics": self._get_contract_metrics(start_ts, end_ts),
            "financial_metrics": self._get_financial_metrics(start_ts, end_ts),
            "engagement_metrics": self._get_engagement_metrics(start_ts, end_ts)
        }
        
        return kpis
    
    def _get_platform_metrics(self, start_ts: Optional[str], end_ts: Optional[str]) -> Dict[str, Any]:
        """Get platform-level metrics."""
        try:
            with sqlite3.connect(self.analytics_db) as conn:
                cursor = conn.cursor()
                
                # Base query
                where_clause = ""
                params = []
                
                if start_ts and end_ts:
                    where_clause = "WHERE timestamp BETWEEN ? AND ?"
                    params = [start_ts, end_ts]
                
                # Total metrics
                cursor.execute(f"""
                    SELECT 
                        COUNT(*) as total_events,
                        COUNT(DISTINCT user_id) as unique_users,
                        COUNT(DISTINCT contract_id) as unique_contracts
                    FROM metrics
                    {where_clause}
                """, params)
                
                row = cursor.fetchone()
                
                return {
                    "total_events": row[0] if row else 0,
                    "unique_users": row[1] if row else 0,
                    "unique_contracts": row[2] if row else 0
                }
        except Exception as e:
            logger.error(f"Error getting platform metrics: {str(e)}")
            return {"error": str(e)}
    
    def _get_user_metrics(self, start_ts: Optional[str], end_ts: Optional[str]) -> Dict[str, Any]:
        """Get user-related metrics."""
        try:
            with sqlite3.connect(self.admin_db) as conn:
                cursor = conn.cursor()
                
                where_clause = ""
                params = []
                
                if start_ts and end_ts:
                    where_clause = "WHERE created_at BETWEEN ? AND ?"
                    params = [start_ts, end_ts]
                
                # User stats
                cursor.execute(f"""
                    SELECT 
                        COUNT(*) as total_users,
                        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_users,
                        SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended_users,
                        SUM(CASE WHEN status = 'banned' THEN 1 ELSE 0 END) as banned_users,
                        AVG(reputation_score) as avg_reputation,
                        SUM(total_contracts) as total_user_contracts,
                        SUM(total_earned) as total_user_earnings
                    FROM platform_users
                    {where_clause}
                """, params)
                
                row = cursor.fetchone()
                
                return {
                    "total_users": row[0] if row else 0,
                    "active_users": row[1] if row else 0,
                    "suspended_users": row[2] if row else 0,
                    "banned_users": row[3] if row else 0,
                    "average_reputation": round(row[4], 2) if row and row[4] else 0,
                    "total_contracts": row[5] if row else 0,
                    "total_earnings": round(row[6], 2) if row and row[6] else 0
                }
        except Exception as e:
            logger.error(f"Error getting user metrics: {str(e)}")
            return {"error": str(e)}
    
    def _get_contract_metrics(self, start_ts: Optional[str], end_ts: Optional[str]) -> Dict[str, Any]:
        """Get contract-related metrics."""
        try:
            with sqlite3.connect(self.analytics_db) as conn:
                cursor = conn.cursor()
                
                where_clause = ""
                params = []
                
                if start_ts and end_ts:
                    where_clause = "WHERE timestamp BETWEEN ? AND ?"
                    params = [start_ts, end_ts]
                
                # Contract metrics
                cursor.execute(f"""
                    SELECT 
                        metric_type,
                        COUNT(*) as count,
                        SUM(value) as total_value
                    FROM metrics
                    WHERE metric_type IN (
                        'contract_created', 
                        'contract_completed', 
                        'contract_disputed', 
                        'contract_cancelled'
                    )
                    {('AND ' + where_clause.replace('WHERE ', '')) if where_clause else ''}
                    GROUP BY metric_type
                """, params)
                
                results = cursor.fetchall()
                
                metrics = {
                    "contracts_created": 0,
                    "contracts_completed": 0,
                    "contracts_disputed": 0,
                    "contracts_cancelled": 0,
                    "total_contract_value": 0
                }
                
                for metric_type, count, total_value in results:
                    if metric_type == "contract_created":
                        metrics["contracts_created"] = count
                    elif metric_type == "contract_completed":
                        metrics["contracts_completed"] = count
                    elif metric_type == "contract_disputed":
                        metrics["contracts_disputed"] = count
                    elif metric_type == "contract_cancelled":
                        metrics["contracts_cancelled"] = count
                    
                    if total_value:
                        metrics["total_contract_value"] += total_value
                
                # Calculate success rate
                total_contracts = metrics["contracts_created"]
                if total_contracts > 0:
                    metrics["success_rate"] = round(
                        (metrics["contracts_completed"] / total_contracts) * 100, 2
                    )
                else:
                    metrics["success_rate"] = 0
                
                metrics["total_contract_value"] = round(metrics["total_contract_value"], 2)
                
                return metrics
        except Exception as e:
            logger.error(f"Error getting contract metrics: {str(e)}")
            return {"error": str(e)}
    
    def _get_financial_metrics(self, start_ts: Optional[str], end_ts: Optional[str]) -> Dict[str, Any]:
        """Get financial metrics."""
        try:
            with sqlite3.connect(self.analytics_db) as conn:
                cursor = conn.cursor()
                
                where_clause = ""
                params = []
                
                if start_ts and end_ts:
                    where_clause = "WHERE timestamp BETWEEN ? AND ?"
                    params = [start_ts, end_ts]
                
                # Financial metrics
                cursor.execute(f"""
                    SELECT 
                        metric_type,
                        COUNT(*) as count,
                        SUM(value) as total_value
                    FROM metrics
                    WHERE metric_type IN ('payment_processed', 'payment_released', 'template_purchased')
                    {('AND ' + where_clause.replace('WHERE ', '')) if where_clause else ''}
                    GROUP BY metric_type
                """, params)
                
                results = cursor.fetchall()
                
                metrics = {
                    "payments_processed": 0,
                    "payments_released": 0,
                    "templates_purchased": 0,
                    "total_payment_volume": 0,
                    "total_released_volume": 0,
                    "total_template_revenue": 0
                }
                
                for metric_type, count, total_value in results:
                    if metric_type == "payment_processed":
                        metrics["payments_processed"] = count
                        metrics["total_payment_volume"] = round(total_value or 0, 2)
                    elif metric_type == "payment_released":
                        metrics["payments_released"] = count
                        metrics["total_released_volume"] = round(total_value or 0, 2)
                    elif metric_type == "template_purchased":
                        metrics["templates_purchased"] = count
                        metrics["total_template_revenue"] = round(total_value or 0, 2)
                
                # Calculate platform revenue (assume 5% fee)
                metrics["platform_revenue"] = round(
                    metrics["total_payment_volume"] * 0.05, 2
                )
                
                return metrics
        except Exception as e:
            logger.error(f"Error getting financial metrics: {str(e)}")
            return {"error": str(e)}
    
    def _get_engagement_metrics(self, start_ts: Optional[str], end_ts: Optional[str]) -> Dict[str, Any]:
        """Get user engagement metrics."""
        try:
            with sqlite3.connect(self.analytics_db) as conn:
                cursor = conn.cursor()
                
                where_clause = ""
                params = []
                
                if start_ts and end_ts:
                    where_clause = "WHERE timestamp BETWEEN ? AND ?"
                    params = [start_ts, end_ts]
                
                # Engagement metrics
                cursor.execute(f"""
                    SELECT 
                        metric_type,
                        COUNT(*) as count
                    FROM metrics
                    WHERE metric_type IN (
                        'user_authenticated', 
                        'chat_message_sent', 
                        'ai_agent_called',
                        'nft_minted',
                        'milestone_completed'
                    )
                    {('AND ' + where_clause.replace('WHERE ', '')) if where_clause else ''}
                    GROUP BY metric_type
                """, params)
                
                results = cursor.fetchall()
                
                metrics = {
                    "total_logins": 0,
                    "chat_messages": 0,
                    "ai_agent_calls": 0,
                    "nfts_minted": 0,
                    "milestones_completed": 0
                }
                
                for metric_type, count in results:
                    if metric_type == "user_authenticated":
                        metrics["total_logins"] = count
                    elif metric_type == "chat_message_sent":
                        metrics["chat_messages"] = count
                    elif metric_type == "ai_agent_called":
                        metrics["ai_agent_calls"] = count
                    elif metric_type == "nft_minted":
                        metrics["nfts_minted"] = count
                    elif metric_type == "milestone_completed":
                        metrics["milestones_completed"] = count
                
                return metrics
        except Exception as e:
            logger.error(f"Error getting engagement metrics: {str(e)}")
            return {"error": str(e)}
    
    def export_to_csv(self, data: Dict[str, Any]) -> str:
        """Export data to CSV format."""
        output = StringIO()
        
        # Flatten nested dictionaries for CSV
        flattened_data = []
        
        def flatten_dict(d: Dict, parent_key: str = ''):
            items = []
            for k, v in d.items():
                new_key = f"{parent_key}.{k}" if parent_key else k
                if isinstance(v, dict):
                    items.extend(flatten_dict(v, new_key))
                else:
                    items.append((new_key, v))
            return items
        
        flat_data = dict(flatten_dict(data))
        
        # Write CSV
        writer = csv.writer(output)
        writer.writerow(['Metric', 'Value'])
        
        for key, value in flat_data.items():
            writer.writerow([key, value])
        
        return output.getvalue()
    
    def export_to_json(self, data: Dict[str, Any]) -> str:
        """Export data to JSON format."""
        return json.dumps(data, indent=2, ensure_ascii=False)
    
    def export_detailed_users(self, time_range: str, start_date: Optional[str] = None,
                             end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        """Export detailed user list."""
        start_ts, end_ts = self.calculate_time_range(time_range, start_date, end_date)
        
        try:
            with sqlite3.connect(self.admin_db) as conn:
                cursor = conn.cursor()
                
                where_clause = ""
                params = []
                
                if start_ts and end_ts:
                    where_clause = "WHERE created_at BETWEEN ? AND ?"
                    params = [start_ts, end_ts]
                
                cursor.execute(f"""
                    SELECT 
                        user_id, wallet_address, username, email, status,
                        reputation_score, total_contracts, total_earned,
                        trust_score, created_at, last_active
                    FROM platform_users
                    {where_clause}
                    ORDER BY created_at DESC
                """, params)
                
                columns = [desc[0] for desc in cursor.description]
                users = []
                
                for row in cursor.fetchall():
                    user = dict(zip(columns, row))
                    users.append(user)
                
                return users
        except Exception as e:
            logger.error(f"Error exporting users: {str(e)}")
            return []
    
    def export_detailed_contracts(self, time_range: str, start_date: Optional[str] = None,
                                 end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        """Export detailed contract list."""
        start_ts, end_ts = self.calculate_time_range(time_range, start_date, end_date)
        
        try:
            with sqlite3.connect(self.analytics_db) as conn:
                cursor = conn.cursor()
                
                where_clause = ""
                params = []
                
                if start_ts and end_ts:
                    where_clause = "WHERE timestamp BETWEEN ? AND ?"
                    params = [start_ts, end_ts]
                
                cursor.execute(f"""
                    SELECT 
                        id, metric_type, value, timestamp, 
                        user_id, contract_id, metadata
                    FROM metrics
                    WHERE metric_type LIKE 'contract_%'
                    {('AND ' + where_clause.replace('WHERE ', '')) if where_clause else ''}
                    ORDER BY timestamp DESC
                """, params)
                
                columns = [desc[0] for desc in cursor.description]
                contracts = []
                
                for row in cursor.fetchall():
                    contract = dict(zip(columns, row))
                    if contract.get('metadata'):
                        try:
                            contract['metadata'] = json.loads(contract['metadata'])
                        except:
                            pass
                    contracts.append(contract)
                
                return contracts
        except Exception as e:
            logger.error(f"Error exporting contracts: {str(e)}")
            return []
    
    def get_database_info(self) -> Dict[str, Any]:
        """Get information about where data is stored."""
        import os
        
        databases = {
            "analytics": {
                "path": os.path.abspath(self.analytics_db),
                "exists": os.path.exists(self.analytics_db),
                "size_mb": round(os.path.getsize(self.analytics_db) / (1024 * 1024), 2) if os.path.exists(self.analytics_db) else 0,
                "description": "Stores all platform metrics, KPIs, and analytics data"
            },
            "admin": {
                "path": os.path.abspath(self.admin_db),
                "exists": os.path.exists(self.admin_db),
                "size_mb": round(os.path.getsize(self.admin_db) / (1024 * 1024), 2) if os.path.exists(self.admin_db) else 0,
                "description": "Stores admin accounts, users, and platform management data"
            },
            "authentication": {
                "path": os.path.abspath(self.auth_db),
                "exists": os.path.exists(self.auth_db),
                "size_mb": round(os.path.getsize(self.auth_db) / (1024 * 1024), 2) if os.path.exists(self.auth_db) else 0,
                "description": "Stores W-CSAP authentication sessions and challenges"
            }
        }
        
        return databases
    
    def create_backup(self, backup_path: Optional[str] = None) -> Dict[str, str]:
        """Create backup of all databases."""
        import shutil
        
        if not backup_path:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = f"backups/backup_{timestamp}"
        
        os.makedirs(backup_path, exist_ok=True)
        
        backups = {}
        
        for db_name, db_file in [
            ("analytics", self.analytics_db),
            ("admin", self.admin_db),
            ("authentication", self.auth_db)
        ]:
            if os.path.exists(db_file):
                backup_file = os.path.join(backup_path, os.path.basename(db_file))
                shutil.copy2(db_file, backup_file)
                backups[db_name] = backup_file
                logger.info(f"✅ Backed up {db_name}: {backup_file}")
        
        return backups

# Global export system instance
admin_export_system = AdminExportSystem()
