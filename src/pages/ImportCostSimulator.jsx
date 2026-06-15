import { useState, useMemo, useRef, useEffect } from 'react'
import { jsPDF } from 'jspdf'
import hsData      from '../data/customs/hsCodes.json'
import dutyData    from '../data/customs/dutyRates.json'
import licenceData from '../data/customs/importLicences.json'

/* ── Design tokens ──────────────────────────────────────── */
const C = {
  bg:     '#06090f',
  panel:  '#0d1829',
  panel2: '#0a1220',
  border: '#1e3a5f',
  gold:   '#e9ba4c',
  blue:   '#60a5fa',
  green:  '#4ade80',
  red:    '#f87171',
  orange: '#fb923c',
  purple: '#a78bfa',
  muted:  '#45607a',
  text:   '#eef2f7',
  sub:    '#8fa3bd',
}

const inp = {
  background: C.bg, border: `1px solid ${C.border}`, borderRadius: 9,
  padding: '10px 14px', fontSize: 14, color: C.text, outline: 'none',
  width: '100%', boxSizing: 'border-box',
}
const lbl = {
  display: 'block', fontSize: 11, color: C.muted, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6,
}
const card = { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }
const chip = (color) => ({
  background: color + '22', border: `1px solid ${color}44`,
  borderRadius: 20, padding: '2px 10px', fontSize: 11,
  fontWeight: 700, color, display: 'inline-block',
})

