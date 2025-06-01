// Grace Git Integration Interface
// Comprehensive Git operations and UI for Grace IDE

class GitInterface {
    constructor(config = {}) {
        // Configuration
        this.config = {
            backend: config.backend || 'isomorphic-git', // 'isomorphic-git', 'wasm-git', 'native'
            corsProxy: config.corsProxy || 'https://cors.isomorphic-git.org',
            defaultRemote: config.defaultRemote || 'origin',
            defaultBranch: config.defaultBranch || 'main',
            autoFetch: config.autoFetch !== false,
            fetchInterval: config.fetchInterval || 300000, // 5 minutes
            ...config
        };
        
        // State
        this.state = {
            initialized: false,
            currentRepo: null,
            repositories: new Map(),
            currentBranch: null,
            remotes: new Map(),
            status: {
                staged: [],
                unstaged: [],
                untracked: [],
                conflicts: []
            },
            history: [],
            isOperating: false
        };
        
        // Git backend
        this.git = null;
        this.fs = null;
        
        // UI Components
        this.components = new Map();
        this.activeView = 'status';
        
        // Event system
        this.events = new EventTarget();
        
        // Initialize
        this.initialize();
    }
    
    // Initialization
    async initialize() {
        console.log('🌿 Initializing Grace Git Interface...');
        
        try {
            // Setup Git backend
            await this.setupGitBackend();
            
            // Initialize file system
            await this.initializeFileSystem();
            
            // Load repositories
            await this.loadRepositories();
            
            // Setup UI
            this.setupUI();
            
            // Connect to Grace Core
            this.connectToGraceCore();
            
            // Start auto-fetch if enabled
            if (this.config.autoFetch) {
                this.startAutoFetch();
            }
            
            this.state.initialized = true;
            console.log('✅ Git Interface initialized');
            this.emit('initialized');
            
        } catch (error) {
            console.error('❌ Git Interface initialization failed:', error);
            this.emit('error', { error });
        }
    }
    
    // Git Backend Setup
    async setupGitBackend() {
        switch (this.config.backend) {
            case 'isomorphic-git':
                await this.setupIsomorphicGit();
                break;
                
            case 'wasm-git':
                await this.setupWasmGit();
                break;
                
            case 'native':
                await this.setupNativeGit();
                break;
                
            default:
                throw new Error(`Unknown Git backend: ${this.config.backend}`);
        }
    }
    
    async setupIsomorphicGit() {
        // Load isomorphic-git
        if (typeof window !== 'undefined') {
            // Browser environment
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/isomorphic-git@1.24.0/index.umd.min.js';
            
            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
            
            this.git = window.git;
        } else {
            // Node.js environment
            this.git = require('isomorphic-git');
        }
        
        // Setup HTTP client
        if (typeof window !== 'undefined') {
            const httpScript = document.createElement('script');
            httpScript.src = 'https://unpkg.com/isomorphic-git@1.24.0/http/web/index.umd.js';
            
            await new Promise((resolve, reject) => {
                httpScript.onload = resolve;
                httpScript.onerror = reject;
                document.head.appendChild(httpScript);
            });
            
            this.http = window.GitHttp;
        } else {
            this.http = require('isomorphic-git/http/node');
        }
    }
    
    async setupWasmGit() {
        // Load wasm-git
        throw new Error('WASM Git backend not yet implemented');
    }
    
    async setupNativeGit() {
        // Use native git command
        throw new Error('Native Git backend not yet implemented');
    }
    
    // File System Setup
    async initializeFileSystem() {
        if (typeof window !== 'undefined') {
            // Browser - use Lightning FS
            const fsScript = document.createElement('script');
            fsScript.src = 'https://unpkg.com/@isomorphic-git/lightning-fs@4.6.0/dist/lightning-fs.min.js';
            
            await new Promise((resolve, reject) => {
                fsScript.onload = resolve;
                fsScript.onerror = reject;
                document.head.appendChild(fsScript);
            });
            
            this.fs = new window.LightningFS('grace-git');
        } else {
            // Node.js - use native fs
            this.fs = require('fs');
        }
    }
    
    // Repository Management
    async loadRepositories() {
        try {
            const stored = localStorage.getItem('grace_git_repositories');
            if (stored) {
                const repos = JSON.parse(stored);
                for (const repo of repos) {
                    this.state.repositories.set(repo.path, repo);
                }
            }
        } catch (error) {
            console.warn('Failed to load repositories:', error);
        }
    }
    
    saveRepositories() {
        try {
            const repos = Array.from(this.state.repositories.values());
            localStorage.setItem('grace_git_repositories', JSON.stringify(repos));
        } catch (error) {
            console.warn('Failed to save repositories:', error);
        }
    }
    
    // Git Operations
    async init(path, options = {}) {
        this.setOperating(true);
        
        try {
            await this.git.init({
                fs: this.fs,
                dir: path,
                defaultBranch: options.branch || this.config.defaultBranch
            });
            
            // Add to repositories
            const repo = {
                path: path,
                name: this.getRepoName(path),
                created: Date.now(),
                lastAccessed: Date.now()
            };
            
            this.state.repositories.set(path, repo);
            this.saveRepositories();
            
            // Set as current repo
            await this.setCurrentRepo(path);
            
            this.emit('repo:initialized', { path });
            this.showNotification('Repository initialized', 'success');
            
            return repo;
            
        } catch (error) {
            console.error('Failed to initialize repository:', error);
            this.showNotification(`Failed to initialize: ${error.message}`, 'error');
            throw error;
        } finally {
            this.setOperating(false);
        }
    }
    
    async clone(url, path, options = {}) {
        this.setOperating(true);
        
        try {
            const progressCallback = (progress) => {
                this.emit('clone:progress', progress);
                this.updateProgress(progress);
            };
            
            await this.git.clone({
                fs: this.fs,
                http: this.http,
                dir: path,
                url: url,
                ref: options.branch,
                singleBranch: options.singleBranch || false,
                depth: options.depth,
                corsProxy: this.config.corsProxy,
                onProgress: progressCallback,
                onMessage: (message) => {
                    console.log('Clone message:', message);
                },
                onAuth: () => this.handleAuth(url),
                onAuthFailure: () => {
                    this.showNotification('Authentication failed', 'error');
                    throw new Error('Authentication failed');
                }
            });
            
            // Add to repositories
            const repo = {
                path: path,
                name: this.getRepoName(path),
                url: url,
                created: Date.now(),
                lastAccessed: Date.now()
            };
            
            this.state.repositories.set(path, repo);
            this.saveRepositories();
            
            // Set as current repo
            await this.setCurrentRepo(path);
            
            this.emit('repo:cloned', { path, url });
            this.showNotification('Repository cloned successfully', 'success');
            
            return repo;
            
        } catch (error) {
            console.error('Failed to clone repository:', error);
            this.showNotification(`Failed to clone: ${error.message}`, 'error');
            throw error;
        } finally {
            this.setOperating(false);
        }
    }
    
