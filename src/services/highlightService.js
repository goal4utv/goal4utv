// src/services/highlightService.js

// The URL where your python pipeline outputs the final JSON
const HIGHLIGHTS_JSON_URL = 'https://raw.githubusercontent.com/gowrapavan/shortsdata/main/Highlights/Highlight.json';

/**
 * Fetches all highlights from the JSON store.
 */
export const fetchAllHighlights = async () => {
  try {
    const res = await fetch(HIGHLIGHTS_JSON_URL);
    if (!res.ok) throw new Error('Failed to fetch highlights');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('Error fetching highlights:', err);
    return [];
  }
};

/**
 * Finds a specific highlight by the official Game ID.
 * This links your "Match Page" to the "Highlight Data".
 */
export const findHighlightByGameId = async (gameId) => {
  const allHighlights = await fetchAllHighlights();
  
  // Convert both to strings to ensure safe comparison
  const highlight = allHighlights.find(h => String(h.game_id) === String(gameId));
  
  return highlight || null;
};