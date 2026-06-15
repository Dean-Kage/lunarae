import Nav          from '../components/Nav.jsx'
import Footer       from '../components/Footer.jsx'
import SectionReveal from '../components/SectionReveal.jsx'
import StatCounter  from '../components/NumberTicker.jsx'

/* ═══════════════════════════════════════════════════════════
   HERO SECTION
   ═══════════════════════════════════════════════════════════ */
function Hero({ onNavigate, isGuest }) {
  const stats = [
    { value: 549,  suffix: '+',    label: 'HS Codes Trained'  },
    { value: 27,   suffix: '',     label: 'Ports of Entry'     },
    { value: 14.5, suffix: '%',    label: 'VAT Rate Applied'   },
    { value: 40,   suffix: '%',    label: 'Max Duty Rate'      },
    { value: 2,    suffix: ' SIs', label: 'Compliance Acts'    },
  ]

  const primaryBtn = {
    background: 'linear-gradient(135deg, #e9ba4c, #c8921a)',
    border: 'none', borderRadius: 10,
    padding: '15px 32px', fontSize: 16, fontWeight: 700,
    color: '#06090f', cursor: 'pointer',
    boxShadow: '0 4px 24px rgba(233,186,76,0.3)',
    transition: 'all 0.22s ease',
    letterSpacing: '-0.01em', whiteSpace: 'nowrap',
    minHeight: 52,
  }
  const ghostBtn = {
    background: 'rgba(10,21,37,0.45)',
    border: '1px solid rgba(233,186,76,0.32)',
    borderRadius: 10, padding: '15px 32px',
    fontSize: 16, fontWeight: 600, color: '#e9ba4c',
    cursor: 'pointer', backdropFilter: 'blur(12px)',
    transition: 'all 0.22s ease', whiteSpace: 'nowrap',
    minHeight: 52,
  }

  return (
    <section style={{
      position: 'relative', height: '100vh', minHeight: 680,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      {/* Video background */}
      <video
        autoPlay muted loop playsInline
        poster="/media/hero-poster.jpg"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
      >
        <source src="/media/hero-bg.mp4" type="video/mp4" />
      </video>

      {/* Overlays */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(to bottom, rgba(2,5,14,0.78) 0%, rgba(2,5,14,0.42) 42%, rgba(2,5,14,0.93) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'radial-gradient(ellipse at 68% 44%, rgba(233,186,76,0.06) 0%, transparent 60%)' }} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, opacity: 0.35,
        backgroundImage:
          'repeating-linear-gradient(0deg, transparent, transparent 48px, rgba(233,186,76,0.03) 48px, rgba(233,186,76,0.03) 49px),' +
          'repeating-linear-gradient(90deg, transparent, transparent 48px, rgba(233,186,76,0.03) 48px, rgba(233,186,76,0.03) 49px)',
      }} />

      {/* Content */}
      <div className="hero-content" style={{
        position: 'relative', zIndex: 2, flex: 1,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        paddingTop: 'clamp(68px, 10vh, 96px)',
      }}>
        {/* Eyebrow */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28,
          background: 'rgba(233,186,76,0.08)', border: '1px solid rgba(233,186,76,0.22)',
          borderRadius: 9999, padding: '6px 16px', width: 'fit-content',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#e9ba4c', boxShadow: '0 0 6px #e9ba4c' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#e9ba4c', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Zimbabwe Customs Intelligence Platform
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 82px)',
          fontWeight: 800, lineHeight: 1.06,
          marginBottom: 24, letterSpacing: '-0.025em',
          color: '#eef2f7',
        }}>
          Frame Bills of Entry<br />
          <span style={{
            background: 'linear-gradient(90deg, #e9ba4c 0%, #f5cb5c 38%, #c8921a 80%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>in Minutes.</span>
        </h1>

        {/* Subheadline */}
        <p style={{
          fontSize: 'clamp(15px, 1.7vw, 19px)',
          color: '#8fa3bd', maxWidth: 560, lineHeight: 1.76,
          marginBottom: 44,
        }}>
          Lunarae AI helps Zimbabwean clearing agents prepare accurate Bills of Entry faster,
          with fewer errors and fewer penalties.
        </p>

        {/* CTAs — context-aware */}
        <div className="hero-cta-group">
          {isGuest ? (
            <>
              <button onClick={() => onNavigate('register')} style={primaryBtn}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 36px rgba(233,186,76,0.42)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = '0 4px 24px rgba(233,186,76,0.3)' }}>
                Start Free Trial →
              </button>
              <button onClick={() => onNavigate('login')} style={ghostBtn}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(233,186,76,0.1)'; e.currentTarget.style.borderColor = 'rgba(233,186,76,0.52)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(10,21,37,0.45)';  e.currentTarget.style.borderColor = 'rgba(233,186,76,0.32)' }}>
                Sign In
              </button>
            </>
          ) : (
            <>
              <button onClick={() => onNavigate('boe')} style={primaryBtn}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 36px rgba(233,186,76,0.42)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = '0 4px 24px rgba(233,186,76,0.3)' }}>
                Generate BOE →
              </button>
              <button onClick={() => onNavigate('viewer')} style={ghostBtn}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(233,186,76,0.1)'; e.currentTarget.style.borderColor = 'rgba(233,186,76,0.52)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(10,21,37,0.45)';  e.currentTarget.style.borderColor = 'rgba(233,186,76,0.32)' }}>
                View SAD Form
              </button>
            </>
          )}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="scroll-indicator" style={{
        position: 'absolute', bottom: 'clamp(80px,12vh,104px)', left: '50%', transform: 'translateX(-50%)', zIndex: 2,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, pointerEvents: 'none',
      }}>
        <span style={{ fontSize: 10, color: '#45607a', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Scroll</span>
        <span style={{ color: '#e9ba4c', fontSize: 18, animation: 'scrollBounce 1.6s ease-in-out infinite' }}>↓</span>
      </div>

      {/* Stats bar */}
      <div style={{
        position: 'relative', zIndex: 2, background: 'rgba(2,5,14,0.88)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(233,186,76,0.09)', padding: '18px 0',
      }}>
        <div className="hero-content">
          <div className="stats-bar">
            {stats.map(({ value, suffix, label }) => (
              <div key={label} className="stat-item" style={{ textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontSize: 'clamp(20px, 2.8vw, 30px)', fontWeight: 700, color: '#e9ba4c', lineHeight: 1 }}>
                  <StatCounter value={value} suffix={suffix} />
                </div>
                <div style={{ fontSize: 10, color: '#45607a', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   TRUST STRIP
   ═══════════════════════════════════════════════════════════ */
function TrustStrip() {
  const items = [
    'ZIMRA ASYCUDA World',
    'Zimbabwe Tariff Book',
    'Customs & Excise Act [Ch 23:02]',
    'SI 35/2024 CBCA',
    'SI 122/2017 Import Licences',
    'VAT Act [Ch 23:12] — 14.5%',
  ]
  return (
    <div style={{
      background: '#030710',
      borderTop: '1px solid rgba(22,40,64,0.7)',
      borderBottom: '1px solid rgba(22,40,64,0.7)',
      padding: '13px 0',
    }}>
      <div className="container">
        <div className="trust-strip-inner">
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(233,186,76,0.45)', flexShrink: 0 }} />
              <span style={{ fontSize: 11.5, color: '#45607a', fontWeight: 500, whiteSpace: 'nowrap', letterSpacing: '0.03em' }}>
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   FEATURES SECTION
   ═══════════════════════════════════════════════════════════ */
function FeaturesSection({ onNavigate }) {
  const features = [
    {
      img:      '/media/feat-classify.jpg',
      category: 'AI CLASSIFICATION',
      icon:     '📦',
      title:    'Intelligent HS Code Classification',
      desc:     'Upload any invoice format — PDF, DOCX, CSV, or XML. Lunarae reads every line item and classifies it against the Zimbabwe Tariff Book, applying the correct duty rates automatically.',
      cta:      '549+ HS codes trained',
    },
    {
      img:      '/media/feat-compliance.jpg',
      category: 'COMPLIANCE INTELLIGENCE',
      icon:     '🔒',
      title:    'CBCA & Import Licence Compliance',
      desc:     'Every item is checked against SI 35/2024 CBCA and SI 122/2017 import licence requirements. Each line receives a CLEAR, CBCA, LICENCE, or PROHIBITED status flag — automatically.',
      cta:      '2 compliance acts enforced',
    },
    {
      img:      '/media/feat-xml.jpg',
      category: 'ASYCUDA XML EXPORT',
      icon:     '⚡',
      title:    'ZIMRA-Ready ASYCUDA XML',
      desc:     'One click generates a complete ASYCUDA World-compatible XML file. Duties, VAT at 14.5%, RBZ exchange rates, and all required declaration fields are populated and ready.',
      cta:      'XML in one click',
    },
  ]

  return (
    <section className="section" style={{ background: '#06090f' }}>
      <div className="container">

        <SectionReveal>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: '#e9ba4c',
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12,
            }}>
              Platform Capabilities
            </div>
            <h2 style={{
              fontSize: 'clamp(26px, 3.8vw, 44px)',
              fontWeight: 700, color: '#eef2f7',
              letterSpacing: '-0.02em', lineHeight: 1.15,
            }}>
              Everything a clearing agent needs
            </h2>
          </div>
        </SectionReveal>

        <div className="feat-grid">
          {features.map(({ img, category, icon, title, desc, cta }, i) => (
            <SectionReveal key={title} delay={i * 110}>
              <div
                className="glass-card glass-card-hover feat-card"
                style={{ overflow: 'hidden', height: 440, position: 'relative', cursor: 'pointer' }}
                onClick={() => onNavigate('boe')}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && onNavigate('boe')}
              >
                {/* Background image */}
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: `url(${img})`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                }} />
                {/* Dark gradient */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to bottom, rgba(6,9,15,0.45) 0%, rgba(6,9,15,0.72) 45%, rgba(6,9,15,0.97) 100%)',
                }} />

                {/* Content */}
                <div style={{
                  position: 'relative', zIndex: 1, height: '100%',
                  display: 'flex', flexDirection: 'column', padding: '24px 26px',
                }}>
                  {/* Category badge */}
                  <div style={{
                    background: 'rgba(233,186,76,0.1)', border: '1px solid rgba(233,186,76,0.22)',
                    borderRadius: 6, padding: '4px 10px', width: 'fit-content',
                    fontSize: 9, fontWeight: 700, color: '#e9ba4c', letterSpacing: '0.1em',
                  }}>
                    {category}
                  </div>

                  <div style={{ flex: 1 }} />

                  {/* Icon */}
                  <div style={{ fontSize: 38, marginBottom: 14 }}>{icon}</div>

                  {/* Title */}
                  <h3 style={{
                    fontSize: 20, fontWeight: 700, color: '#eef2f7',
                    marginBottom: 10, lineHeight: 1.25, letterSpacing: '-0.01em',
                  }}>
                    {title}
                  </h3>

                  {/* Desc */}
                  <p style={{ fontSize: 13.5, color: '#8fa3bd', lineHeight: 1.68, marginBottom: 18 }}>
                    {desc}
                  </p>

                  {/* CTA */}
                  <div style={{
                    fontSize: 12, fontWeight: 600, color: '#e9ba4c',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    {cta} <span style={{ fontSize: 14 }}>→</span>
                  </div>
                </div>
              </div>
            </SectionReveal>
          ))}
        </div>

      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   PROCESS SECTION — How It Works
   ═══════════════════════════════════════════════════════════ */
function ProcessSection() {
  const steps = [
    {
      num:   '01',
      icon:  '📄',
      title: 'Upload Your Invoice',
      desc:  'Drop in any shipping document — PDF, Word, TXT, CSV, or XML. Or paste invoice text directly into the editor. Lunarae reads it all.',
    },
    {
      num:   '02',
      icon:  '⚖',
      title: 'AI Classifies & Calculates',
      desc:  'Every line item is classified against the Zimbabwe Tariff Book. CBCA flags, import licence checks, CIF values, duties, and VAT are applied per line — automatically.',
    },
    {
      num:   '03',
      icon:  '📂',
      title: 'Download ASYCUDA XML',
      desc:  'One click generates a complete ZIMRA ASYCUDA World XML. All fields populated. All duties calculated at the live RBZ exchange rate. Ready to submit.',
    },
  ]

  return (
    <section className="section" style={{ background: '#030710' }}>
      <div className="container">

        <SectionReveal>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: '#e9ba4c',
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12,
            }}>
              How It Works
            </div>
            <h2 style={{
              fontSize: 'clamp(26px, 3.8vw, 44px)',
              fontWeight: 700, color: '#eef2f7',
              letterSpacing: '-0.02em', lineHeight: 1.15,
            }}>
              Three steps to a complete BOE
            </h2>
          </div>
        </SectionReveal>

        <div className="steps-grid">
          {steps.map(({ num, icon, title, desc }, i) => (
            <SectionReveal key={num} delay={i * 140}>
              <div style={{
                position: 'relative', padding: '30px 26px',
                background: 'rgba(10,21,37,0.45)',
                border: '1px solid rgba(22,40,64,0.8)',
                borderRadius: 16, height: '100%',
              }}>
                {/* Watermark number */}
                <div style={{
                  position: 'absolute', top: 14, right: 18,
                  fontSize: 72, fontWeight: 800, lineHeight: 1,
                  color: 'rgba(233,186,76,0.07)',
                  letterSpacing: '-0.04em', userSelect: 'none',
                }}>
                  {num}
                </div>

                {/* Icon */}
                <div style={{
                  width: 54, height: 54, borderRadius: 13,
                  background: 'rgba(233,186,76,0.08)', border: '1px solid rgba(233,186,76,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, marginBottom: 18,
                }}>
                  {icon}
                </div>

                {/* Step label */}
                <div style={{ fontSize: 10, fontWeight: 700, color: '#e9ba4c', letterSpacing: '0.09em', marginBottom: 8 }}>
                  STEP {num}
                </div>

                {/* Title */}
                <h3 style={{
                  fontSize: 19, fontWeight: 700, color: '#eef2f7',
                  marginBottom: 12, letterSpacing: '-0.01em', lineHeight: 1.25,
                }}>
                  {title}
                </h3>

                {/* Description */}
                <p style={{ fontSize: 14, color: '#8fa3bd', lineHeight: 1.72 }}>
                  {desc}
                </p>
              </div>
            </SectionReveal>
          ))}
        </div>

      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   COMPLIANCE INTELLIGENCE SECTION
   ═══════════════════════════════════════════════════════════ */
function ComplianceSection() {
  const statuses = [
    {
      status: 'CLEAR',
      dot:    '#22c55e',
      bg:     'rgba(34,197,94,0.07)',
      border: 'rgba(34,197,94,0.18)',
      color:  '#22c55e',
      title:  'Clear for Entry',
      desc:   'All compliance requirements met. No CBCA declaration, import licence, or additional permits required for this item.',
    },
    {
      status: 'CBCA REQUIRED',
      dot:    '#eab308',
      bg:     'rgba(234,179,8,0.07)',
      border: 'rgba(234,179,8,0.18)',
      color:  '#eab308',
      title:  'CBCA Declaration',
      desc:   'Cross Border Currency Act (SI 35/2024) declaration required. Applies to most consumer goods — cosmetics, electronics, clothing, household items.',
    },
    {
      status: 'CBCA + LICENCE',
      dot:    '#f97316',
      bg:     'rgba(249,115,22,0.07)',
      border: 'rgba(249,115,22,0.18)',
      color:  '#f97316',
      title:  'CBCA & Import Licence',
      desc:   'Both CBCA declaration and a specific import licence required (SI 122/2017). Applies to batteries, detergents, medical devices, clothing accessories.',
    },
    {
      status: 'LICENCE REQUIRED',
      dot:    '#f97316',
      bg:     'rgba(249,115,22,0.07)',
      border: 'rgba(249,115,22,0.18)',
      color:  '#f97316',
      title:  'Import Licence Only',
      desc:   'Specific import licence required from the relevant authority — MCAZ for pharmaceuticals and medical devices. CBCA not triggered.',
    },
  ]

  return (
    <section className="section" style={{ background: '#06090f' }}>
      <div className="container">

        <SectionReveal>
          <div className="compliance-header" style={{ display: 'flex', flexWrap: 'wrap', gap: 40, justifyContent: 'space-between', marginBottom: 52, alignItems: 'flex-end' }}>
            <div style={{ maxWidth: 500 }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: '#e9ba4c',
                letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12,
              }}>
                Compliance Intelligence
              </div>
              <h2 style={{
                fontSize: 'clamp(26px, 3.8vw, 44px)',
                fontWeight: 700, color: '#eef2f7',
                letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 14,
              }}>
                Every item checked against Zimbabwe law
              </h2>
              <p style={{ fontSize: 15, color: '#8fa3bd', lineHeight: 1.72 }}>
                Lunarae applies SI 35/2024 CBCA and SI 122/2017 import licence rules per
                line item. Each receives a clear compliance status — no guesswork, no missed
                obligations.
              </p>
            </div>

            <div className="compliance-info-box" style={{
              background: 'rgba(233,186,76,0.06)', border: '1px solid rgba(233,186,76,0.12)',
              borderRadius: 12, padding: '16px 20px', maxWidth: 280,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#a07c2a', letterSpacing: '0.06em', marginBottom: 10 }}>
                AUTO-APPLIED RULES
              </div>
              {['CBCA (SI 35/2024)', 'Import Licences (SI 122/2017)', 'MCAZ Pharmaceutical licences', 'Battery import controls', 'Surface-active agent licences'].map(r => (
                <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                  <span style={{ color: '#e9ba4c', fontSize: 12 }}>✓</span>
                  <span style={{ fontSize: 12.5, color: '#8fa3bd' }}>{r}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionReveal>

        <div className="compliance-grid">
          {statuses.map(({ status, dot, bg, border, color, title, desc }, i) => (
            <SectionReveal key={status} delay={i * 90}>
              <div style={{
                background: bg, border: `1px solid ${border}`,
                borderRadius: 14, padding: '22px 18px', height: '100%',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: dot, boxShadow: `0 0 8px ${dot}`, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: '0.07em' }}>{status}</span>
                </div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#eef2f7', marginBottom: 8, lineHeight: 1.25 }}>
                  {title}
                </h4>
                <p style={{ fontSize: 12.5, color: '#8fa3bd', lineHeight: 1.68 }}>
                  {desc}
                </p>
              </div>
            </SectionReveal>
          ))}
        </div>

      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   COVERAGE SECTION — Zimbabwe Ports
   ═══════════════════════════════════════════════════════════ */
function CoverageSection() {
  const ports = [
    { code: 'ZWBB',  name: 'Beitbridge',          primary: true  },
    { code: 'ZWCH',  name: 'Chirundu',             primary: true  },
    { code: 'ZWFB',  name: 'Forbes Border Post',   primary: true  },
    { code: 'ZWHA',  name: 'Harare Airport',        primary: true  },
    { code: 'ZWHR',  name: 'Harare',               primary: false },
    { code: 'ZWBA',  name: 'Bulawayo Airport',      primary: false },
    { code: 'ZWBW',  name: 'Bulawayo',             primary: false },
    { code: 'ZWVF',  name: 'Victoria Falls',        primary: false },
    { code: 'ZWMT',  name: 'Mutare',               primary: false },
    { code: 'ZWKB',  name: 'Kariba',               primary: false },
    { code: 'ZWNY',  name: 'Nyamapanda',           primary: false },
    { code: 'ZWPT',  name: 'Plumtree',             primary: false },
    { code: 'ZWKZ',  name: 'Kazungula',            primary: false },
    { code: 'ZWMK',  name: 'Mukumbura',            primary: false },
    { code: 'ZWCZ',  name: 'Chiredzi',             primary: false },
    { code: 'ZWGW',  name: 'Gweru',                primary: false },
    { code: 'ZWKW',  name: 'Kwekwe',               primary: false },
    { code: 'ZWMN',  name: 'Masvingo',             primary: false },
    { code: 'ZWKN',  name: 'Kanyemba',             primary: false },
    { code: 'ZWMG',  name: 'Maitengwe',            primary: false },
    { code: 'ZWMP',  name: 'Mphoengs',             primary: false },
    { code: 'ZWMS',  name: 'Mt. Selinda',           primary: false },
    { code: 'ZWSN',  name: 'Sango',                primary: false },
    { code: 'ZWBR',  name: 'Buffalo Range',         primary: false },
    { code: 'ZWAGS', name: 'Air Ground Svc Harare', primary: false },
    { code: 'HREX',  name: 'Harare Excise',         primary: false },
    { code: 'BWEX',  name: 'Bulawayo Excise',       primary: false },
  ]

  return (
    <section className="section coverage-section" style={{
      backgroundImage: `linear-gradient(to bottom, rgba(3,7,16,0.95) 0%, rgba(3,7,16,0.98) 100%), url(/media/ports-bg.jpg)`,
      backgroundSize: 'cover', backgroundPosition: 'center',
    }}>
      <div className="container">

        <SectionReveal>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: '#e9ba4c',
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12,
            }}>
              National Coverage
            </div>
            <h2 style={{
              fontSize: 'clamp(26px, 3.8vw, 44px)',
              fontWeight: 700, color: '#eef2f7',
              letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 14,
            }}>
              All 27 Zimbabwe customs offices
            </h2>
            <p style={{ fontSize: 15, color: '#8fa3bd', maxWidth: 460, margin: '0 auto', lineHeight: 1.72 }}>
              From Beitbridge to Nyamapanda — road, air, rail, and sea.
              Every port of entry supported.
            </p>
          </div>
        </SectionReveal>

        <div className="ports-grid">
          {ports.map(({ code, name, primary }, i) => (
            <SectionReveal key={code} delay={Math.floor(i / 7) * 70}>
              <div
                style={{
                  background: primary ? 'rgba(233,186,76,0.07)' : 'rgba(10,21,37,0.45)',
                  border: primary ? '1px solid rgba(233,186,76,0.18)' : '1px solid rgba(22,40,64,0.75)',
                  borderRadius: 10, padding: '10px 14px',
                  transition: 'all 0.2s ease', cursor: 'default',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(233,186,76,0.25)'
                  e.currentTarget.style.background   = 'rgba(233,186,76,0.06)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = primary ? 'rgba(233,186,76,0.18)' : 'rgba(22,40,64,0.75)'
                  e.currentTarget.style.background   = primary ? 'rgba(233,186,76,0.07)' : 'rgba(10,21,37,0.45)'
                }}
              >
                <div style={{
                  fontSize: 10, fontWeight: 700,
                  color: primary ? '#e9ba4c' : '#a07c2a',
                  letterSpacing: '0.06em', marginBottom: 2,
                }}>
                  {code}
                </div>
                <div style={{ fontSize: 12, color: '#8fa3bd', fontWeight: 500, lineHeight: 1.3 }}>
                  {name}
                </div>
              </div>
            </SectionReveal>
          ))}
        </div>

      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   FEATURES OVERVIEW — 8-feature grid
   ═══════════════════════════════════════════════════════════ */
function FeaturesOverview() {
  const features = [
    { icon: '🤖', title: 'AI BOE Analysis',              desc: 'Upload any invoice and let AI extract, classify, and calculate your entire Bill of Entry automatically.' },
    { icon: '📄', title: 'ASYCUDA XML Generation',       desc: 'Export a ZIMRA-compliant ASYCUDA World XML file with all declaration fields populated — one click.' },
    { icon: '📡', title: 'Offline Capability',           desc: 'Work without internet. Your BOE drafts and HS code database are cached and sync when back online.' },
    { icon: '⚖',  title: 'Zimbabwe HS Code Intelligence', desc: 'Covers the full Zimbabwe Tariff Book — 549+ trained codes with automatic duty rate lookup.' },
    { icon: '🚨', title: 'Compliance Alerts',            desc: 'Instant flags for SI 35/2024 CBCA and SI 122/2017 import licence requirements, per line item.' },
    { icon: '✅', title: 'CBCA Validation',              desc: 'Every item gets CLEAR, CBCA, LICENCE, or PROHIBITED status — no manual cross-referencing needed.' },
    { icon: '🏢', title: 'Multi-user Company Accounts',  desc: 'Invite clearing agents and clerks. Manage roles, permissions, and access per company account.' },
    { icon: '🗂',  title: 'Audit Trails',                desc: 'Every BOE action is logged with timestamps. Full history for compliance reviews and client reporting.' },
  ]

  return (
    <section className="section" style={{ background: '#030710' }}>
      <div className="container">
        <SectionReveal>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#e9ba4c', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
              What's Included
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 3.8vw, 44px)', fontWeight: 700, color: '#eef2f7', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              Everything you need to clear faster
            </h2>
          </div>
        </SectionReveal>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))',
          gap: 20,
        }}>
          {features.map(({ icon, title, desc }, i) => (
            <SectionReveal key={title} delay={i * 60}>
              <div style={{
                padding: '24px 22px',
                background: 'rgba(10,18,32,0.7)',
                border: '1px solid rgba(22,40,64,0.75)',
                borderRadius: 16,
                transition: 'border-color 0.2s, transform 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(233,186,76,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(22,40,64,0.75)';  e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div style={{
                  width: 46, height: 46, borderRadius: 11,
                  background: 'rgba(233,186,76,0.07)', border: '1px solid rgba(233,186,76,0.14)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, marginBottom: 16,
                }}>
                  {icon}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#eef2f7', marginBottom: 8, letterSpacing: '-0.01em' }}>
                  {title}
                </div>
                <div style={{ fontSize: 13.5, color: '#8fa3bd', lineHeight: 1.68 }}>
                  {desc}
                </div>
              </div>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   SOCIAL PROOF SECTION
   ═══════════════════════════════════════════════════════════ */
function SocialProof() {
  const testimonials = [
    {
      quote: "We cut our BOE preparation time in half. The AI catches HS code errors that used to cost us penalty fees.",
      name: 'Takudzwa M.',
      role: 'Senior Clearing Agent',
      company: 'Harare',
    },
    {
      quote: "The CBCA compliance flags alone are worth it. We no longer have to cross-reference SI 35/2024 manually for every shipment.",
      name: 'Nomsa D.',
      role: 'Company Owner',
      company: 'Bulawayo',
    },
    {
      quote: "The ASYCUDA XML export is accurate. Our ZIMRA submissions go through first time now, no rejections.",
      name: 'Farai K.',
      role: 'Customs Clearing Manager',
      company: 'Beitbridge',
    },
  ]

  return (
    <section className="section" style={{ background: '#06090f' }}>
      <div className="container">
        <SectionReveal>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#e9ba4c', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
              Trusted By
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 3.8vw, 44px)', fontWeight: 700, color: '#eef2f7', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              Trusted By Zimbabwean Clearing Agents
            </h2>
          </div>
        </SectionReveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: 20 }}>
          {testimonials.map(({ quote, name, role, company }, i) => (
            <SectionReveal key={name} delay={i * 100}>
              <div style={{
                padding: '28px 26px',
                background: 'rgba(10,18,32,0.65)',
                border: '1px solid rgba(22,40,64,0.8)',
                borderRadius: 16,
                display: 'flex', flexDirection: 'column', gap: 20,
              }}>
                {/* Stars */}
                <div style={{ color: '#e9ba4c', fontSize: 13, letterSpacing: 2 }}>★★★★★</div>
                {/* Quote */}
                <p style={{ fontSize: 14.5, color: '#c4d4e8', lineHeight: 1.72, fontStyle: 'italic', margin: 0 }}>
                  "{quote}"
                </p>
                {/* Attribution */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 'auto' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1e3a5f, #0f2040)',
                    border: '1px solid rgba(233,186,76,0.22)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, color: '#e9ba4c', flexShrink: 0,
                  }}>
                    {name[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#eef2f7' }}>{name}</div>
                    <div style={{ fontSize: 11.5, color: '#8fa3bd' }}>{role} · {company}</div>
                  </div>
                </div>
              </div>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   PRICING PREVIEW
   ═══════════════════════════════════════════════════════════ */
function PricingPreview({ onNavigate, isGuest }) {
  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      period: '',
      desc: 'Perfect for individual clearing agents getting started.',
      features: ['5 BOEs per month', 'AI HS Code Classification', 'ASYCUDA XML Export', 'CBCA Compliance Flags', 'Email Support'],
      cta: 'Start Free',
      ctaDest: isGuest ? 'register' : 'boe',
      highlighted: false,
    },
    {
      name: 'Professional',
      price: 'USD 49',
      period: '/month',
      desc: 'For active clearing agents and small agencies.',
      features: ['Unlimited BOEs', 'Everything in Starter', 'Import Cost Simulator', 'BOE History & Audit Trail', 'Priority Support'],
      cta: 'Start Free Trial',
      ctaDest: isGuest ? 'register' : 'checkout',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      desc: 'For clearing houses and large freight forwarders.',
      features: ['Everything in Professional', 'Multi-user Company Accounts', 'Team Role Management', 'Dedicated Onboarding', 'SLA & Custom Integration'],
      cta: 'Contact Sales',
      ctaDest: isGuest ? 'register' : 'checkout',
      highlighted: false,
    },
  ]

  return (
    <section className="section" style={{ background: '#030710' }}>
      <div className="container">
        <SectionReveal>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#e9ba4c', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
              Pricing
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 3.8vw, 44px)', fontWeight: 700, color: '#eef2f7', letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 14 }}>
              Simple, transparent pricing
            </h2>
            <p style={{ fontSize: 15, color: '#8fa3bd', maxWidth: 440, margin: '0 auto', lineHeight: 1.72 }}>
              Start free and scale as your business grows. No long-term contracts.
            </p>
          </div>
        </SectionReveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: 20, alignItems: 'start' }}>
          {plans.map(({ name, price, period, desc, features, cta, ctaDest, highlighted }, i) => (
            <SectionReveal key={name} delay={i * 80}>
              <div style={{
                padding: '32px 28px',
                background: highlighted ? 'rgba(233,186,76,0.05)' : 'rgba(10,18,32,0.7)',
                border: highlighted ? '1px solid rgba(233,186,76,0.28)' : '1px solid rgba(22,40,64,0.75)',
                borderRadius: 18,
                position: 'relative',
                transition: 'transform 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {highlighted && (
                  <div style={{
                    position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #e9ba4c, #c8921a)',
                    borderRadius: '0 0 10px 10px',
                    padding: '4px 16px', fontSize: 10, fontWeight: 700, color: '#06090f',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>
                    Most Popular
                  </div>
                )}

                <div style={{ fontSize: 13, fontWeight: 700, color: highlighted ? '#e9ba4c' : '#8fa3bd', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                  {name}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: '#eef2f7', letterSpacing: '-0.03em' }}>{price}</span>
                  {period && <span style={{ fontSize: 14, color: '#8fa3bd' }}>{period}</span>}
                </div>
                <p style={{ fontSize: 13.5, color: '#8fa3bd', lineHeight: 1.6, marginBottom: 24 }}>{desc}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                  {features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: '#e9ba4c', fontSize: 13, flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: 13.5, color: '#c4d4e8' }}>{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => onNavigate(ctaDest)}
                  style={{
                    width: '100%',
                    background: highlighted ? 'linear-gradient(135deg, #e9ba4c, #c8921a)' : 'rgba(233,186,76,0.07)',
                    border: highlighted ? 'none' : '1px solid rgba(233,186,76,0.22)',
                    borderRadius: 10, padding: '13px',
                    fontSize: 14, fontWeight: 700,
                    color: highlighted ? '#06090f' : '#e9ba4c',
                    cursor: 'pointer', transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={e => { if (!highlighted) { e.currentTarget.style.background = 'rgba(233,186,76,0.12)'; e.currentTarget.style.borderColor = 'rgba(233,186,76,0.4)' } else { e.currentTarget.style.filter = 'brightness(1.1)' } }}
                  onMouseLeave={e => { if (!highlighted) { e.currentTarget.style.background = 'rgba(233,186,76,0.07)'; e.currentTarget.style.borderColor = 'rgba(233,186,76,0.22)' } else { e.currentTarget.style.filter = 'brightness(1)' } }}
                >
                  {cta} →
                </button>
              </div>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   CTA SECTION
   ═══════════════════════════════════════════════════════════ */
function CTASection({ onNavigate, isGuest }) {
  return (
    <section className="cta-section" style={{
      position: 'relative', padding: '120px 0', overflow: 'hidden',
      backgroundImage: `linear-gradient(to bottom, rgba(3,7,16,0.88) 0%, rgba(3,7,16,0.95) 100%), url(/media/cta-bg.jpg)`,
      backgroundSize: 'cover', backgroundPosition: 'center',
    }}>
      {/* Gold radial glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 60%, rgba(233,186,76,0.06) 0%, transparent 65%)',
      }} />

      <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <SectionReveal>
          {/* Eyebrow */}
          <div style={{
            display: 'inline-block',
            background: 'rgba(233,186,76,0.08)', border: '1px solid rgba(233,186,76,0.2)',
            borderRadius: 9999, padding: '5px 16px',
            fontSize: 11, fontWeight: 600, color: '#e9ba4c',
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 24,
          }}>
            Ready to Start
          </div>

          {/* Headline */}
          <h2 style={{
            fontSize: 'clamp(30px, 4.8vw, 58px)',
            fontWeight: 800, color: '#eef2f7',
            letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 20,
          }}>
            Ready to simplify<br />
            <span style={{
              background: 'linear-gradient(90deg, #e9ba4c, #f5cb5c)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              customs clearance?
            </span>
          </h2>

          {/* Sub */}
          <p style={{
            fontSize: 16, color: '#8fa3bd',
            maxWidth: 480, margin: '0 auto 44px', lineHeight: 1.75,
          }}>
            {isGuest
              ? 'Join clearing agents across Zimbabwe who prepare accurate Bills of Entry faster with fewer penalties.'
              : 'Automate ZIMRA customs declarations and eliminate manual classification errors. Generate your first BOE in under five minutes.'}
          </p>

          {/* CTAs — guest-aware */}
          <div className="hero-cta-group" style={{ justifyContent: 'center' }}>
            {isGuest ? (
              <>
                <button
                  onClick={() => onNavigate('register')}
                  style={{
                    background: 'linear-gradient(135deg, #e9ba4c, #c8921a)', border: 'none',
                    borderRadius: 10, padding: '16px 36px',
                    fontSize: 16, fontWeight: 700, color: '#06090f',
                    cursor: 'pointer', boxShadow: '0 4px 32px rgba(233,186,76,0.3)',
                    transition: 'all 0.22s ease', letterSpacing: '-0.01em',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 44px rgba(233,186,76,0.42)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = '0 4px 32px rgba(233,186,76,0.3)' }}
                >
                  Start Free Trial →
                </button>
                <button
                  onClick={() => onNavigate('login')}
                  style={{
                    background: 'transparent', border: '1px solid rgba(233,186,76,0.3)',
                    borderRadius: 10, padding: '16px 36px',
                    fontSize: 16, fontWeight: 600, color: '#e9ba4c',
                    cursor: 'pointer', transition: 'all 0.22s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(233,186,76,0.08)'; e.currentTarget.style.borderColor = 'rgba(233,186,76,0.52)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent';            e.currentTarget.style.borderColor = 'rgba(233,186,76,0.3)' }}
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('boe')}
                  style={{
                    background: 'linear-gradient(135deg, #e9ba4c, #c8921a)', border: 'none',
                    borderRadius: 10, padding: '16px 36px',
                    fontSize: 16, fontWeight: 700, color: '#06090f',
                    cursor: 'pointer', boxShadow: '0 4px 32px rgba(233,186,76,0.3)',
                    transition: 'all 0.22s ease', letterSpacing: '-0.01em',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 44px rgba(233,186,76,0.42)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = '0 4px 32px rgba(233,186,76,0.3)' }}
                >
                  Generate BOE →
                </button>
                <button
                  onClick={() => onNavigate('viewer')}
                  style={{
                    background: 'transparent', border: '1px solid rgba(233,186,76,0.3)',
                    borderRadius: 10, padding: '16px 36px',
                    fontSize: 16, fontWeight: 600, color: '#e9ba4c',
                    cursor: 'pointer', transition: 'all 0.22s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(233,186,76,0.08)'; e.currentTarget.style.borderColor = 'rgba(233,186,76,0.52)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent';            e.currentTarget.style.borderColor = 'rgba(233,186,76,0.3)' }}
                >
                  View SAD Form
                </button>
              </>
            )}
          </div>
        </SectionReveal>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   LANDING PAGE — main export
   ═══════════════════════════════════════════════════════════ */
export default function Landing({ onNavigate, page, isGuest = false }) {
  return (
    <div style={{ background: '#06090f', minHeight: '100vh' }}>
      <Nav page={page} onNavigate={onNavigate} />
      <Hero onNavigate={onNavigate} isGuest={isGuest} />
      <TrustStrip />
      <FeaturesOverview />
      <FeaturesSection onNavigate={onNavigate} />
      <ProcessSection />
      <SocialProof />
      <ComplianceSection />
      <CoverageSection />
      <PricingPreview onNavigate={onNavigate} isGuest={isGuest} />
      <CTASection onNavigate={onNavigate} isGuest={isGuest} />
      <Footer onNavigate={onNavigate} />
    </div>
  )
}
