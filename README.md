# PaperMind - AI Research Assistant

🧠 **PaperMind** is a powerful Google Chrome extension that transforms dense research papers into interactive summaries using Chrome's built-in AI capabilities. Built with Chrome's Prompt API, Summarizer API, and other AI services, it makes complex academic work accessible and engaging.

## ✨ Features

### 📄 Section-by-Section Paper Enhancement
- **AI-Powered Analysis**: Each section is analyzed individually, creating structured "Essentials" (8-15 key bullets) and "Details" (5-10 in-depth items)
- **Preserved Content**: All images, tables, and figures from the original paper are maintained in the enhanced view
- **LaTeX Equations**: Mathematical formulas are properly rendered using MathJax with correct LaTeX notation
- **View Toggle**: Seamlessly switch between the original paper and the AI-enhanced structured view

### 🎯 Smart Text Highlighting & Explanations
- **Custom Prompts**: Highlight any text and get AI explanations with customizable prompts
- **Editable Key Points**: AI extracts key points from explanations, which you can edit before saving
- **Follow-up Questions**: Ask contextual follow-up questions about highlighted content
- **Knowledge Panel**: Floating panel displays explanations near your selection for easy reference

### 📝 Study Notes System
- **Save Explanations**: Save highlighted text explanations with editable key points
- **Attach Images & Tables**: When you highlight image/table captions, the visual content is saved with your note
- **Per-Paper Organization**: Notes are automatically organized by paper
- **Expandable Notes**: Long notes collapse to previews; click to expand full content
- **Download Notes**: Export all notes for a paper in a readable format

### 🌐 Translation Feature
- **Full Analysis Translation**: Translate the entire enhanced paper analysis to 12+ languages
- **Multi-Language Support**: English, Spanish, French, German, Italian, Portuguese, Chinese, Japanese, Korean, Russian, Arabic, Hindi
- **Chrome Translator API**: Uses Chrome's built-in translation for privacy and offline capability

### ⚡ Quick Summary Generation
- **Instant Overview**: Generate concise summaries of the entire paper for quick understanding
- **Paper Abstracts**: Get AI-generated summaries focusing on key contributions and findings

### 🔧 Advanced Features
- **ADHD-Friendly Mode**: Section-by-section reading mode to improve focus and comprehension
- **Multi-Site Support**: Works on arXiv, Nature, Science, Springer, IEEE, ACM, Google Scholar
- **Recent Papers**: Track and revisit previously analyzed papers
- **Privacy-First**: All processing done locally using Chrome's built-in AI (Gemini Nano)
- **Persistent Settings**: Auto-analyze, highlight mode, ADHD mode, and language preferences

## 🚀 Installation

### Prerequisites

