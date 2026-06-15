import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { API } from '../config/api.js'

const ROLE_LABELS = {
  super_admin:    'Super Admin',
  company_owner:  'Company Owner',
  clearing_agent: 'Clearing Agent',
  clerk:          'Clerk',
}

export default function CompanyDashboard({ onNavigate }) {
  const { user } = useAuth()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  const isOwner = user?.role === 'company_owner' || user?.role === 'super_admin'

  useEffect(() => { fetchDashboard() }, [])

  async function fetchDashboard() {
    setLoading(true); setError('')
    try {
      const token = localStorage.getItem('lunarae_auth_token')
      const res   = await fetch(`${API}/api/company/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setData(json)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="portal-page" style={page}>
      {/* Header */}
      <div style={headerWrap}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={avatarBox}>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#e9ba4c' }}>
              {(data?.company?.company_name || user?.company_name || 'C')[0].toUpperCase()}
            </span>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#eef2f7', letterSpacing: '-0.02em' }}>
              {data?.company?.company_name || 'Company Dashboard'}
            </div>
            <div style={{ fontSize: 13, color: '#8fa3bd', marginTop: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={rolePill}>{ROLE_LABELS[user?.role]}</span>
              <span style={{ color: '#45607a' }}>{user?.email}</span>
            </div>
          </div>
        </div>
        {isOwner && (
          <button
            onClick={() => onNavigate('users')}
            style={btnPrimary}
            onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Manage Team
          </button>
        )}
      </div>

      {error && <ErrBox>{error}</ErrBox>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#45607a' }}>
          <div style={{ width: 36, height: 36, border: '3px solid rgba(30,58,95,0.55)', borderTopColor: '#e9ba4c', borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ fontSize: 13 }}>Loading dashboard…</div>
        </div>
      ) : data && (
        <>
          {/* Stats */}
          <div style={statsGrid}>
            <StatCard
              icon="👥"
              label="Team Members"
              value={data.stats.total_users}
              sub={`${data.stats.active_users} active`}
              accent="#60a5fa"
            />
            <StatCard
              icon="📋"
              label="BOEs Generated"
              value={data.stats.total_boes}
              sub="all time"
              accent="#34d399"
            />
            {isOwner && (
              <StatCard
                icon="✉️"
                label="Pending Invites"
                value={data.stats.pending_invites}
                sub="awaiting acceptance"
                accent="#f59e0b"
              />
            )}
            <SubscriptionCard sub={data.subscription} onNavigate={onNavigate} isOwner={isOwner} />
          </div>

          {/* Quick Actions */}
          <SectionCard title="Quick Actions" icon="⚡">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <QuickBtn icon="⚡" label="BOE Generator" onClick={() => onNavigate('boe')} />
              <QuickBtn icon="📄" label="SAD Viewer"    onClick={() => onNavigate('viewer')} />
              {isOwner && (
                <QuickBtn icon="👤" label="Manage Team" onClick={() => onNavigate('users')} />
              )}
              <QuickBtn icon="⚙" label="My Profile"   onClick={() => onNavigate('profile')} />
              <QuickBtn icon="💳" label="Billing"      onClick={() => onNavigate('payments')} />
            </div>
          </SectionCard>

          {/* Recent BOEs */}
          <SectionCard title={isOwner ? 'Recent Company BOEs' : 'My Recent BOEs'} icon="📋">
            {data.recent_boes.length === 0 ? (
              <div style={emptyState}>
                <div style={{ fontSize: 36, marginBottom: 14, opacity: 0.5 }}>📋</div>
                <div style={{ fontSize: 14, color: '#8fa3bd', marginBottom: 6, fontWeight: 600 }}>No BOEs saved yet</div>
                <div style={{ fontSize: 12, color: '#45607a', maxWidth: 300, textAlign: 'center', lineHeight: 1.6, marginBottom: 16 }}>
                  After generating a BOE, click the save button to record it here for team visibility.
                </div>
                <button
                  onClick={() => onNavigate('boe')}
                  style={btnPrimary}
                  onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                  onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
                >
                  Generate a BOE
                </button>
              </div>
            ) : (
              <div className="tbl-responsive-wrap" style={{ overflowX: 'auto' }}>
                <table style={tbl}>
                  <thead>
                    <tr>
                      {['Importer', 'Exporter', 'Duty', 'VAT', 'Payable', 'Created By', 'Date', 'Status'].map(h => (
                        <th key={h} style={th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_boes.map(boe => (
                      <tr key={boe.id}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(30,58,95,0.12)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td data-label="Importer" style={td}>{boe.importer || '—'}</td>
                        <td data-label="Exporter" style={td}>{boe.exporter || '—'}</td>
                        <td data-label="Duty" style={td}>${Number(boe.total_duty || 0).toFixed(2)}</td>
                        <td data-label="VAT" style={td}>${Number(boe.total_vat || 0).toFixed(2)}</td>
                        <td data-label="Payable" style={{ ...td, fontWeight: 700, color: '#e9ba4c' }}>${Number(boe.total_payable || 0).toFixed(2)}</td>
                        <td data-label="By" style={td}>{boe.created_by}</td>
                        <td data-label="Date" style={{ ...td, color: '#45607a', fontSize: 11 }}>{new Date(boe.created_at).toLocaleDateString('en-ZW')}</td>
                        <td data-label="Status" style={td}><StatusBadge status={boe.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  )
}

/* ── Sub-components ───────────────────────────────────────── */

function SectionCard({ title, icon, children }) {
  return (
    <div style={card}>
      <div style={cardHeader}>
        <span style={{ fontSize: 15 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#eef2f7' }}>{title}</span>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  )
}

const PLAN_META = {
  free:         { label: 'Free',         color: '#45607a' },
  starter:      { label: 'Starter',      color: '#3b82f6' },
  professional: { label: 'Professional', color: '#8b5cf6' },
  enterprise:   { label: 'Enterprise',   color: '#e9ba4c' },
}

function SubscriptionCard({ sub, onNavigate, isOwner }) {
  if (!sub) return null
  const plan  = sub.plan || 'free'
  const meta  = PLAN_META[plan] || PLAN_META.free
  const color = sub.blocked ? '#f87171' : sub.warning ? '#f97316' : meta.color

  return (
    <div style={{
      background: 'rgba(10,18,32,0.85)',
      border: `1px solid ${meta.color}33`,
      borderRadius: 16,
      padding: '20px 24px',
      display: 'flex', flexDirection: 'column', gap: 10,
      boxShadow: `0 0 0 1px ${meta.color}10, 0 4px 20px rgba(0,0,0,0.3)`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: meta.color + '18', border: `1px solid ${meta.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
            🏢
          </div>
          <span style={{ fontSize: 12, color: '#8fa3bd', fontWeight: 600 }}>Subscription</span>
        </div>
        <span style={{
          background: meta.color + '1e', border: `1px solid ${meta.color}44`,
          borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 800,
          color: meta.color, textTransform: 'uppercase', letterSpacing: '0.07em',
        }}>{meta.label}</span>
      </div>

      {sub.unlimited ? (
        <div style={{ fontSize: 22, fontWeight: 700, color: meta.color, lineHeight: 1 }}>Unlimited BOEs</div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{sub.used}</span>
            <span style={{ fontSize: 14, color: '#45607a', fontWeight: 600 }}>/ {sub.limit}</span>
            <span style={{ fontSize: 11, color: '#45607a', marginLeft: 4 }}>BOEs this month</span>
          </div>
          <div style={{ background: 'rgba(30,37,64,0.8)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 4, transition: 'width 0.4s ease',
              width: `${sub.percent || 0}%`,
              background: sub.blocked ? '#f87171' : sub.percent >= 80 ? '#f97316' : `linear-gradient(90deg, ${meta.color}, ${meta.color}cc)`,
            }} />
          </div>
          {sub.blocked && (
            <div style={{ fontSize: 11, color: '#f87171', fontWeight: 600 }}>
              Limit reached — BOE generation paused
            </div>
          )}
          {(sub.blocked || sub.warning) && isOwner && plan !== 'enterprise' && (
            <button
              onClick={() => onNavigate('checkout')}
              style={{ ...btnPrimary, marginTop: 4, fontSize: 12, padding: '6px 14px', minHeight: 32 }}
              onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
              onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
            >Upgrade Plan</button>
          )}
        </>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div
      style={{
        background: 'rgba(10,18,32,0.85)',
        border: '1px solid rgba(30,58,95,0.55)',
        borderRadius: 16,
        padding: '20px 24px',
        display: 'flex', flexDirection: 'column', gap: 10,
        transition: 'all 0.2s ease',
        cursor: 'default',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px ${accent}22` }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.25)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: accent + '18', border: `1px solid ${accent}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
          {icon}
        </div>
        <span style={{ fontSize: 11, color: '#8fa3bd', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: accent, lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: 11, color: '#45607a' }}>{sub}</div>
    </div>
  )
}

function QuickBtn({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'rgba(10,18,32,0.85)',
        border: '1px solid rgba(30,58,95,0.55)',
        borderRadius: 12,
        padding: '12px 18px',
        display: 'flex', alignItems: 'center', gap: 10,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        minWidth: 150,
        fontFamily: 'inherit',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(233,186,76,0.3)'; e.currentTarget.style.background = 'rgba(233,186,76,0.04)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(30,58,95,0.55)'; e.currentTarget.style.background = 'rgba(10,18,32,0.85)' }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#8fa3bd' }}>{label}</span>
    </button>
  )
}

function StatusBadge({ status }) {
  const map = {
    draft:     { color: '#8fa3bd', bg: 'rgba(143,163,189,0.1)' },
    submitted: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
    approved:  { color: '#34d399', bg: 'rgba(52,211,153,0.1)'  },
  }
  const s = map[status] || map.draft
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '3px 9px', textTransform: 'uppercase', letterSpacing: '0.06em', border: `1px solid ${s.color}33` }}>
      {status}
    </span>
  )
}

function ErrBox({ children }) {
  return (
    <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 10, padding: '10px 16px', marginBottom: 20, fontSize: 13, color: '#fca5a5' }}>
      {children}
    </div>
  )
}

