import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowRight, Globe, Map, ShieldCheck, Sparkles } from 'lucide-react';
import './About.css';

const About = () => (
  <div className="about-page">
    <section className="page-hero about-hero">
      <div className="about-hero-bg" aria-hidden="true" />
      <div className="about-hero-overlay" aria-hidden="true" />
      <div className="container page-hero-content">
        <p className="page-hero-label">Our Mission</p>
        <h1 className="page-hero-title">About TripPilot</h1>
        <p className="page-hero-desc">
          Built for travelers worldwide who believe the journey is just as meaningful as the destination.
        </p>
      </div>
    </section>

    <section className="section about-mission">
      <div className="container about-mission-grid">
        <div className="about-mission-text">
          <span className="section-label">Why We Exist</span>
          <h2 className="section-title">Worldwide Travel, Thoughtfully Planned</h2>
          <p>
            TripPilot was born from a simple frustration — planning an authentic journey shouldn't feel like an overwhelming puzzle. Coordinating dates, multi-currency budgets, spots to visit, and geographic transit across dozens of open tabs is exhausting.
          </p>
          <p>
            We built TripPilot to take that burden away. Whether you're traveling to Rome, Tokyo, Bali, Paris, New York, or Munnar, tell us where you're headed and we craft a tailored, day-by-day itinerary that respects your pace, budget, and personal travel interests.
          </p>
          <p>
            Powered by real OpenStreetMap and Wikipedia data, our intelligent scheduling engine clusters nearby attractions to save you hours of unnecessary transit.
          </p>
          <Link to="/plan" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
            Start Planning Your Journey <ArrowRight size={16} />
          </Link>
        </div>
        <div className="about-mission-img-wrap">
          <img
            src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80"
            alt="World traveler looking out at scenic landscapes"
            loading="lazy"
          />
        </div>
      </div>
    </section>

    <section className="section about-values bg-forest">
      <div className="container">
        <div className="section-header centered" style={{ color: 'var(--color-cream)' }}>
          <span className="section-label">Our Principles</span>
          <h2 className="section-title" style={{ color: 'var(--color-cream)' }}>What We Stand For</h2>
        </div>
        <div className="values-grid">
          {[
            {
              icon: '🗺️',
              title: 'Global Coverage',
              desc: 'Seamless discovery and itinerary generation for virtually any city, town, or region on Earth.'
            },
            {
              icon: '💡',
              title: 'Geographic Optimization',
              desc: 'Intelligent Haversine clustering groups nearby attractions each day so you spend less time commuting and more time experiencing.'
            },
            {
              icon: '💰',
              title: 'Transparent Budgeting',
              desc: 'Every price and travel duration is honest and clearly labeled as an estimate with support for multi-currency conversion.'
            },
            {
              icon: '🔒',
              title: 'Privacy & Simplicity',
              desc: 'Your saved trips belong to you. No aggressive tracking, no forced social logins, and zero spam.'
            },
          ].map(v => (
            <div key={v.title} className="value-card">
              <span className="value-icon">{v.icon}</span>
              <h3>{v.title}</h3>
              <p>{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>
);

export default About;
