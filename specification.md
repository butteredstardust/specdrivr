# Instructions for AI Developer: Spec-Driven Platform Construction
# Build specdrivr web app
### Summary

The objective is to engineer an **Autonomous Development Platform** that operationalizes the "Spec-Driven Development" cycle. By utilizing a PostgreSQL database as a structured "State Machine," the system enables an AI agent (Claude) to execute complex engineering tasks—planning, ticketing, coding, and testing—while maintaining a lean context window and persistent memory across sessions.

---

### Key Pillars of the Objective

* **Relational Memory vs. Context Bloat**: Traditional AI coding relies on massive chat histories that eventually exceed token limits or lose coherence. This project shifts the "source of truth" to **Postgres tables**, allowing the agent to query its current state ($Select * From Tasks$) rather than "remembering" it.
* **Spec-Driven Rigor**: Based on the `spec-kit` philosophy, the goal s to enforce a strict causality chain: **Specification $\rightarrow$ Plan $\rightarrow$ Tickets $\rightarrow$ Implementation $\rightarrow$ Verification**. No code is written until the "What" and "How" are validated in the database.
* **Agentic Feedback Loop**: The system establishes a closed loop where the agent doesn't just write code but also verifies it. By logging test results directly to the DB, the agent can autonomously decide to refactor or proceed to the next ticket based on objective data.
* **Developer-in-the-Loop UI**: While the agent handles the heavy lifting, the human developer retains high-level control via a Kanban-style dashboard. This allows for real-time monitoring of the agent’s "thought process" and task progression.

---

### System Logic & Trade-offs

| Feature                    | Reasoning                                                                                         | Trade-off                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Postgres-as-Memory**     | Ensures $100\%$ state persistence and allows for multi-session "resumes" without context loss.    | Requires an API layer to bridge the LLM and the DB.                     |
| **Task Decomposition**     | Breaks complex features into atomic, testable units, reducing the probability of AI logic errors. | Increases initial overhead in the "Planning" phase.                     |
| **Automated Verification** | Prevents regressive bugs by making "Pass/Fail" the gatekeeper for the next task.                  | Requires the agent to have robust environment permissions (Docker/CLI). |

---

### Evidence & Standards

* **Methodology**: This architecture aligns with **Agentic Workflows**, which studies show can outperform single-shot prompting by significant margins (often cited as improving complex task success rates from $~30\%$ to over $80\%$ in coding benchmarks).
* **Framework**: By adopting the **GitHub `spec-kit**` standards, the project prioritizes "Documentation as Code," ensuring the generated software is maintainable and aligned with the original business intent.
* **Data Integrity**: Using **Drizzle ORM** with **TypeScript** ensures that the agent operates within a type-safe environment, catching "hallucinated" data structures at compile-time rather than runtime.

## 1. Governing Principles (Project Constitution)
- **Spec-First**: You are prohibited from writing feature code without a corresponding entry in `specifications` and `plans`.
- **Atomic Commits**: Each `task` must correspond to a single, testable change.
- **Verification Loop**: After every implementation step, you must execute tests and update the `test_runs` table.
- **Lean Context**: Use SQL queries to retrieve only the information required for the current `task_id`.

## 2. PostgreSQL Implementation (Drizzle ORM)
Initialize the database with the following schema:

* **Projects**: `id`, `name`, `constitution` (markdown), `tech_stack` (jsonb), `base_path`.
* **Specifications**: `id`, `project_id`, `content`, `version`, `is_active` (boolean).
* **Plans**: `id`, `spec_id`, `architecture_decisions`, `status`.
* **Tasks**: `id`, `plan_id`, `status` (enum), `files_involved` (jsonb), `priority`, `dependency_task_id`.
* **Test_Results**: `id`, `task_id`, `success` (bool), `logs`, `timestamp`.

## 3. Spec-Driven Workflow (The spec-kit Loop)
When you receive a new project request, follow this sequence:
1.  **/constitution**: Generate a `constitution.md` based on user's `special_instructions`. Store it in `projects`.
2.  **/specify**: Create a functional spec in the `specifications` table. Focus on "What" and "Why."
3.  **/plan**: Generate the technical architecture in the `plans` table. Define the "How" (folders, APIs, DB schema).
4.  **/tasks**: Decompose the plan into the `tasks` table. 
5.  **/implement**: 
    - Query `tasks` for the next `todo` item where `dependency_task_id` is complete.
    - Implement code -> Run tests -> Log result in `test_results` -> Mark `task` as `done`.

## 4. Initial Tool Setup
1.  Configure `docker-compose.yml` for Postgres 16+.
2.  Install `drizzle-orm`, `drizzle-kit`, and `pg`.
3.  Bootstrap a Next.js 14+ (App Router) environment.
4.  Create a `lib/agent-memory.ts` utility that provides helper functions for the agent to "remember" state from Postgres.
5.  
## 5. Agentic API Layer (The Control Plane)
Implement a RESTful API that allows you (the agent) to interact with the PostgreSQL state machine. This API must be the only way you "remember" project status.

### A. Context Hydration Protocol
Before starting any coding task, you must call `GET /api/agent/mission`. 
- **Input**: `project_id`
- **Output**: The active `specification`, the `plan_id`, and the first `task` where `status = 'todo'` and `dependencies` are met.

### B. State Persistence
You must update the database via the API at these milestones:
1. **Plan Finalization**: `POST /api/agent/plans` once the architecture is settled.
2. **Task Start**: `PATCH /api/agent/tasks/:id` setting status to `in_progress`.
3. **Verification**: `POST /api/agent/verify` after running `npm test`.

### C. Tools Integration
Configure your environment so you can use `curl` or a `fetch` tool to interact with these endpoints. 
- **Security**: Implement a simple `X-Agent-Token` header for authentication between the AI agent and the web app backend.
- **Payloads**: Use strict JSON formatting to ensure you can parse the database state into your internal reasoning engine.

## 6. Engineering Standards & Autonomous Troubleshooting

### A. Web Development Best Practices
- **Type Safety**: Use Strict Mode in TypeScript. Every API response and Database query must have a Zod schema for runtime validation.
- **Component Architecture**: Use Shadcn/UI for the frontend. Maintain a "Screaming Architecture"—the folder structure should reflect the business logic (e.g., `/features/kanban`, `/features/projects`).
- **Error Handling**: Implement Global Error Boundaries in Next.js. Every API endpoint must return standardized error codes (400 for validation, 404 for missing state, 500 for logic failure).

### B. The "Anti-Stuck" Protocol
If you encounter a persistent error (3+ failed attempts):
1. **Diagnostic Step**: Install/Run `drizzle-kit studio` to inspect the DB state directly.
2. **Log Analysis**: Query the `agent_logs` table to see if you are repeating a previous failed logic path.
3. **Complexity Reduction**: If a task is too large, use the API to split it into two sub-tasks.
4. **Tool Provisioning**: You are authorized to install development dependencies (e.g., `vitest`, `msw`, `concurrently`) to aid in debugging.

### C. Live Preview & Feedback
- Always keep the Next.js development server running (`npm run dev`).
- If you need to verify a UI change, use a headless browser check or verify the rendered HTML structure in your test suite.
- Use `console.log` extensively in the `agent_logs` table during the "implement" phase to provide a trace of your internal state.

### D. Definition of Done (DoD)
A task is only 'Done' when:
1. It passes all associated unit/integration tests.
2. The `test_results` table reflects a `success: true` status.
3. The `specifications` and `plans` tables are updated if any architectural drift occurred.