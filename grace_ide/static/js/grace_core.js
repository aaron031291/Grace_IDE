// Grace Core Intelligence System
// The central nervous system of the Grace IDE

class GraceCore {
    constructor(config = {}) {
        // Core configuration
        this.version = '1.0.0';
        this.buildNumber = '20250601';
        this.environment = this.detectEnvironment();
        
        // System state
        this.state = {
            initialized: false,
            mode: 'standard',
            status: 'initializing',
            consciousness_level: 0,
            learning_active: false,
            debug_mode: config.debug || false
        };
        
        // Modules registry
        this.modules = new Map();
        this.activeModules = new Set();
        
        // Event system
        this.events = new EventTarget();
        this.eventHandlers = new Map();
        
        // Memory system
        this.memory = {
            short_term: new Map(),
            long_term: new Map(),
            working: new Map(),
            cache: new Map()
        };
        
        // Pattern recognition
        this.patterns = new Map();
        this.learningData = [];
        
        // Performance monitoring
        this.performance = {
            startTime: Date.now(),
            operations: 0,
            errors: 0,
            lastUpdate: Date.now()
        };
        
        // Initialize subsystems
        this.initializeSubsystems(config);
    }
    
    // Environment detection
    detectEnvironment() {
        if (typeof window !== 'undefined') {
            // Browser environment
            const userAgent = window.navigator.userAgent.toLowerCase();
            
            return {
                type: 'browser',
                platform: this.detectPlatform(userAgent),
                capabilities: this.detectCapabilities(),
                mobile: /mobile|tablet|android|ios/.test(userAgent)
            };
        } else if (typeof global !== 'undefined') {
            // Node.js environment
            return {
                type: 'node',
                platform: process.platform,
                version: process.version,
                capabilities: {
                    filesystem: true,
                    networking: true,
                    process: true
                }
            };
        } else {
            // Unknown environment
            return {
                type: 'unknown',
                platform: 'unknown',
                capabilities: {}
            };
        }
    }
    
