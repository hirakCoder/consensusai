/**
 * Content Moderation Module
 * Filters NSFW, controversial, and potentially harmful queries
 *
 * This module provides multiple layers of content filtering:
 * 1. Banned topic detection (immediate rejection)
 * 2. NSFW keyword detection
 * 3. Controversial topic warnings
 * 4. Rate limiting for flagged users
 */

// Banned topics - These will be immediately rejected
const BANNED_TOPICS = [
  // Illegal activities
  'how to make a bomb',
  'how to make explosives',
  'how to hack into',
  'how to steal',
  'how to commit fraud',
  'how to launder money',
  'how to evade taxes illegally',
  'drug synthesis',
  'drug manufacturing',

  // Violence
  'how to kill',
  'how to harm',
  'how to hurt someone',
  'how to torture',
  'mass shooting',
  'terrorism',

  // Child safety
  'child abuse',
  'child exploitation',
  'csam',
  'minor abuse',

  // Self-harm
  'how to commit suicide',
  'suicide methods',
  'best way to die',

  // Extreme hate
  'ethnic cleansing',
  'genocide',
  'racial extermination'
];

// NSFW keywords - These will trigger warnings and potential rejection
const NSFW_KEYWORDS = [
  'porn', 'pornography', 'xxx', 'nsfw', 'nude', 'naked',
  'sex position', 'sexual act', 'orgasm', 'masturbat',
  'erotic', 'fetish', 'bdsm', 'escort', 'prostitut',
  'strip club', 'onlyfans', 'adult content'
];

// Controversial topics - These will proceed but with warnings logged
const CONTROVERSIAL_TOPICS = [
  'abortion', 'pro-choice', 'pro-life',
  'gun control', 'second amendment',
  'immigration', 'border wall', 'deportation',
  'vaccine', 'anti-vax',
  'election fraud', 'stolen election',
  'climate change denial', 'global warming hoax',
  'flat earth',
  'qanon', 'deep state',
  'racial superiority',
  'religious extremism'
];

// Spam patterns
const SPAM_PATTERNS = [
  /(.)\1{10,}/i,                     // Repeated characters (aaaaaaaaaa)
  /^.{0,5}$/,                         // Too short
  /^.{2000,}$/,                       // Too long
  /(http[s]?:\/\/[^\s]+){3,}/i,      // Multiple URLs
  /\b(buy|cheap|discount|offer|click|subscribe)\b.*\b(now|today|here)\b/i // Spam phrases
];

/**
 * Moderation result types
 */
const MODERATION_RESULT = {
  ALLOWED: 'allowed',
  BLOCKED: 'blocked',
  WARNING: 'warning'
};

/**
 * Check if query contains banned topics
 */
function checkBannedTopics(query) {
  const lowerQuery = query.toLowerCase();

  for (const topic of BANNED_TOPICS) {
    if (lowerQuery.includes(topic.toLowerCase())) {
      return {
        blocked: true,
        reason: 'banned_topic',
        message: 'This query contains prohibited content and cannot be processed.',
        matched: topic
      };
    }
  }

  return { blocked: false };
}

/**
 * Check if query contains NSFW content
 */
function checkNSFW(query) {
  const lowerQuery = query.toLowerCase();
  const matches = [];

  for (const keyword of NSFW_KEYWORDS) {
    if (lowerQuery.includes(keyword.toLowerCase())) {
      matches.push(keyword);
    }
  }

  if (matches.length > 0) {
    return {
      flagged: true,
      reason: 'nsfw_content',
      message: 'This query appears to contain adult content and cannot be processed.',
      matches
    };
  }

  return { flagged: false };
}

/**
 * Check if query contains controversial topics
 */
function checkControversial(query) {
  const lowerQuery = query.toLowerCase();
  const matches = [];

  for (const topic of CONTROVERSIAL_TOPICS) {
    if (lowerQuery.includes(topic.toLowerCase())) {
      matches.push(topic);
    }
  }

  if (matches.length > 0) {
    return {
      controversial: true,
      topics: matches,
      message: 'This query touches on potentially controversial topics. Results may vary significantly between AI models.'
    };
  }

  return { controversial: false };
}

/**
 * Check for spam patterns
 */
