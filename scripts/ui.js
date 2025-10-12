// PaperMind UI Components
// Handles all UI creation, interactions, and view management

class PaperMindUI {
    constructor(paperMind) {
        this.paperMind = paperMind;
        this.floatingButton = null;
        this.expandablePanel = null;
        this.floatingContainer = null;
    }

    createFloatingButton() {
        const container = document.createElement('div');
        container.id = 'papermind-container';
        container.className = 'papermind-container';

        const button = document.createElement('div');
        button.id = 'papermind-button';
        button.className = 'papermind-button-compact';
        button.innerHTML = `<div class="papermind-icon">🧠</div><div class="papermind-text">PaperMind</div>`;

        const panel = document.createElement('div');
        panel.id = 'papermind-expandable-panel';
        panel.className = 'papermind-expandable-panel hidden';
        panel.innerHTML = `
            <div class="panel-header">
                <div class="panel-title">
                    <span class="panel-icon">🧠</span>
                    <span class="panel-title-text">PaperMind</span>
                </div>
                <button class="panel-close" title="Close">×</button>
            </div>
            <div class="panel-content">
                <button class="action-button analyze-button" id="analyze-button">
                    <span class="button-icon">✨</span>
                    <span>Analyze Paper</span>
                </button>
                <div class="progress-section hidden" id="progress-section">
                    <div class="progress-status">
                        <p id="progress-message">Ready to analyze</p>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar"><div class="progress-fill" id="progress-fill"></div></div>
                    </div>
                    <div class="progress-stats">
                        <span id="progress-percent">0%</span>
                        <span id="progress-section-count">0 / 0</span>
                    </div>
                    <div class="progress-ai-info">
                        <span>✨ Gemini Nano</span>
                        <span>🔒 Private</span>
                    </div>
                </div>
                <div class="toggle-view-section hidden" id="toggle-view-section">
                    <button class="toggle-view-button" id="toggle-view-button" title="Switch view">
                        <span class="toggle-view-icon">🔄</span>
                        <span class="toggle-view-text">Show Original</span>
                    </button>
                    <span class="toggle-view-hint">Click to toggle view</span>
                </div>
                <div class="study-notes-section">
                    <div class="notes-header">
                        <h4>📚 Study Notes</h4>
                        <button class="notes-download-btn" id="notes-download-btn" title="Download">⬇️</button>
                    </div>
                    <div class="notes-list" id="notes-list">
                        <p class="notes-empty">No notes yet. Highlight text to add notes.</p>
                    </div>
                </div>
            </div>
        `;

        container.appendChild(button);
        container.appendChild(panel);
        document.body.appendChild(container);

        // Hover behavior
        container.addEventListener('mouseenter', () => {
            if (!this.paperMind.isAnalyzing) {
                panel.classList.remove('hidden');
                button.classList.add('hidden');
            }
        });

        container.addEventListener('mouseleave', () => {
            if (!this.paperMind.isAnalyzing) {
                panel.classList.add('hidden');
                button.classList.remove('hidden');
            }
        });

        // Event listeners
        panel.querySelector('#analyze-button').addEventListener('click', () => this.paperMind.analyzePaper());
        panel.querySelector('.panel-close').addEventListener('click', () => {
            panel.classList.add('hidden');
            button.classList.remove('hidden');
        });
        panel.querySelector('#toggle-view-button').addEventListener('click', () => this.toggleEnhancedView());
        panel.querySelector('#notes-download-btn').addEventListener('click', () => {
            if (this.paperMind.highlights) {
                this.paperMind.highlights.downloadStudyNotes();
            }
        });

        this.floatingButton = button;
        this.expandablePanel = panel;
        this.floatingContainer = container;

        this.makeDraggable(container);

        // Load notes
        if (this.paperMind.highlights) {
            this.paperMind.highlights.loadStudyNotes();
        }
    }

