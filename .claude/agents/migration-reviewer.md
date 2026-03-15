---
name: migration-reviewer
description: Validate database migrations for safety, compatibility, and best practices
type: subagent
user-invocable: true
---

# Migration Reviewer Agent

**Purpose:** Review SQL migrations before applying to catch data loss, compatibility issues, and regressions.

**Invocation:** After running `/create-migration`

**Speed:** ~1 min per migration

## How to Use

```bash
# After generating migration
/create-migration
# [Review the generated migration file]

# Then validate
claude agent migration-reviewer "Validate latest migration for safety"

# Review specific migration
claude agent migration-reviewer "Check drizzle/migrations/0001_add_deleted_at.sql"

# Full history audit
claude agent migration-reviewer "Audit all migrations for consistency"
```

## What It Checks

### 1. Data Loss Risk
```sql
-- ❌ RISKY: Dropping column without backup
ALTER TABLE tasks DROP COLUMN oldField;

-- ✓ SAFE: Add new column with default, deprecate old
ALTER TABLE tasks ADD COLUMN newField VARCHAR(255) DEFAULT 'value';
-- oldField can be dropped in next migration after verification
```

### 2. Enum Compatibility
```sql
-- ❌ PROBLEM: Adding enum value that conflicts
ALTER TYPE task_status ADD VALUE 'pending' BEFORE 'in_progress';
-- Existing enum already has 'pending'

-- ✓ CORRECT: Add new enum value if not exists
ALTER TYPE task_status ADD VALUE 'archived' AFTER 'completed';
```

### 3. Foreign Key Constraints
```sql
-- ❌ PROBLEM: Adding FK without verifying data exists
ALTER TABLE tasks ADD CONSTRAINT tasks_plan_id_fk
  FOREIGN KEY (planId) REFERENCES plans(id);
-- What if tasks.planId has values that don't exist in plans?

-- ✓ CORRECT: Validate data first
-- Verify no orphan records:
-- SELECT COUNT(*) FROM tasks WHERE planId NOT IN (SELECT id FROM plans);
-- Then add constraint
```

### 4. Index Strategy
```sql
-- ❌ INEFFICIENT: Index on low-cardinality column
CREATE INDEX idx_tasks_status ON tasks(status);
-- Only 5 status values; index won't help

-- ✓ GOOD: Index on high-cardinality columns
CREATE INDEX idx_tasks_plan_id ON tasks(planId);
-- Many different plan IDs
```

## Example Output

```
MIGRATION REVIEW

File: drizzle/migrations/0001_add_deleted_at.sql

✓ SAFE OPERATIONS (3):
  1. ADD COLUMN deletedAt - Safe (nullable, has default)
  2. CREATE INDEX - Good strategy (high-cardinality column)
  3. UPDATE query structure - Correct pattern

⚠️ WARNINGS (2):
  1. Missing index on new column
     Query: SELECT * FROM tasks WHERE deletedAt IS NOT NULL
     Will be slow without index
     Recommendation: Add CREATE INDEX idx_tasks_deleted_at

  2. Rollback plan not documented
     If migration fails partway, unclear how to rollback
     Recommendation: Document rollback procedure

🔴 CRITICAL ISSUES: None

📊 MIGRATION STATS:
  Type: Schema modification
  Duration estimate: <100ms
  Risk level: LOW
  Requires downtime: No

✅ VERDICT: SAFE TO APPLY

Next steps:
  1. Add index for deletedAt column (optional but recommended)
  2. Run pnpm db:migrate
  3. Verify in pnpm db:studio
---

File: drizzle/migrations/0002_rename_column.sql

❌ CRITICAL ISSUE:

  Operation: ALTER TABLE tasks RENAME COLUMN oldName TO newName
  Problem: This is breaking change
  Impact: Code referencing tasks.oldName will crash

  Action required:
  1. Update all code that references oldName first
  2. Add deprecation period (1-2 releases)
  3. Then run migration
  4. Update code to use newName

  Current status: ❌ DO NOT APPLY
  Expected status after fix: ✅ Safe

Checklist to apply:
  [ ] Code updated to support both oldName and newName
  [ ] Deployment includes code changes
  [ ] Users notified of change (if applicable)
  [ ] Tests updated for newName
  [ ] Rollback procedure documented
  [ ] Apply migration
```

