'use strict';

const { classify } = require('../classifier');
const reviewStore  = require('./reviewStore');

const CONFIDENCE_AUTO_APPROVE = 95;  // >= 95 → auto-approved, stored immediately
const CONFIDENCE_WARNING      = 80;  // 80–94 → pending_warning (low risk, needs sign-off)
                                     // < 80  → pending_review (human decision required)

// ── Learning cache ─────────────────────────────────────────────────────────────
// Holds approved classifications in memory so every call doesn't hit the DB.
// Refreshed every 5 minutes on the next classify request.

let _cache    = [];
let _cacheTs  = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function _refreshCache() {
  try {
    _cache   = await reviewStore.getApprovedReviews();
    _cacheTs = Date.now();
  } catch {
    // DB unavailable — keep stale cache rather than breaking classification
  }
}

// ── Similarity ────────────────────────────────────────────────────────────────

function _tokens(text) {
  return new Set(
    (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)
  );
}

// Sørensen–Dice coefficient over token sets
function _dice(a, b) {
  const setA = _tokens(a);
  const setB = _tokens(b);
  if (setA.size + setB.size === 0) return 0;
  let common = 0;
  for (const t of setA) { if (setB.has(t)) common++; }
  return (2 * common) / (setA.size + setB.size);
}

// Find the best approved review for this description (threshold: 0.75 Dice)
function _findLearned(description) {
  let best = null;
  for (const review of _cache) {
    const sim = _dice(description, review.description);
    if (sim >= 0.75 && (!best || sim > best.similarity)) {
      best = { hsCode: review.approved_hs, similarity: sim };
    }
  }
  return best;
}

// Inject or boost a learned HS code inside the predictions array
function _applyLearning(predictions, learned) {
  if (!learned) return predictions;

  const result = predictions.map(p => {
    if (p.hsCode === learned.hsCode) {
      return {
        ...p,
        confidence:   Math.min(99, p.confidence + Math.round(learned.similarity * 20)),
        learnedBoost: true,
      };
    }
    return p;
  });

  if (!result.some(p => p.hsCode === learned.hsCode)) {
    result.push({
      hsCode:       learned.hsCode,
      description:  '(learned from approved review)',
      confidence:   Math.round(learned.similarity * 90),
      learnedBoost: true,
    });
  }

  return result.sort((a, b) => b.confidence - a.confidence);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Classify a description, apply learning, determine workflow tier,
 * persist to classification_reviews, and return the full outcome.
 *
 * @param {string} description
 * @returns {Promise<object>}
 */
async function reviewClassification(description) {
  if (Date.now() - _cacheTs > CACHE_TTL) await _refreshCache();

  const raw        = classify({ description });
  const learned    = _findLearned(description);
  const predictions = _applyLearning(raw, learned);

  const top        = predictions[0] || {};
  const suggestedHs = top.hsCode   || null;
  const confidence  = top.confidence || 0;

  let status, tier, autoApprovedHs;

  if (confidence >= CONFIDENCE_AUTO_APPROVE) {
    status         = 'auto_approved';
    tier           = 'auto';
    autoApprovedHs = suggestedHs;
  } else if (confidence >= CONFIDENCE_WARNING) {
    status = 'pending_warning';
    tier   = 'warning';
  } else {
    status = 'pending_review';
    tier   = 'review_required';
  }

  let id = null;
  try {
    id = await reviewStore.insertReview({
      description,
      suggestedHs,
      confidence,
      allPredictions: predictions.slice(0, 5),
      status,
      approvedHs: autoApprovedHs || null,
    });
  } catch (err) {
    console.warn('[reviewWorkflow] DB insert skipped:', err.message);
  }

  return {
    id,
    status,
    tier,
    suggestedHs,
    confidence,
    predictions:  predictions.slice(0, 5),
    learned:      learned ? { hsCode: learned.hsCode, similarity: learned.similarity } : null,
    thresholds:   { autoApprove: CONFIDENCE_AUTO_APPROVE, warning: CONFIDENCE_WARNING },
  };
}

module.exports = {
  reviewClassification,
  refreshCache: _refreshCache,
  CONFIDENCE_AUTO_APPROVE,
  CONFIDENCE_WARNING,
};
