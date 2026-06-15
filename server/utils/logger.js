const db = require('../db')

/**
 * Fire-and-forget log insert. Never throws, never blocks the caller.
 * @param {string} level    'info' | 'warn' | 'error'
 * @param {string} action   short snake_case label e.g. 'user_login'
 * @param {object} opts     { entity, entityId, actorId, actorName, details }
 */
module.exports = function log(level, action, opts = {}) {
  const { entity, entityId, actorId, actorName, details } = opts
  db.query(
    `INSERT INTO system_logs (level, action, entity, entity_id, actor_id, actor_name, details)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [level, action, entity || null, entityId || null, actorId || null, actorName || null, details || null]
  ).catch(() => {}) // swallow — logging must never break a request
}
