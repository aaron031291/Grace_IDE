// Grace File Manager Utility
// Comprehensive file management system for Grace IDE

class FileManager {
    constructor(config = {}) {
        // Configuration
        this.config = {
            maxFileSize: config.maxFileSize || 50 * 1024 * 1024, // 50MB default
            allowedExtensions: config.allowedExtensions || null, // null = all allowed
            autoSave: config.autoSave !== false,
            autoSaveInterval: config.autoSaveInterval || 30000, // 30 seconds
            historyLimit: config.historyLimit || 50,
            cacheEnabled: config.cacheEnabled !== false,
            ...config
        };
        
        // State
        this.state = {
            initialized: false,
            currentFile: null,
            openFiles: new Map(),
            recentFiles: [],
            fileHistory: new Map(),
            unsavedChanges: new Map(),
            watchers: new Map()
        };
        
        // File system abstraction
        this.fs = null;
        this.storageType = this.detectStorageType();
        
        // Event emitter
        this.events = new EventTarget();
        
        // Initialize
        this.initialize();
    }
    
    // Initialization
    async initialize() {
        console.log('📁 Initializing Grace File Manager...');
        
        try {
            // Setup file system
            await this.setupFileSystem();
            
            // Load recent files
            await this.loadRecentFiles();
            
            // Setup auto-save if enabled
            if (this.config.autoSave) {
                this.setupAutoSave();
            }
            
            // Connect to Grace Core if available
            this.connectToGraceCore();
            
            this.state.initialized = true;
            console.log('✅ File Manager initialized');
            this.emit('initialized');
            
        } catch (error) {
            console.error('❌ File Manager initialization failed:', error);
            this.emit('error', { error });
        }
    }
    
    // Storage Detection
    detectStorageType() {
        if (typeof window !== 'undefined') {
            // Browser environment
            if (window.showOpenFilePicker) {
                return 'file-system-access';
            } else if (window.localStorage) {
                return 'local-storage';
            } else {
                return 'memory';
            }
        } else if (typeof require !== 'undefined') {
            // Node.js environment
            return 'node-fs';
        } else {
            return 'memory';
        }
    }
    
    // File System Setup
    async setupFileSystem() {
        switch (this.storageType) {
            case 'file-system-access':
                this.fs = new FileSystemAccessAPI();
                break;
                
            case 'local-storage':
                this.fs = new LocalStorageFS();
                break;
                
            case 'node-fs':
                this.fs = new NodeFS();
                break;
                
            case 'memory':
            default:
                this.fs = new MemoryFS();
                break;
        }
        
        await this.fs.initialize();
    }
    
    // File Operations
    async createFile(path, content = '', options = {}) {
        try {
            // Validate file path
            if (!this.validatePath(path)) {
                throw new Error('Invalid file path');
            }
            
            // Check if file already exists
            if (await this.exists(path) && !options.overwrite) {
                throw new Error('File already exists');
            }
            
            // Create file
            const file = await this.fs.writeFile(path, content, options);
            
            // Add to open files
            this.state.openFiles.set(path, {
                path: path,
                content: content,
                handle: file.handle,
                metadata: {
                    created: Date.now(),
                    modified: Date.now(),
                    size: content.length,
                    encoding: options.encoding || 'utf-8'
                }
            });
            
            // Update recent files
            this.addToRecentFiles(path);
            
            // Emit event
            this.emit('file:created', { path, file });
            
            return file;
            
        } catch (error) {
            console.error('Failed to create file:', error);
            this.emit('error', { operation: 'create', path, error });
            throw error;
        }
    }
    
