// PaperMind Content Script
// Detects academic papers and provides AI-powered analysis

// Note: chromeAIHelper.js is loaded before this script (see manifest.json)
// To use Chrome AI directly in content script:
// const session = await window.ChromeAIHelper.getLanguageModel(window, {}, (progress) => console.log(progress));
// const response = await window.ChromeAIHelper.callChromeAI(session, "Your prompt here");
// await window.ChromeAIHelper.destroySession(session);
//
// Or use the convenience function:
// const response = await window.ChromeAIHelper.callChromeAIAuto("Your prompt here");

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
            console.log('🧠 PaperMind: Research paper detected!');

            // Extract paper content immediately (ready for analysis when user clicks)
            this.extractPaperContent();
            console.log('✅ PaperMind: Paper content extracted and ready for analysis');

            // Create UI elements
            this.createFloatingButton();
            this.setupEventListeners();
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
                <div class="panel-header-controls">
                    <div class="view-toggle-switch hidden" id="view-toggle-switch" title="Switch between original and enhanced view">
                        <label class="toggle-switch">
                            <input type="checkbox" id="view-toggle-checkbox">
                            <span class="toggle-slider"></span>
                        </label>
                        <span class="toggle-label" id="toggle-label">Enhanced</span>
                    </div>
                    <button class="panel-close" title="Close">×</button>
                </div>
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

        // Track if panel is pinned (fixed open)
        let isPinned = false;
        let isClickingButton = false;

        // Store references for event handlers
        this.floatingButton = button;
        this.expandablePanel = panel;
        this.floatingContainer = container;

        // Detect when user is about to click the button
        button.addEventListener('mousedown', (e) => {
            isClickingButton = true;
            e.stopPropagation();
        });

        // Click button to pin panel open
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            isPinned = true;
            panel.classList.remove('hidden');
            button.classList.add('hidden');
            isClickingButton = false;
        });

        // Make container draggable (only by panel header, not button)
        this.makeDraggable(container, panel);

        // Show panel on hover over container (only if not pinned and not clicking)
        let hoverTimeout;
        container.addEventListener('mouseenter', (e) => {
            clearTimeout(hoverTimeout);
            
            if (isClickingButton) {
                return;
            }
            
            if (!isPinned) {
                hoverTimeout = setTimeout(() => {
                    if (!isPinned && !isClickingButton) {
                        panel.classList.remove('hidden');
                        button.classList.add('hidden');
                    }
                }, 200);
            }
        });

        // Hide panel when mouse leaves container (only if not pinned and not analyzing)
        container.addEventListener('mouseleave', (e) => {
            clearTimeout(hoverTimeout);
            
            hoverTimeout = setTimeout(() => {
                if (!isPinned && !this.isAnalyzing) {
                    panel.classList.add('hidden');
                    button.classList.remove('hidden');
                }
            }, 50);
        });

        // Analyze button click
        const analyzeButton = panel.querySelector('#analyze-button');
        analyzeButton.addEventListener('click', () => {
            this.analyzePaper();
        });

        // Close button - unpins and closes panel
        const closeButton = panel.querySelector('.panel-close');
        closeButton.addEventListener('click', () => {
            isPinned = false;
            panel.classList.add('hidden');
            button.classList.remove('hidden');
        });

        // Download notes button
        const downloadBtn = panel.querySelector('#notes-download-btn');
        downloadBtn.addEventListener('click', () => {
            this.downloadStudyNotes();
        });

        // Toggle view switch
        const toggleCheckbox = panel.querySelector('#view-toggle-checkbox');
        toggleCheckbox.addEventListener('change', () => {
            this.toggleEnhancedView();
        });

        // Load and display existing notes
        this.loadStudyNotes();
    }

    makeDraggable(element, panel) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        // Only use panel header as drag handle (NOT the button)
        const panelHeader = panel.querySelector('.panel-header');
        
        if (panelHeader) {
            panelHeader.addEventListener('mousedown', dragStart);
            panelHeader.style.cursor = 'move';
        }

        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            // Only drag on left mouse button
            if (e.button !== 0) return;
            
            // Don't drag if clicking on close button or toggle switch
            if (e.target.closest('.panel-close') || e.target.closest('.view-toggle-switch')) {
                return;
            }

            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            isDragging = true;
            element.style.transition = 'none';
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

    toggleEnhancedView() {
        const article = this.extractArticle();
        if (!article) return;

        const toggleCheckbox = document.getElementById('view-toggle-checkbox');
        const toggleLabel = document.getElementById('toggle-label');
        const toggleSwitch = document.getElementById('view-toggle-switch');
        const isEnhanced = article.classList.contains('papermind-enhanced');

        // Find all sections with both original and enhanced content
        const sections = article.querySelectorAll('section.ltx_section[data-papermind-enhanced="true"]');

        if (isEnhanced) {
            // Switch to original view
            sections.forEach(section => {
                const originalContent = section.querySelector('.papermind-original-content');
                const enhancedContent = section.querySelector('.papermind-enhanced-content');

                if (originalContent) originalContent.style.display = 'block';
                if (enhancedContent) enhancedContent.style.display = 'none';
            });

            article.classList.remove('papermind-enhanced');
            article.classList.add('papermind-original');
            if (toggleCheckbox) toggleCheckbox.checked = false;
            if (toggleLabel) toggleLabel.textContent = 'Original';
            if (toggleSwitch) toggleSwitch.title = 'Switch to enhanced view';
            this.showNotification('Switched to original view', 'info');
        } else {
            // Switch to enhanced view
            sections.forEach(section => {
                const originalContent = section.querySelector('.papermind-original-content');
                const enhancedContent = section.querySelector('.papermind-enhanced-content');

                if (originalContent) originalContent.style.display = 'none';
                if (enhancedContent) enhancedContent.style.display = 'block';
            });

            article.classList.remove('papermind-original');
            article.classList.add('papermind-enhanced');
            if (toggleCheckbox) toggleCheckbox.checked = true;
            if (toggleLabel) toggleLabel.textContent = 'Enhanced';
            if (toggleSwitch) toggleSwitch.title = 'Switch to original view';
            this.showNotification('Switched to enhanced view', 'success');
        }
    }

    extractPaperContent() {
        const article = this.extractArticle();

        const content = {
            title: this.extractTitle(article),
            authors: this.extractAuthors(article),
            abstract: this.extractAbstract(article),
            sections: this.extractSections(article),
            url: window.location.href,
            timestamp: new Date().toISOString()
        };

        this.paperData = content;
        console.log('PaperMind: Extracted paper content', content);
        this.logExtractionSummary(content);
    }

    logExtractionSummary(content) {
        console.log('\n📄 Paper Extraction Summary:');
        console.log(`   Title: ${content.title}`);
        console.log(`   Authors: ${content.authors.substring(0, 100)}...`);
        console.log(`   Abstract: ${content.abstract.text?.substring(0, 100)}... (${content.abstract.images?.length || 0} images)`);
        console.log(`   Sections: ${content.sections?.length || 0}`);

        content.sections?.forEach((section, idx) => {
            console.log(`     ${idx + 1}. ${section.title} (${section.images?.length || 0} images, ${section.text?.length || 0} chars)`);
        });

        const totalImages = (content.abstract.images?.length || 0) +
            (content.sections?.reduce((sum, s) => sum + (s.images?.length || 0), 0) || 0);
        console.log(`   Total Images/Tables: ${totalImages}`);
    }

    extractArticle() {
        const articleSelectors = [
            'article',
        ];

        for (const selector of articleSelectors) {
            const element = document.querySelector(selector);
            if (element) return element;
        }
        console.error('PaperMind: No article html tag found');
        return null;
    }

    extractTitle(article) {
        // Try multiple selectors for title (arXiv and general papers)
        const titleSelectors = [
            'h1.ltx_title_document', // arXiv specific
            'h1.title',
            'h1',
            '.title',
            '.paper-title',
            'h1.article-title',
            '.article-title'
        ];

        for (const selector of titleSelectors) {
            const element = (article || document).querySelector(selector);
            if (element && element.textContent.trim()) {
                return this.cleanText(element.textContent);
            }
        }

        return document.title || 'Untitled Paper';
    }

    extractAuthors(article) {
        const authorSelectors = [
            '.ltx_authors', // arXiv specific
            '.authors',
            '.author',
            '.author-list',
            '.paper-authors',
            '.article-authors'
        ];

        for (const selector of authorSelectors) {
            const element = (article || document).querySelector(selector);
            if (element) {
                return this.cleanText(element.textContent);
            }
        }

        return 'Unknown Authors';
    }

    extractAbstract(article) {
        const abstractSelectors = [
            '.ltx_abstract', // arXiv specific
            '.abstract',
            '.paper-abstract',
            '.article-abstract',
            '.summary'
        ];

        for (const selector of abstractSelectors) {
            const element = (article || document).querySelector(selector);
            if (element && element.textContent.trim()) {
                return {
                    text: this.cleanText(element.textContent),
                    images: this.extractImages(element)
                };
            }
        }

        return { text: '', images: [] };
    }

    extractSections(article) {
        const sections = [];

        // Try arXiv-specific structure first
        const arxivSections = (article || document).querySelectorAll('section.ltx_section');

        if (arxivSections.length > 0) {
            arxivSections.forEach(section => {
                const titleElem = section.querySelector('h2.ltx_title_section, h3.ltx_title_subsection, h4.ltx_title_subsubsection');
                const sectionId = section.getAttribute('id');

                if (titleElem) {
                    // Extract text content (excluding figures and tables initially)
                    const textContent = this.extractSectionText(section);
                    const images = this.extractImages(section);

                    sections.push({
                        id: sectionId,
                        title: this.cleanText(titleElem.textContent),
                        text: textContent,
                        images: images,
                        element: section
                    });
                }
            });
        } else {
            // Fallback to general section extraction
            const sectionSelectors = ['h2', 'h3', 'h4', '.section', '.subsection', '.paper-section'];

            sectionSelectors.forEach(selector => {
                const elements = (article || document).querySelectorAll(selector);
                elements.forEach(element => {
                    const text = element.textContent.trim();
                    if (text && text.length > 20) {
                        sections.push({
                            title: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                            text: text,
                            images: [],
                            element: element
                        });
                    }
                });
            });
        }

        return sections;
    }

    extractSectionText(sectionElement) {
        // Clone the section to avoid modifying the original
        const clone = sectionElement.cloneNode(true);

        // Remove unwanted elements
        const unwantedSelectors = [
            'button',
            '.sr-only',
            'figure',
            '.ltx_note_content', // footnotes
            '.ltx_ref' // references can be kept but cleaned
        ];

        unwantedSelectors.forEach(selector => {
            clone.querySelectorAll(selector).forEach(el => el.remove());
        });

        // Get text and clean it
        return this.cleanText(clone.textContent);
    }

    extractImages(containerElement) {
        const images = [];

        // Find all figures, but only select top-level ones (not nested inside other figures)
        const allFigures = containerElement.querySelectorAll('figure');
        const topLevelFigures = Array.from(allFigures).filter(figure => {
            // Check if this figure has any ancestor that is also a figure
            let parent = figure.parentElement;
            while (parent && parent !== containerElement) {
                if (parent.tagName === 'FIGURE') {
                    return false; // This is a nested figure, skip it
                }
                parent = parent.parentElement;
            }
            return true; // This is a top-level figure
        });

        topLevelFigures.forEach(figure => {
            // Store the entire figure HTML element directly
            // This preserves all structure, styling, nested subfigures, captions, etc.
            const clonedFigure = figure.cloneNode(true);

            clonedFigure.querySelectorAll('button.sr-only').forEach(btn => btn.remove());

            images.push({
                type: 'figure',
                html: clonedFigure.outerHTML
            });
        });

        return images;
    }

    cleanText(text) {
        if (!text) return '';

        return text
            .replace(/Report issue for preceding element/g, '') // Remove arXiv UI text
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/\n\s*\n/g, '\n') // Remove extra line breaks
            .trim();
    }

    setupEventListeners() {
        // Listen for text selection
        document.addEventListener('mouseup', (e) => {
            // Don't trigger on clicks inside PaperMind UI elements
            if (e.target.closest('.papermind-search-bar') || 
                e.target.closest('.papermind-knowledge-panel') ||
                e.target.closest('.papermind-container')) {
                return;
            }
            
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
            } else if (request.action === 'progressUpdate') {
                // Handle progress updates from background script
                this.updateProgress(request.current, request.total, request.message);
                sendResponse({ success: true });
            }
        });
    }

    showContextMenu(event) {
        if (this.highlightedText.length < 10) return;

        // Remove existing search bar
        const existing = document.querySelector('.papermind-search-bar');
        if (existing) {
            existing.remove();
        }

        // Store selection position AND range
        const selection = window.getSelection();
        this.selectionRect = selection.getRangeAt(0).getBoundingClientRect();
        this.selectionRange = selection.getRangeAt(0).cloneRange(); // Clone the range to preserve it

        // Create compact search bar near selection
        const searchBar = document.createElement('div');
        searchBar.className = 'papermind-search-bar';
        searchBar.innerHTML = `
            <div class="search-bar-content">
                <button class="search-icon-btn" id="quick-search-btn" title="Quick explanation">
                    <span class="search-icon">?</span>
                </button>
                <input type="text" 
                       class="search-input" 
                       id="search-input" 
                       placeholder="Ask about this text..."
                       autocomplete="off">
                <button class="search-submit-btn" id="search-submit-btn" title="Ask">
                    <span>→</span>
                </button>
            </div>
        `;

        // Position near selection
        searchBar.style.position = 'absolute';
        searchBar.style.left = `${this.selectionRect.left + window.scrollX}px`;
        searchBar.style.top = `${this.selectionRect.bottom + window.scrollY + 8}px`;

        document.body.appendChild(searchBar);

        const input = searchBar.querySelector('#search-input');
        const quickBtn = searchBar.querySelector('#quick-search-btn');
        const submitBtn = searchBar.querySelector('#search-submit-btn');

        // Quick search button (default explanation)
        quickBtn.addEventListener('click', () => {
            this.generateExplanation('default', '');
            searchBar.remove();
        });

        // Submit custom question
        const handleSubmit = () => {
            const question = input.value.trim();
            if (question) {
                this.generateExplanation('custom', question);
            } else {
                this.generateExplanation('default', '');
            }
            searchBar.remove();
        };

        submitBtn.addEventListener('click', handleSubmit);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSubmit();
        });

        // Auto-focus input and restore selection
        setTimeout(() => {
            input.focus();
            // Restore the selection to keep the highlight visible
            if (this.selectionRange) {
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(this.selectionRange);
            }
        }, 50);

        // Prevent input from clearing selection when typing
        input.addEventListener('focus', () => {
            if (this.selectionRange) {
                setTimeout(() => {
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(this.selectionRange);
                }, 10);
            }
        });

        // Remove on click outside
        setTimeout(() => {
            document.addEventListener('click', (e) => {
                if (!searchBar.contains(e.target)) {
                    searchBar.remove();
                    // Clear the stored range when done
                    this.selectionRange = null;
                }
            }, { once: true });
        }, 100);
    }


    async generateExplanation(mode, customPrompt = '') {
        // Show side panel for results (non-blocking)
        this.showKnowledgePanel('loading');

        try {
            let fullPrompt;
            if (mode === 'custom' && customPrompt) {
                fullPrompt = `${customPrompt}

Context from paper: "${this.highlightedText}"

Provide a detailed explanation including:
1. Background knowledge needed to understand this
2. What this means in the context of the paper
3. Why this technique/concept is used here
4. Key takeaways (bullet points)`;
            } else {
                fullPrompt = `Analyze this text from a research paper and provide:

Text: "${this.highlightedText}"

1. **Background Knowledge**: What concepts/theories are needed to understand this?
2. **Explanation**: What does this mean in plain language?
3. **Context in Paper**: Why is this used here? What problem does it solve?
4. **Examples**: Real-world applications or analogies
5. **Key Points**: 3-5 bullet points summarizing the most important takeaways

Format as structured sections with clear headings.`;
            }

            const response = await chrome.runtime.sendMessage({
                action: 'processText',
                prompt: fullPrompt,
                text: this.highlightedText
            });

            if (response && response.result) {
                const keyPoints = this.extractKeyPoints(response.result);

                this.showKnowledgePanel('result', {
                    fullExplanation: response.result,
                    keyPoints: keyPoints,
                    question: customPrompt || 'Quick Explanation',
                    selectedText: this.highlightedText
                });
            }
        } catch (error) {
            console.error('Error generating explanation:', error);
            this.showKnowledgePanel('error', { message: error.message });
        }
    }

    extractKeyPoints(text) {
        // Extract bullet points or numbered items from the response
        const lines = text.split('\n');
        const keyPoints = [];

        for (const line of lines) {
            const trimmed = line.trim();
            // Match bullet points, numbered lists, or "Key Points" section
            if (trimmed.match(/^[\-\*•]\s+/) || trimmed.match(/^\d+\.\s+/) ||
                (trimmed.startsWith('-') && trimmed.length > 10)) {
                const cleaned = trimmed.replace(/^[\-\*•\d\.]\s+/, '').trim();
                if (cleaned.length > 20 && cleaned.length < 300) {
                    keyPoints.push(cleaned);
                }
            }
        }

        // If no points found, extract first few sentences
        if (keyPoints.length === 0) {
            const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
            return sentences.slice(0, 3).map(s => s.trim());
        }

        return keyPoints.slice(0, 5); // Max 5 key points
    }

    showKnowledgePanel(state, data = {}) {
        let panel = document.querySelector('.papermind-knowledge-panel');

        if (!panel) {
            panel = document.createElement('div');
            panel.className = 'papermind-knowledge-panel';
            panel.innerHTML = `
                <div class="knowledge-panel-header">
                    <span class="panel-title">Knowledge Assistant</span>
                    <button class="panel-minimize" title="Minimize">−</button>
                    <button class="panel-close" title="Close">×</button>
                </div>
                <div class="knowledge-panel-body">
                    <div class="panel-content"></div>
                </div>
            `;
            document.body.appendChild(panel);

            // Make it draggable
            this.makeKnowledgePanelDraggable(panel);

            // Setup header buttons
            panel.querySelector('.panel-close').addEventListener('click', () => {
                panel.remove();
            });

            panel.querySelector('.panel-minimize').addEventListener('click', () => {
                panel.classList.toggle('minimized');
            });
        }

        const contentDiv = panel.querySelector('.panel-content');

        if (state === 'loading') {
            contentDiv.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Analyzing text...</p>
                </div>
            `;
        } else if (state === 'result') {
            const { fullExplanation, keyPoints, question, selectedText } = data;

            contentDiv.innerHTML = `
                <div class="knowledge-result">
                    <div class="selected-text-preview">
                        <strong>Selected:</strong> "${selectedText.substring(0, 100)}${selectedText.length > 100 ? '...' : ''}"
                    </div>
                    
                    <div class="full-explanation">
                        <h4>Explanation</h4>
                        <div class="explanation-text">${this.formatExplanation(fullExplanation)}</div>
                    </div>
                    
                    <div class="key-points-section">
                        <h4>Key Points</h4>
                        <div class="key-points-list" contenteditable="true" id="editable-key-points">
                            ${keyPoints.map(point => `<div class="key-point">• ${point}</div>`).join('')}
                        </div>
                        <div class="key-points-hint">Click to edit these notes before saving</div>
                    </div>
                    
                    <div class="panel-actions">
                        <button class="btn-followup">Ask Follow-up</button>
                        <button class="btn-save-notes">Save to Notes</button>
                    </div>
                </div>
            `;

            // Setup action buttons
            contentDiv.querySelector('.btn-followup').addEventListener('click', () => {
                this.showFollowUpInPanel(panel, {
                    originalText: selectedText,
                    previousExplanation: fullExplanation
                });
            });

            contentDiv.querySelector('.btn-save-notes').addEventListener('click', () => {
                const editableDiv = contentDiv.querySelector('#editable-key-points');
                const editedKeyPoints = Array.from(editableDiv.querySelectorAll('.key-point'))
                    .map(el => el.textContent.replace(/^[•\-\*]\s*/, '').trim())
                    .filter(p => p.length > 0);

                this.saveToStudyNotes({
                    selectedText: selectedText,
                    prompt: question,
                    keyPoints: editedKeyPoints,
                    fullExplanation: fullExplanation,
                    timestamp: new Date().toISOString(),
                    paperTitle: this.paperData?.title || document.title,
                    paperUrl: window.location.href
                });

                this.showNotification('Saved to study notes ✓', 'success');
                this.loadStudyNotes(); // Refresh notes in main panel
            });

        } else if (state === 'error') {
            contentDiv.innerHTML = `
                <div class="error-state">
                    <span class="error-icon">!</span>
                    <p>Failed to generate explanation</p>
                    <small>${data.message || 'Please try again'}</small>
                </div>
            `;
        }

        // Show and position panel
        panel.classList.remove('minimized');
        panel.style.display = 'flex';
    }

    makeKnowledgePanelDraggable(panel) {
        const header = panel.querySelector('.knowledge-panel-header');
        let isDragging = false;
        let currentX, currentY, initialX, initialY;

        header.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('panel-close') ||
                e.target.classList.contains('panel-minimize')) return;

            isDragging = true;
            initialX = e.clientX - (parseInt(panel.style.right) || 20);
            initialY = e.clientY - (parseInt(panel.style.top) || 100);
            header.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            panel.style.right = 'auto';
            panel.style.left = currentX + 'px';
            panel.style.top = currentY + 'px';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            header.style.cursor = 'grab';
        });
    }

    showFollowUpInPanel(panel, context) {
        const contentDiv = panel.querySelector('.panel-content');

        contentDiv.innerHTML = `
            <div class="followup-section">
                <div class="followup-context">
                    <strong>Context:</strong> "${context.originalText.substring(0, 100)}..."
                </div>
                <div class="followup-input-area">
                    <textarea class="followup-input" 
                              placeholder="Ask a follow-up question..."
                              rows="3"></textarea>
                    <div class="followup-buttons">
                        <button class="btn-back">← Back</button>
                        <button class="btn-submit-followup">Ask →</button>
                    </div>
                </div>
            </div>
        `;

        const textarea = contentDiv.querySelector('.followup-input');
        const submitBtn = contentDiv.querySelector('.btn-submit-followup');
        const backBtn = contentDiv.querySelector('.btn-back');

        submitBtn.addEventListener('click', async () => {
            const question = textarea.value.trim();
            if (!question) return;

            // Show loading
            this.showKnowledgePanel('loading');

            // Generate follow-up answer
            const prompt = `Previous question about: "${context.originalText}"

Previous explanation: ${context.previousExplanation}

Follow-up question: ${question}

Provide a focused answer to the follow-up question, building on the previous explanation.`;

            try {
                const response = await chrome.runtime.sendMessage({
                    action: 'processText',
                    prompt: prompt,
                    text: context.originalText
                });

                if (response && response.result) {
                    const keyPoints = this.extractKeyPoints(response.result);
                    this.showKnowledgePanel('result', {
                        fullExplanation: response.result,
                        keyPoints: keyPoints,
                        question: question,
                        selectedText: context.originalText
                    });
                }
            } catch (error) {
                console.error('Follow-up error:', error);
                this.showKnowledgePanel('error', { message: error.message });
            }
        });

        backBtn.addEventListener('click', () => {
            // Regenerate previous result
            const keyPoints = this.extractKeyPoints(context.previousExplanation);
            this.showKnowledgePanel('result', {
                fullExplanation: context.previousExplanation,
                keyPoints: keyPoints,
                question: 'Previous Question',
                selectedText: context.originalText
            });
        });

        textarea.focus();
    }

    formatExplanation(text) {
        // Simple formatting: convert newlines to paragraphs
        return text.split('\n\n').map(para => `<p>${para}</p>`).join('');
    }


    async saveToStudyNotes(note) {
        try {
            const result = await chrome.storage.local.get(['studyNotes']);
            const studyNotes = result.studyNotes || [];
            studyNotes.push(note);
            await chrome.storage.local.set({ studyNotes });
            console.log('📝 Note saved to study notes');

            // Update the notes display
            this.loadStudyNotes();
        } catch (error) {
            console.error('Error saving study note:', error);
        }
    }

    async loadStudyNotes() {
        try {
            const result = await chrome.storage.local.get(['studyNotes']);
            const studyNotes = result.studyNotes || [];

            const notesList = document.getElementById('notes-list');
            if (!notesList) return;

            if (studyNotes.length === 0) {
                notesList.innerHTML = '<p class="notes-empty">No notes yet. Highlight text and explain it to save notes.</p>';
                return;
            }

            // Filter notes for current paper
            const currentPaperNotes = studyNotes.filter(note =>
                note.paperUrl === window.location.href
            );

            if (currentPaperNotes.length === 0) {
                notesList.innerHTML = '<p class="notes-empty">No notes for this paper yet.</p>';
                return;
            }

            notesList.innerHTML = currentPaperNotes.map((note, index) => {
                const hasKeyPoints = note.keyPoints && note.keyPoints.length > 0;
                const isLongText = (note.selectedText || '').length > 60;
                const isLongExplanation = (note.explanation || '').length > 150;
                const needsExpand = isLongText || isLongExplanation || hasKeyPoints;

                return `
                    <div class="note-item ${needsExpand ? 'expandable' : ''}" data-index="${index}">
                        <div class="note-header">
                            <span class="note-badge">${note.prompt}</span>
                            <div class="note-actions">
                                <button class="note-edit" data-index="${index}" title="Edit">✎</button>
                                <button class="note-delete" data-index="${index}" title="Delete">×</button>
                            </div>
                        </div>
                        
                        <!-- Preview Mode (Collapsed) -->
                        <div class="note-preview">
                            <div class="note-text">
                                <strong>Selected:</strong> "${note.selectedText.substring(0, 60)}${isLongText ? '...' : ''}"
                            </div>
                            ${hasKeyPoints 
                                ? `<div class="note-key-points-preview">
                                    <strong>Key Points:</strong> ${note.keyPoints.length} points
                                   </div>`
                                : `<div class="note-explanation">
                                    ${(note.explanation || '').substring(0, 150)}${isLongExplanation ? '...' : ''}
                                   </div>`
                            }
                        </div>
                        
                        <!-- Full Content (Expanded) -->
                        <div class="note-full-content hidden">
                            <div class="note-text-full">
                                <strong>Selected Text:</strong>
                                <div class="note-selected-text">${note.selectedText}</div>
                            </div>
                            
                            ${note.explanation ? `
                                <div class="note-explanation-full">
                                    <strong>Explanation:</strong>
                                    <div class="note-explanation-text">${note.explanation}</div>
                                </div>
                            ` : ''}
                            
                            ${hasKeyPoints ? `
                                <div class="note-key-points-full">
                                    <strong>Key Points:</strong>
                                    <ul>
                                        ${note.keyPoints.map(point => `<li>${point}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                        
                        <!-- Edit Mode -->
                        <div class="note-edit-mode hidden">
                            <div class="note-edit-field">
                                <label>Selected Text:</label>
                                <textarea class="note-edit-selected" rows="3">${note.selectedText}</textarea>
                            </div>
                            
                            <div class="note-edit-field">
                                <label>Explanation:</label>
                                <textarea class="note-edit-explanation" rows="6">${note.explanation || ''}</textarea>
                            </div>
                            
                            <div class="note-edit-field">
                                <label>Key Points (one per line):</label>
                                <textarea class="note-edit-keypoints" rows="4">${hasKeyPoints ? note.keyPoints.join('\n') : ''}</textarea>
                            </div>
                            
                            <div class="note-edit-actions">
                                <button class="note-save" data-index="${index}">Save</button>
                                <button class="note-cancel" data-index="${index}">Cancel</button>
                            </div>
                        </div>
                        
                        <div class="note-footer">
                            <small>${new Date(note.timestamp).toLocaleString()}</small>
                            ${needsExpand ? '<button class="note-expand-toggle">Show more</button>' : ''}
                        </div>
                    </div>
                `;
            }).join('');

            // Add event handlers
            this.attachNoteEventHandlers(notesList, currentPaperNotes);

        } catch (error) {
            console.error('Error loading study notes:', error);
        }
    }

    attachNoteEventHandlers(notesList, currentPaperNotes) {
        // Expand/Collapse toggle
        notesList.querySelectorAll('.note-expand-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const noteItem = e.target.closest('.note-item');
                const preview = noteItem.querySelector('.note-preview');
                const fullContent = noteItem.querySelector('.note-full-content');
                const isExpanded = !fullContent.classList.contains('hidden');
                
                if (isExpanded) {
                    fullContent.classList.add('hidden');
                    preview.classList.remove('hidden');
                    btn.textContent = 'Show more';
                } else {
                    fullContent.classList.remove('hidden');
                    preview.classList.add('hidden');
                    btn.textContent = 'Show less';
                }
            });
        });

        // Edit button
        notesList.querySelectorAll('.note-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const noteItem = e.target.closest('.note-item');
                const preview = noteItem.querySelector('.note-preview');
                const fullContent = noteItem.querySelector('.note-full-content');
                const editMode = noteItem.querySelector('.note-edit-mode');
                
                preview.classList.add('hidden');
                fullContent.classList.add('hidden');
                editMode.classList.remove('hidden');
            });
        });

        // Save button
        notesList.querySelectorAll('.note-save').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                const noteItem = e.target.closest('.note-item');
                
                const selectedText = noteItem.querySelector('.note-edit-selected').value;
                const explanation = noteItem.querySelector('.note-edit-explanation').value;
                const keyPointsText = noteItem.querySelector('.note-edit-keypoints').value;
                const keyPoints = keyPointsText.split('\n').filter(p => p.trim()).map(p => p.trim());
                
                this.updateStudyNote(index, {
                    selectedText,
                    explanation,
                    keyPoints
                });
            });
        });

        // Cancel button
        notesList.querySelectorAll('.note-cancel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const noteItem = e.target.closest('.note-item');
                const preview = noteItem.querySelector('.note-preview');
                const editMode = noteItem.querySelector('.note-edit-mode');
                
                editMode.classList.add('hidden');
                preview.classList.remove('hidden');
            });
        });

        // Delete button
        notesList.querySelectorAll('.note-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(e.target.dataset.index);
                this.deleteStudyNote(index);
            });
        });
    }

    async updateStudyNote(index, updates) {
        try {
            const result = await chrome.storage.local.get(['studyNotes']);
            const studyNotes = result.studyNotes || [];
            
            // Find notes for current paper
            const currentPaperNotes = studyNotes.filter(note =>
                note.paperUrl === window.location.href
            );
            
            if (index < currentPaperNotes.length) {
                const noteToUpdate = currentPaperNotes[index];
                const globalIndex = studyNotes.indexOf(noteToUpdate);
                
                // Update the note
                studyNotes[globalIndex] = {
                    ...studyNotes[globalIndex],
                    ...updates,
                    timestamp: studyNotes[globalIndex].timestamp // Keep original timestamp
                };
                
                await chrome.storage.local.set({ studyNotes });
                this.loadStudyNotes();
                this.showNotification('Note updated successfully', 'success');
            }
        } catch (error) {
            console.error('Error updating note:', error);
            this.showNotification('Failed to update note', 'error');
        }
    }

    async deleteStudyNote(index) {
        try {
            const result = await chrome.storage.local.get(['studyNotes']);
            const studyNotes = result.studyNotes || [];

            // Find notes for current paper
            const currentPaperNotes = studyNotes.filter(note =>
                note.paperUrl === window.location.href
            );

            if (index < currentPaperNotes.length) {
                const noteToDelete = currentPaperNotes[index];
                const globalIndex = studyNotes.indexOf(noteToDelete);
                studyNotes.splice(globalIndex, 1);
                await chrome.storage.local.set({ studyNotes });
                this.loadStudyNotes();
                this.showNotification('Note deleted', 'info');
            }
        } catch (error) {
            console.error('Error deleting note:', error);
        }
    }

    async downloadStudyNotes() {
        try {
            const result = await chrome.storage.local.get(['studyNotes']);
            const studyNotes = result.studyNotes || [];

            // Filter notes for current paper
            const currentPaperNotes = studyNotes.filter(note =>
                note.paperUrl === window.location.href
            );

            if (currentPaperNotes.length === 0) {
                this.showNotification('No notes to download', 'warning');
                return;
            }

            // Format notes as markdown
            const markdown = this.formatNotesAsMarkdown(currentPaperNotes);

            // Create and download file
            const blob = new Blob([markdown], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `papermind-notes-${new Date().toISOString().split('T')[0]}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showNotification('Notes downloaded successfully!', 'success');
        } catch (error) {
            console.error('Error downloading notes:', error);
            this.showNotification('Failed to download notes', 'error');
        }
    }

    formatNotesAsMarkdown(notes) {
        const paperTitle = this.paperData?.title || document.title;
        const paperUrl = window.location.href;
        const date = new Date().toLocaleDateString();

        let markdown = `# PaperMind Study Notes\n\n`;
        markdown += `**Paper:** ${paperTitle}\n`;
        markdown += `**URL:** ${paperUrl}\n`;
        markdown += `**Date:** ${date}\n`;
        markdown += `**Total Notes:** ${notes.length}\n\n`;
        markdown += `---\n\n`;

        notes.forEach((note, index) => {
            markdown += `## Note ${index + 1}: ${note.prompt}\n\n`;
            markdown += `**Selected Text:**\n> ${note.selectedText}\n\n`;

            // Add key points if available
            if (note.keyPoints && note.keyPoints.length > 0) {
                markdown += `**Key Points:**\n`;
                note.keyPoints.forEach(point => {
                    markdown += `- ${point}\n`;
                });
                markdown += `\n`;
            }

            // Add full explanation if available
            if (note.fullExplanation) {
                markdown += `**Full Explanation:**\n${note.fullExplanation}\n\n`;
            } else if (note.explanation) {
                markdown += `**Explanation:**\n${note.explanation}\n\n`;
            }

            markdown += `**Time:** ${new Date(note.timestamp).toLocaleString()}\n\n`;
            if (note.isFollowUp) {
                markdown += `*This is a follow-up question*\n\n`;
            }
            markdown += `---\n\n`;
        });

        markdown += `\n\n*Generated by PaperMind - AI Research Assistant*\n`;
        return markdown;
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
        <h3>PaperMind AI Summary</h3>
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

    createProgressPanel() {
        // Remove existing progress panel if any
        const existing = document.getElementById('papermind-progress-panel');
        if (existing) {
            existing.remove();
        }

        const panel = document.createElement('div');
        panel.id = 'papermind-progress-panel';
        panel.className = 'papermind-progress-panel';
        panel.innerHTML = `
            <div class="progress-header">
                <div class="progress-title">
                    <span class="progress-title-text">Analyzing Paper</span>
                </div>
                <button class="progress-minimize" title="Minimize">−</button>
            </div>
            <div class="progress-content">
                <div class="progress-status">
                    <p id="progress-message">Preparing to analyze...</p>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar" id="progress-bar">
                        <div class="progress-fill" id="progress-fill"></div>
                    </div>
                </div>
                <div class="progress-stats">
                    <span id="progress-percent">0%</span>
                    <span id="progress-section">0 / 0 sections</span>
                </div>
                <div class="progress-ai-info">
                    <span><span class="ai-label">AI:</span> Gemini Nano</span>
                    <span>Private</span>
                </div>
            </div>
        `;

        document.body.appendChild(panel);

        // Add minimize/expand functionality
        const minimizeBtn = panel.querySelector('.progress-minimize');
        const content = panel.querySelector('.progress-content');
        let isMinimized = false;

        minimizeBtn.addEventListener('click', () => {
            isMinimized = !isMinimized;
            if (isMinimized) {
                content.style.display = 'none';
                minimizeBtn.textContent = '+';
                minimizeBtn.title = 'Expand';
                panel.classList.add('minimized');
            } else {
                content.style.display = 'block';
                minimizeBtn.textContent = '−';
                minimizeBtn.title = 'Minimize';
                panel.classList.remove('minimized');
            }
        });

        return panel;
    }

    updateProgress(current, total, message = '') {
        const progressFill = document.getElementById('progress-fill');
        const progressPercent = document.getElementById('progress-percent');
        const progressSectionCount = document.getElementById('progress-section-count');
        const progressMessage = document.getElementById('progress-message');

        if (progressFill && progressPercent && progressSectionCount) {
            const percent = Math.round((current / total) * 100);
            progressFill.style.width = percent + '%';
            progressPercent.textContent = percent + '%';
            progressSectionCount.textContent = `${current} / ${total}`;

            if (message && progressMessage) {
                progressMessage.textContent = message;
            }
        }
    }

    removeProgressPanel() {
        const panel = document.getElementById('papermind-progress-panel');
        if (panel) {
            panel.classList.add('slide-out');
            setTimeout(() => {
                panel.remove();
            }, 500);
        }
    }

    async analyzePaper() {
        // Double-check we have paper data (should already be extracted in init)
        if (!this.paperData) {
            console.warn('⚠️ PaperMind: Paper data not found, extracting now...');
            this.extractPaperContent();
        } else {
            console.log('🚀 PaperMind: Starting analysis with pre-extracted content');
        }

        // Set analyzing flag
        this.isAnalyzing = true;

        // Show progress section in expandable panel
        const progressSection = document.getElementById('progress-section');
        const analyzeButton = document.getElementById('analyze-button');
        if (progressSection && analyzeButton) {
            progressSection.classList.remove('hidden');
            analyzeButton.classList.add('hidden');
        }

        // Keep panel open during analysis
        if (this.expandablePanel) {
            this.expandablePanel.classList.remove('hidden');
        }
        if (this.floatingButton) {
            this.floatingButton.classList.add('hidden');
        }

        // Initialize with unknown total (will be updated by background script)
        const totalSections = this.paperData.sections?.length || 0;
        this.updateProgress(0, totalSections || 10, 'Initializing AI analysis...');

        try {
            // Send paper data to background script for AI processing
            // Progress updates will come via progressUpdate messages
            const response = await chrome.runtime.sendMessage({
                action: 'analyzePaper',
                paperData: this.paperData
            });

            if (response && response.summary) {
                // Final update before rendering
                this.updateProgress(totalSections, totalSections, 'Rendering enhanced paper...');

                // Small delay to show the final progress
                await new Promise(resolve => setTimeout(resolve, 500));

                // Check if it's the new HTML array format or old object format
                if (Array.isArray(response.summary)) {
                    this.renderEnhancedPaper(response.summary);
                } else {
                    this.displaySummary(response.summary);
                }

                // Hide progress section and show analyze button
                if (progressSection && analyzeButton) {
                    progressSection.classList.add('hidden');
                    analyzeButton.classList.remove('hidden');
                }

                // Reset analyzing flag
                this.isAnalyzing = false;

                // Allow panel to close on mouse leave
                if (this.expandablePanel) {
                    this.expandablePanel.classList.add('hidden');
                }
                if (this.floatingButton) {
                    this.floatingButton.classList.remove('hidden');
                }

                // Show toggle switch in panel header
                const toggleSwitch = document.getElementById('view-toggle-switch');
                if (toggleSwitch) {
                    toggleSwitch.classList.remove('hidden');
                }

                // Set to enhanced view by default
                const toggleCheckbox = document.getElementById('view-toggle-checkbox');
                const toggleLabel = document.getElementById('toggle-label');
                if (toggleCheckbox) toggleCheckbox.checked = true;
                if (toggleLabel) toggleLabel.textContent = 'Enhanced';

                this.showNotification('Paper enhanced successfully! 🎉', 'success');
            }
        } catch (error) {
            console.error('PaperMind: Error analyzing paper', error);

            // Hide progress section and show analyze button
            if (progressSection && analyzeButton) {
                progressSection.classList.add('hidden');
                analyzeButton.classList.remove('hidden');
            }

            // Reset analyzing flag
            this.isAnalyzing = false;

            this.showError('Failed to analyze paper. Please try again.');
        }
    }

    renderEnhancedPaper(htmlSections) {
        // Close the summary panel if it's open
        if (this.summaryPanel) {
            this.summaryPanel.remove();
            this.summaryPanel = null;
        }

        // Find the article element
        const article = this.extractArticle();
        if (!article) {
            console.error('PaperMind: Cannot find article element to render enhanced paper');
            return;
        }

        // Find existing sections in the article
        const existingSections = article.querySelectorAll('section.ltx_section');

        if (existingSections.length === 0) {
            console.error('PaperMind: No sections found in article');
            return;
        }

        // Verify we have matching number of sections
        if (existingSections.length !== htmlSections.length) {
            console.warn(`PaperMind: Section count mismatch. Found ${existingSections.length} sections but received ${htmlSections.length} HTML sections`);
        }

        // Store enhanced sections data
        this.enhancedSections = htmlSections;

        // Replace content of each existing section with enhanced content
        const maxSections = Math.min(existingSections.length, htmlSections.length);
        for (let i = 0; i < maxSections; i++) {
            const section = existingSections[i];
            const html = htmlSections[i];

            // Store original content if not already stored
            if (!section.hasAttribute('data-original-content')) {
                section.setAttribute('data-original-content', section.innerHTML);
            }

            // Parse markdown syntax in the HTML
            const parsedHtml = this.parseMarkdownInHtml(html);

            // Wrap original content in a container that can be hidden
            const originalWrapper = document.createElement('div');
            originalWrapper.className = 'papermind-original-content';
            originalWrapper.style.display = 'none';
            originalWrapper.innerHTML = section.innerHTML;

            // Add the enhanced content
            const enhancedWrapper = document.createElement('div');
            enhancedWrapper.className = 'papermind-enhanced-content';
            enhancedWrapper.innerHTML = parsedHtml;

            // Clear section and add both versions
            section.innerHTML = '';
            section.appendChild(originalWrapper);
            section.appendChild(enhancedWrapper);

            // Mark the section as enhanced
            section.setAttribute('data-papermind-enhanced', 'true');
        }

        // Mark article as enhanced
        article.classList.add('papermind-enhanced');
        article.classList.remove('papermind-original');

        console.log('PaperMind: Enhanced paper rendered successfully');
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    parseMarkdownInHtml(html) {
        // Parse markdown syntax within HTML content
        // This handles common markdown patterns that might appear in the AI-generated content

        // Bold: **text** → <strong>text</strong>
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

        // Italic: *text* → <em>text</em> (but not if it's part of **)
        html = html.replace(/(?<!\*)\*([^\*]+?)\*(?!\*)/g, '<em>$1</em>');

        // Inline code: `code` → <code>code</code>
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Links: [text](url) → <a href="url">text</a>
        html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

        return html;
    }

    displaySummary(summary) {
        const content = this.summaryPanel.querySelector('.panel-content');
        content.innerHTML = `
      <div class="summary-section">
        <h4>Overview</h4>
        <p>${summary.overview}</p>
      </div>
      <div class="summary-section">
        <h4>Key Points</h4>
        <ul>
          ${summary.keyPoints.map(point => `<li>${point}</li>`).join('')}
        </ul>
      </div>
      <div class="summary-section">
        <h4>Methodology</h4>
        <p>${summary.methodology}</p>
      </div>
      <div class="summary-section">
        <h4>Results</h4>
        <p>${summary.results}</p>
      </div>
      <div class="summary-section">
        <h4>Implications</h4>
        <p>${summary.implications}</p>
      </div>
      <div class="interactive-section">
        <h4>Ask Questions</h4>
        <div class="question-input">
          <input type="text" placeholder="Ask a question about this paper..." id="question-input">
          <button id="ask-question">Ask</button>
        </div>
      </div>
    `;

        // Add question functionality
        this.setupQuestionHandler();
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
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.querySelector('.papermind-notification');
        if (existing) {
            existing.remove();
        }

        const notification = document.createElement('div');
        notification.className = `papermind-notification notification-${type}`;

        const icons = {
            success: '✓',
            error: '✕',
            warning: '!',
            info: 'i'
        };

        notification.innerHTML = `
            <span class="notification-icon">${icons[type] || icons.info}</span>
            <span class="notification-message">${message}</span>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 5000);
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
