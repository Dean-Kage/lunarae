'use strict';

const tariffService      = require('./tariffService');
const licenceService     = require('./licenceService');
const cbcaService        = require('./cbcaService');
const surtaxService      = require('./surtaxService');
const exciseService      = require('./exciseService');
const restrictionsService = require('./restrictionsService');

const SADC_COUNTRIES  = ['South Africa','Botswana','Zambia','Mozambique','Tanzania','Malawi','Namibia','Lesotho','Eswatini','DRC','Angola','Seychelles','Mauritius','Madagascar','Comoros'];
const COMESA_COUNTRIES = ['Zambia','Malawi','Uganda','Kenya','Ethiopia','Rwanda','Burundi','Comoros','Djibouti','Egypt','Eritrea','Eswatini','Libya','Madagascar','Mauritius','Seychelles','Sudan','Zimbabwe','DRC','Somalia'];

function _resolveAgreement(country) {
  if (!country) return 'general';
  const c = country.trim();
  if (SADC_COUNTRIES.some(s => s.toLowerCase() === c.toLowerCase())) return 'sadc';
  if (COMESA_COUNTRIES.some(s => s.toLowerCase() === c.toLowerCase())) return 'comesa';
  return 'general';
}

function validateImport({ hsCode, cifValue, fobValue, country, importerType }) {
  if (!hsCode) throw new Error('hsCode is required');

  const agreement    = _resolveAgreement(country);
  const tariff       = tariffService.getFullTariff(hsCode, agreement);
  const isKnown      = tariff !== null;

  const dutyRate     = isKnown ? tariff.duty_rate     : null;
  const vatRate      = isKnown ? tariff.vat_rate       : 14.5;
  const surtaxRate   = isKnown ? tariff.surtax_rate    : surtaxService.getSurtax(hsCode);
  const exciseRate   = isKnown ? tariff.excise_rate    : exciseService.getExcise(hsCode);

  const importLicenceRequired = licenceService.requiresImportLicence(hsCode);
  const exportLicenceRequired = licenceService.requiresExportLicence(hsCode);
  const authority             = licenceService.getLicensingAuthority(hsCode);
  const importPermit          = licenceService.getImportPermitType(hsCode);

  const cbcaInfo  = cbcaService.getCBCAInfo(hsCode, fobValue);
  const importRx  = restrictionsService.getImportRestrictions(hsCode);

  const warnings   = [];
  const references = [];

  if (importRx.prohibited) {
    warnings.push({ level: 'error', message: `PROHIBITED IMPORT — ${importRx.prohibited_items[0]?.reason || 'not permitted'}` });
  }

  if (importRx.restricted && !importRx.prohibited) {
    const items = importRx.restricted_items;
    items.forEach(i => warnings.push({ level: 'warning', message: `Restricted goods: ${i.permit_type} required from ${i.permit_authority}` }));
  }

  if (importLicenceRequired) {
    warnings.push({ level: 'info', message: `Import permit required: ${importPermit || 'permit'} from ${authority || 'relevant authority'}` });
    if (!references.includes('SI 122/2017')) references.push('SI 122/2017');
  }

  if (cbcaInfo.cbca_required) {
    const msg = cbcaInfo.cbca_always
      ? `CBCA always required for this goods category`
      : `CBCA required — FOB USD ${fobValue?.toLocaleString() || '?'} exceeds USD 1,000 threshold`;
    warnings.push({ level: 'info', message: msg });
    references.push('SI 35/2024');
  }

  if (surtaxRate > 0) {
    warnings.push({ level: 'info', message: `Surtax of ${surtaxRate}% applies per SI 50A/2025` });
    references.push('SI 50A/2025');
  }

  if (exciseRate > 0) {
    warnings.push({ level: 'info', message: `Excise duty of ${exciseRate}% applies on this goods category` });
  }

  if (!isKnown) {
    warnings.push({ level: 'warning', message: `HS code ${hsCode} not found in tariff database — rates may be estimates` });
  }

  if (tariff) {
    tariff.si_references.forEach(r => { if (!references.includes(r)) references.push(r); });
  }

  const valid = !importRx.prohibited;

  return {
    valid,
    hs_code:                 hsCode,
    trade_agreement:         agreement,
    duty_rate:               dutyRate,
    vat_rate:                vatRate,
    surtax_rate:             surtaxRate,
    excise_rate:             exciseRate,
    import_licence_required: importLicenceRequired,
    export_licence_required: exportLicenceRequired,
    cbca_required:           cbcaInfo.cbca_required,
    cbca_always:             cbcaInfo.cbca_always,
    prohibited:              importRx.prohibited,
    restricted:              importRx.restricted,
    authority:               authority,
    import_permit:           importPermit,
    warnings,
    references: [...new Set(references)],
    tariff_entry:            tariff,
  };
}

module.exports = { validateImport };
