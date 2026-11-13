import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Mail, Globe, MapPin, Sparkles } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-top container">
        <div className="footer-brand">
          <div className="footer-logo">
            <div className="footer-logo-icon">
              <Compass size={20} />
            </div>
            <span className="footer-logo-text">TripPilot</span>
          </div>
          <p className="footer-desc">
            Curated worldwide travel experiences, thoughtfully planned. Turn your travel inspiration into a realistic, cluster-optimized daily itinerary anywhere across the globe.
          </p>
        </div>
        <div className="footer-grid">
          <div className="footer-column">
            <h4 className="footer-heading">Explore</h4>
            <ul className="footer-list">
              <li><Link to="/explore">World Destinations</Link></li>
              <li><Link to="/plan">Plan Custom Trip</Link></li>
              <li><Link to="/my-trips">My Saved Trips</Link></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4 className="footer-heading">Company</h4>
            <ul className="footer-list">
              <li><Link to="/about">About TripPilot</Link></li>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4 className="footer-heading">Attribution & Data</h4>
            <ul className="footer-list footer-list-contact">
              <li>
                <Globe size={14} />
                <span>OpenStreetMap & Wikipedia</span>
              </li>
              <li>
                <Sparkles size={14} />
                <span>Wikimedia Commons Photos</span>
              </li>
              <li>
                <Mail size={14} />
                <span>hello@trippilot.com</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>© {new Date().getFullYear()} TripPilot. Data from OpenStreetMap & Wikipedia contributors.</p>
          <p>Crafted with care for travelers worldwide.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
