/**
 * Payment Gateway Service
 *
 * Supports Paynow Zimbabwe (EcoCash, ZIPIT, Visa, Mastercard).
 * Falls back to mock mode when PAYNOW_INTEGRATION_ID is not set.
 *
 * Paynow docs: https://developers.paynow.co.zw
 *
 * Required env vars for live mode:
 *   PAYNOW_INTEGRATION_ID   — from Paynow merchant dashboard
 *   PAYNOW_INTEGRATION_KEY  — integration key / secret
 *   PAYNOW_TEST_MODE        — 'true' to use Paynow sandbox
 */

const crypto = require('crypto')
const axios  = require('axios')

const INTEGRATION_ID  = process.env.PAYNOW_INTEGRATION_ID
const INTEGRATION_KEY = process.env.PAYNOW_INTEGRATION_KEY
const TEST_MODE       = process.env.PAYNOW_TEST_MODE === 'true'
const MOCK_MODE       = !INTEGRATION_ID

/* ── In-memory mock state (dev only) ────────────────────── */
const _mock = new Map() // payment_id → { createdAt, shouldFail }

/* ── Paynow hash helper ─────────────────────────────────── */
function paynowHash(fields) {
  const str = Object.values(fields).join('') + INTEGRATION_KEY
  return crypto.createHash('sha512').update(str).digest('hex').toUpperCase()
}

/* ── Paynow response parser ─────────────────────────────── */
function parsePaynowResponse(text) {
  const map = {}
  text.split('&').forEach(pair => {
    const [k, v] = pair.split('=')
    if (k) map[decodeURIComponent(k)] = decodeURIComponent(v || '')
  })
  return map
}

/* ══════════════════════════════════════════════════════════
   initiate — start a payment
   Returns: { success, reference, instructions, redirect_url, error }
════════════════════════════════════════════════════════════ */
async function initiate({ payment_id, payment_method, amount, phone, reference, description, return_url, result_url }) {
  if (MOCK_MODE) {
    return _mockInitiate({ payment_id, payment_method, amount, phone })
  }

  const baseUrl = TEST_MODE
    ? 'https://www.paynow.co.zw/interface/remotetransaction'
    : 'https://www.paynow.co.zw/interface/remotetransaction'

  const isMobile = ['ecocash', 'zipit'].includes(payment_method)

  // Build Paynow fields
  const fields = {
    id:             INTEGRATION_ID,
    reference:      reference,
    amount:         Number(amount).toFixed(2),
    additionalinfo: description,
    returnurl:      return_url,
    resulturl:      result_url,
    status:         'Message',
  }
  if (isMobile) {
    fields.method = payment_method === 'ecocash' ? 'ecocash' : 'zipit'
    fields.phone  = (phone || '').replace(/\s+/g, '')
  }
  fields.hash = paynowHash(fields)

  try {
    const form  = new URLSearchParams(fields)
    const resp  = await axios.post(baseUrl, form.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
    })
    const data = parsePaynowResponse(resp.data)

    if (data.status?.toLowerCase() !== 'ok') {
      return { success: false, error: data.error || 'Gateway rejected payment' }
    }

    const instructions = isMobile
      ? payment_method === 'ecocash'
        ? `USSD push sent to ${phone}. Approve the payment on your phone or dial *151*2# to complete.`
        : `Bank transfer initiated to ${phone}. Confirm on your ZIPIT app.`
      : null

    return {
      success:      true,
      reference:    data.paynowreference || reference,
      poll_url:     data.pollurl || null,
      redirect_url: data.redirecturl || null,
      instructions,
    }
  } catch (err) {
    console.error('[GATEWAY] Paynow error:', err.message)
    return { success: false, error: 'Gateway unreachable — please try again' }
  }
}

/* ══════════════════════════════════════════════════════════
   checkStatus — poll a payment's current status
   Returns: { status: 'processing'|'completed'|'failed', error? }
════════════════════════════════════════════════════════════ */
async function checkStatus({ payment_id, gateway_reference, payment_method, created_at }) {
  if (MOCK_MODE) {
    return _mockCheckStatus(payment_id)
  }

  if (!gateway_reference) return { status: 'processing' }

  try {
    const resp = await axios.post(gateway_reference, '', {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000,
    })
    const data = parsePaynowResponse(resp.data)
    const s    = data.status?.toLowerCase()

    if (s === 'paid' || s === 'awaiting delivery') return { status: 'completed' }
    if (s === 'cancelled' || s === 'disputed')     return { status: 'failed', error: data.status }
    return { status: 'processing' }
  } catch (err) {
    return { status: 'processing' }
  }
}

/* ══════════════════════════════════════════════════════════
   MOCK IMPLEMENTATIONS
════════════════════════════════════════════════════════════ */
function _mockInitiate({ payment_id, payment_method, phone }) {
  const shouldFail = (phone || '').toLowerCase().includes('fail')
  _mock.set(payment_id, { createdAt: Date.now(), shouldFail })

  const INSTRUCTIONS = {
    ecocash:    `USSD push sent to ${phone}. Approve the payment on your phone or dial *151*2# to complete.`,
    zipit:      `Transfer initiated to ${phone}. Confirm the payment in your ZIPIT banking app.`,
    visa:       null,
    mastercard: null,
  }

  const redirect_url = ['visa', 'mastercard'].includes(payment_method)
    ? null  // card payments are handled inline in checkout (mock)
    : null

  return {
    success:      true,
    reference:    `MOCK-${payment_id}-${Date.now()}`,
    instructions: INSTRUCTIONS[payment_method] || null,
    redirect_url,
  }
}

function _mockCheckStatus(payment_id) {
  const entry = _mock.get(payment_id)
  if (!entry) return { status: 'processing' }

  const elapsed = Date.now() - entry.createdAt

  if (elapsed < 5000) return { status: 'processing' }

  _mock.delete(payment_id)
  if (entry.shouldFail) return { status: 'failed', error: 'Payment declined by mobile money provider' }
  return { status: 'completed' }
}

module.exports = { initiate, checkStatus, MOCK_MODE }
