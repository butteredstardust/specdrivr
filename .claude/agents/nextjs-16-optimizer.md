---
name: nextjs-16-optimizer
description: Optimize Next.js 16 App Router, Server Components, and performance patterns
type: subagent
user-invocable: true
---

# Next.js 16 Optimizer Agent

**Purpose:** Ensure best practices for Next.js 16 App Router and Server Components.

**Invocation:** Code review or quarterly

**Speed:** ~2 min for full analysis

## How to Use

```bash
# Full Next.js audit
claude agent nextjs-16-optimizer "Audit App Router and Server Component patterns"

# Specific area
claude agent nextjs-16-optimizer "Check src/app/ for Next.js 16 optimizations"

# Performance focus
claude agent nextjs-16-optimizer "Find performance issues in Server Components"
```

## What It Checks

### 1. Server Component Defaults

```typescript
// ✓ CORRECT - Default to Server Component
export async function Page() {
  const data = await fetchData();
  return <div>{data.title}</div>;
}

// ❌ WRONG - Unnecessary 'use client' on parent
'use client';
export function Page() {
  return <Child />;
}
```

### 2. Data Fetching Patterns

```typescript
// ✓ CORRECT - Fetch in Server Component
export async function Page() {
  const data = await db.select().from(items);
  return <ItemList items={data} />;
}

// ❌ WRONG - useEffect in Client Component
'use client';
export function Page() {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetch('/api/items').then(r => r.json()).then(setData);
  }, []);
  return <ItemList items={data} />;
}
```

### 3. Dynamic Imports

```typescript
// ✓ CORRECT - Code splitting with dynamic import
const HeavyComponent = dynamic(() => import('./heavy'), { ssr: false });

// ❌ WRONG - No code splitting
import { HeavyComponent } from './heavy';
```

### 4. Streaming & Suspense

```typescript
// ✓ CORRECT - Stream UI with Suspense
export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <SlowComponent />
    </Suspense>
  );
}

// ❌ WRONG - Blocking full page load
export async function Page() {
  const slowData = await slowQuery();
  return <div>{slowData}</div>;
}
```

### 5. Route Handlers vs Server Actions

```typescript
// ✓ CORRECT - Server Action for form
'use server';
export async function updateItem(formData: FormData) {
  // ...
}

// ❌ WRONG - Route Handler for form submission
// src/app/api/items/update/route.ts
export async function POST(request: NextRequest) {
  // ...
}
```

## Example Report

```
NEXT.JS 16 OPTIMIZATION REPORT

Next.js version: 16.1.6 ✓ (Latest)
App Router: ✓ In use
Patterns analyzed: 35 files

✓ STRENGTHS (15):
  - Server Components used by default
  - Strategic use of 'use client' (12 components only)
  - Dynamic imports for code splitting
  - Suspense boundaries on slow data
  - Server Actions pattern correct

⚠️ OPTIMIZATION OPPORTUNITIES (5):

1. src/app/(app)/page.tsx
   Issue: No Suspense boundary
   Current: Page waits for all queries
   Fix: Wrap slow queries in Suspense
   Expected: LCP improvement from 4.2s to 2.1s

2. src/app/dashboard/page.tsx
   Issue: Unnecessary data fetching in layout
   Current: Layout fetches user data
   Fix: Move to RootLayout with caching
   Expected: 3 fewer requests per navigation

3. src/components/ui/card.tsx
   Issue: Could be smaller Client Component
   Current: Uses 'use client' for small interactive feature
   Fix: Extract interactive logic to child component
   Expected: Better tree-shaking

4. Dynamic route: src/app/projects/[id]/page.tsx
   Issue: Missing generateStaticParams
   Current: All routes dynamic
   Fix: Pre-generate static routes
   Expected: Faster first load, reduced server load

5. src/app/api/webhooks/github/[projectId]/route.ts
   Issue: Route Handler instead of Server Action
   Current: Manual fetch from client
   Fix: Consider Server Action for mutation
   Expected: Simpler code, automatic error handling

🔴 CRITICAL (0):
   None - good job!

📊 METRICS:

Server Components: 28/33 (85%) ✓
'use client' usage: Appropriate (12)
Suspense usage: Moderate (6 boundaries)
Dynamic imports: Good (5 heavy components)
Route Handlers: Appropriate (external APIs)
Server Actions: Good pattern

Performance estimate:
  Current LCP: 4.2s
  With optimizations: 2.1s (50% improvement)
  Time to implement: 2-3 hours

RECOMMENDATIONS:

Priority 1 (This Sprint):
  - Add Suspense boundaries on slow queries
  - Implement generateStaticParams
  - Cache frequent queries

Priority 2 (Next Sprint):
  - Evaluate dynamic imports
  - Optimize image loading with next/image
  - Review data revalidation strategy

Next.js 16 Readiness: 92/100 (Excellent)
```

## Next.js 16 Best Practices

### Parallel Routes (Advanced)

```typescript
// src/app/@modal/page.ts
export default function Modal() {
  return <Modal />;
}

// src/app/layout.tsx
export default function Layout({ modal, children }) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
```

### Intercepting Routes

```typescript
// src/app/(.)projects/[id]/page.tsx
// Intercepts /projects/[id] when navigated from /dashboard
```

### Search Params & nuqs

```typescript
// ✓ CORRECT - Type-safe search params with nuqs
'use client';
import { useQueryState } from 'nuqs';

export function Filters() {
  const [page, setPage] = useQueryState('page', { defaultValue: '1' });
  return <Pagination page={parseInt(page)} onChange={p => setPage(String(p))} />;
}
```

## Integration

### Pre-deployment Checklist

```markdown
## Next.js 16

- [ ] Server Components used by default
- [ ] Suspense boundaries on slow queries
- [ ] Dynamic imports for heavy components
- [ ] generateStaticParams implemented
- [ ] Images optimized with next/image
- [ ] Route Handlers only for external APIs
- [ ] Server Actions for mutations
- [ ] Revalidation strategy defined
```

## Related Commands

- `.next/cache` — Build cache
- `next build` — Production build
- `next/image` — Image optimization
- `next/navigation` — Client-side routing
- `next/cache` — Data cache control

---

**Next.js 16 is fast by default. These optimizations make it faster.**
