// PaperMind Popup Script
// Handles popup interface and user interactions

class PaperMindPopup {
    constructor() {
        this.currentTab = null;
        this.currentPaper = null;
        this.settings = {};
        this.init();
    }

    async init() {
        await this.loadSettings();
        await this.getCurrentTab();
        this.setupEventListeners();
        this.updateUI();
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get([
                'autoAnalyze',
                'highlightMode',
                'aiModel',
                'language'
            ]);

            this.settings = {
                autoAnalyze: result.autoAnalyze !== false,
                highlightMode: result.highlightMode || false,
                aiModel: result.aiModel || 'gemini-nano',
                language: result.language || 'en'
            };
        } catch (error) {
            console.error('Error loading settings:', error);
            this.settings = {
                autoAnalyze: true,
                highlightMode: false,
                aiModel: 'gemini-nano',
                language: 'en'
            };
        }
    }

    async getCurrentTab() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            this.currentTab = tab;

            if (this.isPaperSite(tab.url)) {
                await this.detectCurrentPaper();
            }
        } catch (error) {
            console.error('Error getting current tab:', error);
        }
    }

    isPaperSite(url) {
        if (!url) return false;

        const paperIndicators = [
            'arxiv.org',
            'scholar.google.com',
            'nature.com',
            'science.org',
            'springer.com',
            'ieeexplore.ieee.org',
            'acm.org'
        ];

        return paperIndicators.some(indicator => url.includes(indicator));
    }

    async detectCurrentPaper() {
        try {
            const response = await chrome.tabs.sendMessage(this.currentTab.id, {
                action: 'getPaperData'
            });

            if (response && response.paperData) {
                this.currentPaper = response.paperData;
                this.updatePaperInfo();
            }
        } catch (error) {
            console.error('Error detecting paper:', error);
        }
    }

    setupEventListeners() {
        // Main action buttons
        document.getElementById('analyze-btn').addEventListener('click', () => {
            this.analyzeCurrentPaper();
        });

        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettings();
        });

        // Modal controls
        this.setupModalControls();

        // Footer links
        document.getElementById('help-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.showHelp();
        });

        document.getElementById('about-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.showAbout();
        });
    }

    setupModalControls() {
        // Settings modal
        const settingsModal = document.getElementById('settings-modal');
        const closeSettings = document.getElementById('close-settings');
        const saveSettings = document.getElementById('save-settings');
        const resetSettings = document.getElementById('reset-settings');

        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettings();
        });

        closeSettings.addEventListener('click', () => {
            this.hideSettings();
        });

        saveSettings.addEventListener('click', () => {
            this.saveSettings();
        });

        resetSettings.addEventListener('click', () => {
            this.resetSettings();
        });

        // Help modal
        const helpModal = document.getElementById('help-modal');
        const closeHelp = document.getElementById('close-help');

        closeHelp.addEventListener('click', () => {
            this.hideHelp();
        });

        // Close modals when clicking outside
        [settingsModal, helpModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        });
    }

    updateUI() {
        this.updateStatus();
        this.updatePaperInfo();
        this.updateRecentPapers();
        this.updateAISettings();
    }

    updateStatus() {
        const statusIndicator = document.getElementById('status-indicator');
        const statusDot = statusIndicator.querySelector('.status-dot');
        const statusText = statusIndicator.querySelector('.status-text');

        if (this.currentPaper) {
            statusDot.style.background = '#4ade80';
            statusText.textContent = 'Paper Detected';
        } else if (this.isPaperSite(this.currentTab?.url)) {
            statusDot.style.background = '#fbbf24';
            statusText.textContent = 'Analyzing...';
        } else {
            statusDot.style.background = '#6b7280';
            statusText.textContent = 'No Paper';
        }
    }

    updatePaperInfo() {
        const paperTitle = document.getElementById('paper-title');
        const paperUrl = document.getElementById('paper-url');
        const analyzeBtn = document.getElementById('analyze-btn');

        if (this.currentPaper) {
            paperTitle.textContent = this.currentPaper.title || 'Unknown Title';
            paperUrl.textContent = this.currentPaper.url || '';
            analyzeBtn.disabled = false;
        } else {
            paperTitle.textContent = 'No paper detected';
            paperUrl.textContent = '';
            analyzeBtn.disabled = true;
        }
    }

    async updateRecentPapers() {
        try {
            const result = await chrome.storage.local.get(['recentPapers']);
            const recentPapers = result.recentPapers || [];

            const papersList = document.getElementById('papers-list');

            if (recentPapers.length === 0) {
                papersList.innerHTML = '<div class="no-papers">No recent papers</div>';
                return;
            }

            papersList.innerHTML = recentPapers.slice(0, 5).map(paper => `
        <div class="paper-item" data-url="${paper.url}">
          <div class="paper-item-title">${paper.title}</div>
          <div class="paper-item-url">${paper.url}</div>
        </div>
      `).join('');

            // Add click handlers for recent papers
            papersList.querySelectorAll('.paper-item').forEach(item => {
                item.addEventListener('click', () => {
                    const url = item.dataset.url;
                    chrome.tabs.create({ url });
                });
            });

        } catch (error) {
            console.error('Error updating recent papers:', error);
        }
    }

    updateAISettings() {
        document.getElementById('ai-model').textContent =
            this.settings.aiModel === 'gemini-nano' ? 'Gemini Nano' : 'Gemini Pro';
    }

    async analyzeCurrentPaper() {
        if (!this.currentPaper) return;

        try {
            this.setProcessingStatus(true);

            const response = await chrome.tabs.sendMessage(this.currentTab.id, {
                action: 'analyzePaper'
            });

            if (response && response.success) {
                this.showNotification('Paper analysis started! Check the summary panel.', 'success');
                this.addToRecentPapers(this.currentPaper);
            } else {
                this.showNotification('Failed to start analysis. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error analyzing paper:', error);
            this.showNotification('Error analyzing paper. Please try again.', 'error');
        } finally {
            this.setProcessingStatus(false);
        }
    }

    setProcessingStatus(isProcessing) {
        const processingStatus = document.getElementById('processing-status');
        const analyzeBtn = document.getElementById('analyze-btn');

        if (isProcessing) {
            processingStatus.textContent = 'Processing...';
            analyzeBtn.disabled = true;
            analyzeBtn.innerHTML = '<span class="btn-icon">⏳</span> Analyzing...';
        } else {
            processingStatus.textContent = 'Ready';
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<span class="btn-icon">🔍</span> Analyze Paper';
        }
    }

    showSettings() {
        this.populateSettingsForm();
        document.getElementById('settings-modal').classList.add('show');
    }

    hideSettings() {
        document.getElementById('settings-modal').classList.remove('show');
    }

    populateSettingsForm() {
        document.getElementById('auto-analyze').checked = this.settings.autoAnalyze;
        document.getElementById('highlight-mode').checked = this.settings.highlightMode;
        document.getElementById('ai-model-select').value = this.settings.aiModel;
        document.getElementById('language-select').value = this.settings.language;
    }

    async saveSettings() {
        const newSettings = {
            autoAnalyze: document.getElementById('auto-analyze').checked,
            highlightMode: document.getElementById('highlight-mode').checked,
            aiModel: document.getElementById('ai-model-select').value,
            language: document.getElementById('language-select').value
        };

        try {
            await chrome.storage.sync.set(newSettings);
            this.settings = newSettings;
            this.hideSettings();
            this.showNotification('Settings saved successfully!', 'success');
            this.updateAISettings();
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showNotification('Failed to save settings. Please try again.', 'error');
        }
    }

    async resetSettings() {
        if (confirm('Are you sure you want to reset all settings to default?')) {
            try {
                await chrome.storage.sync.clear();
                await this.loadSettings();
                this.populateSettingsForm();
                this.showNotification('Settings reset to default!', 'success');
            } catch (error) {
                console.error('Error resetting settings:', error);
                this.showNotification('Failed to reset settings. Please try again.', 'error');
            }
        }
    }

    showHelp() {
        document.getElementById('help-modal').classList.add('show');
    }

    hideHelp() {
        document.getElementById('help-modal').classList.remove('show');
    }

    showAbout() {
        alert(`PaperMind AI Assistant v1.0.0

A Chrome extension that transforms dense research papers into interactive summaries using Chrome's built-in AI capabilities.

Features:
• AI-powered paper analysis
• Interactive Q&A
• Visual diagrams
• Multi-language support
• Smart highlighting

Built with Chrome's built-in AI APIs for privacy and performance.`);
    }

    async addToRecentPapers(paper) {
        try {
            const result = await chrome.storage.local.get(['recentPapers']);
            const recentPapers = result.recentPapers || [];

            // Remove if already exists
            const filteredPapers = recentPapers.filter(p => p.url !== paper.url);

            // Add to beginning
            const updatedPapers = [paper, ...filteredPapers].slice(0, 10);

            await chrome.storage.local.set({ recentPapers: updatedPapers });
            this.updateRecentPapers();
        } catch (error) {
            console.error('Error adding to recent papers:', error);
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4ade80' : type === 'error' ? '#ef4444' : '#667eea'};
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PaperMindPopup();
});
