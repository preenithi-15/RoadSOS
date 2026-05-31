const BASE = 'https://roadsos-backend.vercel.app'
const KEY = 'roadsos_user_id'

/** Returns a persistent anonymous user_id. Creates one on first call. */
export async function getUserId() {
  const cached = localStorage.getItem(KEY)
  if (cached) return cached

  try {
    const res = await fetch(`${BASE}/api/auth/anon-user`, { method: 'POST' })
    const json = await res.json()
    if (json.user_id) {
      localStorage.setItem(KEY, json.user_id)
      return json.user_id
    }
  } catch (e) {
    console.warn('[user] anon-user failed, using local UUID:', e)
  }

  // Fallback: crypto UUID stored locally (FK will fail, but UI still works)
  const id = crypto.randomUUID()
  localStorage.setItem(KEY, id)
  return id
}
