import { el } from './dom-elements.js';
import { setActiveColor } from './color-input-handlers.js'
import { updateRecentColors, maxRecentColors, recentColors} from './state-variables.js'


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
          updateRecentColors(recentColors);
        updateRecentColorsDisplay();
    }
}
export {
    updateRecentColorsDisplay,
    addToRecentColors,
    }
