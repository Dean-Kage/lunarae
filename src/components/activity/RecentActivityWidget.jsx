import { useState, useEffect } from 'react'
import {
  Activity, LogIn, UserPlus, FileText, Download,
  CheckCircle, XCircle, CreditCard, Shield,
  AlertTriangle, ArrowRight,
} from 'lucide-react'
import { API } from '../../config/api.js'

function authHdr() {
  const t = localStorage.getItem('lunarae_auth_token')
  return t ? { Authorization: `Bearer ${t}` } : {}
}

function timeAgo(d) {
  if (!d) return '—'
  const mins = Math.floor((Date.now() - new Date(d)) / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const ACTION_META = {
  LOGIN: { color: '#60a5fa', Icon: LogIn },
  LOGOUT: { color: '#45607a', Icon: Activity },
  REGISTER: { color: '#60a5fa', Icon: UserPlus },
  PASSWORD_CHANGE: { color: '#60a5fa', Icon: Shield },
  BOE_CREATED: { color: '#e9ba4c', Icon: FileText },
  BOE_EXPORTED_XML: { color: '#e9ba4c', Icon: Download },
  BOE_VIEWED: { color: '#8fa3bd', Icon: FileText },
  BOE_DELETED: { color: '#f87171', Icon: FileText },
  USER_INVITED: { color: '#34d399', Icon: UserPlus },
  USER_REMOVED: { color: '#f97316', Icon: Shield },
  USER_ACCEPTED_INVITE: { color: '#34d399', Icon: UserPlus },
  CLASSIFICATION_APPROVED: { color: '#4ade80', Icon: CheckCircle },
  CLASSIFICATION_REJECTED: { color: '#f87171', Icon: XCircle },
  PAYMENT_CREATED: { color: '#4ade80', Icon: CreditCard },
  PAYMENT_CONFIRMED: { color: '#4ade80', Icon: CreditCard },
  PAYMENT_FAILED: { color: '#f87171', Icon: CreditCard },
  SUBSCRIPTION_CHANGED: { color: '#4ade80', Icon: CreditCard },
  USER_DISABLED: { color: '#f97316', Icon: Shield },
  USER_ENABLED: { color: '#4ade80', Icon: Shield },
  USER_DELETED: { color: '#f87171', Icon: Shield },
}

function getMeta(action) {
  return ACTION_META[action] || { color: '#45607a', Icon: Activity }
}

/* ─── KPI widget (Events Today / 7d / 30d) ─────────────── */
export function AuditKpiWidgets({ onNavigate }) {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/audit/admin/metrics`, { headers: authHdr() })
      .then(r => r.ok ? r.json() : null)
      .then(d => setMetrics(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const cardStyle = {
    background: 'rgba(10,18,32,0.85)',
    border: '1px solid rgba(30,58,95,0.55)',
    borderRadius: 16, padding: '20px 22px', minWidth: 0,
    position: 'relative', overflow: 'hidden',
    cursor: onNavigate ? 'pointer' : 'default',
    transition: 'border-color 0.2s, transform 0.15s',
  }

  function Card({ label, value, accent, loading: l }) {
    return (
      <div
        style={cardStyle}
        onClick={() => onNavigate?.('activity_center')}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(233,186,76,0.22)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(30,58,95,0.55)';   e.currentTarget.style.transform = 'translateY(0)' }}
      >
        <div style={{ position: 'absolute', top: -24, right: -24, width: 80, height: 80, borderRadius: '50%', background: accent + '0a', filter: 'blur(20px)', pointerEvents: 'none' }} />
        <div style={{ width: 36, height: 36, borderRadius: 10, background: accent + '12', border: `1px solid ${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <Activity size={16} color={accent} strokeWidth={1.8} />
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: accent, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 4 }}>
          {l ? '—' : (value?.toLocaleString() || '0')}
        </div>
        <div style={{ fontSize: 11, color: '#45607a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      </div>
    )
  }

  return (
    <>
      <Card label="Events Today"    value={metrics?.totals?.events_today}  accent="#e9ba4c" loading={loading} />
      <Card label="Events This Week" value={metrics?.totals?.events_7d}    accent="#60a5fa" loading={loading} />
      <Card label="Active Users"     value={metrics?.totals?.active_users}  accent="#4ade80" loading={loading} />
    </>
  )
}

/* ─── Most Active Users mini-widget ─────────────────────── */
export function MostActiveUsersWidget({ onNavigate }) {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/audit/admin/metrics`, { headers: authHdr() })
      .then(r => r.ok ? r.json() : null)
      .then(d => setMetrics(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const users = metrics?.mostActiveUsers?.slice(0, 5) || []

  return (
    <div style={{
      background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(30,58,95,0.55)',
      borderRadius: 16, overflow: 'hidden',
    }}>
      <div style={{
        padding: '16px 22px 12px', borderBottom: '1px solid rgba(30,58,95,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={15} color="#45607a" strokeWidth={1.8} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#eef2f7' }}>Most Active Users</span>
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('activity_center')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#45607a', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '4px 6px', borderRadius: 6, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#e9ba4c'}
            onMouseLeave={e => e.currentTarget.style.color = '#45607a'}
          >
            View all <ArrowRight size={11} />
          </button>
        )}
      </div>
      <div style={{ padding: '8px 0' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <div style={{ width: 22, height: 22, border: '2px solid rgba(30,58,95,0.4)', borderTopColor: '#e9ba4c', borderRadius: '50%', animation: 'ac-spin 0.7s linear infinite' }} />
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: '#2a3d52', fontSize: 12 }}>No data yet</div>
        ) : users.map((u, i) => (
          <div key={u.user_id || i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '9px 22px',
            borderBottom: i < users.length - 1 ? '1px solid rgba(30,58,95,0.18)' : 'none',
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'rgba(30,58,95,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#e9ba4c', flexShrink: 0,
            }}>
              {(u.actor_name || '?')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#eef2f7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {u.actor_name || 'Unknown'}
              </div>
              <div style={{ fontSize: 11, color: '#45607a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {u.company_name || u.actor_email || '—'}
              </div>
            </div>
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#e9ba4c',
              background: '#e9ba4c14', border: '1px solid #e9ba4c28',
              borderRadius: 6, padding: '2px 8px', flexShrink: 0,
            }}>
              {u.count}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Recent Activity feed widget ────────────────────────── */
export default function RecentActivityWidget({ limit = 10, onNavigate }) {
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/audit?limit=${limit}`, { headers: authHdr() })
      .then(r => r.ok ? r.json() : null)
      .then(d => setLogs(d?.logs || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [limit])

  return (
    <div style={{
      background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(30,58,95,0.55)',
      borderRadius: 16, overflow: 'hidden',
    }}>
      <style>{`@keyframes ac-spin { to { transform: rotate(360deg) } }`}</style>

      <div style={{
        padding: '16px 22px 12px', borderBottom: '1px solid rgba(30,58,95,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={15} color="#45607a" strokeWidth={1.8} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#eef2f7' }}>Recent Activity</span>
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('activity_center')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#45607a', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '4px 6px', borderRadius: 6, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#e9ba4c'}
            onMouseLeave={e => e.currentTarget.style.color = '#45607a'}
          >
            View all <ArrowRight size={11} />
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
          <div style={{ width: 22, height: 22, border: '2px solid rgba(30,58,95,0.4)', borderTopColor: '#e9ba4c', borderRadius: '50%', animation: 'ac-spin 0.7s linear infinite' }} />
        </div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 16px', color: '#2a3d52', fontSize: 12 }}>No activity yet</div>
      ) : (
        <div>
          {logs.map((log, i) => {
            const { color, Icon } = getMeta(log.action)
            return (
              <div key={log.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 22px',
                borderBottom: i < logs.length - 1 ? '1px solid rgba(30,58,95,0.18)' : 'none',
                transition: 'background 0.1s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(233,186,76,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: color + '14', border: `1px solid ${color}28`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={14} color={color} strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: '#2a3d52', marginBottom: 1, fontFamily: 'monospace' }}>{log.action}</div>
                  <div style={{
                    fontSize: 13, fontWeight: 600, color: '#eef2f7',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {log.actor_name || 'System'}
                  </div>
                  {log.company_name && (
                    <div style={{ fontSize: 11, color: '#45607a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.company_name}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 11, color: '#2a3d52', flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {timeAgo(log.created_at)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
