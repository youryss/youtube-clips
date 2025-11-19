#!/bin/bash
# Script to refresh cookies on the server
# This runs the cookie refresh container and restarts backend

SERVER_IP="164.90.193.41"
SERVER_USER="root"
SERVER_PASS="${SERVER_PASS:-Qweasd123;}"
SERVER_PATH="~/youtube-viral-clipper"
EMAIL="${COOKIE_EMAIL:-youtubioviral@gmail.com}"

echo "=========================================="
echo "🔄 Refreshing cookies on server..."
echo "=========================================="

# Check if expect is available
if ! command -v expect &> /dev/null; then
    echo "❌ Error: expect not found. Please install it: brew install expect"
    exit 1
fi

# Create expect script
TEMP_EXPECT=$(mktemp /tmp/refresh_cookies_server_XXXXXX.exp)
cat > "$TEMP_EXPECT" <<EXPECT_EOF
#!/usr/bin/expect -f
set timeout 300
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
        send "cd $SERVER_PATH\r"
        expect "# "
        
        # Build cookie refresh container if needed
        send "docker-compose build cookie-refresh\r"
        expect "# "
        
        # Run cookie refresh (with display for headless browser)
        send "docker-compose run --rm -e DISPLAY=:99 cookie-refresh python3 auto_refresh_cookies_server.py --email $EMAIL --output /app/cookies.txt\r"
        expect {
            "✅" {
                send "\r"
                exp_continue
            }
            "❌" {
                send "\r"
                exp_continue
            }
            "# " {
                # Continue
            }
            timeout {
                send "\r"
                exp_continue
            }
        }
        expect "# "
        
        # Restart backend
        send "docker-compose restart backend\r"
        expect "# "
        
        send "echo 'Done!'\r"
        expect "# "
        send "exit\r"
    }
    eof
}
EXPECT_EOF

chmod +x "$TEMP_EXPECT"
export SERVER_PASS="$SERVER_PASS"
expect -f "$TEMP_EXPECT"
RESULT=$?
rm -f "$TEMP_EXPECT"

if [ $RESULT -eq 0 ]; then
    echo ""
    echo "✅ Cookies refreshed on server!"
else
    echo ""
    echo "❌ Error refreshing cookies"
    exit 1
fi

