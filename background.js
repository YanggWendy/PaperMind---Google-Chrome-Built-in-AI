// PaperMind Background Service Worker
// Handles AI processing using Chrome's built-in AI APIs

// Import the Chrome AI helper and prompts
importScripts('chromeAIHelper.js', 'prompts.js');

class PaperMindAI {
    constructor() {
        this.setupMessageHandlers();
        this.cache = new Map();
        this.globalSession = null;
        this.sessionTimeout = null;
        this.SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Estimate the size of a chunk for AI processing
     * @param {Object} chunk - Paper data chunk
     * @returns {Object} Size statistics
     */
    estimateChunkSize(chunk) {
        const jsonStr = JSON.stringify(chunk);
        const textContent = chunk.sections?.map(s => s.text || '').join(' ') || '';
        const imageCount = chunk.sections?.reduce((sum, s) => sum + (s.images?.length || 0), 0) || 0;

        return {
            totalChars: jsonStr.length,
            textChars: textContent.length,
            imageCount: imageCount,
            estimatedTokens: Math.ceil(jsonStr.length / 4), // Rough estimate: ~4 chars per token
            isLarge: jsonStr.length > 50000 // Flag if over 50k characters
        };
    }

    /**
     * Chunks paperData into smaller pieces for processing
     * @param {Object} paperData - The full paper data object
     * @param {number} sectionsPerChunk - Number of sections per chunk (default: 2)
     * @returns {Array} Array of chunked paper data objects
     */
    chunkPaperData(paperData, sectionsPerChunk = 1) {
        if (!paperData || !paperData.sections || paperData.sections.length === 0) {
            return [paperData];
        }

        const chunks = [];
        const sections = paperData.sections;

        // Split sections into chunks
        for (let i = 0; i < sections.length; i += sectionsPerChunk) {
            const chunk = {
                title: paperData.title,
                abstract: paperData.abstract,
                url: paperData.url,
                timestamp: paperData.timestamp,
                sections: sections.slice(i, i + sectionsPerChunk),
                // Metadata about chunking
                chunkInfo: {
                    chunkIndex: Math.floor(i / sectionsPerChunk),
                    totalChunks: Math.ceil(sections.length / sectionsPerChunk),
                    sectionRange: [i, Math.min(i + sectionsPerChunk, sections.length)]
                }
            };
            chunks.push(chunk);
        }
        console.log('PaperMind: Chunks:', chunks);
        return chunks;
    }

    /**
     * Creates a text-only version of a chunk by removing images from all sections
     * @param {Object} chunk - The chunk object containing sections with potential images
     * @returns {Object} A new chunk object with images removed from all sections
     */
    createTextOnlyChunk(chunk) {
        if (!chunk) {
            return chunk;
        }

        return {
            ...chunk,
            sections: chunk.sections?.map(section => {
                const { images, ...sectionWithoutImages } = section;
                return sectionWithoutImages;
            }) || []
        };
    }

    /**
     * Cleans up HTML string by removing markdown code block wrappers
     * @param {string} htmlStr - The HTML string to clean
     * @returns {string} Cleaned HTML string
     */
    cleanupHtmlString(htmlStr) {
        if (!htmlStr || typeof htmlStr !== 'string') {
            return htmlStr;
        }

        // Check if the string starts with ``` (markdown code block)
        if (htmlStr.startsWith('```')) {
            // Remove the first ```html (7 characters) or ```HTML or just ```
            let cleaned = htmlStr;

            // Check for ```html or ```HTML
            if (htmlStr.startsWith('```html')) {
                cleaned = htmlStr.slice(7);
            } else if (htmlStr.startsWith('```HTML')) {
                cleaned = htmlStr.slice(7);
            } else {
                // Just ```, find the first newline and remove up to there
                const firstNewline = htmlStr.indexOf('\n');
                if (firstNewline !== -1) {
                    cleaned = htmlStr.slice(firstNewline + 1);
                } else {
                    cleaned = htmlStr.slice(3);
                }
            }

            // Remove the last ```
            if (cleaned.endsWith('```')) {
                cleaned = cleaned.slice(0, -3);
            }

            // Trim any extra whitespace
            return cleaned.trim();
        }

        return htmlStr;
    }

    /**
     * Injects image/figure HTML into the generated section HTML
     * @param {string} sectionHtml - The generated HTML string
     * @param {Object} chunk - The chunk object containing section data with images
     * @returns {string} HTML with images injected
     */
    injectImagesIntoHtml(sectionHtml, chunk) {
        if (!chunk || !chunk.sections || chunk.sections.length === 0) {
            return sectionHtml;
        }

        // Collect all figure HTML from sections
        let figuresHtml = '';

        chunk.sections.forEach((sectionData) => {
            if (!sectionData.images || sectionData.images.length === 0) return;

            // Simply concatenate the stored HTML elements
            sectionData.images.forEach((imageData) => {
                if (imageData.html) {
                    figuresHtml += imageData.html;
                }
            });
        });

        // If there are figures, inject them before the footer
        if (figuresHtml) {
            const imagesSection = `<div class="section-images">${figuresHtml}</div>`;

            // Insert before </footer> if exists, otherwise before </section>
            if (sectionHtml.includes('</footer>')) {
                sectionHtml = sectionHtml.replace('</footer>', `${imagesSection}</footer>`);
            } else if (sectionHtml.includes('</section>')) {
                sectionHtml = sectionHtml.replace('</section>', `${imagesSection}</section>`);
            } else {
                // Fallback: append to the end
                sectionHtml += imagesSection;
            }
        }

        return sectionHtml;
    }

    /**
     * Get or create a global AI session
     * This reuses the same session across multiple requests for better performance
     * @returns {Promise<Object>} The language model session
     */
    async ensureSession() {
        if (!this.globalSession) {
            console.log('PaperMind: Creating new global AI session...');
            try {
                this.globalSession = await self.ChromeAIHelper.getLanguageModel(
                    self,
                    {}, // options
                    (progress) => console.log(`Model download: ${progress}%`)
                );
                console.log('PaperMind: Global session created successfully');
            } catch (error) {
                console.error('PaperMind: Failed to create session:', error);
                this.globalSession = null;
                throw error;
            }
        }

        // Reset the timeout every time we use the session
        this.resetSessionTimeout();

        return this.globalSession;
    }

    /**
     * Reset the session timeout to auto-cleanup after inactivity
     */
    resetSessionTimeout() {
        if (this.sessionTimeout) {
            clearTimeout(this.sessionTimeout);
        }

        this.sessionTimeout = setTimeout(() => {
            console.log('PaperMind: Session timeout - cleaning up...');
            this.destroyGlobalSession();
        }, this.SESSION_TIMEOUT_MS);
    }

    /**
     * Destroy the global session to free resources
     */
    async destroyGlobalSession() {
        if (this.globalSession) {
            console.log('PaperMind: Destroying global session...');
            try {
                await self.ChromeAIHelper.destroySession(this.globalSession);
            } catch (error) {
                console.error('PaperMind: Error destroying session:', error);
            }
            this.globalSession = null;
        }

        if (this.sessionTimeout) {
            clearTimeout(this.sessionTimeout);
            this.sessionTimeout = null;
        }
    }

    /**
     * Force recreate the session (useful after errors)
     */
    async recreateSession() {
        console.log('PaperMind: Recreating session...');
        await this.destroyGlobalSession();
        return await this.ensureSession();
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
                    // Store sender info for progress updates
                    this.currentTab = sender.tab;
                    const summary = await this.analyzePaper(request.paperData);
                    sendResponse({ summary });
                    this.currentTab = null; // Clear after completion
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

    /**
     * Send progress update to the content script
     * @param {number} current - Current section number
     * @param {number} total - Total number of sections
     * @param {string} message - Status message
     */
    sendProgressUpdate(current, total, message) {
        if (this.currentTab && this.currentTab.id) {
            chrome.tabs.sendMessage(this.currentTab.id, {
                action: 'progressUpdate',
                current: current,
                total: total,
                message: message
            }).catch(err => {
                console.log('Failed to send progress update:', err);
            });
        }
    }

    async analyzePaper(paperData) {
        const cacheKey = `analysis_${paperData.url}`;

        // Check cache first
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            console.log('PaperMind: Starting paper analysis...');
            console.log('PaperData:', { title: paperData.title, sections: paperData.sections?.length });

            const paperDataChunks = this.chunkPaperData(paperData);
            const totalChunks = paperDataChunks.length;
            console.log(`PaperMind: Processing ${totalChunks} chunks...`);

            // Send initial progress
            this.sendProgressUpdate(0, totalChunks, 'Starting paper analysis...');

            let summaryHtmlList = [];

            for (let i = 0; i < paperDataChunks.length; i++) {
                const chunk = paperDataChunks[i];
                const chunkNum = i + 1;

                // Get section title for better progress messages
                const sectionTitle = chunk.sections?.[0]?.title || `Section ${chunkNum}`;

                // Send progress update at start of chunk
                this.sendProgressUpdate(
                    i,
                    totalChunks,
                    `Analyzing: ${sectionTitle}`
                );

                // Create a text-only version of the chunk (without images) for AI processing
                const textOnlyChunk = this.createTextOnlyChunk(chunk);

                console.log(`\nPaperMind: Processing chunk ${chunkNum}/${totalChunks}...`);
                console.log(`PaperMind: Section: "${sectionTitle}"`);

                // Log chunk size for debugging
                const sizeInfo = this.estimateChunkSize(textOnlyChunk);
                console.log(`PaperMind: Chunk size: ${sizeInfo.totalChars} chars (~${sizeInfo.estimatedTokens} tokens), ${sizeInfo.imageCount} images`);
                if (sizeInfo.isLarge) {
                    console.warn(`⚠️ PaperMind: Large chunk detected (${sizeInfo.totalChars} chars) - may hit token limits`);
                }

                try {
                    const analysisPrompt = self.Prompts.analyzePaper(textOnlyChunk);

                    // Use the updated callPromptAPI that uses global session
                    let sectionHtml = await this.callPromptAPI(analysisPrompt);

                    // Clean up markdown code block wrappers
                    sectionHtml = this.cleanupHtmlString(sectionHtml);

                    // Inject images into the generated HTML
                    sectionHtml = this.injectImagesIntoHtml(sectionHtml, chunk);

                    console.log(`PaperMind: Chunk ${chunkNum} processed successfully (${sectionHtml.length} chars)`);
                    summaryHtmlList.push(sectionHtml);

                    // Send progress update after chunk completion
                    this.sendProgressUpdate(
                        chunkNum,
                        totalChunks,
                        `Completed: ${sectionTitle}`
                    );

                } catch (chunkError) {
                    console.error(`PaperMind: Error processing chunk ${i + 1}:`, chunkError);

                    // If a chunk is too large, create a fallback HTML for that section
                    const fallbackHtml = `
                        <section class="paper-chunk error-chunk" data-section-title="${chunk.sections?.[0]?.title || 'Section'}">
                            <header>
                                <h3>${chunk.sections?.[0]?.title || 'Section'}</h3>
                            </header>
                            <div class="essentials">
                                <p class="error-message">⚠️ This section was too large to process. ${chunkError.message}</p>
                                <details>
                                    <summary>View original text</summary>
                                    <p>${chunk.sections?.[0]?.text?.substring(0, 1000) || 'No text available'}...</p>
                                </details>
                            </div>
                        </section>
                    `;
                    summaryHtmlList.push(fallbackHtml);

                    // Continue with next chunk instead of failing completely
                    continue;
                }
            }

            // Send final progress update
            this.sendProgressUpdate(totalChunks, totalChunks, 'Analysis complete! Rendering...');

            // Cache the result
            this.cache.set(cacheKey, summaryHtmlList);
            return summaryHtmlList;

        } catch (error) {
            console.error('PaperMind: Error analyzing paper:', error);
            return this.generateFallbackSummary(paperData);
        }
    }

    async callPromptAPI(prompt, retryCount = 0) {
        const MAX_RETRIES = 2;

        try {
            console.log('PaperMind: Calling Chrome AI with prompt:', prompt.substring(0, 100) + '...');
            console.log(`PaperMind: Prompt size: ${prompt.length} characters`);

            // Check if Chrome AI is available
            if (!self.ChromeAIHelper.isLanguageModelAvailable(self)) {
                console.warn('Chrome AI not available, using fallback');
                return await this.callFallbackAI(prompt);
            }

            // Use the global session instead of creating new ones each time
            const session = await this.ensureSession();
            const response = await self.ChromeAIHelper.callPromptAPI(session, prompt);

            return response;

        } catch (error) {
            console.error('Chrome AI error:', error);

            // For other errors, try recreating the session once
            if (retryCount < MAX_RETRIES) {
                console.log(`PaperMind: Retrying with fresh session (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
                await this.recreateSession();
                return await this.callPromptAPI(prompt, retryCount + 1);
            }

            // After retries exhausted, use fallback
            console.warn('PaperMind: All retries exhausted, using fallback');
            throw new Error('error calling chrome');
        }
    }

    async summarizeWithChromeAI(text, options = {}) {
        /**
         * Use Chrome's Summarizer API for efficient text summarization
         * This is more optimized than the general language model for summaries
         */
        try {
            const ai = self.ai || chrome.aiOriginTrial?.summarizer;

            if (!ai?.summarizer) {
                console.warn('Summarizer API not available');
                return null;
            }

            // Check summarizer capabilities
            const canSummarize = await ai.summarizer.capabilities();

            if (canSummarize.available === "no") {
                console.warn('Summarizer not available');
                return null;
            }

            // Create summarizer with options
            const summarizer = await ai.summarizer.create({
                type: options.type || "tl;dr", // Options: "tl;dr", "key-points", "teaser", "headline"
                format: options.format || "markdown",
                length: options.length || "medium" // Options: "short", "medium", "long"
            });

            // Generate summary
            const summary = await summarizer.summarize(text);

            // Clean up
            await summarizer.destroy();
            console.log('Summarizer summary:', summary);
            return summary;

        } catch (error) {
            console.error('Summarizer error:', error);
            return null;
        }
    }

    async askQuestion(question, paperData) {
        const cacheKey = `question_${question}_${paperData.url}`;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const questionPrompt = self.Prompts.askQuestion(question, paperData);
            const answer = await this.callPromptAPI(questionPrompt);

            this.cache.set(cacheKey, answer);
            return answer;

        } catch (error) {
            console.error('Error answering question:', error);
            return "I'm sorry, I couldn't process your question at this time. Please try again.";
        }
    }

    async processText(prompt, text) {
        try {
            const fullPrompt = self.Prompts.processText(prompt, text);
            const result = await this.callPromptAPI(fullPrompt);
            return result;
        } catch (error) {
            console.error('Error processing text:', error);
            return "I'm sorry, I couldn't process that text at this time.";
        }
    }

    async generateDiagram(concept, paperData) {
        try {
            const diagramPrompt = self.Prompts.generateDiagram(concept, paperData);
            const diagram = await this.callPromptAPI(diagramPrompt);
            return diagram;
        } catch (error) {
            console.error('Error generating diagram:', error);
            return null;
        }
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

// Cleanup when service worker is about to be terminated
// Note: Chrome service workers are terminated after ~30 seconds of inactivity
// The session timeout (5 minutes) handles most cleanup, but this is a safety net
if (typeof chrome !== 'undefined' && chrome.runtime) {
    // Listen for extension being suspended
    chrome.runtime.onSuspend?.addListener(() => {
        console.log('PaperMind: Service worker suspending, cleaning up...');
        paperMindAI.destroyGlobalSession();
    });
}

// Also cleanup on unload (for testing in dev mode)
self.addEventListener('beforeunload', () => {
    console.log('PaperMind: Service worker unloading, cleaning up...');
    paperMindAI.destroyGlobalSession();
});
