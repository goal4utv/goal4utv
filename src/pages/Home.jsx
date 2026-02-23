import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { fetchMatchesByDate } from '../services/matchService';
import { getRelativeDate, getReadableDate } from '../utils/date';
import MatchCard from '../components/MatchCard';
import DateFilter from '../components/DateFilter';
import Spinner from '../components/Spinner';
import Error from '../components/Error';

const Home = () => {
  const [selectedDate, setSelectedDate] = useState(getRelativeDate(0)); 
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMatches();
  }, [selectedDate]);

  const loadMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      // Data here is already normalized by your matchService
      let data = await fetchMatchesByDate(selectedDate);
      
      const now = new Date();

      // --- 1. Override Status based on 2-Hour Rule ---
      data = data.map(match => {
        const matchTime = new Date(match.dateTime);
        const diffHours = (now - matchTime) / (1000 * 60 * 60);

        let newStatus = match.status;

        if (diffHours >= 2) {
             newStatus = 'FT'; 
        } 
        else if (diffHours > 0 && diffHours < 2) {
             if (match.status !== 'Final' && match.status !== 'FT' && match.status !== 'HT') {
                 newStatus = 'Live';
             }
        }
        
        return { ...match, status: newStatus };
      });

      // --- 2. Advanced Sorting ---
      data.sort((a, b) => {
        const timeA = new Date(a.dateTime).getTime();
        const timeB = new Date(b.dateTime).getTime();
        
        const getScore = (m) => {
           if (m.status === 'Live' || m.status === 'InProgress') return 1;
           if (m.status === 'Scheduled') return 2;
           return 3; // FT, Final
        };

        const scoreA = getScore(a);
        const scoreB = getScore(b);

        if (scoreA !== scoreB) return scoreA - scoreB;

        // Inside Groups: Live/Scheduled (earliest first), Finished (most recent first)
        return scoreA === 3 ? timeB - timeA : timeA - timeB;
      });

      setMatches(data);
    } catch (err) {
      setError('Failed to load matches. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const siteUrl = "https://goal4utv.netlify.app";

  return (
    <div className="page-container">
      <Helmet>
        <title>Goal4uTv | Watch Live Football Streams & Scores</title>
        <meta name="description" content="Watch live football matches, check real-time scores, and view league standings." />
        <link rel="canonical" href={siteUrl} />
      </Helmet>

      <DateFilter selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      <div className="matches-container">
        <h2 className="date-header">{getReadableDate(selectedDate)}</h2>
        
        {loading && <Spinner />}
        {error && <Error message={error} onRetry={loadMatches} />}
        
        {!loading && !error && matches.length === 0 && (
          <p className="no-matches">No matches scheduled for this date.</p>
        )}

        <div className="matches-grid">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;