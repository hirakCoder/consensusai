#!/usr/bin/env node

/**
 * Migration: Add cost tracking columns to existing database
 * Run this once to update existing databases with new columns
 */

require('dotenv').config();
const db = require('../db');

async function migrate() {
    console.log('=== Adding Cost Tracking Columns ===\n');

    if (!process.env.DATABASE_URL) {
        console.error('ERROR: DATABASE_URL not set');
        process.exit(1);
    }

    db.initPool();
    await new Promise(resolve => setTimeout(resolve, 1000));

    const available = await db.isAvailable();
    if (!available) {
        console.error('ERROR: Could not connect to database');
        process.exit(1);
    }
    console.log('✓ Connected to PostgreSQL\n');

    try {
        // Add columns to users table (IF NOT EXISTS equivalent for columns)
        console.log('Adding columns to users table...');

        const alterQueries = [
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS total_cost_incurred DECIMAL(10, 4) DEFAULT 0`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_cost DECIMAL(10, 4) DEFAULT 0`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS cost_by_provider JSONB DEFAULT '{"openai": 0, "gemini": 0, "claude": 0, "grok": 0}'`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_debate_at TIMESTAMPTZ`
        ];

        for (const query of alterQueries) {
            try {
                await db.query(query);
                console.log('  ✓', query.split(' ')[5]); // Column name
            } catch (error) {
                if (error.message.includes('already exists')) {
                    console.log('  - Column already exists, skipping');
                } else {
                    console.error('  ✗ Error:', error.message);
                }
            }
        }

        // Create api_costs table
        console.log('\nCreating api_costs table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS api_costs (
                id SERIAL PRIMARY KEY,
                date DATE NOT NULL,
                provider VARCHAR(20) NOT NULL,
                total_cost DECIMAL(10, 6) DEFAULT 0,
                total_tokens INTEGER DEFAULT 0,
                request_count INTEGER DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(date, provider)
            )
        `);
        console.log('  ✓ api_costs table created');

        // Create indexes
        await db.query(`CREATE INDEX IF NOT EXISTS idx_api_costs_date ON api_costs(date DESC)`);
        await db.query(`CREATE INDEX IF NOT EXISTS idx_api_costs_provider ON api_costs(provider)`);
        console.log('  ✓ Indexes created');

        // Backfill cost data from existing debates
        console.log('\nBackfilling cost data from existing debates...');
        const result = await db.query(`
            SELECT user_id, SUM(total_cost) as total_cost
            FROM debates
            WHERE user_id IS NOT NULL AND total_cost > 0
            GROUP BY user_id
        `);

        let updated = 0;
        for (const row of result.rows) {
            await db.query(`
                UPDATE users
                SET total_cost_incurred = $1, updated_at = NOW()
                WHERE user_id = $2
            `, [row.total_cost, row.user_id]);
            updated++;
        }
        console.log(`  ✓ Updated ${updated} users with historical costs`);

        console.log('\n=== Migration Complete ===');
    } catch (error) {
        console.error('Migration error:', error.message);
    }

    await db.close();
    process.exit(0);
}

migrate();
