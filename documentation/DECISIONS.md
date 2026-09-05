# Architecture Decisions

This file contains the repository architecture decision log. Append new decisions here.

## 2026-09-04 — D1: Use the Linear-clean design

| Decision | Rationale |
| --- | --- |
| Commit to Linear-clean. Retire the CRT and retro layer. | User directive. This resolves the conflict between `AGENTS.md` section 5 and the shipped scanline, phosphor, and mascot layer. |

**Recorded dissent:** The catalog agent said the retro-terminal identity differentiates the product. The user directive overrides this position. Revisit this decision only through a deliberate reversal.

## 2026-09-04 — D2: Use one token vocabulary

| Decision | Rationale |
| --- | --- |
| Keep Specdrivr semantic tokens. Remove the shadcn HSL token set. | `AGENTS.md` section 5 bans `bg-background`, `text-foreground`, and `bg-destructive`. Both token sets were live in `@theme inline`, so the ban could not be enforced. |

## 2026-09-04 — D3: Use Radix primitives

| Decision | Rationale |
| --- | --- |
| Use Radix as the primitive foundation. Remove `@base-ui/react`. | The audit found no `@base-ui` imports in `src`. `knip.json` suppressed the dependency through `ignoreDependencies`. The dependency was not an active dual stack. |
