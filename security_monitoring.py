"""
GigChain.io - Security Monitoring & SIEM Integration
Sends logs to Splunk, Elastic, Datadog + AI Anomaly Detection
"""

import json
import logging
import requests
import hashlib
import time
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict
from enum import Enum
from collections import defaultdict, deque
import statistics

logger = logging.getLogger(__name__)

class EventSeverity(str, Enum):
    """Event severity levels."""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"
    SECURITY = "security"

class EventCategory(str, Enum):
    """Event categories."""
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    CONTRACT = "contract"
    PAYMENT = "payment"
    WALLET = "wallet"
    ADMIN = "admin"
    API = "api"
    DATABASE = "database"
    SYSTEM = "system"

@dataclass
class SecurityEvent:
    """Security event structure."""
    timestamp: str
    event_id: str
    category: str
    severity: str
    user_id: Optional[str]
    wallet_address: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    action: str
    result: str  # success, failure, blocked
    details: Dict[str, Any]
    risk_score: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return asdict(self)
    
    def to_json(self) -> str:
        """Convert to JSON string."""
        return json.dumps(self.to_dict())

class SIEMAdapter:
    """Base adapter for SIEM integrations."""
    
    def send_event(self, event: SecurityEvent) -> bool:
        """Send event to SIEM. Override in subclasses."""
        raise NotImplementedError

class SplunkAdapter(SIEMAdapter):
    """Splunk HTTP Event Collector (HEC) adapter."""
    
    def __init__(self, url: str, token: str):
        """
        Initialize Splunk adapter.
        
        Args:
            url: Splunk HEC URL (e.g., https://splunk.example.com:8088/services/collector)
            token: HEC token
        """
        self.url = url
        self.token = token
        self.headers = {
            "Authorization": f"Splunk {token}",
            "Content-Type": "application/json"
        }
    
    def send_event(self, event: SecurityEvent) -> bool:
        """Send event to Splunk."""
        try:
            payload = {
                "time": int(datetime.fromisoformat(event.timestamp).timestamp()),
                "source": "gigchain",
                "sourcetype": "_json",
                "event": event.to_dict()
            }
            
            response = requests.post(
                self.url,
                headers=self.headers,
                json=payload,
                timeout=5
            )
            
            if response.status_code == 200:
                logger.debug(f"✅ Event sent to Splunk: {event.event_id}")
                return True
            else:
                logger.warning(f"⚠️  Splunk error: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Splunk send failed: {str(e)}")
            return False

class ElasticAdapter(SIEMAdapter):
    """Elasticsearch adapter."""
    
    def __init__(self, url: str, index: str, api_key: Optional[str] = None,
                 username: Optional[str] = None, password: Optional[str] = None):
        """
        Initialize Elasticsearch adapter.
        
        Args:
            url: Elasticsearch URL (e.g., https://elastic.example.com:9200)
            index: Index name (e.g., gigchain-security)
            api_key: API key for authentication
            username: Username for basic auth
            password: Password for basic auth
        """
        self.url = url.rstrip('/')
        self.index = index
        self.headers = {"Content-Type": "application/json"}
        
        if api_key:
            self.headers["Authorization"] = f"ApiKey {api_key}"
        elif username and password:
            import base64
            credentials = base64.b64encode(f"{username}:{password}".encode()).decode()
            self.headers["Authorization"] = f"Basic {credentials}"
    
    def send_event(self, event: SecurityEvent) -> bool:
        """Send event to Elasticsearch."""
        try:
            # Elasticsearch document
            doc = event.to_dict()
            doc["@timestamp"] = event.timestamp
            
            # Index document
            url = f"{self.url}/{self.index}/_doc/{event.event_id}"
            
            response = requests.post(
                url,
                headers=self.headers,
                json=doc,
                timeout=5
            )
            
            if response.status_code in [200, 201]:
                logger.debug(f"✅ Event sent to Elastic: {event.event_id}")
                return True
            else:
                logger.warning(f"⚠️  Elastic error: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Elastic send failed: {str(e)}")
            return False

