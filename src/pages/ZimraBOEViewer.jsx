import { useState, useRef, useEffect } from "react";
import {
  Eye, ShieldCheck, Save, Printer, Trash2, Search, Send,
  FileOutput, FileInput, Copy, Undo2, LayoutGrid, BarChart3,
  HelpCircle, FolderOpen, X, Minus, Square, ChevronDown,
  Lock, Clock, FileText, AlertCircle
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════
   DESIGN TOKENS — ASYCUDA World 2026 / Windows 11 Enterprise
═══════════════════════════════════════════════════════════════════ */
const T = {
  font:       "'Segoe UI', system-ui, -apple-system, sans-serif",
  primary:    "#2563eb",
  primaryHov: "#1d4ed8",
  success:    "#16a34a",
  warning:    "#f59e0b",
  danger:     "#dc2626",
  border:     "#d1d5db",
  borderFoc:  "#2563eb",
  bg:         "#f3f5f7",
  bgPanel:    "#ffffff",
  bgSection:  "#f8fafc",
  bgHdr:      "#f0f4f8",
  text:       "#111827",
  textMuted:  "#6b7280",
  textLabel:  "#374151",
  green:      "#15803d",
  greenLt:    "#f0fdf4",
  greenBdr:   "#bbf7d0",
  shadow:     "0 2px 8px rgba(0,0,0,0.08)",
  radius:     "4px",
  radiusMd:   "6px",
};

/* ═══════════════════════════════════════════════════════════════════
   DATA DICTIONARIES  (unchanged from original)
═══════════════════════════════════════════════════════════════════ */
const CUSTOMS_OFFICES = [
  { code: "ZWBB", name: "BEITBRIDGE CUSTOM HOUSE" },
  { code: "ZWHA", name: "HARARE AIRPORT" },
  { code: "ZWHR", name: "HARARE CUSTOM HOUSE" },
  { code: "ZWBA", name: "BULAWAYO AIRPORT" },
  { code: "ZWBW", name: "BULAWAYO CUSTOM HOUSE" },
  { code: "ZWCH", name: "CHIRUNDU CUSTOM HOUSE" },
  { code: "ZWFB", name: "FORBES BORDER POST" },
  { code: "ZWMT", name: "MUTARE CUSTOM HOUSE" },
  { code: "ZWVF", name: "VICTORIA FALLS CUSTOM HOUSE" },
  { code: "ZWKB", name: "KARIBA BORDER POST" },
  { code: "ZWNY", name: "NYAMAPANDA BORDER POST" },
  { code: "ZWPT", name: "PLUMTREE CUSTOM HOUSE" },
  { code: "ZWKZ", name: "KAZUNGULA BORDER POST" },
  { code: "ZWMK", name: "MUKUMBURA BORDER POST" },
  { code: "ZWAGS", name: "AIR GROUND SERVICES HARARE" },
  { code: "ZWCZ", name: "CHIREDZI CUSTOMS HOUSE" },
  { code: "ZWGW", name: "GWERU CUSTOM HOUSE" },
  { code: "ZWKW", name: "KWEKWE CUSTOM HOUSE" },
  { code: "ZWMN", name: "MASVINGO CUSTOM HOUSE" },
  { code: "ZWSN", name: "SANGO BORDER POST" },
  { code: "HREX", name: "HARARE EXCISE" },
  { code: "BWEX", name: "BULAWAYO EXCISE" },
  { code: "CHEX", name: "CHIRUNDU EXCISE" },
  { code: "MTEX", name: "MUTARE EXCISE" },
  { code: "VFEX", name: "VICTORIA FALLS EXCISE" },
];
const LOCATIONS = [
  { code: "LOC 01", name: "Railways Transit Shed" },
  { code: "LOC 02", name: "Private Railway Siding" },
  { code: "LOC 03", name: "Importer's Premises" },
  { code: "LOC 04", name: "Exporter's Premises" },
  { code: "LOC 05", name: "Air Cargo Shed" },
  { code: "LOC 06", name: "Bonded Warehouse" },
  { code: "LOC 07", name: "Customs Area/Yard" },
  { code: "LOC 08", name: "State Warehouse" },
  { code: "LOC 09", name: "Container Depot" },
  { code: "LOC 10", name: "Manufacturer's Premises" },
  { code: "LOC 11", name: "Declarant's Premises" },
  { code: "LOC 12", name: "Postal Assessing Office" },
  { code: "LOC 13", name: "Transporter's Premises n.e.s." },
  { code: "LOC 14", name: "Transit shed n.e.s." },
  { code: "LOC 15", name: "Other Location n.e.s." },
  { code: "LOC 16", name: "Harare Manica Container Depot" },
  { code: "LOC 17", name: "Harare BAK Logistics" },
  { code: "LOC 18", name: "Bulawayo Manica Container Depot" },
  { code: "LOC 19", name: "Beitbridge Sabot Container Depot" },
  { code: "LOC 20", name: "Mutare GMS Container Depot" },
];
const COUNTRIES = [
  { code: "AF", name: "Afghanistan" }, { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" }, { code: "AO", name: "Angola" },
  { code: "AR", name: "Argentina" }, { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" }, { code: "BE", name: "Belgium" },
  { code: "BW", name: "Botswana" }, { code: "BR", name: "Brazil" },
  { code: "CA", name: "Canada" }, { code: "CN", name: "China" },
  { code: "CD", name: "Congo (DRC)" }, { code: "CI", name: "Cote d'Ivoire" },
  { code: "DK", name: "Denmark" }, { code: "EG", name: "Egypt" },
  { code: "ET", name: "Ethiopia" }, { code: "FI", name: "Finland" },
  { code: "FR", name: "France" }, { code: "DE", name: "Germany" },
  { code: "GH", name: "Ghana" }, { code: "GR", name: "Greece" },
  { code: "HK", name: "Hong Kong" }, { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" }, { code: "IE", name: "Ireland" },
  { code: "IL", name: "Israel" }, { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" }, { code: "KE", name: "Kenya" },
  { code: "LS", name: "Lesotho" }, { code: "MW", name: "Malawi" },
  { code: "MY", name: "Malaysia" }, { code: "MU", name: "Mauritius" },
  { code: "MX", name: "Mexico" }, { code: "MZ", name: "Mozambique" },
  { code: "NA", name: "Namibia" }, { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" }, { code: "NG", name: "Nigeria" },
  { code: "NO", name: "Norway" }, { code: "PK", name: "Pakistan" },
  { code: "PT", name: "Portugal" }, { code: "RU", name: "Russian Federation" },
  { code: "RW", name: "Rwanda" }, { code: "SA", name: "Saudi Arabia" },
  { code: "SG", name: "Singapore" }, { code: "ZA", name: "South Africa" },
  { code: "KR", name: "South Korea" }, { code: "ES", name: "Spain" },
  { code: "LK", name: "Sri Lanka" }, { code: "SD", name: "Sudan" },
  { code: "SZ", name: "Eswatini" }, { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" }, { code: "TW", name: "Taiwan" },
  { code: "TZ", name: "Tanzania" }, { code: "TH", name: "Thailand" },
  { code: "UG", name: "Uganda" }, { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" }, { code: "US", name: "United States" },
  { code: "ZM", name: "Zambia" }, { code: "ZW", name: "Zimbabwe" },
];
const TRANSPORT = [
  { code: "20", name: "Rail transport" }, { code: "30", name: "Road transport" },
  { code: "40", name: "Air transport" }, { code: "50", name: "Postal" },
  { code: "61", name: "Multimodal - Sea, Rail" }, { code: "62", name: "Multimodal - Sea, Road" },
  { code: "69", name: "Multimodal n.e.s." }, { code: "70", name: "Pipeline" },
  { code: "90", name: "Mode unknown" },
];
const PROCEDURES = [
  { code: "4000", name: "Entry for home use (general)" },
  { code: "4051", name: "Entry for home use after temp import (unaltered)" },
  { code: "4052", name: "Entry for home use after temp import (inward processing)" },
  { code: "4071", name: "Entry for home use ex-warehouse" },
  { code: "4080", name: "Entry for consumption ex-Removal in Bond" },
  { code: "4081", name: "Entry for consumption ex-Removal in Transit" },
  { code: "1000", name: "Direct permanent export" },
  { code: "2100", name: "Temporary exports for outward processing" },
  { code: "3040", name: "Re-export after entry for home use" },
  { code: "5100", name: "Temporary import for return in unaltered state" },
  { code: "5200", name: "Temporary import for inward processing" },
  { code: "7100", name: "Direct entry for customs warehousing" },
  { code: "8000", name: "Removal of goods in bond" },
  { code: "8100", name: "Removal in transit" },
  { code: "9000", name: "Private Importations" },
];
const PACKAGES = [
  { code: "01", name: "Bulk, Solid fine particles" }, { code: "02", name: "Bulk, Solid granular" },
  { code: "03", name: "Bulk, Liquid" }, { code: "04", name: "Unpacked" },
  { code: "06", name: "Carton / Boxes" }, { code: "07", name: "Drums" },
  { code: "08", name: "Pallets" }, { code: "09", name: "Bags / Sacks" },
  { code: "10", name: "Rolls / Reels" }, { code: "11", name: "Units" },
  { code: "BG", name: "Bag" }, { code: "BX", name: "Box" },
  { code: "CT", name: "Carton" }, { code: "DR", name: "Drum" },
  { code: "PL", name: "Pallet" }, { code: "SA", name: "Sack" }, { code: "UN", name: "Unit" },
];
const INCOTERMS = [
  { code: "EXW", name: "Ex Works" }, { code: "FCA", name: "Free Carrier" },
  { code: "FAS", name: "Free Alongside Ship" }, { code: "FOB", name: "Free On Board" },
  { code: "CFR", name: "Cost and Freight" }, { code: "CIF", name: "Cost Insurance Freight" },
  { code: "CPT", name: "Carriage Paid To" }, { code: "CIP", name: "Carriage Insurance Paid To" },
  { code: "DAP", name: "Delivered At Place" }, { code: "DDP", name: "Delivered Duty Paid" },
  { code: "DDU", name: "Delivered Duty Unpaid" }, { code: "DAF", name: "Delivered At Frontier" },
];
const DECL_TYPES = [
  { code: "IM 4", name: "Entry for home use" }, { code: "IM 5", name: "Temporary Importation" },
  { code: "IM 6", name: "Re-importation" }, { code: "IM 7", name: "Entry for warehousing" },
  { code: "IM 8", name: "Removal in Bond" }, { code: "IM 9", name: "Private Importations" },
  { code: "EX 1", name: "Exportation" }, { code: "EX 2", name: "Temporary Export" },
  { code: "EX 3", name: "Re-export" }, { code: "TR 8", name: "Removal in transit" },
  { code: "EXC 2", name: "Excise" }, { code: "EXC 4", name: "Special Excise" },
];

/* ─── Filter ─── */
function filterItems(items, q) {
  if (!q || !q.trim()) return items.slice(0, 14);
  const s = q.toLowerCase().trim();
  const seen = new Set(), r = [];
  for (const it of items) {
    if (seen.has(it.code)) continue;
    const cl = it.code.toLowerCase(), nl = it.name.toLowerCase();
    if (cl === s || cl.startsWith(s) || nl.startsWith(s) || cl.includes(s) || nl.includes(s)) {
      seen.add(it.code); r.push(it);
    }
  }
  return r.slice(0, 14);
}

/* ─── XML Parser ─── */
function parseXML(xmlStr) {
  const doc = new DOMParser().parseFromString(xmlStr, "text/xml");
  const t = (scope, tag) => { const el = scope?.querySelector(tag); const v = el?.childNodes[0]?.textContent?.trim() || ""; return v === "null" ? "" : v; };
  const declarantEl = doc.querySelector("Declarant");
  const gsInv = doc.querySelector("Gs_Invoice"), gsFrt = doc.querySelector("Gs_internal_freight"), gsIns = doc.querySelector("Gs_insurance");
  const borderEl = doc.querySelector("Border_information"), arrEl = doc.querySelector("Departure_arrival_information");
  const items = [];
  doc.querySelectorAll("Item").forEach((el, idx) => {
    const pd = el.querySelector("Previous_doc"), ii = el.querySelector("Item_Invoice");
    const tl = [];
    el.querySelectorAll("Taxation_line").forEach(x => tl.push({ code: t(x,"Duty_tax_code"), base: t(x,"Duty_tax_Base"), rate: t(x,"Duty_tax_rate"), amount: t(x,"Duty_tax_amount"), mp: t(x,"Duty_tax_MP") }));
    const cc = t(el,"Commodity_code"), dg = t(el,"Description_of_goods");
    if (cc || dg) items.push({ num: idx+1,
      numPkgs: t(el,"Number_of_packages"), kindCode: t(el,"Kind_of_packages_code"), kindName: t(el,"Kind_of_packages_name"), marks: t(el,"Marks1_of_packages")||"ADD",
      commCode: cc, prec1: t(el,"Precision_1"), extProc: t(el,"Extended_customs_procedure"), natProc: t(el,"National_customs_procedure"),
      itemPrice: t(el,"Item_price"), descGoods: dg, commDesc: t(el,"Commercial_Description"),
      grossWt: t(el,"Gross_weight_itm"), netWt: t(el,"Net_weight_itm"), statVal: t(el,"Statistical_value"), origCode: t(el,"Country_of_origin_code"),
      licNo: t(el,"Licence_number"), adj: t(el,"Rate_of_adjustement"), valueItem: t(el,"Value_item"),
      summDecl: pd?t(pd,"Summary_declaration"):"", summDeclSl: pd?t(pd,"Summary_declaration_sl"):"",
      taxLines: tl, itemTaxTotal: t(el,"Item_taxes_amount") });
  });
  return {
    officeCode: t(doc,"Customs_clearance_office_code"), officeName: t(doc,"Customs_Clearance_office_name"),
    declType: t(doc,"Type_of_declaration"), genProc: t(doc,"Declaration_gen_procedure_code"),
    forms: t(doc,"Number_of_the_form"), totalForms: t(doc,"Total_number_of_forms"),
    totalItems: t(doc,"Total_number_of_items"), totalPkgs: t(doc,"Total_number_of_packages"),
    declarantRef: declarantEl ? t(declarantEl,"Number") : "",
    exporterName: t(doc,"Exporter_name"), consigneeName: t(doc,"Consignee_name"),
    declarantCode: t(doc,"Declarant_code"), declarantName: t(doc,"Declarant_name"),
    exportCountry: t(doc,"Export_country_name"), exportCountryCode: t(doc,"Export_country_code"),
    destCountry: t(doc,"Destination_country_name"), destCountryCode: t(doc,"Destination_country_code"),
    tradingCountry: t(doc,"Trading_country"), firstDest: t(doc,"Country_first_destination"),
    originCountry: t(doc,"Country_of_origin_name"), valueDetails: t(doc,"Value_details"),
    transportMode: t(doc,"Mode"), locationGoods: t(doc,"Location_of_goods"),
    delivCode: doc.querySelector("Delivery_terms Code")?.textContent?.trim()||"",
    delivPlace: doc.querySelector("Delivery_terms Place")?.textContent?.trim()||"",
    borderId: borderEl?.querySelector("Identity")?.textContent?.trim()||"",
    borderNat: borderEl?.querySelector("Nationality")?.textContent?.trim()||"",
    arrId: arrEl?.querySelector("Identity")?.textContent?.trim()||"",
    arrNat: arrEl?.querySelector("Nationality")?.textContent?.trim()||"",
    invCurrency: gsInv?t(gsInv,"Currency_code"):"", invRate: gsInv?t(gsInv,"Currency_rate"):"",
    invAmtFCX: gsInv?t(gsInv,"Amount_foreign_currency"):"", invAmtZWG: gsInv?t(gsInv,"Amount_national_currency"):"",
    frtAmtFCX: gsFrt?t(gsFrt,"Amount_foreign_currency"):"0.00", frtAmtZWG: gsFrt?t(gsFrt,"Amount_national_currency"):"0.00",
    insAmtFCX: gsIns?t(gsIns,"Amount_foreign_currency"):"0.00", insAmtZWG: gsIns?t(gsIns,"Amount_national_currency"):"0.00",
    totalCIF: t(doc,"Total_CIF"), totalCost: t(doc,"Total_cost"),
    paymentMode: t(doc,"Mode_of_payment"), deferredRef: t(doc,"Deffered_payment_reference"),
    items, year: "2026", customsRef: "", manifest: "",
  };
}

/* ═══════════════════════════════════════════════════════════════════
   RESPONSIVE LAYOUT ENGINE HOOK & REUSABLE LAYOUT UTILS
═══════════════════════════════════════════════════════════════════ */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);
  return matches;
}

function ResponsiveRow({ children, style = {}, desktopStyle = {}, mobileStyle = {} }) {
  const isMobile = useMediaQuery("(max-width:768px)");
  const computedStyle = {
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    width: "100%",
    boxSizing: "border-box",
    ...style,
    ...(isMobile ? mobileStyle : desktopStyle)
  };
  return <div style={computedStyle}>{children}</div>;
}

function ResponsiveSection({ children, desktopWidth, minWidth, maxWidth, style = {} }) {
  const isMobile = useMediaQuery("(max-width:768px)");
  const computedStyle = {
    boxSizing: "border-box",
    minWidth: isMobile ? "0" : (minWidth || undefined),
    maxWidth: isMobile ? "100%" : (maxWidth || undefined),
    width: isMobile ? "100%" : (desktopWidth || "100%"),
    flex: isMobile ? "1 1 100%" : undefined,
    ...style
  };
  return <div style={computedStyle}>{children}</div>;
}

/* ═══════════════════════════════════════════════════════════════════
   SHARED STYLES
═══════════════════════════════════════════════════════════════════ */
const inputBase = {
  width: "100%", border: `1px solid ${T.border}`, borderRadius: T.radius,
  padding: "4px 8px", height: 28, boxSizing: "border-box",
  fontFamily: T.font, fontSize: 12, fontWeight: 500, color: T.text,
  background: "#fff", outline: "none", transition: "border-color .15s, box-shadow .15s",
};
const labelStyle = {
  fontSize: 11, fontWeight: 600, color: T.textLabel,
  display: "block", marginBottom: 2, lineHeight: 1.3,
};
const sectionHdr = {
  background: T.bgSection, borderBottom: `1px solid #e5e7eb`,
  padding: "5px 10px", fontSize: 11, fontWeight: 600, color: T.textLabel,
  display: "flex", alignItems: "center", gap: 6,
};

/* ─── Field wrapper ─── */
function Field({ label, children, style = {}, noLabel }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minWidth: 0, ...style }}>
      {!noLabel && label !== undefined && <span style={labelStyle}>{label}</span>}
      {children}
    </div>
  );
}

/* ─── Plain input ─── */
function EF({ value, onChange, multiline, rows = 3, style = {}, align, placeholder }) {
  const [foc, setFoc] = useState(false);
  const isMobile = useMediaQuery("(max-width:768px)");
  const focStyle = foc ? { borderColor: T.borderFoc, boxShadow: "0 0 0 3px rgba(37,99,235,.15)" } : {};
  
  if (multiline) {
    return (
      <textarea value={value||""} onChange={e=>onChange(e.target.value)} rows={rows} placeholder={placeholder}
        onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
        style={{ ...inputBase, height: "auto", resize: "vertical", minHeight: isMobile ? 44 : undefined, ...focStyle, ...style }}/>
    );
  }
  return (
    <input type="text" value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
      style={{ ...inputBase, textAlign: align || "left", height: isMobile ? 36 : 28, ...focStyle, ...style }}/>
  );
}

/* ─── Modern AutoComplete ─── */
function ACF({ value, onChange, onSelect, items: di, width, compact, style = {} }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const [hi, setHi] = useState(0);
  const [foc, setFoc] = useState(false);
  const wrapRef = useRef(), listRef = useRef(), inputRef = useRef();
  const filtered = filterItems(di, query);
  const matched = di.find(i => i.code === (value||"").toUpperCase().trim() || i.code === (value||"").trim());
  const isMobile = useMediaQuery("(max-width:768px)");

  useEffect(() => { if (document.activeElement !== inputRef.current) setQuery(value || ""); }, [value]);
  useEffect(() => {
    const h = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) { setOpen(false); setQuery(value || ""); }};
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, [value]);
  useEffect(() => { if (listRef.current && hi >= 0 && listRef.current.children[hi+1]) listRef.current.children[hi+1].scrollIntoView({ block:"nearest" }); }, [hi]);

  const select = it => { setQuery(it.code); setOpen(false); setHi(0); if (onSelect) onSelect(it); else onChange(it.code); };
  const focStyle = foc ? { borderColor: T.borderFoc, boxShadow: "0 0 0 3px rgba(37,99,235,.15)" } : {};

  return (
    <div ref={wrapRef} style={{ position:"relative", width: isMobile ? "100%" : (width||"100%"), ...style }}>
      <div style={{ position:"relative" }}>
        <input ref={inputRef} type="text" value={query} autoComplete="off" spellCheck={false}
          onFocus={() => { setFoc(true); setOpen(true); setHi(0); }}
          onBlur={() => setFoc(false)}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); setHi(0); }}
          onKeyDown={e => {
            if (!open) { if (e.key==="ArrowDown") { setOpen(true); setHi(0); e.preventDefault(); } return; }
            if (e.key==="ArrowDown") { e.preventDefault(); setHi(h=>Math.min(h+1,filtered.length-1)); }
            else if (e.key==="ArrowUp") { e.preventDefault(); setHi(h=>Math.max(h-1,0)); }
            else if (e.key==="Enter") { e.preventDefault(); if (filtered[hi]) select(filtered[hi]); }
            else if (e.key==="Escape") { setOpen(false); setQuery(value||""); }
          }}
          style={{ ...inputBase, height: isMobile ? 36 : 28, paddingRight: 22, ...focStyle }}
        />
        <ChevronDown size={12} style={{ position:"absolute", right:7, top:"50%", transform:"translateY(-50%)", color: T.textMuted, pointerEvents:"none" }}/>
      </div>
      {/* Tooltip when closed and has value */}
      {matched && !open && value && (
        <div style={{ position:"absolute", top:"calc(100% + 2px)", left:0, zIndex:9998,
          background:"#1e293b", color:"#f1f5f9", borderRadius: T.radius,
          padding:"3px 8px", fontSize:10, whiteSpace:"nowrap", pointerEvents:"none",
          boxShadow:"0 2px 8px rgba(0,0,0,0.2)" }}>{matched.name}</div>
      )}
      {open && filtered.length > 0 && (
        <div ref={listRef} style={{ position:"absolute", top:"calc(100% + 2px)", left:0, 
          minWidth: isMobile ? "auto" : 260, width: isMobile ? "95vw" : "auto", maxWidth: isMobile ? "95vw" : "none",
          maxHeight:200, overflowY:"auto", background:"#fff",
          border:`1px solid ${T.border}`, borderRadius: T.radiusMd,
          zIndex:9999, boxShadow:"0 8px 24px rgba(0,0,0,0.12)",
          fontFamily: T.font }}>
          {/* Header */}
          <div style={{ display:"flex", background: T.bgSection, padding:"4px 10px",
            fontSize:10, fontWeight:600, color: T.textMuted,
            borderBottom:`1px solid ${T.border}`, position:"sticky", top:0 }}>
            <span style={{ width:70, flexShrink:0 }}>CODE</span>
            <span>DESCRIPTION</span>
          </div>
          {filtered.map((it,i) => (
            <div key={it.code} onMouseDown={e=>{e.preventDefault();select(it);}} onMouseEnter={()=>setHi(i)}
              style={{ display:"flex", padding:"5px 10px", fontSize:11, cursor:"pointer",
                minHeight: isMobile ? 44 : "auto", alignItems: isMobile ? "center" : "stretch",
                background: i===hi ? T.primary : i%2===0 ? "#fff" : T.bgSection,
                color: i===hi ? "#fff" : T.text,
                borderBottom:`1px solid ${T.border}`, transition:"background .1s" }}>
              <span style={{ width:70, flexShrink:0, fontWeight:600,
                color: i===hi ? "#dbeafe" : T.primary }}>{it.code}</span>
              <span style={{ flex:1, fontSize:11 }}>{it.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Cell component — bordered form cell ─── */
function C({ label, children, style={}, flex, width, minH, accent }) {
  const isMobile = useMediaQuery("(max-width:768px)");
  return (
    <div style={{
      border: `1px solid ${T.border}`,
      borderRadius: 0,
      padding: "4px 6px",
      background: accent ? T.bgSection : "#fff",
      boxSizing: "border-box",
      flex: isMobile ? "1 1 100%" : (width ? undefined : (flex || 1)),
      width: isMobile ? "100%" : (width || undefined),
      minHeight: minH || 36,
      ...style
    }}>
      {label !== undefined && <span style={{ ...labelStyle, color: T.primary }}>{label}</span>}
      {children}
    </div>
  );
}

function R({ children, style={} }) {
  return <ResponsiveRow style={{ borderBottom:`1px solid ${T.border}`, ...style }}>{children}</ResponsiveRow>;
}

/* ─── Section divider ─── */
function SectionBar({ num, title }) {
  return (
    <div style={{ ...sectionHdr, borderTop:`1px solid #e5e7eb`, borderBottom:`1px solid #e5e7eb` }}>
      {num && <span style={{ background: T.primary, color:"#fff", borderRadius:"50%",
        width:18, height:18, display:"inline-flex", alignItems:"center", justifyContent:"center",
        fontSize:10, fontWeight:700, flexShrink:0 }}>{num}</span>}
      <span style={{ color: T.textLabel, fontWeight:600, fontSize:12 }}>title</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ZIMRA HEADER — Modern branding
═══════════════════════════════════════════════════════════════════ */
function ZimraHeader() {
  const isMobile = useMediaQuery("(max-width:768px)");
  return (
    <div style={{ display:"flex", flexDirection: isMobile ? "column" : "row", height: isMobile ? "auto" : 64, borderBottom:`2px solid ${T.primary}`, background:"#fff" }}>
      {/* Logo */}
      <div style={{ width: isMobile ? "100%" : 200, borderRight: isMobile ? "none" : `1px solid ${T.border}`, borderBottom: isMobile ? `1px solid ${T.border}` : "none", display:"flex",
        alignItems:"center", gap:10, padding: isMobile ? "12px 16px" : "0 16px", flexShrink:0 }}>
        <svg width={38} height={38} viewBox="0 0 38 38" style={{ flexShrink: 0 }}>
          <circle cx={19} cy={19} r={18} fill={T.primary}/>
          <circle cx={19} cy={19} r={14} fill="#fff"/>
          <circle cx={19} cy={19} r={9} fill={T.primary}/>
          <circle cx={19} cy={19} r={4} fill="#fbbf24"/>
          <circle cx={19} cy={19} r={2} fill={T.primary}/>
          {/* Star rays */}
          {[0,45,90,135,180,225,270,315].map((a,i)=>{
            const r1=11,r2=13, rad=a*Math.PI/180;
            return <line key={i} x1={19+r1*Math.cos(rad)} y1={19+r1*Math.sin(rad)}
              x2={19+r2*Math.cos(rad)} y2={19+r2*Math.sin(rad)} stroke="#fff" strokeWidth={1.5}/>;
          })}
        </svg>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color: T.primary, letterSpacing:.5 }}>ZIMRA</div>
          <div style={{ fontSize:9, color: T.textMuted, fontWeight:500, lineHeight:1.3 }}>Zimbabwe Revenue Authority</div>
        </div>
      </div>

      {/* Header info */}
      <div style={{ flex:1, display:"flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", padding: isMobile ? "12px 16px" : "0 20px", gap: isMobile ? 12 : 40 }}>
        <div>
          <div style={{ fontSize: isMobile ? 15 : 17, fontWeight:700, color: T.text, letterSpacing:.3 }}>SINGLE ADMINISTRATIVE DOCUMENT</div>
          <div style={{ fontSize:11, color: T.textMuted, fontWeight:500 }}>ASYCUDA World — Detailed Declaration</div>
        </div>
        <div style={{ marginLeft: isMobile ? "0" : "auto", display:"flex", gap:20, width: isMobile ? "100%" : "auto", justifyContent: isMobile ? "flex-start" : "stretch" }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:9, color: T.textMuted, fontWeight:600, textTransform:"uppercase", letterSpacing:.8 }}>Form</div>
            <div style={{ fontSize:13, fontWeight:600, color: T.text }}>SAD</div>
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:9, color: T.textMuted, fontWeight:600, textTransform:"uppercase", letterSpacing:.8 }}>Status</div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:4, background:"#fef3c7",
              color:"#92400e", borderRadius:12, padding:"2px 8px", fontSize:11, fontWeight:600 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#f59e0b", display:"inline-block" }}/>
              DRAFT
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Barcode ─── */
function Barcode({ value="" }) {
  const isMobile = useMediaQuery("(max-width:768px)");
  return (
    <div style={{ padding: isMobile ? "12px 16px" : "6px 16px 4px", borderBottom:`1px solid ${T.border}`, background:"#fafafa", display:"flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap:16 }}>
      <svg width={180} height={36} style={{ display:"block", maxWidth: "100%" }}>
        {Array.from({length:54},(_,i)=>{
          const w=i%7===0?4:i%3===0?2:1;
          return <rect key={i} x={i*3.2} y={0} width={w} height={28} fill="#1e293b" rx={.5}/>;
        })}
        <text x={0} y={35} fontSize={7} fontFamily={T.font} fill={T.textMuted}>{value||"— NO REFERENCE —"}</text>
      </svg>
      <div style={{ fontSize:10, color: T.textMuted, fontWeight:500 }}>
        <div>Declarant Ref: <strong style={{ color: T.text }}>{value||"—"}</strong></div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   FLAT TOOLBAR — Lucide icons, Windows 11 style
═══════════════════════════════════════════════════════════════════ */
const tbBtnBase = {
  display:"flex", alignItems:"center", gap:5, padding:"4px 8px",
  border:`1px solid ${T.border}`, borderRadius: T.radius,
  background:"transparent", cursor:"pointer", fontFamily: T.font,
  fontSize:11, fontWeight:500, color: T.text, height:30,
  transition:"background .12s, border-color .12s", flexShrink:0,
};

function TbBtn({ icon: Icon, label, onClick, danger, primary, title }) {
  const [hov, setHov] = useState(false);
  const [pressed, setPressed] = useState(false);
  const isMobile = useMediaQuery("(max-width:768px)");
  const bg = pressed ? "#e8f0fe" : hov ? "#f5f8ff" : "transparent";
  const bdr = hov || pressed ? T.primary : T.border;
  return (
    <button title={title||label} onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => { setHov(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
      style={{ ...tbBtnBase, background: bg, borderColor: bdr,
        minHeight: isMobile ? 44 : 30, padding: isMobile ? "8px 12px" : "4px 8px",
        color: danger ? T.danger : primary ? T.primary : T.text }}>
      {Icon && <Icon size={14} strokeWidth={2}/>}
      {label && <span>{label}</span>}
    </button>
  );
}

function TbSep() { 
  const isMobile = useMediaQuery("(max-width:768px)");
  if (isMobile) return null;
  return <div style={{ width:1, height:20, background: T.border, margin:"0 2px" }}/>; 
}

function Toolbar({ onLoad }) {
  return (
    <div style={{ background:"linear-gradient(to bottom,#fafafa,#f0f0f0)",
      borderBottom:`1px solid ${T.border}`, padding:"5px 12px",
      display:"flex", flexWrap: "wrap", alignItems:"center", gap:6, flexShrink:0, height: "auto", minHeight:42 }}>
      <TbBtn icon={Eye} label="View"/>
      <TbBtn icon={ShieldCheck} label="Validate" primary/>
      <TbBtn icon={FileInput} label="Import XML" onClick={onLoad}/>
      <TbBtn icon={FileOutput} label="Export XML"/>
      <TbBtn icon={Save} label="Save" primary/>
      <TbBtn icon={Printer} label="Print"/>
      <TbSep/>
      <TbBtn icon={Copy} label="Copy"/>
      <TbBtn icon={Undo2} label="Undo"/>
      <TbBtn icon={LayoutGrid} label="Split"/>
      <TbBtn icon={BarChart3} label="Assessment"/>
      <TbSep/>
      <TbBtn icon={Send} label="Submit" primary/>
      <TbBtn icon={Trash2} label="Delete" danger/>
      <TbSep/>
      <TbBtn icon={Search} label="Search"/>
      <TbBtn icon={HelpCircle} label="Help"/>
      <div style={{ flex:1, minWidth: 20 }}/>
      <span style={{ fontSize:11, color: T.textMuted, fontWeight:500 }}>100%</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SAD FORM
═══════════════════════════════════════════════════════════════════ */
function SadForm({ d, upd }) {
  const selOff = (cf, nf) => it => { upd(cf, it.code); upd(nf, it.name); };
  const selCty = (cf, nf) => it => { upd(cf, it.code); if(nf) upd(nf, it.name); };
  const isMobile = useMediaQuery("(max-width:768px)");

  /* thin border for table cells inside form */
  const bdr = `1px solid ${T.border}`;

  return (
    <div style={{ fontFamily: T.font, fontSize:12, color: T.text }}>

      {/* ── ROW 1: Exporter | Declaration header ── */}
      <ResponsiveRow style={{ borderBottom: bdr }}>
        {/* Left gutter with box number */}
        <div style={{ width: isMobile ? "100%" : 28, height: isMobile ? 24 : "auto", flexShrink:0, borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background: T.bgSection,
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontSize:10, fontWeight:700, color: T.primary, writingMode: isMobile ? "horizontal-tb" : "vertical-rl", transform: isMobile ? "none" : "rotate(180deg)" }}>1</span>
        </div>

        {/* 2 Exporter */}
        <ResponsiveSection desktopWidth="400px" minWidth="400px" style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"6px 8px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
            <span style={{ ...labelStyle, color: T.primary }}>2 Exporter</span>
            <span style={{ ...labelStyle, color: T.textMuted }}>No.</span>
          </div>
          <div style={{ borderBottom: bdr, marginBottom:4 }}/>
          <EF value={d.exporterName} onChange={v=>upd("exporterName",v)} multiline rows={3}
            style={{ height:"auto", minHeight:52, fontSize:12 }}/>
        </ResponsiveSection>

        {/* DECLARATION banner + sub-fields */}
        <ResponsiveSection style={{ display:"flex", flexDirection:"column" }}>
          {/* DECLARATION header row */}
          <ResponsiveRow style={{ borderBottom: bdr, minHeight:36, alignItems:"stretch" }}>
            <ResponsiveSection desktopWidth="380px" minWidth="380px" style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background: T.primary,
              display:"flex", alignItems:"center", paddingLeft:12, minHeight: isMobile ? 36 : "auto" }}>
              <span style={{ color:"#fff", fontSize:16, fontWeight:700, letterSpacing: isMobile ? 2 : 6 }}>DECLARATION</span>
            </ResponsiveSection>
            <ResponsiveSection style={{ background:"#fff", padding:"4px 8px" }}>
              <div style={{ display:"flex", flexWrap: "wrap", alignItems:"center", gap:6, marginBottom:2 }}>
                <ACF value={d.officeCode} onChange={v=>upd("officeCode",v)}
                  onSelect={selOff("officeCode","officeName")} items={CUSTOMS_OFFICES} width={80}/>
                <label style={{ display:"flex", alignItems:"center", gap:4, fontSize:10, color: T.textMuted, cursor:"pointer", minHeight: isMobile ? 44 : "auto" }}>
                  <input type="checkbox" style={{ margin:0 }}/> UCR
                </label>
                <label style={{ display:"flex", alignItems:"center", gap:4, fontSize:10, color: T.textMuted, cursor:"pointer", minHeight: isMobile ? 44 : "auto" }}>
                  <input type="checkbox" style={{ margin:0 }}/> Multi-Use
                </label>
              </div>
              <div style={{ fontSize:11, fontWeight:600, color: T.text, marginBottom:1 }}>
                {CUSTOMS_OFFICES.find(o=>o.code===d.officeCode)?.name || d.officeName || "—"}
              </div>
              <span style={{ ...labelStyle, color: T.textMuted }}>Customs Reference</span>
              <EF value={d.customsRef||""} onChange={v=>upd("customsRef",v)} style={{ height: isMobile ? 36 : 22 }}/>
            </ResponsiveSection>
          </ResponsiveRow>

          {/* Type/procedure row */}
          <ResponsiveRow style={{ borderBottom: bdr, minHeight:28, alignItems:"stretch" }}>
            <ResponsiveSection desktopWidth="100px" minWidth="100px" style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"2px 6px" }}>
              <span style={{ ...labelStyle, color: T.primary }}>Type</span>
              <ACF value={d.declType} onChange={v=>upd("declType",v)}
                onSelect={it=>upd("declType",it.code)} items={DECL_TYPES}/>
            </ResponsiveSection>
            <ResponsiveSection desktopWidth="80px" minWidth="80px" style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"2px 6px" }}>
              <span style={{ ...labelStyle, color: T.primary }}>Gen. Proc.</span>
              <EF value={d.genProc} onChange={v=>upd("genProc",v)}/>
            </ResponsiveSection>
            <ResponsiveSection style={{ background:"#fff", padding:"2px 6px" }}>
              <span style={{ ...labelStyle, color: T.textMuted }}>Manifest</span>
              <EF value={d.manifest||""} onChange={v=>upd("manifest",v)}/>
            </ResponsiveSection>
          </ResponsiveRow>

          {/* 3/4/5/6/7 */}
          <ResponsiveRow style={{ borderBottom: bdr }}>
            <ResponsiveSection desktopWidth="110px" minWidth="110px" style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"4px 6px" }}>
              <span style={{ ...labelStyle, color: T.primary }}>3 Forms</span>
              <div style={{ display:"flex", gap:4 }}>
                <EF value={d.forms} onChange={v=>upd("forms",v)} style={{ width:36 }}/>
                <span style={{ alignSelf:"center", color: T.textMuted }}/> 
                <EF value={d.totalForms} onChange={v=>upd("totalForms",v)} style={{ width:36 }}/>
              </div>
            </ResponsiveSection>
            <ResponsiveSection desktopWidth="160px" minWidth="160px" style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"4px 6px" }}>
              <span style={{ ...labelStyle, color: T.primary }}>4 Load List</span>
            </ResponsiveSection>
            <ResponsiveSection desktopWidth="140px" minWidth="140px" style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"4px 6px" }}>
              <span style={{ ...labelStyle, color: T.primary }}>5 Items</span>
              <EF value={d.totalItems} onChange={v=>upd("totalItems",v)}/>
            </ResponsiveSection>
            <ResponsiveSection desktopWidth="120px" minWidth="120px" style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"4px 6px" }}>
              <span style={{ ...labelStyle, color: T.primary }}>6 Packages</span>
              <EF value={d.totalPkgs} onChange={v=>upd("totalPkgs",v)}/>
            </ResponsiveSection>
            <ResponsiveSection style={{ background:"#fff", padding:"4px 6px" }}>
              <span style={{ ...labelStyle, color: T.primary }}>7 Reference number</span>
              <div style={{ display:"flex", gap:4 }}>
                <EF value={d.year} onChange={v=>upd("year",v)} style={{ width:44 }}/>
                <EF value={d.declarantRef} onChange={v=>upd("declarantRef",v)} style={{ flex:1 }}/>
              </div>
            </ResponsiveSection>
          </ResponsiveRow>
        </ResponsiveSection>
      </ResponsiveRow>

      {/* ── ROW: 8 Consignee | 9 Financial ── */}
      <ResponsiveRow style={{ borderBottom: bdr }}>
        <div style={{ width: isMobile ? "100%" : 28, height: isMobile ? 0 : "auto", flexShrink:0, borderRight: isMobile ? "none" : bdr, background: T.bgSection }}/>
        <ResponsiveSection desktopWidth="400px" minWidth="400px" style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"6px 8px", minHeight:80 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
            <span style={{ ...labelStyle, color: T.primary }}>8 Consignee</span>
            <span style={{ ...labelStyle, color: T.textMuted }}>No.</span>
          </div>
          <div style={{ borderBottom: bdr, marginBottom:4 }}/>
          <EF value={d.consigneeName} onChange={v=>upd("consigneeName",v)} multiline rows={3}
            style={{ height:"auto", minHeight:44, fontSize:12 }}/>
        </ResponsiveSection>
        <ResponsiveSection style={{ background:"#fff", padding:"6px 8px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
            <span style={{ ...labelStyle, color: T.primary }}>9 Financial &amp; banking</span>
            <span style={{ ...labelStyle, color: T.textMuted }}>No.</span>
          </div>
          <div style={{ background:"#eff6ff", border:`1px solid #bfdbfe`,
            borderRadius: T.radius, height:48, marginTop:4, display:"flex",
            alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:10, color:"#3b82f6", fontWeight:500, padding: "0 8px", textAlign: "center" }}>Financial reference — attach via banking module</span>
          </div>
        </ResponsiveSection>
      </ResponsiveRow>

      {/* ── ROW: Country | 11 Trading | 12 Value | 13 CAP ── */}
      <ResponsiveRow style={{ borderBottom: bdr }}>
        <div style={{ width: isMobile ? "100%" : 28, height: isMobile ? 0 : "auto", flexShrink:0, borderRight: isMobile ? "none" : bdr, background: T.bgSection }}/>
        <ResponsiveSection desktopWidth="180px" minWidth="180px" style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"4px 6px" }}>
          <span style={{ ...labelStyle, color: T.primary }}>Country last consignment</span>
          <ACF value={d.firstDest} onChange={v=>upd("firstDest",v)}
            onSelect={it=>upd("firstDest",it.code)} items={COUNTRIES}/>
        </ResponsiveSection>
        <ResponsiveSection desktopWidth="180px" minWidth="180px" style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"4px 6px" }}>
          <span style={{ ...labelStyle, color: T.primary }}>11 Trading country</span>
          <ACF value={d.tradingCountry} onChange={v=>upd("tradingCountry",v)}
            onSelect={it=>upd("tradingCountry",it.code)} items={COUNTRIES}/>
        </ResponsiveSection>
        <ResponsiveSection desktopWidth="280px" minWidth="280px" style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"4px 6px" }}>
          <span style={{ ...labelStyle, color: T.primary }}>12 Value details</span>
          <EF value={d.valueDetails} onChange={v=>upd("valueDetails",v)}/>
        </ResponsiveSection>
        <ResponsiveSection style={{ background:"#fff", padding:"4px 6px" }}>
          <span style={{ ...labelStyle, color: T.primary }}>13 C.A.P.</span>
        </ResponsiveSection>
      </ResponsiveRow>

      {/* ── ROW: 14 Declarant | 15/16/17 ── */}
      <ResponsiveRow style={{ borderBottom: bdr }}>
        <div style={{ width: isMobile ? "100%" : 28, height: isMobile ? 0 : "auto", flexShrink:0, borderRight: isMobile ? "none" : bdr, background: T.bgSection }}/>
        <ResponsiveSection desktopWidth="400px" minWidth="400px" style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"6px 8px", minHeight:88 }}>
          <div style={{ display:"flex", flexWrap: "wrap", gap:8, alignItems:"center", marginBottom:4 }}>
            <span style={{ ...labelStyle, color: T.primary, marginBottom:0 }}>14 Declarant</span>
            <span style={{ ...labelStyle, color: T.textMuted, marginBottom:0 }}>No.</span>
            <EF value={d.declarantCode} onChange={v=>upd("declarantCode",v)} style={{ flex: isMobile ? "1 1 100%" : 1 }}/>
          </div>
          <EF value={d.declarantName} onChange={v=>upd("declarantName",v)} multiline rows={3}
            style={{ height:"auto", minHeight:56 }}/>
        </ResponsiveSection>
        <ResponsiveSection style={{ display:"flex", flexDirection:"column" }}>
          <ResponsiveRow style={{ borderBottom: bdr }}>
            <ResponsiveSection style={{ borderRight: bdr, background:"#fff", padding:"4px 6px" }}>
              <span style={{ ...labelStyle, color: T.primary }}>15 Country of export</span>
              <ACF value={d.exportCountry} onChange={v=>upd("exportCountry",v)}
                onSelect={selCty("exportCountryCode","exportCountry")} items={COUNTRIES}/>
            </ResponsiveSection>
            <ResponsiveSection desktopWidth="110px" minWidth="110px" style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"4px 6px" }}>
              <span style={{ ...labelStyle, color: T.primary }}>15a CE Code</span>
              <ACF value={d.exportCountryCode} onChange={v=>upd("exportCountryCode",v)}
                onSelect={selCty("exportCountryCode","exportCountry")} items={COUNTRIES}/>
            </ResponsiveSection>
            <ResponsiveSection desktopWidth="120px" minWidth="120px" style={{ background:"#fff", padding:"4px 6px" }}>
              <span style={{ ...labelStyle, color: T.primary }}>17 CD Code</span>
              <ACF value={d.destCountryCode} onChange={v=>upd("destCountryCode",v)}
                onSelect={selCty("destCountryCode","destCountry")} items={COUNTRIES}/>
            </ResponsiveSection>
          </ResponsiveRow>
          <ResponsiveRow>
            <ResponsiveSection style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"4px 6px" }}>
              <span style={{ ...labelStyle, color: T.primary }}>16 Country of origin</span>
              <ACF value={d.originCountry} onChange={v=>upd("originCountry",v)}
                onSelect={it=>upd("originCountry",it.name)} items={COUNTRIES}/>
            </ResponsiveSection>
            <ResponsiveSection style={{ background:"#fff", padding:"4px 6px" }}>
              <span style={{ ...labelStyle, color: T.primary }}>17 Country of destination</span>
              <ACF value={d.destCountry} onChange={v=>upd("destCountry",v)}
                onSelect={selCty("destCountryCode","destCountry")} items={COUNTRIES}/>
            </ResponsiveSection>
          </ResponsiveRow>
        </ResponsiveSection>
      </ResponsiveRow>

      {/* ── ROW: 18 | 19 | 20 ── */}
      <ResponsiveRow style={{ borderBottom: bdr }}>
        <div style={{ width: isMobile ? "100%" : 28, height: isMobile ? 0 : "auto", flexShrink:0, borderRight: isMobile ? "none" : bdr, background: T.bgSection }}/>
        <ResponsiveSection style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"4px 6px" }}>
          <span style={{ ...labelStyle, color: T.primary }}>18 Identity &amp; nationality of means of transport at arrival</span>
          <div style={{ display:"flex", gap:6 }}>
            <EF value={d.arrId} onChange={v=>upd("arrId",v)} style={{ flex:1 }}/>
            <ACF value={d.arrNat} onChange={v=>upd("arrNat",v)}
              onSelect={it=>upd("arrNat",it.code)} items={COUNTRIES} width={68}/>
          </div>
        </ResponsiveSection>
        <ResponsiveSection desktopWidth="70px" minWidth="70px" style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"4px 6px" }}>
          <span style={{ ...labelStyle, color: T.primary }}>19 Ctr.</span>
          <input type="checkbox" style={{ marginTop:4, minHeight: isMobile ? 44 : "auto" }}/>
        </ResponsiveSection>
        <ResponsiveSection desktopWidth="300px" minWidth="300px" style={{ background:"#fff", padding:"4px 6px" }}>
          <span style={{ ...labelStyle, color: T.primary }}>20 Delivery terms</span>
          <div style={{ display:"flex", gap:6 }}>
            <ACF value={d.delivCode} onChange={v=>upd("delivCode",v)}
              onSelect={it=>upd("delivCode",it.code)} items={INCOTERMS} width={70}/>
            <EF value={d.delivPlace} onChange={v=>upd("delivPlace",v)} style={{ flex:1 }}/>
          </div>
        </ResponsiveSection>
      </ResponsiveRow>

      {/* ── ROW: 21 | 22 | 23 | 24 ── */}
      <ResponsiveRow style={{ borderBottom: bdr }}>
        <div style={{ width: isMobile ? "100%" : 28, height: isMobile ? 0 : "auto", flexShrink:0, borderRight: isMobile ? "none" : bdr, background: T.bgSection }}/>
        <ResponsiveSection style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"4px 6px" }}>
          <span style={{ ...labelStyle, color: T.primary }}>21 Identity &amp; nationality of active means of transport crossing border</span>
          <div style={{ display:"flex", gap:6 }}>
            <EF value={d.borderId} onChange={v=>upd("borderId",v)} style={{ flex:1 }}/>
            <ACF value={d.borderNat} onChange={v=>upd("borderNat",v)}
              onSelect={it=>upd("borderNat",it.code)} items={COUNTRIES} width={68}/>
          </div>
        </ResponsiveSection>
        <ResponsiveSection desktopWidth="240px" minWidth="240px" style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"4px 6px" }}>
          <span style={{ ...labelStyle, color: T.primary }}>22 Currency &amp; total amount invoiced</span>
          <div style={{ display:"flex", gap:4, alignItems:"center" }}>
            <ACF value={d.invCurrency} onChange={v=>upd("invCurrency",v)}
              onSelect={it=>upd("invCurrency",it.code)} items={COUNTRIES} width={70}/>
            <EF value={d.invAmtFCX} onChange={v=>upd("invAmtFCX",v)} style={{ flex:1, textAlign:"right" }}/>
            <input type="checkbox" style={{ flexShrink:0, minHeight: isMobile ? 44 : "auto" }}/>
          </div>
        </ResponsiveSection>
        <ResponsiveSection desktopWidth="130px" minWidth="130px" style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"4px 6px" }}>
          <span style={{ ...labelStyle, color: T.primary }}>23 Exch. rate</span>
          <EF value={d.invRate} onChange={v=>upd("invRate",v)} style={{ textAlign:"right" }}/>
        </ResponsiveSection>
        <ResponsiveSection desktopWidth="140px" minWidth="140px" style={{ background:"#fff", padding:"4px 6px" }}>
          <span style={{ ...labelStyle, color: T.primary }}>24 Nature of transaction</span>
        </ResponsiveSection>
      </ResponsiveRow>

      {/* ── ROW: 25 | 26 | 30 | 28 ── */}
      <ResponsiveRow style={{ borderBottom: bdr }}>
        <div style={{ width: isMobile ? "100%" : 28, height: isMobile ? 0 : "auto", flexShrink:0, borderRight: isMobile ? "none" : bdr, background: T.bgSection }}/>
        <ResponsiveSection desktopWidth="170px" minWidth="170px" style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"4px 6px" }}>
          <span style={{ ...labelStyle, color: T.primary }}>25 Mode of transport at border</span>
          <ACF value={d.transportMode} onChange={v=>upd("transportMode",v)}
            onSelect={it=>upd("transportMode",it.code)} items={TRANSPORT}/>
        </ResponsiveSection>
        <ResponsiveSection desktopWidth="170px" minWidth="170px" style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"4px 6px" }}>
          <span style={{ ...labelStyle, color: T.primary }}>26 Inland mode of transport</span>
        </ResponsiveSection>
        <ResponsiveSection desktopWidth="260px" minWidth="260px" style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"4px 6px" }}>
          <span style={{ ...labelStyle, color: T.primary }}>30 Location of goods</span>
          <ACF value={d.locationGoods} onChange={v=>upd("locationGoods",v)}
            onSelect={it=>upd("locationGoods",it.code)} items={LOCATIONS}/>
        </ResponsiveSection>
        <ResponsiveSection style={{ background:"#fff", padding:"4px 6px" }}>
          <span style={{ ...labelStyle, color: T.primary }}>28 Financial &amp; banking data</span>
          <span style={{ ...labelStyle, color: T.textMuted }}>Bank Code / Terms of payment</span>
        </ResponsiveSection>
      </ResponsiveRow>

      {/* ── ROW: 29 Office of entry ── */}
      <ResponsiveRow style={{ borderBottom:`2px solid ${T.primary}` }}>
        <div style={{ width: isMobile ? "100%" : 28, height: isMobile ? 0 : "auto", flexShrink:0, borderRight: isMobile ? "none" : bdr, background: T.bgSection }}/>
        <ResponsiveSection desktopWidth="480px" minWidth="480px" style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"4px 6px" }}>
          <span style={{ ...labelStyle, color: T.primary }}>29 Office of entry</span>
          <div style={{ display:"flex", gap:6 }}>
            <ACF value={d.officeCode} onChange={v=>upd("officeCode",v)}
              onSelect={selOff("officeCode","officeName")} items={CUSTOMS_OFFICES} width={90}/>
            <EF value={d.officeName} onChange={v=>upd("officeName",v)} style={{ flex:1 }}/>
          </div>
        </ResponsiveSection>
        <ResponsiveSection style={{ background:"#fff", padding:"4px 6px" }}>
          <span style={{ ...labelStyle, color: T.primary }}>Location of goods</span>
        </ResponsiveSection>
      </ResponsiveRow>

      {/* ── ITEMS ── */}
      {d.items.map((item, idx) => (
        <ItemRow key={item.num} item={item} idx={idx}
          upd={(f,v)=>upd("items",d.items.map((it,i)=>i===idx?{...it,[f]:v}:it))}/>
      ))}

      <AccountingRows d={d} upd={upd}/>
    </div>
  );
}