/* ── Helpers ────────────────────────────────────────────── */
function m(n, decimals = 2) {
  return `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}
function pct(n) { return `${Number(n || 0).toFixed(1)}%` }

function findDutyEntry(code) {
  if (!code) return null
  return dutyData.rates.find(r => {
    const parts = r.code.split('-')
    if (parts.length === 2) {
      return code >= parts[0].replace(/\D/g, '').slice(0, 4) && code <= parts[1].replace(/\D/g, '').slice(0, 4)
    }
    return r.code.replace(/\D/g, '').slice(0, 4) === code.slice(0, 4) ||
           r.code.startsWith(code.slice(0, 2))
  })
}

function findLicence(code) {
  if (!code) return null
  return licenceData.categories.find(c =>
    c.hsCodes.some(h => h.replace('-', '') >= code.slice(0, 4) && h.replace('-', '').slice(0, 2) === code.slice(0, 2))
  ) || null
}

/* ── HS search ──────────────────────────────────────────── */
function searchHs(q) {
  if (!q.trim()) return []
  const lq = q.toLowerCase()
  const hints = new Set()
  hsData.searchHints.forEach(h => {
    if (h.keyword.includes(lq) || lq.includes(h.keyword)) h.codes.forEach(c => hints.add(c))
  })
  const m = []
  hsData.chapters.forEach(ch => ch.sections.forEach(sec => {
    const score = hints.has(sec.code) ? 0 : sec.code.includes(q) ? 1 : sec.desc.toLowerCase().includes(lq) ? 2 : ch.title.toLowerCase().includes(lq) ? 3 : -1
    if (score >= 0) m.push({ ...sec, chapterTitle: ch.title, score })
  }))
  return m.sort((a, b) => a.score - b.score).slice(0, 12)
}

/* ── Markup presets ─────────────────────────────────────── */
const MARKUP_PRESETS = [
  { label: '20%', value: 20 },
  { label: '30%', value: 30 },
  { label: '50%', value: 50 },
  { label: '75%', value: 75 },
  { label: '100%', value: 100 },
]

/* ══════════════════════════════════════════════════════════ */
/*  PDF Generator                                             */
/* ══════════════════════════════════════════════════════════ */
function generatePDF(inputs, calc, product) {
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W    = 210
  const page = { l: 14, r: 196, w: 182 }

  /* palette */
  const gold   = [233, 186, 76]
  const navy   = [8, 17, 31]
  const panelB = [13, 24, 41]
  const border = [30, 58, 95]
  const txt    = [238, 242, 247]
  const sub    = [143, 163, 189]
  const green  = [74, 222, 128]
  const red    = [248, 113, 113]
  const blue   = [96, 165, 250]

  /* helpers */
  const setFill  = ([r,g,b]) => doc.setFillColor(r,g,b)
  const setDraw  = ([r,g,b]) => doc.setDrawColor(r,g,b)
  const setColor = ([r,g,b]) => doc.setTextColor(r,g,b)
  const setFont  = (style='normal', size=10) => { doc.setFont('helvetica', style); doc.setFontSize(size) }

  let y = 0

  /* ── Cover band ── */
  setFill(navy); doc.rect(0, 0, W, 42, 'F')
  setFill(gold); doc.rect(0, 40, W, 2, 'F')

  /* Logo box */
  setFill(gold); doc.roundedRect(14, 8, 22, 22, 3, 3, 'F')
  setColor([6,9,15]); setFont('bold', 16)
  doc.text('L', 25, 23, { align: 'center' })

  /* Title */
  setColor(txt); setFont('bold', 17)
  doc.text('IMPORT COST SIMULATION REPORT', 43, 17)
  setColor(sub); setFont('normal', 9)
  doc.text('Lunarae Zimbabwe Customs Intelligence Platform', 43, 24)
  doc.text(`Generated: ${new Date().toLocaleString('en-ZW')}  |  SI 122 · SI 35 of 2024  |  OFFLINE`, 43, 30)

  /* Reference pill */
  setFill(panelB); setDraw(border)
  doc.roundedRect(page.r - 44, 8, 46, 14, 2, 2, 'FD')
  setColor(gold); setFont('bold', 7)
  doc.text('REF', page.r - 41, 14)
  setColor(txt); setFont('bold', 9)
  doc.text(`LNR-SIM-${Date.now().toString(36).toUpperCase().slice(-6)}`, page.r - 41, 20)

  y = 52

  /* ── Section: Product Info ── */
  setFill(panelB); setDraw(border)
  doc.roundedRect(page.l, y, page.w, 32, 3, 3, 'FD')

  setColor(gold); setFont('bold', 8)
  doc.text('PRODUCT INFORMATION', page.l + 6, y + 8)

  const fields = [
    ['Product',          product.name || '—'],
    ['HS Code',          inputs.hsCode || '—'],
    ['Description',      product.desc || product.chapterTitle || '—'],
    ['Country of Origin', inputs.origin === 'sadc' ? 'SADC (Preferential)' : inputs.origin === 'comesa' ? 'COMESA (Preferential)' : 'General (MFN)'],
    ['Quantity',         `${Number(inputs.quantity).toLocaleString()} units`],
  ]

  let col = 0; let startX = page.l + 4
  fields.forEach((f, i) => {
    const x = startX + (col * 60)
    setColor(sub); setFont('normal', 7.5)
    doc.text(f[0].toUpperCase(), x, y + 16 + (Math.floor(i / 3)) * 8)
    setColor(txt); setFont('bold', 8.5)
    doc.text(String(f[1]).slice(0, 28), x, y + 21 + (Math.floor(i / 3)) * 8)
    col = (col + 1) % 3
  })

  y += 40

  /* ── Section: Cost Breakdown ── */
  setColor(gold); setFont('bold', 11)
  doc.text('DETAILED COST BREAKDOWN', page.l, y + 6)
  setFill(gold); doc.rect(page.l, y + 8, 40, 0.8, 'F')
  y += 14

  const rows = [
    { label: 'Invoice Value (Cost × Qty)', value: calc.invoiceValue, color: txt, indent: false },
    { label: 'International Freight',       value: calc.freight,      color: txt, indent: false },
    { label: 'Insurance (est. 0.5%)',        value: calc.insurance,    color: sub, indent: true  },
    { label: 'CIF Value (Customs Basis)',    value: calc.cif,          color: gold, bold: true, sep: true },
    { label: `Import Duty (${pct(calc.dutyRate)} — ${inputs.origin.toUpperCase()})`, value: calc.importDuty,  color: red  },
    calc.surtax   > 0 ? { label: `Surtax (${pct(calc.surtaxRate)})`, value: calc.surtax,    color: red   } : null,
    calc.excise   > 0 ? { label: 'Excise Duty',                       value: calc.excise,    color: red   } : null,
    { label: `VAT (${pct(calc.vatRate)} on duty-inclusive value)`,    value: calc.vat,       color: blue  },
    { label: 'ZIMDEF Levy (1% of CIF)',      value: calc.zimdef,       color: sub  },
    { label: 'AIDS Levy (3% of duty)',        value: calc.aidsLevy,    color: sub  },
    { label: 'Clearing / Agent Fees',         value: calc.clearingFees, color: sub  },
    calc.licenceCost > 0 ? { label: 'Import Licence Fee (est.)', value: calc.licenceCost, color: sub } : null,
    { label: 'TOTAL LANDED COST',             value: calc.totalLanded,  color: green, bold: true, sep: true, large: true },
  ].filter(Boolean)

  const rowH = 8.5
  rows.forEach((row, i) => {
    const ry = y + i * rowH
    /* separator bar */
    if (row.sep) {
      setFill(border); doc.rect(page.l, ry - 1, page.w, 0.5, 'F')
    }
    /* alternate shade */
    if (i % 2 === 0 && !row.sep) {
      setFill([10, 18, 30]); doc.rect(page.l, ry, page.w, rowH, 'F')
    }
    const lx = row.indent ? page.l + 10 : page.l + 4
    setColor(row.color || txt)
    setFont(row.bold ? 'bold' : 'normal', row.large ? 10 : 8.5)
    doc.text(row.label, lx, ry + 6)
    setFont(row.bold ? 'bold' : 'normal', row.large ? 11 : 8.5)
    doc.text(m(row.value), page.r, ry + 6, { align: 'right' })
  })

  y += rows.length * rowH + 10

  /* ── Section: Per-Unit Analysis ── */
  const colW = (page.w - 6) / 3

  setFill(panelB); setDraw(border)
  doc.roundedRect(page.l, y, page.w, 46, 3, 3, 'FD')

  setColor(gold); setFont('bold', 9)
  doc.text('PER-UNIT ANALYSIS', page.l + 6, y + 8)

  const unitBoxes = [
    { label: 'Landed Cost / Unit',     value: m(calc.landedPerUnit),   color: txt   },
    { label: 'Suggested Selling Price', value: m(calc.sellingPrice),    color: gold  },
    { label: 'Gross Profit / Unit',     value: m(calc.profitPerUnit),   color: calc.profitPerUnit >= 0 ? green : red },
    { label: 'Total Gross Profit',      value: m(calc.totalProfit),     color: calc.totalProfit  >= 0 ? green : red },
    { label: 'Markup Applied',          value: `${inputs.markup}%`,     color: blue  },
    { label: 'Effective Duty Rate',     value: pct(calc.effectiveDuty), color: sub   },
  ]

  unitBoxes.forEach((b, i) => {
    const bx = page.l + 3 + (i % 3) * (colW + 3)
    const by = y + 13 + Math.floor(i / 3) * 17
    setColor(sub); setFont('normal', 7)
    doc.text(b.label.toUpperCase(), bx, by)
    setColor(b.color); setFont('bold', 10)
    doc.text(b.value, bx, by + 7)
  })

  y += 56

  /* ── Section: Duty Rate Summary ── */
  if (y < 250) {
    setFill(panelB); setDraw(border)
    doc.roundedRect(page.l, y, page.w, 30, 3, 3, 'FD')
    setColor(gold); setFont('bold', 9)
    doc.text('DUTY RATE SUMMARY (for HS ' + (inputs.hsCode || '—') + ')', page.l + 6, y + 8)

    const dutyEntry = calc.dutyEntry
    if (dutyEntry) {
      const rateFields = [
        { l: 'General (MFN)',     v: `${dutyEntry.general}%`, c: dutyEntry.general > 20 ? red : green },
        { l: 'SADC Rate',         v: `${dutyEntry.sadc}%`,    c: green },
        { l: 'COMESA Rate',       v: `${dutyEntry.comesa}%`,  c: blue },
        { l: 'VAT Rate',          v: `${dutyEntry.vat}%`,     c: blue },
        dutyEntry.surtax ? { l: 'Surtax',  v: `${dutyEntry.surtax}%`, c: red } : null,
        dutyEntry.excise ? { l: 'Excise',  v: dutyEntry.excise,       c: [233,186,76] } : null,
      ].filter(Boolean)

      rateFields.forEach((f, i) => {
        const rx = page.l + 4 + (i % 6) * 30
        setColor(sub); setFont('normal', 7)
        doc.text(f.l, rx, y + 17)
        setColor(f.c || txt); setFont('bold', 9)
        doc.text(f.v, rx, y + 24)
      })
      if (dutyEntry.notes) {
        setColor(sub); setFont('italic', 7)
        doc.text('Note: ' + dutyEntry.notes.slice(0, 100), page.l + 4, y + 32, { maxWidth: page.w - 8 })
      }
    }
    y += 40
  }

  /* ── Footer ── */
  setFill(navy); doc.rect(0, 283, W, 14, 'F')
  setColor(sub); setFont('normal', 7.5)
  doc.text('LUNARAE CUSTOMS INTELLIGENCE PLATFORM · ZIMBABWE', page.l, 289)
  doc.text('Estimates only. Verify with ZIMRA for official assessments. SI 122 · SI 35/2024 · CBCA [Chapter 21:02]', page.l, 293)
  setColor(gold); setFont('bold', 8)
  doc.text('www.lunarae.co.zw', page.r, 291, { align: 'right' })

  /* save */
  const fname = `Lunarae_Import_Simulation_${(product.name || 'Report').replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.pdf`
  doc.save(fname)
}

/* ══════════════════════════════════════════════════════════ */
/*  Main Component                                            */
/* ══════════════════════════════════════════════════════════ */
export default function ImportCostSimulator({ onNavigate }) {
  /* ── Inputs ── */
  const [hsQuery,    setHsQuery]    = useState('')
  const [hsMatches,  setHsMatches]  = useState([])
  const [product,    setProduct]    = useState(null)
  const [quantity,   setQuantity]   = useState('')
  const [unitCost,   setUnitCost]   = useState('')
  const [freight,    setFreight]    = useState('')
  const [insMode,    setInsMode]    = useState('auto')  // auto | manual
  const [insManual,  setInsManual]  = useState('')
  const [origin,     setOrigin]     = useState('general')
  const [markup,     setMarkup]     = useState(30)
  const [agentFee,   setAgentFee]   = useState(100)
  const [borderFee,  setBorderFee]  = useState(50)
  const [docFee,     setDocFee]     = useState(30)
  const [inclLicence,setInclLicence]= useState(true)
  const [showAdv,    setShowAdv]    = useState(false)
  const [calculated, setCalculated] = useState(false)
  const resultsRef = useRef(null)

  /* ── HS search logic ── */
  function onHsChange(q) {
    setHsQuery(q)
    setProduct(null)
    setCalculated(false)
    setHsMatches(q.trim() ? searchHs(q) : [])
  }

  function selectProduct(item) {
    setProduct(item)
    setHsQuery(`${item.code} — ${item.desc}`)
    setHsMatches([])
    setCalculated(false)
  }

  /* ── Core calculation (memoised) ── */
  const calc = useMemo(() => {
    const qty  = parseFloat(quantity)  || 0
    const cost = parseFloat(unitCost)  || 0
    const frgt = parseFloat(freight)   || 0

    if (!qty || !cost || !product) return null

    const dutyEntry = findDutyEntry(product.code)
    const licence   = findLicence(product.code)

    const invoiceValue = cost * qty
    const insurance    = insMode === 'manual' ? (parseFloat(insManual) || 0) : invoiceValue * 0.005
    const cif          = invoiceValue + frgt + insurance

    const dutyRate  = origin === 'sadc' ? (dutyEntry?.sadc || 0) : origin === 'comesa' ? (dutyEntry?.comesa || 0) : (dutyEntry?.general || 0)
    const surtaxRate= dutyEntry?.surtax || 0
    const vatRate   = dutyEntry?.vat ?? 15
    const exciseRaw = dutyEntry?.excise || ''

    const importDuty = cif * dutyRate   / 100
    const surtax     = cif * surtaxRate / 100
    /* excise: parse if specific (e.g. "USD 0.0930 per litre") — skip for now, mark as 0 and note */
    const excise     = 0
    const vatBase    = cif + importDuty + surtax + excise
    const vat        = vatBase * vatRate / 100
    const zimdef     = cif * 0.01
    const aidsLevy   = importDuty * 0.03

    const clearingFees = parseFloat(agentFee) + parseFloat(borderFee) + parseFloat(docFee)
    const licenceCost  = (inclLicence && licence) ? estimateLicenceCost(licence) : 0

    const totalTaxes  = importDuty + surtax + excise + vat + zimdef + aidsLevy
    const totalLanded = invoiceValue + frgt + insurance + totalTaxes + clearingFees + licenceCost
    const landedPerUnit   = qty > 0 ? totalLanded / qty : 0
    const sellingPrice    = landedPerUnit * (1 + markup / 100)
    const profitPerUnit   = sellingPrice - landedPerUnit
    const totalProfit     = profitPerUnit * qty
    const effectiveDuty   = cif > 0 ? (totalTaxes / cif) * 100 : 0

    return {
      invoiceValue, freight: frgt, insurance, cif,
      dutyRate, surtaxRate, vatRate, excise,
      importDuty, surtax, vat, vatBase, zimdef, aidsLevy,
      clearingFees, licenceCost,
      totalTaxes, totalLanded,
      landedPerUnit, sellingPrice, profitPerUnit, totalProfit,
      effectiveDuty, dutyEntry, licence,
      exciseNote: exciseRaw,
    }
  }, [product, quantity, unitCost, freight, insMode, insManual, origin, markup, agentFee, borderFee, docFee, inclLicence])

  function estimateLicenceCost(lic) {
    if (!lic?.fee) return 0
    const m = lic.fee.match(/USD (\d[\d,]+)/)
    if (m) return parseInt(m[1].replace(/,/g, ''), 10) / 10 /* pro-rata per shipment */
    return 100
  }

  function handleCalculate() {
    if (!calc) return
    setCalculated(true)
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  function handlePDF() {
    if (!calc || !calculated) return
    generatePDF(
      { hsCode: product?.code, quantity, unitCost, freight, origin, markup, insMode, insManual },
      calc,
      product
    )
  }

  const canCalc = !!product && !!quantity && !!unitCost

  /* ── Render ── */
  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'DM Sans', -apple-system, sans-serif", color: C.text }}>

      {/* ── Header ── */}
      <div style={{ background: '#08111f', borderBottom: `1px solid ${C.border}`, padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Import Cost Simulator</div>
          <div style={{ fontSize: 12, color: C.muted }}>Predict total landed costs · Generate PDF report · Works offline</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ ...chip(C.green), fontSize: 11 }}>● Offline Ready</span>
          {onNavigate && (
            <button onClick={() => onNavigate('home')} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: C.sub, cursor: 'pointer' }}>
              ← Back
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '28px 32px', maxWidth: 1300, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 24, alignItems: 'start' }}>

          {/* ════════════════════════════════════════════════
              INPUT PANEL
          ════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Product search */}
            <div style={card}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.gold, marginBottom: 14 }}>Product</div>

              <label style={lbl}>Search Product or HS Code</label>
              <div style={{ position: 'relative' }}>
                <input
                  value={hsQuery}
                  onChange={e => onHsChange(e.target.value)}
                  placeholder="e.g. smartphone, 8703, cooking oil…"
                  style={{ ...inp, paddingLeft: 38 }}
                />
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15 }}>🔍</span>

                {hsMatches.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
                    background: '#0d1829', border: `1px solid ${C.border}`, borderRadius: 9,
                    maxHeight: 260, overflowY: 'auto', marginTop: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  }}>
                    {hsMatches.map(r => (
                      <div key={r.code} onClick={() => selectProduct(r)} style={{
                        padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${C.border}`,
                        display: 'flex', gap: 10, alignItems: 'center',
                        transition: 'background 0.12s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = '#1a2540'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ ...chip(C.gold), fontFamily: 'monospace', fontSize: 11, flexShrink: 0 }}>{r.code}</span>
                        <div>
                          <div style={{ fontSize: 13, color: C.text }}>{r.desc}</div>
                          <div style={{ fontSize: 11, color: C.muted }}>{r.chapterTitle}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {product && (
                <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(233,186,76,0.06)', border: `1px solid ${C.gold}33`, borderRadius: 8 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ ...chip(C.gold), fontFamily: 'monospace' }}>{product.code}</span>
                    {calc?.licence && <span style={{ ...chip(C.orange), fontSize: 10 }}>Licence Required</span>}
                  </div>
                  <div style={{ fontSize: 13, color: C.text }}>{product.desc}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{product.chapterTitle}</div>
                  {calc?.dutyEntry && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <span style={{ ...chip(C.blue), fontSize: 10 }}>Gen: {calc.dutyEntry.general}%</span>
                      <span style={{ ...chip(C.green), fontSize: 10 }}>SADC: {calc.dutyEntry.sadc}%</span>
                      <span style={{ ...chip(C.purple), fontSize: 10 }}>VAT: {calc.dutyEntry.vat}%</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Core inputs */}
            <div style={card}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.gold, marginBottom: 14 }}>Shipment Details</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={lbl}>Quantity (units)</label>
                  <input type="number" value={quantity} onChange={e => { setQuantity(e.target.value); setCalculated(false) }}
                    placeholder="e.g. 500" style={inp} min="1" />
                </div>
                <div>
                  <label style={lbl}>Unit Cost (USD)</label>
                  <input type="number" value={unitCost} onChange={e => { setUnitCost(e.target.value); setCalculated(false) }}
                    placeholder="e.g. 12.50" style={inp} min="0" step="0.01" />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={lbl}>Total Freight (USD)</label>
                <input type="number" value={freight} onChange={e => { setFreight(e.target.value); setCalculated(false) }}
                  placeholder="e.g. 800" style={inp} min="0" />
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Freight from origin to Zimbabwe border (CIF basis)</div>
              </div>

              {/* Insurance */}
              <div style={{ marginBottom: 4 }}>
                <label style={lbl}>Insurance</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['auto', 'manual'].map(mode => (
                    <button key={mode} onClick={() => { setInsMode(mode); setCalculated(false) }} style={{
                      flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      background: insMode === mode ? 'rgba(233,186,76,0.1)' : C.bg,
                      border: `1px solid ${insMode === mode ? C.gold : C.border}`,
                      color: insMode === mode ? C.gold : C.sub,
                    }}>
                      {mode === 'auto' ? 'Auto (0.5% of cost)' : 'Enter manually'}
                    </button>
                  ))}
                </div>
                {insMode === 'manual' && (
                  <input type="number" value={insManual} onChange={e => { setInsManual(e.target.value); setCalculated(false) }}
                    placeholder="Insurance amount (USD)" style={{ ...inp, marginTop: 8 }} min="0" />
                )}
              </div>
            </div>

            {/* Origin & Markup */}
            <div style={card}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.gold, marginBottom: 14 }}>Duty & Pricing</div>

              <label style={lbl}>Country of Origin</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {[
                  { id: 'general', label: 'General',  sub: 'MFN Rate',  icon: '🌍' },
                  { id: 'sadc',    label: 'SADC',     sub: 'With COO',  icon: '🌱' },
                  { id: 'comesa',  label: 'COMESA',   sub: 'With COO',  icon: '⭐' },
                ].map(o => (
                  <div key={o.id} onClick={() => { setOrigin(o.id); setCalculated(false) }} style={{
                    flex: 1, padding: '10px 8px', borderRadius: 9, cursor: 'pointer', textAlign: 'center',
                    background: origin === o.id ? 'rgba(233,186,76,0.08)' : C.bg,
                    border: `1px solid ${origin === o.id ? C.gold : C.border}`,
                    transition: 'all 0.15s',
                  }}>
                    <div style={{ fontSize: 16, marginBottom: 2 }}>{o.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: origin === o.id ? C.gold : C.text }}>{o.label}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{o.sub}</div>
                  </div>
                ))}
              </div>

              <label style={lbl}>Markup / Profit Margin</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {MARKUP_PRESETS.map(p => (
                  <button key={p.value} onClick={() => { setMarkup(p.value); setCalculated(false) }} style={{
                    padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    background: markup === p.value ? 'rgba(233,186,76,0.12)' : C.bg,
                    border: `1px solid ${markup === p.value ? C.gold : C.border}`,
                    color: markup === p.value ? C.gold : C.sub,
                  }}>{p.label}</button>
                ))}
                <input type="number" value={markup} onChange={e => { setMarkup(Number(e.target.value)); setCalculated(false) }}
                  style={{ ...inp, width: 70, padding: '6px 10px', fontSize: 12 }} min="0" max="500" />
              </div>
            </div>

            {/* Advanced: clearing costs */}
            <div style={card}>
              <button onClick={() => setShowAdv(v => !v)} style={{
                background: 'none', border: 'none', cursor: 'pointer', color: C.gold,
                fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, padding: 0, width: '100%', textAlign: 'left',
              }}>
                {showAdv ? '▼' : '▶'} Clearing & Licence Costs
              </button>

              {showAdv && (
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={lbl}>Agent Fee ($)</label>
                      <input type="number" value={agentFee} onChange={e => { setAgentFee(e.target.value); setCalculated(false) }}
                        style={inp} min="0" />
                    </div>
                    <div>
                      <label style={lbl}>Border Fee ($)</label>
                      <input type="number" value={borderFee} onChange={e => { setBorderFee(e.target.value); setCalculated(false) }}
                        style={inp} min="0" />
                    </div>
                    <div>
                      <label style={lbl}>Docs Fee ($)</label>
                      <input type="number" value={docFee} onChange={e => { setDocFee(e.target.value); setCalculated(false) }}
                        style={inp} min="0" />
                    </div>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: C.sub }}>
                    <input type="checkbox" checked={inclLicence} onChange={e => { setInclLicence(e.target.checked); setCalculated(false) }}
                      style={{ accentColor: C.gold, width: 16, height: 16 }} />
                    Include estimated import licence fee
                    {calc?.licence && <span style={{ ...chip(C.orange), fontSize: 10 }}>{calc.licence.name}</span>}
                  </label>

                  {calc?.exciseNote && (
                    <div style={{ fontSize: 11, color: C.orange, background: 'rgba(251,146,60,0.07)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: 7, padding: '6px 10px' }}>
                      ⚠ Excise duty applies: {calc.exciseNote}. Not included in calculation — add manually.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Calculate CTA */}
            <button
              onClick={handleCalculate}
              disabled={!canCalc}
              style={{
                background: canCalc ? 'linear-gradient(135deg,#e9ba4c,#c8921a)' : C.panel,
                border: canCalc ? 'none' : `1px solid ${C.border}`,
                borderRadius: 12, padding: '16px', fontSize: 15, fontWeight: 800,
                color: canCalc ? '#06090f' : C.muted, cursor: canCalc ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s', letterSpacing: '-0.01em',
              }}
            >
              {canCalc ? '📊 Calculate Import Costs' : 'Select product + enter details above'}
            </button>
          </div>

          {/* ════════════════════════════════════════════════
              RESULTS PANEL
          ════════════════════════════════════════════════ */}
          <div ref={resultsRef}>
            {!calculated ? (
              <EmptyState />
            ) : calc ? (
              <Results calc={calc} product={product} markup={markup} origin={origin} onPDF={handlePDF} />
            ) : null}
          </div>

        </div>
      </div>
    </div>
  )
}

/* ── Empty state ────────────────────────────────────────── */
function EmptyState() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '80px 32px', background: C.panel, border: `1px solid ${C.border}`,
      borderRadius: 16, textAlign: 'center', minHeight: 500,
    }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>📦</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 8 }}>
        Import Cost Simulator
      </div>
      <div style={{ fontSize: 14, color: C.sub, maxWidth: 380, lineHeight: 1.7, marginBottom: 24 }}>
        Enter your product, quantity, cost and freight on the left, then click Calculate to see the full landed cost breakdown.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 400, width: '100%' }}>
        {[
          { icon: '🔍', label: 'HS classification' },
          { icon: '📊', label: 'Duty & VAT rates' },
          { icon: '💰', label: 'Total landed cost' },
          { icon: '📄', label: 'PDF report' },
        ].map(f => (
          <div key={f.label} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{f.icon}</span>
            <span style={{ fontSize: 13, color: C.sub }}>{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Results ────────────────────────────────────────────── */
function Results({ calc, product, markup, origin, onPDF }) {
  const profitOk = calc.totalProfit >= 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Top KPI row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(160px, 100%), 1fr))', gap: 12 }}>
        {[
          { label: 'Total Landed Cost',    value: m(calc.totalLanded),    accent: C.gold,   icon: '🏁' },
          { label: 'Landed Cost / Unit',   value: m(calc.landedPerUnit),  accent: C.blue,   icon: '📦' },
          { label: 'Sell Price / Unit',    value: m(calc.sellingPrice),   accent: C.green,  icon: '🏷' },
          { label: 'Total Gross Profit',   value: m(calc.totalProfit),    accent: profitOk ? C.green : C.red, icon: profitOk ? '📈' : '📉' },
        ].map(k => (
          <div key={k.label} style={{ ...card, textAlign: 'center' }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{k.icon}</div>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: k.accent, letterSpacing: '-0.02em' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ── Cost breakdown table ── */}
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.gold, marginBottom: 16 }}>Detailed Cost Breakdown</div>

        <CostTable rows={[
          { group: 'Shipment Value',    rows: [
            { label: 'Invoice Value (Cost × Qty)',  value: calc.invoiceValue, color: C.text },
            { label: 'International Freight',        value: calc.freight,      color: C.text },
            { label: 'Insurance (0.5% est.)',        value: calc.insurance,    color: C.sub, small: true },
            { label: 'CIF Value',                    value: calc.cif,          color: C.gold, bold: true },
          ]},
          { group: 'Customs Charges',  rows: [
            { label: `Import Duty (${pct(calc.dutyRate)} — ${origin.toUpperCase()})`, value: calc.importDuty, color: C.red },
            ...(calc.surtax > 0 ? [{ label: `Surtax (${pct(calc.surtaxRate)})`, value: calc.surtax, color: C.red }] : []),
            ...(calc.excise > 0 ? [{ label: 'Excise Duty', value: calc.excise, color: C.red }]   : []),
          ]},
          { group: 'Tax',              rows: [
            { label: `VAT (${pct(calc.vatRate)} on ${m(calc.vatBase)})`, value: calc.vat, color: C.blue },
          ]},
          { group: 'Levies',           rows: [
            { label: 'ZIMDEF Levy (1% of CIF)',     value: calc.zimdef,    color: C.sub, small: true },
            { label: 'AIDS Levy (3% of duty)',       value: calc.aidsLevy, color: C.sub, small: true },
          ]},
          { group: 'Operational Costs', rows: [
            { label: 'Clearing / Agent Fees',        value: calc.clearingFees, color: C.sub, small: true },
            ...(calc.licenceCost > 0 ? [{ label: 'Import Licence (est.)',   value: calc.licenceCost, color: C.sub, small: true }] : []),
          ]},
          { group: '',                  rows: [
            { label: 'TOTAL LANDED COST',            value: calc.totalLanded, color: C.green, bold: true, large: true, sep: true },
          ]},
        ]} />
      </div>

      {/* ── Pricing analysis ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.gold, marginBottom: 14 }}>Per-Unit Analysis</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Landed Cost / unit',       value: m(calc.landedPerUnit),  color: C.text },
              { label: `Markup (${markup}%)`,        value: m(calc.sellingPrice - calc.landedPerUnit), color: C.blue },
              { label: 'Suggested Selling Price',   value: m(calc.sellingPrice),   color: C.gold, bold: true },
              { label: 'Gross Profit / unit',       value: m(calc.profitPerUnit),  color: profitOk ? C.green : C.red, bold: true },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: C.bg, borderRadius: 7 }}>
                <span style={{ fontSize: 13, color: C.sub }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: row.bold ? 700 : 600, color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.gold, marginBottom: 14 }}>Duty Rate Summary</div>
          {calc.dutyEntry ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[
                  { label: 'General',  value: calc.dutyEntry.general + '%', color: calc.dutyEntry.general > 20 ? C.red : C.green },
                  { label: 'SADC',     value: calc.dutyEntry.sadc + '%',    color: C.green },
                  { label: 'COMESA',   value: calc.dutyEntry.comesa + '%',  color: C.purple },
                ].map(d => (
                  <div key={d.label} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: C.muted }}>{d.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: d.color }}>{d.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ ...chip(C.blue), fontSize: 10 }}>VAT {calc.dutyEntry.vat}%</span>
                {calc.dutyEntry.surtax && <span style={{ ...chip(C.red), fontSize: 10 }}>Surtax {calc.dutyEntry.surtax}%</span>}
                {calc.dutyEntry.excise && <span style={{ ...chip(C.orange), fontSize: 10 }}>Excise: {calc.dutyEntry.excise}</span>}
              </div>
              {calc.dutyEntry.notes && (
                <div style={{ fontSize: 11, color: C.sub, marginTop: 10, lineHeight: 1.6 }}>{calc.dutyEntry.notes}</div>
              )}
            </>
          ) : (
            <div style={{ color: C.muted, fontSize: 13 }}>No specific rate data — default rates may apply.</div>
          )}

          <div style={{ marginTop: 14, padding: '8px 12px', background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, color: C.muted }}>Effective Tax Rate on CIF</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.gold }}>{pct(calc.effectiveDuty)}</div>
          </div>
        </div>
      </div>

      {/* ── Licence warning ── */}
      {calc.licence && (
        <div style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.25)', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.orange, marginBottom: 4 }}>Import Licence Required — {calc.licence.name}</div>
            <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.6 }}>
              Authority: <strong style={{ color: C.text }}>{calc.licence.authority}</strong> ·
              Licence Type: <strong style={{ color: C.text }}>{calc.licence.licenceType}</strong> ·
              Fee: <strong style={{ color: C.text }}>{calc.licence.fee}</strong>
            </div>
          </div>
        </div>
      )}

      {/* ── PDF button ── */}
      <button onClick={onPDF} style={{
        background: 'linear-gradient(135deg,#e9ba4c,#c8921a)',
        border: 'none', borderRadius: 12, padding: '16px 24px',
        fontSize: 15, fontWeight: 800, color: '#06090f', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        letterSpacing: '-0.01em',
      }}>
        <span style={{ fontSize: 20 }}>📄</span>
        Download PDF Report
      </button>

      <div style={{ fontSize: 11, color: C.muted, textAlign: 'center', lineHeight: 1.6 }}>
        Estimates based on SI 122 · SI 35 of 2024 · CBCA [Chapter 21:02] · Verify with ZIMRA for official assessment.
      </div>
    </div>
  )
}

/* ── Cost table component ───────────────────────────────── */
function CostTable({ rows }) {
  return (
    <div>
      {rows.map((section, si) => (
        <div key={si}>
          {section.group && (
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 0 4px', borderTop: si > 0 ? `1px solid ${C.border}` : 'none' }}>
              {section.group}
            </div>
          )}
          {section.rows.map((row, ri) => (
            <div key={ri} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: row.large ? '12px 12px' : '7px 12px',
              background: row.sep ? 'rgba(74,222,128,0.06)' : ri % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
              borderRadius: 7,
              borderTop: row.sep ? `1px solid ${C.border}` : 'none',
              marginTop: row.sep ? 6 : 0,
            }}>
              <span style={{ fontSize: row.small ? 12 : 13, color: row.bold ? C.text : C.sub, fontWeight: row.bold ? 700 : 400 }}>
                {row.label}
              </span>
              <span style={{ fontSize: row.large ? 18 : row.small ? 12 : 13, fontWeight: row.bold ? 800 : 600, color: row.color || C.text, fontVariantNumeric: 'tabular-nums' }}>
                {m(row.value)}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
