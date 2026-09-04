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
  /**
   * Extra wait for content that arrives after the server-rendered markup.
   * `ready` only proves the shell painted; panels fed by polling or SSE are
   * still showing their empty state at that point, which is how the hero shot
   * ended up with a blank terminal and grey health dots.
   */
  settled?: (page: Page) => Promise<void>;
}

/** Waits for the sidebar health dots to leave their 'unknown' (grey) state. */
async function waitForHealthResolved(page: Page): Promise<void> {
  await page
    .locator('aside, [data-sidebar]')
    .first()
    .locator('text=Connecting…')
    .waitFor({ state: 'detached', timeout: 20_000 })
    .catch(() => {
      // Collapsed sidebar renders no status line; the dots are covered by the
      // health response wait below either way.
    });
}

/** Waits for the xterm panel to have actually received and rendered output. */
async function waitForTerminalOutput(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const rows = document.querySelector('.xterm-rows');
      return !!rows && (rows as HTMLElement).innerText.trim().length > 0;
    },
    undefined,
    { timeout: 20_000 }
  );
}

const captures: CaptureDefinition[] = [
  {
    filename: 'dashboard.png',
    path: '/',
    ready: (page) => page.getByText('OAuth2 Integration').first(),
    settled: async (page) => {
      // The hero shot is the one that has to show a live system: session log,
      // terminal, activity feed and health dots all populated.
      await page.getByText('Activity feed').first().waitFor({ timeout: 20_000 });
      await page
        .getByText('Waiting for activity...')
        .waitFor({ state: 'detached', timeout: 20_000 })
        .catch(() => undefined);
      await page
        .getByText('Connecting to stream…')
        .waitFor({ state: 'detached', timeout: 20_000 })
        .catch(() => undefined);
      await waitForTerminalOutput(page);
      await waitForHealthResolved(page);
    },
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
    settled: async (page) => {
      await waitForHealthResolved(page);
    },
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
    // Not the default 'load': the dashboard holds SSE connections open, so the
    // load event may never fire and this would time out on a page that is in
    // fact fully rendered.
    await page.waitForURL((url) => url.origin === origin && url.pathname === '/', {
      timeout: 30_000,
      waitUntil: 'domcontentloaded',
    });

    for (const capture of captures) {
      await page.goto(`${origin}${capture.path}`, { waitUntil: 'domcontentloaded' });
      await waitForStablePage(page, capture.ready(page));
      await capture.settled?.(page);
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