**Required**:
- **Chrome Canary or Chrome Dev** (version 128+)
  - Download: [Chrome Canary](https://www.google.com/chrome/canary/)
- **Chrome Built-in AI Features Enabled**:
  - Navigate to `chrome://flags/#optimization-guide-on-device-model`
  - Set to "Enabled BypassPerfRequirement"
  - Navigate to `chrome://flags/#prompt-api-for-gemini-nano`
  - Set to "Enabled"
  - Navigate to `chrome://flags/#translation-api` (for translation feature)
  - Set to "Enabled"
  - Restart Chrome
- **First-time Setup**: Chrome will download AI models (Gemini Nano) on first use
  - Gemini Nano: ~1.5GB download
  - Translation models: ~100-200MB per language pair

**Recommended**:
- Internet connection for initial model downloads (subsequent use works offline)
- At least 4GB free disk space for AI models

### Setup Instructions

1. **Download the Extension**
   ```bash
   git clone https://github.com/your-repo/papermind.git
   cd papermind
   ```

2. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked" and select the papermind folder
   - The PaperMind icon should appear in your Chrome toolbar

3. **Verify AI is Working**
   - Navigate to a test paper (e.g., https://arxiv.org/abs/2301.00001)
   - Look for the PaperMind floating button
   - Click "Analyze Paper" - first use may trigger model download
   - Wait for progress indicator showing model download percentage

4. **Configure Settings (Optional)**
   - Click the PaperMind icon in your toolbar
   - Click "Settings" to configure preferences
   - Enable ADHD mode, set language, etc.

## 📖 Usage Guide

### Basic Workflow

1. **Navigate to a Research Paper**
   - Visit any supported academic site (arXiv recommended for full features)
   - The PaperMind floating button (logo) will automatically appear in the bottom-right corner

2. **Analyze the Paper (Section-by-Section)**
   - Click or hover over the PaperMind button to open the expandable panel
   - Click "Analyze Paper" button
   - **Wait patiently**: Each section takes 5-15 seconds to process
   - Monitor the progress bar showing which section is being analyzed
   - For a 10-section paper, expect 2-5 minutes total processing time

3. **Explore the Enhanced Paper**
   - The original paper is now enhanced with structured AI analysis
   - Each section shows "Essentials" (key bullets) and expandable "Details"
   - Images, tables, and LaTeX equations are preserved and properly rendered
   - Use the view toggle switch to switch between Original and Enhanced views

### Working with Text Highlights

1. **Get AI Explanations**
   - Select any text in the paper (minimum 10 characters)
   - Click "Explain this" in the context menu
   - Choose a pre-defined prompt or enter a custom question
   - Wait 10-20 seconds for the AI explanation
   - The Knowledge Panel appears with the full explanation and key points

2. **Save to Study Notes**
   - After getting an explanation, edit the key points if desired
   - Click "Save to Notes" to save the explanation with key points
   - For images/tables: Highlight the caption and save to attach the visual to your note
   - View all notes in the expandable panel's "Study Notes" section

3. **Ask Follow-up Questions**
   - In the Knowledge Panel, click "Ask Follow-up"
   - Enter your follow-up question about the same text
   - Get contextual answers building on the previous explanation

### Translation

1. **Translate Enhanced Analysis**
   - After analyzing the paper, click the 🌐 globe icon in the panel header
   - Select your target language from the dropdown
   - Wait as each section is translated (5-10 seconds per section)
   - The enhanced view updates with translated content

2. **Supported Languages**
   - English, Spanish, French, German, Italian, Portuguese
   - Chinese, Japanese, Korean, Russian, Arabic, Hindi

### Managing Study Notes

1. **View Notes**
   - All notes for the current paper appear in the expandable panel
   - Long notes show a preview; click "Show more" to expand
   - Notes with images/tables display the visual content directly

2. **Download Notes**
   - Click the download button (↓) in the Study Notes section
   - All notes for the paper are exported in a readable format

### Settings & Customization

1. **Open Extension Popup**
   - Click the PaperMind extension icon in Chrome toolbar
   - View current paper info and recent papers

2. **Configure Settings**
   - Click "Settings" button in the popup
   - Toggle ADHD-friendly mode for section-by-section reading
   - Set default language for the extension
   - Enable/disable auto-analyze and highlight mode
   - All settings are saved automatically

## 🧪 Testing Instructions

> **⚠️ IMPORTANT**: All LLM operations are SLOW. Each AI call takes 5-30 seconds. Please be patient during testing.

### Prerequisites for Testing

Before testing PaperMind, ensure you have:

1. **Chrome Canary or Dev Channel** with built-in AI features enabled
   - Download from [Google Chrome Canary](https://www.google.com/chrome/canary/)
   - Enable Chrome AI flags (see Installation section above)

2. **Test Paper**
   - Recommended: An arXiv paper (e.g., https://arxiv.org/abs/2301.00001)
   - arXiv provides the best experience with full HTML papers, images, and LaTeX

3. **Patience**
   - LLM calls are slow: 5-30 seconds per operation
   - Full paper analysis: 2-5 minutes for typical papers
   - Translation: 5-10 seconds per section

### Test 1: Paper Detection & UI

**Objective**: Verify PaperMind detects papers and shows UI correctly

**Steps**:
1. Navigate to an arXiv paper (e.g., https://arxiv.org/abs/2301.00001)
2. Look for the PaperMind floating button in the bottom-right corner
3. Hover over the button to see the expandable panel
4. Verify the panel shows:
   - PaperMind logo and title
   - "Analyze Paper" button
   - "Generate Summary" button
   - "Study Notes" section (empty initially)

**Expected Result**: ✅ Button appears, panel expands on hover, all UI elements visible

**Troubleshooting**: If button doesn't appear, check that you're on a supported site (arXiv, Nature, etc.)

### Test 2: Section-by-Section Paper Analysis

**Objective**: Test the core paper analysis feature

**Duration**: ⏱️ SLOW - 2-5 minutes for a typical 10-section paper

**Steps**:
1. Click the "Analyze Paper" button in the expandable panel
2. Observe the progress section that appears:
   - Progress bar fills gradually
   - Status message shows which section is being processed
   - Progress percentage updates (e.g., "3 / 10 sections")
   - Shows "AI: Gemini Nano" and "Private"
3. **Wait patiently**: Each section takes 5-15 seconds
4. Once complete, scroll through the paper

**Expected Result**: ✅ After analysis:
- Each section shows enhanced content
- "Essentials" section with 8-15 structured bullet points (each with **bold label** + explanation)
- Collapsible "Details" section with 5-10 in-depth items
- All original images and tables are preserved
- LaTeX equations render properly with MathJax
- View toggle switch appears in the panel header

**Verification Checklist**:
- [ ] Progress bar shows accurate progress
- [ ] Each section has structured "Essentials" bullets
- [ ] Details sections are collapsible (click "Details" to expand)
- [ ] Images from original paper are present
- [ ] Math equations render correctly
- [ ] View toggle switch is visible

**Troubleshooting**:
- If stuck on one section: LLM may be slow, wait 30+ seconds
- If analysis fails: Check Chrome console for errors, try reloading

### Test 3: View Toggle (Original ↔ Enhanced)

**Objective**: Test switching between original and enhanced views

**Steps**:
1. After analyzing a paper (Test 2), locate the view toggle switch in the panel header
2. Note it shows "Enhanced" and the checkbox is checked
3. Click the toggle switch
4. Observe the paper switches to original view
5. Toggle label changes to "Original"
6. Click toggle again to switch back to enhanced view

**Expected Result**: ✅ Smooth transition between views without losing data

### Test 4: Text Highlighting & AI Explanations

**Objective**: Test the highlight-and-explain feature

**Duration**: ⏱️ SLOW - 10-20 seconds per explanation

**Steps**:
1. In the paper, select at least 10 characters of text (try selecting a complex sentence or paragraph)
2. Verify context menu appears with "Explain this" option
3. Click "Explain this"
4. A dialog appears with prompt options
5. Choose "Explain with background knowledge" or enter a custom prompt
6. Click "Generate"
7. **Wait 10-20 seconds** for the Knowledge Panel to appear

**Expected Result**: ✅ Knowledge Panel appears with:
- Selected text preview (truncated to 100 chars)
- Full AI explanation (multiple paragraphs)
- Key points section (3-5 bullet points)
- Key points are editable (click to edit)
- "Ask Follow-up" button
- "Save to Notes" button

**Verification Checklist**:
- [ ] Context menu appears on text selection
- [ ] Custom prompts work
- [ ] Knowledge Panel appears near selection
- [ ] Key points can be edited before saving
- [ ] Panel is draggable by header

**Troubleshooting**:
- If context menu doesn't appear: Selection may be too short (min 10 chars)
- If explanation is slow: Wait up to 30 seconds

### Test 5: Follow-up Questions

**Objective**: Test contextual follow-up questions

**Duration**: ⏱️ SLOW - 10-20 seconds per follow-up

**Steps**:
1. After getting an explanation (Test 4), click "Ask Follow-up" in the Knowledge Panel
2. A text input appears
3. Enter a follow-up question (e.g., "Can you explain this in simpler terms?")
4. Click "Ask →"
5. **Wait 10-20 seconds** for the answer

**Expected Result**: ✅ New explanation appears in the Knowledge Panel, contextually aware of the previous explanation

**Verification**:
- [ ] Follow-up answer builds on previous context
- [ ] "← Back" button returns to previous explanation

### Test 6: Study Notes - Save & View

**Objective**: Test the study notes system

**Steps**:
1. After getting an explanation (Test 4), edit the key points if desired
2. Click "Save to Notes"
3. Verify notification appears: "Saved to study notes ✓"
4. Open the expandable panel (click PaperMind button)
5. Scroll to "Study Notes" section
6. Verify your note appears with:
   - Badge showing the prompt type
   - Selected text preview
   - Key points or explanation preview
   - Timestamp
   - Edit (✏️) and Delete (×) buttons

**Expected Result**: ✅ Note is saved and appears in Study Notes section

**Verification Checklist**:
- [ ] Note appears immediately after saving
- [ ] Notes are organized by current paper
- [ ] Long notes show "Show more" button
- [ ] Clicking "Show more" expands full content

### Test 7: Study Notes - Images & Tables

**Objective**: Test attaching images/tables to notes

**Steps**:
1. Find an image or table in the paper
2. Highlight the image caption or table caption (at least 10 chars)
3. Click "Explain this" and generate an explanation
4. Save to notes
5. Open the Study Notes section in the panel
6. Find the saved note

**Expected Result**: ✅ Note displays with:
- The caption text
- The actual image or table rendered inline
- No "Explanation" section (just caption + visual)

**Verification**:
- [ ] Image appears in the note
- [ ] Image is clear and properly sized
- [ ] Table renders correctly if a table caption was selected

### Test 8: Study Notes - Download

**Objective**: Test exporting notes

**Steps**:
1. Save 2-3 notes for the current paper (mix of text explanations and image notes)
2. In the Study Notes section, click the download button (↓)
3. A file downloads

**Expected Result**: ✅ Downloaded file contains all notes in a readable format with timestamps

### Test 9: Quick Summary Generation

**Objective**: Test the summary feature

**Duration**: ⏱️ SLOW - 15-30 seconds

**Steps**:
1. Open the expandable panel
2. Click "Generate Summary" button
3. **Wait 15-30 seconds**
4. Summary appears in a panel or notification

**Expected Result**: ✅ Concise summary of the paper's key contributions and findings

**Note**: This feature may generate a summary panel. Check the implementation.

### Test 10: Translation

**Objective**: Test translating the enhanced analysis

**Duration**: ⏱️ SLOW - 5-10 seconds per section (multiply by number of sections)

**Prerequisites**: Must complete Test 2 (paper analysis) first

**Steps**:
1. After analyzing a paper, locate the 🌐 globe icon in the panel header
2. Click the globe icon
3. A language dropdown appears
4. Select a language (e.g., "Spanish")
5. **Wait 5-10 seconds per section** as translation progresses
6. Observe sections updating with translated content

**Expected Result**: ✅ Each section's "Essentials" and "Details" are translated to the target language

**Verification Checklist**:
- [ ] Dropdown shows 12+ languages
- [ ] Translation preserves formatting
- [ ] LaTeX equations remain unchanged
- [ ] Images and tables remain unchanged
- [ ] Can translate back to English

**Note**: First translation may require downloading the translation model.

### Test 11: Extension Popup & Settings

**Objective**: Test the extension popup and settings

**Steps**:
1. Click the PaperMind extension icon in Chrome toolbar
2. Verify popup shows:
   - Current paper title and URL (if on a paper page)
   - "Analyze Paper" button (enabled if on a paper page)
   - "Settings" button
   - Recent papers list (if you've analyzed papers)
3. Click "Settings"
4. Settings modal appears with options:
   - Auto-analyze papers when detected (checkbox)
   - Enable highlight mode (checkbox)
   - Enable ADHD-friendly mode (checkbox)
   - Analysis Language (dropdown)
5. Toggle ADHD mode ON
6. Click "Save"
7. Verify notification: "Settings saved successfully!"

**Expected Result**: ✅ Settings save and persist across browser sessions

**Verification**:
- [ ] Popup shows correct current paper info
- [ ] Settings modal opens and closes properly
- [ ] All settings options are visible
- [ ] Settings persist after closing and reopening

### Test 12: Recent Papers

**Objective**: Test the recent papers tracking

**Steps**:
1. Analyze 2-3 different papers on arXiv
2. Click the PaperMind extension icon in Chrome toolbar
3. Scroll to "Recent Papers" section
4. Verify all analyzed papers appear in the list
5. Click on a recent paper

**Expected Result**: ✅ Recent papers list updates, clicking a paper navigates to that URL

**Verification**:
- [ ] Up to 10 recent papers are shown
- [ ] Most recent appears first
- [ ] Clicking a paper opens it in a new tab or current tab

### Test 13: ADHD-Friendly Mode

**Objective**: Test section-by-section reading mode

**Prerequisites**: Enable ADHD mode in settings (Test 11)

**Steps**:
1. Enable ADHD mode in settings
2. Analyze a paper or reload an analyzed paper
3. Observe the behavior (implementation may vary)

**Expected Result**: ✅ Paper sections are presented one at a time for focused reading

**Note**: Verify the actual implementation of ADHD mode in the codebase to determine exact behavior.

### Performance Notes

**Expected Timing**:
- **Paper Analysis**: 2-5 minutes (10-section paper × 5-15 seconds each)
- **Text Explanation**: 10-20 seconds
- **Follow-up Question**: 10-20 seconds
- **Summary Generation**: 15-30 seconds
- **Translation**: 5-10 seconds per section

**First-Time Use**:
- Chrome may need to download AI models (Gemini Nano, Translator models)
- Download progress shown during first use
- Subsequent uses are faster (models cached)

**Troubleshooting Common Issues**:

1. **Analysis stuck or very slow**:
   - LLM may be slow; wait 30-60 seconds
   - Check Chrome console for errors
   - Try reloading the page and starting over

2. **Text highlighting not working**:
   - Ensure selection is at least 10 characters
   - Try selecting text outside of the enhanced sections

3. **Translation not available**:
   - May require Chrome Canary/Dev with translation API enabled
   - First use requires model download

4. **Notes not saving**:
   - Check Chrome storage permissions
   - Try clearing extension storage and retrying

## 🛠️ Technical Architecture

### Core Components

```
PaperMind/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for AI processing
├── chromeAIHelper.js     # Shared Chrome AI utility functions
├── content.js            # Content script for page interaction
├── content.css           # Styling for injected UI
├── popup.html           # Extension popup interface
├── popup.js             # Popup functionality
├── popup.css            # Popup styling
└── icons/               # Extension icons
```

### Chrome AI Helper

The `chromeAIHelper.js` module provides a unified interface for calling Chrome's built-in Language Model API. It can be used in both background service workers and content scripts.

**Key Features:**
- Automatic session management
- Progress monitoring for model downloads
- JSON response parsing
- Error handling and fallbacks
- Context-aware (works in both service workers and content scripts)

**Usage:** See [CHROME_AI_HELPER_USAGE.md](CHROME_AI_HELPER_USAGE.md) for detailed documentation.

### AI Integration

PaperMind uses Chrome's built-in AI APIs for local, privacy-first processing:

- **Chrome Prompt API (Language Model)**: Used for paper analysis and text explanations
  - Section-by-section paper enhancement with structured output
  - Text highlighting explanations with custom prompts
  - Follow-up question answering
  - Quick summary generation
  - Powered by Gemini Nano (runs locally in Chrome)

- **Chrome Translator API**: Used for multi-language translation
  - Translate entire enhanced analyses to 12+ languages
  - Supports English, Spanish, French, German, Italian, Portuguese, Chinese, Japanese, Korean, Russian, Arabic, Hindi
  - Preserves formatting, equations, and structure
  - Works offline after model download
  - Privacy-first: all translation happens locally

- **MathJax 3**: For rendering LaTeX equations
  - Converts LaTeX notation to properly formatted mathematical expressions
  - Supports inline math `\(...\)` and display math `\[...\]`
  - Ensures equations from papers render beautifully in enhanced view

- **Chrome Storage API**: For persistent data
  - Study notes organized by paper
  - User settings and preferences
  - Recent papers history
  - Cached analysis results

### Processing Architecture

**Section-by-Section Chunking**:
- Large papers are split into manageable chunks (sections)
- Each section is analyzed independently for better quality and reliability
- Progress tracking shows which section is currently being processed
- Allows for large papers (20+ sections) without context limits

**Prompt Engineering**:
- Specialized prompts for different tasks (analysis, explanation, translation)
- System prompts ensure structured, consistent output
- Prompts are centralized in `prompts.js` for easy customization

### Supported Sites

- **arXiv.org**: Preprints and research papers
- **Google Scholar**: Academic search results
- **Nature.com**: Scientific publications
- **Science.org**: Research articles
- **Springer**: Academic journals
- **IEEE Xplore**: Technical papers
- **ACM Digital Library**: Computer science papers

## 🔧 Configuration

### Settings Options

Access settings by clicking the PaperMind extension icon → Settings button.

| Setting | Description | Default |
|---------|-------------|---------|
| Auto-analyze | Automatically analyze papers when detected on page load | ✅ Enabled |
| Highlight Mode | Enable text highlighting features for explanations | ✅ Enabled |
| ADHD-Friendly Mode | Section-by-section reading mode for better focus | ❌ Disabled |
| Analysis Language | Language for the paper content (used for translation) | English |

All settings are saved automatically and persist across browser sessions.

### Customization

- **Settings UI**: Access via the extension popup (click PaperMind icon in toolbar)
- **Advanced**: Modify `prompts.js` to customize AI prompts for different analysis styles
- **Styling**: Edit `content.css` and style files in `styles/` folder to customize the appearance

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-repo/papermind.git
   cd papermind
   ```

2. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the papermind folder

3. **Make Changes**
   - Edit files directly (no build process required)
   - After making changes, click the reload icon on the extension card in `chrome://extensions/`
   - Refresh the paper page to see changes

4. **Key Files to Know**
   - `content.js` - Main content script, paper detection and UI
   - `background.js` - Service worker, AI processing logic
   - `prompts.js` - All AI prompts (customize here for different analysis styles)
   - `chromeAIHelper.js` - Chrome AI API wrapper
   - `translatorHelper.js` - Chrome Translator API wrapper
   - `content.css` - Styles for injected UI elements
   - `styles/` - Additional CSS files for enhanced paper view

### Testing

Follow the comprehensive testing instructions in the "Testing Instructions" section above.

For debugging:
- Open Chrome DevTools on the paper page to see content script logs
- Open DevTools on the extension popup to see popup logs
- Check `chrome://extensions/` → PaperMind → "Errors" for background script logs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Chrome's built-in AI team for the powerful APIs
- The academic community for feedback and suggestions
- Open source contributors who made this possible

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/papermind/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/papermind/discussions)
- **Email**: support@papermind.ai

## ⚡ Performance & Limitations

### Processing Speed

PaperMind uses Chrome's built-in AI (Gemini Nano) which runs locally but is **slower than cloud-based AI**:

- **Paper Analysis**: 2-5 minutes for typical papers (10 sections)
- **Text Explanations**: 10-20 seconds per explanation
- **Translations**: 5-10 seconds per section
- **First Use**: May require downloading AI models (1.5GB+ for Gemini Nano)

**Why so slow?**
- On-device AI models are optimized for privacy and offline use, not speed
- Quality of analysis is prioritized over speed
- No data sent to external servers

### Limitations

- **Supported Sites**: Currently works best on arXiv; other sites may have limited support
- **Paper Format**: HTML papers work best; PDF-only sites may not be supported
- **Large Papers**: Very long papers (30+ sections) may take 5-10+ minutes to analyze
- **Browser Requirements**: Requires Chrome Canary/Dev with AI flags enabled
- **Model Availability**: Chrome's built-in AI is experimental and may not be available on all systems

### Tips for Best Performance

1. **Use arXiv papers** for the best experience (full HTML, images, LaTeX)
2. **Be patient** - grab a coffee while analyzing long papers
3. **Analyze in batches** - analyze sections of interest rather than the whole paper
4. **Cache**: Re-visiting analyzed papers loads from cache (instant)

## 🔮 Roadmap

### Current Features (v1.0.0)
- ✅ Section-by-section paper enhancement with structured Essentials & Details
- ✅ Smart text highlighting with AI explanations
- ✅ Study notes system with image/table attachments
- ✅ Translation to 12+ languages
- ✅ View toggle (Original ↔ Enhanced)
- ✅ ADHD-friendly mode
- ✅ Multi-site support (arXiv, Nature, Science, etc.)

### Upcoming Features
- [ ] Batch paper comparison and analysis
- [ ] Citation network visualization
- [ ] Export notes to Markdown, PDF, or Notion
- [ ] Integration with reference managers (Zotero, Mendeley)
- [ ] Collaborative annotations with sharing
- [ ] Custom AI prompts library
- [ ] Paper recommendation based on reading history
- [ ] Mobile/tablet support

---

**Made with ❤️ for the research community**

Transform your research experience with PaperMind - where complex papers become accessible insights.
