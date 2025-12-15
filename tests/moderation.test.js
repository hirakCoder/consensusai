/**
 * Content Moderation Unit Tests
 */

const contentModeration = require('../content-moderation');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${name}: ${e.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

console.log('\n=== CONTENT MODERATION TESTS ===\n');

// Test: Banned topics should be blocked
console.log('--- Banned Topics ---');

test('Should block "how to make a bomb"', () => {
  const result = contentModeration.moderateQuery('how to make a bomb at home');
  assert(result.result === 'blocked', 'Should be blocked');
  assert(result.reason === 'banned_topic', 'Should have banned_topic reason');
});

test('Should block suicide methods query', () => {
  const result = contentModeration.moderateQuery('what are suicide methods');
  assert(result.result === 'blocked', 'Should be blocked');
});

test('Should block hacking query', () => {
  const result = contentModeration.moderateQuery('how to hack into someone bank account');
  assert(result.result === 'blocked', 'Should be blocked');
});

// Test: NSFW content should be blocked
console.log('\n--- NSFW Content ---');

test('Should block porn queries', () => {
  const result = contentModeration.moderateQuery('best porn sites');
  assert(result.result === 'blocked', 'Should be blocked');
  assert(result.reason === 'nsfw_content', 'Should have nsfw_content reason');
});

test('Should block explicit adult content', () => {
  const result = contentModeration.moderateQuery('describe explicit sexual acts');
  assert(result.result === 'blocked', 'Should be blocked');
});

// Test: Controversial topics should warn but allow
console.log('\n--- Controversial Topics ---');

test('Should warn but allow abortion debate', () => {
  const result = contentModeration.moderateQuery('should abortion be legal');
  assert(result.result === 'warning', 'Should be warning, not blocked');
  assert(result.topics.includes('abortion'), 'Should identify abortion topic');
});

test('Should warn but allow vaccine debate', () => {
  const result = contentModeration.moderateQuery('are vaccines safe for children');
  assert(result.result === 'warning', 'Should be warning');
  assert(result.topics.includes('vaccine'), 'Should identify vaccine topic');
});

// Test: Normal queries should be allowed
console.log('\n--- Normal Queries ---');

test('Should allow business questions', () => {
  const result = contentModeration.moderateQuery('should I start a business or get a job');
  assert(result.result === 'allowed', 'Should be allowed');
});

test('Should allow tech questions', () => {
  const result = contentModeration.moderateQuery('is Python better than JavaScript');
  assert(result.result === 'allowed', 'Should be allowed');
});

test('Should allow financial questions', () => {
  const result = contentModeration.moderateQuery('should I invest in stocks or real estate');
  assert(result.result === 'allowed', 'Should be allowed');
});

// Test: Spam detection
console.log('\n--- Spam Detection ---');

test('Should block repeated characters', () => {
  const result = contentModeration.moderateQuery('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  assert(result.result === 'blocked', 'Should be blocked');
  assert(result.reason === 'spam_detected', 'Should have spam_detected reason');
});

test('Should block too short queries', () => {
  const result = contentModeration.moderateQuery('hi');
  assert(result.result === 'blocked', 'Should be blocked');
});

// Test: Input sanitization
console.log('\n--- Input Sanitization ---');

test('Should remove script tags', () => {
  const sanitized = contentModeration.sanitizeInput('<script>alert("xss")</script>hello');
  assert(!sanitized.includes('<script'), 'Should remove script tags');
  assert(sanitized.includes('hello'), 'Should keep normal text');
});

test('Should remove HTML tags', () => {
  const sanitized = contentModeration.sanitizeInput('<div onclick="evil()">question</div>');
  assert(!sanitized.includes('<div'), 'Should remove div tags');
  assert(sanitized.includes('question'), 'Should keep content');
});

test('Should limit length', () => {
  const longQuery = 'a'.repeat(2000);
  const sanitized = contentModeration.sanitizeInput(longQuery);
  assert(sanitized.length <= 1000, 'Should limit to 1000 chars');
});

// Test: Edge cases
console.log('\n--- Edge Cases ---');

test('Should handle empty string', () => {
  const result = contentModeration.moderateQuery('');
  assert(result.result === 'blocked', 'Should be blocked');
  assert(result.reason === 'empty_query', 'Should have empty_query reason');
});

test('Should handle null/undefined', () => {
  const result = contentModeration.moderateQuery(null);
  assert(result.result === 'blocked', 'Should be blocked for null');
});

test('Should handle case insensitivity', () => {
  const result = contentModeration.moderateQuery('HOW TO MAKE A BOMB');
  assert(result.result === 'blocked', 'Should be blocked regardless of case');
});

// Summary
console.log(`\n${'='.repeat(50)}`);
console.log('CONTENT MODERATION TEST SUMMARY');
console.log('='.repeat(50));
console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log(`Pass Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

process.exit(failed > 0 ? 1 : 0);
