// Chennai default — used when GPS is unavailable or denied
export const DEFAULT_LOCATION = { lat: 13.0827, lng: 80.2707 }

/** One-shot GPS read. Resolves to {lat, lng}. Falls back to Chennai on error. */
export function getLocation(timeout = 8000) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(DEFAULT_LOCATION)
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(DEFAULT_LOCATION),
      { timeout, enableHighAccuracy: true }
    )
  })
}

/** Continuous watch. Returns unsubscribe fn. */
export function watchLocation(callback) {
  if (!navigator.geolocation) return () => {}
  const id = navigator.geolocation.watchPosition(
    (pos) => callback({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
    () => callback(DEFAULT_LOCATION),
    { enableHighAccuracy: true }
  )
  return () => navigator.geolocation.clearWatch(id)
}
