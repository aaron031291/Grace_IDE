# Grace_IDE Development Guide

## Table of Contents

- [Getting Started](#getting-started)
- [Architecture Overview](#architecture-overview)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Core Components](#core-components)
- [Building Features](#building-features)
- [Testing](#testing)
- [Debugging](#debugging)
- [Contributing](#contributing)
- [Release Process](#release-process)

---

## Getting Started

Welcome to Grace_IDE development! This guide will help you understand the architecture, set up your development environment, and start contributing to the project.

### Prerequisites

- Python 3.8+ with pip
- Node.js 16+ with npm
- Git
- Docker (optional, for deployment features)
- A code editor (we recommend Grace_IDE itself!)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/grace-ide/grace-ide.git
cd grace-ide

# Run setup script
./setup.sh

# Start development servers
# Backend
cd grace_ide/api
python -m grace_ide.api

# Frontend (in another terminal)
cd grace_ide
python -m http.server 8000

# Open http://localhost:8000 in your browser
```

---

## Architecture Overview

Grace_IDE follows a modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Browser)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │   HTML/CSS  │  │  JavaScript  │  │   WebSocket   │  │
│  │  Interface  │  │     Core     │  │  Connection   │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
└────────────────────────────┬────────────────────────────┘
                             │ WebSocket
┌────────────────────────────┴────────────────────────────┐
│                    Backend (Python)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  WebSocket  │  │     API      │  │  Components   │  │
│  │   Server    │  │   Handlers   │  │   Modules     │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
│  ┌─────────────────────────────────────────────────┐    │
│  │            Core Components                       │    │
│  │  ┌──────┐ ┌────────┐ ┌──────┐ ┌──────────┐    │    │
│  │  │Memory│ │Executor│ │Consc.│ │ Security │    │    │
│  │  └──────┘ └────────┘ └──────┘ └──────────┘    │    │
│  └─────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

### Key Design Principles

1. **Modularity**: Each component is self-contained and communicates through well-defined interfaces
2. **Asynchronous**: All I/O operations are async for better performance
3. **Event-Driven**: Real-time updates through WebSocket events
4. **Extensible**: Easy to add new languages, features, and integrations
5. **Secure**: Security considerations built into every component

---

## Development Setup

### 1. Install System Dependencies

#### macOS
```bash
brew install python@3.9 node git
brew install --cask docker  # Optional
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install python3.9 python3.9-pip nodejs npm git
# Docker (optional)
curl -fsSL https://get.docker.com | sh
```

#### Windows
```powershell
# Install Python from python.org
# Install Node.js from nodejs.org
# Install Git from git-scm.com
# Install Docker Desktop (optional)
```

### 2. Clone and Setup Repository

```bash
# Clone with submodules if any
git clone --recursive https://github.com/grace-ide/grace-ide.git
cd grace-ide

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Install Node dependencies
cd grace_ide/static
npm install
```

### 3. Configure Development Environment

Create a `.env` file in the project root:

```env
# Development settings
DEBUG=true
LOG_LEVEL=DEBUG
WORKSPACE_ROOT=./workspace

# API settings
API_HOST=localhost
API_PORT=8765
API_SECRET_KEY=dev-secret-key-change-in-production

# Security settings
ENABLE_SECURITY_SCANNING=true
MAX_FILE_SIZE=10485760  # 10MB

# Feature flags
ENABLE_AI_FEATURES=true
ENABLE_COLLABORATION=false
```

### 4. Initialize Development Database

```bash
# Initialize memory and index databases
python scripts/init_db.py

# Create test workspace
python scripts/create_test_workspace.py
```

---

## Project Structure

```
grace-ide/
├── grace_ide/                 # Main application package
│   ├── api/                   # Backend API modules
│   │   ├── __init__.py       # API initialization
│   │   ├── deployment.py     # Deployment operations
│   │   ├── file_operations.py # File system operations
│   │   └── websocket.py      # WebSocket server
│   ├── components/           # Core components
│   │   ├── consciousness/    # AI/Intelligence features
│   │   ├── executor/         # Code execution engine
│   │   ├── memory/          # State management
│   │   └── security/        # Security analysis
│   ├── static/              # Frontend assets
│   │   ├── js/             # JavaScript modules
│   │   ├── css/            # Stylesheets
│   │   └── assets/         # Images, fonts, icons
│   ├── templates/           # HTML templates
│   ├── utils/              # Utility functions
│   └── index.html          # Main entry point
├── docs/                    # Documentation
├── tests/                   # Test suites
├── scripts/                 # Development scripts
├── requirements.txt         # Python dependencies
├── package.json            # Node dependencies
└── setup.sh               # Setup script
```

### Important Files

- `grace_ide/api/websocket.py` - Main WebSocket server and message routing
- `grace_ide/static/js/grace_core.js` - Core frontend logic
- `grace_ide/components/*/` - Individual component implementations
- `grace_ide/index.html` - Main HTML entry point

---

## Core Components

### 1. WebSocket Communication

The WebSocket layer handles all real-time communication:

```python
# Backend handler example
async def handle_file_operation(client, message):
    operation = message.get('operation')
    params = message.get('params', {})
    
    if operation == 'read_file':
        result = await file_manager.read_file(**params)
        await client.send(json.dumps({
            'type': 'file_operation_result',
            'result': result
        }))
```

```javascript
// Frontend handler example
class FileManager {
    async readFile(path) {
        const response = await this.send({
            type: 'file_operation',
            operation: 'read_file',
            params: { path }
        });
        return response.result;
    }
}
```

### 2. File Operations

File operations are handled asynchronously with proper error handling:

```python
class FileOperationsManager:
    async def read_file(self, path: str) -> Dict:
        try:
            file_path = self._resolve_path(path)
            async with aiofiles.open(file_path, 'r') as f:
                content = await f.read()
            return {
                'success': True,
                'content': content
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
```

### 3. Code Execution

The executor component safely runs code in isolated environments:

```python
class PythonRunner(LanguageRunner):
    async def run(self, config: ExecutionConfig) -> ExecutionResult:
        # Create sandbox
        sandbox = self.create_sandbox(config)
        
        # Execute with timeout
        proc = await asyncio.create_subprocess_exec(
            sys.executable, '-u', config.file_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            **sandbox
        )
        
        # Collect results
        stdout, stderr = await asyncio.wait_for(
            proc.communicate(),
            timeout=config.timeout
        )
        
        return ExecutionResult(
            stdout=stdout.decode(),
            stderr=stderr.decode(),
            exit_code=proc.returncode
        )
```

### 4. Intelligence Features

The consciousness component provides AI-powered assistance:

```python
class ConsciousnessEngine:
    async def analyze_code(self, file_path: str, content: str):
        # Parse code structure
        ast_tree = ast.parse(content)
        
        # Extract patterns
        patterns = await self.pattern_detector.analyze(ast_tree)
        
        # Generate suggestions
        suggestions = await self.suggestion_engine.generate(
            patterns, 
            self.user_context
        )
        
        return {
            'patterns': patterns,
            'suggestions': suggestions
        }
```

---

## Building Features

### Adding a New Language

1. Create a language runner in `components/executor/runners/`:

```python
# grace_ide/components/executor/runners/kotlin_runner.py
class KotlinRunner(LanguageRunner):
    async def run(self, config: ExecutionConfig) -> ExecutionResult:
        # Compile Kotlin code
        compile_cmd = ['kotlinc', config.file_path, '-d', 'out.jar']
        await self._run_command(compile_cmd)
        
        # Run compiled code
        run_cmd = ['kotlin', '-cp', 'out.jar', 'MainKt']
        return await self._run_command(run_cmd)
```

2. Register the runner in `executor/__init__.py`:

```python
self.language_runners['kotlin'] = KotlinRunner()
```

3. Add syntax highlighting rules in `static/js/syntax_highlighter.js`:

```javascript
const kotlinRules = {
    keywords: /\b(fun|val|var|class|object|if|else|when|for|while)\b/g,
    strings: /"([^"\\]|\\.)*"/g,
    comments: /\/\/.*|\/\*[\s\S]*?\*\//g
};
```

### Adding a New Component

1. Create component directory structure:

```bash
mkdir -p grace_ide/components/new_component
touch grace_ide/components/new_component/__init__.py
```

2. Implement the component:

```python
# grace_ide/components/new_component/core.py
class NewComponent:
    def __init__(self, workspace_root: str):
        self.workspace_root = Path(workspace_root)
        
    async def start(self):
        """Initialize component"""
        pass
        
    async def stop(self):
        """Cleanup component"""
        pass
```

3. Add WebSocket handlers:

```python
# grace_ide/components/new_component/handlers.py
async def handle_new_component_request(websocket, message):
    action = message.get('action')
    
    if action == 'do_something':
        result = await component.do_something()
        await websocket.send(json.dumps({
            'type': 'new_component_result',
            'result': result
        }))
```

4. Register in main WebSocket server:

```python
# grace_ide/api/websocket.py
self.register_handler('new_component', handle_new_component_request)
```

### Adding UI Features

1. Create UI component:

```javascript
// static/js/components/NewFeature.js
class NewFeature {
    constructor(container) {
        this.container = container;
        this.init();
    }
    
    init() {
        this.render();
        this.attachEventListeners();
    }
    
    render() {
        this.container.innerHTML = `
            <div class="new-feature">
                <h2>New Feature</h2>
                <button class="btn btn--primary">Action</button>
            </div>
        `;
    }
    
    attachEventListeners() {
        this.container.querySelector('button').addEventListener('click', () => {
            this.performAction();
        });
    }
    
    async performAction() {
        const result = await graceAPI.send({
            type: 'new_component',
            action: 'do_something'
        });
        console.log(result);
    }
}
```

2. Add styles:

```css
/* css/components/new-feature.css */
.new-feature {
    padding: var(--spacing-md);
    background-color: var(--bg-secondary);
    border-radius: 8px;
}
```

---

## Testing

### Unit Tests

```python
# tests/test_file_operations.py
import pytest
from grace_ide.api.file_operations import FileOperationsManager

@pytest.mark.asyncio
async def test_read_file():
    manager = FileOperationsManager('/tmp/test')
    
    # Create test file
    await manager.create_file('test.txt', 'Hello, World!')
    
    # Read file
    result = await manager.read_file('test.txt')
    
    assert result['success'] is True
    assert result['content'] == 'Hello, World!'
```

### Integration Tests

```python
# tests/test_integration.py
@pytest.mark.asyncio
async def test_file_execution_flow():
    # Create file
    await api.create_file('script.py', 'print("Hello")')
    
    # Execute file
    result = await api.execute_code('python', 'script.py')
    
    assert result['stdout'] == 'Hello\n'
    assert result['exit_code'] == 0
```

### Frontend Tests

```javascript
// tests/test_file_manager.js
describe('FileManager', () => {
    let fileManager;
    
    beforeEach(() => {
        fileManager = new FileManager();
    });
    
    test('should read file content', async () => {
        const content = await fileManager.readFile('test.txt');
        expect(content).toBe('Test content');
    });
});
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=grace_ide

# Run specific test file
pytest tests/test_file_operations.py

# Run frontend tests
npm test
```

---

## Debugging

### Backend Debugging

1. Enable debug logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

2. Use Python debugger:

```python
import pdb; pdb.set_trace()
```

3. VS Code launch configuration:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Debug Grace_IDE Backend",
            "type": "python",
            "request": "launch",
            "module": "grace_ide.api",
            "env": {
                "DEBUG": "true"
            }
        }
    ]
}
```

### Frontend Debugging

1. Browser DevTools:
   - Use breakpoints in Sources tab
   - Monitor WebSocket messages in Network tab
   - Check console for errors

2. Debug logging:

```javascript
// Enable debug mode
window.GRACE_DEBUG = true;

// Debug logger
function debug(...args) {
    if (window.GRACE_DEBUG) {
        console.log('[Grace_IDE]', ...args);
    }
}
```

### WebSocket Debugging

Monitor WebSocket traffic:

```javascript
// Intercept WebSocket messages
const originalSend = WebSocket.prototype.send;
WebSocket.prototype.send = function(data) {
    console.log('WS Send:', data);
    originalSend.call(this, data);
};
```

---

## Contributing

### Code Style

#### Python
- Follow PEP 8
- Use type hints
- Maximum line length: 100 characters
- Use `black` for formatting:
  ```bash
  black grace_ide/
  ```

#### JavaScript
- Use ES6+ features
- Semicolons required
- 2 spaces for indentation
- Use `prettier` for formatting:
  ```bash
  npx prettier --write "static/js/**/*.js"
  ```

### Commit Messages

Follow conventional commits:

```
type(scope): subject

body

footer
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/tooling changes

Example:
```
feat(executor): add support for Rust language

- Implement RustRunner class
- Add cargo build integration
- Support both debug and release modes

Closes #123
```

### Pull Request Process

1. Fork the repository
2. Create feature branch: `git checkout -b feat/new-feature`
3. Make changes and commit
4. Write/update tests
5. Update documentation
6. Push to your fork
7. Create pull request

### Code Review Checklist

- [ ] Tests pass
- [ ] Documentation updated
- [ ] Code follows style guide
- [ ] No security vulnerabilities
- [ ] Performance impact considered
- [ ] Backward compatibility maintained

---

## Release Process

### Version Numbering

Follow Semantic Versioning (MAJOR.MINOR.PATCH):
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

### Release Steps

1. Update version:
   ```bash
   # Update version in setup.py, package.json, etc.
   ./scripts/bump_version.sh 1.2.0
   ```

2. Update changelog:
   ```bash
   # Generate changelog
   ./scripts/generate_changelog.sh > CHANGELOG.md
   ```

3. Create release branch:
   ```bash
   git checkout -b release/1.2.0
   ```

4. Run full test suite:
   ```bash
   ./scripts/run_all_tests.sh
   ```

5. Build release artifacts:
   ```bash
   ./scripts/build_release.sh
   ```

6. Tag release:
   ```bash
   git tag -a v1.2.0 -m "Release version 1.2.0"
   git push origin v1.2.0
   ```

7. Deploy:
   ```bash
   ./scripts/deploy.sh production
   ```

### Post-Release

1. Update documentation site
2. Announce on blog/social media
3. Monitor for issues
4. Plan next release

---

## Resources

### Documentation
- [API Reference](./api_reference.md)
- [Installation Guide](./installation.md)
- [User Guide](https://grace-ide.dev/docs/user-guide)

### Community
- GitHub: https://github.com/grace-ide/grace-ide
- Discord: https://discord.gg/grace-ide
- Forum: https://forum.grace-ide.dev

### Tools
- Python: https://docs.python.org/3/
- AsyncIO: https://docs.python.org/3/library/asyncio.html
- WebSockets: https://websockets.readthedocs.io/
- Node.js: https://nodejs.org/docs/

### Learning Resources
- [Building a Code Editor](https://viewsourcecode.org/snaptoken/kilo/)
- [Language Server Protocol](https://microsoft.github.io/language-server-protocol/)
- [Tree-sitter](https://tree-sitter.github.io/tree-sitter/)

---

## Troubleshooting

### Common Issues

#### WebSocket Connection Failed
```
Error: WebSocket connection to 'ws://localhost:8765' failed
```

Solution:
1. Check if backend is running
2. Verify port is not in use: `lsof -i :8765`
3. Check firewall settings

#### Module Import Errors
```
ImportError: No module named 'grace_ide'
```

Solution:
1. Ensure virtual environment is activated
2. Install package in development mode: `pip install -e .`
3. Check PYTHONPATH

#### Frontend Not Loading
```
404 Not Found: /static/js/grace_core.js
```

Solution:
1. Check file paths in index.html
2. Ensure static files are served correctly
3. Clear browser cache

### Debug Commands

```bash
# Check Python environment
python -m grace_ide.debug

# Test WebSocket connection
python -m grace_ide.test_websocket

# Verify file permissions
python -m grace_ide.check_permissions

# Run diagnostics
./scripts/diagnostics.sh
```

---

Happy coding! 🚀