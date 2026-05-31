import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle, MapPin, Radio, Navigation, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Loader, FileBarChart } from 'lucide-react';
import { getHazardNodes, getHospitalRoute, getNhaiReport, getEmergencyContacts } from '../api/api.js';
import { getLocation, DEFAULT_LOCATION } from '../lib/location.js';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const makeIcon = (svg, size = 36) => L.divIcon({ html:svg, className:'', iconSize:[size,size], iconAnchor:[size/2,size/2], popupAnchor:[0,-(size/2+4)] });

// Dynamic hazard icon — colour changes by dominant event type
function getHazardIcon(node) {
  const nm = node.near_miss_count || 0;
  const sw = node.swerve_count || 0;
  const rs = node.risk_score || 0;
  const color = nm > 0 ? '#EF4444' : sw > 0 ? '#F97316' : rs >= 0.7 ? '#EF4444' : rs >= 0.5 ? '#F59E0B' : '#EAB308';
  const label = nm > 0 ? '⚠' : sw > 0 ? '↩' : '⚡';
  return makeIcon(`<div style="width:36px;height:36px;border-radius:50%;background:${color}22;border:2px solid ${color};display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px ${color}88;font-size:16px;">${label}</div>`);
}
const hazardIcon = makeIcon(`<div style="width:36px;height:36px;border-radius:50%;background:rgba(234,179,8,0.2);border:2px solid #EAB308;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(234,179,8,0.5);"><svg width="18" height="18" viewBox="0 0 24 24" fill="#EAB308"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg></div>`);
const hospitalIcon = makeIcon(`<div style="width:36px;height:36px;border-radius:50%;background:rgba(236,72,153,0.2);border:2px solid #EC4899;display:flex;align-items:center;justify-content:center;font-size:18px;">🏥</div>`);
const userIcon = makeIcon(`<div style="position:relative;width:20px;height:20px;"><div style="width:20px;height:20px;border-radius:50%;background:#3B82F6;border:3px solid #fff;box-shadow:0 0 8px rgba(59,130,246,0.8);"></div><div style="position:absolute;inset:-4px;border-radius:50%;background:rgba(59,130,246,0.25);animation:user-ping 1.8s ease-out infinite;"></div></div>`, 20);

function FlyTo({ pos }) {
  const map = useMap();
  useEffect(() => { map.flyTo(pos, 11, { duration: 1.2 }); }, [pos, map]);
  return null;
}

function StatusBit({ ok, label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11 }}>
      {ok ? <CheckCircle size={12} color="#4ADE80" /> : <XCircle size={12} color="#F87171" />}
      <span style={{ color:ok ? '#4ADE80' : '#F87171', fontWeight:600 }}>{label}</span>
    </div>
  );
}

function riskColor(score) {
  if (score >= 0.7) return '#EF4444';
  if (score >= 0.5) return '#F59E0B';
  return '#22C55E';
}

function riskLabel(score) {
  if (score >= 0.7) return 'HIGH';
  if (score >= 0.5) return 'MEDIUM';
  return 'LOW';
}