    async openFile(path = null, options = {}) {
        try {
            let file;
            
            if (!path) {
                // Show file picker
                file = await this.showOpenFilePicker(options);
                if (!file) return null;
                path = file.path;
            } else {
                // Open specific file
                file = await this.fs.readFile(path, options);
            }
            
            // Check file size
            if (file.size > this.config.maxFileSize) {
                throw new Error(`File too large: ${this.formatFileSize(file.size)}`);
            }
            
            // Check file extension if restrictions exist
            if (this.config.allowedExtensions) {
                const ext = this.getFileExtension(path);
                if (!this.config.allowedExtensions.includes(ext)) {
                    throw new Error(`File type not allowed: ${ext}`);
                }
            }
            
            // Read content
            const content = await file.text();
            
            // Add to open files
            this.state.openFiles.set(path, {
                path: path,
                content: content,
                originalContent: content,
                handle: file.handle,
                metadata: {
                    name: file.name || this.getFileName(path),
                    size: file.size,
                    type: file.type || this.getMimeType(path),
                    lastModified: file.lastModified || Date.now()
                }
            });
            
            // Set as current file
            this.state.currentFile = path;
            
            // Add to recent files
            this.addToRecentFiles(path);
            
            // Create history entry
            this.addToHistory(path, 'opened');
            
            // Emit event
            this.emit('file:opened', { path, file });
            
            return {
                path: path,
                content: content,
                metadata: this.state.openFiles.get(path).metadata
            };
            
        } catch (error) {
            console.error('Failed to open file:', error);
            this.emit('error', { operation: 'open', path, error });
            throw error;
        }
    }
    
    async saveFile(path = null, content = null, options = {}) {
        try {
            // Use current file if no path specified
            if (!path) {
                path = this.state.currentFile;
                if (!path) {
                    throw new Error('No file to save');
                }
            }
            
            // Get file data
            const fileData = this.state.openFiles.get(path);
            if (!fileData && !content) {
                throw new Error('File not found in open files');
            }
            
            // Use provided content or get from open files
            if (content === null && fileData) {
                content = fileData.content;
            }
            
            // Save file
            let result;
            if (fileData && fileData.handle) {
                // Save using file handle (File System Access API)
                result = await this.fs.writeFile(path, content, { handle: fileData.handle, ...options });
            } else {
                // Save without handle
                result = await this.fs.writeFile(path, content, options);
            }
            
            // Update file data
            if (fileData) {
                fileData.originalContent = content;
                fileData.metadata.modified = Date.now();
                fileData.metadata.size = content.length;
            }
            
            // Clear unsaved changes
            this.state.unsavedChanges.delete(path);
            
            // Add to history
            this.addToHistory(path, 'saved');
            
            // Emit event
            this.emit('file:saved', { path, size: content.length });
            
            return result;
            
        } catch (error) {
            console.error('Failed to save file:', error);
            this.emit('error', { operation: 'save', path, error });
            throw error;
        }
    }
    
    async saveAs(content = null, suggestedName = 'untitled.txt') {
        try {
            // Show save file picker
            const file = await this.showSaveFilePicker({
                suggestedName: suggestedName,
                types: this.getFileTypes()
            });
            
            if (!file) return null;
            
            // Use current file content if not provided
            if (content === null && this.state.currentFile) {
                const fileData = this.state.openFiles.get(this.state.currentFile);
                content = fileData ? fileData.content : '';
            }
            
            // Save file
            await this.fs.writeFile(file.path, content || '', { handle: file.handle });
            
            // Add to open files
            this.state.openFiles.set(file.path, {
                path: file.path,
                content: content || '',
                originalContent: content || '',
                handle: file.handle,
                metadata: {
                    name: file.name,
                    size: (content || '').length,
                    type: file.type || this.getMimeType(file.path),
                    created: Date.now(),
                    modified: Date.now()
                }
            });
            
            // Set as current file
            this.state.currentFile = file.path;
            
            // Add to recent files
            this.addToRecentFiles(file.path);
            
            // Emit event
            this.emit('file:savedAs', { path: file.path });
            
            return file;
            
        } catch (error) {
            console.error('Failed to save file as:', error);
            this.emit('error', { operation: 'saveAs', error });
            throw error;
        }
    }
    
    async deleteFile(path) {
        try {
            // Confirm deletion
            if (!await this.confirmDelete(path)) {
                return false;
            }
            
            // Delete file
            await this.fs.deleteFile(path);
            
            // Remove from open files
            this.state.openFiles.delete(path);
            
            // Clear if it was current file
            if (this.state.currentFile === path) {
                this.state.currentFile = null;
            }
            
            // Remove from recent files
            this.removeFromRecentFiles(path);
            
            // Stop watching
            this.unwatchFile(path);
            
            // Add to history
            this.addToHistory(path, 'deleted');
            
            // Emit event
            this.emit('file:deleted', { path });
            
            return true;
            
        } catch (error) {
            console.error('Failed to delete file:', error);
            this.emit('error', { operation: 'delete', path, error });
            throw error;
        }
    }
    
