const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // iPhone 14 viewport
    await page.setViewport({
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
    });

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

    // Dismiss cookie banner if present
    try {
        await page.click('#cookie-accept');
        await new Promise(r => setTimeout(r, 500));
    } catch (e) {}

    // Screenshot 1: Initial state
    await page.screenshot({ path: 'test-results/debate-1-initial.png' });
    console.log('1. Initial state captured');

    // Type a question
    await page.type('#questionInput', 'Should I learn Python or JavaScript first?');
    await page.screenshot({ path: 'test-results/debate-2-typing.png' });
    console.log('2. Typing state captured');

    // Submit the form
    await page.click('#submitBtn');
    console.log('3. Form submitted, waiting for debate...');

    // Capture during debate at various stages
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: 'test-results/debate-3-round1.png' });
    console.log('4. Round 1 captured');

    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: 'test-results/debate-4-mid.png' });
    console.log('5. Mid-debate captured');

    await new Promise(r => setTimeout(r, 10000));
    await page.screenshot({ path: 'test-results/debate-5-late.png' });
    console.log('6. Late debate captured');

    // Wait for verdict (up to 60 seconds)
    try {
        await page.waitForSelector('.verdict-overlay.active', { timeout: 60000 });
        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({ path: 'test-results/debate-6-verdict.png' });
        console.log('7. Verdict captured');
    } catch (e) {
        await page.screenshot({ path: 'test-results/debate-6-timeout.png' });
        console.log('7. Timeout - captured current state');
    }

    await browser.close();
    console.log('\nAll debate flow screenshots saved to test-results/');
})();
