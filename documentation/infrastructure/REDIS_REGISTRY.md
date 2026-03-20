**SPECDRIVR**

Master Product Specification — Redis Registry

[Status: GROUND TRUTH]

---

## 1. Overview

Specdrivr utilizes Redis (via `ioredis`) for high-performance distributed state management. This document defines the key namespace and TTL policies to prevent collision and memory leakage.

## 2. Key Namespace Registry

| **Prefix**          | **Purpose**                     | **TTL**  | **Managing Service**        |
| ------------------- | ------------------------------- | -------- | --------------------------- |
| `ratelimit:*`       | API rate limiting counters.     | 1m - 1h  | `lib/rate-limiter.ts`       |
| `lock:*`            | Distributed concurrency locks.  | 30s - 5m | `lib/lock-manager.ts`       |
| `auth:session:*`    | BetterAuth cached session data. | 5m       | `lib/auth.ts`               |
| `agent:heartbeat:*` | Agent health tracking.          | 60s      | `api/v1/sessions/heartbeat` |
| `cache:rbac:*`      | User project permissions.       | 10m      | `lib/rbac.ts`               |

## 3. Usage Rules

1.  **Prefixing**: Every key MUST be prefixed using the `: ` (colon) separator for compatibility with Redis GUI tools (e.g., RedisInsight).
2.  **Explicit TTL**: Never use `SET` without an accompanying `EX` or `PX` unless the data is permanent (rare in this system).
3.  **Atomic Operations**: Use `multi()` or Lua scripts for multi-key updates to ensure consistency.

## 4. Maintenance

- **Eviction Policy**: The production Redis instance is configured with `allkeys-lru`.
- **Monitoring**: Key counts and memory usage are monitored via the Operations dashboard.
