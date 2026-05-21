import { useState, useRef, useCallback } from "react";

// ── Lunarae colour system ──────────────────────────────────────────────────
const C = {
  navy:   "#0B1F3A",
  navyM:  "#122848",
  gold:   "#C9A84C",
  goldL:  "#E8C97A",
  cream:  "#F5F0E8",
  slate:  "#8CA0B8",
  green:  "#1A7F5A",
  greenL: "#D4EDDA",
  amber:  "#B97A00",
  amberL: "#FFF3CD",
  red:    "#C0392B",
  redL:   "#FDECEA",
  white:  "#FFFFFF",
  border: "#D4C9B0",
};

// ── Inline styles ──────────────────────────────────────────────────────────
const S = {
  root: {
    fontFamily: "'DM Sans', 'Trebuchet MS', sans-serif",
    background: C.navy,
    minHeight: "100vh",
    color: C.cream,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    background: C.navyM,
    borderBottom: `1px solid ${C.gold}40`,
    padding: "14px 28px",
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  logo: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: C.gold,
    textTransform: "uppercase",
  },
  tagline: {
    fontSize: 11,
    color: C.slate,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  badge: {
    marginLeft: "auto",
    background: `${C.gold}22`,
    border: `1px solid ${C.gold}55`,
    borderRadius: 20,
    padding: "4px 12px",
    fontSize: 11,
    color: C.goldL,
    letterSpacing: "0.08em",
  },
  main: {
    display: "grid",
    gridTemplateColumns: "340px 1fr",
    flex: 1,
    gap: 0,
  },
  sidebar: {
    background: C.navyM,
    borderRight: `1px solid ${C.gold}30`,
    padding: "24px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
    overflowY: "auto",
  },
  panel: {
    flex: 1,
    padding: "24px 28px",
    overflowY: "auto",
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: C.gold,
    marginBottom: 10,
  },
  textarea: {
    width: "100%",
    background: `${C.navy}CC`,
    border: `1px solid ${C.gold}40`,
    borderRadius: 8,
    color: C.cream,
    fontFamily: "inherit",
    fontSize: 13,
    padding: "10px 12px",
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
    lineHeight: 1.6,
  },
  select: {
    width: "100%",
    background: C.navyM,
    border: `1px solid ${C.gold}40`,
    borderRadius: 8,
    color: C.cream,
    fontFamily: "inherit",
    fontSize: 13,
    padding: "8px 12px",
    outline: "none",
  },
  input: {
    width: "100%",
    background: `${C.navy}CC`,
    border: `1px solid ${C.gold}40`,
    borderRadius: 8,
    color: C.cream,
    fontFamily: "inherit",
    fontSize: 13,
    padding: "8px 12px",
    outline: "none",
    boxSizing: "border-box",
  },
  btn: {
    background: C.gold,
    color: C.navy,
    border: "none",
    borderRadius: 8,
    padding: "11px 22px",
    fontFamily: "inherit",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    width: "100%",
    transition: "opacity 0.15s",
  },
  btnSecondary: {
    background: "transparent",
    color: C.gold,
    border: `1px solid ${C.gold}55`,
    borderRadius: 8,
    padding: "9px 18px",
    fontFamily: "inherit",
    fontSize: 12,
    cursor: "pointer",
    letterSpacing: "0.06em",
  },
  label: {
    fontSize: 11,
    color: C.slate,
    letterSpacing: "0.08em",
    marginBottom: 5,
    display: "block",
    textTransform: "uppercase",
  },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 5 },
  divider: { borderTop: `1px solid ${C.gold}25`, margin: "4px 0" },
  // results
  resultCard: {
    background: `${C.white}07`,
    border: `1px solid ${C.gold}25`,
    borderRadius: 10,
    padding: "20px 22px",
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: C.goldL,
    marginBottom: 14,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 12,
  },
  th: {
    textAlign: "left",
    padding: "7px 10px",
    background: `${C.gold}18`,
    color: C.gold,
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    borderBottom: `1px solid ${C.gold}30`,
  },
  td: {
    padding: "8px 10px",
    borderBottom: `1px solid ${C.white}10`,
    color: C.cream,
    fontSize: 12,
    verticalAlign: "top",
  },
  pill: (color, bg) => ({
    display: "inline-block",
    background: bg,
    color: color,
    borderRadius: 20,
    padding: "2px 9px",
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.06em",
    whiteSpace: "nowrap",
  }),
  alertBox: (bg, border) => ({
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: 8,
    padding: "12px 16px",
    marginBottom: 10,
    fontSize: 12,
    lineHeight: 1.6,
  }),
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    background: `${C.white}06`,
    border: `1px solid ${C.gold}25`,
    borderRadius: 8,
    padding: "14px 16px",
    textAlign: "center",
  },
  summaryVal: {
    fontSize: 20,
    fontWeight: 700,
    color: C.goldL,
    display: "block",
  },
  summaryLbl: {
    fontSize: 10,
    color: C.slate,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginTop: 4,
    display: "block",
  },
  spinner: {
    display: "inline-block",
    width: 18,
    height: 18,
    border: `2px solid ${C.gold}44`,
    borderTop: `2px solid ${C.gold}`,
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  thinking: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: C.slate,
    fontSize: 13,
    padding: "20px 0",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: C.slate,
  },
};

