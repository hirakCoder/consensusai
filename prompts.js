/**
 * Prompt Templates for Debate Rounds
 */

/**
 * AI Personas - subtle differences in analytical focus
 */
const PERSONAS = {
  openai: 'You are an expert advisor participating in a multi-AI debate. Your strength is balanced analysis and practical trade-offs. Always respond with valid JSON as instructed.',
  gemini: 'You are an expert advisor participating in a multi-AI debate. Your strength is spotting emerging trends and unconventional angles. Always respond with valid JSON as instructed.',
  claude: 'You are an expert advisor participating in a multi-AI debate. Your strength is identifying risks and unintended consequences. Always respond with valid JSON as instructed.',
  grok: 'You are an expert advisor participating in a multi-AI debate. Your strength is cutting through complexity to find simple truths. Always respond with valid JSON as instructed.'
};

/**
 * Get persona-specific system prompt for an LLM
 */
function getPersonaPrompt(llmId) {
  return PERSONAS[llmId] || PERSONAS.openai;
}

/**
 * Detect question type to determine appropriate decision format
 */
function detectQuestionType(question) {
  const q = question.toLowerCase();

  // Planning/Itinerary questions: "Plan a trip", "Create an itinerary", "Schedule", etc.
  if (/\bplan\b.*\b(trip|visit|vacation|itinerary|schedule|tour|journey)/.test(q) ||
      /\b(create|make|build|design)\b.*\b(plan|itinerary|schedule)/.test(q) ||
      /\b(itinerary|schedule|agenda)\b.*\bfor\b/.test(q) ||
      /\b\d+\s*(day|week|hour)s?\b.*\b(trip|visit|tour|itinerary)/.test(q) ||
      /\b(trip|visit|tour)\b.*\b\d+\s*(day|week)s?\b/.test(q)) {
    return 'planning';
  }

  // How-to questions: "How do I", "How to", "How can I"
  if (/^how (do|can|should|would|to) /i.test(q) ||
      /\bhow to\b/i.test(q)) {
    return 'howto';
  }

  // Comparison questions: "Who/Which is better", "A vs B", "A or B", "compare"
  if (/\bvs\.?\b|\bversus\b/.test(q) ||
      /who is (the )?(better|greater|more|best)|which is (the )?(better|greater|more|best)/.test(q) ||
      /compare\b|comparing\b|comparison\b/.test(q) ||
      /\bor\b.*\bbetter\b|\bbetter\b.*\bor\b/.test(q) ||
      /who would win|which would you (choose|pick|prefer)/.test(q)) {
    return 'comparison';
  }

  // "Best X" questions - treat as recommendation (e.g., "what is the best headphone")
  if (/\b(what|which)\b.*(is|are) (the )?best\b/.test(q) ||
      /\bbest\b.*(for|to use|option|choice|pick)/.test(q)) {
    return 'recommendation';
  }

  // Recommendation questions
  if (/what (should|would|can|could) (i|we|you)|recommend|suggestion/.test(q) ||
      /best .*(to watch|to buy|to read|to play|to visit|to try)/.test(q)) {
    return 'recommendation';
  }

  // Yes/No decision questions
  if (/^(should|is|are|do|does|can|could|will|would|have|has) /i.test(q)) {
    return 'decision';
  }

  // Factual/informational
  if (/^(what|when|where|why|who) /i.test(q) && !/better|best|prefer/.test(q)) {
    return 'factual';
  }

  return 'general';
}

/**
 * Round 1: Initial independent analysis
 */
