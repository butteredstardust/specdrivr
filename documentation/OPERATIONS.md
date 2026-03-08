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
| Task log streaming lag          | < 1 second from agent write to UI display (via 3s poll)  |
| Diff rendering                  | < 500ms for diffs up to 10,000 lines (Shiki server-side) |
| Notification badge update       | < 3 seconds from event creation to badge update          |

## **17.2 Security**

- All input validated with Zod at the API boundary. No raw SQL string interpolation - parameterised queries only (Drizzle ORM enforces this).
- Rate limiting: Upstash Ratelimit in proxy.ts. Auth endpoints: 10 req/min per IP. API endpoints: 100 req/min per user. Agent endpoints: 1000 req/min per token.
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

