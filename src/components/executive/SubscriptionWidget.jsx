import { Users, AlertTriangle, Clock } from 'lucide-react'

const C = { gold:'#e9ba4c', green:'#4ade80', red:'#f87171', blue:'#60a5fa', purple:'#a78bfa', sub:'#8fa3bd', muted:'#45607a', dim:'#2a3d52', text:'#eef2f7', border:'rgba(30,58,95,0.55)' }
const cardStyle = { background:'rgba(10,18,32,0.85)', border:`1px solid ${C.border}`, borderRadius:16, overflow:'hidden' }

function fmt(n,dec=0){ return Number(n||0).toLocaleString(undefined,{minimumFractionDigits:dec,maximumFractionDigits:dec}) }
function fmtMoney(n){ return `$${fmt(n)}` }

const PLAN_COLORS = { enterprise:C.gold, professional:C.purple, starter:C.blue, free_trial:C.green, free:C.sub }
function planColor(name){ return PLAN_COLORS[String(name).toLowerCase().replace(/\s+/g,'_')] || C.sub }

function PlanBar({ plan_name, count, mrr, total }) {
  const pct = total ? Math.round((count/total)*100) : 0
  const color = planColor(plan_name)
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
        <span style={{ fontSize:12, color:C.text, fontWeight:600 }}>{plan_name}</span>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <span style={{ fontSize:11, color:C.sub }}>{fmt(count)} co.</span>
          <span style={{ fontSize:12, fontWeight:700, color:C.gold, minWidth:60, textAlign:'right' }}>{fmtMoney(mrr)}/mo</span>
        </div>
      </div>
      <div style={{ height:5, borderRadius:3, background:'rgba(255,255,255,0.06)' }}>
        <div style={{ height:'100%', borderRadius:3, width:`${pct}%`, background:`linear-gradient(to right,${color}99,${color})`, transition:'width .4s' }} />
      </div>
    </div>
  )
}

export default function SubscriptionWidget({ data }) {
  if (!data) return null
  const { total_active=0, paid_count=0, free_trial_count=0, mrr=0, annual_arr=0, by_plan=[], expiring=[] } = data

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={{ padding:'16px 22px 12px', borderBottom:`1px solid rgba(30,58,95,0.35)`, display:'flex', alignItems:'center', gap:9 }}>
        <Users size={15} color={C.muted} strokeWidth={1.8} />
        <span style={{ fontSize:14, fontWeight:700, color:C.text }}>Subscriptions</span>
        {expiring.length > 0 && (
          <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:700, background:C.red+'1e', color:C.red, border:`1px solid ${C.red}40` }}>
            <AlertTriangle size={10} strokeWidth={2} /> {expiring.length} expiring
          </span>
        )}
      </div>

      {/* Top KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:1, borderBottom:`1px solid rgba(30,58,95,0.35)` }}>
        {[
          { label:'Active', value:fmt(total_active), color:C.text },
          { label:'Paid',   value:fmt(paid_count),   color:C.gold },
          { label:'Trials', value:fmt(free_trial_count), color:C.green },
          { label:'MRR',    value:fmtMoney(mrr),     color:C.blue },
        ].map((kpi,i,arr)=>(
          <div key={i} style={{ padding:'14px 12px', textAlign:'center', borderRight:i<arr.length-1?`1px solid rgba(30,58,95,0.28)`:'none' }}>
            <div style={{ fontSize:18, fontWeight:800, color:kpi.color, letterSpacing:'-0.03em', lineHeight:1, marginBottom:3 }}>{kpi.value}</div>
            <div style={{ fontSize:9, color:C.muted, textTransform:'uppercase', letterSpacing:'0.07em' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Annual ARR */}
      <div style={{ padding:'12px 20px', background:'rgba(233,186,76,0.06)', borderBottom:`1px solid rgba(30,58,95,0.25)`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:11, color:C.muted }}>Annual Recurring Revenue (ARR)</span>
        <span style={{ fontSize:16, fontWeight:800, color:C.gold }}>{fmtMoney(annual_arr)}</span>
      </div>

      {/* By plan */}
      <div style={{ padding:'16px 20px', borderBottom:`1px solid rgba(30,58,95,0.25)` }}>
        <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>By Plan</div>
        {by_plan.length === 0
          ? <div style={{ fontSize:12, color:C.dim }}>No subscription data</div>
          : by_plan.map((p,i)=>(
              <PlanBar key={i} plan_name={p.plan_name} count={p.count} mrr={p.mrr} total={total_active} />
            ))
        }
      </div>

      {/* Expiring soon */}
      <div style={{ padding:'14px 20px' }}>
        <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
          <Clock size={10} color={C.muted} strokeWidth={2} />Expiring within 7 Days
        </div>
        {expiring.length === 0
          ? <div style={{ fontSize:12, color:C.dim }}>None expiring</div>
          : expiring.slice(0,5).map((e,i)=>(
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, padding:'8px 10px', borderRadius:8, background:'rgba(248,113,113,0.05)', border:`1px solid rgba(248,113,113,0.15)` }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:C.text }}>{e.company_name}</div>
                  <div style={{ fontSize:10, color:C.sub }}>{e.plan_name}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:11, color:C.red, fontWeight:700 }}>{e.days_left}d left</div>
                  <div style={{ fontSize:10, color:C.dim }}>{e.expires_at?.slice?.(0,10)}</div>
                </div>
              </div>
            ))
        }
      </div>
    </div>
  )
}
