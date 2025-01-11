// script.js

document.addEventListener('DOMContentLoaded', () => {
    const colorInput1 = document.getElementById('color-input-1');
    const colorInput2 = document.getElementById('color-input-2');
    const opacityInput = document.getElementById('opacity');
    const brightnessInput = document.getElementById('brightness');
    const saturationInput = document.getElementById('saturation');
    const hueInput = document.getElementById('hue');
    const gradientTypeSelect = document.getElementById('gradient-type');

    const contrastBgColorInput = document.getElementById('contrast-bg');
    const contrastResult = document.getElementById('contrast-result');
    const accessibilityLevel = document.getElementById('accessibility-level');
    const generatedPaletteDiv = document.getElementById('generated-palette');
    const colorHarmoniesDiv = document.getElementById('color-harmonies');
    const previewBox = document.getElementById('preview-box');
    const colorFormatsDiv = document.getElementById('color-formats');

    let savedPalettes = [];

    function updateColors() {
        const color1 = colorInput1.value;
        const color2 = colorInput2.value;
        
        // Update preview box
        previewBox.style.backgroundColor = color1;
        
        // Dynamic color formats
        updateColorFormats(color1);

        // Add to palette generator or apply dynamic changes to other features
        // ...
    }

    function updateColorFormats(color) {
        const rgb = hexToRgb(color);
        const hsl = rgbToHsl(rgb);

        colorFormatsDiv.innerHTML = `
            <p>HEX: ${color}</p>
            <p>RGB: ${rgb.r}, ${rgb.g}, ${rgb.b}</p>
            <p>HSL: ${Math.round(hsl.h)}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%</p>
        `;
    }

    function hexToRgb(hex) {
        const bigint = parseInt(hex.slice(1), 16);
        return {
            r: (bigint >> 16) & 255,
            g: (bigint >> 8) & 255,
            b: bigint & 255
        };
    }

    function rgbToHsl(rgb) {
        const r = rgb.r / 255;
        const g = rgb.g / 255;
        const b = rgb.b / 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l;

        l = (max + min) / 2;

        if (max == min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - d) : d / (2 - d);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return { h: h * 360, s: s, l: l };
    }

    function generateColorHarmonies() {
        const baseColor = colorInput1.value;
        const baseRgb = hexToRgb(baseColor);
        const rm = [baseRgb.r, baseRgb.g, baseRgb.b];

        // Generate complementary color
        const compColor = `#${((1 << 24) + (255 - rm[0]) * (1 << 16) + (255 - rm[1]) * (1 << 8) + (255 - rm[2])).toString(16).slice(1)}`;
        const harmonyHtml = `
            <div style="background-color:${baseColor}; width: 100px; height: 30px;"></div>
            <div style="background-color:${compColor}; width: 100px; height: 30px;"></div>
        `;
        colorHarmoniesDiv.innerHTML = harmonyHtml;
    }

    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
    }

    document.getElementById('generate-harmonies').addEventListener('click', generateColorHarmonies);
    document.getElementById('toggle-theme').addEventListener('click', toggleTheme);
    
    colorInput1.addEventListener('input', updateColors);
    colorInput2.addEventListener('input', updateColors);
    
    // Initialize colors and formats
    updateColors();
});
