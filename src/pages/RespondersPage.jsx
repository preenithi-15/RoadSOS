import React, { useState } from 'react';
import {
  Users, UserPlus, AlertTriangle, Check, X, ChevronDown,
  Clock, MapPin, Upload, Shield, BadgeCheck, Phone,
} from 'lucide-react';

/* ── Data ─────────────────────────────────────────────── */
const RESPONDERS = [
  { id: 1, name: 'Priya Nair',        role: 'Registered Nurse',       dist: '1.2 km', eta: '4 min',  available: true,  badge: 'nurse' },
  { id: 2, name: 'Dr. Karthik R',     role: 'Paramedic',              dist: '2.1 km', eta: '6 min',  available: true,  badge: 'paramedic' },
  { id: 3, name: 'Lakshmi S',         role: 'Medical Student',        dist: '2.8 km', eta: '8 min',  available: true,  badge: 'student' },
  { id: 4, name: 'Ravi Kumar',        role: 'Retired Ambulance Staff',dist: '4.3 km', eta: '11 min', available: false, badge: 'retired' },
];

const BADGE = {
  nurse:    { bg: 'rgba(59,130,246,0.18)', border: 'rgba(96,165,250,0.35)', text: '#60A5FA', label: 'Nurse' },
  paramedic:{ bg: 'rgba(220,38,38,0.18)',  border: 'rgba(248,113,113,0.35)',text: '#F87171', label: 'Paramedic' },
  student:  { bg: 'rgba(217,119,6,0.18)',  border: 'rgba(251,191,36,0.35)', text: '#FCD34D', label: 'Med Student' },
  retired:  { bg: 'rgba(107,114,128,0.18)',border: 'rgba(156,163,175,0.35)',text: '#9CA3AF', label: 'Ret. Staff' },
};

const FIRST_AID = [
  '① Check scene safety before approaching',
  '② Call 112 if not already done',
  '③ Do not move the victim unless in danger',
  '④ Apply pressure to bleeding wounds',
  '⑤ Keep victim warm & conscious — talk to them',
];

const TN_DISTRICTS = [
  'Chennai','Coimbatore','Madurai','Tiruchirappalli','Salem','Tirunelveli',
  'Vellore','Erode','Tiruppur','Thoothukudi','Kancheepuram','Thanjavur',
  'Dindigul','Cuddalore','Nagapattinam','Namakkal','Pudukkottai','Ramanathapuram',
  'Sivaganga','Tenkasi','Theni','Virudhunagar','Ariyalur','Chengalpattu',
  'Kallakurichi','Krishnagiri','Perambalur','Ranipet','Tirupattur','Tiruvarur',
  'Villupuram','The Nilgiris',
];

const CREDENTIALS = ['Registered Nurse','Paramedic','Medical Student','Retired Ambulance Staff'];

/* ── Shared styles ─────────────────────────────────────── */
const s = {
  card: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14, padding: '12px 14px', marginBottom: 10,
  },
  label: { fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5, display: 'block' },
  input: {
    width: '100%', background: '#111', border: '1px solid #2E2E2E',
    borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#F5F5F5',
    outline: 'none', boxSizing: 'border-box',
  },
};

/* ── Select wrapper ────────────────────────────────────── */
function Select({ value, onChange, options, placeholder }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value} onChange={e => onChange(e.target.value)}
        style={{ ...s.input, appearance: 'none', paddingRight: 32, cursor: 'pointer' }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={14} color="#6B7280" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
    </div>
  );
}

