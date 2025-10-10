# PaperMind - Complete Installation Guide

## 📋 Prerequisites

Before installing PaperMind, ensure you have:

- **Google Chrome** browser (version 88 or higher)
- **Developer Mode** access in Chrome
- Basic understanding of Chrome extensions

## 🚀 Installation Steps

### Step 1: Prepare Your Files

First, ensure you have all the PaperMind files in a single folder. Your folder structure should look like this:

```
PaperMind---Google-Chrome-Built-in-AI/
├── manifest.json
├── background.js
├── content.js
├── content.css
├── popup.html
├── popup.js
├── popup.css
├── package.json
├── icons/
│   └── icon.svg
├── README.md
└── INSTALLATION.md
```

**Note**: If you downloaded from GitHub, extract the ZIP file to a location you can easily access (e.g., Desktop or Documents folder).

---

### Step 2: Create Extension Icons

Since Chrome requires PNG icons, let's create them:

#### Option A: Using an Online Converter
1. Go to any SVG to PNG converter (e.g., https://svgtopng.com/)
2. Upload the `icons/icon.svg` file
3. Generate PNG files in these sizes:
   - **16x16 pixels** → Save as `icon16.png`
   - **48x48 pixels** → Save as `icon48.png`
   - **128x128 pixels** → Save as `icon128.png`
4. Place all three PNG files in the `icons/` folder

#### Option B: Use a Simple Placeholder
If you want to skip this step for now, you can temporarily comment out the icons section in `manifest.json`:

```json
// Comment out these lines temporarily:
// "icons": {
//   "16": "icons/icon16.png",
//   "48": "icons/icon48.png",
//   "128": "icons/icon128.png"
// }
```

---

### Step 3: Open Chrome Extensions Page

1. **Open Google Chrome** browser
2. Type one of these in the address bar:
   - `chrome://extensions/`
   - Or click: **Menu (⋮)** → **More Tools** → **Extensions**
3. Press **Enter**

You should see the Chrome Extensions management page.

---

### Step 4: Enable Developer Mode

1. Look for the **"Developer mode"** toggle in the **top-right corner** of the Extensions page
2. Click the toggle to turn it **ON** (it should turn blue)
3. You'll see three new buttons appear:
   - **Load unpacked**
   - **Pack extension**
   - **Update**

![Developer Mode](https://developer.chrome.com/static/docs/extensions/mv3/getstarted/image/extensions-page-e0d64d89a6acf_1920.png)

---

### Step 5: Load the Extension

1. Click the **"Load unpacked"** button
2. A file browser window will open
3. Navigate to your PaperMind folder location
4. Select the **entire folder** (not individual files)
5. Click **"Select Folder"** or **"Open"**

**Important**: Make sure you select the folder that contains `manifest.json`, not a parent folder.

---

### Step 6: Verify Installation

After loading, you should see:

1. **PaperMind card** appears in your extensions list with:
   - 🧠 Extension icon (or placeholder)
   - Name: "PaperMind - AI Research Assistant"
   - Version: 1.0.0
   - Toggle switch (make sure it's ON/blue)

2. Check for any errors:
   - Look for red error messages
   - If you see errors about icons, refer back to Step 2
   - If you see permission errors, check that all files are in the correct location

---

### Step 7: Pin the Extension to Toolbar

1. Click the **Extensions puzzle icon** (🧩) in Chrome's toolbar (top-right)
2. Find **"PaperMind - AI Research Assistant"** in the list
3. Click the **pin icon** (📌) next to it
4. The PaperMind icon should now appear in your toolbar

---

### Step 8: Configure Extension Settings

1. Click the **PaperMind icon** in your toolbar
2. The popup window will open
3. Click the **"Settings"** button (⚙️)
4. Configure your preferences:

   **Recommended Settings for First Use:**
   - ✅ Auto-analyze papers when detected
   - ✅ Show diagrams for complex concepts
   - ❌ Enable highlight mode (enable after testing)
   - **AI Model**: Gemini Nano (faster for testing)
   - **Language**: Your preferred language

5. Click **"Save"** to apply settings

---

### Step 9: Test the Extension

Let's test if PaperMind works correctly:

1. **Visit a Test Paper**:
   - Open a new tab
   - Go to: https://arxiv.org/html/1706.03762v7
   - This is the "Attention Is All You Need" paper

2. **Look for the PaperMind Button**:
   - Wait for the page to fully load
   - Look for the floating 🧠 **PaperMind button** in the top-right corner of the page
   - It should have a gradient purple background

3. **Test AI Analysis**:
   - Click the floating PaperMind button
   - A side panel should slide in from the right
   - You'll see "Analyzing paper with AI..." message
   - After a few seconds, the summary should appear with:
     - 📋 Overview
     - 🎯 Key Points
     - 🔬 Methodology
     - 📊 Results
     - 💡 Implications

4. **Test Q&A Feature**:
   - Scroll down in the panel to the "🤔 Ask Questions" section
   - Type a question like: "What is the main contribution of this paper?"
   - Click **"Ask"**
   - Wait for the AI response

5. **Test Text Highlighting**:
   - Select/highlight any text in the paper
   - A context menu should appear with options:
     - 🤔 Explain this
     - ✨ Simplify
     - 📝 Summarize
   - Click any option to test

---

### Step 10: Troubleshooting Common Issues

#### ❌ Extension Not Loading

**Problem**: Error message appears when loading extension

**Solutions**:
1. Check that `manifest.json` is in the root of your folder
2. Verify all file paths in `manifest.json` are correct
3. Ensure no files are missing
4. Try reloading: Click the refresh icon on the extension card

#### ❌ PaperMind Button Not Appearing

**Problem**: Floating button doesn't show on paper pages

**Solutions**:
1. **Refresh the page** (Ctrl+R or Cmd+R)
2. Check if you're on a supported site (arXiv, Nature, Science, etc.)
3. Open Developer Console (F12) and check for errors
4. Verify extension is enabled and permissions are granted

#### ❌ AI Features Not Working

**Problem**: Analysis doesn't complete or shows errors

**Solutions**:
1. Check your internet connection
2. Verify Chrome version is 88 or higher
3. Wait a bit longer (first analysis may take time)
4. Try a different paper to rule out page-specific issues

#### ❌ Icons Not Showing

**Problem**: Extension has no icon or shows placeholder

**Solutions**:
1. Create PNG icons as described in Step 2
2. Or temporarily remove the icons section from `manifest.json`
3. Reload the extension after making changes

#### ❌ Permission Errors

**Problem**: Extension can't access certain websites

**Solutions**:
1. Check `manifest.json` has correct `host_permissions`
2. Reload the extension
3. Try reinstalling by removing and re-adding

---

## 🔧 Advanced Configuration

### Enable Chrome's Built-in AI (If Available)

If you have access to Chrome's experimental AI features:

1. Go to `chrome://flags/`
2. Search for "AI" or "Gemini"
3. Enable relevant AI flags
4. Restart Chrome
5. The extension will automatically use the enhanced AI features

### Customize Extension Behavior

You can modify the extension by editing these files:

- **`manifest.json`**: Change permissions, add more sites
- **`content.css`**: Customize the UI appearance
- **`background.js`**: Modify AI processing logic
- **`popup.html/css`**: Change popup interface design

**After any changes**:
1. Go to `chrome://extensions/`
2. Click the **refresh icon** on the PaperMind card
3. Test your changes

---

## 📱 Testing on Different Sites

Try PaperMind on these supported sites:

### arXiv.org
- URL: https://arxiv.org/abs/1706.03762
- Type: Preprints and research papers
- Status: ✅ Full support

### Nature.com
- URL: https://www.nature.com/articles/
- Type: Scientific publications
- Status: ✅ Full support

### Science.org
- URL: https://www.science.org/
- Type: Research articles
- Status: ✅ Full support

### Google Scholar
- URL: https://scholar.google.com/
- Type: Academic search
- Status: ✅ Full support

---

## 🎯 Quick Start Checklist

Use this checklist to ensure proper installation:

- [ ] Downloaded/cloned PaperMind folder
- [ ] All files present in folder
- [ ] Created PNG icons (or commented out icon references)
- [ ] Opened `chrome://extensions/`
- [ ] Enabled Developer Mode
- [ ] Loaded unpacked extension
- [ ] No error messages showing
- [ ] Extension toggle is ON
- [ ] Pinned extension to toolbar
- [ ] Configured settings in popup
- [ ] Tested on arxiv.org paper
- [ ] Floating button appears
- [ ] AI analysis works
- [ ] Q&A feature works
- [ ] Text highlighting works

---

## 📞 Getting Help

If you encounter issues not covered here:

1. **Check Console Errors**:
   - Right-click on any page → Inspect
   - Go to Console tab
   - Look for PaperMind-related errors

2. **Extension Logs**:
   - Go to `chrome://extensions/`
   - Find PaperMind
   - Click "Errors" button (if visible)
   - Review error messages

3. **Report Issues**:
   - GitHub Issues: Create a detailed bug report
   - Include: Chrome version, OS, error messages, steps to reproduce

4. **Community Support**:
   - GitHub Discussions
   - Email: support@papermind.ai

---

## 🎉 Success!

If you've completed all steps and PaperMind is working:

**Congratulations!** 🎊 You've successfully installed PaperMind!

### Next Steps:
1. Explore different research papers
2. Try all features (Q&A, highlighting, diagrams)
3. Customize settings to your preference
4. Share feedback and suggestions

### Tips for Best Experience:
- Use on papers with clear structure for best results
- Try different AI models to see which works best for you
- Enable auto-analyze for seamless experience
- Use highlighting feature to understand complex sections

---

**Made with ❤️ for the research community**

Transform your research experience with PaperMind!
