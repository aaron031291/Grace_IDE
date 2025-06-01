#!/usr/bin/env python3
"""
Grace IDE File Operations Module
Handles all file-related operations with enhanced security and intelligence
"""

import os
import sys
import json
import shutil
import asyncio
import hashlib
import platform
from pathlib import Path
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, asdict
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
import mimetypes
import tempfile
import logging

# Setup logging
logger = logging.getLogger(__name__)

@dataclass
class FileOperation:
    """Represents a file operation with metadata"""
    operation_type: str  # create, read, update, delete, move, copy
    file_path: str
    timestamp: str
    user_id: str
    session_id: str
    checksum: Optional[str] = None
    status: str = "pending"
    error_message: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class FileExecutionEngine:
    """Advanced file operations engine with Grace intelligence"""
    
    def __init__(self, action_executor=None, storage_path=None):
        self.action_executor = action_executor
        self.storage_path = storage_path or self._get_default_storage()
        self.executor = ThreadPoolExecutor(max_workers=4)
        self.file_operations_log = []
        self.watched_files = set()
        self.file_locks = {}
        
        # Platform-specific settings
        self.platform = platform.system()
        self._setup_platform_specific()
        
        # Initialize storage
        self._initialize_storage()
    
    def _get_default_storage(self) -> str:
        """Get platform-appropriate storage path"""
        system = platform.system()
        
        if system == "Darwin":
            # macOS/iOS
            if self._is_ios():
                return os.path.expanduser("~/Documents/Grace")
            return os.path.expanduser("~/Library/Application Support/Grace")
        elif system == "Linux":
            # Linux/Android
            if self._is_android():
                return "/data/data/com.grace.ide/files"
            return os.path.expanduser("~/.local/share/grace")
        elif system == "Windows":
            return os.path.expandvars("%APPDATA%\\Grace")
        else:
            return os.path.expanduser("~/.grace")
    
    def _is_ios(self) -> bool:
        """Check if running on iOS"""
        return (os.path.exists('/System/Library/Frameworks/UIKit.framework') or
                'iOS' in os.environ.get('PLATFORM_NAME', ''))
    
    def _is_android(self) -> bool:
        """Check if running on Android"""
        return (os.path.exists('/system/build.prop') or
                'ANDROID_DATA' in os.environ)
    
    def _setup_platform_specific(self):
        """Setup platform-specific configurations"""
        self.capabilities = {
            'symlinks': self.platform != 'Windows',
            'extended_attributes': self.platform == 'Darwin',
            'file_locks': True,
            'async_io': True,
            'sandbox_mode': self._is_ios() or self._is_android()
        }
        
        # Mobile-specific restrictions
        if self.capabilities['sandbox_mode']:
            self.allowed_extensions = [
                '.py', '.js', '.json', '.md', '.txt', '.csv',
                '.html', '.css', '.xml', '.yaml', '.yml'
            ]
            self.max_file_size = 50 * 1024 * 1024  # 50MB limit on mobile
        else:
            self.allowed_extensions = None  # No restrictions on desktop
            self.max_file_size = 500 * 1024 * 1024  # 500MB limit on desktop
    
    def _initialize_storage(self):
        """Initialize storage directories"""
        try:
            os.makedirs(self.storage_path, exist_ok=True)
            
            # Create subdirectories
            subdirs = ['projects', 'temp', 'backups', 'cache']
            for subdir in subdirs:
                os.makedirs(os.path.join(self.storage_path, subdir), exist_ok=True)
            
            logger.info(f"Storage initialized at: {self.storage_path}")
        except Exception as e:
            logger.error(f"Failed to initialize storage: {e}")
    
    async def handle_file_operation(self, operation: str, file_path: str, 
                                  content: Optional[Union[str, bytes]] = None,
                                  options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Handle file operations with Grace intelligence"""
        
        # Validate operation
        valid_operations = ['create', 'read', 'update', 'delete', 'move', 'copy', 
                          'list', 'exists', 'info', 'watch', 'unwatch']
        
        if operation not in valid_operations:
            return {
                'success': False,
                'error': f"Invalid operation: {operation}"
            }
        
        # Create operation record
        op_record = FileOperation(
            operation_type=operation,
            file_path=file_path,
            timestamp=datetime.now().isoformat(),
            user_id=options.get('user_id', 'system') if options else 'system',
            session_id=options.get('session_id', 'default') if options else 'default'
        )
        
        try:
            # Security check
            if not self._validate_file_path(file_path):
                raise ValueError(f"Invalid or unsafe file path: {file_path}")
            
            # Execute operation
            if operation == 'create':
                result = await self._create_file(file_path, content, options)
            elif operation == 'read':
                result = await self._read_file(file_path, options)
            elif operation == 'update':
                result = await self._update_file(file_path, content, options)
            elif operation == 'delete':
                result = await self._delete_file(file_path, options)
            elif operation == 'move':
                result = await self._move_file(file_path, options.get('destination'), options)
            elif operation == 'copy':
                result = await self._copy_file(file_path, options.get('destination'), options)
            elif operation == 'list':
                result = await self._list_directory(file_path, options)
            elif operation == 'exists':
                result = await self._check_exists(file_path)
            elif operation == 'info':
                result = await self._get_file_info(file_path)
            elif operation == 'watch':
                result = await self._watch_file(file_path, options)
            elif operation == 'unwatch':
                result = await self._unwatch_file(file_path)
            
            # Update operation record
            op_record.status = 'success'
            if result.get('checksum'):
                op_record.checksum = result['checksum']
            
            # Log operation
            self.file_operations_log.append(op_record)
            
            return result
            
        except Exception as e:
            logger.error(f"File operation failed: {operation} on {file_path} - {e}")
            op_record.status = 'failed'
            op_record.error_message = str(e)
            self.file_operations_log.append(op_record)
            
            return {
                'success': False,
                'error': str(e),
                'operation': operation,
                'file_path': file_path
            }
    
    def _validate_file_path(self, file_path: str) -> bool:
        """Validate file path for security"""
        try:
            # Convert to Path object
            path = Path(file_path).resolve()
            
            # Check for path traversal attempts
            if ".." in str(path):
                return False
            
            # Mobile sandbox restrictions
            if self.capabilities['sandbox_mode']:
                # Ensure path is within allowed directories
                allowed_dirs = [
                    Path(self.storage_path),
                    Path.home() / "Documents" / "Grace"
                ]
                
                if not any(str(path).startswith(str(allowed)) for allowed in allowed_dirs):
                    return False
                
                # Check file extension
                if self.allowed_extensions and path.suffix not in self.allowed_extensions:
                    return False
            
            return True
            
        except Exception:
            return False
    
    async def _create_file(self, file_path: str, content: Union[str, bytes], 
                          options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Create a new file with content"""
        path = Path(file_path)
        
        # Create parent directories if needed
        path.parent.mkdir(parents=True, exist_ok=True)
        
        # Handle content encoding
        if isinstance(content, str):
            mode = 'w'
            encoding = options.get('encoding', 'utf-8') if options else 'utf-8'
        else:
            mode = 'wb'
            encoding = None
        
        # Write file
        if encoding:
            with open(path, mode, encoding=encoding) as f:
                f.write(content)
        else:
            with open(path, mode) as f:
                f.write(content)
        
        # Calculate checksum
        checksum = self._calculate_checksum(path)
        
        # Set permissions if specified
        if options and 'permissions' in options:
            os.chmod(path, options['permissions'])
        
        return {
            'success': True,
            'file_path': str(path),
            'size': path.stat().st_size,
            'checksum': checksum,
            'created_at': datetime.now().isoformat()
        }
    
    async def _read_file(self, file_path: str, 
                        options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Read file content"""
        path = Path(file_path)
        
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Check file size limit
        file_size = path.stat().st_size
        if file_size > self.max_file_size:
            raise ValueError(f"File too large: {file_size} bytes (max: {self.max_file_size})")
        
        # Determine if binary or text
        mime_type, _ = mimetypes.guess_type(str(path))
        is_binary = mime_type and not mime_type.startswith('text/')
        
        # Read file
        if is_binary:
            with open(path, 'rb') as f:
                content = f.read()
        else:
            encoding = options.get('encoding', 'utf-8') if options else 'utf-8'
            with open(path, 'r', encoding=encoding) as f:
                content = f.read()
        
        return {
            'success': True,
            'content': content,
            'file_path': str(path),
            'size': file_size,
            'mime_type': mime_type,
            'is_binary': is_binary,
            'checksum': self._calculate_checksum(path)
        }
    
    async def _update_file(self, file_path: str, content: Union[str, bytes],
                          options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Update existing file"""
        path = Path(file_path)
        
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Create backup if requested
        if options and options.get('create_backup', True):
            backup_path = await self._create_backup(path)
        else:
            backup_path = None
        
        # Update file
        result = await self._create_file(file_path, content, options)
        result['backup_path'] = str(backup_path) if backup_path else None
        result['updated_at'] = datetime.now().isoformat()
        
        return result
    
    async def _delete_file(self, file_path: str,
                          options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Delete file with optional backup"""
        path = Path(file_path)
        
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Create backup before deletion if requested
        backup_path = None
        if options and options.get('create_backup', False):
            backup_path = await self._create_backup(path)
        
        # Delete file or directory
        if path.is_dir():
            shutil.rmtree(path)
        else:
            path.unlink()
        
        return {
            'success': True,
            'deleted_path': str(path),
            'backup_path': str(backup_path) if backup_path else None,
            'deleted_at': datetime.now().isoformat()
        }
    
    async def _move_file(self, source: str, destination: str,
                        options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Move file to new location"""
        src_path = Path(source)
        dst_path = Path(destination)
        
        if not src_path.exists():
            raise FileNotFoundError(f"Source file not found: {source}")
        
        # Validate destination
        if not self._validate_file_path(str(dst_path)):
            raise ValueError(f"Invalid destination path: {destination}")
        
        # Create destination directory if needed
        dst_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Move file
        shutil.move(str(src_path), str(dst_path))
        
        return {
            'success': True,
            'source': str(src_path),
            'destination': str(dst_path),
            'moved_at': datetime.now().isoformat()
        }
    
    async def _copy_file(self, source: str, destination: str,
                        options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Copy file to new location"""
        src_path = Path(source)
        dst_path = Path(destination)
        
        if not src_path.exists():
            raise FileNotFoundError(f"Source file not found: {source}")
        
        # Validate destination
        if not self._validate_file_path(str(dst_path)):
            raise ValueError(f"Invalid destination path: {destination}")
        
        # Create destination directory if needed
        dst_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Copy file or directory
        if src_path.is_dir():
            shutil.copytree(str(src_path), str(dst_path))
        else:
            shutil.copy2(str(src_path), str(dst_path))
        
        return {
            'success': True,
            'source': str(src_path),
            'destination': str(dst_path),
            'copied_at': datetime.now().isoformat()
        }
    
    async def _list_directory(self, directory: str,
                             options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """List directory contents"""
        path = Path(directory)
        
        if not path.exists():
            raise FileNotFoundError(f"Directory not found: {directory}")
        
        if not path.is_dir():
            raise ValueError(f"Not a directory: {directory}")
        
        # Get options
        recursive = options.get('recursive', False) if options else False
        include_hidden = options.get('include_hidden', False) if options else False
        
        files = []
        
        if recursive:
            # Recursive listing
            for item in path.rglob('*'):
                if not include_hidden and item.name.startswith('.'):
                    continue
                
                files.append({
                    'path': str(item.relative_to(path)),
                    'absolute_path': str(item),
                    'is_directory': item.is_dir(),
                    'size': item.stat().st_size if item.is_file() else 0,
                    'modified': datetime.fromtimestamp(item.stat().st_mtime).isoformat()
                })
        else:
            # Non-recursive listing
            for item in path.iterdir():
                if not include_hidden and item.name.startswith('.'):
                    continue
                
                files.append({
                    'name': item.name,
                    'path': str(item),
                    'is_directory': item.is_dir(),
                    'size': item.stat().st_size if item.is_file() else 0,
                    'modified': datetime.fromtimestamp(item.stat().st_mtime).isoformat()
                })
        
        return {
            'success': True,
            'directory': str(path),
            'file_count': len(files),
            'files': files
        }
    
    async def _check_exists(self, file_path: str) -> Dict[str, Any]:
        """Check if file exists"""
        path = Path(file_path)
        exists = path.exists()
        
        result = {
            'success': True,
            'exists': exists,
            'file_path': str(path)
        }
        
        if exists:
            result.update({
                'is_file': path.is_file(),
                'is_directory': path.is_dir(),
                'size': path.stat().st_size if path.is_file() else 0
            })
        
        return result
    
    async def _get_file_info(self, file_path: str) -> Dict[str, Any]:
        """Get detailed file information"""
        path = Path(file_path)
        
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        stat = path.stat()
        mime_type, _ = mimetypes.guess_type(str(path))
        
        info = {
            'success': True,
            'file_path': str(path),
            'name': path.name,
            'extension': path.suffix,
            'is_file': path.is_file(),
            'is_directory': path.is_dir(),
            'size': stat.st_size,
            'mime_type': mime_type,
            'created': datetime.fromtimestamp(stat.st_ctime).isoformat(),
            'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
            'accessed': datetime.fromtimestamp(stat.st_atime).isoformat(),
            'permissions': oct(stat.st_mode)[-3:],
            'owner_readable': os.access(path, os.R_OK),
            'owner_writable': os.access(path, os.W_OK),
            'owner_executable': os.access(path, os.X_OK)
        }
        
        # Add checksum for files
        if path.is_file() and stat.st_size < 100 * 1024 * 1024:  # Only for files < 100MB
            info['checksum'] = self._calculate_checksum(path)
        
        # Add platform-specific attributes
        if self.capabilities['extended_attributes'] and self.platform == 'Darwin':
            # macOS extended attributes
            try:
                import xattr
                attrs = xattr.xattr(str(path))
                info['extended_attributes'] = dict(attrs)
            except:
                pass
        
        return info
    
    async def _watch_file(self, file_path: str,
                         options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Add file to watch list"""
        path = Path(file_path).resolve()
        
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        self.watched_files.add(str(path))
        
        # TODO: Implement actual file watching with callbacks
        # This would use platform-specific file watching APIs
        
        return {
            'success': True,
            'watching': str(path),
            'total_watched': len(self.watched_files)
        }
    
    async def _unwatch_file(self, file_path: str) -> Dict[str, Any]:
        """Remove file from watch list"""
        path = Path(file_path).resolve()
        
        if str(path) in self.watched_files:
            self.watched_files.remove(str(path))
            success = True
        else:
            success = False
        
        return {
            'success': success,
            'unwatched': str(path) if success else None,
            'total_watched': len(self.watched_files)
        }
    
    async def _create_backup(self, path: Path) -> Path:
        """Create backup of file"""
        backup_dir = Path(self.storage_path) / 'backups'
        backup_dir.mkdir(exist_ok=True)
        
        # Create timestamped backup name
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_name = f"{path.stem}_{timestamp}{path.suffix}"
        backup_path = backup_dir / backup_name
        
        # Copy file to backup location
        if path.is_dir():
            shutil.copytree(str(path), str(backup_path))
        else:
            shutil.copy2(str(path), str(backup_path))
        
        return backup_path
    
    def _calculate_checksum(self, file_path: Path, algorithm: str = 'sha256') -> str:
        """Calculate file checksum"""
        hash_func = hashlib.new(algorithm)
        
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b''):
                hash_func.update(chunk)
        
        return hash_func.hexdigest()
    
    def execute_code(self, code: str, language: str = 'python') -> Dict[str, Any]:
        """Execute code in a safe environment"""
        if language != 'python':
            return {
                'success': False,
                'error': f"Language not supported: {language}"
            }
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(code)
            temp_file = f.name
        
        try:
            # Execute in subprocess for safety
            import subprocess
            
            result = subprocess.run(
                [sys.executable, temp_file],
                capture_output=True,
                text=True,
                timeout=30  # 30 second timeout
            )
            
            return {
                'success': result.returncode == 0,
                'stdout': result.stdout,
                'stderr': result.stderr,
                'return_code': result.returncode
            }
            
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'error': 'Code execution timeout (30 seconds)'
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            # Clean up
            try:
                os.unlink(temp_file)
            except:
                pass
    
    def get_recent_operations(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent file operations"""
        recent = self.file_operations_log[-limit:]
        return [asdict(op) for op in reversed(recent)]
    
    def clear_operation_log(self):
        """Clear the operation log"""
        self.file_operations_log.clear()
    
    def get_storage_stats(self) -> Dict[str, Any]:
        """Get storage statistics"""
        storage_path = Path(self.storage_path)
        
        total_size = 0
        file_count = 0
        dir_count = 0
        
        for item in storage_path.rglob('*'):
            if item.is_file():
                total_size += item.stat().st_size
                file_count += 1
            elif item.is_dir():
                dir_count += 1
        
        return {
            'storage_path': str(storage_path),
            'total_size': total_size,
            'total_size_mb': round(total_size / (1024 * 1024), 2),
            'file_count': file_count,
            'directory_count': dir_count,
            'watched_files': len(self.watched_files),
            'recent_operations': len(self.file_operations_log)
        }


# Export main class
__all__ = ['FileExecutionEngine', 'FileOperation']