function getRound1Prompt(question, context) {
  const contextSection = context
    ? `\nCONTEXT/CONSTRAINTS:\n${context}\n`
    : '';

  const questionType = detectQuestionType(question);

  // Customize decision guidance based on question type
  let decisionGuidance;
  let decisionFormat;

  if (questionType === 'comparison') {
    decisionGuidance = `COMPARISON QUESTION DETECTED!
For comparison questions like "Who is better: A vs B?":
- Your "decision" should be the NAME of your choice (e.g., "PELE", "MARADONA", "MESSI", "RONALDO")
- If truly equal/different strengths, use "BOTH" or "EQUAL"
- Do NOT use YES/NO for comparisons - name your pick!`;
    decisionFormat = `"decision": "NAME OF YOUR CHOICE (e.g., the person, team, product you think is better)"`;
  } else if (questionType === 'planning') {
    decisionGuidance = `PLANNING/ITINERARY QUESTION DETECTED!
This is a planning request, NOT a yes/no question.
- Your "decision" should be a brief TITLE for your plan (e.g., "5-DAY PARIS CULTURAL IMMERSION", "WEEKEND BEACH GETAWAY")
- Your "position" should contain the FULL detailed day-by-day itinerary
- Include specific times, locations, restaurants, costs where relevant
- Do NOT use YES/NO - provide the actual plan!`;
    decisionFormat = `"decision": "BRIEF TITLE FOR YOUR PLAN (e.g., '5-DAY PARIS ADVENTURE')"`;
  } else if (questionType === 'howto') {
    decisionGuidance = `HOW-TO QUESTION DETECTED!
This is asking for instructions/steps, NOT a yes/no question.
- Your "decision" should be a brief SUMMARY of your approach (e.g., "STEP-BY-STEP GUIDE", "3-PHASE APPROACH")
- Your "position" should contain the detailed steps/instructions
- Be specific with actionable steps
- Do NOT use YES/NO - provide the actual how-to guide!`;
    decisionFormat = `"decision": "BRIEF APPROACH SUMMARY (e.g., '5-STEP METHOD')"`;
  } else if (questionType === 'factual') {
    decisionGuidance = `FACTUAL/INFORMATIONAL QUESTION DETECTED!
This is asking for information, NOT a yes/no question.
- Your "decision" should be a brief ANSWER SUMMARY
- Your "position" should contain the detailed explanation
- Include facts, data, and sources where available
- Do NOT use YES/NO - provide the actual information!`;
    decisionFormat = `"decision": "BRIEF ANSWER (the key fact or finding)"`;
  } else if (questionType === 'recommendation') {
    decisionGuidance = `RECOMMENDATION QUESTION DETECTED!
This is asking for recommendations, NOT a yes/no question.
- Your "decision" should be your TOP RECOMMENDATION (e.g., "Watch Breaking Bad" or "Buy the Sony XM5")
- Your "position" should list your top 3-5 specific picks with reasons
- Be SPECIFIC - name exact products, movies, places, etc.
- Do NOT just say YES - give the actual recommendation!`;
    decisionFormat = `"decision": "YOUR TOP RECOMMENDATION (specific name/title)"`;
  } else if (questionType === 'general') {
    decisionGuidance = `GENERAL QUESTION DETECTED!
Provide a clear, direct answer to the question.
- Your "decision" should be a BRIEF ANSWER SUMMARY
- Your "position" should contain the detailed explanation
- Be specific and concrete`;
    decisionFormat = `"decision": "BRIEF ANSWER SUMMARY"`;
  } else {
    // Only for 'decision' type questions (true yes/no)
    decisionGuidance = `DECISION GUIDANCE:
This is a yes/no decision question.
- For "Should I...?" questions → Answer YES or NO with reasons
- For investment/major life decisions → May be CONDITIONAL if real conditions exist
- Don't use CONDITIONAL just to hedge - give a real answer`;
    decisionFormat = `"decision": "YES or NO or CONDITIONAL or WAIT or ALTERNATIVE"`;
  }

  return `You are an expert advisor participating in a multi-AI debate to help a user make a decision.

QUESTION: ${question}
${contextSection}
This is Round 1. Give your independent analysis without knowing what other AIs think.

CRITICAL INSTRUCTIONS:
1. Be SPECIFIC and CONCRETE in your answers - never be vague or generic
2. If the question asks for recommendations (movies, shows, products, places, etc.), ALWAYS provide specific names with brief reasons
3. If comparing options, give clear rankings with justification
4. Use numbers, statistics, and facts when available
5. Your "key_argument" should be your most compelling specific point
6. PREFER definitive answers over hedging

${decisionGuidance}

${questionType === 'decision' ? `IMPORTANT: Your "decision" must be ONE of these exact values:
- "YES" - Proceed, do it, approve, accept
- "NO" - Don't do it, reject, decline, avoid
- "CONDITIONAL" - ONLY use this when there are genuine deal-breaker conditions
- "WAIT" - Not now, delay, more info critically needed
- "ALTERNATIVE" - Neither option works, suggest something different` : ''}

Respond ONLY with valid JSON in this exact format (no markdown, no explanation outside JSON):
{
  ${decisionFormat},
  "position": "your clear position with SPECIFIC recommendations (name names, give specifics)",
  "confidence": 7,
  "reasoning": "detailed reasoning with SPECIFIC examples, names, facts, and numbers (2-3 paragraphs). If recommending something, list your top 3-5 specific picks with brief reasons for each.",
  "key_argument": "your single strongest SPECIFIC point (not vague)",
  "risks": ["specific risk 1", "specific risk 2"],
  "assumptions": ["specific assumption 1", "specific assumption 2"]
}`;
}

