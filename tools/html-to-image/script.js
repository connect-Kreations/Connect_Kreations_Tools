const htmlInput = document.getElementById('htmlInput');
const previewBtn = document.getElementById('previewBtn');
const downloadImageBtn = document.getElementById('downloadImageBtn');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const previewArea = document.getElementById('previewArea');
const preview = document.getElementById('preview');

previewBtn.addEventListener('click', () => {
    const html = htmlInput.value.trim();
    
    if (!html) {
        Utils.showNotification('Please enter HTML code', 'error');
        return;
    }
    
    preview.innerHTML = html;
    previewArea.style.display = 'block';
    downloadImageBtn.style.display = 'inline-block';
    downloadPdfBtn.style.display = 'inline-block';
    Utils.showNotification('Preview generated!', 'success');
});

downloadImageBtn.addEventListener('click', async () => {
    downloadImageBtn.disabled = true;
    downloadImageBtn.textContent = 'Generating...';
    
    try {
        const canvas = await html2canvas(preview, {
            backgroundColor: '#ffffff',
            scale: 2
        });
        
        canvas.toBlob((blob) => {
            Utils.downloadFile(blob, 'html-output.png');
            Utils.showNotification('Image downloaded!', 'success');
        });
    } catch (error) {
        Utils.showNotification('Failed to generate image', 'error');
    }
    
    downloadImageBtn.disabled = false;
    downloadImageBtn.textContent = 'Download as Image';
});

downloadPdfBtn.addEventListener('click', async () => {
    downloadPdfBtn.disabled = true;
    downloadPdfBtn.textContent = 'Generating...';
    
    try {
        const canvas = await html2canvas(preview, {
            backgroundColor: '#ffffff',
            scale: 2
        });
        
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });
        
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save('html-output.pdf');
        Utils.showNotification('PDF downloaded!', 'success');
    } catch (error) {
        Utils.showNotification('Failed to generate PDF', 'error');
    }
    
    downloadPdfBtn.disabled = false;
    downloadPdfBtn.textContent = 'Download as PDF';
});