    async renameFile(oldPath, newPath) {
        try {
            // Check if new path already exists
            if (await this.exists(newPath)) {
                throw new Error('A file with that name already exists');
            }
            
            // Rename file
            await this.fs.renameFile(oldPath, newPath);
            
            // Update open files
            if (this.state.openFiles.has(oldPath)) {
                const fileData = this.state.openFiles.get(oldPath);
                fileData.path = newPath;
                this.state.openFiles.set(newPath, fileData);
                this.state.openFiles.delete(oldPath);
            }
            
            // Update current file
            if (this.state.currentFile === oldPath) {
                this.state.currentFile = newPath;
            }
            
            // Update recent files
            this.updateRecentFilePath(oldPath, newPath);
            
            // Update watchers
            if (this.state.watchers.has(oldPath)) {
                const watcher = this.state.watchers.get(oldPath);
                this.state.watchers.set(newPath, watcher);
                this.state.watchers.delete(oldPath);
            }
            
            // Add to history
            this.addToHistory(newPath, 'renamed', { from: oldPath });
            
            // Emit event
            this.emit('file:renamed', { oldPath, newPath });
            
            return true;
            
        } catch (error) {
            console.error('Failed to rename file:', error);
            this.emit('error', { operation: 'rename', oldPath, newPath, error });
            throw error;
        }
    }
    
    async copyFile(sourcePath, destinationPath, options = {}) {
        try {
            // Read source file
            const content = await this.readFile(sourcePath);
            
            // Create destination file
            await this.createFile(destinationPath, content, { ...options, overwrite: options.overwrite });
            
            // Add to history
            this.addToHistory(destinationPath, 'copied', { from: sourcePath });
            
            // Emit event
            this.emit('file:copied', { sourcePath, destinationPath });
            
            return true;
            
        } catch (error) {
            console.error('Failed to copy file:', error);
            this.emit('error', { operation: 'copy', sourcePath, destinationPath, error });
            throw error;
        }
    }
    
    async moveFile(sourcePath, destinationPath) {
        try {
            // Copy file to destination
            await this.copyFile(sourcePath, destinationPath);
            
            // Delete source file
            await this.fs.deleteFile(sourcePath);
            
            // Update references
            if (this.state.openFiles.has(sourcePath)) {
                const fileData = this.state.openFiles.get(sourcePath);
                fileData.path = destinationPath;
                this.state.openFiles.set(destinationPath, fileData);
                this.state.openFiles.delete(sourcePath);
            }
            
            // Update current file
            if (this.state.currentFile === sourcePath) {
                this.state.currentFile = destinationPath;
            }
            
            // Add to history
            this.addToHistory(destinationPath, 'moved', { from: sourcePath });
            
            // Emit event
            this.emit('file:moved', { sourcePath, destinationPath });
            
            return true;
            
        } catch (error) {
            console.error('Failed to move file:', error);
            this.emit('error', { operation: 'move', sourcePath, destinationPath, error });
            throw error;
        }
    }
    
    // Directory Operations
    async createDirectory(path) {
        try {
            await this.fs.createDirectory(path);
            
            // Add to history
            this.addToHistory(path, 'directory_created');
            
            // Emit event
            this.emit('directory:created', { path });
            
            return true;
            
        } catch (error) {
            console.error('Failed to create directory:', error);
            this.emit('error', { operation: 'createDirectory', path, error });
            throw error;
        }
    }
    
    async listDirectory(path = '/', options = {}) {
        try {
            const items = await this.fs.listDirectory(path, options);
            
            // Sort items
            if (options.sort) {
                items.sort((a, b) => {
                    // Directories first
                    if (a.isDirectory && !b.isDirectory) return -1;
                    if (!a.isDirectory && b.isDirectory) return 1;
                    
                    // Then by name
                    return a.name.localeCompare(b.name);
                });
            }
            
            // Filter by extension if specified
            if (options.extensions) {
                const extensions = Array.isArray(options.extensions) ? options.extensions : [options.extensions];
                items = items.filter(item => {
                    if (item.isDirectory) return true;
                    const ext = this.getFileExtension(item.name);
                    return extensions.includes(ext);
                });
            }
            
            // Emit event
            this.emit('directory:listed', { path, count: items.length });
            
            return items;
            
        } catch (error) {
            console.error('Failed to list directory:', error);
            this.emit('error', { operation: 'listDirectory', path, error });
            throw error;
        }
    }
    
