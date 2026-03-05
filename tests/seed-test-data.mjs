#!/usr/bin/env node

/**
 * Seed test data for E2E testing
 * Creates test users and projects with sample data
 */

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, serial, text, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { Pool } from 'pg';

// Load environment variables
config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL || 'postgresql://specdrivr:specdrivr_password@localhost:5432/specdrivr';

console.log('🌱 Seeding test data...');
console.log(`Database: ${dbUrl.split('@')[1] || 'localhost'}`);

// Define schema
const userRoleEnum = pgEnum('user_role', ['admin', 'developer', 'viewer']);

const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  role: userRoleEnum('role').notNull().default('developer'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  mission: text('mission'),
  description: text('description'),
  constitution: text('constitution'),
  techStack: text('tech_stack'),
  instructions: text('instructions'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at'),
  agentStatus: text('agent_status'),
  agentStartedAt: timestamp('agent_started_at'),
  agentStoppedAt: timestamp('agent_stopped_at'),
});

const tasksStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'done', 'blocked']);
const tasksPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high']);

const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),
  description: text('description').notNull(),
  status: tasksStatusEnum('status').notNull().default('todo'),
  priority: tasksPriorityEnum('priority').notNull().default('medium'),
  filesInvolved: text('files_involved'),
  notes: text('notes'),
  retryCount: integer('retry_count').default(0),
  completedAt: timestamp('completed_at'),
  dependencyTaskId: integer('dependency_task_id'),
});

async function seedTestData() {
  const pool = new Pool({ connectionString: dbUrl });
  const db = drizzle(pool);

  try {
    console.log('📦 Checking database connection...');
    await pool.query('SELECT 1');
    console.log('✅ Database connected\n');

    console.log('👤 Creating test users...');

    // Create test admin user
    await pool.query(`
      INSERT INTO users (username, password, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (username) DO NOTHING
    `, ['test-admin', 'test123', 'admin']);
    console.log('  ✓ Created admin user: test-admin / test123');

    // Create test regular user
    await pool.query(`
      INSERT INTO users (username, password, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (username) DO NOTHING
    `, ['test-user', 'test123', 'developer']);
    console.log('  ✓ Created regular user: test-user / test123\n');

    console.log('📋 Creating test projects...');

    // Create Test Project Alpha
    const alphaResult = await pool.query(`
      INSERT INTO projects (
        name, mission, description, tech_stack
      )
      VALUES (
        $1, $2, $3, $4
      )
      ON CONFLICT (name) DO NOTHING
      RETURNING id
    `, [
      'Test Project Alpha',
      'End-to-end testing for task management features',
      'A comprehensive test project with multiple tasks for validating Kanban board and drag-and-drop functionality',
      JSON.stringify(['TypeScript', 'Next.js', 'PostgreSQL', 'Drizzle ORM'])
    ]);

    const alphaProjectId = alphaResult.rows[0]?.id;

    if (alphaProjectId) {
      console.log(`  ✓ Created project: Test Project Alpha (ID: ${alphaProjectId})`);

      // Create tasks for Alpha
      const alphaTasks = [
        { desc: 'Configure test environment', status: 'done', priority: 'high' },
        { desc: 'Write E2E tests', status: 'in_progress', priority: 'high' },
        { desc: 'Debug failing tests', status: 'todo', priority: 'medium' },
        { desc: 'Review test coverage', status: 'todo', priority: 'low' },
        { desc: 'Document test results', status: 'blocked', priority: 'medium' },
      ];

      for (const task of alphaTasks) {
        await pool.query(`
          INSERT INTO tasks (project_id, description, status, priority)
          VALUES ($1, $2, $3, $4)
        `, [alphaProjectId, task.desc, task.status, task.priority]);
      }
      console.log(`    ✓ Created ${alphaTasks.length} tasks`);
    }

    // Create Test Project Beta
    const betaResult = await pool.query(`
      INSERT INTO projects (
        name, mission, description, tech_stack
      )
      VALUES (
        $1, $2, $3, $4
      )
      ON CONFLICT (name) DO NOTHING
      RETURNING id
    `, [
      'Test Project Beta',
      'Validating agent control mechanisms and real-time updates',
      'Testing agent status controls, task execution, and real-time monitoring features',
      JSON.stringify(['Playwright', 'Testing', 'Automation'])
    ]);

    const betaProjectId = betaResult.rows[0]?.id;

    if (betaProjectId) {
      console.log(`  ✓ Created project: Test Project Beta (ID: ${betaProjectId})`);

      // Create tasks for Beta
      const betaTasks = [
        { desc: 'Test agent start functionality', status: 'done', priority: 'high' },
        { desc: 'Verify agent pause behavior', status: 'in_progress', priority: 'high' },
        { desc: 'Test agent stop mechanism', status: 'todo', priority: 'medium' },
        { desc: 'Validate task retry flow', status: 'todo', priority: 'high' },
      ];

      for (const task of betaTasks) {
        await pool.query(`
          INSERT INTO tasks (project_id, description, status, priority)
          VALUES ($1, $2, $3, $4)
        `, [betaProjectId, task.desc, task.status, task.priority]);
      }
      console.log(`    ✓ Created ${betaTasks.length} tasks`);
    }

    console.log('\n✅ Test data seeding complete!');
    console.log('\n📋 Summary:');
    console.log('  • 2 test users created (test-admin, test-user)');
    console.log('  • 2 test projects created (Alpha, Beta)');
    console.log('  • 9 test tasks created across projects');
    console.log('\n🚀 Ready to run tests!');
    console.log('   npm run test:e2e');

  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTestData();
}

export { seedTestData };