    async add(filepath) {
        this.checkCurrentRepo();
        
        try {
            await this.git.add({
                fs: this.fs,
                dir: this.state.currentRepo,
                filepath: filepath
            });
            
            await this.updateStatus();
            this.emit('file:staged', { filepath });
            
        } catch (error) {
            console.error('Failed to stage file:', error);
            this.showNotification(`Failed to stage: ${error.message}`, 'error');
            throw error;
        }
    }
    
    async addAll() {
        this.checkCurrentRepo();
        
        try {
            const status = await this.status();
            const files = [...status.unstaged, ...status.untracked];
            
            for (const file of files) {
                await this.add(file);
            }
            
            this.showNotification(`Staged ${files.length} files`, 'success');
            
        } catch (error) {
            console.error('Failed to stage all files:', error);
            throw error;
        }
    }
    
    async remove(filepath) {
        this.checkCurrentRepo();
        
        try {
            await this.git.remove({
                fs: this.fs,
                dir: this.state.currentRepo,
                filepath: filepath
            });
            
            await this.updateStatus();
            this.emit('file:unstaged', { filepath });
            
        } catch (error) {
            console.error('Failed to unstage file:', error);
            this.showNotification(`Failed to unstage: ${error.message}`, 'error');
            throw error;
        }
    }
    
    async commit(message, options = {}) {
        this.checkCurrentRepo();
        this.setOperating(true);
        
        try {
            const sha = await this.git.commit({
                fs: this.fs,
                dir: this.state.currentRepo,
                message: message,
                author: {
                    name: options.authorName || await this.getConfig('user.name'),
                    email: options.authorEmail || await this.getConfig('user.email')
                }
            });
            
            await this.updateStatus();
            await this.updateHistory();
            
            this.emit('commit:created', { sha, message });
            this.showNotification('Commit created successfully', 'success');
            
            return sha;
            
        } catch (error) {
            console.error('Failed to commit:', error);
            this.showNotification(`Failed to commit: ${error.message}`, 'error');
            throw error;
        } finally {
            this.setOperating(false);
        }
    }
    
    async push(remote = 'origin', options = {}) {
        this.checkCurrentRepo();
        this.setOperating(true);
        
        try {
            const branch = this.state.currentBranch || await this.getCurrentBranch();
            
            const result = await this.git.push({
                fs: this.fs,
                http: this.http,
                dir: this.state.currentRepo,
                remote: remote,
                ref: branch,
                corsProxy: this.config.corsProxy,
                onProgress: (progress) => {
                    this.emit('push:progress', progress);
                    this.updateProgress(progress);
                },
                onAuth: () => this.handleAuth(),
                onAuthFailure: () => {
                    this.showNotification('Authentication failed', 'error');
                    throw new Error('Authentication failed');
                }
            });
            
            this.emit('push:complete', { remote, branch, result });
            this.showNotification('Pushed successfully', 'success');
            
            return result;
            
        } catch (error) {
            console.error('Failed to push:', error);
            this.showNotification(`Failed to push: ${error.message}`, 'error');
            throw error;
        } finally {
            this.setOperating(false);
        }
    }
    
    async pull(remote = 'origin', options = {}) {
        this.checkCurrentRepo();
        this.setOperating(true);
        
        try {
            const branch = this.state.currentBranch || await this.getCurrentBranch();
            
            await this.git.pull({
                fs: this.fs,
                http: this.http,
                dir: this.state.currentRepo,
                ref: branch,
                corsProxy: this.config.corsProxy,
                onProgress: (progress) => {
                    this.emit('pull:progress', progress);
                    this.updateProgress(progress);
                },
                onAuth: () => this.handleAuth(),
                onAuthFailure: () => {
                    this.showNotification('Authentication failed', 'error');
                    throw new Error('Authentication failed');
                },
                author: {
                    name: await this.getConfig('user.name'),
                    email: await this.getConfig('user.email')
                }
            });
            
            await this.updateStatus();
            await this.updateHistory();
            
            this.emit('pull:complete', { remote, branch });
            this.showNotification('Pulled successfully', 'success');
            
        } catch (error) {
            console.error('Failed to pull:', error);
            
            if (error.code === 'MergeConflictError') {
                this.showNotification('Merge conflicts detected', 'warning');
                await this.handleMergeConflicts();
            } else {
                this.showNotification(`Failed to pull: ${error.message}`, 'error');
            }
            
            throw error;
        } finally {
            this.setOperating(false);
        }
    }
    
    async fetch(remote = 'origin', options = {}) {
        this.checkCurrentRepo();
        
        try {
            await this.git.fetch({
                fs: this.fs,
                http: this.http,
                dir: this.state.currentRepo,
                remote: remote,
                corsProxy: this.config.corsProxy,
                onProgress: (progress) => {
                    this.emit('fetch:progress', progress);
                },
                onAuth: () => this.handleAuth(),
                onAuthFailure: () => {
                    console.warn('Fetch authentication failed');
                }
            });
            
            this.emit('fetch:complete', { remote });
            
        } catch (error) {
            console.error('Failed to fetch:', error);
            // Don't show notification for fetch errors (might be offline)
        }
    }
    
    // Branch Operations
    async branch(name, options = {}) {
        this.checkCurrentRepo();
        
        try {
            if (options.delete) {
                // Delete branch
                await this.git.deleteBranch({
                    fs: this.fs,
                    dir: this.state.currentRepo,
                    ref: name
                });
                
                this.emit('branch:deleted', { name });
                this.showNotification(`Branch ${name} deleted`, 'success');
                
            } else {
                // Create branch
                await this.git.branch({
                    fs: this.fs,
                    dir: this.state.currentRepo,
                    ref: name,
                    checkout: options.checkout || false
                });
                
                if (options.checkout) {
                    await this.checkout(name);
                }
                
                this.emit('branch:created', { name });
                this.showNotification(`Branch ${name} created`, 'success');
            }
            
        } catch (error) {
            console.error('Branch operation failed:', error);
            this.showNotification(`Branch operation failed: ${error.message}`, 'error');
            throw error;
        }
    }
    
    async checkout(ref, options = {}) {
        this.checkCurrentRepo();
        this.setOperating(true);
        
        try {
            await this.git.checkout({
                fs: this.fs,
                dir: this.state.currentRepo,
                ref: ref,
                force: options.force || false
            });
            
            this.state.currentBranch = ref;
            await this.updateStatus();
            
            this.emit('branch:changed', { branch: ref });
            this.showNotification(`Switched to ${ref}`, 'success');
            
        } catch (error) {
            console.error('Failed to checkout:', error);
            this.showNotification(`Failed to checkout: ${error.message}`, 'error');
            throw error;
        } finally {
            this.setOperating(false);
        }
    }
    
    async merge(branch, options = {}) {
        this.checkCurrentRepo();
        this.setOperating(true);
        
        try {
            const result = await this.git.merge({
                fs: this.fs,
                dir: this.state.currentRepo,
                theirs: branch,
                author: {
                    name: await this.getConfig('user.name'),
                    email: await this.getConfig('user.email')
                }
            });
            
            if (result.conflict) {
                this.showNotification('Merge conflicts detected', 'warning');
                await this.handleMergeConflicts();
            } else {
                await this.updateStatus();
                await this.updateHistory();
                
                this.emit('merge:complete', { branch, result });
                this.showNotification(`Merged ${branch} successfully`, 'success');
            }
            
            return result;
            
        } catch (error) {
            console.error('Failed to merge:', error);
            this.showNotification(`Failed to merge: ${error.message}`, 'error');
            throw error;
        } finally {
            this.setOperating(false);
        }
    }
    
