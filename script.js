// Call this function whenever you load or refresh the sidebar list
function displayDrafts() {
    const draftsList = document.getElementById('drafts-list');
    draftsList.innerHTML = ''; // Clear old items
    
    // Assuming your drafts are stored as an array of objects: { id, title, content }
    let drafts = JSON.parse(localStorage.getItem('midroom_drafts')) || [];
    
    if (drafts.length === 0) {
        draftsList.innerHTML = '<li style="color: #1a3327; font-style: italic;">Vault is empty...</li>';
        return;
    }
    
    drafts.forEach((draft, index) => {
        const li = document.createElement('li');
        li.className = 'draft-item';
        
        // Editable text input for the name
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'draft-name-input';
        nameInput.value = draft.title || `Untitled Draft ${index + 1}`;
        
        // Handle saving the new name when pressing Enter or clicking away
        const saveName = () => {
            const newName = nameInput.value.trim();
            if (newName && newName !== draft.title) {
                drafts[index].title = newName;
                localStorage.setItem('midroom_drafts', JSON.stringify(drafts));
                showToast("Draft renamed");
            }
        };
        
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                nameInput.blur(); // Triggers the blur event below
            }
        });
        nameInput.addEventListener('blur', saveName);
        
        // Clicking the input shouldn't automatically load the draft content
        nameInput.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Click container to load the draft content into main editor
        li.addEventListener('click', () => {
            loadDraftIntoEditor(draft.id); 
        });
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-draft-btn';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Stop from loading the deleted draft
            deleteDraft(draft.id);
        });
        
        li.appendChild(nameInput);
        li.appendChild(deleteBtn);
        draftsList.appendChild(li);
    });
}
