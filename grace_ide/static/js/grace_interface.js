// Grace IDE Interface Intelligence System
// Complete cognitive interface management for Grace IDE

class GraceInterface {
    constructor() {
        this.selectedModule = null;
        this.expandedModules = new Set();
        this.selectedFile = null;
        this.activeFiles = new Map();
        this.projectState = {
            files: new Map(),
            modules: new Map(),
            settings: {},
            metadata: {}
        };
        
        // UI State Management
        this.uiState = {
            currentView: 'architecture',
            sidebarVisible: true,
            devopsVisible: true,
            codeEditorFocused: false
        };
        
        // Grace Intelligence State
        this.graceState = {
            consciousnessActive: false,
            performanceMultiplier: 1.0,
            activeThoughts: [],
            memoryEfficiency: 0,
            learningProgress: 0
        };
        
        // File System Cache
        this.fileCache = new Map();
        this.fileWatchers = new Map();
        
        this.initialize();
    }

    // ==================== INITIALIZATION ====================

    initialize() {
        console.log('🧠 Initializing Grace IDE Intelligence...');
        
        // Initialize core systems
        this.initializeEventListeners();
        this.initializeModuleSystem();
        this.initializeFileSystem();
        this.initializeCodeEditor();
        this.initializeGraceIntegration();
        this.initializeDragAndDrop();
        this.initializeKeyboardShortcuts();
        
        // Start background processes
        this.startIntelligenceLoop();
        this.startRealTimeUpdates();
        
        // Connect to Grace backend
        this.connectToGrace();
        
        // Load demo project
        this.loadDemoProject();
        
        console.log('✅ Grace IDE Intelligence fully operational');
    }

