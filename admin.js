/**
 * Admin Module - Usage Analytics & Cost Tracking
 * Provides admin dashboard data and cost management
 */

const db = require('./db');

/**
 * Record API cost for a provider
 */
async function recordApiCost(provider, cost, tokens) {
    if (!db.getPool()) return false;

    const today = new Date().toISOString().split('T')[0];

    try {
        await db.query(`
            INSERT INTO api_costs (date, provider, total_cost, total_tokens, request_count)
            VALUES ($1, $2, $3, $4, 1)
            ON CONFLICT (date, provider)
            DO UPDATE SET
                total_cost = api_costs.total_cost + $3,
                total_tokens = api_costs.total_tokens + $4,
                request_count = api_costs.request_count + 1
        `, [today, provider, cost, tokens]);
        return true;
    } catch (error) {
        console.error('[Admin] Record API cost error:', error.message);
        return false;
    }
}

/**
 * Update user cost tracking after a debate
 */
async function updateUserCost(userId, costByProvider) {
    if (!db.getPool() || !userId) return false;

    const totalCost = Object.values(costByProvider).reduce((sum, c) => sum + c, 0);

    try {
        // Get current cost_by_provider
        const result = await db.query(
            `SELECT cost_by_provider FROM users WHERE user_id = $1`,
            [userId]
        );

        let currentCosts = { openai: 0, gemini: 0, claude: 0, grok: 0 };
        if (result.rows.length > 0 && result.rows[0].cost_by_provider) {
            currentCosts = result.rows[0].cost_by_provider;
        }

        // Merge costs
        for (const [provider, cost] of Object.entries(costByProvider)) {
            currentCosts[provider] = (currentCosts[provider] || 0) + cost;
        }

        await db.query(`
            UPDATE users
            SET total_cost_incurred = total_cost_incurred + $1,
                monthly_cost = monthly_cost + $1,
                cost_by_provider = $2,
                last_debate_at = NOW(),
                updated_at = NOW()
            WHERE user_id = $3
        `, [totalCost, JSON.stringify(currentCosts), userId]);

        return true;
    } catch (error) {
        console.error('[Admin] Update user cost error:', error.message);
        return false;
    }
}

/**
 * Get overall platform statistics
 */
async function getPlatformStats() {
    if (!db.getPool()) {
        return { error: 'Database not available' };
    }

    try {
        // Total debates and cost
        const debateStats = await db.query(`
            SELECT
                COUNT(*) as total_debates,
                COALESCE(SUM(total_cost), 0) as total_cost,
                COUNT(DISTINCT user_id) as unique_users
            FROM debates
        `);

        // Today's stats
        const todayStats = await db.query(`
            SELECT
                COUNT(*) as debates_today,
                COALESCE(SUM(total_cost), 0) as cost_today
            FROM debates
            WHERE timestamp >= CURRENT_DATE
        `);

        // This month's stats
        const monthStats = await db.query(`
            SELECT
                COUNT(*) as debates_this_month,
                COALESCE(SUM(total_cost), 0) as cost_this_month
            FROM debates
            WHERE timestamp >= DATE_TRUNC('month', CURRENT_DATE)
        `);

        // Cost by provider (last 30 days)
        const providerCosts = await db.query(`
            SELECT
                provider,
                SUM(total_cost) as total_cost,
                SUM(total_tokens) as total_tokens,
                SUM(request_count) as requests
            FROM api_costs
            WHERE date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY provider
            ORDER BY total_cost DESC
        `);

        // User tier breakdown
        const tierStats = await db.query(`
            SELECT tier, COUNT(*) as count
            FROM users
            GROUP BY tier
        `);

        // Recent activity (last 7 days)
        const dailyActivity = await db.query(`
            SELECT
                DATE(timestamp) as date,
                COUNT(*) as debates,
                COALESCE(SUM(total_cost), 0) as cost
            FROM debates
            WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY DATE(timestamp)
            ORDER BY date DESC
        `);

        return {
            overall: {
                totalDebates: parseInt(debateStats.rows[0].total_debates),
                totalCost: parseFloat(debateStats.rows[0].total_cost),
                uniqueUsers: parseInt(debateStats.rows[0].unique_users)
            },
            today: {
                debates: parseInt(todayStats.rows[0].debates_today),
                cost: parseFloat(todayStats.rows[0].cost_today)
            },
            thisMonth: {
                debates: parseInt(monthStats.rows[0].debates_this_month),
                cost: parseFloat(monthStats.rows[0].cost_this_month)
            },
            costByProvider: providerCosts.rows.reduce((acc, row) => {
                acc[row.provider] = {
                    cost: parseFloat(row.total_cost),
                    tokens: parseInt(row.total_tokens),
                    requests: parseInt(row.requests)
                };
                return acc;
            }, {}),
            usersByTier: tierStats.rows.reduce((acc, row) => {
                acc[row.tier] = parseInt(row.count);
                return acc;
            }, {}),
            dailyActivity: dailyActivity.rows.map(row => ({
                date: row.date,
                debates: parseInt(row.debates),
                cost: parseFloat(row.cost)
            }))
        };
    } catch (error) {
        console.error('[Admin] Get platform stats error:', error.message);
        return { error: error.message };
    }
}

