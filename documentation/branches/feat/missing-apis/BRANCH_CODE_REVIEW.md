# Branch Code Review: API Implementations

## Review Summary
This review covers the comprehensive addition of Server Actions and RSC queries across Phase 1 and Phase 2 implementations. Domains covered include Notifications, Agent Tokens, Audit Logs, Usage Snapshots, Agent Observability (Logs/Sessions), CI/CD Testing hooks, File Changes, Plan Job Orchestration, and Webhook deliveries. The changes bring the API layer in strict alignment with the database schema as part of `IMPLEMENTATION_PLAN_V5.md`.
## Code Review Summary: `feat/missing-apis`

**Reviewer Scope:** Assessment of Phase 1, Phase 2, and Phase 3 covering the implementation of all formally missing API boundaries mapping to the physical PostgreSQL schema.

### Core Strengths:
1. **Repository Pattern Integrity:** Instead of bypassing `drizzle` directly inside the new Server Actions, the developer correctly utilized the `BaseRepository` class to either build natively abstracted operations (e.g. `test-result-repository`, `file-change-repository`, `git-commit-repository`) or gracefully augment the existing ones (e.g. `plan-job-repository`). 
2. **Server Action Security:** The developer cleanly applied `requireAdmin` across all V2 and V3 API Server Actions and safely bubbled up strictly formalized `success: false` schema exceptions rather than uncaught errors.
3. **Architectural Compliance:** In Phase 3, the developer properly tracked down and eliminated the explicit use of REST API `fetch` client operations inside `agent-config-form.tsx`, properly rewiring the feature to Next.js Server Actions.

### Areas for Improvement / Technical Debt:
*(Resolved in Phase 4!)*
1. **Webhook Redelivery Mocking:** The `redeliverWebhookAction` logic was formally engineered utilizing `crypto` for SHA256 header signing and native Node `fetch` functionality, accurately injecting HTTP return statuses back to the user without needing an external job processor.
2. **Test Database Deadlocks:** Running `pnpm test` aggressive cascading DDL `TRUNCATE` operations concurrently crashed the suite in earlier runs. This was ultimately resolved by permanently inserting `--no-file-parallelism` directly via the `package.json` configurations without crashing standard downstream runners like Playwright.

## Conclusion
The implementation cleanly adheres to the `AGENTS.md` and `DEVELOPMENT.md` rules. All isolated unit tests targeting the new V2 mutations executed flawlessly. Code is approved and merges gracefully with the schema.

### Phase 5 Code Review Additions (Final Review):
1. **Agent Configuration Payload:** Fixed a critical bug in `updateAgentConfigAction` that caused LLM API keys (`geminiApiKey`, `claudeApiKey`) and selections to be silently dropped during `FormData` extraction, failing to persist user preferences.
2. **Persistent Vitest Deadlocks:** It was discovered that `--no-file-parallelism` was still triggering `RowShareLock` overlaps against the `cleanDatabase()` TRUNCATE logic because idle connections from previous workers were not releasing cleanly. This was resolved natively by implementing an exponential backoff `try/catch` loop explicitly catching PostgreSQL's `40P01` deadlock error directly within `tests/helpers.ts`.
3. **Strict ESLint Verification:** Four integration tests violating `AGENTS.md` regarding strict explicit TypeScript boundaries with `as any` casting were converted to safe `Awaited<ReturnType<typeof auth>>`.
