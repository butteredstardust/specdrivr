# Agent Documentation

## Agent Types & Usage Patterns

### **explore** - Use for codebase discovery
**When to use:**
- Finding files by patterns (e.g., "src/components/**/*.tsx")
- Searching for keywords across codebase
- Understanding architecture or patterns
- Investigating unfamiliar code

**Thoroughness levels:**
- `quick` - Basic search for common patterns
- `medium` - Moderate exploration across multiple locations
- `very thorough` - Comprehensive analysis with all naming conventions

**Example usage:**
- "Find all API route handlers"
- "Explore the authentication implementation"
- "Very thorough search for error handling patterns"

### **Plan** - Use for implementation strategy
**When to use:**
- Multi-file changes (3+ files)
- Architectural decisions
- Unclear requirements
- Multiple valid approaches

**When NOT to use:**
- Single-line fixes
- Obvious implementations
- Research-only tasks

### **claude-code-guide** - Use for Claude Code questions
**When to use:**
- Questions about Claude Code CLI features
- MCP servers configuration
- IDE integrations
- Agent SDK usage

### **general-purpose** - Use for complex multi-step tasks
**When to use:**
- Complex research across multiple areas
- Tasks requiring both search and implementation
- When simple searches aren't enough

## Common Workflows

### Adding a New Feature
1. **Explore** - Understand existing patterns
2. **Plan** - Design implementation approach
3. **Implement** - Code changes
4. **Simplify** - Review for quality

### Debugging
1. **Explore** - Find relevant code
2. Read files directly - Quick investigation
3. **tests-run** - Verify fix

### Code Review
Use **simplify** agent after completing changes to:
- Check for code reuse opportunities
- Identify quality issues
- Verify efficiency

## Project-Specific Patterns

### Directory Structure
```
src/
├── app/              # Next.js App Router
├── components/       # React components
│   └── ui/          # shadcn/ui components
├── lib/             # Utilities, helpers
├── repositories/    # Data access layer
└── db/              # Database schema

```

### Key Conventions
- Server Components by default, `"use client"` only when needed
- Repository pattern for all database access
- API routes in `src/app/api/`
- Validation schemas in `src/lib/schemas.ts`
- Error classes in `src/lib/errors.ts`

### Testing
- **Unit tests:** Vitest in `tests/` directory
- **E2E tests:** Playwright in `tests/e2e/`
- **Naming:** `*.test.ts` for unit, `*.spec.ts` for E2E

### Git Workflow
- Start with main branch
- Create feature branches for changes
- Use worktrees for experimental work
- Always run tests before commits

## Agent Prompting Best Practices

### Be Specific
❌ Bad: "fix the bug"
✅ Good: "fix the TypeScript error in src/app/page.tsx line 45 where Project type is missing the mission field"

### Provide Context
Include:
- File paths
- Error messages
- Expected behavior
- Recent changes that might be relevant

### Use Named Tools
❌ Bad: "search for button component"
✅ Good: Use **explore** agent with "Search for button components in src/components/"

### Set Expectations
Clarify:
- Do you want research only?
- Do you want implementation?
- Do you want tests?

## Project Architecture

### Tech Stack
- **Framework:** Next.js 16 App Router
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4 with shadcn/ui
- **Database:** PostgreSQL with Drizzle ORM
- **Testing:** Vitest + Playwright

### Design Patterns
- **Repository Pattern:** All DB access through repositories
- **Error Boundaries:** Global and route-level error handling
- **Validation:** Zod schemas for all inputs
- **Type Safety:** No `any` types, explicit interfaces

### Security
- Environment variable validation with Zod
- Input validation on all API routes
- Security headers configured
- No sensitive data in logs

## Common Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Run ESLint

# Database
npm run db:generate  # Generate migrations
npm run db:push      # Push schema changes
npm run db:studio    # Drizzle Studio

