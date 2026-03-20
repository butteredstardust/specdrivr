---
name: new-component
description: Scaffold a new component following shadcn/ui and project patterns
disable-model-invocation: true
---

# New Component Scaffold

Create a new component following shadcn/ui patterns and project conventions.

## Usage

```
/new-component ProjectCard
/new-component TaskStatusBadge
```

## Workflow

1. **Determine component type:**
   - **Server Component** (default) — no interactivity needed
   - **Client Component** — needs hooks, event handlers, or browser APIs
2. **Check if shadcn/ui has an equivalent** — use it instead of custom
3. **Create the component file** in appropriate location
4. **Add barrel export** if directory uses index files

## File Location

| Type                | Location                                       |
| ------------------- | ---------------------------------------------- |
| Shared UI primitive | `src/components/ui/[name].tsx`                 |
| Feature component   | `src/components/[feature]/[name].tsx`          |
| Page-specific       | `src/app/(app)/[route]/_components/[name].tsx` |

## Server Component Template

```tsx
import { cn } from '@/lib/utils';

interface [Name]Props {
  className?: string;
  // ... props
}

export function [Name]({ className, ...props }: [Name]Props) {
  return (
    <div className={cn('', className)}>
      {/* content */}
    </div>
  );
}
```

## Client Component Template

```tsx
'use client';

import { cn } from '@/lib/utils';

interface [Name]Props {
  className?: string;
  // ... props
}

export function [Name]({ className, ...props }: [Name]Props) {
  return (
    <div className={cn('', className)}>
      {/* content */}
    </div>
  );
}
```

## Rules

- **Default to Server Component** — only add `'use client'` when needed
- **Use shadcn/ui** components as building blocks (Button, Card, Dialog, etc.)
- **Use CSS variables** for colors — never hardcode hex values
- **Use `cn()` from `@/lib/utils`** for conditional classes
- **Use `lucide-react`** for icons — no custom SVGs
- **Props interface** — always define with TypeScript interface
- **No `useEffect` for data fetching** — fetch in Server Components
- **Composition pattern** — use children/slots, not content props
- **Export named** — no default exports for components

## Composition Example

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProjectCardProps {
  project: Project;
  className?: string;
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle>{project.name}</CardTitle>
        <Badge variant="secondary">{project.status}</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-[var(--text-secondary)]">{project.description}</p>
      </CardContent>
    </Card>
  );
}
```
