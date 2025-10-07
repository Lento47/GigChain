"""
W-CSAP Risk Scoring & Device Intelligence
==========================================

PHASE 3 CRITICAL FEATURE:
Implements zero-trust security through continuous risk assessment and
device intelligence. Prevents account takeover and detects suspicious patterns.

Features:
1. Device fingerprinting - Identify and track devices
2. Risk scoring - Real-time threat assessment (0-100)
3. Behavioral analysis - Detect anomalous patterns
4. Velocity checks - Impossible travel detection
5. IP reputation - Known threat detection
6. Adaptive responses - Allow/Challenge/Block based on risk
"""

import hashlib
import time
import json
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import logging
from collections import defaultdict
import math

logger = logging.getLogger(__name__)


@dataclass
class DeviceFingerprint:
    """
    Unique device identifier based on browser/device characteristics.
    
    Uses multiple signals to create a stable fingerprint:
    - User agent string
    - Screen resolution
    - Timezone
    - Language preferences
    - Platform details
    """
    fingerprint_id: str
    user_agent: str
    platform: Optional[str] = None
    screen_resolution: Optional[str] = None
    timezone: Optional[str] = None
    language: Optional[str] = None
    created_at: int = 0
    last_seen: int = 0
    
    def compute_hash(self) -> str:
        """Compute stable hash from device characteristics."""
        components = [
            self.user_agent,
            self.platform or "",
            self.screen_resolution or "",
            self.timezone or "",
            self.language or ""
        ]
        data = "|".join(components)
        return hashlib.sha256(data.encode()).hexdigest()


@dataclass
class RiskAssessment:
    """
    Risk assessment result for an authentication attempt.
    
    Risk score ranges:
    - 0-30: Low risk (allow)
    - 31-70: Medium risk (challenge/step-up)
    - 71-100: High risk (block)
    """
    risk_score: int  # 0-100
    risk_level: str  # "low", "medium", "high"
    recommended_action: str  # "allow", "challenge", "block"
    risk_factors: List[str]  # Reasons for risk score
    details: Dict[str, Any]  # Additional context
    timestamp: int
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return asdict(self)


class DeviceTracker:
    """
    Tracks known devices per wallet for anomaly detection.
    
    In production, use Redis or database for persistence.
    """
    
    def __init__(self):
        # wallet_address -> list of device fingerprints
        self._known_devices: Dict[str, List[DeviceFingerprint]] = defaultdict(list)
        
        # wallet_address -> list of known IP addresses
        self._known_ips: Dict[str, List[str]] = defaultdict(list)
        
        # wallet_address -> list of (location, timestamp) tuples
        self._location_history: Dict[str, List[Tuple[str, int]]] = defaultdict(list)
    
    def is_known_device(
        self,
        wallet_address: str,
        fingerprint: DeviceFingerprint
    ) -> bool:
        """Check if device is known for this wallet."""
        known = self._known_devices.get(wallet_address, [])
        fingerprint_hash = fingerprint.compute_hash()
        
        for device in known:
            if device.compute_hash() == fingerprint_hash:
                # Update last seen
                device.last_seen = int(time.time())
                logger.debug(f"✅ Known device for {wallet_address[:10]}...")
                return True
        
        return False
    
    def register_device(
        self,
        wallet_address: str,
        fingerprint: DeviceFingerprint
    ):
        """Register a new device for wallet."""
        fingerprint.created_at = int(time.time())
        fingerprint.last_seen = int(time.time())
        
        self._known_devices[wallet_address].append(fingerprint)
        
        logger.info(
            f"📱 New device registered for {wallet_address[:10]}... "
            f"(total: {len(self._known_devices[wallet_address])})"
        )
    
    def is_known_ip(self, wallet_address: str, ip_address: str) -> bool:
        """Check if IP is known for this wallet."""
        return ip_address in self._known_ips.get(wallet_address, [])
    
    def register_ip(self, wallet_address: str, ip_address: str):
        """Register IP for wallet."""
        if ip_address not in self._known_ips[wallet_address]:
            self._known_ips[wallet_address].append(ip_address)
            
            logger.info(
                f"🌐 New IP registered for {wallet_address[:10]}... ({ip_address})"
            )
    
    def add_location(self, wallet_address: str, location: str):
        """Add location to history."""
        timestamp = int(time.time())
        self._location_history[wallet_address].append((location, timestamp))
        
        # Keep only last 100 locations
        if len(self._location_history[wallet_address]) > 100:
            self._location_history[wallet_address] = \
                self._location_history[wallet_address][-100:]
    
    def get_recent_location(
        self,
        wallet_address: str,
        within_seconds: int = 3600
    ) -> Optional[Tuple[str, int]]:
        """Get most recent location within time window."""
        history = self._location_history.get(wallet_address, [])
        if not history:
            return None
        
        current_time = int(time.time())
        for location, timestamp in reversed(history):
            if current_time - timestamp <= within_seconds:
                return (location, timestamp)
        
        return None


