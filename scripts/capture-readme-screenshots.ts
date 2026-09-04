import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium, type Locator, type Page } from '@playwright/test';

const DEFAULT_BASE_URL = 'http://localhost:3000';
const VIEWPORT = { width: 1920, height: 1080 };
const DEMO_EMAIL = 'alex@specdrivr.dev';
const DEMO_PASSWORD = 'Password123!';
const ACTIVE_PROJECT_ID = '2';

interface CaptureDefinition {
  filename: string;
  path: string;
  ready: (page: Page) => Locator;
}

const captures: CaptureDefinition[] = [
  {
    filename: 'dashboard.png',
    path: '/',
    ready: (page) => page.getByText('OAuth2 Integration').first(),
  },
  {
    filename: 'projects.png',
    path: '/projects',
    ready: (page) => page.getByRole('heading', { level: 1, name: 'All Projects' }),
  },
  {
    filename: 'spec-view.png',
    path: '/specs/3',
    ready: (page) =>
      page.getByRole('heading', { level: 1, name: 'OAuth2 Integration', exact: true }),
  },
  {
    filename: 'spec-tasks.png',
    path: '/specs/3?tab=tasks',
    ready: (page) => page.getByText('Store OAuth tokens securely', { exact: true }),
  },
  {
    filename: 'sessions.png',
    path: '/sessions',
    ready: (page) => page.getByText('SESS-003', { exact: true }).first(),
  },
  {
    filename: 'session-detail.png',
    path: '/sessions/5',
    ready: (page) => page.getByText('Store OAuth tokens securely', { exact: true }).first(),
  },
  {
    filename: 'activity.png',
    path: '/settings/audit',
    ready: (page) => page.getByText('project.created', { exact: true }).first(),
  },
];

async function waitForStablePage(page: Page, ready: Locator): Promise<void> {
  await ready.waitFor({ state: 'visible', timeout: 30_000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
      }
      nextjs-portal { display: none !important; }
    `,
  });
}

async function main(): Promise<void> {
  const baseUrl = process.argv[2] ?? DEFAULT_BASE_URL;
  const executablePath = process.argv[3];
  const origin = new URL(baseUrl).origin;
  const outputDirectory = path.resolve('public/screenshots');

  await mkdir(outputDirectory, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });

  try {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 1,
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });

    await context.addCookies([
      {
        name: 'active-project-id',
        value: ACTIVE_PROJECT_ID,
        url: origin,
      },
    ]);
    await context.addInitScript(() => {
      localStorage.setItem('theme', 'light');
      localStorage.setItem('sidebar-collapsed', 'false');
    });

    const page = await context.newPage();
    await page.goto(`${origin}/login`, { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Email').fill(DEMO_EMAIL);
    await page.getByLabel('Password').fill(DEMO_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL((url) => url.origin === origin && url.pathname === '/', {
      timeout: 30_000,
    });

    for (const capture of captures) {
      await page.goto(`${origin}${capture.path}`, { waitUntil: 'domcontentloaded' });
      await waitForStablePage(page, capture.ready(page));
      await page.screenshot({
        path: path.join(outputDirectory, capture.filename),
        animations: 'disabled',
        fullPage: false,
      });
      process.stdout.write(`Captured public/screenshots/${capture.filename}\n`);
    }

    await context.close();
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
  process.stderr.write(`Screenshot capture failed: ${message}\n`);
  process.exitCode = 1;
});
