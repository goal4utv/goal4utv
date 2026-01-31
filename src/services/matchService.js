// src/services/matchService.js
import { formatDateISO } from '../utils/date';

const GITHUB_MATCHES_URL = 'https://raw.githubusercontent.com/gowrapavan/shortsdata/main/matches';
const GITHUB_STANDINGS_URL = 'https://raw.githubusercontent.com/gowrapavan/shortsdata/main/standing';

export const COMPETITIONS = [
  { code: 'EPL', name: 'Premier League' },
  { code: 'ESP', name: 'La Liga' },
  { code: 'ITSA', name: 'Serie A' },
  { code: 'DEB', name: 'Bundesliga' },
  { code: 'MLS', name: 'Major League Soccer' },
  { code: 'FRL1', name: 'Ligue 1' },
  { code: 'UCL', name: 'Champions League' },
  { code: 'CWC', name: 'FIFA Club World Cup' },
];

/**
 * Normalizes raw Match API data
 */
const normalizeMatch = (raw, compCode, compName) => {
  const rawDate = raw.DateTime || raw.Date;
  return {
    id: String(raw.GameId),
    competitionCode: compCode,
    competitionName: compName,
    homeTeam: raw.HomeTeamName || raw.HomeTeam,
    awayTeam: raw.AwayTeamName || raw.AwayTeam,
    homeScore: raw.HomeTeamScore ?? null,
    awayScore: raw.AwayTeamScore ?? null,
    dateTime: rawDate,
    status: raw.Status || 'Scheduled',
    homeLogo: raw.HomeTeamLogo || null,
    awayLogo: raw.AwayTeamLogo || null,
  };
};

/**
 * Normalizes raw Standings API data (The Fix)
 */
const normalizeStandings = (json) => {
  // 1. Check if the structure exists: root -> standings array -> index 0 -> table array
  if (json.standings && json.standings[0] && Array.isArray(json.standings[0].table)) {
    return json.standings[0].table.map(entry => ({
      Position: entry.position,
      TeamName: entry.team.name,  // Flatten nested team name
      ShortName: entry.team.shortName,
      Played: entry.playedGames,
      Points: entry.points,
      Won: entry.won,
      Draw: entry.draw,
      Lost: entry.lost,
      Crest: entry.team.crest
    }));
  }
  return [];
};

/**
 * Fetch matches for Home Page
 */
export const fetchMatchesByDate = async (targetDateISO) => {
  const fetchPromises = COMPETITIONS.map(async (comp) => {
    try {
      const response = await fetch(`${GITHUB_MATCHES_URL}/${comp.code}.json`);
      if (!response.ok) return [];
      const data = await response.json();
      
      if (!Array.isArray(data)) return [];

      return data
        .map(m => normalizeMatch(m, comp.code, comp.name))
        .filter(m => formatDateISO(new Date(m.dateTime)) === targetDateISO);
    } catch (error) {
      return [];
    }
  });

  const results = await Promise.all(fetchPromises);
  const allMatches = results.flat();

  return allMatches.sort((a, b) => {
    const statusOrder = { 'Live': 0, 'Scheduled': 1, 'Final': 2, 'FT': 2 };
    const statA = statusOrder[a.status] ?? 1;
    const statB = statusOrder[b.status] ?? 1;
    if (statA !== statB) return statA - statB;
    return new Date(a.dateTime) - new Date(b.dateTime);
  });
};

/**
 * Fetch Full Match Details
 */
export const fetchMatchDetails = async (matchId) => {
  let match = null;
  let competitionCode = null;
  let fullLeagueMatches = [];

  // 1. Find Match
  for (const comp of COMPETITIONS) {
    try {
      const response = await fetch(`${GITHUB_MATCHES_URL}/${comp.code}.json`);
      if (!response.ok) continue;
      const data = await response.json();
      
      if (!Array.isArray(data)) continue;

      const found = data.find(m => String(m.GameId) === String(matchId));
      if (found) {
        match = normalizeMatch(found, comp.code, comp.name);
        competitionCode = comp.code;
        fullLeagueMatches = data.map(m => normalizeMatch(m, comp.code, comp.name));
        break;
      }
    } catch (e) { continue; }
  }

  if (!match) throw new Error('Match not found');

  // 2. Fetch Standings (Parsing the complex JSON structure)
  let standings = [];
  try {
    const stdResponse = await fetch(`${GITHUB_STANDINGS_URL}/${competitionCode}.json`);
    if (stdResponse.ok) {
      const json = await stdResponse.json();
      standings = normalizeStandings(json); // Use helper to flatten data
    }
  } catch (e) { 
    console.warn('No standings found for', competitionCode); 
  }

  // 3. Calculate Form
  const finishedMatches = fullLeagueMatches.filter(m => 
    (m.status === 'Final' || m.status === 'FT') && 
    new Date(m.dateTime) < new Date(match.dateTime)
  ).sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

  const homeForm = finishedMatches.filter(m => m.homeTeam === match.homeTeam || m.awayTeam === match.homeTeam).slice(0, 5);
  const awayForm = finishedMatches.filter(m => m.homeTeam === match.awayTeam || m.awayTeam === match.awayTeam).slice(0, 5);

  return { match, standings, homeForm, awayForm };
};