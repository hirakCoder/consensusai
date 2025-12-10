/**
 * Core Debate Engine with Consensus Logic
 * Now with real-time progress callbacks
 */

const config = require('./config');
const { getConfiguredClients } = require('./llm-clients');
const { getRound1Prompt, getDebateRoundPrompt, getSynthesisPrompt, detectQuestionType } = require('./prompts');
const reporter = require('./reporter');

class DebateEngine {
  constructor(options = {}) {
    this.maxRounds = options.maxRounds || config.debate.maxRounds;
    this.consensusThreshold = options.consensusThreshold || config.debate.consensusThreshold;

    // Get all clients and filter by selectedAIs if provided
    let allClients = getConfiguredClients();
    if (options.selectedAIs && Array.isArray(options.selectedAIs) && options.selectedAIs.length >= 2) {
      this.clients = allClients.filter(client => options.selectedAIs.includes(client.id));
      // Ensure at least 2 clients
      if (this.clients.length < 2) {
        this.clients = allClients;
      }
    } else {
      this.clients = allClients;
    }

    // Store custom personas
    this.personas = options.personas || {};

    this.totalCost = 0;
    this.rounds = [];
    this.question = '';
    this.context = '';
    this.onProgress = null; // Progress callback

    // Token tracking
    this.tokenUsage = {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      byLLM: {},
      byRound: []
    };
  }

  /**
   * Emit progress event
   */
  emitProgress(event, data) {
    if (this.onProgress && typeof this.onProgress === 'function') {
      this.onProgress({ event, ...data, timestamp: Date.now() });
    }
  }

  /**
   * Estimate cost before running
   */
  estimateCost() {
    const estimatedPromptTokens = 500;
    let totalEstimate = 0;

    for (const client of this.clients) {
      const perRoundCost = client.estimateCost(estimatedPromptTokens);
      totalEstimate += perRoundCost * this.maxRounds;
    }

    return {
      min: totalEstimate * 0.5,
      max: totalEstimate * 1.5,
      clients: this.clients.map(c => c.name)
    };
  }

  /**
   * Run a single LLM call (for individual tracking)
   */
  async callLLM(client, prompt, roundNumber, previousResponse) {
    const startTime = Date.now();

    // Emit that this LLM is starting
    this.emitProgress('llm_start', {
      llmId: client.id,
      llmName: client.name,
      round: roundNumber
    });

    try {
      const response = await client.call(prompt);

      // Extract token info
      const tokens = response._meta?.tokens || {};
      const inputTokens = tokens.prompt_tokens || tokens.input_tokens || 0;
      const outputTokens = tokens.completion_tokens || tokens.output_tokens || 0;

      const result = {
        llmId: client.id,
        llmName: client.name,
        decision: response.decision || 'UNKNOWN', // Structured decision (YES/NO/CONDITIONAL/WAIT/ALTERNATIVE)
        position: response.position,
        confidence: response.confidence || 5,
        reasoning: response.reasoning,
        key_argument: response.key_argument,
        risks: response.risks || [],
        assumptions: response.assumptions || [],
        changed: response.changed || false,
        response_to_others: response.response_to_others,
        cost: response._meta?.cost || 0,
        tokens: { input: inputTokens, output: outputTokens },
        duration: Date.now() - startTime
      };

      this.totalCost += result.cost;

      // Track tokens
      this.tokenUsage.totalInputTokens += inputTokens;
      this.tokenUsage.totalOutputTokens += outputTokens;

      if (!this.tokenUsage.byLLM[client.id]) {
        this.tokenUsage.byLLM[client.id] = { input: 0, output: 0, calls: 0 };
      }
      this.tokenUsage.byLLM[client.id].input += inputTokens;
      this.tokenUsage.byLLM[client.id].output += outputTokens;
      this.tokenUsage.byLLM[client.id].calls += 1;

      // Log token usage
      reporter.printInfo(`  ${client.name}: ${inputTokens} input + ${outputTokens} output tokens ($${result.cost.toFixed(4)})`);

      // Emit that this LLM completed
      this.emitProgress('llm_complete', {
        llmId: client.id,
        llmName: client.name,
        round: roundNumber,
        result: {
          decision: result.decision,
          position: result.position,
          confidence: result.confidence,
          reasoning: result.reasoning,
          key_argument: result.key_argument,
          risks: result.risks,
          changed: result.changed,
          response_to_others: result.response_to_others
        },
        tokens: { input: inputTokens, output: outputTokens },
        cost: result.cost
      });

      return result;
    } catch (error) {
      reporter.printError(client.name, error.message);

      // Emit error
      this.emitProgress('llm_error', {
        llmId: client.id,
        llmName: client.name,
        round: roundNumber,
        error: error.message
      });

      return {
        llmId: client.id,
        llmName: client.name,
        position: 'ERROR',
        confidence: 0,
        reasoning: error.message,
        error: true
      };
    }
  }

