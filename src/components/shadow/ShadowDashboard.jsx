import { useState, useEffect, useCallback } from 'react'
import { Eye, RefreshCw, CheckCircle, XCircle, Hash, BarChart2, Zap, AlertTriangle } from 'lucide-react'

const C = { gold:'#e9ba4c', green:'#4ade80', red:'#f87171', blue:'#60a5fa', purple:'#a78bfa', orange:'#f97316', sub:'#8fa3bd', muted:'#45607a', dim:'#2a3d52', text:'#eef2f7', border:'rgba(30,58,95,0.55)' }
const cardStyle = { background:'rgba(10,18,32,0.85)', border:`1px solid ${C.border}`, borderRadius:16, overflow:'hidden' }
const tbl = { width:'100%', borderCollapse:'collapse', fontSize:13 }
const th  = { textAlign:'left', padding:'10px 14px', color:C.dim, fontWeight:700, fontSize:10, textTransform:'uppercase', letterSpacing:'0.09em', borderBottom:`1px solid rgba(30,58,95,0.4)`, background:'rgba(6,9,15,0.35)', whiteSpace:'nowrap' }
const td  = { padding:'10px 14px', color:C.sub, verticalAlign:'middle', borderBottom:`1px solid rgba(30,58,95,0.2)` }

function authHdr() {
  const t = localStorage.getItem('lunarae_auth_token')
  return { 'Content-Type':'application/json', ...(t?{Authorization:`Bearer ${t}`}:{}) }
}

function fmt(n,dec=0) { return Number(n||0).toLocaleString(undefined,{minimumFractionDigits:dec,maximumFractionDigits:dec}) }

function Spinner() {
  return (
    <div style={{ display:'flex', justifyContent:'center', padding:52 }}>
      <div style={{ width:28, height:28, border:`2px solid rgba(30,58,95,0.4)`, borderTopColor:C.gold, borderRadius:'50%', animation:'sd-spin .7s linear infinite' }} />
    </div>
  )
}

function MatchPill({ v }) {
  if (v == null) return <span style={{ color:C.dim, fontSize:12 }}>—</span>
  const color = v === 1 ? C.green : C.red
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:700, background:color+'18', color, border:`1px solid ${color}35` }}>
      {v === 1 ? '✓ Match' : '✗ Mismatch'}
    </span>
  )
}

function PctBar({ label, pct, color, comparable }) {
  const p = Math.min(100, Math.max(0, Number(pct)||0))
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
        <span style={{ fontSize:12, color:C.sub }}>{label}</span>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {comparable != null && <span style={{ fontSize:10, color:C.dim }}>{fmt(comparable)} samples</span>}
          <span style={{ fontSize:15, fontWeight:800, color, letterSpacing:'-0.02em' }}>
            {pct == null ? 'No data' : `${p.toFixed(1)}%`}
          </span>
        </div>
      </div>
      <div style={{ height:8, borderRadius:4, background:'rgba(255,255,255,0.05)' }}>
        <div style={{ height:'100%', borderRadius:4, width:`${pct!=null?p:0}%`, background:`linear-gradient(to right,${color}77,${color})`, transition:'width .5s' }} />
      </div>
    </div>
  )
}

