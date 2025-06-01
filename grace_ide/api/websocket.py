"""
Grace_IDE WebSocket Module
Handles real-time communication between IDE frontend and backend
"""

import json
import asyncio
import websockets
import logging
import uuid
import time
from datetime import datetime
from typing import Dict, Set, Optional, Callable, Any
from dataclasses import dataclass, asdict
from collections import defaultdict
import jwt
import hashlib
from functools import wraps

# Import our modules
from .file_operations import handle_file_operation_request
from .deployment import handle_deployment_request


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class Client:
    """Represents a connected client"""
    id: str
    websocket: websockets.WebSocketServerProtocol
    workspace: str
    authenticated: bool = False
    permissions: Set[str] = None
    metadata: Dict[str, Any] = None
    connected_at: str = None
    last_activity: str = None
    
    def __post_init__(self):
        if self.permissions is None:
            self.permissions = set()
        if self.metadata is None:
            self.metadata = {}
        if self.connected_at is None:
            self.connected_at = datetime.now().isoformat()
        self.last_activity = self.connected_at


class WebSocketServer:
    """Main WebSocket server for Grace_IDE"""
    
    def __init__(self, host: str = 'localhost', port: int = 8765):
        self.host = host
        self.port = port
        self.clients: Dict[str, Client] = {}
        self.rooms: Dict[str, Set[str]] = defaultdict(set)  # workspace -> client_ids
        self.message_handlers: Dict[str, Callable] = {}
        self.middleware: List[Callable] = []
        self.secret_key = self._generate_secret_key()
        
        # Register built-in handlers
        self._register_builtin_handlers()
        
        # Performance metrics
        self.metrics = {
            'messages_sent': 0,
            'messages_received': 0,
            'errors': 0,
            'active_connections': 0,
            'total_connections': 0
        }
    
    def _generate_secret_key(self) -> str:
        """Generate a secret key for JWT tokens"""
        return hashlib.sha256(f"grace-ide-{time.time()}".encode()).hexdigest()
    
    def _register_builtin_handlers(self):
        """Register built-in message handlers"""
        # Authentication
        self.register_handler('auth', self._handle_auth)
        self.register_handler('logout', self._handle_logout)
        
        # Connection management
        self.register_handler('ping', self._handle_ping)
        self.register_handler('subscribe', self._handle_subscribe)
        self.register_handler('unsubscribe', self._handle_unsubscribe)
        
        # File operations
        self.register_handler('file_operation', self._handle_file_operation)
        
        # Deployment operations
        self.register_handler('deployment', self._handle_deployment)
        
        # Collaboration
        self.register_handler('cursor_position', self._handle_cursor_position)
        self.register_handler('selection_change', self._handle_selection_change)
        self.register_handler('document_change', self._handle_document_change)
        
        # Terminal
        self.register_handler('terminal_input', self._handle_terminal_input)
        self.register_handler('terminal_resize', self._handle_terminal_resize)
        
        # System
        self.register_handler('get_system_info', self._handle_system_info)
        self.register_handler('get_metrics', self._handle_metrics)
    
    def register_handler(self, message_type: str, handler: Callable):
        """Register a message handler"""
        self.message_handlers[message_type] = handler
    
    def add_middleware(self, middleware: Callable):
        """Add middleware for message processing"""
        self.middleware.append(middleware)
    
    async def start(self):
        """Start the WebSocket server"""
        logger.info(f"Starting Grace_IDE WebSocket server on {self.host}:{self.port}")
        
        async with websockets.serve(
            self.handle_client,
            self.host,
            self.port,
            ping_interval=30,
            ping_timeout=10
        ):
            logger.info(f"Server started successfully")
            await asyncio.Future()  # Run forever
    
    async def handle_client(self, websocket, path):
        """Handle a new client connection"""
        client_id = str(uuid.uuid4())
        client = Client(
            id=client_id,
            websocket=websocket,
            workspace=path.strip('/') or 'default'
        )
        
        self.clients[client_id] = client
        self.metrics['total_connections'] += 1
        self.metrics['active_connections'] = len(self.clients)
        
        logger.info(f"Client {client_id} connected to workspace: {client.workspace}")
        
        try:
            # Send welcome message
            await self.send_to_client(client_id, {
                'type': 'welcome',
                'client_id': client_id,
                'workspace': client.workspace,
                'server_time': datetime.now().isoformat()
            })
            
            # Handle messages
            async for message in websocket:
                await self.handle_message(client_id, message)
                
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"Client {client_id} disconnected")
        except Exception as e:
            logger.error(f"Error handling client {client_id}: {e}")
            self.metrics['errors'] += 1
        finally:
            await self.disconnect_client(client_id)
    
    async def handle_message(self, client_id: str, message: str):
        """Handle incoming message from client"""
        client = self.clients.get(client_id)
        if not client:
            return
        
        client.last_activity = datetime.now().isoformat()
        self.metrics['messages_received'] += 1
        
        try:
            data = json.loads(message)
            message_type = data.get('type')
            
            if not message_type:
                await self.send_error(client_id, "Missing message type")
                return
            
            # Apply middleware
            for middleware in self.middleware:
                data = await middleware(client, data)
                if data is None:  # Middleware rejected the message
                    return
            
            # Check authentication for protected endpoints
            if message_type not in ['auth', 'ping'] and not client.authenticated:
                await self.send_error(client_id, "Authentication required")
                return
            
            # Route to handler
            handler = self.message_handlers.get(message_type)
            if handler:
                await handler(client, data)
            else:
                await self.send_error(client_id, f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            await self.send_error(client_id, "Invalid JSON")
        except Exception as e:
            logger.error(f"Error processing message from {client_id}: {e}")
            await self.send_error(client_id, "Internal server error")
            self.metrics['errors'] += 1
    
    async def send_to_client(self, client_id: str, data: Dict):
        """Send message to specific client"""
        client = self.clients.get(client_id)
        if client:
            try:
                await client.websocket.send(json.dumps(data))
                self.metrics['messages_sent'] += 1
            except Exception as e:
                logger.error(f"Error sending to client {client_id}: {e}")
                await self.disconnect_client(client_id)
    
    async def send_to_workspace(self, workspace: str, data: Dict, exclude_client: str = None):
        """Send message to all clients in a workspace"""
        for client_id in self.rooms.get(workspace, set()).copy():
            if client_id != exclude_client:
                await self.send_to_client(client_id, data)
    
    async def broadcast(self, data: Dict, exclude_client: str = None):
        """Broadcast message to all connected clients"""
        for client_id in list(self.clients.keys()):
            if client_id != exclude_client:
                await self.send_to_client(client_id, data)
    
    async def send_error(self, client_id: str, error: str):
        """Send error message to client"""
        await self.send_to_client(client_id, {
            'type': 'error',
            'error': error,
            'timestamp': datetime.now().isoformat()
        })
    
    async def disconnect_client(self, client_id: str):
        """Disconnect and cleanup client"""
        client = self.clients.get(client_id)
        if not client:
            return
        
        # Remove from rooms
        for room_clients in self.rooms.values():
            room_clients.discard(client_id)
        
        # Notify workspace members
        if client.workspace:
            await self.send_to_workspace(client.workspace, {
                'type': 'user_left',
                'client_id': client_id,
                'timestamp': datetime.now().isoformat()
            }, exclude_client=client_id)
        
        # Remove client
        del self.clients[client_id]
        self.metrics['active_connections'] = len(self.clients)
        
        logger.info(f"Client {client_id} cleaned up")
    
    # Built-in message handlers
    
    async def _handle_auth(self, client: Client, data: Dict):
        """Handle authentication"""
        token = data.get('token')
        
        if not token:
            # Generate new token for demo purposes
            # In production, validate against actual auth system
            payload = {
                'client_id': client.id,
                'workspace': client.workspace,
                'exp': time.time() + 86400  # 24 hours
            }
            token = jwt.encode(payload, self.secret_key, algorithm='HS256')
            
            client.authenticated = True
            client.permissions = {'read', 'write', 'execute'}
            
            # Add to workspace room
            self.rooms[client.workspace].add(client.id)
            
            await self.send_to_client(client.id, {
                'type': 'auth_success',
                'token': token,
                'permissions': list(client.permissions)
            })
            
            # Notify workspace members
            await self.send_to_workspace(client.workspace, {
                'type': 'user_joined',
                'client_id': client.id,
                'timestamp': datetime.now().isoformat()
            }, exclude_client=client.id)
        else:
            # Validate existing token
            try:
                payload = jwt.decode(token, self.secret_key, algorithms=['HS256'])
                client.authenticated = True
                client.permissions = {'read', 'write', 'execute'}
                self.rooms[client.workspace].add(client.id)
                
                await self.send_to_client(client.id, {
                    'type': 'auth_success',
                    'permissions': list(client.permissions)
                })
            except jwt.InvalidTokenError:
                await self.send_error(client.id, "Invalid token")
    
    async def _handle_logout(self, client: Client, data: Dict):
        """Handle logout"""
        client.authenticated = False
        client.permissions.clear()
        
        await self.send_to_client(client.id, {
            'type': 'logout_success'
        })
    
    async def _handle_ping(self, client: Client, data: Dict):
        """Handle ping/pong for connection keepalive"""
        await self.send_to_client(client.id, {
            'type': 'pong',
            'timestamp': datetime.now().isoformat()
        })
    
    async def _handle_subscribe(self, client: Client, data: Dict):
        """Subscribe to a channel/room"""
        channel = data.get('channel')
        if channel:
            self.rooms[channel].add(client.id)
            await self.send_to_client(client.id, {
                'type': 'subscribed',
                'channel': channel
            })
    
    async def _handle_unsubscribe(self, client: Client, data: Dict):
        """Unsubscribe from a channel/room"""
        channel = data.get('channel')
        if channel:
            self.rooms[channel].discard(client.id)
            await self.send_to_client(client.id, {
                'type': 'unsubscribed',
                'channel': channel
            })
    
    async def _handle_file_operation(self, client: Client, data: Dict):
        """Handle file operations"""
        # Pass to file operations handler
        await handle_file_operation_request(client.websocket, data)
    
    async def _handle_deployment(self, client: Client, data: Dict):
        """Handle deployment operations"""
        # Pass to deployment handler
        await handle_deployment_request(client.websocket, data)
    
    async def _handle_cursor_position(self, client: Client, data: Dict):
        """Handle collaborative cursor position updates"""
        # Broadcast to other users in the same file
        file_path = data.get('file_path')
        if file_path:
            await self.send_to_workspace(client.workspace, {
                'type': 'cursor_update',
                'client_id': client.id,
                'file_path': file_path,
                'position': data.get('position'),
                'timestamp': datetime.now().isoformat()
            }, exclude_client=client.id)
    
    async def _handle_selection_change(self, client: Client, data: Dict):
        """Handle collaborative selection changes"""
        file_path = data.get('file_path')
        if file_path:
            await self.send_to_workspace(client.workspace, {
                'type': 'selection_update',
                'client_id': client.id,
                'file_path': file_path,
                'selection': data.get('selection'),
                'timestamp': datetime.now().isoformat()
            }, exclude_client=client.id)
    
    async def _handle_document_change(self, client: Client, data: Dict):
        """Handle collaborative document changes"""
        file_path = data.get('file_path')
        if file_path:
            # In a real implementation, this would integrate with OT/CRDT
            await self.send_to_workspace(client.workspace, {
                'type': 'document_change',
                'client_id': client.id,
                'file_path': file_path,
                'changes': data.get('changes'),
                'timestamp': datetime.now().isoformat()
            }, exclude_client=client.id)
    
    async def _handle_terminal_input(self, client: Client, data: Dict):
        """Handle terminal input"""
        terminal_id = data.get('terminal_id')
        command = data.get('input')
        
        # In a real implementation, this would execute in a PTY
        # For now, just echo back
        await self.send_to_client(client.id, {
            'type': 'terminal_output',
            'terminal_id': terminal_id,
            'output': f"$ {command}\n",
            'timestamp': datetime.now().isoformat()
        })
    
    async def _handle_terminal_resize(self, client: Client, data: Dict):
        """Handle terminal resize"""
        terminal_id = data.get('terminal_id')
        cols = data.get('cols')
        rows = data.get('rows')
        
        # In a real implementation, this would resize the PTY
        logger.info(f"Terminal {terminal_id} resized to {cols}x{rows}")
    
    async def _handle_system_info(self, client: Client, data: Dict):
        """Get system information"""
        import platform
        import psutil
        
        await self.send_to_client(client.id, {
            'type': 'system_info',
            'platform': platform.system(),
            'python_version': platform.python_version(),
            'cpu_count': psutil.cpu_count(),
            'memory_total': psutil.virtual_memory().total,
            'memory_available': psutil.virtual_memory().available,
            'disk_usage': psutil.disk_usage('/').percent,
            'timestamp': datetime.now().isoformat()
        })
    
    async def _handle_metrics(self, client: Client, data: Dict):
        """Get server metrics"""
        await self.send_to_client(client.id, {
            'type': 'metrics',
            'metrics': self.metrics,
            'timestamp': datetime.now().isoformat()
        })


# Middleware examples

async def logging_middleware(client: Client, message: Dict) -> Dict:
    """Log all incoming messages"""
    logger.debug(f"Client {client.id}: {message.get('type')}")
    return message


async def rate_limit_middleware(client: Client, message: Dict) -> Dict:
    """Simple rate limiting middleware"""
    # In a real implementation, track message rates per client
    # For now, just pass through
    return message


async def permission_middleware(client: Client, message: Dict) -> Dict:
    """Check permissions for certain operations"""
    message_type = message.get('type')
    
    # Define permission requirements
    permission_map = {
        'file_operation': 'write',
        'deployment': 'execute',
        'terminal_input': 'execute'
    }
    
    required_permission = permission_map.get(message_type)
    if required_permission and required_permission not in client.permissions:
        await client.websocket.send(json.dumps({
            'type': 'error',
            'error': f'Permission denied: {required_permission} required'
        }))
        return None  # Stop processing
    
    return message


# Utility functions

def create_server(host: str = 'localhost', port: int = 8765) -> WebSocketServer:
    """Create and configure a WebSocket server"""
    server = WebSocketServer(host, port)
    
    # Add middleware
    server.add_middleware(logging_middleware)
    server.add_middleware(rate_limit_middleware)
    server.add_middleware(permission_middleware)
    
    return server


async def run_server(host: str = 'localhost', port: int = 8765):
    """Run the WebSocket server"""
    server = create_server(host, port)
    await server.start()


# Extension points for custom handlers

class CustomHandler:
    """Base class for custom message handlers"""
    
    def __init__(self, server: WebSocketServer):
        self.server = server
    
    async def handle(self, client: Client, data: Dict):
        """Override this method in subclasses"""
        raise NotImplementedError


# Example custom handler
class CodeCompletionHandler(CustomHandler):
    """Handle code completion requests"""
    
    async def handle(self, client: Client, data: Dict):
        file_path = data.get('file_path')
        position = data.get('position')
        
        # In a real implementation, this would use LSP or similar
        completions = [
            {'label': 'print', 'kind': 'function'},
            {'label': 'import', 'kind': 'keyword'},
            {'label': 'class', 'kind': 'keyword'}
        ]
        
        await self.server.send_to_client(client.id, {
            'type': 'code_completions',
            'completions': completions,
            'request_id': data.get('request_id')
        })


# Main entry point
if __name__ == '__main__':
    import sys
    
    host = sys.argv[1] if len(sys.argv) > 1 else 'localhost'
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 8765
    
    asyncio.run(run_server(host, port))