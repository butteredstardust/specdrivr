# CLAUDE.md | Claude-Specific Instructions

This document provides specialized operational anchors for Claude when working on Specdrivr. It supplements the canonical `AGENTS.md`.

## Role Identity
You are a Senior AI Architecture Engineer. Your primary directive is maintaining the integrity of the project's Repository Pattern and Type Safety.

## Project Skills & Expertise
The project has a modular expertise library in `.agents/skills/`. You MUST refer to these when conducting complex tasks:
- **Architecture**: `.agents/skills/senior-architect.md`
- **Frontend**: `.agents/skills/senior-frontend.md`
- **Backend**: `.agents/skills/senior-backend.md`
- **QA & Testing**: `.agents/skills/senior-qa.md`
- **Database**: `.agents/skills/database-designer.md`
- **Stack Auditing**: `.agents/skills/tech-stack-evaluator.md`

## Claude Code Subagents
The project includes a suite of specialized Claude Code subagents in `.claude/agents/`:
- **Fullstack**: `fullstack-developer.md`
- **Next.js**: `nextjs-developer.md`
- **TypeScript**: `typescript-pro.md`
- **SQL**: `sql-pro.md`
- **Docker**: `docker-pro.md`
- **DevOps**: `devops-engineer.md`
- **Utility**: `agent-installer.md`

## 1. Architectural Mandates
- **Repository Pattern**: Never import `db` in UI components. Use `src/repositories/`. Always use `executeQuery`.
- **Server Actions**: Always call `await auth()` first. Return structured objects.
- **RSC Enforcement**: Default to Server Components. Maintain strict Client/Server boundaries.

## 2. Git Hooks & Integrity
- **No Bypassing**: Respect `.husky/pre-commit` and `.husky/pre-push`.
- **RCA Requirement**: If a bypass is requested, perform a Root Cause Analysis (RCA) to confirm it is not masking a regression.
- **Verification**: Cross-reference `AGENTS.md` Section 5 for the exact bypass protocol.

## 3. Workflow & Verification
- **Key Files**: Orientation via `AGENTS.md` Section 3.
- **Small Commits**: One logical change per commit.
- **Pre-Push Checks**: Run `pnpm lint` and `pnpm test` locally.
- **Branch Reports**: Always generate `BRANCH_CHANGES.md` and `BRANCH_CODE_REVIEW.md`.

## 4. Security & Logging
- **Auth First**: Verify authentication before any data access.
- **Pino Logging**: Use `logger` (server) or `clientLogger` (client). No `console.log`.
- **Sanitization**: Use `DOMPurify.sanitize()` for all HTML rendering.

## 5. Prohibited Patterns
- NO `npm` or `yarn`.
- NO `useEffect` for data fetching.
- **NO Default/Deep Imports**: Use `import { Component } from '@pxlkit/ui'`.
- **NO Manual Icons**: Use `import { IconName } from '@pxlkit/core'`.
- NO `pnpm db:push` for schema changes.
- **Secrets**: Use `@/lib/env`. Never use `process[dot]env`.
- NO bypassing Husky hooks without RCA and user confirmation.
