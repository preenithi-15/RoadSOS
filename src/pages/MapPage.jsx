import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  AlertTriangle, MapPin, Radio, X, Navigation,
  CheckCircle, XCircle, Clock, ChevronDown, ChevronUp,
} from 'lucide-react';

/* ── fix Leaflet's default icon paths broken by bundlers ── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/* ── Custom icon factories ─────────────────────────────── */
const makeIcon = (svg, size = 36) =>
  L.divIcon({
    html: svg,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });

const hazardIcon = makeIcon(`
  <div style="
    width:36px;height:36px;border-radius:50%;
    background:rgba(234,179,8,0.2);
    border:2px solid #EAB308;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 0 10px rgba(234,179,8,0.5);
    animation:hz-pulse 1.8s ease-in-out infinite;
  ">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#EAB308">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13" stroke="#0D0D0D" stroke-width="2" stroke-linecap="round"/>
      <circle cx="12" cy="17" r="1" fill="#0D0D0D"/>
    </svg>
  </div>
`);

const hospitalIcon = makeIcon(`
  <div style="
    width:36px;height:36px;border-radius:50%;
    background:rgba(236,72,153,0.2);
    border:2px solid #EC4899;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 0 10px rgba(236,72,153,0.4);
    font-size:18px;line-height:1;
  ">🏥</div>
`);

const userIcon = makeIcon(`
  <div style="position:relative;width:20px;height:20px;">
    <div style="width:20px;height:20px;border-radius:50%;background:#3B82F6;border:3px solid #fff;box-shadow:0 0 8px rgba(59,130,246,0.8);position:relative;z-index:2;"></div>
    <div style="position:absolute;inset:-4px;border-radius:50%;background:rgba(59,130,246,0.25);animation:user-ping 1.8s ease-out infinite;"></div>
  </div>
`, 20);

/* ── Mock data ─────────────────────────────────────────── */
const CHENNAI = [13.0827, 80.2707];

const HAZARDS = [
  { id: 1, pos: [13.115, 80.185], road: 'NH-48', loc: 'Toll Gate 3', users: 38, risk: 'HIGH',   riskColor: '#EF4444', detail: 'Monsoon risk: HIGH' },
  { id: 2, pos: [12.972, 80.243], road: 'ECR',   loc: 'Near Kovalam', users: 22, risk: 'MEDIUM', riskColor: '#F59E0B', detail: 'Risk: MEDIUM' },
  { id: 3, pos: [13.060, 80.310], road: 'OMR',   loc: 'Perungudi Toll', users: 14, risk: 'LOW',  riskColor: '#22C55E', detail: 'Risk: LOW' },
  { id: 4, pos: [12.990, 80.155], road: 'GST Rd', loc: 'Tambaram Jn', users: 29, risk: 'MEDIUM', riskColor: '#F59E0B', detail: 'Risk: MEDIUM' },
];

const HOSPITALS = [
  {
    id: 1, pos: [13.050, 80.240],
    name: 'Meenakshi Mission Hospital', dist: '3.2 km',
    trauma: true, surgeon: true, blood: true, dataAge: null,
  },
  {
    id: 2, pos: [13.068, 80.275],
    name: 'Apollo Hospitals', dist: '5.8 km',
    trauma: false, surgeon: true, blood: false, dataAge: null,
  },
  {
    id: 3, pos: [12.985, 80.222],
    name: 'Govt. Rajaji Hospital', dist: '7.1 km',
    trauma: true, surgeon: false, blood: false, dataAge: 8,
  },
];

/* ── Map centering helper ─────────────────────────────── */
function FlyTo({ pos }) {
  const map = useMap();
  useEffect(() => { map.flyTo(pos, 11, { duration: 1.2 }); }, [pos, map]);
  return null;
}

/* ── Hospital status row ──────────────────────────────── */
function StatusBit({ ok, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
      {ok
        ? <CheckCircle size={12} color="#4ADE80" />
        : <XCircle size={12} color="#F87171" />}
      <span style={{ color: ok ? '#4ADE80' : '#F87171', fontWeight: 600 }}>{label}</span>
    </div>
  );
}

