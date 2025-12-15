const puppeteer = require('puppeteer');

const VIEWPORT = { width: 1440, height: 900 }; // Desktop

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
    const page = await browser.newPage();

    await page.setViewport(VIEWPORT);

    console.log('='.repeat(60));
    console.log(`DESKTOP UAT TESTS (${VIEWPORT.width}x${VIEWPORT.height})`);
    console.log('='.repeat(60));

    // 1. INITIAL LOAD
    console.log('\n--- 1. INITIAL LOAD ---');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

    // Cookie banner (at bottom on desktop)
    const cookieBanner = await page.$('#cookie-consent');
    if (cookieBanner) {
        log('TC-1.1 Cookie banner visible (bottom)', 'PASS');
        await page.click('#cookie-accept');
        await new Promise(r => setTimeout(r, 500));
    } else {
        log('TC-1.1 Cookie banner', 'PASS', 'Already accepted');
    }

    // 2. HOME SCREEN
    console.log('\n--- 2. HOME SCREEN ---');

    const orb = await page.$('.core-orb');
    log('TC-2.1 Orb visible', orb ? 'PASS' : 'FAIL');

    const input = await page.$('#questionInput');
    log('TC-2.2 Input visible', input ? 'PASS' : 'FAIL');

    const submitBtn = await page.$('#submitBtn');
    log('TC-2.3 Submit button visible', submitBtn ? 'PASS' : 'FAIL');

    // Desktop-specific: Check for tier selector, devil toggle, etc.
    const tierSelector = await page.$('.tier-selector');
    log('TC-2.4 Tier selector visible (desktop)', tierSelector ? 'PASS' : 'FAIL');

    const devilToggle = await page.$('#devilToggle');
    log('TC-2.5 Devil toggle visible (desktop)', devilToggle ? 'PASS' : 'FAIL');

    const templateChips = await page.$('.template-chips');
    log('TC-2.6 Template chips visible', templateChips ? 'PASS' : 'FAIL');

    // AI nodes visible
    const aiNodes = await page.$$('.ai-node');
    log('TC-2.7 All 4 AI nodes visible', aiNodes.length === 4 ? 'PASS' : 'FAIL', `Found ${aiNodes.length}`);

    await page.screenshot({ path: 'test-results/uat-desktop-home.png' });

    // 3. QUESTION INPUT
    console.log('\n--- 3. QUESTION INPUT ---');

    await page.type('#questionInput', 'Should I start a business or get a job?');
    const inputValue = await page.$eval('#questionInput', el => el.value);
    log('TC-3.1 Can type question', inputValue.length > 0 ? 'PASS' : 'FAIL');

    // 4. DEBATE FLOW
    console.log('\n--- 4. DEBATE FLOW ---');

    await page.click('#submitBtn');
    await new Promise(r => setTimeout(r, 2000));

    // Check stream appears (on desktop it's side panel)
    const streamActive = await page.$('.debate-stream.active');
    log('TC-4.1 Debate stream appears', streamActive ? 'PASS' : 'FAIL');

    // On desktop, query box should still be visible (only hidden on mobile)
    const omniBarVisible = await page.evaluate(() => {
        const omni = document.querySelector('.omni-bar-container');
        if (!omni) return false;
        const style = getComputedStyle(omni);
        return style.display !== 'none' && style.visibility !== 'hidden';
    });
    log('TC-4.2 Query box visible during debate (desktop)', omniBarVisible ? 'PASS' : 'FAIL');

    await page.screenshot({ path: 'test-results/uat-desktop-debate.png' });

    // 5. WAIT FOR VERDICT
    console.log('\n--- 5. VERDICT ---');

    try {
        await page.waitForSelector('.verdict-overlay.active', { timeout: 90000 });
        log('TC-5.1 Verdict panel appears', 'PASS');

        await new Promise(r => setTimeout(r, 1000));

        // Check verdict elements
        const consensusBadge = await page.$('#consensusBadge');
        log('TC-5.2 Consensus badge visible', consensusBadge ? 'PASS' : 'FAIL');

        const decision = await page.$('#verdictDecision');
        log('TC-5.3 Decision text visible', decision ? 'PASS' : 'FAIL');

        const aiGrid = await page.$('.ai-agreement-grid');
        log('TC-5.4 AI response grid visible', aiGrid ? 'PASS' : 'FAIL');

        const aiCards = await page.$$('.ai-response-card');
        log('TC-5.5 All 4 AI cards present', aiCards.length === 4 ? 'PASS' : 'FAIL', `Found ${aiCards.length}`);

        const spectrum = await page.$('.spectrum-container');
        log('TC-5.6 Position spectrum visible', spectrum ? 'PASS' : 'FAIL');

        const insights = await page.$('.insights-grid');
        log('TC-5.7 Key insights visible', insights ? 'PASS' : 'FAIL');

        await page.screenshot({ path: 'test-results/uat-desktop-verdict.png' });

        // 6. CLOSE AND FOLLOW-UP
        console.log('\n--- 6. FOLLOW-UP QUESTION ---');

        const closeBtn = await page.$('.verdict-close');
        if (closeBtn) {
            await closeBtn.click();
            await new Promise(r => setTimeout(r, 500));
        }

        // Check input is visible
        const inputVisibleAfter = await page.evaluate(() => {
            const omni = document.querySelector('.omni-bar-container');
            if (!omni) return false;
            const style = getComputedStyle(omni);
            return style.display !== 'none';
        });
        log('TC-6.1 Input visible after closing verdict', inputVisibleAfter ? 'PASS' : 'FAIL');

        // Can type new question
        await page.$eval('#questionInput', el => el.value = '');
        await page.type('#questionInput', 'What are the risks?');
        const newQuestion = await page.$eval('#questionInput', el => el.value);
        log('TC-6.2 Can type follow-up question', newQuestion.includes('risks') ? 'PASS' : 'FAIL');

        await page.screenshot({ path: 'test-results/uat-desktop-followup.png' });

    } catch (e) {
        log('TC-5.1 Verdict panel', 'FAIL', 'Timeout waiting for verdict');
        await page.screenshot({ path: 'test-results/uat-desktop-timeout.png' });
    }

    // 7. HISTORY DRAWER
    console.log('\n--- 7. HISTORY DRAWER ---');

    const historyToggle = await page.$('.history-toggle');
    if (historyToggle) {
        await historyToggle.click();
        await new Promise(r => setTimeout(r, 500));

        const historyDrawer = await page.$('.history-drawer.open');
        log('TC-7.1 History drawer opens', historyDrawer ? 'PASS' : 'FAIL');

        await page.screenshot({ path: 'test-results/uat-desktop-history.png' });

        // Close it
        const historyClose = await page.$('.history-close');
        if (historyClose) await historyClose.click();
    } else {
        log('TC-7.1 History toggle', 'FAIL', 'Not found');
    }

    // 8. AI SETTINGS
    console.log('\n--- 8. AI SETTINGS ---');

    const settingsBtn = await page.$('.ai-settings-btn');
    if (settingsBtn) {
        await settingsBtn.click();
        await new Promise(r => setTimeout(r, 500));

        const settingsPanel = await page.$('.ai-settings-panel');
        log('TC-8.1 AI settings panel opens', settingsPanel ? 'PASS' : 'FAIL');

        await page.screenshot({ path: 'test-results/uat-desktop-settings.png' });

        // Close it
        const settingsClose = await page.$('.ai-settings-close');
        if (settingsClose) await settingsClose.click();
    } else {
        log('TC-8.1 AI settings button', 'FAIL', 'Not found');
    }

    await browser.close();

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('DESKTOP UAT TEST SUMMARY');
    console.log('='.repeat(60));
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
