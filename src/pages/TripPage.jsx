import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Plus, X, AlertTriangle, CheckCircle, Clock, Download, RefreshCw, MapPin, Shield, ChevronDown, ChevronUp, Loader, Route } from 'lucide-react';
import { planTrip, addTripCheckpoint, getTripOfflineCache, liveRefreshTrip, checkProximity } from '../api/api.js';
import { getUserId } from '../lib/user.js';
import { getLocation, DEFAULT_LOCATION } from '../lib/location.js';
import { cacheTrip, startProximityMonitor, clearTripCache } from '../lib/tripMonitor.js';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const mkIcon = (html, size = 32) => L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -(size / 2 + 4)] });

const RISK_STYLES = {
  LOW:      { color: '#22C55E', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.3)',   label: 'LOW',      dot: '#22C55E' },
  MEDIUM:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  label: 'MEDIUM',   dot: '#F59E0B' },
  HIGH:     { color: '#F97316', bg: 'rgba(249,115,22,0.12)',  border: 'rgba(249,115,22,0.3)',  label: 'HIGH',     dot: '#F97316' },
  CRITICAL: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   label: 'CRITICAL', dot: '#EF4444' },
};

function FitRoute({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(points, { padding: [40, 40] });
    }
  }, [points, map]);
  return null;
}

