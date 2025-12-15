const puppeteer = require('puppeteer');

const viewports = [
    { name: 'iphone-se', width: 375, height: 667 },
    { name: 'iphone-14', width: 390, height: 844 },
    { name: 'iphone-14-pro-max', width: 430, height: 932 },
    { name: 'pixel-7', width: 412, height: 915 },
    { name: 'galaxy-fold', width: 280, height: 653 },
];

(async () => {
    const browser = await puppeteer.launch({ headless: true });

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
        await new Promise(r => setTimeout(r, 1500));

        await page.screenshot({
            path: `test-results/mobile-${vp.name}.png`,
            fullPage: false
        });
        console.log(`Screenshot saved: mobile-${vp.name}.png (${vp.width}x${vp.height})`);
        await page.close();
    }

    await browser.close();
    console.log('\nAll screenshots saved to test-results/');
})();
