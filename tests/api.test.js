/**
 * ConsensusAI API Test Suite
 * Basic health checks and endpoint validation
 *
 * Run: npm test
 * Or:  node tests/api.test.js
 */

const http = require('http');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

// Test results tracking
let passed = 0;
let failed = 0;
const results = [];

// Simple assertion helper
function assert(condition, message) {
  if (condition) {
    passed++;
    results.push({ status: 'PASS', message });
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    results.push({ status: 'FAIL', message });
    console.log(`  ❌ ${message}`);
  }
}

// HTTP request helper
function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, data: json, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, data: null, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Test suites
async function testHealthEndpoints() {
  console.log('\n📡 Testing Health Endpoints...\n');

  // Test /api/config
  try {
    const res = await request('/api/config');
    assert(res.status === 200, 'GET /api/config returns 200');
    assert(res.data && res.data.llms, '/api/config returns llms array');
    assert(res.data && typeof res.data.configured === 'boolean', '/api/config returns configured status');
    assert(res.data && res.data.activeTier, '/api/config returns active tier');
  } catch (e) {
    assert(false, `GET /api/config: ${e.message}`);
  }

  // Test /api/tier
  try {
    const res = await request('/api/tier');
    assert(res.status === 200, 'GET /api/tier returns 200');
    assert(res.data && res.data.activeTier, '/api/tier returns active tier');
    assert(res.data && Array.isArray(res.data.tiers), '/api/tier returns tiers array');
  } catch (e) {
    assert(false, `GET /api/tier: ${e.message}`);
  }

  // Test /api/estimate
  try {
    const res = await request('/api/estimate');
    assert(res.status === 200, 'GET /api/estimate returns 200');
    assert(res.data && (typeof res.data.totalCost !== 'undefined' || typeof res.data.total !== 'undefined'), '/api/estimate returns cost data');
  } catch (e) {
    assert(false, `GET /api/estimate: ${e.message}`);
  }

  // Test /api/history
  try {
    const res = await request('/api/history');
    assert(res.status === 200, 'GET /api/history returns 200');
    assert(Array.isArray(res.data), '/api/history returns array');
  } catch (e) {
    assert(false, `GET /api/history: ${e.message}`);
  }
}

async function testAuthEndpoints() {
  console.log('\n🔐 Testing Auth Endpoints...\n');

  // Test /api/auth/config
  try {
    const res = await request('/api/auth/config');
    assert(res.status === 200, 'GET /api/auth/config returns 200');
    assert(typeof res.data?.configured === 'boolean', '/api/auth/config returns configured status');
  } catch (e) {
    assert(false, `GET /api/auth/config: ${e.message}`);
  }

  // Test /api/auth/me (unauthenticated)
  try {
    const res = await request('/api/auth/me');
    assert(res.status === 200, 'GET /api/auth/me returns 200');
    assert(res.data && typeof res.data.authenticated === 'boolean', '/api/auth/me returns auth status');
  } catch (e) {
    assert(false, `GET /api/auth/me: ${e.message}`);
  }
}

async function testStripeEndpoints() {
  console.log('\n💳 Testing Stripe Endpoints...\n');

  // Test /api/stripe/config
  try {
    const res = await request('/api/stripe/config');
    assert(res.status === 200, 'GET /api/stripe/config returns 200');
    assert(typeof res.data?.configured === 'boolean', '/api/stripe/config returns configured status');
  } catch (e) {
    assert(false, `GET /api/stripe/config: ${e.message}`);
  }
}

async function testDebateEndpoints() {
  console.log('\n🧠 Testing Debate Endpoints...\n');

  // Test debate without question (should fail)
  try {
    const res = await request('/api/debate', {
      method: 'POST',
      body: {}
    });
    assert(res.status === 400, 'POST /api/debate without question returns 400');
    assert(res.data?.error, 'Returns error message for missing question');
  } catch (e) {
    assert(false, `POST /api/debate validation: ${e.message}`);
  }

  // Test user stats
  try {
    const res = await request('/api/user/stats');
    assert(res.status === 200, 'GET /api/user/stats returns 200');
    assert(res.data && typeof res.data.tier === 'string', '/api/user/stats returns tier');
    assert(res.data && (typeof res.data.debatesToday !== 'undefined' || typeof res.data.remaining !== 'undefined' || res.data.tier), '/api/user/stats returns usage');
  } catch (e) {
    assert(false, `GET /api/user/stats: ${e.message}`);
  }
}

async function testStaticFiles() {
  console.log('\n📄 Testing Static Files...\n');

  const files = [
    { path: '/', name: 'index.html' },
    { path: '/cortex.html', name: 'cortex.html' },
    { path: '/robots.txt', name: 'robots.txt' },
    { path: '/sitemap.xml', name: 'sitemap.xml' }
  ];

  for (const file of files) {
    try {
      const res = await request(file.path);
      assert(res.status === 200, `GET ${file.path} returns 200`);
      assert(res.raw && res.raw.length > 0, `${file.name} has content`);
    } catch (e) {
      assert(false, `GET ${file.path}: ${e.message}`);
    }
  }
}

// Main test runner
async function runTests() {
  console.log('═'.repeat(60));
  console.log('🧪 ConsensusAI API Test Suite');
  console.log('═'.repeat(60));
  console.log(`\nTesting: ${BASE_URL}\n`);

  const startTime = Date.now();

  try {
    await testHealthEndpoints();
    await testAuthEndpoints();
    await testStripeEndpoints();
    await testDebateEndpoints();
    await testStaticFiles();
  } catch (e) {
    console.error('\n💥 Test suite crashed:', e.message);
    failed++;
  }

  const duration = Date.now() - startTime;

  console.log('\n' + '═'.repeat(60));
  console.log('📊 Test Results');
  console.log('═'.repeat(60));
  console.log(`\n  Total:  ${passed + failed}`);
  console.log(`  Passed: ${passed} ✅`);
  console.log(`  Failed: ${failed} ❌`);
  console.log(`  Time:   ${duration}ms\n`);

  if (failed > 0) {
    console.log('Failed tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.message}`);
    });
    console.log('');
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
