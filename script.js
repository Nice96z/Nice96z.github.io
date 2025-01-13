import { generateColormindSuggestions } from './api.js'; // Assuming you'll implement this
// import { generateAdobeColorSuggestions, generateColorThiefSuggestions } from './api.js'; // If you add these back

// --- Constants ---
const THROTTLE_DELAY = 50;
const DEFAULT_MAX_RECENT_COLORS = 5;
const INDICATOR_RADIUS = 8; // Radius for the color wheel selection indicator

// --- DOM Elements ---
const colorWheel = document.getElementById('color-wheel');
const colorInput1 = document.getElementById('color1');
const colorInput2 = document.getElementById('color2');
const previewBox = document.getElementById('preview');
const recentColorsContainer = document.getElementById('recent-colors-container');
const gradientTypeSelect = document.getElementById('gradient-type');
const gradientDirectionInput = document.getElementById('gradient-direction');
const brightnessInput = document.getElementById('brightness');
const saturationInput = document.getElementById('saturation');
const hueInput = document.getElementById('hue');
const opacityInput = document.getElementById('opacity');
const toggleThemeButton = document.getElementById('toggle-theme');
const exportJsonButton = document.getElementById('export-json');
const exportScssButton = document.getElementById('export-scss');
const copyColorsButton = document.getElementById('copy-colors');
const generateAiSuggestionsButton = document.getElementById('generate-ai-suggestions');
const aiSuggestionsPanel = document.getElementById('ai-suggestions-panel');
const aiSuggestionsList = document.getElementById('ai-suggestions-list');
const selection1 = document.getElementById('selection-1');
const selection2 = document.getElementById('selection-2');
const maxRecentColorsInput = document.getElementById('maxRecentColors');
const loadingIndicator = document.getElementById('loading');
const hslValueDisplay = document.getElementById('hsl-value');
const hexValueDisplay = document.getElementById('hex-value');
const rgbValueDisplay = document.getElementById('rgb-value');
const customPreviewBox = document.getElementById('custom-preview-box');

// --- State Variables ---
let isDragging = false;
let recentColors = [];
let maxRecentColors = DEFAULT_MAX_RECENT_COLORS;
let currentHue = 0;
let currentSaturation = 0.5; // Initialize saturation in 0-1 range
let currentBrightness = 0.5; // Initialize brightness in 0-1 range
let colorWheelCache = null;
let activeSelection = selection1;

// --- Utility Functions ---
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
const rgbToHex = (rgb) => `#${Math.round(clamp(rgb.r, 0, 255)).toString(16).padStart(2, '0')}${Math.round(clamp(rgb.g, 0, 255)).toString(16).padStart(2, '0')}${Math.round(clamp(rgb.b, 0, 255)).toString(16).padStart(2, '0')}`;
const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};
const hslToRgb = (hsl) => {
    const h = hsl.h / 360;
    const s = clamp(hsl.s, 0, 1);
    const l = clamp(hsl.l, 0, 1);
    const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = hue2rgb(p, q, h + 1 / 3);
    const g = hue2rgb(p, q, h);
    const b = hue2rgb(p, q, h - 1 / 3);
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};

const rgbToHsl = (rgb) => {
    const r = clamp(rgb.r / 255, 0, 1);
    const g = clamp(rgb.g / 255, 0, 1);
    const b = clamp(rgb.b / 255, 0, 1);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
            case g: h = ((b - r) / d + 2) * 60; break;
            case b: h = ((r - g) / d + 4) * 60; break;
        }
    }
    return { h: Math.round(h), s, l };
};

const isValidColor = (color) => /^#([0-9A-Fa-f]{3}){1,2}$/.test(color);
const throttle = (func, delay) => {
    let timeoutId;
    return (...args) => {
        if (!timeoutId) {
            timeoutId = setTimeout(() => {
                func.apply(this, args);
                timeoutId = null;
            }, delay);
        }
    };
};

const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => { func.apply(this, args); }, delay);
    };
};

