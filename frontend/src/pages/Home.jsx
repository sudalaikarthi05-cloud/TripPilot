import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, MapPin, Calendar, Users, Search, ChevronRight, Compass,
  Globe, Sparkles, ShieldCheck, Map, DollarSign, Clock, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  POPULAR_GLOBAL_DESTINATIONS, FALLBACK_IMAGE
} from '../utils/destinationData';
import './Home.css';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&q=85';

/* Category chips */
const TRAVEL_CATEGORIES = [
  { id: 'Nature', label: 'Nature & Parks', icon: '🌿', search: 'Nature' },
  { id: 'Beach', label: 'Beaches & Oceans', icon: '🏖️', search: 'Beach' },
  { id: 'Mountains', label: 'Mountains & Peaks', icon: '⛰️', search: 'Mountain' },
  { id: 'Adventure', label: 'Adventure & Trails', icon: '🧗', search: 'Adventure' },
  { id: 'Culture', label: 'Culture & Museums', icon: '🏛️', search: 'Museum' },
  { id: 'Food', label: 'Culinary & Markets', icon: '🍜', search: 'Food' },
];

/* ---- Hook: reveal on scroll ---- */
function useIntersection(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setVisible(true);
        obs.disconnect();
      }
    }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [destInput, setDestInput] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [travelers, setTravelers] = useState('2');

  const [destRef, destVisible] = useIntersection();
  const [whyRef, whyVisible] = useIntersection();
  const [howRef, howVisible] = useIntersection();
  const [ctaRef, ctaVisible] = useIntersection();

  useEffect(() => {
    const img = new Image();
    img.src = HERO_IMAGE;
    img.onload = () => setHeroLoaded(true);
    img.onerror = () => setHeroLoaded(true);
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destInput.trim()) params.set('destination', destInput.trim());
    if (travelDate) params.set('date', travelDate);
    if (travelers) params.set('travelers', travelers);
    navigate(`/plan?${params.toString()}`);
  };

  const handleCategoryClick = (catSearch) => {
    navigate(`/explore?q=${encodeURIComponent(catSearch)}`);
  };

  return (
    <div className="home">
      {/* ======== HERO ======== */}
      <section className="hero">
        <div
          className={`hero-bg ${heroLoaded ? 'loaded' : ''}`}
          style={{ backgroundImage: `url('${HERO_IMAGE}')` }}
          aria-hidden="true"
        />
        <div className="hero-overlay" aria-hidden="true" />

        <div className="hero-content container">
          <div className="hero-text fade-in">
            {user ? (
              <div className="hero-user-welcome">
                <span className="welcome-plane">✈️</span>
                <span>Welcome back, <strong>{user.name}</strong>! Where to next?</span>
              </div>
            ) : (
              <span className="hero-label">
                <Compass size={14} /> Smart Global Tour Planner
              </span>
            )}
            <h1 className="hero-title">
              The World Is<br />
              <em>Waiting for You.</em>
            </h1>
            <p className="hero-subtitle fade-in fade-in-2">
              Discover authentic attractions, plan cluster-optimized itineraries anywhere on Earth, and turn your next dream journey into reality.
            </p>
            <div className="hero-actions fade-in fade-in-3">
              <Link to="/plan" className="btn btn-primary btn-lg">
                Plan My Journey <ArrowRight size={18} />
              </Link>
              <Link to="/explore" className="btn btn-ghost btn-lg">
                Explore Destinations
              </Link>
            </div>
            <div className="hero-stats fade-in fade-in-4">
              <StatItem value="190+" label="Countries Supported" />
              <div className="hero-stat-divider" />
              <StatItem value="Real" label="OSM & Wiki Data" />
              <div className="hero-stat-divider" />
              <StatItem value="Free" label="Forever" />
            </div>
          </div>
        </div>

        {/* Global Search Panel */}
        <div className="hero-search-wrap fade-in fade-in-4">
          <div className="container">
            <div className="hero-search-panel">
              <form className="hero-search" onSubmit={handleHeroSearch}>
                <div className="hero-search-field">
                  <label htmlFor="hero-dest"><MapPin size={16} /> Destination</label>
                  <input
                    id="hero-dest"
                    type="text"
                    className="hero-search-text-input"
                    placeholder="Where to? (e.g. Paris, Tokyo, Bali, Rome…)"
                    value={destInput}
                    onChange={e => setDestInput(e.target.value)}
                  />
                </div>

                <div className="hero-search-divider" aria-hidden="true" />

                <div className="hero-search-field">
                  <label htmlFor="hero-date"><Calendar size={16} /> Travel Date</label>
                  <input
                    id="hero-date"
                    type="date"
                    value={travelDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setTravelDate(e.target.value)}
                  />
                </div>

                <div className="hero-search-divider" aria-hidden="true" />

                <div className="hero-search-field">
                  <label htmlFor="hero-travelers"><Users size={16} /> Travelers</label>
                  <select
                    id="hero-travelers"
                    value={travelers}
                    onChange={e => setTravelers(e.target.value)}
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'Traveler' : 'Travelers'}
                      </option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="hero-search-btn btn btn-primary">
                  <Search size={18} /> Plan Journey
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ======== CATEGORY CHIPS ======== */}
      <section className="home-categories-section">
        <div className="container">
          <div className="home-cat-wrap">
            <span className="home-cat-label">Explore by category:</span>
            <div className="home-cat-chips">
              {TRAVEL_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className="home-cat-chip"
                  onClick={() => handleCategoryClick(cat.search)}
                >
                  <span className="cat-chip-icon">{cat.icon}</span>
                  <span className="cat-chip-text">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ======== POPULAR DESTINATIONS ======== */}
      <section className="section section-destinations" ref={destRef}>
        <div className="container">
          <div className={`section-header ${destVisible ? 'fade-in' : ''}`}>
            <span className="section-label">Popular Worldwide Destinations</span>
            <h2 className="section-title">Inspiration for Your Next Escape</h2>
            <p className="section-subtitle">
              From historic European capitals to tropical islands and mist-clad hills — click to discover real attractions and craft your itinerary.
            </p>
          </div>

          <div className="dest-grid">
            {POPULAR_GLOBAL_DESTINATIONS.slice(0, 6).map((dest, i) => (
              <DestinationCard
                key={dest.id}
                dest={dest}
                index={i}
                onSelect={() => navigate(`/explore?q=${encodeURIComponent(dest.name)}`)}
              />
            ))}
          </div>

          <div className="dest-cta">
            <Link to="/explore" className="btn btn-outline btn-lg">
              Explore All Destinations <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ======== WHY CHOOSE TRIPPILOT ======== */}
      <section className="section bg-forest why-section" ref={whyRef}>
        <div className="container">
          <div className={`section-header ${whyVisible ? 'fade-in' : ''}`} style={{ color: 'var(--color-cream)' }}>
            <span className="section-label">Intelligent Travel</span>
            <h2 className="section-title" style={{ color: 'var(--color-cream)' }}>Why Travelers Trust TripPilot</h2>
            <p className="section-subtitle" style={{ color: 'rgba(247,244,236,0.75)' }}>
              Built from the ground up to eliminate travel stress through geographic clustering, real OpenStreetMap verification, and honest pricing.
            </p>
          </div>

          <div className="why-grid">
            <div className="why-card">
              <div className="why-icon-wrap"><Globe size={28} /></div>
              <h3>Global Scope, Any Destination</h3>
              <p>Not confined to a single state or country. Plan itineraries in Paris, Tokyo, Bali, New York, or anywhere your heart desires.</p>
            </div>

            <div className="why-card">
              <div className="why-icon-wrap"><Map size={28} /></div>
              <h3>Geographic Distance Clustering</h3>
              <p>Stops within each day are clustered by Haversine distance so you spend time exploring, never stuck in cross-city traffic.</p>
            </div>

            <div className="why-card">
              <div className="why-icon-wrap"><DollarSign size={28} /></div>
              <h3>Transparent Cost Breakdown</h3>
              <p>Detailed estimates across accommodation, dining, activities, and transport in your chosen currency, clearly marked as estimates.</p>
            </div>

            <div className="why-card">
              <div className="why-icon-wrap"><ShieldCheck size={28} /></div>
              <h3>Verified Real Data</h3>
              <p>Attractions, photos, coordinates, and opening hours sourced directly from OpenStreetMap and Wikipedia contributors.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ======== HOW IT WORKS ======== */}
      <section className="section section-how" ref={howRef}>
        <div className="container">
          <div className={`section-header ${howVisible ? 'fade-in' : ''}`}>
            <span className="section-label">Simple 3-Step Process</span>
            <h2 className="section-title">How TripPilot Works</h2>
            <p className="section-subtitle">
              From choosing your dream destination to saving your personalized route in seconds.
            </p>
          </div>

          <div className="how-steps-grid">
            <div className="how-step-card">
              <span className="how-step-num">01</span>
              <h3>Choose Any Destination</h3>
              <p>Type any city or region across the world. Our global autocomplete finds exact coordinates and verified attractions.</p>
            </div>

            <div className="how-step-card">
              <span className="how-step-num">02</span>
              <h3>Set Dates & Style</h3>
              <p>Select your dates, travel party size, budget with your preferred currency, and specific interest tags like Nature, Food, or Culture.</p>
            </div>

            <div className="how-step-card">
              <span className="how-step-num">03</span>
              <h3>Interactive Map & Plan</h3>
              <p>Receive an optimized day-by-day plan with numbered map routes, travel times, opening hours, and budget breakdown. Save or print anytime.</p>
            </div>
          </div>

          <div className="how-cta-wrap">
            <Link to="/plan" className="btn btn-primary btn-lg">
              <Sparkles size={18} /> Start Planning Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

