// PostgreSQL Database Connection Pool
const { Pool } = require('pg');

let pool = null;
let isConnected = false;

// Initialize connection pool
function initPool() {
    if (!process.env.DATABASE_URL) {
        console.log('[DB] No DATABASE_URL found, database features disabled');
        return null;
    }

    try {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        // Test connection
        pool.on('connect', () => {
            isConnected = true;
            console.log('[DB] Connected to PostgreSQL');
        });

        pool.on('error', (err) => {
            console.error('[DB] Pool error:', err.message);
            isConnected = false;
        });

        return pool;
    } catch (error) {
        console.error('[DB] Failed to initialize pool:', error.message);
        return null;
    }
}

// Query helper with logging
async function query(text, params = []) {
    if (!pool) {
        throw new Error('Database not initialized');
    }

    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        if (duration > 100) {
            console.log(`[DB] Slow query (${duration}ms):`, text.substring(0, 100));
        }
        return result;
    } catch (error) {
        console.error('[DB] Query error:', error.message);
        console.error('[DB] Query:', text.substring(0, 200));
        throw error;
    }
}

// Check if database is available
async function isAvailable() {
    if (!pool) return false;

    try {
        await pool.query('SELECT 1');
        isConnected = true;
        return true;
    } catch (error) {
        isConnected = false;
        return false;
    }
}

// Get pool instance
function getPool() {
    return pool;
}

// Close pool
async function close() {
    if (pool) {
        await pool.end();
        pool = null;
        isConnected = false;
        console.log('[DB] Connection pool closed');
    }
}

// Initialize tables if they don't exist
async function initTables() {
    if (!pool) return false;

    try {
        // Create debates table
        await query(`
            CREATE TABLE IF NOT EXISTS debates (
                id SERIAL PRIMARY KEY,
                share_id VARCHAR(100) UNIQUE NOT NULL,
                question TEXT NOT NULL,
                context TEXT,
                timestamp TIMESTAMPTZ DEFAULT NOW(),
                consensus_reached BOOLEAN,
                consensus_type VARCHAR(50),
                consensus_decision VARCHAR(50),
                consensus_position TEXT,
                rounds JSONB NOT NULL DEFAULT '[]',
                final_consensus JSONB,
                action_plan JSONB,
                total_cost DECIMAL(10, 6),
                llms_used TEXT[],
                tier VARCHAR(20),
                user_id VARCHAR(100),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        // Create users table
        await query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(100) UNIQUE NOT NULL,
                tier VARCHAR(20) DEFAULT 'free',
                stripe_customer_id VARCHAR(100),
                total_debates INTEGER DEFAULT 0,
                daily_usage JSONB DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        // Create indexes
        await query(`CREATE INDEX IF NOT EXISTS idx_debates_share_id ON debates(share_id)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_debates_user_id ON debates(user_id)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_debates_timestamp ON debates(timestamp DESC)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id)`);

        console.log('[DB] Tables initialized successfully');
        return true;
    } catch (error) {
        console.error('[DB] Failed to initialize tables:', error.message);
        return false;
    }
}

module.exports = {
    initPool,
    query,
    isAvailable,
    getPool,
    close,
    initTables
};
