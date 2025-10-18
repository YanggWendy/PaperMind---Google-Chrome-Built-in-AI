// PaperMind Highlighting & Study Notes
// Handles text selection, explanations, follow-ups, and note management

class PaperMindHighlights {
    constructor(paperMind) {
        this.paperMind = paperMind;
    }

    setupEventListeners() {
        document.addEventListener('mouseup', (e) => {
            const selection = window.getSelection();
            const text = selection.toString().trim();

            if (text.length >= 10) {
                this.paperMind.highlightedText = text;
                this.showContextMenu(e);
            }
        });

        // Listen for messages
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'analyzePaper') {
                this.paperMind.analyzePaper();
                sendResponse({ success: true });
            } else if (request.action === 'getPaperData') {
                sendResponse({ paperData: this.paperMind.paperData });
            }
        });
    }

    showContextMenu(event) {
        if (this.paperMind.highlightedText.length < 10) return;

        const existingMenu = document.querySelector('.papermind-context-menu');
        if (existingMenu) existingMenu.remove();

        const menu = document.createElement('div');
        menu.className = 'papermind-context-menu';
        menu.innerHTML = `<div class="menu-item" data-action="explain">Explain this</div>`;
        menu.style.position = 'absolute';
        menu.style.left = event.pageX + 'px';
        menu.style.top = event.pageY + 'px';

        document.body.appendChild(menu);

        // Store both selection position and range to preserve highlight
        const selection = window.getSelection();
        this.paperMind.selectionRect = selection.getRangeAt(0).getBoundingClientRect();
        this.paperMind.selectionRange = selection.getRangeAt(0).cloneRange();

        menu.querySelector('.menu-item').addEventListener('click', (e) => {
            e.stopPropagation();
            this.showExplanationPrompt();
            menu.remove();
        });

        setTimeout(() => {
            document.addEventListener('click', () => {
                menu.remove();
                // Clear the stored range when menu closes
                if (this.paperMind.selectionRange) {
                    this.paperMind.selectionRange = null;
                }
            }, { once: true });
        }, 100);
    }

    showExplanationPrompt() {
        const existing = document.querySelector('.papermind-explanation-prompt');
        if (existing) existing.remove();

        const dialog = document.createElement('div');
        dialog.className = 'papermind-explanation-prompt';
        dialog.innerHTML = `
            <div class="prompt-dialog">
                <div class="prompt-header">
                    <h4>Explain Selected Text</h4>
                    <button class="prompt-close">×</button>
                </div>
                <div class="prompt-body">
                    <div class="selected-text-preview">
                        <strong>Selected:</strong> "${this.paperMind.highlightedText.substring(0, 100)}${this.paperMind.highlightedText.length > 100 ? '...' : ''}"
                    </div>
                    <div class="prompt-options">
                        <button class="prompt-option-btn active" data-mode="default">
                            <span class="option-icon">▶</span>
                            <span class="option-text">Quick Explanation</span>
                        </button>
                        <button class="prompt-option-btn" data-mode="custom">
                            <span class="option-icon">✎</span>
                            <span class="option-text">Custom Prompt</span>
                        </button>
                    </div>
                    <div class="custom-prompt-input hidden">
                        <label>Your prompt:</label>
                        <textarea placeholder="E.g., 'Explain in context of ML'"></textarea>
                        <small>Added to: "Explain the following text: [text]"</small>
                    </div>
                </div>
                <div class="prompt-footer">
                    <button class="btn-secondary prompt-cancel">Cancel</button>
                    <button class="btn-primary prompt-generate">Generate Explanation</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        const btns = dialog.querySelectorAll('.prompt-option-btn');
        const customInput = dialog.querySelector('.custom-prompt-input');
        const textarea = dialog.querySelector('textarea');
        let mode = 'default';

        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                mode = btn.dataset.mode;
                customInput.classList.toggle('hidden', mode !== 'custom');
            });
        });

        // Keep selection visible when focusing textarea
        if (textarea) {
            textarea.addEventListener('focus', () => {
                if (this.paperMind.selectionRange) {
                    setTimeout(() => {
                        const selection = window.getSelection();
                        selection.removeAllRanges();
                        selection.addRange(this.paperMind.selectionRange);
                    }, 10);
                }
            });
        }

        dialog.querySelector('.prompt-generate').addEventListener('click', () => {
            const customPrompt = textarea.value.trim();
            this.generateExplanation(mode, customPrompt);
            dialog.remove();
        });

        dialog.querySelector('.prompt-cancel').addEventListener('click', () => dialog.remove());
        dialog.querySelector('.prompt-close').addEventListener('click', () => dialog.remove());
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) dialog.remove();
        });
    }

    async generateExplanation(mode, customPrompt = '') {
        const loadingPopup = this.showExplanationPopup('loading');

        try {
            let fullPrompt = mode === 'custom' && customPrompt
                ? `${customPrompt}\n\nText: "${this.paperMind.highlightedText}"`
                : `Explain with background knowledge:\n\n"${this.paperMind.highlightedText}"`;

            const response = await chrome.runtime.sendMessage({
                action: 'processText',
                prompt: fullPrompt,
                text: this.paperMind.highlightedText
            });

            loadingPopup.remove();

            if (response && response.result) {
                this.showExplanationPopup('result', response.result, customPrompt || 'Quick Explanation');

                this.saveToStudyNotes({
                    selectedText: this.paperMind.highlightedText,
                    prompt: customPrompt || 'Quick Explanation',
                    explanation: response.result,
                    timestamp: new Date().toISOString(),
                    paperTitle: this.paperMind.paperData?.title || document.title,
                    paperUrl: window.location.href
                });
            }
        } catch (error) {
            loadingPopup.remove();
            console.error('Error generating explanation:', error);
            if (this.paperMind.ui) {
                this.paperMind.ui.showNotification('Failed to generate explanation', 'error');
            }
        }
    }

    showExplanationPopup(type, content = '', promptType = '') {
        const existing = document.querySelector('.papermind-explanation-popup');
        if (existing) existing.remove();

        const popup = document.createElement('div');
        popup.className = 'papermind-explanation-popup';

        const rect = this.paperMind.selectionRect;
        if (rect) {
            popup.style.position = 'absolute';
            popup.style.left = `${rect.left + window.scrollX}px`;
            popup.style.top = `${rect.bottom + window.scrollY + 10}px`;
        }

        if (type === 'loading') {
            popup.innerHTML = `
                <div class="explanation-content loading">
                    <div class="loading-spinner"></div>
                    <p>Generating explanation...</p>
                </div>
            `;
        } else {
            popup.innerHTML = `
                <div class="explanation-content">
                    <div class="explanation-header">
                        <span class="explanation-badge">${promptType}</span>
                        <button class="explanation-close">×</button>
                    </div>
                    <div class="explanation-text">${this.formatExplanation(content)}</div>
                    <div class="explanation-footer">
                        <button class="explanation-follow-up">Ask Follow-up</button>
                        <button class="explanation-save-note">Saved to Notes</button>
                    </div>
                </div>
            `;

            popup.querySelector('.explanation-close').addEventListener('click', () => popup.remove());
            popup.querySelector('.explanation-follow-up').addEventListener('click', () => {
                this.showFollowUpDialog(content);
            });

            setTimeout(() => {
                document.addEventListener('click', (e) => {
                    if (!popup.contains(e.target)) popup.remove();
                }, { once: true });
            }, 100);
        }

        document.body.appendChild(popup);
        return popup;
    }

    formatExplanation(text) {
        return text.split('\n\n').map(p => `<p>${p}</p>`).join('');
    }

    showFollowUpDialog(previousContext) {
        const dialog = document.createElement('div');
        dialog.className = 'papermind-followup-dialog';
        dialog.innerHTML = `
            <div class="followup-content">
                <div class="followup-header">
                    <h4>Ask Follow-up Question</h4>
                    <button class="followup-close">×</button>
                </div>
                <div class="followup-body">
                    <textarea placeholder="Ask a follow-up question..." rows="3"></textarea>
                </div>
                <div class="followup-footer">
                    <button class="btn-secondary followup-cancel">Cancel</button>
                    <button class="btn-primary followup-ask">Ask</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        const textarea = dialog.querySelector('textarea');
        
        // Keep selection visible when focusing textarea
        textarea.addEventListener('focus', () => {
            if (this.paperMind.selectionRange) {
                setTimeout(() => {
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(this.paperMind.selectionRange);
                }, 10);
            }
        });
        
        textarea.focus();

        dialog.querySelector('.followup-ask').addEventListener('click', async () => {
            const question = textarea.value.trim();
            if (!question) return;

            dialog.remove();
            const loadingPopup = this.showExplanationPopup('loading');

            try {
                const fullPrompt = `Previous: ${previousContext}\n\nQuestion: ${question}`;
                const response = await chrome.runtime.sendMessage({
                    action: 'processText',
                    prompt: fullPrompt,
                    text: this.paperMind.highlightedText
                });

                loadingPopup.remove();

                if (response && response.result) {
                    this.showExplanationPopup('result', response.result, 'Follow-up Answer');

                    this.saveToStudyNotes({
                        selectedText: this.paperMind.highlightedText,
                        prompt: `Follow-up: ${question}`,
                        explanation: response.result,
                        timestamp: new Date().toISOString(),
                        paperTitle: this.paperMind.paperData?.title || document.title,
                        paperUrl: window.location.href,
                        isFollowUp: true
                    });
                }
            } catch (error) {
                loadingPopup.remove();
                if (this.paperMind.ui) {
                    this.paperMind.ui.showNotification('Failed to get answer', 'error');
                }
            }
        });

        dialog.querySelector('.followup-cancel').addEventListener('click', () => dialog.remove());
        dialog.querySelector('.followup-close').addEventListener('click', () => dialog.remove());
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) dialog.remove();
        });
    }

    // Study Notes Management

    async saveToStudyNotes(note) {
        try {
            const result = await chrome.storage.local.get(['studyNotes']);
            const studyNotes = result.studyNotes || [];
            studyNotes.push(note);
            await chrome.storage.local.set({ studyNotes });
            console.log('📝 Note saved');
            this.loadStudyNotes();
        } catch (error) {
            console.error('Error saving note:', error);
        }
    }

    async loadStudyNotes() {
        try {
            const result = await chrome.storage.local.get(['studyNotes']);
            const studyNotes = result.studyNotes || [];
            const notesList = document.getElementById('notes-list');
            if (!notesList) return;

            const currentNotes = studyNotes.filter(n => n.paperUrl === window.location.href);

            if (currentNotes.length === 0) {
                notesList.innerHTML = '<p class="notes-empty">No notes for this paper yet.</p>';
                return;
            }

            notesList.innerHTML = currentNotes.map((note, idx) => `
                <div class="note-item" data-index="${idx}">
                    <div class="note-header">
                        <span class="note-badge">${note.prompt}</span>
                        <button class="note-delete" data-index="${idx}">×</button>
                    </div>
                    <div class="note-text">
                        <strong>Selected:</strong> "${note.selectedText.substring(0, 60)}..."
                    </div>
                    <div class="note-explanation">
                        ${note.explanation.substring(0, 150)}${note.explanation.length > 150 ? '...' : ''}
                    </div>
                    <div class="note-footer">
                        <small>${new Date(note.timestamp).toLocaleString()}</small>
                    </div>
                </div>
            `).join('');

            notesList.querySelectorAll('.note-delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.deleteStudyNote(parseInt(e.target.dataset.index));
                });
            });
        } catch (error) {
            console.error('Error loading notes:', error);
        }
    }

    async deleteStudyNote(index) {
        try {
            const result = await chrome.storage.local.get(['studyNotes']);
            const studyNotes = result.studyNotes || [];
            const currentNotes = studyNotes.filter(n => n.paperUrl === window.location.href);

            if (index < currentNotes.length) {
                const noteToDelete = currentNotes[index];
                const globalIndex = studyNotes.indexOf(noteToDelete);
                studyNotes.splice(globalIndex, 1);
                await chrome.storage.local.set({ studyNotes });
                this.loadStudyNotes();
                if (this.paperMind.ui) {
                    this.paperMind.ui.showNotification('Note deleted', 'info');
                }
            }
        } catch (error) {
            console.error('Error deleting note:', error);
        }
    }

    async downloadStudyNotes() {
        try {
            const result = await chrome.storage.local.get(['studyNotes']);
            const studyNotes = result.studyNotes || [];
            const currentNotes = studyNotes.filter(n => n.paperUrl === window.location.href);

            if (currentNotes.length === 0) {
                if (this.paperMind.ui) {
                    this.paperMind.ui.showNotification('No notes to download', 'warning');
                }
                return;
            }

            const markdown = this.formatNotesAsMarkdown(currentNotes);
            const blob = new Blob([markdown], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `papermind-notes-${new Date().toISOString().split('T')[0]}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            if (this.paperMind.ui) {
                this.paperMind.ui.showNotification('Notes downloaded successfully!', 'success');
            }
        } catch (error) {
            console.error('Error downloading notes:', error);
        }
    }

    formatNotesAsMarkdown(notes) {
        const title = this.paperMind.paperData?.title || document.title;
        const url = window.location.href;
        const date = new Date().toLocaleDateString();

        let md = `# PaperMind Study Notes\n\n`;
        md += `**Paper:** ${title}\n**URL:** ${url}\n**Date:** ${date}\n**Total Notes:** ${notes.length}\n\n---\n\n`;

        notes.forEach((note, idx) => {
            md += `## Note ${idx + 1}: ${note.prompt}\n\n`;
            md += `**Selected Text:**\n> ${note.selectedText}\n\n`;
            md += `**Explanation:**\n${note.explanation}\n\n`;
            md += `**Time:** ${new Date(note.timestamp).toLocaleString()}\n\n`;
            if (note.isFollowUp) md += `*Follow-up question*\n\n`;
            md += `---\n\n`;
        });

        md += `\n*Generated by PaperMind*\n`;
        return md;
    }
}

// Export
window.PaperMindHighlights = PaperMindHighlights;

