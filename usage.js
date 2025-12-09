/**
 * Usage Tracking & Tier Management
 * Free tier: 3 debates/day, budget models only
 * Pro tier: 50 debates/month, all models
 * Pro+ tier: 150 debates/month, all models + priority
 * Owner tier: Shows warnings but never blocked (for testing)
 */

const fs = require('fs');
const path = require('path');

// Use /tmp in serverless (Vercel), otherwise use local data directory
const IS_SERVERLESS = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
const DATA_DIR = IS_SERVERLESS ? '/tmp' : path.join(__dirname, 'data');
const USAGE_FILE = path.join(DATA_DIR, 'usage.json');
const FREE_DAILY_LIMIT = 3;

// In-memory cache for serverless (persists within same invocation)
let memoryCache = null;

// Owner secret - set in .env to bypass limits while still showing warnings
const OWNER_SECRET = process.env.OWNER_SECRET || '';
const OWNER_IPS = (process.env.OWNER_IPS || '127.0.0.1,::1,::ffff:127.0.0.1').split(',').map(ip => ip.trim());

// Ensure data directory exists
function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    // In serverless, /tmp should already exist
    console.log('Data dir setup:', e.message);
  }
}

// Load usage data
function loadUsage() {
  // Use memory cache if available (for serverless)
  if (memoryCache) {
    return memoryCache;
  }

  ensureDataDir();
  try {
    if (fs.existsSync(USAGE_FILE)) {
      const data = JSON.parse(fs.readFileSync(USAGE_FILE, 'utf8'));
      memoryCache = data;
      return data;
    }
  } catch (e) {
    console.log('Usage load (using defaults):', e.message);
  }
  const defaultData = { users: {}, totalDebates: 0 };
  memoryCache = defaultData;
  return defaultData;
}

// Save usage data
function saveUsage(data) {
  memoryCache = data;
  try {
    ensureDataDir();
    fs.writeFileSync(USAGE_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    // In serverless, file write may fail but memory cache is updated
    console.log('Usage save (in-memory only):', e.message);
  }
}

// Get today's date key
function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

// Check if user is owner (for testing bypass)
function isOwner(userId) {
  // Check if userId matches owner IP patterns
  if (userId && userId.startsWith('anon_')) {
    const ip = userId.replace('anon_', '');

    // Check various localhost patterns
    const isLocalhost =
      ip === '127.0.0.1' ||
      ip === '::1' ||
      ip === '::ffff:127.0.0.1' ||
      ip.includes('127.0.0.1') ||
      ip.includes('::1') ||
      ip === 'localhost' ||
      OWNER_IPS.some(ownerIp => ip.includes(ownerIp) || ownerIp.includes(ip));

    if (isLocalhost) {
      console.log(`[Owner] Localhost detected: ${userId}`);
      return true;
    }
  }

  // Check user's tier
  try {
    const usage = loadUsage();
    const user = usage.users[userId];
    if (user && user.tier === 'owner') {
      return true;
    }
  } catch (e) {
    // Ignore errors
  }

  return false;
}

// Set user as owner (manual function for setup)
function setOwner(userId) {
  const usage = loadUsage();
  if (!usage.users[userId]) {
    getUser(userId);
  }
  usage.users[userId].tier = 'owner';
  usage.users[userId].ownerSince = new Date().toISOString();
  saveUsage(usage);
  console.log(`✓ User ${userId} set as owner`);
  return usage.users[userId];
}

// Get or create user (by IP or session)
function getUser(userId) {
  const usage = loadUsage();
  if (!usage.users[userId]) {
    usage.users[userId] = {
      tier: 'free',
      createdAt: new Date().toISOString(),
      dailyUsage: {},
      totalDebates: 0
    };
    saveUsage(usage);
  }
  return usage.users[userId];
}

// Check if user can make a debate
function canDebate(userId) {
  const user = getUser(userId);
  const today = getTodayKey();
  const ownerBypass = isOwner(userId);

  console.log(`[canDebate] userId: ${userId}, tier: ${user.tier}, ownerBypass: ${ownerBypass}`);

  // Pro users have unlimited
  if (user.tier === 'pro' || user.tier === 'enterprise') {
    return { allowed: true, remaining: 'unlimited' };
  }

  // Owner tier - always allowed but show warnings like free tier
  if (ownerBypass || user.tier === 'owner') {
    console.log(`[canDebate] Owner bypass ACTIVE for ${userId}`);
    const todayCount = user.dailyUsage[today] || 0;
    const remaining = Math.max(0, FREE_DAILY_LIMIT - todayCount);
    return {
      allowed: true,
      remaining: remaining,
      ownerBypass: true,
      message: remaining <= 0 ? '(Owner bypass active - limit would be reached)' : null
    };
  }

  // Free tier - check daily limit
  const todayCount = user.dailyUsage[today] || 0;
  const remaining = FREE_DAILY_LIMIT - todayCount;

  if (todayCount >= FREE_DAILY_LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      message: `Daily limit reached (${FREE_DAILY_LIMIT}/day). Upgrade to Pro for unlimited debates.`,
      resetAt: getNextResetTime()
    };
  }

  return { allowed: true, remaining };
}

