// ==========================================================================
// SYSTEM DIALOG INTERFACE MODAL CONFIGURATIONS
// ==========================================================================
const modal = document.getElementById('settings-modal');
const openModalBtn = document.getElementById('open-settings-btn');
const closeModalBtn = document.getElementById('close-settings-btn');

openModalBtn.addEventListener('click', () => modal.classList.add('active'));
closeModalBtn.addEventListener('click', () => modal.classList.remove('active'));
modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
});

// ==========================================================================
// AESTHETIC COMPONENT CONTROLLERS (TEXT SCALING INTEGRATION)
// ==========================================================================
const textCanvas = document.getElementById('text-canvas');
const scaleButtons = document.querySelectorAll('.scale-btn');

scaleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        scaleButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const scale = btn.getAttribute('data-scale');
        if (scale === 'small') textCanvas.style.fontSize = '1.1rem';
        if (scale === 'medium') textCanvas.style.fontSize = '1.35rem';
        if (scale === 'large') textCanvas.style.fontSize = '1.65rem';
    });
});

// Simple Word Counter Logic Hook
textCanvas.addEventListener('input', () => {
    const text = textCanvas.value.trim();
    const words = text === '' ? 0 : text.split(/\s+/).length;
    document.getElementById('word-count').textContent = `${words} words`;
});

// ==========================================================================
// SOUNDCLOUD REAL-TIME AUDIO COMPONENT SUITE
// ==========================================================================
const scIframe = document.getElementById('ghost-sc-player');
const scWidget = window.SC ? SC.Widget(scIframe) : null;
const playlistWrapper = document.querySelector('.audio-playlist-wrapper');
const masterVolume = document.getElementById('master-volume'); 
const volumePercentage = document.getElementById('volume-percentage');
const nowPlayingHud = document.getElementById('now-playing-hud'); 

// CRITICAL FIX: Expanded direct canonical web link resolves the routing blocker perfectly
const midroomDesktopUrl = "https://soundcloud.com/nidhin-b/sets/midroom-playlist";

if (scWidget && playlistWrapper) {
    
    // Inject the audio package stream data quietly background-side
    scWidget.load(midroomDesktopUrl, {
        auto_play: false,
        show_artwork: false,
        buying: false,
        sharing: false,
        download: false,
        show_playcount: false,
        show_user: false
    });

    // Fire assembly loops once connection validates successfully
    scWidget.bind(SC.Widget.Events.READY, () => {
        
        // Query sounds array from the verified framework endpoint
        scWidget.getSounds((songs) => {
            if (!songs || songs.length === 0) {
                playlistWrapper.innerHTML = `<div class="loading-state" style="color:#cf6666;">FAILED TO RECONSTRUCT STREAM</div>`;
                return;
            }
            
            // Safe clear-slate array structural execution
            playlistWrapper.innerHTML = '';

            // Generate interface nodes sequentially mapped to your tracks
            songs.forEach((song, index) => {
                const displayIndex = String(index + 1).padStart(2, '0');
                const trackRow = document.createElement('div');
                trackRow.className = 'audio-track';
                trackRow.setAttribute('data-track-index', index);
                
                trackRow.innerHTML = `
                    <div class="track-meta">
                        <span class="card-status"></span>
                        <span class="card-name">${song.title}</span>
                    </div>
                    <span class="track-index">Void-${displayIndex}</span>
                `;
                
                // Track Event Selectors
                trackRow.addEventListener('click', () => {
                    document.querySelectorAll('.audio-track').forEach(t => t.classList.remove('active'));
                    trackRow.classList.add('active');

                    // Skip the player stream index natively to current row positioning
                    scWidget.skip(index);
                    scWidget.play();

                    // Instantly lock gain parameters to match the position of your interface slider
                    scWidget.setVolume(masterVolume.value);

                    // Update HUD data layout values
                    if (nowPlayingHud) {
                        nowPlayingHud.textContent = `// listening to: ${song.title.toLowerCase()}`;
                    }
                });

                playlistWrapper.appendChild(trackRow);
            });
        });
    });
}

// Master Volume Slider Real-Time Balancer Interaction Execution
masterVolume.addEventListener('input', (e) => {
    const val = e.target.value;
    volumePercentage.textContent = `${val}%`;
    if (scWidget) {
        scWidget.setVolume(val);
    }
});
