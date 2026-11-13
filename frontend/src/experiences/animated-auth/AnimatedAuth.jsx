import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Volume2, VolumeX, FastForward, RotateCcw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import VideoPlayer from './VideoPlayer';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import BrandOverlay from './BrandOverlay';
import { VIDEO_CUES, AUTH_STATES, TRANSITION_DURATIONS } from './animations';
import './auth.css';

/**
 * AnimatedAuth: Master Cinematic Authentication Experience
 * Synchronizes 4K luxury coach video playback with interactive
 * glassmorphic passenger-window login and registration.
 */
const AnimatedAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated, user, loading: authLoading } = useAuth();

  // Determine initial mode from query string (/login or /register)
  const isRegisterRoute = location.pathname.includes('register') ||
    new URLSearchParams(location.search).get('tab') === 'register';
  const [mode, setMode] = useState(isRegisterRoute ? 'register' : 'login');

  // Master State Machine: intro -> auth_ready -> submitting -> success -> outro -> completed
  const [authState, setAuthState] = useState(AUTH_STATES.INTRO);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [veilActive, setVeilActive] = useState(false);

  const videoPlayerRef = useRef(null);
  const hasPausedAtAuthRef = useRef(false);
  const authenticatedNameRef = useRef('');

  // If user is already authenticated when opening /login, proceed directly to main site
  useEffect(() => {
    if (isAuthenticated && authState === AUTH_STATES.INTRO && !authLoading) {
      // User is already logged in, navigate straight to home
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, authState, authLoading, navigate]);

  // Synchronized video time monitor
  const handleTimeUpdate = useCallback((time) => {
    setCurrentTime(time);

    // Stop video cleanly at the stabilized passenger-window scene (10.8s)
    if (
      !hasPausedAtAuthRef.current &&
      time >= VIDEO_CUES.AUTH_PAUSE_TIME &&
      authState === AUTH_STATES.INTRO
    ) {
      hasPausedAtAuthRef.current = true;
      if (videoPlayerRef.current) {
        videoPlayerRef.current.pause();
      }
      setAuthState(AUTH_STATES.AUTH_READY);
    }
  }, [authState]);

  // Skip Intro directly to the Passenger Window Auth Card
  const handleSkipIntro = () => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.seek(VIDEO_CUES.AUTH_PAUSE_TIME);
      videoPlayerRef.current.pause();
    }
    hasPausedAtAuthRef.current = true;
    setCurrentTime(VIDEO_CUES.AUTH_PAUSE_TIME);
    setAuthState(AUTH_STATES.AUTH_READY);
  };

  // Replay Intro sequence
  const handleReplayIntro = () => {
    hasPausedAtAuthRef.current = false;
    setAuthState(AUTH_STATES.INTRO);
    if (videoPlayerRef.current) {
      videoPlayerRef.current.seek(0);
      videoPlayerRef.current.play();
    }
  };

  // Handle Login submission
  const handleLoginSubmit = async ({ email, password, rememberMe }) => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await login({ email, password, rememberMe });
      const userName = res?.user?.name || email.split('@')[0];
      authenticatedNameRef.current = userName;
      triggerDepartureSequence();
    } catch (err) {
      console.error('Authentication failed:', err);
      const msg = err.response?.data?.message || err.message || 'Invalid credentials. Please try again.';
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  // Handle Registration submission
  const handleRegisterSubmit = async ({ name, email, password }) => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await register({ name, email, password });
      const userName = res?.user?.name || name;
      authenticatedNameRef.current = userName;
      triggerDepartureSequence();
    } catch (err) {
      console.error('Registration failed:', err);
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  // Trigger post-auth departure sequence
  const triggerDepartureSequence = () => {
    setIsSubmitting(false);
    setAuthState(AUTH_STATES.SUCCESS);

    // After brief celebration display, resume video to departure from exactly 10.8s
    setTimeout(() => {
      setAuthState(AUTH_STATES.OUTRO);
      if (videoPlayerRef.current) {
        // Resume video smoothly through departure from exactly 10.8s
        videoPlayerRef.current.seek(VIDEO_CUES.AUTH_PAUSE_TIME);
        videoPlayerRef.current.play();
      }
    }, TRANSITION_DURATIONS.SUCCESS_BANNER_MS);
  };

  // Video playback completion handler
  const handleVideoEnded = () => {
    const destination = location.state?.from?.pathname || '/';
    // Activate cinematic veil fade and navigate to destination
    setVeilActive(true);
    setTimeout(() => {
      navigate(destination, { replace: true });
    }, TRANSITION_DURATIONS.CINEMATIC_VEIL_MS);
  };

  return (
    <div className="animated-auth-container">
      {/* 1. Cinematic Background Video Engine */}
      <VideoPlayer
        ref={videoPlayerRef}
        src="/videos/cinematic-bus.mp4"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnded}
        isMuted={isMuted}
      />

      {/* 2. Motion-Tracked Brand Compositing Layer */}
      <BrandOverlay currentTime={currentTime} authState={authState} />

      {/* 3. Top HUD Navigation & Quick Controls */}
      <header className="auth-hud-top">
        <div className="hud-logo">
          <svg className="auth-logo-svg" viewBox="0 0 36 22" fill="none">
            <path d="M3 19L13 5L21 14L27 8L34 19H3Z" fill="#b91c1c" />
            <path d="M10 19L16 11L22 17L28 10L33 19" stroke="#ffffff" strokeWidth="1.5" />
          </svg>
          <span>TripPilot</span>
        </div>

        <div className="hud-actions">
          {/* Mute Toggle */}
          <button
            type="button"
            className="hud-button"
            onClick={() => setIsMuted((prev) => !prev)}
            aria-label={isMuted ? 'Unmute cinematic audio' : 'Mute cinematic audio'}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            <span>{isMuted ? 'Muted' : 'Audio On'}</span>
          </button>

          {/* Skip Intro button (Visible during arrival sequence) */}
          {authState === AUTH_STATES.INTRO && (
            <button
              type="button"
              className="hud-button skip-btn"
              onClick={handleSkipIntro}
              aria-label="Skip video intro and open login"
            >
              <FastForward size={15} />
              <span>Skip to Login</span>
            </button>
          )}

          {/* Replay button (Visible when paused at window) */}
          {authState === AUTH_STATES.AUTH_READY && (
            <button
              type="button"
              className="hud-button"
              onClick={handleReplayIntro}
              aria-label="Replay arrival sequence"
            >
              <RotateCcw size={15} />
              <span>Replay Intro</span>
            </button>
          )}
        </div>
      </header>

      {/* 4. Passenger Window Authentication Viewport */}
      {(authState === AUTH_STATES.AUTH_READY ||
        authState === AUTH_STATES.SUBMITTING ||
        authState === AUTH_STATES.SUCCESS) && (
        <main className="passenger-window-viewport">
          <div
            className={`passenger-window-card ${
              authState === AUTH_STATES.OUTRO ? 'fading-out' : ''
            }`}
          >
            {authState === AUTH_STATES.SUCCESS ? (
              // Success Greeting State
              <div className="auth-success-card">
                <div className="success-icon-badge">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="success-title">
                  Welcome Aboard,{' '}
                  <span className="success-name-highlight">
                    {authenticatedNameRef.current || 'Traveler'}
                  </span>
                  !
                </h3>
                <p className="success-desc">
                  Boarding pass confirmed. Resuming your TripPilot journey...
                </p>
                <div className="success-progress-bar">
                  <div className="progress-inner" />
                </div>
              </div>
            ) : mode === 'login' ? (
              // Login Mode
              <LoginForm
                onSubmit={handleLoginSubmit}
                onSwitchToRegister={() => {
                  setErrorMessage('');
                  setMode('register');
                }}
                loading={isSubmitting}
                errorMessage={errorMessage}
              />
            ) : (
              // Register Mode
              <RegisterForm
                onSubmit={handleRegisterSubmit}
                onSwitchToLogin={() => {
                  setErrorMessage('');
                  setMode('login');
                }}
                loading={isSubmitting}
                errorMessage={errorMessage}
              />
            )}
          </div>
        </main>
      )}

      {/* 5. Bottom Status HUD */}
      <footer className="auth-hud-bottom">
        <div className="hud-phase-tag">
          <span className="hud-phase-dot" />
          <span>
            {authState === AUTH_STATES.INTRO && 'Arriving at Mountain Station...'}
            {authState === AUTH_STATES.AUTH_READY && 'Boarding Gate Open — Passenger Window'}
            {authState === AUTH_STATES.SUBMITTING && 'Validating Credentials...'}
            {authState === AUTH_STATES.SUCCESS && 'Boarding Confirmed!'}
            {authState === AUTH_STATES.OUTRO && 'Departing towards Destination...'}
          </span>
        </div>
        <div>TripPilot Express • Luxury Touring Coach</div>
      </footer>

      {/* 6. Cinematic Veil (Final seamless fade to independent website) */}
      <div className={`cinematic-veil ${veilActive ? 'active' : ''}`} />
    </div>
  );
};

export default AnimatedAuth;
