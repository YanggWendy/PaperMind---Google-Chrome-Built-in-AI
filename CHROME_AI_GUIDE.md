# Chrome Gemini Nano API Integration Guide

This guide explains how PaperMind uses Chrome's built-in Gemini Nano AI to summarize research papers.

## 🧠 Chrome's Built-in AI APIs

Chrome provides two main AI APIs for extensions:

### 1. **Prompt API (Language Model)**
- General-purpose text generation and analysis
- Access via `self.ai.languageModel` in service workers
- Access via `window.ai.languageModel` in content scripts

### 2. **Summarizer API**
- Optimized specifically for text summarization
- Access via `self.ai.summarizer` in service workers
- Access via `window.ai.summarizer` in content scripts

## 🚀 Prerequisites

To use Chrome's built-in AI, you need:

### Chrome Version Requirements
- **Chrome Canary** or **Chrome Dev** (version 128+)
- Chrome Beta/Stable (when the feature becomes stable)

### Enable AI Features

1. **Open Chrome Flags:**
   ```
   chrome://flags
   ```

2. **Enable these flags:**
   - `#optimization-guide-on-device-model`
   - `#prompt-api-for-gemini-nano`
   - `#summarization-api-for-gemini-nano`

3. **Restart Chrome**

4. **Download the AI Model:**
   - Open DevTools (F12)
   - Go to Console
   - Run:
     ```javascript
     await ai.languageModel.create()
     ```
   - This will trigger the model download (approximately 1-2 GB)

## 📝 How PaperMind Uses the APIs

### 1. Extracting Paper Content

In `content.js`, the paper content is extracted:

```javascript
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
}
```

### 2. Sending to Background for AI Processing

The content script sends data to the background service worker:

```javascript
const response = await chrome.runtime.sendMessage({
    action: 'analyzePaper',
    paperData: this.paperData
});
```

### 3. AI Processing in Background

In `background.js`, the AI processes the paper:

#### Using the Language Model API:
```javascript
async callChromeAI(prompt) {
    const ai = self.ai || chrome.aiOriginTrial?.languageModel;
    
    // Check capabilities
    const capabilities = await ai.languageModel.capabilities();
    
    if (capabilities.available === "readily") {
        // Create session with custom settings
        const session = await ai.languageModel.create({
            systemPrompt: "You are an AI specialized in research papers.",
            temperature: 0.7,
            topK: 3
        });
        
        // Generate response
        const response = await session.prompt(prompt);
        
        // Cleanup
        await session.destroy();
        
        return response;
    }
}
```

#### Using the Summarizer API:
```javascript
async summarizeWithChromeAI(text, options = {}) {
    const ai = self.ai || chrome.aiOriginTrial?.summarizer;
    
    // Check if summarizer is available
    const canSummarize = await ai.summarizer.capabilities();
    
    if (canSummarize.available === "readily") {
        // Create summarizer
        const summarizer = await ai.summarizer.create({
            type: "tl;dr",        // or "key-points", "teaser", "headline"
            format: "markdown",    // or "plain-text"
            length: "medium"       // or "short", "long"
        });
        
        // Generate summary
        const summary = await summarizer.summarize(text);
        
        // Cleanup
        await summarizer.destroy();
        
        return summary;
    }
}
```

## 🔄 API Flow

```
┌─────────────────┐
│  Content Script │
│   (content.js)  │
│                 │
│ 1. Extract      │
│    paper data   │
└────────┬────────┘
         │
         │ chrome.runtime.sendMessage()
         ▼
┌─────────────────────────┐
│  Background Service     │
│  Worker (background.js) │
│                         │
│ 2. Receive paper data   │
│ 3. Create AI session    │
│ 4. Generate summary     │
│ 5. Send response back   │
└────────┬────────────────┘
         │
         │ sendResponse()
         ▼
┌─────────────────┐
│  Content Script │
│                 │
│ 6. Display      │
│    summary      │
└─────────────────┘
```

## 🛠️ API Capabilities Check

Always check if the API is available before using it:

```javascript
// Check Language Model
const capabilities = await ai.languageModel.capabilities();

switch (capabilities.available) {
    case "readily":
        // Model is ready to use
        break;
    case "after-download":
        // Model needs to be downloaded
        console.log("Downloading model...");
        break;
    case "no":
        // Model is not available
        console.warn("AI not available");
        break;
}
```

