import { useState, useEffect, useCallback } from 'react'

const PLAN_META = {
  free:         { label: 'Free',         boes: '5 / month',   users: '5',         price: '$0',    color: '#45607a' },
  starter:      { label: 'Starter',      boes: '50 / month',  users: '10',        price: '$49/mo', color: '#3b82f6' },
  professional: { label: 'Professional', boes: 'Unlimited',   users: '25',        price: '$149/mo', color: '#8b5cf6' },
  enterprise:   { label: 'Enterprise',   boes: 'Unlimited',   users: 'Unlimited', price: '$499/mo', color: '#e9ba4c' },
}

function authHeaders() {
  const t = localStorage.getItem('lunarae_auth_token')
  return t ? { Authorization: `Bearer ${t}` } : {}
}

/* ── Mini progress bar ──────────────────────────────────── */
function UsageBar({ percent, warning, blocked }) {
  const color = blocked ? '#f87171' : warning ? '#f97316' : '#4ade80'
  return (
    <div style={{ background: '#1e3a5f', borderRadius: 4, height: 5, width: '100%', overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${percent}%`,
        background: color, borderRadius: 4,
        transition: 'width 0.4s ease',
      }} />
    </div>
  )
}

/* ── Plan card shown in upgrade overlay ─────────────────── */
function PlanCard({ plan, meta, isCurrent, onSelect }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        border: `2px solid ${isCurrent ? meta.color : hover ? meta.color + '66' : '#1e3a5f'}`,
        borderRadius: 14, padding: '20px 18px', cursor: isCurrent ? 'default' : 'pointer',
        background: isCurrent ? meta.color + '12' : hover ? '#0d1829' : '#080d18',
        transition: 'all 0.18s ease', position: 'relative', flex: '1 1 160px', minWidth: 0,
      }}
      onClick={() => !isCurrent && onSelect(plan)}
    >
      {isCurrent && (
        <div style={{
          position: 'absolute', top: -10, left: 14,
          background: meta.color, color: '#06090f',
          fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 20,
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>Current</div>
      )}
      <div style={{ fontSize: 13, fontWeight: 800, color: meta.color, marginBottom: 4 }}>{meta.label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#eef2f7', marginBottom: 10 }}>{meta.price}</div>
      <div style={{ fontSize: 11, color: '#8fa3bd', lineHeight: 1.8 }}>
        <div>{meta.boes} BOEs</div>
        <div>{meta.users} users</div>
      </div>
      {!isCurrent && (
        <div style={{
          marginTop: 12, fontSize: 11, fontWeight: 700,
          color: hover ? meta.color : '#45607a',
          transition: 'color 0.15s',
        }}>Select →</div>
      )}
    </div>
  )
}

/* ── Usage banner shown when within limit ───────────────── */
function UsageBanner({ used, limit, percent, warning, plan, onUpgradeClick }) {
  const planMeta = PLAN_META[plan] || PLAN_META.free
  const color    = warning ? '#f97316' : '#4ade80'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: warning ? 'rgba(249,115,22,0.08)' : 'rgba(74,222,128,0.05)',
      border: `1px solid ${warning ? 'rgba(249,115,22,0.25)' : 'rgba(74,222,128,0.15)'}`,
      borderRadius: 10, padding: '8px 16px', marginBottom: 16,
      flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
        <div style={{
          background: planMeta.color + '20', border: `1px solid ${planMeta.color}44`,
          borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 800,
          color: planMeta.color, textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0,
        }}>{planMeta.label}</div>
        <div style={{ fontSize: 12, color: '#8fa3bd', minWidth: 0 }}>
          <span style={{ fontWeight: 700, color }}>{used}</span>
          <span style={{ color: '#45607a' }}> / {limit} BOEs this month</span>
        </div>
        <div style={{ width: 80, flexShrink: 0 }}>
          <UsageBar percent={percent} warning={warning} blocked={false} />
        </div>
      </div>
      {warning && (
        <button onClick={onUpgradeClick} style={{
          background: 'linear-gradient(135deg,#e9ba4c,#c8921a)',
          border: 'none', borderRadius: 7, padding: '5px 12px',
          fontSize: 11, fontWeight: 700, color: '#06090f', cursor: 'pointer', flexShrink: 0,
        }}>Upgrade</button>
      )}
    </div>
  )
}

/* ── Full blocked overlay ───────────────────────────────── */
function BlockedOverlay({ sub, onRequestUpgrade, requestSent, selectedPlan, setSelectedPlan }) {
  const current = sub?.plan || 'free'
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 200,
      background: 'rgba(6,9,15,0.92)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 0, padding: 32,
    }}>
      <div style={{ maxWidth: 700, width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, margin: '0 auto 16px',
            background: 'rgba(233,186,76,0.12)', border: '1px solid rgba(233,186,76,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
          }}>📊</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#eef2f7', marginBottom: 6 }}>
            Monthly BOE Limit Reached
          </div>
          <div style={{ fontSize: 14, color: '#8fa3bd', lineHeight: 1.6 }}>
            Your <span style={{ color: PLAN_META[current]?.color, fontWeight: 700 }}>{PLAN_META[current]?.label}</span> plan
            includes {PLAN_META[current]?.boes} BOEs.
            Limits reset on the 1st of each month.
          </div>
        </div>

        {/* Plan cards */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          {Object.entries(PLAN_META).map(([plan, meta]) => (
            <PlanCard
              key={plan}
              plan={plan}
              meta={meta}
              isCurrent={plan === current}
              onSelect={setSelectedPlan}
            />
          ))}
        </div>

        {/* Request button */}
        {requestSent ? (
          <div style={{
            background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)',
            borderRadius: 10, padding: '14px 20px', textAlign: 'center',
            color: '#86efac', fontSize: 14, fontWeight: 600,
          }}>
            Upgrade request sent. Your administrator will contact you shortly.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            {selectedPlan && selectedPlan !== current && (
              <div style={{ fontSize: 13, color: '#8fa3bd', marginBottom: 4 }}>
                Requesting upgrade to{' '}
                <span style={{ color: PLAN_META[selectedPlan]?.color, fontWeight: 700 }}>
                  {PLAN_META[selectedPlan]?.label}
                </span>
              </div>
            )}
            <button
              onClick={() => onRequestUpgrade(selectedPlan)}
              disabled={!selectedPlan || selectedPlan === current}
              style={{
                background: selectedPlan && selectedPlan !== current
                  ? 'linear-gradient(135deg,#e9ba4c,#c8921a)'
                  : '#1e3a5f',
                border: 'none', borderRadius: 10, padding: '12px 32px',
                fontSize: 14, fontWeight: 700,
                color: selectedPlan && selectedPlan !== current ? '#06090f' : '#45607a',
                cursor: selectedPlan && selectedPlan !== current ? 'pointer' : 'not-allowed',
                transition: 'all 0.18s ease',
              }}
            >
              {selectedPlan && selectedPlan !== current
                ? `Request upgrade to ${PLAN_META[selectedPlan]?.label}`
                : 'Select a plan above'}
            </button>
            <div style={{ fontSize: 11, color: '#2a3d52' }}>
              Your administrator will process the request and activate the new plan.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════ */
/*  Main SubscriptionGate                                     */
/*  Wraps children — adds usage banner, blocks when at limit  */
/* ══════════════════════════════════════════════════════════ */
export default function SubscriptionGate({ children, onNavigate }) {
  const [sub, setSub]             = useState(null)
  const [showUpgrade, setUpgrade] = useState(false)
  const [requestSent, setReqSent] = useState(false)
  const [selectedPlan, setPlan]   = useState(null)

  function goToCheckout(plan) {
    if (plan && onNavigate) onNavigate('checkout', plan)
  }

  const fetchSub = useCallback(async () => {
    try {
      const res  = await fetch('/api/subscription', { headers: authHeaders() })
      const data = await res.json()
      if (res.ok) setSub(data)
    } catch {}
  }, [])

  useEffect(() => { fetchSub() }, [fetchSub])

  async function requestUpgrade(plan) {
    try {
      await fetch('/api/subscription/upgrade-request', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ requested_plan: plan }),
      })
      setReqSent(true)
    } catch {}
  }

  const usage    = sub?.usage
  const isBlocked = usage?.blocked
  const isWarning = usage?.warning && !isBlocked

  return (
    <div style={{ position: 'relative' }}>
      {/* Usage banner — only when not unlimited */}
      {sub && !usage?.unlimited && (
        <div style={{ padding: '16px 0 0' }}>
          <UsageBanner
            used={usage.used}
            limit={usage.limit}
            percent={usage.percent}
            warning={isWarning}
            plan={sub.subscription?.plan || 'free'}
            onUpgradeClick={() => { setPlan(null); setUpgrade(true) }}
          />
        </div>
      )}

      {/* The actual BOE generator */}
      {children}

      {/* Blocked overlay — rendered on top of children */}
      {isBlocked && (
        <BlockedOverlay
          sub={sub.subscription}
          onRequestUpgrade={plan => { if (plan) goToCheckout(plan) }}
          requestSent={requestSent}
          selectedPlan={selectedPlan}
          setSelectedPlan={setPlan}
        />
      )}

      {/* Upgrade modal triggered from warning banner */}
      {showUpgrade && !isBlocked && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'rgba(3,6,14,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)',
        }} onClick={() => setUpgrade(false)}>
          <div style={{
            background: '#0d1829', border: '1px solid #1e3a5f', borderRadius: 20,
            padding: 32, maxWidth: 680, width: '90vw',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#eef2f7', marginBottom: 6 }}>
              Upgrade Your Plan
            </div>
            <div style={{ fontSize: 13, color: '#8fa3bd', marginBottom: 24 }}>
              You've used <span style={{ color: '#f97316', fontWeight: 700 }}>{usage?.used} of {usage?.limit}</span> BOEs
              this month. Upgrade to generate more.
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
              {Object.entries(PLAN_META).map(([plan, meta]) => (
                <PlanCard
                  key={plan}
                  plan={plan}
                  meta={meta}
                  isCurrent={plan === sub?.subscription?.plan}
                  onSelect={setPlan}
                />
              ))}
            </div>
            {requestSent ? (
              <div style={{ color: '#86efac', textAlign: 'center', fontWeight: 600, fontSize: 14 }}>
                Upgrade request sent!
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button onClick={() => setUpgrade(false)} style={{
                  background: 'none', border: '1px solid #1e3a5f', borderRadius: 9,
                  padding: '10px 20px', color: '#8fa3bd', fontSize: 13, cursor: 'pointer',
                }}>Cancel</button>
                <button
                  onClick={() => { if (selectedPlan) goToCheckout(selectedPlan) }}
                  disabled={!selectedPlan || selectedPlan === sub?.subscription?.plan}
                  style={{
                    background: selectedPlan && selectedPlan !== sub?.subscription?.plan
                      ? 'linear-gradient(135deg,#e9ba4c,#c8921a)' : '#1e3a5f',
                    border: 'none', borderRadius: 9, padding: '10px 20px',
                    fontSize: 13, fontWeight: 700,
                    color: selectedPlan && selectedPlan !== sub?.subscription?.plan ? '#06090f' : '#45607a',
                    cursor: 'pointer',
                  }}
                >
                  {selectedPlan && selectedPlan !== sub?.subscription?.plan
                    ? `Request ${PLAN_META[selectedPlan]?.label}` : 'Select a plan'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
