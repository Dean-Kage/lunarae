import { useState, useRef, useEffect, useMemo } from 'react'
import {
  Search, Calculator, Shield, FileCheck, Bot,
  ChevronRight, Zap, TrendingUp, BookOpen, AlertTriangle,
  Send, RotateCcw, ExternalLink, Sparkles,
} from 'lucide-react'
import hsData      from '../data/customs/hsCodes.json'
import dutyData    from '../data/customs/dutyRates.json'
import cbcaData    from '../data/customs/cbca.json'
import licenceData from '../data/customs/importLicences.json'
import kbData      from '../data/customs/knowledgeBase.json'

/* ── Tabs ─────────────────────────────────────────────────── */
const TABS = [
  { id: 'hs',      label: 'HS Search',       Icon: Search      },
  { id: 'duty',    label: 'Duty Estimator',  Icon: Calculator  },
  { id: 'cbca',    label: 'CBCA Checker',    Icon: Shield      },
  { id: 'licence', label: 'Import Licences', Icon: FileCheck   },
  { id: 'chat',    label: 'Customs AI',      Icon: Bot         },
]

const QUICK_ACTIONS = [
  { id: 'hs',      label: 'HS Code Search',  Icon: Search,     desc: 'Find the right HS code for any product',          color: '#60a5fa' },
  { id: 'duty',    label: 'Duty Estimator',  Icon: Calculator, desc: 'Calculate total import costs & duties',           color: '#e9ba4c' },
  { id: 'cbca',    label: 'CBCA Checker',    Icon: Shield,     desc: 'Cross-Border Controls Act compliance reference',  color: '#4ade80' },
  { id: 'licence', label: 'Import Licences', Icon: FileCheck,  desc: 'Check licence requirements by goods category',   color: '#a78bfa' },
  { id: 'chat',    label: 'Ask Customs AI',  Icon: Bot,        desc: 'Get instant answers on Zimbabwe customs rules',   color: '#f472b6' },
]

/* ── Colour palette ───────────────────────────────────────── */
const C = {
  bg:     '#06090f',
  panel:  'rgba(10,18,32,0.85)',
  border: 'rgba(30,58,95,0.55)',
  gold:   '#e9ba4c',
  blue:   '#60a5fa',
  green:  '#4ade80',
  red:    '#f87171',
  muted:  '#45607a',
  text:   '#eef2f7',
  sub:    '#8fa3bd',
}

/* ── Shared styles ────────────────────────────────────────── */
const card    = { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }
const inp     = { background: 'rgba(6,9,15,0.7)', border: `1px solid ${C.border}`, borderRadius: 9, padding: '10px 14px', fontSize: 14, color: C.text, outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s', fontFamily: 'inherit' }
const chip    = (color) => ({ background: color + '22', border: `1px solid ${color}44`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700, color, display: 'inline-block', letterSpacing: '0.03em' })
const btnGold = { background: 'linear-gradient(135deg,#e9ba4c,#c8921a)', border: 'none', borderRadius: 9, padding: '10px 22px', fontSize: 13, fontWeight: 700, color: '#06090f', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }
const btnSec  = { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 9, padding: '9px 18px', fontSize: 13, fontWeight: 600, color: C.sub, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }

/* ── Shared helpers ──────────────────────────────────────── */
function SectionHead({ title, desc }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: C.sub }}>{desc}</div>
    </div>
  )
}

function Label({ children }) {
  return (
    <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{children}</div>
  )
}

