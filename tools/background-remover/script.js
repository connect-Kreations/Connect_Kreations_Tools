const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewArea = document.getElementById('previewArea');
const originalCanvas = document.getElementById('originalCanvas');
const resultCanvas = document.getElementById('resultCanvas');
const removeBtn = document.getElementById('removeBtn');
const downloadBtn = document.getElementById('downloadBtn');

let selectedFile = null;
let resultBlob = null;

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
    if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        Utils.showNotification('Please select an image file', 'error');
        return;
    }
    
    selectedFile = file;
    displayOriginal(file);
    previewArea.style.display = 'block';
    removeBtn.style.display = 'block';
    downloadBtn.style.display = 'none';
}

function displayOriginal(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            originalCanvas.width = img.width;
            originalCanvas.height = img.height;
            const ctx = originalCanvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

removeBtn.addEventListener('click', async () => {
    removeBtn.disabled = true;
    removeBtn.textContent = 'Processing... (This may take a moment)';
    
    try {
        // Simple background removal using canvas manipulation
        const img = await loadImage(selectedFile);
        resultCanvas.width = img.width;
        resultCanvas.height = img.height;
        
        const ctx = resultCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, resultCanvas.width, resultCanvas.height);
        const data = imageData.data;
        
        // Simple background removal (removes white/light backgrounds)
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // If pixel is close to white, make it transparent
            if (r > 200 && g > 200 && b > 200) {
                data[i + 3] = 0; // Set alpha to 0
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        resultCanvas.toBlob((blob) => {
            resultBlob = blob;
            downloadBtn.style.display = 'block';
            Utils.showNotification('Background removed!', 'success');
        }, 'image/png');
        
    } catch (error) {
        Utils.showNotification('Failed to remove background', 'error');
        console.error(error);
    }
    
    removeBtn.disabled = false;
    removeBtn.textContent = 'Remove Background';
});

downloadBtn.addEventListener('click', () => {
    if (resultBlob) {
        const filename = selectedFile.name.replace(/\.[^/.]+$/, '') + '_no_bg.png';
        Utils.downloadFile(resultBlob, filename);
        Utils.showNotification('Image downloaded!', 'success');
    }
});

function loadImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
