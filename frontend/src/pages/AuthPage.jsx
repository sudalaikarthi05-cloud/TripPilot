import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  BUS_DURATION_MS,
  CARD_FADE_MS,
  HOME_FADE_MS,
  GREETING_DELAY_MS,
  REDUCED_MOTION_MS,
} from '../constants/animationConstants';
import './AuthPage.css';

/**
 * AuthPage: Premium Cinematic TripPilot Travels Login
 *
 * Visual Target:
 * - Dark futuristic night scene with distant mountains & glowing city silhouette
 * - Parallax mist and wet road with neon cyan streaks
 * - Premium glassmorphic floating login card with cyan focus rings & shine button
 * - White & maroon luxury coach with warm interior lighting and volumetric headlights
 * - Separate rotating wheels with glowing neon cyan rings and wet-road reflections
 * - Real fabric-feel maroon pennant flag with gold border, stitching & crisp text
 * - "Happy Journey, {firstName}!" elegant display greeting
 * - Cinematic veil transition to Home
 */
const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    login,
    register,
    isAuthenticated,
    loading: authLoading,
    user,
    journeyPlaying,
    setJourneyPlaying,
  } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const initialMode = searchParams.get('tab') === 'register' ? 'register' : 'login';

  const [mode, setMode] = useState(initialMode); // 'login' | 'register'

  // State Machine: 'idle' | 'success' | 'cardFading' | 'busDriving' | 'revealHome'
  const [animState, setAnimState] = useState('idle');
  const [showGreeting, setShowGreeting] = useState(false);
  const [reducedMotionActive, setReducedMotionActive] = useState(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Status & validation states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  // Timers and execution guards
  const hasAnimatedRef = useRef(false);
  const finishedRef = useRef(false);
  const isSubmittingLoginRef = useRef(false);
  const timersRef = useRef([]);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // If user was ALREADY logged in before opening /login, go straight to /home without animation
  useEffect(() => {
    if (
      isAuthenticated &&
      !journeyPlaying &&
      !isSubmittingLoginRef.current &&
      animState === 'idle' &&
      !authLoading
    ) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, journeyPlaying, animState, authLoading, navigate]);

  // Extract friendly first name for the greeting banner
  const getFirstName = () => {
    if (user?.name) {
      return user.name.trim().split(' ')[0];
    }
    if (regName.trim()) {
      return regName.trim().split(' ')[0];
    }
    if (loginEmail.trim()) {
      const prefix = loginEmail.split('@')[0].trim();
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return 'Traveler';
  };

  /**
   * Complete the journey animation and smoothly transition to Home
   */
  const finishJourneyToHome = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    setShowGreeting(false);
    setAnimState('revealHome');

    const timerHome = setTimeout(() => {
      if (setJourneyPlaying) setJourneyPlaying(false);
      navigate('/', { replace: true });
    }, HOME_FADE_MS);

    timersRef.current.push(timerHome);
  }, [navigate, setJourneyPlaying]);

  /**
   * Skip button action: immediately bypass remaining animation and navigate to Home
   */
  const handleSkip = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    clearAllTimers();
    if (setJourneyPlaying) setJourneyPlaying(false);
    navigate('/', { replace: true });
  }, [clearAllTimers, navigate, setJourneyPlaying]);

  /**
   * Launch the State Machine sequence right AFTER confirmed successful login response
   */
  const startCinematicSequence = useCallback(() => {
    if (hasAnimatedRef.current) return;
    hasAnimatedRef.current = true;

    // 1. Success state: backend returned real successful login
    setAnimState('success');

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setReducedMotionActive(true);
      setShowGreeting(true);

      const timerReduced = setTimeout(() => {
        finishJourneyToHome();
      }, REDUCED_MOTION_MS);

      timersRef.current.push(timerReduced);
      return;
    }

    // 2. Card fade: the popup fades out with opacity transition and slight scale-down (~500ms)
    const timerCardFade = setTimeout(() => {
      setAnimState('cardFading');

      // 3. Bus driving: after card fade completes, bus enters smoothly from LEFT
      const timerBusStart = setTimeout(() => {
        setAnimState('busDriving');

        // 4. Show "Happy Journey, {first name}!" about 1.5s after bus enters
        const timerGreeting = setTimeout(() => {
          setShowGreeting(true);
        }, GREETING_DELAY_MS);

        // 5. Fallback timer for bus crossing completion (~7.5s)
        const timerBusFinish = setTimeout(() => {
          finishJourneyToHome();
        }, BUS_DURATION_MS);

        timersRef.current.push(timerGreeting, timerBusFinish);
      }, CARD_FADE_MS);

      timersRef.current.push(timerBusStart);
    }, 20);

    timersRef.current.push(timerCardFade);
  }, [finishJourneyToHome]);

  /**
   * Handler for bus animation end (prefer onAnimationEnd, timer is fallback)
   */
  const handleBusAnimationEnd = (e) => {
    if (e.animationName === 'cinematicBusCrossing') {
      finishJourneyToHome();
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!loginEmail.trim()) {
      setErrorMessage('Please enter your email or mobile number.');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      isSubmittingLoginRef.current = true;

      await login({
        email: loginEmail.trim(),
        password: loginPassword,
        rememberMe,
      });

      // Authentication succeeded! Start cinematic sequence
      startCinematicSequence();
    } catch (err) {
      isSubmittingLoginRef.current = false;
      // Wrong password or user not found: NO bus animation, show error only
      setErrorMessage(err.message || 'Invalid email or password. Please try again.');
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!regName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!regEmail.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      setLoading(true);
      isSubmittingLoginRef.current = true;

      await register({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
      });

      // Registration succeeded! Start cinematic sequence
      startCinematicSequence();
    } catch (err) {
      isSubmittingLoginRef.current = false;
      setErrorMessage(err.message || 'Registration failed. Email might already be registered.');
      setLoading(false);
    }
  };

  const isCardFaded =
    animState === 'cardFading' ||
    animState === 'busDriving' ||
    animState === 'revealHome';
  const isBusVisible =
    animState === 'cardFading' ||
    animState === 'busDriving' ||
    animState === 'revealHome';
  const isBusDriving = animState === 'busDriving';
  const isAnimating = animState !== 'idle';

  return (
    <div className="trippilot-auth-scene">
      {/* ========================================================
          1. DEEP FUTURISTIC NIGHT SKY & FAR SCENERY
         ======================================================== */}
      <div className="futuristic-sky-backdrop" />

      {/* Far Background: Mountain & Distant City Skyline Silhouettes with Parallax */}
      <div className={`far-mountain-skyline ${isBusDriving ? 'far-parallax-active' : ''}`} aria-hidden="true">
        <svg className="skyline-svg" viewBox="0 0 1440 320" preserveAspectRatio="none" fill="none">
          <defs>
            <linearGradient id="farMountainGrad" x1="0" y1="0" x2="0" y2="100%">
              <stop offset="0%" stopColor="#0c1a33" />
              <stop offset="60%" stopColor="#071124" />
              <stop offset="100%" stopColor="#040915" />
            </linearGradient>
            <linearGradient id="midMountainGrad" x1="0" y1="0" x2="0" y2="100%">
              <stop offset="0%" stopColor="#102548" />
              <stop offset="50%" stopColor="#0b1a33" />
              <stop offset="100%" stopColor="#060e1d" />
            </linearGradient>
          </defs>
          {/* Distant mountain silhouette with subtle glowing crest */}
          <path
            d="M 0,220
               L 120,170 L 260,200 L 410,130 L 530,180 L 680,120 L 820,165
               L 960,110 L 1110,170 L 1260,135 L 1380,185 L 1440,160
               L 1440,320 L 0,320 Z"
            fill="url(#farMountainGrad)"
            opacity="0.85"
          />
          <path
            d="M 0,220 L 120,170 L 260,200 L 410,130 L 530,180 L 680,120 L 820,165 L 960,110 L 1110,170 L 1260,135 L 1380,185 L 1440,160"
            stroke="rgba(56, 189, 248, 0.22)"
            strokeWidth="1.5"
            fill="none"
          />
          {/* Mid-range foothills & city glow silhouette */}
          <path
            d="M 0,250
               L 90,225 L 170,240 L 290,195 L 390,230 L 490,205 L 610,240
               L 730,190 L 850,235 L 970,180 L 1090,225 L 1220,185 L 1340,230 L 1440,210
               L 1440,320 L 0,320 Z"
            fill="url(#midMountainGrad)"
            opacity="0.9"
          />
        </svg>
      </div>

      {/* Mid-ground Slow Atmospheric Mist */}
      <div className={`atmospheric-mist-band ${isBusDriving ? 'mist-parallax-active' : ''}`} aria-hidden="true">
        <div className="mist-cloud cloud-1" />
        <div className="mist-cloud cloud-2" />
      </div>

      {/* Floating Ambient Starlight Particles */}
      <div className="floating-starlight-layer" aria-hidden="true">
        <span className="star-mote s1" />
        <span className="star-mote s2" />
        <span className="star-mote s3" />
        <span className="star-mote s4" />
        <span className="star-mote s5" />
        <span className="star-mote s6" />
        <span className="star-mote s7" />
        <span className="star-mote s8" />
      </div>

      {/* Subtle Minimalist HUD Corner Framing Brackets */}
      <div className="hud-corner top-left" aria-hidden="true" />
      <div className="hud-corner top-right" aria-hidden="true" />
      <div className="hud-corner bottom-left" aria-hidden="true" />
      <div className="hud-corner bottom-right" aria-hidden="true" />

      {/* Skip Button: Allow user to immediately jump to Home if desired */}
      {isAnimating && animState !== 'revealHome' && (
        <button
          type="button"
          className="journey-skip-btn"
          onClick={handleSkip}
          aria-label="Skip journey animation and enter TripPilot"
        >
          <span>Skip</span>
          <span className="skip-arrow">❯❯</span>
        </button>
      )}

      {/* ========================================================
          2. FLOATING "HAPPY JOURNEY, {FIRSTNAME}!" GREETING
         ======================================================== */}
      {showGreeting && (
        <div className="journey-greeting-banner" aria-live="polite">
          <div className="journey-greeting-glow" />
          <div className="journey-greeting-content">
            <span className="journey-greeting-badge">TRIPPILOT EXPEDITION</span>
            <h2 className="journey-greeting-title">
              Happy Journey, <span className="greeting-first-name">{getFirstName()}</span>!
            </h2>
            <p className="journey-greeting-subline">
              Wishing you safe and beautiful travels.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================
          3. GLOSSY WET ROAD WITH NEON CYAN STREAKS & PARALLAX
         ======================================================== */}
      <div className="neon-road-surface">
        <div className={`road-streaks-group ${isBusDriving ? 'road-parallax-active' : ''}`}>
          <div className="road-neon-streak line-1" />
          <div className="road-neon-streak line-2" />
          <div className="road-neon-streak line-3" />
          <div className="road-neon-streak line-4" />
          <div className="road-neon-streak line-5" />
          <div className="road-neon-streak line-6" />
        </div>
        <div className="road-wet-sheen" />
      </div>

      {/* Initial background bus preview (Frame 1 aesthetic) */}
      {!isAnimating && (
        <div className="backdrop-bus-preview" aria-hidden="true">
          <div className="bg-bus-faint" />
        </div>
      )}

      {/* ========================================================
          4. CINEMATIC LUXURY COACH BUS WITH ROTATING WHEELS,
             WET-ROAD REFLECTIONS, VOLUMETRIC LIGHT & TRAILING FLAG
         ======================================================== */}
      {isBusVisible && !reducedMotionActive && (
        <div
          className={`bus-journey-rig ${
            animState === 'busDriving' || animState === 'revealHome'
              ? 'bus-journey-active'
              : ''
          }`}
          onAnimationEnd={handleBusAnimationEnd}
          style={{ willChange: 'transform' }}
        >
          {/* TRAILING MAROON FABRIC FLAG ATTACHED TO COACH REAR */}
          <div className="bus-flag-assembly" aria-hidden="true">
            {/* Stainless steel mounting pole attached to coach bumper */}
            <div className="flag-mounting-pole" />
            <div className="flag-mounting-brackets">
              <span className="flag-bracket-bolt top" />
              <span className="flag-bracket-bolt bottom" />
            </div>

            {/* Waving Maroon Fabric Pennant Banner */}
            <div className="flag-cloth-wave">
              <svg
                className="flag-svg-banner"
                viewBox="0 0 340 106"
                preserveAspectRatio="none"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Rich Maroon / Burgundy fabric gradient */}
                  <linearGradient id="flagMaroonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#961727" />
                    <stop offset="35%" stopColor="#801220" />
                    <stop offset="70%" stopColor="#660C17" />
                    <stop offset="100%" stopColor="#4A060F" />
                  </linearGradient>

                  {/* Golden luxury border gradient */}
                  <linearGradient id="goldBorderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FDE68A" />
                    <stop offset="35%" stopColor="#F59E0B" />
                    <stop offset="70%" stopColor="#D97706" />
                    <stop offset="100%" stopColor="#FDE68A" />
                  </linearGradient>
                </defs>

                {/* Pennant Swallowtail Banner Contour */}
                <path
                  d="M 334,12
                     C 255,4 200,24 115,14
                     C 65,6 28,20 4,16
                     L 4,90
                     C 28,94 65,80 115,90
                     C 200,102 255,80 334,88
                     Z"
                  fill="url(#flagMaroonGrad)"
                  stroke="url(#goldBorderGrad)"
                  strokeWidth="2.8"
                  strokeLinejoin="round"
                />

                {/* Inner Gold Stitching Line */}
                <path
                  d="M 326,18
                     C 250,11 198,30 115,20
                     C 68,13 32,26 12,22
                     L 12,84
                     C 32,88 68,74 115,84
                     C 198,94 250,74 326,82
                     Z"
                  stroke="#FDE68A"
                  strokeWidth="1.2"
                  strokeDasharray="4 3"
                  fill="none"
                  opacity="0.85"
                />

                {/* 3D Fabric Fold Shadow Contours */}
                <path
                  d="M 115,14 C 132,36 132,68 115,90"
                  stroke="rgba(0, 0, 0, 0.45)"
                  strokeWidth="8"
                  fill="none"
                  opacity="0.75"
                />
                <path
                  d="M 225,18 C 242,38 242,70 225,86"
                  stroke="rgba(255, 255, 255, 0.22)"
                  strokeWidth="6"
                  fill="none"
                  opacity="0.7"
                />
              </svg>

              {/* Crisp Flag Typography & Golden Mountain Emblem */}
              <div className="flag-content-overlay">
                <div className="flag-mountain-icon-wrap">
                  <svg className="flag-mountain-icon" viewBox="0 0 52 36" fill="none">
                    <polygon
                      points="3,32 18,10 27,21 37,5 49,32"
                      fill="none"
                      stroke="#FDE68A"
                      strokeWidth="2.4"
                      strokeLinejoin="round"
                    />
                    <polygon points="12,18 18,10 24,20" fill="#FDE68A" opacity="0.95" />
                    <polygon points="31,12 37,5 43,15" fill="#FDE68A" opacity="0.95" />
                    <line x1="1" y1="33" x2="51" y2="33" stroke="#FDE68A" strokeWidth="2" />
                  </svg>
                </div>
                <div className="flag-typography">
                  <span className="flag-headline">THE WORLD IS A BOOK –</span>
                  <span className="flag-subline">EXPLORE EVERY PAGE.</span>
                </div>
              </div>

              {/* Specular Light Sheen Sweeping Across Fabric */}
              <div className="flag-fabric-shimmer" />
            </div>
          </div>

          {/* LUXURY COACH BUS RIG */}
          <div className="luxury-coach-bus bus-suspension-motion">
            {/* Soft Volumetric Headlight Projection Beam */}
            <div className="headlight-volumetric-beam" />

            {/* Coach Chassis Vector Art from public/assets/bus-coach.svg */}
            <img
              src="/assets/bus-coach.svg"
              alt="TripPilot Travels Luxury Coach"
              className="bus-vector-art"
              draggable="false"
            />

            {/* SEPARATE ROTATING REAR WHEEL WITH GLOWING NEON CYAN RING */}
            <div className="bus-wheel rear-wheel">
              <div className="wheel-rubber-tire" />
              <div className="cyan-neon-ring" />
              <div className="spinning-wheel-spokes" />
              <div className="wheel-hub-cap" />
              {/* Radial Cyan Glow on the Road Directly Under Wheel */}
              <div className="wheel-ground-neon-glow" />
              {/* Trailing tire mist particles */}
              <div className="wheel-mist-spray" />
            </div>

            {/* SEPARATE ROTATING FRONT WHEEL WITH GLOWING NEON CYAN RING */}
            <div className="bus-wheel front-wheel">
              <div className="wheel-rubber-tire" />
              <div className="cyan-neon-ring" />
              <div className="spinning-wheel-spokes" />
              <div className="wheel-hub-cap" />
              {/* Radial Cyan Glow on the Road Directly Under Wheel */}
              <div className="wheel-ground-neon-glow" />
              {/* Trailing tire mist particles */}
              <div className="wheel-mist-spray" />
            </div>

            {/* WET-ROAD REFLECTION OF THE BUS (FLIPPED, FADED, BLURRED) */}
            <div className="bus-wet-road-reflection" aria-hidden="true">
              <img
                src="/assets/bus-coach.svg"
                alt=""
                className="bus-reflection-art"
                draggable="false"
              />
              <div className="reflection-wheel rear-reflect">
                <div className="reflect-neon-ring" />
              </div>
              <div className="reflection-wheel front-reflect">
                <div className="reflect-neon-ring" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          5. PREMIUM GLASSMORPHIC LOGIN POPUP CARD
         ======================================================== */}
      <div
        className={`trippilot-login-popup-wrapper ${
          isCardFaded ? 'popup-fadeout' : ''
        }`}
      >
        <div className="login-glass-card">
          {/* Mountain Logo on Top */}
          <div className="brand-logo-container">
            <svg className="brand-mountain-svg" viewBox="0 0 48 32">
              <polygon points="4,28 18,10 26,18 34,6 44,28" fill="#801424" />
              <polygon points="14,15 18,10 24,17" fill="#FFFFFF" opacity="0.9" />
              <polygon points="30,11 34,6 38,13" fill="#FFFFFF" opacity="0.9" />
              <path d="M 0,29 Q 24,24 48,29" stroke="#E2E8F0" strokeWidth="2" fill="none" />
            </svg>
            <h1 className="brand-card-title">TripPilot Travels</h1>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="card-mode-toggle-tabs">
            <button
              type="button"
              className={`mode-tab-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setMode('login');
                setErrorMessage('');
              }}
            >
              Login
            </button>
            <button
              type="button"
              className={`mode-tab-btn ${mode === 'register' ? 'active' : ''}`}
              onClick={() => {
                setMode('register');
                setErrorMessage('');
              }}
            >
              Create an Account
            </button>
            <div className={`tab-indicator-pill ${mode}`} />
          </div>

          <div className="login-card-headings">
            <h2 className="welcome-back-heading">
              {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
            </h2>
            <p className="login-sub-heading">
              {mode === 'login'
                ? 'Login to continue your journey'
                : 'Join TripPilot for worldwide adventures'}
            </p>
          </div>

          {/* Error feedback */}
          {errorMessage && (
            <div className="login-error-toast" role="alert">
              <span>⚠️ {errorMessage}</span>
            </div>
          )}

          {/* Form */}
          {mode === 'login' ? (
            <form className="login-popup-form" onSubmit={handleLoginSubmit} noValidate>
              <div className="popup-input-field">
                <span className="field-input-icon">
                  <UserIcon size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Email or Mobile Number"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="popup-input-field">
                <span className="field-input-icon">
                  <Lock size={16} />
                </span>
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="pw-toggle-action"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                >
                  {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="popup-options-row">
                <label className="remember-me-toggle">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  className="forgot-pw-action"
                  onClick={() => setForgotModalOpen(true)}
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                className="maroon-login-btn"
                disabled={loading}
              >
                <span className="btn-shine-sweep" />
                {loading ? (
                  <span className="btn-loading-flex">
                    <span className="login-btn-spinner" /> Verifying...
                  </span>
                ) : (
                  <span>Login</span>
                )}
              </button>

              <div className="create-account-prompt">
                <button
                  type="button"
                  className="create-account-btn"
                  onClick={() => {
                    setMode('register');
                    setErrorMessage('');
                  }}
                >
                  Create an Account
                </button>
              </div>
            </form>
          ) : (
            /* Registration Form */
            <form className="login-popup-form" onSubmit={handleRegisterSubmit} noValidate>
              <div className="popup-input-field">
                <span className="field-input-icon">
                  <UserIcon size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="popup-input-field">
                <span className="field-input-icon">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  placeholder="Email or Mobile Number"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="popup-input-field">
                <span className="field-input-icon">
                  <Lock size={16} />
                </span>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="pw-toggle-action"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                >
                  {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="popup-input-field">
                <span className="field-input-icon">
                  <Lock size={16} />
                </span>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              <button
                type="submit"
                className="maroon-login-btn"
                disabled={loading}
              >
                <span className="btn-shine-sweep" />
                {loading ? (
                  <span className="btn-loading-flex">
                    <span className="login-btn-spinner" /> Creating...
                  </span>
                ) : (
                  <span>Create an Account</span>
                )}
              </button>

              <div className="create-account-prompt">
                <button
                  type="button"
                  className="create-account-btn"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage('');
                  }}
                >
                  Already have an account? Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="forgot-modal-backdrop" onClick={() => setForgotModalOpen(false)}>
          <div className="forgot-modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Reset Your Password</h3>
            <p className="modal-text">
              Enter your registered email address to receive password reset instructions.
            </p>
            <input
              type="email"
              className="modal-email-box"
              placeholder="Enter your registered email"
              defaultValue={loginEmail}
            />
            <div className="modal-btn-row">
              <button
                type="button"
                className="modal-btn cancel"
                onClick={() => setForgotModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-btn confirm"
                onClick={() => {
                  alert('Password reset instructions sent if this email is registered.');
                  setForgotModalOpen(false);
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          6. CINEMATIC VEIL TRANSITION INTO HOME PAGE
         ======================================================== */}
      <div
        className={`cinematic-home-transition-veil ${
          animState === 'revealHome' ? 'veil-active' : ''
        }`}
      >
        <div className="cinematic-lens-bloom" />
      </div>
    </div>
  );
};

export default AuthPage;
