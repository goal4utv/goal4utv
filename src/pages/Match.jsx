import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchMatchDetails } from '../services/matchService';
import { formatTime } from '../utils/date';
import Spinner from '../components/Spinner';

const Match = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const details = await fetchMatchDetails(id);
        setData(details);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (loading) return <div className="page-container"><Spinner /></div>;
  if (!data) return <div className="page-container">Match not found. <Link to="/">Go Back</Link></div>;

  const { match, standings, homeForm, awayForm } = data;

  // --- SAFEGUARD LOGIC ---
  // Ensure standings is an array. If the service returned null/undefined, default to empty array.
  const safeStandings = Array.isArray(standings) ? standings : [];

  // Filter Standings: Match Home or Away team (Fuzzy search)
  // This handles cases like "Man City" vs "Manchester City FC"
  const relevantStandings = safeStandings.filter(s => {
    if (!s.TeamName) return false;
    
    const tName = s.TeamName.toLowerCase();       // e.g. "arsenal fc"
    const sName = (s.ShortName || '').toLowerCase(); // e.g. "arsenal"
    const home = match.homeTeam.toLowerCase();    // e.g. "arsenal"
    const away = match.awayTeam.toLowerCase();

    return (
      tName.includes(home) || home.includes(tName) || sName === home ||
      tName.includes(away) || away.includes(tName) || sName === away
    );
  }).sort((a,b) => a.Position - b.Position);


  // Helper: recent form badges (W/D/L colors)
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

  return (
    <div className="page-container">
      <Link to="/" className="back-link">← Back</Link>

      <div className="match-detail-container">
        
        {/* HERO SECTION */}
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

        {/* PLAYER SECTION */}
        <div className="player-section">
          <div className="video-frame">
             <div className="stream-overlay">
               <div className="play-btn">▶</div>
               <p>{match.status === 'Live' ? 'LIVE STREAM' : 'Stream starts 15 mins before kickoff'}</p>
             </div>
          </div>
        </div>

        {/* RECENT FORM SECTION */}
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

        {/* STANDINGS TABLE SECTION */}
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
                      {/* Using Crest if available from API */}
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