#!/bin/bash

# Grace IDE Setup Script
# Automated setup for Grace IDE development environment

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ASCII Art Banner
print_banner() {
    echo -e "${PURPLE}"
    cat << "EOF"
     ____                       ___ ____  _____ 
    / ___|_ __ __ _  ___ ___  |_ _|  _ \| ____|
   | |  _| '__/ _` |/ __/ _ \  | || | | |  _|  
   | |_| | | | (_| | (_|  __/  | || |_| | |___ 
    \____|_|  \__,_|\___\___| |___|____/|_____|
                                                
    Grace Consciousness IDE - Setup Script v1.0
EOF
    echo -e "${NC}"
}

# Print colored messages
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Detect OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        DISTRO=$(lsb_release -si 2>/dev/null || echo "Unknown")
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        OS="windows"
    else
        OS="unknown"
    fi
}

# Check system requirements
check_requirements() {
    print_info "Checking system requirements..."
    
    local missing_deps=()
    
    # Check for required commands
    if ! command_exists node; then
        missing_deps+=("Node.js")
    else
        NODE_VERSION=$(node -v | sed 's/v//')
        print_success "Node.js ${NODE_VERSION} found"
    fi
    
    if ! command_exists npm; then
        missing_deps+=("npm")
    else
        NPM_VERSION=$(npm -v)
        print_success "npm ${NPM_VERSION} found"
    fi
    
    if ! command_exists python3; then
        missing_deps+=("Python 3")
    else
        PYTHON_VERSION=$(python3 --version | sed 's/Python //')
        print_success "Python ${PYTHON_VERSION} found"
    fi
    
    if ! command_exists pip3; then
        missing_deps+=("pip3")
    else
        PIP_VERSION=$(pip3 --version | awk '{print $2}')
        print_success "pip3 ${PIP_VERSION} found"
    fi
    
    if ! command_exists git; then
        missing_deps+=("Git")
    else
        GIT_VERSION=$(git --version | awk '{print $3}')
        print_success "Git ${GIT_VERSION} found"
    fi
    
    # Check if any dependencies are missing
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        print_info "Please install the missing dependencies before continuing."
        
        # Provide installation instructions based on OS
        if [[ "$OS" == "macos" ]]; then
            print_info "On macOS, you can use Homebrew:"
            echo "  brew install node python git"
        elif [[ "$OS" == "linux" ]]; then
            print_info "On Linux, you can use your package manager:"
            echo "  sudo apt-get install nodejs npm python3 python3-pip git  # Debian/Ubuntu"
            echo "  sudo dnf install nodejs npm python3 python3-pip git      # Fedora"
            echo "  sudo pacman -S nodejs npm python python-pip git          # Arch"
        fi
        
        exit 1
    fi
    
    print_success "All system requirements met!"
}

# Create directory structure
create_directories() {
    print_info "Creating directory structure..."
    
    # Main directories
    mkdir -p {api,components,screenshots,static/{js,css,img},templates,utils}
    mkdir -p data/{cache,logs,temp}
    mkdir -p docs/{api,guides,examples}
    mkdir -p tests/{unit,integration,e2e}
    
    # Create subdirectories
    mkdir -p api/{routes,middleware,services}
    mkdir -p components/{core,ui,modules}
    mkdir -p utils/{helpers,validators}
    
    print_success "Directory structure created"
}

# Create configuration files
create_config_files() {
    print_info "Creating configuration files..."
    
    # Create .env file
    if [ ! -f .env ]; then
        cat > .env << EOF
# Grace IDE Environment Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# API Configuration
API_URL=http://localhost:3000/api
WS_URL=ws://localhost:8765

# Database (if needed)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grace_ide
DB_USER=grace
DB_PASSWORD=

# Security
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# Grace AI Configuration
GRACE_MODEL_PATH=./models/grace
GRACE_CONSCIOUSNESS_LEVEL=1
GRACE_LEARNING_RATE=0.1

# Feature Flags
ENABLE_AI=true
ENABLE_COLLABORATION=false
ENABLE_CLOUD_SYNC=false

# Logging
LOG_LEVEL=info
LOG_FILE=./data/logs/grace.log
EOF
        print_success "Created .env file"
    else
        print_warning ".env file already exists, skipping..."
    fi
    
    # Create .gitignore
    if [ ! -f .gitignore ]; then
        cat > .gitignore << EOF
# Dependencies
node_modules/
__pycache__/
*.py[cod]
*$py.class

# Environment
.env
.env.local
.env.*.local
venv/
env/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Cache
.cache/
.npm/
.eslintcache
data/cache/
data/temp/

# Build
dist/
build/
*.egg-info/

# Testing
coverage/
.nyc_output/
.coverage
htmlcov/

# Production
*.min.js
*.min.css

# Grace specific
data/logs/*
!data/logs/.gitkeep
data/cache/*
!data/cache/.gitkeep
data/temp/*
!data/temp/.gitkeep
models/*
!models/.gitkeep
EOF
        print_success "Created .gitignore file"
    else
        print_warning ".gitignore file already exists, skipping..."
    fi
    
    # Create package.json
    if [ ! -f package.json ]; then
        cat > package.json << EOF
{
  "name": "grace-ide",
  "version": "1.0.0",
  "description": "Grace Consciousness IDE - An AI-powered development environment",
  "main": "api/server.js",
  "scripts": {
    "start": "node api/server.js",
    "dev": "nodemon api/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint . --ext .js,.jsx",
    "lint:fix": "eslint . --ext .js,.jsx --fix",
    "build": "npm run build:css && npm run build:js",
    "build:css": "postcss static/css/style.css -o static/css/style.min.css",
    "build:js": "webpack --mode production",
    "setup": "npm install && pip3 install -r requirements.txt",
    "grace:start": "python3 grace_ai.py",
    "grace:train": "python3 train_model.py"
  },
  "keywords": [
    "ide",
    "ai",
    "consciousness",
    "development",
    "grace"
  ],
  "author": "Grace AI Team",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "ws": "^8.13.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "compression": "^1.7.4",
    "body-parser": "^1.20.2",
    "dotenv": "^16.0.3",
    "winston": "^3.8.2",
    "joi": "^17.9.2",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "uuid": "^9.0.0",
    "multer": "^1.4.5-lts.1",
    "socket.io": "^4.6.1",
    "isomorphic-git": "^1.24.0",
    "@isomorphic-git/lightning-fs": "^4.6.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.22",
    "jest": "^29.5.0",
    "eslint": "^8.42.0",
    "prettier": "^2.8.8",
    "webpack": "^5.88.0",
    "webpack-cli": "^5.1.4",
    "postcss": "^8.4.24",
    "postcss-cli": "^10.1.0",
    "autoprefixer": "^10.4.14",
    "cssnano": "^6.0.1",
    "@babel/core": "^7.22.5",
    "@babel/preset-env": "^7.22.5",
    "babel-loader": "^9.1.2"
  },
  "engines": {
    "node": ">=14.0.0",
    "npm": ">=6.0.0"
  }
}
EOF
        print_success "Created package.json"
    else
        print_warning "package.json already exists, skipping..."
    fi
    
    # Create requirements.txt for Python dependencies
    if [ ! -f requirements.txt ]; then
        cat > requirements.txt << EOF
# Grace AI Core Dependencies
numpy>=1.24.0
pandas>=2.0.0
scikit-learn>=1.2.0
tensorflow>=2.12.0
torch>=2.0.0
transformers>=4.30.0

# Web Framework
flask>=2.3.0
flask-cors>=4.0.0
flask-socketio>=5.3.0

# Database
sqlalchemy>=2.0.0
redis>=4.5.0

# Utilities
python-dotenv>=1.0.0
pyyaml>=6.0
requests>=2.31.0
aiohttp>=3.8.0
asyncio>=3.4.3

# Development
pytest>=7.3.0
black>=23.3.0
flake8>=6.0.0
mypy>=1.3.0

# AI/ML Tools
openai>=0.27.0
langchain>=0.0.200
chromadb>=0.3.26
sentence-transformers>=2.2.2

# Data Processing
beautifulsoup4>=4.12.0
lxml>=4.9.0
pillow>=9.5.0

# Monitoring
prometheus-client>=0.17.0
psutil>=5.9.0
EOF
        print_success "Created requirements.txt"
    else
        print_warning "requirements.txt already exists, skipping..."
    fi
    
    # Create .gitkeep files
    touch data/logs/.gitkeep
    touch data/cache/.gitkeep
    touch data/temp/.gitkeep
    touch models/.gitkeep
    
    print_success "Configuration files created"
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    
    # Install Node.js dependencies
    print_info "Installing Node.js dependencies..."
    npm install
    
    # Install Python dependencies
    print_info "Installing Python dependencies..."
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        print_info "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment and install dependencies
    if [[ "$OS" == "windows" ]]; then
        source venv/Scripts/activate
    else
        source venv/bin/activate
    fi
    
    pip3 install --upgrade pip
    pip3 install -r requirements.txt
    
    print_success "Dependencies installed"
}

# Create initial server file
create_server_file() {
    if [ ! -f api/server.js ]; then
        print_info "Creating server.js..."
        
        cat > api/server.js << 'EOF'
// Grace IDE Server
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, '../static')));

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received:', data);
            
            // Echo back for now
            ws.send(JSON.stringify({
                type: 'response',
                data: data,
                timestamp: new Date().toISOString()
            }));
        } catch (error) {
            console.error('WebSocket message error:', error);
        }
    });
    
    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });
});

// API Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
    });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../templates/index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

server.listen(PORT, HOST, () => {
    console.log(`
    🧠 Grace IDE Server Started
    ========================
    Server: http://${HOST}:${PORT}
    WebSocket: ws://${HOST}:${PORT}
    Environment: ${process.env.NODE_ENV || 'development'}
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});
EOF
        
        print_success "Created server.js"
    else
        print_warning "server.js already exists, skipping..."
    fi
}

# Create index.html
create_index_html() {
    if [ ! -f templates/index.html ]; then
        print_info "Creating index.html..."
        
        cat > templates/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Grace IDE - Consciousness Development Environment</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <div id="grace-root"></div>
    
    <!-- Core Scripts -->
    <script src="/js/grace_core.js"></script>
    <script src="/js/grace_connection.js"></script>
    <script src="/js/grace_interface.js"></script>
    <script src="/js/file_operations.js"></script>
    <script src="/js/syntax_highlighter.js"></script>
    <script src="/js/utils/file_manager.js"></script>
    <script src="/js/git_interface.js"></script>
    
    <!-- Initialize Grace -->
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🧠 Initializing Grace IDE...');
            
            // Grace will auto-initialize from the loaded scripts
            // The interface will be created in the #grace-root element
        });
    </script>
</body>
</html>
EOF
        
        print_success "Created index.html"
    else
        print_warning "index.html already exists, skipping..."
    fi
}

# Create basic CSS file
create_css_file() {
    if [ ! -f static/css/style.css ]; then
        print_info "Creating style.css..."
        
        cat > static/css/style.css << 'EOF'
/* Grace IDE Core Styles */
:root {
    --grace-primary: #0a0b1e;
    --grace-secondary: #1a1b2e;
    --grace-tertiary: #2a2b3e;
    --grace-accent: #00d4ff;
    --grace-accent-alt: #00ff88;
    --grace-warning: #ff8c00;
    --grace-error: #ff4444;
    --grace-success: #00ff88;
    --grace-text: #ffffff;
    --grace-text-secondary: #a0a8b7;
    --grace-border: #3a3b4e;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--grace-primary);
    color: var(--grace-text);
    overflow: hidden;
}

#grace-root {
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Loading animation */
.grace-loading {
    text-align: center;
}

.grace-loading-icon {
    font-size: 64px;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
}

.grace-loading-text {
    margin-top: 20px;
    font-size: 18px;
    color: var(--grace-text-secondary);
}
EOF
        
        print_success "Created style.css"
    else
        print_warning "style.css already exists, skipping..."
    fi
}

# Create README
create_readme() {
    if [ ! -f README.md ]; then
        print_info "Creating README.md..."
        
        cat > README.md << 'EOF'
# Grace IDE - Consciousness Development Environment

🧠 An AI-powered Integrated Development Environment with consciousness-like capabilities.

## Features

- **AI-Powered Intelligence**: Grace learns from your coding patterns and provides intelligent suggestions
- **Multi-Language Support**: Syntax highlighting and code completion for various programming languages
- **Integrated Git**: Full Git integration with visual diff and merge tools
- **Real-time Collaboration**: Work with team members in real-time (coming soon)
- **Extensible Architecture**: Plugin system for custom extensions
- **Beautiful UI**: Modern, responsive interface with multiple themes

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/grace-ide.git
   cd grace-ide
   ```

2. Run the setup script:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Development

### Prerequisites

- Node.js >= 14.0.0
- Python >= 3.8
- Git

### Project Structure

```
grace-ide/
├── api/              # Backend API
├── components/       # UI components
├── static/          # Static assets
│   ├── js/         # JavaScript files
│   ├── css/        # Stylesheets
│   └── img/        # Images
├── templates/       # HTML templates
├── utils/          # Utility functions
├── data/           # Data storage
├── docs/           # Documentation
└── tests/          # Test files
```

### Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with hot reload
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run build` - Build for production

## Configuration

Configuration is handled through environment variables. Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Grace AI team for the consciousness engine
- All contributors who have helped shape this project

---

Made with 🧠 by the Grace team
EOF
        
        print_success "Created README.md"
    else
        print_warning "README.md already exists, skipping..."
    fi
}

# Setup Git repository
setup_git() {
    print_info "Setting up Git repository..."
    
    if [ ! -d .git ]; then
        git init
        git add .
        git commit -m "Initial commit: Grace IDE setup"
        print_success "Git repository initialized"
    else
        print_warning "Git repository already exists"
    fi
}

# Run setup
main() {
    print_banner
    
    # Detect operating system
    detect_os
    print_info "Detected OS: $OS"
    
    # Check requirements
    check_requirements
    
    # Create directory structure
    create_directories
    
    # Create configuration files
    create_config_files
    
    # Create server file
    create_server_file
    
    # Create HTML template
    create_index_html
    
    # Create CSS file
    create_css_file
    
    # Create README
    create_readme
    
    # Install dependencies
    read -p "Do you want to install dependencies now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_dependencies
    else
        print_warning "Skipping dependency installation. Run 'npm install' and 'pip install -r requirements.txt' manually."
    fi
    
    # Setup Git
    read -p "Do you want to initialize a Git repository? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_git
    fi
    
    # Final message
    echo
    print_success "Grace IDE setup completed successfully! 🎉"
    echo
    echo -e "${CYAN}Next steps:${NC}"
    echo "1. Review and update the .env file with your configuration"
    echo "2. Start the development server: npm run dev"
    echo "3. Open http://localhost:3000 in your browser"
    echo
    echo -e "${PURPLE}Happy coding with Grace! 🧠${NC}"
}

# Run main function
main "$@"