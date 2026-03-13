import { execSync } from 'child_process';

export async function setup() {
  console.log('[test setup] Running db:migrate on test database...');
  execSync('pnpm db:migrate', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL,
    },
  });
  console.log('[test setup] Migration complete.');
}
