import React, { useState, useEffect, useRef } from 'react';
import { Flag, Plus, ThumbsUp, Clock, CheckCircle, AlertTriangle, Loader, X, MapPin, Camera, ChevronRight, Users, Shield } from 'lucide-react';
import { getUserId } from '../lib/user.js';
import { getLocation } from '../lib/location.js';
import { supabase } from '../lib/supabase.js';

const BASE = 'https://roadsos-backend.vercel.app';

/* ─── Constants ─────────────────────────────────────────── */
const REPORT_TYPES = [
  { id:'POTHOLE',          label:'Pothole',           emoji:'🕳️', dept:'PWD' },
  { id:'ROAD_DAMAGE',      label:'Road Damage',       emoji:'🛣️', dept:'PWD' },
  { id:'TRAFFIC_SIGNAL',   label:'Traffic Signal',    emoji:'🚦', dept:'Traffic Police' },
  { id:'MISSING_MARKING',  label:'Missing Marking',   emoji:'🚧', dept:'NHAI' },
  { id:'BROKEN_BARRIER',   label:'Broken Barrier',    emoji:'🚫', dept:'NHAI' },
  { id:'FLOODING',         label:'Flooding',          emoji:'🌊', dept:'Municipal' },
  { id:'STREETLIGHT',      label:'Street Light Out',  emoji:'💡', dept:'Municipal' },
  { id:'DANGEROUS_CURVE',  label:'Dangerous Curve',   emoji:'⚠️', dept:'NHAI' },
  { id:'ILLEGAL_BLOCK',    label:'Illegal Obstruction',emoji:'🚗', dept:'Traffic Police' },
  { id:'OTHER',            label:'Other',             emoji:'📋', dept:'District Office' },
];

const STATUS_CONFIG = {
  SUBMITTED:    { color:'#F59E0B', bg:'rgba(245,158,11,0.15)', label:'Submitted',    icon:'📬' },
  ACKNOWLEDGED: { color:'#3B82F6', bg:'rgba(59,130,246,0.15)', label:'Acknowledged', icon:'👀' },
  IN_PROGRESS:  { color:'#F97316', bg:'rgba(249,115,22,0.15)', label:'In Progress',  icon:'🔧' },
  RESOLVED:     { color:'#22C55E', bg:'rgba(34,197,94,0.15)',  label:'Resolved',     icon:'✅' },
  REJECTED:     { color:'#EF4444', bg:'rgba(239,68,68,0.15)',  label:'Rejected',     icon:'❌' },
};

/* ─── Report Card ────────────────────────────────────────── */
function ReportCard({ report, onTap, myUserId }) {
  const [votes, setVotes] = useState(report.upvote_count || 1);
  const [voted, setVoted] = useState(false);
  const [voting, setVoting] = useState(false);
  const st = STATUS_CONFIG[report.status] || STATUS_CONFIG.SUBMITTED;
  const rt = REPORT_TYPES.find(t => t.id === report.report_type) || REPORT_TYPES[9];

  const handleUpvote = async (e) => {
    e.stopPropagation();
    if (voting || voted) return;
    setVoting(true);
    try {
      const res = await fetch(`${BASE}/api/community/upvote`, {
        method: 'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ report_id: report.id, user_id: myUserId }),
      });
      const json = await res.json();
      setVotes(json.upvote_count);
      setVoted(!json.already_voted);
    } finally { setVoting(false); }
  };

  const age = () => {
    const d = (Date.now() - new Date(report.created_at).getTime()) / 60000;
    if (d < 60) return `${Math.round(d)}m ago`;
    if (d < 1440) return `${Math.round(d/60)}h ago`;
    return `${Math.round(d/1440)}d ago`;
  };

  return (
    <div onClick={() => onTap(report)} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'14px', marginBottom:10, cursor:'pointer', transition:'border 0.2s' }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
        {/* Type icon */}
        <div style={{ width:44, height:44, borderRadius:14, background:'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
          {rt.emoji}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
            <span style={{ fontSize:13, fontWeight:800, color:'#F5F5F5' }}>{rt.label}</span>
            <span style={{ padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:700, background:st.bg, color:st.color, border:`1px solid ${st.color}44` }}>
              {st.icon} {st.label}
            </span>
          </div>
          <div style={{ fontSize:12, color:'#9CA3AF', marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
            {report.description}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'#6B7280' }}>
              <MapPin size={10} /> {report.address || `${report.lat?.toFixed(3)}, ${report.lng?.toFixed(3)}`}
            </div>
            <div style={{ fontSize:10, color:'#4B5563' }}>{age()}</div>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0 }}>
          <button onClick={handleUpvote} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, background:voted ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)', border:voted ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'6px 10px', cursor:'pointer' }}>
            <ThumbsUp size={13} color={voted ? '#60A5FA' : '#6B7280'} />
            <span style={{ fontSize:11, fontWeight:700, color:voted ? '#60A5FA' : '#9CA3AF' }}>{votes}</span>
          </button>
          <ChevronRight size={14} color="#4B5563" />
        </div>
      </div>
      {/* Officer assigned */}
      {report.assigned_officer && (
        <div style={{ marginTop:8, paddingTop:8, borderTop:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', gap:6 }}>
          <Shield size={11} color="#A78BFA" />
          <span style={{ fontSize:10, color:'#A78BFA', fontWeight:600 }}>Assigned to: {report.assigned_officer}</span>
        </div>
      )}
    </div>
  );
}

