import { useState, useRef, useCallback, useEffect } from "react";

// ── ASYCUDA XML Generator ─────────────────────────────────────────────────
function generateASYCUDAXml(boe, rbzRate) {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const ref = `LUN-${Date.now().toString().slice(-8)}`;
  const rbz = parseFloat(rbzRate) || 13.5;

  const portCodes = {
    "Beitbridge": "ZWBB",
    "Forbes (Mutare)": "ZWMT",
    "Chirundu": "ZWCH",
    "Plumtree": "ZWPL",
    "Victoria Falls": "ZWVF",
    "Harare Airport": "ZWHA",
    "Bulawayo Airport": "ZWBA",
    "Joshua Nkomo Airport": "ZWJN",
  };
  const officeCode = portCodes[boe.port_of_entry] || "ZWBB";
  const officeName = `${(boe.port_of_entry || "BEITBRIDGE").toUpperCase()} CUSTOM HOUSE`;

  const transportModeCode = { Road: "30", Air: "40", Sea: "10", Rail: "20" };
  const modeCode = transportModeCode[boe.mode_of_transport] || "30";

  const totalFob = boe.totals?.total_fob_usd || 0;
  const totalCif = boe.totals?.total_cif_usd || 0;
  const freightUsd = boe.freight_usd || 0;
  const insuranceUsd = boe.insurance_usd || 0;

  const n = (v, d = 2) => Number(v || 0).toFixed(d);
  const nn = (v) => Number(v || 0);

  const itemsXml = (boe.line_items || []).map((item) => {
    const cifZwg = nn(item.cif_value_usd) * rbz;
    const dutyBase = nn(item.cif_value_usd) * rbz;
    const dutyAmt = nn(item.customs_duty_usd) * rbz;
    const vatBase = nn(item.vat_base_usd) * rbz;
    const vatAmt = nn(item.vat_usd) * rbz;
    const totalTax = dutyAmt + vatAmt;
    const hsRaw = (item.hs_code || "").replace(/\./g, "");
    const hsFull = hsRaw.padEnd(8, "0").slice(0, 8);

    return `  <Item>
    <Packages>
      <Number_of_packages>${item.quantity || 0}</Number_of_packages>
      <Marks1_of_packages>ADD</Marks1_of_packages>
      <Marks2_of_packages><null/></Marks2_of_packages>
      <Kind_of_packages_code>15</Kind_of_packages_code>
      <Kind_of_packages_name>Part of a package</Kind_of_packages_name>
    </Packages>
    <IncoTerms>
      <Code>CIF</Code>
      <Place>${(boe.port_of_entry || "BEITBRIDGE").toUpperCase()}</Place>
    </IncoTerms>
    <Tarification>
      <Tarification_data><null/></Tarification_data>
      <HScode>
        <Commodity_code>${hsFull}</Commodity_code>
        <Precision_1>000</Precision_1>
        <Precision_2><null/></Precision_2>
        <Precision_3><null/></Precision_3>
        <Precision_4><null/></Precision_4>
      </HScode>
      <Preference_code><null/></Preference_code>
      <Extended_customs_procedure>4000</Extended_customs_procedure>
      <National_customs_procedure>000</National_customs_procedure>
      <Quota_code><null/></Quota_code>
      <Quota>
        <QuotaCode><null/></QuotaCode>
        <QuotaId/>
        <QuotaItem><ItmNbr/></QuotaItem>
      </Quota>
      <Supplementary_unit>
        <Suppplementary_unit_code><null/></Suppplementary_unit_code>
        <Suppplementary_unit_name><null/></Suppplementary_unit_name>
        <Suppplementary_unit_quantity/>
      </Supplementary_unit>
      <Item_price>${n(nn(item.fob_value_usd) * rbz)}</Item_price>
      <Valuation_method_code><null/></Valuation_method_code>
      <Value_item>0.00</Value_item>
      <Attached_doc_item/>
      <A.I._code><null/></A.I._code>
    </Tarification>
    <write_off_unit>
      <write_off_unit_code><null/></write_off_unit_code>
      <write_off_unit_qty/>
    </write_off_unit>
    <Goods_description>
      <Country_of_origin_code>ZA</Country_of_origin_code>
      <Country_of_origin_region/>
      <Description_of_goods>${(item.description || "").slice(0, 70)}</Description_of_goods>
      <Commercial_Description>${(item.description || "").slice(0, 70)}</Commercial_Description>
    </Goods_description>
    <Previous_doc>
      <Summary_declaration><null/></Summary_declaration>
      <Summary_declaration_sl><null/></Summary_declaration_sl>
      <Previous_document_reference/>
      <Previous_warehouse_code><null/></Previous_warehouse_code>
    </Previous_doc>
    <Licence_number>${item.import_licence_required ? "REQD" : "OGIL"}</Licence_number>
    <Amount_deducted_from_licence/>
    <Quantity_deducted_from_licence/>
    <Free_text_1>${item.permit_notes ? item.permit_notes.slice(0, 100) : "<null/>"}</Free_text_1>
    <Free_text_2><null/></Free_text_2>
    <Taxation>
      <Item_taxes_amount>${n(totalTax)}</Item_taxes_amount>
      <Item_taxes_guaranted_amount/>
      <Item_taxes_mode_of_payment>1</Item_taxes_mode_of_payment>
      <Counter_of_normal_mode_of_payment/>
      <Displayed_item_taxes_amount/>
      <Taxation_line>
        <Duty_tax_code>101</Duty_tax_code>
        <Duty_tax_Base>${n(cifZwg)}</Duty_tax_Base>
        <Duty_tax_rate>${n(nn(item.duty_rate) * 100, 1)}</Duty_tax_rate>
        <Duty_tax_amount>${n(dutyAmt)}</Duty_tax_amount>
        <Duty_tax_MP>1</Duty_tax_MP>
        <Duty_tax_Type_of_calculation><null/></Duty_tax_Type_of_calculation>
      </Taxation_line>
      <Taxation_line>
        <Duty_tax_code>102</Duty_tax_code>
        <Duty_tax_Base>${n(vatBase)}</Duty_tax_Base>
        <Duty_tax_rate>14.5</Duty_tax_rate>
        <Duty_tax_amount>${n(vatAmt)}</Duty_tax_amount>
        <Duty_tax_MP>1</Duty_tax_MP>
        <Duty_tax_Type_of_calculation><null/></Duty_tax_Type_of_calculation>
      </Taxation_line>
    </Taxation>
    <Valuation_item>
      <Weight_itm>
        <Gross_weight_itm>1</Gross_weight_itm>
        <Net_weight_itm>1</Net_weight_itm>
      </Weight_itm>
      <Total_cost_itm>${n(nn(item.fob_value_usd) * rbz)}</Total_cost_itm>
      <Total_CIF_itm>${n(cifZwg)}</Total_CIF_itm>
      <Rate_of_adjustement>1</Rate_of_adjustement>
      <Statistical_value>${n(cifZwg)}</Statistical_value>
      <Alpha_coeficient_of_apportionment>1.0</Alpha_coeficient_of_apportionment>
      <Item_Invoice>
        <Amount_national_currency>${n(nn(item.fob_value_usd) * rbz)}</Amount_national_currency>
        <Amount_foreign_currency>${n(item.fob_value_usd)}</Amount_foreign_currency>
        <Currency_code>USD</Currency_code>
        <Currency_name>US Dollar</Currency_name>
        <Currency_rate>${n(rbz)}</Currency_rate>
      </Item_Invoice>
      <item_external_freight>
        <Amount_national_currency>0.00</Amount_national_currency>
        <Amount_foreign_currency>0.00</Amount_foreign_currency>
        <Currency_code><null/></Currency_code>
        <Currency_name>No foreign currency</Currency_name>
        <Currency_rate>0.0</Currency_rate>
      </item_external_freight>
      <item_internal_freight>
        <Amount_national_currency>${n((freightUsd * nn(item.fob_value_usd) / Math.max(totalFob, 1)) * rbz)}</Amount_national_currency>
        <Amount_foreign_currency>${n(freightUsd * nn(item.fob_value_usd) / Math.max(totalFob, 1))}</Amount_foreign_currency>
        <Currency_code>USD</Currency_code>
        <Currency_name>US Dollar</Currency_name>
        <Currency_rate>${n(rbz)}</Currency_rate>
      </item_internal_freight>
      <item_insurance>
        <Amount_national_currency>${n((insuranceUsd * nn(item.fob_value_usd) / Math.max(totalFob, 1)) * rbz)}</Amount_national_currency>
        <Amount_foreign_currency>${n(insuranceUsd * nn(item.fob_value_usd) / Math.max(totalFob, 1))}</Amount_foreign_currency>
        <Currency_code>USD</Currency_code>
        <Currency_name>US Dollar</Currency_name>
        <Currency_rate>${n(rbz)}</Currency_rate>
      </item_insurance>
      <item_other_cost>
        <Amount_national_currency>0.00</Amount_national_currency>
        <Amount_foreign_currency>0.00</Amount_foreign_currency>
        <Currency_code><null/></Currency_code>
        <Currency_name>No foreign currency</Currency_name>
        <Currency_rate>0.0</Currency_rate>
      </item_other_cost>
      <item_deduction>
        <Amount_national_currency>0.00</Amount_national_currency>
        <Amount_foreign_currency>0.00</Amount_foreign_currency>
        <Currency_code><null/></Currency_code>
        <Currency_name>No foreign currency</Currency_name>
        <Currency_rate>0</Currency_rate>
      </item_deduction>
    </Valuation_item>
  </Item>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<ASYCUDA>
  <Export_release>
    <Date_of_exit/>
    <Time_of_exit/>
    <Actual_office_of_exit_code><null/></Actual_office_of_exit_code>
    <Actual_office_of_exit_name><null/></Actual_office_of_exit_name>
    <Exit_reference><null/></Exit_reference>
    <Comments><null/></Comments>
  </Export_release>
  <Assessment_notice/>
  <Global_taxes/>
  <Property>
    <Sad_flow>I</Sad_flow>
    <Forms>
      <Number_of_the_form>1</Number_of_the_form>
      <Total_number_of_forms>1</Total_number_of_forms>
    </Forms>
    <Nbers>
      <Number_of_loading_lists/>
      <Total_number_of_items>${(boe.line_items || []).length}</Total_number_of_items>
      <Total_number_of_packages>${(boe.line_items || []).reduce((s, i) => s + (i.quantity || 0), 0)}</Total_number_of_packages>
    </Nbers>
    <Place_of_declaration><null/></Place_of_declaration>
    <Date_of_declaration>${dateStr}</Date_of_declaration>
    <Selected_page>1</Selected_page>
  </Property>
  <Identification>
    <Office_segment>
      <Customs_clearance_office_code>${officeCode}</Customs_clearance_office_code>
      <Customs_Clearance_office_name>${officeName}</Customs_Clearance_office_name>
    </Office_segment>
    <Type>
      <Type_of_declaration>IM</Type_of_declaration>
      <Declaration_gen_procedure_code>4</Declaration_gen_procedure_code>
      <Type_of_transit_document><null/></Type_of_transit_document>
    </Type>
    <Manifest_reference_number><null/></Manifest_reference_number>
    <Registration>
      <Serial_number><null/></Serial_number>
      <Number/>
      <Date/>
    </Registration>
    <Assessment>
      <Serial_number><null/></Serial_number>
      <Number/>
      <Date/>
    </Assessment>
    <receipt>
      <Serial_number><null/></Serial_number>
      <Number/>
      <Date/>
    </receipt>
  </Identification>
  <Traders>
    <Exporter>
      <Exporter_code/>
      <Exporter_name>${(boe.exporter || "").toUpperCase()}</Exporter_name>
    </Exporter>
    <Consignee>
      <Consignee_code><null/></Consignee_code>
      <Consignee_name>${(boe.importer || "").toUpperCase()}</Consignee_name>
    </Consignee>
    <Financial>
      <Financial_code/>
      <Financial_name/>
    </Financial>
  </Traders>
  <Declarant>
    <Declarant_code>${boe.importer_tin || ""}</Declarant_code>
    <Declarant_name>${(boe.importer || "").toUpperCase()}</Declarant_name>
    <Reference>
      <Number>${ref}</Number>
    </Reference>
  </Declarant>
  <General_information>
    <Country>
      <Country_first_destination>ZA</Country_first_destination>
      <Trading_country>ZA</Trading_country>
      <Export>
        <Export_country_code>ZA</Export_country_code>
        <Export_country_name>${boe.country_of_origin || "South Africa"}</Export_country_name>
        <Export_country_region/>
      </Export>
      <Destination>
        <Destination_country_code>ZW</Destination_country_code>
        <Destination_country_name>Zimbabwe</Destination_country_name>
        <Destination_country_region/>
      </Destination>
      <Country_of_origin_name>${boe.country_of_origin || "South Africa"}</Country_of_origin_name>
    </Country>
    <Value_details>${n(totalFob * rbz)}</Value_details>
    <CAP><null/></CAP>
    <Additional_information><null/></Additional_information>
    <Comments_free_text>${boe.boe_notes ? boe.boe_notes.slice(0, 200) : "<null/>"}</Comments_free_text>
  </General_information>
  <Transport>
    <Means_of_transport>
      <Departure_arrival_information>
        <Identity>ADD</Identity>
        <Nationality>ZA</Nationality>
      </Departure_arrival_information>
      <Border_information>
        <Identity>ADD</Identity>
        <Nationality>ZA</Nationality>
        <Mode>${modeCode}</Mode>
      </Border_information>
      <Inland_mode_of_transport><null/></Inland_mode_of_transport>
    </Means_of_transport>
    <Container_flag>false</Container_flag>
    <Delivery_terms>
      <Code>CIF</Code>
      <Place>${(boe.port_of_entry || "BEITBRIDGE").toUpperCase()}</Place>
      <Situation/>
    </Delivery_terms>
    <Border_office>
      <Code>${officeCode}</Code>
      <Name>${officeName}</Name>
    </Border_office>
    <Place_of_loading>
      <Code><null/></Code>
      <Name><null/></Name>
      <Country/>
    </Place_of_loading>
    <Location_of_goods>LOC07</Location_of_goods>
  </Transport>
  <Financial>
    <Financial_transaction>
      <code1><null/></code1>
      <code2><null/></code2>
    </Financial_transaction>
    <Bank>
      <Code><null/></Code>
      <Name><null/></Name>
      <Branch/>
      <Reference/>
    </Bank>
    <Terms>
      <Code><null/></Code>
      <Description><null/></Description>
    </Terms>
    <Total_invoice/>
    <Deffered_payment_reference/>
    <Mode_of_payment>ACCOUNT PAYMENT</Mode_of_payment>
    <Amounts>
      <Total_manual_taxes/>
      <Global_taxes>${n((boe.totals?.total_customs_duty_usd || 0) * rbz)}</Global_taxes>
      <Totals_taxes>${n((boe.totals?.total_duty_payable_usd || 0) * rbz)}</Totals_taxes>
    </Amounts>
    <Guarantee>
      <Name><null/></Name>
      <Amount>0.0</Amount>
      <Date/>
      <Excluded_country>
        <Code><null/></Code>
        <Name><null/></Name>
      </Excluded_country>
    </Guarantee>
  </Financial>
  <Warehouse>
    <Identification/>
    <Delay/>
  </Warehouse>
  <Transit>
    <Destination>
      <Office><null/></Office>
      <Country><null/></Country>
    </Destination>
    <Seals>
      <Number/>
      <Identity><null/></Identity>
    </Seals>
    <Result_of_control/>
    <Time_limit/>
    <Officer_name><null/></Officer_name>
  </Transit>
  <Valuation>
    <Calculation_working_mode>0</Calculation_working_mode>
    <Weight>
      <Gross_weight/>
    </Weight>
    <Total_cost>${n(totalFob * rbz)}</Total_cost>
    <Total_CIF>${n(totalCif * rbz)}</Total_CIF>
    <Gs_Invoice>
      <Amount_national_currency>${n(totalFob * rbz)}</Amount_national_currency>
      <Amount_foreign_currency>${n(totalFob)}</Amount_foreign_currency>
      <Currency_code>USD</Currency_code>
      <Currency_name>US Dollar</Currency_name>
      <Currency_rate>${n(rbz)}</Currency_rate>
    </Gs_Invoice>
    <Gs_external_freight>
      <Amount_national_currency>0.00</Amount_national_currency>
      <Amount_foreign_currency>0</Amount_foreign_currency>
      <Currency_code><null/></Currency_code>
      <Currency_name>No foreign currency</Currency_name>
      <Currency_rate>0.0</Currency_rate>
    </Gs_external_freight>
    <Gs_internal_freight>
      <Amount_national_currency>${n(freightUsd * rbz)}</Amount_national_currency>
      <Amount_foreign_currency>${n(freightUsd)}</Amount_foreign_currency>
      <Currency_code>USD</Currency_code>
      <Currency_name>US Dollar</Currency_name>
      <Currency_rate>${n(rbz)}</Currency_rate>
    </Gs_internal_freight>
    <Gs_insurance>
      <Amount_national_currency>${n(insuranceUsd * rbz)}</Amount_national_currency>
      <Amount_foreign_currency>${n(insuranceUsd)}</Amount_foreign_currency>
      <Currency_code>USD</Currency_code>
      <Currency_name>US Dollar</Currency_name>
      <Currency_rate>${n(rbz)}</Currency_rate>
    </Gs_insurance>
    <Gs_other_cost>
      <Amount_national_currency>0.00</Amount_national_currency>
      <Amount_foreign_currency>0</Amount_foreign_currency>
      <Currency_code><null/></Currency_code>
      <Currency_name>No foreign currency</Currency_name>
      <Currency_rate>0.0</Currency_rate>
    </Gs_other_cost>
    <Gs_deduction>
      <Amount_national_currency>0.00</Amount_national_currency>
      <Amount_foreign_currency>0</Amount_foreign_currency>
      <Currency_code><null/></Currency_code>
      <Currency_name>No foreign currency</Currency_name>
      <Currency_rate>0</Currency_rate>
    </Gs_deduction>
    <Total>
      <Total_invoice>${n(totalFob)}</Total_invoice>
      <Total_weight>0.0</Total_weight>
    </Total>
  </Valuation>
${itemsXml}
</ASYCUDA>`;
}

function downloadXml(boe, rbzRate) {
  const xml = generateASYCUDAXml(boe, rbzRate);
  const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Lunarae_ASYCUDA_${Date.now().toString().slice(-8)}.xml`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── PDF Generator ─────────────────────────────────────────────────────────
async function generateBOEPdf(boe, rbzRate) {
  if (!window.jspdf) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210, H = 297;
  const now = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  const ref = `LUN-${Date.now().toString().slice(-8)}`;
  const rbz = parseFloat(rbzRate) || 13.5;

  const navy = [10, 14, 23]; const gold = [234, 179, 8];
  const slate = [100, 116, 139]; const cream = [248, 250, 252];
  const red = [220, 38, 38]; const amber = [180, 83, 9];
  const green = [21, 128, 61]; const black = [15, 23, 42]; const white = [255, 255, 255];

  doc.setFillColor(...navy); doc.rect(0, 0, W, 28, "F");
  doc.setFillColor(...gold); doc.rect(0, 0, 4, 28, "F");
  doc.setTextColor(...gold); doc.setFont("helvetica", "bold"); doc.setFontSize(16);
  doc.text("LUNARAE", 9, 12);
  doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(...slate);
  doc.text("ZIMRA AUTOMATED CUSTOMS INTELLIGENCE", 9, 18);
  doc.setTextColor(...white); doc.setFont("helvetica", "bold"); doc.setFontSize(9);
  doc.text("BILL OF ENTRY — CF21", W - 8, 12, { align: "right" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(...slate);
  doc.text(`Ref: ${ref}  ·  ${now}`, W - 8, 18, { align: "right" });
  doc.setFillColor(...gold); doc.roundedRect(W - 52, 20, 44, 6, 1.5, 1.5, "F");
  doc.setTextColor(...navy); doc.setFont("helvetica", "bold"); doc.setFontSize(6.5);
  doc.text((boe.entry_type || "HOME CONSUMPTION").toUpperCase(), W - 30, 24, { align: "center" });

  let y = 32;
  const sectionHeader = (title) => {
    doc.setFillColor(...navy); doc.rect(0, y, W, 7, "F");
    doc.setTextColor(...gold); doc.setFont("helvetica", "bold"); doc.setFontSize(7);
    doc.text(title, 6, y + 4.8); y += 9;
  };

  sectionHeader("ENTRY PARTICULARS");
  const left = [["Importer", boe.importer], ["Importer TIN", boe.importer_tin], ["Entry Type", boe.entry_type], ["Mode", boe.mode_of_transport]];
  const right = [["Exporter", boe.exporter], ["Country of Origin", boe.country_of_origin], ["Port of Entry", boe.port_of_entry], ["RBZ Rate", `${rbzRate} ZWG/USD`]];
  left.forEach(([k, v], i) => {
    const ry = y + i * 7;
    doc.setFillColor(...(i % 2 === 0 ? cream : white)); doc.rect(6, ry, 95, 7, "F"); doc.rect(107, ry, 97, 7, "F");
    doc.setTextColor(...slate); doc.setFont("helvetica", "normal"); doc.setFontSize(6);
    doc.text(k.toUpperCase(), 8, ry + 2.5); doc.text((right[i][0] || "").toUpperCase(), 109, ry + 2.5);
    doc.setTextColor(...black); doc.setFont("helvetica", "bold"); doc.setFontSize(7.5);
    doc.text(String(v || "—").slice(0, 45), 8, ry + 5.5); doc.text(String(right[i][1] || "—").slice(0, 45), 109, ry + 5.5);
  });
  y += left.length * 7 + 6;

  sectionHeader("LINE ITEMS");
  const cols = [8, 52, 20, 22, 22, 14, 24, 22, 20];
  const hdrs = ["#", "Description", "HS Code", "Qty / Unit", "CIF (USD)", "Duty%", "Duty (USD)", "VAT (USD)", "Total"];
  doc.setFillColor(15, 23, 42); doc.rect(6, y, cols.reduce((a, b) => a + b), 6, "F");
  doc.setTextColor(...gold); doc.setFont("helvetica", "bold"); doc.setFontSize(6.5);
  let cx = 6;
  hdrs.forEach((h, i) => { doc.text(h, cx + 2, y + 4); cx += cols[i]; });
  y += 6;

  (boe.line_items || []).forEach((item, idx) => {
    const rw = cols.reduce((a, b) => a + b);
    doc.setFillColor(...(idx % 2 === 0 ? cream : white)); doc.rect(6, y, rw, 8, "F");
    const cells = [String(item.line_no), String(item.description || "").slice(0, 60), String(item.hs_code || ""),
      `${item.quantity} ${item.unit}`, `$${Number(item.cif_value_usd || 0).toFixed(2)}`,
      `${(Number(item.duty_rate || 0) * 100).toFixed(0)}%`, `$${Number(item.customs_duty_usd || 0).toFixed(2)}`,
      `$${Number(item.vat_usd || 0).toFixed(2)}`, `$${Number(item.total_duty_usd || 0).toFixed(2)}`];
    cx = 6; doc.setTextColor(...black); doc.setFont("helvetica", "normal"); doc.setFontSize(6.5);
    cells.forEach((cell, ci) => {
      const xp = [4, 5, 6, 7, 8].includes(ci) ? cx + cols[ci] - 2 : cx + 2;
      doc.text(cell, xp, y + 5.2, { align: [4, 5, 6, 7, 8].includes(ci) ? "right" : "left" });
      cx += cols[ci];
    });
    if (item.permit_notes) {
      y += 8; const rw2 = cols.reduce((a, b) => a + b);
      doc.setFillColor(255, 243, 205); doc.rect(6 + cols[0], y, rw2 - cols[0], 5, "F");
      doc.setTextColor(...amber); doc.setFont("helvetica", "italic"); doc.setFontSize(6);
      doc.text(`  ⚠ ${String(item.permit_notes).slice(0, 110)}`, 6 + cols[0] + 2, y + 3.5);
    }
    y += 8;
  });
  y += 4;

  const t = boe.totals || {};
  const rows = [["Total FOB", `USD ${Number(t.total_fob_usd || 0).toFixed(2)}`], ["Total CIF", `USD ${Number(t.total_cif_usd || 0).toFixed(2)}`],
    ["Customs Duty", `USD ${Number(t.total_customs_duty_usd || 0).toFixed(2)}`], ["VAT 14.5%", `USD ${Number(t.total_vat_usd || 0).toFixed(2)}`],
    ["TOTAL PAYABLE (USD)", `USD ${Number(t.total_duty_payable_usd || 0).toFixed(2)}`],
    ["TOTAL PAYABLE (ZWG)", `ZWG ${Number((t.total_duty_payable_zwg || t.total_duty_payable_usd * rbz) || 0).toFixed(2)}`]];
  const bx = W - 6 - 90;
  rows.forEach(([l, v], i) => {
    const isT = l.startsWith("TOTAL");
    doc.setFillColor(...(isT ? navy : i % 2 === 0 ? cream : white)); doc.rect(bx, y + i * 7, 90, 7, "F");
    doc.setFont("helvetica", isT ? "bold" : "normal"); doc.setFontSize(isT ? 7.5 : 7);
    doc.setTextColor(...(isT ? gold : slate)); doc.text(l, bx + 3, y + i * 7 + 4.5);
    doc.setTextColor(...(isT ? gold : black)); doc.setFont("helvetica", "bold");
    doc.text(v, bx + 87, y + i * 7 + 4.5, { align: "right" });
  });
  y += rows.length * 7 + 8;

  const alerts = boe.compliance_alerts || [];
  if (alerts.length) {
    sectionHeader("COMPLIANCE ALERTS");
    alerts.forEach(a => {
      const sc = a.severity === "HIGH" ? red : a.severity === "MEDIUM" ? amber : green;
      const bg = a.severity === "HIGH" ? [253, 236, 234] : a.severity === "MEDIUM" ? [255, 243, 205] : [212, 237, 218];
      doc.setFillColor(...bg); doc.roundedRect(6, y, W - 12, 14, 1.5, 1.5, "F");
      doc.setFillColor(...sc); doc.rect(6, y, 2.5, 14, "F");
      doc.setTextColor(...sc); doc.setFont("helvetica", "bold"); doc.setFontSize(7);
      doc.text(`[${a.severity}] ${String(a.item || "").slice(0, 80)}`, 11, y + 4);
      doc.setTextColor(...black); doc.setFont("helvetica", "normal"); doc.setFontSize(6.5);
      doc.text(String(a.alert || "").slice(0, 110), 11, y + 8);
      doc.setFont("helvetica", "bold"); doc.setTextColor(...sc);
      doc.text(`ACTION: ${String(a.action_required || "").slice(0, 105)}`, 11, y + 12);
      y += 17;
    });
  }

  y = Math.max(y, H - 55);
  doc.setFillColor(...cream); doc.rect(6, y, W - 12, 28, "F");
  doc.setTextColor(...navy); doc.setFont("helvetica", "bold"); doc.setFontSize(7);
  doc.text("DECLARATION", 9, y + 5);
  doc.setFont("helvetica", "normal"); doc.setFontSize(6);
  const decl = "I/We declare this Bill of Entry is true and correct per Customs & Excise Act [Chapter 23:02]. All licences and permits required have been obtained.";
  doc.text(doc.splitTextToSize(decl, W - 24), 9, y + 9);
  const sigW = (W - 12) / 4;
  ["Clearing Agent Sig.", "Agent Licence No.", "Date Lodged", "ZIMRA Stamp"].forEach((l, i) => {
    const sx = 6 + i * sigW;
    doc.setDrawColor(180, 180, 180); doc.line(sx + 3, y + 21, sx + sigW - 3, y + 21);
    doc.setTextColor(...slate); doc.setFontSize(5.5); doc.text(l, sx + sigW / 2, y + 25, { align: "center" });
  });

  doc.setFillColor(...navy); doc.rect(0, H - 8, W, 8, "F");
  doc.setTextColor(...slate); doc.setFont("helvetica", "normal"); doc.setFontSize(5.5);
  doc.text(`Generated by Lunarae AI  ·  ${now}  ·  Ref: ${ref}  ·  ZIMRA CF21`, 6, H - 3);
  doc.setTextColor(...gold); doc.text("lunarae.ai — Powered by Anthropic Claude", W - 6, H - 3, { align: "right" });

  doc.save(`Lunarae_BOE_${ref}.pdf`);
}

// ── Sample invoice ────────────────────────────────────────────────────────
const SAMPLE_INVOICE = `COMMERCIAL INVOICE
Invoice No: INV-2024-0892   Date: 15 May 2024
Exporter: Goldfields Trading Ltd, 14 Commissioner St, Johannesburg, South Africa
Importer: Zimbabwe General Stores (Pvt) Ltd, 32 Samora Machel Ave, Harare, Zimbabwe
Importer TIN: 2000123456

LINE ITEMS:
1. Ibuprofen 200mg Tablets x 5,000 boxes @ USD 2.50 each = USD 12,500.00
2. Portland Cement (OPC 42.5N) x 200 bags x 50kg @ USD 8.00/bag = USD 1,600.00
3. Refined Sunflower Cooking Oil 5L bottles x 500 units @ USD 4.50 = USD 2,250.00
4. Men's Cotton T-Shirts (assorted sizes, 100% cotton) x 300 pieces @ USD 3.00 = USD 900.00
5. Toyota Land Cruiser 2022 (4x4, petrol, 4000cc) x 1 unit @ USD 45,000.00

Total FOB Value: USD 62,250.00
Freight (road, TIR): USD 1,800.00
Insurance: USD 250.00
Total CIF Value: USD 64,300.00

Country of Origin: South Africa
Port of Entry Zimbabwe: Beitbridge Border Post
Mode of Transport: Road (TIR Carnet No: ZA-2024-88234)
Payment Terms: T/T in advance`;

const SYSTEM = `You are Lunarae, the premier Zimbabwe customs AI. Expert in ZIMRA Customs and Excise Act [Chapter 23:02], Zimbabwe Tariff Book (8-digit HS codes), SI 122/2017, SI 35/2024 CBCA.

DUTY FORMULA: Customs Duty = CIF Value × Duty Rate. VAT Base = CIF + Duty. VAT = VAT Base × 14.5%.
CIF = FOB + Freight + Insurance (allocate proportionally across line items by FOB value).

SI 122/2017: HS 3004 pharma=MCAZ licence; HS 2523 cement=import licence; HS 6309 second-hand undergarments=PROHIBITED; HS 8507 batteries=licence; HS 2710 petroleum=licence.
SI 35/2024 CBCA: All vehicles HS 8701-8716 ALWAYS require CoC. Goods in Fourth Schedule require CBCA if FOB > USD 1,000.

Respond ONLY with valid JSON. No markdown. Structure:
{
  "entry_type": string,
  "importer": string,
  "importer_tin": string,
  "exporter": string,
  "country_of_origin": string,
  "port_of_entry": string,
  "mode_of_transport": string,
  "transport_reference": string,
  "rbz_rate": number,
  "freight_usd": number,
  "insurance_usd": number,
  "line_items": [{
    "line_no": number, "description": string, "hs_code": string,
    "quantity": number, "unit": string, "unit_value_usd": number,
    "fob_value_usd": number, "cif_value_usd": number,
    "duty_rate": number, "duty_type": string,
    "customs_duty_usd": number, "vat_base_usd": number,
    "vat_usd": number, "total_duty_usd": number,
    "import_licence_required": boolean, "export_licence_required": boolean,
    "cbca_always": boolean, "cbca_if_above_threshold": boolean,
    "permit_notes": string, "authority": string, "si_reference": string,
    "compliance_status": "CLEAR"|"LICENCE_REQUIRED"|"CBCA_REQUIRED"|"PROHIBITED"|"FLAGGED"
  }],
  "totals": {
    "total_fob_usd": number, "total_cif_usd": number,
    "total_customs_duty_usd": number, "total_vat_usd": number,
    "total_duty_payable_usd": number, "total_duty_payable_zwg": number
  },
  "compliance_alerts": [{
    "severity": "HIGH"|"MEDIUM"|"INFO",
    "item": string, "alert": string, "action_required": string
  }],
  "boe_notes": string,
  "ready_to_register": boolean
}`;

const stages = [
  "Reading shipping documents…",
  "Classifying HS codes…",
  "Calculating duties & VAT…",
  "Checking SI 122/2017 licences…",
  "Verifying SI 35/2024 CBCA…",
  "Framing ZIMRA CF21…",
  "Generating compliance advisory…",
];

const PORTS = ["Beitbridge", "Forbes (Mutare)", "Chirundu", "Plumtree", "Victoria Falls", "Harare Airport", "Bulawayo Airport", "Joshua Nkomo Airport"];

// ── Status helpers ────────────────────────────────────────────────────────
const STATUS_MAP = {
  CLEAR:            { bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
  CBCA_REQUIRED:    { bg: "#fef9c3", color: "#a16207", dot: "#eab308" },
  LICENCE_REQUIRED: { bg: "#fff7ed", color: "#c2410c", dot: "#f97316" },
  PROHIBITED:       { bg: "#fee2e2", color: "#b91c1c", dot: "#ef4444" },
  FLAGGED:          { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
};
const ALERT_MAP = {
  HIGH:   { bg: "#fee2e2", border: "#fca5a5", color: "#991b1b", icon: "⛔" },
  MEDIUM: { bg: "#fff7ed", border: "#fed7aa", color: "#9a3412", icon: "⚠️" },
  INFO:   { bg: "#eff6ff", border: "#bfdbfe", color: "#1e40af", icon: "ℹ️" },
};

const fmtUSD = v => v != null ? `$${Number(v).toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";
const fmtPct = v => v != null ? `${(Number(v) * 100).toFixed(1)}%` : "—";

// ── Main Component ────────────────────────────────────────────────────────
export default function LunaraeV2() {
  const [view, setView]           = useState("input");  // input | results
  const [docText, setDocText]     = useState("");
  const [fileName, setFileName]   = useState("");
  const [entryType, setEntryType] = useState("Home Consumption");
  const [transport, setTransport] = useState("Road");
  const [rbzRate, setRbzRate]     = useState("13.50");
  const [portEntry, setPortEntry] = useState("Beitbridge");
  const [loading, setLoading]     = useState(false);
  const [stageIdx, setStageIdx]   = useState(0);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [xmlLoading, setXmlLoading] = useState(false);
  const [dragging, setDragging]   = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const fileRef = useRef();
  const timerRef = useRef();

  useEffect(() => {
    if (loading) {
      setStageIdx(0);
      timerRef.current = setInterval(() => setStageIdx(i => Math.min(i + 1, stages.length - 1)), 900);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [loading]);

  const handleFile = useCallback(async (f) => {
    if (!f) return;
    setFileName(f.name);
    if (f.type === "application/pdf") {
      setDocText(`[PDF: ${f.name}] — PDF upload noted. Please also paste invoice text for AI processing.`);
    } else {
      const text = await f.text();
      setDocText(text);
    }
  }, []);

  const onFileChange = e => handleFile(e.target.files[0]);
  const onDrop = e => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const run = useCallback(async () => {
    if (!docText.trim()) return;
    setLoading(true); setResult(null); setError(null); setView("results");
    try {
      const res = await fetch("http://localhost:4000/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: SYSTEM,
          messages: [{
            role: "user",
            content: `Process this shipping document. Entry Type: ${entryType}. Transport: ${transport}. Port: ${portEntry}. RBZ Rate: ${rbzRate} ZWG/USD.\n\nDOCUMENT:\n${docText}`
          }]
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "API error");
      const raw = (data.content?.[0]?.text || "").replace(/```json|```/g, "").trim();
      const start = raw.indexOf("{"), end = raw.lastIndexOf("}");
      if (start === -1) throw new Error("No JSON in AI response");
      setResult(JSON.parse(raw.slice(start, end + 1)));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [docText, entryType, transport, portEntry, rbzRate]);

  const handlePDF = async () => {
    if (!result) return;
    setPdfLoading(true);
    try { await generateBOEPdf(result, rbzRate); }
    catch (e) { console.error(e); }
    finally { setPdfLoading(false); }
  };

  const handleXML = async () => {
    if (!result) return;
    setXmlLoading(true);
    try { downloadXml(result, rbzRate); }
    catch (e) { console.error(e); }
    finally { setXmlLoading(false); }
  };

  const readyColor = result?.ready_to_register ? "#22c55e" : "#f59e0b";

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#080d18", minHeight: "100vh", color: "#e2e8f0", display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #0f1729; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #eab308; }
        .luna-select, .luna-input { background: #0f1729; border: 1px solid #1e2d47; border-radius: 8px; color: #e2e8f0; font-family: inherit; font-size: 13px; padding: 9px 12px; outline: none; width: 100%; transition: border-color 0.15s; }
        .luna-select:focus, .luna-input:focus { border-color: #eab308; }
        .luna-btn { border: none; border-radius: 10px; padding: 11px 18px; font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; display: inline-flex; align-items: center; gap: 7px; }
        .luna-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .luna-btn:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.1); }
        .luna-btn-primary { background: linear-gradient(135deg, #eab308, #ca8a04); color: #0a0f1e; }
        .luna-btn-ghost { background: #0f1729; border: 1px solid #1e2d47; color: #94a3b8; }
        .luna-btn-ghost:hover:not(:disabled) { border-color: #eab308; color: #eab308; transform: none; filter: none; }
        .luna-btn-success { background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; }
        .luna-btn-xml { background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; }
        .luna-card { background: #0d1525; border: 1px solid #1e2d47; border-radius: 14px; padding: 20px; }
        .luna-card-sm { background: #0d1525; border: 1px solid #1e2d47; border-radius: 10px; padding: 14px 16px; }
        .stat-card { background: #0d1525; border: 1px solid #1e2d47; border-radius: 12px; padding: 16px; text-align: center; }
        .tab-btn { background: transparent; border: 1px solid #1e2d47; border-radius: 8px; color: #64748b; font-family: inherit; font-size: 12px; font-weight: 500; padding: 7px 14px; cursor: pointer; transition: all 0.15s; letter-spacing: 0.01em; }
        .tab-btn.active { background: #0d1525; border-color: #eab308; color: #eab308; }
        .tab-btn:hover:not(.active) { border-color: #334155; color: #94a3b8; }
        .pulse { animation: pulse 2s cubic-bezier(0.4,0,0.6,1) infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .spin { animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .fade-up { animation: fadeUp 0.35s ease forwards; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .glow-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        .grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
        .textarea-doc { background: #06090f; border: 1px solid #1e2d47; border-radius: 10px; color: #cbd5e1; font-family: 'JetBrains Mono', monospace; font-size: 11.5px; padding: 12px 14px; resize: vertical; outline: none; width: 100%; min-height: 140px; line-height: 1.7; transition: border-color 0.15s; }
        .textarea-doc:focus { border-color: #eab308; }
        .dropzone { border: 1.5px dashed #1e2d47; border-radius: 12px; padding: 24px 16px; text-align: center; cursor: pointer; transition: all 0.2s; }
        .dropzone:hover, .dropzone.dragging { border-color: #eab308; background: rgba(234,179,8,0.04); }
        tr.item-row:hover { background: rgba(234,179,8,0.04) !important; }
        .mobile-sidebar { display: none; }
        .hz-rule { border: none; border-top: 1px solid #1e2d47; margin: 8px 0; }
        @media (max-width: 768px) {
          .main-layout { grid-template-columns: 1fr !important; }
          .sidebar-desktop { display: none; }
          .mobile-sidebar { display: block; }
          .grid-4 { grid-template-columns: 1fr 1fr; }
          .grid-3 { grid-template-columns: 1fr 1fr; }
          .hide-mobile { display: none !important; }
          .results-table { font-size: 10.5px !important; }
          .panel-padding { padding: 14px !important; }
        }
        @media (max-width: 480px) {
          .grid-2 { grid-template-columns: 1fr; }
          .grid-3 { grid-template-columns: 1fr; }
          .grid-4 { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      {/* ── Top Nav ─────────────────────────────────────────────────── */}
      <nav style={{ background: "#0a0f1e", borderBottom: "1px solid #1e2d47", padding: "0 20px", height: 54, display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#eab308,#ca8a04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#0a0f1e" }}>L</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#eab308", letterSpacing: "0.04em", lineHeight: 1 }}>Lunarae</div>
            <div style={{ fontSize: 9, color: "#475569", letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: 1.2 }}>BOE Intelligence</div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {result && (
            <>
              <button className="luna-btn luna-btn-xml hide-mobile" onClick={handleXML} disabled={xmlLoading} style={{ fontSize: 11, padding: "7px 13px" }}>
                {xmlLoading ? <span className="spin" style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", display: "inline-block" }} /> : "↓"}
                ASYCUDA XML
              </button>
              <button className="luna-btn luna-btn-success hide-mobile" onClick={handlePDF} disabled={pdfLoading} style={{ fontSize: 11, padding: "7px 13px" }}>
                {pdfLoading ? "..." : "↓"} PDF
              </button>
            </>
          )}
          <div style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.25)", borderRadius: 20, padding: "4px 12px", fontSize: 10, color: "#eab308", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
            SI 122 · SI 35/2024
          </div>
          {/* Mobile menu toggle */}
          <button className="luna-btn luna-btn-ghost mobile-sidebar" onClick={() => setMobileMenuOpen(o => !o)} style={{ padding: "7px 10px", fontSize: 14 }}>☰</button>
        </div>
      </nav>

      {/* ── Mobile Sidebar Drawer ──────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="mobile-sidebar fade-up" style={{ background: "#0a0f1e", borderBottom: "1px solid #1e2d47", padding: "16px 20px" }}>
          <SidebarContent
            entryType={entryType} setEntryType={setEntryType}
            transport={transport} setTransport={setTransport}
            portEntry={portEntry} setPortEntry={setPortEntry}
            rbzRate={rbzRate} setRbzRate={setRbzRate}
            docText={docText} setDocText={setDocText}
            fileName={fileName} setFileName={setFileName}
            fileRef={fileRef} onFileChange={onFileChange}
            onDrop={onDrop} dragging={dragging} setDragging={setDragging}
            loading={loading} run={run} result={result}
            onClose={() => setMobileMenuOpen(false)}
          />
        </div>
      )}

      {/* ── Main layout ───────────────────────────────────────────── */}
      <div className="main-layout" style={{ display: "grid", gridTemplateColumns: "300px 1fr", flex: 1, minHeight: 0 }}>

        {/* Sidebar (desktop) */}
        <aside className="sidebar-desktop" style={{ background: "#0a0f1e", borderRight: "1px solid #1e2d47", padding: "20px 16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 18 }}>
          <SidebarContent
            entryType={entryType} setEntryType={setEntryType}
            transport={transport} setTransport={setTransport}
            portEntry={portEntry} setPortEntry={setPortEntry}
            rbzRate={rbzRate} setRbzRate={setRbzRate}
            docText={docText} setDocText={setDocText}
            fileName={fileName} setFileName={setFileName}
            fileRef={fileRef} onFileChange={onFileChange}
            onDrop={onDrop} dragging={dragging} setDragging={setDragging}
            loading={loading} run={run} result={result}
          />
        </aside>

        {/* Right panel */}
        <main className="panel-padding" style={{ padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* View tabs */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button className={`tab-btn ${view === "input" ? "active" : ""}`} onClick={() => setView("input")}>Input</button>
            <button className={`tab-btn ${view === "results" ? "active" : ""}`} onClick={() => setView("results")} disabled={!result && !loading}>
              {loading ? "Processing…" : result ? `BOE Results (${result.line_items?.length || 0} items)` : "BOE Results"}
            </button>
            {result && (
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                <span className="glow-dot" style={{ background: readyColor, boxShadow: `0 0 6px ${readyColor}` }} />
                <span style={{ color: readyColor }}>{result.ready_to_register ? "Ready to register" : "Action required"}</span>
              </div>
            )}
          </div>

          {/* Input welcome */}
          {view === "input" && !loading && (
            <div className="fade-up" style={{ textAlign: "center", padding: "48px 20px" }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg,#eab308,#ca8a04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 20px", boxShadow: "0 0 32px rgba(234,179,8,0.25)" }}>⚖</div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f8fafc", marginBottom: 8 }}>Lunarae BOE Intelligence</h1>
              <p style={{ fontSize: 14, color: "#64748b", maxWidth: 460, margin: "0 auto 28px", lineHeight: 1.8 }}>
                Upload or paste your shipping documents. Lunarae auto-classifies goods, calculates duties, checks SI compliance, and generates a ZIMRA-ready Bill of Entry with ASYCUDA XML export.
              </p>
              <div className="grid-3" style={{ maxWidth: 520, margin: "0 auto" }}>
                {[
                  ["📦", "HS Classification", "AI maps descriptions to 8-digit HS codes"],
                  ["💰", "Duty Calculation", "CIF × rate + 14.5% VAT per line item"],
                  ["📋", "SI Compliance", "SI 122/2017 & SI 35/2024 CBCA checks"],
                ].map(([icon, title, desc]) => (
                  <div key={title} className="luna-card-sm" style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", marginBottom: 4 }}>{title}</div>
                    <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.5 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px" }}>
              <div style={{ position: "relative", width: 56, height: 56, marginBottom: 24 }}>
                <div className="spin" style={{ position: "absolute", inset: 0, border: "3px solid #1e2d47", borderTop: "3px solid #eab308", borderRadius: "50%" }} />
                <div style={{ position: "absolute", inset: 8, borderRadius: "50%", background: "linear-gradient(135deg,#eab308,#ca8a04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚖</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#f8fafc", marginBottom: 6 }}>Processing your documents</div>
              <div className="pulse" style={{ fontSize: 12, color: "#64748b", marginBottom: 24 }}>{stages[stageIdx]}</div>
              <div style={{ display: "flex", gap: 5 }}>
                {stages.map((_, i) => (
                  <div key={i} style={{ width: i <= stageIdx ? 20 : 6, height: 6, borderRadius: 3, background: i <= stageIdx ? "#eab308" : "#1e2d47", transition: "all 0.3s" }} />
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ background: "#1a0808", border: "1px solid #7f1d1d", borderRadius: 12, padding: "14px 18px", color: "#fca5a5", fontSize: 13 }}>
              ⚠ {error}
            </div>
          )}

          {/* Results */}
          {result && view === "results" && !loading && (
            <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Entry summary */}
              <div className="luna-card">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#eab308" }}>Bill of Entry — {result.entry_type}</div>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    <button className="luna-btn luna-btn-xml" onClick={handleXML} disabled={xmlLoading} style={{ fontSize: 11, padding: "6px 12px" }}>
                      {xmlLoading ? "…" : "↓"} ASYCUDA XML
                    </button>
                    <button className="luna-btn luna-btn-success" onClick={handlePDF} disabled={pdfLoading} style={{ fontSize: 11, padding: "6px 12px" }}>
                      {pdfLoading ? "…" : "↓"} PDF
                    </button>
                  </div>
                </div>
                <div className="grid-4">
                  {[["Importer", result.importer], ["Exporter", result.exporter], ["Origin", result.country_of_origin], ["Port", result.port_of_entry]].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>{k}</div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "#e2e8f0" }}>{v || "—"}</div>
                    </div>
                  ))}
                </div>
                {result.importer_tin && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #1e2d47", fontSize: 11, color: "#64748b" }}>
                    TIN: <span style={{ color: "#94a3b8", fontFamily: "monospace" }}>{result.importer_tin}</span>
                    {result.transport_reference && <> · Transport Ref: <span style={{ color: "#94a3b8", fontFamily: "monospace" }}>{result.transport_reference}</span></>}
                  </div>
                )}
              </div>

              {/* Compliance alerts */}
              {result.compliance_alerts?.length > 0 && (
                <div className="luna-card">
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#f8fafc", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    🚨 Compliance Alerts
                    <span style={{ background: "#7f1d1d", color: "#fca5a5", fontSize: 11, borderRadius: 20, padding: "1px 8px", fontWeight: 600 }}>{result.compliance_alerts.length}</span>
                  </div>
                  {result.compliance_alerts.map((a, i) => {
                    const ac = ALERT_MAP[a.severity] || ALERT_MAP.INFO;
                    return (
                      <div key={i} style={{ background: ac.bg, border: `1px solid ${ac.border}`, borderLeft: `4px solid ${ac.color}`, borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <span style={{ fontSize: 14 }}>{ac.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 12, color: ac.color, marginBottom: 3 }}>{a.item}</div>
                            <div style={{ fontSize: 11.5, color: "#374151", marginBottom: 5 }}>{a.alert}</div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: ac.color }}>→ {a.action_required}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Duty summary */}
              {result.totals && (
                <div className="luna-card">
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#f8fafc", marginBottom: 14 }}>💰 Duty Summary</div>
                  <div className="grid-3">
                    {[
                      ["Total CIF", fmtUSD(result.totals.total_cif_usd)],
                      ["Customs Duty", fmtUSD(result.totals.total_customs_duty_usd)],
                      ["VAT 14.5%", fmtUSD(result.totals.total_vat_usd)],
                    ].map(([l, v]) => (
                      <div key={l} className="stat-card">
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#eab308", marginBottom: 4 }}>{v}</div>
                        <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em" }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, padding: "14px 16px", background: "#080d18", borderRadius: 10, border: "1px solid #1e2d47", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#475569", marginBottom: 3 }}>Total Duty Payable</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: "#eab308" }}>{fmtUSD(result.totals.total_duty_payable_usd)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "#475569", marginBottom: 3 }}>ZWG Equivalent @ {rbzRate}</div>
                      <div style={{ fontSize: 18, fontWeight: 600, color: "#94a3b8" }}>
                        ZWG {Number(result.totals.total_duty_payable_zwg || result.totals.total_duty_payable_usd * parseFloat(rbzRate)).toLocaleString("en", { maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Line items */}
              {result.line_items?.length > 0 && (
                <div className="luna-card" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #1e2d47", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#f8fafc" }}>📦 Line Items</span>
                    <span style={{ background: "#0f1729", color: "#64748b", border: "1px solid #1e2d47", borderRadius: 20, padding: "1px 8px", fontSize: 11 }}>{result.line_items.length}</span>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table className="results-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
                      <thead>
                        <tr style={{ background: "#080d18" }}>
                          {["#", "Description", "HS Code", "Qty", "CIF", "Duty %", "Duty", "VAT", "Total", "Status"].map(h => (
                            <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "#475569", fontSize: 9.5, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", borderBottom: "1px solid #1e2d47", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.line_items.map((item, i) => {
                          const st = STATUS_MAP[item.compliance_status] || STATUS_MAP.CLEAR;
                          return (
                            <tr key={i} className="item-row" style={{ background: i % 2 === 0 ? "rgba(13,21,37,0.8)" : "transparent", borderBottom: "1px solid #0f1729" }}>
                              <td style={{ padding: "10px 12px", color: "#64748b", fontFamily: "monospace" }}>{item.line_no}</td>
                              <td style={{ padding: "10px 12px", maxWidth: 200 }}>
                                <div style={{ fontWeight: 500, color: "#e2e8f0", marginBottom: 2 }}>{item.description}</div>
                                {item.permit_notes && <div style={{ fontSize: 9.5, color: "#f59e0b", marginTop: 3 }}>⚠ {item.permit_notes}</div>}
                                {item.si_reference && <div style={{ fontSize: 9, color: "#334155", marginTop: 2 }}>{item.si_reference}</div>}
                              </td>
                              <td style={{ padding: "10px 12px", fontFamily: "monospace", color: "#94a3b8", fontSize: 11, whiteSpace: "nowrap" }}>{item.hs_code}</td>
                              <td style={{ padding: "10px 12px", color: "#94a3b8", whiteSpace: "nowrap" }}>{item.quantity} {item.unit}</td>
                              <td style={{ padding: "10px 12px", color: "#cbd5e1", whiteSpace: "nowrap" }}>{fmtUSD(item.cif_value_usd)}</td>
                              <td style={{ padding: "10px 12px", color: "#94a3b8", textAlign: "center" }}>{fmtPct(item.duty_rate)}</td>
                              <td style={{ padding: "10px 12px", color: "#cbd5e1", whiteSpace: "nowrap" }}>{fmtUSD(item.customs_duty_usd)}</td>
                              <td style={{ padding: "10px 12px", color: "#cbd5e1", whiteSpace: "nowrap" }}>{fmtUSD(item.vat_usd)}</td>
                              <td style={{ padding: "10px 12px", fontWeight: 600, color: "#eab308", whiteSpace: "nowrap" }}>{fmtUSD(item.total_duty_usd)}</td>
                              <td style={{ padding: "10px 12px" }}>
                                <span style={{ background: st.bg, color: st.color, fontSize: 9.5, fontWeight: 600, borderRadius: 20, padding: "3px 9px", letterSpacing: "0.05em", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 4 }}>
                                  <span className="glow-dot" style={{ width: 5, height: 5, background: st.dot }} />
                                  {item.compliance_status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Notes */}
              {result.boe_notes && (
                <div className="luna-card" style={{ borderColor: "rgba(234,179,8,0.2)" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#eab308", marginBottom: 8 }}>📝 Clearing Agent Notes</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.8 }}>{result.boe_notes}</div>
                </div>
              )}

              {/* Export actions */}
              <div className="luna-card" style={{ textAlign: "center", padding: "24px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#f8fafc", marginBottom: 6 }}>Export Documents</div>
                <div style={{ fontSize: 12, color: "#475569", marginBottom: 18 }}>Download your completed BOE for ZIMRA submission</div>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                  <button className="luna-btn luna-btn-xml" onClick={handleXML} disabled={xmlLoading} style={{ minWidth: 180 }}>
                    {xmlLoading ? <span className="spin" style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", display: "inline-block" }} /> : "📂"}
                    Download ASYCUDA XML
                  </button>
                  <button className="luna-btn luna-btn-success" onClick={handlePDF} disabled={pdfLoading} style={{ minWidth: 160 }}>
                    {pdfLoading ? <span className="spin" style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", display: "inline-block" }} /> : "📄"}
                    Download BOE PDF
                  </button>
                </div>
                <div style={{ marginTop: 12, fontSize: 10, color: "#334155" }}>
                  XML formatted for ZIMRA ASYCUDA World import · PDF is ZIMRA CF21 format
                </div>
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ── Sidebar content (shared between desktop & mobile drawer) ──────────────
function SidebarContent({ entryType, setEntryType, transport, setTransport, portEntry, setPortEntry, rbzRate, setRbzRate, docText, setDocText, fileName, setFileName, fileRef, onFileChange, onDrop, dragging, setDragging, loading, run, result, onClose }) {

  const loadSample = () => {
    const SAMPLE = `COMMERCIAL INVOICE
Invoice No: INV-2024-0892   Date: 15 May 2024
Exporter: Goldfields Trading Ltd, 14 Commissioner St, Johannesburg, South Africa
Importer: Zimbabwe General Stores (Pvt) Ltd, 32 Samora Machel Ave, Harare, Zimbabwe
Importer TIN: 2000123456

LINE ITEMS:
1. Ibuprofen 200mg Tablets x 5,000 boxes @ USD 2.50 each = USD 12,500.00
2. Portland Cement (OPC 42.5N) x 200 bags x 50kg @ USD 8.00/bag = USD 1,600.00
3. Refined Sunflower Cooking Oil 5L bottles x 500 units @ USD 4.50 = USD 2,250.00
4. Men's Cotton T-Shirts x 300 pieces @ USD 3.00 = USD 900.00
5. Toyota Land Cruiser 2022 (4x4, petrol, 4000cc) x 1 unit @ USD 45,000.00

Total FOB: USD 62,250.00  Freight: USD 1,800.00  Insurance: USD 250.00
Total CIF: USD 64,300.00  Country of Origin: South Africa
Port of Entry: Beitbridge  Transport: Road (TIR: ZA-2024-88234)`;
    setDocText(SAMPLE);
    setFileName("sample_invoice.txt");
    if (onClose) onClose();
  };

  return (
    <>
      {/* Section: Entry Parameters */}
      <div>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#eab308", marginBottom: 12 }}>Entry Parameters</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <label style={{ display: "block", fontSize: 10, color: "#475569", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 5 }}>Entry Type</label>
            <select className="luna-select" value={entryType} onChange={e => setEntryType(e.target.value)}>
              {["Home Consumption", "Transit", "Warehousing", "Temporary Import", "Export"].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 10, color: "#475569", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 5 }}>Mode of Transport</label>
            <select className="luna-select" value={transport} onChange={e => setTransport(e.target.value)}>
              {["Road", "Air", "Sea", "Rail"].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 10, color: "#475569", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 5 }}>Port of Entry</label>
            <select className="luna-select" value={portEntry} onChange={e => setPortEntry(e.target.value)}>
              {["Beitbridge", "Forbes (Mutare)", "Chirundu", "Plumtree", "Victoria Falls", "Harare Airport", "Bulawayo Airport", "Joshua Nkomo Airport"].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 10, color: "#475569", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 5 }}>RBZ Rate (ZWG / USD)</label>
            <input className="luna-input" type="number" step="0.01" value={rbzRate} onChange={e => setRbzRate(e.target.value)} placeholder="13.50" />
          </div>
        </div>
      </div>

      <hr className="hz-rule" />

      {/* Section: Documents */}
      <div>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#eab308", marginBottom: 12 }}>Shipping Documents</div>
        <div
          className={`dropzone ${dragging ? "dragging" : ""}`}
          onClick={() => fileRef.current.click()}
          onDrop={onDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
        >
          <input ref={fileRef} type="file" accept=".pdf,.txt,.csv,.xml" style={{ display: "none" }} onChange={onFileChange} />
          <div style={{ fontSize: 24, marginBottom: 6 }}>📄</div>
          {fileName
            ? <div style={{ fontSize: 12, color: "#eab308", fontWeight: 500 }}>{fileName}</div>
            : <>
              <div style={{ fontSize: 11.5, color: "#475569" }}>Drop invoice or packing list</div>
              <div style={{ fontSize: 10, color: "#eab308", marginTop: 4 }}>PDF · TXT · CSV · XML</div>
            </>
          }
        </div>

        <div style={{ fontSize: 10, color: "#334155", margin: "8px 0 6px", textAlign: "center" }}>— or paste text —</div>
        <textarea
          className="textarea-doc"
          value={docText}
          onChange={e => setDocText(e.target.value)}
          placeholder="Paste invoice / packing list text…"
          style={{ minHeight: 130 }}
        />
        <div style={{ display: "flex", gap: 7, marginTop: 8 }}>
          <button className="luna-btn luna-btn-ghost" style={{ flex: 1, fontSize: 11 }} onClick={loadSample}>Load Sample</button>
          <button className="luna-btn luna-btn-ghost" style={{ fontSize: 11 }} onClick={() => { setDocText(""); setFileName(""); }}>Clear</button>
        </div>
      </div>

      <hr className="hz-rule" />

      <button className="luna-btn luna-btn-primary" style={{ width: "100%", justifyContent: "center", padding: "13px" }} onClick={() => { run(); if (onClose) onClose(); }} disabled={loading || !docText.trim()}>
        {loading
          ? <><span className="spin" style={{ width: 14, height: 14, border: "2px solid rgba(10,15,30,0.3)", borderTop: "2px solid #0a0f1e", borderRadius: "50%", display: "inline-block" }} /> Processing…</>
          : <><span style={{ fontSize: 16 }}>⚡</span> Generate BOE Analysis</>
        }
      </button>

      {result && (
        <div style={{ textAlign: "center", fontSize: 11.5, padding: "4px 0" }}>
          <span className="glow-dot" style={{ background: result.ready_to_register ? "#22c55e" : "#f59e0b", boxShadow: `0 0 6px ${result.ready_to_register ? "#22c55e" : "#f59e0b"}`, display: "inline-block", marginRight: 5, verticalAlign: "middle" }} />
          <span style={{ color: result.ready_to_register ? "#22c55e" : "#f59e0b" }}>
            {result.ready_to_register ? "Ready for ZIMRA filing" : "Action required before filing"}
          </span>
        </div>
      )}
    </>
  );
}
