# Spec-Drivr: AI Agent Development Platform

An **Autonomous Development Platform** that operationalizes the "Spec-Driven Development" cycle. Uses PostgreSQL as a state machine to enable AI agents to execute complex engineering tasks while maintaining persistent memory across sessions.

## Architecture

- **Next.js 14** (App Router)
- **TypeScript** (Strict Mode)
- **PostgreSQL** (State Machine)
- **Drizzle ORM** (Type-safe database access)
- **Zod** (Runtime validation)
- **Tailwind CSS** (Styling)

## Quick Start

### 1. Setup Environment

```bash
# Copy environment file
cp .env.example .env.local

# Edit .env.local with your values:
DATABASE_URL=postgresql://specdrivr:specdrivr_password@localhost:5432/specdrivr
AGENT_TOKEN=your-secure-agent-token-here
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

### 3. Initialize Database

```bash
npm run db:push
```

### 4. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

### 5. Open Drizzle Studio (Optional)

```bash
npm run db:studio
```

## The Context Hydration Protocol

### Setup Project and Get Mission Context

**Create a Project:**
```bash
curl -X POST http://localhost:3000/api/demo/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "My Project"}'
```

**Create Specification:**
```bash
curl -X POST http://localhost:3000/api/demo/specs \
  -H "Content-Type: application/json" \
  -d '{"projectId": 1, "content": "Build a web app"}'
```

**Create Plan:**
```bash
curl -X POST http://localhost:3000/api/agent/plans \
  -H "X-Agent-Token: $AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"specId": 1, "architectureDecisions": {"framework": "Next.js"}}'
```

**Get Next Mission:**
```bash
curl -H "X-Agent-Token: $AGENT_TOKEN" \
  "http://localhost:3000/api/agent/mission?project_id=1"
```

## API Endpoints

### Authentication

All agent endpoints require `X-Agent-Token` header:

```bash
curl -H "X-Agent-Token: your-token" <endpoint>
```

### Agent API

#### Get Mission Context
`GET /api/agent/mission?project_id=1`

#### Create Plan
`POST /api/agent/plans`

#### Update Task
`PATCH /api/agent/tasks/:id`

#### Log Test Results
`POST /api/agent/verify`

#### Add Agent Logs
`POST /api/agent/logs`

## Database Schema

### Tables

- **projects** - Project metadata
- **specifications** - Functional requirements
- **plans** - Technical architecture
- **tasks** - Atomic work items
- **test_results** - Verification logs
- **agent_logs** - Agent activity logs

See `src/db/schema.ts` for full schema definition.

## Prompt to Use This With Claude

To get started with Claude as your agent, use this prompt:

```
You are an AI agent working with the Spec-Drivr platform.

PROJECT_ID=1
API_BASE=http://localhost:3000
AGENT_TOKEN=your-token

Use the following workflow:

1. Always check your current mission first:
   GET /api/agent/mission?project_id=${PROJECT_ID}

2. If no specification exists, ask me to provide one

3. If specification exists but no plan, create a technical plan:
   POST /api/agent/plans
   Body: { specId: <id>, architectureDecisions: {...} }

4. If plan exists, get next available task (tasks with status='todo')

5. Work on one task at a time, following the causality chain:
   Specification → Plan → Tasks → Implementation → Verification

6. After implementing, run tests and log results:
   POST /api/agent/verify
   Body: { taskId: <id>, success: true/false, logs: "..." }

7. Log all activity:
   POST /api/agent/logs
   Body: { taskId: <id>, level: "info", message: "..." }

8. Continue until all tasks are marked 'done'

Never write feature code without:
- Validating spec exists and is active
- Validating plan exists
- Getting next task from API
- Running tests and logging results

Always use SQL queries to retrieve state rather than relying on conversation context.
```

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push schema changes
- `npm run db:studio` - Open Drizzle Studio
- `npm run db:generate` - Generate migrations
- `npm run lint` - Run linter

## Documentation

### For Different Use Cases

**New to the project?**
- Start with [specification.md](specification.md) for project vision and high-level requirements
- Read [claude.md](claude.md) for comprehensive developer guide
- Check out [plan.md](plan.md) for architecture and implementation roadmap

**Working on UI/UX?**
- See [ui_plan.md](ui_plan.md) for detailed UI specifications

**Setting up testing?**
- See [testing/README.md](testing/README.md) for comprehensive testing guide
- Check [TESTING_SUMMARY.md](TESTING_SUMMARY.md) for testing infrastructure overview

**Historical context:**
- See [documentation/progress/](documentation/progress/) for project progress tracking

## Project Structure

```
/app/              # Next.js app router
  ├── api/        # API routes
  └── projects/   # Project pages
/components/       # React components
/db/              # Database
  ├── schema.ts   # Table schemas
  └── index.ts    # Drizzle client
/lib/             # Utilities
  ├── schemas.ts  # Zod schemas
  ├── agent-memory.ts
  ├── auth.ts
  └── actions.ts
```

## Troubleshooting

### Database Issues

1. Ensure PostgreSQL is running: `docker ps`
2. Check logs: `docker logs specdrivr_db`
3. Verify DATABASE_URL in `.env.local`
4. Run `npm run db:studio`

### API Authentication

1. Check AGENT_TOKEN in .env.local
2. Ensure X-Agent-Token header is present

### Type Errors

TypeScript strict mode enabled. Use proper types from `@/db/schema`.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
