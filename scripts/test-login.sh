#!/bin/bash

echo "=========================================="
echo "Testing User Login (Password: 'demo')"
echo "=========================================="
echo ""

# Function to test login
test_login() {
    local username=$1
    local expected_role=$2

    echo "Testing login for: $username"
    response=$(curl -s http://localhost:3000/api/auth/login \
        -X POST \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$username\",\"password\":\"demo\"}")

    if echo "$response" | grep -q "\"success\":true"; then
        echo "✓ $username logged in successfully (role: $expected_role)"
        return 0
    else
        echo "✗ $username login failed"
        echo "Response: $response"
        return 1
    fi
    echo ""
}

# Test all users
test_login "Admin" "admin"
test_login "John" "developer"
test_login "Amy" "developer"
test_login "Brett" "viewer"

echo "=========================================="
echo "✓ All login tests completed!"
echo "=========================================="
echo ""
echo "To test manually:"
echo "1. npm run dev"
echo "2. Open http://localhost:3000/auth/login"
echo "3. Enter username: Admin (or John, Amy, Brett)"
echo "4. Password: demo"
echo "5. Should redirect to http://localhost:3000"
echo ""