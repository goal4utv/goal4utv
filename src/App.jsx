import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Match from './pages/Match';
import NotFound from './pages/NotFound'; // <-- NEW IMPORT
import './styles/global.css';
// Add these imports at the top
import Login from './pages/Login';
import Profile from './pages/Profile';
import Register from './pages/Register';
import { HelmetProvider } from 'react-helmet-async';

function App() {
  return (
    <HelmetProvider>
    <BrowserRouter>
      <div className="app-wrapper">
        <Header />
        
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/match/:id" element={<Match />} />
            {/* Catch-all route for broken links */}
            <Route path="*" element={<NotFound />} /> 
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;