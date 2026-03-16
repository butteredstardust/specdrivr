# Specdrivr

**Spec-driven orchestration for teams that actually ship.**

The AI orchestration platform for engineering teams who build complex systems *and mean it*. Not startups. Not side projects. Teams that need to scale fast, maintain sanity, and let AI do the heavy lifting—without turning their codebase into a dumpster fire.

---

## Why This Exists

Most AI-ready templates are one of two things:

1. **Too simple.** They're cute for a weekend. Then you add auth, you add databases, you add team collaboration, and suddenly you're building infrastructure while Claude is staring at you waiting for guidance.

2. **Too bloated.** Enterprise templates with 47 layers of abstraction, 12 "best practices" you'll never use, and a folder structure that makes Claude's context window weep.

Specdrivr exists because **AI needs boring to be predictable.** When Claude or Gemini builds your system, it needs to know:
- Where data lives (always in repositories).
- Where mutations happen (always in actions).
- Where state lives (always on the server).
- What the rules are (RBAC, auth-first, no exceptions).

No surprises. No sprawl. Just a **strictly governed architecture** that lets you think about the hard problem—your actual business logic—while the framework handles the rest.

We found that **the best AI workflows start with the tightest constraints.** Paradoxically, that's what makes you fast.

---

## What It Does (Actually)

Specdrivr is a production-grade Next.js scaffold built specifically for **spec-driven autonomous execution**. You write a spec. Claude reads it. Claude understands your architecture *immediately* and builds it correctly—first time.

It's not magic. It's just... boring. In the best way.

### The Stack (No Surprises)

| Layer | The Thing | Why |
|---|---|---|
| **Framework** | Next.js 16 + App Router | Type-safe, built for async, plays nice with Server Actions |
| **Language** | TypeScript 5.9 | Type safety isn't negotiable when AI is writing code |
| **Database** | PostgreSQL + Drizzle ORM | Migrations as code. Fast queries. No magic |
| **Auth** | better-auth | Session management that actually works. Redis-backed. |
| **UI** | shadcn/ui + Tailwind 4 | Consistent, accessible, predictable |
| **Safety** | Zod + Pino logging | Validation at boundaries. Logging everywhere. No surprises. |

---

## The Architecture (It's Strict On Purpose)

Specdrivr enforces three rules. Break them and the pre-commit hooks will fight you.

### Rule 1: Repositories

**All database access goes through `src/repositories/`.**

No importing `db` in components. No loose queries scattered across action files. Data access is one place. It's boring. It's also why Claude can build features without accidentally creating a thousand data races.

```typescript
// src/repositories/task-repository.ts
export const taskRepository = {
  create: async (data: NewTask) => {
    return await executeQuery(async () => {
      const [task] = await db.insert(tasks).values(data).returning();
      return task;
    });
  },

  findByProjectId: async (projectId: string) => {
    return await executeQuery(async () => {
      return await db.query.tasks.findMany({
        where: eq(tasks.projectId, projectId),
      });
    });
  },
};
```

### Rule 2: Server Actions

**All mutations are Server Actions. Auth comes first.**

```typescript
'use server';

import { taskRepository } from '@/repositories/task-repository';

export async function createTaskAction(input: CreateTaskInput) {
  const session = await auth(); // FIRST LINE. Always.
  if (!session) return { success: false, error: 'Unauthorized' };

  const validated = createTaskSchema.parse(input);
  const task = await taskRepository.create(validated);

  return { success: true, data: task };
}
```

No async logic in components. No useEffect data fetching. Actions handle it. Components consume it. Clean.

### Rule 3: Server Components by Default

**Components are servers unless they need interactivity.**

`"use client"` is for buttons, forms, animations. Everything else is a server component. This is fast. This is clean. This is non-negotiable.

---

## Getting Started

You need three things: Node 25.6+, pnpm, and PostgreSQL 16+. That's it. No Redis setup tutorials. No Docker mysteries. If you don't have Postgres, spin it in Docker (we ship a `docker-compose.yml`).

### Setup (4 Commands)

```bash
# 1. Get the code
git clone <your-repo>
cd specdrivr
nvm use  # Locks Node version

# 2. Install dependencies
pnpm install --frozen-lockfile

# 3. Configure database
cp .env.example .env
# Edit .env with your DATABASE_URL

# 4. Migrate
pnpm db:generate
pnpm db:migrate

# 5. Run
pnpm dev
```

Done. Your app is at `http://localhost:3000`.

---

## Commands That Actually Matter

