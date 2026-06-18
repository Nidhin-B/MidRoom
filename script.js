/* ==========================================================================
   MIDROOM — CANVAS ENGINE, STORAGE VAULT, & ACTIVE CHAMBER AUDIO SUITE
   ========================================================================= */

// 1. GLOBAL UI ELEMENT SELECTORS
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

// SETTINGS CONTROL SYSTEM SELECTORS
const settingsToggle = document.getElementById('settings-toggle');
const settingsModal = document.getElementById('settings-modal');
const closeSettings = document.getElementById('close-settings');
const masterVolume = document.getElementById('master-volume');
const volumeVal = document.getElementById('volume-val');
const audioCards = document.querySelectorAll('.audio-card');
const scaleButtons = document.querySelectorAll('.scale-btn');
const particleSwitch = document.getElementById('particle-switch');

// CORE DATA STATE TRACKERS
let currentDraftId = null;
let autoSaveTimer = null;
let particlesEnabled = true;

// 2. PATH B AMBIENT AUDIO ENGINE STREAM CONFIGURATION
// Uses permanent, secure open-source streams hosted on cloud architectures
const audioStreams = {
    lofi: new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'),
    rain: new Audio('https://actions.google.com/sounds/v1/weather/rain_on_roof.ogg'),
    void: new Audio('https://actions.google.com/sounds/v1/ambiences/steady_drone.ogg')
};

// Configure seamless background ambient looping
audioStreams.lofi.loop = true;
audioStreams.rain.loop = true;
audioStreams.void.loop = true;

// Standalone tactile SFX file path mapped to keypress frequencies
const keyboardClickSFXUrl = 'https://actions.google.com/sounds/v1/office/typewriter_single_click.ogg';

// 3. REAL-TIME WORD COUPLING & INLINE SYSTEM NOTIFICATIONS
textInput.addEventListener('input', () => {
    const text = textInput.value.trim();
    const words = text === '' ? 0 : text.split(/\s+/).length;
    wordCountSpan.textContent = words;

    if (text.length > 0) {
        statusIndicator.textContent = "typing...";
        statusIndicator.style.color = "#4f7466";
        
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(() => {
            autoSaveDraft();
        }, 1500);
    }
});

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// 4. PERSISTENT SETTINGS PROFILE ENGINE (LOCALSTORAGE)
function saveChamberSettings() {
    const activeSounds = [];
    audioCards.forEach(card => {
        if (card.classList.contains('active')) {
            activeSounds.push(card.getAttribute('data-sound'));
        }
    });

    const activeScaleBtn = document.querySelector('.scale-btn.active');
    const textScale = activeScaleBtn ? activeScaleBtn.getAttribute('data-size') : 'medium';

    const settingsProfile = {
        volume: masterVolume.value,
        activeSounds: activeSounds,
        textScale: textScale,
        particlesEnabled: particlesEnabled
    };

    localStorage.setItem('midroom_settings', JSON.stringify(settingsProfile));
}

function loadChamberSettings() {
    const savedData = localStorage.getItem('midroom_settings');
    if (!savedData) return;

    const settings = JSON.parse(savedData);

    // Synchronize Master Audio Volume States
    masterVolume.value = settings.volume !== undefined ? settings.volume : 50;
    volumeVal.textContent = `${masterVolume.value}%`;
    const targetVolume = masterVolume.value / 100;

    // Apply Active State Volume Matrix
    for (let track in audioStreams) {
        audioStreams[track].volume = targetVolume;
    }

    // Synchronize Font Interface Scaling Layouts
    scaleButtons.forEach(btn => {
        if (btn.getAttribute('data-size') === settings.textScale) {
            btn.classList.add('active');
            textInput.classList.remove('font-small', 'font-medium', 'font-large');
            textInput.classList.add(`font-${settings.textScale}`);
        } else {
            btn.classList.remove('active');
        }
    });

    // Synchronize Spore Particle Engine States
    particlesEnabled = settings.particlesEnabled !== undefined ? settings.particlesEnabled : true;
    particleSwitch.checked = particlesEnabled;

    // Restore Sound Suite Card Visual Toggles and Start Streams Gracefully
    audioCards.forEach(card => {
        const soundType = card.getAttribute('data-sound');
        if (settings.activeSounds && settings.activeSounds.includes(soundType)) {
            card.classList.add('active');
            
            // Background audio streams loop continuously if browser autoplay rules allow
            if (audioStreams[soundType]) {
                audioStreams[soundType].play().catch(() => {
                    console.log("Audio pipeline queued: Waiting for user cursor tap authorization.");
                });
            }
        } else {
            card.classList.remove('active');
        }
    });
}

