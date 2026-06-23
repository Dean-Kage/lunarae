import { Shield, Hash, AlertTriangle, FileCheck, BarChart2 } from 'lucide-react'

const C = { gold:'#e9ba4c', green:'#4ade80', red:'#f87171', blue:'#60a5fa', purple:'#a78bfa', orange:'#f97316', sub:'#8fa3bd', muted:'#45607a', dim:'#2a3d52', text:'#eef2f7', border:'rgba(30,58,95,0.55)' }
const cardStyle = { background:'rgba(10,18,32,0.85)', border:`1px solid ${C.border}`, borderRadius:16, overflow:'hidden' }

function fmt(n){ return Number(n||0).toLocaleString() }

function PctBar({ label, pct, color }) {
  const p = Math.min(100, Math.max(0, Number(pct)||0))
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
        <span style={{ fontSize:12, color:C.sub }}>{label}</span>
        <span style={{ fontSize:13, fontWeight:800, color, letterSpacing:'-0.02em' }}>{p.toFixed(1)}%</span>
      </div>
      <div style={{ height:6, borderRadius:3, background:'rgba(255,255,255,0.06)' }}>
        <div style={{ height:'100%', borderRadius:3, width:`${p}%`, background:`linear-gradient(to right,${color}88,${color})`, transition:'width .5s' }} />
      </div>
    </div>
  )
}

function StatChip({ label, value, color }) {
  return (
    <div style={{ padding:'10px 14px', borderRadius:10, background:color+'10', border:`1px solid ${color}25`, textAlign:'center' }}>
      <div style={{ fontSize:18, fontWeight:800, color, letterSpacing:'-0.03em', lineHeight:1, marginBottom:3 }}>{value}</div>
      <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.07em' }}>{label}</div>
    </div>
  )
}

export default function CustomsWidget({ data }) {
  if (!data) return null
  const { reviews={}, shadow={}, top_hs_codes=[], cbca_triggers=0, licence_requests=0, recent_imports=[] } = data

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={{ padding:'16px 22px 12px', borderBottom:`1px solid rgba(30,58,95,0.35)`, display:'flex', alignItems:'center', gap:9 }}>
        <Shield size={15} color={C.muted} strokeWidth={1.8} />
        <span style={{ fontSize:14, fontWeight:700, color:C.text }}>Customs Intelligence</span>
      </div>

      {/* Classification stats */}
      <div style={{ padding:'16px 20px', borderBottom:`1px solid rgba(30,58,95,0.25)` }}>
        <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>Classification Reviews</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(90px,1fr))', gap:8, marginBottom:12 }}>
          <StatChip label="Total"        value={fmt(reviews.total)}        color={C.blue}   />
          <StatChip label="Auto Apprvd"  value={fmt(reviews.auto_approved)} color={C.green}  />
          <StatChip label="Pending"      value={fmt(reviews.pending)}      color={C.orange} />
          <StatChip label="Rejected"     value={fmt(reviews.rejected)}     color={C.red}    />
        </div>
        {reviews.accuracy != null && (
          <PctBar label="Classification Accuracy" pct={reviews.accuracy} color={reviews.accuracy>=85?C.green:reviews.accuracy>=70?C.gold:C.red} />
        )}
      </div>

      {/* Shadow mode accuracy */}
      {shadow.total > 0 && (
        <div style={{ padding:'16px 20px', borderBottom:`1px solid rgba(30,58,95,0.25)` }}>
          <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Shadow Mode Accuracy</div>
          <div style={{ fontSize:10, color:C.dim, marginBottom:12 }}>{fmt(shadow.total)} comparisons</div>
          <PctBar label="HS Code Match"  pct={shadow.hs_match_pct}   color={shadow.hs_match_pct>=85?C.green:C.gold}   />
          <PctBar label="Duty Match"     pct={shadow.duty_match_pct} color={shadow.duty_match_pct>=85?C.green:C.gold} />
          <PctBar label="CBCA Match"     pct={shadow.cbca_match_pct} color={shadow.cbca_match_pct>=85?C.green:C.gold} />
        </div>
      )}

      {/* CBCA + Licence */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', borderBottom:`1px solid rgba(30,58,95,0.25)` }}>
        <div style={{ padding:'14px 18px', borderRight:`1px solid rgba(30,58,95,0.22)`, textAlign:'center' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, marginBottom:6 }}>
            <AlertTriangle size={12} color={C.orange} strokeWidth={2} />
            <span style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.07em' }}>CBCA Triggers</span>
          </div>
          <div style={{ fontSize:26, fontWeight:800, color:C.orange, letterSpacing:'-0.03em', lineHeight:1 }}>{fmt(cbca_triggers)}</div>
        </div>
        <div style={{ padding:'14px 18px', textAlign:'center' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, marginBottom:6 }}>
            <FileCheck size={12} color={C.purple} strokeWidth={2} />
            <span style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.07em' }}>Licence Requests</span>
          </div>
          <div style={{ fontSize:26, fontWeight:800, color:C.purple, letterSpacing:'-0.03em', lineHeight:1 }}>{fmt(licence_requests)}</div>
        </div>
      </div>

      {/* Top HS codes */}
      <div style={{ padding:'14px 20px', borderBottom:recent_imports.length?`1px solid rgba(30,58,95,0.25)`:'none' }}>
        <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
          <Hash size={10} color={C.muted} strokeWidth={2} />Top HS Codes
        </div>
        {top_hs_codes.length === 0
          ? <div style={{ fontSize:12, color:C.dim }}>No data</div>
          : (() => {
              const maxC = Math.max(...top_hs_codes.map(h=>h.count), 1)
              return top_hs_codes.slice(0,8).map((h,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
                  <span style={{ fontSize:11, fontFamily:'monospace', color:C.gold, minWidth:72 }}>{h.hs_code}</span>
                  <div style={{ flex:1, height:5, borderRadius:3, background:'rgba(255,255,255,0.06)' }}>
                    <div style={{ height:'100%', borderRadius:3, width:`${(h.count/maxC)*100}%`, background:`linear-gradient(to right,${C.gold}66,${C.gold})`, transition:'width .4s' }} />
                  </div>
                  <span style={{ fontSize:11, color:C.sub, minWidth:24, textAlign:'right' }}>{h.count}</span>
                </div>
              ))
            })()
        }
      </div>

      {/* Recent imports */}
      {recent_imports.length > 0 && (
        <div style={{ padding:'14px 20px' }}>
          <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
            <BarChart2 size={10} color={C.muted} strokeWidth={2} />Recent Imports
          </div>
          {recent_imports.slice(0,5).map((r,i)=>(
            <div key={i} style={{ fontSize:11, color:C.sub, padding:'5px 0', borderBottom:i<Math.min(recent_imports.length,5)-1?`1px solid rgba(30,58,95,0.15)`:'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {r.description}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
