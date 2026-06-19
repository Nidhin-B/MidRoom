/* ==========================================================================
   MIDROOM — CANVAS ENGINE, STORAGE VAULT, & ACTIVE CHAMBER AUDIO SUITE
   ========================================================================= */

// 1. GLOBAL UI ELEMENT SELECTORS (SAFE COUPLING)
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
const nowPlayingHud = document.getElementById('now-playing-track');

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

// 2. INITIALIZE BACKGROUND SOUNDCLOUD GHOST PLAYER
const scIframe = document.getElementById('ghost-sc-player');
let scWidget = null;

if (scIframe && window.SC) {
    scWidget = SC.Widget(scIframe);
}

// Local keyboard layer initialization (kept for zero-latency feedback)
const keyboardClickSFXUrl = 'https://assets.mixkit.co/sfx/preview/mixkit-mechanical-keyboard-single-press-824.mp3';

// 3. PLAYLIST SELECTION MAP
let audioTracks = Array.from(document.querySelectorAll('.audio-track'));

// Utility helper to clear active tracks on streaming transitions
function deactivateStreamingTracks() {
    audioTracks.forEach(track => {
        if (track.hasAttribute('data-sc-url')) {
            track.classList.remove('active');
        }
    });
}

// 4. REAL-TIME WORD COUPLING & INLINE NOTIFICATIONS
if (textInput) {
    textInput.addEventListener('input', () => {
        const text = textInput.value.trim();
        const words = text === '' ? 0 : text.split(/\s+/).length;
        if (wordCountSpan) wordCountSpan.textContent = words;

        if (text.length > 0) {
            if (statusIndicator) {
                statusIndicator.textContent = "typing...";
                statusIndicator.style.color = "#4f7466";
            }
            
            clearTimeout(autoSaveTimer);
            autoSaveTimer = setTimeout(() => {
                autoSaveDraft();
            }, 1500);
        }
    });

    textInput.addEventListener('focus', () => {
        if (sidebar) sidebar.classList.remove('active');
        if (settingsModal) settingsModal.classList.remove('active');
    });

    textInput.addEventListener('keydown', (e) => {
        let isKeyboardActive = false;
        audioTracks.forEach(track => {
            if (track.getAttribute('data-sound') === 'keyboard' && track.classList.contains('active')) {
                isKeyboardActive = true;
            }
        });

        if (isKeyboardActive) {
            try {
                const clickInstance = new Audio(keyboardClickSFXUrl);
                if (masterVolume) clickInstance.volume = masterVolume.value / 100;
                clickInstance.play().catch(() => {});
            } catch(err) {}
        }
    });
}

function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// 5. PERSISTENT SETTINGS PROFILE ENGINE
function saveChamberSettings() {
    let activeStreamingUrl = null;
    let activeSoundName = "";
    let isKeyboardActive = false;

    audioTracks.forEach(track => {
        if (track.classList.contains('active')) {
            if (track.hasAttribute('data-sc-url')) {
                activeSoundName = track.querySelector('.card-name').textContent;
                activeStreamingUrl = track.getAttribute('data-sc-url');
            } else if (track.getAttribute('data-sound') === 'keyboard') {
                isKeyboardActive = true;
            }
        }
    });

    const activeScaleBtn = document.querySelector('.scale-btn.active');
    const textScale = activeScaleBtn ? activeScaleBtn.getAttribute('data-size') : 'medium';

    const settingsProfile = {
        volume: masterVolume ? masterVolume.value : 50,
        currentStreamingName: activeSoundName,
        currentStreamingUrl: activeStreamingUrl,
        keyboardActive: isKeyboardActive,
        textScale: textScale,
        particlesEnabled: particlesEnabled
    };

    localStorage.setItem('midroom_settings', JSON.stringify(settingsProfile));
}

