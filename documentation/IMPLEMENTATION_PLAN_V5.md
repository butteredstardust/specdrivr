# **Specdrivr Implementation Plan — Ground Truth Alignment**

This document serves as the corrected, deterministic execution roadmap for Specdrivr, synchronized with the actual system state as of March 2026.

## **Phase 1 — Core Infrastructure & Security**

### **1.1 Database Schema & ORM (Completed)**
- [x] Implement the 17 core tables in `src/db/schema.ts`.
- [x] Use Drizzle ORM for type-safe queries.
- [x] Standardize on `pnpm db:generate` and `pnpm db:migrate`.

### **1.2 Authentication (Completed)**
- [x] Set up **BetterAuth** with PostgreSQL (Drizzle adapter).
- [x] Extend user schema with RBAC roles (`viewer`, `member`, `admin`, `owner`).
- [x] Implement API tokens for agents with prefix-based Bcrypt verification.

### **1.3 Environment & Config (Completed)**
- [x] Centralize all configuration in `src/lib/env-core.ts` with Zod validation.
- [x] Enforce `server-only` imports for sensitive libraries.

---

## **Phase 2 — Autonomous Pipeline Implementation**

### **2.1 Specification Management (Completed)**
- [x] Implement `SpecificationRepository` with versioning.
- [x] Auto-abandon plans when a new spec version is created.

### **2.2 Plan Generation (Ground Truth Alignment)**
- [x] Implement `generatePlan` and `generateTasks` using **Gemini 2.0 Flash**.
- [x] **Correction**: Plan generation is currently fire-and-forget async in Route Handlers. 
- [ ] **PLANNED**: Migrate to a dedicated background worker (Node.js process polling a `plan_jobs` table) to improve reliability and visibility.

### **2.3 Agent Worker Loop (Ground Truth Alignment)**
- [x] Implement `scripts/agent.ts` with API polling.
- [x] Implement atomic task claiming via `SELECT ... FOR UPDATE SKIP LOCKED` in `TaskRepository`.
- [x] Support for multi-backend execution (Gemini/Claude).

---

## **Phase 3 — UI & Developer Experience**

### **3.1 Mission Control Dashboard (Completed)**
- [x] Real-time session status monitoring.
- [x] Live log streaming from agent to UI via session-scoped logs.

### **3.2 Spec Editor (Completed)**
- [x] Markdown editor with live preview.
- [x] Mandatory XSS sanitization via `isomorphic-dompurify`.

### **3.3 Task Detail Drawer (In Progress)**
- [x] Implementation of `Vaul` drawer for task details.
- [ ] **PLANNED**: Full integration of `Shiki` for diff rendering in the task view.

---

## **Phase 4 — Operations & Monitoring**

### **4.1 Audit Logging (Completed)**
- [x] Comprehensive audit trail for all project actions (`audit_log`).
- [x] Webhook delivery tracking.

### **4.2 Notifications (In Progress)**
- [x] In-app notification system.
- [ ] **PLANNED**: Integration with Resend for email notifications on task failures.

### **4.3 Integration & Webhooks (In Progress)**
- [x] GitHub webhook handling for repository synchronization.
- [ ] **PLANNED**: Automated PR creation on task completion via Octokit.

---

## **Phase 5 — Quality & Performance**

### **5.1 Testing Strategy**
- [x] Vitest for core repository and library logic.
- [ ] Playwright for E2E flows (Login -> Spec -> Plan -> Execution).
- [x] Husky hooks for pre-commit linting and typechecking.

### **5.2 Performance Optimization**
- [ ] Database query indexing audit.
- [ ] Redis caching for frequent API lookups (e.g., project memberships).
- [ ] Bundle size optimization for heavy client-side libraries (xterm, monaco).
