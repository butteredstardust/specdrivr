# Specdrivr

Simple AI-native orchestration platform demo.

## Setup

### Prerequisites

- Node.js v25.6.1 (use .nvmrc with nvm)
- pnpm v8.x or higher
- PostgreSQL 16

### Node Version Management

We use [nvm](https://github.com/nvm-sh/nvm) to manage Node versions.

After installing nvm:

```bash
nvm use  # Uses version from .nvmrc
pnpm install
```

### Steps

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Set up database:

   ```bash
   # Copy .env.example to .env.local and configure DATABASE_URL
   pnpm db:push
   ```

3. Run development server:
   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Documentation

- [Development Best Practices](documentation/DEVELOPMENT.md) - Code standards, patterns, and conventions
- [Agent Documentation](AGENTS.md) - How to use Claude Code agents
- [CLAUDE.md](CLAUDE.md) - Claude-specific behavior guidelines
- [Product Specification](documentation/README.md) - Complete product specification covering architecture, APIs, design system, and more

## Development Notes

**Important**: Always make changes directly to source files through proper editing and version control workflows. Do not use or commit temporary fix scripts (e.g., `fix.mjs`, `fix*.mjs`) that modify source files programmatically. Such scripts bypass proper code review, testing, and version control best practices.

## Key Features

- Repository pattern for data access
- Comprehensive error handling
- API routes with validation
- TypeScript strict mode enforcement
- ESLint with strict rules
- Security headers configured
- Zero `any` types
- No emojis in code
  // dummy
  // dummy
