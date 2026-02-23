import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { fetchMatchDetails } from '../services/matchService';
import { fetchAllStreams, findStreamsForMatch } from '../services/streamService';
import { findHighlightByGameId } from '../services/highlightService'; 
import { formatTime } from '../utils/date';
import Spinner from '../components/Spinner';

const Match = () => {
  const { id } = useParams(); // This is your GameId (e.g., 544211)
  
  // --- STATE ---
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Live Stream States
  const [streams, setStreams] = useState([]);
  const [matchedStreams, setMatchedStreams] = useState([]);
  const [activeStream, setActiveStream] = useState(null);
  const [showAllStreams, setShowAllStreams] = useState(false);

  // Highlight State
  const [highlight, setHighlight] = useState(null);
  const [isFinished, setIsFinished] = useState(false);

  // Countdown State
  const [countdown, setCountdown] = useState('');

  // --- INIT DATA ---
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const details = await fetchMatchDetails(id);
        
        const now = new Date();
        const matchTime = new Date(details.match.dateTime);
        const diffHours = (now - matchTime) / (1000 * 60 * 60);

        let currentStatus = details.match.status;
        if (diffHours >= 2) currentStatus = 'FT'; 
        
        details.match.status = currentStatus;
        setData(details);

        const finished = currentStatus === 'Final' || currentStatus === 'FT';
        setIsFinished(finished);

        if (finished) {
           const foundHighlight = await findHighlightByGameId(details.match.id);
           setHighlight(foundHighlight);
        } else {
           const allStreams = await fetchAllStreams();
           setStreams(allStreams);
           
           const found = findStreamsForMatch(allStreams, details.match.homeTeam, details.match.awayTeam);
           setMatchedStreams(found);
           
           if (found.length > 0) setActiveStream(found[0]);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  // --- COUNTDOWN TIMER EFFECT ---
  useEffect(() => {
    if (!data || data.match.status !== 'Scheduled') return;
    
    const matchDate = new Date(data.match.dateTime).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = matchDate - now;

      if (distance < 0) {
        setCountdown('Starting soon...');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      let timeStr = '';
      if (days > 0) timeStr += `${days}d `;
      timeStr += `${hours}h ${minutes}m ${seconds}s`;
      setCountdown(timeStr);
    };

    updateCountdown(); // Run immediately
    const intervalId = setInterval(updateCountdown, 1000); // Update every second
    
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [data]);

  // --- HANDLERS ---
  const handleStreamSelect = (stream) => {
    setActiveStream(stream);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Match link copied to clipboard!');
  };

  if (loading) return <div className="page-container"><Spinner /></div>;
  if (!data) return <div className="page-container">Match not found. <Link to="/">Go Back</Link></div>;

  const { match, standings, homeForm, awayForm, homeNext = [], awayNext = [] } = data;

  // --- HELPER LOGIC (Standings & Form) ---
  const safeStandings = Array.isArray(standings) ? standings : [];
  const relevantStandings = safeStandings.filter(s => {
    if (!s.TeamName) return false;
    const tName = s.TeamName.toLowerCase();
    const sName = (s.ShortName || '').toLowerCase();
    const home = match.homeTeam.toLowerCase();
    const away = match.awayTeam.toLowerCase();
    return (tName.includes(home) || home.includes(tName) || sName === home || tName.includes(away) || away.includes(tName) || sName === away);
  }).sort((a,b) => a.Position - b.Position);

  const getFormBadge = (m, teamName) => {
    const isHome = m.homeTeam === teamName;
    const teamScore = isHome ? m.homeScore : m.awayScore;
    const oppScore = isHome ? m.awayScore : m.homeScore;
    let resultClass = 'form-draw'; 
    if (teamScore > oppScore) resultClass = 'form-win'; 
    if (teamScore < oppScore) resultClass = 'form-loss'; 
    return (
      <div key={m.id} className="form-item">
        <div className={`form-badge ${resultClass}`}>{m.homeScore}-{m.awayScore}</div>
        <span className="form-opp">{isHome ? m.awayTeam : m.homeTeam}</span>
      </div>
    );
  };

  const renderNextMatch = (m, teamName) => {
    const isHome = m.homeTeam === teamName;
    const opponent = isHome ? m.awayTeam : m.homeTeam;
    const opponentLogo = isHome ? m.awayLogo : m.homeLogo; 
    const dateStr = new Date(m.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    return (
      <div key={m.id} style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '10px 12px', 
        marginBottom: '8px',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px',
        borderLeft: isHome ? '4px solid #0d47a1' : '4px solid #b71c1c',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}>
        <span style={{ fontWeight: '600', minWidth: '60px', color: '#495057', fontSize: '0.85rem', borderRight: '1px solid #dee2e6', marginRight: '10px', paddingRight: '10px' }}>
          {dateStr}
        </span>
        
        <span style={{ 
          fontSize: '0.75rem', 
          fontWeight: '700', 
          color: isHome ? '#0d47a1' : '#b71c1c', 
          backgroundColor: isHome ? '#e3f2fd' : '#ffebee', 
          padding: '2px 6px', 
          borderRadius: '4px',
          marginRight: '10px'
        }}>
          {isHome ? '(H)' : '(A)'}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          {opponentLogo && (
            <img 
              src={opponentLogo} 
              alt={opponent} 
              style={{ width: '22px', height: '22px', objectFit: 'contain', marginRight: '8px' }} 
            />
          )}
          <span style={{ color: '#212529', fontWeight: '500', fontSize: '0.95rem' }}>{opponent}</span>
        </div>
      </div>
    );
  };

  // SEO & Sharing Strings
  const matchTitle = `${match.homeTeam} vs ${match.awayTeam} ${isFinished ? 'Highlights' : 'Live Stream'} | Goal4uTv`;
  const matchDesc = `Watch ${match.homeTeam} vs ${match.awayTeam} ${isFinished ? 'highlights and goals' : 'live stream'}. ${match.competitionName} match details.`;
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  // 🚀 THIS IS THE NEW DYNAMIC IMAGE URL POINTING TO YOUR GENERATED ASSETS 🚀
  const generatedImageUrl = `https://raw.githubusercontent.com/gowrapavan/shortsdata/main/output_images/${id}.png`;

  // Button Style block
  const shareBtnStyle = {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', 
    borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600',
    fontSize: '0.9rem', color: '#fff', textDecoration: 'none',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'transform 0.2s'
  };

  return (
    <div className="page-container">
      <Helmet>
        <title>{matchTitle}</title>
        <meta name="description" content={matchDesc} />
        
        {/* Open Graph / Facebook / WhatsApp */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:title" content={matchTitle} />
        <meta property="og:description" content={matchDesc} />
        <meta property="og:image" content={generatedImageUrl} />
        <meta property="og:image:width" content="1280" />
        <meta property="og:image:height" content="720" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={shareUrl} />
        <meta name="twitter:title" content={matchTitle} />
        <meta name="twitter:description" content={matchDesc} />
        <meta name="twitter:image" content={generatedImageUrl} />
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
            
            <div className="hero-vs" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
              {match.status === 'Scheduled' ? (
                <>
                  <span style={{ fontSize: '1.2rem' }}>{formatTime(match.dateTime)}</span>
                  {countdown && (
                    <span style={{ 
                      fontSize: '0.85rem', color: '#e53e3e', fontWeight: 'bold', 
                      backgroundColor: '#fff5f5', padding: '4px 10px', borderRadius: '20px',
                      whiteSpace: 'nowrap', border: '1px solid #fed7d7'
                    }}>
                      ⏳ {countdown}
                    </span>
                  )}
                </>
              ) : (
                <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>{match.homeScore} - {match.awayScore}</span>
              )}
            </div>

            <div className="hero-team">
              {match.awayLogo && <img src={match.awayLogo} className="hero-logo" alt="" />}
              <span className="hero-name">{match.awayTeam}</span>
            </div>
          </div>
        </div>

        {/* === MEDIA PLAYER SECTION (Conditional) === */}
        <div className="player-section">
          <div className="video-frame">
             {isFinished && (
               <>
                 {highlight ? (
                   <iframe 
                     src={highlight.embed_url} 
                     title="Match Highlights"
                     className="iframe-embed"
                     allowFullScreen
                     scrolling="no"
                     allow="autoplay; fullscreen"
                   />
                 ) : (
                   <div className="stream-overlay">
                      <div className="play-btn" style={{fontSize: '3rem'}}>⏳</div>
                      <h3>Highlights Coming Soon</h3>
                      <p>The match has ended. Highlights will be updated shortly.</p>
                   </div>
                 )}
               </>
             )}

             {!isFinished && (
               <>
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
               </>
             )}
          </div>

          {/* === OFFICIAL LOGO SHARE BUTTONS === */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
            <button onClick={handleCopyLink} style={{ ...shareBtnStyle, backgroundColor: '#6c757d' }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
               Copy Link
            </button>
            <a href={`https://wa.me/?text=${encodeURIComponent(matchTitle + ' ' + shareUrl)}`} target="_blank" rel="noreferrer" style={{ ...shareBtnStyle, backgroundColor: '#25D366' }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
               <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
               WhatsApp
            </a>
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(matchTitle)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" style={{ ...shareBtnStyle, backgroundColor: '#1DA1F2' }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
               <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
               Twitter
            </a>
            <a href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(matchTitle)}`} target="_blank" rel="noreferrer" style={{ ...shareBtnStyle, backgroundColor: '#0088cc' }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
               <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>
               Telegram
            </a>
          </div>

          {/* SERVER LIST (Only show if NOT finished) */}
          {!isFinished && (
            <div className="server-list-container" style={{ marginTop: '30px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '2px solid #f1f5f9', marginBottom: '20px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📺 Available Servers 
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500' }}>
                    ({(showAllStreams ? streams : matchedStreams).length})
                  </span>
                </span>

                <button 
                  onClick={() => setShowAllStreams(!showAllStreams)}
                  style={{
                    backgroundColor: showAllStreams ? '#f8fafc' : '#eff6ff',
                    color: showAllStreams ? '#64748b' : '#2563eb',
                    border: showAllStreams ? '1px solid #e2e8f0' : '1px solid #bfdbfe',
                    padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease'
                  }}
                >
                  {showAllStreams ? "Show Recommended" : "Show All Streams"}
                </button>
              </div>

             {/* === EXACT MATCH FOR SERVER BUTTONS === */}
             <div style={{ 
  display: 'grid', 
  // 2 columns on mobile (min 0px), auto-fill on larger screens (min 600px)
  gridTemplateColumns: window.innerWidth < 600 ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(280px, 1fr))', 
  gap: '10px' 
}}>
  {(showAllStreams ? streams : matchedStreams).map((stream) => {
    const isActive = activeStream?.uniqueId === stream.uniqueId;
    return (
      <button 
        key={stream.uniqueId} 
        onClick={() => handleStreamSelect(stream)}
        style={{
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '5px', // Slightly tighter for mobile
          backgroundColor: isActive ? '#bbf4c4' : '#ffffff',
          border: isActive ? '1px solid #3b82f6' : '1px solid #e2e8f0',
          borderRadius: '8px', 
          cursor: 'pointer', 
          transition: 'all 0.2s ease',
          width: '100%', 
          textAlign: 'left', 
          outline: 'none',
          boxShadow: isActive ? '0 0 0 1px #41f63b' : 'none',
          overflow: 'hidden' // Prevents text overflow issues
        }}
      >
        {/* Server Tag */}
        <span style={{ 
          backgroundColor: '#1fbd32', 
          color: '#ffffff', 
          padding: '5px 8px', 
          borderRadius: '5px', 
          fontSize: '0.65rem', // Smaller font for 2-column mobile layout
          fontWeight: '800', 
          textTransform: 'uppercase', 
          flexShrink: 0 // Keeps the tag from squishing
        }}>
          {stream.source}
        </span>

        {/* Label */}
        <span style={{ 
          color: '#1e293b', 
          fontSize: '0.85rem', 
          fontWeight: '500', 
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis' 
        }}>
          {stream.cleanLabel}
        </span>
      </button>
    );
  })}
</div>
            </div>
          )}

          {/* HIGHLIGHT INFO */}
          {isFinished && highlight && (
            <div style={{padding: '20px', textAlign: 'center', color: '#666'}}>
               <p><strong>Source:</strong> {highlight.source} • <strong>League:</strong> {highlight.league}</p>
            </div>
          )}
        </div>

        {/* === STATS SECTIONS (Form, Next Matches, & Standings) === */}
        <div className="content-section">
          <h3>Recent Matches</h3>
          <div className="form-grid">
            <div className="team-form">
              <h4>{match.homeTeam}</h4>
              <div className="form-row">{homeForm.map(m => getFormBadge(m, match.homeTeam))}</div>
            </div>
            <div className="team-form">
              <h4>{match.awayTeam}</h4>
              <div className="form-row">{awayForm.map(m => getFormBadge(m, match.awayTeam))}</div>
            </div>
          </div>
        </div>

        {/* --- UPCOMING MATCHES --- */}
        <div className="content-section" style={{ marginTop: '30px' }}>
          <h3>Upcoming Matches</h3>
          <div className="form-grid">
            <div className="team-form">
              <h4>{match.homeTeam}</h4>
              <div style={{ padding: '5px 0' }}>
                {homeNext.map(m => renderNextMatch(m, match.homeTeam))}
                {homeNext.length === 0 && <p style={{color: '#888', fontSize: '0.9rem', padding: '10px 0'}}>No scheduled matches.</p>}
              </div>
            </div>
            <div className="team-form">
              <h4>{match.awayTeam}</h4>
              <div style={{ padding: '5px 0' }}>
                {awayNext.map(m => renderNextMatch(m, match.awayTeam))}
                {awayNext.length === 0 && <p style={{color: '#888', fontSize: '0.9rem', padding: '10px 0'}}>No scheduled matches.</p>}
              </div>
            </div>
          </div>
        </div>

        {/* --- STANDINGS --- */}
        {relevantStandings.length > 0 && (
          <div className="content-section" style={{ marginTop: '30px' }}>
            <h3>Current Standings</h3>
            <table className="standings-table">
              <thead><tr><th>Pos</th><th>Team</th><th>P</th><th>PTS</th></tr></thead>
              <tbody>
                {relevantStandings.map(row => (
                  <tr key={row.TeamName} className={row.TeamName === match.homeTeam || row.TeamName === match.awayTeam ? 'highlight-row' : ''}>
                    <td>{row.Position}</td>
                    <td className="table-team">{row.Crest && <img src={row.Crest} style={{width:'20px'}} alt=""/>}{row.TeamName}</td>
                    <td>{row.Played}</td>
                    <td><strong>{row.Points}</strong></td>
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