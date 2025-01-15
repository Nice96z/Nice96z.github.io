import { generateColormindSuggestions } from './api.js';

// --- Constants ---
const THROTTLE_DELAY = 50;
const DEFAULT_MAX_RECENT_COLORS = 5;
const INDICATOR_RADIUS = 8;

// --- DOM Element Selectors ---
const el = {
    colorWheel: document.getElementById('color-wheel'),
    colorInput1: document.getElementById('color1'),
    colorInput2: document.getElementById('color2'),
    previewBox: document.getElementById('preview'),
    recentColorsContainer: document.getElementById('recent-colors-container'),
    gradientTypeSelect: document.getElementById('gradient-type'),
    gradientDirectionSelect: document.getElementById('gradient-direction-select'), // Corrected ID
    brightnessInput: document.getElementById('brightness'),
    saturationInput: document.getElementById('saturation'),
    hueInput: document.getElementById('hue'),
    opacityInput: document.getElementById('opacity'),
    toggleThemeButton: document.getElementById('toggle-theme'),
    exportJsonButton: document.getElementById('export-json'),
    exportScssButton: document.getElementById('export-scss'),
    copyColorsButton: document.getElementById('copy-colors'),
    generateAiSuggestionsButton: document.getElementById('generate-ai-suggestions'),
    aiSuggestionsPanel: document.getElementById('ai-suggestions-panel'),
    aiSuggestionsList: document.getElementById('ai-suggestions-list'),
    selection1: document.getElementById('selection-1'),
    selection2: document.getElementById('selection-2'),
    maxRecentColorsInput: document.getElementById('maxRecentColors'),
    loadingIndicator: document.getElementById('loading'),
    hslValueDisplay: document.getElementById('hsl-value'),
    hexValueDisplay: document.getElementById('hex-value'),
    rgbValueDisplay: document.getElementById('rgb-value'),
    customPreviewBox: document.getElementById('custom-preview-box'),
    aiSuggestionTemplate: document.getElementById('ai-suggestion-item'), // Assuming you added this template
};

// --- State Variables ---
let isDragging = false;
let recentColors = [];
let maxRecentColors = DEFAULT_MAX_RECENT_COLORS;
let currentHue = 0;
let currentSaturation = 0.5;
let currentBrightness = 0.5;
let colorWheelCache = null;
let activeSelection = el.selection1;