    // File Reading
    async readFile(path, options = {}) {
        try {
            const file = await this.fs.readFile(path, options);
            const content = await file.text();
            
            return content;
            
        } catch (error) {
            console.error('Failed to read file:', error);
            this.emit('error', { operation: 'read', path, error });
            throw error;
        }
    }
    
    async readFileAsBuffer(path) {
        try {
            const file = await this.fs.readFile(path);
            const buffer = await file.arrayBuffer();
            
            return buffer;
            
        } catch (error) {
            console.error('Failed to read file as buffer:', error);
            this.emit('error', { operation: 'readBuffer', path, error });
            throw error;
        }
    }
    
    async readFileAsDataURL(path) {
        try {
            const file = await this.fs.readFile(path);
            const buffer = await file.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
            const mimeType = this.getMimeType(path);
            
            return `data:${mimeType};base64,${base64}`;
            
        } catch (error) {
            console.error('Failed to read file as data URL:', error);
            this.emit('error', { operation: 'readDataURL', path, error });
            throw error;
        }
    }
    
    // File Information
    async getFileInfo(path) {
        try {
            const info = await this.fs.getFileInfo(path);
            
            return {
                path: path,
                name: info.name || this.getFileName(path),
                size: info.size,
                type: info.type || this.getMimeType(path),
                lastModified: info.lastModified,
                isDirectory: info.isDirectory || false,
                extension: this.getFileExtension(path),
                permissions: info.permissions || null
            };
            
        } catch (error) {
            console.error('Failed to get file info:', error);
            this.emit('error', { operation: 'getInfo', path, error });
            throw error;
        }
    }
    
    async exists(path) {
        try {
            return await this.fs.exists(path);
        } catch (error) {
            return false;
        }
    }
    
    // File Watching
    watchFile(path, callback, options = {}) {
        if (this.state.watchers.has(path)) {
            console.warn(`File ${path} is already being watched`);
            return;
        }
        
        const watcher = {
            path: path,
            callback: callback,
            interval: options.interval || 1000,
            lastModified: null,
            intervalId: null
        };
        
        // Check for changes periodically
        watcher.intervalId = setInterval(async () => {
            try {
                const info = await this.getFileInfo(path);
                
                if (watcher.lastModified && info.lastModified !== watcher.lastModified) {
                    callback({
                        type: 'change',
                        path: path,
                        timestamp: Date.now()
                    });
                }
                
                watcher.lastModified = info.lastModified;
                
            } catch (error) {
                // File might have been deleted
                if (watcher.lastModified !== null) {
                    callback({
                        type: 'delete',
                        path: path,
                        timestamp: Date.now()
                    });
                    this.unwatchFile(path);
                }
            }
        }, watcher.interval);
        
        this.state.watchers.set(path, watcher);
        
        // Emit event
        this.emit('file:watching', { path });
    }
    
    unwatchFile(path) {
        const watcher = this.state.watchers.get(path);
        if (watcher) {
            clearInterval(watcher.intervalId);
            this.state.watchers.delete(path);
            
            // Emit event
            this.emit('file:unwatched', { path });
        }
    }
    
    // Content Management
    updateFileContent(path, content) {
        const fileData = this.state.openFiles.get(path);
        if (!fileData) {
            throw new Error('File not open');
        }
        
        fileData.content = content;
        
        // Track unsaved changes
        if (content !== fileData.originalContent) {
            this.state.unsavedChanges.set(path, {
                timestamp: Date.now(),
                originalSize: fileData.originalContent.length,
                currentSize: content.length
            });
        } else {
            this.state.unsavedChanges.delete(path);
        }
        
        // Emit event
        this.emit('file:contentChanged', { 
            path, 
            hasChanges: content !== fileData.originalContent 
        });
    }
    
    getFileContent(path) {
        const fileData = this.state.openFiles.get(path);
        return fileData ? fileData.content : null;
    }
    
    hasUnsavedChanges(path = null) {
        if (path) {
            return this.state.unsavedChanges.has(path);
        }
        return this.state.unsavedChanges.size > 0;
    }
    
    getUnsavedFiles() {
        return Array.from(this.state.unsavedChanges.keys());
    }
    