function loadChamberSettings() {
    const savedData = localStorage.getItem('midroom_settings');
    if (!savedData) return;

    const settings = JSON.parse(savedData);

    if (masterVolume) {
        masterVolume.value = settings.volume !== undefined ? settings.volume : 50;
        if (volumeVal) volumeVal.textContent = `${masterVolume.value}%`;
        if (scWidget) scWidget.setVolume(masterVolume.value);
    }

    if (scaleButtons && textInput) {
        scaleButtons.forEach(btn => {
            if (btn.getAttribute('data-size') === settings.textScale) {
                btn.classList.add('active');
                textInput.classList.remove('font-small', 'font-medium', 'font-large');
                textInput.classList.add(`font-${settings.textScale}`);
            } else {
                btn.classList.remove('active');
            }
        });
    }

    particlesEnabled = settings.particlesEnabled !== undefined ? settings.particlesEnabled : true;
    if (particleSwitch) particleSwitch.checked = particlesEnabled;

    // Restore active audio tracks securely
    audioTracks.forEach(track => {
        if (track.hasAttribute('data-sc-url')) {
            const name = track.querySelector('.card-name').textContent;
            const url = track.getAttribute('data-sc-url');

            if ((url === settings.currentStreamingUrl || name === settings.currentStreamingName) && scWidget) {
                track.classList.add('active');
                
                // Unbind previous endpoints to stop duplicate queues at startup
                scWidget.unbind(SC.Widget.Events.READY);
                scWidget.unbind(SC.Widget.Events.PLAY);

                scWidget.load(url, { auto_play: true, show_artwork: false, buying: false, sharing: false, download: false });
                
                scWidget.bind(SC.Widget.Events.READY, () => {
                    scWidget.setVolume(masterVolume ? masterVolume.value : 50);
                });

                scWidget.bind(SC.Widget.Events.PLAY, () => {
                    scWidget.getCurrentSound((sound) => {
                        if (sound) {
                            const cardName = track.querySelector('.card-name');
                            if (cardName) cardName.textContent = sound.title;
                            if (nowPlayingHud) {
                                nowPlayingHud.textContent = `// listening to: ${sound.title.toLowerCase()} by ${sound.user.username.toLowerCase()}`;
                            }
                        }
                    });
                });
            }
        } else if (track.getAttribute('data-sound') === 'keyboard' && settings.keyboardActive) {
            track.classList.add('active');
        }
    });
}

// 6. INTERACTION CONTROL LISTENERS
if (masterVolume) {
    masterVolume.addEventListener('input', (e) => {
        if (volumeVal) volumeVal.textContent = `${e.target.value}%`;
        if (scWidget) scWidget.setVolume(e.target.value);
        saveChamberSettings();
    });
}

audioTracks.forEach(track => {
    track.addEventListener('click', () => {
        const isTrackStreaming = track.hasAttribute('data-sc-url');

        if (isTrackStreaming) {
            if (track.classList.contains('active')) {
                track.classList.remove('active');
                if (scWidget) scWidget.pause();
                if (nowPlayingHud) nowPlayingHud.textContent = "";
            } else {
                deactivateStreamingTracks();
                track.classList.add('active');
                const targetUrl = track.getAttribute('data-sc-url');
                
                if (scWidget) {
                    // UNBIND GHOST QUEUES: Purges event memory leaks before firing new instance
                    scWidget.unbind(SC.Widget.Events.READY);
                    scWidget.unbind(SC.Widget.Events.PLAY);

                    scWidget.load(targetUrl, { auto_play: true, show_artwork: false, buying: false, sharing: false, download: false });
                    
                    scWidget.bind(SC.Widget.Events.READY, () => {
                        scWidget.setVolume(masterVolume ? masterVolume.value : 50);
                    });

                    // DYNAMIC ATTRIBUTION: Extracts metadata from stream loop automatically
                    scWidget.bind(SC.Widget.Events.PLAY, () => {
                        scWidget.getCurrentSound((sound) => {
                            if (sound) {
                                const cardName = track.querySelector('.card-name');
                                if (cardName) cardName.textContent = sound.title;
                                if (nowPlayingHud) {
                                    nowPlayingHud.textContent = `// listening to: ${sound.title.toLowerCase()} by ${sound.user.username.toLowerCase()}`;
                                }
                                saveChamberSettings();
                            }
                        });
                    });
                }
            }
        } else {
            track.classList.toggle('active');
        }
        saveChamberSettings();
    });
});

if (scaleButtons && textInput) {
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
}

if (particleSwitch) {
    particleSwitch.addEventListener('change', (e) => {
        particlesEnabled = e.target.checked;
        saveChamberSettings();
    });
}

// 7. MODAL NAVIGATION ROUTING
if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        renderDrafts();
        if (sidebar) sidebar.classList.add('active');
    });
}

if (closeSidebar) {
    closeSidebar.addEventListener('click', () => {
        sidebar.classList.remove('active');
    });
}

