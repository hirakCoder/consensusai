#!/usr/bin/env node

/**
 * Consensus Platform - Web Server
 * Multi-LLM Debate Platform with Freemium Model
 */

// Load environment variables first
require('dotenv').config();

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const DebateEngine = require('./debate-engine');
const history = require('./history');
const config = require('./config');
const { getConfiguredClients } = require('./llm-clients');
const usage = require('./usage');
const auth = require('./auth');
const stripe = require('./stripe');
const sentry = require('./sentry');
const analytics = require('./analytics');
const contentModeration = require('./content-moderation');
const apiResilience = require('./api-resilience');

const PORT = process.env.PORT || 3000;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.webmanifest': 'application/manifest+json'
};

// Content Security Policy - controls which resources can be loaded
const cspDirectives = [
  "default-src 'self'",
  // Scripts: self, inline (needed for app), Tailwind CDN, Clerk JS
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://*.clerk.accounts.dev https://*.clerk.com",
  // Styles: self, inline (heavily used), Google Fonts
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fonts: self and Google Fonts
  "font-src 'self' https://fonts.gstatic.com",
  // Images: self, data URIs (inline SVGs), and HTTPS sources
  "img-src 'self' data: https: blob:",
  // API connections: self, AI providers, Clerk auth
  "connect-src 'self' https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://api.x.ai https://*.clerk.accounts.dev https://*.clerk.com https://api.clerk.com https://api.clerk.dev wss://*.clerk.accounts.dev wss://*.clerk.com",
  // Workers: Clerk uses web workers
  "worker-src 'self' blob:",
  // Forms can only submit to self
  "form-action 'self'",
  // Frames: Clerk uses iframes for auth
  "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com",
  // Block all plugins
  "object-src 'none'",
  // Base URI restriction
  "base-uri 'self'",
  // Upgrade HTTP to HTTPS
  "upgrade-insecure-requests"
].join('; ');

// Security headers - applied to all responses
const securityHeaders = {
  'Content-Security-Policy': cspDirectives,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};

// Cache durations by file type
const cacheDurations = {
  '.html': 'no-cache, no-store, must-revalidate', // HTML always fresh
  '.css': 'public, max-age=31536000, immutable',   // CSS cached 1 year
  '.js': 'public, max-age=31536000, immutable',    // JS cached 1 year
  '.png': 'public, max-age=31536000, immutable',   // Images cached 1 year
  '.svg': 'public, max-age=31536000, immutable',
  '.ico': 'public, max-age=31536000, immutable',
  '.json': 'public, max-age=86400',                // JSON cached 1 day
  '.xml': 'public, max-age=86400',                 // XML cached 1 day
  '.txt': 'public, max-age=86400',                 // TXT cached 1 day
  '.webmanifest': 'public, max-age=86400'
};

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

// Get user ID from request (uses Clerk auth if available, falls back to IP)
async function getUserId(req) {
  const { userId } = await auth.getUserIdForTracking(req);
  return userId;
}

// Send JSON response with security headers
function sendJson(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
    ...securityHeaders
  });
  res.end(JSON.stringify(data));
}

// Send SSE event
function sendSSE(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// Serve static files with security and cache headers
function serveStatic(res, filepath) {
  const ext = path.extname(filepath);
  const mime = mimeTypes[ext] || 'application/octet-stream';
  const cacheControl = cacheDurations[ext] || 'public, max-age=3600';

  fs.readFile(filepath, (err, data) => {
    if (err) {
      res.writeHead(404, { ...securityHeaders });
      res.end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': mime,
      'Cache-Control': cacheControl,
      ...securityHeaders
    });
    res.end(data);
  });
}

// Active SSE connections for streaming
const sseConnections = new Map();

