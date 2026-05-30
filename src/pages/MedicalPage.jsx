import React, { useState, useRef, useEffect } from 'react';
import {
  Heart, Pill, AlertCircle, Phone, Edit3, Check, X, Plus,
  ShieldCheck, User, ChevronDown, Wifi, FileText
} from 'lucide-react';

/* ─── Constants ─────────────────────────────────────── */
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

/* ─── QR Code (canvas-generated) ───────────────────── */
function QRCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = 140;
    canvas.width = size;
    canvas.height = size;
    const cells = 21;
    const cell = size / cells;
    ctx.fillStyle = '#0D0D0D';
    ctx.fillRect(0, 0, size, size);
    // deterministic pseudo-random QR pattern
    const seed = [
      [0,0,1,0,1,1,0,0,1,0,1,0,0,1,1,0,1,0,1,1,0],
      [0,1,0,1,0,0,1,0,0,1,0,1,1,0,0,1,0,1,0,0,1],
      [1,0,1,1,1,0,0,1,0,0,1,0,0,1,1,0,1,0,1,1,0],
      [0,1,0,0,0,1,1,0,1,1,0,1,1,0,0,1,0,1,0,0,1],
      [1,0,1,0,1,0,0,1,0,0,1,0,0,1,1,0,1,0,1,0,1],
      [0,1,0,1,0,1,1,0,1,1,0,1,0,0,1,1,0,1,0,1,0],
      [1,0,0,0,1,0,0,1,0,0,1,0,1,1,0,0,1,0,0,0,1],
      [0,1,1,1,0,1,1,0,1,0,0,1,0,0,1,1,0,1,1,1,0],
      [1,0,0,1,0,0,0,1,1,1,0,0,1,0,0,0,1,0,0,1,0],
      [0,1,1,0,1,1,1,0,0,0,1,1,0,1,1,1,0,1,1,0,1],
      [1,0,0,1,0,0,0,1,0,1,0,0,1,0,0,0,1,0,0,1,0],
      [0,1,1,0,1,1,1,0,1,0,1,1,0,1,1,1,0,1,1,0,1],
      [1,0,0,1,0,0,0,1,0,1,0,0,1,0,0,0,1,0,0,1,0],
      [0,1,0,0,1,1,0,0,1,0,1,1,0,1,0,1,0,0,1,0,1],
      [1,0,1,1,0,0,1,1,0,1,0,0,1,0,1,0,1,1,0,1,0],
      [0,1,0,0,1,0,0,0,1,0,1,1,0,1,0,1,0,0,1,0,1],
      [1,1,1,0,0,1,0,1,0,1,0,0,1,0,1,0,1,1,1,1,0],
      [0,0,0,1,1,0,1,0,1,0,1,1,0,1,0,1,0,0,0,0,1],
      [1,0,1,0,0,1,0,1,0,1,0,0,1,0,1,0,1,0,1,0,0],
      [0,1,0,1,1,0,1,0,1,0,1,1,0,1,0,1,0,1,0,1,1],
      [1,0,1,1,0,1,0,1,0,1,0,0,1,0,1,0,1,0,1,0,0],
    ];
    // finder squares
    const finder = (x, y) => {
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(x * cell, y * cell, 7 * cell, 7 * cell);
      ctx.fillStyle = '#0D0D0D';
      ctx.fillRect((x + 1) * cell, (y + 1) * cell, 5 * cell, 5 * cell);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect((x + 2) * cell, (y + 2) * cell, 3 * cell, 3 * cell);
    };
    finder(0, 0); finder(14, 0); finder(0, 14);
    // data cells
    seed.forEach((row, r) => {
      row.forEach((bit, c) => {
        const inFinder =
          (r < 8 && c < 8) || (r < 8 && c > 12) || (r > 12 && c < 8);
        if (!inFinder && bit) {
          ctx.fillStyle = '#F5F5F5';
          ctx.fillRect(c * cell + 0.5, r * cell + 0.5, cell - 1, cell - 1);
        }
      });
    });
  }, []);
  return <canvas ref={ref} style={{ width: 140, height: 140, imageRendering: 'pixelated' }} />;
}

/* ─── Chip Tag ──────────────────────────────────────── */
function Chip({ label, onRemove, editing }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: 'rgba(185,28,28,0.18)', border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 600,
      color: '#FCA5A5',
    }}>
      {label}
      {editing && (
        <button onClick={() => onRemove(label)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#F87171' }}>
          <X size={11} />
        </button>
      )}
    </span>
  );
}

/* ─── Toggle Switch ─────────────────────────────────── */
function Toggle({ on, onChange }) {
  return (
    <button onClick={onChange} style={{
      width: 48, height: 26, borderRadius: 13, position: 'relative',
      background: on ? '#DC2626' : '#374151',
      border: 'none', cursor: 'pointer', transition: 'background 0.25s', flexShrink: 0,
    }}>
      <span style={{
        position: 'absolute', top: 3, left: on ? 'calc(100% - 23px)' : 3,
        width: 20, height: 20, borderRadius: '50%', background: '#fff',
        transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
      }} />
    </button>
  );
}

