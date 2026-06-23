import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import {
  LayoutDashboard, BarChart2, Users, Building2, CreditCard,
  Wallet, FileText, Shield, Settings, HelpCircle, Bell,
  Search, Menu, X, ChevronLeft, TrendingUp, TrendingDown,
  Activity, AlertTriangle, CheckCircle, XCircle,
  LogOut, Database, Zap, Globe, Home, ExternalLink,
  RefreshCw, Copy, ArrowRight,
} from 'lucide-react'
import RecentActivityWidget, { AuditKpiWidgets, MostActiveUsersWidget } from '../components/activity/RecentActivityWidget.jsx'
import ActivityCenter from './ActivityCenter.jsx'
import ExecutiveDashboard from '../components/executive/ExecutiveDashboard.jsx'
import ReviewCenter    from '../components/review/ReviewCenter.jsx'
import ShadowDashboard from '../components/shadow/ShadowDashboard.jsx'

/* ── Responsive hook ──────────────────────────────────────── */
function useIsMobile(bp = 768) {
  const [m, setM] = useState(() => window.innerWidth < bp)
  useEffect(() => {
    const h = () => setM(window.innerWidth < bp)
    window.addEventListener('resize', h, { passive: true })
    return () => window.removeEventListener('resize', h)
  }, [bp])
  return m
}

/* ── Constants ────────────────────────────────────────────── */
const API        = '/api/admin'
const PLAN_PRICE = { free: 0, starter: 49, professional: 149, enterprise: 499 }
const PLAN_COLOR = { free: '#45607a', starter: '#3b82f6', professional: '#8b5cf6', enterprise: '#e9ba4c' }
const PLAN_BOES  = { free: '5/mo', starter: '50/mo', professional: 'Unlimited', enterprise: 'Unlimited' }
const PLIMIT     = 20

const ROLE_COLOR      = { super_admin: '#f97316', company_owner: '#e9ba4c', clearing_agent: '#60a5fa', clerk: '#a78bfa' }
const STATUS_COLOR    = { active: '#4ade80', suspended: '#f87171', inactive: '#45607a' }
const LOG_LEVEL_COLOR = { info: '#60a5fa', warn: '#f97316', error: '#f87171' }
const PAY_STATUS_COLOR  = { completed: '#4ade80', failed: '#f87171', processing: '#60a5fa', pending: '#f59e0b', cancelled: '#45607a' }
const PAY_METHOD_COLOR  = { ecocash: '#4ade80', zipit: '#60a5fa', visa: '#818cf8', mastercard: '#f97316' }
const PAY_METHOD_LABEL  = { ecocash: 'EcoCash', zipit: 'ZIPIT', visa: 'Visa', mastercard: 'Mastercard' }

function roleColor(r)   { return ROLE_COLOR[r]   || '#45607a' }
function statusColor(s) { return STATUS_COLOR[s]  || '#45607a' }

