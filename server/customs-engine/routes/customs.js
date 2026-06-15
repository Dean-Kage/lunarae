'use strict';

const express             = require('express');
const router              = express.Router();
const customsEngine       = require('../services/customsEngine');
const tariffService       = require('../services/tariffService');
const licenceService      = require('../services/licenceService');
const cbcaService         = require('../services/cbcaService');
const validationService   = require('../services/validationService');
const restrictionsService = require('../services/restrictionsService');
const surtaxService       = require('../services/surtaxService');
const exciseService       = require('../services/exciseService');

function ok(res, data) {
  return res.json({ success: true, data });
}

function err(res, status, message, details) {
  return res.status(status).json({ success: false, error: message, details: details || null });
}

// GET /api/customs/lookup/:hsCode
// Look up a single HS code — rates, flags, licence requirements, restrictions
router.get('/lookup/:hsCode', (req, res) => {
  try {
    const { hsCode } = req.params;
    if (!hsCode) return err(res, 400, 'hsCode is required');

    const result = customsEngine.lookupHS(hsCode);
    if (!result) {
      return err(res, 404, `HS code ${hsCode} not found in tariff database`);
    }
    return ok(res, result);
  } catch (e) {
    return err(res, 500, e.message);
  }
});

// GET /api/customs/search?q=description
// Search HS codes by description keyword
router.get('/search', (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return err(res, 400, 'Query parameter "q" must be at least 2 characters');

    const results = tariffService.searchByDescription(q);
    return ok(res, { query: q, count: results.length, results });
  } catch (e) {
    return err(res, 500, e.message);
  }
});

// POST /api/customs/validate
// Validate an import: returns duty rates, licence requirements, CBCA status, restrictions
// Body: { hsCode, cifValue?, fobValue?, country?, importerType? }
router.post('/validate', (req, res) => {
  try {
    const { hsCode, cifValue, fobValue, country, importerType } = req.body;
    if (!hsCode) return err(res, 400, 'hsCode is required');

    const result = validationService.validateImport({ hsCode, cifValue, fobValue, country, importerType });
    return ok(res, result);
  } catch (e) {
    return err(res, 500, e.message);
  }
});

// POST /api/customs/calculate
// Full duty calculation with all taxes
// Body: { hsCode, cifValue, fobValue?, country?, importerType?, yearOfManufacture?, description? }
router.post('/calculate', (req, res) => {
  try {
    const { hsCode, cifValue, fobValue, country, importerType, yearOfManufacture, description } = req.body;
    if (!hsCode)   return err(res, 400, 'hsCode is required');
    if (!cifValue) return err(res, 400, 'cifValue (USD) is required');

    const result = customsEngine.evaluateImport({
      hsCode,
      description,
      country,
      cifValue: parseFloat(cifValue),
      fobValue: fobValue ? parseFloat(fobValue) : null,
      importerType,
      yearOfManufacture: yearOfManufacture ? parseInt(yearOfManufacture, 10) : null,
    });
    return ok(res, result);
  } catch (e) {
    return err(res, 400, e.message);
  }
});

// POST /api/customs/licence-check
// Check import/export licence requirements for a given HS code
// Body: { hsCode, type? } — type: 'import' | 'export' | 'both' (default 'both')
router.post('/licence-check', (req, res) => {
  try {
    const { hsCode, type = 'both' } = req.body;
    if (!hsCode) return err(res, 400, 'hsCode is required');

    const info = licenceService.getLicenceInfo(hsCode);
    const result = {
      hs_code: hsCode,
    };

    if (type === 'import' || type === 'both') {
      result.import = {
        required:   info.import_required,
        authority:  info.authority,
        permit:     info.import_permit,
        notes:      info.notes,
        references: info.si_references,
      };
    }
    if (type === 'export' || type === 'both') {
      result.export = {
        required:  info.export_required,
        authority: info.authority,
        permit:    info.export_permit,
      };
    }
    return ok(res, result);
  } catch (e) {
    return err(res, 500, e.message);
  }
});

// POST /api/customs/cbca-check
// Check CBCA requirements for a given HS code and FOB value
// Body: { hsCode, fobValue? }
router.post('/cbca-check', (req, res) => {
  try {
    const { hsCode, fobValue } = req.body;
    if (!hsCode) return err(res, 400, 'hsCode is required');

    const fob    = fobValue ? parseFloat(fobValue) : undefined;
    const result = cbcaService.getCBCAInfo(hsCode, fob);
    return ok(res, result);
  } catch (e) {
    return err(res, 500, e.message);
  }
});

// POST /api/customs/restriction-check
// Check if goods are prohibited or restricted
// Body: { hsCode, direction? } — direction: 'import' | 'export' | 'both'
router.post('/restriction-check', (req, res) => {
  try {
    const { hsCode, direction = 'import' } = req.body;
    if (!hsCode) return err(res, 400, 'hsCode is required');

    const result = {};
    if (direction === 'import' || direction === 'both') {
      result.import = restrictionsService.getImportRestrictions(hsCode);
    }
    if (direction === 'export' || direction === 'both') {
      result.export = restrictionsService.getExportRestrictions(hsCode);
    }
    return ok(res, result);
  } catch (e) {
    return err(res, 500, e.message);
  }
});

// POST /api/customs/vehicle-check
// Check vehicle age compliance under SI 157/2024
// Body: { hsCode, yearOfManufacture }
router.post('/vehicle-check', (req, res) => {
  try {
    const { hsCode, yearOfManufacture } = req.body;
    if (!hsCode)            return err(res, 400, 'hsCode is required');
    if (!yearOfManufacture) return err(res, 400, 'yearOfManufacture is required');

    const result = restrictionsService.checkVehicleAgeCompliance(hsCode, parseInt(yearOfManufacture, 10));
    return ok(res, result);
  } catch (e) {
    return err(res, 500, e.message);
  }
});

// GET /api/customs/surtax/:hsCode
// Get surtax info for a given HS code
router.get('/surtax/:hsCode', (req, res) => {
  try {
    const info = surtaxService.getSurtaxInfo(req.params.hsCode);
    return ok(res, info);
  } catch (e) {
    return err(res, 500, e.message);
  }
});

// GET /api/customs/excise/:hsCode
// Get excise duty info for a given HS code
router.get('/excise/:hsCode', (req, res) => {
  try {
    const info = exciseService.getExciseInfo(req.params.hsCode);
    return ok(res, info);
  } catch (e) {
    return err(res, 500, e.message);
  }
});

// GET /api/customs/health
// Engine health check
router.get('/health', (req, res) => {
  return ok(res, {
    status:  'ok',
    engine:  'Lunarae Customs Intelligence Engine v1.0.0',
    country: 'Zimbabwe',
    vat:     '14.5%',
    si:      ['SI 35/2024','SI 50A/2025','SI 54/2024','SI 59/2026','SI 5/2023','SI 157/2024','SI 122/2017'],
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
