/**
 * PostHog Analytics
 * Tracks user events and behaviors for product analytics
 */

const { PostHog } = require('posthog-node');

// Initialize PostHog only if API key is configured
const isConfigured = !!process.env.POSTHOG_API_KEY;

let posthog = null;

if (isConfigured) {
  posthog = new PostHog(process.env.POSTHOG_API_KEY, {
    host: process.env.POSTHOG_HOST || 'https://us.i.posthog.com',
    flushAt: 20,
    flushInterval: 10000, // 10 seconds
  });

  console.log('[PostHog] Initialized');
} else {
  console.log('[PostHog] Not configured (no POSTHOG_API_KEY)');
}

/**
 * Track an event
 * @param {string} userId - User identifier
 * @param {string} event - Event name
 * @param {Object} properties - Event properties
 */
function track(userId, event, properties = {}) {
  if (posthog && isConfigured) {
    posthog.capture({
      distinctId: userId,
      event: event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      }
    });
  }

  // Always log in development for debugging
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Analytics] ${event}:`, { userId, ...properties });
  }
}

/**
 * Identify a user with properties
 * @param {string} userId - User identifier
 * @param {Object} properties - User properties
 */
function identify(userId, properties = {}) {
  if (posthog && isConfigured) {
    posthog.identify({
      distinctId: userId,
      properties: {
        ...properties,
        last_seen: new Date().toISOString(),
      }
    });
  }
}

/**
 * Alias two user IDs (e.g., anonymous to authenticated)
 * @param {string} previousId - Previous user ID
 * @param {string} userId - New user ID
 */
function alias(previousId, userId) {
  if (posthog && isConfigured) {
    posthog.alias({
      distinctId: userId,
      alias: previousId,
    });
  }
}

// ============================================
// Pre-defined Event Tracking Functions
// ============================================

/**
 * Track debate started
 */
function trackDebateStarted(userId, data) {
  track(userId, 'debate_started', {
    question_length: data.question?.length || 0,
    has_context: !!data.context,
    tier: data.tier || 'budget',
    devil_advocate: data.devilAdvocate || false,
  });
}

/**
 * Track debate completed
 */
function trackDebateCompleted(userId, data) {
  track(userId, 'debate_completed', {
    duration_ms: data.duration,
    consensus_reached: data.consensusReached,
    consensus_type: data.consensusType,
    model_count: data.modelCount || 4,
    tier: data.tier,
    total_tokens: data.totalTokens,
  });
}

/**
 * Track upgrade button clicked
 */
function trackUpgradeClicked(userId, data = {}) {
  track(userId, 'upgrade_clicked', {
    current_tier: data.currentTier || 'free',
    source: data.source || 'unknown', // e.g., 'limit_modal', 'header_button', 'tier_selector'
    debates_used_today: data.debatesUsedToday,
  });
}

/**
 * Track checkout completed (from webhook)
 */
function trackCheckoutCompleted(userId, data) {
  track(userId, 'checkout_completed', {
    plan: data.plan || 'pro',
    amount: data.amount,
    currency: data.currency || 'usd',
  });
}

/**
 * Track follow-up question asked
 */
function trackFollowupAsked(userId, data) {
  track(userId, 'followup_asked', {
    parent_debate_id: data.parentDebateId,
    followup_length: data.question?.length || 0,
  });
}

/**
 * Track share event
 */
function trackDebateShared(userId, data) {
  track(userId, 'debate_shared', {
    debate_id: data.debateId,
    share_method: data.method || 'link', // e.g., 'link', 'twitter', 'copy'
  });
}

/**
 * Track tier changed
 */
function trackTierChanged(userId, data) {
  track(userId, 'tier_changed', {
    from_tier: data.fromTier,
    to_tier: data.toTier,
  });
}

/**
 * Track page view
 */
function trackPageView(userId, data) {
  track(userId, '$pageview', {
    url: data.url,
    referrer: data.referrer,
  });
}

/**
 * Flush pending events (call before shutdown)
 */
async function flush() {
  if (posthog && isConfigured) {
    await posthog.shutdown();
  }
}

module.exports = {
  isConfigured,
  track,
  identify,
  alias,
  flush,
  // Pre-defined events
  trackDebateStarted,
  trackDebateCompleted,
  trackUpgradeClicked,
  trackCheckoutCompleted,
  trackFollowupAsked,
  trackDebateShared,
  trackTierChanged,
  trackPageView,
};
