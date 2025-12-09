/**
 * Anthropic Claude Client
 */

const https = require('https');
const config = require('../config');
const { getPersonaPrompt } = require('../prompts');

// Get tier-aware config at call time (not module load time)
function getConfig() {
  return config.getModelConfig('claude');
}

function makeRequest(data, apiKey) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
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
  name: config.llms.claude.name,
  id: 'claude',
  enabled: config.llms.claude.enabled,

  async call(prompt) {
    const llmConfig = getConfig();

    if (!llmConfig.enabled) {
      throw new Error('Claude is disabled in config');
    }

    if (llmConfig.apiKey === 'YOUR_ANTHROPIC_KEY_HERE') {
      throw new Error('Claude API key not configured');
    }

    const response = await makeRequest({
      model: llmConfig.model,
      max_tokens: config.debate.maxTokensPerResponse,
      system: getPersonaPrompt('claude'),
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    }, llmConfig.apiKey);

    const content = response.content[0].text;
    const usage = response.usage || { input_tokens: 0, output_tokens: 0 };

    // Calculate cost
    const inputCost = (usage.input_tokens / 1000) * llmConfig.costPer1kInputTokens;
    const outputCost = (usage.output_tokens / 1000) * llmConfig.costPer1kOutputTokens;

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
        tokens: { prompt_tokens: usage.input_tokens, completion_tokens: usage.output_tokens },
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
