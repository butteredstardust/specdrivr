**SPECDRIVR**

Master Product Specification — Settings & Administration

[Status: GROUND TRUTH]

---

## 1. Overview

This module covers user profile management, security configurations, notification preferences, and project-wide administrative tools like integrations and audit logs.

## 2. User Settings

### 2.1 Profile Settings (`/settings/profile`)

- **Avatar**: Automatically generated from initials. Custom uploads are not supported.
- **Fields**: Display Name (editable), Email (read-only).
- **Logic**: Updates the `users` table and recalculates initials/colors.

### 2.2 Security Settings (`/settings/security`)

- **Password**: Change password with current/new/confirm fields.
- **Sessions**: Table showing active browser sessions with "Revoke" actions and "Revoke all others."
- **API Tokens**: Management of `sdk_` tokens used by the DAEMON agent.
  - **Generation**: One-time reveal of the full token string.
  - **Expiry**: Options for 30, 90 days, 1 year, or Never.

### 2.3 Notification Preferences (`/settings/notifications`)

- **Channels**: Email and In-app toggles.
- **Events**: Plan generated, approved, rejected, changes requested, session status, and team actions.

## 3. Project Administration

### 3.1 Integrations (`/settings/integrations`)

- **GitHub**: OAuth-based connection. Reveals the webhook URL for the project.
- **Slack**: OAuth-based connection. Allows selecting a channel for DAEMON status updates.
- **Generic Webhooks**: Support for POSTing events to any HTTP endpoint with optional HMAC signing.

### 3.2 Agent Configuration (`/settings/agent`)

- **Execution**:
  - `Max concurrent tasks`: Slider (1-10).
  - `Task execution timeout`: Duration before a task is killed.
  - `Max retries`: Number of automatic retries before blocking.
- **Planning**:
  - `Require plan approval`: Global toggle for the approval gate.
  - `Auto-generate plan`: Triggers Gemini on spec save.

### 3.3 Audit Log (`/settings/audit`)

- **Access**: Admin/Owner only.
- **Contents**: A searchable, filterable record of all administrative actions (e.g., `PLAN_APPROVED`, `MEMBER_INVITED`).
- **Detail**: Each row expands to show the raw JSON payload of the action.

### 3.4 Usage & Cost (`/settings/usage`)

- **Analytics**: Daily cost charts and summary cards for token usage.
- **Breakdown**: Cost per specification and model-specific spending.

## 4. Agent Handbook

### 4.1 Key Files

- **Logic**: `src/lib/integrations/`, `src/actions/settings.ts`.
- **Database**: `src/db/schema/integrations.ts`, `src/db/schema/audit-logs.ts`.
- **UI Components**: `src/components/settings/`, `src/components/integrations/`.

### 4.2 Critical Paths

- **Token Revelation**: Ensure API tokens are NEVER stored in plain text and are ONLY shown once during generation.
- **Webhook Security**: Always use the configured secret to sign outgoing webhook payloads.

### 4.3 Common Pitfalls

- **Cache Invalidation**: Updating project or agent settings should immediately invalidate any cached configuration used by the running agent.
- **RBAC Enforcement**: Settings pages must strictly enforce `Admin`/`Owner` roles for destructive or sensitive configurations.
