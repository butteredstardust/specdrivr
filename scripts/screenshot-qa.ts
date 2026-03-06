import { chromium, Page, BrowserContext } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:3001';
const OUT_DIR = path.join(process.cwd(), 'screenshots', 'qa');
const VIEWPORT = { width: 1440, height: 900 };

// Project ID 1 = "Event Management Platform" from seed data
const PROJECT_ID = '1';

const results: { name: string; status: 'ok' | 'fail'; note?: string }[] = [];

async function shot(page: Page, name: string) {
    try {
        const file = path.join(OUT_DIR, `${name}.png`);
        await page.screenshot({ path: file, fullPage: true });
        console.log(`  ✓ ${name}.png`);
        results.push({ name, status: 'ok' });
    } catch (err: any) {
        console.error(`  ✗ ${name}: ${err.message}`);
        results.push({ name, status: 'fail', note: err.message });
    }
}

async function gotoAndShot(page: Page, url: string, name: string) {
    try {
        await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(1000);
        await shot(page, name);
    } catch (err: any) {
        console.error(`  ✗ ${name} (goto failed): ${err.message}`);
        results.push({ name, status: 'fail', note: err.message });
    }
}

async function login(context: BrowserContext): Promise<Page> {
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(500);
    await page.fill('input[name="username"]', 'Admin');
    await page.fill('input[name="password"]', 'demo');
    await page.click('button[type="submit"]');
    // Wait for redirect to dashboard
    await page.waitForURL('**/', { timeout: 15000 }).catch(() => { });
    await page.waitForTimeout(1000);
    return page;
}

