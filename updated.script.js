// Import all the different functionalities in modular mode.
import { initializeColorWheel } from './color-wheel.js'
import { updatePreview } from './preview.js'
import { updateRecentColorsDisplay} from './recent-colors.js'
import './color-input-handlers.js'
import './color-adjustments.js'
import './ai-suggestions.js'
import './export-import.js'
import './event-handlers.js'
import {el} from './dom-elements.js'

// Initialize functions
document.addEventListener('DOMContentLoaded', () => {
    initializeColorWheel();
    updatePreview(el.colorInput1.value);
    updateRecentColorsDisplay();
});
