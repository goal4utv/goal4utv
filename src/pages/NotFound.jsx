import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const NotFound = () => {
  return (
    <div className="page-container" style={{ textAlign: 'center', padding: '100px 20px' }}>
      <Helmet>
        <title>Page Not Found | Goal4uTv</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <h1 style={{ fontSize: '4rem', marginBottom: '10px' }}>404</h1>
      <h2>Oops! Match Not Found</h2>
      <p style={{ color: '#64748b', marginBottom: '30px' }}>
        The page or stream you are looking for doesn't exist or has been removed.
      </p>
      <Link to="/" className="live-btn-header" style={{ textDecoration: 'none', display: 'inline-block' }}>
        Return to Home
      </Link>
    </div>
  );
};

export default NotFound;