import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { API } from '../config/api.js'
import {
  CheckCircle, Circle, ChevronUp, ChevronDown,
  Rocket, Building2, Users, FileText, Download, X, ArrowRight,
} from 'lucide-react'

const C = {
  bg:       '#080e1a',
  surface:  '#0c1425',
  border:   '#1e3a5f',
  gold:     '#e9ba4c',
  goldDark: '#c8921a',
  green:    '#4ade80',
  muted:    '#45607a',
  text:     '#eef2f7',
  sub:      '#8fa3bd',
}

const STEPS = [
  {
    key:      'company_created',
    label:    'Create Company',
    desc:     'Set up your company profile',
    icon:     Building2,
    action:   'company',
    actionLabel: 'Go to Company',
  },
  {
    key:      'team_invited',
    label:    'Invite Your Team',
    desc:     'Add colleagues to collaborate',
    icon:     Users,
    action:   'users',
    actionLabel: 'Invite Team',
    optional: true,
  },
  {
    key:      'first_boe_generated',
    label:    'Generate First BOE',
    desc:     'Create your first Bill of Entry',
    icon:     FileText,
    action:   'boe',
    actionLabel: 'Open BOE Generator',
  },
  {
    key:      'first_xml_downloaded',
    label:    'Download XML Export',
    desc:     'Export your BOE as ASYCUDA XML',
    icon:     Download,
    action:   'boe',
    actionLabel: 'Go to BOE Generator',
    optional: true,
  },
]

const STORAGE_KEY  = 'lunarae_onboarding_done'
const DISMISS_KEY  = 'lunarae_onboarding_dismissed'
const POLL_MS      = 30_000

function ProgressRing({ pct, size = 36, stroke = 3 }) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.border} strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={pct === 100 ? C.green : C.gold}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  )
}

