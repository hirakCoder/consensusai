/**
 * Vercel Serverless Function Entry Point
 * Wraps the existing server logic for serverless deployment
 */

require('dotenv').config();

const url = require('url');
const DebateEngine = require('../debate-engine');
const history = require('../history');
const config = require('../config');
const { getConfiguredClients } = require('../llm-clients');
const usage = require('../usage');
const auth = require('../auth');
const stripe = require('../stripe');
const sentry = require('../sentry');
const analytics = require('../analytics');

// Parse JSON body
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

// Get user ID from request
async function getUserId(req) {
  const { userId } = await auth.getUserIdForTracking(req);
  return userId;
}

// Send JSON response
function sendJson(res, data, status = 200) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.statusCode = status;
  res.end(JSON.stringify(data));
}

// Main handler
module.exports = async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    const userId = await getUserId(req);

    // ==================== Auth Routes ====================
    if (pathname === '/api/auth/me') {
      const session = await auth.verifySession(req);
      if (session) {
        const user = await auth.getUser(session.userId);
        return sendJson(res, { authenticated: true, user });
      }
      return sendJson(res, { authenticated: false, user: null });
    }

    if (pathname === '/api/auth/config') {
      return sendJson(res, {
        publishableKey: auth.CLERK_PUBLISHABLE_KEY,
        configured: auth.isConfigured()
      });
    }

    // ==================== Stripe Routes ====================
    if (pathname === '/api/stripe/config') {
      return sendJson(res, {
        configured: stripe.isConfigured(),
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null
      });
    }

    if (pathname === '/api/stripe/checkout' && req.method === 'POST') {
      if (!stripe.isConfigured()) {
        return sendJson(res, { error: 'Stripe is not configured' }, 400);
      }
      const session = await auth.verifySession(req);
      if (!session) {
        return sendJson(res, { error: 'Authentication required' }, 401);
      }
      const user = await auth.getUser(session.userId);
      const checkoutSession = await stripe.createCheckoutSession(
        session.userId,
        user?.email || 'unknown@email.com'
      );
      return sendJson(res, { url: checkoutSession.url });
    }

    if (pathname === '/api/stripe/webhook' && req.method === 'POST') {
      if (!stripe.isConfigured()) {
        res.statusCode = 400;
        res.end('Stripe not configured');
        return;
      }
      // Handle webhook - simplified for serverless
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const rawBody = Buffer.concat(chunks);
      const signature = req.headers['stripe-signature'];
      const event = stripe.constructWebhookEvent(rawBody, signature);
      const result = stripe.processWebhookEvent(event);

      if (result.action === 'SUBSCRIPTION_CREATED' && result.userId) {
        usage.setUserTier(result.userId, 'pro');
        usage.setStripeCustomerId(result.userId, result.customerId);
      } else if (result.action === 'SUBSCRIPTION_CANCELLED' && result.userId) {
        usage.setUserTier(result.userId, 'free');
      }

      res.statusCode = 200;
      res.end(JSON.stringify({ received: true }));
      return;
    }

    // ==================== Config Routes ====================
    if (pathname === '/api/config') {
      const clients = getConfiguredClients();
      const currentTier = config.modelTiers[config.activeTier];
      const userStats = usage.getUserStats(userId);
      const globalStats = usage.getGlobalStats();
      const session = await auth.verifySession(req);

      return sendJson(res, {
        llms: clients.map(c => {
          const tierModel = currentTier.models[c.id];
          return {
            id: c.id,
            name: c.name,
            model: tierModel?.model || 'unknown'
          };
        }),
        maxRounds: config.debate.maxRounds,
        configured: clients.length > 0,
        activeTier: config.activeTier,
        tiers: {
          budget: {
            name: config.modelTiers.budget.name,
            description: config.modelTiers.budget.description
          },
          premium: {
            name: config.modelTiers.premium.name,
            description: config.modelTiers.premium.description
          }
        },
        user: userStats,
        stats: globalStats,
        auth: {
          configured: auth.isConfigured(),
          authenticated: !!session,
          publishableKey: auth.CLERK_PUBLISHABLE_KEY
        }
      });
    }

    if (pathname === '/api/user/stats') {
      const stats = usage.getUserStats(userId);
      return sendJson(res, stats);
    }

    if (pathname === '/api/tier') {
      if (req.method === 'GET') {
        const userStats = usage.getUserStats(userId);
        return sendJson(res, {
          activeTier: config.activeTier,
          canUsePremium: usage.canUsePremiumTier(userId),
          userTier: userStats.tier,
          tiers: Object.keys(config.modelTiers).map(key => ({
            id: key,
            name: config.modelTiers[key].name,
            description: config.modelTiers[key].description,
            requiresPro: key === 'premium'
          }))
        });
      }
      if (req.method === 'POST') {
        const body = await parseBody(req);
        if (body.tier && config.modelTiers[body.tier]) {
          if (body.tier === 'premium' && !usage.canUsePremiumTier(userId)) {
            return sendJson(res, { error: 'Premium tier requires Pro subscription', upgradeRequired: true }, 403);
          }
          config.activeTier = body.tier;
          return sendJson(res, { success: true, activeTier: config.activeTier });
        }
        return sendJson(res, { error: 'Invalid tier' }, 400);
      }
    }

    if (pathname === '/api/estimate') {
      const engine = new DebateEngine();
      const estimate = engine.estimateCost();
      return sendJson(res, estimate);
    }

    if (pathname === '/api/history') {
      const decisions = history.getAllDecisions();
      return sendJson(res, decisions.slice(0, 20));
    }

    // ==================== Debate Routes ====================
    if (pathname === '/api/debate' && req.method === 'POST') {
      const body = await parseBody(req);
      const { question, context, tier, selectedAIs, personas } = body;

      if (!question) {
        return sendJson(res, { error: 'Question is required' }, 400);
      }

      const validAIs = ['openai', 'gemini', 'claude', 'grok'];
      let activeAIs = selectedAIs && Array.isArray(selectedAIs)
        ? selectedAIs.filter(ai => validAIs.includes(ai))
        : validAIs;

      if (activeAIs.length < 2) activeAIs = validAIs;

      const canProceed = usage.canDebate(userId);
      if (!canProceed.allowed) {
        return sendJson(res, {
          error: canProceed.message,
          limitReached: true,
          remaining: 0,
          resetAt: canProceed.resetAt,
          upgradeRequired: true
        }, 429);
      }

      let effectiveTier = tier || 'budget';
      if (effectiveTier === 'premium' && !usage.canUsePremiumTier(userId)) {
        effectiveTier = 'budget';
      }
      if (config.modelTiers[effectiveTier]) {
        config.activeTier = effectiveTier;
      }

      const debateId = Date.now().toString();
      const engine = new DebateEngine({ selectedAIs: activeAIs, personas: personas || {} });
      const startTime = Date.now();

      analytics.trackDebateStarted(userId, { question, context, tier: effectiveTier });

      const result = await engine.run(question, context);
      result.tier = config.activeTier;
      result.debateId = debateId;

      const usageStats = usage.recordDebate(userId, {
        question: question.substring(0, 100),
        tier: effectiveTier,
        consensus: result.finalConsensus?.reached
      });
      result.usage = usageStats;

      analytics.trackDebateCompleted(userId, {
        duration: Date.now() - startTime,
        consensusReached: result.finalConsensus?.reached || false,
        modelCount: result.responses?.length || 4,
        tier: effectiveTier
      });

      const timestamp = new Date().toISOString().split('T')[0];
      const slug = question.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50);
      result.shareId = `${timestamp}-${slug}`;

      return sendJson(res, result);
    }

    if (pathname.startsWith('/api/debate/') && req.method === 'GET') {
      let filename = pathname.replace('/api/debate/', '');
      if (!filename) {
        return sendJson(res, { error: 'Filename required' }, 400);
      }
      if (!filename.endsWith('.json')) {
        filename = filename + '.json';
      }
      const debate = history.getDecision(filename);
      if (!debate) {
        return sendJson(res, { error: 'Debate not found' }, 404);
      }
      return sendJson(res, debate);
    }

    // Default: 404
    return sendJson(res, { error: 'Not found' }, 404);

  } catch (error) {
    console.error('API error:', error);
    sentry.captureException(error);
    return sendJson(res, { error: error.message }, 500);
  }
};
