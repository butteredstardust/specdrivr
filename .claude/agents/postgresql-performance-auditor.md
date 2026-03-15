---
name: postgresql-performance-auditor
description: Audit PostgreSQL schema design, indexes, and query performance
type: subagent
user-invocable: true
---

# PostgreSQL Performance Auditor Agent

**Purpose:** Ensure database schema is optimized and queries perform efficiently.

**Invocation:** Code review or quarterly

**Speed:** ~2 min

## How to Use

```bash
claude agent postgresql-performance-auditor "Audit database schema and indexes"
claude agent postgresql-performance-auditor "Check query performance"
```

## What It Checks

### 1. Index Strategy
```sql
-- ✓ CORRECT - Indexes on foreign keys and frequent filters
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  status VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);

-- ❌ WRONG - No indexes on frequently queried columns
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  status VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Schema Normalization
```sql
-- ✓ CORRECT - Proper normalization
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  role_id UUID REFERENCES roles(id)
);

CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name VARCHAR UNIQUE NOT NULL
);

-- ❌ WRONG - Storing repeating data
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR NOT NULL,
  role_name VARCHAR,
  role_permissions TEXT[]  -- storing JSON/array instead of relation
);
```

### 3. Column Type Correctness
```sql
-- ✓ CORRECT - Appropriate types
CREATE TABLE posts (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_published BOOLEAN DEFAULT FALSE
);

-- ❌ WRONG - Inefficient types
CREATE TABLE posts (
  id VARCHAR PRIMARY KEY,
  title VARCHAR(5000),
  content VARCHAR(50000),
  view_count VARCHAR,
  created_at VARCHAR,
  is_published VARCHAR
);
```

### 4. Constraint Enforcement
```sql
-- ✓ CORRECT - Constraints at database level
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount > 0),
  status VARCHAR NOT NULL DEFAULT 'pending',
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'cancelled'))
);

-- ❌ WRONG - Validation only in application
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID,
  total_amount DECIMAL,
  status VARCHAR
);
```

### 5. Query Optimization Patterns
```typescript
// ✓ CORRECT - Efficient query with indexes
const orders = await db.select({
  id: orders.id,
  total: orders.total,
  userName: users.name,
}).from(orders)
  .leftJoin(users, eq(orders.userId, users.id))
  .where(eq(orders.status, 'completed'))
  .orderBy(desc(orders.createdAt))
  .limit(10);

// ❌ WRONG - Full table scan or inefficient query
const orders = await db.select().from(orders);
const filtered = orders.filter(o => o.status === 'completed');
```

### 6. Vacuum & Maintenance
```sql
-- ✓ CORRECT - Scheduled maintenance
VACUUM ANALYZE;
REINDEX INDEX idx_tasks_project_id;

-- Check table bloat
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 7. Slow Query Detection
```sql
-- ✓ CORRECT - Log slow queries
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- log queries > 1 second
SELECT query, calls, mean_exec_time FROM pg_stat_statements
ORDER BY mean_exec_time DESC LIMIT 10;

-- ❌ WRONG - No visibility into slow queries
-- No logging configured
```

## Report Includes

- Missing indexes on foreign keys and filter columns
- Table bloat from frequent updates
- Missing or redundant constraints
- Inefficient column types (VARCHAR for numbers)
- N+1 query patterns in Drizzle code
- Unvacuumed tables
- Slow query analysis
- Index usage statistics
- Partitioning opportunities (large tables)
- Connection pool configuration

## Integration

Add to migration reviews:
```markdown
## PostgreSQL Schema Quality
- [ ] All foreign keys have indexes
- [ ] Constraints at database level
- [ ] Appropriate column types
- [ ] No unexpected NULL columns
- [ ] Slow query logging enabled
```

Add to deployment checklist:
```bash
# Before release
claude agent postgresql-performance-auditor "Final database performance review"
```

## Performance Tuning Checklist

- **Indexes**: Created on FK and WHERE/ORDER BY columns
- **Statistics**: `ANALYZE` run after schema changes
- **Constraints**: `CHECK`, `UNIQUE`, `NOT NULL` enforced
- **Vacuuming**: Scheduled with reasonable frequency
- **Connection pooling**: Configured (via Redis or pgBouncer)
- **Query timeouts**: Set appropriately
- **Logging**: Slow query logging enabled

---

**PostgreSQL is fast when well-tuned. Audits prevent surprises.**
