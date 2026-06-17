// ==========================================================================
// MIDROOM — CORE ARCHITECTURE & PARTICLE ENGINE (REMASTERED FIX)
// ==========================================================================

// 1. DOM ELEMENT REGISTRATION
const textInput = document.getElementById('text-input');
const wordCountSpan = document.getElementById('word-count');
const statusIndicator = document.getElementById('status-indicator');
const menuToggle = document.getElementById('menu-toggle');
const closeSidebar = document.getElementById('close-sidebar');
const sidebar = document.getElementById('sidebar');
const draftsList = document.getElementById('drafts-list');
const saveBtn = document.getElementById('save-btn');
const copyBtn = document.getElementById('copy-btn');
const downloadBtn = document.getElementById('download-btn');
const newCanvasBtn = document.getElementById('new-canvas-btn');
const toast = document.getElementById('toast-notification');

let autoSaveTimer = null;
let currentDraftId = null;

// 2. REAL-TIME WORD COUNTER & AUTO-SAVE (FIXED FOR GHOST SPACES)
textInput.addEventListener('input', () => {
    const rawText = textInput.value;
    const trimmedText = rawText.trim();
    
    // Word counter execution
    const words = trimmedText === '' ? 0 : trimmedText.split(/\s+/).length;
    wordCountSpan.textContent = words;

    // Only trigger typing states if there's ACTUAL text written
    if (trimmedText.length > 0) {
        statusIndicator.textContent = "typing...";
        statusIndicator.style.color = "#3f6356";
        
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(() => {
            autoSaveDraft();
        }, 1500); 
    } else {
        // Clear timer and reset instantly if empty or just spaces
        clearTimeout(autoSaveTimer);
        statusIndicator.textContent = "Private Room";
        statusIndicator.style.color = "#1f3a2d";
    }
});

// 3. TOAST NOTIFICATION ENGINE
function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// 4. THE VAULT CORE DATA ACTIONS
function autoSaveDraft() {
    const text = textInput.value.trim();
    if (!text) return;

    let drafts = JSON.parse(localStorage.getItem('midroom_drafts')) || [];
    const timestamp = new Date().toLocaleString();

    if (!currentDraftId) {
        currentDraftId = 'draft_' + Date.now();
        const snippet = text.split('\n')[0].substring(0, 20) || "Untitled Draft";
        drafts.unshift({ id: currentDraftId, title: snippet, content: text, updated: timestamp });
    } else {
        const draftIndex = drafts.findIndex(d => d.id === currentDraftId);
        if (draftIndex !== -1) {
            drafts[draftIndex].content = text;
            drafts[draftIndex].updated = timestamp;
        }
    }

    localStorage.setItem('midroom_drafts', JSON.stringify(drafts));
    statusIndicator.textContent = "Saved to Vault";
    statusIndicator.style.color = "#52796f";
    renderDrafts();
}

