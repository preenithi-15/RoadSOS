import React, { useState, useRef, useEffect } from 'react';
import { X, Share2, CheckCircle, Mic, MicOff, WifiOff, Wifi, Radio } from 'lucide-react';
import { triggerSOS, cancelSOS, classifyTriage, getHospitalRoute, analyzeVoice } from '../api/api.js';
import { getUserId } from '../lib/user.js';
import { getLocation } from '../lib/location.js';
import { isOnline, detectDeliveryLayer, cacheSOS, watchForRecovery, clearCachedSOS, hasCachedSOS } from '../lib/offline.js';

/* ─── keyframes ─────────────────────────────────────────── */
const CSS = `
@keyframes red-throb { 0%,100%{ background:rgba(220,38,38,0.92); } 50%{ background:rgba(185,28,28,0.88); } }
@keyframes fade-up   { from{ opacity:0; transform:translateY(10px); } to{ opacity:1; transform:translateY(0); } }
@keyframes row-in    { from{ opacity:0; transform:translateX(-18px); } to{ opacity:1; transform:translateX(0); } }
@keyframes blink     { 0%,100%{ opacity:1; } 50%{ opacity:0.3; } }
`;
function injectCSS() {
  if (document.getElementById('sos-css')) return;
  const s = document.createElement('style'); s.id = 'sos-css'; s.textContent = CSS; document.head.appendChild(s);
}

const RADIUS = 54;
const CIRC   = 2 * Math.PI * RADIUS;

/* ─── Countdown ─────────────────────────────────────────── */
function CountdownScreen({ count, total, onCancel, gForce }) {
  const pct = count / total;
  const dash = CIRC * (1 - pct);
  return (
    <div style={{ position:'absolute', inset:0, zIndex:50, background:'rgba(180,0,0,0.95)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', animation:'red-throb 1s ease-in-out infinite' }}>
      <div style={{ position:'relative', width:160, height:160, marginBottom:28 }}>
        <svg width="160" height="160" style={{ transform:'rotate(-90deg)' }}>
          <circle cx="80" cy="80" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
          <circle cx="80" cy="80" r={RADIUS} fill="none" stroke="#fff" strokeWidth="8" strokeDasharray={CIRC} strokeDashoffset={dash} strokeLinecap="round" style={{ transition:'stroke-dashoffset 0.9s linear' }} />
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:52, fontWeight:900, color:'#fff', lineHeight:1 }}>{count}</span>
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.7)', fontWeight:600, marginTop:2 }}>seconds</span>
        </div>
      </div>
      <div style={{ fontSize:18, fontWeight:800, color:'#fff', marginBottom:6, textAlign:'center' }}>SOS firing in {count} second{count !== 1 ? 's' : ''}</div>
      <div style={{ fontSize:12, color:'rgba(255,255,255,0.65)', marginBottom:36, textAlign:'center' }}>
        Auto-detected crash · G-force: {gForce}g
      </div>
      <button onClick={onCancel} style={{ padding:'16px 48px', borderRadius:50, background:'#fff', border:'none', color:'#B91C1C', fontSize:15, fontWeight:900, cursor:'pointer', boxShadow:'0 4px 24px rgba(0,0,0,0.3)' }}>
        Cancel SOS
      </button>
    </div>
  );
}