const hexToRgba = (hex, opacity) => {
    const rgb = hexToRgb(hex);
    return rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp(opacity, 0, 1)})` : null;
};

// --- Color Wheel Functionality ---
const ctx = colorWheel.getContext('2d');
let wheelSize = colorWheel.offsetWidth; // Get size from CSS

function drawColorWheel() {
    wheelSize = colorWheel.offsetWidth; // Update size in case of resizing
    const centerX = wheelSize / 2;
    const centerY = wheelSize / 2;
    const radius = wheelSize / 2;

    ctx.clearRect(0, 0, wheelSize, wheelSize);

    if (colorWheelCache) {
        ctx.putImageData(colorWheelCache, 0, 0);
    } else {
        for (let y = 0; y < wheelSize; y++) {
            for (let x = 0; x < wheelSize; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance <= radius) {
                    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                    const hue = (angle + 360) % 360;
                    const saturation = distance / radius;
                    const rgb = hslToRgb({ h: hue, s: saturation, l: 0.5 }); // Fixed brightness for wheel
                    ctx.fillStyle = `rgb(${rgb.r},${rgb.g},${rgb.b})`;
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        colorWheelCache = ctx.getImageData(0, 0, wheelSize, wheelSize);
    }
    drawSelectionIndicator();
}

function drawSelectionIndicator() {
    const wheelSize = colorWheel.offsetWidth;
    const centerX = wheelSize / 2;
    const centerY = wheelSize / 2;
    const radius = wheelSize / 2;

    const rad = currentHue * Math.PI / 180;
    const indicatorRadius = radius * currentSaturation;
    const indicatorX = centerX + indicatorRadius * Math.cos(rad);
    const indicatorY = centerY + indicatorRadius * Math.sin(rad);

    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, INDICATOR_RADIUS, 0, 2 * Math.PI);

    if (document.body.classList.contains('dark-mode')) {
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
    } else {
        ctx.fillStyle = 'black';
        ctx.strokeStyle = 'white';
    }
    ctx.fill();
    ctx.stroke();
}

const rotateColorWheel = throttle((event) => {
    if (!isDragging) return;
    const bounds = colorWheel.getBoundingClientRect();
    const clientX = event.clientX !== undefined ? event.clientX : event.touches[0].clientX;
    const clientY = event.clientY !== undefined ? event.clientY : event.touches[0].clientY;
    const x = clientX - bounds.left - (wheelSize / 2);
    const y = clientY - bounds.top - (wheelSize / 2);

    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    currentHue = (angle + 360) % 360;
    const distance = Math.sqrt(x * x + y * y);
    currentSaturation = clamp(distance / (wheelSize / 2), 0, 1);

    drawColorWheel();
    updateColorFromWheel();
}, THROTTLE_DELAY);

// --- Preview Functionality ---
function updatePreview(color) {
    previewBox.style.backgroundColor = hexToRgba(color, opacityInput.value);
    previewBox.setAttribute('aria-label', `Color Preview: ${color}`);
    updateGradientPreview();
    updateCustomPreview();
}

function updateCustomPreview() {
    customPreviewBox.style.backgroundColor = hexToRgba(colorInput1.value, opacityInput.value);
    // Add more custom styles based on other controls if needed
}

function updateGradientPreview() {
    const color1 = colorInput1.value;
    const color2 = colorInput2.value;
    const gradientType = gradientTypeSelect.value;
    const gradientDirection = gradientDirectionInput.value;
    const opacity1 = parseFloat(opacityInput.value);
    const opacity2 = parseFloat(opacityInput.value); // Assuming same opacity for both stops for now

    const rgba1 = hexToRgba(color1, opacity1);
    const rgba2 = hexToRgba(color2, opacity2);

    let gradientString;
    if (gradientType === 'linear') {
        gradientString = `linear-gradient(${gradientDirection}, ${rgba1}, ${rgba2})`;
    } else if (gradientType === 'radial') {
        gradientString = `radial-gradient(circle, ${rgba1}, ${rgba2})`;
    } else if (gradientType === 'conic') {
        gradientString = `conic-gradient(${rgba1}, ${rgba2})`;
    }
    previewBox.style.background = gradientString;
}

function updateColorDisplay(rgb) {
    const hex = rgbToHex(rgb);
    const hsl = rgbToHsl(rgb);
    hslValueDisplay.textContent = `(${hsl.h.toFixed(0)}, ${(hsl.s * 100).toFixed(0)}%, ${(hsl.l * 100).toFixed(0)}%)`;
    hexValueDisplay.textContent = hex;
    rgbValueDisplay.textContent = `(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

// --- Recent Colors Functionality ---
function updateRecentColorsDisplay() {
    recentColorsContainer.innerHTML = '';
    recentColors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.classList.add('color-swatch');
        swatch.style.backgroundColor = color;
        swatch.setAttribute('tabindex', '0');
        swatch.setAttribute('aria-label', `Recent color: ${color}`);
        swatch.addEventListener('click', () => {
            setActiveColor(color);
        });
        recentColorsContainer.appendChild(swatch);
    });
}

