import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

const ROLE_LABELS = {
  super_admin:    { label: 'Super Admin',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  company_owner:  { label: 'Company Owner',  color: '#e9ba4c', bg: 'rgba(233,186,76,0.12)'  },
  clearing_agent: { label: 'Clearing Agent', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  clerk:          { label: 'Clerk',          color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
}

export default function Profile({ onNavigate }) {
  const { user, logout, updateProfile, changePassword } = useAuth()

  const [editing,  setEditing]  = useState(false)
  const [form,     setForm]     = useState({ full_name: user?.full_name || '', phone: user?.phone || '', company_name: user?.company_name || '' })
  const [saving,   setSaving]   = useState(false)
  const [saveMsg,  setSaveMsg]  = useState('')
  const [saveErr,  setSaveErr]  = useState('')

  const [cpForm,   setCpForm]   = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [cpLoading, setCpLoading] = useState(false)
  const [cpMsg,    setCpMsg]    = useState('')
  const [cpErr,    setCpErr]    = useState('')
  const [showCp,   setShowCp]   = useState(false)

  const role = ROLE_LABELS[user?.role] || ROLE_LABELS.clearing_agent

  const saveProfile = async (e) => {
    e.preventDefault()
    setSaving(true); setSaveErr(''); setSaveMsg('')
    try {
      await updateProfile(form)
      setSaveMsg('Profile updated successfully')
      setEditing(false)
    } catch (err) {
      setSaveErr(err.message)
    } finally {
      setSaving(false)
    }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    setCpLoading(true); setCpErr(''); setCpMsg('')
    try {
      await changePassword(cpForm)
      setCpMsg('Password changed successfully')
      setCpForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      setCpErr(err.message)
    } finally {
      setCpLoading(false)
    }
  }

  const handleLogout = () => { logout() }

  return (
    <div style={{
      minHeight: '100vh', background: '#06090f',
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      color: '#eef2f7',
    }}>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* ── Profile hero header ── */}
        <div style={{
          background: 'rgba(10,18,32,0.85)',
          border: '1px solid rgba(30,58,95,0.55)',
          borderRadius: 20, padding: '28px 28px 24px',
          marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
          boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
        }}>
          {/* Avatar */}
          <div style={{
            width: 76, height: 76, borderRadius: 20,
            background: 'linear-gradient(135deg, #1e3a5f, #0f2040)',
            border: '2px solid rgba(233,186,76,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, fontWeight: 800, color: '#e9ba4c', flexShrink: 0,
            boxShadow: '0 0 0 4px rgba(233,186,76,0.06), 0 8px 24px rgba(0,0,0,0.35)',
          }}>
            {(user?.full_name || 'U')[0].toUpperCase()}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#eef2f7', marginBottom: 4, letterSpacing: '-0.02em' }}>
              {user?.full_name}
            </div>
            <div style={{ fontSize: 13, color: '#45607a', marginBottom: 10 }}>{user?.email}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <span style={{
                background: role.bg, color: role.color,
                border: `1px solid ${role.color}33`,
                fontSize: 11, fontWeight: 700, borderRadius: 20,
                padding: '3px 11px', letterSpacing: '0.04em',
              }}>{role.label}</span>
              {user?.company_name && (
                <span style={{ background: 'rgba(30,58,95,0.4)', color: '#8fa3bd', border: '1px solid rgba(30,58,95,0.55)', fontSize: 11, borderRadius: 20, padding: '3px 11px' }}>
                  {user.company_name}
                </span>
              )}
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)',
              borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 700,
              color: '#fca5a5', cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit',
              transition: 'all 0.15s', minHeight: 40,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.14)'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.08)'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.25)' }}
          >
            Sign Out
          </button>
        </div>

        {/* ── Account Information ── */}
        <Card title="Account Information" icon="👤">
          {saveMsg && <AlertBox type="success">{saveMsg}</AlertBox>}
          {saveErr && <AlertBox type="error">{saveErr}</AlertBox>}

          {!editing ? (
            <>
              <InfoRow label="Full Name"    value={user?.full_name}    />
              <InfoRow label="Email"        value={user?.email}        />
              <InfoRow label="Phone"        value={user?.phone || '—'} />
              <InfoRow label="Company"      value={user?.company_name} />
              <InfoRow label="Role"         value={role.label}         />
              <InfoRow
                label="Member since"
                value={user?.created_at ? new Date(user.created_at).toLocaleDateString('en-ZW', { year:'numeric', month:'long', day:'numeric' }) : '—'}
                last
              />
              <button
                onClick={() => setEditing(true)}
                style={{ ...secondaryBtn, marginTop: 16 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(30,58,95,0.9)'; e.currentTarget.style.color = '#eef2f7' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(30,58,95,0.55)'; e.currentTarget.style.color = '#8fa3bd' }}
              >Edit Profile</button>
            </>
          ) : (
            <form onSubmit={saveProfile}>
              <FormField label="Full Name">
                <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  required style={inp}
                  onFocus={e => e.target.style.borderColor = '#e9ba4c'}
                  onBlur={e  => e.target.style.borderColor = 'rgba(30,58,95,0.55)'}/>
              </FormField>
              <FormField label="Phone Number">
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  style={inp}
                  onFocus={e => e.target.style.borderColor = '#e9ba4c'}
                  onBlur={e  => e.target.style.borderColor = 'rgba(30,58,95,0.55)'}/>
              </FormField>
              <FormField label="Company Name">
                <input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                  style={inp}
                  onFocus={e => e.target.style.borderColor = '#e9ba4c'}
                  onBlur={e  => e.target.style.borderColor = 'rgba(30,58,95,0.55)'}/>
              </FormField>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ ...primaryBtn, flex: 1, opacity: saving ? 0.75 : 1 }}
                  onMouseEnter={e => !saving && (e.currentTarget.style.filter = 'brightness(1.1)')}
                  onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditing(false); setSaveErr('') }}
                  style={{ ...secondaryBtn, flex: 1 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(30,58,95,0.9)'; e.currentTarget.style.color = '#eef2f7' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(30,58,95,0.55)'; e.currentTarget.style.color = '#8fa3bd' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </Card>

        {/* ── Change Password ── */}
        <Card title="Change Password" icon="🔑">
          {cpMsg && <AlertBox type="success">{cpMsg}</AlertBox>}
          {cpErr && <AlertBox type="error">{cpErr}</AlertBox>}

          <form onSubmit={savePassword}>
            <FormField label="Current Password">
              <input type={showCp ? 'text' : 'password'} required
                value={cpForm.current_password}
                onChange={e => setCpForm(f => ({ ...f, current_password: e.target.value }))}
                style={inp}
                onFocus={e => e.target.style.borderColor = '#e9ba4c'}
                onBlur={e  => e.target.style.borderColor = 'rgba(30,58,95,0.55)'}/>
            </FormField>
            <FormField label="New Password">
              <input type={showCp ? 'text' : 'password'} required
                value={cpForm.new_password}
                onChange={e => setCpForm(f => ({ ...f, new_password: e.target.value }))}
                placeholder="Min. 8 characters" style={inp}
                onFocus={e => e.target.style.borderColor = '#e9ba4c'}
                onBlur={e  => e.target.style.borderColor = 'rgba(30,58,95,0.55)'}/>
            </FormField>
            <FormField label="Confirm New Password">
              <input type={showCp ? 'text' : 'password'} required
                value={cpForm.confirm_password}
                onChange={e => setCpForm(f => ({ ...f, confirm_password: e.target.value }))}
                style={inp}
                onFocus={e => e.target.style.borderColor = '#e9ba4c'}
                onBlur={e  => e.target.style.borderColor = 'rgba(30,58,95,0.55)'}/>
            </FormField>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer' }}>
              <input type="checkbox" checked={showCp} onChange={e => setShowCp(e.target.checked)}
                style={{ accentColor: '#e9ba4c', width: 15, height: 15 }}/>
              <span style={{ fontSize: 12, color: '#45607a' }}>Show passwords</span>
            </label>
            <button
              type="submit"
              disabled={cpLoading}
              style={{ ...primaryBtn, opacity: cpLoading ? 0.75 : 1 }}
              onMouseEnter={e => !cpLoading && (e.currentTarget.style.filter = 'brightness(1.1)')}
              onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
            >
              {cpLoading ? 'Updating…' : 'Change Password'}
            </button>
          </form>
        </Card>

        {/* ── BOE Platform ── */}
        <Card title="BOE Platform" icon="⚖">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigate('boe')}
              style={{ ...secondaryBtn, flex: '1 1 140px' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(233,186,76,0.3)'; e.currentTarget.style.color = '#e9ba4c' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(30,58,95,0.55)'; e.currentTarget.style.color = '#8fa3bd' }}
            >
              ⚡ BOE Generator
            </button>
            <button
              onClick={() => onNavigate('viewer')}
              style={{ ...secondaryBtn, flex: '1 1 140px' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(30,58,95,0.9)'; e.currentTarget.style.color = '#eef2f7' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(30,58,95,0.55)'; e.currentTarget.style.color = '#8fa3bd' }}
            >
              📋 SAD Viewer
            </button>
          </div>
        </Card>

      </div>
    </div>
  )
}

function Card({ title, icon, children }) {
  return (
    <div style={{
      background: 'rgba(10,18,32,0.85)',
      border: '1px solid rgba(30,58,95,0.55)',
      borderRadius: 16, overflow: 'hidden',
      marginBottom: 16,
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    }}>
      <div style={{
        background: 'rgba(6,9,15,0.45)',
        borderBottom: '1px solid rgba(30,58,95,0.55)',
        padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 9,
      }}>
        <span style={{ fontSize: 15 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#eef2f7' }}>{title}</span>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  )
}

function InfoRow({ label, value, last = false }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '11px 0',
      borderBottom: last ? 'none' : '1px solid rgba(30,58,95,0.3)',
      gap: 12, flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: 11, color: '#45607a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500, textAlign: 'right' }}>{value || '—'}</span>
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#45607a', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
      {children}
    </div>
  )
}

function AlertBox({ type, children }) {
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

const inp = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(6,9,15,0.6)', border: '1px solid rgba(30,58,95,0.55)',
  borderRadius: 10, padding: '11px 14px', fontSize: 14,
  color: '#eef2f7', outline: 'none', transition: 'border-color 0.15s',
  fontFamily: 'inherit', minHeight: 44,
}
const primaryBtn = {
  background: 'linear-gradient(135deg, #e9ba4c, #c8921a)',
  border: 'none', borderRadius: 10, padding: '11px 20px',
  fontSize: 13, fontWeight: 700, color: '#06090f', cursor: 'pointer',
  minHeight: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  transition: 'all 0.18s ease', fontFamily: 'inherit',
}
const secondaryBtn = {
  background: 'rgba(10,18,32,0.6)',
  border: '1px solid rgba(30,58,95,0.55)',
  borderRadius: 10, padding: '11px 20px',
  fontSize: 13, fontWeight: 600, color: '#8fa3bd', cursor: 'pointer',
  minHeight: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  transition: 'all 0.15s', fontFamily: 'inherit',
}
