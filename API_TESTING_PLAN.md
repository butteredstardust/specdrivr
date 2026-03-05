# API Testing Plan - Systematic Verification

## Objective: Test ALL API routes end-to-end
**Methodology**: Test → Create sample data → Verify → Document → Move to next

---

## API Endpoints to Test

### 1. Agent Core APIs
- [ ] GET `/api/agent/mission?project_id=1`
- [ ] POST `/api/agent/projects` - Create agent-controlled project
- [ ] POST `/api/agent/plans` - Create plan for agent
- [ ] PATCH `/api/agent/tasks/:id` - Update task status
- [ ] POST `/api/agent/verify` - Log test results
- [ ] POST `/api/agent/logs` - Add agent logs
- [ ] GET `/api/agent/projects/:id` - Agent queries project state
- [ ] PATCH `/api/agent/projects/:id` - Agent updates project config
- [ ] POST `/api/agent/tasks` - Agent creates tasks

### 2. Admin APIs
- [x] GET `/api/admin/users` - List users (Tested - PASSED)
- [x] POST `/api/admin/users` - Create user (Tested - PASSED)
- [x] PATCH `/api/admin/users/:id` - Update user (Tested - PASSED, Bug #5 found & fixed)
- [x] DELETE `/api/admin/users/:id` - Delete user (Tested - PASSED)

### 3. Authentication APIs
- [ ] POST `/api/auth/login` - User login
- [ ] GET `/api/auth/session` - Get session
- [ ] POST `/api/auth/logout` - Logout
- [ ] POST `/api/auth/auto-login` - Dev mode auto-login (Tested - PASSED, Bug found & fixed)

### 4. Project APIs
- [x] GET `/api/projects/:id/agent/status` - Agent control status (Tested - PASSED)
- [x] POST `/api/projects/:id/agent/start` - Start agent (created)
- [x] POST `/api/projects/:id/agent/pause` - Pause agent (created)
- [x] POST `/api/projects/:id/agent/stop` - Stop agent (created)
- [x] POST `/api/projects/:id/agent/retry` - Retry agent (created)
- [x] POST `/api/tasks/:id/agent/retry` - Retry task (created)
- [x] POST `/api/tasks/:id/agent/skip` - Skip task (created)

### 5. Task APIs
- [ ] POST `/api/tasks/:id/tests` - Log task test results
- [ ] POST `/api/tasks/:id/logs` - Add task logs

### 6. Webhook APIs
- [ ] POST `/api/webhooks/git` - Git webhook (created)

---

## Test Data Setup

### Required Sample Data
1. **Users**: 1 admin, 1 developer, 1 viewer (✅ Created via provisioning)
2. **Project**: Test project with status='active' (✅ Created via seeding)
3. **Tasks**: Multiple tasks in different statuses (✅ Created via seeding)
4. **Logs**: Agent logs with project_id (Need to create)

### Create Missing Data via SQL (if needed):
```bash
# Create project_id for existing logs
docker exec -i specdrivr_db psql -U specdrivr -d specdrivr << 'SQL'
UPDATE agent_logs SET project_id = 1 WHERE project_id IS NULL;
SQL
```

---

## Testing Priority Order

**Test Each Endpoint:**
1. Make request (with proper auth via cookies)
2. Check status code
3. Check response body
4. Verify database state (if applicable)
5. Document result
6. Move to next

**Run Tests:**
1. All GET endpoints (data fetching)
2. All POST endpoints (data creation)
3. All PATCH endpoints (data updates)
4. All DELETE endpoints (data removal)

---

## Test Execution

### Phase 1: GET Data Endpoints

**Status:** Starting systematic testing...

### Step 1: Test Agent Mission API
Let me test the agent mission endpoint:

```bash
curl "http://localhost:3000/api/agent/mission?project_id=1" \
  -H "X-Agent-Token: dev-agent-token-12345"
```
