'use strict';

/**
 * Abstract base class for all payment providers.
 * Future providers (EcoCash, InnBucks, Visa, Mastercard) must implement this interface.
 */
class BasePaymentProvider {
  get name() {
    throw new Error(`${this.constructor.name} must implement 'name'`);
  }

  get sandboxMode() {
    return true;
  }

  /**
   * Create a hosted payment and return the redirect URL.
   * @param {{ amount: number, reference: string, description: string, returnUrl: string, resultUrl: string }} params
   * @returns {Promise<{ success: boolean, browserUrl?: string, pollUrl?: string, reference?: string, error?: string }>}
   */
  async createPayment(params) {
    throw new Error(`${this.constructor.name} must implement createPayment()`);
  }

  /**
   * Poll a payment for its current status.
   * @param {{ pollUrl?: string, gatewayReference?: string }} params
   * @returns {Promise<{ status: 'pending'|'paid'|'failed', paynowReference?: string, reason?: string }>}
   */
  async pollStatus(params) {
    throw new Error(`${this.constructor.name} must implement pollStatus()`);
  }

  /**
   * Verify a webhook payload's authenticity.
   * @param {{ body: object }} params
   * @returns {{ valid: boolean }}
   */
  verifyWebhook(params) {
    throw new Error(`${this.constructor.name} must implement verifyWebhook()`);
  }
}

module.exports = BasePaymentProvider;
