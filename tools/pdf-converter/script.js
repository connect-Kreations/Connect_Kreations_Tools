let selectedFiles = [];
let fileDataUrls = [];

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const imageList = document.getElementById('imageList');
const convertBtn = document.getElementById('convertBtn');
const convertAllBtn = document.getElementById('convertAllBtn');
const downloadZipBtn = document.getElementById('downloadZipBtn');

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
    const newFiles = Array.from(files).filter(file => 
        file.type.startsWith('image/') || 
        file.type === 'application/pdf' ||
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword' ||
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel' ||
        file.type === 'text/csv' ||
        file.type === 'text/plain' ||
        file.name.match(/\.(jpg|jpeg|png|gif|bmp|webp|tiff|svg|doc|docx|xls|xlsx|csv|txt)$/i)
    );
    
    if (newFiles.length === 0) {
        Utils.showNotification('Please select valid files', 'error');
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
        let previewHtml = '';
        let dataUrl = '';
        
        if (file.type.startsWith('image/')) {
            dataUrl = await readFileAsDataURL(file);
            fileDataUrls.push(dataUrl);
            previewHtml = `<img src="${dataUrl}" alt="${file.name}" class="image-preview">`;
        } else {
            fileDataUrls.push(null);
            const icon = getFileIcon(file);
            previewHtml = `<div class="file-icon-preview">${icon}</div>`;
        }
        
        const item = document.createElement('div');
        item.className = 'image-item';
        item.innerHTML = `
            ${previewHtml}
            <div class="image-info">
                <div class="image-name">${file.name}</div>
                <div class="image-size">${Utils.formatFileSize(file.size)}</div>
            </div>
            <div class="image-actions">
                <button class="btn-icon" onclick="convertSingle(${i})" title="Convert to PDF">📄</button>
                <button class="btn-icon" onclick="replaceFile(${i})" title="Replace">🔄</button>
                <button class="btn-icon btn-delete" onclick="deleteFile(${i})" title="Delete">🗑️</button>
            </div>
        `;
        imageList.appendChild(item);
    }
}

function getFileIcon(file) {
    const name = file.name.toLowerCase();
    if (name.match(/\.(docx?)$/)) return '📝';
    if (name.match(/\.(xlsx?|csv)$/)) return '📊';
    if (name.match(/\.txt$/)) return '📄';
    return '📎';
}

function updateButtons() {
    if (selectedFiles.length > 0) {
        convertBtn.style.display = 'block';
        if (selectedFiles.length > 1) {
            convertAllBtn.style.display = 'inline-block';
            downloadZipBtn.style.display = 'inline-block';
        } else {
            convertAllBtn.style.display = 'none';
            downloadZipBtn.style.display = 'none';
        }
    } else {
        convertBtn.style.display = 'none';
        convertAllBtn.style.display = 'none';
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
    input.accept = 'image/*,.doc,.docx,.xls,.xlsx,.csv,.txt';
    input.onchange = (e) => {
        if (e.target.files.length > 0) {
            selectedFiles[index] = e.target.files[0];
            displayImages();
            Utils.showNotification('File replaced', 'success');
        }
    };
    input.click();
}

async function convertSingle(index) {
    const file = selectedFiles[index];
    
    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        
        if (file.type.startsWith('image/')) {
            const dataUrl = fileDataUrls[index];
            const img = await loadImage(dataUrl);
            await addImageToPDF(pdf, img, dataUrl);
        } else if (file.name.match(/\.(docx?)$/i)) {
            await addWordToPDF(pdf, file);
        } else if (file.name.match(/\.(xlsx?|csv)$/i)) {
            await addExcelToPDF(pdf, file);
        } else if (file.type === 'text/plain') {
            await addTextToPDF(pdf, file);
        }
        
        const filename = file.name.replace(/\.[^/.]+$/, '') + '.pdf';
        pdf.save(filename);
        Utils.showNotification(`${file.name} converted to PDF`, 'success');
    } catch (error) {
        console.error(error);
        Utils.showNotification(`Failed to convert ${file.name}`, 'error');
    }
}

