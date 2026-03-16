# Infrastructure

Consolidated infrastructure and deployment configuration.

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

## Quick Commands

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

- Symlinks exist at project root (`docker-compose.yml`, `docker-compose.ci.yml`) for convenience
- All Docker builds reference files relative to project root
- The `context: ..` in compose files keeps paths relative to root directory