// Create server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  // Get user ID (async - handles auth check)
  const userId = await getUserId(req);

  // ==================== Auth Routes ====================

  // Get current user info
  if (pathname === '/api/auth/me') {
    const session = await auth.verifySession(req);
    if (session) {
      const user = await auth.getUser(session.userId);
      sendJson(res, {
        authenticated: true,
        user: user
      });
    } else {
      sendJson(res, {
        authenticated: false,
        user: null
      });
    }
    return;
  }

  // Get auth config (publishable key for frontend)
  if (pathname === '/api/auth/config') {
    sendJson(res, {
      publishableKey: auth.CLERK_PUBLISHABLE_KEY,
      configured: auth.isConfigured()
    });
    return;
  }

  // ==================== Stripe Payment Routes ====================

  // Get Stripe config
  if (pathname === '/api/stripe/config') {
    sendJson(res, {
      configured: stripe.isConfigured(),
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null
    });
    return;
  }

  // Create checkout session
  if (pathname === '/api/stripe/checkout' && req.method === 'POST') {
    if (!stripe.isConfigured()) {
      sendJson(res, { error: 'Stripe is not configured' }, 400);
      return;
    }

    try {
      const session = await auth.verifySession(req);
      if (!session) {
        sendJson(res, { error: 'Authentication required' }, 401);
        return;
      }

      const user = await auth.getUser(session.userId);
      const checkoutSession = await stripe.createCheckoutSession(
        session.userId,
        user?.email || 'unknown@email.com'
      );

      sendJson(res, { url: checkoutSession.url });
    } catch (error) {
      console.error('Checkout error:', error);
      sendJson(res, { error: 'Failed to create checkout session' }, 500);
    }
    return;
  }

  // Create customer portal session (for managing subscription)
  if (pathname === '/api/stripe/portal' && req.method === 'POST') {
    if (!stripe.isConfigured()) {
      sendJson(res, { error: 'Stripe is not configured' }, 400);
      return;
    }

    try {
      const session = await auth.verifySession(req);
      if (!session) {
        sendJson(res, { error: 'Authentication required' }, 401);
        return;
      }

      const userStats = usage.getUserStats(session.userId);
      if (!userStats.stripeCustomerId) {
        sendJson(res, { error: 'No subscription found' }, 400);
        return;
      }

      const portalSession = await stripe.createPortalSession(userStats.stripeCustomerId);
      sendJson(res, { url: portalSession.url });
    } catch (error) {
      console.error('Portal error:', error);
      sendJson(res, { error: 'Failed to create portal session' }, 500);
    }
    return;
  }

  // Stripe webhook handler
  if (pathname === '/api/stripe/webhook' && req.method === 'POST') {
    if (!stripe.isConfigured()) {
      res.writeHead(400);
      res.end('Stripe not configured');
      return;
    }

    try {
      // Get raw body for signature verification
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const rawBody = Buffer.concat(chunks);

      const signature = req.headers['stripe-signature'];
      const event = stripe.constructWebhookEvent(rawBody, signature);
      const result = stripe.processWebhookEvent(event);

      console.log('[Stripe Webhook]', result.action, result.userId || result.customerId);

      // Handle the event
      switch (result.action) {
        case 'SUBSCRIPTION_CREATED':
          // Upgrade user to pro
          if (result.userId) {
            // Update in local usage tracking
            usage.setUserTier(result.userId, 'pro');
            usage.setStripeCustomerId(result.userId, result.customerId);
            // Also update in Clerk if authenticated user
            await auth.updateUserTier(result.userId, 'pro');
            analytics.trackCheckoutCompleted(result.userId, {
              plan: 'pro',
              amount: 1900, // $19.00 in cents
              currency: 'usd',
            });
            console.log(`[Stripe] User ${result.userId} upgraded to PRO`);
          }
          break;

        case 'SUBSCRIPTION_CANCELLED':
          // Downgrade user to free
          if (result.userId) {
            usage.setUserTier(result.userId, 'free');
            // Also update in Clerk
            await auth.updateUserTier(result.userId, 'free');
            console.log(`[Stripe] User ${result.userId} downgraded to FREE`);
          }
          break;

        case 'PAYMENT_FAILED':
          console.log(`[Stripe] Payment failed for customer ${result.customerId}`);
          break;
      }

      res.writeHead(200);
      res.end(JSON.stringify({ received: true }));
    } catch (error) {
      console.error('Webhook error:', error);
      res.writeHead(400);
      res.end(`Webhook Error: ${error.message}`);
    }
    return;
  }

  // ==================== API Routes ====================

  // Get config
  if (pathname === '/api/config') {
    const clients = getConfiguredClients();
    const currentTier = config.modelTiers[config.activeTier];
    const userStats = usage.getUserStats(userId);
    const globalStats = usage.getGlobalStats();
    const session = await auth.verifySession(req);

    sendJson(res, {
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
    return;
  }

  // Get user stats
  if (pathname === '/api/user/stats') {
    const stats = usage.getUserStats(userId);
    sendJson(res, stats);
    return;
  }

  // Get API health status
  if (pathname === '/api/health') {
    const health = apiResilience.getHealthStatus();
    const clients = getConfiguredClients();
    sendJson(res, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      apis: clients.map(c => ({
        id: c.id,
        name: c.name,
        configured: true,
        health: health[c.id] || { state: 'unknown', healthy: true }
      }))
    });
    return;
  }

  // Get/Set tier
  if (pathname === '/api/tier') {
    if (req.method === 'GET') {
      const userStats = usage.getUserStats(userId);
      sendJson(res, {
        activeTier: config.activeTier,
        canUsePremium: usage.canUsePremiumTier(userId),
        userTier: userStats.tier,
        tiers: Object.keys(config.modelTiers).map(key => ({
          id: key,
          name: config.modelTiers[key].name,
          description: config.modelTiers[key].description,
          models: Object.entries(config.modelTiers[key].models).map(([llm, m]) => ({
            llm,
            model: m.model
          })),
          requiresPro: key === 'premium'
        }))
      });
      return;
    }

    if (req.method === 'POST') {
      const body = await parseBody(req);
      const { tier } = body;

      if (tier && config.modelTiers[tier]) {
        // Check if user can use premium tier
        if (tier === 'premium' && !usage.canUsePremiumTier(userId)) {
          sendJson(res, {
            error: 'Premium tier requires Pro subscription',
            upgradeRequired: true
          }, 403);
          return;
        }
        config.activeTier = tier;
        sendJson(res, { success: true, activeTier: config.activeTier });
      } else {
        sendJson(res, { error: 'Invalid tier' }, 400);
      }
      return;
    }
  }

  // Estimate cost
  if (pathname === '/api/estimate') {
    const engine = new DebateEngine();
    const estimate = engine.estimateCost();
    sendJson(res, estimate);
    return;
  }

  // History
  if (pathname === '/api/history') {
    const decisions = history.getAllDecisions();
    sendJson(res, decisions.slice(0, 20));
    return;
  }

  // SSE endpoint for real-time debate streaming
  if (pathname === '/api/debate/stream') {
    const debateId = parsedUrl.query.id;
    if (!debateId) {
      sendJson(res, { error: 'Debate ID required' }, 400);
      return;
    }

    // Set up SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // Store connection
    sseConnections.set(debateId, res);

    // Send initial connection event
    sendSSE(res, 'connected', { debateId, message: 'Connected to debate stream' });

    // Clean up on close
    req.on('close', () => {
      sseConnections.delete(debateId);
    });

    return;
  }

  // Start debate (with usage limits)
  if (pathname === '/api/debate' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const { question, context, tier, debateId: clientDebateId, selectedAIs, personas } = body;

      if (!question) {
        sendJson(res, { error: 'Question is required' }, 400);
        return;
      }

      // Content moderation check
      const moderationResult = contentModeration.moderateQuery(question);
      if (moderationResult.result === contentModeration.MODERATION_RESULT.BLOCKED) {
        console.log(`[Content Moderation] Blocked query from user ${userId}: ${moderationResult.reason}`);
        sendJson(res, {
          error: moderationResult.message,
          blocked: true,
          reason: moderationResult.reason
        }, 400);
        return;
      }

      // Use sanitized query
      const sanitizedQuestion = moderationResult.sanitizedQuery || question;

      // Log warning for controversial topics (but allow to proceed)
      if (moderationResult.result === contentModeration.MODERATION_RESULT.WARNING) {
        console.log(`[Content Moderation] Warning for user ${userId}: ${moderationResult.topics?.join(', ')}`);
      }

      // Validate selectedAIs (minimum 2, maximum 4)
      const validAIs = ['openai', 'gemini', 'claude', 'grok'];
      let activeAIs = selectedAIs && Array.isArray(selectedAIs)
        ? selectedAIs.filter(ai => validAIs.includes(ai))
        : validAIs;

      if (activeAIs.length < 2) {
        activeAIs = validAIs; // Fallback to all 4 if selection is invalid
      }

      // Check usage limits
      const canProceed = usage.canDebate(userId);
      if (!canProceed.allowed) {
        sendJson(res, {
          error: canProceed.message,
          limitReached: true,
          remaining: 0,
          resetAt: canProceed.resetAt,
          upgradeRequired: true
        }, 429);
        return;
      }

      // Check tier permissions
      let effectiveTier = tier || 'budget';
      if (effectiveTier === 'premium' && !usage.canUsePremiumTier(userId)) {
        effectiveTier = 'budget'; // Fallback to budget for free users
      }

      // Set tier
      if (config.modelTiers[effectiveTier]) {
        config.activeTier = effectiveTier;
      }

      // Use client-provided debateId for SSE connection, or generate one
      const debateId = clientDebateId || Date.now().toString();
      const engine = new DebateEngine({
        selectedAIs: activeAIs,
        personas: personas || {},
        devilAdvocate: body.devilAdvocate || false,
        devilAdvocateAI: body.devilAdvocateAI || null
      });
      const startTime = Date.now();

      // Track debate started
      analytics.trackDebateStarted(userId, {
        question: sanitizedQuestion,
        context,
        tier: effectiveTier,
        devilAdvocate: body.devilAdvocate || false,
      });

      // Get SSE connection if client connected before making POST request
      const sseRes = sseConnections.get(debateId);

      // Run debate with progress updates - send specific events via SSE
      const result = await engine.run(sanitizedQuestion, context, (progress) => {
        if (sseRes) {
          // Send the specific event type from debate engine
          const eventType = progress.event || 'progress';
          sendSSE(sseRes, eventType, progress);
        }
      });

      // Add metadata to result
      result.tier = config.activeTier;
      result.debateId = debateId;

      // Check if we should charge the user based on success rate
      // Only charge if at least 50% of LLMs succeeded (2 out of 4)
      const llmStatus = result.llmStatus || { successful: 4, total: 4, successRate: 100 };
      const shouldChargeCredit = llmStatus.successRate >= 50;

      let usageStats;
      if (shouldChargeCredit) {
        // Record usage - full credit
        usageStats = usage.recordDebate(userId, {
          question: sanitizedQuestion.substring(0, 100),
          tier: effectiveTier,
          consensus: result.finalConsensus?.reached
        });
      } else {
        // Don't charge - too many failures
        console.log(`[Usage] Not charging user ${userId} - only ${llmStatus.successful}/${llmStatus.total} LLMs succeeded`);
        usageStats = usage.getUserStats(userId);
        usageStats.creditCharged = false;
        usageStats.reason = `Only ${llmStatus.successful}/${llmStatus.total} AI models responded. No credit charged.`;
      }

      result.usage = usageStats;
      result.creditCharged = shouldChargeCredit;

      // Track debate completed
      analytics.trackDebateCompleted(userId, {
        duration: Date.now() - startTime,
        consensusReached: result.finalConsensus?.reached || false,
        consensusType: result.finalConsensus?.type,
        modelCount: result.responses?.length || 4,
        tier: effectiveTier,
        totalTokens: result.costEstimate?.totalTokens,
      });

      // Generate shareId for the share URL (same format as reporter.js)
      const timestamp = new Date().toISOString().split('T')[0];
      const slug = question
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .substring(0, 50);
      result.shareId = `${timestamp}-${slug}`;

      // Save report
      const { saveToJson, saveToMarkdown } = require('./reporter');
      try {
        saveToJson(result);
        saveToMarkdown(result);
      } catch (saveError) {
        console.error('Error saving report:', saveError.message);
        // Continue even if saving fails
      }

      // Send completion via SSE if connected
      if (sseRes) {
        sendSSE(sseRes, 'complete', result);
        sseRes.end();
        sseConnections.delete(debateId);
      }

      sendJson(res, result);
    } catch (error) {
      console.error('Debate API error:', error);
      sentry.captureException(error, {
        tags: { endpoint: 'debate' },
        extra: { question: req.body?.question }
      });
      sendJson(res, { error: error.message }, 500);
    }
    return;
  }

  // Search history
  if (pathname === '/api/search' && req.method === 'GET') {
    const keyword = parsedUrl.query.q || '';
    const results = history.searchDecisions(keyword);
    sendJson(res, results);
    return;
  }

  // Get specific debate by filename (for sharing)
  if (pathname.startsWith('/api/debate/') && req.method === 'GET') {
    let filename = pathname.replace('/api/debate/', '');
    if (!filename || filename === 'stream') {
      sendJson(res, { error: 'Filename required' }, 400);
      return;
    }
    // Add .json extension if not present
    if (!filename.endsWith('.json')) {
      filename = filename + '.json';
    }
    const debate = history.getDecision(filename);
    if (!debate) {
      sendJson(res, { error: 'Debate not found' }, 404);
      return;
    }
    sendJson(res, debate);
    return;
  }

  // ==================== Share Page Route ====================
  // Serve share.html for /share/:shareId URLs
  if (pathname.startsWith('/share/')) {
    serveStatic(res, path.join(__dirname, 'public', 'share.html'));
    return;
  }

  // ==================== Static Files ====================
  let filepath = pathname === '/' ? '/index.html' : pathname;
  filepath = path.join(__dirname, 'public', filepath);

  if (fs.existsSync(filepath) && fs.statSync(filepath).isFile()) {
    serveStatic(res, filepath);
  } else {
    // Check if it's a file request (has extension) or a route request
    const hasExtension = path.extname(pathname).length > 0;
    if (hasExtension) {
      // File with extension not found -> 404
      const notFoundPath = path.join(__dirname, 'public', '404.html');
      if (fs.existsSync(notFoundPath)) {
        res.writeHead(404, {
          'Content-Type': 'text/html',
          ...securityHeaders
        });
        fs.createReadStream(notFoundPath).pipe(res);
      } else {
        res.writeHead(404, { ...securityHeaders });
        res.end('Not found');
      }
    } else {
      // SPA fallback for routes without extension
      serveStatic(res, path.join(__dirname, 'public', 'index.html'));
    }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  const stats = usage.getGlobalStats();
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🧠 Consensus Platform                                       ║
║   Multi-LLM Decision Intelligence                             ║
║                                                               ║
║   Server running at: http://0.0.0.0:${PORT}                     ║
║   Active Tier: ${config.activeTier.toUpperCase().padEnd(44)}║
║   Free Limit: ${usage.FREE_DAILY_LIMIT} debates/day                                  ║
║   Total Debates: ${String(stats.totalDebates).padEnd(41)}║
║                                                               ║
║   Press Ctrl+C to stop                                        ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught Exception:', error);
  sentry.captureException(error, { tags: { type: 'uncaughtException' } });
  sentry.flush().then(() => process.exit(1));
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
  sentry.captureException(reason, { tags: { type: 'unhandledRejection' } });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Shutdown] Received SIGTERM, closing server...');
  await Promise.all([
    sentry.flush(),
    analytics.flush(),
  ]);
  server.close(() => {
    console.log('[Shutdown] Server closed');
    process.exit(0);
  });
});
