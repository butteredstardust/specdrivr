# Specdrivr Documentation

Welcome to the master product specification for Specdrivr.

[Status: GROUND TRUTH]

## 🏗️ Infrastructure Specs

Global system architecture, technical constraints, and development guidelines.

- **[Architecture](./infrastructure/ARCHITECTURE.md)**: System overview, tech stack, and security.
- **[Database](./infrastructure/DATABASE.md)**: Schema, data models, and enums.
- **[API](./infrastructure/API.md)**: Complete REST API reference.
- **[AI Protocols](./infrastructure/AI_PROTOCOLS.md)**: AI prompts and JSON schemas.
- **[Billing & Usage](./infrastructure/BILLING_ALGORITHM.md)**: Cost calculation logic.
- **[Webhook Schemas](./infrastructure/WEBHOOK_SCHEMAS.md)**: Outgoing integration payloads.
- **[State Machines](./infrastructure/STATE_MACHINES.md)**: Status enums and transition rules.
- **[Core Flow Diagrams](./infrastructure/FLOW_DIAGRAMS.md)**: Mermaid sequence diagrams for async flows.
- **[Error Registry](./infrastructure/ERROR_REGISTRY.md)**: Standardized error codes and envelopes.
- **[Redis Registry](./infrastructure/REDIS_REGISTRY.md)**: Key prefixes, TTLs, and cache policies.
- **[Testing Handbook](./infrastructure/TESTING_HANDBOOK.md)**: Standardized patterns for mocks and E2E.
- **[Coding Patterns](./infrastructure/CODING_PATTERNS.md)**: Copy-pasteable "Golden Path" snippets.
- **[Symbol Registry](./infrastructure/SYMBOL_REGISTRY.md)**: Core method signatures for Repositories.
- **[Directory Map](./infrastructure/DIRECTORY_MAP.md)**: Strict folder responsibilities and rules.
- **[Troubleshooting](./infrastructure/TROUBLESHOOTING.md)**: Decision tree for agent-led healing.
- **[Workflows & Recipes](./infrastructure/WORKFLOWS.md)**: Checklists for common technical tasks.
- **[Scripts Reference](./infrastructure/SCRIPTS_REFERENCE.md)**: Documentation for automation utilities.
- **[Environment Variables](./infrastructure/ENVIRONMENT_VARIABLES.md)**: Registry of all Zod-validated vars.
- **[Design System](./infrastructure/DESIGN_SYSTEM.md)**: UI tokens, mascot, and app shell patterns.
- **[Development](./infrastructure/DEVELOPMENT.md)**: Setup, Git workflow, and testing.
- **[Authentication & RBAC](./modules/auth.md)**: Technical auth specs and RBAC rules.
- **[Integrations](./infrastructure/INTEGRATIONS.md)**: External services and webhooks.
- **[Database ER Diagram](./infrastructure/DATABASE_DIAGRAM.md)**: Entity-relationship diagram companion to [Database](./infrastructure/DATABASE.md).

## 🗂️ Specification Index

- **[Specification Index](./SPECIFICATION_INDEX.md)**: Feature-area → documentation module → audience mapping. Use this to find which module doc owns a given feature.
- **[Master Product Specification](./PRODUCT.md)**: Product-level spec.
- **[Implementation Plan](./IMPLEMENTATION_PLAN_V5.md)**: Master vision roadmap.

## 📦 Feature Modules

Vertical slices of the application combining UI, flows, and business logic.

- **[Product Map & Status](./PRODUCT_MAP.md)**: High-level dashboard of implemented features.
- **[Authentication & Access](./modules/auth.md)**: Login, RBAC, Onboarding, and Team management.
- **[Project Management](./modules/projects.md)**: Project lifecycle, switching, and general settings.
- **[Specifications & Planning](./modules/specifications.md)**: Spec Editor, Plan generation, and Approval workflow.
- **[Tasks & Intervention](./modules/tasks.md)**: Task list, Drawer, Unblocking, and Dependency rules.
- **[Execution & Agent Sessions](./modules/execution.md)**: Mission Control, Session Browser, and Agent protocol.
- **[Settings & Admin](./modules/settings.md)**: Profile, Security, Audit Log, and Usage.

## 🔮 Future Vision

- **[Future Specifications](./FUTURE_SPECIFICATIONS.md)**: Planned features and visionary designs.

---

_For new developers: Start with [Architecture](./infrastructure/ARCHITECTURE.md) and the [Auth Module](./modules/auth.md)._
