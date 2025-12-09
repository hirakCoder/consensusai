/**
 * Authentication Module - Clerk Integration
 * Handles user authentication and subscription management
 */

const { createClerkClient, verifyToken } = require('@clerk/clerk-sdk-node');

// Initialize Clerk (keys loaded from environment)
const CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY || '';
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || '';

// Create Clerk client for backend operations
const clerkClient = CLERK_SECRET_KEY ? createClerkClient({ secretKey: CLERK_SECRET_KEY }) : null;

/**
 * Check if Clerk is configured
 */
function isConfigured() {
  return !!(CLERK_PUBLISHABLE_KEY && CLERK_SECRET_KEY);
}

/**
 * Extract session token from request
 */
function getTokenFromRequest(req) {
  // Check Authorization header first (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check for __session cookie (Clerk's default)
  const cookies = parseCookies(req.headers.cookie || '');
  return cookies['__session'] || cookies['__clerk_db_jwt'] || null;
}

/**
 * Parse cookies from header string
 */
function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name) {
      cookies[name] = rest.join('=');
    }
  });
  return cookies;
}

/**
 * Verify and decode session token
 * Returns user info if valid, null otherwise
 */
async function verifySession(req) {
  if (!isConfigured()) {
    return null;
  }

  const token = getTokenFromRequest(req);
  if (!token) {
    return null;
  }

  try {
    const payload = await verifyToken(token, {
      secretKey: CLERK_SECRET_KEY,
    });

    return {
      userId: payload.sub,
      sessionId: payload.sid,
      email: payload.email,
      metadata: payload.public_metadata || {}
    };
  } catch (error) {
    // Token invalid or expired
    console.error('Token verification failed:', error.message);
    return null;
  }
}

/**
 * Get full user data from Clerk
 */
async function getUser(userId) {
  if (!clerkClient || !userId) {
    return null;
  }

  try {
    const user = await clerkClient.users.getUser(userId);
    return {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      tier: user.publicMetadata?.tier || 'free',
      stripeCustomerId: user.privateMetadata?.stripeCustomerId,
      createdAt: user.createdAt
    };
  } catch (error) {
    console.error('Failed to get user:', error.message);
    return null;
  }
}

/**
 * Update user's subscription tier
 */
async function updateUserTier(userId, tier) {
  if (!clerkClient || !userId) {
    return false;
  }

  try {
    await clerkClient.users.updateUser(userId, {
      publicMetadata: { tier }
    });
    return true;
  } catch (error) {
    console.error('Failed to update user tier:', error.message);
    return false;
  }
}

/**
 * Check if user has pro subscription
 */
async function isPro(userId) {
  const user = await getUser(userId);
  return user?.tier === 'pro';
}

/**
 * Middleware: Require authentication
 * Returns user if authenticated, sends 401 if not
 */
async function requireAuth(req, res) {
  const session = await verifySession(req);

  if (!session) {
    res.writeHead(401, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      error: 'Authentication required',
      signInUrl: '/sign-in'
    }));
    return null;
  }

  return session;
}

/**
 * Middleware: Optional authentication
 * Returns user if authenticated, null otherwise (doesn't block)
 */
async function optionalAuth(req) {
  return await verifySession(req);
}

/**
 * Get user ID for tracking (authenticated or IP-based fallback)
 */
async function getUserIdForTracking(req) {
  // Try authenticated user first
  const session = await verifySession(req);
  if (session?.userId) {
    return { userId: session.userId, authenticated: true };
  }

  // Fallback to IP-based tracking for anonymous users
  const ip = req.headers['x-forwarded-for'] ||
             req.connection?.remoteAddress ||
             req.socket?.remoteAddress ||
             'anonymous';

  return { userId: `anon_${ip}`, authenticated: false };
}

module.exports = {
  isConfigured,
  verifySession,
  getUser,
  updateUserTier,
  isPro,
  requireAuth,
  optionalAuth,
  getUserIdForTracking,
  CLERK_PUBLISHABLE_KEY
};
