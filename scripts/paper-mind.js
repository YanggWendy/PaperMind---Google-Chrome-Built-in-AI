// PaperMind - Main Orchestrator
// Detects papers, extracts content, coordinates analysis

class PaperMind {
    constructor() {
        this.isActive = false;
        this.paperData = null;
        this.summaryPanel = null;
        this.highlightedText = '';
        this.isAnalyzing = false;
        this.selectionRect = null;
        this.init();
    }

    init() {
        if (this.isResearchPaper()) {
            console.log('🧠 PaperMind: Research paper detected!');
            this.extractPaperContent();
            console.log('✅ PaperMind: Paper content extracted');

            // Initialize UI (from ui.js)
            if (window.PaperMindUI) {
                this.ui = new window.PaperMindUI(this);
                this.ui.createFloatingButton();
            }

            // Initialize highlights (from highlights.js)
            if (window.PaperMindHighlights) {
                this.highlights = new window.PaperMindHighlights(this);
                this.highlights.setupEventListeners();
            }
        }
    }

    isResearchPaper() {
        const url = window.location.href;
        const paperIndicators = [
            'arxiv.org', 'scholar.google.com', 'nature.com',
            'science.org', 'springer.com', 'ieeexplore.ieee.org', 'acm.org'
        ];
        return paperIndicators.some(indicator => url.includes(indicator));
    }

    async analyzePaper() {
        if (!this.paperData) {
            console.warn('⚠️ PaperMind: No paper data');
            this.extractPaperContent();
        }

        this.isAnalyzing = true;

        if (this.ui) {
            this.ui.showProgress();
            this.ui.keepPanelOpen();
        }

        try {
            const response = await chrome.runtime.sendMessage({
                action: 'analyzePaper',
                paperData: this.paperData
            });

            if (response && response.summary) {
                if (this.ui) {
                    this.ui.updateProgress(100, 100, 'Rendering...');
                    await new Promise(resolve => setTimeout(resolve, 500));

                    if (Array.isArray(response.summary)) {
                        this.ui.renderEnhancedPaper(response.summary);
                    } else {
                        this.ui.displaySummary(response.summary);
                    }

                    this.ui.hideProgress();
                    this.ui.showToggleSection();
                    this.ui.showNotification('Paper enhanced successfully! 🎉', 'success');
                }
            }
        } catch (error) {
            console.error('PaperMind: Error analyzing paper', error);
            if (this.ui) {
                this.ui.hideProgress();
                this.ui.showNotification('Failed to analyze paper', 'error');
            }
        }

        this.isAnalyzing = false;
    }

    // Content Extraction Methods

    extractPaperContent() {
        const article = this.extractArticle();
        this.paperData = {
            title: this.extractTitle(article),
            authors: this.extractAuthors(article),
            abstract: this.extractAbstract(article),
            sections: this.extractSections(article),
            url: window.location.href,
            timestamp: new Date().toISOString()
        };
    }

    extractArticle() {
        return document.querySelector('article') || document.body;
    }

    extractTitle(article) {
        const selectors = ['h1.ltx_title_document', 'h1.title', 'h1', '.title'];
        for (const sel of selectors) {
            const el = (article || document).querySelector(sel);
            if (el) return this.cleanText(el.textContent);
        }
        return document.title || 'Untitled Paper';
    }

    extractAuthors(article) {
        const selectors = ['.ltx_authors', '.authors', '.author'];
        for (const sel of selectors) {
            const el = (article || document).querySelector(sel);
            if (el) return this.cleanText(el.textContent);
        }
        return 'Unknown Authors';
    }

    extractAbstract(article) {
        const selectors = ['.ltx_abstract', '.abstract'];
        for (const sel of selectors) {
            const el = (article || document).querySelector(sel);
            if (el) return {
                text: this.cleanText(el.textContent),
                images: this.extractImages(el)
            };
        }
        return { text: '', images: [] };
    }

    extractSections(article) {
        const sections = [];
        const sectionElems = (article || document).querySelectorAll('section.ltx_section');

        sectionElems.forEach(section => {
            const titleElem = section.querySelector('h2, h3, h4');
            if (titleElem) {
                sections.push({
                    id: section.getAttribute('id'),
                    title: this.cleanText(titleElem.textContent),
                    text: this.extractSectionText(section),
                    images: this.extractImages(section),
                    element: section
                });
            }
        });

        return sections;
    }

    extractSectionText(sectionElement) {
        const clone = sectionElement.cloneNode(true);
        clone.querySelectorAll('button, .sr-only, figure').forEach(el => el.remove());
        return this.cleanText(clone.textContent);
    }

    extractImages(element) {
        const images = [];
        element.querySelectorAll('figure.ltx_figure').forEach(figure => {
            const cloned = figure.cloneNode(true);
            cloned.querySelectorAll('button.sr-only').forEach(btn => btn.remove());
            images.push({ type: 'figure', html: cloned.outerHTML });
        });
        return images;
    }

    cleanText(text) {
        if (!text) return '';
        return text
            .replace(/Report issue for preceding element/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
}

// Initialize PaperMind
const paperMind = new PaperMind();

// Expose globally
window.paperMind = paperMind;