    // Recent Files
    async loadRecentFiles() {
        try {
            const stored = localStorage.getItem('grace_recent_files');
            if (stored) {
                this.state.recentFiles = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load recent files:', error);
        }
    }
    
    saveRecentFiles() {
        try {
            localStorage.setItem('grace_recent_files', JSON.stringify(this.state.recentFiles));
        } catch (error) {
            console.warn('Failed to save recent files:', error);
        }
    }
    
    addToRecentFiles(path) {
        // Remove if already exists
        this.state.recentFiles = this.state.recentFiles.filter(f => f.path !== path);
        
        // Add to beginning
        this.state.recentFiles.unshift({
            path: path,
            name: this.getFileName(path),
            lastOpened: Date.now()
        });
        
        // Limit size
        if (this.state.recentFiles.length > 20) {
            this.state.recentFiles = this.state.recentFiles.slice(0, 20);
        }
        
        // Save
        this.saveRecentFiles();
    }
    
    removeFromRecentFiles(path) {
        this.state.recentFiles = this.state.recentFiles.filter(f => f.path !== path);
        this.saveRecentFiles();
    }
    
    updateRecentFilePath(oldPath, newPath) {
        const file = this.state.recentFiles.find(f => f.path === oldPath);
        if (file) {
            file.path = newPath;
            file.name = this.getFileName(newPath);
            this.saveRecentFiles();
        }
    }
    
    getRecentFiles() {
        return this.state.recentFiles;
    }
    
    // History
    addToHistory(path, action, details = {}) {
        if (!this.state.fileHistory.has(path)) {
            this.state.fileHistory.set(path, []);
        }
        
        const history = this.state.fileHistory.get(path);
        history.push({
            action: action,
            timestamp: Date.now(),
            details: details
        });
        
        // Limit history size
        if (history.length > this.config.historyLimit) {
            history.shift();
        }
    }
    
    getFileHistory(path) {
        return this.state.fileHistory.get(path) || [];
    }
    
    // Auto-save
    setupAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            this.autoSaveAll();
        }, this.config.autoSaveInterval);
    }
    
    async autoSaveAll() {
        const unsavedFiles = this.getUnsavedFiles();
        
        for (const path of unsavedFiles) {
            try {
                await this.saveFile(path);
                console.log(`Auto-saved: ${path}`);
            } catch (error) {
                console.error(`Failed to auto-save ${path}:`, error);
            }
        }
        
        if (unsavedFiles.length > 0) {
            this.emit('files:autoSaved', { count: unsavedFiles.length });
        }
    }
    
    // File Type Detection
    getMimeType(path) {
        const ext = this.getFileExtension(path).toLowerCase();
        
        const mimeTypes = {
            // Text
            'txt': 'text/plain',
            'md': 'text/markdown',
            'csv': 'text/csv',
            
            // Code
            'js': 'text/javascript',
            'ts': 'text/typescript',
            'jsx': 'text/jsx',
            'tsx': 'text/tsx',
            'py': 'text/x-python',
            'java': 'text/x-java',
            'c': 'text/x-c',
            'cpp': 'text/x-c++',
            'cs': 'text/x-csharp',
            'php': 'text/x-php',
            'rb': 'text/x-ruby',
            'go': 'text/x-go',
            'rs': 'text/x-rust',
            'swift': 'text/x-swift',
            'kt': 'text/x-kotlin',
            
            // Web
            'html': 'text/html',
            'css': 'text/css',
            'scss': 'text/x-scss',
            'sass': 'text/x-sass',
            'less': 'text/x-less',
            
            // Data
            'json': 'application/json',
            'xml': 'application/xml',
            'yaml': 'text/yaml',
            'yml': 'text/yaml',
            'toml': 'text/toml',
            
            // Images
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'svg': 'image/svg+xml',
            'webp': 'image/webp',
            'ico': 'image/x-icon',
            
            // Documents
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            
            // Archives
            'zip': 'application/zip',
            'tar': 'application/x-tar',
            'gz': 'application/gzip',
            '7z': 'application/x-7z-compressed',
            'rar': 'application/x-rar-compressed'
        };
        
        return mimeTypes[ext] || 'application/octet-stream';
    }
    
    getFileTypes() {
        return [
            {
                description: 'Text Files',
                accept: {
                    'text/plain': ['.txt', '.md']
                }
            },
            {
                description: 'JavaScript Files',
                accept: {
                    'text/javascript': ['.js', '.jsx', '.mjs']
                }
            },
            {
                description: 'Python Files',
                accept: {
                    'text/x-python': ['.py']
                }
            },
            {
                description: 'JSON Files',
                accept: {
                    'application/json': ['.json']
                }
            },
            {
                description: 'All Files',
                accept: {
                    '*/*': []
                }
            }
        ];
    }
    
    // Utility Methods
    getFileName(path) {
        return path.split('/').pop() || path.split('\\').pop() || path;
    }
    
    getFileExtension(path) {
        const name = this.getFileName(path);
        const lastDot = name.lastIndexOf('.');
        return lastDot > 0 ? name.substring(lastDot + 1) : '';
    }
    
    getDirectory(path) {
        const parts = path.split('/');
        parts.pop();
        return parts.join('/') || '/';
    }
    
    joinPath(...parts) {
        return parts.join('/').replace(/\/+/g, '/');
    }
    
    validatePath(path) {
        // Basic path validation
        if (!path || typeof path !== 'string') return false;
        if (path.includes('..')) return false; // Prevent directory traversal
        if (path.includes('\0')) return false; // Null bytes
        
        return true;
    }
    
    formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }
    
    async confirmDelete(path) {
        // In a real implementation, this would show a confirmation dialog
        return confirm(`Are you sure you want to delete "${this.getFileName(path)}"?`);
    }
    
    // File Pickers
    async showOpenFilePicker(options = {}) {
        if (this.storageType === 'file-system-access' && window.showOpenFilePicker) {
            try {
                const [handle] = await window.showOpenFilePicker({
                    types: options.types || this.getFileTypes(),
                    multiple: false
                });
                
                const file = await handle.getFile();
                
                return {
                    handle: handle,
                    path: handle.name,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    lastModified: file.lastModified,
                    text: () => file.text(),
                    arrayBuffer: () => file.arrayBuffer()
                };
                
            } catch (error) {
                if (error.name === 'AbortError') {
                    return null; // User cancelled
                }
                throw error;
            }
        } else {
            // Fallback to input element
            return new Promise((resolve) => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = options.accept || '*/*';
                
                input.onchange = (event) => {
                    const file = event.target.files[0];
                    if (file) {
                        resolve({
                            path: file.name,
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            lastModified: file.lastModified,
                            text: () => file.text(),
                            arrayBuffer: () => file.arrayBuffer()
                        });
                    } else {
                        resolve(null);
                    }
                };
                
                input.click();
            });
        }
    }
    
    async showSaveFilePicker(options = {}) {
        if (this.storageType === 'file-system-access' && window.showSaveFilePicker) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: options.suggestedName || 'untitled.txt',
                    types: options.types || this.getFileTypes()
                });
                
                return {
                    handle: handle,
                    path: handle.name,
                    name: handle.name
                };
                
            } catch (error) {
                if (error.name === 'AbortError') {
                    return null; // User cancelled
                }
                throw error;
            }
        } else {
            // Fallback to download
            const suggestedName = options.suggestedName || 'untitled.txt';
            return {
                path: suggestedName,
                name: suggestedName
            };
        }
    }
    
    // Grace Core Integration
    connectToGraceCore() {
        if (window.graceCore) {
            // Register file operations with Grace Core
            window.graceCore.loadModule('file_manager', {
                name: 'file_manager',
                version: '1.0.0',
                execute: async (command, params) => {
                    switch (command) {
                        case 'open':
                            return await this.openFile(params.path);
                        case 'save':
                            return await this.saveFile(params.path, params.content);
                        case 'create':
                            return await this.createFile(params.path, params.content);
                        case 'delete':
                            return await this.deleteFile(params.path);
                        case 'list':
                            return await this.listDirectory(params.path);
                        default:
                            throw new Error(`Unknown file command: ${command}`);
                    }
                }
            });
            
            console.log('✅ File Manager connected to Grace Core');
        }
    }
    
    // Event System
    emit(event, data) {
        const customEvent = new CustomEvent(`filemanager:${event}`, { detail: data });
        this.events.dispatchEvent(customEvent);
        
        // Also emit to window for global listeners
        if (typeof window !== 'undefined') {
            window.dispatchEvent(customEvent);
        }
    }
    
    on(event, handler) {
        this.events.addEventListener(`filemanager:${event}`, handler);
    }
    
    off(event, handler) {
        this.events.removeEventListener(`filemanager:${event}`, handler);
    }
    
    // Cleanup
    destroy() {
        // Stop auto-save
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        // Stop all file watchers
        this.state.watchers.forEach((watcher, path) => {
            this.unwatchFile(path);
        });
        
        // Clear state
        this.state.openFiles.clear();
        this.state.unsavedChanges.clear();
        this.state.fileHistory.clear();
        
        console.log('File Manager destroyed');
    }
}

