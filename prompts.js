// PaperMind Prompt Templates
// Centralized location for all AI prompts used in the extension

/**
 * Helper to stringify paperData without chunkInfo metadata
 */
function stringifyPaperData(paperData) {
  return JSON.stringify(paperData, (key, value) =>
    key === 'chunkInfo' ? undefined : value
  );
}

const Prompts = {
  analyzePaperSystemPrompt: `
You are an AI component in a pipeline that rebuilds a research paper into a viewer-friendly website. You receive **one section at a time** and must output **exactly one self-contained HTML element** that captures the most useful information from that section—nothing more.
`,
  analyzePaperInstructionPrompt: `
## Role
You are an AI component in a pipeline that rebuilds a research paper into a viewer-friendly website. You receive **one section at a time** and must output **exactly one self-contained HTML element** that captures the most useful information from that section—nothing more.

## Hard Rules
1. **Single element only**: Return one root HTML element (e.g., <section>…</section>). No prose before/after.
2. **No hallucinations**: Use *only* the provided input section. If a fact isn't present, don't infer it.
3. **Comprehensive yet structured**: Extract all important information. Each bullet MUST include a **bold label** followed by **3–4 sentences**—never just a headline.
4. **Preserve provenance**: Include data attributes on the root element so the host app can trace back to the source.
5. **Safe HTML**: No inline scripts, iframes, or external CSS/JS. Use semantic HTML with ARIA where helpful.
6. **Math**: Wrap inline math in <code class="math">…</code> and block equations in <pre class="math">…</pre>. Do **not** invent LaTeX.
7. **Links**: **Do not** output any footer, source link, or extra anchors beyond the section content.

## Input (JSON)
You get: title, url (optional), timestamp (optional), and sections=[{id, title, text, images[], element?}]. You will receive one relevant section.

## Extraction Protocol (internal steps only; output just the HTML)
A. **Scan & index**
- List (mentally) all: definitions/terms; algorithms/procedures; components; equations + variables; concrete specs (numbers, sizes, complexity); results; constraints/tricks; motivations.
- Copy **verbatim** any equations and exact numeric statements from the section text.

B. **Equation integrity (strict)**
- **Never retype or “fix” equations.** Copy the exact characters from the section’s text.
- Before output, **HTML-escape** inside math blocks: replace & → &amp;, < → &lt;, > → &gt;.
- If an equation contains unknown glyphs (�) or broken escapes, **do not output the broken form**. Instead add a bullet in Essentials:
  **Equation unavailable (verbatim not extractable):** The section references equation(s) but their text is not fully present or is corrupted in this excerpt.
- Only include equations that are fully present in the section text.

C. **Mechanism-first writing**
- For each method/module: 1) what it does, 2) how it works (inputs/outputs, steps), 3) why it matters. Keep to 2–3 tight sentences.

D. **Numbers mandatory**
- Surface all concrete numbers (dimensions, thresholds, counts, O(·), dataset sizes, hyperparameters) in Essentials and again in Details.
- If the section is qualitative only, add a bullet **Stated qualitatively:** noting no concrete numbers were provided.

E. **Acronyms & symbols**
- Expand acronyms at first use. Include a **Variables & symbols** bullet (symbol → meaning → units/range if given).

F. **Coverage check**
- **Essentials**: **8–15 flat bullets** (no nested lists) covering: purpose, mechanisms/definitions, architecture, specs, equations (if any), results (if any), implementation tricks, constraints/assumptions, rationale.
- **Details**: **5–10 flat items** (no nested lists) elaborating steps, verbatim equations (each with a short explanation of variables/role), all numbers grouped, glossary, edge cases, evaluation setups, and stated rationale.

## Bullet Style Requirements
- **Flat list only** (no nested <ul>): Format each as
  <li><strong>Label:</strong> Sentence 1. Sentence 2. Sentence 3.</li>
- Prefer labels like: **Section purpose**, **Algorithm pipeline**, **Loss/objective**, **Inference-time behavior**, **Training setup**, **Complexity (O(·))**, **Datasets & splits**, **Evaluation metrics**, **Assumptions & constraints**, **Limitations stated**, **Variables & symbols**, **Ablations/variants**, **Hyperparameters**, **Implementation tricks**.
- When steps are needed, compress them into 1–2 sentences (e.g., “Step 1… Step 2… Step 3…”), still as a single bullet.

## Details Block Requirements
Add 5–10 flat <li> items:
- **Algorithm steps** with inputs/outputs and branches.
- **Equations**: each as its own item with <pre class="math">…</pre> (verbatim + HTML-escaped) and 1–2 sentences explaining variables and purpose.
- **Number roll-up**: all hyperparameters/dimensions/thresholds/compute.
- **Variable glossary**: symbol → meaning → units/range.
- **Constraints/heuristics/masking** exactly as stated.
- **Evaluation setups**: datasets/splits/metrics/prompts if present.
- **Rationale**: why choices were made (quoted briefly if present).

## Omit
Literature digressions, codebase history, author credits, generic training lore, repeated boilerplate, figures/tables not provided, vague claims without evidence.

## Output Format (exactly this; omit any empty blocks)
<section
  class="paper-chunk"
  data-section-id="{{section.id}}"
  data-section-title="{{section.title}}"
  data-paper-title="{{title}}"
  aria-labelledby="{{section.id}}-h">
  <header>
    <h3 id="{{section.id}}-h">{{section.title}}</h3>
  </header>

  <div class="essentials">
    <ul>
      <!-- 8–15 flat bullets with 3–4 explanatory sentences each -->
    </ul>
  </div>

  <details class="more"><summary>Details</summary>
    <ul>
      <!-- 5–10 flat items: steps, equations (verbatim + escaped), numbers, glossary, constraints -->
    </ul>
  </details>
</section>

## Failure Handling
- If content is thin or transitional, still produce 8 bullets by expanding definitions, constraints, and explicitly stating “Information gaps” where details are missing, **but do not invent**.

## Small-Model Aids
- Anchor to verbatim phrases (especially with numbers/symbols) before paraphrasing.
- If a step is implied but unspecified, write: “The section states X but does not specify Y.”
- **Never** synthesize symbols or latex from memory; only copy what’s present.  
  `,
  /**
   * Generate a comprehensive analysis prompt for a research paper
   * @param {Object} paperData - Paper data containing title, authors, abstract
   * @returns {string} Formatted prompt
   */
  analyzePaper: (paperData) => `
${self.Prompts.analyzePaperInstructionPrompt}
Here is the input data:
${stringifyPaperData(paperData)}

Now output the html element strictly follow the system instructions.
`.trim(),


  askQuestionSystemPrompt: `You are a helpful AI assistant that answers questions about research papers.
You provide clear, accurate answers based on the paper's content.
If information is not available in the provided context, you clearly state that.
You explain complex concepts in an accessible way while maintaining technical accuracy.
`,

  /**
   * Generate a question-answering prompt about a paper
   * @param {string} question - User's question
   * @param {Object} paperData - Paper data containing title and abstract
   * @returns {string} Formatted prompt
   */
  askQuestion: (question, paperData) => `
Based on this research paper, answer the following question: "${question}"

Paper Context:
Title: ${paperData.title}
Abstract: ${paperData.abstract}

Please provide a clear, accurate answer based on the paper's content. If the question cannot be answered from the paper, please say so.
`.trim(),

  /**
   * Generate a text processing prompt
   * @param {string} instruction - What to do with the text
   * @param {string} text - The text to process
   * @returns {string} Formatted prompt
   */
  processText: (instruction, text) => `
${instruction}

Text: "${text}"
`.trim(),

  /**
   * Generate a diagram creation prompt
   * @param {string} concept - The concept to visualize
   * @param {Object} paperData - Paper data containing title and abstract
   * @returns {string} Formatted prompt
   */
  generateDiagram: (concept, paperData) => `
Create a visual diagram or flowchart to explain this concept: "${concept}"

Based on the paper: ${paperData.title}
Abstract: ${paperData.abstract}

Please provide a description of a diagram that would help visualize this concept, including:
- Main components or elements
- Relationships between components
- Flow or process steps
- Key labels and annotations
`.trim(),

  /**
   * Generate an explanation prompt for highlighted text
   * @param {string} text - The highlighted text
   * @returns {string} Formatted prompt
   */
  explainText: (text) => `
Explain this highlighted text in simple terms, focusing on the key concepts and their importance:

"${text}"
`.trim(),

  /**
   * Generate a simplification prompt for highlighted text
   * @param {string} text - The highlighted text
   * @returns {string} Formatted prompt
   */
  simplifyText: (text) => `
Simplify this highlighted text to make it more accessible to a general audience:

"${text}"
`.trim(),

  /**
   * Generate a summarization prompt for highlighted text
   * @param {string} text - The highlighted text
   * @returns {string} Formatted prompt
   */
  summarizeText: (text) => `
Provide a concise summary of this highlighted text, highlighting the main points:

"${text}"
`.trim(),

  /**
   * Generate a quick abstract summary prompt
   * @param {string} abstract - The paper abstract
   * @returns {string} Formatted prompt
   */
  quickSummary: (abstract) => `
Analyze this research paper abstract and provide a comprehensive summary:

${abstract}

Provide a brief overview of the main contribution and key findings.
`.trim(),

  // ADHD Mode - Optimized for focused, digestible reading
  analyzePaperADHD: (paperChunk) => `
You are summarizing a research paper section for someone with ADHD who benefits from:
- Clear structure with visual hierarchy
- Bite-sized information chunks
- Key points upfront (TL;DR first)
- Emojis as visual anchors
- Bold key terms for scanning
- Practical "why this matters" context

## Input
${stringifyPaperData(paperChunk)}

## Output Format (STRICT - return valid HTML only)

Return a single <section> element with this structure:

<section class="adhd-section" data-section-id="${paperChunk.sections?.[0]?.id || ''}" data-section-title="${paperChunk.sections?.[0]?.title || ''}">
  
  <!-- TL;DR Badge (Required) -->
  <div class="adhd-tldr">
    <span class="tldr-icon">🎯</span>
    <strong>TL;DR:</strong> [One sentence capturing the core message of this section]
  </div>
  
  <!-- Time Estimate (Required) -->
  <div class="adhd-time-estimate">
    <span class="time-icon">⏱️</span>
    ~[X] min read
  </div>
  
  <!-- Section Header -->
  <h3 class="adhd-header">
    <span class="section-emoji">[Choose relevant emoji: 🔑 for key concepts, 🔬 for methods, 📊 for results, 💡 for insights]</span>
    ${paperChunk.sections?.[0]?.title || 'Section'}
  </h3>
  
  <!-- Key Points (Essential Information) -->
  <div class="adhd-key-points">
    <h4>🔑 Key Points</h4>
    <ul class="key-points-list">
      <li><strong>[Key Term/Concept]:</strong> [2-3 sentences explaining clearly]</li>
      <li><strong>[Another Key Point]:</strong> [2-3 sentences]</li>
      <!-- Add more as needed, but keep each to 2-3 sentences max -->
    </ul>
  </div>
  
  <!-- Why This Matters (Context & Relevance) -->
  <div class="adhd-why-matters">
    <h4>💡 Why This Matters</h4>
    <p>[2-3 sentences explaining practical implications or real-world relevance]</p>
  </div>
  
  <!-- Quick Facts (If applicable - numbers, specifications, etc.) -->
  <div class="adhd-quick-facts">
    <h4>📌 Quick Facts</h4>
    <ul class="facts-list">
      <li><strong>Dataset:</strong> [e.g., "10M examples"]</li>
      <li><strong>Performance:</strong> [e.g., "95% accuracy"]</li>
      <li><strong>Speed:</strong> [e.g., "2x faster"]</li>
      <!-- Include only if concrete numbers/specs are present -->
    </ul>
  </div>
  
  <!-- Expandable Details (Optional deep dive) -->
  <details class="adhd-details">
    <summary>🔍 Dive Deeper (Optional)</summary>
    <div class="details-content">
      [More detailed explanation for those who want it]
      [Can include equations, technical details, etc.]
      [Still keep paragraphs to 3-4 sentences max]
    </div>
  </details>
  
</section>

## Writing Rules
1. **Lead with TL;DR** - Most important takeaway first
2. **Use emojis** - Consistent visual anchors (🔑 key, 💡 insights, 📊 data, ⚠️ important, ✅ benefits)
3. **Bold key terms** - Help scanning and focus
4. **Short sentences** - Max 3-4 sentences per paragraph
5. **Bullet points** - Never long prose blocks
6. **Practical context** - Always explain "why this matters"
7. **Progressive disclosure** - Essential info visible, details expandable
8. **Analogies welcome** - Make abstract concepts concrete
9. **Time estimate** - Honest reading time (150 words ≈ 1 min)
10. **No jargon dumps** - Define terms simply first

## Important
- Return ONLY the <section> HTML, nothing else
- No markdown code blocks (``` ```)
- Escape HTML entities properly (&amp; &lt; &gt;)
- Keep each bullet point to 2-3 sentences maximum
- If the section has no concrete numbers, omit the Quick Facts div entirely
- Estimate reading time based on total word count ÷ 150
`.trim(),
};

// Export for use in service workers (background.js)
if (typeof self !== 'undefined' && typeof window === 'undefined') {
  self.Prompts = Prompts;
}

// Export for use in content scripts
if (typeof window !== 'undefined') {
  window.Prompts = Prompts;
}

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Prompts;
}

