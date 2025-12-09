/**
 * Sentry Error Monitoring
 * Tracks errors and exceptions in production
 */

const Sentry = require('@sentry/node');

// Initialize Sentry only if DSN is configured
const isConfigured = !!process.env.SENTRY_DSN;

if (isConfigured) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',

    // Performance monitoring (optional)
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Release tracking
    release: process.env.npm_package_version || '1.0.0',

    // Filter out development errors
    beforeSend(event, hint) {
      // Don't send errors in development unless explicitly enabled
      if (process.env.NODE_ENV !== 'production' && !process.env.SENTRY_DEBUG) {
        console.log('[Sentry] Skipping error in development:', hint.originalException?.message);
        return null;
      }
      return event;
    },

    // Integrate with console
    integrations: [
      Sentry.consoleIntegration(),
    ],
  });

  console.log('[Sentry] Initialized with DSN');
} else {
  console.log('[Sentry] Not configured (no SENTRY_DSN)');
}

/**
 * Capture an exception
 * @param {Error} error - The error to capture
 * @param {Object} context - Additional context
 */
function captureException(error, context = {}) {
  if (isConfigured) {
    Sentry.withScope((scope) => {
      if (context.user) {
        scope.setUser(context.user);
      }
      if (context.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }
      if (context.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
      Sentry.captureException(error);
    });
  } else {
    console.error('[Error]', error.message, context);
  }
}

/**
 * Capture a message
 * @param {string} message - The message to capture
 * @param {string} level - Severity level (info, warning, error)
 */
function captureMessage(message, level = 'info') {
  if (isConfigured) {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`[${level.toUpperCase()}]`, message);
  }
}

/**
 * Set user context
 * @param {Object} user - User information
 */
function setUser(user) {
  if (isConfigured) {
    Sentry.setUser(user);
  }
}

/**
 * Create error handling middleware for HTTP requests
 */
function errorHandler(err, req, res, callback) {
  captureException(err, {
    tags: {
      method: req.method,
      url: req.url,
    },
    extra: {
      headers: req.headers,
      query: req.query,
    }
  });

  if (callback) {
    callback(err, req, res);
  }
}

/**
 * Flush pending events before shutdown
 */
async function flush(timeout = 2000) {
  if (isConfigured) {
    await Sentry.close(timeout);
  }
}

module.exports = {
  isConfigured,
  captureException,
  captureMessage,
  setUser,
  errorHandler,
  flush,
  Sentry, // Export raw Sentry for advanced usage
};