/**
 * Get top users by usage
 */
async function getTopUsers(limit = 20) {
    if (!db.getPool()) {
        return { error: 'Database not available' };
    }

    try {
        const result = await db.query(`
            SELECT
                u.user_id,
                u.tier,
                u.total_debates,
                u.total_cost_incurred,
                u.cost_by_provider,
                u.last_debate_at,
                u.created_at
            FROM users u
            ORDER BY u.total_debates DESC
            LIMIT $1
        `, [limit]);

        return result.rows.map(row => ({
            userId: row.user_id,
            tier: row.tier,
            totalDebates: row.total_debates,
            totalCost: parseFloat(row.total_cost_incurred) || 0,
            costByProvider: row.cost_by_provider || {},
            lastDebate: row.last_debate_at,
            joinedAt: row.created_at
        }));
    } catch (error) {
        console.error('[Admin] Get top users error:', error.message);
        return { error: error.message };
    }
}

/**
 * Get cost trend over time
 */
async function getCostTrend(days = 30) {
    if (!db.getPool()) {
        return { error: 'Database not available' };
    }

    try {
        const result = await db.query(`
            SELECT
                date,
                provider,
                total_cost,
                total_tokens,
                request_count
            FROM api_costs
            WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
            ORDER BY date DESC, provider
        `);

        // Group by date
        const byDate = {};
        for (const row of result.rows) {
            const dateStr = row.date.toISOString().split('T')[0];
            if (!byDate[dateStr]) {
                byDate[dateStr] = { date: dateStr, providers: {}, total: 0 };
            }
            byDate[dateStr].providers[row.provider] = {
                cost: parseFloat(row.total_cost),
                tokens: parseInt(row.total_tokens),
                requests: parseInt(row.request_count)
            };
            byDate[dateStr].total += parseFloat(row.total_cost);
        }

        return Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date));
    } catch (error) {
        console.error('[Admin] Get cost trend error:', error.message);
        return { error: error.message };
    }
}

/**
 * Reset monthly costs (run on 1st of each month)
 */
async function resetMonthlyCosts() {
    if (!db.getPool()) return false;

    try {
        await db.query(`UPDATE users SET monthly_cost = 0, updated_at = NOW()`);
        console.log('[Admin] Monthly costs reset');
        return true;
    } catch (error) {
        console.error('[Admin] Reset monthly costs error:', error.message);
        return false;
    }
}

/**
 * Get low credit warnings for API providers
 * This checks recent error patterns that might indicate credit issues
 */
async function getApiHealthStatus() {
    const apiResilience = require('./api-resilience');
    return apiResilience.getHealthStatus();
}

/**
 * Check for credit/billing warnings from recent errors
 */