```bash
pnpm dev              # Dev server (port 3000)
pnpm lint             # ESLint + prettier (fixes automatically)
pnpm test             # Vitest unit tests + Playwright E2E
pnpm tsc --noEmit     # Type check (catches stupidity fast)

# Database
pnpm db:generate      # Sync schema to migrations
pnpm db:migrate       # Apply pending migrations
```

**No `db:push`**. Ever. We generate migrations. We review them. We apply them. This is how teams don't lose production data.

---

## Workflow (Pre-Commit Hooks Are Your Friend)

We run 15 checks before you commit. Yes, 15. No, you can't skip them unless you're fixing a regression.

**Your flow:**
1. Create a branch
2. Make changes
3. Commit (hooks run)
4. Push (more hooks run)
5. Open PR
6. We generate `BRANCH_CHANGES.md` and `BRANCH_CODE_REVIEW.md` automatically

If a hook fails, you'll see why. Fix it. Commit again. Repeat until green.

**Never `--no-verify`.** If you feel the urge, write an RCA in `BRANCH_CHANGES.md` first. The repo will ask for it before you push.

---

## For AI (Claude, Gemini)

Specdrivr is built specifically for autonomous execution. Every file is an anchor for agent understanding:

- **AGENTS.md**: Complete architectural mandate (read first)
- **CLAUDE.md**: Claude-specific workflows and gotchas
- **GEMINI.md**: Gemini-specific patterns

These files do one thing: make boring predictable. So agents read the rules, understand the constraints, and build features instead of asking questions.

---

## The Honest Part

### What's Hard About This

- **You have to commit to boring.** The architecture is strict. If you fight it, it fights back.
- **You have to use Drizzle and PostgreSQL.** We picked these because they work great with type safety and AI. If you need MongoDB or Prisma magic, go elsewhere.
- **Pre-commit hooks are not optional.** They're in `.husky/` and they run before every commit. Learn to love them or use `git push --no-verify` and deal with the email.

### What's Great About This

- **No surprise regressions.** The hooks catch things before they land.
- **AI builds features in hours, not days.** Claude reads AGENTS.md and just *knows* where everything goes.
- **New team members understand the codebase instantly.** The structure is so predictable, there's nothing to learn except your business logic.
- **Type safety everywhere.** TypeScript + Zod catches 80% of bugs at compile time.

---

## Examples (Because You're Impatient)

### Creating a Feature End-to-End

**1. Add to database schema** (`src/db/schema.ts`)
```typescript
export const features = createTable('features', {
  id: varchar('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: varchar('project_id').notNull(),
  name: varchar('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**2. Generate migration**
```bash
pnpm db:generate
```

**3. Create repository** (`src/repositories/feature-repository.ts`)
```typescript
export const featureRepository = {
  create: async (data: NewFeature) => {
    return await executeQuery(async () => {
      const [feature] = await db.insert(features).values(data).returning();
      return feature;
    });
  },
};
```

**4. Create action** (`src/actions/create-feature.ts`)
```typescript
'use server';

export async function createFeatureAction(input: CreateFeatureInput) {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };

  const feature = await featureRepository.create({
    projectId: session.user.projectId,
    name: input.name,
  });

  return { success: true, data: feature };
}
```

**5. Build the UI** (`src/app/dashboard/features/create-form.tsx`)
```typescript
'use client';

export function CreateFeatureForm() {
  const [name, setName] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await createFeatureAction({ name });

    if (result.success) {
      // Success
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button type="submit">Create</button>
    </form>
  );
}
```

**That's it.** Schema → Migration → Repository → Action → UI. Every feature follows this pattern. No exceptions. That's why Claude can ship them.

---

## Tooling We Use

- **Next.js 16** for the framework
- **Drizzle** for database
- **better-auth** for sessions
- **Zod** for validation
- **Pino** for logging
- **shadcn/ui** for components
- **Tailwind CSS** for styling
- **Vitest** for unit tests
- **Playwright** for E2E tests
- **Husky** for git hooks

All of these are because they work well *together*. Not because we like them personally (though we do).

---

## Get Help

- **Architecture questions?** Read `AGENTS.md`. It's the source of truth.
- **AI integration?** Check `CLAUDE.md` or `GEMINI.md`.
- **Database problems?** See `documentation/DATABASE.md`.
- **Bug or feature request?** Open an issue with what you're trying to do.

---

## License

MIT. Build what you want. Ship it. Don't sweat it.

---

**Built by teams who actually use this. For teams who actually ship.**
