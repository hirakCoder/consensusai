/**
 * Reporter Module - Handles all console output and report generation
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function c(color, text) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printLine(char = '=', length = 70) {
  console.log(char.repeat(length));
}

function printHeader() {
  console.log('\n');
  printLine('=');
  console.log(c('cyan', '    MULTI-LLM CONSENSUS DEBATE PLATFORM'));
  printLine('=');
  console.log('');
}

function printDebateStart(question, context, clients, maxRounds) {
  console.log(c('bright', 'Question: ') + question);
  if (context) {
    console.log(c('dim', 'Context: ') + context);
  }
  console.log('');
  console.log(c('dim', 'Settings:'));
  console.log(`   - LLMs: ${clients.map(c => c.name).join(', ')}`);
  console.log(`   - Max Rounds: ${maxRounds}`);
  console.log('');
  console.log(c('green', 'Starting debate...\n'));
}

function printRoundHeader(roundNumber) {
  console.log('');
  printLine('-');
  const title = roundNumber === 1 ? 'ROUND 1: Initial Positions' : `ROUND ${roundNumber}: Debate & Reconsider`;
  console.log(c('bright', title));
  printLine('-');
  console.log('');
}

function makeProgressBar(confidence, maxWidth = 10) {
  const filled = Math.round((confidence / 10) * maxWidth);
  const empty = maxWidth - filled;
  return c('green', '█'.repeat(filled)) + c('dim', '░'.repeat(empty));
}

function printLLMResponse(response, showChange = false) {
  const bar = makeProgressBar(response.confidence);

  console.log(`${c('cyan', response.llmName)} ${bar}`);

  let positionLine = `   Position: ${response.position}`;
  if (showChange && response.changed) {
    positionLine += c('yellow', ' <- CHANGED');
  }
  console.log(positionLine);

  console.log(`   Confidence: ${response.confidence}/10`);
  console.log(`   Key Argument: "${response.key_argument || 'See reasoning'}"`);

  if (showChange && response.response_to_others) {
    const responseText = typeof response.response_to_others === 'string'
      ? response.response_to_others
      : JSON.stringify(response.response_to_others);
    console.log(c('dim', `   Response to others: "${responseText.substring(0, 100)}..."`));
  }

  console.log('');
}

function printRoundSummary(roundNumber, consensus, responses) {
  const validResponses = responses.filter(r => !r.error);

  if (consensus.reached) {
    console.log(c('green', `Round ${roundNumber}: CONSENSUS REACHED (${consensus.type})`));
  } else {
    const uniquePositions = consensus.positions?.length || 'multiple';
    console.log(c('yellow', `Round ${roundNumber}: No consensus (${uniquePositions}-way split)`));
  }
  console.log('');
}

function printFinalDecision(report) {
  const consensus = report.finalConsensus;

  console.log('\n');
  printLine('=');
  console.log(c('bright', '                    FINAL DECISION'));
  printLine('=');
  console.log('');

  if (consensus.reached) {
    console.log(c('green', `   RECOMMENDATION: ${consensus.position}`));
    console.log('');
    console.log(`   Consensus: ${consensus.type} (after Round ${report.rounds.length})`);
    console.log(`   Average Confidence: ${consensus.confidence}/10`);
  } else {
    // Split decision
    const majority = consensus.majority;
    if (majority && majority.position) {
      console.log(c('yellow', `   SPLIT DECISION - Majority Recommendation: ${majority.position}`));
      console.log('');
      const positionSummary = consensus.positions?.map(p => `${p.position} (${p.count} votes)`).join(' vs ') || 'N/A';
      console.log(`   Split: ${positionSummary}`);
      const majorityConf = majority.responses?.[0]?.confidence || 'N/A';
      console.log(`   Majority Confidence: ${majorityConf}/10`);
    } else {
      // Handle case where only one LLM responded successfully
      const lastRound = report.rounds[report.rounds.length - 1];
      const validResponses = lastRound?.results?.filter(r => !r.error) || [];
      if (validResponses.length > 0) {
        const best = validResponses[0];
        console.log(c('yellow', `   RECOMMENDATION (single respondent): ${best.position}`));
        console.log('');
        console.log(`   Note: Only ${validResponses.length} LLM(s) responded successfully`);
        console.log(`   Confidence: ${best.confidence}/10`);
      } else {
        console.log(c('red', '   No valid responses received from any LLM.'));
      }
    }
  }

  console.log('');
  console.log(c('dim', '   Summary:'));

  // Get all unique reasonings
  const lastRound = report.rounds[report.rounds.length - 1];
  const reasonings = lastRound.results
    .filter(r => !r.error)
    .map(r => `   - ${r.llmName}: ${r.key_argument || r.reasoning?.substring(0, 80) || 'No reasoning provided'}`)
    .join('\n');

  console.log(reasonings);

  console.log('');
  console.log(c('dim', `   Total Cost: $${report.totalCost.toFixed(4)}`));

  printLine('=');
  console.log('');
}

function printError(llmName, message) {
  console.log(c('red', `${llmName} ERROR: ${message}`));
}

function printWarning(message) {
  console.log(c('yellow', `Warning: ${message}`));
}

function printInfo(message) {
  console.log(c('dim', message));
}

function printEstimate(estimate) {
  console.log('');
  console.log(c('bright', 'Cost Estimate:'));
  console.log(`   LLMs: ${estimate.clients.join(', ')}`);
  console.log(`   Estimated Cost: $${estimate.min.toFixed(2)} - $${estimate.max.toFixed(2)}`);
  console.log('');
}

/**
 * Save report to JSON file
 */
