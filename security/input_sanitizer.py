"""
Input Sanitization for AI Agents
Prevents prompt injection and malicious input attacks
"""

import re
import html
import json
from typing import Any, Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

class InputSanitizer:
    """Sanitizes user inputs to prevent prompt injection attacks."""
    
    # Dangerous patterns that could be used for prompt injection
    DANGEROUS_PATTERNS = [
        r'ignore\s+previous\s+instructions',
        r'forget\s+everything\s+above',
        r'you\s+are\s+now\s+a\s+different\s+ai',
        r'system\s*:\s*',
        r'assistant\s*:\s*',
        r'user\s*:\s*',
        r'<\|.*?\|>',  # Special tokens
        r'```.*?```',  # Code blocks
        r'---.*?---',  # Separators
        r'###.*?###',  # Headers
        r'\[.*?\]\(.*?\)',  # Markdown links
        r'javascript:',  # JavaScript URLs
        r'data:text/html',  # Data URLs
        r'eval\s*\(',  # Eval functions
        r'Function\s*\(',  # Function constructor
        r'<script.*?</script>',  # Script tags
        r'<iframe.*?</iframe>',  # Iframe tags
    ]
    
    # Maximum lengths for different input types
    MAX_LENGTHS = {
        'text': 2000,
        'description': 5000,
        'json': 10000,
        'role': 50,
        'complexity': 20
    }
    
    def __init__(self):
        self.compiled_patterns = [re.compile(pattern, re.IGNORECASE | re.DOTALL) 
                                for pattern in self.DANGEROUS_PATTERNS]
    
    def sanitize_text(self, text: str, max_length: int = None) -> str:
        """Sanitize text input to prevent prompt injection."""
        if not isinstance(text, str):
            return str(text)
        
        # Limit length
        if max_length:
            text = text[:max_length]
        else:
            text = text[:self.MAX_LENGTHS['text']]
        
        # HTML escape
        text = html.escape(text, quote=True)
        
        # Remove dangerous patterns
        for pattern in self.compiled_patterns:
            text = pattern.sub('[FILTERED]', text)
        
        # Remove control characters except newlines and tabs
        text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)
        
        return text.strip()
    
    def sanitize_json(self, data: Any, max_length: int = None) -> str:
        """Sanitize JSON data for AI processing."""
        if max_length is None:
            max_length = self.MAX_LENGTHS['json']
        
        # Convert to JSON string
        json_str = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
        
        # Limit length
        if len(json_str) > max_length:
            json_str = json_str[:max_length] + '...'
        
        # Sanitize the JSON string
        return self.sanitize_text(json_str, max_length)
    
    def sanitize_agent_input(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize input data for AI agents."""
        sanitized = {}
        
        for key, value in input_data.items():
            if key == 'parsed' and isinstance(value, dict):
                # Recursively sanitize parsed data
                sanitized[key] = self._sanitize_dict(value)
            elif key == 'role':
                # Sanitize role with strict validation
                sanitized[key] = self._sanitize_role(value)
            elif key == 'complexity':
                # Sanitize complexity with strict validation
                sanitized[key] = self._sanitize_complexity(value)
            elif isinstance(value, str):
                # Sanitize string values
                max_len = self.MAX_LENGTHS.get(key, self.MAX_LENGTHS['text'])
                sanitized[key] = self.sanitize_text(value, max_len)
            elif isinstance(value, dict):
                # Recursively sanitize dictionaries
                sanitized[key] = self._sanitize_dict(value)
            elif isinstance(value, list):
                # Sanitize lists
                sanitized[key] = self._sanitize_list(value)
            else:
                # Keep other types as-is
                sanitized[key] = value
        
        return sanitized
    
    def _sanitize_dict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Recursively sanitize dictionary values."""
        sanitized = {}
        for key, value in data.items():
            if isinstance(value, str):
                sanitized[key] = self.sanitize_text(value)
            elif isinstance(value, dict):
                sanitized[key] = self._sanitize_dict(value)
            elif isinstance(value, list):
                sanitized[key] = self._sanitize_list(value)
            else:
                sanitized[key] = value
        return sanitized
    
    def _sanitize_list(self, data: List[Any]) -> List[Any]:
        """Sanitize list values."""
        sanitized = []
        for item in data:
            if isinstance(item, str):
                sanitized.append(self.sanitize_text(item))
            elif isinstance(item, dict):
                sanitized.append(self._sanitize_dict(item))
            elif isinstance(item, list):
                sanitized.append(self._sanitize_list(item))
            else:
                sanitized.append(item)
        return sanitized
    
    def _sanitize_role(self, role: str) -> str:
        """Sanitize and validate role input."""
        if not isinstance(role, str):
            return 'cliente'
        
        role = role.lower().strip()
        if role not in ['freelancer', 'cliente', 'client']:
            logger.warning(f"Invalid role '{role}', defaulting to 'cliente'")
            return 'cliente'
        
        return role
    
    def _sanitize_complexity(self, complexity: str) -> str:
        """Sanitize and validate complexity input."""
        if not isinstance(complexity, str):
            return 'low'
        
        complexity = complexity.lower().strip()
        if complexity not in ['low', 'medium', 'high']:
            logger.warning(f"Invalid complexity '{complexity}', defaulting to 'low'")
            return 'low'
        
        return complexity
    
    def validate_contract_input(self, text: str) -> tuple[bool, str]:
        """Validate contract input text for safety."""
        if not text or not isinstance(text, str):
            return False, "Empty or invalid input"
        
        if len(text) > self.MAX_LENGTHS['text']:
            return False, f"Input too long (max {self.MAX_LENGTHS['text']} characters)"
        
        # Check for dangerous patterns
        for pattern in self.compiled_patterns:
            if pattern.search(text):
                logger.warning(f"Potentially malicious input detected: {pattern.pattern}")
                return False, "Input contains potentially malicious content"
        
        return True, "Valid input"

# Global sanitizer instance
sanitizer = InputSanitizer()

def sanitize_for_ai(input_data: Any) -> Any:
    """Convenience function to sanitize data for AI processing."""
    if isinstance(input_data, dict):
        return sanitizer.sanitize_agent_input(input_data)
    elif isinstance(input_data, str):
        return sanitizer.sanitize_text(input_data)
    elif hasattr(input_data, '__dict__'):
        # Handle dataclass or object with __dict__
        return sanitizer.sanitize_agent_input(input_data.__dict__)
    else:
        return input_data