## 📊 API Options

### Language Model Options
```javascript
const session = await ai.languageModel.create({
    systemPrompt: "Your system instruction here",
    temperature: 0.7,  // 0.0 = deterministic, 1.0 = creative
    topK: 3            // Number of tokens to consider
});
```

### Summarizer Options
```javascript
const summarizer = await ai.summarizer.create({
    type: "tl;dr",      // Summary type
    format: "markdown", // Output format
    length: "medium"    // Summary length
});
```

**Summarizer Types:**
- `tl;dr` - Too long; didn't read style summary
- `key-points` - Bullet point key takeaways
- `teaser` - Short teaser/preview
- `headline` - Single headline

**Lengths:**
- `short` - Brief summary (1-2 sentences)
- `medium` - Moderate length (3-5 sentences)
- `long` - Detailed summary (paragraph)

## 🎯 Usage Examples

### Example 1: Summarize Abstract
```javascript
// After extracting paper content
const overview = await this.summarizeWithChromeAI(paperData.abstract, {
    type: "tl;dr",
    length: "medium"
});
```

### Example 2: Answer Questions
```javascript
const prompt = `
Based on this paper, answer: "${question}"

Paper: ${paperData.title}
Abstract: ${paperData.abstract}
`;

const session = await ai.languageModel.create();
const answer = await session.prompt(prompt);
await session.destroy();
```

### Example 3: Extract Key Points
```javascript
const keyPoints = await this.summarizeWithChromeAI(paperData.abstract, {
    type: "key-points",
    format: "markdown",
    length: "long"
});
```

## ⚠️ Important Notes

### Context Limits
- Language Model: ~8,000 tokens per prompt
- Summarizer: Varies by type, typically 2,000-4,000 tokens

### Session Management
Always destroy sessions when done:
```javascript
await session.destroy();
await summarizer.destroy();
```

### Error Handling
Always wrap API calls in try-catch:
```javascript
try {
    const summary = await this.callChromeAI(prompt);
} catch (error) {
    console.error('AI Error:', error);
    // Fall back to alternative method
}
```

### Fallback Strategy
PaperMind includes fallback methods when AI is unavailable:
```javascript
if (!ai?.languageModel) {
    return await this.callFallbackAI(prompt);
}
```

## 🔍 Testing the Integration

### 1. Check AI Availability
Open DevTools Console on any page:
```javascript
// Check Language Model
console.log(await ai.languageModel.capabilities());

// Check Summarizer
console.log(await ai.summarizer.capabilities());
```

### 2. Test in Extension
1. Load the extension in Chrome
2. Visit an arXiv paper
3. Click the PaperMind button
4. Check the console for AI-related logs

### 3. Debug Logs
Look for these logs in the console:
```
✅ "Language model ready"
✅ "Generating summary..."
✅ "Summary generated successfully"

⚠️ "Chrome AI not available, using fallback"
⚠️ "Model needs to be downloaded"

❌ "AI processing failed"
```

## 📚 Additional Resources

- [Chrome AI Documentation](https://developer.chrome.com/docs/ai)
- [Prompt API Explainer](https://github.com/explainers-by-googlers/prompt-api)
- [Summarization API Explainer](https://github.com/explainers-by-googlers/summarization-api)

## 🚨 Troubleshooting

### "AI not available"
- Ensure you're using Chrome Canary/Dev
- Check that flags are enabled
- Verify model is downloaded

### "Model needs to be downloaded"
- Wait for automatic download, or
- Trigger manually via DevTools console

### "Session creation failed"
- Check context size (reduce input length)
- Verify system prompt is valid
- Try restarting Chrome

### "Quota exceeded"
- Wait a few minutes (rate limiting)
- Clear cache and retry
- Use fallback methods

## 🎉 Success Indicators

When everything works correctly:
1. ✅ AI model downloaded (~1-2 GB)
2. ✅ Flags enabled in chrome://flags
3. ✅ Extension detects research papers
4. ✅ Summaries generated in 2-5 seconds
5. ✅ Questions answered contextually
6. ✅ Diagrams suggested intelligently

---

**Note:** Chrome's built-in AI is currently in early preview. APIs may change as the feature matures.

