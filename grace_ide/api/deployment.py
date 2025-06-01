"""
Grace_IDE Deployment Module
Handles deployment operations including local, cloud, and containerized deployments
"""

import os
import json
import shutil
import subprocess
import tempfile
import zipfile
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from pathlib import Path
import asyncio
import aiohttp
from dataclasses import dataclass, asdict


@dataclass
class DeploymentConfig:
    """Configuration for deployment operations"""
    project_name: str
    deployment_type: str  # 'local', 'docker', 'cloud', 'static'
    target_path: str
    environment: str = 'production'
    port: int = 8080
    auto_restart: bool = True
    health_check_url: Optional[str] = None
    env_variables: Dict[str, str] = None
    build_command: Optional[str] = None
    start_command: Optional[str] = None
    
    def __post_init__(self):
        if self.env_variables is None:
            self.env_variables = {}


class DeploymentManager:
    """Manages deployment operations for Grace_IDE projects"""
    
    def __init__(self, workspace_path: str):
        self.workspace_path = Path(workspace_path)
        self.deployments_dir = self.workspace_path / '.grace' / 'deployments'
        self.deployments_dir.mkdir(parents=True, exist_ok=True)
        self.active_deployments = {}
        
    async def deploy(self, config: DeploymentConfig) -> Dict[str, any]:
        """Main deployment method that routes to specific deployment types"""
        deployment_id = self._generate_deployment_id(config.project_name)
        
        try:
            if config.deployment_type == 'local':
                result = await self._deploy_local(config, deployment_id)
            elif config.deployment_type == 'docker':
                result = await self._deploy_docker(config, deployment_id)
            elif config.deployment_type == 'cloud':
                result = await self._deploy_cloud(config, deployment_id)
            elif config.deployment_type == 'static':
                result = await self._deploy_static(config, deployment_id)
            else:
                raise ValueError(f"Unknown deployment type: {config.deployment_type}")
            
            # Store deployment info
            self.active_deployments[deployment_id] = {
                'config': asdict(config),
                'status': 'running',
                'started_at': datetime.now().isoformat(),
                'result': result
            }
            
            self._save_deployment_state()
            return result
            
        except Exception as e:
            return {
                'success': False,
                'deployment_id': deployment_id,
                'error': str(e)
            }
    
    async def _deploy_local(self, config: DeploymentConfig, deployment_id: str) -> Dict:
        """Deploy project locally"""
        project_path = self.workspace_path / config.project_name
        
        # Create deployment directory
        deploy_path = Path(config.target_path) / deployment_id
        deploy_path.mkdir(parents=True, exist_ok=True)
        
        # Copy project files
        if project_path.exists():
            shutil.copytree(project_path, deploy_path / config.project_name, dirs_exist_ok=True)
        
        # Create environment file
        env_file = deploy_path / '.env'
        with open(env_file, 'w') as f:
            for key, value in config.env_variables.items():
                f.write(f"{key}={value}\n")
        
        # Run build command if specified
        if config.build_command:
            build_result = await self._run_command(
                config.build_command,
                cwd=deploy_path / config.project_name
            )
            if not build_result['success']:
                return build_result
        
        # Create start script
        start_script = deploy_path / 'start.sh'
        with open(start_script, 'w') as f:
            f.write("#!/bin/bash\n")
            f.write(f"cd {deploy_path / config.project_name}\n")
            f.write(f"source {env_file}\n")
            f.write(f"{config.start_command or 'python -m http.server ' + str(config.port)}\n")
        
        os.chmod(start_script, 0o755)
        
        # Start the deployment
        process = subprocess.Popen(
            ['bash', str(start_script)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        return {
            'success': True,
            'deployment_id': deployment_id,
            'url': f"http://localhost:{config.port}",
            'path': str(deploy_path),
            'process_id': process.pid
        }
    
    async def _deploy_docker(self, config: DeploymentConfig, deployment_id: str) -> Dict:
        """Deploy project using Docker"""
        project_path = self.workspace_path / config.project_name
        
        # Create Dockerfile if not exists
        dockerfile_path = project_path / 'Dockerfile'
        if not dockerfile_path.exists():
            dockerfile_content = self._generate_dockerfile(config)
            with open(dockerfile_path, 'w') as f:
                f.write(dockerfile_content)
        
        # Build Docker image
        image_name = f"grace-ide/{config.project_name}:{deployment_id}"
        build_cmd = f"docker build -t {image_name} {project_path}"
        build_result = await self._run_command(build_cmd)
        
        if not build_result['success']:
            return build_result
        
        # Run Docker container
        env_args = ' '.join([f"-e {k}={v}" for k, v in config.env_variables.items()])
        run_cmd = f"docker run -d -p {config.port}:{config.port} {env_args} --name {deployment_id} {image_name}"
        run_result = await self._run_command(run_cmd)
        
        return {
            'success': run_result['success'],
            'deployment_id': deployment_id,
            'url': f"http://localhost:{config.port}",
            'container_id': run_result.get('output', '').strip(),
            'image': image_name
        }
    
    async def _deploy_cloud(self, config: DeploymentConfig, deployment_id: str) -> Dict:
        """Deploy project to cloud provider (example implementation)"""
        # This is a simplified example - real implementation would integrate with cloud providers
        project_path = self.workspace_path / config.project_name
        
        # Create deployment package
        package_path = self.deployments_dir / f"{deployment_id}.zip"
        with zipfile.ZipFile(package_path, 'w') as zf:
            for root, dirs, files in os.walk(project_path):
                for file in files:
                    file_path = Path(root) / file
                    arcname = file_path.relative_to(project_path)
                    zf.write(file_path, arcname)
        
        # Simulate cloud deployment
        # In real implementation, this would upload to AWS, GCP, Azure, etc.
        return {
            'success': True,
            'deployment_id': deployment_id,
            'url': f"https://{config.project_name}-{deployment_id}.grace-ide.cloud",
            'package': str(package_path),
            'provider': 'grace-cloud',
            'region': 'us-east-1'
        }
    
    async def _deploy_static(self, config: DeploymentConfig, deployment_id: str) -> Dict:
        """Deploy static website"""
        project_path = self.workspace_path / config.project_name
        deploy_path = Path(config.target_path) / deployment_id
        
        # Copy static files
        static_extensions = {'.html', '.css', '.js', '.jpg', '.png', '.gif', '.svg', '.ico'}
        deploy_path.mkdir(parents=True, exist_ok=True)
        
        for root, dirs, files in os.walk(project_path):
            for file in files:
                if any(file.endswith(ext) for ext in static_extensions):
                    src = Path(root) / file
                    rel_path = src.relative_to(project_path)
                    dst = deploy_path / rel_path
                    dst.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(src, dst)
        
        # Start simple HTTP server
        server_cmd = f"cd {deploy_path} && python -m http.server {config.port}"
        process = subprocess.Popen(server_cmd, shell=True)
        
        return {
            'success': True,
            'deployment_id': deployment_id,
            'url': f"http://localhost:{config.port}",
            'path': str(deploy_path),
            'process_id': process.pid
        }
    
    async def stop_deployment(self, deployment_id: str) -> Dict:
        """Stop a running deployment"""
        if deployment_id not in self.active_deployments:
            return {'success': False, 'error': 'Deployment not found'}
        
        deployment = self.active_deployments[deployment_id]
        config = DeploymentConfig(**deployment['config'])
        
        try:
            if config.deployment_type == 'docker':
                await self._run_command(f"docker stop {deployment_id}")
                await self._run_command(f"docker rm {deployment_id}")
            elif config.deployment_type in ['local', 'static']:
                if 'process_id' in deployment['result']:
                    os.kill(deployment['result']['process_id'], 15)  # SIGTERM
            
            deployment['status'] = 'stopped'
            deployment['stopped_at'] = datetime.now().isoformat()
            self._save_deployment_state()
            
            return {'success': True, 'message': f'Deployment {deployment_id} stopped'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    async def get_deployment_status(self, deployment_id: str) -> Dict:
        """Get status of a deployment"""
        if deployment_id not in self.active_deployments:
            return {'error': 'Deployment not found'}
        
        deployment = self.active_deployments[deployment_id]
        config = DeploymentConfig(**deployment['config'])
        
        # Check if deployment is still running
        status = deployment['status']
        if status == 'running':
            if config.deployment_type == 'docker':
                result = await self._run_command(f"docker ps -q -f name={deployment_id}")
                if not result['output'].strip():
                    status = 'stopped'
            elif config.deployment_type in ['local', 'static']:
                if 'process_id' in deployment['result']:
                    try:
                        os.kill(deployment['result']['process_id'], 0)
                    except ProcessLookupError:
                        status = 'stopped'
        
        # Perform health check if configured
        health_status = None
        if config.health_check_url and status == 'running':
            health_status = await self._health_check(config.health_check_url)
        
        return {
            'deployment_id': deployment_id,
            'status': status,
            'health': health_status,
            'config': deployment['config'],
            'started_at': deployment.get('started_at'),
            'stopped_at': deployment.get('stopped_at'),
            'url': deployment['result'].get('url')
        }
    
    async def list_deployments(self) -> List[Dict]:
        """List all deployments"""
        deployments = []
        for deployment_id, deployment in self.active_deployments.items():
            status = await self.get_deployment_status(deployment_id)
            deployments.append(status)
        return deployments
    
    async def _run_command(self, command: str, cwd: Path = None) -> Dict:
        """Run shell command asynchronously"""
        try:
            process = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=cwd
            )
            stdout, stderr = await process.communicate()
            
            return {
                'success': process.returncode == 0,
                'output': stdout.decode('utf-8'),
                'error': stderr.decode('utf-8'),
                'return_code': process.returncode
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    async def _health_check(self, url: str) -> str:
        """Perform health check on deployment"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as response:
                    return 'healthy' if response.status == 200 else 'unhealthy'
        except:
            return 'unreachable'
    
    def _generate_dockerfile(self, config: DeploymentConfig) -> str:
        """Generate a basic Dockerfile"""
        return f"""FROM python:3.9-slim

WORKDIR /app

COPY . /app

RUN pip install --no-cache-dir -r requirements.txt || true

EXPOSE {config.port}

ENV PORT={config.port}

CMD {config.start_command or 'python app.py'}
"""
    
    def _generate_deployment_id(self, project_name: str) -> str:
        """Generate unique deployment ID"""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        return f"{project_name}-{timestamp}"
    
    def _save_deployment_state(self):
        """Save deployment state to file"""
        state_file = self.deployments_dir / 'deployments.json'
        with open(state_file, 'w') as f:
            json.dump(self.active_deployments, f, indent=2)
    
    def _load_deployment_state(self):
        """Load deployment state from file"""
        state_file = self.deployments_dir / 'deployments.json'
        if state_file.exists():
            with open(state_file, 'r') as f:
                self.active_deployments = json.load(f)


# WebSocket API endpoints for deployment operations
async def handle_deployment_request(websocket, message: Dict):
    """Handle deployment requests from WebSocket"""
    workspace_path = message.get('workspace_path', '.')
    manager = DeploymentManager(workspace_path)
    
    action = message.get('action')
    
    if action == 'deploy':
        config = DeploymentConfig(**message.get('config', {}))
        result = await manager.deploy(config)
        await websocket.send(json.dumps({
            'type': 'deployment_result',
            'result': result
        }))
    
    elif action == 'stop':
        deployment_id = message.get('deployment_id')
        result = await manager.stop_deployment(deployment_id)
        await websocket.send(json.dumps({
            'type': 'stop_result',
            'result': result
        }))
    
    elif action == 'status':
        deployment_id = message.get('deployment_id')
        result = await manager.get_deployment_status(deployment_id)
        await websocket.send(json.dumps({
            'type': 'status_result',
            'result': result
        }))
    
    elif action == 'list':
        result = await manager.list_deployments()
        await websocket.send(json.dumps({
            'type': 'list_result',
            'result': result
        }))