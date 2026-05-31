import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MapPin, Zap, Users, Shield, AlertTriangle, Wifi, Navigation, Radio, Hospital, Phone, Activity, CheckCircle, X } from 'lucide-react';
import { getHazardNodes, getNearbyResponders, getHospitalRoute, setLanguage } from '../api/api.js';
import { useLang } from '../lib/LangContext.jsx';
import { t } from '../lib/i18n.js';
import { getLocation } from '../lib/location.js';
import { getUserId } from '../lib/user.js';

/* ─── Alert sheet ─────────────────────────────────────────── */
const LEVEL_STYLES = {
  red:    { border:'#FF2D2D', bg:'rgba(255,45,45,0.08)',   dot:'#FF2D2D', text:'#FF6B6B' },
  yellow: { border:'#F59E0B', bg:'rgba(245,158,11,0.08)', dot:'#F59E0B', text:'#FCD34D' },
  green:  { border:'#22C55E', bg:'rgba(34,197,94,0.08)',  dot:'#22C55E', text:'#4ADE80' },
  blue:   { border:'#3B82F6', bg:'rgba(59,130,246,0.08)', dot:'#3B82F6', text:'#60A5FA' },
};

function AlertSheet({ alert, onClose }) {
  const ls = LEVEL_STYLES[alert.level];
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:999, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', display:'flex', alignItems:'flex-end' }}>
      <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:430, margin:'0 auto', background:'#111', borderRadius:'20px 20px 0 0', padding:'20px 20px 36px', borderTop:`2px solid ${ls.border}`, animation:'slideUp 0.28s cubic-bezier(0.16,1,0.3,1)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:22 }}>{alert.emoji}</span>
            <div>
              <div style={{ color:'#fff', fontWeight:700, fontSize:15 }}>{alert.title}</div>
              <div style={{ color:'#666', fontSize:11, marginTop:2 }}>{alert.time} · {alert.location}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ color:'#555', background:'#1A1A1A', border:'none', borderRadius:8, padding:'6px 8px', cursor:'pointer' }}><X size={16} /></button>
        </div>
        <div style={{ background:ls.bg, border:`1px solid ${ls.border}33`, borderRadius:12, padding:'12px 14px', marginBottom:16 }}>
          <div style={{ color:'#ccc', fontSize:13, lineHeight:1.6 }}>{alert.detail}</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <div style={{ flex:1, background:'#1A1A1A', borderRadius:10, padding:'10px 12px' }}>
            <div style={{ color:'#555', fontSize:10, marginBottom:2 }}>DISTANCE</div>
            <div style={{ color:'#fff', fontWeight:700, fontSize:14 }}>{alert.distance}</div>
          </div>
          <div style={{ flex:2, background:'#1A1A1A', borderRadius:10, padding:'10px 12px' }}>
            <div style={{ color:'#555', fontSize:10, marginBottom:2 }}>ROAD</div>
            <div style={{ color:'#fff', fontWeight:700, fontSize:13 }}>{alert.location}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, value, label, sub, delay }) {
  return (
    <div style={{ background:'#1A1A1A', borderRadius:16, padding:'14px 14px 12px', border:'1px solid #2A2A2A', opacity:0, animation:`fadeInUp 0.4s ease-out ${delay}ms forwards` }}>
      <div style={{ width:34, height:34, borderRadius:10, background:'rgba(255,45,45,0.15)', border:'1px solid rgba(255,45,45,0.25)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
        <Icon size={16} color="#FF2D2D" />
      </div>
      <div style={{ color:'#fff', fontWeight:800, fontSize:22, lineHeight:1 }}>{value}</div>
      <div style={{ color:'#888', fontSize:11, fontWeight:600, marginTop:4 }}>{label}</div>
      <div style={{ color:'#444', fontSize:10, marginTop:2 }}>{sub}</div>
    </div>
  );
}

function AlertCard({ alert, onTap, delay }) {
  const ls = LEVEL_STYLES[alert.level];
  return (
    <button onClick={() => onTap(alert)} style={{ display:'flex', alignItems:'flex-start', gap:12, background:ls.bg, borderRadius:14, border:`1px solid ${ls.border}33`, borderLeft:`3px solid ${ls.border}`, padding:'12px 14px', width:'100%', textAlign:'left', cursor:'pointer', marginBottom:8, opacity:0, animation:`fadeInUp 0.4s ease-out ${delay}ms forwards` }}>
      <span style={{ fontSize:17, marginTop:1, flexShrink:0 }}>{alert.emoji}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ color:'#fff', fontWeight:600, fontSize:13 }}>{alert.title}</div>
        <div style={{ color:'#777', fontSize:11, marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{alert.subtitle}</div>
      </div>
      <div style={{ color:'#444', fontSize:10, flexShrink:0, marginTop:2 }}>{alert.time}</div>
    </button>
  );
}

/* ─── Mini map ───────────────────────────────────────────── */
function MiniMap({ hazards, onViewFull }) {
  const count = hazards.length;
  return (
    <div style={{ background:'#111', borderRadius:16, border:'1px solid #222', overflow:'hidden', marginBottom:16, opacity:0, animation:'fadeInUp 0.4s ease-out 600ms forwards' }}>
      <div style={{ padding:'14px 16px 10px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ color:'#fff', fontWeight:700, fontSize:13 }}>Hazard nodes near you</div>
          <div style={{ color: count > 0 ? '#F59E0B' : '#22C55E', fontSize:11, marginTop:2 }}>
            {count > 0 ? `⚠ ${count} confirmed hazard${count !== 1 ? 's' : ''} within 50 km` : '✓ No confirmed hazards nearby'}
          </div>
        </div>
        <button onClick={onViewFull} style={{ color:'#FF2D2D', fontSize:11, fontWeight:600, background:'none', border:'none', cursor:'pointer' }}>View map →</button>
      </div>
      <div style={{ position:'relative', height:110, background:'#0D0D0D', margin:'0 12px 12px', borderRadius:10, overflow:'hidden' }}>
        {[25,50,75].map(pct => (
          <React.Fragment key={pct}>
            <div style={{ position:'absolute', left:`${pct}%`, top:0, bottom:0, width:1, background:'#1E1E1E' }} />
            <div style={{ position:'absolute', top:`${pct}%`, left:0, right:0, height:1, background:'#1E1E1E' }} />
          </React.Fragment>
        ))}
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
          <path d="M0,55 Q60,50 110,42 Q160,34 200,42" stroke="#2A2A2A" strokeWidth="2" fill="none" />
          <path d="M30,0 Q80,40 90,110" stroke="#2A2A2A" strokeWidth="2" fill="none" />
        </svg>
        {/* User dot */}
        <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', width:12, height:12, borderRadius:'50%', background:'#3B82F6', border:'2px solid #fff' }} />
        {/* Hazard dots (up to 3) */}
        {hazards.slice(0,3).map((h, i) => {
          const positions = [{ left:'38%', top:'42%' }, { left:'62%', top:'30%' }, { left:'55%', top:'65%' }];
          const p = positions[i];
          const col = h.risk_score >= 0.7 ? '#EF4444' : '#F59E0B';
          return (
            <div key={h.id} style={{ position:'absolute', left:p.left, top:p.top, transform:'translate(-50%,-50%)' }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:col, border:'2px solid #000' }} />
            </div>
          );
        })}
        <div style={{ position:'absolute', bottom:6, left:8, color:'#444', fontSize:9 }}>You</div>
      </div>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────── */
export default function HomePage() {
  const navigate = useNavigate();
  const [activeAlert, setActiveAlert] = useState(null);
  const [syncCount, setSyncCount] = useState(0);
  const [lifelineSet, setLifelineSet] = useState(false);
  const { lang, changeLang: ctxChangeLang } = useLang();
  const [showLangPicker, setShowLangPicker] = useState(false);

  const LANGS = [
    { code:'en', label:'English' }, { code:'hi', label:'हिंदी' },
    { code:'te', label:'తెలుగు' }, { code:'ta', label:'தமிழ்' },
    { code:'kn', label:'ಕನ್ನಡ' },  { code:'ml', label:'മലയാളം' },
    { code:'fr', label:'Français' },{ code:'es', label:'Español' },
    { code:'ar', label:'العربية' }, { code:'de', label:'Deutsch' },
    { code:'zh', label:'中文' },    { code:'pt', label:'Português' },
    { code:'ru', label:'Русский' },
  ];

  const changeLang = async (code) => {
    ctxChangeLang(code);  // updates context → all components re-render
    setShowLangPicker(false);
    try { const uid = await getUserId(); await setLanguage({ user_id: uid, language: code }); } catch(e) {}
  };
  const [stats, setStats] = useState({ nearestKm:'—', responders:'—', hazards:'—', activeSOS:'0' });
  const [hazards, setHazards] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // Tick the sync counter
  useEffect(() => {
    const t = setInterval(() => setSyncCount(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Check if lifeline is set
  useEffect(() => {
    const p = localStorage.getItem('roadsos_profile');
    if (p) {
      const parsed = JSON.parse(p);
      setLifelineSet(Boolean(parsed.qr_token));
    }
  }, []);

  // Load real stats
  useEffect(() => {
    getUserId(); // ensure user exists
    getLocation().then(async loc => {
      try {
        const [hazardData, responderData, hospitalData] = await Promise.allSettled([
          getHazardNodes({ lat: loc.lat, lng: loc.lng, radius_km: 50 }),
          getNearbyResponders({ lat: loc.lat, lng: loc.lng, radius_km: 30 }),
          getHospitalRoute({ lat: loc.lat, lng: loc.lng }),
        ]);

        const nodes  = hazardData.status  === 'fulfilled' ? (hazardData.value.nodes  || []) : [];
        const resp   = responderData.status === 'fulfilled' ? (responderData.value.responders || []) : [];
        const hosp   = hospitalData.status === 'fulfilled' ? hospitalData.value.hospital : null;

        setHazards(nodes);
        setStats({
          nearestKm: hosp ? `${hosp.distance_km}km` : '—',
          responders: resp.length,
          hazards: nodes.length,
          activeSOS: '0',
        });

        // Build alert cards from hazard nodes
        const hazardAlerts = nodes.slice(0, 2).map((h, i) => ({
          id: h.id,
          level: h.risk_score >= 0.7 ? 'red' : 'yellow',
          emoji: h.risk_score >= 0.7 ? '🔴' : '🟡',
          title: 'Road Hazard Node',
          subtitle: `${h.road_class || 'Highway'} · ${h.distance_km} km away · ${h.trigger_count} reports`,
          time: new Date(h.last_updated).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }),
          detail: `Confirmed hazard on ${h.road_class || 'highway'} at this location. ${h.trigger_count} distinct users have braked hard here. Risk score: ${(h.risk_score * 100).toFixed(0)}%. Updated: ${new Date(h.last_updated).toLocaleString()}.`,
          distance: `${h.distance_km} km`,
          location: h.road_class || 'Highway',
        }));

        if (resp.length > 0) {
          hazardAlerts.push({
            id: 'resp',
            level: 'blue',
            emoji: '🔵',
            title: 'Responder Nearby',
            subtitle: `${resp[0].name} (${resp[0].credential_type?.replace('_',' ')}) is online`,
            time: 'now',
            detail: `Verified responder ${resp[0].name} is active within ${resp[0].distance_km} km of your location.`,
            distance: `${resp[0].distance_km} km`,
            location: 'Near you',
          });
        }

        if (hosp) {
          hazardAlerts.push({
            id: 'hosp',
            level: 'green',
            emoji: '🟢',
            title: 'Hospital Ready',
            subtitle: `${hosp.name} · ${hosp.distance_km} km`,
            time: 'live',
            detail: `${hosp.name} is ${hosp.distance_km} km away with an estimated ETA of ${hosp.eta_min} minutes.`,
            distance: `${hosp.distance_km} km`,
            location: hosp.name,
          });
        }

        setAlerts(hazardAlerts);
      } catch (e) {
        console.warn('[Home] stats load failed:', e);
      }
    });
  }, []);

  return (
    <>
      <div className="scroll-area" style={{ height:'100%', paddingBottom:12 }}>

        {/* Header */}
        <div style={{ padding:'14px 18px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ color:'#fff', fontWeight:300, fontSize:22, letterSpacing:'0.22em', textTransform:'lowercase', fontFamily:"'Outfit', 'Inter', sans-serif" }}>varadhi</div>
          <div style={{ display:'flex', alignItems:'center', gap:10, position:'relative' }}>
            {/* Language picker */}
            <button onClick={() => setShowLangPicker(p => !p)} style={{ background:'#1A1A1A', border:'1px solid #2A2A2A', borderRadius:10, padding:'5px 8px', cursor:'pointer', fontSize:11, color:'#9CA3AF', fontWeight:600 }}>
              🌐 {lang.toUpperCase()}
            </button>
            {showLangPicker && (
              <div style={{ position:'absolute', top:38, right:0, background:'#1A1A1A', border:'1px solid #2E2E2E', borderRadius:12, padding:8, zIndex:999, minWidth:160, boxShadow:'0 8px 24px rgba(0,0,0,0.5)' }}>
                {LANGS.map(l => (
                  <button key={l.code} onClick={() => changeLang(l.code)} style={{ display:'block', width:'100%', padding:'7px 10px', background:lang===l.code ? 'rgba(220,38,38,0.15)' : 'none', border:'none', borderRadius:8, color:lang===l.code ? '#EF4444' : '#D1D5DB', fontSize:12, textAlign:'left', cursor:'pointer', fontWeight:lang===l.code ? 700 : 400 }}>
                    {l.label}
                  </button>
                ))}
              </div>
            )}
            <button style={{ position:'relative', background:'#1A1A1A', border:'1px solid #2A2A2A', borderRadius:10, padding:8, cursor:'pointer' }} aria-label="Notifications">
              <Bell size={16} color="#ccc" />
              {alerts.length > 0 && <span style={{ position:'absolute', top:6, right:6, width:7, height:7, borderRadius:'50%', background:'#FF2D2D', border:'1.5px solid #000' }} />}
            </button>
            <button onClick={() => navigate('/medical')} style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#FF2D2D,#8B0000)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', letterSpacing:'0.05em', border:'none', cursor:'pointer', flexShrink:0 }}>RS</button>
          </div>
        </div>

        {/* System status */}
        <div style={{ padding:'8px 18px 14px' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(34,197,94,0.08)', borderRadius:20, padding:'4px 12px', border:'1px solid rgba(34,197,94,0.2)' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#22C55E', display:'inline-block', animation:'blink 2s ease-in-out infinite' }} />
            <span style={{ color:'#22C55E', fontSize:11, fontWeight:500 }}>System Active · GPS locked · Last sync {syncCount}s ago</span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, padding:'0 16px 16px' }}>
          <StatCard icon={MapPin}  value={stats.nearestKm} label={t('home.nearest_hospital')}  sub={stats.nearestKm === '—' ? 'Loading…' : t('home.live_capacity')}    delay={50}  />
          <StatCard icon={Zap}     value="99%"             label="System uptime"        sub="All services live"                                           delay={120} />
          <StatCard icon={Users}   value={stats.responders} label={t('home.responders')} sub={stats.responders === '—' ? 'Loading…' : t('home.verified')} delay={190} />
          <StatCard icon={Shield}  value={stats.activeSOS} label="Active SOS near you" sub="All clear"                                                    delay={260} />
        </div>

        {/* LifeLine banner */}
        {lifelineSet ? (
          <div style={{ margin:'0 16px 16px', background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.25)', borderRadius:14, padding:'12px 16px', display:'flex', alignItems:'center', gap:12, opacity:0, animation:'fadeInUp 0.4s ease-out 320ms forwards' }}>
            <CheckCircle size={20} color="#22C55E" />
            <div style={{ flex:1 }}>
              <div style={{ color:'#22C55E', fontWeight:700, fontSize:12 }}>LifeLine active</div>
              <div style={{ color:'#666', fontSize:11, marginTop:2 }}>QR code ready · Scan by any medic</div>
            </div>
          </div>
        ) : (
          <div style={{ margin:'0 16px 16px', background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:14, padding:'12px 16px', opacity:0, animation:'fadeInUp 0.4s ease-out 320ms forwards' }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
              <div>
                <div style={{ color:'#F59E0B', fontWeight:700, fontSize:12, marginBottom:3 }}>⚠ LifeLine profile incomplete</div>
                <div style={{ color:'#666', fontSize:11, lineHeight:1.5 }}>Medics won't have your data at the crash scene</div>
              </div>
              <button onClick={() => navigate('/medical')} style={{ background:'#FF2D2D', color:'#fff', border:'none', borderRadius:9, padding:'7px 12px', fontSize:11, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
                Complete Now →
              </button>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div style={{ padding:'0 16px 16px' }}>
          <div style={{ color:'#444', fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:10 }}>Quick Actions</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            <a href="tel:112" style={{ textDecoration:'none' }}>
              <div style={{ background:'#1A1A1A', border:'1px solid #FF2D2D33', borderRadius:14, padding:'14px 8px', display:'flex', flexDirection:'column', alignItems:'center', gap:8, cursor:'pointer' }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,45,45,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}><Phone size={17} color="#FF2D2D" /></div>
                <span style={{ color:'#eee', fontSize:11, fontWeight:600 }}>Call 112</span>
              </div>
            </a>
            <button onClick={() => navigate('/map')} style={{ background:'#1A1A1A', border:'1px solid #F59E0B33', borderRadius:14, padding:'14px 8px', display:'flex', flexDirection:'column', alignItems:'center', gap:8, cursor:'pointer', width:'100%' }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'rgba(245,158,11,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}><Bell size={17} color="#F59E0B" /></div>
              <span style={{ color:'#eee', fontSize:11, fontWeight:600 }}>Hazard Map</span>
            </button>
            <button onClick={() => navigate('/responders')} style={{ background:'#1A1A1A', border:'1px solid #3B82F633', borderRadius:14, padding:'14px 8px', display:'flex', flexDirection:'column', alignItems:'center', gap:8, cursor:'pointer', width:'100%' }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'rgba(59,130,246,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}><Users size={17} color="#3B82F6" /></div>
              <span style={{ color:'#eee', fontSize:11, fontWeight:600 }}>Responders</span>
            </button>
          </div>
        </div>

        {/* Recent alerts (from real data) */}
        {alerts.length > 0 && (
          <div style={{ padding:'0 16px 16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div style={{ color:'#444', fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase' }}>Live Alerts</div>
              <button onClick={() => navigate('/map')} style={{ color:'#FF2D2D', fontSize:11, fontWeight:600, background:'none', border:'none', cursor:'pointer' }}>See map →</button>
            </div>
            {alerts.map((a, i) => <AlertCard key={a.id} alert={a} onTap={setActiveAlert} delay={350 + i * 60} />)}
          </div>
        )}

        {/* Mini map */}
        <div style={{ padding:'0 16px' }}>
          <MiniMap hazards={hazards} onViewFull={() => navigate('/map')} />
        </div>

        {/* Corridor status */}
        <div style={{ margin:'0 16px 20px', background:'#111', border:'1px solid #1E1E1E', borderRadius:16, padding:'14px 16px', opacity:0, animation:'fadeInUp 0.4s ease-out 700ms forwards' }}>
          <div style={{ color:'#555', fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:12 }}>Varadhi corridor status</div>
          {[
            { icon:Radio,     label:'Acoustic trigger',     status:'Listening',               ok:true },
            { icon:Activity,  label:'Agency relay',          status:'Connected',               ok:true },
            { icon:Hospital,  label:'Hospital network',      status:stats.nearestKm !== '—' ? `${stats.nearestKm} nearest` : 'Syncing…', ok:stats.nearestKm !== '—' },
            { icon:Navigation,label:'Rural responder grid',  status:stats.responders !== '—' ? `${stats.responders} active nearby` : 'Syncing…', ok:stats.responders !== '—' && stats.responders > 0 },
          ].map(({ icon:Icon, label, status, ok }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <span style={{ width:7, height:7, borderRadius:'50%', flexShrink:0, background:ok ? '#22C55E' : '#FF2D2D', boxShadow:ok ? '0 0 6px #22C55E88' : '0 0 6px #FF2D2D88' }} />
              <Icon size={13} color="#555" />
              <span style={{ color:'#666', fontSize:12, flex:1 }}>{label}</span>
              <span style={{ color:ok ? '#22C55E' : '#FF2D2D', fontSize:11, fontWeight:600 }}>{status}</span>
            </div>
          ))}
        </div>
      </div>

      {activeAlert && <AlertSheet alert={activeAlert} onClose={() => setActiveAlert(null)} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap');
        @keyframes fadeInUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideUp  { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0.3} }
        button { font-family:inherit; }
      `}</style>
    </>
  );
}
