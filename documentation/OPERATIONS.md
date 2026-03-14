**SPECDRIVR**

Master Product Specification

Version 1.0 · Confidential

_Spec-driven autonomous code execution for engineering teams_

# **17\. Non-Functional Requirements**

## **17.1 Performance**

| **Metric**                      | **Target**                                               |
| ------------------------------- | -------------------------------------------------------- |
| Page load (Time to Interactive) | < 2 seconds on 4G connection                             |
| API response time (p95)         | < 300ms for all read endpoints                           |
| Plan generation latency         | < 30 seconds for specs up to 5,000 words                 |
| Task log streaming lag          | < 1 second from event creation to UI display (via 3s poll)  |
| Diff rendering                  | < 500ms for diffs up to 10,000 lines (Shiki server-side) |
| Notification badge update       | < 3 seconds from event creation to badge update          |

## **17.2 Security**

- All input validated with Zod at the API boundary. No raw SQL string interpolation - parameterised queries only (Drizzle ORM enforces this).
- Rate limiting: Upstash Ratelimit in proxy.ts. Auth endpoints: 10 req/min per IP. API endpoints: 100 req/min per user. Agent endpoints: 1000 req/min per token.
- Sanitization: Mandatory `DOMPurify` for all spec/markdown rendering to prevent XSS.
- CSRF protection: BetterAuth handles for session-based requests. API token requests are exempt (no cookies involved).
- Secrets: never stored in database. Never logged. Never returned in API responses (except one-time token reveal). AGENT_TOKEN visible only in infrastructure environment variables.
- import 'server-only' on lib/db.ts, lib/env.ts, lib/logger.ts - build-time enforcement of server boundary.
- Audit log: all administrative actions are written to audit_log within the same DB transaction as the action. Cannot be suppressed.


## **17.3 Accessibility**

- WCAG 2.1 AA compliance target.
- All interactive elements: keyboard focusable with visible focus ring (violet 2px outline).
- ARIA attributes on all custom components (Radix primitives handle most automatically).
- Colour is never the sole indicator of state - always paired with a text label or icon.
- DAEMON sprite: role="img" with aria-label describing current expression and meaning.
- Terminal panels (xterm.js): not keyboard-accessible internally, but all terminal content is also available in structured form via the ATTEMPTS tab log lines.

## **17.4 Data Retention & Privacy**

- Session and event logs retained for 90 days by default (configurable per project).
- User data: name and email. No tracking, no analytics cookies, no third-party pixels.
- Spec content: retained indefinitely unless the spec is deleted by an Admin/Owner.
- File change diffs: retained with the session that produced them. Deleted when session is deleted.
- GDPR: user account deletion (by Owner) removes all personal data. Spec history and agent events retain only userId references which become null-valued after deletion.

## **17.5 Observability**

- Structured logging: Pino, JSON format, level-gated (info in prod, debug in dev). Correlation ID on every request.
- Never log: passwords, tokens, session cookies, PII (email, name), spec content, or diff content.
- Error tracking: Sentry or equivalent - capture unhandled exceptions with request context. PII scrubbed before submission.
- Health endpoint: GET /api/health returns { status: "ok", db: bool, redis: bool } - used by load balancer.

# **27\. Document Control**

| **Field**      | **Value**                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Document title | Specdrivr Master Product Specification                                                                                                           |
| Version        | 1.1                                                                                                                                              |
| Status         | Draft - Authoritative                                                                                                                            |
| Supersedes     | All prior Lovable prompt documents (v1, v2, v3), Screen Map, Interaction Flows, Real-World Detail, State Machine prompts. v1.0 of this document. |
| Owner          | Product & Engineering                                                                                                                            |
| Review cadence | Updated with each significant product decision. Minor corrections do not increment version.                                                      |

## **17.5 Environment Security & Secrets Management**

**Validation at Startup:**
All environment variables are validated at startup via `lib/env.ts` using Zod. The application will fail to boot if any required variable is missing or malformed, preventing silent runtime failures.

**Secret Storage:**

- Secrets (e.g., `AUTH_SECRET`, `DATABASE_URL`) must never be prefixed with `NEXT_PUBLIC_`.
- In a Next.js (Vercel) environment, secrets are managed securely within the platform dashboard and injected at build/runtime.
- Passwords are hashed with bcrypt (cost 12) before storage.
- API tokens (e.g., `AGENT_TOKEN`) are displayed to the user only once and stored as a bcrypt hash.
- Redis handles short-lived tokens (e.g., password reset, email validation) to avoid persisting sensitive, ephemeral data in the main database.

## **17.6 Observability, Logging, & Metrics**

**Structured Logging (Pino):**

- Specdrivr uses `pino` for high-performance, structured JSON logging.
- Logging levels: `debug` (local/development), `info` (request lifecycle/production), `warn` (recoverable errors), `error` (exceptions).
- Every log entry must include a `correlationId` (extracted from request headers or generated via `crypto.randomUUID()`) for end-to-end trace mapping across services (e.g., DAEMON to Next.js API).
- PII (Personally Identifiable Information), passwords, tokens, and raw request bodies are explicitly excluded from logs.

**Metrics & Telemetry:**

- Critical paths (e.g., API response times, database query durations, agent task execution times) should be instrumented for external APM tools (e.g., Datadog, New Relic) via custom Next.js wrappers.

## **17.7 Fallback Strategies & Resiliency**

**Redis (Upstash) Fallback:**

- Redis is utilized for distributed locking, agent task queues, and rate limiting.
- In the event of a Redis outage:
  1. Rate limiting gracefully fails open (or is handled via edge cached responses depending on configuration) to avoid bringing down the entire API, though strict constraints on Auth endpoints remain.
  2. Agent execution queues pause; tasks remain safe in PostgreSQL (`status: todo`). The agent will resume polling once Redis connectivity is restored.
