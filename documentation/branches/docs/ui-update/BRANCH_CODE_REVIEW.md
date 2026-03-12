# Branch Code Review | docs/ui-update

## Reviewer: Senior AI Engineer / Architect

## Overall Assessment
The changes in this branch represent a critical step in standardizing the development workflow for Specdrivr. By aligning `AGENTS.md` and `CLAUDE.md`, we ensure that both human developers and AI agents follow the same premium standards, especially regarding UI consistency and security.

## Detailed Review

### Documentation Consistency
- **Score: 10/10**
- The synchronization between `AGENTS.md` and `CLAUDE.md` is perfect. Concepts like the UI Component Hierarchy and Server Action patterns are explained with appropriate depth in both files.

### Technical Patterns
- **Score: 9/10**
- **UI Hierarchy:** The 3-tier approach (pxlkit -> shadcn -> custom) is brilliant for maintaining visual excellence while allowing flexibility.
- **Security:** The requirement to call `await auth()` first is a top-tier security practice for Next.js applications.
- **Repositories:** Enforcing the repository pattern and the use of `executeQuery` will greatly simplify database management and logging.

### Security and Safety
- **XSS Prevention:** Adding mandatory DOMPurify sanitization for `dangerouslySetInnerHTML` is essential.
- **Middleware:** The new section on middleware constraints correctly identifies common pitfalls in Next.js 16 (e.g., matching static assets).

### Agent-Specific Improvements
- The expanded "Common AI Agent Mistakes" list in `AGENTS.md` is comprehensive and covers many subtle bugs (e.g., `next-env.d.ts` modification, `relations()` scope). This will significantly reduce regression risks.

## Potential Improvements / Suggestions
- **Monitoring File Size:** `AGENTS.md` is comprehensive but should be monitored to stay under the 500-line limit as it grows.
- **Specific Overrides:** Consider adding a template or example of how to document a `pnpm override` in `AGENTS.md` once one is actually implemented.

## Final Recommendation
**Approve.** These changes are well-structured, consistent, and provide the necessary guardrails for the next phase of UI development.