/* ─── Section Header ────────────────────────────────── */
function SectionHeader({ icon: Icon, title, color = '#EF4444' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <div style={{
        width: 30, height: 30, borderRadius: 10,
        background: 'rgba(185,28,28,0.25)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={14} color={color} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</span>
    </div>
  );
}

/* ─── Card wrapper ──────────────────────────────────── */
const Card = ({ children, style }) => (
  <div className="glass-card" style={{ padding: 16, marginBottom: 12, ...style }}>
    {children}
  </div>
);

/* ─── Main Page ─────────────────────────────────────── */
export default function MedicalPage() {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  const [bloodType, setBloodType] = useState('B+');
  const [allergies, setAllergies] = useState(['Penicillin', 'Aspirin']);
  const [conditions, setConditions] = useState(['Hypertension']);
  const [medications, setMedications] = useState(['Amlodipine 5mg']);
  const [organDonor, setOrganDonor] = useState(true);

  // chip add state
  const [allergyInput, setAllergyInput] = useState('');
  const [condInput, setCondInput] = useState('');
  const [medInput, setMedInput] = useState('');

  const addChip = (list, setList, input, setInput) => {
    const val = input.trim();
    if (val && !list.includes(val)) setList([...list, val]);
    setInput('');
  };
  const removeChip = (list, setList, label) => setList(list.filter(x => x !== label));

  const handleSave = () => {
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2500);
  };

  const chipInputStyle = {
    background: '#111', border: '1px solid #2E2E2E', borderRadius: 10,
    padding: '6px 10px', fontSize: 12, color: '#F5F5F5', outline: 'none',
    flex: 1, minWidth: 0,
  };

  return (
    <div className="h-full scroll-area" style={{ paddingBottom: 16 }}>

      {/* ── Header ── */}
      <div style={{ padding: '16px 16px 8px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 2 }}>
            Health Profile
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#F5F5F5', margin: 0 }}>Medical</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {editing && (
            <button onClick={() => setEditing(false)} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px',
              borderRadius: 12, background: '#1F1F1F', border: '1px solid #2E2E2E',
              color: '#9CA3AF', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>
              <X size={13} /> Cancel
            </button>
          )}
          <button onClick={() => editing ? handleSave() : setEditing(true)} style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px',
            borderRadius: 12,
            background: editing ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'linear-gradient(135deg,#DC2626,#991B1B)',
            border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            boxShadow: editing ? '0 0 14px rgba(22,163,74,0.4)' : '0 0 14px rgba(220,38,38,0.35)',
          }}>
            {editing ? <><Check size={13} /> Save</> : <><Edit3 size={13} /> Edit</>}
          </button>
        </div>
      </div>

      {saved && (
        <div style={{
          margin: '0 16px 10px', padding: '10px 14px', borderRadius: 12,
          background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.3)',
          color: '#4ADE80', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Check size={14} /> Profile saved successfully
        </div>
      )}

      <div style={{ padding: '0 16px' }}>

        {/* ── QR Card ── */}
        <Card style={{
          background: 'linear-gradient(145deg,rgba(220,38,38,0.1),rgba(13,13,13,0.95))',
          border: '1px solid rgba(239,68,68,0.2)',
        }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {/* QR */}
            <div style={{
              background: '#0D0D0D', borderRadius: 14, padding: 8,
              border: '1px solid rgba(239,68,68,0.25)',
              boxShadow: '0 0 20px rgba(239,68,68,0.12)',
            }}>
              <QRCanvas />
            </div>
            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#F5F5F5', marginBottom: 2 }}>Arjun Sharma</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#DC2626,#7F1D1D)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 14px rgba(220,38,38,0.5)',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{bloodType}</span>
                  <span style={{ fontSize: 8, color: '#FCA5A5', fontWeight: 600 }}>BLOOD</span>
                </div>
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px',
                background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.3)',
                borderRadius: 20, fontSize: 10, fontWeight: 700, color: '#4ADE80',
              }}>
                <Wifi size={10} /> Works offline · No signal needed
              </div>
              <div style={{ marginTop: 8, fontSize: 10, color: '#6B7280' }}>
                Scan to view full medical profile
              </div>
            </div>
          </div>
        </Card>

        {/* ── Profile Sections ── */}
        <Card>
          <SectionHeader icon={Heart} title="Profile Details" />

          {/* Blood Type */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Blood Type</div>
            {editing ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {BLOOD_TYPES.map(bt => (
                  <button key={bt} onClick={() => setBloodType(bt)} style={{
                    padding: '5px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    background: bloodType === bt ? '#DC2626' : 'transparent',
                    border: bloodType === bt ? '1px solid #EF4444' : '1px solid #2E2E2E',
                    color: bloodType === bt ? '#fff' : '#6B7280',
                    transition: 'all 0.15s',
                  }}>{bt}</button>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#DC2626,#7F1D1D)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 16px rgba(220,38,38,0.4)',
                }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{bloodType}</span>
                </div>
                <span style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 600 }}>Blood Group</span>
              </div>
            )}
          </div>

          {/* Allergies */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Allergies</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: editing ? 6 : 0 }}>
              {allergies.map(a => (
                <Chip key={a} label={a} editing={editing} onRemove={l => removeChip(allergies, setAllergies, l)} />
              ))}
            </div>
            {editing && (
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <input value={allergyInput} onChange={e => setAllergyInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addChip(allergies, setAllergies, allergyInput, setAllergyInput)}
                  placeholder="Add allergy…" style={chipInputStyle} />
                <button onClick={() => addChip(allergies, setAllergies, allergyInput, setAllergyInput)} style={{
                  width: 32, height: 32, borderRadius: 10, background: '#DC2626', border: 'none',
                  color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}><Plus size={14} /></button>
              </div>
            )}
          </div>

          {/* Medical Conditions */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Medical Conditions</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: editing ? 6 : 0 }}>
              {conditions.map(c => (
                <Chip key={c} label={c} editing={editing} onRemove={l => removeChip(conditions, setConditions, l)} />
              ))}
            </div>
            {editing && (
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <input value={condInput} onChange={e => setCondInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addChip(conditions, setConditions, condInput, setCondInput)}
                  placeholder="Add condition…" style={chipInputStyle} />
                <button onClick={() => addChip(conditions, setConditions, condInput, setCondInput)} style={{
                  width: 32, height: 32, borderRadius: 10, background: '#DC2626', border: 'none',
                  color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}><Plus size={14} /></button>
              </div>
            )}
          </div>

          {/* Medications */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Current Medications</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: editing ? 6 : 0 }}>
              {medications.map(m => (
                <Chip key={m} label={m} editing={editing} onRemove={l => removeChip(medications, setMedications, l)} />
              ))}
            </div>
            {editing && (
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <input value={medInput} onChange={e => setMedInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addChip(medications, setMedications, medInput, setMedInput)}
                  placeholder="Add medication…" style={chipInputStyle} />
                <button onClick={() => addChip(medications, setMedications, medInput, setMedInput)} style={{
                  width: 32, height: 32, borderRadius: 10, background: '#DC2626', border: 'none',
                  color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}><Plus size={14} /></button>
              </div>
            )}
          </div>

          {/* Organ Donor */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#F5F5F5' }}>Organ Donor</div>
              <div style={{ fontSize: 11, color: organDonor ? '#4ADE80' : '#6B7280', marginTop: 1 }}>
                {organDonor ? '✓ Registered Donor' : 'Not registered'}
              </div>
            </div>
            <Toggle on={organDonor} onChange={() => editing && setOrganDonor(v => !v)} />
          </div>
        </Card>

        {/* ── Emergency Contacts ── */}
        <Card>
          <SectionHeader icon={Phone} title="Emergency Contacts" color="#60A5FA" />
          {[
            { name: 'Meena Sharma', rel: 'Mother', phone: '+91 98400 12345' },
            { name: 'Raj Sharma',   rel: 'Father', phone: '+91 98400 67890' },
          ].map((c, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 0', borderBottom: i === 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'linear-gradient(135deg,#1E3A5F,#1D4ED8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <User size={16} color="#93C5FD" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#F5F5F5' }}>{c.name}</div>
                <div style={{ fontSize: 11, color: '#6B7280' }}>{c.rel} · {c.phone}</div>
              </div>
              <a href={`tel:${c.phone}`} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px',
                borderRadius: 10, background: 'rgba(29,78,216,0.2)', border: '1px solid rgba(59,130,246,0.3)',
                color: '#60A5FA', fontSize: 11, fontWeight: 700, textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}>
                <Phone size={11} /> Call
              </a>
            </div>
          ))}
        </Card>

        {/* ── Insurance ── */}
        <Card style={{ marginBottom: 0 }}>
          <SectionHeader icon={ShieldCheck} title="Insurance & Identity" color="#A78BFA" />

          {[
            { label: 'Insurer',     value: 'HDFC Ergo' },
            { label: 'Policy No.',  value: 'HLTH-2024-\u2022\u2022\u2022\u2022\u20228234' },
            { label: 'Aadhar',     value: 'XXXX XXXX 4521' },
          ].map(({ label, value }) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#E2E8F0', fontFamily: 'monospace', letterSpacing: '0.04em' }}>{value}</span>
            </div>
          ))}

          <div style={{
            marginTop: 12, padding: '9px 12px', borderRadius: 10,
            background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <FileText size={13} color="#A78BFA" style={{ marginTop: 1, flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 11, color: '#A78BFA', lineHeight: 1.5 }}>
              Auto-filed to insurer when SOS triggers
            </p>
          </div>
        </Card>

      </div>
    </div>
  );
}
