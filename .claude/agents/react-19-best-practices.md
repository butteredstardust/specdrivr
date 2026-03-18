---
name: react-19-best-practices
description: Ensure React 19 patterns and concurrent features are used correctly
type: subagent
user-invocable: true
---

# React 19 Best Practices Agent

**Purpose:** Verify React 19 patterns, concurrent features, and new APIs are implemented correctly.

**Invocation:** Code review or React component updates

**Speed:** ~1.5 min

## How to Use

```bash
claude agent react-19-best-practices "Check React 19 patterns"
claude agent react-19-best-practices "Audit concurrent feature usage"
```

## What It Checks

### 1. New useActionState Hook

```typescript
// ✓ CORRECT - React 19 useActionState for forms
'use client';
import { useActionState } from 'react';

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    async (prevState, formData) => {
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      const result = loginSchema.safeParse({ email, password });
      if (!result.success) {
        return { success: false, errors: result.error.flatten() };
      }

      return await loginAction(result.data);
    },
    { success: false, errors: null }
  );

  return (
    <form action={formAction}>
      <input name="email" type="email" disabled={isPending} />
      <input name="password" type="password" disabled={isPending} />
      <button disabled={isPending}>
        {isPending ? 'Logging in...' : 'Login'}
      </button>
      {state.errors && <ErrorList errors={state.errors} />}
    </form>
  );
}

// ❌ WRONG - React 18 pattern (manual state + useEffect)
'use client';
export function LoginForm() {
  const [state, setState] = useState({ errors: null });
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    // Manual error handling...
  };
}
```

### 2. New useOptimistic Hook

```typescript
// ✓ CORRECT - useOptimistic for instant UI updates
'use client';
import { useOptimistic } from 'react';

export function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo: Todo) => [...state, newTodo]
  );

  const handleAddTodo = async (formData: FormData) => {
    const text = formData.get('text') as string;

    // Optimistically update UI
    addOptimisticTodo({
      id: Math.random().toString(),
      text,
      completed: false,
    });

    // Then update server
    await createTodoAction(text);
  };

  return (
    <div>
      {optimisticTodos.map((todo) => (
        <div key={todo.id}>{todo.text}</div>
      ))}
      <form action={handleAddTodo}>
        <input name="text" />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}

// ❌ WRONG - Waiting for server before showing
export function TodoList({ todos }: { todos: Todo[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [todoList, setTodoList] = useState(todos);

  const handleAddTodo = async (text: string) => {
    setIsAdding(true);
    const todo = await createTodoAction(text);
    setTodoList([...todoList, todo]);
    setIsAdding(false);
  };
}
```

### 3. Server Actions with Clarity

```typescript
// ✓ CORRECT - Clear distinction of server/client
'use server';
export async function updateTaskStatus(id: string, status: TaskStatus) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, id),
  });

  if (!task || task.ownerId !== session.user.id) {
    throw new Error('Not found or unauthorized');
  }

  await db.update(tasks).set({ status }).where(eq(tasks.id, id));
  return { success: true };
}

// ✓ CORRECT - Server Action called from Client Component
'use client';
export function TaskItem({ task }: { task: Task }) {
  const [optimisticTask, setOptimisticTask] = useOptimistic(task);

  const handleStatusChange = async (status: TaskStatus) => {
    setOptimisticTask({ ...optimisticTask, status });
    await updateTaskStatus(optimisticTask.id, status);
  };

  return (
    <div>
      <select value={optimisticTask.status} onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}>
        <option value="todo">To Do</option>
        <option value="in_progress">In Progress</option>
        <option value="done">Done</option>
      </select>
    </div>
  );
}

// ❌ WRONG - Mixing concerns or unclear boundaries
export function TaskItem({ task }) {
  const [status, setStatus] = useState(task.status);

  const handleChange = async (newStatus) => {
    setStatus(newStatus);
    // Unclear if this is a Server Action or client call
    await updateTask({ id: task.id, status: newStatus });
  };
}
```

### 4. Improved Form Handling