async function addImageToPDF(pdf, img, dataUrl) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgRatio = img.width / img.height;
    const pageRatio = pageWidth / pageHeight;
    
    let finalWidth, finalHeight;
    if (imgRatio > pageRatio) {
        finalWidth = pageWidth - 20;
        finalHeight = finalWidth / imgRatio;
    } else {
        finalHeight = pageHeight - 20;
        finalWidth = finalHeight * imgRatio;
    }
    
    const x = (pageWidth - finalWidth) / 2;
    const y = (pageHeight - finalHeight) / 2;
    
    pdf.addImage(dataUrl, 'JPEG', x, y, finalWidth, finalHeight);
}

async function addWordToPDF(pdf, file) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value;
    
    pdf.setFontSize(12);
    const lines = pdf.splitTextToSize(text, 170);
    pdf.text(lines, 20, 20);
}

async function addExcelToPDF(pdf, file) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const csvData = XLSX.utils.sheet_to_csv(firstSheet);
    
    pdf.setFontSize(10);
    const lines = pdf.splitTextToSize(csvData, 170);
    pdf.text(lines, 20, 20);
}

async function addTextToPDF(pdf, file) {
    const text = await file.text();
    pdf.setFontSize(12);
    const lines = pdf.splitTextToSize(text, 170);
    pdf.text(lines, 20, 20);
}

convertBtn.addEventListener('click', convertToPDF);
convertAllBtn.addEventListener('click', convertAllToPDF);
downloadZipBtn.addEventListener('click', downloadAsZip);

async function convertToPDF() {
    convertBtn.disabled = true;
    convertBtn.textContent = 'Converting...';
    
    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            
            if (i > 0) {
                pdf.addPage();
            }
            
            if (file.type.startsWith('image/')) {
                const dataUrl = fileDataUrls[i];
                const img = await loadImage(dataUrl);
                await addImageToPDF(pdf, img, dataUrl);
            } else if (file.name.match(/\.(docx?)$/i)) {
                await addWordToPDF(pdf, file);
            } else if (file.name.match(/\.(xlsx?|csv)$/i)) {
                await addExcelToPDF(pdf, file);
            } else if (file.type === 'text/plain') {
                await addTextToPDF(pdf, file);
            }
        }
        
        pdf.save('combined.pdf');
        Utils.showNotification('Combined PDF created successfully!', 'success');
    } catch (error) {
        console.error(error);
        Utils.showNotification('Failed to create PDF', 'error');
    }
    
    convertBtn.disabled = false;
    convertBtn.textContent = 'Convert All to Single PDF';
}

async function convertAllToPDF() {
    convertAllBtn.disabled = true;
    convertAllBtn.textContent = 'Converting...';
    
    for (let i = 0; i < selectedFiles.length; i++) {
        await convertSingle(i);
    }
    
    convertAllBtn.disabled = false;
    convertAllBtn.textContent = 'Convert Each to PDF';
    Utils.showNotification('All files converted!', 'success');
}

async function downloadAsZip() {
    downloadZipBtn.disabled = true;
    downloadZipBtn.textContent = 'Creating ZIP...';
    
    try {
        const JSZip = window.JSZip ? window.JSZip : await loadJSZip();
        const zip = new JSZip();
        
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();
            
            if (file.type.startsWith('image/')) {
                const dataUrl = fileDataUrls[i];
                const img = await loadImage(dataUrl);
                await addImageToPDF(pdf, img, dataUrl);
            } else if (file.name.match(/\.(docx?)$/i)) {
                await addWordToPDF(pdf, file);
            } else if (file.name.match(/\.(xlsx?|csv)$/i)) {
                await addExcelToPDF(pdf, file);
            } else if (file.type === 'text/plain') {
                await addTextToPDF(pdf, file);
            }
            
            const filename = file.name.replace(/\.[^/.]+$/, '') + '.pdf';
            const pdfBlob = pdf.output('blob');
            zip.file(filename, pdfBlob);
        }
        
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        Utils.downloadFile(zipBlob, 'converted-pdfs.zip');
        Utils.showNotification('ZIP file downloaded!', 'success');
    } catch (error) {
        console.error(error);
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
