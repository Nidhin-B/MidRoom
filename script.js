/* ==========================================================================
   MIDROOM — FULL ENGINE: AUTO-SAVE, MANUAL SAVE, & INLINE RENAME
   ========================================================================= */

document.addEventListener('DOMContentLoaded', () => {
    const textInput = document.getElementById('text-input');
    const wordCount = document.getElementById('word-count');
    const statusIndicator = document.getElementById('status-indicator');
    
    // Core Actions
    const saveBtn = document.getElementById('save-btn');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');
    
    // Navigation & Sidebar
    const menuToggle = document.getElementById('menu-toggle');
    const newCanvasBtn = document.getElementById('new-canvas-btn');
    const closeSidebar = document.getElementById('close-sidebar');
    const sidebar = document.getElementById('sidebar');
    const draftsList = document.getElementById('drafts-list');
    const toastNotification = document.getElementById('toast-notification');

    let currentDraftId = null;
    let autoSaveTimeout = null;

    // 1. FOREST DUST ENGINE (Renders the background atmosphere)
    const canvas = document.getElementById('ambient-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class DustParticle {
        constructor() {
            this.reset();
            this.y = Math.random() * canvas.height;
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + 10;
            this.size = Math.random() * 1.4 + 0.5; 
            this.speedY = -(Math.random() * 0.20 + 0.08); 
            this.speedX = (Math.random() - 0.5) * 0.12;
            this.alpha = Math.random() * 0.40 + 0.15;
        }
        update() {
            this.y += this.speedY;
            this.x += this.speedX;
            if (this.y < -10 || this.x < 0 || this.x > canvas.width) {
                this.reset();
            }
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(134, 239, 172, ${this.alpha})`;
            ctx.fill();
        }
    }

    for (let i = 0; i < 40; i++) {
        particles.push(new DustParticle());
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animateParticles);
    }
    animateParticles();

    // 2. INTERFACE HELPERS
    function updateWordCount() {
        const text = textInput.value.trim();
        wordCount.textContent = text === '' ? 0 : text.split(/\s+/).length;
    }

    function showToast(message) {
        toastNotification.textContent = message;
        toastNotification.classList.add('show');
        setTimeout(() => toastNotification.classList.remove('show'), 2000);
    }

    // 3. STORAGE ACCESS
    function getDrafts() {
        return JSON.parse(localStorage.getItem('midroom_drafts')) || [];
    }

    function saveDrafts(draftsArr) {
        localStorage.setItem('midroom_drafts', JSON.stringify(draftsArr));
    }

    // 4. THE CORE SAVE FUNCTION (Shared by manual and auto-save)
    function saveCurrentProgress(isManual = false) {
        const payload = textInput.value;
        if (!payload.trim() && !currentDraftId) {
            if (isManual) showToast("Cannot preserve an empty room");
            return;
        }

        const drafts = getDrafts();
        statusIndicator.textContent = isManual ? "Saving Entry..." : "Auto-saving...";
        statusIndicator.style.color = "#86efac";

        if (currentDraftId) {
            const index = drafts.findIndex(d => d.id === currentDraftId);
            if (index !== -1) {
                drafts[index].content = payload;
                drafts[index].updatedAt = new Date().toISOString();
                saveDrafts(drafts);
            }
        } else {
            currentDraftId = 'draft_' + Date.now();
            const timeString = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const newDraft = {
                id: currentDraftId,
                title: `Draft (${timeString})`,
                content: payload,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            drafts.unshift(newDraft);
            saveDrafts(drafts);
        }

        setTimeout(() => {
            statusIndicator.textContent = "Saved to Vault";
            statusIndicator.style.color = "#3b6b53";
            if (isManual) showToast("Entry preserved");
        }, 500);
    }

    // Trigger Auto-save while typing
    textInput.addEventListener('input', () => {
        updateWordCount();
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => saveCurrentProgress(false), 1500);
    });

    // Trigger Manual Save on click
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            clearTimeout(autoSaveTimeout);
            saveCurrentProgress(true);
        });
    }

    // 5. SIDEBAR DRAWER WITH MINIMALIST INLINE RENAMING
    function displayDrafts() {
        draftsList.innerHTML = '';
        const drafts = getDrafts();

        if (drafts.length === 0) {
            draftsList.innerHTML = '<li style="color: #1e4231; font-style: italic; padding: 10px 0; border: none; background: transparent;">The Vault is empty...</li>';
            return;
        }

        drafts.forEach((draft, index) => {
            const li = document.createElement('li');
            li.className = 'draft-item';
            if (draft.id === currentDraftId) li.classList.add('selected');

            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'draft-details';
            
            const titleSpan = document.createElement('span');
            titleSpan.className = 'draft-title-text';
            titleSpan.textContent = draft.title || `Untitled Log ${index + 1}`;
            detailsDiv.appendChild(titleSpan);

            // Click row to open entry
            li.addEventListener('click', () => {
                if (detailsDiv.querySelector('input')) return; // Block loading if currently renaming
                
                currentDraftId = draft.id;
                textInput.value = draft.content;
                updateWordCount();
                statusIndicator.textContent = "Draft Restored";
                sidebar.classList.remove('active');
                showToast("Loaded entry");
            });

            // Double click title text to rename inline inside the row
            li.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                if (detailsDiv.querySelector('input')) return;

                const currentName = titleSpan.textContent;
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'inline-rename-input';
                input.value = currentName;

                detailsDiv.innerHTML = '';
                detailsDiv.appendChild(input);
                input.focus();
                input.select();

                function commitInlineRename() {
                    const newTitle = input.value.trim();
                    detailsDiv.innerHTML = ''; 
                    
                    if (newTitle !== "" && newTitle !== currentName) {
                        const savedList = getDrafts();
                        const targetIdx = savedList.findIndex(d => d.id === draft.id);
                        if (targetIdx !== -1) {
                            savedList[targetIdx].title = newTitle;
                            saveDrafts(savedList);
                            draft.title = newTitle;
                        }
                        titleSpan.textContent = newTitle;
                    } else {
                        titleSpan.textContent = currentName;
                    }
                    detailsDiv.appendChild(titleSpan);
                }

                input.addEventListener('keydown', (evt) => {
                    if (evt.key === 'Enter') {
                        evt.preventDefault();
                        commitInlineRename();
                    }
                });
                input.addEventListener('blur', commitInlineRename);
            });

            // Delete entry button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-draft-btn';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); 
                let activeDrafts = getDrafts().filter(d => d.id !== draft.id);
                saveDrafts(activeDrafts);
                
                if (currentDraftId === draft.id) {
                    currentDraftId = null;
                    textInput.value = '';
                    updateWordCount();
                    statusIndicator.textContent = "Private Room";
                }
                displayDrafts();
                showToast("Draft wiped");
            });

            detailsDiv.appendChild(titleSpan);
            li.appendChild(detailsDiv);
            li.appendChild(deleteBtn);
            draftsList.appendChild(li);
        });
    }

    // 6. BOTTOM TOOLBAR CONTROLS
    copyBtn.addEventListener('click', () => {
        if (!textInput.value.trim()) {
            showToast("Nothing to copy");
            return;
        }
        navigator.clipboard.writeText(textInput.value)
            .then(() => showToast("Copied content"))
            .catch(() => showToast("Clipboard action failed"));
    });

    downloadBtn.addEventListener('click', () => {
        const value = textInput.value;
        if (!value.trim()) {
            showToast("Write something before exporting");
            return;
        }
        const textBlob = new Blob([value], { type: 'text/plain' });
        const downloadUrl = URL.createObjectURL(textBlob);
        const trackingLink = document.createElement('a');
        trackingLink.download = `midroom_${Date.now()}.txt`;
        trackingLink.href = downloadUrl;
        document.body.appendChild(trackingLink);
        trackingLink.click();
        document.body.removeChild(trackingLink);
        URL.revokeObjectURL(downloadUrl);
    });

    menuToggle.addEventListener('click', () => {
        displayDrafts();
        sidebar.classList.add('active');
    });

    closeSidebar.addEventListener('click', () => {
        sidebar.classList.remove('active');
    });

    newCanvasBtn.addEventListener('click', () => {
        clearTimeout(autoSaveTimeout);
        currentDraftId = null;
        textInput.value = '';
        updateWordCount();
        statusIndicator.textContent = "Private Room";
        showToast("New blank room initialized");
    });
});
