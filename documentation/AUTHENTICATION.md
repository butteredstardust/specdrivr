**SPECDRIVR**

Master Product Specification

Version 1.0 · Confidential

_Spec-driven autonomous code execution for engineering teams_

# **7\. Authentication & Authorisation**

## **7.1 Auth System**

- Authentication provider: [Better Auth](https://www.better-auth.com/) with Email & Password plugin.
- Session storage: Redis-backed via BetterAuth Upstash Redis adapter. This ensures session persistence across serverless/edge functions without DB-thundering-herd issues.
- Database sync: User data and account links are stored in PostgreSQL via Drizzle adapter.
- Cookies: Uses `better-auth.session_token` (and `__Secure-` prefix in production).
- Passwords: bcrypt, cost factor 12. Never stored in plain text. Never logged.
- Password reset: BetterAuth standard verification flow.
- Invite flow: unique UUID token, 7-day TTL, single-use. Stored in invites table. On use, user is created and token is invalidated in one transaction.
- API tokens: generated as sdk\_{projectSlug}\_{48 random hex chars}. Stored as bcrypt hash. Shown to user exactly once on creation.

## **7.2 RBAC - Roles & Permissions**

Roles are per-project. A user can be Admin on Project A and Member on Project B. Owner is a special global role - exactly one per project.

| **Permission**                              | **Viewer** | **Member** | **Admin** | **Owner** |
| ------------------------------------------- | ---------- | ---------- | --------- | --------- |
| View specs, plans, tasks, sessions, changes | ✓          | ✓          | ✓         | ✓         |
| Create and edit specifications              | ✗          | ✓          | ✓         | ✓         |
| Generate plan                               | ✗          | ✓          | ✓         | ✓         |
| Approve / reject plan                       | ✗          | ✗          | ✓         | ✓         |
| Request plan changes                        | ✗          | ✗          | ✓         | ✓         |
| Start / pause / cancel sessions             | ✗          | ✗          | ✓         | ✓         |
| Provide blocking context (unblock task)     | ✗          | ✓          | ✓         | ✓         |
| Manually mark task done / blocked           | ✗          | ✗          | ✓         | ✓         |
| Invite team members                         | ✗          | ✗          | ✓         | ✓         |
| Change member roles (up to own role)        | ✗          | ✗          | ✓         | ✓         |
| View audit log                              | ✗          | ✗          | ✓         | ✓         |
| Modify project and agent settings           | ✗          | ✗          | ✓         | ✓         |
| Manage integrations                         | ✗          | ✗          | ✓         | ✓         |
| Delete project                              | ✗          | ✗          | ✗         | ✓         |
| Transfer ownership                          | ✗          | ✗          | ✗         | ✓         |

UI Rule: Never hide permission-gated actions from lower roles - always show them in a disabled state with a Tooltip explaining the required role. Visibility without access teaches users what is possible and how to request it.
