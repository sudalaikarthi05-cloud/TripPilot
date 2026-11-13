import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ExternalLink, LoaderCircle, MapPin, Search, X } from 'lucide-react';
import { discoverDestination, suggestDiscoverLocations } from '../utils/api';
import './GlobalDiscoverSearch.css';

const BASE_CATEGORIES = ['Beach', 'Temple', 'Museum', 'Waterfall', 'Park', 'Historic', 'Viewpoint'];
const DISCOVERY_CATEGORIES = new Set(BASE_CATEGORIES);

const formatSuggestion = suggestion =>
  [suggestion.name, suggestion.region, suggestion.country]
    .filter((part, index, parts) => part && parts.indexOf(part) === index)
    .join(', ');

const GlobalDiscoverSearch = ({ initialQuery = '', redirectOnSearch = false }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState([]);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [unavailableImages, setUnavailableImages] = useState({});
  const searchController = useRef(null);
  const searchAbortTimer = useRef(null);
  const lastInitialQuery = useRef('');

  const runDiscovery = useCallback(async value => {
    const searchTerm = value.trim();
    if (searchTerm.length < 2) {
      setError(true);
      setResult(null);
      return;
    }

    searchController.current?.abort();
    const controller = new AbortController();
    searchController.current = controller;
    setQuery(value);
    setSuggestions([]);
    setSuggestionError(false);
    setResult(null);
    setSelectedSpot(null);
    setUnavailableImages({});
    setActiveCategory('All');
    setLoading(true);
    setError(false);

    try {
      const response = await discoverDestination(searchTerm, controller.signal);
      if (!controller.signal.aborted) setResult(response.data);
    } catch {
      if (!controller.signal.aborted) setError(true);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) {
      setSuggestions([]);
      setSuggesting(false);
      setSuggestionError(false);
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSuggesting(true);
      setSuggestionError(false);
      try {
        const response = await suggestDiscoverLocations(value, controller.signal);
        if (!controller.signal.aborted) setSuggestions(response.data);
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([]);
          setSuggestionError(true);
        }
      } finally {
        if (!controller.signal.aborted) setSuggesting(false);
      }
    }, 400);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, redirectOnSearch]);

  useEffect(() => {
    const value = initialQuery.trim();
    if (!value || value === lastInitialQuery.current) return;
    lastInitialQuery.current = value;
    setQuery(value);
    runDiscovery(value);
  }, [initialQuery, runDiscovery]);

  useEffect(() => {
    window.clearTimeout(searchAbortTimer.current);
    return () => {
      searchAbortTimer.current = window.setTimeout(() => searchController.current?.abort(), 0);
    };
  }, []);

  const categories = useMemo(() => {
    const available = [...new Set((result?.spots || [])
      .map(spot => spot.category)
      .filter(Boolean))];
    const otherCategories = available.filter(category => !DISCOVERY_CATEGORIES.has(category));
    return ['All', ...BASE_CATEGORIES, ...otherCategories];
  }, [result]);

  const filteredSpots = useMemo(() => {
    const spots = result?.spots || [];
    if (activeCategory === 'All') return spots;
    if (activeCategory === 'Other') {
      return spots.filter(spot => !DISCOVERY_CATEGORIES.has(spot.category));
    }
    return spots.filter(spot => spot.category === activeCategory);
  }, [activeCategory, result]);

  const handleSubmit = event => {
    event.preventDefault();
    const searchTerm = query.trim();
    if (searchTerm.length < 2) {
      setError(true);
      return;
    }
    if (redirectOnSearch) {
      navigate(`/explore?discover=${encodeURIComponent(searchTerm)}`);
      return;
    }
    runDiscovery(searchTerm);
  };

  const handleSuggestionSelect = suggestion => {
    setQuery(formatSuggestion(suggestion));
    setSuggestions([]);
  };

  const handlePlanTrip = () => {
    const params = new URLSearchParams({ destination: result.place.name });
    navigate(`/plan?${params.toString()}`);
  };

  return (
    <section className={`global-discover${redirectOnSearch ? ' global-discover--hero' : ''}`}>
      <div className="global-discover-heading">
        <span className="global-discover-eyebrow">Explore anywhere</span>
        <h2>Describe Your Destination</h2>
        {!redirectOnSearch && (
          <p>Discover real attractions and place information from around the world.</p>
        )}
      </div>

      <div className="global-discover-search-wrap">
        <form className="global-discover-form" onSubmit={handleSubmit}>
          <div className="global-discover-input-wrap">
            <Search size={19} aria-hidden="true" />
            <input
              type="search"
              value={query}
              aria-label="Describe Your Destination"
              onChange={event => {
                setQuery(event.target.value);
                setError(false);
                setSuggestions([]);
                searchController.current?.abort();
                setLoading(false);
                setResult(null);
              }}
              onKeyDown={event => {
                if (event.key === 'Escape') setSuggestions([]);
              }}
              placeholder="Enter any place in the world... e.g. Paris, Tokyo, beaches near Goa"
              autoComplete="off"
              aria-autocomplete="list"
              aria-expanded={suggestions.length > 0}
              aria-controls="global-discover-suggestions"
            />
            {suggesting && <LoaderCircle size={18} className="global-discover-spinner" aria-label="Searching" />}
            {query && (
              <button
                type="button"
                className="global-discover-clear"
                onClick={() => {
                  setQuery('');
                  setSuggestions([]);
                  setResult(null);
                  setError(false);
                  searchController.current?.abort();
                  setLoading(false);
                }}
                aria-label="Clear destination"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button type="submit" className="btn btn-primary global-discover-submit" disabled={loading}>
            {loading ? <LoaderCircle size={18} className="global-discover-spinner" /> : <Search size={18} />}
            <span>{loading ? 'Searching' : 'Search'}</span>
          </button>
        </form>

        {suggestions.length > 0 && (
          <div className="global-discover-suggestions" id="global-discover-suggestions" role="listbox" aria-label="Location suggestions">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${formatSuggestion(suggestion)}-${index}`}
                type="button"
                role="option"
                aria-selected="false"
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                <MapPin size={17} aria-hidden="true" />
                <span>
                  <strong>{suggestion.name}</strong>
                  <small>{[suggestion.region, suggestion.country].filter(Boolean).join(', ')}</small>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {suggestionError && (
        <p className="global-discover-note">Location suggestions are temporarily unavailable. You can still search your destination.</p>
      )}
      {error && (
        <div className="global-discover-message global-discover-error" role="alert">
          <AlertCircle size={18} />
          <span>We couldn’t complete that search. Check the place name and try again.</span>
          {!redirectOnSearch && (
            <button type="button" className="btn btn-outline btn-sm" onClick={() => runDiscovery(query)}>
              Retry
            </button>
          )}
        </div>
      )}

      {loading && (
        <div className="global-discover-message" role="status">
          <LoaderCircle size={20} className="global-discover-spinner" />
          <span>Finding real places around {query.trim()}…</span>
        </div>
      )}

      {result && (
        <div className="global-discover-results" aria-live="polite">
          <div className="global-discover-place">
            <div className="global-discover-place-copy">
              <span className="global-discover-eyebrow">Destination found</span>
              <h3>{result.place.name}{result.place.country ? `, ${result.place.country}` : ''}</h3>
              {result.place.summary && <p>{result.place.summary}</p>}
            </div>
            <a
              className="global-discover-map-link"
              href={`https://www.google.com/maps/search/?api=1&query=${result.place.lat},${result.place.lng}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open map <ExternalLink size={15} />
            </a>
          </div>

          <div className="global-discover-attribution">
            Location data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>
            {' · Place articles and photos © '}
            <a href="https://www.wikimedia.org/" target="_blank" rel="noopener noreferrer">Wikimedia contributors</a>
          </div>

          {result.spots?.length > 0 ? (
            <>
              <div className="global-discover-results-heading">
                <h3>Places to explore</h3>
                <span>{filteredSpots.length} {filteredSpots.length === 1 ? 'place' : 'places'}</span>
              </div>
              <div className="global-discover-filters" role="group" aria-label="Filter attractions by category">
                {categories.map(category => (
                  <button
                    key={category}
                    type="button"
                    className={activeCategory === category ? 'active' : ''}
                    aria-pressed={activeCategory === category}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </button>
                ))}
                {categories.length > BASE_CATEGORIES.length + 1 && (
                  <button
                    type="button"
                    className={activeCategory === 'Other' ? 'active' : ''}
                    aria-pressed={activeCategory === 'Other'}
                    onClick={() => setActiveCategory('Other')}
                  >
                    Other
                  </button>
                )}
              </div>

              {filteredSpots.length > 0 ? (
                <div className="global-discover-grid">
                  {filteredSpots.map(spot => (
                    <button
                      type="button"
                      key={spot.id}
                      className="global-discover-card"
                      onClick={() => setSelectedSpot(spot)}
                      aria-label={`View ${spot.name}, ${spot.category}`}
                    >
                      <span className="global-discover-card-image">
                        {spot.image && !unavailableImages[spot.id] ? (
                          <img
                            src={spot.image}
                            alt={`${spot.name}, ${result.place.name}`}
                            loading="lazy"
                            onError={() => setUnavailableImages(current => ({ ...current, [spot.id]: true }))}
                          />
                        ) : (
                          <span className="global-discover-placeholder" aria-label="No verified photo available">
                            <MapPin size={24} />
                            <small>No verified photo</small>
                          </span>
                        )}
                        <span className="global-discover-category">{spot.category || 'Attraction'}</span>
                      </span>
                      <span className="global-discover-card-copy">
                        <strong>{spot.name}</strong>
                        <span>{spot.description || 'No description available from our sources.'}</span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="global-discover-message">
                  No attractions in this category. Choose another filter to see more places.
                </div>
              )}
            </>
          ) : (
            <div className="global-discover-message">
              No nearby attractions were found for this location. Try a nearby city or a broader search.
            </div>
          )}
        </div>
      )}

      {selectedSpot && result && (
        <SpotModal
          spot={selectedSpot}
          place={result.place}
          imageUnavailable={unavailableImages[selectedSpot.id]}
          onImageError={() => setUnavailableImages(current => ({ ...current, [selectedSpot.id]: true }))}
          onClose={() => setSelectedSpot(null)}
          onPlan={handlePlanTrip}
        />
      )}
    </section>
  );
};

const SpotModal = ({ spot, place, imageUnavailable, onImageError, onClose, onPlan }) => {
  useEffect(() => {
    const handleKeyDown = event => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="global-discover-modal-backdrop" onClick={onClose}>
      <section
        className="global-discover-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="global-discover-modal-title"
        onClick={event => event.stopPropagation()}
      >
        <button type="button" className="global-discover-modal-close" onClick={onClose} aria-label="Close place details">
          <X size={20} />
        </button>
        <div className="global-discover-modal-image">
          {spot.image && !imageUnavailable ? (
            <img src={spot.image} alt={`${spot.name}, ${place.name}`} onError={onImageError} />
          ) : (
            <span className="global-discover-placeholder"><MapPin size={30} /><small>No verified photo available</small></span>
          )}
        </div>
        <div className="global-discover-modal-body">
          <span className="global-discover-category-label">{spot.category || 'Attraction'}</span>
          <h2 id="global-discover-modal-title">{spot.name}</h2>
          <p>{spot.description || 'No description is available from our sources for this place.'}</p>
          <p className="global-discover-distance">
            {Number.isFinite(spot.distanceKm) ? `${spot.distanceKm} km from ${place.name} center` : `Near ${place.name}`}
          </p>
          <div className="global-discover-modal-actions">
            <a
              className="btn btn-outline"
              href={`https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in Google Maps <ExternalLink size={15} />
            </a>
            <button type="button" className="btn btn-primary" onClick={onPlan}>
              Plan a trip here
            </button>
          </div>
          {spot.wikipediaUrl && (
            <a className="global-discover-wikipedia" href={spot.wikipediaUrl} target="_blank" rel="noopener noreferrer">
              Read the Wikipedia article <ExternalLink size={14} />
            </a>
          )}
        </div>
      </section>
    </div>
  );
};

export default GlobalDiscoverSearch;
