**SPECDRIVR**

Master Product Specification - Future Specifications

Version 1.0 · Confidential

_Spec-driven autonomous code execution for engineering teams_

---

[Status: VISIONARY / FUTURE]

# **Overview**

This document serves as the central repository for all features, specifications, and architectural designs that are planned for future versions of Specdrivr but are not yet implemented in the current production environment.

The goal is to preserve the long-term vision and detailed specifications while keeping the primary documentation focused on the "Ground Truth" of the current implementation.

---

# **Part 1 — Product & UI Vision**

## **1.1 Onboarding Flow (v2 Enhancements)**
- **Self-hosted Docker option on roadmap.**
- **Integration with Resend for email notifications on task failures.**
- **Automated PR creation on task completion via Octokit.**

## 1.2 Advanced UI Interactions
- **Full integration of `Shiki` for diff rendering in the task view.**
- **Dynamic budget alerts UI.**
- **Plan Review Audit Trail**: At the bottom of the PLAN tab, a `REVIEW HISTORY` collapsible section showing each review entry (Approved, Changes Requested, Rejected) with reviewer name, timestamp, and notes.


---

# **Part 2 — Technical Architecture (Future)**

## **2.1 Background Worker for Plan Generation**
- **Migrate plan generation from fire-and-forget async in Route Handlers to a dedicated background worker (Node.js process polling a `plan_jobs` table) to improve reliability and visibility.**

## **2.2 Performance Optimization**
- **Redis caching for frequent API lookups (e.g., project memberships).**
- **Bundle size optimization for heavy client-side libraries (xterm, monaco).**

## **2.3 Orchestration & Task Management**
- **Prompt Management**: Implement a centralized `PromptManager` in the codebase to version and serve system prompts and templates to the LLM and the Agent.
- **Concurrency Enforcement**: Implement atomic concurrency checks in the task-claiming route handler to strictly enforce `maxConcurrentTasks` per session.
- **Ghost Buster**: Implement a background job (e.g., via `cron` or a queue worker) that periodically scans for sessions that have missed their heartbeat threshold and triggers recovery (reverting `in_progress` tasks to `todo`).
- **Error Mapping Middleware**: Implement a centralized error mapping utility that translates repository-level exceptions into standardized API error codes.

---

# **Part 3 — Integrations & Billing**

## **3.1 Pricing Service**
- **Versioned Calculations**: Implement a `PricingService` in the backend that handles versioned cost calculations based on `model_id` and the event timestamp, ensuring historical accuracy as provider prices change.

## **3.2 Integration Service**
- **Webhook Management**: Implement a centralized `IntegrationService` to manage webhook delivery, HMAC signing, and exponential backoff retry logic.
- **Webhooks DLQ**: Implement a Dead Letter Queue strategy for failed integration deliveries to ensure reliability and manual retry capability.

## **3.3 Budget Alerts**
Specify the data structure now so the schema is ready when budget alerts are implemented:

\-- budget_alerts (create now, implement UI later)
id TEXT PRIMARY KEY
projectId TEXT REFERENCES projects(id) ON DELETE CASCADE
threshold NUMERIC(10,4) -- USD amount
period TEXT -- "daily" | "monthly"
alertType TEXT -- "email" | "webhook" | "both"
triggeredAt TIMESTAMPTZ -- last time this alert fired
createdAt TIMESTAMPTZ DEFAULT NOW()

---

# **Part 4 — Operations**

## **4.1 Advanced Monitoring**
- **Database query indexing audit.**
- **Comprehensive E2E Playwright tests for Login -> Spec -> Plan -> Execution.**

---

# **Part 5 — Security & Resilience (Future)**

## **5.1 Git Workflow & CI**
- **Blocking Pre-push Hooks**: Convert critical security checks (XSS, Secrets, Migration integrity) from non-blocking warnings to blocking failures in the git workflow.

## **5.2 Agent Security**
- **Agent Sandbox Jail**: Implement a virtual root or directory restriction in the DAEMON agent runtime to prevent unauthorized file system access.

## **5.3 Data Integrity**
- **Audit Log Integrity**: Implement cryptographic integrity (e.g., HMAC signing or hashing) for the `audit_logs` table to ensure non-repudiation.

## **5.4 Resilience & Scale**
- **Distributed Rate Limiting**: Full migration from in-process rate limiting to Redis-backed `Upstash Ratelimit` for high-concurrency agent endpoints.
- **Webhook Dead Letter Queue (DLQ)**: Implement a DLQ strategy for failed integration deliveries to ensure reliability and visibility.

