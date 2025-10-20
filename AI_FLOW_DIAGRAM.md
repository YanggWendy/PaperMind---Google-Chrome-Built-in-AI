# PaperMind AI Flow Diagram

## Current Architecture (Sequential - SLOW)

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER CLICKS "ANALYZE"                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  content.js: Extract paper HTML & send to background            │
│  chrome.runtime.sendMessage({ action: 'analyzePaper' })         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  background.js: Receive paper data                               │
│  - Split into chunks (1 section per chunk by default)           │
│  - Paper with 10 sections = 10 chunks                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────────┐
        │  FOR EACH CHUNK (Sequential Loop)      │
        │  ⚠️ THIS IS THE BOTTLENECK             │
        └────────┬───────────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────────────┐
    │  Chunk 1: "Introduction"                       │
    │  ├─ Clone main session (~200ms)                │
    │  ├─ Build prompt (~3,500 chars instructions    │
    │  │    + 2,000 chars section text)              │
    │  ├─ Call Gemini Nano (5-15 seconds)            │
    │  ├─ Destroy clone (~100ms)                     │
    │  └─ Total: ~6-16 seconds                       │
    └────────────────┬───────────────────────────────┘
                     │
                     ▼ Wait for completion...
    ┌────────────────────────────────────────────────┐
    │  Chunk 2: "Related Work"                       │
    │  ├─ Clone main session (~200ms)                │
    │  ├─ Build prompt (~5,500 chars total)          │
    │  ├─ Call Gemini Nano (5-15 seconds)            │
    │  ├─ Destroy clone (~100ms)                     │
    │  └─ Total: ~6-16 seconds                       │
    └────────────────┬───────────────────────────────┘
                     │
                     ▼ Wait for completion...
    ┌────────────────────────────────────────────────┐
    │  Chunk 3: "Methodology"                        │
    │  └─ Total: ~6-16 seconds                       │
    └────────────────┬───────────────────────────────┘
                     │
                     ▼ ... continues for all chunks
    ┌────────────────────────────────────────────────┐
    │  Chunk 10: "Conclusion"                        │
    │  └─ Total: ~6-16 seconds                       │
    └────────────────┬───────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  TOTAL TIME: 10 chunks × 6-16s = 60-160 seconds (1-3 minutes)  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Return all HTML sections to content.js                         │
│  Display enhanced paper                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Optimized Architecture (Parallel - FAST)

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER CLICKS "ANALYZE"                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  content.js: Extract paper HTML & send to background            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  background.js: Receive paper data                               │
│  - Split into chunks (2-3 sections per chunk)                   │
│  - Paper with 10 sections = 3-5 chunks                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────────┐
        │  PROCESS ALL CHUNKS IN PARALLEL        │
        │  ✅ Promise.all() - Much faster!       │
        └────────┬───────────────────────────────┘
                 │
                 ├──────────┬──────────┬──────────┬──────────┐
                 ▼          ▼          ▼          ▼          ▼
            Chunk 1    Chunk 2    Chunk 3    Chunk 4    Chunk 5
            (Intro +   (Method +  (Results + (Discuss + (Concl.)
             Related)   Impl.)     Eval.)     Limit.)
                 │          │          │          │          │
                 │  All processing happens simultaneously   │
                 │          │          │          │          │
                 └──────────┴──────────┴──────────┴──────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  TOTAL TIME: max(chunk times) = ~8-20 seconds                   │
│  (Limited by slowest chunk, not sum of all chunks)              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Return all HTML sections to content.js                         │
│  Display enhanced paper                                          │
└─────────────────────────────────────────────────────────────────┘
```

**Speedup**: 60-160s → 8-20s = **5-10x faster!**

---

## Session Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Chrome Built-in AI (Gemini Nano)             │
│                         window.ai.languageModel                  │
└──────────────────────────────▲──────────────────────────────────┘
                               │
                               │ session.prompt(text)
                               │
┌──────────────────────────────┴──────────────────────────────────┐
│                      chromeAIHelper.js                           │
│  - callPromptAPI(session, prompt)                                │
│  - getLanguageModel() → creates session                          │
│  - destroySession(session)                                       │
└──────────────────────────────▲──────────────────────────────────┘
                               │
                               │ Uses helper functions
                               │
┌──────────────────────────────┴──────────────────────────────────┐
│                      background.js (Service Worker)              │
│                                                                   │
│  Main Sessions (Persistent):                                     │
│  ┌────────────────────┐  ┌────────────────────┐                 │
│  │ Analysis Session   │  │ Question Session   │                 │
│  │ (for papers)       │  │ (for Q&A/highlights)│                │
│  │ + System prompt    │  │ + System prompt    │                 │
│  └─────────┬──────────┘  └─────────┬──────────┘                 │
│            │                       │                             │
│            │ .clone()              │ .clone()                    │
│            ▼                       ▼                             │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │ Cloned Session  │    │ Cloned Session  │                     │
│  │ (Task 1)        │    │ (Highlight 1)   │                     │
│  │ → destroyed     │    │ → destroyed     │                     │
│  └─────────────────┘    └─────────────────┘                     │
│                                                                   │
│  Why clone? Keep context small & isolated per task              │
└──────────────────────────────────────────────────────────────────┘
```

