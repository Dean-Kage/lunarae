import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { API } from '../config/api.js'
import { Activity, RefreshCw, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import ActivityTimeline from '../components/activity/ActivityTimeline.jsx'
import ActivityExportButton from '../components/activity/ActivityExportButton.jsx'
import { ActivityFiltersSidebar, ActivityFiltersSheet } from '../components/activity/ActivityFilters.jsx'

/* ── Responsive ──────────────────────────────────────────── */
function useIsMobile(bp = 900) {
  const [m, setM] = useState(() => window.innerWidth < bp)
  useEffect(() => {
    const h = () => setM(window.innerWidth < bp)
    window.addEventListener('resize', h, { passive: true })
    return () => window.removeEventListener('resize', h)
  }, [bp])
  return m
}

/* ── Auth helper ─────────────────────────────────────────── */
function authHdr() {
  const t = localStorage.getItem('lunarae_auth_token')
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) }
}

/* ── Formatters ──────────────────────────────────────────── */
function fmt(n)      { return Number(n || 0).toLocaleString() }
function fmtDate(d)  { return d ? new Date(d).toLocaleDateString() : '—' }

/* ── KPI card (mini) ─────────────────────────────────────── */
function MetricChip({ label, value, accent = '#e9ba4c' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 3,
      background: 'rgba(10,18,32,0.7)', border: `1px solid ${accent}28`,
      borderRadius: 12, padding: '14px 18px', minWidth: 110,
    }}>
      <span style={{ fontSize: 22, fontWeight: 800, color: accent, lineHeight: 1, letterSpacing: '-0.03em' }}>
        {value ?? '—'}
      </span>
      <span style={{ fontSize: 10, color: '#45607a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </span>
    </div>
  )
}

