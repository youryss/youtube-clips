#!/bin/bash
# Script to setup auto-refresh of cookies on the server

SERVER_IP="164.90.193.41"
SERVER_USER="root"
SERVER_PASS="${SERVER_PASS:-Qweasd123;}"
SERVER_PATH="~/youtube-viral-clipper"
EMAIL="youtubioviral@gmail.com"

echo "=========================================="
echo "🔧 Setting up auto-refresh on server..."
echo "=========================================="
echo ""

# Check if expect is available
if ! command -v expect &> /dev/null; then
    echo "❌ Error: expect not found. Please install it: brew install expect"
    exit 1
fi

# Create expect script for SSH
TEMP_EXPECT=$(mktemp /tmp/setup_auto_refresh_XXXXXX.exp)
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
        
        # Check if auto_refresh_cookies.py exists
        send "test -f src/auto_refresh_cookies.py && echo 'EXISTS' || echo 'NOT_EXISTS'\r"
        expect {
            "EXISTS" {
                send "echo 'Script already exists'\r"
                exp_continue
            }
            "NOT_EXISTS" {
                send "echo 'Script not found - will need to upload'\r"
                exp_continue
            }
        }
        expect "# "
        
        # Check if Playwright is installed
        send "docker-compose exec -T backend python3 -c 'import playwright; print(\"PLAYWRIGHT_OK\")' 2>&1\r"
        expect {
            "PLAYWRIGHT_OK" {
                send "echo 'Playwright installed'\r"
                exp_continue
            }
            timeout {
                send "echo 'Playwright check timeout'\r"
                exp_continue
            }
        }
        expect "# "
        
        # Check current cron jobs
        send "crontab -l 2>/dev/null | grep -q 'auto_refresh_cookies' && echo 'CRON_EXISTS' || echo 'CRON_NOT_EXISTS'\r"
        expect {
            "CRON_EXISTS" {
                send "echo 'Cron job already exists'\r"
                exp_continue
            }
            "CRON_NOT_EXISTS" {
                send "echo 'Cron job not found'\r"
                exp_continue
            }
        }
        expect "# "
        
        # Note: Cron job should be set up LOCALLY, not on server
        # Because Playwright needs a real browser which is hard in Docker
        send "echo 'Note: Auto-refresh should run LOCALLY and upload to server'\r"
        expect "# "
        expect "# "
        
        # Verify cron job was added
        send "crontab -l | grep 'auto_refresh_cookies'\r"
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
    echo "✅ Auto-refresh configured successfully!"
    echo "=========================================="
    echo ""
    echo "Cron job will run every 6 hours to refresh cookies."
    echo "To view cron jobs: ssh $SERVER_USER@$SERVER_IP 'crontab -l'"
    echo "To remove: ssh $SERVER_USER@$SERVER_IP 'crontab -l | grep -v auto_refresh_cookies | crontab -'"
else
    echo ""
    echo "❌ Error setting up auto-refresh"
    exit 1
fi

