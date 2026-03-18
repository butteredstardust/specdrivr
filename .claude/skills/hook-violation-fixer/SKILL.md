---
name: hook-violation-fixer
description: Fix architectural violations caught by pre-push hooks using standardized patterns
---

# Hook Violation Fixer

Structured remediation for all 15 pre-push hook violations in Specdrivr.

## Overview

When `git push` fails, one of these 15 checks triggered. Find your violation below and follow the fix workflow.

---

## 1. Server Actions: Missing `'use server'` Directive

**Hook Check:** `scripts/hooks/checks/server-actions.sh`

**Error Message:** `$file: Missing 'use server' directive.`

### Fix Workflow

```typescript
// ❌ BEFORE
export async function createProjectAction(formData: FormData) {
  const session = await auth();
  // ...
}

// ✓ AFTER
('use server');

export async function createProjectAction(formData: FormData) {
  const session = await auth();
  // ...
}
```

**Checklist:**

- [ ] Add `'use server';` at top of file (before imports)
- [ ] Verify file is in `src/actions/`
- [ ] Re-run `git push` to verify

---

## 2. Server Actions: Missing `await auth()` Call

**Hook Check:** `scripts/hooks/checks/server-actions.sh`

**Error Message:** `$file: Missing 'await auth()' authentication call.`

### Fix Workflow

```typescript
// ❌ BEFORE
'use server';

export async function deleteProjectAction(formData: FormData) {
  const projectId = Number(formData.get('projectId'));
  const project = await projectRepository.getById(projectId);
  // ...
}

// ✓ AFTER
('use server');

import { auth } from '@/lib/auth';

export async function deleteProjectAction(formData: FormData) {
  const session = await auth(); // FIRST ALWAYS
  if (!session?.user?.id) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in' } };
  }

  const projectId = Number(formData.get('projectId'));
  // ... rest of function
}
```

**Checklist:**

- [ ] Import `auth` from `@/lib/auth`
- [ ] Call `await auth()` as FIRST line (before any other await)
- [ ] Check authentication result
- [ ] Return structured error if unauthorized
- [ ] Re-run `git push`

---

## 3. Server Actions: Using `throw` Instead of Structured Errors

**Hook Check:** `scripts/hooks/checks/server-actions.sh`

**Error Message:** `$file: Direct 'throw' detected. Use structured errors instead.`

### Fix Workflow

```typescript
// ❌ BEFORE
'use server';

export async function updateProjectAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const projectId = Number(formData.get('projectId'));
  const project = await projectRepository.getById(projectId);

  if (!project) {
    throw new Error('Project not found');
  }
  // ...
}

// ✓ AFTER
('use server');

import { auth } from '@/lib/auth';

export async function updateProjectAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in' } };
  }

  const projectId = Number(formData.get('projectId'));
  const project = await projectRepository.getById(projectId);

  if (!project) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } };
  }

  try {
    const updated = await projectRepository.update(projectId, {
      /* ... */
    });
    revalidatePath('/dashboard');
    return { success: true, data: updated };
  } catch (error) {
    logger.error('Failed to update project', { error, projectId });
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update project' },
    };
  }
}
```

**Checklist:**

- [ ] Replace all `throw` statements with `return { success: false, error: { ... } }`
- [ ] Use error codes: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `INVALID_INPUT`, `INTERNAL_ERROR`
- [ ] Wrap repository calls in try-catch
- [ ] Log errors with context (userId, resourceId, etc.)
- [ ] Return success response on completion
- [ ] Re-run `git push`

---

## 4. Client Components: Importing Repositories

**Hook Check:** `scripts/hooks/checks/client-repos.sh`

**Error Message:** `Forbidden repository import in Client Component ($file)`

### Fix Workflow

```typescript
// ❌ BEFORE
'use client';

import { useState } from 'react';
import { projectRepository } from '@/repositories/project-repository'; // FORBIDDEN

export function ProjectList() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    projectRepository.getAll().then(setProjects);
  }, []);

  return <div>{projects.map(p => <div key={p.id}>{p.name}</div>)}</div>;
}

// ✓ AFTER (Using Server Action)
'use client';

import { useState } from 'react';
import { getProjectsAction } from '@/actions/projects';

export function ProjectList() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    getProjectsAction().then(result => {
      if (result.success) setProjects(result.data);
    });
  }, []);

  return <div>{projects.map(p => <div key={p.id}>{p.name}</div>)}</div>;
}
```

