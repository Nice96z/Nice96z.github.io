import { el } from './dom-elements.js';
import { isValidColor, hexToRgb, rgbToHsl, rgbToHex} from './color-utils.js'
import { updatePreview, updateGradientPreview } from './preview.js'
import { addToRecentColors } from './recent-colors.js'
import {currentHue, currentSaturation, updateCurrentHue, updateCurrentSaturation,updateCurrentBrightness, activeSelection } from './state-variables.js';
import { drawColorWheel } from './color-wheel.js'
import { applyColorAdjustments} from './color-adjustments.js'



function handleColorInputChange(event) {
    const color = event.target.value;
    if (isValidColor(color)) {
        updatePreview(color);
        addToRecentColors(color);
        const rgbColor = hexToRgb(color);
         if (rgbColor) {
            updateColorDisplay(rgbColor);
            const hsl = rgbToHsl(rgbColor);
            updateCurrentHue(hsl.h);
             updateCurrentSaturation(hsl.s);
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
    const rgb = hslToRgb({ h: currentHue, s: currentSaturation, l:  currentBrightness });
    const hexColor = rgbToHex(rgb);
    setActiveColor(hexColor);
     updateColorDisplay(rgb);
     updatePreview(hexColor);

}
function updateColorDisplay({ r, g, b }) {
    const hex = rgbToHex({ r, g, b });
    const hsl = rgbToHsl({ r, g, b });
    el.hslValueDisplay.textContent = `(${hsl.h.toFixed(0)}, ${(hsl.s * 100).toFixed(0)}%, ${(hsl.l * 100).toFixed(0)}%)`;
    el.hexValueDisplay.textContent = hex;
    el.rgbValueDisplay.textContent = `(${r}, ${g}, ${b})`;
}


el.colorInput1.addEventListener('input', handleColorInputChange);
el.colorInput2.addEventListener('input', handleColorInputChange);

 el.opacityInput.addEventListener('input', (e) => {
    updatePreview(getActiveColor());
    el.previewBox.setAttribute('aria-valuenow', e.target.value);
 });


 function getActiveColor() {
    return activeSelection === el.selection1 ? el.colorInput1.value : el.colorInput2.value;
}

 export {
    handleColorInputChange,
    setActiveColor,
    updateColorFromWheel,
     updateColorDisplay,
     getActiveColor
 }
