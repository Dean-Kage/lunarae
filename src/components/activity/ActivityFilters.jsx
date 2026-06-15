import { useState } from 'react'
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react'

const ACTION_GROUPS = {
  AUTH:    ['LOGIN', 'LOGOUT', 'REGISTER', 'PASSWORD_CHANGE', 'PASSWORD_RESET'],
  COMPANY: ['COMPANY_CREATED', 'COMPANY_UPDATED', 'USER_INVITED', 'USER_REMOVED', 'USER_ACCEPTED_INVITE'],
  BOE:     ['BOE_CREATED', 'BOE_UPDATED', 'BOE_DELETED', 'BOE_EXPORTED_XML', 'BOE_VIEWED'],
  CUSTOMS: ['CLASSIFICATION_APPROVED', 'CLASSIFICATION_REJECTED', 'CLASSIFICATION_SUBMITTED'],
  BILLING: ['SUBSCRIPTION_CHANGED', 'PAYMENT_CREATED', 'PAYMENT_CONFIRMED', 'PAYMENT_FAILED'],
  ADMIN:   ['USER_DISABLED', 'USER_ENABLED', 'USER_DELETED', 'SETTINGS_CHANGED', 'COMPANY_SETTINGS_CHANGED'],
}

const GROUP_COLORS = {
  AUTH: '#60a5fa', COMPANY: '#34d399', BOE: '#e9ba4c',
  CUSTOMS: '#a78bfa', BILLING: '#4ade80', ADMIN: '#f97316',
}

const inputStyle = {
  width: '100%', background: 'rgba(6,9,15,0.7)',
  border: '1px solid rgba(30,58,95,0.55)', borderRadius: 10,
  padding: '9px 13px', fontSize: 13, color: '#eef2f7',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
}

const labelStyle = {
  display: 'block', fontSize: 10, color: '#45607a',
  textTransform: 'uppercase', letterSpacing: '0.08em',
  fontWeight: 700, marginBottom: 5,
}

/* ── Field wrapper ─────────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

/* ── Group toggle for action filter ─────────────────────── */
function GroupToggle({ group, color, selected, onToggle }) {
  const allActions  = ACTION_GROUPS[group]
  const allSelected = allActions.every(a => selected.includes(a))

  return (
    <div>
      <button
        onClick={() => onToggle(group)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: allSelected ? (color + '18') : 'rgba(6,9,15,0.4)',
          border: `1px solid ${allSelected ? color + '40' : 'rgba(30,58,95,0.4)'}`,
          borderRadius: 8, padding: '5px 10px',
          fontSize: 11, fontWeight: 700, color: allSelected ? color : '#45607a',
          cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
          width: '100%', textAlign: 'left',
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
        {group}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: allSelected ? color : '#2a3d52' }}>
          {allSelected ? 'All' : 'Any'}
        </span>
      </button>
    </div>
  )
}

