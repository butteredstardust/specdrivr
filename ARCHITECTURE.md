# SpecDrivr Architecture and Decision Records

This document provides a high-level overview of the SpecDrivr architecture and documents key architectural decision records (ADRs).

## System Architecture

SpecDrivr is built as a monolithic Next.js 14 application using the App Router. It serves both the frontend UI and the backend API, interacting with a PostgreSQL database via Drizzle ORM.

### Key Components

1.  **Frontend (Next.js React Server Components & Client Components)**
    *   **Dashboard:** Project overview, stats, recent activity.
    *   **Project Workspace:** Kanban board, spec editor, plan viewer, agent logs, test results, and settings. Provides a unified view of a single project's lifecycle.
    *   **Admin Panel:** User and role management.
2.  **Backend (Next.js API Routes & Server Actions)**
    *   **Agent API (`/api/agent/*` & `/api/projects/[id]/agent/*`):** Endpoints used by the external SpecDrivr execution agent to read specs, create plans, fetch tasks, report status, and write logs.
    *   **Frontend API (`/api/*`):** Endpoints directly used by the UI (e.g., auth).
    *   **Server Actions (`src/lib/actions.ts`):** Mutations triggered from Server and Client components (e.g., creating projects, updating specs, archiving projects).
3.  **Data Layer (PostgreSQL + Drizzle ORM)**
    *   Stores `users`, `projects`, `specifications`, `plans`, `tasks`, `testResults`, `agentLogs`, and `gitCommits`.
4.  **Integration Layer**
    *   **Git Webhooks (`/api/webhooks/git`):** Receives push events to track commits and map them to completed tasks or plan stages.

---

## Architectural Decision Records (ADRs)

### ADR 1: Monolithic Next.js 14 Web App
*   **Decision:** Build the entire web interface and agent control plane in a single Next.js app.
*   **Rationale:** simplifies deployment, shares types (Zod schemas and Drizzle models) between the frontend and the agent API, and leverages Server Actions for rapid feature development without building dedicated REST endpoints for every UI interaction.

### ADR 2: PostgreSQL with Drizzle ORM
*   **Decision:** Use PostgreSQL as the relational data store, accessed via Drizzle ORM.
*   **Rationale:** Relational data is necessary given the tight relationships between Projects -> Specs -> Plans -> Tasks. Drizzle provides excellent TypeScript inference, edge-compatibility, and a lightweight runtime compared to Prisma.
*   **Note on Connection Pool (Resolved in Audit):** The initial `max: 1` constraint was suitable for local dev but inadequate for production. This has been increased.

### ADR 3: Agent Polling via "Wave" Endpoint
*   **Decision:** The execution agent retrieves batches of parallel-executable tasks via `GET /api/agent/wave`.
*   **Rationale:** Instead of the agent querying the database directly or maintaining a persistent WebSocket connection, the HTTP polling model simplifies agent deployment (stateless CLI) and centralizes dependency resolution logic (`agent-memory.ts`) in the web backend.

### ADR 4: Plain Cookie Sessions Authentication (Current State)
*   **Decision:** Implement custom session management using encrypted plain cookies rather than a library like NextAuth.js.
*   **Rationale:** Initially chosen for absolute simplicity to get the MVP running quickly.
*   **Status/Risk:** As noted in the phase 1 audit, plain-text user IDs in cookies were a critical vulnerability. The system now requires cryptographic signing/encryption of cookie payloads to prevent impersonation. Migrating to NextAuth.js or Iron Session is recommended for future hardening.

### ADR 5: Project-Scoped Agent Operations
*   **Decision:** Agent operations (Start, Stop, Pause, Retry, Get Status) are strictly scoped per `projectId` within the routing layer (`/api/projects/[id]/agent/...`).
*   **Rationale:** Ensures data isolation in multi-tenant or multi-project environments, preventing state bleed where an agent instance for Project A accidentally picks up tasks meant for Project B.

### ADR 6: Immutable Specifications & Plans (Versioned)
*   **Decision:** When a Spec or Plan is updated, a new record is created rather than mutating the old one, and the `isActive` flag resolves the tip.
*   **Rationale:** Enables auditability, historical rollback (Spec version history dropdown), and preserves the context that the agent originally used when a specific task was generated.