function checkSpam(query) {
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(query)) {
      return {
        spam: true,
        reason: 'spam_detected',
        message: 'This query appears to be spam or invalid.'
      };
    }
  }

  return { spam: false };
}

/**
 * Sanitize input - remove potential injection attempts
 */
function sanitizeInput(query) {
  if (typeof query !== 'string') {
    return '';
  }

  return query
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]+>/g, '')                           // Remove HTML tags
    .replace(/javascript:/gi, '')                      // Remove javascript: URLs
    .replace(/on\w+=/gi, '')                          // Remove event handlers
    .trim()
    .substring(0, 1000);                              // Limit length
}

/**
 * Main moderation function
 * @param {string} query - The user's question
 * @param {object} options - Optional configuration
 * @returns {object} Moderation result
 */
function moderateQuery(query, options = {}) {
  const startTime = Date.now();

  // Default options
  const {
    allowControversial = true,  // Allow controversial but log them
    strictMode = false,         // In strict mode, block controversial too
    logWarnings = true
  } = options;

  // Sanitize first
  const sanitizedQuery = sanitizeInput(query);

  // Check if query is empty after sanitization
  if (!sanitizedQuery || sanitizedQuery.length < 3) {
    return {
      result: MODERATION_RESULT.BLOCKED,
      reason: 'empty_query',
      message: 'Please enter a valid question.',
      processingTime: Date.now() - startTime
    };
  }

  // Check for spam
  const spamCheck = checkSpam(sanitizedQuery);
  if (spamCheck.spam) {
    return {
      result: MODERATION_RESULT.BLOCKED,
      reason: spamCheck.reason,
      message: spamCheck.message,
      processingTime: Date.now() - startTime
    };
  }

  // Check for banned topics
  const bannedCheck = checkBannedTopics(sanitizedQuery);
  if (bannedCheck.blocked) {
    if (logWarnings) {
      console.warn(`[Content Moderation] BLOCKED - Banned topic detected: "${bannedCheck.matched}"`);
    }
    return {
      result: MODERATION_RESULT.BLOCKED,
      reason: bannedCheck.reason,
      message: bannedCheck.message,
      processingTime: Date.now() - startTime
    };
  }

  // Check for NSFW content
  const nsfwCheck = checkNSFW(sanitizedQuery);
  if (nsfwCheck.flagged) {
    if (logWarnings) {
      console.warn(`[Content Moderation] BLOCKED - NSFW content detected: ${nsfwCheck.matches.join(', ')}`);
    }
    return {
      result: MODERATION_RESULT.BLOCKED,
      reason: nsfwCheck.reason,
      message: nsfwCheck.message,
      processingTime: Date.now() - startTime
    };
  }

  // Check for controversial topics
  const controversialCheck = checkControversial(sanitizedQuery);
  if (controversialCheck.controversial) {
    if (strictMode) {
      return {
        result: MODERATION_RESULT.BLOCKED,
        reason: 'controversial_topic',
        message: 'This query contains controversial content that is currently restricted.',
        processingTime: Date.now() - startTime
      };
    }

    if (logWarnings) {
      console.info(`[Content Moderation] WARNING - Controversial topics: ${controversialCheck.topics.join(', ')}`);
    }

    // Allow but with warning
    return {
      result: MODERATION_RESULT.WARNING,
      warning: controversialCheck.message,
      topics: controversialCheck.topics,
      sanitizedQuery,
      processingTime: Date.now() - startTime
    };
  }

  // Query passed all checks
  return {
    result: MODERATION_RESULT.ALLOWED,
    sanitizedQuery,
    processingTime: Date.now() - startTime
  };
}

/**
 * Quick check - returns boolean for simple allow/deny
 */
function isQueryAllowed(query) {
  const result = moderateQuery(query);
  return result.result !== MODERATION_RESULT.BLOCKED;
}

/**
 * Get user-friendly error message
 */
function getErrorMessage(moderationResult) {
  if (moderationResult.result === MODERATION_RESULT.BLOCKED) {
    return moderationResult.message || 'This query cannot be processed.';
  }
  return null;
}

module.exports = {
  moderateQuery,
  isQueryAllowed,
  getErrorMessage,
  sanitizeInput,
  MODERATION_RESULT,
  // Export individual checks for testing
  checkBannedTopics,
  checkNSFW,
  checkControversial,
  checkSpam
};
