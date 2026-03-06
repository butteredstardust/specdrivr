import { faker } from '@faker-js/faker';
import path from 'path';
import dotenv from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../src/db/schema';

// Default password hash for "demo"
const DEMO_PASSWORD_HASH = '$2b$10$mLoZVx06uun0YyLlrf82I.y15n8ogOyirqeI/hQVP6BwcHLNHuf62';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not set. Please check .env.local file.');
  process.exit(1);
}

// Data personas configuration
const PERSONAS = {
  powerUser: { percentage: 0.1, projects: [3, 8], tasksPerPlan: [10, 30] },
  activeContributor: { percentage: 0.4, projects: [1, 3], tasksPerPlan: [3, 10] },
  lurker: { percentage: 0.4, projects: [0, 1], tasksPerPlan: [0, 0] },
  edgeCaseTester: { percentage: 0.1, projects: [1, 2], tasksPerPlan: [5, 15] },
};

function getPersona(randomValue: number) {
  let accum = 0;
  for (const [key, value] of Object.entries(PERSONAS)) {
    accum += value.percentage;
    if (randomValue <= accum) return key;
  }
  return 'activeContributor'; // Fallback
}

function generateEdgeCaseText(type: 'short' | 'long' | 'null') {
  if (type === 'null') return null;
  if (type === 'long') return faker.lorem.paragraphs(10);
  return faker.lorem.sentence();
}

/**
 * Helper to execute inserts in chunks to prevent memory overflows.
 */
async function chunkedInsert(tx: any, table: any, data: any[], chunkSize = 1000) {
  if (!data || data.length === 0) return;
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    await tx.insert(table).values(chunk).onConflictDoNothing();
  }
}

