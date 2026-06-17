/* ==========================================================================
   MIDROOM — CORE CANVAS ENGINES, AUTO-SAVE VAULT & TOAST NOTIFICATIONS
   ========================================================================== */

// 1. DOM SELECTORS
const textInput = document.getElementById('text-input');
const wordCountSpan = document.getElementById('word-count');
const menuToggle = document.getElementById('menu-toggle');
const newCanvasBtn = document.getElementById('new-canvas-btn');
const statusIndicator = document.getElementById('status-indicator');
const sidebar = document.getElementById('sidebar');
const closeSidebar = document.getElementById('close-sidebar');
const draftsList = document.getElementById('drafts-list');
const saveBtn = document.getElementById('save-btn');
const copyBtn = document.getElementById('copy-btn');
const downloadBtn = document.getElementById('download-btn');
const toast = document.getElementById('toast-notification');

// TRACKER FOR CURRENT ACTIVE WORKING FILE
let currentDraftId = null;
let autoSaveTimer = null;

// 2. REAL-TIME WORD COUNTER & PROFESSIONAL AUTO-SAVE PIPELINE
textInput.addEventListener('input', () => {
    // Word counter execution
    const text = textInput.value.trim();
    const words = text === '' ? 0 : text.split(/\s+/).length;
    wordCountSpan.textContent = words;

    // Trigger professional background auto-save loop
    if (text.length > 0) {
        statusIndicator.textContent = "typing...";
        statusIndicator.style.color = "#4f7466";
        
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(() => {
            autoSaveDraft();
        }, 1500); // Wait for 1.5 seconds of absolute silence to save
    }
});

// PROFESSIONAL SYSTEM TOAST NOTIFICATION BOX
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// 3. ENCHANTED VAULT SIDEBAR & NEW PAGE CANVAS RESET HOOKS
menuToggle.addEventListener('click', () => {
    renderDrafts();
    sidebar.classList.add('active');
});

closeSidebar.addEventListener('click', () => {
    sidebar.classList.remove('active');
});

textInput.addEventListener('focus', () => {
    sidebar.classList.remove('active');
});

// NEW CANVAS RESET MECHANIC
newCanvasBtn.addEventListener('click', () => {
    if (textInput.value.trim() === "") return;
    
    // Auto-save whatever is currently active before clearing
    autoSaveDraft();
    
    // Wipe layout elements clean
    textInput.value = "";
    currentDraftId = null;
    wordCountSpan.textContent = "0";
    statusIndicator.textContent = "Private Room";
    statusIndicator.style.color = "";
    
    showToast("Opened a fresh canvas void");
});

// 4. STORAGE PRIMITIVES MANAGEMENT (LOCALSTORAGE AUTO-SAVE INTEGRATED)
function getDrafts() {
    const drafts = localStorage.getItem('midroom_drafts');
    return drafts ? JSON.parse(drafts) : [];
}

function autoSaveDraft() {
    const text = textInput.value.trim();
    if (!text) return;

    let drafts = getDrafts();
    const firstLine = text.split('\n')[0].substring(0, 25) || "Untitled Draft";
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (currentDraftId === null) {
        // Create an entirely new working database entry
        currentDraftId = Date.now();
        const newDraft = {
            id: currentDraftId,
            title: firstLine + '...',
            content: text,
            time: timestamp
        };
        drafts.unshift(newDraft);
    } else {
        // Update the pre-existing file entry seamlessly
        drafts = drafts.map(draft => {
            if (draft.id === currentDraftId) {
                draft.title = firstLine + '...';
                draft.content = text;
                draft.time = timestamp;
            }
            return draft;
        });
    }

    localStorage.setItem('midroom_drafts', JSON.stringify(drafts));
    statusIndicator.textContent = "Saved to Vault";
    statusIndicator.style.color = "#a7f3d0";
}

// Manual Save button trigger wraps gracefully into auto-save engine
function manualSaveDraftToVault() {
    if (!textInput.value.trim()) {
        showToast("Cannot save an empty canvas");
        return;
    }
    autoSaveDraft();
    showToast("Draft securely cataloged");
}

function deleteDraft(id, event) {
    event.stopPropagation(); 
    let drafts = getDrafts();
    drafts = drafts.filter(draft => draft.id !== id);
    localStorage.setItem('midroom_drafts', JSON.stringify(drafts));
    
    // If we delete the file we are actively writing on, unlink tracker safely
    if (currentDraftId === id) {
        currentDraftId = null;
    }
    
    renderDrafts();
    showToast("Draft turned to ash");
}

function renameDraft(id, newTitle) {
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle) return; 

    let drafts = getDrafts();
    drafts = drafts.map(draft => {
        if (draft.id === id) {
            draft.title = trimmedTitle;
        }
        return draft;
    });
    localStorage.setItem('midroom_drafts', JSON.stringify(drafts));
    renderDrafts();
    showToast("Vault index updated");
}

function loadDraft(draftObj) {
    currentDraftId = draftObj.id;
    textInput.value = draftObj.content;
    
    // Fire off manual event handler to recalibrate word indicators
    textInput.dispatchEvent(new Event('input')); 
    
    statusIndicator.textContent = "Editing Draft";
    statusIndicator.style.color = "#52796f";
    
    sidebar.classList.remove('active');
    showToast(`Loaded: ${draftObj.title}`);
}

