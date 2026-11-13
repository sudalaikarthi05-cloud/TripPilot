import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, AlertCircle, Search, MapPin,
  Calendar, Users, Wallet, Sparkles, RefreshCw, X, Globe
} from 'lucide-react';
import {
  TRAVEL_STYLES, TRANSPORT_OPTIONS, INTERESTS, CURRENCIES,
  POPULAR_GLOBAL_DESTINATIONS, FALLBACK_IMAGE
} from '../utils/destinationData';
import { generateItinerary, updateTrip, suggestDiscoverLocations } from '../utils/api';
import './PlanTrip.css';

const TOTAL_STEPS = 4;

const STEPS_CONFIG = [
  { id: 1, label: 'Destination', description: 'Where are you headed?' },
  { id: 2, label: 'Trip Details', description: 'When, who & budget' },
  { id: 3, label: 'Preferences', description: 'Your style & interests' },
  { id: 4, label: 'Review', description: 'Confirm & generate' },
];

const initialForm = {
  destination: '',
  destinationCountry: '',
  destinationLat: null,
  destinationLng: null,
  startingLocation: '',
  startDate: '',
  numDays: 3,
  numTravelers: 2,
  budget: 1500,
  currency: 'USD',
  travelStyle: 'Comfort',
  transport: 'flexible',
  interests: ['Culture', 'Food'],
};