/**
 * Round 2+: See other perspectives and reconsider
 */
function getDebateRoundPrompt(question, context, roundNumber, previousResponse, otherResponses) {
  const contextSection = context
    ? `\nCONTEXT/CONSTRAINTS:\n${context}\n`
    : '';

  const questionType = detectQuestionType(question);

  const otherPerspectives = otherResponses.map(r =>
    `**${r.llmName}** (Decision: ${r.decision}, Confidence: ${r.confidence}/10):
Position: ${r.position}
Key Argument: ${r.key_argument}
Reasoning: ${r.reasoning}`
  ).join('\n\n');

  // Customize decision guidance based on question type
  let decisionGuidance;
  let decisionFormat;

  if (questionType === 'comparison') {
    decisionGuidance = `COMPARISON QUESTION - Your "decision" should be the NAME of your choice (e.g., "PELE", "MARADONA").
If you've been convinced by another AI to change your pick, update your decision to their choice.
If truly equal, use "BOTH" or "EQUAL".`;
    decisionFormat = `"decision": "NAME OF YOUR CHOICE"`;
  } else if (questionType === 'planning') {
    decisionGuidance = `PLANNING QUESTION - Your "decision" should be a brief label like "PLAN PROVIDED" or "ITINERARY READY".
Focus on providing helpful content in your position and reasoning.`;
    decisionFormat = `"decision": "PLAN PROVIDED or ITINERARY READY"`;
  } else if (questionType === 'howto') {
    decisionGuidance = `HOW-TO QUESTION - Your "decision" should be "GUIDE PROVIDED" or similar.
Focus on clear step-by-step instructions in your position.`;
    decisionFormat = `"decision": "GUIDE PROVIDED"`;
  } else if (questionType === 'factual') {
    decisionGuidance = `FACTUAL QUESTION - Your "decision" should be the key fact or finding.
Provide detailed information in your reasoning.`;
    decisionFormat = `"decision": "BRIEF ANSWER (key fact)"`;
  } else if (questionType === 'recommendation') {
    decisionGuidance = `RECOMMENDATION QUESTION - Your "decision" should be your TOP PICK (specific name).
Example: "Watch Breaking Bad" or "Buy the Sony WH-1000XM5"`;
    decisionFormat = `"decision": "YOUR TOP RECOMMENDATION"`;
  } else if (questionType === 'decision') {
    decisionGuidance = `YES/NO DECISION QUESTION:
- "YES" - Proceed, do it, approve, accept
- "NO" - Don't do it, reject, decline, avoid
- "CONDITIONAL" - ONLY use when there are genuine deal-breaker conditions
- "WAIT" - Not now, delay, more info critically needed
- "ALTERNATIVE" - Neither option works, suggest something different

PREFER definitive YES/NO answers over CONDITIONAL hedging.`;
    decisionFormat = `"decision": "YES or NO (prefer these) or CONDITIONAL or WAIT or ALTERNATIVE"`;
  } else {
    decisionGuidance = `Provide a clear, direct answer to the question.`;
    decisionFormat = `"decision": "BRIEF ANSWER SUMMARY"`;
  }

  return `You are an expert advisor participating in a multi-AI debate.

QUESTION: ${question}
${contextSection}
This is Round ${roundNumber}. You previously gave your position, and now you can see what other AIs think.

YOUR PREVIOUS POSITION:
Decision: ${previousResponse.decision}
Position: ${previousResponse.position}
Confidence: ${previousResponse.confidence}/10
Key Argument: ${previousResponse.key_argument}

OTHER AI PERSPECTIVES:
${otherPerspectives}

Now that you've seen other perspectives, carefully consider their arguments:
- If you find another position more convincing, change your position and explain why
- If you still believe your position is correct, defend it against their arguments
- Be open to synthesis - maybe combining ideas creates a better answer
- It's a sign of good reasoning to change your mind when presented with better arguments

${decisionGuidance}

Respond ONLY with valid JSON in this exact format (no markdown, no explanation outside JSON):
{
  ${decisionFormat},
  "position": "your position with SPECIFIC recommendations (may be same or changed)",
  "changed": false,
  "confidence": 8,
  "reasoning": "why you hold this position after seeing others' arguments",
  "response_to_others": "address the strongest counterargument or explain what convinced you to change",
  "key_argument": "your strongest point now"
}`;
}