/* ── Auth + API ───────────────────────────────────────────── */
function authHeaders() {
  const t = localStorage.getItem('lunarae_auth_token')
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) }
}
async function apiFetch(path, opts = {}) {
  const res  = await fetch(path, { ...opts, headers: { ...authHeaders(), ...(opts.headers || {}) } })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

/* ── Formatters ───────────────────────────────────────────── */
function fmt(n)         { return Number(n || 0).toLocaleString() }
function fmtMoney(n)    { return `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}` }
function fmtDate(d)     { return d ? new Date(d).toLocaleDateString() : '—' }
function fmtDateTime(d) { return d ? new Date(d).toLocaleString()     : '—' }
function timeAgo(d) {
  if (!d) return '—'
  const mins = Math.floor((Date.now() - new Date(d)) / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

/* ══════════════════════════════════════════════════════════
   DESIGN SYSTEM
   ══════════════════════════════════════════════════════════ */

function StatusBadge({ label, color }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: color + '1e', color, border: `1px solid ${color}40`,
      letterSpacing: '0.03em', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {label}
    </span>
  )
}

function KpiCard({ Icon, label, value, trend, accent = '#eef2f7', sub }) {
  const up = trend > 0
  return (
    <div style={{
      background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(30,58,95,0.55)',
      borderRadius: 16, padding: '20px 22px', minWidth: 0, position: 'relative', overflow: 'hidden',
      transition: 'border-color 0.2s, transform 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(233,186,76,0.22)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(30,58,95,0.55)';   e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div style={{ position: 'absolute', top: -24, right: -24, width: 80, height: 80, borderRadius: '50%', background: accent + '0a', filter: 'blur(20px)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: accent + '12', border: `1px solid ${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {Icon && <Icon size={17} color={accent} strokeWidth={1.8} />}
        </div>
        {trend !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: up ? '#4ade80' : '#f87171' }}>
            {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {up ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: accent, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 5 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#45607a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#2a3d52', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 52 }}>
      <div style={{ width: 28, height: 28, border: '2px solid rgba(30,58,95,0.4)', borderTopColor: '#e9ba4c', borderRadius: '50%', animation: 'sa-spin 0.7s linear infinite' }} />
    </div>
  )
}

function ErrBox({ msg }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', color: '#fca5a5', background: 'rgba(248,113,113,0.07)', borderRadius: 12, border: '1px solid rgba(248,113,113,0.18)', fontSize: 13 }}>
      <AlertTriangle size={15} color="#f87171" strokeWidth={2} style={{ flexShrink: 0 }} />
      {msg}
    </div>
  )
}

function Toast({ msg, err }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: err ? 'rgba(90,20,20,0.97)' : 'rgba(16,60,30,0.97)',
      border: `1px solid ${err ? '#f87171' : '#4ade80'}35`,
      borderRadius: 12, padding: '12px 18px', fontSize: 13,
      color: err ? '#fca5a5' : '#86efac', fontWeight: 600,
      boxShadow: '0 12px 40px rgba(0,0,0,0.55)', backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      {err ? <XCircle size={14} /> : <CheckCircle size={14} />}
      {msg}
    </div>
  )
}

function Modal({ children, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(3,6,14,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#0a1220', border: '1px solid rgba(30,58,95,0.7)', borderRadius: 18, padding: '28px', width: '100%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

function ActionBtn({ label, color, onClick, Icon }) {
  return (
    <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: color + '14', border: `1px solid ${color}35`, borderRadius: 7, padding: '5px 11px', fontSize: 11, fontWeight: 700, color, cursor: 'pointer', transition: 'all 0.15s', minHeight: 30 }}
      onMouseEnter={e => { e.currentTarget.style.background = color + '28'; e.currentTarget.style.borderColor = color + '60' }}
      onMouseLeave={e => { e.currentTarget.style.background = color + '14'; e.currentTarget.style.borderColor = color + '35' }}
    >
      {Icon && <Icon size={11} strokeWidth={2} />}{label}
    </button>
  )
}

function Pagination({ page, total, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20 }}>
      <button onClick={() => onChange(p => Math.max(1, p - 1))} disabled={page === 1} style={btnSecondary}>← Prev</button>
      <span style={{ color: '#2a3d52', fontSize: 12, minWidth: 100, textAlign: 'center' }}>Page {page} of {total}</span>
      <button onClick={() => onChange(p => Math.min(total, p + 1))} disabled={page === total} style={btnSecondary}>Next →</button>
    </div>
  )
}

function EmptyState({ Icon: Ic, title, desc }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      {Ic && <Ic size={36} color="#1e3a5f" style={{ margin: '0 auto 14px', display: 'block' }} />}
      <div style={{ fontSize: 14, fontWeight: 600, color: '#2a3d52', marginBottom: 5 }}>{title}</div>
      {desc && <div style={{ fontSize: 12, color: '#1e3a5f' }}>{desc}</div>}
    </div>
  )
}

/* ── Charts ───────────────────────────────────────────────── */
function BarChart({ data, xKey = 'date', yKey = 'count', color = '#e9ba4c', height = 120 }) {
  if (!data?.length) return <EmptyState Icon={BarChart2} title="No chart data" />
  const max = Math.max(...data.map(d => d[yKey]), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height, padding: '0 4px' }}>
      {data.map((d, i) => (
        <div key={i} title={`${d[xKey]}: ${d[yKey]}`} style={{ flex: '1 1 0', minWidth: 4, maxWidth: 22, background: `linear-gradient(to top, ${color}cc, ${color}77)`, height: `${Math.max(4, (d[yKey] / max) * height)}px`, borderRadius: '2px 2px 0 0', opacity: 0.82, cursor: 'default', transition: 'opacity 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '0.82' }}
        />
      ))}
    </div>
  )
}

function HBar({ data, color = '#e9ba4c' }) {
  if (!data?.length) return <EmptyState Icon={BarChart2} title="No data" />
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 120, fontSize: 11, color: '#8fa3bd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>{d.company_name}</div>
          <div style={{ flex: 1, background: 'rgba(30,58,95,0.35)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
            <div style={{ width: `${(d.count / max) * 100}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ width: 28, fontSize: 11, color: '#eef2f7', fontWeight: 700, textAlign: 'right', flexShrink: 0 }}>{d.count}</div>
        </div>
      ))}
    </div>
  )
}

function AlertItem({ level = 'info', msg }) {
  const cfg = {
    warn:  { color: '#f97316', Ic: AlertTriangle },
    error: { color: '#f87171', Ic: XCircle       },
    info:  { color: '#4ade80', Ic: CheckCircle   },
  }
  const { color, Ic } = cfg[level] || cfg.info
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: color + '0d', border: `1px solid ${color}25`, borderRadius: 10 }}>
      <Ic size={14} color={color} strokeWidth={2} style={{ marginTop: 1, flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: level === 'info' ? '#8fa3bd' : color, lineHeight: 1.55 }}>{msg}</span>
    </div>
  )
}

function HealthRow({ Icon: Ic, label, ok = true }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid rgba(30,58,95,0.2)' }}>
      <Ic size={14} color="#2a3d52" strokeWidth={1.8} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 13, color: '#8fa3bd' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: ok ? '#4ade80' : '#f87171', boxShadow: ok ? '0 0 6px #4ade8088' : '0 0 6px #f8717188' }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: ok ? '#4ade80' : '#f87171' }}>{ok ? 'Operational' : 'Down'}</span>
      </div>
    </div>
  )
}

/* ── Card shell ───────────────────────────────────────────── */
const cardStyle = { background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(30,58,95,0.55)', borderRadius: 16, overflow: 'hidden' }

function SectionCard({ title, Icon: Ic, children, action }) {
  return (
    <div style={cardStyle}>
      <div style={{ padding: '16px 22px 12px', borderBottom: '1px solid rgba(30,58,95,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          {Ic && <Ic size={15} color="#45607a" strokeWidth={1.8} />}
          <span style={{ fontSize: 14, fontWeight: 700, color: '#eef2f7' }}>{title}</span>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

/* ── Style primitives ─────────────────────────────────────── */
const tbl        = { width: '100%', borderCollapse: 'collapse', fontSize: 13 }
const th         = { textAlign: 'left', padding: '10px 14px', color: '#2a3d52', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.09em', borderBottom: '1px solid rgba(30,58,95,0.4)', background: 'rgba(6,9,15,0.35)' }
const td         = { padding: '12px 14px', color: '#8fa3bd', verticalAlign: 'middle', borderBottom: '1px solid rgba(30,58,95,0.25)' }
const inputSm    = { background: 'rgba(6,9,15,0.6)', border: '1px solid rgba(30,58,95,0.55)', borderRadius: 10, padding: '9px 13px', fontSize: 13, color: '#eef2f7', outline: 'none', minWidth: 150, fontFamily: 'inherit' }
const inp        = { display: 'block', marginTop: 6, width: '100%', background: 'rgba(6,9,15,0.7)', border: '1px solid rgba(30,58,95,0.65)', borderRadius: 10, padding: '10px 13px', fontSize: 13, color: '#eef2f7', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }
const lbl        = { display: 'block', fontSize: 11, color: '#45607a', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 2 }
const btnPrimary   = { background: 'linear-gradient(135deg,#e9ba4c,#c8921a)', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, color: '#06090f', cursor: 'pointer', minHeight: 40, display: 'inline-flex', alignItems: 'center', gap: 6 }
const btnSecondary = { background: 'rgba(10,18,32,0.8)', border: '1px solid rgba(30,58,95,0.55)', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 600, color: '#8fa3bd', cursor: 'pointer', minHeight: 40, display: 'inline-flex', alignItems: 'center', gap: 6 }
const sH2        = { color: '#eef2f7', fontSize: 22, fontWeight: 800, margin: '0 0 5px', letterSpacing: '-0.02em' }
const filterRow  = { display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }

/* ══════════════════════════════════════════════════════════
   DASHBOARD
   ══════════════════════════════════════════════════════════ */
function SectionDashboard({ goSection }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [err,     setErr]     = useState(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    apiFetch(`${API}/dashboard`)
      .then(setData)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (err)     return <ErrBox msg={err} />

  const { stats, recent_users = [], recent_boes = [], revenue_breakdown = [] } = data

  const feed = [
    ...recent_users.map(u => ({ Icon: Users,    color: '#60a5fa', label: 'New signup',   name: u.full_name, sub: u.email,                            ts: u.created_at })),
    ...recent_boes .map(b => ({ Icon: FileText, color: '#e9ba4c', label: 'BOE created',  name: b.importer || 'Unknown', sub: `$${Number(b.total_payable || 0).toFixed(0)} payable`, ts: b.created_at })),
  ].sort((a, b) => new Date(b.ts) - new Date(a.ts)).slice(0, 12)

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={sH2}>Dashboard</h1>
        <p style={{ fontSize: 13, color: '#45607a', margin: 0 }}>Platform overview and key metrics</p>
      </div>

      {/* ── 6 KPI cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 16, marginBottom: 28 }}>
        <KpiCard Icon={Users}        label="Total Users"      value={fmt(stats.total_users)}          accent="#eef2f7" />
        <KpiCard Icon={Activity}     label="Active Users"     value={fmt(stats.active_users)}         accent="#4ade80" />
        <KpiCard Icon={Building2}    label="Companies"        value={fmt(stats.companies)}            accent="#60a5fa" />
        <KpiCard Icon={FileText}     label="BOEs Generated"   value={fmt(stats.boes_generated)}       accent="#e9ba4c" />
        <KpiCard Icon={Globe}        label="XML Exports"      value={fmt(stats.xml_downloads)}        accent="#a78bfa" />
        <KpiCard Icon={Wallet}       label="Monthly Revenue"  value={fmtMoney(stats.monthly_revenue)} accent="#e9ba4c" />
        <AuditKpiWidgets onNavigate={goSection} />
      </div>

      {/* ── Activity + Revenue ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 20 }}>
        {/* Activity feed */}
        <SectionCard title="Recent Activity" Icon={Activity} style={{ flex: '2 1 400px' }}>
          <div>
            {feed.length === 0 ? (
              <EmptyState Icon={Activity} title="No recent activity" />
            ) : feed.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 22px', borderBottom: i < feed.length - 1 ? '1px solid rgba(30,58,95,0.18)' : 'none', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(233,186,76,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <div style={{ width: 34, height: 34, borderRadius: 9, background: item.color + '14', border: `1px solid ${item.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <item.Icon size={15} color={item.color} strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: '#2a3d52', marginBottom: 1 }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#eef2f7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: '#45607a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.sub}</div>
                </div>
                <div style={{ fontSize: 11, color: '#2a3d52', flexShrink: 0 }}>{timeAgo(item.ts)}</div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Revenue by plan */}
        <div style={{ ...cardStyle, flex: '1 1 260px' }}>
          <div style={{ padding: '16px 22px 12px', borderBottom: '1px solid rgba(30,58,95,0.35)', display: 'flex', alignItems: 'center', gap: 9 }}>
            <Wallet size={15} color="#45607a" strokeWidth={1.8} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#eef2f7' }}>Revenue by Plan</span>
          </div>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {revenue_breakdown.length === 0
              ? <EmptyState Icon={Wallet} title="No revenue data" />
              : revenue_breakdown.map(r => (
                <div key={r.plan} style={{ padding: '12px 14px', borderRadius: 12, background: (PLAN_COLOR[r.plan] || '#45607a') + '10', border: `1px solid ${(PLAN_COLOR[r.plan] || '#45607a')}22` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: PLAN_COLOR[r.plan] || '#45607a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{r.plan}</span>
                    <span style={{ fontSize: 11, color: '#45607a' }}>{r.count} co.</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#eef2f7', letterSpacing: '-0.02em' }}>
                    {fmtMoney(r.revenue)}<span style={{ fontSize: 11, fontWeight: 400, color: '#45607a' }}>/mo</span>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* ── Recent Users table ── */}
      <SectionCard title="Recent Signups" Icon={Users} style={{ marginBottom: 20 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={tbl}>
            <thead><tr>
              <th style={th}>User</th><th style={th}>Role</th><th style={th}>Status</th><th style={th}>Joined</th>
            </tr></thead>
            <tbody>
              {recent_users.map(u => (
                <tr key={u.id}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(233,186,76,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(30,58,95,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#e9ba4c', flexShrink: 0 }}>
                        {(u.full_name || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#eef2f7', fontSize: 13 }}>{u.full_name}</div>
                        <div style={{ fontSize: 11, color: '#2a3d52' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={td}><StatusBadge label={u.role}   color={roleColor(u.role)} /></td>
                  <td style={td}><StatusBadge label={u.status} color={statusColor(u.status)} /></td>
                  <td style={{ ...td, fontSize: 12 }}>{fmtDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ── Recent BOEs table ── */}
      <SectionCard title="Recent BOEs" Icon={FileText} style={{ marginBottom: 28 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={tbl}>
            <thead><tr>
              <th style={th}>Importer</th><th style={th}>Exporter</th><th style={th}>Company</th><th style={th}>Total Payable</th><th style={th}>Date</th>
            </tr></thead>
            <tbody>
              {recent_boes.map(b => (
                <tr key={b.id}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(233,186,76,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <td style={{ ...td, fontWeight: 600, color: '#eef2f7' }}>{b.importer || '—'}</td>
                  <td style={td}>{b.exporter || '—'}</td>
                  <td style={{ ...td, fontSize: 12 }}>{b.company_name || '—'}</td>
                  <td style={{ ...td, fontWeight: 700, color: '#e9ba4c' }}>${Number(b.total_payable || 0).toFixed(2)}</td>
                  <td style={{ ...td, fontSize: 12 }}>{fmtDate(b.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ── Alerts + System Health ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 20 }}>
        <SectionCard title="Compliance Alerts" Icon={AlertTriangle} style={{ flex: '2 1 340px' }}>
          <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {revenue_breakdown.filter(r => r.plan === 'free' && r.count > 0).map(r => (
              <AlertItem key="free" level="warn" msg={`${r.count} compan${r.count === 1 ? 'y' : 'ies'} on Free plan — consider upgrade outreach`} />
            ))}
            <AlertItem level="info" msg="No critical compliance alerts — platform running normally" />
          </div>
        </SectionCard>

        <div style={{ ...cardStyle, flex: '1 1 260px' }}>
          <div style={{ padding: '16px 22px 12px', borderBottom: '1px solid rgba(30,58,95,0.35)', display: 'flex', alignItems: 'center', gap: 9 }}>
            <Activity size={15} color="#45607a" strokeWidth={1.8} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#eef2f7' }}>System Health</span>
          </div>
          <div style={{ padding: '6px 22px 14px' }}>
            <HealthRow Icon={Globe}    label="API Gateway"     ok />
            <HealthRow Icon={Database} label="Database"        ok />
            <HealthRow Icon={Zap}      label="AI Service"      ok />
            <HealthRow Icon={Shield}   label="Auth Service"    ok />
            <HealthRow Icon={Activity} label="Background Jobs" ok />
          </div>
        </div>
      </div>

      {/* ── Audit Activity Widgets ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
        <div style={{ flex: '2 1 380px' }}>
          <RecentActivityWidget limit={12} onNavigate={goSection} />
        </div>
        <div style={{ flex: '1 1 280px' }}>
          <MostActiveUsersWidget onNavigate={goSection} />
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   ANALYTICS
   ══════════════════════════════════════════════════════════ */
function SectionAnalytics() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch(`${API}/analytics`).then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (!data)   return <ErrBox msg="Could not load analytics" />

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={sH2}>Analytics</h1>
        <p style={{ fontSize: 13, color: '#45607a', margin: 0 }}>Deep insights across users, BOEs, and subscriptions</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        <SectionCard title="BOEs Generated — Last 30 Days" Icon={FileText}>
          <div style={{ padding: '16px 20px' }}>
            <BarChart data={data.boes_per_day} color="#e9ba4c" />
          </div>
        </SectionCard>

        <SectionCard title="User Registrations — Last 30 Days" Icon={Users}>
          <div style={{ padding: '16px 20px' }}>
            <BarChart data={data.users_per_day} color="#60a5fa" />
          </div>
        </SectionCard>

        <SectionCard title="BOEs by Company (Top 10)" Icon={Building2}>
          <div style={{ padding: '16px 20px' }}>
            <HBar data={data.boes_by_company} color="#e9ba4c" />
          </div>
        </SectionCard>

        <SectionCard title="Users by Company (Top 10)" Icon={Building2}>
          <div style={{ padding: '16px 20px' }}>
            <HBar data={data.users_by_company} color="#60a5fa" />
          </div>
        </SectionCard>

        <SectionCard title="User Role Distribution" Icon={Users}>
          <div style={{ padding: '16px 20px' }}>
            <HBar data={data.role_dist.map(r => ({ company_name: r.role, count: r.count }))} color="#8b5cf6" />
          </div>
        </SectionCard>

        <SectionCard title="Subscription Plan Distribution" Icon={CreditCard}>
          <div style={{ padding: '16px 20px' }}>
            <HBar data={data.plan_dist.map(r => ({ company_name: r.subscription_plan, count: r.count }))} color="#4ade80" />
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   USERS
   ══════════════════════════════════════════════════════════ */
function SectionUsers() {
  const [users,        setUsers]   = useState([])
  const [total,        setTotal]   = useState(0)
  const [page,         setPage]    = useState(1)
  const [search,       setSearch]  = useState('')
  const [roleFilter,   setRole]    = useState('')
  const [statusFilter, setStatus]  = useState('')
  const [loading,      setLoading] = useState(true)
  const [toast,        setToast]   = useState(null)
  const [resetModal,   setReset]   = useState(null)
  const isMobile = useIsMobile()
  const LIMIT = 50

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ page, limit: LIMIT })
      if (search)      p.set('search', search)
      if (roleFilter)  p.set('role', roleFilter)
      if (statusFilter) p.set('status', statusFilter)
      const d = await apiFetch(`${API}/users?${p}`)
      setUsers(d.users); setTotal(d.total)
    } catch (e) { setToast({ msg: e.message, err: true }) }
    finally { setLoading(false) }
  }, [page, search, roleFilter, statusFilter])

  useEffect(() => { load() }, [load])

  function notify(msg, err = false) {
    setToast({ msg, err })
    setTimeout(() => setToast(null), 3000)
  }

  async function changeStatus(id, status) {
    try {
      await apiFetch(`${API}/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
      notify(`User ${status}`)
      load()
    } catch (e) { notify(e.message, true) }
  }

  async function deleteUser(id, name) {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return
    try {
      await apiFetch(`${API}/users/${id}`, { method: 'DELETE' })
      notify('User deleted')
      load()
    } catch (e) { notify(e.message, true) }
  }

  async function resetPwd(id) {
    try { setReset(await apiFetch(`${API}/users/${id}/reset-password`, { method: 'POST' })) }
    catch (e) { notify(e.message, true) }
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h1 style={sH2}>Users <span style={{ fontSize: 16, color: '#45607a', fontWeight: 500 }}>({fmt(total)})</span></h1>
        <p style={{ fontSize: 13, color: '#45607a', margin: 0 }}>Manage user accounts, roles, and access</p>
      </div>

      {toast && <Toast msg={toast.msg} err={toast.err} />}

      <div style={filterRow}>
        <input placeholder="Search name or email…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} style={{ ...inputSm, flex: '1 1 200px' }} />
        <select value={roleFilter}   onChange={e => { setRole(e.target.value);   setPage(1) }} style={inputSm}>
          <option value="">All roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="company_owner">Company Owner</option>
          <option value="clearing_agent">Clearing Agent</option>
          <option value="clerk">Clerk</option>
        </select>
        <select value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(1) }} style={inputSm}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? <Spinner /> : (
        <>
          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {users.map(u => (
                <div key={u.id} style={{ ...cardStyle, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 11, background: 'rgba(30,58,95,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: '#e9ba4c', flexShrink: 0 }}>
                      {(u.full_name || 'U')[0].toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#eef2f7', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.full_name}</div>
                      <div style={{ fontSize: 12, color: '#45607a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                    <StatusBadge label={u.role}   color={roleColor(u.role)} />
                    <StatusBadge label={u.status} color={statusColor(u.status)} />
                    {u.company_name && <StatusBadge label={u.company_name} color="#45607a" />}
                  </div>
                  <div style={{ fontSize: 11, color: '#2a3d52', marginBottom: 12 }}>Last login: {fmtDateTime(u.last_login)}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {u.status === 'active'
                      ? <ActionBtn label="Suspend"   color="#f97316" onClick={() => changeStatus(u.id, 'suspended')} />
                      : <ActionBtn label="Activate"  color="#4ade80" onClick={() => changeStatus(u.id, 'active')} />}
                    <ActionBtn label="Reset PWD" color="#60a5fa" onClick={() => resetPwd(u.id)} />
                    <ActionBtn label="Delete"    color="#f87171" onClick={() => deleteUser(u.id, u.full_name)} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ ...cardStyle, overflowX: 'auto' }}>
              <table style={tbl}>
                <thead><tr>
                  <th style={th}>User</th><th style={th}>Company</th><th style={th}>Role</th>
                  <th style={th}>Status</th><th style={th}>Last Login</th><th style={th}>Actions</th>
                </tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(233,186,76,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <td style={td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(30,58,95,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#e9ba4c', flexShrink: 0 }}>
                            {(u.full_name || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#eef2f7' }}>{u.full_name}</div>
                            <div style={{ fontSize: 11, color: '#2a3d52' }}>{u.email}</div>
                            {u.phone && <div style={{ fontSize: 11, color: '#2a3d52' }}>{u.phone}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ ...td, fontSize: 13 }}>{u.company_name || '—'}</td>
                      <td style={td}><StatusBadge label={u.role}   color={roleColor(u.role)} /></td>
                      <td style={td}><StatusBadge label={u.status} color={statusColor(u.status)} /></td>
                      <td style={{ ...td, fontSize: 12 }}>{fmtDateTime(u.last_login)}</td>
                      <td style={td}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {u.status === 'active'
                            ? <ActionBtn label="Suspend"   color="#f97316" onClick={() => changeStatus(u.id, 'suspended')} />
                            : <ActionBtn label="Activate"  color="#4ade80" onClick={() => changeStatus(u.id, 'active')} />}
                          <ActionBtn label="Reset PWD" color="#60a5fa" onClick={() => resetPwd(u.id)} />
                          <ActionBtn label="Delete"    color="#f87171" onClick={() => deleteUser(u.id, u.full_name)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && <Pagination page={page} total={totalPages} onChange={setPage} />}
        </>
      )}

      {resetModal && (
        <Modal onClose={() => setReset(null)}>
          <h3 style={{ color: '#eef2f7', marginBottom: 12, fontSize: 16, fontWeight: 700 }}>Password Reset Code</h3>
          <p style={{ color: '#8fa3bd', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
            Share this code with <strong style={{ color: '#e9ba4c' }}>{resetModal.email}</strong>.<br />
            Valid for 24 hours.
          </p>
          <div style={{ background: 'rgba(6,9,15,0.7)', border: '1px solid rgba(233,186,76,0.3)', borderRadius: 12, padding: '18px 24px', textAlign: 'center', fontSize: 30, fontWeight: 800, letterSpacing: '0.18em', color: '#e9ba4c', fontFamily: 'monospace', marginBottom: 16 }}>
            {resetModal.reset_code}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button onClick={() => setReset(null)} style={btnSecondary}>Close</button>
            <button onClick={() => { navigator.clipboard.writeText(resetModal.reset_code); notify('Copied!') }} style={btnPrimary}>
              <Copy size={13} /> Copy Code
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   COMPANIES
   ══════════════════════════════════════════════════════════ */
function SectionCompanies() {
  const [companies, setCompanies] = useState([])
  const [total,     setTotal]     = useState(0)
  const [page,      setPage]      = useState(1)
  const [search,    setSearch]    = useState('')
  const [planFilter,setPlan]      = useState('')
  const [loading,   setLoading]   = useState(true)
  const [toast,     setToast]     = useState(null)
  const [editing,   setEditing]   = useState(null)
  const [editForm,  setEditForm]  = useState({})
  const isMobile = useIsMobile()
  const LIMIT = 50

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ page, limit: LIMIT })
      if (search)     p.set('search', search)
      if (planFilter) p.set('plan', planFilter)
      const d = await apiFetch(`${API}/companies?${p}`)
      setCompanies(d.companies); setTotal(d.total)
    } catch (e) { setToast({ msg: e.message, err: true }) }
    finally { setLoading(false) }
  }, [page, search, planFilter])

  useEffect(() => { load() }, [load])

  function notify(msg, err = false) { setToast({ msg, err }); setTimeout(() => setToast(null), 3000) }

  async function saveEdit() {
    try {
      await apiFetch(`${API}/companies/${editing.id}`, { method: 'PUT', body: JSON.stringify(editForm) })
      notify('Company updated'); setEditing(null); load()
    } catch (e) { notify(e.message, true) }
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h1 style={sH2}>Companies <span style={{ fontSize: 16, color: '#45607a', fontWeight: 500 }}>({fmt(total)})</span></h1>
        <p style={{ fontSize: 13, color: '#45607a', margin: 0 }}>Manage company accounts and subscription plans</p>
      </div>

      {toast && <Toast msg={toast.msg} err={toast.err} />}

      <div style={filterRow}>
        <input placeholder="Search company…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} style={{ ...inputSm, flex: '1 1 200px' }} />
        <select value={planFilter} onChange={e => { setPlan(e.target.value); setPage(1) }} style={inputSm}>
          <option value="">All plans</option>
          <option value="trial">Trial</option><option value="basic">Basic</option>
          <option value="pro">Pro</option><option value="enterprise">Enterprise</option>
        </select>
      </div>

      {loading ? <Spinner /> : (
        <>
          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {companies.map(c => (
                <div key={c.id} style={{ ...cardStyle, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#eef2f7', fontSize: 14, marginBottom: 3 }}>{c.company_name}</div>
                      {c.contact_email && <div style={{ fontSize: 12, color: '#45607a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.contact_email}</div>}
                    </div>
                    <StatusBadge label={c.subscription_plan} color={PLAN_COLOR[c.subscription_plan] || '#45607a'} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    <div style={{ background: 'rgba(6,9,15,0.5)', borderRadius: 9, padding: '8px 12px' }}>
                      <div style={{ fontSize: 10, color: '#2a3d52', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>Users</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#eef2f7' }}>{c.user_count} / {c.max_users}</div>
                    </div>
                    <div style={{ background: 'rgba(6,9,15,0.5)', borderRadius: 9, padding: '8px 12px' }}>
                      <div style={{ fontSize: 10, color: '#2a3d52', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>BOEs</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#eef2f7' }}>{fmt(c.boe_count)}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#2a3d52', marginBottom: 12 }}>Last active: {fmtDate(c.last_activity)} · Created: {fmtDate(c.created_at)}</div>
                  <ActionBtn label="Edit" color="#60a5fa" onClick={() => { setEditing(c); setEditForm({ company_name: c.company_name, contact_email: c.contact_email || '', subscription_plan: c.subscription_plan, max_users: c.max_users }) }} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ ...cardStyle, overflowX: 'auto' }}>
              <table style={tbl}>
                <thead><tr>
                  <th style={th}>Company</th><th style={th}>Plan</th><th style={th}>Users</th>
                  <th style={th}>BOEs</th><th style={th}>Last Activity</th><th style={th}>Created</th><th style={th}>Actions</th>
                </tr></thead>
                <tbody>
                  {companies.map(c => (
                    <tr key={c.id}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(233,186,76,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <td style={td}>
                        <div style={{ fontWeight: 600, color: '#eef2f7' }}>{c.company_name}</div>
                        {c.contact_email && <div style={{ fontSize: 11, color: '#2a3d52' }}>{c.contact_email}</div>}
                      </td>
                      <td style={td}><StatusBadge label={c.subscription_plan} color={PLAN_COLOR[c.subscription_plan] || '#45607a'} /></td>
                      <td style={td}>{c.user_count} / {c.max_users}</td>
                      <td style={td}>{fmt(c.boe_count)}</td>
                      <td style={{ ...td, fontSize: 12 }}>{fmtDate(c.last_activity)}</td>
                      <td style={{ ...td, fontSize: 12 }}>{fmtDate(c.created_at)}</td>
                      <td style={td}>
                        <ActionBtn label="Edit" color="#60a5fa" onClick={() => { setEditing(c); setEditForm({ company_name: c.company_name, contact_email: c.contact_email || '', subscription_plan: c.subscription_plan, max_users: c.max_users }) }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && <Pagination page={page} total={totalPages} onChange={setPage} />}
        </>
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <h3 style={{ color: '#eef2f7', marginBottom: 18, fontSize: 16, fontWeight: 700 }}>Edit {editing.company_name}</h3>
          <div style={{ display: 'grid', gap: 14 }}>
            <label style={lbl}>Company Name<input value={editForm.company_name} onChange={e => setEditForm(f => ({ ...f, company_name: e.target.value }))} style={inp} /></label>
            <label style={lbl}>Contact Email<input value={editForm.contact_email} onChange={e => setEditForm(f => ({ ...f, contact_email: e.target.value }))} style={inp} placeholder="Optional" /></label>
            <label style={lbl}>Subscription Plan
              <select value={editForm.subscription_plan} onChange={e => setEditForm(f => ({ ...f, subscription_plan: e.target.value }))} style={inp}>
                {Object.entries(PLAN_PRICE).map(([p, price]) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)} — {fmtMoney(price)}/mo</option>
                ))}
              </select>
            </label>
            <label style={lbl}>Max Users<input type="number" min="1" value={editForm.max_users} onChange={e => setEditForm(f => ({ ...f, max_users: e.target.value }))} style={inp} /></label>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
            <button onClick={() => setEditing(null)} style={btnSecondary}>Cancel</button>
            <button onClick={saveEdit} style={btnPrimary}>Save Changes</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   SUBSCRIPTIONS
   ══════════════════════════════════════════════════════════ */
function SectionSubscriptions() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast,   setToast]   = useState(null)
  const [editing, setEditing] = useState(null)
  const [newPlan, setNewPlan] = useState('')

  useEffect(() => {
    apiFetch(`${API}/subscriptions`).then(setData).catch(e => setToast({ msg: e.message, err: true })).finally(() => setLoading(false))
  }, [])

  function notify(msg, err = false) { setToast({ msg, err }); setTimeout(() => setToast(null), 3000) }

  async function changePlan(company_id) {
    try {
      await apiFetch('/api/subscription/plan', { method: 'PUT', body: JSON.stringify({ company_id, plan: newPlan }) })
      notify('Subscription updated'); setEditing(null)
      const d = await apiFetch(`${API}/subscriptions`); setData(d)
    } catch (e) { notify(e.message, true) }
  }

  const totalRevenue = data?.subscriptions?.reduce((s, r) => s + (r.monthly_cost || 0), 0) || 0

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h1 style={sH2}>Subscriptions</h1>
        <p style={{ fontSize: 13, color: '#45607a', margin: 0 }}>Manage company subscription plans and billing</p>
      </div>
      {toast && <Toast msg={toast.msg} err={toast.err} />}

      {!loading && data && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {Object.entries(PLAN_PRICE).map(([plan, price]) => {
            const count = data.subscriptions.filter(s => s.subscription_plan === plan).length
            return (
              <div key={plan} style={{ padding: '14px 20px', borderRadius: 12, minWidth: 140, background: (PLAN_COLOR[plan] || '#45607a') + '12', border: `1px solid ${(PLAN_COLOR[plan] || '#45607a')}28` }}>
                <div style={{ fontSize: 10, color: PLAN_COLOR[plan], textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 700, marginBottom: 4 }}>{plan}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#eef2f7', marginBottom: 2 }}>{count}</div>
                <div style={{ fontSize: 11, color: '#45607a' }}>{fmtMoney(price * count)}/mo · {PLAN_BOES[plan]}</div>
              </div>
            )
          })}
          <div style={{ padding: '14px 20px', borderRadius: 12, minWidth: 140, background: '#e9ba4c12', border: '1px solid #e9ba4c28' }}>
            <div style={{ fontSize: 10, color: '#e9ba4c', textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 700, marginBottom: 4 }}>Total MRR</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#e9ba4c', marginBottom: 2 }}>{fmtMoney(totalRevenue)}</div>
            <div style={{ fontSize: 11, color: '#45607a' }}>Monthly Recurring</div>
          </div>
        </div>
      )}

      {loading ? <Spinner /> : (
        <div style={{ ...cardStyle, overflowX: 'auto' }}>
          <table style={tbl}>
            <thead><tr>
              <th style={th}>Company</th><th style={th}>Plan</th><th style={th}>MRR</th>
              <th style={th}>Users</th><th style={th}>BOEs</th><th style={th}>Since</th><th style={th}>Action</th>
            </tr></thead>
            <tbody>
              {data?.subscriptions?.map(s => (
                <tr key={s.id}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(233,186,76,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <td style={td}>
                    <div style={{ fontWeight: 600, color: '#eef2f7' }}>{s.company_name}</div>
                    {s.contact_email && <div style={{ fontSize: 11, color: '#2a3d52' }}>{s.contact_email}</div>}
                  </td>
                  <td style={td}><StatusBadge label={s.subscription_plan} color={PLAN_COLOR[s.subscription_plan] || '#45607a'} /></td>
                  <td style={{ ...td, fontWeight: 700, color: '#e9ba4c' }}>{fmtMoney(s.monthly_cost)}/mo</td>
                  <td style={td}>{s.user_count} / {s.max_users}</td>
                  <td style={td}>{fmt(s.boe_count)}</td>
                  <td style={{ ...td, fontSize: 12 }}>{fmtDate(s.created_at)}</td>
                  <td style={td}><ActionBtn label="Change Plan" color="#60a5fa" onClick={() => { setEditing(s); setNewPlan(s.subscription_plan) }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <h3 style={{ color: '#eef2f7', marginBottom: 14, fontSize: 16, fontWeight: 700 }}>Change Plan — {editing.company_name}</h3>
          <label style={lbl}>New Plan
            <select value={newPlan} onChange={e => setNewPlan(e.target.value)} style={inp}>
              {Object.entries(PLAN_PRICE).map(([p, price]) => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)} — {fmtMoney(price)}/mo · {PLAN_BOES[p]}</option>
              ))}
            </select>
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
            <button onClick={() => setEditing(null)} style={btnSecondary}>Cancel</button>
            <button onClick={() => changePlan(editing.id)} style={btnPrimary}>Update Plan</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   PAYMENTS
   ══════════════════════════════════════════════════════════ */
function SectionPayments() {
  const [stats,    setStats]    = useState(null)
  const [pays,     setPays]     = useState([])
  const [total,    setTotal]    = useState(0)
  const [page,     setPage]     = useState(1)
  const [status,   setStatus]   = useState('')
  const [method,   setMethod]   = useState('')
  const [search,   setSearch]   = useState('')
  const [loading,  setLoading]  = useState(true)
  const [sLoading, setSLoading] = useState(true)
  const [err,      setErr]      = useState(null)

  const loadStats = useCallback(async () => {
    setSLoading(true)
    try { setStats(await apiFetch(`${API}/payments/stats`)) } catch {}
    finally { setSLoading(false) }
  }, [])

  const loadPays = useCallback(async () => {
    setLoading(true); setErr(null)
    try {
      const p = new URLSearchParams({ page, limit: PLIMIT })
      if (status) p.set('status', status)
      if (method) p.set('method', method)
      if (search) p.set('search', search)
      const d = await apiFetch(`${API}/payments?${p}`)
      setPays(d.payments); setTotal(d.total)
    } catch (e) { setErr(e.message) }
    finally { setLoading(false) }
  }, [page, status, method, search])

  useEffect(() => { loadStats() }, [loadStats])
  useEffect(() => { loadPays() },  [loadPays])

  const totalPages = Math.ceil(total / PLIMIT)

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h1 style={sH2}>Payments</h1>
        <p style={{ fontSize: 13, color: '#45607a', margin: 0 }}>Transaction history and payment analytics</p>
      </div>

      {sLoading ? <Spinner /> : stats && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 14, marginBottom: 24 }}>
            <KpiCard Icon={Wallet}     label="Total Revenue"  value={fmtMoney(stats.totals?.total_revenue)}  accent="#e9ba4c" />
            <KpiCard Icon={TrendingUp} label="Month Revenue"  value={fmtMoney(stats.totals?.month_revenue)}  accent="#4ade80" />
            <KpiCard Icon={CheckCircle} label="Completed"     value={fmt(stats.totals?.completed)}           accent="#4ade80" />
            <KpiCard Icon={XCircle}    label="Failed"         value={fmt(stats.totals?.failed)}              accent="#f87171" />
            <KpiCard Icon={Activity}   label="Processing"     value={fmt(stats.totals?.processing)}          accent="#60a5fa" />
            <KpiCard Icon={CreditCard} label="Total"          value={fmt(stats.totals?.total)}               accent="#8fa3bd" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
            <SectionCard title="Daily Revenue (30 days)" Icon={BarChart2}>
              <div style={{ padding: '16px 20px' }}>
                <BarChart data={stats.daily} xKey="date" yKey="revenue" color="#e9ba4c" height={110} />
              </div>
            </SectionCard>
            <SectionCard title="Revenue by Method" Icon={Wallet}>
              <div style={{ padding: '16px 20px' }}>
                {stats.by_method?.length ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {stats.by_method.map(m => (
                      <div key={m.method} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <StatusBadge label={PAY_METHOD_LABEL[m.method] || m.method} color={PAY_METHOD_COLOR[m.method] || '#8fa3bd'} />
                        <span style={{ color: '#e9ba4c', fontWeight: 700, fontSize: 14 }}>{fmtMoney(m.revenue)}</span>
                        <span style={{ color: '#45607a', fontSize: 12 }}>({fmt(m.count)} txn)</span>
                      </div>
                    ))}
                  </div>
                ) : <EmptyState Icon={Wallet} title="No data" />}
              </div>
            </SectionCard>
          </div>

          {stats.failed_companies?.length > 0 && (
            <div style={{ ...cardStyle, marginBottom: 24, borderColor: 'rgba(248,113,113,0.25)' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(248,113,113,0.15)' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#f87171' }}>Companies with Failed Payments</span>
              </div>
              <div style={{ padding: '12px 20px', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {stats.failed_companies.map(c => (
                  <div key={c.company_id} style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 9, padding: '8px 14px', fontSize: 12 }}>
                    <span style={{ color: '#eef2f7', fontWeight: 600 }}>{c.company_name}</span>
                    <span style={{ color: '#f87171', marginLeft: 8 }}>{fmt(c.failed_count)} failed</span>
                    <span style={{ color: '#45607a', marginLeft: 8 }}>{fmtMoney(c.failed_amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div style={filterRow}>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} style={inputSm}>
          <option value="">All statuses</option>
          <option value="completed">Completed</option><option value="processing">Processing</option>
          <option value="failed">Failed</option><option value="pending">Pending</option>
        </select>
        <select value={method} onChange={e => { setMethod(e.target.value); setPage(1) }} style={inputSm}>
          <option value="">All methods</option>
          <option value="ecocash">EcoCash</option><option value="zipit">ZIPIT</option>
          <option value="visa">Visa</option><option value="mastercard">Mastercard</option>
        </select>
        <input placeholder="Search company…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} style={{ ...inputSm, flex: '1 1 160px' }} />
        <button onClick={() => { loadPays(); loadStats() }} style={btnSecondary}><RefreshCw size={13} />Refresh</button>
      </div>

      {err && <ErrBox msg={err} />}
      {loading ? <Spinner /> : (
        <>
          <div style={{ ...cardStyle, overflowX: 'auto' }}>
            <table style={tbl}>
              <thead><tr>
                <th style={th}>Invoice</th><th style={th}>Company</th><th style={th}>Method</th>
                <th style={th}>Plan</th><th style={th}>Amount</th><th style={th}>Status</th>
                <th style={th}>Ref</th><th style={th}>Date</th>
              </tr></thead>
              <tbody>
                {pays.length === 0 ? (
                  <tr><td colSpan={8} style={{ ...td, textAlign: 'center', padding: 32, color: '#2a3d52' }}>No payments found</td></tr>
                ) : pays.map(p => (
                  <tr key={p.id}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(233,186,76,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={{ ...td, fontFamily: 'monospace', fontSize: 12, color: '#eef2f7' }}>{p.invoice_number || `#${p.invoice_id}`}</td>
                    <td style={{ ...td, fontWeight: 600, color: '#eef2f7' }}>{p.company_name}</td>
                    <td style={td}><StatusBadge label={PAY_METHOD_LABEL[p.payment_method] || p.payment_method} color={PAY_METHOD_COLOR[p.payment_method] || '#8fa3bd'} /></td>
                    <td style={td}>{p.plan ? <StatusBadge label={p.plan} color={PLAN_COLOR[p.plan] || '#45607a'} /> : '—'}</td>
                    <td style={{ ...td, fontWeight: 700, color: '#e9ba4c' }}>{fmtMoney(p.amount)}</td>
                    <td style={td}><StatusBadge label={p.status} color={PAY_STATUS_COLOR[p.status] || '#45607a'} /></td>
                    <td style={{ ...td, fontSize: 11, fontFamily: 'monospace', color: '#45607a' }}>{p.gateway_reference || '—'}</td>
                    <td style={{ ...td, fontSize: 11, whiteSpace: 'nowrap' }}>{fmtDate(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && <Pagination page={page} total={totalPages} onChange={setPage} />}
        </>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   AUDIT LOGS
   ══════════════════════════════════════════════════════════ */
function SectionLogs() {
  const [logs,    setLogs]    = useState([])
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [level,   setLevel]   = useState('')
  const [search,  setSearch]  = useState('')
  const [loading, setLoading] = useState(true)
  const LIMIT = 100

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ page, limit: LIMIT })
      if (level)  p.set('level', level)
      if (search) p.set('search', search)
      const d = await apiFetch(`${API}/logs?${p}`)
      setLogs(d.logs); setTotal(d.total)
    } catch {}
    finally { setLoading(false) }
  }, [page, level, search])

  useEffect(() => { load() }, [load])

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h1 style={sH2}>Audit Logs <span style={{ fontSize: 16, color: '#45607a', fontWeight: 500 }}>({fmt(total)})</span></h1>
        <p style={{ fontSize: 13, color: '#45607a', margin: 0 }}>System activity and security audit trail</p>
      </div>

      <div style={filterRow}>
        <select value={level} onChange={e => { setLevel(e.target.value); setPage(1) }} style={inputSm}>
          <option value="">All levels</option>
          <option value="info">Info</option><option value="warn">Warn</option><option value="error">Error</option>
        </select>
        <input placeholder="Search actor or details…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} style={{ ...inputSm, flex: '1 1 200px' }} />
        <button onClick={() => load()} style={btnSecondary}><RefreshCw size={13} />Refresh</button>
      </div>

      {loading ? <Spinner /> : (
        <>
          <div style={{ ...cardStyle, overflowX: 'auto' }}>
            <table style={tbl}>
              <thead><tr>
                <th style={th}>Time</th><th style={th}>Level</th><th style={th}>Action</th>
                <th style={th}>Entity</th><th style={th}>Actor</th><th style={th}>Details</th>
              </tr></thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(233,186,76,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={{ ...td, fontSize: 11, whiteSpace: 'nowrap' }}>{fmtDateTime(l.created_at)}</td>
                    <td style={td}><StatusBadge label={l.level} color={LOG_LEVEL_COLOR[l.level] || '#45607a'} /></td>
                    <td style={{ ...td, fontFamily: 'monospace', fontSize: 12, color: '#eef2f7' }}>{l.action}</td>
                    <td style={{ ...td, fontSize: 12 }}>{l.entity ? `${l.entity}#${l.entity_id}` : '—'}</td>
                    <td style={{ ...td, fontSize: 12 }}>{l.actor_name || '—'}</td>
                    <td style={{ ...td, fontSize: 12, color: '#8fa3bd', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.details}>{l.details || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && <Pagination page={page} total={totalPages} onChange={setPage} />}
        </>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   STUB SECTIONS
   ══════════════════════════════════════════════════════════ */
function StubSection({ title, subtitle, Icon: Ic, desc }) {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={sH2}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: '#45607a', margin: 0 }}>{subtitle}</p>}
      </div>
      <div style={{ ...cardStyle, textAlign: 'center', padding: '72px 24px' }}>
        {Ic && <Ic size={48} color="#1e3a5f" strokeWidth={1.2} style={{ margin: '0 auto 20px', display: 'block' }} />}
        <div style={{ fontSize: 17, fontWeight: 700, color: '#2a3d52', marginBottom: 10 }}>{title}</div>
        <div style={{ fontSize: 14, color: '#1e3a5f', maxWidth: 400, margin: '0 auto', lineHeight: 1.65 }}>{desc}</div>
      </div>
    </div>
  )
}
function SectionBoeActivity() {
  return <StubSection title="BOE Activity" subtitle="Live feed of all submissions" Icon={FileText} desc="Real-time feed of BOE submissions across all companies. Filter by company, date range, and status. Coming soon." />
}
function SectionSettings() {
  return <StubSection title="System Settings" subtitle="Platform configuration" Icon={Settings} desc="API keys, rate limits, AI service configuration, feature flags, and platform-wide settings. Coming soon." />
}
function SectionSupport() {
  return <StubSection title="Support" subtitle="User tickets and admin notes" Icon={HelpCircle} desc="User support requests, admin notes, and escalation management. Coming soon." />
}

/* ══════════════════════════════════════════════════════════
   SECTIONS CONFIG
   ══════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════
   ACTIVITY CENTER (embedded)
   ══════════════════════════════════════════════════════════ */
function SectionActivityCenter() {
  return <ActivityCenter />
}

function SectionExecutive() {
  return <ExecutiveDashboard />
}

function SectionReviews() {
  return <ReviewCenter />
}

function SectionShadow() {
  return <ShadowDashboard />
}

const SECTIONS = [
  { id: 'dashboard',       label: 'Dashboard',        Icon: LayoutDashboard },
  { id: 'analytics',       label: 'Analytics',         Icon: BarChart2       },
  { id: 'users',           label: 'Users',             Icon: Users           },
  { id: 'companies',       label: 'Companies',         Icon: Building2       },
  { id: 'subscriptions',   label: 'Subscriptions',     Icon: CreditCard      },
  { id: 'payments',        label: 'Payments',          Icon: Wallet          },
  { id: 'boe_activity',    label: 'BOE Activity',      Icon: FileText        },
  { id: 'activity_center', label: 'Activity Center',   Icon: Activity        },
  { id: 'executive',        label: 'Executive Intel',   Icon: TrendingUp      },
  { id: 'reviews',          label: 'HS Reviews',        Icon: CheckCircle     },
  { id: 'shadow',           label: 'Shadow Analytics',  Icon: Database        },
  { id: 'audit_logs',      label: 'Audit Logs',        Icon: Shield          },
  { id: 'settings',        label: 'System Settings',   Icon: Settings        },
  { id: 'support',         label: 'Support',           Icon: HelpCircle      },
]

/* ══════════════════════════════════════════════════════════
   ROOT SUPER ADMIN
   ══════════════════════════════════════════════════════════ */
export default function SuperAdmin({ onNavigate }) {
  const { user } = useAuth()
  const [section,    setSection]    = useState('dashboard')
  const [collapsed,  setCollapsed]  = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchVal,  setSearchVal]  = useState('')
  const isMobile = useIsMobile()

  const sidebarW = isMobile ? 0 : (collapsed ? 64 : 240)

  function goSection(id) { setSection(id); setDrawerOpen(false) }

  if (user?.role !== 'super_admin') {
    return (
      <div style={{ minHeight: '100vh', background: '#06090f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <Shield size={48} color="#1e3a5f" style={{ margin: '0 auto 16px', display: 'block' }} />
          <div style={{ fontSize: 20, fontWeight: 700, color: '#f87171', marginBottom: 8 }}>Access Denied</div>
          <div style={{ fontSize: 14, color: '#45607a', marginBottom: 24 }}>Super Admin access required</div>
          <button onClick={() => onNavigate('home')} style={btnSecondary}><Home size={14} />Go Home</button>
        </div>
      </div>
    )
  }

  /* ── Sidebar inner content (shared between desktop + mobile drawer) ── */
  const SidebarInner = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo + collapse */}
      <div style={{ padding: collapsed && !isMobile ? '20px 0 16px' : '20px 16px 16px', borderBottom: '1px solid rgba(30,58,95,0.4)', display: 'flex', alignItems: 'center', justifyContent: collapsed && !isMobile ? 'center' : 'space-between', gap: 10 }}>
        {(!collapsed || isMobile) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#e9ba4c,#c8921a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#06090f', flexShrink: 0 }}>L</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#e9ba4c', letterSpacing: '0.02em' }}>Admin</div>
              <div style={{ fontSize: 10, color: '#2a3d52' }}>Super Admin Portal</div>
            </div>
          </div>
        )}
        {collapsed && !isMobile && (
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#e9ba4c,#c8921a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#06090f' }}>L</div>
        )}
        {!isMobile && (
          <button onClick={() => setCollapsed(c => !c)} style={{ background: 'none', border: 'none', color: '#2a3d52', cursor: 'pointer', padding: 4, display: 'flex', flexShrink: 0, borderRadius: 6 }}>
            <ChevronLeft size={16} style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
          </button>
        )}
        {isMobile && (
          <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', color: '#45607a', cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        {!collapsed || isMobile ? (
          <div style={{ fontSize: 10, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, padding: '4px 8px 8px', marginTop: 4 }}>Navigation</div>
        ) : null}

        {SECTIONS.map(s => {
          const active = section === s.id
          return (
            <button
              key={s.id}
              onClick={() => goSection(s.id)}
              title={collapsed && !isMobile ? s.label : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                background: active ? 'rgba(233,186,76,0.10)' : 'transparent',
                border: `1px solid ${active ? 'rgba(233,186,76,0.22)' : 'transparent'}`,
                borderRadius: 10, padding: collapsed && !isMobile ? '10px 0' : '9px 11px',
                marginBottom: 2, cursor: 'pointer', textAlign: 'left',
                color: active ? '#e9ba4c' : '#8fa3bd',
                fontSize: 13, fontWeight: active ? 700 : 400,
                transition: 'all 0.15s',
                justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <s.Icon size={16} strokeWidth={active ? 2 : 1.6} style={{ flexShrink: 0 }} />
              {(!collapsed || isMobile) && s.label}
              {(!collapsed || isMobile) && active && <ArrowRight size={12} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '10px 8px 14px', borderTop: '1px solid rgba(30,58,95,0.4)' }}>
        <a href="#" onClick={e => e.preventDefault()} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: collapsed && !isMobile ? '9px 0' : '9px 11px', borderRadius: 10, color: '#2a3d52', fontSize: 12, textDecoration: 'none', transition: 'color 0.15s', justifyContent: collapsed && !isMobile ? 'center' : 'flex-start', marginBottom: 2 }}
          onMouseEnter={e => e.currentTarget.style.color = '#45607a'}
          onMouseLeave={e => e.currentTarget.style.color = '#2a3d52'}
        >
          <ExternalLink size={14} strokeWidth={1.6} />
          {(!collapsed || isMobile) && 'Documentation'}
        </a>
        <button onClick={() => onNavigate('home')} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: collapsed && !isMobile ? '9px 0' : '9px 11px', background: 'none', border: 'none', borderRadius: 10, color: '#2a3d52', fontSize: 12, cursor: 'pointer', transition: 'color 0.15s', justifyContent: collapsed && !isMobile ? 'center' : 'flex-start' }}
          onMouseEnter={e => e.currentTarget.style.color = '#45607a'}
          onMouseLeave={e => e.currentTarget.style.color = '#2a3d52'}
        >
          <LogOut size={14} strokeWidth={1.6} />
          {(!collapsed || isMobile) && 'Back to Lunarae'}
        </button>
      </div>
    </div>
  )

  const currentSection = SECTIONS.find(s => s.id === section)

  return (
    <>
      <style>{`
        @keyframes sa-spin { to { transform: rotate(360deg) } }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#06090f', fontFamily: "'DM Sans', -apple-system, sans-serif", color: '#eef2f7' }}>

        {/* ── Desktop Sidebar ── */}
        {!isMobile && (
          <aside style={{
            width: sidebarW, flexShrink: 0,
            background: 'rgba(7,11,21,0.98)',
            borderRight: '1px solid rgba(30,58,95,0.45)',
            height: '100vh', overflowY: 'auto', overflowX: 'hidden',
            transition: 'width 0.28s cubic-bezier(0.22,1,0.36,1)',
          }}>
            <SidebarInner />
          </aside>
        )}

        {/* ── Mobile Drawer Overlay ── */}
        {isMobile && drawerOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 700, background: 'rgba(3,6,14,0.8)', backdropFilter: 'blur(4px)' }} onClick={() => setDrawerOpen(false)} />
        )}

        {/* ── Mobile Drawer Panel ── */}
        {isMobile && (
          <div style={{
            position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 800, width: 260,
            background: 'rgba(7,11,21,0.99)', borderRight: '1px solid rgba(30,58,95,0.5)',
            transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1)',
            boxShadow: drawerOpen ? '8px 0 40px rgba(0,0,0,0.6)' : 'none',
          }}>
            <SidebarInner />
          </div>
        )}

        {/* ── Right Column: Header + Content ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Admin Header */}
          <header style={{
            height: 56, flexShrink: 0,
            background: 'rgba(6,9,15,0.96)',
            borderBottom: '1px solid rgba(30,58,95,0.4)',
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '0 20px',
            backdropFilter: 'blur(16px)',
            position: 'sticky', top: 0, zIndex: 100,
          }}>
            {/* Mobile hamburger */}
            {isMobile && (
              <button onClick={() => setDrawerOpen(true)} style={{ background: 'none', border: 'none', color: '#8fa3bd', cursor: 'pointer', padding: '4px 6px', display: 'flex', flexShrink: 0 }}>
                <Menu size={20} />
              </button>
            )}

            {/* Page title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {currentSection?.Icon && <currentSection.Icon size={16} color="#e9ba4c" strokeWidth={1.8} />}
              <span style={{ fontSize: 14, fontWeight: 700, color: '#eef2f7', letterSpacing: '-0.01em' }}>
                {currentSection?.label || 'Admin'}
              </span>
            </div>

            {/* Search bar */}
            <div style={{ flex: 1, maxWidth: 400, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(10,18,32,0.7)', border: '1px solid rgba(30,58,95,0.5)', borderRadius: 10, padding: '0 12px', height: 36 }}>
              <Search size={14} color="#2a3d52" strokeWidth={1.8} />
              <input
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                placeholder="Search…"
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: '#eef2f7', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ flex: 1 }} />

            {/* Bell */}
            <button style={{ background: 'none', border: 'none', color: '#45607a', cursor: 'pointer', padding: 6, display: 'flex', borderRadius: 8, transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#8fa3bd'}
              onMouseLeave={e => e.currentTarget.style.color = '#45607a'}
            >
              <Bell size={17} strokeWidth={1.8} />
            </button>

            {/* User pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(233,186,76,0.06)', border: '1px solid rgba(233,186,76,0.15)', borderRadius: 20, padding: '5px 12px 5px 5px', cursor: 'default' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#1e3a5f,#0f2040)', border: '1px solid rgba(233,186,76,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#e9ba4c', flexShrink: 0 }}>
                {(user?.full_name || 'A')[0].toUpperCase()}
              </div>
              {!isMobile && <span style={{ fontSize: 13, color: '#e9ba4c', fontWeight: 600 }}>{user?.full_name?.split(' ')[0]}</span>}
            </div>
          </header>

          {/* Page content */}
          <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: isMobile ? '20px 16px 48px' : '28px 32px 48px' }}>
            {section === 'dashboard'       && <SectionDashboard goSection={goSection} />}
            {section === 'analytics'       && <SectionAnalytics />}
            {section === 'users'           && <SectionUsers />}
            {section === 'companies'       && <SectionCompanies />}
            {section === 'subscriptions'   && <SectionSubscriptions />}
            {section === 'payments'        && <SectionPayments />}
            {section === 'boe_activity'    && <SectionBoeActivity />}
            {section === 'activity_center' && <SectionActivityCenter />}
            {section === 'executive'       && <SectionExecutive />}
            {section === 'reviews'         && <SectionReviews />}
            {section === 'shadow'          && <SectionShadow />}
            {section === 'audit_logs'      && <SectionLogs />}
            {section === 'settings'        && <SectionSettings />}
            {section === 'support'         && <SectionSupport />}
          </main>
        </div>
      </div>
    </>
  )
}
