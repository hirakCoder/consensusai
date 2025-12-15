#!/usr/bin/env node
/**
 * CI/CD Test Runner for ConsensusAI
 *
 * Usage:
 *   npm run test:ci          # Full regression suite
 *   npm run test:smoke       # Quick smoke tests only
 *   npm run test:mobile      # Mobile tests only
 *   npm run test:desktop     # Desktop tests only
 *
 * Exit codes:
 *   0 = All tests passed
 *   1 = Some tests failed
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const CONFIG = {
    baseUrl: process.env.TEST_URL || 'http://localhost:3000',
    timeout: parseInt(process.env.TEST_TIMEOUT) || 90000,
    headless: process.env.HEADLESS !== 'false',
    outputDir: './test-results',
};

const VIEWPORTS = {
    mobile: { width: 390, height: 844, isMobile: true, hasTouch: true },
    desktop: { width: 1440, height: 900, isMobile: false, hasTouch: false },
    'mobile-small': { width: 280, height: 653, isMobile: true, hasTouch: true },
};

const RESULTS = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    tests: [],
    startTime: null,
    endTime: null,
};

function log(test, status, detail = '') {
    const icons = { pass: '✅', fail: '❌', skip: '⏭️' };
    console.log(`${icons[status] || '•'} ${test}${detail ? ': ' + detail : ''}`);
    RESULTS.tests.push({ test, status, detail, timestamp: new Date().toISOString() });
    RESULTS.total++;
    if (status === 'pass') RESULTS.passed++;
    else if (status === 'fail') RESULTS.failed++;
    else RESULTS.skipped++;
}

// ============================================
// SMOKE TESTS - Quick validation (~30 seconds)
// ============================================
async function runSmokeTests(page, viewport) {
    console.log(`\n--- SMOKE TESTS (${viewport}) ---`);

    // Test 1: Page loads
    try {
        await page.goto(CONFIG.baseUrl, { waitUntil: 'networkidle0', timeout: 30000 });
        log(`[${viewport}] Page loads`, 'pass');
    } catch (e) {
        log(`[${viewport}] Page loads`, 'fail', e.message);
        return; // Critical failure
    }

    // Test 2: Core elements exist
    const orb = await page.$('.core-orb');
    log(`[${viewport}] Orb visible`, orb ? 'pass' : 'fail');

    const input = await page.$('#questionInput');
    log(`[${viewport}] Input visible`, input ? 'pass' : 'fail');

    const submit = await page.$('#submitBtn');
    log(`[${viewport}] Submit button visible`, submit ? 'pass' : 'fail');

    // Test 3: No JS errors
    const errors = await page.evaluate(() => window.__jsErrors || []);
    log(`[${viewport}] No JS errors`, errors.length === 0 ? 'pass' : 'fail', errors.join(', '));

    // Test 4: No horizontal overflow
    const hasOverflow = await page.evaluate(() => document.body.scrollWidth > document.body.clientWidth);
    log(`[${viewport}] No horizontal overflow`, !hasOverflow ? 'pass' : 'fail');
}

// ============================================
// REGRESSION TESTS - Full validation (~3-5 min)
// ============================================
async function runRegressionTests(page, viewport) {
    console.log(`\n--- REGRESSION TESTS (${viewport}) ---`);

    await page.goto(CONFIG.baseUrl, { waitUntil: 'networkidle0' });

    // Dismiss cookie banner
    try { await page.click('#cookie-accept'); } catch(e) {}
    await new Promise(r => setTimeout(r, 500));

    // Test: Question input
    await page.type('#questionInput', 'Test question for CI');
    const inputValue = await page.$eval('#questionInput', el => el.value);
    log(`[${viewport}] Can type question`, inputValue.length > 0 ? 'pass' : 'fail');

    // Test: Form submission starts debate
    await page.click('#submitBtn');
    await new Promise(r => setTimeout(r, 2000));
    const streamActive = await page.$('.debate-stream.active');
    log(`[${viewport}] Debate stream starts`, streamActive ? 'pass' : 'fail');

    // Test: Wait for verdict (or timeout)
    try {
        await page.waitForSelector('.verdict-overlay.active', { timeout: CONFIG.timeout });
        log(`[${viewport}] Verdict panel appears`, 'pass');

        // Verify verdict content
        const consensusBadge = await page.$('#consensusBadge');
        log(`[${viewport}] Consensus badge visible`, consensusBadge ? 'pass' : 'fail');

        const aiCards = await page.$$('.ai-response-card');
        log(`[${viewport}] AI cards present`, aiCards.length === 4 ? 'pass' : 'fail', `Found ${aiCards.length}`);

        // Test: Close verdict
        await page.click('.verdict-close');
        await new Promise(r => setTimeout(r, 500));

        const inputAfter = await page.evaluate(() => {
            const omni = document.querySelector('.omni-bar-container');
            return omni && getComputedStyle(omni).display !== 'none';
        });
        log(`[${viewport}] Input visible after verdict`, inputAfter ? 'pass' : 'fail');

    } catch (e) {
        log(`[${viewport}] Verdict panel`, 'fail', 'Timeout');
    }
}

// ============================================
// SECURITY TESTS
// ============================================
async function runSecurityTests(page) {
    console.log('\n--- SECURITY TESTS ---');

    await page.goto(CONFIG.baseUrl, { waitUntil: 'networkidle0' });

    // Test: Security headers
    const response = await page.goto(CONFIG.baseUrl);
    const headers = response.headers();

    log('X-Content-Type-Options header', headers['x-content-type-options'] === 'nosniff' ? 'pass' : 'fail');
    log('X-Frame-Options header', headers['x-frame-options'] === 'DENY' ? 'pass' : 'fail');
    log('X-XSS-Protection header', headers['x-xss-protection']?.includes('1') ? 'pass' : 'fail');

    // Test: No inline scripts (CSP)
    const inlineScripts = await page.evaluate(() => {
        const scripts = document.querySelectorAll('script:not([src])');
        return scripts.length;
    });
    log('Limited inline scripts', inlineScripts < 5 ? 'pass' : 'fail', `Found ${inlineScripts}`);

    // Test: HTTPS redirect (if not localhost)
    if (!CONFIG.baseUrl.includes('localhost')) {
        const httpUrl = CONFIG.baseUrl.replace('https://', 'http://');
        const httpResponse = await page.goto(httpUrl, { waitUntil: 'domcontentloaded' });
        log('HTTP redirects to HTTPS', httpResponse.url().startsWith('https://') ? 'pass' : 'fail');
    } else {
        log('HTTP redirect', 'skip', 'Localhost');
    }

    // Test: XSS in input
    await page.type('#questionInput', '<script>alert("xss")</script>');
    await page.click('#submitBtn');
    await new Promise(r => setTimeout(r, 1000));
    const alertTriggered = await page.evaluate(() => window.__xssTriggered || false);
    log('XSS protection in input', !alertTriggered ? 'pass' : 'fail');
}

// ============================================
// MAIN RUNNER
// ============================================
async function main() {
    const args = process.argv.slice(2);
    const mode = args[0] || 'full'; // smoke, mobile, desktop, security, full

    console.log('='.repeat(60));
    console.log(`ConsensusAI CI Test Runner - Mode: ${mode.toUpperCase()}`);
    console.log(`Base URL: ${CONFIG.baseUrl}`);
    console.log('='.repeat(60));

    RESULTS.startTime = new Date().toISOString();

    // Ensure output directory exists
    if (!fs.existsSync(CONFIG.outputDir)) {
        fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }

    const browser = await puppeteer.launch({ headless: CONFIG.headless });

    try {
        if (mode === 'smoke' || mode === 'full') {
            for (const [name, vp] of Object.entries(VIEWPORTS)) {
                const page = await browser.newPage();
                await page.setViewport({ ...vp, deviceScaleFactor: 2 });
                await runSmokeTests(page, name);
                await page.close();
            }
        }

        if (mode === 'mobile' || mode === 'full') {
            const page = await browser.newPage();
            await page.setViewport({ ...VIEWPORTS.mobile, deviceScaleFactor: 2 });
            await runRegressionTests(page, 'mobile');
            await page.close();
        }

        if (mode === 'desktop' || mode === 'full') {
            const page = await browser.newPage();
            await page.setViewport(VIEWPORTS.desktop);
            await runRegressionTests(page, 'desktop');
            await page.close();
        }

        if (mode === 'security' || mode === 'full') {
            const page = await browser.newPage();
            await page.setViewport(VIEWPORTS.desktop);
            await runSecurityTests(page);
            await page.close();
        }

    } finally {
        await browser.close();
    }

    RESULTS.endTime = new Date().toISOString();

    // Output results
    console.log('\n' + '='.repeat(60));
    console.log('TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total: ${RESULTS.total} | Passed: ${RESULTS.passed} | Failed: ${RESULTS.failed} | Skipped: ${RESULTS.skipped}`);
    console.log(`Pass Rate: ${((RESULTS.passed / (RESULTS.total - RESULTS.skipped)) * 100).toFixed(1)}%`);
    console.log(`Duration: ${(new Date(RESULTS.endTime) - new Date(RESULTS.startTime)) / 1000}s`);

    // Save results to JSON
    const resultFile = `${CONFIG.outputDir}/ci-results-${Date.now()}.json`;
    fs.writeFileSync(resultFile, JSON.stringify(RESULTS, null, 2));
    console.log(`\nResults saved to: ${resultFile}`);

    // Exit with appropriate code
    process.exit(RESULTS.failed > 0 ? 1 : 0);
}

main().catch(err => {
    console.error('Test runner failed:', err);
    process.exit(1);
});
