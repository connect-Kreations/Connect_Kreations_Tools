const topicInput = document.getElementById('topicInput');
const generateBtn = document.getElementById('generateBtn');
const hashtagsOutput = document.getElementById('hashtagsOutput');
const hashtagsList = document.getElementById('hashtagsList');
const copyBtn = document.getElementById('copyBtn');

let generatedHashtags = [];

generateBtn.addEventListener('click', generateHashtags);

function generateHashtags() {
    const topic = topicInput.value.trim();
    
    if (!topic) {
        Utils.showNotification('Please enter a topic', 'error');
        return;
    }
    
    const keywords = topic.toLowerCase().split(/\s+/);
    generatedHashtags = [];
    
    // Main hashtags
    const mainTag = topic.replace(/\s+/g, '');
    generatedHashtags.push(`#${mainTag}`);
    
    keywords.forEach(word => {
        if (word.length > 2) generatedHashtags.push(`#${word}`);
    });
    
    // Popular Instagram hashtag patterns
    const patterns = [
        `${mainTag}daily`,
        `${mainTag}life`,
        `${mainTag}love`,
        `${mainTag}gram`,
        `${mainTag}community`,
        `${mainTag}goals`,
        `${mainTag}inspiration`,
        `${mainTag}vibes`,
        `${mainTag}style`,
        `${mainTag}addict`,
        `${mainTag}lover`,
        `${mainTag}oftheday`,
        `${mainTag}2025`,
        `insta${mainTag}`,
        `daily${mainTag}`
    ];
    
    patterns.forEach(p => generatedHashtags.push(`#${p}`));
    
    // Generic popular hashtags
    const popular = [
        '#instagood', '#photooftheday', '#love', '#beautiful', '#happy',
        '#follow', '#like4like', '#instadaily', '#picoftheday', '#followme',
        '#fashion', '#style', '#instalike', '#repost', '#viral',
        '#trending', '#explore', '#explorepage', '#fyp', '#foryou'
    ];
    
    generatedHashtags.push(...popular);
    
    // Remove duplicates
    generatedHashtags = [...new Set(generatedHashtags)];
    
    displayHashtags();
    hashtagsOutput.style.display = 'block';
    Utils.showNotification('Hashtags generated successfully!', 'success');
}

function displayHashtags() {
    hashtagsList.innerHTML = '';
    
    generatedHashtags.forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'hashtag-item';
        tagEl.textContent = tag;
        tagEl.style.cssText = `
            padding: 0.5rem 1rem;
            background: linear-gradient(135deg, rgba(225, 48, 108, 0.2), rgba(193, 53, 132, 0.2));
            border: 1px solid rgba(225, 48, 108, 0.3);
            border-radius: 2rem;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        
        tagEl.addEventListener('mouseenter', () => {
            tagEl.style.background = 'linear-gradient(135deg, rgba(225, 48, 108, 0.4), rgba(193, 53, 132, 0.4))';
            tagEl.style.transform = 'scale(1.05)';
        });
        
        tagEl.addEventListener('mouseleave', () => {
            tagEl.style.background = 'linear-gradient(135deg, rgba(225, 48, 108, 0.2), rgba(193, 53, 132, 0.2))';
            tagEl.style.transform = 'scale(1)';
        });
        
        hashtagsList.appendChild(tagEl);
    });
}

copyBtn.addEventListener('click', () => {
    const hashtagsText = generatedHashtags.join(' ');
    navigator.clipboard.writeText(hashtagsText).then(() => {
        Utils.showNotification('Hashtags copied to clipboard!', 'success');
    }).catch(() => {
        Utils.showNotification('Failed to copy hashtags', 'error');
    });
});
