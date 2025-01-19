import { el } from './dom-elements.js';
import {clamp, rgbToHsl, hslToRgb, rgbToHex, hexToRgb} from './color-utils.js'
import { getActiveColor, setActiveColor, updateColorDisplay} from './color-input-handlers.js';
import { drawColorWheel} from './color-wheel.js'
import {updatePreview } from './preview.js'


function applyColorAdjustments() {
    const currentHexColor = getActiveColor();
    const currentRgb = hexToRgb(currentHexColor);
    if (!currentRgb) return;

    let hsl = rgbToHsl(currentRgb);

    hsl.l = clamp(parseFloat(el.brightnessInput.value) / 100 + 0.5, 0, 1);
    hsl.s = clamp(parseFloat(el.saturationInput.value) / 100 + 0.5, 0, 1);
     hsl.h = parseInt(el.hueInput.value, 10);
 

    const rgb = hslToRgb(hsl);
     const hexColor = rgbToHex(rgb);
      setActiveColor(hexColor);
      updatePreview(hexColor);
      updateColorDisplay(rgb)
      drawColorWheel();

}

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

export {
    applyColorAdjustments,

}
