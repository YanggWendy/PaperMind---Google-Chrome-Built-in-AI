// Chrome AI Helper
// Shared utility for calling Chrome's built-in Language Model API
// Can be used in both background service workers and content scripts

/**
 * Call Chrome's built-in Language Model with a prompt
 * @param {Object} session - A language model session (from getLanguageModel)
 * @param {string} prompt - The prompt text to send to the AI
 * @returns {Promise<Object|string>} The AI response (parsed as JSON if possible, otherwise raw text)
 */
async function callPromptAPI(session, prompt) {
    try {
        // Validate inputs
        if (!session) {
            throw new Error('Language model session is not available.');
        }

        if (!prompt || typeof prompt !== 'string') {
            throw new Error('Prompt must be a non-empty string');
        }

        console.log('Chrome AI Helper: Calling language model with prompt:', prompt.substring(0, 100) + '...');

        // Send the prompt to the AI
        const response = await session.prompt(prompt);

        console.log('Chrome AI Helper: Received response:', response.substring(0, 200) + '...');

        // Try to parse as JSON if the response looks like JSON
        if (response.trim().startsWith('{') || response.trim().startsWith('[')) {
            try {
                const parsed = JSON.parse(response);
                return parsed;
            } catch (e) {
                console.log('Chrome AI Helper: Response is not valid JSON, returning as text');
                return response;
            }
        }

        // Return the raw response if not JSON
        return response;

    } catch (error) {
        console.error('Chrome AI Helper: Error calling Chrome AI:', error);
        throw error;
    }
}

/**
 * Check if Chrome AI Language Model is available
 * @param {Object} context - The context object (self for service worker, window for content script)
 * @returns {boolean} True if LanguageModel API is available
 */
function isLanguageModelAvailable(context = self) {
    return !!(context.LanguageModel || context.ai?.languageModel);
}

/**
 * Get and initialize a Language Model session with automatic download
 * @param {Object} context - The context object (self for service worker, window for content script)
 * @param {Object} options - Optional configuration for the language model
 * @param {Function} onProgress - Optional callback for download progress
 * @returns {Promise<Object>} A ready-to-use language model session
 */
async function getLanguageModel(context = self, options = {}, onProgress = null) {
    try {
        // Get the LanguageModel API
        const LanguageModelAPI = context.LanguageModel || context.ai?.languageModel;

        if (!LanguageModelAPI) {
            throw new Error('LanguageModel API is not available. Chrome AI may not be enabled.');
        }

        console.log('Chrome AI Helper: Initializing language model...');

        // Default configuration
        const config = {
            expectedInputs: options.expectedInputs || [{ type: "text", languages: ["en"] }],
            expectedOutputs: options.expectedOutputs || [{ type: "text", languages: ["en"] }],
            ...options.additionalConfig
        };

        // Add download progress monitor if callback is provided
        if (onProgress && typeof onProgress === 'function') {
            config.monitor = (monitor) => {
                monitor.addEventListener("downloadprogress", (e) => {
                    const progress = (e.loaded * 100).toFixed(1);
                    console.log(`Chrome AI Helper: Download progress: ${progress}%`);
                    onProgress(progress);
                });
            };
        }

        // Create and download the language model session
        const session = await LanguageModelAPI.create(config);

        console.log('Chrome AI Helper: Language model session created successfully');

        return session;

    } catch (error) {
        console.error('Chrome AI Helper: Error initializing language model:', error);
        throw error;
    }
}

/**
 * Clone a language model session to create an independent copy
 * The clone inherits session parameters and initial prompts but has separate context
 * @param {Object} session - The language model session to clone
 * @returns {Promise<Object>} A new cloned session
 */
async function cloneSession(session) {
    try {
        if (!session || typeof session.clone !== 'function') {
            throw new Error('Session does not support cloning');
        }

        console.log('Chrome AI Helper: Cloning session...');
        const clonedSession = await session.clone();
        console.log('Chrome AI Helper: Session cloned successfully');
        return clonedSession;

    } catch (error) {
        console.error('Chrome AI Helper: Error cloning session:', error);
        throw error;
    }
}

/**
 * Destroy a language model session to free resources
 * @param {Object} session - The language model session to destroy
 * @returns {Promise<void>}
 */
async function destroySession(session) {
    try {
        if (session && typeof session.destroy === 'function') {
            await session.destroy();
            console.log('Chrome AI Helper: Session destroyed successfully');
        }
    } catch (error) {
        console.error('Chrome AI Helper: Error destroying session:', error);
    }
}

/**
 * Call Chrome AI with automatic context detection
 * This is a convenience function that automatically detects the context, gets the LanguageModel,
 * calls it with the prompt, and cleans up the session
 * @param {string} prompt - The prompt text to send to the AI
 * @param {Object} options - Optional configuration for the language model
 * @param {Function} onProgress - Optional callback for download progress
 * @returns {Promise<Object|string>} The AI response
 */
async function callPromptAPIAuto(prompt, options = {}, onProgress = null) {
    let session = null;

    try {
        // Try to get the LanguageModel from the current context
        const context = typeof self !== 'undefined' ? self : window;

        // Get and initialize the language model session
        session = await getLanguageModel(context, options, onProgress);

        // Call the AI with the prompt
        const response = await callPromptAPI(session, prompt);

        // Clean up the session
        await destroySession(session);

        return response;

    } catch (error) {
        // Clean up session on error
        if (session) {
            await destroySession(session);
        }
        throw error;
    }
}

// Export for use in other scripts
// This works with both ES6 modules and Chrome extension script loading
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        callPromptAPI,
        callPromptAPIAuto,
        isLanguageModelAvailable,
        getLanguageModel,
        cloneSession,
        destroySession
    };
}

// Also expose as global for direct script loading
if (typeof window !== 'undefined') {
    window.ChromeAIHelper = {
        callPromptAPI,
        callPromptAPIAuto,
        isLanguageModelAvailable,
        getLanguageModel,
        cloneSession,
        destroySession
    };
}

// For service workers (background scripts)
if (typeof self !== 'undefined' && typeof window === 'undefined') {
    self.ChromeAIHelper = {
        callPromptAPI,
        callPromptAPIAuto,
        isLanguageModelAvailable,
        getLanguageModel,
        cloneSession,
        destroySession
    };
}
