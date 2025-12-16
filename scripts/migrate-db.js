#!/usr/bin/env node

// Database Migration Script
// Migrates existing file-based data to PostgreSQL

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../db');

const DECISIONS_DIR = path.join(__dirname, '..', 'decisions');
const USAGE_FILE = path.join(__dirname, '..', 'data', 'usage.json');

async function migrate() {
    console.log('=== Database Migration Script ===\n');

    // Check for DATABASE_URL
    if (!process.env.DATABASE_URL) {
        console.error('ERROR: DATABASE_URL environment variable not set');
        console.log('Please set DATABASE_URL in your .env file or environment');
        process.exit(1);
    }

    // Initialize database
    console.log('Connecting to database...');
    db.initPool();

    // Wait a moment for connection
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check connection
    const available = await db.isAvailable();
    if (!available) {
        console.error('ERROR: Could not connect to database');
        process.exit(1);
    }
    console.log('✓ Connected to PostgreSQL\n');

    // Initialize tables
    console.log('Initializing tables...');
    const tablesCreated = await db.initTables();
    if (!tablesCreated) {
        console.error('ERROR: Could not create tables');
        process.exit(1);
    }
    console.log('✓ Tables initialized\n');

    // Migrate debates
    await migrateDebates();

    // Migrate users
    await migrateUsers();

    console.log('\n=== Migration Complete ===');
    await db.close();
    process.exit(0);
}

async function migrateDebates() {
    console.log('Migrating debates...');

    if (!fs.existsSync(DECISIONS_DIR)) {
        console.log('  No decisions directory found, skipping debate migration');
        return;
    }

    const files = fs.readdirSync(DECISIONS_DIR).filter(f => f.endsWith('.json'));
    console.log(`  Found ${files.length} debate files`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const file of files) {
        try {
            const filePath = path.join(DECISIONS_DIR, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

            // Generate share ID from filename
            const shareId = file.replace('.json', '');

            // Extract consensus info
            const lastRound = data.rounds?.[data.rounds.length - 1];
            const consensus = lastRound?.consensus || {};

            // Build debate object
            const debate = {
                shareId,
                question: data.question || 'Unknown',
                context: data.context || null,
                timestamp: data.timestamp || new Date().toISOString(),
                consensusReached: consensus.reached || false,
                consensusType: consensus.type || null,
                consensusDecision: consensus.decision || null,
                consensusPosition: consensus.position || null,
                rounds: data.rounds || [],
                finalConsensus: data.finalConsensus || consensus || null,
                actionPlan: data.actionPlan || null,
                totalCost: data.totalCost || calculateTotalCost(data.rounds),
                llmsUsed: extractLLMs(data.rounds),
                tier: data.tier || 'budget',
                userId: null
            };

            // Insert into database
            await db.query(`
                INSERT INTO debates (
                    share_id, question, context, timestamp,
                    consensus_reached, consensus_type, consensus_decision, consensus_position,
                    rounds, final_consensus, action_plan,
                    total_cost, llms_used, tier, user_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                ON CONFLICT (share_id) DO NOTHING
            `, [
                debate.shareId,
                debate.question,
                debate.context,
                debate.timestamp,
                debate.consensusReached,
                debate.consensusType,
                debate.consensusDecision,
                debate.consensusPosition,
                JSON.stringify(debate.rounds),
                debate.finalConsensus ? JSON.stringify(debate.finalConsensus) : null,
                debate.actionPlan ? JSON.stringify(debate.actionPlan) : null,
                debate.totalCost,
                debate.llmsUsed,
                debate.tier,
                debate.userId
            ]);

            migrated++;
        } catch (error) {
            console.error(`  Error migrating ${file}: ${error.message}`);
            errors++;
        }
    }

    console.log(`  ✓ Migrated: ${migrated}, Skipped: ${skipped}, Errors: ${errors}`);
}

async function migrateUsers() {
    console.log('Migrating users...');

    if (!fs.existsSync(USAGE_FILE)) {
        console.log('  No usage.json found, skipping user migration');
        return;
    }

    try {
        const data = JSON.parse(fs.readFileSync(USAGE_FILE, 'utf-8'));
        const users = data.users || {};

        let migrated = 0;
        let errors = 0;

        for (const [userId, userData] of Object.entries(users)) {
            try {
                await db.query(`
                    INSERT INTO users (user_id, tier, total_debates, daily_usage)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (user_id) DO UPDATE SET
                        tier = EXCLUDED.tier,
                        total_debates = EXCLUDED.total_debates,
                        daily_usage = EXCLUDED.daily_usage
                `, [
                    userId,
                    userData.tier || 'free',
                    userData.totalDebates || 0,
                    JSON.stringify(userData.dailyUsage || {})
                ]);
                migrated++;
            } catch (error) {
                console.error(`  Error migrating user ${userId}: ${error.message}`);
                errors++;
            }
        }

        console.log(`  ✓ Migrated: ${migrated}, Errors: ${errors}`);
    } catch (error) {
        console.error(`  Error reading usage.json: ${error.message}`);
    }
}

function calculateTotalCost(rounds) {
    if (!rounds) return 0;

    let total = 0;
    for (const round of rounds) {
        if (round.results) {
            for (const result of round.results) {
                total += result.cost || 0;
            }
        }
    }
    return total;
}

function extractLLMs(rounds) {
    if (!rounds) return [];

    const llms = new Set();
    for (const round of rounds) {
        if (round.results) {
            for (const result of round.results) {
                if (result.llmId) {
                    llms.add(result.llmId);
                }
            }
        }
    }
    return Array.from(llms);
}

// Run migration
migrate().catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
});