/* ── Hospital card ────────────────────────────────────── */
function HospitalCard({ h, idx }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${idx === 0 ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 14, padding: '12px 14px', marginBottom: 10, flexShrink: 0,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#F5F5F5' }}>{h.name}</div>
          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{h.dist} away</div>
        </div>
        {idx === 0 && (
          <button style={{
            padding: '6px 12px', borderRadius: 20,
            background: 'linear-gradient(135deg,#16A34A,#15803D)',
            border: 'none', color: '#fff', fontSize: 11, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            boxShadow: '0 0 10px rgba(22,163,74,0.4)',
          }}>
            <Navigation size={11} /> Route Here
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <StatusBit ok={h.trauma}  label={`Trauma bay: ${h.trauma ? 'FREE ✓' : 'OCCUPIED ✗'}`} />
        <StatusBit ok={h.surgeon} label={`Surgeon: ${h.surgeon ? 'Available ✓' : 'Unavailable ✗'}`} />
        {h.blood !== undefined && (
          <StatusBit ok={h.blood} label={`Blood B+: ${h.blood ? 'In stock ✓' : 'Unavailable'}`} />
        )}
      </div>

      {h.dataAge && (
        <div style={{
          marginTop: 8, padding: '5px 10px', borderRadius: 8,
          background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)',
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 10, color: '#FCD34D', fontWeight: 600,
        }}>
          <Clock size={11} /> Data age: {h.dataAge} min — may be outdated
        </div>
      )}
    </div>
  );
}

/* ── Main component ───────────────────────────────────── */
export default function MapPage() {
  const [layer, setLayer] = useState('hazards'); // hazards | hospitals | perimeter
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sosActive] = useState(false); // hook into global SOS state in future

  /* inject keyframes once */
  useEffect(() => {
    const id = 'map-keyframes';
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = `
      @keyframes hz-pulse { 0%,100%{box-shadow:0 0 10px rgba(234,179,8,0.5)} 50%{box-shadow:0 0 20px rgba(234,179,8,0.9)} }
      @keyframes user-ping { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(2.4);opacity:0} }
      @keyframes perim-flash { 0%,100%{opacity:0.55} 50%{opacity:1} }
    `;
    document.head.appendChild(s);
  }, []);

  const layers = [
    { id: 'hazards',   label: 'Hazards',   Icon: AlertTriangle },
    { id: 'hospitals', label: 'Hospitals', Icon: MapPin },
    { id: 'perimeter', label: 'Perimeter', Icon: Radio },
  ];

  const handleLayerChange = (id) => {
    setLayer(id);
    if (id === 'hospitals') setSheetOpen(true);
    else setSheetOpen(false);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

      {/* ── Toggle bar ── */}
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        zIndex: 1000, display: 'flex', gap: 0,
        background: 'rgba(13,13,13,0.88)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14,
        padding: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
      }}>
        {layers.map(({ id, label, Icon }) => {
          const active = layer === id;
          const color = id === 'hazards' ? '#EAB308' : id === 'hospitals' ? '#EC4899' : '#EF4444';
          return (
            <button key={id} onClick={() => handleLayerChange(id)} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 13px', borderRadius: 10, border: 'none',
              background: active ? `${color}22` : 'transparent',
              outline: active ? `1px solid ${color}55` : 'none',
              color: active ? color : '#6B7280',
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}>
              <Icon size={12} /> {label}
            </button>
          );
        })}
      </div>

      {/* ── Leaflet Map (full-screen) ── */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer
          center={CHENNAI}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution="&copy; OpenStreetMap &copy; CARTO"
          />

          {/* User pin */}
          <Marker position={CHENNAI} icon={userIcon} />

          {/* Hazard markers */}
          {layer === 'hazards' && HAZARDS.map(h => (
            <Marker key={h.id} position={h.pos} icon={hazardIcon}>
              <Popup className="sos-popup">
                <div style={{
                  background: '#1A1A1A', borderRadius: 12, padding: '10px 12px',
                  minWidth: 200, border: '1px solid rgba(234,179,8,0.3)',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#F5F5F5', marginBottom: 2 }}>
                    {h.road} · {h.loc}
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 6 }}>
                    {h.users} users braked here
                  </div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                    background: `${h.riskColor}22`, color: h.riskColor,
                    border: `1px solid ${h.riskColor}44`,
                  }}>
                    ⚠ {h.detail}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Hospital markers */}
          {layer === 'hospitals' && HOSPITALS.map(h => (
            <Marker key={h.id} position={h.pos} icon={hospitalIcon} />
          ))}

          {/* Perimeter layer */}
          {layer === 'perimeter' && (
            <>
              <Circle
                center={CHENNAI}
                radius={1000}
                pathOptions={{
                  color: '#EF4444',
                  fillColor: '#EF4444',
                  fillOpacity: 0.08,
                  weight: 2,
                  dashArray: '8 6',
                }}
              />
              <Circle
                center={CHENNAI}
                radius={1000}
                pathOptions={{
                  color: '#EF4444',
                  fillColor: 'transparent',
                  fillOpacity: 0,
                  weight: 3,
                  opacity: 0.6,
                }}
              />
            </>
          )}

          <FlyTo pos={layer === 'hospitals' ? [13.035, 80.245] : CHENNAI} />
        </MapContainer>

        {/* Perimeter overlay badge */}
        {layer === 'perimeter' && (
          <div style={{
            position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
            zIndex: 1000, background: 'rgba(13,13,13,0.9)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(239,68,68,0.4)', borderRadius: 14,
            padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 0 20px rgba(239,68,68,0.3)',
          }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%', background: '#EF4444',
              animation: 'perim-flash 1s ease-in-out infinite',
            }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#F5F5F5' }}>
                4 vehicles warned
              </div>
              <div style={{ fontSize: 10, color: '#9CA3AF' }}>
                1 km perimeter active {!sosActive && '· SOS inactive'}
              </div>
            </div>
            {!sosActive && (
              <div style={{
                padding: '3px 8px', borderRadius: 8,
                background: 'rgba(107,114,128,0.2)', border: '1px solid rgba(107,114,128,0.3)',
                fontSize: 9, fontWeight: 700, color: '#9CA3AF',
              }}>SOS OFF</div>
            )}
          </div>
        )}

        {/* Attribution */}
        <div style={{
          position: 'absolute', bottom: 4, right: 8, zIndex: 999,
          fontSize: 9, color: 'rgba(255,255,255,0.3)',
        }}>
          © OpenStreetMap · CARTO
        </div>
      </div>

      {/* ── Hospitals bottom sheet ── */}
      {layer === 'hospitals' && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          zIndex: 1100,
          transform: sheetOpen ? 'translateY(0)' : 'translateY(calc(100% - 48px))',
          transition: 'transform 0.35s cubic-bezier(0.32,0.72,0,1)',
          background: 'linear-gradient(180deg,rgba(18,18,18,0.97),rgba(10,10,10,1))',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          boxShadow: '0 -8px 40px rgba(0,0,0,0.7)',
          display: 'flex', flexDirection: 'column', maxHeight: '65%',
        }}>
          {/* Handle bar */}
          <button
            onClick={() => setSheetOpen(v => !v)}
            style={{
              width: '100%', background: 'none', border: 'none', cursor: 'pointer',
              padding: '12px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 10,
                background: 'rgba(236,72,153,0.15)', border: '1px solid rgba(236,72,153,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MapPin size={13} color="#F472B6" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#F5F5F5' }}>Nearby Hospitals</div>
                <div style={{ fontSize: 10, color: '#6B7280' }}>3 facilities · live status</div>
              </div>
            </div>
            {sheetOpen ? <ChevronDown size={16} color="#6B7280" /> : <ChevronUp size={16} color="#6B7280" />}
          </button>

          {/* Pill drag indicator */}
          <div style={{
            width: 36, height: 4, borderRadius: 2,
            background: 'rgba(255,255,255,0.12)',
            margin: '0 auto 12px',
          }} />

          {/* Cards */}
          <div style={{ overflowY: 'auto', padding: '0 14px 16px', flexShrink: 1 }}>
            {HOSPITALS.map((h, i) => <HospitalCard key={h.id} h={h} idx={i} />)}
          </div>
        </div>
      )}

      {/* ── Leaflet popup custom style ── */}
      <style>{`
        .leaflet-popup-content-wrapper { background: transparent !important; box-shadow: none !important; padding: 0 !important; border-radius: 12px !important; }
        .leaflet-popup-tip { background: #1A1A1A !important; }
        .leaflet-popup-content { margin: 0 !important; }
        .leaflet-container { background: #0D0D0D; }
      `}</style>
    </div>
  );
}
