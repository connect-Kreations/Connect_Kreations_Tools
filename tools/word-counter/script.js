const textInput = document.getElementById('textInput');
const wordCount = document.getElementById('wordCount');
const charCount = document.getElementById('charCount');
const charNoSpaceCount = document.getElementById('charNoSpaceCount');
const sentenceCount = document.getElementById('sentenceCount');
const paragraphCount = document.getElementById('paragraphCount');
const readingTime = document.getElementById('readingTime');
const clearBtn = document.getElementById('clearBtn');

textInput.addEventListener('input', updateStats);

function updateStats() {
    const text = textInput.value;
    
    // Words
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    wordCount.textContent = words.length;
    
    // Characters
    charCount.textContent = text.length;
    charNoSpaceCount.textContent = text.replace(/\s/g, '').length;
    
    // Sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    sentenceCount.textContent = sentences.length;
    
    // Paragraphs
    const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0);
    paragraphCount.textContent = paragraphs.length;
    
    // Reading time (average 200 words per minute)
    const minutes = Math.ceil(words.length / 200);
    readingTime.textContent = minutes;
}

clearBtn.addEventListener('click', () => {
    textInput.value = '';
    updateStats();
    Utils.showNotification('Text cleared', 'success');
});
