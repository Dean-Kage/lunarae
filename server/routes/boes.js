const router           = require('express').Router()
const db               = require('../db')
const verify           = require('../middleware/auth')
const log              = require('../utils/logger')
const audit            = require('../middleware/audit')
const shadowRunner     = require('../customs/shadow/shadowRunner')
const { requireUsageLimit, incrementUsage } = require('../middleware/subscription')

/* ── POST /api/boes — save a generated BOE ───────────────── */
router.post('/', verify, requireUsageLimit('boes'), audit('BOE_CREATED', 'boe'), async (req, res) => {
  const { company_id, id: user_id } = req.user
  if (!company_id) return res.status(400).json({ error: 'No company associated with this account' })

  const { importer, exporter, total_duty, total_vat, total_payable, xml_data, result_json } = req.body

  try {

    const [r] = await db.query(
      `INSERT INTO boes
         (company_id, user_id, importer, exporter, total_duty, total_vat, total_payable, xml_data, result_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        company_id, user_id,
        importer   || null,
        exporter   || null,
        total_duty    != null ? parseFloat(total_duty)    : 0,
        total_vat     != null ? parseFloat(total_vat)     : 0,
        total_payable != null ? parseFloat(total_payable) : 0,
        xml_data   || null,
        result_json|| null,
      ]
    )
    console.log(`[BOE] saved id=${r.insertId} importer="${importer}" user=${user_id}`)
    log('info', 'boe_saved', { entity: 'boe', entityId: r.insertId, actorId: user_id, actorName: req.user.full_name, details: `importer="${importer}" exporter="${exporter}"` })

    res.status(201).json({ id: r.insertId })

    // Post-save background tasks — fire-and-forget, never affect user output
    setImmediate(() => {
      shadowRunner.runShadow({ boeId: r.insertId, xmlData: xml_data || null, resultJson: result_json || null })
        .catch(e => console.warn('[shadow] Silent error:', e.message))
      incrementUsage(company_id, 'boes_generated')
        .catch(e => console.warn('[usage] Increment error:', e.message))
    })
    return
  } catch (err) {
    console.error('[BOE] save error:', err.message)
    return res.status(500).json({ error: 'Could not save BOE' })
  }
})

/* ── GET /api/boes — list BOEs with search + filter ─────── */
router.get('/', verify, async (req, res) => {
  const { company_id, id: user_id, role } = req.user
  if (!company_id) return res.status(400).json({ error: 'No company associated with this account' })

  const isOwner   = role === 'company_owner' || role === 'super_admin'
  const { search, from_date, to_date, importer, exporter, page = 1, limit = 50 } = req.query

  const conditions = ['b.company_id = ?']
  const params      = [company_id]

  if (!isOwner) {
    conditions.push('b.user_id = ?')
    params.push(user_id)
  }

  if (search) {
    conditions.push('(b.importer LIKE ? OR b.exporter LIKE ?)')
    params.push(`%${search}%`, `%${search}%`)
  }
  if (importer) {
    conditions.push('b.importer LIKE ?')
    params.push(`%${importer}%`)
  }
  if (exporter) {
    conditions.push('b.exporter LIKE ?')
    params.push(`%${exporter}%`)
  }
  if (from_date) {
    conditions.push('DATE(b.created_at) >= ?')
    params.push(from_date)
  }
  if (to_date) {
    conditions.push('DATE(b.created_at) <= ?')
    params.push(to_date)
  }

  const where  = conditions.join(' AND ')
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit)

  try {
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM boes b WHERE ${where}`,
      params
    )

    const [boes] = await db.query(
      `SELECT b.id, b.importer, b.exporter,
              b.total_duty, b.total_vat, b.total_payable,
              b.status, b.created_at,
              u.full_name AS created_by
       FROM boes b JOIN users u ON u.id = b.user_id
       WHERE ${where}
       ORDER BY b.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    )

    return res.json({ boes, total, page: parseInt(page), limit: parseInt(limit) })
  } catch (err) {
    console.error('[BOE] list error:', err.message)
    return res.status(500).json({ error: 'Could not fetch BOEs' })
  }
})

/* ── GET /api/boes/:id — single BOE with full data ───────── */
router.get('/:id', verify, audit('BOE_VIEWED', 'boe'), async (req, res) => {
  const { company_id, id: user_id, role } = req.user
  const isOwner = role === 'company_owner' || role === 'super_admin'

  try {
    const [rows] = await db.query(
      `SELECT b.*, u.full_name AS created_by
       FROM boes b JOIN users u ON u.id = b.user_id
       WHERE b.id = ? AND b.company_id = ?`,
      [req.params.id, company_id]
    )
    if (!rows.length) return res.status(404).json({ error: 'BOE not found' })

    const boe = rows[0]
    if (!isOwner && boe.user_id !== user_id)
      return res.status(403).json({ error: 'Access denied' })

    return res.json({ boe })
  } catch (err) {
    return res.status(500).json({ error: 'Could not fetch BOE' })
  }
})

module.exports = router