/* ── Styles ── */
const page = {
  minHeight: '100vh', background: '#06090f',
  fontFamily: "'DM Sans', -apple-system, sans-serif",
  color: '#eef2f7', padding: '32px 24px 80px',
  maxWidth: 1100, margin: '0 auto',
}
const headerWrap = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  flexWrap: 'wrap', gap: 16, marginBottom: 32,
  paddingBottom: 28, borderBottom: '1px solid rgba(30,58,95,0.4)',
}
const avatarBox = {
  width: 52, height: 52, borderRadius: 14,
  background: 'linear-gradient(135deg, #1e3a5f, #0f2040)',
  border: '1.5px solid rgba(233,186,76,0.25)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
}
const rolePill = {
  background: 'rgba(233,186,76,0.1)', color: '#e9ba4c',
  border: '1px solid rgba(233,186,76,0.2)',
  borderRadius: 20, padding: '2px 9px', fontSize: 11, fontWeight: 700,
  letterSpacing: '0.04em',
}
const statsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: 16, marginBottom: 20,
}
const card = {
  background: 'rgba(10,18,32,0.85)',
  border: '1px solid rgba(30,58,95,0.55)',
  borderRadius: 16, overflow: 'hidden',
  marginBottom: 20,
  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
}
const cardHeader = {
  background: 'rgba(6,9,15,0.45)',
  borderBottom: '1px solid rgba(30,58,95,0.55)',
  padding: '13px 20px',
  display: 'flex', alignItems: 'center', gap: 9,
}
const btnPrimary = {
  background: 'linear-gradient(135deg, #e9ba4c, #c8921a)',
  border: 'none', borderRadius: 10, padding: '10px 20px',
  fontSize: 13, fontWeight: 700, color: '#06090f', cursor: 'pointer',
  minHeight: 40, display: 'inline-flex', alignItems: 'center', gap: 6,
  transition: 'all 0.18s ease', fontFamily: 'inherit',
}
const emptyState = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  padding: '48px 20px', textAlign: 'center',
}
const tbl  = { width: '100%', borderCollapse: 'collapse', fontSize: 13 }
const th   = {
  textAlign: 'left', padding: '10px 14px',
  color: '#45607a', fontWeight: 700, fontSize: 10,
  textTransform: 'uppercase', letterSpacing: '0.09em',
  borderBottom: '1px solid rgba(30,58,95,0.4)',
  background: 'rgba(6,9,15,0.35)',
}
const td   = {
  padding: '12px 14px', color: '#8fa3bd',
  borderBottom: '1px solid rgba(30,58,95,0.25)',
  verticalAlign: 'middle', transition: 'background 0.1s',
}