async function getCreditWarnings() {
    const warnings = [];

    // Check health status for any APIs in error state
    const apiResilience = require('./api-resilience');
    const health = apiResilience.getHealthStatus();

    for (const [apiId, status] of Object.entries(health)) {
        if (status.state === 'open' || status.failures >= 3) {
            warnings.push({
                provider: apiId,
                severity: status.state === 'open' ? 'critical' : 'warning',
                message: `${apiId} API has ${status.failures} recent failures`,
                lastFailure: status.lastFailure
            });
        }
    }

    // Check if we've had recent billing errors (from db if available)
    if (db.getPool()) {
        try {
            // Check if any provider has 0 requests today but had requests yesterday
            const result = await db.query(`
                SELECT provider
                FROM api_costs
                WHERE date = CURRENT_DATE - INTERVAL '1 day'
                  AND request_count > 5
                  AND provider NOT IN (
                      SELECT provider FROM api_costs WHERE date = CURRENT_DATE
                  )
            `);

            for (const row of result.rows) {
                warnings.push({
                    provider: row.provider,
                    severity: 'info',
                    message: `${row.provider} had activity yesterday but none today - may need attention`
                });
            }
        } catch (error) {
            // Ignore db errors for warnings check
        }
    }

    return warnings;
}

/**
 * Get estimated remaining budget based on recent spend rate
 */
async function getBudgetEstimate(monthlyBudget = 100) {
    if (!db.getPool()) {
        return { error: 'Database not available' };
    }

    try {
        // Get this month's total spend
        const monthResult = await db.query(`
            SELECT COALESCE(SUM(total_cost), 0) as total
            FROM debates
            WHERE timestamp >= DATE_TRUNC('month', CURRENT_DATE)
        `);

        const monthlySpend = parseFloat(monthResult.rows[0].total) || 0;
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const currentDay = new Date().getDate();
        const daysRemaining = daysInMonth - currentDay;

        // Daily average
        const dailyAverage = currentDay > 0 ? monthlySpend / currentDay : 0;
        const projectedMonthEnd = monthlySpend + (dailyAverage * daysRemaining);

        return {
            monthlyBudget,
            currentSpend: monthlySpend,
            dailyAverage,
            projectedMonthEnd,
            remaining: monthlyBudget - monthlySpend,
            percentUsed: (monthlySpend / monthlyBudget) * 100,
            projectedOverBudget: projectedMonthEnd > monthlyBudget
        };
    } catch (error) {
        console.error('[Admin] Budget estimate error:', error.message);
        return { error: error.message };
    }
}

/**
 * Get configuration status for all services
 */
async function getConfigStatus() {
    const auth = require('./auth');
    const stripe = require('./stripe');
    const sentry = require('./sentry');
    const apiResilience = require('./api-resilience');
    const config = require('./config');

    // Check database
    let dbStatus = { configured: false, connected: false };
    try {
        const isAvailable = await db.isAvailable();
        dbStatus = {
            configured: !!process.env.DATABASE_URL,
            connected: isAvailable,
            host: process.env.DATABASE_URL ? 'configured' : 'not set'
        };
    } catch (e) {
        dbStatus.error = e.message;
    }

    // Check Stripe
    const stripeStatus = {
        configured: stripe.isConfigured(),
        secretKey: !!process.env.STRIPE_SECRET_KEY,
        publishableKey: !!process.env.STRIPE_PUBLISHABLE_KEY,
        webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
        priceId: !!process.env.STRIPE_PRICE_ID_MONTHLY
    };

    // Check Sentry
    const sentryStatus = {
        configured: sentry.isConfigured,
        dsn: !!process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development'
    };

    // Check Auth (Clerk)
    const authStatus = {
        configured: auth.isConfigured(),
        publishableKey: !!process.env.CLERK_PUBLISHABLE_KEY,
        secretKey: !!process.env.CLERK_SECRET_KEY
    };

    // Check AI Providers
    const aiStatus = {};
    for (const [id, cfg] of Object.entries(config.llms)) {
        aiStatus[id] = {
            name: cfg.name,
            configured: !!cfg.apiKey,
            enabled: cfg.enabled
        };
    }

    // API Health from circuit breaker
    const apiHealth = apiResilience.getHealthStatus();

    return {
        database: dbStatus,
        stripe: stripeStatus,
        sentry: sentryStatus,
        auth: authStatus,
        aiProviders: aiStatus,
        apiHealth,
        environment: {
            nodeEnv: process.env.NODE_ENV || 'development',
            appUrl: process.env.APP_URL || 'not set',
            port: process.env.PORT || 3000
        }
    };
}