function addToRecentColors(color) {
    if (!recentColors.includes(color)) {
        recentColors.unshift(color);
        if (recentColors.length > maxRecentColors) {
            recentColors.pop();
        }
        updateRecentColorsDisplay();
    }
}

// --- Color Input Change Handler ---
function handleColorInputChange(event) {
    const color = event.target.value;
    if (isValidColor(color)) {
        updatePreview(color);
        addToRecentColors(color);
        const rgbColor = hexToRgb(color);
        if (rgbColor) {
            updateColorDisplay(rgbColor);
        }
        if (event.target === colorInput2) {
            updateGradientPreview();
        }
        // Update color wheel to reflect the manually entered color
        const hsl = rgbToHsl(rgbColor);
        currentHue = hsl.h;
        currentSaturation = hsl.s;
        drawColorWheel();
    }
}

function setActiveColor(color) {
    if (activeSelection === selection1) {
        colorInput1.value = color;
    } else {
        colorInput2.value = color;
    }
    updatePreview(color);
}

function updateColorFromWheel() {
    const rgb = hslToRgb({ h: currentHue, s: currentSaturation, l: currentBrightness });
    const hexColor = rgbToHex(rgb);
    setActiveColor(hexColor);
    updateColorDisplay(rgb);
    updatePreview(hexColor);
}

// --- Color Adjustments Functionality ---
function applyColorAdjustments() {
    const currentHexColor = getActiveColor();
    const currentRgb = hexToRgb(currentHexColor);
    let hsl = rgbToHsl(currentRgb);

    hsl.l = clamp(parseFloat(brightnessInput.value) / 100 + 0.5, 0, 1);
    hsl.s = clamp(parseFloat(saturationInput.value) / 100 + 0.5, 0, 1);
    hsl.h = parseInt(hueInput.value, 10);

    const rgb = hslToRgb(hsl);
    const hexColor = rgbToHex(rgb);
    setActiveColor(hexColor);
    updatePreview(hexColor);
    updateColorDisplay(rgb);
    drawColorWheel(); // Keep the wheel in sync, though the indicator might not perfectly match
}

// --- AI Suggestions ---
async function generateAiColorSuggestions() {
    loadingIndicator.classList.remove('hidden');
    aiSuggestionsPanel.setAttribute('aria-hidden', 'false');
    try {
        const colormindPalette = await generateColormindSuggestions(); // Ensure this function exists and works

        let suggestionsHTML = '<h3>Colormind</h3>';
        if (colormindPalette && colormindPalette.length > 0) {
            suggestionsHTML += colormindPalette.map(color => `
                <div class="color-suggestion" style="background-color: ${color};" tabindex="0" aria-label="AI suggested color: ${color}"></div>`).join('');
        } else {
            suggestionsHTML += '<p>No Colormind suggestions found.</p>';
        }
        aiSuggestionsList.innerHTML = suggestionsHTML;
    } catch (error) {
        console.error("Error fetching AI suggestions:", error);
        aiSuggestionsList.innerHTML = '<p>Failed to fetch AI color suggestions. Please check your network connection.</p>';
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}

// --- Export and Import ---
function downloadFile(content, fileName, contentType) {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
}

// --- Event Handlers ---
const handleColorWheelClick = (event) => {
    const bounds = colorWheel.getBoundingClientRect();
    const x = event.clientX - bounds.left - (wheelSize / 2);
    const y = event.clientY - bounds.top - (wheelSize / 2);
    const distance = Math.sqrt(x * x + y * y);

    if (distance <= wheelSize / 2) {
        let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
        currentHue = (angle + 360) % 360;
        currentSaturation = clamp(distance / (wheelSize / 2), 0, 1);
        drawColorWheel();
        updateColorFromWheel();
    }
};

// --- Event Listeners ---
colorWheel.addEventListener('mousedown', (e) => { isDragging = true; rotateColorWheel(e); colorWheel.focus(); });
colorWheel.addEventListener('mousemove', rotateColorWheel);
window.addEventListener('mouseup', () => { isDragging = false; });
colorWheel.addEventListener('touchstart', (e) => { isDragging = true; rotateColorWheel(e); e.preventDefault(); colorWheel.focus(); });
colorWheel.addEventListener('touchmove', (e) => { rotateColorWheel(e); e.preventDefault(); });
colorWheel.addEventListener('touchend', () => { isDragging = false; });
colorWheel.addEventListener('click', handleColorWheelClick);

colorWheel.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
        currentHue = (currentHue - 5 + 360) % 360;
        drawColorWheel();
        updateColorFromWheel();
    } else if (event.key === 'ArrowRight') {
        currentHue = (currentHue + 5) % 360;
        drawColorWheel();
        updateColorFromWheel();
    } else if (event.key === 'ArrowUp') {
        currentSaturation = Math.min(1, currentSaturation + 0.05);
        drawColorWheel();
        updateColorFromWheel();
    } else if (event.key === 'ArrowDown') {
        currentSaturation = Math.max(0, currentSaturation - 0.05);
        drawColorWheel();
        updateColorFromWheel();
    }
});
colorWheel.addEventListener('blur', () => colorWheel.style.outline = '');
colorWheel.addEventListener('focus', () => colorWheel.style.outline = '2px solid var(--accent-color)');