**OR Convert to Server Component:**

```typescript
// ✓ AFTER (Using Server Component)
// No 'use client' directive

import { projectRepository } from '@/repositories/project-repository'; // OK in server component

export async function ProjectList() {
  const projects = await projectRepository.getAll();

  return <div>{projects.map(p => <div key={p.id}>{p.name}</div>)}</div>;
}
```

**Checklist:**

- [ ] Remove `@/repositories` import from client component
- [ ] Create Server Action in `src/actions/` to fetch data
- [ ] Or convert component to Server Component (remove `'use client'`)
- [ ] Update component to call Server Action or receive props
- [ ] Re-run `git push`

---

## 5. Environment Variables: Direct `process.env` Access

**Hook Check:** `scripts/hooks/checks/env-protection.sh`

**Error Message:** `$file: Direct process.env access detected. Use @/lib/env instead.`

### Fix Workflow

```typescript
// ❌ BEFORE
const isDev = process.env.NODE_ENV === 'development';
const apiUrl = process.env.API_URL;
const secret = process.env.DATABASE_SECRET;

// ✓ AFTER
import { env } from '@/lib/env';

const isDev = env.NODE_ENV === 'development';
const apiUrl = env.API_URL;
// Secrets (DATABASE_SECRET) only in src/lib/env or src/lib/env-script.ts
```

**Where to use `@/lib/env`:**

- Server-side code (API routes, Server Actions)
- Server Components
- Build-time code

**What goes in `@/lib/env.ts`:**

```typescript
// src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  API_URL: z.string().url(),
  DATABASE_URL: z.string(),
  // ... other vars
});

export const env = envSchema.parse(process.env);
```

**For CLIENT-SIDE CODE** (if needed):

```typescript
// ❌ Don't do this
if (process.env.NODE_ENV === 'development') {
  console.log('Debug mode');
}

// ✓ Use clientLogger instead
import { clientLogger } from '@/lib/logger-client';

if (process.env.NODE_ENV === 'development') {
  clientLogger.debug('Debug message');
}
```

**Checklist:**

- [ ] Import `env` from `@/lib/env` (server-only)
- [ ] Replace `process.env.VAR` with `env.VAR`
- [ ] For NODE_ENV checks in client components, use `clientLogger` instead
- [ ] Verify variables are defined in `@/lib/env.ts`
- [ ] Re-run `git push`

---

## 6. XSS: Unsafe `dangerouslySetInnerHTML` Usage

**Hook Check:** `scripts/hooks/checks/xss.sh`

**Error Message:** `Potentially unsafe dangerouslySetInnerHTML usage`

### Fix Workflow

```typescript
// ❌ BEFORE
'use client';

export function TerminalLog({ htmlLog }: { htmlLog: string }) {
  return <div dangerouslySetInnerHTML={{ __html: htmlLog }} />;
}

// ✓ AFTER
'use client';

import DOMPurify from 'isomorphic-dompurify';

export function TerminalLog({ htmlLog }: { htmlLog: string }) {
  return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlLog) }} />;
}
```

**Checklist:**

- [ ] Import `DOMPurify` from `isomorphic-dompurify`
- [ ] Wrap HTML content with `DOMPurify.sanitize(content)`
- [ ] ALWAYS sanitize user-provided HTML
- [ ] Re-run `git push`

---

## 7. Images: Unoptimized `<img>` Tags

**Hook Check:** `scripts/hooks/checks/images.sh`

**Error Message:** `Unoptimized <img> tag detected. Use next/image instead.`

### Fix Workflow

```typescript
// ❌ BEFORE
'use client';

export function Avatar({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} width={40} height={40} />;
}

// ✓ AFTER
'use client';

import Image from 'next/image';

export function Avatar({ src, alt }: { src: string; alt: string }) {
  return <Image src={src} alt={alt} width={40} height={40} />;
}
```

**Checklist:**

