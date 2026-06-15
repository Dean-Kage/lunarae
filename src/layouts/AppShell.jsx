import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import OnboardingWizard from '../components/OnboardingWizard.jsx'
import {
  LayoutDashboard, FilePlus, FileSearch, Clock, BookOpen,
  Calculator, Building2, CreditCard, ShieldCheck, Users,
  LogOut, Plus, Bell, Menu, X, ChevronLeft, ChevronRight, Activity,
} from 'lucide-react'

const ROLE_LABELS = {
  super_admin:    'Super Admin',
  company_owner:  'Company Owner',
  clearing_agent: 'Clearing Agent',
  clerk:          'Clerk',
}

const PAGE_TITLES = {
  boe:       'BOE Generator',
  viewer:    'SAD Viewer',
  profile:   'My Profile',
  company:   'Company Dashboard',
  users:     'Team Management',
  history:   'BOE History',
  checkout:  'Upgrade Plan',
  payments:  'Payment History',
  customs:   'Customs Intelligence',
  simulator: 'Cost Simulator',
  home:      'Home',
  activity:  'Activity Center',
}

const C = {
  bg:      '#06090f',
  sidebar: '#080e1a',
  border:  '#1e3a5f',
  gold:    '#e9ba4c',
  muted:   '#45607a',
  text:    '#eef2f7',
  sub:     '#8fa3bd',
  hover:   'rgba(30,58,95,0.4)',
  active:  'rgba(233,186,76,0.08)',
}

const BASE_LINKS = [
  { id: 'home',      label: 'Home',          Icon: LayoutDashboard },
  { id: 'boe',       label: 'BOE Generator', Icon: FilePlus        },
  { id: 'viewer',    label: 'SAD Viewer',     Icon: FileSearch      },
  { id: 'history',   label: 'History',        Icon: Clock           },
  { id: 'customs',   label: 'Customs Intel',  Icon: BookOpen        },
  { id: 'simulator', label: 'Cost Simulator', Icon: Calculator      },
]

const W_EXP  = 260
const W_COL  = 80

