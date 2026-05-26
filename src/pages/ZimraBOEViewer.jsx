import { useState, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════════
   ZIMRA ASYCUDA World – Bill of Entry Viewer  (standalone)
   Mirrors the real ASYCUDA World form exactly.
   ═══════════════════════════════════════════════════════════════════ */

// ── XML Parser ──────────────────────────────────────────────────────────────
function parseASYCUDAXml(xmlStr) {
  const p = new DOMParser();
  const doc = p.parseFromString(xmlStr, "text/xml");

  // Safe text extractor – searches within a scoped element
  const t = (scope, tag) => {
    const el = scope?.querySelector(tag);
    const txt = el?.childNodes[0]?.textContent?.trim() || "";
    return txt === "null" ? "" : txt;
  };

  // Header / identification
  const officeCode   = t(doc, "Customs_clearance_office_code");
  const officeName   = t(doc, "Customs_Clearance_office_name");
  const declType     = t(doc, "Type_of_declaration");
  const genProc      = t(doc, "Declaration_gen_procedure_code");
  const forms        = t(doc, "Number_of_the_form");
  const totalForms   = t(doc, "Total_number_of_forms");
  const totalItems   = t(doc, "Total_number_of_items");
  const totalPkgs    = t(doc, "Total_number_of_packages");

  // Traders
  const exporterName  = t(doc, "Exporter_name");
  const consigneeName = t(doc, "Consignee_name");
  const declarantCode = t(doc, "Declarant_code");
  const declarantName = t(doc, "Declarant_name");

  // Declarant reference (inside <Declarant><Reference><Number>)
  const declarantEl  = doc.querySelector("Declarant");
  const declarantRef = declarantEl ? t(declarantEl, "Number") : "";

  // Countries
  const exportCountry     = t(doc, "Export_country_name");
  const exportCountryCode = t(doc, "Export_country_code");
  const destCountry       = t(doc, "Destination_country_name");
  const destCountryCode   = t(doc, "Destination_country_code");
  const tradingCountry    = t(doc, "Trading_country");
  const firstDest         = t(doc, "Country_first_destination");
  const originCountry     = t(doc, "Country_of_origin_name");
  const valueDetails      = t(doc, "Value_details");

  // Transport
  const transportMode   = t(doc, "Mode");
  const locationGoods   = t(doc, "Location_of_goods");
  const delivCode       = doc.querySelector("Delivery_terms Code")?.textContent?.trim() || "";
  const delivPlace      = doc.querySelector("Delivery_terms Place")?.textContent?.trim() || "";

  // Border / arrival transport IDs
  const borderEl      = doc.querySelector("Border_information");
  const borderId      = borderEl?.querySelector("Identity")?.textContent?.trim() || "";
  const borderNat     = borderEl?.querySelector("Nationality")?.textContent?.trim() || "";
  const arrEl         = doc.querySelector("Departure_arrival_information");
  const arrId         = arrEl?.querySelector("Identity")?.textContent?.trim() || "";
  const arrNat        = arrEl?.querySelector("Nationality")?.textContent?.trim() || "";

  // Invoice currency / rate from Gs_Invoice
  const gsInv       = doc.querySelector("Gs_Invoice");
  const invCurrency = gsInv ? t(gsInv, "Currency_code") : "";
  const invRate     = gsInv ? t(gsInv, "Currency_rate") : "";
  const invAmtFCX   = gsInv ? t(gsInv, "Amount_foreign_currency") : "";
  const invAmtZWG   = gsInv ? t(gsInv, "Amount_national_currency") : "";

  // Freight / insurance from valuation (general)
  const gsFrt   = doc.querySelector("Gs_internal_freight");
  const gsIns   = doc.querySelector("Gs_insurance");
  const frtAmtFCX = gsFrt ? t(gsFrt, "Amount_foreign_currency") : "0.00";
  const frtAmtZWG = gsFrt ? t(gsFrt, "Amount_national_currency") : "0.00";
  const insAmtFCX = gsIns ? t(gsIns, "Amount_foreign_currency") : "0.00";
  const insAmtZWG = gsIns ? t(gsIns, "Amount_national_currency") : "0.00";
  const totalCIF    = t(doc, "Total_CIF");
  const totalCost   = t(doc, "Total_cost");

  // Financial
  const paymentMode = t(doc, "Mode_of_payment");
  const deferredRef = t(doc, "Deffered_payment_reference");

  // Items
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
    const valueItem = t(el, "Value_item"); // "0.00+947.68+128.44+0.00-0.00"

    // Previous document
    const prevDocEl  = el.querySelector("Previous_doc");
    const summDecl   = prevDocEl ? t(prevDocEl, "Summary_declaration") : "";
    const summDeclSl = prevDocEl ? t(prevDocEl, "Summary_declaration_sl") : "";

    // Item invoice
    const itmInvEl   = el.querySelector("Item_Invoice");
    const itmCurr    = itmInvEl ? t(itmInvEl, "Currency_code") : "";
    const itmRate    = itmInvEl ? t(itmInvEl, "Currency_rate") : "";

    // Tax lines
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

// ── Number formatter ────────────────────────────────────────────────────────
const fmt = (v, d = 2) => {
  const n = parseFloat(String(v).replace(/\s/g, "").replace(",", "."));
  if (isNaN(n)) return v || "";
  return n.toLocaleString("en-ZA", { minimumFractionDigits: d, maximumFractionDigits: d });
};

// ── Base styles ─────────────────────────────────────────────────────────────
const GREEN  = "#006400";
const LGREEN = "#e8f5e8";
const BLACK  = "#000";
const MONO   = "'Courier New', Courier, monospace";

const base = {
  fontFamily: MONO,
  fontSize: 11,
  color: BLACK,
};

// ── Primitive building blocks ───────────────────────────────────────────────

/** A bordered cell. Pass label + value for simple cells, or children for custom content. */
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
            <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold", lineHeight: 1.2 }}>
              {lbl}
            </div>
          )}
          {val !== undefined && (
            <div style={{ fontWeight: "bold", fontSize: 11, whiteSpace: "pre-line", marginTop: 1 }}>
              {val}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Horizontal row of cells */
function R({ children, style }) {
  return (
    <div style={{ display: "flex", borderBottom: `1px solid ${GREEN}`, ...style }}>
      {children}
    </div>
  );
}

// ── Barcode ─────────────────────────────────────────────────────────────────
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

// ── ZIMRA Logo ───────────────────────────────────────────────────────────────
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

// ── Scenery header ───────────────────────────────────────────────────────────
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
        {/* Waterfall streaks */}
        {[340,350,360,370,380].map((x,i) => (
          <rect key={i} x={x} y={10} width={i%2===0?3:2} height={50} fill="rgba(255,255,255,0.55)" rx={1} />
        ))}
      </svg>
    </div>
  );
}