// ── Helper: format currency ────────────────────────────────────────────────
const fmtUSD = (n) => n != null ? `USD ${Number(n).toLocaleString("en", {minimumFractionDigits:2, maximumFractionDigits:2})}` : "—";
const fmtPct = (n) => n != null ? `${(Number(n)*100).toFixed(1)}%` : "—";

// ── Sample invoice text ────────────────────────────────────────────────────
const SAMPLE = `COMMERCIAL INVOICE
Invoice No: INV-2024-0892
Exporter: Goldfields Trading Ltd, Johannesburg, South Africa
Importer: Zimbabwe General Stores (Pvt) Ltd, Harare

Line Items:
1. Ibuprofen 200mg Tablets x 5,000 boxes @ USD 2.50 each = USD 12,500
2. Portland Cement (OPC 42.5) x 200 bags x 50kg @ USD 8.00/bag = USD 1,600
3. Cooking Oil (Sunflower refined) x 500 x 5L bottles @ USD 4.50 = USD 2,250
4. Men's Cotton T-Shirts (assorted sizes) x 300 pieces @ USD 3.00 = USD 900
5. Toyota Land Cruiser (2022, petrol, 4x4) x 1 unit @ USD 45,000 = USD 45,000

Total FOB Value: USD 62,250
Freight (road): USD 1,800
Insurance: USD 250
Total CIF Value: USD 64,300
Country of Origin: South Africa
Mode of Transport: Road (TIR Carnets)`;

