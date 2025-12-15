const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // iPhone X viewport
    await page.setViewport({
        width: 375,
        height: 812,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
    });
    
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    
    await page.screenshot({ path: 'mobile-screenshot.png', fullPage: false });
    console.log('Screenshot saved: mobile-screenshot.png');
    
    await browser.close();
})();
