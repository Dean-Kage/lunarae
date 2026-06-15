'use strict';

const path = require('path');
const DB   = path.join(__dirname, '..', 'database');

const tariffDB  = require(path.join(DB, 'tariffCodes.json'));
const licenceDB = require(path.join(DB, 'licenceRules.json'));

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

function requiresImportLicence(hsCode) {
  const entry = _entry(hsCode);
  if (entry && entry.import_licence_required === true) return true;

  const ch  = _chapter(hsCode);
  const hd  = _heading(hsCode);
  const chStr = ch ? String(ch).padStart(2, '0') : null;

  if (chStr && licenceDB.import_licence_chapters[ch]) return true;
  if (licenceDB.specific_hs_codes && licenceDB.specific_hs_codes[_normalise(hsCode)]) {
    return licenceDB.specific_hs_codes[_normalise(hsCode)].import_required === true;
  }
  return false;
}

function requiresExportLicence(hsCode) {
  const entry = _entry(hsCode);
  if (entry && entry.export_licence_required === true) return true;

  const ch  = _chapter(hsCode);
  if (ch && licenceDB.export_licence_chapters && licenceDB.export_licence_chapters[ch]) return true;

  if (licenceDB.specific_hs_codes && licenceDB.specific_hs_codes[_normalise(hsCode)]) {
    return licenceDB.specific_hs_codes[_normalise(hsCode)].export_required === true;
  }
  return false;
}

function getLicensingAuthority(hsCode) {
  const entry = _entry(hsCode);
  if (entry && entry.authority) return entry.authority;

  const ch = _chapter(hsCode);
  const chapInfo = ch && licenceDB.import_licence_chapters[ch];
  if (chapInfo) return chapInfo.authority;
  return null;
}

function getImportPermitType(hsCode) {
  const entry = _entry(hsCode);
  if (entry && entry.licence_type) return entry.licence_type;

  const ch = _chapter(hsCode);
  const chapInfo = ch && licenceDB.import_licence_chapters[ch];
  if (chapInfo) return chapInfo.licence_type;
  return null;
}

function getExportPermitType(hsCode) {
  const entry = _entry(hsCode);
  if (entry && entry.export_licence_required) {
    if (entry.licence_type && entry.export_licence_required) return entry.licence_type;
  }

  const ch = _chapter(hsCode);
  const chapInfo = ch && licenceDB.export_licence_chapters && licenceDB.export_licence_chapters[ch];
  if (chapInfo) return chapInfo.licence_type;
  return null;
}

function getAuthorityDetails(authorityCode) {
  return licenceDB.authorities[authorityCode] || null;
}

function getLicenceInfo(hsCode) {
  const importRequired = requiresImportLicence(hsCode);
  const exportRequired = requiresExportLicence(hsCode);
  const authority      = getLicensingAuthority(hsCode);
  const importPermit   = getImportPermitType(hsCode);
  const exportPermit   = getExportPermitType(hsCode);
  const entry          = _entry(hsCode);
  const ch             = _chapter(hsCode);
  const notes          = entry ? entry.notes : null;
  const chapInfo       = ch && (licenceDB.import_licence_chapters[ch] || licenceDB.export_licence_chapters && licenceDB.export_licence_chapters[ch]);

  return {
    hs_code:          _normalise(hsCode),
    import_required:  importRequired,
    export_required:  exportRequired,
    authority:        authority,
    import_permit:    importPermit,
    export_permit:    exportPermit,
    notes:            notes || (chapInfo && chapInfo.notes) || null,
    si_references:    entry ? entry.si_references : [],
  };
}

module.exports = {
  requiresImportLicence,
  requiresExportLicence,
  getLicensingAuthority,
  getImportPermitType,
  getExportPermitType,
  getAuthorityDetails,
  getLicenceInfo,
};
