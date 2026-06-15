import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { API } from '../config/api.js'

const ROLE_LABELS = {
  clearing_agent: 'Clearing Agent',
  clerk:          'Clerk',
}

export default function AcceptInvite({ inviteCode }) {
  const { login } = useAuth()

  const [invite,   setInvite]   = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [done,     setDone]     = useState(false)

  const [form,     setForm]     = useState({ full_name: '', phone: '', password: '', confirm_password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    async function fetchInvite() {
      try {
        const res  = await fetch(`${API}/api/invite/${inviteCode}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setInvite(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchInvite()
  }, [inviteCode])

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match')
      return
    }
    setSubmitting(true); setError('')
    try {
      const res  = await fetch(`${API}/api/invite/${inviteCode}/accept`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Auto-login: store token and hydrate auth context
      localStorage.setItem('lunarae_auth_token', data.token)
      // Trigger re-render via auth state — reload to re-hydrate AuthProvider
      setDone(true)
      setTimeout(() => {
        window.location.href = window.location.origin
      }, 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div style={wrap}>
      <div style={glow}/>

      <div style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={logoMark}>L</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#e9ba4c', marginTop: 10 }}>Lunarae</div>
          <div style={{ fontSize: 12, color: '#45607a', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>
            BOE Intelligence
          </div>
        </div>

        <div style={card}>

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#45607a' }}>
              Validating invitation…
            </div>
          )}

          {!loading && error && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#fca5a5', marginBottom: 8 }}>Invitation Invalid</div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{error}</div>
            </div>
          )}

          {!loading && done && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#34d399', marginBottom: 8 }}>Account created!</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Signing you in…</div>
            </div>
          )}

          {!loading && invite && !done && (
            <>
              {/* Invite banner */}
              <div style={inviteBanner}>
                <div style={{ fontSize: 12, color: '#8fa3bd', marginBottom: 4 }}>You're invited to join</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#eef2f7', marginBottom: 4 }}>{invite.company_name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{invite.email}</span>
                  <span style={{
                    background: 'rgba(96,165,250,0.12)', color: '#60a5fa',
                    fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '2px 8px',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    {ROLE_LABELS[invite.role] || invite.role}
                  </span>
                </div>
              </div>

              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
                Complete your profile to accept the invitation.
              </div>

              {error && <ErrBox>{error}</ErrBox>}

              <form onSubmit={handleSubmit}>
                <Field label="Full Name">
                  <input type="text" required value={form.full_name} onChange={set('full_name')}
                    placeholder="Your full name" style={inp}
                    onFocus={e => e.target.style.borderColor = '#e9ba4c'}
                    onBlur={e  => e.target.style.borderColor = 'rgba(30,45,71,0.8)'}/>
                </Field>

                <Field label="Phone Number (optional)">
                  <input type="tel" value={form.phone} onChange={set('phone')}
                    placeholder="+263 7X XXX XXXX" style={inp}
                    onFocus={e => e.target.style.borderColor = '#e9ba4c'}
                    onBlur={e  => e.target.style.borderColor = 'rgba(30,45,71,0.8)'}/>
                </Field>

                <Field label="Password">
                  <input type={showPass ? 'text' : 'password'} required value={form.password} onChange={set('password')}
                    placeholder="Min. 8 characters" style={inp}
                    onFocus={e => e.target.style.borderColor = '#e9ba4c'}
                    onBlur={e  => e.target.style.borderColor = 'rgba(30,45,71,0.8)'}/>
                </Field>

                <Field label="Confirm Password">
                  <input type={showPass ? 'text' : 'password'} required value={form.confirm_password} onChange={set('confirm_password')}
                    placeholder="Repeat password" style={inp}
                    onFocus={e => e.target.style.borderColor = '#e9ba4c'}
                    onBlur={e  => e.target.style.borderColor = 'rgba(30,45,71,0.8)'}/>
                </Field>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer' }}>
                  <input type="checkbox" checked={showPass} onChange={e => setShowPass(e.target.checked)}
                    style={{ accentColor: '#e9ba4c' }}/>
                  <span style={{ fontSize: 12, color: '#45607a' }}>Show passwords</span>
                </label>

                <button type="submit" disabled={submitting} style={submitBtn}>
                  {submitting ? 'Creating account…' : 'Accept & Join Team →'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8fa3bd', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

function ErrBox({ children }) {
  return (
    <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#fca5a5' }}>
      {children}
    </div>
  )
}

const wrap = {
  minHeight: '100vh', background: '#06090f',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: "'DM Sans', -apple-system, sans-serif", padding: '24px 16px',
}
const glow = {
  position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
  background: 'radial-gradient(ellipse at 50% 25%, rgba(233,186,76,0.05) 0%, transparent 65%)',
}
const logoMark = {
  width: 52, height: 52, borderRadius: 14,
  background: 'linear-gradient(135deg, #e9ba4c, #c8921a)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 24, fontWeight: 800, color: '#06090f',
  margin: '0 auto', boxShadow: '0 0 32px rgba(233,186,76,0.2)',
}
const card = {
  background: 'rgba(10,21,37,0.7)', backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(233,186,76,0.1)',
  borderRadius: 20, padding: '32px 28px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
}
const inviteBanner = {
  background: 'rgba(233,186,76,0.06)', border: '1px solid rgba(233,186,76,0.15)',
  borderRadius: 12, padding: '14px 16px', marginBottom: 20,
}
const inp = {
  width: '100%', boxSizing: 'border-box',
  background: '#0a1220', border: '1px solid rgba(30,45,71,0.8)',
  borderRadius: 10, padding: '11px 14px', fontSize: 14,
  color: '#eef2f7', outline: 'none', transition: 'border-color 0.15s',
  fontFamily: 'inherit', minHeight: 44,
}
const submitBtn = {
  width: '100%', minHeight: 48,
  background: 'linear-gradient(135deg, #e9ba4c, #c8921a)',
  border: 'none', borderRadius: 12, padding: '12px',
  fontSize: 15, fontWeight: 700, color: '#06090f', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  boxShadow: '0 4px 20px rgba(233,186,76,0.25)',
}
