/* ==========================================================================
   MIDROOM — FULL WEB RUNTIME CONTROLLER ENGINE WITH IN-PLACE EDITABLE RENAME
   ========================================================================= */

document.addEventListener('DOMContentLoaded', () => {
    // Core Application Elements
    const textInput = document.getElementById('text-input');
    const wordCount = document.getElementById('word-count');
    const statusIndicator = document.getElementById('status-indicator');
    
    // Core Button Targets
    const saveBtn = document.getElementById('save-btn');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');
    const menuToggle = document.getElementById('menu-toggle');
    const newCanvasBtn = document.getElementById('new-canvas-btn');
    const closeSidebar = document.getElementById('close-sidebar');
    
    // Structural Sidebar Contexts
    const sidebar = document.getElementById('sidebar');
    const draftsList = document.getElementById('drafts-list');
    const toastNotification = document.getElementById('toast-notification');

    let currentDraftId = null;

    // 1. LIVE ATMOSPHERIC ANIMATION SYSTEM (Background Canvas Dust Matrix)
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
            this.y = Math.random() * canvas.height; // Spread initially over viewport
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + 10;
            this.size = Math.random() * 1.5 + 0.5;
            this.speedY = -(Math.random() * 0.4 + 0.15);
            this.speedX = (Math.random() - 0.5) * 0.2;
            this.alpha = Math.random() * 0.5 + 0.1;
            this.fadeSpeed = Math.random() * 0.005 + 0.002;
        }
        update() {
            this.y += this.speedY;
            this.x += this.speedX;
            // Pinned upward ambient light fades particles gently down near the dark threshold
            if (this.y < canvas.height * 0.15) {
                this.alpha -= this.fadeSpeed;
            }
            if (this.y < -10 || this.alpha <= 0 || this.x < 0 || this.x > canvas.width) {
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

    // Initialize 45 subtle float particles
    for (let i = 0; i < 45; i++) {
        particles.push(new DustParticle());
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }
    animate();

    // 2. TEXT MANAGEMENT LOGIC & CALCULATOR METRICS
    function updateWordCount() {
        const text = textInput.value.trim();
        const count = text === '' ? 0 : text.split(/\s+/).length;
        wordCount.textContent = count;
    }
    textInput.addEventListener('input', updateWordCount);

    function showToast(message) {
        toastNotification.textContent = message;
        toastNotification.classList.add('show');
        setTimeout(() => {
            toastNotification.classList.remove('show');
        }, 2500);
    }

    // 3. EDITABLE DRAFTS STORAGE PERSISTENCE ENGINE
    function getDrafts() {
        return JSON.parse(localStorage.getItem('midroom_drafts')) || [];
    }

    function saveDrafts(draftsArr) {
        localStorage.setItem('midroom_drafts', JSON.stringify(draftsArr));
    }

    function displayDrafts() {
        draftsList.innerHTML = '';
        const drafts = getDrafts();

        if (drafts.length === 0) {
            draftsList.innerHTML = '<li style="color: #2b4c3d; font-style: italic; border: none; background: transparent;">The Vault is empty...</li>';
            return;
        }

        drafts.forEach((draft, index) => {
            const li = document.createElement('li');
            li.className = 'draft-item';
            if (draft.id === currentDraftId) {
                li.style.borderColor = '#355e4c';
                li.style.background = 'rgba(32, 69, 52, 0.15)';
            }

            // IN-PLACE RENAME INTERACTIVE ELEMENT INPUT
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.className = 'draft-name-input';
            nameInput.value = draft.title || `Draft ${index + 1}`;
            
            // Commit changes when user hits Enter key or taps elsewhere
            const processRename = () => {
                const cleanedName = nameInput.value.trim();
                if (cleanedName && cleanedName !== draft.title) {
                    const savedList = getDrafts();
                    const targetIndex = savedList.findIndex(d => d.id === draft.id);
                    if (targetIndex !== -1) {
                        savedList[targetIndex].title = cleanedName;
                        saveDrafts(savedList);
                        showToast("Draft renamed successfully");
                    }
                }
            };

            nameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    nameInput.blur(); // Drops programmatic focus to fire blur listener
                }
            });
            nameInput.addEventListener('blur', processRename);
            
            // Stop input click bubbles from triggering full board resets
            nameInput.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            // Tap row wrapper to load draft payload container content
            li.addEventListener('click', () => {
                currentDraftId = draft.id;
                textInput.value = draft.content;
                updateWordCount();
                statusIndicator.textContent = "Draft Restored";
                sidebar.classList.remove('active');
                showToast("Loaded from Vault");
            });

            // Delete action button layout link
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-draft-btn';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Avoid triggering open functions on delete clicks
                let activeDrafts = getDrafts();
                activeDrafts = activeDrafts.filter(d => d.id !== draft.id);
                saveDrafts(activeDrafts);
                
                if (currentDraftId === draft.id) {
                    currentDraftId = null;
                    textInput.value = '';
                    updateWordCount();
                    statusIndicator.textContent = "Private Room";
                }
                displayDrafts();
                showToast("Draft permanently wiped");
            });

            li.appendChild(nameInput);
            li.appendChild(deleteBtn);
            draftsList.appendChild(li);
        });
    }

    // 4. ACTION TRIGGERS & REGISTERED INTERFACES
    saveBtn.addEventListener('click', () => {
        const payload = textInput.value;
        if (!payload.trim()) {
            showToast("Cannot preserve an empty room");
            return;
        }

        const drafts = getDrafts();
        
        if (currentDraftId) {
            // Overwrite actively selected open working copy item
            const index = drafts.findIndex(d => d.id === currentDraftId);
            if (index !== -1) {
                drafts[index].content = payload;
                drafts[index].updatedAt = new Date().toISOString();
                saveDrafts(drafts);
                statusIndicator.textContent = "Saved to Vault";
                showToast("Updated existing entry");
            }
        } else {
            // Append clean new standalone file entry object container
            const uniqueId = 'draft_' + Date.now();
            const newDraft = {
                id: uniqueId,
                title: `Draft (${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})`,
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

    // Universal Text Copy Operation
    copyBtn.addEventListener('click', () => {
        if (!textInput.value.trim()) {
            showToast("No writing content discovered to copy");
            return;
        }
        textInput.select();
        textInput.setSelectionRange(0, 99999); // Mobile compliance security safeguard fallback
        navigator.clipboard.writeText(textInput.value)
            .then(() => showToast("Copied content clip board"))
            .catch(() => showToast("Transfer fail, trace permissions"));
    });

    // Native Local Text Document Compilation Downloader
    downloadBtn.addEventListener('click', () => {
        const value = textInput.value;
        if (!value.trim()) {
            showToast("Write your logs before exporting files");
            return;
        }
        const textBlob = new Blob([value], { type: 'text/plain' });
        const downloadUrl = URL.createObjectURL(textBlob);
        const trackingLink = document.createElement('a');
        
        trackingLink.download = `midroom_entry_${Date.now()}.txt`;
        trackingLink.href = downloadUrl;
        document.body.appendChild(trackingLink);
        trackingLink.click();
        document.body.removeChild(trackingLink);
        URL.revokeObjectURL(downloadUrl);
        showToast("Log downloaded");
    });

    // 5. SIDEBAR OVERLAY MANAGEMENT ACTIONS
    menuToggle.addEventListener('click', () => {
        displayDrafts();
        sidebar.classList.add('active');
    });

    closeSidebar.addEventListener('click', () => {
        sidebar.classList.remove('active');
    });

    // New clear window workspace option resets active session pointers
    newCanvasBtn.addEventListener('click', () => {
        currentDraftId = null;
        textInput.value = '';
        updateWordCount();
        statusIndicator.textContent = "Private Room";
        showToast("Cleared canvas editor screen");
    });

    // Global background body panel event drops side drawer toggles if opened
    document.addEventListener('click', (event) => {
        if (!sidebar.contains(event.target) && event.target !== menuToggle && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
        }
    });
});
