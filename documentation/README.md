# Specdrivr documentation

Use this index to find product, module, and infrastructure documentation.

## Infrastructure specifications

- [Architecture](./infrastructure/ARCHITECTURE.md): System overview, technical stack, and security.
- [Database](./infrastructure/DATABASE.md): Schema, data models, and enums.
- [API](./infrastructure/API.md): REST API reference.
- [AI Protocols](./infrastructure/AI_PROTOCOLS.md): AI prompts and JSON schemas.
- [Billing and usage](./infrastructure/BILLING_ALGORITHM.md): Cost calculation logic.
- [Webhook schemas](./infrastructure/WEBHOOK_SCHEMAS.md): Outgoing integration payloads.
- [State machines](./infrastructure/STATE_MACHINES.md): Status enums and transition rules.
- [Flow diagrams](./infrastructure/FLOW_DIAGRAMS.md): Mermaid diagrams for asynchronous flows.
- [Error registry](./infrastructure/ERROR_REGISTRY.md): Error codes and envelopes.
- [Redis registry](./infrastructure/REDIS_REGISTRY.md): Key prefixes, TTLs, and cache policies.
- [Testing handbook](./infrastructure/TESTING_HANDBOOK.md): Mock and E2E patterns.
- [Coding patterns](./infrastructure/CODING_PATTERNS.md): Standard implementation patterns.
- [Symbol registry](./infrastructure/SYMBOL_REGISTRY.md): Repository method signatures.
- [Directory map](./infrastructure/DIRECTORY_MAP.md): Folder responsibilities and rules.
- [Troubleshooting](./infrastructure/TROUBLESHOOTING.md): Recovery procedures.
- [Workflows](./infrastructure/WORKFLOWS.md): Technical task checklists.
- [Scripts reference](./infrastructure/SCRIPTS_REFERENCE.md): Automation utilities.
- [Environment variables](./infrastructure/ENVIRONMENT_VARIABLES.md): Zod-validated variables.
- [Design system](./infrastructure/DESIGN_SYSTEM.md): UI tokens and shell patterns.
- [Development](./infrastructure/DEVELOPMENT.md): Setup, Git workflow, and testing.
- [Integrations](./infrastructure/INTEGRATIONS.md): External services and webhooks.
- [Database ER diagram](./infrastructure/DATABASE_DIAGRAM.md): Entity diagram for the database.

## Product documentation

- [Product specification](./PRODUCT.md): Product-level specification.
- [Product map](./PRODUCT_MAP.md): Feature implementation map.
- [Roadmap](./ROADMAP.md): Product roadmap.
- [Architecture decisions](./DECISIONS.md): Architecture decision log.

## Feature modules

- [Authentication and access](./modules/auth.md): Login, RBAC, onboarding, and team management. Audience: all developers.
- [Project management](./modules/projects.md): Project lifecycle, switching, and settings. Audience: all developers.
- [Specifications and planning](./modules/specifications.md): Spec editor, plan generation, and approval. Audience: frontend and product engineers.
- [Tasks and intervention](./modules/tasks.md): Task list, task drawer, unblocking, and dependencies. Audience: all developers.
- [Execution and sessions](./modules/execution.md): Mission Control, session browser, and agent protocol. Audience: backend and agent engineers.
- [Settings and administration](./modules/settings.md): Profile, security, audit log, and usage. Audience: administrators and DevOps engineers.

## Future documentation

- [Future specifications](./FUTURE_SPECIFICATIONS.md): Planned features and designs.

Start with [Architecture](./infrastructure/ARCHITECTURE.md). Then read [Authentication](./modules/auth.md).
