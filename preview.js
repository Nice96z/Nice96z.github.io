import { el } from './dom-elements.js';
import { hexToRgba } from './color-utils.js';

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
export {
    updatePreview,
    updateGradientPreview,
    updateCustomPreview
}
