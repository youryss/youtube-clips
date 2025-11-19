#!/bin/bash
# Upload cookies to server using expect for password authentication
# Script to upload cookies.txt to server and restart backend

SERVER_IP="164.90.193.41"
SERVER_USER="root"
SERVER_PATH="~/youtube-viral-clipper"
LOCAL_COOKIES="cookies.txt"
SERVER_PASS="${SERVER_PASS:-Qweasd123;}"

echo "=========================================="
echo "Uploading cookies.txt to server..."
echo "=========================================="

# Check if cookies.txt exists locally
if [ ! -f "$LOCAL_COOKIES" ]; then
    echo "❌ Error: $LOCAL_COOKIES not found in current directory"
    exit 1
fi

echo "✓ Found $LOCAL_COOKIES locally"

# Check if expect is available
if ! command -v expect &> /dev/null; then
    echo "❌ Error: expect not found. Please install it: brew install expect"
    exit 1
fi

# Upload cookies.txt to server using expect
echo "Uploading to $SERVER_USER@$SERVER_IP:$SERVER_PATH/..."

TEMP_EXPECT=$(mktemp /tmp/upload_cookies_XXXXXX.exp)
cat > "$TEMP_EXPECT" <<EXPECT_EOF
#!/usr/bin/expect -f
set timeout 30
spawn scp -o StrictHostKeyChecking=no "$LOCAL_COOKIES" $SERVER_USER@$SERVER_IP:$SERVER_PATH/cookies.txt
expect {
    "password:" {
        send -- "$SERVER_PASS\r"
        exp_continue
    }
    "(yes/no)" {
        send "yes\r"
        exp_continue
    }
    eof {
        catch wait result
        set exit_code [lindex \$result 3]
        if {\$exit_code == 0} {
            exit 0
        } else {
            exit \$exit_code
        }
    }
}
EXPECT_EOF
chmod +x "$TEMP_EXPECT"

export SERVER_PASS="$SERVER_PASS"
expect -f "$TEMP_EXPECT"
UPLOAD_RESULT=$?
rm -f "$TEMP_EXPECT"

if [ $UPLOAD_RESULT -eq 0 ]; then
    echo "✓ Cookies uploaded successfully"
else
    echo "❌ Error: Failed to upload cookies"
    exit 1
fi

echo ""
echo "=========================================="
echo "Restarting backend container..."
echo "=========================================="

# Restart backend via SSH using expect
TEMP_EXPECT2=$(mktemp /tmp/restart_backend_XXXXXX.exp)
cat > "$TEMP_EXPECT2" <<EXPECT_EOF
#!/usr/bin/expect -f
set timeout 30
spawn ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "cd $SERVER_PATH && docker-compose restart backend"
expect {
    "password:" {
        send -- "$SERVER_PASS\r"
        exp_continue
    }
    "(yes/no)" {
        send "yes\r"
        exp_continue
    }
    eof {
        catch wait result
        set exit_code [lindex \$result 3]
        if {\$exit_code == 0} {
            exit 0
        } else {
            exit \$exit_code
        }
    }
}
EXPECT_EOF
chmod +x "$TEMP_EXPECT2"

export SERVER_PASS="$SERVER_PASS"
expect -f "$TEMP_EXPECT2"
RESTART_RESULT=$?
rm -f "$TEMP_EXPECT2"

if [ $RESTART_RESULT -eq 0 ]; then
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
ssh "$SERVER_USER@$SERVER_IP" "cd $SERVER_PATH && docker-compose exec -T backend python3 /app/test/test_cookies.py"

echo ""
echo "=========================================="
echo "✅ Done!"
echo "=========================================="
echo ""
echo "If the test passed, your cookies are working!"
echo "If you still see errors, the cookies may be expired."
echo "Regenerate them with: python3 src/generate_cookies.py --email your@email.com"