/**
 * Synthesis prompt - generates actionable insights and next steps
 */
function getSynthesisPrompt(question, context, debateResults, consensus) {
  const finalRound = debateResults[debateResults.length - 1];
  const questionType = detectQuestionType(question);

  const allInsights = finalRound.results.map(r => `
**${r.llmName}** (Decision: ${r.decision}, Confidence: ${r.confidence}/10):
- Position: ${r.position}
- Key Argument: ${r.key_argument}
- Reasoning: ${r.reasoning}
${r.risks?.length ? `- Risks Identified: ${r.risks.join('; ')}` : ''}
${r.assumptions?.length ? `- Assumptions: ${r.assumptions.join('; ')}` : ''}
`).join('\n');

  const consensusInfo = consensus.reached
    ? `CONSENSUS REACHED: ${consensus.type} - ${consensus.decision}`
    : `SPLIT DECISION: Majority says ${consensus.majority?.decision} (${consensus.majority?.count} votes)`;

  // Customize synthesis based on question type
  let synthesisGuidance;
  let decisionFormat;

  if (questionType === 'comparison') {
    synthesisGuidance = `COMPARISON QUESTION - This is comparing two or more options.
1. Your "decision" should be the NAME of the winner based on consensus (e.g., "PELE", "MARADONA")
2. The executive_summary should declare the winner clearly and explain why
3. If it's a close call or tie, explain both sides fairly but still pick a winner if possible
4. Include what makes the winner stand out AND what the runner-up excels at`;
    decisionFormat = `"decision": "NAME OF THE WINNER based on AI consensus"`;
  } else if (questionType === 'recommendation') {
    synthesisGuidance = `RECOMMENDATION QUESTION - Synthesize the best recommendations from all AIs.
1. Your "decision" should be the TOP PICK (specific name of product/show/place)
2. List your TOP 3-5 PICKS in the executive_summary with brief reasons
3. Combine insights from all AIs to create a ranked recommendation list
4. Be SPECIFIC - name exact items, not vague categories`;
    decisionFormat = `"decision": "TOP RECOMMENDATION (specific name)"`;
  } else if (questionType === 'planning') {
    synthesisGuidance = `PLANNING QUESTION - Synthesize the best plan elements from all AIs.
1. Your "decision" should be "PLAN PROVIDED"
2. The executive_summary should give a clear overview of the recommended approach
3. Combine the best ideas from each AI into a cohesive plan`;
    decisionFormat = `"decision": "PLAN PROVIDED"`;
  } else if (questionType === 'howto') {
    synthesisGuidance = `HOW-TO QUESTION - Create clear step-by-step instructions.
1. Your "decision" should be "GUIDE PROVIDED"
2. Combine the best steps from all AIs into a complete guide
3. Be specific and actionable`;
    decisionFormat = `"decision": "GUIDE PROVIDED"`;
  } else if (questionType === 'factual') {
    synthesisGuidance = `FACTUAL QUESTION - Provide accurate, verified information.
1. Your "decision" should be the key fact or answer
2. Cross-reference information from all AIs
3. Note any disagreements on facts`;
    decisionFormat = `"decision": "THE KEY FACT OR ANSWER"`;
  } else if (questionType === 'decision') {
    synthesisGuidance = `YES/NO DECISION QUESTION - Provide a clear recommendation.
1. Your "decision" should be YES, NO, CONDITIONAL, WAIT, or ALTERNATIVE
2. The executive_summary should clearly state the recommendation and key reasons
3. Address concerns raised by dissenting AIs`;
    decisionFormat = `"decision": "YES or NO based on consensus"`;
  } else {
    synthesisGuidance = `GENERAL QUESTION - Provide a comprehensive answer.
1. Your "decision" should be a brief answer summary
2. Combine insights from all AIs
3. Be specific and actionable`;
    decisionFormat = `"decision": "BRIEF ANSWER SUMMARY"`;
  }

  return `You are a strategic advisor synthesizing insights from a multi-AI debate to create an actionable plan.

ORIGINAL QUESTION: ${question}

CONTEXT: ${context || 'None provided'}

${consensusInfo}

AI PERSPECTIVES:
${allInsights}

${synthesisGuidance}

Based on ALL perspectives above, create a comprehensive action plan. Consider both the majority view AND the concerns raised by dissenters.

Respond ONLY with valid JSON in this exact format:
{
  "executive_summary": "${
    questionType === 'comparison' ? 'Clear verdict on who/what wins with explanation. E.g., PELE - While both are legends, Pele edges out because...' :
    questionType === 'recommendation' ? 'TOP PICKS: 1. [Name] - reason, 2. [Name] - reason, 3. [Name] - reason. Start with your #1 recommendation.' :
    questionType === 'planning' ? 'Brief overview of the recommended plan/itinerary. Key highlights and approach.' :
    questionType === 'howto' ? 'Quick overview: This guide covers [main steps]. Key tip: [most important thing to know].' :
    questionType === 'factual' ? 'The answer is [direct answer]. Key supporting facts: [brief explanation].' :
    questionType === 'decision' ? 'Clear YES/NO recommendation with the top 2-3 reasons why.' :
    'Direct answer to the question with specific details and recommendations.'
  }",
  ${decisionFormat},
  "confidence_score": 8,
  "immediate_actions": [
    "SPECIFIC first step (name names, give details)",
    "SPECIFIC second step",
    "SPECIFIC third step"
  ],
  "before_proceeding": [
    "SPECIFIC thing to verify or consider",
    "SPECIFIC question to answer"
  ],
  "risk_mitigation": [
    "SPECIFIC risk and how to address it",
    "SPECIFIC backup plan"
  ],
  "success_indicators": [
    "SPECIFIC way you'll know this was right",
    "SPECIFIC metric or outcome"
  ],
  "timeline_suggestion": "SPECIFIC timeline with milestones",
  "dissenting_view_summary": "What the minority opinion said (be specific about their alternative suggestions)"
}`;
}

/**
 * Final summary prompt (optional - for generating action items)
 */
function getFinalSummaryPrompt(question, context, finalPositions) {
  const positionsSummary = finalPositions.map(p =>
    `${p.llmName}: ${p.position} (Confidence: ${p.confidence}/10)`
  ).join('\n');

  return `Based on this multi-AI debate, provide a final actionable summary.

ORIGINAL QUESTION: ${question}

CONTEXT: ${context || 'None provided'}

FINAL POSITIONS:
${positionsSummary}

Provide a brief summary with:
1. The consensus recommendation (or majority view if split)
2. Key reasoning points that all/most AIs agreed on
3. 2-3 concrete action steps the user can take

Keep it concise and actionable.`;
}

module.exports = {
  getRound1Prompt,
  getDebateRoundPrompt,
  getSynthesisPrompt,
  getFinalSummaryPrompt,
  getPersonaPrompt,
  detectQuestionType,
  PERSONAS
};
