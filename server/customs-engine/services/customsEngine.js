'use strict';

const tariffService       = require('./tariffService');
const licenceService      = require('./licenceService');
const cbcaService         = require('./cbcaService');
const surtaxService       = require('./surtaxService');
const exciseService       = require('./exciseService');
const restrictionsService = require('./restrictionsService');
const validationService   = require('./validationService');

const SADC_COUNTRIES = ['South Africa','Botswana','Zambia','Mozambique','Tanzania','Malawi','Namibia','Lesotho','Eswatini','DRC','Angola','Seychelles','Mauritius','Madagascar','Comoros'];
const COMESA_COUNTRIES = ['Zambia','Malawi','Uganda','Kenya','Ethiopia','Rwanda','Burundi','Comoros','Djibouti','Egypt','Eritrea','Eswatini','Libya','Madagascar','Mauritius','Seychelles','Sudan','Zimbabwe','DRC','Somalia'];

function _resolveAgreement(country) {
  if (!country) return 'general';
  const c = country.trim();
  if (SADC_COUNTRIES.some(s => s.toLowerCase() === c.toLowerCase())) return 'sadc';
  if (COMESA_COUNTRIES.some(s => s.toLowerCase() === c.toLowerCase())) return 'comesa';
  return 'general';
}

function _round(n, dp = 2) {
  return parseFloat(n.toFixed(dp));
}

/**
 * evaluateImport — master calculation for a single import consignment.
 *
 * @param {object} params
 * @param {string}  params.hsCode       - 8-10 digit HS code
 * @param {string}  [params.description] - goods description (informational)
 * @param {string}  [params.country]    - country of origin (for trade agreement lookup)
 * @param {number}  params.cifValue     - CIF value in USD
 * @param {number}  [params.fobValue]   - FOB value in USD (used for CBCA threshold)
 * @param {string}  [params.importerType] - importer category ('general','manufacturer','diplomatic','government')
 * @param {number}  [params.yearOfManufacture] - for motor vehicles (SI 157/2024)
 *
 * @returns {object} complete evaluation result
 */
