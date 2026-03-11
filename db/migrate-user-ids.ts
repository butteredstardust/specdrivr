/**
 * Custom migration to change user IDs from integer to text
 *
 * This script drops all foreign key constraints to users, converts the
 * users.id column to text, converts all user_id references to text, then
 * recreates the foreign key constraints.
 */

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { env } from '../src/lib/env-script';

const queryClient = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(queryClient);

// List of tables with foreign key references to users.id
// Format: [table_name, column_name, on_delete]
const userFkTables: Array<[string, string, string]> = [
  ['sessions', 'user_id', 'cascade'],
  ['accounts', 'user_id', 'cascade'],
  ['projects', 'created_by', 'set null'],
  ['project_members', 'user_id', 'cascade'],
  ['invites', 'invited_by', 'no action'],
  ['agent_tokens', 'user_id', 'cascade'],
  ['specifications', 'created_by', 'set null'],
  ['spec_versions', 'created_by', 'set null'],
  ['plans', 'approved_by', 'set null'],
  ['plans', 'created_by', 'set null'],
  ['plan_reviews', 'user_id', 'set null'],
  ['agent_sessions', 'started_by', 'set null'],
  ['agent_events', 'user_id', 'set null'],
  ['notifications', 'user_id', 'cascade'],
  ['notifications', 'actor_user_id', 'set null'],
  ['notification_preferences', 'user_id', 'cascade'],
  ['audit_log', 'user_id', 'no action'],
];

async function execute(sql: string) {
  console.log(`Executing: ${sql.substring(0, 100)}...`);
  await queryClient.unsafe(sql);
}

async function main() {
  console.log('Starting user ID migration from integer to text...\n');

  try {
    // Step 1: Drop all foreign key constraints to users table
    console.log('Step 1: Dropping foreign key constraints...');
    for (const [tableName, columnName] of userFkTables) {
      // Standard constraint naming pattern: {table}_{column}_users_id_fk
      const fkName = `${tableName}_${columnName}_users_id_fk`;
      try {
        await execute(`ALTER TABLE "${tableName}" DROP CONSTRAINT IF EXISTS "${fkName}";`);
      } catch (e) {
        console.log(`  Note: ${fkName} may not exist or use different naming`);
      }
    }
    console.log('  Foreign key constraints dropped.\n');

    // Step 2: Convert users.id from integer to text
    console.log('Step 2: Converting users.id to text...');
    await execute(`
      ALTER TABLE "users"
      ALTER COLUMN "id" TYPE text
      USING id::text;
    `);
    console.log('  users.id converted to text.\n');

    // Step 3: Convert all foreign key columns to text
    console.log('Step 3: Converting foreign key columns to text...');
    for (const [tableName, columnName] of userFkTables) {
      await execute(`
        ALTER TABLE "${tableName}"
        ALTER COLUMN "${columnName}" TYPE text
        USING "${columnName}"::text;
      `);
    }
    console.log('  All foreign key columns converted to text.\n');

    // Step 4: Recreate foreign key constraints
    console.log('Step 4: Recreating foreign key constraints...');
    for (const [tableName, columnName, onDelete] of userFkTables) {
      const onDeleteClause = onDelete === 'no action' ? '' : `ON DELETE ${onDelete.toUpperCase()}`;
      const fkName = `${tableName}_${columnName}_users_id_fk`;
      await execute(`
        ALTER TABLE "${tableName}"
        ADD CONSTRAINT "${fkName}"
        FOREIGN KEY ("${columnName}") REFERENCES "users"("id")
        ${onDeleteClause};
      `);
    }
    console.log('  Foreign key constraints recreated.\n');

    console.log('Migration completed successfully!');
    console.log('\nImportant: Since existing users had integer IDs (1, 2, 3...),');
    console.log('they are now text strings ("1", "2", "3"...).');
    console.log('You may want to:')
    console.log('  1. Clear existing data and start fresh');
    console.log('  2. Or assign new nanoid-based IDs to existing users');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await queryClient.end();
  }
}

main();
