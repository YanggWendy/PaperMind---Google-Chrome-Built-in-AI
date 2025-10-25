# PaperMind - AI Research Assistant

🧠 **PaperMind** is a powerful Google Chrome extension that transforms dense research papers into interactive summaries using Chrome's built-in AI capabilities. Built with Chrome's Prompt API, Summarizer API, and other AI services, it makes complex academic work accessible and engaging.

## ✨ Features

### 🤖 AI-Powered Analysis
- **Smart Summarization**: Automatically breaks down papers into digestible sections
- **Interactive Q&A**: Ask questions directly about the paper content
- **Context-Aware Responses**: Highlight text to get specific explanations
- **Multi-language Support**: Works with papers in multiple languages

### 📊 Visual Learning
- **Automatic Diagrams**: Generate visual representations of complex concepts
- **Section Breakdown**: Clear organization of paper structure
- **Key Point Extraction**: Identify and highlight important findings
- **Methodology Visualization**: Understand research approaches visually

### 🎯 Smart Highlighting
- **Text Selection**: Highlight any text for instant AI explanation
- **Contextual Questions**: Ask follow-up questions about highlighted content
- **Simplification**: Get simplified explanations of complex terms
- **🌐 Translation**: Translate highlighted text to your preferred language (12+ languages supported)

### 🔧 Advanced Features
- **Multi-Site Support**: Works on arXiv, Nature, Science, Springer, IEEE, ACM, and more
- **Recent Papers**: Track and revisit previously analyzed papers
- **Settings Customization**: Configure AI model and preferences
- **Privacy-First**: All processing done locally using Chrome's built-in AI
- **🌐 Real-Time Translation**: Translate entire analyses or selected text to 12+ languages using Chrome's built-in AI

## 🚀 Installation

### Prerequisites
- Google Chrome browser (version 88+)
- Chrome's built-in AI features enabled
- Internet connection for AI processing

### Setup Instructions

1. **Download the Extension**
   ```bash
   git clone https://github.com/your-repo/papermind.git
   cd papermind
   ```

2. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the papermind folder

3. **Configure Settings**
   - Click the PaperMind icon in your toolbar
   - Go to Settings and configure your preferences
   - Choose your preferred AI model (Gemini Nano/Pro)

## 📖 Usage Guide

### Basic Usage

1. **Navigate to a Research Paper**
   - Visit any supported academic site (arXiv, Nature, Science, etc.)
   - The PaperMind button will automatically appear

2. **Analyze the Paper**
   - Click the floating PaperMind button
   - Wait for AI analysis to complete
   - Explore the interactive summary panel

3. **Ask Questions**
   - Use the Q&A section to ask specific questions
   - Highlight text for contextual explanations
   - Generate diagrams for complex concepts

### Advanced Features

#### Text Highlighting
1. Select any text in the paper
2. Choose from context menu options:
   - 🤔 **Explain this**: Get detailed explanations
   - ✨ **Simplify**: Make complex text accessible
   - 📝 **Summarize**: Get key points

#### Diagram Generation
1. Click the "Diagram" button in the summary panel
2. Specify the concept you want visualized
3. Get AI-generated diagrams and flowcharts

#### Multi-language Support & Translation
1. **Set Default Language**: Go to Settings → Language
2. **Translate Analysis**: Click the 🌐 globe icon in the analysis panel
3. **Translate Text**: Highlight any text and click 🌐 in the context menu
4. **12+ Languages**: English, Spanish, French, German, Chinese, Japanese, and more!

For detailed translation usage, see [TRANSLATION_GUIDE.md](TRANSLATION_GUIDE.md)

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

The extension leverages Chrome's built-in AI APIs:

- **Prompt API**: For custom AI interactions
- **Summarizer API**: For paper summarization
- **Writer API**: For text generation
- **Rewriter API**: For text simplification
- **🌐 Translator API**: For multi-language support (fully implemented)
- **Proofreader API**: For text correction

**Translation Feature Highlights:**
- Translate entire paper analyses to 12+ languages
- Translate highlighted text on-demand
- Preserves formatting, equations, and structure
- Works offline after model download
- Privacy-first: all translation happens locally

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

| Setting | Description | Default |
|---------|-------------|---------|
| Auto-analyze | Automatically analyze papers when detected | ✅ |
| Highlight Mode | Enable text highlighting features | ❌ |
| AI Model | Choose between Gemini Nano/Pro | Gemini Nano |
| Language | Default language for responses | English |

### Customization

You can customize the extension behavior by modifying the settings in the popup interface or by editing the configuration files directly.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-repo/papermind.git
   cd papermind
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build the Extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Follow the installation instructions above
   - Make changes and reload the extension

### Testing

```bash
npm test
```

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

## 🔮 Roadmap

### Upcoming Features
- [ ] Batch paper analysis
- [ ] Citation network visualization
- [ ] Research trend analysis
- [ ] Collaborative annotations
- [ ] Export to various formats
- [ ] Integration with reference managers

### Version History
- **v1.0.0**: Initial release with core AI features
- **v1.1.0**: Multi-language support and diagram generation
- **v1.2.0**: Advanced highlighting and contextual Q&A

---

**Made with ❤️ for the research community**

Transform your research experience with PaperMind - where complex papers become accessible insights.
