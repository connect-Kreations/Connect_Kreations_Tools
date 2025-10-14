const jsonInput = document.getElementById('jsonInput');
const formatBtn = document.getElementById('formatBtn');
const minifyBtn = document.getElementById('minifyBtn');
const validateBtn = document.getElementById('validateBtn');
const clearBtn = document.getElementById('clearBtn');
const statusMessage = document.getElementById('statusMessage');

formatBtn.addEventListener('click', formatJSON);
minifyBtn.addEventListener('click', minifyJSON);
validateBtn.addEventListener('click', validateJSON);
clearBtn.addEventListener('click', clearJSON);

function formatJSON() {
    try {
        const json = JSON.parse(jsonInput.value);
        jsonInput.value = JSON.stringify(json, null, 2);
        showStatus('JSON formatted successfully!', 'success');
    } catch (error) {
        showStatus('Invalid JSON: ' + error.message, 'error');
    }
}

function minifyJSON() {
    try {
        const json = JSON.parse(jsonInput.value);
        jsonInput.value = JSON.stringify(json);
        showStatus('JSON minified successfully!', 'success');
    } catch (error) {
        showStatus('Invalid JSON: ' + error.message, 'error');
    }
}

function validateJSON() {
    try {
        JSON.parse(jsonInput.value);
        showStatus('✓ Valid JSON!', 'success');
    } catch (error) {
        showStatus('✗ Invalid JSON: ' + error.message, 'error');
    }
}

function clearJSON() {
    jsonInput.value = '';
    statusMessage.style.display = 'none';
    Utils.showNotification('Cleared', 'success');
}

function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.style.display = 'block';
    statusMessage.style.background = type === 'success' 
        ? 'rgba(16, 185, 129, 0.2)' 
        : 'rgba(239, 68, 68, 0.2)';
    statusMessage.style.border = type === 'success'
        ? '1px solid rgba(16, 185, 129, 0.4)'
        : '1px solid rgba(239, 68, 68, 0.4)';
    statusMessage.style.color = type === 'success' ? '#10b981' : '#ef4444';
}
