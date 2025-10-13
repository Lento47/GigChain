"""
Secure file operations utilities for GigChain.

This module provides secure file operations with path validation
to prevent directory traversal attacks and other file-related vulnerabilities.
"""

import os
import pathlib
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

# Allowed file extensions for different operations
ALLOWED_LOG_EXTENSIONS = {'.log', '.txt'}
ALLOWED_BACKUP_EXTENSIONS = {'.db', '.sqlite', '.sqlite3', '.backup'}
ALLOWED_CONFIG_EXTENSIONS = {'.json', '.yaml', '.yml', '.env'}

# Maximum file size limits (in bytes)
MAX_LOG_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_BACKUP_FILE_SIZE = 100 * 1024 * 1024  # 100MB
MAX_CONFIG_FILE_SIZE = 1024 * 1024  # 1MB

def validate_file_path(file_path: str, allowed_extensions: set, max_size: int = None) -> bool:
    """
    Validate file path for security.
    
    Args:
        file_path: Path to validate
        allowed_extensions: Set of allowed file extensions
        max_size: Maximum allowed file size in bytes
        
    Returns:
        True if path is valid and safe, False otherwise
    """
    try:
        # Convert to Path object for better handling
        path = pathlib.Path(file_path)
        
        # Check if path is absolute and within allowed directories
        if path.is_absolute():
            # Only allow files in current working directory or subdirectories
            cwd = pathlib.Path.cwd()
            try:
                path.relative_to(cwd)
            except ValueError:
                logger.warning(f"Attempted access to file outside working directory: {file_path}")
                return False
        
        # Check file extension
        if path.suffix.lower() not in allowed_extensions:
            logger.warning(f"File extension not allowed: {path.suffix}")
            return False
        
        # Check if file exists and get size
        if path.exists():
            if max_size and path.stat().st_size > max_size:
                logger.warning(f"File too large: {file_path} ({path.stat().st_size} bytes)")
                return False
        
        # Check for directory traversal attempts
        if '..' in str(path) or path.is_absolute():
            # Additional check for absolute paths outside working directory
            if path.is_absolute():
                cwd = pathlib.Path.cwd()
                try:
                    path.relative_to(cwd)
                except ValueError:
                    logger.warning(f"Directory traversal attempt detected: {file_path}")
                    return False
        
        return True
        
    except Exception as e:
        logger.error(f"Error validating file path {file_path}: {str(e)}")
        return False

def safe_open(file_path: str, mode: str = 'r', allowed_extensions: set = None, max_size: int = None):
    """
    Safely open a file with path validation.
    
    Args:
        file_path: Path to file
        mode: File open mode
        allowed_extensions: Set of allowed file extensions
        max_size: Maximum allowed file size
        
    Returns:
        File object if valid, None otherwise
        
    Raises:
        ValueError: If file path is invalid
        PermissionError: If file access is denied
    """
    if allowed_extensions is None:
        allowed_extensions = ALLOWED_LOG_EXTENSIONS
    
    if max_size is None:
        max_size = MAX_LOG_FILE_SIZE
    
    if not validate_file_path(file_path, allowed_extensions, max_size):
        raise ValueError(f"Invalid or unsafe file path: {file_path}")
    
    try:
        return open(file_path, mode)
    except PermissionError:
        logger.error(f"Permission denied accessing file: {file_path}")
        raise
    except Exception as e:
        logger.error(f"Error opening file {file_path}: {str(e)}")
        raise

def get_safe_log_files(directory: str = ".", max_files: int = 5) -> List[str]:
    """
    Get list of safe log files in directory.
    
    Args:
        directory: Directory to search (default: current directory)
        max_files: Maximum number of files to return
        
    Returns:
        List of safe log file paths
    """
    try:
        import glob
        
        # Use glob to find log files
        pattern = os.path.join(directory, "*.log")
        log_files = glob.glob(pattern)
        
        # Filter and validate files
        safe_files = []
        for log_file in log_files:
            if validate_file_path(log_file, ALLOWED_LOG_EXTENSIONS, MAX_LOG_FILE_SIZE):
                safe_files.append(log_file)
        
        # Sort by modification time (newest first) and limit
        safe_files.sort(key=lambda x: os.path.getmtime(x), reverse=True)
        return safe_files[:max_files]
        
    except Exception as e:
        logger.error(f"Error getting safe log files: {str(e)}")
        return []

def safe_read_file_lines(file_path: str, max_lines: int = 1000) -> List[str]:
    """
    Safely read lines from a file with limits.
    
    Args:
        file_path: Path to file
        max_lines: Maximum number of lines to read
        
    Returns:
        List of file lines
    """
    try:
        with safe_open(file_path, 'r', ALLOWED_LOG_EXTENSIONS, MAX_LOG_FILE_SIZE) as f:
            lines = []
            for i, line in enumerate(f):
                if i >= max_lines:
                    break
                lines.append(line)
            return lines
    except Exception as e:
        logger.error(f"Error reading file {file_path}: {str(e)}")
        return []