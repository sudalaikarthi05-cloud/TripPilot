import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2, Eye, Edit3, Calendar, Users, MapPin, AlertCircle, Plus,
  Sparkles, CheckCircle2, Clock, Wallet, RefreshCw
} from 'lucide-react';
import { getAllTrips, deleteTrip } from '../utils/api';
import { CURRENCIES, FALLBACK_IMAGE } from '../utils/destinationData';
import './MyTrips.css';

const MyTrips = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAllTrips();
      setTrips(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(
        `Unable to reach the server: ${err.message}. Please check your connection and ensure the backend is running.`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTrip(deleteTarget);
      setTrips(p => p.filter(t => (t.id || t._id) !== deleteTarget));
      showToast('Trip deleted successfully.');
    } catch (err) {
      alert(`Could not delete trip: ${err.message}`);
    }
    setDeleteTarget(null);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleEdit = (trip) => {
    navigate('/plan', { state: { editTrip: trip } });
  };

  return (
    <div className="my-trips-page">
      {/* Toast notification */}
      {toastMessage && (
        <div className="global-toast fade-in">
          <CheckCircle2 size={16} color="var(--color-gold-light)" />
          <span>{toastMessage}</span>
        </div>
      )}

      <section className="page-hero my-trips-hero">
        <div className="my-trips-hero-bg" aria-hidden="true" />
        <div className="my-trips-hero-overlay" aria-hidden="true" />
        <div className="container page-hero-content">
          <p className="page-hero-label">Your Travel Portfolio</p>
          <h1 className="page-hero-title">My Saved Trips</h1>
          <p className="page-hero-desc">
            Revisit, customize, and manage all your planned itineraries across the globe.
          </p>
        </div>
      </section>

      <section className="section my-trips-content">
        <div className="container">
          {loading && (
            <div className="trips-grid">
              {[1, 2, 3].map(n => (
                <div key={n} className="trip-card-skeleton skeleton" style={{ height: 340 }} />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="my-trips-error">
              <div className="error-banner">
                <AlertCircle size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                {error}
              </div>
              <button className="btn btn-outline" onClick={load}>
                <RefreshCw size={16} /> Try Again
              </button>
            </div>
          )}

          {!loading && !error && trips.length === 0 && (
            <div className="my-trips-empty">
              <span style={{ fontSize: '4rem' }}>✈️</span>
              <h3>No Saved Trips Yet</h3>
              <p>Explore destinations, generate a customized itinerary, and save it to your collection.</p>
              <Link to="/plan" className="btn btn-primary" style={{ marginTop: '1.25rem' }}>
                <Sparkles size={16} /> Plan Your First Trip
              </Link>
            </div>
          )}

          {!loading && trips.length > 0 && (
            <div>
              <div className="my-trips-header-bar">
                <span className="my-trips-count">
                  Showing <strong>{trips.length}</strong> saved {trips.length === 1 ? 'journey' : 'journeys'}
                </span>
                <Link to="/plan" className="btn btn-primary btn-sm">
                  <Plus size={14} /> Plan New Trip
                </Link>
              </div>

              <div className="trips-grid">
                {trips.map(trip => {
                  const id = trip.id || trip._id;
                  return (
                    <TripCard
                      key={id}
                      trip={trip}
                      onView={() => navigate(`/itinerary/${id}`)}
                      onEdit={() => handleEdit(trip)}
                      onDelete={() => setDeleteTarget(id)}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Confirm Delete Modal */}
      {deleteTarget && (
        <div className="confirm-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="confirm-panel" onClick={e => e.stopPropagation()}>
            <h3>Delete this trip?</h3>
            <p>This action will remove the saved itinerary from your collection permanently.</p>
            <div className="confirm-actions">
              <button className="btn btn-outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDelete}>
                <Trash2 size={14} /> Delete Trip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TripCard = ({ trip, onView, onEdit, onDelete }) => {
  const [imgErr, setImgErr] = useState(false);
  const dest = trip.destination || {};
  const destName = trip.destinationName || dest.name || 'Custom Trip';
  const destRegion = trip.destinationCountry || dest.country || dest.region || '';

  const coverImg = dest.image || trip.coverImage || (trip.days?.[0]?.activities?.[0]?.image) || FALLBACK_IMAGE;

  const startDate = trip.startDate
    ? new Date(trip.startDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  const currency = trip.currency || (trip.budgetINR ? 'INR' : 'USD');
  const symbol = CURRENCIES.find(c => c.code === currency)?.symbol || currency;
  const budgetVal = trip.budget || trip.budgetINR || 0;

  return (
    <article className="trip-card">
      <div className="trip-card-img-wrap" onClick={onView} style={{ cursor: 'pointer' }}>
        <img
          src={imgErr ? FALLBACK_IMAGE : coverImg}
          alt={destName}
          className="trip-card-img"
          loading="lazy"
          onError={() => setImgErr(true)}
        />
        <div className="trip-card-img-overlay" />
        {trip.travelStyle && (
          <span className="trip-card-style-badge">{trip.travelStyle}</span>
        )}
      </div>

      <div className="trip-card-body">
        <h3 className="trip-card-name" onClick={onView}>
          {destName}
        </h3>

        <div className="trip-card-meta">
          {destRegion && (
            <span>
              <MapPin size={13} /> {destRegion}
            </span>
          )}
          {trip.startDate && (
            <span>
              <Calendar size={13} /> {startDate}
            </span>
          )}
          {trip.numDays && <span>⏱ {trip.numDays} Days</span>}
          {trip.numTravelers && (
            <span>
              <Users size={13} /> {trip.numTravelers}
            </span>
          )}
        </div>

        {budgetVal > 0 && (
          <p className="trip-card-budget">
            <Wallet size={13} style={{ display: 'inline', marginRight: 4 }} />
            {symbol}{Number(budgetVal).toLocaleString()} {currency} <span className="trip-card-budget-est">(est.)</span>
          </p>
        )}

        <div className="trip-card-actions">
          <button className="btn btn-forest btn-sm" onClick={onView} title="View Itinerary">
            <Eye size={14} /> View
          </button>
          <button className="btn btn-outline btn-sm" onClick={onEdit} title="Edit Preferences">
            <Edit3 size={14} /> Edit
          </button>
          <button
            className="btn btn-outline btn-sm trip-delete-btn"
            onClick={onDelete}
            title="Delete Trip"
            aria-label="Delete Trip"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
};

export default MyTrips;