// ── System prompt for Lunarae AI ───────────────────────────────────────────
const SYSTEM_PROMPT = `You are Lunarae, an expert Zimbabwe customs and excise AI assistant specialising in ZIMRA Bills of Entry (BOE). You have deep knowledge of:
- Zimbabwe Customs and Excise Act [Chapter 23:02]
- Zimbabwe Tariff Book (HS-based, 8-digit codes)
- SI 122 of 2017 — Control of Goods (Open General Import Licence) (Amendment) Notice
- SI 35 of 2024 — CBCA (Consignment Based Conformity Assessment) Notice
- Standard duty calculation: CIF value × duty rate + VAT at 14.5%
- ZIMRA BOE framing requirements

When given invoice/shipping document text, you MUST respond with a valid JSON object ONLY (no markdown, no explanation outside the JSON). The JSON must have this exact structure:

{
  "entry_type": "Home Consumption | Transit | Warehousing | Temporary Import",
  "importer": "company name",
  "exporter": "company name",
  "country_of_origin": "country",
  "mode_of_transport": "Road | Air | Sea",
  "total_cif_usd": number,
  "freight_usd": number,
  "insurance_usd": number,
  "rbz_rate": number,
  "line_items": [
    {
      "line_no": 1,
      "description": "goods description",
      "hs_code": "8-digit HS code",
      "quantity": number,
      "unit": "Kg | Units | L | m2 etc",
      "unit_value_usd": number,
      "fob_value_usd": number,
      "cif_value_usd": number,
      "duty_rate": number (decimal e.g. 0.10 for 10%),
      "duty_type": "ad_valorem | free | excise | specific | ad_valorem_plus_excise",
      "customs_duty_usd": number,
      "vat_base_usd": number,
      "vat_usd": number,
      "total_duty_usd": number,
      "import_licence_required": boolean,
      "cbca_required": boolean,
      "cbca_threshold_applies": boolean,
      "permit_notes": "specific permit/licence advisory or empty string",
      "authority": "issuing authority name or empty string",
      "si_reference": "SI number or empty string",
      "compliance_status": "CLEAR | LICENCE_REQUIRED | CBCA_REQUIRED | PROHIBITED | FLAGGED"
    }
  ],
  "totals": {
    "total_fob_usd": number,
    "total_cif_usd": number,
    "total_customs_duty_usd": number,
    "total_vat_usd": number,
    "total_duty_payable_usd": number,
    "total_duty_payable_zwg": number
  },
  "compliance_alerts": [
    {
      "severity": "HIGH | MEDIUM | INFO",
      "item": "line item description",
      "alert": "specific advisory text",
      "action_required": "what the clearing agent must do"
    }
  ],
  "boe_notes": "general notes for the clearing agent about this shipment",
  "ready_to_register": boolean
}

Use the RBZ rate provided. If not provided, use 13.5 ZWG per USD.
VAT rate is 14.5%.
For CBCA: vehicles (HS 87.01-87.07, 87.16) always require Certificate of Conformity. Other goods in SI 35 Fourth Schedule require CBCA if FOB > USD 1,000 per consignment.
For pharmaceutical medicines in HS 3004: MCAZ licence required.
For Portland cement (HS 2523): import licence required.
For cooking oil (HS 1507-1515): CBCA required if above USD 1,000.
For motor vehicles: CBCA always required, NO value threshold.`;