// Get next reset time (midnight UTC)
function getNextResetTime() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}

// Record a debate
function recordDebate(userId, debateData = {}) {
  const usage = loadUsage();
  const user = getUser(userId);
  const today = getTodayKey();

  // Update daily usage
  if (!user.dailyUsage[today]) {
    user.dailyUsage[today] = 0;
  }
  user.dailyUsage[today]++;
  user.totalDebates++;

  // Update global stats
  usage.totalDebates++;
  usage.users[userId] = user;

  saveUsage(usage);

  return {
    todayCount: user.dailyUsage[today],
    remaining: user.tier === 'free' ? FREE_DAILY_LIMIT - user.dailyUsage[today] : 'unlimited',
    totalDebates: user.totalDebates
  };
}

// Get user stats
function getUserStats(userId) {
  const user = getUser(userId);
  const today = getTodayKey();
  const todayCount = user.dailyUsage[today] || 0;

  return {
    tier: user.tier,
    todayCount,
    remaining: user.tier === 'free' ? FREE_DAILY_LIMIT - todayCount : 'unlimited',
    totalDebates: user.totalDebates,
    dailyLimit: user.tier === 'free' ? FREE_DAILY_LIMIT : 'unlimited'
  };
}

// Check if user can use premium tier
function canUsePremiumTier(userId) {
  const user = getUser(userId);
  return user.tier === 'pro' || user.tier === 'enterprise';
}

// Upgrade user (placeholder - would integrate with Stripe)
function upgradeUser(userId, tier) {
  const usage = loadUsage();
  if (!usage.users[userId]) {
    getUser(userId);
  }
  usage.users[userId].tier = tier;
  usage.users[userId].upgradedAt = new Date().toISOString();
  saveUsage(usage);
  return usage.users[userId];
}

// Set user tier (used by Stripe webhook)
function setUserTier(userId, tier) {
  const usage = loadUsage();
  if (!usage.users[userId]) {
    getUser(userId);
  }
  usage.users[userId].tier = tier;
  usage.users[userId].tierUpdatedAt = new Date().toISOString();
  saveUsage(usage);
  console.log(`[Usage] User ${userId} tier set to: ${tier}`);
  return usage.users[userId];
}

// Set Stripe customer ID for user
function setStripeCustomerId(userId, customerId) {
  const usage = loadUsage();
  if (!usage.users[userId]) {
    getUser(userId);
  }
  usage.users[userId].stripeCustomerId = customerId;
  saveUsage(usage);
  console.log(`[Usage] User ${userId} linked to Stripe customer: ${customerId}`);
  return usage.users[userId];
}

// Get user's Stripe customer ID
function getStripeCustomerId(userId) {
  const user = getUser(userId);
  return user.stripeCustomerId || null;
}

// Get global stats
function getGlobalStats() {
  const usage = loadUsage();
  return {
    totalDebates: usage.totalDebates || 0,
    totalUsers: Object.keys(usage.users).length
  };
}

module.exports = {
  canDebate,
  recordDebate,
  getUserStats,
  canUsePremiumTier,
  upgradeUser,
  getGlobalStats,
  isOwner,
  setOwner,
  setUserTier,
  setStripeCustomerId,
  getStripeCustomerId,
  FREE_DAILY_LIMIT
};
