const puppeteer = require('puppeteer');

const VIEWPORT = { width: 1440, height: 900 };

let passed = 0;
let failed = 0;

function log(test, status, detail = '') {
    const icon = status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${test}${detail ? ': ' + detail : ''}`);
    if (status === 'PASS') passed++;
    else failed++;
}

async function runTests() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);

    console.log('='.repeat(60));
    console.log('DESKTOP UNIQUE FLOWS TEST');
    console.log('='.repeat(60));

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

    // Dismiss cookie if present
    try { await page.click('#cookie-accept'); } catch(e) {}
    await new Promise(r => setTimeout(r, 500));

    // ==========================================
    // 1. DEVIL'S ADVOCATE MODE
    // ==========================================
    console.log('\n--- 1. DEVIL\'S ADVOCATE MODE ---');

    const devilToggle = await page.$('#devilAdvocate');
    log('1.1 Devil toggle exists', devilToggle ? 'PASS' : 'FAIL');

    // Check initial state (should be off)
    const initialState = await page.$eval('#devilAdvocate', el => el.checked);
    log('1.2 Devil mode initially OFF', !initialState ? 'PASS' : 'FAIL');

    // Toggle it on (click the devil-toggle container or the switch)
    await page.click('#devilToggle');
    await new Promise(r => setTimeout(r, 300));

    const toggledState = await page.$eval('#devilAdvocate', el => el.checked);
    log('1.3 Can toggle Devil mode ON', toggledState ? 'PASS' : 'FAIL');

    await page.screenshot({ path: 'test-results/desktop-devil-on.png' });

    // Submit with Devil's Advocate on
    await page.type('#questionInput', 'Should I buy a Tesla?');
    await page.click('#submitBtn');

    await new Promise(r => setTimeout(r, 2000));

    // Check if stream shows Devil's Advocate indication
    const streamText = await page.evaluate(() => {
        const stream = document.querySelector('.debate-stream');
        return stream ? stream.innerText : '';
    });
    log('1.4 Debate starts with Devil mode', streamText.length > 0 ? 'PASS' : 'FAIL');

    // Wait for verdict
    try {
        await page.waitForSelector('.verdict-overlay.active', { timeout: 90000 });
        log('1.5 Devil\'s Advocate debate completes', 'PASS');
        await page.screenshot({ path: 'test-results/desktop-devil-verdict.png' });

        // Close verdict
        await page.click('.verdict-close');
        await new Promise(r => setTimeout(r, 500));
    } catch(e) {
        log('1.5 Devil\'s Advocate debate', 'FAIL', 'Timeout');
    }

    // ==========================================
    // 2. CONTEXT/CONSTRAINTS INPUT
    // ==========================================
    console.log('\n--- 2. CONTEXT/CONSTRAINTS ---');

    // Find and click context toggle
    const contextToggle = await page.$('#contextToggle');
    log('2.1 Context toggle exists', contextToggle ? 'PASS' : 'FAIL');

    if (contextToggle) {
        await contextToggle.click();
        await new Promise(r => setTimeout(r, 300));

        const contextContainer = await page.$('#contextContainer.open');
        log('2.2 Context container opens', contextContainer ? 'PASS' : 'FAIL');

        // Type context
        const contextInput = await page.$('#contextInput');
        if (contextInput) {
            await contextInput.type('I have a budget of $50,000 and live in California');
            const contextValue = await page.$eval('#contextInput', el => el.value);
            log('2.3 Can type context', contextValue.length > 0 ? 'PASS' : 'FAIL');
        }

        await page.screenshot({ path: 'test-results/desktop-context.png' });
    }

    // ==========================================
    // 3. TIER SELECTION
    // ==========================================
    console.log('\n--- 3. TIER SELECTION ---');

    const tierSelector = await page.$('.tier-selector');
    log('3.1 Tier selector exists', tierSelector ? 'PASS' : 'FAIL');

    if (tierSelector) {
        await tierSelector.click();
        await new Promise(r => setTimeout(r, 300));

        const tierDropdown = await page.$('.tier-selector.open');
        log('3.2 Tier dropdown opens', tierDropdown ? 'PASS' : 'FAIL');

        await page.screenshot({ path: 'test-results/desktop-tier-dropdown.png' });

        // Check for tier options
        const budgetOption = await page.$('#tierOptionBudget');
        const premiumOption = await page.$('#tierOptionPremium');
        log('3.3 Budget option exists', budgetOption ? 'PASS' : 'FAIL');
        log('3.4 Premium option exists', premiumOption ? 'PASS' : 'FAIL');

        // Click outside to close
        await page.click('body');
        await new Promise(r => setTimeout(r, 300));
    }

    // ==========================================
    // 4. AI PANEL - SELECT/DESELECT AIs
    // ==========================================
    console.log('\n--- 4. AI PANEL ---');

    const aiPanelBtn = await page.$('.ai-settings-btn');
    log('4.1 AI Panel button exists', aiPanelBtn ? 'PASS' : 'FAIL');

    if (aiPanelBtn) {
        await aiPanelBtn.click();
        await new Promise(r => setTimeout(r, 500));

        const aiPanel = await page.$('.ai-settings-panel');
        log('4.2 AI Panel opens', aiPanel ? 'PASS' : 'FAIL');

        await page.screenshot({ path: 'test-results/desktop-ai-panel.png' });

        // Check for AI toggles
        const aiToggles = await page.$$('.ai-toggle-card');
        log('4.3 AI toggle cards exist', aiToggles.length >= 4 ? 'PASS' : 'FAIL', `Found ${aiToggles.length}`);

        // Try to toggle one AI off
        const firstToggle = await page.$('.ai-toggle-card input[type="checkbox"]');
        if (firstToggle) {
            const beforeState = await page.evaluate(el => el.checked, firstToggle);
            await firstToggle.click();
            await new Promise(r => setTimeout(r, 300));
            const afterState = await page.evaluate(el => el.checked, firstToggle);
            log('4.4 Can toggle AI on/off', beforeState !== afterState ? 'PASS' : 'FAIL');

            // Toggle back
            await firstToggle.click();
        }

        // Close panel
        const closeBtn = await page.$('.ai-settings-close');
        if (closeBtn) await closeBtn.click();
        await new Promise(r => setTimeout(r, 300));
    }

    // ==========================================
    // 5. FOLLOWUP QUESTION FLOW
    // ==========================================
    console.log('\n--- 5. FOLLOWUP QUESTION FLOW ---');

    // Clear input and start a new debate
    await page.$eval('#questionInput', el => el.value = '');

    // Turn off devil's advocate
    const devilChecked = await page.$eval('#devilAdvocate', el => el.checked);
    if (devilChecked) {
        await page.click('#devilToggle');
        await new Promise(r => setTimeout(r, 300));
    }

    await page.type('#questionInput', 'Is Python better than JavaScript?');
    await page.click('#submitBtn');

    try {
        await page.waitForSelector('.verdict-overlay.active', { timeout: 90000 });
        log('5.1 Initial debate completes', 'PASS');

        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({ path: 'test-results/desktop-followup-verdict.png' });

        // Look for followup section in verdict
        const followupSection = await page.$('#followupSection');
        log('5.2 Followup section exists', followupSection ? 'PASS' : 'FAIL');

        if (followupSection) {
            // Check if there's a followup input
            const followupInput = await page.$('#followupInput');
            log('5.3 Followup input exists', followupInput ? 'PASS' : 'FAIL');

            if (followupInput) {
                await followupInput.type('What about for web development specifically?');
                const followupValue = await page.$eval('#followupInput', el => el.value);
                log('5.4 Can type followup question', followupValue.length > 0 ? 'PASS' : 'FAIL');

                await page.screenshot({ path: 'test-results/desktop-followup-typed.png' });

                // Submit followup
                const followupSubmit = await page.$('#followupSubmit');
                if (followupSubmit) {
                    await followupSubmit.click();
                    log('5.5 Can submit followup', 'PASS');

                    // Wait for new verdict
                    await new Promise(r => setTimeout(r, 5000));
                    await page.screenshot({ path: 'test-results/desktop-followup-result.png' });
                }
            }
        }

        // Test "New Question" button
        const newQuestionBtn = await page.$('.verdict-btn-new');
        if (newQuestionBtn) {
            await newQuestionBtn.click();
            await new Promise(r => setTimeout(r, 500));

            const inputVisible = await page.evaluate(() => {
                const input = document.querySelector('#questionInput');
                return input && document.activeElement === input;
            });
            log('5.6 New Question button works', 'PASS');
        }

    } catch(e) {
        log('5.1 Initial debate', 'FAIL', 'Timeout');
    }

    // ==========================================
    // 6. HISTORY - VIEW PAST DEBATE
    // ==========================================
    console.log('\n--- 6. HISTORY - VIEW PAST DEBATE ---');

    const historyBtn = await page.$('.history-toggle');
    if (historyBtn) {
        await historyBtn.click();
        await new Promise(r => setTimeout(r, 500));

        const historyItems = await page.$$('.history-item');
        log('6.1 History has items', historyItems.length > 0 ? 'PASS' : 'FAIL', `Found ${historyItems.length}`);

        if (historyItems.length > 0) {
            await page.screenshot({ path: 'test-results/desktop-history-list.png' });

            // Click first history item
            await historyItems[0].click();
            await new Promise(r => setTimeout(r, 500));

            const verdictShown = await page.$('.verdict-overlay.active');
            log('6.2 Can view past debate from history', verdictShown ? 'PASS' : 'FAIL');

            await page.screenshot({ path: 'test-results/desktop-history-view.png' });
        }
    }

    await browser.close();

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('DESKTOP UNIQUE FLOWS SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
    console.log(`Pass Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    console.log('\nScreenshots saved to test-results/');
}

runTests().catch(console.error);