// In-memory error log (last 100 errors)
const errorLog = [];
const MAX_ERROR_LOG = 100;

/**
 * Log an error for admin tracking
 */
function logError(error, context = {}) {
    const entry = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        timestamp: new Date().toISOString(),
        message: error.message || String(error),
        stack: error.stack?.split('\n').slice(0, 5).join('\n'),
        type: error.name || 'Error',
        context: {
            userId: context.userId,
            endpoint: context.endpoint,
            method: context.method,
            userAgent: context.userAgent,
            ...context
        }
    };

    errorLog.unshift(entry);
    if (errorLog.length > MAX_ERROR_LOG) {
        errorLog.pop();
    }

    // Also send to Sentry if configured
    const sentry = require('./sentry');
    if (sentry.isConfigured) {
        sentry.captureException(error, context);
    }

    return entry;
}

/**
 * Get recent errors from log
 */
function getRecentErrors(limit = 20) {
    return errorLog.slice(0, limit);
}

/**
 * Get user issue alerts - detect patterns
 */
async function getUserIssueAlerts() {
    const alerts = [];
    const now = new Date();

    // Check for high error rate
    const recentErrors = errorLog.filter(e => {
        const errorTime = new Date(e.timestamp);
        return (now - errorTime) < 60 * 60 * 1000; // Last hour
    });

    if (recentErrors.length >= 10) {
        alerts.push({
            severity: 'critical',
            type: 'high_error_rate',
            message: `${recentErrors.length} errors in the last hour`,
            count: recentErrors.length
        });
    } else if (recentErrors.length >= 5) {
        alerts.push({
            severity: 'warning',
            type: 'elevated_error_rate',
            message: `${recentErrors.length} errors in the last hour`,
            count: recentErrors.length
        });
    }

    // Check for repeated error types
    const errorTypes = {};
    recentErrors.forEach(e => {
        const key = e.type + ':' + (e.context?.endpoint || 'unknown');
        errorTypes[key] = (errorTypes[key] || 0) + 1;
    });

    for (const [key, count] of Object.entries(errorTypes)) {
        if (count >= 3) {
            alerts.push({
                severity: 'warning',
                type: 'repeated_error',
                message: `"${key}" occurred ${count} times`,
                pattern: key,
                count
            });
        }
    }

    // Check API health for failures
    const apiResilience = require('./api-resilience');
    const health = apiResilience.getHealthStatus();
    for (const [apiId, status] of Object.entries(health)) {
        if (status.state === 'open') {
            alerts.push({
                severity: 'critical',
                type: 'api_circuit_open',
                message: `${apiId} API circuit breaker is OPEN`,
                provider: apiId,
                failures: status.failures
            });
        } else if (status.failures >= 2) {
            alerts.push({
                severity: 'warning',
                type: 'api_failures',
                message: `${apiId} API has ${status.failures} recent failures`,
                provider: apiId,
                failures: status.failures
            });
        }
    }

    // Check database if available
    if (db.getPool()) {
        try {
            // Check for users with payment issues (if we track that)
            const failedPayments = await db.query(`
                SELECT COUNT(*) as count FROM users
                WHERE tier = 'free'
                AND stripe_customer_id IS NOT NULL
                AND updated_at > NOW() - INTERVAL '24 hours'
            `);

            if (parseInt(failedPayments.rows[0]?.count) > 0) {
                alerts.push({
                    severity: 'info',
                    type: 'potential_churn',
                    message: `${failedPayments.rows[0].count} users may have cancelled subscriptions recently`
                });
            }
        } catch (e) {
            // Ignore query errors
        }
    }

    return alerts;
}

/**
 * Clear error log (for testing)
 */
function clearErrorLog() {
    errorLog.length = 0;
}

module.exports = {
    recordApiCost,
    updateUserCost,
    getPlatformStats,
    getTopUsers,
    getCostTrend,
    resetMonthlyCosts,
    getApiHealthStatus,
    getCreditWarnings,
    getBudgetEstimate,
    // New exports
    getConfigStatus,
    logError,
    getRecentErrors,
    getUserIssueAlerts,
    clearErrorLog
};
