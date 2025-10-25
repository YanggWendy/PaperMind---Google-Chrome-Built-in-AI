// Chrome AI Translator Helper
// Wrapper for Chrome's built-in Translation API
// Can be used in both background service workers and content scripts

/**
 * Check if Chrome AI Translator is available
 * @param {Object} context - The context object (self for service worker, window for content script)
 * @returns {Promise<Object>} Availability info
 */
async function isTranslatorAvailable(context = self) {
    try {
        // Check if Translator API exists
        if (!('Translator' in context)) {
            return { available: false, reason: 'Translator API not found in context' };
        }

        return { available: true };
    } catch (error) {
        console.error('Chrome Translator Helper: Error checking availability:', error);
        return { available: false, reason: error.message };
    }
}

/**
 * Check if translation between specific languages is supported
 * @param {Object} context - The context object (self for service worker, window for content script)
 * @param {string} sourceLanguage - Source language code (e.g., 'en')
 * @param {string} targetLanguage - Target language code (e.g., 'es')
 * @returns {Promise<Object>} Capability info with 'available' status
 */
async function canTranslate(context = self, sourceLanguage, targetLanguage) {
    try {
        // Check if Translator API exists
        if (!('Translator' in context)) {
            return { available: 'no', reason: 'Translator API not available' };
        }

        // Check if this language pair is supported
        const capability = await context.Translator.availability({
            sourceLanguage: sourceLanguage,
            targetLanguage: targetLanguage
        });

        console.log(`Chrome Translator Helper: Can translate ${sourceLanguage} → ${targetLanguage}:`, capability);
        return capability;

    } catch (error) {
        console.error('Chrome Translator Helper: Error checking translation capability:', error);
        return { available: 'no', reason: error.message };
    }
}

/**
 * Create a translator session for a specific language pair
 * @param {Object} context - The context object (self for service worker, window for content script)
 * @param {string} sourceLanguage - Source language code (e.g., 'en')
 * @param {string} targetLanguage - Target language code (e.g., 'es')
 * @param {Function} onProgress - Optional callback for download progress
 * @returns {Promise<Object>} A translator session
 */
async function createTranslator(context = self, sourceLanguage, targetLanguage, onProgress = null) {
    try {
        // Check if Translator API exists
        if (!('Translator' in context)) {
            throw new Error('Translator API is not available. Chrome AI may not be enabled.');
        }

        console.log(`Chrome Translator Helper: Creating translator for ${sourceLanguage} → ${targetLanguage}...`);

        // Check if this translation is supported
        const capability = await canTranslate(context, sourceLanguage, targetLanguage);
        
        if (capability === 'no') {
            throw new Error(`Translation from ${sourceLanguage} to ${targetLanguage} is not supported`);
        }

        // Configuration for translator
        const config = {
            sourceLanguage: sourceLanguage,
            targetLanguage: targetLanguage
        };

        // Add download progress monitor if callback is provided
        if (onProgress && typeof onProgress === 'function' && capability === 'after-download') {
            config.monitor = (monitor) => {
                monitor.addEventListener("downloadprogress", (e) => {
                    const progress = (e.loaded * 100).toFixed(1);
                    console.log(`Chrome Translator Helper: Download progress: ${progress}%`);
                    onProgress(progress);
                });
            };
        }

        // Create the translator using the correct API
        const translator = await context.Translator.create(config);

        console.log('Chrome Translator Helper: Translator created successfully');
        return translator;

    } catch (error) {
        console.error('Chrome Translator Helper: Error creating translator:', error);
        throw error;
    }
}

/**
 * Translate text using a translator session
 * @param {Object} translator - A translator session from createTranslator
 * @param {string} text - The text to translate
 * @returns {Promise<string>} The translated text
 */
async function translateText(translator, text) {
    try {
        if (!translator) {
            throw new Error('Translator session is not available.');
        }

        if (!text || typeof text !== 'string') {
            throw new Error('Text must be a non-empty string');
        }

        console.log('Chrome Translator Helper: Translating text:', text.substring(0, 100) + '...');

        // Translate the text
        const translatedText = await translator.translate(text);

        console.log('Chrome Translator Helper: Translation complete:', translatedText.substring(0, 200) + '...');

        return translatedText;

    } catch (error) {
        console.error('Chrome Translator Helper: Error translating text:', error);
        throw error;
    }
}

/**
 * Destroy a translator session to free resources
 * @param {Object} translator - The translator session to destroy
 * @returns {Promise<void>}
 */
async function destroyTranslator(translator) {
    try {
        if (translator && typeof translator.destroy === 'function') {
            await translator.destroy();
            console.log('Chrome Translator Helper: Translator destroyed successfully');
        }
    } catch (error) {
        console.error('Chrome Translator Helper: Error destroying translator:', error);
    }
}

/**
 * Convenience function to translate text with automatic session management
 * Creates a translator, translates the text, and cleans up automatically
 * @param {string} text - The text to translate
 * @param {string} sourceLanguage - Source language code (e.g., 'en')
 * @param {string} targetLanguage - Target language code (e.g., 'es')
 * @param {Function} onProgress - Optional callback for download progress
 * @returns {Promise<string>} The translated text
 */
async function translateTextAuto(text, sourceLanguage, targetLanguage, onProgress = null) {
    let translator = null;

    try {
        // Try to get the Translation API from the current context
        const context = typeof self !== 'undefined' ? self : window;

        // Create translator session
        translator = await createTranslator(context, sourceLanguage, targetLanguage, onProgress);

        // Translate the text
        const translatedText = await translateText(translator, text);

        // Clean up the translator
        await destroyTranslator(translator);

        return translatedText;

    } catch (error) {
        // Clean up translator on error
        if (translator) {
            await destroyTranslator(translator);
        }
        throw error;
    }
}

