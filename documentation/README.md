# Specdrivr Documentation

Welcome to the master product specification for Specdrivr.

[Status: GROUND TRUTH]

## 🏗️ Infrastructure Specs
Global system architecture, technical constraints, and development guidelines.

- **[Architecture](./infrastructure/ARCHITECTURE.md)**: System overview, tech stack, and security.
- **[Database](./infrastructure/DATABASE.md)**: Schema, data models, and enums.
- **[API](./infrastructure/API.md)**: Complete REST API reference.
- **[Design System](./infrastructure/DESIGN_SYSTEM.md)**: UI tokens, mascot, and app shell patterns.
- **[Development](./infrastructure/DEVELOPMENT.md)**: Setup, Git workflow, and testing.
- **[Authentication & RBAC](./infrastructure/AUTHENTICATION.md)**: Technical auth specs (Legacy - see Module/Auth).
- **[Integrations](./infrastructure/INTEGRATIONS.md)**: External services and webhooks.

## 📦 Feature Modules
Vertical slices of the application combining UI, flows, and business logic.

- **[Authentication & Access](./modules/auth.md)**: Login, RBAC, Onboarding, and Team management.
- **[Project Management](./modules/projects.md)**: Project lifecycle, switching, and general settings.
- **[Specifications & Planning](./modules/specifications.md)**: Spec Editor, Plan generation, and Approval workflow.
- **[Execution & Agent Sessions](./modules/execution.md)**: Mission Control, Task Drawer, and Agent protocol.
- **[Settings & Admin](./modules/settings.md)**: Profile, Security, Audit Log, and Usage.

## 🔮 Future Vision
- **[Future Specifications](./FUTURE_SPECIFICATIONS.md)**: Planned features and visionary designs.

---
*For new developers: Start with [Architecture](./infrastructure/ARCHITECTURE.md) and the [Auth Module](./modules/auth.md).*
