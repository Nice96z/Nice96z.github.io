import { el } from './dom-elements.js'
import { recentColors, maxRecentColors, updateMaxRecentColors} from './state-variables.js'
import { updateRecentColorsDisplay } from './recent-colors.js';
import { debounce} from './utils.js'

function downloadFile(content, fileName, contentType) {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
}

el.exportJsonButton.addEventListener('click', () => {
    const colors = {
        color1: el.colorInput1.value,
        color2: el.colorInput2.value,
         opacity: el.opacityInput.value,
        brightness: el.brightnessInput.value,
         saturation: el.saturationInput.value,
         hue: el.hueInput.value,
        gradientType: el.gradientTypeSelect.value,
        gradientDirection: el.gradientDirectionSelect.value,
         recentColors
    };
    downloadFile(JSON.stringify(colors, null, 2), 'colors.json', 'application/json');
});


el.exportScssButton.addEventListener('click', () => {
  const scssString = `$color1: ${el.colorInput1.value};\n$color2: ${el.colorInput2.value};\n$opacity: ${el.opacityInput.value};\n$brightness: ${el.brightnessInput.value};\n$saturation: ${el.saturationInput.value};\n$hue: ${el.hueInput.value};\n$gradientType: ${el.gradientTypeSelect.value};\n$gradientDirection: ${el.gradientDirectionSelect.value};`;
    downloadFile(scssString, 'colors.scss', 'text/scss');
});

 el.copyColorsButton.addEventListener('click', () => {
        const colors = {
              color1: el.colorInput1.value,
             color2: el.colorInput2.value,
              opacity: el.opacityInput.value,
            brightness: el.brightnessInput.value,
              saturation: el.saturationInput.value,
               hue: el.hueInput.value,
              gradientType: el.gradientTypeSelect.value,
              gradientDirection: el.gradientDirectionSelect.value
         };
     navigator.clipboard.writeText(JSON.stringify(colors, null, 2))
           .then(() => alert('Colors copied to clipboard!'))
         .catch(err => console.error('Failed to copy: ', err));
});
    el.maxRecentColorsInput.addEventListener('input', debounce(() => {
          const newMax =  parseInt(el.maxRecentColorsInput.value) || maxRecentColors;
           updateMaxRecentColors(newMax);
           const  newRecent = recentColors.slice(0, newMax);
           updateRecentColors(newRecent);
              updateRecentColorsDisplay();
 }, 300));


export {
    downloadFile
}