async function run() {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    console.log(`\n📸 Starting QA screenshot capture → ${OUT_DIR}\n`);

    const browser = await chromium.launch({ headless: true });

    // ──────────────────────────────────────────────
    // 1. UNAUTHENTICATED PAGES (no auth needed)
    // ──────────────────────────────────────────────
    console.log('── Unauthenticated Pages ──');
    {
        const ctx = await browser.newContext({ viewport: VIEWPORT });
        const pg = await ctx.newPage();
        await gotoAndShot(pg, '/auth/login', 'login_default');
        await gotoAndShot(pg, '/403', '403_page');
        await ctx.close();
    }

    // ──────────────────────────────────────────────
    // 2. AUTHENTICATED PAGES
    // ──────────────────────────────────────────────
    console.log('\n── Authenticated Pages ──');
    const ctx = await browser.newContext({ viewport: VIEWPORT });
    const page = await login(ctx);

    // Dashboard default
    await gotoAndShot(page, '/', 'dashboard_default');

    // Dashboard: sidebar fully visible (it may already be visible; scroll to ensure)
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await shot(page, 'dashboard_sidebar');

    // Dashboard: New Project modal
    try {
        // Try common button labels
        const newProjBtn = page.locator('button', { hasText: /new project/i }).first();
        if (await newProjBtn.isVisible({ timeout: 3000 })) {
            await newProjBtn.click();
            await page.waitForTimeout(600);
            await shot(page, 'dashboard_new_project_modal');
            // Close the modal
            await page.keyboard.press('Escape');
            await page.waitForTimeout(300);
        } else {
            console.log('  ⚠  New Project button not found, skipping modal screenshot');
            results.push({ name: 'dashboard_new_project_modal', status: 'fail', note: 'Button not found' });
        }
    } catch (err: any) {
        console.error(`  ✗ dashboard_new_project_modal: ${err.message}`);
        results.push({ name: 'dashboard_new_project_modal', status: 'fail', note: err.message });
    }

    // ──────────────────────────────────────────────
    // 3. PROJECT PAGES
    // ──────────────────────────────────────────────
    console.log('\n── Project Pages ──');
    await gotoAndShot(page, `/projects/${PROJECT_ID}`, 'project_overview');

    // Tab screenshots
    const tabs = [
        { label: 'Kanban', name: 'project_kanban' },
        { label: 'Spec', name: 'project_spec' },
        { label: 'Plan', name: 'project_plan' },
        { label: 'Wave', name: 'project_wave' },
        { label: 'Test Results', name: 'project_test_results' },
        { label: 'Logs', name: 'project_logs' },
    ];

    for (const { label, name } of tabs) {
        try {
            // Try role=tab first, then text fallback
            let clicked = false;
            const roleTab = page.getByRole('tab', { name: new RegExp(label, 'i') });
            if (await roleTab.count() > 0) {
                await roleTab.first().click();
                clicked = true;
            } else {
                const textLink = page.locator(`text=${label}`).first();
                if (await textLink.count() > 0) {
                    await textLink.click();
                    clicked = true;
                }
            }
            if (clicked) {
                await page.waitForTimeout(800);
                await shot(page, name);
            } else {
                console.log(`  ⚠  Tab "${label}" not found`);
                results.push({ name, status: 'fail', note: `Tab "${label}" not found` });
            }
        } catch (err: any) {
            console.error(`  ✗ ${name}: ${err.message}`);
            results.push({ name, status: 'fail', note: err.message });
        }
    }

    // Project sub-pages
    await gotoAndShot(page, `/projects/${PROJECT_ID}/commits`, 'project_commits');
    await gotoAndShot(page, `/projects/${PROJECT_ID}/settings`, 'project_settings');

    // ──────────────────────────────────────────────
    // 4. ADMIN & SETTINGS
    // ──────────────────────────────────────────────
    console.log('\n── Admin & Settings Pages ──');
    await gotoAndShot(page, '/admin/users', 'admin_users');
    await gotoAndShot(page, '/settings', 'app_settings');

    // ──────────────────────────────────────────────
    // 5. ADDITIONAL STATES
    // ──────────────────────────────────────────────
    console.log('\n── Additional States ──');

    // Kanban scrolled right
    try {
        await page.goto(`${BASE_URL}/projects/${PROJECT_ID}`, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(600);
        const kanbanTab = page.getByRole('tab', { name: /kanban/i });
        if (await kanbanTab.count() > 0) await kanbanTab.first().click();
        await page.waitForTimeout(600);
        // Scroll the kanban board right
        const board = page.locator('[class*="kanban"], [class*="board"], [data-testid*="kanban"]').first();
        if (await board.count() > 0) {
            await board.evaluate((el) => { el.scrollLeft = el.scrollWidth; });
        } else {
            await page.evaluate(() => { document.body.scrollLeft = document.body.scrollWidth; });
        }
        await page.waitForTimeout(400);
        await shot(page, 'project_kanban_scrolled');
    } catch (err: any) {
        results.push({ name: 'project_kanban_scrolled', status: 'fail', note: err.message });
    }

    // Kanban card hover
    try {
        await page.goto(`${BASE_URL}/projects/${PROJECT_ID}`, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(600);
        const kanbanTab = page.getByRole('tab', { name: /kanban/i });
        if (await kanbanTab.count() > 0) await kanbanTab.first().click();
        await page.waitForTimeout(600);
        const card = page.locator('[class*="card"], [class*="task"], [class*="ticket"]').first();
        if (await card.count() > 0) {
            await card.hover();
            await page.waitForTimeout(400);
            await shot(page, 'project_kanban_card_hover');
        } else {
            results.push({ name: 'project_kanban_card_hover', status: 'fail', note: 'No card found' });
        }
    } catch (err: any) {
        results.push({ name: 'project_kanban_card_hover', status: 'fail', note: err.message });
    }

    // Sidebar nav hover
    try {
        await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(600);
        const navItem = page.locator('nav a, [class*="sidebar"] a, [class*="nav"] a').first();
        if (await navItem.count() > 0) {
            await navItem.hover();
            await page.waitForTimeout(400);
            await shot(page, 'sidebar_nav_hover');
        } else {
            results.push({ name: 'sidebar_nav_hover', status: 'fail', note: 'No nav item found' });
        }
    } catch (err: any) {
        results.push({ name: 'sidebar_nav_hover', status: 'fail', note: err.message });
    }

    // Empty state kanban (project 4 if it existed, otherwise note)
    try {
        // Try project ID 4 (unlikely to exist → empty state)
        await page.goto(`${BASE_URL}/projects/999`, { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(600);
        await shot(page, 'project_kanban_empty');
    } catch {
        results.push({ name: 'project_kanban_empty', status: 'fail', note: 'No empty project available' });
    }

    // Admin users row hover
    try {
        await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(600);
        const row = page.locator('table tbody tr').first();
        if (await row.count() > 0) {
            await row.hover();
            await page.waitForTimeout(400);
            await shot(page, 'admin_users_row_hover');
        } else {
            results.push({ name: 'admin_users_row_hover', status: 'fail', note: 'No table rows found' });
        }
    } catch (err: any) {
        results.push({ name: 'admin_users_row_hover', status: 'fail', note: err.message });
    }

    // Settings scrolled to bottom
    try {
        await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(600);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(400);
        await shot(page, 'app_settings_bottom');
    } catch (err: any) {
        results.push({ name: 'app_settings_bottom', status: 'fail', note: err.message });
    }

    await ctx.close();
    await browser.close();

    // ──────────────────────────────────────────────
    // SUMMARY
    // ──────────────────────────────────────────────
    const ok = results.filter(r => r.status === 'ok');
    const fail = results.filter(r => r.status === 'fail');

    console.log('\n════════════════════════════════════════════');
    console.log(`  Screenshot QA complete: ${ok.length} ok  /  ${fail.length} failed`);
    console.log(`  Output: ${OUT_DIR}`);
    console.log('════════════════════════════════════════════');

    if (ok.length) {
        console.log('\n✅ Captured:');
        ok.forEach(r => console.log(`   ${r.name}.png`));
    }
    if (fail.length) {
        console.log('\n❌ Failed:');
        fail.forEach(r => console.log(`   ${r.name}: ${r.note}`));
    }
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });
