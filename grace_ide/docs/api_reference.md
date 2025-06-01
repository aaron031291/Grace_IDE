# Grace_IDE API Reference

## Overview

Grace_IDE provides a comprehensive API for interacting with the IDE's core functionality. The API is divided into several modules, each handling specific aspects of the IDE.

## Table of Contents

- [WebSocket API](#websocket-api)
- [File Operations API](#file-operations-api)
- [Deployment API](#deployment-api)
- [Executor API](#executor-api)
- [Consciousness API](#consciousness-api)
- [Memory API](#memory-api)
- [Security API](#security-api)

---

## WebSocket API

The WebSocket API provides real-time communication between the IDE frontend and backend.

### Connection

```javascript
const ws = new WebSocket('ws://localhost:8765');
```

### Authentication

#### Request
```json
{
  "type": "auth",
  "token": "optional-existing-token"
}
```

#### Response
```json
{
  "type": "auth_success",
  "token": "jwt-token",
  "permissions": ["read", "write", "execute"]
}
```

### Message Format

All WebSocket messages follow this structure:

```json
{
  "type": "message-type",
  "action": "specific-action",
  "data": {
    // Action-specific data
  }
}
```

---

## File Operations API

### Create File

#### Request
```json
{
  "type": "file_operation",
  "operation": "create_file",
  "params": {
    "path": "src/example.py",
    "content": "# New file",
    "encoding": "utf-8"
  }
}
```

#### Response
```json
{
  "type": "file_operation_result",
  "operation": "create_file",
  "result": {
    "success": true,
    "file": {
      "path": "src/example.py",
      "name": "example.py",
      "type": "file",
      "size": 10,
      "modified": "2024-01-01T12:00:00",
      "encoding": "utf-8"
    }
  }
}
```

### Read File

#### Request
```json
{
  "type": "file_operation",
  "operation": "read_file",
  "params": {
    "path": "src/example.py",
    "encoding": "utf-8"
  }
}
```

#### Response
```json
{
  "type": "file_operation_result",
  "operation": "read_file",
  "result": {
    "success": true,
    "content": "# File content here",
    "encoding": "utf-8",
    "is_binary": false,
    "size": 1024
  }
}
```

### Update File

#### Request
```json
{
  "type": "file_operation",
  "operation": "update_file",
  "params": {
    "path": "src/example.py",
    "content": "# Updated content",
    "encoding": "utf-8"
  }
}
```

### Delete File

#### Request
```json
{
  "type": "file_operation",
  "operation": "delete_file",
  "params": {
    "path": "src/example.py",
    "permanent": false
  }
}
```

### List Directory

#### Request
```json
{
  "type": "file_operation",
  "operation": "list_directory",
  "params": {
    "path": "src",
    "recursive": false
  }
}
```

#### Response
```json
{
  "type": "file_operation_result",
  "operation": "list_directory",
  "result": {
    "success": true,
    "path": "src",
    "files": [
      {
        "path": "src/main.py",
        "name": "main.py",
        "type": "file",
        "size": 2048
      }
    ],
    "count": 1
  }
}
```

### Search Files

#### Request
```json
{
  "type": "file_operation",
  "operation": "search_files",
  "params": {
    "pattern": "TODO",
    "path": ".",
    "content_search": true,
    "case_sensitive": false,
    "max_results": 100
  }
}
```

### File Watching

#### Request
```json
{
  "type": "file_operation",
  "operation": "watch_file",
  "params": {
    "path": "src/main.py"
  }
}
```

#### File Change Event
```json
{
  "type": "file_change",
  "path": "src/main.py",
  "change_type": "modified"
}
```

---

## Deployment API

### Deploy Project

#### Request
```json
{
  "type": "deployment",
  "action": "deploy",
  "config": {
    "project_name": "my-app",
    "deployment_type": "docker",
    "target_path": "/deployments",
    "environment": "production",
    "port": 8080,
    "env_variables": {
      "NODE_ENV": "production"
    },
    "build_command": "npm run build",
    "start_command": "npm start"
  }
}
```

#### Response
```json
{
  "type": "deployment_result",
  "result": {
    "success": true,
    "deployment_id": "my-app-20240101120000",
    "url": "http://localhost:8080",
    "container_id": "abc123def456"
  }
}
```

### Deployment Types

- `local` - Deploy to local directory
- `docker` - Create and run Docker container
- `cloud` - Deploy to cloud provider
- `static` - Static website deployment

### Stop Deployment

#### Request
```json
{
  "type": "deployment",
  "action": "stop",
  "deployment_id": "my-app-20240101120000"
}
```

### List Deployments

#### Request
```json
{
  "type": "deployment",
  "action": "list"
}
```

#### Response
```json
{
  "type": "deployment_result",
  "result": [
    {
      "deployment_id": "my-app-20240101120000",
      "status": "running",
      "url": "http://localhost:8080",
      "started_at": "2024-01-01T12:00:00"
    }
  ]
}
```

---

## Executor API

### Execute Code

#### Request
```json
{
  "type": "executor",
  "action": "execute",
  "config": {
    "language": "python",
    "code": "print('Hello, World!')",
    "timeout": 30,
    "memory_limit": 512,
    "stdin_data": "input data"
  }
}
```

#### Response
```json
{
  "type": "execution_result",
  "result": {
    "id": "exec-123",
    "status": "success",
    "exit_code": 0,
    "stdout": "Hello, World!\n",
    "stderr": "",
    "execution_time": 0.05,
    "memory_usage": 1048576,
    "cpu_usage": 5.2
  }
}
```

### Supported Languages

- `python` - Python 3.x
- `javascript` - Node.js
- `typescript` - TypeScript (via ts-node)
- `java` - Java
- `cpp` - C++
- `c` - C
- `go` - Go
- `rust` - Rust
- `ruby` - Ruby
- `php` - PHP
- `shell` - Shell/Bash

### Interactive Execution

#### Request
```json
{
  "type": "executor",
  "action": "execute",
  "config": {
    "language": "python",
    "interactive": true
  }
}
```

### Terminal Input

#### Request
```json
{
  "type": "executor",
  "action": "terminal_input",
  "terminal_id": "term-123",
  "data": "print('Hello')\n"
}
```

### Debug Session

#### Request
```json
{
  "type": "executor",
  "action": "debug",
  "config": {
    "language": "python",
    "file_path": "main.py",
    "breakpoints": [10, 25]
  }
}
```

---

## Consciousness API

### Analyze File

#### Request
```json
{
  "type": "consciousness",
  "action": "analyze_file",
  "file_path": "src/main.py",
  "content": "# Python code here"
}
```

#### Response
```json
{
  "type": "consciousness_result",
  "action": "analyze_file",
  "result": {
    "context": {
      "imports": ["os", "sys"],
      "functions": ["main", "helper"],
      "classes": ["Application"]
    },
    "patterns": [
      {
        "type": "anti-pattern",
        "severity": "warning",
        "line": 45,
        "message": "Function is too long"
      }
    ],
    "suggestions": [
      {
        "type": "refactor",
        "priority": "medium",
        "title": "Extract method",
        "description": "Consider extracting lines 45-60 into a separate method"
      }
    ]
  }
}
```

### Get Code Completions

#### Request
```json
{
  "type": "consciousness",
  "action": "get_completions",
  "file_path": "src/main.py",
  "position": {
    "line": 10,
    "column": 15
  }
}
```

#### Response
```json
{
  "type": "consciousness_result",
  "action": "get_completions",
  "result": [
    {
      "label": "print",
      "kind": "function",
      "detail": "Built-in function",
      "score": 0.95
    }
  ]
}
```

### Detect Intent

#### Request
```json
{
  "type": "consciousness",
  "action": "detect_intent",
  "file_path": "src/main.py",
  "cursor_position": {"line": 20, "column": 0},
  "recent_text": "def calculate_"
}
```

### Suggest Refactoring

#### Request
```json
{
  "type": "consciousness",
  "action": "suggest_refactoring",
  "file_path": "src/main.py",
  "selection": {
    "start": {"line": 10, "column": 0},
    "end": {"line": 30, "column": 0}
  }
}
```

### Explain Code

#### Request
```json
{
  "type": "consciousness",
  "action": "explain_code",
  "file_path": "src/main.py",
  "selection": {
    "start": {"line": 5, "column": 0},
    "end": {"line": 15, "column": 0}
  }
}
```

---

## Memory API

### Store Value

#### Request
```json
{
  "type": "memory",
  "action": "remember",
  "key": "last_search",
  "value": "TODO fix",
  "ttl": 3600,
  "metadata": {
    "timestamp": "2024-01-01T12:00:00"
  }
}
```

### Retrieve Value

#### Request
```json
{
  "type": "memory",
  "action": "recall",
  "key": "last_search"
}
```

### Search Memory

#### Request
```json
{
  "type": "memory",
  "action": "search",
  "pattern": "search",
  "limit": 10
}
```

### Record Action

#### Request
```json
{
  "type": "memory",
  "action": "record_action",
  "action_name": "file_created",
  "data": {
    "file": "new_file.py"
  },
  "reversible": true,
  "undo_data": {
    "file": "new_file.py"
  }
}
```

### Session Management

#### Create Session
```json
{
  "type": "memory",
  "action": "create_session"
}
```

#### Update Session
```json
{
  "type": "memory",
  "action": "update_session",
  "updates": {
    "active_file": "src/main.py",
    "cursor_positions": {
      "src/main.py": {"line": 10, "column": 5}
    }
  }
}
```

---

## Security API

### Scan File

#### Request
```json
{
  "type": "security",
  "action": "scan_file",
  "file_path": "src/main.py",
  "content": "# Python code"
}
```

#### Response
```json
{
  "type": "security_result",
  "action": "scan_file",
  "vulnerabilities": [
    {
      "id": "vuln-123",
      "type": "sql_injection",
      "severity": "high",
      "file_path": "src/main.py",
      "line_start": 25,
      "message": "Potential SQL injection vulnerability",
      "recommendation": "Use parameterized queries"
    }
  ]
}
```

### Scan Workspace

#### Request
```json
{
  "type": "security",
  "action": "scan_workspace"
}
```

#### Progress Updates
```json
{
  "type": "security_progress",
  "status": "Scanning src/main.py"
}
```

### Fix Vulnerability

#### Request
```json
{
  "type": "security",
  "action": "fix_vulnerability",
  "vulnerability_id": "vuln-123"
}
```

### Generate Security Report

#### Request
```json
{
  "type": "security",
  "action": "generate_report",
  "scan_id": "scan-456"
}
```

#### Response
```json
{
  "type": "security_result",
  "action": "report",
  "report": {
    "scan_id": "scan-456",
    "summary": {
      "total_vulnerabilities": 5,
      "critical": 1,
      "high": 2,
      "medium": 2
    },
    "vulnerabilities_by_type": {
      "sql_injection": [...],
      "xss": [...]
    },
    "recommendations": [
      "Use parameterized queries",
      "Update vulnerable dependencies"
    ]
  }
}
```

---

## Error Handling

All API responses may include error information:

```json
{
  "type": "error",
  "error": "Error message",
  "details": {
    "code": "ERROR_CODE",
    "context": {}
  }
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- Default: 1000 requests per minute
- File operations: 100 per minute
- Executions: 50 per minute

Rate limit headers are included in responses:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## Best Practices

1. **Authentication**: Always authenticate before making API calls
2. **Error Handling**: Implement proper error handling for all API calls
3. **Timeouts**: Set appropriate timeouts for long-running operations
4. **Cleanup**: Close WebSocket connections when done
5. **Caching**: Cache frequently accessed data using the Memory API
6. **Security**: Always validate and sanitize input data

## Example Usage

### JavaScript Client

```javascript
class GraceIDEClient {
  constructor(url = 'ws://localhost:8765') {
    this.ws = new WebSocket(url);
    this.handlers = new Map();
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      const handler = this.handlers.get(message.type);
      if (handler) handler(message);
    };
  }
  
  async authenticate(token = null) {
    return this.send('auth', { token });
  }
  
  async readFile(path) {
    return this.send('file_operation', {
      operation: 'read_file',
      params: { path }
    });
  }
  
  async executeCode(language, code) {
    return this.send('executor', {
      action: 'execute',
      config: { language, code }
    });
  }
  
  send(type, data) {
    return new Promise((resolve) => {
      const id = Math.random().toString(36);
      this.handlers.set(type + '_result', resolve);
      this.ws.send(JSON.stringify({ type, ...data, id }));
    });
  }
}

// Usage
const client = new GraceIDEClient();
await client.authenticate();
const file = await client.readFile('src/main.py');
const result = await client.executeCode('python', 'print("Hello")');
```

### Python Client

```python
import asyncio
import json
import websockets

class GraceIDEClient:
    def __init__(self, url='ws://localhost:8765'):
        self.url = url
        self.ws = None
        
    async def connect(self):
        self.ws = await websockets.connect(self.url)
        
    async def authenticate(self, token=None):
        await self.send({'type': 'auth', 'token': token})
        response = await self.receive()
        return response
        
    async def read_file(self, path):
        await self.send({
            'type': 'file_operation',
            'operation': 'read_file',
            'params': {'path': path}
        })
        return await self.receive()
        
    async def execute_code(self, language, code):
        await self.send({
            'type': 'executor',
            'action': 'execute',
            'config': {'language': language, 'code': code}
        })
        return await self.receive()
        
    async def send(self, message):
        await self.ws.send(json.dumps(message))
        
    async def receive(self):
        response = await self.ws.recv()
        return json.loads(response)
        
    async def close(self):
        await self.ws.close()

# Usage
async def main():
    client = GraceIDEClient()
    await client.connect()
    await client.authenticate()
    
    file_content = await client.read_file('src/main.py')
    result = await client.execute_code('python', 'print("Hello")')
    
    await client.close()

asyncio.run(main())
```

---

## Version Information

- API Version: 1.0.0
- Last Updated: January 2024
- Compatibility: Grace_IDE v1.0+

## Support

For API support and questions:
- Documentation: https://grace-ide.dev/docs
- Issues: https://github.com/grace-ide/grace-ide/issues
- Community: https://discord.gg/grace-ide