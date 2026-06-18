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
const scaleButtons = document.querySelectorAll('.scale-btn');
const particleSwitch = document.getElementById('particle-switch');

// CORE DATA STATE TRACKERS
let currentDraftId = null;
let autoSaveTimer = null;
let particlesEnabled = true;

// 2. HOSTED NCS MUSIC INTEGRATION MATRIX (EXACT FILENAMES MATCHED)
const audioStreams = {
    lofi: new Audio('sakuracloud - miffy cafe  [NCS Release].mp3'),
    rain: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-2393.mp3'),
    void: new Audio('Aisake, Dosi - Cruising [NCS Release].mp3')
};

// Configure seamless background ambient looping
audioStreams.lofi.loop = true;
audioStreams.rain.loop = true;
audioStreams.void.loop = true;

// Crisp mechanical layout keypress stream
const keyboardClickSFXUrl = 'https://assets.mixkit.co/sfx/preview/mixkit-mechanical-keyboard-single-press-824.mp3';

// 3. TEXT-MATCHING CARD AUTO-DETECTION ENGINE
let audioCards = Array.from(document.querySelectorAll('#settings-modal button, #settings-modal div, .audio-card, .sound-btn')).filter(el => {
    const text = (el.innerText || el.textContent).toLowerCase();
    return /lofi|rain|void|hum|mechanical|sfx/i.test(text) && el.children.length < 3;
});

function getSoundType(card) {
    const text = (card.innerText || card.textContent).toLowerCase();
    if (text.includes('lofi')) return 'lofi';
    if (text.includes('rain')) return 'rain';
    if (text.includes('void') || text.includes('hum')) return 'void';
    if (text.includes('mechanical') || text.includes('sfx')) return 'keyboard';
    return null;
}

// 4. REAL-TIME WORD COUPLING & INLINE SYSTEM NOTIFICATIONS
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

// 5. PERSISTENT SETTINGS PROFILE ENGINE (LOCALSTORAGE)
function saveChamberSettings() {
    const activeSounds = [];
    audioCards.forEach(card => {
        if (card.classList.contains('active')) {
            const soundType = getSoundType(card);
            if (soundType) activeSounds.push(soundType);
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
    if (particleSwitch) particleSwitch.checked = particlesEnabled;

    // Restore Sound Suite Card Visual Toggles and Start Streams Gracefully
    audioCards.forEach(card => {
        const soundType = getSoundType(card);
        if (settings.activeSounds && settings.activeSounds.includes(soundType)) {
            card.classList.add('active');
            
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

// 6. SETTINGS CORE INTERACTION CONTROL LISTENERS
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
        const soundType = getSoundType(card);

        if (soundType && audioStreams[soundType]) {
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
    let isKeyboardActive = false;
    audioCards.forEach(card => {
        if (getSoundType(card) === 'keyboard' && card.classList.contains('active')) {
            isKeyboardActive = true;
        }
    });

    if (isKeyboardActive) {
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

if (particleSwitch) {
    particleSwitch.addEventListener('change', (e) => {
        particlesEnabled = e.target.checked;
        saveChamberSettings();
    });
}

// 7. MODAL NAVIGATION & ROUTING INTERCEPTORS
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

// 8. STORAGE PRIMITIVES AND MANIFEST DATABASE METHODS
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
    current
