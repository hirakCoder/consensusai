/**
 * API Resilience Module
 * Provides retry logic, circuit breaker, and timeout handling for LLM API calls
 *
 * Features:
 * 1. Automatic retry with exponential backoff
 * 2. Circuit breaker pattern to prevent cascade failures
 * 3. Request timeout handling
 * 4. Per-API health tracking
 */

// Configuration
const CONFIG = {
  // Retry settings
  maxRetries: 3,
  initialRetryDelayMs: 1000,
  maxRetryDelayMs: 10000,
  retryBackoffMultiplier: 2,

  // Timeout settings
  requestTimeoutMs: 30000,  // 30 seconds per request

  // Circuit breaker settings
  failureThreshold: 5,      // Failures before opening circuit
  recoveryTimeMs: 60000,    // Time before trying again (1 minute)
  halfOpenMaxAttempts: 2    // Attempts in half-open state
};

// Circuit breaker states
const CIRCUIT_STATE = {
  CLOSED: 'closed',         // Normal operation
  OPEN: 'open',             // Blocking all requests
  HALF_OPEN: 'half_open'    // Testing if service recovered
};

// Per-API circuit breaker state
const circuitBreakers = new Map();

/**
 * Get or create circuit breaker for an API
 */
function getCircuitBreaker(apiId) {
  if (!circuitBreakers.has(apiId)) {
    circuitBreakers.set(apiId, {
      state: CIRCUIT_STATE.CLOSED,
      failures: 0,
      successes: 0,
      lastFailureTime: null,
      lastSuccessTime: null,
      halfOpenAttempts: 0
    });
  }
  return circuitBreakers.get(apiId);
}

/**
 * Check if circuit allows request
 */
function canMakeRequest(apiId) {
  const breaker = getCircuitBreaker(apiId);

  switch (breaker.state) {
    case CIRCUIT_STATE.CLOSED:
      return { allowed: true };

    case CIRCUIT_STATE.OPEN:
      // Check if enough time has passed to try again
      const timeSinceFailure = Date.now() - breaker.lastFailureTime;
      if (timeSinceFailure >= CONFIG.recoveryTimeMs) {
        // Transition to half-open
        breaker.state = CIRCUIT_STATE.HALF_OPEN;
        breaker.halfOpenAttempts = 0;
        console.log(`[Circuit Breaker] ${apiId}: OPEN -> HALF_OPEN (testing recovery)`);
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'circuit_open',
        message: `${apiId} API is temporarily unavailable. Will retry in ${Math.ceil((CONFIG.recoveryTimeMs - timeSinceFailure) / 1000)}s`,
        retryAfter: CONFIG.recoveryTimeMs - timeSinceFailure
      };

    case CIRCUIT_STATE.HALF_OPEN:
      if (breaker.halfOpenAttempts < CONFIG.halfOpenMaxAttempts) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'circuit_half_open_limit',
        message: `${apiId} API is being tested for recovery`
      };

    default:
      return { allowed: true };
  }
}

/**
 * Record success for circuit breaker
 */
function recordSuccess(apiId) {
  const breaker = getCircuitBreaker(apiId);
  breaker.successes++;
  breaker.lastSuccessTime = Date.now();

  if (breaker.state === CIRCUIT_STATE.HALF_OPEN) {
    // Recovery confirmed - close circuit
    breaker.state = CIRCUIT_STATE.CLOSED;
    breaker.failures = 0;
    breaker.halfOpenAttempts = 0;
    console.log(`[Circuit Breaker] ${apiId}: HALF_OPEN -> CLOSED (recovered)`);
  } else if (breaker.state === CIRCUIT_STATE.CLOSED) {
    // Reset failure count on success
    breaker.failures = Math.max(0, breaker.failures - 1);
  }
}

/**
 * Record failure for circuit breaker
 */
function recordFailure(apiId, error) {
  const breaker = getCircuitBreaker(apiId);
  breaker.failures++;
  breaker.lastFailureTime = Date.now();

  if (breaker.state === CIRCUIT_STATE.HALF_OPEN) {
    breaker.halfOpenAttempts++;
    if (breaker.halfOpenAttempts >= CONFIG.halfOpenMaxAttempts) {
      // Still failing - reopen circuit
      breaker.state = CIRCUIT_STATE.OPEN;
      console.log(`[Circuit Breaker] ${apiId}: HALF_OPEN -> OPEN (still failing)`);
    }
  } else if (breaker.state === CIRCUIT_STATE.CLOSED) {
    if (breaker.failures >= CONFIG.failureThreshold) {
      // Too many failures - open circuit
      breaker.state = CIRCUIT_STATE.OPEN;
      console.log(`[Circuit Breaker] ${apiId}: CLOSED -> OPEN (threshold reached: ${breaker.failures} failures)`);
    }
  }
}

/**
 * Determine if error is retryable
 */