/* ─── Item Row ─── */
function ItemRow({ item, idx, upd }) {
  const bdr = `1px solid ${T.border}`;
  const isMobile = useMediaQuery("(max-width:768px)");
  const prevDoc = item.summDecl
    ? `${item.summDecl}${item.summDeclSl ? "  S/L  "+item.summDeclSl : "  S/L"}`
    : "S/L";

  return (
    <div style={{ borderBottom:`2px solid #e5e7eb`, background: isMobile ? "#fff" : "transparent", padding: isMobile ? "8px" : 0, borderRadius: isMobile ? T.radiusMd : 0, boxShadow: isMobile ? T.shadow : "none", margin: isMobile ? "12px 0" : 0 }}>
      {/* Item header band */}
      <div style={{ ...sectionHdr, borderTop:`2px solid ${T.primary}` }}>
        <span style={{ background: T.primary, color:"#fff", borderRadius:"50%",
          width:18, height:18, display:"inline-flex", alignItems:"center", justifyContent:"center",
          fontSize:10, fontWeight:700, flexShrink:0 }}>{item.num}</span>
        <span style={{ color: T.primary, fontWeight:700, fontSize:12 }}>Item {item.num}</span>
        <span style={{ color: T.textMuted, fontSize:11, marginLeft:4 }}>
          {item.commCode && `HS: ${item.commCode}`}
          {item.descGoods && ` — ${item.descGoods.slice(0,60)}`}
        </span>
      </div>

      {/* 31 Packages | 32 Item | 33 Commodity cluster */}
      <ResponsiveRow style={{ borderBottom: bdr }}>
        {/* 31 label col */}
        <div style={{ width: isMobile ? "100%" : 28, height: isMobile ? 24 : "auto", flexShrink:0, borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background: T.bgSection,
          display:"flex", alignItems:"flex-start", justifyContent:"center", paddingTop:4 }}>
          <span style={{ fontSize:9, fontWeight:700, color: T.primary, writingMode: isMobile ? "horizontal-tb" : "vertical-rl", transform: isMobile ? "none" : "rotate(180deg)" }}>31</span>
        </div>

        {/* Packages / marks */}
        <ResponsiveSection style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"4px 6px" }}>
          <span style={{ ...labelStyle, color: T.primary }}>31 Packages &amp; description of goods — Marks &amp; numbers — Containers</span>
          <div style={{ display:"flex", gap:6, marginBottom:4 }}>
            <span style={{ ...labelStyle, color: T.textMuted, marginBottom:0, alignSelf:"center" }}>Marks &amp; No.</span>
            <EF value={item.marks} onChange={v=>upd("marks",v)} style={{ flex:1 }}/>
          </div>
          <div style={{ display:"flex", flexWrap: "wrap", gap:6 }}>
            <span style={{ ...labelStyle, color: T.textMuted, marginBottom:0, alignSelf:"center" }}>Nbr &amp; Kind</span>
            <EF value={item.numPkgs} onChange={v=>upd("numPkgs",v)} style={{ width:44 }}/>
            <ACF value={item.kindCode} onChange={v=>upd("kindCode",v)}
              onSelect={it=>{upd("kindCode",it.code);upd("kindName",it.name);}}
              items={PACKAGES} width={50}/>
            <EF value={item.kindName} onChange={v=>upd("kindName",v)} style={{ flex: isMobile ? "1 1 100%" : 1 }}/>
          </div>
        </ResponsiveSection>

        {/* Right cluster */}
        <ResponsiveSection desktopWidth="540px" minWidth="540px" style={{ display:"flex", flexDirection:"column" }}>
          <ResponsiveRow style={{ borderBottom: bdr }}>
            <ResponsiveSection desktopWidth="80px" minWidth="80px" style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"4px 6px" }}>
              <span style={{ ...labelStyle, color: T.primary }}>32 Item No.</span>
              <EF value={String(item.num)} onChange={v=>upd("num",v)}/>
            </ResponsiveSection>
            <ResponsiveSection style={{ background:"#fff", padding:"4px 6px" }}>
              <span style={{ ...labelStyle, color: T.primary }}>33 Commodity code</span>
              <div style={{ display:"flex", gap:6 }}>
                <EF value={item.commCode} onChange={v=>upd("commCode",v)} style={{ flex:1 }}/>
                <EF value={item.prec1} onChange={v=>upd("prec1",v)} style={{ width:44 }}/>
              </div>
            </ResponsiveSection>
          </ResponsiveRow>
          <ResponsiveRow style={{ borderBottom: bdr }}>
            <ResponsiveSection desktopWidth="140px" minWidth="140px" style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"4px 6px" }}>
              <span style={{ ...labelStyle, color: T.primary }}>34 Country of origin</span>
              <ACF value={item.origCode} onChange={v=>upd("origCode",v)}
                onSelect={it=>upd("origCode",it.code)} items={COUNTRIES}/>
            </ResponsiveSection>
            <ResponsiveSection desktopWidth="190px" minWidth="190px" style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"4px 6px" }}>
              <span style={{ ...labelStyle, color: T.primary }}>35 Gross mass (kg)</span>
              <EF value={item.grossWt} onChange={v=>upd("grossWt",v)} style={{ textAlign:"right" }}/>
            </ResponsiveSection>
            <ResponsiveSection style={{ background:"#fff", padding:"4px 6px" }}>
              <span style={{ ...labelStyle, color: T.primary }}>36 Preference</span>
            </ResponsiveSection>
          </ResponsiveRow>
          <ResponsiveRow style={{ borderBottom: bdr }}>
            <ResponsiveSection desktopWidth="140px" minWidth="140px" style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"4px 6px" }}>
              <span style={{ ...labelStyle, color: T.primary }}>37 Procedure</span>
              <div style={{ display:"flex", gap:4 }}>
                <ACF value={item.extProc} onChange={v=>upd("extProc",v)}
                  onSelect={it=>upd("extProc",it.code)} items={PROCEDURES} width={60}/>
                <EF value={item.natProc} onChange={v=>upd("natProc",v)} style={{ width:50 }}/>
              </div>
            </ResponsiveSection>
            <ResponsiveSection desktopWidth="190px" minWidth="190px" style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"4px 6px" }}>
              <span style={{ ...labelStyle, color: T.primary }}>38 Net mass (kg)</span>
              <EF value={item.netWt} onChange={v=>upd("netWt",v)} style={{ textAlign:"right" }}/>
            </ResponsiveSection>
            <ResponsiveSection style={{ background:"#fff", padding:"4px 6px" }}>
              <span style={{ ...labelStyle, color: T.primary }}>39 Quota</span>
            </ResponsiveSection>
          </ResponsiveRow>
          <ResponsiveSection style={{ background:"#fff", padding:"4px 6px" }}>
            <span style={{ ...labelStyle, color: T.primary }}>40 Summary declaration / Previous document</span>
            <div style={{ display:"flex", gap:6 }}>
              <EF value={prevDoc} onChange={v=>upd("summDecl",v)} style={{ flex:1 }}/>
              <span style={{ ...labelStyle, marginBottom:0, alignSelf:"center", color: T.textMuted }}>S/L</span>
            </div>
          </ResponsiveSection>
        </ResponsiveSection>
      </ResponsiveRow>

      {/* Container desc | 41/42/43/45/46 */}
      <ResponsiveRow style={{ borderBottom: bdr }}>
        <div style={{ width: isMobile ? "100%" : 28, height: isMobile ? 0 : "auto", flexShrink:0, borderRight: isMobile ? "none" : bdr, background: T.bgSection }}/>
        <ResponsiveSection style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"4px 6px" }}>
          <span style={{ ...labelStyle, color: T.primary }}>Containers No(s) — Description of goods</span>
          <EF value={item.descGoods} onChange={v=>upd("descGoods",v)} multiline rows={2}
            style={{ height:"auto", marginBottom:4, marginTop:2 }}/>
          <EF value={item.commDesc} onChange={v=>upd("commDesc",v)} multiline rows={2}
            style={{ height:"auto", fontWeight:600 }}/>
        </ResponsiveSection>
        <ResponsiveSection desktopWidth="540px" minWidth="540px" style={{ display:"flex", flexDirection:"column" }}>
          <ResponsiveRow style={{ borderBottom: bdr }}>
            <ResponsiveSection style={{ borderRight: bdr, background:"#fff", padding:"4px 6px" }}>
              <span style={{ ...labelStyle, color: T.primary }}>41 Supplementary units</span>
            </ResponsiveSection>
            <ResponsiveSection desktopWidth="180px" minWidth="180px" style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"4px 6px" }}>
              <span style={{ ...labelStyle, color: T.primary }}>42 Item price</span>
              <EF value={item.itemPrice} onChange={v=>upd("itemPrice",v)} style={{ textAlign:"right" }}/>
            </ResponsiveSection>
            <ResponsiveSection desktopWidth="90px" minWidth="90px" style={{ background:"#fff", padding:"4px 6px" }}>
              <span style={{ ...labelStyle, color: T.primary }}>43 VM code</span>
            </ResponsiveSection>
          </ResponsiveRow>
          <ResponsiveRow style={{ borderBottom: bdr }}>
            <ResponsiveSection style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"4px 6px" }}>
              <span style={{ ...labelStyle, color: T.primary }}>AI Code</span>
            </ResponsiveSection>
            <ResponsiveSection desktopWidth="270px" minWidth="270px" style={{ background:"#fff", padding:"4px 6px" }}>
              <span style={{ ...labelStyle, color: T.primary }}>45 Adjustment</span>
              <EF value={item.adj} onChange={v=>upd("adj",v)} style={{ textAlign:"right" }}/>
            </ResponsiveSection>
          </ResponsiveRow>
          <ResponsiveRow>
            <ResponsiveSection style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"4px 6px" }}>
              <span style={{ ...labelStyle, color: T.primary }}>41bis Write-off units</span>
            </ResponsiveSection>
            <ResponsiveSection desktopWidth="270px" minWidth="270px" style={{ background:"#fff", padding:"4px 6px" }}>
              <span style={{ ...labelStyle, color: T.primary }}>46 Statistical value</span>
              <EF value={item.statVal} onChange={v=>upd("statVal",v)} style={{ textAlign:"right" }}/>
            </ResponsiveSection>
          </ResponsiveRow>
        </ResponsiveSection>
      </ResponsiveRow>

      {/* 44 Add info | 47 Tax calculation */}
      <ResponsiveRow style={{ borderBottom: bdr }}>
        <div style={{ width: isMobile ? "100%" : 28, height: isMobile ? 24 : "auto", flexShrink:0, borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background: T.bgSection,
          display:"flex", alignItems:"flex-start", justifyContent:"center", paddingTop:4 }}>
          <span style={{ fontSize:9, fontWeight:700, color: T.primary, writingMode: isMobile ? "horizontal-tb" : "vertical-rl", transform: isMobile ? "none" : "rotate(180deg)" }}>44</span>
        </div>
        <ResponsiveSection desktopWidth="250px" minWidth="250px" style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"4px 6px" }}>
          <span style={{ ...labelStyle, color: T.primary }}>44 Additional info / Documents / Certificates &amp; Authorizations</span>
          <div style={{ display:"flex", gap:6, marginBottom:4 }}>
            <span style={{ ...labelStyle, marginBottom:0, alignSelf:"center", color: T.textMuted }}>Licence No.</span>
            <EF value={item.licNo} onChange={v=>upd("licNo",v)} style={{ flex:1 }}/>
          </div>
          <div style={{ display:"flex", gap:20, marginBottom:2 }}>
            <span style={{ ...labelStyle, color: T.textMuted, marginBottom:0 }}>D.Val</span>
            <span style={{ ...labelStyle, color: T.textMuted, marginBottom:0 }}>D.Qty</span>
          </div>
          <EF value={item.valueItem} onChange={v=>upd("valueItem",v)} multiline rows={2}
            style={{ height:"auto", marginTop:2 }}/>
          <span style={{ ...labelStyle, color: T.textMuted, marginTop:2 }}>A.D.</span>
        </ResponsiveSection>

        {/* 47 Tax calculation grid */}
        <ResponsiveSection style={{ display:"flex", flexDirection:"column", overflowX: "auto" }}>
          <div style={{ minWidth: isMobile ? 500 : "auto" }}>
            {/* Header */}
            <div style={{ display:"flex", background: T.bgSection, borderBottom: bdr }}>
              <div style={{ width:60, borderRight: bdr, padding:"4px 6px" }}>
                <span style={{ ...labelStyle, color: T.primary }}>47 Taxes</span>
              </div>
              {["Type","Tax base","Rate","Amount","MP"].map((h,i) => (
                <div key={h} style={{ flex:1, padding:"4px 6px", borderRight: i<4 ? bdr : "none" }}>
                  <span style={{ fontSize:10, fontWeight:600, color: T.textMuted }}>{h}</span>
                </div>
              ))}
            </div>
            {/* Tax rows */}
            {Array.from({length:Math.max(item.taxLines.length,4)},(_,i) => {
              const tl = item.taxLines[i]||{};
              return (
                <div key={i} style={{ display:"flex", borderBottom:`1px solid #f3f4f6`, minHeight:24 }}>
                  <div style={{ width:60, borderRight: bdr, background: T.bgSection }}/>
                  {["code","base","rate","amount","mp"].map((f,j) => (
                    <div key={j} style={{ flex:1, borderRight: j<4 ? `1px solid #f3f4f6` : "none", background:"#fff" }}>
                      <input value={tl[f]||""} onChange={e=>{
                        const nl=[...item.taxLines]; if(!nl[i]) nl[i]={};
                        nl[i]={...nl[i],[f]:e.target.value}; upd("taxLines",nl);
                      }} style={{ width:"100%", border:"none", outline:"none", background:"transparent",
                        fontFamily: T.font, fontSize:11, fontWeight:500, color: T.text,
                        padding:"2px 6px", textAlign:j===1||j===3?"right":"left" }}/>
                    </div>
                  ))}
                </div>
              );
            })}
            {/* Total row */}
            <div style={{ ...sectionHdr, justifyContent:"flex-end", padding:"3px 10px" }}>
              <span style={{ fontSize:11, fontWeight:600, color: T.primary }}>Total</span>
            </div>
          </div>
        </ResponsiveSection>
      </ResponsiveRow>
    </div>
  );
}

