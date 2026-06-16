/* ==========================================
   MIDROOM — INTERACTIVE CORE LOGIC
   ========================================== */

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
    loadDraftsList(); 
});

closeSidebarBtn.addEventListener('click', () => {
    sidebar.classList.remove('active');
});

// --- 2. REAL-TIME WORD COUNTER ---
textInput.addEventListener('input', () => {
    const text = textInput.value.trim();
    const words = text === "" ? 0 : text.split(/\s+/).length;
    wordCount.textContent = `${words} ${words === 1 ? 'word' : 'words'}`;
});

// --- 3. COPY TO CLIPBOARD BUTTON ---
copyBtn.addEventListener('click', () => {
    if (textInput.value.trim() === "") return;
    
    navigator.clipboard.writeText(textInput.value).then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = "Copied! 📋";
        copyBtn.style.color = "#a7f3d0"; 
        
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

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = `midroom-draft-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// --- 5. BROWSER STORAGE (LOCALSTORAGE) DRAFTS ---
saveBtn.addEventListener('click', () => {
    const text = textInput.value.trim();
    if (text === "") return;

    let savedDrafts = JSON.parse(localStorage.getItem('midroom_drafts')) || [];
    
    savedDrafts.unshift({
        id: Date.now(),
        content: text,
        timestamp: new Date().toLocaleDateString()
    });

    if (savedDrafts.length > 15) savedDrafts.pop();

    localStorage.setItem('midroom_drafts', JSON.stringify(savedDrafts));
    
    const originalText = saveBtn.textContent;
    saveBtn.textContent = "Saved to Vault 🌲";
    setTimeout(() => {
        saveBtn.textContent = originalText;
    }, 2000);
});

function loadDraftsList() {
    draftsList.innerHTML = "";
    const savedDrafts = JSON.parse(localStorage.getItem('midroom_drafts')) || [];

    if (savedDrafts.length === 0) {
        draftsList.innerHTML = `<li style="color: #2d4a3e; font-style: italic; cursor: default; background: transparent;">The vault is empty...</li>`;
        return;
    }

    savedDrafts.forEach(draft => {
        const li = document.createElement('li');
        li.textContent = draft.content.substring(0, 25) + (draft.content.length > 25 ? "..." : "");
        li.title = `Saved on ${draft.timestamp}`;
        
        li.addEventListener('click', () => {
            textInput.value = draft.content;
            textInput.dispatchEvent(new Event('input')); 
            sidebar.classList.remove('active');
        });
        
        draftsList.appendChild(li);
    });
}
