import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Heart, Pill, AlertCircle, Phone, Edit3, Check, X, Plus, ShieldCheck, User, Wifi, FileText, Loader } from 'lucide-react';
import { saveLifelineProfile, getLifelineByToken } from '../api/api.js';
import { getUserId } from '../lib/user.js';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const BASE = 'https://roadsos-backend.vercel.app';
const PROFILE_KEY = 'roadsos_profile';

/* ─── Chip ──────────────────────────────────────────────── */
function Chip({ label, onRemove, editing }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(185,28,28,0.18)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:20, padding:'4px 10px', fontSize:12, fontWeight:600, color:'#FCA5A5' }}>
      {label}
      {editing && <button onClick={() => onRemove(label)} style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', color:'#F87171' }}><X size={11} /></button>}
    </span>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button onClick={onChange} style={{ width:48, height:26, borderRadius:13, position:'relative', background:on ? '#DC2626' : '#374151', border:'none', cursor:'pointer', transition:'background 0.25s', flexShrink:0 }}>
      <span style={{ position:'absolute', top:3, left:on ? 'calc(100% - 23px)' : 3, width:20, height:20, borderRadius:'50%', background:'#fff', transition:'left 0.25s', boxShadow:'0 1px 4px rgba(0,0,0,0.4)' }} />
    </button>
  );
}