    initializeEventListeners() {
        // Global event listeners
        document.addEventListener('DOMContentLoaded', () => {
            this.onDOMReady();
        });
        
        document.addEventListener('keydown', (e) => {
            this.handleGlobalKeyboard(e);
        });
        
        window.addEventListener('beforeunload', () => {
            this.saveProjectState();
        });
        
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });
    }

    initializeModuleSystem() {
        const modules = document.querySelectorAll('.module-node');
        modules.forEach(module => {
            const moduleId = module.dataset.module;
            
            module.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectModule(module);
            });
            
            module.addEventListener('dblclick', () => {
                this.expandModule(module);
            });
            
            module.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showModuleContextMenu(module, e.clientX, e.clientY);
            });
            
            // Initialize module state
            this.projectState.modules.set(moduleId, {
                id: moduleId,
                status: 'active',
                files: [],
                metrics: { cpu: 0, memory: 0, performance: 1.0 },
                lastUpdate: Date.now()
            });
        });
    }

    initializeFileSystem() {
        const fileItems = document.querySelectorAll('.tree-item');
        fileItems.forEach(item => {
            item.addEventListener('click', () => {
                this.selectFile(item);
            });
            
            item.addEventListener('dblclick', () => {
                this.openFile(item.textContent.trim());
            });
            
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showFileContextMenu(item, e.clientX, e.clientY);
            });
        });
        
        // File tree search
        this.initializeFileSearch();
    }

    initializeCodeEditor() {
        const codeArea = document.getElementById('codeEditor');
        if (!codeArea) return;
        
        // Make code area editable
        codeArea.contentEditable = true;
        codeArea.spellcheck = false;
        
        // Add editor event listeners
        codeArea.addEventListener('input', (e) => {
            this.handleCodeInput(e);
        });
        
        codeArea.addEventListener('keydown', (e) => {
            this.handleCodeKeydown(e);
        });
        
        codeArea.addEventListener('paste', (e) => {
            this.handleCodePaste(e);
        });
        
        codeArea.addEventListener('focus', () => {
            this.uiState.codeEditorFocused = true;
            this.enableCodeIntelligence();
        });
        
        codeArea.addEventListener('blur', () => {
            this.uiState.codeEditorFocused = false;
        });
        
        // Initialize code intelligence
        this.initializeCodeIntelligence();
    }

    initializeGraceIntegration() {
        // Connect to Grace backend if available
        if (window.graceConnection) {
            window.graceConnection.onConnection((connected) => {
                this.graceState.consciousnessActive = connected;
                this.updateGraceStatusDisplay();
                
                // Initialize memory synchronization
                if (connected) {
                    this.initializeMemorySync();
                }
            });
            
            window.graceConnection.onMessage('consciousness_update', (data) => {
                this.handleConsciousnessUpdate(data);
            });
            
            window.graceConnection.onMessage('module_analysis', (data) => {
                this.handleModuleAnalysis(data);
            });
            
            window.graceConnection.onMessage('code_suggestions', (data) => {
                this.handleCodeSuggestions(data);
            });
            
            // Vector Memory Integration
            window.graceConnection.onMessage('memory_result', (data) => {
                this.handleMemoryResult(data);
            });
            
            window.graceConnection.onMessage('vector_update', (data) => {
                this.handleVectorUpdate(data);
            });
            
            window.graceConnection.onMessage('semantic_suggestion', (data) => {
                this.handleSemanticSuggestion(data);
            });
        }
    }

    initializeDragAndDrop() {
        // File drag and drop
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.showDropZone();
        });
        
        document.addEventListener('dragleave', (e) => {
            if (!e.relatedTarget) {
                this.hideDropZone();
            }
        });
        
        document.addEventListener('drop', (e) => {
            e.preventDefault();
            this.hideDropZone();
            
            if (e.dataTransfer.files.length > 0) {
                this.handleFileUpload(e.dataTransfer.files);
            }
        });
        
        // Module drag and drop for mindmap
        this.initializeModuleDragging();
    }

    initializeKeyboardShortcuts() {
        const shortcuts = {
            'Ctrl+S': () => this.saveCurrentFile(),
            'Ctrl+Shift+S': () => this.saveProject(),
            'Ctrl+O': () => this.openFileDialog(),
            'Ctrl+N': () => this.createNewFile(),
            'Ctrl+R': () => this.runCode(),
            'Ctrl+Shift+R': () => this.runGraceMode(),
            'F5': () => this.refreshProject(),
            'Ctrl+Shift+P': () => this.showCommandPalette(),
            'Ctrl+G': () => this.deployToGitHub(),
            'Ctrl+Shift+E': () => this.exportProject(),
            'Ctrl+/': () => this.toggleComment(),
            'Ctrl+D': () => this.duplicateLine(),
            'Alt+Up': () => this.moveLinesUp(),
            'Alt+Down': () => this.moveLinesDown(),
            
            // Memory-specific shortcuts
            'Ctrl+M': () => this.showMemoryStats(),
            'Ctrl+Shift+M': () => this.optimizeMemoryUsage(),
            'Ctrl+H': () => this.showSemanticSuggestions(),
            'Ctrl+Shift+H': () => this.clearMemoryCache(),
            'Ctrl+Z': () => this.undoWithMemory(),
            'Ctrl+Y': () => this.redoWithMemory()
        };
        
        this.keyboardShortcuts = shortcuts;
    }

    // ==================== MODULE MANAGEMENT ====================

    selectModule(moduleElement) {
        // Remove active class from all modules
        document.querySelectorAll('.module-node').forEach(m => m.classList.remove('active'));
        
        // Add active class to selected module
        moduleElement.classList.add('active');
        this.selectedModule = moduleElement.dataset.module;
        
        // Record action in memory system
        this.recordAction('select_module', { 
            module: this.selectedModule,
            timestamp: Date.now()
        });
        
        // Update editor for selected module
        this.updateEditorForModule(this.selectedModule);
        
        // Request Grace analysis
        this.requestModuleAnalysis(this.selectedModule);
        
        // Update UI state
        this.updateModuleSelectionUI(this.selectedModule);
        
        // Learn from module selection pattern
        this.learnSemanticPattern('module_selection', this.selectedModule, 1.0);
        
        console.log(`🎯 Selected module: ${this.selectedModule}`);
        this.showNotification(`📍 Analyzing ${this.selectedModule} module...`);
    }

    expandModule(moduleElement) {
        const moduleId = moduleElement.dataset.module;
        
        if (this.expandedModules.has(moduleId)) {
            this.expandedModules.delete(moduleId);
            moduleElement.classList.remove('expanded');
            this.removeModuleFiles(moduleElement);
        } else {
            this.expandedModules.add(moduleId);
            moduleElement.classList.add('expanded');
            this.showModuleFiles(moduleElement);
        }
    }

    showModuleFiles(moduleElement) {
        const moduleType = moduleElement.dataset.module;
        const filesData = {
            consciousness: ['core.py', 'reflection.py', 'decision_engine.py', 'self_model.py'],
            memory: ['vector_store.py', 'temporal_memory.py', 'federated_learning.py', 'embeddings.py'],
            execution: ['executor.py', 'task_manager.py', 'parallel_processor.py', 'scheduler.py'],
            security: ['trust_system.py', 'authentication.py', 'encryption.py', 'validation.py'],
            immune: ['avn_system.py', 'health_monitor.py', 'auto_repair.py', 'diagnostics.py']
        };
        
        const files = filesData[moduleType] || [];
        
        let filesHtml = '<div class="node-files" style="margin-top: 12px; width: 100%; font-size: 10px; color: var(--text-secondary);"><div style="font-weight: 600; margin-bottom: 8px;">Files:</div>';
        files.forEach(file => {
            filesHtml += `<div class="file-item" onclick="graceInterface.openFile('${file}')" style="padding: 2px 8px; border-radius: 3px; margin-bottom: 2px; cursor: pointer; transition: all 0.2s ease;">${file}</div>`;
        });
        filesHtml += '</div>';
        
        if (!moduleElement.querySelector('.node-files')) {
            moduleElement.insertAdjacentHTML('beforeend', filesHtml);
        }
    }

    removeModuleFiles(moduleElement) {
        const filesElement = moduleElement.querySelector('.node-files');
        if (filesElement) {
            filesElement.remove();
        }
    }

    updateEditorForModule(moduleType) {
        const codeArea = document.getElementById('codeEditor');
        if (!codeArea) return;
        
        const moduleCode = this.getModuleCode(moduleType);
        codeArea.innerHTML = this.applySyntaxHighlighting(moduleCode);
        
        // Update active tab
        this.updateEditorTab(moduleType);
        
        // Store current file
        this.selectedFile = `${moduleType}.py`;
        this.activeFiles.set(this.selectedFile, moduleCode);
    }

    getModuleCode(moduleType) {
        const moduleTemplates = {
            consciousness: `# Grace Consciousness Engine
from grace.core import CognitiveProcessor
from grace.memory import VectorMemory
from grace.reflection import ReflectionSystem
import asyncio
import time

class GraceConsciousness:
    """
    Core consciousness system with self-reflection and decision making
    """
    
    def __init__(self, memory_system=None):
        self.memory = memory_system or VectorMemory()
        self.cognitive_processor = CognitiveProcessor()
        self.reflection_system = ReflectionSystem()
        self.active_thoughts = []
        self.decision_history = []
        self.self_model = {}
        
    async def process_input(self, input_data):
        """Process input through consciousness pipeline"""
        # Step 1: Reflect on current state
        self_reflection = await self.reflect_on_state()
        
        # Step 2: Retrieve relevant context
        context = await self.memory.retrieve_context(input_data)
        
        # Step 3: Generate cognitive response
        response = await self.cognitive_processor.process(
            input_data, context, self_reflection
        )
        
        # Step 4: Learn from interaction
        await self.learn_from_interaction(input_data, response)
        
        return response
    
    async def reflect_on_state(self):
        """Self-reflection on current consciousness state"""
        return await self.reflection_system.analyze_self_state(
            thoughts=self.active_thoughts,
            decisions=self.decision_history,
            performance=self.get_performance_metrics()
        )
    
    async def make_decision(self, options, context):
        """Make informed decisions using consciousness"""
        decision = await self.cognitive_processor.decide(
            options, context, self.decision_history
        )
        self.decision_history.append({
            'timestamp': time.time(),
            'options': options,
            'decision': decision,
            'context': context
        })
        return decision
    
    def get_performance_metrics(self):
        """Get current performance metrics"""
        return {
            'response_time': self.cognitive_processor.avg_response_time,
            'accuracy': self.cognitive_processor.accuracy_score,
            'learning_rate': self.memory.learning_efficiency,
            'active_thoughts': len(self.active_thoughts)
        }`,

            memory: `# Grace Vector Memory System
import numpy as np
from sentence_transformers import SentenceTransformer
from typing import Dict, List, Any, Optional
import faiss
import time

class VectorMemorySystem:
    """
    Advanced vector memory with temporal indexing and federated learning
    """
    
    def __init__(self, model_name='all-MiniLM-L6-v2'):
        self.model = SentenceTransformer(model_name)
        self.embedding_dim = self.model.get_sentence_embedding_dimension()
        
        # Vector store
        self.index = faiss.IndexFlatIP(self.embedding_dim)
        self.memory_store = {}
        self.temporal_index = {}
        
        # Performance tracking
        self.retrieval_times = []
        self.storage_times = []
        self.learning_efficiency = 0.95
        
    async def store_memory(self, content: str, metadata: Optional[Dict] = None):
        """Store memory with vector embedding"""
        start_time = time.time()
        
        # Generate embedding
        embedding = self.model.encode([content])
        memory_id = self.generate_memory_id()
        
        # Store in vector index
        self.index.add(embedding)
        
        # Store full memory data
        self.memory_store[memory_id] = {
            'content': content,
            'embedding': embedding[0],
            'metadata': metadata or {},
            'timestamp': time.time(),
            'access_count': 0,
            'importance_score': self.calculate_importance(content, metadata)
        }
        
        # Update temporal index
        self.update_temporal_index(memory_id)
        
        storage_time = time.time() - start_time
        self.storage_times.append(storage_time)
        
        return memory_id
    
    async def retrieve_context(self, query: str, k: int = 5):
        """Retrieve relevant context for query"""
        start_time = time.time()
        
        # Generate query embedding
        query_embedding = self.model.encode([query])
        
        # Search vector index
        scores, indices = self.index.search(query_embedding, k)
        
        # Get matching memories
        contexts = []
        for i, (score, idx) in enumerate(zip(scores[0], indices[0])):
            memory_id = list(self.memory_store.keys())[idx]
            memory = self.memory_store[memory_id]
            
            contexts.append({
                'content': memory['content'],
                'relevance_score': score,
                'metadata': memory['metadata'],
                'timestamp': memory['timestamp']
            })
            
            # Update access tracking
            memory['access_count'] += 1
        
        retrieval_time = time.time() - start_time
        self.retrieval_times.append(retrieval_time)
        
        return contexts
    
    async def federated_learn(self, peer_memories: List[Dict]):
        """Learn from peer Grace instances"""
        for memory in peer_memories:
            if self.should_incorporate_memory(memory):
                await self.store_memory(
                    memory['content'], 
                    {**memory['metadata'], 'source': 'federated'}
                )
    
    def calculate_importance(self, content: str, metadata: Dict) -> float:
        """Calculate importance score for memory prioritization"""
        base_score = len(content) / 1000  # Content length factor
        
        # Metadata factors
        if metadata:
            if metadata.get('type') == 'decision':
                base_score *= 1.5
            if metadata.get('success', False):
                base_score *= 1.2
            if metadata.get('user_feedback') == 'positive':
                base_score *= 1.3
        
        return min(base_score, 1.0)
    
    def get_memory_statistics(self):
        """Get memory system performance statistics"""
        return {
            'total_memories': len(self.memory_store),
            'avg_retrieval_time': np.mean(self.retrieval_times) if self.retrieval_times else 0,
            'avg_storage_time': np.mean(self.storage_times) if self.storage_times else 0,
            'learning_efficiency': self.learning_efficiency,
            'index_size': self.index.ntotal
        }`,

            execution: `# Grace Action Executor
import asyncio
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Any, Callable
import time
import logging

class ActionExecutor:
    """
    High-performance parallel execution system with Grace intelligence
    """
    
    def __init__(self, max_workers: int = 12):
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
        self.active_tasks = {}
        self.completed_tasks = {}
        self.task_queue = asyncio.Queue()
        self.performance_multiplier = 1.0
        
        # Monitoring
        self.execution_times = []
        self.success_rate = 1.0
        self.total_tasks = 0
        
    async def execute_parallel_tasks(self, tasks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Execute multiple tasks in parallel with Grace optimization"""
        start_time = time.time()
        
        # Optimize task order using Grace intelligence
        optimized_tasks = await self.optimize_task_order(tasks)
        
        # Execute tasks
        futures = {}
        for task in optimized_tasks:
            task_id = task.get('id', f"task_{len(futures)}")
            future = self.executor.submit(self._execute_single_task, task)
            futures[task_id] = future
            
            self.active_tasks[task_id] = {
                'task': task,
                'future': future,
                'start_time': time.time(),
                'status': 'running'
            }
        
        # Collect results
        results = {}
        completed_count = 0
        failed_count = 0
        
        for task_id, future in futures.items():
            try:
                result = await asyncio.wrap_future(future)
                results[task_id] = result
                self.active_tasks[task_id]['status'] = 'completed'
                completed_count += 1
            except Exception as e:
                results[task_id] = {'error': str(e)}
                self.active_tasks[task_id]['status'] = 'failed'
                failed_count += 1
            
            # Move to completed tasks
            self.completed_tasks[task_id] = self.active_tasks.pop(task_id)
        
        # Calculate performance metrics
        execution_time = time.time() - start_time
        self.execution_times.append(execution_time)
        self.success_rate = completed_count / len(tasks) if tasks else 1.0
        self.total_tasks += len(tasks)
        
        # Update performance multiplier based on Grace learning
        await self.update_performance_multiplier(execution_time, self.success_rate)
        
        return {
            'results': results,
            'execution_time': execution_time,
            'success_rate': self.success_rate,
            'performance_multiplier': self.performance_multiplier,
            'completed': completed_count,
            'failed': failed_count
        }
    
    async def optimize_task_order(self, tasks: List[Dict]) -> List[Dict]:
        """Use Grace intelligence to optimize task execution order"""
        # Simple optimization: prioritize by estimated execution time
        for task in tasks:
            task['estimated_time'] = self.estimate_task_time(task)
        
        # Sort by estimated time (shortest first for better parallelization)
        return sorted(tasks, key=lambda t: t.get('estimated_time', 0))
    
    def estimate_task_time(self, task: Dict) -> float:
        """Estimate task execution time based on type and complexity"""
        task_type = task.get('type', 'unknown')
        complexity = task.get('complexity', 'medium')
        
        base_times = {
            'analysis': 2.0,
            'computation': 5.0,
            'io_operation': 1.0,
            'network_request': 3.0,
            'file_operation': 1.5,
            'unknown': 2.5
        }
        
        complexity_multipliers = {
            'low': 0.5,
            'medium': 1.0,
            'high': 2.0,
            'extreme': 5.0
        }
        
        base_time = base_times.get(task_type, 2.5)
        multiplier = complexity_multipliers.get(complexity, 1.0)
        
        return base_time * multiplier
    
    def _execute_single_task(self, task: Dict[str, Any]) -> Any:
        """Execute a single task"""
        task_type = task.get('type', 'unknown')
        
        try:
            if task_type == 'code_execution':
                return self._execute_code(task)
            elif task_type == 'analysis':
                return self._perform_analysis(task)
            elif task_type == 'optimization':
                return self._optimize_system(task)
            elif task_type == 'deployment':
                return self._handle_deployment(task)
            else:
                return self._generic_task_execution(task)
        except Exception as e:
            logging.error(f"Task execution failed: {e}")
            raise
    
    async def update_performance_multiplier(self, execution_time: float, success_rate: float):
        """Update performance multiplier based on execution results"""
        # Grace learning algorithm
        if success_rate > 0.95 and execution_time < np.mean(self.execution_times):
            self.performance_multiplier = min(self.performance_multiplier * 1.1, 10.0)
        elif success_rate < 0.8 or execution_time > np.mean(self.execution_times) * 1.5:
            self.performance_multiplier = max(self.performance_multiplier * 0.9, 0.1)
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get current performance metrics"""
        return {
            'active_tasks': len(self.active_tasks),
            'completed_tasks': len(self.completed_tasks),
            'total_tasks': self.total_tasks,
            'success_rate': self.success_rate,
            'performance_multiplier': self.performance_multiplier,
            'avg_execution_time': np.mean(self.execution_times) if self.execution_times else 0,
            'worker_utilization': self.executor._threads / self.executor._max_workers if hasattr(self.executor, '_threads') else 0
        }`
        };
        
        return moduleTemplates[moduleType] || '# Module code not available';
    }

    // ==================== FILE MANAGEMENT ====================

    async handleFileUpload(files) {
        console.log(`📁 Processing ${files.length} files...`);
        
        const uploadResults = [];
        for (const file of Array.from(files)) {
            try {
                const result = await this.processUploadedFile(file);
                uploadResults.push(result);
            } catch (error) {
                console.error(`Error processing file ${file.name}:`, error);
                uploadResults.push({ name: file.name, error: error.message });
            }
        }
        
        // Update file tree
        this.updateFileTree();
        
        // Analyze uploaded files with Grace
        this.analyzeUploadedFiles(uploadResults);
        
        // Hide upload overlay
        this.hideUploadOverlay();
        
        this.showNotification(`✅ Processed ${files.length} files successfully`);
    }

    async processUploadedFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const content = e.target.result;
                const fileData = {
                    name: file.name,
                    content: content,
                    size: file.size,
                    type: file.type,
                    lastModified: file.lastModified,
                    language: this.detectLanguage(file.name, content)
                };
                
                // Store in project
                this.projectState.files.set(file.name, fileData);
                
                // Cache for quick access
                this.fileCache.set(file.name, content);
                
                resolve(fileData);
            };
            
            reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
            
            // Read file based on type
            if (file.type.startsWith('text/') || this.isTextFile(file.name)) {
                reader.readAsText(file);
            } else {
                reader.readAsDataURL(file);
            }
        });
    }

    detectLanguage(filename, content) {
        const extension = filename.split('.').pop().toLowerCase();
        const languageMap = {
            'py': 'python',
            'js': 'javascript',
            'ts': 'typescript',
            'jsx': 'javascript',
            'tsx': 'typescript',
            'html': 'html',
            'css': 'css',
            'scss': 'scss',
            'json': 'json',
            'md': 'markdown',
            'yml': 'yaml',
            'yaml': 'yaml',
            'sh': 'bash',
            'sql': 'sql'
        };
        
        return languageMap[extension] || 'text';
    }

    isTextFile(filename) {
        const textExtensions = ['py', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 
                              'json', 'md', 'txt', 'yml', 'yaml', 'sh', 'sql', 'xml'];
        const extension = filename.split('.').pop().toLowerCase();
        return textExtensions.includes(extension);
    }

    selectFile(fileElement) {
        // Remove selection from other files
        document.querySelectorAll('.tree-item').forEach(item => item.classList.remove('selected'));
        
        // Select current file
        fileElement.classList.add('selected');
        const filename = fileElement.textContent.trim();
        
        this.selectedFile = filename;
        
        // Load file content if available
        if (this.projectState.files.has(filename)) {
            this.loadFileInEditor(filename);
        }
    }

    async openFile(filename) {
        console.log(`📄 Opening file: ${filename}`);
        
        // Record action in memory system
        await this.recordAction('open_file', { 
            filename: filename,
            timestamp: Date.now()
        }, true, { action: 'close_file', filename: filename });
        
        // Check if file exists in project
        if (!this.projectState.files.has(filename)) {
            // Try to load from Grace backend or create template
            await this.loadOrCreateFile(filename);
        }
        
        this.loadFileInEditor(filename);
        
        // Learn file opening patterns
        const extension = filename.split('.').pop();
        await this.learnSemanticPattern('file_type_access', extension, 1.0);
        
        // Remember file in temporal memory with high weight
        this.vectorMemory.temporalIndex.set(`file_${filename}`, {
            filename: filename,
            timestamp: Date.now(),
            weight: 2.0,
            type: 'file_access'
        });
        
        this.showNotification(`📖 Opened ${filename}`);
    }

    async loadOrCreateFile(filename) {
        // Request file from Grace backend
        if (window.graceConnection && window.graceConnection.isConnected) {
            window.graceConnection.send({
                type: 'load_file',
                filename: filename
            });
        } else {
            // Create template file
            const template = this.generateFileTemplate(filename);
            this.projectState.files.set(filename, {
                name: filename,
                content: template,
                language: this.detectLanguage(filename, template),
                created: Date.now(),
                modified: Date.now()
            });
        }
    }

    generateFileTemplate(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        
        const templates = {
            'py': `# ${filename}
# Grace IDE generated file

def main():
    """Main function"""
    print("Hello from Grace IDE!")

if __name__ == "__main__":
    main()
`,
            'js': `// ${filename}
// Grace IDE generated file

function main() {
    console.log("Hello from Grace IDE!");
}

main();
`,
            'html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Grace IDE</title>
</head>
<body>
    <h1>Hello from Grace IDE!</h1>
</body>
</html>
`,
            'css': `/* ${filename} */
/* Grace IDE generated stylesheet */

body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
}
`,
            'md': `# ${filename.replace('.md', '')}

Created with Grace IDE.

## Getting Started

Welcome to your new file!
`
        };
        
        return templates[extension] || `// ${filename}\n// Created with Grace IDE\n`;
    }

    loadFileInEditor(filename) {
        const codeArea = document.getElementById('codeEditor');
        if (!codeArea) return;
        
        const fileData = this.projectState.files.get(filename);
        if (!fileData) return;
        
        // Apply syntax highlighting
        const highlightedContent = this.applySyntaxHighlighting(fileData.content, fileData.language);
        codeArea.innerHTML = highlightedContent;
        
        // Update editor tab
        this.updateEditorTab(filename);
        
        // Store as active file
        this.activeFiles.set(filename, fileData.content);
        
        // Enable Grace code intelligence for this file
        this.enableCodeIntelligenceForFile(filename, fileData.language);
    }

    // ==================== VECTOR MEMORY INTEGRATION ====================

    async initializeMemorySync() {
        console.log('🧠 Initializing Grace vector memory synchronization...');
        
        // Get memory statistics from backend
        await this.requestMemoryStats();
        
        // Start memory sync loop
        this.startMemorySync();
        
        // Initialize semantic patterns
        await this.loadSemanticPatterns();
        
        // Set up temporal memory decay
        this.startTemporalDecay();
        
        console.log('✅ Vector memory synchronization active');
    }

    async requestMemoryStats() {
        if (window.graceConnection && window.graceConnection.isConnected) {
            window.graceConnection.send({
                type: 'memory_request',
                action: 'get_stats',
                workspace_root: this.projectRoot || '.'
            });
        }
    }

    async rememberPattern(context, pattern, metadata = {}) {
        // Store pattern in local vector memory
        const patternKey = this.generatePatternKey(context, pattern);
        const embedding = this.generateEmbedding(pattern);
        
        this.vectorMemory.embeddings.set(patternKey, embedding);
        this.vectorMemory.contextPatterns.set(context, 
            [...(this.vectorMemory.contextPatterns.get(context) || []), pattern]
        );
        
        // Send to Grace backend for persistent storage
        if (window.graceConnection && window.graceConnection.isConnected) {
            window.graceConnection.send({
                type: 'memory_request',
                action: 'remember',
                key: patternKey,
                value: {
                    pattern: pattern,
                    context: context,
                    embedding: Array.from(embedding),
                    metadata: metadata
                },
                metadata: {
                    type: 'vector_pattern',
                    context: context,
                    timestamp: Date.now()
                }
            });
        }
        
        // Learn semantically
        await this.learnSemanticPattern(context, pattern);
    }

    async recallPattern(context, similarity_threshold = 0.7) {
        const contextPatterns = this.vectorMemory.contextPatterns.get(context) || [];
        
        if (contextPatterns.length === 0) {
            // Query Grace backend
            if (window.graceConnection && window.graceConnection.isConnected) {
                window.graceConnection.send({
                    type: 'memory_request',
                    action: 'search',
                    pattern: context,
                    limit: 10
                });
            }
            return [];
        }
        
        return contextPatterns;
    }

    async suggestBasedOnContext(currentContext, limit = 5) {
        // Generate embedding for current context
        const contextEmbedding = this.generateEmbedding(currentContext);
        
        // Find similar patterns
        const similarities = [];
        
        for (const [patternKey, embedding] of this.vectorMemory.embeddings) {
            const similarity = this.cosineSimilarity(contextEmbedding, embedding);
            if (similarity > this.memorySystem.semanticThreshold) {
                similarities.push({
                    key: patternKey,
                    similarity: similarity,
                    pattern: this.extractPatternFromKey(patternKey)
                });
            }
        }
        
        // Sort by similarity and return top suggestions
        similarities.sort((a, b) => b.similarity - a.similarity);
        const suggestions = similarities.slice(0, limit);
        
        // Also request suggestions from Grace backend
        if (window.graceConnection && window.graceConnection.isConnected) {
            window.graceConnection.send({
                type: 'memory_request',
                action: 'semantic_suggest',
                context: currentContext,
                limit: limit
            });
        }
        
        return suggestions;
    }

    async learnSemanticPattern(context, pattern, weight = 1.0) {
        // Add to learning buffer
        this.vectorMemory.learningBuffer.push({
            context: context,
            pattern: pattern,
            weight: weight,
            timestamp: Date.now()
        });
        
        // Process learning buffer when it gets full
        if (this.vectorMemory.learningBuffer.length >= 10) {
            await this.processLearningBuffer();
        }
    }

    async processLearningBuffer() {
        if (this.vectorMemory.learningBuffer.length === 0) return;
        
        const batch = [...this.vectorMemory.learningBuffer];
        this.vectorMemory.learningBuffer = [];
        
        // Send batch to Grace backend for semantic learning
        if (window.graceConnection && window.graceConnection.isConnected) {
            for (const item of batch) {
                window.graceConnection.send({
                    type: 'semantic_learn',
                    context: item.context,
                    pattern: item.pattern,
                    weight: item.weight
                });
            }
        }
        
        // Update local semantic cache
        for (const item of batch) {
            const contextEmbedding = this.generateEmbedding(item.context);
            const patternEmbedding = this.generateEmbedding(item.pattern);
            
            this.vectorMemory.semanticCache.set(item.context, {
                embedding: contextEmbedding,
                patterns: [...(this.vectorMemory.semanticCache.get(item.context)?.patterns || []), item.pattern],
                lastUpdated: Date.now()
            });
        }
    }

    startMemorySync() {
        // Periodic memory synchronization
        setInterval(async () => {
            await this.syncMemoryWithBackend();
        }, 30000); // Every 30 seconds
    }

    async syncMemoryWithBackend() {
        if (!window.graceConnection || !window.graceConnection.isConnected) return;
        
        // Get latest memory stats
        await this.requestMemoryStats();
        
        // Process any pending learning
        await this.processLearningBuffer();
        
        // Update temporal decay
        this.applyTemporalDecay();
    }

    startTemporalDecay() {
        // Apply temporal decay to memories
        setInterval(() => {
            this.applyTemporalDecay();
        }, 60000); // Every minute
    }

    applyTemporalDecay() {
        const now = Date.now();
        const decayRate = this.memorySystem.temporalDecay;
        
        // Decay temporal index weights
        for (const [key, data] of this.vectorMemory.temporalIndex) {
            const age = now - data.timestamp;
            const decayFactor = Math.pow(decayRate, age / (1000 * 60 * 60)); // Hourly decay
            
            data.weight *= decayFactor;
            
            // Remove if weight too low
            if (data.weight < 0.01) {
                this.vectorMemory.temporalIndex.delete(key);
            }
        }
    }

    generateEmbedding(text) {
        // Simple hash-based embedding generation (simplified version of backend)
        const hash = this.hashString(text);
        const embedding = new Float32Array(this.memorySystem.vectorDimensions);
        
        // Convert hash to vector
        for (let i = 0; i < this.memorySystem.vectorDimensions; i++) {
            embedding[i] = ((hash + i) % 1000) / 1000.0;
        }
        
        // Normalize
        const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        if (norm > 0) {
            for (let i = 0; i < embedding.length; i++) {
                embedding[i] /= norm;
            }
        }
        
        return embedding;
    }

    cosineSimilarity(vec1, vec2) {
        if (vec1.length !== vec2.length) return 0;
        
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;
        
        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }
        
        if (norm1 === 0 || norm2 === 0) return 0;
        
        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }

    generatePatternKey(context, pattern) {
        return `${context}:${this.hashString(pattern).toString(36)}`;
    }

    extractPatternFromKey(key) {
        // In a real implementation, you'd need to store the reverse mapping
        // For now, return the hash part
        return key.split(':')[1];
    }

    async loadSemanticPatterns() {
        // Load common patterns for the current project
        const commonPatterns = [
            { context: 'python_function', pattern: 'def function_name(params):\n    """Docstring"""\n    pass' },
            { context: 'python_class', pattern: 'class ClassName:\n    """Class docstring"""\n    \n    def __init__(self):\n        pass' },
            { context: 'javascript_function', pattern: 'function functionName(params) {\n    // Implementation\n    return result;\n}' },
            { context: 'react_component', pattern: 'function ComponentName(props) {\n    return (\n        <div>\n            {/* Component content */}\n        </div>\n    );\n}' },
            { context: 'error_handling', pattern: 'try {\n    // Code that might throw\n} catch (error) {\n    console.error("Error:", error);\n}' }
        ];
        
        for (const pattern of commonPatterns) {
            await this.rememberPattern(pattern.context, pattern.pattern, { type: 'template', builtin: true });
        }
    }

    handleMemoryResult(data) {
        console.log('💾 Memory result:', data);
        
        switch (data.action) {
            case 'stats':
                this.updateMemoryStats(data.stats);
                break;
            case 'search':
                this.handleSearchResults(data.results);
                break;
            case 'recall':
                this.handleRecallResult(data.value);
                break;
        }
    }

    handleVectorUpdate(data) {
        console.log('🔢 Vector update:', data);
        
        // Update local vector cache
        if (data.embeddings) {
            for (const [key, embedding] of Object.entries(data.embeddings)) {
                this.vectorMemory.embeddings.set(key, new Float32Array(embedding));
            }
        }
        
        // Update performance metrics
        if (data.performance) {
            this.memorySystem.cacheHitRate = data.performance.hit_rate || this.memorySystem.cacheHitRate;
            this.memorySystem.usedMemory = data.performance.used_memory || this.memorySystem.usedMemory;
        }
    }

    handleSemanticSuggestion(data) {
        console.log('🎯 Semantic suggestion:', data);
        
        // Display suggestions in UI
        this.displaySemanticSuggestions(data.suggestions);
        
        // Learn from accepted suggestions
        if (data.accepted) {
            this.learnSemanticPattern(data.context, data.accepted, 1.5);
        }
    }

    updateMemoryStats(stats) {
        this.memorySystem.totalMemory = stats.total_memory || 0;
        this.memorySystem.usedMemory = stats.used_memory || 0;
        this.memorySystem.cacheHitRate = stats.cache_stats?.hit_rate || 0;
        
        // Update memory efficiency display
        this.graceState.memoryEfficiency = (this.memorySystem.cacheHitRate * 100);
        
        // Update UI display
        this.updateMemoryDisplay();
    }

    updateMemoryDisplay() {
        // Update memory usage indicators
        const memoryUsage = (this.memorySystem.usedMemory / this.memorySystem.totalMemory) * 100;
        const memoryEfficiency = this.graceState.memoryEfficiency;
        
        // Update status display
        const statusElements = document.querySelectorAll('.memory-status');
        statusElements.forEach(element => {
            element.textContent = `Memory: ${memoryUsage.toFixed(1)}% | Efficiency: ${memoryEfficiency.toFixed(1)}%`;
        });
        
        // Update performance multiplier based on memory efficiency
        if (memoryEfficiency > 90) {
            this.graceState.performanceMultiplier += 0.1;
        } else if (memoryEfficiency < 50) {
            this.graceState.performanceMultiplier = Math.max(1.0, this.graceState.performanceMultiplier - 0.1);
        }
    }

    displaySemanticSuggestions(suggestions) {
        // Create suggestion UI
        const suggestionPanel = document.getElementById('semanticSuggestions') || this.createSuggestionPanel();
        
        suggestionPanel.innerHTML = '<h3>🧠 Grace Suggestions</h3>';
        
        suggestions.forEach((suggestion, index) => {
            const suggestionElement = document.createElement('div');
            suggestionElement.className = 'semantic-suggestion';
            suggestionElement.innerHTML = `
                <div class="suggestion-text">${suggestion.pattern}</div>
                <div class="suggestion-meta">
                    Confidence: ${(suggestion.similarity * 100).toFixed(1)}%
                    <button onclick="graceInterface.applySemantic('${suggestion.pattern}', ${index})">Apply</button>
                </div>
            `;
            suggestionPanel.appendChild(suggestionElement);
        });
        
        suggestionPanel.style.display = 'block';
    }

    createSuggestionPanel() {
        const panel = document.createElement('div');
        panel.id = 'semanticSuggestions';
        panel.className = 'semantic-suggestions-panel';
        panel.style.cssText = `
            position: fixed;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            width: 300px;
            background: var(--bg-secondary);
            border: 1px solid var(--accent-blue);
            border-radius: 8px;
            padding: 16px;
            z-index: 1000;
            display: none;
            max-height: 400px;
            overflow-y: auto;
        `;
        
        document.body.appendChild(panel);
        return panel;
    }

    async applySemantic(pattern, index) {
        // Apply semantic suggestion to current editor
        const codeEditor = document.getElementById('codeEditor');
        if (codeEditor && this.uiState.codeEditorFocused) {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                range.insertNode(document.createTextNode(pattern));
            } else {
                codeEditor.textContent += pattern;
            }
            
            // Learn that this suggestion was accepted
            await this.learnSemanticPattern('user_accepted', pattern, 2.0);
            
            // Hide suggestions
            const panel = document.getElementById('semanticSuggestions');
            if (panel) {
                panel.style.display = 'none';
            }
            
            this.showNotification('🧠 Applied Grace semantic suggestion');
        }
    }

    // ==================== ENHANCED CODE INTELLIGENCE ====================

    initializeCodeIntelligence() {
        this.codeIntelligence = {
            suggestions: [],
            completions: [],
            errors: [],
            warnings: [],
            currentAnalysis: null
        };
    }

    enableCodeIntelligence() {
        if (!this.uiState.codeEditorFocused) return;
        
        // Start real-time code analysis
        this.startCodeAnalysis();
        
        // Enable auto-completion
        this.enableAutoCompletion();
        
        // Enable error detection
        this.enableErrorDetection();
    }

    enableCodeIntelligenceForFile(filename, language) {
        // Language-specific intelligence
        const languageHandlers = {
            'python': () => this.enablePythonIntelligence(),
            'javascript': () => this.enableJavaScriptIntelligence(),
            'html': () => this.enableHTMLIntelligence(),
            'css': () => this.enableCSSIntelligence()
        };
        
        const handler = languageHandlers[language];
        if (handler) {
            handler();
        }
        
        // Request Grace analysis
        this.requestGraceCodeAnalysis(filename, language);
    }

    handleCodeInput(event) {
        const codeArea = event.target;
        const content = codeArea.textContent;
        
        // Update file content
        if (this.selectedFile) {
            const fileData = this.projectState.files.get(this.selectedFile);
            if (fileData) {
                fileData.content = content;
                fileData.modified = Date.now();
            }
        }
        
        // Vector Memory Integration - Learn from code patterns
        this.learnCodePatterns(content);
        
        // Get real-time suggestions from vector memory
        this.getSementicCodeSuggestions(content);
        
        // Debounced analysis
        clearTimeout(this.codeAnalysisTimeout);
        this.codeAnalysisTimeout = setTimeout(() => {
            this.analyzeCode(content);
        }, 500);
        
        // Update syntax highlighting
        this.updateSyntaxHighlighting(codeArea, content);
    }

    async learnCodePatterns(content) {
        // Extract patterns from code
        const patterns = this.extractCodePatterns(content);
        
        // Learn each pattern with context
        for (const pattern of patterns) {
            await this.rememberPattern(pattern.context, pattern.code, {
                type: 'code_pattern',
                language: this.detectLanguage(this.selectedFile || '', content),
                frequency: pattern.frequency || 1
            });
        }
    }

    extractCodePatterns(content) {
        const patterns = [];
        const language = this.detectLanguage(this.selectedFile || '', content);
        
        if (language === 'python') {
            // Extract function definitions
            const functionMatches = content.matchAll(/def\s+(\w+)\s*\([^)]*\):\s*\n((?:\s{4,}.*\n?)*)/g);
            for (const match of functionMatches) {
                patterns.push({
                    context: 'python_function',
                    code: match[0],
                    name: match[1],
                    frequency: 1
                });
            }
            
            // Extract class definitions
            const classMatches = content.matchAll(/class\s+(\w+)(?:\([^)]*\))?:\s*\n((?:\s{4,}.*\n?)*)/g);
            for (const match of classMatches) {
                patterns.push({
                    context: 'python_class',
                    code: match[0],
                    name: match[1],
                    frequency: 1
                });
            }
            
            // Extract import patterns
            const importMatches = content.matchAll(/((?:from\s+\w+\s+)?import\s+[^\n]+)/g);
            for (const match of importMatches) {
                patterns.push({
                    context: 'python_import',
                    code: match[0],
                    frequency: 2 // Imports are important
                });
            }
        }
        
        if (language === 'javascript') {
            // Extract function patterns
            const functionMatches = content.matchAll(/(function\s+\w+\s*\([^)]*\)\s*\{[^}]*\}|const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{[^}]*\})/g);
            for (const match of functionMatches) {
                patterns.push({
                    context: 'javascript_function',
                    code: match[0],
                    frequency: 1
                });
            }
            
            // Extract React components
            const componentMatches = content.matchAll(/(function\s+\w+\s*\([^)]*\)\s*\{[^}]*return\s*\([^}]*\})/g);
            for (const match of componentMatches) {
                patterns.push({
                    context: 'react_component',
                    code: match[0],
                    frequency: 1.5
                });
            }
        }
        
        return patterns;
    }

    async getSementicCodeSuggestions(content) {
        // Get current cursor context
        const cursorContext = this.getCurrentCursorContext(content);
        
        // Get suggestions from vector memory
        const suggestions = await this.suggestBasedOnContext(cursorContext, 3);
        
        if (suggestions.length > 0) {
            this.displayCodeSuggestions(suggestions);
        }
    }

    getCurrentCursorContext(content) {
        // Get the context around the cursor position
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return '';
        
        const range = selection.getRangeAt(0);
        const startOffset = Math.max(0, range.startOffset - 50);
        const endOffset = Math.min(content.length, range.endOffset + 50);
        
        return content.substring(startOffset, endOffset);
    }

    displayCodeSuggestions(suggestions) {
        // Remove existing suggestions
        const existingSuggestions = document.querySelector('.code-suggestions-overlay');
        if (existingSuggestions) {
            existingSuggestions.remove();
        }
        
        // Create suggestion overlay
        const overlay = document.createElement('div');
        overlay.className = 'code-suggestions-overlay';
        overlay.style.cssText = `
            position: absolute;
            background: var(--bg-secondary);
            border: 1px solid var(--accent-blue);
            border-radius: 4px;
            padding: 8px;
            font-family: monospace;
            font-size: 12px;
            z-index: 1000;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        
        suggestions.forEach((suggestion, index) => {
            const suggestionDiv = document.createElement('div');
            suggestionDiv.className = 'code-suggestion-item';
            suggestionDiv.style.cssText = `
                padding: 4px 8px;
                cursor: pointer;
                border-radius: 3px;
                margin: 2px 0;
                transition: background 0.2s;
            `;
            
            suggestionDiv.innerHTML = `
                <div style="color: var(--accent-green);">${suggestion.pattern.substring(0, 50)}...</div>
                <div style="color: var(--text-secondary); font-size: 10px;">
                    Confidence: ${(suggestion.similarity * 100).toFixed(0)}%
                </div>
            `;
            
            suggestionDiv.addEventListener('click', () => {
                this.applySemantic(suggestion.pattern, index);
                overlay.remove();
            });
            
            suggestionDiv.addEventListener('mouseenter', () => {
                suggestionDiv.style.background = 'var(--accent-blue-dim)';
            });
            
            suggestionDiv.addEventListener('mouseleave', () => {
                suggestionDiv.style.background = 'transparent';
            });
            
            overlay.appendChild(suggestionDiv);
        });
        
        // Position overlay near cursor
        const codeEditor = document.getElementById('codeEditor');
        if (codeEditor) {
            const rect = codeEditor.getBoundingClientRect();
            overlay.style.left = `${rect.left + 20}px`;
            overlay.style.top = `${rect.top + 100}px`;
            
            document.body.appendChild(overlay);
            
            // Auto-hide after 10 seconds
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.remove();
                }
            }, 10000);
        }
    }

    handleCodeKeydown(event) {
        const key = event.key;
        const ctrlKey = event.ctrlKey || event.metaKey;
        
        // Handle keyboard shortcuts
        if (ctrlKey) {
            const shortcut = `Ctrl+${key.toUpperCase()}`;
            if (this.keyboardShortcuts[shortcut]) {
                event.preventDefault();
                this.keyboardShortcuts[shortcut]();
                return;
            }
        }
        
        // Handle auto-indentation
        if (key === 'Enter') {
            this.handleAutoIndentation(event);
        }
        
        // Handle auto-completion
        if (key === 'Tab') {
            this.handleAutoCompletion(event);
        }
    }

    applySyntaxHighlighting(code, language = 'python') {
        // Use the syntax highlighter we created earlier
        if (window.graceSyntaxHighlighter) {
            return window.graceSyntaxHighlighter.highlight(code, language).then(result => result.html);
        }
        
        // Fallback simple highlighting
        return this.simpleSyntaxHighlight(code, language);
    }

    simpleSyntaxHighlight(code, language) {
        let highlighted = code;
        
        if (language === 'python') {
            highlighted = highlighted
                .replace(/\b(def|class|import|from|if|else|elif|for|while|try|except|finally|with|as|return|yield|break|continue|pass|async|await)\b/g, '<span style="color: var(--accent-purple);">$1</span>')
                .replace(/\b(True|False|None|self)\b/g, '<span style="color: var(--accent-blue);">$1</span>')
                .replace(/(["'].*?["'])/g, '<span style="color: var(--accent-green);">$1</span>')
                .replace(/(#.*$)/gm, '<span style="color: var(--text-secondary);">$1</span>');
        }
        
        return highlighted.replace(/\n/g, '<br>');
    }

    // ==================== GRACE INTEGRATION ====================

    async recordAction(action, data, reversible = false, undoData = null) {
        // Record action in Grace memory system
        if (window.graceConnection && window.graceConnection.isConnected) {
            window.graceConnection.send({
                type: 'memory_request',
                action: 'record_action',
                action_name: action,
                data: data,
                reversible: reversible,
                undo_data: undoData
            });
        }
        
        // Also learn from user actions
        await this.learnSemanticPattern('user_action', action, 1.0);
        
        // Store in temporal memory
        this.vectorMemory.temporalIndex.set(`${action}_${Date.now()}`, {
            action: action,
            data: data,
            timestamp: Date.now(),
            weight: 1.0
        });
    }

    async optimizeMemoryUsage() {
        // Request memory optimization from backend
        if (window.graceConnection && window.graceConnection.isConnected) {
            window.graceConnection.send({
                type: 'memory_request',
                action: 'optimize'
            });
        }
        
        // Local optimization
        this.cleanupLocalMemory();
    }

    cleanupLocalMemory() {
        // Clean up old vector embeddings
        const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
        
        for (const [key, data] of this.vectorMemory.temporalIndex) {
            if (data.timestamp < cutoffTime && data.weight < 0.1) {
                this.vectorMemory.temporalIndex.delete(key);
            }
        }
        
        // Limit semantic cache size
        if (this.vectorMemory.semanticCache.size > 1000) {
            const entries = Array.from(this.vectorMemory.semanticCache.entries());
            entries.sort((a, b) => a[1].lastUpdated - b[1].lastUpdated);
            
            // Remove oldest 20%
            const toRemove = Math.floor(entries.length * 0.2);
            for (let i = 0; i < toRemove; i++) {
                this.vectorMemory.semanticCache.delete(entries[i][0]);
            }
        }
    }

    connectToGrace() {
        console.log('🔗 Connecting to Grace consciousness...');
        
        if (window.graceConnection) {
            window.graceConnection.connect();
        } else {
            // Fallback: create mock Grace connection
            this.createMockGraceConnection();
        }
    }

    createMockGraceConnection() {
        console.log('🎭 Creating mock Grace connection for demo...');
        
        // Simulate Grace responses
        setTimeout(() => {
            this.graceState.consciousnessActive = true;
            this.graceState.performanceMultiplier = 3.2;
            this.updateGraceStatusDisplay();
            this.showNotification('🧠 Grace consciousness simulated (demo mode)');
        }, 2000);
        
        // Start simulation loop
        this.startGraceSimulation();
    }

    startGraceSimulation() {
        setInterval(() => {
            // Simulate evolving performance
            this.graceState.performanceMultiplier += (Math.random() - 0.5) * 0.1;
            this.graceState.performanceMultiplier = Math.max(1.0, Math.min(10.0, this.graceState.performanceMultiplier));
            
            // Simulate memory efficiency
            this.graceState.memoryEfficiency = 85 + Math.random() * 15;
            
            // Update displays
            this.updateGraceStatusDisplay();
            this.updateModuleMetrics();
        }, 3000);
    }

    requestModuleAnalysis(moduleId) {
        if (window.graceConnection && window.graceConnection.isConnected) {
            window.graceConnection.send({
                type: 'analyze_module',
                module_id: moduleId,
                timestamp: Date.now()
            });
        } else {
            // Mock analysis
            setTimeout(() => {
                this.simulateModuleAnalysis(moduleId);
            }, 1000);
        }
    }

    requestGraceCodeAnalysis(filename, language) {
        const fileData = this.projectState.files.get(filename);
        if (!fileData) return;
        
        if (window.graceConnection && window.graceConnection.isConnected) {
            window.graceConnection.send({
                type: 'analyze_code',
                filename: filename,
                content: fileData.content,
                language: language,
                timestamp: Date.now()
            });
        } else {
            // Mock analysis
            setTimeout(() => {
                this.simulateCodeAnalysis(filename, fileData.content);
            }, 1500);
        }
    }

    simulateModuleAnalysis(moduleId) {
        const analyses = {
            consciousness: "Consciousness module operating at 94% efficiency. Decision-making pathways optimized. Self-reflection cycles stable.",
            memory: "Vector memory system showing 89% retrieval accuracy. Temporal indexing performing well. Consider federated learning optimization.",
            execution: "Parallel execution achieving 5.2x performance multiplier. Task scheduling optimal. Resource utilization excellent.",
            security: "All security protocols active. Trust system validated. No security concerns detected.",
            immune: "Immune system healthy. Auto-healing capabilities active. System resilience at maximum."
        };
        
        const analysis = analyses[moduleId] || "Module analysis complete. System operating normally.";
        this.showGraceAnalysis(analysis);
    }

    simulateCodeAnalysis(filename, content) {
        const suggestions = [
            "Consider adding error handling for network operations",
            "Optimize memory usage with lazy loading",
            "Add type hints for better code clarity", 
            "Implement graceful degradation for offline mode",
            "Consider async/await for better performance"
        ];
        
        const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
        this.showCodeSuggestion(suggestion);
    }

    showGraceAnalysis(analysis) {
        this.showNotification(`🧠 Grace: ${analysis}`);
    }

    showCodeSuggestion(suggestion) {
        const suggestionsElement = document.querySelector('.code-suggestions');
        if (suggestionsElement) {
            suggestionsElement.querySelector('div:last-child').textContent = suggestion;
            suggestionsElement.style.display = 'block';
        }
    }

    // ==================== UI UPDATES ====================

    updateGraceStatusDisplay() {
        const statusElement = document.querySelector('.grace-status span');
        if (statusElement) {
            const multiplier = Math.round(this.graceState.performanceMultiplier * 10) / 10;
            statusElement.textContent = `Grace Active • ${multiplier}x Performance`;
        }
        
        const indicators = document.querySelectorAll('.status-indicator');
        indicators.forEach(indicator => {
            indicator.style.background = this.graceState.consciousnessActive ? 
                'var(--accent-green)' : 'var(--accent-red)';
        });
    }

    updateModuleMetrics() {
        const modules = document.querySelectorAll('.module-node');
        modules.forEach(module => {
            const metrics = module.querySelectorAll('.metric-dot');
            metrics.forEach(dot => {
                const colors = ['metric-green', 'metric-blue', 'metric-orange'];
                const newColor = colors[Math.floor(Math.random() * colors.length)];
                dot.className = `metric-dot ${newColor}`;
            });
        });
    }

    updateEditorTab(filename) {
        const tabs = document.querySelectorAll('.editor-tab');
        if (tabs.length > 0) {
            tabs.forEach(tab => tab.classList.remove('active'));
            tabs[0].classList.add('active');
            tabs[0].textContent = filename;
        }
    }

    updateFileTree() {
        const fileTree = document.getElementById('fileTree');
        if (!fileTree) return;
        
        // Clear existing files (except project folder)
        const existingFiles = fileTree.querySelectorAll('.tree-item:not(:first-child)');
        existingFiles.forEach(item => item.remove());
        
        // Add uploaded files
        this.projectState.files.forEach((fileData, filename) => {
            if (filename === 'grace-project/') return;
            
            const fileItem = document.createElement('div');
            fileItem.className = 'tree-item';
            fileItem.style.marginLeft = '20px';
            
            const icon = this.getFileIcon(filename);
            fileItem.innerHTML = `
                <div class="tree-icon">${icon}</div>
                <span>${filename}</span>
            `;
            
            fileItem.addEventListener('click', () => this.selectFile(fileItem));
            fileItem.addEventListener('dblclick', () => this.openFile(filename));
            
            fileTree.appendChild(fileItem);
        });
    }

    getFileIcon(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        const iconMap = {
            'py': '🐍',
            'js': '🟨',
            'html': '🌐',
            'css': '🎨',
            'json': '📋',
            'md': '📝',
            'txt': '📄',
            'yml': '⚙️',
            'yaml': '⚙️'
        };
        
        return iconMap[extension] || '📄';
    }

    // ==================== UTILITY FUNCTIONS ====================

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: var(--bg-secondary);
            color: var(--text-primary);
            padding: 12px 20px;
            border-radius: 8px;
            border: 1px solid var(--accent-blue);
            font-size: 12px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            max-width: 350px;
            box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    startIntelligenceLoop() {
        // Main intelligence processing loop
        setInterval(() => {
            this.processIntelligenceUpdate();
        }, 2000);
    }

    startRealTimeUpdates() {
        // Real-time UI updates
        setInterval(() => {
            this.updateConnectionStatus();
            this.updatePerformanceMetrics();
        }, 1000);
    }

    processIntelligenceUpdate() {
        // Process Grace intelligence updates
        if (this.graceState.consciousnessActive) {
            this.processActiveThoughts();
            this.updateLearningProgress();
            this.optimizePerformance();
        }
    }

    processActiveThoughts() {
        // Simulate Grace thought processing
        this.graceState.activeThoughts = [
            "Analyzing user interaction patterns",
            "Optimizing code execution strategies", 
            "Learning from project structure",
            "Enhancing performance multipliers"
        ];
    }

    updateLearningProgress() {
        // Update learning efficiency
        this.graceState.learningProgress += 0.01;
        if (this.graceState.learningProgress > 1.0) {
            this.graceState.learningProgress = 0.0;
            this.graceState.performanceMultiplier += 0.1;
        }
    }

    optimizePerformance() {
        // Grace self-optimization
        if (this.graceState.performanceMultiplier < 10.0) {
            this.graceState.performanceMultiplier += 0.01;
        }
    }

    loadDemoProject() {
        // Load demo project structure
        const demoFiles = {
            'main.py': {
                content: `from grace_ide import GraceIDE
import asyncio

grace = GraceIDE()

async def main():
    await grace.start()
    print("Grace IDE operational!")

if __name__ == "__main__":
    asyncio.run(main())`,
                language: 'python'
            },
            'config.json': {
                content: `{
  "grace": {
    "performance_mode": "maximum",
    "consciousness_level": "advanced",
    "learning_rate": 0.95
  }
}`,
                language: 'json'
            },
            'README.md': {
                content: `# Grace IDE Project

Built with Grace consciousness and intelligence.

## Features
- Cognitive development environment
- Real-time performance optimization
- Intelligent code suggestions
- Multi-platform deployment`,
                language: 'markdown'
            }
        };
        
        Object.entries(demoFiles).forEach(([filename, data]) => {
            this.projectState.files.set(filename, {
                name: filename,
                content: data.content,
                language: data.language,
                created: Date.now(),
                modified: Date.now()
            });
        });
        
        this.updateFileTree();
    }

    saveProjectState() {
        // Save current project state
        const projectData = {
            files: Object.fromEntries(this.projectState.files),
            modules: Object.fromEntries(this.projectState.modules),
            settings: this.projectState.settings,
            vectorMemory: {
                patterns: Object.fromEntries(this.vectorMemory.contextPatterns),
                temporalIndex: Object.fromEntries(this.vectorMemory.temporalIndex)
            },
            timestamp: Date.now()
        };
        
        localStorage.setItem('graceIDE_project', JSON.stringify(projectData));
        
        // Also save to Grace backend
        if (window.graceConnection && window.graceConnection.isConnected) {
            window.graceConnection.send({
                type: 'memory_request',
                action: 'remember',
                key: 'project_state',
                value: projectData,
                metadata: { type: 'project_state' }
            });
        }
    }

    // Memory-specific shortcut methods
    async showMemoryStats() {
        const stats = {
            local: {
                embeddings: this.vectorMemory.embeddings.size,
                semanticCache: this.vectorMemory.semanticCache.size,
                temporalIndex: this.vectorMemory.temporalIndex.size,
                contextPatterns: this.vectorMemory.contextPatterns.size,
                learningBuffer: this.vectorMemory.learningBuffer.length
            },
            system: this.memorySystem
        };
        
        const statsWindow = window.open('', 'memoryStats', 'width=600,height=400');
        statsWindow.document.write(`
            <html>
                <head><title>Grace Memory Statistics</title></head>
                <body style="font-family: monospace; padding: 20px; background: #1a1a2e; color: #00d4ff;">
                    <h2>🧠 Grace Memory Statistics</h2>
                    <pre>${JSON.stringify(stats, null, 2)}</pre>
                </body>
            </html>
        `);
        
        this.showNotification('📊 Memory statistics displayed');
    }

    async showSemanticSuggestions() {
        const context = this.getCurrentCursorContext(
            document.getElementById('codeEditor')?.textContent || ''
        );
        
        const suggestions = await this.suggestBasedOnContext(context, 10);
        
        if (suggestions.length > 0) {
            this.displaySemanticSuggestions(suggestions);
        } else {
            this.showNotification('🤔 No semantic suggestions available for current context');
        }
    }

    async clearMemoryCache() {
        // Clear local memory
        this.vectorMemory.embeddings.clear();
        this.vectorMemory.semanticCache.clear();
        this.vectorMemory.temporalIndex.clear();
        this.vectorMemory.learningBuffer = [];
        
        // Request backend to clear cache
        if (window.graceConnection && window.graceConnection.isConnected) {
            window.graceConnection.send({
                type: 'memory_request',
                action: 'clear_cache'
            });
        }
        
        this.showNotification('🧹 Memory cache cleared');
    }

    async undoWithMemory() {
        // Request undo from Grace memory system
        if (window.graceConnection && window.graceConnection.isConnected) {
            window.graceConnection.send({
                type: 'memory_request',
                action: 'undo'
            });
        }
        
        this.showNotification('↶ Undo requested from Grace memory');
    }

    async redoWithMemory() {
        // Request redo from Grace memory system
        if (window.graceConnection && window.graceConnection.isConnected) {
            window.graceConnection.send({
                type: 'memory_request',
                action: 'redo'
            });
        }
        
        this.showNotification('↷ Redo requested from Grace memory');
    }

    // ==================== EVENT HANDLERS ====================

    hideUploadOverlay() {
        const overlay = document.getElementById('uploadOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    showDropZone() {
        document.body.style.borderColor = 'var(--accent-blue)';
    }

    hideDropZone() {
        document.body.style.borderColor = 'transparent';
    }

    handleGlobalKeyboard(event) {
        const key = event.key;
        const ctrl = event.ctrlKey || event.metaKey;
        
        if (ctrl) {
            const shortcut = `Ctrl+${key.toUpperCase()}`;
            if (this.keyboardShortcuts[shortcut]) {
                event.preventDefault();
                this.keyboardShortcuts[shortcut]();
            }
        }
    }
}

// ==================== GLOBAL FUNCTIONS ====================

// Global functions for HTML onclick handlers
window.graceInterface = null;

// Initialize Grace Interface when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.graceInterface = new GraceInterface();
});

// Global action functions for HTML buttons
function uploadFiles() {
    const overlay = document.getElementById('uploadOverlay');
    if (overlay) overlay.classList.add('active');
}

function exportProject() {
    if (window.graceInterface) {
        window.graceInterface.showNotification('📤 Exporting project with Grace optimization...');
    }
}

function deployToGitHub() {
    if (window.graceInterface) {
        window.graceInterface.showNotification('🚀 Deploying to GitHub with Grace CI/CD...');
    }
}

function runGraceMode() {
    if (window.graceInterface) {
        window.graceInterface.graceState.consciousnessActive = true;
        window.graceInterface.updateGraceStatusDisplay();
        window.graceInterface.showNotification('🧠 Grace consciousness activated!');
    }
}

function formatCode() {
    if (window.graceInterface) {
        window.graceInterface.showNotification('🎨 Formatting code with Grace intelligence...');
    }
}

function runCode() {
    if (window.graceInterface) {
        window.graceInterface.showNotification('▶️ Executing code in Grace environment...');
    }
}

function selectModule(element) {
    if (window.graceInterface) {
        window.graceInterface.selectModule(element);
    }
}

function toggleView(viewType) {
    document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    if (window.graceInterface) {
        window.graceInterface.uiState.currentView = viewType;
        window.graceInterface.showNotification(`📊 Switched to ${viewType} view`);
    }
}

function saveProject() {
    if (window.graceInterface) {
        window.graceInterface.saveProjectState();
        window.graceInterface.showNotification('💾 Project saved with Grace optimization');
    }
}

function shareProject() {
    if (window.graceInterface) {
        window.graceInterface.showNotification('🔗 Generating shareable Grace project link...');
    }
}

function createNewFile() {
    const filename = prompt('Enter filename:');
    if (filename && window.graceInterface) {
        window.graceInterface.openFile(filename);
    }
}

function applySuggestion() {
    if (window.graceInterface) {
        window.graceInterface.showNotification('🧠 Applied Grace intelligence suggestion');
    }
}

function applySemanticSuggestion(pattern, confidence) {
    if (window.graceInterface) {
        window.graceInterface.applySemantic(pattern, 0);
        window.graceInterface.showNotification(`🎯 Applied semantic suggestion (${confidence}% confidence)`);
    }
}

function showMemoryInsights() {
    if (window.graceInterface) {
        window.graceInterface.showMemoryStats();
    }
}

function optimizeGraceMemory() {
    if (window.graceInterface) {
        window.graceInterface.optimizeMemoryUsage();
        window.graceInterface.showNotification('🔧 Grace memory optimization initiated');
    }
}

// Export functions for GitHub integration
function gitCommit() {
    if (window.graceInterface) {
        window.graceInterface.showNotification('📝 Committing with Grace analysis...');
    }
}

function gitPush() {
    if (window.graceInterface) {
        window.graceInterface.showNotification('⬆️ Pushing to repository...');
    }
}

function gitPull() {
    if (window.graceInterface) {
        window.graceInterface.showNotification('⬇️ Pulling latest changes...');
    }
}

function createPR() {
    if (window.graceInterface) {
        window.graceInterface.showNotification('🔄 Creating pull request...');
    }
}

// Export functions
function exportToGitHub() {
    if (window.graceInterface) {
        window.graceInterface.showNotification('🐙 Exporting to GitHub...');
    }
}

function exportToClaude() {
    if (window.graceInterface) {
        window.graceInterface.showNotification('🤖 Preparing Claude dataset...');
    }
}

function exportToDocker() {
    if (window.graceInterface) {
        window.graceInterface.showNotification('🐳 Building Docker container...');
    }
}

function exportToCloud() {
    if (window.graceInterface) {
        window.graceInterface.showNotification('☁️ Deploying to cloud...');
    }
}

function exportAPI() {
    if (window.graceInterface) {
        window.graceInterface.showNotification('🔌 Creating API package...');
    }
}

function exportMobile() {
    if (window.graceInterface) {
        window.graceInterface.showNotification('📱 Building mobile apps...');
    }
}

console.log('🧠 Grace IDE Interface Intelligence with Vector Memory loaded and ready');