# Testing
npm run test:unit    # Unit tests
npm run test:e2e     # E2E tests
npm run test         # All tests
```

## Troubleshooting

### TypeScript Errors
- Check `as any` casts - should use type guards instead
- Verify strict mode compliance
- Check for missing type imports

### ESLint Errors
- No unused variables
- No explicit `any` types
- Prefer `const` over `let`
- No empty object type interfaces

### Database Issues
- Check `DATABASE_URL` environment variable
- Run `npm run db:push` to sync schema
- Verify migrations in `drizzle/` directory

## Tech Stack Best Practices

This section documents best practices for the key technologies used in this project.

### Tailwind CSS v4

**CSS-First Configuration**
- All Tailwind configuration occurs in `src/app/globals.css` using CSS-first syntax
- Import Tailwind with `@import "tailwindcss";` at the top of globals.css
- Use `@custom-variant dark (&:is(.dark *));` for dark mode variants
- Do NOT use `tailwind.config.js` (v4 is CSS-first)

**Design Tokens**
- All colors use OKLCH color space for better color perception
- Always use CSS variables from `:root` and `.dark` selectors
- Use provided CSS variables: `--background`, `--foreground`, `--primary`, `--secondary`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`
- Never use hardcoded hex colors in components (use `var(--color-name)`)

**Utility Patterns**
```css
/* Good - using CSS variables */ .button { background: var(--primary); }

/* Bad - hardcoded colors */ .button { background: #0000ff; }
```

- Use Tailwind utility classes in JSX: `className="bg-primary text-primary-foreground"`
- For responsive design, use mobile-first approach: `className="text-sm md:text-lg"
- State variants: `hover:bg-primary/90`, `focus:outline-none`, `disabled:opacity-50`

**Common Anti-Patterns**
- ❌ Creating custom CSS files for components (use Tailwind utilities)
- ❌ Using arbitrary values like `w-[400px]` (use scale or add to design tokens)
- ❌ Using `@apply` directive (prefer composition in JSX)
- ❌ Hardcoding colors (use CSS variables)

**Component Composition**
- Compose utility classes rather than creating custom classes
- Use `cn()` utility for conditional class composition
- For complex components, extract to reusable components with props
- Follow shadcn/ui patterns for component structure

### React/Next.js 16 Patterns

**Server Components by Default**
- All components are Server Components unless they need interactivity
- Add `"use client"` directive ONLY when needed:
  - Event handlers (`onClick`, `onChange`, etc.)
  - Browser APIs (`localStorage`, `window`, etc.)
  - React Hooks (`useState`, `useEffect`, `useRef`, etc.)
  - Third-party libraries requiring client-side execution

**Client Component Boundaries**
```tsx
"use client"; // Top of file

import { useState } from 'react';

export function InteractiveComponent() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**Data Fetching Strategies**
- Server Components: Direct async database calls, repository methods
- Never use `useEffect` for data fetching in Server Components
- Prefetch data in page components and pass as props
- For real-time data, use API routes with client-side fetching

**Props Drilling Alternatives**
- Use React Context for global state (themes, user)
- Pass complete objects rather than individual props
- For deeply nested props, consider Context or composition
- Type all props with explicit TypeScript interfaces

**Error Boundaries**
- Implement error.tsx for route-specific error handling
- Implement global-error.tsx for global errors
- Never swallow errors - log and display user-friendly messages
- Use try/catch in Server Components with proper error boundaries

**Loading States**
- Default to Server Component data fetching
- Use React Suspense for streaming
- Create loading.tsx for route-based loading states
- Use skeleton components for better UX

**useEffect Guidelines**
❌ **Never** "useEffect for data fetching"
✅ **Use** useEffect for:
- Browser API integration (resize, scroll, keyboard)
- Cleanup logic (event listeners, timers)
- Side effects that must run after render
- Client-only DOM manipulations

### PostgreSQL & Drizzle ORM

**Schema Design**
- Use PascalCase for table names: `pgTable('ProjectSpecification')`
- Always use singular table names: `projects` not `project`
- Define enums with `pgEnum`: `export const statusEnum = pgEnum('status', ['active', 'archived'])`
- Use appropriate types: `text()` for long strings, `varchar()` for fixed-length
- Always include timestamps: `createdAt: timestamp('created_at').defaultNow()`

**Migration Management**
- Never modify existing migration files - always create new ones
- Use `npm run db:generate` to create migrations
- Use `npm run db:push` for development sync
- Use `npm run db:migrate` for production
- Test migrations in staging before production

