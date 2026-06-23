import { Building2, FileText, TrendingUp } from 'lucide-react'

const C = { gold:'#e9ba4c', green:'#4ade80', blue:'#60a5fa', purple:'#a78bfa', sub:'#8fa3bd', muted:'#45607a', dim:'#2a3d52', text:'#eef2f7', border:'rgba(30,58,95,0.55)' }
const cardStyle = { background:'rgba(10,18,32,0.85)', border:`1px solid ${C.border}`, borderRadius:16, overflow:'hidden' }

function fmt(n){ return Number(n||0).toLocaleString() }

function MiniBar({ data, xKey='month', yKey='count', color=C.blue, height=60 }) {
  if (!data?.length) return <div style={{ height, display:'flex',alignItems:'center',justifyContent:'center',color:C.dim,fontSize:11 }}>No data</div>
  const max = Math.max(...data.map(d=>Number(d[yKey])||0), 1)
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:2, height, padding:'0 2px' }}>
      {data.map((d,i)=>(
        <div key={i}
          title={`${d[xKey]}: ${d[yKey]}`}
          style={{ flex:'1 1 0', minWidth:4, maxWidth:28, borderRadius:'2px 2px 0 0',
            background:`linear-gradient(to top,${color}cc,${color}66)`,
            height:`${Math.max(3,(Number(d[yKey])||0)/max*height)}px`,
            opacity:.8, cursor:'default', transition:'opacity .15s' }}
          onMouseEnter={e=>e.currentTarget.style.opacity='1'}
          onMouseLeave={e=>e.currentTarget.style.opacity='.8'}
        />
      ))}
    </div>
  )
}

export default function CompanyGrowthWidget({ companies, boes }) {
  const c = companies || {}
  const b = boes || {}

  const { total=0, new_30d=0, new_7d=0, monthly_trend=[], most_active=[] } = c
  const { total:boeTotal=0, this_month:boeMonth=0, today:boeToday=0, avg_per_company=0,
          total_value=0, daily_trend=[], most_active:boeMostActive=[] } = b

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={{ padding:'16px 22px 12px', borderBottom:`1px solid rgba(30,58,95,0.35)`, display:'flex', alignItems:'center', gap:9 }}>
        <Building2 size={15} color={C.muted} strokeWidth={1.8} />
        <span style={{ fontSize:14, fontWeight:700, color:C.text }}>Companies & BOEs</span>
      </div>

      {/* Company KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', borderBottom:`1px solid rgba(30,58,95,0.35)`, gap:1 }}>
        {[
          { label:'Total',    value:fmt(total),   color:C.text },
          { label:'New 30d',  value:fmt(new_30d), color:C.green },
          { label:'New 7d',   value:fmt(new_7d),  color:C.blue },
        ].map((kpi,i,arr)=>(
          <div key={i} style={{ padding:'14px 12px', textAlign:'center', borderRight:i<arr.length-1?`1px solid rgba(30,58,95,0.28)`:'none' }}>
            <div style={{ fontSize:20, fontWeight:800, color:kpi.color, letterSpacing:'-0.03em', lineHeight:1, marginBottom:3 }}>{kpi.value}</div>
            <div style={{ fontSize:9, color:C.muted, textTransform:'uppercase', letterSpacing:'0.07em' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Company growth chart */}
      <div style={{ padding:'14px 20px', borderBottom:`1px solid rgba(30,58,95,0.25)` }}>
        <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Company Growth — 12 Months</div>
        <MiniBar data={monthly_trend} xKey="month" yKey="count" color={C.blue} height={60} />
        {monthly_trend.length > 0 && (
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:C.dim, marginTop:4 }}>
            <span>{monthly_trend[0]?.month?.slice(0,7)}</span>
            <span>{monthly_trend[monthly_trend.length-1]?.month?.slice(0,7)}</span>
          </div>
        )}
      </div>

      {/* BOE KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', borderBottom:`1px solid rgba(30,58,95,0.35)`, gap:1 }}>
        {[
          { label:'All Time',    value:fmt(boeTotal),           color:C.gold },
          { label:'This Month',  value:fmt(boeMonth),           color:C.green },
          { label:'Today',       value:fmt(boeToday),           color:C.blue },
          { label:'Avg/Co',      value:fmt(avg_per_company,1),  color:C.purple },
        ].map((kpi,i,arr)=>(
          <div key={i} style={{ padding:'12px 8px', textAlign:'center', borderRight:i<arr.length-1?`1px solid rgba(30,58,95,0.28)`:'none' }}>
            <div style={{ fontSize:17, fontWeight:800, color:kpi.color, letterSpacing:'-0.03em', lineHeight:1, marginBottom:3 }}>{kpi.value}</div>
            <div style={{ fontSize:9, color:C.muted, textTransform:'uppercase', letterSpacing:'0.06em' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* BOE trend chart */}
      <div style={{ padding:'14px 20px', borderBottom:`1px solid rgba(30,58,95,0.25)` }}>
        <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8, display:'flex', justifyContent:'space-between' }}>
          <span>BOEs — 30 Days</span>
          <span style={{ color:C.gold, fontVariantNumeric:'tabular-nums' }}>Total Value ${Number(total_value||0).toLocaleString(undefined,{maximumFractionDigits:0})}</span>
        </div>
        <MiniBar data={daily_trend} xKey="date" yKey="count" color={C.gold} height={60} />
        {daily_trend.length > 0 && (
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:C.dim, marginTop:4 }}>
            <span>{daily_trend[0]?.date?.slice(5)}</span>
            <span>{daily_trend[daily_trend.length-1]?.date?.slice(5)}</span>
          </div>
        )}
      </div>

      {/* Most active companies */}
      <div style={{ padding:'14px 20px' }}>
        <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
          <TrendingUp size={10} color={C.muted} strokeWidth={2} />Most Active Companies (30d)
        </div>
        {most_active.length === 0
          ? <div style={{ fontSize:12, color:C.dim }}>No data</div>
          : (() => {
              const maxC = Math.max(...most_active.map(m=>m.boe_count), 1)
              return most_active.slice(0,8).map((m,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
                  <div style={{ width:18, height:18, borderRadius:5, background:'rgba(30,58,95,0.5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:C.muted, flexShrink:0 }}>{i+1}</div>
                  <span style={{ fontSize:11, color:C.sub, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{m.company_name}</span>
                  <div style={{ width:60, height:4, borderRadius:2, background:'rgba(255,255,255,0.05)', flexShrink:0 }}>
                    <div style={{ height:'100%', borderRadius:2, width:`${(m.boe_count/maxC)*100}%`, background:`linear-gradient(to right,${C.gold}66,${C.gold})` }} />
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, color:C.gold, minWidth:24, textAlign:'right', flexShrink:0 }}>{m.boe_count}</span>
                </div>
              ))
            })()
        }
      </div>
    </div>
  )
}
