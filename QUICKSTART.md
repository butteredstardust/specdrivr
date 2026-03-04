# Quick Start Guide - Spec-Drivr Setup

Your development environment is mostly ready! Follow these steps to get the app fully operational with database and seed data.

## Current Status ✅

- ✅ Docker container running (PostgreSQL 16)
- ✅ `.env.local` configured with DATABASE_URL and agent token
- ✅ Next.js 14 project set up
- ✅ Drizzle ORM configured
- ✅ All components created
- ✅ API endpoints implemented

## What You Need To Do Now

### Step 1: Run Database Migrations (2 min)

```bash
# Apply the Drizzle schema to PostgreSQL
npm run db:push
```

This will:
- Create all 6 tables (projects, specifications, plans, tasks, test_results, agent_logs)
- Set up enums and relationships
- Create primary/foreign keys

### Step 2: Seed Initial Data (1 min)

```bash
# Load the basic Spec-Drivr project data
psql $DATABASE_URL < db/seed-simple.sql
```

This will populate:
- 1 Project (Spec-Drivr)
- 1 Specification (Platform description)
- 1 Plan (Architecture decisions)
- 31 Tasks (All marked as "done" - infrastructure that's complete)
- Test results for completed tasks
- Agent logs showing onboarding completion

### Step 3: Onboard Implementation Tasks (1 min)

```bash
# Load all the features and tasks we need to implement next
psql $DATABASE_URL < db/seed-plan.sql
```

This will add:
- Phase 1: 8 critical tasks (fix New Project button, wire routing, etc.)
- Phase 2: 9 core interaction tasks (drag-and-drop, detail views, etc.)
- Phase 3: 10 advanced feature tasks (plan/task creation, logs, etc.)
- Phase 4: 8 polish tasks (error handling, loading states, etc.)
- Phase 5: 6 future tasks (agent integration, versioning, etc.)

### Step 4: Verify Database Setup (1 min)

```bash
# View the database structure and data
npm run db:studio
```

This opens Drizzle Studio in your browser at `http://localhost:3000` (when prompted).
You can:
- Browse all tables
- Inspect data
- Test queries
- Verify migrations worked

### Step 5: Start Development Server (1 min)

```bash
npm run dev
```

Then visit: `http://localhost:3000`

You should see:
- Projects sidebar (might be empty if seed didn't run)
- Kanban board with actual tasks from database
- Sample navigation structure

---

## What Should Work After Setup

✅ **Home Page**
- Shows "Spec-Drivr" header
- Displays Projects sidebar
- Shows Kanban board with 4 columns (To Do, In Progress, Done, Blocked)

✅ **Sidebar**
- Lists projects from database
- Shows "New Project" button (currently shows alert)
- Click to select project

✅ **Kanban Board**
- Shows tasks from database
- Groups by status
- Shows task count per column
- Displays priority and dates

✅ **API Endpoints** (via curl or Postman)
- `GET http://localhost:3000/api/agent/mission?project_id=1` - Get next task
- `PATCH http://localhost:3000/api/agent/tasks/1` - Update task status
- Add header: `X-Agent-Token: dev-agent-token-12345`

---

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# If not running, start it
docker-compose up -d

# If still failing, check logs
docker-compose logs postgres
```

### Migration Failures

```bash
# Reset the database (WARNING: deletes all data)
npm run db:studio  # Check for conflicts first
# Then manually drop tables and retry

# Or use psql directly
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npm run db:push
```

### Seed Data Not Loading

```bash
# Verify PostgreSQL is running
docker exec specdrivr_db psql -U specdrivr -d specdrivr -c "SELECT * FROM projects;"

# If tables don't exist, run migrations first
npm run db:push

# Then run the seed
psql $DATABASE_URL < db/seed-simple.sql
psql $DATABASE_URL < db/seed-plan.sql
```

### Port Already in Use

```bash
# PostgreSQL default: 5432, Next.js default: 3000
# If ports conflict, either:
# 1. Kill existing processes
# 2. Change ports in docker-compose.yml and .env.local
# 3. Use different database

lsof -i :5432  # Find what's using the port
kill -9 <PID>
```

---

## Next: Implement Phase 1 Tasks

Once the database is verified, start with **Task 33** (Set up .env.local):

1. ✅ Already done! Check it exists at `.env.local`

Then move to the **New Project Button** (Task 36):

2. Open `src/components/project-sidebar.tsx`
3. Change the alert to actually call `createProject` action
4. Add a dialog/modal form for project creation
5. See **plan.md** for full details

---

## Useful Commands

```bash
# Database
npm run db:studio          # Visual DB explorer
npm run db:push            # Apply migrations
npm run db:generate        # Generate migration files
psql $DATABASE_URL         # Direct database access

# Development
npm run dev                # Start dev server
npm run build              # Build for production
npm run lint               # Check code quality

# Docker
docker-compose up -d       # Start services
docker-compose logs -f     # Watch logs
docker-compose down        # Stop services
```

---

## File Structure Reference

```
specdrivr/
├── .env.local              # ✅ Environment variables (configured)
├── docker-compose.yml      # ✅ PostgreSQL setup (running)
├── package.json            # ✅ Dependencies
├── drizzle.config.ts       # ✅ Database config
├── db/
│   ├── seed-simple.sql     # ✅ Initial project data
│   └── seed-plan.sql       # ✅ Implementation tasks (new)
├── src/
│   ├── app/
│   │   ├── page.tsx        # ⚠️ Home page (shows sample data)
│   │   └── api/agent/      # ✅ Agent API endpoints
│   ├── components/         # ✅ UI components created
│   ├── lib/
│   │   ├── actions.ts      # ⚠️ Server actions (partially wired)
│   │   └── agent-memory.ts # ✅ Database helper functions
│   └── db/
│       ├── index.ts        # ✅ Database client
│       └── schema.ts       # ✅ Drizzle schema
└── plan.md                 # 📋 This development plan (new)
```

**Legend:** ✅ Ready | ⚠️ Needs work | 📋 New file

---

## Success Looks Like

After completing these setup steps, you should see:

```
✅ Database tables created
✅ Seed data loaded (1 project, 31 completed tasks, 41+ future tasks)
✅ Next.js dev server running on port 3000
✅ Home page displays actual tasks from database
✅ sidebar shows "Spec-Drivr" project
✅ Kanban board shows tasks grouped by status
✅ Drizzle Studio accessible for database inspection
✅ API endpoints responding to requests
```

Once all ✅ are complete, start implementing Phase 1 tasks from **plan.md**.

---

## Questions?

- Check the **specification.md** for project philosophy
- Check the **plan.md** for implementation roadmap
- Check the **README.md** for architecture overview

Good luck! 🚀
