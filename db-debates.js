// Debate Database Operations
const db = require('./db');

// Save or update a debate
async function saveDebate(debate, userId = null) {
    const {
        shareId,
        question,
        context,
        timestamp,
        consensusReached,
        consensusType,
        consensusDecision,
        consensusPosition,
        rounds,
        finalConsensus,
        actionPlan,
        totalCost,
        llmsUsed,
        tier
    } = debate;

    try {
        const result = await db.query(`
            INSERT INTO debates (
                share_id, question, context, timestamp,
                consensus_reached, consensus_type, consensus_decision, consensus_position,
                rounds, final_consensus, action_plan,
                total_cost, llms_used, tier, user_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            ON CONFLICT (share_id) DO UPDATE SET
                question = EXCLUDED.question,
                context = EXCLUDED.context,
                consensus_reached = EXCLUDED.consensus_reached,
                consensus_type = EXCLUDED.consensus_type,
                consensus_decision = EXCLUDED.consensus_decision,
                consensus_position = EXCLUDED.consensus_position,
                rounds = EXCLUDED.rounds,
                final_consensus = EXCLUDED.final_consensus,
                action_plan = EXCLUDED.action_plan,
                total_cost = EXCLUDED.total_cost,
                llms_used = EXCLUDED.llms_used,
                tier = EXCLUDED.tier,
                updated_at = NOW()
            RETURNING id, share_id
        `, [
            shareId,
            question,
            context || null,
            timestamp || new Date().toISOString(),
            consensusReached || false,
            consensusType || null,
            consensusDecision || null,
            consensusPosition || null,
            JSON.stringify(rounds || []),
            finalConsensus ? JSON.stringify(finalConsensus) : null,
            actionPlan ? JSON.stringify(actionPlan) : null,
            totalCost || 0,
            llmsUsed || [],
            tier || 'budget',
            userId
        ]);

        return result.rows[0];
    } catch (error) {
        console.error('[DB-Debates] Save error:', error.message);
        throw error;
    }
}

// Get debate by share ID
async function getDebateByShareId(shareId) {
    try {
        const result = await db.query(
            'SELECT * FROM debates WHERE share_id = $1',
            [shareId]
        );

        if (result.rows.length === 0) {
            return null;
        }

        const row = result.rows[0];
        return formatDebateFromRow(row);
    } catch (error) {
        console.error('[DB-Debates] Get by shareId error:', error.message);
        throw error;
    }
}

// Get all debates (with pagination)
async function getAllDebates(limit = 50, offset = 0, userId = null) {
    try {
        let queryText = `
            SELECT * FROM debates
            ${userId ? 'WHERE user_id = $3' : ''}
            ORDER BY timestamp DESC
            LIMIT $1 OFFSET $2
        `;
        let params = userId ? [limit, offset, userId] : [limit, offset];

        const result = await db.query(queryText, params);
        return result.rows.map(formatDebateFromRow);
    } catch (error) {
        console.error('[DB-Debates] Get all error:', error.message);
        throw error;
    }
}

// Search debates by keyword
async function searchDebates(keyword, limit = 20, userId = null) {
    try {
        let queryText = `
            SELECT * FROM debates
            WHERE (question ILIKE $1 OR context ILIKE $1 OR consensus_position ILIKE $1)
            ${userId ? 'AND user_id = $3' : ''}
            ORDER BY timestamp DESC
            LIMIT $2
        `;
        let params = userId
            ? [`%${keyword}%`, limit, userId]
            : [`%${keyword}%`, limit];

        const result = await db.query(queryText, params);
        return result.rows.map(formatDebateFromRow);
    } catch (error) {
        console.error('[DB-Debates] Search error:', error.message);
        throw error;
    }
}

// Get debates by user
async function getDebatesByUser(userId, limit = 50) {
    try {
        const result = await db.query(
            `SELECT * FROM debates WHERE user_id = $1 ORDER BY timestamp DESC LIMIT $2`,
            [userId, limit]
        );
        return result.rows.map(formatDebateFromRow);
    } catch (error) {
        console.error('[DB-Debates] Get by user error:', error.message);
        throw error;
    }
}

// Delete debate
async function deleteDebate(shareId) {
    try {
        const result = await db.query(
            'DELETE FROM debates WHERE share_id = $1 RETURNING id',
            [shareId]
        );
        return result.rowCount > 0;
    } catch (error) {
        console.error('[DB-Debates] Delete error:', error.message);
        throw error;
    }
}

// Get debate count
async function getDebateCount(userId = null) {
    try {
        let queryText = 'SELECT COUNT(*) as count FROM debates';
        let params = [];

        if (userId) {
            queryText += ' WHERE user_id = $1';
            params = [userId];
        }

        const result = await db.query(queryText, params);
        return parseInt(result.rows[0].count, 10);
    } catch (error) {
        console.error('[DB-Debates] Count error:', error.message);
        throw error;
    }
}

// Format database row to debate object
function formatDebateFromRow(row) {
    return {
        id: row.id,
        shareId: row.share_id,
        question: row.question,
        context: row.context,
        timestamp: row.timestamp,
        consensusReached: row.consensus_reached,
        consensusType: row.consensus_type,
        consensusDecision: row.consensus_decision,
        consensusPosition: row.consensus_position,
        rounds: typeof row.rounds === 'string' ? JSON.parse(row.rounds) : row.rounds,
        finalConsensus: row.final_consensus
            ? (typeof row.final_consensus === 'string' ? JSON.parse(row.final_consensus) : row.final_consensus)
            : null,
        actionPlan: row.action_plan
            ? (typeof row.action_plan === 'string' ? JSON.parse(row.action_plan) : row.action_plan)
            : null,
        totalCost: parseFloat(row.total_cost) || 0,
        llmsUsed: row.llms_used || [],
        tier: row.tier,
        userId: row.user_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

module.exports = {
    saveDebate,
    getDebateByShareId,
    getAllDebates,
    searchDebates,
    getDebatesByUser,
    deleteDebate,
    getDebateCount
};
