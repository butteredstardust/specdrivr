SPECDRIVR

Master Product Specification — Authentication & RBAC

---

## 1. Overview

Use this module for authentication and role-based access control (RBAC). Apply project permissions before autonomous code execution.

## 2. Technical Specification

### 2.1 Auth System

- **Provider**: [Better Auth](https://www.better-auth.com/) with Email & Password plugin.
- **Session Storage**: Database persistence (Postgres via Drizzle adapter).
- **Cookies**: `better-auth.session_token` (with `__Secure-` prefix in production). `cookieCache` enabled (5m).
- **Passwords**: bcrypt (cost factor 12).
- **Invite Flow**: UUID token (7-day TTL, single-use).
- **API Tokens**: `sdk_{projectSlug}_{48 hex chars}`. Verification uses prefix-based lookup (first 10 chars).

### 2.2 RBAC - Roles & Permissions

Roles apply to each project. A user can be Admin on Project A and Member on Project B.

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

## 3. User Interface

### 3.1 Login Page (`/login`)

- **Route**: `/login` (No sidebar/topbar).
- **Redirect**: Redirect unauthenticated requests here with `?next=`.
- **Validation**: Check the email format on blur. Require a password on submit.
- **Error UI**: Show a token-driven danger alert below the form: `"Invalid email or password."`

### 3.2 Forgot & Reset Password

- **Forgot**: `/forgot-password` (Email only). Always show the success UI for security.
- **Reset**: `/reset-password?token=[token]` (Two password fields).

### 3.3 Member Management UI

- **Invite Dialog**: Provide an email input and a Role dropdown.
- **Team List**: Show name, email, role, and status (Active/Invited).
- **Role Dropdown**: Show it inline for each row. Do not set a role higher than your own.

### 3.4 Onboarding Flow

- **Trigger**: Start when `onboardingStep === 0` for the authenticated user.
- **Steps**:
  1. **Welcome**: Introduce the Specdrivr brand.
  2. **The Flow**: Show the Spec → Plan → Approve → Build diagram.
  3. **First Project**: Provide an inline form to create the initial project.
- **Persistence**: Use a modal overlay. Prevent interaction until onboarding is complete.

## 4. Agent Handbook

### 4.1 Key Files

- **Logic**: `src/lib/auth.ts` configures BetterAuth. `src/lib/rbac.ts` checks permissions. `src/lib/auth-client.ts` provides client hooks.
- **Database**: Use `src/db/schema.ts` for the `users`, `sessions`, `accounts`, and `verifications` tables.
- **UI**: `src/app/(auth)/login/page.tsx`, `src/app/(auth)/reset-password/page.tsx`, `src/app/(auth)/forgot-password/page.tsx`, `src/app/(auth)/invite/page.tsx`.
- **Routes**: `src/app/api/auth/[...all]/route.ts`.

### 4.2 Critical Paths

- **Session Check**: Use `await auth.getSession()` in every Server Component and Server Action.
- **RBAC Check**: Run `checkPermission(userId, projectId, action)` before each mutation.

### 4.3 Common Pitfalls

- **Direct process.env**: Never use `process.env` directly for auth secrets. Use `@/lib/env`.
- **Role Elevation**: Do not let users increase their own role. Do not let them assign roles higher than their own.
