'use client'
import { useState } from 'react'
import { Download, ChevronDown } from 'lucide-react'
import { API } from '../../config/api.js'

function authHdr() {
  const t = localStorage.getItem('lunarae_auth_token')
  return t ? { Authorization: `Bearer ${t}` } : {}
}

export default function ActivityExportButton({ filters = {} }) {
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(null) // 'csv' | 'json' | null

  async function doExport(format) {
    setOpen(false)
    setLoading(format)
    try {
      const params = new URLSearchParams({ format })
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
      const res  = await fetch(`${API}/api/audit/export?${params}`, { headers: authHdr() })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.warn('[export]', err.message)
    } finally {
      setLoading(null)
    }
  }

  const busy = !!loading

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => !busy && setOpen(o => !o)}
        disabled={busy}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(10,18,32,0.8)',
          border: '1px solid rgba(30,58,95,0.6)',
          borderRadius: 10, padding: '8px 14px',
          fontSize: 12, fontWeight: 600,
          color: busy ? '#2a3d52' : '#8fa3bd',
          cursor: busy ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit', transition: 'all 0.15s',
          minHeight: 36,
        }}
        onMouseEnter={e => { if (!busy) e.currentTarget.style.borderColor = 'rgba(233,186,76,0.4)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(30,58,95,0.6)' }}
      >
        <Download size={13} strokeWidth={1.8} />
        {loading ? `Exporting ${loading.toUpperCase()}…` : 'Export'}
        <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 998 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 6,
            background: 'rgba(10,18,32,0.98)', border: '1px solid rgba(30,58,95,0.6)',
            borderRadius: 12, padding: '6px', minWidth: 148, zIndex: 999,
            boxShadow: '0 16px 48px rgba(0,0,0,0.55)',
            backdropFilter: 'blur(12px)',
          }}>
            {['csv', 'json'].map(fmt => (
              <button
                key={fmt}
                onClick={() => doExport(fmt)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '9px 12px',
                  background: 'transparent', border: 'none',
                  borderRadius: 8, cursor: 'pointer',
                  fontSize: 13, fontWeight: 500, color: '#8fa3bd',
                  fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(233,186,76,0.06)'; e.currentTarget.style.color = '#eef2f7' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8fa3bd' }}
              >
                <Download size={13} strokeWidth={1.8} />
                {fmt.toUpperCase()}
                <span style={{ fontSize: 10, color: '#2a3d52', marginLeft: 'auto' }}>
                  {fmt === 'csv' ? 'Spreadsheet' : 'Data'}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
