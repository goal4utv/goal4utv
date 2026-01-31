import React, { useState, useEffect } from 'react';
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
      const data = await fetchMatchesByDate(selectedDate);
      setMatches(data);
    } catch (err) {
      setError('Failed to load matches. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      

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