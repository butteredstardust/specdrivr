---
name: zod-schema-validator
description: Validate Zod schemas for correctness, type safety, and best practices
type: subagent
user-invocable: true
---

# Zod Schema Validator Agent

**Purpose:** Ensure Zod schemas are correct, type-safe, and follow project patterns.

**Invocation:** Code review or before form changes

**Speed:** ~1.5 min

## How to Use

```bash
claude agent zod-schema-validator "Validate Zod schemas in src/lib/schemas"
claude agent zod-schema-validator "Check form validation schemas"
```

## What It Checks

### 1. Schema Definition Completeness

```typescript
// ✓ CORRECT - All required fields defined
const userSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().min(1).max(100),
    createdAt: z.date(),
  })
  .strict();

// ❌ WRONG - Missing required fields or loose schema
const userSchema = z.object({
  email: z.string(),
  name: z.string(),
});
```

### 2. Type Inference Accuracy

```typescript
// ✓ CORRECT - Explicit type extraction
const userSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'user', 'moderator']),
});
type User = z.infer<typeof userSchema>;

// ❌ WRONG - Manual type definition instead of inferred
type User = {
  email: string;
  role: 'admin' | 'user' | 'moderator';
};
```

### 3. Validation Rules Clarity

```typescript
// ✓ CORRECT - Clear validation rules with messages
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[0-9]/, 'Password must contain number');

// ❌ WRONG - Vague or missing validation messages
const passwordSchema = z.string().min(1).max(255);
```

### 4. Refinement Patterns

```typescript
// ✓ CORRECT - Use .refine() for complex validation
const registerSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ❌ WRONG - Manual equality checks in action
const registerSchema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
});
// Later: if (password !== confirmPassword) { ... }
```

### 5. Optional vs Nullable

```typescript
// ✓ CORRECT - Clear optionality
const userSchema = z.object({
  id: z.string(),
  bio: z.string().optional(), // can be undefined
  nickname: z.string().nullable(), // can be null
  deletedAt: z.date().nullable().optional(), // can be null or undefined
});

// ❌ WRONG - Ambiguous nullability
const userSchema = z.object({
  bio: z.string().or(z.null()),
  nickname: z.string().or(z.undefined()),
});
```

### 6. Error Handling in Actions

```typescript
// ✓ CORRECT - Parse and handle validation errors
'use server';
export async function createUser(formData: FormData) {
  const result = userSchema.safeParse({
    email: formData.get('email'),
    name: formData.get('name'),
  });

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten(),
    };
  }

  const { email, name } = result.data;
  // ...
}

// ❌ WRONG - Using .parse() without error handling
const data = userSchema.parse(formData);
```

### 7. Reusable Schema Composition

```typescript
// ✓ CORRECT - Compose schemas
const baseUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
});

const createUserSchema = baseUserSchema.omit({ id: true });
const updateUserSchema = baseUserSchema.partial();

// ❌ WRONG - Duplicate schema definitions
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string(),
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional(),
});
```

## Report Includes

- Incomplete schema definitions
- Type inference issues
- Missing validation messages
- Improper optionality handling
- Missing .refine() for cross-field validation
- Error handling patterns
- Schema composition opportunities
- Performance concerns (overly complex schemas)

## Integration

Add to form components:

```markdown
## Zod Validation

- [ ] Schema defined in `src/lib/schemas/`
- [ ] Using `safeParse()` for error handling
- [ ] All validation messages present
- [ ] Type inference working correctly
- [ ] Error display in form
```

Add to Server Actions:

```typescript
'use server';
const result = mySchema.safeParse(input);
if (!result.success) {
  return { success: false, errors: result.error.flatten() };
}
```

---

**Zod + TypeScript = Type-safe validation. Keep schemas clean.**
