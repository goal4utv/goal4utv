import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { fetchMatchDetails } from '../services/matchService';
import { fetchAllStreams, findStreamsForMatch } from '../services/streamService';
import { formatTime } from '../utils/date';
import Spinner from '../components/Spinner';

const Match = () => {
  const { id } = useParams();
  
  // --- STATE ---
  const [data, setData] = useState(null); // Match Info + Stats + Form
  const [loading, setLoading] = useState(true);
  
  // Stream States
  const [streams, setStreams] = useState([]); // All fetched streams from all providers
  const [matchedStreams, setMatchedStreams] = useState([]); // Streams matching English team names
  const [activeStream, setActiveStream] = useState(null); // The currently playing stream URL
  const [showAllStreams, setShowAllStreams] = useState(false); // Toggle between "Recommended" and "All"

  // --- INIT DATA ---
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // 1. Fetch Match Details (Info, Standings, Form)
        const details = await fetchMatchDetails(id);
        setData(details);

        // 2. Fetch Live Streams
        const allStreams = await fetchAllStreams();
        setStreams(allStreams);

        // 3. Auto-Match Streams to Team Names
        const found = findStreamsForMatch(allStreams, details.match.homeTeam, details.match.awayTeam);
        setMatchedStreams(found);

        // 4. Auto-Play if a match is found
        if (found.length > 0) {
          setActiveStream(found[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  // --- HANDLERS ---
  const handleStreamSelect = (stream) => {
    setActiveStream(stream);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- RENDER HELPERS ---
  if (loading) return <div className="page-container"><Spinner /></div>;
  if (!data) return <div className="page-container">Match not found. <Link to="/">Go Back</Link></div>;

  const { match, standings, homeForm, awayForm } = data;

  // 1. Standings Logic (Fuzzy Search & Safeguard)
  const safeStandings = Array.isArray(standings) ? standings : [];
  const relevantStandings = safeStandings.filter(s => {
    if (!s.TeamName) return false;
    const tName = s.TeamName.toLowerCase();
    const sName = (s.ShortName || '').toLowerCase();
    const home = match.homeTeam.toLowerCase();
    const away = match.awayTeam.toLowerCase();
    return (
      tName.includes(home) || home.includes(tName) || sName === home ||
      tName.includes(away) || away.includes(tName) || sName === away
    );
  }).sort((a,b) => a.Position - b.Position);

  // 2. Form Badge Logic
  const getFormBadge = (m, teamName) => {
    const isHome = m.homeTeam === teamName;
    const teamScore = isHome ? m.homeScore : m.awayScore;
    const oppScore = isHome ? m.awayScore : m.homeScore;
    
    let resultClass = 'form-draw'; 
    if (teamScore > oppScore) resultClass = 'form-win'; 
    if (teamScore < oppScore) resultClass = 'form-loss'; 

    return (
      <div key={m.id} className="form-item">
        <div className={`form-badge ${resultClass}`}>
           {m.homeScore}-{m.awayScore}
        </div>
        <span className="form-opp">{isHome ? m.awayTeam : m.homeTeam}</span>
      </div>
    );
  };

  // 3. Stream List Logic
  const displayList = showAllStreams ? streams : matchedStreams;

  // 4. SEO Constants
  const siteUrl = "https://goal4utv.netlify.app";
  const currentUrl = `${siteUrl}/match/${id}`;
  const matchTitle = `${match.homeTeam} vs ${match.awayTeam} Live Stream | Goal4uTv`;
  const matchDesc = `Watch ${match.homeTeam} vs ${match.awayTeam} live. ${match.competitionName} match score, stats, and free stream.`;
  const ogImage = match.homeLogo || `${siteUrl}/logo.png`;

  // Schema.org Data
  const matchSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "name": `${match.homeTeam} vs ${match.awayTeam}`,
    "startDate": match.dateTime,
    "description": matchDesc,
    "sport": "Soccer",
    "competitor": [
      { "@type": "SportsTeam", "name": match.homeTeam, "image": match.homeLogo },
      { "@type": "SportsTeam", "name": match.awayTeam, "image": match.awayLogo }
    ],
    "location": { "@type": "VirtualLocation", "url": currentUrl }
  });

  return (
    <div className="page-container">
      
      {/* --- DYNAMIC SEO --- */}
      <Helmet>
        <title>{matchTitle}</title>
        <meta name="description" content={matchDesc} />
        <link rel="canonical" href={currentUrl} />

        {/* Open Graph */}
        <meta property="og:title" content={matchTitle} />
        <meta property="og:description" content={matchDesc} />
        <meta property="og:type" content="video.other" />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:image" content={ogImage} />
        
        {/* Schema.org */}
        <script type="application/ld+json">{matchSchema}</script>
      </Helmet>

      <Link to="/" className="back-link">← Back</Link>

      <div className="match-detail-container">
        
        {/* === HERO SECTION === */}
        <div className="match-hero">
          <span className="hero-league">🏆 {match.competitionName}</span>
          <div className="hero-scoreboard">
            <div className="hero-team">
              {match.homeLogo && <img src={match.homeLogo} className="hero-logo" alt="" />}
              <span className="hero-name">{match.homeTeam}</span>
            </div>
            <div className="hero-vs">
              {match.status === 'Scheduled' ? formatTime(match.dateTime) : `${match.homeScore} - ${match.awayScore}`}
            </div>
            <div className="hero-team">
              {match.awayLogo && <img src={match.awayLogo} className="hero-logo" alt="" />}
              <span className="hero-name">{match.awayTeam}</span>
            </div>
          </div>
        </div>

        {/* === VIDEO PLAYER SECTION === */}
        <div className="player-section">
          <div className="video-frame">
             {activeStream ? (
               <iframe 
                 src={activeStream.url} 
                 title="Live Stream"
                 className="iframe-embed"
                 sandbox="allow-scripts allow-same-origin allow-presentation"
                 allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                 allowFullScreen
                 scrolling="no"
               />
             ) : (
               <div className="stream-overlay">
                 <div className="play-btn">{matchedStreams.length > 0 ? '▶' : '📺'}</div>
                 <p>
                   {matchedStreams.length > 0 
                     ? 'Select a server below to start watching' 
                     : 'No direct English match found.'}
                 </p>
                 {matchedStreams.length === 0 && (
                   <button className="manual-search-btn" onClick={() => setShowAllStreams(true)}>
                     Browse All Live Streams
                   </button>
                 )}
               </div>
             )}
          </div>

          {/* === SERVER LIST === */}
          <div className="server-list-container">
            <div className="server-header">
               <span>📺 Available Servers ({displayList.length})</span>
               <button className="toggle-all-btn" onClick={() => setShowAllStreams(!showAllStreams)}>
                 {showAllStreams ? "Show Recommended" : "Show All Streams"}
               </button>
            </div>

            <div className="servers-grid">
              {displayList.length > 0 ? displayList.map((stream, index) => (
                <button 
                  key={index}
                  className={`server-btn ${activeStream === stream ? 'active' : ''}`}
                  onClick={() => handleStreamSelect(stream)}
                >
                  <span className="provider-tag">{stream.source}</span>
                  <span className="stream-label">{stream.cleanLabel}</span>
                </button>
              )) : (
                <div className="no-streams">
                  <p>No streams available currently.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* === RECENT FORM SECTION === */}
        <div className="content-section">
          <h3>Recent Matches</h3>
          <div className="form-grid">
            <div className="team-form">
              <h4>{match.homeTeam}</h4>
              <div className="form-row">
                {homeForm.length > 0 ? homeForm.map(m => getFormBadge(m, match.homeTeam)) : <p>No recent data</p>}
              </div>
            </div>
            <div className="team-form">
              <h4>{match.awayTeam}</h4>
              <div className="form-row">
                {awayForm.length > 0 ? awayForm.map(m => getFormBadge(m, match.awayTeam)) : <p>No recent data</p>}
              </div>
            </div>
          </div>
        </div>

        {/* === STANDINGS TABLE SECTION === */}
        {relevantStandings.length > 0 && (
          <div className="content-section">
            <h3>Current Standings</h3>
            <table className="standings-table">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Team</th>
                  <th>P</th>
                  <th>PTS</th>
                  <th>W/D/L</th>
                </tr>
              </thead>
              <tbody>
                {relevantStandings.map((row) => (
                  <tr key={row.TeamName} className={row.TeamName === match.homeTeam || row.TeamName === match.awayTeam ? 'highlight-row' : ''}>
                    <td>{row.Position}</td>
                    <td className="table-team">
                      {row.Crest && <img src={row.Crest} alt="" style={{width: '20px', height: '20px'}} />}
                      <span>{row.TeamName}</span>
                    </td>
                    <td>{row.Played}</td>
                    <td><strong>{row.Points}</strong></td>
                    <td>{row.Won}/{row.Draw}/{row.Lost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

export default Match;