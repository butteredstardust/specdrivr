---
name: drizzle-orm-auditor
description: Optimize Drizzle ORM queries and schema design patterns
type: subagent
user-invocable: true
---

# Drizzle ORM Auditor Agent

**Purpose:** Ensure Drizzle queries are optimal and schemas are properly designed.

**Invocation:** Code review or quarterly

**Speed:** ~2 min

## How to Use

```bash
claude agent drizzle-orm-auditor "Audit Drizzle queries in repositories"
claude agent drizzle-orm-auditor "Check schema design patterns"
```

## What It Checks

### 1. Query Optimization

```typescript
// ✓ CORRECT - Select only needed columns
const users = await db
  .select({
    id: users.id,
    email: users.email,
    name: users.name,
  })
  .from(users);

// ❌ WRONG - Select all columns unnecessarily
const users = await db.select().from(users);
```

### 2. Relations & Joins

```typescript
// ✓ CORRECT - Use leftJoin for related data
const results = await db.select().from(tasks).leftJoin(plans, eq(tasks.planId, plans.id));

// ❌ WRONG - N+1 query pattern
const tasks = await db.select().from(tasks);
for (const task of tasks) {
  task.plan = await db.select().from(plans).where(eq(plans.id, task.planId));
}
```

### 3. Transactions

```typescript
// ✓ CORRECT - Use transactions for multi-step writes
await db.transaction(async (tx) => {
  await tx.insert(orders).values(...);
  await tx.update(inventory).set(...);
});

// ❌ WRONG - No transaction, can fail halfway
await db.insert(orders).values(...);
await db.update(inventory).set(...);
```

### 4. Type Safety

```typescript
// ✓ CORRECT - Use Drizzle types
import { eq, and, or } from 'drizzle-orm';

// ❌ WRONG - String-based queries lose type safety
const result = db.execute('SELECT * FROM users WHERE id = $1', [userId]);
```

## Report Includes

- Query efficiency analysis
- N+1 pattern detection
- Transaction usage
- Schema design validation
- Index recommendations
- Type safety violations

## Integration

Run after schema changes:

```bash
/create-migration
claude agent drizzle-orm-auditor "Validate migration and queries"
```

---

**Drizzle + TypeScript = Type-safe queries. Keep it safe.**
