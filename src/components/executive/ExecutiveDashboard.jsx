import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, Download, RefreshCw, AlertTriangle, CheckCircle, ChevronDown } from 'lucide-react'
import RevenueWidget       from './RevenueWidget.jsx'
import SubscriptionWidget  from './SubscriptionWidget.jsx'
import CustomsWidget       from './CustomsWidget.jsx'
import ConversionWidget    from './ConversionWidget.jsx'
import CompanyGrowthWidget from './CompanyGrowthWidget.jsx'

/* ── primitives ──────────────────────────────────────────────── */
const C = { gold:'#e9ba4c', green:'#4ade80', red:'#f87171', blue:'#60a5fa', sub:'#8fa3bd', muted:'#45607a', dim:'#2a3d52', text:'#eef2f7', border:'rgba(30,58,95,0.55)' }

function useIsMobile(bp=900) {
  const [m, setM] = useState(()=>window.innerWidth < bp)
  useEffect(()=>{
    const h = ()=>setM(window.innerWidth < bp)
    window.addEventListener('resize', h, { passive:true })
    return ()=>window.removeEventListener('resize', h)
  }, [bp])
  return m
}

function authHdr() {
  const t = localStorage.getItem('lunarae_auth_token')
  return { 'Content-Type':'application/json', ...(t?{Authorization:`Bearer ${t}`}:{}) }
}

function Spinner() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'72px 24px', gap:16 }}>
      <div style={{ width:32, height:32, border:'2.5px solid rgba(30,58,95,0.4)', borderTopColor:C.gold, borderRadius:'50%', animation:'ei-spin .7s linear infinite' }} />
      <span style={{ fontSize:12, color:C.muted }}>Loading executive report…</span>
    </div>
  )
}

function ErrBox({ msg }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 18px', color:'#fca5a5', background:'rgba(248,113,113,0.07)', borderRadius:12, border:'1px solid rgba(248,113,113,0.18)', fontSize:13 }}>
      <AlertTriangle size={15} color={C.red} strokeWidth={2} style={{ flexShrink:0 }} />
      {msg}
    </div>
  )
}