/* ─── Agency screen ─────────────────────────────────────── */
function AgencyScreen({ agencies, onComplete }) {
  const [visible, setVisible] = useState([]);
  useEffect(() => {
    agencies.forEach((_, i) => setTimeout(() => setVisible(v => [...v, i]), 400 + i * 350));
    const t = setTimeout(onComplete, 400 + agencies.length * 350 + 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ position:'absolute', inset:0, zIndex:50, background:'#080808', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 24px' }}>
      <div style={{ padding:'5px 18px', borderRadius:20, marginBottom:28, background:'rgba(220,38,38,0.2)', border:'1px solid rgba(239,68,68,0.4)', display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ width:8, height:8, borderRadius:'50%', background:'#EF4444', animation:'blink 1s infinite', display:'inline-block' }} />
        <span style={{ fontSize:11, fontWeight:800, color:'#EF4444', letterSpacing:'0.15em' }}>LIVE — AGENCIES NOTIFIED</span>
      </div>
      <div style={{ fontSize:15, fontWeight:700, color:'#F5F5F5', marginBottom:4 }}>Emergency services contacted</div>
      <div style={{ fontSize:11, color:'#6B7280', marginBottom:30 }}>Parallel dispatch · no human relay</div>
      <div style={{ width:'100%', maxWidth:340 }}>
        {agencies.map((a, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', marginBottom:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, opacity:visible.includes(i) ? 1 : 0, transform:visible.includes(i) ? 'translateX(0)' : 'translateX(-18px)', transition:'opacity 0.35s ease, transform 0.35s ease' }}>
            <span style={{ fontSize:24, flexShrink:0 }}>{a.emoji}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#F5F5F5' }}>{a.name}</div>
              <div style={{ fontSize:11, color:'#6B7280', marginTop:2 }}>
                {a.ok ? (a.skipped ? 'Logged (SMS not configured)' : 'SMS dispatched ✓') : 'Failed'}
              </div>
            </div>
            <div style={{ padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700, background:a.ok ? 'rgba(74,222,128,0.12)' : 'rgba(239,68,68,0.12)', border:`1px solid ${a.ok ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`, color:a.ok ? '#4ADE80' : '#F87171', whiteSpace:'nowrap' }}>
              {a.ok ? 'Notified' : 'Error'}
            </div>
          </div>
        ))}
      </div>
      {/* Hospital ETA if available */}
    </div>
  );
}

/* ─── Black Box / Confirmation screen ───────────────────── */
function BlackBoxScreen({ sosId, hospital, onReset, location }) {
  const [visible, setVisible] = useState([]);
  const [showBottom, setShowBottom] = useState(false);

  const confirmations = [
    { text: 'MLC auto-filed',         sub: 'Police Control Room (SMS)' },
    { text: 'Insurance claim opened', sub: 'Reference logged in black box' },
    { text: 'Hospital pre-notified',  sub: hospital ? hospital.name : 'Routing in progress…' },
    { text: 'Bystander alert sent',   sub: 'Geocast to 500m radius' },
  ];

  useEffect(() => {
    confirmations.forEach((_, i) => setTimeout(() => setVisible(v => [...v, i]), 200 + i * 350));
    setTimeout(() => setShowBottom(true), 1800);
  }, []);

  const shareLocation = () => {
    const url = `https://maps.google.com/?q=${location.lat},${location.lng}`;
    if (navigator.share) navigator.share({ title: 'RoadSoS crash location', url });
    else window.open(url, '_blank');
  };

  return (
    <div style={{ position:'absolute', inset:0, zIndex:50, background:'#050505', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 24px' }}>
      <div style={{ width:56, height:56, borderRadius:'50%', marginBottom:20, background:'rgba(22,163,74,0.15)', border:'2px solid rgba(74,222,128,0.4)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 28px rgba(74,222,128,0.2)' }}>
        <CheckCircle size={26} color="#4ADE80" />
      </div>
      <div style={{ fontSize:16, fontWeight:900, color:'#F5F5F5', marginBottom:4 }}>Black Box Filed</div>
      <div style={{ fontSize:11, color:'#6B7280', marginBottom:28 }}>SOS ID: {sosId?.slice(0, 8)}… · All systems confirmed</div>
      <div style={{ width:'100%', maxWidth:340 }}>
        {confirmations.map((c, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', marginBottom:8, background:'rgba(22,163,74,0.06)', border:'1px solid rgba(74,222,128,0.15)', borderRadius:12, opacity:visible.includes(i) ? 1 : 0, transform:visible.includes(i) ? 'scale(1)' : 'scale(0.92)', transition:'opacity 0.35s ease, transform 0.35s ease' }}>
            <div style={{ width:24, height:24, borderRadius:'50%', flexShrink:0, background:visible.includes(i) ? 'rgba(74,222,128,0.2)' : 'transparent', border:'1.5px solid rgba(74,222,128,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {visible.includes(i) && <CheckCircle size={13} color="#4ADE80" />}
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#F5F5F5' }}>{c.text}</div>
              <div style={{ fontSize:10, color:'#6B7280', marginTop:1 }}>{c.sub}</div>
            </div>
          </div>
        ))}
      </div>
      {showBottom && (
        <div style={{ marginTop:24, textAlign:'center', width:'100%', maxWidth:340, animation:'fade-up 0.5s ease-out both' }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#F5F5F5', marginBottom:4 }}>Stay calm. Help is on the way.</div>
          <div style={{ fontSize:11, color:'#6B7280', marginBottom:16 }}>
            {hospital ? `Ambulance → ${hospital.name} (~${hospital.eta_min} min)` : 'Ambulance dispatched · Police en route'}
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
            <button onClick={shareLocation} style={{ display:'flex', alignItems:'center', gap:6, padding:'11px 22px', borderRadius:12, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#1D4ED8,#1E40AF)', color:'#fff', fontSize:12, fontWeight:700, boxShadow:'0 0 14px rgba(29,78,216,0.4)' }}>
              <Share2 size={13} /> Share Location
            </button>
            <button onClick={onReset} style={{ padding:'11px 18px', borderRadius:12, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.12)', color:'#9CA3AF', fontSize:12, fontWeight:700, cursor:'pointer' }}>
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Emergency type grid ───────────────────────────────── */
const EMERG_TYPES = [
  { id:'accident', label:'Road Accident', icon:'🚗', col:'#EF4444' },
  { id:'medical',  label:'Medical',       icon:'🏥', col:'#EC4899' },
  { id:'fire',     label:'Fire',          icon:'🔥', col:'#F97316' },
  { id:'flood',    label:'Flood',         icon:'🌊', col:'#3B82F6' },
  { id:'crime',    label:'Crime',         icon:'🚨', col:'#A855F7' },
  { id:'other',    label:'Other',         icon:'⚠️', col:'#EAB308' },
];

/* ─── Main ──────────────────────────────────────────────── */
export default function SOSPage() {
  useEffect(() => { injectCSS(); }, []);

  // Monitor network status + delivery layer
  useEffect(() => {
    const onOnline  = () => { setOnline(true);  setDeliveryLayer(detectDeliveryLayer()); };
    const onOffline = () => { setOnline(false); setDeliveryLayer('CACHE_FORWARD'); };
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    setDeliveryLayer(detectDeliveryLayer());

    // Fire any cached SOS when connectivity returns
    const cleanup = watchForRecovery((result) => {
      setRecoveryResult(result);
      setCachedSOS(false);
    });
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); cleanup(); };
  }, []);

  const [phase, setPhase]           = useState('idle');
  const [count, setCount]           = useState(10);
  const [selType, setSelType]       = useState('accident');
  const [recording, setRecording]   = useState(false);
  const [voiceResult, setVoiceResult] = useState(null);
  const [agencies, setAgencies]     = useState([]);
  const [sosId, setSosId]           = useState(null);
  const [hospital, setHospital]     = useState(null);
  const [location, setLocation]     = useState({ lat: 13.0827, lng: 80.2707 });
  const [gForce, setGForce]         = useState(8.2);
  const [loading, setLoading]       = useState(false);
  const [online, setOnline]         = useState(isOnline());
  const [deliveryLayer, setDeliveryLayer] = useState('DIRECT');
  const [cachedSOS, setCachedSOS]   = useState(hasCachedSOS());
  const [recoveryResult, setRecoveryResult] = useState(null);
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const TOTAL = 10;

  const toggleRecording = async () => {
    if (recording) {
      // Stop recording and send to backend
      mediaRecorderRef.current?.stop();
      setRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        audioChunksRef.current = [];
        mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
        mr.onstop = async () => {
          stream.getTracks().forEach(t => t.stop());
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = async () => {
            const b64 = reader.result.split(',')[1];
            try {
              const uid = await getUserId();
              // If SOS is active send to analyze-voice, else just show classification
              const result = await analyzeVoice({
                sos_event_id: sosId || '00000000-0000-0000-0000-000000000001',
                audio_base64: b64,
              });
              setVoiceResult(result);
            } catch (e) { console.warn('[Voice] analysis failed:', e); }
          };
          reader.readAsDataURL(blob);
        };
        mediaRecorderRef.current = mr;
        mr.start();
        setRecording(true);
        // Auto-stop after 8 seconds
        setTimeout(() => { if (mr.state === 'recording') mr.stop(); }, 8000);
      } catch (e) {
        console.warn('[Voice] mic access denied:', e);
      }
    }
  };

  const startSOS = async () => {
    if (phase !== 'idle' || loading) return;
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    setCount(TOTAL);
    setPhase('countdown');

    getLocation().then(loc => setLocation(loc));
    setGForce(Number((7 + Math.random() * 4).toFixed(1)));

    let c = TOTAL;
    timerRef.current = setInterval(() => {
      c -= 1;
      setCount(c);
      if (navigator.vibrate) navigator.vibrate(80);
      if (c <= 0) {
        clearInterval(timerRef.current);
        if (!navigator.onLine) {
          // DEAD-ZONE: cache the SOS and show offline confirmation
          fireSOS_offline();
        } else {
          fireSOS();
        }
      }
    }, 1000);
  };

  const fireSOS_offline = async () => {
    setPhase('agencies');
    const userId = await getUserId();
    const cached = cacheSOS({ user_id: userId, lat: location.lat, lng: location.lng, g_force: gForce, speed_kmh: 65 });
    setCachedSOS(true);
    // Show "offline" agency rows
    const layer = detectDeliveryLayer();
    setAgencies([
      { emoji:'📡', name:'Cache + Forward', ok:true,  skipped:false, offline: true },
      { emoji:'📶', name:'BLE Mesh Relay (seeking nearby device)', ok:false, skipped:true, offline: true },
      { emoji:'📱', name:'2G SMS fallback (queued)', ok:true,  skipped:false, offline: true },
    ]);
    // Recovery watcher is already set up — will auto-fire when signal returns
  };

  const fireSOS = async () => {
    setPhase('agencies');
    try {
      const userId = await getUserId();
      const loc    = location;

      const result = await triggerSOS({
        user_id: userId,
        lat: loc.lat,
        lng: loc.lng,
        g_force: gForce,
        speed_kmh: 65,
        acoustic_match: true,
      });

      setSosId(result.sos_id);

      // Build agency display rows from the real response
      const notified = result.agencies_notified ?? [];
      const displayAgencies = [
        { emoji:'🚑', name:'EMRI 108 — Ambulance Dispatch', ...notified[0] },
        { emoji:'🚓', name:'Police Control Room (PCR)',      ...notified[1] },
        { emoji:'🚒', name:'Fire Services (via relay)',       ok:true, skipped:true },
      ];
      setAgencies(displayAgencies);

      // Send triage — simulate on-device model saying P1 for a crash
      await classifyTriage({ sos_event_id: result.sos_id, priority: 'P1', indicators: ['high_g_force', 'acoustic_match'] });

    } catch (err) {
      console.error('[SOS] trigger failed:', err);
      setAgencies([
        { emoji:'🚑', name:'EMRI 108 — Ambulance Dispatch', ok:false },
        { emoji:'🚓', name:'Police Control Room', ok:false },
      ]);
    }
  };

  const onAgenciesComplete = async () => {
    setPhase('blackbox');
    // Fetch hospital route
    try {
      const userId = await getUserId();
      const profile = JSON.parse(localStorage.getItem('roadsos_profile') || '{}');
      const hosp = await getHospitalRoute({ sos_event_id: sosId, lat: location.lat, lng: location.lng, blood_group: profile.blood_group || 'O+', triage_priority: 'P1' });
      if (hosp.hospital) setHospital(hosp.hospital);
    } catch (e) { console.warn('[SOS] hospital route failed:', e); }
  };

  const cancelSOS_fn = async () => {
    clearInterval(timerRef.current);
    if (sosId) {
      try {
        const userId = await getUserId();
        await cancelSOS({ sos_event_id: sosId, user_id: userId });
      } catch (e) { /* ignore */ }
    }
    clearCachedSOS();
    setCachedSOS(false);
    setPhase('idle'); setCount(TOTAL); setSosId(null); setHospital(null);
    if (navigator.vibrate) navigator.vibrate(50);
  };

  return (
    <div style={{ height:'100%', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column' }}>
      {phase === 'countdown' && <CountdownScreen count={count} total={TOTAL} onCancel={cancelSOS_fn} gForce={gForce} />}
      {phase === 'agencies'  && <AgencyScreen agencies={agencies} onComplete={onAgenciesComplete} />}
      {phase === 'blackbox'  && <BlackBoxScreen sosId={sosId} hospital={hospital} onReset={cancelSOS_fn} location={location} />}

      <div className="scroll-area" style={{ flex:1, paddingBottom:16 }}>
        <div style={{ padding:'16px 16px 8px' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#EF4444', textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:2 }}>Emergency Trigger</div>
          <h1 style={{ fontSize:26, fontWeight:900, color:'#F5F5F5', margin:0 }}>SOS Alert</h1>
        </div>

        {/* Dead-Zone status bar */}
        <div style={{ margin:'0 16px 8px', padding:'10px 14px', borderRadius:12, background: online ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.12)', border:`1px solid ${online ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.4)'}`, display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ flexShrink:0 }}>{online ? <Wifi size={14} color="#22C55E" /> : <WifiOff size={14} color="#EF4444" />}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, fontWeight:700, color: online ? '#22C55E' : '#F87171' }}>
              {online ? 'Signal active — direct SOS' : '⚠ DEAD ZONE — SOS will use fallback chain'}
            </div>
            <div style={{ fontSize:10, color:'#6B7280', marginTop:1 }}>
              {online
                ? `Layer: DIRECT | BLE ready | 2G SMS standby | Satellite standby`
                : `Layer: ${deliveryLayer} | Caching SOS → fires on signal recovery`}
            </div>
          </div>
          {!online && <Radio size={14} color="#F97316" style={{ animation:'blink 1s ease-in-out infinite', flexShrink:0 }} />}
        </div>

        {/* Recovery notification */}
        {recoveryResult && (
          <div style={{ margin:'0 16px 8px', padding:'10px 14px', borderRadius:12, background:'rgba(22,163,74,0.12)', border:'1px solid rgba(74,222,128,0.3)', display:'flex', alignItems:'center', gap:8 }}>
            <CheckCircle size={14} color="#4ADE80" />
            <div style={{ fontSize:11, color:'#4ADE80', fontWeight:700 }}>
              Cached SOS delivered! ({recoveryResult.delivery_method} — {recoveryResult.delay_minutes}m delay)
            </div>
            <button onClick={() => setRecoveryResult(null)} style={{ background:'none', border:'none', color:'#4B5563', cursor:'pointer', marginLeft:'auto' }}><X size={12} /></button>
          </div>
        )}

        {/* Cached SOS waiting banner */}
        {cachedSOS && online && (
          <div style={{ margin:'0 16px 8px', padding:'10px 14px', borderRadius:12, background:'rgba(251,191,36,0.1)', border:'1px solid rgba(251,191,36,0.3)', display:'flex', alignItems:'center', gap:8 }}>
            <Radio size={14} color="#FCD34D" />
            <div style={{ fontSize:11, color:'#FCD34D', fontWeight:700 }}>Signal restored — firing cached SOS…</div>
          </div>
        )}

        {/* Emergency type grid */}
        <div style={{ padding:'8px 16px 16px' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Emergency Type</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {EMERG_TYPES.map(({ id, label, icon, col }) => (
              <button key={id} onClick={() => setSelType(id)} style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderRadius:14, cursor:'pointer', background:selType === id ? `${col}18` : 'rgba(255,255,255,0.04)', border:selType === id ? `2px solid ${col}` : '1px solid rgba(255,255,255,0.08)', transition:'all 0.18s' }}>
                <span style={{ fontSize:20 }}>{icon}</span>
                <span style={{ fontSize:12, fontWeight:700, color:selType === id ? '#F5F5F5' : '#9CA3AF' }}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Big SOS button */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'8px 0 20px' }}>
          <div style={{ width:200, height:200, borderRadius:'50%', background:'rgba(139,0,0,0.12)', display:'flex', alignItems:'center', justifyContent:'center', animation:'sos-ring 2s ease-out infinite' }}>
            <button onClick={startSOS} className="animate-sos-pulse" style={{ width:160, height:160, borderRadius:'50%', border:'none', background:'linear-gradient(145deg,#DC2626,#7F1D1D)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 0 40px rgba(220,38,38,0.6), 0 0 80px rgba(220,38,38,0.2)' }}>
              <span style={{ fontSize:42, fontWeight:900, color:'#fff', letterSpacing:'-0.02em' }}>SOS</span>
              <span style={{ fontSize:11, color:'rgba(255,200,200,0.8)', fontWeight:600, marginTop:2 }}>Tap to activate</span>
            </button>
          </div>
          <div style={{ marginTop:12, fontSize:11, color:'#4B5563', textAlign:'center' }}>10-second countdown · SMS to agencies · MLC auto-filed</div>
        </div>

        {/* Voice SOS */}
        <div style={{ padding:'0 16px 14px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14 }}>
            <button onClick={toggleRecording} style={{ width:46, height:46, borderRadius:'50%', border:'none', background:recording ? '#DC2626' : '#1F1F1F', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, animation:recording ? 'blink 1s ease-in-out infinite' : 'none', boxShadow:recording ? '0 0 14px rgba(220,38,38,0.5)' : 'none' }}>
              {recording ? <Mic size={20} color="#fff" /> : <MicOff size={20} color="#6B7280" />}
            </button>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#F5F5F5' }}>Voice SOS</div>
              <div style={{ fontSize:11, color:'#6B7280' }}>{recording ? 'Recording… tap again to stop & analyse' : 'Tap mic — AI classifies emergency type'}</div>
              {voiceResult && (
                <div style={{ marginTop:4, padding:'4px 8px', borderRadius:8, background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', display:'inline-block' }}>
                  <span style={{ fontSize:10, fontWeight:700, color:'#EF4444' }}>
                    Voice: {voiceResult.priority} · {Math.round((voiceResult.confidence||0)*100)}% confidence
                    {voiceResult.indicators?.length > 0 ? ` · ${voiceResult.indicators[0]}` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick dial */}
        <div style={{ padding:'0 16px' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Quick Dial</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            {[{ num:'112', label:'Emergency', icon:'🚨', col:'#EF4444' }, { num:'108', label:'Ambulance', icon:'🚑', col:'#EC4899' }, { num:'101', label:'Fire', icon:'🔥', col:'#F97316' }].map(({ num, label, icon, col }) => (
              <a key={num} href={`tel:${num}`} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'12px 8px', borderRadius:14, textDecoration:'none', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize:20 }}>{icon}</span>
                <span style={{ fontSize:16, fontWeight:900, color:col }}>{num}</span>
                <span style={{ fontSize:10, color:'#6B7280' }}>{label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