/* ══════════════════════════════════════════════════════════ */
/*  1. HS CODE SEARCH                                         */
/* ══════════════════════════════════════════════════════════ */
function HsSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)

  function search(q) {
    setQuery(q)
    setSelected(null)
    if (!q.trim()) { setResults([]); return }
    const lq = q.toLowerCase()
    const matches = []
    const hintCodes = new Set()
    hsData.searchHints.forEach(h => {
      if (h.keyword.includes(lq) || lq.includes(h.keyword)) h.codes.forEach(c => hintCodes.add(c))
    })
    hsData.chapters.forEach(ch => {
      ch.sections.forEach(sec => {
        const inHint    = hintCodes.has(sec.code)
        const inCode    = sec.code.includes(q)
        const inDesc    = sec.desc.toLowerCase().includes(lq)
        const inChapter = ch.title.toLowerCase().includes(lq)
        if (inHint || inCode || inDesc || inChapter) {
          matches.push({ ...sec, chapter: ch.chapter, chapterTitle: ch.title, priority: inHint ? 0 : inCode ? 1 : 2 })
        }
      })
    })
    matches.sort((a, b) => a.priority - b.priority)
    setResults(matches.slice(0, 30))
  }

  function selectCode(item) {
    const dutyEntry = dutyData.rates.find(r => {
      const codes = r.code.split('-')
      if (codes.length === 2) return item.code >= codes[0].slice(0, 4) && item.code <= codes[1].slice(0, 4)
      return r.code.startsWith(item.code.slice(0, 4)) || item.code.startsWith(r.code.slice(0, 4))
    })
    setSelected({ ...item, dutyEntry })
  }

  return (
    <div>
      <SectionHead title="HS Code Search" desc="Zimbabwe Tariff Schedule (HS 2022) — search by product name or code" />

      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
        <input
          value={query}
          onChange={e => search(e.target.value)}
          placeholder="Search: phone, maize, clothing, 8703, cosmetics…"
          style={{ ...inp, paddingLeft: 44, padding: '12px 14px 12px 44px' }}
          autoFocus
        />
      </div>

      {results.length === 0 && !query && (
        <div style={card}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Quick Examples</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['smartphone', 'cooking oil', 'clothing', 'rice', 'solar panel', 'car', 'medicine', 'beer', 'fertiliser', 'cable'].map(ex => (
              <button key={ex} onClick={() => search(ex)} style={{
                background: C.blue + '22', border: `1px solid ${C.blue}44`,
                borderRadius: 20, padding: '6px 14px', fontSize: 12, color: C.blue,
                cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
              }}>{ex}</button>
            ))}
          </div>
        </div>
      )}

      {results.length === 0 && query && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: C.muted, fontSize: 14 }}>No results for "{query}"</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 16 }}>
        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {results.map(r => (
              <div
                key={r.code + r.chapter}
                onClick={() => selectCode(r)}
                style={{
                  ...card, cursor: 'pointer', padding: '12px 16px',
                  border: `1px solid ${selected?.code === r.code ? 'rgba(233,186,76,0.4)' : C.border}`,
                  background: selected?.code === r.code ? 'rgba(20,35,65,0.9)' : C.panel,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (selected?.code !== r.code) e.currentTarget.style.borderColor = 'rgba(30,58,95,0.9)' }}
                onMouseLeave={e => { if (selected?.code !== r.code) e.currentTarget.style.borderColor = C.border }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ ...chip(C.gold), fontSize: 12, fontFamily: 'monospace' }}>{r.code}</span>
                  <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{r.desc}</span>
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Chapter {r.chapter} — {r.chapterTitle}</div>
              </div>
            ))}
          </div>
        )}

        {selected && (
          <div style={{ ...card, border: `1px solid rgba(233,186,76,0.3)` }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Selected Code</div>
            <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 800, color: C.gold, marginBottom: 4 }}>{selected.code}</div>
            <div style={{ fontSize: 14, color: C.text, marginBottom: 4 }}>{selected.desc}</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>Chapter {selected.chapter} — {selected.chapterTitle}</div>

            {selected.dutyEntry ? (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Duty Rates</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                  {[
                    { label: 'General (MFN)', value: selected.dutyEntry.general + '%', color: selected.dutyEntry.general > 20 ? C.red : C.green },
                    { label: 'SADC',          value: selected.dutyEntry.sadc + '%',    color: C.green },
                    { label: 'COMESA',         value: selected.dutyEntry.comesa + '%', color: C.blue },
                  ].map(d => (
                    <div key={d.label} style={{ background: 'rgba(6,9,15,0.7)', border: `1px solid ${C.border}`, borderRadius: 9, padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{d.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: d.color }}>{d.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  <span style={chip(C.blue)}>VAT {selected.dutyEntry.vat}%</span>
                  {selected.dutyEntry.excise && <span style={chip(C.gold)}>Excise: {selected.dutyEntry.excise}</span>}
                  {selected.dutyEntry.surtax && <span style={chip(C.red)}>Surtax {selected.dutyEntry.surtax}%</span>}
                </div>
                {selected.dutyEntry.notes && (
                  <div style={{ fontSize: 12, color: C.sub, background: 'rgba(6,9,15,0.7)', borderRadius: 8, padding: '10px 14px', border: `1px solid ${C.border}`, lineHeight: 1.6 }}>
                    {selected.dutyEntry.notes}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6 }}>Duty rates not available for this heading. Use the Duty Estimator tab for full calculations.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════ */
/*  2. DUTY ESTIMATOR                                         */
/* ══════════════════════════════════════════════════════════ */
function DutyEstimator() {
  const [hsSearch,  setHsSearch]  = useState('')
  const [hsCode,    setHsCode]    = useState('')
  const [hsDesc,    setHsDesc]    = useState('')
  const [dutyEntry, setDutyEntry] = useState(null)
  const [cifValue,  setCifValue]  = useState('')
  const [origin,    setOrigin]    = useState('general')
  const [result,    setResult]    = useState(null)
  const [hsMatches, setHsMatches] = useState([])

  function searchHs(q) {
    setHsSearch(q); setResult(null)
    if (!q.trim()) { setHsMatches([]); return }
    const lq = q.toLowerCase()
    const hints = new Set()
    hsData.searchHints.forEach(h => { if (h.keyword.includes(lq) || lq.includes(h.keyword)) h.codes.forEach(c => hints.add(c)) })
    const m = []
    hsData.chapters.forEach(ch => ch.sections.forEach(sec => {
      if (hints.has(sec.code) || sec.code.includes(q) || sec.desc.toLowerCase().includes(lq)) {
        const de = dutyData.rates.find(r => {
          const parts = r.code.split('-')
          if (parts.length === 2) return sec.code >= parts[0].slice(0,4) && sec.code <= parts[1].slice(0,4)
          return r.code.startsWith(sec.code.slice(0,4)) || sec.code.startsWith(r.code.slice(0,4))
        })
        m.push({ ...sec, dutyEntry: de })
      }
    }))
    setHsMatches(m.slice(0, 15))
  }

  function selectHs(item) {
    setHsCode(item.code); setHsDesc(item.desc)
    setDutyEntry(item.dutyEntry); setHsMatches([]); setHsSearch(''); setResult(null)
  }

  function calculate() {
    if (!cifValue || !dutyEntry) return
    const cif      = parseFloat(cifValue)
    const rate     = origin === 'sadc' ? dutyEntry.sadc : origin === 'comesa' ? dutyEntry.comesa : dutyEntry.general
    const surtax   = dutyEntry.surtax || 0
    const vatRate  = dutyEntry.vat || 0
    const importDuty = cif * rate / 100
    const surtaxAmt  = cif * surtax / 100
    const vatBase    = cif + importDuty + surtaxAmt
    const vatAmt     = vatBase * vatRate / 100
    const zimdef     = cif * 0.01
    const aidsLevy   = importDuty * 0.03
    const total      = importDuty + surtaxAmt + vatAmt + zimdef + aidsLevy
    setResult({ cif, rate, surtax, surtaxAmt, importDuty, vatBase, vatAmt, vatRate, zimdef, aidsLevy, total, grandTotal: cif + total })
  }

  const mv = (n) => `$${n.toFixed(2)}`

  return (
    <div>
      <SectionHead title="Duty Estimator" desc="Calculate total import costs — duty, surtax, VAT, and all levies" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <Label>Product / HS Code</Label>
            <div style={{ position: 'relative' }}>
              <input value={hsSearch || hsCode} onChange={e => searchHs(e.target.value)}
                onFocus={() => { if (hsCode) { setHsSearch(hsCode); setHsCode(''); setDutyEntry(null) } }}
                placeholder="Search product or type HS code…" style={inp} />
              {hsMatches.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: '#0d1829', border: `1px solid ${C.border}`, borderRadius: 9, maxHeight: 240, overflowY: 'auto', marginTop: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                  {hsMatches.map(m => (
                    <div key={m.code} onClick={() => selectHs(m)} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 10, alignItems: 'center' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(30,58,95,0.4)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={chip(C.gold)}>{m.code}</span>
                      <span style={{ fontSize: 13, color: C.text }}>{m.desc}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {hsCode && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={chip(C.gold)}>{hsCode}</span>
                <span style={{ fontSize: 12, color: C.sub }}>{hsDesc}</span>
              </div>
            )}
          </div>

          <div>
            <Label>CIF Value (USD)</Label>
            <input type="number" value={cifValue} onChange={e => { setCifValue(e.target.value); setResult(null) }}
              placeholder="e.g. 5000" style={inp} min="0" />
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Cost + Insurance + Freight to Zimbabwe border</div>
          </div>

          <div>
            <Label>Country of Origin</Label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { id: 'general', label: 'General (MFN)', sub: 'Non-SADC/COMESA' },
                { id: 'sadc',    label: 'SADC',          sub: 'With COO' },
                { id: 'comesa',  label: 'COMESA',        sub: 'With COO' },
              ].map(o => (
                <div key={o.id} onClick={() => { setOrigin(o.id); setResult(null) }} style={{
                  flex: 1, padding: '10px 12px', borderRadius: 9, cursor: 'pointer', textAlign: 'center',
                  background: origin === o.id ? 'rgba(233,186,76,0.08)' : 'rgba(6,9,15,0.6)',
                  border: `1px solid ${origin === o.id ? C.gold : C.border}`,
                  transition: 'all 0.15s',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: origin === o.id ? C.gold : C.text }}>{o.label}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{o.sub}</div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={calculate} disabled={!cifValue || !dutyEntry}
            style={{ ...btnGold, opacity: (!cifValue || !dutyEntry) ? 0.4 : 1, justifyContent: 'center' }}>
            <Calculator size={14} /> Calculate Duties
          </button>
        </div>

        <div>
          {!result && !dutyEntry && (
            <div style={card}>
              <div style={{ fontWeight: 700, color: C.gold, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} /> How it works
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Search for your product', 'Enter the CIF value in USD', 'Select country of origin', 'Click Calculate'].map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: C.sub }}>
                    <span style={{ ...chip(C.gold), fontSize: 10, minWidth: 20, textAlign: 'center', flexShrink: 0 }}>{i + 1}</span>
                    {s}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, padding: '8px 12px', background: 'rgba(6,9,15,0.7)', borderRadius: 8, fontSize: 11, color: C.muted, border: `1px solid ${C.border}` }}>
                Formula: Duty = CIF × Rate | VAT = (CIF + Duty) × 15% | ZIMDEF = CIF × 1%
              </div>
            </div>
          )}

          {dutyEntry && !result && (
            <div style={card}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Applicable Rates</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { l: 'General', v: dutyEntry.general + '%', c: dutyEntry.general > 20 ? C.red : C.green },
                  { l: 'SADC',    v: dutyEntry.sadc + '%',    c: C.green },
                  { l: 'COMESA',  v: dutyEntry.comesa + '%',  c: C.blue },
                ].map(d => (
                  <div key={d.l} style={{ background: 'rgba(6,9,15,0.7)', borderRadius: 9, padding: '10px', textAlign: 'center', border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{d.l}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: d.c }}>{d.v}</div>
                  </div>
                ))}
              </div>
              {dutyEntry.notes && <div style={{ fontSize: 12, color: C.sub, marginTop: 10, lineHeight: 1.6 }}>{dutyEntry.notes}</div>}
            </div>
          )}

          {result && (
            <div style={{ ...card, border: `1px solid rgba(233,186,76,0.3)` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 14 }}>
                Cost Breakdown for <span style={{ color: C.gold }}>${result.cif.toFixed(2)}</span> CIF
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'CIF Value',               value: result.cif,        color: C.text, main: true },
                  { label: `Import Duty (${result.rate}%)`,   value: result.importDuty, color: C.red },
                  result.surtax ? { label: `Surtax (${result.surtax}%)`, value: result.surtaxAmt, color: C.red } : null,
                  { label: `VAT (${result.vatRate}%)`, value: result.vatAmt,     color: C.blue },
                  { label: 'ZIMDEF Levy (1%)',         value: result.zimdef,     color: C.muted },
                  { label: 'AIDS Levy (3% of duty)',   value: result.aidsLevy,   color: C.muted },
                ].filter(Boolean).map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'rgba(6,9,15,0.6)', borderRadius: 7, border: row.main ? `1px solid ${C.border}` : '1px solid transparent' }}>
                    <span style={{ fontSize: 13, color: row.main ? C.text : C.sub }}>{row.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: row.color }}>{mv(row.value)}</span>
                  </div>
                ))}
                <div style={{ height: 1, background: C.border, margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(233,186,76,0.08)', borderRadius: 9, border: `1px solid rgba(233,186,76,0.25)` }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Total Taxes & Levies</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: C.gold }}>{mv(result.total)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(74,222,128,0.06)', borderRadius: 9, border: `1px solid rgba(74,222,128,0.2)` }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Grand Total (CIF + All Duties)</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: C.green }}>{mv(result.grandTotal)}</span>
                </div>
              </div>
              <div style={{ marginTop: 12, fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
                * Excise duty not included — check separately for alcohol, tobacco, fuel.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════ */
/*  3. CBCA CHECKER                                           */
/* ══════════════════════════════════════════════════════════ */
function CbcaChecker() {
  const [activeSection, setActiveSection] = useState('requirements')

  const sections = [
    { id: 'requirements', label: 'Requirements' },
    { id: 'prohibited',   label: 'Prohibited' },
    { id: 'restricted',   label: 'Restricted' },
    { id: 'ports',        label: 'Ports of Entry' },
    { id: 'penalties',    label: 'Penalties' },
  ]

  return (
    <div>
      <SectionHead title="CBCA Checker" desc="Cross-Border Controls Act [Chapter 21:02] — Compliance Reference" />

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
            ...btnSec,
            borderColor: activeSection === s.id ? C.gold : C.border,
            color: activeSection === s.id ? C.gold : C.sub,
            background: activeSection === s.id ? 'rgba(233,186,76,0.08)' : C.panel,
          }}>{s.label}</button>
        ))}
      </div>

      {activeSection === 'requirements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {cbcaData.requirements.map(req => (
            <div key={req.category} style={card}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.gold, marginBottom: 12 }}>{req.category}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {req.requirements.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, fontSize: 13, color: C.sub }}>
                    <span style={{ color: C.green, flexShrink: 0, fontWeight: 700 }}>✓</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSection === 'prohibited' && (
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.red, marginBottom: 14 }}>
            Prohibited Goods — Cannot be imported under any circumstances
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cbcaData.prohibitedGoods.map((g, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', background: 'rgba(248,113,113,0.06)', borderRadius: 9, border: '1px solid rgba(248,113,113,0.15)' }}>
                <AlertTriangle size={14} color={C.red} style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: C.sub }}>{g}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === 'restricted' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 13, color: C.sub, marginBottom: 8, lineHeight: 1.6 }}>
            Restricted goods require a licence or permit from the specified authority before importation.
          </div>
          {cbcaData.restrictedGoods.map((g, i) => (
            <div key={i} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <AlertTriangle size={14} color={C.gold} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: C.text }}>{g.good}</span>
              </div>
              <span style={{ ...chip(C.blue), fontSize: 11, textAlign: 'right', flexShrink: 0 }}>{g.authority}</span>
            </div>
          ))}
        </div>
      )}

      {activeSection === 'ports' && (
        <div>
          <div style={{ fontSize: 13, color: C.sub, marginBottom: 12, lineHeight: 1.6 }}>All commercial goods must enter through a designated Port of Entry.</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: 12 }}>
            {cbcaData.portOfEntry.ports.map(p => (
              <div key={p.name} style={card}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 8 }}>{p.name}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={chip(C.blue)}>{p.type}</span>
                  <span style={chip(C.gold)}>{p.direction}</span>
                  <span style={{ fontSize: 11, color: C.muted }}>{p.province}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === 'penalties' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cbcaData.penalties.map((p, i) => (
            <div key={i} style={{ ...card, borderColor: 'rgba(248,113,113,0.2)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.red, marginBottom: 6 }}>{p.offence}</div>
              <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6 }}>{p.penalty}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════ */
/*  4. IMPORT LICENCE CHECKER                                 */
/* ══════════════════════════════════════════════════════════ */
function LicenceChecker() {
  const [query, setQuery]       = useState('')
  const [selected, setSelected] = useState(null)

  const filtered = useMemo(() => {
    if (!query.trim()) return licenceData.categories
    const lq = query.toLowerCase()
    return licenceData.categories.filter(c =>
      c.name.toLowerCase().includes(lq) ||
      c.goods.some(g => g.toLowerCase().includes(lq)) ||
      c.authority.toLowerCase().includes(lq) ||
      c.hsCodes.some(h => h.includes(lq))
    )
  }, [query])

  return (
    <div>
      <SectionHead title="Import Licence Checker" desc="Check which authority issues licences for your goods and what the process requires" />

      <input value={query} onChange={e => { setQuery(e.target.value); setSelected(null) }}
        placeholder="Search: medicine, fuel, tobacco, vehicle, electronics…"
        style={{ ...inp, marginBottom: 16 }} />

      <div style={{ display: 'grid', gridTemplateColumns: selected ? 'min(320px, 100%) 1fr' : 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(cat => (
            <div key={cat.id} onClick={() => setSelected(selected?.id === cat.id ? null : cat)} style={{
              ...card, cursor: 'pointer',
              border: `1px solid ${selected?.id === cat.id ? 'rgba(233,186,76,0.4)' : C.border}`,
              background: selected?.id === cat.id ? 'rgba(20,35,65,0.9)' : C.panel,
              transition: 'all 0.15s',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: selected?.id === cat.id ? C.gold : C.text, marginBottom: 4 }}>{cat.name}</div>
              <div style={{ fontSize: 11, color: C.sub, marginBottom: 8 }}>{cat.authority}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {cat.goods.slice(0, 3).map(g => <span key={g} style={{ ...chip(C.blue), fontSize: 10 }}>{g}</span>)}
                {cat.goods.length > 3 && <span style={{ fontSize: 11, color: C.muted }}>+{cat.goods.length - 3} more</span>}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ color: C.muted, fontSize: 14, textAlign: 'center', padding: 32 }}>No categories match "{query}"</div>
          )}
        </div>

        {selected && (
          <div style={{ ...card, border: `1px solid rgba(233,186,76,0.3)`, height: 'fit-content' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.gold, marginBottom: 4 }}>{selected.name}</div>
            <div style={{ fontSize: 12, color: C.sub, marginBottom: 16 }}>Licence Type: <span style={{ color: C.text }}>{selected.licenceType}</span></div>

            <div style={{ marginBottom: 14 }}>
              <Label>Issuing Authority</Label>
              <span style={chip(C.green)}>{selected.authority}</span>
            </div>

            <div style={{ marginBottom: 14 }}>
              <Label>Goods Covered</Label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {selected.goods.map((g, i) => (
                  <div key={i} style={{ fontSize: 13, color: C.sub, display: 'flex', gap: 8 }}>
                    <span style={{ color: C.gold }}>•</span> {g}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <Label>Application Process</Label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {selected.process.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, fontSize: 13, color: C.sub }}>
                    <span style={{ ...chip(C.gold), fontSize: 10, minWidth: 20, textAlign: 'center', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ lineHeight: 1.5 }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <Label>Typical Fee</Label>
                <span style={chip(C.green)}>{selected.fee}</span>
              </div>
              <div>
                <Label>HS Codes</Label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {selected.hsCodes.map(h => <span key={h} style={{ ...chip(C.gold), fontFamily: 'monospace', fontSize: 10 }}>{h}</span>)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════ */
/*  5. CUSTOMS AI CHAT                                        */
/* ══════════════════════════════════════════════════════════ */
const SUGGESTED = [
  'How do I calculate import duty?',
  'What is SI 35 of 2024?',
  'Are solar panels duty-free?',
  'What documents do I need to import goods?',
  'What is CBCA?',
  'How do I get an import licence for medicine?',
  'What is the duty on motor cars from South Africa?',
  'What is SADC Certificate of Origin?',
  'How are customs values calculated?',
  'What excise duty applies to beer?',
]

function buildAnswer(q) {
  const lq = q.toLowerCase()
  for (const topic of kbData.topics) {
    if (topic.keywords.some(k => lq.includes(k))) {
      return { title: topic.title, body: topic.content, source: kbData.sources.join(' · ') }
    }
  }
  const faqMatch = kbData.faq.find(f =>
    f.q.toLowerCase().split(' ').filter(w => w.length > 3).some(w => lq.includes(w))
  )
  if (faqMatch) return { title: faqMatch.q, body: faqMatch.a, source: 'Zimbabwe Customs FAQ' }

  const codeMatch = q.match(/\b(\d{4})\b/)
  if (codeMatch) {
    const code = codeMatch[1]
    const dutyEntry = dutyData.rates.find(r => {
      const parts = r.code.split('-')
      if (parts.length === 2) return code >= parts[0].slice(0,4) && code <= parts[1].slice(0,4)
      return r.code.startsWith(code) || code.startsWith(r.code.slice(0,4))
    })
    if (dutyEntry) {
      return {
        title: `HS ${code} — ${dutyEntry.description}`,
        body: `General (MFN) Rate: ${dutyEntry.general}%\nSADC Rate: ${dutyEntry.sadc}%\nCOMESA Rate: ${dutyEntry.comesa}%\nVAT: ${dutyEntry.vat}%${dutyEntry.excise ? `\nExcise: ${dutyEntry.excise}` : ''}${dutyEntry.surtax ? `\nSurtax: ${dutyEntry.surtax}%` : ''}\n\n${dutyEntry.notes || ''}`,
        source: 'Zimbabwe Tariff Schedule — SI 122 as amended by SI 35 of 2024',
      }
    }
  }

  for (const cat of licenceData.categories) {
    const inName  = cat.name.toLowerCase().split(' ').some(w => w.length > 3 && lq.includes(w))
    const inGoods = cat.goods.some(g => g.toLowerCase().split(' ').some(w => w.length > 4 && lq.includes(w)))
    if (inName || inGoods) {
      return {
        title: `Import Licence — ${cat.name}`,
        body: `Authority: ${cat.authority}\nLicence Type: ${cat.licenceType}\nFee: ${cat.fee}\n\nGoods covered:\n${cat.goods.map(g => `• ${g}`).join('\n')}\n\nProcess:\n${cat.process.map((s, i) => `${i+1}. ${s}`).join('\n')}`,
        source: 'Import Licence Requirements — SI 122 / Control of Goods Act',
      }
    }
  }

  if (lq.includes('border') || lq.includes('port') || lq.includes('cbca') || lq.includes('cross border')) {
    return {
      title: 'Cross-Border Controls Act (CBCA)',
      body: cbcaData.overview + '\n\nPorts of Entry:\n' + cbcaData.portOfEntry.ports.map(p => `• ${p.name} (${p.type}) — ${p.direction}`).join('\n'),
      source: 'CBCA [Chapter 21:02]',
    }
  }
  if (lq.includes('prohibited') || lq.includes('illegal') || lq.includes('ban')) {
    return { title: 'Prohibited Goods — Zimbabwe', body: cbcaData.prohibitedGoods.map(g => `⛔ ${g}`).join('\n'), source: 'CBCA [Chapter 21:02] — Prohibited Goods' }
  }
  if (lq.includes('penalt') || lq.includes('fine') || lq.includes('smuggl')) {
    return { title: 'Customs Penalties', body: cbcaData.penalties.map(p => `${p.offence}:\n  ${p.penalty}`).join('\n\n'), source: 'CBCA [Chapter 21:02]' }
  }
  if (lq.includes('duty') || lq.includes('rate') || lq.includes('tax')) {
    const kbTopic = kbData.topics.find(t => t.id === 'duty_calculation')
    if (kbTopic) return { title: kbTopic.title, body: kbTopic.content, source: kbData.sources.join(' · ') }
  }

  return {
    title: "I couldn't find a specific answer",
    body: `I searched my offline customs knowledge base but couldn't find a direct match for your question.\n\nTry:\n• Using the HS Search tab to find your product code\n• Using the Duty Estimator tab to calculate costs\n• Checking the CBCA Checker tab for compliance requirements\n• Checking Import Licences tab for permit requirements\n\nFor authoritative answers, contact ZIMRA at www.zimra.co.zw or call +263 867 700 0353.`,
    source: '',
  }
}

function ChatMessage({ msg }) {
  if (msg.role === 'user') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <div style={{
          background: 'linear-gradient(135deg,#e9ba4c,#c8921a)',
          borderRadius: '16px 16px 4px 16px',
          padding: '11px 16px', maxWidth: '78%',
          fontSize: 14, color: '#06090f', fontWeight: 600, lineHeight: 1.5,
        }}>{msg.text}</div>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 18, alignItems: 'flex-start' }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        background: 'linear-gradient(135deg,#1e3a5f,#0d1829)',
        border: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Bot size={16} color={C.gold} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {msg.title && (
          <div style={{ fontSize: 13, fontWeight: 700, color: C.gold, marginBottom: 6 }}>{msg.title}</div>
        )}
        <div style={{
          background: C.panel, border: `1px solid ${C.border}`,
          borderRadius: '4px 16px 16px 16px', padding: '12px 16px',
          fontSize: 13, color: C.sub, lineHeight: 1.75, whiteSpace: 'pre-wrap',
        }}>{msg.body}</div>
        {msg.source && (
          <div style={{ fontSize: 10, color: C.muted, marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
            <ExternalLink size={10} /> {msg.source}
          </div>
        )}
      </div>
    </div>
  )
}

function ThinkingBubble() {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg,#1e3a5f,#0d1829)', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Bot size={16} color={C.gold} />
      </div>
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: '4px 16px 16px 16px', padding: '14px 18px', display: 'flex', gap: 6, alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: C.gold, opacity: 0.6, animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  )
}

function CustomsChat() {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    title: 'Customs Intelligence Assistant',
    body: 'Hello! I can answer questions about Zimbabwe customs regulations, HS classifications, duty rates, CBCA requirements, import licences, SI 122, SI 35 of 2024, and more.\n\nAll knowledge is stored locally — no internet required.',
    source: '',
  }])
  const [input, setInput]       = useState('')
  const [thinking, setThinking] = useState(false)
  const bottomRef               = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, thinking])

  function ask(q) {
    if (!q.trim()) return
    setMessages(prev => [...prev, { role: 'user', text: q }])
    setInput('')
    setThinking(true)
    setTimeout(() => {
      const answer = buildAnswer(q)
      setMessages(prev => [...prev, { role: 'assistant', ...answer }])
      setThinking(false)
    }, 600)
  }

  function handleKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input) } }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 280px)', minHeight: 440 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 4 }}>Customs AI Assistant</div>
        <div style={{ fontSize: 13, color: C.sub }}>Offline-capable · Powered by local Zimbabwe customs knowledge base</div>
      </div>

      {messages.length === 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {SUGGESTED.map(s => (
            <button key={s} onClick={() => ask(s)} style={{
              background: 'rgba(30,58,95,0.3)', border: `1px solid ${C.border}`,
              borderRadius: 20, padding: '6px 12px', fontSize: 12, color: C.sub,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.sub }}
            >{s}</button>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0 12px', scrollbarWidth: 'thin', scrollbarColor: `${C.border} transparent` }}>
        {messages.map((m, i) => <ChatMessage key={i} msg={m} />)}
        {thinking && <ThinkingBubble />}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: 10, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
        <input
          value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
          placeholder="Ask about HS codes, duty rates, SI 35, CBCA, import licences…"
          style={{ ...inp, flex: 1 }} disabled={thinking}
        />
        <button onClick={() => ask(input)} disabled={thinking || !input.trim()} style={{
          ...btnGold, padding: '10px 16px',
          opacity: (thinking || !input.trim()) ? 0.5 : 1,
        }}>
          <Send size={14} />
        </button>
      </div>

      {messages.length > 2 && (
        <button onClick={() => setMessages(prev => [prev[0]])}
          style={{ ...btnSec, alignSelf: 'flex-end', marginTop: 8, fontSize: 11, padding: '5px 10px' }}>
          <RotateCcw size={11} /> Clear chat
        </button>
      )}
    </div>
  )
}

/* ── QuickActionCard ─────────────────────────────────────── */
function QuickActionCard({ label, Icon, desc, color, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button onClick={onClick} style={{
      ...card, cursor: 'pointer', textAlign: 'left',
      background: C.panel, fontFamily: 'inherit', width: '100%',
      border: `1px solid ${hover ? color + '40' : C.border}`,
      transform: hover ? 'translateY(-2px)' : 'none',
      boxShadow: hover ? '0 8px 28px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.18)',
      transition: 'all 0.18s ease',
    }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{ width: 42, height: 42, borderRadius: 12, marginBottom: 14, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}28` }}>
        <Icon size={20} color={color} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6 }}>{desc}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 14, fontSize: 12, color: color, fontWeight: 600 }}>
        Open tool <ChevronRight size={13} />
      </div>
    </button>
  )
}

/* ══════════════════════════════════════════════════════════ */
/*  ROOT COMPONENT                                            */
/* ══════════════════════════════════════════════════════════ */
export default function CustomsIntelligence({ onNavigate }) {
  const [tab, setTab] = useState('home')

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'DM Sans', -apple-system, sans-serif", color: C.text }}>

      {/* ── Premium header ───────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(180deg,rgba(13,24,41,0.98) 0%,rgba(8,14,26,0.92) 100%)',
        borderBottom: `1px solid ${C.border}`,
        padding: '20px 32px 0',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: 'linear-gradient(135deg,rgba(30,58,95,0.9),rgba(8,17,31,0.95))',
                border: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <BookOpen size={20} color={C.gold} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>
                  Customs Intelligence Engine
                </h1>
                <div style={{ fontSize: 12, color: C.muted }}>Zimbabwe Tariff · CBCA · SI 122 · SI 35 of 2024 · Offline</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ background: '#4ade8022', border: '1px solid #4ade8044', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: C.green, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, display: 'inline-block' }} />
                Offline Ready
              </span>
              {onNavigate && (
                <button onClick={() => onNavigate('home')} style={{ ...btnSec, fontSize: 12, padding: '6px 14px' }}>← Back</button>
              )}
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
            {[{ id: 'home', label: 'Overview', Icon: Zap }, ...TABS].map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setTab(id)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '12px 18px', fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 7,
                fontWeight: tab === id ? 700 : 500,
                color: tab === id ? C.gold : C.sub,
                borderBottom: tab === id ? `2px solid ${C.gold}` : '2px solid transparent',
                transition: 'all 0.15s', whiteSpace: 'nowrap', fontFamily: 'inherit',
              }}
                onMouseEnter={e => { if (tab !== id) e.currentTarget.style.color = C.text }}
                onMouseLeave={e => { if (tab !== id) e.currentTarget.style.color = C.sub }}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────── */}
      <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto' }}>
        {tab === 'home' && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>What do you need help with?</h2>
              <p style={{ margin: 0, fontSize: 14, color: C.sub }}>All data is stored locally — no internet connection required.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 32 }}>
              {QUICK_ACTIONS.map(props => <QuickActionCard key={props.id} {...props} onClick={() => setTab(props.id)} />)}
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Reference Legislation</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 10 }}>
                {[
                  { label: 'SI 122 of 2022',   desc: 'Zimbabwe Tariff Schedule & duty rates', color: C.blue   },
                  { label: 'SI 35 of 2024',    desc: 'Latest tariff amendments',              color: C.gold   },
                  { label: 'CBCA Chp 21:02',   desc: 'Cross-Border Controls Act',             color: C.green  },
                  { label: 'Control of Goods', desc: 'Import licence requirements',            color: '#a78bfa' },
                ].map(r => (
                  <div key={r.label} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: r.color, marginBottom: 4 }}>{r.label}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{r.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {tab === 'hs'      && <HsSearch />}
        {tab === 'duty'    && <DutyEstimator />}
        {tab === 'cbca'    && <CbcaChecker />}
        {tab === 'licence' && <LicenceChecker />}
        {tab === 'chat'    && <CustomsChat />}
      </div>
    </div>
  )
}
