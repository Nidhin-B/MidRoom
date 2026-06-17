// TRACKER FOR REACTIVE BACKGROUND FADE OUT
let typingGlowTimer = null;

// 2. REAL-TIME WORD COUNTER, AUTO-SAVE, & REACTIVE GLOW ENGINE
textInput.addEventListener('input', () => {
    // Word counter execution
    const text = textInput.value.trim();
    const words = text === '' ? 0 : text.split(/\s+/).length;
    wordCountSpan.textContent = words;

    // A. ACTIVATE REACTIVE GLOW ON BODY
    document.body.classList.add('typing');
    
    // Clear previous fade-out countdown
    clearTimeout(typingGlowTimer);
    
    // If user stops typing for 1 second, smoothly fade out the flare
    typingGlowTimer = setTimeout(() => {
        document.body.classList.remove('typing');
    }, 1000);

    // B. TRIGGER BACKGROUND AUTO-SAVE PIPELINE
    if (text.length > 0) {
        statusIndicator.textContent = "typing...";
        statusIndicator.style.color = "#8b5cf6"; // Royal violet state
        
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(() => {
            autoSaveDraft();
        }, 1500); // 1.5 seconds of silence saves to vault
    }
});