- [ ] Import `Image` from `next/image`
- [ ] Replace `<img>` with `<Image />`
- [ ] Provide explicit `width` and `height` (or use `fill` with parent position:relative)
- [ ] Test image loads correctly
- [ ] Re-run `git push`

---

## 8. Forms: Missing React Hook Form or Zod

**Hook Check:** `scripts/hooks/checks/forms.sh`

**Error Message:** `Incomplete form validation in $file`

### Fix Workflow

```typescript
// ❌ BEFORE
'use client';

import { useState } from 'react';

export function CreateProjectForm() {
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrors(['Name is required']);
      return;
    }
    // ... submit
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      {errors.map(err => <span key={err}>{err}</span>)}
    </form>
  );
}

// ✓ AFTER
'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
});

type CreateProjectInput = z.infer<typeof createProjectSchema>;

export function CreateProjectForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
  });

  const onSubmit = async (data: CreateProjectInput) => {
    const result = await createProjectAction(data);
    if (!result.success) {
      // Handle error
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      <button type="submit">Create</button>
    </form>
  );
}
```

**Checklist:**

- [ ] Import `useForm` from `react-hook-form`
- [ ] Define Zod schema
- [ ] Use `zodResolver(schema)` in useForm options
- [ ] Register inputs with `{...register('fieldName')}`
- [ ] Display validation errors
- [ ] Re-run `git push`

---

## 9. Colors: Hardcoded Hex Values

**Hook Check:** `scripts/hooks/checks/colors.sh`

**Error Message:** `Hardcoded hex color detected. Use design tokens instead.`

### Fix Workflow

```css
/* ❌ BEFORE */
.button {
  background-color: #22d3ee;
  color: #ffffff;
  border: 1px solid #e5e7eb;
}

/* ✓ AFTER */
.button {
  background-color: var(--accent-cyan);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}
```

**Available Design Tokens** (from `src/app/globals.css`):

- `--brand-primary`
- `--accent-violet`
- `--text-primary`, `--text-secondary`
- `--bg-base`, `--bg-surface`, `--bg-elevated`
- `--border-default`
- `--status-done`, `--status-failed`, `--status-blocked`

Or using Tailwind:

```typescript
// ❌ BEFORE
<button className="bg-[#22d3ee] text-[#ffffff]">Click</button>

// ✓ AFTER
<button className="bg-[--accent-cyan] text-[--text-primary]">Click</button>
```

**Checklist:**

- [ ] Replace all hex values with CSS variable equivalents
- [ ] Use `var(--token-name)` syntax
- [ ] Check `src/app/globals.css` for available tokens
- [ ] Re-run `git push`

---

## 10-15. Other Checks

For violations in these categories, refer to:

| Check           | File                                  | Reference                                            |
| --------------- | ------------------------------------- | ---------------------------------------------------- |
| **Artifacts**   | `scripts/hooks/checks/artifacts.sh`   | Don't commit `*.exp`, `*_output.txt`, `migrate-*.ts` |
| **Secrets**     | `scripts/hooks/checks/secrets.sh`     | AGENTS.md §10 - Never commit secrets in code         |
| **Large Files** | `scripts/hooks/checks/large-files.sh` | Keep files <5MB; use Git LFS for media               |
| **Migrations**  | `scripts/hooks/checks/migrations.sh`  | Use `create-migration` skill workflow                |
| **Conflicts**   | `scripts/hooks/checks/conflicts.sh`   | Resolve merge conflicts before push                  |

---

## General Workflow

1. **Read the error message** — identify which violation triggered
2. **Find the corresponding section** above
3. **Apply the fix** using the before/after examples
4. **Stage changes:** `git add .`
5. **Commit:** `git commit -m "fix: [description]"`
6. **Re-push:** `git push`
7. **Troubleshoot:** If still failing, run hook manually:
   ```bash
   bash scripts/hooks/checks/[check-name].sh
   ```

## Need Help?

- **Architectural questions:** See `AGENTS.md` §4–14
- **Type safety:** See `CLAUDE.md` Section 1 (Architectural Mandates)
- **Database changes:** Use the `create-migration` skill
- **Server Actions pattern:** See `AGENTS.md` §9 (Server Actions Pattern)

---

**The hooks are your friend.** They prevent regressions and keep the codebase cohesive. Fix violations promptly and push again.