/* ── Responder card ────────────────────────────────────── */
function ResponderCard({ r, dispatched, onDispatch }) {
  const b = BADGE[r.badge];
  return (
    <div style={{
      ...s.card,
      border: dispatched ? '1px solid rgba(74,222,128,0.3)' : s.card.border,
      background: dispatched ? 'rgba(22,163,74,0.06)' : s.card.background,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Avatar */}
        <div style={{
          width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${b.bg.replace('0.18','0.5')}, ${b.bg})`,
          border: `1.5px solid ${b.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 800, color: b.text,
        }}>
          {r.name.charAt(0)}
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#F5F5F5' }}>{r.name}</span>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: r.available ? '#4ADE80' : '#4B5563', flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: r.available ? '#4ADE80' : '#6B7280', fontWeight: 600 }}>
              {r.available ? 'Available' : 'Busy'}
            </span>
          </div>

          {/* Badge + role */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{
              padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
              background: b.bg, border: `1px solid ${b.border}`, color: b.text,
            }}>{b.label}</span>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>{r.role}</span>
          </div>

          {/* Distance / ETA */}
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6B7280' }}>
              <MapPin size={11} /> {r.dist}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6B7280' }}>
              <Clock size={11} /> ETA {r.eta}
            </div>
          </div>
        </div>

        {/* Dispatch button */}
        {r.available && (
          <button onClick={() => onDispatch(r.id)} style={{
            padding: '7px 12px', borderRadius: 10, border: 'none',
            background: dispatched ? 'rgba(22,163,74,0.2)' : 'linear-gradient(135deg,#DC2626,#991B1B)',
            color: dispatched ? '#4ADE80' : '#fff',
            fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 4,
            boxShadow: dispatched ? 'none' : '0 0 10px rgba(220,38,38,0.3)',
            transition: 'all 0.2s',
          }}>
            {dispatched ? <><Check size={11} /> Sent</> : 'Dispatch'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Nearby tab ────────────────────────────────────────── */
function NearbyTab() {
  const [sosActive] = useState(true);
  const [accepted, setAccepted] = useState(null); // null | true | false
  const [dispatched, setDispatched] = useState([]);

  return (
    <div>
      {/* SOS crash banner */}
      {sosActive && accepted === null && (
        <div style={{
          margin: '0 0 12px',
          background: 'linear-gradient(135deg,rgba(220,38,38,0.15),rgba(127,29,29,0.1))',
          border: '1px solid rgba(239,68,68,0.35)', borderRadius: 14, padding: '12px 14px',
          animation: 'fadeInUp 0.4s ease-out',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
            <AlertTriangle size={18} color="#EF4444" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#F5F5F5', marginBottom: 2 }}>
                Crash detected 380m away
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>Are you able to help?</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setAccepted(true)} style={{
              flex: 1, padding: '9px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg,#16A34A,#15803D)',
              color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              boxShadow: '0 0 12px rgba(22,163,74,0.4)',
            }}>
              <Check size={13} /> Accept
            </button>
            <button onClick={() => setAccepted(false)} style={{
              flex: 1, padding: '9px', borderRadius: 10,
              background: 'rgba(55,65,81,0.5)', border: '1px solid #374151',
              color: '#9CA3AF', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}>
              <X size={13} /> Decline
            </button>
          </div>
        </div>
      )}

      {/* First aid steps if accepted */}
      {accepted === true && (
        <div style={{
          margin: '0 0 12px',
          background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(74,222,128,0.25)',
          borderRadius: 14, padding: '12px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <BadgeCheck size={15} color="#4ADE80" />
            <span style={{ fontSize: 12, fontWeight: 800, color: '#4ADE80' }}>En route · Basic First Aid</span>
          </div>
          {FIRST_AID.map((step, i) => (
            <div key={i} style={{ fontSize: 11, color: '#D1FAE5', lineHeight: 1.8, fontWeight: 500 }}>{step}</div>
          ))}
        </div>
      )}

      {/* Responder cards */}
      <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
        {RESPONDERS.length} Responders Nearby
      </div>
      {RESPONDERS.map(r => (
        <ResponderCard
          key={r.id} r={r}
          dispatched={dispatched.includes(r.id)}
          onDispatch={id => setDispatched(d => [...d, id])}
        />
      ))}
    </div>
  );
}

/* ── Join tab ──────────────────────────────────────────── */
function JoinTab() {
  const [form, setForm] = useState({ name: '', credential: '', regNo: '', district: '', upi: '' });
  const [submitted, setSubmitted] = useState(false);
  const [fileLabel, setFileLabel] = useState('Upload Documents');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  if (submitted) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '40px 20px', textAlign: 'center',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(22,163,74,0.15)', border: '2px solid rgba(74,222,128,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
          boxShadow: '0 0 24px rgba(74,222,128,0.2)',
        }}>
          <BadgeCheck size={28} color="#4ADE80" />
        </div>
        <div style={{ fontSize: 17, fontWeight: 900, color: '#F5F5F5', marginBottom: 6 }}>
          Application Submitted!
        </div>
        <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>
          Verification pending
        </div>
        <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 24 }}>
          Usually 24–48 hours
        </div>
        <div style={{
          padding: '10px 16px', borderRadius: 12,
          background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
          display: 'flex', alignItems: 'center', gap: 8, maxWidth: 260,
        }}>
          <Shield size={13} color="#A78BFA" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: '#A78BFA', lineHeight: 1.5, textAlign: 'left' }}>
            Protected under Good Samaritan Law 2016
          </span>
        </div>
        <button onClick={() => { setSubmitted(false); setForm({ name:'',credential:'',regNo:'',district:'',upi:'' }); }}
          style={{ marginTop: 20, background: 'none', border: '1px solid #2E2E2E', borderRadius: 10, padding: '8px 18px', color: '#6B7280', fontSize: 12, cursor: 'pointer' }}>
          Submit another
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Earnings note */}
      <div style={{
        ...s.card, background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)',
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
      }}>
        <div style={{ fontSize: 22 }}>💰</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#FCD34D' }}>Earn ₹150–300 per verified response</div>
          <div style={{ fontSize: 10, color: '#92400E' }}>Paid directly to your UPI within 48 hrs</div>
        </div>
      </div>

      {/* Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={s.label}>Full Name</label>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="As on ID proof" style={s.input} />
        </div>

        <div>
          <label style={s.label}>Credential Type</label>
          <Select value={form.credential} onChange={v => set('credential', v)}
            options={CREDENTIALS} placeholder="Select credential…" />
        </div>

        <div>
          <label style={s.label}>Registration / Licence Number</label>
          <input value={form.regNo} onChange={e => set('regNo', e.target.value)}
            placeholder="e.g. TN-NUR-2021-04521" style={s.input} />
        </div>

        <div>
          <label style={s.label}>Operating District</label>
          <Select value={form.district} onChange={v => set('district', v)}
            options={TN_DISTRICTS} placeholder="Select district…" />
        </div>

        <div>
          <label style={s.label}>UPI ID</label>
          <input value={form.upi} onChange={e => set('upi', e.target.value)}
            placeholder="yourname@upi" style={s.input} />
        </div>

        {/* Document upload (mock) */}
        <div>
          <label style={s.label}>Supporting Documents</label>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
            background: '#111', border: '1px dashed #2E2E2E', borderRadius: 10,
            cursor: 'pointer', fontSize: 12, color: fileLabel === 'Upload Documents' ? '#6B7280' : '#4ADE80',
            fontWeight: 600,
          }}>
            <Upload size={14} />
            {fileLabel}
            <input type="file" style={{ display: 'none' }}
              onChange={e => setFileLabel(e.target.files[0]?.name || 'Upload Documents')} />
          </label>
          <div style={{ fontSize: 10, color: '#4B5563', marginTop: 4 }}>
            Accepted: Registration cert, ID proof, photo (PDF/JPG)
          </div>
        </div>

        {/* Good Samaritan note */}
        <div style={{
          padding: '9px 12px', borderRadius: 10,
          background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.18)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Shield size={13} color="#A78BFA" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: '#A78BFA', lineHeight: 1.5 }}>
            Protected under Good Samaritan Law 2016 — you cannot be held liable for good-faith aid
          </span>
        </div>

        <button
          onClick={() => form.name && form.credential && form.district && setSubmitted(true)}
          style={{
            padding: '13px', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg,#DC2626,#991B1B)',
            color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer',
            boxShadow: '0 0 16px rgba(220,38,38,0.35)',
            opacity: form.name && form.credential && form.district ? 1 : 0.5,
          }}>
          Submit Application
        </button>
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────── */
export default function RespondersPage() {
  const [tab, setTab] = useState('nearby');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '16px 16px 12px', flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 2 }}>
          Community Network
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#F5F5F5', margin: 0 }}>Responders</h1>
      </div>

      {/* Tab bar */}
      <div style={{ padding: '0 16px 12px', flexShrink: 0 }}>
        <div style={{
          display: 'flex', background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: 4, gap: 4,
        }}>
          {[
            { id: 'nearby', label: 'Nearby Responders', Icon: Users },
            { id: 'join',   label: 'Join as Responder', Icon: UserPlus },
          ].map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '9px 8px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: tab === id ? 'linear-gradient(135deg,#DC2626,#991B1B)' : 'transparent',
              color: tab === id ? '#fff' : '#6B7280',
              fontSize: 11, fontWeight: 700, transition: 'all 0.2s',
              boxShadow: tab === id ? '0 0 12px rgba(220,38,38,0.3)' : 'none',
            }}>
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px', scrollbarWidth: 'none' }}>
        {tab === 'nearby' ? <NearbyTab /> : <JoinTab />}
      </div>
    </div>
  );
}
