'use strict';

const db = require('../db');

async function initTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id            BIGINT       AUTO_INCREMENT PRIMARY KEY,
      company_id    INT          DEFAULT NULL,
      user_id       INT          DEFAULT NULL,
      action        VARCHAR(60)  NOT NULL,
      entity_type   VARCHAR(50)  DEFAULT NULL,
      entity_id     BIGINT       DEFAULT NULL,
      before_json   JSON         DEFAULT NULL,
      after_json    JSON         DEFAULT NULL,
      ip_address    VARCHAR(45)  DEFAULT NULL,
      user_agent    VARCHAR(500) DEFAULT NULL,
      details       TEXT         DEFAULT NULL,
      created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

      INDEX idx_al_company  (company_id),
      INDEX idx_al_user     (user_id),
      INDEX idx_al_action   (action),
      INDEX idx_al_entity   (entity_type, entity_id),
      INDEX idx_al_created  (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

/**
 * Insert one audit record. Fire-and-forget safe (returns Promise).
 */
async function insert({
  company_id = null,
  user_id    = null,
  action,
  entity_type = null,
  entity_id   = null,
  before_json = null,
  after_json  = null,
  ip_address  = null,
  user_agent  = null,
  details     = null,
}) {
  if (!action) return;
  await db.query(
    `INSERT INTO audit_logs
       (company_id, user_id, action, entity_type, entity_id,
        before_json, after_json, ip_address, user_agent, details)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      company_id || null,
      user_id    || null,
      action,
      entity_type || null,
      entity_id   != null ? Number(entity_id) : null,
      before_json ? JSON.stringify(before_json) : null,
      after_json  ? JSON.stringify(after_json)  : null,
      ip_address  ? String(ip_address).slice(0, 45)   : null,
      user_agent  ? String(user_agent).slice(0, 500)  : null,
      details     ? String(details).slice(0, 1000)    : null,
    ]
  );
}

/**
 * Paginated query with multi-field filtering.
 */
async function find({
  company_id, user_id, action, entity_type, entity_id,
  from_date, to_date,
  page  = 1,
  limit = 50,
} = {}) {
  const conditions = ['1=1'];
  const params     = [];

  if (company_id  != null) { conditions.push('company_id = ?');     params.push(company_id);  }
  if (user_id     != null) { conditions.push('user_id = ?');        params.push(user_id);     }
  if (action)              { conditions.push('action = ?');          params.push(action);      }
  if (entity_type)         { conditions.push('entity_type = ?');     params.push(entity_type); }
  if (entity_id   != null) { conditions.push('entity_id = ?');      params.push(entity_id);   }
  if (from_date)           { conditions.push('created_at >= ?');     params.push(from_date);   }
  if (to_date)             { conditions.push('created_at <= ?');     params.push(to_date);     }

  const where   = conditions.join(' AND ');
  const offset  = (Math.max(1, parseInt(page)) - 1) * Math.min(200, Math.max(1, parseInt(limit)));
  const lim     = Math.min(200, Math.max(1, parseInt(limit)));

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM audit_logs WHERE ${where}`,
    params
  );

  const [rows] = await db.query(
    `SELECT al.*,
            u.full_name  AS actor_name,
            u.email      AS actor_email,
            c.company_name
     FROM audit_logs al
     LEFT JOIN users     u ON u.id = al.user_id
     LEFT JOIN companies c ON c.id = al.company_id
     WHERE ${where}
     ORDER BY al.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, lim, offset]
  );

  return { records: rows, total: Number(total), page: parseInt(page), limit: lim };
}

async function findByEntity(entity_type, entity_id, { page = 1, limit = 50 } = {}) {
  return find({ entity_type, entity_id, page, limit });
}

async function findByUser(user_id, { page = 1, limit = 50, from_date, to_date } = {}) {
  return find({ user_id, page, limit, from_date, to_date });
}

async function findByCompany(company_id, { page = 1, limit = 50, action, from_date, to_date } = {}) {
  return find({ company_id, page, limit, action, from_date, to_date });
}

async function getMetrics() {
  const [[totals]] = await db.query(`
    SELECT
      COUNT(*)                                                                  AS total_events,
      COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END)                AS events_today,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) AS events_7d,
      COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) AS events_30d,
      COUNT(DISTINCT company_id)                                               AS active_companies,
      COUNT(DISTINCT user_id)                                                  AS active_users
    FROM audit_logs
  `);

  const [topActions] = await db.query(`
    SELECT action, COUNT(*) AS count
    FROM audit_logs
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY action
    ORDER BY count DESC
    LIMIT 10
  `);

  const [mostActiveUsers] = await db.query(`
    SELECT al.user_id, u.full_name, u.email, c.company_name,
           COUNT(*) AS event_count
    FROM audit_logs al
    LEFT JOIN users     u ON u.id = al.user_id
    LEFT JOIN companies c ON c.id = al.company_id
    WHERE al.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      AND al.user_id IS NOT NULL
    GROUP BY al.user_id, u.full_name, u.email, c.company_name
    ORDER BY event_count DESC
    LIMIT 10
  `);

  const [recentEvents] = await db.query(`
    SELECT al.action, al.entity_type, al.entity_id, al.created_at,
           u.full_name AS actor_name, c.company_name
    FROM audit_logs al
    LEFT JOIN users     u ON u.id = al.user_id
    LEFT JOIN companies c ON c.id = al.company_id
    ORDER BY al.created_at DESC
    LIMIT 20
  `);

  return { totals, topActions, mostActiveUsers, recentEvents };
}

/**
 * Fetch all matching records for export (no pagination — capped at 10k rows).
 */
async function exportAll({ company_id, user_id, action, from_date, to_date } = {}) {
  const conditions = ['1=1'];
  const params     = [];

  if (company_id) { conditions.push('al.company_id = ?');   params.push(company_id); }
  if (user_id)    { conditions.push('al.user_id = ?');      params.push(user_id);    }
  if (action)     { conditions.push('al.action = ?');        params.push(action);     }
  if (from_date)  { conditions.push('al.created_at >= ?');  params.push(from_date);  }
  if (to_date)    { conditions.push('al.created_at <= ?');  params.push(to_date);    }

  const [rows] = await db.query(
    `SELECT al.id, al.company_id, al.user_id, al.action, al.entity_type, al.entity_id,
            al.before_json, al.after_json, al.ip_address, al.user_agent,
            al.details, al.created_at,
            u.full_name AS actor_name, u.email AS actor_email,
            c.company_name
     FROM audit_logs al
     LEFT JOIN users     u ON u.id = al.user_id
     LEFT JOIN companies c ON c.id = al.company_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY al.created_at DESC
     LIMIT 10000`,
    params
  );
  return rows;
}

module.exports = {
  initTable,
  insert,
  find,
  findByEntity,
  findByUser,
  findByCompany,
  getMetrics,
  exportAll,
};