if (settingsToggle) {
    settingsToggle.addEventListener('click', () => {
        if (sidebar) sidebar.classList.remove('active'); 
        if (settingsModal) settingsModal.classList.add('active');
    });
}

if (closeSettings) {
    closeSettings.addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });
}

if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('active');
        }
    });
}

if (newCanvasBtn) {
    newCanvasBtn.addEventListener('click', () => {
        if (!textInput || textInput.value.trim() === "") return;
        autoSaveDraft();
        
        textInput.value = "";
        currentDraftId = null;
        if (wordCountSpan) wordCountSpan.textContent = "0";
        if (statusIndicator) {
            statusIndicator.textContent = "Private Room";
            statusIndicator.style.color = "";
        }
        showToast("Opened a fresh canvas void");
    });
}

// 8. STORAGE PRIMITIVES AND MANIFEST DATABASE METHODS
function getDrafts() {
    const drafts = localStorage.getItem('midroom_drafts');
    return drafts ? JSON.parse(drafts) : [];
}

function renderDrafts() {
    if (!draftsList) return;
    const drafts = getDrafts();
    draftsList.innerHTML = '';
    
    if (drafts.length === 0) {
        draftsList.innerHTML = '<li style="padding: 15px; text-align: center; opacity: 0.5;">Vault is empty</li>';
        return;
    }
    
    drafts.forEach(draft => {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        li.style.padding = '10px';
        li.style.cursor = 'pointer';
        li.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        
        const info = document.createElement('div');
        info.style.flex = '1';
        info.addEventListener('click', () => loadDraft(draft));
        
        const title = document.createElement('span');
        title.textContent = draft.title || 'Untitled';
        title.style.display = 'block';
        
        const time = document.createElement('span');
        time.textContent = draft.time || '';
        time.style.fontSize = '0.8em';
        time.style.opacity = '0.5';
        
        info.appendChild(title);
        info.appendChild(time);
        
        const delBtn = document.createElement('button');
        delBtn.textContent = '×';
        delBtn.style.background = 'none';
        delBtn.style.border = 'none';
        delBtn.style.color = '#ef4444';
        delBtn.style.fontSize = '1.2em';
        delBtn.style.cursor = 'pointer';
        delBtn.addEventListener('click', (e) => deleteDraft(draft.id, e));
        
        li.appendChild(info);
        li.appendChild(delBtn);
        draftsList.appendChild(li);
    });
}

function autoSaveDraft() {
    if (!textInput) return;
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
    if (statusIndicator) {
        statusIndicator.textContent = "Saved to Vault";
        statusIndicator.style.color = "#a7f3d0";
    }
}

if (saveBtn) {
    saveBtn.addEventListener('click', () => {
        if (!textInput || !textInput.value.trim()) {
            showToast("Cannot save an empty canvas");
            return;
        }
        autoSaveDraft();
        showToast("Draft securely cataloged");
    });
}

// Fix parameter coupling names to maintain consistency with the blueprint map
function deleteDraft(id, event) {
    if (event) event.stopPropagation(); 
    let drafts = getDrafts();
    drafts = drafts.filter(draft => draft.id !== id);
    localStorage.setItem('midroom_drafts', JSON.stringify(drafts));
    
    if (currentDraftId === id) {
        currentDraftId = null;
    }
    
    renderDrafts();
    showToast("Draft turned to ash");
}

function loadDraft(draftObj) {
    if (!textInput) return;
    currentDraftId = draftObj.id;
    textInput.value = draftObj.content;
    textInput.dispatchEvent(new Event('input')); 
    
    if (statusIndicator) {
        statusIndicator.textContent = "Editing Draft";
        statusIndicator.style.color = "#52796f";
    }
    
    if (sidebar) sidebar.classList.remove('active');
    showToast(`Loaded: ${draftObj.title}`);
}

// 9. UTILITY ACTION ACCESSORS
if (copyBtn) {
    copyBtn.addEventListener('click', () => {
        if (!textInput || !textInput.value) return;
        navigator.clipboard.writeText(textInput.value);
        showToast("Copied to clipboard");
    });
}

if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
        if (!textInput || !textInput.value) return;
        const text = textInput.value;

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
}

// 10. UPGRADED MULTI-TONE AMBIENT PARTICLE ENGINE
const canvas = document.getElementById('ambient-canvas');
if (canvas) {
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

    initParticles();
    animateParticles();
}

// Final systems initialization
setTimeout(() => {
    loadChamberSettings();
}, 600);
