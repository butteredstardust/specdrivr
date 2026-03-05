#!/bin/bash

echo "=========================================="
echo "Verifying Database Seed Data"
echo "=========================================="
echo ""

# Check users
echo "1. Users Table:"
docker exec specdrivr_db psql -U specdrivr -d specdrivr -c "SELECT id, username, role, is_admin, is_active FROM users ORDER BY id;"
echo ""

# Check projects
echo "2. Projects Table:"
docker exec specdrivr_db psql -U specdrivr -d specdrivr -c "SELECT id, name, status, created_by_user_id FROM projects ORDER BY id;"
echo ""

# Check tasks count
echo "3. Tasks Count:"
docker exec specdrivr_db psql -U specdrivr -d specdrivr -c "SELECT COUNT(*) as total_tasks FROM tasks;"
echo ""

# Check test results
echo "4. Test Results Count:"
docker exec specdrivr_db psql -U specdrivr -d specdrivr -c "SELECT COUNT(*) as total_test_results FROM test_results;"
echo ""

# Check agent logs
echo "5. Agent Logs Count:"
docker exec specdrivr_db psql -U specdrivr -d specdrivr -c "SELECT COUNT(*) as total_agent_logs FROM agent_logs;"
echo ""

echo "=========================================="
echo "✓ Seed data verification complete!"
echo "=========================================="