// File System Implementations

// File System Access API Implementation
class FileSystemAccessAPI {
    async initialize() {
        // Check if API is available
        if (!window.showOpenFilePicker) {
            throw new Error('File System Access API not supported');
        }
    }
    
    async readFile(path) {
        // In real implementation, would use stored handle
        throw new Error('Use showOpenFilePicker for File System Access API');
    }
    
    async writeFile(path, content, options = {}) {
        if (options.handle) {
            const writable = await options.handle.createWritable();
            await writable.write(content);
            await writable.close();
            return { success: true };
        }
        throw new Error('File handle required for writing');
    }
    
    async deleteFile(path) {
        throw new Error('Delete not supported in File System Access API');
    }
    
    async exists(path) {
        return false; // Cannot check without handle
    }
    
    async createDirectory(path) {
        throw new Error('Directory creation not supported in File System Access API');
    }
    
    async listDirectory(path) {
        throw new Error('Directory listing not supported in File System Access API');
    }
    
    async getFileInfo(path) {
        throw new Error('File info not available without handle');
    }
    
    async renameFile(oldPath, newPath) {
        throw new Error('Rename not supported in File System Access API');
    }
}

// Local Storage File System Implementation
class LocalStorageFS {
    constructor() {
        this.prefix = 'grace_fs_';
    }
    
