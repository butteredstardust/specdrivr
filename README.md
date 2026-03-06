<div align="center">
  <h1>Specdrivr</h1>
  <p><strong>Transform Specifications into Code with Autonomous AI Agents.</strong></p>
</div>

---

## What is Specdrivr?

In traditional AI coding, context is fragile. You write a prompt, the AI writes some code, you lose track, the AI hallucinates, everything breaks.

**Specdrivr fixes this.** It operationalizes the Spec-Driven Development (SDD) cycle. You write a Markdown specification. Specdrivr handles the rest.

We use PostgreSQL not just as a database, but as a rigid state machine and persistent memory bank. Every decision, architecture choice, and task is stored relationally. Agents fetch their "mission," execute tasks against your codebase, and report results back. If a session dies, the next agent picks up exactly where the last one left off—with full, high-fidelity context.

**The result:** You focus on the "what" and "why." The agents handle the "how."

---

## Why Specdrivr?

- **Zero Context Loss:** Persistent state means agents never forget the architecture decisions made 10 steps ago.
- **Autonomous Execution:** Agents generate plans, slice them into atomic tasks, and execute them.
- **Dependency Graphing:** Tasks are executed in the right order. Task B doesn't start until Task A is verified.
- **Integrated Verification:** Agents write code, run tests, and report back. Success moves the state machine forward; failure blocks the task for review.

---

## Tech Stack

| Layer | Tech | Why |
|-------|------|-----|
| **Core** | Next.js 14 (App Router) | Fast, unified React experience |
| **Language** | TypeScript (Strict) | If it compiles, it probably works |
| **State** | PostgreSQL | Robust ACID compliance for the state machine |
| **ORM** | Drizzle | Type-safe SQL that doesn't hide the database |
| **Validation** | Zod | Impermeable boundary between the wild west and our DB |
| **Styling** | Tailwind CSS | Premium, Linear-inspired dark UI |

---

## Getting Started

Get your local environment running in under 5 minutes.

### Prerequisites

- **Node.js**: 18.17+
- **PostgreSQL**: 14+
- **npm**: 9.x+

### Setup

1. **Clone & Install**
   ```bash
   git clone https://github.com/your-org/specdrivr.git
   cd specdrivr
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env.local
   ```
   *Edit `.env.local` to include your `DATABASE_URL`, `AUTH_SECRET`, and `AGENT_TOKEN`.*

3. **Initialize & Seed**
   We have a unified command to wipe, migrate, seed demo data, and start the dev server:
   ```bash
   npm run dev:seed
   ```

4. **Verify**
   Open [http://localhost:3000](http://localhost:3000).
   *Demo Login: Username `Admin`, Password `demo`.*

---

## Commands

| Command | What it does |
|---------|--------------|
| `npm run dev:seed` | Wipes DB, seeds test data, starts dev server |
| `npm run dev` | Starts Next.js dev server |
| `npm run db:generate` | Generates Drizzle migrations |
| `npm run db:migrate` | Applies migrations to the DB |
| `npm run db:studio` | Opens visual DB explorer |
| `npm run test` | Runs Vitest unit tests |
| `npm run test:e2e` | Runs Playwright browser tests (requires port 3001) |
| `npm run test:all` | Runs both test suites |

---

## Architecture: The Stateful Orchestrator

Specdrivr relies on a strict data flow:

**UI -> API (Zod) -> PostgreSQL (Drizzle) -> AI Agent**

1. **Specification:** You define the requirements.
2. **Planning:** An agent reads the spec and generates an execution `plan` and architecture decisions.
3. **Task Slicing:** The plan is broken into atomic `tasks` with explicit dependencies.
4. **Execution:** An agent fetches a `todo` task, executes it, and runs verifications.
5. **State Update:** Success transitions the task to `done`, unlocking dependents. Failure marks it `blocked`.

*For detailed API references and database schemas, see [AGENTS.md](./AGENTS.md).*

---

## Contributing

1. Branch off `main` (`feat/your-feature`).
2. Follow conventions: kebab-case files, PascalCase components, strict TypeScript.
3. Validate all API inputs with Zod.
4. Ensure tests pass (`npm run test:all`).
5. PR.

*See [CLAUDE.md](./CLAUDE.md) for strict AI persona and coding constraints.*

---

## License

MIT License. See [LICENSE](LICENSE) for details.

<div align="center">
  <br/>
  <strong>Write the Spec. We'll write the Code.</strong>
</div>