function isRetryableError(error) {
  const errorMessage = (error.message || '').toLowerCase();

  // Network errors - retryable
  if (
    errorMessage.includes('timeout') ||
    errorMessage.includes('econnrefused') ||
    errorMessage.includes('econnreset') ||
    errorMessage.includes('socket hang up') ||
    errorMessage.includes('network') ||
    errorMessage.includes('etimedout')
  ) {
    return true;
  }

  // Rate limiting - retryable with backoff
  if (
    errorMessage.includes('rate limit') ||
    errorMessage.includes('too many requests') ||
    errorMessage.includes('429')
  ) {
    return true;
  }

  // Server errors (5xx) - retryable
  if (
    errorMessage.includes('500') ||
    errorMessage.includes('502') ||
    errorMessage.includes('503') ||
    errorMessage.includes('504') ||
    errorMessage.includes('internal server error') ||
    errorMessage.includes('service unavailable')
  ) {
    return true;
  }

  // Auth/billing errors - NOT retryable
  if (
    errorMessage.includes('401') ||
    errorMessage.includes('403') ||
    errorMessage.includes('invalid api key') ||
    errorMessage.includes('insufficient') ||
    errorMessage.includes('quota')
  ) {
    return false;
  }

  // Default: don't retry unknown errors
  return false;
}

/**
 * Calculate retry delay with exponential backoff
 */
function calculateRetryDelay(attempt) {
  const delay = CONFIG.initialRetryDelayMs * Math.pow(CONFIG.retryBackoffMultiplier, attempt);
  // Add jitter (10-20% random variation)
  const jitter = delay * (0.1 + Math.random() * 0.1);
  return Math.min(delay + jitter, CONFIG.maxRetryDelayMs);
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wrap a promise with timeout
 */
function withTimeout(promise, timeoutMs, apiId) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${apiId} API request timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then(result => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/**
 * Execute API call with retry logic and circuit breaker
 * @param {string} apiId - Identifier for the API (openai, claude, etc.)
 * @param {function} apiCall - Async function that makes the actual API call
 * @param {object} options - Optional configuration overrides
 * @returns {Promise} - Result of the API call
 */
async function executeWithResilience(apiId, apiCall, options = {}) {
  const {
    maxRetries = CONFIG.maxRetries,
    timeoutMs = CONFIG.requestTimeoutMs,
    onRetry = null // Callback for retry events
  } = options;

  // Check circuit breaker first
  const circuitCheck = canMakeRequest(apiId);
  if (!circuitCheck.allowed) {
    throw new Error(circuitCheck.message);
  }

  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Execute with timeout
      const result = await withTimeout(apiCall(), timeoutMs, apiId);

      // Success - update circuit breaker
      recordSuccess(apiId);

      return result;
    } catch (error) {
      lastError = error;

      // Record failure
      recordFailure(apiId, error);

      // Check if we should retry
      if (attempt < maxRetries && isRetryableError(error)) {
        const delay = calculateRetryDelay(attempt);
        console.log(`[API Resilience] ${apiId}: Attempt ${attempt + 1}/${maxRetries + 1} failed: ${error.message}. Retrying in ${Math.round(delay)}ms`);

        if (onRetry) {
          onRetry({
            apiId,
            attempt: attempt + 1,
            maxRetries,
            error: error.message,
            retryDelay: delay
          });
        }

        await sleep(delay);
      } else {
        // Non-retryable error or max retries reached
        break;
      }
    }
  }

  // All retries exhausted
  const enhancedError = new Error(
    `${apiId} API failed after ${maxRetries + 1} attempts: ${lastError.message}`
  );
  enhancedError.originalError = lastError;
  enhancedError.apiId = apiId;
  enhancedError.attempts = maxRetries + 1;

  throw enhancedError;
}

/**
 * Get health status of all APIs
 */
function getHealthStatus() {
  const status = {};

  for (const [apiId, breaker] of circuitBreakers) {
    status[apiId] = {
      state: breaker.state,
      failures: breaker.failures,
      successes: breaker.successes,
      lastFailure: breaker.lastFailureTime ? new Date(breaker.lastFailureTime).toISOString() : null,
      lastSuccess: breaker.lastSuccessTime ? new Date(breaker.lastSuccessTime).toISOString() : null,
      healthy: breaker.state === CIRCUIT_STATE.CLOSED
    };
  }

  return status;
}

/**
 * Reset circuit breaker for an API (admin function)
 */
function resetCircuitBreaker(apiId) {
  if (circuitBreakers.has(apiId)) {
    circuitBreakers.set(apiId, {
      state: CIRCUIT_STATE.CLOSED,
      failures: 0,
      successes: 0,
      lastFailureTime: null,
      lastSuccessTime: null,
      halfOpenAttempts: 0
    });
    console.log(`[Circuit Breaker] ${apiId}: Reset to CLOSED`);
    return true;
  }
  return false;
}

/**
 * Reset all circuit breakers
 */
function resetAllCircuitBreakers() {
  for (const apiId of circuitBreakers.keys()) {
    resetCircuitBreaker(apiId);
  }
}

module.exports = {
  executeWithResilience,
  canMakeRequest,
  recordSuccess,
  recordFailure,
  getHealthStatus,
  resetCircuitBreaker,
  resetAllCircuitBreakers,
  isRetryableError,
  CONFIG,
  CIRCUIT_STATE
};
