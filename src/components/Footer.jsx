export default function Footer({ onNavigate }) {
  const go = (id) => { onNavigate(id); window.scrollTo(0, 0) }

  const divider = {
    width: 1, height: 12, background: 'rgba(22,40,64,0.8)',
    display: 'inline-block', margin: '0 12px', verticalAlign: 'middle',
  }

  const linkBtn = (label, id) => (
    <button
      key={id}
      onClick={() => go(id)}
      style={{
        background: 'none', border: 'none', padding: 0,
        fontSize: 13, color: '#45607a', cursor: 'pointer',
        transition: 'color 0.15s', fontFamily: 'inherit',
        marginBottom: 10, display: 'block',
      }}
      onMouseEnter={e => e.currentTarget.style.color = '#e9ba4c'}
      onMouseLeave={e => e.currentTarget.style.color = '#45607a'}
    >
      {label}
    </button>
  )

  return (
    <footer style={{
      background: '#020508',
      borderTop: '1px solid rgba(22,40,64,0.7)',
      padding: 'clamp(40px,7vw,56px) 0 clamp(24px,4vw,32px)',
    }}>
      <div className="container">

        {/* Top */}
        <div className="footer-top">

          {/* Brand */}
          <div style={{ maxWidth: 300, flexShrink: 0, minWidth: 0 }}>
            <button
              onClick={() => go('home')}
              style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: 0, marginBottom: 14 }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'linear-gradient(135deg, #e9ba4c, #c8921a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, fontWeight: 800, color: '#06090f',
              }}>L</div>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#e9ba4c' }}>Lunarae</span>
            </button>
            <p style={{ fontSize: 13, color: '#45607a', lineHeight: 1.75 }}>
              Zimbabwe's AI-powered customs intelligence platform. From invoice to ASYCUDA XML in minutes.
            </p>
            {/* Compliance badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
              {['SI 35/2024', 'SI 122/2017', 'ASYCUDA World'].map(b => (
                <span key={b} style={{
                  background: 'rgba(233,186,76,0.06)', border: '1px solid rgba(233,186,76,0.12)',
                  borderRadius: 6, padding: '3px 9px', fontSize: 10, fontWeight: 600, color: '#a07c2a',
                  letterSpacing: '0.04em',
                }}>{b}</span>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="footer-links-row">
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8fa3bd', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 18 }}>
                Platform
              </div>
              {linkBtn('BOE Generator', 'boe')}
              {linkBtn('SAD Viewer',    'viewer')}
              {linkBtn('Home',          'home')}
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8fa3bd', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 18 }}>
                Compliance
              </div>
              {['SI 35/2024 CBCA', 'SI 122/2017 Licences', 'Zimbabwe Tariff Book', 'ZIMRA ASYCUDA World'].map(item => (
                <div key={item} style={{ fontSize: 13, color: '#45607a', marginBottom: 10, lineHeight: 1.4 }}>
                  {item}
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8fa3bd', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 18 }}>
                Coverage
              </div>
              {['549+ HS Codes', '27 Ports of Entry', 'Road · Air · Rail · Sea', 'All Zimbabwe Borders'].map(item => (
                <div key={item} style={{ fontSize: 13, color: '#45607a', marginBottom: 10, lineHeight: 1.4 }}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(22,40,64,0.7)', paddingTop: 24 }}>
          <div className="footer-bottom" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: '#2a3d52' }}>
              © 2026 Lunarae — Zimbabwe Customs Intelligence Platform
            </div>
            <div style={{ fontSize: 11, color: '#2a3d52', lineHeight: 1.6, textAlign: 'right' }}>
              For use by licensed clearing agents.
              <span style={divider} />
              Not affiliated with or endorsed by ZIMRA.
            </div>
          </div>
        </div>

      </div>
    </footer>
  )
}
