import { useState, useRef, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════
   DATA DICTIONARIES
   ═══════════════════════════════════════════════════════════════════ */

const CUSTOMS_OFFICES = [
  { code: "BRA", name: "Beitbridge" },
  { code: "BRN", name: "Burnside" },
  { code: "CHI", name: "Chirundu" },
  { code: "FOR", name: "Forbes Border" },
  { code: "KAR", name: "Kariba" },
  { code: "PLU", name: "Plumtree" },
  { code: "HAR", name: "Harare Airport" },
  { code: "HRC", name: "Harare City" },
  { code: "BUL", name: "Bulawayo" },
  { code: "MUT", name: "Mutare" },
  { code: "VFA", name: "Victoria Falls Airport" },
  { code: "VFB", name: "Victoria Falls Border" },
  { code: "NYA", name: "Nyamapanda" },
  { code: "KAB", name: "Kazungula Bridge" },
  { code: "MKS", name: "Mukumbura" },
  { code: "GUR", name: "Guruve" },
  { code: "KWE", name: "Kwekwe" },
  { code: "GWE", name: "Gweru" },
  { code: "MSV", name: "Masvingo" },
  { code: "CHR", name: "Chinhoyi" },
];

const LOCATIONS_OF_GOODS = [
  { code: "HARCFS", name: "Harare CFS - City" },
  { code: "HARBWA", name: "Harare Bonded Warehouse A" },
  { code: "HARBWB", name: "Harare Bonded Warehouse B" },
  { code: "BULCFS", name: "Bulawayo CFS" },
  { code: "BULBW",  name: "Bulawayo Bonded Warehouse" },
  { code: "BRDRY",  name: "Beitbridge Dry Port" },
  { code: "CHIDRP", name: "Chirundu Dry Port" },
  { code: "MUTCFS", name: "Mutare CFS" },
  { code: "HARAIRP",name: "Harare Airport Cargo" },
  { code: "VFACP",  name: "Victoria Falls Air Cargo" },
  { code: "FRBORD", name: "Forbes Border Post" },
  { code: "NYABRDR",name: "Nyamapanda Border Post" },
  { code: "HARFTZ", name: "Harare Free Trade Zone" },
  { code: "BULFTZ", name: "Bulawayo Free Trade Zone" },
  { code: "KWECFS", name: "Kwekwe CFS" },
];

const COUNTRIES = [
  { code: "AFG", name: "Afghanistan" },
  { code: "ALB", name: "Albania" },
  { code: "DZA", name: "Algeria" },
  { code: "AGO", name: "Angola" },
  { code: "ARG", name: "Argentina" },
  { code: "AUS", name: "Australia" },
  { code: "AUT", name: "Austria" },
  { code: "AZE", name: "Azerbaijan" },
  { code: "BHS", name: "Bahamas" },
  { code: "BGD", name: "Bangladesh" },
  { code: "BEL", name: "Belgium" },
  { code: "BWA", name: "Botswana" },
  { code: "BRA", name: "Brazil" },
  { code: "BFA", name: "Burkina Faso" },
  { code: "CMR", name: "Cameroon" },
  { code: "CAN", name: "Canada" },
  { code: "CPV", name: "Cape Verde" },
  { code: "CAF", name: "Central African Republic" },
  { code: "CHL", name: "Chile" },
  { code: "CHN", name: "China" },
  { code: "COG", name: "Congo" },
  { code: "COD", name: "Congo, DR" },
  { code: "CIV", name: "Cote d'Ivoire" },
  { code: "CZE", name: "Czech Republic" },
  { code: "DNK", name: "Denmark" },
  { code: "EGY", name: "Egypt" },
  { code: "ETH", name: "Ethiopia" },
  { code: "FIN", name: "Finland" },
  { code: "FRA", name: "France" },
  { code: "DEU", name: "Germany" },
  { code: "GHA", name: "Ghana" },
  { code: "GRC", name: "Greece" },
  { code: "HKG", name: "Hong Kong" },
  { code: "HUN", name: "Hungary" },
  { code: "IND", name: "India" },
  { code: "IDN", name: "Indonesia" },
  { code: "IRN", name: "Iran" },
  { code: "IRL", name: "Ireland" },
  { code: "ISR", name: "Israel" },
  { code: "ITA", name: "Italy" },
  { code: "JPN", name: "Japan" },
  { code: "JOR", name: "Jordan" },
  { code: "KEN", name: "Kenya" },
  { code: "KOR", name: "Korea, Republic of" },
  { code: "MWI", name: "Malawi" },
  { code: "MYS", name: "Malaysia" },
  { code: "MDG", name: "Madagascar" },
  { code: "MLI", name: "Mali" },
  { code: "MUS", name: "Mauritius" },
  { code: "MEX", name: "Mexico" },
  { code: "MOZ", name: "Mozambique" },
  { code: "NAM", name: "Namibia" },
  { code: "NLD", name: "Netherlands" },
  { code: "NZL", name: "New Zealand" },
  { code: "NGA", name: "Nigeria" },
  { code: "NOR", name: "Norway" },
  { code: "PAK", name: "Pakistan" },
  { code: "PHL", name: "Philippines" },
  { code: "POL", name: "Poland" },
  { code: "PRT", name: "Portugal" },
  { code: "RUS", name: "Russian Federation" },
  { code: "RWA", name: "Rwanda" },
  { code: "SAU", name: "Saudi Arabia" },
  { code: "SEN", name: "Senegal" },
  { code: "SGP", name: "Singapore" },
  { code: "ZAF", name: "South Africa" },
  { code: "ESP", name: "Spain" },
  { code: "SDN", name: "Sudan" },
  { code: "SWZ", name: "Eswatini" },
  { code: "SWE", name: "Sweden" },
  { code: "CHE", name: "Switzerland" },
  { code: "TZA", name: "Tanzania" },
  { code: "THA", name: "Thailand" },
  { code: "TUN", name: "Tunisia" },
  { code: "TUR", name: "Turkey" },
  { code: "UGA", name: "Uganda" },
  { code: "ARE", name: "United Arab Emirates" },
  { code: "GBR", name: "United Kingdom" },
  { code: "USA", name: "United States" },
  { code: "ZMB", name: "Zambia" },
  { code: "ZWE", name: "Zimbabwe" },
];

const TRANSPORT_MODES = [
  { code: "1",  name: "Sea transport" },
  { code: "2",  name: "Rail transport" },
  { code: "3",  name: "Road transport" },
  { code: "4",  name: "Air transport" },
  { code: "5",  name: "Mail" },
  { code: "6",  name: "Multimodal transport" },
  { code: "7",  name: "Fixed transport installations" },
  { code: "8",  name: "Inland waterway transport" },
  { code: "9",  name: "Own propulsion" },
];

const PROCEDURE_CODES = [
  { code: "4000", name: "Outright importation" },
  { code: "4051", name: "Outright importation after inward processing" },
  { code: "4054", name: "Outright importation after temporary importation" },
  { code: "4071", name: "Outright importation after customs warehousing" },
  { code: "4400", name: "Importation into customs warehouse" },
  { code: "5100", name: "Inward processing - suspension" },
  { code: "5300", name: "Temporary importation" },
  { code: "6100", name: "Re-exportation" },
  { code: "7100", name: "Customs warehousing" },
  { code: "1000", name: "Outright exportation" },
  { code: "1007", name: "Outright export after free zone" },
  { code: "2100", name: "Temporary exportation" },
  { code: "2144", name: "Temp export after inward processing" },
  { code: "3100", name: "Re-importation" },
  { code: "3151", name: "Re-importation after inward processing" },
  { code: "9500", name: "Transit" },
];

const PACKAGE_TYPES = [
  { code: "BG",  name: "Bag" },
  { code: "BL",  name: "Bale" },
  { code: "BX",  name: "Box" },
  { code: "CR",  name: "Crate" },
  { code: "CT",  name: "Carton" },
  { code: "CX",  name: "Can" },
  { code: "DR",  name: "Drum" },
  { code: "EN",  name: "Envelope" },
  { code: "GI",  name: "Girder" },
  { code: "JR",  name: "Jar" },
  { code: "LG",  name: "Log" },
  { code: "LT",  name: "Lot" },
  { code: "PA",  name: "Packet" },
  { code: "PC",  name: "Piece" },
  { code: "PK",  name: "Package" },
  { code: "PL",  name: "Pallet" },
  { code: "PN",  name: "Plank" },
  { code: "PT",  name: "Pot" },
  { code: "PX",  name: "Pallet, box" },
  { code: "RO",  name: "Roll" },
  { code: "SA",  name: "Sack" },
  { code: "SK",  name: "Skid" },
  { code: "SL",  name: "Slipsheet" },
  { code: "SW",  name: "Shrinkwrapped" },
  { code: "TB",  name: "Tube" },
  { code: "TK",  name: "Tank" },
  { code: "TN",  name: "Tin" },
  { code: "TR",  name: "Tray" },
  { code: "UN",  name: "Unit" },
  { code: "WRP", name: "Wrapped" },
];

const INCOTERMS = [
  { code: "EXW", name: "Ex Works" },
  { code: "FCA", name: "Free Carrier" },
  { code: "FAS", name: "Free Alongside Ship" },
  { code: "FOB", name: "Free On Board" },
  { code: "CFR", name: "Cost and Freight" },
  { code: "CIF", name: "Cost, Insurance and Freight" },
  { code: "CPT", name: "Carriage Paid To" },
  { code: "CIP", name: "Carriage and Insurance Paid To" },
  { code: "DAP", name: "Delivered At Place" },
  { code: "DPU", name: "Delivered at Place Unloaded" },
  { code: "DDP", name: "Delivered Duty Paid" },
  { code: "DAT", name: "Delivered At Terminal" },
  { code: "DAF", name: "Delivered At Frontier" },
  { code: "DES", name: "Delivered Ex Ship" },
  { code: "DEQ", name: "Delivered Ex Quay" },
  { code: "DDU", name: "Delivered Duty Unpaid" },
];

const DECLARATION_TYPES = [
  { code: "IM",  name: "Import" },
  { code: "EX",  name: "Export" },
  { code: "EU",  name: "Entry for use" },
  { code: "CO",  name: "Complementary" },
  { code: "RE",  name: "Re-import" },
  { code: "TR",  name: "Transit" },
];

/* ═══════════════════════════════════════════════════════════════════
   FILTERING UTILITY
   ═══════════════════════════════════════════════════════════════════ */

function filterItems(items, query) {
  if (!query || query.trim() === "") return items.slice(0, 20);
  const q = query.toLowerCase().trim();
  const results = [];
  for (const item of items) {
    const codeLow = item.code.toLowerCase();
    const nameLow = item.name.toLowerCase();
    // exact code match (highest priority)
    if (codeLow === q) { results.unshift(item); continue; }
    // startsWith code
    if (codeLow.startsWith(q)) { results.push(item); continue; }
    // startsWith name
    if (nameLow.startsWith(q)) { results.push(item); continue; }
    // contains in code or name
    if (codeLow.includes(q) || nameLow.includes(q)) { results.push(item); }
  }
  return results.slice(0, 15);
}

/* ═══════════════════════════════════════════════════════════════════
   XML Parser
   ═══════════════════════════════════════════════════════════════════ */
function parseASYCUDAXml(xmlStr) {
  const p = new DOMParser();
  const doc = p.parseFromString(xmlStr, "text/xml");

  const t = (scope, tag) => {
    const el = scope?.querySelector(tag);
    const txt = el?.childNodes[0]?.textContent?.trim() || "";
    return txt === "null" ? "" : txt;
  };

  const officeCode   = t(doc, "Customs_clearance_office_code");
  const officeName   = t(doc, "Customs_Clearance_office_name");
  const declType     = t(doc, "Type_of_declaration");
  const genProc      = t(doc, "Declaration_gen_procedure_code");
  const forms        = t(doc, "Number_of_the_form");
  const totalForms   = t(doc, "Total_number_of_forms");
  const totalItems   = t(doc, "Total_number_of_items");
  const totalPkgs    = t(doc, "Total_number_of_packages");

  const exporterName  = t(doc, "Exporter_name");
  const consigneeName = t(doc, "Consignee_name");
  const declarantCode = t(doc, "Declarant_code");
  const declarantName = t(doc, "Declarant_name");

  const declarantEl  = doc.querySelector("Declarant");
  const declarantRef = declarantEl ? t(declarantEl, "Number") : "";

  const exportCountry     = t(doc, "Export_country_name");
  const exportCountryCode = t(doc, "Export_country_code");
  const destCountry       = t(doc, "Destination_country_name");
  const destCountryCode   = t(doc, "Destination_country_code");
  const tradingCountry    = t(doc, "Trading_country");
  const firstDest         = t(doc, "Country_first_destination");
  const originCountry     = t(doc, "Country_of_origin_name");
  const valueDetails      = t(doc, "Value_details");

  const transportMode   = t(doc, "Mode");
  const locationGoods   = t(doc, "Location_of_goods");
  const delivCode       = doc.querySelector("Delivery_terms Code")?.textContent?.trim() || "";
  const delivPlace      = doc.querySelector("Delivery_terms Place")?.textContent?.trim() || "";

  const borderEl      = doc.querySelector("Border_information");
  const borderId      = borderEl?.querySelector("Identity")?.textContent?.trim() || "";
  const borderNat     = borderEl?.querySelector("Nationality")?.textContent?.trim() || "";
  const arrEl         = doc.querySelector("Departure_arrival_information");
  const arrId         = arrEl?.querySelector("Identity")?.textContent?.trim() || "";
  const arrNat        = arrEl?.querySelector("Nationality")?.textContent?.trim() || "";

  const gsInv       = doc.querySelector("Gs_Invoice");
  const invCurrency = gsInv ? t(gsInv, "Currency_code") : "";
  const invRate     = gsInv ? t(gsInv, "Currency_rate") : "";
  const invAmtFCX   = gsInv ? t(gsInv, "Amount_foreign_currency") : "";
  const invAmtZWG   = gsInv ? t(gsInv, "Amount_national_currency") : "";

  const gsFrt   = doc.querySelector("Gs_internal_freight");
  const gsIns   = doc.querySelector("Gs_insurance");
  const frtAmtFCX = gsFrt ? t(gsFrt, "Amount_foreign_currency") : "0.00";
  const frtAmtZWG = gsFrt ? t(gsFrt, "Amount_national_currency") : "0.00";
  const insAmtFCX = gsIns ? t(gsIns, "Amount_foreign_currency") : "0.00";
  const insAmtZWG = gsIns ? t(gsIns, "Amount_national_currency") : "0.00";
  const totalCIF    = t(doc, "Total_CIF");
  const totalCost   = t(doc, "Total_cost");

  const paymentMode = t(doc, "Mode_of_payment");
  const deferredRef = t(doc, "Deffered_payment_reference");

  const items = [];
  doc.querySelectorAll("Item").forEach((el, idx) => {
    const numPkgs   = t(el, "Number_of_packages");
    const kindCode  = t(el, "Kind_of_packages_code");
    const kindName  = t(el, "Kind_of_packages_name");
    const marks     = t(el, "Marks1_of_packages") || "ADD";
    const commCode  = t(el, "Commodity_code");
    const prec1     = t(el, "Precision_1");
    const extProc   = t(el, "Extended_customs_procedure");
    const natProc   = t(el, "National_customs_procedure");
    const itemPrice = t(el, "Item_price");
    const descGoods = t(el, "Description_of_goods");
    const commDesc  = t(el, "Commercial_Description");
    const grossWt   = t(el, "Gross_weight_itm");
    const netWt     = t(el, "Net_weight_itm");
    const statVal   = t(el, "Statistical_value");
    const origCode  = t(el, "Country_of_origin_code");
    const licNo     = t(el, "Licence_number");
    const adj       = t(el, "Rate_of_adjustement");
    const totalCifItm = t(el, "Total_CIF_itm");
    const valueItem = t(el, "Value_item");

    const prevDocEl  = el.querySelector("Previous_doc");
    const summDecl   = prevDocEl ? t(prevDocEl, "Summary_declaration") : "";
    const summDeclSl = prevDocEl ? t(prevDocEl, "Summary_declaration_sl") : "";

    const itmInvEl   = el.querySelector("Item_Invoice");
    const itmCurr    = itmInvEl ? t(itmInvEl, "Currency_code") : "";
    const itmRate    = itmInvEl ? t(itmInvEl, "Currency_rate") : "";

    const taxLines = [];
    el.querySelectorAll("Taxation_line").forEach(tl => {
      taxLines.push({
        code:   t(tl, "Duty_tax_code"),
        base:   t(tl, "Duty_tax_Base"),
        rate:   t(tl, "Duty_tax_rate"),
        amount: t(tl, "Duty_tax_amount"),
        mp:     t(tl, "Duty_tax_MP"),
      });
    });
    const itemTaxTotal = t(el, "Item_taxes_amount");

    if (commCode || descGoods) {
      items.push({
        num: idx + 1,
        numPkgs, kindCode, kindName, marks,
        commCode, prec1, extProc, natProc,
        itemPrice, descGoods, commDesc,
        grossWt, netWt, statVal, origCode,
        licNo, adj, totalCifItm, valueItem,
        summDecl, summDeclSl,
        itmCurr, itmRate,
        taxLines, itemTaxTotal,
      });
    }
  });

  return {
    officeCode, officeName, declType, genProc,
    forms, totalForms, totalItems, totalPkgs,
    declarantRef,
    exporterName, consigneeName, declarantCode, declarantName,
    exportCountry, exportCountryCode,
    destCountry, destCountryCode,
    tradingCountry, firstDest, originCountry, valueDetails,
    transportMode, locationGoods, delivCode, delivPlace,
    borderId, borderNat, arrId, arrNat,
    invCurrency, invRate, invAmtFCX, invAmtZWG,
    frtAmtFCX, frtAmtZWG, insAmtFCX, insAmtZWG,
    totalCIF, totalCost,
    paymentMode, deferredRef,
    items,
    year: "2026",
  };
}

/* ═══════════════════════════════════════════════════════════════════
   BASE STYLES
   ═══════════════════════════════════════════════════════════════════ */
const GREEN  = "#006400";
const LGREEN = "#e8f5e8";
const BLACK  = "#000";
const MONO   = "'Courier New', Courier, monospace";

/* ═══════════════════════════════════════════════════════════════════
   AutoCompleteField COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
function AutoCompleteField({
  value,
  onChange,
  onSelect,
  items: dataItems,
  placeholder,
  style = {},
  width,
  showCodeOnly = false,
}) {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const [recentCodes, setRecentCodes] = useState([]);
  const containerRef = useRef();
  const inputRef     = useRef();
  const listRef      = useRef();

  // filtered results
  const filtered = query.length > 0
    ? filterItems(dataItems, query)
    : recentCodes.length > 0
      ? dataItems.filter(i => recentCodes.includes(i.code)).slice(0, 8)
      : dataItems.slice(0, 10);

  // sync display value
  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setQuery(value || "");
    }
  }, [value]);

  // close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        // restore display to current value on blur without selection
        setQuery(value || "");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [value]);

  const handleChange = (e) => {
    setQuery(e.target.value);
    onChange(e.target.value);
    setOpen(true);
    setHighlighted(0);
  };

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "F4") {
        setOpen(true);
        setHighlighted(0);
        e.preventDefault();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted(h => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlighted]) selectItem(filtered[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery(value || "");
    }
  };

  const selectItem = (item) => {
    const displayVal = showCodeOnly ? item.code : item.code;
    setQuery(displayVal);
    setOpen(false);
    setRecentCodes(prev => [item.code, ...prev.filter(c => c !== item.code)].slice(0, 5));
    if (onSelect) onSelect(item);
    else onChange(displayVal);
  };

  // scroll highlighted into view
  useEffect(() => {
    if (listRef.current) {
      const el = listRef.current.children[highlighted];
      if (el) el.scrollIntoView({ block: "nearest" });
    }
  }, [highlighted]);

  // validate: is current value a valid code?
  const isValid = !value || value === "" || dataItems.some(i => i.code === value || i.name === value);
  const borderColor = value && !isValid ? "#cc0000" : GREEN;

  const inputStyle = {
    width: width || "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: "bold",
    color: BLACK,
    padding: 0,
    margin: 0,
    boxSizing: "border-box",
    ...style,
  };

  const matchedItem = dataItems.find(i => i.code === (value || "").toUpperCase());

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block", width: width || "100%" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        borderBottom: value && !isValid ? `1px solid #cc0000` : "none",
      }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => { setOpen(true); setHighlighted(0); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || ""}
          style={inputStyle}
          autoComplete="off"
          spellCheck={false}
        />
        {value && !isValid && (
          <span style={{ color: "#cc0000", fontSize: 9, marginLeft: 2, fontFamily: MONO, whiteSpace: "nowrap" }}>!</span>
        )}
      </div>

      {/* Tooltip for matched item */}
      {matchedItem && !open && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          background: "#ffffc0",
          border: `1px solid ${GREEN}`,
          padding: "1px 4px",
          fontSize: 9,
          fontFamily: MONO,
          color: "#333",
          whiteSpace: "nowrap",
          zIndex: 9998,
          pointerEvents: "none",
          opacity: 0.9,
        }}>
          {matchedItem.name}
        </div>
      )}

      {open && filtered.length > 0 && (
        <div
          ref={listRef}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            minWidth: 260,
            maxHeight: 180,
            overflowY: "auto",
            background: "#fff",
            border: `2px solid ${GREEN}`,
            zIndex: 9999,
            boxShadow: "2px 2px 4px rgba(0,0,0,0.3)",
            fontFamily: MONO,
          }}
        >
          {/* Header row */}
          <div style={{
            display: "flex",
            background: GREEN,
            color: "#fff",
            padding: "1px 4px",
            fontSize: 9,
            fontWeight: "bold",
            position: "sticky",
            top: 0,
            zIndex: 1,
          }}>
            <span style={{ width: 60, flexShrink: 0 }}>CODE</span>
            <span style={{ flex: 1 }}>DESCRIPTION</span>
          </div>
          {filtered.map((item, i) => (
            <div
              key={item.code}
              onMouseDown={(e) => { e.preventDefault(); selectItem(item); }}
              onMouseEnter={() => setHighlighted(i)}
              style={{
                display: "flex",
                padding: "2px 4px",
                fontSize: 10,
                cursor: "pointer",
                background: i === highlighted ? GREEN : (i % 2 === 0 ? "#fff" : LGREEN),
                color: i === highlighted ? "#fff" : BLACK,
                borderBottom: "1px solid #e0e0e0",
              }}
            >
              <span style={{
                width: 60,
                flexShrink: 0,
                fontWeight: "bold",
                color: i === highlighted ? "#ffe060" : GREEN,
              }}>
                {item.code}
              </span>
              <span style={{ flex: 1 }}>{item.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   EditableField (plain text, unchanged)
   ═══════════════════════════════════════════════════════════════════ */
function EditableField({ value, onChange, multiline = false, style = {}, rows = 2 }) {
  const inputStyle = {
    width: "100%",
    border: "none",
    outline: "none",
    resize: "none",
    background: "transparent",
    fontFamily: MONO,
    fontSize: 11,
    fontWeight: "bold",
    color: BLACK,
    padding: 0,
    margin: 0,
    boxSizing: "border-box",
    ...style,
  };
  if (multiline) {
    return (
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        style={inputStyle}
      />
    );
  }
  return (
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      style={inputStyle}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PRIMITIVE BUILDING BLOCKS (unchanged)
   ═══════════════════════════════════════════════════════════════════ */
function C({ lbl, val, w, flex = 1, mh, style, children }) {
  return (
    <div style={{
      border: `1px solid ${GREEN}`,
      padding: "2px 4px",
      width: w || undefined,
      flex: w ? undefined : flex,
      minHeight: mh || 22,
      boxSizing: "border-box",
      position: "relative",
      ...style,
    }}>
      {children ?? (
        <>
          {lbl !== undefined && (
            <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold", lineHeight: 1.2 }}>{lbl}</div>
          )}
          {val !== undefined && (
            <div style={{ fontWeight: "bold", fontSize: 11, whiteSpace: "pre-line", marginTop: 1 }}>{val}</div>
          )}
        </>
      )}
    </div>
  );
}

function R({ children, style }) {
  return (
    <div style={{ display: "flex", borderBottom: `1px solid ${GREEN}`, ...style }}>
      {children}
    </div>
  );
}

function Barcode({ value = "" }) {
  const bars = Array.from({ length: 55 }, (_, i) => {
    const w = i % 7 === 0 ? 3 : i % 3 === 0 ? 2 : 1;
    return <rect key={i} x={i * 3.4} y={0} width={w} height={38} fill={BLACK} />;
  });
  return (
    <svg width={200} height={50} style={{ display: "block" }}>
      {bars}
      <text x={0} y={49} fontSize={7} fontFamily={MONO}>{value}</text>
    </svg>
  );
}

function ZimraLogo() {
  return (
    <div style={{ width: 120, borderRight: `2px solid ${GREEN}`, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", padding: 6, flexShrink: 0 }}>
      <svg width={90} height={60} viewBox="0 0 90 60">
        <circle cx={45} cy={28} r={24} fill={GREEN} />
        <circle cx={45} cy={28} r={20} fill="#fff" />
        <circle cx={45} cy={28} r={14} fill={GREEN} />
        <circle cx={45} cy={28} r={9} fill="#FFD700" />
        <circle cx={45} cy={28} r={5} fill={GREEN} />
        <text x={45} y={52} textAnchor="middle" fontSize={8} fontWeight="bold" fill={GREEN} fontFamily={MONO}>ZIMRA</text>
      </svg>
    </div>
  );
}

function Scenery() {
  return (
    <div style={{ flex: 1, overflow: "hidden", height: 72 }}>
      <svg width="100%" height="72" viewBox="0 0 900 72" preserveAspectRatio="xMidYMid slice">
        <rect width={900} height={72} fill="#7EC8E3" />
        <ellipse cx={100} cy={72} rx={180} ry={55} fill="#3a7d3a" />
        <ellipse cx={350} cy={72} rx={260} ry={60} fill="#2d6b2d" />
        <ellipse cx={650} cy={72} rx={280} ry={65} fill="#3a7d3a" />
        <ellipse cx={860} cy={72} rx={140} ry={45} fill="#2d6b2d" />
        <rect x={0} y={50} width={900} height={22} fill="#1e4d1e" />
        {[340,350,360,370,380].map((x,i) => (
          <rect key={i} x={x} y={10} width={i%2===0?3:2} height={50} fill="rgba(255,255,255,0.55)" rx={1} />
        ))}
      </svg>
    </div>
  );
}

function Lbl({ children }) {
  return <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold", lineHeight: 1.2 }}>{children}</div>;
}

/* ═══════════════════════════════════════════════════════════════════
   SadHeader — with AutoCompleteField wired in
   ═══════════════════════════════════════════════════════════════════ */
function SadHeader({ d, update }) {
  // helper: select office → fill both code & name
  const selectOffice = (field_code, field_name) => (item) => {
    update(field_code, item.code);
    update(field_name, item.name);
  };

  // helper: select country → fill code + name
  const selectCountry = (field_code, field_name) => (item) => {
    update(field_code, item.code);
    if (field_name) update(field_name, item.name);
  };

  return (
    <>
      {/* ROW: Box 2 Exporter | Box 1 Declaration | Office */}
      <R>
        <C w={330} mh={110}>
          <Lbl>2 Exporter</Lbl>
          <EditableField value={d.exporterName} onChange={(v) => update("exporterName", v)} multiline rows={4} style={{ fontSize: 10.5, marginTop: 2 }} />
          <Lbl>No.</Lbl>
        </C>

        <div style={{ flex: 1, borderLeft: `2px solid ${GREEN}` }}>
          <R style={{ borderBottom: `1px solid ${GREEN}` }}>
            <C w={30}><Lbl>1</Lbl></C>
            <div style={{ flex: 1, background: LGREEN, border: `1px solid ${GREEN}`, padding: "2px 6px", display: "flex", alignItems: "center" }}>
              <span style={{ color: GREEN, fontSize: 11, fontWeight: "bold", letterSpacing: 2 }}>DECLARATION</span>
            </div>
            <C w={220}>
              <Lbl>A OFFICE OF DESTINATION</Lbl>
              <AutoCompleteField
                value={d.officeCode}
                onChange={(v) => update("officeCode", v)}
                onSelect={selectOffice("officeCode", "officeName")}
                items={CUSTOMS_OFFICES}
                style={{ fontSize: 11 }}
              />
            </C>
          </R>

          <R style={{ borderBottom: `1px solid ${GREEN}` }}>
            <C w={50}>
              <AutoCompleteField
                value={d.declType}
                onChange={(v) => update("declType", v)}
                onSelect={(item) => update("declType", item.code)}
                items={DECLARATION_TYPES}
                style={{ fontSize: 16 }}
              />
            </C>
            <C w={40}>
              <AutoCompleteField
                value={d.genProc}
                onChange={(v) => update("genProc", v)}
                onSelect={(item) => update("genProc", item.code)}
                items={PROCEDURE_CODES}
                style={{ fontSize: 16 }}
              />
            </C>
            <C flex={1} />
            <C w={220}>
              <EditableField value={d.officeName} onChange={(v) => update("officeName", v)} style={{ fontSize: 10 }} />
            </C>
          </R>

          <R style={{ borderBottom: `1px solid ${GREEN}` }}>
            <C w={120}>
              <Lbl>3 Forms</Lbl>
              <div style={{ display: "flex", gap: 4 }}>
                <EditableField value={d.forms} onChange={(v) => update("forms", v)} style={{ width: 30 }} />
                <EditableField value={d.totalForms} onChange={(v) => update("totalForms", v)} style={{ width: 30 }} />
              </div>
            </C>
            <C w={130}><Lbl>4 Load List</Lbl></C>
            <C flex={1}><Lbl>Manifest</Lbl></C>
          </R>

          <R>
            <C w={120}>
              <Lbl>5 Items</Lbl>
              <EditableField value={d.totalItems} onChange={(v) => update("totalItems", v)} />
            </C>
            <C w={130}>
              <Lbl>6 Nbr packages</Lbl>
              <EditableField value={d.totalPkgs} onChange={(v) => update("totalPkgs", v)} />
            </C>
            <C flex={1}>
              <Lbl>7 Reference number</Lbl>
              <div style={{ display: "flex", gap: 6 }}>
                <EditableField value={d.year} onChange={(v) => update("year", v)} style={{ width: 40 }} />
                <EditableField value={d.declarantRef} onChange={(v) => update("declarantRef", v)} />
              </div>
            </C>
          </R>
        </div>
      </R>

      {/* ROW: Box 8 Consignee | Box 9 Financial */}
      <R>
        <C w={330} mh={80}>
          <Lbl>8 Consignee</Lbl>
          <EditableField value={d.consigneeName} onChange={(v) => update("consigneeName", v)} multiline rows={3} style={{ fontSize: 10.5, marginTop: 2 }} />
          <Lbl>No.</Lbl>
        </C>
        <C flex={1} mh={80}>
          <Lbl>9 Financial</Lbl>
          <div style={{ marginTop: 30 }}><Lbl>No.</Lbl></div>
        </C>
      </R>

      {/* ROW: Country last con | 11 Trading | 12 Value | 13 CAP */}
      <R>
        <C w={150}>
          <Lbl>Country last con.</Lbl>
          <AutoCompleteField
            value={d.firstDest}
            onChange={(v) => update("firstDest", v)}
            onSelect={(item) => update("firstDest", item.code)}
            items={COUNTRIES}
          />
        </C>
        <C w={150}>
          <Lbl>11 Trading cty.</Lbl>
          <AutoCompleteField
            value={d.tradingCountry}
            onChange={(v) => update("tradingCountry", v)}
            onSelect={(item) => update("tradingCountry", item.code)}
            items={COUNTRIES}
          />
        </C>
        <C w={200}>
          <Lbl>12 Value details</Lbl>
          <EditableField value={d.valueDetails} onChange={(v) => update("valueDetails", v)} />
        </C>
        <C flex={1}><Lbl>13 C.A.P.</Lbl></C>
      </R>

      {/* ROW: Box 14 Declarant | Country fields */}
      <R>
        <C w={330} mh={90}>
          <Lbl>14 Declarant</Lbl>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>No.</span>
            <EditableField value={d.declarantCode} onChange={(v) => update("declarantCode", v)} />
          </div>
          <EditableField value={d.declarantName} onChange={(v) => update("declarantName", v)} multiline rows={3} style={{ fontSize: 10.5, marginTop: 2 }} />
        </C>
        <div style={{ flex: 1, borderLeft: `1px solid ${GREEN}` }}>
          <R style={{ borderBottom: `1px solid ${GREEN}` }}>
            <C flex={1}>
              <Lbl>15 Country of export</Lbl>
              <AutoCompleteField
                value={d.exportCountry}
                onChange={(v) => update("exportCountry", v)}
                onSelect={selectCountry("exportCountryCode", "exportCountry")}
                items={COUNTRIES}
              />
            </C>
            <C w={90}>
              <Lbl>15 C.E. Code</Lbl>
              <AutoCompleteField
                value={d.exportCountryCode}
                onChange={(v) => update("exportCountryCode", v)}
                onSelect={selectCountry("exportCountryCode", "exportCountry")}
                items={COUNTRIES}
              />
            </C>
            <C w={110}>
              <Lbl>17 C.D. Code</Lbl>
              <AutoCompleteField
                value={d.destCountryCode}
                onChange={(v) => update("destCountryCode", v)}
                onSelect={selectCountry("destCountryCode", "destCountry")}
                items={COUNTRIES}
              />
            </C>
          </R>
          <R>
            <C flex={1}>
              <Lbl>16 Country of origin</Lbl>
              <AutoCompleteField
                value={d.originCountry}
                onChange={(v) => update("originCountry", v)}
                onSelect={(item) => update("originCountry", item.name)}
                items={COUNTRIES}
              />
            </C>
            <C flex={1}>
              <Lbl>17 Country of destination</Lbl>
              <AutoCompleteField
                value={d.destCountry}
                onChange={(v) => update("destCountry", v)}
                onSelect={selectCountry("destCountryCode", "destCountry")}
                items={COUNTRIES}
              />
            </C>
          </R>
        </div>
      </R>

      {/* ROW: Box 18 Identity arrival | 19 Ctr | 20 Delivery */}
      <R>
        <C flex={1}>
          <Lbl>18 Identity and nationality of means of transport at arrival</Lbl>
          <div style={{ display: "flex", gap: 6 }}>
            <EditableField value={d.arrId} onChange={(v) => update("arrId", v)} />
            <AutoCompleteField
              value={d.arrNat}
              onChange={(v) => update("arrNat", v)}
              onSelect={(item) => update("arrNat", item.code)}
              items={COUNTRIES}
              width={60}
            />
          </div>
        </C>
        <C w={60}>
          <Lbl>19 Ctr.</Lbl>
          <div style={{ border: `1px solid ${GREEN}`, width: 13, height: 13, marginTop: 4 }} />
        </C>
        <C w={270}>
          <Lbl>20 Delivery terms</Lbl>
          <div style={{ display: "flex", gap: 6 }}>
            <AutoCompleteField
              value={d.delivCode}
              onChange={(v) => update("delivCode", v)}
              onSelect={(item) => { update("delivCode", item.code); }}
              items={INCOTERMS}
              width={60}
            />
            <EditableField value={d.delivPlace} onChange={(v) => update("delivPlace", v)} />
          </div>
        </C>
      </R>

      {/* ROW: Box 21 Border transport | 22 Currency | 23 Exch rate | 24 Nature */}
      <R>
        <C flex={1}>
          <Lbl>21 Identity and nationality of active means of transport crossing the border</Lbl>
          <div style={{ display: "flex", gap: 6 }}>
            <EditableField value={d.borderId} onChange={(v) => update("borderId", v)} />
            <AutoCompleteField
              value={d.borderNat}
              onChange={(v) => update("borderNat", v)}
              onSelect={(item) => update("borderNat", item.code)}
              items={COUNTRIES}
              width={60}
            />
          </div>
        </C>
        <C w={210}>
          <Lbl>22 Currency &amp; total amount invoiced</Lbl>
          <div style={{ display: "flex", gap: 6 }}>
            <AutoCompleteField
              value={d.invCurrency}
              onChange={(v) => update("invCurrency", v)}
              onSelect={(item) => update("invCurrency", item.code)}
              items={COUNTRIES}
              width={40}
            />
            <EditableField value={d.invAmtFCX} onChange={(v) => update("invAmtFCX", v)} />
          </div>
        </C>
        <C w={100}>
          <Lbl>23 Exch. rate</Lbl>
          <EditableField value={d.invRate} onChange={(v) => update("invRate", v)} />
        </C>
        <C w={110}><Lbl>24 Nature of transac.</Lbl></C>
      </R>

      {/* ROW: Box 25 Mode | 26 Inland | 27 Place | 28 Financial */}
      <R>
        <C w={160}>
          <Lbl>25 Mode transport at border</Lbl>
          <AutoCompleteField
            value={d.transportMode}
            onChange={(v) => update("transportMode", v)}
            onSelect={(item) => update("transportMode", item.code)}
            items={TRANSPORT_MODES}
          />
        </C>
        <C w={130}><Lbl>26 Inland mode Transport</Lbl></C>
        <C w={200}><Lbl>27 Place of discharge</Lbl></C>
        <C flex={1}>
          <Lbl>28 Financial and banking data  Bank Code</Lbl>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold", marginTop: 6 }}>Terms of payment</div>
        </C>
      </R>

      {/* ROW: Box 29 Office of entry | 30 Location */}
      <R>
        <C w={300}>
          <Lbl>29 Office of entry</Lbl>
          <div style={{ display: "flex", gap: 6 }}>
            <AutoCompleteField
              value={d.officeCode}
              onChange={(v) => update("officeCode", v)}
              onSelect={selectOffice("officeCode", "officeName")}
              items={CUSTOMS_OFFICES}
              width={80}
            />
            <EditableField value={d.officeName} onChange={(v) => update("officeName", v)} />
          </div>
        </C>
        <C w={200}>
          <Lbl>30 Location of goods</Lbl>
          <AutoCompleteField
            value={d.locationGoods}
            onChange={(v) => update("locationGoods", v)}
            onSelect={(item) => update("locationGoods", item.code)}
            items={LOCATIONS_OF_GOODS}
          />
        </C>
        <C flex={1} />
      </R>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ItemBlock — with AutoCompleteField for relevant fields
   ═══════════════════════════════════════════════════════════════════ */
function ItemBlock({ item, index, updateItem }) {
  const upd = (field, value) => updateItem(index, field, value);

  const prevDoc = item.summDecl
    ? `${item.summDecl}${item.summDeclSl ? "  S/L  " + item.summDeclSl : "  S/L"}`
    : "S/L";

  return (
    <div style={{ borderTop: `2px solid ${GREEN}` }}>
      <R>
        <C w={90} mh={130} style={{ borderRight: `2px solid ${GREEN}` }}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold", lineHeight: 1.6 }}>
            31 Packages<br />and.<br />description<br />of goods
          </div>
        </C>

        <div style={{ flex: 1 }}>
          <R style={{ borderBottom: `1px solid ${GREEN}` }}>
            <div style={{ flex: 1, padding: "2px 4px", borderRight: `1px solid ${GREEN}` }}>
              <Lbl>Marks and numbers - Containers No(s) - Number and kind</Lbl>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 2 }}>
                <span style={{ color: GREEN, fontSize: 9, fontWeight: "bold", whiteSpace: "nowrap" }}>Marks &amp; no</span>
                <EditableField value={item.marks} onChange={(v) => upd("marks", v)} />
              </div>
              <Lbl>of packages</Lbl>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ color: GREEN, fontSize: 9, fontWeight: "bold", whiteSpace: "nowrap" }}>Nbr &amp; Kind</span>
                <EditableField value={item.numPkgs} onChange={(v) => upd("numPkgs", v)} style={{ width: 40 }} />
                <AutoCompleteField
                  value={item.kindCode}
                  onChange={(v) => upd("kindCode", v)}
                  onSelect={(pkg) => { upd("kindCode", pkg.code); upd("kindName", pkg.name); }}
                  items={PACKAGE_TYPES}
                  width={40}
                />
                <EditableField value={item.kindName} onChange={(v) => upd("kindName", v)} style={{ fontSize: 10, marginLeft: 4 }} />
              </div>
            </div>

            <div style={{ width: 360 }}>
              <R style={{ borderBottom: `1px solid ${GREEN}` }}>
                <C w={70}>
                  <Lbl>32 Item</Lbl>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <EditableField value={String(item.num)} onChange={(v) => upd("num", v)} style={{ width: 20 }} />
                    <span style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>No.</span>
                  </div>
                </C>
                <C flex={1}>
                  <Lbl>33 Commodity code</Lbl>
                  <div style={{ display: "flex", gap: 4 }}>
                    <EditableField value={item.commCode} onChange={(v) => upd("commCode", v)} />
                    <EditableField value={item.prec1} onChange={(v) => upd("prec1", v)} style={{ width: 40 }} />
                  </div>
                </C>
              </R>
              <R style={{ borderBottom: `1px solid ${GREEN}` }}>
                <C w={110}>
                  <Lbl>34 Cty. orig. Code</Lbl>
                  <AutoCompleteField
                    value={item.origCode}
                    onChange={(v) => upd("origCode", v)}
                    onSelect={(c) => upd("origCode", c.code)}
                    items={COUNTRIES}
                  />
                </C>
                <C w={130}>
                  <Lbl>35 Gross mass (kg)</Lbl>
                  <EditableField value={item.grossWt} onChange={(v) => upd("grossWt", v)} style={{ textAlign: "right" }} />
                </C>
                <C flex={1}><Lbl>36 Prefer.</Lbl></C>
              </R>
              <R style={{ borderBottom: `1px solid ${GREEN}` }}>
                <C w={110}>
                  <Lbl>37 PROCEDURE</Lbl>
                  <div style={{ display: "flex", gap: 4 }}>
                    <AutoCompleteField
                      value={item.extProc}
                      onChange={(v) => upd("extProc", v)}
                      onSelect={(p) => upd("extProc", p.code)}
                      items={PROCEDURE_CODES}
                      width={50}
                    />
                    <EditableField value={item.natProc} onChange={(v) => upd("natProc", v)} style={{ width: 50 }} />
                  </div>
                </C>
                <C w={130}>
                  <Lbl>38 Net mass (kg)</Lbl>
                  <EditableField value={item.netWt} onChange={(v) => upd("netWt", v)} style={{ textAlign: "right" }} />
                </C>
                <C flex={1}><Lbl>39 Quota</Lbl></C>
              </R>
              <R>
                <C flex={1}>
                  <Lbl>40 Summary declaration / Previous document</Lbl>
                  <EditableField value={prevDoc} onChange={(v) => upd("summDecl", v)} />
                </C>
              </R>
            </div>
          </R>

          {/* Description | 41 Supp | 42 Item Price | 43 VM */}
          <R style={{ borderBottom: `1px solid ${GREEN}` }}>
            <div style={{ flex: 1, padding: "2px 4px", borderRight: `1px solid ${GREEN}` }}>
              <Lbl>Containers No(s)</Lbl>
              <EditableField value={item.descGoods} onChange={(v) => upd("descGoods", v)} multiline rows={2} style={{ marginTop: 6, fontSize: 11 }} />
              <EditableField value={item.commDesc} onChange={(v) => upd("commDesc", v)} multiline rows={2} style={{ fontWeight: "bold", fontSize: 12, marginTop: 4 }} />
            </div>

            <div style={{ width: 360 }}>
              <R style={{ borderBottom: `1px solid ${GREEN}` }}>
                <C w={160}><Lbl>41 Supplementary units</Lbl></C>
                <C w={130}>
                  <Lbl>42 Item Price</Lbl>
                  <EditableField value={item.itemPrice} onChange={(v) => upd("itemPrice", v)} style={{ textAlign: "right" }} />
                </C>
                <C flex={1}><Lbl>43 V.M. code</Lbl></C>
              </R>
              <R style={{ borderBottom: `1px solid ${GREEN}` }}>
                <C flex={1}><Lbl>A.I. Code</Lbl></C>
                <C w={190}>
                  <Lbl>45 Adjustment</Lbl>
                  <EditableField value={item.adj} onChange={(v) => upd("adj", v)} style={{ textAlign: "right" }} />
                </C>
              </R>
              <R>
                <C flex={1}><Lbl>41bis Write-off units</Lbl></C>
                <C w={190}>
                  <Lbl>46 Statistical value</Lbl>
                  <EditableField value={item.statVal} onChange={(v) => upd("statVal", v)} style={{ textAlign: "right" }} />
                </C>
              </R>
            </div>
          </R>

          {/* 44 Add info | 47 Tax grid */}
          <R>
            <C w={90} mh={100} style={{ borderRight: `1px solid ${GREEN}` }}>
              <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold", lineHeight: 1.6 }}>
                44 Add. info<br />Documents<br />Produced<br />Certificates<br />and autho-<br />risations
              </div>
            </C>

            <div style={{ width: 180, padding: "2px 4px", borderRight: `1px solid ${GREEN}` }}>
              <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                <span style={{ color: GREEN, fontSize: 9, fontWeight: "bold", whiteSpace: "nowrap" }}>Licence No</span>
                <EditableField value={item.licNo} onChange={(v) => upd("licNo", v)} style={{ fontSize: 10 }} />
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                <span style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>D.Val</span>
                <span style={{ color: GREEN, fontSize: 9, fontWeight: "bold", marginLeft: 24 }}>D.Qty</span>
              </div>
              <EditableField value={item.valueItem} onChange={(v) => upd("valueItem", v)} multiline rows={2} style={{ fontSize: 10, marginTop: 4 }} />
              <Lbl>A.D.</Lbl>
            </div>

            {/* Box 47 Tax grid */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", borderBottom: `1px solid ${GREEN}` }}>
                <C w={70} style={{ background: LGREEN, borderRight: `1px solid ${GREEN}` }} mh={90}>
                  <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold", lineHeight: 1.6 }}>
                    47 Calcul-<br />ation of<br />taxes
                  </div>
                </C>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", background: LGREEN, borderBottom: `1px solid ${GREEN}` }}>
                    {["Type", "Tax base", "Rate", "Amount", "MP"].map(h => (
                      <div key={h} style={{ flex: 1, padding: "1px 3px", color: GREEN, fontSize: 9, fontWeight: "bold", borderRight: `1px solid ${GREEN}` }}>{h}</div>
                    ))}
                  </div>
                  {Array.from({ length: Math.max(item.taxLines.length, 4) }, (_, i) => {
                    const tl = item.taxLines[i] || {};
                    return (
                      <div key={i} style={{ display: "flex", borderBottom: `1px solid #ddd`, minHeight: 16 }}>
                        {["code", "base", "rate", "amount", "mp"].map((field, j) => (
                          <div key={j} style={{ flex: 1, padding: "1px 2px", borderRight: `1px solid #ddd` }}>
                            <input
                              type="text"
                              value={tl[field] || ""}
                              onChange={(e) => {
                                const updatedLines = [...item.taxLines];
                                if (!updatedLines[i]) updatedLines[i] = { code: "", base: "", rate: "", amount: "", mp: "" };
                                updatedLines[i] = { ...updatedLines[i], [field]: e.target.value };
                                upd("taxLines", updatedLines);
                              }}
                              style={{
                                width: "100%", border: "none", outline: "none", background: "transparent",
                                fontFamily: MONO, fontSize: 10, fontWeight: "bold", color: BLACK, padding: 0,
                                textAlign: j === 1 || j === 3 ? "right" : "left",
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    );
                  })}
                  <div style={{ borderTop: `1px solid ${GREEN}`, padding: "1px 4px", color: GREEN, fontWeight: "bold", fontSize: 9, textAlign: "center" }}>Total</div>
                </div>
              </div>
            </div>
          </R>
        </div>
      </R>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   AccountingSection (unchanged)
   ═══════════════════════════════════════════════════════════════════ */
function AccountingSection({ d, update }) {
  return (
    <div style={{ borderTop: `2px solid ${GREEN}` }}>
      <R>
        <C w={90} mh={120} style={{ borderRight: `2px solid ${GREEN}` }}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold", lineHeight: 1.6 }}>
            47 Calcul-<br />ation of<br />taxes
          </div>
        </C>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", background: LGREEN, borderBottom: `1px solid ${GREEN}` }}>
            {["Type", "Tax base", "Rate", "Amount", "MP"].map(h => (
              <div key={h} style={{ flex: 1, padding: "1px 3px", color: GREEN, fontSize: 9, fontWeight: "bold", borderRight: `1px solid ${GREEN}` }}>{h}</div>
            ))}
          </div>
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} style={{ display: "flex", borderBottom: `1px solid #ddd`, minHeight: 14 }}>
              {[0,1,2,3,4].map(j => <div key={j} style={{ flex: 1, borderRight: `1px solid #ddd` }} />)}
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${GREEN}`, padding: "2px 4px", color: GREEN, fontWeight: "bold", fontSize: 9, textAlign: "center" }}>Total</div>
        </div>

        <div style={{ width: 440, borderLeft: `2px solid ${GREEN}` }}>
          <R style={{ borderBottom: `1px solid ${GREEN}` }}>
            <C flex={1}>
              <Lbl>48 Account Code</Lbl>
              <EditableField value={d.deferredRef} onChange={(v) => update("deferredRef", v)} />
            </C>
            <C flex={1}><Lbl>49 Identification of warehouse</Lbl></C>
          </R>
          <div style={{ background: GREEN, color: "#fff", padding: "2px 8px", fontSize: 10, fontWeight: "bold" }}>
            B ACCOUNTING DETAILS
          </div>
          <div style={{ padding: "4px 8px" }}>
            {[
              ["Mode of payment",    "paymentMode"],
              ["Assessment number",  null],
              ["Receipt number",     null],
              ["Guarantee",          null],
              ["Total fees",         null],
              ["Total declaration",  null],
            ].map(([lbl, field]) => (
              <div key={lbl} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dotted #ccc", padding: "2px 0", fontSize: 11 }}>
                <span style={{ color: GREEN, fontWeight: "bold" }}>{lbl}</span>
                {field ? (
                  <EditableField value={d[field]} onChange={(v) => update(field, v)} style={{ textAlign: "right", width: 160 }} />
                ) : (
                  <span style={{ fontWeight: "bold", color: "#888" }}>— / Date</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </R>

      <R style={{ minHeight: 80 }}>
        <C flex={1} mh={80}>
          <Lbl>50 Principal</Lbl>
          <Lbl>No.</Lbl>
          <div style={{ marginTop: 32, borderBottom: `1px solid ${BLACK}`, width: "55%" }} />
          <div style={{ fontSize: 10, marginTop: 2 }}>Signature</div>
        </C>
        <C w={140} mh={80}>
          <Lbl>51 Intended offices of transit and country</Lbl>
          <div style={{ marginTop: 20 }}><Lbl>Represented by</Lbl></div>
          <Lbl>Place and date</Lbl>
        </C>
        <C flex={1} mh={80}><Lbl>C OFFICE OF DEPARTURE</Lbl></C>
      </R>

      <R>
        <C flex={1}>
          <Lbl>52 Guarantee</Lbl>
          <Lbl>Account</Lbl>
        </C>
        <C w={60}><Lbl>Code</Lbl></C>
        <C flex={1}><Lbl>53 Office of destination and country</Lbl></C>
      </R>

      <R style={{ minHeight: 80 }}>
        <C flex={1} mh={80}>
          <Lbl>D CONTROL BY OFFICE OF DESTINATION</Lbl>
          <div style={{ marginTop: 36, borderBottom: `1px solid ${BLACK}`, width: "40%" }} />
          <div style={{ fontSize: 10, marginTop: 2 }}>Signature</div>
        </C>
        <C w={200} mh={80}><Lbl>Stamp:</Lbl></C>
        <C flex={1} mh={80}><Lbl>54 Place and date</Lbl></C>
      </R>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ValuationNote (unchanged)
   ═══════════════════════════════════════════════════════════════════ */
function ValuationNote({ d, update }) {
  const fields = [
    { lbl: "Invoice value",                               amtField: "invAmtFCX", fcxField: "invCurrency", rateField: "invRate",  zwgField: "invAmtZWG" },
    { lbl: "Freight 1.........(import)..............",     amtField: null,        fcxField: null,          rateField: null,       zwgField: null },
    { lbl: "Freight 2....................................", amtField: "frtAmtFCX", fcxField: "invCurrency", rateField: "invRate",  zwgField: "frtAmtZWG" },
    { lbl: "Insurance ..................(import)..............", amtField: "insAmtFCX", fcxField: "invCurrency", rateField: "invRate", zwgField: "insAmtZWG" },
    { lbl: "Other costs ..................(import)..............", amtField: null, fcxField: null, rateField: null, zwgField: null },
    { lbl: "Deductions .....................................", amtField: null, fcxField: null, rateField: null, zwgField: null },
  ];
  return (
    <div>
      <div style={{ background: GREEN, color: "#fff", padding: "4px 10px", fontWeight: "bold", fontSize: 12 }}>SAD - Valuation Note - General segment</div>
      <div style={{ padding: "8px 20px" }}>
        <div style={{ marginBottom: 8 }}>
          <span style={{ color: GREEN, fontWeight: "bold" }}>Working mode</span>
          <span style={{ fontWeight: "bold", marginLeft: 16 }}>Apportionment per value</span>
        </div>
        <div style={{ border: `1px solid #ccc`, padding: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "260px 80px 30px 80px 110px 110px", gap: 4, marginBottom: 8 }}>
            {["", "Amount", "", "FCX code", "Exchange rate", "Amount in ZWG"].map((h, i) => (
              <div key={i} style={{ color: GREEN, fontWeight: "bold", fontSize: 10 }}>{h}</div>
            ))}
          </div>
          {fields.map(({ lbl, amtField, fcxField, rateField, zwgField }, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "260px 80px 30px 80px 110px 110px", gap: 4, borderBottom: "1px dotted #eee", padding: "4px 0" }}>
              <span style={{ color: GREEN, fontSize: 10 }}>{lbl}</span>
              {amtField ? <input type="text" value={d[amtField] || ""} onChange={(e) => update(amtField, e.target.value)} style={{ border: "none", outline: "none", background: "transparent", fontFamily: MONO, fontSize: 10, textAlign: "right", padding: 0 }} /> : <span style={{ fontSize: 10, textAlign: "right" }}>0.00</span>}
              <span style={{ textAlign: "center", fontSize: 10 }}>in</span>
              {fcxField ? <input type="text" value={d[fcxField] || ""} onChange={(e) => update(fcxField, e.target.value)} style={{ border: "none", outline: "none", background: "transparent", fontFamily: MONO, fontSize: 10, textAlign: "center", padding: 0 }} /> : <span />}
              {rateField ? <input type="text" value={d[rateField] || ""} onChange={(e) => update(rateField, e.target.value)} style={{ border: "none", outline: "none", background: "transparent", fontFamily: MONO, fontSize: 10, textAlign: "right", padding: 0 }} /> : <span style={{ fontSize: 10, textAlign: "right" }}>0.0000</span>}
              {zwgField ? <input type="text" value={d[zwgField] || ""} onChange={(e) => update(zwgField, e.target.value)} style={{ border: "none", outline: "none", background: "transparent", fontFamily: MONO, fontSize: 10, fontWeight: "bold", textAlign: "right", padding: 0 }} /> : <span style={{ fontSize: 10, fontWeight: "bold", textAlign: "right" }}>0.00</span>}
            </div>
          ))}
          <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <span style={{ color: GREEN, fontWeight: "bold" }}>Total gross mass</span>
              <span style={{ borderBottom: `1px solid ${BLACK}`, minWidth: 120, display: "inline-block" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: GREEN, fontWeight: "bold" }}>Total Costs</span>
              <input type="text" value={d.totalCost || ""} onChange={(e) => update("totalCost", e.target.value)} style={{ border: "none", borderBottom: `1px solid ${BLACK}`, outline: "none", background: "transparent", fontFamily: MONO, fontWeight: "bold", fontSize: 11, width: 100, textAlign: "right", padding: 0 }} />
            </div>
          </div>
          <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: GREEN, fontWeight: "bold" }}>Delivery terms</span>
              <input type="text" value={d.delivCode || ""} onChange={(e) => update("delivCode", e.target.value)} style={{ border: "none", outline: "none", background: "transparent", fontFamily: MONO, fontWeight: "bold", width: 60, padding: 0 }} />
              <input type="text" value={d.delivPlace || ""} onChange={(e) => update("delivPlace", e.target.value)} style={{ border: "none", outline: "none", background: "transparent", fontFamily: MONO, fontWeight: "bold", width: 120, padding: 0 }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: GREEN, fontWeight: "bold" }}>CIF value</span>
              <input type="text" value={d.totalCIF || ""} onChange={(e) => update("totalCIF", e.target.value)} style={{ border: "none", borderBottom: `1px solid ${BLACK}`, outline: "none", background: "transparent", fontFamily: MONO, fontWeight: "bold", fontSize: 11, width: 100, textAlign: "right", padding: 0 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   AssessmentNotice (unchanged)
   ═══════════════════════════════════════════════════════════════════ */
function AssessmentNotice({ d, update }) {
  return (
    <div>
      <div style={{ background: GREEN, color: "#fff", padding: "4px 10px", fontWeight: "bold", fontSize: 12 }}>SAD - Assessment Notice</div>
      <div style={{ textAlign: "center", fontWeight: "bold", fontSize: 12, padding: "6px 0" }}>**** DECLARATION NOT YET ASSESSED ****</div>
      <div style={{ border: `2px solid ${GREEN}`, margin: "0 8px", padding: 16 }}>
        <div style={{ display: "flex", gap: 40, marginBottom: 16, alignItems: "flex-start" }}>
          <div>
            <Lbl>Customs Office</Lbl>
            <div style={{ display: "flex", gap: 6 }}>
              <EditableField value={d.officeCode} onChange={(v) => update("officeCode", v)} style={{ width: 60 }} />
              <EditableField value={d.officeName} onChange={(v) => update("officeName", v)} />
            </div>
          </div>
          <div>
            <Barcode value={d.declarantRef} />
            <div style={{ color: GREEN, fontSize: 10 }}>Identification of the declaration</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 16 }}>
          {[
            ["Model",                ["declType", "genProc"]],
            ["Customs reference",    []],
            ["Declarant reference",  ["year", "declarantRef"]],
            ["Assessment reference", []],
            ["Nbr of Items",         ["totalItems"]],
          ].map(([lbl, fields]) => (
            <div key={lbl}>
              <Lbl>{lbl}</Lbl>
              <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${BLACK}`, minWidth: 100 }}>
                {fields.map(f => (
                  <input key={f} type="text" value={d[f] || ""} onChange={(e) => update(f, e.target.value)} style={{ border: "none", outline: "none", background: "transparent", fontFamily: MONO, fontWeight: "bold", fontSize: 11, padding: "0 0 2px 0", width: 60 }} />
                ))}
                {fields.length === 0 && <span style={{ display: "inline-block", minWidth: 100 }} />}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 16 }}>
          <Lbl>Declarant</Lbl>
          <EditableField value={d.declarantCode} onChange={(v) => update("declarantCode", v)} />
          <EditableField value={d.declarantName} onChange={(v) => update("declarantName", v)} multiline rows={2} />
        </div>
        <div style={{ borderTop: `1px solid ${GREEN}`, paddingTop: 12 }}>
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            {[
              ["Mode of payment",           "paymentMode"],
              ["Account number",            "deferredRef"],
              ["Receipt number and date",   null],
              ["Statement number and date", null],
            ].map(([lbl, field]) => (
              <div key={lbl}>
                <Lbl>{lbl}</Lbl>
                <div style={{ borderBottom: `1px solid ${BLACK}`, minWidth: 100 }}>
                  {field ? <input type="text" value={d[field] || ""} onChange={(e) => update(field, e.target.value)} style={{ border: "none", outline: "none", background: "transparent", fontFamily: MONO, fontWeight: "bold", fontSize: 11, padding: "0 0 2px 0", width: 100 }} /> : <span style={{ display: "inline-block", minWidth: 100 }} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   AswScanDoc (unchanged)
   ═══════════════════════════════════════════════════════════════════ */
function AswScanDoc({ d }) {
  return (
    <div>
      <div style={{ background: GREEN, color: "#fff", padding: "4px 10px", fontWeight: "bold", fontSize: 12 }}>SAD - Single window attached Scanned Documents Page</div>
      <div style={{ border: `2px solid ${GREEN}`, margin: 8, padding: 16 }}>
        <div style={{ display: "flex", gap: 40, marginBottom: 16, alignItems: "flex-start" }}>
          <div>
            <Lbl>Customs Office</Lbl>
            <div style={{ fontWeight: "bold" }}>{d.officeCode}  {d.officeName}</div>
          </div>
          <div>
            <Barcode value={d.declarantRef} />
            <div style={{ color: GREEN, fontSize: 10 }}>Identification of the declaration</div>
          </div>
        </div>
        <div style={{ border: `1px solid #ccc`, padding: 12, marginTop: 16 }}>
          <Lbl>General segment</Lbl>
          <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
            <span style={{ color: GREEN, fontSize: 10, fontWeight: "bold" }}>Doc. ref. date</span>
            <span style={{ color: GREEN, fontSize: 10, fontWeight: "bold", marginLeft: 80 }}>Doc. reference</span>
          </div>
          <div style={{ border: `1px solid #aaa`, padding: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "80px 180px 100px 140px 100px 100px", fontSize: 9, color: GREEN, fontWeight: "bold", borderBottom: "1px solid #ddd", paddingBottom: 4 }}>
              <span>Type</span><span>Type name</span><span>Date</span><span>Reference</span><span>Submitter</span><span>instanceID</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
export default function ZimraBOEViewer() {
  const [formData,   setFormData]   = useState(null);
  const [tab,        setTab]        = useState("S.A.D.");
  const [activePage, setActivePage] = useState(1);
  const [dragging,   setDragging]   = useState(false);
  const [error,      setError]      = useState("");
  const fileRef = useRef();

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateItemField = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item),
    }));
  };

  const handleFile = (file) => {
    if (!file) return;
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = parseASYCUDAXml(e.target.result);
        setFormData(parsed);
        setTab("S.A.D.");
        setActivePage(1);
      } catch (err) {
        setError("Failed to parse XML: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const TABS = ["S.A.D.", "Val. Note", "Asmt. Notice", "Info. Page", "Scan. Doc.", "ASW Scan. Doc."];

  const ITEMS_PER_PAGE = 2;
  const totalPages  = formData ? Math.max(2, Math.ceil(formData.items.length / ITEMS_PER_PAGE)) : 1;
  const pageNumbers = Array.from({ length: Math.min(totalPages, 4) }, (_, i) => i + 1);
  const pageItems   = formData
    ? formData.items.slice((activePage - 1) * ITEMS_PER_PAGE, activePage * ITEMS_PER_PAGE)
    : [];

  return (
    <div style={{ background: "#c0c0c0", minHeight: "100vh", fontFamily: MONO, fontSize: 11 }}>

      {/* Windows chrome */}
      <div style={{ background: "#d4d0c8", borderBottom: "1px solid #808080", padding: "3px 8px", display: "flex", alignItems: "center", gap: 10, fontSize: 11 }}>
        <span style={{ fontWeight: "bold" }}>ASYCUDAWorld - zimra-boe-viewer</span>
      </div>
      <div style={{ background: "#d4d0c8", borderBottom: "1px solid #aaa", padding: "2px 12px", display: "flex", gap: 16, fontSize: 11 }}>
        {["File", "Edit", "View", "Help"].map(m => <span key={m} style={{ cursor: "pointer" }}>{m}</span>)}
      </div>
      <div style={{ background: "#d4d0c8", borderBottom: "1px solid #aaa", padding: "3px 8px", fontSize: 11 }}>
        📋 Detailed Declaration - New [{formData?.year || "2026"}]
      </div>

      {/* Upload prompt */}
      {!formData && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
          <div>
            <div
              onClick={() => fileRef.current.click()}
              onDrop={onDrop}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              style={{
                border: `3px dashed ${GREEN}`,
                borderRadius: 6,
                padding: "40px 80px",
                textAlign: "center",
                cursor: "pointer",
                background: dragging ? "#d4f5d4" : "#f0fff0",
                transition: "all 0.2s",
              }}
            >
              <input ref={fileRef} type="file" accept=".xml" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
              <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
              <div style={{ fontWeight: "bold", fontSize: 16, color: GREEN }}>Upload ASYCUDA XML File</div>
              <div style={{ fontSize: 12, color: "#555", marginTop: 8 }}>Drop your .xml Bill of Entry file here, or click to browse</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Supports Lunarae &amp; ASYCUDA World XML format</div>
            </div>
            {error && <div style={{ color: "red", textAlign: "center", marginTop: 10 }}>{error}</div>}
          </div>
        </div>
      )}

      {/* Form */}
      {formData && (
        <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 40px" }}>

          {/* Page tabs (left) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 80, marginRight: 4 }}>
            {pageNumbers.map(n => (
              <div
                key={n}
                onClick={() => setActivePage(n)}
                style={{
                  width: 24, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, cursor: "pointer", border: "1px solid #808080", fontFamily: MONO,
                  background: activePage === n ? "#c0392b" : "#d4d0c8",
                  color: activePage === n ? "#fff" : "#000",
                  fontWeight: activePage === n ? "bold" : "normal",
                }}
              >
                {n}
              </div>
            ))}
          </div>

          {/* BOE form */}
          <div style={{ width: 1060, background: "#fff", border: `2px solid ${GREEN}` }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "stretch", borderBottom: `2px solid ${GREEN}`, height: 76 }}>
              <ZimraLogo />
              <Scenery />
            </div>

            {/* Barcode row */}
            <div style={{ padding: "6px 14px", borderBottom: `1px solid ${GREEN}` }}>
              <Barcode value={formData.declarantRef} />
            </div>

            {/* Tab content */}
            {tab === "S.A.D." && (
              <div>
                {activePage === 1 && <SadHeader d={formData} update={updateField} />}
                {pageItems.map((item, localIdx) => {
                  const globalIdx = (activePage - 1) * ITEMS_PER_PAGE + localIdx;
                  return <ItemBlock key={item.num} item={item} index={globalIdx} updateItem={updateItemField} />;
                })}
                {activePage === totalPages && <AccountingSection d={formData} update={updateField} />}
              </div>
            )}
            {tab === "Val. Note"    && <ValuationNote d={formData} update={updateField} />}
            {tab === "Asmt. Notice" && <AssessmentNotice d={formData} update={updateField} />}
            {tab === "Info. Page"   && <div style={{ padding: 24, color: GREEN, fontWeight: "bold" }}>Info Page — no additional information in XML.</div>}
            {tab === "Scan. Doc."   && <div style={{ padding: 24, color: GREEN, fontWeight: "bold" }}>Scan. Doc. — attach scanned supporting documents here.</div>}
            {tab === "ASW Scan. Doc." && <AswScanDoc d={formData} />}

            {/* Bottom tab bar */}
            <div style={{ display: "flex", borderTop: `2px solid ${GREEN}`, background: "#d4d0c8" }}>
              {TABS.map(t => (
                <div
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: "4px 14px", border: "1px solid #808080", borderBottom: "none",
                    fontSize: 11, cursor: "pointer", fontFamily: MONO,
                    background: tab === t ? "#fff" : "#d4d0c8",
                    color: tab === t ? GREEN : "#000",
                    fontWeight: tab === t ? "bold" : "normal",
                    borderRight: "1px solid #808080",
                  }}
                >
                  {t}
                </div>
              ))}
              <div
                onClick={() => fileRef.current.click()}
                style={{ padding: "4px 14px", cursor: "pointer", marginLeft: "auto", color: GREEN, fontWeight: "bold", fontSize: 11, border: "1px solid #808080", borderBottom: "none", background: "#d4d0c8" }}
              >
                📂 Load XML
              </div>
              <input ref={fileRef} type="file" accept=".xml" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
