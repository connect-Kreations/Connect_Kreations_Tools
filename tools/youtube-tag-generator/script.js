const topicInput = document.getElementById('topicInput');
const generateBtn = document.getElementById('generateBtn');
const tagsOutput = document.getElementById('tagsOutput');
const tagsList = document.getElementById('tagsList');
const copyBtn = document.getElementById('copyBtn');

let generatedTags = [];

generateBtn.addEventListener('click', generateTags);

function generateTags() {
    const topic = topicInput.value.trim();
    
    if (!topic) {
        Utils.showNotification('Please enter a topic', 'error');
        return;
    }
    
    const keywords = topic.toLowerCase().split(/\s+/);
    generatedTags = [];
    
    // Main keywords
    generatedTags.push(topic);
    keywords.forEach(word => {
        if (word.length > 3) generatedTags.push(word);
    });
    
    // Common YouTube tag patterns
    const patterns = [
        `${topic} tutorial`,
        `${topic} guide`,
        `${topic} tips`,
        `${topic} 2025`,
        `how to ${topic}`,
        `${topic} for beginners`,
        `${topic} explained`,
        `${topic} step by step`,
        `best ${topic}`,
        `${topic} tricks`,
        `learn ${topic}`,
        `${topic} course`,
        `${topic} basics`,
        `${topic} advanced`,
        `${topic} examples`
    ];
    
    generatedTags.push(...patterns);
    
    // Remove duplicates
    generatedTags = [...new Set(generatedTags)];
    
    displayTags();
    tagsOutput.style.display = 'block';
    Utils.showNotification('Tags generated successfully!', 'success');
}

function displayTags() {
    tagsList.innerHTML = '';
    
    generatedTags.forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'tag-item';
        tagEl.textContent = tag;
        tagEl.style.cssText = `
            padding: 0.5rem 1rem;
            background: rgba(99, 102, 241, 0.2);
            border: 1px solid rgba(99, 102, 241, 0.3);
            border-radius: 2rem;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        
        tagEl.addEventListener('mouseenter', () => {
            tagEl.style.background = 'rgba(99, 102, 241, 0.4)';
            tagEl.style.transform = 'scale(1.05)';
        });
        
        tagEl.addEventListener('mouseleave', () => {
            tagEl.style.background = 'rgba(99, 102, 241, 0.2)';
            tagEl.style.transform = 'scale(1)';
        });
        
        tagsList.appendChild(tagEl);
    });
}

copyBtn.addEventListener('click', () => {
    const tagsText = generatedTags.join(', ');
    navigator.clipboard.writeText(tagsText).then(() => {
        Utils.showNotification('Tags copied to clipboard!', 'success');
    }).catch(() => {
        Utils.showNotification('Failed to copy tags', 'error');
    });
});