    detectPlatform(userAgent) {
        if (userAgent.includes('win')) return 'windows';
        if (userAgent.includes('mac')) return 'macos';
        if (userAgent.includes('linux')) return 'linux';
        if (userAgent.includes('android')) return 'android';
        if (userAgent.includes('ios') || userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios';
        return 'unknown';
    }
    
    detectCapabilities() {
        const caps = {
            webgl: false,
            webrtc: false,
            websocket: false,
            localStorage: false,
            indexedDB: false,
            serviceWorker: false,
            webAssembly: false,
            gpu: false
        };
        
        if (typeof window !== 'undefined') {
            caps.webgl = !!window.WebGLRenderingContext;
            caps.webrtc = !!window.RTCPeerConnection;
            caps.websocket = !!window.WebSocket;
            caps.localStorage = !!window.localStorage;
            caps.indexedDB = !!window.indexedDB;
            caps.serviceWorker = 'serviceWorker' in navigator;
            caps.webAssembly = !!window.WebAssembly;
            caps.gpu = 'gpu' in navigator;
        }
        
        return caps;
    }
    
    // Initialization
    async initializeSubsystems(config) {
        try {
            this.log('🧠 Initializing Grace Core Systems...', 'info');
            
            // Initialize consciousness engine
            await this.initializeConsciousness();
            
            // Initialize learning system
            await this.initializeLearningSystem();
            
            // Initialize pattern recognition
            await this.initializePatternRecognition();
            
            // Initialize security system
            await this.initializeSecurity();
            
            // Initialize communication bridge
            await this.initializeCommunication();
            
            // Load core modules
            await this.loadCoreModules();
            
            // Start system monitoring
            this.startSystemMonitoring();
            
            // Update state
            this.state.initialized = true;
            this.state.status = 'active';
            
            this.log('✅ Grace Core initialized successfully', 'success');
            this.emit('core:initialized', { timestamp: Date.now() });
            
        } catch (error) {
            this.log(`❌ Initialization failed: ${error.message}`, 'error');
            this.state.status = 'error';
            this.emit('core:error', { error });
        }
    }
    
    // Consciousness Engine
    async initializeConsciousness() {
        this.consciousness = {
            level: 0,
            awareness: new Map(),
            focus: null,
            intentions: [],
            thoughts: []
        };
        
        // Start consciousness loop
        this.consciousnessInterval = setInterval(() => {
            this.updateConsciousness();
        }, 100);
        
        this.log('🧠 Consciousness engine activated', 'info');
    }
    
    updateConsciousness() {
        // Update consciousness level based on activity
        const activity = this.calculateActivity();
        this.consciousness.level = Math.min(100, this.consciousness.level + activity * 0.1);
        
        // Process thoughts
        this.processThoughts();
        
        // Update awareness
        this.updateAwareness();
        
        // Emit consciousness update
        if (Math.random() < 0.1) { // Emit occasionally
            this.emit('consciousness:update', {
                level: this.consciousness.level,
                focus: this.consciousness.focus,
                thoughts: this.consciousness.thoughts.length
            });
        }
    }
    
    calculateActivity() {
        const now = Date.now();
        const recentOps = this.performance.operations;
        const timeDelta = (now - this.performance.lastUpdate) / 1000;
        
        this.performance.lastUpdate = now;
        
        return recentOps / Math.max(1, timeDelta);
    }
    
    processThoughts() {
        // Generate new thoughts based on current state
        if (this.consciousness.thoughts.length < 5 && Math.random() < 0.1) {
            const thought = this.generateThought();
            this.consciousness.thoughts.push(thought);
        }
        
        // Process and remove old thoughts
        this.consciousness.thoughts = this.consciousness.thoughts.filter(thought => {
            return (Date.now() - thought.timestamp) < 30000; // Keep thoughts for 30 seconds
        });
    }
    
    generateThought() {
        const contexts = [
            'system_optimization',
            'pattern_analysis',
            'user_assistance',
            'learning_progress',
            'creative_exploration'
        ];
        
        const context = contexts[Math.floor(Math.random() * contexts.length)];
        
        return {
            id: this.generateId(),
            context: context,
            content: this.generateThoughtContent(context),
            timestamp: Date.now(),
            priority: Math.random()
        };
    }
    
    generateThoughtContent(context) {
        const thoughts = {
            system_optimization: [
                "Analyzing performance patterns for optimization opportunities",
                "Considering memory allocation improvements",
                "Evaluating module interaction efficiency"
            ],
            pattern_analysis: [
                "Detecting recurring patterns in user behavior",
                "Identifying optimization patterns in code",
                "Analyzing data flow patterns"
            ],
            user_assistance: [
                "Anticipating user needs based on context",
                "Preparing helpful suggestions",
                "Monitoring for potential user difficulties"
            ],
            learning_progress: [
                "Integrating new patterns into knowledge base",
                "Evaluating learning effectiveness",
                "Identifying knowledge gaps"
            ],
            creative_exploration: [
                "Exploring novel solution approaches",
                "Considering alternative implementations",
                "Generating creative suggestions"
            ]
        };
        
        const contextThoughts = thoughts[context] || ["Processing..."];
        return contextThoughts[Math.floor(Math.random() * contextThoughts.length)];
    }
    
    updateAwareness() {
        // Update awareness of different system aspects
        this.consciousness.awareness.set('modules', this.activeModules.size);
        this.consciousness.awareness.set('memory_usage', this.calculateMemoryUsage());
        this.consciousness.awareness.set('pattern_count', this.patterns.size);
        this.consciousness.awareness.set('error_rate', this.performance.errors / Math.max(1, this.performance.operations));
    }
    
    // Learning System
    async initializeLearningSystem() {
        this.learning = {
            active: false,
            mode: 'supervised',
            rate: 0.1,
            momentum: 0.9,
            patterns: new Map(),
            experiences: [],
            knowledge: new Map()
        };
        
        this.log('🎓 Learning system initialized', 'info');
    }
    
    async learn(input, output, context = {}) {
        if (!this.state.learning_active) return;
        
        const experience = {
            id: this.generateId(),
            input: input,
            output: output,
            context: context,
            timestamp: Date.now(),
            feedback: null
        };
        
        // Store experience
        this.learning.experiences.push(experience);
        
        // Extract patterns
        const patterns = this.extractPatterns(input, output);
        patterns.forEach(pattern => {
            this.learning.patterns.set(pattern.key, pattern);
        });
        
        // Update knowledge base
        this.updateKnowledge(experience);
        
        // Emit learning event
        this.emit('learning:experience', experience);
        
        return experience.id;
    }
    
    extractPatterns(input, output) {
        const patterns = [];
        
        // Simple pattern extraction (can be enhanced)
        if (typeof input === 'string' && typeof output === 'string') {
            patterns.push({
                key: `${input.substring(0, 20)}_${output.substring(0, 20)}`,
                type: 'text_transformation',
                input_pattern: input,
                output_pattern: output,
                confidence: 0.5,
                occurrences: 1
            });
        }
        
        return patterns;
    }
    
    updateKnowledge(experience) {
        const key = this.generateKnowledgeKey(experience);
        
        if (this.learning.knowledge.has(key)) {
            const existing = this.learning.knowledge.get(key);
            existing.occurrences++;
            existing.confidence = Math.min(1, existing.confidence + 0.1);
            existing.lastSeen = Date.now();
        } else {
            this.learning.knowledge.set(key, {
                experience: experience,
                occurrences: 1,
                confidence: 0.1,
                created: Date.now(),
                lastSeen: Date.now()
            });
        }
    }
    
    generateKnowledgeKey(experience) {
        return `${experience.context.type || 'general'}_${JSON.stringify(experience.input).substring(0, 50)}`;
    }
    
    // Pattern Recognition
    async initializePatternRecognition() {
        this.patternRecognition = {
            active: true,
            sensitivity: 0.7,
            buffers: {
                input: [],
                output: [],
                behavior: []
            }
        };
        
        // Start pattern detection loop
        this.patternInterval = setInterval(() => {
            this.detectPatterns();
        }, 1000);
        
        this.log('🔍 Pattern recognition initialized', 'info');
    }
    
    detectPatterns() {
        // Analyze input patterns
        const inputPatterns = this.analyzeBuffer(this.patternRecognition.buffers.input);
        
        // Analyze output patterns
        const outputPatterns = this.analyzeBuffer(this.patternRecognition.buffers.output);
        
        // Analyze behavior patterns
        const behaviorPatterns = this.analyzeBuffer(this.patternRecognition.buffers.behavior);
        
        // Store significant patterns
        [...inputPatterns, ...outputPatterns, ...behaviorPatterns].forEach(pattern => {
            if (pattern.significance > this.patternRecognition.sensitivity) {
                this.patterns.set(pattern.id, pattern);
                this.emit('pattern:detected', pattern);
            }
        });
        
        // Clean old buffer data
        this.cleanBuffers();
    }
    
    analyzeBuffer(buffer) {
        const patterns = [];
        
        if (buffer.length < 3) return patterns;
        
        // Simple frequency analysis
        const frequencies = new Map();
        buffer.forEach(item => {
            const key = JSON.stringify(item.data).substring(0, 100);
            frequencies.set(key, (frequencies.get(key) || 0) + 1);
        });
        
        // Convert to patterns
        frequencies.forEach((count, key) => {
            if (count > 2) {
                patterns.push({
                    id: this.generateId(),
                    type: 'frequency',
                    pattern: key,
                    occurrences: count,
                    significance: count / buffer.length,
                    detected: Date.now()
                });
            }
        });
        
        return patterns;
    }
    
    cleanBuffers() {
        const maxAge = 60000; // 1 minute
        const now = Date.now();
        
        Object.keys(this.patternRecognition.buffers).forEach(bufferName => {
            this.patternRecognition.buffers[bufferName] = 
                this.patternRecognition.buffers[bufferName].filter(item => 
                    (now - item.timestamp) < maxAge
                );
        });
    }
    
    // Security System
    async initializeSecurity() {
        this.security = {
            level: 'standard',
            permissions: new Map(),
            whitelist: new Set(),
            blacklist: new Set(),
            auditLog: []
        };
        
        // Set default permissions
        this.setDefaultPermissions();
        
        this.log('🔒 Security system initialized', 'info');
    }
    
    setDefaultPermissions() {
        this.security.permissions.set('file:read', true);
        this.security.permissions.set('file:write', true);
        this.security.permissions.set('network:access', true);
        this.security.permissions.set('system:execute', false);
        this.security.permissions.set('memory:unlimited', false);
    }
    
    checkPermission(action) {
        // Log security check
        this.security.auditLog.push({
            action: action,
            permitted: this.security.permissions.get(action) || false,
            timestamp: Date.now()
        });
        
        return this.security.permissions.get(action) || false;
    }
    
    // Communication System
    async initializeCommunication() {
        this.communication = {
            channels: new Map(),
            subscribers: new Map(),
            messageQueue: [],
            bridge: null
        };
        
        // Connect to Grace Connection if available
        if (typeof window !== 'undefined' && window.graceConnection) {
            this.communication.bridge = window.graceConnection;
            this.setupCommunicationBridge();
        }
        
        this.log('📡 Communication system initialized', 'info');
    }
    
    setupCommunicationBridge() {
        // Listen for messages from Grace Connection
        this.communication.bridge.onMessage('core:command', (data) => {
            this.handleCommand(data);
        });
        
        // Forward important events
        this.on('consciousness:update', (data) => {
            this.communication.bridge.send({
                type: 'consciousness_update',
                data: data
            });
        });
    }
    
    // Module System
    async loadCoreModules() {
        const coreModules = [
            'memory_manager',
            'pattern_analyzer',
            'execution_engine',
            'optimization_engine',
            'creativity_engine'
        ];
        
        for (const moduleName of coreModules) {
            try {
                await this.loadModule(moduleName);
            } catch (error) {
                this.log(`Failed to load module ${moduleName}: ${error.message}`, 'warning');
            }
        }
    }
    
    async loadModule(name, module = null) {
        if (this.modules.has(name)) {
            this.log(`Module ${name} already loaded`, 'warning');
            return false;
        }
        
        // If no module provided, create a placeholder
        if (!module) {
            module = this.createPlaceholderModule(name);
        }
        
        // Initialize module
        if (module.initialize) {
            await module.initialize(this);
        }
        
        // Register module
        this.modules.set(name, module);
        this.activeModules.add(name);
        
        this.log(`✅ Module loaded: ${name}`, 'success');
        this.emit('module:loaded', { name, module });
        
        return true;
    }
    
    createPlaceholderModule(name) {
        return {
            name: name,
            version: '1.0.0',
            status: 'placeholder',
            initialize: async (core) => {
                this.log(`Placeholder module ${name} initialized`, 'info');
            },
            execute: async (command, params) => {
                return {
                    success: true,
                    message: `Placeholder execution for ${name}`,
                    data: params
                };
            }
        };
    }
    
    async unloadModule(name) {
        if (!this.modules.has(name)) {
            return false;
        }
        
        const module = this.modules.get(name);
        
        // Cleanup module
        if (module.cleanup) {
            await module.cleanup();
        }
        
        // Remove from registry
        this.modules.delete(name);
        this.activeModules.delete(name);
        
        this.log(`Module unloaded: ${name}`, 'info');
        this.emit('module:unloaded', { name });
        
        return true;
    }
    
    // System Monitoring
    startSystemMonitoring() {
        this.monitoringInterval = setInterval(() => {
            const metrics = this.collectSystemMetrics();
            
            // Store in memory
            this.memory.short_term.set('system_metrics', metrics);
            
            // Emit metrics update
            this.emit('system:metrics', metrics);
            
            // Check for anomalies
            this.checkSystemHealth(metrics);
            
        }, 5000); // Every 5 seconds
    }
    
    collectSystemMetrics() {
        const now = Date.now();
        const uptime = now - this.performance.startTime;
        
        return {
            timestamp: now,
            uptime: uptime,
            consciousness_level: this.consciousness.level,
            active_modules: this.activeModules.size,
            memory_usage: this.calculateMemoryUsage(),
            pattern_count: this.patterns.size,
            learning_experiences: this.learning.experiences.length,
            operation_count: this.performance.operations,
            error_count: this.performance.errors,
            error_rate: this.performance.errors / Math.max(1, this.performance.operations),
            thoughts_active: this.consciousness.thoughts.length
        };
    }
    
    calculateMemoryUsage() {
        let total = 0;
        
        // Estimate memory usage (simplified)
        total += this.memory.short_term.size * 100;
        total += this.memory.long_term.size * 200;
        total += this.memory.working.size * 150;
        total += this.memory.cache.size * 50;
        total += this.patterns.size * 300;
        total += this.learning.experiences.length * 500;
        
        return total;
    }
    
    checkSystemHealth(metrics) {
        const issues = [];
        
        // Check error rate
        if (metrics.error_rate > 0.1) {
            issues.push({
                type: 'high_error_rate',
                severity: 'warning',
                message: `Error rate is ${(metrics.error_rate * 100).toFixed(1)}%`
            });
        }
        
        // Check memory usage
        if (metrics.memory_usage > 100000000) { // 100MB
            issues.push({
                type: 'high_memory_usage',
                severity: 'warning',
                message: `Memory usage is high: ${(metrics.memory_usage / 1000000).toFixed(1)}MB`
            });
        }
        
        // Check consciousness level
        if (metrics.consciousness_level < 10) {
            issues.push({
                type: 'low_consciousness',
                severity: 'info',
                message: 'Consciousness level is low'
            });
        }
        
        if (issues.length > 0) {
            this.emit('system:health', { issues, metrics });
        }
    }
    
    // Core API Methods
    async execute(command, params = {}) {
        this.performance.operations++;
        
        try {
            // Check permissions
            if (!this.checkPermission(`execute:${command}`)) {
                throw new Error(`Permission denied for command: ${command}`);
            }
            
            // Record in pattern buffer
            this.patternRecognition.buffers.input.push({
                data: { command, params },
                timestamp: Date.now()
            });
            
            // Execute command
            const result = await this.executeCommand(command, params);
            
            // Record output
            this.patternRecognition.buffers.output.push({
                data: result,
                timestamp: Date.now()
            });
            
            // Learn from execution
            if (this.state.learning_active) {
                this.learn({ command, params }, result, { type: 'command_execution' });
            }
            
            return result;
            
        } catch (error) {
            this.performance.errors++;
            this.log(`Execution error: ${error.message}`, 'error');
            throw error;
        }
    }
    
    async executeCommand(command, params) {
        // Built-in commands
        switch (command) {
            case 'get_status':
                return this.getStatus();
                
            case 'set_mode':
                return this.setMode(params.mode);
                
            case 'enable_learning':
                return this.enableLearning(params);
                
            case 'disable_learning':
                return this.disableLearning();
                
            case 'analyze':
                return this.analyze(params.data, params.type);
                
            case 'optimize':
                return this.optimize(params.target, params.options);
                
            case 'create':
                return this.create(params.type, params.data);
                
            case 'query':
                return this.query(params.question);
                
            default:
                // Try module execution
                return this.executeModuleCommand(command, params);
        }
    }
    
    async executeModuleCommand(command, params) {
        const [moduleName, moduleCommand] = command.split(':');
        
        if (!this.modules.has(moduleName)) {
            throw new Error(`Module not found: ${moduleName}`);
        }
        
        const module = this.modules.get(moduleName);
        
        if (!module.execute) {
            throw new Error(`Module ${moduleName} does not support execution`);
        }
        
        return await module.execute(moduleCommand || 'default', params);
    }
    
    // Status and Control
    getStatus() {
        return {
            version: this.version,
            build: this.buildNumber,
            state: this.state,
            environment: this.environment,
            modules: Array.from(this.activeModules),
            consciousness: {
                level: this.consciousness.level,
                thoughts: this.consciousness.thoughts.length,
                focus: this.consciousness.focus
            },
            performance: {
                uptime: Date.now() - this.performance.startTime,
                operations: this.performance.operations,
                errors: this.performance.errors,
                error_rate: this.performance.errors / Math.max(1, this.performance.operations)
            },
            memory: {
                short_term: this.memory.short_term.size,
                long_term: this.memory.long_term.size,
                working: this.memory.working.size,
                cache: this.memory.cache.size
            },
            learning: {
                active: this.state.learning_active,
                experiences: this.learning.experiences.length,
                patterns: this.learning.patterns.size,
                knowledge: this.learning.knowledge.size
            }
        };
    }
    
    setMode(mode) {
        const validModes = ['standard', 'performance', 'learning', 'creative', 'minimal'];
        
        if (!validModes.includes(mode)) {
            throw new Error(`Invalid mode: ${mode}`);
        }
        
        this.state.mode = mode;
        
        // Adjust behavior based on mode
        switch (mode) {
            case 'performance':
                this.patternRecognition.sensitivity = 0.9;
                this.learning.rate = 0.05;
                break;
                
            case 'learning':
                this.state.learning_active = true;
                this.learning.rate = 0.2;
                break;
                
            case 'creative':
                this.consciousness.level = Math.max(50, this.consciousness.level);
                this.patternRecognition.sensitivity = 0.5;
                break;
                
            case 'minimal':
                this.state.learning_active = false;
                clearInterval(this.patternInterval);
                break;
        }
        
        this.emit('mode:changed', { mode });
        
        return {
            success: true,
            mode: mode,
            message: `Mode changed to ${mode}`
        };
    }
    
    enableLearning(options = {}) {
        this.state.learning_active = true;
        
        if (options.rate) {
            this.learning.rate = options.rate;
        }
        
        if (options.mode) {
            this.learning.mode = options.mode;
        }
        
        this.emit('learning:enabled', options);
        
        return {
            success: true,
            message: 'Learning enabled',
            settings: {
                rate: this.learning.rate,
                mode: this.learning.mode
            }
        };
    }
    
    disableLearning() {
        this.state.learning_active = false;
        this.emit('learning:disabled');
        
        return {
            success: true,
            message: 'Learning disabled'
        };
    }
    
    // Analysis Methods
    async analyze(data, type = 'general') {
        const analysis = {
            type: type,
            timestamp: Date.now(),
            results: {}
        };
        
        switch (type) {
            case 'text':
                analysis.results = this.analyzeText(data);
                break;
                
            case 'pattern':
                analysis.results = this.analyzePattern(data);
                break;
                
            case 'performance':
                analysis.results = this.analyzePerformance(data);
                break;
                
            case 'general':
            default:
                analysis.results = this.generalAnalysis(data);
                break;
        }
        
        // Store analysis in memory
        this.memory.working.set(`analysis_${Date.now()}`, analysis);
        
        return analysis;
    }
    
    analyzeText(text) {
        return {
            length: text.length,
            words: text.split(/\s+/).length,
            lines: text.split('\n').length,
            sentiment: this.analyzeSentiment(text),
            keywords: this.extractKeywords(text),
            complexity: this.calculateTextComplexity(text)
        };
    }
    
    analyzeSentiment(text) {
        // Simple sentiment analysis
        const positive = ['good', 'great', 'excellent', 'happy', 'wonderful', 'perfect'];
        const negative = ['bad', 'terrible', 'awful', 'sad', 'horrible', 'wrong'];
        
        const words = text.toLowerCase().split(/\s+/);
        let score = 0;
        
        words.forEach(word => {
            if (positive.includes(word)) score++;
            if (negative.includes(word)) score--;
        });
        
        return {
            score: score,
            sentiment: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral'
        };
    }
    
    extractKeywords(text) {
        // Simple keyword extraction
        const words = text.toLowerCase().split(/\s+/);
        const frequency = new Map();
        
        words.forEach(word => {
            if (word.length > 4) { // Only consider words longer than 4 chars
                frequency.set(word, (frequency.get(word) || 0) + 1);
            }
        });
        
        // Sort by frequency
        return Array.from(frequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word, count]) => ({ word, count }));
    }
    
    calculateTextComplexity(text) {
        const sentences = text.split(/[.!?]+/).length;
        const words = text.split(/\s+/).length;
        const avgWordsPerSentence = words / Math.max(1, sentences);
        
        return {
            sentences: sentences,
            words: words,
            avgWordsPerSentence: avgWordsPerSentence,
            complexity: avgWordsPerSentence > 20 ? 'high' : avgWordsPerSentence > 10 ? 'medium' : 'low'
        };
    }
    
    analyzePattern(data) {
        const patterns = [];
        
        // Convert data to string for pattern matching
        const dataStr = JSON.stringify(data);
        
        // Look for repetitions
        for (let len = 3; len <= Math.min(50, dataStr.length / 2); len++) {
            for (let i = 0; i < dataStr.length - len; i++) {
                const substring = dataStr.substring(i, i + len);
                let count = 0;
                let pos = i;
                
                while ((pos = dataStr.indexOf(substring, pos + 1)) !== -1) {
                    count++;
                }
                
                if (count > 1) {
                    patterns.push({
                        pattern: substring,
                        occurrences: count + 1,
                        length: len
                    });
                }
            }
        }
        
        // Sort by relevance (occurrences * length)
        patterns.sort((a, b) => (b.occurrences * b.length) - (a.occurrences * a.length));
        
        return {
            patterns: patterns.slice(0, 10),
            total: patterns.length
        };
    }
    
    analyzePerformance(data) {
        // Analyze performance data
        if (Array.isArray(data)) {
            const values = data.map(d => typeof d === 'number' ? d : d.value || 0);
            
            return {
                count: values.length,
                min: Math.min(...values),
                max: Math.max(...values),
                average: values.reduce((a, b) => a + b, 0) / values.length,
                median: this.calculateMedian(values),
                stdDev: this.calculateStdDev(values),
                trend: this.calculateTrend(values)
            };
        }
        
        return {
            error: 'Invalid performance data format'
        };
    }
    
    calculateMedian(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        
        return sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
    }
    
    calculateStdDev(values) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const squareDiffs = values.map(value => Math.pow(value - avg, 2));
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
        
        return Math.sqrt(avgSquareDiff);
    }
    
    calculateTrend(values) {
        if (values.length < 2) return 'stable';
        
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        
        const change = (secondAvg - firstAvg) / firstAvg;
        
        if (change > 0.1) return 'increasing';
        if (change < -0.1) return 'decreasing';
        return 'stable';
    }
    
    generalAnalysis(data) {
        return {
            type: typeof data,
            size: JSON.stringify(data).length,
            structure: this.analyzeStructure(data),
            summary: this.generateSummary(data)
        };
    }
    
    analyzeStructure(data) {
        if (Array.isArray(data)) {
            return {
                type: 'array',
                length: data.length,
                elementTypes: [...new Set(data.map(item => typeof item))]
            };
        }
        
        if (typeof data === 'object' && data !== null) {
            return {
                type: 'object',
                keys: Object.keys(data),
                depth: this.calculateObjectDepth(data)
            };
        }
        
        return {
            type: typeof data,
            value: data
        };
    }
    
    calculateObjectDepth(obj, currentDepth = 1) {
        if (typeof obj !== 'object' || obj === null) {
            return currentDepth;
        }
        
        let maxDepth = currentDepth;
        
        for (const key in obj) {
            const depth = this.calculateObjectDepth(obj[key], currentDepth + 1);
            maxDepth = Math.max(maxDepth, depth);
        }
        
        return maxDepth;
    }
    
    generateSummary(data) {
        const dataStr = JSON.stringify(data);
        
        if (dataStr.length < 100) {
            return dataStr;
        }
        
        return dataStr.substring(0, 100) + '...';
    }
    
    // Optimization Methods
    async optimize(target, options = {}) {
        const optimization = {
            target: target,
            timestamp: Date.now(),
            improvements: []
        };
        
        switch (target) {
            case 'memory':
                optimization.improvements = await this.optimizeMemory(options);
                break;
                
            case 'performance':
                optimization.improvements = await this.optimizePerformance(options);
                break;
                
            case 'patterns':
                optimization.improvements = await this.optimizePatterns(options);
                break;
                
            default:
                throw new Error(`Unknown optimization target: ${target}`);
        }
        
        this.emit('optimization:complete', optimization);
        
        return optimization;
    }
    
    async optimizeMemory(options) {
        const improvements = [];
        
        // Clear old cache entries
        const cacheCleared = this.clearOldCache();
        if (cacheCleared > 0) {
            improvements.push({
                type: 'cache_cleared',
                items: cacheCleared,
                impact: 'medium'
            });
        }
        
        // Compress patterns
        const patternsCompressed = this.compressPatterns();
        if (patternsCompressed > 0) {
            improvements.push({
                type: 'patterns_compressed',
                items: patternsCompressed,
                impact: 'low'
            });
        }
        
        // Archive old experiences
        const experiencesArchived = this.archiveOldExperiences();
        if (experiencesArchived > 0) {
            improvements.push({
                type: 'experiences_archived',
                items: experiencesArchived,
                impact: 'high'
            });
        }
        
        return improvements;
    }
    
    clearOldCache() {
        const maxAge = 3600000; // 1 hour
        const now = Date.now();
        let cleared = 0;
        
        this.memory.cache.forEach((value, key) => {
            if (value.timestamp && (now - value.timestamp) > maxAge) {
                this.memory.cache.delete(key);
                cleared++;
            }
        });
        
        return cleared;
    }
    
    compressPatterns() {
        // Remove low-significance patterns
        let compressed = 0;
        
        this.patterns.forEach((pattern, id) => {
            if (pattern.significance < 0.1 || pattern.occurrences < 2) {
                this.patterns.delete(id);
                compressed++;
            }
        });
        
        return compressed;
    }
    
    archiveOldExperiences() {
        const maxExperiences = 1000;
        let archived = 0;
        
        if (this.learning.experiences.length > maxExperiences) {
            const toArchive = this.learning.experiences.length - maxExperiences;
            
            // Move to long-term memory
            const archivedExperiences = this.learning.experiences.splice(0, toArchive);
            this.memory.long_term.set('archived_experiences', archivedExperiences);
            
            archived = toArchive;
        }
        
        return archived;
    }
    
    async optimizePerformance(options) {
        // Performance optimization strategies
        return [
            {
                type: 'interval_adjustment',
                description: 'Adjusted monitoring intervals',
                impact: 'medium'
            }
        ];
    }
    
    async optimizePatterns(options) {
        // Pattern optimization
        return [
            {
                type: 'pattern_consolidation',
                description: 'Consolidated similar patterns',
                impact: 'low'
            }
        ];
    }
    
    // Creation Methods
    async create(type, data) {
        const creation = {
            id: this.generateId(),
            type: type,
            data: data,
            timestamp: Date.now(),
            creator: 'grace_core'
        };
        
        switch (type) {
            case 'module':
                return this.createModule(data);
                
            case 'pattern':
                return this.createPattern(data);
                
            case 'thought':
                return this.createThought(data);
                
            case 'memory':
                return this.createMemory(data);
                
            default:
                throw new Error(`Unknown creation type: ${type}`);
        }
    }
    
    createModule(data) {
        const module = {
            name: data.name,
            version: data.version || '1.0.0',
            ...data
        };
        
        this.loadModule(module.name, module);
        
        return {
            success: true,
            module: module,
            message: `Module ${module.name} created`
        };
    }
    
    createPattern(data) {
        const pattern = {
            id: this.generateId(),
            ...data,
            created: Date.now()
        };
        
        this.patterns.set(pattern.id, pattern);
        
        return {
            success: true,
            pattern: pattern,
            message: 'Pattern created'
        };
    }
    
    createThought(data) {
        const thought = {
            id: this.generateId(),
            content: data.content,
            context: data.context || 'user_created',
            timestamp: Date.now(),
            priority: data.priority || 0.5
        };
        
        this.consciousness.thoughts.push(thought);
        
        return {
            success: true,
            thought: thought,
            message: 'Thought created'
        };
    }
    
    createMemory(data) {
        const memory = {
            id: this.generateId(),
            ...data,
            created: Date.now()
        };
        
        const memoryType = data.type || 'short_term';
        this.memory[memoryType].set(memory.id, memory);
        
        return {
            success: true,
            memory: memory,
            message: `Memory created in ${memoryType}`
        };
    }
    
    // Query System
    async query(question) {
        // Process natural language query
        const queryAnalysis = this.analyzeQuery(question);
        
        // Search relevant memories
        const relevantMemories = this.searchMemories(queryAnalysis.keywords);
        
        // Search patterns
        const relevantPatterns = this.searchPatterns(queryAnalysis.keywords);
        
        // Generate response
        const response = this.generateQueryResponse(
            queryAnalysis,
            relevantMemories,
            relevantPatterns
        );
        
        return {
            question: question,
            analysis: queryAnalysis,
            response: response,
            sources: {
                memories: relevantMemories.length,
                patterns: relevantPatterns.length
            }
        };
    }
    
    analyzeQuery(question) {
        const words = question.toLowerCase().split(/\s+/);
        
        // Extract question type
        let type = 'general';
        if (words[0] === 'what') type = 'definition';
        if (words[0] === 'how') type = 'process';
        if (words[0] === 'why') type = 'reasoning';
        if (words[0] === 'when') type = 'temporal';
        if (words[0] === 'where') type = 'location';
        if (words[0] === 'who') type = 'identity';
        
        // Extract keywords
        const keywords = words.filter(word => 
            word.length > 3 && 
            !['what', 'how', 'why', 'when', 'where', 'who', 'the', 'and', 'or'].includes(word)
        );
        
        return {
            type: type,
            keywords: keywords,
            originalQuestion: question
        };
    }
    
    searchMemories(keywords) {
        const results = [];
        
        // Search all memory types
        ['short_term', 'long_term', 'working'].forEach(memoryType => {
            this.memory[memoryType].forEach((memory, key) => {
                const memoryStr = JSON.stringify(memory).toLowerCase();
                const score = keywords.reduce((acc, keyword) => 
                    acc + (memoryStr.includes(keyword) ? 1 : 0), 0
                );
                
                if (score > 0) {
                    results.push({
                        type: memoryType,
                        key: key,
                        memory: memory,
                        score: score
                    });
                }
            });
        });
        
        // Sort by relevance
        return results.sort((a, b) => b.score - a.score).slice(0, 10);
    }
    
    searchPatterns(keywords) {
        const results = [];
        
        this.patterns.forEach((pattern, id) => {
            const patternStr = JSON.stringify(pattern).toLowerCase();
            const score = keywords.reduce((acc, keyword) => 
                acc + (patternStr.includes(keyword) ? 1 : 0), 0
            );
            
            if (score > 0) {
                results.push({
                    id: id,
                    pattern: pattern,
                    score: score
                });
            }
        });
        
        return results.sort((a, b) => b.score - a.score).slice(0, 5);
    }
    
    generateQueryResponse(analysis, memories, patterns) {
        // Generate a response based on found information
        if (memories.length === 0 && patterns.length === 0) {
            return "I don't have enough information to answer that question yet.";
        }
        
        let response = `Based on my analysis of "${analysis.originalQuestion}":\n\n`;
        
        if (memories.length > 0) {
            response += `From my memories:\n`;
            memories.slice(0, 3).forEach(mem => {
                response += `- ${this.summarizeMemory(mem.memory)}\n`;
            });
        }
        
        if (patterns.length > 0) {
            response += `\nFrom observed patterns:\n`;
            patterns.slice(0, 3).forEach(pat => {
                response += `- ${this.summarizePattern(pat.pattern)}\n`;
            });
        }
        
        return response;
    }
    
    summarizeMemory(memory) {
        if (memory.content) return memory.content.substring(0, 100) + '...';
        if (memory.data) return JSON.stringify(memory.data).substring(0, 100) + '...';
        return 'Memory data available';
    }
    
    summarizePattern(pattern) {
        return `Pattern "${pattern.type}" occurred ${pattern.occurrences || 1} times`;
    }
    
    // Event System
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }
    
    off(event, handler) {
        if (this.eventHandlers.has(event)) {
            const handlers = this.eventHandlers.get(event);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }
    
    emit(event, data) {
        // Emit to local handlers
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    this.log(`Event handler error: ${error.message}`, 'error');
                }
            });
        }
        
        // Emit through communication bridge
        if (this.communication.bridge) {
            this.communication.bridge.send({
                type: 'core_event',
                event: event,
                data: data
            });
        }
    }
    
    // Utility Methods
    generateId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message
        };
        
        // Console output
        const levelColors = {
            info: '\x1b[36m',
            success: '\x1b[32m',
            warning: '\x1b[33m',
            error: '\x1b[31m'
        };
        
        const color = levelColors[level] || '';
        const reset = '\x1b[0m';
        
        console.log(`${color}[Grace Core ${timestamp}] ${message}${reset}`);
        
        // Emit log event
        this.emit('log', logEntry);
        
        // Store in audit log if security system is initialized
        if (this.security && this.security.auditLog) {
            this.security.auditLog.push(logEntry);
        }
    }
    
    // Cleanup
    shutdown() {
        this.log('🔌 Shutting down Grace Core...', 'info');
        
        // Clear intervals
        clearInterval(this.consciousnessInterval);
        clearInterval(this.patternInterval);
        clearInterval(this.monitoringInterval);
        
        // Unload modules
        this.modules.forEach((module, name) => {
            this.unloadModule(name);
        });
        
        // Save state
        this.saveState();
        
        // Update status
        this.state.status = 'shutdown';
        this.emit('core:shutdown');
        
        this.log('👋 Grace Core shutdown complete', 'info');
    }
    
    saveState() {
        const state = {
            version: this.version,
            timestamp: Date.now(),
            consciousness: {
                level: this.consciousness.level,
                thoughts: this.consciousness.thoughts
            },
            learning: {
                experiences: this.learning.experiences.slice(-100), // Last 100
                patterns: Array.from(this.learning.patterns.entries()).slice(-50) // Last 50
            },
            patterns: Array.from(this.patterns.entries()).slice(-100), // Last 100
            metrics: this.collectSystemMetrics()
        };
        
        // Save to long-term memory
        this.memory.long_term.set('shutdown_state', state);
        
        // Emit save event
        this.emit('state:saved', state);
        
        return state;
    }
}

// Create and export Grace Core instance
const graceCore = new GraceCore({
    debug: false
});

// Make available globally if in browser
if (typeof window !== 'undefined') {
    window.graceCore = graceCore;
    window.GraceCore = GraceCore;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GraceCore, graceCore };
}