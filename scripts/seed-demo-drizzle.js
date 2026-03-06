#!/usr/bin/env node

/**
 * Seed demo data into the database using Drizzle ORM
 * Usage: npm run seed:demo
 *
 * Inserts 3 realistic demo projects with specs, plans, tasks, test results, and agent logs.
 * All users have password: demo
 */

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const postgres = require('postgres');

async function seedDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set. Please check .env.local file.');
    process.exit(1);
  }

  const sql = postgres(process.env.DATABASE_URL);

  try {
    console.log('🌱 Seeding demo data...');
    console.log(`   Database: ${process.env.DATABASE_URL.split('@')[1] || '...'}`);

    // =========================================================================
    // CLEAR existing data in dependency order
    // =========================================================================
    console.log('\n⏳ Clearing existing data...');
    await sql`TRUNCATE TABLE agent_logs RESTART IDENTITY CASCADE`;
    await sql`TRUNCATE TABLE test_results RESTART IDENTITY CASCADE`;
    await sql`TRUNCATE TABLE tasks RESTART IDENTITY CASCADE`;
    await sql`TRUNCATE TABLE plans RESTART IDENTITY CASCADE`;
    await sql`TRUNCATE TABLE specifications RESTART IDENTITY CASCADE`;
    await sql`TRUNCATE TABLE git_commits RESTART IDENTITY CASCADE`;
    await sql`TRUNCATE TABLE api_request_logs RESTART IDENTITY CASCADE`;
    await sql`TRUNCATE TABLE agent_tokens RESTART IDENTITY CASCADE`;
    await sql`TRUNCATE TABLE projects RESTART IDENTITY CASCADE`;
    await sql`TRUNCATE TABLE users RESTART IDENTITY CASCADE`;
    console.log('   ✓ Cleared all tables');

    // =========================================================================
    // USERS — password for all: "demo"
    // Bcrypt hash (rounds=10): $2b$10$mLoZVx06uun0YyLlrf82I.y15n8ogOyirqeI/hQVP6BwcHLNHuf62
    // =========================================================================
    console.log('\n👤 Inserting users...');
    const HASH = '$2b$10$mLoZVx06uun0YyLlrf82I.y15n8ogOyirqeI/hQVP6BwcHLNHuf62';

    const [adminUser] = await sql`
      INSERT INTO users (username, password_hash, avatar_id, is_active, is_admin, role, created_at, updated_at)
      VALUES ('Admin', ${HASH}, 1, true, true, 'admin', NOW(), NOW())
      RETURNING id`;

    const [johnUser] = await sql`
      INSERT INTO users (username, password_hash, avatar_id, is_active, is_admin, role, created_at, updated_at)
      VALUES ('John', ${HASH}, 2, true, false, 'developer', NOW(), NOW())
      RETURNING id`;

    const [amyUser] = await sql`
      INSERT INTO users (username, password_hash, avatar_id, is_active, is_admin, role, created_at, updated_at)
      VALUES ('Amy', ${HASH}, 3, true, false, 'developer', NOW(), NOW())
      RETURNING id`;

    await sql`
      INSERT INTO users (username, password_hash, avatar_id, is_active, is_admin, role, created_at, updated_at)
      VALUES ('Brett', ${HASH}, 4, true, false, 'viewer', NOW(), NOW())`;

    const adminId = adminUser.id;
    const johnId = johnUser.id;
    const amyId = amyUser.id;
    console.log(`   ✓ 4 users created (Admin id=${adminId}, John id=${johnId}, Amy id=${amyId})`);

    // =========================================================================
    // PROJECT 1 — E-Commerce Platform (by Admin)
    // =========================================================================
    console.log('\n📦 Inserting Project 1: E-Commerce Platform...');

    const [proj1] = await sql`
      INSERT INTO projects (name, mission, description, constitution, tech_stack, base_path, agent_status, status, created_by_user_id, created_at, updated_at)
      VALUES (
        'ShopFlow — E-Commerce Platform',
        'Build a high-performance e-commerce platform with AI-powered product recommendations',
        'A full-stack marketplace for small businesses to sell products online with modern checkout, inventory management, and analytics.',
        ${`# ShopFlow E-Commerce Platform

## Mission
Build a fast, reliable, and conversion-optimised e-commerce platform that empowers small businesses.

## Core Values
- **Developer Experience**: Clean APIs and well-documented code
- **Performance**: Sub-2s page loads, optimistic UI updates
- **Reliability**: 99.9% uptime SLA with graceful degradation
- **Security**: PCI-DSS compliant payment handling

## Technical Philosophy
Use server components for static content, client components for interactivity.
Prefer Stripe for payments — never store raw card data.
`},
        ${'{"frontend":"Next.js 14 App Router","backend":"API Routes + Server Actions","database":"PostgreSQL 16","orm":"Drizzle","auth":"NextAuth.js","payments":"Stripe","search":"Algolia","email":"Resend","storage":"Cloudflare R2"}'},
        '/projects/shopflow',
        'idle',
        'active',
        ${adminId},
        NOW() - INTERVAL '45 days',
        NOW() - INTERVAL '2 hours'
      )
      RETURNING id`;

    const proj1Id = proj1.id;

    const [spec1v1] = await sql`
      INSERT INTO specifications (project_id, content, version, is_active, created_by_user_id, created_at, updated_at)
      VALUES (
        ${proj1Id},
        ${`# ShopFlow — Product Specification v1.0

## Overview
ShopFlow is a multi-vendor marketplace where small businesses create storefronts and sell physical/digital products.

## Core Features

### Storefront
- Customisable branded storefronts per merchant
- Product catalogue with categories, tags and search
- Wishlist and recently viewed products
- Mobile-first responsive design

### Checkout
- Guest checkout and registered account checkout
- Stripe payment processing (cards, Apple Pay, Google Pay)
- Address autocomplete via Google Places API
- Real-time stock validation during checkout

### Inventory Management
- Product variants (size, colour, material)
- Low-stock alerts via email/webhook
- Bulk CSV import/export
- Barcode/SKU management

### Analytics Dashboard
- Revenue trends, conversion rates, AOV
- Top products by revenue and units sold
- Geographic sales heatmap
- Abandoned cart recovery metrics

## Technical Architecture
- Next.js 14 App Router with streaming SSR
- Drizzle ORM with connection pooling (PgBouncer)
- Stripe webhooks for payment lifecycle events
- Bull queues for async tasks (email, stock sync)
- Cloudflare R2 for product image storage
`},
        '1.0',
        true,
        ${adminId},
        NOW() - INTERVAL '44 days',
        NOW() - INTERVAL '44 days'
      )
      RETURNING id`;

    const spec1Id = spec1v1.id;

    const [plan1] = await sql`
      INSERT INTO plans (spec_id, architecture_decisions, intent, status, created_by_user_id, created_at)
      VALUES (
        ${spec1Id},
        ${'{"database":{"orm":"Drizzle ORM","pool":"PgBouncer","migrations":"drizzle-kit"},"frontend":{"routing":"App Router","state":"React Query + Zustand","ui":"shadcn/ui + Tailwind"},"payments":{"provider":"Stripe","webhooks":true,"3ds":true},"deployment":{"platform":"Vercel","cdn":"Cloudflare","monitoring":"Sentry"}}'},
        'Deliver MVP with product listings, cart, checkout and basic merchant dashboard',
        'active',
        ${adminId},
        NOW() - INTERVAL '43 days'
      )
      RETURNING id`;

    const plan1Id = plan1.id;

    // Tasks for plan1
    const [task1_1] = await sql`
      INSERT INTO tasks (plan_id, description, status, priority, files_involved, created_at, updated_at)
      VALUES (
        ${plan1Id},
        'Design and implement database schema: products, variants, orders, order_items, merchants',
        'done',
        1,
        ${'{"files":["src/db/schema.ts","drizzle/migrations/0001_products.sql","drizzle/migrations/0002_orders.sql"]}'},
        NOW() - INTERVAL '43 days',
        NOW() - INTERVAL '38 days'
      )
      RETURNING id`;

    const [task1_2] = await sql`
      INSERT INTO tasks (plan_id, description, status, priority, dependency_task_id, files_involved, created_at, updated_at)
      VALUES (
        ${plan1Id},
        'Build product listing pages with SSR and Algolia search integration',
        'done',
        1,
        ${task1_1.id},
        ${'{"files":["src/app/(shop)/products/page.tsx","src/app/(shop)/products/[slug]/page.tsx","src/lib/algolia.ts"]}'},
        NOW() - INTERVAL '38 days',
        NOW() - INTERVAL '30 days'
      )
      RETURNING id`;

    const [task1_3] = await sql`
      INSERT INTO tasks (plan_id, description, status, priority, dependency_task_id, files_involved, created_at, updated_at)
      VALUES (
        ${plan1Id},
        'Implement cart with optimistic UI updates and session persistence',
        'done',
        1,
        ${task1_2.id},
        ${'{"files":["src/store/cart.ts","src/components/cart/CartDrawer.tsx","src/app/api/cart/route.ts"]}'},
        NOW() - INTERVAL '30 days',
        NOW() - INTERVAL '22 days'
      )
      RETURNING id`;

    const [task1_4] = await sql`
      INSERT INTO tasks (plan_id, description, status, priority, dependency_task_id, files_involved, created_at, updated_at)
      VALUES (
        ${plan1Id},
        'Stripe checkout integration with webhook handlers for payment lifecycle',
        'in_progress',
        1,
        ${task1_3.id},
        ${'{"files":["src/app/api/checkout/route.ts","src/app/api/webhooks/stripe/route.ts","src/lib/stripe.ts"]}'},
        NOW() - INTERVAL '22 days',
        NOW() - INTERVAL '1 day'
      )
      RETURNING id`;

    const [task1_5] = await sql`
      INSERT INTO tasks (plan_id, description, status, priority, dependency_task_id, files_involved, created_at, updated_at)
      VALUES (
        ${plan1Id},
        'Merchant analytics dashboard: revenue charts, top products, conversion funnel',
        'todo',
        2,
        ${task1_4.id},
        ${'{"files":["src/app/(merchant)/analytics/page.tsx","src/components/analytics/RevenueChart.tsx","src/app/api/analytics/route.ts"]}'},
        NOW() - INTERVAL '20 days',
        NOW() - INTERVAL '20 days'
      )
      RETURNING id`;

    const [task1_6] = await sql`
      INSERT INTO tasks (plan_id, description, status, priority, dependency_task_id, files_involved, notes, created_at, updated_at)
      VALUES (
        ${plan1Id},
        'Implement abandoned cart email recovery with Resend and Bull queue',
        'blocked',
        2,
        ${task1_4.id},
        ${'{"files":["src/jobs/abandoned-cart.ts","src/emails/AbandonedCart.tsx","src/app/api/jobs/route.ts"]}'},
        'Blocked on Stripe webhook completion — need confirmed checkout.session.expired events before implementing recovery flow',
        NOW() - INTERVAL '15 days',
        NOW() - INTERVAL '3 days'
      )
      RETURNING id`;

    console.log('   ✓ Project 1 tasks inserted');

    // Test results for Project 1
    await sql`
      INSERT INTO test_results (task_id, success, logs, timestamp)
      VALUES
        (${task1_1.id}, true, 'All 6 tables created with correct indexes and foreign keys. Migration applied in 340ms.', NOW() - INTERVAL '38 days'),
        (${task1_2.id}, true, 'Product listing SSR renders in 180ms on cold start. Algolia index synced with 1,243 test products.', NOW() - INTERVAL '30 days'),
        (${task1_2.id}, true, 'Search returns results in <50ms p99. Faceted filtering by category, price range, and rating works correctly.', NOW() - INTERVAL '29 days'),
        (${task1_3.id}, true, 'Cart drawer opens in <100ms. Optimistic updates applied immediately, server-confirmed within 200ms.', NOW() - INTERVAL '22 days'),
        (${task1_4.id}, false, 'Stripe webhook signature verification fails in staging — STRIPE_WEBHOOK_SECRET env var not set in Vercel preview environment.', NOW() - INTERVAL '2 days'),
        (${task1_4.id}, false, 'Payment intent creation succeeds but order record not written on webhook timeout. Retry logic needed.', NOW() - INTERVAL '1 day')`;

    console.log('   ✓ Project 1 test results inserted');

    // Agent logs for Project 1
    await sql`
      INSERT INTO agent_logs (task_id, project_id, level, message, context, timestamp)
      VALUES
        (${task1_1.id}, ${proj1Id}, 'info', 'Starting database schema design', ${'{"phase":"schema","tables_planned":6}'}, NOW() - INTERVAL '43 days'),
        (${task1_1.id}, ${proj1Id}, 'debug', 'Created tables: products, variants, orders, order_items, merchants, addresses', ${'{"tables":6,"indexes":14,"fks":8}'}, NOW() - INTERVAL '43 days'),
        (${task1_1.id}, ${proj1Id}, 'info', 'Schema migration applied successfully', ${'{"migration":"0001_products","duration_ms":340}'}, NOW() - INTERVAL '43 days'),
        (${task1_2.id}, ${proj1Id}, 'info', 'Building product listing page with Algolia integration', ${'{"framework":"Next.js 14","rendering":"SSR"}'}, NOW() - INTERVAL '38 days'),
        (${task1_2.id}, ${proj1Id}, 'debug', 'Product listing renders correctly with 1,243 test products', ${'{"render_ms":180,"products":1243}'}, NOW() - INTERVAL '35 days'),
        (${task1_3.id}, ${proj1Id}, 'info', 'Cart store implemented with Zustand + React Query', ${'{"library":"zustand","persistence":"session"}'}, NOW() - INTERVAL '30 days'),
        (${task1_4.id}, ${proj1Id}, 'info', 'Initiating Stripe checkout session creation', ${'{"mode":"payment","currency":"usd"}'}, NOW() - INTERVAL '22 days'),
        (${task1_4.id}, ${proj1Id}, 'warn', 'Webhook signature verification failed in staging environment', ${'{"error":"missing_secret","env":"staging","action":"add STRIPE_WEBHOOK_SECRET to Vercel env"}'}, NOW() - INTERVAL '2 days'),
        (${task1_4.id}, ${proj1Id}, 'error', 'Order not created after successful payment — webhook delivery timed out', ${'{"payment_intent":"pi_3QxK...","timeout_ms":5000,"retry_scheduled":true}'}, NOW() - INTERVAL '1 day')`;

    console.log('   ✓ Project 1 agent logs inserted');

    // =========================================================================
    // PROJECT 2 — Internal HR Portal (by John)
    // =========================================================================
    console.log('\n📦 Inserting Project 2: HR Portal...');

    const [proj2] = await sql`
      INSERT INTO projects (name, mission, description, constitution, tech_stack, base_path, agent_status, status, created_by_user_id, created_at, updated_at)
      VALUES (
        'PeopleOps — Internal HR Portal',
        'Streamline HR operations with a self-service employee portal and automated workflows',
        'An internal HR platform for managing employee onboarding, leave requests, performance reviews, and payroll visibility.',
        ${`# PeopleOps HR Portal

## Mission
Replace manual HR processes with a modern, self-service portal that employees actually enjoy using.

## Guiding Principles
- **Self-Service First**: Employees handle 80% of requests without HR intervention
- **Transparent Processes**: Every request has a visible status and audit trail
- **Privacy by Design**: PII encrypted at rest, access logged and auditable
- **Mobile-Ready**: Full functionality on iOS and Android browsers

## Data Policy
Employee data is the most sensitive asset. Never log PII in application logs.
All exports must be approved by HR Manager or above.
`},
        ${'{"frontend":"Next.js 14","backend":"tRPC + Prisma","database":"PostgreSQL","auth":"Azure AD SSO","notifications":"Slack + Email","storage":"Azure Blob","ci":"GitHub Actions"}'},
        '/projects/people-ops',
        'idle',
        'active',
        ${johnId},
        NOW() - INTERVAL '30 days',
        NOW() - INTERVAL '4 hours'
      )
      RETURNING id`;

    const proj2Id = proj2.id;

    const [spec2] = await sql`
      INSERT INTO specifications (project_id, content, version, is_active, created_by_user_id, created_at, updated_at)
      VALUES (
        ${proj2Id},
        ${`# PeopleOps — Product Specification v1.0

## Overview
PeopleOps replaces the current mix of spreadsheets, emails, and paper forms with a unified HR portal.

## Modules

### Employee Directory
- Searchable org chart with team hierarchy
- Employee profiles with skills, role history, office location
- Quick contact actions (Slack DM, calendar booking)

### Leave Management
- Submit, approve, and track leave requests
- Team calendar view showing overlapping absences
- Auto-calculation of leave balance from join date
- Public holiday aware (locale-based)

### Onboarding Workflows
- Configurable checklist templates by role
- IT asset request automation (laptop, access cards)
- Buddy assignment system
- Day-1 welcome email with calendar invites

### Performance Reviews
- Quarterly check-ins with structured form
- 360-degree feedback collection
- Goal tracking linked to OKRs
- Manager review and sign-off workflow

### Payslips & Compensation
- Secure payslip PDF download (current + historical)
- Compensation bands visibility by role
- Benefits enrolment and changes

## Integrations
- Azure AD for SSO and directory sync
- Slack for notifications and manager approvals
- BambooHR API for payroll data sync
- Workday for headcount reporting
`},
        '1.0',
        true,
        ${johnId},
        NOW() - INTERVAL '29 days',
        NOW() - INTERVAL '29 days'
      )
      RETURNING id`;

    const spec2Id = spec2.id;

    const [plan2] = await sql`
      INSERT INTO plans (spec_id, architecture_decisions, intent, status, created_by_user_id, created_at)
      VALUES (
        ${spec2Id},
        ${'{"backend":{"api":"tRPC","orm":"Prisma","validation":"Zod"},"auth":{"provider":"Azure AD","library":"next-auth","strategy":"JWT"},"frontend":{"components":"shadcn/ui","forms":"react-hook-form","tables":"tanstack-table"},"notifications":{"channels":["slack","email"],"provider":"Resend"}}'},
        'Ship Leave Management and Employee Directory modules in Q1, Onboarding in Q2',
        'active',
        ${johnId},
        NOW() - INTERVAL '28 days'
      )
      RETURNING id`;

    const plan2Id = plan2.id;

    const [task2_1] = await sql`
      INSERT INTO tasks (plan_id, description, status, priority, files_involved, created_at, updated_at)
      VALUES (
        ${plan2Id},
        'Configure Azure AD SSO with NextAuth — employee login and role mapping',
        'done',
        1,
        ${'{"files":["src/auth.ts","src/app/api/auth/[...nextauth]/route.ts","src/middleware.ts"]}'},
        NOW() - INTERVAL '28 days',
        NOW() - INTERVAL '25 days'
      )
      RETURNING id`;

    const [task2_2] = await sql`
      INSERT INTO tasks (plan_id, description, status, priority, dependency_task_id, files_involved, created_at, updated_at)
      VALUES (
        ${plan2Id},
        'Build searchable employee directory with org chart tree and role-based visibility',
        'done',
        1,
        ${task2_1.id},
        ${'{"files":["src/app/(portal)/directory/page.tsx","src/components/directory/OrgChart.tsx","src/server/routers/employees.ts"]}'},
        NOW() - INTERVAL '25 days',
        NOW() - INTERVAL '18 days'
      )
      RETURNING id`;

    const [task2_3] = await sql`
      INSERT INTO tasks (plan_id, description, status, priority, dependency_task_id, files_involved, created_at, updated_at)
      VALUES (
        ${plan2Id},
        'Leave request submission and approval workflow with email + Slack notifications',
        'in_progress',
        1,
        ${task2_2.id},
        ${'{"files":["src/app/(portal)/leave/page.tsx","src/server/routers/leave.ts","src/jobs/leave-notifications.ts"]}'},
        NOW() - INTERVAL '18 days',
        NOW() - INTERVAL '6 hours'
      )
      RETURNING id`;

    const [task2_4] = await sql`
      INSERT INTO tasks (plan_id, description, status, priority, dependency_task_id, files_involved, created_at, updated_at)
      VALUES (
        ${plan2Id},
        'Team calendar view showing leave overlaps and public holidays',
        'todo',
        2,
        ${task2_3.id},
        ${'{"files":["src/app/(portal)/leave/calendar/page.tsx","src/components/leave/TeamCalendar.tsx"]}'},
        NOW() - INTERVAL '10 days',
        NOW() - INTERVAL '10 days'
      )
      RETURNING id`;

    const [task2_5] = await sql`
      INSERT INTO tasks (plan_id, description, status, priority, dependency_task_id, files_involved, created_at, updated_at)
      VALUES (
        ${plan2Id},
        'Configurable onboarding checklist builder and employee onboarding dashboard',
        'todo',
        2,
        ${task2_2.id},
        ${'{"files":["src/app/(hr)/onboarding/page.tsx","src/components/onboarding/ChecklistBuilder.tsx","src/server/routers/onboarding.ts"]}'},
        NOW() - INTERVAL '8 days',
        NOW() - INTERVAL '8 days'
      )
      RETURNING id`;

    console.log('   ✓ Project 2 tasks inserted');

    await sql`
      INSERT INTO test_results (task_id, success, logs, timestamp)
      VALUES
        (${task2_1.id}, true, 'Azure AD SSO login flow completes successfully. Roles mapped correctly: HR Manager → admin, Employee → viewer.', NOW() - INTERVAL '25 days'),
        (${task2_1.id}, true, 'JWT session persists for 8 hours. Refresh token rotation working. Signout clears all cookies.', NOW() - INTERVAL '25 days'),
        (${task2_2.id}, true, 'Employee directory loads 248 employees in 320ms. Org chart renders up to 5 levels of hierarchy.', NOW() - INTERVAL '18 days'),
        (${task2_2.id}, true, 'Search returns results in real-time with <80ms debounce. Fuzzy match on name and email.', NOW() - INTERVAL '18 days'),
        (${task2_3.id}, false, 'Slack notification fails for managers with deactivated Slack accounts. Need fallback to email only.', NOW() - INTERVAL '2 days'),
        (${task2_3.id}, true, 'Leave balance calculation correct for employees with carry-over days. Edge case: part-time workers handled.', NOW() - INTERVAL '1 day')`;

    console.log('   ✓ Project 2 test results inserted');

    await sql`
      INSERT INTO agent_logs (task_id, project_id, level, message, context, timestamp)
      VALUES
        (${task2_1.id}, ${proj2Id}, 'info', 'Configuring Azure AD SSO provider with NextAuth', ${'{"provider":"azure-ad","tenant_id":"redacted","client_id":"redacted"}'}, NOW() - INTERVAL '28 days'),
        (${task2_1.id}, ${proj2Id}, 'debug', 'Role mapping configured: HR → admin, Manager → developer, Employee → viewer', ${'{"roles_mapped":3,"strategy":"jwt_claims"}'}, NOW() - INTERVAL '27 days'),
        (${task2_1.id}, ${proj2Id}, 'info', 'SSO authentication flow verified end-to-end', ${'{"test_users":5,"all_passed":true}'}, NOW() - INTERVAL '25 days'),
        (${task2_2.id}, ${proj2Id}, 'info', 'Building employee directory with tRPC router', ${'{"employees":248,"depth":5}'}, NOW() - INTERVAL '25 days'),
        (${task2_2.id}, ${proj2Id}, 'debug', 'Org chart tree built using recursive CTE query', ${'{"query_time_ms":45,"rows":248}'}, NOW() - INTERVAL '22 days'),
        (${task2_3.id}, ${proj2Id}, 'info', 'Starting leave request workflow implementation', ${'{"states":["pending","approved","rejected","cancelled"]}'}, NOW() - INTERVAL '18 days'),
        (${task2_3.id}, ${proj2Id}, 'warn', 'Slack notification delivery failed for 3 managers — accounts deactivated', ${'{"failed_count":3,"error":"account_not_found","fallback":"email"}'}, NOW() - INTERVAL '2 days'),
        (${task2_3.id}, ${proj2Id}, 'info', 'Fallback email notification implemented for deactivated Slack accounts', ${'{"fallback_triggered":true,"email_sent":true}'}, NOW() - INTERVAL '1 day')`;

    console.log('   ✓ Project 2 agent logs inserted');

    // =========================================================================
    // PROJECT 3 — Developer CLI Tool (by Amy)
    // =========================================================================
    console.log('\n📦 Inserting Project 3: Developer CLI Tool...');

    const [proj3] = await sql`
      INSERT INTO projects (name, mission, description, constitution, tech_stack, base_path, agent_status, status, created_by_user_id, created_at, updated_at)
      VALUES (
        'devkit — Developer CLI Toolkit',
        'A unified command-line toolkit for scaffolding, running, and deploying modern web projects',
        'An opinionated CLI that eliminates boilerplate setup for new projects — bootstraps full-stack apps, manages local services, and automates repeatable deployment tasks.',
        ${`# devkit CLI

## Mission
Kill repetitive setup work. A new project should go from zero to running in under 60 seconds.

## Design Principles
- **Convention over Configuration**: Sensible defaults, opt-out not opt-in
- **Fast Feedback**: Every command responds in under 200ms or streams progress
- **Composable**: Commands can be piped and scripted
- **Idempotent**: Running the same command twice has the same result

## Release Philosophy
Semver strictly followed. Breaking changes only in major versions.
Every release ships with a migration guide if applicable.
`},
        ${'{"runtime":"Node.js 20","language":"TypeScript","cli_framework":"Oclif","packaging":"npm global install","testing":"Vitest + Execa","ci":"GitHub Actions","registry":"npm public"}'},
        '/projects/devkit-cli',
        'idle',
        'active',
        ${amyId},
        NOW() - INTERVAL '20 days',
        NOW() - INTERVAL '30 minutes'
      )
      RETURNING id`;

    const proj3Id = proj3.id;

    const [spec3] = await sql`
      INSERT INTO specifications (project_id, content, version, is_active, created_by_user_id, created_at, updated_at)
      VALUES (
        ${proj3Id},
        ${`# devkit CLI — Product Specification v1.0

## Overview
devkit is an npm-installable CLI (\`npm i -g devkit\`) providing commands for the full project lifecycle.

## Command Groups

### \`devkit new\`
Scaffold new projects from maintained templates:
- \`devkit new next\` — Next.js 14 App Router + Drizzle + shadcn
- \`devkit new api\` — Express API with Zod validation and Swagger
- \`devkit new cli\` — Oclif CLI with TypeScript
Options: \`--db\`, \`--auth\`, \`--docker\`, \`--git\`

### \`devkit run\`
Start local development environment:
- Detects project type from package.json/go.mod/Cargo.toml
- Starts required services (Postgres, Redis, Meilisearch) via Docker Compose
- Hot-reload enabled, port conflicts auto-resolved
- \`devkit run --watch src/\` for selective watch mode

### \`devkit db\`
Database management shortcuts:
- \`devkit db migrate\` — run pending migrations
- \`devkit db seed\` — run seed files
- \`devkit db studio\` — open Drizzle Studio in browser
- \`devkit db reset\` — drop + recreate + migrate + seed

### \`devkit deploy\`
Deployment helpers:
- \`devkit deploy vercel\` — push to Vercel with env var validation
- \`devkit deploy fly\` — deploy to Fly.io
- \`devkit deploy docker\` — build and push Docker image to GHCR

### \`devkit env\`
Environment management:
- \`devkit env check\` — validate .env against .env.example
- \`devkit env sync\` — pull env vars from Vercel/Doppler

## Distribution
- Published to npm as \`devkit\`
- Auto-update via \`devkit update\` command
- Version pinning supported via \`npx devkit@1.2.3\`
`},
        '1.0',
        true,
        ${amyId},
        NOW() - INTERVAL '19 days',
        NOW() - INTERVAL '19 days'
      )
      RETURNING id`;

    const spec3Id = spec3.id;

    const [plan3] = await sql`
      INSERT INTO plans (spec_id, architecture_decisions, intent, status, created_by_user_id, created_at)
      VALUES (
        ${spec3Id},
        ${'{"cli_framework":"Oclif v4","language":"TypeScript 5","bundler":"tsup","testing":"Vitest + Execa for CLI integration tests","packaging":"npm global + npx support","config_format":"JSON5 in ~/.devkit/config.json"}'},
        'Ship v1.0.0 with devkit new, devkit run, and devkit db commands',
        'active',
        ${amyId},
        NOW() - INTERVAL '18 days'
      )
      RETURNING id`;

    const plan3Id = plan3.id;

    const [task3_1] = await sql`
      INSERT INTO tasks (plan_id, description, status, priority, files_involved, created_at, updated_at)
      VALUES (
        ${plan3Id},
        'Bootstrap Oclif CLI project structure with TypeScript, tsup build, and Vitest test setup',
        'done',
        1,
        ${'{"files":["package.json","tsconfig.json","src/index.ts","src/commands/","tests/","build.config.ts"]}'},
        NOW() - INTERVAL '18 days',
        NOW() - INTERVAL '15 days'
      )
      RETURNING id`;

    const [task3_2] = await sql`
      INSERT INTO tasks (plan_id, description, status, priority, dependency_task_id, files_involved, created_at, updated_at)
      VALUES (
        ${plan3Id},
        'Implement \`devkit new\` command with Next.js, API, and CLI templates',
        'done',
        1,
        ${task3_1.id},
        ${'{"files":["src/commands/new.ts","src/templates/next/","src/templates/api/","src/templates/cli/","src/lib/scaffold.ts"]}'},
        NOW() - INTERVAL '15 days',
        NOW() - INTERVAL '8 days'
      )
      RETURNING id`;

    const [task3_3] = await sql`
      INSERT INTO tasks (plan_id, description, status, priority, dependency_task_id, files_involved, created_at, updated_at)
      VALUES (
        ${plan3Id},
        'Implement \`devkit db\` command group: migrate, seed, studio, reset subcommands',
        'in_progress',
        1,
        ${task3_2.id},
        ${'{"files":["src/commands/db/index.ts","src/commands/db/migrate.ts","src/commands/db/seed.ts","src/commands/db/studio.ts","src/commands/db/reset.ts","src/lib/db-runner.ts"]}'},
        NOW() - INTERVAL '8 days',
        NOW() - INTERVAL '2 hours'
      )
      RETURNING id`;

    const [task3_4] = await sql`
      INSERT INTO tasks (plan_id, description, status, priority, dependency_task_id, files_involved, created_at, updated_at)
      VALUES (
        ${plan3Id},
        'Implement \`devkit run\` with auto-detection of project type and Docker service orchestration',
        'todo',
        1,
        ${task3_3.id},
        ${'{"files":["src/commands/run.ts","src/lib/project-detector.ts","src/lib/docker-compose-runner.ts","templates/docker-compose.devkit.yml"]}'},
        NOW() - INTERVAL '5 days',
        NOW() - INTERVAL '5 days'
      )
      RETURNING id`;

    const [task3_5] = await sql`
      INSERT INTO tasks (plan_id, description, status, priority, dependency_task_id, files_involved, notes, created_at, updated_at)
      VALUES (
        ${plan3Id},
        'Write integration tests for all commands using Execa and temp directories',
        'todo',
        2,
        ${task3_4.id},
        ${'{"files":["tests/commands/new.test.ts","tests/commands/db.test.ts","tests/commands/run.test.ts","tests/helpers/tmp-dir.ts"]}'},
        'Use tmp directory fixtures per test — clean up in afterEach. Execa runs the built CLI binary, not ts-node.',
        NOW() - INTERVAL '3 days',
        NOW() - INTERVAL '3 days'
      )
      RETURNING id`;

    const [task3_6] = await sql`
      INSERT INTO tasks (plan_id, description, status, priority, dependency_task_id, files_involved, created_at, updated_at)
      VALUES (
        ${plan3Id},
        'Publish to npm: configure CI release workflow with semantic-release and GitHub Actions',
        'todo',
        2,
        ${task3_5.id},
        ${'{"files":[".github/workflows/release.yml",".releaserc.json","CHANGELOG.md"]}'},
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '2 days'
      )
      RETURNING id`;

    console.log('   ✓ Project 3 tasks inserted');

    await sql`
      INSERT INTO test_results (task_id, success, logs, timestamp)
      VALUES
        (${task3_1.id}, true, 'Oclif CLI bootstrapped. \`devkit --version\` outputs 1.0.0. TypeScript compilation clean with 0 errors.', NOW() - INTERVAL '15 days'),
        (${task3_1.id}, true, 'Vitest test suite wired up. First smoke test (help command) passes.', NOW() - INTERVAL '15 days'),
        (${task3_2.id}, true, '\`devkit new next\` scaffolds a complete Next.js 14 project in 12 seconds. All post-scaffold checks pass.', NOW() - INTERVAL '8 days'),
        (${task3_2.id}, true, '\`devkit new api\` generates Express API with working health endpoint and Swagger docs at /api-docs.', NOW() - INTERVAL '8 days'),
        (${task3_2.id}, false, '\`devkit new next --auth\` fails when --db flag not also provided. Auth template assumes Drizzle users table.', NOW() - INTERVAL '7 days'),
        (${task3_3.id}, true, '\`devkit db migrate\` executes drizzle-kit migrate and streams output in real-time. Exit code = drizzle exit code.', NOW() - INTERVAL '3 hours'),
        (${task3_3.id}, false, '\`devkit db studio\` hangs when no DATABASE_URL env var found — should print actionable error and exit.', NOW() - INTERVAL '1 hour')`;

    console.log('   ✓ Project 3 test results inserted');

    await sql`
      INSERT INTO agent_logs (task_id, project_id, level, message, context, timestamp)
      VALUES
        (${task3_1.id}, ${proj3Id}, 'info', 'Bootstrapping Oclif CLI project with TypeScript', ${'{"oclif_version":"4.x","node":"20","bundler":"tsup"}'}, NOW() - INTERVAL '18 days'),
        (${task3_1.id}, ${proj3Id}, 'debug', 'tsconfig.json configured with strict mode and path aliases', ${'{"strict":true,"esm":true}'}, NOW() - INTERVAL '17 days'),
        (${task3_1.id}, ${proj3Id}, 'info', 'CLI bootstrap complete — devkit --version works', ${'{"version":"1.0.0-alpha.1"}'}, NOW() - INTERVAL '15 days'),
        (${task3_2.id}, ${proj3Id}, 'info', 'Implementing devkit new command', ${'{"templates":["next","api","cli"],"flags":["--db","--auth","--docker","--git"]}'}, NOW() - INTERVAL '15 days'),
        (${task3_2.id}, ${proj3Id}, 'debug', 'Next.js template scaffolded with Drizzle + shadcn defaults', ${'{"files_created":47,"duration_ms":12300}'}, NOW() - INTERVAL '10 days'),
        (${task3_2.id}, ${proj3Id}, 'warn', 'devkit new next --auth fails without --db: auth template assumes Drizzle users table', ${'{"issue":"missing_dependency_flag","fix":"add --db automatically when --auth used"}'}, NOW() - INTERVAL '7 days'),
        (${task3_3.id}, ${proj3Id}, 'info', 'Starting devkit db command group implementation', ${'{"subcommands":["migrate","seed","studio","reset"]}'}, NOW() - INTERVAL '8 days'),
        (${task3_3.id}, ${proj3Id}, 'debug', 'devkit db migrate streams drizzle-kit output correctly', ${'{"exit_code_passthrough":true,"streaming":true}'}, NOW() - INTERVAL '3 hours'),
        (${task3_3.id}, ${proj3Id}, 'error', 'devkit db studio hangs with no DATABASE_URL — missing env guard', ${'{"missing_var":"DATABASE_URL","behaviour":"hang","expected":"error + exit(1)"}'}, NOW() - INTERVAL '1 hour')`;

    console.log('   ✓ Project 3 agent logs inserted');

    // =========================================================================
    // SUMMARY
    // =========================================================================
    const [counts] = await sql`
      SELECT
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM projects) AS projects,
        (SELECT COUNT(*) FROM specifications) AS specifications,
        (SELECT COUNT(*) FROM plans) AS plans,
        (SELECT COUNT(*) FROM tasks) AS tasks,
        (SELECT COUNT(*) FROM test_results) AS test_results,
        (SELECT COUNT(*) FROM agent_logs) AS agent_logs`;

    console.log('\n📊 Seed complete!');
    console.log(`   👤 Users:          ${counts.users}`);
    console.log(`   📦 Projects:       ${counts.projects}`);
    console.log(`   📄 Specifications: ${counts.specifications}`);
    console.log(`   🗺️  Plans:          ${counts.plans}`);
    console.log(`   ✅ Tasks:          ${counts.tasks}`);
    console.log(`   🧪 Test Results:   ${counts.test_results}`);
    console.log(`   📝 Agent Logs:     ${counts.agent_logs}`);
    console.log('\n🔐 Login credentials:');
    console.log('   Username: Admin / John / Amy / Brett');
    console.log('   Password: demo');
    console.log('\n🚀 Start the app with: npm run dev:clean');

    await sql.end();

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error);
    await sql.end();
    process.exit(1);
  }
}

seedDatabase().catch(console.error);
