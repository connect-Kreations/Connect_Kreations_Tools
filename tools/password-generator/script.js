const passwordOutput = document.getElementById('passwordOutput');
const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyBtn');
const lengthSlider = document.getElementById('length');
const lengthValue = document.getElementById('lengthValue');
const uppercase = document.getElementById('uppercase');
const lowercase = document.getElementById('lowercase');
const numbers = document.getElementById('numbers');
const symbols = document.getElementById('symbols');
const strengthMeter = document.getElementById('strengthMeter');
const strengthBar = document.getElementById('strengthBar');
const strengthText = document.getElementById('strengthText');

const charSets = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

lengthSlider.addEventListener('input', (e) => {
    lengthValue.textContent = e.target.value;
});

generateBtn.addEventListener('click', generatePassword);
copyBtn.addEventListener('click', copyPassword);

function generatePassword() {
    let charset = '';
    
    if (uppercase.checked) charset += charSets.uppercase;
    if (lowercase.checked) charset += charSets.lowercase;
    if (numbers.checked) charset += charSets.numbers;
    if (symbols.checked) charset += charSets.symbols;
    
    if (charset === '') {
        Utils.showNotification('Please select at least one character type', 'error');
        return;
    }
    
    const length = parseInt(lengthSlider.value);
    let password = '';
    
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    passwordOutput.value = password;
    checkStrength(password);
    strengthMeter.style.display = 'block';
    Utils.showNotification('Password generated!', 'success');
}

function copyPassword() {
    if (!passwordOutput.value) {
        Utils.showNotification('Generate a password first', 'error');
        return;
    }
    
    passwordOutput.select();
    document.execCommand('copy');
    Utils.showNotification('Password copied to clipboard!', 'success');
}

function checkStrength(password) {
    let strength = 0;
    
    if (password.length >= 12) strength += 25;
    if (password.length >= 16) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 20;
    if (/\d/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15;
    
    strengthBar.style.width = strength + '%';
    
    if (strength < 40) {
        strengthBar.style.background = '#ef4444';
        strengthText.textContent = 'Weak';
        strengthText.style.color = '#ef4444';
    } else if (strength < 70) {
        strengthBar.style.background = '#f59e0b';
        strengthText.textContent = 'Medium';
        strengthText.style.color = '#f59e0b';
    } else {
        strengthBar.style.background = '#10b981';
        strengthText.textContent = 'Strong';
        strengthText.style.color = '#10b981';
    }
}

// Generate initial password
generatePassword();
