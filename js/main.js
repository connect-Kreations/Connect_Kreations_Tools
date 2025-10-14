// Shared utility functions
const Utils = {
    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    // Download file
    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};

// Smooth scroll for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Add animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.8s ease forwards';
        }
    });
}, observerOptions);

document.querySelectorAll('.tool-card').forEach(card => {
    observer.observe(card);
});


// Tool Search Functionality
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('toolSearch');
    const searchClear = document.getElementById('searchClear');
    const searchResults = document.getElementById('searchResults');
    const toolsGrid = document.querySelector('.tools-grid');
    
    if (searchInput && toolsGrid) {
        const toolCards = Array.from(toolsGrid.querySelectorAll('.tool-card'));
        
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            
            if (query) {
                searchClear.style.display = 'block';
            } else {
                searchClear.style.display = 'none';
            }
            
            let visibleCount = 0;
            
            toolCards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const description = card.querySelector('p').textContent.toLowerCase();
                
                if (title.includes(query) || description.includes(query)) {
                    card.style.display = 'block';
                    card.style.animation = 'fadeInUp 0.4s ease';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });
            
            if (query && visibleCount === 0) {
                searchResults.innerHTML = '<div class="no-results">No tools found matching "' + query + '"</div>';
            } else if (query) {
                searchResults.innerHTML = 'Found ' + visibleCount + ' tool' + (visibleCount !== 1 ? 's' : '');
            } else {
                searchResults.innerHTML = '';
            }
        });
        
        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            searchClear.style.display = 'none';
            searchResults.innerHTML = '';
            toolCards.forEach(card => {
                card.style.display = 'block';
            });
        });
    }
});
