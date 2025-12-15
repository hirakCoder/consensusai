const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Galaxy Fold - smallest viewport
    await page.setViewport({
        width: 280,
        height: 653,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
    });

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

    // Dismiss cookie
    try { await page.click('#cookie-accept'); } catch(e) {}
    await new Promise(r => setTimeout(r, 500));

    // Initial
    await page.screenshot({ path: 'test-results/fold-1-initial.png' });

    // Type and submit
    await page.type('#questionInput', 'Is AI dangerous?');
    await page.click('#submitBtn');

    // During debate
    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: 'test-results/fold-2-debate.png' });

    // Wait for verdict
    try {
        await page.waitForSelector('.verdict-overlay.active', { timeout: 60000 });
        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({ path: 'test-results/fold-3-verdict.png' });
    } catch(e) {
        await page.screenshot({ path: 'test-results/fold-3-timeout.png' });
    }

    await browser.close();
    console.log('Galaxy Fold test complete');
})();