function evaluateImport({ hsCode, description, country, cifValue, fobValue, importerType, yearOfManufacture }) {
  if (!hsCode)   throw new Error('hsCode is required');
  if (!cifValue || isNaN(cifValue)) throw new Error('cifValue (USD) is required and must be a number');

  const cif         = parseFloat(cifValue);
  const fob         = fobValue ? parseFloat(fobValue) : cif * 0.85; // estimate FOB as 85% CIF if not provided
  const agreement   = _resolveAgreement(country);
  const tariff      = tariffService.getFullTariff(hsCode, agreement);

  const dutyRate    = tariff ? tariff.duty_rate    : 20;
  const vatRate     = tariff ? tariff.vat_rate     : 14.5;
  const surtaxRate  = tariff ? tariff.surtax_rate  : surtaxService.getSurtax(hsCode);
  const exciseRate  = tariff ? tariff.excise_rate  : exciseService.getExcise(hsCode);

  // -- Duty calculation
  const dutyAmt     = _round(cif * dutyRate / 100);
  // -- Surtax on CIF
  const surtaxAmt   = _round(cif * surtaxRate / 100);
  // -- Excise on (CIF + duty)
  const exciseAmt   = _round((cif + dutyAmt) * exciseRate / 100);
  // -- VAT base = CIF + duty + surtax + excise
  const vatBase     = _round(cif + dutyAmt + surtaxAmt + exciseAmt);
  const vatAmt      = _round(vatBase * vatRate / 100);
  const totalTaxes  = _round(dutyAmt + surtaxAmt + exciseAmt + vatAmt);
  const totalPayable = _round(cif + totalTaxes);

  // -- CBCA check
  const cbcaInfo    = cbcaService.getCBCAInfo(hsCode, fob);

  // -- Licence requirements
  const licenceInfo = licenceService.getLicenceInfo(hsCode);

  // -- Restrictions
  const importRx    = restrictionsService.getImportRestrictions(hsCode);
  const exportRx    = restrictionsService.getExportRestrictions(hsCode);

  // -- Vehicle age check (if applicable)
  let vehicleCheck  = null;
  const ch          = parseInt(String(hsCode).replace(/[\s.\-]/g, '').substring(0, 2), 10);
  if (ch === 87 && yearOfManufacture) {
    vehicleCheck    = restrictionsService.checkVehicleAgeCompliance(hsCode, yearOfManufacture);
  }

  // -- Build warnings
  const warnings    = [];
  if (importRx.prohibited) {
    warnings.push({ level: 'error', code: 'PROHIBITED', message: 'Import is PROHIBITED — goods cannot be cleared' });
  }
  if (importRx.restricted && !importRx.prohibited) {
    importRx.restricted_items.forEach(i =>
      warnings.push({ level: 'warning', code: 'RESTRICTED', message: `Import permit required: ${i.permit_type} from ${i.permit_authority}` })
    );
  }
  if (licenceInfo.import_required) {
    warnings.push({ level: 'info', code: 'IMPORT_LICENCE', message: `Import permit required: ${licenceInfo.import_permit || 'permit'} from ${licenceInfo.authority || 'authority'}` });
  }
  if (licenceInfo.export_required) {
    warnings.push({ level: 'info', code: 'EXPORT_LICENCE', message: `Export permit required from ${licenceInfo.authority || 'relevant authority'}` });
  }
  if (cbcaInfo.cbca_required) {
    warnings.push({ level: 'info', code: 'CBCA', message: cbcaInfo.cbca_always ? 'CBCA clearance always required for this goods category' : `CBCA required: FOB USD ${fob.toLocaleString()} > USD 1,000 threshold` });
  }
  if (vehicleCheck && vehicleCheck.applicable && vehicleCheck.compliant === false) {
    warnings.push({ level: 'error', code: 'VEHICLE_AGE', message: vehicleCheck.message });
  }
  if (surtaxAmt > 0) {
    warnings.push({ level: 'info', code: 'SURTAX', message: `Surtax ${surtaxRate}% (USD ${surtaxAmt.toLocaleString()}) per SI 50A/2025` });
  }
  if (!tariff) {
    warnings.push({ level: 'warning', code: 'HS_NOT_FOUND', message: `HS code ${hsCode} not in tariff database — duty rate estimated at ${dutyRate}%` });
  }

  const references = [];
  if (tariff) tariff.si_references.forEach(r => { if (!references.includes(r)) references.push(r); });
  if (cbcaInfo.cbca_required && !references.includes('SI 35/2024')) references.push('SI 35/2024');
  if (surtaxAmt > 0 && !references.includes('SI 50A/2025')) references.push('SI 50A/2025');
  if (licenceInfo.import_required && !references.includes('SI 122/2017')) references.push('SI 122/2017');
  if (vehicleCheck && vehicleCheck.applicable && !references.includes('SI 157/2024')) references.push('SI 157/2024');

  return {
    classification: {
      hs_code:       tariff ? tariff.hs_code : hsCode,
      description:   tariff ? tariff.description : (description || null),
      chapter:       tariff ? tariff.chapter : ch,
      heading:       tariff ? tariff.heading : null,
      unit:          tariff ? tariff.unit : null,
      trade_agreement: agreement,
      country_of_origin: country || null,
    },
    duty: {
      rate_pct:      dutyRate,
      cif_value:     cif,
      amount:        dutyAmt,
    },
    surtax: {
      rate_pct:      surtaxRate,
      applies:       surtaxAmt > 0,
      amount:        surtaxAmt,
      si_reference:  surtaxAmt > 0 ? 'SI 50A/2025' : null,
    },
    excise: {
      rate_pct:      exciseRate,
      applies:       exciseAmt > 0,
      amount:        exciseAmt,
    },
    vat: {
      rate_pct:      vatRate,
      base:          vatBase,
      amount:        vatAmt,
    },
    totalTaxes:      totalTaxes,
    totalPayable:    totalPayable,
    breakdown: {
      cif:           cif,
      duty:          dutyAmt,
      surtax:        surtaxAmt,
      excise:        exciseAmt,
      vat:           vatAmt,
      total_taxes:   totalTaxes,
      total_payable: totalPayable,
    },
    cbca: {
      required:      cbcaInfo.cbca_required,
      always:        cbcaInfo.cbca_always,
      fob_value:     fob,
      threshold:     1000,
      reason:        cbcaInfo.reason,
      si_reference:  'SI 35/2024',
    },
    licences: {
      import_required:  licenceInfo.import_required,
      export_required:  licenceInfo.export_required,
      authority:        licenceInfo.authority,
      import_permit:    licenceInfo.import_permit,
      export_permit:    licenceInfo.export_permit,
      si_reference:     licenceInfo.import_required || licenceInfo.export_required ? 'SI 122/2017' : null,
    },
    restrictions: {
      prohibited:      importRx.prohibited,
      restricted:      importRx.restricted,
      import_issues:   importRx.prohibited_items.concat(importRx.restricted_items),
      export_issues:   exportRx.prohibited_items.concat(exportRx.restricted_items),
    },
    vehicle_compliance: vehicleCheck,
    warnings,
    references: [...new Set(references)],
    meta: {
      calculated_at: new Date().toISOString(),
      engine_version: '1.0.0',
      source: 'Lunarae Customs Engine — Zimbabwe',
    },
  };
}

/**
 * lookupHS — lightweight lookup without full calculation.
 */
function lookupHS(hsCode) {
  const tariff = tariffService.getFullTariff(hsCode, 'general');
  if (!tariff) return null;
  return {
    hs_code:         tariff.hs_code,
    description:     tariff.description,
    chapter:         tariff.chapter,
    heading:         tariff.heading,
    unit:            tariff.unit,
    duty_rate_mfn:   tariff.duty_rate,
    all_duty_rates:  tariff.all_duty_rates,
    vat_rate:        tariff.vat_rate,
    excise_rate:     tariff.excise_rate,
    surtax_rate:     tariff.surtax_rate,
    cbca_required:   tariff.cbca_required,
    cbca_always:     tariff.cbca_always,
    import_licence:  tariff.import_licence_required,
    export_licence:  tariff.export_licence_required,
    prohibited:      tariff.prohibited,
    restricted:      tariff.restricted,
    authority:       tariff.authority,
    licence_type:    tariff.licence_type,
    si_references:   tariff.si_references,
    notes:           tariff.notes,
  };
}

module.exports = {
  evaluateImport,
  lookupHS,
};
