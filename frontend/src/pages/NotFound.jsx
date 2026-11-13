import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft, Search, Sparkles } from 'lucide-react';

const NotFound = () => {
  return (
    <div style={{
      minHeight: '75vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 1.5rem',
      textAlign: 'center',
      background: 'var(--color-cream-light)'
    }}>
      <div style={{
        maxWidth: '560px',
        background: 'var(--color-white)',
        borderRadius: 'var(--radius-xl)',
        padding: '3.5rem 2rem',
        border: '1px solid var(--color-gray-green-border)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          background: 'rgba(198,146,57,0.15)',
          color: 'var(--color-gold)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem'
        }}>
          <Compass size={36} />
        </div>

        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '3rem',
          color: 'var(--color-forest)',
          marginBottom: '0.5rem',
          lineHeight: '1'
        }}>
          404
        </h1>
        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1.5rem',
          color: 'var(--color-forest)',
          marginBottom: '1rem'
        }}>
          Destination Off the Map
        </h2>
        <p style={{
          fontSize: '0.95rem',
          color: 'var(--color-text-muted)',
          lineHeight: '1.6',
          marginBottom: '2rem'
        }}>
          The page or travel route you are looking for doesn't exist or has moved. Let’s guide you back to charted territory.
        </p>

        <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={16} /> Return to Home
          </Link>
          <Link to="/explore" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={16} /> Explore Destinations
          </Link>
          <Link to="/plan" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} /> Plan a Trip
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

