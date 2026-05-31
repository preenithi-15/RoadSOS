/**
 * Dead-Zone SOS — offline detection and SOS caching.
 *
 * When a crash is detected with no signal, the SOS parameters are stored in
 * localStorage. When connectivity returns, this module fires the cached SOS
 * via the /api/sos/cached endpoint with the correct delivery method.
 */

const BASE = 'https://roadsos-backend.vercel.app'
const CACHE_KEY = 'roadsos_cached_sos'

/** Returns the current network connectivity state. */
export function isOnline() {
  return navigator.onLine
}

/**
 * Determine which delivery layer is available right now.
 * In a real device: check BLE, 2G, satellite availability.
 * For demo: simulate based on connection type (if available).
 */
export function detectDeliveryLayer() {
  if (!navigator.onLine) return 'CACHE_FORWARD'

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  if (!conn) return 'DIRECT'

  const type = conn.effectiveType || conn.type || ''
  if (type === '2g' || type === 'slow-2g') return 'TWO_G_SMS'
  if (type === '3g') return 'DIRECT'
  return 'DIRECT'
}

/** Store an SOS locally when the device has no signal. */
export function cacheSOS({ user_id, lat, lng, g_force, speed_kmh }) {
  const payload = {
    user_id, lat, lng, g_force, speed_kmh,
    cached_at: new Date().toISOString(),
    delivery_method: detectDeliveryLayer(),
  }
  localStorage.setItem(CACHE_KEY, JSON.stringify(payload))
  return payload
}

/** Check if there's a cached SOS waiting to be fired. */
export function hasCachedSOS() {
  return Boolean(localStorage.getItem(CACHE_KEY))
}

/** Get the cached SOS without removing it. */
export function getCachedSOS() {
  const raw = localStorage.getItem(CACHE_KEY)
  return raw ? JSON.parse(raw) : null
}

/** Fire the cached SOS now and clear it from storage. */
export async function fireCachedSOS() {
  const cached = getCachedSOS()
  if (!cached) return null

  try {
    const res = await fetch(`${BASE}/api/sos/cached`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cached),
    })
    const result = await res.json()
    localStorage.removeItem(CACHE_KEY)
    return result
  } catch (err) {
    console.error('[offline] cached SOS fire failed:', err)
    return null
  }
}

/**
 * Register a listener that fires cached SOS when connectivity returns.
 * Returns a cleanup function.
 */
export function watchForRecovery(onFired) {
  const handler = async () => {
    if (hasCachedSOS()) {
      const result = await fireCachedSOS()
      if (result?.sos_id && onFired) onFired(result)
    }
  }
  window.addEventListener('online', handler)
  // Also check immediately in case we're already back online
  if (navigator.onLine && hasCachedSOS()) {
    setTimeout(handler, 500)
  }
  return () => window.removeEventListener('online', handler)
}

/** Clear any cached SOS (user cancelled). */
export function clearCachedSOS() {
  localStorage.removeItem(CACHE_KEY)
}
