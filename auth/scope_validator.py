"""
W-CSAP Scope and Audience Validation
=====================================

SECURITY ENHANCEMENT (Phase 2):
Implements fine-grained access control using OAuth-style scopes
and audience validation for multi-service deployments.

Features:
1. Scope-based permissions (read, write, admin, etc.)
2. Audience validation (which services can use the token)
3. Role-based access control (RBAC) support
4. Hierarchical scopes (e.g., gigs:read, gigs:write)
"""

from typing import List, Set, Optional
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class ScopeDefinition:
    """
    Definition of a permission scope.
    
    Scopes follow OAuth 2.0 convention:
    - Resource-based: "resource:action" (e.g., "gigs:read", "contracts:write")
    - Simple: "action" (e.g., "read", "write", "admin")
    """
    name: str
    description: str
    resource: Optional[str] = None  # Resource type (gigs, contracts, etc.)
    action: Optional[str] = None  # Action (read, write, delete, etc.)
    parent: Optional[str] = None  # Parent scope (for hierarchy)


class ScopeValidator:
    """
    Validates and manages scopes for access control.
    
    Supports:
    - Simple scope matching
    - Hierarchical scopes (parent implies children)
    - Wildcard scopes (resource:*)
    - Scope composition
    """
    
    # Standard W-CSAP scopes
    STANDARD_SCOPES = {
        "profile": ScopeDefinition(
            name="profile",
            description="Read user profile information",
            action="read"
        ),
        "gigs": ScopeDefinition(
            name="gigs",
            description="Full access to gigs",
            resource="gigs"
        ),
        "gigs:read": ScopeDefinition(
            name="gigs:read",
            description="Read gigs",
            resource="gigs",
            action="read",
            parent="gigs"
        ),
        "gigs:write": ScopeDefinition(
            name="gigs:write",
            description="Create and update gigs",
            resource="gigs",
            action="write",
            parent="gigs"
        ),
        "contracts": ScopeDefinition(
            name="contracts",
            description="Full access to contracts",
            resource="contracts"
        ),
        "contracts:read": ScopeDefinition(
            name="contracts:read",
            description="Read contracts",
            resource="contracts",
            action="read",
            parent="contracts"
        ),
        "contracts:write": ScopeDefinition(
            name="contracts:write",
            description="Create and execute contracts",
            resource="contracts",
            action="write",
            parent="contracts"
        ),
        "admin": ScopeDefinition(
            name="admin",
            description="Administrative access",
            action="admin"
        )
    }
    
    @classmethod
    def validate_scopes(
        cls,
        token_scopes: str,
        required_scope: str
    ) -> bool:
        """
        Validate that token has required scope.
        
        Args:
            token_scopes: Space-separated list of scopes from token
            required_scope: Required scope for access
            
        Returns:
            True if token has required scope
        """
        # Parse token scopes
        token_scope_set = set(token_scopes.split())
        
        # Direct match
        if required_scope in token_scope_set:
            return True
        
        # Check for parent scope
        # If required is "gigs:read", check if token has "gigs"
        if ":" in required_scope:
            resource = required_scope.split(":")[0]
            if resource in token_scope_set:
                logger.debug(f"✅ Parent scope '{resource}' grants '{required_scope}'")
                return True
        
        # Check for wildcard
        # If token has "gigs:*", it grants any gigs:action
        if ":" in required_scope:
            resource = required_scope.split(":")[0]
            wildcard = f"{resource}:*"
            if wildcard in token_scope_set:
                logger.debug(f"✅ Wildcard scope '{wildcard}' grants '{required_scope}'")
                return True
        
        # Check for admin scope (grants everything)
        if "admin" in token_scope_set:
            logger.debug(f"✅ Admin scope grants '{required_scope}'")
            return True
        
        logger.warning(
            f"❌ Scope validation failed: required '{required_scope}', "
            f"token has '{token_scopes}'"
        )
        return False
    
    @classmethod
    def expand_scopes(cls, scopes: str) -> Set[str]:
        """
        Expand scopes including implied permissions.
        
        For example, "gigs" expands to ["gigs", "gigs:read", "gigs:write"]
        
        Args:
            scopes: Space-separated list of scopes
            
        Returns:
            Set of expanded scopes
        """
        scope_set = set(scopes.split())
        expanded = set(scope_set)
        
        # Expand parent scopes
        for scope in scope_set:
            # If scope is a resource without action, add all actions
            if scope in cls.STANDARD_SCOPES:
                definition = cls.STANDARD_SCOPES[scope]
                if definition.resource and not definition.action:
                    # Add all child scopes
                    for child_name, child_def in cls.STANDARD_SCOPES.items():
                        if child_def.parent == scope:
                            expanded.add(child_name)
            
            # Admin grants everything
            if scope == "admin":
                expanded.update(cls.STANDARD_SCOPES.keys())
        
        return expanded
    
    @classmethod
    def get_scope_description(cls, scope: str) -> str:
        """
        Get human-readable description of a scope.
        
        Args:
            scope: Scope name
            
        Returns:
            Description string
        """
        if scope in cls.STANDARD_SCOPES:
            return cls.STANDARD_SCOPES[scope].description
        return f"Unknown scope: {scope}"


