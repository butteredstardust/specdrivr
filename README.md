# Specdrivr

**Transform Specifications into Code with Autonomous AI Agents.**

specdrivr is an orchestration platform designed for "Spec-Driven Development." It allows developers to define features through markdown specifications, which are then autonomously planned, executed, and verified by AI agents. By utilizing PostgreSQL as a persistent state machine, specdrivr ensures that agents maintain full context and high-fidelity memory across long-running development sessions.

## What is Specdrivr?

In traditional development, AI context is often lost between prompts or sessions. **specdrivr** solves this by operationalizing the development cycle.
- **Spec-Driven Development**: You write a "Spec," and the system handles the rest.
- **Persistent State**: Unlike stateless chat interfaces, specdrivr stores every decision, task, and log in a relational database.
- **Autonomous Agents**: Agents fetch their "mission" from the platform, work on the local codebase, and report results back to the UI.
- **Session Continuity**: An agent can pick up exactly where it (or another agent) left off, with complete access to the project's history.

## Features

- **Project Dashboard**: Real-time monitoring of agent activity and task progress.
- **Kanban Task Management**: Visualize the agent's work queue and dependency graph.
- **Live Agent Logs**: Stream events directly from the agent's execution loop.
- **Versioned Specifications**: Track how requirements evolve over time.
- **Architecture Planning**: Agents generate structured plans before writing a single line of code.
- **Integrated Verification**: Automatic status updates based on test results.

## Tech Stack

| Component     | Technology              | Why it was chosen                 |
|---------------|-------------------------|-----------------------------------|
| **Framework** | Next.js 14 (App Router) | For a fast, modern, and unified React experience. |
| **Language**  | TypeScript              | To ensure reliability with strict type safety. |
| **Database**  | PostgreSQL              | For robust ACID compliance and relational state storage. |
| **ORM**       | Drizzle ORM             | Modern SQL toolkit that feels like writing raw SQL but with types. |
| **Validation**| Zod                     | To guarantee data integrity at every API boundary. |
| **Styling**   | Tailwind CSS            | To build a premium, Linear-inspired dark UI. |

## Prerequisites

- **Node.js**: 18.17+ (LTS recommended)
- **PostgreSQL**: 14+
- **npm**: 9.x+

## Getting Started

Follow these steps to get your local development environment running in under 5 minutes:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/specdrivr.git
   cd specdrivr
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Copy the example file and fill in your details (refer to `.env.example` for guidance).
   ```bash
   cp .env.example .env.local
   ```

4. **Initialize the database**:
   Ensure PostgreSQL is running and your `DATABASE_URL` is correct, then run:
   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **Confirm it's working**:
   Visit [http://localhost:3000](http://localhost:3000) to see the dashboard.

## Project Structure

- `src/app`: UI pages and API endpoints. Look here for routing logic.
- `src/components`: UI elements (Buttons, Cards, Panels).
- `src/db`: Schema definitions and database configuration.
- `src/lib`: The "brains" of the app (Agent memory, shared actions, validation logic).
- `tests`: Our test suite for ensuring reliability.

## Development

Day-to-day commands you'll need:

- **Generate Migrations**: `npm run db:generate`
- **Apply Migrations**: `npm run db:migrate`
- **Database Studio**: `npm run db:studio` (Visual DB explorer)
- **Run Tests**: `npm run test` (Unit) or `npm run test:e2e` (Browser)

## Contributing

We use a standard Git flow:
1. Create a feature branch (`feat/your-feature`).
2. Follow our coding conventions: kebab-case files, PascalCase components.
3. Ensure all tests pass (`npm run test:all`).
4. Open a PR for review.

Detailed technical guidelines are available in [CLAUDE.md](./claude.md).

## Architecture

specdrivr is built around the concept of a **Stateful Orchestrator**. The Next.js API layer serves as a Zod-validated boundary between the UI, the PostgreSQL state machine, and external agents.

When a spec is created, an agent generates a **Plan** consisting of **Tasks**. Each task has dependencies and status flags. The agent's memory is persisted in PostgreSQL, allowing for complex branching and long-running workflows that traditional AI assistants cannot handle.

## Troubleshooting

- **DB Connection Issues**: Verify your `DATABASE_URL` in `.env.local` and ensure your Postgres instance is reachable.
- **Migration Errors**: If the schema is out of sync, try `npm run db:push` in development to force synchronization.
- **Auth Failures**: Ensure `AUTH_SECRET` is set correctly in your environment.

## License

This project is licensed under the MIT License.
