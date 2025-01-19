import { el } from './dom-elements.js';
import { generateColormindSuggestions } from './api.js';
import {setActiveColor } from './color-input-handlers.js'

async function generateAiColorSuggestions() {
    el.loadingIndicator.classList.remove('hidden');
    el.aiSuggestionsPanel.setAttribute('aria-hidden', 'false');
    try {
        const colormindPalette = await generateColormindSuggestions();
         el.aiSuggestionsList.innerHTML = '';

          if (colormindPalette && colormindPalette.length > 0) {
                colormindPalette.forEach(color => {
                   const suggestionElement = el.aiSuggestionTemplate.content.cloneNode(true).querySelector('.ai-suggestion');
                      suggestionElement.style.backgroundColor = color;
                        suggestionElement.setAttribute('aria-label', `AI suggested color: ${color}`);
                    suggestionElement.addEventListener('click', () => setActiveColor(color));
                     el.aiSuggestionsList.appendChild(suggestionElement);
           });
      } else {
             el.aiSuggestionsList.innerHTML = '<p>No Colormind suggestions found.</p>';
         }
  } catch (error) {
    console.error("Error fetching AI suggestions:", error);
      el.aiSuggestionsList.innerHTML = '<p>Failed to fetch AI color suggestions. Please check your network connection.</p>';
    } finally {
       el.loadingIndicator.classList.add('hidden');
  }
}

el.generateAiSuggestionsButton.addEventListener('click', generateAiColorSuggestions);


export {
    generateAiColorSuggestions
}
