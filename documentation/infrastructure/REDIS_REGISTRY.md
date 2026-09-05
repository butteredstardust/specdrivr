SPECDRIVR

Master Product Specification — Redis Registry

---

## 1. Overview

Specdrivr uses Redis through `ioredis` for distributed state. Use this document to prevent key collisions and memory leaks.

## 2. Key Namespace Registry

| **Prefix**          | **Purpose**                     | **TTL**  | **Managing Service**        |
| ------------------- | ------------------------------- | -------- | --------------------------- |
| `ratelimit:*`       | API rate limiting counters.     | 1m - 1h  | `lib/rate-limiter.ts`       |
| `lock:*`            | Distributed concurrency locks.  | 30s - 5m | `lib/lock-manager.ts`       |
| `auth:session:*`    | BetterAuth cached session data. | 5m       | `lib/auth.ts`               |
| `agent:heartbeat:*` | Agent health tracking.          | 60s      | `api/v1/sessions/heartbeat` |
| `cache:rbac:*`      | User project permissions.       | 10m      | `lib/rbac.ts`               |

## 3. Usage Rules

1.  **Prefixing**: Prefix every key with the `: ` (colon) separator. This supports Redis GUI tools such as RedisInsight.
2.  **Explicit TTL**: Do not use `SET` without `EX` or `PX`. Use it only when data is permanent, which is rare here.
3.  **Atomic Operations**: Use `multi()` or Lua scripts for multi-key updates. This ensures consistency.

## 4. Maintenance

- **Eviction Policy**: The production Redis instance uses `allkeys-lru`.
- **Monitoring**: Monitor key counts and memory usage in the Operations dashboard.
