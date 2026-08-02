# Scripts Directory

Utility and automation scripts for development, testing, and deployment.

**Canonical reference:** [`documentation/infrastructure/SCRIPTS_REFERENCE.md`](../documentation/infrastructure/SCRIPTS_REFERENCE.md) documents every script here (and every `package.json` script) with its invocation and purpose. This file just gets you running quickly.

## Quick Start

```bash
./scripts/bootstrap.sh          # first-time setup on a clean Ubuntu environment
./scripts/start-dev-server.sh   # one-command Docker Compose dev environment
./scripts/codebase-audit.sh     # run before pushing, to catch policy violations
```

## Running Scripts

All shell scripts are executable. Run from the project root:

```bash
bash scripts/<script-name>.sh
# or
./scripts/<script-name>.sh
```

Some scripts require `docker`/`docker-compose`, `node`/`pnpm`, and the environment variables in `.env.example`.
