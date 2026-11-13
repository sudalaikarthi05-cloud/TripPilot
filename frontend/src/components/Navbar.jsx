import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Compass, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  // Pages that have dark hero sections (keep navbar transparent/dark text)
  const lightNavPages = ['/explore', '/plan', '/my-trips', '/about'];
  const isLightPage = lightNavPages.some(p => location.pathname.startsWith(p));

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Prevent body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const navClass = [
    'navbar',
    scrolled ? 'scrolled' : '',
    isLightPage && !scrolled ? 'on-light' : ''
  ].filter(Boolean).join(' ');

  return (
    <header className={navClass}>
      <div className="navbar-container container">
        <Link to="/" className="navbar-logo" onClick={() => setIsOpen(false)}>
          <div className="navbar-logo-icon">
            <Compass size={20} />
          </div>
          <span className="navbar-logo-text">TripPilot</span>
        </Link>

        <nav className={`navbar-nav${isOpen ? ' open' : ''}`}>
          <NavLink to="/" end className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>Home</NavLink>
          <NavLink to="/explore" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>Explore</NavLink>
          <NavLink to="/plan" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>Plan Your Trip</NavLink>
          <NavLink to="/my-trips" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>My Trips</NavLink>
          <NavLink to="/about" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>About</NavLink>

          {isAuthenticated ? (
            <div className="navbar-user-section">
              <span className="navbar-user-badge" title={`Signed in as ${user?.email || ''}`}>
                <UserIcon size={15} />
                <span className="navbar-user-name">{user?.name || 'Traveler'}</span>
              </span>
              <button
                type="button"
                className="navbar-logout-btn"
                onClick={handleLogout}
                title="Sign out of TripPilot"
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <NavLink to="/login" className={({ isActive }) => `navbar-link navbar-login-link${isActive ? ' active' : ''}`}>
              Sign In
            </NavLink>
          )}

          <Link to="/plan" className="navbar-cta btn btn-primary">Plan My Journey</Link>
        </nav>

        <button
          className="navbar-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
          style={{ position: 'relative', zIndex: 999 }}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  );
};

export default Navbar;