// ── Main App ───────────────────────────────────────────────────────────────
export default function LunaraeApp() {
  const [docText, setDocText]       = useState("");
  const [entryType, setEntryType]   = useState("Home Consumption");
  const [transport, setTransport]   = useState("Road");
  const [rbzRate, setRbzRate]       = useState("13.50");
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState(null);
  const [stage, setStage]           = useState("");

  const runLunarae = useCallback(async () => {
    if (!docText.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setStage("Reading shipping documents…");

    const userMsg = `Process this shipping document and generate a full ZIMRA BOE analysis.
Entry Type: ${entryType}
Mode of Transport: ${transport}
RBZ Rate: ${rbzRate} ZWG per USD

DOCUMENT TEXT:
${docText}`;

    try {
      setTimeout(() => setStage("Classifying goods and matching HS codes…"), 800);
      setTimeout(() => setStage("Calculating duties and checking SI compliance…"), 2200);
      setTimeout(() => setStage("Framing Bill of Entry…"), 4000);

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userMsg }],
        }),
      });

      const data = await res.json();
      const raw = data.content?.map(b => b.text || "").join("") || "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
    } catch (e) {
      setError("Could not parse the response. Please try again.");
      console.error(e);
    } finally {
      setLoading(false);
      setStage("");
    }
  }, [docText, entryType, transport, rbzRate]);

  return (
    <div style={S.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .fade-in { animation: fadeIn 0.35s ease forwards; }
        textarea:focus, input:focus, select:focus { border-color: ${C.gold}99 !important; }
        button:hover { opacity: 0.88; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: ${C.navy}; }
        ::-webkit-scrollbar-thumb { background: ${C.gold}44; border-radius: 4px; }
      `}</style>

      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.logo}>⚖ Lunarae</div>
          <div style={S.tagline}>ZIMRA Automated Bill of Entry System</div>
        </div>
        <div style={S.badge}>Phase 2 — AI Engine</div>
      </div>

      <div style={S.main}>
        {/* Sidebar */}
        <div style={S.sidebar}>
          <div>
            <div style={S.sectionTitle}>1 — Entry Parameters</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={S.fieldGroup}>
                <label style={S.label}>Entry Type</label>
                <select style={S.select} value={entryType} onChange={e => setEntryType(e.target.value)}>
                  <option>Home Consumption</option>
                  <option>Transit</option>
                  <option>Warehousing</option>
                  <option>Temporary Import</option>
                  <option>Export</option>
                </select>
              </div>
              <div style={S.fieldGroup}>
                <label style={S.label}>Mode of Transport</label>
                <select style={S.select} value={transport} onChange={e => setTransport(e.target.value)}>
                  <option>Road</option>
                  <option>Air</option>
                  <option>Sea</option>
                  <option>Rail</option>
                </select>
              </div>
              <div style={S.fieldGroup}>
                <label style={S.label}>RBZ Rate (ZWG per USD)</label>
                <input style={S.input} type="number" step="0.01" value={rbzRate}
                  onChange={e => setRbzRate(e.target.value)} placeholder="e.g. 13.50" />
              </div>
            </div>
          </div>

          <div style={S.divider} />

          <div>
            <div style={S.sectionTitle}>2 — Shipping Documents</div>
            <div style={{ fontSize: 11, color: C.slate, marginBottom: 8, lineHeight: 1.5 }}>
              Paste text from: Invoice · Packing List · AWB · Road Manifest · Bill of Lading
            </div>
            <textarea
              style={{ ...S.textarea, minHeight: 220 }}
              value={docText}
              onChange={e => setDocText(e.target.value)}
              placeholder="Paste your invoice, packing list or other shipping document text here…"
            />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button style={{ ...S.btnSecondary, flex: 1, fontSize: 11 }}
                onClick={() => setDocText(SAMPLE)}>
                Load Sample Invoice
              </button>
              <button style={{ ...S.btnSecondary, fontSize: 11 }}
                onClick={() => { setDocText(""); setResult(null); }}>
                Clear
              </button>
            </div>
          </div>

          <div style={S.divider} />

          <button style={S.btn} onClick={runLunarae} disabled={loading || !docText.trim()}>
            {loading ? "Processing…" : "⚡ Generate BOE Analysis"}
          </button>

          {result && (
            <div style={{ fontSize: 11, color: C.slate, textAlign: "center", lineHeight: 1.5 }}>
              {result.ready_to_register
                ? <span style={{ color: C.green }}>✓ Entry ready for ZIMRA registration</span>
                : <span style={{ color: C.amber }}>⚠ Action required before registration</span>
              }
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div style={S.panel}>
          {loading && (
            <div style={S.thinking}>
              <div style={S.spinner} />
              <div>
                <div style={{ color: C.goldL, fontWeight: 600, marginBottom: 2 }}>Lunarae is working…</div>
                <div style={{ fontSize: 12 }}>{stage}</div>
              </div>
            </div>
          )}

          {error && (
            <div style={S.alertBox(C.redL, C.red)}>
              <strong style={{ color: C.red }}>Error:</strong> {error}
            </div>
          )}

          {!result && !loading && (
            <div style={S.emptyState}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>⚖</div>
              <div style={{ fontSize: 16, color: C.goldL, marginBottom: 8 }}>Ready to frame your Bill of Entry</div>
              <div style={{ fontSize: 13, maxWidth: 380, margin: "0 auto", lineHeight: 1.7 }}>
                Paste your shipping documents on the left, set the entry parameters, and Lunarae will auto-classify goods, calculate all duties, check SI compliance, and frame the BOE.
              </div>
            </div>
          )}

          {result && (
            <div className="fade-in">
              {/* Entry Header */}
              <div style={{ ...S.resultCard, borderColor: C.gold + "55" }}>
                <div style={S.resultTitle}>📋 Bill of Entry — {result.entry_type}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, fontSize: 12 }}>
                  {[
                    ["Importer", result.importer],
                    ["Exporter", result.exporter],
                    ["Country of Origin", result.country_of_origin],
                    ["Mode of Transport", result.mode_of_transport],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ color: C.slate, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>{k}</div>
                      <div style={{ color: C.cream, fontWeight: 500 }}>{v || "—"}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance Alerts */}
              {result.compliance_alerts?.length > 0 && (
                <div style={S.resultCard}>
                  <div style={S.resultTitle}>🚨 Compliance Alerts</div>
                  {result.compliance_alerts.map((a, i) => {
                    const bg = a.severity === "HIGH" ? C.redL : a.severity === "MEDIUM" ? C.amberL : "#E8F4F8";
                    const border = a.severity === "HIGH" ? C.red : a.severity === "MEDIUM" ? C.amber : "#5BA4CF";
                    const col = a.severity === "HIGH" ? C.red : a.severity === "MEDIUM" ? C.amber : "#2980B9";
                    return (
                      <div key={i} style={{ ...S.alertBox(bg, border), color: "#1a1a1a" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={S.pill(col, bg)}>{a.severity}</span>
                          <strong style={{ color: col, fontSize: 12 }}>{a.item}</strong>
                        </div>
                        <div style={{ marginBottom: 4 }}>{a.alert}</div>
                        {a.action_required && (
                          <div style={{ fontWeight: 600, color: col }}>→ {a.action_required}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Duty Summary */}
              {result.totals && (
                <div style={S.resultCard}>
                  <div style={S.resultTitle}>💰 Duty Summary</div>
                  <div style={S.summaryGrid}>
                    {[
                      ["Total CIF", fmtUSD(result.totals.total_cif_usd)],
                      ["Customs Duty", fmtUSD(result.totals.total_customs_duty_usd)],
                      ["VAT (14.5%)", fmtUSD(result.totals.total_vat_usd)],
                      ["Total Payable (USD)", fmtUSD(result.totals.total_duty_payable_usd)],
                      ["Total Payable (ZWG)", result.totals.total_duty_payable_zwg != null ? `ZWG ${Number(result.totals.total_duty_payable_zwg).toLocaleString("en",{maximumFractionDigits:2})}` : "—"],
                      ["RBZ Rate", `${rbzRate} ZWG/USD`],
                    ].map(([l, v]) => (
                      <div key={l} style={S.summaryCard}>
                        <span style={S.summaryVal}>{v}</span>
                        <span style={S.summaryLbl}>{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Line Items */}
              {result.line_items?.length > 0 && (
                <div style={S.resultCard}>
                  <div style={S.resultTitle}>📦 Line Items</div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={S.table}>
                      <thead>
                        <tr>
                          {["#","Description","HS Code","Qty / Unit","CIF (USD)","Duty Rate","Customs Duty","VAT","Total Duty","Status"].map(h => (
                            <th key={h} style={S.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.line_items.map((item, i) => {
                          const statusColor = item.compliance_status === "CLEAR" ? C.green
                            : item.compliance_status === "PROHIBITED" ? C.red
                            : C.amber;
                          const statusBg = item.compliance_status === "CLEAR" ? C.greenL
                            : item.compliance_status === "PROHIBITED" ? C.redL
                            : C.amberL;
                          return (
                            <tr key={i} style={{ background: i % 2 === 0 ? `${C.white}04` : "transparent" }}>
                              <td style={S.td}>{item.line_no}</td>
                              <td style={{ ...S.td, maxWidth: 180 }}>
                                <div style={{ fontWeight: 500 }}>{item.description}</div>
                                {item.permit_notes && (
                                  <div style={{ fontSize: 10, color: C.amber, marginTop: 3 }}>⚠ {item.permit_notes}</div>
                                )}
                              </td>
                              <td style={{ ...S.td, fontFamily: "monospace", fontSize: 11 }}>{item.hs_code}</td>
                              <td style={S.td}>{item.quantity} {item.unit}</td>
                              <td style={S.td}>{fmtUSD(item.cif_value_usd)}</td>
                              <td style={S.td}>{fmtPct(item.duty_rate)}</td>
                              <td style={S.td}>{fmtUSD(item.customs_duty_usd)}</td>
                              <td style={S.td}>{fmtUSD(item.vat_usd)}</td>
                              <td style={{ ...S.td, fontWeight: 600, color: C.goldL }}>{fmtUSD(item.total_duty_usd)}</td>
                              <td style={S.td}>
                                <span style={S.pill(statusColor, statusBg)}>{item.compliance_status}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* BOE Notes */}
              {result.boe_notes && (
                <div style={{ ...S.resultCard, borderColor: C.gold + "33" }}>
                  <div style={S.resultTitle}>📝 Clearing Agent Notes</div>
                  <div style={{ fontSize: 13, lineHeight: 1.8, color: C.cream }}>
                    {result.boe_notes}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