    async getBranches() {
        this.checkCurrentRepo();
        
        try {
            const branches = await this.git.listBranches({
                fs: this.fs,
                dir: this.state.currentRepo
            });
            
            const current = await this.getCurrentBranch();
            
            return branches.map(branch => ({
                name: branch,
                current: branch === current
            }));
            
        } catch (error) {
            console.error('Failed to get branches:', error);
            return [];
        }
    }
    
    async getCurrentBranch() {
        this.checkCurrentRepo();
        
        try {
            const branch = await this.git.currentBranch({
                fs: this.fs,
                dir: this.state.currentRepo
            });
            
            this.state.currentBranch = branch;
            return branch;
            
        } catch (error) {
            console.error('Failed to get current branch:', error);
            return null;
        }
    }
    
    // Status and Diff
    async status() {
        this.checkCurrentRepo();
        
        try {
            const matrix = await this.git.statusMatrix({
                fs: this.fs,
                dir: this.state.currentRepo
            });
            
            const staged = [];
            const unstaged = [];
            const untracked = [];
            
            for (const [filepath, head, workdir, stage] of matrix) {
                if (head === 0 && workdir === 2 && stage === 0) {
                    untracked.push(filepath);
                } else if (head === 1 && workdir === 1 && stage === 1) {
                    // Unmodified
                } else if (stage === 2 || stage === 3) {
                    staged.push(filepath);
                } else if (workdir !== head) {
                    unstaged.push(filepath);
                }
            }
            
            this.state.status = {
                staged,
                unstaged,
                untracked,
                conflicts: [] // TODO: Detect conflicts
            };
            
            return this.state.status;
            
        } catch (error) {
            console.error('Failed to get status:', error);
            throw error;
        }
    }
    
    async diff(filepath, options = {}) {
        this.checkCurrentRepo();
        
        try {
            // Get file content at HEAD
            let headContent = '';
            try {
                const headOid = await this.git.resolveRef({
                    fs: this.fs,
                    dir: this.state.currentRepo,
                    ref: 'HEAD'
                });
                
                const { blob } = await this.git.readBlob({
                    fs: this.fs,
                    dir: this.state.currentRepo,
                    oid: headOid,
                    filepath: filepath
                });
                
                headContent = new TextDecoder().decode(blob);
            } catch (error) {
                // File doesn't exist in HEAD
            }
            
            // Get working directory content
            const workingContent = await this.fs.promises.readFile(
                `${this.state.currentRepo}/${filepath}`,
                'utf8'
            );
            
            // Generate diff
            const diff = this.generateDiff(headContent, workingContent, filepath);
            
            return diff;
            
        } catch (error) {
            console.error('Failed to generate diff:', error);
            throw error;
        }
    }
    
    generateDiff(oldContent, newContent, filepath) {
        // Simple line-based diff
        const oldLines = oldContent.split('\n');
        const newLines = newContent.split('\n');
        const diff = [];
        
        let lineNumber = 1;
        const maxLines = Math.max(oldLines.length, newLines.length);
        
        for (let i = 0; i < maxLines; i++) {
            const oldLine = oldLines[i];
            const newLine = newLines[i];
            
            if (oldLine === newLine) {
                diff.push({
                    type: 'unchanged',
                    content: oldLine || '',
                    lineNumber: lineNumber++
                });
            } else if (oldLine === undefined) {
                diff.push({
                    type: 'added',
                    content: newLine,
                    lineNumber: lineNumber++
                });
            } else if (newLine === undefined) {
                diff.push({
                    type: 'removed',
                    content: oldLine,
                    lineNumber: lineNumber
                });
            } else {
                diff.push({
                    type: 'removed',
                    content: oldLine,
                    lineNumber: lineNumber
                });
                diff.push({
                    type: 'added',
                    content: newLine,
                    lineNumber: lineNumber++
                });
            }
        }
        
        return {
            filepath: filepath,
            hunks: [{
                oldStart: 1,
                oldLines: oldLines.length,
                newStart: 1,
                newLines: newLines.length,
                lines: diff
            }]
        };
    }
    
    // History and Log
    async log(options = {}) {
        this.checkCurrentRepo();
        
        try {
            const commits = await this.git.log({
                fs: this.fs,
                dir: this.state.currentRepo,
                depth: options.limit || 50,
                ref: options.ref || 'HEAD'
            });
            
            this.state.history = commits.map(commit => ({
                sha: commit.oid,
                message: commit.commit.message,
                author: {
                    name: commit.commit.author.name,
                    email: commit.commit.author.email,
                    timestamp: commit.commit.author.timestamp
                },
                committer: {
                    name: commit.commit.committer.name,
                    email: commit.commit.committer.email,
                    timestamp: commit.commit.committer.timestamp
                },
                parents: commit.commit.parent,
                tree: commit.commit.tree
            }));
            
            return this.state.history;
            
        } catch (error) {
            console.error('Failed to get log:', error);
            throw error;
        }
    }
    
    async getCommit(sha) {
        this.checkCurrentRepo();
        
        try {
            const { commit } = await this.git.readCommit({
                fs: this.fs,
                dir: this.state.currentRepo,
                oid: sha
            });
            
            return {
                sha: sha,
                message: commit.message,
                author: commit.author,
                committer: commit.committer,
                parents: commit.parent,
                tree: commit.tree
            };
            
        } catch (error) {
            console.error('Failed to get commit:', error);
            throw error;
        }
    }
    
    // Remote Operations
    async addRemote(name, url) {
        this.checkCurrentRepo();
        
        try {
            await this.git.addRemote({
                fs: this.fs,
                dir: this.state.currentRepo,
                remote: name,
                url: url
            });
            
            this.state.remotes.set(name, url);
            
            this.emit('remote:added', { name, url });
            this.showNotification(`Remote ${name} added`, 'success');
            
        } catch (error) {
            console.error('Failed to add remote:', error);
            this.showNotification(`Failed to add remote: ${error.message}`, 'error');
            throw error;
        }
    }
    
    async removeRemote(name) {
        this.checkCurrentRepo();
        
        try {
            await this.git.deleteRemote({
                fs: this.fs,
                dir: this.state.currentRepo,
                remote: name
            });
            
            this.state.remotes.delete(name);
            
            this.emit('remote:removed', { name });
            this.showNotification(`Remote ${name} removed`, 'success');
            
        } catch (error) {
            console.error('Failed to remove remote:', error);
            this.showNotification(`Failed to remove remote: ${error.message}`, 'error');
            throw error;
        }
    }
    
    async getRemotes() {
        this.checkCurrentRepo();
        
        try {
            const remotes = await this.git.listRemotes({
                fs: this.fs,
                dir: this.state.currentRepo
            });
            
            this.state.remotes.clear();
            remotes.forEach(remote => {
                this.state.remotes.set(remote.remote, remote.url);
            });
            
            return remotes;
            
        } catch (error) {
            console.error('Failed to get remotes:', error);
            return [];
        }
    }
    
