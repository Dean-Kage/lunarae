import { useState, useEffect, useCallback } from 'react'
import { Shield, Search, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, ChevronDown, ChevronUp, BarChart2 } from 'lucide-react'

const C = { gold:'#e9ba4c', green:'#4ade80', red:'#f87171', blue:'#60a5fa', purple:'#a78bfa', orange:'#f97316', sub:'#8fa3bd', muted:'#45607a', dim:'#2a3d52', text:'#eef2f7', border:'rgba(30,58,95,0.55)' }
const cardStyle = { background:'rgba(10,18,32,0.85)', border:`1px solid ${C.border}`, borderRadius:16, overflow:'hidden' }
const tbl = { width:'100%', borderCollapse:'collapse', fontSize:13 }
const th  = { textAlign:'left', padding:'10px 14px', color:C.dim, fontWeight:700, fontSize:10, textTransform:'uppercase', letterSpacing:'0.09em', borderBottom:`1px solid rgba(30,58,95,0.4)`, background:'rgba(6,9,15,0.35)', whiteSpace:'nowrap' }
const td  = { padding:'11px 14px', color:C.sub, verticalAlign:'middle', borderBottom:`1px solid rgba(30,58,95,0.2)` }

function authHdr() {
  const t = localStorage.getItem('lunarae_auth_token')
  return { 'Content-Type':'application/json', ...(t?{Authorization:`Bearer ${t}`}:{}) }
}

function fmt(n) { return Number(n||0).toLocaleString() }

const STATUS_CFG = {
  auto_approved:  { color:C.green,  label:'Auto Approved'  },
  approved:       { color:C.green,  label:'Approved'       },
  pending_warning:{ color:C.gold,   label:'Warning'        },
  pending_review: { color:C.red,    label:'Needs Review'   },
  rejected:       { color:C.red,    label:'Rejected'       },
}

function ConfBadge({ pct }) {
  const p = Number(pct||0)
  const color = p >= 95 ? C.green : p >= 80 ? C.gold : C.red
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:700, background:color+'18', color, border:`1px solid ${color}35` }}>
      <span style={{ width:4, height:4, borderRadius:'50%', background:color }} />{p.toFixed(0)}%
    </span>
  )
}

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || { color:C.muted, label:status }
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 9px', borderRadius:20, fontSize:11, fontWeight:700, background:cfg.color+'1e', color:cfg.color, border:`1px solid ${cfg.color}40`, whiteSpace:'nowrap' }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:cfg.color }} />{cfg.label}
    </span>
  )
}

function Spinner() {
  return (
    <div style={{ display:'flex', justifyContent:'center', padding:52 }}>
      <div style={{ width:28, height:28, border:`2px solid rgba(30,58,95,0.4)`, borderTopColor:C.gold, borderRadius:'50%', animation:'rc-spin .7s linear infinite' }} />
    </div>
  )
}