/* ─── Detail sheet ───────────────────────────────────────── */
function DetailSheet({ report, onClose }) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const st = STATUS_CONFIG[report.status] || STATUS_CONFIG.SUBMITTED;
  const rt = REPORT_TYPES.find(t => t.id === report.report_type) || REPORT_TYPES[9];

  useEffect(() => {
    fetch(`${BASE}/api/community/${report.id}`)
      .then(r => r.json())
      .then(d => { setTimeline(d.timeline || []); setLoading(false); })
      .catch(() => setLoading(false));

    // Realtime updates for this report
    const ch = supabase.channel(`report-${report.id}`)
      .on('broadcast', { event: 'REPORT_UPDATED' }, (payload) => {
        if (payload.payload?.report_id === report.id) {
          setTimeline(prev => [...prev, {
            id: Date.now().toString(), report_id: report.id,
            status: payload.payload.status, note: payload.payload.note,
            updated_by: payload.payload.updated_by, created_at: new Date().toISOString(),
          }]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [report.id]);

  const timelineIcon = (s) => ({ SUBMITTED:'📬', ACKNOWLEDGED:'👀', IN_PROGRESS:'🔧', RESOLVED:'✅', REJECTED:'❌' }[s] || '📋');

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(4px)', display:'flex', alignItems:'flex-end' }}>
      <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:430, margin:'0 auto', background:'#111', borderRadius:'20px 20px 0 0', maxHeight:'85vh', display:'flex', flexDirection:'column', border:`2px solid ${st.color}44` }}>
        {/* Header */}
        <div style={{ padding:'16px 16px 12px', flexShrink:0, borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <span style={{ fontSize:24 }}>{rt.emoji}</span>
              <div>
                <div style={{ fontSize:15, fontWeight:800, color:'#F5F5F5' }}>{rt.label}</div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
                  <span style={{ padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:700, background:st.bg, color:st.color }}>{st.icon} {st.label}</span>
                  <span style={{ fontSize:10, color:'#6B7280' }}>ID: {report.id.slice(0,8)}…</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ background:'#1F1F1F', border:'none', borderRadius:8, padding:'6px 8px', cursor:'pointer', color:'#6B7280' }}><X size={15} /></button>
          </div>
          <p style={{ margin:'10px 0 6px', fontSize:13, color:'#D1D5DB', lineHeight:1.5 }}>{report.description}</p>
          {report.assigned_officer && (
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 10px', borderRadius:10, background:'rgba(167,139,250,0.08)', border:'1px solid rgba(167,139,250,0.2)' }}>
              <Shield size={12} color="#A78BFA" />
              <span style={{ fontSize:11, color:'#A78BFA', fontWeight:600 }}>{report.assigned_officer}</span>
            </div>
          )}
          {report.photo_url && (
            <img src={report.photo_url} alt="Report photo" style={{ width:'100%', borderRadius:10, marginTop:8, maxHeight:140, objectFit:'cover' }} />
          )}
        </div>

        {/* Timeline */}
        <div style={{ flex:1, overflowY:'auto', padding:'14px 16px 24px' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>
            Progress Timeline · Live
          </div>
          {loading ? (
            <div style={{ textAlign:'center', padding:'20px 0', color:'#6B7280' }}>
              <Loader size={16} style={{ animation:'spin 1s linear infinite' }} />
            </div>
          ) : (
            <div style={{ position:'relative' }}>
              {/* Vertical line */}
              <div style={{ position:'absolute', left:16, top:8, bottom:8, width:2, background:'rgba(255,255,255,0.06)' }} />
              {timeline.map((u, i) => {
                const c = STATUS_CONFIG[u.status]?.color || '#6B7280';
                return (
                  <div key={u.id} style={{ display:'flex', gap:12, marginBottom:16, position:'relative' }}>
                    <div style={{ width:34, height:34, borderRadius:'50%', flexShrink:0, background:STATUS_CONFIG[u.status]?.bg || 'rgba(255,255,255,0.06)', border:`2px solid ${c}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, zIndex:1 }}>
                      {timelineIcon(u.status)}
                    </div>
                    <div style={{ flex:1, paddingTop:4 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                        <span style={{ fontSize:12, fontWeight:700, color:c }}>{STATUS_CONFIG[u.status]?.label || u.status}</span>
                        <span style={{ fontSize:10, color:'#4B5563' }}>
                          {u.updated_by === 'OFFICER' ? '👮 Officer' : u.updated_by === 'SYSTEM' ? '🤖 System' : '👤 User'}
                        </span>
                      </div>
                      <div style={{ fontSize:12, color:'#9CA3AF', lineHeight:1.5 }}>{u.note}</div>
                      <div style={{ fontSize:10, color:'#4B5563', marginTop:2 }}>
                        {new Date(u.created_at).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* Live indicator */}
              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background:'rgba(255,255,255,0.04)', border:'2px dashed rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:'#22C55E', animation:'blink 1.5s ease-in-out infinite' }} />
                </div>
                <span style={{ fontSize:11, color:'#22C55E', fontWeight:600 }}>Watching for updates…</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}} @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}

/* ─── Submit Form ────────────────────────────────────────── */
function SubmitForm({ onSubmitted }) {
  const [form, setForm] = useState({ type:'POTHOLE', description:'' });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [locLabel, setLocLabel] = useState('Detecting location…');
  const [loc, setLoc] = useState(null);

  useEffect(() => {
    getLocation().then(l => {
      setLoc(l);
      setLocLabel(`${l.lat.toFixed(4)}, ${l.lng.toFixed(4)} (GPS)`);
    });
  }, []);

  const handleSubmit = async () => {
    if (!form.description.trim() || !loc) return;
    setSubmitting(true); setError('');
    try {
      const userId = await getUserId();
      const fd = new FormData();
      fd.append('user_id', userId);
      fd.append('report_type', form.type);
      fd.append('description', form.description);
      fd.append('lat', String(loc.lat));
      fd.append('lng', String(loc.lng));
      if (file) fd.append('photo', file);

      const res = await fetch(`${BASE}/api/community/report`, { method:'POST', body:fd });
      const json = await res.json();
      if (json.report_id) {
        onSubmitted(json);
      } else {
        setError(json.error || 'Submission failed');
      }
    } catch (e) {
      setError('Network error — please try again');
    } finally { setSubmitting(false); }
  };

  const rt = REPORT_TYPES.find(t => t.id === form.type);

  return (
    <div style={{ padding:'0 0 20px' }}>
      {/* Department routing preview */}
      {rt && (
        <div style={{ margin:'0 0 14px', padding:'10px 14px', borderRadius:12, background:'rgba(167,139,250,0.08)', border:'1px solid rgba(167,139,250,0.2)', display:'flex', alignItems:'center', gap:8 }}>
          <Shield size={13} color="#A78BFA" />
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:'#A78BFA' }}>Will be sent to: {rt.dept}</div>
            <div style={{ fontSize:10, color:'#6B7280' }}>Officer notified via SMS immediately on submit</div>
          </div>
        </div>
      )}

      {/* Type grid */}
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:10, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Issue Type</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
          {REPORT_TYPES.map(t => (
            <button key={t.id} onClick={() => setForm(f => ({ ...f, type:t.id }))} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', borderRadius:12, cursor:'pointer', background:form.type === t.id ? 'rgba(220,38,38,0.12)' : 'rgba(255,255,255,0.04)', border:form.type === t.id ? '1.5px solid #EF4444' : '1px solid rgba(255,255,255,0.08)', transition:'all 0.15s' }}>
              <span style={{ fontSize:18 }}>{t.emoji}</span>
              <span style={{ fontSize:11, fontWeight:600, color:form.type === t.id ? '#F5F5F5' : '#9CA3AF' }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:10, fontWeight:700, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Description</div>
        <textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Describe the issue clearly — location details, severity, how long it has been there…"
          rows={3}
          style={{ width:'100%', background:'#111', border:'1px solid #2E2E2E', borderRadius:10, padding:'10px 12px', fontSize:12, color:'#F5F5F5', outline:'none', resize:'none', boxSizing:'border-box', lineHeight:1.6 }}
        />
      </div>

      {/* Location */}
      <div style={{ marginBottom:12, padding:'10px 12px', borderRadius:10, background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.2)', display:'flex', alignItems:'center', gap:8 }}>
        <MapPin size={13} color="#4ADE80" />
        <span style={{ fontSize:11, color:'#4ADE80', fontWeight:600 }}>{locLabel}</span>
      </div>

      {/* Photo upload */}
      <div style={{ marginBottom:14 }}>
        <label style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'#111', border:'1px dashed #2E2E2E', borderRadius:10, cursor:'pointer', fontSize:12, color:file ? '#4ADE80' : '#6B7280', fontWeight:600 }}>
          <Camera size={14} />
          {file ? file.name : 'Add photo (optional)'}
          <input type="file" accept="image/*" capture="environment" style={{ display:'none' }} onChange={e => setFile(e.target.files[0] || null)} />
        </label>
      </div>

      {error && <div style={{ marginBottom:10, padding:'9px 12px', borderRadius:10, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#F87171', fontSize:12 }}>{error}</div>}

      <button onClick={handleSubmit} disabled={submitting || !form.description.trim() || !loc} style={{ width:'100%', padding:'14px', borderRadius:14, border:'none', background:'linear-gradient(135deg,#DC2626,#991B1B)', color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer', boxShadow:'0 0 20px rgba(220,38,38,0.35)', opacity:(!form.description.trim() || !loc || submitting) ? 0.5 : 1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
        {submitting ? <><Loader size={15} style={{ animation:'spin 1s linear infinite' }} /> Submitting…</> : <><Flag size={15} /> Report to Officer</>}
      </button>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────── */
export default function CommunityPage() {
  const [tab, setTab] = useState('feed');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [submitted, setSubmitted] = useState(null);
  const [myUserId, setMyUserId] = useState(null);
  const [loc, setLoc] = useState(null);

  useEffect(() => {
    getUserId().then(setMyUserId);
    getLocation().then(l => {
      setLoc(l);
      loadReports(l, filterStatus);
    });
  }, []);

  useEffect(() => {
    // Realtime: new reports + status changes
    const ch = supabase.channel('community')
      .on('broadcast', { event: 'NEW_REPORT' }, (payload) => {
        loadReports(loc || { lat:13.0827, lng:80.2707 }, filterStatus);
      })
      .on('broadcast', { event: 'REPORT_UPDATED' }, (payload) => {
        setReports(prev => prev.map(r =>
          r.id === payload.payload?.report_id
            ? { ...r, status: payload.payload.status }
            : r
        ));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loc, filterStatus]);

  const loadReports = async (location, status) => {
    if (!location) return;
    setLoading(true);
    try {
      const qs = new URLSearchParams({ lat: location.lat, lng: location.lng, radius_km: 100, status });
      const data = await fetch(`${BASE}/api/community/reports?${qs}`).then(r => r.json());
      setReports(data.reports || []);
    } finally { setLoading(false); }
  };

  const onSubmitted = (result) => {
    setSubmitted(result);
    setTab('feed');
    if (loc) loadReports(loc, filterStatus);
  };

  const filterTabs = ['ALL','SUBMITTED','IN_PROGRESS','RESOLVED'];
  const stats = {
    total: reports.length,
    resolved: reports.filter(r => r.status === 'RESOLVED').length,
    inProgress: reports.filter(r => r.status === 'IN_PROGRESS' || r.status === 'ACKNOWLEDGED').length,
  };

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ padding:'16px 16px 0', flexShrink:0 }}>
        <div style={{ fontSize:10, fontWeight:700, color:'#EF4444', textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:2 }}>Public Accountability</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h1 style={{ fontSize:26, fontWeight:900, color:'#F5F5F5', margin:0 }}>Community</h1>
          <div style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', background:'rgba(34,197,94,0.08)', borderRadius:20, border:'1px solid rgba(34,197,94,0.25)' }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#22C55E', animation:'blink 2s ease-in-out infinite' }} />
            <span style={{ fontSize:10, color:'#22C55E', fontWeight:600 }}>LIVE</span>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display:'flex', gap:8, padding:'10px 16px 0', flexShrink:0 }}>
        {[
          { label:'Total Reports', value:stats.total, color:'#F5F5F5' },
          { label:'In Progress',   value:stats.inProgress, color:'#F97316' },
          { label:'Resolved',      value:stats.resolved, color:'#22C55E' },
        ].map(s => (
          <div key={s.label} style={{ flex:1, textAlign:'center', padding:'8px 4px', background:'rgba(255,255,255,0.04)', borderRadius:12, border:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize:18, fontWeight:900, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:9, color:'#6B7280', fontWeight:600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Submitted success banner */}
      {submitted && (
        <div style={{ margin:'8px 16px 0', padding:'10px 14px', borderRadius:12, background:'rgba(22,163,74,0.12)', border:'1px solid rgba(74,222,128,0.3)', display:'flex', alignItems:'center', gap:8 }}>
          <CheckCircle size={14} color="#4ADE80" />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#4ADE80' }}>Report submitted! Officer notified via SMS.</div>
            <div style={{ fontSize:10, color:'#6B7280' }}>ID: {submitted.report_id?.slice(0,8)} · {submitted.assigned_officer}</div>
          </div>
          <button onClick={() => setSubmitted(null)} style={{ background:'none', border:'none', color:'#4B5563', cursor:'pointer' }}><X size={12} /></button>
        </div>
      )}

      {/* Tab bar */}
      <div style={{ padding:'10px 16px 0', flexShrink:0 }}>
        <div style={{ display:'flex', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:4, gap:4 }}>
          {[
            { id:'feed',   label:'Live Feed', Icon:Users },
            { id:'submit', label:'Report Issue', Icon:Plus },
          ].map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'9px 8px', borderRadius:9, border:'none', cursor:'pointer', background:tab === id ? 'linear-gradient(135deg,#DC2626,#991B1B)' : 'transparent', color:tab === id ? '#fff' : '#6B7280', fontSize:11, fontWeight:700, transition:'all 0.2s', boxShadow:tab === id ? '0 0 12px rgba(220,38,38,0.3)' : 'none' }}>
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed filter chips */}
      {tab === 'feed' && (
        <div style={{ display:'flex', gap:6, padding:'8px 16px 0', overflowX:'auto', scrollbarWidth:'none', flexShrink:0 }}>
          {filterTabs.map(f => (
            <button key={f} onClick={() => { setFilterStatus(f); if(loc) loadReports(loc, f); }} style={{ padding:'5px 12px', borderRadius:20, border:'none', cursor:'pointer', background:filterStatus === f ? '#DC2626' : 'rgba(255,255,255,0.06)', color:filterStatus === f ? '#fff' : '#9CA3AF', fontSize:11, fontWeight:700, whiteSpace:'nowrap', transition:'all 0.15s' }}>
              {f === 'ALL' ? 'All' : STATUS_CONFIG[f]?.label || f}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div style={{ flex:1, overflowY:'auto', padding:'10px 16px 16px', scrollbarWidth:'none' }}>
        {tab === 'feed' ? (
          loading ? (
            <div style={{ textAlign:'center', padding:'40px 0', color:'#6B7280', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
              <Loader size={16} style={{ animation:'spin 1s linear infinite' }} /> Loading live reports…
            </div>
          ) : reports.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 16px' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🏘️</div>
              <div style={{ fontSize:14, fontWeight:700, color:'#F5F5F5', marginBottom:6 }}>No reports in your area yet</div>
              <div style={{ fontSize:12, color:'#6B7280', marginBottom:16 }}>Be the first to report a road safety issue</div>
              <button onClick={() => setTab('submit')} style={{ padding:'10px 20px', borderRadius:12, background:'linear-gradient(135deg,#DC2626,#991B1B)', border:'none', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                Report an Issue →
              </button>
            </div>
          ) : (
            reports.map(r => <ReportCard key={r.id} report={r} onTap={setActiveReport} myUserId={myUserId} />)
          )
        ) : (
          <SubmitForm onSubmitted={onSubmitted} />
        )}
      </div>

      {/* Detail sheet */}
      {activeReport && <DetailSheet report={activeReport} onClose={() => setActiveReport(null)} />}

      <style>{`
        @keyframes spin  { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  );
}
