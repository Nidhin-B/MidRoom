/* ==========================================
   MIDROOM — INTERACTIVE CORE LOGIC
   ========================================== */

// Grabbing all our HTML elements
const textInput = document.getElementById('text-input');
const wordCount = document.getElementById('word-count');
const menuBtn = document.getElementById('menu-btn');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const sidebar = document.getElementById('sidebar');
const draftsList = document.getElementById('drafts-list');
const saveBtn = document.getElementById('save-btn');
const copyBtn = document.getElementById('copy-btn');
const downloadBtn = document.getElementById('download-btn');

// --- 1. THE SMOOTH FOREST MENU TOGGLE ---
menuBtn.addEventListener('click', () => {
    sidebar.classList.add('active');
    loadDraftsList(); // Refresh the list every time menu opens
});

closeSidebarBtn.addEventListener('click', () => {
    sidebar.classList.remove('active');
});

// --- 2. REAL-TIME WORD COUNTER ---
textInput.addEventListener('input', () => {
    const text = textInput.value.trim();
    // Split text by spaces, filter out empty strings
    const words = text === "" ? 0 : text.split(/\s+/).length;
    wordCount.textContent = `${words} ${words === 1 ? 'word' : 'words'}`;
});

// --- 3. COPY TO CLIPBOARD BUTTON ---
copyBtn.addEventListener('click', () => {
    if (textInput.value.trim() === "") return;
    
    navigator.clipboard.writeText(textInput.value).then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = "Copied! 📋";
        copyBtn.style.color = "#a7f3d0"; // Temporary green glow
        
        // Smoothly reset button back after 2 seconds
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.color = "";
        }, 2000);
    });
});

// --- 4. DOWNLOAD AS .TXT FILE ---
downloadBtn.addEventListener('click', () => {
    const text = textInput.value;
    if (text.trim() === "") return;

    // Create a temporary hidden link element to trigger a download
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = `midroom-draft-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// --- 5. BROWSER STORAGE (LOCALSTORAGE) DRAFTS ---
saveBtn.addEventListener('click', () => {
    const text = textInput.value.trim();
    if (text === "") return;

    // Grab existing saved drafts or start empty array
    let savedDrafts = JSON.parse(localStorage.getItem('midroom_drafts')) || [];
    
    // Add new draft to the top of the stack
    savedDrafts.unshift({
        id: Date.now(),
        content: text,
        timestamp: new Date().toLocaleDateString()
    });

    // Limit to storing last 15 drafts so it stays super lightweight
    if (savedDrafts.length > 15) savedDrafts.pop();

    localStorage.setItem('midroom_drafts', JSON.stringify(savedDrafts));
    
    // Smooth visual feedback on button
    const originalText = saveBtn.textContent;
    saveBtn.textContent = "Saved to Vault 🌲";
    setTimeout(() => {
        saveBtn.textContent = originalText;
    }, 2000);
});

// Load and display drafts inside the sidebar
function loadDraftsList() {
    draftsList.innerHTML = "";
    const savedDrafts = JSON.parse(localStorage.getItem('midroom_drafts')) || [];

    if (savedDrafts.length === 0) {
        draftsList.innerHTML = `<li style="color: #2d4a3e; font-style: italic; cursor: default; background: transparent;">The vault is empty...</li>`;
        return;
    }

    savedDrafts.forEach(draft => {
        const li = document.createElement('li');
        // Sneak peek of the text inside the list item
        li.textContent = draft.content.substring(0, 25) + (draft.content.length > 25 ? "..." : "");
        li.title = `Saved on ${draft.timestamp}`;
        
        // When clicked, load draft into the main editor area and close menu
        li.addEventListener('click', () => {
            textInput.value = draft.content;
            textInput.dispatchEvent(new Event('input')); // Update word count
            sidebar.classList.remove('active');
        });
        
        draftsList.appendChild(li);
    });
}
