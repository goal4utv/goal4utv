import React from 'react';
import { Link } from 'react-router-dom';
import { formatTime, getReadableDate } from '../utils/date';

const MatchCard = ({ match }) => {
  const isLive = match.status === 'Live';
  const isFinished = match.status === 'Final' || match.status === 'FT';
  
  // Determine status pill style
  let statusClass = 'status-scheduled';
  let statusText = formatTime(match.dateTime); // Default to time

  if (isLive) {
    statusClass = 'status-live';
    statusText = 'LIVE';
  } else if (isFinished) {
    statusClass = 'status-finished';
    statusText = 'FT';
  }

  return (
    <Link to={`/match/${match.id}`}>
      <div className="match-card">
        {/* Main Row: Home - Status - Away */}
        <div className="card-main">
          
          {/* Home Team */}
          <div className="team home">
            <span className="team-name">{match.homeTeam}</span>
            {match.homeLogo ? (
               <img src={match.homeLogo} alt="" className="team-logo" />
            ) : (
               <div className="team-logo" style={{background: '#eee', borderRadius: '50%'}}></div>
            )}
          </div>

          {/* Center Info */}
          <div className="match-info">
            {isFinished || isLive ? (
              <span className="score-board">
                {match.homeScore} - {match.awayScore}
              </span>
            ) : (
              <span className="score-board">VS</span>
            )}
            <span className={`status-pill ${statusClass}`}>
              {statusText}
            </span>
          </div>

          {/* Away Team */}
          <div className="team away">
             {match.awayLogo ? (
               <img src={match.awayLogo} alt="" className="team-logo" />
            ) : (
               <div className="team-logo" style={{background: '#eee', borderRadius: '50%'}}></div>
            )}
            <span className="team-name">{match.awayTeam}</span>
          </div>
        </div>

        {/* Footer Strip: League Name & Date/Time */}
        <div className="card-footer">
          <div className="league-info">
            <span>🏆 {match.competitionName}</span>
          </div>
          {/* UPDATED: Shows Date & Time instead of Channel */}
          <div className="tv-info" style={{fontWeight: '500', color: '#64748b'}}>
             📅 {getReadableDate(match.dateTime)} • ⏰ {formatTime(match.dateTime)}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MatchCard;