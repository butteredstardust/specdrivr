# Scripts Directory

Use these utility and automation scripts for development, testing, and deployment.

**Canonical reference:** [`documentation/infrastructure/SCRIPTS_REFERENCE.md`](../documentation/infrastructure/SCRIPTS_REFERENCE.md) lists each script and `package.json` command. This file provides quick-start commands.

## Quick Start

```bash
./scripts/bootstrap.sh          # first-time setup on a clean Ubuntu environment
./scripts/start-dev-server.sh   # one-command Docker Compose dev environment
./scripts/codebase-audit.sh     # run before pushing, to catch policy violations
```

## Running Scripts

Run executable shell scripts from the project root:

```bash
bash scripts/<script-name>.sh
# or
./scripts/<script-name>.sh
```

Some scripts require `docker`/`docker-compose` or `node`/`pnpm`. Read `.env.example` for required environment variables.