export default function OnboardingWizard({ onNavigate }) {
  const { user } = useAuth()
  const [status,    setStatus]    = useState(null)
  const [expanded,  setExpanded]  = useState(false)
  const [dismissed, setDismissed] = useState(() => !!localStorage.getItem(DISMISS_KEY))
  const [doneAnim,  setDoneAnim]  = useState(false)
  const pollRef = useRef(null)

  const fetchStatus = useCallback(async () => {
    if (!user) return
    const done = localStorage.getItem(STORAGE_KEY)
    if (done) return
    try {
      const token = localStorage.getItem('lunarae_auth_token')
      const res   = await fetch(`${API}/api/onboarding/status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setStatus(data)
      if (data.completed) {
        localStorage.setItem(STORAGE_KEY, '1')
        setDoneAnim(true)
        setTimeout(() => setDoneAnim(false), 3000)
      }
    } catch { /* silent — non-critical */ }
  }, [user])

  // Initial fetch + polling
  useEffect(() => {
    if (!user) return
    fetchStatus()
    pollRef.current = setInterval(fetchStatus, POLL_MS)
    return () => clearInterval(pollRef.current)
  }, [user, fetchStatus])

  const markStep = useCallback(async (route) => {
    try {
      const token = localStorage.getItem('lunarae_auth_token')
      await fetch(`${API}/api/onboarding/${route}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      await fetchStatus()
    } catch { /* silent */ }
  }, [fetchStatus])

  const handleNavigate = useCallback((dest, stepRoute) => {
    if (stepRoute) markStep(stepRoute)
    onNavigate(dest)
  }, [onNavigate, markStep])

  const handleDismiss = useCallback(() => {
    setDismissed(true)
    localStorage.setItem(DISMISS_KEY, '1')
  }, [])

  const handleCompleteAll = useCallback(async () => {
    await markStep('complete')
    localStorage.setItem(STORAGE_KEY, '1')
    setDismissed(true)
  }, [markStep])

  // Don't render if: no user, already done (localStorage), or user dismissed
  if (!user) return null
  if (localStorage.getItem(STORAGE_KEY)) return null
  if (dismissed && !doneAnim) return null
  if (!status) return null

  const pct  = status.percentage ?? 0
  const done = status.completed

  // Brief "all done" celebration panel
  if (doneAnim) return (
    <div style={styles.root}>
      <div style={{ ...styles.panel, background: 'linear-gradient(135deg,#0c2a0c,#0c1425)', borderColor: C.green }}>
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.green }}>Onboarding Complete!</div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>You're ready to clear imports like a pro.</div>
        </div>
      </div>
    </div>
  )

  if (done) return null

  const allRequiredDone = status.steps
    ?.filter(s => !s.optional)
    .every(s => s.done)

  return (
    <div style={styles.root}>
      {/* Collapsed pill */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          style={styles.pill}
          title="Open onboarding guide"
        >
          <ProgressRing pct={pct} size={32} stroke={3} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.text, whiteSpace: 'nowrap' }}>
              Getting Started
            </div>
            <div style={{ fontSize: 10, color: C.sub, whiteSpace: 'nowrap' }}>
              {pct}% complete · {status.nextLabel || 'All done'}
            </div>
          </div>
          <ChevronUp size={14} color={C.muted} style={{ flexShrink: 0 }} />
        </button>
      )}

      {/* Expanded panel */}
      {expanded && (
        <div style={styles.panel}>
          {/* Header */}
          <div style={styles.panelHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={styles.rocketWrap}>
                <Rocket size={15} color={C.gold} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Getting Started</div>
                <div style={{ fontSize: 11, color: C.sub }}>{pct}% complete</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={() => setExpanded(false)} style={styles.iconBtn} title="Minimise">
                <ChevronDown size={14} />
              </button>
              <button onClick={handleDismiss} style={styles.iconBtn} title="Dismiss">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${pct}%`, background: pct === 100 ? C.green : `linear-gradient(90deg,${C.goldDark},${C.gold})` }} />
          </div>

          {/* Steps */}
          <div style={styles.stepsWrap}>
            {(status.steps || STEPS).map((step, i) => {
              const meta    = STEPS[i] || {}
              const isDone  = step.done
              const isCurr  = !isDone && status.nextStep === step.key
              const Icon    = meta.icon || Circle

              return (
                <div key={step.key} style={{ ...styles.stepRow, opacity: !isDone && !isCurr ? 0.5 : 1 }}>
                  {/* Status icon */}
                  <div style={{ flexShrink: 0, marginTop: 1 }}>
                    {isDone
                      ? <CheckCircle size={16} color={C.green} />
                      : isCurr
                        ? <div style={styles.currDot} />
                        : <Circle size={16} color={C.muted} />
                    }
                  </div>

                  {/* Step content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        fontSize: 12, fontWeight: isDone ? 600 : isCurr ? 700 : 500,
                        color: isDone ? C.sub : isCurr ? C.text : C.muted,
                        textDecoration: isDone ? 'line-through' : 'none',
                      }}>
                        {step.label}
                      </span>
                      {step.optional && (
                        <span style={styles.optionalBadge}>optional</span>
                      )}
                    </div>
                    {isCurr && !isDone && (
                      <div style={{ fontSize: 10, color: C.sub, marginTop: 2 }}>
                        {meta.desc}
                      </div>
                    )}
                  </div>

                  {/* CTA for current step */}
                  {isCurr && meta.action && (
                    <button
                      onClick={() => handleNavigate(meta.action, null)}
                      style={styles.ctaBtn}
                    >
                      <span>{meta.actionLabel}</span>
                      <ArrowRight size={11} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Complete button when all required steps done */}
          {allRequiredDone && !done && (
            <button onClick={handleCompleteAll} style={styles.completeBtn}>
              Mark Onboarding Complete
            </button>
          )}

          {/* Dismiss link */}
          <button onClick={handleDismiss} style={styles.dismissLink}>
            I'll explore on my own
          </button>
        </div>
      )}
    </div>
  )
}

const styles = {
  root: {
    position:  'fixed',
    bottom:    24,
    right:     20,
    zIndex:    200,
    display:   'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap:       8,
    fontFamily: "'DM Sans', -apple-system, sans-serif",
  },
  pill: {
    display:       'flex',
    alignItems:    'center',
    gap:           10,
    background:    C.bg,
    border:        `1px solid ${C.border}`,
    borderRadius:  12,
    padding:       '8px 14px 8px 10px',
    cursor:        'pointer',
    boxShadow:     '0 4px 24px rgba(0,0,0,0.5)',
    transition:    'border-color 0.2s',
    maxWidth:      220,
  },
  panel: {
    width:         300,
    background:    C.surface,
    border:        `1px solid ${C.border}`,
    borderRadius:  14,
    boxShadow:     '0 8px 40px rgba(0,0,0,0.6)',
    overflow:      'hidden',
  },
  panelHeader: {
    display:       'flex',
    alignItems:    'center',
    justifyContent: 'space-between',
    padding:       '12px 14px 10px',
    borderBottom:  `1px solid ${C.border}`,
  },
  rocketWrap: {
    width:         30,
    height:        30,
    borderRadius:  8,
    background:    'rgba(233,186,76,0.1)',
    border:        `1px solid rgba(233,186,76,0.2)`,
    display:       'flex',
    alignItems:    'center',
    justifyContent: 'center',
    flexShrink:    0,
  },
  iconBtn: {
    background:    'transparent',
    border:        'none',
    cursor:        'pointer',
    color:         C.muted,
    display:       'flex',
    alignItems:    'center',
    padding:       4,
    borderRadius:  6,
    transition:    'color 0.15s',
  },
  progressTrack: {
    height:        3,
    background:    C.border,
    margin:        '0 14px',
  },
  progressFill: {
    height:        '100%',
    borderRadius:  2,
    transition:    'width 0.6s ease',
  },
  stepsWrap: {
    padding:       '10px 14px',
    display:       'flex',
    flexDirection: 'column',
    gap:           10,
  },
  stepRow: {
    display:       'flex',
    alignItems:    'flex-start',
    gap:           10,
    transition:    'opacity 0.2s',
  },
  currDot: {
    width:         16,
    height:        16,
    borderRadius:  '50%',
    border:        `2px solid ${C.gold}`,
    background:    'rgba(233,186,76,0.15)',
  },
  optionalBadge: {
    fontSize:      9,
    fontWeight:    600,
    color:         C.muted,
    background:    'rgba(69,96,122,0.2)',
    border:        `1px solid ${C.border}`,
    borderRadius:  4,
    padding:       '1px 5px',
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
  },
  ctaBtn: {
    display:       'flex',
    alignItems:    'center',
    gap:           4,
    background:    'linear-gradient(135deg,#e9ba4c,#c8921a)',
    border:        'none',
    borderRadius:  6,
    padding:       '4px 10px',
    fontSize:      10,
    fontWeight:    700,
    color:         '#06090f',
    cursor:        'pointer',
    whiteSpace:    'nowrap',
    flexShrink:    0,
    transition:    'opacity 0.15s',
  },
  completeBtn: {
    display:       'block',
    width:         'calc(100% - 28px)',
    margin:        '0 14px 10px',
    padding:       '9px 0',
    background:    'linear-gradient(135deg,#4ade80,#16a34a)',
    border:        'none',
    borderRadius:  8,
    fontSize:      12,
    fontWeight:    700,
    color:         '#06090f',
    cursor:        'pointer',
    textAlign:     'center',
    transition:    'opacity 0.15s',
  },
  dismissLink: {
    display:       'block',
    width:         '100%',
    padding:       '8px 14px',
    borderTop:     `1px solid ${C.border}`,
    background:    'transparent',
    border:        'none',
    borderTop:     `1px solid ${C.border}`,
    fontSize:      11,
    color:         C.muted,
    cursor:        'pointer',
    textAlign:     'center',
    transition:    'color 0.15s',
  },
}