**Query Patterns**
```typescript
// Select all
const all = await db.select().from(table);

// Select with where
const filtered = await db.select()
  .from(table)
  .where(eq(table.id, id));

// Insert with returning
const [created] = await db.insert(table)
  .values(data)
  .returning();

// Update
await db.update(table)
  .set({ name: newName })
  .where(eq(table.id, id));

// Delete
await db.delete(table)
  .where(eq(table.id, id));
```

**Repository Pattern**
- Always use repositories for data access (never direct db calls in components)
- Create base-repository.ts for common operations
- One repository per major table/resource
- Implement type-safe methods for each operation
- Handle errors consistently with custom error types

**Connection & Performance**
- Use connection pooling (configured in db/index.ts)
- Add indexes for frequently queried columns
- Use `.select({ field: table.field })` to fetch only needed columns
- Implement pagination for large datasets
- Consider denormalization for read-heavy operations

### shadcn/ui Component Library

**Adding Components**
- Use `npx shadcn@latest add component-name` to add components
- Components install to `src/components/ui/`
- Never modify shadcn/ui component internals directly
- Customization happens via props and wrapper components

**Customization Boundaries**
- ✅ **Do customize**: colors via CSS variables, spacing, minor variants
- ✅ **Do create wrappers**: Add logic, compose multiple shadcn components
- ❌ **Don't modify**: Component internals, remove accessibility features
- ❌ **Don't fork**: Copy-paste shadcn components for minor changes

**Theme Consistency**
- All shadcn components use CSS variables by default
- Changes to `:root` variables affect all components
- Use component variants (`variant="outline"`, `size="sm"`)
- Create custom variants by extending the cva config, then update `src/components/ui` path

**Component Composition**
```tsx
// Combine multiple shadcn components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function CustomCard() {
  return (
    <Card>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  );
}
```

**Radix UI Primer**
- shadcn/ui components are built on Radix UI primitives
- Understand Radix patterns: `asChild`, `forwardRef`, compound components
- Accessibility is built-in (keyboard navigation, ARIA attributes)
- Use Radix utilities: `Slot`, `Primitive`, `createContext`

### Base UI Headless Components

**When to Use Base UI**
- Building completely custom components not in shadcn/ui
- Need full control over markup and styling
- Creating complex interactive components
- Prototyping new patterns before contributing to shadcn/ui

**Building Custom Components**
```tsx
import * as Base from '@base-ui/react';
import { cn } from '@/lib/utils';

export function CustomAccordion() {
  return (
    <Base.Accordion.Root>
      <Base.Accordion.Item>
        <Base.Accordion.Header>
          <Base.Accordion.Trigger className={cn('custom-classes')}>
            Title
          </Base.Accordion.Trigger>
        </Base.Accordion.Header>
        <Base.Accordion.Content>
          Content
        </Base.Accordion.Content>
      </Base.Accordion.Item>
    </Base.Accordion.Root>
  );
}
```

**Composition Patterns**
- Base UI uses compound component pattern
- Access sub-components with dot notation
- Style each part independently with Tailwind classes
- Use `cn()` utility for conditional classes

**Accessibility Requirements**
- Manually add ARIA attributes for custom components
- Implement keyboard navigation
- Follow WAI-ARIA guidelines for complex widgets
- Test with screen readers

**Styling Headless Components**
```tsx
// Use Tailwind classes directly on Base UI components
<Base.Dialog.Root>
  <Base.Dialog.Trigger className="rounded-md bg-primary px-4 py-2">
    Open Dialog
  </Base.Dialog.Trigger>
  <Base.Dialog.Portal>
    <Base.Dialog.Overlay className="fixed inset-0 bg-black/50" />
    <Base.Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card p-6 rounded-lg">
      Dialog content
    </Base.Dialog.Content>
  </Base.Dialog.Portal>
</Base.Dialog.Root>
```

**Complex Component Examples**
- File upload with drag-and-drop
- Data grid with sorting/filtering
- Date range picker
- Multi-step forms
- Custom dropdowns with virtualization

### Theme System & Dark Mode

**CSS Variable Design System**
- All colors defined in `src/app/globals.css`
- Light theme in `:root` selector
- Dark theme in `.dark` selector
- Use OKLCH color space: `oklch(0.58 0.22 27)`
- Alpha values: `oklch(1 0 0 / 10%)`

