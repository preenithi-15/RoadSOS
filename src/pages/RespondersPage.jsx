import React, { useState, useEffect } from 'react';
import { Users, UserPlus, AlertTriangle, Check, X, ChevronDown, Clock, MapPin, Upload, Shield, BadgeCheck, Loader } from 'lucide-react';
import { getNearbyResponders, dispatchResponders, confirmBystander } from '../api/api.js';
import { getLocation } from '../lib/location.js';
import { getUserId } from '../lib/user.js';

const BASE = 'https://roadsos-backend.vercel.app';

const CRED_MAP = {
  NURSE:            { bg:'rgba(59,130,246,0.18)',   border:'rgba(96,165,250,0.35)',  text:'#60A5FA', label:'Nurse' },
  PARAMEDIC:        { bg:'rgba(220,38,38,0.18)',    border:'rgba(248,113,113,0.35)', text:'#F87171', label:'Paramedic' },
  MEDICAL_STUDENT:  { bg:'rgba(217,119,6,0.18)',    border:'rgba(251,191,36,0.35)',  text:'#FCD34D', label:'Med Student' },
  RETIRED_AMBULANCE:{ bg:'rgba(107,114,128,0.18)',  border:'rgba(156,163,175,0.35)', text:'#9CA3AF', label:'Ret. Staff' },
};

const FIRST_AID = [
  '① Check scene safety before approaching',
  '② Call 112 if not already done',
  '③ Do not move the victim unless in danger',
  '④ Apply pressure to bleeding wounds',
  '⑤ Keep victim warm & conscious — talk to them',
];

const TN_DISTRICTS = ['Chennai','Coimbatore','Madurai','Tiruchirappalli','Salem','Tirunelveli','Vellore','Erode','Tiruppur','Thoothukudi','Kancheepuram','Thanjavur','Dindigul','Cuddalore','Nagapattinam','Namakkal','Pudukkottai','Ramanathapuram','Sivaganga','Tenkasi','Theni','Virudhunagar','Ariyalur','Chengalpattu','Kallakurichi','Krishnagiri','Perambalur','Ranipet','Tirupattur','Tiruvarur','Villupuram','The Nilgiris'];
const CREDENTIALS = ['Registered Nurse','Paramedic','Medical Student','Retired Ambulance Staff'];
const CRED_TYPE_MAP = { 'Registered Nurse':'NURSE', 'Paramedic':'PARAMEDIC', 'Medical Student':'MEDICAL_STUDENT', 'Retired Ambulance Staff':'RETIRED_AMBULANCE' };

const s = {
  card:  { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'12px 14px', marginBottom:10 },
  label: { fontSize:10, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5, display:'block' },
  input: { width:'100%', background:'#111', border:'1px solid #2E2E2E', borderRadius:10, padding:'10px 12px', fontSize:13, color:'#F5F5F5', outline:'none', boxSizing:'border-box' },
};

function Select({ value, onChange, options, placeholder }) {
  return (
    <div style={{ position:'relative' }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ ...s.input, appearance:'none', paddingRight:32, cursor:'pointer' }}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={14} color="#6B7280" style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
    </div>
  );
}

