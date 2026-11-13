import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Route Code-Splitting
const Home = lazy(() => import('./pages/Home.jsx'));
const Explore = lazy(() => import('./pages/Explore.jsx'));
const PlanTrip = lazy(() => import('./pages/PlanTrip.jsx'));
const Itinerary = lazy(() => import('./pages/Itinerary.jsx'));
const MyTrips = lazy(() => import('./pages/MyTrips.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const DestinationDetails = lazy(() => import('./pages/DestinationDetails.jsx'));
const AnimatedAuth = lazy(() => import('./experiences/animated-auth/AnimatedAuth.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

// Page loading fallback
const PageLoader = () => (
  <div style={{
    minHeight: '60vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    color: 'var(--color-forest)'
  }}>
    <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Loading TripPilot…</span>
  </div>
);

function AppContent() {
  const location = useLocation();

  // Scroll to top on route change & update document title
  useEffect(() => {
    window.scrollTo(0, 0);

    const path = location.pathname;
    let title = 'TripPilot — Smart Worldwide Tour Planner';
    if (path === '/') title = 'TripPilot — Smart Tour Planner for Any Destination';
    else if (path.startsWith('/explore')) title = 'Explore World Destinations — TripPilot';
    else if (path.startsWith('/plan')) title = 'Plan Your Custom Itinerary — TripPilot';
    else if (path.startsWith('/itinerary')) title = 'Your Tailored Itinerary — TripPilot';
    else if (path.startsWith('/my-trips') || path.startsWith('/trips')) title = 'My Saved Trips — TripPilot';
    else if (path.startsWith('/about')) title = 'About Us — TripPilot';
    else if (path.startsWith('/destination')) title = 'Destination Guide — TripPilot';
    
    else if (path === '/login' || path === '/register') title = 'TripPilot Travels — Sign In';
    
    document.title = title;
  }, [location.pathname]);

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <ErrorBoundary>
      <div className="app">
        {!isAuthPage && <Navbar />}
        <main>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/home" element={<Navigate to="/" replace />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/plan" element={<PlanTrip />} />
              <Route path="/itinerary/:id?" element={<Itinerary />} />
              <Route
                path="/my-trips"
                element={
                  <ProtectedRoute>
                    <MyTrips />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/trips"
                element={
                  <ProtectedRoute>
                    <MyTrips />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<AnimatedAuth />} />
              <Route path="/register" element={<AnimatedAuth />} />
              <Route path="/about" element={<About />} />
              <Route path="/destination/:slug" element={<DestinationDetails />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        {!isAuthPage && <Footer />}
      </div>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
