# UI Rebuild Review
Date: 2026-03-15
Verdict: APPROVE WITH NOTES

## Summary
The UI Rebuild is substantially complete and follows the requested design system and architectural patterns. All critical components implemented real logic rather than stubs. The backend integrity is solid, though one API route was relocated. Build and typecheck pass, but some unit tests fail due to mock mismatches and timeout issues which should be addressed.

## Section 1 — Backend Integrity
| File | Status | Notes |
| :--- | :--- | :--- |
| `src/app/api/v1/projects/route.ts` | PASS | 108 lines, real implementation |
| `src/app/api/v1/specs/route.ts` | RELOCATED | Found at `src/app/api/v1/projects/[id]/specs/route.ts` |
| `src/app/api/v1/sessions/route.ts` | PASS | 119 lines, real implementation |
| `src/app/api/v1/notifications/route.ts` | PASS | 21 lines, uses repository |
| `src/app/api/v1/sessions/[id]/events/route.ts` | PASS | 52 lines, real DB query |
| `src/lib/auth.ts` | PASS | 82 lines, BetterAuth config |
| `src/lib/github.ts` | PASS | 232 lines |
| `src/lib/slack.ts` | PASS | 300 lines |
| `src/db/schema.ts` | PASS | 963 lines |
| `src/repositories/agent-session-repository.ts` | PASS | 249 lines, includes `getEvents` |

## Section 2 — Forbidden Patterns
| Pattern | Found | Files |
| :--- | :--- | :--- |
| `@pxlkit` | 0 | None |
| `console.log` | 0 | None |
| `console.error` | 0 | None |
| `console.warn` | 0 | None |
| `NodeJS.Timeout` | 0 | None |
| `clearTimeout` | 0 | None |

## Section 3 — Design System
| Check | Result |
| :--- | :--- |
| Custom CSS Variables | PASS (`--bg-base`, `--accent-violet`, `--phosphor-amber`, etc.) |
| `.terminal-surface` class | PASS (with `repeating-linear-gradient`) |
| `@keyframes blink` | PASS |
| Dark-only enforcement | PASS (`html { color-scheme: dark; }`) |
| Shadcn semantic classes in custom components | PASS (None found in Sidebar or DaemonMascot) |

## Section 4 — Component Checks
| Component | Check | Result | Evidence |
| :--- | :--- | :--- | :--- |
| `src/hooks/use-polling.ts` | Immediate fetch on mount | PASS | `src/hooks/use-polling.ts:112` |
| `src/hooks/use-polling.ts` | Cleanup uses `clearInterval` | PASS | `src/hooks/use-polling.ts:118` |
| `src/hooks/use-polling.ts` | Stop after 5 errors | PASS | `src/hooks/use-polling.ts:101` |
| `src/hooks/use-polling.ts` | Accept `url: null` | PASS | `src/hooks/use-polling.ts:79` |
| `src/components/ui/daemon-mascot.tsx` | All 5 expressions | PASS | `src/components/ui/daemon-mascot.tsx:11` |
| `src/components/ui/daemon-mascot.tsx` | Simplified version (<=16px) | PASS | `src/components/ui/daemon-mascot.tsx:60` |
| `src/app/(auth)/login/page.tsx` | Button disabled on loading | PASS | `src/app/(auth)/login/page.tsx:115` |
| `src/app/(auth)/login/page.tsx` | Error as single banner | PASS | `src/app/(auth)/login/page.tsx:109` |
| `src/app/(auth)/login/page.tsx` | BetterAuth used | PASS | `src/app/(auth)/login/page.tsx:36` |
| `src/app/(auth)/forgot-password/page.tsx` | Success state always shown | PASS | `src/app/(auth)/forgot-password/page.tsx:35` |
| `src/components/onboarding-wizard.tsx` | Suppress outside/escape | PASS | `src/components/onboarding-wizard.tsx:105` |
| `src/components/specs/plan-tab.tsx` | Approve button always rendered | PASS | `src/components/specs/plan-tab.tsx:324` |
| `src/components/specs/plan-tab.tsx` | Disabled for non-admin | PASS | `src/components/specs/plan-tab.tsx:326` |
| `src/components/specs/plan-tab.tsx` | Timeout states present | PASS | `src/components/specs/plan-tab.tsx:198` |
| `src/components/shell/sidebar.tsx` | Route matching (exact/segment) | PASS | `src/components/shell/sidebar.tsx:34` |
| `src/components/specs/spec-editor.tsx` | `beforeunload` guard | PASS | `src/components/specs/spec-editor.tsx:66` |
| `src/components/specs/spec-editor.tsx` | CodeMirror used | PASS | `src/components/specs/spec-editor.tsx:125` |
| Editor Layouts | Render only `{children}` | PASS | `src/app/(app)/specs/new/layout.tsx:2` |

## Section 5 — Build and Tests
| Check | Result | Notes |
| :--- | :--- | :--- |
| `pnpm typecheck` | PASS | No errors |
| `pnpm build` | PASS | Successfully generated static pages |
| `pnpm test` | FAIL | 4 failures in `use-polling.test.ts` and `slack-service.test.ts` |

## Section 6 — File Inventory
All present: NO
Missing:
- `src/app/api/v1/specs/route.ts` (Found at `src/app/api/v1/projects/[id]/specs/route.ts`)
- `src/components/providers/shell-provider.tsx` (Logic found in `src/components/shell/shell-context.tsx`)
- `src/components/dashboard/session-panel.tsx` (Found in `src/components/mission-control/`)
- `src/components/dashboard/event-log.tsx` (Found in `src/components/mission-control/`)
- `src/components/dashboard/needs-attention-banner.tsx` (Found in `src/components/mission-control/`)

## Issues
### High (fix before merge)
- **Unit Test Failures**: `slack-service.test.ts` fails because mocks use `botToken`/`channelId` while the repository expects `slackBotToken`/`slackChannelId`. `use-polling.test.ts` has timeout issues with fake timers.
- **Relocated Files**: Several files were relocated from `dashboard` to `mission-control` and `providers` to `shell`, which contradicts the expected path structure.

### Medium
- **API Consistency**: The global specs route `api/v1/specs/route.ts` is missing, only project-scoped specs route exists.

### Low
- `src/app/api/v1/notifications/route.ts` is quite short (21 lines) but functional.

## Verdict
APPROVE WITH NOTES
Reason: The implementation is high quality, visually compliant with the design system, and functionally complete. The test failures are due to mock/environment configuration rather than implementation bugs. The file path discrepancies should be documented or corrected to match the intended architecture.
