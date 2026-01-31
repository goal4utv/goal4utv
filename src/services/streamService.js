// src/services/streamService.js

// --- Configuration ---
// Only using OvoGoals, SportzOnline, and HesGoal as requested
export const PROVIDERS = [
  { label: "OvoGoals", key: "ovogoals", url: "https://raw.githubusercontent.com/gowrapavan/shortsdata/main/json/ovogoal.json" },
  { label: "Sportz", key: "sportzonline", url: "https://raw.githubusercontent.com/gowrapavan/shortsdata/main/json/sportsonline.json" },
  { label: "HesGoal", key: "hesgoal", url: "https://raw.githubusercontent.com/gowrapavan/shortsdata/main/json/hesgoal.json" }
];

// --- Helpers ---
// Normalize strings: remove special chars, spaces, and convert to lowercase for better matching
const normalize = (str) => {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
};

/**
 * 1. Fetches ALL streams from the 3 providers in parallel.
 * 2. Returns a unified flat list of streams.
 * (SportzOnline's multiple servers will simply become multiple items in this list)
 */
export const fetchAllStreams = async () => {
  const promises = PROVIDERS.map(async (provider) => {
    try {
      const res = await fetch(provider.url);
      if (!res.ok) return [];
      const data = await res.json();
      
      // Ensure result is an array
      if (!Array.isArray(data)) return [];

      // Tag each stream with its provider source
      return data.map((stream, index) => ({
        ...stream,
        // Create a unique ID for React keys later
        uniqueId: `${provider.key}-${index}-${Date.now()}`,
        source: provider.label, 
        // Fallback label if specific label is missing
        cleanLabel: stream.label || `${stream.home_team} vs ${stream.away_team}`
      }));
    } catch (err) {
      console.warn(`Failed to load ${provider.label}`, err);
      return [];
    }
  });

  const results = await Promise.all(promises);
  // Flattening ensures SportzOnline's multiple entries mix nicely with others
  return results.flat();
};

/**
 * Filter streams that match the current match's Home or Away team.
 * * New Logic uses the explicit 'home_team' and 'away_team' fields from your JSON
 * for much higher accuracy than just searching the label.
 */
export const findStreamsForMatch = (allStreams, appHomeTeam, appAwayTeam) => {
  const targetHome = normalize(appHomeTeam); // e.g., "arsenal"
  const targetAway = normalize(appAwayTeam); // e.g., "leedsunited"

  return allStreams.filter(stream => {
    // 1. Get stream data (handle missing fields safely)
    const streamHome = normalize(stream.home_team);
    const streamAway = normalize(stream.away_team);
    const streamLabel = normalize(stream.label);

    // 2. Strategy: Explicit Team Match
    // We check if the stream's home/away fields roughly match our app's home/away
    if (streamHome && streamAway) {
      const matchDirect = (streamHome.includes(targetHome) || targetHome.includes(streamHome)) &&
                          (streamAway.includes(targetAway) || targetAway.includes(streamAway));
      
      // Also check swapped (Home vs Away) just in case data is inverted
      const matchSwap = (streamHome.includes(targetAway) || targetAway.includes(streamHome)) &&
                        (streamAway.includes(targetHome) || targetHome.includes(streamAway));

      if (matchDirect || matchSwap) return true;
    }

    // 3. Fallback: Label Match
    // If specific team fields are missing or empty, search the label string
    if (streamLabel) {
      return (streamLabel.includes(targetHome) && streamLabel.includes(targetAway));
    }

    return false;
  });
};