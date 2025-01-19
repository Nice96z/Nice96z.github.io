import { el } from './dom-elements.js';
import { clamp, hslToRgb } from './color-utils.js';
import {
    THROTTLE_DELAY,
    currentHue,
    currentSaturation,
    isDragging,
    colorWheelCache,
    INDICATOR_RADIUS,
    updateCurrentHue,
    updateCurrentSaturation,
    updateColorWheelCache,
    updateActiveSelection
} from './state-variables.js';
import { updateColorFromWheel, updateColorDisplay } from './color-input-handlers.js'


const ctx = el.colorWheel.getContext('2d');
let wheelSize = el.colorWheel.offsetWidth;

function drawColorWheel() {
    wheelSize = el.colorWheel.offsetWidth;
    const centerX = wheelSize / 2;
    const centerY = wheelSize / 2;
    const radius = wheelSize / 2;

    ctx.clearRect(0, 0, wheelSize, wheelSize);

    if (colorWheelCache) {
        ctx.putImageData(colorWheelCache, 0, 0);
    } else {
        for (let y = 0; y < wheelSize; y++) {
            for (let x = 0; x < wheelSize; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance <= radius) {
                    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                    const hue = (angle + 360) % 360;
                    const saturation = distance / radius;
                    const rgb = hslToRgb({ h: hue, s: saturation, l: 0.5 });
                    ctx.fillStyle = `rgb(${rgb.r},${rgb.g},${rgb.b})`;
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        updateColorWheelCache(ctx.getImageData(0, 0, wheelSize, wheelSize));
    }
    drawSelectionIndicator();
}

function drawSelectionIndicator() {
    const { offsetWidth: wheelSize } = el.colorWheel;
    const centerX = wheelSize / 2;
    const centerY = wheelSize / 2;
    const radius = wheelSize / 2;

    const rad = currentHue * Math.PI / 180;
    const indicatorRadius = radius * currentSaturation;
    const indicatorX = centerX + indicatorRadius * Math.cos(rad);
    const indicatorY = centerY + indicatorRadius * Math.sin(rad);

    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, INDICATOR_RADIUS, 0, 2 * Math.PI);

    // Set the stroke style to provide contrast
    ctx.strokeStyle = document.body.classList.contains('dark-mode') ? 'white' : 'black';
    ctx.lineWidth = 2; // Add a line width for better visibility

    // Remove the fill to make it hollow
    // ctx.fillStyle = document.body.classList.contains('dark-mode') ? 'white' : 'black';
    // ctx.fill();

    ctx.stroke();
}


const rotateColorWheel = throttle((event) => {
    if (!isDragging) return;
    const bounds = el.colorWheel.getBoundingClientRect();
    const clientX = event.clientX !== undefined ? event.clientX : event.touches[0].clientX;
    const clientY = event.clientY !== undefined ? event.clientY : event.touches[0].clientY;
    const x = clientX - bounds.left - (wheelSize / 2);
    const y = clientY - bounds.top - (wheelSize / 2);

    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    updateCurrentHue((angle + 360) % 360)
    updateCurrentSaturation(clamp(Math.sqrt(x * x + y * y) / (wheelSize / 2), 0, 1));
    drawColorWheel();
    updateColorFromWheel();
}, THROTTLE_DELAY);



const handleColorWheelClick = (event) => {
    const bounds = el.colorWheel.getBoundingClientRect();
    const x = event.clientX - bounds.left - (wheelSize / 2);
    const y = event.clientY - bounds.top - (wheelSize / 2);
    const distance = Math.sqrt(x * x + y * y);

    if (distance <= wheelSize / 2) {
        let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
        updateCurrentHue((angle + 360) % 360);
        updateCurrentSaturation(clamp(distance / (wheelSize / 2), 0, 1));
        drawColorWheel();
        updateColorFromWheel();
    }
};


const handleColorWheelKeydown = (event) => {
    switch (event.key) {
        case 'ArrowLeft': updateCurrentHue((currentHue - 5 + 360) % 360); break;
        case 'ArrowRight':  updateCurrentHue((currentHue + 5) % 360); break;
        case 'ArrowUp': updateCurrentSaturation(Math.min(1, currentSaturation + 0.05)); break;
        case 'ArrowDown':  updateCurrentSaturation(Math.max(0, currentSaturation - 0.05)); break;
        default: return;
    }
    drawColorWheel();
    updateColorFromWheel();
};


function initializeColorWheel() {
     wheelSize = el.colorWheel.offsetWidth;
    el.colorWheel.width = wheelSize;
    el.colorWheel.height = wheelSize;
    drawColorWheel();

        // Event Listeners for mouse
        el.colorWheel.addEventListener('mousedown', (e) => { updateIsDragging(true); rotateColorWheel(e); el.colorWheel.focus(); });
        el.colorWheel.addEventListener('mousemove', rotateColorWheel);
         window.addEventListener('mouseup', () => { updateIsDragging(false); });
        // Event listeners for touch
         el.colorWheel.addEventListener('touchstart', (e) => { updateIsDragging(true); rotateColorWheel(e); e.preventDefault(); el.colorWheel.focus(); });
        el.colorWheel.addEventListener('touchmove', (e) => { rotateColorWheel(e); e.preventDefault(); });
        el.colorWheel.addEventListener('touchend', () => { updateIsDragging(false); });
         //Event Listeners for Click
        el.colorWheel.addEventListener('click', handleColorWheelClick);
        el.colorWheel.addEventListener('keydown', handleColorWheelKeydown);
       //  Event Listeners for Outline
         el.colorWheel.addEventListener('blur', () => el.colorWheel.style.outline = '');
        el.colorWheel.addEventListener('focus', () => el.colorWheel.style.outline = '2px solid var(--color-accent)');
    
    el.selection1.addEventListener('click', () => updateActiveSelection(el.selection1));
    el.selection2.addEventListener('click', () => updateActiveSelection(el.selection2));
}
    
function updateIsDragging(value){
    isDragging = value
}
export {
    drawColorWheel,
     initializeColorWheel
}
