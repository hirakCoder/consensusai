#!/usr/bin/env node

/**
 * Multi-LLM Consensus Debate Platform
 * Main Entry Point
 */

const DebateEngine = require('./debate-engine');
const reporter = require('./reporter');
const history = require('./history');
const cli = require('./cli');
const config = require('./config');

async function main() {
  const args = cli.parseArgs(process.argv.slice(2));

  // Show help
  if (args.help) {
    cli.printHelp();
    return;
  }

  // Print header
  reporter.printHeader();

  // Check for configured LLMs
  const { getConfiguredClients } = require('./llm-clients');
  const clients = getConfiguredClients();

  if (clients.length === 0) {
    console.log('\x1b[31mError: No LLM API keys configured.\x1b[0m\n');
    console.log('Please edit config.js and add your API keys:');
    console.log('  - OPENAI_API_KEY (or set in config.js)');
    console.log('  - GEMINI_API_KEY (or set in config.js)');
    console.log('  - XAI_API_KEY (or set in config.js)\n');
    console.log('Or set them as environment variables before running.\n');
    return;
  }

  // View history
  if (args.history) {
    const decisions = history.getAllDecisions();
    history.printHistory(decisions);

    const selected = await cli.selectFromHistory(decisions);
    if (selected) {
      cli.printDecisionDetail(selected);
    }
    return;
  }

  // Search history
  if (args.search) {
    const results = history.searchDecisions(args.search);
    console.log(`\nSearch results for "${args.search}":\n`);
    history.printHistory(results);
    return;
  }

  // Estimate mode
  if (args.estimate) {
    const engine = new DebateEngine();
    const estimate = engine.estimateCost();
    reporter.printEstimate(estimate);
    return;
  }

  // Get question - either from args or interactively
  let question = args.question;
  let context = args.context || '';

  if (!question) {
    const input = await cli.interactiveMode();
    if (!input) return;
    question = input.question;
    context = input.context;
  }

  // Run debate
  try {
    const engine = new DebateEngine();

    // Show estimate before running
    const estimate = engine.estimateCost();
    console.log(`\x1b[2mEstimated cost: $${estimate.min.toFixed(2)} - $${estimate.max.toFixed(2)}\x1b[0m\n`);

    const report = await engine.run(question, context);

    // Save results
    reporter.saveReport(report);

  } catch (error) {
    console.log(`\x1b[31mError: ${error.message}\x1b[0m`);
    if (args.verbose) {
      console.error(error.stack);
    }
    return;
  }

  // Ask to continue
  const shouldContinue = await cli.askContinue();
  if (shouldContinue) {
    console.clear();
    await main();
  }
}

// Run
main().catch(console.error);
