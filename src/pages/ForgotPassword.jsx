import { useState } from 'react'
import { API } from '../config/api.js'

export default function ForgotPassword({ onNavigate }) {
  const [step,    setStep]    = useState('request') // 'request' | 'reset' | 'done'
  const [email,   setEmail]   = useState('')
  const [code,    setCode]    = useState('')
  const [newPass, setNewPass] = useState('')
  const [confPass, setConfPass] = useState('')
  const [devCode, setDevCode] = useState('')   // shown in dev mode
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const requestReset = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res  = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.dev_code) setDevCode(data.dev_code)
      setStep('reset')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const doReset = async (e) => {
    e.preventDefault()
    setError('')
    if (newPass !== confPass) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      const res  = await fetch(`${API}/api/auth/reset-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim(), password: newPass, confirm_password: confPass }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStep('done')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#06090f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', -apple-system, sans-serif", padding: '24px 16px',
    }}>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 25%, rgba(233,186,76,0.04) 0%, transparent 65%)',
      }}/>

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg, #e9ba4c, #c8921a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 800, color: '#06090f',
            margin: '0 auto 12px', boxShadow: '0 0 28px rgba(233,186,76,0.2)',
          }}>L</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#e9ba4c' }}>Reset password</div>
        </div>

        <div style={{
          background: 'rgba(10,21,37,0.7)', backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(233,186,76,0.1)',
          borderRadius: 20, padding: '32px 28px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}>

          {step === 'done' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#eef2f7', marginBottom: 8 }}>Password reset!</div>
              <div style={{ fontSize: 13, color: '#45607a', marginBottom: 24 }}>You can now sign in with your new password.</div>
              <button onClick={() => onNavigate('login')} style={primaryBtn}>Back to Sign In</button>
            </div>
          )}

          {step === 'request' && (
            <>
              <p style={{ fontSize: 13, color: '#8fa3bd', marginBottom: 24 }}>
                Enter your email address and we'll send you a reset code.
              </p>
              {error && <ErrBox>{error}</ErrBox>}
              <form onSubmit={requestReset}>
                <div style={{ marginBottom: 20 }}>
                  <label style={lbl}>Email Address</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com" style={inp}
                    onFocus={e => e.target.style.borderColor = '#e9ba4c'}
                    onBlur={e  => e.target.style.borderColor = 'rgba(30,45,71,0.8)'}/>
                </div>
                <button type="submit" disabled={loading} style={primaryBtn}>
                  {loading ? <><span style={spinner}/> Sending…</> : 'Send reset code →'}
                </button>
              </form>
            </>
          )}

          {step === 'reset' && (
            <>
              <p style={{ fontSize: 13, color: '#8fa3bd', marginBottom: 16 }}>
                Enter the 6-character code sent to <strong style={{ color: '#e9ba4c' }}>{email}</strong> and your new password.
              </p>
              {devCode && (
                <div style={{
                  background: 'rgba(233,186,76,0.08)', border: '1px solid rgba(233,186,76,0.2)',
                  borderRadius: 10, padding: '10px 14px', marginBottom: 16, textAlign: 'center',
                }}>
                  <div style={{ fontSize: 11, color: '#8fa3bd', marginBottom: 4 }}>DEV — Reset Code (check server console)</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#e9ba4c', letterSpacing: '0.2em', fontFamily: 'JetBrains Mono, monospace' }}>{devCode}</div>
                </div>
              )}
              {error && <ErrBox>{error}</ErrBox>}
              <form onSubmit={doReset}>
                <div style={{ marginBottom: 16 }}>
                  <label style={lbl}>Reset Code</label>
                  <input type="text" required value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="ABC123" maxLength={6}
                    style={{ ...inp, letterSpacing: '0.15em', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace' }}
                    onFocus={e => e.target.style.borderColor = '#e9ba4c'}
                    onBlur={e  => e.target.style.borderColor = 'rgba(30,45,71,0.8)'}/>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={lbl}>New Password</label>
                  <input type={showPass ? 'text' : 'password'} required value={newPass} onChange={e => setNewPass(e.target.value)}
                    placeholder="Min. 8 characters" style={inp}
                    onFocus={e => e.target.style.borderColor = '#e9ba4c'}
                    onBlur={e  => e.target.style.borderColor = 'rgba(30,45,71,0.8)'}/>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={lbl}>Confirm New Password</label>
                  <input type={showPass ? 'text' : 'password'} required value={confPass} onChange={e => setConfPass(e.target.value)}
                    placeholder="Repeat password" style={inp}
                    onFocus={e => e.target.style.borderColor = '#e9ba4c'}
                    onBlur={e  => e.target.style.borderColor = 'rgba(30,45,71,0.8)'}/>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer' }}>
                  <input type="checkbox" checked={showPass} onChange={e => setShowPass(e.target.checked)}
                    style={{ accentColor: '#e9ba4c' }}/>
                  <span style={{ fontSize: 12, color: '#45607a' }}>Show passwords</span>
                </label>
                <button type="submit" disabled={loading} style={primaryBtn}>
                  {loading ? <><span style={spinner}/> Resetting…</> : 'Reset Password →'}
                </button>
              </form>
            </>
          )}

          {step !== 'done' && (
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <button onClick={() => onNavigate('login')}
                style={{ background: 'none', border: 'none', color: '#45607a', fontSize: 13, cursor: 'pointer' }}>
                ← Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ErrBox({ children }) {
  return (
    <div style={{
      background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)',
      borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#fca5a5',
    }}>{children}</div>
  )
}

const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#8fa3bd', marginBottom: 6 }
const inp = {
  width: '100%', boxSizing: 'border-box',
  background: '#0a1220', border: '1px solid rgba(30,45,71,0.8)',
  borderRadius: 10, padding: '11px 14px', fontSize: 14,
  color: '#eef2f7', outline: 'none', transition: 'border-color 0.15s',
  fontFamily: 'inherit', minHeight: 44,
}
const primaryBtn = {
  width: '100%', minHeight: 48,
  background: 'linear-gradient(135deg, #e9ba4c, #c8921a)',
  border: 'none', borderRadius: 12, padding: '12px',
  fontSize: 15, fontWeight: 700, color: '#06090f', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  boxShadow: '0 4px 20px rgba(233,186,76,0.25)',
}
const spinner = {
  display: 'inline-block', width: 16, height: 16,
  border: '2px solid rgba(6,9,15,0.3)', borderTopColor: '#06090f',
  borderRadius: '50%', animation: 'spin 0.7s linear infinite',
}
