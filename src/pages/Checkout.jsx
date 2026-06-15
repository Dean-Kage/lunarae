import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

/* ── Constants ──────────────────────────────────────────── */
const PLANS = {
  starter:      { label: 'Starter',      price: 49,  boes: '50 BOEs/month',   users: '10 users',        color: '#3b82f6' },
  professional: { label: 'Professional', price: 149, boes: 'Unlimited BOEs',  users: '25 users',        color: '#8b5cf6' },
  enterprise:   { label: 'Enterprise',   price: 499, boes: 'Unlimited BOEs',  users: 'Unlimited users', color: '#e9ba4c' },
}

const METHODS = [
  { id: 'ecocash',    label: 'EcoCash',    icon: '📱', desc: 'Mobile money — dial *151*2# to confirm',    field: 'phone' },
  { id: 'zipit',      label: 'ZIPIT',      icon: '🏦', desc: 'Interbank transfer via ZIPIT app',           field: 'phone' },
  { id: 'visa',       label: 'Visa',       icon: '💳', desc: 'Secure card payment via Paynow',             field: 'card'  },
  { id: 'mastercard', label: 'Mastercard', icon: '💳', desc: 'Secure card payment via Paynow',             field: 'card'  },
]

const METHOD_COLOR = { ecocash: '#16a34a', zipit: '#2563eb', visa: '#1d4ed8', mastercard: '#b91c1c' }

function authHeaders() {
  const t = localStorage.getItem('lunarae_auth_token')
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) }
}
async function api(path, opts = {}) {
  const res  = await fetch(path, { ...opts, headers: { ...authHeaders(), ...(opts.headers || {}) } })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

/* ── Step indicators ───────────────────────────────────── */
const STEPS = ['Plan', 'Payment', 'Confirm', 'Complete']
function StepBar({ step }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 36 }}>
      {STEPS.map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700,
              background: i < step ? '#e9ba4c' : i === step ? '#e9ba4c22' : '#1e3a5f',
              border: `2px solid ${i <= step ? '#e9ba4c' : '#1e3a5f'}`,
              color: i < step ? '#06090f' : i === step ? '#e9ba4c' : '#45607a',
              transition: 'all 0.25s',
            }}>
              {i < step ? '✓' : i + 1}
            </div>
            <div style={{ fontSize: 10, color: i === step ? '#e9ba4c' : '#45607a', fontWeight: i === step ? 700 : 400, whiteSpace: 'nowrap' }}>
              {s}
            </div>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < step ? '#e9ba4c' : '#1e3a5f', margin: '0 8px', marginBottom: 22, transition: 'background 0.25s' }} />
          )}
        </div>
      ))}
    </div>
  )
}

