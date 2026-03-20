# **Specdrivr Implementation Plan — Master Vision Roadmap (v6.1)**

[Status: GROUND TRUTH]

This document serves as the definitive execution roadmap for Specdrivr, incorporating all refined specifications, architectural improvements, and long-term vision.

## **Phase 1 — Core Infrastructure & Security (Completed)**

### **1.1 Database Schema & ORM**
- [x] Implement the 17 core tables in `src/db/schema.ts`.
- [x] Use Drizzle ORM for type-safe queries.
- [x] Standardize on `pnpm db:generate` and `pnpm db:migrate`.

### **1.2 Authentication**
- [x] Set up **BetterAuth** with PostgreSQL (Drizzle adapter).
- [x] Extend user schema with RBAC roles (`viewer`, `member`, `admin`, `owner`).
- [x] Implement API tokens for agents with prefix-based Bcrypt verification.

### **1.3 Environment & Config**
- [x] Centralize all configuration in `src/lib/env-core.ts` with Zod validation.
- [x] Enforce `server-only` imports for sensitive libraries.

---

## **Phase 2 — Autonomous Pipeline (Completed)**

### **2.1 Specification Management**
- [x] Implement `SpecificationRepository` with versioning.
- [x] Auto-abandon plans when a new spec version is created.

### **2.2 Plan Generation**
- [x] Implement `generatePlan` and `generateTasks` using **Gemini 2.0 Flash**.
- [x] **Ground Truth**: Currently implemented as fire-and-forget async in Route Handlers. (Migration planned in Phase 5).

### **2.3 Agent Worker Loop**
- [x] Implement `scripts/agent.ts` with API polling and heartbeat.
- [x] Implement atomic task claiming via `SELECT ... FOR UPDATE SKIP LOCKED`.
- [x] Support for multi-backend execution (Gemini/Claude).

---

## **Phase 3 — UI & Developer Experience (In Progress)**

### **3.1 Mission Control Dashboard**
- [x] Real-time session status monitoring and progress tracking.
- [x] Live log streaming from agent to UI via session-scoped logs.

### **3.2 Spec Editor**
- [x] Markdown editor with live preview and XSS sanitization.

### **3.3 Task Detail Drawer**
- [x] Implementation of `Vaul` drawer for task details.
- [x] **Architectural Hardening**: Implementation of `SYMBOL_REGISTRY.md`, `DESIGN_SYSTEM.md` Visual Intent, and `data-testid` standards.

---

## **Phase 4 — Operations & Monitoring (In Progress)**

### **4.1 Audit Logging**
- [x] Comprehensive audit trail for all project actions (`audit_log`).
- [x] Webhook delivery tracking table.

### **4.2 Notifications**
- [x] In-app notification system with real-time updates.
- [ ] **PLANNED**: Integration with Resend for email alerts.

---

## **Phase 5 — Reliability & Orchestration (The "Self-Healing" Milestone)**
*Focus: Resilience and state-tracked execution.*

### 5.1 Asynchronous Background Worker
- [ ] Implement a dedicated `PlanWorker` process to handle Gemini/Claude plan generation.
- [ ] Create a `plan_jobs` table to track job state and provide better UI feedback.

### 5.2 Ghost Task Recovery ("Ghost Buster")
- [ ] Implement the automated recovery logic for tasks in sessions that miss heartbeats.
- [ ] Create a recurring Cron job to revert `in_progress` tasks to `todo` after timeout.

### 5.3 Atomic Concurrency Enforcement
- [ ] Update the task-claiming API to strictly enforce `maxConcurrentTasks` per session.

---

## **Phase 6 — Security & Governance**
*Focus: Hardening system boundaries.*

### 6.1 Blocking Security Hooks
- [ ] Convert non-blocking pre-push checks (XSS, Secrets, Migrations) into blocking failures.

### 6.2 Agent Sandbox & Jail
- [ ] Implement virtual root/directory restriction in the DAEMON agent runtime.

### 6.3 Audit Log Integrity
- [ ] Implement HMAC-SHA256 signing for `audit_logs` to ensure non-repudiation.

---

## **Phase 7 — Integration & Scaling**
*Focus: Reliability and cost management.*

### 7.1 Advanced Integration Service
- [ ] Centralize outgoing webhooks with exponential backoff and Dead Letter Queues (DLQ).

### 7.2 Versioned Pricing & Billing
- [ ] Implement the `PricingService` for historical cost accuracy.

### 7.3 Distributed Rate Limiting
- [ ] Migrate all high-concurrency endpoints to Redis-backed `Upstash Ratelimit`.

---

## **Phase 8 — Advanced UX & Analytics**
*Focus: Polishing and visibility.*

### 8.1 Shiki Diff Integration
- [ ] Implement server-side Shiki syntax highlighting for task and spec diffs.

### 8.2 Full Notification Suite
- [ ] Complete Email (Resend) and Slack (Block Kit) integrations for all events.

### 8.3 Usage Dashboards
- [ ] Implement daily cost analytics and token usage charts in Settings.

---

## **Phase 9 — Enterprise Quality & Ops**
*Focus: Scale and automation.*

### 9.1 Playwright E2E Testing
- [ ] Automate the full Spec -> Plan -> Execute lifecycle testing.

### 9.2 GitHub PR Automation
- [ ] Implement automated PR creation via Octokit upon spec completion.

### 9.3 Self-Hosted Docker Deployment
- [ ] Provide official Docker Compose configurations for the full stack.
