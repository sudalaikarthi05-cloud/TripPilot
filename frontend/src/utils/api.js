import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor to attach JWT / session token if present
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('trippilot_token') ||
      sessionStorage.getItem('trippilot_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      'An unexpected error occurred.';
    const customErr = new Error(message);
    customErr.response = err.response;
    customErr.status = err.response?.status;
    customErr.code = err.code;
    return Promise.reject(customErr);
  }
);

// ---- Destinations ----
export const getDestinations = () => api.get('/destinations');
export const getDestinationById = (id) => api.get(`/destinations/${id}`);
export const getDestinationBySlug = (slug) => api.get(`/destinations/slug/${slug}`);

// ---- Tourist Places ----
export const getPlaces = () => api.get('/places');
export const getPlacesByDestination = (destinationId) =>
  api.get(`/places?destinationId=${destinationId}`);
export const getPlaceById = (id) => api.get(`/places/${id}`);

// ---- Global destination discovery ----
export const discoverDestination = (query, signal) =>
  api.get('/discover', { params: { q: query }, signal, timeout: 30000 });
export const suggestDiscoverLocations = (query, signal) =>
  api.get('/discover/suggest', { params: { q: query }, signal });

// ---- Itinerary Generation ----
export const generateItinerary = (tripData) =>
  api.post('/trips/generate', tripData);

// ---- Saved Trips (CRUD) ----
export const saveTrip = (tripData) => api.post('/trips', tripData);
export const getAllTrips = () => api.get('/trips');
export const getTripById = (id) => api.get(`/trips/${id}`);
export const updateTrip = (id, tripData) => api.put(`/trips/${id}`, tripData);
export const deleteTrip = (id) => api.delete(`/trips/${id}`);

// ---- Authentication ----
export const registerUser = (userData) => api.post('/auth/register', userData);
export const loginUser = (credentials) => api.post('/auth/login', credentials);
export const getCurrentUser = () => api.get('/auth/me');
export const logoutUser = () => api.post('/auth/logout');

export default api;
