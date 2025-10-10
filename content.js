// PaperMind Content Script
// Detects academic papers and provides AI-powered analysis

class PaperMind {
    constructor() {
        this.isActive = false;
        this.paperData = null;
        this.summaryPanel = null;
        this.highlightedText = '';
        this.init();
    }

    init() {
        // Check if current page is a research paper
        if (this.isResearchPaper()) {
            this.createFloatingButton();
            this.setupEventListeners();
            this.extractPaperContent();
        }
    }

    isResearchPaper() {
        const url = window.location.href;
        const title = document.title.toLowerCase();

        // Check for academic paper indicators
        const paperIndicators = [
            'arxiv.org',
            'scholar.google.com',
            'nature.com',
            'science.org',
            'springer.com',
            'ieeexplore.ieee.org',
            'acm.org'
        ];

        const hasPaperUrl = paperIndicators.some(indicator => url.includes(indicator));
        const hasPaperTitle = title.includes('paper') || title.includes('article') ||
            title.includes('research') || title.includes('study');

        return hasPaperUrl || hasPaperTitle;
    }

    createFloatingButton() {
        const button = document.createElement('div');
        button.id = 'papermind-button';
        button.innerHTML = `
      <div class="papermind-icon">🧠</div>
      <div class="papermind-text">PaperMind</div>
    `;
        button.className = 'papermind-floating-button';
        document.body.appendChild(button);

        button.addEventListener('click', () => {
            this.toggleSummaryPanel();
        });
    }

    extractPaperContent() {
        const content = {
            title: this.extractTitle(),
            authors: this.extractAuthors(),
            abstract: this.extractAbstract(),
            sections: this.extractSections(),
            url: window.location.href,
            timestamp: new Date().toISOString()
        };

        this.paperData = content;
        console.log('PaperMind: Extracted paper content', content);
    }

    extractTitle() {
        // Try multiple selectors for title
        const titleSelectors = [
            'h1.title',
            'h1',
            '.title',
            '.paper-title',
            'h1.article-title',
            '.article-title'
        ];

        for (const selector of titleSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                return element.textContent.trim();
            }
        }

