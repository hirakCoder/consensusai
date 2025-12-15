const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });

    const viewports = [
        { name: 'iphone-14-verdict', width: 390, height: 844 },
        { name: 'galaxy-fold-verdict', width: 280, height: 653 },
    ];

    for (const vp of viewports) {
        const page = await browser.newPage();
        await page.setViewport({
            width: vp.width,
            height: vp.height,
            deviceScaleFactor: 2,
            isMobile: true,
            hasTouch: true,
        });

        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 1000));

        // Trigger verdict panel with mock data
        await page.evaluate(() => {
            // Show verdict overlay
            const overlay = document.getElementById('verdictOverlay');
            overlay.classList.add('active');

            // Set mock data
            document.getElementById('verdictDecision').textContent = 'YES, proceed with caution';
            document.getElementById('verdictQuestion').textContent = 'Should I invest in Bitcoin?';
            document.getElementById('consensusBadge').innerHTML = '<span>3/4 AIs AGREE</span>';
            document.getElementById('confidenceValue').textContent = '7/10';

            // Set AI responses
            document.getElementById('respVerdictGpt').textContent = 'YES';
            document.getElementById('respSummaryGpt').textContent = 'Good long-term investment with proper risk management.';
            document.getElementById('respVerdictGemini').textContent = 'YES';
            document.getElementById('respSummaryGemini').textContent = 'Consider dollar-cost averaging approach.';
            document.getElementById('respVerdictClaude').textContent = 'CONDITIONAL';
            document.getElementById('respSummaryClaude').textContent = 'Only if you can afford to lose the investment.';
            document.getElementById('respVerdictGrok').textContent = 'YES';
            document.getElementById('respSummaryGrok').textContent = 'High risk, high reward. YOLO responsibly.';
        });

        await new Promise(r => setTimeout(r, 500));

        await page.screenshot({
            path: `test-results/${vp.name}.png`,
            fullPage: false
        });
        console.log(`Screenshot saved: ${vp.name}.png (${vp.width}x${vp.height})`);
        await page.close();
    }

    await browser.close();
    console.log('\nVerdict panel screenshots saved to test-results/');
})();