export default function AppShell({ children, onNavigate, page }) {
  const { user, logout } = useAuth()

  const [isMobile,   setIsMobile]   = useState(() => window.innerWidth < 1024)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [expanded,   setExpanded]   = useState(() => {
    const s = localStorage.getItem('lunarae_sidebar')
    return s ? s === 'expanded' : window.innerWidth >= 1280
  })

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (!mobile && mobileOpen) setMobileOpen(false)
    }
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [mobileOpen])

  useEffect(() => {
    if (isMobile) setMobileOpen(false)
  }, [page, isMobile])

  useEffect(() => {
    document.body.style.overflow = (isMobile && mobileOpen) ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isMobile, mobileOpen])

  const toggleExpanded = () => {
    const next = !expanded
    setExpanded(next)
    localStorage.setItem('lunarae_sidebar', next ? 'expanded' : 'collapsed')
  }

  const isOwner = user?.role === 'company_owner' || user?.role === 'super_admin'
  const isAdmin = user?.role === 'super_admin'

  const links = [
    ...BASE_LINKS,
    ...(isOwner ? [
      { id: 'company',  label: 'Company',  Icon: Building2  },
      { id: 'users',    label: 'Team',     Icon: Users      },
      { id: 'payments', label: 'Billing',  Icon: CreditCard },
      { id: 'activity', label: 'Activity', Icon: Activity   },
    ] : []),
    ...(isAdmin ? [
      { id: 'admin', label: 'Admin Center', Icon: ShieldCheck },
    ] : []),
  ]

  const go = useCallback((id) => {
    onNavigate(id)
    if (isMobile) setMobileOpen(false)
  }, [onNavigate, isMobile])

  const handleLogout = () => {
    logout()
    setMobileOpen(false)
  }

  const initials  = (user?.full_name || 'U')[0].toUpperCase()
  const firstName = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'
  const sidebarW  = expanded ? W_EXP : W_COL
  const showLabel = expanded || isMobile

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: C.bg,
      fontFamily: "'DM Sans', -apple-system, sans-serif",
    }}>

      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
            zIndex: 40,
          }}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside style={{
        position: isMobile ? 'fixed' : 'sticky',
        top: 0, left: 0,
        width: isMobile ? W_EXP : sidebarW,
        height: '100vh',
        background: C.sidebar,
        borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1), transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        transform: isMobile
          ? (mobileOpen ? 'translateX(0)' : `translateX(-${W_EXP}px)`)
          : 'translateX(0)',
        zIndex: 50, flexShrink: 0, overflow: 'hidden',
        boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
      }}>

        {/* Logo */}
        <div
          onClick={() => go('home')}
          style={{
            height: 56, padding: '0 16px',
            display: 'flex', alignItems: 'center', gap: 12,
            borderBottom: `1px solid ${C.border}`,
            cursor: 'pointer', flexShrink: 0,
            userSelect: 'none',
          }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            background: 'linear-gradient(135deg,#e9ba4c,#c8921a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 900, color: '#06090f', letterSpacing: '-0.02em',
          }}>L</div>
          {showLabel && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.text, whiteSpace: 'nowrap' }}>Lunarae</div>
              <div style={{ fontSize: 10, color: C.muted, whiteSpace: 'nowrap', marginTop: 1 }}>BOE Intelligence</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{
          flex: 1, padding: '10px 8px',
          display: 'flex', flexDirection: 'column', gap: 2,
          overflowY: 'auto', overflowX: 'hidden',
        }}>
          {links.map(({ id, label, Icon }) => {
            const isActive = page === id
            return (
              <button
                key={id}
                onClick={() => go(id)}
                title={!showLabel ? label : undefined}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: showLabel ? '10px 12px' : '10px 0',
                  justifyContent: showLabel ? 'flex-start' : 'center',
                  borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: isActive ? C.active : 'transparent',
                  color: isActive ? C.gold : C.sub,
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? `inset 3px 0 0 ${C.gold}` : 'inset 3px 0 0 transparent',
                  minHeight: 44, fontFamily: 'inherit',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = C.hover
                    e.currentTarget.style.color = C.text
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = C.sub
                  }
                }}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                {showLabel && (
                  <span style={{
                    fontSize: 13, fontWeight: isActive ? 700 : 500,
                    whiteSpace: 'nowrap', overflow: 'hidden',
                  }}>{label}</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Collapse toggle — desktop only */}
        {!isMobile && (
          <button
            onClick={toggleExpanded}
            title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
            style={{
              margin: '0 8px 8px',
              padding: showLabel ? '8px 12px' : '8px 0',
              justifyContent: showLabel ? 'flex-start' : 'center',
              borderRadius: 8, border: `1px solid ${C.border}`,
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              color: C.muted, fontSize: 12, fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = C.gold
              e.currentTarget.style.color = C.gold
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = C.border
              e.currentTarget.style.color = C.muted
            }}
          >
            {expanded ? <><ChevronLeft size={15} /><span>Collapse</span></> : <ChevronRight size={15} />}
          </button>
        )}

        {/* User card */}
        <div style={{
          padding: '10px 8px', borderTop: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
        }}>
          <button
            onClick={() => go('profile')}
            title="My Profile"
            style={{
              flex: 1, display: 'flex', alignItems: 'center',
              gap: showLabel ? 10 : 0,
              justifyContent: showLabel ? 'flex-start' : 'center',
              padding: '8px 10px',
              borderRadius: 10, border: 'none',
              background: 'rgba(30,58,95,0.2)',
              cursor: 'pointer', overflow: 'hidden',
              minWidth: 0, fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = C.hover}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(30,58,95,0.2)'}
          >
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: 'linear-gradient(135deg,#e9ba4c,#c8921a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: '#06090f',
            }}>{initials}</div>
            {showLabel && (
              <div style={{ minWidth: 0, textAlign: 'left' }}>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: C.text,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{firstName}</div>
                <div style={{ fontSize: 10, color: C.muted, whiteSpace: 'nowrap' }}>
                  {ROLE_LABELS[user?.role] || user?.role}
                </div>
              </div>
            )}
          </button>

          {showLabel && (
            <button
              onClick={handleLogout}
              title="Sign Out"
              style={{
                width: 34, height: 34, borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: 'transparent', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, color: C.muted, transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#f87171'
                e.currentTarget.style.color = '#f87171'
                e.currentTarget.style.background = 'rgba(248,113,113,0.08)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = C.border
                e.currentTarget.style.color = C.muted
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </aside>

      {/* ── Main column ───────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Global Header */}
        <header style={{
          height: 56, flexShrink: 0,
          background: 'rgba(8,14,26,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '0 20px',
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          {/* Mobile hamburger */}
          {isMobile && (
            <button
              onClick={() => setMobileOpen(s => !s)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: C.sub, padding: 6, borderRadius: 8,
                display: 'flex', alignItems: 'center', flexShrink: 0,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = C.text}
              onMouseLeave={e => e.currentTarget.style.color = C.sub}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}

          {/* Page title */}
          <span style={{ fontSize: 14, fontWeight: 700, color: C.text, flexShrink: 0 }}>
            {PAGE_TITLES[page] || 'Lunarae'}
          </span>

          <div style={{ flex: 1 }} />

          {/* Quick Create */}
          <button
            onClick={() => go('boe')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(135deg,#e9ba4c,#c8921a)',
              border: 'none', borderRadius: 8, padding: '7px 14px',
              fontSize: 12, fontWeight: 700, color: '#06090f',
              cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Plus size={13} />
            <span>New BOE</span>
          </button>

          {/* Notifications */}
          <button
            title="Notifications"
            style={{
              background: 'none', border: `1px solid ${C.border}`,
              borderRadius: 8, width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: C.muted, flexShrink: 0,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = C.gold
              e.currentTarget.style.color = C.gold
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = C.border
              e.currentTarget.style.color = C.muted
            }}
          >
            <Bell size={15} />
          </button>

          {/* Avatar */}
          <button
            onClick={() => go('profile')}
            title="My Profile"
            style={{
              width: 34, height: 34, borderRadius: 8, flexShrink: 0,
              background: 'linear-gradient(135deg,#e9ba4c,#c8921a)',
              border: '2px solid transparent',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: '#06090f',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(233,186,76,0.5)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
          >{initials}</button>
        </header>

        {/* Page content */}
        <main style={{ flex: 1 }}>
          {children}
        </main>
      </div>

      {/* Onboarding wizard — fixed overlay, auto-hides when complete */}
      <OnboardingWizard onNavigate={onNavigate} />
    </div>
  )
}
