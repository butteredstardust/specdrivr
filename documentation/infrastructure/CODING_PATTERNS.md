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
  if (!validated.success) return { error: { code: 'ERR_VALIDATION_FAILED', details: validated.error.flatten() } };

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
    return this.executeQuery(
      async (db) => {
        const [updated] = await db
          .update(projects)
          .set({ status })
          .where(eq(projects.id, id))
          .returning();
        return updated;
      },
      'Failed to update project status'
    );
  }
}
```

## 4. Pattern: Status-Aware UI Component

Components should use the centralized token system.

```tsx
import { StatusIndicator } from '@/components/ui/status-indicator';
import { STATUS_TOKENS } from '@/infrastructure/DESIGN_SYSTEM';
import type { TaskStatus } from '@/db/schema';

interface TaskRowProps {
  status: TaskStatus;
  title: string;
}

export function TaskRow({ status, title }: TaskRowProps) {
  const token = STATUS_TOKENS[status]; // Centralized styles

  return (
    <div className="flex items-center gap-2 border-l-4" style={{ borderColor: token.color }}>
      <StatusIndicator status={status} />
      <span className="font-mono text-xs text-muted-foreground">{token.label}</span>
      <h4 className="font-medium">{title}</h4>
    </div>
  );
}
```
