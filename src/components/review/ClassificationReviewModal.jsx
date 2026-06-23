import { useState, useEffect } from 'react'

/* ── design tokens ───────────────────────────────────────────── */
const C = {
  bg:'rgba(8,13,24,0.98)', card:'rgba(10,18,32,0.92)', border:'rgba(30,58,95,0.7)',
  gold:'#e9ba4c', green:'#4ade80', red:'#f87171', blue:'#60a5fa', purple:'#a78bfa',
  text:'#eef2f7', sub:'#8fa3bd', muted:'#45607a', dim:'#2a3d52',
}

function confMeta(pct) {
  if (pct >= 95) return { color:C.green,  label:'Auto Approved',        icon:'✓' }
  if (pct >= 80) return { color:C.gold,   label:'Review Recommended',   icon:'⚠' }
  return           { color:C.red,    label:'Needs Human Review',   icon:'!' }
}

function authHdr() {
  const t = localStorage.getItem('lunarae_auth_token')
  return { 'Content-Type':'application/json', ...(t?{Authorization:`Bearer ${t}`}:{}) }
}

function Spinner() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, padding:'36px 0' }}>
      <div style={{ width:28, height:28, border:`2px solid rgba(30,58,95,0.4)`, borderTopColor:C.gold, borderRadius:'50%', animation:'crm-spin .7s linear infinite' }} />
      <span style={{ fontSize:12, color:C.muted }}>Classifying…</span>
    </div>
  )
}

