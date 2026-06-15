import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { API } from '../config/api.js'

const ROLE_OPTS = [
  { value: 'clearing_agent', label: 'Clearing Agent' },
  { value: 'clerk',          label: 'Clerk'           },
]

const ROLE_COLORS = {
  super_admin:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  company_owner:  { color: '#e9ba4c', bg: 'rgba(233,186,76,0.12)'  },
  clearing_agent: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  clerk:          { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
}
const ROLE_LABELS = {
  super_admin: 'Super Admin', company_owner: 'Company Owner',
  clearing_agent: 'Clearing Agent', clerk: 'Clerk',
}

export default function UserManagement({ onNavigate }) {
  const { user } = useAuth()
  const isOwner  = user?.role === 'company_owner' || user?.role === 'super_admin'

  const [users,   setUsers]   = useState([])
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('team') // 'team' | 'invites'

  /* invite form state */
  const [showInvite, setShowInvite] = useState(false)
  const [invEmail,   setInvEmail]   = useState('')
  const [invRole,    setInvRole]    = useState('clearing_agent')
  const [inviting,   setInviting]   = useState(false)
  const [inviteResult, setInviteResult] = useState(null)
  const [inviteErr, setInviteErr]   = useState('')

  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('lunarae_auth_token')}` })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [uRes, iRes] = await Promise.all([
        fetch(`${API}/api/company/users`,   { headers: authHeader() }),
        isOwner ? fetch(`${API}/api/company/invites`, { headers: authHeader() }) : Promise.resolve(null),
      ])
      const uData = await uRes.json()
      setUsers(uData.users || [])
      if (iRes) {
        const iData = await iRes.json()
        setInvites(iData.invites || [])
      }
    } catch { /* swallow */ }
    finally { setLoading(false) }
  }, [isOwner])

  useEffect(() => { load() }, [load])

  async function changeRole(userId, role) {
    setMsg(''); setErr('')
    try {
      const res  = await fetch(`${API}/api/company/users/${userId}/role`, {
        method: 'PUT', headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMsg('Role updated')
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
    } catch (err) { setErr(err.message) }
  }

  async function toggleStatus(userId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active'
    setMsg(''); setErr('')
    try {
      const res  = await fetch(`${API}/api/company/users/${userId}/status`, {
        method: 'PUT', headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMsg(`User ${newStatus}`)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u))
    } catch (err) { setErr(err.message) }
  }

  async function cancelInvite(inviteId) {
    setMsg(''); setErr('')
    try {
      const res  = await fetch(`${API}/api/company/invites/${inviteId}`, {
        method: 'DELETE', headers: authHeader(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMsg('Invitation cancelled')
      setInvites(prev => prev.filter(i => i.id !== inviteId))
    } catch (err) { setErr(err.message) }
  }

  async function sendInvite(e) {
    e.preventDefault()
    setInviting(true); setInviteErr(''); setInviteResult(null)
    try {
      const res  = await fetch(`${API}/api/company/invites`, {
        method: 'POST', headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: invEmail, role: invRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setInviteResult(data)
      setInvEmail('')
      load()
    } catch (err) { setInviteErr(err.message) }
    finally { setInviting(false) }
  }

  return (
    <div className="portal-page" style={page}>
      {/* Page header */}
      <div style={headerWrap}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#eef2f7', letterSpacing: '-0.02em' }}>Team Management</div>
          <div style={{ fontSize: 13, color: '#8fa3bd', marginTop: 4 }}>
            {users.length} member{users.length !== 1 ? 's' : ''} in your company
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigate('company')}
            style={ghostBtn}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(30,58,95,0.9)'; e.currentTarget.style.color = '#eef2f7' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(30,58,95,0.55)'; e.currentTarget.style.color = '#8fa3bd' }}
          >← Dashboard</button>
          {isOwner && (
            <button
              onClick={() => { setShowInvite(true); setInviteResult(null); setInviteErr('') }}
              style={primaryBtn}
              onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              + Invite Member
            </button>
          )}
        </div>
      </div>

      {msg && <MsgBox type="success">{msg}</MsgBox>}
      {err && <MsgBox type="error">{err}</MsgBox>}

      {/* Invite Panel */}
      {showInvite && isOwner && (
        <div style={invitePanel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(233,186,76,0.12)', border: '1px solid rgba(233,186,76,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                ✉️
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#eef2f7' }}>Invite a New Member</span>
            </div>
            <button
              onClick={() => { setShowInvite(false); setInviteResult(null) }}
              style={{ background: 'none', border: 'none', color: '#45607a', fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 4 }}
            >✕</button>
          </div>

          {inviteResult ? (
            <div>
              <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#34d399', fontWeight: 700, marginBottom: 8 }}>✓ Invitation created</div>
                <div style={{ fontSize: 12, color: '#8fa3bd', marginBottom: 8 }}>Share this link with your new team member:</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <code style={{ flex: 1, background: 'rgba(6,9,15,0.6)', border: '1px solid rgba(30,58,95,0.55)', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#e9ba4c', wordBreak: 'break-all' }}>
                    {inviteResult.invite_url}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(inviteResult.invite_url).then(() => setMsg('Link copied!'))}
                    style={{ ...ghostBtn, flexShrink: 0 }}>Copy</button>
                </div>
              </div>
              <button
                onClick={() => { setInviteResult(null); setInvEmail('') }}
                style={primaryBtn}
                onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
              >Invite Another</button>
            </div>
          ) : (
            <form onSubmit={sendInvite}>
              {inviteErr && <MsgBox type="error">{inviteErr}</MsgBox>}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                <div style={{ flex: '2 1 220px' }}>
                  <label style={lbl}>Email Address</label>
                  <input type="email" required value={invEmail} onChange={e => setInvEmail(e.target.value)}
                    placeholder="employee@company.com" style={inp}
                    onFocus={e => e.target.style.borderColor = '#e9ba4c'}
                    onBlur={e  => e.target.style.borderColor = 'rgba(30,58,95,0.55)'}/>
                </div>
                <div style={{ flex: '1 1 160px' }}>
                  <label style={lbl}>Role</label>
                  <select value={invRole} onChange={e => setInvRole(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                    {ROLE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={inviting}
                style={{ ...primaryBtn, opacity: inviting ? 0.7 : 1 }}
                onMouseEnter={e => !inviting && (e.currentTarget.style.filter = 'brightness(1.1)')}
                onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
              >
                {inviting ? 'Sending…' : 'Generate Invite Link'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Tabs */}
      {isOwner && (
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid rgba(30,58,95,0.55)' }}>
          {['team', 'invites'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: 'none', border: 'none',
              borderBottom: tab === t ? '2px solid #e9ba4c' : '2px solid transparent',
              padding: '10px 20px', fontSize: 13, fontWeight: tab === t ? 700 : 500,
              color: tab === t ? '#e9ba4c' : '#8fa3bd', cursor: 'pointer',
              marginBottom: -1, transition: 'color 0.15s', fontFamily: 'inherit',
            }}>
              {t === 'team' ? `Team (${users.length})` : `Invites (${invites.filter(i => i.status === 'pending').length})`}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#45607a' }}>
          <div style={{ width: 32, height: 32, border: '3px solid rgba(30,58,95,0.55)', borderTopColor: '#e9ba4c', borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 14px' }} />
          <div style={{ fontSize: 13 }}>Loading team…</div>
        </div>
      ) : tab === 'team' ? (
        <TeamTab users={users} currentUser={user} isOwner={isOwner} onChangeRole={changeRole} onToggleStatus={toggleStatus} />
      ) : (
        <InvitesTab invites={invites} onCancel={cancelInvite} />
      )}
    </div>
  )
}

/* ── Team Tab ─────────────────────────────────────────────── */
function TeamTab({ users, currentUser, isOwner, onChangeRole, onToggleStatus }) {
  if (!users.length) return (
    <div style={emptyState}>
      <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.5 }}>👥</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#8fa3bd', marginBottom: 6 }}>No team members yet</div>
      <div style={{ color: '#45607a', fontSize: 13 }}>Invite your first employee to get started.</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {users.map(u => (
        <UserCard
          key={u.id}
          user={u}
          isSelf={u.id === currentUser?.id}
          isOwner={isOwner}
          onChangeRole={role => onChangeRole(u.id, role)}
          onToggleStatus={() => onToggleStatus(u.id, u.status)}
        />
      ))}
    </div>
  )
}

function UserCard({ user: u, isSelf, isOwner, onChangeRole, onToggleStatus }) {
  const rc = ROLE_COLORS[u.role] || ROLE_COLORS.clerk
  const canManage = isOwner && !isSelf && u.role !== 'company_owner'

  return (
    <div
      style={{
        background: 'rgba(10,18,32,0.85)',
        border: '1px solid rgba(30,58,95,0.55)',
        borderRadius: 14,
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 16,
        flexWrap: 'wrap',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(30,58,95,0.9)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(30,58,95,0.55)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      {/* Avatar */}
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: 'linear-gradient(135deg,#1e3a5f,#0f2040)',
        border: `1.5px solid ${rc.color}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, fontWeight: 700, color: rc.color, flexShrink: 0,
        boxShadow: `0 0 0 3px ${rc.color}0d`,
      }}>
        {(u.full_name || 'U')[0].toUpperCase()}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#eef2f7' }}>{u.full_name}</span>
          {isSelf && (
            <span style={{ fontSize: 10, color: '#45607a', fontWeight: 700, background: 'rgba(30,58,95,0.4)', borderRadius: 20, padding: '2px 8px', border: '1px solid rgba(30,58,95,0.6)' }}>You</span>
          )}
          <StatusPill status={u.status} />
        </div>
        <div style={{ fontSize: 12, color: '#45607a', marginTop: 2 }}>{u.email}</div>
        {u.last_login && (
          <div style={{ fontSize: 11, color: '#2a3d52', marginTop: 2 }}>
            Last login: {new Date(u.last_login).toLocaleDateString('en-ZW', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
          </div>
        )}
      </div>

      {/* Role badge / selector */}
      <div style={{ flexShrink: 0 }}>
        {canManage ? (
          <select
            value={u.role}
            onChange={e => onChangeRole(e.target.value)}
            style={{
              background: rc.bg, color: rc.color,
              border: `1px solid ${rc.color}33`, borderRadius: 20,
              padding: '5px 12px', fontSize: 11, fontWeight: 700,
              cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
            }}>
            {ROLE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : (
          <span style={{ background: rc.bg, color: rc.color, border: `1px solid ${rc.color}33`, fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '4px 12px' }}>
            {ROLE_LABELS[u.role]}
          </span>
        )}
      </div>

      {/* Actions */}
      {canManage && (
        <button
          onClick={onToggleStatus}
          style={{
            background: u.status === 'active' ? 'rgba(220,38,38,0.08)' : 'rgba(52,211,153,0.08)',
            border: `1px solid ${u.status === 'active' ? 'rgba(220,38,38,0.25)' : 'rgba(52,211,153,0.25)'}`,
            borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600,
            color: u.status === 'active' ? '#fca5a5' : '#6ee7b7',
            cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.2)' }}
          onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)' }}
        >
          {u.status === 'active' ? 'Disable' : 'Enable'}
        </button>
      )}
    </div>
  )
}

/* ── Invites Tab ──────────────────────────────────────────── */
function InvitesTab({ invites, onCancel }) {
  if (!invites.length) return (
    <div style={emptyState}>
      <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.5 }}>✉️</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#8fa3bd', marginBottom: 6 }}>No invitations yet</div>
      <div style={{ color: '#45607a', fontSize: 13 }}>Send your first invite to grow your team.</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {invites.map(inv => {
        const isPending = inv.status === 'pending' && new Date(inv.expires_at) > new Date()
        const rc = ROLE_COLORS[inv.role] || ROLE_COLORS.clerk
        return (
          <div key={inv.id} style={{
            background: 'rgba(10,18,32,0.85)',
            border: '1px solid rgba(30,58,95,0.55)',
            borderRadius: 14,
            padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            opacity: isPending ? 1 : 0.5,
            transition: 'border-color 0.15s',
          }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(30,58,95,0.4)', border: '1px solid rgba(30,58,95,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>✉️</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#eef2f7' }}>{inv.email}</div>
              <div style={{ fontSize: 12, color: '#45607a', marginTop: 2 }}>
                Invited by {inv.invited_by_name} · Expires {new Date(inv.expires_at).toLocaleDateString('en-ZW')}
              </div>
            </div>
            <span style={{ background: rc.bg, color: rc.color, border: `1px solid ${rc.color}33`, fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '4px 10px', flexShrink: 0 }}>
              {ROLE_LABELS[inv.role]}
            </span>
            <InviteStatusPill status={inv.status} expires={inv.expires_at} />
            {isPending && (
              <button onClick={() => onCancel(inv.id)} style={{
                background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)',
                borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 700,
                color: '#fca5a5', cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit',
              }}>Cancel</button>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Small components ─────────────────────────────────────── */
function StatusPill({ status }) {
  const map = {
    active:    { c: '#4ade80', bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.2)'  },
    suspended: { c: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)' },
    inactive:  { c: '#8fa3bd', bg: 'rgba(143,163,189,0.1)', border: 'rgba(143,163,189,0.2)' },
  }
  const s = map[status] || map.inactive
  return <span style={{ background: s.bg, color: s.c, border: `1px solid ${s.border}`, fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{status}</span>
}

function InviteStatusPill({ status, expires }) {
  const expired = new Date(expires) < new Date()
  const label   = status === 'accepted' ? 'accepted' : status === 'expired' || expired ? 'expired' : 'pending'
  const map = {
    pending:  { c: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.2)'  },
    accepted: { c: '#4ade80', bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.2)'  },
    expired:  { c: '#45607a', bg: 'rgba(69,96,122,0.1)',   border: 'rgba(69,96,122,0.2)'   },
  }
  const s = map[label] || map.expired
  return <span style={{ background: s.bg, color: s.c, border: `1px solid ${s.border}`, fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
}

function MsgBox({ type, children }) {
  const isErr = type === 'error'
  return (
    <div style={{
      background: isErr ? 'rgba(220,38,38,0.08)' : 'rgba(74,222,128,0.08)',
      border: `1px solid ${isErr ? 'rgba(220,38,38,0.25)' : 'rgba(74,222,128,0.2)'}`,
      borderRadius: 10, padding: '10px 14px', marginBottom: 16,
      fontSize: 13, color: isErr ? '#fca5a5' : '#86efac',
    }}>{children}</div>
  )
}

/* ── Styles ── */
const page = {
  minHeight: '100vh', background: '#06090f',
  fontFamily: "'DM Sans', -apple-system, sans-serif",
  color: '#eef2f7', padding: '32px 24px 80px',
  maxWidth: 900, margin: '0 auto',
}
const headerWrap = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  flexWrap: 'wrap', gap: 16, marginBottom: 28,
  paddingBottom: 24, borderBottom: '1px solid rgba(30,58,95,0.4)',
}
const invitePanel = {
  background: 'rgba(10,18,32,0.85)',
  border: '1px solid rgba(233,186,76,0.2)',
  borderRadius: 16, padding: '24px', marginBottom: 28,
  boxShadow: '0 4px 24px rgba(0,0,0,0.25), 0 0 0 1px rgba(233,186,76,0.05)',
}
const emptyState = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  padding: '64px 20px', background: 'rgba(10,18,32,0.85)',
  border: '1px solid rgba(30,58,95,0.55)', borderRadius: 16, textAlign: 'center',
}
const primaryBtn = {
  background: 'linear-gradient(135deg, #e9ba4c, #c8921a)',
  border: 'none', borderRadius: 10, padding: '10px 20px',
  fontSize: 13, fontWeight: 700, color: '#06090f', cursor: 'pointer',
  minHeight: 40, display: 'inline-flex', alignItems: 'center', gap: 6,
  transition: 'all 0.18s ease', fontFamily: 'inherit',
}
const ghostBtn = {
  background: 'rgba(10,18,32,0.6)',
  border: '1px solid rgba(30,58,95,0.55)',
  borderRadius: 10, padding: '9px 18px', fontSize: 13,
  fontWeight: 600, color: '#8fa3bd', cursor: 'pointer', minHeight: 40,
  display: 'inline-flex', alignItems: 'center', gap: 6,
  transition: 'all 0.15s', fontFamily: 'inherit',
}
const lbl = { display: 'block', fontSize: 11, fontWeight: 700, color: '#45607a', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }
const inp = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(6,9,15,0.6)', border: '1px solid rgba(30,58,95,0.55)',
  borderRadius: 10, padding: '10px 14px', fontSize: 14,
  color: '#eef2f7', outline: 'none', transition: 'border-color 0.15s',
  fontFamily: 'inherit', minHeight: 42,
}
