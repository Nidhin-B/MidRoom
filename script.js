/* ==========================================================================
   MIDROOM — RUNTIME LOGIC ENGINE (CLEAN CONTROLS + STABLE PROMPT RENAME)
   ========================================================================= */

document.addEventListener('DOMContentLoaded', () => {
    // Core Elements
    const textInput = document.getElementById('text-input');
    const wordCount = document.getElementById('word-count');
    const statusIndicator = document.getElementById('status-indicator');
    
    // Core Interactive Triggers
    const saveBtn = document.getElementById('save-btn');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');
    const menuToggle = document.getElementById('menu-toggle');
    const newCanvasBtn = document.getElementById('new-canvas-btn');
    const closeSidebar = document.getElementById('close-sidebar');
    
    // Drawer/Alert Components
    const sidebar = document.getElementById('sidebar');
    const draftsList = document.getElementById('drafts-list');
    const toastNotification = document.getElementById('toast-notification');

    let currentDraftId = null;

    // Word Counter
    function updateWordCount() {
        const text = textInput.value.trim();
        wordCount.textContent = text === '' ? 0 : text.split(/\s+/).length;
    }
    textInput.addEventListener('input', updateWordCount);

    // Toast Messenger Alerts
    function showToast(message) {
        toastNotification.textContent = message;
        toastNotification.classList.add('show');
        setTimeout(() => toastNotification.classList.remove('show'), 2000);
    }

    // Local Storage Communication Link
    function getDrafts() {
        return JSON.parse(localStorage.getItem('midroom_drafts')) || [];
    }

    function saveDrafts(draftsArr) {
        localStorage.setItem('midroom_drafts', JSON.stringify(draftsArr));
    }

    // Render Drafts Inside Sidebar Panel Drawer
    function displayDrafts() {
        draftsList.innerHTML = '';
        const drafts = getDrafts();

        if (drafts.length === 0) {
            draftsList.innerHTML = '<li style="color: #2b4c3d; font-style: italic; padding: 10px 0; border: none; background: transparent;">The Vault is empty...</li>';
            return;
        }

        drafts.forEach((draft, index) => {
            const li = document.createElement('li');
            li.className = 'draft-item';
            if (draft.id === currentDraftId) li.classList.add('selected');

            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'draft-details';
            
            const titleSpan = document.createElement('span');
            titleSpan.className = 'draft-title-text';
            titleSpan.textContent = draft.title || `Untitled Log ${index + 1}`;
            detailsDiv.appendChild(titleSpan);

            // Row Interaction: Load selected payload data on normal click
            li.addEventListener('click', () => {
                currentDraftId = draft.id;
                textInput.value = draft.content;
                updateWordCount();
                statusIndicator.textContent = "Draft Restored";
                sidebar.classList.remove('active');
                showToast("Loaded entry");
            });

            // SAFE DOUBLE TAP RENAME: Native prompt prevents any CSS breaking or target glitching
            li.addEventListener('dblclick', (e) => {
                e.stopPropagation(); // Avoid triggering standard load clicks
                const newTitle = prompt("Rename your draft log entry:", titleSpan.textContent);
                if (newTitle !== null && newTitle.trim() !== "") {
                    const savedList = getDrafts();
                    const targetIdx = savedList.findIndex(d => d.id === draft.id);
                    if (targetIdx !== -1) {
                        savedList[targetIdx].title = newTitle.trim();
                        saveDrafts(savedList);
                        titleSpan.textContent = newTitle.trim();
                        showToast("Draft renamed");
                    }
                }
            });

            // Trash Button Setup
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-draft-btn';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Avoid loading deleted draft content fields
                let activeDrafts = getDrafts().filter(d => d.id !== draft.id);
                saveDrafts(activeDrafts);
                
                if (currentDraftId === draft.id) {
                    currentDraftId = null;
                    textInput.value = '';
                    updateWordCount();
                    statusIndicator.textContent = "Private Room";
                }
                displayDrafts();
                showToast("Draft wiped");
            });

            li.appendChild(detailsDiv);
            li.appendChild(deleteBtn);
            draftsList.appendChild(li);
        });
    }

    // Core Toolbar Save Command
    saveBtn.addEventListener('click', () => {
        const payload = textInput.value;
        if (!payload.trim()) {
            showToast("Cannot preserve an empty room");
            return;
        }

        const drafts = getDrafts();
        
        if (currentDraftId) {
            // Overwrite existing active file track
            const index = drafts.findIndex(d => d.id === currentDraftId);
            if (index !== -1) {
                drafts[index].content = payload;
                drafts[index].updatedAt = new Date().toISOString();
                saveDrafts(drafts);
                statusIndicator.textContent = "Saved to Vault";
                showToast("Entry updated");
            }
        } else {
            // Unshift clean object context setup
            const uniqueId = 'draft_' + Date.now();
            const timeString = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const newDraft = {
                id: uniqueId,
                title: `Draft (${timeString})`,
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

    // Copy Command Execution
    copyBtn.addEventListener('click', () => {
        if (!textInput.value.trim()) {
            showToast("Nothing to copy");
            return;
        }
        navigator.clipboard.writeText(textInput.value)
            .then(() => showToast("Copied content"))
            .catch(() => showToast("Clipboard action failed"));
    });

    // Export System
    downloadBtn.addEventListener('click', () => {
        const value = textInput.value;
        if (!value.trim()) {
            showToast("Write something before exporting");
            return;
        }
        const textBlob = new Blob([value], { type: 'text/plain' });
        const downloadUrl = URL.createObjectURL(textBlob);
        const trackingLink = document.createElement('a');
        trackingLink.download = `midroom_${Date.now()}.txt`;
        trackingLink.href = downloadUrl;
        document.body.appendChild(trackingLink);
        trackingLink.click();
        document.body.removeChild(trackingLink);
        URL.revokeObjectURL(downloadUrl);
    });

    // Drawer Management Controls
    menuToggle.addEventListener('click', () => {
        displayDrafts();
        sidebar.classList.add('active');
    });

    closeSidebar.addEventListener('click', () => {
        sidebar.classList.remove('active');
    });

    // New Canvas Session Reset Action
    newCanvasBtn.addEventListener('click', () => {
        currentDraftId = null;
        textInput.value = '';
        updateWordCount();
        statusIndicator.textContent = "Private Room";
        showToast("New blank room initialized");
    });
});