    makeDraggable(element) {
        let isDragging = false, currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;
        const handles = element.querySelectorAll('.papermind-button-compact, .panel-header');

        handles.forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return;
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
                isDragging = true;
                element.style.transition = 'none';
            });
            handle.style.cursor = 'move';
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                xOffset = currentX;
                yOffset = currentY;
                element.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                initialX = currentX;
                initialY = currentY;
                isDragging = false;
                element.style.transition = '';
            }
        });
    }

    // Progress Management

    showProgress() {
        const progressSection = document.getElementById('progress-section');
        const analyzeButton = document.getElementById('analyze-button');
        if (progressSection) progressSection.classList.remove('hidden');
        if (analyzeButton) analyzeButton.classList.add('hidden');
    }

    hideProgress() {
        const progressSection = document.getElementById('progress-section');
        const analyzeButton = document.getElementById('analyze-button');
        if (progressSection) progressSection.classList.add('hidden');
        if (analyzeButton) analyzeButton.classList.remove('hidden');
    }

    updateProgress(current, total, message) {
        const progressMessage = document.getElementById('progress-message');
        const progressFill = document.getElementById('progress-fill');
        const progressPercent = document.getElementById('progress-percent');
        const progressSectionCount = document.getElementById('progress-section-count');

        if (progressMessage) progressMessage.textContent = message;

        if (total > 0) {
            const percentage = Math.round((current / total) * 100);
            if (progressFill) progressFill.style.width = `${percentage}%`;
            if (progressPercent) progressPercent.textContent = `${percentage}%`;
            if (progressSectionCount) progressSectionCount.textContent = `${current} / ${total}`;
        }
    }

    keepPanelOpen() {
        if (this.expandablePanel) this.expandablePanel.classList.remove('hidden');
        if (this.floatingButton) this.floatingButton.classList.add('hidden');
    }

    showToggleSection() {
        const toggleSection = document.getElementById('toggle-view-section');
        if (toggleSection) toggleSection.classList.remove('hidden');
    }

    // View Toggle

    toggleEnhancedView() {
        const article = this.paperMind.extractArticle();
        if (!article) return;

        const btn = document.getElementById('toggle-view-button');
        const icon = btn?.querySelector('.toggle-view-icon');
        const text = btn?.querySelector('.toggle-view-text');
        const isEnhanced = article.classList.contains('papermind-enhanced');

        const sections = article.querySelectorAll('section.ltx_section[data-papermind-enhanced="true"]');

        if (isEnhanced) {
            sections.forEach(s => {
                const orig = s.querySelector('.papermind-original-content');
                const enh = s.querySelector('.papermind-enhanced-content');
                if (orig) orig.style.display = 'block';
                if (enh) enh.style.display = 'none';
            });
            article.classList.remove('papermind-enhanced');
            article.classList.add('papermind-original');
            if (icon) icon.textContent = '✨';
            if (text) text.textContent = 'Show Enhanced';
            if (btn) btn.title = 'Switch to enhanced view';
            this.showNotification('Switched to original view', 'info');
        } else {
            sections.forEach(s => {
                const orig = s.querySelector('.papermind-original-content');
                const enh = s.querySelector('.papermind-enhanced-content');
                if (orig) orig.style.display = 'none';
                if (enh) enh.style.display = 'block';
            });
            article.classList.remove('papermind-original');
            article.classList.add('papermind-enhanced');
            if (icon) icon.textContent = '🔄';
            if (text) text.textContent = 'Show Original';
            if (btn) btn.title = 'Switch to original view';
            this.showNotification('Switched to enhanced view', 'success');
        }
    }

    // Rendering

    renderEnhancedPaper(summaryHtmlList) {
        const article = this.paperMind.extractArticle();
        if (!article) return;

        const sections = article.querySelectorAll('section.ltx_section');
        sections.forEach((section, index) => {
            if (index < summaryHtmlList.length) {
                const originalContent = section.innerHTML;
                const parser = new DOMParser();
                const doc = parser.parseFromString(summaryHtmlList[index], 'text/html');
                const enhancedContent = doc.body.firstChild;

                section.innerHTML = `
                    <div class="papermind-original-content" style="display: none;">${originalContent}</div>
                    <div class="papermind-enhanced-content" style="display: block;">${enhancedContent.outerHTML}</div>
                `;
                section.setAttribute('data-papermind-enhanced', 'true');
            }
        });

        article.classList.add('papermind-enhanced');
    }

    displaySummary(summary) {
        console.log('Legacy summary display:', summary);
    }

    // Notifications

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `papermind-notification ${type}`;
        const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
        notification.innerHTML = `
            <span class="notification-icon">${icons[type] || icons.info}</span>
            <span class="notification-message">${message}</span>
        `;

        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Listen for progress updates from background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'progressUpdate' && window.paperMind && window.paperMind.ui) {
        window.paperMind.ui.updateProgress(request.current, request.total, request.message);
        sendResponse({ success: true });
    }
});

// Export
window.PaperMindUI = PaperMindUI;

