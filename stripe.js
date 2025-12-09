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
      return {
        action: 'SUBSCRIPTION_UPDATED',
        userId: subscription.metadata?.userId,
        customerId: subscription.customer,
        subscriptionId: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
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

module.exports = {
  isConfigured,
  createCheckoutSession,
  createPortalSession,
  getSubscriptionStatus,
  constructWebhookEvent,
  processWebhookEvent,
  PRICES,
};
