import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Calendar, Users, Wallet, ChevronDown, ChevronUp, Clock,
  Bookmark, Edit3, ArrowLeft, Printer, Check, AlertCircle, Sparkles,
  Info, ExternalLink, Navigation, CheckCircle2
} from 'lucide-react';
import { CURRENCIES, FALLBACK_IMAGE } from '../utils/destinationData';
import { getTripById, saveTrip, updateTrip } from '../utils/api';
import ItineraryMap from '../components/ItineraryMap';
import './Itinerary.css';

const Itinerary = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [itinerary, setItinerary] = useState(state?.itinerary || null);
  const [loading, setLoading] = useState(!state?.itinerary);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const [saveError, setSaveError] = useState('');
  const [savedTripId, setSavedTripId] = useState(id !== 'preview' ? id : null);
  const [expandedDays, setExpandedDays] = useState({ 1: true });
  const [selectedMapDay, setSelectedMapDay] = useState(null); // null = All days
  const [imgErrors, setImgErrors] = useState({});

  useEffect(() => {
    // If state passed an updatedToast notice, show saved
    if (state?.updatedToast) {
      setSaveStatus('saved');
    }

    if (itinerary) {
      setLoading(false);
      return;
    }

    const loadTrip = async () => {
      setLoading(true);
      setError('');
      if (id && id !== 'preview') {
        try {
          const res = await getTripById(id);
          setItinerary(res.data);
          setSavedTripId(res.data.id || res.data._id);
        } catch (err) {
          setError(
            'We could not find or load this itinerary. It may have been removed or the server is unavailable.'
          );
        }
      } else {
        setError('No itinerary data found. Please create a new itinerary from the trip planner.');
      }
      setLoading(false);
    };

    loadTrip();
  }, [id, state, itinerary]);

  // Set default expanded day
  useEffect(() => {
    if (itinerary?.days?.length > 0) {
      setExpandedDays(prev => ({ ...prev, 1: true }));
    }
  }, [itinerary]);

  const toggleDay = (dayNum) => {
    setExpandedDays(p => ({ ...p, [dayNum]: !p[dayNum] }));
  };

  const handleSave = async () => {
    if (!itinerary) return;
    setSaveStatus('saving');
    setSaveError('');
    try {
      const res = savedTripId
        ? await updateTrip(savedTripId, { ...itinerary, id: savedTripId })
        : await saveTrip(itinerary);
      const newId = res.data?.id || res.data?._id;
      if (newId) {
        setSavedTripId(newId);
      }
      setItinerary(res.data);
      setSaveStatus('saved');
    } catch (err) {
      setSaveError(err.message || 'Could not save this trip. Please try again.');
      setSaveStatus('error');
    }
  };

  const handleEditPreferences = () => {
    navigate('/plan', {
      state: {
        editTrip: {
          ...itinerary,
          id: savedTripId,
        },
      },
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleImgError = (key) => {
    setImgErrors(p => ({ ...p, [key]: true }));
  };

  // Loading skeleton state
  if (loading) {
    return (
      <div className="itinerary-page loading-page-wrap">
        <div className="container" style={{ padding: '4rem 1rem' }}>
          <div className="itin-skeleton-hero skeleton" />
          <div className="itin-skeleton-summary skeleton" style={{ margin: '2rem 0' }} />
          <div className="itin-layout">
            <div className="itin-timeline">
              <div className="itin-skeleton-card skeleton" style={{ height: 200, marginBottom: '1.5rem' }} />
              <div className="itin-skeleton-card skeleton" style={{ height: 200 }} />
            </div>
            <div className="itin-sidebar">
              <div className="itin-skeleton-card skeleton" style={{ height: 350 }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error / Trip Not Found state
  if (error || !itinerary) {
    return (
      <div className="itinerary-error loading-page container">
        <div className="itin-error-box">
          <AlertCircle size={54} color="var(--color-gold)" />
          <h2>Itinerary Not Available</h2>
          <p>{error || 'We could not load your trip details.'}</p>
          <div className="itin-error-actions">
            <Link to="/plan" className="btn btn-primary">
              <Sparkles size={16} /> Plan a New Trip
            </Link>
            <Link to="/explore" className="btn btn-outline">
              Explore Destinations
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const dest = itinerary.destination || {};
  const destName = itinerary.destinationName || dest.name || 'Your Destination';
  const destCountry = itinerary.destinationCountry || dest.country || dest.region || '';
  const coverImg = dest.image || FALLBACK_IMAGE;
  const currencyCode = itinerary.currency || 'USD';
  const currencySymbol = CURRENCIES.find(c => c.code === currencyCode)?.symbol || currencyCode;
  const totalBudget = itinerary.budget || itinerary.budgetINR || 0;
  const cost = itinerary.costBreakdown || null;

  const startDateFormatted = itinerary.startDate
    ? new Date(itinerary.startDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Flexible Dates';

  const endDateFormatted = itinerary.endDate
    ? new Date(itinerary.endDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const centerCoords = {
    lat: itinerary.destinationLat || dest.lat || (itinerary.days?.[0]?.activities?.[0]?.lat) || 0,
    lng: itinerary.destinationLng || dest.lng || (itinerary.days?.[0]?.activities?.[0]?.lng) || 0,
  };

  return (
    <div className="itinerary-page">
      {/* Hero Section */}
      <section className="itin-hero">
        <div
          className="itin-hero-bg"
          style={{ backgroundImage: `url('${imgErrors.hero ? FALLBACK_IMAGE : coverImg}')` }}
          aria-hidden="true"
        />
        <div className="itin-hero-overlay" aria-hidden="true" />
        <div className="itin-hero-content container">
          <div className="itin-hero-top-nav">
            <button className="itin-back-btn" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} /> Back
            </button>
            <span className="itin-hero-pill">
              <Sparkles size={13} /> AI-Curated World Itinerary
            </span>
          </div>

          <div className="itin-hero-text">
            <h1 className="itin-title">{destName}</h1>
            {destCountry && <p className="itin-location"><MapPin size={16} /> {destCountry}</p>}
            {dest.description && (
              <p className="itin-intro-extract">
                {dest.description.length > 280
                  ? dest.description.substring(0, 280) + '…'
                  : dest.description}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Summary Bar */}
      <section className="itin-summary-bar">
        <div className="container itin-summary-inner">
          <div className="itin-summary-col">
            <Calendar size={17} className="itin-summary-icon" />
            <div>
              <span className="itin-summary-label">Dates</span>
              <span className="itin-summary-val">
                {startDateFormatted} {endDateFormatted ? `– ${endDateFormatted}` : ''}
              </span>
            </div>
          </div>

          <div className="itin-summary-divider" aria-hidden="true" />

          <div className="itin-summary-col">
            <Clock size={17} className="itin-summary-icon" />
            <div>
              <span className="itin-summary-label">Duration</span>
              <span className="itin-summary-val">{itinerary.numDays} Days</span>
            </div>
          </div>

          <div className="itin-summary-divider" aria-hidden="true" />

          <div className="itin-summary-col">
            <Users size={17} className="itin-summary-icon" />
            <div>
              <span className="itin-summary-label">Travelers</span>
              <span className="itin-summary-val">{itinerary.numTravelers} Persons</span>
            </div>
          </div>

          <div className="itin-summary-divider" aria-hidden="true" />

          <div className="itin-summary-col">
            <Wallet size={17} className="itin-summary-icon" />
            <div>
              <span className="itin-summary-label">Budget (Estimated)</span>
              <span className="itin-summary-val">
                {currencySymbol}{Number(totalBudget).toLocaleString()} {currencyCode}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Action Bar */}
      <div className="itin-actions-bar">
        <div className="container itin-actions-inner">
          <div className="itin-action-left">
            <button className="btn btn-outline btn-sm" onClick={handleEditPreferences}>
              <Edit3 size={14} /> Edit Preferences
            </button>
            <button className="btn btn-outline btn-sm" onClick={handlePrint}>
              <Printer size={14} /> Print / Save PDF
            </button>
          </div>

          <div className="itin-action-right">
            {saveError && (
              <p className="itin-save-error" role="alert">
                {saveError}
              </p>
            )}
            {saveStatus === 'saved' ? (
              <div className="itin-saved-indicator">
                <CheckCircle2 size={16} color="var(--color-forest)" />
                <span>Saved to My Trips</span>
                <Link to="/trips" className="itin-view-saved-link">
                  View Collection &rarr;
                </Link>
              </div>
            ) : (
              <button
                className={`btn btn-sm ${saveStatus === 'saving' ? 'btn-outline' : 'btn-primary'}`}
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
              >
                {saveStatus === 'saving' ? (
                  <>
                    <span className="spinner" style={{ width: 14, height: 14 }} /> Saving Trip…
                  </>
                ) : saveStatus === 'error' ? (
                  <>
                    <AlertCircle size={14} /> Save Failed — Retry
                  </>
                ) : (
                  <>
                    <Bookmark size={14} /> Save Trip
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="itin-body container">
        <div className="itin-layout">

          {/* Timeline (Left Column) */}
          <main className="itin-timeline">
            <div className="itin-timeline-header">
              <h2 className="itin-section-heading">Daily Schedule & Highlights</h2>
              <span className="itin-section-sub">
                {itinerary.days?.length || 0} Days planned with real OpenStreetMap attractions & travel estimates
              </span>
            </div>

            {(itinerary.days || []).map(day => (
              <DaySection
                key={day.dayNumber}
                day={day}
                currencySymbol={currencySymbol}
                expanded={!!expandedDays[day.dayNumber]}
                onToggle={() => toggleDay(day.dayNumber)}
                onFocusMap={() => setSelectedMapDay(day.dayNumber)}
              />
            ))}
          </main>

          {/* Sidebar (Right Column) */}
          <aside className="itin-sidebar">

            {/* Interactive Leaflet Map Card */}
            <div className="itin-sidebar-card">
              <div className="itin-map-header">
                <h3 className="itin-sidebar-title">
                  <MapPin size={16} color="var(--color-forest)" /> Route Map
                </h3>
                <div className="itin-map-day-pills">
                  <button
                    className={`itin-map-pill ${selectedMapDay === null ? 'active' : ''}`}
                    onClick={() => setSelectedMapDay(null)}
                  >
                    All Days
                  </button>
                  {(itinerary.days || []).map(d => (
                    <button
                      key={d.dayNumber}
                      className={`itin-map-pill ${selectedMapDay === d.dayNumber ? 'active' : ''}`}
                      onClick={() => setSelectedMapDay(d.dayNumber)}
                    >
                      Day {d.dayNumber}
                    </button>
                  ))}
                </div>
              </div>

              <ItineraryMap
                days={itinerary.days || []}
                activeDay={selectedMapDay}
                center={centerCoords}
              />
            </div>

            {/* Estimated Cost Breakdown Card */}
            <div className="itin-sidebar-card">
              <div className="itin-cost-header">
                <h3 className="itin-sidebar-title">
                  <Wallet size={16} color="var(--color-gold)" /> Estimated Cost Breakdown
                </h3>
                <span className="tag tag-gold" style={{ fontSize: '0.7rem' }}>
                  Estimate
                </span>
              </div>

              {cost ? (
                <div className="itin-cost-content">
                  <div className="itin-cost-bar">
                    <div
                      className="itin-cost-segment seg-accom"
                      style={{ width: `${(cost.accommodation / (cost.totalEstimated || 1)) * 100}%` }}
                      title="Accommodation"
                    />
                    <div
                      className="itin-cost-segment seg-food"
                      style={{ width: `${(cost.food / (cost.totalEstimated || 1)) * 100}%` }}
                      title="Food & Dining"
                    />
                    <div
                      className="itin-cost-segment seg-trans"
                      style={{ width: `${(cost.transport / (cost.totalEstimated || 1)) * 100}%` }}
                      title="Local Transport"
                    />
                    <div
                      className="itin-cost-segment seg-act"
                      style={{ width: `${(cost.activities / (cost.totalEstimated || 1)) * 100}%` }}
                      title="Activities & Tickets"
                    />
                  </div>

                  <div className="itin-cost-rows">
                    <CostRow
                      label="🏨 Accommodation"
                      amount={`${currencySymbol}${Math.round(cost.accommodation).toLocaleString()}`}
                      pct={`${Math.round((cost.accommodation / cost.totalEstimated) * 100)}%`}
                    />
                    <CostRow
                      label="🍽️ Food & Dining"
                      amount={`${currencySymbol}${Math.round(cost.food).toLocaleString()}`}
                      pct={`${Math.round((cost.food / cost.totalEstimated) * 100)}%`}
                    />
                    <CostRow
                      label="🚕 Local Transport"
                      amount={`${currencySymbol}${Math.round(cost.transport).toLocaleString()}`}
                      pct={`${Math.round((cost.transport / cost.totalEstimated) * 100)}%`}
                    />
                    <CostRow
                      label="🎟️ Activities & Sights"
                      amount={`${currencySymbol}${Math.round(cost.activities).toLocaleString()}`}
                      pct={`${Math.round((cost.activities / cost.totalEstimated) * 100)}%`}
                    />

                    <div className="itin-cost-divider" />

                    <div className="itin-cost-total-row">
                      <span>Total Estimated Cost</span>
                      <strong>
                        {currencySymbol}{Math.round(cost.totalEstimated).toLocaleString()} {currencyCode}
                      </strong>
                    </div>

                    <div className="itin-budget-comparison">
                      <span className="itin-budget-user">
                        User Target Budget: {currencySymbol}{Number(totalBudget).toLocaleString()}
                      </span>
                      {cost.status === 'on_budget' ? (
                        <span className="tag tag-green">✓ Matches Your Budget</span>
                      ) : cost.status === 'under_budget' ? (
                        <span className="tag tag-green">✓ Under Budget</span>
                      ) : (
                        <span className="tag tag-gold">⚠️ Slightly Over Budget</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="itin-overview-items">
                  <div className="itin-cost-total-row">
                    <span>Daily Estimated Budget</span>
                    <strong>
                      {currencySymbol}{Math.round(totalBudget / (itinerary.numDays || 1)).toLocaleString()} / day
                    </strong>
                  </div>
                </div>
              )}

              <p className="itin-sidebar-note">
                * All costs and travel times are estimated approximations based on standard travel rates, seasonal averages, and distance calculations.
              </p>
            </div>

            {/* Travel Essentials Card */}
            <div className="itin-sidebar-card">
              <h3 className="itin-sidebar-title">
                <Info size={16} color="var(--color-forest)" /> Travel Essentials
              </h3>
              <ul className="itin-tips-list">
                <li>Check local currency exchange rates before arrival.</li>
                <li>Download offline maps for offline walking and transit navigation.</li>
                <li>Comfortable walking shoes are recommended for city center stops.</li>
                <li>Carry digital & printed copies of your accommodation confirmations.</li>
              </ul>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   DAY SECTION COMPONENT
   ========================================================================= */
const DaySection = ({ day, currencySymbol, expanded, onToggle, onFocusMap }) => {
  // Use activities list if available, or convert legacy slots
  const activities = day.activities && day.activities.length > 0
    ? day.activities
    : [
        day.morning && {
          time: day.morning.time || '09:00 AM',
          placeName: day.morning.activity,
          description: day.morning.description,
          suggestedDuration: day.morning.duration,
          image: day.morning.image,
          tip: day.morning.tip,
          address: day.morning.address,
          openingHours: day.morning.openingHours,
          estimatedTravelTimeFromPrevious: day.morning.estimatedTravelTimeFromPrevious,
          lat: day.morning.lat,
          lng: day.morning.lng,
        },
        day.afternoon && {
          time: day.afternoon.time || '01:30 PM',
          placeName: day.afternoon.activity,
          description: day.afternoon.description,
          suggestedDuration: day.afternoon.duration,
          image: day.afternoon.image,
          tip: day.afternoon.tip,
          address: day.afternoon.address,
          openingHours: day.afternoon.openingHours,
          estimatedTravelTimeFromPrevious: day.afternoon.estimatedTravelTimeFromPrevious,
          lat: day.afternoon.lat,
          lng: day.afternoon.lng,
        },
        day.evening && {
          time: day.evening.time || '06:00 PM',
          placeName: day.evening.activity,
          description: day.evening.description,
          suggestedDuration: day.evening.duration,
          image: day.evening.image,
          tip: day.evening.tip,
          address: day.evening.address,
          openingHours: day.evening.openingHours,
          estimatedTravelTimeFromPrevious: day.evening.estimatedTravelTimeFromPrevious,
          lat: day.evening.lat,
          lng: day.evening.lng,
        },
      ].filter(Boolean);

  const formattedDate = day.date
    ? new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : '';

  return (
    <div className={`day-card ${expanded ? 'expanded' : ''}`}>
      <div className="day-card-header" onClick={onToggle}>
        <div className="day-header-left">
          <span className="day-badge">Day {day.dayNumber}</span>
          <div>
            <h3 className="day-title">{day.title}</h3>
            {formattedDate && <span className="day-date">{formattedDate}</span>}
          </div>
        </div>

        <div className="day-header-right">
          <button
            type="button"
            className="btn btn-outline btn-xs itin-day-map-btn"
            onClick={(e) => {
              e.stopPropagation();
              onFocusMap();
            }}
          >
            <MapPin size={12} /> Map View
          </button>
          <span className="day-toggle-icon">
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="day-card-body fade-in">
          {/* Stops Timeline */}
          <div className="day-activities-timeline">
            {activities.map((act, idx) => (
              <ActivityCard
                key={idx}
                activity={act}
                stopNumber={idx + 1}
                isLast={idx === activities.length - 1}
              />
            ))}
          </div>

          {/* Meals Recommendation */}
          {day.meals && (
            <div className="day-meals-box">
              <h4 className="day-sub-heading">🍴 Dining Suggestions</h4>
              <div className="day-meals-grid">
                {day.meals.breakfast && (
                  <div className="meal-item">
                    <span className="meal-tag">Breakfast</span>
                    <span className="meal-desc">{day.meals.breakfast}</span>
                  </div>
                )}
                {day.meals.lunch && (
                  <div className="meal-item">
                    <span className="meal-tag">Lunch</span>
                    <span className="meal-desc">{day.meals.lunch}</span>
                  </div>
                )}
                {day.meals.dinner && (
                  <div className="meal-item">
                    <span className="meal-tag">Dinner</span>
                    <span className="meal-desc">{day.meals.dinner}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Accommodation */}
          {day.accommodation && (
            <div className="day-accom-box">
              <h4 className="day-sub-heading">🏨 Recommended Accommodation</h4>
              <p className="day-accom-text">{day.accommodation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   ACTIVITY CARD COMPONENT
   ========================================================================= */
const ActivityCard = ({ activity, stopNumber, isLast }) => {
  const [imgErr, setImgErr] = useState(false);
  const photo = activity.image && !imgErr ? activity.image : FALLBACK_IMAGE;

  return (
    <div className="activity-item">
      {/* Travel Time From Previous Stop indicator */}
      {activity.estimatedTravelTimeFromPrevious && (
        <div className="activity-travel-banner">
          <Navigation size={12} className="travel-icon" />
          <span>Travel from previous stop: <strong>{activity.estimatedTravelTimeFromPrevious}</strong></span>
        </div>
      )}

      <div className="activity-card-row">
        {/* Numbered Marker & Line */}
        <div className="activity-stop-col">
          <div className="activity-stop-circle">{stopNumber}</div>
          {!isLast && <div className="activity-stop-line" />}
        </div>

        {/* Content Box */}
        <div className="activity-content-box">
          <div className="activity-header-meta">
            <span className="activity-time-badge">
              <Clock size={12} /> {activity.time || 'Morning'}
            </span>
            {activity.suggestedDuration && (
              <span className="activity-duration-badge">
                ⏱ {activity.suggestedDuration}
              </span>
            )}
            {activity.openingHours ? (
              <span className="activity-hours-badge">
                🕒 {activity.openingHours}
              </span>
            ) : (
              <span className="activity-hours-badge text-muted">
                🕒 Hours: Not available
              </span>
            )}
          </div>

          <div className="activity-body-grid">
            <div className="activity-img-wrap">
              <img
                src={photo}
                alt={activity.placeName || 'Attraction'}
                className="activity-img"
                loading="lazy"
                onError={() => setImgErr(true)}
              />
            </div>

            <div className="activity-text-col">
              <h3 className="activity-place-name">{activity.placeName}</h3>
              {activity.address && (
                <p className="activity-address">
                  <MapPin size={12} /> {activity.address}
                </p>
              )}
              <p className="activity-description">{activity.description}</p>

              {activity.tip && (
                <div className="activity-tip">
                  <Sparkles size={13} color="var(--color-gold)" style={{ flexShrink: 0 }} />
                  <em>{activity.tip}</em>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CostRow = ({ label, amount, pct }) => (
  <div className="itin-cost-row">
    <span className="cost-row-label">{label}</span>
    <span className="cost-row-pct">{pct}</span>
    <strong className="cost-row-amt">{amount}</strong>
  </div>
);

export default Itinerary;