---

## Highlight Feature Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  USER HIGHLIGHTS TEXT: "transformer architecture with..."       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  content.js: Show search bar                                     │
│  ┌───────────────────────────────────────────────────────┐      │
│  │  🔍  [Ask about this text...]              →          │      │
│  └───────────────────────────────────────────────────────┘      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  User clicks 🔍 (quick explain) OR types custom question        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  content.js: Build prompt                                        │
│  - Default: "Explain + background + examples + why used"        │
│  - Custom: User question + highlighted text context             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  chrome.runtime.sendMessage({                                    │
│    action: 'processText',                                        │
│    prompt: fullPrompt,                                           │
│    text: highlightedText                                         │
│  })                                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  background.js: processText()                                    │
│  - Clone question session                                        │
│  - Call Gemini Nano (3-8 seconds)                               │
│  - Destroy clone                                                 │
│  ⚠️ NO CACHING - Same highlight = reprocess                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  content.js: Show knowledge panel (side panel)                   │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ 🔍 Quick Explanation                          - ×    │       │
│  │ ─────────────────────────────────────────────────────│       │
│  │ Selected: "transformer architecture with..."         │       │
│  │                                                       │       │
│  │ **Background**: Transformers are...                  │       │
│  │ **Explanation**: This refers to...                   │       │
│  │ **Why Used**: The paper uses this because...         │       │
│  │                                                       │       │
│  │ ✓ Key Points:                                        │       │
│  │ • Point 1                                             │       │
│  │ • Point 2                                             │       │
│  │                                                       │       │
│  │ [Ask Follow-up] [💾 Save to Notes]                   │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Token/Character Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  INPUT: Paper Section                                            │
│  ├─ Section title: ~50 chars                                    │
│  ├─ Section text: ~2,000-5,000 chars                            │
│  └─ Images: (removed before AI processing)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  PROMPT CONSTRUCTION                                             │
│  ├─ System prompt: ~3,500 chars                                 │
│  ├─ Paper metadata (title, abstract): ~500 chars               │
│  ├─ Section data: ~2,000-5,000 chars                            │
│  └─ TOTAL: ~6,000-9,000 chars                                   │
│                                                                   │
│  Estimated tokens: chars ÷ 4 = ~1,500-2,250 tokens             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  GEMINI NANO PROCESSING                                          │
│  ├─ Context window: ~4,000-8,000 tokens                         │
│  ├─ Input tokens: ~1,500-2,250 tokens (fits comfortably)       │
│  ├─ Processing speed: ~10-50 tokens/second                      │
│  ├─ Output tokens: ~500-1,000 tokens (HTML response)            │
│  └─ Time: (input + output) ÷ speed = 5-15 seconds              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  OUTPUT: HTML Section                                            │
│  ├─ <section> with structured content                           │
│  ├─ Essentials: 8-15 bullets                                    │
│  ├─ Details: 5-10 items                                         │
│  └─ Size: ~2,000-4,000 chars                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Performance Comparison

### Current (Sequential)
```
Chunk 1: ████████████████ 15s
Chunk 2:                 ████████████████ 15s
Chunk 3:                                  ████████████████ 15s
Chunk 4:                                                   ████████████████ 15s
...
Total:   ════════════════════════════════════════════════════════════ 150s
```

### Optimized (Parallel + Larger Chunks)
```
Chunk 1: ████████████████████ 20s
Chunk 2: ████████████████████ 20s  } All happening
Chunk 3: ████████████████████ 20s  } at the same time
...
Total:   ████████████████████ 20s (max of all chunks)
```

**Result**: 150s → 20s = **7.5x faster!**

---

## Key Takeaways

1. **`await window.ai.languageModel.create()`** creates a Gemini Nano session
2. **Session cloning** keeps context isolated but adds overhead
3. **Sequential processing** is the main bottleneck (no parallelization)
4. **Verbose prompts** slow down each request
5. **No caching** means repeated work for highlights

**Quick fix**: Change 3 lines of code for 5-10x speedup!

