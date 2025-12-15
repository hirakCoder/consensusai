const puppeteer = require('puppeteer');

const VIEWPORTS = {
    'iphone-14': { width: 390, height: 844 },
    'galaxy-fold': { width: 280, height: 653 },
};

const TESTS = [];
let passed = 0;
let failed = 0;

function log(test, status, detail = '') {
    const icon = status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${test}${detail ? ': ' + detail : ''}`);
    TESTS.push({ test, status, detail });
    if (status === 'PASS') passed++;
    else failed++;
}

async function runTests() {
    const browser = await puppeteer.launch({ headless: true });

    for (const [device, viewport] of Object.entries(VIEWPORTS)) {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`TESTING: ${device} (${viewport.width}x${viewport.height})`);
        console.log('='.repeat(50));

        const page = await browser.newPage();
        await page.setViewport({
            ...viewport,
            deviceScaleFactor: 2,
            isMobile: true,
            hasTouch: true,
        });

        // TC-1.1: Initial Load
        console.log('\n--- 1. INITIAL LOAD ---');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

        // Check cookie banner
        const cookieBanner = await page.$('#cookie-consent');
        if (cookieBanner) {
            log(`[${device}] TC-1.1 Cookie banner visible`, 'PASS');
            await page.click('#cookie-accept');
            await new Promise(r => setTimeout(r, 500));
        } else {
            log(`[${device}] TC-1.1 Cookie banner`, 'PASS', 'Already accepted');
        }

        // TC-1.2: Home Screen Elements
        console.log('\n--- 2. HOME SCREEN ---');

        const orb = await page.$('.core-orb');
        log(`[${device}] TC-1.2a Orb visible`, orb ? 'PASS' : 'FAIL');

        const input = await page.$('#questionInput');
        log(`[${device}] TC-1.2b Input visible`, input ? 'PASS' : 'FAIL');

        const submitBtn = await page.$('#submitBtn');
        log(`[${device}] TC-1.2c Submit button visible`, submitBtn ? 'PASS' : 'FAIL');

        // Check for horizontal overflow
        const hasOverflow = await page.evaluate(() => {
            return document.body.scrollWidth > document.body.clientWidth;
        });
        log(`[${device}] TC-1.3 No horizontal overflow`, !hasOverflow ? 'PASS' : 'FAIL');

        // TC-2: Question Input
        console.log('\n--- 3. QUESTION INPUT ---');

        await page.type('#questionInput', 'Is remote work better than office work?');
        const inputValue = await page.$eval('#questionInput', el => el.value);
        log(`[${device}] TC-2.1 Can type question`, inputValue.length > 0 ? 'PASS' : 'FAIL');

        // TC-3: Debate Flow
        console.log('\n--- 4. DEBATE FLOW ---');

        await page.click('#submitBtn');
        await new Promise(r => setTimeout(r, 2000));

        // Check stream appears
        const streamActive = await page.$('.debate-stream.active');
        log(`[${device}] TC-3.1 Debate stream appears`, streamActive ? 'PASS' : 'FAIL');

        // Check query box hidden during debate
        const omniBarHidden = await page.evaluate(() => {
            const omni = document.querySelector('.omni-bar-container');
            return omni && getComputedStyle(omni).display === 'none';
        });
        log(`[${device}] TC-3.2 Query box hidden during debate`, omniBarHidden ? 'PASS' : 'FAIL');

        // Screenshot during debate
        await page.screenshot({ path: `test-results/uat-${device}-debate.png` });

        // Wait for verdict
        console.log('\n--- 5. VERDICT ---');

        try {
            await page.waitForSelector('.verdict-overlay.active', { timeout: 90000 });
            log(`[${device}] TC-4.1 Verdict panel appears`, 'PASS');

            await new Promise(r => setTimeout(r, 1000));

            // Check verdict elements
            const consensusBadge = await page.$('#consensusBadge');
            log(`[${device}] TC-4.2 Consensus badge visible`, consensusBadge ? 'PASS' : 'FAIL');

            const aiGrid = await page.$('.ai-agreement-grid');
            log(`[${device}] TC-4.4 AI response grid visible`, aiGrid ? 'PASS' : 'FAIL');

            // Check all 4 AI cards
            const aiCards = await page.$$('.ai-response-card');
            log(`[${device}] TC-4.4b All 4 AI cards present`, aiCards.length === 4 ? 'PASS' : 'FAIL', `Found ${aiCards.length}`);

            // Screenshot verdict
            await page.screenshot({ path: `test-results/uat-${device}-verdict.png` });

            // TC-5: Follow-up Question
            console.log('\n--- 6. FOLLOW-UP QUESTION ---');

            // Close verdict
            const closeBtn = await page.$('.verdict-close');
            if (closeBtn) {
                await closeBtn.click();
                await new Promise(r => setTimeout(r, 500));
            }

            // Check input is visible again
            const inputVisibleAfter = await page.evaluate(() => {
                const omni = document.querySelector('.omni-bar-container');
                return omni && getComputedStyle(omni).display !== 'none';
            });
            log(`[${device}] TC-5.1 Input visible after closing verdict`, inputVisibleAfter ? 'PASS' : 'FAIL');

            // Clear and type new question
            await page.$eval('#questionInput', el => el.value = '');
            await page.type('#questionInput', 'Follow-up: What are the pros?');
            const newQuestion = await page.$eval('#questionInput', el => el.value);
            log(`[${device}] TC-5.2 Can type follow-up question`, newQuestion.includes('Follow-up') ? 'PASS' : 'FAIL');

        } catch (e) {
            log(`[${device}] TC-4.1 Verdict panel`, 'FAIL', 'Timeout waiting for verdict');
            await page.screenshot({ path: `test-results/uat-${device}-timeout.png` });
        }

        await page.close();
    }

    await browser.close();

    // Summary
    console.log(`\n${'='.repeat(50)}`);
    console.log('UAT TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
    console.log(`Pass Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed > 0) {
        console.log('\nFailed Tests:');
        TESTS.filter(t => t.status === 'FAIL').forEach(t => {
            console.log(`  ❌ ${t.test}: ${t.detail}`);
        });
    }

    console.log('\nScreenshots saved to test-results/');
}

runTests().catch(console.error);
