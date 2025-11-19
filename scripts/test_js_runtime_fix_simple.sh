#!/bin/bash
# Simplified script to test JavaScript runtime fix for yt-dlp on server

SERVER_IP="164.90.193.41"
SERVER_USER="root"
SERVER_PATH="~/youtube-viral-clipper"
SERVER_PASS="${SERVER_PASS:-Qweasd123;}"

echo "🔍 Testing JavaScript Runtime Fix for yt-dlp"
echo "=============================================="
echo ""

# Create a simpler expect script
TEMP_EXPECT=$(mktemp /tmp/test_js_XXXXXX.exp)
cat > "$TEMP_EXPECT" << 'EXPECT_SCRIPT'
#!/usr/bin/expect -f
set timeout 300

set server_ip [lindex $argv 0]
set server_user [lindex $argv 1]
set server_pass [lindex $argv 2]
set server_path [lindex $argv 3]

spawn ssh -o StrictHostKeyChecking=no ${server_user}@${server_ip}

expect {
    "password:" {
        send -- "${server_pass}\r"
        exp_continue
    }
    "(yes/no)" {
        send "yes\r"
        exp_continue
    }
    "# " {
        send "cd ${server_path}\r"
        expect "# "
        
        send "echo '=== Current Status ==='\r"
        expect "# "
        
        send "docker-compose exec -T backend python3 -c 'import yt_dlp; print(\"yt-dlp:\", yt_dlp.__version__)'\r"
        expect "# "
        
        send "docker-compose exec -T backend pip list | grep yt-dlp\r"
        expect "# "
        
        send "docker-compose exec -T backend node --version\r"
        expect "# "
        
        send "echo '=== Installing yt-dlp[default] ==='\r"
        expect "# "
        send "docker-compose exec -T backend pip install --upgrade 'yt-dlp[default]' 2>&1\r"
        expect "# "
        
        send "echo '=== After Installation ==='\r"
        expect "# "
        send "docker-compose exec -T backend pip list | grep yt-dlp\r"
        expect "# "
        
        send "echo '=== Testing with Cookies ==='\r"
        expect "# "
        send "docker-compose exec -T backend python3 /app/test/test_js_runtime_server.py\r"
        expect "# "
        
        send "exit\r"
    }
    eof
}
EXPECT_SCRIPT

chmod +x "$TEMP_EXPECT"

if command -v expect &> /dev/null; then
    # First, upload the test script
    echo "📤 Uploading test script to server..."
    scp -o StrictHostKeyChecking=no test/test_js_runtime_server.py ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/test/test_js_runtime_server.py 2>/dev/null || {
        echo "⚠️  Could not upload via scp, will try via docker cp after SSH"
    }
    
    # Run the expect script
    expect -f "$TEMP_EXPECT" "$SERVER_IP" "$SERVER_USER" "$SERVER_PASS" "$SERVER_PATH"
    
    rm -f "$TEMP_EXPECT"
else
    echo "❌ Error: 'expect' command not found."
    exit 1
fi

echo ""
echo "✅ Test completed!"

