import React from 'react';
import { Link } from 'react-router-dom';
import { formatTime, getReadableDate } from '../utils/date';

const MatchCard = ({ match }) => {
  const isLive = match.status === 'Live' || match.status === 'InProgress';
  const isFinished = match.status === 'Final' || match.status === 'FT';
  
  let statusClass = 'status-scheduled';
  let statusText = formatTime(match.dateTime); 

  if (isLive) {
    statusClass = 'status-live';
    statusText = 'LIVE';
  } else if (isFinished) {
    statusClass = 'status-finished';
    statusText = 'FT';
  }

  // Define both full and short names
  const homeFullName = match.homeTeam;
  const awayFullName = match.awayTeam;
  const homeShortName = match.homeTeamKey || match.homeTeam;
  const awayShortName = match.awayTeamKey || match.awayTeam;

  // Fix: Convert null/undefined scores to 0
  const homeScore = match.homeScore != null ? match.homeScore : 0;
  const awayScore = match.awayScore != null ? match.awayScore : 0;

  return (
    <Link to={`/match/${match.id}`} style={{ textDecoration: 'none' }}>
      
      <style>
        {`
          /* =========================================
             DESKTOP LAYOUT (Large, spacious)
             ========================================= */
          .card-main-dynamic {
            display: grid; 
            grid-template-columns: 1fr auto 1fr; 
            align-items: center; 
            gap: 16px;
            padding: 24px 20px;
          }
          
          .team-home {
            display: flex; align-items: center; gap: 12px; overflow: hidden;
            justify-content: flex-end; 
          }
          .team-home .t-logo { order: 2; }
          .team-home .t-name { order: 1; text-align: right; }

          .team-away {
            display: flex; align-items: center; gap: 12px; overflow: hidden;
            justify-content: flex-start;
          }
          .team-away .t-logo { order: 1; }
          .team-away .t-name { order: 2; text-align: left; }

          /* Desktop Sizes */
          .t-logo {
            width: 45px; height: 45px; object-fit: contain; flex-shrink: 0;
          }
          .t-name {
            font-weight: 700; font-size: 1.15rem; color: #1e293b;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }
          .center-score {
            font-weight: 900; font-size: 1.6rem; color: #0f172a;
          }
          .center-badge {
            font-size: 0.75rem; padding: 4px 10px; borderRadius: 4px; margin-top: 6px;
          }

          /* Name visibility classes for Desktop */
          .hide-desktop { display: none; }
          .hide-mobile { display: inline; }

          /* =========================================
             MOBILE LAYOUT 
             ========================================= */
          @media (max-width: 600px) {
            .card-main-dynamic {
              padding: 16px 12px;
              gap: 8px;
            }
            .team-home { justify-content: flex-start; gap: 8px; }
            .team-home .t-logo { order: 1; }
            .team-home .t-name { order: 2; text-align: left; }

            .team-away { justify-content: flex-end; gap: 8px; }
            .team-away .t-logo { order: 2; }
            .team-away .t-name { order: 1; text-align: right; }
            
            /* Shrink sizes back down for mobile */
            .t-logo { width: 30px; height: 30px; }
            .t-name { font-size: 0.85rem; }
            .center-score { font-size: 1.1rem; }
            .center-badge { font-size: 0.65rem; padding: 2px 8px; margin-top: 4px; }

            /* Flip name visibility for Mobile */
            .hide-desktop { display: inline; }
            .hide-mobile { display: none; }
          }
        `}
      </style>

      <div className="match-card">
        <div className="card-main-dynamic">
          
          {/* Home Team Section */}
          <div className="team-home">
            <img 
              className="t-logo"
              src={match.homeLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(homeShortName)}&background=6c757d&color=fff&size=45`} 
              alt="" 
            />
            <span className="t-name">
              <span className="hide-mobile">{homeFullName}</span>
              <span className="hide-desktop">{homeShortName}</span>
            </span>
          </div>

          {/* Center Info: VS or Score */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px' }}>
            <span className="center-score">
              {isFinished || isLive ? `${homeScore} - ${awayScore}` : 'VS'}
            </span>
            <span className={`status-pill ${statusClass} center-badge`} style={{ borderRadius: '4px' }}>
              {statusText}
            </span>
          </div>

          {/* Away Team Section */}
          <div className="team-away">
            <img 
              className="t-logo"
              src={match.awayLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(awayShortName)}&background=6c757d&color=fff&size=45`} 
              alt="" 
            />
            <span className="t-name">
              <span className="hide-mobile">{awayFullName}</span>
              <span className="hide-desktop">{awayShortName}</span>
            </span>
          </div>
        </div>

        {/* Footer: League and Date/Time */}
        <div className="card-footer" style={{ 
          borderTop: '1px solid #f1f5f9', 
          padding: '10px 16px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: '#fafafa'
        }}>
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: '600' }}>
            🏆 {match.competitionName}
          </div>
          <div style={{ fontWeight: '600', color: '#94a3b8', fontSize: '0.75rem' }}>
             📅 {getReadableDate(match.dateTime)} • ⏰ {formatTime(match.dateTime)}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MatchCard;