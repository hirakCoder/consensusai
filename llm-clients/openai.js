/**
 * OpenAI GPT-4 Client
 */

const https = require('https');
const config = require('../config');
const { getPersonaPrompt } = require('../prompts');

// Get tier-aware config at call time (not module load time)
function getConfig() {
  return config.getModelConfig('openai');
}

function makeRequest(data, apiKey) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
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
  name: config.llms.openai.name,
  id: 'openai',
  enabled: config.llms.openai.enabled,

  async call(prompt) {
    const llmConfig = getConfig();

    if (!llmConfig.enabled) {
      throw new Error('OpenAI is disabled in config');
    }

    if (llmConfig.apiKey === 'YOUR_OPENAI_KEY_HERE') {
      throw new Error('OpenAI API key not configured');
    }

    const response = await makeRequest({
      model: llmConfig.model,
      messages: [
        {
          role: 'system',
          content: getPersonaPrompt('openai')
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: config.debate.maxTokensPerResponse,
      temperature: config.debate.temperature
    }, llmConfig.apiKey);

    const content = response.choices[0].message.content;
    const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0 };

    // Calculate cost
    const inputCost = (usage.prompt_tokens / 1000) * llmConfig.costPer1kInputTokens;
    const outputCost = (usage.completion_tokens / 1000) * llmConfig.costPer1kOutputTokens;

    // Parse JSON response
    let parsed;
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      // If JSON parsing fails, create structured response from raw text
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
        tokens: usage,
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
