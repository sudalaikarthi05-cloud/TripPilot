/**
 * TripPilot Cinematic Authentication Experience
 * Master Timings, Video Timestamp Cues & Animation Configuration
 */

export const VIDEO_CUES = {
  // Scene 1: Arrival & Stop (0.0s - 4.5s)
  ARRIVAL_START: 0.0,
  BUS_STOPPED: 4.2,

  // Scene 2: Camera Zoom towards Passenger Window (4.5s - 7.8s)
  ZOOM_START: 4.5,
  WINDOW_CONTACT: 7.2,

  // Scene 3: Cabin Interior Transition (7.8s - 10.8s)
  CABIN_ENTER: 7.8,
  CABIN_STABILIZED: 10.5,

  // Scene 4: Exact Auth Moment (Video pauses here for login/registration)
  AUTH_PAUSE_TIME: 10.8,

  // Scene 5: Post-Auth Departure (Video resumes upon success)
  CABIN_EXIT_START: 11.2,
  EXTERIOR_REVEAL: 13.5,

  // Scene 6 & 7: Bus Acceleration & Waving Banner
  ACCELERATE_START: 14.0,
  BANNER_DEPLOY: 17.0,
  BUS_EXIT: 22.0,

  // Total Sequence Duration
  TOTAL_DURATION: 22.8,
};

export const AUTH_STATES = {
  IDLE: 'idle',                     // Waiting to start or initial render
  INTRO: 'intro',                   // Playing arrival and zoom sequence (0.0s -> 10.8s)
  AUTH_READY: 'auth_ready',         // Paused at window, form visible and interactive
  SUBMITTING: 'submitting',         // Submitting credentials to backend
  SUCCESS: 'success',               // Auth succeeded, celebrating and preparing departure
  OUTRO: 'outro',                   // Playing departure sequence (10.8s -> 22.8s)
  COMPLETED: 'completed',           // Journey finished, navigating to application
};

export const TRANSITION_DURATIONS = {
  FORM_FADE_IN_MS: 600,
  FORM_FADE_OUT_MS: 500,
  SUCCESS_BANNER_MS: 1800,
  CINEMATIC_VEIL_MS: 800,
};