/* ─── Accounting / Signature ─── */
function AccountingRows({ d, upd }) {
  const bdr = `1px solid ${T.border}`;
  const isMobile = useMediaQuery("(max-width:768px)");
  return (
    <div>
      {/* Global tax grid + B Accounting */}
      <ResponsiveRow style={{ borderBottom: bdr }}>
        <div style={{ width: isMobile ? "100%" : 28, height: isMobile ? 24 : "auto", flexShrink:0, borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background: T.bgSection,
          display:"flex", alignItems:"flex-start", justifyContent:"center", paddingTop:4 }}>
          <span style={{ fontSize:9, fontWeight:700, color: T.primary, writingMode: isMobile ? "horizontal-tb" : "vertical-rl", transform: isMobile ? "none" : "rotate(180deg)" }}>47</span>
        </div>
        <ResponsiveSection style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", overflowX: "auto" }}>
          <div style={{ minWidth: isMobile ? 500 : "auto" }}>
            <div style={{ display:"flex", background: T.bgSection, borderBottom: bdr }}>
              {["Type","Tax base","Rate","Amount","MP"].map((h,i) => (
                <div key={h} style={{ flex:1, padding:"4px 6px", borderRight: i<4 ? bdr : "none" }}>
                  <span style={{ fontSize:10, fontWeight:600, color: T.textMuted }}>{h}</span>
                </div>
              ))}
            </div>
            {Array.from({length:7},(_,i) => (
              <div key={i} style={{ display:"flex", borderBottom:`1px solid #f3f4f6`, minHeight:20 }}>
                {[0,1,2,3,4].map(j=>
                  <div key={j} style={{ flex:1, borderRight:j<4?`1px solid #f3f4f6`:"none", background:"#fff" }}/>
                )}
              </div>
            ))}
            <div style={{ ...sectionHdr, justifyContent:"flex-end", padding:"3px 10px" }}>
              <span style={{ fontSize:11, fontWeight:600, color: T.primary }}>Total</span>
            </div>
          </div>
        </ResponsiveSection>

        {/* B Accounting Details */}
        <ResponsiveSection desktopWidth="460px" minWidth="460px" style={{ display:"flex", flexDirection:"column" }}>
          <ResponsiveRow style={{ borderBottom: bdr }}>
            <ResponsiveSection style={{ borderRight: bdr, background:"#fff", padding:"4px 6px" }}>
              <span style={{ ...labelStyle, color: T.primary }}>48 Account code / Deferred payment ref.</span>
              <EF value={d.deferredRef} onChange={v=>upd("deferredRef",v)}/>
            </ResponsiveSection>
            <ResponsiveSection style={{ background:"#fff", padding:"4px 6px" }}>
              <span style={{ ...labelStyle, color: T.primary }}>49 Identification of warehouse</span>
            </ResponsiveSection>
          </ResponsiveRow>
          <div style={{ background: T.primary, color:"#fff", padding:"4px 10px", fontSize:11, fontWeight:600 }}>
            B — ACCOUNTING DETAILS
          </div>
          <div style={{ padding:"4px 10px", background:"#fff" }}>
            {[
              ["Mode of payment",   "paymentMode", true],
              ["Assessment number", null, false, "____________  /  Date ____________"],
              ["Receipt number",    null, false, "____________  Date ____________"],
              ["Guarantee",         null, false, "____________________  Date ____________"],
              ["Total fees",        null, false, "____________________ ZWG"],
              ["Total declaration", null, false, "____________________ ZWG"],
            ].map(([lbl,f,ed,pl]) => (
              <div key={lbl} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                borderBottom:`1px solid #f3f4f6`, padding:"4px 0", minHeight:24 }}>
                <span style={{ fontSize:11, fontWeight:600, color: T.textLabel }}>{lbl}</span>
                {ed ? <EF value={d[f]||""} onChange={v=>upd(f,v)} style={{ width: isMobile ? "50%" : 180, textAlign:"right" }}/>
                    : <span style={{ fontSize:10, color: T.textMuted, fontFamily: T.font }}>{pl}</span>}
              </div>
            ))}
          </div>
        </ResponsiveSection>
      </ResponsiveRow>

      {/* 50 Principal | 51 Transit | C Office */}
      <ResponsiveRow style={{ borderBottom: bdr, minHeight:100 }}>
        <div style={{ width: isMobile ? "100%" : 28, height: isMobile ? 0 : "auto", flexShrink:0, borderRight: isMobile ? "none" : bdr, background: T.bgSection }}/>
        <ResponsiveSection style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"6px 8px" }}>
          <div style={{ display:"flex", gap:8, alignItems:"baseline", marginBottom:8 }}>
            <span style={{ ...labelStyle, color: T.primary, marginBottom:0 }}>50 Principal</span>
            <span style={{ ...labelStyle, color: T.textMuted, marginBottom:0 }}>No.</span>
            <div style={{ flex:1, borderBottom:`1px solid ${T.border}`, marginLeft:4 }}/>
          </div>
          <div style={{ marginTop:32 }}>
            <span style={{ ...labelStyle, color: T.textMuted }}>Signature</span>
            <div style={{ borderBottom:`1px solid ${T.border}`, width:"55%", marginTop:28 }}/>
          </div>
        </ResponsiveSection>
        <ResponsiveSection desktopWidth="200px" minWidth="200px" style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"6px 8px" }}>
          <span style={{ ...labelStyle, color: T.primary }}>51 Intended offices of transit &amp; country</span>
          <div style={{ marginTop:8 }}>
            <div style={{ display:"flex", gap:4, marginBottom:6 }}>
              <span style={{ ...labelStyle, marginBottom:0, alignSelf:"center", color: T.textMuted }}>Represented by</span>
              <div style={{ flex:1, borderBottom:`1px solid ${T.border}` }}/>
            </div>
            <div style={{ display:"flex", gap:4 }}>
              <span style={{ ...labelStyle, marginBottom:0, alignSelf:"center", color: T.textMuted }}>Place &amp; date</span>
              <div style={{ flex:1, borderBottom:`1px solid ${T.border}` }}/>
            </div>
          </div>
        </ResponsiveSection>
        <ResponsiveSection style={{ background:"#fff", padding:"6px 8px" }}>
          <span style={{ ...labelStyle, color: T.primary }}>C — OFFICE OF DEPARTURE</span>
          <div style={{ border:`1px dashed ${T.border}`, borderRadius: T.radius,
            margin:"6px 0", minHeight:60, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:10, color: T.textMuted }}>Official stamp area</span>
          </div>
        </ResponsiveSection>
      </ResponsiveRow>

      {/* Transit rows */}
      <ResponsiveRow style={{ borderBottom: bdr, minHeight:30, overflowX: "auto" }}>
        <div style={{ width: isMobile ? 0 : 28, borderRight: isMobile ? "none" : bdr, background: T.bgSection }}/>
        <div style={{ flex:1, display:"flex", minWidth: isMobile ? 500 : "auto" }}>
          {[0,1,2,3,4].map(i=>
            <div key={i} style={{ flex:1, borderRight:i<4?bdr:"none", background:"#fff", minHeight: 30 }}/>
          )}
        </div>
      </ResponsiveRow>

      {/* 52 | 53 */}
      <ResponsiveRow style={{ borderBottom: bdr }}>
        <div style={{ width: isMobile ? "100%" : 28, height: isMobile ? 0 : "auto", borderRight: isMobile ? "none" : bdr, background: T.bgSection }}/>
        <ResponsiveSection style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"4px 6px" }}>
          <span style={{ ...labelStyle, color: T.primary }}>52 Guarantee</span>
          <span style={{ ...labelStyle, color: T.textMuted }}>Account</span>
          <div style={{ borderBottom: bdr, marginTop:4 }}/>
        </ResponsiveSection>
        <ResponsiveSection desktopWidth="80px" minWidth="80px" style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"4px 6px" }}>
          <span style={{ ...labelStyle, color: T.primary }}>Code</span>
        </ResponsiveSection>
        <ResponsiveSection style={{ background:"#fff", padding:"4px 6px" }}>
          <span style={{ ...labelStyle, color: T.primary }}>53 Office of destination &amp; country</span>
        </ResponsiveSection>
      </ResponsiveRow>

      {/* D Control */}
      <ResponsiveRow style={{ minHeight:100 }}>
        <div style={{ width: isMobile ? "100%" : 28, height: isMobile ? 0 : "auto", borderRight: isMobile ? "none" : bdr, background: T.bgSection }}/>
        <ResponsiveSection style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"6px 8px" }}>
          <span style={{ ...labelStyle, color: T.primary }}>D — CONTROL BY OFFICE OF DESTINATION</span>
          <span style={{ ...labelStyle, color: T.textMuted, marginTop:4 }}>Stamp:</span>
          <div style={{ marginTop:28, borderBottom:`1px solid ${T.border}`, width:"50%" }}/>
          <span style={{ fontSize:11, fontFamily: T.font, marginTop:4, display:"block" }}>Signature</span>
        </ResponsiveSection>
        <ResponsiveSection style={{ borderRight: isMobile ? "none" : bdr, borderBottom: isMobile ? bdr : "none", background:"#fff", padding:"6px 8px" }}>
          <span style={{ ...labelStyle, color: T.primary }}>54 Place and date</span>
          <EF value={d.controlOfficer||""} onChange={v=>upd("controlOfficer",v)}
            style={{ fontWeight:600, marginTop:36 }}/>
        </ResponsiveSection>
        <ResponsiveSection style={{ background:"#fff" }}/>
      </ResponsiveRow>
    </div>
  );
}