/* ── Prediction row ──────────────────────────────────────────── */
function PredRow({ pred, selected, onSelect }) {
  const hs   = pred.hs_code || pred.suggestedHs || ''
  const desc = pred.description || pred.desc || ''
  const conf = Number(pred.confidence || 0)
  const { color } = confMeta(conf)
  const active = selected === hs
  return (
    <div
      onClick={() => onSelect(hs)}
      style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:10, border:`1px solid ${active?C.blue+'55':'rgba(30,58,95,0.3)'}`, background:active?'rgba(96,165,250,0.07)':'rgba(6,9,15,0.4)', cursor:'pointer', marginBottom:6, transition:'all .15s' }}
      onMouseEnter={e=>{ if(!active) e.currentTarget.style.background='rgba(30,58,95,0.25)' }}
      onMouseLeave={e=>{ if(!active) e.currentTarget.style.background='rgba(6,9,15,0.4)' }}
    >
      <div style={{ width:20, height:20, borderRadius:6, border:`2px solid ${active?C.blue:C.dim}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'border-color .15s' }}>
        {active && <div style={{ width:10, height:10, borderRadius:3, background:C.blue }} />}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontFamily:'monospace', color:C.text, fontWeight:600 }}>{hs}</div>
        <div style={{ fontSize:11, color:C.sub, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{desc}</div>
      </div>
      <span style={{ fontSize:11, fontWeight:700, color, minWidth:36, textAlign:'right' }}>{conf.toFixed(0)}%</span>
    </div>
  )
}

/* ── Main Modal ──────────────────────────────────────────────── */
export default function ClassificationReviewModal({ item, userFullName, onClose }) {
  const [loading,    setLoading]    = useState(true)
  const [result,     setResult]     = useState(null)
  const [err,        setErr]        = useState(null)
  const [selected,   setSelected]   = useState(null)
  const [customHs,   setCustomHs]   = useState('')
  const [useCustom,  setUseCustom]  = useState(false)
  const [notes,      setNotes]      = useState('')
  const [submitting, setSubmitting] = useState(null)
  const [done,       setDone]       = useState(null)

  useEffect(() => {
    fetch('/api/customs/review/classify', {
      method:'POST', headers:authHdr(),
      body:JSON.stringify({ description: item.description }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setResult(d.data)
          setSelected(d.data.suggested_hs || d.data.suggestedHs || item.hs_code)
        } else {
          setErr(d.error || 'Classification failed')
        }
      })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false))
  }, [item.description])

  async function submit(action) {
    const id = result?.id
    if (!id) return
    const approvedHs = useCustom ? customHs.trim() : (selected || result?.suggested_hs || item.hs_code)
    if (action === 'approve' && !approvedHs) { setErr('Select or enter an HS code'); return }
    setSubmitting(action)
    try {
      const endpoint = action === 'approve' ? '/api/customs/review/approve' : '/api/customs/review/reject'
      const body = action === 'approve'
        ? { id, approvedHs, reviewedBy: userFullName || 'User', notes }
        : { id, reviewedBy: userFullName || 'User', notes }
      const res = await fetch(endpoint, { method:'POST', headers:authHdr(), body:JSON.stringify(body) })
      const d = await res.json()
      if (d.success) setDone({ action, hs: approvedHs })
      else setErr(d.error || 'Request failed')
    } catch(e) { setErr(e.message) }
    finally { setSubmitting(null) }
  }

  const conf       = item.confidence ?? (result ? Number(result.confidence || 0) : 0)
  const meta       = confMeta(conf)
  const predictions = result?.all_predictions || result?.allPredictions || []
  const suggestedHs = result?.suggested_hs || result?.suggestedHs || item.hs_code

  const inp = { width:'100%', background:'rgba(6,9,15,0.7)', border:`1px solid rgba(30,58,95,0.65)`, borderRadius:10, padding:'9px 13px', fontSize:13, color:C.text, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }
  const btnPrimary = { display:'inline-flex', alignItems:'center', gap:6, background:`linear-gradient(135deg,${C.gold},#c8921a)`, border:'none', borderRadius:10, padding:'10px 20px', fontSize:13, fontWeight:700, color:'#06090f', cursor:'pointer', minHeight:40 }
  const btnSecondary = { display:'inline-flex', alignItems:'center', gap:6, background:'rgba(10,18,32,0.8)', border:`1px solid ${C.border}`, borderRadius:10, padding:'9px 16px', fontSize:13, fontWeight:600, color:C.sub, cursor:'pointer', minHeight:40 }
  const btnDanger = { ...btnSecondary, color:C.red, borderColor:'rgba(248,113,113,0.35)' }

  return (
    <>
      <style>{`@keyframes crm-spin { to { transform:rotate(360deg) } }`}</style>

      {/* Backdrop */}
      <div style={{ position:'fixed', inset:0, zIndex:9000, background:'rgba(3,6,14,0.88)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>

        {/* Card */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:0, width:'100%', maxWidth:620, maxHeight:'92vh', display:'flex', flexDirection:'column', boxShadow:'0 24px 64px rgba(0,0,0,0.7)', overflow:'hidden' }} onClick={e=>e.stopPropagation()}>

          {/* Header */}
          <div style={{ padding:'18px 24px 14px', borderBottom:`1px solid rgba(30,58,95,0.4)`, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div>
              <div style={{ fontSize:15, fontWeight:800, color:C.text, letterSpacing:'-0.01em' }}>Classification Review</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>Review and correct the AI-predicted HS classification</div>
            </div>
            <button onClick={onClose} style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontSize:20, padding:4, display:'flex', alignItems:'center', lineHeight:1 }}>✕</button>
          </div>

          {/* Scrollable body */}
          <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>

            {/* Item info */}
            <div style={{ padding:'14px 16px', borderRadius:12, background:'rgba(6,9,15,0.5)', border:`1px solid rgba(30,58,95,0.35)`, marginBottom:20 }}>
              <div style={{ fontSize:11, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Item Description</div>
              <div style={{ fontSize:14, fontWeight:600, color:C.text, lineHeight:1.5 }}>{item.description}</div>
              <div style={{ display:'flex', gap:14, marginTop:10, flexWrap:'wrap' }}>
                <div>
                  <div style={{ fontSize:10, color:C.dim, marginBottom:2 }}>Current HS</div>
                  <div style={{ fontSize:13, fontFamily:'monospace', color:C.gold, fontWeight:700 }}>{item.hs_code}</div>
                </div>
                <div>
                  <div style={{ fontSize:10, color:C.dim, marginBottom:2 }}>Confidence</div>
                  <div style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:700, background:meta.color+'18', color:meta.color, border:`1px solid ${meta.color}35` }}>
                    <span style={{ width:5, height:5, borderRadius:'50%', background:meta.color }} />
                    {conf}% — {meta.label}
                  </div>
                </div>
                {item.customs_duty_usd != null && (
                  <div>
                    <div style={{ fontSize:10, color:C.dim, marginBottom:2 }}>Duty Amount</div>
                    <div style={{ fontSize:13, color:C.sub }}>${Number(item.customs_duty_usd).toFixed(2)}</div>
                  </div>
                )}
              </div>
            </div>

            {done ? (
              /* ── Success state ── */
              <div style={{ textAlign:'center', padding:'32px 16px' }}>
                <div style={{ fontSize:36, marginBottom:12 }}>{done.action==='approve'?'✓':'✗'}</div>
                <div style={{ fontSize:16, fontWeight:700, color:done.action==='approve'?C.green:C.red, marginBottom:6 }}>
                  {done.action === 'approve' ? 'Classification Approved' : 'Classification Rejected'}
                </div>
                {done.hs && <div style={{ fontSize:13, color:C.sub, marginBottom:8 }}>Approved HS: <span style={{ fontFamily:'monospace', color:C.gold }}>{done.hs}</span></div>}
                <div style={{ fontSize:12, color:C.muted, marginBottom:24, padding:'10px 16px', borderRadius:10, background:'rgba(74,222,128,0.06)', border:`1px solid rgba(74,222,128,0.15)` }}>
                  ✦ This correction will improve future classifications.
                </div>
                <button onClick={onClose} style={btnPrimary}>Close</button>
              </div>
            ) : loading ? (
              <Spinner />
            ) : err ? (
              <div style={{ padding:'14px 16px', borderRadius:10, background:'rgba(248,113,113,0.07)', border:`1px solid rgba(248,113,113,0.2)`, color:'#fca5a5', fontSize:13, marginBottom:16 }}>
                {err}
              </div>
            ) : (
              <>
                {/* Alternative predictions */}
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>
                    Alternative Matches {predictions.length > 0 && <span style={{ color:C.dim }}>· Top {Math.min(predictions.length, 5)}</span>}
                  </div>
                  {predictions.length === 0 ? (
                    <div style={{ fontSize:12, color:C.dim, padding:'16px 0' }}>No alternative predictions available</div>
                  ) : predictions.slice(0, 5).map((p, i) => (
                    <PredRow key={i} pred={p} selected={useCustom ? null : selected} onSelect={hs => { setSelected(hs); setUseCustom(false) }} />
                  ))}
                </div>

                {/* Custom HS input */}
                <div style={{ marginBottom:20 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <div
                      onClick={() => setUseCustom(u => !u)}
                      style={{ width:18, height:18, borderRadius:5, border:`2px solid ${useCustom?C.blue:C.dim}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, transition:'border-color .15s' }}
                    >
                      {useCustom && <div style={{ width:9, height:9, borderRadius:2, background:C.blue }} />}
                    </div>
                    <span style={{ fontSize:12, color:C.sub, cursor:'pointer' }} onClick={() => setUseCustom(u => !u)}>Search / enter a different HS code</span>
                  </div>
                  {useCustom && (
                    <input
                      value={customHs}
                      onChange={e => setCustomHs(e.target.value)}
                      placeholder="e.g. 33049900"
                      maxLength={10}
                      style={{ ...inp, fontFamily:'monospace', fontSize:15, letterSpacing:'0.08em' }}
                    />
                  )}
                </div>

                {/* Notes */}
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Review Notes (optional)</div>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Add context for this review…"
                    rows={2}
                    style={{ ...inp, resize:'vertical', minHeight:60 }}
                  />
                </div>

                {/* Learning note */}
                <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(233,186,76,0.06)', border:`1px solid rgba(233,186,76,0.18)`, fontSize:11, color:'#c8921a', marginBottom:20 }}>
                  ✦ This correction will improve future classifications for similar products.
                </div>

                {err && (
                  <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(248,113,113,0.07)', border:`1px solid rgba(248,113,113,0.2)`, color:'#fca5a5', fontSize:12, marginBottom:16 }}>
                    {err}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer buttons */}
          {!done && !loading && (
            <div style={{ padding:'14px 24px', borderTop:`1px solid rgba(30,58,95,0.35)`, display:'flex', justifyContent:'flex-end', gap:10, flexShrink:0, flexWrap:'wrap' }}>
              <button onClick={onClose} style={btnSecondary}>Cancel</button>
              <button
                onClick={() => submit('reject')}
                disabled={!!submitting}
                style={{ ...btnDanger, opacity:submitting?0.6:1 }}
              >
                {submitting === 'reject' ? 'Rejecting…' : 'Reject'}
              </button>
              <button
                onClick={() => submit('approve')}
                disabled={!!submitting || (useCustom && !customHs.trim())}
                style={{ ...btnPrimary, opacity:(submitting||( useCustom && !customHs.trim()))?0.6:1 }}
              >
                {submitting === 'approve' ? 'Approving…' : 'Accept Prediction'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