/**
 * Detect the language of a text (using heuristics or Chrome's API if available)
 * @param {string} text - The text to detect language from
 * @returns {Promise<string>} Detected language code
 */
async function detectLanguage(text) {
    try {
        // Chrome doesn't have a built-in language detection API yet
        // We'll use a simple heuristic based on character sets
        // This is a fallback - you might want to use the Language Model to detect language
        
        // Check for common character sets
        const hasChineseChars = /[\u4e00-\u9fff]/.test(text);
        const hasJapaneseChars = /[\u3040-\u309f\u30a0-\u30ff]/.test(text);
        const hasKoreanChars = /[\uac00-\ud7af]/.test(text);
        const hasCyrillicChars = /[\u0400-\u04ff]/.test(text);
        const hasArabicChars = /[\u0600-\u06ff]/.test(text);

        if (hasChineseChars) return 'zh';
        if (hasJapaneseChars) return 'ja';
        if (hasKoreanChars) return 'ko';
        if (hasCyrillicChars) return 'ru';
        if (hasArabicChars) return 'ar';

        // Default to English if no specific character set detected
        return 'en';

    } catch (error) {
        console.error('Error detecting language:', error);
        return 'en'; // Default to English
    }
}

/**
 * Get a list of commonly supported language codes
 * @returns {Array<Object>} Array of language objects with code and name
 */
function getSupportedLanguages() {
    return [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'it', name: 'Italian' },
        { code: 'pt', name: 'Portuguese' },
        { code: 'zh', name: 'Chinese' },
        { code: 'ja', name: 'Japanese' },
        { code: 'ko', name: 'Korean' },
        { code: 'ru', name: 'Russian' },
        { code: 'ar', name: 'Arabic' },
        { code: 'hi', name: 'Hindi' },
        { code: 'nl', name: 'Dutch' },
        { code: 'pl', name: 'Polish' },
        { code: 'tr', name: 'Turkish' },
        { code: 'vi', name: 'Vietnamese' },
        { code: 'th', name: 'Thai' },
        { code: 'id', name: 'Indonesian' },
        { code: 'sv', name: 'Swedish' },
        { code: 'no', name: 'Norwegian' },
        { code: 'da', name: 'Danish' },
        { code: 'fi', name: 'Finnish' }
    ];
}

/**
 * Test if the Translator API is working correctly
 * This is a diagnostic function to verify API availability
 * @param {Object} context - The context object (self for service worker, window for content script)
 * @returns {Promise<Object>} Test results
 */
async function testTranslatorAPI(context = self) {
    const results = {
        apiAvailable: false,
        translatorExists: false,
        canCheckAvailability: false,
        canCreate: false,
        testTranslation: null,
        error: null
    };

    try {
        // Test 1: Check if Translator exists
        results.translatorExists = 'Translator' in context;
        console.log('Test 1: Translator in context:', results.translatorExists);

        if (!results.translatorExists) {
            results.error = 'Translator API not found in context. Chrome AI features may not be enabled.';
            return results;
        }

        results.apiAvailable = true;

        // Test 2: Check availability for en->es
        try {
            const availability = await context.Translator.availability({
                sourceLanguage: 'en',
                targetLanguage: 'es'
            });
            results.canCheckAvailability = true;
            console.log('Test 2: Availability check (en->es):', availability);
        } catch (e) {
            results.error = `Availability check failed: ${e.message}`;
            console.error('Test 2 failed:', e);
            return results;
        }

        // Test 3: Try to create a translator
        try {
            const translator = await context.Translator.create({
                sourceLanguage: 'en',
                targetLanguage: 'es'
            });
            results.canCreate = true;
            console.log('Test 3: Translator created successfully');

            // Test 4: Try a simple translation
            const translated = await translator.translate('Hello');
            results.testTranslation = translated;
            console.log('Test 4: Translation test: "Hello" -> "' + translated + '"');

            // Cleanup
            if (translator.destroy) {
                await translator.destroy();
            }
        } catch (e) {
            results.error = `Translator creation/translation failed: ${e.message}`;
            console.error('Test 3/4 failed:', e);
            return results;
        }

    } catch (error) {
        results.error = error.message;
        console.error('Translator API test failed:', error);
    }

    return results;
}

// Export for use in other scripts
// This works with both ES6 modules and Chrome extension script loading
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isTranslatorAvailable,
        canTranslate,
        createTranslator,
        translateText,
        destroyTranslator,
        translateTextAuto,
        detectLanguage,
        getSupportedLanguages,
        testTranslatorAPI
    };
}

// Also expose as global for direct script loading
if (typeof window !== 'undefined') {
    window.TranslatorHelper = {
        isTranslatorAvailable,
        canTranslate,
        createTranslator,
        translateText,
        destroyTranslator,
        translateTextAuto,
        detectLanguage,
        getSupportedLanguages,
        testTranslatorAPI
    };
}

// For service workers (background scripts)
if (typeof self !== 'undefined' && typeof window === 'undefined') {
    self.TranslatorHelper = {
        isTranslatorAvailable,
        canTranslate,
        createTranslator,
        translateText,
        destroyTranslator,
        translateTextAuto,
        detectLanguage,
        getSupportedLanguages,
        testTranslatorAPI
    };
}

