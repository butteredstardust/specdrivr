# Branch Code Review: docs/update-documentation

## Overview
This branch installs a comprehensive library of domain-specific engineering skills and updates agent instructions to ensure cross-agent compatibility.

## Review Findings
- **Modularization**: The skills are properly isolated in `.agents/skills/`, ensuring they don't clutter the main source code while remaining accessible to AI agents.
- **Consistency**: The updates to `CLAUDE.md` and `GEMINI.md` create a unified expertise layer, addressing the user's requirement for cross-tool parity.
- **Accuracy**: The skills correctly reference the project's specific tech stack (React 19, Next.js 16, Drizzle, pxlkit).

## Improvements
- **Standardization**: Future skills added to this directory should follow the same pattern (Frontmatter + Markdown headers).
- **Automation**: Consider a script to auto-generate these `BRANCH_CHANGES.md` tables for larger PRs.

## Verdict
The changes are safe, non-breaking, and significantly improve the agent's capability to maintain high-quality code in this specific project context.
