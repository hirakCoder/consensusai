/**
 * API Resilience Unit Tests
 */

const apiResilience = require('../api-resilience');

let passed = 0;
let failed = 0;

function test(name, fn) {
  return (async () => {
    try {
      await fn();
      console.log(`  ✅ ${name}`);
      passed++;
    } catch (e) {
      console.log(`  ❌ ${name}: ${e.message}`);
      failed++;
    }
  })();
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

async function runTests() {
  console.log('\n=== API RESILIENCE TESTS ===\n');

  // Reset all circuit breakers before tests
  apiResilience.resetAllCircuitBreakers();

  // Test: Initial circuit breaker state
  console.log('--- Circuit Breaker State ---');

  await test('New API should have closed circuit', () => {
    const check = apiResilience.canMakeRequest('test-api');
    assert(check.allowed === true, 'Should allow request');
  });

  // Test: Success recording
  console.log('\n--- Success Recording ---');

  await test('Should record success and keep circuit closed', () => {
    apiResilience.recordSuccess('test-api');
    const status = apiResilience.getHealthStatus();
    assert(status['test-api'].state === 'closed', 'Should remain closed');
    assert(status['test-api'].successes >= 1, 'Should have recorded success');
  });

  // Test: Failure recording
  console.log('\n--- Failure Recording ---');

  await test('Should open circuit after threshold failures', () => {
    apiResilience.resetCircuitBreaker('failure-test');

    // Record failures up to threshold
    for (let i = 0; i < 5; i++) {
      apiResilience.recordFailure('failure-test', new Error('Test failure'));
    }

    const status = apiResilience.getHealthStatus();
    assert(status['failure-test'].state === 'open', 'Should be open after 5 failures');
  });

  await test('Open circuit should block requests', () => {
    const check = apiResilience.canMakeRequest('failure-test');
    assert(check.allowed === false, 'Should not allow request');
    assert(check.reason === 'circuit_open', 'Should have circuit_open reason');
  });

  // Test: Error classification
  console.log('\n--- Error Classification ---');

  await test('Should identify timeout as retryable', () => {
    const retryable = apiResilience.isRetryableError(new Error('Request timeout'));
    assert(retryable === true, 'Timeout should be retryable');
  });

  await test('Should identify rate limit as retryable', () => {
    const retryable = apiResilience.isRetryableError(new Error('Rate limit exceeded'));
    assert(retryable === true, 'Rate limit should be retryable');
  });

  await test('Should identify 503 as retryable', () => {
    const retryable = apiResilience.isRetryableError(new Error('503 Service Unavailable'));
    assert(retryable === true, '503 should be retryable');
  });

  await test('Should identify auth error as non-retryable', () => {
    const retryable = apiResilience.isRetryableError(new Error('Invalid API key'));
    assert(retryable === false, 'Auth error should not be retryable');
  });

  await test('Should identify quota error as non-retryable', () => {
    const retryable = apiResilience.isRetryableError(new Error('Insufficient quota'));
    assert(retryable === false, 'Quota error should not be retryable');
  });

  // Test: Execute with resilience - success case
  console.log('\n--- Execute with Resilience ---');

  await test('Should execute successful call without retry', async () => {
    apiResilience.resetCircuitBreaker('success-api');

    let callCount = 0;
    const result = await apiResilience.executeWithResilience(
      'success-api',
      async () => {
        callCount++;
        return { data: 'success' };
      }
    );

    assert(result.data === 'success', 'Should return result');
    assert(callCount === 1, 'Should only call once');
  });

  // Test: Execute with resilience - retry case
  await test('Should retry on retryable error', async () => {
    apiResilience.resetCircuitBreaker('retry-api');

    let callCount = 0;
    try {
      await apiResilience.executeWithResilience(
        'retry-api',
        async () => {
          callCount++;
          if (callCount < 3) {
            throw new Error('Connection timeout');
          }
          return { data: 'success after retry' };
        },
        { maxRetries: 3 }
      );
    } catch (e) {
      // Expected if all retries fail
    }

    assert(callCount >= 2, 'Should have retried at least once');
  });

  // Test: Execute with resilience - non-retryable error
  await test('Should not retry on non-retryable error', async () => {
    apiResilience.resetCircuitBreaker('no-retry-api');

    let callCount = 0;
    try {
      await apiResilience.executeWithResilience(
        'no-retry-api',
        async () => {
          callCount++;
          throw new Error('Invalid API key - 401');
        },
        { maxRetries: 3 }
      );
    } catch (e) {
      // Expected
    }

    assert(callCount === 1, 'Should not retry on auth error');
  });

  // Test: Health status
  console.log('\n--- Health Status ---');

  await test('Should return health status for all APIs', () => {
    const health = apiResilience.getHealthStatus();
    assert(typeof health === 'object', 'Should return object');
    assert('test-api' in health, 'Should include test-api');
  });

  // Test: Reset circuit breaker
  console.log('\n--- Reset Functions ---');

  await test('Should reset specific circuit breaker', () => {
    apiResilience.resetCircuitBreaker('failure-test');
    const status = apiResilience.getHealthStatus();
    assert(status['failure-test'].state === 'closed', 'Should be closed after reset');
    assert(status['failure-test'].failures === 0, 'Should have 0 failures after reset');
  });

  await test('Should reset all circuit breakers', () => {
    apiResilience.resetAllCircuitBreakers();
    const health = apiResilience.getHealthStatus();
    const allClosed = Object.values(health).every(h => h.state === 'closed');
    assert(allClosed, 'All circuits should be closed');
  });

  // Summary
  console.log(`\n${'='.repeat(50)}`);
  console.log('API RESILIENCE TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`Pass Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
