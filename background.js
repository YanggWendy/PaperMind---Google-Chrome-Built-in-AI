// PaperMind Background Service Worker
// Handles AI processing using Chrome's built-in AI APIs

// Import the Chrome AI helper and prompts
importScripts('chromeAIHelper.js', 'prompts.js');

class PaperMindAI {
    constructor() {
        this.setupMessageHandlers();
        this.cache = new Map();
        // Separate main sessions for different tasks
        this.sessions = {
            analysis: null,  // For paper analysis with HTML output instructions
            question: null   // For Q&A with conversational instructions
        };
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
     * Get the initial prompts for a specific session type
     * @param {string} type - Session type ('analysis' or 'question')
     * @returns {Array} Array of initial prompt objects
     */
    getInitialPrompts(type) {
        const prompts = {
            analysis: [{
                role: 'system',
                content: self.Prompts.analyzePaperSystemPrompt,
            }],
            question: [{
                role: 'system',
                content: self.Prompts.askQuestionSystemPrompt,
            }]
        };
        return prompts[type] || prompts.question;
    }

    /**
     * Get or create a main AI session with initial prompts for a specific task type
     * This main session is cloned for each individual task to keep context isolated
     * @param {string} type - Session type ('analysis' or 'question')
     * @returns {Promise<Object>} The main language model session
     */
    async ensureMainSession(type = 'analysis') {
        if (!this.sessions[type]) {
            console.log(`PaperMind: Creating new ${type} session with initial prompts...`);
            try {
                // Create main session with initial system prompt for this type
                console.log('PaperMind: Initial prompts:', this.getInitialPrompts(type));
                this.sessions[type] = await self.ChromeAIHelper.getLanguageModel(
                    self,
                    {
                        initialPrompts: this.getInitialPrompts(type)
                    },
                    (progress) => console.log(`${type} model download: ${progress}%`)
                );
                console.log(`PaperMind: ${type} session created successfully`);
            } catch (error) {
                console.error(`PaperMind: Failed to create ${type} session:`, error);
                this.sessions[type] = null;
                throw error;
            }
        }

        // Reset the timeout every time we use any session
        this.resetSessionTimeout();

        return this.sessions[type];
    }

    /**
     * Clone a main session for an isolated task
     * Each clone inherits the initial prompts but has independent context
     * @param {string} type - Session type ('analysis' or 'question')
     * @returns {Promise<Object>} A cloned language model session
     */
    async cloneSession(type = 'analysis') {
        try {
            const mainSession = await this.ensureMainSession(type);
            console.log(`PaperMind: Cloning ${type} session for isolated task...`);
            const clonedSession = await mainSession.clone();
            console.log(`PaperMind: ${type} session cloned successfully`);
            return clonedSession;
        } catch (error) {
            console.error(`PaperMind: Failed to clone ${type} session:`, error);
            throw error;
        }
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
            this.destroyMainSession();
        }, this.SESSION_TIMEOUT_MS);
    }

    /**
     * Destroy main session(s) to free resources
     * @param {string} type - Optional: specific session type to destroy ('analysis' or 'question')
     *                        If not provided, destroys all sessions
     */
    async destroyMainSession(type = null) {
        const typesToDestroy = type ? [type] : Object.keys(this.sessions);

        for (const sessionType of typesToDestroy) {
            if (this.sessions[sessionType]) {
                console.log(`PaperMind: Destroying ${sessionType} session...`);
                try {
                    await self.ChromeAIHelper.destroySession(this.sessions[sessionType]);
                } catch (error) {
                    console.error(`PaperMind: Error destroying ${sessionType} session:`, error);
                }
                this.sessions[sessionType] = null;
            }
        }

        // Only clear timeout if destroying all sessions
        if (!type && this.sessionTimeout) {
            clearTimeout(this.sessionTimeout);
            this.sessionTimeout = null;
        }
    }

    /**
     * Force recreate a main session (useful after errors)
     * @param {string} type - Session type to recreate ('analysis' or 'question')
     */
    async recreateMainSession(type = 'analysis') {
        console.log(`PaperMind: Recreating ${type} session...`);
        await this.destroyMainSession(type);
        return await this.ensureMainSession(type);
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

        // Check if ADHD mode is enabled
        const settings = await chrome.storage.sync.get(['adhdMode']);
        const adhdMode = settings.adhdMode || false;

        try {
            const startTime = performance.now();
            console.log(`PaperMind: Starting paper analysis... ${adhdMode ? '(ADHD Mode 🎯)' : ''}`);
            console.log('PaperData:', { title: paperData.title, sections: paperData.sections?.length });

            // Process 1 section per chunk in parallel
            const paperDataChunks = this.chunkPaperData(paperData, 1);
            const totalChunks = paperDataChunks.length;
            console.log(`PaperMind: Processing ${totalChunks} chunks (1 section each) in PARALLEL...`);

            // Send initial progress
            this.sendProgressUpdate(0, totalChunks, 'Starting parallel analysis...');

            // Track completed chunks for progress updates
            let completedChunks = 0;

            // 🚀 PARALLEL PROCESSING: Process all chunks simultaneously
            const chunkPromises = paperDataChunks.map(async (chunk, i) => {
                const chunkNum = i + 1;
                const sectionTitle = chunk.sections?.[0]?.title || `Section ${chunkNum}`;

                try {
                    console.log(`\nPaperMind: Starting chunk ${chunkNum}/${totalChunks}: "${sectionTitle}"`);

                    // Create a text-only version of the chunk (without images) for AI processing
                    const textOnlyChunk = this.createTextOnlyChunk(chunk);

                    // Log chunk size for debugging
                    const sizeInfo = this.estimateChunkSize(textOnlyChunk);
                    console.log(`PaperMind: Chunk ${chunkNum} size: ${sizeInfo.totalChars} chars (~${sizeInfo.estimatedTokens} tokens)`);
                    if (sizeInfo.isLarge) {
                        console.warn(`⚠️ PaperMind: Large chunk detected (${sizeInfo.totalChars} chars) - may hit token limits`);
                    }

                    // Build the analysis prompt - use ADHD prompt if mode is enabled
                    const analysisPrompt = adhdMode
                        ? self.Prompts.analyzePaperADHD(textOnlyChunk)
                        : self.Prompts.analyzePaper(textOnlyChunk);

                    // Use the analysis session for paper analysis
                    let sectionHtml = await this.callPromptAPI(analysisPrompt, 'analysis');

                    // Clean up markdown code block wrappers
                    sectionHtml = this.cleanupHtmlString(sectionHtml);

                    // Inject images into the generated HTML
                    sectionHtml = this.injectImagesIntoHtml(sectionHtml, chunk);

                    console.log(`✅ PaperMind: Chunk ${chunkNum} completed (${sectionHtml.length} chars)`);

                    // Send progress update
                    completedChunks++;
                    this.sendProgressUpdate(
                        completedChunks,
                        totalChunks,
                        `Completed ${completedChunks}/${totalChunks}: ${sectionTitle}`
                    );

                    // Return the result with its index to maintain order
                    return {
                        index: i,
                        html: sectionHtml,
                        success: true
                    };

                } catch (chunkError) {
                    console.error(`❌ PaperMind: Error processing chunk ${chunkNum}:`, chunkError);

                    // Create a fallback HTML for failed chunks
                    const fallbackHtml = `
                        <section class="paper-chunk error-chunk" data-section-title="${chunk.sections?.[0]?.title || 'Section'}">
                            <header>
                                <h3>${chunk.sections?.[0]?.title || 'Section'}</h3>
                            </header>
                            <div class="essentials">
                                <p class="error-message">⚠️ This section failed to process. ${chunkError.message}</p>
                                <details>
                                    <summary>View original text</summary>
                                    <p>${chunk.sections?.[0]?.text?.substring(0, 1000) || 'No text available'}...</p>
                                </details>
                            </div>
                        </section>
                    `;

                    // Send progress update for failed chunk
                    completedChunks++;
                    this.sendProgressUpdate(
                        completedChunks,
                        totalChunks,
                        `Error in chunk ${chunkNum}, continuing...`
                    );

                    return {
                        index: i,
                        html: fallbackHtml,
                        success: false
                    };
                }
            });

            // Wait for ALL chunks to complete in parallel
            console.log('PaperMind: Waiting for all parallel chunks to complete...');
            const results = await Promise.all(chunkPromises);

            // Sort results by index to maintain original section order
            results.sort((a, b) => a.index - b.index);

            // Extract HTML in correct order
            const summaryHtmlList = results.map(r => r.html);

            const endTime = performance.now();
            const totalTime = ((endTime - startTime) / 1000).toFixed(2);
            const avgTime = (totalTime / totalChunks).toFixed(2);
            console.log(`🎉 PaperMind: Analysis complete in ${totalTime}s (avg ${avgTime}s per chunk)`);
            console.log(`⚡ Speedup: ~${(totalChunks * 10 / totalTime).toFixed(1)}x faster than sequential!`);

            // Send final progress update
            this.sendProgressUpdate(totalChunks, totalChunks, `Complete in ${totalTime}s!`);

            // Cache the result
            this.cache.set(cacheKey, summaryHtmlList);
            return summaryHtmlList;

        } catch (error) {
            console.error('PaperMind: Error analyzing paper:', error);
            return this.generateFallbackSummary(paperData);
        }
    }

    async callPromptAPI(prompt, sessionType = 'analysis', retryCount = 0) {
        const MAX_RETRIES = 2;
        let clonedSession = null;

        try {
            console.log(`PaperMind: Calling Chrome AI (${sessionType}) with prompt:`, prompt.substring(0, 100) + '...');
            console.log(`PaperMind: Prompt size: ${prompt.length} characters`);

            // Check if Chrome AI is available
            if (!self.ChromeAIHelper.isLanguageModelAvailable(self)) {
                console.warn('Chrome AI not available, using fallback');
                return await this.callFallbackAI(prompt);
            }

            // Clone the appropriate main session for this isolated task
            // This keeps context small - only initial prompts + this one prompt
            clonedSession = await this.cloneSession(sessionType);
            const response = await self.ChromeAIHelper.callPromptAPI(clonedSession, prompt);

            // Destroy the cloned session after use to free resources
            await self.ChromeAIHelper.destroySession(clonedSession);

            return response;

        } catch (error) {
            console.error('Chrome AI error:', error);

            // Clean up cloned session on error
            if (clonedSession) {
                try {
                    await self.ChromeAIHelper.destroySession(clonedSession);
                } catch (cleanupError) {
                    console.error('Error cleaning up cloned session:', cleanupError);
                }
            }

            // For other errors, try recreating the main session once
            if (retryCount < MAX_RETRIES) {
                console.log(`PaperMind: Retrying with fresh ${sessionType} session (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
                await this.recreateMainSession(sessionType);
                return await this.callPromptAPI(prompt, sessionType, retryCount + 1);
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
            // Use the question session for Q&A tasks
            const answer = await this.callPromptAPI(questionPrompt, 'question');

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
            // Use the question session for text processing (explain, simplify, etc.)
            const result = await this.callPromptAPI(fullPrompt, 'question');
            return result;
        } catch (error) {
            console.error('Error processing text:', error);
            return "I'm sorry, I couldn't process that text at this time.";
        }
    }

    async generateDiagram(concept, paperData) {
        try {
            const diagramPrompt = self.Prompts.generateDiagram(concept, paperData);
            // Use the question session for diagram generation (explanatory task)
            const diagram = await this.callPromptAPI(diagramPrompt, 'question');
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
        paperMindAI.destroyMainSession();
    });
}

// Also cleanup on unload (for testing in dev mode)
self.addEventListener('beforeunload', () => {
    console.log('PaperMind: Service worker unloading, cleaning up...');
    paperMindAI.destroyMainSession();
});
