pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let selectedFile = null;

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const convertBtn = document.getElementById('convertBtn');
const output = document.getElementById('output');
const extractedText = document.getElementById('extractedText');
const downloadBtn = document.getElementById('downloadBtn');

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
    if (file.type !== 'application/pdf') {
        Utils.showNotification('Please select a PDF file', 'error');
        return;
    }
    
    selectedFile = file;
    fileName.textContent = `${file.name} (${Utils.formatFileSize(file.size)})`;
    fileInfo.style.display = 'block';
    convertBtn.style.display = 'block';
    output.style.display = 'none';
}

convertBtn.addEventListener('click', extractText);

async function extractText() {
    if (!selectedFile) return;
    
    convertBtn.disabled = true;
    convertBtn.textContent = 'Extracting...';
    
    try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += `\n--- Page ${i} ---\n${pageText}\n`;
        }
        
        extractedText.value = fullText.trim();
        output.style.display = 'block';
        Utils.showNotification('Text extracted successfully!', 'success');
    } catch (error) {
        Utils.showNotification('Failed to extract text from PDF', 'error');
        console.error(error);
    }
    
    convertBtn.disabled = false;
    convertBtn.textContent = 'Extract Text';
}

downloadBtn.addEventListener('click', () => {
    const text = extractedText.value;
    const blob = new Blob([text], { type: 'text/plain' });
    const filename = selectedFile.name.replace('.pdf', '.txt');
    Utils.downloadFile(blob, filename);
    Utils.showNotification('Text file downloaded!', 'success');
});
