<div align="center">

# Specdrivr

**AI-native orchestration platform.**

Just gets shit done.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](license.txt)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)](https://www.postgresql.org/)

Modern tooling for orchestrating AI agents. TypeScript strict mode, zero `any`, no fluff.

</div>

---

## Problem

Building with AI agents is hard. Context windows rot. State gets lost. Quality degrades as conversations drag on.

Most platforms layer enterprise theater on top of simple problems. Complex dashboards for basic orchestration. Over-engineered abstractions.

Specdrivr strips away the noise. An AI-native platform that stays out of your way and lets you build.

## Solution

A clean orchestration layer built for AI-first development workflows:

- **Type-safe everything** from database to UI
- **Repository pattern** for clean data access
- **Comprehensive validation** at every boundary
- **Zero-trust architecture** with explicit type guards

The complexity is in the system, not in your workflow.

---

## Quick Start

For experienced devs who know what they're doing:

```bash
git clone https://github.com/{org}/specdrivr.git
cd specdrivr
pnpm install
cp .env.example .env.local
# Configure DATABASE_URL in .env.local
pnpm db:push
pnpm dev
```

Open http://localhost:3000.

You're in.

---

<details>
<summary>Prerequisites (click to expand)</summary>

- **Node.js** v25.6.1 - Use `.nvmrc` with [nvm](https://github.com/nvm-sh/nvm)
- **pnpm** v8.x or higher
- **PostgreSQL** 16

After installing nvm:

```bash
nvm use  # Uses version from .nvmrc
```

</details>

---

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure database

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and set your `DATABASE_URL`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/specdrivr
```

Push the schema:

```bash
pnpm db:push
```

> [!NOTE]
> Use `pnpm db:generate` after schema changes. Never delete migration files in `drizzle/`.

### 3. Run development server

```bash
pnpm dev
```

Navigate to [http://localhost:3000](http://localhost:3000).

---

## Key Features

| Feature | What it gives you |
|---------|-------------------|
| **Repository Pattern** | Clean data layer, no DB imports in components |
| **Strict TypeScript** | Zero `any` types, explicit returns everywhere |
| **Boundary Validation** | Zod at every API/action entry point |
| **Server-First Architecture** | Server Components by default, minimal hydration |
| **Multi-Layer Hook Protection** | Quality checks always run, bypass attempts detected |

### Architecture

- **Framework**: Next.js 16.1.6 (App Router)
- **UI**: pxlkit components + shadcn/ui + custom
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: better-auth
- **Validation**: Zod
- **Styling**: Tailwind CSS 4

---

## Development Commands

| Command | What it does |
|---------|--------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm db:push` | Push schema to database |
| `pnpm db:generate` | Generate Drizzle client |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run Vitest unit tests |
| `pnpm test:e2e` | Run Playwright E2E tests |

---

## Documentation

## Architecture Deep Dive

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Next.js 16.1.6                         │
│                      (App Router)                            │
└──────────────────────┬────────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
┌────────▼──────┐ ┌────▼─────┐ ┌────▼─────┐
│   Server      │ │  Client  │ │   API    │
│  Components   │ │ Components│ │  Routes  │
└────────┬──────┘ └────┬─────┘ └────┬─────┘
         │             │            │
         └──────┬──────┴──────┬─────┘
                │             │
         ┌──────▼──────┐ ┌───▼────────┐
         │ Repository  │ │ Middleware │
         │   Layer     │ │  (Auth,   │
         └──────┬──────┘ │ Rate Limit)│
                │        └────────────┘
         ┌──────▼──────┐
         │   Drizzle   │
         │     ORM     │
         └──────┬──────┘
                │
         ┌──────▼──────┐
         │ PostgreSQL  │
         │     16      │
         └─────────────┘
```

**Key principles:**
- Repository pattern prevents direct database access from UI
- Server components handle data fetching
- Client components only for interactivity
- Boundary validation at every layer
- Type safety enforced from database to UI

### Hook Protection System

```
┌────────────────────────────────────────┐
│           Git Operation                │
├────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  │
│  │  Pre-commit │→ │  Pre-push     │  │
│  │   Checks    │  │   Checks      │  │
│  └─────────────┘  └──────────────┘  │
└──────┬───────────────────┬───────────┘
       │                   │
       ▼                   ▼
   ┌──────────────────────────────┐
   │   CI/CD (GitHub Actions)    │
   │   • Hook verification        │
   │   • Test execution           │
   │   • Build verification       │
   └──────────────────────────────┘
```

**Multi-layer defense:**
1. Local hook verification (SHA256 checksums)
2. Git config bypass detection
3. CI hook verification (strict mode)
4. Audit trail for all operations

### Type Safety Pipeline

```
┌──────────┐
│ Database │
├──┬───────┤
│  │       │
│  ▼       │
│ Drizzle  │
│  ORM     │
│  ↑       │
│  │       │
│Typed    │
│Results   │
└──┬───────┘
   │
   ▼
┌────────────────┐
│ Repository     │
│ Methods        │
│ • executeQuery │
│ • Type guards  │
└──┬─────────────┘
   │
   ▼
┌────────────────┐
│ API Routes     │
│ • Zod.parse    │
│ • Validation   │
└──┬─────────────┘
   │
   ▼
┌────────────────┐
│ Server Actions │
│ • safeParse    │
│ • Error        │
│   handling     │
└──┬─────────────┘
   │
   ▼
┌────────┐
│   UI    │
│ Props   │
│ Typed   │
└─────────┘
```

**No type casting allowed.** Zero `any` policy enforced at all layers.

---

## Getting Started - Complete Walkthrough

Let"s build a simple agent orchestration workflow from scratch. This example shows how Specdrivr's architecture works together.

### 1. Define the Database Schema

```typescript
// src/database/schema.ts
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';

export const agents = pgTable('agents', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type inference from Drizzle
export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;

// Validation schema
export const agentSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
});
```

### 2. Create the Repository

```typescript
// src/repositories/agent-repository.ts
import { db } from '@/database/db';
import { agents } from '@/database/schema';
import { executeQuery } from '@/lib/base-repository';
import { eq } from 'drizzle-orm';

export class AgentRepository {
  async createAgent(data: NewAgent) {
    return executeQuery(async () => {
      const [agent] = await db.insert(agents)
        .values(data)
        .returning();
      return agent;
    });
  }

  async getAgentById(id: number) {
    return executeQuery(async () => {
      const [agent] = await db.select()
        .from(agents)
        .where(eq(agents.id, id));
      return agent;
    });
  }

  async listAgents() {
    return executeQuery(async () => {
      return await db.select()
        .from(agents)
        .orderBy(agents.createdAt);
    });
  }
}

export const agentRepository = new AgentRepository();
```

### 3. Create API Route

```typescript
// src/app/api/agents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { agentSchema } from '@/database/schema';
import { agentRepository } from '@/repositories/agent-repository';
import { handleApiError } from '@/lib/api-error-handler';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate input
    const body = await request.json();
    const result = agentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Create agent
    const agent = await agentRepository.createAgent(result.data);

    return NextResponse.json(
      { success: true, data: agent },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET() {
  try {
    const agents = await agentRepository.listAgents();
    return NextResponse.json({ success: true, data: agents });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### 4. Create Server Action

```typescript
// src/actions/agent-actions.ts
'use server';

import { z } from 'zod';
import { agentSchema, Agent } from '@/database/schema';
import { agentRepository } from '@/repositories/agent-repository';
import { revalidatePath } from 'next/cache';

export async function createAgent(formData: FormData) {
  // Validate at the boundary
  const rawData = {
    name: formData.get('name'),
    description: formData.get('description'),
  };

  const result = agentSchema.safeParse(rawData);

  if (!result.success) {
    return {
      success: false as const,
      error: {
        code: 'VALIDATION_ERROR',
        message: result.error.errors[0].message,
      },
    };
  }

  try {
    const agent = await agentRepository.createAgent(result.data);

    // Invalidate cached data
    revalidatePath('/agents');

    return {
      success: true as const,
      data: agent,
    };
  } catch (error) {
    return {
      success: false as const,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to create agent',
      },
    };
  }
}
```

### 5. Create UI Component

```typescript
// src/app/agents/page.tsx
import { agentRepository } from '@/repositories/agent-repository';
import { AgentList } from '@/components/agent-list';
import { CreateAgentForm } from '@/components/create-agent-form';

export default async function AgentsPage() {
  // Server component: Fetch data directly
  const agents = await agentRepository.listAgents();

  return (
    <main>
      <h1>AI Agents</h1>

      {/* Client component with interactivity */}
      <CreateAgentForm />

      {/* Server-rendered list */}
      <AgentList agents={agents} />
    </main>
  );
}
```

This example demonstrates:
- Type safety from database to UI
- Repository pattern
- Boundary validation
- Server components for data fetching
- Server actions for mutations
- Proper error handling
- Cache invalidation

---

## Real-World Use Cases

### AI Agent Workflow Automation

Build sophisticated multi-step AI workflows with human oversight:

```typescript
// Multi-agent orchestration with approval gates
const workflow = await workflowRepository.create({
  name: 'Content Review Pipeline',
  steps: [
    {
      agent: 'researcher',
      task: 'Gather information about topic',
      approvalRequired: false,
    },
    {
      agent: 'writer',
      task: 'Draft article based on research',
      approvalRequired: true, // Human review needed
    },
    {
      agent: 'editor',
      task: 'Polish and format article',
      approvalRequired: false,
    },
  ],
});
```

**Benefits:**
- Type-safe workflow definitions
- Clear approval boundaries
- Audit trail for decisions
- Error handling at each step
- Parallel execution where possible

### Multi-Tenant Architecture

Isolate customer data while sharing infrastructure:

```typescript
// Repository automatically scopes by tenant
class ProjectRepository {
  async listProjects(tenantId: string) {
    return executeQuery(async () => {
      return await db.select()
        .from(projects)
        .where(eq(projects.tenantId, tenantId)); // Automatic scoping
    });
  }
}
```

**Benefits:**
- Database-level data isolation
- No cross-tenant data leaks
- Simpler codebase (no manual filtering)
- Type-safe tenant identification

### Complex Approval Workflows

Handle multi-stakeholder approval processes:

```typescript
// Approval workflow with multiple stakeholders
const approval = await approvalRepository.create({
  resource: 'api-key',
  resourceId: 'key_123',
  action: 'CREATE',
  approvers: ['security-team', 'manager', 'compliance'],
  requiredApprovals: 2,
  timeout: '24h',
});
```

**Benefits:**
- Configurable approval rules
- Timeout handling
- Email notifications
- Audit trail
- Rollback capability

---

## Philosophy & Design Decisions

### Why Repository Pattern?

**Without it:**
```typescript
// Bad: Direct database access in components
export default function UserPage() {
  const users = await db.select().from(users); // NO!
}
```

**With it:**
```typescript
// Good: Clean separation of concerns
export default function UserPage() {
  const users = await userRepository.listUsers(); // YES!
}
```

**Rationale:**
- Single source of truth for data access
- Easier to test (mock repositories)
- Centralized query optimization
- Clear API for data operations
- No SQL injection risk in components

### Why Zero `any` Types?

**Before:**
```typescript
function processData(data: any) {
  return data.field.subfield; // Runtime error if structure is wrong
}
```

**After:**
```typescript
interface Data {
  field: {
    subfield: string;
  };
}

function processData(data: Data) {
  return data.field.subfield; // Type-safe at compile time
}
```

**Rationale:**
- Catch errors at compile time
- Better IDE support
- Self-documenting code
- Refactoring confidence
- No surprise runtime errors

### Why Multi-Layer Hook Protection?

Some developers try to bypass quality checks. Common attempts:

- `--no-verify` flag → logged to audit trail
- `core.hooksPath=/dev/null` → detected with warning
- Modify hook files → fails CI checksum verification
- Uninstall husky → fails CI verification

**Defense in depth:**
1. **Local**: Hook verification via checksums
2. **Git config**: Bypass detection
3. **CI/CD**: Strict verification
4. **Audit**: Trail for all operations

This ensures quality checks run somewhere, even if locally bypassed.

### Why Server-First Architecture?

**Performance:**
- Faster initial page loads
- Less JavaScript to download
- Better SEO
- Works without JavaScript

**Security:**
- Sensitive data never leaves server
- API keys stay secure
- No client-side data exposure

**Simplicity:**
- No loading states for initial render
- No hydration mismatches
- Simpler component logic
- Direct database access (in server components)

---

## Performance & Scaling

### Bundle Optimization

**Server-first approach reduces bundle size:**
- Database code stays on server
- API keys never bundled
- Server components send pure HTML

**Critical optimization strategies:**

```typescript
// Dynamic imports for heavy libraries
const HeavyChart = dynamic(() => import('@/components/heavy-chart'), {
  loading: () => <div>Loading...</div>,
  ssr: false, // Only load on client
});

// Prerender static pages
export const dynamic = 'force-static';

// Cache frequently accessed data
export const revalidate = 3600; // Revalidate every hour
```

### Database Performance

**Repository pattern enables optimization:**

```typescript
class ProjectRepository {
  // Add for common queries
  async getProjectsByUser(userId: string) {
    return executeQuery(async () => {
      return await db.select()
        .from(projects)
        .where(eq(projects.userId, userId))
        .limit(100) // Prevent accidental large queries
        .orderBy(desc(projects.updatedAt));
    });
  }
}
```

**Query optimization patterns:**
- Always use indexes
- Implement pagination for lists
- Set query limits
- Use appropriate data types
- Batch related queries

### Caching Strategy

**Multi-layer caching:**

```typescript
// 1. Database query caching
const cachedResults = await redis.get(`query:${hash}`);
if (cachedResults) return JSON.parse(cachedResults);

// 2. Full route caching in Next.js
export const revalidate = 300;

// 3. Component-level memoization
const MemoizedComponent = memo(ExpensiveComponent, isEqual);

// 4. API response caching
export const runtime = 'edge';
export const preferredRegion = 'home';
```

**Cache invalidation on mutations:**

```typescript
async function createAgent(data: NewAgent) {
  const agent = await agentRepository.create(data);
  revalidatePath('/agents'); // Clear cached list
  revalidateTag('agents'); // Clear API cache
  return agent;
}
```

**Rate limiting:**

```typescript
// Per user
const limiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '10 s'),
  prefix: 'ratelimit:user',
});

// Per IP
const iplimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(1000, '1 h'),
  prefix: 'ratelimit:ip',
});
```

---

## Troubleshooting

### Common Setup Issues

**"Can't connect to database"**

```bash
# Verify PostgreSQL is running
pg_isready

# Check connection string format
# Should be: postgresql://user:password@localhost:5432/dbname

# Test connection with psql
psql "$DATABASE_URL"
```

**"Hook verification failed"**

```bash
# Hook was modified without updating checksums
node scripts/verify-hooks.js generate

# Or check what changed
git diff .husky/
```

**"Type errors everywhere"**

```bash
# Ensure strict mode is enabled in tsconfig.json
"strict": true,
"noImplicitAny": true,

# Regenerate Drizzle types
pnpm db:generate
```

**"Port 3000 already in use"**

```bash
# Find what's using the port
lsof -ti:3000

# Kill it
kill -9 $(lsof -ti:3000)

# Or use a different port
pnpm dev -- --port 3001
```

**"pnpm command not found"**

```bash
# Install pnpm with corepack
corepack enable
corepack prepare pnpm@latest --activate

# Or use npm to install it
npm install -g pnpm
```

### Build Issues

**"Build fails with 'Module not found'"**

```bash
# Clear caches
pnpm clean
rm -rf node_modules
rm pnpm-lock.yaml

# Fresh install
pnpm install
pnpm build
```

**"API routes work in dev but not in build"**

- Check: Are you using runtime features in edge functions?
- Check: Are environment variables available at build time?
- Check: Are you using Node.js specific APIs in edge runtime?

### Testing Issues

**"Tests fail in CI but pass locally"**

```bash
# Set test environment
NODE_ENV=test pnpm test

# Ensure test database is isolated
dotenv -e .env.test -- pnpm test

# Check for race conditions
pnpm test -- --runInBand
```

**"Playwright tests fail"**

```bash
# Install browser dependencies
pnpm exec playwright install

# Run with headed mode to debug
pnpm test:e2e -- --headed

# Generate report
pnpm test:e2e -- --reporter=html
```

### Performance Issues

**"Page loads slowly"**

- Check: Are you fetching too much data?
- Check: Can you use pagination?
- Check: Are you missing indexes on frequently queried columns?
- Check: Can you add revalidation caching?

**"Database queries are slow"**

```sql
-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check for missing indexes
SELECT schemaname, tablename, attname, n_distinct
FROM pg_stats
WHERE schemaname = 'public' AND n_distinct < 1000;
```

---

## Roadmap

### Current Status ✅

- **Core Framework**: Next.js 16 with App Router
- **Type Safety**: Zero `any` policy enforced
- **Database Layer**: Repository pattern implemented
- **Validation**: Zod at all boundaries
- **Testing**: Vitest + Playwright configured
- **Hooks Protection**: Multi-layer verification system
- **Documentation**: Initial setup complete

### In Progress 🚧

- **Production Deployments**: CI/CD pipeline automation
- **Monitoring**: Distributed tracing with OpenTelemetry
- **Performance**: Bundle analysis and optimization
- **Testing**: Increase coverage to 90%+
- **Documentation**: Interactive examples

### Planned 📋

- **Advanced ORM Features**: Include relations, optimized queries
- **Cache Layer**: Redis integration for caching
- **Queue System**: Background job processing
- **Real-time Features**: WebSocket support
- **Admin Dashboard**: Internal tooling
- **Multi-region Support**: Edge deployment optimization
- **Advanced Security**: Rate limiting, DDoS protection
- **Performance**: SQL query optimization dashboard

### Long-term Vision 🎯

- **AI-assisted Development**: Automated code suggestions
- **Self-healing**: Auto-remediation of common issues
- **Predictive Scaling**: ML-based resource allocation
- **Federated Architecture**: Microservices support
- **Plugin Ecosystem**: Extensible architecture

---

## Documentation

- [**Development Best Practices**](documentation/DEVELOPMENT.md) - Code standards, patterns, conventions
- [**Agent Documentation**](AGENTS.md) - How to use Claude Code agents
- [**CLAUDE.md**](CLAUDE.md) - Claude-specific behavior guidelines
- [**Product Specification**](documentation/README.md) - Architecture, APIs, design system
- [**Contributing**](CONTRIBUTING.md) - How to contribute to the project
- [**Code of Conduct**](CODE_OF_CONDUCT.md) - Community guidelines

---

<div align="center">

Built for people who ship.

</div>
