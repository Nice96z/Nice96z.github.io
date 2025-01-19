import { el } from './dom-elements.js'

el.toggleThemeButton.addEventListener('click', () => document.body.classList.toggle('dark-mode'));

el.gradientTypeSelect.addEventListener('change',updateGradientPreview);
el.gradientDirectionSelect.addEventListener('change',updateGradientPreview);

function updateGradientPreview(){
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
