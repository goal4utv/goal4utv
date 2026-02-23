import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { profileService } from '../services/profileService';

const Header = ({ matches = [] }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'active-link' : '';
  const hasLiveMatches = matches.some(match => match.status === 'Live' || match.status === 'InProgress');

  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  // Intelligent Session & Profile Listener
  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    // 2. Listen for login/logout events automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null); // Clear profile on logout
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    const { data } = await profileService.getProfile(userId);
    setProfile(data);
  };

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          {/* Logo Area */}
          <Link to="/" className="brand-logo">
            <img src="https://goal4u.netlify.app/assets/img/site-logo/bg-white.png" alt="GOAL4UTV" className="header-logo-img" />
          </Link>

          {/* Navigation */}
          <nav className="main-nav">
            <Link to="/" className={`nav-item ${isActive('/')}`}>Home</Link>
            <a href="#news" className="nav-item">News</a>
            <a href="#highlights" className="nav-item">Highlights</a>
          </nav>

          {/* Right Actions */}
          <div className="header-actions">
            
            {hasLiveMatches && (
              <button className="live-indicator">
                <span className="live-dot"></span>
                LIVE
              </button>
            )}

            {/* Dynamic Auth UI */}
            {session ? (
              <Link to="/profile" className="user-profile-badge">
                <span className="header-username">{profile?.full_name?.split(' ')[0] || 'Fan'}</span>
                <img 
                  src={profile?.avatar_url || '/profile_pics/1.png'} 
                  alt="Profile" 
                  className="header-avatar" 
                />
              </Link>
            ) : (
              <Link to="/login" className="login-btn-header">Login</Link>
            )}

          </div>
        </div>
      </header>

      <style jsx>{`
        .site-header { position: sticky; top: 0; z-index: 1000; background: #ffffff; border-bottom: 1px solid #e2e8f0; height: 65px; display: flex; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .header-inner { width: 100%; max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 0 1.5rem; }
        .header-logo-img { height: 32px; display: block; }
        
        .main-nav { display: flex; gap: 2rem; position: absolute; left: 50%; transform: translateX(-50%); }
        .nav-item { text-decoration: none; color: #475569; font-weight: 600; font-size: 0.95rem; transition: color 0.2s; }
        .nav-item:hover, .active-link { color: #1e3a8a; }

        .header-actions { display: flex; align-items: center; gap: 16px; }
        
        /* Auth Buttons */
        .login-btn-header { background: #0f172a; color: white; padding: 8px 20px; border-radius: 8px; text-decoration: none; font-size: 0.9rem; font-weight: 600; transition: 0.2s; }
        .login-btn-header:hover { background: #1e293b; }

        /* User Badge */
        .user-profile-badge { display: flex; align-items: center; gap: 10px; text-decoration: none; background: #f8fafc; padding: 4px 12px 4px 4px; border-radius: 30px; border: 1px solid #e2e8f0; transition: 0.2s; }
        .user-profile-badge:hover { background: #f1f5f9; border-color: #cbd5e1; }
        .header-username { color: #1e293b; font-weight: 700; font-size: 0.9rem; padding-left: 8px; }
        .header-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 2px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }

        .live-indicator { background: #fff1f2; border: 1px solid #fecdd3; color: #e11d48; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 800; display: flex; align-items: center; gap: 6px; }
        .live-dot { width: 8px; height: 8px; background-color: #e11d48; border-radius: 50%; animation: pulse 1.5s infinite; }
        
        @keyframes pulse { 0% { transform: scale(0.9); opacity: 1; } 70% { transform: scale(1.8); opacity: 0; } 100% { transform: scale(0.9); opacity: 0; } }

        /* Responsive Mobile View */
        @media (max-width: 768px) {
          .main-nav { display: none; } /* Hide center nav on small screens */
          .header-username { display: none; } /* Show only avatar on mobile */
          .user-profile-badge { padding: 4px; border-radius: 50%; }
        }
      `}</style>
    </>
  );
};

export default Header;