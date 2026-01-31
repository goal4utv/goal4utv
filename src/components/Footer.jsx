import React from 'react';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        
        {/* Column 1: About */}
        <div className="footer-col">
          <h3>About GOAL4UTV</h3>
          <p>
            The fastest destination for live scores, match stats, and real-time football updates. 
            We cover EPL, La Liga, Serie A, UCL, and more.
          </p>
        </div>

        {/* Column 2: Quick Links */}
        <div className="footer-col">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="#">Today's Matches</a></li>
            <li><a href="#">Live Scores</a></li>
            <li><a href="#">League Tables</a></li>
            <li><a href="#">Contact Us</a></li>
          </ul>
        </div>

        {/* Column 3: Legal / DMCA */}
        <div className="footer-col">
          <h3>Legal</h3>
          <ul>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
            <li><a href="#">DMCA</a></li>
            <li><a href="#">Cookie Policy</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="disclaimer">
          <strong>Disclaimer:</strong> This site does not host any video content. All videos are hosted on third-party sites like YouTube, Dailymotion, or Streamable. We are not responsible for content hosted on external sites.
        </p>
        <p className="copyright">
          © {new Date().getFullYear()} GOAL4UTV. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;