  /**
   * Run a single round of the debate
   */
  async runRound(roundNumber, previousResponses = null) {
    reporter.printRoundHeader(roundNumber);

    // Emit round start
    this.emitProgress('round_start', {
      round: roundNumber,
      totalRounds: this.maxRounds,
      llms: this.clients.map(c => ({ id: c.id, name: c.name }))
    });

    const roundResults = [];

    // Prepare prompts for all clients
    const clientPrompts = this.clients.map(client => {
      let prompt;
      let previousResponse = null;

      if (roundNumber === 1) {
        prompt = getRound1Prompt(this.question, this.context);
      } else {
        previousResponse = previousResponses.find(r => r.llmId === client.id);
        const otherResponses = previousResponses
          .filter(r => r.llmId !== client.id)
          .map(r => ({
            llmName: r.llmName,
            position: r.position,
            confidence: r.confidence,
            reasoning: r.reasoning,
            key_argument: r.key_argument
          }));

        prompt = getDebateRoundPrompt(
          this.question,
          this.context,
          roundNumber,
          previousResponse,
          otherResponses
        );
      }

      return { client, prompt, previousResponse };
    });

    // Run all LLM calls in parallel but emit updates as each completes
    const promises = clientPrompts.map(({ client, prompt, previousResponse }) =>
      this.callLLM(client, prompt, roundNumber, previousResponse)
    );

    const results = await Promise.all(promises);

    // Print results
    for (const result of results) {
      if (!result.error) {
        reporter.printLLMResponse(result, roundNumber > 1);
      }
    }

    // Check for consensus
    const consensus = this.checkConsensus(results);

    // Emit round complete
    this.emitProgress('round_complete', {
      round: roundNumber,
      results: results.map(r => ({
        llmId: r.llmId,
        llmName: r.llmName,
        decision: r.decision,
        position: r.position,
        confidence: r.confidence,
        reasoning: r.reasoning,
        key_argument: r.key_argument,
        changed: r.changed,
        error: r.error
      })),
      consensus: {
        reached: consensus.reached,
        type: consensus.type,
        decision: consensus.decision
      }
    });

    reporter.printRoundSummary(roundNumber, consensus, results);

    return {
      roundNumber,
      results,
      consensus
    };
  }

