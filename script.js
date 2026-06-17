/* ==========================================================================
   MIDROOM — RUNTIME LOGIC ENGINE + FLOATING PARTICLES RESTORED
   ========================================================================= */

document.addEventListener('DOMContentLoaded', () => {
    // Core Elements
    const textInput = document.getElementById('text-input');
    const wordCount = document.getElementById('word-count');
    const statusIndicator = document.getElementById('status-indicator');
    
    // Core Interactive Triggers
    const saveBtn = document.getElementById('save-btn');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');
    const menuToggle = document.getElementById('menu-toggle');
    const newCanvasBtn = document.getElementById('new-canvas-btn');
    const closeSidebar = document.getElementById('close-sidebar');
    
    // Drawer/Alert Components
    const sidebar = document.getElementById('sidebar');
    const draftsList = document.getElementById('drafts-list');
    const toastNotification = document.getElementById('toast-notification');

    let currentDraftId = null;

    // 1. PARTICLES ENGINE RESTORED (Lightweight float forest dust)
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
            this.y = Math.random() * canvas.height; // Spread out initially
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + 10;
            this.size = Math.random() * 1.3 + 0.6; // Small lightweight specs
            this.speedY = -(Math.random() * 0.25 + 0.1); // Slow, calm upward crawl
            this.speedX = (Math.random() - 0.5) * 0.15;
            this.alpha = Math.random() * 0.35 + 0.1;
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
            ctx.fillStyle = `rgba(167, 243, 208, ${this.alpha})`;
            ctx.fill();
        }
    }

    // Spawn 35 organic floating specs
    for (let i = 0; i < 35; i++) {
        particles.push(new DustParticle());
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Let CSS handle the background gradient flawlessly
        
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animateParticles);
    }
    animateParticles();

    // 2. WORD COUNTER
    function updateWordCount() {
        const text = textInput.value.trim();
        wordCount.textContent = text === '' ? 0 : text.split(/\s+/).length;
    }
    textInput.addEventListener('input', updateWordCount);

    // Toast Messenger Alerts
    function showToast(message) {
        toastNotification.textContent = message;
        toastNotification.classList.add('show');
        setTimeout(() => toastNotification.classList.remove('show'), 2000);
    }

    // Local Storage Communication Link
    function getDrafts() {
        return JSON.parse(localStorage.getItem('midroom_drafts')) || [];
    }

    function saveDrafts(draftsArr) {
        localStorage.setItem('midroom_drafts', JSON.stringify(draftsArr));
    }

    // Render Drafts Inside Sidebar Panel Drawer
    function displayDrafts() {
        draftsList.innerHTML = '';
        const drafts = getDrafts();

        if (drafts.length === 0) {
            draftsList.innerHTML = '<li style="color: #2b5742; font-style: italic; padding: 10px 0; border: none; background: transparent;">The Vault is empty...</li>';
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

            // Row Interaction: Load selected payload data on normal click
            li.addEventListener('click', () => {
                currentDraftId = draft.id;
                textInput.value = draft.content;
                updateWordCount();
                statusIndicator.textContent = "Draft Restored";
                sidebar.classList.remove('active');
                showToast("Loaded entry");
            });

            // SAFE DOUBLE TAP RENAME
            li.addEventListener('dblclick', (e) => {
                e.stopPropagation(); 
                const newTitle = prompt("Rename your draft log entry:", titleSpan.textContent);
                if (newTitle !== null && newTitle.trim() !== "") {
                    const savedList = getDrafts();
                    const targetIdx = savedList.findIndex(d => d.id === draft.id);
                    if (targetIdx !== -1) {
                        savedList[targetIdx].title = newTitle.trim();
                        saveDrafts(savedList);
                        titleSpan.textContent = newTitle.trim();
                        showToast("Draft renamed");
                    }
                }
            });

            // Trash Button Setup
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

            li.appendChild(detailsDiv);
            li.appendChild(deleteBtn);
            draftsList.appendChild(li);
        });
    }

    // Core Toolbar Save Command
    saveBtn.addEventListener('click', () => {
        const payload = textInput.value;
        if (!payload.trim()) {
            showToast("Cannot preserve an empty room");
            return;
        }

        const drafts = getDrafts();
        
        if (currentDraftId) {
            const index = drafts.findIndex(d => d.id === currentDraftId);
            if (index !== -1) {
                drafts[index].content = payload;
                drafts[index].updatedAt = new Date().toISOString();
                saveDrafts(drafts);
                statusIndicator.textContent = "Saved to Vault";
                showToast("Entry updated");
            }
        } else {
            const uniqueId = 'draft_' + Date.now();
            const timeString = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const newDraft = {
                id: uniqueId,
                title: `Draft (${timeString})`,
                content: payload,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            drafts.unshift(newDraft);
            saveDrafts(drafts);
            currentDraftId = uniqueId;
            statusIndicator.textContent = "Saved to Vault";
            showToast("Added into private records");
        }
        displayDrafts();
    });

    // Copy Command Execution
    copyBtn.addEventListener('click', () => {
        if (!textInput.value.trim()) {
            showToast("Nothing to copy");
            return;
        }
        navigator.clipboard.writeText(textInput.value)
            .then(() => showToast("Copied content"))
            .catch(() => showToast("Clipboard action failed"));
    });

    // Export System
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

    // Drawer Management Controls
    menuToggle.addEventListener('click', () => {
        displayDrafts();
        sidebar.classList.add('active');
    });

    closeSidebar.addEventListener('click', () => {
        sidebar.classList.remove('active');
    });

    newCanvasBtn.addEventListener('click', () => {
        currentDraftId = null;
        textInput.value = '';
        updateWordCount();
        statusIndicator.textContent = "Private Room";
        showToast("New blank room initialized");
    });
});