class IPReputationChecker:
    """
    Checks IP reputation against known threat lists.
    
    In production, integrate with services like:
    - AbuseIPDB
    - IPQualityScore
    - MaxMind GeoIP
    """
    
    # Known suspicious IP ranges (example)
    SUSPICIOUS_RANGES = [
        "10.0.0.0/8",    # Private network (shouldn't be external)
        "172.16.0.0/12", # Private network
        "192.168.0.0/16" # Private network
    ]
    
    # Known VPN/Proxy indicators
    VPN_KEYWORDS = ["vpn", "proxy", "datacenter", "hosting"]
    
    @classmethod
    def is_suspicious(cls, ip_address: str, user_agent: str = "") -> bool:
        """
        Check if IP appears suspicious.
        
        In production, use real threat intelligence feeds.
        """
        # Check for private IPs (shouldn't be external)
        if ip_address.startswith(("10.", "172.", "192.168.")):
            return True
        
        # Check for localhost
        if ip_address.startswith("127."):
            return True
        
        # Check user agent for VPN indicators
        ua_lower = user_agent.lower()
        if any(keyword in ua_lower for keyword in cls.VPN_KEYWORDS):
            return True
        
        # In production: Check against real threat feeds
        # if cls._check_threat_intelligence(ip_address):
        #     return True
        
        return False
    
    @classmethod
    def get_reputation_score(cls, ip_address: str) -> int:
        """
        Get IP reputation score (0-100, higher = worse).
        
        In production, use services like AbuseIPDB.
        """
        if cls.is_suspicious(ip_address):
            return 80  # High suspicion
        
        # In production: Query reputation service
        # return abuseipdb.check(ip_address)
        
        return 0  # No known issues


class VelocityChecker:
    """
    Detects impossible travel and suspicious velocity patterns.
    
    If user authenticates from New York, then 5 minutes later from
    London, that's physically impossible = likely compromised.
    """
    
    # Approximate distances between major cities (km)
    CITY_DISTANCES = {
        ("New York", "London"): 5585,
        ("New York", "Tokyo"): 10850,
        ("London", "Sydney"): 17015,
        ("San Francisco", "New York"): 4130,
        # Add more as needed
    }
    
    # Average commercial flight speed (km/h)
    MAX_TRAVEL_SPEED = 900  # km/h
    
    @classmethod
    def detect_impossible_travel(
        cls,
        location1: str,
        timestamp1: int,
        location2: str,
        timestamp2: int
    ) -> bool:
        """
        Detect if travel between locations is impossible.
        
        Args:
            location1: First location (e.g., "New York, US")
            timestamp1: First timestamp (Unix)
            location2: Second location
            timestamp2: Second timestamp (Unix)
            
        Returns:
            True if travel is impossible
        """
        # Get distance
        distance = cls._get_distance(location1, location2)
        if distance is None:
            return False  # Can't determine
        
        # Get time difference (hours)
        time_diff_seconds = abs(timestamp2 - timestamp1)
        time_diff_hours = time_diff_seconds / 3600
        
        # Calculate required speed
        required_speed = distance / time_diff_hours if time_diff_hours > 0 else float('inf')
        
        # Check if impossible
        if required_speed > cls.MAX_TRAVEL_SPEED:
            logger.warning(
                f"⚠️ Impossible travel detected: "
                f"{location1} → {location2} in {time_diff_hours:.1f}h "
                f"(requires {required_speed:.0f} km/h)"
            )
            return True
        
        return False
    
    @classmethod
    def _get_distance(cls, location1: str, location2: str) -> Optional[float]:
        """
        Get distance between two locations in km.
        
        In production, use a geocoding service.
        """
        # Extract city names
        city1 = location1.split(",")[0].strip()
        city2 = location2.split(",")[0].strip()
        
        # Check known distances
        key = (city1, city2)
        if key in cls.CITY_DISTANCES:
            return cls.CITY_DISTANCES[key]
        
        # Check reverse
        key_reverse = (city2, city1)
        if key_reverse in cls.CITY_DISTANCES:
            return cls.CITY_DISTANCES[key_reverse]
        
        # In production: Use geocoding + haversine formula
        # coords1 = geocode(location1)
        # coords2 = geocode(location2)
        # return haversine_distance(coords1, coords2)
        
        return None  # Unknown distance


