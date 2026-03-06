import { db } from '../src/db';
import { projects, specifications, plans, tasks, type TaskStatus } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function onboardSpecDrivr() {
  console.log('🚀 Onboarding specdrivr into its own platform...\n');

  // Create Project
  console.log('1. Creating project...');
  const [project] = await db.insert(projects).values({
    name: 'specdrivr',
    constitution: `# specdrivr Project Constitution\n\n## Governing Principles\n- **Spec-First**: Prohibited from writing feature code without entries in specifications and plans\n- **Atomic Commits**: Each task must correspond to a single, testable change\n- **Verification Loop**: After every implementation step, execute tests and update test_results\n- **Lean Context**: Use SQL queries to retrieve only information required for task_id\n\n## Objective\nBuild an Autonomous Development Platform operationalizing the "Spec-Driven Development" cycle using PostgreSQL as a structured State Machine. Enable an AI agent (Claude) to execute complex engineering tasks while maintaining lean context window and persistent memory across sessions.\n\n## Key Pillars\n- **Relational Memory vs. Context Bloat**: Shift "source of truth" to Postgres tables\n- **Spec-Driven Rigor**: Enforce strict causality: Specification → Plan → Tasks → Implementation → Verification\n- **Agentic Feedback Loop**: Establish closed loop with test result logging to database\n- **Developer-in-the-Loop UI**: Human control via Kanban-style dashboard`,
    techStack: {
      language: 'TypeScript',
      framework: 'Next.js 14',
      database: 'PostgreSQL 16',
      orm: 'Drizzle',
      validation: 'Zod',
      styling: 'Tailwind CSS',
      components: 'Shadcn/UI'
    },
    basePath: '/Users/tuxgeek/Dev/specdrivr'
  }).returning();
  console.log(`✅ Project created: ID ${project.id}\n`);

  // Create Specification
  console.log('2. Creating specification...');
  const [spec] = await db.insert(specifications).values({
    projectId: project.id,
    content: `# specdrivr Platform Specification\n\n## What is specdrivr?\nAn Autonomous Development Platform that operationalizes the "Spec-Driven Development" cycle using PostgreSQL as a structured State Machine to enable AI agents to execute complex engineering tasks while maintaining persistent memory across sessions.\n\n## Core Features\n\n### 1. PostgreSQL as State Machine\n- Store projects, specifications, plans, tasks\n- Persist test results and agent logs\n- Enable multi-session resumes without context loss\n\n### 2. Agentic API Layer\n- Context Hydration Protocol (GET /api/agent/mission)\n- State Persistence endpoints for plans, tasks, logs\n- X-Agent-Token authentication\n\n### 3. Kanban Dashboard UI\n- Real-time task tracking\n- Drag-and-drop status updates\n- Live agent logs viewer\n- Test results panel\n\n### 4. Spec-Driven Workflow\n**Required sequence:**\n1. Create project and constitution\n2. Create functional specification (What/Why)\n3. Create technical plan (How - folders, APIs, schema)\n4. Decompose into atomic tasks\n5. Implement → Test → Verify loop\n6. Log all activity to agent_logs\n\n### 5. Type Safety & Validation\n- TypeScript strict mode\n- Drizzle ORM for type-safe DB access\n- Zod schemas for runtime validation\n- Standardized error handling\n\n## Technology Stack\n- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn/UI\n- **Backend**: API Routes, Drizzle ORM, Zod validation\n- **Database**: PostgreSQL 16+ with Drizzle Kit\n- **Development**: Git, Docker, Drizzle Studio\n\n## Success Metrics\n- Agent can query mission context from empty DB\n- Tasks can be created and updated via API\n- Dashboard renders real-time data\n- Full workflow cycle tested end-to-end`,
    version: '1.0',
    isActive: true
  }).returning();
  console.log(`✅ Specification created: ID ${spec.id}\n`);

  // Create Plan
  console.log('3. Creating plan...');
  const [plan] = await db.insert(plans).values({
    specId: spec.id,
    architectureDecisions: {
      frontend: 'Next.js 14 App Router, TypeScript strict mode, Tailwind CSS, Shadcn/UI components',
      backend: 'API Routes in /app/api/agent/, Drizzle ORM for type-safe DB access, Zod runtime validation',
      database: 'PostgreSQL 16, Drizzle Kit for migrations and studio, 6 tables: projects, specifications, plans, tasks, test_results, agent_logs',
      authentication: 'X-Agent-Token header validation using AGENT_TOKEN env variable',
      componentArchitecture: 'Screaming Architecture with feature-based folder structure',
      stateManagement: 'Database as source of truth, React Server Components for data fetching',
      testing: 'No external test framework - verification via manual API testing and Drizzle Studio'
    },
    status: 'active'
  }).returning();
  console.log(`✅ Plan created: ID ${plan.id}\n`);

  // Create Tasks
  console.log('4. Creating tasks...');
  const taskValues = [
    // Phase 1: Infrastructure
    {
      planId: plan.id,
      description: 'Initialize Next.js 14 project with TypeScript strict mode',
      status: 'done' as TaskStatus,
      priority: 1,
      filesInvolved: ['package.json', 'tsconfig.json', 'next.config.js'],
      dependencyTaskId: null
    },
    {
      planId: plan.id,
      description: 'Configure Docker Compose for PostgreSQL 16',
      status: 'done' as TaskStatus,
      priority: 1,
      filesInvolved: ['docker-compose.yml', '.env.local'],
      dependencyTaskId: 1
    },
    {
      planId: plan.id,
      description: 'Install and configure Drizzle ORM with pg driver',
      status: 'done' as TaskStatus,
      priority: 1,
      filesInvolved: ['src/db/schema.ts', 'src/db/index.ts', 'drizzle.config.ts'],
      dependencyTaskId: 1
    },

    // Phase 2: Database Schema
    {
      planId: plan.id,
      description: 'Define database schema for all 6 tables',
      status: 'done' as TaskStatus,
      priority: 1,
      filesInvolved: ['src/db/schema.ts'],
      dependencyTaskId: 2
    },
    {
      planId: plan.id,
      description: 'Create Drizzle client and database connection',
      status: 'done' as TaskStatus,
      priority: 1,
      filesInvolved: ['src/db/index.ts', '.env.local'],
      dependencyTaskId: 3
    },
    {
      planId: plan.id,
      description: 'Generate and push database migrations',
      status: 'done' as TaskStatus,
      priority: 1,
      filesInvolved: ['drizzle.config.ts'],
      dependencyTaskId: 5
    },

    // Phase 3: Agent Memory Utilities
    {
      planId: plan.id,
      description: 'Create agent-memory.ts helper functions',
      status: 'done' as TaskStatus,
      priority: 2,
      filesInvolved: ['src/lib/agent-memory.ts'],
      dependencyTaskId: 6
    },
    {
      planId: plan.id,
      description: 'Implement getNextTask() to query available tasks',
      status: 'done' as TaskStatus,
      priority: 2,
      filesInvolved: ['src/lib/agent-memory.ts'],
      dependencyTaskId: 8
    },
    {
      planId: plan.id,
      description: 'Implement getProjectContext() for mission hydration',
      status: 'done' as TaskStatus,
      priority: 2,
      filesInvolved: ['src/lib/agent-memory.ts'],
      dependencyTaskId: 8
    },
    {
      planId: plan.id,
      description: 'Implement updateTaskStatus() for task updates',
      status: 'done' as TaskStatus,
      priority: 2,
      filesInvolved: ['src/lib/agent-memory.ts'],
      dependencyTaskId: 8
    },
    {
      planId: plan.id,
      description: 'Implement logTestResult() for verification logging',
      status: 'done' as TaskStatus,
      priority: 2,
      filesInvolved: ['src/lib/agent-memory.ts'],
      dependencyTaskId: 8
    },
    {
      planId: plan.id,
      description: 'Implement addAgentLog() for activity tracking',
      status: 'done' as TaskStatus,
      priority: 2,
      filesInvolved: ['src/lib/agent-memory.ts'],
      dependencyTaskId: 8
    },

    // Phase 4: API Layer
    {
      planId: plan.id,
      description: 'Create API authentication middleware',
      status: 'done' as TaskStatus,
      priority: 2,
      filesInvolved: ['src/lib/auth.ts'],
      dependencyTaskId: 5
    },
    {
      planId: plan.id,
      description: 'Create Zod schemas for API validation',
      status: 'done' as TaskStatus,
      priority: 2,
      filesInvolved: ['src/lib/schemas.ts'],
      dependencyTaskId: 6
    },
    {
      planId: plan.id,
      description: 'Implement GET /api/agent/mission endpoint',
      status: 'done' as TaskStatus,
      priority: 2,
      filesInvolved: ['src/app/api/agent/mission/route.ts'],
      dependencyTaskId: 14
    },
    {
      planId: plan.id,
      description: 'Implement POST /api/agent/plans endpoint',
      status: 'done' as TaskStatus,
      priority: 2,
      filesInvolved: ['src/app/api/agent/plans/route.ts'],
      dependencyTaskId: 15
    },
    {
      planId: plan.id,
      description: 'Implement PATCH /api/agent/tasks/:id endpoint',
      status: 'done' as TaskStatus,
      priority: 2,
      filesInvolved: ['src/app/api/agent/tasks/[id]/route.ts'],
      dependencyTaskId: 15
    },
    {
      planId: plan.id,
      description: 'Implement POST /api/agent/verify endpoint',
      status: 'done' as TaskStatus,
      priority: 2,
      filesInvolved: ['src/app/api/agent/verify/route.ts'],
      dependencyTaskId: 15
    },
    {
      planId: plan.id,
      description: 'Implement POST /api/agent/logs endpoint',
      status: 'done' as TaskStatus,
      priority: 2,
      filesInvolved: ['src/app/api/agent/logs/route.ts'],
      dependencyTaskId: 15
    },

    // Phase 5: UI Components
    {
      planId: plan.id,
      description: 'Create TaskCard component',
      status: 'done' as TaskStatus,
      priority: 3,
      filesInvolved: ['src/components/task-card.tsx'],
      dependencyTaskId: 20
    },
    {
      planId: plan.id,
      description: 'Create KanbanBoard component',
      status: 'done' as TaskStatus,
      priority: 3,
      filesInvolved: ['src/components/kanban-board.tsx'],
      dependencyTaskId: 21
    },
    {
      planId: plan.id,
      description: 'Create ProjectSidebar component',
      status: 'done' as TaskStatus,
      priority: 3,
      filesInvolved: ['src/components/project-sidebar.tsx'],
      dependencyTaskId: 21
    },
    {
      planId: plan.id,
      description: 'Create TestResultsPanel component',
      status: 'done' as TaskStatus,
      priority: 3,
      filesInvolved: ['src/components/test-results-panel.tsx'],
      dependencyTaskId: 21
    },
    {
      planId: plan.id,
      description: 'Create AgentLogs component',
      status: 'done' as TaskStatus,
      priority: 3,
      filesInvolved: ['src/components/agent-logs.tsx'],
      dependencyTaskId: 21
    },
    {
      planId: plan.id,
      description: 'Create SpecificationViewer component',
      status: 'done' as TaskStatus,
      priority: 3,
      filesInvolved: ['src/components/specification-viewer.tsx'],
      dependencyTaskId: 21
    },

    // Phase 6: Server Actions
    {
      planId: plan.id,
      description: 'Create server actions for UI interactions',
      status: 'done' as TaskStatus,
      priority: 2,
      filesInvolved: ['src/lib/actions.ts'],
      dependencyTaskId: 28
    },
    {
      planId: plan.id,
      description: 'Update package.json with Drizzle scripts',
      status: 'done' as TaskStatus,
      priority: 1,
      filesInvolved: ['package.json'],
      dependencyTaskId: 28
    }
  ];

  const insertedTasks = await db.insert(tasks).values(taskValues).returning();
  console.log(`✅ Created ${insertedTasks.length} tasks\n`);

  // Verify counts
  const [stats] = await db.$client`
    SELECT
      (SELECT COUNT(*) FROM ${projects}) as projects,
      (SELECT COUNT(*) FROM ${specifications}) as specifications,
      (SELECT COUNT(*) FROM ${plans}) as plans,
      (SELECT COUNT(*) FROM ${tasks}) as tasks,
      (SELECT COUNT(*) FROM ${tasks} WHERE status = 'done') as done_tasks
  `;

  console.log('='.repeat(50));
  console.log('📊 Onboarding Complete!');
  console.log('='.repeat(50));
  console.log(`Project ID: ${project.id}`);
  console.log(`Specification ID: ${spec.id}`);
  console.log(`Plan ID: ${plan.id}`);
  console.log(`Total Tasks: ${Object.prototype.hasOwnProperty.call(stats, 'tasks') ? stats.tasks : stats.count}`);
  console.log(`Completed Tasks: ${Object.prototype.hasOwnProperty.call(stats, 'done_tasks') ? stats.done_tasks : stats.count}`);
  console.log('='.repeat(50));
}

onboardSpecDrivr()
  .then(() => {
    console.log('\n🎉 specdrivr has been successfully onboarded into itself!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run db:studio');
    console.log('2. Test mission endpoint');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Onboarding failed:', error);
    process.exit(1);
  });
