# Scripts Directory

Utility and automation scripts for development, testing, and deployment.

## Development Scripts

### `bootstrap.sh`

**Purpose:** Fresh Ubuntu container setup

Installs Node Version Manager (nvm) and Node.js version from `.nvmrc`.

```bash
./scripts/bootstrap.sh
```

**Use case:** First-time setup on a clean Ubuntu environment or container

---

### `snapshot.sh`

**Purpose:** Environment snapshot initialization

Ensures dependencies are installed, database is ready, and schema is up-to-date. Can be used as a Docker ENTRYPOINT or container postStart hook.

```bash
./scripts/snapshot.sh
```

**Use case:** Fast container initialization and development startup

---

### `start-dev-server.sh`

**Purpose:** Docker Compose dev environment startup

Builds and starts all services (postgres, redis, app) with health checks.

```bash
./scripts/start-dev-server.sh
```

**Use case:** One-command local development environment setup

---

## CI/Verification Scripts

### `ci-verify-hooks.sh`

Verifies Husky hooks are correctly configured

### `codebase-audit.sh`

Comprehensive codebase audit and linting

### `simulate-ci.sh`

Simulates CI environment locally for testing

---

## Running Scripts

All scripts are executable. Run from project root:

```bash
bash scripts/<script-name>.sh
# or
./scripts/<script-name>.sh
```

Some scripts may require:

- `docker` / `docker-compose` installed
- `node` / `pnpm` available
- Proper environment variables (see `.env.example`)
