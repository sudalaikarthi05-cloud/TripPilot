import React from 'react';
import { VIDEO_CUES, AUTH_STATES } from './animations';

/**
 * BrandOverlay: High-fidelity TripPilot branding compositing layer
 * Replaces reference bus signage and side lettering with TripPilot branding,
 * matching vehicle perspective, motion timing, and interior luxury aesthetics.
 */
const BrandOverlay = ({ currentTime, authState }) => {
  // 1. Exterior Arrival (0.8s - 7.5s)
  const isExteriorArrival = currentTime >= 0.8 && currentTime < VIDEO_CUES.CABIN_ENTER;
  // 2. Interior Cabin (7.5s - 13.5s)
  const isInterior = currentTime >= VIDEO_CUES.CABIN_ENTER && currentTime < VIDEO_CUES.EXTERIOR_REVEAL;
  // 3. Exterior Departure (13.5s - 22.8s)
  const isExteriorDeparture = currentTime >= VIDEO_CUES.EXTERIOR_REVEAL && currentTime < VIDEO_CUES.BUS_EXIT;

  // Arrival / Stop calculation (0.8s to 4.2s to 7.5s)
  let arrivalX = 36;
  let arrivalY = 36.5;
  let arrivalScale = 0.85;
  let arrivalOpacity = 1;

  if (currentTime < 4.2) {
    // Bus slowing down to stop position
    const p = Math.min(1, Math.max(0, (currentTime - 0.8) / 3.4));
    arrivalX = 22 + p * 23; // moves from 22% to 45%
    arrivalY = 36 + p * 2;  // road slope
    arrivalScale = 0.75 + p * 0.25;
    arrivalOpacity = Math.min(1, p * 2.5);
  } else if (currentTime >= 4.2 && currentTime <= 4.8) {
    // Bus stationary at stop
    arrivalX = 45;
    arrivalY = 38;
    arrivalScale = 1.0;
    arrivalOpacity = 1;
  } else if (currentTime > 4.8 && currentTime < 7.5) {
    // Camera zoom push-in toward passenger window
    const p = (currentTime - 4.8) / (7.5 - 4.8);
    arrivalX = 45 - p * 35;
    arrivalY = 38 - p * 15;
    arrivalScale = 1.0 + p * 0.5;
    arrivalOpacity = Math.max(0, 1 - p * 1.5);
  }

  // Departure calculation (13.5s to 22.5s)
  let departX = 45;
  let departY = 38;
  let departScale = 1.0;
  let departOpacity = 1;

  if (isExteriorDeparture) {
    const p = Math.min(1, Math.max(0, (currentTime - 13.5) / (22.5 - 13.5)));
    departX = 45 + p * 45; // moves from 45% to 90% across screen
    departY = 38 - p * 4;  // highway perspective
    departScale = 1.0 - p * 0.35; // recedes in distance
    departOpacity = p > 0.85 ? Math.max(0, 1 - (p - 0.85) / 0.15) : 1;
  }

  return (
    <div className="trippilot-brand-overlay-container" aria-hidden="true">
      {/* 1. Exterior Arrival: Roofline & Side Decal */}
      {isExteriorArrival && arrivalOpacity > 0 && (
        <>
          {/* Roof Plate */}
          <div
            className="brand-roof-plate"
            style={{
              left: `${arrivalX}%`,
              top: `${arrivalY}%`,
              opacity: arrivalOpacity,
              transform: `translate(-50%, -50%) scale(${arrivalScale})`,
            }}
          >
            <div className="brand-badge-wrapper">
              <svg
                className="brand-mountain-svg"
                viewBox="0 0 40 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 20L15 6L23 15L29 9L38 20H4Z"
                  fill="url(#mountainGrad)"
                />
                <path
                  d="M12 20L18 12L24 18L30 11L36 20"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="mountainGrad" x1="4" y1="20" x2="38" y2="6">
                    <stop offset="0%" stopColor="#8b1e2b" />
                    <stop offset="100%" stopColor="#1e293b" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="brand-text-group">
                <span className="brand-title">TripPilot</span>
                <span className="brand-subtitle">Travels</span>
              </div>
            </div>
          </div>

          {/* Side Body Decal: Covers old operator lettering on the lower side panel */}
          <div
            className="brand-side-decal"
            style={{
              left: `${arrivalX - 2}%`,
              top: `${arrivalY + 16}%`,
              opacity: arrivalOpacity * 0.95,
              transform: `translate(-50%, -50%) scale(${arrivalScale * 0.9})`,
            }}
          >
            <div className="brand-side-badge-wrapper">
              <div className="side-decal-swoosh" />
              <span className="side-decal-title">TripPilot</span>
              <span className="side-decal-tag">Express</span>
            </div>
          </div>
        </>
      )}

      {/* 2. Cabin Interior Ambient Signet */}
      {isInterior && authState !== AUTH_STATES.AUTH_READY && (
        <div className="brand-interior-signet">
          <div className="signet-badge">
            <span className="signet-icon">✦</span>
            <span className="signet-text">TripPilot Luxury Class</span>
          </div>
        </div>
      )}

      {/* 3. Exterior Departure: Roofline & Side Decal */}
      {isExteriorDeparture && departOpacity > 0 && (
        <>
          {/* Departure Roof Plate */}
          <div
            className="brand-roof-plate"
            style={{
              left: `${departX}%`,
              top: `${departY}%`,
              opacity: departOpacity,
              transform: `translate(-50%, -50%) scale(${departScale})`,
            }}
          >
            <div className="brand-badge-wrapper">
              <svg
                className="brand-mountain-svg"
                viewBox="0 0 40 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 20L15 6L23 15L29 9L38 20H4Z"
                  fill="url(#mountainGradDep)"
                />
                <defs>
                  <linearGradient id="mountainGradDep" x1="4" y1="20" x2="38" y2="6">
                    <stop offset="0%" stopColor="#8b1e2b" />
                    <stop offset="100%" stopColor="#1e293b" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="brand-text-group">
                <span className="brand-title">TripPilot</span>
                <span className="brand-subtitle">Travels</span>
              </div>
            </div>
          </div>

          {/* Departure Side Body Decal */}
          <div
            className="brand-side-decal"
            style={{
              left: `${departX - 2}%`,
              top: `${departY + 16}%`,
              opacity: departOpacity * 0.95,
              transform: `translate(-50%, -50%) scale(${departScale * 0.9})`,
            }}
          >
            <div className="brand-side-badge-wrapper">
              <div className="side-decal-swoosh" />
              <span className="side-decal-title">TripPilot</span>
              <span className="side-decal-tag">Express</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default React.memo(BrandOverlay);
