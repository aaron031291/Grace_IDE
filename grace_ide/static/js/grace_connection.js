// Grace Live Connection System
class GraceConnection {
    constructor() {
        this.websocket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.connectionCallbacks = [];
        this.messageHandlers = {};
    }

    async connect(url = 'ws://localhost:8765') {
        console.log('🔗 Connecting to Grace Backend...', url);
        
        try {
            this.websocket = new WebSocket(url);
            
            this.websocket.onopen = () => {
                console.log('✅ Connected to Grace Live Backend');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.showNotification('🧠 Connected to Grace consciousness');
                this.updateConnectionStatus(true);
                
                // Notify connection callbacks
                this.connectionCallbacks.forEach(callback => callback(true));
                
                // Request initial data
                this.send({ type: 'get_system_status' });
            };
            
            this.websocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('Error parsing Grace message:', error);
                }
            };
            
            this.websocket.onclose = () => {
                console.log('🔌 Disconnected from Grace backend');
                this.isConnected = false;
                this.updateConnectionStatus(false);
                
                // Notify connection callbacks
                this.connectionCallbacks.forEach(callback => callback(false));
                
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    this.showNotification(`⚠️ Connection lost - retrying (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                    setTimeout(() => this.connect(url), 3000);
                } else {
                    this.showNotification('❌ Grace backend unavailable - using offline mode');
                }
            };
            
            this.websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.showNotification('⚠️ Connection error - Grace backend may not be running');
            };
            
        } catch (error) {
            console.log('Grace backend not available - using demo mode');
            this.showNotification('🎭 Running in demo mode - start Grace backend for live data');
            // Start demo mode
            this.startDemoMode();
        }
    }

    send(message) {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify(message));
            return true;
        }
        return false;
    }

    handleMessage(data) {
        console.log('📡 Grace message:', data.type);
        
        // Call specific handler if registered
        if (this.messageHandlers[data.type]) {
            this.messageHandlers[data.type](data);
        }
        
        // Global message handling
        switch (data.type) {
            case 'initial_status':
                this.handleInitialStatus(data.data);
                break;
            case 'system_status':
                this.handleSystemStatus(data.data);
                break;
            case 'state_update':
                this.handleStateUpdate(data);
                break;
            case 'error':
                this.showNotification(`❌ Error: ${data.message}`);
                break;
        }
    }

    onMessage(type, handler) {
        this.messageHandlers[type] = handler;
    }

    onConnection(callback) {
        this.connectionCallbacks.push(callback);
    }

    handleInitialStatus(status) {
        console.log('🎯 Initial Grace status received:', status);
        this.updateSystemMetrics(status);
        this.showNotification('🎯 Grace system data loaded');
    }

    handleSystemStatus(status) {
        this.updateSystemMetrics(status);
    }

    handleStateUpdate(data) {
        console.log('📊 State update:', data.state);
        
        // Update UI components
        if (data.state) {
            this.updateUIComponents(data.state);
        }
        
        // Trigger state change callbacks
        if (this.messageHandlers.state_change) {
            this.messageHandlers.state_change(data.state);
        }
    }

    updateSystemMetrics(metrics) {
        // Update CPU usage
        if (document.getElementById('cpuUsage')) {
            document.getElementById('cpuUsage').textContent = `${metrics.cpu || 0}%`;
        }
        
        // Update memory usage
        if (document.getElementById('memoryUsage')) {
            document.getElementById('memoryUsage').textContent = `${metrics.memory || 0}%`;
        }
        
        // Update active connections
        if (document.getElementById('activeConnections')) {
            document.getElementById('activeConnections').textContent = metrics.connections || 0;
        }
        
        // Update neural activity
        if (document.getElementById('neuralActivity')) {
            document.getElementById('neuralActivity').textContent = `${metrics.neural_activity || 0}x`;
        }
    }

    updateUIComponents(state) {
        // Update various UI elements based on state
        Object.keys(state).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (typeof state[key] === 'object') {
                    element.textContent = JSON.stringify(state[key]);
                } else {
                    element.textContent = state[key];
                }
            }
        });
    }

    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            statusElement.textContent = connected ? '🟢 Connected' : '🔴 Disconnected';
            statusElement.className = connected ? 'status-connected' : 'status-disconnected';
        }
        
        // Update connection indicator
        const indicator = document.querySelector('.connection-indicator');
        if (indicator) {
            indicator.classList.toggle('active', connected);
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `grace-notification grace-notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add to notification container or create one
        let container = document.getElementById('graceNotifications');
        if (!container) {
            container = document.createElement('div');
            container.id = 'graceNotifications';
            container.className = 'grace-notifications-container';
            document.body.appendChild(container);
        }
        
        container.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        return icons[type] || icons.info;
    }

    // Demo mode for when backend is not available
    startDemoMode() {
        console.log('🎭 Starting Grace demo mode');
        this.isConnected = false;
        
        // Simulate periodic updates
        this.demoInterval = setInterval(() => {
            const demoData = this.generateDemoData();
            this.handleMessage({
                type: 'system_status',
                data: demoData
            });
        }, 3000);
        
        // Simulate initial connection
        setTimeout(() => {
            this.showNotification('🎭 Running in demo mode - limited functionality');
            this.updateConnectionStatus(false);
            
            // Send initial demo data
            this.handleMessage({
                type: 'initial_status',
                data: this.generateDemoData()
            });
        }, 1000);
    }

    generateDemoData() {
        return {
            cpu: Math.floor(Math.random() * 40) + 20,
            memory: Math.floor(Math.random() * 30) + 40,
            connections: Math.floor(Math.random() * 10) + 5,
            neural_activity: (Math.random() * 2 + 1).toFixed(1),
            timestamp: new Date().toISOString(),
            modules: {
                consciousness: 'active',
                memory: 'operational',
                learning: 'enabled',
                creativity: 'enhanced'
            }
        };
    }

    // API Methods for Grace operations
    async executeCommand(command, params = {}) {
        if (!this.isConnected) {
            this.showNotification('⚠️ Not connected to Grace backend', 'warning');
            return { success: false, error: 'Not connected' };
        }
        
        const message = {
            type: 'execute_command',
            command: command,
            params: params,
            timestamp: new Date().toISOString()
        };
        
        if (this.send(message)) {
            this.showNotification(`📡 Command sent: ${command}`, 'info');
            return { success: true, message: 'Command sent' };
        } else {
            return { success: false, error: 'Failed to send command' };
        }
    }

    async queryGrace(query) {
        return this.executeCommand('query', { query: query });
    }

    async updateConfiguration(config) {
        return this.executeCommand('update_config', { config: config });
    }

    async getSystemHealth() {
        return this.executeCommand('get_health');
    }

    async startLearningMode() {
        return this.executeCommand('start_learning');
    }

    async stopLearningMode() {
        return this.executeCommand('stop_learning');
    }

    // File operations integration
    async processFile(filePath, operation) {
        return this.executeCommand('process_file', {
            file_path: filePath,
            operation: operation
        });
    }

    // Cleanup
    disconnect() {
        if (this.websocket) {
            this.websocket.close();
        }
        
        if (this.demoInterval) {
            clearInterval(this.demoInterval);
        }
        
        this.isConnected = false;
        this.updateConnectionStatus(false);
        this.showNotification('👋 Disconnected from Grace', 'info');
    }
}

// Grace Connection Styles
const graceConnectionStyles = `
<style>
.grace-notifications-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.grace-notification {
    background: #1a1b2e;
    border: 1px solid #3a3b4e;
    border-radius: 8px;
    padding: 12px 16px;
    min-width: 300px;
    animation: slideIn 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.grace-notification-success {
    border-color: #00ff88;
    background: rgba(0, 255, 136, 0.1);
}

.grace-notification-warning {
    border-color: #ff8c00;
    background: rgba(255, 140, 0, 0.1);
}

.grace-notification-error {
    border-color: #ff4444;
    background: rgba(255, 68, 68, 0.1);
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #ffffff;
    font-size: 14px;
}

.notification-icon {
    font-size: 18px;
}

.notification-message {
    flex: 1;
}

.notification-close {
    background: none;
    border: none;
    color: #a0a8b7;
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s ease;
}

.notification-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
}

.connection-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ff4444;
    transition: all 0.3s ease;
}

.connection-indicator.active {
    background: #00ff88;
    box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
    animation: pulse 2s infinite;
}

.status-connected {
    color: #00ff88;
}

.status-disconnected {
    color: #ff4444;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes fadeOut {
    from {
        opacity: 1;
    }
    to {
        opacity: 0;
    }
}

@keyframes pulse {
    0%, 100% {
        transform: scale(1);
        opacity: 1;
    }
    50% {
        transform: scale(1.2);
        opacity: 0.8;
    }
}
</style>
`;

// Auto-inject styles when script loads
if (typeof document !== 'undefined') {
    const styleElement = document.createElement('div');
    styleElement.innerHTML = graceConnectionStyles;
    document.head.appendChild(styleElement.firstElementChild);
}

// Create global Grace connection instance
let graceConnection = null;

// Initialize Grace connection when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        // Auto-connect to Grace backend
        graceConnection = new GraceConnection();
        
        // Check for custom WebSocket URL
        const wsUrl = window.GRACE_WS_URL || 'ws://localhost:8765';
        
        // Attempt connection
        graceConnection.connect(wsUrl);
        
        // Make connection available globally
        window.graceConnection = graceConnection;
        
        console.log('🧠 Grace Connection initialized');
    });
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GraceConnection;
}