export default function MapPage() {
  const [layer, setLayer] = useState('hazards');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [userPos, setUserPos] = useState([DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng]);
  const [hazards, setHazards] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loadingHazards, setLoadingHazards] = useState(false);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [nhaiReport, setNhaiReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [emergency, setEmergency] = useState([]);
  const [loadingEmergency, setLoadingEmergency] = useState(false);

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

  // Get user location and load hazard nodes on mount
  useEffect(() => {
    getLocation().then(loc => {
      setUserPos([loc.lat, loc.lng]);
      fetchHazards(loc.lat, loc.lng);
    });
  }, []);

  const fetchHazards = async (lat, lng) => {
    setLoadingHazards(true);
    try {
      const data = await getHazardNodes({ lat, lng, radius_km: 50 });
      setHazards(data.nodes || []);
    } catch (e) {
      console.warn('[Map] hazard nodes failed:', e);
    } finally {
      setLoadingHazards(false);
    }
  };

  const fetchHospitals = async () => {
    setLoadingHospitals(true);
    try {
      const profile = JSON.parse(localStorage.getItem('roadsos_profile') || '{}');
      const data = await getHospitalRoute({ lat: userPos[0], lng: userPos[1], blood_group: profile.blood_group || 'O+' });
      const list = [];
      if (data.hospital) list.push({ ...data.hospital, idx: 0, stale: data.stale_warning });
      if (data.alternatives) {
        data.alternatives.forEach((h, i) => list.push({ ...h, idx: i + 1, stale: false }));
      }
      setHospitals(list);
    } catch (e) {
      console.warn('[Map] hospital route failed:', e);
    } finally {
      setLoadingHospitals(false);
    }
  };

  const fetchEmergency = async () => {
    setLoadingEmergency(true);
    try {
      const data = await getEmergencyContacts({ lat: userPos[0], lng: userPos[1], radius_km: 20 });
      setEmergency(data.contacts?.filter(c => c.lat && c.lng && !c.is_national_helpline) || []);
    } catch (e) { console.warn('[Map] emergency contacts failed:', e); }
    finally { setLoadingEmergency(false); }
  };

  const fetchNhaiReport = async () => {
    setLoadingReport(true);
    try {
      const data = await getNhaiReport(30);
      setNhaiReport(data);
    } catch (e) { console.warn('[Map] NHAI report failed:', e); }
    finally { setLoadingReport(false); }
  };

  const handleLayerChange = (id) => {
    setLayer(id);
    if (id === 'hospitals') {
      setSheetOpen(true);
      if (hospitals.length === 0) fetchHospitals();
    } else if (id === 'emergency') {
      setSheetOpen(false);
      if (emergency.length === 0) fetchEmergency();
    } else {
      setSheetOpen(false);
    }
  };

  const EMERG_ICONS = { POLICE:'🚔', AMBULANCE:'🚑', FIRE:'🚒', TOWING:'🔧', TYRE_SHOP:'🔩', SHOWROOM:'🏪' };
  const EMERG_COLORS = { POLICE:'#3B82F6', AMBULANCE:'#EF4444', FIRE:'#F97316', TOWING:'#F59E0B', TYRE_SHOP:'#22C55E', SHOWROOM:'#A78BFA' };

  const layers = [
    { id:'hazards',   label:'Hazards',   Icon:AlertTriangle },
    { id:'hospitals', label:'Hospitals', Icon:MapPin },
    { id:'perimeter', label:'Perimeter', Icon:Radio },
    { id:'emergency', label:'Emergency', Icon:Navigation },
  ];

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', position:'relative', overflow:'hidden' }}>
      {/* Toggle bar */}
      <div style={{ position:'absolute', top:12, left:'50%', transform:'translateX(-50%)', zIndex:1000, display:'flex', gap:0, background:'rgba(13,13,13,0.88)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, padding:4, boxShadow:'0 4px 20px rgba(0,0,0,0.6)' }}>
        {layers.map(({ id, label, Icon }) => {
          const active = layer === id;
          const color = id === 'hazards' ? '#EAB308' : id === 'hospitals' ? '#EC4899' : '#EF4444';
          return (
            <button key={id} onClick={() => handleLayerChange(id)} style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 13px', borderRadius:10, border:'none', background:active ? `${color}22` : 'transparent', outline:active ? `1px solid ${color}55` : 'none', color:active ? color : '#6B7280', fontSize:11, fontWeight:700, cursor:'pointer', transition:'all 0.2s', whiteSpace:'nowrap' }}>
              <Icon size={12} /> {label}
              {id === 'hazards' && loadingHazards && <Loader size={10} style={{ animation:'spin 1s linear infinite' }} />}
              {id === 'hospitals' && loadingHospitals && <Loader size={10} style={{ animation:'spin 1s linear infinite' }} />}
            </button>
          );
        })}
      </div>

      {/* Map */}
      <div style={{ flex:1, position:'relative' }}>
        <MapContainer center={userPos} zoom={11} style={{ height:'100%', width:'100%' }} zoomControl={false} attributionControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          <Marker position={userPos} icon={userIcon} />

          {/* Hazard markers — dynamic colour by event type */}
          {layer === 'hazards' && hazards.map(h => (
            <Marker key={h.id} position={[h.lat, h.lng]} icon={getHazardIcon(h)}>
              <Popup className="sos-popup">
                <div style={{ background:'#1A1A1A', borderRadius:12, padding:'10px 12px', minWidth:210, border:`1px solid ${riskColor(h.risk_score)}44` }}>
                  <div style={{ fontSize:12, fontWeight:800, color:'#F5F5F5', marginBottom:2 }}>{h.road_class || 'Highway'} · Living Map Node</div>
                  <div style={{ fontSize:11, color:'#9CA3AF', marginBottom:6 }}>{h.trigger_count} distinct users flagged this spot</div>
                  {/* Event breakdown */}
                  <div style={{ display:'flex', gap:6, marginBottom:6, flexWrap:'wrap' }}>
                    {(h.near_miss_count > 0) && <span style={{ padding:'2px 7px', borderRadius:12, fontSize:10, fontWeight:700, background:'rgba(239,68,68,0.15)', color:'#F87171', border:'1px solid rgba(239,68,68,0.3)' }}>⚠ {h.near_miss_count} near-miss</span>}
                    {(h.swerve_count > 0)     && <span style={{ padding:'2px 7px', borderRadius:12, fontSize:10, fontWeight:700, background:'rgba(249,115,22,0.15)', color:'#FB923C', border:'1px solid rgba(249,115,22,0.3)' }}>↩ {h.swerve_count} swerve</span>}
                    {(h.brake_count > 0)      && <span style={{ padding:'2px 7px', borderRadius:12, fontSize:10, fontWeight:700, background:'rgba(234,179,8,0.15)', color:'#FCD34D', border:'1px solid rgba(234,179,8,0.3)' }}>⚡ {h.brake_count} brake</span>}
                  </div>
                  <div style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 9px', borderRadius:20, fontSize:10, fontWeight:700, background:`${riskColor(h.risk_score)}22`, color:riskColor(h.risk_score), border:`1px solid ${riskColor(h.risk_score)}44` }}>
                    Risk: {riskLabel(h.risk_score)} ({(h.risk_score * 100).toFixed(0)}%)
                  </div>
                  <div style={{ marginTop:4, fontSize:10, color:'#6B7280' }}>{new Date(h.last_updated).toLocaleDateString()}</div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* No hazards message */}
          {layer === 'hazards' && !loadingHazards && hazards.length === 0 && (
            <Marker position={userPos} icon={userIcon} />
          )}

          {/* Hospital markers */}
          {layer === 'hospitals' && hospitals.map((h, i) => (
            h.lat && h.lng ? <Marker key={h.id || i} position={[h.lat, h.lng]} icon={hospitalIcon} /> : null
          ))}

          {/* Perimeter */}
          {layer === 'perimeter' && (
            <>
              <Circle center={userPos} radius={1000} pathOptions={{ color:'#EF4444', fillColor:'#EF4444', fillOpacity:0.08, weight:2, dashArray:'8 6' }} />
              <Circle center={userPos} radius={1000} pathOptions={{ color:'#EF4444', fillColor:'transparent', fillOpacity:0, weight:3, opacity:0.6 }} />
            </>
          )}

          {/* Emergency contacts layer */}
          {layer === 'emergency' && emergency.map((c, i) => {
            const emoji = EMERG_ICONS[c.category] || '📍';
            const col   = EMERG_COLORS[c.category] || '#9CA3AF';
            const icon  = makeIcon(`<div style="width:32px;height:32px;border-radius:50%;background:${col}22;border:2px solid ${col};display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 0 8px ${col}66;">${emoji}</div>`);
            return (
              <Marker key={`ec-${i}`} position={[c.lat, c.lng]} icon={icon}>
                <Popup>
                  <b>{emoji} {c.name}</b><br />
                  {c.category.replace('_', ' ')}<br />
                  {c.phone && <>📞 <a href={`tel:${c.phone}`}>{c.phone}</a><br /></>}
                  {c.city && <>{c.city}</>}
                </Popup>
              </Marker>
            );
          })}

          <FlyTo pos={layer === 'hospitals' && hospitals[0]?.lat ? [hospitals[0].lat, hospitals[0].lng] : userPos} />
        </MapContainer>

        {/* Hazard panel: count + legend + NHAI report */}
        {layer === 'hazards' && !loadingHazards && (
          <div style={{ position:'absolute', bottom:16, left:'50%', transform:'translateX(-50%)', zIndex:1000, background:'rgba(13,13,13,0.92)', backdropFilter:'blur(10px)', border:'1px solid rgba(234,179,8,0.3)', borderRadius:14, padding:'10px 14px', minWidth:260 }}>
            <div style={{ fontSize:13, fontWeight:800, color:'#F5F5F5', marginBottom:6 }}>
              {hazards.length === 0 ? 'No hazard nodes yet (needs 15+ users)' : `${hazards.length} Living Map node${hazards.length !== 1 ? 's' : ''} in 50 km`}
            </div>
            {/* Event type legend */}
            <div style={{ display:'flex', gap:8, marginBottom:8, flexWrap:'wrap' }}>
              <span style={{ fontSize:10, color:'#F87171' }}>⚠ Near-miss</span>
              <span style={{ fontSize:10, color:'#FB923C' }}>↩ Swerve</span>
              <span style={{ fontSize:10, color:'#FCD34D' }}>⚡ Hard brake</span>
            </div>
            {/* NHAI Report button */}
            <button onClick={fetchNhaiReport} disabled={loadingReport} style={{ width:'100%', padding:'7px', borderRadius:10, background:'linear-gradient(135deg,rgba(59,130,246,0.2),rgba(29,78,216,0.3))', border:'1px solid rgba(59,130,246,0.4)', color:'#60A5FA', fontSize:11, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              {loadingReport ? <><Loader size={11} style={{ animation:'spin 1s linear infinite' }} /> Generating…</> : <><FileBarChart size={11} /> NHAI Monthly Report</>}
            </button>
            {/* Report summary inline */}
            {nhaiReport && (
              <div style={{ marginTop:8, padding:'8px 10px', borderRadius:10, background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.2)' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#60A5FA', marginBottom:4 }}>Report: {nhaiReport.period_days}-day summary</div>
                <div style={{ fontSize:10, color:'#9CA3AF' }}>Nodes: {nhaiReport.summary?.total_hazard_nodes} · Critical: {nhaiReport.summary?.critical_nodes} · Events: {nhaiReport.summary?.total_events_logged}</div>
                {nhaiReport.critical_nodes?.length > 0 && (
                  <div style={{ marginTop:4, fontSize:10, color:'#F87171', fontWeight:600 }}>
                    🚨 Critical: {nhaiReport.critical_nodes[0]?.road_class} at {nhaiReport.critical_nodes[0]?.lat?.toFixed(4)},{nhaiReport.critical_nodes[0]?.lng?.toFixed(4)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Perimeter overlay */}
        {layer === 'perimeter' && (
          <div style={{ position:'absolute', bottom:16, left:'50%', transform:'translateX(-50%)', zIndex:1000, background:'rgba(13,13,13,0.9)', backdropFilter:'blur(10px)', border:'1px solid rgba(239,68,68,0.4)', borderRadius:14, padding:'10px 18px', display:'flex', alignItems:'center', gap:10, boxShadow:'0 0 20px rgba(239,68,68,0.3)' }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background:'#EF4444', animation:'perim-flash 1s ease-in-out infinite' }} />
            <div>
              <div style={{ fontSize:13, fontWeight:800, color:'#F5F5F5' }}>1 km perimeter radius</div>
              <div style={{ fontSize:10, color:'#9CA3AF' }}>Activates on SOS · Realtime broadcast</div>
            </div>
          </div>
        )}

        {/* Emergency contacts overlay */}
        {layer === 'emergency' && (
          <div style={{ position:'absolute', bottom:8, left:8, right:8, zIndex:1000, background:'rgba(13,13,13,0.92)', backdropFilter:'blur(10px)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:12, padding:'10px 14px', maxHeight:160, overflowY:'auto' }}>
            {loadingEmergency ? (
              <div style={{ fontSize:11, color:'#6B7280', textAlign:'center' }}>Loading emergency services…</div>
            ) : emergency.length === 0 ? (
              <div style={{ fontSize:11, color:'#6B7280', textAlign:'center' }}>No contacts found nearby. Try increasing radius.</div>
            ) : (
              <>
                <div style={{ fontSize:10, fontWeight:700, color:'#6B7280', marginBottom:6, textTransform:'uppercase' }}>{emergency.length} nearby emergency services</div>
                {emergency.slice(0, 5).map((c, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <span style={{ fontSize:14, flexShrink:0 }}>{EMERG_ICONS[c.category] || '📍'}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'#F5F5F5', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</div>
                      <div style={{ fontSize:10, color:'#6B7280' }}>{c.distance_km} km away{c.phone ? ` · ${c.phone}` : ''}</div>
                    </div>
                    {c.phone && <a href={`tel:${c.phone}`} style={{ fontSize:10, color:'#22C55E', fontWeight:700, flexShrink:0, textDecoration:'none' }}>Call</a>}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        <div style={{ position:'absolute', bottom:4, right:8, zIndex:999, fontSize:9, color:'rgba(255,255,255,0.3)' }}>© OpenStreetMap · CARTO</div>
      </div>

      {/* Hospitals bottom sheet */}
      {layer === 'hospitals' && (
        <div style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:1100, transform:sheetOpen ? 'translateY(0)' : 'translateY(calc(100% - 48px))', transition:'transform 0.35s cubic-bezier(0.32,0.72,0,1)', background:'linear-gradient(180deg,rgba(18,18,18,0.97),rgba(10,10,10,1))', backdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.08)', borderTopLeftRadius:20, borderTopRightRadius:20, boxShadow:'0 -8px 40px rgba(0,0,0,0.7)', display:'flex', flexDirection:'column', maxHeight:'65%' }}>
          <button onClick={() => setSheetOpen(v => !v)} style={{ width:'100%', background:'none', border:'none', cursor:'pointer', padding:'12px 16px 8px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:30, height:30, borderRadius:10, background:'rgba(236,72,153,0.15)', border:'1px solid rgba(236,72,153,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <MapPin size={13} color="#F472B6" />
              </div>
              <div style={{ textAlign:'left' }}>
                <div style={{ fontSize:13, fontWeight:800, color:'#F5F5F5' }}>Nearby Hospitals</div>
                <div style={{ fontSize:10, color:'#6B7280' }}>
                  {loadingHospitals ? 'Loading live capacity…' : `${hospitals.length} facilities · live status`}
                </div>
              </div>
            </div>
            {sheetOpen ? <ChevronDown size={16} color="#6B7280" /> : <ChevronUp size={16} color="#6B7280" />}
          </button>
          <div style={{ width:36, height:4, borderRadius:2, background:'rgba(255,255,255,0.12)', margin:'0 auto 12px' }} />

          <div style={{ overflowY:'auto', padding:'0 14px 16px', flexShrink:1 }}>
            {loadingHospitals ? (
              <div style={{ textAlign:'center', padding:'20px 0', color:'#6B7280', fontSize:12 }}>Loading hospital capacity…</div>
            ) : hospitals.length === 0 ? (
              <div style={{ textAlign:'center', padding:'20px 0' }}>
                <div style={{ color:'#6B7280', fontSize:12, marginBottom:8 }}>No hospitals with live capacity data yet.</div>
                <div style={{ color:'#4B5563', fontSize:11 }}>Seed hospitals via the backend to show real data.</div>
              </div>
            ) : (
              hospitals.map((h, i) => (
                <div key={h.id || i} style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${i === 0 ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.08)'}`, borderRadius:14, padding:'12px 14px', marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:'#F5F5F5' }}>{h.name}</div>
                      <div style={{ fontSize:11, color:'#6B7280', marginTop:2 }}>{h.distance_km} km · ~{h.eta_min} min</div>
                    </div>
                    {i === 0 && (
                      <button style={{ padding:'6px 12px', borderRadius:20, background:'linear-gradient(135deg,#16A34A,#15803D)', border:'none', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:4, boxShadow:'0 0 10px rgba(22,163,74,0.4)' }}>
                        <Navigation size={11} /> Route Here
                      </button>
                    )}
                  </div>
                  <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                    <StatusBit ok={(h.trauma_bays_free || 0) > 0} label={`Trauma bay: ${(h.trauma_bays_free || 0) > 0 ? `${h.trauma_bays_free} FREE ✓` : 'OCCUPIED ✗'}`} />
                    <StatusBit ok={h.surgeon_on_call} label={`Surgeon: ${h.surgeon_on_call ? 'Available ✓' : 'Unavailable ✗'}`} />
                  </div>
                  {h.stale && (
                    <div style={{ marginTop:8, padding:'5px 10px', borderRadius:8, background:'rgba(234,179,8,0.1)', border:'1px solid rgba(234,179,8,0.3)', display:'flex', alignItems:'center', gap:5, fontSize:10, color:'#FCD34D', fontWeight:600 }}>
                      <Clock size={11} /> Data may be outdated — confirmation SMS sent
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        .leaflet-popup-content-wrapper { background:transparent !important; box-shadow:none !important; padding:0 !important; border-radius:12px !important; }
        .leaflet-popup-tip { background:#1A1A1A !important; }
        .leaflet-popup-content { margin:0 !important; }
        .leaflet-container { background:#0D0D0D; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
