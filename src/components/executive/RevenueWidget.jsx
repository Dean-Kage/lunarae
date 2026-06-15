import { DollarSign, TrendingUp, CheckCircle, XCircle, CreditCard } from 'lucide-react'

/* ── Design primitives ───────────────────────────────────────── */
const C = { gold:'#e9ba4c', green:'#4ade80', red:'#f87171', blue:'#60a5fa', sub:'#8fa3bd', muted:'#45607a', dim:'#2a3d52', text:'#eef2f7', border:'rgba(30,58,95,0.55)' }
const cardStyle = { background:'rgba(10,18,32,0.85)', border:`1px solid ${C.border}`, borderRadius:16, overflow:'hidden' }

function fmt(n, dec=0) { return Number(n||0).toLocaleString(undefined,{minimumFractionDigits:dec,maximumFractionDigits:dec}); }
function fmtMoney(n)   { return `$${fmt(n)}`; }

function KpiRow({ items }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(${items.length},1fr)`, gap:1, borderBottom:`1px solid rgba(30,58,95,0.35)` }}>
      {items.map((item, i) => (
        <div key={i} style={{ padding:'18px 20px', borderRight:i<items.length-1?`1px solid rgba(30,58,95,0.3)`:'none', textAlign:'center' }}>
          <div style={{ fontSize:22, fontWeight:800, color:item.color||C.text, letterSpacing:'-0.03em', lineHeight:1, marginBottom:4 }}>{item.value}</div>
          <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em' }}>{item.label}</div>
        </div>
      ))}
    </div>
  )
}

function MiniBar({ data, xKey='date', yKey='count', color=C.gold, height=80 }) {
  if (!data?.length) return <div style={{ height, display:'flex',alignItems:'center',justifyContent:'center',color:C.dim,fontSize:12 }}>No data</div>
  const max = Math.max(...data.map(d=>Number(d[yKey])||0), 1)
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:2, height, padding:'0 4px' }}>
      {data.map((d,i) => (
        <div key={i} title={`${d[xKey]}: ${fmtMoney(d[yKey])}`}
          style={{ flex:'1 1 0', minWidth:3, maxWidth:20, borderRadius:'2px 2px 0 0',
            background:`linear-gradient(to top,${color}cc,${color}77)`,
            height:`${Math.max(3,(Number(d[yKey])||0)/max*height)}px`,
            opacity:.82, cursor:'default', transition:'opacity .15s' }}
          onMouseEnter={e=>e.currentTarget.style.opacity='1'}
          onMouseLeave={e=>e.currentTarget.style.opacity='.82'}
        />
      ))}
    </div>
  )
}

function Badge({ label, color }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 9px', borderRadius:20, fontSize:11, fontWeight:700, background:color+'1e', color, border:`1px solid ${color}40`, whiteSpace:'nowrap' }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:color }} />{label}
    </span>
  )
}

/* ── Revenue Widget ──────────────────────────────────────────── */
export default function RevenueWidget({ data }) {
  if (!data) return null
  const { monthly_revenue=0, annual_projection=0, ytd_revenue=0, total_revenue=0,
          successful_payments=0, failed_payments=0, success_rate=0,
          trend=[], by_method=[], by_plan=[] } = data

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={{ padding:'16px 22px 12px', borderBottom:`1px solid rgba(30,58,95,0.35)`, display:'flex', alignItems:'center', gap:9 }}>
        <DollarSign size={15} color={C.muted} strokeWidth={1.8} />
        <span style={{ fontSize:14, fontWeight:700, color:C.text }}>Revenue</span>
        <Badge label={`${success_rate}% success rate`} color={success_rate>=80?C.green:success_rate>=60?C.gold:C.red} />
      </div>

      {/* KPIs */}
      <KpiRow items={[
        { label:'Monthly Revenue',    value:fmtMoney(monthly_revenue),   color:C.gold  },
        { label:'Annual Projection',  value:fmtMoney(annual_projection), color:C.green },
        { label:'YTD Revenue',        value:fmtMoney(ytd_revenue),       color:C.blue  },
      ]} />

      {/* Payment stats */}
      <div style={{ display:'flex', gap:16, padding:'14px 20px', borderBottom:`1px solid rgba(30,58,95,0.25)` }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <CheckCircle size={13} color={C.green} strokeWidth={2} />
          <span style={{ fontSize:12, color:C.sub }}>{fmt(successful_payments)} successful</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <XCircle size={13} color={C.red} strokeWidth={2} />
          <span style={{ fontSize:12, color:C.sub }}>{fmt(failed_payments)} failed</span>
        </div>
      </div>

      {/* 30-day trend chart */}
      <div style={{ padding:'16px 20px', borderBottom:`1px solid rgba(30,58,95,0.25)` }}>
        <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Daily Revenue — 30 Days</div>
        <MiniBar data={trend} yKey="count" color={C.gold} height={80} />
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:C.dim, marginTop:5 }}>
          <span>{trend[0]?.date?.slice(5)}</span>
          <span>{trend[trend.length-1]?.date?.slice(5)}</span>
        </div>
      </div>

      {/* By plan + method */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
        {/* By plan */}
        <div style={{ padding:'14px 18px', borderRight:`1px solid rgba(30,58,95,0.25)` }}>
          <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>By Plan</div>
          {by_plan.length === 0 ? <div style={{ fontSize:12, color:C.dim }}>No data</div> : by_plan.slice(0,5).map((r,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <span style={{ fontSize:11, color:C.sub, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'65%' }}>{r.plan_name}</span>
              <span style={{ fontSize:12, fontWeight:700, color:C.gold }}>{fmtMoney(r.revenue)}</span>
            </div>
          ))}
        </div>

        {/* By method */}
        <div style={{ padding:'14px 18px' }}>
          <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>By Method</div>
          {by_method.length === 0 ? <div style={{ fontSize:12, color:C.dim }}>No data</div> : by_method.slice(0,5).map((r,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                <CreditCard size={11} color={C.muted} strokeWidth={1.8} />
                <span style={{ fontSize:11, color:C.sub }}>{r.payment_method || 'Other'}</span>
              </div>
              <span style={{ fontSize:12, fontWeight:700, color:C.text }}>{fmtMoney(r.revenue)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* All-time total */}
      <div style={{ padding:'10px 20px', background:'rgba(6,9,15,0.3)', borderTop:`1px solid rgba(30,58,95,0.25)`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:11, color:C.muted }}>All-time total revenue</span>
        <span style={{ fontSize:14, fontWeight:800, color:C.gold }}>{fmtMoney(total_revenue)}</span>
      </div>
    </div>
  )
}
