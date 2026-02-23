import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { profileService } from '../services/profileService';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  const [showAvatars, setShowAvatars] = useState(false);
  const availableAvatars = Array.from({ length: 20 }, (_, i) => `/profile_pics/${i + 1}.png`);

  const [leagues] = useState([
    { code: 'EPL', name: 'Premier League', flag: 'https://crests.football-data.org/770.svg' },
    { code: 'ESP', name: 'La Liga', flag: 'https://crests.football-data.org/760.svg' },
    { code: 'ITSA', name: 'Serie A', flag: 'https://crests.football-data.org/784.svg' },
    { code: 'DEB', name: 'Bundesliga', flag: 'https://crests.football-data.org/759.svg' },
    { code: 'FRL1', name: 'Ligue 1', flag: 'https://crests.football-data.org/773.svg' }
  ]);
  
  const [selectedLeagueCode, setSelectedLeagueCode] = useState(null);
  const [leagueTeams, setLeagueTeams] = useState([]);
  const [fetchingTeams, setFetchingTeams] = useState(false);
  
  const [favoriteTeams, setFavoriteTeams] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [fetchingMatches, setFetchingMatches] = useState(false);
  
  const [activeFollowedClub, setActiveFollowedClub] = useState(null);

  // SEO Setup
  useEffect(() => {
    document.title = "Your Profile | Goal4uTv";
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = "description";
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = "Manage your Goal4uTv profile, choose your avatar, and follow your favorite football teams to get personalized match schedules.";
  }, []);

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/login');
      
      setUser(user);
      const { data } = await profileService.getProfile(user.id);
      setProfile(data);
      if (data?.favorite_teams) {
        setFavoriteTeams(data.favorite_teams);
        fetchUpcomingMatches(data.favorite_teams);
      }
      setLoading(false);
    };
    fetchUserAndProfile();
  }, [navigate]);

  // 🚀 SMART MAPPER (Moved up so everything can use it)
  const getCorrectFileName = (code) => {
    const map = {
      'PL': 'EPL', 'EPL': 'EPL',
      'ESP': 'ESP', 'PD': 'ESP',
      'ITA': 'ITSA', 'ITSA': 'ITSA',
      'FRA': 'FRL1', 'FRL1': 'FRL1', 'FL1': 'FRL1',
      'DEU': 'DEB', 'DEB': 'DEB', 'BL1': 'DEB'
    };
    return map[code] || code;
  };

  const handleLeagueSelect = async (leagueCode) => {
    // FIX: Apply the Smart Mapper here so we never fetch a 404 file!
    const mappedCode = getCorrectFileName(leagueCode);
    setSelectedLeagueCode(mappedCode);
    setFetchingTeams(true);
    
    try {
      const res = await fetch(`https://raw.githubusercontent.com/gowrapavan/shortsdata/main/standing/${mappedCode}.json`);
      if (!res.ok) throw new Error("File not found");
      const json = await res.json();
      
      const teams = json.standings[0].table.map(row => ({
        id: row.team.id,
        name: row.team.name,
        logo: row.team.crest,
        league: mappedCode // Force it to save the CORRECT mapped code going forward
      }));
      setLeagueTeams(teams);
    } catch (error) {
      console.error("Failed to fetch teams:", error);
    }
    setFetchingTeams(false);
  };

  const toggleTeamSelection = (team) => {
    const isSelected = favoriteTeams.some(t => t.id === team.id);
    let newFavorites;
    if (isSelected) {
      newFavorites = favoriteTeams.filter(t => t.id !== team.id);
    } else {
      newFavorites = [...favoriteTeams, team];
    }
    setFavoriteTeams(newFavorites);
  };

  const handleFollowedClubClick = (team) => {
    if (activeFollowedClub?.id === team.id) {
      setActiveFollowedClub(null);
    } else {
      setActiveFollowedClub(team);
      // We also map the code here just to be perfectly safe
      const mappedCode = getCorrectFileName(team.league);
      if (selectedLeagueCode !== mappedCode) {
        handleLeagueSelect(mappedCode);
      }
    }
  };

  const saveFavoriteTeams = async () => {
    setMessage({ type: '', text: '' });
    const { error } = await profileService.updateFavoriteTeams(user.id, favoriteTeams);
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Favorite teams updated!' });
      fetchUpcomingMatches(favoriteTeams);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleUpdateAvatar = async (avatarPath) => {
    setMessage({ type: '', text: '' });
    const { error } = await profileService.updateAvatar(user.id, avatarPath);
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setProfile({ ...profile, avatar_url: avatarPath });
      setMessage({ type: 'success', text: 'Profile picture updated!' });
      setShowAvatars(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const fetchUpcomingMatches = async (teams) => {
    if (teams.length === 0) {
      setUpcomingMatches([]);
      return;
    }
    setFetchingMatches(true);
    try {
      const fileNamesToFetch = [...new Set(teams.map(t => getCorrectFileName(t.league)))];
      
      const fetchPromises = fileNamesToFetch.map(fileName => 
        fetch(`https://raw.githubusercontent.com/gowrapavan/shortsdata/main/matches/${fileName}.json`)
          .then(res => {
            if (!res.ok) return [];
            return res.json();
          })
          .catch(() => [])
      );

      const results = await Promise.all(fetchPromises);
      const allMatches = results.flat();

      const teamIds = teams.map(t => Number(t.id));
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const filtered = allMatches.filter(m => {
        if (!m.DateTime) return false;
        const matchDate = new Date(m.DateTime);
        const homeId = Number(m.HomeTeamId);
        const awayId = Number(m.AwayTeamId);
        return matchDate >= today && (teamIds.includes(homeId) || teamIds.includes(awayId));
      });
      
      filtered.sort((a, b) => new Date(a.DateTime).getTime() - new Date(b.DateTime).getTime());
      setUpcomingMatches(filtered);
    } catch (error) {
      console.error("Failed to fetch matches", error);
    }
    setFetchingMatches(false);
  };

  const handleLogout = async () => {
    await authService.signOut();
    navigate('/');
  };

  if (loading) return <div className="loading-state"><Spinner /></div>;

  const displayedMatches = activeFollowedClub
    ? upcomingMatches.filter(m => Number(m.HomeTeamId) === Number(activeFollowedClub.id) || Number(m.AwayTeamId) === Number(activeFollowedClub.id)).slice(0, 5)
    : upcomingMatches.slice(0, 5);

  return (
    <div className="profile-wrapper">
      <div className="profile-layout">
        
        {/* LEFT COLUMN: USER INFO CARD */}
        <div className="profile-sidebar card">
          <div className="avatar-container">
            <img src={profile?.avatar_url || '/profile_pics/1.png'} alt="Current Avatar" className="main-avatar" />
          </div>
          <h2>{profile?.full_name || 'Sports Fan'}</h2>
          <p className="user-email">{user?.email}</p>
          
          <button onClick={() => setShowAvatars(!showAvatars)} className="change-avatar-btn">
            {showAvatars ? 'Cancel' : 'Change Avatar'}
          </button>
          
          <div className="sidebar-actions">
            <button onClick={handleLogout} className="logout-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Log Out
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: SETTINGS */}
        <div className="profile-content">
          {message.text && (
            <div className={`notification ${message.type}`}>{message.text}</div>
          )}

          {/* HIDDEN AVATAR SECTION */}
          {showAvatars && (
            <div className="card settings-section mb-4">
              <div className="section-header">
                <h3>Choose Your Avatar</h3>
              </div>
              <div className="avatar-grid">
                {availableAvatars.map(avatar => (
                  <img 
                    key={avatar} src={avatar} alt="Avatar"
                    className={`avatar-option ${profile?.avatar_url === avatar ? 'active-avatar' : ''}`}
                    onClick={() => handleUpdateAvatar(avatar)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* FAVORITE TEAMS SECTION */}
          <div className="card settings-section mb-4">
            <div className="section-header">
              <h3>Follow Your Teams</h3>
              <p>Select leagues, then pick the clubs you support.</p>
            </div>
            
            <div className="league-flags">
              {leagues.map(l => (
                <button 
                  key={l.code} 
                  className={`flag-btn ${selectedLeagueCode === l.code ? 'active-flag' : ''}`}
                  onClick={() => handleLeagueSelect(l.code)}
                >
                  <img src={l.flag} alt={l.name} />
                </button>
              ))}
            </div>

            {fetchingTeams ? (
              <div className="text-center py-4"><Spinner /></div>
            ) : leagueTeams.length > 0 && (
              <div className="teams-container mt-4">
                <div className="team-grid">
                  {leagueTeams.map((team) => {
                    const isSelected = favoriteTeams.some(t => t.id === team.id);
                    return (
                      <div 
                        key={team.id} 
                        className={`team-logo-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleTeamSelection(team)}
                        title={team.name}
                      >
                        <img src={team.logo} alt={team.name} />
                        {isSelected && <div className="checkmark">✓</div>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* SELECTED TEAMS SUMMARY WITH CLICK & DESELECT 'X' */}
            {favoriteTeams.length > 0 && (
              <div className="selected-summary mt-4">
                <h4>Following ({favoriteTeams.length})</h4>
                <div className="selected-logos">
                  {favoriteTeams.map(t => {
                    const isActive = activeFollowedClub?.id === t.id;
                    return (
                      <div 
                        key={t.id} 
                        className={`followed-team-badge ${isActive ? 'active' : ''}`}
                        onClick={() => handleFollowedClubClick(t)}
                      >
                        <img src={t.logo} alt={t.name} title={t.name} />
                        
                        {isActive && (
                          <button 
                            className="remove-team-btn" 
                            onClick={(e) => {
                              e.stopPropagation(); 
                              toggleTeamSelection(t);
                              setActiveFollowedClub(null); 
                            }}
                            title={`Remove ${t.name}`}
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button className="save-btn" onClick={saveFavoriteTeams}>
                  Save Preferences
                </button>
              </div>
            )}
          </div>

          {/* MATCHES SECTION */}
          {favoriteTeams.length > 0 && (
            <div className="settings-section mt-5">
              <div className="section-header">
                <h3>{activeFollowedClub ? `${activeFollowedClub.name} Matches` : 'Upcoming Matches'}</h3>
              </div>
              {fetchingMatches ? (
                <div className="text-center py-4"><Spinner /></div>
              ) : displayedMatches.length > 0 ? (
                <div className="matches-list">
                  {displayedMatches.map((match, idx) => {
                    const matchDate = new Date(match.DateTime);
                    const formattedTime = matchDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                    const formattedDate = matchDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }).replace(',', '');
                    
                    return (
                      <div key={idx} className="match-card-styled">
                        <div className="match-main-content">
                          <div className="match-team home">
                            <img src={`https://crests.football-data.org/${match.HomeTeamId}.png`} alt={match.HomeTeamKey} />
                            <span>{match.HomeTeamKey}</span>
                          </div>
                          
                          <div className="match-center-details">
                            <span className="vs-text">VS</span>
                            <span className="time-pill">{formattedTime}</span>
                          </div>
                          
                          <div className="match-team away">
                            <span>{match.AwayTeamKey}</span>
                            <img src={`https://crests.football-data.org/${match.AwayTeamId}.png`} alt={match.AwayTeamKey} />
                          </div>
                        </div>
                        
                        <div className="match-card-footer">
                          <div className="league-info">🏆 {match.RoundName}</div>
                          <div className="date-info">📅 {formattedDate}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500 card p-4">
                  {activeFollowedClub 
                    ? `No upcoming matches found for ${activeFollowedClub.name}.` 
                    : 'No upcoming matches scheduled right now.'}
                </p>
              )}
            </div>
          )}

        </div>
      </div>

      <style jsx>{`
        .profile-wrapper { min-height: calc(100vh - 65px); background: #f4f6f8; padding: 40px 20px; color: #1e293b; font-family: sans-serif; }
        .profile-layout { max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: 300px 1fr; gap: 24px; }
        
        .card { background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); padding: 30px; }
        .p-4 { padding: 20px; }
        .mb-4 { margin-bottom: 24px; }
        .mt-4 { margin-top: 24px; }
        .mt-5 { margin-top: 35px; }
        .py-4 { padding: 24px 0; }
        .text-center { text-align: center; }
        .text-slate-500 { color: #64748b; }
        
        .notification { padding: 12px 16px; border-radius: 8px; margin-bottom: 24px; font-size: 0.95rem; font-weight: 600; display: flex; align-items: center; }
        .notification.error { background: #fee2e2; color: #991b1b; border: 1px solid #f87171; }
        .notification.success { background: #f0fdf4; color: #166534; border: 1px solid #4ade80; }

        .profile-sidebar { text-align: center; display: flex; flex-direction: column; align-items: center; height: max-content; }
        .avatar-container { margin-bottom: 20px; }
        .main-avatar { border-radius: 50%; width: 120px; height: 120px; border: 4px solid #ffffff; box-shadow: 0 4px 15px rgba(0,0,0,0.1); object-fit: cover; }
        .profile-sidebar h2 { margin: 0 0 5px; font-size: 1.4rem; color: #0f172a; font-weight: 800; }
        .user-email { color: #64748b; font-size: 0.95rem; margin: 0 0 15px; }
        .change-avatar-btn { background: #eff6ff; color: #1d4ed8; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 700; border: 1px solid #bfdbfe; cursor: pointer; transition: 0.2s; }
        .change-avatar-btn:hover { background: #dbeafe; }
        
        .sidebar-actions { width: 100%; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        .logout-btn { width: 100%; padding: 12px; background: transparent; border: 1px solid #e2e8f0; color: #475569; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; display: flex; justify-content: center; align-items: center; gap: 8px; }
        .logout-btn:hover { background: #fee2e2; color: #ef4444; border-color: #fca5a5; }

        .section-header { margin-bottom: 20px; }
        .section-header h3 { font-size: 1.3rem; margin: 0 0 5px; color: #0f172a; font-weight: 800; }
        .section-header p { color: #64748b; font-size: 0.9rem; margin: 0; }
        
        .avatar-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); gap: 12px; }
        .avatar-option { width: 100%; aspect-ratio: 1; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: 0.2s; object-fit: cover; }
        .avatar-option:hover { transform: scale(1.05); }
        .active-avatar { border-color: #2563eb; transform: scale(1.1); box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3); }

        .league-flags { display: flex; gap: 15px; overflow-x: auto; padding-bottom: 10px; }
        .flag-btn { border: 2px solid transparent; background: none; padding: 4px; border-radius: 50%; cursor: pointer; transition: 0.2s; flex-shrink: 0; }
        .flag-btn img { width: 45px; height: 45px; border-radius: 50%; object-fit: cover; border: 1px solid #e2e8f0; }
        .flag-btn:hover, .active-flag { border-color: #2563eb; transform: scale(1.1); }
        
        .team-grid { display: flex; flex-wrap: wrap; gap: 15px; }
        .team-logo-btn { position: relative; width: 65px; height: 65px; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; background: #f8fafc; }
        .team-logo-btn img { max-width: 45px; max-height: 45px; object-fit: contain; }
        .team-logo-btn:hover { border-color: #94a3b8; background: #ffffff; }
        .team-logo-btn.selected { border-color: #2563eb; background: #eff6ff; box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2); }
        .checkmark { position: absolute; top: -6px; right: -6px; background: #2563eb; color: white; width: 20px; height: 20px; border-radius: 50%; font-size: 12px; display: flex; align-items: center; justify-content: center; font-weight: bold; }

        .selected-summary h4 { margin: 0 0 10px; font-size: 1rem; color: #334155; }
        .selected-logos { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
        
        .followed-team-badge { position: relative; display: inline-block; background: #ffffff; padding: 8px; border-radius: 10px; border: 2px solid transparent; cursor: pointer; transition: all 0.2s ease; }
        .followed-team-badge img { width: 40px; height: 40px; object-fit: contain; display: block; transition: 0.2s; }
        .followed-team-badge:hover { background: #f8fafc; border-color: #cbd5e1; }
        .followed-team-badge.active { border-color: #2563eb; background: #eff6ff; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2); transform: scale(1.05); }
        
        .remove-team-btn { position: absolute; top: -8px; right: -8px; background: #ef4444; color: white; border: 2px solid #ffffff; border-radius: 50%; width: 22px; height: 22px; font-size: 14px; font-weight: bold; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(239, 68, 68, 0.4); transition: 0.2s; }
        .remove-team-btn:hover { background: #dc2626; transform: scale(1.1); }

        .save-btn { background: #0f172a; color: white; padding: 10px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; transition: 0.2s; }
        .save-btn:hover { background: #1e293b; }

        .matches-list { display: flex; flex-direction: column; gap: 15px; }
        .match-card-styled { background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.03); overflow: hidden; transition: transform 0.2s, box-shadow 0.2s; }
        .match-card-styled:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0,0,0,0.08); }
        
        .match-main-content { display: flex; justify-content: space-between; align-items: center; padding: 20px; }
        
        .match-team { display: flex; align-items: center; gap: 15px; width: 40%; font-weight: 700; font-size: 1.05rem; color: #1e293b; }
        .match-team.away { justify-content: flex-end; text-align: right; }
        .match-team img { width: 35px; height: 35px; object-fit: contain; }
        
        .match-center-details { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; width: 20%; }
        .vs-text { font-weight: 900; font-size: 1.1rem; color: #0f172a; }
        .time-pill { background: #10b981; color: white; font-weight: 700; font-size: 0.8rem; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.5px; }
        
        .match-card-footer { display: flex; justify-content: space-between; background: #f8fafc; padding: 12px 20px; border-top: 1px solid #e2e8f0; font-size: 0.85rem; color: #64748b; font-weight: 500; }
        .league-info { display: flex; align-items: center; gap: 5px; color: #8b5cf6; font-weight: 600;}

        @media (max-width: 768px) {
          .profile-layout { grid-template-columns: 1fr; }
          .match-team span { display: none; }
          .match-main-content { padding: 15px; }
          .match-team { width: 30%; }
          .match-team img { width: 30px; height: 30px; }
        }
      `}</style>
    </div>
  );
};

export default Profile;