/* ── Export button ───────────────────────────────────────────── */
function ExportButton() {
  const [open, setOpen]    = useState(false)
  const [busy, setBusy]    = useState(null)
  const [toast, setToast]  = useState(null)

  function showToast(msg, err=false) {
    setToast({ msg, err })
    setTimeout(()=>setToast(null), 3000)
  }

  async function doExport(fmt) {
    setOpen(false); setBusy(fmt)
    try {
      const res = await fetch(`/api/reporting/executive?format=${fmt}`, { headers:authHdr() })
      if (!res.ok) { const d=await res.json(); throw new Error(d.error||'Export failed') }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      a.download = `lunarae-executive-${new Date().toISOString().slice(0,10)}.${fmt}`
      document.body.appendChild(a); a.click()
      document.body.removeChild(a); URL.revokeObjectURL(url)
      showToast(`${fmt.toUpperCase()} exported`)
    } catch(e) { showToast(e.message, true) }
    finally { setBusy(null) }
  }

  const btnBase = { display:'inline-flex', alignItems:'center', gap:6, borderRadius:10, padding:'9px 15px', fontSize:13, fontWeight:600, cursor:'pointer', border:'none', fontFamily:'inherit', transition:'all .15s' }

  return (
    <div style={{ position:'relative' }}>
      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, background:toast.err?'rgba(90,20,20,0.97)':'rgba(16,60,30,0.97)', border:`1px solid ${toast.err?C.red:C.green}35`, borderRadius:12, padding:'12px 18px', fontSize:13, color:toast.err?'#fca5a5':'#86efac', fontWeight:600, boxShadow:'0 12px 40px rgba(0,0,0,0.55)', backdropFilter:'blur(16px)', display:'flex', alignItems:'center', gap:8 }}>
          {toast.err ? <AlertTriangle size={14}/> : <CheckCircle size={14}/>}
          {toast.msg}
        </div>
      )}
      <button
        onClick={()=>setOpen(o=>!o)}
        style={{ ...btnBase, background:'rgba(10,18,32,0.8)', border:`1px solid ${C.border}`, color:C.sub }}
        onMouseEnter={e=>{e.currentTarget.style.background='rgba(30,58,95,0.35)'; e.currentTarget.style.borderColor='rgba(30,58,95,0.8)'}}
        onMouseLeave={e=>{e.currentTarget.style.background='rgba(10,18,32,0.8)'; e.currentTarget.style.borderColor=C.border}}
      >
        <Download size={13} strokeWidth={1.8} />
        {busy ? `Exporting ${busy.toUpperCase()}…` : 'Export'}
        <ChevronDown size={12} style={{ transform:open?'rotate(180deg)':'none', transition:'transform .2s' }} />
      </button>

      {open && (
        <>
          <div style={{ position:'fixed', inset:0, zIndex:200 }} onClick={()=>setOpen(false)} />
          <div style={{ position:'absolute', top:'calc(100% + 6px)', right:0, zIndex:300, background:'rgba(8,14,26,0.98)', border:`1px solid ${C.border}`, borderRadius:12, padding:6, minWidth:140, boxShadow:'0 16px 40px rgba(0,0,0,0.6)', backdropFilter:'blur(16px)' }}>
            {['csv','json'].map(fmt=>(
              <button key={fmt} onClick={()=>doExport(fmt)} style={{ display:'block', width:'100%', textAlign:'left', padding:'9px 13px', borderRadius:8, fontSize:13, fontWeight:600, color:C.sub, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', transition:'all .12s' }}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(233,186,76,0.08)'; e.currentTarget.style.color=C.gold}}
                onMouseLeave={e=>{e.currentTarget.style.background='none'; e.currentTarget.style.color=C.sub}}
              >
                {fmt.toUpperCase()} Report
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ── KPI summary strip ───────────────────────────────────────── */
function KpiStrip({ data }) {
  if (!data) return null
  const rev   = data.revenue       || {}
  const sub   = data.subscriptions || {}
  const co    = data.companies     || {}
  const boes  = data.boes          || {}

  const chips = [
    { label:'Monthly Rev',       value:`$${Number(rev.monthly_revenue||0).toLocaleString()}`,    color:C.gold  },
    { label:'ARR',               value:`$${Number(sub.annual_arr||0).toLocaleString()}`,          color:C.green },
    { label:'Active Subs',       value:Number(sub.total_active||0).toLocaleString(),              color:C.blue  },
    { label:'Companies',         value:Number(co.total||0).toLocaleString(),                      color:C.sub   },
    { label:'BOEs This Month',   value:Number(boes.this_month||0).toLocaleString(),               color:C.gold  },
    { label:'Payment Success',   value:`${rev.success_rate||0}%`,                                 color:rev.success_rate>=80?C.green:rev.success_rate>=60?C.gold:C.red },
  ]

  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:24 }}>
      {chips.map((c,i)=>(
        <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'12px 18px', borderRadius:12, background:'rgba(10,18,32,0.85)', border:`1px solid rgba(30,58,95,0.45)`, minWidth:110, flex:'1 0 auto' }}>
          <div style={{ fontSize:20, fontWeight:800, color:c.color, letterSpacing:'-0.03em', lineHeight:1, marginBottom:4 }}>{c.value}</div>
          <div style={{ fontSize:9, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', textAlign:'center' }}>{c.label}</div>
        </div>
      ))}
    </div>
  )
}

/* ── Main Dashboard ──────────────────────────────────────────── */
export default function ExecutiveDashboard() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [err,     setErr]     = useState(null)
  const [lastUpd, setLastUpd] = useState(null)
  const isMobile = useIsMobile()

  const load = useCallback(async () => {
    setLoading(true); setErr(null)
    try {
      const res = await fetch('/api/reporting/executive', { headers:authHdr() })
      if (!res.ok) { const d=await res.json(); throw new Error(d.error||'Failed to load') }
      const d = await res.json()
      setData(d)
      setLastUpd(d.generated_at ? new Date(d.generated_at).toLocaleTimeString() : new Date().toLocaleTimeString())
    } catch(e) { setErr(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(()=>{ load() }, [load])

  const sH2 = { color:C.text, fontSize:22, fontWeight:800, margin:'0 0 4px', letterSpacing:'-0.02em' }

  return (
    <div>
      <style>{`@keyframes ei-spin { to { transform:rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={{ marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={sH2}>Executive Intelligence</h1>
          <p style={{ fontSize:13, color:C.muted, margin:0 }}>
            Platform-wide business metrics for executive review
            {lastUpd && <span style={{ marginLeft:10, color:C.dim }}>· Updated {lastUpd}</span>}
          </p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
          <button onClick={load} disabled={loading} style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(10,18,32,0.8)', border:`1px solid ${C.border}`, borderRadius:10, padding:'9px 15px', fontSize:13, fontWeight:600, color:C.sub, cursor:'pointer', fontFamily:'inherit', transition:'all .15s', opacity:loading?.6:1 }}
            onMouseEnter={e=>{if(!loading){e.currentTarget.style.background='rgba(30,58,95,0.35)'}}}
            onMouseLeave={e=>{e.currentTarget.style.background='rgba(10,18,32,0.8)'}}
          >
            <RefreshCw size={13} strokeWidth={1.8} style={{ animation:loading?'ei-spin .7s linear infinite':'none' }} />
            Refresh
          </button>
          <ExportButton />
        </div>
      </div>

      {/* Error */}
      {err && <ErrBox msg={err} />}

      {/* Loading */}
      {loading && <Spinner />}

      {/* Content */}
      {!loading && data && (
        <>
          {/* KPI strip */}
          <KpiStrip data={data} />

          {/* Row 1: Revenue + Subscriptions */}
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:20, marginBottom:20 }}>
            <RevenueWidget      data={data.revenue}       />
            <SubscriptionWidget data={data.subscriptions} />
          </div>

          {/* Row 2: Companies + BOEs (single widget) */}
          <div style={{ marginBottom:20 }}>
            <CompanyGrowthWidget companies={data.companies} boes={data.boes} />
          </div>

          {/* Row 3: Customs + Conversions */}
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:20 }}>
            <CustomsWidget    data={data.customs}     />
            <ConversionWidget data={data.conversions} />
          </div>
        </>
      )}
    </div>
  )
}