/* ─── Valuation Note ─── */
function ValNote({ d, upd }) {
  const isMobile = useMediaQuery("(max-width:768px)");
  const rows = [
    { lbl:"Invoice value", a:"invAmtFCX", f:"invCurrency", r:"invRate", z:"invAmtZWG" },
    { lbl:"Freight 1 (import)", a:null, f:null, r:null, z:null },
    { lbl:"Freight 2", a:"frtAmtFCX", f:"invCurrency", r:"invRate", z:"frtAmtZWG" },
    { lbl:"Insurance (import)", a:"insAmtFCX", f:"invCurrency", r:"invRate", z:"insAmtZWG" },
    { lbl:"Other costs (import)", a:null, f:null, r:null, z:null },
    { lbl:"Deductions", a:null, f:null, r:null, z:null },
  ];
  return (
    <div style={{ background:"#fff", padding:"0 0 20px" }}>
      <div style={{ background: T.primary, color:"#fff", padding:"6px 14px", fontWeight:600, fontSize:13 }}>
        SAD — Valuation Note — General Segment
      </div>
      <div style={{ padding: isMobile ? "12px 8px" : "16px 20px" }}>
        <div style={{ marginBottom:8, display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:12, fontWeight:600, color: T.textLabel }}>Working mode:</span>
          <span style={{ fontSize:12, fontWeight:500 }}>Apportionment per value</span>
        </div>
        <div style={{ border:`1px solid ${T.border}`, borderRadius: T.radiusMd, padding: isMobile ? "8px" : 16, overflowX: "auto" }}>
          <div style={{ minWidth: 710 }}>
            <div style={{ display:"grid", gridTemplateColumns:"260px 100px 30px 80px 120px 120px", gap:6, marginBottom:8 }}>
              {["","Amount","","FCX Code","Exchange Rate","Amount in ZWG"].map((h,i) => (
                <div key={i} style={{ fontSize:11, fontWeight:600, color: T.textMuted }}>{h}</div>
              ))}
            </div>
            {rows.map(({lbl,a,f,r,z},i) => (
              <div key={i} style={{ display:"grid", gridTemplateColumns:"260px 100px 30px 80px 120px 120px", gap:6,
                borderBottom:`1px solid #f3f4f6`, padding:"4px 0", alignItems:"center" }}>
                <span style={{ fontSize:12, fontWeight:500, color: T.textLabel }}>{lbl}</span>
                {a ? <EF value={d[a]||""} onChange={e=>upd(a,e)} style={{ textAlign:"right" }}/>
                   : <span style={{ fontSize:11, textAlign:"right", color: T.textMuted }}>0.00</span>}
                <span style={{ textAlign:"center", fontSize:11, color: T.textMuted }}>in</span>
                {f ? <EF value={d[f]||""} onChange={e=>upd(f,e)} style={{ textAlign:"center" }}/>
                   : <span/>}
                {r ? <EF value={d[r]||""} onChange={e=>upd(r,e)} style={{ textAlign:"right" }}/>
                   : <span style={{ fontSize:11, textAlign:"right", color: T.textMuted }}>0.0000</span>}
                {z ? <EF value={d[z]||""} onChange={e=>upd(z,e)} style={{ textAlign:"right", fontWeight:600 }}/>
                   : <span style={{ fontSize:11, fontWeight:600, textAlign:"right", color: T.textMuted }}>0.00</span>}
              </div>
            ))}
            <div style={{ marginTop:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                <span style={{ fontSize:12, fontWeight:600, color: T.textLabel }}>Total gross mass</span>
                <div style={{ borderBottom:`1px solid ${T.border}`, minWidth:120 }}/>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <span style={{ fontSize:12, fontWeight:600, color: T.textLabel }}>Total Costs</span>
                <EF value={d.totalCost||""} onChange={v=>upd("totalCost",v)} style={{ width:120, textAlign:"right", fontWeight:600 }}/>
              </div>
            </div>
            <div style={{ marginTop:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <span style={{ fontSize:12, fontWeight:600, color: T.textLabel }}>Delivery terms</span>
                <EF value={d.delivCode||""} onChange={v=>upd("delivCode",v)} style={{ width:70 }}/>
                <EF value={d.delivPlace||""} onChange={v=>upd("delivPlace",v)} style={{ width:130 }}/>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <span style={{ fontSize:12, fontWeight:600, color: T.textLabel }}>CIF value</span>
                <EF value={d.totalCIF||""} onChange={v=>upd("totalCIF",v)} style={{ width:120, textAlign:"right", fontWeight:600 }}/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Status bar ─── */
function StatusBar({ fileName }) {
  const [time, setTime] = useState(() => {
    const n = new Date();
    return `${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}`;
  });
  const isMobile = useMediaQuery("(max-width:768px)");
  useEffect(() => {
    const t = setInterval(() => {
      const n = new Date();
      setTime(`${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}`);
    }, 30000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ background:"#f0f0f0", borderTop:`1px solid ${T.border}`,
      padding:"3px 12px", display:"flex", alignItems:"center",
      justifyContent:"space-between", fontSize:11, fontFamily: T.font, flexShrink:0, height: isMobile ? "auto" : 26, minHeight: 26, flexWrap: "wrap", gap: 6 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <FileText size={12} color={T.textMuted}/>
          <span style={{ color: T.textMuted, maxWidth: isMobile ? 140 : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fileName || "Detailed Declaration — New"}</span>
        </div>
        <span style={{ color: T.textMuted }}>|</span>
        <span style={{ color: T.success, fontWeight:600 }}>Ready</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:4, color: T.textMuted }}>
          <Lock size={11}/>
          <span>Authenticated</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:4, color: T.textMuted }}>
          <Clock size={11}/>
          <span style={{ fontWeight:600 }}>{time}</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════════════════ */
export default function ZimraBOEViewer() {
  const [fd, setFd] = useState(null);
  const [tab, setTab] = useState("S.A.D.");
  const [dragging, setDrag] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef();
  const isMobile = useMediaQuery("(max-width:768px)");

  const upd = (f, v) => setFd(p => ({ ...p, [f]: v }));

  const loadFile = f => {
    if (!f) return; setError("");
    setFileName(f.name);
    const r = new FileReader();
    r.onload = e => {
      try { setFd(parseXML(e.target.result)); setTab("S.A.D."); }
      catch(err) { setError("XML parse error: " + err.message); }
    };
    r.readAsText(f);
  };

  const TABS = ["S.A.D.", "Val. Note", "Asmt. Notice", "Info. Page", "Scan. Doc.", "ASW Scan. Doc."];

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh",
      background: T.bg, fontFamily: T.font, fontSize:12, overflow:"hidden" }}>

      {/* ── Window title bar — Windows 11 style ── */}
      <div style={{ background:"#1c1c1c", padding:"6px 12px",
        display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, height:36 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <svg width={16} height={16} viewBox="0 0 16 16">
            <circle cx={8} cy={8} r={7} fill="#2563eb"/>
            <circle cx={8} cy={8} r={4} fill="#fff"/>
            <circle cx={8} cy={8} r={2} fill="#2563eb"/>
          </svg>
          <span style={{ fontSize:12, color:"#e0e0e0", fontWeight:500, maxWidth: isMobile ? 180 : "none", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>ASYCUDAWorld — shr-thchavunduka</span>
        </div>
        <div style={{ display:"flex", gap:0 }}>
          {[
            { icon: Minus, hov:"#333" },
            { icon: Square, hov:"#333" },
            { icon: X, hov:"#c42b1c", danger:true },
          ].map(({icon:Icon, hov, danger},i) => {
            const [h, setH] = useState(false);
            return (
              <div key={i} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
                style={{ width:46, height:36, display:"flex", alignItems:"center", justifyContent:"center",
                  cursor:"default", background:h?(danger?"#c42b1c":"#3a3a3a"):"transparent",
                  transition:"background .1s", marginTop:-6, marginBottom:-6 }}>
                <Icon size={12} color={h&&danger?"#fff":"#c0c0c0"}/>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── App menu bar ── */}
      <div style={{ background:"#fff", borderBottom:`1px solid ${T.border}`,
        padding:"0 12px", display:"flex", gap:0, flexShrink:0, height:30, alignItems:"center", overflowX: "auto", whiteSpace: "nowrap" }}>
        {["File","Edit","View","Tools","Window","Help"].map(m => {
          const [h, setH] = useState(false);
          return (
            <span key={m} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
              style={{ cursor:"default", padding:"0 10px", height:"100%", display:"flex", alignItems:"center",
                fontSize:12, fontWeight:500, color: h ? T.primary : T.text,
                background: h ? "#f5f8ff" : "transparent", borderRadius: T.radius,
                transition:"all .1s" }}>{m}</span>
          );
        })}
      </div>

      {/* ── Inner document header ── */}
      <div style={{ background:"#fff", borderBottom:`1px solid ${T.border}`,
        padding:"6px 14px", display:"flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", justifyContent:"space-between",
        flexShrink:0, gap: isMobile ? 8 : 0, boxShadow: T.shadow }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <FileText size={15} color={T.primary}/>
          <span style={{ fontWeight:600, fontSize:13, color: T.text }}>
            Detailed Declaration — New [{fd?.year||"2026"}]
          </span>
          {fileName && !isMobile && <span style={{ fontSize:11, color: T.textMuted, fontWeight:400 }}>({fileName})</span>}
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <button onClick={() => fileRef.current?.click()}
            style={{ ...tbBtnBase, width: isMobile ? "100%" : "auto", justifyContent: "center", minHeight: isMobile ? 44 : 30, background: T.primary, color:"#fff", borderColor: T.primary, fontWeight:600 }}>
            <FolderOpen size={13}/> Load XML
          </button>
          <input ref={fileRef} type="file" accept=".xml,text/xml,application/xml" style={{
            position: 'absolute',
            left: '-9999px'
          }}
            onChange={e=>loadFile(e.target.files[0])}/>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <Toolbar onLoad={() => fileRef.current?.click()}/>

      {/* ── Canvas ── */}
      <div style={{ flex:1, overflow:"auto", background: T.bg, padding: isMobile ? "6px" : "12px" }}>

        {!fd && (
          <div style={{ display:"flex", flexDirection:"column", justifyContent:"center",
            alignItems:"center", minHeight:"70vh", gap:16, width: "100%" }}>
            <div onDrop={e=>{e.preventDefault();setDrag(false);loadFile(e.dataTransfer.files[0]);}}
              onDragOver={e=>{e.preventDefault();setDrag(true);}}
              onDragLeave={()=>setDrag(false)}
              onClick={()=>fileRef.current.click()}
              style={{ border:`2px dashed ${dragging ? T.primary : T.border}`,
                borderRadius: T.radiusMd, padding: isMobile ? "24px 16px" : "40px 28px", textAlign:"center",
                cursor:"pointer", background: dragging ? "#eff6ff" : "#fff", width: "100%", maxWidth: 400,
                transition:"all .2s", boxShadow: T.shadow }}>
              <input ref={fileRef} type="file" accept=".xml,text/xml,application/xml" style={{
                position: 'absolute',
                left: '-9999px'
              }}
                onChange={e=>loadFile(e.target.files[0])}/>
              <div style={{ marginBottom:12 }}>
                <FolderOpen size={40} color={T.primary} strokeWidth={1.5}/>
              </div>
              <div style={{ fontWeight:600, fontSize:14, color: T.text, marginBottom:4 }}>
                Upload ASYCUDA XML file
              </div>
              <div style={{ fontSize:12, color: T.textMuted }}>
                Drop a .xml Bill of Entry here, or click to browse
              </div>
            </div>
            {error && (
              <div style={{ display:"flex", alignItems:"center", gap:8, color: T.danger,
                background:"#fef2f2", border:`1px solid #fecaca`, borderRadius: T.radius,
                padding:"8px 14px", fontSize:12 }}>
                <AlertCircle size={14}/> {error}
              </div>
            )}
          </div>
        )}

        {fd && (
          <div style={{ display:"flex", gap:8, alignItems:"flex-start", width:"100%", minWidth: isMobile ? "0" : 900 }}>
            {/* Page indicator */}
            {!isMobile && (
              <div style={{ width:24, flexShrink:0, textAlign:"center" }}>
                <div style={{ width:24, height:24, display:"flex", alignItems:"center", justifyContent:"center",
                  background: T.danger, color:"#fff", fontWeight:700, fontSize:11, borderRadius: T.radius,
                  boxShadow:"0 1px 4px rgba(0,0,0,0.15)" }}>1</div>
              </div>
            )}

            {/* Form panel */}
            <div style={{ flex:1, minWidth:0, background:"#fff",
              border:`1px solid ${T.border}`, borderRadius: T.radiusMd, boxShadow: T.shadow,
              overflow:"hidden" }}>

              <ZimraHeader/>
              <Barcode value={fd.declarantRef}/>

              {/* Tab content */}
              {tab === "S.A.D." && (
                <SadForm d={fd} upd={(f,v) => {
                  if (f==="items") setFd(p=>({...p,items:v}));
                  else upd(f,v);
                }}/>
              )}
              {tab === "Val. Note" && <ValNote d={fd} upd={upd}/>}
              {tab === "Asmt. Notice" && (
                <div style={{ padding: isMobile ? 10 : 20, background:"#fff" }}>
                  <div style={{ background: T.primary, color:"#fff", padding:"6px 14px",
                    fontWeight:600, fontSize:13, borderRadius:`${T.radius} ${T.radius} 0 0`, marginBottom:0 }}>
                    SAD — Assessment Notice
                  </div>
                  <div style={{ border:`1px solid ${T.border}`, borderTop:"none", borderRadius:`0 0 ${T.radius} ${T.radius}`,
                    padding:24, textAlign:"center" }}>
                    <div style={{ display:"inline-flex", alignItems:"center", gap:8,
                      background:"#fef3c7", border:`1px solid #fcd34d`, borderRadius: T.radius,
                      padding:"10px 20px", color:"#92400e", fontWeight:600, fontSize:13 }}>
                      <AlertCircle size={16} color="#f59e0b"/>
                      DECLARATION NOT YET ASSESSED
                    </div>
                  </div>
                </div>
              )}
              {tab === "Info. Page" && (
                <div style={{ padding:24, color: T.textMuted, fontSize:12 }}>
                  Info Page — no additional information available in this XML.
                </div>
              )}
              {tab === "Scan. Doc." && (
                <div style={{ padding:24, color: T.textMuted, fontSize:12 }}>
                  Scan. Doc. — attach scanned supporting documents here.
                </div>
              )}
              {tab === "ASW Scan. Doc." && (
                <div style={{ padding:24, color: T.textMuted, fontSize:12 }}>
                  ASW Scan. Doc. — single window attached scanned documents.
                </div>
              )}

              {/* Bottom tab bar */}
              <div style={{ display:"flex", overflowX: "auto", whiteSpace: "nowrap", borderTop:`2px solid ${T.primary}`,
                background: T.bgSection, padding:"4px 8px 0", gap:2, alignItems:"flex-end" }}>
                {TABS.map(t => (
                  <button key={t} onClick={()=>setTab(t)}
                    style={{ padding: isMobile ? "8px 12px" : "5px 14px", fontFamily: T.font,
                      minHeight: isMobile ? 44 : "auto",
                      border:`1px solid ${tab===t ? T.primary : T.border}`,
                      borderBottom: tab===t ? "none" : `1px solid ${T.border}`,
                      borderRadius:`${T.radius} ${T.radius} 0 0`,
                      background: tab===t ? "#fff" : T.bgSection,
                      color: tab===t ? T.primary : T.textMuted,
                      fontWeight: tab===t ? 600 : 500, fontSize:11,
                      cursor:"pointer", marginBottom: tab===t ? -2 : 0,
                      transition:"all .12s" }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <StatusBar fileName={fileName}/>
    </div>
  );
}