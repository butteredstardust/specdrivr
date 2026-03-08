# Authentication Implementation Guide

## Overview

This document describes the authentication system for Specdrivr using **BetterAuth**.

**Why BetterAuth?**
- Type-safe with full TypeScript support
- Native Drizzle ORM adapter
- Modern, framework-agnostic architecture
- Feature-rich (2FA, organizations, rate limiting)
- Active development

## Architecture

```
src/
├── lib/
│   ├── auth/
│   │   ├── index.ts          # Main auth configuration
│   │   ├── client.ts         # Client-side auth instance
│   │   ├── schema.ts         # Auth database schema
│   │   └── roles.ts          # Role-based access control helpers
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...all]/
│   │           └── route.ts  # Auth API catch-all handler
│   └── login/
│       └── page.tsx          # Login page
│
└── middleware.ts              # Route protection
```

## Database Schema

### Added Tables

```typescript
// User sessions for authentication
export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  accountId: text('account_id').notNull().unique(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  providerId: text('provider_id').notNull(), // 'credentials', 'github', 'google'
  providerAccountId: text('provider_account_id'),
});

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  sessionToken: text('session_token').notNull().unique(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
});

export const verifications = pgTable('verifications', {
  id: serial('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
});
```

### Table Relationships

```
users (existing)
  ├── accounts (1:N)
  └── sessions (1:N)
```

## Environment Configuration

### Required Environment Variables

```bash
# BetterAuth configuration
BETTER_AUTH_SECRET=your-256-bit-secret          # Generate with: openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000           # Your app URL

# Admin credentials (for initial setup)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me-in-production          # Will be bcrypted

# OAuth Providers (Phase 2)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Environment Variables Schema

```typescript
export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().url(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});
```

## Core Implementation

### 1. Auth Configuration (`src/lib/auth/index.ts`)

```typescript
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: 'users',
      session: 'sessions',
      account: 'accounts',
      verification: 'verifications',
    },
  }),
  session: {
    cookieCache: {
      enabled: true,
    },
  },
  plugins: [
    // Add plugins here (2FA, organizations, etc.)
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;
```

### 2. Client Setup (`src/lib/auth/client.ts`)

```typescript
import { createAuthClient } from 'better-auth/client';

export const client = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL,
});

export const {
  signIn,
  signOut,
  session,
  useSession,
} = client;
```

### 3. Role-Based Access Control (`src/lib/auth/roles.ts`)

```typescript
export type UserRole = 'admin' | 'developer' | 'viewer';

export const roleHierarchy: Record<UserRole, number> = {
  viewer: 1,
  developer: 2,
  admin: 3,
};

export function hasRole(
  session: Session | null,
  requiredRoles: UserRole[]
): boolean {
  if (!session?.user) return false;
  const userRole = session.user.role as UserRole;
  return requiredRoles.some(
    (role) => roleHierarchy[userRole] >= roleHierarchy[role]
  );
}

export function requireRole(
  session: Session | null,
  requiredRoles: UserRole[]
): void {
  if (!hasRole(session, requiredRoles)) {
    throw new Error('Access forbidden: insufficient permissions');
  }
}
```

### 4. Middleware (`src/middleware.ts`)

```typescript
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const publicPaths = ['/login', '/api/auth/*'];

export async function middleware(request: NextRequest) {
  const session = await getSession();
  const path = request.nextUrl.pathname;

  if (publicPaths.some((p) => path.startsWith(p))) {
    return NextResponse.next();
  }

  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}
```

### 5. API Handler (`src/app/api/auth/[...all]/route.ts`)

```typescript
import { auth } from '@/lib/auth';

export const { GET, POST } = auth;
```

## API Endpoints

### Authentication Routes

BetterAuth handles all auth routes automatically:

```
POST /api/auth/sign-in         # Login
POST /api/auth/sign-up         # Register
POST /api/auth/sign-out        # Logout
GET  /api/auth/session         # Get session
POST /api/auth/forgot-password # Reset password (if enabled)
```

### Custom API Routes

```typescript
// GET current user
export async function GET() {
  const session = await getSession();
  return Response.json(session?.user ?? null);
}
```

## Usage Examples

### 1. Sign In

```typescript
import { client } from '@/lib/auth/client';

