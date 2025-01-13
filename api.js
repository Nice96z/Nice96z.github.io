// api.js

// Function to convert RGB to HEX format
function rgbToHex(rgb) {
    const r = rgb.r.toString(16).padStart(2, '0');
    const g = rgb.g.toString(16).padStart(2, '0');
    const b = rgb.b.toString(16).padStart(2, '0');

    return `#${r}${g}${b}`;
}

// Function to generate AI color suggestions using Colormind API
export async function generateColormindSuggestions(callback) {
    const apiUrl = 'http://colormind.io/api/';
    const data = {
        model: 'default'
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        const colors = json.result;
        const colorHexes = colors.map(color => rgbToHex({ r: color[0], g: color[1], b: color[2] }));
        callback(colorHexes);

    } catch (error) {
        console.error('Error fetching Colormind suggestions:', error);
        callback(null, error);
    }
}

// Function to generate AI color suggestions using Adobe Color API
export async function generateAdobeColorSuggestions(callback) {
    const apiUrl = 'https://color.adobe.com/api/v2/themes';

    try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        // Extracting colors from the first theme for simplicity
        const colors = json.themes[0].swatches.map(swatch => swatch.hex);
        callback(colors);

    } catch (error) {
        console.error('Error fetching Adobe Color suggestions:', error);
        callback(null, error);
    }
}

// Function to generate AI color suggestions using Color Thief
export async function generateColorThiefSuggestions(imageUrl, callback) {
    try {
        const colorThief = new ColorThief();
        const img = new Image();
        img.crossOrigin = 'Anonymous'; // Enable cross-origin image loading
        img.src = imageUrl;

        img.onload = () => {
            const palette = colorThief.getPalette(img, 5); // Get a palette of 5 colors
            const colorHexes = palette.map(color => rgbToHex({ r: color[0], g: color[1], b: color[2] }));
            callback(colorHexes);
        };

        img.onerror = (error) => {
            console.error('Error loading image for Color Thief:', error);
            callback(null, error);
        };

    } catch (error) {
        console.error('Error generating Color Thief suggestions:', error);
        callback(null, error);
    }
}
