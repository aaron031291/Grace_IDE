# Grace_IDE Installation Guide

## Table of Contents

- [System Requirements](#system-requirements)
- [Quick Install](#quick-install)
- [Detailed Installation](#detailed-installation)
  - [macOS](#macos-installation)
  - [Linux](#linux-installation)
  - [Windows](#windows-installation)
  - [Docker](#docker-installation)
- [Configuration](#configuration)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Upgrading](#upgrading)
- [Uninstallation](#uninstallation)

---

## System Requirements

### Minimum Requirements

- **Operating System**: Windows 10+, macOS 10.15+, Linux (Ubuntu 18.04+, Debian 10+, Fedora 32+)
- **CPU**: Dual-core processor (2 GHz+)
- **RAM**: 4 GB
- **Storage**: 2 GB available space
- **Display**: 1280x720 resolution
- **Network**: Internet connection for package installation

### Recommended Requirements

- **CPU**: Quad-core processor (3 GHz+)
- **RAM**: 8 GB or more
- **Storage**: 10 GB available space (for projects and dependencies)
- **Display**: 1920x1080 resolution or higher

### Software Dependencies

- **Python**: 3.8 or higher
- **Node.js**: 16.0 or higher
- **Git**: 2.25 or higher
- **pip**: Latest version
- **npm**: 7.0 or higher

### Optional Dependencies

- **Docker**: 20.10+ (for containerized deployments)
- **Redis**: 6.0+ (for enhanced caching)
- **PostgreSQL**: 13+ (for persistent storage)

---

## Quick Install

### One-Line Install (Unix-like systems)

```bash
curl -fsSL https://grace-ide.dev/install.sh | bash
```

### Manual Quick Install

```bash
# Clone repository
git clone https://github.com/grace-ide/grace-ide.git
cd grace-ide

# Run setup script
./setup.sh

# Start Grace_IDE
./grace-ide
```

---

## Detailed Installation

## macOS Installation

### 1. Install Homebrew (if not installed)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Install System Dependencies

```bash
# Install Python 3.9
brew install python@3.9

# Install Node.js and npm
brew install node

# Install Git
brew install git

# Optional: Install Docker
brew install --cask docker
```

### 3. Clone Grace_IDE

```bash
# Create installation directory
mkdir -p ~/Applications/grace-ide
cd ~/Applications/grace-ide

# Clone repository
git clone https://github.com/grace-ide/grace-ide.git .
```

### 4. Set Up Python Environment

```bash
# Create virtual environment
python3.9 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install Python dependencies
pip install -r requirements.txt
```

### 5. Set Up Node.js Environment

```bash
# Navigate to static directory
cd grace_ide/static

# Install Node dependencies
npm install

# Build frontend assets
npm run build

# Return to root directory
cd ../..
```

### 6. Initialize Grace_IDE

```bash
# Make setup script executable
chmod +x setup.sh

# Run setup
./setup.sh

# Create desktop shortcut (optional)
cp scripts/Grace_IDE.app ~/Desktop/
```

### 7. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit configuration (use your preferred editor)
nano .env
```

---

## Linux Installation

### Ubuntu/Debian

#### 1. Update System

```bash
sudo apt update && sudo apt upgrade -y
```

#### 2. Install System Dependencies

```bash
# Install Python and pip
sudo apt install -y python3.9 python3.9-venv python3.9-dev python3-pip

# Install Node.js (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# Install Git and build tools
sudo apt install -y git build-essential

# Optional: Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

#### 3. Install Grace_IDE

```bash
# Clone repository
cd ~
git clone https://github.com/grace-ide/grace-ide.git
cd grace-ide

# Set up Python environment
python3.9 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Set up Node.js environment
cd grace_ide/static
npm install
npm run build
cd ../..
```

#### 4. Create System Service (Optional)

```bash
# Create systemd service file
sudo tee /etc/systemd/system/grace-ide.service > /dev/null <<EOF
[Unit]
Description=Grace IDE
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$HOME/grace-ide
Environment="PATH=$HOME/grace-ide/venv/bin:/usr/local/bin:/usr/bin:/bin"
ExecStart=$HOME/grace-ide/venv/bin/python -m grace_ide.api
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl enable grace-ide
sudo systemctl start grace-ide
```

#### 5. Create Desktop Entry

```bash
# Create desktop file
cat > ~/.local/share/applications/grace-ide.desktop <<EOF
[Desktop Entry]
Name=Grace IDE
Comment=Intelligent Development Environment
Exec=$HOME/grace-ide/grace-ide
Icon=$HOME/grace-ide/grace_ide/assets/icons/grace-ide.png
Terminal=false
Type=Application
Categories=Development;IDE;
EOF

# Update desktop database
update-desktop-database ~/.local/share/applications/
```

### Fedora/RHEL/CentOS

#### 1. Install Dependencies

```bash
# Enable EPEL repository (RHEL/CentOS)
sudo dnf install -y epel-release

# Install Python
sudo dnf install -y python39 python39-devel python39-pip

# Install Node.js
sudo dnf install -y nodejs npm

# Install development tools
sudo dnf groupinstall -y "Development Tools"
sudo dnf install -y git
```

#### 2. Follow Ubuntu steps 3-5

### Arch Linux

#### 1. Install Dependencies

```bash
# Update system
sudo pacman -Syu

# Install required packages
sudo pacman -S python python-pip nodejs npm git base-devel

# Optional: Install Docker
sudo pacman -S docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

#### 2. Install from AUR (Alternative)

```bash
# Using yay
yay -S grace-ide-git

# Or using manual build
git clone https://aur.archlinux.org/grace-ide-git.git
cd grace-ide-git
makepkg -si
```

---

## Windows Installation

### Option 1: Windows Installer

1. Download the installer from [grace-ide.dev/download](https://grace-ide.dev/download)
2. Run `GraceIDE-Setup-x64.exe`
3. Follow the installation wizard
4. Launch Grace_IDE from Start Menu

### Option 2: Manual Installation

#### 1. Install Prerequisites

##### Python
1. Download Python 3.9+ from [python.org](https://python.org)
2. During installation, check "Add Python to PATH"
3. Install for all users (recommended)

##### Node.js
1. Download Node.js from [nodejs.org](https://nodejs.org)
2. Run the installer
3. Verify installation: `node --version`

##### Git
1. Download Git from [git-scm.com](https://git-scm.com)
2. Install with default settings
3. Choose "Git from the command line and also from 3rd-party software"

#### 2. Install Grace_IDE

Open PowerShell as Administrator:

```powershell
# Create installation directory
New-Item -ItemType Directory -Path "C:\Program Files\GraceIDE" -Force
Set-Location "C:\Program Files\GraceIDE"

# Clone repository
git clone https://github.com/grace-ide/grace-ide.git .

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Install Node dependencies
Set-Location grace_ide\static
npm install
npm run build
Set-Location ..\..
```

#### 3. Create Start Menu Shortcut

```powershell
# Create shortcut
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Grace IDE.lnk")
$Shortcut.TargetPath = "C:\Program Files\GraceIDE\grace-ide.bat"
$Shortcut.IconLocation = "C:\Program Files\GraceIDE\grace_ide\assets\icons\grace-ide.ico"
$Shortcut.Save()
```

#### 4. Configure Windows Firewall

```powershell
# Allow Grace_IDE through firewall
New-NetFirewallRule -DisplayName "Grace IDE" -Direction Inbound -Program "C:\Program Files\GraceIDE\venv\Scripts\python.exe" -Action Allow
```

### Option 3: WSL Installation

For Windows users preferring a Linux environment:

```bash
# In WSL terminal
# Follow Linux installation instructions
```

---

## Docker Installation

### 1. Using Docker Compose (Recommended)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  grace-ide:
    image: graceide/grace-ide:latest
    ports:
      - "8080:8080"
      - "8765:8765"
    volumes:
      - ./workspace:/workspace
      - grace-data:/data
    environment:
      - GRACE_WORKSPACE=/workspace
      - GRACE_PORT=8080
      - GRACE_API_PORT=8765
    restart: unless-stopped

volumes:
  grace-data:
```

Run:
```bash
docker-compose up -d
```

### 2. Using Docker CLI

```bash
# Pull image
docker pull graceide/grace-ide:latest

# Run container
docker run -d \
  --name grace-ide \
  -p 8080:8080 \
  -p 8765:8765 \
  -v $(pwd)/workspace:/workspace \
  -v grace-data:/data \
  -e GRACE_WORKSPACE=/workspace \
  graceide/grace-ide:latest
```

### 3. Building from Source

```bash
# Clone repository
git clone https://github.com/grace-ide/grace-ide.git
cd grace-ide

# Build image
docker build -t grace-ide:local .

# Run container
docker run -d \
  --name grace-ide \
  -p 8080:8080 \
  -p 8765:8765 \
  -v $(pwd)/workspace:/workspace \
  grace-ide:local
```

---

## Configuration

### Basic Configuration

Edit `.env` file in the installation directory:

```bash
# Server Configuration
HOST=0.0.0.0
PORT=8080
API_PORT=8765

# Security
SECRET_KEY=your-secret-key-here
ENABLE_HTTPS=false
SSL_CERT_PATH=
SSL_KEY_PATH=

# Features
ENABLE_AI_FEATURES=true
ENABLE_COLLABORATION=true
ENABLE_CLOUD_SYNC=false

# Resource Limits
MAX_FILE_SIZE=10485760  # 10MB
MAX_WORKSPACE_SIZE=1073741824  # 1GB
EXECUTION_TIMEOUT=30  # seconds
MEMORY_LIMIT=512  # MB per execution

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/grace-ide.log

# Database (optional)
DATABASE_URL=sqlite:///data/grace-ide.db
# DATABASE_URL=postgresql://user:pass@localhost/graceide

# Cache (optional)
REDIS_URL=redis://localhost:6379/0
```

### Advanced Configuration

Create `config/settings.yml`:

```yaml
# Grace_IDE Advanced Configuration

server:
  host: 0.0.0.0
  port: 8080
  workers: 4
  ssl:
    enabled: false
    cert: /path/to/cert.pem
    key: /path/to/key.pem

api:
  port: 8765
  cors:
    enabled: true
    origins:
      - http://localhost:*
      - https://localhost:*
  rate_limit:
    enabled: true
    requests_per_minute: 1000

features:
  ai:
    enabled: true
    model: gpt-4
    api_key: ${AI_API_KEY}
  
  collaboration:
    enabled: true
    max_users_per_session: 10
    
  security:
    enabled: true
    scan_on_save: true
    quarantine_threats: true

storage:
  type: local  # local, s3, azure
  path: ./data
  
  # S3 configuration (if type=s3)
  s3:
    bucket: grace-ide-storage
    region: us-east-1
    access_key: ${AWS_ACCESS_KEY}
    secret_key: ${AWS_SECRET_KEY}

executors:
  python:
    enabled: true
    versions: [3.8, 3.9, 3.10, 3.11]
    default: 3.9
  
  javascript:
    enabled: true
    runtime: node  # node, deno, bun
    version: 16
    
  docker:
    enabled: false
    socket: /var/run/docker.sock

plugins:
  directory: ./plugins
  auto_load: true
  allowed:
    - git-integration
    - database-browser
    - api-tester
```

### User Preferences

Create `~/.grace-ide/preferences.json`:

```json
{
  "editor": {
    "theme": "dark",
    "fontSize": 14,
    "fontFamily": "JetBrains Mono",
    "tabSize": 4,
    "insertSpaces": true,
    "wordWrap": "on",
    "minimap": true,
    "lineNumbers": true,
    "formatOnSave": true
  },
  "terminal": {
    "shell": "default",
    "fontSize": 13,
    "cursorStyle": "block"
  },
  "ai": {
    "enableSuggestions": true,
    "enableAutoComplete": true,
    "suggestionDelay": 300
  },
  "keymap": "default",  // default, vim, emacs
  "locale": "en-US"
}
```

---

## Verification

### 1. Check Installation

```bash
# Check Python installation
python --version
pip list | grep grace-ide

# Check Node.js installation
node --version
npm list

# Check Grace_IDE installation
grace-ide --version
```

### 2. Run Diagnostic Tests

```bash
# Run built-in diagnostics
grace-ide diagnose

# Expected output:
# ✓ Python version: 3.9.10
# ✓ Node.js version: 16.14.0
# ✓ WebSocket server: Ready
# ✓ File system access: OK
# ✓ Network connectivity: OK
# ✓ Required packages: Installed
```

### 3. Test Basic Functionality

```bash
# Start Grace_IDE
grace-ide

# Or with specific workspace
grace-ide --workspace ~/projects/my-project

# Test API directly
curl http://localhost:8765/health
```

### 4. Browser Check

Open your browser and navigate to:
- Main UI: http://localhost:8080
- API Health: http://localhost:8765/health
- WebSocket Test: http://localhost:8080/test

---

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
Error: Address already in use (0.0.0.0:8080)
```

**Solution:**
```bash
# Find process using port
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Change port in .env file
PORT=8081
```

#### Python Module Not Found

```bash
ModuleNotFoundError: No module named 'grace_ide'
```

**Solution:**
```bash
# Ensure virtual environment is activated
source venv/bin/activate  # Unix
.\venv\Scripts\Activate  # Windows

# Reinstall dependencies
pip install -r requirements.txt

# Install in development mode
pip install -e .
```

#### WebSocket Connection Failed

```
WebSocket connection to 'ws://localhost:8765' failed
```

**Solution:**
1. Check if API server is running
2. Verify firewall settings
3. Check browser console for CORS issues
4. Try different browser

#### Permission Denied

```bash
Permission denied: '/usr/local/grace-ide'
```

**Solution:**
```bash
# Fix permissions
sudo chown -R $USER:$USER /usr/local/grace-ide

# Or reinstall in user directory
cd ~
git clone https://github.com/grace-ide/grace-ide.git
```

### Platform-Specific Issues

#### macOS: SSL Certificate Error

```bash
# Install certificates
pip install --upgrade certifi
```

#### Linux: Missing System Libraries

```bash
# Ubuntu/Debian
sudo apt install -y python3-dev libffi-dev libssl-dev

# Fedora
sudo dnf install -y python3-devel libffi-devel openssl-devel
```

#### Windows: Long Path Support

Enable long path support in Windows:
```powershell
# Run as Administrator
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

### Getting Help

1. Check logs:
   ```bash
   tail -f logs/grace-ide.log
   ```

2. Run in debug mode:
   ```bash
   grace-ide --debug
   ```

3. Join community:
   - Discord: https://discord.gg/grace-ide
   - Forum: https://forum.grace-ide.dev
   - GitHub Issues: https://github.com/grace-ide/grace-ide/issues

---

## Upgrading

### Automatic Update

```bash
# Check for updates
grace-ide --check-update

# Update to latest version
grace-ide --update
```

### Manual Update

```bash
# Navigate to installation directory
cd /path/to/grace-ide

# Backup current installation
cp -r . ../grace-ide-backup

# Pull latest changes
git pull origin main

# Update dependencies
source venv/bin/activate
pip install -r requirements.txt --upgrade

cd grace_ide/static
npm update
npm run build
```

### Migration

When upgrading between major versions:

```bash
# Backup data
grace-ide backup --output ~/grace-ide-backup.tar.gz

# Perform upgrade
grace-ide --update

# Run migration
grace-ide migrate

# Restore settings if needed
grace-ide restore --input ~/grace-ide-backup.tar.gz
```

---

## Uninstallation

### Clean Uninstall

#### macOS/Linux

```bash
# Run uninstall script
cd /path/to/grace-ide
./uninstall.sh

# Or manually:
# Stop service
systemctl stop grace-ide  # If using systemd

# Remove files
rm -rf /path/to/grace-ide
rm -rf ~/.grace-ide
rm -f ~/.local/share/applications/grace-ide.desktop

# Remove from PATH
# Edit ~/.bashrc or ~/.zshrc and remove Grace_IDE entries
```

#### Windows

1. Use "Add or Remove Programs" if installed via installer
2. Or manually:
   ```powershell
   # Stop service
   Stop-Service grace-ide
   
   # Remove files
   Remove-Item -Recurse -Force "C:\Program Files\GraceIDE"
   Remove-Item -Recurse -Force "$env:APPDATA\grace-ide"
   
   # Remove shortcuts
   Remove-Item "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Grace IDE.lnk"
   ```

### Docker Cleanup

```bash
# Stop and remove container
docker stop grace-ide
docker rm grace-ide

# Remove image
docker rmi graceide/grace-ide:latest

# Remove volumes (warning: deletes data)
docker volume rm grace-data
```

---

## Next Steps

1. **Read the Documentation**:
   - [User Guide](https://grace-ide.dev/docs/user-guide)
   - [API Reference](./api_reference.md)
   - [Development Guide](./development.md)

2. **Configure Your Environment**:
   - Set up your preferred theme
   - Configure keyboard shortcuts
   - Install recommended extensions

3. **Start Coding**:
   - Create a new project: `File → New Project`
   - Open existing project: `File → Open Folder`
   - Use Command Palette: `Ctrl/Cmd + Shift + P`

4. **Join the Community**:
   - Share feedback
   - Report issues
   - Contribute to development

---

**Happy Coding with Grace_IDE! 🚀**