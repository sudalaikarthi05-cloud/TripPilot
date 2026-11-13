import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Calendar, ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { DESTINATIONS, FALLBACK_IMAGE } from '../utils/destinationData';
import './DestinationDetails.css';

const DestinationDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dest = DESTINATIONS.find(d => d.slug === slug);

  const [activeImg, setActiveImg] = useState(0);

  if (!dest) {
    return (
      <div className="loading-page" style={{ paddingTop: '6rem' }}>
        <span style={{ fontSize: '3rem' }}>🗺️</span>
        <p>Destination not found.</p>
        <button className="btn btn-outline" onClick={() => navigate('/explore')}>
          <ArrowLeft size={16} /> Back to Explore
        </button>
      </div>
    );
  }

  const allImgs = [dest.coverImage, ...(dest.galleryImages || [])].filter(Boolean);

  return (
    <div className="dest-details-page">
      {/* Hero */}
      <section className="dest-details-hero">
        <div
          className="dest-details-hero-bg"
          style={{ backgroundImage: `url('${allImgs[activeImg] || FALLBACK_IMAGE}')` }}
          aria-hidden="true"
        />
        <div className="dest-details-hero-overlay" aria-hidden="true" />
        <div className="dest-details-hero-content container">
          <button className="itin-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back
          </button>
          <span className="tag tag-gold" style={{ marginBottom: '0.875rem' }}>{dest.category}</span>
          <h1 className="dest-details-title">{dest.name}</h1>
          <p className="dest-details-region"><MapPin size={16} /> {dest.region}</p>
          <p className="dest-details-tagline">"{dest.tagline}"</p>
          <div className="dest-details-quick">
            <span><Clock size={14} /> {dest.duration}</span>
            <span><Calendar size={14} /> Best: {dest.bestTime}</span>
          </div>
        </div>
        {/* Image Thumbnails */}
        {allImgs.length > 1 && (
          <div className="dest-gallery-thumbs container">
            {allImgs.map((img, i) => (
              <button
                key={i}
                className={`dest-thumb${i === activeImg ? ' active' : ''}`}
                onClick={() => setActiveImg(i)}
                aria-label={`View image ${i + 1}`}
              >
                <img
                  src={img}
                  alt=""
                  onError={e => { e.target.src = FALLBACK_IMAGE; }}
                />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Main Content */}
      <section className="section dest-details-body">
        <div className="container">
          <div className="dest-details-layout">
            {/* Left column */}
            <div className="dest-details-main">
              <div className="dest-details-section">
                <h2 className="dest-details-section-title">About {dest.name}</h2>
                <p className="dest-details-long-desc">{dest.longDescription}</p>
              </div>

              <div className="dest-details-section">
                <h2 className="dest-details-section-title">Key Attractions</h2>
                <div className="dest-places-grid">
                  {(dest.places || []).map(place => (
                    <div key={place.id} className="dest-place-card">
                      <div className="dest-place-img-wrap">
                        <img
                          src={place.image || FALLBACK_IMAGE}
                          alt={place.name}
                          className="dest-place-img"
                          loading="lazy"
                          onError={e => { e.target.src = FALLBACK_IMAGE; }}
                        />
                      </div>
                      <div className="dest-place-body">
                        <span className="tag tag-green" style={{ fontSize: '0.7rem', marginBottom: '0.4rem' }}>{place.category}</span>
                        <h3>{place.name}</h3>
                        <p>{place.description}</p>
                        <div className="dest-place-meta">
                          <span><Clock size={13} /> {place.visitDuration}</span>
                          <span>💰 {place.estimatedCost}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="dest-details-sidebar">
              <div className="dest-sidebar-card">
                <h3>Highlights</h3>
                <ul className="dest-highlights-list">
                  {(dest.highlights || []).map(h => (
                    <li key={h}><span className="highlight-dot" />  {h}</li>
                  ))}
                </ul>
              </div>

              <div className="dest-sidebar-card">
                <h3>Quick Info</h3>
                <div className="dest-quick-info">
                  <div>
                    <span className="quick-label">Region</span>
                    <span className="quick-value">{dest.region}</span>
                  </div>
                  <div>
                    <span className="quick-label">Best Duration</span>
                    <span className="quick-value">{dest.duration}</span>
                  </div>
                  <div>
                    <span className="quick-label">Best Season</span>
                    <span className="quick-value">{dest.bestTime}</span>
                  </div>
                  <div>
                    <span className="quick-label">Category</span>
                    <span className="quick-value">{dest.category}</span>
                  </div>
                </div>
              </div>

              <div className="dest-sidebar-card">
                <h3>Tags</h3>
                <div className="dest-tags-list">
                  {(dest.tags || []).map(t => (
                    <span key={t} className="tag tag-green">{t}</span>
                  ))}
                </div>
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => navigate(`/plan?destination=${dest.id}`)}
              >
                Plan a Trip to {dest.name} <ArrowRight size={16} />
              </button>

              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(dest.name + ', Kerala, India')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{ width: '100%', justifyContent: 'center', marginTop: '-0.5rem' }}
              >
                <ExternalLink size={14} /> View on Map
              </a>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DestinationDetails;