**Color Variables Reference**
```css
--background: Main page background
--foreground: Main text color
--card: Card background
--card-foreground: Card text
--popover: Popover/dropdown background
--primary: Primary brand color
--primary-foreground: Text on primary
--secondary: Secondary/gray background
--accent: Accent/highlight color
--destructive: Error/danger color
--border: Border color
--input: Input field border
--ring: Focus ring color
```

**next-themes Integration**
- Install: `npm install next-themes`
- Wrap app in `<ThemeProvider>` in `src/app/layout.tsx`
- Use `useTheme()` hook to access theme state:

```tsx
'use client';

import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle theme
    </button>
  );
}
```

**Theme-Aware Components**
- Components automatically adapt to light/dark themes
- Use CSS variables for all colors
- Test both themes when creating components
- Theme transition is instant (no flashing)

**Theme Switching UI Patterns**
```tsx
// Dropdown menu
<DropdownMenu>
  <DropdownMenuItem onClick={() => setTheme('light')}>
    Light
  </DropdownMenuItem>
  <DropdownMenuItem onClick={() => setTheme('dark')}>
    Dark
  </DropdownMenuItem>
  <DropdownMenuItem onClick={() => setTheme('system')}>
    System
  </DropdownMenuItem>
</DropdownMenu>

// Toggle switch
<Switch
  checked={theme === 'dark'}
  onCheckedChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
/>
```

**System Preference Detection**
- `next-themes` automatically detects OS preference
- Use `respectPrefersColorScheme` option
- Override with explicit user choice
- Persist user preference in localStorage

**Theme Persistence**
- Theme is automatically persisted between sessions
- Stored in `localStorage` as `theme`
- Can be overridden with custom `defaultTheme`
- Hydration-safe (no server/client mismatch)

### UI Library Ecosystem

**Lucide Icons**
- Import icons as React components: `import { Plus, Trash2 } from 'lucide-react'`
- Icons support className: `<Plus className="h-4 w-4" />`
- Use consistent sizing: `h-4 w-4` (small), `h-5 w-5` (medium), `h-6 w-6` (large)
- Icons inherit current color by default
- Don't wrap icons in components (use directly)

**Sonner Notifications**
```tsx
import { toast } from 'sonner';

// Success
toast.success('Project created successfully');

// Error with action
toast.error('Failed to save', {
  action: {
    label: 'Retry',
    onClick: () => retrySave(),
  },
});

// Loading
toast.loading('Processing...');

// Custom JSX
toast(
  <div className="flex items-center gap-2">
    <CheckCircle className="h-4 w-4" />
    <span>Custom toast content</span>
  </div>
);
```

**dnd-kit Drag-and-Drop**
- Use `@dnd-kit/core` for basic drag operations
- Use `@dnd-kit/sortable` for sortable lists
- Always wrap in `<DndContext>` provider
- Use sensors for better UX: `useSensor, useSensors, PointerSensor`
- Transform styles for smooth animations
- A11y support with keyboard controls

```tsx
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

<DndContext collisionDetection={closestCenter}>
  <SortableContext items={items} strategy={verticalListSortingStrategy}>
    {items.map(item => <SortableItem key={item.id} id={item.id} />)};
  </SortableContext>
</DndContext>
```

**Third-Party Component Theming**
- Wrap third-party components that need theming
- Pass theme context through props if needed
- Style with Tailwind classes
- Use CSS variables for colors
- Example: See `src/components/ui/sonner.tsx`

**Color Palette Management**
- Primary palette uses OKLCH values
- Keep color palette minimal (5-7 colors)
- Use HSL/OKLCH for easy saturation/brightness adjustments
- Document color usage conventions
- Use color palette generator tools

**Animation & Transitions**
- Use CSS transitions with Tailwind: `transition-colors`, `duration-200`
- For complex animations, use Framer Motion
- Keep animations subtle and purposeful
- Respect user preferences: `prefers-reduced-motion`
- Animation examples:
  ```css
  transition: background-color 0.2s ease-in-out;
  animation: fadeIn 0.3s ease-out;
  ```