/* ─── Responder card ─────────────────────────────────────── */
function ResponderCard({ r, dispatched, onDispatch }) {
  const b = CRED_MAP[r.credential_type] || CRED_MAP.RETIRED_AMBULANCE;
  return (
    <div style={{ ...s.card, border:dispatched ? '1px solid rgba(74,222,128,0.3)' : s.card.border, background:dispatched ? 'rgba(22,163,74,0.06)' : s.card.background }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
        <div style={{ width:42, height:42, borderRadius:'50%', flexShrink:0, background:b.bg, border:`1.5px solid ${b.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, color:b.text }}>
          {r.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
            <span style={{ fontSize:14, fontWeight:800, color:'#F5F5F5' }}>{r.name}</span>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'#4ADE80', flexShrink:0 }} />
            <span style={{ fontSize:10, color:'#4ADE80', fontWeight:600 }}>Available</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
            <span style={{ padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:700, background:b.bg, border:`1px solid ${b.border}`, color:b.text }}>{b.label}</span>
          </div>
          <div style={{ display:'flex', gap:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#6B7280' }}>
              <MapPin size={11} /> {r.distance_km} km
            </div>
            {r.total_responses > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#6B7280' }}>
                <Check size={11} /> {r.total_responses} responses
              </div>
            )}
          </div>
        </div>
        <button onClick={() => onDispatch(r.id)} style={{ padding:'7px 12px', borderRadius:10, border:'none', background:dispatched ? 'rgba(22,163,74,0.2)' : 'linear-gradient(135deg,#DC2626,#991B1B)', color:dispatched ? '#4ADE80' : '#fff', fontSize:11, fontWeight:700, cursor:'pointer', flexShrink:0, display:'flex', alignItems:'center', gap:4, boxShadow:dispatched ? 'none' : '0 0 10px rgba(220,38,38,0.3)', transition:'all 0.2s' }}>
          {dispatched ? <><Check size={11} /> Sent</> : 'Dispatch'}
        </button>
      </div>
    </div>
  );
}

/* ─── Nearby tab ─────────────────────────────────────────── */
function NearbyTab() {
  const [accepted, setAccepted] = useState(null);
  const [dispatched, setDispatched] = useState([]);
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLocation().then(async (loc) => {
      try {
        const data = await getNearbyResponders({ lat: loc.lat, lng: loc.lng, radius_km: 30 });
        setResponders(data.responders || []);
      } catch (e) {
        console.warn('[Responders] nearby failed:', e);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  return (
    <div>
      {/* Accept/decline banner */}
      {accepted === null && (
        <div style={{ margin:'0 0 12px', background:'linear-gradient(135deg,rgba(220,38,38,0.15),rgba(127,29,29,0.1))', border:'1px solid rgba(239,68,68,0.35)', borderRadius:14, padding:'12px 14px' }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:10 }}>
            <AlertTriangle size={18} color="#EF4444" style={{ flexShrink:0, marginTop:1 }} />
            <div>
              <div style={{ fontSize:13, fontWeight:800, color:'#F5F5F5', marginBottom:2 }}>Are you available to help?</div>
              <div style={{ fontSize:11, color:'#9CA3AF' }}>Register below to be part of the responder grid</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={async () => {
              setAccepted(true);
              try {
                const uid = await getUserId();
                await confirmBystander({ sos_event_id: '00000000-0000-0000-0000-000000000001', user_id: uid, status: 'ACCEPTED', capability_level: 'LAYPERSON', eta_seconds: 120 });
              } catch(e) { console.warn('[Bystander] confirm failed:', e); }
            }} style={{ flex:1, padding:'9px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#16A34A,#15803D)', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5, boxShadow:'0 0 12px rgba(22,163,74,0.4)' }}>
              <Check size={13} /> I can help
            </button>
            <button onClick={() => setAccepted(false)} style={{ flex:1, padding:'9px', borderRadius:10, background:'rgba(55,65,81,0.5)', border:'1px solid #374151', color:'#9CA3AF', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
              <X size={13} /> Not now
            </button>
          </div>
        </div>
      )}

      {accepted === true && (
        <div style={{ margin:'0 0 12px', background:'rgba(22,163,74,0.08)', border:'1px solid rgba(74,222,128,0.25)', borderRadius:14, padding:'12px 14px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <BadgeCheck size={15} color="#4ADE80" />
            <span style={{ fontSize:12, fontWeight:800, color:'#4ADE80' }}>Ready to help · Basic First Aid</span>
          </div>
          {FIRST_AID.map((step, i) => (
            <div key={i} style={{ fontSize:11, color:'#D1FAE5', lineHeight:1.8, fontWeight:500 }}>{step}</div>
          ))}
        </div>
      )}

      <div style={{ fontSize:10, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>
        {loading ? 'Finding responders…' : `${responders.length} Verified Responders Nearby`}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'20px 0', color:'#6B7280', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          <Loader size={14} style={{ animation:'spin 1s linear infinite' }} /> Loading…
        </div>
      ) : responders.length === 0 ? (
        <div style={{ ...s.card, textAlign:'center', padding:'20px 14px' }}>
          <div style={{ color:'#6B7280', fontSize:13, marginBottom:6 }}>No verified responders in your area yet</div>
          <div style={{ color:'#4B5563', fontSize:11 }}>Be the first — join as a responder below</div>
        </div>
      ) : (
        responders.map(r => (
          <ResponderCard key={r.id} r={r} dispatched={dispatched.includes(r.id)} onDispatch={async (id) => {
            setDispatched(d => [...d, id]);
            try {
              const loc = await getLocation();
              await dispatchResponders({ sos_event_id: `00000000-0000-0000-0000-${Date.now().toString().slice(-12).padStart(12,'0')}`, lat: loc.lat, lng: loc.lng });
            } catch(e) { console.warn('[Dispatch] failed:', e); }
          }} />
        ))
      )}

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

/* ─── Join tab ───────────────────────────────────────────── */
function JoinTab() {
  const [form, setForm] = useState({ name:'', credential:'', regNo:'', district:'', phone:'' });
  const [file, setFile] = useState(null);
  const [fileLabel, setFileLabel] = useState('Upload Documents');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name || !form.credential || !form.district || !form.phone) return;
    setSubmitting(true); setError('');
    try {
      const userId = await getUserId();
      const loc = await getLocation();
      const fd = new FormData();
      fd.append('user_id', userId);
      fd.append('name', form.name);
      fd.append('phone', form.phone.startsWith('+') ? form.phone : `+91${form.phone}`);
      fd.append('credential_type', CRED_TYPE_MAP[form.credential] || 'NURSE');
      fd.append('lat', String(loc.lat));
      fd.append('lng', String(loc.lng));
      if (file) fd.append('credential_doc', file);
      else {
        // Backend requires a file — send a placeholder text file
        const blob = new Blob([`Registration: ${form.name}, ${form.credential}, Reg: ${form.regNo}`], { type:'text/plain' });
        fd.append('credential_doc', blob, 'registration.txt');
      }
      const res = await fetch(`${BASE}/api/responder/register`, { method:'POST', body:fd });
      const json = await res.json();
      if (json.registered) setSubmitted(true);
      else setError(json.error || 'Submission failed');
    } catch (e) {
      setError('Network error — please try again');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 20px', textAlign:'center' }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(22,163,74,0.15)', border:'2px solid rgba(74,222,128,0.4)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16, boxShadow:'0 0 24px rgba(74,222,128,0.2)' }}>
          <BadgeCheck size={28} color="#4ADE80" />
        </div>
        <div style={{ fontSize:17, fontWeight:900, color:'#F5F5F5', marginBottom:6 }}>Application Submitted!</div>
        <div style={{ fontSize:13, color:'#9CA3AF', marginBottom:4 }}>Verification pending</div>
        <div style={{ fontSize:11, color:'#6B7280', marginBottom:24 }}>Usually 24–48 hours · Admin notified via SMS</div>
        <div style={{ padding:'10px 16px', borderRadius:12, background:'rgba(167,139,250,0.08)', border:'1px solid rgba(167,139,250,0.2)', display:'flex', alignItems:'center', gap:8, maxWidth:260 }}>
          <Shield size={13} color="#A78BFA" style={{ flexShrink:0 }} />
          <span style={{ fontSize:11, color:'#A78BFA', lineHeight:1.5, textAlign:'left' }}>Protected under Good Samaritan Law 2016</span>
        </div>
        <button onClick={() => { setSubmitted(false); setForm({ name:'',credential:'',regNo:'',district:'',phone:'' }); }} style={{ marginTop:20, background:'none', border:'1px solid #2E2E2E', borderRadius:10, padding:'8px 18px', color:'#6B7280', fontSize:12, cursor:'pointer' }}>Submit another</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ ...s.card, background:'rgba(234,179,8,0.06)', border:'1px solid rgba(234,179,8,0.2)', display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
        <div style={{ fontSize:22 }}>💰</div>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'#FCD34D' }}>Earn ₹150–300 per verified response</div>
          <div style={{ fontSize:10, color:'#92400E' }}>Paid directly to your UPI within 48 hrs</div>
        </div>
      </div>

      {error && <div style={{ marginBottom:12, padding:'10px 14px', borderRadius:12, background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)', color:'#F87171', fontSize:12 }}>{error}</div>}

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div><label style={s.label}>Full Name</label><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="As on ID proof" style={s.input} /></div>
        <div><label style={s.label}>Credential Type</label><Select value={form.credential} onChange={v => set('credential', v)} options={CREDENTIALS} placeholder="Select credential…" /></div>
        <div><label style={s.label}>Registration / Licence Number</label><input value={form.regNo} onChange={e => set('regNo', e.target.value)} placeholder="e.g. TN-NUR-2021-04521" style={s.input} /></div>
        <div><label style={s.label}>Phone Number</label><input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" style={s.input} /></div>
        <div><label style={s.label}>Operating District</label><Select value={form.district} onChange={v => set('district', v)} options={TN_DISTRICTS} placeholder="Select district…" /></div>
        <div>
          <label style={s.label}>Supporting Documents</label>
          <label style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'#111', border:'1px dashed #2E2E2E', borderRadius:10, cursor:'pointer', fontSize:12, color:file ? '#4ADE80' : '#6B7280', fontWeight:600 }}>
            <Upload size={14} />
            {file ? file.name : fileLabel}
            <input type="file" style={{ display:'none' }} accept=".pdf,.jpg,.jpeg,.png" onChange={e => { const f = e.target.files[0]; setFile(f); if(f) setFileLabel(f.name); }} />
          </label>
          <div style={{ fontSize:10, color:'#4B5563', marginTop:4 }}>Accepted: Registration cert, ID proof, photo (PDF/JPG)</div>
        </div>
        <div style={{ padding:'9px 12px', borderRadius:10, background:'rgba(167,139,250,0.06)', border:'1px solid rgba(167,139,250,0.18)', display:'flex', alignItems:'center', gap:8 }}>
          <Shield size={13} color="#A78BFA" style={{ flexShrink:0 }} />
          <span style={{ fontSize:11, color:'#A78BFA', lineHeight:1.5 }}>Protected under Good Samaritan Law 2016 — you cannot be held liable for good-faith aid</span>
        </div>
        <button onClick={handleSubmit} disabled={submitting || !form.name || !form.credential || !form.district || !form.phone} style={{ padding:'13px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#DC2626,#991B1B)', color:'#fff', fontSize:13, fontWeight:800, cursor:'pointer', boxShadow:'0 0 16px rgba(220,38,38,0.35)', opacity:(form.name && form.credential && form.district && form.phone && !submitting) ? 1 : 0.5, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          {submitting ? <><Loader size={14} style={{ animation:'spin 1s linear infinite' }} /> Submitting…</> : 'Submit Application'}
        </button>
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────── */
export default function RespondersPage() {
  const [tab, setTab] = useState('nearby');
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{ padding:'16px 16px 12px', flexShrink:0 }}>
        <div style={{ fontSize:10, fontWeight:700, color:'#EF4444', textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:2 }}>Community Network</div>
        <h1 style={{ fontSize:26, fontWeight:900, color:'#F5F5F5', margin:0 }}>Responders</h1>
      </div>
      <div style={{ padding:'0 16px 12px', flexShrink:0 }}>
        <div style={{ display:'flex', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:4, gap:4 }}>
          {[{ id:'nearby', label:'Nearby Responders', Icon:Users }, { id:'join', label:'Join as Responder', Icon:UserPlus }].map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'9px 8px', borderRadius:9, border:'none', cursor:'pointer', background:tab === id ? 'linear-gradient(135deg,#DC2626,#991B1B)' : 'transparent', color:tab === id ? '#fff' : '#6B7280', fontSize:11, fontWeight:700, transition:'all 0.2s', boxShadow:tab === id ? '0 0 12px rgba(220,38,38,0.3)' : 'none' }}>
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'0 16px 16px', scrollbarWidth:'none' }}>
        {tab === 'nearby' ? <NearbyTab /> : <JoinTab />}
      </div>
    </div>
  );
}
