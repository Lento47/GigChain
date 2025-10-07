"""
W-CSAP Behavioral Analytics & Anomaly Detection
================================================

PHASE 3 ENTERPRISE FEATURE:
Real-time behavioral analysis and anomaly detection for fraud prevention.

Features:
1. Authentication pattern analysis
2. Anomaly detection (unusual times, locations, behaviors)
3. Success/failure rate monitoring
4. Geographic analysis
5. Threat intelligence integration
6. ML-ready data pipeline
"""

import time
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from collections import defaultdict, deque
import statistics
import logging

logger = logging.getLogger(__name__)


@dataclass
class AuthenticationEvent:
    """Represents a single authentication event for analysis."""
    wallet_address: str
    timestamp: int
    event_type: str  # challenge_requested, authentication_success, authentication_failed
    ip_address: str
    user_agent: str
    location: Optional[str] = None
    risk_score: Optional[int] = None
    success: bool = True
    duration_ms: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class BehavioralProfile:
    """
    User's behavioral profile built from historical data.
    
    Used to detect anomalies by comparing current behavior
    to established patterns.
    """
    wallet_address: str
    
    # Temporal patterns
    typical_hours: List[int]  # Hours user typically authenticates (0-23)
    typical_days: List[int]   # Days of week (0-6)
    
    # Geographic patterns
    typical_countries: List[str]
    typical_cities: List[str]
    
    # Device patterns
    typical_devices: List[str]
    typical_ips: List[str]
    
    # Success metrics
    avg_success_rate: float  # 0.0 to 1.0
    total_authentications: int
    
    # Time metrics
    avg_auth_duration_ms: float
    
    # Updated timestamp
    last_updated: int
    
    def is_typical_hour(self, hour: int) -> bool:
        """Check if hour is typical for user."""
        return hour in self.typical_hours
    
    def is_typical_location(self, country: str, city: Optional[str] = None) -> bool:
        """Check if location is typical for user."""
        if country not in self.typical_countries:
            return False
        
        if city and city not in self.typical_cities:
            return False
        
        return True


