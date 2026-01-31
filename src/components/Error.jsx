import React from 'react';

export default function Error({ message, onRetry }) {
  return (
    <div className="error-container">
      <p>⚠️ {message}</p>
      {onRetry && <button onClick={onRetry}>Try Again</button>}
    </div>
  );
}