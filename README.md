# Specdrivr

Simple AI-native orchestration platform demo.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up database:
   ```bash
   # Copy .env.example to .env.local and configure DATABASE_URL
   npm run db:push
   npm run db:seed  # Optional: seed demo data
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Documentation

- [Development Best Practices](DEVELOPMENT.md) - Code standards, patterns, and conventions
- [Agent Documentation](AGENTS.md) - How to use Claude Code agents
- [CLAUDE.md](CLAUDE.md) - Claude-specific behavior guidelines

## Key Features

- Repository pattern for data access
- Comprehensive error handling
- API routes with validation
- TypeScript strict mode enforcement
- ESLint with strict rules
- Security headers configured
- Zero `any` types
- No emojis in code
