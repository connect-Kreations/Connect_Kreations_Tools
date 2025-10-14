const qrInput = document.getElementById('qrInput');
const generateBtn = document.getElementById('generateBtn');
const qrOutput = document.getElementById('qrOutput');
const qrCodeDiv = document.getElementById('qrcode');
const downloadBtn = document.getElementById('downloadBtn');
const qrSize = document.getElementById('qrSize');
const qrColor = document.getElementById('qrColor');

let currentQR = null;

generateBtn.addEventListener('click', generateQR);

function generateQR() {
    const text = qrInput.value.trim();
    
    if (!text) {
        Utils.showNotification('Please enter some text or URL', 'error');
        return;
    }
    
    // Clear previous QR code
    qrCodeDiv.innerHTML = '';
    
    // Generate new QR code
    const size = parseInt(qrSize.value);
    const color = qrColor.value;
    
    currentQR = new QRCode(qrCodeDiv, {
        text: text,
        width: size,
        height: size,
        colorDark: color,
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
    
    qrOutput.style.display = 'block';
    Utils.showNotification('QR Code generated!', 'success');
}

downloadBtn.addEventListener('click', () => {
    const canvas = qrCodeDiv.querySelector('canvas');
    if (canvas) {
        canvas.toBlob((blob) => {
            Utils.downloadFile(blob, 'qrcode.png');
            Utils.showNotification('QR Code downloaded!', 'success');
        });
    }
});