```typescript
// ✓ CORRECT - Form with server action
'use client';
import { useActionState } from 'react';

export function CreateProjectForm() {
  const [state, formAction] = useActionState(
    async (prevState, formData) => {
      const name = formData.get('name') as string;
      const description = formData.get('description') as string;

      const result = projectSchema.safeParse({ name, description });
      if (!result.success) {
        return {
          success: false,
          errors: result.error.flatten().fieldErrors,
        };
      }

      return await createProjectAction(result.data);
    },
    { success: false, errors: null }
  );

  return (
    <form action={formAction}>
      <input
        name="name"
        placeholder="Project name"
        required
      />
      {state.errors?.name && <span>{state.errors.name}</span>}

      <textarea
        name="description"
        placeholder="Description"
      />
      {state.errors?.description && <span>{state.errors.description}</span>}

      <button type="submit">Create</button>
    </form>
  );
}

// ❌ WRONG - Manual form handling
'use client';
export function CreateProjectForm() {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = projectSchema.safeParse(formData);
    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      return;
    }
    // ...
  };
}
```

### 5. Async Transitions with useTransition

```typescript
// ✓ CORRECT - useTransition for async operations
'use client';
import { useTransition } from 'react';

export function ProjectFilters() {
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useQueryState('search');

  const handleSearch = (value: string) => {
    startTransition(async () => {
      await setSearch(value);
    });
  };

  return (
    <input
      value={search}
      onChange={(e) => handleSearch(e.target.value)}
      disabled={isPending}
      placeholder="Search..."
    />
  );
}

// ❌ WRONG - useState for async state
'use client';
export function ProjectFilters() {
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (value: string) => {
    setIsSearching(true);
    await setSearch(value);
    setIsSearching(false);
  };
}
```

### 6. Context + Server Components

```typescript
// ✓ CORRECT - Context provider wraps layout
// src/app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

// src/components/theme-provider.tsx
'use client';
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ❌ WRONG - Wrapping entire app in context unnecessarily
'use client';  // Makes entire app client-side!
export default function RootLayout({ children }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}
```

### 7. React.use() for Promises

```typescript
// ✓ CORRECT - React.use() for async operations
'use client';
import { use } from 'react';

async function getUser(id: string) {
  return await db.query.users.findFirst({
    where: eq(users.id, id),
  });
}

export function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise);

  return <div>{user.name}</div>;
}

// Usage in Server Component
export async function Page({ params }: { params: { id: string } }) {
  const userPromise = getUser(params.id);
  return <UserProfile userPromise={userPromise} />;
}

// ❌ WRONG - useEffect for promise resolution
'use client';
export function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getUser(userId).then(setUser);
  }, [userId]);

  return <div>{user?.name}</div>;
}
```

## Report Includes

- Missing `useActionState` on forms with Server Actions
- `useOptimistic` not used for instant feedback
- Manual form handling instead of `useActionState`
- `useEffect` for data fetching in Client Components
- `useState`-based pending state instead of `useTransition`
- Unclear Server Action vs Client function boundaries
- Context providers not using `'use client'` directive
- Missing `React.use()` for promise unwrapping
- Improper Suspense boundaries with async operations

## Integration

Add to form components:

```markdown
## React 19 Forms

- [ ] Using `useActionState` hook
- [ ] Server Action boundaries clear
- [ ] Form disabled during submission
- [ ] Error handling via state
```

Add to component patterns:

```markdown
## React 19 Patterns

- [ ] useOptimistic for instant updates
- [ ] useTransition for async state
- [ ] React.use() for promises
- [ ] Suspense boundaries present
```

## React 19 Checklist

- **Forms**: `useActionState` instead of manual handlers
- **Optimism**: `useOptimistic` for instant feedback
- **Async**: `useTransition` for pending states
- **Promises**: `React.use()` for unwrapping
- **Boundaries**: Server/Client clearly marked
- **Suspense**: Boundaries around async components
- **Context**: Minimal and strategically placed
- **Actions**: Server Actions over API routes

---

**React 19 is concurrent by default. Use modern patterns.**