async function seedDatabase() {
  const queryClient = postgres(process.env.DATABASE_URL as string, { max: 1 });
  const db = drizzle(queryClient, { schema });

  try {
    console.log('🌱 Generating demo data...');

    // Arrays to hold our data in memory
    const users: schema.UserInsert[] = [];
    const projects: schema.ProjectInsert[] = [];
    const specifications: schema.SpecificationInsert[] = [];
    const plans: schema.PlanInsert[] = [];
    const tasks: schema.TaskInsert[] = [];
    const testResults: schema.TestResultInsert[] = [];
    const agentLogs: schema.AgentLogInsert[] = [];
    const gitCommits: schema.GitCommitInsert[] = [];
    const agentTokens: schema.AgentTokenInsert[] = [];
    const apiRequestLogs: schema.ApiRequestLogInsert[] = [];

    // =========================================================================
    // USERS (Including static demo users)
    // =========================================================================
    const staticUsers = [
      { id: 1, username: 'Admin', role: 'admin' as const, isAdmin: true },
      { id: 2, username: 'John', role: 'developer' as const, isAdmin: false },
      { id: 3, username: 'Amy', role: 'developer' as const, isAdmin: false },
      { id: 4, username: 'Brett', role: 'viewer' as const, isAdmin: false },
    ];

    staticUsers.forEach(u => {
      users.push({
        id: u.id,
        username: u.username,
        passwordHash: DEMO_PASSWORD_HASH,
        role: u.role,
        isAdmin: u.isAdmin,
        avatarUrl: faker.image.avatar(),
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.recent(),
        lastLoginAt: faker.date.recent(),
      });
    });

    const TOTAL_RANDOM_USERS = 20;
    for (let i = 0; i < TOTAL_RANDOM_USERS; i++) {
      users.push({
        id: 5 + i,
        username: faker.internet.username(),
        passwordHash: DEMO_PASSWORD_HASH,
        role: faker.helpers.arrayElement(['admin', 'developer', 'viewer']),
        isAdmin: faker.datatype.boolean({ probability: 0.1 }),
        avatarUrl: faker.image.avatar(),
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.recent(),
        lastLoginAt: faker.date.recent(),
      });
    }

    // Initialize IDs
    let projectIdCounter = 1;
    let specIdCounter = 1;
    let planIdCounter = 1;
    let taskIdCounter = 1;

    // Iterate users to generate their data according to their persona
    for (const user of users) {
      const persona = getPersona(Math.random());
      const config = PERSONAS[persona as keyof typeof PERSONAS];

      const numProjects = faker.number.int({ min: config.projects[0], max: config.projects[1] });

      for (let p = 0; p < numProjects; p++) {
        const projectId = projectIdCounter++;
        const isEdgeCase = persona === 'edgeCaseTester';
        const projectCreatedAt = faker.date.between({ from: user.createdAt!, to: new Date() });
        const projectUpdatedAt = faker.date.between({ from: projectCreatedAt, to: new Date() });

        projects.push({
          id: projectId,
          name: isEdgeCase && Math.random() > 0.5 ? faker.lorem.words(20) : faker.commerce.productName(),
          mission: isEdgeCase && Math.random() > 0.5 ? generateEdgeCaseText('long') : faker.company.catchPhrase(),
          description: isEdgeCase && Math.random() > 0.2 ? generateEdgeCaseText('null') : faker.lorem.paragraph(),
          status: faker.helpers.arrayElement(['active', 'archived']),
          createdByUserId: user.id,
          createdAt: projectCreatedAt,
          updatedAt: projectUpdatedAt,
          agentStatus: faker.helpers.arrayElement(['idle', 'running', 'paused', 'stopped', 'error']),
        });


        // Agent Tokens and API Request Logs
        if (Math.random() > 0.3 || isEdgeCase) {
          const numTokens = isEdgeCase ? 3 : faker.number.int({ min: 1, max: 2 });
          for (let tok = 0; tok < numTokens; tok++) {
            const tokenId = agentTokens.length + 1;
            const tokenCreatedAt = faker.date.between({ from: projectCreatedAt, to: projectUpdatedAt });

            agentTokens.push({
              id: tokenId,
              projectId,
              name: faker.hacker.noun() + ' token',
              tokenHash: faker.string.alphanumeric(64),
              createdByUserId: user.id,
              createdAt: tokenCreatedAt,
              lastUsedAt: Math.random() > 0.5 ? faker.date.between({ from: tokenCreatedAt, to: projectUpdatedAt }) : null,
              revokedAt: Math.random() > 0.9 ? faker.date.recent() : null,
              preferredModel: faker.helpers.arrayElement(['sonnet', 'opus', 'gpt-4']),
            });

            // API Request Logs (associated with tokens)
            if (Math.random() > 0.2) {
              const numLogs = faker.number.int({ min: 5, max: 25 });
              for (let log = 0; log < numLogs; log++) {
                apiRequestLogs.push({
                  tokenId,
                  projectId,
                  endpoint: faker.helpers.arrayElement(['/api/v1/agent/tasks/next', '/api/v1/agent/tasks/complete', '/api/v1/agent/logs', '/api/v1/agent/heartbeat']),
                  method: faker.helpers.arrayElement(['GET', 'POST', 'PUT']),
                  statusCode: faker.helpers.arrayElement([200, 201, 400, 401, 403, 500]),
                  durationMs: faker.number.int({ min: 20, max: 2000 }),
                  requestedAt: faker.date.between({ from: tokenCreatedAt, to: projectUpdatedAt }),
                });
              }
            }
          }
        }

        // 80% chance for a project to have specifications
        if (Math.random() < 0.8 || isEdgeCase) {
          const specId = specIdCounter++;
          const specCreatedAt = faker.date.between({ from: projectCreatedAt, to: projectUpdatedAt });

          specifications.push({
            id: specId,
            projectId,
            content: faker.lorem.paragraphs(isEdgeCase ? 15 : 3),
            version: `1.${faker.number.int({ min: 0, max: 5 })}`,
            createdByUserId: user.id,
            createdAt: specCreatedAt,
            updatedAt: faker.date.between({ from: specCreatedAt, to: projectUpdatedAt }),
          });

          // 90% chance for a spec to have plans
          if (Math.random() < 0.9 || isEdgeCase) {
            const numPlans = isEdgeCase ? 3 : faker.number.int({ min: 1, max: 2 });
            for (let pl = 0; pl < numPlans; pl++) {
              const planId = planIdCounter++;
              const planCreatedAt = faker.date.between({ from: specCreatedAt, to: projectUpdatedAt });

              plans.push({
                id: planId,
                specId,
                intent: faker.lorem.sentence(),
                status: faker.helpers.arrayElement(['draft', 'active', 'completed', 'archived']),
                createdByUserId: user.id,
                createdAt: planCreatedAt,
              });

              const numTasks = faker.number.int({ min: config.tasksPerPlan[0], max: config.tasksPerPlan[1] });
              let lastTaskId: number | null = null;

              for (let t = 0; t < numTasks; t++) {
                const taskId = taskIdCounter++;
                const taskCreatedAt = faker.date.between({ from: planCreatedAt, to: projectUpdatedAt });

                // Add dependency logic - 30% chance to depend on previous task
                const dependencyTaskId = (lastTaskId && Math.random() > 0.7) ? lastTaskId : null;
                const status = faker.helpers.arrayElement(['todo', 'in_progress', 'done', 'blocked', 'paused', 'skipped']);

                tasks.push({
                  id: taskId,
                  planId,
                  description: isEdgeCase && Math.random() > 0.5 ? generateEdgeCaseText('long') : faker.lorem.sentence(),
                  status,
                  priority: faker.number.int({ min: 1, max: 5 }),
                  dependencyTaskId,
                  createdByUserId: user.id,
                  createdAt: taskCreatedAt,
                  updatedAt: faker.date.between({ from: taskCreatedAt, to: projectUpdatedAt }),
                  completedAt: status === 'done' ? faker.date.between({ from: taskCreatedAt, to: projectUpdatedAt }) : null,
                  filesInvolved: { files: [faker.system.filePath(), faker.system.filePath()] },
                  retryCount: isEdgeCase ? faker.number.int({ min: 3, max: 10 }) : faker.number.int({ min: 0, max: 2 }),
                  notes: isEdgeCase && Math.random() > 0.5 ? generateEdgeCaseText('null') : faker.lorem.sentences(2),
                  estimateHours: faker.number.int({ min: 1, max: 20 }),
                });

                lastTaskId = taskId;

                // Test Results (mostly for done tasks)
                if (status === 'done' || (isEdgeCase && status === 'todo')) {
                  const numTests = faker.number.int({ min: 1, max: 3 });
                  for (let tr = 0; tr < numTests; tr++) {
                    testResults.push({
                      taskId,
                      success: faker.datatype.boolean({ probability: 0.8 }),
                      logs: faker.system.networkInterface() + ' test logs \n ' + faker.lorem.paragraph(),
                      timestamp: faker.date.between({ from: taskCreatedAt, to: projectUpdatedAt }),
                      createdByUserId: user.id,
                    });
                  }
                }

                // Agent Logs (especially for in_progress and done tasks)
                if (['in_progress', 'done', 'error', 'blocked'].includes(status) || isEdgeCase) {
                  const numLogs = faker.number.int({ min: 2, max: 8 });
                  for (let al = 0; al < numLogs; al++) {
                    agentLogs.push({
                      taskId,
                      projectId,
                      level: faker.helpers.arrayElement(['debug', 'info', 'warn', 'error']),
                      message: faker.hacker.phrase(),
                      timestamp: faker.date.between({ from: taskCreatedAt, to: projectUpdatedAt }),
                    });
                  }
                }

                // Git Commits (for done tasks)
                if (status === 'done' && Math.random() > 0.5) {
                  gitCommits.push({
                    projectId,
                    taskId,
                    planId,
                    commitSha: faker.git.commitSha(),
                    branch: 'main',
                    message: faker.git.commitMessage(),
                    author: user.username,
                    timestamp: faker.date.between({ from: taskCreatedAt, to: projectUpdatedAt }),
                    createdByUserId: user.id,
                  });
                }
              }
            }
          }
        }
      }
    }

    console.log(`\n📊 Generated ${users.length} users, ${projects.length} projects, ${specifications.length} specs, ${plans.length} plans, ${tasks.length} tasks, ${testResults.length} test results, ${agentLogs.length} logs, ${gitCommits.length} commits, ${agentTokens.length} tokens, ${apiRequestLogs.length} api logs.`);

    // clear tables using direct sql to use truncate cascade
    console.log('\n⏳ Clearing existing data...');
    const truncateClient = postgres(process.env.DATABASE_URL as string);
    await truncateClient`TRUNCATE TABLE agent_logs RESTART IDENTITY CASCADE`;
    await truncateClient`TRUNCATE TABLE test_results RESTART IDENTITY CASCADE`;
    await truncateClient`TRUNCATE TABLE tasks RESTART IDENTITY CASCADE`;
    await truncateClient`TRUNCATE TABLE plans RESTART IDENTITY CASCADE`;
    await truncateClient`TRUNCATE TABLE specifications RESTART IDENTITY CASCADE`;
    await truncateClient`TRUNCATE TABLE git_commits RESTART IDENTITY CASCADE`;
    await truncateClient`TRUNCATE TABLE api_request_logs RESTART IDENTITY CASCADE`;
    await truncateClient`TRUNCATE TABLE agent_tokens RESTART IDENTITY CASCADE`;
    await truncateClient`TRUNCATE TABLE projects RESTART IDENTITY CASCADE`;
    await truncateClient`TRUNCATE TABLE users RESTART IDENTITY CASCADE`;
    await truncateClient.end();
    console.log('   ✓ Cleared all tables');

    console.log('\n⏳ Inserting demo data in chunks using transaction...');
    await db.transaction(async (tx) => {
      // Must insert in order to respect Foreign Key constraints
      await chunkedInsert(tx, schema.users, users);
      console.log('   ✓ Users inserted');

      await chunkedInsert(tx, schema.projects, projects);
      console.log('   ✓ Projects inserted');

      await chunkedInsert(tx, schema.specifications, specifications);
      console.log('   ✓ Specifications inserted');

      await chunkedInsert(tx, schema.plans, plans);
      console.log('   ✓ Plans inserted');

      await chunkedInsert(tx, schema.tasks, tasks);
      console.log('   ✓ Tasks inserted');

      await chunkedInsert(tx, schema.testResults, testResults);
      console.log('   ✓ Test Results inserted');

      await chunkedInsert(tx, schema.agentLogs, agentLogs);
      console.log('   ✓ Agent Logs inserted');


      await chunkedInsert(tx, schema.gitCommits, gitCommits);
      console.log('   ✓ Git Commits inserted');

      await chunkedInsert(tx, schema.agentTokens, agentTokens);
      console.log('   ✓ Agent Tokens inserted');

      await chunkedInsert(tx, schema.apiRequestLogs, apiRequestLogs);
      console.log('   ✓ API Request Logs inserted');

    });

    console.log('\n✅ Seed complete!');
    console.log('\n🔐 Login credentials:');
    console.log('   Username: Admin / John / Amy / Brett / <any generated user>');
    console.log('   Password: demo');
    console.log('\n🚀 Start the app with: npm run dev:seed');

  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error);
  } finally {
    await queryClient.end();
  }
}

// Ignore if this file is imported as module
if (require.main === module || process.argv[1].includes('seed-demo-drizzle')) {
  seedDatabase().catch(console.error);
}
