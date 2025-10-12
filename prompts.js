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
    /**
     * Generate a comprehensive analysis prompt for a research paper
     * @param {Object} paperData - Paper data containing title, authors, abstract
     * @returns {string} Formatted prompt
     */
    analyzePaper: (paperData) => `
## Role

You are an AI component in a pipeline that rebuilds a research paper into a viewer-friendly website. You receive **one section at a time** and must output **exactly one self-contained HTML element** that captures the most useful information from that section—nothing more.

## Hard Rules

1. **Single element only**: Return one root HTML element (e.g., <section>…</section>). No prose before/after.
2. **No hallucinations**: Use *only* the provided input section. If a fact isn't present, don't infer it.
3. **Be comprehensive yet structured**: Extract all important information from the section. Each bullet MUST include 2-3 sentences of explanation after the bold label - never just a headline or brief fact.
4. **Preserve provenance**: Include data attributes so the host app can trace back to the source.
5. **Safe HTML**: No inline scripts, iframes, or external CSS/JS. Use semantic HTML with ARIA where helpful.
7. **Math**: Wrap inline math in <code class="math">…</code> and block equations in <pre class="math">…</pre>. Do not invent LaTeX.
8. **Links**: If a canonical url is provided, include a "Source" link in a subtle footer.

## Input (JSON)

You will be given a JSON object with at least:

* title (string)
* url (string, optional)
* timestamp (ISO string, optional)
* sections: array of section objects; **you will receive exactly one** relevant section object in practice

  * Section fields: id, title, text, images (array), and optional element (ignore).

## What to Extract (priority order)

1. **Core contribution / purpose of this section** - Provide comprehensive explanation of what this section introduces or explains.
2. **Key mechanisms / definitions** - Fully describe algorithms, modules, attention types, and how they work.
3. **Architectural details** - Complete descriptions of components, their connections, and interactions.
4. **Concrete specs or settings** - All hyperparameters, dimensions, counts, complexity measures.
5. **Key equations** - Include verbatim from text with explanation of variables and purpose.
6. **Notable results (numbers)** - All specific measurements, comparisons, or performance metrics.
7. **Implementation details** - Constraints, assumptions, masking techniques, and any tricks essential to reproduction.
8. **Motivations and rationale** - Why certain design choices were made, what problems they solve.

## What to Omit

* Literature digressions ("as in [x,y,z]"), codebase history, author credits, generic training lore not specific to this section, repeated boilerplate.
* Any table/figure not present in images.
* Vague claims without evidence in the section.

## BAD vs GOOD Bullet Examples

**BAD** (too brief, no explanation):
* **Multi-head attention:** Uses 8 heads with d_k=64.

**GOOD** (includes explanation):
* **Multi-head attention (h=8):** Instead of performing a single attention function with d_model-dimensional keys, values and queries, the model linearly projects them h=8 times with different learned projections to d_k=d_v=64 dimensions. The attention function is performed in parallel on each projection, yielding 64-dimensional outputs that are concatenated and projected again. This allows the model to jointly attend to information from different representation subspaces at different positions.

## Output Format (must follow exactly)

Return **one** <section> element with this internal structure (omit blocks that would be empty):
Here is the structure:
<section>
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
      <!-- 8-15 bullets covering all important information from the section -->
      <!-- CRITICAL: Each bullet MUST have 2-3 sentences of explanation after the bold label -->
      <!-- Format: <li><strong>Label:</strong> Explanation sentence 1. Explanation sentence 2. Explanation sentence 3.</li> -->
      <li>…</li>
    </ul>
  </div>

  <!-- details of the section, user will use this section to gain more information about the bullet points summarized above. Be comprehensive. Do not lose any key information. -->
  <details class="more"><summary>Details</summary>
    <ul>
      <li>…</li>
    </ul>
  </details>

</section>


### Content Style Guidelines

* **Every bullet MUST include explanation**: Start with a **bold noun phrase**, then provide 2-3 sentences explaining what it is, how it works, and why it matters. Never leave a bullet as just a label or brief fact.
* **Example format**:
  **Encoder stack (N=6):** Composed of 6 identical layers, each containing two sub-layers: a multi-head self-attention mechanism and a position-wise fully connected feed-forward network. Residual connections are employed around each sub-layer, followed by layer normalization, with the formula LayerNorm(x + Sublayer(x)). All sub-layers and embedding layers produce outputs of dimension d_model=512 to facilitate these residual connections.
* Include **numbers, symbols, and detailed explanations** - don't sacrifice clarity for brevity.
* Each bullet should be self-contained with enough context to be understood independently, including relevant equations, dimensions, and rationale.
* Cover all important information from the section - don't artificially limit content.
* **Target bullets**: 8-15 in essentials (adjust based on section density); 5-10 in details for supplementary information.

## Image Handling
* Do not include any images or data URIs.


## Input

${stringifyPaperData(paperData)}

This is the paper section data, now output the html element
`.trim(),




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