/* ── Filter panel inner content ─────────────────────────── */
function FilterFields({ filters, onChange, isAdmin }) {
  const [actionExpanded, setActionExpanded] = useState(false)

  const selectedActions = filters.action ? filters.action.split(',') : []

  function toggleGroup(group) {
    const groupActions = ACTION_GROUPS[group]
    const allSelected  = groupActions.every(a => selectedActions.includes(a))
    let next
    if (allSelected) {
      next = selectedActions.filter(a => !groupActions.includes(a))
    } else {
      next = [...new Set([...selectedActions, ...groupActions])]
    }
    onChange('action', next.length ? next.join(',') : '')
  }

  function clearAll() {
    onChange('action', '')
    onChange('entity_type', '')
    onChange('from_date', '')
    onChange('to_date', '')
    onChange('search', '')
    if (isAdmin) { onChange('company_id', ''); onChange('user_id', '') }
  }

  const hasFilters = filters.action || filters.entity_type || filters.from_date ||
    filters.to_date || filters.search || filters.company_id || filters.user_id

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Search */}
      <Field label="Search">
        <input
          style={inputStyle}
          placeholder="Actor, company, details…"
          value={filters.search || ''}
          onChange={e => onChange('search', e.target.value)}
        />
      </Field>

      {/* Date range */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="From date">
          <input
            type="date"
            style={{ ...inputStyle, colorScheme: 'dark' }}
            value={filters.from_date || ''}
            onChange={e => onChange('from_date', e.target.value)}
          />
        </Field>
        <Field label="To date">
          <input
            type="date"
            style={{ ...inputStyle, colorScheme: 'dark' }}
            value={filters.to_date || ''}
            onChange={e => onChange('to_date', e.target.value)}
          />
        </Field>
      </div>

      {/* Entity type */}
      <Field label="Entity type">
        <select
          style={{ ...inputStyle, cursor: 'pointer' }}
          value={filters.entity_type || ''}
          onChange={e => onChange('entity_type', e.target.value)}
        >
          <option value="">All types</option>
          {['user', 'company', 'boe', 'payment', 'subscription', 'classification', 'invoice'].map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
      </Field>

      {/* Admin-only filters */}
      {isAdmin && (
        <Field label="Company ID">
          <input
            style={inputStyle}
            placeholder="Filter by company ID…"
            value={filters.company_id || ''}
            onChange={e => onChange('company_id', e.target.value)}
          />
        </Field>
      )}

      {/* Action category filter */}
      <div>
        <button
          onClick={() => setActionExpanded(x => !x)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, width: '100%',
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', padding: '0 0 8px',
            color: filters.action ? '#e9ba4c' : '#45607a',
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Action Category
          </span>
          {filters.action && (
            <span style={{
              fontSize: 9, background: '#e9ba4c20', border: '1px solid #e9ba4c40',
              borderRadius: 4, padding: '1px 5px', color: '#e9ba4c', fontWeight: 700,
            }}>FILTERED</span>
          )}
          <span style={{ marginLeft: 'auto' }}>
            {actionExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </span>
        </button>

        {actionExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(ACTION_GROUPS).map(([group]) => (
              <GroupToggle
                key={group}
                group={group}
                color={GROUP_COLORS[group]}
                selected={selectedActions}
                onToggle={toggleGroup}
              />
            ))}
            {filters.action && (
              <button
                onClick={() => onChange('action', '')}
                style={{
                  fontSize: 11, color: '#f87171', background: 'none', border: 'none',
                  cursor: 'pointer', padding: '4px 0', textAlign: 'left', fontFamily: 'inherit',
                }}
              >
                Clear action filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Clear all */}
      {hasFilters && (
        <button
          onClick={clearAll}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)',
            borderRadius: 10, padding: '9px 14px', fontSize: 12, fontWeight: 600,
            color: '#f87171', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.15s', width: '100%',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.12)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(248,113,113,0.06)'}
        >
          <X size={12} />
          Clear all filters
        </button>
      )}
    </div>
  )
}

/* ── Desktop sidebar panel ──────────────────────────────── */
export function ActivityFiltersSidebar({ filters, onChange, isAdmin }) {
  return (
    <div style={{
      width: 240, flexShrink: 0,
      background: 'rgba(8,14,26,0.6)',
      border: '1px solid rgba(30,58,95,0.45)',
      borderRadius: 16, padding: '18px 16px',
      alignSelf: 'flex-start',
      position: 'sticky', top: 88,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Filter size={14} color="#45607a" strokeWidth={1.8} />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#eef2f7' }}>Filters</span>
      </div>
      <FilterFields filters={filters} onChange={onChange} isAdmin={isAdmin} />
    </div>
  )
}

/* ── Mobile bottom sheet ────────────────────────────────── */
export function ActivityFiltersSheet({ filters, onChange, isAdmin, open, onClose }) {
  if (!open) return null
  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(3,6,14,0.75)',
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      />
      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1001,
        background: 'rgba(8,14,26,0.99)',
        borderTop: '1px solid rgba(30,58,95,0.6)',
        borderRadius: '20px 20px 0 0',
        padding: '0 0 env(safe-area-inset-bottom, 0px)',
        maxHeight: '80vh', overflowY: 'auto',
        boxShadow: '0 -16px 64px rgba(0,0,0,0.55)',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(30,58,95,0.8)' }} />
        </div>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px 16px',
          borderBottom: '1px solid rgba(30,58,95,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={14} color="#45607a" strokeWidth={1.8} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#eef2f7' }}>Filters</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(30,58,95,0.3)', border: 'none', borderRadius: 8,
              width: 30, height: 30, display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', color: '#8fa3bd',
            }}
          >
            <X size={15} />
          </button>
        </div>
        {/* Content */}
        <div style={{ padding: '16px 20px 32px' }}>
          <FilterFields filters={filters} onChange={onChange} isAdmin={isAdmin} />
        </div>
      </div>
    </>
  )
}

export default ActivityFiltersSidebar