  /**
   * Check if consensus has been reached using structured decisions
   */
  checkConsensus(responses) {
    const validResponses = responses.filter(r => !r.error);

    if (validResponses.length < 2) {
      return { reached: false, type: 'insufficient', decisions: {} };
    }

    // Normalize decision to uppercase and handle variations
    const normalizeDecision = (decision) => {
      if (!decision) return 'UNKNOWN';
      const d = decision.toUpperCase().trim();
      // Map common variations
      if (d.includes('YES') || d.includes('PROCEED') || d.includes('APPROVE')) return 'YES';
      if (d.includes('NO') || d.includes('REJECT') || d.includes('DECLINE')) return 'NO';
      if (d.includes('CONDITIONAL') || d.includes('IF') || d.includes('DEPENDS')) return 'CONDITIONAL';
      if (d.includes('WAIT') || d.includes('DELAY') || d.includes('MORE INFO')) return 'WAIT';
      if (d.includes('ALTERNATIVE') || d.includes('DIFFERENT') || d.includes('NEITHER')) return 'ALTERNATIVE';
      return d;
    };

    // Group by structured decision (not free-form position)
    const decisionGroups = {};
    for (const response of validResponses) {
      const decision = normalizeDecision(response.decision);
      if (!decisionGroups[decision]) {
        decisionGroups[decision] = [];
      }
      decisionGroups[decision].push(response);
    }

    const totalVoters = validResponses.length;
    const groupCounts = Object.entries(decisionGroups)
      .map(([decision, responses]) => ({
        decision,
        position: responses[0].position, // Keep first position for display
        count: responses.length,
        responses,
        confidence: this.averageConfidence(responses)
      }))
      .sort((a, b) => b.count - a.count);

    const largestGroup = groupCounts[0];

    // Unanimous - all agree on the same decision
    if (largestGroup.count === totalVoters) {
      return {
        reached: true,
        type: 'unanimous',
        decision: largestGroup.decision,
        position: largestGroup.position,
        confidence: largestGroup.confidence,
        decisions: groupCounts
      };
    }

    // Supermajority - all but one agree
    if (this.consensusThreshold === 'supermajority' && largestGroup.count >= totalVoters - 1) {
      return {
        reached: true,
        type: 'supermajority',
        decision: largestGroup.decision,
        position: largestGroup.position,
        confidence: largestGroup.confidence,
        decisions: groupCounts
      };
    }

    // Majority - more than half agree
    if (this.consensusThreshold === 'majority' && largestGroup.count > totalVoters / 2) {
      return {
        reached: true,
        type: 'majority',
        decision: largestGroup.decision,
        position: largestGroup.position,
        confidence: largestGroup.confidence,
        decisions: groupCounts
      };
    }

    // Split decision - no clear consensus
    return {
      reached: false,
      type: 'split',
      decisions: groupCounts,
      majority: largestGroup
    };
  }

  /**
   * Calculate average confidence
   */
  averageConfidence(responses) {
    const validConfidences = responses
      .map(r => r.confidence)
      .filter(c => typeof c === 'number' && c > 0);

    if (validConfidences.length === 0) return 5;

    return Math.round(
      validConfidences.reduce((a, b) => a + b, 0) / validConfidences.length
    );
  }