function SectionHeader({ icon: Icon, title, color = '#EF4444' }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
      <div style={{ width:30, height:30, borderRadius:10, background:'rgba(185,28,28,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon size={14} color={color} />
      </div>
      <span style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.1em' }}>{title}</span>
    </div>
  );
}

const Card = ({ children, style }) => (
  <div className="glass-card" style={{ padding:16, marginBottom:12, ...style }}>{children}</div>
);

/* ─── Main ──────────────────────────────────────────────── */
export default function MedicalPage() {
  const [editing, setEditing]   = useState(false);
  const [saving,  setSaving]    = useState(false);
  const [saved,   setSaved]     = useState(false);
  const [qrUrl,   setQrUrl]     = useState(null);
  const [qrToken, setQrToken]   = useState(null);

  const [bloodType,   setBloodType]   = useState('B+');
  const [allergies,   setAllergies]   = useState(['Penicillin', 'Aspirin']);
  const [conditions,  setConditions]  = useState(['Hypertension']);
  const [medications, setMedications] = useState(['Amlodipine 5mg']);
  const [organDonor,  setOrganDonor]  = useState(true);
  const [ecName,  setEcName]  = useState('');
  const [ecPhone, setEcPhone] = useState('');
  const [insRef,  setInsRef]  = useState('');

  const [allergyInput, setAllergyInput] = useState('');
  const [condInput,    setCondInput]    = useState('');
  const [medInput,     setMedInput]     = useState('');

  // Load saved profile from localStorage on mount
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
    if (stored.blood_group)  setBloodType(stored.blood_group);
    if (stored.allergies?.length)   setAllergies(stored.allergies);
    if (stored.conditions?.length)  setConditions(stored.conditions);
    if (stored.medications?.length) setMedications(stored.medications);
    if (stored.emergency_contact_name)  setEcName(stored.emergency_contact_name);
    if (stored.emergency_contact_phone) setEcPhone(stored.emergency_contact_phone);
    if (stored.insurance_reference)     setInsRef(stored.insurance_reference);
    if (stored.qr_token) {
      setQrToken(stored.qr_token);
      setQrUrl(`${BASE}/api/lifeline/${stored.qr_token}`);
      // Refresh from backend to get latest data
      getLifelineByToken(stored.qr_token).then(fresh => {
        if (fresh?.blood_group) setBloodType(fresh.blood_group);
        if (fresh?.allergies?.length) setAllergies(fresh.allergies);
        if (fresh?.conditions?.length) setConditions(fresh.conditions);
        if (fresh?.emergency_contact_name) setEcName(fresh.emergency_contact_name);
        if (fresh?.emergency_contact_phone) setEcPhone(fresh.emergency_contact_phone);
      }).catch(() => {});
    }
  }, []);

  const addChip = (list, setList, input, setInput) => {
    const val = input.trim();
    if (val && !list.includes(val)) setList([...list, val]);
    setInput('');
  };
  const removeChip = (list, setList, label) => setList(list.filter(x => x !== label));

  const handleSave = async () => {
    setSaving(true);
    try {
      const userId = await getUserId();
      const result = await saveLifelineProfile({
        user_id: userId,
        blood_group: bloodType,
        allergies,
        conditions,
        emergency_contact_name: ecName || undefined,
        emergency_contact_phone: ecPhone || undefined,
        insurance_reference: insRef || undefined,
      });

      if (result.qr_token) {
        setQrToken(result.qr_token);
        setQrUrl(result.qr_url || `${BASE}/api/lifeline/${result.qr_token}`);
        // Persist everything to localStorage for other pages to use
        const profile = { blood_group: bloodType, allergies, conditions, medications, emergency_contact_name: ecName, emergency_contact_phone: ecPhone, insurance_reference: insRef, qr_token: result.qr_token };
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      }

      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('[Medical] save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const chipInputStyle = { background:'#111', border:'1px solid #2E2E2E', borderRadius:10, padding:'6px 10px', fontSize:12, color:'#F5F5F5', outline:'none', flex:1, minWidth:0 };

  return (
    <div className="h-full scroll-area" style={{ paddingBottom:16 }}>

      {/* Header */}
      <div style={{ padding:'16px 16px 8px', display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'#EF4444', textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:2 }}>Health Profile</div>
          <h1 style={{ fontSize:26, fontWeight:900, color:'#F5F5F5', margin:0 }}>Medical</h1>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {editing && <button onClick={() => setEditing(false)} style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 12px', borderRadius:12, background:'#1F1F1F', border:'1px solid #2E2E2E', color:'#9CA3AF', fontSize:12, fontWeight:700, cursor:'pointer' }}><X size={13} /> Cancel</button>}
          <button onClick={() => editing ? handleSave() : setEditing(true)} disabled={saving} style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 14px', borderRadius:12, background:editing ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'linear-gradient(135deg,#DC2626,#991B1B)', border:'none', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', boxShadow:editing ? '0 0 14px rgba(22,163,74,0.4)' : '0 0 14px rgba(220,38,38,0.35)', opacity:saving ? 0.7 : 1 }}>
            {saving ? <><Loader size={13} style={{ animation:'spin 1s linear infinite' }} /> Saving…</> : editing ? <><Check size={13} /> Save</> : <><Edit3 size={13} /> Edit</>}
          </button>
        </div>
      </div>

      {saved && (
        <div style={{ margin:'0 16px 10px', padding:'10px 14px', borderRadius:12, background:'rgba(22,163,74,0.15)', border:'1px solid rgba(22,163,74,0.3)', color:'#4ADE80', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
          <Check size={14} /> Profile saved · QR code updated
        </div>
      )}

      <div style={{ padding:'0 16px' }}>

        {/* QR Card */}
        <Card style={{ background:'linear-gradient(145deg,rgba(220,38,38,0.1),rgba(13,13,13,0.95))', border:'1px solid rgba(239,68,68,0.2)' }}>
          <div style={{ display:'flex', gap:16, alignItems:'center' }}>
            <div style={{ background:'#0D0D0D', borderRadius:14, padding:8, border:'1px solid rgba(239,68,68,0.25)', boxShadow:'0 0 20px rgba(239,68,68,0.12)', flexShrink:0 }}>
              {qrUrl ? (
                <QRCodeSVG value={qrUrl} size={140} bgColor="#0D0D0D" fgColor="#F5F5F5" level="M" />
              ) : (
                <div style={{ width:140, height:140, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <div style={{ fontSize:11, color:'#6B7280', textAlign:'center', lineHeight:1.5 }}>
                    {editing ? 'Save profile\nto generate QR' : 'Tap Edit → Save\nto generate QR'}
                  </div>
                </div>
              )}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:16, fontWeight:900, color:'#F5F5F5', marginBottom:6 }}>LifeLine QR</div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#DC2626,#7F1D1D)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', boxShadow:'0 0 14px rgba(220,38,38,0.5)' }}>
                  <span style={{ fontSize:13, fontWeight:900, color:'#fff', lineHeight:1 }}>{bloodType}</span>
                  <span style={{ fontSize:8, color:'#FCA5A5', fontWeight:600 }}>BLOOD</span>
                </div>
              </div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 10px', background:'rgba(22,163,74,0.15)', border:'1px solid rgba(22,163,74,0.3)', borderRadius:20, fontSize:10, fontWeight:700, color:'#4ADE80' }}>
                <Wifi size={10} /> Works offline · No signal needed
              </div>
              <div style={{ marginTop:8, fontSize:10, color:'#6B7280' }}>
                {qrToken ? `Token: ${qrToken.slice(0,8)}…` : 'Scan by any medic — no app required'}
              </div>
            </div>
          </div>
        </Card>

        {/* Profile */}
        <Card>
          <SectionHeader icon={Heart} title="Profile Details" />
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Blood Type</div>
            {editing ? (
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {BLOOD_TYPES.map(bt => (
                  <button key={bt} onClick={() => setBloodType(bt)} style={{ padding:'5px 12px', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer', background:bloodType === bt ? '#DC2626' : 'transparent', border:bloodType === bt ? '1px solid #EF4444' : '1px solid #2E2E2E', color:bloodType === bt ? '#fff' : '#6B7280', transition:'all 0.15s' }}>{bt}</button>
                ))}
              </div>
            ) : (
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#DC2626,#7F1D1D)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', boxShadow:'0 0 16px rgba(220,38,38,0.4)' }}>
                  <span style={{ fontSize:16, fontWeight:900, color:'#fff' }}>{bloodType}</span>
                </div>
                <span style={{ fontSize:13, color:'#9CA3AF', fontWeight:600 }}>Blood Group</span>
              </div>
            )}
          </div>

          {/* Allergies */}
          {(['allergies', 'conditions', 'medications']).map((field) => {
            const data = field === 'allergies' ? allergies : field === 'conditions' ? conditions : medications;
            const setData = field === 'allergies' ? setAllergies : field === 'conditions' ? setConditions : setMedications;
            const input = field === 'allergies' ? allergyInput : field === 'conditions' ? condInput : medInput;
            const setInput = field === 'allergies' ? setAllergyInput : field === 'conditions' ? setCondInput : setMedInput;
            const label = field === 'allergies' ? 'Allergies' : field === 'conditions' ? 'Medical Conditions' : 'Current Medications';
            return (
              <div key={field} style={{ marginBottom:14 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>{label}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:editing ? 6 : 0 }}>
                  {data.map(a => <Chip key={a} label={a} editing={editing} onRemove={l => removeChip(data, setData, l)} />)}
                </div>
                {editing && (
                  <div style={{ display:'flex', gap:6, marginTop:6 }}>
                    <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addChip(data, setData, input, setInput)} placeholder={`Add ${label.toLowerCase().replace('current ', '')}…`} style={chipInputStyle} />
                    <button onClick={() => addChip(data, setData, input, setInput)} style={{ width:32, height:32, borderRadius:10, background:'#DC2626', border:'none', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Plus size={14} /></button>
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:10, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#F5F5F5' }}>Organ Donor</div>
              <div style={{ fontSize:11, color:organDonor ? '#4ADE80' : '#6B7280', marginTop:1 }}>{organDonor ? '✓ Registered Donor' : 'Not registered'}</div>
            </div>
            <Toggle on={organDonor} onChange={() => editing && setOrganDonor(v => !v)} />
          </div>
        </Card>

        {/* Emergency Contacts */}
        <Card>
          <SectionHeader icon={Phone} title="Emergency Contact" color="#60A5FA" />
          {editing ? (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <input value={ecName} onChange={e => setEcName(e.target.value)} placeholder="Contact name" style={{ background:'#111', border:'1px solid #2E2E2E', borderRadius:10, padding:'8px 12px', fontSize:12, color:'#F5F5F5', outline:'none' }} />
              <input value={ecPhone} onChange={e => setEcPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" style={{ background:'#111', border:'1px solid #2E2E2E', borderRadius:10, padding:'8px 12px', fontSize:12, color:'#F5F5F5', outline:'none' }} />
            </div>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0' }}>
              <div style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,#1E3A5F,#1D4ED8)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <User size={16} color="#93C5FD" />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#F5F5F5' }}>{ecName || 'Not set'}</div>
                <div style={{ fontSize:11, color:'#6B7280' }}>{ecPhone || 'Add in Edit mode'}</div>
              </div>
              {ecPhone && <a href={`tel:${ecPhone}`} style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 12px', borderRadius:10, background:'rgba(29,78,216,0.2)', border:'1px solid rgba(59,130,246,0.3)', color:'#60A5FA', fontSize:11, fontWeight:700, textDecoration:'none', whiteSpace:'nowrap' }}><Phone size={11} /> Call</a>}
            </div>
          )}
        </Card>

        {/* Insurance */}
        <Card style={{ marginBottom:0 }}>
          <SectionHeader icon={ShieldCheck} title="Insurance Reference" color="#A78BFA" />
          {editing ? (
            <input value={insRef} onChange={e => setInsRef(e.target.value)} placeholder="e.g. HDFC-2024-XYZ" style={{ width:'100%', background:'#111', border:'1px solid #2E2E2E', borderRadius:10, padding:'8px 12px', fontSize:12, color:'#F5F5F5', outline:'none', boxSizing:'border-box' }} />
          ) : (
            <div style={{ fontSize:13, fontWeight:700, color:insRef ? '#E2E8F0' : '#4B5563', fontFamily:'monospace' }}>{insRef || 'Not set'}</div>
          )}
          <div style={{ marginTop:12, padding:'9px 12px', borderRadius:10, background:'rgba(167,139,250,0.08)', border:'1px solid rgba(167,139,250,0.2)', display:'flex', alignItems:'flex-start', gap:8 }}>
            <FileText size={13} color="#A78BFA" style={{ marginTop:1, flexShrink:0 }} />
            <p style={{ margin:0, fontSize:11, color:'#A78BFA', lineHeight:1.5 }}>Auto-filed to insurer when SOS triggers</p>
          </div>
        </Card>

      </div>
    </div>
  );
}
