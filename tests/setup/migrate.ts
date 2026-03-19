import { execSync } from 'child_process';
import postgres from 'postgres';
import { config } from 'dotenv';
import path from 'path';

// Load env vars so DATABASE_URL is available
config({ path: path.resolve(process.cwd(), '.env') });
config({ path: path.resolve(process.cwd(), '.env.local') });

export async function setup() {
  process.stdout.write('[test setup] Creating template database...\n');
  const baseDbUrl =
    process.env.DATABASE_URL ||
    'postgresql://specdrivr:specdrivr_password@localhost:5432/specdrivr';

  const urlObj = new URL(baseDbUrl);
  urlObj.pathname = '/postgres';

  const sql = postgres(urlObj.toString(), { max: 1 });

  try {
    // Terminate any existing connections to the template database
    await sql`SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = 'specdrivr_test_template' AND pid <> pg_backend_pid()`;
    await sql`DROP DATABASE IF EXISTS specdrivr_test_template`;
    await sql`CREATE DATABASE specdrivr_test_template`;
  } catch (e) {
    process.stderr.write(`[test setup] Failed to create template db: ${String(e)}\n`);
    throw e;
  } finally {
    await sql.end();
  }

  const templateUrl = new URL(baseDbUrl);
  templateUrl.pathname = '/specdrivr_test_template';

  process.stdout.write('[test setup] Running db:migrate on template database...\n');
  execSync('pnpm db:migrate', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: templateUrl.toString(),
    },
  });
  process.stdout.write('[test setup] Migration complete.\n');
}
