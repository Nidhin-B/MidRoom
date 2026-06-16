/* ==========================================================================
   MIDROOM — CORE CANVAS ENGINES, VAULT HOOKS & SEPARATED DOUBLE-TAP RENAMING
   ========================================================================== */

// 1. DOM SELECTORS
const textInput = document.getElementById('text-input');
const wordCountSpan = document.getElementById('word-count');
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const closeSidebar = document.getElementById('close-sidebar');
const draftsList = document.getElementById('drafts-list');
const saveBtn = document.getElementById('save-btn');
const copyBtn = document.getElementById('copy-btn');
const downloadBtn = document.getElementById('download-btn');

// 2. REAL-TIME WORD COUNTER SYSTEM
textInput.addEventListener('input', () => {
    const text = textInput.value.trim();
    const words = text === '' ? 0 : text.split(/\s+/).length;
    wordCountSpan.textContent = words;
});

// 3. ENCHANTED VAULT SIDEBAR MECHANICS
menuToggle.addEventListener('click', () => {
    renderDrafts();
    sidebar.classList.add('active');
});

closeSidebar.addEventListener('click', () => {
    sidebar.classList.remove('active');
});

// Close sidebar on tapping back into the canvas
textInput.addEventListener('focus', () => {
    sidebar.classList.remove('active');
});

// 4. STORAGE PRIMITIVES MANAGEMENT (LOCALSTORAGE VAULT)
function getDrafts() {
    const drafts = localStorage.getItem('midroom_drafts');
    return drafts ? JSON.parse(drafts) : [];
}

function saveDraftToVault() {
    const text = textInput.value.trim();
    if (!text) return;

    const drafts = getDrafts();
    const firstLine = text.split('\n')[0].substring(0, 25) || "Untitled Draft";
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newDraft = {
        id: Date.now(),
        title: firstLine + '...',
        content: text,
        time: timestamp
    };

    drafts.unshift(newDraft);
    localStorage.setItem('midroom_drafts', JSON.stringify(drafts));
    
    const originalText = saveBtn.textContent;
    saveBtn.textContent = "Saved ✔";
    saveBtn.style.color = "#a7f3d0";
    setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.style.color = "";
    }, 1500);
}

function deleteDraft(id, event) {
    event.stopPropagation(); 
    let drafts = getDrafts();
    drafts = drafts.filter(draft => draft.id !== id);
    localStorage.setItem('midroom_drafts', JSON.stringify(drafts));
    renderDrafts();
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
}

function loadDraft(content) {
    textInput.value = content;
    textInput.dispatchEvent(new Event('input')); 
    sidebar.classList.remove('active');
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

        // MULTI-CLICK TIMING HANDLER (Flashes out double tap vs single tap accurately)
        let clickCount = 0;
        let clickTimer;

        titleContainer.addEventListener('click', (e) => {
            e.preventDefault();
            
            // If they are already editing, stop clicks entirely
            if (titleContainer.querySelector('input')) return;

            clickCount++;

            if (clickCount === 1) {
                // Wait 250ms to check if a second tap follows
                clickTimer = setTimeout(() => {
                    clickCount = 0; // Reset counter
                    loadDraft(draft.content); // Execute standard single tap action safely
                }, 250);
            } else if (clickCount === 2) {
                clearTimeout(clickTimer); // Stop the single click action from loading the draft
                clickCount = 0; // Reset counter
                triggerRenameInterface(); // Fire custom renaming system instantly
            }
        });

        // THE RENDERING LOGIC FOR INLINE EDITOR FIELD
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
saveBtn.addEventListener('click', saveDraftToVault);

copyBtn.addEventListener('click', () => {
    if (!textInput.value) return;
    navigator.clipboard.writeText(textInput.value);
    
    const originalText = copyBtn.textContent;
    copyBtn.textContent = "Copied!";
    setTimeout(() => copyBtn.textContent = originalText, 1500);
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
});


/* ==========================================================================
   6. AMBIENT JUNGLE PARTICLE ENGINE
   ========================================================================== */
const canvas = document.getElementById('ambient-canvas');
const ctx = canvas.getContext('2d');

let particlesArray = [];
const maxParticles = 40; 

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
        this.size = Math.random() * 2.5 + 0.5; 
        this.speedX = Math.random() * 0.4 - 0.2; 
        this.speedY = -(Math.random() * 0.5 + 0.1); 
        this.alpha = Math.random() * 0.5 + 0.1; 
        this.fadeSpeed = Math.random() * 0.005 + 0.002;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.y < 0 || this.x < 0 || this.x > canvas.width) {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + Math.random() * 20;
            this.alpha = 0; 
        }

        if (this.alpha < 0.6) {
            this.alpha += this.fadeSpeed;
        }
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        
        ctx.fillStyle = '#52796f';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#355245';
        
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