    // Configuration
    async getConfig(key) {
        this.checkCurrentRepo();
        
        try {
            const value = await this.git.getConfig({
                fs: this.fs,
                dir: this.state.currentRepo,
                path: key
            });
            
            return value;
            
        } catch (error) {
            console.error('Failed to get config:', error);
            return null;
        }
    }
    
    async setConfig(key, value) {
        this.checkCurrentRepo();
        
        try {
            await this.git.setConfig({
                fs: this.fs,
                dir: this.state.currentRepo,
                path: key,
                value: value
            });
            
            this.showNotification('Configuration updated', 'success');
            
        } catch (error) {
            console.error('Failed to set config:', error);
            this.showNotification(`Failed to set config: ${error.message}`, 'error');
            throw error;
        }
    }
    
    // Authentication
    async handleAuth(url) {
        // Show auth dialog
        const credentials = await this.showAuthDialog(url);
        
        if (!credentials) {
            throw new Error('Authentication cancelled');
        }
        
        return {
            username: credentials.username,
            password: credentials.password
        };
    }
    
    async showAuthDialog(url) {
        return new Promise((resolve) => {
            const modal = this.createModal({
                title: 'Authentication Required',
                content: `
                    <div class="git-auth-dialog">
                        <p>Authentication required for: ${url || 'repository'}</p>
                        <div class="form-group">
                            <label>Username</label>
                            <input type="text" id="git-auth-username" class="grace-input" placeholder="Username or token">
                        </div>
                        <div class="form-group">
                            <label>Password</label>
                            <input type="password" id="git-auth-password" class="grace-input" placeholder="Password or token">
                        </div>
                        <p class="hint">For GitHub, use a personal access token as the password.</p>
                    </div>
                `,
                buttons: [
                    {
                        text: 'Cancel',
                        class: 'secondary',
                        onclick: () => {
                            this.closeModal(modal);
                            resolve(null);
                        }
                    },
                    {
                        text: 'Authenticate',
                        class: 'primary',
                        onclick: () => {
                            const username = document.getElementById('git-auth-username').value;
                            const password = document.getElementById('git-auth-password').value;
                            
                            this.closeModal(modal);
                            resolve({ username, password });
                        }
                    }
                ]
            });
        });
    }
    
    // Merge Conflict Resolution
    async handleMergeConflicts() {
        const conflicts = await this.getConflictedFiles();
        
        if (conflicts.length === 0) {
            this.showNotification('No conflicts found', 'info');
            return;
        }
        
        this.showConflictResolver(conflicts);
    }
    
    async getConflictedFiles() {
        // TODO: Implement conflict detection
        return [];
    }
    
    showConflictResolver(conflicts) {
        const modal = this.createModal({
            title: 'Resolve Merge Conflicts',
            content: `
                <div class="git-conflict-resolver">
                    <p>The following files have conflicts:</p>
                    <ul class="conflict-list">
                        ${conflicts.map(file => `<li>${file}</li>`).join('')}
                    </ul>
                    <p>Please resolve the conflicts in your editor.</p>
                </div>
            `,
            buttons: [
                {
                    text: 'Open Editor',
                    class: 'primary',
                    onclick: () => {
                        this.emit('conflicts:open', { files: conflicts });
                        this.closeModal(modal);
                    }
                }
            ]
        });
    }
    
    // UI Setup
    setupUI() {
        // Create main container
        const container = document.createElement('div');
        container.className = 'git-interface';
        container.innerHTML = `
            <div class="git-header">
                <div class="git-repo-selector">
                    <select id="git-repo-select" onchange="gitInterface.handleRepoChange(this.value)">
                        <option value="">Select Repository</option>
                    </select>
                    <button class="git-btn" onclick="gitInterface.showNewRepoDialog()">
                        <span>➕</span> New
                    </button>
                </div>
                <div class="git-branch-info">
                    <span class="branch-icon">🌿</span>
                    <span id="git-current-branch">No branch</span>
                    <button class="git-btn" onclick="gitInterface.showBranchDialog()">
                        <span>🔽</span>
                    </button>
                </div>
            </div>
            
            <div class="git-tabs">
                <button class="git-tab active" onclick="gitInterface.switchTab('status')">Status</button>
                <button class="git-tab" onclick="gitInterface.switchTab('history')">History</button>
                <button class="git-tab" onclick="gitInterface.switchTab('branches')">Branches</button>
                <button class="git-tab" onclick="gitInterface.switchTab('remotes')">Remotes</button>
            </div>
            
            <div class="git-content">
                <div id="git-view-status" class="git-view active"></div>
                <div id="git-view-history" class="git-view"></div>
                <div id="git-view-branches" class="git-view"></div>
                <div id="git-view-remotes" class="git-view"></div>
            </div>
            
            <div class="git-actions">
                <button class="git-btn primary" onclick="gitInterface.showCommitDialog()">
                    <span>✓</span> Commit
                </button>
                <button class="git-btn" onclick="gitInterface.pull()">
                    <span>⬇</span> Pull
                </button>
                <button class="git-btn" onclick="gitInterface.push()">
                    <span>⬆</span> Push
                </button>
                <button class="git-btn" onclick="gitInterface.fetch()">
                    <span>🔄</span> Fetch
                </button>
            </div>
        `;
        
        // Store references
        this.elements = {
            container: container,
            repoSelect: container.querySelector('#git-repo-select'),
            branchInfo: container.querySelector('#git-current-branch'),
            views: {
                status: container.querySelector('#git-view-status'),
                history: container.querySelector('#git-view-history'),
                branches: container.querySelector('#git-view-branches'),
                remotes: container.querySelector('#git-view-remotes')
            }
        };
        
        // Update repo selector
        this.updateRepoSelector();
        
        // Render initial view
        this.renderStatusView();
        
        // Inject styles
        this.injectStyles();
    }
    
