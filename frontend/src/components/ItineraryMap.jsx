import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FALLBACK_IMAGE } from '../utils/destinationData';
import './ItineraryMap.css';

const DAY_COLORS = ['#173D32', '#C69239', '#2A6F5A', '#8C5E28', '#3D5A80', '#D97706'];

const ItineraryMap = ({ days = [], activeDay = null, center = { lat: 0, lng: 0 } }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  // Initialize Map Once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLat = center?.lat || 20.0;
    const initialLng = center?.lng || 0.0;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 12,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    layerGroupRef.current = layerGroup;

    // Fix map sizing on resize
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers and Polyline whenever days or activeDay changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const filteredDays = activeDay === null
      ? days
      : days.filter(d => d.dayNumber === activeDay);

    const allLatLngs = [];

    filteredDays.forEach((day, dayIdx) => {
      const color = DAY_COLORS[(day.dayNumber - 1) % DAY_COLORS.length];
      const dayStops = [];
      const activities = day.activities || [];

      activities.forEach((act, stopIdx) => {
        if (typeof act.lat === 'number' && typeof act.lng === 'number' && !isNaN(act.lat) && !isNaN(act.lng)) {
          const latlng = [act.lat, act.lng];
          dayStops.push(latlng);
          allLatLngs.push(latlng);

          const pinNumber = stopIdx + 1;
          const markerIcon = L.divIcon({
            className: 'itin-custom-pin-wrap',
            html: `
              <div class="itin-custom-pin" style="background-color: ${color};">
                <span>${pinNumber}</span>
              </div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, -16],
          });

          const popupContent = `
            <div class="itin-map-popup">
              ${act.image ? `<img src="${act.image}" alt="${act.placeName}" class="itin-map-popup-img" onerror="this.src='${FALLBACK_IMAGE}'" />` : ''}
              <div class="itin-map-popup-body">
                <span class="itin-map-popup-badge" style="color: ${color}">Day ${day.dayNumber} • Stop ${pinNumber}</span>
                <h4 class="itin-map-popup-title">${act.placeName}</h4>
                ${act.time ? `<p class="itin-map-popup-time">⏰ ${act.time} (${act.suggestedDuration || '1-2 hrs'})</p>` : ''}
                ${act.estimatedTravelTimeFromPrevious ? `<p class="itin-map-popup-travel">🚗 ${act.estimatedTravelTimeFromPrevious}</p>` : ''}
                ${act.openingHours ? `<p class="itin-map-popup-hours">🕒 ${act.openingHours}</p>` : '<p class="itin-map-popup-hours text-muted">🕒 Opening hours: Not available</p>'}
                ${act.address ? `<p class="itin-map-popup-addr">📍 ${act.address}</p>` : ''}
              </div>
            </div>
          `;

          const marker = L.marker(latlng, { icon: markerIcon }).bindPopup(popupContent);
          layerGroup.addLayer(marker);
        }
      });

      // Connect stops of this day with a styled polyline
      if (dayStops.length > 1) {
        const polyline = L.polyline(dayStops, {
          color: color,
          weight: 4,
          opacity: 0.8,
          dashArray: '6, 8',
          lineCap: 'round',
        });
        layerGroup.addLayer(polyline);
      }
    });

    if (allLatLngs.length > 0) {
      const bounds = L.latLngBounds(allLatLngs);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else if (center?.lat && center?.lng) {
      map.setView([center.lat, center.lng], 12);
    }
  }, [days, activeDay, center]);

  return (
    <div className="itin-map-wrapper">
      <div ref={mapContainerRef} className="itin-leaflet-container" />
      <div className="itin-map-attribution-note">
        Map data &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors
      </div>
    </div>
  );
};

export default ItineraryMap;

