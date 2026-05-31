/**
 * RoadSoS — Real API client
 * All calls go to the live production backend.
 */

const BASE = 'https://roadsos-backend.vercel.app'

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`)
  return res.json()
}

// ── Feature 01 + 02 — SOS ────────────────────────────────
export async function triggerSOS({ user_id, lat, lng, g_force = 8.2, speed_kmh = 0, acoustic_match = true }) {
  return post('/api/sos/trigger', { user_id, lat, lng, g_force, speed_kmh, acoustic_match })
}

export async function cancelSOS({ sos_event_id, user_id }) {
  return post('/api/sos/cancel', { sos_event_id, user_id })
}

// ── Feature 05 — Triage ──────────────────────────────────
export async function classifyTriage({ sos_event_id, priority, indicators = [] }) {
  return post('/api/triage/classify', { sos_event_id, priority, indicators })
}

// ── Feature 03 — LifeLine ────────────────────────────────
export async function saveLifelineProfile({ user_id, blood_group, allergies, conditions, emergency_contact_name, emergency_contact_phone, insurance_reference }) {
  return post('/api/lifeline/register', { user_id, blood_group, allergies, conditions, emergency_contact_name, emergency_contact_phone, insurance_reference })
}

export async function getLifelineByToken(qr_token) {
  return get(`/api/lifeline/${qr_token}`)
}

// ── Feature 06 — Bystander ───────────────────────────────
export async function confirmBystander({ sos_event_id, user_id, status, capability_level, eta_seconds }) {
  return post('/api/bystander/confirm', { sos_event_id, user_id, status, capability_level, eta_seconds })
}

// ── Feature 07 — Black Box ───────────────────────────────
export async function fileBlackBox({ sos_event_id, user_id, lat, lng, g_force, speed_kmh }) {
  return post('/api/blackbox/file', { sos_event_id, user_id, lat, lng, g_force, speed_kmh })
}

// ── Feature 08 — Hospital ────────────────────────────────
export async function getHospitalRoute({ sos_event_id, lat, lng, blood_group, triage_priority }) {
  return post('/api/hospital/find', { sos_event_id, lat, lng, blood_group, triage_priority })
}

// ── Dead-Zone SOS ────────────────────────────────────────
export async function fireCachedSOS({ user_id, lat, lng, g_force, speed_kmh, cached_at, delivery_method, relay_device_id }) {
  return post('/api/sos/cached', { user_id, lat, lng, g_force, speed_kmh, cached_at, delivery_method, relay_device_id })
}

// ── Feature 09/10 — Living Map ───────────────────────────
export async function getHazardNodes({ lat, lng, radius_km = 50 }) {
  return get(`/api/hazard/nodes?lat=${lat}&lng=${lng}&radius_km=${radius_km}`)
}

export async function reportBrake({ user_id, lat, lng, event_type = 'BRAKE' }) {
  return post('/api/hazard/report-brake', { user_id, lat, lng, event_type })
}

export async function getNhaiReport(days = 30) {
  return get(`/api/hazard/nhai-report?days=${days}`)
}

// ── Feature 10 — Responders ──────────────────────────────
export async function getNearbyResponders({ lat, lng, radius_km = 30 }) {
  return get(`/api/responder/nearby?lat=${lat}&lng=${lng}&radius_km=${radius_km}`)
}

export async function dispatchResponders({ sos_event_id, lat, lng }) {
  return post('/api/responder/dispatch', { sos_event_id, lat, lng })
}

// ── Trip Safety Agent ────────────────────────────────────
export async function planTrip({ user_id, origin, destination, extra_checkpoints = [] }) {
  return post('/api/agent/plan', { user_id, origin, destination, extra_checkpoints })
}

export async function getTrip(trip_id) {
  return get(`/api/agent/${trip_id}`)
}

export async function addTripCheckpoint({ trip_id, lat, lng, name, insert_after_index = -1 }) {
  return post('/api/agent/checkpoint', { trip_id, lat, lng, name, insert_after_index })
}

export async function removeTripCheckpoint(checkpoint_id) {
  return fetch(`${BASE}/api/agent/checkpoint`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ checkpoint_id }),
  }).then(r => r.json())
}

// ── Emergency Contacts (Police, Ambulance, Towing, Tyres) ─
export async function getEmergencyContacts({ lat, lng, radius_km = 15, category = 'ALL' }) {
  return get(`/api/emergency/nearby?lat=${lat}&lng=${lng}&radius_km=${radius_km}&category=${category}`)
}

// ── Community Reports ─────────────────────────────────────
export async function getCommunityReports({ lat, lng, radius_km = 30 }) {
  return get(`/api/community/reports?lat=${lat}&lng=${lng}&radius_km=${radius_km}`)
}

// ── Trip Agent — extras ───────────────────────────────────
export async function liveRefreshTrip(trip_id) {
  return post('/api/agent/live-refresh', { trip_id })
}

export async function checkProximity({ trip_id, user_id, user_lat, user_lng }) {
  return post('/api/agent/proximity', { trip_id, user_id, user_lat, user_lng })
}

export async function getTripOfflineCache(trip_id) {
  return get(`/api/agent/offline-cache?trip_id=${trip_id}`)
}

// ── Auth ──────────────────────────────────────────────────
export async function setLanguage({ user_id, language }) {
  return post('/api/auth/language', { user_id, language })
}

// ── Responder registration ────────────────────────────────
export async function registerResponder(formData) {
  const res = await fetch(`${BASE}/api/responder/register`, { method: 'POST', body: formData })
  return res.json()
}

// ── Voice analysis ────────────────────────────────────────
export async function analyzeVoice({ sos_event_id, audio_base64, sample_rate = 8000 }) {
  return post('/api/triage/analyze-voice', { sos_event_id, audio_base64, sample_rate })
}

// Health
export async function getHealth() {
  return get('/api/health')
}