    injectStyles() {
        const styleId = 'git-interface-styles';
        
        if (document.getElementById(styleId)) {
            return;
        }
        
        const styles = document.createElement('style');
        styles.id = styleId;
        styles.textContent = `
            .git-interface {
                background: var(--grace-secondary, #1a1b2e);
                border: 1px solid var(--grace-border, #3a3b4e);
                border-radius: 8px;
                padding: 20px;
                font-family: var(--grace-font-primary, -apple-system, sans-serif);
            }
            
            .git-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            
            .git-repo-selector {
                display: flex;
                gap: 10px;
                align-items: center;
            }
            
            .git-repo-selector select {
                background: var(--grace-primary, #0a0b1e);
                color: var(--grace-text, #ffffff);
                border: 1px solid var(--grace-border, #3a3b4e);
                border-radius: 4px;
                padding: 8px 12px;
                font-size: 14px;
                min-width: 200px;
            }
            
            .git-branch-info {
                display: flex;
                align-items: center;
                gap: 8px;
                background: var(--grace-primary, #0a0b1e);
                padding: 8px 16px;
                border-radius: 20px;
                border: 1px solid var(--grace-border, #3a3b4e);
            }
            
            .branch-icon {
                font-size: 16px;
            }
            
            .git-btn {
                background: var(--grace-tertiary, #2a2b3e);
                color: var(--grace-text, #ffffff);
                border: 1px solid var(--grace-border, #3a3b4e);
                border-radius: 4px;
                padding: 8px 16px;
                font-size: 14px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 6px;
                transition: all 0.2s;
            }
            
            .git-btn:hover {
                background: var(--grace-accent, #00d4ff);
                color: black;
                border-color: var(--grace-accent, #00d4ff);
            }
            
            .git-btn.primary {
                background: var(--grace-accent, #00d4ff);
                color: black;
                border-color: var(--grace-accent, #00d4ff);
            }
            
            .git-btn.primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
            }
            
            .git-tabs {
                display: flex;
                gap: 0;
                margin-bottom: 20px;
                border-bottom: 1px solid var(--grace-border, #3a3b4e);
            }
            
            .git-tab {
                background: none;
                color: var(--grace-text-secondary, #a0a8b7);
                border: none;
                border-bottom: 2px solid transparent;
                padding: 12px 24px;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .git-tab:hover {
                color: var(--grace-text, #ffffff);
            }
            
            .git-tab.active {
                color: var(--grace-accent, #00d4ff);
                border-bottom-color: var(--grace-accent, #00d4ff);
            }
            
            .git-content {
                min-height: 400px;
                margin-bottom: 20px;
            }
            
            .git-view {
                display: none;
            }
            
            .git-view.active {
                display: block;
            }
            
            .git-actions {
                display: flex;
                gap: 10px;
                padding-top: 20px;
                border-top: 1px solid var(--grace-border, #3a3b4e);
            }
            
            /* Status View */
            .git-status-section {
                margin-bottom: 24px;
            }
            
            .git-status-header {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 12px;
                color: var(--grace-text, #ffffff);
            }
            
            .git-file-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            
            .git-file-item {
                display: flex;
                align-items: center;
                padding: 8px 12px;
                background: var(--grace-primary, #0a0b1e);
                border: 1px solid var(--grace-border, #3a3b4e);
                border-radius: 4px;
                margin-bottom: 4px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .git-file-item:hover {
                border-color: var(--grace-accent, #00d4ff);
                transform: translateX(4px);
            }
            
            .git-file-status {
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                margin-right: 12px;
                font-size: 12px;
                font-weight: bold;
            }
            
            .git-file-status.modified {
                background: var(--grace-warning, #ff8c00);
                color: black;
            }
            
            .git-file-status.added {
                background: var(--grace-success, #00ff88);
                color: black;
            }
            
            .git-file-status.deleted {
                background: var(--grace-error, #ff4444);
                color: white;
            }
            
            .git-file-status.untracked {
                background: var(--grace-text-secondary, #a0a8b7);
                color: black;
            }
            
            .git-file-path {
                flex: 1;
                font-family: var(--grace-font-monospace, monospace);
                font-size: 13px;
            }
            
            .git-file-actions {
                display: flex;
                gap: 8px;
            }
            
            .git-file-action {
                background: var(--grace-tertiary, #2a2b3e);
                border: 1px solid var(--grace-border, #3a3b4e);
                border-radius: 4px;
                padding: 4px 8px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .git-file-action:hover {
                background: var(--grace-accent, #00d4ff);
                color: black;
            }
            
            /* History View */
            .git-commit {
                background: var(--grace-primary, #0a0b1e);
                border: 1px solid var(--grace-border, #3a3b4e);
                border-radius: 6px;
                padding: 16px;
                margin-bottom: 12px;
                transition: all 0.2s;
            }
            
            .git-commit:hover {
                border-color: var(--grace-accent, #00d4ff);
                transform: translateY(-2px);
            }
            
            .git-commit-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }
            
            .git-commit-sha {
                font-family: var(--grace-font-monospace, monospace);
                font-size: 12px;
                color: var(--grace-accent, #00d4ff);
                background: var(--grace-tertiary, #2a2b3e);
                padding: 4px 8px;
                border-radius: 4px;
            }
            
            .git-commit-date {
                font-size: 12px;
                color: var(--grace-text-secondary, #a0a8b7);
            }
            
            .git-commit-message {
                font-size: 14px;
                margin-bottom: 8px;
                color: var(--grace-text, #ffffff);
            }
            
            .git-commit-author {
                font-size: 12px;
                color: var(--grace-text-secondary, #a0a8b7);
            }
            
            /* Modals */
            .git-modal {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: var(--grace-secondary, #1a1b2e);
                border: 1px solid var(--grace-border, #3a3b4e);
                border-radius: 8px;
                padding: 24px;
                min-width: 400px;
                max-width: 600px;
                z-index: 1000;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            }
            
            .git-modal-header {
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 20px;
                color: var(--grace-text, #ffffff);
            }
            
            .git-modal-content {
                margin-bottom: 24px;
            }
            
            .git-modal-actions {
                display: flex;
                justify-content: flex-end;
                gap: 12px;
            }
            
            .grace-input {
                width: 100%;
                background: var(--grace-primary, #0a0b1e);
                color: var(--grace-text, #ffffff);
                border: 1px solid var(--grace-border, #3a3b4e);
                border-radius: 4px;
                padding: 10px 12px;
                font-size: 14px;
                transition: all 0.2s;
            }
            
            .grace-input:focus {
                outline: none;
                border-color: var(--grace-accent, #00d4ff);
                box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
            }
            
            .form-group {
                margin-bottom: 16px;
            }
            
            .form-group label {
                display: block;
                font-size: 14px;
                font-weight: 500;
                margin-bottom: 8px;
                color: var(--grace-text, #ffffff);
            }
            
            .hint {
                font-size: 12px;
                color: var(--grace-text-secondary, #a0a8b7);
                margin-top: 8px;
            }
            
            /* Progress */
            .git-progress {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: var(--grace-secondary, #1a1b2e);
                border: 1px solid var(--grace-border, #3a3b4e);
                border-radius: 8px;
                padding: 16px;
                min-width: 300px;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
            }
            
            .git-progress-title {
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 8px;
                color: var(--grace-text, #ffffff);
            }
            
            .git-progress-bar {
                height: 4px;
                background: var(--grace-primary, #0a0b1e);
                border-radius: 2px;
                overflow: hidden;
                margin-bottom: 8px;
            }
            
            .git-progress-fill {
                height: 100%;
                background: var(--grace-accent, #00d4ff);
                transition: width 0.3s;
            }
            
            .git-progress-text {
                font-size: 12px;
                color: var(--grace-text-secondary, #a0a8b7);
            }
            
            /* Empty State */
            .git-empty-state {
                text-align: center;
                padding: 60px 20px;
                color: var(--grace-text-secondary, #a0a8b7);
            }
            
            .git-empty-icon {
                font-size: 48px;
                margin-bottom: 16px;
                opacity: 0.5;
            }
            
            .git-empty-message {
                font-size: 16px;
                margin-bottom: 24px;
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    // UI Methods
    updateRepoSelector() {
        const select = this.elements.repoSelect;
        select.innerHTML = '<option value="">Select Repository</option>';
        
        this.state.repositories.forEach((repo, path) => {
            const option = document.createElement('option');
            option.value = path;
            option.textContent = repo.name;
            select.appendChild(option);
        });
        
        if (this.state.currentRepo) {
            select.value = this.state.currentRepo;
        }
    }
    
    async handleRepoChange(path) {
        if (!path) return;
        
        try {
            await this.setCurrentRepo(path);
        } catch (error) {
            console.error('Failed to change repository:', error);
        }
    }
    
    async setCurrentRepo(path) {
        this.state.currentRepo = path;
        
        // Update repository access time
        const repo = this.state.repositories.get(path);
        if (repo) {
            repo.lastAccessed = Date.now();
            this.saveRepositories();
        }
        
        // Update branch info
        await this.getCurrentBranch();
        this.updateBranchInfo();
        
        // Update status
        await this.updateStatus();
        
        // Update all views
        this.renderCurrentView();
        
        this.emit('repo:changed', { path });
    }
    
    updateBranchInfo() {
        const branchInfo = this.elements.branchInfo;
        branchInfo.textContent = this.state.currentBranch || 'No branch';
    }
    
    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.git-tab').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Update views
        Object.entries(this.elements.views).forEach(([name, view]) => {
            view.classList.toggle('active', name === tab);
        });
        
        this.activeView = tab;
        this.renderCurrentView();
    }
    
    renderCurrentView() {
        switch (this.activeView) {
            case 'status':
                this.renderStatusView();
                break;
            case 'history':
                this.renderHistoryView();
                break;
            case 'branches':
                this.renderBranchesView();
                break;
            case 'remotes':
                this.renderRemotesView();
                break;
        }
    }
    
    async renderStatusView() {
        const view = this.elements.views.status;
        
        if (!this.state.currentRepo) {
            view.innerHTML = `
                <div class="git-empty-state">
                    <div class="git-empty-icon">📁</div>
                    <div class="git-empty-message">No repository selected</div>
                    <button class="git-btn primary" onclick="gitInterface.showNewRepoDialog()">
                        Open Repository
                    </button>
                </div>
            `;
            return;
        }
        
        await this.updateStatus();
        const status = this.state.status;
        
        view.innerHTML = `
            ${status.staged.length > 0 ? `
                <div class="git-status-section">
                    <h3 class="git-status-header">Staged Changes (${status.staged.length})</h3>
                    <ul class="git-file-list">
                        ${status.staged.map(file => this.renderFileItem(file, 'staged')).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${status.unstaged.length > 0 ? `
                <div class="git-status-section">
                    <h3 class="git-status-header">Unstaged Changes (${status.unstaged.length})</h3>
                    <ul class="git-file-list">
                        ${status.unstaged.map(file => this.renderFileItem(file, 'unstaged')).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${status.untracked.length > 0 ? `
                <div class="git-status-section">
                    <h3 class="git-status-header">Untracked Files (${status.untracked.length})</h3>
                    <ul class="git-file-list">
                        ${status.untracked.map(file => this.renderFileItem(file, 'untracked')).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${status.staged.length === 0 && status.unstaged.length === 0 && status.untracked.length === 0 ? `
                <div class="git-empty-state">
                    <div class="git-empty-icon">✨</div>
                    <div class="git-empty-message">Working tree is clean</div>
                </div>
            ` : ''}
        `;
    }
    
    renderFileItem(file, status) {
        const statusIcons = {
            staged: 'S',
            unstaged: 'M',
            untracked: 'U',
            added: 'A',
            deleted: 'D',
            modified: 'M'
        };
        
        return `
            <li class="git-file-item" onclick="gitInterface.showFileDiff('${file}')">
                <div class="git-file-status ${status}">${statusIcons[status]}</div>
                <div class="git-file-path">${file}</div>
                <div class="git-file-actions">
                    ${status === 'staged' ? `
                        <button class="git-file-action" onclick="event.stopPropagation(); gitInterface.remove('${file}')">
                            Unstage
                        </button>
                    ` : `
                        <button class="git-file-action" onclick="event.stopPropagation(); gitInterface.add('${file}')">
                            Stage
                        </button>
                    `}
                </div>
            </li>
        `;
    }
    
    async renderHistoryView() {
        const view = this.elements.views.history;
        
        if (!this.state.currentRepo) {
            view.innerHTML = `
                <div class="git-empty-state">
                    <div class="git-empty-icon">📜</div>
                    <div class="git-empty-message">No repository selected</div>
                </div>
            `;
            return;
        }
        
        await this.updateHistory();
        const commits = this.state.history;
        
        if (commits.length === 0) {
            view.innerHTML = `
                <div class="git-empty-state">
                    <div class="git-empty-icon">📜</div>
                    <div class="git-empty-message">No commits yet</div>
                </div>
            `;
            return;
        }
        
        view.innerHTML = commits.map(commit => `
            <div class="git-commit">
                <div class="git-commit-header">
                    <span class="git-commit-sha">${commit.sha.substring(0, 7)}</span>
                    <span class="git-commit-date">${this.formatDate(commit.author.timestamp)}</span>
                </div>
                <div class="git-commit-message">${this.escapeHtml(commit.message)}</div>
                <div class="git-commit-author">
                    ${commit.author.name} &lt;${commit.author.email}&gt;
                </div>
            </div>
        `).join('');
    }
    
    async renderBranchesView() {
        const view = this.elements.views.branches;
        
        if (!this.state.currentRepo) {
            view.innerHTML = `
                <div class="git-empty-state">
                    <div class="git-empty-icon">🌿</div>
                    <div class="git-empty-message">No repository selected</div>
                </div>
            `;
            return;
        }
        
        const branches = await this.getBranches();
        
        view.innerHTML = `
            <div class="git-branches">
                <div class="git-branch-actions">
                    <button class="git-btn" onclick="gitInterface.showNewBranchDialog()">
                        <span>➕</span> New Branch
                    </button>
                </div>
                <ul class="git-branch-list">
                    ${branches.map(branch => `
                        <li class="git-branch-item ${branch.current ? 'current' : ''}">
                            <span class="branch-icon">🌿</span>
                            <span class="branch-name">${branch.name}</span>
                            ${branch.current ? '<span class="current-badge">current</span>' : ''}
                            ${!branch.current ? `
                                <div class="branch-actions">
                                    <button class="git-file-action" onclick="gitInterface.checkout('${branch.name}')">
                                        Checkout
                                    </button>
                                    <button class="git-file-action" onclick="gitInterface.deleteBranch('${branch.name}')">
                                        Delete
                                    </button>
                                </div>
                            ` : ''}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
    
    async renderRemotesView() {
        const view = this.elements.views.remotes;
        
        if (!this.state.currentRepo) {
            view.innerHTML = `
                <div class="git-empty-state">
                    <div class="git-empty-icon">🌐</div>
                    <div class="git-empty-message">No repository selected</div>
                </div>
            `;
            return;
        }
        
        const remotes = await this.getRemotes();
        
        view.innerHTML = `
            <div class="git-remotes">
                <div class="git-remote-actions">
                    <button class="git-btn" onclick="gitInterface.showAddRemoteDialog()">
                        <span>➕</span> Add Remote
                    </button>
                </div>
                ${remotes.length > 0 ? `
                    <ul class="git-remote-list">
                        ${remotes.map(remote => `
                            <li class="git-remote-item">
                                <div class="remote-info">
                                    <div class="remote-name">${remote.remote}</div>
                                    <div class="remote-url">${remote.url}</div>
                                </div>
                                <div class="remote-actions">
                                    <button class="git-file-action" onclick="gitInterface.removeRemote('${remote.remote}')">
                                        Remove
                                    </button>
                                </div>
                            </li>
                        `).join('')}
                    </ul>
                ` : `
                    <div class="git-empty-state">
                        <div class="git-empty-icon">🌐</div>
                        <div class="git-empty-message">No remotes configured</div>
                    </div>
                `}
            </div>
        `;
    }
    
    // Dialog Methods
    showNewRepoDialog() {
        const modal = this.createModal({
            title: 'Open Repository',
            content: `
                <div class="git-repo-dialog">
                    <div class="repo-options">
                        <button class="repo-option" onclick="gitInterface.showInitDialog()">
                            <div class="option-icon">🆕</div>
                            <div class="option-title">Initialize New Repository</div>
                            <div class="option-desc">Create a new Git repository</div>
                        </button>
                        <button class="repo-option" onclick="gitInterface.showCloneDialog()">
                            <div class="option-icon">📥</div>
                            <div class="option-title">Clone Repository</div>
                            <div class="option-desc">Clone from a remote URL</div>
                        </button>
                        <button class="repo-option" onclick="gitInterface.showOpenDialog()">
                            <div class="option-icon">📂</div>
                            <div class="option-title">Open Existing</div>
                            <div class="option-desc">Open a local repository</div>
                        </button>
                    </div>
                </div>
            `
        });
    }
    
    showInitDialog() {
        this.closeAllModals();
        
        const modal = this.createModal({
            title: 'Initialize Repository',
            content: `
                <div class="form-group">
                    <label>Repository Path</label>
                    <input type="text" id="init-path" class="grace-input" placeholder="/path/to/repository">
                </div>
                <div class="form-group">
                    <label>Initial Branch Name</label>
                    <input type="text" id="init-branch" class="grace-input" value="${this.config.defaultBranch}">
                </div>
            `,
            buttons: [
                {
                    text: 'Cancel',
                    class: 'secondary',
                    onclick: () => this.closeModal(modal)
                },
                {
                    text: 'Initialize',
                    class: 'primary',
                    onclick: async () => {
                        const path = document.getElementById('init-path').value;
                        const branch = document.getElementById('init-branch').value;
                        
                        if (!path) {
                            this.showNotification('Please enter a path', 'error');
                            return;
                        }
                        
                        this.closeModal(modal);
                        await this.init(path, { branch });
                    }
                }
            ]
        });
    }
    
    showCloneDialog() {
        this.closeAllModals();
        
        const modal = this.createModal({
            title: 'Clone Repository',
            content: `
                <div class="form-group">
                    <label>Repository URL</label>
                    <input type="text" id="clone-url" class="grace-input" placeholder="https://github.com/user/repo.git">
                </div>
                <div class="form-group">
                    <label>Local Path</label>
                    <input type="text" id="clone-path" class="grace-input" placeholder="/path/to/clone">
                </div>
                <div class="form-group">
                    <label>Branch (optional)</label>
                    <input type="text" id="clone-branch" class="grace-input" placeholder="main">
                </div>
            `,
            buttons: [
                {
                    text: 'Cancel',
                    class: 'secondary',
                    onclick: () => this.closeModal(modal)
                },
                {
                    text: 'Clone',
                    class: 'primary',
                    onclick: async () => {
                        const url = document.getElementById('clone-url').value;
                        const path = document.getElementById('clone-path').value;
                        const branch = document.getElementById('clone-branch').value;
                        
                        if (!url || !path) {
                            this.showNotification('Please fill in all required fields', 'error');
                            return;
                        }
                        
                        this.closeModal(modal);
                        await this.clone(url, path, { branch });
                    }
                }
            ]
        });
    }
    
    showCommitDialog() {
        if (!this.state.currentRepo) {
            this.showNotification('No repository selected', 'error');
            return;
        }
        
        if (this.state.status.staged.length === 0) {
            this.showNotification('No files staged for commit', 'warning');
            return;
        }
        
        const modal = this.createModal({
            title: 'Create Commit',
            content: `
                <div class="form-group">
                    <label>Commit Message</label>
                    <textarea id="commit-message" class="grace-input" rows="4" 
                              placeholder="Enter commit message..."></textarea>
                </div>
                <div class="commit-files">
                    <strong>Files to commit:</strong>
                    <ul>
                        ${this.state.status.staged.map(file => `<li>${file}</li>`).join('')}
                    </ul>
                </div>
            `,
            buttons: [
                {
                    text: 'Cancel',
                    class: 'secondary',
                    onclick: () => this.closeModal(modal)
                },
                {
                    text: 'Commit',
                    class: 'primary',
                    onclick: async () => {
                        const message = document.getElementById('commit-message').value;
                        
                        if (!message.trim()) {
                            this.showNotification('Please enter a commit message', 'error');
                            return;
                        }
                        
                        this.closeModal(modal);
                        await this.commit(message);
                    }
                }
            ]
        });
        
        // Focus message input
        setTimeout(() => {
            document.getElementById('commit-message').focus();
        }, 100);
    }
    
    showBranchDialog() {
        // TODO: Implement branch switcher dialog
    }
    
    showNewBranchDialog() {
        const modal = this.createModal({
            title: 'Create Branch',
            content: `
                <div class="form-group">
                    <label>Branch Name</label>
                    <input type="text" id="branch-name" class="grace-input" placeholder="feature/new-feature">
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="branch-checkout" checked>
                        Checkout after creation
                    </label>
                </div>
            `,
            buttons: [
                {
                    text: 'Cancel',
                    class: 'secondary',
                    onclick: () => this.closeModal(modal)
                },
                {
                    text: 'Create',
                    class: 'primary',
                    onclick: async () => {
                        const name = document.getElementById('branch-name').value;
                        const checkout = document.getElementById('branch-checkout').checked;
                        
                        if (!name) {
                            this.showNotification('Please enter a branch name', 'error');
                            return;
                        }
                        
                        this.closeModal(modal);
                        await this.branch(name, { checkout });
                    }
                }
            ]
        });
    }
    
    async deleteBranch(name) {
        if (confirm(`Delete branch "${name}"?`)) {
            await this.branch(name, { delete: true });
        }
    }
    
    showAddRemoteDialog() {
        const modal = this.createModal({
            title: 'Add Remote',
            content: `
                <div class="form-group">
                    <label>Remote Name</label>
                    <input type="text" id="remote-name" class="grace-input" value="origin">
                </div>
                <div class="form-group">
                    <label>Remote URL</label>
                    <input type="text" id="remote-url" class="grace-input" placeholder="https://github.com/user/repo.git">
                </div>
            `,
            buttons: [
                {
                    text: 'Cancel',
                    class: 'secondary',
                    onclick: () => this.closeModal(modal)
                },
                {
                    text: 'Add',
                    class: 'primary',
                    onclick: async () => {
                        const name = document.getElementById('remote-name').value;
                        const url = document.getElementById('remote-url').value;
                        
                        if (!name || !url) {
                            this.showNotification('Please fill in all fields', 'error');
                            return;
                        }
                        
                        this.closeModal(modal);
                        await this.addRemote(name, url);
                    }
                }
            ]
        });
    }
    
    async showFileDiff(filepath) {
        // TODO: Implement diff viewer
        this.emit('file:diff', { filepath });
    }
    
    // Modal Management
    createModal(options) {
        const modal = document.createElement('div');
        modal.className = 'git-modal';
        modal.innerHTML = `
            <div class="git-modal-header">${options.title}</div>
            <div class="git-modal-content">${options.content}</div>
            ${options.buttons ? `
                <div class="git-modal-actions">
                    ${options.buttons.map(btn => `
                        <button class="git-btn ${btn.class || ''}">${btn.text}</button>
                    `).join('')}
                </div>
            ` : ''}
        `;
        
        // Bind button handlers
        if (options.buttons) {
            const buttons = modal.querySelectorAll('.git-modal-actions button');
            options.buttons.forEach((btn, index) => {
                if (buttons[index] && btn.onclick) {
                    buttons[index].onclick = btn.onclick;
                }
            });
        }
        
        // Add overlay
        const overlay = document.createElement('div');
        overlay.className = 'git-modal-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
        `;
        overlay.onclick = () => this.closeModal(modal);
        
        document.body.appendChild(overlay);
        document.body.appendChild(modal);
        
        modal._overlay = overlay;
        
        return modal;
    }
    
    closeModal(modal) {
        if (modal._overlay) {
            modal._overlay.remove();
        }
        modal.remove();
    }
    
    closeAllModals() {
        document.querySelectorAll('.git-modal').forEach(modal => {
            this.closeModal(modal);
        });
    }
    
    // Progress UI
    updateProgress(progress) {
        let progressEl = document.querySelector('.git-progress');
        
        if (progress.phase === 'Resolving deltas' && progress.loaded === progress.total) {
            // Operation complete
            if (progressEl) {
                setTimeout(() => progressEl.remove(), 1000);
            }
            return;
        }
        
        if (!progressEl) {
            progressEl = document.createElement('div');
            progressEl.className = 'git-progress';
            progressEl.innerHTML = `
                <div class="git-progress-title">Operation in progress...</div>
                <div class="git-progress-bar">
                    <div class="git-progress-fill"></div>
                </div>
                <div class="git-progress-text"></div>
            `;
            document.body.appendChild(progressEl);
        }
        
        const fill = progressEl.querySelector('.git-progress-fill');
        const text = progressEl.querySelector('.git-progress-text');
        
        const percent = progress.total > 0 ? (progress.loaded / progress.total) * 100 : 0;
        fill.style.width = `${percent}%`;
        text.textContent = `${progress.phase}: ${progress.loaded}/${progress.total}`;
    }
    
    // Notifications
    showNotification(message, type = 'info') {
        if (window.graceInterface) {
            window.graceInterface.showNotification({
                message: message,
                type: type
            });
        } else {
            console.log(`[${type}] ${message}`);
        }
    }
    
    // Utility Methods
    checkCurrentRepo() {
        if (!this.state.currentRepo) {
            throw new Error('No repository selected');
        }
    }
    
    setOperating(operating) {
        this.state.isOperating = operating;
        
        // Disable/enable buttons
        document.querySelectorAll('.git-btn').forEach(btn => {
            btn.disabled = operating;
        });
    }
    
    async updateStatus() {
        if (!this.state.currentRepo) return;
        
        try {
            await this.status();
            
            if (this.activeView === 'status') {
                this.renderStatusView();
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    }
    
    async updateHistory() {
        if (!this.state.currentRepo) return;
        
        try {
            await this.log();
            
            if (this.activeView === 'history') {
                this.renderHistoryView();
            }
        } catch (error) {
            console.error('Failed to update history:', error);
        }
    }
    
    formatDate(timestamp) {
        const date = new Date(timestamp * 1000);
        const now = new Date();
        const diff = now - date;
        
        // Less than 1 minute
        if (diff < 60000) {
            return 'just now';
        }
        
        // Less than 1 hour
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        }
        
        // Less than 1 day
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        }
        
        // Less than 1 week
        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        }
        
        // Default to date string
        return date.toLocaleDateString();
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    getRepoName(path) {
        return path.split('/').pop() || path.split('\\').pop() || path;
    }
    
    // Auto-fetch
    startAutoFetch() {
        this.autoFetchInterval = setInterval(() => {
            if (this.state.currentRepo && !this.state.isOperating) {
                this.fetch().catch(() => {
                    // Ignore fetch errors (might be offline)
                });
            }
        }, this.config.fetchInterval);
    }
    
    stopAutoFetch() {
        if (this.autoFetchInterval) {
            clearInterval(this.autoFetchInterval);
            this.autoFetchInterval = null;
        }
    }
    
    // Grace Core Integration
    connectToGraceCore() {
        if (window.graceCore) {
            // Register Git module
            window.graceCore.loadModule('git', {
                name: 'git',
                version: '1.0.0',
                execute: async (command, params) => {
                    switch (command) {
                        case 'init':
                            return await this.init(params.path, params.options);
                        case 'clone':
                            return await this.clone(params.url, params.path, params.options);
                        case 'commit':
                            return await this.commit(params.message, params.options);
                        case 'push':
                            return await this.push(params.remote, params.options);
                        case 'pull':
                            return await this.pull(params.remote, params.options);
                        case 'status':
                            return await this.status();
                        case 'log':
                            return await this.log(params.options);
                        default:
                            throw new Error(`Unknown git command: ${command}`);
                    }
                }
            });
            
            console.log('✅ Git Interface connected to Grace Core');
        }
    }
    
    // Event System
    emit(event, data) {
        const customEvent = new CustomEvent(`git:${event}`, { detail: data });
        this.events.dispatchEvent(customEvent);
        
        // Also emit to window
        if (typeof window !== 'undefined') {
            window.dispatchEvent(customEvent);
        }
    }
    
    on(event, handler) {
        this.events.addEventListener(`git:${event}`, handler);
    }
    
    off(event, handler) {
        this.events.removeEventListener(`git:${event}`, handler);
    }
    
    // Cleanup
    destroy() {
        // Stop auto-fetch
        this.stopAutoFetch();
        
        // Remove UI
        if (this.elements.container) {
            this.elements.container.remove();
        }
        
        // Clear state
        this.state.repositories.clear();
        this.state.remotes.clear();
        
        console.log('Git Interface destroyed');
    }
}

// Export GitInterface
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GitInterface;
} else if (typeof window !== 'undefined') {
    window.GitInterface = GitInterface;
    
    // Auto-initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        window.gitInterface = new GitInterface();
    });
}