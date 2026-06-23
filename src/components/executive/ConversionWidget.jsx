import { TrendingUp, UserCheck, Users, CheckCircle } from 'lucide-react'

const C = { gold:'#e9ba4c', green:'#4ade80', red:'#f87171', blue:'#60a5fa', purple:'#a78bfa', sub:'#8fa3bd', muted:'#45607a', dim:'#2a3d52', text:'#eef2f7', border:'rgba(30,58,95,0.55)' }
const cardStyle = { background:'rgba(10,18,32,0.85)', border:`1px solid ${C.border}`, borderRadius:16, overflow:'hidden' }

function fmt(n,dec=0){ return Number(n||0).toLocaleString(undefined,{minimumFractionDigits:dec,maximumFractionDigits:dec}) }

function GaugePct({ pct, color, size=80 }) {
  const p = Math.min(100, Math.max(0, Number(pct)||0))
  const r = (size/2)-6
  const circ = 2*Math.PI*r
  const dash = (p/100)*circ
  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={6} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transform:'rotate(-90deg)', transformOrigin:`${size/2}px ${size/2}px`, transition:'stroke-dasharray .6s ease' }}
        />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' }}>
        <span style={{ fontSize:15, fontWeight:800, color, letterSpacing:'-0.03em', lineHeight:1 }}>{fmt(p,1)}%</span>
      </div>
    </div>
  )
}

function FunnelStep({ label, value, pct, color, isLast }) {
  return (
    <div style={{ position:'relative' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0' }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:color, flexShrink:0, boxShadow:`0 0 6px ${color}66` }} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
            <span style={{ fontSize:12, color:C.sub }}>{label}</span>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              {pct != null && <span style={{ fontSize:11, color:C.dim }}>{fmt(pct,1)}%</span>}
              <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{fmt(value)}</span>
            </div>
          </div>
          <div style={{ height:4, borderRadius:2, background:'rgba(255,255,255,0.05)' }}>
            <div style={{ height:'100%', borderRadius:2, width:pct!=null?`${Math.min(100,pct)}%`:'100%', background:`linear-gradient(to right,${color}66,${color})`, transition:'width .5s' }} />
          </div>
        </div>
      </div>
      {!isLast && <div style={{ position:'absolute', left:2.5, top:26, width:1, height:14, background:'rgba(30,58,95,0.4)' }} />}
    </div>
  )
}

export default function ConversionWidget({ data }) {
  if (!data) return null
  const { total_companies=0, paid_companies=0, free_companies=0, conversion_rate=0,
          trial_to_paid_pct=0, converted=0, onboarding={} } = data
  const { total_started=0, completed=0, completion_rate=0, avg_mins_to_first_boe=0 } = onboarding

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={{ padding:'16px 22px 12px', borderBottom:`1px solid rgba(30,58,95,0.35)`, display:'flex', alignItems:'center', gap:9 }}>
        <TrendingUp size={15} color={C.muted} strokeWidth={1.8} />
        <span style={{ fontSize:14, fontWeight:700, color:C.text }}>Conversions</span>
      </div>

      {/* Conversion rate gauges */}
      <div style={{ padding:'20px', borderBottom:`1px solid rgba(30,58,95,0.25)`, display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
          <GaugePct pct={conversion_rate} color={conversion_rate>=30?C.green:conversion_rate>=15?C.gold:C.red} size={80} />
          <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.07em', textAlign:'center' }}>Conversion<br/>Rate</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
          <GaugePct pct={trial_to_paid_pct} color={trial_to_paid_pct>=40?C.green:trial_to_paid_pct>=20?C.gold:C.red} size={80} />
          <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.07em', textAlign:'center' }}>Trial-to-<br/>Paid</div>
        </div>
        <div style={{ flex:1, minWidth:120 }}>
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:2 }}>Converted</div>
            <div style={{ fontSize:22, fontWeight:800, color:C.green, letterSpacing:'-0.03em' }}>{fmt(converted)}</div>
          </div>
          <div>
            <div style={{ fontSize:11, color:C.muted, marginBottom:2 }}>Paid Companies</div>
            <div style={{ fontSize:22, fontWeight:800, color:C.gold, letterSpacing:'-0.03em' }}>{fmt(paid_companies)}</div>
          </div>
        </div>
      </div>

      {/* Company funnel */}
      <div style={{ padding:'16px 20px', borderBottom:`1px solid rgba(30,58,95,0.25)` }}>
        <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
          <Users size={10} color={C.muted} strokeWidth={2} />Company Funnel
        </div>
        <FunnelStep label="Total Companies" value={total_companies} pct={100}        color={C.blue}   />
        <FunnelStep label="Paid Companies"  value={paid_companies}  pct={total_companies?paid_companies/total_companies*100:0}  color={C.gold}   />
        <FunnelStep label="Free / Trial"    value={free_companies}  pct={total_companies?free_companies/total_companies*100:0}  color={C.purple} isLast />
      </div>

      {/* Onboarding funnel */}
      <div style={{ padding:'16px 20px' }}>
        <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
          <UserCheck size={10} color={C.muted} strokeWidth={2} />Onboarding Funnel
        </div>
        <FunnelStep label="Started Onboarding" value={total_started} pct={100}                                          color={C.blue} />
        <FunnelStep label="Completed"           value={completed}     pct={total_started?completed/total_started*100:0} color={C.green} isLast />

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:16 }}>
          <div style={{ padding:'10px 12px', borderRadius:9, background:'rgba(74,222,128,0.06)', border:`1px solid rgba(74,222,128,0.15)` }}>
            <div style={{ fontSize:10, color:C.muted, marginBottom:3, display:'flex', alignItems:'center', gap:4 }}>
              <CheckCircle size={9} color={C.green} strokeWidth={2} />Completion Rate
            </div>
            <div style={{ fontSize:18, fontWeight:800, color:C.green }}>{fmt(completion_rate,1)}%</div>
          </div>
          <div style={{ padding:'10px 12px', borderRadius:9, background:'rgba(96,165,250,0.06)', border:`1px solid rgba(96,165,250,0.15)` }}>
            <div style={{ fontSize:10, color:C.muted, marginBottom:3 }}>Avg to First BOE</div>
            <div style={{ fontSize:18, fontWeight:800, color:C.blue }}>
              {avg_mins_to_first_boe > 0 ? `${Math.round(avg_mins_to_first_boe)}m` : '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