// ── Page 1: SAD header + general fields ─────────────────────────────────────
function SadHeader({ d }) {
  return (
    <>
      {/* ROW: Box 2 Exporter | Box 1 Declaration | Office */}
      <R>
        {/* Box 2 Exporter */}
        <C lbl="2 Exporter" w={330} mh={110}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>2 Exporter</div>
          <div style={{ fontWeight: "bold", whiteSpace: "pre-line", fontSize: 10.5, marginTop: 2 }}>{d.exporterName}</div>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold", marginTop: 6 }}>No.</div>
        </C>

        {/* Right: Declaration block */}
        <div style={{ flex: 1, borderLeft: `2px solid ${GREEN}` }}>
          {/* Sub-row: 1 / DECLARATION / A OFFICE */}
          <R style={{ borderBottom: `1px solid ${GREEN}` }}>
            <C w={30} lbl="1" />
            <div style={{ flex: 1, background: LGREEN, border: `1px solid ${GREEN}`, padding: "2px 6px", display: "flex", alignItems: "center" }}>
              <span style={{ color: GREEN, fontSize: 11, fontWeight: "bold", letterSpacing: 2 }}>DECLARATION</span>
            </div>
            <C w={220}>
              <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>A OFFICE OF DESTINATION</div>
              <div style={{ fontWeight: "bold", fontSize: 11 }}>{d.officeCode}</div>
            </C>
          </R>

          {/* Sub-row: IM | 4 | spacer | OFFICE NAME */}
          <R style={{ borderBottom: `1px solid ${GREEN}` }}>
            <C w={50}>
              <div style={{ fontWeight: "bold", fontSize: 16 }}>{d.declType}</div>
            </C>
            <C w={40}>
              <div style={{ fontWeight: "bold", fontSize: 16 }}>{d.genProc}</div>
            </C>
            <C flex={1} />
            <C w={220}>
              <div style={{ fontWeight: "bold", fontSize: 10 }}>{d.officeName}</div>
            </C>
          </R>

          {/* Sub-row: 3 Forms | 4 Load List | Manifest */}
          <R style={{ borderBottom: `1px solid ${GREEN}` }}>
            <C w={120}>
              <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>3 Forms</div>
              <div style={{ fontWeight: "bold" }}>{d.forms}   {d.totalForms}</div>
            </C>
            <C w={130}>
              <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>4 Load List</div>
            </C>
            <C flex={1}>
              <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>Manifest</div>
            </C>
          </R>

          {/* Sub-row: 5 Items | 6 Nbr packages | 7 Reference number */}
          <R>
            <C w={120}>
              <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>5 Items</div>
              <div style={{ fontWeight: "bold" }}>{d.totalItems}</div>
            </C>
            <C w={130}>
              <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>6 Nbr packages</div>
              <div style={{ fontWeight: "bold" }}>{d.totalPkgs}</div>
            </C>
            <C flex={1}>
              <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>7 Reference number</div>
              <div style={{ fontWeight: "bold" }}>{d.year}    {d.declarantRef}</div>
            </C>
          </R>
        </div>
      </R>

      {/* ROW: Box 8 Consignee | Box 9 Financial */}
      <R>
        <C w={330} mh={80}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>8 Consignee</div>
          <div style={{ fontWeight: "bold", whiteSpace: "pre-line", fontSize: 10.5, marginTop: 2 }}>{d.consigneeName}</div>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold", marginTop: 6 }}>No.</div>
        </C>
        <C flex={1} mh={80}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>9 Financial</div>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold", marginTop: 30 }}>No.</div>
        </C>
      </R>

      {/* ROW: Country last con | 11 Trading | 12 Value | 13 CAP */}
      <R>
        <C w={150}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>Country last con.</div>
          <div style={{ fontWeight: "bold" }}>{d.firstDest}</div>
        </C>
        <C w={150}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>11 Trading cty.</div>
          <div style={{ fontWeight: "bold" }}>{d.tradingCountry}</div>
        </C>
        <C w={200}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>12 Value details</div>
          <div style={{ fontWeight: "bold" }}>{fmt(d.valueDetails)}</div>
        </C>
        <C flex={1}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>13 C.A.P.</div>
        </C>
      </R>

      {/* ROW: Box 14 Declarant | Country fields */}
      <R>
        <C w={330} mh={90}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>14 Declarant</div>
          <div style={{ fontWeight: "bold", fontSize: 10.5 }}>No.  {d.declarantCode}</div>
          <div style={{ fontWeight: "bold", whiteSpace: "pre-line", fontSize: 10.5, marginTop: 2 }}>{d.declarantName}</div>
        </C>
        <div style={{ flex: 1, borderLeft: `1px solid ${GREEN}` }}>
          <R style={{ borderBottom: `1px solid ${GREEN}` }}>
            <C flex={1}>
              <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>15 Country of export</div>
              <div style={{ fontWeight: "bold" }}>{d.exportCountry}</div>
            </C>
            <C w={90}>
              <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>15 C.E. Code</div>
              <div style={{ fontWeight: "bold" }}>{d.exportCountryCode}</div>
            </C>
            <C w={110}>
              <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>17 C.D. Code</div>
              <div style={{ fontWeight: "bold" }}>{d.destCountryCode}</div>
            </C>
          </R>
          <R>
            <C flex={1}>
              <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>16 Country of origin</div>
              <div style={{ fontWeight: "bold" }}>{d.originCountry}</div>
            </C>
            <C flex={1}>
              <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>17 Country of destination</div>
              <div style={{ fontWeight: "bold" }}>{d.destCountry}</div>
            </C>
          </R>
        </div>
      </R>

      {/* ROW: Box 18 Identity arrival | 19 Ctr | 20 Delivery */}
      <R>
        <C flex={1}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>18 Identity and nationality of means of transport at arrival</div>
          <div style={{ fontWeight: "bold" }}>{d.arrId}  {d.arrNat}</div>
        </C>
        <C w={60}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>19 Ctr.</div>
          <div style={{ border: `1px solid ${GREEN}`, width: 13, height: 13, marginTop: 4 }} />
        </C>
        <C w={270}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>20 Delivery terms</div>
          <div style={{ fontWeight: "bold" }}>{d.delivCode}   {d.delivPlace}</div>
        </C>
      </R>

      {/* ROW: Box 21 Border transport | 22 Currency | 23 Exch rate | 24 Nature */}
      <R>
        <C flex={1}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>21 Identity and nationality of active means of transport crossing the border</div>
          <div style={{ fontWeight: "bold" }}>{d.borderI}  {d.borderNat}</div>
        </C>
        <C w={210}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>22 Currency &amp; total amount invoiced</div>
          <div style={{ fontWeight: "bold" }}>{d.invCurrency}   {fmt(d.invAmtFCX)}</div>
        </C>
        <C w={100}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>23 Exch. rate</div>
          <div style={{ fontWeight: "bold" }}>{d.invRate}</div>
        </C>
        <C w={110}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>24 Nature of transac.</div>
        </C>
      </R>

      {/* ROW: Box 25 Mode | 26 Inland | 27 Place | 28 Financial */}
      <R>
        <C w={160}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>25 Mode transport at border</div>
          <div style={{ fontWeight: "bold" }}>{d.transportMode}</div>
        </C>
        <C w={130}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>26 Inland mode Transport</div>
        </C>
        <C w={200}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>27 Place of discharge</div>
        </C>
        <C flex={1}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>28 Financial and banking data  Bank Code</div>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold", marginTop: 6 }}>Terms of payment</div>
        </C>
      </R>

      {/* ROW: Box 29 Office of entry | 30 Location */}
      <R>
        <C w={300}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>29 Office of entry</div>
          <div style={{ fontWeight: "bold" }}>{d.officeCode}  {d.officeName}</div>
        </C>
        <C w={200}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>30 Location of goods</div>
          <div style={{ fontWeight: "bold" }}>{d.locationGoods}</div>
        </C>
        <C flex={1} />
      </R>
    </>
  );
}

