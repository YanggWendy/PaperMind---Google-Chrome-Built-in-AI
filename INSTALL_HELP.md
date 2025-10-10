# 🚨 Installation Error Fix

## Error: "Manifest file is missing or unreadable"

### ❌ Common Mistake
You selected the **icons** folder instead of the main extension folder.

```
WRONG ❌:
/Users/yangwenting/Desktop/Work/Hackthon/PaperMind---Google-Chrome-Built-in-AI/icons/
                                                                              ^^^^^^
                                                                              DON'T select this!
```

### ✅ Correct Folder
Select the **parent folder** that contains manifest.json:

```
CORRECT ✅:
/Users/yangwenting/Desktop/Work/Hackthon/PaperMind---Google-Chrome-Built-in-AI/
                                                                              ^^^
                                                                              Select this folder!
```

---

## 🎯 Step-by-Step Fix

### 1. Remove Incorrect Extension
```
1. Go to: chrome://extensions/
2. Find the PaperMind entry (may show error)
3. Click "Remove" button
```

### 2. Load Correct Folder
```
1. Click "Load unpacked" button
2. In the file picker, navigate to:
   Desktop → Work → Hackthon → PaperMind---Google-Chrome-Built-in-AI
3. Make sure you see these files in the folder:
   ✓ manifest.json
   ✓ background.js
   ✓ content.js
   ✓ popup.html
   ✓ icons (folder)
4. Click "Select Folder" or "Open"
```

### 3. Verify Success
```
You should see:
✅ "PaperMind - AI Research Assistant" card
✅ Version: 1.0.0
✅ No error messages
✅ Toggle switch is ON (blue)
```

---

## 🔍 Visual Guide

### The folder you select should contain:

```
PaperMind---Google-Chrome-Built-in-AI/  ← SELECT THIS FOLDER
├── manifest.json          ← This file MUST be here
├── background.js
├── content.js
├── content.css
├── popup.html
├── popup.js
├── popup.css
├── package.json
├── icons/                 ← NOT this subfolder!
│   └── icon.svg
├── README.md
└── Other files...
```

---

## 📝 Quick Checklist

Before clicking "Select Folder", verify:

- [ ] You can see `manifest.json` in the current folder view
- [ ] You can see `background.js` in the current folder view
- [ ] You can see `popup.html` in the current folder view
- [ ] You are NOT in a subfolder (like icons/)
- [ ] The folder name is `PaperMind---Google-Chrome-Built-in-AI`

---

## 🎯 Alternative Method (Terminal)

If you're comfortable with terminal, verify your location:

```bash
cd ~/Desktop/Work/Hackthon/PaperMind---Google-Chrome-Built-in-AI
ls -la
```

You should see:
```
-rw-r--r--  manifest.json
-rw-r--r--  background.js
-rw-r--r--  content.js
drwxr-xr-x  icons/
... (other files)
```

If you see these files, THIS is the correct folder to select in Chrome.

---

## 🆘 Still Having Issues?

### Check Current Location
Run this command to see your current path:

```bash
pwd
```

Should output:
```
/Users/yangwenting/Desktop/Work/Hackthon/PaperMind---Google-Chrome-Built-in-AI
```

If it shows:
```
/Users/yangwenting/Desktop/Work/Hackthon/PaperMind---Google-Chrome-Built-in-AI/icons
```

Then go up one level:
```bash
cd ..
```

---

## ✅ Success Indicators

After loading the CORRECT folder:

1. **Extension Card Shows:**
   - Name: "PaperMind - AI Research Assistant"
   - Version: 1.0.0
   - Status: Enabled (toggle ON)

2. **No Error Messages**

3. **Can Click Extension Icon** in toolbar

4. **Test on Paper:**
   - Go to: https://arxiv.org/html/1706.03762v7
   - See floating 🧠 button
   - Click it and panel appears

---

## 📞 Need More Help?

If you're still stuck:

1. **Take a screenshot** of:
   - The Chrome Extensions page showing the error
   - The file picker when selecting the folder
   
2. **Run this command** and share output:
   ```bash
   cd ~/Desktop/Work/Hackthon/PaperMind---Google-Chrome-Built-in-AI
   ls -la | head -20
   ```

3. **Check manifest.json exists**:
   ```bash
   cat manifest.json | head -10
   ```

---

**Remember: Select the folder that CONTAINS manifest.json, not a subfolder!** ✅