function CheckpointCard({ cp, index, isLast }) {
  const [open, setOpen] = useState(false);
  const rs = RISK_STYLES[cp.risk_level] || RISK_STYLES.LOW;
  return (
    <div style={{ marginBottom: 8, border: `1px solid ${rs.border}`, borderRadius: 12, overflow: 'hidden', background: rs.bg }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: rs.dot, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
          {cp.is_origin ? '🚀' : cp.is_destination ? '🏁' : index}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#F5F5F5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cp.name || `Stop ${index}`}</div>
          <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>
            {cp.eta_from_prev_min > 0 ? `+${cp.eta_from_prev_min} min · ` : ''}{cp.distance_from_prev_km > 0 ? `${cp.distance_from_prev_km} km` : ''}
          </div>
        </div>
        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: rs.bg, color: rs.color, border: `1px solid ${rs.border}`, flexShrink: 0 }}>{rs.label}</span>
        {open ? <ChevronUp size={14} color="#6B7280" /> : <ChevronDown size={14} color="#6B7280" />}
      </button>
      {open && cp.precautions?.length > 0 && (
        <div style={{ padding: '0 14px 12px' }}>
          {cp.precautions.slice(0, 4).map((p, i) => (
            <div key={i} style={{ fontSize: 11, color: '#D1D5DB', padding: '4px 0', borderTop: '1px solid rgba(255,255,255,0.05)', lineHeight: 1.5 }}>{p}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TripPage() {
  const [origin, setOrigin]       = useState('');
  const [dest,   setDest]         = useState('');
  const [stop,   setStop]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [trip,   setTrip]         = useState(null);
  const [checkpoints, setCps]     = useState([]);
  const [routeLine, setRouteLine] = useState([]);
  const [userPos, setUserPos]     = useState([DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng]);
  const [alert, setAlert]         = useState(null);
  const [addingStop, setAddingStop] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const stopMonitor = useRef(null);

  useEffect(() => {
    getLocation().then(loc => setUserPos([loc.lat, loc.lng]));
    const css = `
      @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
      @keyframes alertPop { from { opacity:0; transform:scale(0.92) } to { opacity:1; transform:scale(1) } }
    `;
    if (!document.getElementById('trip-css')) {
      const s = document.createElement('style'); s.id = 'trip-css'; s.textContent = css; document.head.appendChild(s);
    }
    return () => { stopMonitor.current?.(); };
  }, []);

  const handlePlan = async () => {
    if (!origin.trim() || !dest.trim()) return;
    setLoading(true); setTrip(null); setCps([]); setRouteLine([]); setAlert(null);
    try {
      const user_id = await getUserId();
      const result = await planTrip({
        user_id,
        origin: { name: origin.trim() },
        destination: { name: dest.trim() },
      });
      if (result?.trip_id) {
        setTrip(result);
        setCps(result.checkpoints || []);
        if (result.route_geometry?.length) {
          setRouteLine(result.route_geometry.map(([lng, lat]) => [lat, lng]));
        }
        // Cache trip for offline proximity monitoring
        cacheTrip(result, result.checkpoints || []);
        // Start proximity monitoring
        stopMonitor.current?.();
        stopMonitor.current = startProximityMonitor(({ checkpoint, distance_km }) => {
          setAlert({ checkpoint, distance_km });
          setTimeout(() => setAlert(null), 12000);
        });
      }
    } catch (e) {
      console.error('[Trip] plan failed:', e);
    }
    setLoading(false);
  };

  const handleAddStop = async () => {
    if (!stop.trim() || !trip?.trip_id) return;
    setAddingStop(true);
    try {
      // Geocode the stop name via Nominatim
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(stop)}&format=json&limit=1`);
      const geoJson = await geoRes.json();
      if (!geoJson[0]) { alert('Location not found'); return; }
      const lat = Number(geoJson[0].lat);
      const lng = Number(geoJson[0].lon);
      const result = await addTripCheckpoint({ trip_id: trip.trip_id, lat, lng, name: stop.trim() });
      if (result?.checkpoints) {
        setCps(result.checkpoints);
        if (result.checkpoints.length > 1) {
          // Rebuild route line from updated checkpoints
          const pts = result.checkpoints.filter(c => c.lat && c.lng).map(c => [c.lat, c.lng]);
          setRouteLine(pts);
        }
        setStop('');
      }
    } catch (e) { console.error('[Trip] add stop failed:', e); }
    setAddingStop(false);
  };

  const handleOfflineCache = async () => {
    if (!trip?.trip_id) return;
    try {
      const bundle = await getTripOfflineCache(trip.trip_id);
      localStorage.setItem(`roadsos_offline_${trip.trip_id}`, JSON.stringify(bundle));
      alert(`✅ Offline cache saved! ${bundle.checkpoints?.length} checkpoints + ${bundle.geofence_triggers?.length} alerts available without network.`);
    } catch (e) { console.error('[Trip] offline cache failed:', e); }
  };

  const handleLiveRefresh = async () => {
    if (!trip?.trip_id) return;
    setRefreshing(true);
    try {
      const result = await liveRefreshTrip(trip.trip_id);
      if (result?.changes?.length > 0) {
        // Update risk levels for changed checkpoints
        setCps(prev => prev.map(cp => {
          const change = result.changes.find(c => c.checkpoint_id === cp.id);
          return change ? { ...cp, risk_level: change.new_risk, precautions: change.precautions } : cp;
        }));
      }
      alert(`${result.changes?.length || 0} checkpoint(s) updated with latest community data.`);
    } catch (e) { console.error('[Trip] live refresh failed:', e); }
    setRefreshing(false);
  };

  const riskBadgeColor = {
    LOW: '#22C55E', MEDIUM: '#F59E0B', HIGH: '#F97316', CRITICAL: '#EF4444',
  };

  const routeBounds = routeLine.length > 1 ? routeLine : null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0D0D0D', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #1A1A1A', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(220,38,38,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Route size={14} color="#EF4444" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#F5F5F5' }}>Varadhi Trip Agent</div>
            <div style={{ fontSize: 10, color: '#6B7280' }}>AI-powered safe route planner</div>
          </div>
        </div>

        {/* Inputs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            value={origin} onChange={e => setOrigin(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handlePlan()}
            placeholder="From (city / landmark)"
            style={{ flex: 1, background: '#111', border: '1px solid #2E2E2E', borderRadius: 10, padding: '9px 12px', fontSize: 12, color: '#F5F5F5', outline: 'none' }}
          />
          <input
            value={dest} onChange={e => setDest(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handlePlan()}
            placeholder="To (city / landmark)"
            style={{ flex: 1, background: '#111', border: '1px solid #2E2E2E', borderRadius: 10, padding: '9px 12px', fontSize: 12, color: '#F5F5F5', outline: 'none' }}
          />
        </div>
        <button
          onClick={handlePlan} disabled={loading || !origin.trim() || !dest.trim()}
          style={{ width: '100%', padding: '11px', borderRadius: 10, background: loading ? '#1A1A1A' : 'linear-gradient(135deg,#DC2626,#991B1B)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: loading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          {loading ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Analysing route…</> : <><Navigation size={14} /> Plan Safe Route</>}
        </button>
      </div>

      {/* ── Map ── */}
      <div style={{ height: 220, flexShrink: 0, position: 'relative' }}>
        <MapContainer center={userPos} zoom={10} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
          />
          {routeBounds && <FitRoute points={routeLine} />}
          {routeLine.length > 1 && (
            <Polyline positions={routeLine} color="#DC2626" weight={4} opacity={0.85} />
          )}
          {/* User position */}
          <Marker position={userPos} icon={mkIcon(`<div style="width:14px;height:14px;border-radius:50%;background:#3B82F6;border:2px solid #fff;box-shadow:0 0 8px rgba(59,130,246,0.8);"></div>`, 14)} />
          {/* Checkpoints */}
          {checkpoints.map((cp, i) => {
            if (!cp.lat || !cp.lng) return null;
            const rs = RISK_STYLES[cp.risk_level] || RISK_STYLES.LOW;
            const icon = mkIcon(`<div style="width:28px;height:28px;border-radius:50%;background:${rs.dot};border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.5);">${cp.is_origin ? '🚀' : cp.is_destination ? '🏁' : i}</div>`);
            return (
              <Marker key={cp.id || i} position={[cp.lat, cp.lng]} icon={icon}>
                <Popup>
                  <b>{cp.name}</b><br />
                  Risk: {cp.risk_level}<br />
                  {cp.precautions?.[0]}
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* No-alt-route warning overlay */}
        {trip?.has_alternatives === false && (
          <div style={{ position: 'absolute', top: 8, left: 8, right: 8, background: 'rgba(185,28,28,0.92)', borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, zIndex: 999 }}>
            <AlertTriangle size={13} color="#fff" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>No alternate route — single corridor only</span>
          </div>
        )}
      </div>

      {/* ── Trip summary + checkpoints ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>

        {/* Proximity alert banner */}
        {alert && (
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 12, padding: '10px 14px', marginBottom: 12, animation: 'alertPop 0.3s ease' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#EF4444', marginBottom: 4 }}>
              🚨 Approaching {alert.checkpoint.risk_level} zone — {alert.distance_km.toFixed(1)} km away
            </div>
            <div style={{ fontSize: 11, color: '#FCA5A5' }}>{alert.checkpoint.name}</div>
            {alert.checkpoint.precautions?.[0] && (
              <div style={{ fontSize: 11, color: '#D1D5DB', marginTop: 4 }}>{alert.checkpoint.precautions[0]}</div>
            )}
          </div>
        )}

        {trip && (
          <>
            {/* Summary row */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, background: '#111', borderRadius: 10, padding: '10px 12px', border: '1px solid #222' }}>
                <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 2 }}>RISK LEVEL</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: riskBadgeColor[trip.overall_risk] || '#fff' }}>{trip.overall_risk}</div>
              </div>
              <div style={{ flex: 1, background: '#111', borderRadius: 10, padding: '10px 12px', border: '1px solid #222' }}>
                <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 2 }}>SAFETY</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#22C55E' }}>{trip.safety_rating}/10</div>
              </div>
              <div style={{ flex: 1, background: '#111', borderRadius: 10, padding: '10px 12px', border: '1px solid #222' }}>
                <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 2 }}>ETA</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#F5F5F5' }}>
                  {trip.total_eta_minutes ? `${Math.floor(trip.total_eta_minutes / 60)}h ${trip.total_eta_minutes % 60}m` : '—'}
                </div>
              </div>
              <div style={{ flex: 1, background: '#111', borderRadius: 10, padding: '10px 12px', border: '1px solid #222' }}>
                <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 2 }}>KM</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#F5F5F5' }}>{trip.total_distance_km || '—'}</div>
              </div>
            </div>

            {/* AI summary */}
            {trip.summary && (
              <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '10px 12px', marginBottom: 12, fontSize: 12, color: '#93C5FD', lineHeight: 1.6 }}>
                {trip.summary}
              </div>
            )}

            {/* Add stop */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                value={stop} onChange={e => setStop(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddStop()}
                placeholder="Add a stop (delivery / detour)"
                style={{ flex: 1, background: '#111', border: '1px solid #2E2E2E', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#F5F5F5', outline: 'none' }}
              />
              <button onClick={handleAddStop} disabled={addingStop || !stop.trim()} style={{ padding: '8px 12px', borderRadius: 10, background: addingStop ? '#1A1A1A' : '#1E3A5F', border: 'none', color: '#60A5FA', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                {addingStop ? <Loader size={14} /> : <Plus size={14} />}
              </button>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <button onClick={handleOfflineCache} style={{ flex: 1, padding: '8px', background: '#1A1A1A', border: '1px solid #2E2E2E', borderRadius: 10, color: '#9CA3AF', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Download size={12} /> Offline Cache
              </button>
              <button onClick={handleLiveRefresh} disabled={refreshing} style={{ flex: 1, padding: '8px', background: '#1A1A1A', border: '1px solid #2E2E2E', borderRadius: 10, color: '#9CA3AF', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <RefreshCw size={12} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} /> Live Refresh
              </button>
            </div>

            {/* Checkpoints */}
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Route Checkpoints ({checkpoints.length})
            </div>
            {checkpoints.map((cp, i) => (
              <CheckpointCard key={cp.id || i} cp={cp} index={i + 1} isLast={i === checkpoints.length - 1} />
            ))}
          </>
        )}

        {!trip && !loading && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#4B5563' }}>
            <Route size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Plan a safe route</div>
            <div style={{ fontSize: 11, lineHeight: 1.6 }}>
              Enter origin and destination above.<br />
              The Varadhi agent analyses hazard nodes,<br />
              community reports, and SOS history<br />
              to find the safest path.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
