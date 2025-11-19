#!/bin/bash
# Script to test JavaScript runtime fix for yt-dlp on server

SERVER_IP="164.90.193.41"
SERVER_USER="root"
SERVER_PATH="~/youtube-viral-clipper"
SERVER_PASS="${SERVER_PASS:-Qweasd123;}"

echo "🔍 Testing JavaScript Runtime Fix for yt-dlp"
echo "=============================================="
echo ""

if command -v expect &> /dev/null; then
    TEMP_EXPECT=$(mktemp /tmp/test_js_runtime_XXXXXX.exp)
    cat > "$TEMP_EXPECT" <<EXPECT_EOF
#!/usr/bin/expect -f
set timeout 120

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
        set timeout 300
        # Navigate to project directory
        send "cd $SERVER_PATH\r"
        expect "# "
        
        # Check current yt-dlp version
        send "echo '=== Current yt-dlp Version ==='\r"
        expect "# "
        send "docker-compose exec -T backend python3 -c 'import yt_dlp; print(yt_dlp.__version__)' 2>&1\r"
        expect "# "
        
        # Check if yt-dlp-ejs is installed
        send "echo '=== Checking yt-dlp-ejs ==='\r"
        expect "# "
        send "docker-compose exec -T backend pip list | grep yt-dlp-ejs\r"
        expect "# "
        
        # Check Node.js version
        send "echo '=== Node.js Version ==='\r"
        expect "# "
        send "docker-compose exec -T backend node --version\r"
        expect "# "
        
        # Install/upgrade yt-dlp with default extras
        send "echo '=== Installing yt-dlp[default] ==='\r"
        expect "# "
        send "docker-compose exec -T backend pip install --upgrade 'yt-dlp[default]'\r"
        expect "# "
        
        # Verify yt-dlp-ejs is now installed
        send "echo '=== Verifying yt-dlp-ejs Installation ==='\r"
        expect "# "
        send "docker-compose exec -T backend pip list | grep yt-dlp\r"
        expect "# "
        
        # Test yt-dlp with cookies (using a simpler approach)
        send "echo '=== Testing yt-dlp with Cookies ==='\r"
        expect "# "
        send "docker-compose exec -T backend python3 << 'PYTHON_EOF'\r"
        expect "# "
        send "import yt_dlp\r"
        expect "# "
        send "import sys\r"
        expect "# "
        send "test_url = 'https://www.youtube.com/watch?v=Wtx3rb2ij8I'\r"
        expect "# "
        send "cookie_file = '/app/cookies.txt'\r"
        expect "# "
        send "print('Testing yt-dlp with cookies...')\r"
        expect "# "
        send "print(f'Cookie file: {cookie_file}')\r"
        expect "# "
        send "try:\r"
        expect "# "
        send "    ydl_opts = {'cookiefile': cookie_file, 'quiet': False, 'no_warnings': False}\r"
        expect "# "
        send "    ydl = yt_dlp.YoutubeDL(ydl_opts)\r"
        expect "# "
        send "    info = ydl.extract_info(test_url, download=False)\r"
        expect "# "
        send "    if info and info.get('title'):\r"
        expect "# "
        send "        print(f'SUCCESS! Title: {info.get(\\\"title\\\")}')\r"
        expect "# "
        send "        print(f'Duration: {info.get(\\\"duration\\\")} seconds')\r"
        expect "# "
        send "        sys.exit(0)\r"
        expect "# "
        send "    else:\r"
        expect "# "
        send "        print('FAILED: No info returned')\r"
        expect "# "
        send "        sys.exit(1)\r"
        expect "# "
        send "except Exception as e:\r"
        expect "# "
        send "    print(f'ERROR: {e}')\r"
        expect "# "
        send "    import traceback\r"
        expect "# "
        send "    traceback.print_exc()\r"
        expect "# "
        send "    sys.exit(1)\r"
        expect "# "
        send "PYTHON_EOF\r"
        expect "# "
        
        # Check yt-dlp version after update
        send "echo '=== Updated yt-dlp Version ==='\r"
        expect "# "
        send "docker-compose exec -T backend python3 -c 'import yt_dlp; print(yt_dlp.__version__)' 2>&1\r"
        expect "# "
        
        send "exit\r"
    }
    eof
EXPECT_EOF
    chmod +x "$TEMP_EXPECT"
    expect -f "$TEMP_EXPECT"
    rm -f "$TEMP_EXPECT"
else
    echo "❌ Error: 'expect' command not found. Please install it:"
    echo "   macOS: brew install expect"
    echo "   Ubuntu/Debian: sudo apt-get install expect"
    exit 1
fi

echo ""
echo "✅ Test completed!"

