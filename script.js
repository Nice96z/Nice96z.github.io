// script.js
import { generateColormindSuggestions } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- Constants ---
    const WHEEL_SIZE = 200;
    const THROTTLE_DELAY = 50;
    const DEFAULT_MAX_RECENT_COLORS = 5;

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

    // --- State Variables ---
    let isDragging = false;
    let recentColors = [];
    let maxRecentColors = DEFAULT_MAX_RECENT_COLORS;
    let currentHue = 0;
    let currentSaturation = 1;
    let currentBrightness = 0.5;
    let colorWheelCache = null;
    let activeSelection = selection1;
    let rotateTimeoutId;

    // --- Utility Functions ---
    const rgbToHex = (rgb) => `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`;
    const hslToRgb = (hsl) => {
        const h = hsl.h / 360;
        const s = hsl.s;
        const l = hsl.l;
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

        function updateColorDisplay(rgb) {
        const hex = rgbToHex(rgb);
        const hsl = rgbToHsl(rgb); // We need to create this function
        hslValueDisplay.textContent = `(${hsl.h.toFixed(0)}, ${(hsl.s * 100).toFixed(0)}%, ${(hsl.l * 100).toFixed(0)}%)`;
        hexValueDisplay.textContent = hex;
        rgbValueDisplay.textContent = `(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    }
    // --- Color Wheel Functionality ---
    const ctx = colorWheel.getContext('2d');
    colorWheel.width = WHEEL_SIZE;
    colorWheel.height = WHEEL_SIZE;
    const centerX = WHEEL_SIZE / 2;
    const centerY = WHEEL_SIZE / 2;
    const radius = WHEEL_SIZE / 2;

    function drawColorWheel() {
        if (colorWheelCache) {
            ctx.putImageData(colorWheelCache, 0, 0);
            return;
        }
        for (let angle = 0; angle < 360; angle++) {
            const rad = angle * Math.PI / 180;
            const x = centerX + radius * Math.cos(rad);
            const y = centerY + radius * Math.sin(rad);
            const hue = angle;
            const color = hslToRgb({ h: hue, s: 1, l: 0.5 });
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x, y);
            ctx.arc(centerX, centerY, radius, rad, (angle + 1) * Math.PI / 180, false);
            ctx.closePath();
            ctx.fillStyle = rgbToHex(color);
            ctx.fill();
        }
        colorWheelCache = ctx.getImageData(0, 0, WHEEL_SIZE, WHEEL_SIZE);
    }
    drawColorWheel();

    const rotateColorWheel = throttle((event) => {
        if (!isDragging) return;
        const bounds = colorWheel.getBoundingClientRect();
        const x = (event.clientX || event.touches[0].clientX) - bounds.left - centerX;
        const y = (event.clientY || event.touches[0].clientY) - bounds.top - centerY;
        const angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
        currentHue = (angle + 360) % 360;
        updateColorFromWheel();
    }, THROTTLE_DELAY);

    function updateColorFromWheel() {
        const color = hslToRgb({ h: currentHue, s: currentSaturation, l: currentBrightness });
        const hexColor = rgbToHex(color);
        if (activeSelection === selection1) {
            colorInput1.value = hexColor;
        } else {
            colorInput2.value = hexColor;
        }
        updatePreview(hexColor);
    }

    // --- Preview Functionality ---
    function updatePreview(color) {
        previewBox.style.backgroundColor = color;
        previewBox.style.opacity = opacityInput.value;
        previewBox.setAttribute('aria-label', `Color Preview: ${color}`); // Update ARIA label
        updateGradientPreview();
    }

    function updateGradientPreview() {
        const color1 = colorInput1.value;
        const color2 = colorInput2.value;
        const gradientType = gradientTypeSelect.value;
        const gradientDirection = gradientDirectionInput.value;
        const opacity1 = parseFloat(opacityInput.value);
        const opacity2 = parseFloat(opacityInput.value); // Assuming same opacity for both stops for now

        let gradientString;
        if (gradientType === 'linear') {
            gradientString = `linear-gradient(${gradientDirection}, ${hexToRgba(color1, opacity1)}, ${hexToRgba(color2, opacity2)})`;
        } else if (gradientType === 'radial') {
            gradientString = `radial-gradient(circle, ${hexToRgba(color1, opacity1)}, ${hexToRgba(color2, opacity2)})`;
        } else if (gradientType === 'conic') {
            gradientString = `conic-gradient(${hexToRgba(color1, opacity1)}, ${hexToRgba(color2, opacity2)})`;
        }
        previewBox.style.background = gradientString;
    }

    function hexToRgba(hex, opacity) {
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${opacity})` : null;
    }

    // --- Recent Colors Functionality ---
    function updateRecentColorsDisplay() {
        recentColorsContainer.innerHTML = '';
        recentColors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.classList.add('color-swatch');
            swatch.style.backgroundColor = color;
            swatch.addEventListener('click', () => {
                if (activeSelection === selection1) {
                    colorInput1.value = color;
                } else {
                    colorInput2.value = color;
                }
                updatePreview(color);
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
    const rgbToHsl = (rgb) => {
        const r = rgb.r / 255;
        const g = rgb.g / 255;
        const b = rgb.b / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h *= 60;
        }

        return { h: Math.round(h), s, l };
    };
    function updateColorFromWheel() {
    const color = hslToRgb({ h: currentHue, s: currentSaturation, l: currentBrightness });
    const hexColor = rgbToHex(color);
    if (activeSelection === selection1) {
        colorInput1.value = hexColor;
    } else {
        colorInput2.value = hexColor;
    }
    updatePreview(hexColor);
    updateColorDisplay(color); // Add this line
}
    function handleColorInputChange(event) {
    const color = event.target.value;
    if (isValidColor(color)) {
        updatePreview(color);
        addToRecentColors(color);
        const rgbColor = hexToRgbNew(color); // We need this function
        if (rgbColor) {
            updateColorDisplay(rgbColor); // Add this line
        }
        if (event.target === colorInput2) {
            updateGradientPreview();
        }
    }
}
        const hexToRgbNew = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };
    
    // --- Color Adjustments Functionality ---
    function applyColorAdjustments() {
        // Adding 0.5 because the brightness input range is -100 to 100, we need to map it to 0 to 1
        currentBrightness = parseFloat(brightnessInput.value) / 100 + 0.5;
        // Adding 1 because the saturation input range is -100 to 100, mapping to 0 to 2 (0 being no saturation, 1 being original)
        currentSaturation = parseFloat(saturationInput.value) / 100 + 1;
        currentHue = parseFloat(hueInput.value);
        updateColorFromWheel();
    }

    // --- AI Suggestions ---
    async function generateAiColorSuggestions() {
        loadingIndicator.style.display = 'block';
        try {
            const colors = await generateColormindSuggestions();
            if (colors && colors.length > 0) {
                aiSuggestionsList.innerHTML = colors.map(color => `<p style="background-color: ${color};">${color}</p>`).join('');
                aiSuggestionsPanel.style.display = 'block';
            } else {
                aiSuggestionsList.innerHTML = '<p>No AI color suggestions found at this time.</p>';
                aiSuggestionsPanel.style.display = 'block';
            }
        } catch (error) {
            console.error("Error fetching AI suggestions:", error);
            aiSuggestionsList.innerHTML = '<p>Failed to fetch AI color suggestions. Please check your network connection.</p>';
            aiSuggestionsPanel.style.display = 'block';
        } finally {
            loadingIndicator.style.display = 'none';
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
    function handleColorInputChange(event) {
        const color = event.target.value;
        if (isValidColor(color)) {
            updatePreview(color);
            addToRecentColors(color);
            if (event.target === colorInput2) {
                updateGradientPreview();
            }
        }
    }

    // --- Event Listeners ---
    colorWheel.addEventListener('mousedown', (e) => { isDragging = true; rotateColorWheel(e); });
    colorWheel.addEventListener('mousemove', rotateColorWheel);
    window.addEventListener('mouseup', () => { isDragging = false; });
    colorWheel.addEventListener('touchstart', (e) => { isDragging = true; rotateColorWheel(e); e.preventDefault(); });
    colorWheel.addEventListener('touchmove', (e) => { rotateColorWheel(e); e.preventDefault(); });
    colorWheel.addEventListener('touchend', () => { isDragging = false; });

    colorInput1.addEventListener('input', handleColorInputChange);
    colorInput2.addEventListener('input', handleColorInputChange);

    gradientTypeSelect.addEventListener('change', updateGradientPreview);
    gradientDirectionInput.addEventListener('input', updateGradientPreview);

    opacityInput.addEventListener('input', (e) => {
        previewBox.style.opacity = e.target.value;
        previewBox.setAttribute('aria-valuenow', e.target.value); //Update ARIA
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
        // Re-render recent colors to respect the new limit
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
});

            
