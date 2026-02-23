import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { supabase } from '../lib/supabase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();

  // AUTH GUARD: Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/profile'); // Redirect to home if already logged in
      } else {
        setCheckingSession(false); // Show login form if not logged in
      }
    };
    checkSession();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const { error } = await authService.signIn(email, password);
    if (error) {
      setMessage({ type: 'error', text: error.message });
      setLoading(false);
    } else {
      navigate('/'); // Redirect instantly on success
    }
  };

  // Prevent flashing the login form while checking auth status
  if (checkingSession) return <div style={{ minHeight: '80vh', background: '#f4f6f8' }}></div>;

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="logo-section">
           <img src="https://goal4u.netlify.app/assets/img/site-logo/bg-white.png" alt="Goal4uTv" />
        </div>
        <h2>Welcome Back</h2>

        {message.text && (
          <div className={`notification ${message.type}`}>{message.text}</div>
        )}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Email</label>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
        <p className="auth-footer">Don't have an account? <Link to="/register">Register here</Link></p>
      </div>

      <style jsx>{`
        .auth-wrapper { min-height: 80vh; background: #f4f6f8; display: flex; align-items: center; justify-content: center; font-family: sans-serif; padding: 20px; }
        .auth-card { background: #ffffff; padding: 2.5rem; border-radius: 12px; width: 100%; max-width: 420px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .logo-section { text-align: center; margin-bottom: 1.5rem; }
        .logo-section img { height: 40px; }
        h2 { color: #1e293b; text-align: center; margin-bottom: 1.5rem; font-size: 1.5rem; font-weight: 700; }
        .notification { padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem; text-align: center; font-weight: 600; }
        .notification.error { background: #fee2e2; color: #991b1b; border: 1px solid #f87171; }
        .input-group { margin-bottom: 1.2rem; }
        label { display: block; color: #475569; font-size: 0.85rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
        input { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #cbd5e1; background: #f8fafc; color: #1e293b; outline: none; transition: 0.2s; }
        input:focus { border-color: #3b82f6; background: #ffffff; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
        button { width: 100%; padding: 14px; background: #0f172a; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: background 0.2s; margin-top: 1rem; font-size: 1rem; }
        button:hover { background: #1e293b; }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
        .auth-footer { text-align: center; color: #64748b; margin-top: 20px; font-size: 0.95rem; }
        .auth-footer a { color: #2563eb; text-decoration: none; font-weight: 700; }
        .auth-footer a:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
};

export default Login;