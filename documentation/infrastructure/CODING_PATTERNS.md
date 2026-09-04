**SPECDRIVR**

Master Product Specification — One-Shot Coding Patterns

[Status: GROUND TRUTH]

---

## 1. Overview

To ensure "One-Shot" success, AI agents must follow these exact templates. These patterns enforce the project's security, error handling, and architectural standards.

## 2. Pattern: Standard Server Action

All mutations MUST follow this pattern.

```typescript
'use server';

import { auth } from '@/lib/auth';
import { checkPermission, PERMISSIONS } from '@/lib/rbac';
import { projectRepository } from '@/repositories';
import { actionSchema } from '@/lib/schemas';
import { ERR_AUTH_UNAUTHORIZED, ERR_RBAC_FORBIDDEN } from '@/infrastructure/ERROR_REGISTRY';

export async function myAction(rawData: unknown) {
  // 1. Authenticate
  const session = await auth();
  if (!session) return { error: { code: 'ERR_AUTH_UNAUTHORIZED', message: 'Unauthorized' } };

  // 2. Validate Input
  const validated = actionSchema.safeParse(rawData);
  if (!validated.success)
    return { error: { code: 'ERR_VALIDATION_FAILED', details: validated.error.flatten() } };

  // 3. Check Permissions
  const { projectId, ...data } = validated.data;
  if (!(await checkPermission(session.user.id, projectId, PERMISSIONS.MY_ACTION))) {
    return { error: { code: 'ERR_RBAC_FORBIDDEN', message: 'Forbidden' } };
  }

  try {
    // 4. Execute Logic via Repository
    const result = await projectRepository.performAction(projectId, data);
    return { data: result };
  } catch (error) {
    // 5. Return Standard Error
    return { error: { code: 'ERR_INTERNAL_ERROR', message: 'Action failed' } };
  }
}
```

## 3. Pattern: Repository Method

Repositories MUST extend `BaseRepository` and wrap operations in `executeQuery`.

```typescript
import { BaseRepository } from './base-repository';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

export class MyRepository extends BaseRepository {
  async updateStatus(id: number, status: string) {
    return this.executeQuery(async (db) => {
      const [updated] = await db
        .update(projects)
        .set({ status })
        .where(eq(projects.id, id))
        .returning();
      return updated;
    }, 'Failed to update project status');
  }
}
```

## 4. Pattern: Status-Aware UI

Use the centralized semantic map in `src/lib/ui-status.ts`; do not duplicate labels, badge
variants, or colours in feature components. Status text is sentence-cased and uses the sans face.

```tsx
import { Badge } from '@/components/ui/badge';
import { TASK_STATUS } from '@/lib/ui-status';
import type { TaskStatus } from '@/db/schema';

export function TaskState({ status }: { status: TaskStatus }) {
  const display = TASK_STATUS[status];
  return <Badge variant={display.variant}>{display.label}</Badge>;
}
```

## 5. Pattern: Large Form Context

When a form is decomposed into several section components, create the form once and wrap the
sections in `FormProvider`. Sections call `useFormContext<FormValues>()`; do not pass `register`,
`control`, `errors`, and `watch` through every layer. `src/components/settings/agent-config-form.tsx`
and `src/components/settings/agent-config/` are the reference implementation.

```tsx
const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues });

return (
  <FormProvider {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <PlanningSection />
      <LimitsSection />
    </form>
  </FormProvider>
);
```

```tsx
function PlanningSection() {
  const { register, formState: { errors } } = useFormContext<FormValues>();
  // Render only this section's fields.
}
```

## 6. Pattern: Explained Permission Gate

Use `GatedButton` when an action is visible but unavailable because of role or lifecycle state.
It keeps the disabled native button and puts the explanation on a focusable tooltip trigger. The
component must be under `TooltipProvider`.

```tsx
<GatedButton allowed={canApprove} reason="Requires Admin or Owner role" onClick={approve}>
  Approve plan
</GatedButton>
```

Do not duplicate enabled and disabled button branches or attach a tooltip directly to a disabled
button; disabled controls do not emit pointer events.

## 7. Pattern: Lifecycle Router

For a feature whose layout changes by lifecycle state, keep the route component small and route to
state-specific renderers. `src/components/specs/plan-tab.tsx` chooses loading, generation,
failure, empty, and review surfaces; `src/components/specs/plan/plan-review.tsx` owns only the review
state. This keeps polling and actions out of markup branches and avoids one monolithic component.

```tsx
if (job?.status === 'pending' || job?.status === 'running') return <GeneratingState job={job} />;
if (job?.status === 'failed') return <GenerationFailedState job={job} />;
if (isLoading) return <LoadingState />;
if (!plan) return <EmptyPlanState />;
return <PlanReview plan={plan} actions={actions} />;
```

## 8. Pattern: Cohesive Fetch/Mutation Hook

When a surface owns a resource fetch plus multiple mutations of that resource, move the whole
operation set into one hook. The hook owns resource state, loading/error state, a shared busy flag,
logging, toasts, refresh/refetch behavior, and authenticated fetch options. Mutations use one local
`act` helper so success/failure behavior cannot drift. See `src/components/specs/plan/use-plan.ts`
and `src/components/tasks/use-task-actions.ts`.

```tsx
const act = useCallback(async (path: string, init: RequestInit, messages: Messages) => {
  setIsActioning(true);
  try {
    const response = await fetch(path, { credentials: 'include', ...init });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    toast.success(messages.success);
    return true;
  } catch (error) {
    clientLogger.error(messages.failure, error);
    toast.error(messages.failure);
    return false;
  } finally {
    setIsActioning(false);
  }
}, []);
```