// --- Utility Functions ---
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
const rgbToHex = ({ r, g, b }) => `#${Math.round(clamp(r, 0, 255)).toString(16).padStart(2, '0')}${Math.round(clamp(g, 0, 255)).toString(16).padStart(2, '0')}${Math.round(clamp(b, 0, 255)).toString(16).padStart(2, '0')}`;
const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
};
const hslToRgb = ({ h, s, l }) => {
    h /= 360;
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };
    const r = hue2rgb(p, q, h + 1 / 3);
    const g = hue2rgb(p, q, h);
    const b = hue2rgb(p, q, h - 1 / 3);
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};
const rgbToHsl = ({ r, g, b }) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
            case g: h = ((b - r) / d + 2); break;
            case b: h = ((r - g) / d + 4); break;
        }
        h *= 60;
    }
    return { h: Math.round(h), s, l };
};
const isValidColor = (color) => /^#([0-9A-Fa-f]{3}){1,2}$/.test(color);
const throttle = (func, delay) => { let timeoutId; return (...args) => { if (!timeoutId) { timeoutId = setTimeout(() => { func.apply(this, args); timeoutId = null; }, delay); } }; };
const debounce = (func, delay) => { let timeoutId; return (...args) => { clearTimeout(timeoutId); timeoutId = setTimeout(() => { func.apply(this, args); }, delay); }; };
const hexToRgba = (hex, opacity) => {
    const rgb = hexToRgb(hex);
    return rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp(opacity, 0, 1)})` : null;
};

// --- Color Wheel Functionality ---
const ctx = el.colorWheel.getContext('2d');
let wheelSize = el.colorWheel.offsetWidth;

function drawColorWheel() {
    wheelSize = el.colorWheel.offsetWidth;
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
                    const rgb = hslToRgb({ h: hue, s: saturation, l: 0.5 });
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
    const { offsetWidth: wheelSize } = el.colorWheel;
    const centerX = wheelSize / 2;
    const centerY = wheelSize / 2;
    const radius = wheelSize / 2;

    const rad = currentHue * Math.PI / 180;
    const indicatorRadius = radius * currentSaturation;
    const indicatorX = centerX + indicatorRadius * Math.cos(rad);
    const indicatorY = centerY + indicatorRadius * Math.sin(rad);

    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, INDICATOR_RADIUS, 0, 2 * Math.PI);

    // Set the stroke style to provide contrast
    ctx.strokeStyle = document.body.classList.contains('dark-mode') ? 'white' : 'black';
    ctx.lineWidth = 2; // Add a line width for better visibility

    // Remove the fill to make it hollow
    // ctx.fillStyle = document.body.classList.contains('dark-mode') ? 'white' : 'black';
    // ctx.fill();

    ctx.stroke();
}

const rotateColorWheel = throttle((event) => {
    if (!isDragging) return;
    const bounds = el.colorWheel.getBoundingClientRect();
    const clientX = event.clientX !== undefined ? event.clientX : event.touches[0].clientX;
    const clientY = event.clientY !== undefined ? event.clientY : event.touches[0].clientY;
    const x = clientX - bounds.left - (wheelSize / 2);
    const y = clientY - bounds.top - (wheelSize / 2);

    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    currentHue = (angle + 360) % 360;
    currentSaturation = clamp(Math.sqrt(x * x + y * y) / (wheelSize / 2), 0, 1);

    drawColorWheel();
    updateColorFromWheel();
}, THROTTLE_DELAY);

// --- Preview Functionality ---
function updatePreview(color) {
    el.previewBox.style.backgroundColor = hexToRgba(color, el.opacityInput.value);
    el.previewBox.setAttribute('aria-label', `Color Preview: ${color}`);
    updateGradientPreview();
    updateCustomPreview();
}

function updateCustomPreview() {
    el.customPreviewBox.style.backgroundColor = hexToRgba(el.colorInput1.value, el.opacityInput.value);
}

function updateGradientPreview() {
    const color1 = el.colorInput1.value;
    const color2 = el.colorInput2.value;
    const gradientType = el.gradientTypeSelect.value;
    const gradientDirection = el.gradientDirectionSelect.value;
    const opacity = parseFloat(el.opacityInput.value);

    const rgba1 = hexToRgba(color1, opacity);
    const rgba2 = hexToRgba(color2, opacity);

    let gradientString;
    if (gradientType === 'linear') {
        gradientString = `linear-gradient(${gradientDirection}, ${rgba1}, ${rgba2})`;
    } else if (gradientType === 'radial') {
        gradientString = `radial-gradient(circle, ${rgba1}, ${rgba2})`;
    } else if (gradientType === 'conic') {
        gradientString = `conic-gradient(${rgba1}, ${rgba2})`;
    }
    el.previewBox.style.background = gradientString;
}

function updateColorDisplay({ r, g, b }) {
    const hex = rgbToHex({ r, g, b });
    const hsl = rgbToHsl({ r, g, b });
    el.hslValueDisplay.textContent = `(${hsl.h.toFixed(0)}, ${(hsl.s * 100).toFixed(0)}%, ${(hsl.l * 100).toFixed(0)}%)`;
    el.hexValueDisplay.textContent = hex;
    el.rgbValueDisplay.textContent = `(${r}, ${g}, ${b})`;
}

// --- Recent Colors Functionality ---
function updateRecentColorsDisplay() {
    el.recentColorsContainer.innerHTML = '';
    recentColors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.classList.add('color-swatch');
        swatch.style.backgroundColor = color;
        swatch.setAttribute('tabindex', '0');
        swatch.setAttribute('aria-label', `Recent color: ${color}`);
        swatch.addEventListener('click', () => setActiveColor(color));
        el.recentColorsContainer.appendChild(swatch);
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
            const hsl = rgbToHsl(rgbColor);
            currentHue = hsl.h;
            currentSaturation = hsl.s;
            drawColorWheel();
        }
        if (event.target === el.colorInput2) {
            updateGradientPreview();
        }
    }
}

function setActiveColor(color) {
    if (activeSelection === el.selection1) {
        el.colorInput1.value = color;
    } else {
        el.colorInput2.value = color;
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
    if (!currentRgb) return; // Exit if color is invalid

    let hsl = rgbToHsl(currentRgb);

    hsl.l = clamp(parseFloat(el.brightnessInput.value) / 100 + 0.5, 0, 1);
    hsl.s = clamp(parseFloat(el.saturationInput.value) / 100 + 0.5, 0, 1);
    hsl.h = parseInt(el.hueInput.value, 10);

    const rgb = hslToRgb(hsl);
    const hexColor = rgbToHex(rgb);
    setActiveColor(hexColor);
    updatePreview(hexColor);
    updateColorDisplay(rgb);
    drawColorWheel();
}

// --- AI Suggestions ---
async function generateAiColorSuggestions() {
    el.loadingIndicator.classList.remove('hidden');
    el.aiSuggestionsPanel.setAttribute('aria-hidden', 'false');
    try {
        const colormindPalette = await generateColormindSuggestions();
        el.aiSuggestionsList.innerHTML = '';

        if (colormindPalette && colormindPalette.length > 0) {
            colormindPalette.forEach(color => {
                const suggestionElement = el.aiSuggestionTemplate.content.cloneNode(true).querySelector('.ai-suggestion');
                suggestionElement.style.backgroundColor = color;
                suggestionElement.setAttribute('aria-label', `AI suggested color: ${color}`);
                suggestionElement.addEventListener('click', () => setActiveColor(color));
                el.aiSuggestionsList.appendChild(suggestionElement);
            });
        } else {
            el.aiSuggestionsList.innerHTML = '<p>No Colormind suggestions found.</p>';
        }
    } catch (error) {
        console.error("Error fetching AI suggestions:", error);
        el.aiSuggestionsList.innerHTML = '<p>Failed to fetch AI color suggestions. Please check your network connection.</p>';
    } finally {
        el.loadingIndicator.classList.add('hidden');
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
    const bounds = el.colorWheel.getBoundingClientRect();
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

const handleColorWheelKeydown = (event) => {
    switch (event.key) {
        case 'ArrowLeft': currentHue = (currentHue - 5 + 360) % 360; break;
        case 'ArrowRight': currentHue = (currentHue + 5) % 360; break;
        case 'ArrowUp': currentSaturation = Math.min(1, currentSaturation + 0.05); break;
        case 'ArrowDown': currentSaturation = Math.max(0, currentSaturation - 0.05); break;
        default: return;
    }
    drawColorWheel();
    updateColorFromWheel();
};

// --- Event Listeners ---
el.colorWheel.addEventListener('mousedown', (e) => { isDragging = true; rotateColorWheel(e); el.colorWheel.focus(); });
el.colorWheel.addEventListener('mousemove', rotateColorWheel);
window.addEventListener('mouseup', () => { isDragging = false; });
el.colorWheel.addEventListener('touchstart', (e) => { isDragging = true; rotateColorWheel(e); e.preventDefault(); el.colorWheel.focus(); });
el.colorWheel.addEventListener('touchmove', (e) => { rotateColorWheel(e); e.preventDefault(); });
el.colorWheel.addEventListener('touchend', () => { isDragging = false; });
el.colorWheel.addEventListener('click', handleColorWheelClick);
el.colorWheel.addEventListener('keydown', handleColorWheelKeydown);
el.colorWheel.addEventListener('blur', () => el.colorWheel.style.outline = '');
el.colorWheel.addEventListener('focus', () => el.colorWheel.style.outline = '2px solid var(--color-accent)'); // Use CSS variable

el.colorInput1.addEventListener('input', handleColorInputChange);
el.colorInput2.addEventListener('input', handleColorInputChange);

el.gradientTypeSelect.addEventListener('change', updateGradientPreview);
el.gradientDirectionSelect.addEventListener('change', updateGradientPreview);

el.opacityInput.addEventListener('input', (e) => {
    updatePreview(getActiveColor());
    el.previewBox.setAttribute('aria-valuenow', e.target.value);
});

el.brightnessInput.addEventListener('input', () => {
    el.brightnessInput.setAttribute('aria-valuenow', el.brightnessInput.value);
    applyColorAdjustments();
});

el.saturationInput.addEventListener('input', () => {
    el.saturationInput.setAttribute('aria-valuenow', el.saturationInput.value);
    applyColorAdjustments();
});

el.hueInput.addEventListener('input', () => {
    el.hueInput.setAttribute('aria-valuenow', el.hueInput.value);
    applyColorAdjustments();
});

el.maxRecentColorsInput.addEventListener('input', debounce(() => {
    maxRecentColors = parseInt(el.maxRecentColorsInput.value) || DEFAULT_MAX_RECENT_COLORS;
    recentColors = recentColors.slice(0, maxRecentColors);
    updateRecentColorsDisplay();
}, 300));

el.generateAiSuggestionsButton.addEventListener('click', generateAiColorSuggestions);

el.exportJsonButton.addEventListener('click', () => {
    const colors = {
        color1: el.colorInput1.value,
        color2: el.colorInput2.value,
        opacity: el.opacityInput.value,
        brightness: el.brightnessInput.value,
        saturation: el.saturationInput.value,
        hue: el.hueInput.value,
        gradientType: el.gradientTypeSelect.value,
        gradientDirection: el.gradientDirectionSelect.value,
        recentColors
    };
    downloadFile(JSON.stringify(colors, null, 2), 'colors.json', 'application/json');
});

el.exportScssButton.addEventListener('click', () => {
    const scssString = `$color1: ${el.colorInput1.value};\n$color2: ${el.colorInput2.value};\n$opacity: ${el.opacityInput.value};\n$brightness: ${el.brightnessInput.value};\n$saturation: ${el.saturationInput.value};\n$hue: ${el.hueInput.value};\n$gradientType: ${el.gradientTypeSelect.value};\n$gradientDirection: ${el.gradientDirectionSelect.value};`;
    downloadFile(scssString, 'colors.scss', 'text/scss');
});

el.copyColorsButton.addEventListener('click', () => {
    const colors = {
        color1: el.colorInput1.value,
        color2: el.colorInput2.value,
        opacity: el.opacityInput.value,
        brightness: el.brightnessInput.value,
        saturation: el.saturationInput.value,
        hue: el.hueInput.value,
        gradientType: el.gradientTypeSelect.value,
        gradientDirection: el.gradientDirectionSelect.value
    };
    navigator.clipboard.writeText(JSON.stringify(colors, null, 2))
        .then(() => alert('Colors copied to clipboard!'))
        .catch(err => console.error('Failed to copy: ', err));
});

el.toggleThemeButton.addEventListener('click', () => document.body.classList.toggle('dark-mode'));

el.selection1.addEventListener('click', () => setActiveSelection(el.selection1));
el.selection2.addEventListener('click', () => setActiveSelection(el.selection2));

// --- Helper Functions ---
function setActiveSelection(selection) {
    if (activeSelection) activeSelection.classList.remove('active');
    activeSelection = selection;
    activeSelection.classList.add('active');
}

function getActiveColor() {
    return activeSelection === el.selection1 ? el.colorInput1.value : el.colorInput2.value;
}


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    wheelSize = el.colorWheel.offsetWidth;
    el.colorWheel.width = wheelSize;
    el.colorWheel.height = wheelSize;
    drawColorWheel();
    updatePreview(el.colorInput1.value);
    updateRecentColorsDisplay();
});
