let selectedFiles = [];
let fileDataUrls = [];

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const imageList = document.getElementById('imageList');
const convertBtn = document.getElementById('convertBtn');
const downloadZipBtn = document.getElementById('downloadZipBtn');
const formatSelect = document.getElementById('format');

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
                <button class="btn-icon" onclick="convertSingle(${i})" title="Convert">🔄</button>
                <button class="btn-icon" onclick="replaceFile(${i})" title="Replace">📁</button>
                <button class="btn-icon btn-delete" onclick="deleteFile(${i})" title="Delete">🗑️</button>
            </div>
        `;
        imageList.appendChild(item);
    }
}

function updateButtons() {
    if (selectedFiles.length > 0) {
        convertBtn.style.display = 'inline-block';
        downloadZipBtn.style.display = selectedFiles.length > 1 ? 'inline-block' : 'none';
    } else {
        convertBtn.style.display = 'none';
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

convertBtn.addEventListener('click', convertImages);
downloadZipBtn.addEventListener('click', downloadAsZip);

async function convertSingle(index) {
    const file = selectedFiles[index];
    const targetFormat = formatSelect.value;
    const extension = targetFormat.split('/')[1];
    
    try {
        const converted = await convertImage(file, targetFormat);
        const filename = file.name.replace(/\.[^/.]+$/, '') + '.' + extension;
        Utils.downloadFile(converted, filename);
        Utils.showNotification(`Converted ${file.name}`, 'success');
    } catch (error) {
        Utils.showNotification(`Failed to convert ${file.name}`, 'error');
    }
}

async function convertImages() {
    const targetFormat = formatSelect.value;
    const extension = targetFormat.split('/')[1];
    
    convertBtn.disabled = true;
    convertBtn.textContent = 'Converting...';
    
    for (const file of selectedFiles) {
        try {
            const converted = await convertImage(file, targetFormat);
            const filename = file.name.replace(/\.[^/.]+$/, '') + '.' + extension;
            Utils.downloadFile(converted, filename);
            Utils.showNotification(`Converted ${file.name}`, 'success');
        } catch (error) {
            Utils.showNotification(`Failed to convert ${file.name}`, 'error');
        }
    }
    
    convertBtn.disabled = false;
    convertBtn.textContent = 'Convert All';
}

async function downloadAsZip() {
    downloadZipBtn.disabled = true;
    downloadZipBtn.textContent = 'Creating ZIP...';
    
    try {
        const JSZip = window.JSZip ? window.JSZip : await loadJSZip();
        const zip = new JSZip();
        const targetFormat = formatSelect.value;
        const extension = targetFormat.split('/')[1];
        
        for (const file of selectedFiles) {
            const converted = await convertImage(file, targetFormat);
            const filename = file.name.replace(/\.[^/.]+$/, '') + '.' + extension;
            zip.file(filename, converted);
        }
        
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        Utils.downloadFile(zipBlob, 'converted-images.zip');
        Utils.showNotification('ZIP file downloaded!', 'success');
    } catch (error) {
        Utils.showNotification('Failed to create ZIP', 'error');
    }
    
    downloadZipBtn.disabled = false;
    downloadZipBtn.textContent = 'Download All as ZIP';
}

function loadJSZip() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => resolve(window.JSZip);
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function convertImage(file, targetFormat) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Conversion failed'));
                    }
                }, targetFormat, 0.95);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