/* ── Detail Panel ────────────────────────────────────────────── */
function DetailPanel({ item, onClose, onApprove, onReject, submitting }) {
  const [overrideHs, setOverrideHs] = useState(item.approved_hs || item.suggested_hs || '')
  const [notes, setNotes]           = useState(item.notes || '')
  const preds = item.all_predictions || []

  const inp = { width:'100%', background:'rgba(6,9,15,0.7)', border:`1px solid rgba(30,58,95,0.65)`, borderRadius:10, padding:'9px 13px', fontSize:13, color:C.text, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }

  const isPending = item.status === 'pending_review' || item.status === 'pending_warning'

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9000, background:'rgba(3,6,14,0.88)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <div style={{ background:'rgba(8,14,26,0.98)', border:`1px solid ${C.border}`, borderRadius:20, width:'100%', maxWidth:560, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 24px 64px rgba(0,0,0,0.7)', overflow:'hidden' }} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:'18px 24px 14px', borderBottom:`1px solid rgba(30,58,95,0.4)`, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ fontSize:15, fontWeight:800, color:C.text }}>Review Detail</div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <StatusBadge status={item.status} />
            <button onClick={onClose} style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontSize:20, padding:4 }}>✕</button>
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
          {/* Description */}
          <div style={{ marginBottom:16, padding:'12px 16px', borderRadius:12, background:'rgba(6,9,15,0.5)', border:`1px solid rgba(30,58,95,0.3)` }}>
            <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Description</div>
            <div style={{ fontSize:13, color:C.text, lineHeight:1.6 }}>{item.description}</div>
          </div>

          {/* HS comparison grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
            <div style={{ padding:'12px 14px', borderRadius:10, background:'rgba(96,165,250,0.06)', border:`1px solid rgba(96,165,250,0.2)` }}>
              <div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>Predicted HS</div>
              <div style={{ fontSize:18, fontFamily:'monospace', fontWeight:800, color:C.blue }}>{item.suggested_hs}</div>
              <ConfBadge pct={item.confidence} />
            </div>
            <div style={{ padding:'12px 14px', borderRadius:10, background:'rgba(74,222,128,0.06)', border:`1px solid rgba(74,222,128,0.2)` }}>
              <div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>Approved HS</div>
              <div style={{ fontSize:18, fontFamily:'monospace', fontWeight:800, color:item.approved_hs?C.green:C.dim }}>{item.approved_hs || '—'}</div>
            </div>
          </div>

          {/* Alternatives */}
          {preds.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Alternatives</div>
              {preds.slice(0,5).map((p,i) => {
                const hs = p.hs_code || p.suggestedHs || ''
                const conf = Number(p.confidence||0)
                const cc = conf>=95?C.green:conf>=80?C.gold:C.red
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, background:'rgba(6,9,15,0.4)', border:`1px solid rgba(30,58,95,0.25)`, marginBottom:5, cursor:isPending?'pointer':'default' }}
                    onClick={() => isPending && setOverrideHs(hs)}
                  >
                    <span style={{ fontSize:12, fontFamily:'monospace', color:C.text, fontWeight:600, minWidth:80 }}>{hs}</span>
                    <span style={{ flex:1, fontSize:11, color:C.sub, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.description||p.desc||''}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:cc }}>{conf.toFixed(0)}%</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Override HS + notes (pending only) */}
          {isPending && (
            <>
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Override HS Code</div>
                <input value={overrideHs} onChange={e=>setOverrideHs(e.target.value)} placeholder="HS code to approve" maxLength={10} style={{ ...inp, fontFamily:'monospace', fontSize:15, letterSpacing:'0.08em' }} />
              </div>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Notes</div>
                <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} placeholder="Optional review notes…" style={{ ...inp, resize:'vertical', minHeight:56 }} />
              </div>

              <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(233,186,76,0.06)', border:`1px solid rgba(233,186,76,0.18)`, fontSize:11, color:'#c8921a' }}>
                ✦ Approving this will train future classifications for similar products.
              </div>
            </>
          )}

          {/* Reviewer info (non-pending) */}
          {!isPending && item.reviewed_by && (
            <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(6,9,15,0.5)', border:`1px solid rgba(30,58,95,0.25)`, fontSize:12, color:C.sub }}>
              Reviewed by <strong style={{ color:C.text }}>{item.reviewed_by}</strong>
              {item.review_date && <> · {new Date(item.review_date).toLocaleString()}</>}
              {item.notes && <div style={{ marginTop:6, color:C.muted }}>{item.notes}</div>}
            </div>
          )}
        </div>

        {/* Footer */}
        {isPending && (
          <div style={{ padding:'14px 24px', borderTop:`1px solid rgba(30,58,95,0.35)`, display:'flex', justifyContent:'flex-end', gap:10, flexShrink:0 }}>
            <button onClick={onClose} style={{ background:'rgba(10,18,32,0.8)', border:`1px solid ${C.border}`, borderRadius:10, padding:'9px 16px', fontSize:13, fontWeight:600, color:C.sub, cursor:'pointer' }}>Cancel</button>
            <button onClick={() => onReject(item.id, notes)} disabled={!!submitting} style={{ background:'rgba(248,113,113,0.08)', border:`1px solid rgba(248,113,113,0.35)`, borderRadius:10, padding:'9px 16px', fontSize:13, fontWeight:600, color:C.red, cursor:'pointer', opacity:submitting?0.6:1 }}>
              {submitting==='reject'?'Rejecting…':'Reject'}
            </button>
            <button onClick={() => onApprove(item.id, overrideHs, notes)} disabled={!!submitting||!overrideHs.trim()} style={{ background:`linear-gradient(135deg,${C.gold},#c8921a)`, border:'none', borderRadius:10, padding:'10px 20px', fontSize:13, fontWeight:700, color:'#06090f', cursor:'pointer', opacity:(submitting||!overrideHs.trim())?0.6:1 }}>
              {submitting==='approve'?'Approving…':'Approve'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Main ReviewCenter ───────────────────────────────────────── */
export default function ReviewCenter() {
  const [stats,      setStats]      = useState(null)
  const [items,      setItems]      = useState([])
  const [total,      setTotal]      = useState(0)
  const [page,       setPage]       = useState(1)
  const [status,     setStatus]     = useState('')
  const [search,     setSearch]     = useState('')
  const [loading,    setLoading]    = useState(true)
  const [detail,     setDetail]     = useState(null)
  const [submitting, setSubmitting] = useState(null)
  const [toast,      setToast]      = useState(null)
  const LIMIT = 50

  function notify(msg, err=false) {
    setToast({ msg, err })
    setTimeout(()=>setToast(null), 3500)
  }

  const loadStats = useCallback(async () => {
    try {
      const r = await fetch('/api/customs/review/stats', { headers:authHdr() })
      const d = await r.json()
      if (d.success) setStats(d.data)
    } catch {}
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ limit:LIMIT, offset:(page-1)*LIMIT })
      if (status) p.set('status', status)
      if (search) p.set('search', search)
      const r = await fetch(`/api/customs/review/all?${p}`, { headers:authHdr() })
      const d = await r.json()
      if (d.success) { setItems(d.data.items); setTotal(d.data.total) }
    } catch {}
    finally { setLoading(false) }
  }, [page, status, search])

  useEffect(() => { loadStats() }, [loadStats])
  useEffect(() => { load() }, [load])

  async function handleApprove(id, approvedHs, notes) {
    if (!approvedHs?.trim()) return
    setSubmitting('approve')
    try {
      const r = await fetch('/api/customs/review/approve', { method:'POST', headers:authHdr(), body:JSON.stringify({ id, approvedHs, reviewedBy:'Admin', notes }) })
      const d = await r.json()
      if (d.success) { notify('Classification approved'); setDetail(null); load(); loadStats() }
      else notify(d.error || 'Failed', true)
    } catch(e) { notify(e.message, true) }
    finally { setSubmitting(null) }
  }

  async function handleReject(id, notes) {
    setSubmitting('reject')
    try {
      const r = await fetch('/api/customs/review/reject', { method:'POST', headers:authHdr(), body:JSON.stringify({ id, reviewedBy:'Admin', notes }) })
      const d = await r.json()
      if (d.success) { notify('Classification rejected'); setDetail(null); load(); loadStats() }
      else notify(d.error || 'Failed', true)
    } catch(e) { notify(e.message, true) }
    finally { setSubmitting(null) }
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  const FILTER_TABS = [
    { label:'All',        value:'' },
    { label:'Needs Review', value:'pending_review' },
    { label:'Warnings',   value:'pending_warning' },
    { label:'Approved',   value:'approved' },
    { label:'Auto',       value:'auto_approved' },
    { label:'Rejected',   value:'rejected' },
  ]

  return (
    <div>
      <style>{`@keyframes rc-spin { to { transform:rotate(360deg) } }`}</style>

      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, background:toast.err?'rgba(90,20,20,0.97)':'rgba(16,60,30,0.97)', border:`1px solid ${toast.err?C.red:C.green}35`, borderRadius:12, padding:'12px 18px', fontSize:13, color:toast.err?'#fca5a5':'#86efac', fontWeight:600, boxShadow:'0 12px 40px rgba(0,0,0,0.55)', backdropFilter:'blur(16px)', display:'flex', alignItems:'center', gap:8 }}>
          {toast.err?<XCircle size={14}/>:<CheckCircle size={14}/>}{toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ color:C.text, fontSize:22, fontWeight:800, margin:'0 0 4px', letterSpacing:'-0.02em' }}>Classification Reviews</h1>
        <p style={{ fontSize:13, color:C.muted, margin:0 }}>Review and correct AI HS code classifications. Corrections improve future accuracy.</p>
      </div>

      {/* Stats strip */}
      {stats && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:24 }}>
          {[
            { label:'Pending Review', value:fmt(stats.pending_review),   color:C.red,    icon:AlertTriangle },
            { label:'Warnings',       value:fmt(stats.pending_warning),  color:C.gold,   icon:Clock        },
            { label:'Auto Approved',  value:fmt(stats.auto_approved),    color:C.green,  icon:CheckCircle  },
            { label:'Approved',       value:fmt(stats.approved),         color:C.green,  icon:CheckCircle  },
            { label:'Rejected',       value:fmt(stats.rejected),         color:C.red,    icon:XCircle      },
            { label:'Accuracy',       value:stats.accuracy!=null?`${stats.accuracy}%`:'—', color:stats.accuracy>=85?C.green:C.gold, icon:BarChart2 },
          ].map((kpi,i)=>(
            <div key={i} onClick={()=>{ if(kpi.label!=='Accuracy') setStatus(FILTER_TABS.find(t=>t.label.includes(kpi.label.split(' ')[0]))?.value||'') }} style={{ flex:'1 0 130px', padding:'12px 16px', borderRadius:12, background:'rgba(10,18,32,0.85)', border:`1px solid rgba(30,58,95,0.45)`, cursor:kpi.label!=='Accuracy'?'pointer':'default', transition:'border-color .15s' }}
              onMouseEnter={e=>{ if(kpi.label!=='Accuracy') e.currentTarget.style.borderColor=kpi.color+'44' }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(30,58,95,0.45)' }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                <kpi.icon size={11} color={kpi.color} strokeWidth={2} />
                <span style={{ fontSize:9, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em' }}>{kpi.label}</span>
              </div>
              <div style={{ fontSize:22, fontWeight:800, color:kpi.color, letterSpacing:'-0.03em' }}>{kpi.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', marginBottom:18 }}>
        <div style={{ display:'flex', background:'rgba(6,9,15,0.6)', border:`1px solid rgba(30,58,95,0.4)`, borderRadius:12, padding:3, gap:2, flexWrap:'wrap' }}>
          {FILTER_TABS.map(tab=>(
            <button key={tab.value} onClick={()=>{ setStatus(tab.value); setPage(1) }} style={{ padding:'6px 12px', borderRadius:9, fontSize:12, fontWeight:600, border:'none', cursor:'pointer', background:status===tab.value?'rgba(233,186,76,0.12)':'none', color:status===tab.value?C.gold:C.muted, transition:'all .15s' }}>
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ flex:'1 1 200px', display:'flex', alignItems:'center', gap:8, background:'rgba(6,9,15,0.6)', border:`1px solid rgba(30,58,95,0.45)`, borderRadius:10, padding:'0 12px', height:38 }}>
          <Search size={13} color={C.dim} strokeWidth={1.8} />
          <input value={search} onChange={e=>{ setSearch(e.target.value); setPage(1) }} placeholder="Search description or HS…" style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:13, color:C.text, fontFamily:'inherit' }} />
        </div>
        <button onClick={()=>{ load(); loadStats() }} style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(10,18,32,0.8)', border:`1px solid ${C.border}`, borderRadius:10, padding:'9px 14px', fontSize:13, fontWeight:600, color:C.sub, cursor:'pointer' }}>
          <RefreshCw size={13} strokeWidth={1.8} />Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? <Spinner /> : (
        <>
          <div style={{ ...cardStyle, overflowX:'auto' }}>
            <table style={tbl}>
              <thead>
                <tr>
                  <th style={th}>Description</th>
                  <th style={th}>Predicted HS</th>
                  <th style={th}>Approved HS</th>
                  <th style={th}>Confidence</th>
                  <th style={th}>Status</th>
                  <th style={th}>Date</th>
                  <th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={7} style={{ ...td, textAlign:'center', padding:40, color:C.dim }}>No classifications found</td></tr>
                ) : items.map((item, i) => {
                  const isPending = item.status === 'pending_review' || item.status === 'pending_warning'
                  return (
                    <tr key={item.id} style={{ transition:'background .1s' }}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(233,186,76,0.02)'}
                      onMouseLeave={e=>e.currentTarget.style.background=''}
                    >
                      <td style={{ ...td, maxWidth:260 }}>
                        <div style={{ fontSize:12, fontWeight:500, color:C.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.description}</div>
                      </td>
                      <td style={{ ...td, fontFamily:'monospace', fontSize:12, color:C.gold }}>{item.suggested_hs}</td>
                      <td style={{ ...td, fontFamily:'monospace', fontSize:12, color:item.approved_hs?C.green:C.dim }}>{item.approved_hs||'—'}</td>
                      <td style={td}><ConfBadge pct={item.confidence} /></td>
                      <td style={td}><StatusBadge status={item.status} /></td>
                      <td style={{ ...td, fontSize:11, whiteSpace:'nowrap', color:C.dim }}>{item.created_at?new Date(item.created_at).toLocaleDateString():'—'}</td>
                      <td style={td}>
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                          <button onClick={()=>setDetail(item)} style={{ background:'rgba(96,165,250,0.08)', border:'1px solid rgba(96,165,250,0.28)', borderRadius:7, padding:'4px 10px', fontSize:11, fontWeight:700, color:C.blue, cursor:'pointer' }}>View</button>
                          {isPending && <>
                            <button onClick={()=>handleApprove(item.id, item.suggested_hs, '')} style={{ background:'rgba(74,222,128,0.08)', border:'1px solid rgba(74,222,128,0.28)', borderRadius:7, padding:'4px 10px', fontSize:11, fontWeight:700, color:C.green, cursor:'pointer' }}>✓ Approve</button>
                            <button onClick={()=>handleReject(item.id, '')} style={{ background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.28)', borderRadius:7, padding:'4px 10px', fontSize:11, fontWeight:700, color:C.red, cursor:'pointer' }}>✗ Reject</button>
                          </>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:8, marginTop:18 }}>
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{ background:'rgba(10,18,32,0.8)', border:`1px solid ${C.border}`, borderRadius:8, padding:'7px 14px', fontSize:12, fontWeight:600, color:C.sub, cursor:'pointer', opacity:page===1?0.4:1 }}>← Prev</button>
              <span style={{ color:C.dim, fontSize:12 }}>Page {page} of {totalPages} · {fmt(total)} total</span>
              <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} style={{ background:'rgba(10,18,32,0.8)', border:`1px solid ${C.border}`, borderRadius:8, padding:'7px 14px', fontSize:12, fontWeight:600, color:C.sub, cursor:'pointer', opacity:page===totalPages?0.4:1 }}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* Detail panel */}
      {detail && (
        <DetailPanel
          item={detail}
          onClose={()=>setDetail(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          submitting={submitting}
        />
      )}
    </div>
  )
}