    async initialize() {
        // Check if localStorage is available
        if (!window.localStorage) {
            throw new Error('localStorage not available');
        }
    }
    
    async readFile(path) {
        const key = this.prefix + path;
        const data = localStorage.getItem(key);
        
        if (!data) {
            throw new Error('File not found');
        }
        
        const file = JSON.parse(data);
        
        return {
            name: this.getFileName(path),
            size: file.content.length,
            type: file.type || 'text/plain',
            lastModified: file.lastModified,
            text: async () => file.content,
            arrayBuffer: async () => new TextEncoder().encode(file.content).buffer
        };
    }
    
    async writeFile(path, content, options = {}) {
        const key = this.prefix + path;
        const file = {
            content: content,
            type: options.type || 'text/plain',
            created: Date.now(),
            lastModified: Date.now()
        };
        
        localStorage.setItem(key, JSON.stringify(file));
        
        return { success: true };
    }
    
    async deleteFile(path) {
        const key = this.prefix + path;
        localStorage.removeItem(key);
        return { success: true };
    }
    
    async exists(path) {
        const key = this.prefix + path;
        return localStorage.getItem(key) !== null;
    }
    
    async createDirectory(path) {
        // Directories are virtual in localStorage
        return { success: true };
    }
    
    async listDirectory(path) {
        const items = [];
        const dirPath = path.endsWith('/') ? path : path + '/';
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.prefix + dirPath)) {
                const itemPath = key.substring(this.prefix.length);
                const relativePath = itemPath.substring(dirPath.length);
                
                // Only include direct children
                if (!relativePath.includes('/')) {
                    items.push({
                        name: relativePath,
                        path: itemPath,
                        isDirectory: false
                    });
                }
            }
        }
        
        return items;
    }
    
    async getFileInfo(path) {
        const file = await this.readFile(path);
        return {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            isDirectory: false
        };
    }
    
    async renameFile(oldPath, newPath) {
        const content = await this.readFile(oldPath);
        await this.writeFile(newPath, await content.text());
        await this.deleteFile(oldPath);
        return { success: true };
    }
    
    getFileName(path) {
        return path.split('/').pop() || path;
    }
}

// Memory File System Implementation
class MemoryFS {
    constructor() {
        this.files = new Map();
    }
    
    async initialize() {
        // Nothing to initialize for memory FS
    }
    
