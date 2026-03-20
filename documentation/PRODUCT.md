**SPECDRIVR**

Master Product Specification

Version 1.0 · Confidential

_Spec-driven autonomous code execution for engineering teams_

---

[Status: GROUND TRUTH]

# **1\. Executive Summary**

Specdrivr is a spec-driven autonomous coding platform that enables engineering teams to write plain-English specifications in Markdown and have an AI agent - DAEMON - translate those specs into a structured execution plan, receive human approval, then autonomously execute and commit code changes against a target repository.

The core value proposition is accountability and control: DAEMON never executes code without explicit human approval of the generated plan. Every architectural decision is surfaced and reviewable. Every file change is diffed and attributed to the task that produced it. Humans remain the final authority; DAEMON is a force multiplier.

Specdrivr is a production-grade, multi-user, multi-project SaaS application targeting professional software engineering teams. It is not a prototype or internal tool. Every design, data, and API decision in this document reflects production requirements.

| **Metric**       | **Target**                                                |
| ---------------- | --------------------------------------------------------- |
| Target users     | Software engineers, technical leads, engineering managers |
| Team size        | 2-50 engineers per organisation                           |
| Concurrency      | Up to 10 simultaneous agent tasks per project             |
| Availability     | 99.9% uptime (three-nines SLA)                            |
| Data retention   | 90 days of session and event logs (configurable)          |
| Deployment model | Cloud SaaS; self-hosted Docker option on roadmap          |

# **2\. Product Vision & Goals**

## **2.1 Vision Statement**

Software specifications should be executable. The gap between "what we want to build" and "working code in the repository" should be occupied by a tireless, auditable, human-supervised agent - not by weeks of translation overhead between requirements documents and pull requests.

## **2.2 Core Principles**

- **Human approval is non-negotiable. DAEMON never executes against a repository without a human reviewing and approving the generated plan. This is a hard constraint, not a toggleable preference.**
- **Every action is observable. Every task attempt, log line, file change, and architectural decision is stored, attributed, and accessible. Nothing happens in a black box.**
- **Complexity is progressive. Default views are clean and simple. Power-user depth - raw IDs, JSON inspection, timing data - is one keystroke away, not buried in settings.**
- **Trust through precision. The application speaks plainly and precisely. No marketing copy in the UI. Status indicators use exact counts and identifiers, not vague "processing…" states.**
- **Keyboard-first. Every primary action has a keyboard shortcut. Mouse interaction is never required for any core workflow.**

## **2.3 What Specdrivr Is Not**

- Not a code review tool. Specdrivr generates and executes. Code review happens in your existing Git workflow after DAEMON creates branches and commits.
- Not a CI/CD pipeline. It does not run tests, deploy, or monitor production. It writes code; your pipeline takes over.
- Not a requirements management system. Specifications are Markdown files, not tickets. There is no backlog, no sprint, no velocity.
- Not an autonomous system. DAEMON operates with exactly the permissions a human grants it, in exactly the scope defined by an approved plan, nothing more.

# **3\. User Personas**

## **3.1 Alex - Technical Lead (Primary Persona)**

| **Attribute**   | **Detail**                                                                                                                                |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Role            | Engineering Manager / Technical Lead                                                                                                      |
| Goals           | Accelerate delivery of well-scoped features; maintain architectural standards; free the team from boilerplate work                        |
| Pain points     | Repetitive implementation tasks consume senior engineer time; spec-to-code translation is error-prone; hard to audit what changed and why |
| Specdrivr usage | Writes specifications; reviews and approves plans; monitors sessions; unblocks stalled tasks; reviews file changes before merging         |
| RBAC role       | Admin or Owner                                                                                                                            |
| Technical level | High - comfortable with terminals, diffs, monorepos, and Drizzle schema files                                                             |
| Key flows used  | Write spec → Generate plan → Approve → Monitor → Unblock → Review changes                                                                 |

## **3.2 Sam - Senior Engineer (Contributor Persona)**

| **Attribute**   | **Detail**                                                                                                               |
| --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Role            | Senior Software Engineer                                                                                                 |
| Goals           | Offload boilerplate implementation to DAEMON; focus on architecture and review; stay unblocked                           |
| Pain points     | Waiting for approval gates; context-switching to unblock DAEMON mid-task; unclear why DAEMON chose a particular approach |
| Specdrivr usage | Creates specifications; views plans; monitors task execution; provides blocking context; reviews output                  |
| RBAC role       | Member                                                                                                                   |
| Technical level | High - reads diffs fluently; understands dependency graphs                                                               |
| Key flows used  | Write spec → view plan (cannot approve) → request approval → monitor → unblock tasks                                     |

## **3.3 Jordan - Engineering Manager (Observer Persona)**

| **Attribute**   | **Detail**                                                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Role            | Engineering Manager (non-coding)                                                                                           |
| Goals           | Visibility into what the team is building and how fast; understanding of DAEMON's contribution; audit trail for compliance |
| Pain points     | No visibility into autonomous agent output; unclear attribution; cannot tell what is "DAEMON's work" vs engineer's work    |
| Specdrivr usage | Views specs, sessions, and activity logs; reads but does not create; tracks team output                                    |
| RBAC role       | Viewer                                                                                                                     |
| Technical level | Low - reads summaries; does not review diffs                                                                               |
| Key flows used  | Dashboard / Mission Control → Sessions → Spec Activity                                                                     |

# **14\. Onboarding**

Triggered after invite acceptance or first login when `onboarding_step` in the database is less than 3. A centered modal dialog (`Dialog`) is used.

