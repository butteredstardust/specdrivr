import type {
  ProjectSelect,
  UserSelect,
  TaskSelect,
  PlanSelect,
  SpecificationSelect,
  TestResultSelect,
  AgentLogSelect,
  GitCommitSelect
} from '../../../src/db/schema';

// Mock users mapping standard DB schema
export const mockUsers: Record<string, UserSelect> = {
  admin: {
    id: 1,
    username: 'Admin',
    passwordHash: '$2b$10$mLoZVx06uun0YyLlrf82I.y15n8ogOyirqeI/hQVP6BwcHLNHuf62',
    avatarUrl: null,
    avatarId: 1,
    isActive: true,
    isAdmin: true,
    role: 'admin',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    lastLoginAt: new Date('2024-01-01T00:00:00.000Z')
  },
  user: {
    id: 2,
    username: 'test-user',
    passwordHash: '$2b$10$mLoZVx06uun0YyLlrf82I.y15n8ogOyirqeI/hQVP6BwcHLNHuf62',
    avatarUrl: null,
    avatarId: 2,
    isActive: true,
    isAdmin: false,
    role: 'developer',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    lastLoginAt: new Date('2024-01-01T00:00:00.000Z')
  }
};

export const mockProjects: ProjectSelect[] = [
  {
    id: 1,
    name: 'ShopFlow — E-Commerce Platform',
    mission: 'Build a high-performance e-commerce platform with AI-powered product recommendations',
    description: 'A full-stack marketplace for small businesses to sell products online with modern checkout, inventory management, and analytics.',
    constitution: '# ShopFlow E-Commerce Platform...',
    techStack: { frontend: 'Next.js 14 App Router', backend: 'API Routes + Server Actions', database: 'PostgreSQL 16' },
    basePath: '/shopflow',
    gitBranch: 'main',
    gitStrategy: 'merge',
    agentLastHeartbeatAt: null,
    state: { decisions: [], blockers: [], last_position: null, context_summary: null },
    gitConfig: { enabled: false, provider: 'github', repo_url: null, default_branch: 'main', branching_strategy: 'none', phase_branch_template: 'specdriver/phase-{phase_id}-{slug}', milestone_branch_template: 'specdriver/{milestone}-{slug}', webhook_secret: null, commit_message_template: '{type}({plan_id}-{task_id}): {description}' },
    status: 'active',
    agentStatus: 'idle',
    agentStartedAt: null,
    agentStoppedAt: null,
    createdByUserId: 1,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z')
  },
  {
    id: 2,
    name: 'PeopleOps — Internal HR Portal',
    mission: 'Streamline HR operations with a self-service employee portal and automated workflows',
    description: 'An internal HR platform for managing employee onboarding, leave requests, performance reviews, and payroll visibility.',
    constitution: '# PeopleOps HR Portal...',
    techStack: { frontend: 'Next.js 14', backend: 'tRPC + Prisma', database: 'PostgreSQL' },
    basePath: '/peopleops',
    gitBranch: 'main',
    gitStrategy: 'merge',
    agentLastHeartbeatAt: null,
    state: { decisions: [], blockers: [], last_position: null, context_summary: null },
    gitConfig: { enabled: false, provider: 'github', repo_url: null, default_branch: 'main', branching_strategy: 'none', phase_branch_template: 'specdriver/phase-{phase_id}-{slug}', milestone_branch_template: 'specdriver/{milestone}-{slug}', webhook_secret: null, commit_message_template: '{type}({plan_id}-{task_id}): {description}' },
    status: 'active',
    agentStatus: 'idle',
    agentStartedAt: null,
    agentStoppedAt: null,
    createdByUserId: 1,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z')
  }
];

export const mockSpecifications: SpecificationSelect[] = [
  {
    id: 1,
    projectId: 1,
    content: '# Core Specification for ShopFlow',
    version: '1.0',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    createdByUserId: 1
  }
];

export const mockPlans: PlanSelect[] = [
  {
    id: 1,
    specId: 1,
    architectureDecisions: {},
    intent: 'Initial MVP implementation',
    phaseLabel: 'Phase 1',
    status: 'active',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    createdByUserId: 1
  }
];

export const mockTasks: TaskSelect[] = [
  {
    id: 1,
    planId: 1,
    description: 'Configure test environment',
    status: 'done',
    priority: 1,
    dependencyTaskId: null,
    filesInvolved: ['src/test.ts'],
    retryCount: 0,
    notes: 'Completed',
    completedAt: new Date('2024-01-01T00:00:00.000Z'),
    estimateHours: 2,
    verifyCommand: 'npm run test',
    doneCriteria: 'Tests pass',
    resumeContext: null,
    recommendedModel: 'sonnet',
    createdByUserId: 1,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z')
  },
  {
    id: 2,
    planId: 1,
    description: 'Write E2E tests',
    status: 'in_progress',
    priority: 1,
    dependencyTaskId: null,
    filesInvolved: ['tests/e2e/auth.spec.ts'],
    retryCount: 0,
    notes: null,
    completedAt: null,
    estimateHours: 3,
    verifyCommand: 'npx playwright test',
    doneCriteria: 'E2E Tests pass',
    resumeContext: null,
    recommendedModel: 'sonnet',
    createdByUserId: 1,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z')
  }
];

export const mockSession = {
  user: {
    id: "1",
    name: "Admin",
    email: "admin@example.com",
    image: null
  },
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
};
