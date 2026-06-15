import { useState, lazy, Suspense } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Landing          from './pages/Landing.jsx'
import ZimraBOEViewer   from './pages/ZimraBOEViewer.jsx'
const LunaraeBOE = lazy(() => import('./pages/LunaraeBOE.jsx'))
const SuperAdmin  = lazy(() => import('./pages/SuperAdmin.jsx'))
import Profile          from './pages/Profile.jsx'
import CompanyDashboard from './pages/CompanyDashboard.jsx'
import UserManagement   from './pages/UserManagement.jsx'
import BoeHistory         from './pages/BoeHistory.jsx'
import CustomsIntelligence  from './pages/CustomsIntelligence.jsx'
import ImportCostSimulator  from './pages/ImportCostSimulator.jsx'
import Checkout           from './pages/Checkout.jsx'
import PaymentHistory     from './pages/PaymentHistory.jsx'
import ActivityCenter    from './pages/ActivityCenter.jsx'
import SubscriptionGate    from './components/SubscriptionGate.jsx'
import OnboardingWizard   from './components/OnboardingWizard.jsx'
import Login            from './pages/Login.jsx'
import Register         from './pages/Register.jsx'
import ForgotPassword   from './pages/ForgotPassword.jsx'
import AcceptInvite     from './pages/AcceptInvite.jsx'
import AppShell         from './layouts/AppShell.jsx'
import './design/animations.css'

function LazySpinner() {
  return (
    <div style={{ minHeight: '100vh', background: '#06090f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,#e9ba4c,#c8921a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#06090f', margin: '0 auto 16px', animation: 'pulse 1.4s ease-in-out infinite' }}>L</div>
        <div style={{ fontSize: 13, color: '#45607a' }}>Loading…</div>
      </div>
    </div>
  )
}

/* ── Check URL for invite code on load ──────────────────── */
function getInviteCode() {
  const params = new URLSearchParams(window.location.search)
  return params.get('invite') || null
}

/* ── Inner app — rendered inside AuthProvider ───────────── */
function AppInner() {
  const { user, loading } = useAuth()
  const [page,         setPage]         = useState('home')
  const [checkoutPlan, setCheckoutPlan] = useState(null)
  const [authPage,     setAuthPage]     = useState(null) // null = show landing, 'login'|'register'|'forgot'

  const inviteCode = getInviteCode()

  const navigate = (dest, param = null) => {
    const resolved = dest === 'zimra' ? 'viewer' : dest
    if (resolved === 'checkout') setCheckoutPlan(param)
    setPage(resolved)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  /* ── Initial token verification ── */
  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#06090f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'linear-gradient(135deg,#e9ba4c,#c8921a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 800, color: '#06090f',
          margin: '0 auto 16px',
          animation: 'pulse 1.4s ease-in-out infinite',
        }}>L</div>
        <div style={{ fontSize: 13, color: '#45607a' }}>Verifying session…</div>
      </div>
    </div>
  )

  /* ── Invite link — always shown, even when logged out ── */
  if (inviteCode && !user) {
    return <AcceptInvite inviteCode={inviteCode} />
  }

  /* ── Guest: marketing landing → login / register ── */
  if (!user) {
    if (authPage === 'register') return <Register onNavigate={setAuthPage} />
    if (authPage === 'forgot')   return <ForgotPassword onNavigate={setAuthPage} />
    if (authPage === 'login')    return <Login onNavigate={setAuthPage} />
    // Default: show marketing landing page with guest CTAs
    const guestNavigate = (dest) => {
      if (dest === 'register') setAuthPage('register')
      else setAuthPage('login')
    }
    return <Landing page="home" onNavigate={guestNavigate} isGuest />
  }

  /* ── Authenticated: show app ── */
  /* BOE and Viewer have their own full-screen nav shells — no AppShell wrapper */
  if (page === 'boe') return (
    <SubscriptionGate onNavigate={navigate}>
      <Suspense fallback={<LazySpinner />}>
        <LunaraeBOE onNavigate={navigate} />
      </Suspense>
    </SubscriptionGate>
  )

  if (page === 'viewer') return <ZimraBOEViewer />

  if (page === 'profile') return (
    <AppShell onNavigate={navigate} page={page}>
      <Profile onNavigate={navigate} />
    </AppShell>
  )

  if (page === 'company') return (
    <AppShell onNavigate={navigate} page={page}>
      <CompanyDashboard onNavigate={navigate} />
    </AppShell>
  )

  if (page === 'users') return (
    <AppShell onNavigate={navigate} page={page}>
      <UserManagement onNavigate={navigate} />
    </AppShell>
  )

  if (page === 'history') return (
    <AppShell onNavigate={navigate} page={page}>
      <BoeHistory onNavigate={navigate} />
    </AppShell>
  )

  if (page === 'admin') return (
    <Suspense fallback={<LazySpinner />}>
      <SuperAdmin onNavigate={navigate} />
    </Suspense>
  )
  if (page === 'customs')  return <CustomsIntelligence onNavigate={navigate} />
  if (page === 'simulator') return <ImportCostSimulator onNavigate={navigate} />

  if (page === 'checkout') return (
    <AppShell onNavigate={navigate} page={page}>
      <Checkout plan={checkoutPlan} onNavigate={navigate} />
    </AppShell>
  )

  if (page === 'payments') return (
    <AppShell onNavigate={navigate} page={page}>
      <PaymentHistory onNavigate={navigate} />
    </AppShell>
  )

  if (page === 'activity') return (
    <AppShell onNavigate={navigate} page={page}>
      <ActivityCenter onNavigate={navigate} />
    </AppShell>
  )

  return (
    <>
      <Landing page={page} onNavigate={navigate} />
      <OnboardingWizard onNavigate={navigate} />
    </>
  )
}

/* ── Root: wrap with AuthProvider ───────────────────────── */
export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
