"""
Grace_IDE File Operations Module
Handles file system operations including CRUD, search, and file watching
"""

import json
import shutil
import asyncio
import aiofiles
import hashlib
import mimetypes
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, AsyncGenerator
from dataclasses import dataclass
import watchdog.observers
import watchdog.events
from collections import deque
import fnmatch
import chardet
import tempfile
import zipfile


@dataclass
class FileInfo:
    """Information about a file or directory"""
    path: str
    name: str
    type: str  # 'file' or 'directory'
    size: int
    modified: str
    created: str
    permissions: str
    mime_type: Optional[str] = None
    encoding: Optional[str] = None
    extension: Optional[str] = None
    is_binary: bool = False
    is_hidden: bool = False
    checksum: Optional[str] = None


class FileOperationsManager:
    """Manages file operations for Grace_IDE"""
    
    def __init__(self, workspace_root: str, max_file_size: int = 10 * 1024 * 1024):
        self.workspace_root = Path(workspace_root).resolve()
        self.max_file_size = max_file_size
        self.file_watchers = {}
        self.operation_history = deque(maxlen=100)
        self.temp_dir = Path(tempfile.gettempdir()) / 'grace_ide' / 'temp'
        self.temp_dir.mkdir(parents=True, exist_ok=True)
        
        # File type configurations
        self.text_extensions = {
            '.txt', '.md', '.py', '.js', '.ts', '.jsx', '.tsx', '.html', 
            '.css', '.scss', '.sass', '.json', '.xml', '.yaml', '.yml',
            '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat', '.cmd',
            '.c', '.cpp', '.h', '.hpp', '.java', '.rs', '.go', '.rb',
            '.php', '.lua', '.r', '.m', '.swift', '.kt', '.scala',
            '.dockerfile', '.gitignore', '.env', '.ini', '.toml'
        }
        
        self.binary_extensions = {
            '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico', '.svg',
            '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
            '.zip', '.tar', '.gz', '.rar', '.7z', '.exe', '.dll',
            '.so', '.dylib', '.bin', '.dat', '.db', '.sqlite'
        }
    
    async def create_file(self, path: str, content: str = "", encoding: str = 'utf-8') -> Dict:
        """Create a new file"""
        try:
            file_path = self._resolve_path(path)
            
            # Check if file already exists
            if file_path.exists():
                return {
                    'success': False,
                    'error': f'File already exists: {path}'
                }
            
            # Create parent directories if needed
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Write content to file
            async with aiofiles.open(file_path, 'w', encoding=encoding) as f:
                await f.write(content)
            
            # Record operation
            self._record_operation('create_file', path)
            
            # Get file info
            info = await self.get_file_info(path)
            
            return {
                'success': True,
                'file': info,
                'message': f'File created: {path}'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    async def read_file(self, path: str, encoding: Optional[str] = None) -> Dict:
        """Read file content"""
        try:
            file_path = self._resolve_path(path)
            
            if not file_path.exists():
                return {
                    'success': False,
                    'error': f'File not found: {path}'
                }
            
            if not file_path.is_file():
                return {
                    'success': False,
                    'error': f'Not a file: {path}'
                }
            
            # Check file size
            file_size = file_path.stat().st_size
            if file_size > self.max_file_size:
                return {
                    'success': False,
                    'error': f'File too large: {file_size} bytes (max: {self.max_file_size})'
                }
            
            # Detect encoding if not specified
            if not encoding:
                encoding = await self._detect_encoding(file_path)
            
            # Check if binary file
            if self._is_binary_file(file_path):
                # For binary files, return base64 encoded content
                import base64
                async with aiofiles.open(file_path, 'rb') as f:
                    content = await f.read()
                    return {
                        'success': True,
                        'content': base64.b64encode(content).decode('utf-8'),
                        'encoding': 'base64',
                        'is_binary': True,
                        'size': file_size
                    }
            
            # Read text file
            async with aiofiles.open(file_path, 'r', encoding=encoding) as f:
                content = await f.read()
            
            return {
                'success': True,
                'content': content,
                'encoding': encoding,
                'is_binary': False,
                'size': file_size
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    async def update_file(self, path: str, content: str, encoding: str = 'utf-8') -> Dict:
        """Update file content"""
        try:
            file_path = self._resolve_path(path)
            
            if not file_path.exists():
                return {
                    'success': False,
                    'error': f'File not found: {path}'
                }
            
            # Create backup
            backup_path = await self._create_backup(file_path)
            
            # Write new content
            async with aiofiles.open(file_path, 'w', encoding=encoding) as f:
                await f.write(content)
            
            # Record operation
            self._record_operation('update_file', path, {'backup': str(backup_path)})
            
            return {
                'success': True,
                'message': f'File updated: {path}',
                'backup': str(backup_path)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    async def delete_file(self, path: str, permanent: bool = False) -> Dict:
        """Delete a file or directory"""
        try:
            file_path = self._resolve_path(path)
            
            if not file_path.exists():
                return {
                    'success': False,
                    'error': f'Path not found: {path}'
                }
            
            if permanent:
                # Permanent deletion
                if file_path.is_file():
                    file_path.unlink()
                else:
                    shutil.rmtree(file_path)
            else:
                # Move to trash
                _ = await self._move_to_trash(file_path)
                
            # Record operation
            self._record_operation('delete_file', path, {'permanent': permanent})
            
            return {
                'success': True,
                'message': f'{"Permanently deleted" if permanent else "Moved to trash"}: {path}'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    async def rename_file(self, old_path: str, new_name: str) -> Dict:
        """Rename a file or directory"""
        try:
            old_file_path = self._resolve_path(old_path)
            
            if not old_file_path.exists():
                return {
                    'success': False,
                    'error': f'Path not found: {old_path}'
                }
            
            new_file_path = old_file_path.parent / new_name
            
            if new_file_path.exists():
                return {
                    'success': False,
                    'error': f'Target already exists: {new_name}'
                }
            
            # Rename
            old_file_path.rename(new_file_path)
            
            # Record operation
            self._record_operation('rename_file', old_path, {'new_name': new_name})
            
            # Get new file info
            new_path = str(new_file_path.relative_to(self.workspace_root))
            info = await self.get_file_info(new_path)
            
            return {
                'success': True,
                'message': f'Renamed: {old_path} -> {new_name}',
                'file': info
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    async def move_file(self, source_path: str, destination_path: str) -> Dict:
        """Move a file or directory"""
        try:
            source = self._resolve_path(source_path)
            destination = self._resolve_path(destination_path)
            
            if not source.exists():
                return {
                    'success': False,
                    'error': f'Source not found: {source_path}'
                }
            
            # If destination is a directory, move source into it
            if destination.exists() and destination.is_dir():
                destination = destination / source.name
            
            # Check if destination already exists
            if destination.exists():
                return {
                    'success': False,
                    'error': f'Destination already exists: {destination_path}'
                }
            
            # Create parent directories
            destination.parent.mkdir(parents=True, exist_ok=True)
            
            # Move
            shutil.move(str(source), str(destination))
            
            # Record operation
            self._record_operation('move_file', source_path, {'destination': destination_path})
            
            return {
                'success': True,
                'message': f'Moved: {source_path} -> {destination_path}'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    async def copy_file(self, source_path: str, destination_path: str) -> Dict:
        """Copy a file or directory"""
        try:
            source = self._resolve_path(source_path)
            destination = self._resolve_path(destination_path)
            
            if not source.exists():
                return {
                    'success': False,
                    'error': f'Source not found: {source_path}'
                }
            
            # If destination is a directory, copy source into it
            if destination.exists() and destination.is_dir():
                destination = destination / source.name
            
            # Check if destination already exists
            if destination.exists():
                return {
                    'success': False,
                    'error': f'Destination already exists: {destination_path}'
                }
            
            # Create parent directories
            destination.parent.mkdir(parents=True, exist_ok=True)
            
            # Copy
            if source.is_file():
                shutil.copy2(str(source), str(destination))
            else:
                shutil.copytree(str(source), str(destination))
            
            # Record operation
            self._record_operation('copy_file', source_path, {'destination': destination_path})
            
            return {
                'success': True,
                'message': f'Copied: {source_path} -> {destination_path}'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    async def create_directory(self, path: str) -> Dict:
        """Create a new directory"""
        try:
            dir_path = self._resolve_path(path)
            
            if dir_path.exists():
                return {
                    'success': False,
                    'error': f'Directory already exists: {path}'
                }
            
            # Create directory
            dir_path.mkdir(parents=True, exist_ok=True)
            
            # Record operation
            self._record_operation('create_directory', path)
            
            # Get directory info
            info = await self.get_file_info(path)
            
            return {
                'success': True,
                'message': f'Directory created: {path}',
                'directory': info
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    async def list_directory(self, path: str = ".", recursive: bool = False) -> Dict:
        """List directory contents"""
        try:
            dir_path = self._resolve_path(path)
            
            if not dir_path.exists():
                return {
                    'success': False,
                    'error': f'Directory not found: {path}'
                }
            
            if not dir_path.is_dir():
                return {
                    'success': False,
                    'error': f'Not a directory: {path}'
                }
            
            files = []
            
            if recursive:
                # Recursive listing
                for item_path in dir_path.rglob('*'):
                    if not self._should_ignore(item_path):
                        rel_path = str(item_path.relative_to(self.workspace_root))
                        info = await self.get_file_info(rel_path)
                        files.append(info)
            else:
                # Non-recursive listing
                for item_path in dir_path.iterdir():
                    if not self._should_ignore(item_path):
                        rel_path = str(item_path.relative_to(self.workspace_root))
                        info = await self.get_file_info(rel_path)
                        files.append(info)
            
            # Sort files: directories first, then by name
            files.sort(key=lambda x: (x['type'] != 'directory', x['name'].lower()))
            
            return {
                'success': True,
                'path': path,
                'files': files,
                'count': len(files)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    async def search_files(self, pattern: str, path: str = ".", 
                          content_search: bool = False,
                          case_sensitive: bool = False,
                          max_results: int = 100) -> Dict:
        """Search for files by name or content"""
        try:
            search_path = self._resolve_path(path)
            
            if not search_path.exists():
                return {
                    'success': False,
                    'error': f'Search path not found: {path}'
                }
            
            results = []
            count = 0
            
            # Convert pattern to lowercase if case-insensitive
            if not case_sensitive:
                pattern = pattern.lower()
            
            async for file_path in self._walk_directory(search_path):
                if count >= max_results:
                    break
                
                rel_path = str(file_path.relative_to(self.workspace_root))
                
                # Check filename match
                filename = file_path.name.lower() if not case_sensitive else file_path.name
                if fnmatch.fnmatch(filename, f'*{pattern}*'):
                    info = await self.get_file_info(rel_path)
                    results.append({
                        'file': info,
                        'match_type': 'filename'
                    })
                    count += 1
                    continue
                
                # Check content match for text files
                if content_search and file_path.is_file() and not self._is_binary_file(file_path):
                    try:
                        # Only search in reasonably sized text files
                        if file_path.stat().st_size < 1024 * 1024:  # 1MB limit for content search
                            async with aiofiles.open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                                content = await f.read()
                                search_content = content.lower() if not case_sensitive else content
                                
                                if pattern in search_content:
                                    info = await self.get_file_info(rel_path)
                                    
                                    # Find line numbers where pattern occurs
                                    lines = content.splitlines()
                                    matches = []
                                    for i, line in enumerate(lines):
                                        search_line = line.lower() if not case_sensitive else line
                                        if pattern in search_line:
                                            matches.append({
                                                'line': i + 1,
                                                'content': line.strip()
                                            })
                                    
                                    results.append({
                                        'file': info,
                                        'match_type': 'content',
                                        'matches': matches[:5]  # Limit to first 5 matches
                                    })
                                    count += 1
                    except:
                        pass  # Skip files that can't be read
            
            return {
                'success': True,
                'pattern': pattern,
                'results': results,
                'count': len(results),
                'truncated': count >= max_results
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    async def get_file_info(self, path: str) -> Dict:
        """Get detailed information about a file or directory"""
        try:
            file_path = self._resolve_path(path)
            
            if not file_path.exists():
                return None
            
            stat = file_path.stat()
            
            info = {
                'path': path,
                'name': file_path.name,
                'type': 'directory' if file_path.is_dir() else 'file',
                'size': stat.st_size,
                'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                'created': datetime.fromtimestamp(stat.st_ctime).isoformat(),
                'permissions': oct(stat.st_mode)[-3:],
                'is_hidden': file_path.name.startswith('.')
            }
            
            if file_path.is_file():
                # Additional file information
                info['extension'] = file_path.suffix.lower()
                info['mime_type'] = mimetypes.guess_type(str(file_path))[0]
                info['is_binary'] = self._is_binary_file(file_path)
                
                # Calculate checksum for small files
                if stat.st_size < 1024 * 1024:  # 1MB
                    info['checksum'] = await self._calculate_checksum(file_path)
            
            return info
            
        except Exception:
            return None
    
    async def compress_files(self, paths: List[str], output_name: str, 
                           compression_type: str = 'zip') -> Dict:
        """Compress files into an archive"""
        try:
            output_path = self._resolve_path(output_name)
            
            if compression_type != 'zip':
                return {
                    'success': False,
                    'error': f'Unsupported compression type: {compression_type}'
                }
            
            # Create zip file
            with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zf:
                for path in paths:
                    file_path = self._resolve_path(path)
                    
                    if not file_path.exists():
                        continue
                    
                    if file_path.is_file():
                        # Add single file
                        arcname = file_path.name
                        zf.write(file_path, arcname)
                    else:
                        # Add directory recursively
                        for item in file_path.rglob('*'):
                            if item.is_file() and not self._should_ignore(item):
                                arcname = str(item.relative_to(file_path.parent))
                                zf.write(item, arcname)
            
            # Get archive info
            info = await self.get_file_info(output_name)
            
            return {
                'success': True,
                'message': f'Created archive: {output_name}',
                'archive': info
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    async def extract_archive(self, archive_path: str, destination: str = None) -> Dict:
        """Extract an archive"""
        try:
            archive = self._resolve_path(archive_path)
            
            if not archive.exists():
                return {
                    'success': False,
                    'error': f'Archive not found: {archive_path}'
                }
            
            # Determine destination
            if destination:
                dest_path = self._resolve_path(destination)
            else:
                dest_path = archive.parent / archive.stem
            
            dest_path.mkdir(parents=True, exist_ok=True)
            
            # Extract based on type
            if archive.suffix.lower() == '.zip':
                with zipfile.ZipFile(archive, 'r') as zf:
                    zf.extractall(dest_path)
            else:
                return {
                    'success': False,
                    'error': f'Unsupported archive type: {archive.suffix}'
                }
            
            return {
                'success': True,
                'message': f'Extracted to: {dest_path.relative_to(self.workspace_root)}',
                'destination': str(dest_path.relative_to(self.workspace_root))
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def watch_file(self, path: str, callback):
        """Watch a file for changes"""
        file_path = self._resolve_path(path)
        
        if path in self.file_watchers:
            self.file_watchers[path].stop()
        
        class FileChangeHandler(watchdog.events.FileSystemEventHandler):
            def on_modified(self, event):
                if not event.is_directory and event.src_path == str(file_path):
                    asyncio.create_task(callback({
                        'type': 'modified',
                        'path': path
                    }))
            
            def on_deleted(self, event):
                if event.src_path == str(file_path):
                    asyncio.create_task(callback({
                        'type': 'deleted',
                        'path': path
                    }))
        
        observer = watchdog.observers.Observer()
        observer.schedule(FileChangeHandler(), str(file_path.parent), recursive=False)
        observer.start()
        
        self.file_watchers[path] = observer
        
        return {
            'success': True,
            'message': f'Watching file: {path}'
        }
    
    def stop_watching(self, path: str) -> Dict:
        """Stop watching a file"""
        if path in self.file_watchers:
            self.file_watchers[path].stop()
            del self.file_watchers[path]
            return {
                'success': True,
                'message': f'Stopped watching: {path}'
            }
        
        return {
            'success': False,
            'error': f'Not watching: {path}'
        }
    
    # Helper methods
    
    def _resolve_path(self, path: str) -> Path:
        """Resolve path relative to workspace root"""
        if path.startswith('/'):
            return Path(path)
        return (self.workspace_root / path).resolve()
    
    def _is_within_workspace(self, path: Path) -> bool:
        """Check if path is within workspace"""
        try:
            path.relative_to(self.workspace_root)
            return True
        except ValueError:
            return False
    
    def _should_ignore(self, path: Path) -> bool:
        """Check if path should be ignored"""
        ignore_patterns = {
            '__pycache__', '.git', '.svn', '.hg', 'node_modules',
            '.DS_Store', 'Thumbs.db', '*.pyc', '*.pyo', '.grace'
        }
        
        for pattern in ignore_patterns:
            if fnmatch.fnmatch(path.name, pattern):
                return True
        
        return False
    
    def _is_binary_file(self, path: Path) -> bool:
        """Check if file is binary"""
        # Check by extension first
        if path.suffix.lower() in self.binary_extensions:
            return True
        
        if path.suffix.lower() in self.text_extensions:
            return False
        
        # Check file content
        try:
            with open(path, 'rb') as f:
                chunk = f.read(1024)
                return b'\x00' in chunk
        except:
            return True
    
    async def _detect_encoding(self, path: Path) -> str:
        """Detect file encoding"""
        try:
            with open(path, 'rb') as f:
                raw_data = f.read()
                result = chardet.detect(raw_data)
                return result['encoding'] or 'utf-8'
        except:
            return 'utf-8'
    
    async def _calculate_checksum(self, path: Path) -> str:
        """Calculate file checksum"""
        hash_md5 = hashlib.md5()
        async with aiofiles.open(path, 'rb') as f:
            while chunk := await f.read(8192):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    
    async def _create_backup(self, path: Path) -> Path:
        """Create backup of file"""
        backup_dir = self.workspace_root / '.grace' / 'backups'
        backup_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"{path.stem}_{timestamp}{path.suffix}"
        backup_path = backup_dir / backup_name
        
        shutil.copy2(path, backup_path)
        return backup_path
    
    async def _move_to_trash(self, path: Path) -> Path:
        """Move file to trash"""
        trash_dir = self.workspace_root / '.grace' / 'trash'
        trash_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        trash_name = f"{path.stem}_{timestamp}{path.suffix}"
        trash_path = trash_dir / trash_name
        
        # Store original path info
        info_path = trash_path.with_suffix('.info')
        info = {
            'original_path': str(path.relative_to(self.workspace_root)),
            'deleted_at': datetime.now().isoformat()
        }
        
        with open(info_path, 'w') as f:
            json.dump(info, f)
        
        shutil.move(str(path), str(trash_path))
        return trash_path
    
    def _record_operation(self, operation: str, path: str, details: Dict = None):
        """Record file operation in history"""
        record = {
            'operation': operation,
            'path': path,
            'timestamp': datetime.now().isoformat(),
            'details': details or {}
        }
        self.operation_history.append(record)
    
    async def _walk_directory(self, path: Path) -> AsyncGenerator[Path, None]:
        """Asynchronously walk directory tree"""
        try:
            for item in path.iterdir():
                if self._should_ignore(item):
                    continue
                
                yield item
                
                if item.is_dir():
                    async for sub_item in self._walk_directory(item):
                        yield sub_item
        except PermissionError:
            pass


# WebSocket API endpoints
async def handle_file_operation_request(websocket, message: Dict):
    """Handle file operation requests from WebSocket"""
    workspace_root = message.get('workspace_root', '.')
    manager = FileOperationsManager(workspace_root)
    
    operation = message.get('operation')
    params = message.get('params', {})
    
    operations = {
        'create_file': manager.create_file,
        'read_file': manager.read_file,
        'update_file': manager.update_file,
        'delete_file': manager.delete_file,
        'rename_file': manager.rename_file,
        'move_file': manager.move_file,
        'copy_file': manager.copy_file,
        'create_directory': manager.create_directory,
        'list_directory': manager.list_directory,
        'search_files': manager.search_files,
        'get_file_info': manager.get_file_info,
        'compress_files': manager.compress_files,
        'extract_archive': manager.extract_archive
    }
    
    if operation in operations:
        result = await operations[operation](**params)
        await websocket.send(json.dumps({
            'type': 'file_operation_result',
            'operation': operation,
            'result': result
        }))
    else:
        await websocket.send(json.dumps({
            'type': 'error',
            'error': f'Unknown operation: {operation}'
        }))