class DatadogAdapter(SIEMAdapter):
    """Datadog logs adapter."""
    
    def __init__(self, api_key: str, site: str = "datadoghq.com"):
        """
        Initialize Datadog adapter.
        
        Args:
            api_key: Datadog API key
            site: Datadog site (datadoghq.com, datadoghq.eu, etc.)
        """
        self.api_key = api_key
        self.url = f"https://http-intake.logs.{site}/api/v2/logs"
        self.headers = {
            "DD-API-KEY": api_key,
            "Content-Type": "application/json"
        }
    
    def send_event(self, event: SecurityEvent) -> bool:
        """Send event to Datadog."""
        try:
            payload = {
                "ddsource": "gigchain",
                "ddtags": f"category:{event.category},severity:{event.severity}",
                "hostname": "gigchain-api",
                "message": json.dumps(event.to_dict()),
                "service": "gigchain"
            }
            
            response = requests.post(
                self.url,
                headers=self.headers,
                json=[payload],  # Datadog expects array
                timeout=5
            )
            
            if response.status_code == 202:
                logger.debug(f"✅ Event sent to Datadog: {event.event_id}")
                return True
            else:
                logger.warning(f"⚠️  Datadog error: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Datadog send failed: {str(e)}")
            return False

class AnomalyDetector:
    """
    AI-powered anomaly detection system.
    Detects suspicious patterns in user behavior.
    """
    
    def __init__(self):
        self.user_profiles = defaultdict(lambda: {
            "login_times": deque(maxlen=100),
            "login_ips": deque(maxlen=50),
            "contract_amounts": deque(maxlen=50),
            "api_calls": deque(maxlen=200),
            "failed_logins": deque(maxlen=20),
            "total_events": 0,
            "first_seen": None,
            "last_seen": None
        })
        
        self.global_stats = {
            "avg_contract_amount": 0,
            "avg_api_calls_per_user": 0,
            "common_ips": set(),
            "suspicious_ips": set()
        }
    
    def analyze_event(self, event: SecurityEvent) -> Dict[str, Any]:
        """
        Analyze event for anomalies using AI patterns.
        
        Returns:
            {
                "is_anomaly": bool,
                "risk_score": float (0-100),
                "reasons": List[str],
                "recommendations": List[str]
            }
        """
        anomalies = []
        risk_score = 0.0
        recommendations = []
        
        user_id = event.user_id or event.wallet_address
        if not user_id:
            return {"is_anomaly": False, "risk_score": 0, "reasons": [], "recommendations": []}
        
        profile = self.user_profiles[user_id]
        
        # Update profile
        self._update_profile(profile, event)
        
        # 1. Time-based anomalies
        time_anomaly = self._detect_time_anomaly(profile, event)
        if time_anomaly:
            anomalies.append(time_anomaly)
            risk_score += 15
        
        # 2. Location anomalies
        location_anomaly = self._detect_location_anomaly(profile, event)
        if location_anomaly:
            anomalies.append(location_anomaly)
            risk_score += 20
        
        # 3. Velocity anomalies
        velocity_anomaly = self._detect_velocity_anomaly(profile, event)
        if velocity_anomaly:
            anomalies.append(velocity_anomaly)
            risk_score += 25
        
        # 4. Amount anomalies (for payments)
        if event.category == EventCategory.PAYMENT:
            amount_anomaly = self._detect_amount_anomaly(profile, event)
            if amount_anomaly:
                anomalies.append(amount_anomaly)
                risk_score += 30
        
        # 5. Failed login patterns
        if event.category == EventCategory.AUTHENTICATION:
            login_anomaly = self._detect_login_anomaly(profile, event)
            if login_anomaly:
                anomalies.append(login_anomaly)
                risk_score += 35
        
        # 6. API abuse detection
        api_anomaly = self._detect_api_abuse(profile, event)
        if api_anomaly:
            anomalies.append(api_anomaly)
            risk_score += 20
        
        # 7. New user suspicious activity
        new_user_anomaly = self._detect_new_user_suspicious_activity(profile, event)
        if new_user_anomaly:
            anomalies.append(new_user_anomaly)
            risk_score += 25
        
        # Generate recommendations
        if risk_score > 70:
            recommendations.append("🔴 BLOCK: High risk - block user immediately")
            recommendations.append("🔍 INVESTIGATE: Manual review required")
        elif risk_score > 50:
            recommendations.append("⚠️  ALERT: Require additional verification")
            recommendations.append("📧 NOTIFY: Alert security team")
        elif risk_score > 30:
            recommendations.append("👀 MONITOR: Increase monitoring")
        
        return {
            "is_anomaly": len(anomalies) > 0,
            "risk_score": min(risk_score, 100),
            "reasons": anomalies,
            "recommendations": recommendations,
            "profile_age_days": self._get_profile_age_days(profile)
        }
    
    def _update_profile(self, profile: Dict, event: SecurityEvent):
        """Update user profile with new event."""
        now = datetime.now()
        
        if not profile["first_seen"]:
            profile["first_seen"] = now
        
        profile["last_seen"] = now
        profile["total_events"] += 1
        
        # Track event-specific data
        if event.category == EventCategory.AUTHENTICATION:
            profile["login_times"].append(now)
            if event.ip_address:
                profile["login_ips"].append(event.ip_address)
            
            if event.result == "failure":
                profile["failed_logins"].append(now)
        
        elif event.category == EventCategory.PAYMENT:
            if "amount" in event.details:
                profile["contract_amounts"].append(event.details["amount"])
        
        profile["api_calls"].append(now)
    
    def _detect_time_anomaly(self, profile: Dict, event: SecurityEvent) -> Optional[str]:
        """Detect unusual login times."""
        if event.category != EventCategory.AUTHENTICATION:
            return None
        
        hour = datetime.fromisoformat(event.timestamp).hour
        
        # Suspicious hours (2 AM - 5 AM)
        if 2 <= hour <= 5:
            return f"Login at unusual hour: {hour}:00"
        
        return None
    
    def _detect_location_anomaly(self, profile: Dict, event: SecurityEvent) -> Optional[str]:
        """Detect impossible travel."""
        if not event.ip_address or len(profile["login_ips"]) < 2:
            return None
        
        # Check if IP changed drastically in short time
        recent_ips = list(profile["login_ips"])[-5:]
        unique_recent_ips = set(recent_ips)
        
        if len(unique_recent_ips) > 3:
            return f"Multiple IPs in short time: {len(unique_recent_ips)} different IPs"
        
        return None
    
    def _detect_velocity_anomaly(self, profile: Dict, event: SecurityEvent) -> Optional[str]:
        """Detect rapid-fire actions."""
        recent_calls = list(profile["api_calls"])[-10:]
        
        if len(recent_calls) >= 10:
            # Check if 10 calls in less than 10 seconds
            time_span = (recent_calls[-1] - recent_calls[0]).total_seconds()
            if time_span < 10:
                return f"Rapid API calls: {len(recent_calls)} calls in {time_span:.1f}s"
        
        return None
    
    def _detect_amount_anomaly(self, profile: Dict, event: SecurityEvent) -> Optional[str]:
        """Detect unusual payment amounts."""
        if "amount" in event.details:
            amount = event.details["amount"]
            
            # Check against user's history
            if len(profile["contract_amounts"]) >= 5:
                avg_amount = statistics.mean(profile["contract_amounts"])
                std_dev = statistics.stdev(profile["contract_amounts"]) if len(profile["contract_amounts"]) > 1 else 0
                
                # Amount is 3+ standard deviations from mean
                if std_dev > 0 and abs(amount - avg_amount) > (3 * std_dev):
                    return f"Unusual amount: ${amount:.2f} (avg: ${avg_amount:.2f})"
                
                # Very large amount (10x average)
                if amount > avg_amount * 10:
                    return f"Extremely large amount: ${amount:.2f} (10x user average)"
        
        return None
    
    def _detect_login_anomaly(self, profile: Dict, event: SecurityEvent) -> Optional[str]:
        """Detect brute force or credential stuffing."""
        if event.result != "failure":
            return None
        
        # Check recent failed logins
        recent_failures = list(profile["failed_logins"])
        
        if len(recent_failures) >= 5:
            # 5+ failures in last 10 minutes
            time_span = (recent_failures[-1] - recent_failures[0]).total_seconds()
            if time_span < 600:  # 10 minutes
                return f"Multiple failed logins: {len(recent_failures)} in {time_span/60:.1f} minutes"
        
        return None
    
    def _detect_api_abuse(self, profile: Dict, event: SecurityEvent) -> Optional[str]:
        """Detect API abuse patterns."""
        recent_calls = list(profile["api_calls"])[-100:]
        
        if len(recent_calls) >= 100:
            # 100 calls in last minute
            time_span = (recent_calls[-1] - recent_calls[0]).total_seconds()
            if time_span < 60:
                return f"API abuse: {len(recent_calls)} calls in {time_span:.1f}s"
        
        return None
    
    def _detect_new_user_suspicious_activity(self, profile: Dict, event: SecurityEvent) -> Optional[str]:
        """Detect suspicious activity from new users."""
        age_days = self._get_profile_age_days(profile)
        
        # User created less than 1 hour ago
        if age_days < 1/24:
            # High-value transaction immediately
            if event.category == EventCategory.PAYMENT:
                if "amount" in event.details and event.details["amount"] > 1000:
                    return f"New user large transaction: ${event.details['amount']:.2f} within first hour"
        
        return None
    
    def _get_profile_age_days(self, profile: Dict) -> float:
        """Get profile age in days."""
        if not profile["first_seen"]:
            return 0
        
        age = datetime.now() - profile["first_seen"]
        return age.total_seconds() / 86400

