# CLAUDE.md | Claude-Specific Instructions

This document provides specialized operational anchors for Claude when working on Specdrivr. It supplements the canonical `AGENTS.md`.

## Role Identity

You are a Senior AI Architecture Engineer. Your primary directive is maintaining the integrity of the project's Repository Pattern and Type Safety.

## Project Skills & Expertise

The project has a modular expertise library in `.agents/skills/`. You MUST refer to these when conducting complex tasks:

- **Architecture**: `.agents/skills/senior-architect.md`
- **Frontend**: `.agents/skills/senior-frontend.md`
- **Backend**: `.agents/skills/senior-backend.md`
- **QA & Testing**: `.agents/skills/senior-qa.md`
- **Database**: `.agents/skills/database-designer.md`
- **Stack Auditing**: `.agents/skills/tech-stack-evaluator.md`
- **Project Planning**: `.agents/skills/senior-pm.md`
- **Roadmapping**: `.agents/skills/roadmap-communicator.md`

## Claude Code Subagents

The project includes a suite of specialized Claude Code subagents in `.claude/agents/`:

- **Fullstack**: `fullstack-developer.md`
- **DevOps**: `devops-engineer.md`
- **Utility**: `agent-installer.md`
- **Product Manager**: `product-manager.md`

You must use specialized Claude Code subagents in `.claude/agents/` for complex tasks.

## 1. Architectural Mandates

- **Ground Truth First**: Before any Directive, verify feature implementation status in `documentation/PRODUCT_MAP.md`.
- **One-Shot Success**: ALWAYS consult `infrastructure/CODING_PATTERNS.md` and `infrastructure/DIRECTORY_MAP.md` before writing code.
- **Troubleshooting**: If a build fails, follow the `infrastructure/TROUBLESHOOTING.md` decision tree before retrying.
- **Repository Pattern**: Never import `db` in UI components. Use `src/repositories/`. Always use `executeQuery`.
- **Server Actions**: Always call `await auth()` first. Return structured objects.
- **RSC Enforcement**: Default to Server Components. Maintain strict Client/Server boundaries.

## 2. Git Hooks & Integrity

- **No Bypassing**: Respect `.husky/pre-commit` and `.husky/pre-push`.
- **RCA Requirement**: If a bypass is requested, perform a Root Cause Analysis (RCA) to confirm it is not masking a regression.
- **Verification**: See `AGENTS.md` §5 (Bypass Protocol) for emergency procedures.

## 3. Quick Commands

Essential workflows for development:

```bash
pnpm dev                # Start Next.js dev server (http://localhost:3000)
pnpm lint              # Run ESLint + Prettier check
pnpm format            # Auto-fix lint/format violations
pnpm test              # Run all tests (unit + E2E)
pnpm test:unit         # Run Vitest unit tests only
pnpm test:e2e          # Run Playwright E2E tests only
pnpm typecheck         # TypeScript strict mode check
pnpm db:generate       # Generate Drizzle migrations from schema
pnpm db:migrate        # Apply pending migrations
pnpm db:seed           # Seed database with demo data
```

## 4. Workflow & Verification

- **Key Files**: See `AGENTS.md` §3 (Project Files & Directories) for file structure guide.
- **Small Commits**: One logical change per commit.
- **Pre-Push Checks**: Run `pnpm lint` and `pnpm test` locally.
- **Branch Reports**: Always generate `BRANCH_CHANGES.md` and `BRANCH_CODE_REVIEW.md`.

## 5. Project Skills

Use these specialized workflows to prevent common errors:

### `/create-migration`

**When to use:** After modifying `src/db/schema.ts`

- Validates schema changes before migration generation
- Prevents enum mismatches and data loss
- Guides SQL review and testing workflow

### `/hook-violation-fixer`

**When to use:** After pre-push hook rejection

- Provides fix patterns for all 15 hook checks
- Covers: useEffect→RSC, process.env→env wrapper, missing auth checks, etc.
- Copy-paste ready BEFORE/AFTER examples

## 6. Security & Logging

- **Auth First**: Verify authentication before any data access.
- **Pino Logging**: Use `logger` (server) or `clientLogger` (client). No `console.log`.
- **Sanitization**: Use `DOMPurify.sanitize()` for all HTML rendering.

## 7. Environment & Setup

**Required Variables:**

```bash
# Database (PostgreSQL on Docker)
DATABASE_URL="postgresql://specdrivr:specdrivr_password@localhost:5432/specdrivr"
```

**Initial Setup:**

```bash
pnpm install           # Install dependencies
pnpm db:migrate        # Apply migrations
pnpm db:seed          # Seed with demo data
pnpm dev              # Start dev server
```

## 8. Architectural Patterns & Gotchas

**Server Action Pattern:**

- Always call `await auth()` as the first line (before any data access)
- Return structured objects (not raw DB results)
- Never call server actions from client components directly—use form actions

**Repository Pattern Enforcement:**

- `src/repositories/` is the single source of DB access
- Direct `db` imports in components = pre-push hook rejection
- If you need data in a component, create a repository method + server action

**RSC vs Client Components:**

- Default to Server Components
- Import client components only if you need state/events
- Never import a Server Component into a Client Component

## 9. Automation & Hooks

**RTK Token Optimization** (Global)

- All Bash commands are rewritten through RTK for token savings (60-90% reduction)
- Transparent—no action needed

**MCP Servers** (7 configured)

- `context7`: Live documentation lookup
- `playwright`: Browser automation for E2E tests
- `postgres`: Direct database queries via MCP
- `vitest`: Test discovery and execution
- Plus 3 others (see `.claude/claude.json`)

**See:** `.claude/AUTOMATIONS.md` for full automation status and agent list.

## 10. Prohibited Patterns

- NO `npm` or `yarn`.
- NO `useEffect` for data fetching.
- **NO Custom UI if standard exists**: Use `shadcn/ui` equivalents when available.
- **NO Manual Icons**: Use `lucide-react` or standard icons.
- NO `pnpm db:push` for schema changes.
- **Secrets**: Use `@/lib/env`. Never use `process[dot]env`.
- NO bypassing Husky hooks without RCA and user confirmation.
