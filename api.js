// api.js

// Utility function (can be in a separate utils.js)
function rgbToHex(rgb) {
    const r = rgb.r.toString(16).padStart(2, '0');
    const g = rgb.g.toString(16).padStart(2, '0');
    const b = rgb.b.toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
}

// Function to generate AI color suggestions using Colormind API
export async function generateColormindSuggestions() {
    const apiUrl = 'http://colormind.io/api/';
    const data = { model: 'default' };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        return json.result.map(color => rgbToHex({ r: color[0], g: color[1], b: color[2] }));
    } catch (error) {
        console.error('Error fetching Colormind suggestions:', error);
        throw error; // Re-throw to be caught by the caller
    }
}

// Function to generate AI color suggestions using Adobe Color API
export async function generateAdobeColorSuggestions() {
    const apiUrl = 'https://color.adobe.com/api/v2/themes';

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        // Consider allowing more flexibility in theme selection
        return json.themes[0].swatches.map(swatch => swatch.hex);
    } catch (error) {
        console.error('Error fetching Adobe Color suggestions:', error);
        throw error;
    }
}

// Function to generate AI color suggestions using Color Thief
export async function generateColorThiefSuggestions(imageUrl) {
    return new Promise((resolve, reject) => {
        const colorThief = new ColorThief();
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = imageUrl;

        img.onload = () => {
            try {
                const palette = colorThief.getPalette(img, 5);
                resolve(palette.map(color => rgbToHex({ r: color[0], g: color[1], b: color[2] })));
            } catch (error) {
                console.error('Error generating Color Thief suggestions:', error);
                reject(error);
            }
        };

        img.onerror = (error) => {
            console.error('Error loading image for Color Thief:', error);
            reject(error);
        };
    });
}