class AnomalyDetector:
    """
    Detects anomalous authentication patterns.
    
    Uses statistical methods and rules-based detection:
    - Time-of-day anomalies
    - Geographic anomalies
    - Velocity anomalies
    - Behavioral deviations
    """
    
    def __init__(self):
        # User behavioral profiles
        # wallet_address -> BehavioralProfile
        self._profiles: Dict[str, BehavioralProfile] = {}
        
        # Recent events for pattern analysis
        # wallet_address -> deque of AuthenticationEvent
        self._recent_events: Dict[str, deque] = defaultdict(lambda: deque(maxlen=100))
    
    def detect_anomalies(
        self,
        wallet_address: str,
        current_event: AuthenticationEvent
    ) -> List[str]:
        """
        Detect anomalies in current authentication event.
        
        Args:
            wallet_address: Wallet address
            current_event: Current authentication event
            
        Returns:
            List of detected anomalies
        """
        anomalies = []
        
        # Get or create profile
        profile = self._profiles.get(wallet_address)
        if not profile:
            # No profile yet, build one
            self._build_profile(wallet_address)
            profile = self._profiles.get(wallet_address)
        
        if not profile:
            # Still no profile (new user), can't detect anomalies
            return []
        
        # Check time-of-day anomaly
        event_hour = datetime.fromtimestamp(current_event.timestamp).hour
        if not profile.is_typical_hour(event_hour):
            anomalies.append("unusual_time_of_day")
            logger.info(
                f"⚠️ Unusual hour for {wallet_address[:10]}...: "
                f"{event_hour}h (typical: {profile.typical_hours})"
            )
        
        # Check geographic anomaly
        if current_event.location:
            country = current_event.location.split(",")[-1].strip()
            city = current_event.location.split(",")[0].strip()
            
            if not profile.is_typical_location(country, city):
                anomalies.append("unusual_location")
                logger.info(
                    f"⚠️ Unusual location for {wallet_address[:10]}...: "
                    f"{current_event.location}"
                )
        
        # Check device anomaly
        if current_event.user_agent not in profile.typical_devices:
            anomalies.append("unusual_device")
        
        # Check IP anomaly
        if current_event.ip_address not in profile.typical_ips:
            anomalies.append("unusual_ip")
        
        # Check frequency anomaly (too many requests)
        recent_count = self._count_recent_events(wallet_address, within_seconds=300)
        if recent_count > 10:  # More than 10 auth attempts in 5 min
            anomalies.append("unusual_frequency")
            logger.warning(
                f"⚠️ High frequency for {wallet_address[:10]}...: "
                f"{recent_count} attempts in 5min"
            )
        
        # Check failure rate anomaly
        failure_rate = self._calculate_recent_failure_rate(wallet_address)
        if failure_rate > 0.5:  # More than 50% failures
            anomalies.append("high_failure_rate")
            logger.warning(
                f"⚠️ High failure rate for {wallet_address[:10]}...: "
                f"{failure_rate * 100:.1f}%"
            )
        
        return anomalies
    
    def record_event(self, event: AuthenticationEvent):
        """Record event for analysis."""
        self._recent_events[event.wallet_address].append(event)
        
        # Update profile periodically
        if len(self._recent_events[event.wallet_address]) % 10 == 0:
            self._build_profile(event.wallet_address)
    
    def _build_profile(self, wallet_address: str) -> Optional[BehavioralProfile]:
        """
        Build or update behavioral profile from historical events.
        
        Args:
            wallet_address: Wallet address
            
        Returns:
            BehavioralProfile or None if insufficient data
        """
        events = list(self._recent_events.get(wallet_address, []))
        
        if len(events) < 5:  # Need minimum data
            return None
        
        # Extract patterns
        hours = [datetime.fromtimestamp(e.timestamp).hour for e in events]
        days = [datetime.fromtimestamp(e.timestamp).weekday() for e in events]
        
        # Most common hours (top 50%)
        hour_counts = {}
        for hour in hours:
            hour_counts[hour] = hour_counts.get(hour, 0) + 1
        sorted_hours = sorted(hour_counts.items(), key=lambda x: x[1], reverse=True)
        typical_hours = [h for h, _ in sorted_hours[:max(len(sorted_hours) // 2, 1)]]
        
        # Extract locations
        locations = [e.location for e in events if e.location]
        countries = list(set([loc.split(",")[-1].strip() for loc in locations]))
        cities = list(set([loc.split(",")[0].strip() for loc in locations]))
        
        # Extract devices and IPs
        devices = list(set([e.user_agent for e in events]))
        ips = list(set([e.ip_address for e in events]))
        
        # Calculate success rate
        successes = sum(1 for e in events if e.success)
        success_rate = successes / len(events) if events else 0.0
        
        # Calculate avg duration
        durations = [e.duration_ms for e in events if e.duration_ms]
        avg_duration = statistics.mean(durations) if durations else 0.0
        
        profile = BehavioralProfile(
            wallet_address=wallet_address,
            typical_hours=typical_hours,
            typical_days=list(set(days)),
            typical_countries=countries,
            typical_cities=cities,
            typical_devices=devices[:10],  # Keep top 10
            typical_ips=ips[:20],  # Keep top 20
            avg_success_rate=success_rate,
            total_authentications=len(events),
            avg_auth_duration_ms=avg_duration,
            last_updated=int(time.time())
        )
        
        self._profiles[wallet_address] = profile
        
        logger.debug(
            f"📊 Updated profile for {wallet_address[:10]}...: "
            f"{len(events)} events, {success_rate * 100:.1f}% success"
        )
        
        return profile
    
    def _count_recent_events(
        self,
        wallet_address: str,
        within_seconds: int = 300
    ) -> int:
        """Count events within time window."""
        events = self._recent_events.get(wallet_address, [])
        current_time = int(time.time())
        
        count = sum(
            1 for e in events
            if current_time - e.timestamp <= within_seconds
        )
        
        return count
    
    def _calculate_recent_failure_rate(
        self,
        wallet_address: str,
        within_seconds: int = 300
    ) -> float:
        """Calculate failure rate in recent time window."""
        events = self._recent_events.get(wallet_address, [])
        current_time = int(time.time())
        
        recent = [
            e for e in events
            if current_time - e.timestamp <= within_seconds
        ]
        
        if not recent:
            return 0.0
        
        failures = sum(1 for e in recent if not e.success)
        return failures / len(recent)


class AnalyticsDashboard:
    """
    Provides analytics and metrics for monitoring.
    
    Real-time and historical analytics for:
    - Authentication rates
    - Success/failure trends
    - Geographic distribution
    - Device breakdown
    - Risk score distribution
    """
    
    def __init__(self):
        self.anomaly_detector = AnomalyDetector()
        
        # Metrics storage
        self._auth_events: deque = deque(maxlen=10000)  # Last 10k events
        self._hourly_stats: Dict[int, Dict[str, int]] = defaultdict(lambda: {
            "total": 0,
            "success": 0,
            "failed": 0,
            "blocked": 0
        })
    
    def record_authentication(self, event: AuthenticationEvent):
        """Record authentication event."""
        self._auth_events.append(event)
        self.anomaly_detector.record_event(event)
        
        # Update hourly stats
        hour_key = event.timestamp // 3600  # Hour bucket
        if event.success:
            self._hourly_stats[hour_key]["success"] += 1
        else:
            self._hourly_stats[hour_key]["failed"] += 1
        self._hourly_stats[hour_key]["total"] += 1
    
    def get_real_time_metrics(self) -> Dict[str, Any]:
        """Get real-time authentication metrics."""
        current_time = int(time.time())
        last_hour = current_time - 3600
        last_24h = current_time - 86400
        
        # Events in last hour
        events_1h = [e for e in self._auth_events if e.timestamp >= last_hour]
        events_24h = [e for e in self._auth_events if e.timestamp >= last_24h]
        
        # Calculate metrics
        total_1h = len(events_1h)
        success_1h = sum(1 for e in events_1h if e.success)
        failed_1h = total_1h - success_1h
        
        total_24h = len(events_24h)
        success_24h = sum(1 for e in events_24h if e.success)
        failed_24h = total_24h - success_24h
        
        # Risk score distribution
        risk_scores = [e.risk_score for e in events_24h if e.risk_score is not None]
        avg_risk = statistics.mean(risk_scores) if risk_scores else 0.0
        
        return {
            "last_hour": {
                "total": total_1h,
                "success": success_1h,
                "failed": failed_1h,
                "success_rate": success_1h / total_1h if total_1h > 0 else 0.0
            },
            "last_24h": {
                "total": total_24h,
                "success": success_24h,
                "failed": failed_24h,
                "success_rate": success_24h / total_24h if total_24h > 0 else 0.0,
                "avg_risk_score": round(avg_risk, 2)
            },
            "timestamp": current_time
        }
    
    def get_geographic_distribution(self, period_hours: int = 24) -> Dict[str, int]:
        """Get geographic distribution of authentications."""
        cutoff = int(time.time()) - (period_hours * 3600)
        recent_events = [e for e in self._auth_events if e.timestamp >= cutoff]
        
        # Count by country
        countries = defaultdict(int)
        for event in recent_events:
            if event.location:
                country = event.location.split(",")[-1].strip()
                countries[country] += 1
        
        return dict(countries)
    
    def get_device_breakdown(self, period_hours: int = 24) -> Dict[str, int]:
        """Get device type breakdown."""
        cutoff = int(time.time()) - (period_hours * 3600)
        recent_events = [e for e in self._auth_events if e.timestamp >= cutoff]
        
        # Categorize devices
        devices = {"desktop": 0, "mobile": 0, "tablet": 0, "other": 0}
        
        for event in recent_events:
            ua = event.user_agent.lower()
            if "mobile" in ua or "iphone" in ua or "android" in ua:
                devices["mobile"] += 1
            elif "tablet" in ua or "ipad" in ua:
                devices["tablet"] += 1
            elif "mozilla" in ua or "chrome" in ua or "safari" in ua:
                devices["desktop"] += 1
            else:
                devices["other"] += 1
        
        return devices
    
    def get_anomaly_summary(self, period_hours: int = 24) -> Dict[str, Any]:
        """Get summary of detected anomalies."""
        cutoff = int(time.time()) - (period_hours * 3600)
        recent_events = [e for e in self._auth_events if e.timestamp >= cutoff]
        
        anomaly_counts = defaultdict(int)
        
        for event in recent_events:
            # Detect anomalies for this event
            anomalies = self.anomaly_detector.detect_anomalies(
                event.wallet_address,
                event
            )
            
            for anomaly in anomalies:
                anomaly_counts[anomaly] += 1
        
        return {
            "period_hours": period_hours,
            "total_events": len(recent_events),
            "events_with_anomalies": sum(1 for e in recent_events if e.risk_score and e.risk_score > 50),
            "anomaly_types": dict(anomaly_counts),
            "high_risk_events": sum(1 for e in recent_events if e.risk_score and e.risk_score > 70)
        }
    
    def get_success_rate_trend(self, hours: int = 24) -> List[Dict[str, Any]]:
        """Get hourly success rate trend."""
        current_hour = int(time.time()) // 3600
        trend = []
        
        for i in range(hours):
            hour_key = current_hour - i
            stats = self._hourly_stats.get(hour_key, {"total": 0, "success": 0})
            
            total = stats["total"]
            success = stats["success"]
            success_rate = success / total if total > 0 else 0.0
            
            trend.append({
                "hour": hour_key,
                "timestamp": hour_key * 3600,
                "total": total,
                "success": success,
                "success_rate": round(success_rate, 3)
            })
        
        return list(reversed(trend))
    
    def get_top_risk_wallets(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get wallets with highest average risk scores."""
        wallet_risks = defaultdict(list)
        
        # Collect risk scores per wallet
        for event in self._auth_events:
            if event.risk_score is not None:
                wallet_risks[event.wallet_address].append(event.risk_score)
        
        # Calculate average risk per wallet
        wallet_avg_risk = {
            wallet: statistics.mean(scores)
            for wallet, scores in wallet_risks.items()
        }
        
        # Sort by risk
        sorted_wallets = sorted(
            wallet_avg_risk.items(),
            key=lambda x: x[1],
            reverse=True
        )[:limit]
        
        return [
            {
                "wallet_address": wallet,
                "avg_risk_score": round(risk, 2),
                "auth_count": len(wallet_risks[wallet])
            }
            for wallet, risk in sorted_wallets
        ]


class ThreatIntelligence:
    """
    Threat intelligence integration.
    
    In production, integrate with:
    - AbuseIPDB
    - VirusTotal
    - Shodan
    - Custom threat feeds
    """
    
    def __init__(self):
        # Known malicious IPs (example)
        self._malicious_ips: set = set()
        
        # Known compromised wallets (example)
        self._compromised_wallets: set = set()
        
        # IP reputation cache
        self._ip_reputation: Dict[str, int] = {}  # ip -> score (0-100)
    
    def check_ip_threat(self, ip_address: str) -> Tuple[bool, int]:
        """
        Check if IP is a known threat.
        
        Args:
            ip_address: IP to check
            
        Returns:
            Tuple of (is_threat, threat_score)
        """
        # Check cache
        if ip_address in self._ip_reputation:
            score = self._ip_reputation[ip_address]
            return (score > 70, score)
        
        # Check malicious list
        if ip_address in self._malicious_ips:
            return (True, 100)
        
        # In production: Query threat intelligence API
        # score = abuseipdb_api.check(ip_address)
        # self._ip_reputation[ip_address] = score
        # return (score > 70, score)
        
        return (False, 0)
    
    def check_wallet_compromise(self, wallet_address: str) -> bool:
        """
        Check if wallet is known to be compromised.
        
        Args:
            wallet_address: Wallet to check
            
        Returns:
            True if wallet is compromised
        """
        if wallet_address in self._compromised_wallets:
            logger.warning(f"⚠️ Compromised wallet detected: {wallet_address[:10]}...")
            return True
        
        # In production: Check against threat databases
        # is_compromised = threat_db.check_wallet(wallet_address)
        # return is_compromised
        
        return False
    
    def report_malicious_ip(self, ip_address: str, reason: str):
        """Report a malicious IP."""
        self._malicious_ips.add(ip_address)
        self._ip_reputation[ip_address] = 100
        
        logger.warning(f"🚨 Reported malicious IP: {ip_address} (reason: {reason})")
    
    def report_compromised_wallet(self, wallet_address: str, reason: str):
        """Report a compromised wallet."""
        self._compromised_wallets.add(wallet_address)
        
        logger.warning(
            f"🚨 Reported compromised wallet: {wallet_address[:10]}... "
            f"(reason: {reason})"
        )


# Singleton instances
_analytics_dashboard_instance: Optional[AnalyticsDashboard] = None
_threat_intelligence_instance: Optional[ThreatIntelligence] = None


def get_analytics_dashboard() -> AnalyticsDashboard:
    """Get or create analytics dashboard singleton."""
    global _analytics_dashboard_instance
    
    if _analytics_dashboard_instance is None:
        _analytics_dashboard_instance = AnalyticsDashboard()
    
    return _analytics_dashboard_instance


def get_threat_intelligence() -> ThreatIntelligence:
    """Get or create threat intelligence singleton."""
    global _threat_intelligence_instance
    
    if _threat_intelligence_instance is None:
        _threat_intelligence_instance = ThreatIntelligence()
    
    return _threat_intelligence_instance


__all__ = [
    'AuthenticationEvent',
    'BehavioralProfile',
    'AnomalyDetector',
    'AnalyticsDashboard',
    'ThreatIntelligence',
    'get_analytics_dashboard',
    'get_threat_intelligence'
]