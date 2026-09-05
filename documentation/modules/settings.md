SPECDRIVR

Master Product Specification — Settings & Administration

---

## 1. Overview

Use this module for profiles, security configuration, notification preferences, integrations, and audit logs.

## 2. User Settings

### 2.1 Profile Settings (`/settings/profile`)

- **Avatar**: Generate it from initials automatically. Do not support custom uploads.
- **Fields**: Display Name is editable. Email is read-only.
- **Logic**: Update the `users` table. Recalculate initials and colors.

### 2.2 Security Settings (`/settings/security`)

- **Password**: Provide current, new, and confirm password fields.
- **Sessions**: Show active browser sessions with **Revoke** and **Revoke all others** actions.
- **API tokens**: Put an anchored section on this route for DAEMON agent `sdk_` tokens.
  - **Generation**: Reveal the full token string one time.
  - **Expiry**: Options for 30, 90 days, 1 year, or Never.

### 2.3 Notification Preferences (`/settings/notifications`)

- **Channels**: Provide Email and In-app toggles.
- **Events**: Include plan generated, approved, rejected, changes requested, session status, and team actions.

## 3. Project Administration

### 3.1 Integrations (`/settings/integrations`)

- **GitHub**: Use an OAuth-based connection. Show the project webhook URL.
- **Slack**: Use an OAuth-based connection. Let users select a channel for DAEMON status updates.
- **Generic Webhooks**: Support POSTing events to any HTTP endpoint. Support optional HMAC signing.
- **Composition**: `integrations-section.tsx` composes provider cards from `src/components/settings/integrations/`: `github-card`, `slack-card`, `webhooks-card`, and `shared`.

### 3.2 Agent Configuration (`/settings/agent`)

- **Execution**:
  - `Max concurrent tasks`: Slider (1-10).
  - `Task execution timeout`: Set the duration before a task is killed.
  - `Max retries`: Set the automatic retry count before blocking.
- **Planning**:
  - `Require plan approval`: Use this global approval-gate toggle.
  - `Auto-generate plan`: Trigger Gemini when saving a specification.
- **Composition**: `agent-config-form.tsx` owns one `FormProvider`. Sections in `src/components/settings/agent-config/` use it with `useFormContext`.

### 3.3 Audit Log (`/settings/audit`)

- **Access**: Restrict access to Admin/Owner.
- **Contents**: Show a searchable, filterable record of administrative actions, such as `PLAN_APPROVED` and `MEMBER_INVITED`.
- **Detail**: Expand each row to show the action's raw JSON payload.

### 3.4 Usage & Cost (`/settings/usage`)

- **Analytics**: Show daily cost charts and token-usage summary cards.
- **Breakdown**: Show cost per specification and spending by model.

## 4. Agent Handbook

### 4.1 Key Files

- **Logic**: `src/actions/settings.ts`.
- **Database**: Use `src/db/schema.ts` for the `webhooks`, `webhookDeliveries`, and `auditLog` tables.
- **UI Components**: Use `src/components/settings/`. Include its `integrations/` and `agent-config/` directories, `webhook-log-section.tsx`, `audit-log-section.tsx`, and `members-section.tsx`.

### 4.2 Critical Paths

- **Token Revelation**: Never store API tokens in plain text. Show them only once during generation.
- **Webhook Security**: Always use the configured secret to sign outgoing webhook payloads.

### 4.3 Common Pitfalls

- **Cache Invalidation**: When updating project or agent settings, immediately invalidate cached configuration used by the running agent.
- **RBAC Enforcement**: Strictly enforce `Admin`/`Owner` roles for destructive or sensitive settings.
