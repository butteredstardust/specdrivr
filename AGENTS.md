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

### Build Failures
- Run `npx tsc --noEmit` to check TypeScript
- Check `next.config.mjs` for syntax errors
- Verify all imports resolve correctly
