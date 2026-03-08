import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("Navigating to login...");
  await page.goto('http://localhost:3000/auth/login');

  console.log("Logging in...");
  await page.fill('input[type="text"], input[name="username"]', 'demo');
  await page.fill('input[type="password"]', 'demo');
  await page.click('button[type="submit"]');

  console.log("Waiting for dashboard...");
  try {
    await page.waitForURL('http://localhost:3000/', { timeout: 10000 });
    console.log("Successfully logged in!");

    // Take screenshot of dashboard
    await page.screenshot({ path: '/tmp/dashboard.png' });
    console.log("Dashboard screenshot saved to /tmp/dashboard.png");

  } catch (e) {
    console.error("Login failed or timed out:");
    console.error(e);
    await page.screenshot({ path: '/tmp/error.png' });
  }

  await browser.close();
})();