colorInput1.addEventListener('input', handleColorInputChange);
colorInput2.addEventListener('input', handleColorInputChange);

gradientTypeSelect.addEventListener('change', updateGradientPreview);
gradientDirectionInput.addEventListener('input', updateGradientPreview);

opacityInput.addEventListener('input', (e) => {
    updatePreview(getActiveColor());
    previewBox.setAttribute('aria-valuenow', e.target.value);
});

brightnessInput.addEventListener('input', () => {
    brightnessInput.setAttribute('aria-valuenow', brightnessInput.value);
    applyColorAdjustments();
});

saturationInput.addEventListener('input', () => {
    saturationInput.setAttribute('aria-valuenow', saturationInput.value);
    applyColorAdjustments();
});

hueInput.addEventListener('input', () => {
    hueInput.setAttribute('aria-valuenow', hueInput.value);
    applyColorAdjustments();
});

maxRecentColorsInput.addEventListener('input', debounce(() => {
    maxRecentColors = parseInt(maxRecentColorsInput.value) || DEFAULT_MAX_RECENT_COLORS;
    // Ensure we don't exceed the new limit
    recentColors = recentColors.slice(0, maxRecentColors);
    updateRecentColorsDisplay();
}, 300));

generateAiSuggestionsButton.addEventListener('click', generateAiColorSuggestions);

exportJsonButton.addEventListener('click', () => {
    const colors = {
        color1: colorInput1.value,
        color2: colorInput2.value,
        opacity: opacityInput.value,
        brightness: brightnessInput.value,
        saturation: saturationInput.value,
        hue: hueInput.value,
        gradientType: gradientTypeSelect.value,
        gradientDirection: gradientDirectionInput.value,
        recentColors
    };
    downloadFile(JSON.stringify(colors, null, 2), 'colors.json', 'application/json');
});

exportScssButton.addEventListener('click', () => {
    const scssString = `$color1: ${colorInput1.value};\n$color2: ${colorInput2.value};\n$opacity: ${opacityInput.value};\n$brightness: ${brightnessInput.value};\n$saturation: ${saturationInput.value};\n$hue: ${hueInput.value};\n$gradientType: ${gradientTypeSelect.value};\n$gradientDirection: ${gradientDirectionInput.value};`;
    downloadFile(scssString, 'colors.scss', 'text/scss');
});

copyColorsButton.addEventListener('click', () => {
    const colors = {
        color1: colorInput1.value,
        color2: colorInput2.value,
        opacity: opacityInput.value,
        brightness: brightnessInput.value,
        saturation: saturationInput.value,
        hue: hueInput.value,
        gradientType: gradientTypeSelect.value,
        gradientDirection: gradientDirectionInput.value
    };
    navigator.clipboard.writeText(JSON.stringify(colors, null, 2))
        .then(() => alert('Colors copied to clipboard!'))
        .catch(err => console.error('Failed to copy: ', err));
});

toggleThemeButton.addEventListener('click', () => document.body.classList.toggle('dark-mode'));

selection1.addEventListener('click', () => setActiveSelection(selection1));
selection2.addEventListener('click', () => setActiveSelection(selection2));

// --- Helper Functions ---
function setActiveSelection(selection) {
    if (activeSelection) activeSelection.classList.remove('active');
    activeSelection = selection;
    activeSelection.classList.add('active');
}

function getActiveColor() {
    return activeSelection === selection1 ? colorInput1.value : colorInput2.value;
}

document.addEventListener('DOMContentLoaded', () => {
    wheelSize = colorWheel.offsetWidth; // Get initial size
    colorWheel.width = wheelSize;
    colorWheel.height = wheelSize;
    drawColorWheel();
    updatePreview(colorInput1.value);
    updateRecentColorsDisplay(); // Initial display of recent colors
});
