// ==========================================================================
// INTERFACE WINDOW DISPLAY CONTROLS
// ==========================================================================
const modal = document.getElementById('settings-modal');
const openModalBtn = document.getElementById('open-settings-btn');
const closeModalBtn = document.getElementById('close-settings-btn');

openModalBtn.addEventListener('click', () => modal.classList.add('active'));
closeModalBtn.addEventListener('click', () => modal.classList.remove('active'));

// Close modal if user clicks outside the inner settings card content
modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
});

// ==========================================================================
// SOUNDCLOUD PLAYLIST CONTROLLER ENGINE
// ==========================================================================
const scIframe = document.getElementById('ghost-sc-player');
const scWidget = window.SC ? SC.Widget(scIframe) : null;
const playlistWrapper = document.querySelector('.audio-playlist-wrapper');
const masterVolume = document.getElementById('master-volume'); 
const nowPlayingHud = document.getElementById('now-playing-track'); 

// The MidRoom public streaming target link
const midroomPlaylistUrl = "https://on.soundcloud.com/NKliQ4FRDKOjeBuZCr";

if (scWidget && playlistWrapper) {
    
    // Inject the playlist source URL into the hidden engine on execution
    scWidget.load(midroomPlaylistUrl, {
        auto_play: false,
        show_artwork: false,
        buying: false,
        sharing: false,
        download: false,
        show_playcount: false,
        show_user: false
    });

    // Run layout generator once the hidden SoundCloud puppet registers READY status
    scWidget.bind(SC.Widget.Events.READY, () => {
        
        // Pull down structural tracking arrays from the loaded stream source
        scWidget.getSounds((songs) => {
            if (!songs || songs.length === 0) {
                playlistWrapper.innerHTML = `<div style="font-size:0.8rem;color:#355245;text-align:center;padding:20px;">FAILED TO RECONSTRUCT STREAM</div>`;
                return;
            }
            
            // Clear out static design structural placeholders safely
            playlistWrapper.innerHTML = '';

            // Construct and inject every sound node entry systematically
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
                
                // Audio Selection Click Listener Logic Block
                trackRow.addEventListener('click', () => {
                    // Reset styling frameworks for unselected layout lines
                    document.querySelectorAll('.audio-track').forEach(t => t.classList.remove('active'));
                    trackRow.classList.add('active');

                    // Command puppet widget to skip to the target entry and initialize playback
                    scWidget.skip(index);
                    scWidget.play();

                    // Instantly scale the track feed output match active control balances
                    const currentVol = masterVolume ? masterVolume.value : 50;
                    scWidget.setVolume(currentVol);

                    // Update Main Interface Status Lines
                    if (nowPlayingHud) {
                        nowPlayingHud.textContent = `// listening to: ${song.title.toLowerCase()}`;
                    }
                });

                playlistWrapper.appendChild(trackRow);
            });
        });
    });
}

// Map real-time movement values on Master Volume to active engine components
if (masterVolume && scWidget) {
    masterVolume.addEventListener('input', (e) => {
        scWidget.setVolume(e.target.value);
    });
}