/* ── Side-by-side detail modal ───────────────────────────────── */
function ComparisonModal({ item, onClose }) {
  const fields = [
    { label:'HS Code',    current:item.current_hs,      newVal:item.new_hs,      match:item.hs_match,      isText:true, mono:true },
    { label:'Duty Rate',  current:item.current_duty!=null?`${Number(item.current_duty).toFixed(1)}%`:null, newVal:item.new_duty!=null?`${Number(item.new_duty).toFixed(1)}%`:null, match:item.duty_match,    isText:true },
    { label:'CBCA',       current:item.current_cbca,    newVal:item.new_cbca,    match:item.cbca_match,    isBool:true },
    { label:'Licence',    current:item.current_licence, newVal:item.new_licence, match:item.licence_match, isBool:true },
  ]

  function renderVal(v, isBool, mono) {
    if (v == null) return <span style={{ color:C.dim }}>—</span>
    if (isBool) return <span style={{ color:v?C.orange:C.green, fontWeight:700 }}>{v?'Required':'Not Required'}</span>
    return <span style={{ color:C.text, fontFamily:mono?'monospace':undefined, fontWeight:600 }}>{v}</span>
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9000, background:'rgba(3,6,14,0.88)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <div style={{ background:'rgba(8,14,26,0.98)', border:`1px solid ${C.border}`, borderRadius:20, width:'100%', maxWidth:600, maxHeight:'88vh', display:'flex', flexDirection:'column', boxShadow:'0 24px 64px rgba(0,0,0,0.7)', overflow:'hidden' }} onClick={e=>e.stopPropagation()}>

        <div style={{ padding:'18px 24px 14px', borderBottom:`1px solid rgba(30,58,95,0.4)`, display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div style={{ fontSize:15, fontWeight:800, color:C.text }}>Shadow Comparison Detail</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontSize:20, padding:4 }}>✕</button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
          {/* Description */}
          <div style={{ padding:'12px 16px', borderRadius:12, background:'rgba(6,9,15,0.5)', border:`1px solid rgba(30,58,95,0.3)`, marginBottom:20 }}>
            <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Item Description</div>
            <div style={{ fontSize:13, color:C.text, lineHeight:1.6 }}>{item.description}</div>
            {item.confidence != null && (
              <div style={{ marginTop:8, fontSize:11, color:C.muted }}>
                New Engine Confidence: <span style={{ color:C.gold, fontWeight:700 }}>{Number(item.confidence).toFixed(1)}%</span>
              </div>
            )}
          </div>

          {/* Side by side */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:0, marginBottom:20 }}>
            {/* Header */}
            <div style={{ padding:'10px 14px', background:'rgba(96,165,250,0.08)', borderRadius:'12px 0 0 0', border:`1px solid rgba(96,165,250,0.2)`, textAlign:'center' }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.blue }}>Existing Engine</div>
              <div style={{ fontSize:9, color:C.dim, marginTop:2 }}>Current Production</div>
            </div>
            <div style={{ width:48, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(6,9,15,0.4)', borderTop:`1px solid rgba(30,58,95,0.3)` }}>
              <span style={{ fontSize:11, color:C.dim }}>vs</span>
            </div>
            <div style={{ padding:'10px 14px', background:'rgba(74,222,128,0.06)', borderRadius:'0 12px 0 0', border:`1px solid rgba(74,222,128,0.2)`, textAlign:'center' }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.green }}>New Engine</div>
              <div style={{ fontSize:9, color:C.dim, marginTop:2 }}>AI Classification</div>
            </div>

            {/* Rows */}
            {fields.map((f, i) => {
              const isLast = i === fields.length - 1
              const mismatch = f.match === 0
              const baseRow = { padding:'12px 14px', borderBottom:isLast?'none':`1px solid rgba(30,58,95,0.2)`, background:mismatch?'rgba(248,113,113,0.04)':'rgba(6,9,15,0.25)' }
              return [
                <div key={`l-${i}`} style={{ ...baseRow, border:`1px solid rgba(30,58,95,0.2)`, borderRight:'none', borderBottom:isLast?`1px solid rgba(30,58,95,0.2)`:`1px solid rgba(30,58,95,0.2)` }}>
                  <div style={{ fontSize:9, color:C.dim, marginBottom:3, textTransform:'uppercase', letterSpacing:'0.06em' }}>{f.label}</div>
                  <div style={{ fontSize:13 }}>{renderVal(f.current, f.isBool, f.mono)}</div>
                </div>,
                <div key={`m-${i}`} style={{ ...baseRow, display:'flex', alignItems:'center', justifyContent:'center', borderLeft:`1px solid rgba(30,58,95,0.2)`, borderRight:`1px solid rgba(30,58,95,0.2)`, borderBottom:`1px solid rgba(30,58,95,0.2)` }}>
                  {f.match != null
                    ? <span style={{ fontSize:14, color:f.match===1?C.green:C.red }}>{f.match===1?'✓':'✗'}</span>
                    : <span style={{ color:C.dim, fontSize:10 }}>—</span>
                  }
                </div>,
                <div key={`r-${i}`} style={{ ...baseRow, border:`1px solid rgba(30,58,95,0.2)`, borderLeft:'none', borderBottom:isLast?`1px solid rgba(30,58,95,0.2)`:`1px solid rgba(30,58,95,0.2)`, background:mismatch?'rgba(248,113,113,0.04)':'rgba(6,9,15,0.25)' }}>
                  <div style={{ fontSize:9, color:C.dim, marginBottom:3, textTransform:'uppercase', letterSpacing:'0.06em' }}>{f.label}</div>
                  <div style={{ fontSize:13 }}>{renderVal(f.newVal, f.isBool, f.mono)}</div>
                </div>,
              ]
            })}
          </div>
        </div>

        <div style={{ padding:'14px 24px', borderTop:`1px solid rgba(30,58,95,0.35)`, display:'flex', justifyContent:'flex-end', flexShrink:0 }}>
          <button onClick={onClose} style={{ background:`linear-gradient(135deg,${C.gold},#c8921a)`, border:'none', borderRadius:10, padding:'10px 22px', fontSize:13, fontWeight:700, color:'#06090f', cursor:'pointer' }}>Close</button>
        </div>
      </div>
    </div>
  )
}