const result = await client.signIn.email({
  email: 'admin@example.com',
  password: 'password',
});

if (result.data) {
  // Successfully signed in
  console.log('Welcome:', result.user.name);
}
```

### 2. Sign Out

```typescript
const result = await client.signOut();
```

### 4. Use in API Routes

```typescript
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/auth/roles';

export async function GET(request: NextRequest) {
  const session = await getSession();
  requireRole(session, ['admin', 'developer']);
  // ... rest of route logic
}
```

### 5. Use in Components

```typescript
'use client';

import { useSession } from '@/lib/auth/client';

export function UserProfile() {
  const session = useSession();

  if (!session.data) {
    return <div>Please sign in</div>;
  }

  return <div>Welcome, {session.data.user.name}</div>;
}
```

## Installation & Setup

### Step 1: Install BetterAuth

```bash
npm install better-auth
```

### Step 2: Database Setup

```bash
npm run db:push
# Creates accounts, sessions, verifications tables
```

### Step 3: Environment Setup

```bash
cp .env.example .env.local
# Add BETTER_AUTH_SECRET and BETTER_AUTH_URL
```

### Step 4: Test

```bash
# Type check
npx tsc --noEmit

# Build
npm run build

# Start dev server
npm run dev

# Navigate to /login
```

## Security Checklist

- [ ] `BETTER_AUTH_SECRET` generated (32+ bytes random)
- [ ] `BETTER_AUTH_URL` points to app URL
- [ ] Sessions stored in database
- [ ] Middleware protects all routes
- [ ] Role-based access implemented
- [ ] OAuth secrets configured (phase 2)
- [ ] Environment variables validated
- [ ] TypeScript strict mode passes
- [ ] Production HTTPS required
- [ ] Rate limiting configured
- [ ] Session expiry configured

## Benefits vs Alternatives

### BetterAuth vs Lucia
- ✅ Built-in Drizzle adapter
- ✅ More features out of box
- ✅ Simpler API
- ⚠️ Newer, smaller community

### BetterAuth vs Clerk
- ✅ Open source & free
- ✅ Own your data
- ✅ Customizable
- ❌ Requires more setup
- ❌ No managed infrastructure

### BetterAuth vs NextAuth
- ✅ Works in your environment
- ✅ More modern
- ✅ Better Drizzle support
- ⚠️ Less battle-tested

## Next Steps

### Phase 2: OAuth Implementation

Add GitHub and Google OAuth providers:

1. Register OAuth apps
2. Add to `src/lib/auth/index.ts`
3. Update environment variables

### Phase 3: Advanced Features

- Two-factor authentication (2FA)
- Password reset
- Email verification
- Organizations/multi-tenant
- Rate limiting customization

### Phase 4: Testing

- Unit tests for auth helpers
- Integration tests for API routes
- E2E tests for full login flow
- Security penetration testing

## Maintenance

### Keeping Updated

```bash
npm outdated better-auth  # Check for updates
npm update better-auth    # Update to latest
```

### Database Migrations

When updating BetterAuth, check for schema changes:

```bash
npm run db:generate
npm run db:push
```

## Troubleshooting

### Common Issues

**Issue**: Type errors in auth callbacks
**Solution**: Ensure proper types are imported

**Issue**: Database connection fails
**Solution**: Verify DATABASE_URL and Drizzle setup

**Issue**: Sessions not persisting
**Solution**: Check cookie settings and session table

**Issue**: API routes not protected
**Solution**: Verify middleware.ts configuration

## Resources

- [BetterAuth Documentation](https://better-auth.com)
- [Drizzle ORM Integration](https://better-auth.com/docs/adapters/drizzle)
- [Next.js Integration](https://better-auth.com/docs/examples/nextjs)
- [Type Safety Guide](https://better-auth.com/docs/typescript)

---

**Last Updated**: 2026-03-08
**Version**: 1.0
**Auth Library**: BetterAuth
**Maintainer**: Specdrivr Team