const validate = (step, form) => {
  const errors = {};
  if (step === 1) {
    if (!form.destination || form.destination.trim().length < 2) {
      errors.destination = 'Please enter or select a valid destination.';
    }
  }
  if (step === 2) {
    if (!form.startDate) {
      errors.startDate = 'Please pick a start date.';
    } else {
      const d = new Date(form.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (d < today) {
        errors.startDate = 'Start date cannot be in the past.';
      }
    }
    if (!form.numDays || form.numDays < 1 || form.numDays > 10) {
      errors.numDays = 'Duration must be between 1 and 10 days.';
    }
    if (!form.numTravelers || form.numTravelers < 1 || form.numTravelers > 20) {
      errors.numTravelers = 'At least 1 traveler required (max 20).';
    }
    if (!form.budget || Number(form.budget) <= 0) {
      errors.budget = 'Please enter a valid budget greater than 0.';
    }
  }
  if (step === 3) {
    if (!form.travelStyle) {
      errors.travelStyle = 'Please choose a travel style.';
    }
    if (!form.interests || form.interests.length === 0) {
      errors.interests = 'Select at least one interest to personalize your itinerary.';
    }
  }
  return errors;
};

const PlanTrip = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Check if we are in "Edit Trip" mode
  const editTripData = location.state?.editTrip || null;
  const editTripId = editTripData?.id || editTripData?._id || searchParams.get('edit') || null;

  // Prefill from query params or edit trip
  const prefilledDest = editTripData?.destination?.name
    || editTripData?.destinationName
    || searchParams.get('destination')
    || searchParams.get('q')
    || '';

  const prefilledCountry = editTripData?.destination?.country
    || editTripData?.destinationCountry
    || searchParams.get('country')
    || '';

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    ...initialForm,
    destination: prefilledDest,
    destinationCountry: prefilledCountry,
    destinationLat: editTripData?.destinationLat || null,
    destinationLng: editTripData?.destinationLng || null,
    startingLocation: editTripData?.startingLocation || '',
    startDate: editTripData?.startDate || searchParams.get('date') || '',
    numDays: editTripData?.numDays || 3,
    numTravelers: editTripData?.numTravelers || Number.parseInt(searchParams.get('travelers') || '2', 10) || 2,
    budget: editTripData?.budget || editTripData?.budgetINR || (prefilledDest ? 1500 : 1500),
    currency: editTripData?.currency || (editTripData?.budgetINR ? 'INR' : 'USD'),
    travelStyle: editTripData?.travelStyle || 'Comfort',
    transport: editTripData?.transport || 'flexible',
    interests: editTripData?.interests || ['Culture', 'Food'],
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Autocomplete suggestions state
  const [destInput, setDestInput] = useState(prefilledDest);
  const [suggestions, setSuggestions] = useState([]);
  const [suggesting, setSuggesting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimerRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Debounced autocomplete search
  useEffect(() => {
    const val = destInput.trim();
    if (val.length < 2 || val === form.destination) {
      setSuggestions([]);
      setSuggesting(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(async () => {
      setSuggesting(true);
      try {
        const res = await suggestDiscoverLocations(val, controller.signal);
        if (!controller.signal.aborted) {
          setSuggestions(res.data || []);
          setShowSuggestions(true);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) setSuggesting(false);
      }
    }, 300);

    return () => {
      clearTimeout(searchTimerRef.current);
      controller.abort();
    };
  }, [destInput, form.destination]);

  const updateField = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    setErrors(p => ({ ...p, [field]: undefined }));
    setApiError('');
  };

  const handleSelectSuggestion = (sug) => {
    const fullName = [sug.name, sug.region, sug.country].filter(Boolean).join(', ');
    setDestInput(sug.name);
    setForm(p => ({
      ...p,
      destination: sug.name,
      destinationCountry: sug.country || '',
    }));
    setShowSuggestions(false);
    setErrors(p => ({ ...p, destination: undefined }));
  };

  const handlePickPopular = (dest) => {
    setDestInput(dest.name);
    setForm(p => ({
      ...p,
      destination: dest.name,
      destinationCountry: dest.country,
      destinationLat: dest.lat,
      destinationLng: dest.lng,
    }));
    setErrors(p => ({ ...p, destination: undefined }));
  };

  const toggleInterest = (id) => {
    setForm(p => ({
      ...p,
      interests: p.interests.includes(id)
        ? p.interests.filter(i => i !== id)
        : [...p.interests, id],
    }));
    setErrors(p => ({ ...p, interests: undefined }));
  };

  const goNext = () => {
    const errs = validate(step, form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setStep(s => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setApiError('');

    const payload = {
      destinationName: form.destination,
      destinationLat: form.destinationLat,
      destinationLng: form.destinationLng,
      country: form.destinationCountry || null,
      startingLocation: form.startingLocation || null,
      startDate: form.startDate,
      numDays: Number(form.numDays),
      numTravelers: Number(form.numTravelers),
      budget: Number(form.budget),
      currency: form.currency,
      travelStyle: form.travelStyle,
      transport: form.transport || 'flexible',
      interests: form.interests,
    };

    try {
      const res = await generateItinerary(payload);
      const generatedTrip = res.data;

      // If editing an existing trip, update it in MongoDB via PUT /api/trips/{id}
      if (editTripId && editTripId !== 'preview') {
        const updatePayload = {
          ...generatedTrip,
          id: editTripId,
          createdAt: editTripData?.createdAt || generatedTrip.createdAt,
        };
        const updatedRes = await updateTrip(editTripId, updatePayload);
        navigate(`/itinerary/${editTripId}`, {
          state: {
            itinerary: updatedRes.data,
            formData: payload,
            updatedToast: true,
          },
        });
      } else {
        const tripId = generatedTrip?.id || generatedTrip?._id || 'preview';
        navigate(`/itinerary/${tripId}`, {
          state: {
            itinerary: generatedTrip,
            formData: payload,
          },
        });
      }
    } catch (err) {
      setApiError(
        err.message ||
        'We could not generate the itinerary right now. Please verify your connection or try a different destination.'
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedCurrencyObj = CURRENCIES.find(c => c.code === form.currency) || CURRENCIES[0];

  return (
    <div className="plan-page">
      {/* Page Hero */}
      <section className="plan-hero">
        <div className="plan-hero-bg" aria-hidden="true" />
        <div className="plan-hero-overlay" aria-hidden="true" />
        <div className="container plan-hero-content">
          <p className="page-hero-label">
            {editTripId ? 'Modify Journey' : 'Global Custom Itinerary'}
          </p>
          <h1 className="page-hero-title">
            {editTripId ? 'Edit Your Trip Preferences' : 'Plan Your Journey'}
          </h1>
          <p className="page-hero-desc">
            {editTripId
              ? 'Refine your dates, budget, or travel style to regenerate a refreshed itinerary.'
              : 'Tell us where you want to go and we’ll craft your tailored daily itinerary with real attractions, anywhere in the world.'}
          </p>
        </div>
      </section>

      {/* Progress */}
      <div className="plan-progress-bar">
        <div className="container">
          <div className="plan-steps">
            {STEPS_CONFIG.map(s => (
              <div
                key={s.id}
                className={`plan-step ${step >= s.id ? 'active' : ''} ${step > s.id ? 'done' : ''}`}
              >
                <div className="plan-step-circle">
                  {step > s.id ? <Check size={14} /> : s.id}
                </div>
                <div className="plan-step-labels">
                  <span className="plan-step-label">{s.label}</span>
                  <span className="plan-step-desc">{s.description}</span>
                </div>
                {s.id < TOTAL_STEPS && <div className="plan-step-line" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <section className="section plan-form-section">
        <div className="container">
          <div className="plan-form-wrap">

            {apiError && (
              <div className="error-banner" style={{ marginBottom: '2rem' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <strong>Generation failed:</strong> {apiError}
                </div>
                <button className="btn btn-outline btn-sm" onClick={handleSubmit} disabled={loading}>
                  <RefreshCw size={13} className={loading ? 'spin' : ''} /> Retry
                </button>
              </div>
            )}

            {/* STEP 1: DESTINATION */}
            {step === 1 && (
              <div className="plan-step-content fade-in">
                <div className="plan-step-header">
                  <h2 className="plan-step-title">Where would you like to travel?</h2>
                  <p className="plan-step-subtitle">
                    Search any city, region, or country across the globe, or pick an inspiring destination below.
                  </p>
                </div>

                {errors.destination && <ErrorMsg msg={errors.destination} />}

                {/* Global Autocomplete Search Input */}
                <div className="plan-autocomplete-wrap" style={{ position: 'relative', marginBottom: '2.5rem' }}>
                  <label className="plan-label" htmlFor="plan-dest-input">
                    Destination City or Region
                  </label>
                  <div className="plan-input-with-icon">
                    <Search size={18} className="plan-input-icon" />
                    <input
                      id="plan-dest-input"
                      type="text"
                      className={`plan-input ${errors.destination ? 'error' : ''}`}
                      placeholder="e.g. Paris, Tokyo, Bali, Rome, Munnar, New York…"
                      value={destInput}
                      onChange={e => {
                        setDestInput(e.target.value);
                        updateField('destination', e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => {
                        if (suggestions.length > 0) setShowSuggestions(true);
                      }}
                      autoComplete="off"
                    />
                    {destInput && (
                      <button
                        type="button"
                        className="plan-clear-btn"
                        onClick={() => {
                          setDestInput('');
                          updateField('destination', '');
                          setSuggestions([]);
                        }}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {suggesting && (
                    <div className="plan-search-loading-hint">
                      <span className="spinner" style={{ width: 14, height: 14 }} /> Searching destinations…
                    </div>
                  )}

                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="plan-suggestions-dropdown">
                      {suggestions.map((sug, idx) => (
                        <li
                          key={idx}
                          className="plan-suggestion-item"
                          onClick={() => handleSelectSuggestion(sug)}
                        >
                          <MapPin size={15} className="plan-sug-pin" />
                          <div>
                            <strong>{sug.name}</strong>
                            {(sug.region || sug.country) && (
                              <span className="plan-sug-sub">
                                {[sug.region, sug.country].filter(Boolean).join(', ')}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Optional Starting Location */}
                <div className="plan-field-group" style={{ marginBottom: '2.5rem' }}>
                  <label className="plan-label" htmlFor="plan-start-loc">
                    Starting Location / Airport <span className="plan-label-opt">(optional)</span>
                  </label>
                  <input
                    id="plan-start-loc"
                    type="text"
                    className="plan-input"
                    placeholder="e.g. London Heathrow, New York JFK, Home"
                    value={form.startingLocation}
                    onChange={e => updateField('startingLocation', e.target.value)}
                  />
                </div>

                {/* Popular Inspiration Cards */}
                <div className="plan-inspiration-section">
                  <h3 className="plan-inspiration-title">
                    <Sparkles size={16} color="var(--color-gold)" /> Popular Global Destinations
                  </h3>
                  <div className="plan-inspiration-grid">
                    {POPULAR_GLOBAL_DESTINATIONS.map(d => {
                      const isSelected = form.destination.toLowerCase() === d.name.toLowerCase();
                      return (
                        <div
                          key={d.id}
                          className={`plan-dest-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => handlePickPopular(d)}
                        >
                          <img
                            src={d.image || FALLBACK_IMAGE}
                            alt={d.name}
                            className="plan-dest-img"
                            loading="lazy"
                          />
                          <div className="plan-dest-overlay" />
                          <div className="plan-dest-info">
                            <span className="plan-dest-tag">{d.country}</span>
                            <h4 className="plan-dest-name">{d.name}</h4>
                            <p className="plan-dest-duration">{d.duration}</p>
                          </div>
                          {isSelected && (
                            <div className="plan-dest-check">
                              <Check size={14} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: TRIP DETAILS */}
            {step === 2 && (
              <div className="plan-step-content fade-in">
                <div className="plan-step-header">
                  <h2 className="plan-step-title">When and with whom are you traveling?</h2>
                  <p className="plan-step-subtitle">
                    Configure your schedule, travel group size, and total estimated budget.
                  </p>
                </div>

                <div className="plan-grid-2">
                  {/* Start Date */}
                  <div className="plan-field-group">
                    <label className="plan-label" htmlFor="plan-start-date">
                      <Calendar size={15} /> Start Date
                    </label>
                    <input
                      id="plan-start-date"
                      type="date"
                      className={`plan-input ${errors.startDate ? 'error' : ''}`}
                      min={new Date().toISOString().split('T')[0]}
                      value={form.startDate}
                      onChange={e => updateField('startDate', e.target.value)}
                    />
                    {errors.startDate && <ErrorMsg msg={errors.startDate} />}
                  </div>

                  {/* Duration in Days */}
                  <div className="plan-field-group">
                    <label className="plan-label" htmlFor="plan-num-days">
                      Duration: <strong>{form.numDays} {form.numDays === 1 ? 'Day' : 'Days'}</strong>
                    </label>
                    <div className="plan-slider-wrap">
                      <input
                        id="plan-num-days"
                        type="range"
                        min="1"
                        max="10"
                        value={form.numDays}
                        onChange={e => updateField('numDays', Number(e.target.value))}
                        className="plan-range-slider"
                      />
                      <div className="plan-slider-ticks">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                          <span
                            key={n}
                            className={`plan-tick ${form.numDays === n ? 'active' : ''}`}
                            onClick={() => updateField('numDays', n)}
                          >
                            {n}d
                          </span>
                        ))}
                      </div>
                    </div>
                    {errors.numDays && <ErrorMsg msg={errors.numDays} />}
                  </div>
                </div>

                <div className="plan-grid-2" style={{ marginTop: '1.5rem' }}>
                  {/* Number of Travelers */}
                  <div className="plan-field-group">
                    <label className="plan-label" htmlFor="plan-travelers">
                      <Users size={15} /> Number of Travelers
                    </label>
                    <div className="plan-stepper">
                      <button
                        type="button"
                        className="plan-stepper-btn"
                        onClick={() => updateField('numTravelers', Math.max(1, form.numTravelers - 1))}
                        disabled={form.numTravelers <= 1}
                      >
                        -
                      </button>
                      <span className="plan-stepper-val">{form.numTravelers}</span>
                      <button
                        type="button"
                        className="plan-stepper-btn"
                        onClick={() => updateField('numTravelers', Math.min(20, form.numTravelers + 1))}
                        disabled={form.numTravelers >= 20}
                      >
                        +
                      </button>
                    </div>
                    {errors.numTravelers && <ErrorMsg msg={errors.numTravelers} />}
                  </div>

                  {/* Budget & Currency */}
                  <div className="plan-field-group">
                    <label className="plan-label" htmlFor="plan-budget">
                      <Wallet size={15} /> Total Budget ({selectedCurrencyObj.symbol})
                    </label>
                    <div className="plan-budget-input-wrap">
                      <select
                        className="plan-currency-select"
                        value={form.currency}
                        onChange={e => updateField('currency', e.target.value)}
                        aria-label="Select currency"
                      >
                        {CURRENCIES.map(c => (
                          <option key={c.code} value={c.code}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <input
                        id="plan-budget"
                        type="number"
                        min="1"
                        step="10"
                        className={`plan-input plan-budget-input ${errors.budget ? 'error' : ''}`}
                        placeholder="e.g. 1500"
                        value={form.budget}
                        onChange={e => updateField('budget', e.target.value)}
                      />
                    </div>
                    <span className="plan-input-hint">
                      Estimated ~{selectedCurrencyObj.symbol}{Math.round(form.budget / (form.numDays || 1))} / day total
                    </span>
                    {errors.budget && <ErrorMsg msg={errors.budget} />}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: PREFERENCES */}
            {step === 3 && (
              <div className="plan-step-content fade-in">
                <div className="plan-step-header">
                  <h2 className="plan-step-title">Your Style & Interests</h2>
                  <p className="plan-step-subtitle">
                    Select your preferred travel comfort tier and the experiences you enjoy most.
                  </p>
                </div>

                {/* Travel Style */}
                <div className="plan-field-group" style={{ marginBottom: '2.5rem' }}>
                  <label className="plan-label">Travel Style</label>
                  {errors.travelStyle && <ErrorMsg msg={errors.travelStyle} />}
                  <div className="plan-style-grid">
                    {TRAVEL_STYLES.map(style => {
                      const isSelected = form.travelStyle === style.id;
                      return (
                        <div
                          key={style.id}
                          className={`plan-style-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => updateField('travelStyle', style.id)}
                        >
                          <span className="plan-style-icon">{style.icon}</span>
                          <h4 className="plan-style-title">{style.label}</h4>
                          <p className="plan-style-desc">{style.desc}</p>
                          {isSelected && <Check size={14} className="plan-style-check" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Interests (Nature, Beach, Adventure, Food, History, Culture, Shopping, Relaxation) */}
                <div className="plan-field-group">
                  <label className="plan-label">Interests & Experiences (Select all that apply)</label>
                  {errors.interests && <ErrorMsg msg={errors.interests} />}
                  <div className="plan-interests-grid">
                    {INTERESTS.map(item => {
                      const isSelected = form.interests.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`plan-interest-btn ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleInterest(item.id)}
                        >
                          <span className="plan-interest-icon">{item.icon}</span>
                          <span className="plan-interest-name">{item.label}</span>
                          {isSelected && <Check size={14} className="plan-interest-check" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW & CONFIRM */}
            {step === 4 && (
              <div className="plan-step-content fade-in">
                <div className="plan-step-header">
                  <h2 className="plan-step-title">Ready to Craft Your Journey</h2>
                  <p className="plan-step-subtitle">
                    Review your parameters before we generate your customized day-by-day itinerary.
                  </p>
                </div>

                <div className="plan-review-card">
                  <div className="plan-review-dest-header">
                    <Globe size={20} color="var(--color-forest)" />
                    <div>
                      <h3 className="plan-review-dest-title">{form.destination}</h3>
                      {form.destinationCountry && (
                        <p className="plan-review-dest-country">{form.destinationCountry}</p>
                      )}
                    </div>
                  </div>

                  <div className="plan-review-grid">
                    <div className="plan-review-item">
                      <span className="plan-review-k">Dates</span>
                      <span className="plan-review-v">
                        {form.startDate ? new Date(form.startDate).toLocaleDateString() : '—'} ({form.numDays} Days)
                      </span>
                    </div>

                    <div className="plan-review-item">
                      <span className="plan-review-k">Travelers</span>
                      <span className="plan-review-v">{form.numTravelers} Persons</span>
                    </div>

                    <div className="plan-review-item">
                      <span className="plan-review-k">Budget</span>
                      <span className="plan-review-v">
                        {selectedCurrencyObj.symbol}{Number(form.budget).toLocaleString()} {form.currency}
                      </span>
                    </div>

                    <div className="plan-review-item">
                      <span className="plan-review-k">Travel Style</span>
                      <span className="plan-review-v">{form.travelStyle}</span>
                    </div>
                  </div>

                  <div className="plan-review-interests">
                    <span className="plan-review-k" style={{ display: 'block', marginBottom: '0.5rem' }}>
                      Selected Interests
                    </span>
                    <div className="plan-review-tags">
                      {form.interests.map(int => (
                        <span key={int} className="tag tag-green">
                          {int}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="plan-nav-bar">
              {step > 1 ? (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={goBack}
                  disabled={loading}
                >
                  <ArrowLeft size={16} /> Back
                </button>
              ) : (
                <div />
              )}

              {step < TOTAL_STEPS ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={goNext}
                >
                  Next Step <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner" style={{ width: 18, height: 18 }} /> Generating Itinerary…
                    </>
                  ) : editTripId ? (
                    <>
                      <Sparkles size={18} /> Regenerate & Update Trip
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} /> Generate My Itinerary
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

const ErrorMsg = ({ msg }) => (
  <p className="plan-field-error">
    <AlertCircle size={13} style={{ display: 'inline', marginRight: 4 }} />
    {msg}
  </p>
);

export default PlanTrip;
