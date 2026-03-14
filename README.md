# Specdrivr

**The AI-native orchestration platform for high-performance engineering.**

Specdrivr is a modern, structured foundation designed to bridge the gap between AI-agentic development and production-grade software architecture.

---

## Why This Project Exists

Most modern templates are either too simple for production or too bloated for AI agents to navigate effectively. Specdrivr exists to provide a **strictly governed, high-density architecture** that empowers both human developers and AI agents (like Claude and Gemini) to build complex systems with absolute consistency.

We believe that for AI to build reliable software, the architecture must be predictable, type-safe, and modular.

---

## What This Project Does

Specdrivr provides an orchestration layer with a "Linear" aesthetic, built on a robust Repository-Action-Component pattern. It handles the "boring" parts of infrastructure—auth, database access, security, and UI tiering—so you can focus on building the engine.

### Key Features
- **Deterministic Architecture**: Strict Repository Pattern for data access and Server Actions for mutations.
- **AI-Native Optimization**: Dedicated `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` for seamless agentic workflows.
- **Premium UI Foundation**: Built on `shadcn/ui` for a matte, obsidian-tinted interactive experience.
- **Security by Default**: Auto-verified `auth()` in actions, RBAC governance, and runtime environment validation.
- **Integrity Protection**: Pre-commit/Pre-push quality gates with SHA256 hook integrity checks.

---

## Architecture Overview

Specdrivr follows a strictly separated architecture to maintain clean boundaries between data, logic, and presentation.

### 1. Data Layer (Repositories)
The single source of truth for database access. Located in `src/repositories/`, these modules use Drizzle ORM and are wrapped in an `executeQuery` utility to ensure consistent error handling and logging.

### 2. Logic Layer (Server Actions)
UI-driven mutations located in `src/actions/`. Every action performs a mandatory `await auth()` check as its first line of execution and returns structured `{ success, error }` objects.

### 3. Presentation Layer (RSC/RCC)
A "Server Component by Default" philosophy. Client components (`"use client"`) are strictly reserved for interactivity and state, preserving clean boundaries and performance.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.1.6 (App Router) |
| **Core** | React 19.2.4 & TypeScript 5.9.3 |
| **Database** | PostgreSQL & Drizzle ORM 0.45.1 |
| **Auth** | better-auth 1.5.4 |
| **Styling** | Tailwind CSS 4.2.1 |
| **Safety** | Zod 3.22 & Pino 10.3 |

---

## Project Structure

```text
documentation/     # Canonical docs (Design System, UI, Development)
src/app/           # Route segments, layouts, and global tokens
src/repositories/  # Database access layer (Repositories)
src/actions/       # Server Actions for UI mutations
src/lib/           # Utilities, engine logic, RBAC, and environment
src/components/ui/ # Local shadcn/ui implementation
tests/             # Vitest (Unit) and Playwright (E2E) suites
.husky/            # Quality gates (pre-commit/pre-push)
```

---

## Quick Start

### 1. Prerequisites
- Node.js v25.6.1 (managed via `.nvmrc`)
- pnpm v8+
- PostgreSQL v16+

### 2. Installation
```bash
nvm use
pnpm install --frozen-lockfile
```

### 3. Configuration
Copy the example environment file and configure your `DATABASE_URL`.
```bash
cp .env.example .env
```

### 4. Database Setup
Register your schema and apply migrations. No `db:push`.
```bash
pnpm db:generate
pnpm db:migrate
```

### 5. Running Locally
```bash
pnpm dev
# App available at http://localhost:3000
```

---

## Development Workflow

We enforce a professional engineering workflow through Husky hooks.

### Pull Request Flow
1. Create a feature branch.
2. Implement changes following `AGENTS.md` mandates.
3. Commit (Conventional Commits required).
4. Push (Triggers `pnpm test` and `pnpm lint`).
5. Generate `BRANCH_CHANGES.md` and `BRANCH_CODE_REVIEW.md` in `documentation/branches/`.

### Commands Reference
- **Linting**: `pnpm lint`
- **Testing**: `pnpm test`
- **Typecheck**: `pnpm tsc --noEmit`
- **Generate Migration**: `pnpm db:generate`

### Git Hooks Integrity
Never bypass hooks without a **Root Cause Analysis (RCA)**. If a bypass is necessary, document it in `BRANCH_CHANGES.md` and use `git push --no-verify`.

---

## Example Usage

### Creating a Repository Method
```typescript
// src/repositories/item-repository.ts
export const itemRepository = {
  create: async (data: NewItem) => {
    return await executeQuery(async () => {
      const [item] = await db.insert(items).values(data).returning();
      return item;
    });
  },
};
```

### Calling a Server Action
```typescript
// src/actions/create-item.ts
'use server';

export async function createItemAction(formData: FormData) {
  const session = await auth(); // Auth first
  if (!session) return { success: false, error: 'Unauthorized' };

  // ... validation and repository call
  return { success: true, data: result };
}
```

---

## Contributing
Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines. We prioritize architectural integrity over speed.

---

## License
MIT © Stefan Neagu