// ── Item block (boxes 31–47) ─────────────────────────────────────────────────
function ItemBlock({ item }) {
  const prevDoc = item.summDecl
    ? `${item.summDecl}${item.summDeclSl ? "  S/L  " + item.summDeclSl : "  S/L"}`
    : "S/L";

  return (
    <div style={{ borderTop: `2px solid ${GREEN}` }}>

      {/* ROW: 31 left label | marks/packages | 32 Item | 33 Commodity */}
      <R>
        {/* Box 31 label */}
        <C w={90} mh={130} style={{ borderRight: `2px solid ${GREEN}` }}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold", lineHeight: 1.6 }}>
            31 Packages<br />and.<br />description<br />of goods
          </div>
        </C>

        <div style={{ flex: 1 }}>
          <R style={{ borderBottom: `1px solid ${GREEN}` }}>
            {/* Marks / packages */}
            <div style={{ flex: 1, padding: "2px 4px", borderRight: `1px solid ${GREEN}` }}>
              <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>Marks and numbers - Containers No(s) - Number and kind</div>
              <div style={{ fontWeight: "bold", marginTop: 2 }}>Marks &amp; no  {item.marks}</div>
              <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>of packages</div>
              <div style={{ fontWeight: "bold" }}>Nbr &amp; Kind  {item.numPkgs}  {item.kindCode}</div>
              <div style={{ fontSize: 10, color: "#333", marginLeft: 80 }}>{item.kindName}</div>
            </div>

            {/* Right: 32 / 33 / 34-39 / 40 */}
            <div style={{ width: 360 }}>
              <R style={{ borderBottom: `1px solid ${GREEN}` }}>
                <C w={70}>
                  <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>32 Item</div>
                  <div style={{ fontWeight: "bold" }}>{item.num}  No.</div>
                </C>
                <C flex={1}>
                  <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>33 Commodity code</div>
                  <div style={{ fontWeight: "bold" }}>{item.commCode}  {item.prec1}</div>
                </C>
              </R>
              <R style={{ borderBottom: `1px solid ${GREEN}` }}>
                <C w={110}>
                  <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>34 Cty. orig. Code</div>
                  <div style={{ fontWeight: "bold" }}>{item.origCode}</div>
                </C>
                <C w={130}>
                  <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>35 Gross mass (kg)</div>
                  <div style={{ fontWeight: "bold", textAlign: "right" }}>{item.grossWt}</div>
                </C>
                <C flex={1}>
                  <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>36 Prefer.</div>
                </C>
              </R>
              <R style={{ borderBottom: `1px solid ${GREEN}` }}>
                <C w={110}>
                  <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>37 PROCEDURE</div>
                  <div style={{ fontWeight: "bold" }}>{item.extProc}  {item.natProc}</div>
                </C>
                <C w={130}>
                  <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>38 Net mass (kg)</div>
                  <div style={{ fontWeight: "bold", textAlign: "right" }}>{item.netWt}</div>
                </C>
                <C flex={1}>
                  <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>39 Quota</div>
                </C>
              </R>
              <R>
                <C flex={1}>
                  <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>40 Summary declaration / Previous document</div>
                  <div style={{ fontWeight: "bold" }}>{prevDoc}</div>
                </C>
              </R>
            </div>
          </R>

          {/* ROW: Containers / description | 41 Supp | 42 Item Price | 43 VM */}
          <R style={{ borderBottom: `1px solid ${GREEN}` }}>
            <div style={{ flex: 1, padding: "2px 4px", borderRight: `1px solid ${GREEN}` }}>
              <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>Containers No(s)</div>
              <div style={{ marginTop: 6, fontSize: 11 }}>{item.descGoods}</div>
              <div style={{ marginTop: 4, fontWeight: "bold", fontSize: 12 }}>{item.commDesc}</div>
            </div>

            <div style={{ width: 360 }}>
              <R style={{ borderBottom: `1px solid ${GREEN}` }}>
                <C w={160}>
                  <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>41 Supplementary units</div>
                </C>
                <C w={130}>
                  <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>42 Item Price</div>
                  <div style={{ fontWeight: "bold", textAlign: "right" }}>{fmt(item.itemPrice)}</div>
                </C>
                <C flex={1}>
                  <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>43 V.M. code</div>
                </C>
              </R>
              <R style={{ borderBottom: `1px solid ${GREEN}` }}>
                <C flex={1}>
                  <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>A.I. Code</div>
                </C>
                <C w={190}>
                  <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>45 Adjustment</div>
                  <div style={{ fontWeight: "bold", textAlign: "right" }}>{item.adj}</div>
                </C>
              </R>
              <R>
                <C flex={1}>
                  <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>41bis Write-off units</div>
                </C>
                <C w={190}>
                  <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>46 Statistical value</div>
                  <div style={{ fontWeight: "bold", textAlign: "right" }}>{fmt(item.statVal)}</div>
                </C>
              </R>
            </div>
          </R>

          {/* ROW: 44 Add info | 47 Tax grid */}
          <R>
            {/* Box 44 label */}
            <C w={90} mh={100} style={{ borderRight: `1px solid ${GREEN}` }}>
              <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold", lineHeight: 1.6 }}>
                44 Add. info<br />Documents<br />Produced<br />Certificates<br />and autho-<br />risations
              </div>
            </C>

            {/* Licence / D.Val / D.Qty / add text */}
            <div style={{ width: 180, padding: "2px 4px", borderRight: `1px solid ${GREEN}` }}>
              <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                <span style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>Licence No</span>
                <span style={{ fontWeight: "bold", fontSize: 10 }}>{item.licNo}</span>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                <span style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>D.Val</span>
                <span style={{ color: GREEN, fontSize: 9, fontWeight: "bold", marginLeft: 24 }}>D.Qty</span>
              </div>
              <div style={{ fontSize: 10, marginTop: 4 }}>{item.valueItem}</div>
              <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold", marginTop: 6 }}>A.D.</div>
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
                  {/* Header row */}
                  <div style={{ display: "flex", background: LGREEN, borderBottom: `1px solid ${GREEN}` }}>
                    {["Type", "Tax base", "Rate", "Amount", "MP"].map(h => (
                      <div key={h} style={{ flex: 1, padding: "1px 3px", color: GREEN, fontSize: 9, fontWeight: "bold", borderRight: `1px solid ${GREEN}` }}>
                        {h}
                      </div>
                    ))}
                  </div>
                  {/* Tax lines — show actual lines then empty rows to fill */}
                  {Array.from({ length: Math.max(item.taxLines.length, 4) }, (_, i) => {
                    const tl = item.taxLines[i] || {};
                    return (
                      <div key={i} style={{ display: "flex", borderBottom: `1px solid #ddd`, minHeight: 16 }}>
                        {[tl.code, tl.base ? fmt(tl.base) : "", tl.rate, tl.amount ? fmt(tl.amount) : "", tl.mp].map((v, j) => (
                          <div key={j} style={{ flex: 1, padding: "1px 3px", fontWeight: "bold", fontSize: 10, borderRight: `1px solid #ddd`, textAlign: j === 1 || j === 3 ? "right" : "left" }}>
                            {v || ""}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                  {/* Total row */}
                  <div style={{ borderTop: `1px solid ${GREEN}`, padding: "1px 4px", color: GREEN, fontWeight: "bold", fontSize: 9, textAlign: "center" }}>
                    Total
                  </div>
                </div>
              </div>
            </div>
          </R>
        </div>
      </R>
    </div>
  );
}

// ── Accounting / Signature section (page 2 bottom) ───────────────────────────
function AccountingSection({ d }) {
  return (
    <div style={{ borderTop: `2px solid ${GREEN}` }}>
      {/* 48 Account / 49 Warehouse / B Accounting */}
      <R>
        <C w={90} mh={120} style={{ borderRight: `2px solid ${GREEN}` }}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold", lineHeight: 1.6 }}>
            47 Calcul-<br />ation of<br />taxes
          </div>
        </C>
        <div style={{ flex: 1 }}>
          {/* Empty global tax grid */}
          <div style={{ display: "flex", background: LGREEN, borderBottom: `1px solid ${GREEN}` }}>
            {["Type", "Tax base", "Rate", "Amount", "MP"].map(h => (
              <div key={h} style={{ flex: 1, padding: "1px 3px", color: GREEN, fontSize: 9, fontWeight: "bold", borderRight: `1px solid ${GREEN}` }}>{h}</div>
            ))}
          </div>
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} style={{ display: "flex", borderBottom: `1px solid #ddd`, minHeight: 14 }}>
              {[0, 1, 2, 3, 4].map(j => <div key={j} style={{ flex: 1, borderRight: `1px solid #ddd` }} />)}
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${GREEN}`, padding: "2px 4px", color: GREEN, fontWeight: "bold", fontSize: 9, textAlign: "center" }}>Total</div>
        </div>

        {/* B Accounting block */}
        <div style={{ width: 440, borderLeft: `2px solid ${GREEN}` }}>
          <R style={{ borderBottom: `1px solid ${GREEN}` }}>
            <C flex={1}>
              <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>48 Account Code</div>
              <div style={{ fontWeight: "bold" }}>{d.deferredRef}</div>
            </C>
            <C flex={1}>
              <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>49 Identification of warehouse</div>
            </C>
          </R>
          <div style={{ background: GREEN, color: "#fff", padding: "2px 8px", fontSize: 10, fontWeight: "bold" }}>
            B ACCOUNTING DETAILS
          </div>
          <div style={{ padding: "4px 8px" }}>
            {[
              ["Mode of payment",    d.paymentMode],
              ["Assessment number",  "         /  Date"],
              ["Receipt number",     "             Date"],
              ["Guarantee",          "             Date"],
              ["Total fees",         "             ZWG"],
              ["Total declaration",  "             ZWG"],
            ].map(([lbl, val]) => (
              <div key={lbl} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dotted #ccc", padding: "2px 0", fontSize: 11 }}>
                <span style={{ color: GREEN, fontWeight: "bold" }}>{lbl}</span>
                <span style={{ fontWeight: "bold" }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </R>

      {/* Box 50 Principal / Signature | 51 Transit | C Office */}
      <R style={{ minHeight: 80 }}>
        <C flex={1} mh={80}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>50 Principal</div>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>No.</div>
          <div style={{ marginTop: 32, borderBottom: `1px solid ${BLACK}`, width: "55%" }} />
          <div style={{ fontSize: 10, marginTop: 2 }}>Signature</div>
        </C>
        <C w={140} mh={80}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>51 Intended offices of transit and country</div>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold", marginTop: 20 }}>Represented by</div>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>Place and date</div>
        </C>
        <C flex={1} mh={80}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>C OFFICE OF DEPARTURE</div>
        </C>
      </R>

      {/* Box 52 Guarantee | 53 Office destination */}
      <R>
        <C flex={1}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>52 Guarantee</div>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>Account</div>
        </C>
        <C w={60}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>Code</div>
        </C>
        <C flex={1}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>53 Office of destination and country</div>
        </C>
      </R>

      {/* D Control */}
      <R style={{ minHeight: 80 }}>
        <C flex={1} mh={80}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>D CONTROL BY OFFICE OF DESTINATION</div>
          <div style={{ marginTop: 36, borderBottom: `1px solid ${BLACK}`, width: "40%" }} />
          <div style={{ fontSize: 10, marginTop: 2 }}>Signature</div>
        </C>
        <C w={200} mh={80}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>Stamp:</div>
        </C>
        <C flex={1} mh={80}>
          <div style={{ color: GREEN, fontSize: 9, fontWeight: "bold" }}>54 Place and date</div>
        </C>
      </R>
    </div>
  );
}

// ── Valuation Note tab ───────────────────────────────────────────────────────
function ValuationNote({ d }) {
  const rows = [
    ["Invoice value", fmt(d.invAmtFCX), d.invCurrency, d.invRate, fmt(d.invAmtZWG)],
    ["Freight 1.........(import)..............", "0.00", "", "0.0000", "0.00"],
    ["Freight 2....................................", fmt(d.frtAmtFCX), d.invCurrency, d.invRate, fmt(d.frtAmtZWG)],
    ["Insurance ..................(import)..............", fmt(d.insAmtFCX), d.invCurrency, d.invRate, fmt(d.insAmtZWG)],
    ["Other costs ..................(import)..............", "0.00", "", "0.0000", "0.00"],
    ["Deductions .....................................", "0.00", "", "0.0000", "0.00"],
  ];
  return (
    <div>
      <div style={{ background: GREEN, color: "#fff", padding: "4px 10px", fontWeight: "bold", fontSize: 12 }}>
        SAD - Valuation Note - General segment
      </div>
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
          {rows.map(([lbl, amt, fcx, rate, zwg], i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "260px 80px 30px 80px 110px 110px", gap: 4, borderBottom: "1px dotted #eee", padding: "4px 0" }}>
              <span style={{ color: GREEN, fontSize: 10 }}>{lbl}</span>
              <span style={{ textAlign: "right", fontSize: 10 }}>{amt}</span>
              <span style={{ textAlign: "center", fontSize: 10 }}>in</span>
              <span style={{ textAlign: "center", fontSize: 10 }}>{fcx}</span>
              <span style={{ textAlign: "right", fontSize: 10 }}>{rate}</span>
              <span style={{ textAlign: "right", fontWeight: "bold", fontSize: 10 }}>{zwg}</span>
            </div>
          ))}
          <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <span style={{ color: GREEN, fontWeight: "bold" }}>Total gross mass</span>
              <span style={{ borderBottom: `1px solid ${BLACK}`, minWidth: 120, display: "inline-block" }} />
            </div>
            <div>
              <span style={{ color: GREEN, fontWeight: "bold", marginRight: 8 }}>Total Costs</span>
              <span style={{ fontWeight: "bold" }}>{fmt(d.totalCost)}</span>
            </div>
          </div>
          <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between" }}>
            <div>
              <span style={{ color: GREEN, fontWeight: "bold", marginRight: 8 }}>Delivery terms</span>
              <span style={{ fontWeight: "bold" }}>{d.delivCode}    {d.delivPlace}</span>
            </div>
            <div>
              <span style={{ color: GREEN, fontWeight: "bold", marginRight: 8 }}>CIF value</span>
              <span style={{ fontWeight: "bold" }}>{fmt(d.totalCIF)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Assessment Notice tab ────────────────────────────────────────────────────
function AssessmentNotice({ d }) {
  return (
    <div>
      <div style={{ background: GREEN, color: "#fff", padding: "4px 10px", fontWeight: "bold", fontSize: 12 }}>
        SAD - Assessment Notice
      </div>
      <div style={{ textAlign: "center", fontWeight: "bold", fontSize: 12, padding: "6px 0" }}>
        **** DECLARATION NOT YET ASSESSED ****
      </div>
      <div style={{ border: `2px solid ${GREEN}`, margin: "0 8px", padding: 16 }}>
        <div style={{ display: "flex", gap: 40, marginBottom: 16, alignItems: "flex-start" }}>
          <div>
            <div style={{ color: GREEN, fontWeight: "bold", fontSize: 10 }}>Customs Office</div>
            <div style={{ fontWeight: "bold" }}>{d.officeCode}  {d.officeName}</div>
          </div>
          <div>
            <Barcode value={d.declarantRef} />
            <div style={{ color: GREEN, fontSize: 10 }}>Identification of the declaration</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 16 }}>
          {[
            ["Model",                 `${d.declType}    ${d.genProc}`],
            ["Customs reference",     ""],
            ["Declarant reference",   `${d.year}  ${d.declarantRef}`],
            ["Assessment reference",  "    /"],
            ["Nbr of Items",          d.totalItems],
          ].map(([lbl, val]) => (
            <div key={lbl}>
              <div style={{ color: GREEN, fontWeight: "bold", fontSize: 10 }}>{lbl}</div>
              <div style={{ fontWeight: "bold", borderBottom: `1px solid ${BLACK}`, minWidth: 100, paddingBottom: 2 }}>{val}</div>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: GREEN, fontWeight: "bold", fontSize: 10 }}>Declarant</div>
          <div style={{ fontWeight: "bold" }}>{d.declarantCode}</div>
          <div style={{ fontWeight: "bold", whiteSpace: "pre-line" }}>{d.declarantName}</div>
        </div>
        <div style={{ borderTop: `1px solid ${GREEN}`, paddingTop: 12 }}>
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            {[
              ["Mode of payment",          d.paymentMode],
              ["Account number",           d.deferredRef],
              ["Receipt number and date",  ""],
              ["Statement number and date",""],
            ].map(([lbl, val]) => (
              <div key={lbl}>
                <div style={{ color: GREEN, fontWeight: "bold", fontSize: 10 }}>{lbl}</div>
                <div style={{ fontWeight: "bold", borderBottom: `1px solid ${BLACK}`, minWidth: 100, paddingBottom: 2 }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ color: GREEN, fontWeight: "bold", fontSize: 10 }}>Items taxes</div>
            <div style={{ fontWeight: "bold", borderBottom: `1px solid ${BLACK}`, minWidth: 200, paddingBottom: 2 }} />
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ color: GREEN, fontWeight: "bold", fontSize: 10 }}>Global taxes</div>
            <div style={{ fontWeight: "bold", borderBottom: `1px solid ${BLACK}`, minWidth: 200, paddingBottom: 2 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ASW Scan Doc tab ─────────────────────────────────────────────────────────
function AswScanDoc({ d }) {
  return (
    <div>
      <div style={{ background: GREEN, color: "#fff", padding: "4px 10px", fontWeight: "bold", fontSize: 12 }}>
        SAD - Single window attached Scanned Documents Page
      </div>
      <div style={{ border: `2px solid ${GREEN}`, margin: 8, padding: 16 }}>
        <div style={{ display: "flex", gap: 40, marginBottom: 16, alignItems: "flex-start" }}>
          <div>
            <div style={{ color: GREEN, fontWeight: "bold", fontSize: 10 }}>Customs Office</div>
            <div style={{ fontWeight: "bold" }}>{d.officeCode}  {d.officeName}</div>
          </div>
          <div>
            <Barcode value={d.declarantRef} />
            <div style={{ color: GREEN, fontSize: 10 }}>Identification of the declaration</div>
          </div>
        </div>
        <div style={{ border: `1px solid #ccc`, padding: 12, marginTop: 16 }}>
          <div style={{ color: GREEN, fontWeight: "bold", fontSize: 10, marginBottom: 4 }}>General segment</div>
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

// ── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ZimraBOEViewer() {
  const [data, setData]       = useState(null);
  const [tab, setTab]         = useState("S.A.D.");
  const [activePage, setActivePage] = useState(1);
  const [dragging, setDragging]   = useState(false);
  const [error, setError]     = useState("");
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = parseASYCUDAXml(e.target.result);
        setData(parsed);
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

  // Items per page on SAD: page 1 = first 2 items, page 2 = next 2, etc.
  const ITEMS_PER_PAGE = 2;
  const totalPages = data ? Math.max(2, Math.ceil(data.items.length / ITEMS_PER_PAGE)) : 1;
  const pageNumbers = Array.from({ length: Math.min(totalPages, 4) }, (_, i) => i + 1);

  const pageItems = data
    ? data.items.slice((activePage - 1) * ITEMS_PER_PAGE, activePage * ITEMS_PER_PAGE)
    : [];

  return (
    <div style={{ background: "#c0c0c0", minHeight: "100vh", fontFamily: MONO, fontSize: 11 }}>

      {/* ── Windows chrome ── */}
      <div style={{ background: "#d4d0c8", borderBottom: "1px solid #808080", padding: "3px 8px", display: "flex", alignItems: "center", gap: 10, fontSize: 11 }}>
        <span style={{ fontWeight: "bold" }}>ASYCUDAWorld - zimra-boe-viewer</span>
      </div>
      <div style={{ background: "#d4d0c8", borderBottom: "1px solid #aaa", padding: "2px 12px", display: "flex", gap: 16, fontSize: 11 }}>
        {["File", "Edit", "View", "Help"].map(m => <span key={m} style={{ cursor: "pointer" }}>{m}</span>)}
      </div>
      <div style={{ background: "#d4d0c8", borderBottom: "1px solid #aaa", padding: "3px 8px", fontSize: 11 }}>
        📋 Detailed Declaration - New [{data?.year || "2026"}]
      </div>

      {/* ── Upload (no data) ── */}
      {!data && (
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
              <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Supports Lunarae & ASYCUDA World XML format</div>
            </div>
            {error && <div style={{ color: "red", textAlign: "center", marginTop: 10 }}>{error}</div>}
          </div>
        </div>
      )}

      {/* ── Form ── */}
      {data && (
        <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 40px" }}>

          {/* Page number tabs (left side) */}
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

          {/* The actual BOE form */}
          <div style={{ width: 1060, background: "#fff", border: `2px solid ${GREEN}` }}>

            {/* ZIMRA header */}
            <div style={{ display: "flex", alignItems: "stretch", borderBottom: `2px solid ${GREEN}`, height: 76 }}>
              <ZimraLogo />
              <Scenery />
            </div>

            {/* Barcode row */}
            <div style={{ padding: "6px 14px", borderBottom: `1px solid ${GREEN}` }}>
              <Barcode value={data.declarantRef} />
            </div>

            {/* Tab content */}
            {tab === "S.A.D." && (
              <div>
                {activePage === 1 && <SadHeader d={data} />}
                {pageItems.map(item => <ItemBlock key={item.num} item={item} />)}
                {/* Show accounting section on the last page */}
                {activePage === totalPages && <AccountingSection d={data} />}
              </div>
            )}

            {tab === "Val. Note"    && <ValuationNote d={data} />}
            {tab === "Asmt. Notice" && <AssessmentNotice d={data} />}
            {tab === "Info. Page"   && (
              <div style={{ padding: 24, color: GREEN, fontWeight: "bold" }}>
                Info Page — no additional information in XML.
              </div>
            )}
            {tab === "Scan. Doc."   && (
              <div style={{ padding: 24, color: GREEN, fontWeight: "bold" }}>
                Scan. Doc. — attach scanned supporting documents here.
              </div>
            )}
            {tab === "ASW Scan. Doc." && <AswScanDoc d={data} />}

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