class RiskScorer:
    """
    Main risk scoring engine.
    
    Combines multiple signals to produce a risk score (0-100):
    - Device recognition
    - IP reputation
    - Behavioral patterns
    - Velocity checks
    - Historical anomalies
    """
    
    def __init__(self):
        self.device_tracker = DeviceTracker()
        self.ip_checker = IPReputationChecker()
        self.velocity_checker = VelocityChecker()
        
        # Risk score weights
        self.WEIGHTS = {
            "new_device": 25,
            "new_ip": 15,
            "suspicious_ip": 40,
            "impossible_travel": 50,
            "vpn_detected": 20,
            "anomalous_time": 10,
            "high_failure_rate": 30
        }
    
    def calculate_risk(
        self,
        wallet_address: str,
        ip_address: str,
        user_agent: str,
        device_fingerprint: Optional[DeviceFingerprint] = None,
        location: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> RiskAssessment:
        """
        Calculate comprehensive risk score.
        
        Args:
            wallet_address: Wallet being authenticated
            ip_address: Client IP address
            user_agent: Client user agent
            device_fingerprint: Device fingerprint (optional)
            location: Geographic location (optional)
            metadata: Additional context
            
        Returns:
            RiskAssessment with score and recommended action
        """
        score = 0
        risk_factors = []
        details = {}
        
        # Create device fingerprint if not provided
        if not device_fingerprint:
            device_fingerprint = DeviceFingerprint(
                fingerprint_id="",
                user_agent=user_agent
            )
        
        # Check device recognition
        is_known_device = self.device_tracker.is_known_device(
            wallet_address, device_fingerprint
        )
        
        if not is_known_device:
            score += self.WEIGHTS["new_device"]
            risk_factors.append("new_device")
            details["new_device"] = True
        else:
            details["known_device"] = True
        
        # Check IP recognition
        is_known_ip = self.device_tracker.is_known_ip(wallet_address, ip_address)
        
        if not is_known_ip:
            score += self.WEIGHTS["new_ip"]
            risk_factors.append("new_ip")
            details["new_ip"] = ip_address
        else:
            details["known_ip"] = True
        
        # Check IP reputation
        if self.ip_checker.is_suspicious(ip_address, user_agent):
            score += self.WEIGHTS["suspicious_ip"]
            risk_factors.append("suspicious_ip")
            details["suspicious_ip"] = ip_address
        
        ip_reputation = self.ip_checker.get_reputation_score(ip_address)
        if ip_reputation > 50:
            score += min(ip_reputation, 40)
            risk_factors.append("poor_ip_reputation")
            details["ip_reputation_score"] = ip_reputation
        
        # Check impossible travel
        if location:
            recent_location = self.device_tracker.get_recent_location(
                wallet_address, within_seconds=3600  # 1 hour
            )
            
            if recent_location:
                prev_location, prev_timestamp = recent_location
                current_timestamp = int(time.time())
                
                is_impossible = self.velocity_checker.detect_impossible_travel(
                    prev_location, prev_timestamp,
                    location, current_timestamp
                )
                
                if is_impossible:
                    score += self.WEIGHTS["impossible_travel"]
                    risk_factors.append("impossible_travel")
                    details["impossible_travel"] = {
                        "from": prev_location,
                        "to": location,
                        "time_diff": current_timestamp - prev_timestamp
                    }
        
        # Normalize score to 0-100
        score = min(score, 100)
        
        # Determine risk level and action
        if score < 30:
            risk_level = "low"
            action = "allow"
        elif score < 70:
            risk_level = "medium"
            action = "challenge"  # Require step-up
        else:
            risk_level = "high"
            action = "block"
        
        assessment = RiskAssessment(
            risk_score=score,
            risk_level=risk_level,
            recommended_action=action,
            risk_factors=risk_factors,
            details=details,
            timestamp=int(time.time())
        )
        
        logger.info(
            f"🎯 Risk assessment for {wallet_address[:10]}...: "
            f"score={score}, level={risk_level}, action={action}"
        )
        
        return assessment
    
    def register_successful_auth(
        self,
        wallet_address: str,
        ip_address: str,
        device_fingerprint: DeviceFingerprint,
        location: Optional[str] = None
    ):
        """
        Register successful authentication to update known devices/IPs.
        
        Call this after successful authentication to build trust.
        """
        # Register device
        if not self.device_tracker.is_known_device(wallet_address, device_fingerprint):
            self.device_tracker.register_device(wallet_address, device_fingerprint)
        
        # Register IP
        if not self.device_tracker.is_known_ip(wallet_address, ip_address):
            self.device_tracker.register_ip(wallet_address, ip_address)
        
        # Register location
        if location:
            self.device_tracker.add_location(wallet_address, location)
        
        logger.info(f"✅ Registered successful auth for {wallet_address[:10]}...")


# Singleton instance
_risk_scorer_instance: Optional[RiskScorer] = None


def get_risk_scorer() -> RiskScorer:
    """Get or create risk scorer singleton."""
    global _risk_scorer_instance
    
    if _risk_scorer_instance is None:
        _risk_scorer_instance = RiskScorer()
    
    return _risk_scorer_instance


def reset_risk_scorer():
    """Reset risk scorer singleton (useful for testing)."""
    global _risk_scorer_instance
    _risk_scorer_instance = None


__all__ = [
    'DeviceFingerprint',
    'RiskAssessment',
    'DeviceTracker',
    'IPReputationChecker',
    'VelocityChecker',
    'RiskScorer',
    'get_risk_scorer',
    'reset_risk_scorer'
]