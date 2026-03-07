const { chromium } = require('@playwright/test');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://localhost:3000/auth/login');
  await page.waitForTimeout(2000);

  try {
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'demo');
    await page.click('button[type="submit"]', { force: true });

    await page.waitForTimeout(5000);

    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(2000);

    await page.evaluate(() => {
        document.documentElement.removeAttribute('data-theme');
    });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/search-light.png' });

    await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/search-dark.png' });

  } catch (e) {
    console.error('Error during capture:', e.message);
  }

  await browser.close();
  console.log("Screenshots captured successfully.");
})();