## Safety Checks

### Column Additions
```sql
-- ✓ SAFE: ADD with default and nullable
ALTER TABLE table_name ADD COLUMN newCol VARCHAR(255) DEFAULT 'value' NOT NULL;

-- ❌ RISKY: ADD NOT NULL without default
ALTER TABLE table_name ADD COLUMN requiredCol TEXT NOT NULL;
-- Existing rows will fail (no value for new NOT NULL column)
```

### Data Type Changes
```sql
-- ❌ RISKY: Incompatible type change
ALTER TABLE tasks ALTER COLUMN priority TYPE TEXT;
-- If priority is INTEGER with values 1,2,3, conversion fails

-- ✓ SAFE: Ensure type conversion is valid
-- First verify: SELECT DISTINCT priority FROM tasks;
-- Then: ALTER TABLE tasks ALTER COLUMN priority TYPE TEXT USING priority::TEXT;
```

### Constraint Addition
```sql
-- ❌ RISKY: Add constraint without verification
ALTER TABLE orders ADD CONSTRAINT valid_amount CHECK (amount > 0);
-- Fails if existing orders have amount = 0 or negative

-- ✓ SAFE: Verify first
-- SELECT COUNT(*) FROM orders WHERE amount <= 0;
-- Then add constraint only if count = 0
```

## Pre-Migration Checklist

Use this before applying migrations:

```markdown
## Pre-Migration Checklist

- [ ] Backup database taken
- [ ] Migration reviewed by migration-reviewer agent
- [ ] Data loss risks identified and mitigated
- [ ] Rollback plan documented
- [ ] Code changes deployed (if breaking)
- [ ] No users currently using affected features
- [ ] Test database migration successful
- [ ] Performance impact assessed
- [ ] Monitoring alerts set up
```

## Rollback Procedures

### Simple Rollback
```sql
-- Most Drizzle migrations can be rolled back:
-- The old migration file shows the schema
-- Can restore by running previous migrations

-- Manual rollback (if needed):
ALTER TABLE table_name DROP COLUMN newCol;
-- Restore old schema
```

### Verify Safe to Apply
```sql
-- Before applying migration, verify:
SELECT COUNT(*) FROM tasks WHERE planId NOT IN (SELECT id FROM plans);
-- Should return 0 if foreign key constraint will work

SELECT COUNT(DISTINCT status) FROM tasks;
-- Should match expected enum values
```

## Integration

### Pre-Migration Workflow
```bash
# 1. Generate migration
/create-migration

# 2. Review migration
claude agent migration-reviewer "Check migration safety"

# 3. If safe, apply
pnpm db:migrate

# 4. Verify
pnpm db:studio
```

### CI/CD Validation
Add to GitHub Actions:
```yaml
- name: Validate Migrations
  run: |
    claude agent migration-reviewer "Audit all pending migrations"
```

Block deploy if validation fails.

## Database Testing

After migration applied:

```bash
# 1. Verify schema
pnpm db:studio

# 2. Test queries
# Run SELECT queries on affected tables
SELECT COUNT(*) FROM tasks;
SELECT * FROM tasks WHERE deletedAt IS NOT NULL;

# 3. Check performance
# Query before/after timing

# 4. Monitor production
# Check for slow queries in logs
```

## Related Commands

- `/create-migration` — Generate migration from schema changes
- `pnpm db:migrate` — Apply pending migrations
- `pnpm db:studio` — Interactive database explorer
- `AGENTS.md §8` — Database rules

---

**Migrations are permanent. Review carefully before applying.**
