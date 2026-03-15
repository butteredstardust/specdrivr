**SPECDRIVR**

Master Product Specification - Index

Version 1.0 · Confidential

_Spec-driven autonomous code execution for engineering teams_

---

This specification has been split into the following purpose-specific files:

## Product Specification

**Audience**: Stakeholders, Product Managers, Engineers

- **[PRODUCT.md](PRODUCT.md)** - Product overview, vision, user personas, onboarding, error states, and microcopy
  - Executive Summary
  - Product Vision & Goals
  - User Personas
  - Onboarding
  - Error States & Edge Cases
  - Empty States & Microcopy Reference

- **[PRODUCT_FEATURES.md](PRODUCT_FEATURES.md)** - Authentication flows, RBAC, settings, notifications, and user management
  - Authentication System (Login, Forgot Password, Reset Password)
  - User Management & RBAC (Owner, Admin, Member, Viewer roles)
  - Plan Review & Rejection workflows
  - Onboarding Flow
  - Notification System
  - Settings (Project, Agent, Advanced, Danger Zone)
  - User Profile & Preferences

## Technical Architecture

**Audience**: Engineers, Architects

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and engineering constraints
  - System Architecture
  - Stack-Specific Engineering Constraints
  - Concurrency & Race Condition Handling

- **[DATABASE.md](DATABASE.md)** - Database schema and data models
  - Data Model
  - Extended Data Model - Missing & Corrected Fields
  - Reference Seed Data

- **[API.md](API.md)** - Complete API specification
  - API Specification

- **[AUTHENTICATION.md](AUTHENTICATION.md)** - Authentication and authorization
  - Authentication & Authorisation

## Design & User Experience

**Audience**: Designers, Frontend Engineers

- **[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)** - Design system and UI specifications
  - Design System
  - DAEMON Mascot Specification
  - Application Shell
  - Pages - Detailed Specification
  - State Machines
  - Notification System

- **[USER_INTERFACE.md](USER_INTERFACE.md)** - Complete screen inventory, interaction flows, and state machines
  - Complete Screen Inventory (P1-P8 + overlays)
  - Navigation Flow Diagram
  - All 26 Interaction Flows
  - 4 State Machines (Spec, Plan, Task, Session)
  - Conditional Rendering Truth Tables
  - Mock Data Requirements
  - Component Cross-Reference
  - Anti-Patterns to Avoid

## Integration & Development

**Audience**: Engineers, DevOps

- **[INTEGRATIONS.md](INTEGRATIONS.md)** - External service integrations
  - Integrations
  - Cost & Usage Tracking

- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Development environment and workflows
  - Async Simulation Requirements (Development / Demo Mode)
  - Git Workflow Specification
  - Developer Integration Reference

## Operations

**Audience**: Engineering Managers, DevOps

- **[OPERATIONS.md](OPERATIONS.md)** - Non-functional requirements and compliance
  - Non-Functional Requirements
  - Document Control

---

**Document Information**

- Version: 1.0
- Status: Confidential
- Last Updated: 2026-03-08
- History: Split for maintainability
