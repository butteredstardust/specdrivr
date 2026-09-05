# Infrastructure

This directory contains infrastructure and deployment configuration.

## Structure

```
infra/
├── docker/
│   ├── Dockerfile.ubuntu      # Production Docker image
│   ├── Dockerfile.runner      # CI/Test runner image
│   ├── docker-entrypoint.sh   # App entrypoint script
│   └── .dockerignore          # Docker build exclusions
└── compose/
    ├── docker-compose.yml     # Local development setup
    └── docker-compose.ci.yml  # CI environment setup
```

## Quick commands

```bash
# Start local environment
docker-compose up -d

# Run CI environment (from root)
docker-compose -f infra/compose/docker-compose.ci.yml up

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## Notes

- Project-root symlinks provide `docker-compose.yml` and `docker-compose.ci.yml`.
- Docker builds reference files from the project root.
- `context: ..` keeps compose paths relative to the project root.