function renderDrafts() {
    if (!draftsList) return;
    draftsList.innerHTML = '';
    const drafts = JSON.parse(localStorage.getItem('midroom_drafts')) || [];

    if (drafts.length === 0) {
        draftsList.innerHTML = '<li style="color: #1f3a2d; cursor: default; background: transparent;">The Vault is empty</li>';
        return;
    }

    drafts.forEach(draft => {
        const li = document.createElement('li');
        
        const titleSpan = document.createElement('span');
        titleSpan.textContent = draft.title;
        titleSpan.style.flex = "1";
        
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '&times;';
        deleteBtn.className = 'delete-draft-btn';
        
        li.appendChild(titleSpan);
        li.appendChild(deleteBtn);
        
        // Single tap to load
        titleSpan.addEventListener('click', (e) => {
            e.stopPropagation();
            textInput.value = draft.content;
            currentDraftId = draft.id;
            const words = draft.content.trim() === '' ? 0 : draft.content.trim().split(/\s+/).length;
            wordCountSpan.textContent = words;
            statusIndicator.textContent = "Loaded Draft";
            statusIndicator.style.color = "#52796f";
            sidebar.classList.remove('active');
            showToast("Draft loaded from Vault");
        });

        // Double tap to rename
        titleSpan.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            const newName = prompt("Rename this draft:", draft.title);
            if (newName && newName.trim() !== '') {
                let currentDrafts = JSON.parse(localStorage.getItem('midroom_drafts')) || [];
                const idx = currentDrafts.findIndex(d => d.id === draft.id);
                if (idx !== -1) {
                    currentDrafts[idx].title = newName.trim();
                    localStorage.setItem('midroom_drafts', JSON.stringify(currentDrafts));
                    renderDrafts();
                    showToast("Draft renamed");
                }
            }
        });

        // Delete execution
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            let currentDrafts = JSON.parse(localStorage.getItem('midroom_drafts')) || [];
            currentDrafts = currentDrafts.filter(d => d.id !== draft.id);
            localStorage.setItem('midroom_drafts', JSON.stringify(currentDrafts));
            
            if (currentDraftId === draft.id) {
                textInput.value = '';
                currentDraftId = null;
                wordCountSpan.textContent = 0;
                statusIndicator.textContent = "Private Room";
                statusIndicator.style.color = "#1f3a2d";
            }
            
            renderDrafts();
            showToast("Draft turned to ash");
        });

        draftsList.appendChild(li);
    });
}

// 5. TOOLBAR BUTTON EVENT LISTENERS
saveBtn.addEventListener('click', () => {
    if (textInput.value.trim() === '') {
        showToast("Canvas is empty");
        return;
    }
    autoSaveDraft();
    showToast("Draft locked in Vault");
});

copyBtn.addEventListener('click', () => {
    if (textInput.value.trim() === '') {
        showToast("Nothing to copy");
        return;
    }
    navigator.clipboard.writeText(textInput.value)
        .then(() => showToast("Copied to clipboard"))
        .catch(() => showToast("Copy failed"));
});

downloadBtn.addEventListener('click', () => {
    const text = textInput.value;
    if (text.trim() === '') {
        showToast("Canvas is empty");
        return;
    }
    const blob = new Blob([text], { type: 'text/plain' });
    const anchor = document.createElement('a');
    anchor.download = `midroom_draft_${Date.now()}.txt`;
    anchor.href = window.URL.createObjectURL(blob);
    anchor.target = '_blank';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    showToast("Download started");
});

newCanvasBtn.addEventListener('click', () => {
    if (textInput.value.trim() !== '') {
        autoSaveDraft();
    }
    textInput.value = '';
    currentDraftId = null;
    wordCountSpan.textContent = '0';
    statusIndicator.textContent = "Private Room";
    statusIndicator.style.color = "#1f3a2d";
    textInput.focus();
    showToast("Cleared the slate");
});

// SIDEBAR TOGGLES
menuToggle.addEventListener('click', () => {
    renderDrafts();
    sidebar.classList.add('active');
});
closeSidebar.addEventListener('click', () => sidebar.classList.remove('active'));

// 6. ORIGINAL HIGH-DENSITY PARTICLE ENGINE
const canvas = document.getElementById('ambient-canvas');
const ctx = canvas.getContext('2d');
let particlesArray = [];
const maxParticles = 45;
const sporeColors = ['#1a3329', '#2f4f43', '#3f6356', '#52796f'];

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
        this.size = Math.random() * 2 + 0.5;
        this.speedY = -(Math.random() * 0.2 + 0.05);
        this.speedX = Math.random() * 0.2 - 0.1;
        this.maxAlpha = Math.random() * 0.4 + 0.1;
        this.alpha = Math.random() * this.maxAlpha;
        this.color = sporeColors[Math.floor(Math.random() * sporeColors.length)];
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.y < -10 || this.x < -10 || this.x > canvas.width + 10) {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + 10;
            this.alpha = 0;
        }
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}

function initParticles() {
    particlesArray = [];
    for (let i = 0; i < maxParticles; i++) {
        particlesArray.push(new SporeParticle());
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
