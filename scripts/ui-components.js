// PaperMind UI Components
// Handles creation and management of floating button, panels, and UI elements

class UIComponents {
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

        // Create the compact button
        const button = document.createElement('div');
        button.id = 'papermind-button';
        button.className = 'papermind-button-compact';
        button.innerHTML = `
            <div class="papermind-text">PaperMind</div>
        `;

        // Create the expandable panel (initially hidden)
        const panel = document.createElement('div');
        panel.id = 'papermind-expandable-panel';
        panel.className = 'papermind-expandable-panel hidden';
        panel.innerHTML = `
            <div class="panel-header">
                <div class="panel-title">
                    <span class="panel-title-text">PaperMind</span>
                </div>
                <button class="panel-close" title="Close">×</button>
            </div>
            <div class="panel-content">
                <button class="action-button analyze-button" id="analyze-button">
                    <span class="button-icon">▶</span>
                    <span>Analyze Paper</span>
                </button>
                <div class="progress-section hidden" id="progress-section">
                    <div class="progress-status">
                        <p id="progress-message">Ready to analyze</p>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" id="progress-bar">
                            <div class="progress-fill" id="progress-fill"></div>
                        </div>
                    </div>
                    <div class="progress-stats">
                        <span id="progress-percent">0%</span>
                        <span id="progress-section-count">0 / 0</span>
                    </div>
                    <div class="progress-ai-info">
                        <span><span class="ai-label">AI:</span> Gemini Nano</span>
                        <span>Private</span>
                    </div>
                </div>
                <div class="toggle-view-section hidden" id="toggle-view-section">
                    <button class="toggle-view-button" id="toggle-view-button" title="Switch between original and enhanced view">
                        <span class="toggle-view-icon">🔄</span>
                        <span class="toggle-view-text">Show Original</span>
                    </button>
                    <span class="toggle-view-hint">Click to toggle view</span>
                </div>
                <div class="study-notes-section">
                    <div class="notes-header">
                        <h4>Study Notes</h4>
                        <button class="notes-download-btn" id="notes-download-btn" title="Download Notes">
                            <span>↓</span>
                        </button>
                    </div>
                    <div class="notes-list" id="notes-list">
                        <p class="notes-empty">No notes yet. Highlight text and explain it to save notes.</p>
                    </div>
                </div>
            </div>
        `;

        container.appendChild(button);
        container.appendChild(panel);
        document.body.appendChild(container);

        // Setup hover behavior
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

        // Analyze button
        const analyzeButton = panel.querySelector('#analyze-button');
        analyzeButton.addEventListener('click', () => {
            this.paperMind.analyzePaper();
        });

        // Close button
        const closeButton = panel.querySelector('.panel-close');
        closeButton.addEventListener('click', () => {
            panel.classList.add('hidden');
            button.classList.remove('hidden');
        });

        // Download notes button
        const downloadBtn = panel.querySelector('#notes-download-btn');
        downloadBtn.addEventListener('click', () => {
            this.paperMind.studyNotes.downloadStudyNotes();
        });

        // Toggle view button
        const toggleViewBtn = panel.querySelector('#toggle-view-button');
        toggleViewBtn.addEventListener('click', () => {
            this.paperMind.toggleEnhancedView();
        });

        // Store references
        this.floatingButton = button;
        this.expandablePanel = panel;
        this.floatingContainer = container;

        // Make draggable
        this.makeDraggable(container);
    }

    makeDraggable(element) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        // Get the button/panel header as the drag handle
        const dragHandles = element.querySelectorAll('.papermind-button-compact, .panel-header');

        dragHandles.forEach(handle => {
            handle.addEventListener('mousedown', dragStart);
            handle.style.cursor = 'move';
        });

        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            // Only drag on left mouse button
            if (e.button !== 0) return;

            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;

            if (e.target === this || this.contains(e.target)) {
                isDragging = true;
                element.style.transition = 'none';
            }
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();

                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                xOffset = currentX;
                yOffset = currentY;

                setTranslate(currentX, currentY, element);
            }
        }

        function dragEnd(e) {
            if (isDragging) {
                initialX = currentX;
                initialY = currentY;
                isDragging = false;
                element.style.transition = '';
            }
        }

        function setTranslate(xPos, yPos, el) {
            el.style.transform = `translate(${xPos}px, ${yPos}px)`;
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `papermind-notification ${type}`;
        const icons = { success: '✓', error: '✕', info: 'i', warning: '!' };
        notification.innerHTML = `
            <span class="notification-icon">${icons[type] || icons.info}</span>
            <span class="notification-message">${message}</span>
        `;

        document.body.appendChild(notification);

        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    updateProgress(current, total, message) {
        const progressMessage = document.getElementById('progress-message');
        const progressFill = document.getElementById('progress-fill');
        const progressPercent = document.getElementById('progress-percent');
        const progressSectionCount = document.getElementById('progress-section-count');

        if (progressMessage) {
            progressMessage.textContent = message;
        }

        if (total > 0) {
            const percentage = Math.round((current / total) * 100);

            if (progressFill) {
                progressFill.style.width = `${percentage}%`;
            }

            if (progressPercent) {
                progressPercent.textContent = `${percentage}%`;
            }

            if (progressSectionCount) {
                progressSectionCount.textContent = `${current} / ${total}`;
            }
        }
    }
}

// Export for use in main script
if (typeof window !== 'undefined') {
    window.UIComponents = UIComponents;
}

