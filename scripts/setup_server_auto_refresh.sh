#!/bin/bash
# Setup auto-refresh of cookies on the SERVER (not local)

SERVER_IP="164.90.193.41"
SERVER_USER="root"
SERVER_PASS="${SERVER_PASS:-Qweasd123;}"
SERVER_PATH="~/youtube-viral-clipper"
EMAIL="${COOKIE_EMAIL:-youtubioviral@gmail.com}"

echo "=========================================="
echo "🔧 Setting up auto-refresh on SERVER..."
echo "=========================================="
echo ""

# Check if expect is available
if ! command -v expect &> /dev/null; then
    echo "❌ Error: expect not found. Please install it: brew install expect"
    exit 1
fi

# Create expect script
TEMP_EXPECT=$(mktemp /tmp/setup_server_auto_refresh_XXXXXX.exp)
cat > "$TEMP_EXPECT" <<EXPECT_EOF
#!/usr/bin/expect -f
set timeout 60
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
        
        # Check if cron job already exists
        send "crontab -l 2>/dev/null | grep -q 'refresh_cookies_server' && echo 'CRON_EXISTS' || echo 'CRON_NOT_EXISTS'\r"
        expect {
            "CRON_EXISTS" {
                send "echo 'Cron job already exists'\r"
                exp_continue
            }
            "CRON_NOT_EXISTS" {
                send "echo 'Cron job not found - will create'\r"
                exp_continue
            }
        }
        expect "# "
        
        # Create cron job to run refresh script every 6 hours
        send "(crontab -l 2>/dev/null; echo '0 */6 * * * cd $SERVER_PATH && bash refresh_cookies_server.sh >> /var/log/cookie-refresh.log 2>&1') | crontab -\r"
        expect "# "
        
        # Verify cron job was added
        send "crontab -l | grep 'refresh_cookies_server'\r"
        expect "# "
        
        send "echo 'Setup complete!'\r"
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
    echo "=========================================="
    echo "✅ Auto-refresh configured on server!"
    echo "=========================================="
    echo ""
    echo "Cron job will run every 6 hours on the server."
    echo ""
    echo "To view cron jobs on server:"
    echo "  ssh $SERVER_USER@$SERVER_IP 'crontab -l'"
    echo ""
    echo "To test now:"
    echo "  ./scripts/refresh_cookies_server.sh"
else
    echo ""
    echo "❌ Error setting up auto-refresh"
    exit 1
fi
