"""
Grace_IDE API Package
Exports the main API components for the IDE backend
"""

from .deployment import DeploymentManager, DeploymentConfig, handle_deployment_request
from .file_operations import FileOperationsManager, FileInfo, handle_file_operation_request
from .websocket import (
    WebSocketServer, 
    Client, 
    create_server, 
    run_server,
    CustomHandler,
    logging_middleware,
    rate_limit_middleware,
    permission_middleware
)

__version__ = '1.0.0'

__all__ = [
    # Deployment exports
    'DeploymentManager',
    'DeploymentConfig',
    'handle_deployment_request',
    
    # File operations exports
    'FileOperationsManager',
    'FileInfo',
    'handle_file_operation_request',
    
    # WebSocket exports
    'WebSocketServer',
    'Client',
    'create_server',
    'run_server',
    'CustomHandler',
    'logging_middleware',
    'rate_limit_middleware',
    'permission_middleware'
]

# Convenience function to start the complete API server
async def start_api_server(host='localhost', port=8765, workspace_root='.'):
    """
    Start the Grace_IDE API server with all components initialized
    
    Args:
        host: Server host address
        port: Server port number
        workspace_root: Root directory for the workspace
    """
    import logging
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    logger = logging.getLogger(__name__)
    logger.info(f"Starting Grace_IDE API Server")
    logger.info(f"Host: {host}:{port}")
    logger.info(f"Workspace: {workspace_root}")
    
    # Create and start server
    server = create_server(host, port)
    
    # Additional configuration could go here
    # For example, registering custom handlers
    
    await server.start()

# Module initialization code
def initialize_api():
    """
    Initialize the API module
    This can be used to set up any required resources
    """
    import os
    from pathlib import Path
    
    # Ensure required directories exist
    grace_dir = Path.home() / '.grace_ide'
    grace_dir.mkdir(exist_ok=True)
    
    # Create subdirectories
    (grace_dir / 'workspaces').mkdir(exist_ok=True)
    (grace_dir / 'deployments').mkdir(exist_ok=True)
    (grace_dir / 'logs').mkdir(exist_ok=True)
    (grace_dir / 'config').mkdir(exist_ok=True)
    
    # Set up default configuration
    config_file = grace_dir / 'config' / 'api.json'
    if not config_file.exists():
        import json
        default_config = {
            'version': __version__,
            'default_host': 'localhost',
            'default_port': 8765,
            'max_file_size': 10 * 1024 * 1024,  # 10MB
            'enable_authentication': True,
            'enable_ssl': False,
            'allowed_origins': ['http://localhost:*', 'https://localhost:*'],
            'session_timeout': 3600,  # 1 hour
            'rate_limit': {
                'enabled': True,
                'max_requests_per_minute': 1000
            }
        }
        
        with open(config_file, 'w') as f:
            json.dump(default_config, f, indent=2)
    
    return True

# Initialize on import
try:
    initialize_api()
except Exception as e:
    import logging
    logging.warning(f"Failed to initialize Grace_IDE API: {e}")