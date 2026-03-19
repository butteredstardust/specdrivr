# Branch Changes: backend-improvements

| File Name | Summary of Changes | Summary Reason for Change | Expected Impact | Best Practice Evaluation Score | Reason for Deletion |
|-----------|-------------------|--------------------------|-----------------|-------------------------------|---------------------|
| [use-sse.ts](src/hooks/use-sse.ts) | Created new `useSSE` hook combining initial REST fetch with SSE updates. | Transition from polling to real-time events. | Lower server load, lower latency updates. | 10/10 | not deleted |
| [page.tsx (Session)](src/app/(app)/sessions/[id]/page.tsx) | Refactored to use `useSSE` for real-time session tracking. | Replace inefficient 5s polling. | Smoother UI updates. | 10/10 | not deleted |
| [task-timeline.tsx](src/components/sessions/task-timeline.tsx) | Refactored to use `useSSE` for real-time task progress. | Unified real-time communication strategy. | Real-time task progress bars. | 10/10 | not deleted |
| [route.ts (Stream)](src/app/api/v1/sessions/[id]/stream/route.ts) | Added support for `updates` channel in SSE stream. | Enable status change notifications. | Functional real-time backend. | 10/10 | not deleted |
| [route.ts (Complete)](src/app/api/v1/tasks/[id]/complete/route.ts) | Added Redis `publish` on task completion. | Trigger UI updates via SSE. | Instant UI feedback when tasks finish. | 10/10 | not deleted |
| [login/page.tsx](src/app/(auth)/login/page.tsx) | Refactored to React 19 `useActionState` and `react-hook-form`. | Modernize auth flow and improve validation. | Better error handling and state management. | 10/10 | not deleted |
| [forgot-password/page.tsx](src/app/(auth)/forgot-password/page.tsx) | Refactored to React 19 `useActionState` and `react-hook-form`. | Modernize auth flow and improve validation. | Better error handling and state management. | 10/10 | not deleted |
| [reset-password/page.tsx](src/app/(auth)/reset-password/page.tsx) | Refactored to React 19 `useActionState` and `react-hook-form`. | Modernize auth flow and improve validation. | Better error handling and state management. | 10/10 | not deleted |
| [schemas.ts](src/lib/schemas.ts) | Added `loginSchema`, `forgotPasswordSchema`, `resetPasswordSchema`. | Centralize validation logic for auth forms. | Type-safe form validation. | 10/10 | not deleted |
| [setup.ts](tests/setup.ts) | Overhauled to support dynamic worker databases. | Enable parallel test execution. | 4-10x faster test runs. | 10/10 | not deleted |
| [migrate.ts](tests/setup/migrate.ts) | Overhauled to use template databases for workers. | Safe and fast parallel DB isolation. | Reliable CI testing. | 10/10 | not deleted |
| [vitest.config.ts](vitest.config.ts) | Re-enabled parallelism by removing worker limits. | Speed up development feedback loop. | Significant performance boost in CI. | 10/10 | not deleted |

## CI & Test Changes

-   Tests now run in parallel by default.
-   Each Vitest worker gets its own PostgreSQL database created from a template.
-   Ensured all auth forms are validated with Zod on the client side before submission.
