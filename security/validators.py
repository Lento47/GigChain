"""
Input Validation for GigChain.io
Comprehensive validation for all user inputs
"""

import re
import logging
from typing import Any, Dict, List, Optional, Tuple
from decimal import Decimal, InvalidOperation

logger = logging.getLogger(__name__)

class InputValidator:
    """Comprehensive input validation for GigChain.io"""
    
    # Ethereum address pattern
    ETH_ADDRESS_PATTERN = re.compile(r'^0x[a-fA-F0-9]{40}$')
    
    # Email pattern
    EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    
    # URL pattern
    URL_PATTERN = re.compile(r'^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/.*)?$')
    
    # Social media handle patterns
    TWITTER_PATTERN = re.compile(r'^@?[a-zA-Z0-9_]{1,15}$')
    GITHUB_PATTERN = re.compile(r'^[a-zA-Z0-9]([a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$')
    LINKEDIN_PATTERN = re.compile(r'^[a-zA-Z0-9-]{3,100}$')
    
    def __init__(self):
        self.max_lengths = {
            'text': 2000,
            'description': 5000,
            'name': 200,
            'email': 254,
            'url': 2048,
            'wallet_address': 42,
            'role': 50,
            'complexity': 20
        }
    
    def validate_wallet_address(self, address: str) -> Tuple[bool, str]:
        """Validate Ethereum wallet address."""
        if not address or not isinstance(address, str):
            return False, "Address is required"
        
        address = address.strip()
        
        if len(address) != 42:
            return False, "Address must be 42 characters long"
        
        if not self.ETH_ADDRESS_PATTERN.match(address):
            return False, "Invalid Ethereum address format"
        
        return True, "Valid address"
    
    def validate_amount(self, amount: Any) -> Tuple[bool, str, Optional[float]]:
        """Validate monetary amounts."""
        if amount is None:
            return True, "Amount is optional", None
        
        try:
            # Convert to float
            if isinstance(amount, str):
                amount = float(amount)
            elif isinstance(amount, (int, float)):
                amount = float(amount)
            else:
                return False, "Amount must be a number", None
            
            # Check range
            if amount < 0:
                return False, "Amount cannot be negative", None
            
            if amount > 1000000:  # 1 million max
                return False, "Amount too large (max 1,000,000)", None
            
            # Check precision (max 2 decimal places)
            if round(amount, 2) != amount:
                return False, "Amount can have at most 2 decimal places", None
            
            return True, "Valid amount", amount
            
        except (ValueError, TypeError, InvalidOperation):
            return False, "Invalid amount format", None
    
    def validate_text(self, text: str, field_name: str = "text", max_length: int = None) -> Tuple[bool, str]:
        """Validate text input."""
        if not text or not isinstance(text, str):
            return False, f"{field_name} is required"
        
        text = text.strip()
        
        if not text:
            return False, f"{field_name} cannot be empty"
        
        max_len = max_length or self.max_lengths.get(field_name, self.max_lengths['text'])
        if len(text) > max_len:
            return False, f"{field_name} too long (max {max_len} characters)"
        
        # Check for dangerous characters
        dangerous_chars = ['<', '>', '"', "'", '&', '\x00', '\x01', '\x02', '\x03', '\x04', '\x05', '\x06', '\x07', '\x08', '\x0b', '\x0c', '\x0e', '\x0f', '\x10', '\x11', '\x12', '\x13', '\x14', '\x15', '\x16', '\x17', '\x18', '\x19', '\x1a', '\x1b', '\x1c', '\x1d', '\x1e', '\x1f', '\x7f']
        
        for char in dangerous_chars:
            if char in text:
                return False, f"{field_name} contains invalid characters"
        
        return True, "Valid text"
    
    def validate_email(self, email: str) -> Tuple[bool, str]:
        """Validate email address."""
        if not email or not isinstance(email, str):
            return False, "Email is required"
        
        email = email.strip().lower()
        
        if len(email) > self.max_lengths['email']:
            return False, "Email too long"
        
        if not self.EMAIL_PATTERN.match(email):
            return False, "Invalid email format"
        
        return True, "Valid email"
    
    def validate_url(self, url: str) -> Tuple[bool, str]:
        """Validate URL."""
        if not url or not isinstance(url, str):
            return False, "URL is required"
        
        url = url.strip()
        
        if len(url) > self.max_lengths['url']:
            return False, "URL too long"
        
        if not self.URL_PATTERN.match(url):
            return False, "Invalid URL format"
        
        return True, "Valid URL"
    
    def validate_social_handle(self, handle: str, platform: str) -> Tuple[bool, str]:
        """Validate social media handles."""
        if not handle or not isinstance(handle, str):
            return False, f"{platform} handle is required"
        
        handle = handle.strip()
        
        if platform.lower() == 'twitter':
            if not self.TWITTER_PATTERN.match(handle):
                return False, "Invalid Twitter handle format"
        elif platform.lower() == 'github':
            if not self.GITHUB_PATTERN.match(handle):
                return False, "Invalid GitHub username format"
        elif platform.lower() == 'linkedin':
            if not self.LINKEDIN_PATTERN.match(handle):
                return False, "Invalid LinkedIn username format"
        else:
            return False, f"Unsupported platform: {platform}"
        
        return True, f"Valid {platform} handle"
    
    def validate_role(self, role: str) -> Tuple[bool, str]:
        """Validate user role."""
        if not role or not isinstance(role, str):
            return False, "Role is required"
        
        role = role.lower().strip()
        
        if role not in ['freelancer', 'cliente', 'client']:
            return False, "Role must be 'freelancer' or 'cliente'"
        
        return True, "Valid role"
    
    def validate_complexity(self, complexity: str) -> Tuple[bool, str]:
        """Validate complexity level."""
        if not complexity or not isinstance(complexity, str):
            return False, "Complexity is required"
        
        complexity = complexity.lower().strip()
        
        if complexity not in ['low', 'medium', 'high']:
            return False, "Complexity must be 'low', 'medium', or 'high'"
        
        return True, "Valid complexity"
    
    def validate_days(self, days: Any) -> Tuple[bool, str, Optional[int]]:
        """Validate number of days."""
        if days is None:
            return True, "Days is optional", None
        
        try:
            if isinstance(days, str):
                days = int(days)
            elif isinstance(days, (int, float)):
                days = int(days)
            else:
                return False, "Days must be a number", None
            
            if days < 1:
                return False, "Days must be at least 1", None
            
            if days > 365:
                return False, "Days cannot exceed 365", None
            
            return True, "Valid days", days
            
        except (ValueError, TypeError):
            return False, "Invalid days format", None
    
    def validate_contract_request(self, request_data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate contract generation request."""
        errors = []
        
        # Validate text
        if 'text' in request_data:
            is_valid, error = self.validate_text(request_data['text'], 'text')
            if not is_valid:
                errors.append(error)
        
        # Validate formData if present
        if 'formData' in request_data and request_data['formData']:
            form_errors = self._validate_form_data(request_data['formData'])
            errors.extend(form_errors)
        
        return len(errors) == 0, errors
    
    def _validate_form_data(self, form_data: Dict[str, Any]) -> List[str]:
        """Validate form data for structured contracts."""
        errors = []
        
        # Validate required fields
        required_fields = ['description', 'role']
        for field in required_fields:
            if field not in form_data:
                errors.append(f"Required field '{field}' is missing")
        
        # Validate description
        if 'description' in form_data:
            is_valid, error = self.validate_text(form_data['description'], 'description')
            if not is_valid:
                errors.append(error)
        
        # Validate role
        if 'role' in form_data:
            is_valid, error = self.validate_role(form_data['role'])
            if not is_valid:
                errors.append(error)
        
        # Validate amounts
        for amount_field in ['offeredAmount', 'requestedAmount', 'freelancerRate']:
            if amount_field in form_data:
                is_valid, error, _ = self.validate_amount(form_data[amount_field])
                if not is_valid:
                    errors.append(f"{amount_field}: {error}")
        
        # Validate days
        if 'days' in form_data:
            is_valid, error, _ = self.validate_days(form_data['days'])
            if not is_valid:
                errors.append(f"days: {error}")
        
        # Validate wallet addresses
        for wallet_field in ['freelancerWallet', 'clientWallet']:
            if wallet_field in form_data and form_data[wallet_field]:
                is_valid, error = self.validate_wallet_address(form_data[wallet_field])
                if not is_valid:
                    errors.append(f"{wallet_field}: {error}")
        
        # Validate social handles
        social_fields = {
            'freelancerX': 'twitter',
            'freelancerGithub': 'github',
            'freelancerLinkedIn': 'linkedin'
        }
        
        for field, platform in social_fields.items():
            if field in form_data and form_data[field]:
                is_valid, error = self.validate_social_handle(form_data[field], platform)
                if not is_valid:
                    errors.append(f"{field}: {error}")
        
        return errors
    
    def validate_chat_message(self, message: str) -> Tuple[bool, str]:
        """Validate chat message."""
        return self.validate_text(message, 'message', max_length=2000)
    
    def validate_template_upload(self, template_data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate template upload data."""
        errors = []
        
        # Validate required fields
        if 'name' not in template_data:
            errors.append("Template name is required")
        elif not self.validate_text(template_data['name'], 'name')[0]:
            errors.append("Invalid template name")
        
        if 'description' not in template_data:
            errors.append("Template description is required")
        elif not self.validate_text(template_data['description'], 'description')[0]:
            errors.append("Invalid template description")
        
        # Validate optional fields
        optional_text_fields = ['category', 'projectType']
        for field in optional_text_fields:
            if field in template_data and template_data[field]:
                is_valid, error = self.validate_text(template_data[field], field)
                if not is_valid:
                    errors.append(f"{field}: {error}")
        
        return len(errors) == 0, errors

# Global validator instance
validator = InputValidator()

def validate_input(input_type: str, data: Any) -> Tuple[bool, str]:
    """Convenience function for input validation."""
    if input_type == 'wallet_address':
        return validator.validate_wallet_address(data)
    elif input_type == 'amount':
        return validator.validate_amount(data)
    elif input_type == 'text':
        return validator.validate_text(data)
    elif input_type == 'email':
        return validator.validate_email(data)
    elif input_type == 'url':
        return validator.validate_url(data)
    elif input_type == 'role':
        return validator.validate_role(data)
    elif input_type == 'complexity':
        return validator.validate_complexity(data)
    elif input_type == 'days':
        return validator.validate_days(data)
    else:
        return False, f"Unknown validation type: {input_type}"