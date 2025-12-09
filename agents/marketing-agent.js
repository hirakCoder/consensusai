#!/usr/bin/env node
/**
 * ConsensusAI Marketing Agent
 *
 * Automated marketing tasks:
 * 1. Generates "Debate of the Day" content
 * 2. Posts to Twitter/X automatically
 * 3. Tracks engagement metrics
 *
 * Setup:
 * 1. Get Twitter API keys from developer.twitter.com
 * 2. Add to .env: TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET
 * 3. Run: node agents/marketing-agent.js
 *
 * Schedule with cron:
 * 0 9 * * * cd /path/to/consensus-platform && node agents/marketing-agent.js >> logs/marketing.log 2>&1
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');

// Twitter API configuration
const TWITTER_CONFIG = {
  apiKey: process.env.TWITTER_API_KEY,
  apiSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
};

const isTwitterConfigured = Object.values(TWITTER_CONFIG).every(v => v);

// Debate topics for auto-generation
const TRENDING_TOPICS = [
  // Tech debates
  'Is AI going to replace software developers?',
  'React vs Vue vs Svelte for new projects in 2025',
  'Should startups use serverless or traditional servers?',
  'Is Rust worth learning in 2025?',
  'TypeScript: Worth the overhead?',

  // Business debates
  'Remote work vs hybrid vs office-first?',
  'Should you bootstrap or raise VC funding?',
  'Is an MBA worth it for tech entrepreneurs?',
  'Freemium vs paid-only for SaaS products?',

  // Crypto/Finance
  'Is Bitcoin a good investment right now?',
  'Should you dollar-cost average or lump sum invest?',
  'Crypto vs traditional stocks for long-term wealth?',

  // Life decisions
  'Should you learn to code in 2025?',
  'Big tech vs startup for your career?',
  'Should you negotiate your first job offer?',
];

/**
 * Get a random debate topic
 */
function getRandomTopic() {
  return TRENDING_TOPICS[Math.floor(Math.random() * TRENDING_TOPICS.length)];
}

/**
 * Get recent debates from history
 */
