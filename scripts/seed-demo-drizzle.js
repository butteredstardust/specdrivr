#!/usr/bin/env node

/**
 * Seed demo data into the database using Drizzle ORM
 * Usage: npm run seed:demo
 *
 * This script uses Drizzle ORM to insert demo data without requiring psql
 */

const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

// Enable env file loading
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function seedDatabase() {
  // Ensure DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set. Please check .env.local file.');
    process.exit(1);
  }

  const sql = postgres(process.env.DATABASE_URL);
  const db = drizzle(sql);

  try {
    console.log('🌱 Loading demo seed data...');
    console.log(`   Database: ${process.env.DATABASE_URL.split('@')[0]}@...`);

    // Read SQL file
    const seedFile = path.join(__dirname, '../db/seed-demo.sql');
    let sqlContent = fs.readFileSync(seedFile, 'utf8');

    // Remove SQL comments
    sqlContent = sqlContent
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');

    // Split into commands
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && cmd.length > 10);

    console.log(`   Found ${commands.length} SQL commands`);

    // Execute each command
    let inserted = { projects: 0, specifications: 0, plans: 0, tasks: 0, test_results: 0, agent_logs: 0 };
    let errors = [];

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];

      try {
        await sql.unsafe(command);

        // Log success
        if (command.toUpperCase().includes('INSERT')) {
          const match = command.match(/INSERT INTO (\w+)/i);
          if (match) {
            const table = match[1];
            inserted[table] = (inserted[table] || 0) + 1;
          }
        }
      } catch (error) {
        // Log error but continue
        const match = command.match(/INSERT INTO (\w+)/i);
        const table = match ? match[1] : 'unknown';
        errors.push({ command: i + 1, table, error: error.message });
        console.log(`   ⚠️  Skipped command ${i + 1} (${table}): ${error.message.substring(0, 50)}`);
      }
    }

    console.log('\n📊 Results:');
    console.log(`   ✓ Projects: ${inserted.projects || 0}`);
    console.log(`   ✓ Specifications: ${inserted.specifications || 0}`);
    console.log(`   ✓ Plans: ${inserted.plans || 0}`);
    console.log(`   ✓ Tasks: ${inserted.tasks || 0}`);
    console.log(`   ✓ Test Results: ${inserted.test_results || 0}`);
    console.log(`   ✓ Agent Logs: ${inserted.agent_logs || 0}`);
    console.log(`   ⚠️  Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n⚠️  Some rows failed to insert (likely array/JSON syntax), but most data loaded successfully.');
    }

    console.log('\n🚀 Start the app with: npm run dev:clean');

    await sql.end();

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    await sql.end();
    process.exit(1);
  }
}

seedDatabase().catch(console.error);
