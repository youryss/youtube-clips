#!/bin/bash
# Upload updated download.py and restart backend

SERVER_IP="164.90.193.41"
SERVER_USER="root"
SERVER_PATH="~/youtube-viral-clipper"
SERVER_PASS="${SERVER_PASS:-Qweasd123;}"

# Check if expect is available for password auth
if command -v expect &> /dev/null; then
    USE_EXPECT=true
else
    USE_EXPECT=false
fi

echo "📤 Uploading updated src/download.py..."

if [ "$USE_EXPECT" = true ]; then
    # Use expect for password authentication
    TEMP_EXPECT=$(mktemp /tmp/update_server_XXXXXX.exp)
    cat > "$TEMP_EXPECT" <<EXPECT_EOF
#!/usr/bin/expect -f
set timeout 30
spawn scp -o StrictHostKeyChecking=no src/download.py $SERVER_USER@$SERVER_IP:$SERVER_PATH/src/download.py
expect {
    "password:" {
        send -- "$SERVER_PASS\r"
        exp_continue
    }
    "(yes/no)" {
        send "yes\r"
        exp_continue
    }
    eof
}
catch wait result
exit [lindex \$result 3]
EXPECT_EOF
    chmod +x "$TEMP_EXPECT"
    expect -f "$TEMP_EXPECT"
    UPLOAD_RESULT=$?
    rm -f "$TEMP_EXPECT"
else
    # Use interactive scp
    scp src/download.py "$SERVER_USER@$SERVER_IP:$SERVER_PATH/src/download.py"
    UPLOAD_RESULT=$?
fi

if [ $UPLOAD_RESULT -eq 0 ]; then
    echo "✅ File uploaded successfully"
    echo ""
    echo "🔄 Restarting backend container..."
    
    # Restart backend (no rebuild needed since file is mounted)
    if [ "$USE_EXPECT" = true ]; then
        TEMP_EXPECT2=$(mktemp /tmp/update_server2_XXXXXX.exp)
        cat > "$TEMP_EXPECT2" <<EXPECT_EOF2
#!/usr/bin/expect -f
set timeout 30
spawn ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "cd $SERVER_PATH && docker-compose exec backend find /app/src -name '*.pyc' -delete 2>/dev/null; docker-compose exec backend find /app/src -name '__pycache__' -type d -exec rm -rf {} + 2>/dev/null; docker-compose restart backend"
expect {
    "password:" {
        send -- "$SERVER_PASS\r"
        exp_continue
    }
    "(yes/no)" {
        send "yes\r"
        exp_continue
    }
    eof
}
catch wait result
exit [lindex \$result 3]
EXPECT_EOF2
        chmod +x "$TEMP_EXPECT2"
        expect -f "$TEMP_EXPECT2"
        RESTART_RESULT=$?
        rm -f "$TEMP_EXPECT2"
    else
        ssh "$SERVER_USER@$SERVER_IP" "cd $SERVER_PATH && docker-compose exec backend find /app/src -name '*.pyc' -delete 2>/dev/null; docker-compose exec backend find /app/src -name '__pycache__' -type d -exec rm -rf {} + 2>/dev/null; docker-compose restart backend"
        RESTART_RESULT=$?
    fi
    
    if [ $RESTART_RESULT -eq 0 ]; then
        echo ""
        echo "✅ Done! Backend restarted with updated code."
        echo ""
        echo "💡 Note: The code is mounted as a volume, so restart is enough."
        echo "   If changes don't appear, you may need to rebuild:"
        echo "   docker-compose build --no-cache backend"
    else
        echo "❌ Error restarting backend"
        exit 1
    fi
else
    echo "❌ Error uploading file"
    exit 1
fi

