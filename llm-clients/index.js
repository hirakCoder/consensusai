/**
 * LLM Clients Index
 * Exports all available LLM clients
 */

const openai = require('./openai');
const gemini = require('./gemini');
const grok = require('./grok');
const claude = require('./claude');

const clients = {
  openai,
  gemini,
  grok,
  claude
};

/**
 * Get all enabled LLM clients
 */
function getEnabledClients() {
  return Object.values(clients).filter(client => client.enabled);
}

/**
 * Get a specific client by ID
 */
function getClient(id) {
  return clients[id];
}

/**
 * Get list of all client IDs
 */
function getClientIds() {
  return Object.keys(clients);
}

/**
 * Check which clients have valid API keys
 */
function getConfiguredClients() {
  const config = require('../config');
  return Object.entries(clients)
    .filter(([id, client]) => {
      const llmConfig = config.llms[id];
      return client.enabled &&
             llmConfig.apiKey &&
             !llmConfig.apiKey.includes('YOUR_') &&
             !llmConfig.apiKey.includes('_HERE');
    })
    .map(([id, client]) => client);
}

module.exports = {
  clients,
  getEnabledClients,
  getClient,
  getClientIds,
  getConfiguredClients,
  // Export individual clients for direct access
  openai,
  gemini,
  grok,
  claude
};