/* Destination Card Component */
const DestinationCard = ({ dest, index, onSelect }) => {
  const [imgError, setImgError] = useState(false);
  return (
    <article
      className={`dest-card fade-in fade-in-${Math.min(index + 1, 5)}`}
      onClick={onSelect}
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect()}
      role="button"
      aria-label={`Explore ${dest.name}`}
    >
      <div className="dest-card-image-wrap">
        <img
          src={imgError ? FALLBACK_IMAGE : (dest.image || FALLBACK_IMAGE)}
          alt={`${dest.name} — ${dest.country || dest.region}`}
          className="dest-card-image"
          loading="lazy"
          onError={() => setImgError(true)}
        />
        <div className="dest-card-overlay" />
        <span className="dest-card-tag tag tag-gold">{dest.country || dest.category}</span>
      </div>
      <div className="dest-card-body">
        <div className="dest-card-meta">
          <span className="dest-card-region">
            <MapPin size={13} /> {dest.region}, {dest.country}
          </span>
          <span className="dest-card-duration">{dest.duration}</span>
        </div>
        <h3 className="dest-card-name">{dest.name}</h3>
        <p className="dest-card-desc">{dest.description}</p>
        <span className="dest-card-link">
          Explore Attractions <ArrowRight size={15} />
        </span>
      </div>
    </article>
  );
};

const StatItem = ({ value, label }) => (
  <div className="hero-stat">
    <span className="hero-stat-value">{value}</span>
    <span className="hero-stat-label">{label}</span>
  </div>
);

export default Home;
