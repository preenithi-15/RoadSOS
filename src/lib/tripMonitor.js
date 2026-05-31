/**
 * Trip Safety Monitor — proximity alerts + offline cache.
 *
 * When a trip is active, this module watches the user's GPS position and fires
 * an alert when they come within ALERT_RADIUS_KM of a high-risk checkpoint.
 * All checkpoint precautions are cached in localStorage so warnings work even
 * with no signal (same pattern as Dead-Zone SOS).
 */

import { watchLocation } from './location.js';

const ALERT_RADIUS_KM = 0.8;   // warn 800m before the risk zone
const CACHE_KEY = 'roadsos_active_trip';
const ALERTED_KEY = 'roadsos_alerted_checkpoints';

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Cache the full trip (checkpoints + precautions) for offline access. */
export function cacheTrip(trip, checkpoints) {
  const payload = {
    trip_id: trip.trip_id || trip.id,
    origin: trip.origin,
    destination: trip.destination,
    general_precautions: trip.general_precautions || [],
    checkpoints: checkpoints
      .filter(c => c.risk_level !== 'LOW' || c.risk_score > 0.2)
      .map(c => ({
        id: c.id,
        name: c.name,
        lat: c.lat,
        lng: c.lng,
        risk_level: c.risk_level,
        risk_score: c.risk_score,
        precautions: c.precautions || [],
        arrived: false,
      })),
    cached_at: new Date().toISOString(),
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  localStorage.removeItem(ALERTED_KEY);
  return payload;
}

/** Get the cached active trip. */
export function getCachedTrip() {
  const raw = localStorage.getItem(CACHE_KEY);
  return raw ? JSON.parse(raw) : null;
}

/** Clear the active trip cache. */
export function clearTripCache() {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(ALERTED_KEY);
}

/** Mark a checkpoint as arrived so we don't re-alert. */
function markAlerted(id) {
  const raw = localStorage.getItem(ALERTED_KEY);
  const set = raw ? JSON.parse(raw) : [];
  if (!set.includes(id)) {
    set.push(id);
    localStorage.setItem(ALERTED_KEY, JSON.stringify(set));
  }
}

function wasAlerted(id) {
  const raw = localStorage.getItem(ALERTED_KEY);
  const set = raw ? JSON.parse(raw) : [];
  return set.includes(id);
}

/**
 * Start proximity monitoring for the active cached trip.
 * Calls onAlert({ checkpoint, distance_km }) when the user enters a risk zone.
 * Returns a cleanup function.
 */
export function startProximityMonitor(onAlert) {
  const trip = getCachedTrip();
  if (!trip || !trip.checkpoints?.length) return () => {};

  const stopWatch = watchLocation((pos) => {
    const { lat, lng } = pos;
    for (const cp of trip.checkpoints) {
      if (cp.arrived || wasAlerted(cp.id)) continue;
      if (cp.risk_level === 'LOW' && cp.risk_score < 0.3) continue;

      const dist = haversine(lat, lng, cp.lat, cp.lng);
      if (dist <= ALERT_RADIUS_KM) {
        markAlerted(cp.id);
        onAlert({ checkpoint: cp, distance_km: dist });
      }
    }
  });

  return stopWatch;
}

/** Get all checkpoints sorted by distance from a position (for "next stop" display). */
export function getNextCheckpoints(lat, lng, count = 3) {
  const trip = getCachedTrip();
  if (!trip) return [];
  return trip.checkpoints
    .filter(c => !wasAlerted(c.id))
    .map(c => ({ ...c, distance_km: haversine(lat, lng, c.lat, c.lng) }))
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, count);
}
