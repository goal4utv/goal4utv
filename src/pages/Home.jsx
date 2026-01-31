import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { fetchMatchesByDate } from '../services/matchService';
import { getRelativeDate, getReadableDate } from '../utils/date';
import MatchCard from '../components/MatchCard';
import DateFilter from '../components/DateFilter';
import Spinner from '../components/Spinner';
import Error from '../components/Error';

const Home = () => {
  const [selectedDate, setSelectedDate] = useState(getRelativeDate(0)); // Default Today
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
      let data = await fetchMatchesByDate(selectedDate);
      
      const now = new Date();

      // --- 1. Override Status based on 2-Hour Rule ---
      data = data.map(match => {
        const matchTime = new Date(match.dateTime);
        const diffMs = now - matchTime; 
        const diffHours = diffMs / (1000 * 60 * 60); // Convert to hours

        let newStatus = match.status;

        // If match started more than 2 hours ago, force "FT"
        if (diffHours >= 2) {
             newStatus = 'FT'; 
        } 
        // If match started but is less than 2 hours in, force "Live"
        // (Unless it's explicitly marked Final/HT/FT)
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
        
        // Define Groups: 1=Live, 2=Scheduled, 3=Finished
        const getScore = (m) => {
           if (m.status === 'Live') return 1;
           if (m.status === 'Scheduled') return 2;
           return 3; // FT, Final, etc.
        };

        const scoreA = getScore(a);
        const scoreB = getScore(b);

        // Priority 1: Sort by Group (Live -> Scheduled -> Final)
        if (scoreA !== scoreB) {
          return scoreA - scoreB;
        }

        // Priority 2: Sort Inside Groups
        if (scoreA === 1) { 
           // Live Group: Earliest start time first (matches playing longest)
           return timeA - timeB; 
        }
        
        if (scoreA === 2) {
           // Scheduled Group: Soonest match first
           return timeA - timeB;
        }

        if (scoreA === 3) {
           // Finished Group: Most recently finished at the top of the bottom section
           return timeB - timeA; 
        }
        
        return 0;
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
      {/* --- SEO --- */}
      <Helmet>
        <title>Goal4uTv | Watch Live Football Streams & Scores</title>
        <meta name="description" content="Watch live football matches, check real-time scores, and view league standings for EPL, La Liga, UCL, and more." />
        <meta name="keywords" content="live football, sports stream, soccer scores, EPL live, la liga stream" />
        <link rel="canonical" href={siteUrl} />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:title" content="Goal4uTv | Live Football Streams" />
        <meta property="og:description" content="Free live football streaming and match stats for all major leagues." />
        <meta property="og:image" content={`${siteUrl}/logo.png`} />
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