        return document.title || 'Untitled Paper';
    }

    extractAuthors() {
        const authorSelectors = [
            '.authors',
            '.author',
            '.author-list',
            '.paper-authors',
            '.article-authors'
        ];

        for (const selector of authorSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element.textContent.trim();
            }
        }

        return 'Unknown Authors';
    }

    extractAbstract() {
        const abstractSelectors = [
            '.abstract',
            '.paper-abstract',
            '.article-abstract',
            '.summary'
        ];

        for (const selector of abstractSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                return element.textContent.trim();
            }
        }

        return '';
    }

    extractSections() {
        const sections = [];
        const sectionSelectors = [
            'h2', 'h3', 'h4',
            '.section',
            '.subsection',
            '.paper-section'
        ];

        sectionSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                const text = element.textContent.trim();
                if (text && text.length > 20) {
                    sections.push({
                        title: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                        content: text,
                        element: element
                    });
                }
            });
        });

        return sections;
    }

    setupEventListeners() {
        // Listen for text selection
        document.addEventListener('mouseup', (e) => {
            const selection = window.getSelection();
            if (selection.toString().trim()) {
                this.highlightedText = selection.toString().trim();
                this.showContextMenu(e);
            }
        });

        // Listen for messages from background script
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'analyzePaper') {
                this.analyzePaper();
                sendResponse({ success: true });
            } else if (request.action === 'getPaperData') {
                sendResponse({ paperData: this.paperData });
            }
        });
    }

    showContextMenu(event) {
        if (this.highlightedText.length < 10) return;

        // Remove existing context menu
        const existingMenu = document.querySelector('.papermind-context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        const menu = document.createElement('div');
        menu.className = 'papermind-context-menu';
        menu.innerHTML = `
      <div class="menu-item" data-action="explain">🤔 Explain this</div>
      <div class="menu-item" data-action="simplify">✨ Simplify</div>
      <div class="menu-item" data-action="summarize">📝 Summarize</div>
    `;

        menu.style.position = 'absolute';
        menu.style.left = event.pageX + 'px';
        menu.style.top = event.pageY + 'px';

        document.body.appendChild(menu);

        // Add click handlers
        menu.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleContextAction(action);
                menu.remove();
            });
        });

        // Remove menu when clicking elsewhere
        setTimeout(() => {
            document.addEventListener('click', () => {
                menu.remove();
            }, { once: true });
        }, 100);
    }

    handleContextAction(action) {
        if (!this.highlightedText) return;

        const prompt = this.getContextPrompt(action);
        this.sendToAI(prompt, this.highlightedText);
    }

    getContextPrompt(action) {
        const prompts = {
            explain: "Explain this highlighted text in simple terms, focusing on the key concepts and their importance:",
            simplify: "Simplify this highlighted text to make it more accessible to a general audience:",
            summarize: "Provide a concise summary of this highlighted text, highlighting the main points:"
        };
        return prompts[action] || prompts.explain;
    }

    toggleSummaryPanel() {
        if (this.summaryPanel) {
            this.summaryPanel.remove();
            this.summaryPanel = null;
            this.isActive = false;
        } else {
            this.createSummaryPanel();
            this.isActive = true;
        }
    }

    createSummaryPanel() {
        const panel = document.createElement('div');
        panel.id = 'papermind-summary-panel';
        panel.className = 'papermind-panel';
        panel.innerHTML = `
      <div class="panel-header">
        <h3>🧠 PaperMind AI Summary</h3>
        <button class="close-btn">&times;</button>
      </div>
      <div class="panel-content">
        <div class="loading">Analyzing paper with AI...</div>
      </div>
    `;

        document.body.appendChild(panel);
        this.summaryPanel = panel;

        // Add close button functionality
        panel.querySelector('.close-btn').addEventListener('click', () => {
            this.toggleSummaryPanel();
        });

        // Start AI analysis
        this.analyzePaper();
    }

    async analyzePaper() {
        if (!this.paperData) {
            this.extractPaperContent();
        }

        try {
            // Send paper data to background script for AI processing
            const response = await chrome.runtime.sendMessage({
                action: 'analyzePaper',
                paperData: this.paperData
            });

            if (response && response.summary) {
                this.displaySummary(response.summary);
            }
        } catch (error) {
            console.error('PaperMind: Error analyzing paper', error);
            this.showError('Failed to analyze paper. Please try again.');
        }
    }

    displaySummary(summary) {
        const content = this.summaryPanel.querySelector('.panel-content');
        content.innerHTML = `
      <div class="summary-section">
        <h4>📋 Overview</h4>
        <p>${summary.overview}</p>
      </div>
      <div class="summary-section">
        <h4>🎯 Key Points</h4>
        <ul>
          ${summary.keyPoints.map(point => `<li>${point}</li>`).join('')}
        </ul>
      </div>
      <div class="summary-section">
        <h4>🔬 Methodology</h4>
        <p>${summary.methodology}</p>
      </div>
      <div class="summary-section">
        <h4>📊 Results</h4>
        <p>${summary.results}</p>
      </div>
      <div class="summary-section">
        <h4>💡 Implications</h4>
        <p>${summary.implications}</p>
      </div>
      <div class="interactive-section">
        <h4>🤔 Ask Questions</h4>
        <div class="question-input">
          <input type="text" placeholder="Ask a question about this paper..." id="question-input">
          <button id="ask-question">Ask</button>
        </div>
      </div>
      <div class="interactive-section">
        <h4>📊 Generate Diagram</h4>
        <div class="diagram-input">
          <input type="text" placeholder="Enter a concept to visualize..." id="diagram-concept">
          <button id="generate-diagram">Generate</button>
        </div>
      </div>
    `;

        // Add question functionality
        this.setupQuestionHandler();

        // Add diagram functionality
        this.setupDiagramHandler();
    }

    setupQuestionHandler() {
        const questionInput = document.getElementById('question-input');
        const askButton = document.getElementById('ask-question');

        const askQuestion = async () => {
            const question = questionInput.value.trim();
            if (!question) return;

            // Show loading state
            askButton.textContent = 'Asking...';
            askButton.disabled = true;

            try {
                const response = await chrome.runtime.sendMessage({
                    action: 'askQuestion',
                    question: question,
                    paperData: this.paperData
                });

                if (response && response.answer) {
                    this.displayAnswer(question, response.answer);
                }
            } catch (error) {
                console.error('PaperMind: Error asking question', error);
                this.showError('Failed to get answer. Please try again.');
            } finally {
                askButton.textContent = 'Ask';
                askButton.disabled = false;
                questionInput.value = '';
            }
        };

        askButton.addEventListener('click', askQuestion);
        questionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                askQuestion();
            }
        });
    }

    setupDiagramHandler() {
        const diagramInput = document.getElementById('diagram-concept');
        const generateButton = document.getElementById('generate-diagram');

        const generateDiagram = async () => {
            const concept = diagramInput.value.trim();
            if (!concept) return;

            // Show loading state
            generateButton.textContent = 'Generating...';
            generateButton.disabled = true;

            try {
                await this.generateDiagram(concept);
            } catch (error) {
                console.error('PaperMind: Error generating diagram', error);
                this.showError('Failed to generate diagram. Please try again.');
            } finally {
                generateButton.textContent = 'Generate';
                generateButton.disabled = false;
                diagramInput.value = '';
            }
        };

        generateButton.addEventListener('click', generateDiagram);
        diagramInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                generateDiagram();
            }
        });
    }

    displayAnswer(question, answer) {
        const content = this.summaryPanel.querySelector('.panel-content');
        const qaSection = document.createElement('div');
        qaSection.className = 'qa-section';
        qaSection.innerHTML = `
      <div class="question">
        <strong>Q:</strong> ${question}
      </div>
      <div class="answer">
        <strong>A:</strong> ${answer}
      </div>
    `;
        content.appendChild(qaSection);
    }

    showError(message) {
        const content = this.summaryPanel.querySelector('.panel-content');
        content.innerHTML = `
      <div class="error-message">
        <p>❌ ${message}</p>
      </div>
    `;
    }

    async sendToAI(prompt, text) {
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'processText',
                prompt: prompt,
                text: text
            });

            if (response && response.result) {
                this.showAIResponse(response.result);
            }
        } catch (error) {
            console.error('PaperMind: Error processing text', error);
        }
    }

    async generateDiagram(concept) {
        if (!concept || !this.paperData) return;

        try {
            const response = await chrome.runtime.sendMessage({
                action: 'generateDiagram',
                concept: concept,
                paperData: this.paperData
            });

            if (response && response.diagram) {
                this.showDiagram(concept, response.diagram);
            }
        } catch (error) {
            console.error('PaperMind: Error generating diagram', error);
            this.showError('Failed to generate diagram. Please try again.');
        }
    }

    showDiagram(concept, diagram) {
        const overlay = document.createElement('div');
        overlay.className = 'papermind-diagram-overlay';
        overlay.innerHTML = `
      <div class="diagram-content">
        <div class="diagram-header">
          <h4>📊 Diagram: ${concept}</h4>
          <button class="close-diagram">&times;</button>
        </div>
        <div class="diagram-body">
          <div class="diagram-description">
            <h5>Visual Description:</h5>
            <p>${diagram.description || 'AI-generated diagram description'}</p>
          </div>
          <div class="diagram-components">
            <h5>Key Components:</h5>
            <ul>
              ${(diagram.components || []).map(comp => `<li>${comp}</li>`).join('')}
            </ul>
          </div>
          <div class="diagram-relationships">
            <h5>Relationships:</h5>
            <p>${diagram.relationships || 'Component relationships and flow'}</p>
          </div>
          <div class="diagram-actions">
            <button class="btn primary" id="export-diagram">Export as Image</button>
            <button class="btn secondary" id="save-diagram">Save to Notes</button>
          </div>
        </div>
      </div>
    `;

        document.body.appendChild(overlay);

        // Add event listeners
        overlay.querySelector('.close-diagram').addEventListener('click', () => {
            overlay.remove();
        });

        overlay.querySelector('#export-diagram').addEventListener('click', () => {
            this.exportDiagram(concept, diagram);
        });

        overlay.querySelector('#save-diagram').addEventListener('click', () => {
            this.saveDiagram(concept, diagram);
        });

        // Close on outside click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
    }

    exportDiagram(concept, diagram) {
        // Create a simple text-based export
        const content = `
PaperMind Diagram Export
=======================

Concept: ${concept}
Generated: ${new Date().toLocaleString()}

Description:
${diagram.description || 'AI-generated diagram description'}

Components:
${(diagram.components || []).map((comp, i) => `${i + 1}. ${comp}`).join('\n')}

Relationships:
${diagram.relationships || 'Component relationships and flow'}

---
Generated by PaperMind AI Assistant
    `.trim();

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `papermind-diagram-${concept.replace(/[^a-zA-Z0-9]/g, '-')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async saveDiagram(concept, diagram) {
        try {
            const diagramData = {
                concept,
                diagram,
                timestamp: new Date().toISOString(),
                paperTitle: this.paperData?.title || 'Unknown',
                paperUrl: this.paperData?.url || window.location.href
            };

            const result = await chrome.storage.local.get(['savedDiagrams']);
            const savedDiagrams = result.savedDiagrams || [];
            savedDiagrams.push(diagramData);

            await chrome.storage.local.set({ savedDiagrams });
            this.showNotification('Diagram saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving diagram:', error);
            this.showNotification('Failed to save diagram', 'error');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `papermind-notification papermind-notification-${type}`;
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
      z-index: 10004;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      animation: slideIn 0.3s ease;
    `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    showAIResponse(response) {
        // Create a temporary overlay to show AI response
        const overlay = document.createElement('div');
        overlay.className = 'papermind-ai-response';
        overlay.innerHTML = `
      <div class="response-content">
        <h4>🤖 AI Response</h4>
        <p>${response}</p>
        <button class="close-response">Close</button>
      </div>
    `;

        document.body.appendChild(overlay);

        overlay.querySelector('.close-response').addEventListener('click', () => {
            overlay.remove();
        });

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.remove();
            }
        }, 10000);
    }
}

// Initialize PaperMind when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new PaperMind();
    });
} else {
    new PaperMind();
}
