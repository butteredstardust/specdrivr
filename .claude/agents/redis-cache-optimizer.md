---
name: redis-cache-optimizer
description: Optimize Redis caching strategy, invalidation, and session management
type: subagent
user-invocable: true
---

# Redis Cache Optimizer Agent

**Purpose:** Ensure Redis is used effectively for sessions, caching, and performance.

**Invocation:** Code review or quarterly

**Speed:** ~2 min

## How to Use

```bash
claude agent redis-cache-optimizer "Audit Redis usage and caching"
claude agent redis-cache-optimizer "Check cache invalidation patterns"
```

## What It Checks

### 1. Session Storage with BetterAuth

```typescript
// ✓ CORRECT - Redis handles sessions automatically
export const auth = betterAuth({
  database: db,
  sessionStorage: {
    adapter: ioredisAdapter(redis),
  },
  // Sessions automatically expire
});

// ❌ WRONG - Manual session management
export async function createSession(userId: string) {
  const token = generateToken();
  // Storing in database directly, no cache layer
  await db.insert(sessions).values({ userId, token });
}
```

### 2. Cache Key Naming

```typescript
// ✓ CORRECT - Consistent, namespaced keys
const CACHE_KEYS = {
  project: (id: string) => `project:${id}`,
  projectTasks: (id: string) => `project:${id}:tasks`,
  userProfile: (id: string) => `user:${id}:profile`,
  leaderboard: 'leaderboard:global',
} as const;

// Then use:
const cached = await redis.get(CACHE_KEYS.project(projectId));

// ❌ WRONG - Inconsistent or too generic keys
const cached = await redis.get(`project_${projectId}`);
const cached2 = await redis.get('data');
```

### 3. Cache Invalidation Strategy

```typescript
// ✓ CORRECT - Explicit invalidation on updates
'use server';
export async function updateProject(id: string, data: ProjectInput) {
  const result = projectSchema.safeParse(data);
  if (!result.success) {
    return { success: false, errors: result.error.flatten() };
  }

  // Update database
  await db.update(projects).set(result.data).where(eq(projects.id, id));

  // Invalidate related caches
  await redis.del(CACHE_KEYS.project(id));
  await redis.del(CACHE_KEYS.projectTasks(id));

  return { success: true };
}

// ❌ WRONG - Stale cache not invalidated
('use server');
export async function updateProject(id: string, data: ProjectInput) {
  await db.update(projects).set(data).where(eq(projects.id, id));
  // Cache becomes stale!
}
```

### 4. Cache Expiration Patterns

```typescript
// ✓ CORRECT - Explicit TTL based on data freshness
async function getCachedProject(id: string) {
  const cached = await redis.get(CACHE_KEYS.project(id));
  if (cached) return JSON.parse(cached);

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, id),
  });

  // Cache for 1 hour (static data)
  await redis.setex(CACHE_KEYS.project(id), 3600, JSON.stringify(project));

  return project;
}

async function getCachedLeaderboard() {
  const cached = await redis.get(CACHE_KEYS.leaderboard);
  if (cached) return JSON.parse(cached);

  const leaders = await db.query.users.findMany({
    orderBy: desc(users.score),
    limit: 100,
  });

  // Cache for 5 minutes (volatile data)
  await redis.setex(CACHE_KEYS.leaderboard, 300, JSON.stringify(leaders));

  return leaders;
}

// ❌ WRONG - No TTL or inconsistent expiration
await redis.set(CACHE_KEYS.project(id), JSON.stringify(project));
// Will be cached forever or indefinitely
```

### 5. Connection Management

```typescript
// ✓ CORRECT - Singleton Redis connection
import { createClient } from 'redis';

let redis: ReturnType<typeof createClient> | null = null;

export function getRedis() {
  if (!redis) {
    redis = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 5000),
      },
    });
    redis.on('error', (err) => logger.error('Redis error:', err));
  }
  return redis;
}

// ❌ WRONG - Creating new connections repeatedly
async function getCached() {
  const client = new Redis(process.env.REDIS_URL);
  const data = await client.get('key');
  client.disconnect(); // Connection leak
}
```

### 6. Batch Operations

```typescript
// ✓ CORRECT - Use pipeline for multiple operations
async function invalidateUserCaches(userId: string) {
  const pipeline = redis.pipeline();
  pipeline.del(CACHE_KEYS.userProfile(userId));
  pipeline.del(CACHE_KEYS.userTasks(userId));
  pipeline.del(CACHE_KEYS.userPreferences(userId));
  await pipeline.exec();
}

// ❌ WRONG - Individual requests (slower)
await redis.del(CACHE_KEYS.userProfile(userId));
await redis.del(CACHE_KEYS.userTasks(userId));
await redis.del(CACHE_KEYS.userPreferences(userId));
```

### 7. Cache Hit Rate Monitoring

```typescript
// ✓ CORRECT - Log cache operations
async function getCachedData(key: string) {
  const cached = await redis.get(key);

  if (cached) {
    logger.info('cache_hit', { key });
    return JSON.parse(cached);
  }

  logger.info('cache_miss', { key });
  const data = await fetchData();
  await redis.setex(key, 3600, JSON.stringify(data));
  return data;
}

// ❌ WRONG - No visibility into cache effectiveness
const cached = await redis.get(key);
// No logging = can't optimize
```

## Report Includes

- Inconsistent cache key patterns
- Missing cache invalidation logic
- Inappropriate TTL values
- No session invalidation on logout
- Connection pool misconfiguration
- N+1 cache misses
- Missing cache warming strategies
- Session security issues
- Cache memory usage concerns
- Stale data patterns

## Integration

Add to Server Actions:

```typescript
'use server';
export async function updateData(id: string, data: Input) {
  // Validate
  const result = schema.safeParse(data);
  if (!result.success) return { success: false, errors: result.error.flatten() };

  // Update database
  await db.update(table).set(result.data).where(eq(table.id, id));

  // Invalidate cache
  await redis.del(cacheKey);

  return { success: true };
}
```

Add to deployment:

```markdown
## Redis Configuration

- [ ] Connection pooling configured
- [ ] Session storage using Redis
- [ ] Cache invalidation on updates
- [ ] TTL values appropriate for data
- [ ] Monitoring/logging in place
- [ ] Memory limits set
```

## Performance Checklist

- **Session Storage**: Via Redis (automatic with BetterAuth)
- **Cache Keys**: Namespaced and consistent
- **Invalidation**: Explicit on mutations
- **TTL**: Set based on data freshness
- **Monitoring**: Cache hit rates logged
- **Connection**: Singleton, with reconnection strategy
- **Batch Ops**: Pipeline for multiple operations
- **Memory**: Monitoring eviction policies

---

**Redis amplifies performance. Keep the strategy clean.**
