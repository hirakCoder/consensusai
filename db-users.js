// User Database Operations
const db = require('./db');

// Get or create user
async function getOrCreateUser(userId) {
    try {
        // Try to get existing user
        let result = await db.query(
            'SELECT * FROM users WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length > 0) {
            return formatUserFromRow(result.rows[0]);
        }

        // Create new user
        result = await db.query(
            `INSERT INTO users (user_id, tier, total_debates, daily_usage)
             VALUES ($1, 'free', 0, '{}')
             RETURNING *`,
            [userId]
        );

        return formatUserFromRow(result.rows[0]);
    } catch (error) {
        console.error('[DB-Users] Get or create error:', error.message);
        throw error;
    }
}

// Get user by ID
async function getUserById(userId) {
    try {
        const result = await db.query(
            'SELECT * FROM users WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return formatUserFromRow(result.rows[0]);
    } catch (error) {
        console.error('[DB-Users] Get by ID error:', error.message);
        throw error;
    }
}

// Get user stats
async function getUserStats(userId) {
    try {
        const user = await getUserById(userId);
        if (!user) {
            return null;
        }

        // Get debate count for this user
        const debateResult = await db.query(
            'SELECT COUNT(*) as count FROM debates WHERE user_id = $1',
            [userId]
        );

        return {
            ...user,
            debateCount: parseInt(debateResult.rows[0].count, 10)
        };
    } catch (error) {
        console.error('[DB-Users] Get stats error:', error.message);
        throw error;
    }
}

// Set user tier
async function setUserTier(userId, tier) {
    try {
        const result = await db.query(
            `UPDATE users SET tier = $2, updated_at = NOW()
             WHERE user_id = $1
             RETURNING *`,
            [userId, tier]
        );

        if (result.rows.length === 0) {
            // User doesn't exist, create them with the tier
            const createResult = await db.query(
                `INSERT INTO users (user_id, tier, total_debates, daily_usage)
                 VALUES ($1, $2, 0, '{}')
                 RETURNING *`,
                [userId, tier]
            );
            return formatUserFromRow(createResult.rows[0]);
        }

        return formatUserFromRow(result.rows[0]);
    } catch (error) {
        console.error('[DB-Users] Set tier error:', error.message);
        throw error;
    }
}

// Set Stripe customer ID
async function setStripeCustomerId(userId, customerId) {
    try {
        const result = await db.query(
            `UPDATE users SET stripe_customer_id = $2, updated_at = NOW()
             WHERE user_id = $1
             RETURNING *`,
            [userId, customerId]
        );

        return result.rows.length > 0 ? formatUserFromRow(result.rows[0]) : null;
    } catch (error) {
        console.error('[DB-Users] Set Stripe ID error:', error.message);
        throw error;
    }
}

// Record a debate (increment counter and daily usage)
async function recordDebate(userId) {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Get current user
        const user = await getOrCreateUser(userId);
        const dailyUsage = user.dailyUsage || {};

        // Update daily count
        dailyUsage[today] = (dailyUsage[today] || 0) + 1;

        // Clean up old dates (keep last 7 days)
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        for (const date of Object.keys(dailyUsage)) {
            if (new Date(date) < cutoffDate) {
                delete dailyUsage[date];
            }
        }

        const result = await db.query(
            `UPDATE users SET
                total_debates = total_debates + 1,
                daily_usage = $2,
                updated_at = NOW()
             WHERE user_id = $1
             RETURNING *`,
            [userId, JSON.stringify(dailyUsage)]
        );

        return formatUserFromRow(result.rows[0]);
    } catch (error) {
        console.error('[DB-Users] Record debate error:', error.message);
        throw error;
    }
}

// Check if user can debate (rate limiting)
async function canDebate(userId, dailyLimit = 3) {
    try {
        const user = await getUserById(userId);
        if (!user) {
            // New user can debate
            return { allowed: true, remaining: dailyLimit - 1 };
        }

        // Pro users have unlimited debates
        if (user.tier === 'pro') {
            return { allowed: true, remaining: -1 }; // -1 = unlimited
        }

        const today = new Date().toISOString().split('T')[0];
        const dailyUsage = user.dailyUsage || {};
        const todayCount = dailyUsage[today] || 0;

        if (todayCount >= dailyLimit) {
            return { allowed: false, remaining: 0 };
        }

        return { allowed: true, remaining: dailyLimit - todayCount - 1 };
    } catch (error) {
        console.error('[DB-Users] Can debate error:', error.message);
        // Default to allowing in case of error
        return { allowed: true, remaining: dailyLimit };
    }
}

// Get daily usage for a user
async function getDailyUsage(userId) {
    try {
        const user = await getUserById(userId);
        if (!user) {
            return { today: 0, total: 0 };
        }

        const today = new Date().toISOString().split('T')[0];
        const dailyUsage = user.dailyUsage || {};

        return {
            today: dailyUsage[today] || 0,
            total: user.totalDebates
        };
    } catch (error) {
        console.error('[DB-Users] Get daily usage error:', error.message);
        return { today: 0, total: 0 };
    }
}

// Format database row to user object
function formatUserFromRow(row) {
    return {
        id: row.id,
        userId: row.user_id,
        tier: row.tier,
        stripeCustomerId: row.stripe_customer_id,
        totalDebates: row.total_debates,
        dailyUsage: typeof row.daily_usage === 'string'
            ? JSON.parse(row.daily_usage)
            : row.daily_usage,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

module.exports = {
    getOrCreateUser,
    getUserById,
    getUserStats,
    setUserTier,
    setStripeCustomerId,
    recordDebate,
    canDebate,
    getDailyUsage
};