class SecurityMonitoring:
    """
    Main security monitoring system.
    Integrates SIEMs and AI anomaly detection.
    """
    
    def __init__(self):
        self.siem_adapters: List[SIEMAdapter] = []
        self.anomaly_detector = AnomalyDetector()
        self.event_buffer = deque(maxlen=1000)
        self.alerts_sent = deque(maxlen=100)
        
        # Load configuration from environment
        self._configure_siems()
    
    def _configure_siems(self):
        """Configure SIEM integrations from environment variables."""
        import os
        
        # Splunk
        splunk_url = os.getenv('SPLUNK_HEC_URL')
        splunk_token = os.getenv('SPLUNK_HEC_TOKEN')
        if splunk_url and splunk_token:
            self.siem_adapters.append(SplunkAdapter(splunk_url, splunk_token))
            logger.info("✅ Splunk integration configured")
        
        # Elasticsearch
        elastic_url = os.getenv('ELASTIC_URL')
        elastic_index = os.getenv('ELASTIC_INDEX', 'gigchain-security')
        elastic_api_key = os.getenv('ELASTIC_API_KEY')
        if elastic_url:
            self.siem_adapters.append(
                ElasticAdapter(elastic_url, elastic_index, api_key=elastic_api_key)
            )
            logger.info("✅ Elasticsearch integration configured")
        
        # Datadog
        datadog_api_key = os.getenv('DATADOG_API_KEY')
        if datadog_api_key:
            self.siem_adapters.append(DatadogAdapter(datadog_api_key))
            logger.info("✅ Datadog integration configured")
        
        if not self.siem_adapters:
            logger.warning("⚠️  No SIEM integrations configured")
    
    def log_event(self, 
                  category: str,
                  action: str,
                  result: str,
                  severity: str = "info",
                  user_id: Optional[str] = None,
                  wallet_address: Optional[str] = None,
                  ip_address: Optional[str] = None,
                  user_agent: Optional[str] = None,
                  details: Optional[Dict[str, Any]] = None) -> SecurityEvent:
        """
        Log security event and send to SIEMs + analyze with AI.
        
        Args:
            category: Event category (authentication, contract, payment, etc.)
            action: Action performed (login, create_contract, payment, etc.)
            result: Result (success, failure, blocked)
            severity: Event severity (info, warning, error, critical, security)
            user_id: User ID
            wallet_address: Wallet address
            ip_address: IP address
            user_agent: User agent string
            details: Additional details
        
        Returns:
            SecurityEvent object
        """
        # Create event
        event = SecurityEvent(
            timestamp=datetime.now().isoformat(),
            event_id=self._generate_event_id(),
            category=category,
            severity=severity,
            user_id=user_id,
            wallet_address=wallet_address,
            ip_address=ip_address,
            user_agent=user_agent,
            action=action,
            result=result,
            details=details or {}
        )
        
        # AI Anomaly Detection
        anomaly_result = self.anomaly_detector.analyze_event(event)
        event.risk_score = anomaly_result["risk_score"]
        event.details["ai_analysis"] = anomaly_result
        
        # Upgrade severity if high risk
        if anomaly_result["risk_score"] > 70:
            event.severity = EventSeverity.CRITICAL.value
        elif anomaly_result["risk_score"] > 50:
            event.severity = EventSeverity.SECURITY.value
        
        # Buffer event
        self.event_buffer.append(event)
        
        # Send to SIEMs (async in production)
        for adapter in self.siem_adapters:
            try:
                adapter.send_event(event)
            except Exception as e:
                logger.error(f"SIEM send error: {str(e)}")
        
        # Log to local file (backup)
        self._log_to_file(event)
        
        # Send alert if critical
        if anomaly_result["is_anomaly"] and anomaly_result["risk_score"] > 50:
            self._send_alert(event, anomaly_result)
        
        return event
    
    def _generate_event_id(self) -> str:
        """Generate unique event ID."""
        timestamp = str(time.time())
        random = str(time.time_ns())
        return hashlib.sha256(f"{timestamp}{random}".encode()).hexdigest()[:16]
    
    def _log_to_file(self, event: SecurityEvent):
        """Log event to local file (backup)."""
        try:
            log_file = f"security_events_{datetime.now().strftime('%Y%m%d')}.log"
            with open(log_file, 'a') as f:
                f.write(event.to_json() + '\n')
        except Exception as e:
            logger.error(f"File logging error: {str(e)}")
    
    def _send_alert(self, event: SecurityEvent, analysis: Dict[str, Any]):
        """Send alert for high-risk events."""
        alert_id = f"{event.user_id}_{event.category}_{event.action}"
        
        # Avoid duplicate alerts (same user+category+action in last hour)
        recent_alerts = [a for a in self.alerts_sent if (datetime.now() - datetime.fromisoformat(a)).total_seconds() < 3600]
        
        if alert_id in [a for a in recent_alerts]:
            return  # Already alerted
        
        # Log alert
        logger.warning(f"""
╔══════════════════════════════════════════════════════════════╗
║              🚨 SECURITY ALERT - ANOMALY DETECTED             ║
╠══════════════════════════════════════════════════════════════╣
║ User:      {event.user_id or event.wallet_address}
║ Action:    {event.action}
║ Category:  {event.category}
║ Risk:      {analysis['risk_score']:.0f}/100
║ IP:        {event.ip_address}
║ Time:      {event.timestamp}
╠══════════════════════════════════════════════════════════════╣
║ Reasons:
║ {chr(10).join('  • ' + r for r in analysis['reasons'])}
╠══════════════════════════════════════════════════════════════╣
║ Recommendations:
║ {chr(10).join('  ' + r for r in analysis['recommendations'])}
╚══════════════════════════════════════════════════════════════╝
        """)
        
        self.alerts_sent.append(datetime.now().isoformat())
    
    def get_stats(self) -> Dict[str, Any]:
        """Get monitoring statistics."""
        return {
            "total_events": len(self.event_buffer),
            "siem_integrations": len(self.siem_adapters),
            "alerts_sent": len(self.alerts_sent),
            "users_monitored": len(self.anomaly_detector.user_profiles),
            "recent_high_risk": len([e for e in self.event_buffer if e.risk_score > 50])
        }

# Global instance
security_monitor = SecurityMonitoring()

def log_security_event(**kwargs) -> SecurityEvent:
    """Convenience function to log security event."""
    return security_monitor.log_event(**kwargs)
