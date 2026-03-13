# Contributing to Specdrivr

**Quick rule: If you're unsure, ask. If you're confident, ship it.**

This document gets you from zero to contributing quickly. No corporate bullshit, no 50-step processes.

---

## Getting Started

### Prerequisites

- Node.js v25.6.1 (use `.nvmrc` with nvm)
- pnpm v8.x+
- PostgreSQL 16
- Git with hooks enabled

### Setup

```bash
git clone https://github.com/{org}/specdrivr.git
cd specdrivr
nvm use          # Uses version from .nvmrc
pnpm install
```

### Database

```bash
cp .env.example .env.local
# Edit DATABASE_URL in .env.local
pnpm db:push
```

Verify everything works:

```bash
pnpm dev
```

Open http://localhost:3000. You should see the app.

---

## Development Workflow

### Branch Strategy

**Main branch**: `main` - Always deployable, protected
**Feature branches**: `feature/{descriptive-name}`
**Bugfix branches**: `fix/{issue-id}-{brief-description}`

Never commit directly to `main`. Always use a feature branch.

### Making Changes

1. **Create a branch**:
   ```bash
   git checkout -b feature/your-descriptive-name
   ```

2. **Make your changes**:
   - Edit source files directly
   - Never use temporary fix scripts
   - Follow existing code style
   - Update tests if needed

3. **Test your changes**:
   ```bash
   pnpm test          # Unit tests
   pnpm test:e2e      # E2E tests (if needed)
   pnpm lint          # Linting
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add new feature

   Brief explanation of what and why.

   Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
   ```

No commit hooks bypassing. Ever.

---

## Code Standards

### TypeScript

- **No `any` types**. Not a single one.
- Use explicit return types
- Use type guards instead of `as` casts
- Prefer interfaces for object shapes
- Prefer type aliases for unions/primitives

### Code Structure

- Repository pattern: Never import `db` directly in components
- Validation: Zod at every boundary
- Error handling: Always handle errors, never throw in server actions
- Logging: Use `logger` from `@/lib/logger.ts`, never `console.log`

### Component Architecture

- Server components by default
- Only use client components when interactivity is needed
- Never import Server Components into Client Components
- Use Suspense for streaming dynamic data
- Add Error boundaries at route segments

### Database

- Use Drizzle ORM, never raw SQL
- Wrap all methods in `executeQuery`
- Use transactions for multi-step writes
- Run `pnpm db:generate` after schema changes

### Testing

**Unit tests (Vitest):**
- Test business logic in repositories
- Mock external dependencies
- Target >80% coverage

**E2E tests (Playwright):**
- Use ARIA selectors
- Test critical user paths
- Mock external APIs

### Git Quality

**Commits:**
```bash
feat: add user authentication      # New feature
fix: resolve login redirect       # Bug fix
docs: update API documentation   # Documentation
refactor: simplify auth flow      # Code restructure
test: add auth unit tests         # Test additions
```

**Permanent rules:**
- Never `git commit --no-verify`
- Never `git config core.hooksPath /dev/null`
- Never modify hooks without updating checksums
- Always fix code, never bypass checks

---

## Submitting Changes

### Before PR

1. Rebase on latest main:
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. Run full verification:
   ```bash
   pnpm clean && pnpm install
   pnpm lint
   pnpm test
   pnpm build
   ```

### Create PR

Push your branch:
```bash
git push -u origin feature/your-descriptive-name
```

GitHub will guide you through the PR creation. Use the PR template.

### PR Requirements

**Fast track (can merge immediately):**
- README updates
- Comment additions
- Test additions
- Refactoring (no behavior change)

**Normal review required:**
- New features
- Bug fixes
- API changes
- Configuration changes

**Need detailed review:**
- Database schema changes
- Authentication changes
- Security-related changes

Always update documentation for user-visible changes.

---

## Getting Help

**Discord**: Join our server (#help channel)
**GitHub Issues**: Search existing issues first
**Discussions**: For questions and proposals

When asking for help:
- Show what you've tried
- Include error messages
- Link to relevant code
- Specify your environment

---

## Recognizing Contributions

We use the All Contributors specification. All contributions count:
- Code
- Documentation
- Testing
- Design
- Ideas
- Reviews
- Bug reports

Contributors are added to the README with their consent.

---

## Security

For security issues: **DO NOT** open a public issue. Email security@[domain].com with details.

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

<div align="center">

**Code quality is non-negotiable. Ship it right, ship it once.**

</div>
