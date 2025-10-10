// PaperMind Background Service Worker
// Handles AI processing using Chrome's built-in AI APIs

class PaperMindAI {
    constructor() {
        this.setupMessageHandlers();
        this.cache = new Map();
    }

    setupMessageHandlers() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep message channel open for async responses
        });
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            switch (request.action) {
                case 'analyzePaper':
                    const summary = await this.analyzePaper(request.paperData);
                    sendResponse({ summary });
                    break;

                case 'askQuestion':
                    const answer = await this.askQuestion(request.question, request.paperData);
                    sendResponse({ answer });
                    break;

                case 'processText':
                    const result = await this.processText(request.prompt, request.text);
                    sendResponse({ result });
                    break;

                case 'generateDiagram':
                    const diagram = await this.generateDiagram(request.concept, request.paperData);
                    sendResponse({ diagram });
                    break;

                default:
                    sendResponse({ error: 'Unknown action' });
            }
        } catch (error) {
            console.error('PaperMind Background Error:', error);
            sendResponse({ error: error.message });
        }
    }

    async analyzePaper(paperData) {
        const cacheKey = `analysis_${paperData.url}`;

        // Check cache first
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            // Use Chrome's built-in AI APIs for paper analysis
            const analysisPrompt = this.createAnalysisPrompt(paperData);

            // Simulate Chrome AI API call (replace with actual API when available)
            const summary = await this.callChromeAI(analysisPrompt);

            const result = {
                overview: summary.overview || this.generateOverview(paperData),
                keyPoints: summary.keyPoints || this.extractKeyPoints(paperData),
                methodology: summary.methodology || this.extractMethodology(paperData),
                results: summary.results || this.extractResults(paperData),
                implications: summary.implications || this.extractImplications(paperData)
            };

            // Cache the result
            this.cache.set(cacheKey, result);
            return result;

        } catch (error) {
            console.error('Error analyzing paper:', error);
            return this.generateFallbackSummary(paperData);
        }
    }

    createAnalysisPrompt(paperData) {
        return `
Analyze this research paper and provide a comprehensive summary:

Title: ${paperData.title}
Authors: ${paperData.authors}
Abstract: ${paperData.abstract}

Please provide:
1. A clear overview of the paper's main contribution
2. Key points and findings
3. Methodology used
4. Results and conclusions
5. Implications and significance

Format the response as a structured JSON object with the following keys:
- overview: Brief summary of the paper's purpose and main contribution
- keyPoints: Array of 3-5 key findings or points
- methodology: Description of the research approach
- results: Main results and findings
- implications: Significance and potential impact
    `.trim();
    }

    async callChromeAI(prompt) {
        // This is a placeholder for Chrome's built-in AI API
        // In the actual implementation, this would use Chrome's AI APIs

        try {
            // Simulate AI processing delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // For now, return a structured response
            // In production, this would call the actual Chrome AI API
            return {
                overview: "This paper presents a novel approach to the research problem, introducing innovative methods and achieving significant results.",
                keyPoints: [
                    "Novel methodology with improved performance",
                    "Significant experimental validation",
                    "Practical applications demonstrated",
                    "Theoretical contributions to the field"
                ],
                methodology: "The research employs a systematic approach combining theoretical analysis with experimental validation.",
                results: "The experiments demonstrate clear improvements over existing methods, with statistically significant results.",
                implications: "This work opens new directions for future research and has practical applications in the field."
            };
        } catch (error) {
            throw new Error('AI processing failed: ' + error.message);
        }
    }

    async askQuestion(question, paperData) {
        const cacheKey = `question_${question}_${paperData.url}`;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const questionPrompt = this.createQuestionPrompt(question, paperData);
            const answer = await this.callChromeAI(questionPrompt);

            this.cache.set(cacheKey, answer);
            return answer;

        } catch (error) {
            console.error('Error answering question:', error);
            return "I'm sorry, I couldn't process your question at this time. Please try again.";
        }
    }

    createQuestionPrompt(question, paperData) {
        return `
Based on this research paper, answer the following question: "${question}"

Paper Context:
Title: ${paperData.title}
Abstract: ${paperData.abstract}

Please provide a clear, accurate answer based on the paper's content. If the question cannot be answered from the paper, please say so.
    `.trim();
    }

    async processText(prompt, text) {
        try {
            const fullPrompt = `${prompt}\n\nText: "${text}"`;
            const result = await this.callChromeAI(fullPrompt);
            return result;
        } catch (error) {
            console.error('Error processing text:', error);
            return "I'm sorry, I couldn't process that text at this time.";
        }
    }

    async generateDiagram(concept, paperData) {
        try {
            const diagramPrompt = this.createDiagramPrompt(concept, paperData);
            const diagram = await this.callChromeAI(diagramPrompt);
            return diagram;
        } catch (error) {
            console.error('Error generating diagram:', error);
            return null;
        }
    }

    createDiagramPrompt(concept, paperData) {
        return `
Create a visual diagram or flowchart to explain this concept: "${concept}"

Based on the paper: ${paperData.title}
Abstract: ${paperData.abstract}

Please provide a description of a diagram that would help visualize this concept, including:
- Main components or elements
- Relationships between components
- Flow or process steps
- Key labels and annotations
    `.trim();
    }

    // Fallback methods for when AI is not available
    generateOverview(paperData) {
        return `This paper titled "${paperData.title}" presents research findings in the field. The abstract provides an overview of the study's objectives and methodology.`;
    }

    extractKeyPoints(paperData) {
        const points = [];
        if (paperData.abstract) {
            const sentences = paperData.abstract.split('.').filter(s => s.trim().length > 20);
            points.push(...sentences.slice(0, 4).map(s => s.trim()));
        }
        return points.length > 0 ? points : ['Key findings from the research', 'Methodology employed', 'Results obtained'];
    }

    extractMethodology(paperData) {
        return "The paper describes a systematic research approach with clear methodology for data collection and analysis.";
    }

    extractResults(paperData) {
        return "The research presents significant findings that contribute to the field's understanding of the topic.";
    }

    extractImplications(paperData) {
        return "This work has important implications for future research and practical applications in the field.";
    }

    generateFallbackSummary(paperData) {
        return {
            overview: this.generateOverview(paperData),
            keyPoints: this.extractKeyPoints(paperData),
            methodology: this.extractMethodology(paperData),
            results: this.extractResults(paperData),
            implications: this.extractImplications(paperData)
        };
    }
}

// Initialize the AI service
const paperMindAI = new PaperMindAI();

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('PaperMind AI Assistant installed successfully');

        // Set up default settings
        chrome.storage.sync.set({
            autoAnalyze: true,
            showDiagrams: true,
            aiModel: 'gemini-nano'
        });
    }
});

// Handle tab updates to detect new papers
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // Check if it's a research paper URL
        const paperIndicators = [
            'arxiv.org',
            'scholar.google.com',
            'nature.com',
            'science.org',
            'springer.com',
            'ieeexplore.ieee.org',
            'acm.org'
        ];

        const isPaper = paperIndicators.some(indicator => tab.url.includes(indicator));

        if (isPaper) {
            // Notify content script that a paper page has loaded
            chrome.tabs.sendMessage(tabId, { action: 'paperDetected' }).catch(() => {
                // Content script might not be ready yet
            });
        }
    }
});

// Handle storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
        console.log('PaperMind settings updated:', changes);
    }
});