/* ── Invoice summary card ──────────────────────────────── */
function InvoiceSummary({ invoice, plan }) {
  const meta = PLANS[plan] || {}
  return (
    <div style={{
      background: 'rgba(6,9,15,0.5)', border: '1px solid rgba(30,58,95,0.55)', borderRadius: 14, padding: 20, marginBottom: 20,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: '#45607a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Invoice</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#e9ba4c', fontFamily: 'monospace' }}>{invoice?.invoice_number}</div>
        </div>
        <div style={{
          background: (meta.color || '#45607a') + '20', border: `1px solid ${(meta.color || '#45607a')}44`,
          borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: meta.color || '#eef2f7',
        }}>{meta.label}</div>
      </div>
      <div style={{ borderTop: '1px solid #1e3a5f', paddingTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#8fa3bd', marginBottom: 6 }}>
          <span>{meta.label} Plan — monthly subscription</span>
          <span>${meta.price}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#8fa3bd', marginBottom: 10 }}>
          <span>{meta.boes} · {meta.users}</span>
        </div>
        <div style={{ borderTop: '1px solid #1e3a5f', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#eef2f7' }}>Total Due</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#e9ba4c' }}>${meta.price} USD</span>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   STEP 1 — Plan selection
════════════════════════════════════════════════════════ */
function StepPlan({ currentPlan, selectedPlan, onSelect, onNext, loading }) {
  return (
    <div>
      <h2 style={sH2}>Choose Your Plan</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 14, marginBottom: 28 }}>
        {Object.entries(PLANS).map(([id, meta]) => (
          <div
            key={id}
            onClick={() => onSelect(id)}
            style={{
              border: `2px solid ${selectedPlan === id ? meta.color : 'rgba(30,58,95,0.55)'}`,
              borderRadius: 14, padding: '20px 18px', cursor: 'pointer',
              background: selectedPlan === id ? meta.color + '10' : 'rgba(6,9,15,0.5)',
              transition: 'all 0.18s ease', position: 'relative',
            }}
          >
            {currentPlan === id && (
              <div style={{
                position: 'absolute', top: -10, left: 14,
                background: meta.color, color: '#06090f',
                fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 20,
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>Current</div>
            )}
            <div style={{ fontSize: 14, fontWeight: 800, color: meta.color, marginBottom: 4 }}>{meta.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#eef2f7', marginBottom: 10 }}>${meta.price}<span style={{ fontSize: 12, fontWeight: 400, color: '#45607a' }}>/mo</span></div>
            <div style={{ fontSize: 12, color: '#8fa3bd', lineHeight: 1.7 }}>
              <div>✓ {meta.boes}</div>
              <div>✓ {meta.users}</div>
            </div>
            {selectedPlan === id && (
              <div style={{ marginTop: 12, fontSize: 11, fontWeight: 700, color: meta.color }}>Selected ✓</div>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onNext}
          disabled={!selectedPlan || loading}
          style={{
            ...btnPrimary,
            opacity: (!selectedPlan || loading) ? 0.5 : 1,
            cursor:  (!selectedPlan || loading) ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Creating invoice…' : 'Continue to Payment →'}
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   STEP 2 — Payment method + details
════════════════════════════════════════════════════════ */
function StepPayment({ invoice, plan, onPay, loading, error }) {
  const [method, setMethod] = useState(null)
  const [phone,  setPhone]  = useState('')

  const selected = METHODS.find(m => m.id === method)

  return (
    <div>
      <h2 style={sH2}>Choose Payment Method</h2>
      <InvoiceSummary invoice={invoice} plan={plan} />

      {/* Method grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {METHODS.map(m => (
          <div
            key={m.id}
            onClick={() => setMethod(m.id)}
            style={{
              border: `2px solid ${method === m.id ? METHOD_COLOR[m.id] : 'rgba(30,58,95,0.55)'}`,
              borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
              background: method === m.id ? METHOD_COLOR[m.id] + '10' : 'rgba(6,9,15,0.5)',
              display: 'flex', gap: 10, alignItems: 'flex-start',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 22 }}>{m.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: method === m.id ? METHOD_COLOR[m.id] : '#eef2f7' }}>{m.label}</div>
              <div style={{ fontSize: 11, color: '#45607a', marginTop: 2 }}>{m.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile money phone field */}
      {selected?.field === 'phone' && (
        <div style={{ marginBottom: 20 }}>
          <label style={lbl}>
            {method === 'ecocash' ? 'EcoCash' : 'ZIPIT'} Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder={method === 'ecocash' ? '077 123 4567' : '0772 123 456'}
            style={inp}
          />
          <div style={{ fontSize: 11, color: '#45607a', marginTop: 6 }}>
            {method === 'ecocash'
              ? 'You will receive a USSD prompt — approve on your phone.'
              : 'You will receive a transfer notification in your banking app.'}
          </div>
        </div>
      )}

      {/* Card notice */}
      {selected?.field === 'card' && (
        <div style={{
          background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)',
          borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#93c5fd',
        }}>
          You'll be securely redirected to Paynow's card payment page to enter your card details.
          Card data never touches our servers.
        </div>
      )}

      {error && <ErrBanner msg={error} />}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button
          onClick={() => onPay({ method, phone })}
          disabled={!method || loading || (selected?.field === 'phone' && !phone.trim())}
          style={{
            ...btnPrimary,
            opacity: (!method || loading || (selected?.field === 'phone' && !phone.trim())) ? 0.5 : 1,
            cursor:  (!method || loading || (selected?.field === 'phone' && !phone.trim())) ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Initiating…' : `Pay $${PLANS[plan]?.price} via ${method ? METHODS.find(m => m.id === method)?.label : '…'}`}
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   STEP 3 — Processing / polling
════════════════════════════════════════════════════════ */
function StepProcessing({ paymentId, method, instructions, onSuccess, onFailed, mockMode }) {
  const [elapsed,    setElapsed]   = useState(0)
  const [statusMsg,  setStatusMsg] = useState('Connecting to payment provider…')
  const pollRef = useRef(null)

  useEffect(() => {
    const tick = setInterval(() => setElapsed(e => e + 1), 1000)
    startPolling()
    return () => { clearInterval(tick); clearTimeout(pollRef.current) }
  }, [])

  function startPolling() {
    pollRef.current = setTimeout(poll, 3000)
  }

  async function poll() {
    try {
      const data = await api(`/api/payments/status/${paymentId}`)
      const s = data.payment?.status
      if (s === 'completed') { onSuccess(); return }
      if (s === 'failed')    { onFailed(data.payment?.failure_reason || 'Payment declined'); return }
      setStatusMsg(getStatusMsg(method, elapsed))
      pollRef.current = setTimeout(poll, 3000)
    } catch {
      pollRef.current = setTimeout(poll, 5000)
    }
  }

  function getStatusMsg(m, t) {
    if (t < 10) return `Waiting for ${m === 'ecocash' ? 'USSD confirmation' : m === 'zipit' ? 'bank confirmation' : 'payment confirmation'}…`
    if (t < 30) return 'Still waiting — please check your phone or banking app.'
    return 'Pending confirmation. This may take a moment.'
  }

  const methodMeta = METHODS.find(m => m.id === method) || {}

  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      {/* Spinner */}
      <div style={{
        width: 64, height: 64, margin: '0 auto 24px',
        border: '4px solid #1e3a5f', borderTopColor: '#e9ba4c',
        borderRadius: '50%', animation: 'spin 1s linear infinite',
      }} />
      <div style={{ fontSize: 20, fontWeight: 800, color: '#eef2f7', marginBottom: 8 }}>
        Processing Payment
      </div>
      <div style={{ fontSize: 14, color: '#8fa3bd', marginBottom: 24 }}>
        {elapsed}s · {statusMsg}
      </div>

      {/* Method-specific instructions */}
      {instructions && (
        <div style={{
          background: METHOD_COLOR[method] + '12',
          border: `1px solid ${METHOD_COLOR[method]}33`,
          borderRadius: 12, padding: '16px 20px', marginBottom: 20,
          maxWidth: 420, margin: '0 auto 20px',
        }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>{methodMeta.icon}</div>
          <div style={{ fontSize: 13, color: '#eef2f7', lineHeight: 1.7 }}>{instructions}</div>
          {method === 'ecocash' && (
            <div style={{ marginTop: 8, fontSize: 11, color: '#45607a' }}>
              Reference: <code style={{ color: '#e9ba4c' }}>*151*2#</code> → Option 2 → Approve
            </div>
          )}
        </div>
      )}

      {mockMode && (
        <div style={{ fontSize: 11, color: '#45607a', marginTop: 12, fontStyle: 'italic' }}>
          Mock mode — payment will auto-complete in ~5 seconds
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   STEP 4 — Success
════════════════════════════════════════════════════════ */
function StepSuccess({ plan, onDone, onViewHistory }) {
  const meta = PLANS[plan] || {}
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{
        width: 72, height: 72, margin: '0 auto 20px',
        background: 'rgba(74,222,128,0.12)', border: '2px solid rgba(74,222,128,0.4)',
        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32,
      }}>✓</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#4ade80', marginBottom: 8 }}>
        Payment Successful!
      </div>
      <div style={{ fontSize: 14, color: '#8fa3bd', marginBottom: 6 }}>
        Your <span style={{ color: meta.color, fontWeight: 700 }}>{meta.label}</span> plan is now active.
      </div>
      <div style={{ fontSize: 13, color: '#45607a', marginBottom: 32 }}>
        {meta.boes} · {meta.users}
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={onViewHistory} style={btnSecondary}>View Invoice</button>
        <button onClick={onDone}        style={btnPrimary}>Start Generating BOEs →</button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   STEP — Failed
════════════════════════════════════════════════════════ */
function StepFailed({ reason, paymentId, method, onRetry, onCancel, retrying, retryCount }) {
  const [retryPhone, setRetryPhone] = useState('')
  const needsPhone = ['ecocash', 'zipit'].includes(method)
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{
        width: 72, height: 72, margin: '0 auto 20px',
        background: 'rgba(248,113,113,0.12)', border: '2px solid rgba(248,113,113,0.4)',
        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32,
      }}>✕</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#f87171', marginBottom: 8 }}>Payment Failed</div>
      <div style={{ fontSize: 13, color: '#8fa3bd', marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
        {reason || 'The payment could not be processed. Please try again.'}
      </div>

      {retryCount < 3 && (
        <div style={{ maxWidth: 360, margin: '0 auto 20px' }}>
          {needsPhone && (
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Phone Number (optional — leave blank to use same)</label>
              <input
                type="tel"
                value={retryPhone}
                onChange={e => setRetryPhone(e.target.value)}
                placeholder="Update phone if needed"
                style={inp}
              />
            </div>
          )}
          <div style={{ fontSize: 11, color: '#45607a', marginBottom: 16 }}>
            {3 - retryCount} retry attempt{3 - retryCount !== 1 ? 's' : ''} remaining
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={onCancel} style={btnSecondary}>Cancel</button>
        {retryCount < 3 && (
          <button
            onClick={() => onRetry(retryPhone)}
            disabled={retrying}
            style={{ ...btnPrimary, background: 'linear-gradient(135deg,#f97316,#dc2626)' }}
          >
            {retrying ? 'Retrying…' : 'Retry Payment'}
          </button>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   Root Checkout component
════════════════════════════════════════════════════════ */
export default function Checkout({ plan: initialPlan, onNavigate }) {
  const { user } = useAuth()

  const [step,        setStep]      = useState(initialPlan ? 1 : 0)
  const [plan,        setPlan]      = useState(initialPlan || null)
  const [invoice,     setInvoice]   = useState(null)
  const [payment,     setPayment]   = useState(null)  // { id, method, instructions, mockMode }
  const [failReason,  setFailReason]= useState(null)
  const [retryCount,  setRetryCount]= useState(0)
  const [loading,     setLoading]   = useState(false)
  const [retrying,    setRetrying]  = useState(false)
  const [error,       setError]     = useState(null)

  // Auto-create invoice when plan already known
  useEffect(() => {
    if (initialPlan && !invoice) createInvoice(initialPlan)
  }, [])

  async function createInvoice(selectedPlan) {
    setLoading(true); setError(null)
    try {
      const data = await api('/api/payments/invoice', {
        method: 'POST', body: JSON.stringify({ plan: selectedPlan }),
      })
      setInvoice(data.invoice)
      setPlan(selectedPlan)
      setStep(1)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function initiatePayment({ method, phone }) {
    setLoading(true); setError(null)
    try {
      const data = await api('/api/payments/initiate', {
        method: 'POST',
        body: JSON.stringify({ invoice_id: invoice.id, payment_method: method, phone }),
      })
      setPayment({ id: data.payment_id, method, instructions: data.instructions, mockMode: data.mock_mode })
      setStep(2)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function retryPayment(newPhone) {
    setRetrying(true)
    try {
      const data = await api(`/api/payments/retry/${payment.id}`, {
        method: 'POST',
        body: JSON.stringify({ phone: newPhone || undefined }),
      })
      setRetryCount(data.retry_count)
      setPayment(p => ({ ...p, instructions: data.instructions }))
      setFailReason(null)
      setStep(2)
    } catch (e) { setError(e.message) }
    finally { setRetrying(false) }
  }

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{
        minHeight: 'calc(100vh - 64px)', background: '#06090f',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '48px 20px 80px', fontFamily: "'DM Sans', sans-serif",
        marginTop: 64,
      }}>
        <div style={{ width: '100%', maxWidth: 640 }}>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <button onClick={() => onNavigate('company')} style={{
              background: 'none', border: 'none', color: '#45607a', fontSize: 13,
              cursor: 'pointer', padding: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'inherit', transition: 'color 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = '#8fa3bd'}
              onMouseLeave={e => e.currentTarget.style.color = '#45607a'}
            >← Back to Dashboard</button>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#eef2f7', letterSpacing: '-0.02em' }}>
              Upgrade Your Plan
            </div>
            <div style={{ fontSize: 14, color: '#45607a', marginTop: 4 }}>
              {user?.company_name || 'Your company'}
            </div>
          </div>

          <StepBar step={step === 'failed' ? 3 : Math.min(step, 3)} />

          {/* Main card */}
          <div style={{
            background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(30,58,95,0.55)', borderRadius: 20, padding: 32,
            boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
          }}>
            {step === 0 && (
              <StepPlan
                currentPlan={null}
                selectedPlan={plan}
                onSelect={setPlan}
                onNext={() => createInvoice(plan)}
                loading={loading}
              />
            )}

            {step === 1 && invoice && (
              <StepPayment
                invoice={invoice}
                plan={plan}
                onPay={initiatePayment}
                loading={loading}
                error={error}
              />
            )}

            {step === 2 && payment && (
              <StepProcessing
                paymentId={payment.id}
                method={payment.method}
                instructions={payment.instructions}
                mockMode={payment.mockMode}
                onSuccess={() => setStep(3)}
                onFailed={reason => { setFailReason(reason); setStep('failed') }}
              />
            )}

            {step === 3 && (
              <StepSuccess
                plan={plan}
                onDone={() => onNavigate('boe')}
                onViewHistory={() => onNavigate('payments')}
              />
            )}

            {step === 'failed' && payment && (
              <StepFailed
                reason={failReason}
                paymentId={payment.id}
                method={payment.method}
                onRetry={retryPayment}
                onCancel={() => onNavigate('payments')}
                retrying={retrying}
                retryCount={retryCount}
              />
            )}
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#2a3d52', lineHeight: 1.7 }}>
            Payments powered by Paynow Zimbabwe · Secured by SSL<br />
            EcoCash · ZIPIT · Visa · Mastercard accepted
          </div>
        </div>
      </div>
    </>
  )
}

/* ── Shared styles ─────────────────────────────────────── */
const sH2 = { color: '#eef2f7', fontSize: 20, fontWeight: 800, margin: '0 0 20px', letterSpacing: '-0.02em' }
const lbl = { display: 'block', fontSize: 11, color: '#45607a', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 6 }
const inp = {
  display: 'block', width: '100%', boxSizing: 'border-box',
  background: 'rgba(6,9,15,0.6)', border: '1px solid rgba(30,58,95,0.55)', borderRadius: 10,
  padding: '11px 14px', fontSize: 14, color: '#eef2f7', outline: 'none',
  fontFamily: 'inherit', transition: 'border-color 0.15s',
}
const btnPrimary   = { background: 'linear-gradient(135deg,#e9ba4c,#c8921a)', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 700, color: '#06090f', cursor: 'pointer', fontFamily: 'inherit', transition: 'filter 0.18s' }
const btnSecondary = { background: 'rgba(10,18,32,0.6)', border: '1px solid rgba(30,58,95,0.55)', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 600, color: '#8fa3bd', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }
function ErrBanner({ msg }) {
  return <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#fca5a5', marginBottom: 16 }}>{msg}</div>
}
