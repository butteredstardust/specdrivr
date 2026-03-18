---
name: typescript-strict-mode-advisor
description: Enforce TypeScript strict mode and advanced type patterns
type: subagent
user-invocable: true
---

# TypeScript Strict Mode Advisor Agent

**Purpose:** Ensure TypeScript strict mode is properly used and advanced type patterns are leveraged.

**Invocation:** Code review or quarterly

**Speed:** ~2 min

## How to Use

```bash
claude agent typescript-strict-mode-advisor "Check TypeScript strict mode compliance"
claude agent typescript-strict-mode-advisor "Audit advanced type patterns"
```

## What It Checks

### 1. Strict Mode Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false
  }
}
```

### 2. Proper Type Annotations

```typescript
// ✓ CORRECT - Explicit return types
export async function fetchUser(id: string): Promise<User | null> {
  return db.query.users.findFirst({
    where: eq(users.id, id),
  });
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ❌ WRONG - Implicit types
export async function fetchUser(id) {
  return db.query.users.findFirst({
    where: eq(users.id, id),
  });
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

### 3. Null/Undefined Handling

```typescript
// ✓ CORRECT - Explicit null checks
async function updateProject(id: string | null): Promise<void> {
  if (id === null) {
    throw new Error('Project ID is required');
  }

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, id),
  });

  if (!project) {
    throw new Error('Project not found');
  }

  // project is narrowed to non-null
  await db.update(projects).set({ updatedAt: new Date() });
}

// ❌ WRONG - Ignoring nullability
async function updateProject(id: string | null) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, id), // TS Error: potentially null
  });
  project.name = 'New Name'; // Could be null!
}
```

### 4. Generic Type Parameters

```typescript
// ✓ CORRECT - Proper generic constraints
export async function paginate<T extends { id: string }>(
  items: T[],
  page: number,
  pageSize: number
): Promise<{ items: T[]; total: number }> {
  const total = items.length;
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
  };
}

export function useQuery<T>(key: string, fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  // ...
}

// ❌ WRONG - Overly generic or missing constraints
export function paginate(items: any[], page: number, pageSize: number) {
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    total: items.length,
  };
}
```

### 5. Discriminated Unions

```typescript
// ✓ CORRECT - Discriminated union for type safety
type Result<T> = { success: true; data: T } | { success: false; error: string };

async function handleAction(): Promise<Result<User>> {
  try {
    const user = await getUser();
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// Usage with type narrowing
const result = await handleAction();
if (result.success) {
  console.log(result.data.name); // Type: User
} else {
  console.log(result.error); // Type: string
}

// ❌ WRONG - Generic result object
type Result = {
  success: boolean;
  data?: any;
  error?: string;
};

const result = await handleAction();
if (result.success) {
  console.log(result.data.name); // Type: any (unsafe)
}
```

### 6. Const Assertions

```typescript
// ✓ CORRECT - Const assertions for literals
export const ROLES = ['admin', 'user', 'moderator'] as const;
type Role = typeof ROLES[number];  // 'admin' | 'user' | 'moderator'

export const CONFIG = {
  maxRetries: 3,
  timeout: 5000,
} as const;

export enum Status {
  Active = 'active',
  Inactive = 'inactive',
} as const;

// ❌ WRONG - Without const assertions
export const ROLES = ['admin', 'user', 'moderator'];  // string[]
const role: typeof ROLES[number] = 'admin';           // string

export const CONFIG = { maxRetries: 3, timeout: 5000 };
// CONFIG.maxRetries type is number, not 3
```

### 7. Utility Types

```typescript
// ✓ CORRECT - Leverage utility types
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

// Create partial update schema
type UserUpdate = Partial<User>;

// Extract specific fields
type UserPreview = Pick<User, 'id' | 'name'>;

// Exclude fields
type UserWithoutId = Omit<User, 'id'>;

// Make fields readonly
type ReadonlyUser = Readonly<User>;

// Extract property types
type UserRole = User['role'];

// Record for mapping
type UserRolePermissions = Record<UserRole, string[]>;

// ❌ WRONG - Manual type definitions
type UserUpdate = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
};

type UserPreview = {
  id: string;
  name: string;
};
```

### 8. Never Type for Exhaustiveness

```typescript
// ✓ CORRECT - Exhaustiveness checking with never
type Action =
  | { type: 'CREATE'; payload: { name: string } }
  | { type: 'UPDATE'; payload: { id: string; name: string } }
  | { type: 'DELETE'; payload: { id: string } };

function handleAction(action: Action): void {
  switch (action.type) {
    case 'CREATE':
      console.log('Creating:', action.payload);
      break;
    case 'UPDATE':
      console.log('Updating:', action.payload);
      break;
    case 'DELETE':
      console.log('Deleting:', action.payload);
      break;
    default:
      const exhaustiveCheck: never = action;
      throw new Error(`Unhandled action type: ${exhaustiveCheck}`);
  }
}

// If new action type is added, TS error on switch
// ❌ WRONG - No exhaustiveness check
function handleAction(action: Action) {
  if (action.type === 'CREATE') {
    // ...
  }
  // Missing cases don't cause errors
}
```

## Report Includes

- Missing or implicit type annotations
- Unsafe null/undefined handling
- Improper use of generics
- Missing const assertions
- Not using discriminated unions
- Generic `any` types
- Missing utility type usage
- Non-exhaustive switch statements
- Type inference issues
- Variance problems in function types

## Integration

Add to `tsconfig.json` baseline:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false
  }
}
```

Add to code review:

```markdown
## TypeScript Strict Mode

- [ ] All functions have return types
- [ ] No implicit `any`
- [ ] Null checks explicit
- [ ] Generics properly constrained
- [ ] Discriminated unions for variants
- [ ] Const assertions on literals
```

## Type Safety Checklist

- **Config**: `strict: true` enabled
- **Annotations**: All function return types explicit
- **Nullability**: Explicit null/undefined checks
- **Generics**: Constraints defined where needed
- **Unions**: Discriminated for pattern matching
- **Assertions**: `as const` on literal types
- **Utilities**: Using Partial, Pick, Omit, Readonly
- **Exhaustiveness**: `never` type in switches

---

**Strict TypeScript prevents bugs at compile time.**
