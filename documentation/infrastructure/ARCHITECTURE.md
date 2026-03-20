# **System Architecture**

## **4.1 Technology Stack**

| **Layer**        | **Technology / Library**                          | **Rationale**                                                     |
| ---------------- | ------------------------------------------------- | ----------------------------------------------------------------- |
| Framework        | Next.js 16 (App Router)                           | Server Components, Server Actions, built-in caching layer         |
| Language         | TypeScript 5.x (strict mode)                      | Type safety across all layers; Drizzle types flow end-to-end      |
| Database         | PostgreSQL 16                                     | ACID transactions; JSONB for log lines and metadata               |
| ORM              | Drizzle ORM + drizzle-kit                         | Type-safe queries; schema-first migrations; no code generation    |
| Auth             | [Better Auth](https://www.better-auth.com/)       | Credentials + Email/Password; session in Postgres; CSRF built-in  |
| AI Backend       | Google Gemini / Anthropic Claude                  | Gemini 2.0 Flash is the default; support for Claude Sonnet 3.5    |
| Cache            | Redis (ioredis)                                   | Rate limiting; temporary state; production-grade TCP client       |
| UI components    | shadcn/ui (Radix + Tailwind)                      | Accessible, unstyled primitives; customisable without overrides   |
| Animation        | Motion (Framer Motion v11)                        | DAEMON expressions; page transitions; boot sequence               |
| Syntax highlight | Shiki                                             | Server-side diff rendering; zero client JS weight                 |
| Markdown editor  | @uiw/react-codemirror + @codemirror/lang-markdown | CodeMirror 6 in React; live preview; line numbers                 |
| Terminal         | @xterm/xterm + @xterm/addon-fit                   | Real ANSI terminal rendering; auto-scroll; same engine as VS Code |
| Validation       | Zod                                               | Single source of truth for input schemas; shared client/server    |
| Logging          | Pino                                              | Structured JSON logs; correlation IDs; never logs PII             |

## **4.2 Deployment Architecture**

- Next.js application deployed on Vercel or a Node.js container.
- PostgreSQL on managed provider (Supabase, Neon, RDS).
- Redis 7+ for rate limiting.
- **DAEMON agent runtime**: A standalone process (`scripts/agent.ts`) that polls the Specdrivr API for tasks and executes them against a local repository.
- The DAEMON agent authenticates via `AGENT_TOKEN` and `SESSION_ID`. It uses a pull-based model over HTTP, not a direct database connection.

## **4.3 Security Boundaries**

- **Database Safety**: Database access is restricted to Server Components, Route Handlers, and Server Actions. `import 'server-only'` is used on all core data-access files.
- **Agent Sandbox**: The DAEMON agent operates in its own environment. It only receives specific task instructions and reports results via the API.
- **Agent Authentication**: Uses a prefix-based token lookup (first 10 chars) followed by a full Bcrypt comparison for high-performance, secure verification.
- **RBAC**: Enforcement is centralized in `src/lib/rbac.ts`, defining roles (`owner`, `admin`, `member`, `viewer`) and a strict permission matrix.

# **23. Engineering Constraints & Ground Truths**

## **23.1 Async Job Processing**

Plan generation is currently implemented as a fire-and-forget asynchronous function within the Route Handler. While `ARCHITECTURE.md` previously suggested Upstash QStash, the current implementation handles generation in-process with Spec status tracking (`pending_plan`).

## **23.2 Task Distribution Model**

Specdrivr uses a **pull-based** task distribution model.

1. The agent polls `GET /api/v1/agent/tasks/next`.
2. The server uses a Postgres transaction with `SELECT ... FOR UPDATE SKIP LOCKED` to atomically claim the next available task for the session.
3. Dependency gates are enforced at the query level (ensuring all `dependsOn` tasks are `done`).
4. This eliminates the need for a separate Redis-based task queue and ensures strong consistency with the database state.

## **23.3 Authentication**

User authentication is handled by **BetterAuth** with the Drizzle adapter. Sessions are stored in the `sessions` table in PostgreSQL. Browser-side session management uses HTTP-only cookies.

## **23.4 Environment & Config**

All environment variables are validated at startup via `src/lib/env-core.ts` using Zod. Direct access to `process.env` is restricted to the env-validator; all other code must import the validated `env` object.

# **24. Concurrency & Race Condition Handling**

## **24.1 Concurrent Task Claiming**

Handled via `FOR UPDATE SKIP LOCKED`. If two agent processes poll for a task simultaneously, Postgres ensures each receives a unique task or an empty result if none are available.

## **24.2 Plan Approval Conflict**

The system uses status-based optimistic locking. A plan can only transition from `pending_approval` to `executing` if its current state matches.

## **24.3 Spec Versioning**

Every edit to a specification content creates a new `spec_versions` record and resets the spec status to `drafting`, effectively abandoning any in-progress plans associated with previous versions.
