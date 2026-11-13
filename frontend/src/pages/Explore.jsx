import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, MapPin, ArrowRight, X, ExternalLink, Sparkles, AlertCircle,
  Clock, Compass, Globe, Info, RefreshCw
} from 'lucide-react';
import {
  POPULAR_GLOBAL_DESTINATIONS, DESTINATIONS, FALLBACK_IMAGE
} from '../utils/destinationData';
import { discoverDestination, suggestDiscoverLocations } from '../utils/api';
import './Explore.css';

const QUICK_DESTINATIONS = [
  'Paris', 'Tokyo', 'Bali', 'Rome', 'Dubai', 'Munnar', 'New York', 'Santorini', 'Cairo', 'Sydney'
];

const Explore = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialQuery = searchParams.get('q') || searchParams.get('destination') || searchParams.get('discover') || '';

  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState([]);
  const [suggesting, setSuggesting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [imgErrors, setImgErrors] = useState({});

  const searchTimer = useRef(null);
  const abortControllerRef = useRef(null);

  // Run discovery for a destination
  const handleSearch = useCallback(async (destinationName) => {
    const term = (destinationName || query).trim();
    if (!term || term.length < 2) {
      setError('Please enter a destination name (at least 2 characters).');
      return;
    }

    setShowSuggestions(false);
    setLoading(true);
    setError('');
    setActiveQuery(term);
    setActiveCategory('All');
    setSelectedSpot(null);
    setSearchParams({ q: term });

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await discoverDestination(term, controller.signal);
      if (!controller.signal.aborted) {
        setResult(res.data);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setResult(null);
        setError(
          err.message ||
          'Could not find travel information for this destination. Please try another place or check your spelling.'
        );
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [query, setSearchParams]);

  // Initial load if query parameter present
  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery, handleSearch]);

  // Autocomplete debounce
  useEffect(() => {
    const val = query.trim();
    if (val.length < 2 || val === activeQuery) {
      setSuggestions([]);
      setSuggesting(false);
      return;
    }

    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSuggesting(true);
      try {
        const res = await suggestDiscoverLocations(val);
        setSuggestions(res.data || []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggesting(false);
      }
    }, 300);

    return () => clearTimeout(searchTimer.current);
  }, [query, activeQuery]);

  const handleSelectSuggestion = (sug) => {
    setQuery(sug.name);
    setShowSuggestions(false);
    handleSearch(sug.name);
  };

  const handleSelectQuick = (dest) => {
    setQuery(dest);
    handleSearch(dest);
  };

  const handleImgError = (id) => {
    setImgErrors(p => ({ ...p, [id]: true }));
  };

  const handlePlanTrip = (destinationPlace) => {
    const params = new URLSearchParams();
    if (destinationPlace?.name) params.set('destination', destinationPlace.name);
    if (destinationPlace?.country) params.set('country', destinationPlace.country);
    if (destinationPlace?.lat) params.set('lat', destinationPlace.lat);
    if (destinationPlace?.lng) params.set('lng', destinationPlace.lng);
    navigate(`/plan?${params.toString()}`);
  };

  // Derive categories from returned spots
  const spots = result?.spots || [];
  const categories = useMemo(() => {
    const set = new Set();
    spots.forEach(s => {
      if (s.category) set.add(s.category);
    });
    return ['All', ...Array.from(set)];
  }, [spots]);

  // Filter spots by category
  const filteredSpots = useMemo(() => {
    if (activeCategory === 'All') return spots;
    return spots.filter(s => s.category?.toLowerCase() === activeCategory.toLowerCase());
  }, [spots, activeCategory]);

  const place = result?.place;

  return (
    <div className="explore-page">
      {/* Page Hero */}
      <section className="page-hero explore-hero">
        <div className="explore-hero-bg" aria-hidden="true" />
        <div className="explore-hero-overlay" aria-hidden="true" />
        <div className="container page-hero-content">
          <p className="page-hero-label">Worldwide Travel Directory</p>
          <h1 className="page-hero-title">Discover Any Destination</h1>
          <p className="page-hero-desc">
            Explore authentic attractions, museums, viewpoints, and cultural treasures around the world, powered by OpenStreetMap and Wikipedia.
          </p>
        </div>
      </section>

      {/* Global Search Bar & Quick Picks */}
      <section className="explore-search-section">
        <div className="container">
          <div className="explore-search-box-wrap">
            <form
              className="explore-search-form"
              onSubmit={e => {
                e.preventDefault();
                handleSearch();
              }}
            >
              <div className="explore-search-input-wrap">
                <Search size={20} className="explore-search-icon" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="Search any destination in the world (e.g. Paris, Tokyo, Bali, Munnar, Rome)…"
                  className="explore-search-input"
                  aria-label="Search destinations"
                  autoComplete="off"
                />
                {query && (
                  <button
                    type="button"
                    className="explore-search-clear"
                    onClick={() => {
                      setQuery('');
                      setSuggestions([]);
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <button type="submit" className="btn btn-primary explore-submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner" style={{ width: 16, height: 16 }} /> Searching…
                  </>
                ) : (
                  <>
                    <Compass size={16} /> Explore
                  </>
                )}
              </button>
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <ul className="explore-suggestions-menu">
                {suggestions.map((sug, i) => (
                  <li
                    key={i}
                    className="explore-suggestion-item"
                    onClick={() => handleSelectSuggestion(sug)}
                  >
                    <MapPin size={15} color="var(--color-forest)" />
                    <div>
                      <strong>{sug.name}</strong>
                      {(sug.region || sug.country) && (
                        <span className="explore-sug-country">
                          {[sug.region, sug.country].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick Destination Pills */}
          <div className="explore-quick-picks">
            <span className="quick-picks-label">Popular Destinations:</span>
            <div className="quick-picks-list">
              {QUICK_DESTINATIONS.map(city => (
                <button
                  key={city}
                  type="button"
                  className={`quick-pick-pill ${activeQuery.toLowerCase() === city.toLowerCase() ? 'active' : ''}`}
                  onClick={() => handleSelectQuick(city)}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Results / Showcase */}
      <section className="section explore-content-section">
        <div className="container">

          {/* Error Banner */}
          {error && (
            <div className="error-banner" style={{ marginBottom: '2.5rem' }}>
              <AlertCircle size={20} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>{error}</div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => handleSearch(activeQuery)}
                disabled={loading}
              >
                <RefreshCw size={13} /> Retry
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="explore-loading-grid">
              <div className="explore-skeleton-banner skeleton" style={{ height: 260, marginBottom: '2rem' }} />
              <div className="explore-grid">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <div key={n} className="explore-skeleton-card skeleton" style={{ height: 320 }} />
                ))}
              </div>
            </div>
          )}

          {/* Destination Results View */}
          {!loading && result && place && (
            <div className="fade-in">
              {/* Destination Header Showcase */}
              <div className="dest-showcase-card">
                <div className="dest-showcase-bg-wrap">
                  <img
                    src={imgErrors.destCover ? FALLBACK_IMAGE : (place.image || FALLBACK_IMAGE)}
                    alt={place.name}
                    className="dest-showcase-img"
                    onError={() => handleImgError('destCover')}
                  />
                  <div className="dest-showcase-overlay" />
                </div>

                <div className="dest-showcase-content">
                  <div className="dest-showcase-badge">
                    <Globe size={14} /> Destination Verified
                  </div>
                  <h2 className="dest-showcase-title">{place.name}</h2>
                  {place.country && (
                    <p className="dest-showcase-country">
                      <MapPin size={16} /> {place.country}
                    </p>
                  )}
                  {place.summary && (
                    <p className="dest-showcase-summary">{place.summary}</p>
                  )}

                  <div className="dest-showcase-actions">
                    <button
                      className="btn btn-primary btn-lg dest-plan-btn"
                      onClick={() => handlePlanTrip(place)}
                    >
                      <Sparkles size={18} /> Plan a Trip to {place.name}
                    </button>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost dest-map-btn"
                    >
                      <ExternalLink size={16} /> Open on Maps
                    </a>
                  </div>
                </div>
              </div>

              {/* Dynamic Category Filters */}
              {categories.length > 1 && (
                <div className="explore-category-filter-bar">
                  <span className="cat-filter-label">Filter by type:</span>
                  <div className="cat-filter-pills">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        className={`cat-pill ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Attractions Grid */}
              <div className="explore-results-heading-row">
                <h3 className="explore-spots-title">
                  Prominent Attractions in {place.name}
                </h3>
                <span className="explore-spots-count">
                  Showing <strong>{filteredSpots.length}</strong> of {spots.length} places
                </span>
              </div>

              {filteredSpots.length === 0 ? (
                <div className="explore-empty">
                  <span>🏛️</span>
                  <h3>No places found in this category</h3>
                  <button className="btn btn-outline" onClick={() => setActiveCategory('All')}>
                    Show All Places
                  </button>
                </div>
              ) : (
                <div className="explore-grid">
                  {filteredSpots.map(spot => {
                    const spotImg = imgErrors[spot.id]
                      ? FALLBACK_IMAGE
                      : (spot.image || place.image || FALLBACK_IMAGE);
                    return (
                      <article
                        key={spot.id}
                        className="explore-spot-card"
                        onClick={() => setSelectedSpot(spot)}
                        tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && setSelectedSpot(spot)}
                        role="button"
                        aria-label={`View details for ${spot.name}`}
                      >
                        <div className="explore-spot-img-wrap">
                          <img
                            src={spotImg}
                            alt={spot.name}
                            className="explore-spot-img"
                            loading="lazy"
                            onError={() => handleImgError(spot.id)}
                          />
                          <div className="explore-spot-overlay" />
                          {spot.category && (
                            <span className="explore-spot-tag">{spot.category}</span>
                          )}
                          {spot.distanceKm > 0 && (
                            <span className="explore-spot-dist">
                              {spot.distanceKm} km from center
                            </span>
                          )}
                        </div>

                        <div className="explore-spot-body">
                          <h4 className="explore-spot-name">{spot.name}</h4>
                          <p className="explore-spot-desc">
                            {spot.description
                              ? (spot.description.length > 120
                                  ? spot.description.substring(0, 120) + '…'
                                  : spot.description)
                              : `Renowned attraction located in ${place.name}.`}
                          </p>

                          <div className="explore-spot-footer">
                            <span className="explore-spot-more">
                              View Details <ArrowRight size={14} />
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {/* Data Attribution */}
              <div className="explore-attribution-footer">
                <Info size={14} />
                <span>
                  Attraction data provided via OpenStreetMap contributors & Wikipedia GeoSearch. Photos via Wikimedia Commons.
                </span>
              </div>
            </div>
          )}

          {/* Inspiration Section: shown when no query searched yet */}
          {!loading && !result && !error && (
            <div className="explore-initial-state fade-in">
              <div className="explore-inspiration-header">
                <span className="tag tag-gold">Global Inspiration</span>
                <h2 className="explore-inspiration-title">World's Most Beloved Destinations</h2>
                <p className="explore-inspiration-subtitle">
                  Click any destination below to inspect real attractions, or search any city in the search bar above.
                </p>
              </div>

              <div className="explore-grid">
                {POPULAR_GLOBAL_DESTINATIONS.map(d => (
                  <article
                    key={d.id}
                    className="explore-card"
                    onClick={() => {
                      setQuery(d.name);
                      handleSearch(d.name);
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="explore-card-img-wrap">
                      <img
                        src={imgErrors[d.id] ? FALLBACK_IMAGE : (d.image || FALLBACK_IMAGE)}
                        alt={d.name}
                        className="explore-card-img"
                        loading="lazy"
                        onError={() => handleImgError(d.id)}
                      />
                      <div className="explore-card-img-overlay" />
                      <span className="explore-card-cat">{d.category}</span>
                      <span className="explore-card-duration">{d.duration}</span>
                    </div>

                    <div className="explore-card-body">
                      <div className="explore-card-region">
                        <MapPin size={13} /> {d.region}, {d.country}
                      </div>
                      <h3 className="explore-card-name">{d.name}</h3>
                      <p className="explore-card-tagline">{d.tagline}</p>
                      <p className="explore-card-desc">{d.description}</p>
                      <div className="explore-card-footer">
                        <span className="explore-card-link">
                          Explore Places <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* Spot Details Modal */}
      {selectedSpot && (
        <div className="modal-overlay" onClick={() => setSelectedSpot(null)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedSpot(null)}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            <div className="modal-hero">
              <img
                src={
                  imgErrors[selectedSpot.id]
                    ? FALLBACK_IMAGE
                    : (selectedSpot.image || place?.image || FALLBACK_IMAGE)
                }
                alt={selectedSpot.name}
                className="modal-hero-img"
                onError={() => handleImgError(selectedSpot.id)}
              />
              <div className="modal-hero-overlay" />
              <div className="modal-hero-content">
                {selectedSpot.category && (
                  <span className="tag tag-gold" style={{ marginBottom: '0.4rem', display: 'inline-block' }}>
                    {selectedSpot.category}
                  </span>
                )}
                <h3 className="modal-title">{selectedSpot.name}</h3>
                {place?.name && (
                  <span className="modal-dest-region">
                    <MapPin size={14} /> {place.name}{place.country ? `, ${place.country}` : ''}
                  </span>
                )}
              </div>
            </div>

            <div className="modal-body">
              <div className="modal-meta">
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Distance</span>
                  <span className="modal-meta-value">
                    {selectedSpot.distanceKm > 0 ? `${selectedSpot.distanceKm} km from center` : 'Central location'}
                  </span>
                </div>
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Coordinates</span>
                  <span className="modal-meta-value">
                    {selectedSpot.lat.toFixed(4)}, {selectedSpot.lng.toFixed(4)}
                  </span>
                </div>
              </div>

              {selectedSpot.address && (
                <p className="modal-address" style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                  📍 <strong>Address:</strong> {selectedSpot.address}
                </p>
              )}

              {selectedSpot.openingHours && (
                <p className="modal-hours" style={{ fontSize: '0.85rem', color: 'var(--color-forest)', marginBottom: '1rem' }}>
                  🕒 <strong>Opening Hours:</strong> {selectedSpot.openingHours}
                </p>
              )}

              <p className="modal-desc">
                {selectedSpot.description ||
                  `A notable point of interest in ${place?.name || 'this destination'}. Visit to experience local heritage, architecture, and scenery.`}
              </p>

              <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setSelectedSpot(null);
                    handlePlanTrip(place);
                  }}
                >
                  <Sparkles size={16} /> Plan Trip to {place?.name}
                </button>

                {selectedSpot.wikipediaUrl && (
                  <a
                    href={selectedSpot.wikipediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                  >
                    <ExternalLink size={15} /> Wikipedia Article
                  </a>
                )}

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${selectedSpot.lat},${selectedSpot.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                >
                  <MapPin size={15} /> View on Map
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Explore;
