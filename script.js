/* ==========================================================================
   MIDROOM — INVISIBLE YOUTUBE ENGINE, STORAGE VAULT, & DYNAMIC PLAYLIST
   ========================================================================= */

// ==========================================================================
// 1. FIXED SCROLLABLE PLAYLIST DATABASE (Perfect Song/Artist Separation)
// ==========================================================================
const musicPlaylist = [
    { title: "Lofi Cafe Live", artist: "Lofi Girl", youtubeId: "X4VbdwhkE10" },
    { title: "Espresso", artist: "Sabrina Carpenter", youtubeId: "aSugSGCC12I" },
    { title: "Please Please Please", artist: "Sabrina Carpenter", youtubeId: "cF1Na4AIecM" },
    { title: "Taste", artist: "Sabrina Carpenter", youtubeId: "G7KNmW9a75Y" },
    { title: "Birds of a Feather", artist: "Billie Eilish", youtubeId: "UtF6Jej8yb4" },
    { title: "Lofi Study Beats Live", artist: "Lofi Records", youtubeId: "W8a4sUabCUo" },
    { title: "Feather", artist: "Sabrina Carpenter", youtubeId: "2eO0N_S_fks" },
    { title: "Bed Chem", artist: "Sabrina Carpenter", youtubeId: "d2bI9Z_ZId8" },
    { title: "CHIHIRO", artist: "Billie Eilish", youtubeId: "BY_X0YI-JMM" },
    { title: "Synthwave Radio Live", artist: "Lofi Girl", youtubeId: "4xDzrJKXOOY" },
    { title: "Cozy Winter Lofi", artist: "Chillhop Records", youtubeId: "jfKfPfyJRdk" },
    { title: "Sunflower", artist: "Post Malone", youtubeId: "An9gYSTW3O4" }
];

// ==========================================================================
// 2. GLOBAL UI ELEMENT SELECTORS
// ==========================================================================
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

// ==========================================================================
// 3. INVISIBLE YOUTUBE LAYER SETUP
// ==========================================================================
let ytPlayer = null;
let isYtAPIReady = false;
let activeMusicTrackIndex = null;
let streamingTrackElements = [];

// Dynamic Injection: Creates the required player slot hidden completely off-screen
const hiddenPlayerDiv = document.createElement('div');
hiddenPlayerDiv.id = 'invisible-yt-player';
hiddenPlayerDiv.style.position = 'absolute';
hiddenPlayerDiv.style.top = '-9999px';
hiddenPlayerDiv.style.left = '-9999px';
hiddenPlayerDiv.style.width = '1px';
hiddenPlayerDiv.style.height = '1px';
document.body.appendChild(hiddenPlayerDiv);

// Inject the official standard YouTube Iframe API Script tag asynchronously
const ytScriptTag = document.createElement('script');
ytScriptTag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(ytScriptTag, firstScriptTag);

// Core Global Callback: Fires automatically when the YouTube framework loads
window.onYouTubeIframeAPIReady = function() {
    ytPlayer = new YT.Player('invisible-yt-player', {
        height: '1',
        width: '1',
        videoId: '',
        playerVars: {
            'autoplay': 0,
            'controls': 0,
            'disablekb': 1,
            'fs': 0,
            'rel': 0,
            'modestbranding': 1,
            'iv_load_policy': 3,
            'origin': window.location.origin
        },
        events: {
            'onReady': onYoutubePlayerReady
        }
    });
};

function onYoutubePlayerReady(event) {
    isYtAPIReady = true;
    if (masterVolume) {
        ytPlayer.setVolume(masterVolume.value);
    }
    buildDynamicPlaylistUI();
    loadChamberSettings();
}

