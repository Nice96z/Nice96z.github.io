export async function generateColormindSuggestions() {
    try {
        const response = await fetch('http://colormind.io/api/', {
            method: 'POST',
            body: JSON.stringify({ model: 'default' }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data && data.result) {
            return data.result.map(rgb => {
                const [r, g, b] = rgb;
                return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            });
        }
        return [];
    } catch (error) {
        console.error('Error fetching color suggestions:', error);
        throw error;
    }
}
