/**
 * Configuration for Multi-LLM Consensus Debate Platform
 * Supports Budget (testing/free) and Premium (pro) model tiers
 */

module.exports = {
  // Model Tiers
  modelTiers: {
    budget: {
      name: 'Budget',
      description: 'Fast & affordable for testing',
      models: {
        openai: {
          model: 'gpt-4o-mini',
          costPer1kInputTokens: 0.00015,
          costPer1kOutputTokens: 0.0006
        },
        gemini: {
          model: 'gemini-2.0-flash',
          costPer1kInputTokens: 0.000075,
          costPer1kOutputTokens: 0.0003
        },
        grok: {
          model: 'grok-3-mini-fast',
          costPer1kInputTokens: 0.0003,
          costPer1kOutputTokens: 0.0005
        },
        claude: {
          model: 'claude-3-5-haiku-20241022',
          costPer1kInputTokens: 0.0008,
          costPer1kOutputTokens: 0.004
        }
      }
    },
    premium: {
      name: 'Premium',
      description: 'Best reasoning & accuracy',
      models: {
        openai: {
          model: 'gpt-4.1',
          costPer1kInputTokens: 0.002,
          costPer1kOutputTokens: 0.008
        },
        gemini: {
          model: 'gemini-2.5-pro-preview-06-05',
          costPer1kInputTokens: 0.00125,
          costPer1kOutputTokens: 0.01
        },
        grok: {
          model: 'grok-3',
          costPer1kInputTokens: 0.003,
          costPer1kOutputTokens: 0.015
        },
        claude: {
          model: 'claude-opus-4-20250514',
          costPer1kInputTokens: 0.015,
          costPer1kOutputTokens: 0.075
        }
      }
    }
  },

  // Current active tier (can be changed via UI or API)
  activeTier: 'budget',

  // LLM Configurations (API keys from environment variables)
  // Keys are trimmed to remove any accidental whitespace/newlines
  llms: {
    openai: {
      enabled: true,
      name: 'GPT',
      apiKey: (process.env.OPENAI_API_KEY || '').trim(),
      endpoint: 'https://api.openai.com/v1/chat/completions'
    },
    gemini: {
      enabled: true,
      name: 'Gemini',
      apiKey: (process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '').trim(),
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models'
    },
    grok: {
      enabled: true,
      name: 'Grok',
      apiKey: (process.env.XAI_API_KEY || '').trim(),
      endpoint: 'https://api.x.ai/v1/chat/completions'
    },
    claude: {
      enabled: true,
      name: 'Claude',
      apiKey: (process.env.ANTHROPIC_API_KEY || '').trim(),
      endpoint: 'https://api.anthropic.com/v1/messages'
    }
  },

  debate: {
    maxRounds: 3,
    consensusThreshold: 'unanimous',
    maxTokensPerResponse: 1000,
    temperature: 0.7
  },

  costs: {
    maxPerSession: 5.00,
    warnAt: 2.00,
    trackUsage: true
  },

  output: {
    saveToJson: true,
    saveToMarkdown: true,
    decisionsDir: './decisions',
    verboseMode: true
  },

  // Helper function to get model config for current tier
  getModelConfig(llmId) {
    const tier = this.modelTiers[this.activeTier];
    const baseConfig = this.llms[llmId];
    const tierConfig = tier.models[llmId];

    return {
      ...baseConfig,
      model: tierConfig.model,
      costPer1kInputTokens: tierConfig.costPer1kInputTokens,
      costPer1kOutputTokens: tierConfig.costPer1kOutputTokens
    };
  }
};