  /**
   * Run the full debate
   */
  async run(question, context = '', onProgress = null) {
    this.question = question;
    this.context = context;
    this.rounds = [];
    this.totalCost = 0;
    this.onProgress = onProgress;

    // Reset token tracking
    this.tokenUsage = {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      byLLM: {},
      byRound: []
    };

    if (this.clients.length === 0) {
      throw new Error('No LLM clients configured. Please add API keys to config.js');
    }

    if (this.clients.length < 2) {
      reporter.printWarning(`Only ${this.clients.length} LLM configured. For meaningful debate, configure at least 2 LLMs.`);
    }

    // Emit debate start
    this.emitProgress('debate_start', {
      question: question.substring(0, 100),
      llms: this.clients.map(c => ({ id: c.id, name: c.name })),
      maxRounds: this.maxRounds
    });

    reporter.printDebateStart(question, context, this.clients, this.maxRounds);

    let previousResponses = null;
    let finalConsensus = null;

    for (let round = 1; round <= this.maxRounds; round++) {
      if (this.totalCost >= config.costs.maxPerSession) {
        reporter.printWarning(`Budget limit reached ($${this.totalCost.toFixed(2)}). Stopping debate.`);
        break;
      }

      if (this.totalCost >= config.costs.warnAt && round > 1) {
        reporter.printWarning(`Cost warning: $${this.totalCost.toFixed(2)} spent so far.`);
      }

      const roundResult = await this.runRound(round, previousResponses);
      this.rounds.push(roundResult);
      previousResponses = roundResult.results;
      finalConsensus = roundResult.consensus;

      if (finalConsensus.reached) {
        break;
      }
    }

    // Run synthesis round to generate action plan
    this.emitProgress('synthesis_start', { message: 'Generating your action plan...' });

    let actionPlan = null;
    try {
      actionPlan = await this.runSynthesis(finalConsensus);
      this.emitProgress('synthesis_complete', { actionPlan });
    } catch (error) {
      console.error('Synthesis error:', error.message);
      this.emitProgress('synthesis_error', { error: error.message });
    }

    // Log token summary
    const totalTokens = this.tokenUsage.totalInputTokens + this.tokenUsage.totalOutputTokens;
    reporter.printInfo(`\nToken Summary: ${totalTokens.toLocaleString()} total (${this.tokenUsage.totalInputTokens.toLocaleString()} input + ${this.tokenUsage.totalOutputTokens.toLocaleString()} output)`);

    // Warn if high token usage
    if (totalTokens > 50000) {
      reporter.printWarning(`High token usage: ${totalTokens.toLocaleString()} tokens. Consider shorter questions or context.`);
    }

    // Post-process: Fix decision label for non-yes/no questions
    const questionType = detectQuestionType(question);

    // Labels for non-decision questions - these should NEVER show YES/NO
    const typeLabels = {
      planning: 'PLAN PROVIDED',
      howto: 'GUIDE PROVIDED',
      factual: 'INFO PROVIDED',
      recommendation: 'RECOMMENDED',
      comparison: 'VERDICT',
      general: 'ANSWERED'
    };

    // Only true YES/NO questions should show YES/NO
    const isYesNoQuestion = questionType === 'decision';

    if (finalConsensus && !isYesNoQuestion) {
      // For non-yes/no questions, replace generic YES/NO with appropriate labels
      const currentDecision = (finalConsensus.decision || '').toUpperCase();
      if (currentDecision === 'YES' || currentDecision === 'NO' ||
          currentDecision === 'CONDITIONAL' || currentDecision === 'WAIT' ||
          currentDecision === 'ALTERNATIVE' || currentDecision === 'UNKNOWN') {
        // Use the appropriate label for this question type
        finalConsensus.decision = typeLabels[questionType] || 'ANSWERED';
        finalConsensus.questionType = questionType;
      }
    }

    // Store question type for UI display
    if (finalConsensus) {
      finalConsensus.questionType = questionType;
    }

    const report = {
      question,
      context,
      timestamp: new Date().toISOString(),
      rounds: this.rounds,
      finalConsensus,
      questionType,
      actionPlan,
      totalCost: this.totalCost,
      tokenUsage: this.tokenUsage,
      llmsUsed: this.clients.map(c => c.name)
    };

    // Emit debate complete
    this.emitProgress('debate_complete', {
      rounds: this.rounds.length,
      consensus: finalConsensus,
      actionPlan,
      tokenUsage: this.tokenUsage,
      totalCost: this.totalCost
    });

    reporter.printFinalDecision(report);

    return report;
  }

  /**
   * Run synthesis round to generate actionable insights
   */
  async runSynthesis(consensus) {
    // Use the first available client for synthesis
    const client = this.clients[0];
    if (!client) {
      return null;
    }

    const prompt = getSynthesisPrompt(this.question, this.context, this.rounds, consensus);

    try {
      const response = await client.call(prompt);

      // The response should already be parsed JSON from the client
      return {
        executive_summary: response.executive_summary || '',
        decision: response.decision || consensus.decision || 'CONDITIONAL',
        confidence_score: response.confidence_score || consensus.confidence || 7,
        immediate_actions: response.immediate_actions || [],
        before_proceeding: response.before_proceeding || [],
        risk_mitigation: response.risk_mitigation || [],
        success_indicators: response.success_indicators || [],
        timeline_suggestion: response.timeline_suggestion || '',
        dissenting_view_summary: response.dissenting_view_summary || '',
        synthesizedBy: client.name
      };
    } catch (error) {
      console.error('Synthesis call error:', error.message);
      return null;
    }
  }
}

module.exports = DebateEngine;