// 5. SETTINGS CORE INTERACTION CONTROL LISTENERS
masterVolume.addEventListener('input', (e) => {
    const calculatedVolume = e.target.value / 100;
    volumeVal.textContent = `${e.target.value}%`;
    
    for (let track in audioStreams) {
        audioStreams[track].volume = calculatedVolume;
    }
    saveChamberSettings();
});

audioCards.forEach(card => {
    card.addEventListener('click', () => {
        card.classList.toggle('active');
        const soundType = card.getAttribute('data-sound');

        if (audioStreams[soundType]) {
            if (card.classList.contains('active')) {
                audioStreams[soundType].volume = masterVolume.value / 100;
                audioStreams[soundType].play().catch(err => console.log("Stream delivery interrupted:", err));
            } else {
                audioStreams[soundType].pause();
            }
        }
        saveChamberSettings();
    });
});

// TACTILE MECHANICAL SFX REAL-TIME KEYBOARD INTERCEPTOR
textInput.addEventListener('keydown', (e) => {
    const keyboardCard = document.querySelector('.audio-card[data-sound="keyboard"]');
    // Guard statement tracks whether user enabled tactile clicks
    if (keyboardCard && keyboardCard.classList.contains('active')) {
        // Instantiate real-time key sounds to bypass native frame delay limits
        const clickInstance = new Audio(keyboardClickSFXUrl);
        clickInstance.volume = masterVolume.value / 100;
        clickInstance.play().catch(() => {});
    }
});

scaleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        scaleButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        textInput.classList.remove('font-small', 'font-medium', 'font-large');
        const selectedScale = btn.getAttribute('data-size');
        textInput.classList.add(`font-${selectedScale}`);
        saveChamberSettings();
    });
});

particleSwitch.addEventListener('change', (e) => {
    particlesEnabled = e.target.checked;
    saveChamberSettings();
});

// 6. MODAL NAVIGATION & ROUTING INTERCEPTORS
menuToggle.addEventListener('click', () => {
    renderDrafts();
    sidebar.classList.add('active');
});

closeSidebar.addEventListener('click', () => {
    sidebar.classList.remove('active');
});

textInput.addEventListener('focus', () => {
    sidebar.classList.remove('active');
    settingsModal.classList.remove('active');
});

settingsToggle.addEventListener('click', () => {
    sidebar.classList.remove('active'); 
    settingsModal.classList.add('active');
});

closeSettings.addEventListener('click', () => {
    settingsModal.classList.remove('active');
});

settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        settingsModal.classList.remove('active');
    }
});

newCanvasBtn.addEventListener('click', () => {
    if (textInput.value.trim() === "") return;
    autoSaveDraft();
    
    textInput.value = "";
    currentDraftId = null;
    wordCountSpan.textContent = "0";
    statusIndicator.textContent = "Private Room";
    statusIndicator.style.color = "";
    
    showToast("Opened a fresh canvas void");
});

// 7. STORAGE PRIMITIVES AND MANIFEST DATABASE METHODS
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
        currentDraftId = Date.now();
        const newDraft = {
            id: currentDraftId,
            title: firstLine + '...',
            content: text,
            time: timestamp
        };
        drafts.unshift(newDraft);
    } else {
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
                    loadDraft(draft); 
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

// 8. UTILITY ACTION ACCESSORS
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

// 9. UPGRADED MULTI-TONE AMBIENT PARTICLE ENGINE
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
    if (particlesEnabled) {
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
            particlesArray[i].draw();
        }
    }
    requestAnimationFrame(animateParticles);
}

// Initializing settings profile and canvas animation frames loop
initParticles();
animateParticles();
loadChamberSettings();
