#!/bin/bash
# Upload necessary files to server for auto-refresh

SERVER_IP="164.90.193.41"
SERVER_USER="root"
SERVER_PASS="${SERVER_PASS:-Qweasd123;}"
SERVER_PATH="~/youtube-viral-clipper"

echo "=========================================="
echo "📤 Uploading files to server..."
echo "=========================================="

# Files to upload
FILES=(
    "Dockerfile.cookie-refresh"
    "src/auto_refresh_cookies_server.py"
    "refresh_cookies_server.sh"
    "docker-compose.yml"
)

# Check if expect is available
if ! command -v expect &> /dev/null; then
    echo "❌ Error: expect not found. Please install it: brew install expect"
    exit 1
fi

# Upload each file
for file in "${FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "⚠️  Warning: $file not found, skipping..."
        continue
    fi
    
    echo "Uploading $file..."
    
    TEMP_EXPECT=$(mktemp /tmp/upload_${file//\//_}_XXXXXX.exp)
    cat > "$TEMP_EXPECT" <<EXPECT_EOF
#!/usr/bin/expect -f
set timeout 30
spawn scp -o StrictHostKeyChecking=no "$file" $SERVER_USER@$SERVER_IP:$SERVER_PATH/$file
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
        echo "✅ $file uploaded"
    else
        echo "❌ Failed to upload $file"
    fi
done

# Make refresh script executable on server
TEMP_EXPECT2=$(mktemp /tmp/chmod_XXXXXX.exp)
cat > "$TEMP_EXPECT2" <<EXPECT_EOF
#!/usr/bin/expect -f
set timeout 30
spawn ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP
expect {
    "password:" {
        send -- "$SERVER_PASS\r"
        exp_continue
    }
    "(yes/no)" {
        send "yes\r"
        exp_continue
    }
    "# " {
        send "cd $SERVER_PATH && chmod +x refresh_cookies_server.sh\r"
        expect "# "
        send "exit\r"
    }
    eof
}
EXPECT_EOF
chmod +x "$TEMP_EXPECT2"
export SERVER_PASS="$SERVER_PASS"
expect -f "$TEMP_EXPECT2"
rm -f "$TEMP_EXPECT2"

echo ""
echo "✅ Files uploaded!"
echo ""
echo "Next step: Run ./scripts/setup_server_auto_refresh.sh to configure cron job"

