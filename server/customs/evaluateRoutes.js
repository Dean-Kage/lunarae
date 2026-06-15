'use strict';

const router       = require('express').Router();
const { evaluate } = require('./customsDecisionEngine');

function ok(res, data)          { return res.json({ success: true, data }); }
function fail(res, status, msg) { return res.status(status).json({ success: false, error: msg }); }

// POST /api/customs/evaluate
// Body: { description, quantity, unitPrice, cifValue, fobValue, country, importerType }
router.post('/', async (req, res) => {
  try {
    const { description, quantity, unitPrice, cifValue, fobValue, country, importerType } = req.body;

    if (!description || !String(description).trim()) {
      return fail(res, 400, 'description is required');
    }

    const result = await evaluate({
      description,
      quantity:     quantity    != null ? Number(quantity)    : undefined,
      unitPrice:    unitPrice   != null ? Number(unitPrice)   : undefined,
      cifValue:     cifValue    != null ? Number(cifValue)    : undefined,
      fobValue:     fobValue    != null ? Number(fobValue)    : undefined,
      country:      country     || undefined,
      importerType: importerType || undefined,
    });

    return ok(res, result);
  } catch (e) {
    console.error('[evaluate route] Error:', e.message);
    return fail(res, 500, e.message);
  }
});

module.exports = router;
