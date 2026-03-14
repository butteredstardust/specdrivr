# Dev Environment Replication Prompt

**Role**: You are an AI Systems Engineer.
**Objective**: Replicate the exact development environment of the Specdrivr project on a new machine (Mac/PC).

---

## Step 1: Core Tooling & Persistence
Ensure the following tools are installed and available in your environment:
1.  **Package Manager**: `pnpm` (required for all project operations).
2.  **Runtime**: Node.js 20+ (managed via `.nvmrc`).
3.  **Infrastructure**: Docker Desktop or Docker Engine.
4.  **MCP Servers**: Setup the following MCP servers in your configuration:
    - `fetch`: For retrieving external documentation and assets.
    - `filesystem`: For local file management.
    - `git`: For repository orchestration.
    - `memory`: For knowledge graph persistence.
    - `next-devtools`: For Next.js 16+ specific diagnostics.
    - `playwright`: For E2E browser automation.
    - `postgres`: For database queries.
    - `shadcn`: For component registry management.
    - `vitest`: For unit testing.
    - `docker`: For container management.
    - `redis`: For cache and session storage monitoring.
    - `npm`: For package management operations.
    - `eslint`: For code quality and linting.
    - `shell`: For localized command execution.
    - `await`: For orchestrating asynchronous operations.

## Step 2: Infrastructure & Services
Run the following commands to spin up the required local services:
1.  **Start Services**: `docker compose up -d` (Starts PostgreSQL 16 and Redis 7).
2.  **Verify Health**: Check that `specdrivr_db` and `specdrivr_redis` are healthy.

## Step 3: Environment Setup
1.  **Create Local Env**: `cp .env.example .env.local`
2.  **Credentials**: Ensure `DATABASE_URL` matches the credentials in `docker-compose.yml`:
    - `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/specdrivr"`
3.  **Initialize (Ubuntu/WSL)**: Run `bash bootstrap.sh` for a one-click setup of Node, pnpm, and DB schema.
4.  **Initialize (Manual/Mac)**:
    ```bash
    pnpm install --frozen-lockfile
    pnpm db:migrate
    pnpm db:seed
    ```

## Step 4: VS Code Configuration
Create or update `.vscode/settings.json` with the following project standards:
```json
{
    "git.ignoreLimitWarning": true,
    "editor.tabSize": 2,
    "editor.insertSpaces": true,
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": "explicit"
    },
    "files.exclude": {
        "**/.next": true,
        "**/node_modules": true,
        "**/dist": true
    },
    "search.exclude": {
        "**/.next": true,
        "**/node_modules": true,
        "**/dist": true
    },
    "files.watcherExclude": {
        "**/.next": true,
        "**/node_modules": true,
        "**/dist": true
    }
}
```

## Step 5: Install Specialized Agent Assets
The following specialized assets must be installed to match the current capability set:

### A. Claude Code Subagents
Clone or fetch the following subagents from the `VoltAgent/awesome-claude-code-subagents` repository and place them in `.claude/agents/`:
- `agent-installer.md`, `devops-engineer.md`, `docker-pro.md`, `fullstack-developer.md`, `nextjs-developer.md`, `product-manager.md`, `sql-pro.md`, `typescript-pro.md`

### B. Antigravity Skills
Clone or fetch the following skills from the `VoltAgent/awesome-antigravity-skills` repository and place them in `.agents/skills/`:
- `database-designer.md`, `senior-architect.md`, `senior-backend.md`, `senior-frontend.md`, `senior-qa.md`, `tech-stack-evaluator.md`
- Directories: `roadmap-communicator/`, `senior-pm/` (containing `SKILL.md`)

## Step 6: Verification
1.  Run `pnpm dev` and verify the dashboard at `http://localhost:3000`.
2.  Verify `.gitignore` is correctly isolating `.agents/`, `.gemini/`, and `.claude/`.

---
**Initial Status Check**: Run `git status` and `pnpm test` to confirm environment parity.