function renderDrafts() {
    draftsList.innerHTML = '';
    const drafts = getDrafts();

    if (drafts.length === 0) {
        draftsList.innerHTML = `<li style="background: transparent; color: #1a3325; font-style: italic; cursor: default;">Vault is empty...</li>`;
        return;
    }

    drafts.forEach(draft => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="draft-title-container" style="display: flex; flex-direction: column; flex: 1; margin-right: 10px;">
                <span class="title-text" style="font-weight: 500; word-break: break-all;">${draft.title}</span>
                <small style="color: #2f4f3e; margin-top: 2px; font-family: sans-serif; font-size: 0.75rem;">${draft.time} • Double tap to rename</small>
            </span>
            <button class="delete-draft-btn" data-id="${draft.id}">&times;</button>
        `;
        
        const titleContainer = li.querySelector('.draft-title-container');
        const titleTextSpan = li.querySelector('.title-text');

        let clickCount = 0;
        let clickTimer;

        titleContainer.addEventListener('click', (e) => {
            e.preventDefault();
            if (titleContainer.querySelector('input')) return;

            clickCount++;

            if (clickCount === 1) {
                clickTimer = setTimeout(() => {
                    clickCount = 0;
                    loadDraft(draft); // Load full object details cleanly
                }, 250);
            } else if (clickCount === 2) {
                clearTimeout(clickTimer);
                clickCount = 0;
                triggerRenameInterface();
            }
        });

        function triggerRenameInterface() {
            if (titleContainer.querySelector('input')) return;

            const currentTitle = titleTextSpan.textContent;
            const input = document.createElement('input');
            input.type = 'text';
            input.value = currentTitle;
            
            input.style.background = '#0a0f0d';
            input.style.border = '1px solid #1f3a2b';
            input.style.color = '#cbd5e1';
            input.style.padding = '6px 10px';
            input.style.borderRadius = '4px';
            input.style.fontSize = '0.85rem';
            input.style.fontFamily = 'inherit';
            input.style.width = '100%';
            input.style.marginTop = '6px';

            titleTextSpan.style.display = 'none';
            titleContainer.insertBefore(input, titleTextSpan);
            input.focus();
            
            setTimeout(() => input.select(), 50);

            const saveRename = () => {
                const updatedTitle = input.value;
                if (updatedTitle && updatedTitle !== currentTitle) {
                    renameDraft(draft.id, updatedTitle);
                } else {
                    input.remove();
                    titleTextSpan.style.display = 'block';
                }
            };

            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    saveRename();
                }
                if (event.key === 'Escape') {
                    input.remove();
                    titleTextSpan.style.display = 'block';
                }
            });

            input.addEventListener('blur', saveRename);
        }
        
        const delBtn = li.querySelector('.delete-draft-btn');
        delBtn.addEventListener('click', (e) => deleteDraft(draft.id, e));

        draftsList.appendChild(li);
    });
}

// 5. UTILITY ACTION ACCESSORS
saveBtn.addEventListener('click', manualSaveDraftToVault);

copyBtn.addEventListener('click', () => {
    if (!textInput.value) return;
    navigator.clipboard.writeText(textInput.value);
    showToast("Copied to clipboard");
});

downloadBtn.addEventListener('click', () => {
    const text = textInput.value;
    if (!text) return;

    const blob = new Blob([text], { type: 'text/plain' });
    const anchor = document.createElement('a');
    anchor.download = `midroom_draft_${Date.now()}.txt`;
    anchor.href = window.URL.createObjectURL(blob);
    anchor.target = '_blank';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    showToast("Downloaded .txt file");
});


/* ==========================================================================
   6. UPGRADED MULTI-TONE AMBIENT PARTICLE ENGINE
   ========================================================================== */
const canvas = document.getElementById('ambient-canvas');
const ctx = canvas.getContext('2d');

let particlesArray = [];
const maxParticles = 45; 
const forestColors = ['#3f5e52', '#52796f', '#71978c', '#2f4f43'];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class SporeParticle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height; 
        this.size = Math.random() * 2.8 + 0.4; 
        this.speedX = Math.random() * 0.3 - 0.15; 
        this.speedY = -(Math.random() * 0.4 + 0.1); 
        this.alpha = Math.random() * 0.4 + 0.05; 
        this.fadeSpeed = Math.random() * 0.004 + 0.001;
        this.color = forestColors[Math.floor(Math.random() * forestColors.length)];
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.y < 0 || this.x < 0 || this.x > canvas.width) {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + Math.random() * 20;
            this.alpha = 0; 
        }

        if (this.alpha < 0.5) {
            this.alpha += this.fadeSpeed;
        }
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = this.size * 3;
        ctx.shadowColor = '#1f3a2b';
        ctx.fill();
        ctx.restore();
    }
}

function initParticles() {
    particlesArray = [];
    for (let i = 0; i < maxParticles; i++) {
        let p = new SporeParticle();
        p.y = Math.random() * canvas.height; 
        particlesArray.push(p);
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
    }
    requestAnimationFrame(animateParticles);
}

initParticles();
animateParticles();