| **Step** | **Title**                 | **Content**                                                                                               |
| -------- | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1 / 3    | Welcome                   | DAEMON idle (64px) + "Welcome to Specdrivr, {Name}!" + [Get Started]                                      |
| 2 / 3    | Set your display name     | Input field for display name. Updates `users.name` via `PATCH /api/v1/users/me`.                          |
| 3 / 3    | Create your first project | Input field for project name. Creates project via `POST /api/v1/projects` and sets `onboarding_step = 3`. |

`onboarding_step` is set to 3 on completion. Never shown again. The modal cannot be dismissed by clicking outside or pressing Escape.

# **16\. Error States & Edge Cases** [Status: Verified Specification / Implementation Pending]

## **16.1 Spec Name Collision**

If a user saves a spec with the same name as an existing spec in the project, the server returns HTTP 409 CONFLICT. The editor shows an inline error below the name field with a generated suggestion chip (clicking fills the name field).

## **16.2 Session Auto-Recovery**

If lastHeartbeatAt is > 60 seconds old on a session with status = running, Mission Control and Spec Detail show a yellow banner: "Session SES-0091 may have lost connection. Last heartbeat N minutes ago." with \[Check Status\] and \[Abandon Session\] buttons. \[Check Status\] pings the session health endpoint; if dead, marks session failed. After 5 minutes without heartbeat, the server auto-marks the session failed and sends notifications.

## **16.3 Concurrent Edit Warning**

If two users open the same Spec Editor simultaneously, each sees an amber banner: "\[Name\] is currently editing this spec." On save with a stale currentVersionId, the server returns HTTP 409 with options to \[View their changes\] or \[Save anyway as a new version\].

## **16.4 Task Dependency Violation**

If a user manually marks a task done when its dependencies are not yet done, the server returns HTTP 422. An AlertDialog presents the dependency conflict and offers \[Force Mark Done\] which sets forcedDone: true on the task record.

## **16.5 Plan Generation Timeout**

If plan generation takes > 30 seconds: the PLAN tab updates subtext to "Still working... complex specs take a moment." After 2 minutes with no response: DAEMON error + "Plan generation is taking longer than expected." + \[Check again\] (re-polls) + \[Cancel generation\] link.

## **16.6 Permission-Gated Actions**

Actions unavailable to the current user's role are never hidden from the DOM - they are always visible in a disabled state with a Tooltip naming the required role and, where applicable, a secondary \[Request Approval\] button visible to Members that sends a notification to all Admins.

## **16.7 Session Limit Warning**

If maxConcurrentTasks = 1 and a task is already running, clicking \[RE-RUN\] in the Task Drawer shows an inline note: "Max concurrent tasks (1) reached. This task will queue and start when the current task completes." with \[Queue Anyway\] and \[Cancel\] options.

## **16.8 404 / Unmatched Routes**

DAEMON error expression (large, centred) + "404 - Not found." + "This page doesn't exist or you don't have access." + \[Go to Mission Control\] link.

# **20\. Empty States & Microcopy Reference**

| **Context**                  | **DAEMON** | **Heading**           | **Subtext**                                                              | **CTA**                      |
| ---------------------------- | ---------- | --------------------- | ------------------------------------------------------------------------ | ---------------------------- |
| /projects (no projects)      | idle       | No projects yet.      | Point me at a repository and I'll get to work.                           | \[Initialize First Project\] |
| /specs (no specs)            | idle       | No specifications.    | Write what you want to build. I'll figure out the how.                   | \[Write First Spec\]         |
| PLAN tab (no plan)           | idle       | No plan generated.    | Run me on this spec and I'll produce an architecture and execution plan. | \[Generate Plan\]            |
| PLAN tab (rejected)          | error      | Plan rejected.        | {Reviewer} rejected this plan. Edit the spec or generate a new one.      | \[Generate New Plan\]        |
| TASKS tab (no approved plan) | idle       | No tasks yet.         | Tasks are created when a plan is approved.                               | \[Go to Plan →\]             |
| CHANGES tab (no changes)     | idle       | No file changes.      | Changes will appear here once DAEMON starts executing tasks.             | \[View Tasks →\]             |
| ACTIVITY tab (no sessions)   | idle       | No sessions yet.      | Approve a plan to start the first execution session.                     | \[Go to Plan →\]             |
| Task Drawer CHANGES (none)   | idle       | No changes yet.       | DAEMON hasn't modified any files for this task.                          | none                         |
| /sessions (empty)            | idle       | No sessions recorded. | Sessions appear here once execution begins.                              | none                         |
| /notifications (empty)       | idle       | All caught up.        | Nothing to report.                                                       | none                         |
| Audit log (empty)            | idle       | No audit entries.     | Administrative actions will be logged here.                              | none                         |
| Team (no members)            | idle       | Just you.             | Invite your team to collaborate on specs and review plans.               | \[Invite Someone\]           |
| 404                          | error      | 404 - Not found.      | This page doesn't exist or you don't have access.                        | \[Go to Mission Control\]    |
| Mission Control (idle)       | idle       | SYSTEM READY          | No active session. Open a spec to begin.                                 | link to /specs               |

## Development Gaps & Technical Debt

- **As-Built vs Specified:** The original specification (like API envelope strictness and some webhook flows) has been adapted during implementation (e.g., using `better-auth` for auth, simpler Drizzle schema mappings) leaving a few feature gaps mostly in the UI (app shell, detailed spec editors) and integrations (GitHub, Slack).