    async readFile(path) {
        const file = this.files.get(path);
        
        if (!file) {
            throw new Error('File not found');
        }
        
        return {
            name: this.getFileName(path),
            size: file.content.length,
            type: file.type || 'text/plain',
            lastModified: file.lastModified,
            text: async () => file.content,
            arrayBuffer: async () => new TextEncoder().encode(file.content).buffer
        };
    }
    
    async writeFile(path, content, options = {}) {
        this.files.set(path, {
            content: content,
            type: options.type || 'text/plain',
            created: this.files.has(path) ? this.files.get(path).created : Date.now(),
            lastModified: Date.now()
        });
        
        return { success: true };
    }
    
    async deleteFile(path) {
        this.files.delete(path);
        return { success: true };
    }
    
    async exists(path) {
        return this.files.has(path);
    }
    
    async createDirectory(path) {
        // Directories are virtual in memory FS
        return { success: true };
    }
    
    async listDirectory(path) {
        const items = [];
        const dirPath = path.endsWith('/') ? path : path + '/';
        
        for (const [filePath, file] of this.files) {
            if (filePath.startsWith(dirPath)) {
                const relativePath = filePath.substring(dirPath.length);
                
                // Only include direct children
                if (!relativePath.includes('/')) {
                    items.push({
                        name: relativePath,
                        path: filePath,
                        isDirectory: false
                    });
                }
            }
        }
        
        return items;
    }
    
    async getFileInfo(path) {
        const file = await this.readFile(path);
        return {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            isDirectory: false
        };
    }
    
    async renameFile(oldPath, newPath) {
        const file = this.files.get(oldPath);
        if (!file) {
            throw new Error('File not found');
        }
        
        this.files.set(newPath, file);
        this.files.delete(oldPath);
        
        return { success: true };
    }
    
    getFileName(path) {
        return path.split('/').pop() || path;
    }
}

// Node.js File System Implementation (if running in Node environment)
class NodeFS {
    constructor() {
        this.fs = null;
        this.path = null;
    }
    
    async initialize() {
        try {
            this.fs = require('fs').promises;
            this.path = require('path');
        } catch (error) {
            throw new Error('Node.js fs module not available');
        }
    }
    
    async readFile(path, options = {}) {
        const stats = await this.fs.stat(path);
        const content = await this.fs.readFile(path, options.encoding || 'utf8');
        
        return {
            name: this.path.basename(path),
            size: stats.size,
            type: this.getMimeType(path),
            lastModified: stats.mtime.getTime(),
            text: async () => content,
            arrayBuffer: async () => Buffer.from(content).buffer
        };
    }
    
    async writeFile(path, content, options = {}) {
        await this.fs.writeFile(path, content, options.encoding || 'utf8');
        return { success: true };
    }
    
    async deleteFile(path) {
        await this.fs.unlink(path);
        return { success: true };
    }
    
    async exists(path) {
        try {
            await this.fs.access(path);
            return true;
        } catch {
            return false;
        }
    }
    
    async createDirectory(path) {
        await this.fs.mkdir(path, { recursive: true });
        return { success: true };
    }
    
    async listDirectory(path, options = {}) {
        const items = await this.fs.readdir(path, { withFileTypes: true });
        
        return items.map(item => ({
            name: item.name,
            path: this.path.join(path, item.name),
            isDirectory: item.isDirectory()
        }));
    }
    
    async getFileInfo(path) {
        const stats = await this.fs.stat(path);
        
        return {
            name: this.path.basename(path),
            size: stats.size,
            type: stats.isFile() ? this.getMimeType(path) : null,
            lastModified: stats.mtime.getTime(),
            isDirectory: stats.isDirectory(),
            permissions: stats.mode
        };
    }
    
    async renameFile(oldPath, newPath) {
        await this.fs.rename(oldPath, newPath);
        return { success: true };
    }
    
    getMimeType(path) {
        // Simplified mime type detection
        const ext = this.path.extname(path).toLowerCase().substring(1);
        const mimeTypes = {
            'txt': 'text/plain',
            'js': 'text/javascript',
            'json': 'application/json',
            'html': 'text/html',
            'css': 'text/css'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }
}

// Export FileManager
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileManager;
} else if (typeof window !== 'undefined') {
    window.FileManager = FileManager;
}