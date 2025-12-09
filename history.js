/**
 * History Module - Save/Load past decisions
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');

const decisionsDir = path.resolve(config.output.decisionsDir);

/**
 * Ensure decisions directory exists
 */
function ensureDir() {
  if (!fs.existsSync(decisionsDir)) {
    fs.mkdirSync(decisionsDir, { recursive: true });
  }
}

/**
 * Get all past decisions
 */
function getAllDecisions() {
  ensureDir();

  const files = fs.readdirSync(decisionsDir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse(); // Most recent first

  return files.map(filename => {
    try {
      const filepath = path.join(decisionsDir, filename);
      const content = fs.readFileSync(filepath, 'utf-8');
      const data = JSON.parse(content);
      return {
        filename,
        filepath,
        ...data
      };
    } catch (e) {
      return null;
    }
  }).filter(Boolean);
}

/**
 * Get a specific decision by filename
 */
function getDecision(filename) {
  const filepath = path.join(decisionsDir, filename);

  if (!fs.existsSync(filepath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}

/**
 * Search decisions by keyword
 */
function searchDecisions(keyword) {
  const allDecisions = getAllDecisions();
  const lowerKeyword = keyword.toLowerCase();

  return allDecisions.filter(decision => {
    const questionMatch = decision.question?.toLowerCase().includes(lowerKeyword);
    const contextMatch = decision.context?.toLowerCase().includes(lowerKeyword);
    const positionMatch = decision.finalConsensus?.position?.toLowerCase().includes(lowerKeyword);

    return questionMatch || contextMatch || positionMatch;
  });
}

/**
 * Delete a decision
 */
function deleteDecision(filename) {
  const jsonPath = path.join(decisionsDir, filename);
  const mdPath = jsonPath.replace('.json', '.md');

  let deleted = false;

  if (fs.existsSync(jsonPath)) {
    fs.unlinkSync(jsonPath);
    deleted = true;
  }

  if (fs.existsSync(mdPath)) {
    fs.unlinkSync(mdPath);
    deleted = true;
  }

  return deleted;
}

/**
 * Print history in a nice format
 */
function printHistory(decisions, limit = 10) {
  const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m'
  };

  if (decisions.length === 0) {
    console.log(`${colors.dim}No past decisions found.${colors.reset}`);
    return;
  }

  console.log(`\n${colors.bright}Past Decisions:${colors.reset}\n`);

  const display = decisions.slice(0, limit);

  display.forEach((d, i) => {
    const date = d.timestamp?.split('T')[0] || 'Unknown date';
    const consensus = d.finalConsensus;
    const status = consensus?.reached
      ? `${colors.green}${consensus.type}${colors.reset}`
      : `${colors.yellow}split${colors.reset}`;

    console.log(`${colors.cyan}${i + 1}.${colors.reset} [${date}] ${status}`);
    console.log(`   ${colors.bright}Q:${colors.reset} ${d.question?.substring(0, 60)}${d.question?.length > 60 ? '...' : ''}`);
    console.log(`   ${colors.dim}A:${colors.reset} ${consensus?.position?.substring(0, 60) || consensus?.majority?.position?.substring(0, 60) || 'N/A'}`);
    console.log(`   ${colors.dim}File: ${d.filename}${colors.reset}`);
    console.log('');
  });

  if (decisions.length > limit) {
    console.log(`${colors.dim}... and ${decisions.length - limit} more decisions${colors.reset}\n`);
  }
}

/**
 * Get stats about past decisions
 */
function getStats() {
  const decisions = getAllDecisions();

  if (decisions.length === 0) {
    return {
      total: 0,
      consensusReached: 0,
      splitDecisions: 0,
      totalCost: 0,
      averageRounds: 0
    };
  }

  const stats = {
    total: decisions.length,
    consensusReached: decisions.filter(d => d.finalConsensus?.reached).length,
    splitDecisions: decisions.filter(d => !d.finalConsensus?.reached).length,
    totalCost: decisions.reduce((sum, d) => sum + (d.totalCost || 0), 0),
    averageRounds: decisions.reduce((sum, d) => sum + (d.rounds?.length || 0), 0) / decisions.length
  };

  return stats;
}

module.exports = {
  getAllDecisions,
  getDecision,
  searchDecisions,
  deleteDecision,
  printHistory,
  getStats
};
