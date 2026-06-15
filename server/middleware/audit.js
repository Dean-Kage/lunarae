'use strict';

const auditService = require('../audit/auditService');

/**
 * Express middleware factory — auto-captures audit data from request/response.
 *
 * Usage:
 *   router.post('/login', audit('LOGIN', 'user'), handler)
 *
 * - Fires ONLY on 2xx responses (success)
 * - Extracts entity_id from common response body shapes
 * - Never delays or modifies the response
 * - Sets req._audit so handlers can enrich it: req._audit.entity_id = id
 *
 * @param {string} action     - audit action constant (e.g. 'LOGIN', 'BOE_CREATED')
 * @param {string} entityType - entity being acted on (e.g. 'user', 'boe', 'invoice')
 */
function audit(action, entityType) {
  return (req, res, next) => {
    // Attach a mutable context so handlers can enrich the audit entry
    req._audit = {
      action,
      entity_type: entityType || null,
      entity_id:   null,
      details:     null,
      before:      null,
      after:       null,
    };

    // Wrap res.json to intercept the outgoing response body
    const _json = res.json.bind(res);
    res.json = function (body) {
      const status = res.statusCode;

      // Fire-and-forget audit only on successful responses
      if (status >= 200 && status < 300) {
        setImmediate(() => {
          // Pull entity_id: handler may have set it, or guess from response body
          const eid =
            req._audit.entity_id ??
            body?.id         ?? body?.boe?.id    ?? body?.boe_id   ??
            body?.user?.id   ?? body?.invoice?.id ?? body?.payment_id ??
            body?.payment?.id ?? null;

          auditService.log({
            action:      req._audit.action,
            entity_type: req._audit.entity_type,
            entity_id:   eid,
            company_id:  req.user?.company_id || null,
            user_id:     req.user?.id         || null,
            before:      req._audit.before,
            after:       req._audit.after,
            ip:          auditService.extractIp(req),
            ua:          req.headers['user-agent'] || null,
            details:     req._audit.details,
          });
        });
      }

      return _json(body);
    };

    next();
  };
}

module.exports = audit;
