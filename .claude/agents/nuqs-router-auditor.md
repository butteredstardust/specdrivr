---
name: nuqs-router-auditor
description: Audit Nuqs search parameters for type safety and URL state management
type: subagent
user-invocable: true
---

# Nuqs Router Auditor Agent

**Purpose:** Ensure search parameters are type-safe and URL state is managed correctly.

**Invocation:** Code review or when adding filters/pagination

**Speed:** ~1.5 min

## How to Use

```bash
claude agent nuqs-router-auditor "Check search params in filters"
claude agent nuqs-router-auditor "Validate URL state management"
```

## What It Checks

### 1. Type-Safe Query Parameters

```typescript
// ✓ CORRECT - Type-safe with Nuqs
'use client';
import { useQueryState } from 'nuqs';
import { parseAsString, parseAsInteger, parseAsArrayOf } from 'nuqs/server';

export function ProjectFilters() {
  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''));
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [tags, setTags] = useQueryState('tags', parseAsArrayOf(parseAsString));

  return (
    <>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search projects..."
      />
      <Pagination page={page} onPageChange={setPage} />
    </>
  );
}

// ❌ WRONG - Manual URL parsing (untyped)
export function ProjectFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const handleSearch = (value: string) => {
    router.push(`?search=${encodeURIComponent(value)}`);
  };
}
```

### 2. Consistent Parameter Names

```typescript
// ✓ CORRECT - Consistent, semantic names
const SEARCH_PARAMS = {
  search: 'search',
  page: 'page',
  sort: 'sort',
  filter: 'filter',
  tags: 'tags',
  status: 'status',
} as const;

export function useFilters() {
  const [search, setSearch] = useQueryState(SEARCH_PARAMS.search);
  const [page, setPage] = useQueryState(SEARCH_PARAMS.page, parseAsInteger.withDefault(1));
  const [sort, setSort] = useQueryState(SEARCH_PARAMS.sort);
}

// ❌ WRONG - Inconsistent parameter names
const [search, setSearch] = useQueryState('q'); // different name
const [page, setPage] = useQueryState('p'); // abbreviated
const [sortBy, setSortBy] = useQueryState('sort_by'); // mixed naming
```

### 3. Default Values and Validation

```typescript
// ✓ CORRECT - Defaults and validation
const SORT_OPTIONS = ['newest', 'oldest', 'popular'] as const;

export function useSortParam() {
  const [sort, setSort] = useQueryState('sort', parseAsString.withDefault('newest'));

  const isValidSort = SORT_OPTIONS.includes(sort as any);

  return {
    sort: isValidSort ? sort : 'newest',
    setSort,
  };
}

// ❌ WRONG - No defaults or validation
const [sort, setSort] = useQueryState('sort');
// sort could be undefined or invalid value
```

### 4. Array Parameters (Multi-Select)

```typescript
// ✓ CORRECT - Array parsing with type safety
'use client';
import { useQueryState } from 'nuqs';
import { parseAsArrayOf, parseAsString } from 'nuqs/server';

export function TagFilter() {
  const [tags, setTags] = useQueryState(
    'tags',
    parseAsArrayOf(parseAsString)
  );

  return (
    <div>
      {TAG_OPTIONS.map((tag) => (
        <label key={tag}>
          <input
            type="checkbox"
            checked={tags?.includes(tag) ?? false}
            onChange={(e) => {
              if (e.target.checked) {
                setTags([...(tags ?? []), tag]);
              } else {
                setTags(tags?.filter(t => t !== tag) ?? []);
              }
            }}
          />
          {tag}
        </label>
      ))}
    </div>
  );
}

// ❌ WRONG - Manual array string parsing
const tagsString = searchParams.get('tags') || '';
const tags = tagsString.split(',');
// Type unsafe, no validation
```

### 5. Shallow Routing

```typescript
// ✓ CORRECT - Shallow routing to avoid re-renders
'use client';
import { useQueryState } from 'nuqs';

export function Pagination() {
  const [page, setPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1)
  );

  // URL changes without full page reload
  const goToPage = async (newPage: number) => {
    await setPage(newPage);
  };

  return <PaginationControls onPageChange={goToPage} />;
}

// ❌ WRONG - Full navigation causing unnecessary re-renders
const router = useRouter();
const handlePageChange = (page: number) => {
  router.push(`?page=${page}`);  // Re-renders entire page
};
```

### 6. Server-Side Access

```typescript
// ✓ CORRECT - Read search params on server
'use server';
export async function getFilteredProjects(
  searchParams: { search?: string; page?: string }
) {
  const search = searchParams.search || '';
  const page = parseInt(searchParams.page || '1');

  const projects = await db.query.projects.findMany({
    where: like(projects.name, `%${search}%`),
    offset: (page - 1) * 20,
    limit: 20,
  });

  return projects;
}

// In page.tsx
export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const params = await searchParams;
  const projects = await getFilteredProjects(params);
  return <ProjectList projects={projects} />;
}

// ❌ WRONG - Client-side filtering (slow)
'use client';
export function ProjectList() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(setProjects);
  }, []);

  const filtered = projects.filter(p => p.name.includes(search));
}
```

### 7. Sync Multiple Params

```typescript
// ✓ CORRECT - Batch URL updates
'use client';
export function FilterPanel() {
  const [search, setSearch] = useQueryState('search');
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));

  const handleSearch = async (value: string) => {
    // Reset page when search changes
    await setSearch(value);
    await setPage(1);  // Or use startTransition
  };

  return (
    <input
      value={search}
      onChange={(e) => handleSearch(e.target.value)}
    />
  );
}

// ❌ WRONG - Independent updates causing multiple URL changes
const handleSearch = (value: string) => {
  setSearch(value);
  setPage(1);  // Can cause race condition
};
```

## Report Includes

- Manual URL parameter parsing instead of Nuqs
- Untyped search parameters
- Missing defaults for optional params
- Inconsistent parameter naming
- No validation of parameter values
- Array parameters not properly encoded
- Full page navigation instead of shallow routing
- Missing server-side param access
- Type safety issues with search params

## Integration

Create `src/lib/searchParams.ts`:

```typescript
import { parseAsString, parseAsInteger, parseAsArrayOf } from 'nuqs/server';

export const SEARCH_PARAMS = {
  search: 'search',
  page: 'page',
  sort: 'sort',
  status: 'status',
  tags: 'tags',
} as const;

export const searchParamsParsers = {
  search: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
  sort: parseAsString.withDefault('newest'),
  status: parseAsString,
  tags: parseAsArrayOf(parseAsString),
} as const;
```

Use in pages:

```typescript
import { searchParamsParsers } from '@/lib/searchParams';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const params = await searchParams;
  // Type-safe access via parsers
}
```

## URL State Best Practices

- **Queryable State**: Page, filters, sort, search
- **Not Queryable**: Modal state, temporary selections
- **Defaults**: Sensible defaults for all params
- **Validation**: Only accept known values
- **Shallow**: Use Nuqs for efficient updates
- **Server-Safe**: Accessible in Server Components

---

**Nuqs makes URL state type-safe. Use it everywhere.**