/* ── Main Shadow Dashboard ───────────────────────────────────── */
export default function ShadowDashboard() {
  const [stats,    setStats]    = useState(null)
  const [report,   setReport]   = useState(null)
  const [items,    setItems]    = useState([])
  const [total,    setTotal]    = useState(0)
  const [page,     setPage]     = useState(1)
  const [field,    setField]    = useState('')
  const [loading,  setLoading]  = useState(true)
  const [detail,   setDetail]   = useState(null)
  const LIMIT = 50

  const loadStats = useCallback(async () => {
    try {
      const [rs, rr] = await Promise.all([
        fetch('/api/customs/shadow/stats',  { headers:authHdr() }).then(r=>r.json()),
        fetch('/api/customs/shadow/report', { headers:authHdr() }).then(r=>r.json()),
      ])
      if (rs.success) setStats(rs.data)
      if (rr.success) setReport(rr.data)
    } catch {}
  }, [])

  const loadMismatches = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ limit:LIMIT, offset:(page-1)*LIMIT })
      if (field) p.set('field', field)
      const r = await fetch(`/api/customs/shadow/mismatches?${p}`, { headers:authHdr() })
      const d = await r.json()
      if (d.success) { setItems(d.data.items); setTotal(d.data.total) }
    } catch {}
    finally { setLoading(false) }
  }, [page, field])

  useEffect(()=>{ loadStats() }, [loadStats])
  useEffect(()=>{ loadMismatches() }, [loadMismatches])

  const totalPages = Math.max(1, Math.ceil(total/LIMIT))

  const FIELD_TABS = [
    { label:'All Mismatches', value:'' },
    { label:'HS Mismatch',    value:'hs_match' },
    { label:'Duty Mismatch',  value:'duty_match' },
    { label:'CBCA Mismatch',  value:'cbca_match' },
    { label:'Licence Mismatch', value:'licence_match' },
  ]

  return (
    <div>
      <style>{`@keyframes sd-spin { to { transform:rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={{ marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ color:C.text, fontSize:22, fontWeight:800, margin:'0 0 4px', letterSpacing:'-0.02em' }}>Shadow Mode Analytics</h1>
          <p style={{ fontSize:13, color:C.muted, margin:0 }}>Comparison between existing production engine and new AI classification engine</p>
        </div>
        <button onClick={()=>{ loadStats(); loadMismatches() }} style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(10,18,32,0.8)', border:`1px solid ${C.border}`, borderRadius:10, padding:'9px 14px', fontSize:13, fontWeight:600, color:C.sub, cursor:'pointer' }}>
          <RefreshCw size={13} strokeWidth={1.8} />Refresh
        </button>
      </div>

      {/* Stats KPI cards */}
      {stats && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:14, marginBottom:16 }}>
            {[
              { label:'Total Comparisons', value:fmt(stats.totalComparisons),  color:C.blue },
              { label:'Total Mismatches',  value:fmt(stats.totalMismatches),   color:C.red  },
              { label:'Avg Confidence',    value:stats.avgConfidence!=null?`${Number(stats.avgConfidence).toFixed(1)}%`:'—', color:C.gold },
            ].map((kpi,i)=>(
              <div key={i} style={{ padding:'14px 16px', borderRadius:14, background:'rgba(10,18,32,0.85)', border:`1px solid rgba(30,58,95,0.45)` }}>
                <div style={{ fontSize:9, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>{kpi.label}</div>
                <div style={{ fontSize:24, fontWeight:800, color:kpi.color, letterSpacing:'-0.03em' }}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Match accuracy bars */}
          <div style={{ ...cardStyle, padding:'20px 22px', marginBottom:20 }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:18, display:'flex', alignItems:'center', gap:8 }}>
              <Zap size={14} color={C.muted} strokeWidth={1.8} />Match Accuracy vs Production Engine
            </div>
            <PctBar label="HS Code Match"    pct={stats.hsMatchPct}      color={stats.hsMatchPct>=80?C.green:stats.hsMatchPct>=60?C.gold:C.red}  comparable={stats.hsComparable} />
            <PctBar label="Duty Rate Match"  pct={stats.dutyMatchPct}    color={stats.dutyMatchPct>=80?C.green:stats.dutyMatchPct>=60?C.gold:C.red} comparable={stats.dutyComparable} />
            <PctBar label="CBCA Match"       pct={stats.cbcaMatchPct}    color={stats.cbcaMatchPct>=80?C.green:stats.cbcaMatchPct>=60?C.gold:C.red} comparable={stats.cbcaComparable} />
            <PctBar label="Licence Match"    pct={stats.licenceMatchPct} color={stats.licenceMatchPct>=80?C.green:stats.licenceMatchPct>=60?C.gold:C.red} comparable={stats.licenceComparable} />
          </div>
        </>
      )}

      {/* Report summary — top HS mismatches */}
      {report?.topHsMismatches?.length > 0 && (
        <div style={{ ...cardStyle, marginBottom:20 }}>
          <div style={{ padding:'14px 20px', borderBottom:`1px solid rgba(30,58,95,0.35)`, display:'flex', alignItems:'center', gap:8 }}>
            <Hash size={14} color={C.muted} strokeWidth={1.8} />
            <span style={{ fontSize:13, fontWeight:700, color:C.text }}>Top HS Code Mismatches</span>
          </div>
          <div style={{ padding:'14px 20px' }}>
            {report.topHsMismatches.map((r,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 0', borderBottom:i<report.topHsMismatches.length-1?`1px solid rgba(30,58,95,0.15)`:'none' }}>
                <div style={{ width:22, height:22, borderRadius:6, background:'rgba(30,58,95,0.5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:C.muted, flexShrink:0 }}>{i+1}</div>
                <span style={{ fontSize:12, fontFamily:'monospace', color:C.blue, minWidth:72 }}>{r.current_hs||'—'}</span>
                <span style={{ fontSize:11, color:C.dim }}>→</span>
                <span style={{ fontSize:12, fontFamily:'monospace', color:C.gold, minWidth:72 }}>{r.new_hs||'—'}</span>
                <div style={{ flex:1, height:4, borderRadius:2, background:'rgba(255,255,255,0.05)' }}>
                  <div style={{ height:'100%', borderRadius:2, width:`${Math.min(100,(r.occurrences/report.topHsMismatches[0].occurrences)*100)}%`, background:`linear-gradient(to right,${C.red}66,${C.red})` }} />
                </div>
                <span style={{ fontSize:11, fontWeight:700, color:C.red, minWidth:28, textAlign:'right', flexShrink:0 }}>{r.occurrences}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confidence analysis */}
      {report?.confidenceAnalysis && (report.confidenceAnalysis.avgWhenHsCorrect || report.confidenceAnalysis.avgWhenHsWrong) && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
          <div style={{ padding:'16px 20px', borderRadius:14, background:'rgba(74,222,128,0.06)', border:`1px solid rgba(74,222,128,0.2)` }}>
            <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5, display:'flex', alignItems:'center', gap:5 }}>
              <CheckCircle size={10} color={C.green} strokeWidth={2} />Avg Confidence When HS Correct
            </div>
            <div style={{ fontSize:26, fontWeight:800, color:C.green }}>{report.confidenceAnalysis.avgWhenHsCorrect?.toFixed(1)||'—'}%</div>
          </div>
          <div style={{ padding:'16px 20px', borderRadius:14, background:'rgba(248,113,113,0.06)', border:`1px solid rgba(248,113,113,0.2)` }}>
            <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5, display:'flex', alignItems:'center', gap:5 }}>
              <XCircle size={10} color={C.red} strokeWidth={2} />Avg Confidence When HS Wrong
            </div>
            <div style={{ fontSize:26, fontWeight:800, color:C.red }}>{report.confidenceAnalysis.avgWhenHsWrong?.toFixed(1)||'—'}%</div>
          </div>
        </div>
      )}

      {/* Mismatch filter tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' }}>
        {FIELD_TABS.map(tab=>(
          <button key={tab.value} onClick={()=>{ setField(tab.value); setPage(1) }} style={{ padding:'6px 13px', borderRadius:9, fontSize:12, fontWeight:600, border:`1px solid ${field===tab.value?'rgba(233,186,76,0.35)':'rgba(30,58,95,0.4)'}`, cursor:'pointer', background:field===tab.value?'rgba(233,186,76,0.1)':'rgba(6,9,15,0.5)', color:field===tab.value?C.gold:C.sub, transition:'all .15s' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mismatch table */}
      {loading ? <Spinner /> : (
        <>
          <div style={{ ...cardStyle, overflowX:'auto' }}>
            <table style={tbl}>
              <thead>
                <tr>
                  <th style={th}>Description</th>
                  <th style={th}>Existing HS</th>
                  <th style={th}>New HS</th>
                  <th style={th}>HS</th>
                  <th style={th}>Duty Δ</th>
                  <th style={th}>Duty</th>
                  <th style={th}>CBCA</th>
                  <th style={th}>Licence</th>
                  <th style={th}>Conf</th>
                  <th style={th}>Date</th>
                  <th style={th}>Detail</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={11} style={{ ...td, textAlign:'center', padding:40, color:C.dim }}>No mismatches found</td></tr>
                ) : items.map((item,i) => {
                  const dutyDelta = item.current_duty != null && item.new_duty != null
                    ? Math.abs(Number(item.current_duty) - Number(item.new_duty))
                    : null
                  return (
                    <tr key={item.id} style={{ transition:'background .1s' }}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(233,186,76,0.02)'}
                      onMouseLeave={e=>e.currentTarget.style.background=''}
                    >
                      <td style={{ ...td, maxWidth:200 }}>
                        <div style={{ fontSize:11, color:C.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.description}</div>
                      </td>
                      <td style={{ ...td, fontFamily:'monospace', fontSize:11, color:C.blue }}>{item.current_hs||'—'}</td>
                      <td style={{ ...td, fontFamily:'monospace', fontSize:11, color:C.gold }}>{item.new_hs||'—'}</td>
                      <td style={td}><MatchPill v={item.hs_match} /></td>
                      <td style={{ ...td, fontSize:11, color:dutyDelta?C.red:C.dim }}>
                        {dutyDelta != null ? `${dutyDelta.toFixed(1)}%` : '—'}
                      </td>
                      <td style={td}><MatchPill v={item.duty_match} /></td>
                      <td style={td}><MatchPill v={item.cbca_match} /></td>
                      <td style={td}><MatchPill v={item.licence_match} /></td>
                      <td style={{ ...td, fontSize:11, color:item.confidence>=80?C.green:item.confidence>=60?C.gold:C.red }}>
                        {item.confidence != null ? `${Number(item.confidence).toFixed(0)}%` : '—'}
                      </td>
                      <td style={{ ...td, fontSize:10, color:C.dim, whiteSpace:'nowrap' }}>
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td style={td}>
                        <button onClick={()=>setDetail(item)} style={{ background:'rgba(96,165,250,0.08)', border:'1px solid rgba(96,165,250,0.28)', borderRadius:7, padding:'4px 10px', fontSize:11, fontWeight:700, color:C.blue, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:4 }}>
                          <Eye size={10} strokeWidth={2} />View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:8, marginTop:18 }}>
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{ background:'rgba(10,18,32,0.8)', border:`1px solid ${C.border}`, borderRadius:8, padding:'7px 14px', fontSize:12, fontWeight:600, color:C.sub, cursor:'pointer', opacity:page===1?0.4:1 }}>← Prev</button>
              <span style={{ color:C.dim, fontSize:12 }}>Page {page} of {totalPages} · {fmt(total)} mismatches</span>
              <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} style={{ background:'rgba(10,18,32,0.8)', border:`1px solid ${C.border}`, borderRadius:8, padding:'7px 14px', fontSize:12, fontWeight:600, color:C.sub, cursor:'pointer', opacity:page===totalPages?0.4:1 }}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* Detail modal */}
      {detail && <ComparisonModal item={detail} onClose={()=>setDetail(null)} />}
    </div>
  )
}
