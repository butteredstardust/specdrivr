const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function captureScreenshots() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    const outDir = path.join(__dirname, '../screenshots/qa');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    const BASE_URL = 'http://localhost:3000';

    console.log('Capturing login_default.png...');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, 'login_default.png') });

    console.log('Logging in as Admin...');
    await page.fill('input[name="username"]', 'Admin');
    await page.fill('input[name="password"]', 'demo');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/', { timeout: 10000 });
    await page.waitForTimeout(1500);

    console.log('Capturing dashboard_default.png...');
    await page.screenshot({ path: path.join(outDir, 'dashboard_default.png') });

    console.log('Capturing admin_users.png...');
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, 'admin_users.png') });

    console.log('Capturing app_settings.png...');
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, 'app_settings.png') });

    console.log('Capturing 403_page.png...');
    await page.goto(`${BASE_URL}/403`);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, '403_page.png') });

    // Get the first project id if available, else use 1
    console.log('Going to project_overview.png...');
    await page.goto(`${BASE_URL}/projects/1`);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(outDir, 'project_overview.png') });

    console.log('Capturing project_kanban.png...');
    await page.screenshot({ path: path.join(outDir, 'project_kanban.png') });

    console.log('Capturing project_spec.png...');
    await page.click('button:has-text("Spec")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, 'project_spec.png') });

    console.log('Capturing project_plan.png...');
    await page.click('button:has-text("Plan")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, 'project_plan.png') });

    console.log('Capturing project_wave.png...');
    await page.click('button:has-text("Wave Execution")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, 'project_wave.png') });

    console.log('Capturing project_test_results.png...');
    await page.click('button:has-text("Test Results")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, 'project_test_results.png') });

    console.log('Capturing project_logs.png...');
    await page.click('button:has-text("Logs")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, 'project_logs.png') });

    // Route-based tabs
    console.log('Capturing project_commits.png...');
    await page.goto(`${BASE_URL}/projects/1/commits`);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, 'project_commits.png') });

    console.log('Capturing project_settings.png...');
    await page.goto(`${BASE_URL}/projects/1/settings`);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, 'project_settings.png') });

    await browser.close();
    console.log('Done capturing all screenshots!');
}

captureScreenshots().catch(console.error);
