let selectedFiles = [];
let fileDataUrls = [];

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const imageList = document.getElementById('imageList');
const applyBtn = document.getElementById('applyBtn');
const downloadZipBtn = document.getElementById('downloadZipBtn');
const watermarkControls = document.querySelector('.watermark-controls');
const watermarkText = document.getElementById('watermarkText');
const position = document.getElementById('position');
const opacity = document.getElementById('opacity');
const opacityValue = document.getElementById('opacityValue');

opacity.addEventListener('input', (e) => {
    opacityValue.textContent = e.target.value;
});

uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

function handleFiles(files) {
    const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (newFiles.length === 0) {
        Utils.showNotification('Please select valid image files', 'error');
        return;
    }
    
    selectedFiles = [...selectedFiles, ...newFiles];
    displayImages();
    updateButtons();
}

async function displayImages() {
    imageList.innerHTML = '';
    fileDataUrls = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const dataUrl = await readFileAsDataURL(file);
        fileDataUrls.push(dataUrl);
        
        const item = document.createElement('div');
        item.className = 'image-item';
        item.innerHTML = `
            <img src="${dataUrl}" alt="${file.name}" class="image-preview">
            <div class="image-info">
                <div class="image-name">${file.name}</div>
                <div class="image-size">${Utils.formatFileSize(file.size)}</div>
            </div>
            <div class="image-actions">
                <button class="btn-icon" onclick="applySingle(${i})" title="Apply Watermark">©️</button>
                <button class="btn-icon btn-delete" onclick="deleteFile(${i})" title="Delete">🗑️</button>
            </div>
        `;
        imageList.appendChild(item);
    }
}

function updateButtons() {
    if (selectedFiles.length > 0) {
        watermarkControls.style.display = 'block';
        applyBtn.style.display = 'inline-block';
        downloadZipBtn.style.display = selectedFiles.length > 1 ? 'inline-block' : 'none';
    } else {
        watermarkControls.style.display = 'none';
        applyBtn.style.display = 'none';
        downloadZipBtn.style.display = 'none';
    }
}

function deleteFile(index) {
    selectedFiles.splice(index, 1);
    displayImages();
    updateButtons();
    Utils.showNotification('File removed', 'success');
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function applySingle(index) {
    const file = selectedFiles[index];
    const dataUrl = fileDataUrls[index];
    
    try {
        const watermarked = await applyWatermark(dataUrl);
        const filename = file.name.replace(/\.[^/.]+$/, '') + '_watermarked' + file.name.match(/\.[^/.]+$/)[0];
        Utils.downloadFile(watermarked, filename);
        Utils.showNotification(`Watermark applied to ${file.name}`, 'success');
    } catch (error) {
        Utils.showNotification(`Failed to apply watermark to ${file.name}`, 'error');
    }
}

applyBtn.addEventListener('click', async () => {
    applyBtn.disabled = true;
    applyBtn.textContent = 'Applying...';
    
    for (let i = 0; i < selectedFiles.length; i++) {
        await applySingle(i);
    }
    
    applyBtn.disabled = false;
    applyBtn.textContent = 'Apply Watermark to All';
});

downloadZipBtn.addEventListener('click', async () => {
    downloadZipBtn.disabled = true;
    downloadZipBtn.textContent = 'Creating ZIP...';
    
    try {
        const JSZip = window.JSZip || await loadJSZip();
        const zip = new JSZip();
        
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const dataUrl = fileDataUrls[i];
            const watermarked = await applyWatermark(dataUrl);
            const filename = file.name.replace(/\.[^/.]+$/, '') + '_watermarked' + file.name.match(/\.[^/.]+$/)[0];
            zip.file(filename, watermarked);
        }
        
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        Utils.downloadFile(zipBlob, 'watermarked-images.zip');
        Utils.showNotification('ZIP file downloaded!', 'success');
    } catch (error) {
        Utils.showNotification('Failed to create ZIP', 'error');
    }
    
    downloadZipBtn.disabled = false;
    downloadZipBtn.textContent = 'Download All as ZIP';
});

function loadJSZip() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => resolve(window.JSZip);
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function applyWatermark(dataUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            // Apply watermark
            const text = watermarkText.value || '© Ideaota Tools';
            const alpha = opacity.value / 100;
            const pos = position.value;
            
            ctx.globalAlpha = alpha;
            ctx.font = `${Math.floor(img.width / 30)}px Arial`;
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            
            const metrics = ctx.measureText(text);
            const textWidth = metrics.width;
            const textHeight = parseInt(ctx.font);
            
            let x, y;
            const padding = 20;
            
            switch (pos) {
                case 'bottom-right':
                    x = img.width - textWidth - padding;
                    y = img.height - padding;
                    break;
                case 'bottom-left':
                    x = padding;
                    y = img.height - padding;
                    break;
                case 'top-right':
                    x = img.width - textWidth - padding;
                    y = textHeight + padding;
                    break;
                case 'top-left':
                    x = padding;
                    y = textHeight + padding;
                    break;
                case 'center':
                    x = (img.width - textWidth) / 2;
                    y = img.height / 2;
                    break;
            }
            
            ctx.strokeText(text, x, y);
            ctx.fillText(text, x, y);
            
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Watermark failed'));
                }
            }, 'image/png');
        };
        img.onerror = reject;
        img.src = dataUrl;
    });
}
