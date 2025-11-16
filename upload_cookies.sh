#!/bin/bash
# Script to upload cookies.txt to server and restart backend

SERVER_IP="164.90.193.41"
SERVER_USER="root"
SERVER_PATH="~/youtube-viral-clipper"
LOCAL_COOKIES="cookies.txt"

echo "=========================================="
echo "Uploading cookies.txt to server..."
echo "=========================================="

# Check if cookies.txt exists locally
if [ ! -f "$LOCAL_COOKIES" ]; then
    echo "❌ Error: $LOCAL_COOKIES not found in current directory"
    exit 1
fi

echo "✓ Found $LOCAL_COOKIES locally"

# Upload cookies.txt to server
echo "Uploading to $SERVER_USER@$SERVER_IP:$SERVER_PATH/..."
scp "$LOCAL_COOKIES" "$SERVER_USER@$SERVER_IP:$SERVER_PATH/cookies.txt"

if [ $? -eq 0 ]; then
    echo "✓ Cookies uploaded successfully"
else
    echo "❌ Error: Failed to upload cookies"
    exit 1
fi

echo ""
echo "=========================================="
echo "Restarting backend container..."
echo "=========================================="

# Restart backend via SSH
ssh "$SERVER_USER@$SERVER_IP" "cd $SERVER_PATH && docker-compose restart backend"

if [ $? -eq 0 ]; then
    echo "✓ Backend restarted successfully"
else
    echo "❌ Error: Failed to restart backend"
    exit 1
fi

echo ""
echo "=========================================="
echo "Waiting for backend to start..."
echo "=========================================="
sleep 5

echo ""
echo "=========================================="
echo "Testing cookies..."
echo "=========================================="

# Test cookies on server
ssh "$SERVER_USER@$SERVER_IP" "cd $SERVER_PATH && docker-compose exec -T backend python3 /app/src/test_cookies.py"

echo ""
echo "=========================================="
echo "✅ Done!"
echo "=========================================="
echo ""
echo "If the test passed, your cookies are working!"
echo "If you still see errors, the cookies may be expired."
echo "Regenerate them with: python3 src/generate_cookies.py --email your@email.com"

