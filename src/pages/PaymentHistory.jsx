import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

const PLAN_COLOR   = { free: '#45607a', starter: '#3b82f6', professional: '#8b5cf6', enterprise: '#e9ba4c' }
const METHOD_ICON  = { ecocash: '📱', zipit: '🏦', visa: '💳', mastercard: '💳' }
const METHOD_COLOR = { ecocash: '#16a34a', zipit: '#2563eb', visa: '#1d4ed8', mastercard: '#b91c1c' }
const STATUS_COLOR = {
  pending:    '#f97316', processing: '#60a5fa', paid: '#4ade80',
  completed:  '#4ade80', failed:     '#f87171', cancelled: '#45607a',
  refunded:   '#a78bfa', draft:      '#45607a',
}

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

function Badge({ label, color }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700,
      background: color + '22', color, border: `1px solid ${color}44`,
      textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>{label}</span>
  )
}

function fmtDate(d) { return d ? new Date(d).toLocaleDateString() : '—' }
function fmtDateTime(d) { return d ? new Date(d).toLocaleString() : '—' }

/* ════════════════════════════════════════════════════════
   Invoice detail modal — printable invoice layout
════════════════════════════════════════════════════════ */
function InvoiceModal({ invoiceId, onClose, onPay, onNavigateCheckout }) {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState(null) // payment id being retried

  useEffect(() => {
    api(`/api/payments/invoices/${invoiceId}`)
      .then(setData)
      .finally(() => setLoading(false))
  }, [invoiceId])

  async function handleRetry(paymentId) {
    setRetrying(paymentId)
    try {
      await api(`/api/payments/retry/${paymentId}`, { method: 'POST', body: JSON.stringify({}) })
      const fresh = await api(`/api/payments/invoices/${invoiceId}`)
      setData(fresh)
    } catch (e) { alert(e.message) }
    finally { setRetrying(null) }
  }

  function printInvoice() {
    const w = window.open('', '_blank')
    w.document.write(buildInvoiceHTML(data.invoice, data.payments, user))
    w.document.close()
    w.print()
  }

  const inv = data?.invoice
  const pmts = data?.payments || []

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'rgba(3,6,14,0.88)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={onClose}>
      <div className="invoice-modal-inner" style={{
        background: 'rgba(10,18,32,0.95)', border: '1px solid rgba(30,58,95,0.55)', borderRadius: 20,
        width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto',
        padding: 32, boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }} onClick={e => e.stopPropagation()}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#45607a' }}>Loading…</div>
        ) : inv ? (
          <>
            {/* Invoice header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#e9ba4c', fontFamily: 'monospace', marginBottom: 4 }}>
                  {inv.invoice_number}
                </div>
                <div style={{ fontSize: 13, color: '#45607a' }}>
                  Issued {fmtDate(inv.created_at)} · Due {fmtDate(inv.due_date)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Badge label={inv.status} color={STATUS_COLOR[inv.status] || '#45607a'} />
                <button onClick={printInvoice} style={{ ...btnSmall, color: '#60a5fa', borderColor: '#60a5fa44' }}>
                  Print / Download PDF
                </button>
              </div>
            </div>

            {/* From / To */}
            <div className="invoice-from-to" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div style={infoBox}>
                <div style={infoLabel}>From</div>
                <div style={infoVal}>Lunarae Technologies</div>
                <div style={{ fontSize: 11, color: '#45607a' }}>Zimbabwe Customs Intelligence</div>
              </div>
              <div style={infoBox}>
                <div style={infoLabel}>Bill To</div>
                <div style={infoVal}>{inv.company_name}</div>
                {inv.contact_email && <div style={{ fontSize: 11, color: '#45607a' }}>{inv.contact_email}</div>}
                <div style={{ fontSize: 11, color: '#45607a' }}>Prepared by {inv.created_by}</div>
              </div>
            </div>

            {/* Line items */}
            <div style={{ background: '#06090f', borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#45607a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                <span>Description</span><span>Amount</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#eef2f7', paddingBottom: 10, borderBottom: '1px solid #1e3a5f' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Lunarae {inv.plan.charAt(0).toUpperCase() + inv.plan.slice(1)} Plan</div>
                  <div style={{ fontSize: 11, color: '#45607a', marginTop: 2 }}>Monthly subscription — 1 month</div>
                </div>
                <span style={{ fontWeight: 700 }}>${Number(inv.amount).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, color: '#e9ba4c', paddingTop: 12 }}>
                <span>Total Due</span>
                <span>${Number(inv.amount).toFixed(2)} {inv.currency}</span>
              </div>
            </div>

            {/* Pay now button for pending invoices */}
            {(inv.status === 'pending' || inv.status === 'failed') && (
              <button onClick={() => onNavigateCheckout(inv.plan)} style={{ ...btnPrimary, width: '100%', marginBottom: 20 }}>
                Pay Now →
              </button>
            )}

            {/* Payment history */}
            {pmts.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#45607a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Payment Attempts
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pmts.map(p => (
                    <div key={p.id} style={{
                      background: 'rgba(6,9,15,0.5)', borderRadius: 9, padding: '10px 14px',
                      border: '1px solid rgba(30,58,95,0.35)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{METHOD_ICON[p.payment_method]}</span>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: METHOD_COLOR[p.payment_method] }}>
                            {p.payment_method.toUpperCase()}
                          </div>
                          <div style={{ fontSize: 10, color: '#45607a' }}>
                            {fmtDateTime(p.created_at)} {p.retry_count > 0 ? `· Attempt ${p.retry_count + 1}` : ''}
                          </div>
                          {p.failure_reason && (
                            <div style={{ fontSize: 10, color: '#f87171', marginTop: 2 }}>{p.failure_reason}</div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Badge label={p.status} color={STATUS_COLOR[p.status] || '#45607a'} />
                        {p.status === 'failed' && p.retry_count < 3 && (
                          <button
                            onClick={() => handleRetry(p.id)}
                            disabled={retrying === p.id}
                            style={{ ...btnSmall, color: '#f97316', borderColor: '#f9731644' }}
                          >
                            {retrying === p.id ? '…' : 'Retry'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ color: '#f87171', textAlign: 'center', padding: 20 }}>Invoice not found</div>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   Invoice HTML for printing
════════════════════════════════════════════════════════ */
function buildInvoiceHTML(inv, payments, user) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Invoice ${inv.invoice_number}</title>
<style>
  body { font-family: Arial, sans-serif; color: #111; max-width: 700px; margin: 40px auto; }
  .header { display:flex; justify-content:space-between; border-bottom:2px solid #c8921a; padding-bottom:16px; margin-bottom:24px; }
  .logo { font-size:22px; font-weight:900; color:#c8921a; }
  .badge { background:#f5f5f5; border:1px solid #ddd; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700; }
  .row { display:flex; justify-content:space-between; }
  .line { border-top:1px solid #eee; padding-top:8px; margin-top:8px; }
  .total { font-size:18px; font-weight:900; color:#c8921a; }
  table { width:100%; border-collapse:collapse; }
  th { text-align:left; font-size:11px; color:#888; text-transform:uppercase; border-bottom:1px solid #eee; padding:6px 0; }
  td { padding:8px 0; font-size:13px; border-bottom:1px solid #f5f5f5; }
  .footer { margin-top:40px; font-size:11px; color:#888; text-align:center; border-top:1px solid #eee; padding-top:16px; }
  @media print { body { margin: 20px; } }
</style>
</head>
<body>
<div class="header">
  <div><div class="logo">Lunarae</div><div style="font-size:12px;color:#666;margin-top:4px">Zimbabwe Customs Intelligence Platform</div></div>
  <div style="text-align:right">
    <div style="font-size:14px;font-weight:700">INVOICE</div>
    <div style="font-size:18px;font-weight:900;color:#c8921a;font-family:monospace">${inv.invoice_number}</div>
    <span class="badge">${inv.status.toUpperCase()}</span>
  </div>
</div>
<div class="row" style="margin-bottom:24px;gap:40px">
  <div><div style="font-size:11px;color:#888;text-transform:uppercase;margin-bottom:6px">From</div>
    <div style="font-weight:700">Lunarae Technologies</div>
    <div style="color:#666;font-size:12px">Zimbabwe Customs Intelligence</div>
  </div>
  <div><div style="font-size:11px;color:#888;text-transform:uppercase;margin-bottom:6px">Bill To</div>
    <div style="font-weight:700">${inv.company_name}</div>
    <div style="color:#666;font-size:12px">${inv.contact_email || ''}</div>
    <div style="color:#666;font-size:12px">${inv.created_by}</div>
  </div>
  <div><div style="font-size:11px;color:#888;text-transform:uppercase;margin-bottom:6px">Dates</div>
    <div style="font-size:12px">Issued: ${new Date(inv.created_at).toLocaleDateString()}</div>
    <div style="font-size:12px">Due: ${inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</div>
    ${inv.paid_at ? `<div style="font-size:12px;color:green">Paid: ${new Date(inv.paid_at).toLocaleDateString()}</div>` : ''}
  </div>
</div>
<table>
  <tr><th>Description</th><th style="text-align:right">Amount</th></tr>
  <tr><td>Lunarae ${inv.plan.charAt(0).toUpperCase() + inv.plan.slice(1)} Plan — Monthly Subscription<br><span style="font-size:11px;color:#888">1 month × $${Number(inv.amount).toFixed(2)}</span></td>
      <td style="text-align:right;font-weight:700">$${Number(inv.amount).toFixed(2)}</td></tr>
</table>
<div style="text-align:right;margin-top:20px;padding-top:12px;border-top:2px solid #c8921a">
  <span class="total">Total: $${Number(inv.amount).toFixed(2)} ${inv.currency}</span>
</div>
${payments.length ? `<div style="margin-top:32px"><div style="font-size:11px;color:#888;text-transform:uppercase;margin-bottom:8px">Payment History</div>
<table><tr><th>Method</th><th>Status</th><th>Date</th></tr>
${payments.map(p => `<tr><td>${p.payment_method.toUpperCase()}</td><td>${p.status}</td><td>${new Date(p.created_at).toLocaleDateString()}</td></tr>`).join('')}
</table></div>` : ''}
<div class="footer">Lunarae Zimbabwe Customs Intelligence Platform · Powered by Paynow Zimbabwe<br>
ASYCUDA World Compliant · SI 35/2024 · SI 122/2017</div>
</body></html>`
}

/* ════════════════════════════════════════════════════════
   Main PaymentHistory page
════════════════════════════════════════════════════════ */
export default function PaymentHistory({ onNavigate }) {
  const [tab,       setTab]    = useState('invoices')
  const [invoices,  setInvoices] = useState([])
  const [payments,  setPayments] = useState([])
  const [invTotal,  setInvTotal] = useState(0)
  const [payTotal,  setPayTotal] = useState(0)
  const [invPage,   setInvPage]  = useState(1)
  const [payPage,   setPayPage]  = useState(1)
  const [loading,   setLoading]  = useState(true)
  const [selected,  setSelected] = useState(null) // invoice id for detail modal
  const [toast,     setToast]    = useState(null)

  const LIMIT = 20

  const loadInvoices = useCallback(async () => {
    setLoading(true)
    try {
      const d = await api(`/api/payments/invoices?page=${invPage}&limit=${LIMIT}`)
      setInvoices(d.invoices); setInvTotal(d.total)
    } catch {} finally { setLoading(false) }
  }, [invPage])

  const loadPayments = useCallback(async () => {
    setLoading(true)
    try {
      const d = await api(`/api/payments/history?page=${payPage}&limit=${LIMIT}`)
      setPayments(d.payments); setPayTotal(d.total)
    } catch {} finally { setLoading(false) }
  }, [payPage])

  useEffect(() => { if (tab === 'invoices') loadInvoices(); else loadPayments() }, [tab, loadInvoices, loadPayments])

  function notify(msg, err = false) {
    setToast({ msg, err })
    setTimeout(() => setToast(null), 3000)
  }

  const invPages = Math.ceil(invTotal / LIMIT)
  const payPages = Math.ceil(payTotal / LIMIT)

  return (
    <>
      {toast && (
        <div className="toast-mobile" style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: toast.err ? 'rgba(127,29,29,0.95)' : 'rgba(20,83,45,0.95)',
          border: `1px solid ${toast.err ? 'rgba(248,113,113,0.3)' : 'rgba(74,222,128,0.3)'}`,
          borderRadius: 10, padding: '12px 20px',
          fontSize: 14, color: toast.err ? '#fca5a5' : '#86efac', fontWeight: 600,
        }}>{toast.msg}</div>
      )}

      <div className="portal-page" style={{
        minHeight: '100vh', background: '#06090f', color: '#eef2f7',
        fontFamily: "'DM Sans', sans-serif", padding: '32px 24px 80px',
        maxWidth: 1000, margin: '0 auto',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>Payments & Invoices</div>
            <div style={{ fontSize: 13, color: '#45607a', marginTop: 4 }}>Subscription billing history</div>
          </div>
          <button
            onClick={() => onNavigate('checkout')}
            style={{ background: 'linear-gradient(135deg,#e9ba4c,#c8921a)', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, color: '#06090f', cursor: 'pointer' }}
          >
            Upgrade Plan
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid rgba(30,58,95,0.55)' }}>
          {[{ id: 'invoices', label: `Invoices (${invTotal})` }, { id: 'payments', label: `Payment History (${payTotal})` }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: 'none', border: 'none', fontFamily: 'inherit', borderBottom: `2px solid ${tab === t.id ? '#e9ba4c' : 'transparent'}`,
              padding: '10px 20px', fontSize: 13, fontWeight: 700,
              color: tab === t.id ? '#e9ba4c' : '#45607a', cursor: 'pointer',
              marginBottom: -1, transition: 'all 0.15s',
            }}>{t.label}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#45607a' }}>Loading…</div>
        ) : tab === 'invoices' ? (
          <>
            {invoices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#45607a' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🧾</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No invoices yet</div>
                <div style={{ fontSize: 13, marginBottom: 20 }}>Upgrade your plan to get started</div>
                <button onClick={() => onNavigate('checkout')} style={{ background: 'linear-gradient(135deg,#e9ba4c,#c8921a)', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, color: '#06090f', cursor: 'pointer' }}>
                  View Plans
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {invoices.map(inv => (
                  <div key={inv.id} style={{
                    background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(30,58,95,0.55)', borderRadius: 12,
                    padding: '16px 20px', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', flexWrap: 'wrap', gap: 12, cursor: 'pointer',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(30,58,95,0.9)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(30,58,95,0.55)'; e.currentTarget.style.boxShadow = 'none' }}
                    onClick={() => setSelected(inv.id)}
                  >
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                        background: (PLAN_COLOR[inv.plan] || '#45607a') + '20',
                        border: `1px solid ${(PLAN_COLOR[inv.plan] || '#45607a')}44`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                      }}>🧾</div>
                      <div>
                        <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#e9ba4c' }}>{inv.invoice_number}</div>
                        <div style={{ fontSize: 11, color: '#45607a', marginTop: 2 }}>
                          {inv.plan.charAt(0).toUpperCase() + inv.plan.slice(1)} Plan · {fmtDate(inv.created_at)}
                          {inv.attempts > 0 ? ` · ${inv.attempts} attempt${inv.attempts !== 1 ? 's' : ''}` : ''}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: inv.status === 'paid' ? '#4ade80' : '#eef2f7' }}>
                        ${Number(inv.amount).toFixed(2)}
                      </div>
                      <Badge label={inv.status} color={STATUS_COLOR[inv.status] || '#45607a'} />
                      {(inv.status === 'pending' || inv.status === 'failed') && (
                        <button
                          onClick={e => { e.stopPropagation(); onNavigate('checkout', inv.plan) }}
                          style={{ background: 'linear-gradient(135deg,#e9ba4c,#c8921a)', border: 'none', borderRadius: 7, padding: '5px 12px', fontSize: 11, fontWeight: 700, color: '#06090f', cursor: 'pointer' }}
                        >Pay Now</button>
                      )}
                    </div>
                  </div>
                ))}
                {invPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 16 }}>
                    <button onClick={() => setInvPage(p => Math.max(1, p - 1))} disabled={invPage === 1} style={btnPage}>← Prev</button>
                    <span style={{ color: '#45607a', fontSize: 12, lineHeight: '32px' }}>Page {invPage} of {invPages}</span>
                    <button onClick={() => setInvPage(p => Math.min(invPages, p + 1))} disabled={invPage === invPages} style={btnPage}>Next →</button>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* ── Payments tab ── */
          <>
            {payments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#45607a' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No payments yet</div>
              </div>
            ) : (
              <div>
                <div className="tbl-responsive-wrap" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr>
                        {['Method', 'Invoice', 'Plan', 'Amount', 'Status', 'Date', 'Actions'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, fontWeight: 700, color: '#45607a', textTransform: 'uppercase', letterSpacing: '0.09em', borderBottom: '1px solid rgba(30,58,95,0.4)', background: 'rgba(6,9,15,0.35)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid rgba(30,58,95,0.25)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(30,58,95,0.08)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td data-label="Method" style={{ padding: '12px', color: '#8fa3bd' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 18 }}>{METHOD_ICON[p.payment_method]}</span>
                              <span style={{ fontWeight: 700, color: METHOD_COLOR[p.payment_method] }}>{p.payment_method.toUpperCase()}</span>
                            </div>
                          </td>
                          <td data-label="Invoice" style={{ padding: '12px', fontFamily: 'monospace', color: '#e9ba4c', fontSize: 12 }}>{p.invoice_number}</td>
                          <td data-label="Plan" style={{ padding: '12px' }}>
                            <Badge label={p.plan} color={PLAN_COLOR[p.plan] || '#45607a'} />
                          </td>
                          <td data-label="Amount" style={{ padding: '12px', fontWeight: 700, color: p.status === 'completed' ? '#4ade80' : '#eef2f7' }}>
                            ${Number(p.amount).toFixed(2)}
                          </td>
                          <td data-label="Status" style={{ padding: '12px' }}>
                            <div>
                              <Badge label={p.status} color={STATUS_COLOR[p.status] || '#45607a'} />
                              {p.failure_reason && (
                                <div style={{ fontSize: 10, color: '#f87171', marginTop: 4 }}>{p.failure_reason}</div>
                              )}
                            </div>
                          </td>
                          <td data-label="Date" style={{ padding: '12px', color: '#45607a', fontSize: 11, whiteSpace: 'nowrap' }}>
                            {fmtDateTime(p.created_at)}
                            {p.retry_count > 0 && <div style={{ color: '#f97316' }}>Attempt {p.retry_count + 1}</div>}
                          </td>
                          <td data-label="Actions" style={{ padding: '12px' }}>
                            {p.status === 'failed' && p.retry_count < 3 && (
                              <button
                                onClick={() => setSelected(p.invoice_id)}
                                style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#f97316', cursor: 'pointer' }}
                              >
                                Retry
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {payPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 16 }}>
                    <button onClick={() => setPayPage(p => Math.max(1, p - 1))} disabled={payPage === 1} style={btnPage}>← Prev</button>
                    <span style={{ color: '#45607a', fontSize: 12, lineHeight: '32px' }}>Page {payPage} of {payPages}</span>
                    <button onClick={() => setPayPage(p => Math.min(payPages, p + 1))} disabled={payPage === payPages} style={btnPage}>Next →</button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {selected && (
        <InvoiceModal
          invoiceId={selected}
          onClose={() => setSelected(null)}
          onNavigateCheckout={plan => { setSelected(null); onNavigate('checkout', plan) }}
        />
      )}
    </>
  )
}

const btnPrimary   = { background: 'linear-gradient(135deg,#e9ba4c,#c8921a)', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, color: '#06090f', cursor: 'pointer', fontFamily: 'inherit', transition: 'filter 0.18s' }
const btnSmall     = { background: 'none', border: '1px solid rgba(30,58,95,0.55)', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }
const btnPage      = { background: 'rgba(10,18,32,0.85)', border: '1px solid rgba(30,58,95,0.55)', borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 600, color: '#8fa3bd', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }
const infoBox      = { background: 'rgba(6,9,15,0.5)', borderRadius: 9, padding: '12px 14px', border: '1px solid rgba(30,58,95,0.35)' }
const infoLabel    = { fontSize: 10, color: '#45607a', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 4 }
const infoVal      = { fontSize: 14, fontWeight: 700, color: '#eef2f7' }
