**SPECDRIVR**

Master Product Specification — Authentication & RBAC

[Status: GROUND TRUTH]

---

## 1. Overview

This module covers the authentication system and role-based access control (RBAC). Specdrivr uses a strict, per-project permission model to ensure secure autonomous code execution.

## 2. Technical Specification

### 2.1 Auth System

- **Provider**: [Better Auth](https://www.better-auth.com/) with Email & Password plugin.
- **Session Storage**: Database persistence (Postgres via Drizzle adapter).
- **Cookies**: `better-auth.session_token` (with `__Secure-` prefix in production). `cookieCache` enabled (5m).
- **Passwords**: bcrypt (cost factor 12).
- **Invite Flow**: UUID token (7-day TTL, single-use).
- **API Tokens**: `sdk_{projectSlug}_{48 hex chars}`. Verification uses prefix-based lookup (first 10 chars).

### 2.2 RBAC - Roles & Permissions

Roles are per-project. A user can be Admin on Project A and Member on Project B.

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
- **Redirect**: Unauthenticated requests redirect here with `?next=`.
- **Validation**: Email format check on blur; required password on submit.
- **Error UI**: Sterile red banner below button: `"Invalid email or password."`

### 3.2 Forgot & Reset Password

- **Forgot**: `/forgot-password` (Email only). Always shows success UI for security.
- **Reset**: `/reset-password?token=[token]` (Two password fields).

### 3.3 Member Management UI

- **Invite Dialog**: Email input + Role dropdown.
- **Team List**: Shows name, email, role, and status (Active/Invited).
- **Role Dropdown**: Inline, per row. Cannot set a role higher than your own.

### 3.4 Onboarding Flow

- **Trigger**: `onboardingComplete = false` on user record after first login.
- **Steps**:
  1. **Welcome**: Specdrivr brand introduction.
  2. **The Flow**: Visual diagram of Spec → Plan → Approve → Build.
  3. **First Project**: Inline form to create the initial project.
- **Persistence**: Modal overlay that prevents interaction until complete.

## 4. Agent Handbook

### 4.1 Key Files

- **Logic**: `src/lib/auth.ts` (BetterAuth config), `src/lib/rbac.ts` (Permission checks), `src/lib/auth-client.ts` (client hooks).
- **Database**: `src/db/schema.ts` (`users`, `sessions`, `accounts`, `verifications` tables).
- **UI**: `src/app/(auth)/login/page.tsx`, `src/app/(auth)/reset-password/page.tsx`, `src/app/(auth)/forgot-password/page.tsx`, `src/app/(auth)/invite/page.tsx`.
- **Routes**: `src/app/api/auth/[...all]/route.ts`.

### 4.2 Critical Paths

- **Session Check**: Every Server Component/Action should use `await auth.getSession()`.
- **RBAC Check**: Use `checkPermission(userId, projectId, action)` before any mutation.

### 4.3 Common Pitfalls

- **Direct process.env**: Never use `process.env` directly for auth secrets; use `@/lib/env`.
- **Role Elevation**: Ensure users cannot change their own role to a higher one or change others to a role higher than their own.
