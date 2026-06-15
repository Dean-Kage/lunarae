import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login({ onNavigate }) {
  const { login } = useAuth()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPass, setShowPass] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email.trim(), password)
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
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      padding: '24px 16px',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 30%, rgba(233,186,76,0.04) 0%, transparent 65%)',
      }}/>

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #e9ba4c, #c8921a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 800, color: '#06090f',
            margin: '0 auto 14px', boxShadow: '0 0 32px rgba(233,186,76,0.2)',
          }}>L</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#e9ba4c', letterSpacing: '-0.01em' }}>Lunarae</div>
          <div style={{ fontSize: 12, color: '#45607a', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>BOE Intelligence</div>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(10,21,37,0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(233,186,76,0.1)',
          borderRadius: 20,
          padding: '36px 32px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#eef2f7', marginBottom: 6 }}>Sign in to your account</h1>
          <p style={{ fontSize: 13, color: '#45607a', marginBottom: 28 }}>
            Zimbabwe Customs Intelligence Platform
          </p>

          {error && (
            <div style={{
              background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)',
              borderRadius: 10, padding: '10px 14px', marginBottom: 20,
              fontSize: 13, color: '#fca5a5',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={submit}>
            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Email address</label>
              <input
                type="email" required autoComplete="email" autoFocus
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                style={inp}
                onFocus={e => e.target.style.borderColor = '#e9ba4c'}
                onBlur={e  => e.target.style.borderColor = 'rgba(30,45,71,0.8)'}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={lbl}>Password</label>
                <button type="button" onClick={() => onNavigate('forgot')}
                  style={{ background: 'none', border: 'none', fontSize: 12, color: '#e9ba4c', cursor: 'pointer', padding: 0 }}>
                  Forgot password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} required autoComplete="current-password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ ...inp, paddingRight: 44 }}
                  onFocus={e => e.target.style.borderColor = '#e9ba4c'}
                  onBlur={e  => e.target.style.borderColor = 'rgba(30,45,71,0.8)'}
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#45607a', cursor: 'pointer', fontSize: 13, padding: '4px' }}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={primaryBtn}>
              {loading ? <><span style={spinner}/> Signing in…</> : 'Sign in →'}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#45607a' }}>
            Don't have an account?{' '}
            <button onClick={() => onNavigate('register')}
              style={{ background: 'none', border: 'none', color: '#e9ba4c', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
              Register
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: '#2a3d52' }}>
          For use by licensed Zimbabwe customs clearing agents only
        </div>
      </div>
    </div>
  )
}

const lbl = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#8fa3bd',
  marginBottom: 6, letterSpacing: '0.02em',
}
const inp = {
  width: '100%', boxSizing: 'border-box',
  background: '#0a1220', border: '1px solid rgba(30,45,71,0.8)',
  borderRadius: 10, padding: '12px 14px', fontSize: 14,
  color: '#eef2f7', outline: 'none', transition: 'border-color 0.15s',
  fontFamily: 'inherit', minHeight: 44,
}
const primaryBtn = {
  width: '100%', minHeight: 48,
  background: 'linear-gradient(135deg, #e9ba4c, #c8921a)',
  border: 'none', borderRadius: 12, padding: '13px',
  fontSize: 15, fontWeight: 700, color: '#06090f',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  boxShadow: '0 4px 20px rgba(233,186,76,0.25)',
  transition: 'opacity 0.15s', opacity: 1,
}
const spinner = {
  display: 'inline-block', width: 16, height: 16,
  border: '2px solid rgba(6,9,15,0.3)', borderTopColor: '#06090f',
  borderRadius: '50%', animation: 'spin 0.7s linear infinite',
}
