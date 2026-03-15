---
name: create-migration
description: Generate and validate Drizzle ORM migrations with schema safety checks
disable-model-invocation: true
---

# Create Migration Skill

Automates the Drizzle ORM migration workflow with built-in validation against your schema.

## Workflow

### 1. Analyze Schema Changes
Before generating, review what you're changing:
- Are you adding nullable fields? (verify default values)
- Are you modifying enums? (check existing data compatibility)
- Are you adding foreign keys? (verify referential integrity)

### 2. Generate Migration

```bash
pnpm db:generate
```

This creates a new timestamped migration file in `drizzle/migrations/`.

### 3. Review Generated SQL

Open `drizzle/migrations/[timestamp]_*.sql` and verify:

**✓ Checks to Perform:**
- [ ] Enum values match between `src/db/schema.ts` and migration
- [ ] Column nullability aligns with schema definition
- [ ] Foreign keys reference correct tables/columns
- [ ] Data types match Drizzle declarations (e.g., `varchar(255)` for limited strings)
- [ ] Indexes are created for frequently-queried columns
- [ ] Default values match schema (or are intentionally different)
- [ ] No destructive changes without explicit `DROP` comments

**⚠️ Common Issues:**
- Enum mismatch: migration says `'pending'` but schema says `'in-progress'` → migration is authoritative; fix schema
- Missing constraints: If migration lacks `NOT NULL`, Drizzle won't add it retrospectively
- Foreign key cascades: Verify `ON DELETE CASCADE` matches intent (verify against `@/lib/rbac.ts` for permission implications)

### 4. Test Migration Locally

```bash
pnpm db:migrate
```

Verify in database:
```bash
pnpm db:studio
```

Or use postgres MCP:
```sql
SELECT * FROM information_schema.columns WHERE table_name = 'your_table';
```

### 5. Commit

```bash
git add drizzle/migrations/[timestamp]_*.sql
git commit -m "migration: [description of schema change]"
```

## Safety Rules

**NEVER:**
- ❌ Edit migration files manually after generation
- ❌ Use `pnpm db:push` (bypasses migration history)
- ❌ Delete migration files
- ❌ Reorder migration files

**ALWAYS:**
- ✓ Review generated SQL before running `db:migrate`
- ✓ Test on local database first
- ✓ Keep schema.ts and migrations in sync

## Examples

### Adding a New Column
```typescript
// src/db/schema.ts
export const projects = pgTable('projects', {
  // ... existing columns
  deletedAt: timestamp().notNull().default(sql`NOW()`), // NEW
});
```

```bash
pnpm db:generate
# Review drizzle/migrations/0001_add_deleted_at.sql
pnpm db:migrate
```

### Modifying an Enum
```typescript
// src/db/schema.ts
export const taskStatusEnum = pgEnum('task_status', [
  'todo',
  'in-progress',
  'blocked',     // MODIFIED from 'blocked'
  'completed',   // ADDED
  'failed',      // ADDED
]);
```

```bash
pnpm db:generate
# Review migration - Drizzle will add new enum values
# Existing values safe (PostgreSQL preserves them)
pnpm db:migrate
```

### Adding a Foreign Key
```typescript
// src/db/schema.ts
export const tasks = pgTable('tasks', {
  id: serial().primaryKey(),
  // ... existing
  planId: integer().references(() => plans.id), // NEW FK
});
```

```bash
pnpm db:generate
# Review: Check that plans.id exists and is correct type
pnpm db:migrate
```

## Integration with CI

Migrations run automatically in GitHub Actions:
```yaml
# .github/workflows/test.yml
- name: Migrate Database
  run: pnpm db:migrate
```

If migration fails in CI, your pre-push hook will catch it before merge.

## Related Commands

- `pnpm db:generate` — Create new migration from schema changes
- `pnpm db:migrate` — Apply pending migrations (uses `drizzle.config.ts`)
- `pnpm db:studio` — Interactive database explorer
- `pnpm db:seed` — Populate test data

## See Also
- [Drizzle ORM Migrations](https://orm.drizzle.team/docs/migrations)
- [AGENTS.md Section 8](../../AGENTS.md#8-database-access-rules) - Database Rules
- [schema.ts](src/db/schema.ts) - Current schema definition
