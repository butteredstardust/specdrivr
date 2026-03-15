# Specdrivr Documentation

This directory contains the master product specification for the Specdrivr platform.

## Specification Files

The product specification has been split into purpose-specific files for better maintainability and discoverability:

| File                                               | Purpose                                         | Target Audience                |
| -------------------------------------------------- | ----------------------------------------------- | ------------------------------ |
| [SPECIFICATION_INDEX.md](./SPECIFICATION_INDEX.md) | Master index and directory                      | Everyone                       |
| [PRODUCT.md](./PRODUCT.md)                         | Product overview, vision, user personas         | Product managers, stakeholders |
| [ARCHITECTURE.md](./ARCHITECTURE.md)               | System architecture and engineering constraints | Engineers, architects          |
| [DATABASE.md](./DATABASE.md)                       | Database schema and data models                 | Backend engineers              |
| [API.md](./API.md)                                 | Complete API specification                      | Frontend/backend engineers     |
| [AUTHENTICATION.md](./AUTHENTICATION.md)           | Authentication and authorization flows          | Security engineers             |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)             | Design system and UI specifications             | Designers, frontend engineers  |
| [INTEGRATIONS.md](./INTEGRATIONS.md)               | External service integrations                   | DevOps, integration engineers  |
| [DEVELOPMENT.md](./DEVELOPMENT.md)                 | Development environment setup                   | All engineers                  |
| [OPERATIONS.md](./OPERATIONS.md)                   | Non-functional requirements and compliance      | Engineering managers, DevOps   |

## File Structure

```
documentation/
├── README.md                      # This file
├── SPECIFICATION_INDEX.md         # Master index
├── PRODUCT.md                     # Product specification
├── ARCHITECTURE.md                # Architecture specification
├── DATABASE.md                    # Database specification
├── API.md                       # API specification
├── AUTHENTICATION.md            # Auth specification
├── DESIGN_SYSTEM.md              # Design system specification
├── INTEGRATIONS.md               # Integration specification
├── DEVELOPMENT.md               # Development specification
└── OPERATIONS.md                # Operations specification
```

## Splitting Rationale

The original product specification was split from a monolithic 137KB file (2021 lines) into the current modular structure. This change was made to:

- Difficult to navigate and find specific information
- Hard to maintain (changes to one area required reviewing the entire file)
- Challenging for different stakeholders to find relevant content
- Unparseable by tools due to token limits (>25,000 tokens)

The split maintains the same content but groups sections by purpose and audience for better usability.

## Original Sections Mapping

| New File          | Original Sections                                                                                               | Line Count |
| ----------------- | --------------------------------------------------------------------------------------------------------------- | ---------- |
| PRODUCT.md        | 1 (Exec Summary), 2 (Vision), 3 (Personas), 14 (Onboarding), 16 (Error States), 20 (Empty States)               | ~149 lines |
| ARCHITECTURE.md   | 4 (System Arch), 23 (Engineering Constraints), 24 (Concurrency)                                                 | ~186 lines |
| DATABASE.md       | 5 (Data Model), 18 (Reference Seed Data), 21 (Extended Data Model)                                              | ~703 lines |
| API.md            | 6 (API Spec)                                                                                                    | ~118 lines |
| AUTHENTICATION.md | 7 (Auth & Auth)                                                                                                 | ~43 lines  |
| DESIGN_SYSTEM.md  | 8 (Design System), 9 (DAEMON Mascot), 10 (App Shell), 11 (Pages), 12 (State Machines), 15 (Notification System) | ~482 lines |
| INTEGRATIONS.md   | 13 (Integrations), 26 (Cost Tracking)                                                                           | ~108 lines |
| DEVELOPMENT.md    | 19 (Async Simulation), 22 (Git Workflow), 25 (Developer Integration)                                            | ~231 lines |
| OPERATIONS.md     | 17 (Non-Functional Req), 27 (Document Control)                                                                  | ~65 lines  |

## Usage

- **New team members**: Start with [PRODUCT.md](./PRODUCT.md) and [SPECIFICATION_INDEX.md](./SPECIFICATION_INDEX.md)
- **Frontend engineers**: Focus on [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md), [API.md](./API.md)
- **Backend engineers**: Review [DATABASE.md](./DATABASE.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [API.md](./API.md)
- **DevOps**: Check [INTEGRATIONS.md](./INTEGRATIONS.md), [OPERATIONS.md](./OPERATIONS.md)
- **Designers**: Read [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
- **Product managers**: Focus on [PRODUCT.md](./PRODUCT.md)

## Updates

When updating specifications:

1. Identify the relevant file(s) for your changes
2. Update only those files (no need to touch unrelated areas)
3. Maintain section numbering within each file
4. Update cross-references if sections move between files

## Backup

The original monolithic specification is preserved as `SPECIFICATION.md.bak` for reference and verification.
