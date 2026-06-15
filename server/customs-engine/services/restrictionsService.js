'use strict';

const path = require('path');
const DB   = path.join(__dirname, '..', 'database');

const tariffDB       = require(path.join(DB, 'tariffCodes.json'));
const restrictionsDB = require(path.join(DB, 'restrictions.json'));

const CODES = tariffDB.codes;

function _normalise(hsCode) {
  return String(hsCode || '').replace(/[\s.\-]/g, '');
}

function _entry(hsCode) {
  const n = _normalise(hsCode);
  return CODES.find(c => _normalise(c.hs_code) === n)
    || CODES.find(c => _normalise(c.hs_code).startsWith(n.substring(0, 6)))
    || null;
}

function _chapter(hsCode) {
  const n = _normalise(hsCode);
  return n.length >= 2 ? parseInt(n.substring(0, 2), 10) : null;
}

function _heading(hsCode) {
  const n = _normalise(hsCode);
  return n.length >= 4 ? n.substring(0, 4) : null;
}

function _matchesCode(code, hsCode) {
  const n  = _normalise(hsCode);
  const cn = _normalise(code);
  return n.startsWith(cn) || cn.startsWith(n);
}

function _findInList(list, hsCode) {
  return list.filter(item =>
    item.hs_codes && item.hs_codes.some(c => _matchesCode(c, hsCode))
  );
}

function isProhibited(hsCode) {
  const entry = _entry(hsCode);
  if (entry && entry.prohibited === true) return true;

  const importHits  = _findInList(restrictionsDB.prohibited_imports, hsCode);
  const exportHits  = _findInList(restrictionsDB.prohibited_exports, hsCode);
  return importHits.length > 0 || exportHits.length > 0;
}

function isRestricted(hsCode) {
  if (isProhibited(hsCode)) return true;

  const entry = _entry(hsCode);
  if (entry && entry.restricted === true) return true;

  const importHits = _findInList(restrictionsDB.restricted_imports, hsCode);
  const exportHits = _findInList(restrictionsDB.restricted_exports, hsCode);
  return importHits.length > 0 || exportHits.length > 0;
}

function getRestrictionReason(hsCode) {
  const entry = _entry(hsCode);
  if (entry && entry.restriction_reason) return entry.restriction_reason;

  const importHits = _findInList(restrictionsDB.prohibited_imports, hsCode);
  if (importHits.length > 0) return importHits[0].reason;

  const exportHits = _findInList(restrictionsDB.prohibited_exports, hsCode);
  if (exportHits.length > 0) return exportHits[0].reason;

  const restrictImport = _findInList(restrictionsDB.restricted_imports, hsCode);
  if (restrictImport.length > 0) return restrictImport[0].notes || `Restricted import — permit required from ${restrictImport[0].permit_authority}`;

  const restrictExport = _findInList(restrictionsDB.restricted_exports, hsCode);
  if (restrictExport.length > 0) return restrictExport[0].notes || `Restricted export — permit required from ${restrictExport[0].permit_authority}`;

  return null;
}

function getImportRestrictions(hsCode) {
  const prohibitedMatches  = _findInList(restrictionsDB.prohibited_imports, hsCode);
  const restrictedMatches  = _findInList(restrictionsDB.restricted_imports, hsCode);
  const entry              = _entry(hsCode);

  return {
    hs_code:   _normalise(hsCode),
    prohibited: prohibitedMatches.length > 0 || (entry && entry.prohibited === true),
    restricted: restrictedMatches.length > 0 || (entry && entry.restricted === true),
    prohibited_items: prohibitedMatches.map(i => ({
      category:     i.category,
      reason:       i.reason,
      penalty:      i.penalty,
      si_reference: i.si_reference,
    })),
    restricted_items: restrictedMatches.map(i => ({
      category:         i.category,
      permit_authority: i.permit_authority,
      permit_type:      i.permit_type,
      notes:            i.notes,
      si_reference:     i.si_reference,
    })),
  };
}

function getExportRestrictions(hsCode) {
  const prohibitedMatches = _findInList(restrictionsDB.prohibited_exports, hsCode);
  const restrictedMatches = _findInList(restrictionsDB.restricted_exports, hsCode);
  const entry             = _entry(hsCode);

  return {
    hs_code:   _normalise(hsCode),
    prohibited: prohibitedMatches.length > 0,
    restricted: restrictedMatches.length > 0 || (entry && entry.export_licence_required === true),
    prohibited_items: prohibitedMatches.map(i => ({
      category:     i.category,
      reason:       i.reason,
      si_reference: i.si_reference,
    })),
    restricted_items: restrictedMatches.map(i => ({
      category:         i.category,
      permit_authority: i.permit_authority,
      permit_type:      i.permit_type,
      notes:            i.notes,
      si_reference:     i.si_reference,
    })),
  };
}

function checkVehicleAgeCompliance(hsCode, yearOfManufacture) {
  const n  = _normalise(hsCode);
  const ch = _chapter(hsCode);
  const hd = _heading(hsCode);
  if (ch !== 87) return { applicable: false };

  const rules   = restrictionsDB.vehicle_age_limits;
  const currentYear = new Date().getFullYear();
  const ageYears    = yearOfManufacture ? currentYear - yearOfManufacture : null;

  let limit     = null;
  let limitName = null;

  if (['8703'].includes(hd)) {
    if (n === '87038000') {
      return { applicable: true, ev_exempt: true, max_age: null, message: 'Electric vehicles are exempt from age restrictions (SI 157/2024)' };
    }
    limit     = rules.passenger_vehicles.max_age_years;
    limitName = 'Passenger vehicle';
  } else if (['8701','8702','8704','8705'].includes(hd)) {
    limit     = rules.commercial_vehicles.max_age_years;
    limitName = 'Commercial vehicle';
  } else if (hd === '8711') {
    limit     = rules.motorcycles.max_age_years;
    limitName = 'Motorcycle';
  }

  if (!limit) return { applicable: true, max_age: null, message: 'No specific age limit found for this vehicle subheading' };

  const compliant = ageYears !== null ? ageYears <= limit : null;
  return {
    applicable:         true,
    limitName,
    max_age_years:      limit,
    year_of_manufacture: yearOfManufacture,
    age_years:          ageYears,
    compliant,
    drive_side:         rules.drive_side_requirement,
    si_reference:       'SI 157/2024',
    message: compliant === null
      ? `Age restriction: max ${limit} years (${limitName})`
      : compliant
        ? `Vehicle complies — ${ageYears} years old, limit is ${limit} years`
        : `NON-COMPLIANT — vehicle is ${ageYears} years old, maximum allowed is ${limit} years`,
  };
}

module.exports = {
  isProhibited,
  isRestricted,
  getRestrictionReason,
  getImportRestrictions,
  getExportRestrictions,
  checkVehicleAgeCompliance,
};
