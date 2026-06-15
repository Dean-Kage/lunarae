import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { API } from '../config/api.js'
import {
  Search, SlidersHorizontal, Plus, FileText, Download,
  RotateCcw, X, ChevronLeft, ChevronRight, Calendar,
  AlertCircle, FileX, TrendingUp, Clock, CheckCircle,
} from 'lucide-react'

/* ── Design tokens ─────────────────────────────────────────── */
const C = {
  bg:     '#06090f',
  card:   'rgba(10,18,32,0.85)',
  border: 'rgba(30,58,95,0.55)',
  gold:   '#e9ba4c',
  blue:   '#60a5fa',
  green:  '#4ade80',
  red:    '#f87171',
  muted:  '#45607a',
  text:   '#eef2f7',
  sub:    '#8fa3bd',
}

const STATUS_META = {
  draft:     { label: 'Draft',     color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  submitted: { label: 'Submitted', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  approved:  { label: 'Approved',  color: '#4ade80', bg: 'rgba(74,222,128,0.12)'  },
}

const fmt     = (n) => n != null ? `USD ${Number(n).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'
const fmtDate = (d) => new Date(d).toLocaleDateString('en-ZW', { day: '2-digit', month: 'short', year: 'numeric' })
const fmtTime = (d) => new Date(d).toLocaleTimeString('en-ZW', { hour: '2-digit', minute: '2-digit' })

/* ── Shared style primitives ───────────────────────────────── */
const card = {
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: 16,
  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
}

const inp = {
  background: 'rgba(6,9,15,0.6)', border: `1px solid ${C.border}`,
  borderRadius: 10, padding: '9px 14px', fontSize: 13,
  color: C.text, outline: 'none', fontFamily: 'inherit',
  width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s',
}

const btnGold = {
  background: 'linear-gradient(135deg,#e9ba4c,#c8921a)',
  border: 'none', borderRadius: 10, padding: '9px 18px',
  fontSize: 13, fontWeight: 700, color: '#06090f', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 6,
  transition: 'opacity 0.15s', whiteSpace: 'nowrap',
}

const btnGhost = {
  background: 'rgba(10,18,32,0.6)', border: `1px solid ${C.border}`,
  borderRadius: 10, padding: '9px 16px', fontSize: 13,
  fontWeight: 600, color: C.sub, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 6,
  transition: 'all 0.15s', whiteSpace: 'nowrap',
}

/* ══════════════════════════════════════════════════════════ */
export default function BoeHistory({ onNavigate }) {
  const { user } = useAuth()
  const isOwner  = user?.role === 'company_owner' || user?.role === 'super_admin'

  const [boes,    setBoes]    = useState([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [pg,      setPg]      = useState(1)

  const [search,   setSearch]   = useState('')
  const [importer, setImporter] = useState('')
  const [exporter, setExporter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate,   setToDate]   = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const [selected, setSelected] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const searchTimer = useRef(null)
  const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('lunarae_auth_token')}` })

  const load = useCallback(async (p = 1) => {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams({ page: p, limit: 18 })
      if (search)   params.set('search',    search)
      if (importer) params.set('importer',  importer)
      if (exporter) params.set('exporter',  exporter)
      if (fromDate) params.set('from_date', fromDate)
      if (toDate)   params.set('to_date',   toDate)

      const res  = await fetch(`${API}/api/boes?${params}`, { headers: authH() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setBoes(data.boes)
      setTotal(data.total)
      setPg(p)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [search, importer, exporter, fromDate, toDate])

  useEffect(() => { load(1) }, [load])

  const handleSearchChange = (val) => {
    setSearch(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => load(1), 400)
  }

  async function openDetail(boe) {
    if (selected?.id === boe.id) { setSelected(null); return }
    setDetailLoading(true)
    try {
      const res  = await fetch(`${API}/api/boes/${boe.id}`, { headers: authH() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSelected(data.boe)
    } catch (err) {
      setError(err.message)
    } finally {
      setDetailLoading(false)
    }
  }

  function downloadXml(boe) {
    if (!boe.xml_data) return
    const blob = new Blob([boe.xml_data], { type: 'application/xml;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `Lunarae_ASYCUDA_${boe.id}_${(boe.importer || 'BOE').replace(/\s+/g,'_').slice(0,20)}.xml`
    a.click()
    URL.revokeObjectURL(url)
  }

  function reopenBoe(boe) {
    if (!boe.result_json) return
    try {
      const parsed = JSON.parse(boe.result_json)
      sessionStorage.setItem('lunarae_reopen_boe', JSON.stringify(parsed))
      onNavigate('boe')
    } catch {
      setError('Could not reopen BOE — result data is missing')
    }
  }

  const clearFilters = () => {
    setSearch(''); setImporter(''); setExporter('')
    setFromDate(''); setToDate('')
  }
  const hasFilters = !!(search || importer || exporter || fromDate || toDate)
  const totalPages = Math.ceil(total / 18)

  /* Stats from loaded data */
  const thisMonth = new Date()
  const stats = {
    total,
    drafts:    boes.filter(b => b.status === 'draft').length,
    submitted: boes.filter(b => b.status === 'submitted').length,
    approved:  boes.filter(b => b.status === 'approved').length,
    thisMonth: boes.filter(b => {
      const d = new Date(b.created_at)
      return d.getMonth() === thisMonth.getMonth() && d.getFullYear() === thisMonth.getFullYear()
    }).length,
  }

  return (
    <div className="portal-page" style={{
      minHeight: '100vh', background: C.bg,
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      color: C.text, padding: '28px 24px 80px',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* ── Page header ──────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>BOE History</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>
              {isOwner ? 'All company BOEs' : 'Your BOEs'} — {total.toLocaleString()} record{total !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={btnGhost} onClick={() => setShowFilters(s => !s)}>
              <SlidersHorizontal size={14} />
              Filters {hasFilters && '•'}
            </button>
            <button style={btnGold} onClick={() => onNavigate('boe')}>
              <Plus size={14} />
              New BOE
            </button>
          </div>
        </div>

        {/* ── Stats strip ──────────────────────────────────── */}
        <div className="boe-stats-grid">
          {[
            { label: 'Total BOEs',    value: total,            icon: FileText,   color: C.blue   },
            { label: 'Drafts',        value: stats.drafts,     icon: Clock,      color: C.sub    },
            { label: 'Submitted',     value: stats.submitted,  icon: TrendingUp, color: C.gold   },
            { label: 'This Month',    value: stats.thisMonth,  icon: Calendar,   color: C.green  },
          ].map(s => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        {error && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 20 }}>
            <AlertCircle size={16} color={C.red} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#fca5a5' }}>{error}</span>
          </div>
        )}

        {/* ── Search bar ───────────────────────────────────── */}
        <div style={{ ...card, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: '2 1 220px', position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
              <input
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Search importer, exporter, or BOE ID…"
                style={{ ...inp, paddingLeft: 38 }}
                onFocus={e => e.target.style.borderColor = C.gold}
                onBlur={e  => e.target.style.borderColor = C.border}
              />
            </div>
            <button style={{ ...btnGold, padding: '9px 20px' }} onClick={() => load(1)}>Search</button>
            {hasFilters && (
              <button style={btnGhost} onClick={clearFilters}>
                <X size={13} /> Clear
              </button>
            )}
          </div>

          {showFilters && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
              <input value={importer} onChange={e => setImporter(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(1)}
                placeholder="Filter by importer…" style={inp}
                onFocus={e => e.target.style.borderColor = C.gold}
                onBlur={e  => e.target.style.borderColor = C.border}
              />
              <input value={exporter} onChange={e => setExporter(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(1)}
                placeholder="Filter by exporter…" style={inp}
                onFocus={e => e.target.style.borderColor = C.gold}
                onBlur={e  => e.target.style.borderColor = C.border}
              />
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                style={{ ...inp, colorScheme: 'dark' }}
                onFocus={e => e.target.style.borderColor = C.gold}
                onBlur={e  => e.target.style.borderColor = C.border}
              />
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                style={{ ...inp, colorScheme: 'dark' }}
                onFocus={e => e.target.style.borderColor = C.gold}
                onBlur={e  => e.target.style.borderColor = C.border}
              />
            </div>
          )}
        </div>

        {/* ── Content area ─────────────────────────────────── */}
        <div className="boe-content-row" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

          {/* Grid */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <LoadingGrid />
            ) : boes.length === 0 ? (
              <EmptyState onNavigate={onNavigate} hasFilters={hasFilters} />
            ) : (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: selected
                    ? '1fr'
                    : 'repeat(auto-fill,minmax(min(340px,100%),1fr))',
                  gap: 14,
                }}>
                  {boes.map(boe => (
                    <BoeCard
                      key={boe.id}
                      boe={boe}
                      isActive={selected?.id === boe.id}
                      isOwner={isOwner}
                      onOpen={() => openDetail(boe)}
                      onReopen={() => reopenBoe(boe)}
                      onDownload={async () => {
                        if (!boe.xml_data) {
                          const res  = await fetch(`${API}/api/boes/${boe.id}`, { headers: authH() })
                          const data = await res.json()
                          if (res.ok) downloadXml(data.boe)
                        } else {
                          downloadXml(boe)
                        }
                      }}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24, alignItems: 'center' }}>
                    <button
                      onClick={() => load(pg - 1)} disabled={pg === 1}
                      style={{ ...btnGhost, padding: '8px 14px', opacity: pg === 1 ? 0.4 : 1 }}
                    >
                      <ChevronLeft size={14} /> Prev
                    </button>
                    <span style={{ fontSize: 12, color: C.muted, padding: '0 8px' }}>
                      Page {pg} of {totalPages}
                    </span>
                    <button
                      onClick={() => load(pg + 1)} disabled={pg === totalPages}
                      style={{ ...btnGhost, padding: '8px 14px', opacity: pg === totalPages ? 0.4 : 1 }}
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Detail pane */}
          {selected && (
            <div className="boe-detail-pane" style={{
              ...card, flex: '0 0 320px', minWidth: 280,
              padding: 20, position: 'sticky', top: 72,
              border: `1px solid rgba(233,186,76,0.2)`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>BOE Detail</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.gold }}>#{selected.id}</div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  style={{ background: 'rgba(30,58,95,0.4)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.sub }}
                  onMouseEnter={e => e.currentTarget.style.color = C.text}
                  onMouseLeave={e => e.currentTarget.style.color = C.sub}
                >
                  <X size={15} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { label: 'Importer',   value: selected.importer },
                  { label: 'Exporter',   value: selected.exporter },
                  { label: 'Created By', value: selected.created_by },
                  { label: 'Date',       value: `${fmtDate(selected.created_at)} ${fmtTime(selected.created_at)}` },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid rgba(30,58,95,0.3)` }}>
                    <span style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{r.label}</span>
                    <span style={{ fontSize: 13, color: C.text, textAlign: 'right', maxWidth: '60%' }}>{r.value || '—'}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                {[
                  { label: 'Total Duty',    value: fmt(selected.total_duty),    color: '#f59e0b' },
                  { label: 'Total VAT',     value: fmt(selected.total_vat),     color: C.blue    },
                  { label: 'Total Payable', value: fmt(selected.total_payable), color: C.green   },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(6,9,15,0.5)', borderRadius: 9, border: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{r.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: r.color }}>{r.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18 }}>
                <button
                  onClick={() => reopenBoe(selected)}
                  disabled={!selected.result_json}
                  style={{ ...btnGold, width: '100%', justifyContent: 'center', opacity: selected.result_json ? 1 : 0.4 }}
                >
                  <RotateCcw size={14} /> Reopen in BOE Generator
                </button>
                <button
                  onClick={() => downloadXml(selected)}
                  disabled={!selected.xml_data}
                  style={{ ...btnGhost, width: '100%', justifyContent: 'center', opacity: selected.xml_data ? 1 : 0.4 }}
                >
                  <Download size={14} /> Download ASYCUDA XML
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── StatCard ───────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, color }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      style={{
        ...card, padding: '16px 18px',
        transition: 'transform 0.2s, box-shadow 0.2s',
        transform: hover ? 'translateY(-2px)' : 'none',
        boxShadow: hover ? '0 8px 28px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.2)',
        cursor: 'default',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: color + '18', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
    </div>
  )
}

/* ── BoeCard ────────────────────────────────────────────────── */
function BoeCard({ boe, isActive, isOwner, onOpen, onReopen, onDownload }) {
  const [hover, setHover] = useState(false)
  const sm = STATUS_META[boe.status] || STATUS_META.draft

  return (
    <div
      style={{
        ...card, padding: '18px 20px', cursor: 'pointer',
        border: `1px solid ${isActive ? 'rgba(233,186,76,0.35)' : C.border}`,
        background: isActive ? 'rgba(15,24,45,0.95)' : C.card,
        transform: hover && !isActive ? 'translateY(-2px)' : 'none',
        boxShadow: hover ? '0 8px 28px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.2)',
        transition: 'all 0.18s ease',
      }}
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Top row: ID + status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg,rgba(30,58,95,0.8),rgba(10,18,32,0.9))',
            border: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FileText size={16} color={C.gold} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.gold, fontFamily: 'monospace' }}>#{boe.id}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{fmtDate(boe.created_at)}</div>
          </div>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
          background: sm.bg, color: sm.color, textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>{sm.label}</span>
      </div>

      {/* Importer / Exporter */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {boe.importer || '—'}
        </div>
        {boe.exporter && (
          <div style={{ fontSize: 12, color: C.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            From: {boe.exporter}
          </div>
        )}
        {isOwner && boe.created_by && (
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>by {boe.created_by}</div>
        )}
      </div>

      {/* Payable */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Total Payable</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.green, letterSpacing: '-0.02em' }}>
            {fmt(boe.total_payable)}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
          <IconBtn title="Reopen in BOE Generator" onClick={onReopen} disabled={!boe.result_json}>
            <RotateCcw size={13} />
          </IconBtn>
          <IconBtn title="Export ASYCUDA XML" onClick={onDownload}>
            <Download size={13} />
          </IconBtn>
        </div>
      </div>
    </div>
  )
}

/* ── IconBtn ───────────────────────────────────────────────── */
function IconBtn({ title, onClick, disabled, children }) {
  return (
    <button
      title={title}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        width: 32, height: 32, borderRadius: 8,
        background: 'rgba(6,9,15,0.6)', border: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer', color: C.sub,
        opacity: disabled ? 0.4 : 1, transition: 'all 0.12s',
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.sub }}
    >{children}</button>
  )
}

/* ── Loading skeleton ──────────────────────────────────────── */
function LoadingGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(340px,100%),1fr))', gap: 14 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ ...card, padding: 20, minHeight: 160 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: C.border, opacity: 0.5 }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 12, borderRadius: 6, background: C.border, opacity: 0.4, marginBottom: 6 }} />
              <div style={{ height: 10, borderRadius: 6, background: C.border, opacity: 0.25, width: '60%' }} />
            </div>
          </div>
          <div style={{ height: 14, borderRadius: 6, background: C.border, opacity: 0.35, marginBottom: 8 }} />
          <div style={{ height: 12, borderRadius: 6, background: C.border, opacity: 0.25, width: '70%' }} />
        </div>
      ))}
    </div>
  )
}

/* ── EmptyState ────────────────────────────────────────────── */
function EmptyState({ onNavigate, hasFilters }) {
  return (
    <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 32px', textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(30,58,95,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <FileX size={28} color={C.muted} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>
        {hasFilters ? 'No BOEs match your filters' : 'No BOEs saved yet'}
      </div>
      <div style={{ fontSize: 13, color: C.muted, maxWidth: 340, lineHeight: 1.7, marginBottom: 24 }}>
        {hasFilters
          ? 'Try adjusting your search terms or clearing the active filters.'
          : 'Every BOE you generate is automatically saved here. Start by creating your first one.'}
      </div>
      {!hasFilters && (
        <button style={btnGold} onClick={() => onNavigate('boe')}>
          <Plus size={14} /> Generate First BOE
        </button>
      )}
    </div>
  )
}
