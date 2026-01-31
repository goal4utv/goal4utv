import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'active-link' : '';

  return (
    <header className="site-header">
      <div className="header-inner">
        {/* Logo Area */}
        <Link to="/" className="brand-logo">
          <span className="brand-text">GOAL<span className="accent">4UTV</span></span>
        </Link>

        {/* Navigation Links (Hidden on small mobile) */}
        <nav className="main-nav">
          <Link to="/" className={`nav-item ${isActive('/')}`}>Home</Link>
          <a href="#" className="nav-item">News</a>
          <a href="#" className="nav-item">Highlights</a>
          <a href="#" className="nav-item">Leagues</a>
        </nav>

        {/* Right Actions */}
        <div className="header-actions">
           <a href="#" className="social-icon telegram-icon">
             {/* Telegram SVG Icon */}
             <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.48-.94-2.4-1.54-1.06-.7-.37-1.09.23-1.72.15-.16 2.8-2.57 2.85-2.79.0-.03.0-.13-.05-.18-.05-.05-.12-.03-.17-.02-.73.23-2.85 1.59-2.92 1.63-2.75 1.34-3.26 1.13-3.7-.22-.22-.67.14-.98 1.1-1.37 3.52-1.42 6.22-2.39 8.1-3.03 5.37-1.83 5.92-2.19 6.27-2.19.06 0 .2.01.3.08.09.07.13.17.14.28-.01.07.01.27-.01.44z"/></svg>
           </a>
           <button className="live-btn-header">🔴 LIVE</button>
        </div>
      </div>
    </header>
  );
};

export default Header;