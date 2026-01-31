import React from 'react';
import { Link } from 'react-router-dom';
import { formatTime } from '../utils/date';

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
          
          {/* Home Team (Right aligned in Koora usually, but let's stick to Left for English) */}
          <div className="team home">
            <span className="team-name">{match.homeTeam}</span>
            {match.homeLogo ? (
               <img src={match.homeLogo} alt="" className="team-logo" />
            ) : (
               <div className="team-logo-placeholder"></div>
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
               <div className="team-logo-placeholder"></div>
            )}
            <span className="team-name">{match.awayTeam}</span>
          </div>
        </div>

        {/* Footer Strip: League Name & TV (Koora Style) */}
        <div className="card-footer">
          <div className="league-info">
            <span>🏆 {match.competitionName}</span>
          </div>
          <div className="tv-info">
             📺 beIN Sports {/* Static for now, can be dynamic later */}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MatchCard;