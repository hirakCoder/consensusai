/**
 * Google Gemini Client
 */

const https = require('https');
const config = require('../config');
const { getPersonaPrompt } = require('../prompts');

// Get tier-aware config at call time (not module load time)
function getConfig() {
  return config.getModelConfig('gemini');
}

function makeRequest(prompt, llmConfig) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        maxOutputTokens: config.debate.maxTokensPerResponse,
        temperature: config.debate.temperature
      }
    });

    const url = new URL(`${llmConfig.endpoint}/${llmConfig.model}:generateContent?key=${llmConfig.apiKey}`);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response);
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

module.exports = {
  name: config.llms.gemini.name,
  id: 'gemini',
  enabled: config.llms.gemini.enabled,

  async call(prompt) {
    const llmConfig = getConfig();

    if (!llmConfig.enabled) {
      throw new Error('Gemini is disabled in config');
    }

    if (llmConfig.apiKey === 'YOUR_GEMINI_KEY_HERE') {
      throw new Error('Gemini API key not configured');
    }

    const systemPrompt = getPersonaPrompt('gemini') + '\n\n';
    const fullPrompt = systemPrompt + prompt;

    const response = await makeRequest(fullPrompt, llmConfig);

    if (!response.candidates || !response.candidates[0]) {
      throw new Error('No response from Gemini');
    }

    const content = response.candidates[0].content.parts[0].text;

    // Estimate tokens (Gemini doesn't always return usage)
    const usageMetadata = response.usageMetadata || {};
    const promptTokens = usageMetadata.promptTokenCount || Math.ceil(fullPrompt.length / 4);
    const outputTokens = usageMetadata.candidatesTokenCount || Math.ceil(content.length / 4);

    // Calculate cost
    const inputCost = (promptTokens / 1000) * llmConfig.costPer1kInputTokens;
    const outputCost = (outputTokens / 1000) * llmConfig.costPer1kOutputTokens;

    // Parse JSON response
    let parsed;
    try {
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      parsed = {
        position: content.substring(0, 200),
        confidence: 5,
        reasoning: content,
        key_argument: 'See reasoning',
        risks: [],
        assumptions: []
      };
    }

    return {
      ...parsed,
      _meta: {
        model: llmConfig.model,
        tokens: { prompt_tokens: promptTokens, completion_tokens: outputTokens },
        cost: inputCost + outputCost
      }
    };
  },

  estimateCost(promptTokens) {
    const llmConfig = getConfig();
    const estimatedOutputTokens = config.debate.maxTokensPerResponse;
    const inputCost = (promptTokens / 1000) * llmConfig.costPer1kInputTokens;
    const outputCost = (estimatedOutputTokens / 1000) * llmConfig.costPer1kOutputTokens;
    return inputCost + outputCost;
  }
};
