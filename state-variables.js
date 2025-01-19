// Constants
export const THROTTLE_DELAY = 50;
export const DEFAULT_MAX_RECENT_COLORS = 5;
export const INDICATOR_RADIUS = 8;

// State Variables
export let isDragging = false;
export let recentColors = [];
export let maxRecentColors = DEFAULT_MAX_RECENT_COLORS;
export let currentHue = 0;
export let currentSaturation = 0.5;
export let currentBrightness = 0.5;
export let colorWheelCache = null;
export let activeSelection = null;

export const updateActiveSelection = (selection)=>{
    activeSelection = selection
}

export const updateCurrentHue = (hue) => { currentHue = hue }
export const updateCurrentSaturation = (saturation) => { currentSaturation = saturation }
export const updateCurrentBrightness = (brightness) => {currentBrightness = brightness};
export const updateColorWheelCache = (cache) => { colorWheelCache = cache };
export const updateRecentColors = (colors) => { recentColors = colors }
export const updateMaxRecentColors = (max) => { maxRecentColors = max}