/* ── Pagination ──────────────────────────────────────────── */
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  const btnStyle = {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    background: 'rgba(10,18,32,0.8)', border: '1px solid rgba(30,58,95,0.55)',
    borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 600,
    color: '#8fa3bd', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
    minHeight: 36,
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 24 }}>
      <button
        onClick={() => onChange(p => Math.max(1, p - 1))}
        disabled={page === 1}
        style={{ ...btnStyle, opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
      >
        <ChevronLeft size={13} /> Prev
      </button>
      <span style={{ fontSize: 12, color: '#2a3d52', minWidth: 100, textAlign: 'center' }}>
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onChange(p => Math.min(totalPages, p + 1))}
        disabled={page === totalPages}
        style={{ ...btnStyle, opacity: page === totalPages ? 0.4 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
      >
        Next <ChevronRight size={13} />
      </button>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   ACTIVITY CENTER
   ══════════════════════════════════════════════════════════ */
export default function ActivityCenter() {
  const { user } = useAuth()
  const isMobile  = useIsMobile()
  const isAdmin   = user?.role === 'super_admin'

  const LIMIT = 25

  /* ── State ── */
  const [logs,        setLogs]        = useState([])
  const [total,       setTotal]       = useState(0)
  const [page,        setPage]        = useState(1)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [metrics,     setMetrics]     = useState(null)
  const [sheetOpen,   setSheetOpen]   = useState(false)
  const [filters,     setFilters]     = useState({
    search:      '',
    action:      '',
    entity_type: '',
    company_id:  '',
    user_id:     '',
    from_date:   '',
    to_date:     '',
  })

  /* ── Fetch audit logs ── */
  const loadLogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const p = new URLSearchParams({ page, limit: LIMIT })
      Object.entries(filters).forEach(([k, v]) => { if (v) p.set(k, v) })
      const res  = await fetch(`${API}/api/audit?${p}`, { headers: authHdr() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load activity')
      setLogs(data.logs || [])
      setTotal(data.total || 0)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, filters])

  /* ── Fetch admin metrics ── */
  const loadMetrics = useCallback(async () => {
    if (!isAdmin) return
    try {
      const res  = await fetch(`${API}/api/audit/admin/metrics`, { headers: authHdr() })
      const data = await res.json()
      if (res.ok) setMetrics(data)
    } catch {}
  }, [isAdmin])

  useEffect(() => { loadLogs() },   [loadLogs])
  useEffect(() => { loadMetrics() }, [loadMetrics])

  /* ── Reset page when filters change ── */
  function handleFilterChange(key, value) {
    setPage(1)
    setFilters(f => ({ ...f, [key]: value }))
  }

  const totalPages = Math.ceil(total / LIMIT)

  /* ── Active filter count for mobile badge ── */
  const activeFilterCount = Object.values(filters).filter(Boolean).length

  return (
    <div style={{
      minHeight: '100%', padding: isMobile ? '20px 16px 48px' : '28px 32px 48px',
      fontFamily: "'DM Sans', -apple-system, sans-serif",
    }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#eef2f7', letterSpacing: '-0.02em' }}>
              Activity Center
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#45607a' }}>
              {isAdmin ? 'Enterprise-wide audit trail' : 'Company activity log'}
              {total > 0 && ` · ${fmt(total)} events`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Mobile: filter button */}
            {isMobile && (
              <button
                onClick={() => setSheetOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: activeFilterCount ? 'rgba(233,186,76,0.1)' : 'rgba(10,18,32,0.8)',
                  border: `1px solid ${activeFilterCount ? 'rgba(233,186,76,0.4)' : 'rgba(30,58,95,0.6)'}`,
                  borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 600,
                  color: activeFilterCount ? '#e9ba4c' : '#8fa3bd',
                  cursor: 'pointer', fontFamily: 'inherit', minHeight: 36,
                }}
              >
                <Filter size={13} strokeWidth={1.8} />
                Filters
                {activeFilterCount > 0 && (
                  <span style={{
                    background: '#e9ba4c', color: '#06090f', borderRadius: '50%',
                    width: 16, height: 16, fontSize: 9, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{activeFilterCount}</span>
                )}
              </button>
            )}

            {/* Refresh */}
            <button
              onClick={() => { loadLogs(); loadMetrics() }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(10,18,32,0.8)', border: '1px solid rgba(30,58,95,0.6)',
                borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 600,
                color: '#8fa3bd', cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s', minHeight: 36,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(233,186,76,0.4)'; e.currentTarget.style.color = '#e9ba4c' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(30,58,95,0.6)';   e.currentTarget.style.color = '#8fa3bd' }}
            >
              <RefreshCw size={13} strokeWidth={1.8} />
              {!isMobile && 'Refresh'}
            </button>

            {/* Export */}
            <ActivityExportButton filters={filters} />
          </div>
        </div>

        {/* Admin metrics strip */}
        {isAdmin && metrics && (
          <div style={{
            display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 20,
          }}>
            <MetricChip label="Events Today"     value={fmt(metrics.totals?.events_today)}  accent="#e9ba4c" />
            <MetricChip label="This Week"         value={fmt(metrics.totals?.events_7d)}    accent="#60a5fa" />
            <MetricChip label="This Month"        value={fmt(metrics.totals?.events_30d)}   accent="#a78bfa" />
            <MetricChip label="Active Companies"  value={fmt(metrics.totals?.active_companies)} accent="#34d399" />
            <MetricChip label="Active Users"      value={fmt(metrics.totals?.active_users)} accent="#4ade80" />
          </div>
        )}
      </div>

      {/* ── Body: sidebar + timeline ── */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* Desktop filter sidebar */}
        {!isMobile && (
          <ActivityFiltersSidebar
            filters={filters}
            onChange={handleFilterChange}
            isAdmin={isAdmin}
          />
        )}

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Top action bar — most active users (admin only, desktop) */}
          {isAdmin && metrics?.topActions?.length > 0 && !isMobile && (
            <div style={{
              background: 'rgba(10,18,32,0.6)', border: '1px solid rgba(30,58,95,0.45)',
              borderRadius: 14, padding: '14px 18px', marginBottom: 20,
              display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center',
            }}>
              <span style={{ fontSize: 10, color: '#2a3d52', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, flexShrink: 0 }}>
                Top Actions (30d)
              </span>
              {metrics.topActions.slice(0, 6).map(a => (
                <button
                  key={a.action}
                  onClick={() => handleFilterChange('action', a.action)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: filters.action === a.action ? 'rgba(233,186,76,0.12)' : 'rgba(30,58,95,0.3)',
                    border: `1px solid ${filters.action === a.action ? 'rgba(233,186,76,0.35)' : 'rgba(30,58,95,0.5)'}`,
                    borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 600,
                    color: filters.action === a.action ? '#e9ba4c' : '#8fa3bd',
                    cursor: 'pointer', fontFamily: 'monospace', transition: 'all 0.15s',
                  }}
                >
                  {a.action}
                  <span style={{ fontSize: 9, color: '#45607a' }}>{a.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Timeline */}
          <div style={{
            background: 'rgba(10,18,32,0.5)', border: '1px solid rgba(30,58,95,0.45)',
            borderRadius: 16, padding: '16px 16px 16px',
            minHeight: 200,
          }}>
            <ActivityTimeline logs={logs} loading={loading} error={error} />
          </div>

          {/* Pagination */}
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />

          {/* Admin: Most active users (bottom, desktop only) */}
          {isAdmin && metrics?.mostActiveUsers?.length > 0 && !isMobile && (
            <div style={{ marginTop: 24 }}>
              <div style={{
                background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(30,58,95,0.55)',
                borderRadius: 16, overflow: 'hidden',
              }}>
                <div style={{ padding: '14px 22px 12px', borderBottom: '1px solid rgba(30,58,95,0.35)' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#eef2f7' }}>Most Active Users (Last 30 Days)</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr>
                        {['User', 'Company', 'Events'].map(h => (
                          <th key={h} style={{
                            textAlign: 'left', padding: '10px 18px',
                            color: '#2a3d52', fontWeight: 700, fontSize: 10,
                            textTransform: 'uppercase', letterSpacing: '0.09em',
                            borderBottom: '1px solid rgba(30,58,95,0.4)',
                            background: 'rgba(6,9,15,0.35)',
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.mostActiveUsers.slice(0, 10).map((u, i) => (
                        <tr key={u.user_id || i}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(233,186,76,0.02)'}
                          onMouseLeave={e => e.currentTarget.style.background = ''}
                        >
                          <td style={{ padding: '12px 18px', color: '#8fa3bd', borderBottom: '1px solid rgba(30,58,95,0.22)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 30, height: 30, borderRadius: 8,
                                background: 'rgba(30,58,95,0.6)', flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 12, fontWeight: 700, color: '#e9ba4c',
                              }}>
                                {(u.actor_name || '?')[0].toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: '#eef2f7' }}>{u.actor_name || 'Unknown'}</div>
                                <div style={{ fontSize: 11, color: '#2a3d52' }}>{u.actor_email || '—'}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 18px', color: '#8fa3bd', fontSize: 12, borderBottom: '1px solid rgba(30,58,95,0.22)' }}>
                            {u.company_name || '—'}
                          </td>
                          <td style={{ padding: '12px 18px', borderBottom: '1px solid rgba(30,58,95,0.22)' }}>
                            <span style={{
                              fontSize: 13, fontWeight: 700, color: '#e9ba4c',
                              background: '#e9ba4c12', border: '1px solid #e9ba4c25',
                              borderRadius: 8, padding: '3px 10px',
                            }}>
                              {fmt(u.count)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom sheet */}
      <ActivityFiltersSheet
        filters={filters}
        onChange={handleFilterChange}
        isAdmin={isAdmin}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  )
}
