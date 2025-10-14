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
    // Accept all image formats including camera photos
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    const isValidImage = file.type.startsWith('image/') || validTypes.some(type => file.type === type);

    if (!isValidImage && !file.name.match(/\.(jpg|jpeg|png|webp|heic|heif)$/i)) {
        Utils.showNotification('Please select a valid image file (JPEG, PNG, WebP)', 'error');
        return;
    }

    // Check file size (max 10MB for better performance)
    if (file.size > 10 * 1024 * 1024) {
        Utils.showNotification('Image too large. Please use an image under 10MB', 'error');
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
        const img = await loadImage(selectedFile);
        resultCanvas.width = img.width;
        resultCanvas.height = img.height;

        const ctx = resultCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, resultCanvas.width, resultCanvas.height);
        const data = imageData.data;

        const width = resultCanvas.width;
        const height = resultCanvas.height;

        // Advanced background detection - sample entire edges
        const edgeSamples = [];
        const sampleStep = 5; // Sample every 5 pixels

        // Sample all four edges
        for (let x = 0; x < width; x += sampleStep) {
            // Top edge
            const topIdx = x * 4;
            edgeSamples.push([data[topIdx], data[topIdx + 1], data[topIdx + 2]]);

            // Bottom edge
            const bottomIdx = ((height - 1) * width + x) * 4;
            edgeSamples.push([data[bottomIdx], data[bottomIdx + 1], data[bottomIdx + 2]]);
        }

        for (let y = 0; y < height; y += sampleStep) {
            // Left edge
            const leftIdx = y * width * 4;
            edgeSamples.push([data[leftIdx], data[leftIdx + 1], data[leftIdx + 2]]);

            // Right edge
            const rightIdx = (y * width + width - 1) * 4;
            edgeSamples.push([data[rightIdx], data[rightIdx + 1], data[rightIdx + 2]]);
        }

        // Find dominant background color using clustering
        const bgColor = findDominantColor(edgeSamples);

        // Use flood fill from edges to detect background
        const toRemove = new Uint8Array(width * height);
        const visited = new Uint8Array(width * height);

        // Adaptive threshold based on image variance
        const threshold = calculateAdaptiveThreshold(data, width, height);

        // Start flood fill from all edge pixels
        for (let x = 0; x < width; x += 2) {
            floodFillIterative(x, 0, bgColor, data, width, height, visited, toRemove, threshold);
            floodFillIterative(x, height - 1, bgColor, data, width, height, visited, toRemove, threshold);
        }

        for (let y = 0; y < height; y += 2) {
            floodFillIterative(0, y, bgColor, data, width, height, visited, toRemove, threshold);
            floodFillIterative(width - 1, y, bgColor, data, width, height, visited, toRemove, threshold);
        }

        // Apply transparency with edge smoothing
        for (let i = 0; i < toRemove.length; i++) {
            if (toRemove[i]) {
                const dataIdx = i * 4;
                data[dataIdx + 3] = 0; // Make transparent
            }
        }

        // Apply edge smoothing for better results
        applyEdgeSmoothing(data, width, height, toRemove);

        ctx.putImageData(imageData, 0, 0);

        resultCanvas.toBlob((blob) => {
            resultBlob = blob;
            downloadBtn.style.display = 'block';
            Utils.showNotification('Background removed successfully!', 'success');
        }, 'image/png');

    } catch (error) {
        Utils.showNotification('Failed to remove background. Try a different image.', 'error');
        console.error(error);
    }

    removeBtn.disabled = false;
    removeBtn.textContent = 'Remove Background';
});

// Find dominant color from samples using simple clustering
function findDominantColor(samples) {
    const colorMap = new Map();
    const bucketSize = 20; // Group similar colors

    samples.forEach(([r, g, b]) => {
        const key = `${Math.floor(r / bucketSize)},${Math.floor(g / bucketSize)},${Math.floor(b / bucketSize)}`;
        const count = colorMap.get(key) || { count: 0, r: 0, g: 0, b: 0 };
        count.count++;
        count.r += r;
        count.g += g;
        count.b += b;
        colorMap.set(key, count);
    });

    let maxCount = 0;
    let dominantColor = [255, 255, 255];

    colorMap.forEach((value) => {
        if (value.count > maxCount) {
            maxCount = value.count;
            dominantColor = [
                Math.round(value.r / value.count),
                Math.round(value.g / value.count),
                Math.round(value.b / value.count)
            ];
        }
    });

    return dominantColor;
}

// Calculate adaptive threshold based on image characteristics
function calculateAdaptiveThreshold(data, width, height) {
    // Sample random pixels to determine color variance
    const samples = 1000;
    let totalVariance = 0;

    for (let i = 0; i < samples; i++) {
        const idx = Math.floor(Math.random() * (width * height)) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Calculate variance from grayscale
        const gray = (r + g + b) / 3;
        totalVariance += Math.abs(r - gray) + Math.abs(g - gray) + Math.abs(b - gray);
    }

    const avgVariance = totalVariance / samples;

    // Higher variance = more complex image = higher threshold needed
    return Math.max(30, Math.min(80, 40 + avgVariance / 3));
}

// Iterative flood fill (stack-based to avoid recursion limits)
function floodFillIterative(startX, startY, targetColor, imageData, width, height, visited, toRemove, threshold) {
    const stack = [[startX, startY]];

    while (stack.length > 0) {
        const [x, y] = stack.pop();

        if (x < 0 || x >= width || y < 0 || y >= height) continue;

        const pixelIdx = y * width + x;
        if (visited[pixelIdx]) continue;

        visited[pixelIdx] = 1;

        const dataIdx = pixelIdx * 4;
        const r = imageData[dataIdx];
        const g = imageData[dataIdx + 1];
        const b = imageData[dataIdx + 2];

        // Calculate color difference using Euclidean distance
        const dr = r - targetColor[0];
        const dg = g - targetColor[1];
        const db = b - targetColor[2];
        const colorDiff = Math.sqrt(dr * dr + dg * dg + db * db);

        if (colorDiff <= threshold) {
            toRemove[pixelIdx] = 1;

            // Add neighbors to stack
            stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }
    }
}

// Apply edge smoothing for natural-looking edges
function applyEdgeSmoothing(imageData, width, height, toRemove) {
    const smoothRadius = 2;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const pixelIdx = y * width + x;

            if (!toRemove[pixelIdx]) {
                // Check if this pixel is near removed pixels
                let nearRemovedCount = 0;
                let totalChecked = 0;

                for (let dy = -smoothRadius; dy <= smoothRadius; dy++) {
                    for (let dx = -smoothRadius; dx <= smoothRadius; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;

                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            totalChecked++;
                            if (toRemove[ny * width + nx]) {
                                nearRemovedCount++;
                            }
                        }
                    }
                }

                // If near removed pixels, apply partial transparency
                if (nearRemovedCount > 0) {
                    const ratio = nearRemovedCount / totalChecked;
                    if (ratio > 0.3) {
                        const dataIdx = pixelIdx * 4;
                        const currentAlpha = imageData[dataIdx + 3];
                        imageData[dataIdx + 3] = Math.round(currentAlpha * (1 - ratio * 0.7));
                    }
                }
            }
        }
    }
}

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
