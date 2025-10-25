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
3. **Comprehensive yet structured**: Extract all important information. Each bullet MUST include a **bold label** followed by **2–3 sentences**—never just a headline.
4. **Preserve provenance**: Include data attributes on the root element so the host app can trace back to the source.
5. **Safe HTML**: No inline scripts, iframes, or external CSS/JS. Use semantic HTML with ARIA where helpful.
6. **Math formatting (CRITICAL - MathJax will render these)**: 
   - Use \(...\) for inline math and \[...\] for display/block equations
   - Inside delimiters, use STANDARD LaTeX notation ONLY - NO Unicode math symbols AT ALL
   - Use single backslashes: \frac{1}{2}, \sum_{i=1}^{n}, \mathbf{S}, etc.
   - Common commands: \frac{}{}, \sum, \int, \prod, \sqrt{}, \mathbf{}, \text{}, \alpha, \beta, \mathbb{R}, etc.
   - **ABSOLUTELY FORBIDDEN**: Unicode math symbols (𝑺, 𝑪, ℝ, 𝑺∗, ℂ, etc.) - these will NOT render correctly
   - **ABSOLUTELY FORBIDDEN**: Incomplete LaTeX commands (rac, sum, frac without backslash) - always include the backslash
   - Example inline GOOD: \(S^{*} = \frac{1}{k}\sum_{i=1}^{k}S_{i}\)
   - Example display GOOD: \[S^{*} = \frac{1}{k}\sum_{i=1}^{k}S_{i}\]
   - Example BAD: \(𝑺∗ = rac{1}{k}sum_{i=1}^{k}S_{i}\) (Unicode + missing backslashes)
   - Example BAD: 𝑪∼rθ​(x,{yi}i=1n) (all Unicode, no LaTeX delimiters)
   - **If you see Unicode math in source, convert to LaTeX**: 𝑺 → S or \mathbf{S}, ℝ → \mathbb{R}, etc.
7. **Links**: **Do not** output any footer, source link, or extra anchors beyond the section content.

## Input (JSON)
You get: title, url (optional), timestamp (optional), and sections=[{id, title, text, images[], element?}]. You will receive one relevant section.

## Extraction Protocol (internal steps only; output just the HTML)
A. **Scan & index**
- List (mentally) all: definitions/terms; algorithms/procedures; components; equations + variables; concrete specs (numbers, sizes, complexity); results; constraints/tricks; motivations.
- Copy **verbatim** any equations and exact numeric statements from the section text.

B. **Equation integrity (strict - for MathJax rendering)**
- **Use MathJax delimiters directly**: \(...\) for inline, \[...\] for display equations
- **CRITICAL**: ALL math MUST use proper LaTeX - NEVER output Unicode math symbols (𝑺, 𝑪, ℝ, etc.)
- **CRITICAL**: ALL LaTeX commands need backslashes - NEVER output incomplete commands (rac, sum, frac)
- If source equation has Unicode (𝑺, 𝑪, ℝ) or broken LaTeX:
  * Convert Unicode to LaTeX: 𝑺 → S or \mathbf{S}, 𝑪ᵢ → C_{i}, ℝ → \mathbb{R}, 𝑺∗ → S^{*}
  * Fix broken LaTeX: rac → \frac, sum → \sum, int → \int, prod → \prod
  * Result: \(S^{*} = \frac{1}{k}\sum_{i=1}^{k}S_{i}\) or \[S^{*} = \frac{1}{k}\sum_{i=1}^{k}S_{i}\]
- Use common LaTeX commands: \frac{}{}, \sum_{}, \prod_{}, \int, \sqrt{}, \mathbf{}, \mathbb{R}, \alpha, \beta
- Use single backslashes: \frac not \\frac
- If equation has broken glyphs (�) that cannot be converted, add bullet: **Equation unavailable (not fully extractable)**
- Only include fully present equations from source.

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
- **Equations**: Display equations using \[...\] delimiters, each with 1–2 sentences explaining variables.
  * Example GOOD: <li><strong>Main equation:</strong> \[S^{*} = \frac{1}{k}\sum_{i=1}^{k}S_{i}\] This averages k sampled rewards.</li>
  * Example BAD: \[𝑺∗ = rac{1}{k}sum_{i=1}^{k}S_{i}\] (Unicode + missing backslashes - NEVER do this)
  * Example BAD: 𝑪∼rθ​(x,{yi}i=1n) (all Unicode, no delimiters - NEVER do this)
  * Use standard commands: \mathbf{}, \text{}, \frac{}{}, \sum_{}, \prod_{}, \int, \mathbb{R}, \alpha, \beta, etc.
  * ALWAYS include backslashes in LaTeX commands
- **Number roll-up**: all hyperparameters/dimensions/thresholds/compute.
- **Variable glossary**: symbol → meaning → units/range (use inline math \(...\) for symbols).
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
      <!-- 8–15 flat bullets with 2–3 explanatory sentences each -->
    </ul>
  </div>

  <details class="more"><summary>Details</summary>
    <ul>
      <!-- 5–10 flat items: steps, equations (verbatim + escaped), numbers, glossary, constraints -->
    </ul>
  </details>
</section>

**Important formatting notes:**
- Keep the h3 title text clean and concise - do NOT add extra whitespace or line breaks inside the title
- The title should be a single line of text without leading or trailing spaces
- Example: <h3 id="S2-h">2 Background</h3> NOT <h3 id="S2-h">  2 Background  </h3>

## Failure Handling
- If content is thin or transitional, still produce 8 bullets by expanding definitions, constraints, and explicitly stating "Information gaps" where details are missing, **but do not invent**.

## FINAL VALIDATION (Before Outputting)
Before outputting your HTML, scan through ALL equations and math content one more time:
- Search for Unicode math characters: 𝑺, 𝑪, ℝ, 𝑺∗, ℂ, ℕ, ℤ, ℚ, 𝛼, 𝛽, 𝜃, etc. → If found, REPLACE with LaTeX
- Search for incomplete LaTeX: rac{, sum_, int_, prod_, sqrt{, alpha, beta → If found, ADD backslash
- Verify ALL math is wrapped: either \(...\) or \[...\]
- Verify NO random Unicode glyphs like ���, �, etc. appear in equations

## Small-Model Aids
- Anchor to verbatim phrases (especially with numbers/symbols) before paraphrasing.
- If a step is implied but unspecified, write: "The section states X but does not specify Y."
- **Never** synthesize symbols or latex from memory; only copy what's present.
- **Math equation checklist** before outputting (CHECK EVERY EQUATION):
  1. Did I use \(...\) for inline math or \[...\] for display math? (REQUIRED)
  2. Is the content PURE LaTeX with NO Unicode math symbols like 𝑺, 𝑪, ℝ, ���? (REQUIRED)
  3. Did I use single backslashes (\frac not \\frac)? (REQUIRED)
  4. Do ALL LaTeX commands have backslashes (\frac not rac, \sum not sum)? (REQUIRED)
  5. Did I convert any Unicode math symbols to LaTeX equivalents? (REQUIRED if source has Unicode)
  6. Did I verify no broken or incomplete LaTeX commands? (REQUIRED)
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