class AudienceValidator:
    """
    Validates token audience claims for multi-service deployments.
    
    Ensures tokens are only used by their intended recipients.
    """
    
    @staticmethod
    def validate_audience(
        token_audience: str,
        expected_audience: str
    ) -> bool:
        """
        Validate token audience.
        
        Args:
            token_audience: Audience from token (can be string or list)
            expected_audience: Expected audience for this service
            
        Returns:
            True if audience is valid
        """
        # Handle list of audiences
        if isinstance(token_audience, list):
            return expected_audience in token_audience
        
        # Handle single audience
        return token_audience == expected_audience
    
    @staticmethod
    def get_service_audience(service_name: str) -> str:
        """
        Get standard audience identifier for a service.
        
        Args:
            service_name: Service name (api, auth, contracts, etc.)
            
        Returns:
            Audience identifier
        """
        # Standard format: https://{service}.gigchain.io
        return f"https://{service_name}.gigchain.io"


# Helper functions for FastAPI dependencies

def require_scope(required_scope: str):
    """
    Dependency factory to require specific scope.
    
    Usage:
        @app.get("/api/gigs", dependencies=[Depends(require_scope("gigs:read"))])
        async def list_gigs():
            return {"gigs": [...]}
    
    Args:
        required_scope: Required scope name
        
    Returns:
        FastAPI dependency function
    """
    from fastapi import Depends, HTTPException, status
    from auth.middleware import get_current_wallet
    
    async def scope_dependency(wallet = Depends(get_current_wallet)):
        # Get scopes from wallet/token
        token_scopes = wallet.get("session", {}).get("scope", "")
        
        # Validate
        if not ScopeValidator.validate_scopes(token_scopes, required_scope):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required scope: {required_scope}"
            )
        
        return wallet
    
    return scope_dependency


def require_any_scope(*required_scopes: str):
    """
    Dependency factory to require any of multiple scopes.
    
    Usage:
        @app.get("/api/data", dependencies=[Depends(require_any_scope("read", "admin"))])
        async def get_data():
            return {"data": [...]}
    
    Args:
        *required_scopes: One or more scope names
        
    Returns:
        FastAPI dependency function
    """
    from fastapi import Depends, HTTPException, status
    from auth.middleware import get_current_wallet
    
    async def scope_dependency(wallet = Depends(get_current_wallet)):
        token_scopes = wallet.get("session", {}).get("scope", "")
        
        # Check if any required scope is present
        for required in required_scopes:
            if ScopeValidator.validate_scopes(token_scopes, required):
                return wallet
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Missing required scope (need any of: {', '.join(required_scopes)})"
        )
    
    return scope_dependency


__all__ = [
    'ScopeDefinition',
    'ScopeValidator',
    'AudienceValidator',
    'require_scope',
    'require_any_scope'
]