#!/usr/bin/env node

/**
 * Seed demo data into the database
 * Usage: npm run seed:demo
 */

const { exec } = require('child_process');
const { readFile } = require('fs/promises');
const path = require('path');

async function runSeed() {
  const seedFile = path.join(__dirname, '../db/seed-demo.sql');

  try {
    // Check if psql is available
    await new Promise((resolve, reject) => {
      exec('which psql', (error, stdout) => {
        if (error || !stdout.trim()) {
          console.error('❌ psql command not found. Please install PostgreSQL client.');
          console.error('   On macOS: brew install postgresql');
          console.error('   On Ubuntu: sudo apt-get install postgresql-client');
          process.exit(1);
        }
        resolve();
      });
    });

    // Check DATABASE_URL
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not set. Please create .env.local file.');
      process.exit(1);
    }

    // Execute psql
    console.log('🌱 Loading demo seed data...');
    console.log(`   Seed file: ${seedFile}`);
    console.log(`   Database: ${process.env.DATABASE_URL.split('@')[0]}@...`);

    const child = exec(`psql "$DATABASE_URL" < "${seedFile}"`, {
      shell: '/bin/bash',
      env: process.env
    });

    // Stream output
    child.stdout.on('data', (data) => {
      process.stdout.write(data);
    });

    child.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    // Wait for completion
    await new Promise((resolve, reject) => {
      child.on('close', (code) => {
        if (code === 0) {
          console.log('\n✅ Demo data loaded successfully!');
          resolve();
        } else {
          reject(new Error(`psql exited with code ${code}`));
        }
      });

      child.on('error', reject);
    });

    console.log('\n📝 Summary:');
    console.log('   - 3 Projects created');
    console.log('   - 3 Specifications created');
    console.log('   - 3 Plans created');
    console.log('   - 24 Tasks created');
    console.log('   - Test results and agent logs added');
    console.log('\n🚀 Start the app with: npm run dev:clean');

  } catch (error) {
    console.error('\n❌ Error loading demo data:', error.message);
    process.exit(1);
  }
}

runSeed().catch(console.error);
