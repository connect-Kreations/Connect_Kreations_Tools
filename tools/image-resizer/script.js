let selectedFiles = [];
let fileDataUrls = [];

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const imageList = document.getElementById('imageList');
const resizeBtn = document.getElementById('resizeBtn');
const downloadZipBtn = document.getElementById('downloadZipBtn');
const widthInput = document.getElementById('widthInput');
const heightInput = document.getElementById('heightInput');
const maintainRatio = document.getElementById('maintainRatio');
const resizeControls = document.querySelector('.resize-controls');

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
        
        const img = await loadImage(dataUrl);
        
        const item = document.createElement('div');
        item.className = 'image-item';
        item.innerHTML = `
            <img src="${dataUrl}" alt="${file.name}" class="image-preview">
            <div class="image-info">
                <div class="image-name">${file.name}</div>
                <div class="image-size">${img.width} × ${img.height} | ${Utils.formatFileSize(file.size)}</div>
            </div>
            <div class="image-actions">
                <button class="btn-icon" onclick="resizeSingle(${i})" title="Resize">📐</button>
                <button class="btn-icon" onclick="replaceFile(${i})" title="Replace">📁</button>
                <button class="btn-icon btn-delete" onclick="deleteFile(${i})" title="Delete">🗑️</button>
            </div>
        `;
        imageList.appendChild(item);
    }
}

function updateButtons() {
    if (selectedFiles.length > 0) {
        resizeControls.style.display = 'block';
        resizeBtn.style.display = 'inline-block';
        downloadZipBtn.style.display = selectedFiles.length > 1 ? 'inline-block' : 'none';
    } else {
        resizeControls.style.display = 'none';
        resizeBtn.style.display = 'none';
        downloadZipBtn.style.display = 'none';
    }
}

function deleteFile(index) {
    selectedFiles.splice(index, 1);
    displayImages();
    updateButtons();
    Utils.showNotification('File removed', 'success');
}

function replaceFile(index) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        if (e.target.files.length > 0) {
            selectedFiles[index] = e.target.files[0];
            displayImages();
            Utils.showNotification('File replaced', 'success');
        }
    };
    input.click();
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

async function resizeSingle(index) {
    const file = selectedFiles[index];
    const dataUrl = fileDataUrls[index];
    
    try {
        const resized = await resizeImage(dataUrl);
        const filename = file.name.replace(/\.[^/.]+$/, '') + '_resized' + file.name.match(/\.[^/.]+$/)[0];
        Utils.downloadFile(resized, filename);
        Utils.showNotification(`Resized ${file.name}`, 'success');
    } catch (error) {
        Utils.showNotification(`Failed to resize ${file.name}`, 'error');
    }
}

resizeBtn.addEventListener('click', async () => {
    resizeBtn.disabled = true;
    resizeBtn.textContent = 'Resizing...';
    
    for (let i = 0; i < selectedFiles.length; i++) {
        await resizeSingle(i);
    }
    
    resizeBtn.disabled = false;
    resizeBtn.textContent = 'Resize All';
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
            const resized = await resizeImage(dataUrl);
            const filename = file.name.replace(/\.[^/.]+$/, '') + '_resized' + file.name.match(/\.[^/.]+$/)[0];
            zip.file(filename, resized);
        }
        
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        Utils.downloadFile(zipBlob, 'resized-images.zip');
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

async function resizeImage(dataUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            let width = parseInt(widthInput.value) || img.width;
            let height = parseInt(heightInput.value) || img.height;
            
            if (maintainRatio.checked) {
                if (widthInput.value && !heightInput.value) {
                    height = (width / img.width) * img.height;
                } else if (heightInput.value && !widthInput.value) {
                    width = (height / img.height) * img.width;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Resize failed'));
                }
            }, 'image/png', 1.0);
        };
        img.onerror = reject;
        img.src = dataUrl;
    });
}
