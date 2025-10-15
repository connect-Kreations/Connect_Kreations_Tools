const { PDFDocument, rgb, StandardFonts } = PDFLib;

let files = [];
let draggedItem = null;

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const filesContainer = document.getElementById('filesContainer');
const filesList = document.getElementById('filesList');
const fileCount = document.getElementById('fileCount');
const clearAllBtn = document.getElementById('clearAllBtn');
const mergeOptions = document.getElementById('mergeOptions');
const mergeBtn = document.getElementById('mergeBtn');
const addBookmarks = document.getElementById('addBookmarks');
const addPageNumbers = document.getElementById('addPageNumbers');

// Upload area click
uploadArea.addEventListener('click', () => fileInput.click());

// File input change
fileInput.addEventListener('change', (e) => {
    handleFiles(Array.from(e.target.files));
    fileInput.value = '';
});

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    handleFiles(Array.from(e.dataTransfer.files));
});

// Clear all
clearAllBtn.addEventListener('click', () => {
    files = [];
    updateFilesList();
});

// Merge button
mergeBtn.addEventListener('click', mergePDFs);

function handleFiles(newFiles) {
    const validFiles = newFiles.filter(file => {
        return file.type === 'application/pdf' || file.type.startsWith('image/');
    });

    if (validFiles.length === 0) {
        alert('Please select PDF files or images');
        return;
    }

    files.push(...validFiles.map((file, index) => ({
        id: Date.now() + index,
        file: file,
        name: file.name,
        size: file.size,
        type: file.type
    })));

    updateFilesList();
}

function updateFilesList() {
    if (files.length === 0) {
        filesContainer.style.display = 'none';
        mergeOptions.style.display = 'none';
        return;
    }

    filesContainer.style.display = 'block';
    mergeOptions.style.display = 'block';
    fileCount.textContent = files.length;

    filesList.innerHTML = files.map((file, index) => `
        <div class="file-item" draggable="true" data-index="${index}">
            <div class="drag-handle">⋮⋮</div>
            <div class="file-icon">${file.type === 'application/pdf' ? '📄' : '🖼️'}</div>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-details">${formatFileSize(file.size)} • ${file.type.includes('pdf') ? 'PDF' : 'Image'}</div>
            </div>
            <div class="file-actions">
                <button class="btn-icon" onclick="removeFile(${index})">🗑️</button>
            </div>
        </div>
    `).join('');

    attachDragListeners();
}

function attachDragListeners() {
    const items = filesList.querySelectorAll('.file-item');
    
    items.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
    });
}

function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const afterElement = getDragAfterElement(filesList, e.clientY);
    if (afterElement == null) {
        filesList.appendChild(draggedItem);
    } else {
        filesList.insertBefore(draggedItem, afterElement);
    }
}

function handleDrop(e) {
    e.preventDefault();
}

function handleDragEnd() {
    this.classList.remove('dragging');
    
    // Update files array based on new order
    const items = filesList.querySelectorAll('.file-item');
    const newOrder = Array.from(items).map(item => 
        parseInt(item.getAttribute('data-index'))
    );
    
    files = newOrder.map(index => files[index]);
    updateFilesList();
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.file-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function removeFile(index) {
    files.splice(index, 1);
    updateFilesList();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

async function mergePDFs() {
    if (files.length === 0) return;

    mergeBtn.disabled = true;
    mergeBtn.textContent = 'Merging...';

    try {
        const mergedPdf = await PDFDocument.create();
        let currentPage = 0;

        for (const fileData of files) {
            const arrayBuffer = await fileData.file.arrayBuffer();
            
            if (fileData.type === 'application/pdf') {
                const pdf = await PDFDocument.load(arrayBuffer);
                const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                
                pages.forEach(page => {
                    mergedPdf.addPage(page);
                    currentPage++;
                });
            } else {
                // Convert image to PDF
                const image = await loadImage(arrayBuffer, fileData.type);
                const page = mergedPdf.addPage();
                const { width, height } = page.getSize();
                
                let imgWidth, imgHeight;
                if (image.width > image.height) {
                    imgWidth = width - 100;
                    imgHeight = (image.height / image.width) * imgWidth;
                } else {
                    imgHeight = height - 100;
                    imgWidth = (image.width / image.height) * imgHeight;
                }
                
                const x = (width - imgWidth) / 2;
                const y = (height - imgHeight) / 2;
                
                page.drawImage(image, {
                    x: x,
                    y: y,
                    width: imgWidth,
                    height: imgHeight
                });
                
                currentPage++;
            }
        }

        // Add page numbers if requested
        if (addPageNumbers.checked) {
            const font = await mergedPdf.embedFont(StandardFonts.Helvetica);
            const pages = mergedPdf.getPages();
            
            pages.forEach((page, index) => {
                const { width, height } = page.getSize();
                page.drawText(`${index + 1}`, {
                    x: width / 2 - 10,
                    y: 20,
                    size: 10,
                    font: font,
                    color: rgb(0.5, 0.5, 0.5)
                });
            });
        }

        const pdfBytes = await mergedPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'merged-document.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert('PDF merged successfully!');
        
    } catch (error) {
        console.error('Error merging PDFs:', error);
        alert('Error merging PDFs: ' + error.message);
    } finally {
        mergeBtn.disabled = false;
        mergeBtn.textContent = 'Merge PDFs';
    }
}

async function loadImage(arrayBuffer, type) {
    const pdfDoc = await PDFDocument.create();
    
    if (type.includes('png')) {
        return await pdfDoc.embedPng(arrayBuffer);
    } else if (type.includes('jpg') || type.includes('jpeg')) {
        return await pdfDoc.embedJpg(arrayBuffer);
    } else {
        throw new Error('Unsupported image format');
    }
}
