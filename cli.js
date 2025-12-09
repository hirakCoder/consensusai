/**
 * CLI Interface - Interactive command-line interface
 */

const readline = require('readline');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function c(color, text) {
  return `${colors[color]}${text}${colors.reset}`;
}

/**
 * Create readline interface
 */
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Ask a question and get response
 */
function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * Ask yes/no question
 */
async function askYesNo(rl, question) {
  const answer = await ask(rl, `${question} (y/n): `);
  return answer.toLowerCase().startsWith('y');
}

/**
 * Interactive mode - get question and context from user
 */
async function interactiveMode() {
  const rl = createInterface();

  console.log('');
  console.log(c('cyan', 'Enter your decision/question:'));
  const question = await ask(rl, c('green', '> '));

  if (!question) {
    console.log(c('red', 'No question provided. Exiting.'));
    rl.close();
    return null;
  }

  console.log('');
  console.log(c('dim', 'Any context or constraints? (optional, press Enter to skip):'));
  const context = await ask(rl, c('green', '> '));

  rl.close();

  return { question, context };
}

/**
 * Ask if user wants to continue
 */
async function askContinue() {
  const rl = createInterface();
  const answer = await askYesNo(rl, '\nRun another debate?');
  rl.close();
  return answer;
}

/**
 * Show history selection menu
 */
async function selectFromHistory(decisions) {
  if (decisions.length === 0) {
    console.log(c('dim', 'No past decisions found.'));
    return null;
  }

  const rl = createInterface();

  console.log('\n' + c('bright', 'Select a past decision to view:\n'));

  decisions.slice(0, 10).forEach((d, i) => {
    const date = d.timestamp?.split('T')[0] || 'Unknown';
    console.log(`  ${c('cyan', i + 1 + '.')} [${date}] ${d.question?.substring(0, 50)}...`);
  });

  console.log(`  ${c('dim', '0.')} Cancel\n`);

  const answer = await ask(rl, c('green', 'Enter number: '));
  rl.close();

  const num = parseInt(answer);
  if (isNaN(num) || num === 0 || num > decisions.length) {
    return null;
  }

  return decisions[num - 1];
}

/**
 * Parse command-line arguments
 */
function parseArgs(args) {
  const result = {
    question: null,
    context: null,
    history: false,
    search: null,
    estimate: false,
    help: false,
    verbose: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--question':
      case '-q':
        result.question = args[++i];
        break;
      case '--context':
      case '-c':
        result.context = args[++i];
        break;
      case '--history':
      case '-h':
        result.history = true;
        break;
      case '--search':
      case '-s':
        result.search = args[++i];
        break;
      case '--estimate':
      case '-e':
        result.estimate = true;
        break;
      case '--help':
        result.help = true;
        break;
      case '--verbose':
      case '-v':
        result.verbose = true;
        break;
      default:
        // If no flag, assume it's the question
        if (!arg.startsWith('-') && !result.question) {
          result.question = arg;
        }
    }
  }

  return result;
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
${c('bright', 'Multi-LLM Consensus Debate Platform')}

${c('cyan', 'Usage:')}
  node run.js                           Interactive mode
  node run.js --question "..."          Direct question mode
  node run.js --question "..." --context "..."  With context
  node run.js --history                 View past decisions
  node run.js --search "keyword"        Search past decisions
  node run.js --estimate                Show cost estimate only

${c('cyan', 'Options:')}
  -q, --question <text>    The question or decision to debate
  -c, --context <text>     Additional context or constraints
  -h, --history            View past decisions
  -s, --search <keyword>   Search past decisions
  -e, --estimate           Show estimated cost without running
  -v, --verbose            Show detailed output
      --help               Show this help message

${c('cyan', 'Examples:')}
  node run.js --question "Should I learn Rust or Go?"
  node run.js -q "Buy or rent?" -c "Living in SF, income 150k"
  node run.js --history
  node run.js --search "investment"

${c('cyan', 'Configuration:')}
  Edit config.js to:
  - Add your API keys (OpenAI, Gemini, Grok)
  - Adjust cost limits
  - Change consensus threshold
  - Enable/disable specific LLMs
`);
}

/**
 * Print a decision in detail
 */
function printDecisionDetail(decision) {
  console.log('\n' + '='.repeat(70));
  console.log(c('bright', 'Question: ') + decision.question);
  if (decision.context) {
    console.log(c('dim', 'Context: ') + decision.context);
  }
  console.log(c('dim', 'Date: ') + (decision.timestamp?.split('T')[0] || 'Unknown'));
  console.log(c('dim', 'LLMs: ') + (decision.llmsUsed?.join(', ') || 'Unknown'));
  console.log('');

  const consensus = decision.finalConsensus;
  if (consensus?.reached) {
    console.log(c('green', 'Consensus: ') + consensus.position);
    console.log(c('dim', `Type: ${consensus.type}, Confidence: ${consensus.confidence}/10`));
  } else {
    console.log(c('yellow', 'Split Decision'));
    console.log(c('dim', 'Majority: ') + (consensus?.majority?.position || 'N/A'));
  }

  console.log('\n' + c('bright', 'Rounds:'));
  decision.rounds?.forEach(round => {
    console.log(`\n  ${c('cyan', 'Round ' + round.roundNumber)}:`);
    round.results?.forEach(r => {
      if (r.error) return;
      const changed = r.changed ? c('yellow', ' (changed)') : '';
      console.log(`    ${r.llmName}: ${r.position}${changed}`);
    });
  });

  console.log('\n' + '='.repeat(70));
}

module.exports = {
  createInterface,
  ask,
  askYesNo,
  interactiveMode,
  askContinue,
  selectFromHistory,
  parseArgs,
  printHelp,
  printDecisionDetail
};