// ==========================================================================
// 4. DYNAMIC PLAYLIST GENERATION ENGINE (Perfect Layout Matching)
// ==========================================================================
function buildDynamicPlaylistUI() {
    const staticTracks = document.querySelectorAll('.audio-track');
    if (staticTracks.length === 0) return;
    
    const container = staticTracks[0].parentElement;
    staticTracks.forEach(track => track.remove());
    
    musicPlaylist.forEach((trackData, index) => {
        const trackCard = document.createElement('div');
        trackCard.className = 'audio-track';
        trackCard.style.cursor = 'pointer';
        
        // Beautiful separated layouts to let CSS styles match accurately
        const nameSpan = document.createElement('span');
        nameSpan.className = 'card-name';
        nameSpan.textContent = trackData.title;
        
        const artistSpan = document.createElement('span');
        artistSpan.className = 'card-artist';
        artistSpan.textContent = ` — ${trackData.artist}`;
        artistSpan.style.opacity = '0.6';
        artistSpan.style.fontSize = '0.9em';
        
        trackCard.appendChild(nameSpan);
        trackCard.appendChild(artistSpan);
        
        trackCard.addEventListener('click', () => {
            if (trackCard.classList.contains('active')) {
                stopActiveAmbientMusic();
                saveChamberSettings();
            } else {
                if (!isYtAPIReady) {
                    showToast("Connecting to audio stream...");
                    return;
                }
                playAmbientMusicStream(index);
            }
        });
        
        container.appendChild(trackCard);
    });
    
    streamingTrackElements = Array.from(container.querySelectorAll('.audio-track'));
}

function stopActiveAmbientMusic() {
    if (isYtAPIReady && ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
        ytPlayer.pauseVideo();
    }
    activeMusicTrackIndex = null;
    streamingTrackElements.forEach(el => el.classList.remove('active'));
    if (nowPlayingHud) nowPlayingHud.textContent = "";
}

function playAmbientMusicStream(index) {
    if (!isYtAPIReady || !ytPlayer) return;
    stopActiveAmbientMusic();

    if (index < 0 || index >= musicPlaylist.length) return;
    const trackData = musicPlaylist[index];
    const targetElement = streamingTrackElements[index];

    if (!targetElement) return;

    try {
        ytPlayer.loadVideoById({
            videoId: trackData.youtubeId,
            startSeconds: 0
        });
        ytPlayer.setVolume(masterVolume ? masterVolume.value : 50);
        
        activeMusicTrackIndex = index;
        targetElement.classList.add('active');

        if (nowPlayingHud) {
            nowPlayingHud.textContent = `// listening to: ${trackData.title.toLowerCase()} by ${trackData.artist.toLowerCase()}`;
        }
        saveChamberSettings();
    } catch (e) {
        console.error("YouTube streaming pipeline error:", e);
    }
}

// ==========================================================================
// 5. REAL-TIME WORD COUPLING & TEXT AREA HANDLERS
// ==========================================================================
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
}

function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// ==========================================================================
// 6. PERSISTENT SETTINGS PROFILE ENGINE
// ==========================================================================
function saveChamberSettings() {
    const activeScaleBtn = document.querySelector('.scale-btn.active');
    const textScale = activeScaleBtn ? activeScaleBtn.getAttribute('data-size') : 'medium';

    const settingsProfile = {
        volume: masterVolume ? masterVolume.value : 50,
        activeMusicIndex: activeMusicTrackIndex,
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
        if (isYtAPIReady && ytPlayer && typeof ytPlayer.setVolume === 'function') {
            ytPlayer.setVolume(masterVolume.value);
        }
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

    if (settings.activeMusicIndex !== null && settings.activeMusicIndex !== undefined && isYtAPIReady) {
        playAmbientMusicStream(settings.activeMusicIndex);
    }
}

// ==========================================================================
// 7. INTERACTION CONTROL LISTENERS
// ==========================================================================
if (masterVolume) {
    masterVolume.addEventListener('input', (e) => {
        const targetVol = e.target.value;
        if (volumeVal) volumeVal.textContent = `${targetVol}%`;
        if (isYtAPIReady && ytPlayer && typeof ytPlayer.setVolume === 'function') {
            ytPlayer.setVolume(targetVol);
        }
        saveChamberSettings();
    });
}

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

// ==========================================================================
// 8. MODAL NAVIGATION ROUTING
// ==========================================================================
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

// ==========================================================================
// 9. STORAGE PRIMITIVES AND MANIFEST DATABASE METHODS
// ==========================================================================
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

// ==========================================================================
// 10. UTILITY ACTION ACCESSORS
// ==========================================================================
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

// ==========================================================================
// 11. MULTI-TONE AMBIENT PARTICLE ENGINE
// ==========================================================================
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
