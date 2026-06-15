import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function Register({ onNavigate }) {
  const { register } = useAuth()
  const [form, setForm] = useState({
    full_name: '', email: '', company_name: '',
    phone: '', password: '', confirm_password: '',
  })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await register(form)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { key: 'full_name',    label: 'Full Name',                  type: 'text',     placeholder: 'John Doe',            half: false },
    { key: 'email',        label: 'Email Address',              type: 'email',    placeholder: 'you@company.com',     half: false },
    { key: 'company_name', label: 'Company / Firm Name',        type: 'text',     placeholder: 'Acme Clearing Agents', half: false },
    { key: 'phone',        label: 'Phone Number (optional)',     type: 'tel',      placeholder: '+263 77 xxx xxxx',    half: false },
    { key: 'password',     label: 'Password',                   type: showPass ? 'text' : 'password', placeholder: 'Min. 8 characters', half: true },
    { key: 'confirm_password', label: 'Confirm Password',       type: showPass ? 'text' : 'password', placeholder: 'Repeat password',   half: true },
  ]

  return (
    <div style={{
      minHeight: '100vh', background: '#06090f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      padding: '24px 16px',
    }}>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 20%, rgba(233,186,76,0.04) 0%, transparent 65%)',
      }}/>

      <div style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg, #e9ba4c, #c8921a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 800, color: '#06090f',
            margin: '0 auto 12px', boxShadow: '0 0 28px rgba(233,186,76,0.2)',
          }}>L</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#e9ba4c' }}>Create your account</div>
          <div style={{ fontSize: 12, color: '#45607a', marginTop: 2 }}>Lunarae BOE Intelligence</div>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(10,21,37,0.7)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(233,186,76,0.1)',
          borderRadius: 20, padding: '32px 28px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}>

          {error && (
            <div style={{
              background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)',
              borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#fca5a5',
            }}>{error}</div>
          )}

          <form onSubmit={submit}>
            {/* Full-width fields */}
            {fields.filter(f => !f.half).map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={lbl}>{f.label}</label>
                <input
                  type={f.type} value={form[f.key]} onChange={set(f.key)}
                  placeholder={f.placeholder}
                  required={f.key !== 'phone'}
                  autoComplete={f.key === 'email' ? 'email' : f.key === 'full_name' ? 'name' : 'off'}
                  style={inp}
                  onFocus={e => e.target.style.borderColor = '#e9ba4c'}
                  onBlur={e  => e.target.style.borderColor = 'rgba(30,45,71,0.8)'}
                />
              </div>
            ))}

            {/* Half-width password fields */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              {fields.filter(f => f.half).map(f => (
                <div key={f.key} style={{ flex: '1 1 180px', minWidth: 0 }}>
                  <label style={lbl}>{f.label}</label>
                  <input
                    type={f.type} value={form[f.key]} onChange={set(f.key)}
                    placeholder={f.placeholder} required
                    autoComplete="new-password"
                    style={inp}
                    onFocus={e => e.target.style.borderColor = '#e9ba4c'}
                    onBlur={e  => e.target.style.borderColor = 'rgba(30,45,71,0.8)'}
                  />
                </div>
              ))}
            </div>

            {/* Show password toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, cursor: 'pointer' }}>
              <input type="checkbox" checked={showPass} onChange={e => setShowPass(e.target.checked)}
                style={{ accentColor: '#e9ba4c', width: 15, height: 15 }}/>
              <span style={{ fontSize: 12, color: '#45607a' }}>Show passwords</span>
            </label>

            <button type="submit" disabled={loading} style={primaryBtn}>
              {loading ? <><span style={spinner}/> Creating account…</> : 'Create Account →'}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#45607a' }}>
            Already have an account?{' '}
            <button onClick={() => onNavigate('login')}
              style={{ background: 'none', border: 'none', color: '#e9ba4c', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
              Sign in
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#2a3d52' }}>
          By registering you agree to our Terms of Service.
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
  borderRadius: 10, padding: '11px 14px', fontSize: 14,
  color: '#eef2f7', outline: 'none', transition: 'border-color 0.15s',
  fontFamily: 'inherit', minHeight: 44,
}
const primaryBtn = {
  width: '100%', minHeight: 48,
  background: 'linear-gradient(135deg, #e9ba4c, #c8921a)',
  border: 'none', borderRadius: 12, padding: '12px',
  fontSize: 15, fontWeight: 700, color: '#06090f',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  boxShadow: '0 4px 20px rgba(233,186,76,0.25)', transition: 'opacity 0.15s',
}
const spinner = {
  display: 'inline-block', width: 16, height: 16,
  border: '2px solid rgba(6,9,15,0.3)', borderTopColor: '#06090f',
  borderRadius: '50%', animation: 'spin 0.7s linear infinite',
}
