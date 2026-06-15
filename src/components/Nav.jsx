import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

const BASE_LINKS = [
  { id: 'home',    label: 'Home' },
  { id: 'boe',     label: 'BOE Generator' },
  { id: 'viewer',  label: 'SAD Viewer' },
  { id: 'history', label: 'History' },
  { id: 'customs',    label: 'Customs Intel' },
  { id: 'simulator',  label: 'Cost Simulator' },
]

export default function Nav({ page, onNavigate }) {
  const { user, logout } = useAuth()

  const isOwner  = user?.role === 'company_owner' || user?.role === 'super_admin'
  const isAdmin  = user?.role === 'super_admin'
  const LINKS    = [
    ...BASE_LINKS,
    ...(isOwner ? [{ id: 'company', label: 'Company' }] : []),
    ...(isAdmin  ? [{ id: 'admin',   label: 'Admin' }]   : []),
  ]
  const [scrolled,  setScrolled]  = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  /* lock body scroll when menu open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const go = (id) => { onNavigate(id); setMenuOpen(false) }

  /* ── Styles ── */
  const navStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
    height: 64,
    background: scrolled
      ? 'rgba(3, 6, 14, 0.88)'
      : 'transparent',
    backdropFilter: scrolled ? 'blur(24px) saturate(1.8)' : 'none',
    WebkitBackdropFilter: scrolled ? 'blur(24px) saturate(1.8)' : 'none',
    borderBottom: scrolled
      ? '1px solid rgba(233, 186, 76, 0.08)'
      : '1px solid transparent',
    display: 'flex', alignItems: 'center',
    padding: '0 40px',
    transition: 'background 0.35s ease, backdrop-filter 0.35s ease, border-color 0.35s ease',
  }

  const logoMarkStyle = {
    width: 34, height: 34, borderRadius: 9,
    background: 'linear-gradient(135deg, #e9ba4c, #c8921a)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 17, fontWeight: 800, color: '#06090f',
    boxShadow: '0 0 20px rgba(233,186,76,0.22)',
    flexShrink: 0,
    userSelect: 'none',
  }

  const linkStyle = (id) => ({
    background: 'none', border: 'none', padding: '8px 15px',
    fontSize: 14, fontWeight: page === id ? 600 : 500,
    color: page === id ? '#e9ba4c' : '#8fa3bd',
    borderRadius: 8, cursor: 'pointer',
    transition: 'color 0.15s ease',
    letterSpacing: '0.01em',
  })

  const ctaStyle = {
    background: 'linear-gradient(135deg, #e9ba4c, #c8921a)',
    border: 'none', borderRadius: 9,
    padding: '9px 20px', fontSize: 13, fontWeight: 700,
    color: '#06090f', cursor: 'pointer',
    boxShadow: '0 2px 16px rgba(233,186,76,0.2)',
    transition: 'all 0.18s ease',
    letterSpacing: '-0.01em',
    flexShrink: 0,
  }

  return (
    <>
      {/* ── Desktop nav ── */}
      <nav className="nav-bar" style={navStyle}>
        {/* Logo */}
        <button
          onClick={() => go('home')}
          style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: 0 }}
        >
          <div style={logoMarkStyle}>L</div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e9ba4c', letterSpacing: '0.03em', lineHeight: 1.1 }}>
              Lunarae
            </div>
            <div style={{ fontSize: 9, color: '#45607a', letterSpacing: '0.14em', textTransform: 'uppercase', lineHeight: 1.2 }}>
              BOE Intelligence
            </div>
          </div>
        </button>

        {/* Centre links — desktop only */}
        <div className="nav-desktop" style={{ flex: 1, justifyContent: 'center', gap: 2 }}>
          {LINKS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => go(id)}
              style={linkStyle(id)}
              onMouseEnter={e => { if (page !== id) e.currentTarget.style.color = '#eef2f7' }}
              onMouseLeave={e => { if (page !== id) e.currentTarget.style.color = '#8fa3bd'  }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right — user pill / guest CTAs + hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {user ? (
            <>
              <button
                className="nav-desktop"
                onClick={() => go('profile')}
                style={{
                  background: 'rgba(233,186,76,0.07)', border: '1px solid rgba(233,186,76,0.15)',
                  borderRadius: 20, padding: '6px 14px',
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(233,186,76,0.35)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(233,186,76,0.15)'}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#1e3a5f,#0f2040)',
                  border: '1px solid rgba(233,186,76,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: '#e9ba4c',
                }}>
                  {(user.full_name || 'U')[0].toUpperCase()}
                </div>
                <span style={{ fontSize: 13, color: '#e9ba4c', fontWeight: 600 }}>
                  {user.full_name?.split(' ')[0]}
                </span>
              </button>
              <button
                className="nav-desktop"
                onClick={() => go('boe')}
                style={ctaStyle}
                onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)';   e.currentTarget.style.transform = 'translateY(0)' }}
              >
                Generate BOE
              </button>
            </>
          ) : (
            <>
              <button
                className="nav-desktop"
                onClick={() => go('login')}
                style={{
                  background: 'none', border: '1px solid rgba(233,186,76,0.25)',
                  borderRadius: 9, padding: '9px 18px', fontSize: 13, fontWeight: 600,
                  color: '#e9ba4c', cursor: 'pointer', transition: 'all 0.18s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(233,186,76,0.07)'; e.currentTarget.style.borderColor = 'rgba(233,186,76,0.45)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'rgba(233,186,76,0.25)' }}
              >
                Sign In
              </button>
              <button
                className="nav-desktop"
                onClick={() => go('register')}
                style={ctaStyle}
                onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)';   e.currentTarget.style.transform = 'translateY(0)' }}
              >
                Start Free Trial
              </button>
            </>
          )}

          {/* Hamburger */}
          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            style={{
              background: 'none', border: 'none',
              color: '#eef2f7', fontSize: 22, padding: '4px 6px',
              display: 'none',  /* overridden by media query in css */
            }}
          >
            ☰
          </button>
        </div>
      </nav>

      {/* ── Mobile full-screen menu ── */}
      {menuOpen && (
        <div className="mobile-menu" role="dialog" aria-modal="true">
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={logoMarkStyle}>L</div>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#e9ba4c' }}>Lunarae</span>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              style={{ background: 'none', border: 'none', color: '#8fa3bd', fontSize: 28, lineHeight: 1, padding: 4 }}
            >
              ✕
            </button>
          </div>

          {/* Nav links */}
          <div style={{ flex: 1 }}>
            {LINKS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => go(id)}
                style={{
                  display: 'block', width: '100%', background: 'none', border: 'none',
                  textAlign: 'left', padding: '22px 0',
                  fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em',
                  color: page === id ? '#e9ba4c' : '#eef2f7',
                  borderBottom: '1px solid rgba(22,40,64,0.6)',
                  cursor: 'pointer',
                  transition: 'color 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Mobile CTA */}
          {user ? (
            <>
              <button
                onClick={() => go('boe')}
                style={{
                  marginTop: 36, width: '100%',
                  background: 'linear-gradient(135deg, #e9ba4c, #c8921a)',
                  border: 'none', borderRadius: 12,
                  padding: '18px', fontSize: 17, fontWeight: 700,
                  color: '#06090f', cursor: 'pointer', letterSpacing: '-0.01em',
                }}
              >
                Generate BOE →
              </button>
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button onClick={() => go('profile')}
                  style={{ flex: 1, background: 'rgba(233,186,76,0.08)', border: '1px solid rgba(233,186,76,0.15)', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 600, color: '#e9ba4c', cursor: 'pointer' }}>
                  👤 {user.full_name?.split(' ')[0]}
                </button>
                <button onClick={() => { logout(); setMenuOpen(false) }}
                  style={{ flex: 1, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 600, color: '#fca5a5', cursor: 'pointer' }}>
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 36 }}>
              <button onClick={() => go('register')}
                style={{ width: '100%', background: 'linear-gradient(135deg, #e9ba4c, #c8921a)', border: 'none', borderRadius: 12, padding: '18px', fontSize: 17, fontWeight: 700, color: '#06090f', cursor: 'pointer' }}>
                Start Free Trial →
              </button>
              <button onClick={() => go('login')}
                style={{ width: '100%', background: 'none', border: '1px solid rgba(233,186,76,0.3)', borderRadius: 12, padding: '16px', fontSize: 16, fontWeight: 600, color: '#e9ba4c', cursor: 'pointer' }}>
                Sign In
              </button>
            </div>
          )}

          {/* Disclaimer */}
          <div style={{ marginTop: 20, fontSize: 11, color: '#2a3d52', textAlign: 'center', lineHeight: 1.6 }}>
            Zimbabwe Customs Intelligence Platform<br />
            SI 35/2024 · SI 122/2017 · ASYCUDA World
          </div>
        </div>
      )}
    </>
  )
}
