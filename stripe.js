/**
 * Stripe Payment Integration
 * Handles checkout, subscriptions, and webhooks
 */

const Stripe = require('stripe');

// Initialize Stripe with secret key
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Configuration
const PRICES = {
  PRO_MONTHLY: process.env.STRIPE_PRICE_ID_MONTHLY, // $19/month
  PRO_YEARLY: process.env.STRIPE_PRICE_ID_YEARLY, // $190/year (2 months free)
};

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

/**
 * Check if Stripe is configured
 */
function isConfigured() {
  return !!stripe && !!process.env.STRIPE_SECRET_KEY;
}

/**
 * Create a Stripe Checkout Session
 * @param {string} userId - Clerk user ID
 * @param {string} email - User email
 * @param {string} priceId - Stripe price ID (optional, defaults to monthly)
 * @returns {Object} - Session URL and ID
 */
async function createCheckoutSession(userId, email, priceId = PRICES.PRO_MONTHLY) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  // Check if user already has a Stripe customer ID
  let customerId = null;

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer_email: customerId ? undefined : email,
    customer: customerId || undefined,
    success_url: `${APP_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/cortex.html?canceled=true`,
    metadata: {
      userId: userId,
    },
    subscription_data: {
      metadata: {
        userId: userId,
      },
    },
    allow_promotion_codes: true,
  });

  return {
    url: session.url,
    sessionId: session.id,
  };
}

/**
 * Create a Stripe Customer Portal Session
 * For managing subscriptions, updating payment methods, etc.
 * @param {string} customerId - Stripe customer ID
 * @returns {Object} - Portal URL
 */
async function createPortalSession(customerId) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${APP_URL}/cortex.html`,
  });

  return {
    url: session.url,
  };
}

/**
 * Get subscription status for a customer
 * @param {string} customerId - Stripe customer ID
 * @returns {Object} - Subscription details
 */
async function getSubscriptionStatus(customerId) {
  if (!stripe || !customerId) {
    return { active: false, tier: 'free' };
  }

  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length > 0) {
      const sub = subscriptions.data[0];
      return {
        active: true,
        tier: 'pro',
        subscriptionId: sub.id,
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      };
    }

    return { active: false, tier: 'free' };
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return { active: false, tier: 'free' };
  }
}

/**
 * Handle Stripe webhook events
 * @param {Buffer} rawBody - Raw request body
 * @param {string} signature - Stripe signature header
 * @returns {Object} - Event data
 */
function constructWebhookEvent(rawBody, signature) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('Stripe webhook secret not configured');
  }

  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
}

/**
 * Process webhook event and return action to take
 * @param {Object} event - Stripe event object
 * @returns {Object} - Action to take { action, userId, data }
 */
function processWebhookEvent(event) {
  const { type, data } = event;

  switch (type) {
    case 'checkout.session.completed': {
      const session = data.object;
      return {
        action: 'SUBSCRIPTION_CREATED',
        userId: session.metadata?.userId,
        customerId: session.customer,
        subscriptionId: session.subscription,
        email: session.customer_email,
      };
    }

    case 'customer.subscription.updated': {
      const subscription = data.object;
      const previousAttributes = data.previous_attributes || {};

      // Determine what kind of update this is
      let updateType = 'OTHER';
      if (previousAttributes.status && subscription.status === 'active') {
        updateType = 'REACTIVATED';
      } else if (subscription.cancel_at_period_end && !previousAttributes.cancel_at_period_end) {
        updateType = 'SCHEDULED_CANCEL';
      } else if (!subscription.cancel_at_period_end && previousAttributes.cancel_at_period_end) {
        updateType = 'CANCEL_REVERTED';
      } else if (previousAttributes.items) {
        updateType = 'PLAN_CHANGED';
      }

      return {
        action: 'SUBSCRIPTION_UPDATED',
        updateType,
        userId: subscription.metadata?.userId,
        customerId: subscription.customer,
        subscriptionId: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: subscription.current_period_end,
        // For proration tracking
        previousStatus: previousAttributes.status,
        priceId: subscription.items?.data?.[0]?.price?.id,
      };
    }

    case 'customer.subscription.deleted': {
      const subscription = data.object;
      return {
        action: 'SUBSCRIPTION_CANCELLED',
        userId: subscription.metadata?.userId,
        customerId: subscription.customer,
        subscriptionId: subscription.id,
      };
    }

    case 'invoice.payment_failed': {
      const invoice = data.object;
      return {
        action: 'PAYMENT_FAILED',
        customerId: invoice.customer,
        invoiceId: invoice.id,
      };
    }

    default:
      return { action: 'UNKNOWN', type };
  }
}

/**
 * Sync subscription status between Stripe and local database
 * Call this on login or periodically to catch missed webhooks
 * @param {string} userId - User ID in your system
 * @param {string} stripeCustomerId - Stripe customer ID
 * @param {string} currentTier - Current tier in your database
 * @param {Function} updateTierCallback - Callback to update tier: (userId, newTier) => Promise
 * @returns {Object} - { synced: boolean, action: string, tier: string }
 */
async function syncSubscriptionStatus(userId, stripeCustomerId, currentTier, updateTierCallback) {
  if (!stripe) {
    return { synced: false, action: 'STRIPE_NOT_CONFIGURED', tier: currentTier };
  }

  if (!stripeCustomerId) {
    // No Stripe customer ID - user should be free tier
    if (currentTier === 'pro') {
      console.log(`[Stripe Sync] User ${userId} has no Stripe ID but is pro - downgrading`);
      await updateTierCallback(userId, 'free');
      return { synced: true, action: 'DOWNGRADED_NO_CUSTOMER', tier: 'free' };
    }
    return { synced: false, action: 'NO_CUSTOMER_ID', tier: currentTier };
  }

  try {
    // Check Stripe for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      limit: 1,
    });

    const hasActiveSubscription = subscriptions.data.some(
      sub => sub.status === 'active' || sub.status === 'trialing'
    );

    const stripeTier = hasActiveSubscription ? 'pro' : 'free';

    // Check if sync is needed
    if (stripeTier !== currentTier) {
      console.log(`[Stripe Sync] User ${userId}: DB says "${currentTier}", Stripe says "${stripeTier}" - syncing`);
      await updateTierCallback(userId, stripeTier);

      return {
        synced: true,
        action: stripeTier === 'pro' ? 'UPGRADED' : 'DOWNGRADED',
        tier: stripeTier,
        subscription: hasActiveSubscription ? {
          id: subscriptions.data[0].id,
          status: subscriptions.data[0].status,
          currentPeriodEnd: new Date(subscriptions.data[0].current_period_end * 1000),
          cancelAtPeriodEnd: subscriptions.data[0].cancel_at_period_end
        } : null
      };
    }

    return {
      synced: false,
      action: 'ALREADY_IN_SYNC',
      tier: currentTier,
      subscription: hasActiveSubscription ? {
        id: subscriptions.data[0].id,
        status: subscriptions.data[0].status,
        currentPeriodEnd: new Date(subscriptions.data[0].current_period_end * 1000),
        cancelAtPeriodEnd: subscriptions.data[0].cancel_at_period_end
      } : null
    };
  } catch (error) {
    console.error('[Stripe Sync] Error:', error.message);
    return { synced: false, action: 'ERROR', error: error.message, tier: currentTier };
  }
}

module.exports = {
  isConfigured,
  createCheckoutSession,
  createPortalSession,
  getSubscriptionStatus,
  syncSubscriptionStatus,
  constructWebhookEvent,
  processWebhookEvent,
  PRICES,
};