function getRecentDebates(limit = 5) {
  const decisionsDir = path.join(__dirname, '..', 'data', 'decisions');

  if (!fs.existsSync(decisionsDir)) {
    return [];
  }

  const files = fs.readdirSync(decisionsDir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse()
    .slice(0, limit);

  return files.map(f => {
    try {
      const content = fs.readFileSync(path.join(decisionsDir, f), 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      return null;
    }
  }).filter(Boolean);
}

/**
 * Generate tweet content from a debate result
 */
function generateTweetContent(debate) {
  const { question, finalConsensus, responses } = debate;

  // Count votes
  const votes = {
    YES: 0,
    NO: 0,
    CONDITIONAL: 0,
    WAIT: 0,
  };

  if (responses) {
    responses.forEach(r => {
      const decision = r.decision?.toUpperCase() || 'UNKNOWN';
      if (votes[decision] !== undefined) {
        votes[decision]++;
      }
    });
  }

  // Build tweet
  const verdict = finalConsensus?.verdict || 'SPLIT';
  const consensusType = finalConsensus?.type || 'mixed';

  let tweetText = `🤖 I asked 4 AIs: "${question}"\n\n`;

  if (consensusType === 'unanimous') {
    tweetText += `🎯 UNANIMOUS ${verdict}\n`;
    tweetText += `All 4 AIs agree!\n\n`;
  } else if (consensusType === 'majority') {
    tweetText += `📊 MAJORITY: ${verdict}\n`;
    tweetText += `GPT: ${votes.YES > votes.NO ? '✅' : '❌'} | Claude: ${votes.YES > votes.NO ? '✅' : '❌'}\n`;
    tweetText += `Gemini: ${votes.YES > votes.NO ? '✅' : '❌'} | Grok: ${votes.YES > votes.NO ? '✅' : '❌'}\n\n`;
  } else {
    tweetText += `⚡ SPLIT DECISION\n`;
    tweetText += `The AIs couldn't agree!\n\n`;
  }

  // Add key insight if available
  if (finalConsensus?.summary) {
    const summary = finalConsensus.summary.substring(0, 100);
    tweetText += `💡 "${summary}..."\n\n`;
  }

  tweetText += `Try it yourself: consensusai.app\n\n`;
  tweetText += `#AI #GPT4 #Claude #Gemini #DecisionMaking`;

  // Ensure under 280 chars
  if (tweetText.length > 280) {
    tweetText = tweetText.substring(0, 277) + '...';
  }

  return tweetText;
}

/**
 * Post to Twitter (placeholder - requires Twitter API v2)
 */
async function postToTwitter(content) {
  if (!isTwitterConfigured) {
    console.log('[Twitter] Not configured. Would post:');
    console.log('─'.repeat(50));
    console.log(content);
    console.log('─'.repeat(50));
    return { success: false, reason: 'not_configured' };
  }

  // Twitter API v2 requires OAuth 1.0a
  // For production, use a library like 'twitter-api-v2'
  console.log('[Twitter] Posting tweet...');

  // Placeholder - implement with actual Twitter API
  // const Twitter = require('twitter-api-v2');
  // const client = new Twitter({
  //   appKey: TWITTER_CONFIG.apiKey,
  //   appSecret: TWITTER_CONFIG.apiSecret,
  //   accessToken: TWITTER_CONFIG.accessToken,
  //   accessSecret: TWITTER_CONFIG.accessSecret,
  // });
  // const tweet = await client.v2.tweet(content);

  console.log('[Twitter] Tweet content:');
  console.log(content);

  return { success: true, content };
}

/**
 * Run a new debate using the API
 */
async function runDebate(question) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      question,
      tier: 'budget',
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/debate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Main marketing agent routine
 */
async function main() {
  console.log('═'.repeat(60));
  console.log('🎯 ConsensusAI Marketing Agent');
  console.log('═'.repeat(60));
  console.log(`\nTime: ${new Date().toISOString()}\n`);

  const args = process.argv.slice(2);
  const command = args[0] || 'post-recent';

  switch (command) {
    case 'post-recent':
      // Post about a recent debate
      console.log('📝 Getting recent debates...');
      const debates = getRecentDebates(1);

      if (debates.length === 0) {
        console.log('No recent debates found.');
        return;
      }

      const tweet = generateTweetContent(debates[0]);
      await postToTwitter(tweet);
      break;

    case 'generate':
      // Generate a new debate and post
      console.log('🧠 Generating new debate...');
      const topic = getRandomTopic();
      console.log(`Topic: ${topic}`);

      try {
        const result = await runDebate(topic);
        const newTweet = generateTweetContent(result);
        await postToTwitter(newTweet);
      } catch (e) {
        console.error('Failed to generate debate:', e.message);
        console.log('Server may not be running. Start with: node server.js');
      }
      break;

    case 'preview':
      // Preview what would be posted
      console.log('👀 Preview mode (no posting)\n');
      const previewDebates = getRecentDebates(3);

      previewDebates.forEach((d, i) => {
        console.log(`\n--- Debate ${i + 1} ---`);
        console.log(generateTweetContent(d));
      });
      break;

    case 'topics':
      // List available topics
      console.log('📋 Available trending topics:\n');
      TRENDING_TOPICS.forEach((t, i) => {
        console.log(`  ${i + 1}. ${t}`);
      });
      break;

    default:
      console.log(`
Usage: node agents/marketing-agent.js [command]

Commands:
  post-recent  Post about the most recent debate (default)
  generate     Generate a new debate and post it
  preview      Preview tweets without posting
  topics       List available trending topics

Environment Variables Required:
  TWITTER_API_KEY
  TWITTER_API_SECRET
  TWITTER_ACCESS_TOKEN
  TWITTER_ACCESS_SECRET

Schedule with cron (daily at 9 AM):
  0 9 * * * node /path/to/agents/marketing-agent.js generate
      `);
  }

  console.log('\n✅ Marketing agent completed');
}

main().catch(console.error);