function saveToJson(report) {
  if (!config.output.saveToJson) return null;

  const dir = path.resolve(config.output.decisionsDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const slug = report.question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .substring(0, 50);

  const filename = `${timestamp}-${slug}.json`;
  const filepath = path.join(dir, filename);

  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));

  return filepath;
}

/**
 * Save report to Markdown file
 */
function saveToMarkdown(report) {
  if (!config.output.saveToMarkdown) return null;

  const dir = path.resolve(config.output.decisionsDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const slug = report.question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .substring(0, 50);

  const filename = `${timestamp}-${slug}.md`;
  const filepath = path.join(dir, filename);

  const consensus = report.finalConsensus;

  let md = `# Decision: ${report.question}\n\n`;
  md += `**Date:** ${timestamp}\n`;
  md += `**LLMs Used:** ${report.llmsUsed.join(', ')}\n`;
  md += `**Total Cost:** $${report.totalCost.toFixed(4)}\n\n`;

  if (report.context) {
    md += `## Context\n\n${report.context}\n\n`;
  }

  md += `## Final Decision\n\n`;

  if (consensus.reached) {
    md += `**Recommendation:** ${consensus.position}\n\n`;
    md += `- Consensus Type: ${consensus.type}\n`;
    md += `- Rounds to Consensus: ${report.rounds.length}\n`;
    md += `- Average Confidence: ${consensus.confidence}/10\n\n`;
  } else {
    const majorityPosition = consensus.majority?.position || 'No clear majority';
    md += `**Split Decision - Majority View:** ${majorityPosition}\n\n`;
    if (consensus.positions && consensus.positions.length > 0) {
      md += `- Votes: ${consensus.positions.map(p => `${p.position} (${p.count})`).join(' vs ')}\n\n`;
    }
  }

  md += `## Debate Rounds\n\n`;

  for (const round of report.rounds) {
    md += `### Round ${round.roundNumber}\n\n`;

    for (const result of round.results) {
      if (result.error) continue;

      md += `#### ${result.llmName}\n\n`;
      md += `- **Position:** ${result.position}`;
      if (result.changed) md += ' *(changed)*';
      md += `\n`;
      md += `- **Confidence:** ${result.confidence}/10\n`;
      md += `- **Key Argument:** ${result.key_argument || 'N/A'}\n`;

      if (result.reasoning) {
        md += `\n${result.reasoning}\n`;
      }

      if (result.response_to_others) {
        md += `\n*Response to others:* ${result.response_to_others}\n`;
      }

      md += '\n';
    }
  }

  fs.writeFileSync(filepath, md);

  return filepath;
}

/**
 * Save both formats and print paths
 */
function saveReport(report) {
  const jsonPath = saveToJson(report);
  const mdPath = saveToMarkdown(report);

  if (jsonPath || mdPath) {
    console.log(c('dim', 'Saved to:'));
    if (jsonPath) console.log(c('dim', `   ${jsonPath}`));
    if (mdPath) console.log(c('dim', `   ${mdPath}`));
    console.log('');
  }

  return { jsonPath, mdPath };
}

module.exports = {
  printHeader,
  printDebateStart,
  printRoundHeader,
  printLLMResponse,
  printRoundSummary,
  printFinalDecision,
  printError,
  printWarning,
  printInfo,
  printEstimate,
  saveToJson,
  saveToMarkdown,
  saveReport
};
