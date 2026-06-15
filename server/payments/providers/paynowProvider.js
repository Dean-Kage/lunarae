'use strict';

const crypto = require('crypto');
const axios  = require('axios');
const BasePaymentProvider = require('./baseProvider');

const INTEGRATION_ID  = process.env.PAYNOW_INTEGRATION_ID;
const INTEGRATION_KEY = process.env.PAYNOW_INTEGRATION_KEY;

const PAYNOW_URL = 'https://www.paynow.co.zw/interface/initiatetransaction';

// In-memory sandbox state: invoice_reference → { createdAt, amount, paid }
const _state = new Map();

class PaynowProvider extends BasePaymentProvider {
  get name() { return 'paynow'; }

  // Sandbox when no credentials are set, or PAYNOW_SANDBOX != 'false'
  get sandboxMode() {
    return !INTEGRATION_ID || process.env.PAYNOW_SANDBOX !== 'false';
  }

  _hash(orderedValues) {
    const str = orderedValues.join('') + (INTEGRATION_KEY || 'sandbox-key');
    return crypto.createHash('sha512').update(str).digest('hex').toUpperCase();
  }

  _parse(text) {
    const map = {};
    String(text).split('&').forEach(pair => {
      const eq = pair.indexOf('=');
      if (eq < 0) return;
      map[decodeURIComponent(pair.slice(0, eq))] = decodeURIComponent(pair.slice(eq + 1));
    });
    return map;
  }

  async createPayment({ amount, reference, description, returnUrl, resultUrl }) {
    if (this.sandboxMode) return this._sandboxCreate({ amount, reference });

    const fields = {
      id:             INTEGRATION_ID,
      reference,
      amount:         Number(amount).toFixed(2),
      additionalinfo: description || 'Lunarae Subscription',
      returnurl:      returnUrl,
      resulturl:      resultUrl,
      status:         'Message',
    };
    fields.hash = this._hash(Object.values(fields));

    try {
      const resp = await axios.post(PAYNOW_URL, new URLSearchParams(fields).toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000,
      });
      const data = this._parse(resp.data);

      if (data.status?.toLowerCase() !== 'ok') {
        return { success: false, error: data.error || 'Gateway rejected payment' };
      }
      return {
        success:    true,
        browserUrl: data.browserurl || null,
        pollUrl:    data.pollurl    || null,
        reference:  data.paynowreference || reference,
      };
    } catch (err) {
      console.error('[PaynowProvider] createPayment:', err.message);
      return { success: false, error: 'Payment gateway unreachable' };
    }
  }

  async pollStatus({ pollUrl, gatewayReference }) {
    const url = pollUrl || gatewayReference;
    if (!url) return { status: 'pending' };
    if (this.sandboxMode) return this._sandboxPoll(url);

    try {
      const resp = await axios.post(url, '', {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000,
      });
      const data = this._parse(resp.data);
      const s    = data.status?.toLowerCase();

      if (s === 'paid' || s === 'awaiting delivery') {
        return { status: 'paid', paynowReference: data.paynowreference };
      }
      if (s === 'cancelled' || s === 'disputed' || s === 'failed') {
        return { status: 'failed', reason: data.status };
      }
    } catch { /* network failure = still pending */ }
    return { status: 'pending' };
  }

  verifyWebhook({ body }) {
    if (this.sandboxMode) return { valid: true }; // skip hash check in sandbox
    const { hash, ...rest } = body;
    if (!hash || !INTEGRATION_KEY) return { valid: false };
    const computed = this._hash(Object.values(rest));
    return { valid: computed === String(hash).toUpperCase() };
  }

  // ── Sandbox helpers ─────────────────────────────────────────────────────────

  _sandboxCreate({ amount, reference }) {
    _state.set(reference, { createdAt: Date.now(), amount, paid: false });
    const base = process.env.APP_URL || 'http://localhost:4000';
    return {
      success:    true,
      browserUrl: `${base}/api/payments/paynow/mock-confirm/${reference}`,
      pollUrl:    `${base}/api/payments/paynow/mock-poll/${reference}`,
      reference:  `SANDBOX-${reference}`,
    };
  }

  _sandboxPoll(url) {
    const match = String(url).match(/mock-poll\/(.+?)(?:\?|$)/);
    const ref   = match ? match[1] : url;
    const entry = _state.get(ref);
    if (!entry) return { status: 'pending' };
    return entry.paid
      ? { status: 'paid', paynowReference: `SANDBOX-${ref}` }
      : { status: 'pending' };
  }

  /** Called by the mock-confirm route to simulate the user completing payment. */
  sandboxConfirm(reference) {
    const entry = _state.get(reference);
    if (!entry) return false;
    entry.paid = true;
    _state.set(reference, entry);
    return true;
  }

  /** Returns sandbox state for debugging. */
  sandboxState(reference) {
    return _state.get(reference) || null;
  }
}

module.exports = new PaynowProvider();
